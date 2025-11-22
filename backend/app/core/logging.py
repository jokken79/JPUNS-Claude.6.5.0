"""
Enterprise-Grade Structured Logging with Loguru - FASE 4 #3

Features:
- JSON output for production (machine-readable)
- Human-readable console output for development
- Request ID tracking and propagation
- PII sanitization for security compliance
- Performance metrics logging
- Audit trail logging
- Security event logging
- Environment-specific configuration
- File rotation and retention policies
- Contextual logging with automatic enrichment
"""
from __future__ import annotations

import re
import sys
from contextvars import ContextVar
from pathlib import Path
from typing import Any, Dict, Optional

from loguru import logger

from app.core.config import settings

# Context variable for request ID tracking across async contexts
request_id_ctx: ContextVar[Optional[str]] = ContextVar("request_id", default=None)

# Sensitive data patterns for PII sanitization
SENSITIVE_PATTERNS = {
    "email": re.compile(r'\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b'),
    "password": re.compile(r'"password"\s*:\s*"[^"]*"'),
    "token": re.compile(r'"(token|access_token|refresh_token)"\s*:\s*"[^"]*"'),
    "credit_card": re.compile(r'\b\d{4}[\s-]?\d{4}[\s-]?\d{4}[\s-]?\d{4}\b'),
    "ssn": re.compile(r'\b\d{3}-\d{2}-\d{4}\b'),
    "phone": re.compile(r'\b\d{3}[-.]?\d{4}[-.]?\d{4}\b'),
}


def sanitize_message(message: str) -> str:
    """
    Sanitize log messages to remove PII and sensitive data.

    Args:
        message: The log message to sanitize

    Returns:
        Sanitized message with PII replaced by placeholders
    """
    sanitized = message

    # Replace sensitive patterns
    sanitized = SENSITIVE_PATTERNS["email"].sub("[EMAIL_REDACTED]", sanitized)
    sanitized = SENSITIVE_PATTERNS["password"].sub('"password": "[REDACTED]"', sanitized)
    sanitized = SENSITIVE_PATTERNS["token"].sub(r'"\1": "[REDACTED]"', sanitized)
    sanitized = SENSITIVE_PATTERNS["credit_card"].sub("[CARD_REDACTED]", sanitized)
    sanitized = SENSITIVE_PATTERNS["ssn"].sub("[SSN_REDACTED]", sanitized)
    sanitized = SENSITIVE_PATTERNS["phone"].sub("[PHONE_REDACTED]", sanitized)

    return sanitized


def sanitize_record(record: Dict[str, Any]) -> Dict[str, Any]:
    """
    Sanitize log record to remove PII from extra fields.

    Args:
        record: The log record dictionary

    Returns:
        Sanitized record
    """
    # Sanitize the message
    if "message" in record:
        record["message"] = sanitize_message(record["message"])

    # Sanitize extra fields
    if "extra" in record:
        for key, value in record["extra"].items():
            if isinstance(value, str):
                record["extra"][key] = sanitize_message(value)

    return record


def pii_filter(record: Dict[str, Any]) -> bool:
    """
    Loguru filter to sanitize PII before writing to logs.

    Args:
        record: The log record

    Returns:
        Always True (allow logging after sanitization)
    """
    # In production, always sanitize
    if settings.ENVIRONMENT == "production":
        sanitize_record(record)

    return True


def format_record(record: Dict[str, Any]) -> str:
    """
    Custom formatter for development console output.

    Args:
        record: The log record

    Returns:
        Formatted log string
    """
    # Add request ID if available
    request_id = request_id_ctx.get()
    if request_id:
        return (
            "<green>{time:YYYY-MM-DD HH:mm:ss.SSS}</green> | "
            "<level>{level: <8}</level> | "
            "<cyan>RequestID: {extra[request_id]}</cyan> | "
            "<cyan>{name}</cyan>:<cyan>{function}</cyan>:<cyan>{line}</cyan> - "
            "<level>{message}</level>\n"
        )
    else:
        return (
            "<green>{time:YYYY-MM-DD HH:mm:ss.SSS}</green> | "
            "<level>{level: <8}</level> | "
            "<cyan>{name}</cyan>:<cyan>{function}</cyan>:<cyan>{line}</cyan> - "
            "<level>{message}</level>\n"
        )


# Setup log directory
LOG_SINK = Path(settings.LOG_FILE)
LOG_SINK.parent.mkdir(parents=True, exist_ok=True)

# Remove default logger
logger.remove()

# Production: JSON output to file (structured, machine-readable)
if settings.ENVIRONMENT == "production":
    logger.add(
        LOG_SINK,
        rotation="daily",  # Daily rotation for better management
        retention="30 days",  # 30 days retention for compliance
        compression="zip",
        serialize=True,  # JSON output
        backtrace=True,
        diagnose=False,  # Disable diagnose in production for security
        level=settings.LOG_LEVEL,
        filter=pii_filter,  # Apply PII sanitization
        enqueue=True,  # Async logging for performance
    )

    # Console output in JSON for production (for Docker logs)
    logger.add(
        sys.stdout,
        level=settings.LOG_LEVEL,
        serialize=True,  # JSON format
        filter=pii_filter,
        enqueue=True,
    )

# Development/Staging: Human-readable console + JSON file
else:
    # File output (JSON for analysis)
    logger.add(
        LOG_SINK,
        rotation="10 MB",
        retention="14 days",
        compression="zip",
        serialize=True,
        backtrace=True,
        diagnose=settings.DEBUG,
        level=settings.LOG_LEVEL,
        enqueue=True,  # Async logging
    )

    # Console output (pretty-printed for humans)
    logger.add(
        sys.stdout,
        level=settings.LOG_LEVEL,
        colorize=True,
        backtrace=True,
        diagnose=settings.DEBUG,
        format=format_record,
    )

# Base application logger with app context
app_logger = logger.bind(app=settings.APP_NAME, environment=settings.ENVIRONMENT)


def get_logger(name: Optional[str] = None, **context: Any):
    """
    Get a contextual logger with automatic request ID tracking.

    Args:
        name: Optional logger name (e.g., module name)
        **context: Additional context to bind to the logger

    Returns:
        Configured logger with context

    Example:
        >>> logger = get_logger(__name__, user_id=123)
        >>> logger.info("User logged in")
    """
    # Get request ID from context
    request_id = request_id_ctx.get()

    # Build context
    ctx = {"app": settings.APP_NAME, "environment": settings.ENVIRONMENT}

    if name:
        ctx["logger_name"] = name

    if request_id:
        ctx["request_id"] = request_id

    ctx.update(context)

    return logger.bind(**ctx)


def set_request_id(request_id: str) -> None:
    """
    Set the request ID for the current async context.

    Args:
        request_id: The request ID to set

    Example:
        >>> set_request_id("req-12345")
        >>> logger = get_logger()
        >>> logger.info("This will include request_id in context")
    """
    request_id_ctx.set(request_id)


def clear_request_id() -> None:
    """Clear the request ID from the current async context."""
    request_id_ctx.set(None)


def get_request_id() -> Optional[str]:
    """
    Get the current request ID from context.

    Returns:
        Current request ID or None
    """
    return request_id_ctx.get()


# Specialized logging functions with proper context
def log_audit_event(event_type: str, **payload: Any) -> None:
    """
    Log an audit event for compliance tracking.

    Args:
        event_type: Type of audit event (e.g., "user_login", "data_access")
        **payload: Additional audit context

    Example:
        >>> log_audit_event("user_login", user_id=123, ip_address="192.168.1.1")
    """
    request_id = request_id_ctx.get()
    context = {
        "event": "audit",
        "event_type": event_type,
        "app": settings.APP_NAME,
    }
    if request_id:
        context["request_id"] = request_id

    logger.bind(**context).info("Audit event", **payload)


def log_security_event(event_type: str, severity: str = "warning", **payload: Any) -> None:
    """
    Log a security event for monitoring and alerting.

    Args:
        event_type: Type of security event (e.g., "failed_login", "suspicious_activity")
        severity: Severity level ("warning", "error", "critical")
        **payload: Additional security context

    Example:
        >>> log_security_event("failed_login", severity="warning", user_id=123, attempts=5)
    """
    request_id = request_id_ctx.get()
    context = {
        "event": "security",
        "event_type": event_type,
        "severity": severity,
        "app": settings.APP_NAME,
    }
    if request_id:
        context["request_id"] = request_id

    log_func = getattr(logger.bind(**context), severity, logger.warning)
    log_func("Security event", **payload)


def log_performance_metric(
    metric: str,
    value: float,
    unit: str = "ms",
    threshold: Optional[float] = None,
    **extra: Any
) -> None:
    """
    Log a performance metric for monitoring.

    Args:
        metric: Metric name (e.g., "request_duration", "query_time")
        value: Metric value
        unit: Unit of measurement (default: "ms")
        threshold: Optional threshold for warning (warns if value exceeds threshold)
        **extra: Additional metric context

    Example:
        >>> log_performance_metric("database_query", 245.5, unit="ms", threshold=200, query="SELECT")
    """
    request_id = request_id_ctx.get()
    context = {
        "event": "performance",
        "metric": metric,
        "app": settings.APP_NAME,
    }
    if request_id:
        context["request_id"] = request_id

    payload = {"value": value, "unit": unit, **extra}

    # Warn if threshold exceeded
    if threshold and value > threshold:
        logger.bind(**context).warning(
            f"Performance threshold exceeded: {metric}={value}{unit} (threshold: {threshold}{unit})",
            **payload
        )
    else:
        logger.bind(**context).info(f"Performance metric: {metric}={value}{unit}", **payload)


def log_ocr_operation(operation: str, duration: float, **payload: Any) -> None:
    """
    Log an OCR operation for tracking and analytics.

    Args:
        operation: OCR operation type (e.g., "text_extraction", "face_detection")
        duration: Operation duration in milliseconds
        **payload: Additional OCR context

    Example:
        >>> log_ocr_operation("text_extraction", 1250.5, file_id=456, pages=3)
    """
    request_id = request_id_ctx.get()
    context = {
        "event": "ocr",
        "operation": operation,
        "app": settings.APP_NAME,
    }
    if request_id:
        context["request_id"] = request_id

    logger.bind(**context).info(
        f"OCR operation: {operation} completed in {duration}ms",
        duration_ms=duration,
        **payload
    )


def log_http_request(
    method: str,
    path: str,
    status_code: int,
    duration: float,
    **extra: Any
) -> None:
    """
    Log an HTTP request with timing information.

    Args:
        method: HTTP method (GET, POST, etc.)
        path: Request path
        status_code: HTTP status code
        duration: Request duration in seconds
        **extra: Additional request context

    Example:
        >>> log_http_request("GET", "/api/users", 200, 0.245, user_id=123)
    """
    request_id = request_id_ctx.get()
    context = {
        "event": "http_request",
        "method": method,
        "path": path,
        "status_code": status_code,
        "app": settings.APP_NAME,
    }
    if request_id:
        context["request_id"] = request_id

    duration_ms = duration * 1000

    # Determine log level based on status code
    if status_code >= 500:
        log_level = "error"
    elif status_code >= 400:
        log_level = "warning"
    else:
        log_level = "info"

    log_func = getattr(logger.bind(**context), log_level)
    log_func(
        f"{method} {path} {status_code} - {duration_ms:.2f}ms",
        duration_ms=duration_ms,
        **extra
    )


def log_database_query(
    query_type: str,
    duration: float,
    rows_affected: Optional[int] = None,
    **extra: Any
) -> None:
    """
    Log a database query with performance metrics.

    Args:
        query_type: Type of query (SELECT, INSERT, UPDATE, DELETE)
        duration: Query duration in milliseconds
        rows_affected: Number of rows affected
        **extra: Additional query context

    Example:
        >>> log_database_query("SELECT", 45.2, rows_affected=10, table="users")
    """
    request_id = request_id_ctx.get()
    context = {
        "event": "database_query",
        "query_type": query_type,
        "app": settings.APP_NAME,
    }
    if request_id:
        context["request_id"] = request_id

    payload = {"duration_ms": duration, **extra}
    if rows_affected is not None:
        payload["rows_affected"] = rows_affected

    # Warn on slow queries (>100ms)
    if duration > 100:
        logger.bind(**context).warning(
            f"Slow database query: {query_type} took {duration}ms",
            **payload
        )
    else:
        logger.bind(**context).debug(
            f"Database query: {query_type} took {duration}ms",
            **payload
        )


__all__ = [
    "app_logger",
    "get_logger",
    "set_request_id",
    "clear_request_id",
    "get_request_id",
    "log_audit_event",
    "log_security_event",
    "log_performance_metric",
    "log_ocr_operation",
    "log_http_request",
    "log_database_query",
    "sanitize_message",
]
