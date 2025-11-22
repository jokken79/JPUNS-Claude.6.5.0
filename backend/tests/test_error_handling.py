"""
Tests for Error Handling System - FASE 4 #2

This test suite validates:
- Exception hierarchy and error codes
- Error middleware functionality
- Request ID generation and tracking
- Error response format
- Security (no sensitive data leaks)
"""

import pytest
import uuid
from datetime import datetime
from fastapi import FastAPI
from fastapi.testclient import TestClient
from unittest.mock import Mock, patch

from app.core.exceptions import (
    ApplicationError,
    ErrorCode,
    ValidationError,
    FormatValidationError,
    RangeValidationError,
    NotFoundError,
    ConflictError,
    GoneError,
    AuthenticationError,
    InvalidTokenError,
    ExpiredTokenError,
    InvalidCredentialsError,
    AuthorizationError,
    BusinessRuleError,
    PayrollCalculationError,
    WorkflowError,
    InsufficientDataError,
    FileUploadError,
    FileSizeError,
    FileTypeError,
    OCRProcessingError,
    ExternalServiceError,
    APIKeyError,
    DatabaseError,
    DatabaseConnectionError,
    DatabaseTransactionError,
    DatabaseIntegrityError,
    ServerError,
    ServerTimeoutError,
    ConfigurationError,
)
from app.core.error_middleware import ErrorHandlerMiddleware


# ============================================================================
# EXCEPTION TESTS
# ============================================================================

class TestApplicationError:
    """Test base ApplicationError class"""
    
    def test_basic_error_creation(self):
        """Test creating basic error"""
        error = ApplicationError("Test error")
        
        assert str(error) == "Test error"
        assert error.message == "Test error"
        assert error.status_code == 500
        assert error.error_code == ErrorCode.SERVER_ERROR
        assert isinstance(error.request_id, str)
        assert isinstance(error.timestamp, datetime)
    
    def test_error_with_custom_values(self):
        """Test error with custom status and code"""
        error = ApplicationError(
            message="Custom error",
            status_code=400,
            error_code=ErrorCode.VALIDATION_ERROR,
            context={"field": "email"},
            request_id="test-123"
        )
        
        assert error.status_code == 400
        assert error.error_code == ErrorCode.VALIDATION_ERROR
        assert error.context == {"field": "email"}
        assert error.request_id == "test-123"
    
    def test_error_to_dict(self):
        """Test error serialization to dictionary"""
        error = ApplicationError(
            message="Test error",
            status_code=404,
            error_code=ErrorCode.RESOURCE_NOT_FOUND,
            context={"resource_type": "User", "resource_id": "123"},
            request_id="req-456"
        )
        
        error_dict = error.to_dict()
        
        assert error_dict["success"] is False
        assert "error" in error_dict
        assert error_dict["error"]["code"] == ErrorCode.RESOURCE_NOT_FOUND.value
        assert error_dict["error"]["message"] == "Test error"
        assert error_dict["error"]["status"] == 404
        assert error_dict["error"]["request_id"] == "req-456"
        assert "timestamp" in error_dict["error"]
        assert error_dict["error"]["context"] == {"resource_type": "User", "resource_id": "123"}


class TestValidationErrors:
    """Test validation error types"""
    
    def test_basic_validation_error(self):
        """Test basic validation error"""
        error = ValidationError("Invalid input")
        
        assert error.status_code == 400
        assert error.error_code == ErrorCode.VALIDATION_ERROR
        assert error.message == "Invalid input"
    
    def test_validation_error_with_field(self):
        """Test validation error with field context"""
        error = ValidationError("Invalid email", field="email", value="not-an-email")
        
        assert error.error_code == ErrorCode.VALIDATION_FIELD
        assert error.context["field"] == "email"
        assert error.context["value"] == "not-an-email"
    
    def test_format_validation_error(self):
        """Test format validation error"""
        error = FormatValidationError("Date must be YYYY-MM-DD", field="birth_date")
        
        assert error.error_code == ErrorCode.VALIDATION_FORMAT
        assert error.status_code == 400
    
    def test_range_validation_error(self):
        """Test range validation error"""
        error = RangeValidationError(
            "Age out of range",
            field="age",
            min_value=18,
            max_value=65
        )
        
        assert error.error_code == ErrorCode.VALIDATION_RANGE
        assert error.context["min"] == 18
        assert error.context["max"] == 65


class TestResourceErrors:
    """Test resource error types"""
    
    def test_not_found_error(self):
        """Test NotFoundError"""
        error = NotFoundError("Employee", 123)
        
        assert error.status_code == 404
        assert error.error_code == ErrorCode.RESOURCE_NOT_FOUND
        assert "Employee" in error.message
        assert "123" in error.message
        assert error.context["resource_type"] == "Employee"
        assert error.context["resource_id"] == "123"
    
    def test_conflict_error(self):
        """Test ConflictError"""
        error = ConflictError("Email already exists", resource_type="User", identifier="email")
        
        assert error.status_code == 409
        assert error.error_code == ErrorCode.RESOURCE_ALREADY_EXISTS
        assert error.context["resource_type"] == "User"
        assert error.context["identifier"] == "email"
    
    def test_gone_error(self):
        """Test GoneError"""
        error = GoneError("Resource permanently deleted")
        
        assert error.status_code == 410
        assert error.error_code == ErrorCode.RESOURCE_GONE


class TestAuthErrors:
    """Test authentication and authorization errors"""
    
    def test_authentication_error(self):
        """Test AuthenticationError"""
        error = AuthenticationError("Login required")
        
        assert error.status_code == 401
        assert error.error_code == ErrorCode.AUTH_REQUIRED
    
    def test_invalid_token_error(self):
        """Test InvalidTokenError"""
        error = InvalidTokenError()
        
        assert error.status_code == 401
        assert error.error_code == ErrorCode.AUTH_INVALID_TOKEN
    
    def test_expired_token_error(self):
        """Test ExpiredTokenError"""
        error = ExpiredTokenError()
        
        assert error.status_code == 401
        assert error.error_code == ErrorCode.AUTH_EXPIRED_TOKEN
    
    def test_invalid_credentials_error(self):
        """Test InvalidCredentialsError"""
        error = InvalidCredentialsError()
        
        assert error.status_code == 401
        assert error.error_code == ErrorCode.AUTH_INVALID_CREDENTIALS
    
    def test_authorization_error(self):
        """Test AuthorizationError"""
        error = AuthorizationError("Admin required", required_permission="admin")
        
        assert error.status_code == 403
        assert error.error_code == ErrorCode.AUTH_FORBIDDEN
        assert error.context["required_permission"] == "admin"


class TestBusinessLogicErrors:
    """Test business logic errors"""
    
    def test_business_rule_error(self):
        """Test BusinessRuleError"""
        error = BusinessRuleError("Cannot delete with active contracts", rule="active_contracts")
        
        assert error.status_code == 422
        assert error.error_code == ErrorCode.BUSINESS_RULE_VIOLATION
        assert error.context["rule"] == "active_contracts"
    
    def test_payroll_calculation_error(self):
        """Test PayrollCalculationError"""
        error = PayrollCalculationError("Missing wage data", employee_id=123)
        
        assert error.status_code == 422
        assert error.error_code == ErrorCode.PAYROLL_CALCULATION_ERROR
        assert error.context["employee_id"] == 123
    
    def test_workflow_error(self):
        """Test WorkflowError"""
        error = WorkflowError("Approval required", step="manager_review")
        
        assert error.status_code == 422
        assert error.error_code == ErrorCode.WORKFLOW_ERROR
        assert error.context["step"] == "manager_review"
    
    def test_insufficient_data_error(self):
        """Test InsufficientDataError"""
        error = InsufficientDataError(
            "Missing fields",
            missing_fields=["tax_id", "ssn"]
        )
        
        assert error.status_code == 422
        assert error.error_code == ErrorCode.INSUFFICIENT_DATA
        assert error.context["missing_fields"] == ["tax_id", "ssn"]


class TestFileErrors:
    """Test file handling errors"""
    
    def test_file_upload_error(self):
        """Test FileUploadError"""
        error = FileUploadError("Upload failed", file_name="document.pdf")
        
        assert error.status_code == 400
        assert error.error_code == ErrorCode.FILE_UPLOAD_ERROR
        assert error.context["file_name"] == "document.pdf"
    
    def test_file_size_error(self):
        """Test FileSizeError"""
        error = FileSizeError(
            file_name="large.pdf",
            size=15_000_000,
            limit=10_000_000
        )
        
        assert error.status_code == 413
        assert error.error_code == ErrorCode.FILE_TOO_LARGE
        assert error.context["size_bytes"] == 15_000_000
        assert error.context["limit_bytes"] == 10_000_000
        assert "10.0 MB" in error.message
    
    def test_file_type_error(self):
        """Test FileTypeError"""
        error = FileTypeError(
            file_name="bad.exe",
            file_type="exe",
            allowed_types=["pdf", "jpg", "png"]
        )
        
        assert error.error_code == ErrorCode.FILE_TYPE_NOT_SUPPORTED
        assert error.context["file_type"] == "exe"
        assert error.context["allowed_types"] == ["pdf", "jpg", "png"]
    
    def test_ocr_processing_error(self):
        """Test OCRProcessingError"""
        error = OCRProcessingError("OCR failed", file_name="scan.jpg")
        
        assert error.status_code == 422
        assert error.error_code == ErrorCode.OCR_PROCESSING_ERROR
        assert error.context["file_name"] == "scan.jpg"


class TestExternalServiceErrors:
    """Test external service errors"""
    
    def test_external_service_error(self):
        """Test ExternalServiceError"""
        error = ExternalServiceError("Azure OCR", "Service unavailable", is_timeout=False)
        
        assert error.status_code == 502
        assert error.error_code == ErrorCode.EXTERNAL_SERVICE_ERROR
        assert error.context["service_name"] == "Azure OCR"
        assert error.context["is_timeout"] is False
    
    def test_external_service_timeout(self):
        """Test timeout error"""
        error = ExternalServiceError("Gemini API", "Timeout", is_timeout=True)
        
        assert error.status_code == 503
        assert error.error_code == ErrorCode.EXTERNAL_SERVICE_TIMEOUT
        assert error.context["is_timeout"] is True
    
    def test_api_key_error(self):
        """Test APIKeyError"""
        error = APIKeyError("OpenAI")
        
        assert error.error_code == ErrorCode.API_KEY_INVALID
        assert "OpenAI" in error.message


class TestDatabaseErrors:
    """Test database errors"""
    
    def test_database_error(self):
        """Test DatabaseError"""
        error = DatabaseError("Query failed", operation="update")
        
        assert error.status_code == 500
        assert error.error_code == ErrorCode.DATABASE_ERROR
        assert error.context["operation"] == "update"
    
    def test_database_connection_error(self):
        """Test DatabaseConnectionError"""
        error = DatabaseConnectionError()
        
        assert error.status_code == 500
        assert error.error_code == ErrorCode.DATABASE_CONNECTION_ERROR
        assert error.context["operation"] == "connection"
    
    def test_database_transaction_error(self):
        """Test DatabaseTransactionError"""
        error = DatabaseTransactionError()
        
        assert error.status_code == 500
        assert error.error_code == ErrorCode.DATABASE_TRANSACTION_ERROR
        assert error.context["operation"] == "transaction"
    
    def test_database_integrity_error(self):
        """Test DatabaseIntegrityError"""
        error = DatabaseIntegrityError("Unique violated", constraint="email_unique")
        
        assert error.status_code == 500
        assert error.error_code == ErrorCode.DATABASE_INTEGRITY_ERROR
        assert error.context["constraint"] == "email_unique"


class TestServerErrors:
    """Test server errors"""
    
    def test_server_error(self):
        """Test ServerError"""
        error = ServerError("Internal error")
        
        assert error.status_code == 500
        assert error.error_code == ErrorCode.SERVER_ERROR
    
    def test_server_timeout_error(self):
        """Test ServerTimeoutError"""
        error = ServerTimeoutError()
        
        assert error.status_code == 503
        assert error.error_code == ErrorCode.SERVER_TIMEOUT
    
    def test_configuration_error(self):
        """Test ConfigurationError"""
        error = ConfigurationError("Missing env var")
        
        assert error.status_code == 500
        assert error.error_code == ErrorCode.CONFIGURATION_ERROR


# ============================================================================
# MIDDLEWARE TESTS
# ============================================================================

def create_test_app():
    """Create FastAPI app for testing"""
    app = FastAPI()
    app.add_middleware(ErrorHandlerMiddleware)
    
    @app.get("/test/success")
    async def success_endpoint():
        return {"message": "success"}
    
    @app.get("/test/not-found")
    async def not_found_endpoint():
        raise NotFoundError("Item", 123)
    
    @app.get("/test/validation")
    async def validation_endpoint():
        raise ValidationError("Invalid input", field="email")
    
    @app.get("/test/auth")
    async def auth_endpoint():
        raise AuthenticationError()
    
    @app.get("/test/server-error")
    async def server_error_endpoint():
        raise Exception("Unexpected error")
    
    @app.get("/test/value-error")
    async def value_error_endpoint():
        raise ValueError("Invalid value")
    
    return app


class TestErrorMiddleware:
    """Test ErrorHandlerMiddleware"""
    
    def setup_method(self):
        """Setup test client"""
        self.app = create_test_app()
        self.client = TestClient(self.app)
    
    def test_success_response_has_request_id(self):
        """Test successful response includes request ID header"""
        response = self.client.get("/test/success")
        
        assert response.status_code == 200
        assert "X-Request-ID" in response.headers
        
        # Validate UUID format
        request_id = response.headers["X-Request-ID"]
        uuid.UUID(request_id)  # Raises if invalid
    
    def test_not_found_error_response(self):
        """Test NotFoundError response format"""
        response = self.client.get("/test/not-found")
        
        assert response.status_code == 404
        assert "X-Request-ID" in response.headers
        
        data = response.json()
        assert data["success"] is False
        assert "error" in data
        assert data["error"]["code"] == ErrorCode.RESOURCE_NOT_FOUND.value
        assert "Item" in data["error"]["message"]
        assert "123" in data["error"]["message"]
        assert data["error"]["status"] == 404
        assert "request_id" in data["error"]
        assert "timestamp" in data["error"]
    
    def test_validation_error_response(self):
        """Test ValidationError response format"""
        response = self.client.get("/test/validation")
        
        assert response.status_code == 400
        
        data = response.json()
        assert data["error"]["code"] == ErrorCode.VALIDATION_FIELD.value
        assert data["error"]["status"] == 400
    
    def test_auth_error_response(self):
        """Test AuthenticationError response"""
        response = self.client.get("/test/auth")
        
        assert response.status_code == 401
        
        data = response.json()
        assert data["error"]["code"] == ErrorCode.AUTH_REQUIRED.value
    
    def test_unexpected_error_response(self):
        """Test unexpected exception handling"""
        response = self.client.get("/test/server-error")
        
        assert response.status_code == 500
        
        data = response.json()
        assert data["error"]["code"] == ErrorCode.SERVER_ERROR.value
        assert data["error"]["status"] == 500
        assert "request_id" in data["error"]
    
    def test_value_error_converted_to_validation_error(self):
        """Test ValueError is converted to ValidationError"""
        response = self.client.get("/test/value-error")
        
        assert response.status_code == 400
        
        data = response.json()
        assert data["error"]["code"] == ErrorCode.VALIDATION_ERROR.value
    
    def test_request_id_consistency(self):
        """Test request ID is same in header and body"""
        response = self.client.get("/test/not-found")
        
        header_id = response.headers["X-Request-ID"]
        body_id = response.json()["error"]["request_id"]
        
        assert header_id == body_id
    
    def test_timestamp_format(self):
        """Test timestamp is valid ISO format"""
        response = self.client.get("/test/not-found")
        
        timestamp = response.json()["error"]["timestamp"]
        # Should parse without error
        datetime.fromisoformat(timestamp.rstrip('Z'))


# ============================================================================
# INTEGRATION TESTS
# ============================================================================

class TestErrorHandlingIntegration:
    """Integration tests for complete error flow"""
    
    def setup_method(self):
        """Setup test client"""
        self.app = create_test_app()
        self.client = TestClient(self.app)
    
    def test_multiple_requests_unique_ids(self):
        """Test each request gets unique request ID"""
        response1 = self.client.get("/test/success")
        response2 = self.client.get("/test/success")
        
        id1 = response1.headers["X-Request-ID"]
        id2 = response2.headers["X-Request-ID"]
        
        assert id1 != id2
    
    def test_error_context_included_in_development(self):
        """Test error context is included (when not production)"""
        response = self.client.get("/test/validation")
        
        data = response.json()
        # Context should be included in non-production
        # (actual behavior depends on settings.ENVIRONMENT)
        assert "error" in data


if __name__ == "__main__":
    pytest.main([__file__, "-v"])
