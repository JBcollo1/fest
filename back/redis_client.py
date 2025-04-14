# import redis
# from config3 import Config
# import logging
import redis
from config3 import Config
import logging
import json
from redis.connection import ConnectionPool
from redis.retry import Retry
from redis.backoff import ExponentialBackoff
import time

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class RedisManager:
    _instance = None
    _client = None
    _pool = None
    _max_retries = 3
    _retry_delay = 1  # seconds

    def __new__(cls):
        if cls._instance is None:
            cls._instance = super(RedisManager, cls).__new__(cls)
        return cls._instance

    def __init__(self):
        if not hasattr(self, 'initialized'):
            self.initialized = True
            self.connect()

    def connect(self):
        try:
            if Config.REDIS_CONFIG is None:
                logger.warning("Redis configuration is not set")
                return
            
            # Create Redis client with retry mechanism
            retry = Retry(ExponentialBackoff(), 3)
            self._client = redis.Redis(
                **Config.REDIS_CONFIG,
                retry=retry,
                retry_on_error=[redis.ConnectionError, redis.TimeoutError]
            )
            
            # Test connection
            self._client.ping()
            logger.info("Successfully connected to Redis")
            
        except redis.ConnectionError as e:
            logger.error(f"Failed to connect to Redis: {str(e)}")
            self._client = None
        except Exception as e:
            logger.error(f"Unexpected error connecting to Redis: {str(e)}")
            self._client = None

    def _retry_connection(self):
        """Retry connection with exponential backoff"""
        for attempt in range(self._max_retries):
            try:
                time.sleep(self._retry_delay * (2 ** attempt))
                self.connect()
                if self._client and self._client.ping():
                    logger.info("Redis reconnection successful")
                    return
            except Exception as e:
                logger.error(f"Redis reconnection attempt {attempt + 1} failed: {str(e)}")
        
        logger.error("All Redis reconnection attempts failed")

    @property
    def client(self):
        if self._client is None:
            self.connect()
        return self._client

    def is_connected(self):
        try:
            return self.client is not None and self.client.ping()
        except:
            return False

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
        except redis.RedisError as e:
            logger.error(f"Redis error getting cached events: {str(e)}")
            self._retry_connection()
        except Exception as e:
            logger.error(f"Error getting cached events: {str(e)}")
        return None

    def set_cached_events(self, key, data, ttl=300):
        """Cache events with the given key and TTL (default 5 minutes)"""
        if not self.client:
            return
        try:
            self.client.setex(key, ttl, json.dumps(data))
        except redis.RedisError as e:
            logger.error(f"Redis error caching events: {str(e)}")
            self._retry_connection()
        except Exception as e:
            logger.error(f"Error caching events: {str(e)}")

    def invalidate_event_cache(self, event_id):
        if not self.is_connected():
            return False
        
        try:
            key = f"event:{event_id}"
            return self.client.delete(key) > 0
        except Exception as e:
            logger.error(f"Error invalidating event cache {event_id}: {str(e)}")
            return False

    def __del__(self):
        """Cleanup connection pool"""
        if self._pool:
            self._pool.disconnect()
        if self._client:
            try:
                self._client.close()
            except:
                pass

redis_client = RedisManager()