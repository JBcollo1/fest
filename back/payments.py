from flask import request
from flask_restful import Resource
from flask_jwt_extended import jwt_required, get_jwt_identity
from app import db
from models import Payment, Ticket, User, Attendee
from utils.response import success_response, error_response, paginate_response
import logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
from datetime import datetime, timedelta
from sqlalchemy.exc import IntegrityError
from sqlalchemy import and_




class PaymentListResource(Resource):
    """
    Resource for payment list operations
    """
    @jwt_required()
    def get(self):
        """Get all payments (admin only)"""
        current_user_id = get_jwt_identity()
        user = User.query.get(current_user_id)
        
        if not user.has_role('admin'):
            return error_response("Unauthorized", 403)
        cleanup_pending_tickets_and_payments()
        # Build query
        query = Payment.query
        
        # Return paginated results
        return paginate_response(query)
    
    @jwt_required()
    def post(self):
        """Create a payment for a ticket"""
        current_user_id = get_jwt_identity()
        user = User.query.get(current_user_id)
        data = request.get_json()
        
        required_fields = ['ticket_id', 'payment_method', 'transaction_id', 'amount']
        for field in required_fields:
            if field not in data:
                return error_response(f"Missing required field: {field}")
                
        # Check if ticket exists
        ticket = Ticket.query.get(data['ticket_id'])
        if not ticket:
            return error_response("Ticket not found", 404)
            
        # Check if user is authorized to make payment for this ticket
        attendee = Attendee.query.filter_by(user_id=current_user_id).first()
        if not (attendee and attendee.id == ticket.attendee_id) and not user.has_role('admin'):
            return error_response("Unauthorized", 403)
            
        # Check if payment already exists
        existing_payment = Payment.query.filter_by(ticket_id=ticket.id).first()
        if existing_payment:
            return error_response("Payment already exists for this ticket")
            
        # Create payment
        new_payment = Payment(
            ticket_id=ticket.id,
            payment_method=data['payment_method'],
            payment_status='Completed',  # Assuming payment is successful
            transaction_id=data['transaction_id'],
            amount=data['amount'],
            currency=ticket.currency
        )
        
        try:
            db.session.add(new_payment)
            db.session.commit()
            
            return success_response(
                data=new_payment.to_dict(include_ticket=True),
                message="Payment created successfully",
                status_code=201
            )
        except Exception as e:
            db.session.rollback()
            return error_response(f"Error creating payment: {str(e)}")

def cleanup_pending_tickets_and_payments():
    
    try:
        # Delete payments with null ticket IDs
        null_ticket_payments = Payment.query.filter(
            Payment.ticket_id == None
        ).all()
        
        # Track counts for logging
        null_ticket_payment_count = len(null_ticket_payments)
        for payment in null_ticket_payments:
            db.session.delete(payment)

        # Find pending tickets
        pending_tickets = Ticket.query.filter(
            Ticket.status == 'pending'  # Fixed earlier typo
        ).all()

        ticket_count = len(pending_tickets)
        payment_count = 0

        # Delete payments associated with pending tickets
        for ticket in pending_tickets:
            # Find and delete pending payments for this ticket
            pending_payments = Payment.query.filter(
                and_(
                    Payment.ticket_id == ticket.id,
                    Payment.payment_status == 'Pending'
                )
            ).all()
            
            payment_count += len(pending_payments)
            
            # Delete associated payments first
            for payment in pending_payments:
                db.session.delete(payment)
            
            # Then delete the ticket
            db.session.delete(ticket)

        # Commit all changes
        db.session.commit()
        
        logging.info(f"Deleted {null_ticket_payment_count} payments with null ticket IDs, "
                     f"{ticket_count} pending tickets, and {payment_count} associated pending payments.")
    
    except IntegrityError as e:
        db.session.rollback()
        logging.error(f"Integrity error during cleanup: {str(e)}")
        raise
    
    except Exception as e:
        db.session.rollback()
        logging.error(f"Unexpected error during cleanup of pending tickets and payments: {str(e)}")
        raise

class PaymentResource(Resource):
    """
    Resource for individual payment operations
    """
    @jwt_required()
    def get(self, payment_id):
        """Get a specific payment"""
        current_user_id = get_jwt_identity()
        user = User.query.get(current_user_id)
        payment = Payment.query.get(payment_id)
        
        if not payment:
            return error_response("Payment not found", 404)
            
        # Check if user is authorized to view this payment
        ticket = Ticket.query.get(payment.ticket_id)
        attendee = Attendee.query.filter_by(user_id=current_user_id).first()
        
        if not (attendee and attendee.id == ticket.attendee_id) and not user.has_role('admin'):
            return error_response("Unauthorized", 403)
            
        return success_response(data=payment.to_dict(include_ticket=True))
    
    @jwt_required()
    def put(self, payment_id):
        """Update a payment status (admin only)"""
        current_user_id = get_jwt_identity()
        user = User.query.get(current_user_id)
        
        if not user.has_role('admin'):
            return error_response("Unauthorized", 403)
            
        payment = Payment.query.get(payment_id)
        
        if not payment:
            return error_response("Payment not found", 404)
            
        data = request.get_json()
        
        if 'payment_status' in data:
            payment.payment_status = data['payment_status']
            
        try:
            db.session.commit()
            return success_response(
                data=payment.to_dict(),
                message="Payment updated successfully"
            )
        except Exception as e:
            db.session.rollback()
            return error_response(f"Error updating payment: {str(e)}")