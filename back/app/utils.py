

#  more utils
# role access, 
# Decorator for role-based access control
def role_required(role_name):
  def decorator(fn):
    @jwt_required()
    def wrapper(*args, **kwargs):
      current_user_id = get_jwt_identity()
      
      if not has_role(current_user_id, role_name):
        return jsonify({'error': f'This action requires {role_name} role'}), 403
          
      return fn(*args, **kwargs)
    return wrapper
  return decorator