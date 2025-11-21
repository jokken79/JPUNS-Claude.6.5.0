"""
Response Caching Service

Caches AI API responses using Redis to reduce API calls and costs.
Supports configurable TTL, cache invalidation, and cache statistics.
"""

import logging
import hashlib
import json
from typing import Optional, Dict, Any
from datetime import datetime, timedelta
from decimal import Decimal

import redis
from redis import Redis

from app.core.config import settings

logger = logging.getLogger(__name__)


class CacheService:
    """Service for caching AI API responses"""

    def __init__(self):
        """Initialize cache service with Redis connection"""
        try:
            # Connect to Redis
            redis_url = getattr(settings, "REDIS_URL", "redis://localhost:6379/0")
            self.redis_client: Redis = redis.from_url(redis_url)
            self.redis_client.ping()
            logger.info("Connected to Redis for caching")
        except Exception as e:
            logger.warning(f"Failed to connect to Redis: {e}. Caching disabled.")
            self.redis_client = None

    def _is_available(self) -> bool:
        """Check if Redis is available"""
        return self.redis_client is not None

    def _generate_cache_key(
        self,
        provider: str,
        model: str,
        prompt: str,
        system_message: Optional[str] = None,
        metadata: Optional[Dict[str, Any]] = None,
    ) -> str:
        """
        Generate cache key from request parameters.

        Uses SHA256 hash to create deterministic, fixed-length keys.

        Args:
            provider: AI provider (gemini, openai, etc.)
            model: Model name (gpt-4, claude-3-opus, etc.)
            prompt: User prompt text
            system_message: Optional system message
            metadata: Optional metadata (temperature, max_tokens, etc.)

        Returns:
            Cache key string (max 512 chars)
        """
        # Create a deterministic representation of the request
        cache_components = {
            "provider": provider,
            "model": model,
            "prompt": prompt,
        }

        if system_message:
            cache_components["system_message"] = system_message

        # Include metadata if provided (affects cache key)
        if metadata:
            cache_components["metadata"] = metadata

        # Serialize and hash
        cache_string = json.dumps(cache_components, sort_keys=True)
        cache_hash = hashlib.sha256(cache_string.encode()).hexdigest()

        return f"ai_cache:{provider}:{model}:{cache_hash}"

    def get(self, provider: str, model: str, prompt: str, system_message: Optional[str] = None) -> Optional[Dict[str, Any]]:
        """
        Get cached response if available.

        Args:
            provider: AI provider
            model: Model name
            prompt: User prompt
            system_message: Optional system message

        Returns:
            Cached response dict or None if not found/expired

        Example:
            cached = cache_service.get("gemini", "gemini-pro", "What is Python?")
            if cached:
                return cached["response"]
        """
        if not self._is_available():
            return None

        try:
            cache_key = self._generate_cache_key(provider, model, prompt, system_message)
            cached_data = self.redis_client.get(cache_key)

            if cached_data:
                cached_response = json.loads(cached_data)
                cached_response["_from_cache"] = True
                logger.debug(f"Cache hit: {cache_key}")
                return cached_response
            else:
                logger.debug(f"Cache miss: {cache_key}")
                return None
        except Exception as e:
            logger.error(f"Error retrieving from cache: {e}")
            return None

    def set(
        self,
        provider: str,
        model: str,
        prompt: str,
        response: Dict[str, Any],
        ttl_seconds: Optional[int] = None,
        system_message: Optional[str] = None,
    ) -> bool:
        """
        Store response in cache.

        Args:
            provider: AI provider
            model: Model name
            prompt: User prompt
            response: Response data to cache
            ttl_seconds: Time-to-live in seconds (default: 24 hours)
            system_message: Optional system message

        Returns:
            True if cached successfully, False otherwise

        Example:
            cache_service.set(
                "gemini", "gemini-pro", "What is Python?",
                {"response": "Python is a programming language..."},
                ttl_seconds=3600
            )
        """
        if not self._is_available():
            return False

        try:
            cache_key = self._generate_cache_key(provider, model, prompt, system_message)
            ttl = ttl_seconds or 86400  # Default: 24 hours

            # Add cache metadata
            cache_data = {
                "response": response,
                "cached_at": datetime.utcnow().isoformat(),
                "ttl_seconds": ttl,
                "provider": provider,
                "model": model,
            }

            # Store with TTL
            self.redis_client.setex(
                cache_key,
                ttl,
                json.dumps(cache_data),
            )

            logger.debug(f"Cached response: {cache_key} (TTL: {ttl}s)")
            return True
        except Exception as e:
            logger.error(f"Error storing in cache: {e}")
            return False

    def delete(self, provider: str, model: str, prompt: str, system_message: Optional[str] = None) -> bool:
        """
        Delete specific cached response.

        Args:
            provider: AI provider
            model: Model name
            prompt: User prompt
            system_message: Optional system message

        Returns:
            True if deleted, False if not found or error

        Example:
            cache_service.delete("gemini", "gemini-pro", "What is Python?")
        """
        if not self._is_available():
            return False

        try:
            cache_key = self._generate_cache_key(provider, model, prompt, system_message)
            result = self.redis_client.delete(cache_key)
            logger.info(f"Deleted cache: {cache_key}")
            return bool(result)
        except Exception as e:
            logger.error(f"Error deleting from cache: {e}")
            return False

    def invalidate_by_provider(self, provider: str) -> int:
        """
        Delete all cached responses from a provider.

        Args:
            provider: AI provider (gemini, openai, claude_api, local_cli)

        Returns:
            Number of deleted entries

        Example:
            deleted = cache_service.invalidate_by_provider("gemini")
        """
        if not self._is_available():
            return 0

        try:
            pattern = f"ai_cache:{provider}:*"
            keys = self.redis_client.keys(pattern)
            if keys:
                deleted = self.redis_client.delete(*keys)
                logger.info(f"Invalidated {deleted} cache entries for provider {provider}")
                return deleted
            return 0
        except Exception as e:
            logger.error(f"Error invalidating cache by provider: {e}")
            return 0

    def invalidate_by_model(self, provider: str, model: str) -> int:
        """
        Delete all cached responses for a specific model.

        Args:
            provider: AI provider
            model: Model name

        Returns:
            Number of deleted entries

        Example:
            deleted = cache_service.invalidate_by_model("openai", "gpt-4")
        """
        if not self._is_available():
            return 0

        try:
            pattern = f"ai_cache:{provider}:{model}:*"
            keys = self.redis_client.keys(pattern)
            if keys:
                deleted = self.redis_client.delete(*keys)
                logger.info(f"Invalidated {deleted} cache entries for {provider}/{model}")
                return deleted
            return 0
        except Exception as e:
            logger.error(f"Error invalidating cache by model: {e}")
            return 0

    def flush_all(self) -> bool:
        """
        Delete all AI cache entries (dangerous operation).

        Returns:
            True if successful

        Example:
            cache_service.flush_all()
        """
        if not self._is_available():
            return False

        try:
            # Only delete keys matching our pattern, not entire Redis DB
            pattern = "ai_cache:*"
            keys = self.redis_client.keys(pattern)
            if keys:
                self.redis_client.delete(*keys)
                logger.warning(f"Flushed {len(keys)} AI cache entries")
            return True
        except Exception as e:
            logger.error(f"Error flushing cache: {e}")
            return False

    def get_stats(self) -> Dict[str, Any]:
        """
        Get cache statistics.

        Returns:
            Dict with cache information

        Example:
            stats = cache_service.get_stats()
            print(f"Cached items: {stats['total_entries']}")
        """
        if not self._is_available():
            return {"status": "unavailable"}

        try:
            keys = self.redis_client.keys("ai_cache:*")
            total_entries = len(keys)

            # Count by provider
            by_provider = {}
            for key in keys:
                parts = key.decode().split(":")
                if len(parts) >= 2:
                    provider = parts[1]
                    by_provider[provider] = by_provider.get(provider, 0) + 1

            # Get Redis info
            info = self.redis_client.info()
            redis_memory = info.get("used_memory_human", "unknown")

            return {
                "status": "available",
                "total_entries": total_entries,
                "by_provider": by_provider,
                "redis_memory": redis_memory,
                "redis_keys_total": info.get("db0", {}).get("keys", 0) if "db0" in info else 0,
            }
        except Exception as e:
            logger.error(f"Error getting cache stats: {e}")
            return {"status": "error", "error": str(e)}

    def get_memory_usage(self) -> Dict[str, Any]:
        """
        Get detailed memory usage information.

        Returns:
            Dict with memory stats

        Example:
            memory = cache_service.get_memory_usage()
            print(f"Used: {memory['used_memory_human']}")
        """
        if not self._is_available():
            return {"status": "unavailable"}

        try:
            info = self.redis_client.info("memory")
            return {
                "status": "available",
                "used_memory": info.get("used_memory", 0),
                "used_memory_human": info.get("used_memory_human", "unknown"),
                "used_memory_peak": info.get("used_memory_peak", 0),
                "used_memory_peak_human": info.get("used_memory_peak_human", "unknown"),
                "maxmemory": info.get("maxmemory", 0),
                "maxmemory_human": info.get("maxmemory_human", "unlimited"),
                "maxmemory_policy": info.get("maxmemory_policy", "noeviction"),
            }
        except Exception as e:
            logger.error(f"Error getting memory usage: {e}")
            return {"status": "error", "error": str(e)}

    def health_check(self) -> Dict[str, Any]:
        """
        Check if cache is healthy and responsive.

        Returns:
            Dict with health status

        Example:
            health = cache_service.health_check()
            if health["status"] == "healthy":
                print("Cache is working!")
        """
        if not self._is_available():
            return {
                "status": "unavailable",
                "message": "Redis connection not available",
            }

        try:
            # Test ping
            self.redis_client.ping()

            # Test set/get
            test_key = "health_check_test"
            self.redis_client.setex(test_key, 10, "ok")
            test_value = self.redis_client.get(test_key)
            self.redis_client.delete(test_key)

            if test_value:
                return {
                    "status": "healthy",
                    "message": "Cache is working properly",
                    "response_time": "fast",
                }
            else:
                return {
                    "status": "degraded",
                    "message": "Cache test failed",
                }
        except Exception as e:
            return {
                "status": "unhealthy",
                "message": str(e),
            }

    def set_ttl(self, provider: str, model: str, prompt: str, ttl_seconds: int) -> bool:
        """
        Update TTL for a cached entry.

        Args:
            provider: AI provider
            model: Model name
            prompt: User prompt
            ttl_seconds: New TTL in seconds

        Returns:
            True if successful

        Example:
            cache_service.set_ttl("gemini", "gemini-pro", "prompt", 3600)
        """
        if not self._is_available():
            return False

        try:
            cache_key = self._generate_cache_key(provider, model, prompt)
            self.redis_client.expire(cache_key, ttl_seconds)
            logger.debug(f"Updated TTL: {cache_key} to {ttl_seconds}s")
            return True
        except Exception as e:
            logger.error(f"Error updating TTL: {e}")
            return False
