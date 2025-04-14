from flask import request
from flask_restful import Resource
from flask_jwt_extended import jwt_required, get_jwt_identity
from database import db
from models import Event, User, Category, EventCategory, Organizer, TicketType
from utils.response import success_response, error_response, paginate_response
from utils.auth import organizer_required, admin_required
from datetime import datetime
import cloudinary.uploader
import json
from redis_client import redis_client

ALLOWED_EXTENSIONS = {'png', 'jpg', 'jpeg', 'gif', 'webp'}
MAX_FILE_SIZE = 5 * 1024 * 1024  # 5MB

def allowed_file(filename):
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS

class EventListResource(Resource):
    def get(self):
        # Generate cache key based on query parameters
        cache_key = f"events:all:{request.query_string.decode()}"
        
        # Try to get cached data
        cached_data = redis_client.get_cached_events(cache_key)
        if cached_data:
            return cached_data
            
        category = request.args.get('category')
        search = request.args.get('search')
        start_date = request.args.get('start_date')
        end_date = request.args.get('end_date')
        organizer_id = request.args.get('organizer_id')
        location = request.args.get('location')
        
        query = Event.query
        
        if category:
            query = query.join(EventCategory).join(Category).filter(Category.name == category)
            
        if search:
            search_term = f"%{search}%"
            # Enhanced search across multiple fields with case-insensitive matching
            query = query.filter(
                db.or_(
                    Event.title.ilike(search_term),
                    Event.location.ilike(search_term),
                )
            )
            
        if start_date:
            try:
                start_date = datetime.fromisoformat(start_date.replace('Z', '+00:00'))
                query = query.filter(Event.start_datetime >= start_date)
            except ValueError:
                return error_response("Invalid start_date format")
                
        if end_date:
            try:
                end_date = datetime.fromisoformat(end_date.replace('Z', '+00:00'))
                query = query.filter(Event.end_datetime <= end_date)
            except ValueError:
                return error_response("Invalid end_date format")
                
        if organizer_id:
            query = query.filter(Event.organizer_id == organizer_id)
            
        if location:
            print(f"Filtering events by location: {location}")  # Debug log
            location_term = f"%{location}%"
            query = query.filter(Event.location.ilike(location_term))
            print(f"SQL Query: {str(query)}")  # Debug log
            
        # Sort by start date
        query = query.order_by(Event.start_datetime)
        
        # Get paginated results
        result = paginate_response(query)
        
        # Cache the results
        redis_client.set_cached_events(cache_key, result)
        
        return result
    
    @jwt_required()
    def post(self):
        """Create a new event (admin or organizer only)"""
        current_user_id = get_jwt_identity()
        
        # Ensure the request is processed as form data
        data = request.form.to_dict()
        
        # Handle file upload if present
        if 'file' in request.files:
            file = request.files['file']
            if file.filename != '' and allowed_file(file.filename):
                # Upload to Cloudinary
                upload_result = cloudinary.uploader.upload(file)
                data['image'] = upload_result['secure_url']
        
        user = User.query.get(current_user_id)
        
        # Check if the user is an admin
        is_admin = user.has_role('admin')
        
        # If organizer_id is provided and user is admin, use that
        if is_admin and 'organizer_id' in data:
            organizer_id = data['organizer_id']
            organizer = Organizer.query.get(organizer_id)
            if not organizer:
                return error_response("Specified organizer not found", 404)
        else:
            # Otherwise, use the current user's organizer account
            organizer = Organizer.query.filter_by(user_id=current_user_id).first()
            if not organizer:
                return error_response("User is not registered as an organizer", 403)
            organizer_id = organizer.id

        required_fields = ['title', 'start_datetime', 'location', 'ticket_types']
        for field in required_fields:
            if field not in data:
                return error_response(f"Missing required field: {field}")
                
        # Parse dates
        try:
            start_datetime = datetime.fromisoformat(data['start_datetime'].replace('Z', '+00:00'))
            end_datetime = None
            if 'end_datetime' in data and data['end_datetime']:
                end_datetime = datetime.fromisoformat(data['end_datetime'].replace('Z', '+00:00'))
        except ValueError:
            return error_response("Invalid datetime format")
        
        # Convert 'featured' to a boolean
        featured = data.get('featured', 'false').lower() in ['true', '1', 'yes']
            
        # Create new event
        new_event = Event(
            organizer_id=organizer_id,
            title=data['title'],
            description=data.get('description'),
            start_datetime=start_datetime,
            end_datetime=end_datetime,
            location=data['location'],
            currency=data.get('currency', 'KES'),
            image=data.get('image'),
            featured=featured
        )
        
        # Add ticket types if provided
        total_tickets = 0
        if 'ticket_types' in data:
            ticket_types = json.loads(data['ticket_types'])
            for ticket_type_data in ticket_types:
                ticket_type = TicketType(
                    event_id=new_event.id,
                    name=ticket_type_data['name'],
                    price=ticket_type_data['price'],
                    quantity=ticket_type_data.get('quantity', 0),  # Default to 0 if not provided
                    description=ticket_type_data.get('description'),
                    currency=data.get('currency', 'KES')
                )
                
                # Optional valid_from and valid_to fields
                if 'valid_from' in ticket_type_data and ticket_type_data['valid_from']:
                    ticket_type.valid_from = datetime.fromisoformat(ticket_type_data['valid_from'].replace('Z', '+00:00'))
                
                if 'valid_to' in ticket_type_data and ticket_type_data['valid_to']:
                    ticket_type.valid_to = datetime.fromisoformat(ticket_type_data['valid_to'].replace('Z', '+00:00'))
                
                new_event.ticket_types.append(ticket_type)
                total_tickets += ticket_type.quantity
        
        new_event.total_tickets = total_tickets

        # Add categories if provided
        if 'categories' in data:
            category_ids = json.loads(data['categories'])
            for category_id in category_ids:
                category = Category.query.get(category_id)
                if category:
                    new_event.categories.append(category)
        
        try:
            db.session.add(new_event)
            db.session.commit()
            
            return success_response(
                data=new_event.to_dict(include_organizer=True),
                message="Event created successfully",
                status_code=201
            )
        except Exception as e:
            db.session.rollback()
            return error_response(f"Error creating event: {str(e)}")

    def upload_event_image(self, file):
        if file and allowed_file(file.filename):
            upload_result = cloudinary.uploader.upload(file)
            return upload_result['secure_url']
        return None

class EventResource(Resource):
    def get(self, event_id):
        # Try to get cached event
        cache_key = f"event:{event_id}"
        cached_data = redis_client.get_cached_events(cache_key)
        if cached_data:
            return cached_data
            
        event = Event.query.get(event_id)
        
        if not event:
            return error_response("Event not found", 404)
            
        result = success_response(data=event.to_dict(include_organizer=True))
        
        # Cache the result
        redis_client.set_cached_events(cache_key, result)
        
        return result
    
    @jwt_required()
    def put(self, event_id):
        """Update an existing event (admin or organizer only)"""
        current_user_id = get_jwt_identity()
        event = Event.query.get(event_id)

        if not event:
            return error_response("Event not found", 404)

        user = User.query.get(current_user_id)
        is_admin = user.has_role('admin')
        organizer = Organizer.query.filter_by(user_id=current_user_id).first()

        if not (organizer and organizer.id == event.organizer_id) and not is_admin:
            return error_response("Unauthorized", 403)

        data = request.get_json()

        # Update fields if provided
        if 'title' in data:
            event.title = data['title']
            
        if 'description' in data:
            event.description = data['description']
            
        if 'start_datetime' in data:
            try:
                event.start_datetime = datetime.fromisoformat(data['start_datetime'].replace('Z', '+00:00'))
            except ValueError:
                return error_response("Invalid start_datetime format")
                
        if 'end_datetime' in data:
            try:
                if data['end_datetime']:
                    event.end_datetime = datetime.fromisoformat(data['end_datetime'].replace('Z', '+00:00'))
                else:
                    event.end_datetime = None
            except ValueError:
                return error_response("Invalid end_datetime format")
                
        if 'location' in data:
            event.location = data['location']
            
        if 'currency' in data:
            event.currency = data['currency']
            
        if 'image' in data:
            event.image = data['image']
            
        if 'featured' in data and user.has_role('admin'):  # Only admins can set featured
            event.featured = data['featured']
            
        # Update ticket types if provided
        if 'ticket_types' in data and isinstance(data['ticket_types'], list):
            # Clear existing ticket types
            event.ticket_types = []
            
            # Add new ticket types
            for ticket_type_data in data['ticket_types']:
                ticket_type = TicketType(
                    event_id=event.id,
                    name=ticket_type_data['name'],
                    price=ticket_type_data['price'],
                    quantity=ticket_type_data['quantity'],
                    description=ticket_type_data.get('description'),
                    currency=event.currency
                )
                
                # Optional valid_from and valid_to fields
                if 'valid_from' in ticket_type_data:
                    ticket_type.valid_from = datetime.fromisoformat(ticket_type_data['valid_from'].replace('Z', '+00:00'))
                
                if 'valid_to' in ticket_type_data:
                    ticket_type.valid_to = datetime.fromisoformat(ticket_type_data['valid_to'].replace('Z', '+00:00'))
                
                event.ticket_types.append(ticket_type)
        
        try:
            db.session.commit()
            # Invalidate cache for this event and all events
            redis_client.invalidate_event_cache(event_id)
            return success_response(
                data=event.to_dict(include_organizer=True),
                message="Event updated successfully"
            )
        except Exception as e:
            db.session.rollback()
            return error_response(f"Error updating event: {str(e)}")
    
    @jwt_required()
    def delete(self, event_id):
        current_user_id = get_jwt_identity()
        event = Event.query.get(event_id)
        
        if not event:
            return error_response("Event not found", 404)
            
        # Check if user is the event organizer or an admin
        user = User.query.get(current_user_id)
        organizer = Organizer.query.filter_by(user_id=current_user_id).first()
        
        if not (organizer and organizer.id == event.organizer_id) and not user.has_role('admin'):
            return error_response("Unauthorized", 403)
            
        try:
            db.session.delete(event)
            db.session.commit()
            # Invalidate cache for this event and all events
            redis_client.invalidate_event_cache(event_id)
            return success_response(message="Event deleted successfully")
        except Exception as e:
            db.session.rollback()
            return error_response(f"Error deleting event: {str(e)}")

class EventCategoriesResource(Resource):
    def get(self, event_id):
        """Get categories for a specific event"""
        event = Event.query.get(event_id)
        
        if not event:
            return error_response("Event not found", 404)
            
        return success_response(data=[category.to_dict() for category in event.categories])
    
    @jwt_required()
    def post(self, event_id):
        """Add a category to an event"""
        current_user_id = get_jwt_identity()
        event = Event.query.get(event_id)
        
        if not event:
            return error_response("Event not found", 404)
            
        # Check if user is the event organizer or an admin
        user = User.query.get(current_user_id)
        organizer = Organizer.query.filter_by(user_id=current_user_id).first()
        
        if not (organizer and organizer.id == event.organizer_id) and not user.has_role('admin'):
            return error_response("Unauthorized", 403)
            
        data = request.get_json()
        
        if 'category_id' not in data:
            return error_response("Missing category_id field")
            
        category = Category.query.get(data['category_id'])
        
        if not category:
            return error_response("Category not found", 404)
            
        if category in event.categories:
            return error_response("Event already has this category")
            
        event.categories.append(category)
        
        try:
            db.session.commit()
            return success_response(
                data=[category.to_dict() for category in event.categories],
                message="Category added successfully"
            )
        except Exception as e:
            db.session.rollback()
            return error_response(f"Error adding category: {str(e)}")

class FeaturedEventsResource(Resource):
    """
    Resource for fetching featured events
    """
    def get(self):
        """Get featured events"""
        # Get start_date from query params
        start_date = request.args.get('start_date')
        
        # Generate cache key based on start_date
        cache_key = f"events:featured:{start_date if start_date else 'all'}"
        cached_data = redis_client.get_cached_events(cache_key)
        if cached_data:
            return cached_data
            
        # Build query
        query = Event.query.filter_by(featured=True)
        
        # Apply start_date filter if provided
        if start_date:
            try:
                start_date = datetime.fromisoformat(start_date.replace('Z', '+00:00'))
                query = query.filter(Event.start_datetime >= start_date)
            except ValueError:
                return error_response("Invalid start_date format")
        
        # Get and sort events
        featured_events = query.order_by(Event.start_datetime).all()
        result = success_response(data=[event.to_dict() for event in featured_events])
        
        # Cache the result
        redis_client.set_cached_events(cache_key, result)
        
        return result