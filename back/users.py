from flask import request, jsonify, make_response
from flask_restful import Resource
from werkzeug.security import generate_password_hash, check_password_hash
from flask_jwt_extended import jwt_required, get_jwt_identity, create_access_token, verify_jwt_in_request
from app import db
from models import User, Role, UserRole
from utils.response import success_response, error_response
from utils.auth import Admin_required, generate_tokens
from datetime import datetime, timedelta

class UserListResource(Resource):
    @jwt_required()
    # @Admin_required
    def get(self):
        # Admin only can get all users
        users = User.query.all()
        return success_response(data=[user.to_dict() for user in users])
    
    def post(self):
        data = request.get_json()
        
        required_fields = ['username', 'email', 'password', 'first_name', 'last_name']
        for field in required_fields:
            if field not in data:
                return error_response(f"Missing required field: {field}")
        
        if User.query.filter_by(username=data['username']).first():
            return error_response("Username already exists")
        
        if User.query.filter_by(email=data['email']).first():
            return error_response("Email already exists")
        
        new_user = User(
            username=data['username'],
            email=data['email'],
            first_name=data['first_name'],
            last_name=data['last_name'],
            phone=data.get('phone'),
            created_at=datetime.utcnow(),
            updated_at=datetime.utcnow()
        )
        
        new_user.set_password(data['password'])
        
        user_role = Role.query.filter_by(name='user').first()
        if not user_role:
            user_role = Role(name='user', description='Regular user')
            db.session.add(user_role)
        
        new_user.roles.append(user_role)
        # print(new_user.to_dict()) 
        try:
            db.session.add(new_user)
            db.session.commit()
            
          
            
            return success_response(
                data={
                    'user': new_user.to_dict()
                    
                },
                message="User registered successfully",
                status_code=201
            )
        except Exception as e:
            db.session.rollback()
            return error_response(f"Error creating user: {str(e)}")


class UserResource(Resource):
    """
    Resource for individual user operations
    """
    @jwt_required()
    def get(self, user_id):
        """Get a specific user"""
        current_user_id = get_jwt_identity()
        user = User.query.get(user_id)
        
        if not user:
            return error_response("User not found", 404)
            
        # Only allow users to access their own data or Admin users
        if current_user_id != user_id and not User.query.get(current_user_id).has_role('Admin'):
            return error_response("Unauthorized", 403)
            
        return success_response(data=user.to_dict())
    
    @jwt_required()
    def put(self, user_id):
        """Update a specific user"""
        current_user_id = get_jwt_identity()
        user = User.query.get(user_id)
        
        if not user:
            return error_response("User not found", 404)
            
        # Only allow users to update their own data or Admin users
        if current_user_id != user_id and not User.query.get(current_user_id).has_role('Admin'):
            return error_response("Unauthorized", 403)
        
        data = request.get_json()
        
        # Update fields if provided
        if 'username' in data and data['username'] != user.username:
            if User.query.filter_by(username=data['username']).first():
                return error_response("Username already exists")
            user.username = data['username']
            
        if 'email' in data and data['email'] != user.email:
            if User.query.filter_by(email=data['email']).first():
                return error_response("Email already exists")
            user.email = data['email']
            
        if 'first_name' in data:
            user.first_name = data['first_name']
            
        if 'last_name' in data:
            user.last_name = data['last_name']
            
        if 'phone' in data:
            user.phone = data['phone']
            
        if 'password' in data:
            user.password_hash = generate_password_hash(data['password'])
        
        try:
            db.session.commit()
            return success_response(data=user.to_dict(), message="User updated successfully")
        except Exception as e:
            db.session.rollback()
            return error_response(f"Error updating user: {str(e)}")
    
    @jwt_required()
    def delete(self, user_id):
        """Delete a specific user"""
        current_user_id = get_jwt_identity()
        user = User.query.get(user_id)
        
        if not user:
            return error_response("User not found", 404)
            
        # Only allow users to delete their own account or Admins to delete any account
        if current_user_id != user_id and not User.query.get(current_user_id).has_role('Admin'):
            return error_response("Unauthorized", 403)
        
        try:
            db.session.delete(user)
            db.session.commit()
            return success_response(message="User deleted successfully")
        except Exception as e:
            db.session.rollback()
            return error_response(f"Error deleting user: {str(e)}")

class UserLoginResource(Resource):
    def post(self):
        try:
            data = request.get_json()
            email = data.get('email')
            password = data.get('password')
            
            user = User.query.filter_by(email=email).first()
            if user and user.check_password(password):
                # Create the JWT token
                access_token = create_access_token(identity=user.id)
                
                # Create response
                response = make_response(
                    success_response(
                        data={
                            'user': user.to_dict(),
                            'access_token': access_token
                        },
                        message="Login successful"
                    )
                )
                
                # Set the JWT as an HTTP-only cookie
                response.set_cookie(
                    'access_token_cookie',
                    access_token,
                    httponly=True,
                    secure=False,  # Set to True in production with HTTPS
                    samesite='Lax',
                    path='/',
                    domain=None 
                    
                )
                print("Login attempt for:", email)
                print("Response status:", response.status_code)
                print("Access token generated:", access_token)
                print("Setting cookie with value:", access_token)
                print("Cookies received:", request.cookies.get('access_token_cookie'))
                return response
            
            return error_response("Invalid email or password", 401)
            
        except Exception as e:
            return error_response(str(e))

class UserRolesResource(Resource):
    """
    Resource for managing user roles
    """
    @jwt_required()
    @Admin_required
    def get(self, user_id):
        """Get roles for a specific user (Admin only)"""
        user = User.query.get(user_id)
        
        if not user:
            return error_response("User not found", 404)
            
        return success_response(data=[role.to_dict() for role in user.roles])
    
    # @jwt_required()
    # @Admin_required
    def post(self, user_id):
        """Add a role to a user (Admin only)"""
        user = User.query.get(user_id)
        
        if not user:
            return error_response("User not found", 404)
            
        data = request.get_json()
        
        if 'role_id' not in data:
            return error_response("Missing role_id field")
            
        role = Role.query.get(data['role_id'])
        
        if not role:
            return error_response("Role not found", 404)
            
        if role in user.roles:
            return error_response("User already has this role")
            
        user.roles.append(role)
        
        try:
            db.session.commit()
            return success_response(
                data=[role.to_dict() for role in user.roles],
                message="Role added successfully"
            )
        except Exception as e:
            db.session.rollback()
            return error_response(f"Error adding role: {str(e)}")
    
    @jwt_required()
    @Admin_required
    def delete(self, user_id):
        """Remove a role from a user (Admin only)"""
        user = User.query.get(user_id)
        
        if not user:
            return error_response("User not found", 404)
            
        data = request.get_json()
        
        if 'role_id' not in data:
            return error_response("Missing role_id field")
            
        role = Role.query.get(data['role_id'])
        
        if not role:
            return error_response("Role not found", 404)
            
        if role not in user.roles:
            return error_response("User does not have this role")
            
        user.roles.remove(role)
        
        try:
            db.session.commit()
            return success_response(
                data=[role.to_dict() for role in user.roles],
                message="Role removed successfully"
            )
        except Exception as e:
            db.session.rollback()
            return error_response(f"Error removing role: {str(e)}")
        
class LogoutResource(Resource):
    def post(self):
        response = make_response(success_response(message="Logout successful"))
        response.delete_cookie('access_token_cookie')
        return response
        
class RoleListResource(Resource):
   
    def post(self):
        """Create a new role (Admin only)"""
        data = request.get_json()
        
        if 'name' not in data:
            return error_response("Missing required field: name")
        
        # Check if role already exists
        if Role.query.filter_by(name=data['name']).first():
            return error_response("Role already exists")
        
        new_role = Role(name=data['name'], description=data.get('description'))
        
        try:
            db.session.add(new_role)
            db.session.commit()
            return success_response(
                data=new_role.to_dict(),
                message="Role created successfully",
                status_code=201
            )
        except Exception as e:
            db.session.rollback()
            return error_response(f"Error creating role: {str(e)}")

class CurrentUserResource(Resource):

    @jwt_required()
    def get(self):
        try:
            current_user_id = get_jwt_identity()
            
            user = User.query.get(current_user_id)
            if not user:
                return error_response("User not found", 404)
            
            return success_response(
                data=user.to_dict(),
                message="Current user retrieved successfully"
            )
        except Exception as e:
            print("Error in CurrentUserResource:", str(e))
            return error_response(str(e), 401)