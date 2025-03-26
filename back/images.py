from flask import request, jsonify
from flask_restful import Resource
from flask_jwt_extended import jwt_required, get_jwt_identity
from werkzeug.utils import secure_filename
import cloudinary.uploader
import cloudinary.utils
from models import User, Organizer
from app import db
import time

ALLOWED_EXTENSIONS = {'png', 'jpg', 'jpeg', 'gif', 'webp'}
MAX_FILE_SIZE = 5 * 1024 * 1024  # 5MB

def allowed_file(filename):
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS

class ImageResource(Resource):
    def get(self, public_id):
        try:
            # Get the current user
            current_user_id = get_jwt_identity()
            user = User.query.get(current_user_id)
            
            if not user:
                return {'error': 'User not found'}, 404

            # Check if this is a private image
            is_private = request.args.get('private', 'false').lower() == 'true'
            
            if is_private:
                # Generate a signed URL with x time expiration for private images
                timestamp = int(time.time()) + 3600  # 1 hour from now
                url = cloudinary.utils.private_download_url(
                    public_id,
                    format=request.args.get('format', 'jpg'),
                    resource_type='image',
                    type='private',
                    expires_at=timestamp
                )
                return {
                    'success': True,
                    'url': url,
                    'expires_at': timestamp
                }, 200
            else:
                result = cloudinary.api.resource(public_id)
                return {
                    'success': True,
                    'url': result['secure_url'],
                    'public_id': result['public_id'],
                    'format': result['format'],
                    'resource_type': result['resource_type'],
                    'created_at': result['created_at'],
                    'width': result['width'],
                    'height': result['height']
                }, 200
        except Exception as e:
            return {'error': str(e)}, 404

    def post(self):
        try:
            if 'file' not in request.files:
                return {'error': 'No file provided'}, 400
                
            file = request.files['file']
            if file.filename == '':
                return {'error': 'No file selected'}, 400
                
            if not allowed_file(file.filename):
                return {'error': 'File type not allowed'}, 400
                
            # Check file size
            file.seek(0, os.SEEK_END)
            size = file.tell()
            file.seek(0)
            
            if size > MAX_FILE_SIZE:
                return {'error': 'File size exceeds 5MB limit'}, 400
            
            filename = secure_filename(file.filename)

            # Check if this should be a private upload
            is_private = request.args.get('private', 'false').lower() == 'true'
            target = request.args.get('target', 'user')

            # Upload parameters
            upload_params = {
                'resource_type': 'image',
                'type': 'private' if is_private else 'upload',
                'access_mode': 'authenticated' if is_private else 'public'
            }

            image_url = None
            try:
                cloudinary_response = cloudinary.uploader.upload(file, **upload_params)
                logging.debug(f"Cloudinary response: {cloudinary_response}")
                
                # For private images, generate a signed URL
                if is_private:
                    timestamp = int(time.time()) + 3600  # 1 hour from now
                    image_url = cloudinary.utils.private_download_url(
                        cloudinary_response['public_id'],
                        format=cloudinary_response.get('format', 'jpg'),
                        resource_type='image',
                        type='private',
                        expires_at=timestamp
                    )
                else:
                    image_url = cloudinary_response['secure_url']
                    
            except Exception as e:
                return {"error": "Failed to upload image", "details": str(e)}, 500

            if image_url:
                # Get the current user
                current_user_id = get_jwt_identity()
                user = User.query.get(current_user_id)
                
                if not user:
                    return {'error': 'User not found'}, 404
                
                # Save the image URL based on target
                if target == 'user':
                    user.photo_img = image_url
                elif target == 'organization':
                    organizer = Organizer.query.filter_by(user_id=current_user_id).first()
                    if not organizer:
                        return {'error': 'Organization not found for this user'}, 404
                    organizer.company_image = image_url
                else:
                    return {'error': 'Invalid target specified'}, 400
                
                try:
                    db.session.commit()
                except Exception as e:
                    db.session.rollback()
                    return {'error': 'Failed to save image URL to database'}, 500

            response_data = {
                'success': True,
                'image_url': image_url,
                'public_id': cloudinary_response['public_id'],
                'is_private': is_private
            }
            
            if is_private:
                response_data['expires_at'] = timestamp
                
            return response_data, 200
            
        except Exception as e:
            return {'error': str(e)}, 500

    @jwt_required()
    def delete(self, public_id):
        try:
            # Check if this is a private image
            is_private = request.args.get('private', 'false').lower() == 'true'
            
            # Delete image from Cloudinary
            result = cloudinary.uploader.destroy(
                public_id,
                resource_type='image',
                type='private' if is_private else 'upload'
            )
            
            if result['result'] == 'ok':
                # Get the current user
                current_user_id = get_jwt_identity()
                user = User.query.get(current_user_id)
                
                if not user:
                    return {'error': 'User not found'}, 404
                
                # Remove the image URL from the database if it matches
                if user.photo_img and public_id in user.photo_img:
                    user.photo_img = None
                
                # Check organization image
                organizer = Organizer.query.filter_by(user_id=current_user_id).first()
                if organizer and organizer.company_image and public_id in organizer.company_image:
                    organizer.company_image = None
                
                try:
                    db.session.commit()
                except Exception as e:
                    db.session.rollback()
                    return {'error': 'Failed to update database'}, 500
                    
                return {'success': True, 'message': 'Image deleted successfully'}, 200
            return {'error': 'Failed to delete image'}, 400
        except Exception as e:
            return {'error': str(e)}, 500

class ImageTransformResource(Resource):
    @jwt_required()
    def post(self, public_id):
        try:
            data = request.get_json()
            transformations = data.get('transformations', [])
            
            return { 'transformations': transformations }
        except Exception as e:
            return {'error': str(e)}, 500
  