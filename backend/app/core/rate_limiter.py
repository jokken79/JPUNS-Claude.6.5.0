"""
Rate Limiting Service for UNS-ClaudeJP 6.0.0

Provides distributed rate limiting using Redis for:
- AI Gateway endpoints
- Authentication endpoints
- Resource-intensive operations (salary calculation, OCR upload)

Rate Limits by Endpoint:
- /api/auth/login: 5 attempts/minute (brute force protection)
- /api/salary/calculate: 10 requests/hour (expensive operation)
- /api/timer-cards/upload: 20 uploads/hour (OCR processing)
- AI Gateway (Gemini): 100 calls/day
- AI Gateway (OpenAI): 50 calls/day
- AI Gateway (Claude API): 50 calls/day
- AI Gateway (Local CLI): 200 calls/day
- General endpoints: 100 requests/minute (default)

Usage:
    from app.core.rate_limiter import limiter

    @router.post("/expensive-operation")
    @limiter.limit("10/hour")
    async def expensive_operation(request: Request, ...):
        ...

Configuration:
    REDIS_URL=redis://redis:6379/0 (distributed storage)
    SLOWAPI_STORAGE_URL=redis://redis:6379/0 (fallback to REDIS_URL)
"""

import logging
import re
from typing import Optional, Dict
from datetime import datetime, timedelta

from slowapi import Limiter
from slowapi.util import get_remote_address
from slowapi.errors import RateLimitExceeded
from fastapi import HTTPException, status, Request
from fastapi.responses import JSONResponse
from sqlalchemy.orm import Session
from sqlalchemy import func, and_

from app.core.config import settings

logger = logging.getLogger(__name__)

# Determine storage URI for rate limiter
# Priority: SLOWAPI_STORAGE_URL > REDIS_URL > memory://
def get_storage_uri() -> str:
    """Get storage URI for rate limiter with Redis fallback"""
    if hasattr(settings, 'SLOWAPI_STORAGE_URL') and settings.SLOWAPI_STORAGE_URL:
        return settings.SLOWAPI_STORAGE_URL
    elif hasattr(settings, 'REDIS_URL') and settings.REDIS_URL:
        return settings.REDIS_URL
    else:
        logger.warning("⚠️ Rate limiter using memory:// - Not suitable for production with multiple instances!")
        return "memory://"

# Initialize rate limiter with Redis backend
storage_uri = get_storage_uri()
limiter = Limiter(
    key_func=get_remote_address,
    default_limits=["100/minute"],  # Global fallback limit
    storage_uri=storage_uri,
    strategy="fixed-window"
)

logger.info(f"✅ Rate limiter initialized with storage: {storage_uri}")


class RateLimitConfig:
    """Configuration for AI Gateway rate limits"""

    # Daily limits per provider (calls per day)
    GEMINI_LIMIT = "100/day"
    OPENAI_LIMIT = "50/day"
    CLAUDE_API_LIMIT = "50/day"
    LOCAL_CLI_LIMIT = "200/day"

    # Alternative per-minute limits for burst control
    GEMINI_BURST = "10/minute"
    OPENAI_BURST = "5/minute"
    CLAUDE_API_BURST = "5/minute"
    LOCAL_CLI_BURST = "20/minute"

    # Batch endpoint limits
    BATCH_LIMIT = "20/day"  # Max batch invocations per day


class UserRateLimitService:
    """
    Service to track and enforce user-based rate limits.

    Extends slowapi with per-user tracking and database persistence.
    Allows for custom limits per user and graceful limit increase.
    """

    def __init__(self, db: Session):
        """
        Initialize user rate limit service.

        Args:
            db: Database session for persistence
        """
        self.db = db
        self.limiter = limiter

    def get_user_limits(self, user_id: int) -> Dict[str, int]:
        """
        Get custom rate limits for a user.

        Args:
            user_id: User ID

        Returns:
            Dictionary with daily call limits per provider
        """
        # TODO: Implement custom limits from database
        # For now, return default limits
        return {
            "gemini": 100,
            "openai": 50,
            "claude_api": 50,
            "local_cli": 200,
        }

    def check_user_limit(self, user_id: int, provider: str) -> bool:
        """
        Check if user has exceeded daily limit for provider.

        Args:
            user_id: User ID
            provider: AI provider name (gemini, openai, claude_api, local_cli)

        Returns:
            True if within limit, False if exceeded

        Raises:
            HTTPException: If limit exceeded
        """
        # TODO: Implement database-backed limit checking
        # For now, rely on slowapi
        return True

    def record_usage(self, user_id: int, provider: str, tokens_used: int = 0):
        """
        Record API usage for tracking and analytics.

        Args:
            user_id: User ID
            provider: AI provider
            tokens_used: Number of tokens used (if applicable)
        """
        # TODO: Record to AIUsageLog table
        pass

    def get_usage_stats(self, user_id: int, days: int = 1) -> Dict[str, int]:
        """
        Get user usage statistics.

        Args:
            user_id: User ID
            days: Number of days to look back

        Returns:
            Dictionary with call counts per provider
        """
        # TODO: Query AIUsageLog table
        return {
            "gemini": 0,
            "openai": 0,
            "claude_api": 0,
            "local_cli": 0,
        }


def calculate_retry_after(limit_detail: str) -> int:
    """
    Calculate Retry-After value in seconds based on rate limit detail.

    Args:
        limit_detail: Rate limit detail string (e.g., "5 per 1 minute")

    Returns:
        Seconds until retry is allowed
    """
    detail_lower = limit_detail.lower()

    # Parse time unit from limit detail
    if "second" in detail_lower:
        return 1
    elif "minute" in detail_lower:
        # Extract number of minutes if present
        match = re.search(r'(\d+)\s+minute', detail_lower)
        if match:
            return int(match.group(1)) * 60
        return 60
    elif "hour" in detail_lower:
        match = re.search(r'(\d+)\s+hour', detail_lower)
        if match:
            return int(match.group(1)) * 3600
        return 3600
    elif "day" in detail_lower:
        match = re.search(r'(\d+)\s+day', detail_lower)
        if match:
            return int(match.group(1)) * 86400
        return 86400
    else:
        # Default to 1 minute if can't parse
        return 60


def format_retry_time(seconds: int) -> str:
    """
    Format seconds into human-readable time.

    Args:
        seconds: Number of seconds

    Returns:
        Human-readable time string
    """
    if seconds < 60:
        return f"{seconds} second{'s' if seconds != 1 else ''}"
    elif seconds < 3600:
        minutes = seconds // 60
        return f"{minutes} minute{'s' if minutes != 1 else ''}"
    elif seconds < 86400:
        hours = seconds // 3600
        return f"{hours} hour{'s' if hours != 1 else ''}"
    else:
        days = seconds // 86400
        return f"{days} day{'s' if days != 1 else ''}"


def handle_rate_limit_error(request: Request, exc: RateLimitExceeded):
    """
    Custom error handler for rate limit exceeded.

    Returns proper HTTP 429 response with Retry-After header and
    detailed error information for debugging and user feedback.

    Args:
        request: FastAPI request
        exc: RateLimitExceeded exception

    Returns:
        JSONResponse with HTTP 429 status and Retry-After header
    """
    # Calculate retry after time
    retry_after = calculate_retry_after(str(exc.detail))
    retry_after_human = format_retry_time(retry_after)

    # Get endpoint path for logging
    endpoint = request.url.path
    ip_address = request.client.host

    # Enhanced logging with context
    logger.warning(
        f"Rate limit exceeded",
        extra={
            "ip": ip_address,
            "endpoint": endpoint,
            "user_agent": request.headers.get("user-agent", "unknown"),
            "limit_detail": str(exc.detail),
            "retry_after": retry_after
        }
    )

    # Return proper HTTP 429 response with Retry-After header
    return JSONResponse(
        status_code=status.HTTP_429_TOO_MANY_REQUESTS,
        headers={
            "Retry-After": str(retry_after),
            "X-RateLimit-Reset": str(int((datetime.utcnow() + timedelta(seconds=retry_after)).timestamp()))
        },
        content={
            "error": "Rate limit exceeded",
            "message": f"Too many requests. {exc.detail}",
            "retry_after": retry_after,
            "retry_after_human": retry_after_human,
            "endpoint": endpoint,
            "documentation": "https://github.com/jokken79/UNS-ClaudeJP-6.0.0/blob/main/RATE_LIMITING_IMPLEMENTATION.md"
        }
    )
