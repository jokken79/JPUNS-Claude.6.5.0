"""
Error Handling Middleware - FASE 4 #2

This middleware provides:
- Automatic conversion of ApplicationError to JSON responses
- Request ID generation and tracking
- Standardized error response format
- Comprehensive error logging with context
- Security-conscious error messages (no sensitive data leaks)

Usage:
    Add to FastAPI app:
    from app.core.error_middleware import ErrorHandlerMiddleware
    app.add_middleware(ErrorHandlerMiddleware)
"""

from __future__ import annotations

import traceback
import uuid
from typing import Callable

from fastapi import Request, Response, status as http_status
from fastapi.responses import JSONResponse
from starlette.middleware.base import BaseHTTPMiddleware, RequestResponseEndpoint
from sqlalchemy.exc import IntegrityError, OperationalError, SQLAlchemyError
import requests

from app.core.exceptions import (
    ApplicationError,
    ErrorCode,
    DatabaseError,
    DatabaseIntegrityError,
    DatabaseConnectionError,
    ExternalServiceError,
    ServerError,
)
from app.core.config import settings
from app.core.logging import get_logger, set_request_id, clear_request_id

# Use Loguru for structured logging
logger = get_logger(__name__)


class ErrorHandlerMiddleware(BaseHTTPMiddleware):
    """
    Middleware to handle all application exceptions and convert them to standardized JSON responses.
    
    Features:
    - Generates unique request IDs for tracking
    - Converts ApplicationError exceptions to JSON
    - Handles SQLAlchemy and requests exceptions
    - Logs errors with full context
    - Provides security-conscious error messages
    """
    
    async def dispatch(
        self,
        request: Request,
        call_next: RequestResponseEndpoint
    ) -> Response:
        # Generate request ID for tracking
        request_id = str(uuid.uuid4())
        request.state.request_id = request_id

        # Set request ID in logging context for automatic tracking
        set_request_id(request_id)

        try:
            # Add request ID to response headers
            response = await call_next(request)
            response.headers["X-Request-ID"] = request_id
            return response

        except ApplicationError as exc:
            # Handle our custom application errors
            return await self._handle_application_error(exc, request, request_id)

        except IntegrityError as exc:
            # Handle database integrity errors (unique constraint, foreign key, etc.)
            return await self._handle_integrity_error(exc, request, request_id)

        except OperationalError as exc:
            # Handle database connection errors
            return await self._handle_operational_error(exc, request, request_id)

        except SQLAlchemyError as exc:
            # Handle other SQLAlchemy errors
            return await self._handle_sqlalchemy_error(exc, request, request_id)

        except requests.exceptions.Timeout as exc:
            # Handle HTTP timeout errors
            return await self._handle_timeout_error(exc, request, request_id)

        except requests.exceptions.ConnectionError as exc:
            # Handle HTTP connection errors
            return await self._handle_connection_error(exc, request, request_id)

        except requests.exceptions.RequestException as exc:
            # Handle other HTTP request errors
            return await self._handle_request_error(exc, request, request_id)

        except ValueError as exc:
            # Handle value errors (invalid input)
            return await self._handle_value_error(exc, request, request_id)

        except KeyError as exc:
            # Handle missing key errors
            return await self._handle_key_error(exc, request, request_id)

        except Exception as exc:
            # Catch-all for unexpected exceptions
            return await self._handle_unexpected_error(exc, request, request_id)

        finally:
            # Clear request ID from context after request completes
            clear_request_id()
    
    async def _handle_application_error(
        self,
        exc: ApplicationError,
        request: Request,
        request_id: str
    ) -> JSONResponse:
        """Handle ApplicationError exceptions."""
        # Set request ID on exception if not already set
        if not exc.request_id or exc.request_id != request_id:
            exc.request_id = request_id

        # Build log context
        log_ctx = get_logger(
            __name__,
            error_code=exc.error_code.value,
            status_code=exc.status_code,
            path=str(request.url.path),
            method=request.method,
        )

        if exc.context:
            log_ctx = log_ctx.bind(error_context=exc.context)

        # Log with appropriate level based on status code
        if exc.status_code >= 500:
            log_ctx.error(f"Server error: {exc.message}")
        elif exc.status_code >= 400:
            log_ctx.warning(f"Client error: {exc.message}")

        # Convert to JSON response
        response_data = exc.to_dict()

        # Remove context in production for security
        if settings.ENVIRONMENT == "production" and "context" in response_data.get("error", {}):
            del response_data["error"]["context"]

        return JSONResponse(
            status_code=exc.status_code,
            content=response_data,
            headers={"X-Request-ID": request_id}
        )
    
    async def _handle_integrity_error(
        self,
        exc: IntegrityError,
        request: Request,
        request_id: str
    ) -> JSONResponse:
        """Handle database integrity constraint violations."""
        get_logger(
            __name__,
            path=str(request.url.path),
            method=request.method,
        ).warning(f"Database integrity error: {str(exc.orig)}")
        
        # Extract constraint name if available
        constraint_name = None
        error_msg = str(exc.orig)
        if "UNIQUE constraint" in error_msg:
            constraint_name = "unique"
            user_message = "A record with this value already exists"
        elif "FOREIGN KEY constraint" in error_msg:
            constraint_name = "foreign_key"
            user_message = "Referenced record does not exist"
        elif "NOT NULL constraint" in error_msg:
            constraint_name = "not_null"
            user_message = "Required field is missing"
        else:
            user_message = "Database constraint violated"
        
        error = DatabaseIntegrityError(
            message=user_message,
            constraint=constraint_name,
            request_id=request_id
        )
        
        response_data = error.to_dict()
        
        # Remove context in production
        if settings.ENVIRONMENT == "production" and "context" in response_data.get("error", {}):
            del response_data["error"]["context"]
        
        return JSONResponse(
            status_code=error.status_code,
            content=response_data,
            headers={"X-Request-ID": request_id}
        )
    
    async def _handle_operational_error(
        self,
        exc: OperationalError,
        request: Request,
        request_id: str
    ) -> JSONResponse:
        """Handle database connection errors."""
        get_logger(
            __name__,
            path=str(request.url.path),
            method=request.method,
        ).error(f"Database operational error: {str(exc.orig)}")
        
        error = DatabaseConnectionError(
            message="Database connection failed",
            request_id=request_id
        )
        
        response_data = error.to_dict()
        
        if settings.ENVIRONMENT == "production" and "context" in response_data.get("error", {}):
            del response_data["error"]["context"]
        
        return JSONResponse(
            status_code=error.status_code,
            content=response_data,
            headers={"X-Request-ID": request_id}
        )
    
    async def _handle_sqlalchemy_error(
        self,
        exc: SQLAlchemyError,
        request: Request,
        request_id: str
    ) -> JSONResponse:
        """Handle general SQLAlchemy errors."""
        get_logger(
            __name__,
            path=str(request.url.path),
            method=request.method,
        ).error(f"SQLAlchemy error: {str(exc)}")
        
        error = DatabaseError(
            message="Database error occurred",
            request_id=request_id
        )
        
        response_data = error.to_dict()
        
        if settings.ENVIRONMENT == "production" and "context" in response_data.get("error", {}):
            del response_data["error"]["context"]
        
        return JSONResponse(
            status_code=error.status_code,
            content=response_data,
            headers={"X-Request-ID": request_id}
        )
    
    async def _handle_timeout_error(
        self,
        exc: requests.exceptions.Timeout,
        request: Request,
        request_id: str
    ) -> JSONResponse:
        """Handle HTTP timeout errors."""
        get_logger(
            __name__,
            path=str(request.url.path),
            method=request.method,
        ).error(f"External service timeout: {str(exc)}")
        
        error = ExternalServiceError(
            service_name="External Service",
            message="External service request timed out",
            is_timeout=True,
            request_id=request_id
        )
        
        response_data = error.to_dict()
        
        if settings.ENVIRONMENT == "production" and "context" in response_data.get("error", {}):
            del response_data["error"]["context"]
        
        return JSONResponse(
            status_code=error.status_code,
            content=response_data,
            headers={"X-Request-ID": request_id}
        )
    
    async def _handle_connection_error(
        self,
        exc: requests.exceptions.ConnectionError,
        request: Request,
        request_id: str
    ) -> JSONResponse:
        """Handle HTTP connection errors."""
        get_logger(
            __name__,
            path=str(request.url.path),
            method=request.method,
        ).error(f"External service connection error: {str(exc)}")
        
        error = ExternalServiceError(
            service_name="External Service",
            message="Could not connect to external service",
            is_timeout=False,
            request_id=request_id
        )
        
        response_data = error.to_dict()
        
        if settings.ENVIRONMENT == "production" and "context" in response_data.get("error", {}):
            del response_data["error"]["context"]
        
        return JSONResponse(
            status_code=error.status_code,
            content=response_data,
            headers={"X-Request-ID": request_id}
        )
    
    async def _handle_request_error(
        self,
        exc: requests.exceptions.RequestException,
        request: Request,
        request_id: str
    ) -> JSONResponse:
        """Handle general HTTP request errors."""
        get_logger(
            __name__,
            path=str(request.url.path),
            method=request.method,
        ).error(f"External service request error: {str(exc)}")
        
        error = ExternalServiceError(
            service_name="External Service",
            message="External service error",
            is_timeout=False,
            request_id=request_id
        )
        
        response_data = error.to_dict()
        
        if settings.ENVIRONMENT == "production" and "context" in response_data.get("error", {}):
            del response_data["error"]["context"]
        
        return JSONResponse(
            status_code=error.status_code,
            content=response_data,
            headers={"X-Request-ID": request_id}
        )
    
    async def _handle_value_error(
        self,
        exc: ValueError,
        request: Request,
        request_id: str
    ) -> JSONResponse:
        """Handle value errors (invalid input)."""
        get_logger(
            __name__,
            path=str(request.url.path),
            method=request.method,
        ).warning(f"Value error: {str(exc)}")
        
        from app.core.exceptions import ValidationError
        
        error = ValidationError(
            message=f"Invalid input: {str(exc)}",
            request_id=request_id
        )
        
        response_data = error.to_dict()
        
        if settings.ENVIRONMENT == "production" and "context" in response_data.get("error", {}):
            del response_data["error"]["context"]
        
        return JSONResponse(
            status_code=error.status_code,
            content=response_data,
            headers={"X-Request-ID": request_id}
        )
    
    async def _handle_key_error(
        self,
        exc: KeyError,
        request: Request,
        request_id: str
    ) -> JSONResponse:
        """Handle missing key errors."""
        get_logger(
            __name__,
            path=str(request.url.path),
            method=request.method,
        ).warning(f"Missing key: {str(exc)}")
        
        from app.core.exceptions import ValidationError
        
        error = ValidationError(
            message=f"Missing required field: {str(exc)}",
            field=str(exc).strip("'\""),
            request_id=request_id
        )
        
        response_data = error.to_dict()
        
        if settings.ENVIRONMENT == "production" and "context" in response_data.get("error", {}):
            del response_data["error"]["context"]
        
        return JSONResponse(
            status_code=error.status_code,
            content=response_data,
            headers={"X-Request-ID": request_id}
        )
    
    async def _handle_unexpected_error(
        self,
        exc: Exception,
        request: Request,
        request_id: str
    ) -> JSONResponse:
        """Handle unexpected exceptions."""
        # Log with full traceback for debugging
        get_logger(
            __name__,
            path=str(request.url.path),
            method=request.method,
            exception_type=type(exc).__name__,
        ).exception(f"Unexpected error: {str(exc)}")
        
        # In development, include more details
        if settings.DEBUG:
            error_message = f"Unexpected error: {str(exc)}"
            context = {
                "exception_type": type(exc).__name__,
                "traceback": traceback.format_exc()
            }
        else:
            error_message = "An unexpected error occurred"
            context = {}
        
        error = ServerError(
            message=error_message,
            request_id=request_id
        )
        error.context = context
        
        response_data = error.to_dict()
        
        # Always remove context in production
        if settings.ENVIRONMENT == "production" and "context" in response_data.get("error", {}):
            del response_data["error"]["context"]
        
        return JSONResponse(
            status_code=error.status_code,
            content=response_data,
            headers={"X-Request-ID": request_id}
        )


__all__ = ["ErrorHandlerMiddleware"]
