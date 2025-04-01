import uuid
from datetime import datetime
from app import db
from werkzeug.security import generate_password_hash, check_password_hash


class User(db.Model):
  __tablename__ = 'users'
  
  id = db.Column(db.String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
  username = db.Column(db.String(50), unique=True, nullable=False)
  email = db.Column(db.String(100), unique=True, nullable=False)
  password_hash = db.Column(db.String(255), nullable=False)
  first_name = db.Column(db.String(100), nullable=False)
  last_name = db.Column(db.String(100), nullable=False)
  phone = db.Column(db.String(20), nullable=True)
  national_id = db.Column(db.String(50), nullable=True)
  photo_img = db.Column(db.Text, nullable=True)
  next_of_kin_name = db.Column(db.String(100), nullable=True)
  next_of_kin_contact = db.Column(db.String(50), nullable=True)
  created_at = db.Column(db.DateTime, default=datetime.utcnow, nullable=False)
  updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)
  
  roles = db.relationship('Role', secondary='user_roles', backref=db.backref('users', lazy='dynamic'))
  # A user can have multiple roles, and a role can belong to multiple users.
  organizer = db.relationship('Organizer', backref='user', uselist=False)
  attendee = db.relationship('Attendee', backref='user', uselist=False)
    

  def __repr__(self):
    return f'<User {self.username}>' #for debugging api later
    # like this
    # user = User.query.filter_by(username=username).first() 
    # if user:
    #     app.logger.debug(f"Retrieved user: {repr(user)}")  # Uses __repr__()
    #     return jsonify({"message": "User found", "user": repr(user)})
    # else:
    #     app.logger.debug("User not found")
    #     return jsonify({"message": "User not found"}), 404

  def set_password(self, password):
    self.password_hash = generate_password_hash(password)

  def check_password(self, password):
    return check_password_hash(self.password_hash, password)

  # test feature. fetch + relationship data
  def to_dict(self, include_roles=True):
    user_dict = {
      'id': self.id,
      'username': self.username,
      'email': self.email,
      'first_name': self.first_name,
      'last_name': self.last_name,
      'phone': self.phone,
      'national_id': self.national_id,
      'photo_img': self.photo_img,
      'next_of_kin_name': self.next_of_kin_name,
      'next_of_kin_contact': self.next_of_kin_contact,
      'created_at': self.created_at.isoformat() if self.created_at else None,
      'updated_at': self.updated_at.isoformat() if self.updated_at else None
    }
    if include_roles: 
      user_dict['roles']= [role.name for role in self.roles]
    return user_dict

  def has_role(self, role_name):
    return any(role.name == role_name for role in self.roles)

  def add_role(self, role):
    if not self.has_role(role.name):
      self.roles.append(role)


class Role(db.Model):
  __tablename__ = 'roles'
  
  id = db.Column(db.String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
  name = db.Column(db.String(50), unique=True, nullable=False)
  description = db.Column(db.Text, nullable=True)
  
  def __repr__(self):
    return f'<Role {self.name}>'

  def to_dict(self):
    return {
      'id': self.id,
      'name': self.name,
      'description': self.description
    }

class UserRole(db.Model):
  __tablename__ = 'user_roles'
  
  user_id = db.Column(db.String(36), db.ForeignKey('users.id'), primary_key=True)
  role_id = db.Column(db.String(36), db.ForeignKey('roles.id'), primary_key=True)
  created_at = db.Column(db.DateTime, default=datetime.utcnow)

class Organizer(db.Model):
  __tablename__ = 'organizers'
  
  id = db.Column(db.String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
  user_id = db.Column(db.String(36), db.ForeignKey('users.id'), unique=True, nullable=False)
  company_name = db.Column(db.String(255), nullable=False)
  company_image = db.Column(db.Text, nullable=True)
  contact_email = db.Column(db.String(100), nullable=True)
  contact_phone = db.Column(db.String(20), nullable=True)
  kra_pin = db.Column(db.String(50), nullable=True)
  bank_details = db.Column(db.Text, nullable=True)
  physical_address = db.Column(db.Text, nullable=True)
  contact_person = db.Column(db.String(100), nullable=True)
  created_at = db.Column(db.DateTime, default=datetime.utcnow, nullable=False)
  updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)
  
  events = db.relationship('Event', backref='organizer', lazy='dynamic')
  
  def to_dict(self, include_events=False, include_user=False):
    organizer_dict = {
      'id': self.id,
      'user_id': self.user_id,
      'company_name': self.company_name,
      'company_image': self.company_image,
      'contact_email': self.contact_email or self.user.email,
      'contact_phone': self.contact_phone or self.user.phone,
      'kra_pin': self.kra_pin,
      'bank_details': self.bank_details,
      'physical_address': self.physical_address,
      'contact_person': self.contact_person,
      'created_at': self.created_at.isoformat() if self.created_at else None,
      'updated_at': self.updated_at.isoformat() if self.updated_at else None
    }
    
    if include_user:
      organizer_dict['user'] = self.user.to_dict()
        
    if include_events:
      organizer_dict['events'] = [event.to_dict() for event in self.events]

    return organizer_dict

class Attendee(db.Model):
  __tablename__ = 'attendees'
  
  id = db.Column(db.String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
  user_id = db.Column(db.String(36), db.ForeignKey('users.id'), unique=True, nullable=False)
  preferences = db.Column(db.Text, nullable=True)
  created_at = db.Column(db.DateTime, default=datetime.utcnow, nullable=False)
  updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)
  
  tickets = db.relationship('Ticket', backref='attendee', lazy=True)
  
  def to_dict(self):
    return {
      'id': self.id,
      'user_id': self.user_id,
      'preferences': self.preferences,
      'created_at': self.created_at.isoformat() if self.created_at else None,
      'updated_at': self.updated_at.isoformat() if self.updated_at else None
    }


class Event(db.Model):
  __tablename__ = 'events'

  id = db.Column(db.String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
  organizer_id = db.Column(db.String(36), db.ForeignKey('organizers.id'), nullable=False)
  title = db.Column(db.String(255), nullable=False)
  description = db.Column(db.Text, nullable=True)
  start_datetime = db.Column(db.DateTime, nullable=False)
  end_datetime = db.Column(db.DateTime, nullable=True)
  location = db.Column(db.String(255), nullable=False)
 
  currency = db.Column(db.String(10), nullable=False, default='KES')
  image = db.Column(db.Text, nullable=True)
  featured = db.Column(db.Boolean, nullable=False, default=False)
  total_tickets = db.Column(db.Integer, nullable=False)
  tickets_sold = db.Column(db.Integer, nullable=False, default=0)
  created_at = db.Column(db.DateTime, nullable=False, default=datetime.utcnow)
  updated_at = db.Column(db.DateTime, nullable=False, default=datetime.utcnow, onupdate=datetime.utcnow)
  
  categories = db.relationship('Category', secondary='event_categories', backref=db.backref('events', lazy='dynamic'))
  tickets = db.relationship('Ticket', backref='event', lazy='dynamic')
  discount_codes = db.relationship('DiscountCode', secondary='event_discount_codes', backref=db.backref('events', lazy='dynamic'))
  ticket_types = db.relationship('TicketType', backref='event', lazy='dynamic')
  
  def to_dict(self, include_organizer=False):
    event_dict = {
      'id': self.id,
      'organizer_id': self.organizer_id,
      'title': self.title,
      'description': self.description,
      'start_datetime': self.start_datetime.isoformat() if self.start_datetime else None,
      'end_datetime': self.end_datetime.isoformat() if self.end_datetime else None,
      'location': self.location,
     
      'currency': self.currency,
      'image': self.image,
      'featured': self.featured,
      'total_tickets': self.total_tickets,
      'tickets_sold': self.tickets_sold,
      'available_tickets': self.total_tickets - self.tickets_sold,
      'created_at': self.created_at.isoformat() if self.created_at else None,
      'updated_at': self.updated_at.isoformat() if self.updated_at else None,
      'categories': [category.to_dict() for category in self.categories],
      'ticket_types': [ticket_type.to_dict() for ticket_type in self.ticket_types]
    }
    
    if include_organizer:
      event_dict['organizer'] = self.organizer.to_dict()
        
    return event_dict

  def create_ticket_type(self, name, price, quantity, **kwargs):
    ticket_type = TicketType(
      event_id=self.id,
      name=name,
      price=price,
      quantity=quantity,
      currency=kwargs.get('currency', self.currency),
      description=kwargs.get('description'),
      valid_from=kwargs.get('valid_from'),
      valid_to=kwargs.get('valid_to'),
      min_quantity=kwargs.get('min_quantity'),
      max_quantity=kwargs.get('max_quantity'),
      per_person_limit=kwargs.get('per_person_limit'),
      features=kwargs.get('features')
    )
    db.session.add(ticket_type)
    db.session.commit()
    return ticket_type


class Category(db.Model):
  __tablename__ = 'categories'

  id = db.Column(db.String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
  name = db.Column(db.String(100), unique=True, nullable=False)
  
  def to_dict(self):
    return {
        'id': self.id,
        'name': self.name
    }

class EventCategory(db.Model):
  __tablename__ = 'event_categories'

  event_id = db.Column(db.String(36), db.ForeignKey('events.id'), primary_key=True)
  category_id = db.Column(db.String(36), db.ForeignKey('categories.id'), primary_key=True)
  created_at = db.Column(db.DateTime, default=datetime.utcnow)

class Ticket(db.Model):
  __tablename__ = 'tickets'

  id = db.Column(db.String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
  event_id = db.Column(db.String(36), db.ForeignKey('events.id'), nullable=False)
  attendee_id = db.Column(db.String(36), db.ForeignKey('attendees.id'), nullable=False)
  purchase_date = db.Column(db.DateTime, nullable=False, default=datetime.utcnow)
  price = db.Column(db.Numeric(10, 2), nullable=False)
  currency = db.Column(db.String(10), nullable=False, default='KES')
  satus = db.Column(db.String(20), default='valid')
  qr_code = db.Column(db.String(40), unique=True, default=lambda: str(uuid.uuid4()))
  ticket_type_id = db.Column(db.String(36), db.ForeignKey('ticket_types.id'), nullable=True)
  
  payment = db.relationship('Payment', backref='ticket', uselist=False, cascade="all, delete")
  
  def to_dict(self, include_event=False, include_attendee=True, include_payment=True, include_ticket_type=True):
    ticket_dict = {
      'id': self.id,
      'event_id': self.event_id,
      'attendee_id': self.attendee_id,
      'ticket_type_id': self.ticket_type_id,
      'purchase_date': self.purchase_date.isoformat() if self.purchase_date else None,
      'price': float(self.price) if self.price else None,
      'status': self.satus,
      'currency': self.currency,
      'qr_code': self.qr_code
    }
    
    if include_event:
      ticket_dict['event'] = self.event.to_dict()
        
    if include_attendee:
      ticket_dict['attendee'] = self.attendee.to_dict()
        
    if include_payment and self.payment:
      ticket_dict['payment'] = self.payment.to_dict()
        
    if include_ticket_type:
      ticket_dict['ticket_type'] = self.ticket_type.to_dict() if self.ticket_type else None
        
    return ticket_dict

class DiscountCode(db.Model):
  __tablename__ = 'discount_codes'

  id = db.Column(db.String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
  code = db.Column(db.String(50), unique=True, nullable=False)
  description = db.Column(db.Text, nullable=True)
  discount_percentage = db.Column(db.Integer, nullable=False)
  max_uses = db.Column(db.Integer, nullable=False)
  valid_from = db.Column(db.DateTime, nullable=False)
  valid_to = db.Column(db.DateTime, nullable=False)
  created_at = db.Column(db.DateTime, nullable=False, default=datetime.utcnow)
  updated_at = db.Column(db.DateTime, nullable=False, default=datetime.utcnow, onupdate=datetime.utcnow)
  
  def to_dict(self):
    return {
      'id': self.id,
      'code': self.code,
      'description': self.description,
      'discount_percentage': self.discount_percentage,
      'max_uses': self.max_uses,
      'valid_from': self.valid_from.isoformat() if self.valid_from else None,
      'valid_to': self.valid_to.isoformat() if self.valid_to else None,
      'created_at': self.created_at.isoformat() if self.created_at else None,
      'updated_at': self.updated_at.isoformat() if self.updated_at else None
    }
  
  def is_valid(self, current_time=None):
    if current_time is None:
      current_time = datetime.utcnow()
    return (self.valid_from <= current_time) and (current_time <= self.valid_to) # returns true if current_time is between valid datetime period

class EventDiscountCode(db.Model):
  __tablename__ = 'event_discount_codes'

  event_id = db.Column(db.String(36), db.ForeignKey('events.id'), primary_key=True)
  discount_code_id = db.Column(db.String(36), db.ForeignKey('discount_codes.id'), primary_key=True)

class Payment(db.Model):
  __tablename__ = 'payments'

  id = db.Column(db.String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
  ticket_id = db.Column(db.String(36), db.ForeignKey('tickets.id', ondelete='CASCADE'), nullable=False)
  payment_method = db.Column(db.String(50), nullable=False)  # e.g., 'Mpesa', 'PayPal'
  payment_status = db.Column(db.String(50), nullable=False)  # e.g., 'Pending', 'Completed'
  transaction_id = db.Column(db.String(100), unique=True, nullable=False)
  amount = db.Column(db.Numeric(10, 2), nullable=False)
  currency = db.Column(db.String(10), nullable=False, default='KES')
  payment_date = db.Column(db.DateTime, nullable=False, default=datetime.utcnow)
  
  def to_dict(self, include_ticket=False):
    payment_dict = {
      'id': self.id,
      'ticket_id': self.ticket_id,
      'payment_method': self.payment_method,
      'payment_status': self.payment_status,
      'transaction_id': self.transaction_id,
      'amount': float(self.amount) if self.amount else None,
      'currency': self.currency,
      'payment_date': self.payment_date.isoformat() if self.payment_date else None
    }
    
    if include_ticket:
      payment_dict['ticket'] = self.ticket.to_dict()
        
    return payment_dict

class TicketType(db.Model):
    __tablename__ = 'ticket_types'
    
    id = db.Column(db.String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    event_id = db.Column(db.String(36), db.ForeignKey('events.id'), nullable=False)
    name = db.Column(db.String(100), nullable=False)  # e.g., 'Regular', 'VIP', 'Early Bird', 'Group'
    description = db.Column(db.Text, nullable=True)
    price = db.Column(db.Numeric(10, 2), nullable=False)
    currency = db.Column(db.String(10), nullable=False, default='KES')
    quantity = db.Column(db.Integer, nullable=False)  # Number of tickets of this type available
    tickets_sold = db.Column(db.Integer, nullable=False, default=0)
    valid_from = db.Column(db.DateTime, nullable=True)
    valid_to = db.Column(db.DateTime, nullable=True)
    min_quantity = db.Column(db.Integer, nullable=True)
    max_quantity = db.Column(db.Integer, nullable=True)
    per_person_limit = db.Column(db.Integer, nullable=True)
    features = db.Column(db.Text, nullable=True)
    is_active = db.Column(db.Boolean, default=True, nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow, nullable=False)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)
    
    tickets = db.relationship('Ticket', backref='ticket_type', lazy='dynamic')

    def to_dict(self):
        return {
            'id': self.id,
            'event_id': self.event_id,
            'name': self.name,
            'description': self.description,
            'price': float(self.price) if self.price else None,
            'currency': self.currency,
            'quantity': self.quantity,
            'tickets_sold': self.tickets_sold,
            'available': self.quantity - self.tickets_sold,
            'valid_from': self.valid_from.isoformat() if self.valid_from else None,
            'valid_to': self.valid_to.isoformat() if self.valid_to else None,
            'min_quantity': self.min_quantity,
            'max_quantity': self.max_quantity,
            'per_person_limit': self.per_person_limit,
            'features': self.features,
            'is_active': self.is_active,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'updated_at': self.updated_at.isoformat() if self.updated_at else None
        }    

    def is_available(self, quantity):
        return self.quantity - self.tickets_sold >= quantity    