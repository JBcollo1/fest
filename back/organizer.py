from flask import request
from flask_restful import Resource
from flask_jwt_extended import jwt_required, get_jwt_identity
from app import db
from models import User, Role, Organizer
from utils.response import success_response, error_response, paginate_response
from utils.auth import admin_required

class OrganizerListResource(Resource):
    """
    Resource for organizer list operations
    """
    @jwt_required()
    @admin_required
    def get(self):
        """Get all organizers (admin only)"""
        organizers = Organizer.query.all()
        return success_response(data=[organizer.to_dict(include_user=True) for organizer in organizers])
    
    @jwt_required()
    @admin_required
    def post(self):
        """Create a new organizer from existing user (admin only)"""
        data = request.get_json()
        
        if 'user_id' not in data:
            return error_response("Missing required field: user_id")
            
        if 'company_name' not in data:
            return error_response("Missing required field: company_name")
            
        # Check if user exists
        user = User.query.get(data['user_id'])
        if not user:
            return error_response("User not found", 404)
            
        # Check if user is already an organizer
        if Organizer.query.filter_by(user_id=data['user_id']).first():
            return error_response("User is already registered as an organizer")
            
        # Create new organizer with additional fields
        new_organizer = Organizer(
            user_id=data['user_id'],
            company_name=data['company_name'],
            company_image=data.get('company_image'),
            contact_email=data.get('contact_email'),
            contact_phone=data.get('contact_phone'),
            kra_pin=data.get('kra_pin'),
            bank_details=data.get('bank_details'),
            physical_address=data.get('physical_address'),
            contact_person=data.get('contact_person')
        )
        
        # Add organizer role to user
        organizer_role = Role.query.filter_by(name='organizer').first()
        if not organizer_role:
            organizer_role = Role(name='organizer', description='Event organizer')
            db.session.add(organizer_role)
            
        if not user.has_role('organizer'):
            user.add_role(organizer_role)
            
        try:
            db.session.add(new_organizer)
            db.session.commit()
            
            return success_response(
                data=new_organizer.to_dict(include_user=True),
                message="Organizer created successfully",
                status_code=201
            )
        except Exception as e:
            db.session.rollback()
            return error_response(f"Error creating organizer: {str(e)}")


class OrganizerResource(Resource):
    """
    Resource for individual organizer operations
    """
    @jwt_required()
    def get(self, organizer_id):
        """Get a specific organizer"""
        organizer = Organizer.query.get(organizer_id)
        
        if not organizer:
            return error_response("Organizer not found", 404)
            
        return success_response(data=organizer.to_dict(include_user=True))
    
    @jwt_required()
    @admin_required
    def put(self, organizer_id):
        """Update a specific organizer (admin only)"""
        organizer = Organizer.query.get(organizer_id)
        
        if not organizer:
            return error_response("Organizer not found", 404)
            
        data = request.get_json()
        
        # Update fields if provided
        if 'company_name' in data:
            organizer.company_name = data['company_name']
        
        # Update fields with correct property names
        if 'bank_details' in data:
            organizer.bank_details = data['bank_details']
        
        if 'kra_pin' in data:
            organizer.kra_pin = data['kra_pin']
            
        if 'company_image' in data:
            organizer.company_image = data['company_image']
            
        if 'contact_person' in data:
            organizer.contact_person = data['contact_person']
            
        if 'physical_address' in data:
            organizer.physical_address = data['physical_address']
            
        if 'contact_email' in data:
            organizer.contact_email = data['contact_email']
            
        if 'contact_phone' in data:
            organizer.contact_phone = data['contact_phone']
            
        try:
            db.session.commit()
            return success_response(
                data=organizer.to_dict(include_user=True),
                message="Organizer updated successfully"
            )
        except Exception as e:
            db.session.rollback()
            return error_response(f"Error updating organizer: {str(e)}")
    
    @jwt_required()
    @admin_required
    def delete(self, organizer_id):
        """Remove organizer status (admin only)"""
        organizer = Organizer.query.get(organizer_id)
        
        if not organizer:
            return error_response("Organizer not found", 404)
            
        user = User.query.get(organizer.user_id)
        
        # Remove organizer role
        organizer_role = Role.query.filter_by(name='organizer').first()
        if organizer_role and user.has_role('organizer'):
            user.roles.remove(organizer_role)
            
        try:
            db.session.delete(organizer)
            db.session.commit()
            return success_response(message="Organizer removed successfully")
        except Exception as e:
            db.session.rollback()
            return error_response(f"Error removing organizer: {str(e)}")


class UserOrganizerResource(Resource):
    """
    Resource for checking if a user is an organizer
    """
    @jwt_required()
    def get(self, user_id):
        """Check if a user is an organizer"""
        user = User.query.get(user_id)
        
        if not user:
            return error_response("User not found", 404)
            
        organizer = Organizer.query.filter_by(user_id=user_id).first()
        
        if not organizer:
            return success_response(data={"is_organizer": False})
            
        return success_response(data={
            "is_organizer": True,
            "organizer": organizer.to_dict()
        })