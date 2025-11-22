"""Custom middlewares for logging, security and exception handling."""
from __future__ import annotations

import time
import re
from fastapi import HTTPException, Request, Response
from starlette.middleware.base import BaseHTTPMiddleware, RequestResponseEndpoint

from app.core.app_exceptions import handle_exception
from app.core.logging import (
    get_logger,
    log_http_request,
    log_performance_metric,
    log_security_event,
    get_request_id,
)
from app.core.audit import clear_audit_context, update_audit_context


class AuditContextMiddleware(BaseHTTPMiddleware):
    """Populate the audit context with request metadata."""

    async def dispatch(self, request: Request, call_next: RequestResponseEndpoint) -> Response:
        clear_audit_context()
        client_host = request.client.host if request.client else None
        update_audit_context(
            ip_address=client_host,
            user_agent=request.headers.get("User-Agent"),
        )
        try:
            response = await call_next(request)
        finally:
            clear_audit_context()
        return response


class LoggingMiddleware(BaseHTTPMiddleware):
    """
    Attach structured logging to each request.

    Logs:
    - Request start with method, path, client IP
    - Request completion with status code, duration
    - Performance metrics with threshold warnings
    - Slow request warnings (>200ms)
    """

    async def dispatch(self, request: Request, call_next: RequestResponseEndpoint) -> Response:
        start = time.perf_counter()
        route = str(request.url.path)
        method = request.method
        client = request.client.host if request.client else "unknown"

        # Log request start
        logger = get_logger(
            __name__,
            method=method,
            path=route,
            client_ip=client,
        )
        logger.info(f"Request started: {method} {route}")

        # Process request
        response = await call_next(request)

        # Calculate duration
        elapsed = time.perf_counter() - start
        duration_ms = elapsed * 1000

        # Add process time header
        response.headers["X-Process-Time"] = f"{elapsed:.4f}"

        # Log HTTP request with context
        log_http_request(
            method=method,
            path=route,
            status_code=response.status_code,
            duration=elapsed,
            client_ip=client,
        )

        # Log performance metric with threshold
        log_performance_metric(
            "request_duration",
            duration_ms,
            unit="ms",
            threshold=200.0,  # Warn if request takes > 200ms
            route=route,
            method=method,
            status=response.status_code,
        )

        # Additional warning for very slow requests (>1s)
        if duration_ms > 1000:
            logger.warning(
                f"Very slow request: {method} {route} took {duration_ms:.2f}ms",
                duration_ms=duration_ms,
                status_code=response.status_code,
            )

        return response


class SecurityMiddleware(BaseHTTPMiddleware):
    """Add common security headers and detect suspicious behaviour."""

    async def dispatch(self, request: Request, call_next: RequestResponseEndpoint) -> Response:
        response = await call_next(request)

        # Basic security headers
        response.headers.setdefault("X-Content-Type-Options", "nosniff")
        response.headers.setdefault("X-Frame-Options", "DENY")
        response.headers.setdefault("X-XSS-Protection", "1; mode=block")
        response.headers.setdefault("Referrer-Policy", "strict-origin-when-cross-origin")
        response.headers.setdefault("Permissions-Policy", "geolocation=(), microphone=(), camera=()")
        response.headers.setdefault("Strict-Transport-Security", "max-age=63072000; includeSubDomains; preload")
        response.headers.setdefault("Cross-Origin-Opener-Policy", "same-origin")
        response.headers.setdefault("Cross-Origin-Resource-Policy", "same-origin")
        response.headers.setdefault("X-Permitted-Cross-Domain-Policies", "none")

        # Content-Security-Policy (CSP) - XSS protection at browser level
        csp_directives = [
            "default-src 'self'",
            "script-src 'self' 'unsafe-inline' 'unsafe-eval'",  # Next.js requires unsafe-eval for dev
            "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
            "font-src 'self' https://fonts.gstatic.com data:",
            "img-src 'self' data: https: blob:",
            "connect-src 'self' ws: wss:",
            "frame-ancestors 'none'",
            "base-uri 'self'",
            "form-action 'self'",
            "upgrade-insecure-requests"
        ]
        response.headers.setdefault("Content-Security-Policy", "; ".join(csp_directives))

        # Improved user-agent detection
        user_agent = request.headers.get("User-Agent", "")
        suspicious_patterns = [r"^curl", r"^python-requests", r"^wget", r"^libwww"]
        is_suspicious = not user_agent or any(re.match(pattern, user_agent, re.IGNORECASE) for pattern in suspicious_patterns)
        if is_suspicious:
            log_security_event(
                "suspicious_user_agent",
                severity="warning",
                user_agent=user_agent,
                path=str(request.url.path),
                client_ip=request.client.host if request.client else "unknown",
            )

        return response


class ExceptionHandlerMiddleware(BaseHTTPMiddleware):
    """
    DEPRECATED: Legacy exception handler middleware.

    This middleware is kept for backward compatibility but is deprecated.
    Use ErrorHandlerMiddleware from app.core.error_middleware instead.

    The new ErrorHandlerMiddleware provides:
    - Request ID tracking
    - Standardized error response format
    - Better error code mapping
    - Security-conscious error messages
    """

    async def dispatch(self, request: Request, call_next: RequestResponseEndpoint) -> Response:
        try:
            return await call_next(request)
        except HTTPException:
            raise
        except Exception as exc:
            # Convert all exceptions to appropriate HTTP responses using centralized handler
            get_logger(
                __name__,
                path=str(request.url.path),
                method=request.method,
            ).exception("Application exception")
            raise handle_exception(exc)


__all__ = [
    "AuditContextMiddleware",
    "LoggingMiddleware",
    "SecurityMiddleware",
    "ExceptionHandlerMiddleware",  # Deprecated - use ErrorHandlerMiddleware instead
]
