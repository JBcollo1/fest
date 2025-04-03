# celery_setup.py
from celery import Celery
from config3 import Config
from tasks import cleanup_redis

celery = Celery(__name__, broker=Config.CELERY_BROKER_URL)
celery.conf.update(
    result_backend=Config.CELERY_RESULT_BACKEND,
    task_serializer='msgpack',
    result_serializer='msgpack',
    accept_content=['msgpack', 'json'],
    worker_max_memory_per_child=25000
)

@celery.on_after_configure.connect
def setup_periodic_tasks(sender, **kwargs):
    sender.add_periodic_task(
        300,
        cleanup_redis.s(),
        name='redis-cleanup'
    )