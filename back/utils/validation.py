from utils.response import error_response

#  validate username email and password. might remove cause of oauth
"""
validations to add to routes
if not validate_email(data['email']):
        return jsonify({'error': 'Invalid email format'}), 400
        
if not validate_username(data['username']):
    return jsonify({'error': 'Username must be 3-50 alphanumeric characters'}), 400
    
if not validate_password(data['password']):
    return jsonify({'error': 'Password must be at least 8 characters with at least one uppercase, lowercase, number, and special character'}), 400
    
"""

def validate_username(username):
    if not username:
        return None, error_response("Username is required", 400)

    #alphanumeric and between 3 and 20 characters
    if not re.match(r'^[a-zA-Z0-9_]{3,20}$', username):
        return None, error_response("Username must be 3-20 characters long", 400)
    
    return username, None
    
def validate_email(email):
    import re
    
    if not email:
        return None, error_response("Email is required", 400)
    
    # hmmm.. need to find better way to do this .co.ke ?
    pattern = r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$'
    if not re.match(pattern, email):
        return None, error_response("Invalid email format", 400)
    
    return email, None

def validate_password_strength(password):
    if not password:
        return None, error_response("Password is required", 400)
    
    if len(password) < 8:
        return None, error_response("Password must be at least 8 characters long", 400)
    
    import re
    pattern = r'^(?=.*[A-Z])(?=.*[a-z])(?=.*\d).{8,}$'
    if not re.match(pattern, password):
        return None, error_response(
            "Password must be at least 8 characters long and contain at least one uppercase letter, one lowercase letter, and one digit",
            400
        )
    
    return password, None

def validate_discount_code(discount_code_str, current_time=None):
    
    # Returns:   tuple (discount_code object, error_response or None)
    from models import DiscountCode
    
    if not discount_code_str:
        return None, error_response("Discount code is required", 400)
    
    discount_code = DiscountCode.query.filter_by(code=discount_code_str).first()
    
    if not discount_code:
        return None, error_response("Invalid discount code", 400)
    
    # if not discount_code.is_valid(current_time):
    #     return None, error_response("Discount code has expired or is not yet valid", 400)
    
    return discount_code, None