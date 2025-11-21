"""
Custom Application Exceptions

This module defines all business logic exceptions used throughout the application.
Using custom exceptions allows for:
1. Better error categorization and logging
2. Specific error handling based on exception type
3. Consistent error responses across endpoints
4. Clear debugging with context-aware messages
"""

from fastapi import HTTPException, status as http_status
from typing import Optional, Dict, Any
import logging

logger = logging.getLogger(__name__)


# ============================================================================
# VALIDATION EXCEPTIONS
# ============================================================================

class ValidationError(Exception):
    """Raised when input data validation fails"""
    def __init__(self, message: str, field: Optional[str] = None):
        self.message = message
        self.field = field
        super().__init__(self.message)

    def to_http(self):
        """Convert to HTTP exception"""
        logger.warning(f"Validation error: {self.message}" + (f" (field: {self.field})" if self.field else ""))
        return HTTPException(
            status_code=http_status.HTTP_400_BAD_REQUEST,
            detail=self.message
        )


# ============================================================================
# RESOURCE EXCEPTIONS
# ============================================================================

class ResourceNotFoundError(Exception):
    """Raised when a requested resource doesn't exist"""
    def __init__(self, resource_type: str, resource_id: Any):
        self.resource_type = resource_type
        self.resource_id = resource_id
        self.message = f"{resource_type} {resource_id} not found"
        super().__init__(self.message)

    def to_http(self):
        """Convert to HTTP exception"""
        logger.warning(f"Resource not found: {self.message}")
        return HTTPException(
            status_code=http_status.HTTP_404_NOT_FOUND,
            detail=self.message
        )


class ResourceAlreadyExistsError(Exception):
    """Raised when trying to create a duplicate resource"""
    def __init__(self, resource_type: str, identifier: str):
        self.resource_type = resource_type
        self.identifier = identifier
        self.message = f"{resource_type} with {identifier} already exists"
        super().__init__(self.message)

    def to_http(self):
        """Convert to HTTP exception"""
        logger.warning(f"Resource already exists: {self.message}")
        return HTTPException(
            status_code=http_status.HTTP_409_CONFLICT,
            detail=self.message
        )


# ============================================================================
# AUTHENTICATION & AUTHORIZATION EXCEPTIONS
# ============================================================================

class UnauthorizedError(Exception):
    """Raised when authentication fails"""
    def __init__(self, message: str = "Authentication required"):
        self.message = message
        super().__init__(self.message)

    def to_http(self):
        """Convert to HTTP exception"""
        logger.warning(f"Unauthorized access: {self.message}")
        return HTTPException(
            status_code=http_status.HTTP_401_UNAUTHORIZED,
            detail=self.message,
            headers={"WWW-Authenticate": "Bearer"}
        )


class ForbiddenError(Exception):
    """Raised when user doesn't have permission for an action"""
    def __init__(self, message: str = "Permission denied"):
        self.message = message
        super().__init__(self.message)

    def to_http(self):
        """Convert to HTTP exception"""
        logger.warning(f"Forbidden access: {self.message}")
        return HTTPException(
            status_code=http_status.HTTP_403_FORBIDDEN,
            detail=self.message
        )


# ============================================================================
# BUSINESS LOGIC EXCEPTIONS
# ============================================================================

class PayrollCalculationError(Exception):
    """Raised when payroll calculation fails"""
    def __init__(self, message: str, employee_id: Optional[int] = None):
        self.message = message
        self.employee_id = employee_id
        super().__init__(self.message)

    def to_http(self):
        """Convert to HTTP exception"""
        logger.error(f"Payroll calculation error: {self.message}" + (f" (employee: {self.employee_id})" if self.employee_id else ""))
        return HTTPException(
            status_code=http_status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Error calculating payroll. Please contact support."
        )


class OCRProcessingError(Exception):
    """Raised when OCR processing fails"""
    def __init__(self, message: str, file_name: Optional[str] = None):
        self.message = message
        self.file_name = file_name
        super().__init__(self.message)

    def to_http(self):
        """Convert to HTTP exception"""
        logger.error(f"OCR processing error: {self.message}" + (f" (file: {self.file_name})" if self.file_name else ""))
        return HTTPException(
            status_code=http_status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="Could not process document. Please try again with a different file."
        )


class WorkflowError(Exception):
    """Raised when workflow validation or processing fails"""
    def __init__(self, message: str, step: Optional[str] = None):
        self.message = message
        self.step = step
        super().__init__(self.message)

    def to_http(self):
        """Convert to HTTP exception"""
        logger.error(f"Workflow error: {self.message}" + (f" (step: {self.step})" if self.step else ""))
        return HTTPException(
            status_code=http_status.HTTP_400_BAD_REQUEST,
            detail=f"Workflow error: {self.message}"
        )


class InsufficientDataError(Exception):
    """Raised when required data is missing for an operation"""
    def __init__(self, message: str, missing_fields: Optional[list] = None):
        self.message = message
        self.missing_fields = missing_fields or []
        super().__init__(self.message)

    def to_http(self):
        """Convert to HTTP exception"""
        logger.warning(f"Insufficient data: {self.message}")
        return HTTPException(
            status_code=http_status.HTTP_400_BAD_REQUEST,
            detail=self.message
        )


# ============================================================================
# EXTERNAL SERVICE EXCEPTIONS
# ============================================================================

class ExternalServiceError(Exception):
    """Raised when external API/service call fails"""
    def __init__(self, service_name: str, message: str, is_temporary: bool = False):
        self.service_name = service_name
        self.message = message
        self.is_temporary = is_temporary  # True for timeout, False for permanent
        self.full_message = f"{service_name} error: {message}"
        super().__init__(self.full_message)

    def to_http(self):
        """Convert to HTTP exception"""
        status_code = (
            http_status.HTTP_503_SERVICE_UNAVAILABLE if self.is_temporary
            else http_status.HTTP_502_BAD_GATEWAY
        )
        logger.error(f"External service error: {self.full_message} (temporary: {self.is_temporary})")
        return HTTPException(
            status_code=status_code,
            detail=f"{self.service_name} is currently unavailable. Please try again later."
        )


class APIKeyInvalidError(ExternalServiceError):
    """Raised when API key is invalid or expired"""
    def __init__(self, service_name: str):
        super().__init__(service_name, "Invalid or expired API key", is_temporary=False)


# ============================================================================
# DATABASE EXCEPTIONS
# ============================================================================

class DatabaseError(Exception):
    """Raised when database operation fails"""
    def __init__(self, message: str, operation: Optional[str] = None):
        self.message = message
        self.operation = operation
        super().__init__(self.message)

    def to_http(self):
        """Convert to HTTP exception"""
        logger.error(f"Database error: {self.message}" + (f" (operation: {self.operation})" if self.operation else ""))
        return HTTPException(
            status_code=http_status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Database error. Please contact support."
        )


class TransactionError(DatabaseError):
    """Raised when database transaction fails"""
    def __init__(self, message: str):
        super().__init__(message, operation="transaction")


# ============================================================================
# FILE HANDLING EXCEPTIONS
# ============================================================================

class FileUploadError(Exception):
    """Raised when file upload fails"""
    def __init__(self, message: str, file_name: Optional[str] = None):
        self.message = message
        self.file_name = file_name
        super().__init__(self.message)

    def to_http(self):
        """Convert to HTTP exception"""
        logger.error(f"File upload error: {self.message}" + (f" (file: {self.file_name})" if self.file_name else ""))
        return HTTPException(
            status_code=http_status.HTTP_400_BAD_REQUEST,
            detail="File upload failed. Please check file size and format."
        )


class FileSizeExceededError(FileUploadError):
    """Raised when uploaded file exceeds size limit"""
    def __init__(self, file_name: str, size: int, limit: int):
        message = f"File size {size} bytes exceeds limit of {limit} bytes"
        super().__init__(message, file_name)
        self.size = size
        self.limit = limit

    def to_http(self):
        """Convert to HTTP exception"""
        logger.warning(f"File size exceeded: {self.file_name} ({self.size} > {self.limit})")
        return HTTPException(
            status_code=http_status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
            detail=f"File size exceeds limit of {self.limit / 1024 / 1024:.1f} MB"
        )


# ============================================================================
# UTILITY FUNCTIONS
# ============================================================================

def handle_exception(exc: Exception) -> HTTPException:
    """
    Convert any exception to appropriate HTTPException.

    This is the central error handling router. All exceptions should be
    converted through this function before being returned to the client.

    Usage:
        try:
            do_something()
        except (ValidationError, ResourceNotFoundError) as e:
            raise handle_exception(e)
        except Exception as e:
            logger.exception(f"Unexpected error: {e}")
            raise HTTPException(status_code=500, detail="Internal server error")
    """
    if hasattr(exc, 'to_http'):
        return exc.to_http()

    # Fallback for exceptions without to_http method
    logger.exception(f"Unhandled exception type {type(exc).__name__}: {exc}")
    return HTTPException(
        status_code=http_status.HTTP_500_INTERNAL_SERVER_ERROR,
        detail="An unexpected error occurred. Please contact support."
    )
