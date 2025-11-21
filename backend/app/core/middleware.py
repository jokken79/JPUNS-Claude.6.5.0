"""Custom middlewares for logging, security and exception handling."""
from __future__ import annotations

import time
import re
from fastapi import HTTPException, Request, Response
from starlette.middleware.base import BaseHTTPMiddleware, RequestResponseEndpoint

from app.core.app_exceptions import handle_exception
from app.core.logging import app_logger, log_performance_metric, log_security_event
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
    """Attach structured logging to each request."""

    async def dispatch(self, request: Request, call_next: RequestResponseEndpoint) -> Response:
        start = time.perf_counter()
        route = request.url.path
        method = request.method
        client = request.client.host if request.client else "unknown"

        app_logger.bind(route=route, method=method, client=client).info("request.started")

        response = await call_next(request)

        elapsed = time.perf_counter() - start
        response.headers["X-Process-Time"] = f"{elapsed:.4f}"

        log_performance_metric("request_duration", elapsed, route=route, status=response.status_code)
        app_logger.bind(route=route, method=method, status=response.status_code).info("request.finished")
        return response


class SecurityMiddleware(BaseHTTPMiddleware):
    """Add common security headers and detect suspicious behaviour."""

    async def dispatch(self, request: Request, call_next: RequestResponseEndpoint) -> Response:
        response = await call_next(request)

        response.headers.setdefault("X-Content-Type-Options", "nosniff")
        response.headers.setdefault("X-Frame-Options", "DENY")
        response.headers.setdefault("X-XSS-Protection", "1; mode=block")
        response.headers.setdefault("Referrer-Policy", "strict-origin-when-cross-origin")
        response.headers.setdefault("Permissions-Policy", "geolocation=(), microphone=(), camera=()")
        response.headers.setdefault("Strict-Transport-Security", "max-age=63072000; includeSubDomains; preload")
        response.headers.setdefault("Cross-Origin-Opener-Policy", "same-origin")
        response.headers.setdefault("Cross-Origin-Resource-Policy", "same-origin")
        response.headers.setdefault("X-Permitted-Cross-Domain-Policies", "none")

        # Improved user-agent detection
        user_agent = request.headers.get("User-Agent", "")
        suspicious_patterns = [r"^curl", r"^python-requests", r"^wget", r"^libwww"]
        is_suspicious = not user_agent or any(re.match(pattern, user_agent, re.IGNORECASE) for pattern in suspicious_patterns)
        if is_suspicious:
            log_security_event(message="Suspicious user agent", user_agent=user_agent)

        return response


class ExceptionHandlerMiddleware(BaseHTTPMiddleware):
    """Convert internal exceptions into JSON responses."""

    async def dispatch(self, request: Request, call_next: RequestResponseEndpoint) -> Response:
        try:
            return await call_next(request)
        except HTTPException:
            raise
        except Exception as exc:
            # Convert all exceptions to appropriate HTTP responses using centralized handler
            app_logger.bind(route=request.url.path).exception("Application exception")
            raise handle_exception(exc)


__all__ = [
    "AuditContextMiddleware",
    "LoggingMiddleware",
    "SecurityMiddleware",
    "ExceptionHandlerMiddleware",
]
