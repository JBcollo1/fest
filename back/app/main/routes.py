from app.main import bp
from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from app.models import Events, Categories, EventCategories, Organizers, Users, db
from app.utils import role_required
from datetime import datetime
from sqlalchemy import or_, and_

@bp.route('/')
def main():
  return "Hello API"

@bp.route('/index')
def index():
  return {
    1 : "Hello",
    2 : "api"
  }



@bp.route('', methods=['GET'])
def get_events():
    """Get all events with optional filtering"""
    page = request.args.get('page', 1, type=int)
    per_page = request.args.get('per_page', 10, type=int)
    search = request.args.get('search', '')
    category = request.args.get('category', '')
    start_date = request.args.get('start_date', '')
    end_date = request.args.get('end_date', '')
    featured = request.args.get('featured', None)
    organizer_id = request.args.get('organizer_id', '')
    
    # Build query
    query = Event.query
    
    # Apply filters
    if search:
        query = query.filter(or_(
            Events.title.ilike(f'%{search}%'),
            Events.description.ilike(f'%{search}%'),
            Events.location.ilike(f'%{search}%')
        ))
    
    if category:
        query = query.join(EventCategories).join(Categories).filter(Categories.name == category)
    
    if start_date:
        try:
            start = datetime.strptime(start_date, '%Y-%m-%d')
            query = query.filter(Events.start_datetime >= start)
        except ValueError:
            pass
    
    if end_date:
        try:
            end = datetime.strptime(end_date, '%Y-%m-%d')
            query = query.filter(Events.start_datetime <= end)
        except ValueError:
            pass
    
    if featured is not None:
        featured_bool = featured.lower() == 'true'
        query = query.filter(Events.featured == featured_bool)
    
    if organizer_id:
        query = query.filter(Events.organizer_id == organizer_id)
    
    # Add sorting - newest first
    query = query.order_by(Events.start_datetime.asc())
    
    # Paginate
    events_page = query.paginate(page=page, per_page=per_page, error_out=False)
    
    # Format response
    events_data = [event.to_dict() for event in events_page.items]
    
    return jsonify({
        'events': events_data,
        'pagination': {
            'total': events_page.total,
            'pages': events_page.pages,
            'page': page,
            'per_page': per_page,
            'next': events_page.next_num,
            'prev': events_page.prev_num
        }
    }), 200

@bp.route('/<event_id>', methods=['GET'])
def get_event(event_id):
    """Get a specific event by ID"""
    event = Event.query.get(event_id)
    
    if not event:
        return jsonify({'error': 'Event not found'}), 404
    
    return jsonify(event.to_dict()), 200

@bp.route('/featured', methods=['GET'])
def get_featured_events():
    """Get featured events"""
    limit = request.args.get('limit', 6, type=int)
    
    featured_events = Event.query.filter_by(featured=True).order_by(Events.start_datetime.asc()).limit(limit).all()
    
    return jsonify({
        'featured_events': [event.to_dict() for event in featured_events]
    }), 200

@bp.route('/upcoming', methods=['GET'])
def get_upcoming_events():
    """Get upcoming events"""
    limit = request.args.get('limit', 6, type=int)
    now = datetime.utcnow()
    
    upcoming_events = Event.query.filter(Events.start_datetime > now).order_by(Events.start_datetime.asc()).limit(limit).all()
    
    return jsonify({
        'upcoming_events': [event.to_dict() for event in upcoming_events]
    }), 200

@bp.route('', methods=['POST'])
@role_required('organizer')
def create_event():
    """Create a new event"""
    data = request.get_json()
    current_user_id = get_jwt_identity()
    
    # Check required fields
    required_fields = ['title', 'start_datetime', 'location', 'price', 'total_tickets']
    for field in required_fields:
        if not data.get(field):
            return jsonify({'error': f'{field} is required'}), 400
    
    # Get organizer ID
    organizer = Organizer.query.filter_by(user_id=current_user_id).first()
    if not organizer:
        return jsonify({'error': 'You must be an organizer to create events'}), 403
    
    # Parse date times
    try:
        start_datetime = datetime.fromisoformat(data['start_datetime'].replace('Z', '+00:00'))
        end_datetime = None
        if data.get('end_datetime'):
            end_datetime = datetime.fromisoformat(data['end_datetime'].replace('Z', '+00:00'))
    except ValueError:
        return jsonify({'error': 'Invalid datetime format. Use ISO format (YYYY-MM-DDTHH:MM:SS.sssZ)'}), 400
    
    # Create event
    new_event = Events(
        organizer_id=organizer.id,
        title=data['title'],
        description=data.get('description', ''),
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
    
    db.session.add(new_event)
    db.session.commit()  # Commit to get event.id
    
    # Add categories if provided
    if data.get('categories'):
        for category_name in data['categories']:
            # Get or create category
            category = Category.query.filter_by(name=category_name).first()
            if not category:
                category = Categories(name=category_name)
                db.session.add(category)
                db.session.commit()  # Commit to get category.id
            
            # Link category to event
            event_category = EventCategories(event_id=new_event.id, category_id=category.id)
            db.session.add(event_category)
        
        db.session.commit()
    
    return jsonify({
        'message': 'Event created successfully',
        'event': new_event.to_dict()
    }), 201


@bp.route('/<event_id>', methods=['PUT', 'PATCH'])
@role_required('organizer')
def update_event(event_id):
    """Update an existing event"""
    data = request.get_json()
    current_user_id = get_jwt_identity()
    
    # Get event
    event = Event.query.get(event_id)
    if not event:
        return jsonify({'error': 'Event not found'}), 404
    
    # Check if user is the organizer of this event
    organizer = Organizer.query.filter_by(user_id=current_user_id).first()
    if not organizer or organizer.id != event.organizer_id:
        return jsonify({'error': 'You do not have permission to update this event'}), 403
    
    # Update fields
    if 'title' in data:
        event.title = data['title']
    if 'description' in data:
        event.description = data['description']
    if 'location' in data:
        event.location = data['location']
    if 'price' in data:
        event.price = data['price']
    if 'currency' in data:
        event.currency = data['currency']
    if 'image' in data:
        event.image = data['image']
    if 'featured' in data:
        event.featured = data['featured']
    if 'total_tickets' in data:
        # Can only increase total tickets, not decrease below tickets_sold
        if int(data['total_tickets']) < event.tickets_sold:
            return jsonify({'error': 'Total tickets cannot be less than tickets already sold'}), 400
        event.total_tickets = data['total_tickets']
    
    # Parse and update dates
    if 'start_datetime' in data:
        try:
            event.start_datetime = datetime.fromisoformat(data['start_datetime'].replace('Z', '+00:00'))
        except ValueError:
            return jsonify({'error': 'Invalid start_datetime format. Use ISO format (YYYY-MM-DDTHH:MM:SS.sssZ)'}), 400
    
    if 'end_datetime' in data:
        if data['end_datetime']:
            try:
                event.end_datetime = datetime.fromisoformat(data['end_datetime'].replace('Z', '+00:00'))
            except ValueError:
                return jsonify({'error': 'Invalid end_datetime format. Use ISO format (YYYY-MM-DDTHH:MM:SS.sssZ)'}), 400
        else:
            event.end_datetime = None
    
    # Update categories if provided
    if 'categories' in data:
        # Remove existing categories
        EventCategory.query.filter_by(event_id=event.id).delete()
        
        # Add new categories
        for category_name in data['categories']:
            # Get or create category
            category = Category.query.filter_by(name=category_name).first()
            if not category:
                category = Categories(name=category_name)
                db.session.add(category)
                db.session.commit()  # Commit to get category.id
            
            # Link category to event
            event_category = EventCategories(event_id=event.id, category_id=category.id)
            db.session.add(event_category)
    
    # Update timestamp
    event.updated_at = datetime.utcnow()
    
    db.session.commit()
    
    return jsonify({
        'message': 'Event updated successfully',
        'event': event.to_dict()
    }), 200

@bp.route('/<event_id>', methods=['DELETE'])
@role_required('organizer')
def delete_event(event_id):
    """Delete an event"""
    current_user_id = get_jwt_identity()
    
    # Get event
    event = Event.query.get(event_id)
    if not event:
        return jsonify({'error': 'Event not found'}), 404
    
    # Check if user is the organizer of this event
    organizer = Organizer.query.filter_by(user_id=current_user_id).first()
    if not organizer or organizer.id != event.organizer_id:
        return jsonify({'error': 'You do not have permission to delete this event'}), 403
    
    # Check if tickets have been sold
    if event.tickets_sold > 0:
        return jsonify({'error': 'Cannot delete event with sold tickets'}), 400
    
    # Delete event categories first
    EventCategory.query.filter_by(event_id=event.id).delete()
    
    # Delete event
    db.session.delete(event)
    db.session.commit()
    
    return jsonify({
        'message': 'Event deleted successfully'
    }), 200

@bp.route('/organizer', methods=['GET'])
@role_required('organizer')
def get_organizer_events():
    """Get events created by the current organizer"""
    current_user_id = get_jwt_identity()
    page = request.args.get('page', 1, type=int)
    per_page = request.args.get('per_page', 10, type=int)
    
    # Get organizer
    organizer = Organizer.query.filter_by(user_id=current_user_id).first()
    if not organizer:
        return jsonify({'error': 'Organizer profile not found'}), 404
    
    # Get events
    events_page = Event.query.filter_by(organizer_id=organizer.id)\
        .order_by(Events.created_at.desc())\
        .paginate(page=page, per_page=per_page, error_out=False)
    
    # Format response
    events_data = [event.to_dict() for event in events_page.items]
    
    return jsonify({
        'events': events_data,
        'pagination': {
            'total': events_page.total,
            'pages': events_page.pages,
            'page': page,
            'per_page': per_page,
            'next': events_page.next_num,
            'prev': events_page.prev_num
        }
    }), 200

    
def generate_qr_code(ticket_id):
    """Generate QR code for ticket verification"""
    qr = qrcode.QRCode(
        version=1,
        error_correction=qrcode.constants.ERROR_CORRECT_L,
        box_size=10,
        border=4,
    )
    qr.add_data(ticket_id)
    qr.make(fit=True)
    
    img = qr.make_image(fill_color="black", back_color="white")
    
    # Convert to base64 for storage
    buffer = io.BytesIO()
    img.save(buffer, format="PNG")
    return f"data:image/png;base64,{base64.b64encode(buffer.getvalue()).decode('utf-8')}"

@tickets_bp.route('', methods=['POST'])
@jwt_required()
def purchase_ticket():
    """Purchase a ticket for an event"""
    data = request.get_json()
    current_user_id = get_jwt_identity()
    
    # Check required fields
    required_fields = ['event_id', 'payment_method', 'transaction_id']
    for field in required_fields:
        if not data.get(field):
            return jsonify({'error': f'{field} is required'}), 400
    
    # Get event
    event = Event.query.get(data['event_id'])
    if not event:
        return jsonify({'error': 'Event not found'}), 404
    
    # Check if event has available tickets
    if event.tickets_sold >= event.total_tickets:
        return jsonify({'error': 'Event is sold out'}), 400
    
    # Check if event has started
    if event.start_datetime < datetime.utcnow():
        return jsonify({'error': 'Event has already started, tickets no longer available'}), 400
    
    # Get attendee profile
    attendee = Attendee.query.filter_by(user_id=current_user_id).first()
    if not attendee:
        return jsonify({'error': 'Attendee profile not found'}), 404
    
    # Check if user already has a ticket for this event
    existing_ticket = Ticket.query.filter_by(event_id=event.id, attendee_id=attendee.id).first()
    if existing_ticket:
        return jsonify({'error': 'You already have a ticket for this event'}), 400
    
    # Apply discount if code provided
    price = event.price
    if data.get('discount_code'):
        # This would involve checking the discount code validity
        # For now, we'll just use the event price
        pass
    
    # Create ticket
    ticket = Tickets(
        event_id=event.id,
        attendee_id=attendee.id,
        price=price,
        currency=event.currency
    )
    
    db.session.add(ticket)
    db.session.commit()  # Commit to get ticket.id
    
    # Generate QR code
    qr_code = generate_qr_code(ticket.id)
    ticket.qr_code = qr_code
    
    # Create payment record
    payment = Payments(
        ticket_id=ticket.id,
        payment_method=data['payment_method'],
        payment_status='Completed',  # Assume payment is completed for simplicity
        transaction_id=data['transaction_id'],
        amount=price,
        currency=event.currency
    )
    
    db.session.add(payment)
    
    # Update tickets sold count
    event.tickets_sold += 1
    
    db.session.commit()
    
    return jsonify({
        'message': 'Ticket purchased successfully',
        'ticket': ticket.to_dict(),
        'payment': payment.to_dict(),
        'event': event.to_dict()
    }), 201

@tickets_bp.route('', methods=['GET'])
@jwt_required()
def get_user_tickets():
    """Get tickets purchased by the current user"""
    current_user_id = get_jwt_identity()
    page = request.args.get('page', 1, type=int)
    per_page = request.args.get('per_page', 10, type=int)
    
    # Get attendee profile
    attendee = Attendee.query.filter_by(user_id=current_user_id).first()
    if not attendee:
        return jsonify({'error': 'Attendee profile not found'}), 404
    
    # Get tickets
    tickets_page = Ticket.query.filter_by(attendee_id=attendee.id)\
        .join(Events)\
        .order_by(Events.start_datetime.desc())\
        .paginate(page=page, per_page=per_page, error_out=False)
    
    # Format response with event details
    tickets_data = []
    for ticket in tickets_page.items:
        ticket_data = ticket.to_dict()
        event = Event.query.get(ticket.event_id)
        ticket_data['event'] = event.to_dict()
        
        # Add payment status
        payment = Payment.query.filter_by(ticket_id=ticket.id).first()
        if payment:
            ticket_data['payment_status'] = payment.payment_status
        else:
            ticket_data['payment_status'] = 'Unknown'
            
        tickets_data.append(ticket_data)
    
    return jsonify({
        'tickets': tickets_data,
        'pagination': {
            'total': tickets_page.total,
            'pages': tickets_page.pages,
            'page': page,
            'per_page': per_page,
            'next': tickets_page.next_num,
            'prev': tickets_page.prev_num
        }
    }), 200

@tickets_bp.route('/<ticket_id>', methods=['GET'])
@jwt_required()
def get_ticket(ticket_id):
    """Get a specific ticket by ID"""
    current_user_id = get_jwt_identity()
    
    # Get ticket
    ticket = Ticket.query.get(ticket_id)
    if not ticket:
        return jsonify({'error': 'Ticket not found'}), 404
    
    # Check if user owns the ticket or is the event organizer
    attendee = Attendee.query.filter_by(user_id=current_user_id).first()
    if attendee and attendee.id == ticket.attendee_id:
        # User owns the ticket
        pass
    else:
        # Check if user is the event organizer
        event = Event.query.get(ticket.event_id)
        if not event:
            return jsonify({'error': 'Event not found'}), 404
            
        organizer = User.query.join(Organizers).filter(
            Organizers.id == event.organizer_id,
            Users.id == current_user_id
        ).first()
        
        if not organizer:
            return jsonify({'error': 'You do not have permission to view this ticket'}), 403
    
    # Get event and payment details
    event = Event.query.get(ticket.event_id)
    payment = Payment.query.filter_by(ticket_id=ticket.id).first()
    
    ticket_data = ticket.to_dict()
    ticket_data['event'] = event.to_dict()
    if payment:
        ticket_data['payment'] = payment.to_dict()
    
    return jsonify(ticket_data), 200

@tickets_bp.route('/event/<event_id>', methods=['GET'])
@role_required('organizer')
def get_event_tickets(event_id):
    """Get all tickets for a specific event (organizer only)"""
    current_user_id = get_jwt_identity()
    page = request.args.get('page', 1, type=int)
    per_page = request.args.get('per_page', 20, type=int)
    
    # Get event
    event = Event.query.get(event_id)
    if not event:
        return jsonify({'error': 'Event not found'}), 404
    
    # Check if user is the organizer of this event
    organizer = User.query.join(Organizers).filter(
        Organizers.id == event.organizer_id,
        Users.id == current_user_id
    ).first()
    
    if not organizer:
        return jsonify({'error': 'You do not have permission to view these tickets'}), 403
    
    # Get tickets
    tickets_page = Ticket.query.filter_by(event_id=event.id)\
        .paginate(page=page, per_page=per_page, error_out=False)
    
    # Format response with attendee details
    tickets_data = []
    for ticket in tickets_page.items:
        ticket_data = ticket.to_dict()
        
        # Add attendee info
        attendee = Attendee.query.get(ticket.attendee_id)
        user = User.query.get(attendee.user_id)
        ticket_data['attendee'] = {
            'id': attendee.id,
            'user_id': user.id,
            'name': f"{user.first_name} {user.last_name}",
            'email': user.email,
            'phone': user.phone
        }
        
        # Add payment status
        payment = Payment.query.filter_by(ticket_id=ticket.id).first()
        if payment:
            ticket_data['payment'] = payment.to_dict()
            
        tickets_data.append(ticket_data)
    
    return jsonify({
        'event': event.to_dict(),
        'tickets': tickets_data,
        'pagination': {
            'total': tickets_page.total,
            'pages': tickets_page.pages,
            'page': page,
            'per_page': per_page,
            'next': tickets_page.next_num,
            'prev': tickets_page.prev_num
        }
    }), 200


"""


Payment

"""

@payments_bp.route('/verify', methods=['POST'])
@jwt_required()
def verify_payment():
    """Verify a payment after processing"""
    data = request.get_json()
    
    # Check required fields
    required_fields = ['ticket_id', 'transaction_id']
    for field in required_fields:
        if not data.get(field):
            return jsonify({'error': f'{field} is required'}), 400
    
    # Get payment
    payment = Payment.query.filter_by(ticket_id=data['ticket_id']).first()
    if not payment:
        return jsonify({'error': 'Payment not found for this ticket'}), 404
    
    # Update transaction ID and status
    payment.transaction_id = data['transaction_id']
    payment.payment_status = 'Completed'
    
    db.session.commit()
    
    return jsonify({
        'message': 'Payment verified successfully',
        'payment': payment.to_dict()
    }), 200

@payments_bp.route('/report/<event_id>', methods=['GET'])
@role_required('organizer')
def get_payment_report(event_id):
    """Get payment report for an event (organizer only)"""
    current_user_id = get_jwt_identity()
    
    # Get event
    event = Event.query.get(event_id)
    if not event:
        return jsonify({'error': 'Event not found'}), 404
    
    # Check if user is the organizer of this event
    organizer = User.query.join(Organizers).filter(
        Organizers.id == event.organizer_id,
        Users.id == current_user_id
    ).first()
    
    if not organizer:
        return jsonify({'error': 'You do not have permission to view this report'}), 403
    
    # Get all payments for the event
    payments = db.session.query(Payments)\
        .join(Tickets, Tickets.id == Payments.ticket_id)\
        .filter(Tickets.event_id == event_id)\
        .all()
    
    # Payment statistics
    total_amount = sum(float(payment.amount) for payment in payments)
    payment_methods = {}
    payment_statuses = {}
    
    for payment in payments:
        if payment.payment_method in payment_methods:
            payment_methods[payment.payment_method] += 1
        else:
            payment_methods[payment.payment_method] = 1
            
        if payment.payment_status in payment_statuses:
            payment_statuses[payment.payment_status] += 1
        else:
            payment_statuses[payment.payment_status] = 1
    
    return jsonify({
        'event': event.to_dict(),
        'report': {
            'total_tickets': event.tickets_sold,
            'total_amount': total_amount,
            'currency': event.currency,
            'payment_methods': payment_methods,
            'payment_statuses': payment_statuses
        },
        'payments': [payment.to_dict() for payment in payments]
    }), 200

@categories_bp.route('', methods=['GET'])
def get_categories():
    """Get all categories"""
    categories = Category.query.all()
    return jsonify({
        'categories': [category.to_dict() for category in categories]
    }), 200

@categories_bp.route('', methods=['POST'])
@role_required('admin')
def create_category():
    """Create a new category (admin only)"""
    data = request.get_json()
    
    if not data.get('name'):
        return jsonify({'error': 'Category name is required'}), 400
    
    # Check if category already exists
    existing = Category.query.filter_by(name=data['name']).first()
    if existing:
        return jsonify({'error': 'Category already exists'}), 409
    
    category = Categories(name=data['name'])
    db.session.add(category)
    db.session.commit()
    
    return jsonify({
        'message': 'Category created successfully',
        'category': category.to_dict()
    }), 201




"""


Organizer

"""
@organizers_bp.route('/profile', methods=['GET'])
@role_required('organizer')
def get_organizer_profile():
    """Get current user's organizer profile"""
    current_user_id = get_jwt_identity()
    
    organizer = Organizer.query.filter_by(user_id=current_user_id).first()
    if not organizer:
        return jsonify({'error': 'Organizer profile not found'}), 404
    
    return jsonify(organizer.to_dict()), 200

@organizers_bp.route('/profile', methods=['PUT', 'PATCH'])
@role_required('organizer')
def update_organizer_profile():
    """Update current user's organizer profile"""
    data = request.get_json()
    current_user_id = get_jwt_identity()
    
    organizer = Organizer.query.filter_by(user_id=current_user_id).first()
    if not organizer:
        return jsonify({'error': 'Organizer profile not found'}), 404
    
    # Update fields
    if 'company_name' in data:
        organizer.company_name = data['company_name']
    if 'company_image' in data:
        organizer.company_image = data['company_image']
    if 'contact_email' in data:
        organizer.contact_email = data['contact_email']
    if 'contact_phone' in data:
        organizer.contact_phone = data['contact_phone']
    
    db.session.commit()
    
    return jsonify({
        'message': 'Organizer profile updated successfully',
        'organizer': organizer.to_dict()
    }), 200

@organizers_bp.route('/become', methods=['POST'])
@jwt_required()
def become_organizer():
    """Convert a regular user to an organizer"""
    data = request.get_json()
    current_user_id = get_jwt_identity()
    
    if not data.get('company_name'):
        return jsonify({'error': 'Company name is required'}), 400
    
    # Check if already an organizer
    existing = Organizer.query.filter_by(user_id=current_user_id).first()
    if existing:
        return jsonify({'error': 'You are already an organizer'}), 409
    
    # Get or create organizer role
    organizer_role = Role.query.filter_by(name='organizer').first()
    if not organizer_role:
        organizer_role = Roles(name='organizer', description='User who can create and manage events')
        db.session.add(organizer_role)
        db.session.commit()  # Commit to get role.id
    
    # Add role to user
    user_role = UserRoles(user_id=current_user_id, role_id=organizer_role.id)
    db.session.add(user_role)
    
    # Create organizer profile
    user = User.query.get(current_user_id)
    organizer = Organizers(
        user_id=current_user_id,
        company_name=data['company_name'],
        company_image=data.get('company_image'),
        contact_email=data.get('contact_email', user.email),
        contact_phone=data.get('contact_phone', user.phone)
    )
    
    db.session.add(organizer)
    db.session.commit()
    
    return jsonify({
        'message': 'Successfully registered as an organizer',
        'organizer': organizer.to_dict()
    }), 201




"""


User

"""
@users_bp.route('/profile', methods=['GET'])
@jwt_required()
def get_user_profile():
    """Get current user's profile"""
    current_user_id = get_jwt_identity()
    
    user = User.query.get(current_user_id)
    if not user:
        return jsonify({'error': 'User not found'}), 404
    
    return jsonify(user.to_dict()), 200

@users_bp.route('/profile', methods=['PUT', 'PATCH'])
@jwt_required()
def update_user_profile():
    """Update current user's profile"""
    data = request.get_json()
    current_user_id = get_jwt_identity()
    
    user = User.query.get(current_user_id)
    if not user:
        return jsonify({'error': 'User not found'}), 404
    
    # Update fields
    if 'first_name' in data:
        user.first_name = data['first_name']
    if 'last_name' in data:
        user.last_name = data['last_name']
    if 'phone' in data:
        user.phone = data['phone']
    
    # Email updates require validation
    if 'email' in data and data['email'] != user.email:
        if not validate_email(data['email']):
            return jsonify({'error': 'Invalid email format'}), 400
            
        # Check if email is already taken
        existing = User.query.filter_by(email=data['email']).first()
        if existing and existing.id != user.id:
            return jsonify({'error': 'Email already registered to another user'}), 409
            
        user.email = data['email']
    
    # Password updates
    if 'current_password' in data and 'new_password' in data:
        if not user.check_password(data['current_password']):
            return jsonify({'error': 'Current password is incorrect'}), 400
            
        user.set_password(data['new_password'])
    
    db.session.commit()
    
    return jsonify({
        'message': 'Profile updated successfully',
        'user': user.to_dict()
    }), 200