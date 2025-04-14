# config3.py
import os
from urllib.parse import urlparse

class Config:
    # Get Redis URL from Render's environment
    SQLALCHEMY_DATABASE_URI = os.getenv('DATABASE_URL', 'sqlite:///app.db')
    SQLALCHEMY_TRACK_MODIFICATIONS = False
    
    # Redis configuration
    REDIS_URL = os.getenv('REDIS_URL', 'redis://localhost:6379/0')
    
    # Celery configuration
    CELERY_BROKER_URL = REDIS_URL
    CELERY_RESULT_BACKEND = REDIS_URL
    CELERY_TASK_SERIALIZER = 'json'
    CELERY_RESULT_SERIALIZER = 'json'
    CELERY_ACCEPT_CONTENT = ['msgpack', 'json']
    CELERY_RESULT_EXPIRES = 300  # 5 minutes
    CELERY_TASK_IGNORE_RESULT = False
    CELERYD_MAX_TASKS_PER_CHILD = 100
    CELERYD_MAX_MEMORY_PER_CHILD = 15000  # 15MB
    
    # Redis connection settings
    if REDIS_URL:
        redis_params = urlparse(REDIS_URL)
        REDIS_CONFIG = {
            'host': redis_params.hostname or 'localhost',
            'port': redis_params.port or 6379,
            'password': redis_params.password,
            'db': int(redis_params.path.strip('/')) if redis_params.path.strip('/') else 0,
            'decode_responses': True,
            'socket_timeout': 20,
            'socket_connect_timeout': 20,
            'retry_on_timeout': True,
            'health_check_interval': 30,
            'socket_keepalive': True
        }
        
        # Handle SSL if using rediss://
        if redis_params.scheme == 'rediss':
            REDIS_CONFIG['ssl'] = True
            REDIS_CONFIG['ssl_cert_reqs'] = None
    else:
        REDIS_CONFIG = {
            'host': 'localhost',
            'port': 6379,
            'decode_responses': True,
            'socket_timeout': 20,
            'socket_connect_timeout': 20,
            'retry_on_timeout': True
        }
    
    # Database connection pool settings
    SQLALCHEMY_ENGINE_OPTIONS = {
        'pool_size': 10,
        'max_overflow': 20,
        'pool_recycle': 300,
        'pool_pre_ping': True
    }
    
    # Memory management settings
    REDIS_MAXMEMORY = 85 * 1024 * 1024  
    REDIS_EVICTION_POLICY = 'allkeys-lru'