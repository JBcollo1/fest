from flask_restful import Resource
from flask_jwt_extended import jwt_required, get_jwt_identity
from flask import jsonify, make_response, request
from celery import current_task as self  

from database import db
from models import Ticket, Event, User, Attendee, Payment, TicketType
from utils.response import success_response, error_response
from datetime import datetime, timedelta
from cash import initiate_mpesa_payment, verify_mpesa_payment, generate_access_token
import qrcode
from sqlalchemy.orm import joinedload
import smtplib
from smtplib import SMTPException
import time
import base64
from io import BytesIO
from config2 import Config2
import logging
import uuid
from flask_mail import Message
from email_service import send_email, mail
from collections import defaultdict

logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
# logger = logging.getLogger(__name__)

from redis_client import redis_client
from celery import shared_task,Celery

from config3 import Config

celery = Celery(__name__, broker=Config.CELERY_BROKER_URL)
celery.conf.update(worker_max_memory_per_child=25000)

celery.conf.update(
    task_routes = {
        'process_payment_callback': {'queue': 'payments'},
        'cleanup_redis': {'queue': 'maintenance'}
    },
    task_default_priority=5,
)

@shared_task
def cleanup_redis():
    """Memory maintenance task for Render's Redis"""
    try:
        # Flush expired keys immediately
        redis_client.memory_purge()
        
        # Clean Celery task metadata
        redis_client.delete(
            'celery', 
            '_kombu.binding.celery',
            '_kombu.binding.celery.pidbox'
        )
        
        
        redis_client.config_set('maxmemory', Config.REDIS_MAXMEMORY)
        redis_client.config_set('maxmemory-policy', Config.REDIS_EVICTION_POLICY)
        
        return f"Memory used: {redis_client.info('memory')['used_memory_human']}"
    except Exception as e:
        return str(e)
    


class RedisHealth(Resource):
    def get(self):
        try:
            info = redis_client.info()
            queue_info = {
            'payments': redis_client.llen('payments'),
            'email': redis_client.llen('email'),
            'celery': redis_client.llen('celery'),
            "queues": queue_info
        }
            return {
                "status": "ok",
                "memory": info['used_memory_human'],
                "connected_clients": info['connected_clients'],
                "tasks_in_queue": redis_client.llen('celery'),
                "celery_workers": celery.control.inspect().active() or []
            }, 200
        except Exception as e:
            return {"status": "error", "message": str(e)}, 500


class TicketPurchaseResource(Resource):
    @jwt_required()
    def post(self, event_id):
        current_user_id = get_jwt_identity()
        user = User.query.get(current_user_id)
        event = Event.query.get(event_id)

        if not event:
            return error_response("Event not found", 404)

        # Get ticket details and total amount from the request
        ticket_details = request.json.get('ticket_details', [])
        total_amount = request.json.get('total_amount', 0)

        # Validate and process each ticket type
        for detail in ticket_details:
            ticket_type_id = detail.get('ticket_type_id')
            quantity = detail.get('quantity', 1)

            ticket_type = TicketType.query.get(ticket_type_id)
            if not ticket_type or ticket_type.event_id != event_id:
                return error_response("Invalid ticket type", 400)

            # Directly check availability
            if ticket_type.quantity - ticket_type.tickets_sold < quantity:
                return error_response("Selected ticket type is not available", 400)

            if ticket_type.per_person_limit and quantity > ticket_type.per_person_limit:
                return error_response(f"Cannot purchase more than {ticket_type.per_person_limit} tickets per person", 400)

        # Create or get the attendee
        attendee = Attendee.query.filter_by(user_id=user.id).first()
        if not attendee:
            try:
                attendee = Attendee(user_id=user.id)
                db.session.add(attendee)
                db.session.commit()  # Ensure attendee ID is set
            except Exception as e:
                db.session.rollback()
                return error_response(f"Error creating attendee: {str(e)}", 500)

        # Initiate M-Pesa Payment
        phone_number = user.phone
        payment_result = initiate_mpesa_payment(total_amount, phone_number)

        if not payment_result or payment_result.get('ResponseCode', '1') != '0':
            return error_response("Payment initiation failed", 400)

        checkout_request_id = payment_result.get('CheckoutRequestID')
        if not checkout_request_id:
            return error_response("Invalid payment response", 400)

        # Wait for payment confirmation immediately after initiation
        

        # Ensure ticket_details is not empty
        if not ticket_details:
            return error_response("No ticket details provided", 400)

        # Initialize the ticket variable
        ticket = None

        try:
            # Process each ticket type
            for detail in ticket_details:
                ticket_type_id = detail.get('ticket_type_id')
                quantity = detail.get('quantity', 1)
                ticket_type = TicketType.query.get(ticket_type_id)

                # Create a new ticket
                ticket = Ticket(
                    event_id=event.id,
                    attendee_id=attendee.id,
                    ticket_type_id=ticket_type.id,
                    price=ticket_type.price * quantity,
                    quantity=quantity,
                    currency=ticket_type.currency,
                    satus='pending'  # Initially set to pending
                )
                db.session.add(ticket)
                db.session.flush()  # Get the ticket ID

            # Record the payment
            if ticket:  # Ensure ticket is not None
                payment = Payment(
                    ticket_id=ticket.id,
                    payment_method='Mpesa',
                    payment_status='Pending',  # Initially set to pending
                    transaction_id=checkout_request_id,
                    amount=total_amount,
                    currency=ticket.currency
                )
                db.session.add(payment)
                db.session.commit()  # Commit the payment record

                return success_response(
                    message="Payment initiated and ticket reserved successfully.",
                    data={"CheckoutRequestID": checkout_request_id},
                    status_code=200
                )
            else:
                return error_response("Failed to create ticket", 500)

        except Exception as e:
            db.session.rollback()
            return error_response(f"Error processing ticket purchase: {str(e)}", 500)

class mpesaCallback(Resource):
    def post(self):
        """Handles Mpesa callback response"""
        logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')

        try:
            raw_data = request.data
            logging.info(f"Raw request data: {raw_data}")

            if not raw_data:
                logging.error("Received empty request data.")
                logging.info(f"Request headers: {request.headers}")
                return {'ResultCode': 1, 'ResultDesc': 'Bad Request: Empty request data'}, 400

            data = request.get_json()
            if data is None:
                logging.error("No JSON data received or malformed JSON.")
                return {'ResultCode': 1, 'ResultDesc': 'Bad Request: Malformed JSON'}, 400

            logging.info(f"Received M-Pesa Callback: {data}")

            # Check for user cancellation
            result_code = data.get('Body', {}).get('stkCallback', {}).get('ResultCode')
            if result_code == 1032:
                logging.warning("Payment cancelled by user.")
                return {'ResultCode': 0, 'ResultDesc': 'Payment cancelled by user'}, 200

            result = process_mpesa_callback(data)
            response = make_response(result)
            response.headers['Content-Type'] = 'application/json'
            return response

        except Exception as e:
            logging.error(f"Callback Processing Error: {str(e)}")

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
        if ticket.satus == 'used':
            return error_response("Ticket has already been used", 400)
        
        # Check if the ticket is valid (additional validation could be added here)
        if ticket.satus != 'purchased':
            return error_response(f"Invalid ticket status: {ticket.status}", 400)
        
        # Update the ticket to mark it as used
        try:
            ticket.satus = 'used'
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


def send_ticket_qr_email(user, ticket):
    """Send ticket email with properly attached QR code"""
    user = User.query.get(user)
    ticket = Ticket.query.get(ticket)
    
    try:
        # Validate essential data
        if not all([ticket, ticket.qr_code, user.email, ticket.event]):
            logging.error(f"Missing data - Ticket: {bool(ticket)}, QR: {bool(ticket.qr_code)}, User: {user}")
            return

        # Generate QR code as attachment
        qr_filename, qr_data = generate_qr_attachment(ticket)
        
        # Create email message
        msg = create_email_message(user, ticket, qr_filename, qr_data)
        
        # Send with retry logic
        send_email_with_retry(msg, retries=2)
        
    except Exception as e:
        logging.error(f"Ticket email failed: {str(e)}")

def generate_qr_attachment(ticket):
    """Generate QR code file and return attachment data"""
    try:
        verification_url = f"{Config2.BASE_URL}/verify/{ticket.qr_code}"
        
        qr = qrcode.QRCode(
            version=5,
            error_correction=qrcode.constants.ERROR_CORRECT_H,
            box_size=12,
            border=6,
        )
        qr.add_data(verification_url)
        qr.make(fit=True)
        
        img = qr.make_image(fill_color="#000000", back_color="#FFFFFF")
        img_buffer = BytesIO()
        img.save(img_buffer, format="PNG")
        img_buffer.seek(0)
        
        return ("qr_ticket.png", img_buffer.getvalue())
        
    except Exception as e:
        logging.error(f"QR generation failed: {str(e)}")
        raise

def create_email_message(user, ticket, qr_filename, qr_data):
    """Create email message with original QR box styling"""
    try:
        event_date = ticket.event.start_datetime.strftime('%B %d, %Y %H:%M') if not ticket.event.start_datetime else "Date to be announced"
        

        html_content = f"""<!DOCTYPE html>
        <html>
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <style>
                .email-container {{
                    font-family: Arial, sans-serif;
                    padding: 20px;
                    background-color: #f4f4f4;
                    border-radius: 10px;
                    max-width: 600px;
                    margin: 0 auto;
                }}
                .email-header {{
                    background-color: {Config2.BRAND_COLOR};
                    color: white;
                    padding: 20px;
                    text-align: center;
                    border-radius: 10px 10px 0 0;
                }}
                .email-body {{
                    padding: 30px;
                    background-color: white;
                    border-radius: 0 0 10px 10px;
                }}
                .qr-box {{
                    text-align: center;
                    margin: 25px 0;
                    padding: 20px;
                    background: #ffffff;
                    border: 2px solid #eeeeee;
                    border-radius: 8px;
                    box-shadow: 0 2px 4px rgba(0,0,0,0.1);
                }}
                .qr-code-img {{
                    width: 200px;
                    height: 200px;
                    margin: 0 auto;
                    display: block;
                }}
                .details {{
                    margin: 20px 0;
                    line-height: 1.6;
                    color: #333333;
                }}
                .detail-item {{
                    margin: 15px 0;
                }}
            </style>
        </head>
        <body>
            <div class="email-container">
                <div class="email-header">
                    <h1>Your Ticket for {ticket.event.title}</h1>
                </div>
                
                <div class="email-body">
                    <div class="details">
                        <p>Hello {user.first_name} {user.last_name},</p>
                        
                        <div class="detail-item">
                            <h3>{ticket.event.title}</h3>
                        </div>
                        
                        <div class="detail-item">
                            📅 <strong>Date:</strong> {event_date}
                        </div>
                        
                        <div class="detail-item">
                            📍 <strong>Location:</strong> {ticket.event.location}
                        </div>
                        
                        <div class="detail-item">
                            🎟 <strong>Tickets:</strong> {ticket.quantity}
                        </div>
                    </div>

                    <div class="qr-box">
                        <img src="cid:qr_code" 
                             class="qr-code-img"
                             alt="Ticket QR Code">
                        <p style="margin-top: 15px; color: #666;">
                            Scan this QR code at the event entrance
                        </p>
                    </div>
                    
                    <p style="margin-top: 25px;">
                        Best regards,<br>
                        <strong>The {Config2.EMAIL_SENDER_NAME}</strong>
                    </p>
                </div>
            </div>
        </body>
        </html>"""

        msg = Message(
            subject=f"🎟 Your Ticket for {ticket.event.title}",
            recipients=[user.email],
            sender=(Config2.EMAIL_SENDER_NAME, Config2.MAIL_USERNAME),
            charset="utf-8"
        )
        
        # HTML version
        msg.html = html_content
        
        # Text version
        msg.body = f"""Hi {user.first_name},

Your ticket details:

Event: {ticket.event.title}
Date: {event_date}
Location: {ticket.event.location}
Tickets: {ticket.quantity}

Scan the attached QR code at the event entrance.

Best regards,
The {Config2.EMAIL_SENDER_NAME}"""

        # Attach QR code
        msg.attach(
            filename=qr_filename,
            content_type="image/png",
            data=qr_data,
            headers=[("Content-ID", "<qr_code>")]
        )
        
        return msg

    except Exception as e:
        logging.error(f"Email creation failed: {str(e)}")
        raise
def send_email_with_retry(msg, retries=2):
    """Robust email sending with retries"""
    logger = logging.getLogger(__name__)
    for attempt in range(retries + 1):
        try:
            mail.send(msg)
            logger.info(f"Email sent successfully to {msg.recipients}")
            return True
        except SMTPException as e:
            logger.warning(f"Email attempt {attempt+1} failed: {str(e)}")
            if attempt < retries:
                sleep_time = 2 ** attempt
                logger.info(f"Retrying in {sleep_time} seconds")
                time.sleep(sleep_time)
        except Exception as e:
            logger.error(f"Non-SMTP error: {str(e)}")
            raise


@celery.task(bind=True, autoretry_for=(Exception,), max_retries=3, retry_backoff=30)
def process_payment_callback(self, checkout_request_id):
    """Async payment verification with detailed logging"""
    logger = logging.getLogger(f"PaymentProcessor.{checkout_request_id}")
    
    try:
        logger.info(f"Starting processing for {checkout_request_id}")
        
        if redis_client.exists(f'processed:{checkout_request_id}'):
            logger.warning("Already processed - aborting")
            return "Duplicate request"

        payment = Payment.query.filter_by(checkout_request_id=checkout_request_id).first()
        if not payment:
            logger.error("Payment record not found in DB")
            redis_client.setex(f'missing:{checkout_request_id}', 3600, 1)
            raise ValueError("Payment record missing")

        logger.debug(f"Found payment: {payment.id} with status {payment.status}")

        if payment.status == 'completed':
            logger.info("Payment already completed")
            return "Already completed"

        logger.info("Initiating M-Pesa verification")
        access_token = redis_client.get('mpesa_token') or generate_access_token()
        
        verification_result = verify_mpesa_payment(checkout_request_id, access_token)
        logger.debug(f"Verification result: {verification_result}")

        if verification_result.get('ResultCode') != '0':
            logger.error(f"Payment failed: {verification_result.get('ResultDesc')}")
            payment.status = 'failed'
            db.session.commit()
            return "Payment failed"

        logger.info("Payment verification successful - updating records")
        
        if verification_result.get('ResultCode') == '0':
            logger.info(f"Payment verified: {checkout_request_id}")
            payment.status = 'completed'
            
            ticket_type_counts = defaultdict(int)
            for ticket in payment.tickets:
                ticket_type_counts[ticket.ticket_type_id] += ticket.quantity
                ticket.satus = 'completed'

            for ticket_type_id, count in ticket_type_counts.items():
                ticket_type = TicketType.query.get(ticket_type_id)
                if ticket_type:
                    ticket_type.tickets_sold += count
                    logger.debug(f"Updated {ticket_type.name} sold count by {count}")

            db.session.commit()
            redis_client.setex(f'processed:{checkout_request_id}', 86400, 1)
            logger.info(f"Payment completed: {checkout_request_id}")

            user = payment.tickets[0].attendee.user
            logger.info(f"Dispatching email for user {user.id}")
            
            send_ticket_qr_email.apply_async(
                args=(user.id, payment.tickets[0].id),
                retry=True,
                retry_policy={'max_retries': 3, 'interval_start': 10}
            )
            return "Success"
            
    except Exception as e:
        logger.error(f"Payment processing failed: {str(e)}")
        db.session.rollback()
        raise self.retry(exc=e)

def process_mpesa_callback(data):
    """Process the M-Pesa callback data"""
    logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
    
    try:
        body = data.get('Body', {})
        stk_callback = body.get('stkCallback', {})
        
        result_code = stk_callback.get('ResultCode')
        checkout_request_id = stk_callback.get('CheckoutRequestID')
        
        logging.info(f"Processing callback for CheckoutRequestID: {checkout_request_id}")
        
        # Payment failed scenario
        if result_code != 0:
            logging.warning(f"Payment failed for {checkout_request_id}")
            return {'ResultCode': 1, 'ResultDesc': 'Payment Failed'}, 400
        if result_code == 0:
            logging.info(f"Successful payment detected for {checkout_request_id}")
            process_payment_callback.apply_async(
                args=(checkout_request_id,),
                queue='payments'
            )
            return {'ResultCode': 0}, 200
        elif result_code == 1032:
            logging.warning(f"User cancelled payment {checkout_request_id}")
            return {'ResultCode': 0}, 200
        # Extract callback metadata
        callback_metadata = stk_callback.get('CallbackMetadata', {}).get('Item', [])
        payment_details = {item['Name']: item.get('Value') for item in callback_metadata if 'Value' in item}
        
        # Queue the async processing task
        process_payment_callback.delay(checkout_request_id)
        
        return {'ResultCode': 0, 'ResultDesc': 'Payment processed successfully'}, 200
    
    except Exception as e:
        logging.error(f"Error processing M-Pesa callback: {str(e)}")
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

def cleanup_pending_tickets_and_payments():
    """Delete tickets and payments that are pending for more than 4 minutes."""
    # Calculate the cutoff time
    cutoff_time = datetime.utcnow() - timedelta(minutes=10)

    try:
        # Find tickets that are pending and older than 4 minutes
        pending_tickets = Ticket.query.filter(
            Ticket.satus == 'pending'
           
        ).all()

        # Find payments that are pending and older than 4 minutes
        pending_payments = Payment.query.filter(
            Payment.payment_status == 'Pending',
            
        ).all()

        # Delete the pending tickets and payments
        for ticket in pending_tickets:
            db.session.delete(ticket)

        for payment in pending_payments:
            db.session.delete(payment)

        # Commit the changes to the database
        db.session.commit()
        logging.info(f"Deleted {len(pending_tickets)} pending tickets and {len(pending_payments)} pending payments.")
    except Exception as e:
        db.session.rollback()
        logging.error(f"Error during cleanup of pending tickets and payments: {str(e)}")

