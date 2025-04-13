from flask_restful import Resource, reqparse
from flask_jwt_extended import jwt_required, get_jwt_identity
# from app import db
from models import Event, User, Ticket, Payment
from utils.response import success_response, error_response
from utils.auth import organizer_required, admin_required
from datetime import datetime
from sqlalchemy import func, extract, case, and_

from database import db
class StatsResource(Resource):
    @jwt_required()
    @admin_required
    def get(self):
        parser = reqparse.RequestParser()
        parser.add_argument('page', type=int, default=1)
        parser.add_argument('per_page', type=int, default=10)
        args = parser.parse_args()
        
        current_user_id = get_jwt_identity()
        user = User.query.get(current_user_id)

        if user.has_role('admin'):
            # Use aggregation queries instead of loading all records
            total_revenue = db.session.query(func.sum(Ticket.price)).scalar() or 0
            total_tickets = db.session.query(func.count(Ticket.id)).scalar() or 0
            total_users = User.query.count()
            
            # Count active events using efficient SQL
            current_time = datetime.now()
            active_events = Event.query.filter(
                Event.start_datetime <= current_time,
                (Event.end_datetime == None) | (Event.end_datetime >= current_time)
            ).count()
            
            # Calculate monthly revenue using SQL aggregation
            monthly_revenue = db.session.query(
                extract('month', Ticket.purchase_date).label('month'),
                func.sum(Ticket.price).label('revenue')
            ).filter(
                extract('year', Ticket.purchase_date) == datetime.now().year
            ).group_by(
                extract('month', Ticket.purchase_date)
            ).all()
            
            formatted_monthly_revenue = []
            for month_num, revenue in monthly_revenue:
                month_name = datetime(datetime.now().year, int(month_num), 1).strftime('%B')
                formatted_monthly_revenue.append({
                    'name': month_name,
                    'revenue': float(revenue or 0)
                })
            
            # Fill in missing months with zero values
            month_dict = {item['name']: item for item in formatted_monthly_revenue}
            for month_num in range(1, 13):
                month_name = datetime(datetime.now().year, month_num, 1).strftime('%B')
                if month_name not in month_dict:
                    formatted_monthly_revenue.append({'name': month_name, 'revenue': 0.0})
            
            # Sort by month number
            formatted_monthly_revenue.sort(key=lambda x: datetime.strptime(x['name'], '%B').month)
            
            # Paginate events for the response
            paginated_events = Event.query.paginate(page=args['page'], per_page=args['per_page'])
            
            # Get event categories with counts
            event_categories = db.session.query(
                func.count(Event.id).label('count')
            ).join(
                Event.categories
            ).group_by(
                'categories.name'
            ).all()
            
            category_data = [{'name': cat_name, 'value': count} for cat_name, count in event_categories]
            
            # Get top 5 performing events by revenue
            top_events_query = db.session.query(
                Event,
                func.sum(Ticket.price).label('total_revenue'),
                func.count(Ticket.id).label('ticket_count')
            ).join(
                Ticket, Event.id == Ticket.event_id
            ).group_by(
                Event.id
            ).order_by(
                func.sum(Ticket.price).desc()
            ).limit(5)
            
            top_events = []
            for event, revenue, ticket_count in top_events_query:
                current_time = datetime.now()
                if event.start_datetime <= current_time and (event.end_datetime is None or event.end_datetime >= current_time):
                    status = 'active'
                elif event.start_datetime > current_time:
                    status = 'upcoming'
                else:
                    status = 'past'
                    
                top_events.append({
                    'id': event.id,
                    'name': event.title,
                    'organizer': event.organizer.company_name,
                    'revenue': float(revenue or 0),
                    'tickets': event.tickets_sold,
                    'status': status
                })
        else:
            if not user.organizer:
                return error_response("User is not an organizer", 403)
                
            # Filter queries for this organizer only
            organizer_id = user.organizer.id
            
            # Get stats for this organizer's events only
            event_ids = db.session.query(Event.id).filter(Event.organizer_id == organizer_id).all()
            event_ids = [event_id for (event_id,) in event_ids]
            
            if not event_ids:
                return {
                    "totalRevenue": 0,
                    "totalTickets": 0,
                    "totalUsers": None,
                    "activeEvents": 0,
                    "events": [],
                    "tickets": [],
                    "monthlyRevenue": [],
                    "eventCategories": [],
                    "topEvents": []
                }
                
            total_revenue = db.session.query(func.sum(Ticket.price)).filter(Ticket.event_id.in_(event_ids)).scalar() or 0
            total_tickets = db.session.query(func.count(Ticket.id)).filter(Ticket.event_id.in_(event_ids)).scalar() or 0
            total_users = None  # Organizers don't need total user count
            
            # Count active events for this organizer
            current_time = datetime.now()
            active_events = Event.query.filter(
                Event.organizer_id == organizer_id,
                Event.start_datetime <= current_time,
                (Event.end_datetime == None) | (Event.end_datetime >= current_time)
            ).count()
            
            # Calculate monthly revenue for this organizer
            monthly_revenue = db.session.query(
                extract('month', Ticket.purchase_date).label('month'),
                func.sum(Ticket.price).label('revenue')
            ).filter(
                extract('year', Ticket.purchase_date) == datetime.now().year,
                Ticket.event_id.in_(event_ids)
            ).group_by(
                extract('month', Ticket.purchase_date)
            ).all()
            
            formatted_monthly_revenue = []
            for month_num, revenue in monthly_revenue:
                month_name = datetime(datetime.now().year, int(month_num), 1).strftime('%B')
                formatted_monthly_revenue.append({
                    'name': month_name,
                    'revenue': float(revenue or 0)
                })
            
            # Fill in missing months with zero values
            month_dict = {item['name']: item for item in formatted_monthly_revenue}
            for month_num in range(1, 13):
                month_name = datetime(datetime.now().year, month_num, 1).strftime('%B')
                if month_name not in month_dict:
                    formatted_monthly_revenue.append({'name': month_name, 'revenue': 0.0})
            
            # Sort by month number
            formatted_monthly_revenue.sort(key=lambda x: datetime.strptime(x['name'], '%B').month)
            
            # Paginate events for this organizer
            paginated_events = Event.query.filter(Event.organizer_id == organizer_id).paginate(page=args['page'], per_page=args['per_page'])
            
            # Top events for this organizer
            top_events_query = db.session.query(
                Event,
                func.sum(Ticket.price).label('total_revenue'),
                func.count(Ticket.id).label('ticket_count')
            ).join(
                Ticket, Event.id == Ticket.event_id
            ).filter(
                Event.organizer_id == organizer_id
            ).group_by(
                Event.id
            ).order_by(
                func.sum(Ticket.price).desc()
            ).limit(5)
            
            top_events = []
            for event, revenue, ticket_count in top_events_query:
                current_time = datetime.now()
                if event.start_datetime <= current_time and (event.end_datetime is None or event.end_datetime >= current_time):
                    status = 'active'
                elif event.start_datetime > current_time:
                    status = 'upcoming'
                else:
                    status = 'past'
                    
                top_events.append({
                    'id': event.id,
                    'name': event.title,
                    'organizer': event.organizer.company_name,
                    'revenue': float(revenue or 0),
                    'tickets': event.tickets_sold,
                    'status': status
                })

        return {
            "totalRevenue": float(total_revenue),
            "totalTickets": total_tickets,
            "totalUsers": total_users,
            "activeEvents": active_events,
            "events": [event.to_dict() for event in paginated_events.items],
            "pagination": {
                "page": paginated_events.page,
                "pages": paginated_events.pages,
                "per_page": paginated_events.per_page,
                "total": paginated_events.total
            },
            "monthlyRevenue": formatted_monthly_revenue,
            "eventCategories": category_data,
            "topEvents": top_events
        }
