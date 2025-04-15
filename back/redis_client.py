# import redis
# from config3 import Config
# import logging

# logger = logging.getLogger(__name__)

# class RedisManager:
#     _instance = None
#     _client = None

#     def __init__(self):
#         if not self._client:
#             self.connect()

#     def connect(self):
#         try:
#             if Config.REDIS_CONFIG:
#                 self._client = redis.Redis(**Config.REDIS_CONFIG)
#                 if self._client.ping():
#                     logger.info("Connected to Redis successfully")
#                 else:
#                     logger.error("Redis connection failed")
#             else:
#                 logger.warning("Using default Redis connection")
#                 self._client = redis.Redis(
#                     host='localhost',
#                     port=6379,
#                     decode_responses=False
#                 )
#         except Exception as e:
#             logger.error(f"Redis connection error: {str(e)}")
#             self._client = None

#     @property
#     def client(self):
#         return self._client

#     def __getattr__(self, name):
#         if self.client:
#             return getattr(self.client, name)
#         raise AttributeError("Redis client not initialized")

# redis_client = RedisManager()