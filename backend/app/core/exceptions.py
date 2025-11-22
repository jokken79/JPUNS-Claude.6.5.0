"""
Modern Application Exception Hierarchy - FASE 4 #2

This module implements a unified error handling strategy with:
- Standardized error codes for client identification
- Consistent error response format with request tracking
- Context-aware error information for debugging
- Security-conscious error messages (no sensitive data leaks)

All exceptions extend ApplicationError base class and include:
- HTTP status code
- Error code (for client error handling)
- User-friendly message
- Optional context dictionary (for detailed debugging)
"""

from __future__ import annotations

import uuid
from datetime import datetime
from typing import Any, Dict, Optional
from enum import Enum


class ErrorCode(str, Enum):
    """Standard error codes for client-side error handling."""
    
    # Validation Errors (4000-4099)
    VALIDATION_ERROR = "ERR_VALIDATION_FAILED"
    VALIDATION_FIELD = "ERR_VALIDATION_FIELD"
    VALIDATION_FORMAT = "ERR_VALIDATION_FORMAT"
    VALIDATION_RANGE = "ERR_VALIDATION_RANGE"
    
    # Resource Errors (4100-4199)
    RESOURCE_NOT_FOUND = "ERR_RESOURCE_NOT_FOUND"
    RESOURCE_ALREADY_EXISTS = "ERR_RESOURCE_ALREADY_EXISTS"
    RESOURCE_CONFLICT = "ERR_RESOURCE_CONFLICT"
    RESOURCE_GONE = "ERR_RESOURCE_GONE"
    
    # Authentication Errors (4200-4299)
    AUTH_REQUIRED = "ERR_AUTH_REQUIRED"
    AUTH_INVALID_TOKEN = "ERR_AUTH_INVALID_TOKEN"
    AUTH_EXPIRED_TOKEN = "ERR_AUTH_EXPIRED_TOKEN"
    AUTH_INVALID_CREDENTIALS = "ERR_AUTH_INVALID_CREDENTIALS"
    AUTH_FORBIDDEN = "ERR_AUTH_FORBIDDEN"
    AUTH_INSUFFICIENT_PERMISSIONS = "ERR_AUTH_INSUFFICIENT_PERMISSIONS"
    
    # Business Logic Errors (4300-4399)
    BUSINESS_RULE_VIOLATION = "ERR_BUSINESS_RULE"
    PAYROLL_CALCULATION_ERROR = "ERR_PAYROLL_CALCULATION"
    WORKFLOW_ERROR = "ERR_WORKFLOW"
    INSUFFICIENT_DATA = "ERR_INSUFFICIENT_DATA"
    OPERATION_NOT_ALLOWED = "ERR_OPERATION_NOT_ALLOWED"
    
    # File/Upload Errors (4400-4499)
    FILE_UPLOAD_ERROR = "ERR_FILE_UPLOAD"
    FILE_TOO_LARGE = "ERR_FILE_TOO_LARGE"
    FILE_TYPE_NOT_SUPPORTED = "ERR_FILE_TYPE_UNSUPPORTED"
    FILE_PROCESSING_ERROR = "ERR_FILE_PROCESSING"
    OCR_PROCESSING_ERROR = "ERR_OCR_PROCESSING"
    
    # External Service Errors (5000-5099)
    EXTERNAL_SERVICE_ERROR = "ERR_EXTERNAL_SERVICE"
    EXTERNAL_SERVICE_TIMEOUT = "ERR_EXTERNAL_SERVICE_TIMEOUT"
    EXTERNAL_SERVICE_UNAVAILABLE = "ERR_EXTERNAL_SERVICE_UNAVAILABLE"
    API_KEY_INVALID = "ERR_API_KEY_INVALID"
    
    # Database Errors (5100-5199)
    DATABASE_ERROR = "ERR_DATABASE"
    DATABASE_CONNECTION_ERROR = "ERR_DATABASE_CONNECTION"
    DATABASE_TRANSACTION_ERROR = "ERR_DATABASE_TRANSACTION"
    DATABASE_INTEGRITY_ERROR = "ERR_DATABASE_INTEGRITY"
    
    # Server Errors (5200-5299)
    SERVER_ERROR = "ERR_SERVER"
    SERVER_TIMEOUT = "ERR_SERVER_TIMEOUT"
    SERVER_UNAVAILABLE = "ERR_SERVER_UNAVAILABLE"
    CONFIGURATION_ERROR = "ERR_CONFIGURATION"


class ApplicationError(Exception):
    """
    Base exception class for all application errors.
    
    Provides standardized error structure with:
    - HTTP status code for API responses
    - Error code for client-side handling
    - User-friendly message
    - Optional context for debugging
    - Request ID for tracking
    """
    
    def __init__(
        self,
        message: str,
        status_code: int = 500,
        error_code: ErrorCode = ErrorCode.SERVER_ERROR,
        context: Optional[Dict[str, Any]] = None,
        request_id: Optional[str] = None
    ):
        super().__init__(message)
        self.message = message
        self.status_code = status_code
        self.error_code = error_code
        self.context = context or {}
        self.request_id = request_id or str(uuid.uuid4())
        self.timestamp = datetime.utcnow()
    
    def to_dict(self) -> Dict[str, Any]:
        """Convert exception to dictionary for JSON response."""
        error_dict: Dict[str, Any] = {
            "success": False,
            "error": {
                "code": self.error_code.value,
                "message": self.message,
                "status": self.status_code,
                "request_id": self.request_id,
                "timestamp": self.timestamp.isoformat() + "Z"
            }
        }
        
        # Only include context in non-production for security
        if self.context:
            error_dict["error"]["context"] = self.context
            
        return error_dict


# ============================================================================
# VALIDATION EXCEPTIONS (400 Bad Request)
# ============================================================================

class ValidationError(ApplicationError):
    """Raised when input validation fails."""
    
    def __init__(
        self,
        message: str = "Validation failed",
        field: Optional[str] = None,
        value: Optional[Any] = None,
        **kwargs
    ):
        context = kwargs.pop("context", {})
        if field:
            context["field"] = field
        if value is not None:
            context["value"] = str(value)  # Convert to string to avoid leaking sensitive data
            
        super().__init__(
            message=message,
            status_code=400,
            error_code=ErrorCode.VALIDATION_FIELD if field else ErrorCode.VALIDATION_ERROR,
            context=context,
            **kwargs
        )


class FormatValidationError(ValidationError):
    """Raised when data format is invalid."""
    
    def __init__(self, message: str = "Invalid format", **kwargs):
        kwargs.setdefault("error_code", ErrorCode.VALIDATION_FORMAT)
        super().__init__(message=message, **kwargs)


class RangeValidationError(ValidationError):
    """Raised when value is out of acceptable range."""
    
    def __init__(
        self,
        message: str = "Value out of range",
        min_value: Optional[Any] = None,
        max_value: Optional[Any] = None,
        **kwargs
    ):
        context = kwargs.pop("context", {})
        if min_value is not None:
            context["min"] = min_value
        if max_value is not None:
            context["max"] = max_value
        
        kwargs["context"] = context
        kwargs.setdefault("error_code", ErrorCode.VALIDATION_RANGE)
        super().__init__(message=message, **kwargs)


# ============================================================================
# RESOURCE EXCEPTIONS (404, 409, 410)
# ============================================================================

class NotFoundError(ApplicationError):
    """Raised when a requested resource doesn't exist."""
    
    def __init__(
        self,
        resource_type: str = "Resource",
        resource_id: Optional[Any] = None,
        message: Optional[str] = None,
        **kwargs
    ):
        if message is None:
            message = f"{resource_type} not found"
            if resource_id:
                message = f"{resource_type} with ID {resource_id} not found"
        
        context = kwargs.pop("context", {})
        context["resource_type"] = resource_type
        if resource_id:
            context["resource_id"] = str(resource_id)
        
        super().__init__(
            message=message,
            status_code=404,
            error_code=ErrorCode.RESOURCE_NOT_FOUND,
            context=context,
            **kwargs
        )


class ConflictError(ApplicationError):
    """Raised when resource already exists or conflicts with existing resource."""
    
    def __init__(
        self,
        message: str = "Resource conflict",
        resource_type: Optional[str] = None,
        identifier: Optional[str] = None,
        **kwargs
    ):
        context = kwargs.pop("context", {})
        if resource_type:
            context["resource_type"] = resource_type
        if identifier:
            context["identifier"] = identifier
            
        super().__init__(
            message=message,
            status_code=409,
            error_code=ErrorCode.RESOURCE_ALREADY_EXISTS,
            context=context,
            **kwargs
        )


class GoneError(ApplicationError):
    """Raised when resource has been permanently removed."""
    
    def __init__(self, message: str = "Resource no longer available", **kwargs):
        super().__init__(
            message=message,
            status_code=410,
            error_code=ErrorCode.RESOURCE_GONE,
            **kwargs
        )


# ============================================================================
# AUTHENTICATION & AUTHORIZATION EXCEPTIONS (401, 403)
# ============================================================================

class AuthenticationError(ApplicationError):
    """Raised when authentication fails."""
    
    def __init__(self, message: str = "Authentication required", **kwargs):
        super().__init__(
            message=message,
            status_code=401,
            error_code=ErrorCode.AUTH_REQUIRED,
            **kwargs
        )


class InvalidTokenError(AuthenticationError):
    """Raised when token is invalid."""
    
    def __init__(self, message: str = "Invalid authentication token", **kwargs):
        kwargs.setdefault("error_code", ErrorCode.AUTH_INVALID_TOKEN)
        super().__init__(message=message, **kwargs)


class ExpiredTokenError(AuthenticationError):
    """Raised when token has expired."""
    
    def __init__(self, message: str = "Authentication token has expired", **kwargs):
        kwargs.setdefault("error_code", ErrorCode.AUTH_EXPIRED_TOKEN)
        super().__init__(message=message, **kwargs)


class InvalidCredentialsError(AuthenticationError):
    """Raised when login credentials are invalid."""
    
    def __init__(self, message: str = "Invalid username or password", **kwargs):
        kwargs.setdefault("error_code", ErrorCode.AUTH_INVALID_CREDENTIALS)
        super().__init__(message=message, **kwargs)


class AuthorizationError(ApplicationError):
    """Raised when user lacks permission for action."""
    
    def __init__(
        self,
        message: str = "Permission denied",
        required_permission: Optional[str] = None,
        **kwargs
    ):
        context = kwargs.pop("context", {})
        if required_permission:
            context["required_permission"] = required_permission
            
        super().__init__(
            message=message,
            status_code=403,
            error_code=ErrorCode.AUTH_FORBIDDEN,
            context=context,
            **kwargs
        )


# ============================================================================
# BUSINESS LOGIC EXCEPTIONS (422 Unprocessable Entity)
# ============================================================================

class BusinessRuleError(ApplicationError):
    """Raised when business rule is violated."""
    
    def __init__(
        self,
        message: str,
        rule: Optional[str] = None,
        **kwargs
    ):
        context = kwargs.pop("context", {})
        if rule:
            context["rule"] = rule
            
        super().__init__(
            message=message,
            status_code=422,
            error_code=ErrorCode.BUSINESS_RULE_VIOLATION,
            context=context,
            **kwargs
        )


class PayrollCalculationError(BusinessRuleError):
    """Raised when payroll calculation fails."""
    
    def __init__(
        self,
        message: str = "Payroll calculation failed",
        employee_id: Optional[int] = None,
        **kwargs
    ):
        context = kwargs.pop("context", {})
        if employee_id:
            context["employee_id"] = employee_id
            
        kwargs["context"] = context
        kwargs.setdefault("error_code", ErrorCode.PAYROLL_CALCULATION_ERROR)
        super().__init__(message=message, **kwargs)


class WorkflowError(BusinessRuleError):
    """Raised when workflow validation or processing fails."""
    
    def __init__(
        self,
        message: str,
        step: Optional[str] = None,
        **kwargs
    ):
        context = kwargs.pop("context", {})
        if step:
            context["step"] = step
            
        kwargs["context"] = context
        kwargs.setdefault("error_code", ErrorCode.WORKFLOW_ERROR)
        super().__init__(message=message, **kwargs)


class InsufficientDataError(BusinessRuleError):
    """Raised when required data is missing for an operation."""
    
    def __init__(
        self,
        message: str = "Insufficient data to complete operation",
        missing_fields: Optional[list] = None,
        **kwargs
    ):
        context = kwargs.pop("context", {})
        if missing_fields:
            context["missing_fields"] = missing_fields
            
        kwargs["context"] = context
        kwargs.setdefault("error_code", ErrorCode.INSUFFICIENT_DATA)
        super().__init__(message=message, **kwargs)


# ============================================================================
# FILE HANDLING EXCEPTIONS (400, 413, 422)
# ============================================================================

class FileUploadError(ApplicationError):
    """Raised when file upload fails."""
    
    def __init__(
        self,
        message: str = "File upload failed",
        file_name: Optional[str] = None,
        **kwargs
    ):
        context = kwargs.pop("context", {})
        if file_name:
            context["file_name"] = file_name
            
        super().__init__(
            message=message,
            status_code=400,
            error_code=ErrorCode.FILE_UPLOAD_ERROR,
            context=context,
            **kwargs
        )


class FileSizeError(FileUploadError):
    """Raised when uploaded file exceeds size limit."""
    
    def __init__(
        self,
        file_name: str,
        size: int,
        limit: int,
        **kwargs
    ):
        message = f"File size exceeds limit of {limit / 1024 / 1024:.1f} MB"
        context = kwargs.pop("context", {})
        context.update({
            "file_name": file_name,
            "size_bytes": size,
            "limit_bytes": limit
        })
        
        kwargs["context"] = context
        super().__init__(
            message=message,
            status_code=413,
            error_code=ErrorCode.FILE_TOO_LARGE,
            **kwargs
        )


class FileTypeError(FileUploadError):
    """Raised when file type is not supported."""
    
    def __init__(
        self,
        file_name: str,
        file_type: str,
        allowed_types: Optional[list] = None,
        **kwargs
    ):
        message = f"File type '{file_type}' is not supported"
        context = kwargs.pop("context", {})
        context["file_type"] = file_type
        if allowed_types:
            context["allowed_types"] = allowed_types
            
        kwargs["context"] = context
        kwargs.setdefault("error_code", ErrorCode.FILE_TYPE_NOT_SUPPORTED)
        super().__init__(message=message, file_name=file_name, **kwargs)


class OCRProcessingError(ApplicationError):
    """Raised when OCR processing fails."""
    
    def __init__(
        self,
        message: str = "Document processing failed",
        file_name: Optional[str] = None,
        **kwargs
    ):
        context = kwargs.pop("context", {})
        if file_name:
            context["file_name"] = file_name
            
        super().__init__(
            message=message,
            status_code=422,
            error_code=ErrorCode.OCR_PROCESSING_ERROR,
            context=context,
            **kwargs
        )


# ============================================================================
# EXTERNAL SERVICE EXCEPTIONS (502, 503)
# ============================================================================

class ExternalServiceError(ApplicationError):
    """Raised when external API/service call fails."""
    
    def __init__(
        self,
        service_name: str,
        message: Optional[str] = None,
        is_timeout: bool = False,
        **kwargs
    ):
        if message is None:
            message = f"{service_name} is currently unavailable"
            
        context = kwargs.pop("context", {})
        context["service_name"] = service_name
        context["is_timeout"] = is_timeout
        
        status_code = 503 if is_timeout else 502
        error_code = ErrorCode.EXTERNAL_SERVICE_TIMEOUT if is_timeout else ErrorCode.EXTERNAL_SERVICE_ERROR
        
        super().__init__(
            message=message,
            status_code=status_code,
            error_code=error_code,
            context=context,
            **kwargs
        )


class APIKeyError(ExternalServiceError):
    """Raised when API key is invalid or expired."""
    
    def __init__(self, service_name: str, **kwargs):
        kwargs.setdefault("error_code", ErrorCode.API_KEY_INVALID)
        super().__init__(
            service_name=service_name,
            message=f"Authentication with {service_name} failed",
            **kwargs
        )


# ============================================================================
# DATABASE EXCEPTIONS (500)
# ============================================================================

class DatabaseError(ApplicationError):
    """Raised when database operation fails."""
    
    def __init__(
        self,
        message: str = "Database error occurred",
        operation: Optional[str] = None,
        **kwargs
    ):
        context = kwargs.pop("context", {})
        if operation:
            context["operation"] = operation
            
        super().__init__(
            message=message,
            status_code=500,
            error_code=ErrorCode.DATABASE_ERROR,
            context=context,
            **kwargs
        )


class DatabaseConnectionError(DatabaseError):
    """Raised when database connection fails."""
    
    def __init__(self, message: str = "Database connection failed", **kwargs):
        kwargs.setdefault("error_code", ErrorCode.DATABASE_CONNECTION_ERROR)
        super().__init__(message=message, operation="connection", **kwargs)


class DatabaseTransactionError(DatabaseError):
    """Raised when database transaction fails."""
    
    def __init__(self, message: str = "Database transaction failed", **kwargs):
        kwargs.setdefault("error_code", ErrorCode.DATABASE_TRANSACTION_ERROR)
        super().__init__(message=message, operation="transaction", **kwargs)


class DatabaseIntegrityError(DatabaseError):
    """Raised when database integrity constraint is violated."""
    
    def __init__(
        self,
        message: str = "Database integrity constraint violated",
        constraint: Optional[str] = None,
        **kwargs
    ):
        context = kwargs.pop("context", {})
        if constraint:
            context["constraint"] = constraint
            
        kwargs["context"] = context
        kwargs.setdefault("error_code", ErrorCode.DATABASE_INTEGRITY_ERROR)
        super().__init__(message=message, operation="integrity_check", **kwargs)


# ============================================================================
# SERVER EXCEPTIONS (500, 503)
# ============================================================================

class ServerError(ApplicationError):
    """Raised for internal server errors."""
    
    def __init__(self, message: str = "Internal server error", **kwargs):
        super().__init__(
            message=message,
            status_code=500,
            error_code=ErrorCode.SERVER_ERROR,
            **kwargs
        )


class ServerTimeoutError(ServerError):
    """Raised when server operation times out."""
    
    def __init__(self, message: str = "Server operation timed out", **kwargs):
        kwargs.setdefault("error_code", ErrorCode.SERVER_TIMEOUT)
        kwargs.setdefault("status_code", 503)
        super().__init__(message=message, **kwargs)


class ConfigurationError(ServerError):
    """Raised when server configuration is invalid."""
    
    def __init__(self, message: str = "Server configuration error", **kwargs):
        kwargs.setdefault("error_code", ErrorCode.CONFIGURATION_ERROR)
        super().__init__(message=message, **kwargs)


# ============================================================================
# COMPATIBILITY ALIASES (for backward compatibility with existing code)
# ============================================================================

# Map old exception names to new ones
ResourceNotFoundError = NotFoundError
ResourceAlreadyExistsError = ConflictError
UnauthorizedError = AuthenticationError
ForbiddenError = AuthorizationError


__all__ = [
    # Enums
    "ErrorCode",
    # Base
    "ApplicationError",
    # Validation
    "ValidationError",
    "FormatValidationError",
    "RangeValidationError",
    # Resources
    "NotFoundError",
    "ConflictError",
    "GoneError",
    # Auth
    "AuthenticationError",
    "InvalidTokenError",
    "ExpiredTokenError",
    "InvalidCredentialsError",
    "AuthorizationError",
    # Business Logic
    "BusinessRuleError",
    "PayrollCalculationError",
    "WorkflowError",
    "InsufficientDataError",
    # Files
    "FileUploadError",
    "FileSizeError",
    "FileTypeError",
    "OCRProcessingError",
    # External Services
    "ExternalServiceError",
    "APIKeyError",
    # Database
    "DatabaseError",
    "DatabaseConnectionError",
    "DatabaseTransactionError",
    "DatabaseIntegrityError",
    # Server
    "ServerError",
    "ServerTimeoutError",
    "ConfigurationError",
    # Compatibility aliases
    "ResourceNotFoundError",
    "ResourceAlreadyExistsError",
    "UnauthorizedError",
    "ForbiddenError",
]
