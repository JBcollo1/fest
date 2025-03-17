from app.auth import bp
from flask import redirect, url_for, request, jsonify
from flask_jwt_extended import (
    create_access_token, 
    create_refresh_token,
    jwt_required,
    get_jwt_identity
)
from app.models import Users, Roles, UserRoles, Attendees, Organizers, db
from app.utils.validators import validate_email, validate_password, validate_username
from datetime import timedelta

@bp.route('/')
@bp.route('/login', methods=['GET', 'POST'])
def login():
  return "login - auth stuff"

@bp.route('/logout')
def logout():
  # logout function
  return redirect(url_for('main.index'))



@auth_bp.route('/register', methods=['POST'])
def register():
    data = request.get_json()
    
    # Validate required fields
    required_fields = ['username', 'email', 'password', 'first_name', 'last_name']
    for field in required_fields:
        if not data.get(field):
            return jsonify({'error': f'{field} is required'}), 400
            
    # Validate email, username, and password
    if not validate_email(data['email']):
        return jsonify({'error': 'Invalid email format'}), 400
        
    if not validate_username(data['username']):
        return jsonify({'error': 'Username must be 3-50 alphanumeric characters'}), 400
        
    if not validate_password(data['password']):
        return jsonify({'error': 'Password must be at least 8 characters with at least one uppercase, lowercase, number, and special character'}), 400
    
    # Check if user already exists
    if User.query.filter_by(email=data['email']).first():
        return jsonify({'error': 'Email already registered'}), 409
        
    if User.query.filter_by(username=data['username']).first():
        return jsonify({'error': 'Username already taken'}), 409
    
    # Create new user
    new_user = Users(
        username=data['username'],
        email=data['email'],
        first_name=data['first_name'],
        last_name=data['last_name'],
        phone=data.get('phone')
    )
    new_user.set_password(data['password'])
    
    # Get or create attendee role
    attendee_role = Role.query.filter_by(name='attendee').first()
    if not attendee_role:
        attendee_role = Roles(name='attendee', description='Regular user who can attend events')
        db.session.add(attendee_role)
    
    # Add role to user
    db.session.add(new_user)
    db.session.commit()  # Commit to get user.id
    
    # Add user_role
    user_role = UserRoles(user_id=new_user.id, role_id=attendee_role.id)
    db.session.add(user_role)
    
    # Create attendee profile
    attendee = Attendees(user_id=new_user.id)
    db.session.add(attendee)
    
    # Check if user wants to be organizer
    if data.get('is_organizer') and data.get('company_name'):
        organizer_role = Role.query.filter_by(name='organizer').first()
        if not organizer_role:
            organizer_role = Roles(name='organizer', description='User who can create and manage events')
            db.session.add(organizer_role)
            db.session.commit()  # Commit to get role.id
            
        # Add organizer role
        organizer_user_role = UserRoles(user_id=new_user.id, role_id=organizer_role.id)
        db.session.add(organizer_user_role)
        
        # Create organizer profile
        organizer = Organizers(
            user_id=new_user.id,
            company_name=data['company_name'],
            company_image=data.get('company_image'),
            contact_email=data.get('contact_email', new_user.email),
            contact_phone=data.get('contact_phone', new_user.phone)
        )
        db.session.add(organizer)
    
    db.session.commit()
    
    # Generate tokens
    access_token = create_access_token(identity=new_user.id)
    refresh_token = create_refresh_token(identity=new_user.id)
    
    return jsonify({
        'message': 'User registered successfully',
        'user': new_user.to_dict(),
        'access_token': access_token,
        'refresh_token': refresh_token
    }), 201

@auth_bp.route('/login', methods=['POST'])
def login():
    data = request.get_json()
    
    if not data.get('username') and not data.get('email'):
        return jsonify({'error': 'Username or email is required'}), 400
        
    if not data.get('password'):
        return jsonify({'error': 'Password is required'}), 400
    
    # Find user by username or email
    user = None
    if data.get('username'):
        user = User.query.filter_by(username=data['username']).first()
    else:
        user = User.query.filter_by(email=data['email']).first()
    
    if not user or not user.check_password(data['password']):
        return jsonify({'error': 'Invalid credentials'}), 401
    
    # Generate tokens
    access_token = create_access_token(identity=user.id)
    refresh_token = create_refresh_token(identity=user.id)
    
    # Get user roles
    user_roles = [role.name for role in user.roles]
    
    return jsonify({
        'message': 'Login successful',
        'user': user.to_dict(),
        'roles': user_roles,
        'access_token': access_token,
        'refresh_token': refresh_token
    }), 200

@auth_bp.route('/refresh', methods=['POST'])
@jwt_required(refresh=True)
def refresh():
    current_user_id = get_jwt_identity()
    new_access_token = create_access_token(identity=current_user_id)
    
    return jsonify({
        'access_token': new_access_token
    }), 200

@auth_bp.route('/me', methods=['GET'])
@jwt_required()
def get_me():
  current_user_id = get_jwt_identity()
  user = User.query.get(current_user_id)
  
  if not user:
    return jsonify({'error': 'User not found'}), 404
  
  # Get user roles
  user_roles = [role.name for role in user.roles]
  
  # Check if user is organizer
  is_organizer = 'organizer' in user_roles
  organizer_data = None
  if is_organizer and user.organizer:
    organizer_data = user.organizer.to_dict()
  
  # Check if user is attendee
  is_attendee = 'attendee' in user_roles
  attendee_data = None
  if is_attendee and user.attendee:
    attendee_data = user.attendee.to_dict()
  
  return jsonify({
      'user': user.to_dict(),
      'roles': user_roles,
      'is_organizer': is_organizer,
      'organizer': organizer_data,
      'is_attendee': is_attendee,
      'attendee': attendee_data
  }), 200

def has_role(user_id, role_name):
  user = User.query.get(user_id)
  if not user:
    return False
  
  for role in user.roles:
    if role.name == role_name:
      return True
  
  return False

