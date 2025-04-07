"""
Utility functions for payment processing
"""
from datetime import datetime
from models import User, Payment, Ticket, TicketType
from cash import verify_mpesa_payment
from cash import send_ticket_qr_email
from app import db, logger

def  get_verification_status(checkout_request_id, user):
    """
    Check payment status for a given checkout request ID
    
    Args:
        checkout_request_id (str): The checkout request ID from M-Pesa
        user_id (int): ID of the user making the payment
    
    Returns:
        dict: Response with payment status information
    """
    try:
        # Get user
        # user = User.query.get(user_id)
        
        if not user:
            logger.error(f"User not found: {user}")
            return {"error": "User not found", "status_code": 404}
            
        # Find payment by checkout request ID
        payment = Payment.query.filter_by(transaction_id=checkout_request_id).first()
        
        if not payment:
            logger.error(f"Payment not found for checkout request ID: {checkout_request_id}")
            return {"error": "Payment not found", "status_code": 404}
            
        # Get ticket
        ticket = Ticket.query.get(payment.ticket_id)
        
        if not ticket:
            logger.error(f"Ticket not found for payment ID: {payment.id}")
            return {"error": "Ticket not found", "status_code": 404}
            
        # If payment is already completed, return success
        if payment.payment_status == 'Completed':
            logger.info(f"Payment already completed for checkout request ID: {checkout_request_id}")
            return {
                "message": "Payment completed successfully",
                "data": {"status": "completed", "receipt": payment.mpesa_receipt_no},
                "status_code": 200
            }
            
        # If payment is already failed, return failure
        if payment.payment_status == 'Failed':
            logger.info(f"Payment already failed for checkout request ID: {checkout_request_id}")
            return {"error": "Payment failed", "status_code": 400}
            
        # Check status with M-Pesa
        verification_result = verify_mpesa_payment(checkout_request_id)
        
        if "error" in verification_result:
            logger.error(f"M-Pesa verification failed: {verification_result.get('error')}")
            return {"error": f"Verification failed: {verification_result.get('error')}", "status_code": 400}
            
        # Process verification result
        result_code = verification_result.get('ResultCode')
        
        if result_code == '0':  # Success
            # Extract payment details
            callback_metadata = verification_result.get('CallbackMetadata', {}).get('Item', [])
            payment_details = {item['Name']: item.get('Value') for item in callback_metadata if 'Value' in item}
            
            # Update payment status
            payment.payment_status = 'Completed'
            payment.mpesa_receipt_no = payment_details.get('MpesaReceiptNumber')
            payment.payment_date = datetime.now()
            
            # Update ticket status
            ticket.satus = 'purchased'
            
            # Update ticket type quantity
            ticket_type = TicketType.query.get(ticket.ticket_type_id)
            if ticket_type:
                ticket_type.tickets_sold += ticket.quantity
            
            # Commit changes
            db.session.commit()
            
            try:
                send_ticket_qr_email(ticket)
            except Exception as email_error:
                logger.error(f"Error sending ticket email: {str(email_error)}")
            
            logger.info(f"Payment completed successfully for checkout request ID: {checkout_request_id}")
            return {
                "message": "Payment completed successfully",
                "data": {"status": "completed", "receipt": payment.mpesa_receipt_no},
                "status_code": 200
            }
        else:
            logger.info(f"Payment still pending for checkout request ID: {checkout_request_id}")
            return {
                "message": "Payment is still pending",
                "data": {"status": "pending"},
                "status_code": 200
            }
            
    except Exception as e:
        logger.error(f"Error checking payment status: {str(e)}")
        return {"error": f"Error: {str(e)}", "status_code": 500}