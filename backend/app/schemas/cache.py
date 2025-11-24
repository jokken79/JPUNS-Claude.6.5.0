"""
Pydantic schemas for caching operations
"""

from typing import Optional, Dict, Any
from datetime import datetime
from pydantic import BaseModel, Field


class CacheStatsResponse(BaseModel):
    """Response for cache statistics endpoint"""

    status: str = Field(..., description="Cache status: available|unavailable|error")
    total_entries: Optional[int] = Field(None, description="Total cached entries")
    by_provider: Optional[Dict[str, int]] = Field(None, description="Entries per provider")
    redis_memory: Optional[str] = Field(None, description="Redis memory usage")
    redis_keys_total: Optional[int] = Field(None, description="Total Redis keys")
    error: Optional[str] = Field(None, description="Error message if applicable")


class CacheMemoryResponse(BaseModel):
    """Response for cache memory information"""

    status: str = Field(..., description="Cache status: available|unavailable|error")
    used_memory: Optional[int] = Field(None, description="Used memory in bytes")
    used_memory_human: Optional[str] = Field(None, description="Used memory human readable")
    used_memory_peak: Optional[int] = Field(None, description="Peak memory usage bytes")
    used_memory_peak_human: Optional[str] = Field(None, description="Peak memory human readable")
    maxmemory: Optional[int] = Field(None, description="Maximum memory limit")
    maxmemory_human: Optional[str] = Field(None, description="Maximum memory human readable")
    maxmemory_policy: Optional[str] = Field(None, description="Memory eviction policy")
    error: Optional[str] = Field(None, description="Error message if applicable")


class CacheHealthResponse(BaseModel):
    """Response for cache health check"""

    status: str = Field(..., description="Health status: healthy|degraded|unhealthy|unavailable")
    message: str = Field(..., description="Status message")
    response_time: Optional[str] = Field(None, description="Cache response time")


class CacheInvalidationResponse(BaseModel):
    """Response for cache invalidation operations"""

    success: bool = Field(..., description="Whether invalidation succeeded")
    deleted_count: int = Field(..., description="Number of entries deleted")
    message: str = Field(..., description="Operation result message")


class CacheMetadata(BaseModel):
    """Metadata about a cached response"""

    cached_at: str = Field(..., description="When response was cached (ISO format)")
    ttl_seconds: int = Field(..., description="Time-to-live in seconds")
    provider: str = Field(..., description="AI provider that generated response")
    model: str = Field(..., description="Model that generated response")


class CachedResponse(BaseModel):
    """Response returned from cache"""

    response: Any = Field(..., description="The cached AI response")
    from_cache: bool = Field(default=True, description="Indicator this came from cache")
    cache_metadata: Optional[CacheMetadata] = Field(None, description="Cache information")
