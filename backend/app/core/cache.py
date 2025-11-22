"""
FASE 4 #5: Caching Strategy with Redis Integration
==================================================

Comprehensive caching system with:
- Redis connection management
- TTL-based expiration strategies
- Cache decorators for endpoints
- Cache invalidation patterns
- Performance monitoring
- Graceful fallback to in-memory cache

Usage:
    from app.core.cache import cache, CacheKey

    # Simple decorator usage
    @cache.cached(ttl=300)  # 5 minutes
    async def get_user(user_id: int):
        return db.query(User).filter(User.id == user_id).first()

    # Manual cache operations
    await cache.get("user:1")
    await cache.set("user:1", user_data, ttl=300)
    await cache.invalidate_pattern("user:*")
"""

import json
import logging
import pickle
from typing import Any, Callable, Optional, Dict, List
from datetime import datetime, timedelta
from functools import wraps
import hashlib
import inspect

try:
    import redis.asyncio as aioredis
    from redis.asyncio import Redis
    HAS_REDIS = True
except ImportError:
    HAS_REDIS = False
    Redis = None

logger = logging.getLogger(__name__)


class CacheKey:
    """Cache key builder with namespacing."""

    # Namespaces
    USER = "user"
    EMPLOYEE = "employee"
    CANDIDATE = "candidate"
    PAYROLL = "payroll"
    SALARY = "salary"
    DASHBOARD = "dashboard"
    REPORT = "report"
    DOCUMENT = "document"
    APARTMENT = "apartment"
    FACTORY = "factory"
    CONTRACT = "contract"
    SEARCH = "search"

    @staticmethod
    def build(*parts: str) -> str:
        """Build a cache key from parts."""
        return ":".join(str(p) for p in parts)

    @staticmethod
    def user(user_id: int) -> str:
        return CacheKey.build(CacheKey.USER, str(user_id))

    @staticmethod
    def user_roles(user_id: int) -> str:
        return CacheKey.build(CacheKey.USER, str(user_id), "roles")

    @staticmethod
    def user_permissions(user_id: int) -> str:
        return CacheKey.build(CacheKey.USER, str(user_id), "permissions")

    @staticmethod
    def employee(employee_id: int) -> str:
        return CacheKey.build(CacheKey.EMPLOYEE, str(employee_id))

    @staticmethod
    def employee_by_rirekisho(rirekisho_id: str) -> str:
        return CacheKey.build(CacheKey.EMPLOYEE, "rirekisho", rirekisho_id)

    @staticmethod
    def dashboard_summary(user_id: int) -> str:
        return CacheKey.build(CacheKey.DASHBOARD, "summary", str(user_id))

    @staticmethod
    def list_paginated(namespace: str, page: int, per_page: int, filters: Optional[Dict] = None) -> str:
        """Build cache key for paginated list."""
        filter_hash = ""
        if filters:
            filter_str = json.dumps(filters, sort_keys=True)
            filter_hash = hashlib.md5(filter_str.encode()).hexdigest()[:8]

        return CacheKey.build(namespace, "list", f"p{page}", f"pp{per_page}", filter_hash) if filter_hash else \
               CacheKey.build(namespace, "list", f"p{page}", f"pp{per_page}")

    @staticmethod
    def search(namespace: str, query: str, limit: int = 20) -> str:
        """Build cache key for search results."""
        query_hash = hashlib.md5(query.encode()).hexdigest()[:8]
        return CacheKey.build(namespace, "search", query_hash, f"l{limit}")


class CacheTTL:
    """Standard TTL values (in seconds)."""

    # Short cache: 1-2 minutes (for frequently changing data)
    SHORT = 60

    # Medium cache: 5-10 minutes (for moderately changing data)
    MEDIUM = 300

    # Long cache: 1 hour (for stable data)
    LONG = 3600

    # Very long cache: 24 hours (for mostly static data)
    VERY_LONG = 86400

    # User-specific: 15 minutes
    USER_CONTEXT = 900

    # Dashboard: 2 minutes
    DASHBOARD = 120

    # Reports: 30 minutes
    REPORT = 1800

    # Search results: 10 minutes
    SEARCH = 600

    # List endpoints: 5 minutes
    LIST = 300


class CacheBackend:
    """Base cache backend interface."""

    async def get(self, key: str) -> Optional[Any]:
        raise NotImplementedError

    async def set(self, key: str, value: Any, ttl: Optional[int] = None) -> bool:
        raise NotImplementedError

    async def delete(self, key: str) -> bool:
        raise NotImplementedError

    async def exists(self, key: str) -> bool:
        raise NotImplementedError

    async def invalidate_pattern(self, pattern: str) -> int:
        raise NotImplementedError

    async def clear_all(self) -> bool:
        raise NotImplementedError

    async def get_stats(self) -> Dict[str, Any]:
        raise NotImplementedError


class RedisCacheBackend(CacheBackend):
    """Redis-based cache backend."""

    def __init__(self, redis_client: Redis):
        self.redis = redis_client
        self.hits = 0
        self.misses = 0

    async def get(self, key: str) -> Optional[Any]:
        """Get value from cache."""
        try:
            data = await self.redis.get(key)
            if data:
                self.hits += 1
                # Try JSON first, then pickle
                try:
                    return json.loads(data)
                except (json.JSONDecodeError, UnicodeDecodeError):
                    return pickle.loads(data)
            else:
                self.misses += 1
                return None
        except Exception as e:
            logger.warning(f"Cache GET error for key {key}: {e}")
            self.misses += 1
            return None

    async def set(self, key: str, value: Any, ttl: Optional[int] = None) -> bool:
        """Set value in cache."""
        try:
            # Try JSON serialization first (faster, more compatible)
            try:
                serialized = json.dumps(value)
            except (TypeError, ValueError):
                # Fall back to pickle for complex objects
                serialized = pickle.dumps(value)

            if ttl:
                await self.redis.setex(key, ttl, serialized)
            else:
                await self.redis.set(key, serialized)
            return True
        except Exception as e:
            logger.warning(f"Cache SET error for key {key}: {e}")
            return False

    async def delete(self, key: str) -> bool:
        """Delete key from cache."""
        try:
            result = await self.redis.delete(key)
            return result > 0
        except Exception as e:
            logger.warning(f"Cache DELETE error for key {key}: {e}")
            return False

    async def exists(self, key: str) -> bool:
        """Check if key exists in cache."""
        try:
            result = await self.redis.exists(key)
            return result > 0
        except Exception as e:
            logger.warning(f"Cache EXISTS error for key {key}: {e}")
            return False

    async def invalidate_pattern(self, pattern: str) -> int:
        """Invalidate all keys matching pattern."""
        try:
            cursor = "0"
            deleted = 0
            while True:
                cursor, keys = await self.redis.scan(cursor, match=pattern)
                if keys:
                    deleted += await self.redis.delete(*keys)
                if cursor == 0:
                    break
            return deleted
        except Exception as e:
            logger.warning(f"Cache INVALIDATE_PATTERN error for pattern {pattern}: {e}")
            return 0

    async def clear_all(self) -> bool:
        """Clear all cache."""
        try:
            await self.redis.flushdb()
            return True
        except Exception as e:
            logger.warning(f"Cache CLEAR_ALL error: {e}")
            return False

    async def get_stats(self) -> Dict[str, Any]:
        """Get cache statistics."""
        try:
            info = await self.redis.info()
            total_requests = self.hits + self.misses
            hit_rate = (self.hits / total_requests * 100) if total_requests > 0 else 0

            return {
                "status": "available",
                "total_entries": await self.redis.dbsize(),
                "redis_memory": info.get("used_memory_human", "unknown"),
                "redis_keys_total": info.get("db0", {}).get("keys", 0),
                "cache_hits": self.hits,
                "cache_misses": self.misses,
                "hit_rate_percent": round(hit_rate, 2),
                "memory_used": info.get("used_memory", 0),
                "memory_peak": info.get("used_memory_peak", 0),
            }
        except Exception as e:
            logger.error(f"Cache stats error: {e}")
            return {"status": "error", "error": str(e)}


class InMemoryCacheBackend(CacheBackend):
    """In-memory fallback cache backend."""

    def __init__(self, max_size: int = 10000):
        self.cache: Dict[str, tuple] = {}
        self.max_size = max_size
        self.hits = 0
        self.misses = 0

    async def get(self, key: str) -> Optional[Any]:
        """Get value from cache."""
        if key in self.cache:
            value, expiry = self.cache[key]
            if expiry is None or datetime.now() < expiry:
                self.hits += 1
                return value
            else:
                del self.cache[key]

        self.misses += 1
        return None

    async def set(self, key: str, value: Any, ttl: Optional[int] = None) -> bool:
        """Set value in cache."""
        if len(self.cache) >= self.max_size:
            # Simple eviction: remove oldest 10% of entries
            keys_to_delete = list(self.cache.keys())[:int(self.max_size * 0.1)]
            for k in keys_to_delete:
                del self.cache[k]

        expiry = datetime.now() + timedelta(seconds=ttl) if ttl else None
        self.cache[key] = (value, expiry)
        return True

    async def delete(self, key: str) -> bool:
        """Delete key from cache."""
        if key in self.cache:
            del self.cache[key]
            return True
        return False

    async def exists(self, key: str) -> bool:
        """Check if key exists in cache."""
        return await self.get(key) is not None

    async def invalidate_pattern(self, pattern: str) -> int:
        """Invalidate all keys matching pattern."""
        import fnmatch
        keys_to_delete = [k for k in self.cache.keys() if fnmatch.fnmatch(k, pattern)]
        for k in keys_to_delete:
            del self.cache[k]
        return len(keys_to_delete)

    async def clear_all(self) -> bool:
        """Clear all cache."""
        self.cache.clear()
        return True

    async def get_stats(self) -> Dict[str, Any]:
        """Get cache statistics."""
        total_requests = self.hits + self.misses
        hit_rate = (self.hits / total_requests * 100) if total_requests > 0 else 0

        return {
            "status": "available",
            "type": "in-memory",
            "total_entries": len(self.cache),
            "cache_hits": self.hits,
            "cache_misses": self.misses,
            "hit_rate_percent": round(hit_rate, 2),
            "max_size": self.max_size,
        }


class CacheManager:
    """Unified cache manager with Redis and in-memory fallback."""

    def __init__(self, redis_url: Optional[str] = None):
        self.redis_client: Optional[Redis] = None
        self.backend: Optional[CacheBackend] = None
        self.redis_url = redis_url
        self.is_redis_available = False

    async def initialize(self):
        """Initialize cache backend."""
        if self.redis_url and HAS_REDIS:
            try:
                self.redis_client = await aioredis.from_url(
                    self.redis_url,
                    encoding="utf8",
                    decode_responses=False
                )
                await self.redis_client.ping()
                self.backend = RedisCacheBackend(self.redis_client)
                self.is_redis_available = True
                logger.info("✅ Redis cache initialized successfully")
            except Exception as e:
                logger.warning(f"⚠️ Redis initialization failed: {e}, falling back to in-memory cache")
                self.backend = InMemoryCacheBackend()
                self.is_redis_available = False
        else:
            logger.info("📦 Using in-memory cache (Redis not configured)")
            self.backend = InMemoryCacheBackend()
            self.is_redis_available = False

    async def shutdown(self):
        """Shutdown cache backend."""
        if self.redis_client:
            await self.redis_client.close()

    async def get(self, key: str) -> Optional[Any]:
        """Get value from cache."""
        if not self.backend:
            await self.initialize()
        return await self.backend.get(key)

    async def set(self, key: str, value: Any, ttl: Optional[int] = None) -> bool:
        """Set value in cache."""
        if not self.backend:
            await self.initialize()
        return await self.backend.set(key, value, ttl)

    async def delete(self, key: str) -> bool:
        """Delete key from cache."""
        if not self.backend:
            await self.initialize()
        return await self.backend.delete(key)

    async def exists(self, key: str) -> bool:
        """Check if key exists in cache."""
        if not self.backend:
            await self.initialize()
        return await self.backend.exists(key)

    async def invalidate_pattern(self, pattern: str) -> int:
        """Invalidate all keys matching pattern."""
        if not self.backend:
            await self.initialize()
        return await self.backend.invalidate_pattern(pattern)

    async def clear_all(self) -> bool:
        """Clear all cache."""
        if not self.backend:
            await self.initialize()
        return await self.backend.clear_all()

    async def get_stats(self) -> Dict[str, Any]:
        """Get cache statistics."""
        if not self.backend:
            await self.initialize()
        return await self.backend.get_stats()

    def cached(self, ttl: int = CacheTTL.MEDIUM, key_builder: Optional[Callable] = None):
        """
        Decorator for caching async functions.

        Usage:
            @cache.cached(ttl=300)
            async def get_user(user_id: int):
                return db.query(User).filter(User.id == user_id).first()

            @cache.cached(ttl=600, key_builder=lambda u: f"user:{u.id}")
            async def get_user_detailed(user_id: int):
                return ...
        """
        def decorator(func: Callable):
            @wraps(func)
            async def wrapper(*args, **kwargs):
                # Build cache key
                if key_builder:
                    cache_key = key_builder(*args, **kwargs)
                else:
                    # Default key builder using function name and arguments
                    arg_strs = [str(arg) for arg in args]
                    kwarg_strs = [f"{k}={v}" for k, v in kwargs.items()]
                    all_args = ";".join(arg_strs + kwarg_strs)
                    cache_key = f"{func.__module__}.{func.__name__}:{all_args}"

                # Try to get from cache
                cached_value = await self.get(cache_key)
                if cached_value is not None:
                    logger.debug(f"Cache HIT: {cache_key}")
                    return cached_value

                # Cache miss, execute function
                logger.debug(f"Cache MISS: {cache_key}")
                result = await func(*args, **kwargs)

                # Store in cache
                await self.set(cache_key, result, ttl=ttl)
                return result

            return wrapper

        return decorator


# Global cache instance
cache: CacheManager = None


async def init_cache(redis_url: Optional[str] = None) -> CacheManager:
    """Initialize global cache instance."""
    global cache
    cache = CacheManager(redis_url)
    await cache.initialize()
    return cache


async def shutdown_cache():
    """Shutdown global cache instance."""
    if cache:
        await cache.shutdown()
