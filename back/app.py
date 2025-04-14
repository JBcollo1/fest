from flask_restful import Api
from flask_cors import CORS
from flask_sqlalchemy import SQLAlchemy
from flask_migrate import Migrate
from flask_jwt_extended import JWTManager
# from config import Config
from datetime import timedelta
import os
# from redis_client import redis_client
import sys
from config2 import Config2
import cloudinary
from cloudinary import uploader, utils
from stats import StatsResource  
from database import db
from email_service import  mail  
# from email_resource import EmailResource, EmailWithQRResource  # Import the EmailResource and EmailWithQRResource
from app2 import app



app.config.from_object(Config2)
mail.init_app(app)

# Database Configuration
DATABASE_URL = os.getenv("EXTERNAL_DATABASE_URL") or os.getenv("INTERNAL_DATABASE_URL") or \
               'sqlite:///' + os.path.join(os.path.abspath(os.path.dirname(__file__)), 'app.db')
app.config['SQLALCHEMY_DATABASE_URI'] = DATABASE_URL
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False


db.init_app(app)


migrate = Migrate(app, db)

# JWT Configuration
app.config['JWT_SECRET_KEY'] = os.getenv('JWT_SECRET_KEY', 'fallback-secret-key')  
app.config['JWT_TOKEN_LOCATION'] = ['cookies']  
app.config['JWT_ACCESS_COOKIE_NAME'] = 'access_token_cookie'
app.config['JWT_HEADER_NAME'] = 'Authorization'
app.config['JWT_HEADER_TYPE'] = 'Bearer'
app.config['JWT_COOKIE_CSRF_PROTECT'] = False 
app.config['JWT_COOKIE_SECURE'] = True  # Ensure cookies are only sent over HTTPS
app.config['JWT_COOKIE_SAMESITE'] = "None"  # Allow cross-site cookies
app.config['JWT_ACCESS_TOKEN_EXPIRES'] = timedelta(hours=1)

# Initialize JWT
jwt = JWTManager(app)

# Cloudinary Configuration
cloudinary.config(
    cloud_name=os.getenv('CLOUDINARY_CLOUD_NAME'),
    api_key=os.getenv('CLOUDINARY_API_KEY'),
    api_secret=os.getenv('CLOUDINARY_API_SECRET')
)

# Blocklist token check
@jwt.token_in_blocklist_loader
def check_if_token_in_blocklist(jwt_header, jwt_payload):
    return False

CORS(
    app,
    supports_credentials=True,
    origins=[
        "https://fest-hrrc.onrender.com",
        "https://fikaevents.netlify.app",
        "http://localhost:5173", 
        "http://127.0.0.1:5173"
    ],
    allow_headers=["Content-Type", "Authorization", "Cache-Control", "Pragma"],
    expose_headers=["Set-Cookie"],
    methods=["GET", "POST", "PUT", "DELETE"]
)
api = Api(app)

# Initialize Redis connection
from redis_client import redis_client
try:
    redis_client.ping()
    app.redis_available = True
    print("Redis connection established successfully")
except Exception as e:
    app.redis_available = False
    print(f"Redis connection warning: {str(e)}")

# from models import User, Role, UserRole, Organizer, Attendee, Event, Category, EventCategory, Ticket, DiscountCode, EventDiscountCode, Payment

from users import UserResource, UserListResource, UserLoginResource, UserRolesResource , RoleListResource, CurrentUserResource, LogoutResource, DevAdminResource, TokenRefresh
from events import EventResource, EventListResource, EventCategoriesResource, FeaturedEventsResource
from tickets import (
   
    TicketListResource, 
    UserTicketsResource, 
    TicketVerificationResource
   
  
)
from payments import PaymentResource, PaymentListResource
from categories import CategoryResource, CategoryListResource
from discount_codes import DiscountCodeResource, DiscountCodeListResource, ValidateDiscountCodeResource
from organizer import OrganizerListResource, OrganizerResource, UserOrganizerResource

from cash import  TicketPurchaseResource, MpesaCallbackResource
  



api.add_resource(MpesaCallbackResource, '/mpesa/callback')

# api.add_resource(PaymentStatusResource, '/payment/<string:checkout_request_id>/status')

api.add_resource(UserListResource, '/api/users')
api.add_resource(UserResource, '/api/users/<string:user_id>')
api.add_resource(UserLoginResource, '/api/login')
api.add_resource(UserRolesResource, '/api/users/<string:user_id>/roles')
api.add_resource(RoleListResource, '/api/role')
api.add_resource(TokenRefresh, '/api/refresh')




api.add_resource(EventListResource, '/api/events')
api.add_resource(EventResource, '/api/events/<string:event_id>')
api.add_resource(EventCategoriesResource, '/api/events/<string:event_id>/categories')
api.add_resource(FeaturedEventsResource, '/api/events/featured')
api.add_resource(UserTicketsResource, '/api/users/<string:user_id>/tickets')
api.add_resource(TicketVerificationResource, '/api/tickets/<string:ticket_id>/verify')

# Update the ticket purchase endpoint to use event_id
api.add_resource(TicketPurchaseResource, '/api/events/<string:event_id>/purchase')

# Add the new ticket list endpoint for a specific event
api.add_resource(TicketListResource, '/api/events/<string:event_id>/tickets')

api.add_resource(PaymentListResource, '/api/payments')
api.add_resource(PaymentResource, '/api/payments/<string:payment_id>')

api.add_resource(CategoryListResource, '/api/categories')
api.add_resource(CategoryResource, '/api/categories/<string:category_id>')

api.add_resource(DiscountCodeListResource, '/api/discount-codes')
api.add_resource(DiscountCodeResource, '/api/discount-codes/<string:discount_code_id>')

api.add_resource(ValidateDiscountCodeResource, '/api/discount-codes/validate/<string:code>')

api.add_resource(OrganizerListResource, '/api/organizers')
api.add_resource(OrganizerResource, '/api/organizers/<string:organizer_id>')
api.add_resource(UserOrganizerResource, '/api/users/<string:user_id>/organizer')

api.add_resource(CurrentUserResource, '/api/users/me')
# api.add_resource(LoginResource, '/api/login')
api.add_resource(LogoutResource, '/api/logout')


# dev 
api.add_resource(DevAdminResource, '/api/dev/make-admin')

# Register the callback endpoint

api.add_resource(StatsResource, '/api/stats')  




if __name__ == '__main__':
    app.run(debug=Config2.DEBUG)