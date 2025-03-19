from flask import request
from flask_restful import Resource
from flask_jwt_extended import jwt_required, get_jwt_identity
from app import db
from models import Event, User, Category, EventCategory, Organizer
from utils.response import success_response, error_response, paginate_response
from utils.auth import organizer_required, Admin_required
from datetime import datetime

class EventListResource(Resource):
    def get(self):
        category = request.args.get('category')
        search = request.args.get('search')
        start_date = request.args.get('start_date')
        end_date = request.args.get('end_date')
        organizer_id = request.args.get('organizer_id')
        
        query = Event.query
        
        if category:
            query = query.join(EventCategory).join(Category).filter(Category.name == category)
            
        if search:
            search_term = f"%{search}%"
            query = query.filter(Event.title.like(search_term) | Event.description.like(search_term))
            
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
            
        # Sort by start date
        query = query.order_by(Event.start_datetime)
        
        # Return paginated results
        return paginate_response(query)
    
    @jwt_required()
    @Admin_required
    def post(self):
        """Create a new event (organizer only)"""
        current_user_id = get_jwt_identity()
        data = request.get_json()
        
        user = User.query.get(current_user_id)
        organizer = Organizer.query.filter_by(user_id=current_user_id).first()
        
        if not organizer:
            return error_response("User is not registered as an organizer", 403)
            
        required_fields = ['title', 'start_datetime', 'location', 'price', 'total_tickets']
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
            
        # Create new event
        new_event = Event(
            organizer_id=organizer.id,
            title=data['title'],
            description=data.get('description'),
            start_datetime=start_datetime,
            end_datetime=end_datetime,
            location=data['location'],
            price=data['price'],
            currency=data.get('currency', 'KES'),
            image=data.get('image'),
            featured=data.get('featured', False),
            total_tickets=data['total_tickets'],
            tickets_sold=0
        )
        
        # Add categories if provided
        if 'categories' in data and isinstance(data['categories'], list):
            for category_id in data['categories']:
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


class EventResource(Resource):
    def get(self, event_id):
        event = Event.query.get(event_id)
        
        if not event:
            return error_response("Event not found", 404)
            
        return success_response(data=event.to_dict(include_organizer=True))
    
    @jwt_required()
    def put(self, event_id):
        current_user_id = get_jwt_identity()
        event = Event.query.get(event_id)
        
        if not event:
            return error_response("Event not found", 404)
            
        # Check if user is the event organizer or an Admin
        user = User.query.get(current_user_id)
        organizer = Organizer.query.filter_by(user_id=current_user_id).first()
        
        if not (organizer and organizer.id == event.organizer_id) and not user.has_role('Admin'):
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
            
        if 'price' in data:
            event.price = data['price']
            
        if 'currency' in data:
            event.currency = data['currency']
            
        if 'image' in data:
            event.image = data['image']
            
        if 'featured' in data and user.has_role('Admin'):  # Only Admins can set featured
            event.featured = data['featured']
            
        if 'total_tickets' in data:
            if data['total_tickets'] < event.tickets_sold:
                return error_response("Total tickets cannot be less than tickets sold")
            event.total_tickets = data['total_tickets']
            
        # Update categories if provided
        if 'categories' in data and isinstance(data['categories'], list):
            # Clear existing categories
            event.categories = []
            
            # Add new categories
            for category_id in data['categories']:
                category = Category.query.get(category_id)
                if category:
                    event.categories.append(category)
                    
        try:
            db.session.commit()
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
            
        # Check if user is the event organizer or an Admin
        user = User.query.get(current_user_id)
        organizer = Organizer.query.filter_by(user_id=current_user_id).first()
        
        if not (organizer and organizer.id == event.organizer_id) and not user.has_role('Admin'):
            return error_response("Unauthorized", 403)
            
        try:
            db.session.delete(event)
            db.session.commit()
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
            
        # Check if user is the event organizer or an Admin
        user = User.query.get(current_user_id)
        organizer = Organizer.query.filter_by(user_id=current_user_id).first()
        
        if not (organizer and organizer.id == event.organizer_id) and not user.has_role('Admin'):
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
        featured_events = Event.query.filter_by(featured=True).order_by(Event.start_datetime).all()
        
        return success_response(data=[event.to_dict() for event in featured_events])