from celery import Celery
from config3 import Config
from datetime import datetime, timedelta
from models import db, Ticket, TicketType, Payment, User, Attendee
from email_service import send_ticket_qr_email
import logging

# Configure logging
logger = logging.getLogger(__name__)

# Initialize Celery
celery = Celery(__name__)
celery.conf.update(
    broker_url=Config.CELERY_BROKER_URL,
    result_backend=Config.CELERY_RESULT_BACKEND,
    task_serializer='json',
    result_serializer='json',
    accept_content=['json'],
    worker_max_memory_per_child=25000,
    task_track_started=True,
    task_time_limit=300,  # 5 minutes
    task_soft_time_limit=240  # 4 minutes
)

@celery.task(bind=True, max_retries=3)
def send_ticket_email(self, ticket_id):
    """Send ticket email asynchronously"""
    try:
        ticket = Ticket.query.get(ticket_id)
        if not ticket:
            raise ValueError(f"Ticket {ticket_id} not found")
            
        # Send email using the email service
        send_ticket_qr_email(ticket)
        return {'success': True, 'message': 'Email sent successfully'}
        
    except Exception as e:
        logger.error(f"Error sending ticket email: {str(e)}")
        raise self.retry(exc=e, countdown=60)

@celery.task
def cleanup_expired_tickets():
    """Clean up expired pending tickets"""
    try:
        # Find tickets that have been pending for more than 30 minutes
        expiry_time = datetime.utcnow() - timedelta(minutes=30)
        expired_tickets = Ticket.query.filter(
            Ticket.satus == 'pending',
            Ticket.created_at < expiry_time
        ).all()
        
        for ticket in expired_tickets:
            # Double check ticket status hasn't changed
            if ticket.satus != 'pending':
                logger.warning(f"Ticket {ticket.id} status changed to {ticket.satus}, skipping cleanup")
                continue
                
            # Get ticket type with lock
            ticket_type = TicketType.query.with_for_update().get(ticket.ticket_type_id)
            if ticket_type:
                # Release the tickets back to available pool
                ticket_type.tickets_sold -= ticket.quantity
                # Mark ticket as expired
                ticket.satus = 'expired'
                logger.info(f"Released {ticket.quantity} tickets back to pool for ticket type {ticket_type.id}")
        
        db.session.commit()
        return {'success': True, 'message': f'Cleaned up {len(expired_tickets)} expired tickets'}
        
    except Exception as e:
        logger.error(f"Error cleaning up expired tickets: {str(e)}")
        db.session.rollback()
        return {'success': False, 'error': str(e)}

@celery.on_after_configure.connect
def setup_periodic_tasks(sender, **kwargs):
    """Setup periodic tasks"""
    # Clean up expired tickets every 15 minutes
    sender.add_periodic_task(
        900.0,  # 15 minutes
        cleanup_expired_tickets.s(),
        name='cleanup-expired-tickets'
    )
