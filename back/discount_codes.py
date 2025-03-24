from flask import request
from flask_restful import Resource
from flask_jwt_extended import jwt_required, get_jwt_identity
from app import db
from models import DiscountCode, Event, User, Organizer, EventDiscountCode
from utils.response import success_response, error_response, paginate_response
from utils.auth import admin_required, organizer_required
from datetime import datetime

class DiscountCodeListResource(Resource):
    @jwt_required()
    @admin_required
    def get(self):
        discount_codes = DiscountCode.query.all()
        return success_response(data=[code.to_dict() for code in discount_codes])
    
    @jwt_required()
    @organizer_required
    def post(self):
        current_user_id = get_jwt_identity()
        data = request.get_json()
        
        required_fields = ['code', 'discount_percentage', 'max_uses', 'valid_from', 'valid_to']
        for field in required_fields:
            if field not in data:
                return error_response(f"Missing required field: {field}")
                
        # Check if code already exists
        if DiscountCode.query.filter_by(code=data['code']).first():
            return error_response("Discount code already exists")
            
        # Validate percentage
        if not 0 <= data['discount_percentage'] <= 100:
            return error_response("Discount percentage must be between 0 and 100")
            
        # Parse dates
        try:
            valid_from = datetime.fromisoformat(data['valid_from'].replace('Z', '+00:00'))
            valid_to = datetime.fromisoformat(data['valid_to'].replace('Z', '+00:00'))
        except ValueError:
            return error_response("Invalid datetime format")
            
        if valid_from >= valid_to:
            return error_response("valid_to must be after valid_from")
            
        # Create new discount code
        new_discount_code = DiscountCode(
            code=data['code'],
            description=data.get('description'),
            discount_percentage=data['discount_percentage'],
            max_uses=data['max_uses'],
            valid_from=valid_from,
            valid_to=valid_to
        )
        
        # Add to events if provided
        if 'event_ids' in data and isinstance(data['event_ids'], list):
            for event_id in data['event_ids']:
                event = Event.query.get(event_id)
                
                # Verify that the user is the organizer of this event
                organizer = Organizer.query.filter_by(user_id=current_user_id).first()
                if not event or (event.organizer_id != organizer.id and not User.query.get(current_user_id).has_role('admin')):
                    continue
                    
                new_discount_code.events.append(event)
                
        try:
            db.session.add(new_discount_code)
            db.session.commit()
            
            return success_response(
                data=new_discount_code.to_dict(),
                message="Discount code created successfully",
                status_code=201
            )
        except Exception as e:
            db.session.rollback()
            return error_response(f"Error creating discount code: {str(e)}")


class DiscountCodeResource(Resource):
    """
    Resource for individual discount code operations
    """
    @jwt_required()
    def get(self, discount_code_id):
        """Get a specific discount code"""
        current_user_id = get_jwt_identity()
        user = User.query.get(current_user_id)
        discount_code = DiscountCode.query.get(discount_code_id)
        
        if not discount_code:
            return error_response("Discount code not found", 404)
            
        # Check if user is admin or has access to this discount code
        if not user.has_role('admin'):
            organizer = Organizer.query.filter_by(user_id=current_user_id).first()
            if not organizer:
                return error_response("Unauthorized", 403)
                
            # Check if any of the user's events use this discount code
            user_event_ids = [event.id for event in organizer.events]
            discount_code_event_ids = [event.id for event in discount_code.events]
            
            if not any(event_id in discount_code_event_ids for event_id in user_event_ids):
                return error_response("Unauthorized", 403)
                
        return success_response(data=discount_code.to_dict())
    
    @jwt_required()
    def put(self, discount_code_id):
        """Update a specific discount code"""
        current_user_id = get_jwt_identity()
        user = User.query.get(current_user_id)
        discount_code = DiscountCode.query.get(discount_code_id)
        
        if not discount_code:
            return error_response("Discount code not found", 404)
            
        # Check if user is admin or has access to this discount code
        if not user.has_role('admin'):
            organizer = Organizer.query.filter_by(user_id=current_user_id).first()
            if not organizer:
                return error_response("Unauthorized", 403)
                
            # Check if any of the user's events use this discount code
            user_event_ids = [event.id for event in organizer.events]
            discount_code_event_ids = [event.id for event in discount_code.events]
            
            if not any(event_id in discount_code_event_ids for event_id in user_event_ids):
                return error_response("Unauthorized", 403)
                
        data = request.get_json()
        
        # Update fields if provided
        if 'description' in data:
            discount_code.description = data['description']
            
        if 'discount_percentage' in data:
            if not 0 <= data['discount_percentage'] <= 100:
                return error_response("Discount percentage must be between 0 and 100")
            discount_code.discount_percentage = data['discount_percentage']
            
        if 'max_uses' in data:
            discount_code.max_uses = data['max_uses']
            
        if 'valid_from' in data:
            try:
                discount_code.valid_from = datetime.fromisoformat(data['valid_from'].replace('Z', '+00:00'))
            except ValueError:
                return error_response("Invalid valid_from format")
                
        if 'valid_to' in data:
            try:
                discount_code.valid_to = datetime.fromisoformat(data['valid_to'].replace('Z', '+00:00'))
            except ValueError:
                return error_response("Invalid valid_to format")
                
        if discount_code.valid_from >= discount_code.valid_to:
            return error_response("valid_to must be after valid_from")
            
        # Update events if provided (admin only)
        if 'event_ids' in data and isinstance(data['event_ids'], list) and user.has_role('admin'):
            # Clear existing events
            discount_code.events = []
            
            # Add new events
            for event_id in data['event_ids']:
                event = Event.query.get(event_id)
                if event:
                    discount_code.events.append(event)
                    
        try:
            db.session.commit()
            return success_response(
                data=discount_code.to_dict(),
                message="Discount code updated successfully"
            )
        except Exception as e:
            db.session.rollback()
            return error_response(f"Error updating discount code: {str(e)}")
    
    @jwt_required()
    def delete(self, discount_code_id):
        """Delete a specific discount code"""
        current_user_id = get_jwt_identity()
        user = User.query.get(current_user_id)
        discount_code = DiscountCode.query.get(discount_code_id)
        
        if not discount_code:
            return error_response("Discount code not found", 404)
            
        # Only admins can delete discount codes
        if not user.has_role('admin'):
            return error_response("Unauthorized", 403)
            
        try:
            db.session.delete(discount_code)
            db.session.commit()
            return success_response(message="Discount code deleted successfully")
        except Exception as e:
            db.session.rollback()
            return error_response(f"Error deleting discount code: {str(e)}")


class ValidateDiscountCodeResource(Resource):
    """
    Resource for validating discount codes
    """
    def get(self, code):
        """Validate a discount code"""
        discount_code = DiscountCode.query.filter_by(code=code).first()
        
        if not discount_code:
            return error_response("Invalid discount code", 404)
            
        # Check if code is valid
        current_time = datetime.utcnow()
        is_valid = discount_code.is_valid(current_time)
        
        if not is_valid:
            return error_response("Discount code has expired")
            
        # Return discount code details
        return success_response(
            data={
                'discount_code': discount_code.to_dict(),
                'is_valid': True,
                'events': [event.id for event in discount_code.events]
            }
        )