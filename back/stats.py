from flask_restful import Resource
from flask_jwt_extended import jwt_required, get_jwt_identity
# from app import db
from models import Event, User,Ticket
from utils.response import success_response, error_response
from utils.auth import organizer_required, admin_required


class StatsResource(Resource):
    @jwt_required()
    @admin_required
    def get(self):
        current_user_id = get_jwt_identity()
        user = User.query.get(current_user_id)

        if user.has_role('admin'):
            events = Event.query.all()  # Admin can access all events
        else:
            if not user.organizer:
                return error_response("User is not an organizer", 403)  # ✅ Prevents NoneType error
            events = Event.query.filter_by(organizer_id=user.organizer.id).all()

        tickets = Ticket.query.filter(Ticket.event_id.in_([event.id for event in events])).all()

        return {
            "events": [event.to_dict() for event in events],
            "tickets": [ticket.to_dict(include_event=True) for ticket in tickets]  # ✅ Now returns tickets too
        }
