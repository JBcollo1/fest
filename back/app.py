from flask import Flask
from flask_restful import Api
from flask_cors import CORS
from flask_sqlalchemy import SQLAlchemy
from flask_migrate import Migrate
from flask_jwt_extended import JWTManager
from config import Config


app = Flask(__name__)
app.config.from_object(Config)

db = SQLAlchemy(app)
migrate = Migrate(app, db)

jwt = JWTManager(app)

CORS(app)
api = Api(app)



from models import User, Role, UserRole, Organizer, Attendee, Event, Category, EventCategory, Ticket, DiscountCode, EventDiscountCode, Payment

from users import UserResource, UserListResource, UserLoginResource, UserRolesResource
from events import EventResource, EventListResource, EventCategoriesResource, FeaturedEventsResource
from tickets import TicketResource, TicketListResource, UserTicketsResource
from payments import PaymentResource, PaymentListResource
from categories import CategoryResource, CategoryListResource
from discount_codes import DiscountCodeResource, DiscountCodeListResource, ValidateDiscountCodeResource

api.add_resource(UserListResource, '/api/users')
api.add_resource(UserResource, '/api/users/<string:user_id>')
api.add_resource(UserLoginResource, '/api/login')
api.add_resource(UserRolesResource, '/api/users/<string:user_id>/roles')

api.add_resource(EventListResource, '/api/events')
api.add_resource(EventResource, '/api/events/<string:event_id>')
api.add_resource(EventCategoriesResource, '/api/events/<string:event_id>/categories')
api.add_resource(FeaturedEventsResource, '/api/events/featured')

api.add_resource(TicketListResource, '/api/tickets')
api.add_resource(TicketResource, '/api/tickets/<string:ticket_id>')
api.add_resource(UserTicketsResource, '/api/users/<string:user_id>/tickets')

api.add_resource(PaymentListResource, '/api/payments')
api.add_resource(PaymentResource, '/api/payments/<string:payment_id>')

api.add_resource(CategoryListResource, '/api/categories')
api.add_resource(CategoryResource, '/api/categories/<string:category_id>')

api.add_resource(DiscountCodeListResource, '/api/discount-codes')
api.add_resource(DiscountCodeResource, '/api/discount-codes/<string:discount_code_id>')

api.add_resource(ValidateDiscountCodeResource, '/api/discount-codes/validate/<string:code>')

if __name__ == '__main__':
    app.run(debug=Config.DEBUG)