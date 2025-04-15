
# from celery import Celery
# from config3 import Config
# from datetime import datetime, timedelta
# from models import db, Ticket, TicketType, Payment, User, Attendee
# from email_service import send_ticket_qr_email
# import logging
# from redis_client import RedisManager

# # Configu
# logger = logging.getLogger(__name__)

# # Payment status constants
# PAYMENT_STATUS = {
#     'PENDING': 'pending',
#     'COMPLETED': 'completed',
#     'FAILED': 'failed',
#     'CANCELED': 'canceled',
#     'EXPIRED': 'expired'
# }

# # Ticket status constants
# TICKET_STATUS = {
#     'PENDING': 'pending',
#     'PURCHASED': 'purchased',
#     'USED': 'used',
#     'CANCELED': 'canceled',
#     'EXPIRED': 'expired',
#     'PAYMENT_FAILED': 'payment_failed'
# }

# # Initialize Celery
# celery = Celery(__name__)
# celery.conf.update(
#     broker_url=Config.CELERY_BROKER_URL,
#     result_backend=Config.CELERY_RESULT_BACKEND,
#     task_serializer='json',
#     result_serializer='json',
#     accept_content=['json'],
#     worker_max_memory_per_child=25000,
#     task_track_started=True,
#     task_time_limit=300,  # 5 minutes
#     task_soft_time_limit=240,  # 4 minutes
#     task_routes={
#         'tasks.send_ticket_email': {'queue': 'high_priority'},
#         'tasks.cleanup_expired_tickets': {'queue': 'low_priority'}
#     },
#     task_acks_late=True,
#     task_reject_on_worker_lost=True
# )

# @celery.task(bind=True, max_retries=3, queue='high_priority')
# def send_ticket_email(self, ticket_id):
#     """Send ticket email asynchronously with retries"""
#     try:
#         ticket = Ticket.query.get(ticket_id)
#         if not ticket:
#             raise ValueError(f"Ticket {ticket_id} not found")
            
#         # Send email using the email service
#         send_ticket_qr_email(ticket)
#         return {'success': True, 'message': 'Email sent successfully'}
        
#     except Exception as e:
#         logger.error(f"Error sending ticket email: {str(e)}")
#         self.retry(exc=e, countdown=60)

# @celery.task(queue='low_priority')
# def cleanup_expired_tickets():
#     """Clean up expired pending tickets with distributed locking"""
#     redis = RedisManager()
#     lock_name = "cleanup_expired_tickets"
    
#     if not redis.acquire_lock(lock_name):
#         logger.info("Another worker is already cleaning up tickets")
#         return
        
#     try:
#         # Find tickets that have been pending for more than 30 minutes
#         expiry_time = datetime.utcnow() - timedelta(minutes=30)
#         expired_tickets = Ticket.query.filter(
#             Ticket.status == TICKET_STATUS['PENDING'],
#             Ticket.created_at < expiry_time
#         ).all()
        
#         for ticket in expired_tickets:
#             # Use with_for_update() for row-level locking
#             ticket_type = TicketType.query.with_for_update().get(ticket.ticket_type_id)
#             if ticket_type:
#                 # Double check ticket status hasn't changed
#                 if ticket.status != TICKET_STATUS['PENDING']:
#                     continue
                    
#                 # Release the tickets back to available pool
#                 ticket_type.tickets_sold -= ticket.quantity
#                 # Mark ticket as expired
#                 ticket.status = TICKET_STATUS['EXPIRED']
        
#         db.session.commit()
#         return {'success': True, 'message': f'Cleaned up {len(expired_tickets)} expired tickets'}
        
#     except Exception as e:
#         logger.error(f"Error cleaning up expired tickets: {str(e)}")
#         db.session.rollback()
#         return {'success': False, 'error': str(e)}
#     finally:
#         redis.release_lock(lock_name)

# @celery.on_after_configure.connect
# def setup_periodic_tasks(sender, **kwargs):
#     """Setup periodic tasks"""
#     # Clean up expired tickets every 15 minutes
#     sender.add_periodic_task(
#         900.0,  # 15 minutes
#         cleanup_expired_tickets.s(),
#         name='cleanup-expired-tickets'
#     )

