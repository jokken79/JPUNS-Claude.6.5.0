"""
OCR Result Caching Service using Redis

Implements caching of OCR results to avoid reprocessing the same documents.
Uses SHA-256 hash of document content as cache key with 30-day TTL.

Author: Claude Code
Created: 2025-11-12
Version: 1.0
"""

import hashlib
import json
import logging
from typing import Dict, Any, Optional
from datetime import timedelta

try:
    import redis
    REDIS_AVAILABLE = True
except ImportError:
    REDIS_AVAILABLE = False
    redis = None

from app.core.config import settings

logger = logging.getLogger(__name__)


class OCRCacheService:
    """
    Service for caching OCR results in Redis.

    Features:
    - Automatic cache key generation from document hash
    - 30-day TTL for cached results
    - Graceful fallback if Redis is unavailable
    - JSON serialization of results

    Usage:
        >>> cache = OCRCacheService()
        >>> # Try to get cached result
        >>> result = cache.get_cached_result(document_bytes, "zairyu_card")
        >>> if result is None:
        ...     # Process with OCR
        ...     result = ocr_service.process(document_bytes)
        ...     # Cache the result
        ...     cache.set_cached_result(document_bytes, "zairyu_card", result)
    """

    # Cache TTL: 30 days
    CACHE_TTL_DAYS = 30
    CACHE_TTL_SECONDS = 60 * 60 * 24 * CACHE_TTL_DAYS  # 2,592,000 seconds

    # Cache key prefix for namespacing
    CACHE_PREFIX = "ocr:result"

    def __init__(self):
        """Initialize Redis connection."""
        self.redis_client: Optional[redis.Redis] = None
        self.cache_enabled = False

        if not REDIS_AVAILABLE:
            logger.warning("Redis library not available - OCR caching disabled")
            return

        try:
            # Connect to Redis
            self.redis_client = redis.Redis(
                host=getattr(settings, 'REDIS_HOST', 'redis'),
                port=getattr(settings, 'REDIS_PORT', 6379),
                db=getattr(settings, 'REDIS_DB', 0),
                password=getattr(settings, 'REDIS_PASSWORD', None),
                decode_responses=False,  # We'll handle encoding ourselves
                socket_connect_timeout=2,
                socket_timeout=2,
            )

            # Test connection
            self.redis_client.ping()
            self.cache_enabled = True
            logger.info("OCR cache service initialized successfully")

        except Exception as e:
            logger.warning(f"Failed to connect to Redis - OCR caching disabled: {e}")
            self.redis_client = None
            self.cache_enabled = False

    def _generate_cache_key(self, document_data: bytes, document_type: str) -> str:
        """
        Generate cache key from document content hash.

        Uses SHA-256 hash to create a unique identifier for the document.
        This ensures that identical documents return the same cache key.

        Args:
            document_data: Binary content of the document
            document_type: Type of document (zairyu_card, rirekisho, etc.)

        Returns:
            str: Cache key in format "ocr:result:{document_type}:{hash}"

        Example:
            >>> key = self._generate_cache_key(image_bytes, "zairyu_card")
            >>> print(key)
            'ocr:result:zairyu_card:a3b5c7...'
        """
        # Calculate SHA-256 hash of document content
        doc_hash = hashlib.sha256(document_data).hexdigest()

        # Create namespaced cache key
        cache_key = f"{self.CACHE_PREFIX}:{document_type}:{doc_hash}"

        return cache_key

    def get_cached_result(
        self,
        document_data: bytes,
        document_type: str
    ) -> Optional[Dict[str, Any]]:
        """
        Retrieve cached OCR result for a document.

        Args:
            document_data: Binary content of the document
            document_type: Type of document

        Returns:
            Dict[str, Any] | None: Cached OCR result if found, None otherwise

        Example:
            >>> result = cache.get_cached_result(image_bytes, "zairyu_card")
            >>> if result:
            ...     print("Cache hit!")
            ... else:
            ...     print("Cache miss - need to process")
        """
        if not self.cache_enabled:
            return None

        try:
            cache_key = self._generate_cache_key(document_data, document_type)

            # Try to get from cache
            cached_data = self.redis_client.get(cache_key)

            if cached_data:
                # Deserialize JSON
                result = json.loads(cached_data.decode('utf-8'))
                logger.info(f"OCR cache HIT for {document_type} (key: {cache_key[:50]}...)")
                return result

            logger.debug(f"OCR cache MISS for {document_type} (key: {cache_key[:50]}...)")
            return None

        except Exception as e:
            logger.error(f"Error retrieving from OCR cache: {e}")
            return None

    def set_cached_result(
        self,
        document_data: bytes,
        document_type: str,
        result: Dict[str, Any]
    ) -> bool:
        """
        Store OCR result in cache with 30-day TTL.

        Args:
            document_data: Binary content of the document
            document_type: Type of document
            result: OCR result dictionary to cache

        Returns:
            bool: True if cached successfully, False otherwise

        Example:
            >>> result = {'success': True, 'name_kanji': '田中太郎', ...}
            >>> cache.set_cached_result(image_bytes, "zairyu_card", result)
            True
        """
        if not self.cache_enabled:
            return False

        try:
            cache_key = self._generate_cache_key(document_data, document_type)

            # Serialize to JSON
            cached_data = json.dumps(result, ensure_ascii=False).encode('utf-8')

            # Store in Redis with TTL
            self.redis_client.setex(
                name=cache_key,
                time=self.CACHE_TTL_SECONDS,
                value=cached_data
            )

            logger.info(
                f"OCR result cached for {document_type} "
                f"(key: {cache_key[:50]}..., TTL: {self.CACHE_TTL_DAYS} days)"
            )
            return True

        except Exception as e:
            logger.error(f"Error storing to OCR cache: {e}")
            return False

    def invalidate_cache(
        self,
        document_data: bytes,
        document_type: str
    ) -> bool:
        """
        Invalidate (delete) cached OCR result for a document.

        Useful when document reprocessing is needed.

        Args:
            document_data: Binary content of the document
            document_type: Type of document

        Returns:
            bool: True if deleted successfully, False otherwise

        Example:
            >>> cache.invalidate_cache(image_bytes, "zairyu_card")
            True
        """
        if not self.cache_enabled:
            return False

        try:
            cache_key = self._generate_cache_key(document_data, document_type)

            # Delete from Redis
            deleted = self.redis_client.delete(cache_key)

            if deleted:
                logger.info(f"OCR cache invalidated for {document_type} (key: {cache_key[:50]}...)")
                return True

            return False

        except Exception as e:
            logger.error(f"Error invalidating OCR cache: {e}")
            return False

    def get_cache_stats(self) -> Dict[str, Any]:
        """
        Get statistics about the OCR cache.

        Returns:
            Dict[str, Any]: Cache statistics including total keys, memory usage, etc.

        Example:
            >>> stats = cache.get_cache_stats()
            >>> print(f"Total cached documents: {stats['total_keys']}")
        """
        if not self.cache_enabled:
            return {
                'enabled': False,
                'error': 'Redis not available'
            }

        try:
            # Get all OCR cache keys
            pattern = f"{self.CACHE_PREFIX}:*"
            keys = list(self.redis_client.scan_iter(match=pattern, count=100))

            # Get Redis info
            redis_info = self.redis_client.info('memory')

            return {
                'enabled': True,
                'total_keys': len(keys),
                'cache_prefix': self.CACHE_PREFIX,
                'ttl_days': self.CACHE_TTL_DAYS,
                'memory_used_mb': round(redis_info.get('used_memory', 0) / (1024 * 1024), 2),
                'memory_peak_mb': round(redis_info.get('used_memory_peak', 0) / (1024 * 1024), 2)
            }

        except Exception as e:
            logger.error(f"Error getting cache stats: {e}")
            return {
                'enabled': True,
                'error': str(e)
            }


# Singleton instance
ocr_cache_service = OCRCacheService()


# Integration example for hybrid_ocr_service.py:
"""
# In hybrid_ocr_service.py, wrap process_document_hybrid with caching:

from app.services.ocr_cache_service import ocr_cache_service

def process_document_hybrid_with_cache(self, image_data: bytes, document_type: str, **kwargs):
    '''
    Process document with OCR caching layer.

    Checks cache first, processes with OCR if not found, then caches the result.
    '''
    # Try to get from cache
    cached_result = ocr_cache_service.get_cached_result(image_data, document_type)
    if cached_result:
        cached_result['cache_hit'] = True
        return cached_result

    # Not in cache - process with OCR
    result = self.process_document_hybrid(image_data, document_type, **kwargs)

    # Cache the result if successful
    if result.get('success'):
        ocr_cache_service.set_cached_result(image_data, document_type, result)
        result['cache_hit'] = False

    return result
"""
