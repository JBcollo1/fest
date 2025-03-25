from flask_restful import Resource
from flask_jwt_extended import jwt_required, get_jwt_identity
from flask import jsonify, make_response, request

from app import db
from models import Ticket, Event, User, Attendee, Payment
from utils.response import success_response, error_response
from datetime import datetime
from cash import initiate_mpesa_payment

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
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
class mpesaCallback(Resource):
    def post(self):
        """Handles Mpesa callback response"""
        try:
            # Log the raw request data
            raw_data = request.data
            logging.info(f"Raw request data: {raw_data}")

            data = request.get_json()
            if data is None:
                logging.error("No JSON data received or malformed JSON.")
                return {'ResultCode': 1, 'ResultDesc': 'Bad Request: Malformed JSON'}, 400

            logging.info(f"Received M-Pesa Callback: {data}")

            result = process_mpesa_callback(data)
            response = make_response(result)
            response.headers['Content-Type'] = 'application/json'
            return response

        except Exception as e:
            logging.error(f"Callback Processing Error: {str(e)}")
            response = make_response({'ResultCode': 1, 'ResultDesc': 'Internal Server Error'}, 500)
            response.headers['Content-Type'] = 'application/json'
            return response

def process_mpesa_callback(data):
    """Process the M-Pesa callback data"""
    try:
        body = data.get('Body', {})
        stk_callback = body.get('stkCallback', {})

        result_code = stk_callback.get('ResultCode')
        checkout_request_id = stk_callback.get('CheckoutRequestID')

        # Payment failed scenario
        if result_code != 0:
            logging.warning(f"Payment failed for {checkout_request_id}")
            return {'ResultCode': 1, 'ResultDesc': 'Payment Failed'}, 400

        # Extract callback metadata
        callback_metadata = stk_callback.get('CallbackMetadata', {}).get('Item', [])
        payment_details = {item['Name']: item['Value'] for item in callback_metadata}

        # Retrieve payment record
        payment = Payment.query.filter_by(transaction_id=checkout_request_id).first()
        if not payment:
            logging.error("Payment record not found")
            return {'ResultCode': 1, 'ResultDesc': 'Payment record not found'}, 404

        # Update payment details
        payment.payment_status = 'Completed'
        payment.transaction_id = payment_details.get('MpesaReceiptNumber')
        payment.amount = float(payment_details.get('Amount', 0))
        payment.payment_date = datetime.now()

        # Update ticket status
        ticket = Ticket.query.filter_by(id=payment.ticket_id).first()
        if ticket:
            ticket.status = 'purchased'

            # Update event ticket count
            event = Event.query.get(ticket.event_id)
            if event:
                event.tickets_sold += 1

        # Commit DB updates
        db.session.commit()

        logging.info(f"Payment processed successfully: {payment.transaction_id}")

        return {'ResultCode': 0, 'ResultDesc': 'Payment processed successfully'}

    except Exception as e:
        db.session.rollback()
        logging.error(f"Payment processing error: {str(e)}")
        return {'ResultCode': 1, 'ResultDesc': 'Payment processing error'}, 500
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

