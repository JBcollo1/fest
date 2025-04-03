# redis_client.py
import redis
from config3 import Config

class RedisManager:
    _instance = None
    _initialized = False
    
    def __init__(self):
        if not self._initialized and Config.REDIS_CONFIG:
            try:
                self._client = redis.Redis(**Config.REDIS_CONFIG)
                self._client.ping()
                self._initialized = True
            except Exception as e:
                print(f"Redis connection failed: {str(e)}")
                self._client = None
    
    @property
    def client(self):
        return self._client if self._initialized else None
    
    def __getattr__(self, name):
        if self.client:
            return getattr(self.client, name)
        raise AttributeError(f"Redis client not initialized. Missing REDIS_URL?")
    
    # Add these missing methods
    def compressed_get(self, key):
        """Get compressed data from Redis"""
        if self.client:
            return self.client.get(key)
        return None
    
    def compressed_set(self, key, value, ex=None):
        """Set compressed data in Redis with optional expiry"""
        if self.client:
            return self.client.set(key, value, ex=ex)
        return False
    
    def memory_purge(self):
        """Purge memory"""
        if self.client:
            return self.client.memory_purge()
        return None

redis_client = RedisManager()