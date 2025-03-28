from flask import request, jsonify, make_response
from flask_restful import Resource
from werkzeug.security import generate_password_hash, check_password_hash
from flask_jwt_extended import jwt_required, get_jwt_identity, create_access_token, verify_jwt_in_request
from app import db
from models import User, Role, UserRole
from utils.response import success_response, error_response
from utils.auth import admin_required, generate_tokens
from datetime import datetime, timedelta
from werkzeug.utils import secure_filename
import cloudinary.uploader
import cloudinary.utils
import os
import logging
import time

ALLOWED_EXTENSIONS = {'png', 'jpg', 'jpeg', 'gif', 'webp'}
MAX_FILE_SIZE = 5 * 1024 * 1024  # 5MB

def allowed_file(filename):
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS

class UserListResource(Resource):
    @jwt_required()
    # @admin_required
    def get(self):
        # admin only can get all users
        users = User.query.all()
        return success_response(data=[user.to_dict() for user in users])
    
    def post(self):
        try:
            # Handle both JSON and form data
            if request.is_json:
                data = request.get_json()
            else:
                data = request.form.to_dict()
                # Handle file upload if present
                if 'file' in request.files:
                    file = request.files['file']
                    if file.filename != '' and allowed_file(file.filename):
                        # Upload to Cloudinary
                        upload_result = cloudinary.uploader.upload(file)
                        data['photo_img'] = upload_result['secure_url']
            
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
                national_id=data.get('national_id'),
                photo_img=data.get('photo_img'),
                next_of_kin_name=data.get('next_of_kin_name'),
                next_of_kin_contact=data.get('next_of_kin_contact'),
                created_at=datetime.utcnow(),
                updated_at=datetime.utcnow()
            )
            
            new_user.set_password(data['password'])
            
            user_role = Role.query.filter_by(name='user').first()
            if not user_role:
                user_role = Role(name='user', description='Regular user')
                db.session.add(user_role)
            
            new_user.roles.append(user_role)
            
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
                
        except Exception as e:
            return error_response(f"Error processing request: {str(e)}")


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
            
        # Only allow users to access their own data or admin users
        if current_user_id != user_id and not User.query.get(current_user_id).has_role('admin'):
            return error_response("Unauthorized", 403)
            
        return success_response(data=user.to_dict())
    
    @jwt_required()
    def put(self, user_id):
        """Update a specific user"""
        current_user_id = get_jwt_identity()
        user = User.query.get(user_id)
        
        if not user:
            return error_response("User not found", 404)
            
        # Only allow users to update their own data or admin users
        if current_user_id != user_id and not User.query.get(current_user_id).has_role('admin'):
            return error_response("Unauthorized", 403)
        
        # Check if this is a file upload request
        if 'file' in request.files:
            return self.handle_image_upload(user)
            
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
        
        # Update new fields
        if 'photo_img' in data:
            user.photo_img = data['photo_img']
        if 'next_of_kin_contact' in data:
            user.next_of_kin_contact = data['next_of_kin_contact']
        if 'next_of_kin_name' in data:
            user.next_of_kin_name = data['next_of_kin_name']
        
        try:
            db.session.commit()
            return success_response(data=user.to_dict(), message="User updated successfully")
        except Exception as e:
            db.session.rollback()
            return error_response(f"Error updating user: {str(e)}")

    def handle_image_upload(self, user):
        """Handle image upload for user profile"""
        try:
            file = request.files['file']
            if file.filename == '':
                return error_response("No file selected", 400)
                
            if not allowed_file(file.filename):
                return error_response("File type not allowed", 400)
                
            # Check file size
            file.seek(0, os.SEEK_END)
            size = file.tell()
            file.seek(0)
            
            if size > MAX_FILE_SIZE:
                return error_response("File size exceeds 5MB limit", 400)
            
            filename = secure_filename(file.filename)

            # Upload parameters
            upload_params = {
                'resource_type': 'image',
                'type': 'private',
                'access_mode': 'authenticated'
            }

            try:
                cloudinary_response = cloudinary.uploader.upload(file, **upload_params)
                logging.debug(f"Cloudinary response: {cloudinary_response}")
                
                # Generate a signed URL with 1 hour expiration
                timestamp = int(time.time()) + 3600
                image_url = cloudinary.utils.private_download_url(
                    cloudinary_response['public_id'],
                    format=cloudinary_response.get('format', 'jpg'),
                    resource_type='image',
                    type='private',
                    expires_at=timestamp
                )
                
                # Update user's photo
                user.photo_img = image_url
                
                try:
                    db.session.commit()
                except Exception as e:
                    db.session.rollback()
                    return error_response("Failed to save image URL to database", 500)

                response_data = {
                    'success': True,
                    'image_url': image_url,
                    'public_id': cloudinary_response['public_id'],
                    'expires_at': timestamp
                }
                
                return success_response(data=response_data, message="Profile image uploaded successfully")
                    
            except Exception as e:
                return error_response(f"Failed to upload image: {str(e)}", 500)
                
        except Exception as e:
            logging.error(f"Error in profile image upload: {str(e)}")
            return error_response(str(e), 500)
    
    @jwt_required()
    def delete(self, user_id):
        """Delete a specific user"""
        current_user_id = get_jwt_identity()
        user = User.query.get(user_id)
        
        if not user:
            return error_response("User not found", 404)
            
        # Only allow users to delete their own account or admins to delete any account
        if current_user_id != user_id and not User.query.get(current_user_id).has_role('admin'):
            return error_response("Unauthorized", 403)
        
        try:
            # If user has a profile image, delete it from Cloudinary
            if user.photo_img:
                try:
                    # Extract public_id from the URL
                    public_id = user.photo_img.split('/')[-1].split('.')[0]
                    cloudinary.uploader.destroy(public_id, resource_type='image', type='private')
                except Exception as e:
                    logging.error(f"Error deleting image from Cloudinary: {str(e)}")
            
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
                    secure=False,  # Correct for HTTPS
                    samesite='Lax',  # Use 'None' (string) instead of None (Python value)
                    path='/',
                    # domain='fest-hrrc.onrender.com'  
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
    @admin_required
    def get(self, user_id):
        """Get roles for a specific user (admin only)"""
        user = User.query.get(user_id)
        
        if not user:
            return error_response("User not found", 404)
            
        return success_response(data=[role.to_dict() for role in user.roles])
    
    # @jwt_required()
    # @admin_required
    def post(self, user_id):
        """Add a role to a user (admin only)"""
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
    @admin_required
    def delete(self, user_id):
        """Remove a role from a user (admin only)"""
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
        """Create a new role (admin only)"""
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