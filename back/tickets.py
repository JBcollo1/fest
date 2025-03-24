from flask_restful import Resource
from flask_jwt_extended import jwt_required, get_jwt_identity
from flask import jsonify, make_response

from app import db
from models import Ticket, Event, User, Attendee, Payment
from utils.response import success_response, error_response
from datetime import datetime
from cash import initiate_mpesa_payment, wait_for_payment_confirmation


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

class TicketPurchaseResource(Resource):
    @jwt_required()
    def post(self, event_id):
        """
        Purchase a ticket for an event
        """
        current_user_id = get_jwt_identity()
        user = User.query.get(current_user_id)
        
        # Find the event
        event = Event.query.get(event_id)
        if not event:
            return error_response("Event not found", 404)
        
        # Check if there are available tickets
        if event.tickets_sold >= event.total_tickets:
            return error_response("No more tickets available for this event", 400)
        
        # Initiate Mpesa payment
        phone_number = user.phone
        total_price = event.price
        payment_result = initiate_mpesa_payment(total_price, phone_number)
        
        if payment_result.get('ResponseCode') != '0':
            return make_response(jsonify({'message': 'Payment initiation failed', 'details': payment_result}), 400)
        
       
        payment_verification = wait_for_payment_confirmation(payment_result['CheckoutRequestID'])

        
        if payment_verification['status'] != 'confirmed' or payment_verification['details']['details'].get('ResultCode') != '0':
            return make_response(jsonify({'message': 'Payment verification failed', 'details': payment_verification}), 400)
                # Create a new ticket and update the event's tickets_sold
        try:
            # Create a new ticket
            ticket = Ticket(
                event_id=event.id,
                attendee_id=user.attendee.id,
                price=total_price,
                currency=event.currency,
                status='purchased'
            )
            db.session.add(ticket)
            
            # Increment the tickets_sold count in the Event table
            event.tickets_sold += 1
            db.session.commit()
            
            # Record the payment in the Payment table
            payment = Payment(
                ticket_id=ticket.id,
                payment_method='Mpesa',
                payment_status='Completed',
                transaction_id=payment_verification['MpesaReceiptNumber'],
                amount=total_price,
                currency=ticket.currency
            )
            db.session.add(payment)
            db.session.commit()
            
            return success_response(
                data=ticket.to_dict(),
                message="Ticket purchased successfully",
                status_code=200
            )
        except Exception as e:
            db.session.rollback()
            return error_response(f"Error processing ticket purchase: {str(e)}", 500)

class TicketListResource(Resource):
    @jwt_required()
    def get(self, event_id):
        """
        Get tickets for a specific event
        """
        current_user_id = get_jwt_identity()
        user = User.query.get(current_user_id)
        
        # Check if user has permission to view tickets for this event
        event = Event.query.get(event_id)
        if not event:
            return error_response("Event not found", 404)
        
        is_admin = user.has_role('admin')
        is_organizer = user.has_role('Organizer') and user.organizer and user.organizer.id == event.organizer_id
        
        if not (is_admin or is_organizer):
            return error_response("Unauthorized", 403)
        
        # Get tickets for the event
        tickets = Ticket.query.filter_by(event_id=event_id).all()
        
        return success_response(data=[ticket.to_dict(include_attendee=True) for ticket in tickets])

