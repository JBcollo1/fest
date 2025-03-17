from flask_jwt_extended import get_jwt_identity, verify_jwt_in_request, create_access_token
from functools import wraps
from flask import jsonify
from models import User

def admin_required(f):
  # endpoints that require admin role
    @wraps(f)
    def decorated(*args, **kwargs):
        verify_jwt_in_request()
        current_user_id = get_jwt_identity()
        user = User.query.get(current_user_id)
        
        if not user or not user.has_role('admin'):
            return jsonify({"message": "Admin privileges required"}), 403
        return f(*args, **kwargs)
    return decorated

def organizer_required(f):
    @wraps(f)
    def decorated(*args, **kwargs):
        verify_jwt_in_request()
        current_user_id = get_jwt_identity()
        user = User.query.get(current_user_id)
        
        if not user or not user.has_role('organizer') or not user.has_role('admin'):
            return jsonify({"message": "Organizer privileges required"}), 403
        return f(*args, **kwargs)
    return decorated

def generate_tokens(user_id):
    access_token = create_access_token(identity=user_id)
    return {
        'access_token': access_token,
        'token_type': 'bearer'
    }