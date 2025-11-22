# FASE 4 #2: Error Handling Standardization

## Overview

This document describes the unified error handling strategy implemented across the entire application (backend and frontend). The system provides consistent error responses, comprehensive error tracking, and security-conscious error messages.

## Table of Contents

1. [Architecture Overview](#architecture-overview)
2. [Backend Error Handling](#backend-error-handling)
3. [Frontend Error Handling](#frontend-error-handling)
4. [Error Code Reference](#error-code-reference)
5. [Usage Examples](#usage-examples)
6. [Testing](#testing)
7. [Migration Guide](#migration-guide)

---

## Architecture Overview

### Design Principles

1. **Consistency**: All errors follow the same response format
2. **Traceability**: Every error includes a unique request ID
3. **Security**: No sensitive data in error responses
4. **User-Friendly**: Clear, actionable error messages
5. **Developer-Friendly**: Rich context for debugging (non-production)

### Error Flow

```
┌─────────────┐
│   Request   │
└──────┬──────┘
       │
       ├─ Generate Request ID
       │
       ▼
┌─────────────────┐
│   Middleware    │ ◄── ErrorHandlerMiddleware
└────────┬────────┘
         │
         ├─ Route/Service throws ApplicationError
         │
         ▼
┌──────────────────────┐
│  Error Middleware    │
├──────────────────────┤
│ - Catch exception    │
│ - Add request ID     │
│ - Log with context   │
│ - Generate response  │
└──────────┬───────────┘
           │
           ▼
┌─────────────────────────┐
│   Standard JSON Response│
├─────────────────────────┤
│ {                       │
│   "success": false,     │
│   "error": {            │
│     "code": "ERR_...",  │
│     "message": "...",   │
│     "status": 4xx/5xx,  │
│     "request_id": "uuid"│
│     "timestamp": "..."  │
│   }                     │
│ }                       │
└─────────────────────────┘
           │
           ▼
┌─────────────────────────┐
│   Frontend Handler      │
├─────────────────────────┤
│ - Parse error response  │
│ - Display to user       │
│ - Log for tracking      │
│ - Handle auth errors    │
└─────────────────────────┘
```

---

## Backend Error Handling

### Exception Hierarchy

All exceptions extend `ApplicationError` base class:

```python
from app.core.exceptions import ApplicationError, ErrorCode

class ApplicationError(Exception):
    """
    Base exception class with:
    - HTTP status code
    - Error code (for client handling)
    - User-friendly message
    - Optional context (debugging)
    - Request ID (tracking)
    """
    def __init__(
        self,
        message: str,
        status_code: int = 500,
        error_code: ErrorCode = ErrorCode.SERVER_ERROR,
        context: Optional[Dict[str, Any]] = None,
        request_id: Optional[str] = None
    )
```

### Exception Categories

#### 1. Validation Errors (400)
```python
from app.core.exceptions import ValidationError, FormatValidationError, RangeValidationError

# Basic validation
raise ValidationError("Invalid email format", field="email")

# Format validation
raise FormatValidationError("Date must be in YYYY-MM-DD format", field="birth_date")

# Range validation
raise RangeValidationError(
    "Age must be between 18 and 65",
    field="age",
    min_value=18,
    max_value=65
)
```

#### 2. Resource Errors (404, 409, 410)
```python
from app.core.exceptions import NotFoundError, ConflictError, GoneError

# Not found
raise NotFoundError("Employee", employee_id)

# Conflict (already exists)
raise ConflictError(
    "Email already registered",
    resource_type="User",
    identifier="email"
)

# Gone (permanently deleted)
raise GoneError("This resource has been permanently deleted")
```

#### 3. Authentication & Authorization (401, 403)
```python
from app.core.exceptions import (
    AuthenticationError,
    InvalidTokenError,
    ExpiredTokenError,
    InvalidCredentialsError,
    AuthorizationError
)

# Authentication required
raise AuthenticationError()

# Invalid token
raise InvalidTokenError("Token signature invalid")

# Expired token
raise ExpiredTokenError()

# Wrong password
raise InvalidCredentialsError()

# No permission
raise AuthorizationError(
    "Admin permission required",
    required_permission="admin"
)
```

#### 4. Business Logic Errors (422)
```python
from app.core.exceptions import (
    BusinessRuleError,
    PayrollCalculationError,
    WorkflowError,
    InsufficientDataError
)

# Business rule violation
raise BusinessRuleError(
    "Cannot delete employee with active contracts",
    rule="active_contracts_check"
)

# Payroll calculation error
raise PayrollCalculationError(
    "Missing wage information",
    employee_id=123
)

# Workflow error
raise WorkflowError(
    "Cannot approve without manager review",
    step="approval"
)

# Insufficient data
raise InsufficientDataError(
    "Missing required tax information",
    missing_fields=["tax_id", "tax_rate"]
)
```

#### 5. File Handling Errors (400, 413, 422)
```python
from app.core.exceptions import (
    FileUploadError,
    FileSizeError,
    FileTypeError,
    OCRProcessingError
)

# Upload error
raise FileUploadError("File corrupted during upload", file_name="doc.pdf")

# File too large
raise FileSizeError(
    file_name="large.pdf",
    size=15_000_000,  # 15 MB
    limit=10_000_000  # 10 MB
)

# Wrong file type
raise FileTypeError(
    file_name="image.exe",
    file_type="exe",
    allowed_types=["pdf", "jpg", "png"]
)

# OCR error
raise OCRProcessingError(
    "Could not extract text from image",
    file_name="scan.jpg"
)
```

#### 6. External Service Errors (502, 503)
```python
from app.core.exceptions import ExternalServiceError, APIKeyError

# Service unavailable
raise ExternalServiceError(
    service_name="Azure OCR",
    message="Service temporarily unavailable",
    is_timeout=True
)

# Invalid API key
raise APIKeyError("Gemini API")
```

#### 7. Database Errors (500)
```python
from app.core.exceptions import (
    DatabaseError,
    DatabaseConnectionError,
    DatabaseTransactionError,
    DatabaseIntegrityError
)

# Generic database error
raise DatabaseError("Query failed", operation="update")

# Connection error
raise DatabaseConnectionError()

# Transaction error
raise DatabaseTransactionError("Rollback failed")

# Integrity constraint
raise DatabaseIntegrityError(
    "Unique constraint violated",
    constraint="email_unique"
)
```

#### 8. Server Errors (500, 503)
```python
from app.core.exceptions import ServerError, ServerTimeoutError, ConfigurationError

# Generic server error
raise ServerError("Unexpected server error")

# Timeout
raise ServerTimeoutError("Operation exceeded time limit")

# Configuration error
raise ConfigurationError("Missing required environment variable")
```

### Error Middleware

The `ErrorHandlerMiddleware` automatically:

1. **Generates Request IDs**: Every request gets a unique UUID
2. **Catches Exceptions**: Handles all exception types
3. **Logs with Context**: Structured logging with full error details
4. **Converts to JSON**: Standard error response format
5. **Removes Sensitive Data**: Context removed in production
6. **Adds Headers**: X-Request-ID header for tracking

```python
# In main.py
from app.core.error_middleware import ErrorHandlerMiddleware

app.add_middleware(ErrorHandlerMiddleware)
```

### Usage in Routes

```python
from fastapi import APIRouter, Depends
from app.core.exceptions import NotFoundError, ValidationError

router = APIRouter()

@router.get("/employees/{employee_id}")
async def get_employee(employee_id: int, db: Session = Depends(get_db)):
    """
    No need for try-except! ErrorHandlerMiddleware handles all exceptions.
    """
    employee = db.query(Employee).filter(Employee.id == employee_id).first()
    
    if not employee:
        raise NotFoundError("Employee", employee_id)
    
    return employee

@router.post("/employees")
async def create_employee(data: EmployeeCreate, db: Session = Depends(get_db)):
    # Validation
    if not is_valid_email(data.email):
        raise ValidationError("Invalid email format", field="email")
    
    # Check for duplicates
    existing = db.query(Employee).filter(Employee.email == data.email).first()
    if existing:
        raise ConflictError("Email already registered", identifier="email")
    
    # Create employee
    employee = Employee(**data.dict())
    db.add(employee)
    db.commit()
    
    return employee
```

---

## Frontend Error Handling

### Error Utilities

```typescript
import { parseError, apiFetch, withRetry, ErrorCode } from '@/lib/errors';

// Parse error response
try {
  const response = await fetch('/api/endpoint');
  const data = await response.json();
} catch (error) {
  const parsedError = parseError(error);
  console.log(parsedError.code);        // Error code
  console.log(parsedError.message);     // User message
  console.log(parsedError.requestId);   // Request ID for support
  console.log(parsedError.isRetryable); // Can retry?
}

// Use apiFetch wrapper (handles errors automatically)
const data = await apiFetch<Employee[]>('/api/employees');

// Retry on network errors
const data = await withRetry(
  () => apiFetch<Employee>('/api/employees/1'),
  maxRetries: 3,
  delayMs: 1000
);
```

### Error Boundaries

```tsx
import { ErrorBoundary } from '@/components/error-boundary';

// Wrap component with error boundary
<ErrorBoundary>
  <MyComponent />
</ErrorBoundary>

// With custom error handler
<ErrorBoundary onError={(error, errorInfo) => {
  logToAnalytics(error, errorInfo);
}}>
  <MyComponent />
</ErrorBoundary>
```

### Error Display

```tsx
import { parseError, getErrorTitle, getUserFriendlyMessage } from '@/lib/errors';

function MyComponent() {
  const [error, setError] = useState(null);

  const handleSubmit = async () => {
    try {
      await apiFetch('/api/endpoint', { method: 'POST' });
    } catch (err) {
      const parsedError = parseError(err);
      setError(parsedError);
      
      // Show toast notification
      toast.error(getUserFriendlyMessage(parsedError));
    }
  };

  return (
    <div>
      {error && (
        <Alert variant="destructive">
          <AlertTitle>{getErrorTitle(error)}</AlertTitle>
          <AlertDescription>
            {error.message}
            <br />
            <small>Request ID: {error.requestId}</small>
          </AlertDescription>
        </Alert>
      )}
      <Button onClick={handleSubmit}>Submit</Button>
    </div>
  );
}
```

---

## Error Code Reference

### Quick Reference Table

| Code | Status | Description | Retryable | Auth |
|------|--------|-------------|-----------|------|
| `ERR_VALIDATION_FAILED` | 400 | General validation failure | No | No |
| `ERR_VALIDATION_FIELD` | 400 | Specific field validation failed | No | No |
| `ERR_VALIDATION_FORMAT` | 400 | Invalid format | No | No |
| `ERR_VALIDATION_RANGE` | 400 | Value out of range | No | No |
| `ERR_RESOURCE_NOT_FOUND` | 404 | Resource doesn't exist | No | No |
| `ERR_RESOURCE_ALREADY_EXISTS` | 409 | Duplicate resource | No | No |
| `ERR_RESOURCE_CONFLICT` | 409 | Resource conflict | No | No |
| `ERR_RESOURCE_GONE` | 410 | Resource permanently deleted | No | No |
| `ERR_AUTH_REQUIRED` | 401 | Authentication required | No | Yes |
| `ERR_AUTH_INVALID_TOKEN` | 401 | Invalid authentication token | No | Yes |
| `ERR_AUTH_EXPIRED_TOKEN` | 401 | Token has expired | No | Yes |
| `ERR_AUTH_INVALID_CREDENTIALS` | 401 | Wrong username/password | No | Yes |
| `ERR_AUTH_FORBIDDEN` | 403 | Permission denied | No | Yes |
| `ERR_AUTH_INSUFFICIENT_PERMISSIONS` | 403 | Lacks required permission | No | Yes |
| `ERR_BUSINESS_RULE` | 422 | Business rule violated | No | No |
| `ERR_PAYROLL_CALCULATION` | 422 | Payroll calculation failed | No | No |
| `ERR_WORKFLOW` | 422 | Workflow error | No | No |
| `ERR_INSUFFICIENT_DATA` | 422 | Missing required data | No | No |
| `ERR_OPERATION_NOT_ALLOWED` | 422 | Operation not allowed | No | No |
| `ERR_FILE_UPLOAD` | 400 | File upload failed | No | No |
| `ERR_FILE_TOO_LARGE` | 413 | File exceeds size limit | No | No |
| `ERR_FILE_TYPE_UNSUPPORTED` | 400 | File type not supported | No | No |
| `ERR_FILE_PROCESSING` | 422 | File processing failed | No | No |
| `ERR_OCR_PROCESSING` | 422 | OCR processing failed | No | No |
| `ERR_EXTERNAL_SERVICE` | 502 | External service error | No | No |
| `ERR_EXTERNAL_SERVICE_TIMEOUT` | 503 | External service timeout | Yes | No |
| `ERR_EXTERNAL_SERVICE_UNAVAILABLE` | 503 | Service unavailable | Yes | No |
| `ERR_API_KEY_INVALID` | 401 | Invalid API key | No | No |
| `ERR_DATABASE` | 500 | Database error | No | No |
| `ERR_DATABASE_CONNECTION` | 500 | Database connection failed | Yes | No |
| `ERR_DATABASE_TRANSACTION` | 500 | Transaction failed | No | No |
| `ERR_DATABASE_INTEGRITY` | 500 | Integrity constraint violated | No | No |
| `ERR_SERVER` | 500 | Internal server error | No | No |
| `ERR_SERVER_TIMEOUT` | 503 | Server operation timeout | Yes | No |
| `ERR_SERVER_UNAVAILABLE` | 503 | Server unavailable | Yes | No |
| `ERR_CONFIGURATION` | 500 | Configuration error | No | No |

### Error Response Format

All errors follow this structure:

```json
{
  "success": false,
  "error": {
    "code": "ERR_RESOURCE_NOT_FOUND",
    "message": "Employee with ID 123 not found",
    "status": 404,
    "request_id": "550e8400-e29b-41d4-a716-446655440000",
    "timestamp": "2025-11-22T10:30:00.000Z",
    "context": {
      "resource_type": "Employee",
      "resource_id": "123"
    }
  }
}
```

**Note**: `context` field is only included in non-production environments for security.

---

## Usage Examples

### Example 1: Employee CRUD

```python
# Backend Route
from app.core.exceptions import NotFoundError, ValidationError, ConflictError

@router.get("/employees/{id}")
async def get_employee(id: int, db: Session = Depends(get_db)):
    employee = db.query(Employee).filter(Employee.id == id).first()
    if not employee:
        raise NotFoundError("Employee", id)
    return employee

@router.post("/employees")
async def create_employee(data: EmployeeCreate, db: Session = Depends(get_db)):
    # Validation
    if not is_valid_email(data.email):
        raise ValidationError("Invalid email format", field="email")
    
    # Check duplicate
    if db.query(Employee).filter(Employee.email == data.email).first():
        raise ConflictError("Email already in use", identifier="email")
    
    employee = Employee(**data.dict())
    db.add(employee)
    db.commit()
    return employee
```

```typescript
// Frontend Component
import { apiFetch, parseError } from '@/lib/errors';

async function createEmployee(data: EmployeeCreate) {
  try {
    const employee = await apiFetch<Employee>('/api/employees', {
      method: 'POST',
      body: JSON.stringify(data),
    });
    
    toast.success('Employee created successfully');
    return employee;
  } catch (error) {
    const parsedError = parseError(error);
    
    if (parsedError.code === 'ERR_VALIDATION_FIELD') {
      // Show field-specific error
      const field = parsedError.context?.field;
      showFieldError(field, parsedError.message);
    } else {
      // Show general error
      toast.error(parsedError.message);
    }
    
    throw error;
  }
}
```

### Example 2: File Upload with Size Validation

```python
# Backend
from app.core.exceptions import FileSizeError, FileTypeError

@router.post("/upload")
async def upload_file(file: UploadFile):
    MAX_SIZE = 10 * 1024 * 1024  # 10 MB
    ALLOWED_TYPES = ["pdf", "jpg", "png"]
    
    # Check size
    file.file.seek(0, 2)  # Seek to end
    size = file.file.tell()
    file.file.seek(0)  # Reset
    
    if size > MAX_SIZE:
        raise FileSizeError(file.filename, size, MAX_SIZE)
    
    # Check type
    ext = file.filename.split('.')[-1].lower()
    if ext not in ALLOWED_TYPES:
        raise FileTypeError(file.filename, ext, ALLOWED_TYPES)
    
    # Process file
    return {"filename": file.filename, "size": size}
```

```typescript
// Frontend
async function uploadFile(file: File) {
  const formData = new FormData();
  formData.append('file', file);
  
  try {
    const result = await apiFetch('/api/upload', {
      method: 'POST',
      body: formData,
      headers: {}, // Let browser set Content-Type for FormData
    });
    
    toast.success('File uploaded successfully');
  } catch (error) {
    const parsedError = parseError(error);
    
    if (parsedError.code === 'ERR_FILE_TOO_LARGE') {
      const limit = parsedError.context?.limit_bytes / 1024 / 1024;
      toast.error(`File too large. Maximum size: ${limit} MB`);
    } else if (parsedError.code === 'ERR_FILE_TYPE_UNSUPPORTED') {
      const allowed = parsedError.context?.allowed_types?.join(', ');
      toast.error(`File type not supported. Allowed: ${allowed}`);
    } else {
      toast.error(parsedError.message);
    }
  }
}
```

### Example 3: Retry Logic for Network Errors

```typescript
import { withRetry, apiFetch } from '@/lib/errors';

async function fetchEmployees() {
  try {
    // Automatically retry on network errors (up to 3 times)
    const employees = await withRetry(
      () => apiFetch<Employee[]>('/api/employees'),
      3,  // max retries
      1000  // initial delay (ms)
    );
    
    return employees;
  } catch (error) {
    const parsedError = parseError(error);
    
    if (parsedError.isRetryable) {
      toast.error('Could not connect to server. Please try again later.');
    } else {
      toast.error(parsedError.message);
    }
    
    throw error;
  }
}
```

---

## Testing

### Backend Tests

```python
# test_error_handling.py
import pytest
from fastapi.testclient import TestClient
from app.core.exceptions import NotFoundError, ValidationError

def test_not_found_error_response(client: TestClient):
    """Test NotFoundError returns 404 with correct format"""
    response = client.get("/api/employees/99999")
    
    assert response.status_code == 404
    data = response.json()
    
    assert data["success"] is False
    assert "error" in data
    assert data["error"]["code"] == "ERR_RESOURCE_NOT_FOUND"
    assert "request_id" in data["error"]
    assert "timestamp" in data["error"]

def test_validation_error_response(client: TestClient):
    """Test ValidationError returns 400 with field context"""
    response = client.post("/api/employees", json={
        "email": "invalid-email"
    })
    
    assert response.status_code == 400
    data = response.json()
    
    assert data["error"]["code"] == "ERR_VALIDATION_FIELD"
    assert data["error"]["context"]["field"] == "email"

def test_request_id_in_headers(client: TestClient):
    """Test request ID is included in response headers"""
    response = client.get("/api/health")
    
    assert "X-Request-ID" in response.headers
    request_id = response.headers["X-Request-ID"]
    
    # UUID format validation
    import uuid
    assert uuid.UUID(request_id)
```

### Frontend Tests

```typescript
// errors.test.ts
import { parseError, isAPIError, ErrorCode } from '@/lib/errors';

describe('Error Handling', () => {
  it('should parse API error response', () => {
    const apiError = {
      success: false,
      error: {
        code: 'ERR_VALIDATION_FIELD',
        message: 'Invalid email',
        status: 400,
        request_id: '123',
        timestamp: '2025-11-22T10:00:00Z',
      },
    };

    const parsed = parseError(apiError);
    
    expect(parsed.code).toBe('ERR_VALIDATION_FIELD');
    expect(parsed.status).toBe(400);
    expect(parsed.isValidationError).toBe(true);
    expect(parsed.isAuthError).toBe(false);
  });

  it('should identify retryable errors', () => {
    const timeoutError = {
      success: false,
      error: {
        code: ErrorCode.EXTERNAL_SERVICE_TIMEOUT,
        status: 503,
        // ...
      },
    };

    const parsed = parseError(timeoutError);
    expect(parsed.isRetryable).toBe(true);
  });

  it('should handle network errors', () => {
    const networkError = new TypeError('Failed to fetch');
    const parsed = parseError(networkError);
    
    expect(parsed.code).toBe('NETWORK_ERROR');
    expect(parsed.isRetryable).toBe(true);
  });
});
```

---

## Migration Guide

### Migrating from Old Error Handling

#### Step 1: Update Imports

**Old**:
```python
from app.core.app_exceptions import (
    ValidationError,
    ResourceNotFoundError,
    UnauthorizedError,
)
```

**New**:
```python
from app.core.exceptions import (
    ValidationError,
    NotFoundError,  # Previously ResourceNotFoundError
    AuthenticationError,  # Previously UnauthorizedError
)
```

#### Step 2: Update Exception Usage

**Old**:
```python
raise ResourceNotFoundError("Employee", employee_id)
```

**New**:
```python
# Backward compatible (alias exists)
raise ResourceNotFoundError("Employee", employee_id)

# Or use new name
raise NotFoundError("Employee", employee_id)
```

#### Step 3: Remove Manual Error Handling

**Old**:
```python
@handle_errors()  # Decorator
async def my_endpoint():
    try:
        result = do_something()
    except ValidationError as e:
        raise e.to_http()
    return result
```

**New**:
```python
async def my_endpoint():
    # No decorator needed!
    # ErrorHandlerMiddleware handles all exceptions
    result = do_something()
    return result
```

#### Step 4: Update Frontend Error Handling

**Old**:
```typescript
try {
  const response = await fetch('/api/endpoint');
  if (!response.ok) {
    const error = await response.json();
    showError(error.detail);
  }
} catch (error) {
  showError('Network error');
}
```

**New**:
```typescript
import { apiFetch, parseError } from '@/lib/errors';

try {
  const data = await apiFetch('/api/endpoint');
} catch (error) {
  const parsed = parseError(error);
  toast.error(parsed.message);
  
  // Access structured error data
  console.log('Error code:', parsed.code);
  console.log('Request ID:', parsed.requestId);
}
```

---

## Best Practices

### 1. Always Include Context

```python
# Good
raise NotFoundError("Employee", employee_id)

# Better
raise NotFoundError(
    "Employee",
    employee_id,
    context={"department_id": department_id}
)
```

### 2. Use Specific Error Types

```python
# Avoid
raise ApplicationError("Email invalid")

# Prefer
raise ValidationError("Invalid email format", field="email")
```

### 3. Don't Swallow Errors

```python
# Bad
try:
    result = risky_operation()
except Exception:
    return None  # Silent failure!

# Good
try:
    result = risky_operation()
except SpecificError as e:
    logger.error(f"Operation failed: {e}")
    raise DatabaseError("Failed to complete operation")
```

### 4. Log Before Throwing

```python
# Good practice
logger.error(f"Payroll calculation failed for employee {employee_id}")
raise PayrollCalculationError(
    "Insufficient wage data",
    employee_id=employee_id
)
```

### 5. Use Request IDs for Support

```typescript
// Display request ID to users for support
toast.error(
  `An error occurred. Please contact support with reference: ${parsed.requestId}`
);
```

---

## Security Considerations

1. **Context Removal**: Error context is automatically removed in production
2. **No Stack Traces**: Stack traces never sent to client
3. **Generic Messages**: Server errors use generic messages in production
4. **No Sensitive Data**: Never include passwords, tokens, or PII in errors

---

## Performance Impact

- **Minimal**: Middleware adds <1ms per request
- **Request ID Generation**: UUID v4 generation is fast (~0.1ms)
- **Logging**: Async logging doesn't block request
- **JSON Serialization**: Negligible for error responses

---

## Future Enhancements

1. **Error Analytics**: Aggregate error metrics
2. **Client-Side Logging**: Send frontend errors to backend
3. **Error Recovery**: Automatic retry strategies
4. **Error Categorization**: Machine learning for error patterns
5. **Multi-Language**: I18n for error messages

---

## Conclusion

The unified error handling system provides:

✅ **Consistency**: All errors follow same format
✅ **Traceability**: Request IDs for tracking
✅ **Security**: No sensitive data leaks
✅ **Developer Experience**: Rich context for debugging
✅ **User Experience**: Clear, actionable messages

For questions or issues, contact the development team or refer to the codebase documentation.
