from flask import request
from flask_restful import Resource
from flask_jwt_extended import jwt_required, get_jwt_identity
from app import db
from models import Ticket, Event, User, Attendee, DiscountCode, EventDiscountCode, Payment
from utils.response import success_response, error_response, paginate_response
import base64
import io

class TicketListResource(Resource):
    @jwt_required()
    def get(self):
        current_user_id = get_jwt_identity()
        user = User.query.get(current_user_id)
        
        if not user.has_role('admin'):
            return error_response("Unauthorized", 403)
            
        query = Ticket.query
        
        event_id = request.args.get('event_id')
        if event_id:
            query = query.filter_by(event_id=event_id)
            
        return paginate_response(query)

@jwt_required()
def post(self):
    current_user_id = get_jwt_identity()
    user = User.query.get(current_user_id)
    data = request.get_json()

    if 'event_id' not in data:
        return error_response("Missing event_id field")

    if 'qr_code' not in data:
        return error_response("Missing qr_code")

    event = Event.query.get(data['event_id'])
    if not event:
        return error_response("Event not found", 404)

    if event.tickets_sold >= event.total_tickets:
        return error_response("No tickets available for this event")

    attendee = Attendee.query.filter_by(user_id=current_user_id).first()
    if not attendee:
        attendee = Attendee(user_id=current_user_id)
        db.session.add(attendee)
        db.session.flush()

    price = event.price
    if 'discount_code' in data and data['discount_code']:
        discount_code = DiscountCode.query.filter_by(code=data['discount_code']).first()
        if not discount_code:
            return error_response("Invalid discount code")

        event_discount = EventDiscountCode.query.filter_by(
            event_id=event.id, discount_code_id=discount_code.id
        ).first()

        if not event_discount:
            return error_response("Discount code not valid for this event")

        if not discount_code.is_valid():
            return error_response("Discount code has expired")

        price = price * (1 - discount_code.discount_percentage / 100)

    new_ticket = Ticket(
        event_id=event.id,
        attendee_id=attendee.id,
        price=price,
        currency=event.currency,
        qr_code=data['qr_code'] 
    )

    event.tickets_sold += 1

    try:
        db.session.add(new_ticket)
        db.session.commit()
        return success_response(
            data=new_ticket.to_dict(include_event=True),
            message="Ticket purchased successfully",
            status_code=201
        )
    except Exception as e:
        db.session.rollback()
        return error_response(f"Error purchasing ticket: {str(e)}")

class TicketResource(Resource):
    @jwt_required()
    def get(self, ticket_id):
        current_user_id = get_jwt_identity()
        user = User.query.get(current_user_id)
        ticket = Ticket.query.get(ticket_id)
        
        if not ticket:
            return error_response("Ticket not found", 404)
            
        attendee = Attendee.query.filter_by(user_id=current_user_id).first()
        if not (attendee and attendee.id == ticket.attendee_id) and not user.has_role('admin'):
            return error_response("Unauthorized", 403)
            
        return success_response(data=ticket.to_dict(include_event=True))
    
    @jwt_required()
    def delete(self, ticket_id):
        current_user_id = get_jwt_identity()
        user = User.query.get(current_user_id)
        ticket = Ticket.query.get(ticket_id)
        
        if not ticket:
            return error_response("Ticket not found", 404)
            
        attendee = Attendee.query.filter_by(user_id=current_user_id).first()
        if not (attendee and attendee.id == ticket.attendee_id) and not user.has_role('admin'):
            return error_response("Unauthorized", 403)
            
        payment = Payment.query.filter_by(ticket_id=ticket.id).first()
        if payment and payment.payment_status == 'Completed':
            # Would need to implement refund logic here
            return error_response("Cannot cancel a paid ticket. Please contact support for refunds.")
            
        event = Event.query.get(ticket.event_id)
        event.tickets_sold -= 1
        
        try:
            db.session.delete(ticket)
            db.session.commit()
            return success_response(message="Ticket cancelled successfully")
        except Exception as e:
            db.session.rollback()
            return error_response(f"Error cancelling ticket: {str(e)}")

from flask import request
from flask_restful import Resource
from flask_jwt_extended import jwt_required, get_jwt_identity
from app import db
from models import Ticket, Event, User, Attendee
from utils.response import success_response, error_response
from datetime import datetime

class TicketVerificationResource(Resource):
    @jwt_required()
    def post(self, ticket_id):
        """
        Verify a ticket for event check-in
        """
        current_user_id = get_jwt_identity()
        user = User.query.get(current_user_id)
        
        # Verify the user has permission to check in tickets (admin or event organizer)
        if not user.has_role('admin') and not user.has_role('Organizer'):
            return error_response("Unauthorized. Only admins and organizers can verify tickets.", 403)
        
        # Find the ticket
        ticket = Ticket.query.get(ticket_id)
        if not ticket:
            return error_response("Ticket not found", 404)
        
        # Get the associated event
        event = Event.query.get(ticket.event_id)
        if not event:
            return error_response("Event associated with this ticket does not exist", 404)
        
        # If user is an organizer, verify they are the organizer of this event
        if not user.has_role('admin'):
            organizer = user.organizer
            if not organizer or organizer.id != event.organizer_id:
                return error_response("Unauthorized. You can only verify tickets for events you organize.", 403)
        
        # Check if the ticket has already been used
        if ticket.status == 'used':
            return error_response("Ticket has already been used", 400)
        
        # Check if the ticket is valid (additional validation could be added here)
        if ticket.status != 'valid':
            return error_response(f"Invalid ticket status: {ticket.status}", 400)
        
        # Update the ticket to mark it as used
        try:
            ticket.status = 'used'
            ticket.checked_in_at = datetime.utcnow()
            ticket.checked_in_by = current_user_id
            
            db.session.commit()
            
            # Get attendee information
            attendee = Attendee.query.get(ticket.attendee_id)
            attendee_user = User.query.get(attendee.user_id) if attendee else None
            
            # Prepare response data
            ticket_data = ticket.to_dict(include_event=True)
            
            # Add attendee name if available
            if attendee_user:
                ticket_data['attendee_name'] = f"{attendee_user.first_name} {attendee_user.last_name}"
            
            return success_response(
                data=ticket_data,
                message="Ticket verified successfully",
                status_code=200
            )
        except Exception as e:
            db.session.rollback()
            return error_response(f"Error verifying ticket: {str(e)}", 500)
    
    @jwt_required()
    def get(self, ticket_id):
        """
        Get ticket verification status
        """
        current_user_id = get_jwt_identity()
        user = User.query.get(current_user_id)
        
        # Find the ticket
        ticket = Ticket.query.get(ticket_id)
        if not ticket:
            return error_response("Ticket not found", 404)
        
        # Get the associated event
        event = Event.query.get(ticket.event_id)
        if not event:
            return error_response("Event associated with this ticket does not exist", 404)
        
        # Check if user has permission to view ticket
        is_admin = user.has_role('admin')
        is_organizer = user.has_role('Organizer') and user.organizer and user.organizer.id == event.organizer_id
        is_ticket_owner = user.attendee and user.attendee.id == ticket.attendee_id
        
        if not (is_admin or is_organizer or is_ticket_owner):
            return error_response("Unauthorized", 403)
        
        # Get attendee information
        attendee = Attendee.query.get(ticket.attendee_id)
        attendee_user = User.query.get(attendee.user_id) if attendee else None
        
        # Prepare response data
        ticket_data = ticket.to_dict(include_event=True)
        
        # Add attendee name if available
        if attendee_user:
            ticket_data['attendee_name'] = f"{attendee_user.first_name} {attendee_user.last_name}"
        
        return success_response(
            data=ticket_data,
            status_code=200
        )
class UserTicketsResource(Resource):
    """
    Resource for user's tickets
    """
    @jwt_required()
    def get(self, user_id):
        """Get tickets for a specific user"""
        current_user_id = get_jwt_identity()
        user = User.query.get(current_user_id)
        
        # Check if user is authorized to view these tickets
        if current_user_id != user_id and not user.has_role('admin'):
            return error_response("Unauthorized", 403)
            
        # Get attendee record
        attendee = Attendee.query.filter_by(user_id=user_id).first()
        if not attendee:
            return success_response(data=[])
            
        # Get tickets
        tickets = Ticket.query.filter_by(attendee_id=attendee.id).all()
        
        return success_response(data=[ticket.to_dict(include_event=True) for ticket in tickets])