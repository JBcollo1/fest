import base64
import logging
import requests
from datetime import datetime
from requests.auth import HTTPBasicAuth
from flask_restful import Resource
from flask import request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from database import db
from models import Ticket, Event, User, Attendee, Payment, TicketType
from utils.response import success_response, error_response
from datetime import datetime, timedelta
import time
import json
from json.decoder import JSONDecodeError
from flask import g
import threading
from sqlalchemy.exc import SQLAlchemyError
from contextlib import contextmanager
from tasks import send_ticket_email

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

# Payment status constants
PAYMENT_STATUS = {
    'PENDING': 'pending',
    'COMPLETED': 'completed',
    'FAILED': 'failed',
    'CANCELED': 'canceled',
    'EXPIRED': 'expired'
}

# Ticket status constants
TICKET_STATUS = {
    'PENDING': 'pending',
    'PURCHASED': 'purchased',
    'USED': 'used',
    'CANCELED': 'canceled',
    'EXPIRED': 'expired',
    'PAYMENT_FAILED': 'payment_failed'
}

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
            f"{MPESA_BASE_URL}/mpesa/stkpush/v1/processrequest", 
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
    """Verify M-Pesa payment status with proper error handling and cleanup"""
    session = None
    try:
        # Generate a fresh access token for each verification
        access_token = generate_access_token()
        
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
            "CheckoutRequestID": checkout_request_id
        }
        
        headers = {
            "Content-Type": "application/json",
            "Authorization": f"Bearer {access_token}"
        }
        
        # Use session for connection pooling
        session = requests.Session()
        session.mount('https://', requests.adapters.HTTPAdapter(
            pool_connections=100,
            pool_maxsize=100,
            max_retries=3
        ))
        
        response = session.post(
            f"{MPESA_BASE_URL}/mpesa/stkpushquery/v1/query",
            json=payload,
            headers=headers,
            timeout=10
        )

        response.raise_for_status()
        result = response.json()
        
    
        if result.get('errorCode') == '404.001.04':
            logger.error("Authentication error with M-Pesa API. Token may be invalid.")
          
            access_token = generate_access_token()
            headers["Authorization"] = f"Bearer {access_token}"
            
            response = session.post(
                f"{MPESA_BASE_URL}/mpesa/stkpushquery/v1/query",
                json=payload,
                headers=headers,
                timeout=10
            )
            
            response.raise_for_status()
            result = response.json()

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
        logger.error(f"Unexpected error during payment verification: {str(e)}")
        return {"error": str(e)}
    finally:
        if session:
            session.close()

def delayed_verification(checkout_request_id, attempt=1):
    """Handle delayed payment verification with retries"""
    try:
        with transaction_lock(checkout_request_id):
            with db.session.begin():
                payment = Payment.query.filter_by(transaction_id=checkout_request_id).first()
                if not payment or payment.payment_status != PAYMENT_STATUS['PENDING']:
                    return

                result = verify_mpesa_payment(checkout_request_id)
                
                if 'error' in result:
                    logger.error(f"Payment verification error: {result['error']}")
                    if attempt <= 3:
                        delay = 5 * (2 ** (attempt - 1))
                        threading.Timer(delay, delayed_verification, args=(checkout_request_id, attempt + 1)).start()
                        return
                    else:
                        payment.payment_status = PAYMENT_STATUS['FAILED']
                        payment.failure_reason = result.get('error', 'Payment verification failed after retries')
                        return

                result_code = result.get('ResultCode')
                if result_code == '1032' or result_code == '1':
                    payment.payment_status = PAYMENT_STATUS['CANCELED']
                    payment.failure_reason = result.get('ResultDesc', 'Payment canceled by user')
                    ticket = payment.ticket
                    if ticket:
                        ticket.satus = TICKET_STATUS['CANCELED']
                    return
                
                elif result_code == '0':
                    get_verification_status(result, payment)
                
                elif result_code == '2001' or result.get('status') == 'pending':
                    if attempt <= 3:
                        delay = 5 * (2 ** (attempt - 1))
                        threading.Timer(delay, delayed_verification, args=(checkout_request_id, attempt + 1)).start()
                    else:
                        payment.payment_status = PAYMENT_STATUS['FAILED']
                        payment.failure_reason = 'Payment pending but max retries reached'
                
                else:
                    payment.payment_status = PAYMENT_STATUS['FAILED']
                    payment.failure_reason = result.get('ResultDesc', 'Payment failed')

    except SQLAlchemyError as e:
        logger.error(f"Database error: {str(e)}")
        db.session.rollback()
    except Exception as e:
        logger.error(f"Thread error: {str(e)}")
    finally:
        db.session.remove()

class LockManager:
    def __init__(self):
        self._locks = {}
        self._lock = threading.Lock()  

    def get_lock(self, key):
        with self._lock:
            if key not in self._locks:
                self._locks[key] = threading.Lock()
            return self._locks[key]

    def cleanup(self, key):
        with self._lock:
            if key in self._locks:
                del self._locks[key]

lock_manager = LockManager()

@contextmanager
def transaction_lock(checkout_id):
    """Thread-safe transaction lock with timeout"""
    lock = lock_manager.get_lock(checkout_id)
    try:
        # Try to acquire lock with timeout
        if not lock.acquire(timeout=30):  # 30 second timeout
            raise TimeoutError("Could not acquire lock for transaction")
        yield
    finally:
        lock.release()
        # Clean up lock after successful transaction
        lock_manager.cleanup(checkout_id)

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
            
            with transaction_lock(checkout_request_id):
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
                    
                
                    # try:
                        
                    #     send_ticket_qr_email(ticket)
                    # except Exception as email_error:
                    #     logger.error(f"Error sending ticket email: {str(email_error)}")
                    
                    # return {"ResultCode": 0, "ResultDesc": "Success"}, 200
                    
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
                
        except TimeoutError as e:
            logger.error(f"Transaction lock timeout: {str(e)}")
            return {"ResultCode": 1, "ResultDesc": "Transaction processing timeout"}, 503
        except Exception as e:
            logger.error(f"Error processing callback: {str(e)}")
            return {"ResultCode": 1, "ResultDesc": f"Error: {str(e)}"}, 500

class TicketPurchaseResource(Resource):
    """Resource for initiating ticket purchases"""
    
    @jwt_required()
    def post(self):
        """Initiate ticket purchase for an event"""
        try:
            data = request.get_json()
            ticket_type_id = data.get('ticket_type_id')
            quantity = data.get('quantity', 1)
            event_id = data.get('event_id')
            user_id = get_jwt_identity()
            phone_number = data.get('phone_number')
            
            # Get user and create attendee if needed
            user = User.query.get(user_id)
            if not user:
                return {'error': 'User not found'}, 404
                
            attendee = Attendee.query.filter_by(user_id=user.id).first()
            if not attendee:
                attendee = Attendee(
                    user_id=user.id,
                    first_name=user.first_name,
                    last_name=user.last_name,
                    email=user.email,
                    phone=user.phone
                )
                db.session.add(attendee)
                db.session.flush()
            
            # Get ticket type with lock
            ticket_type = TicketType.query.with_for_update().get(ticket_type_id)
            if not ticket_type or ticket_type.event_id != event_id:
                return {'error': 'Invalid ticket type'}, 400
            
            # Validate ticket availability
            available = ticket_type.quantity - ticket_type.tickets_sold
            if available < quantity:
                return {'error': f'Only {available} tickets available'}, 400
            
            # Check if ticket type is still active
            if not ticket_type.is_active:
                return {'error': 'Ticket type is no longer available'}, 400
                
            # Check if ticket type is within valid date range
            now = datetime.utcnow()
            if ticket_type.valid_from and now < ticket_type.valid_from:
                return {'error': 'Ticket type is not yet available'}, 400
            if ticket_type.valid_until and now > ticket_type.valid_until:
                return {'error': 'Ticket type has expired'}, 400
            
            # Create ticket first
            ticket = Ticket(
                event_id=event_id,
                attendee_id=attendee.id,
                ticket_type_id=ticket_type_id,
                price=ticket_type.price * quantity,
                quantity=quantity,
                currency=ticket_type.currency,
                satus='pending'
            )
            
            db.session.add(ticket)
            db.session.flush()  # This will generate the ticket ID
            
            # Update tickets sold count
            ticket_type.tickets_sold += quantity
            
            # Create payment with the ticket ID
            payment = Payment(
                ticket_id=ticket.id,  # Now we have the ticket ID
                payment_method='Mpesa',
                payment_status='Pending',
                transaction_id=None,  # Will be updated after STK push
                amount=ticket.price,
                currency=ticket.currency,
                payment_date=datetime.utcnow()
            )
            
            db.session.add(payment)
            db.session.flush()  # This will generate the payment ID
            
            # Update ticket with payment ID
            ticket.payment_id = payment.id
            
            # Process payment
            stk_response = initiate_mpesa_payment(ticket.price, phone_number)
            
            if "error" in stk_response:
                db.session.rollback()
                return {'error': stk_response.get('error')}, 400
                
            if stk_response.get('ResponseCode') != '0':
                db.session.rollback()
                return {'error': stk_response.get('ResponseDescription')}, 400
                
            checkout_request_id = stk_response.get('CheckoutRequestID')
            if not checkout_request_id:
                db.session.rollback()
                return {'error': 'Missing checkout request ID in payment response'}, 400
            
            # Update payment with transaction ID
            payment.transaction_id = checkout_request_id
            db.session.commit()
            
            # Schedule payment verification
            threading.Timer(
                5,  # Initial delay
                delayed_verification,
                args=(checkout_request_id,)
            ).start()
            
            return {
                'success': True,
                'message': 'Payment initiated successfully. Please complete on your phone.',
                'data': {
                    'CheckoutRequestID': checkout_request_id,
                    'ticket_id': ticket.id
                }
            }
                
        except Exception as e:
            logger.error(f"Error processing ticket purchase: {str(e)}")
            db.session.rollback()
            return {'error': str(e)}, 500

def get_verification_status(result, payment):
    """Check payment status for a given checkout request ID"""
    try:
        result_code = result.get('ResultCode')
        
        if result_code != '0':
            payment.payment_status = 'Failed'
            payment.failure_reason = result.get('ResultDesc', 'Payment verification failed')
            
            # Update associated tickets
            tickets = Ticket.query.filter_by(payment_id=payment.id).all()
            for ticket in tickets:
                ticket.satus = 'payment_failed'
                
            db.session.commit()
            return False
        
        # Update payment status for successful transaction
        payment.payment_status = 'Completed'
        payment.mpesa_receipt_no = result.get('MpesaReceiptNumber')
        payment.payment_date = datetime.now()
        
        # Get associated tickets and update their status
        tickets = Ticket.query.filter_by(payment_id=payment.id).all()
        for ticket in tickets:
            ticket.satus = 'purchased'
            # Send ticket email asynchronously
            send_ticket_email.delay(ticket.id)
        
        db.session.commit()
        
        # Log successful payment
        logger.info(f"Payment {payment.id} completed successfully for amount {payment.amount}")
        return True

    except Exception as e:
        logger.error(f"Payment processing failed: {str(e)}")
        db.session.rollback()
        
        # Update payment status to indicate processing error
        payment.payment_status = 'Error'
        payment.failure_reason = f"Processing error: {str(e)}"
        db.session.commit()
        
        return False