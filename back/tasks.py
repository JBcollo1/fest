from celery import Celery
from config3 import Config
from datetime import datetime, timedelta
from models import db, Ticket, TicketType, Payment, User
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
def process_ticket_purchase(self, ticket_data):
    """Process ticket purchase asynchronously"""
    try:
        ticket_type_id = ticket_data.get('ticket_type_id')
        quantity = ticket_data.get('quantity', 1)
        event_id = ticket_data.get('event_id')
        user_id = ticket_data.get('user_id')
        
        # Get ticket type with lock
        ticket_type = TicketType.query.with_for_update().get(ticket_type_id)
        if not ticket_type or ticket_type.event_id != event_id:
            raise ValueError("Invalid ticket type")
        
        # Validate ticket availability
        available = ticket_type.quantity - ticket_type.tickets_sold
        if available < quantity:
            raise ValueError(f"Only {available} tickets available")
        
        # Check if ticket type is still active
        if not ticket_type.is_active:
            raise ValueError("Ticket type is no longer available")
            
        # Check if ticket type is within valid date range
        now = datetime.utcnow()
        if ticket_type.valid_from and now < ticket_type.valid_from:
            raise ValueError("Ticket type is not yet available")
        if ticket_type.valid_until and now > ticket_type.valid_until:
            raise ValueError("Ticket type has expired")
        
        # Create ticket
        ticket = Ticket(
            event_id=event_id,
            attendee_id=user_id,
            ticket_type_id=ticket_type_id,
            price=ticket_type.price * quantity,
            quantity=quantity,
            currency=ticket_type.currency,
            satus='pending'
        )
        
        db.session.add(ticket)
        db.session.flush()
        
        # Update tickets sold count
        ticket_type.tickets_sold += quantity
        
        db.session.commit()
        
        return {
            'success': True,
            'ticket_id': ticket.id,
            'message': 'Ticket created successfully'
        }
        
    except Exception as e:
        logger.error(f"Error processing ticket purchase: {str(e)}")
        db.session.rollback()
        
        # If it's a validation error, don't retry
        if isinstance(e, ValueError):
            return {
                'success': False,
                'error': str(e)
            }
            
        # For other errors, retry with exponential backoff
        retry_delay = 60 * (2 ** self.request.retries)  # 1min, 2min, 4min
        raise self.retry(exc=e, countdown=retry_delay)

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
