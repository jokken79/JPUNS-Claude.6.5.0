"""
Automatic Error Handling Decorators

This module provides decorators for automatic error handling in FastAPI endpoints.
Instead of wrapping every endpoint in try-except, use @handle_errors() decorator.

Example:
    @router.post("/calculate")
    @handle_errors()
    async def calculate(request: CalculateRequest, db: Session = Depends(get_db)):
        # No need for try-except! Decorator handles all errors automatically
        result = expensive_operation(request)
        return result
"""

from functools import wraps
from typing import Callable, Any
import logging

from fastapi import HTTPException, status as http_status
from sqlalchemy.exc import SQLAlchemyError, IntegrityError
import requests

from app.core.app_exceptions import (
    ValidationError,
    ResourceNotFoundError,
    UnauthorizedError,
    ForbiddenError,
    PayrollCalculationError,
    OCRProcessingError,
    WorkflowError,
    InsufficientDataError,
    ExternalServiceError,
    APIKeyInvalidError,
    DatabaseError,
    FileUploadError,
    handle_exception
)

logger = logging.getLogger(__name__)


def handle_errors(default_detail: str = "An error occurred processing your request"):
    """
    Decorator for automatic error handling in FastAPI endpoints.

    Converts all exceptions to appropriate HTTPException responses.
    Logs errors with context based on exception type.

    Usage:
        @router.post("/endpoint")
        @handle_errors(default_detail="Failed to process request")
        async def my_endpoint(request: MyRequest):
            # Code here - all exceptions automatically handled
            return result

    Args:
        default_detail: Default error message if exception type not recognized

    Returns:
        Decorated function with automatic error handling
    """
    def decorator(func: Callable) -> Callable:
        @wraps(func)
        async def async_wrapper(*args, **kwargs) -> Any:
            try:
                return await func(*args, **kwargs)
            except HTTPException:
                # Re-raise HTTPException as-is
                raise
            except ValidationError as e:
                logger.warning(f"Validation error in {func.__name__}: {e.message}")
                raise HTTPException(
                    status_code=http_status.HTTP_400_BAD_REQUEST,
                    detail=e.message
                )
            except ResourceNotFoundError as e:
                logger.warning(f"Resource not found in {func.__name__}: {e.message}")
                raise HTTPException(
                    status_code=http_status.HTTP_404_NOT_FOUND,
                    detail=e.message
                )
            except UnauthorizedError as e:
                logger.warning(f"Unauthorized in {func.__name__}: {e.message}")
                raise HTTPException(
                    status_code=http_status.HTTP_401_UNAUTHORIZED,
                    detail=e.message,
                    headers={"WWW-Authenticate": "Bearer"}
                )
            except ForbiddenError as e:
                logger.warning(f"Forbidden in {func.__name__}: {e.message}")
                raise HTTPException(
                    status_code=http_status.HTTP_403_FORBIDDEN,
                    detail=e.message
                )
            except (PayrollCalculationError, OCRProcessingError, WorkflowError) as e:
                logger.error(f"Business logic error in {func.__name__}: {e}")
                raise HTTPException(
                    status_code=http_status.HTTP_422_UNPROCESSABLE_ENTITY,
                    detail="Failed to process request"
                )
            except InsufficientDataError as e:
                logger.warning(f"Insufficient data in {func.__name__}: {e.message}")
                raise HTTPException(
                    status_code=http_status.HTTP_400_BAD_REQUEST,
                    detail=e.message
                )
            except ExternalServiceError as e:
                status_code = (
                    http_status.HTTP_503_SERVICE_UNAVAILABLE if e.is_temporary
                    else http_status.HTTP_502_BAD_GATEWAY
                )
                logger.error(f"External service error in {func.__name__}: {e.full_message}")
                raise HTTPException(
                    status_code=status_code,
                    detail=f"{e.service_name} is temporarily unavailable"
                )
            except APIKeyInvalidError as e:
                logger.error(f"Invalid API key in {func.__name__}: {e.service_name}")
                raise HTTPException(
                    status_code=http_status.HTTP_401_UNAUTHORIZED,
                    detail="Authentication failed with external service"
                )
            except (IntegrityError, DatabaseError) as e:
                logger.error(f"Database error in {func.__name__}: {e}")
                raise HTTPException(
                    status_code=http_status.HTTP_500_INTERNAL_SERVER_ERROR,
                    detail="Database error occurred"
                )
            except SQLAlchemyError as e:
                logger.exception(f"SQLAlchemy error in {func.__name__}: {e}")
                raise HTTPException(
                    status_code=http_status.HTTP_500_INTERNAL_SERVER_ERROR,
                    detail="Database error occurred"
                )
            except requests.RequestException as e:
                if isinstance(e, (requests.Timeout, requests.ConnectionError)):
                    status_code = http_status.HTTP_503_SERVICE_UNAVAILABLE
                else:
                    status_code = http_status.HTTP_502_BAD_GATEWAY
                logger.error(f"Request error in {func.__name__}: {e}")
                raise HTTPException(
                    status_code=status_code,
                    detail="External service unavailable"
                )
            except ValueError as e:
                logger.warning(f"Value error in {func.__name__}: {e}")
                raise HTTPException(
                    status_code=http_status.HTTP_400_BAD_REQUEST,
                    detail=f"Invalid input: {str(e)}"
                )
            except KeyError as e:
                logger.warning(f"Missing key in {func.__name__}: {e}")
                raise HTTPException(
                    status_code=http_status.HTTP_400_BAD_REQUEST,
                    detail=f"Missing required field: {str(e)}"
                )
            except Exception as e:
                # Catch-all for unexpected exceptions
                logger.exception(f"Unexpected error in {func.__name__}: {e}")
                raise HTTPException(
                    status_code=http_status.HTTP_500_INTERNAL_SERVER_ERROR,
                    detail=default_detail
                )

        @wraps(func)
        def sync_wrapper(*args, **kwargs) -> Any:
            try:
                return func(*args, **kwargs)
            except HTTPException:
                raise
            except ValidationError as e:
                logger.warning(f"Validation error in {func.__name__}: {e.message}")
                raise HTTPException(
                    status_code=http_status.HTTP_400_BAD_REQUEST,
                    detail=e.message
                )
            except ResourceNotFoundError as e:
                logger.warning(f"Resource not found in {func.__name__}: {e.message}")
                raise HTTPException(
                    status_code=http_status.HTTP_404_NOT_FOUND,
                    detail=e.message
                )
            except UnauthorizedError as e:
                logger.warning(f"Unauthorized in {func.__name__}: {e.message}")
                raise HTTPException(
                    status_code=http_status.HTTP_401_UNAUTHORIZED,
                    detail=e.message,
                    headers={"WWW-Authenticate": "Bearer"}
                )
            except ForbiddenError as e:
                logger.warning(f"Forbidden in {func.__name__}: {e.message}")
                raise HTTPException(
                    status_code=http_status.HTTP_403_FORBIDDEN,
                    detail=e.message
                )
            except (PayrollCalculationError, OCRProcessingError, WorkflowError) as e:
                logger.error(f"Business logic error in {func.__name__}: {e}")
                raise HTTPException(
                    status_code=http_status.HTTP_422_UNPROCESSABLE_ENTITY,
                    detail="Failed to process request"
                )
            except InsufficientDataError as e:
                logger.warning(f"Insufficient data in {func.__name__}: {e.message}")
                raise HTTPException(
                    status_code=http_status.HTTP_400_BAD_REQUEST,
                    detail=e.message
                )
            except ExternalServiceError as e:
                status_code = (
                    http_status.HTTP_503_SERVICE_UNAVAILABLE if e.is_temporary
                    else http_status.HTTP_502_BAD_GATEWAY
                )
                logger.error(f"External service error in {func.__name__}: {e.full_message}")
                raise HTTPException(
                    status_code=status_code,
                    detail=f"{e.service_name} is temporarily unavailable"
                )
            except APIKeyInvalidError as e:
                logger.error(f"Invalid API key in {func.__name__}: {e.service_name}")
                raise HTTPException(
                    status_code=http_status.HTTP_401_UNAUTHORIZED,
                    detail="Authentication failed with external service"
                )
            except (IntegrityError, DatabaseError) as e:
                logger.error(f"Database error in {func.__name__}: {e}")
                raise HTTPException(
                    status_code=http_status.HTTP_500_INTERNAL_SERVER_ERROR,
                    detail="Database error occurred"
                )
            except SQLAlchemyError as e:
                logger.exception(f"SQLAlchemy error in {func.__name__}: {e}")
                raise HTTPException(
                    status_code=http_status.HTTP_500_INTERNAL_SERVER_ERROR,
                    detail="Database error occurred"
                )
            except requests.RequestException as e:
                if isinstance(e, (requests.Timeout, requests.ConnectionError)):
                    status_code = http_status.HTTP_503_SERVICE_UNAVAILABLE
                else:
                    status_code = http_status.HTTP_502_BAD_GATEWAY
                logger.error(f"Request error in {func.__name__}: {e}")
                raise HTTPException(
                    status_code=status_code,
                    detail="External service unavailable"
                )
            except ValueError as e:
                logger.warning(f"Value error in {func.__name__}: {e}")
                raise HTTPException(
                    status_code=http_status.HTTP_400_BAD_REQUEST,
                    detail=f"Invalid input: {str(e)}"
                )
            except KeyError as e:
                logger.warning(f"Missing key in {func.__name__}: {e}")
                raise HTTPException(
                    status_code=http_status.HTTP_400_BAD_REQUEST,
                    detail=f"Missing required field: {str(e)}"
                )
            except Exception as e:
                logger.exception(f"Unexpected error in {func.__name__}: {e}")
                raise HTTPException(
                    status_code=http_status.HTTP_500_INTERNAL_SERVER_ERROR,
                    detail=default_detail
                )

        # Return async or sync wrapper based on function type
        import inspect
        if inspect.iscoroutinefunction(func):
            return async_wrapper
        else:
            return sync_wrapper

    return decorator
