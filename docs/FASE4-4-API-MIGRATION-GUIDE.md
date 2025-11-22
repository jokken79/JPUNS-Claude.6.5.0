# API Response Standardization Migration Guide - FASE 4 #4

This guide shows how to migrate existing API endpoints to use the new unified response format.

## Table of Contents
1. [Overview](#overview)
2. [Response Format](#response-format)
3. [Migration Patterns](#migration-patterns)
4. [Before/After Examples](#beforeafter-examples)
5. [Common Scenarios](#common-scenarios)
6. [Checklist](#migration-checklist)

---

## Overview

**Goal**: Standardize all API responses to use a consistent envelope format matching the error response structure from FASE 4 #2.

**Benefits**:
- Consistent response structure across all endpoints
- Request tracking with request_id in metadata
- Type-safe responses with generics
- Better client-side error handling
- Improved debugging with timestamps

**Migration Strategy**:
- Update imports
- Wrap responses with helper functions
- Update response_model in route decorators
- Test each endpoint after migration

---

## Response Format

### Success Response (New Format)
```json
{
  "success": true,
  "data": {
    "id": 1,
    "name": "John Doe",
    "email": "john@example.com"
  },
  "metadata": {
    "timestamp": "2025-11-22T10:30:00.000Z",
    "request_id": "550e8400-e29b-41d4-a716-446655440000",
    "version": "1.0"
  }
}
```

### Paginated Response (New Format)
```json
{
  "success": true,
  "data": {
    "items": [
      {"id": 1, "name": "John"},
      {"id": 2, "name": "Jane"}
    ],
    "pagination": {
      "page": 1,
      "per_page": 20,
      "total": 150,
      "total_pages": 8,
      "has_next": true,
      "has_previous": false
    }
  },
  "metadata": {
    "timestamp": "2025-11-22T10:30:00.000Z",
    "request_id": "uuid",
    "version": "1.0"
  }
}
```

### Error Response (Already Standardized - FASE 4 #2)
```json
{
  "success": false,
  "error": {
    "code": "ERR_NOT_FOUND",
    "message": "Employee not found",
    "status": 404,
    "request_id": "uuid",
    "timestamp": "2025-11-22T10:30:00.000Z"
  }
}
```

---

## Migration Patterns

### Pattern 1: Simple GET Endpoint (Single Resource)

**BEFORE**:
```python
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.schemas.employee import EmployeeResponse

router = APIRouter()

@router.get("/{employee_id}", response_model=EmployeeResponse)
async def get_employee(
    employee_id: int,
    db: Session = Depends(get_db)
):
    """Get employee by ID"""
    employee = db.query(Employee).filter(Employee.id == employee_id).first()
    if not employee:
        raise HTTPException(status_code=404, detail="Employee not found")
    
    return employee  # Returns plain object
```

**AFTER**:
```python
from fastapi import APIRouter, Depends, HTTPException, Request
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.core.response import success_response  # NEW IMPORT
from app.schemas.employee import EmployeeResponse
from app.schemas.responses import SuccessResponse  # NEW IMPORT

router = APIRouter()

@router.get("/{employee_id}")  # Response model removed from decorator
async def get_employee(
    employee_id: int,
    request: Request,  # NEW: Add Request parameter
    db: Session = Depends(get_db)
):
    """Get employee by ID"""
    employee = db.query(Employee).filter(Employee.id == employee_id).first()
    if not employee:
        raise HTTPException(status_code=404, detail="Employee not found")
    
    # NEW: Wrap response
    return success_response(
        data=employee,
        request=request
    )
```

**Key Changes**:
1. ✅ Import `Request` from FastAPI
2. ✅ Import `success_response` from `app.core.response`
3. ✅ Add `request: Request` parameter to function
4. ✅ Wrap return value in `success_response(data=..., request=request)`
5. ✅ Remove `response_model` from decorator (optional, can keep for docs)

---

### Pattern 2: POST/PUT Endpoint (Create/Update)

**BEFORE**:
```python
@router.post("/", response_model=EmployeeResponse, status_code=201)
async def create_employee(
    employee: EmployeeCreate,
    db: Session = Depends(get_db)
):
    """Create new employee"""
    new_employee = Employee(**employee.model_dump())
    db.add(new_employee)
    db.commit()
    db.refresh(new_employee)
    
    return new_employee  # Returns plain object
```

**AFTER**:
```python
from app.core.response import created_response  # NEW IMPORT

@router.post("/", status_code=201)  # Keep status_code
async def create_employee(
    employee: EmployeeCreate,
    request: Request,  # NEW: Add Request parameter
    db: Session = Depends(get_db)
):
    """Create new employee"""
    new_employee = Employee(**employee.model_dump())
    db.add(new_employee)
    db.commit()
    db.refresh(new_employee)
    
    # NEW: Wrap response with created_response
    return created_response(
        data=new_employee,
        request=request,
        location=f"/api/employees/{new_employee.id}"  # Optional: Resource URL
    )
```

**Key Changes**:
1. ✅ Import `created_response` from `app.core.response`
2. ✅ Add `request: Request` parameter
3. ✅ Wrap return in `created_response(data=..., request=request, location=...)`
4. ✅ Location header automatically added for created resources

---

### Pattern 3: DELETE Endpoint

**BEFORE**:
```python
@router.delete("/{employee_id}")
async def delete_employee(
    employee_id: int,
    db: Session = Depends(get_db)
):
    """Delete employee"""
    employee = db.query(Employee).filter(Employee.id == employee_id).first()
    if not employee:
        raise HTTPException(status_code=404, detail="Employee not found")
    
    db.delete(employee)
    db.commit()
    
    return {"message": "Employee deleted successfully"}  # Inconsistent format
```

**AFTER**:
```python
from app.core.response import no_content_response  # NEW IMPORT

@router.delete("/{employee_id}", status_code=204)  # Add status code
async def delete_employee(
    employee_id: int,
    request: Request,  # NEW: Add Request parameter
    db: Session = Depends(get_db)
):
    """Delete employee"""
    employee = db.query(Employee).filter(Employee.id == employee_id).first()
    if not employee:
        raise HTTPException(status_code=404, detail="Employee not found")
    
    db.delete(employee)
    db.commit()
    
    # NEW: Return standardized no content response
    return no_content_response(request=request)
```

**Key Changes**:
1. ✅ Import `no_content_response`
2. ✅ Add `request: Request` parameter
3. ✅ Return `no_content_response(request=request)` for 204 responses
4. ✅ Add `status_code=204` to decorator

---

### Pattern 4: List Endpoint with Pagination

**BEFORE**:
```python
def _paginate_response(items, total, page, page_size):
    """Custom pagination helper"""
    total_pages = (total + page_size - 1) // page_size
    return {
        "items": items,
        "total": total,
        "page": page,
        "page_size": page_size,
        "total_pages": total_pages,
        "has_next": page < total_pages,
        "has_previous": page > 1
    }

@router.get("/")
async def list_employees(
    page: int = 1,
    page_size: int = 20,
    search: Optional[str] = None,
    db: Session = Depends(get_db)
):
    """List all employees"""
    query = db.query(Employee)
    
    if search:
        query = query.filter(Employee.name.ilike(f"%{search}%"))
    
    total = query.count()
    employees = query.offset((page - 1) * page_size).limit(page_size).all()
    
    # OLD: Custom pagination format
    return _paginate_response(employees, total, page, page_size)
```

**AFTER**:
```python
from app.core.response import paginated_response  # NEW IMPORT

# DELETE: Remove _paginate_response helper (no longer needed)

@router.get("/")
async def list_employees(
    request: Request,  # NEW: Add Request parameter
    page: int = 1,
    page_size: int = 20,
    search: Optional[str] = None,
    db: Session = Depends(get_db)
):
    """List all employees"""
    query = db.query(Employee)
    
    if search:
        query = query.filter(Employee.name.ilike(f"%{search}%"))
    
    total = query.count()
    employees = query.offset((page - 1) * page_size).limit(page_size).all()
    
    # NEW: Standardized pagination response
    return paginated_response(
        items=employees,
        total=total,
        page=page,
        per_page=page_size,
        request=request
    )
```

**Key Changes**:
1. ✅ Import `paginated_response`
2. ✅ Add `request: Request` parameter
3. ✅ Replace custom pagination helper with `paginated_response()`
4. ✅ Remove `_paginate_response` helper function
5. ✅ Pagination metadata auto-calculated (total_pages, has_next, has_previous)

---

## Common Scenarios

### Scenario 1: Returning a Dictionary (Non-Model Response)

**BEFORE**:
```python
@router.get("/stats")
async def get_stats(db: Session = Depends(get_db)):
    stats = {
        "total_employees": db.query(Employee).count(),
        "active_employees": db.query(Employee).filter(Employee.is_active == True).count(),
        "by_factory": {...}
    }
    return stats
```

**AFTER**:
```python
@router.get("/stats")
async def get_stats(
    request: Request,
    db: Session = Depends(get_db)
):
    stats = {
        "total_employees": db.query(Employee).count(),
        "active_employees": db.query(Employee).filter(Employee.is_active == True).count(),
        "by_factory": {...}
    }
    return success_response(data=stats, request=request)
```

---

### Scenario 2: Empty Results (No Items Found)

**BEFORE**:
```python
@router.get("/search")
async def search_employees(query: str, db: Session = Depends(get_db)):
    results = db.query(Employee).filter(Employee.name.ilike(f"%{query}%")).all()
    if not results:
        return {"items": [], "message": "No results found"}
    return {"items": results}
```

**AFTER**:
```python
from app.core.response import empty_paginated_response

@router.get("/search")
async def search_employees(
    query: str,
    request: Request,
    page: int = 1,
    page_size: int = 20,
    db: Session = Depends(get_db)
):
    results = db.query(Employee).filter(Employee.name.ilike(f"%{query}%")).all()
    total = len(results)
    
    if not results:
        # NEW: Standardized empty response
        return empty_paginated_response(
            page=page,
            per_page=page_size,
            request=request
        )
    
    return paginated_response(
        items=results,
        total=total,
        page=page,
        per_page=page_size,
        request=request
    )
```

---

### Scenario 3: Bulk Operations

**BEFORE**:
```python
@router.post("/bulk-update")
async def bulk_update_employees(
    updates: List[EmployeeUpdate],
    db: Session = Depends(get_db)
):
    updated = []
    for update in updates:
        employee = db.query(Employee).filter(Employee.id == update.id).first()
        if employee:
            # Update employee...
            updated.append(employee)
    db.commit()
    return {"updated_count": len(updated), "items": updated}
```

**AFTER**:
```python
@router.post("/bulk-update")
async def bulk_update_employees(
    updates: List[EmployeeUpdate],
    request: Request,
    db: Session = Depends(get_db)
):
    updated = []
    for update in updates:
        employee = db.query(Employee).filter(Employee.id == update.id).first()
        if employee:
            # Update employee...
            updated.append(employee)
    db.commit()
    
    # NEW: Wrap result
    return success_response(
        data={
            "updated_count": len(updated),
            "items": updated
        },
        request=request
    )
```

---

## Migration Checklist

### For Each Endpoint:

- [ ] **Import new response helpers**
  ```python
  from fastapi import Request
  from app.core.response import success_response, paginated_response, created_response, no_content_response
  ```

- [ ] **Add Request parameter**
  ```python
  async def endpoint_name(request: Request, ...):
  ```

- [ ] **Wrap return value**
  - Simple response: `success_response(data=..., request=request)`
  - Created (201): `created_response(data=..., request=request, location=...)`
  - No content (204): `no_content_response(request=request)`
  - Paginated list: `paginated_response(items=..., total=..., page=..., per_page=..., request=request)`

- [ ] **Remove custom pagination helpers**
  - Delete `_paginate_response()` functions
  - Use `paginated_response()` instead

- [ ] **Update response_model in decorators (optional)**
  - Can remove `response_model` or keep for OpenAPI docs
  - Response envelope is automatically added

- [ ] **Test the endpoint**
  - Verify response format matches spec
  - Check request_id in metadata
  - Verify pagination works correctly
  - Test error responses still work

---

## File-by-File Migration Plan

### Recommended Migration Order:

**Phase 1: Simple CRUD (Day 1)**
1. `/backend/app/api/employees.py` - Core employee CRUD
2. `/backend/app/api/candidates.py` - Candidate management
3. `/backend/app/api/contracts.py` - Contract CRUD

**Phase 2: Lists & Reports (Day 2)**
4. `/backend/app/api/dashboard.py` - Dashboard stats
5. `/backend/app/api/reports.py` - Reporting endpoints
6. `/backend/app/api/audit.py` - Audit logs (already paginated)

**Phase 3: Complex Business Logic (Day 3)**
7. `/backend/app/api/payroll.py` - Payroll processing
8. `/backend/app/api/salary.py` - Salary calculations
9. `/backend/app/api/factories.py` - Factory management

**Phase 4: Remaining Endpoints (Day 4)**
10-28. All other API files

### Tips for Efficient Migration:

1. **Use Find & Replace**:
   - Find: `return employee`
   - Replace: `return success_response(data=employee, request=request)`

2. **Test in Batches**:
   - Migrate 3-5 endpoints
   - Run tests
   - Fix issues
   - Move to next batch

3. **Keep Error Handling Unchanged**:
   - `raise HTTPException(...)` works as before
   - Error middleware handles conversion automatically

4. **Pagination Pattern**:
   - Replace all `_paginate_response()` calls with `paginated_response()`
   - Update parameter names: `page_size` → `per_page`

---

## Testing After Migration

### Manual Testing:

1. **Test via Swagger UI** (`http://localhost:8000/docs`)
   - Verify response structure matches spec
   - Check metadata contains request_id and timestamp
   - Verify pagination metadata for list endpoints

2. **Test Error Responses**:
   - Trigger 404 (not found)
   - Trigger 400 (validation error)
   - Verify error format matches FASE 4 #2 spec

3. **Check Request Tracking**:
   - Make request
   - Note request_id in response
   - Find same request_id in logs
   - Verify traceability

### Automated Testing:

```python
# Example test
def test_get_employee_response_format(client, db_session):
    # Create test employee
    employee = create_test_employee(db_session)
    
    # Make request
    response = client.get(f"/api/employees/{employee.id}")
    
    # Verify response format
    assert response.status_code == 200
    data = response.json()
    
    # Check envelope structure
    assert "success" in data
    assert data["success"] is True
    assert "data" in data
    assert "metadata" in data
    
    # Check metadata
    assert "timestamp" in data["metadata"]
    assert "request_id" in data["metadata"]
    assert "version" in data["metadata"]
    
    # Check data
    assert data["data"]["id"] == employee.id
    assert data["data"]["name"] == employee.name
```

---

## Summary

**Quick Migration Steps**:
1. Import `Request` and response helpers
2. Add `request: Request` parameter
3. Wrap return values with appropriate helper
4. Remove custom pagination helpers
5. Test endpoint

**Response Helpers Available**:
- `success_response()` - Standard 200 OK
- `created_response()` - 201 Created with Location header
- `no_content_response()` - 204 No Content
- `paginated_response()` - Paginated lists
- `empty_paginated_response()` - Empty results

**Benefits After Migration**:
- ✅ Consistent API responses
- ✅ Request tracking with request_id
- ✅ Better debugging with timestamps
- ✅ Type-safe client integration
- ✅ Improved error handling
- ✅ OpenAPI documentation auto-generated

---

**Questions or Issues?**
- Check `/backend/app/core/response.py` for helper function signatures
- Check `/backend/app/schemas/responses.py` for response model definitions
- Review FASE 4 #2 documentation for error handling integration

**Estimated Time**: 4-6 hours for all 28 endpoints (15-20 minutes per file)

