
# from celery import Celery
# from config3 import Config
# from tasks import cleanup_expired_tickets, send_ticket_email

# celery = Celery(__name__, broker=Config.CELERY_BROKER_URL)
# celery.conf.update(
#     result_backend=Config.CELERY_RESULT_BACKEND,
#     task_serializer='json',
#     result_serializer='json',
#     accept_content=['json'],
#     worker_max_memory_per_child=25000,
#     task_track_started=True,
#     task_time_limit=300,
#     task_soft_time_limit=240,
#     task_routes={
#         'tasks.send_ticket_email': {'queue': 'high_priority'},
#         'tasks.cleanup_expired_tickets': {'queue': 'low_priority'}
#     },
#     task_acks_late=True,
#     task_reject_on_worker_lost=True
# )

# @celery.on_after_configure.connect
# def setup_periodic_tasks(sender, **kwargs):
#     sender.add_periodic_task(
#         900.0,  # 15 minutes
#         cleanup_expired_tickets.s(),
#         name='cleanup-expired-tickets'
#     )