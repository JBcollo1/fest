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
        
        if not user.has_role('Admin'):
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
        if not (attendee and attendee.id == ticket.attendee_id) and not user.has_role('Admin'):
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
        if not (attendee and attendee.id == ticket.attendee_id) and not user.has_role('Admin'):
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
        if current_user_id != user_id and not user.has_role('Admin'):
            return error_response("Unauthorized", 403)
            
        # Get attendee record
        attendee = Attendee.query.filter_by(user_id=user_id).first()
        if not attendee:
            return success_response(data=[])
            
        # Get tickets
        tickets = Ticket.query.filter_by(attendee_id=attendee.id).all()
        
        return success_response(data=[ticket.to_dict(include_event=True) for ticket in tickets])