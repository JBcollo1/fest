# import redis
# from config3 import Config
# import logging
import redis
from config3 import Config
import logging
import json

logger = logging.getLogger(__name__)

class RedisManager:
    _instance = None
    _client = None

    def __init__(self):
        if not self._client:
            self.connect()

    def connect(self):
        try:
            if Config.REDIS_CONFIG:
                self._client = redis.Redis(**Config.REDIS_CONFIG)
                if self._client.ping():
                    logger.info("Connected to Redis successfully")
                else:
                    logger.error("Redis connection failed")
            else:
                logger.warning("Using default Redis connection")
                self._client = redis.Redis(
                    host='localhost',
                    port=6379,
                    decode_responses=True
                )
        except Exception as e:
            logger.error(f"Redis connection error: {str(e)}")
            self._client = None

    @property
    def client(self):
        return self._client

    def __getattr__(self, name):
        if self.client:
            return getattr(self.client, name)
        raise AttributeError("Redis client not initialized")

    def get_cached_events(self, key):
        """Get cached events with the given key"""
        if not self.client:
            return None
        try:
            cached_data = self.client.get(key)
            if cached_data:
                return json.loads(cached_data)
        except Exception as e:
            logger.error(f"Error getting cached events: {str(e)}")
        return None

    def set_cached_events(self, key, data, ttl=300):
        """Cache events with the given key and TTL (default 5 minutes)"""
        if not self.client:
            return
        try:
            self.client.setex(key, ttl, json.dumps(data))
        except Exception as e:
            logger.error(f"Error caching events: {str(e)}")

    def invalidate_event_cache(self, event_id=None):
        """Invalidate event cache, optionally for a specific event"""
        if not self.client:
            return
        try:
            if event_id:
                # Invalidate specific event cache
                self.client.delete(f"event:{event_id}")
            # Invalidate all events cache
            self.client.delete("events:all")
            self.client.delete("events:featured")
        except Exception as e:
            logger.error(f"Error invalidating event cache: {str(e)}")

redis_client = RedisManager()