from flask import request
from flask_restful import Resource
from flask_jwt_extended import jwt_required, get_jwt_identity
from app import db
from models import Payment, Ticket, User, Attendee
from utils.response import success_response, error_response, paginate_response

class PaymentListResource(Resource):
    """
    Resource for payment list operations
    """
    @jwt_required()
    def get(self):
        """Get all payments (Admin only)"""
        current_user_id = get_jwt_identity()
        user = User.query.get(current_user_id)
        
        if not user.has_role('Admin'):
            return error_response("Unauthorized", 403)
            
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
        if not (attendee and attendee.id == ticket.attendee_id) and not user.has_role('Admin'):
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
        
        if not (attendee and attendee.id == ticket.attendee_id) and not user.has_role('Admin'):
            return error_response("Unauthorized", 403)
            
        return success_response(data=payment.to_dict(include_ticket=True))
    
    @jwt_required()
    def put(self, payment_id):
        """Update a payment status (Admin only)"""
        current_user_id = get_jwt_identity()
        user = User.query.get(current_user_id)
        
        if not user.has_role('Admin'):
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