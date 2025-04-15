# # config3.py
# import os
# from urllib.parse import urlparse

# class Config:
#     # Get Redis URL from Render's environment
#     SQLALCHEMY_DATABASE_URI = os.getenv('DATABASE_URL', 'sqlite:///app.db')
#     SQLALCHEMY_TRACK_MODIFICATIONS = False
    
#     # Redis configuration
#     REDIS_URL = os.getenv('REDIS_URL', '')
    
#     # Celery configuration
#     CELERY_BROKER_URL = REDIS_URL or 'memory://'
#     CELERY_RESULT_BACKEND = REDIS_URL or 'db+sqlite:///results.sqlite'
#     CELERY_TASK_SERIALIZER = 'json'
#     CELERY_RESULT_SERIALIZER = 'json'
#     CELERY_ACCEPT_CONTENT = ['msgpack', 'json']
#     CELERY_RESULT_EXPIRES = 300  # 5 minutes
#     CELERY_TASK_IGNORE_RESULT = False
#     CELERYD_MAX_TASKS_PER_CHILD = 100
#     CELERYD_MAX_MEMORY_PER_CHILD = 15000  # 15MB
    
#     # Redis connection settings
#     if REDIS_URL:
#         redis_params = urlparse(REDIS_URL)
#         if "localhost" in REDIS_URL or "127.0.0.1" in REDIS_URL:
#             REDIS_CONFIG = {
#                 'host': 'localhost',
#                 'port': 6379,
#                 'password': None,
#                 'ssl': False,
#                 'decode_responses': False,
#                 'max_connections': 20
#             }
#         else:
#             REDIS_CONFIG = {
#                 'host': redis_params.hostname,
#                 'port': redis_params.port,
#                 'password': redis_params.password,
#                 'ssl': redis_params.scheme == 'rediss',
#                 'decode_responses': False,
#                 'max_connections': 20,
#                 'health_check_interval': 30,
#                 'socket_keepalive': True,
#                 'retry_on_timeout': True
#             }
#     else:
#         REDIS_CONFIG = None
    
#     # Database connection pool settings
#     SQLALCHEMY_ENGINE_OPTIONS = {
#         'pool_size': 10,
#         'max_overflow': 20,
#         'pool_recycle': 300,
#         'pool_pre_ping': True
#     }
    
#     # Memory management settings
#     REDIS_MAXMEMORY = 25 * 1024 * 1024  # 25MB
#     REDIS_EVICTION_POLICY = 'allkeys-lru'