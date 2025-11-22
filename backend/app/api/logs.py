"""
Frontend Log Collection API - FASE 4 #3

This endpoint collects logs from frontend applications (browser, mobile) and
stores them in the backend logging system for centralized monitoring and debugging.

Features:
- Receives logs from browser applications via Pino transport
- Validates and sanitizes frontend log data
- Enriches logs with backend context (request ID, timestamp)
- Stores logs in structured format
- Rate limited to prevent abuse
- Authentication optional (can be public for error tracking)
"""
from __future__ import annotations

from datetime import datetime
from typing import Any, Dict, List, Optional

from fastapi import APIRouter, Depends, HTTPException, Request, status
from pydantic import BaseModel, Field, field_validator
from slowapi import Limiter
from slowapi.util import get_remote_address

from app.core.logging import get_logger, sanitize_message, get_request_id
from fastapi import Request
from app.core.response import success_response, created_response, paginated_response, no_content_response
from app.core.rate_limiter import limiter

router = APIRouter(prefix="/logs", tags=["logging"])

# Logger for this module
logger = get_logger(__name__)


class FrontendLogEntry(BaseModel):
    """Schema for frontend log entries."""

    level: str = Field(
        ...,
        description="Log level (fatal, error, warn, info, debug, trace)",
        examples=["error", "info", "debug"],
    )
    message: str = Field(..., description="Log message", max_length=5000)
    timestamp: Optional[datetime] = Field(
        default=None,
        description="Frontend timestamp (will use server time if not provided)",
    )
    context: Optional[Dict[str, Any]] = Field(
        default=None,
        description="Additional context (user info, page, component, etc.)",
    )

    @field_validator("level")
    @classmethod
    def validate_level(cls, v: str) -> str:
        """Validate log level."""
        valid_levels = {"fatal", "error", "warn", "info", "debug", "trace"}
        level_lower = v.lower()
        if level_lower not in valid_levels:
            raise ValueError(f"Invalid log level. Must be one of: {valid_levels}")
        return level_lower

    @field_validator("message")
    @classmethod
    def sanitize_message_field(cls, v: str) -> str:
        """Sanitize message to remove PII."""
        return sanitize_message(v)


class FrontendLogBatch(BaseModel):
    """Schema for batch frontend log submission."""

    logs: List[FrontendLogEntry] = Field(
        ...,
        description="Array of log entries",
        max_length=100,  # Limit batch size
    )
    app_version: Optional[str] = Field(
        default=None,
        description="Frontend app version",
    )
    user_id: Optional[int] = Field(
        default=None,
        description="User ID (if authenticated)",
    )
    session_id: Optional[str] = Field(
        default=None,
        description="Frontend session ID for correlation",
    )


class LogResponse(BaseModel):
    """Response for log submission."""

    success: bool = Field(..., description="Whether logs were accepted")
    received: int = Field(..., description="Number of logs received")
    request_id: Optional[str] = Field(
        default=None,
        description="Backend request ID for tracking",
    )


@router.post(
    "/frontend",
    response_model=LogResponse,
    status_code=status.HTTP_202_ACCEPTED,
    summary="Collect frontend logs",
    description="""
    Receive and process logs from frontend applications.

    This endpoint accepts logs from browser applications (via Pino transport),
    validates them, sanitizes sensitive data, and stores them in the backend
    logging system for centralized monitoring.

    **Rate Limit**: 60 requests per minute per IP
    **Authentication**: Optional (public endpoint for error tracking)
    **Batch Size**: Maximum 100 logs per request
    """,
)
@limiter.limit("60/minute")
async def collect_frontend_logs(
    log_batch: FrontendLogBatch,
    request: Request,
) -> LogResponse:
    """
    Collect logs from frontend applications.

    Args:
        log_batch: Batch of log entries from frontend
        request: FastAPI request object

    Returns:
        LogResponse with acceptance status

    Raises:
        HTTPException: If log data is invalid or rate limit exceeded
    """
    # Get request context
    request_id = get_request_id()
    client_ip = request.client.host if request.client else "unknown"
    user_agent = request.headers.get("User-Agent", "unknown")

    # Build base context for all logs in this batch
    base_context = {
        "source": "frontend",
        "client_ip": client_ip,
        "user_agent": user_agent,
        "backend_request_id": request_id,
    }

    if log_batch.app_version:
        base_context["app_version"] = log_batch.app_version

    if log_batch.user_id:
        base_context["frontend_user_id"] = log_batch.user_id

    if log_batch.session_id:
        base_context["frontend_session_id"] = log_batch.session_id

    # Process each log entry
    processed_count = 0
    for log_entry in log_batch.logs:
        try:
            # Merge context
            log_context = {**base_context}
            if log_entry.context:
                log_context.update(log_entry.context)

            # Use frontend timestamp if provided, otherwise server time
            timestamp = log_entry.timestamp or datetime.utcnow()

            # Get logger with context
            frontend_logger = get_logger(
                "frontend",
                **log_context,
            )

            # Log at appropriate level
            log_func = getattr(frontend_logger, log_entry.level, frontend_logger.info)
            log_func(
                f"[Frontend] {log_entry.message}",
                frontend_timestamp=timestamp.isoformat(),
            )

            processed_count += 1

        except Exception as exc:
            # Log processing error but don't fail the entire batch
            logger.warning(
                f"Failed to process frontend log entry: {str(exc)}",
                log_level=log_entry.level,
                message_preview=log_entry.message[:100],
            )

    # Log summary of batch
    logger.info(
        f"Processed frontend log batch: {processed_count}/{len(log_batch.logs)} logs",
        total_logs=len(log_batch.logs),
        processed_logs=processed_count,
        client_ip=client_ip,
    )

    return LogResponse(
        success=True,
        received=processed_count,
        request_id=request_id,
    )


@router.get(
    "/health",
    summary="Logging endpoint health check",
    description="Check if the logging endpoint is operational",
)
async def logging_health(
    request: Request,
    ) -> Dict[str, Any]:
    """
    Health check for logging endpoint.

    Returns:
        Health status
    """
    return {
        "status": "healthy",
        "service": "frontend-log-collection",
        "timestamp": datetime.utcnow().isoformat(),
    }


__all__ = ["router"]
