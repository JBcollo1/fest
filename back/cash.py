import base64
import logging
import requests
from datetime import datetime
from requests.auth import HTTPBasicAuth
from flask_restful import Resource
from flask import request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from email_service import send_email, mail
from database import db
from models import Ticket, Event, User, Attendee, Payment, TicketType
from utils.response import success_response, error_response
from flask_mail import Message
from datetime import datetime, timedelta
import qrcode
import smtplib
from smtplib import SMTPException
from config2 import Config2
from io import BytesIO
import time
import json
from json.decoder import JSONDecodeError
from flask import g
import threading
from sqlalchemy.exc import SQLAlchemyError

from config import (
    MPESA_BASE_URL, 
    MPESA_CONSUMER_KEY, 
    MPESA_CONSUMER_SECRET,
    MPESA_BUSINESS_SHORT_CODE,
    MPESA_PASSKEY,
    MPESA_CALLBACK_URL,
    MPESA_ACCOUNT_REFERENCE,
    MPESA_TRANSACTION_DESC
)

# Configure logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

def generate_access_token():
    """Generate M-Pesa API access token"""
    try:
        endpoint = f"{MPESA_BASE_URL}/oauth/v1/generate?grant_type=client_credentials"
        response = requests.get(
            endpoint, 
            auth=HTTPBasicAuth(MPESA_CONSUMER_KEY, MPESA_CONSUMER_SECRET)
        )
        
        if response.status_code != 200:
            logger.error(f"Token generation failed: {response.text}")
            raise Exception(f"Failed to fetch access token: {response.status_code}")
            
        token = response.json().get("access_token")
        logger.info("Access token generated successfully")
        return token
    except Exception as e:
        logger.error(f"Access token generation error: {str(e)}")
        raise

def format_phone_number(phone_number):
    """Format phone number to required M-Pesa format (254XXXXXXXXX)"""
    phone_number = str(phone_number).strip()
    if phone_number.startswith("+"):
        phone_number = phone_number[1:]
    if phone_number.startswith("0"):
        return "254" + phone_number[1:]
    elif not phone_number.startswith("254"):
        return "254" + phone_number
    return phone_number

def generate_password(shortcode, passkey, timestamp):
    """Generate Base64 encoded password for M-Pesa API"""
    data_to_encode = shortcode + passkey + timestamp
    return base64.b64encode(data_to_encode.encode("utf-8")).decode("utf-8")

def initiate_mpesa_payment(amount, phone_number):

    try:
        
        access_token = generate_access_token()
        
        
        phone_number = format_phone_number(phone_number)
        timestamp = datetime.now().strftime('%Y%m%d%H%M%S')
        
  
        password = generate_password(
            MPESA_BUSINESS_SHORT_CODE, 
            MPESA_PASSKEY, 
            timestamp
        )
        
     
        payload = {
            "BusinessShortCode": MPESA_BUSINESS_SHORT_CODE,
            "Password": password,
            "Timestamp": timestamp,
            "TransactionType": "CustomerPayBillOnline",
            "Amount": str(int(amount)),
            "PartyA": phone_number,
            "PartyB": MPESA_BUSINESS_SHORT_CODE,
            "PhoneNumber": phone_number,
            "CallBackURL": MPESA_CALLBACK_URL,
            "AccountReference": MPESA_ACCOUNT_REFERENCE,
            "TransactionDesc": MPESA_TRANSACTION_DESC
        }
        
       
        headers = {
            "Content-Type": "application/json",
            "Authorization": f"Bearer {access_token}"
        }
        
        logger.info(f"Initiating payment for {phone_number}, amount: {amount}")
        
       
        response = requests.post(
            f"{MPESA_BASE_URL}/mpesa/b2b/v1/paymentrequest", 
            json=payload, 
            headers=headers
        )
        
    
        logger.info(f"STK Push response: {response.status_code} - {response.text}")
        
        if response.status_code != 200:
            logger.error(f"STK Push failed: {response.text}")
            return {"error": "Payment request failed", "details": response.text}
        
        
        return response.json()
    except Exception as e:
        logger.error(f"Error during M-Pesa STK Push: {str(e)}")
        return {"error": f"Failed to initiate payment: {str(e)}"}

def verify_mpesa_payment(checkout_request_id):
    try:
        # Generate a fresh access token for each verification
        access_token = generate_access_token()
        
        # Your timestamp and password generation
        timestamp = datetime.now().strftime('%Y%m%d%H%M%S')
        password = generate_password(
            MPESA_BUSINESS_SHORT_CODE, 
            MPESA_PASSKEY, 
            timestamp
        )
        
        # Payload remains the same
        payload = {
            "BusinessShortCode": MPESA_BUSINESS_SHORT_CODE,
            "Password": password,
            "Timestamp": timestamp,
            "CheckoutRequestID": checkout_request_id
        }
        
        # Ensure headers use the fresh token
        headers = {
            "Content-Type": "application/json",
            "Authorization": f"Bearer {access_token}"
        }
        
        # Log authentication details for debugging
        logger.debug(f"Verifying payment with checkout ID: {checkout_request_id}")
        logger.debug(f"Using access token: {access_token[:10]}...")
        
        response = requests.post(
            f"{MPESA_BASE_URL}/mpesa/stkpushquery/v1/query",
            json=payload,
            headers=headers,
            timeout=10
        )

        # Log response status for debugging
        logger.debug(f"M-Pesa API response status: {response.status_code}")
        
        # Handle HTTP errors first
        response.raise_for_status()

        # Parse JSON response safely
        try:
            result = response.json()
            logger.debug(f"M-Pesa API response: {result}")
        except JSONDecodeError:
            return {"error": "Invalid JSON response"}

        # Handle authentication error specifically
        if result.get('errorCode') == '404.001.04':
            logger.error("Authentication error with M-Pesa API. Token may be invalid.")
            # Try to regenerate token and try once more
            access_token = generate_access_token(force_refresh=True)
            headers["Authorization"] = f"Bearer {access_token}"
            
            # Try request again with new token
            logger.debug(f"Retrying with fresh token: {access_token[:10]}...")
            response = requests.post(
                f"{MPESA_BASE_URL}/mpesa/stkpushquery/v1/query",
                json=payload,
                headers=headers,
                timeout=10
            )
            
            response.raise_for_status()
            result = response.json()
            logger.debug(f"M-Pesa API retry response: {result}")

        # Safely extract result_code after any retries
        result_code = result.get('ResultCode')

        if result_code == '0':
            return result  # Success
        elif result_code == '1032':
            return {'status': 'canceled', 'ResultCode': '1032', 'message': 'Transaction canceled by user'}
        elif result_code == '2001':
            return {'status': 'pending', 'ResultCode': '2001', 'message': 'Transaction pending processing'}
        else:
            return {'error': result.get('ResultDesc', 'Unknown error')}

    except requests.exceptions.RequestException as e:
        logger.error(f"Request failed: {str(e)}")
        return {"error": "API communication failed"}
    except Exception as e:
        logger.error(f"Unexpected error: {str(e)}")
        return {"error": str(e)}

# Create a lock for each transaction
def get_transaction_lock(checkout_id):
    """Get a thread lock for a specific transaction"""
    if not hasattr(g, 'transaction_locks'):
        g.transaction_locks = {}
    
    if checkout_id not in g.transaction_locks:
        g.transaction_locks[checkout_id] = threading.Lock()
    
    return g.transaction_locks[checkout_id]
class MpesaCallbackResource(Resource):
    """Handler for M-Pesa callback notifications"""
    
    def post(self):
        """Process M-Pesa callback data"""
        logger.info("Received M-Pesa callback")
        
        try:
            # Get callback data
            callback_data = request.get_json()
            
            if not callback_data:
                logger.error("Empty callback data received")
                return {"ResultCode": 1, "ResultDesc": "Invalid data received"}, 400
                
            logger.info(f"Callback data: {callback_data}")
            
            
            body = callback_data.get('Body', {})
            stk_callback = body.get('stkCallback', {})
            
           
            result_code = stk_callback.get('ResultCode')
            checkout_request_id = stk_callback.get('CheckoutRequestID')
            
            if not checkout_request_id:
                logger.error("Missing CheckoutRequestID in callback")
                return {"ResultCode": 1, "ResultDesc": "Missing CheckoutRequestID"}, 400
                
            logger.info(f"Processing callback for CheckoutRequestID: {checkout_request_id}")
            
           
            lock = get_transaction_lock(checkout_request_id)
            with lock:
                    payment = Payment.query.filter_by(transaction_id=checkout_request_id).first()
                    
                    if not payment:
                        logger.error(f"Payment not found for CheckoutRequestID: {checkout_request_id}")
                        return {"ResultCode": 1, "ResultDesc": "Payment not found"}, 404
                        
                
                    if result_code == 0:  
                        
                        callback_metadata = stk_callback.get('CallbackMetadata', {}).get('Item', [])
                        payment_details = {}
                        for item in callback_metadata:
                            if 'Name' in item and 'Value' in item:
                                payment_details[item['Name']] = item['Value']
                            else:
                                logger.warning(f"Malformed metadata item: {item}")
                                
                        logger.debug(f"Extracted payment details: {payment_details}")
                        
                        
                        
                        payment.payment_status = 'Completed'
                        payment.transaction_id = payment_details.get('MpesaReceiptNumber')
                        payment.payment_date = datetime.now()
                        
                
                        ticket = Ticket.query.get(payment.ticket_id)
                        if ticket:
                            ticket.satus = 'purchased'
                            
                            
                            ticket_type = TicketType.query.get(ticket.ticket_type_id)
                            if ticket_type:
                                ticket_type.tickets_sold += ticket.quantity
                        
                    
                        db.session.commit()
                        
                        logger.info(f"Payment completed for CheckoutRequestID: {checkout_request_id}")
                        
                    
                        try:
                            
                            send_ticket_qr_email(ticket)
                        except Exception as email_error:
                            logger.error(f"Error sending ticket email: {str(email_error)}")
                        
                        return {"ResultCode": 0, "ResultDesc": "Success"}, 200
                        
                    else:  
                    
                        payment.payment_status = 'Failed'
                        payment.failure_reason = stk_callback.get('ResultDesc', 'Payment failed')
                        
                        # Update ticket status
                        ticket = Ticket.query.get(payment.ticket_id)
                        if ticket:
                            ticket.satus = 'payment_failed'
                        
                        # Commit changes
                        db.session.commit()
                        
                        logger.info(f"Payment failed for CheckoutRequestID: {checkout_request_id}")
                        return {"ResultCode": 0, "ResultDesc": "Payment failure recorded"}, 200
                
        except Exception as e:
            logger.error(f"Error processing callback: {str(e)}")
            return {"ResultCode": 1, "ResultDesc": f"Error: {str(e)}"}, 500
class TicketPurchaseResource(Resource):
    """Resource for initiating ticket purchases"""
    
    @jwt_required()
    def post(self, event_id):
        """Initiate ticket purchase for an event"""
        try:
            # Get current user
            current_user_id = get_jwt_identity()
            user = User.query.get(current_user_id)
            
            if not user:
                return error_response("User not found", 404)
                
            # Get event
            event = Event.query.get(event_id)
            
            if not event:
                return error_response("Event not found", 404)
                
            # Get ticket details from request
            data = request.get_json()
            ticket_details = data.get('ticket_details', [])
            total_amount = data.get('total_amount', 0)
            
            if not ticket_details:
                return error_response("No ticket details provided", 400)
                
            # Validate ticket details
            for detail in ticket_details:
                ticket_type_id = detail.get('ticket_type_id')
                quantity = detail.get('quantity', 1)
                
                # Get ticket type
                ticket_type = TicketType.query.get(ticket_type_id)
                
                if not ticket_type or ticket_type.event_id != event_id:
                    return error_response("Invalid ticket type", 400)
                    
                # Check availability
                available = ticket_type.quantity - ticket_type.tickets_sold
                if available < quantity:
                    return error_response(f"Only {available} tickets available for {ticket_type.name}", 400)
                    
                # Check per-person limit
                if ticket_type.per_person_limit and quantity > ticket_type.per_person_limit:
                    return error_response(f"Cannot purchase more than {ticket_type.per_person_limit} tickets per person", 400)
            
            # Get or create attendee
            attendee = Attendee.query.filter_by(user_id=user.id).first()
            if not attendee:
                attendee = Attendee(user_id=user.id)
                db.session.add(attendee)
                db.session.flush()
            
            # Initialize M-Pesa payment
            payment_result = initiate_mpesa_payment(total_amount, user.phone)
            
            if "error" in payment_result:
                return error_response(f"Payment initiation failed: {payment_result.get('error')}", 400)
                
            # Check for valid response
            if payment_result.get('ResponseCode') != '0':
                return error_response(f"Payment gateway error: {payment_result.get('ResponseDescription')}", 400)
                
            # Get checkout request ID
            checkout_request_id = payment_result.get('CheckoutRequestID')
            
            if not checkout_request_id:
                return error_response("Missing checkout request ID in payment response", 400)
            
            # Create ticket records for each ticket type
            tickets = []
            for detail in ticket_details:
                ticket_type_id = detail.get('ticket_type_id')
                quantity = detail.get('quantity', 1)
                
                ticket_type = TicketType.query.get(ticket_type_id)
                
                # Create ticket
                ticket = Ticket(
                    event_id=event.id,
                    attendee_id=attendee.id,
                    ticket_type_id=ticket_type.id,
                    price=ticket_type.price * quantity,
                    quantity=quantity,
                    currency=ticket_type.currency,
                    satus='pending'  # Initially pending
                )
                
                db.session.add(ticket)
                db.session.flush()  # Get ticket ID
                tickets.append(ticket)
            
            # Create payment record
            payment = Payment(
                ticket_id=tickets[0].id,  # Link to first ticket
                payment_method='Mpesa',
                payment_status='Pending',
                transaction_id=checkout_request_id,
                amount=total_amount,
                currency=tickets[0].currency
            )
            
            db.session.add(payment)
            db.session.commit()

            # Schedule verification after a delay using threading
            from threading import Timer
            from flask import current_app

            # Capture required variables and application context
            flask_app = current_app._get_current_object()

            # Create a closure for delayed verification
            def delayed_verification(checkout_request_id, attempt=1):
                try:
                    # Use the captured flask_app context
                    with flask_app.app_context():
                        from database import db
                        lock = get_transaction_lock(checkout_request_id)
                        with lock:
                            try:
                                payment = Payment.query.filter_by(
                                    transaction_id=checkout_request_id
                                ).first()

                                if not payment or payment.payment_status != 'Pending':
                                    return

                                result = verify_mpesa_payment(checkout_request_id)
                                
                                # Handle errors (e.g., network issues)
                                if 'error' in result:
                                    logger.error(f"Payment verification error: {result['error']}")
                                    if attempt <= 3:
                                        delay = 5 * (2 ** (attempt - 1))
                                        logger.info(f"Scheduling retry {attempt + 1} in {delay}s")
                                        Timer(
                                            delay,
                                            delayed_verification,
                                            args=(checkout_request_id, attempt + 1)
                                        ).start()
                                        return
                                    else:
                                        payment.payment_status = 'Failed'
                                        payment.failure_reason = result.get('error', 'Payment verification failed after retries')
                                        db.session.commit()
                                        return

                                # Handle M-Pesa response codes
                                result_code = result.get('ResultCode')
                                if result_code == '1032' or result_code == '1':
                                    # Transaction canceled by user
                                    payment.payment_status = 'Canceled'
                                    payment.failure_reason = result.get('ResultDesc', 'Payment canceled by user')
                                    
                                    # Update associated tickets
                                    ticket = payment.ticket  # Single ticket since one payment belongs to one ticket
                                    ticket.satus = 'canceled'
                                   
                                    
                                    db.session.commit()
                                    logger.info(f"Payment canceled: {checkout_request_id}")
                                    return
                                
                                elif result_code == '0':
                                    # Successful payment
                                    get_verification_status(result, payment)
                                
                                elif result_code == '2001' or result.get('status') == 'pending':
                                    # Transaction pending, retry if attempts remain
                                    if attempt <= 3:
                                        delay = 5 * (2 ** (attempt - 1))
                                        logger.info(f"Scheduling retry {attempt + 1} in {delay}s for pending transaction")
                                        Timer(
                                            delay,
                                            delayed_verification,
                                            args=(checkout_request_id, attempt + 1)
                                        ).start()
                                    else:
                                        payment.payment_status = 'Failed'
                                        payment.failure_reason = 'Payment pending but max retries reached'
                                        db.session.commit()
                                
                                else:
                                    # Other failure reasons
                                    payment.payment_status = 'Failed'
                                    payment.failure_reason = result.get('ResultDesc', 'Payment failed')
                                    db.session.commit()

                            except SQLAlchemyError as e:
                                logger.error(f"Database error: {str(e)}")
                                db.session.rollback()
                            finally:
                                db.session.remove()

                except Exception as e:
                    logger.error(f"Thread error: {str(e)}")

            # Schedule initial verification
            Timer(
                5,  # Initial delay
                delayed_verification,
                args=(checkout_request_id,),
                kwargs={'attempt': 1}
            ).start()

            return success_response(
                message="Payment initiated successfully. Please complete on your phone.",
                data={"CheckoutRequestID": checkout_request_id},
                status_code=200
            )
            
        except Exception as e:
            logger.error(f"Error processing ticket purchase: {str(e)}")
            db.session.rollback()
            return error_response(f"Error: {str(e)}", 500)
        
            
# class PaymentStatusResource(Resource):
#     """Resource for checking payment status"""
    
#     @jwt_required()
def get_verification_status(result, payment):
    """Check payment status for a given checkout request ID"""
    try:
        # First verify the payment is actually successful
        if result.get('ResultCode') != '0':
            payment.payment_status = 'Failed'
            payment.failure_reason = result.get('ResultDesc', 'Payment verification failed')
            db.session.commit()
            logger.info(f"Payment verification failed for payment ID: {payment.id}")
            return False
        
        # Update payment status for successful transaction
        payment.payment_status = 'Completed'
        payment.mpesa_receipt_no = result.get('MpesaReceiptNumber')
        payment.payment_date = datetime.now()

        # Update ticket status
        ticket = Ticket.query.get(payment.ticket_id)
        if ticket:
            ticket.satus = 'purchased'
            ticket_type = TicketType.query.get(ticket.ticket_type_id)
            if ticket_type:
                ticket_type.tickets_sold += ticket.quantity

        # Commit changes
        db.session.commit()

        # Send confirmation email only for completed payments
        logger.info(f"Sending ticket email for payment ID: {payment.id}")
        send_ticket_qr_email(ticket)
        return True

    except Exception as e:
        logger.error(f"Payment processing failed: {str(e)}")
        db.session.rollback()
        return False

def send_ticket_qr_email( ticket):
    """Send ticket email with properly attached QR code"""
    
    
    user = User.query.get(ticket.attendee.user_id)
    
    try:
        # Validate essential data
        if not all([ticket, ticket.qr_code, user.email, ticket.event]):
            logging.error(f"Missing data - Ticket: {bool(ticket)}, QR: {bool(ticket.qr_code)}, User: {user}")
            return

        
        qr_filename, qr_data = generate_qr_attachment(ticket)
        
        # Create email message
        msg = create_email_message(user, ticket, qr_filename, qr_data)
        
        # Send with retry logic
        send_email_with_retry(msg, retries=2)
        
    except Exception as e:
        logging.error(f"Ticket email failed: {str(e)}")

def generate_qr_attachment(ticket):
    """Generate QR code file with enhanced security and visual appeal"""
    try:
        # Create verification URL using ticket ID as the primary identifier
        verification_url = f"{Config2.BASE_URL}/verify/ticket/{ticket.id}"
        
        # Create QR code with enhanced settings
        qr = qrcode.QRCode(
            version=None, 
            error_correction=qrcode.constants.ERROR_CORRECT_H,  
            box_size=10, 
            border=4,  
        )
        
        qr.add_data(verification_url)
        qr.make(fit=True)
        
        img = qr.make_image(
            fill_color="#1a1a1a", 
            back_color="#ffffff",  
            image_factory=None  
        )
        
        # Convert to PNG with high quality
        img_buffer = BytesIO()
        img.save(img_buffer, format="PNG", quality=100)
        img_buffer.seek(0)
        
        # Generate filename using ticket ID
        filename = f"ticket_{ticket.id}.png"
        
        return (filename, img_buffer.getvalue())
        
    except Exception as e:
        logging.error(f"QR generation failed: {str(e)}")
        raise

def create_email_message(user, ticket, qr_filename, qr_data):
    """Create email message with enhanced styling and layout"""
    try:
        event_date = ticket.event.start_datetime.strftime('%B %d, %Y %H:%M') if not ticket.event.start_datetime else "Date to be announced"
        
        html_content = f"""<!DOCTYPE html>
        <html>
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <style>
                body {{
                    margin: 0;
                    padding: 0;
                    font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
                    background-color: #f5f5f5;
                }}
                .email-container {{
                    max-width: 600px;
                    margin: 0 auto;
                    background-color: #ffffff;
                    border-radius: 12px;
                    overflow: hidden;
                    box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
                }}
                .email-header {{
                    background: linear-gradient(135deg, {Config2.BRAND_COLOR}, {Config2.BRAND_COLOR}99);
                    color: white;
                    padding: 30px 20px;
                    text-align: center;
                }}
                .email-header h1 {{
                    margin: 0;
                    font-size: 24px;
                    font-weight: 600;
                }}
                .email-body {{
                    padding: 30px;
                    color: #333333;
                }}
                .greeting {{
                    font-size: 18px;
                    margin-bottom: 25px;
                    color: #444444;
                }}
                .ticket-details {{
                    background-color: #f8f9fa;
                    border-radius: 8px;
                    padding: 20px;
                    margin-bottom: 25px;
                }}
                .detail-item {{
                    display: flex;
                    align-items: center;
                    margin-bottom: 15px;
                    padding-bottom: 15px;
                    border-bottom: 1px solid #e9ecef;
                }}
                .detail-item:last-child {{
                    border-bottom: none;
                    margin-bottom: 0;
                    padding-bottom: 0;
                }}
                .detail-icon {{
                    width: 24px;
                    height: 24px;
                    margin-right: 15px;
                    color: {Config2.BRAND_COLOR};
                }}
                .detail-content {{
                    flex: 1;
                }}
                .detail-label {{
                    font-size: 14px;
                    color: #6c757d;
                    margin-bottom: 4px;
                }}
                .detail-value {{
                    font-size: 16px;
                    font-weight: 500;
                    color: #212529;
                }}
                .qr-section {{
                    text-align: center;
                    margin: 30px 0;
                    padding: 25px;
                    background-color: #ffffff;
                    border-radius: 8px;
                    border: 1px solid #e9ecef;
                }}
                .qr-box {{
                    display: inline-block;
                    padding: 20px;
                    background-color: #ffffff;
                    border-radius: 8px;
                    box-shadow: 0 2px 4px rgba(0,0,0,0.05);
                }}
                .qr-code-img {{
                    width: 200px;
                    height: 200px;
                    margin: 0 auto;
                    display: block;
                }}
                .qr-instructions {{
                    margin-top: 15px;
                    color: #6c757d;
                    font-size: 14px;
                }}
                .footer {{
                    margin-top: 30px;
                    padding-top: 20px;
                    border-top: 1px solid #e9ecef;
                    text-align: center;
                    color: #6c757d;
                    font-size: 14px;
                }}
                .event-title {{
                    font-size: 20px;
                    font-weight: 600;
                    color: #212529;
                    margin-bottom: 20px;
                }}
                @media only screen and (max-width: 600px) {{
                    .email-container {{
                        border-radius: 0;
                    }}
                    .email-body {{
                        padding: 20px;
                    }}
                    .qr-code-img {{
                        width: 180px;
                        height: 180px;
                    }}
                }}
            </style>
        </head>
        <body>
            <div class="email-container">
                <div class="email-header">
                    <h1>🎟 Your Ticket Confirmation</h1>
                </div>
                
                <div class="email-body">
                    <div class="greeting">
                        Hello {user.first_name} {user.last_name},
                    </div>

                    <div class="ticket-details">
                        <div class="event-title">{ticket.event.title}</div>
                        
                        <div class="detail-item">
                            <div class="detail-icon">📅</div>
                            <div class="detail-content">
                                <div class="detail-label">Event Date & Time</div>
                                <div class="detail-value">{event_date}</div>
                            </div>
                        </div>
                        
                        <div class="detail-item">
                            <div class="detail-icon">📍</div>
                            <div class="detail-content">
                                <div class="detail-label">Location</div>
                                <div class="detail-value">{ticket.event.location}</div>
                            </div>
                        </div>
                        
                        <div class="detail-item">
                            <div class="detail-icon">🎫</div>
                            <div class="detail-content">
                                <div class="detail-label">Number of Tickets</div>
                                <div class="detail-value">{ticket.quantity}</div>
                            </div>
                        </div>
                    </div>

                    <div class="qr-section">
                        <div class="qr-box">
                            <img src="cid:qr_code" 
                                 class="qr-code-img"
                                 alt="Ticket QR Code">
                            <div class="qr-instructions">
                                Present this QR code at the event entrance for scanning
                            </div>
                        </div>
                    </div>
                    
                    <div class="footer">
                        <p>We look forward to seeing you at the event!</p>
                        <p>Best regards,<br><strong>{Config2.EMAIL_SENDER_NAME}</strong></p>
                    </div>
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

Please present the attached QR code at the event entrance for scanning.

We look forward to seeing you at the event!

Best regards,
{Config2.EMAIL_SENDER_NAME}"""

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