from flask_restful import Resource
from flask_jwt_extended import jwt_required, get_jwt_identity
from flask import jsonify, make_response, request

from app import db
from models import Ticket, Event, User, Attendee, Payment
from utils.response import success_response, error_response
from datetime import datetime
from cash import initiate_mpesa_payment
from callback import process_mpesa_callback  # Import the callback processing function
import logging

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
        current_user_id = get_jwt_identity()
        user = User.query.get(current_user_id)
        event = Event.query.get(event_id)

        if not event:
            return error_response("Event not found", 404)
        if event.tickets_sold >= event.total_tickets:
            return error_response("No more tickets available", 400)

        attendee = Attendee.query.filter_by(user_id=user.id).first()
        if not attendee:
            try:
                attendee = Attendee(user_id=user.id)
                db.session.add(attendee)
                db.session.commit()  # Ensure attendee ID is set
            except Exception as e:
                db.session.rollback()
                return error_response(f"Error creating attendee: {str(e)}", 500)

        # Initiate Mpesa Payment
        phone_number = user.phone
        total_price = event.price
        payment_result = initiate_mpesa_payment(total_price, phone_number)

        if not payment_result or payment_result.get('ResponseCode', '1') != '0':
            return error_response("Payment initiation failed", 400)

        checkout_request_id = payment_result.get('CheckoutRequestID')
        if not checkout_request_id:
            return error_response("Invalid payment response", 400)

        try:
            # Create a new ticket
            ticket = Ticket(
                event_id=event.id,
                attendee_id=attendee.id,
                price=total_price,
                currency=event.currency,
                satus='pending'
            )
            db.session.add(ticket)
            db.session.flush()  # Get the ticket ID

            # Record the payment
            payment = Payment(
                ticket_id=ticket.id,
                payment_method='Mpesa',
                payment_status='Pending',
                transaction_id=checkout_request_id,
                amount=total_price,
                currency=ticket.currency
            )
            db.session.add(payment)
            db.session.commit()

            return success_response(
                message="Payment initiated. Await confirmation via callback.",
                data={"CheckoutRequestID": checkout_request_id},
                status_code=200
            )
        except Exception as e:
            db.session.rollback()
            return error_response(f"Error processing ticket purchase: {str(e)}", 500)


class mpesaCallback(Resource):
    def post(self):
        """Handles Mpesa callback response"""
        
            # Handle different possible request formats
        data = request.get_json()
            # result = self.process_mpesa_callback(data)
        return data ,200
        
    def process_mpesa_callback(self, data):
        """Process the M-Pesa callback data"""
        # Extract nested callback data
        body = data.get('Body', data)
        stk_callback = body.get('stkCallback', body)

        # Extract key parameters
        result_code = stk_callback.get('ResultCode')
        checkout_request_id = stk_callback.get('CheckoutRequestID')

        # Successful payment handling
        if result_code == 0:
            try:
                # Extract callback metadata
                callback_metadata = stk_callback.get('CallbackMetadata', {}).get('Item', [])
                
                # Parse payment details
                payment_details = {}
                for item in callback_metadata:
                    name = item.get('Name')
                    value = item.get('Value')
                    
                    if name == 'MpesaReceiptNumber':
                        payment_details['receipt_number'] = value
                    elif name == 'Amount':
                        payment_details['amount'] = float(value)
                    elif name == 'TransactionDate':
                        payment_details['transaction_date'] = str(value)

                # Find and update payment record
                payment = Payment.query.filter_by(transaction_id=checkout_request_id).first()
                if not payment:
                    return {
                        'ResultCode': 1, 
                        'ResultDesc': 'Payment record not found'
                    }, 404

                # Update payment details
                payment.payment_status = 'Completed'
                payment.transaction_id = payment_details.get('receipt_number')
                payment.amount = payment_details.get('amount')
                payment.payment_date = datetime.now()

                # Update associated ticket
                ticket = Ticket.query.filter_by(id=payment.ticket_id).first()
                if ticket:
                    ticket.status = 'purchased'
                    
                    # Update event tickets sold
                    event = Event.query.get(ticket.event_id)
                    if event:
                        event.tickets_sold += 1

                # Commit changes
                db.session.commit()

                return {
                    'ResultCode': 0, 
                    'ResultDesc': 'Payment processed successfully'
                }

            except Exception as e:
                # Rollback in case of any error
                db.session.rollback()
                # Log the exception for debugging
                print(f"Payment processing error: {str(e)}")
                return {
                    'ResultCode': 1, 
                    'ResultDesc': 'Payment processing error'
                }, 500

        # Payment failed
        return {
            'ResultCode': 1, 
            'ResultDesc': 'Payment Failed'
        }, 400

class TicketListResource(Resource):
    @jwt_required()
    def get(self, event_id):
        """
        Get tickets for a specific event
        """
        current_user_id = get_jwt_identity()
        user = User.query.get(current_user_id)
        

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

