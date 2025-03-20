from flask import Flask
from flask_restful import Api
from flask_cors import CORS
from flask_sqlalchemy import SQLAlchemy
from flask_migrate import Migrate
from flask_jwt_extended import JWTManager
from config import Config
from datetime import timedelta


app = Flask(__name__)
app.config.from_object(Config)

db = SQLAlchemy(app)
migrate = Migrate(app, db)

jwt = JWTManager(app)

@jwt.token_in_blocklist_loader
def check_if_token_in_blocklist(jwt_header, jwt_payload):
    return False

app.config['JWT_TOKEN_LOCATION'] = ['cookies']  # Allow both headers and cookies
app.config['JWT_ACCESS_COOKIE_NAME'] = 'access_token_cookie'
app.config['JWT_HEADER_NAME'] = 'Authorization'
app.config['JWT_HEADER_TYPE'] = 'Bearer'
app.config['JWT_COOKIE_CSRF_PROTECT'] = False  # For development, enable in production
app.config['JWT_COOKIE_SECURE'] =   False  # Set to True in production with HTTPS
app.config['JWT_ACCESS_TOKEN_EXPIRES'] = timedelta(hours=1)  # Set an appropriate time
CORS(
    app,
    supports_credentials=True,
    origins=["http://127.0.0.1:5173"],  
    allow_headers=["Content-Type", "Authorization"],
    expose_headers=["Set-Cookie"],
    methods=["GET", "POST", "PUT", "DELETE"]
)
api = Api(app)



from models import User, Role, UserRole, Organizer, Attendee, Event, Category, EventCategory, Ticket, DiscountCode, EventDiscountCode, Payment

from users import UserResource, UserListResource, UserLoginResource, UserRolesResource , RoleListResource, CurrentUserResource, LogoutResource
from events import EventResource, EventListResource, EventCategoriesResource, FeaturedEventsResource
from tickets import TicketResource, TicketListResource, UserTicketsResource, TicketVerificationResource
from payments import PaymentResource, PaymentListResource
from categories import CategoryResource, CategoryListResource
from discount_codes import DiscountCodeResource, DiscountCodeListResource, ValidateDiscountCodeResource
from organizer import OrganizerListResource, OrganizerResource, UserOrganizerResource

api.add_resource(UserListResource, '/api/users')
api.add_resource(UserResource, '/api/users/<string:user_id>')
api.add_resource(UserLoginResource, '/api/login')
api.add_resource(UserRolesResource, '/api/users/<string:user_id>/roles')
api.add_resource(RoleListResource, '/api/role')



api.add_resource(EventListResource, '/api/events')
api.add_resource(EventResource, '/api/events/<string:event_id>')
api.add_resource(EventCategoriesResource, '/api/events/<string:event_id>/categories')
api.add_resource(FeaturedEventsResource, '/api/events/featured')

api.add_resource(TicketListResource, '/api/tickets')
api.add_resource(TicketResource, '/api/tickets/<string:ticket_id>')
api.add_resource(UserTicketsResource, '/api/users/<string:user_id>/tickets')
api.add_resource(TicketVerificationResource, '/api/tickets/<string:ticket_id>/verify')

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

if __name__ == '__main__':
    app.run(debug=Config.DEBUG)