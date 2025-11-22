"""
Cache Management API Endpoints
==============================

FASE 4 #5: Caching Strategy - Cache monitoring and management endpoints

Provides endpoints for:
- Cache statistics and health
- Cache invalidation
- Cache memory information
- Cache performance metrics
"""

from fastapi import APIRouter, Request, status, Query
from app.core.cache import cache, CacheKey, CacheTTL
from app.core.response import success_response, no_content_response
from app.services.auth_service import auth_service
from app.models.models import User
from fastapi import Depends
from slowapi import Limiter
from slowapi.util import get_remote_address

router = APIRouter(prefix="/cache", tags=["Cache Management"])
limiter = Limiter(key_func=get_remote_address)


@router.get("/stats")
@limiter.limit("30/minute")
async def get_cache_stats(
    request: Request,
    current_user: User = Depends(auth_service.require_role("admin"))
):
    """
    Get cache statistics and performance metrics.

    Returns:
    - Cache status (available/unavailable/error)
    - Total entries
    - Hit/miss statistics
    - Memory usage
    - Hit rate percentage
    """
    if not cache or not cache.backend:
        return success_response(
            data={
                "status": "unavailable",
                "message": "Cache not initialized"
            },
            request=request,
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE
        )

    stats = await cache.get_stats()
    return success_response(data=stats, request=request, status_code=200)


@router.post("/invalidate")
@limiter.limit("20/minute")
async def invalidate_cache(
    request: Request,
    pattern: str = Query(..., description="Cache key pattern to invalidate (supports wildcards)"),
    current_user: User = Depends(auth_service.require_role("admin"))
):
    """
    Invalidate cache keys matching a pattern.

    Examples:
    - `user:*` - All user cache entries
    - `employee:*` - All employee entries
    - `dashboard:*` - All dashboard summaries
    - `*` - Entire cache (use with caution!)

    Args:
        pattern: Glob-style pattern for cache keys to invalidate

    Returns:
        Number of entries deleted
    """
    if not cache or not cache.backend:
        return success_response(
            data={
                "success": False,
                "message": "Cache not initialized",
                "deleted_count": 0
            },
            request=request
        )

    deleted_count = await cache.invalidate_pattern(pattern)
    return success_response(
        data={
            "success": True,
            "message": f"Cache invalidation completed",
            "deleted_count": deleted_count,
            "pattern": pattern
        },
        request=request,
        status_code=200
    )


@router.delete("/clear")
@limiter.limit("5/minute")
async def clear_all_cache(
    request: Request,
    current_user: User = Depends(auth_service.require_role("super_admin"))
):
    """
    Clear entire cache (Super Admin only).

    ⚠️ WARNING: This will delete all cached data and may cause temporary slowdowns
    as the cache is repopulated.

    Only available to SUPER_ADMIN role.
    """
    if not cache or not cache.backend:
        return success_response(
            data={
                "success": False,
                "message": "Cache not initialized"
            },
            request=request
        )

    success = await cache.clear_all()
    return success_response(
        data={
            "success": success,
            "message": "Cache cleared successfully" if success else "Cache clear failed",
            "timestamp": __import__("datetime").datetime.utcnow().isoformat()
        },
        request=request,
        status_code=200
    )


@router.post("/user/{user_id}/invalidate")
@limiter.limit("60/minute")
async def invalidate_user_cache(
    user_id: int,
    request: Request,
    current_user: User = Depends(auth_service.require_role("admin"))
):
    """
    Invalidate all cache entries for a specific user.

    Clears:
    - User profile
    - User roles and permissions
    - User-specific dashboards
    - User search results

    Args:
        user_id: User ID to invalidate cache for
    """
    if not cache or not cache.backend:
        return success_response(
            data={
                "success": False,
                "message": "Cache not initialized",
                "deleted_count": 0
            },
            request=request
        )

    pattern = f"user:{user_id}:*"
    deleted_count = await cache.invalidate_pattern(pattern)

    return success_response(
        data={
            "success": True,
            "message": f"User {user_id} cache invalidated",
            "deleted_count": deleted_count
        },
        request=request,
        status_code=200
    )


@router.post("/employee/{employee_id}/invalidate")
@limiter.limit("60/minute")
async def invalidate_employee_cache(
    employee_id: int,
    request: Request,
    current_user: User = Depends(auth_service.require_role("admin"))
):
    """
    Invalidate all cache entries for a specific employee.

    Clears:
    - Employee profile
    - Employee salary information
    - Employee dashboards
    - Related payroll cache
    """
    if not cache or not cache.backend:
        return success_response(
            data={
                "success": False,
                "message": "Cache not initialized",
                "deleted_count": 0
            },
            request=request
        )

    # Invalidate multiple patterns
    pattern1 = f"employee:{employee_id}:*"
    pattern2 = f"payroll:*:{employee_id}:*"

    deleted_count = await cache.invalidate_pattern(pattern1)
    deleted_count += await cache.invalidate_pattern(pattern2)

    return success_response(
        data={
            "success": True,
            "message": f"Employee {employee_id} cache invalidated",
            "deleted_count": deleted_count
        },
        request=request,
        status_code=200
    )


@router.post("/dashboard/{user_id}/invalidate")
@limiter.limit("60/minute")
async def invalidate_dashboard_cache(
    user_id: int,
    request: Request,
    current_user: User = Depends(auth_service.get_current_active_user)
):
    """
    Invalidate dashboard cache for a user.

    Refreshes:
    - Dashboard summary
    - Dashboard metrics
    - User-specific reports

    Users can only invalidate their own dashboard cache (unless admin).
    """
    if not cache or not cache.backend:
        return success_response(
            data={
                "success": False,
                "message": "Cache not initialized",
                "deleted_count": 0
            },
            request=request
        )

    # Check permission
    if current_user.id != user_id and not await auth_service.has_role(current_user, "admin"):
        from fastapi import HTTPException
        raise HTTPException(status_code=403, detail="Cannot invalidate other user's cache")

    pattern = f"dashboard:*:{user_id}:*"
    deleted_count = await cache.invalidate_pattern(pattern)

    return success_response(
        data={
            "success": True,
            "message": f"Dashboard cache for user {user_id} invalidated",
            "deleted_count": deleted_count
        },
        request=request,
        status_code=200
    )


@router.get("/health")
@limiter.limit("60/minute")
async def check_cache_health(request: Request):
    """
    Health check for cache system.

    Returns:
    - Cache status (healthy/degraded/unhealthy)
    - Response time
    - Backend type (Redis/in-memory)
    """
    if not cache or not cache.backend:
        return success_response(
            data={
                "status": "unavailable",
                "message": "Cache not initialized",
                "backend": None
            },
            request=request,
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE
        )

    import time
    start = time.time()

    # Test basic operations
    try:
        test_key = "_cache_health_check"
        await cache.set(test_key, {"test": "data"}, ttl=5)
        test_data = await cache.get(test_key)
        await cache.delete(test_key)

        if test_data is None or test_data.get("test") != "data":
            return success_response(
                data={
                    "status": "degraded",
                    "message": "Cache operations failed",
                    "response_time_ms": (time.time() - start) * 1000,
                    "backend": "redis" if cache.is_redis_available else "in-memory"
                },
                request=request,
                status_code=status.HTTP_503_SERVICE_UNAVAILABLE
            )

        return success_response(
            data={
                "status": "healthy",
                "message": "Cache system operational",
                "response_time_ms": round((time.time() - start) * 1000, 2),
                "backend": "redis" if cache.is_redis_available else "in-memory"
            },
            request=request,
            status_code=200
        )

    except Exception as e:
        return success_response(
            data={
                "status": "unhealthy",
                "message": f"Cache health check failed: {str(e)}",
                "response_time_ms": (time.time() - start) * 1000,
                "backend": "redis" if cache.is_redis_available else "in-memory"
            },
            request=request,
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE
        )


@router.get("/info")
@limiter.limit("30/minute")
async def get_cache_info(
    request: Request,
    current_user: User = Depends(auth_service.require_role("admin"))
):
    """
    Get detailed cache system information.

    Returns:
    - Cache backend type and configuration
    - Supported cache patterns
    - TTL strategies
    - Recommended usage patterns
    """
    return success_response(
        data={
            "backend": "redis" if cache and cache.is_redis_available else "in-memory",
            "cache_key_patterns": {
                "user": f"{CacheKey.USER}:<user_id>",
                "user_roles": f"{CacheKey.USER}:<user_id>:roles",
                "employee": f"{CacheKey.EMPLOYEE}:<employee_id>",
                "dashboard": f"{CacheKey.DASHBOARD}:summary:<user_id>",
                "list": f"<namespace>:list:p<page>:pp<per_page>",
            },
            "ttl_strategies": {
                "short": f"{CacheTTL.SHORT}s (frequently changing)",
                "medium": f"{CacheTTL.MEDIUM}s (moderately changing)",
                "long": f"{CacheTTL.LONG}s (stable data)",
                "very_long": f"{CacheTTL.VERY_LONG}s (static data)",
                "dashboard": f"{CacheTTL.DASHBOARD}s (dashboard)",
                "list": f"{CacheTTL.LIST}s (paginated lists)",
            },
            "invalidation_patterns": {
                "user": "user:*",
                "employee": "employee:*",
                "dashboard": "dashboard:*",
                "all": "*"
            }
        },
        request=request,
        status_code=200
    )
