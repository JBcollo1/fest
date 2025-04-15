from flask_restful import Resource, reqparse
from flask_jwt_extended import jwt_required, get_jwt_identity
from models import Event, User, Ticket, Payment, TicketType
from utils.response import success_response, error_response
from utils.auth import organizer_required, admin_required
from datetime import datetime, timedelta
from sqlalchemy import func, extract, case, and_, or_
from flask import request
import logging

from database import db

class StatsResource(Resource):
    @jwt_required()
    def get(self):
        try:
            # Get query parameters from request
            page = request.args.get('page', 1, type=int)
            per_page = request.args.get('per_page', 10, type=int)
            time_period = request.args.get('time_period', 'all')  # 'week', 'month', 'year', 'all'
            
            current_user_id = get_jwt_identity()
            user = User.query.get(current_user_id)
            
            if not user:
                return error_response("User not found", 404)
                
            # Define the time filter based on the requested period
            now = datetime.now()
            if time_period == 'week':
                time_filter = now - timedelta(days=7)
            elif time_period == 'month':
                time_filter = now - timedelta(days=30)
            elif time_period == 'year':
                time_filter = now - timedelta(days=365)
            else:  # 'all'
                time_filter = datetime(1970, 1, 1)  # Beginning of time
                
            # For organizers: limit to their events
            # For admins: see all events
            is_admin = user.has_role('admin')
            
            if is_admin:
                # Admin view - all events
                return self._get_admin_stats(user, page, per_page, time_filter)
            elif user.has_role('organizer'):
                # Organizer view - only their events
                return self._get_organizer_stats(user, page, per_page, time_filter)
            else:
                return error_response("Unauthorized access", 403)
                
        except Exception as e:
            logging.error(f"Error in stats endpoint: {str(e)}")
            return error_response(f"Internal server error: {str(e)}", 500)
    
    def _get_organizer_stats(self, user, page, per_page, time_filter):
        """Generate statistics for organizer users"""
        try:
            # First, get the organizer record for this user
            organizer = user.organizer
            
            if not organizer:
                return error_response("Organizer profile not found", 404)
                
            # Query organizer's events with pagination
            events_query = Event.query.filter(Event.organizer_id == organizer.id)
            paginated_events = events_query.paginate(page=page, per_page=per_page)
            
            # Basic metrics for organizer
            total_events = events_query.count()
            
            # Get revenue from tickets for organizer's events
            total_revenue = db.session.query(func.sum(Ticket.price))\
                .join(Event, Ticket.event_id == Event.id)\
                .filter(Event.organizer_id == organizer.id)\
                .filter(Ticket.purchase_date >= time_filter)\
                .scalar() or 0
                
            # Get total tickets sold for organizer's events
            total_tickets = db.session.query(func.count(Ticket.id))\
                .join(Event, Ticket.event_id == Event.id)\
                .filter(Event.organizer_id == organizer.id)\
                .filter(Ticket.purchase_date >= time_filter)\
                .scalar() or 0
                
            # Count active events for organizer
            current_time = datetime.now()
            active_events = events_query.filter(
                Event.start_datetime <= current_time,
                or_(Event.end_datetime == None, Event.end_datetime >= current_time)
            ).count()
            
            # Upcoming events
            upcoming_events = events_query.filter(
                Event.start_datetime > current_time
            ).count()
            
            # Past events
            past_events = events_query.filter(
                Event.end_datetime < current_time
            ).count()
            
            # Calculate monthly revenue for the current year
            monthly_revenue = db.session.query(
                extract('month', Ticket.purchase_date).label('month'),
                func.sum(Ticket.price).label('revenue')
            ).join(
                Event, Ticket.event_id == Event.id
            ).filter(
                Event.organizer_id == organizer.id,
                extract('year', Ticket.purchase_date) == datetime.now().year
            ).group_by(
                extract('month', Ticket.purchase_date)
            ).all()
            
            # Format monthly revenue
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
            
            # Get ticket types distribution
            ticket_types = db.session.query(
                TicketType.name.label('name'),
                func.sum(Ticket.quantity).label('count')
            ).join(
                Ticket, TicketType.id == Ticket.ticket_type_id
            ).join(
                Event, TicketType.event_id == Event.id
            ).filter(
                Event.organizer_id == organizer.id,
                Ticket.purchase_date >= time_filter
            ).group_by(
                TicketType.name
            ).all()
            
            ticket_type_data = [{'name': name, 'value': int(count) if count else 0} for name, count in ticket_types]
            
            # Top performing events by revenue
            top_events = db.session.query(
                Event,
                func.sum(Ticket.price).label('total_revenue'),
                func.count(Ticket.id).label('ticket_count')
            ).join(
                Ticket, Event.id == Ticket.event_id
            ).filter(
                Event.organizer_id == organizer.id,
                Ticket.purchase_date >= time_filter
            ).group_by(
                Event.id
            ).order_by(
                func.sum(Ticket.price).desc()
            ).limit(5).all()
            
            # Format top events
            top_events_data = []
            for event, revenue, ticket_count in top_events:
                if event.start_datetime <= current_time and (event.end_datetime is None or event.end_datetime >= current_time):
                    status = 'active'
                elif event.start_datetime > current_time:
                    status = 'upcoming'
                else:
                    status = 'past'
                    
                top_events_data.append({
                    'id': event.id,
                    'name': event.title,
                    'revenue': float(revenue or 0),
                    'tickets': int(ticket_count or 0),
                    'status': status,
                    'start_date': event.start_datetime.strftime('%Y-%m-%d %H:%M') if event.start_datetime else None
                })
            
            # Sales velocity (tickets sold per day) for the past week
            end_date = datetime.now()
            start_date = end_date - timedelta(days=7)
            
            daily_sales = db.session.query(
                func.date(Ticket.purchase_date).label('date'),
                func.count(Ticket.id).label('count')
            ).join(
                Event, Ticket.event_id == Event.id
            ).filter(
                Event.organizer_id == organizer.id,
                Ticket.purchase_date >= start_date,
                Ticket.purchase_date <= end_date
            ).group_by(
                func.date(Ticket.purchase_date)
            ).all()
            
            # Format daily sales
            daily_sales_data = []
            current_date = start_date
            
            # Create a dictionary for quick lookup
            sales_dict = {date_str: count for date_str, count in daily_sales}
            
            # Fill in all days, even those with no sales
            while current_date <= end_date:
                date_str = current_date.strftime('%Y-%m-%d')
                daily_sales_data.append({
                    'date': date_str,
                    'count': sales_dict.get(date_str, 0)
                })
                current_date += timedelta(days=1)
            
            return {
                "totalRevenue": float(total_revenue),
                "totalTickets": total_tickets,
                "totalEvents": total_events,
                "activeEvents": active_events,
                "upcomingEvents": upcoming_events,
                "pastEvents": past_events,
                "events": [event.to_dict() for event in paginated_events.items],
                "pagination": {
                    "page": paginated_events.page,
                    "pages": paginated_events.pages,
                    "per_page": paginated_events.per_page,
                    "total": paginated_events.total
                },
                "monthlyRevenue": formatted_monthly_revenue,
                "ticketTypes": ticket_type_data,
                "topEvents": top_events_data,
                "dailySales": daily_sales_data,
                "averageTicketPrice": float(total_revenue) / total_tickets if total_tickets > 0 else 0,
                "soldOutEvents": events_query.filter(Event.tickets_sold == Event.total_tickets).count(),
                "conversionRate": {
                    "message": "Conversion tracking requires integration with analytics",
                    "value": None
                }
            }
        except Exception as e:
            logging.error(f"Error in organizer stats: {str(e)}")
            return error_response(f"Error generating organizer statistics: {str(e)}", 500)
    
    def _get_admin_stats(self, user, page, per_page, time_filter):
        """Generate statistics for admin users"""
        try:
            # Use aggregation queries instead of loading all records
            total_revenue = db.session.query(func.sum(Ticket.price))\
                .filter(Ticket.purchase_date >= time_filter)\
                .scalar() or 0
                
            total_tickets = db.session.query(func.count(Ticket.id))\
                .filter(Ticket.purchase_date >= time_filter)\
                .scalar() or 0
                
            total_users = User.query.count()
            total_events = Event.query.count()
            
            # Count active events using efficient SQL
            current_time = datetime.now()
            active_events = Event.query.filter(
                Event.start_datetime <= current_time,
                or_(Event.end_datetime == None, Event.end_datetime >= current_time)
            ).count()
            
            # Calculate monthly revenue using SQL aggregation
            monthly_revenue = db.session.query(
                extract('month', Ticket.purchase_date).label('month'),
                func.sum(Ticket.price).label('revenue')
            ).filter(
                extract('year', Ticket.purchase_date) == datetime.now().year,
                Ticket.purchase_date >= time_filter
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
            paginated_events = Event.query.paginate(page=page, per_page=per_page)
            
            # Get event categories with counts
            try:
                event_categories = db.session.query(
                    Event.categories.any().c.name.label('category'),
                    func.count(Event.id).label('count')
                ).join(
                    Event.categories
                ).filter(
                    Event.created_at >= time_filter
                ).group_by(
                    'category'
                ).all()
                
                category_data = [{'name': cat_name, 'value': count} for cat_name, count in event_categories]
            except Exception as e:
                logging.warning(f"Error fetching event categories: {str(e)}")
                category_data = []  # Return empty list if categories can't be fetched
            
            # Get top 5 performing events by revenue
            top_events_query = db.session.query(
                Event,
                func.sum(Ticket.price).label('total_revenue'),
                func.count(Ticket.id).label('ticket_count')
            ).join(
                Ticket, Event.id == Ticket.event_id
            ).filter(
                Ticket.purchase_date >= time_filter
            ).group_by(
                Event.id
            ).order_by(
                func.sum(Ticket.price).desc()
            ).limit(5)
            
            top_events = []
            for event, revenue, ticket_count in top_events_query:
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
                    'tickets': int(ticket_count or 0),
                    'status': status
                })
            
            # Top organizers by revenue
            top_organizers = db.session.query(
                User.id.label('user_id'),
                User.username.label('username'),
                User.organizer.company_name.label('company_name'),
                func.sum(Ticket.price).label('total_revenue'),
                func.count(Ticket.id).label('ticket_count'),
                func.count(func.distinct(Event.id)).label('event_count')
            ).join(
                User.organizer
            ).join(
                Event, Event.organizer_id == User.organizer.id
            ).join(
                Ticket, Ticket.event_id == Event.id
            ).filter(
                Ticket.purchase_date >= time_filter
            ).group_by(
                User.id, User.username, User.organizer.company_name
            ).order_by(
                func.sum(Ticket.price).desc()
            ).limit(5).all()
            
            top_organizers_data = [{
                'user_id': user_id,
                'username': username,
                'company_name': company_name,
                'revenue': float(revenue or 0),
                'tickets_sold': int(tickets or 0),
                'events': int(events or 0)
            } for user_id, username, company_name, revenue, tickets, events in top_organizers]
            
            # System growth - new users and events per month
            new_users_monthly = db.session.query(
                extract('month', User.created_at).label('month'),
                func.count(User.id).label('count')
            ).filter(
                extract('year', User.created_at) == datetime.now().year
            ).group_by(
                extract('month', User.created_at)
            ).all()
            
            new_events_monthly = db.session.query(
                extract('month', Event.created_at).label('month'),
                func.count(Event.id).label('count')
            ).filter(
                extract('year', Event.created_at) == datetime.now().year
            ).group_by(
                extract('month', Event.created_at)
            ).all()
            
            
            growth_data = []
            for month_num in range(1, 13):
                month_name = datetime(datetime.now().year, month_num, 1).strftime('%B')
                user_count = next((count for m, count in new_users_monthly if int(m) == month_num), 0)
                event_count = next((count for m, count in new_events_monthly if int(m) == month_num), 0)
                growth_data.append({
                    'month': month_name,
                    'new_users': user_count,
                    'new_events': event_count
                })
            
            
            payment_methods = db.session.query(
                Payment.payment_method.label('method'),
                func.count(Payment.id).label('count')
            ).filter(
                Payment.payment_date >= time_filter
            ).group_by(
                Payment.payment_method
            ).all()
            
            payment_methods_data = [{
                'method': method,
                'count': count
            } for method, count in payment_methods]
            
            return {
                "totalRevenue": float(total_revenue),
                "totalTickets": total_tickets,
                "totalUsers": total_users,
                "totalEvents": total_events,
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
                "topEvents": top_events,
                "topOrganizers": top_organizers_data,
                "growthData": growth_data,
                "paymentMethods": payment_methods_data,
                "ticketsPerEvent": float(total_tickets) / total_events if total_events > 0 else 0,
                "revenuePerEvent": float(total_revenue) / total_events if total_events > 0 else 0,
                "revenuePerUser": float(total_revenue) / total_users if total_users > 0 else 0
            }
        except Exception as e:
            logging.error(f"Error in admin stats: {str(e)}")
            return error_response(f"Error generating admin statistics: {str(e)}", 500)