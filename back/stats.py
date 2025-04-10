from flask_restful import Resource
from flask_jwt_extended import jwt_required, get_jwt_identity
# from app import db
from models import Event, User,Ticket
from utils.response import success_response, error_response
from utils.auth import organizer_required, admin_required
from datetime import datetime


class StatsResource(Resource):
    @jwt_required()
    @admin_required
    def get(self):
        current_user_id = get_jwt_identity()
        user = User.query.get(current_user_id)

        if user.has_role('admin'):
            events = Event.query.all()  # Admin can access all events
            tickets = Ticket.query.all()
            total_users = User.query.count()
        else:
            if not user.organizer:
                return error_response("User is not an organizer", 403)
            events = Event.query.filter_by(organizer_id=user.organizer.id).all()
            tickets = Ticket.query.filter(Ticket.event_id.in_([event.id for event in events])).all()
            total_users = None  # Organizers don't need total user count

        total_revenue = float(sum(ticket.price for ticket in tickets))
        total_tickets = len(tickets)
        active_events = len([event for event in events if event.start_datetime <= datetime.now() <= (event.end_datetime or datetime.max)])

        # Calculate monthly revenue
        monthly_revenue = []
        for month in range(1, 13):
            month_start = datetime(datetime.now().year, month, 1)
            month_end = datetime(datetime.now().year, month + 1, 1) if month < 12 else datetime(datetime.now().year + 1, 1, 1)
            month_tickets = [ticket for ticket in tickets if month_start <= ticket.purchase_date < month_end]
            monthly_revenue.append({
                'name': month_start.strftime('%B'),
                'revenue': float(sum(ticket.price for ticket in month_tickets))
            })

        # Determine event categories
        event_categories = {}
        for event in events:
            for category in event.categories:
                if category.name not in event_categories:
                    event_categories[category.name] = 0
                event_categories[category.name] += 1
        event_categories = [{'name': name, 'value': count} for name, count in event_categories.items()]

        # Identify top performing events
        top_events = sorted(events, key=lambda e: sum(ticket.price for ticket in e.tickets), reverse=True)[:5]
        top_events = [{
            'id': event.id,
            'name': event.title,
            'organizer': event.organizer.company_name,
            'revenue': float(sum(ticket.price for ticket in event.tickets)),
            'tickets': event.tickets_sold,
            'status': 'active' if event.start_datetime <= datetime.now() <= (event.end_datetime or datetime.max) else 'upcoming' if event.start_datetime > datetime.now() else 'past'
        } for event in top_events]

        return {
            "totalRevenue": total_revenue,
            "totalTickets": total_tickets,
            "totalUsers": total_users,
            "activeEvents": active_events,
            "events": [event.to_dict() for event in events],
            "tickets": [ticket.to_dict(include_event=True) for ticket in tickets],
            "monthlyRevenue": monthly_revenue,
            "eventCategories": event_categories,
            "topEvents": top_events
        }
