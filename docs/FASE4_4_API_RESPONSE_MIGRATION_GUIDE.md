# FASE 4 #4: API Response Migration Guide
## Complete Standardization of API Responses

**Status**: 🚀 In Progress (4 files complete, 19 remaining)
**Scope**: 174 response_model definitions, 73 dict returns across 23 files
**Timeline**: 3-4 hours to complete all migrations

---

## Response Wrapper Functions

All responses should use these standardized wrappers from `app.core.response`:

```python
from app.core.response import (
    success_response,      # General success responses (200, 201, 202, etc.)
    paginated_response,    # List endpoints with pagination
    created_response,      # Creation endpoints (201 Created)
    no_content_response    # Deletion/update with no body (204)
)
```

---

## Migration Patterns

### Pattern 1: Simple Success Response

**Before**:
```python
@router.get("/{user_id}", response_model=UserResponse)
async def get_user(user_id: int, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="Not found")
    return user
```

**After**:
```python
@router.get("/{user_id}")
async def get_user(user_id: int, request: Request, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="Not found")
    return success_response(data=user, request=request)
```

**Key Changes**:
- ✅ Add `request: Request` parameter
- ✅ Remove `response_model` decorator
- ✅ Wrap return value with `success_response(data=..., request=request)`

---

### Pattern 2: Creation Response

**Before**:
```python
@router.post("", response_model=UserResponse, status_code=201)
async def create_user(user_data: UserCreate, db: Session = Depends(get_db)):
    new_user = User(**user_data.model_dump())
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    return new_user
```

**After**:
```python
@router.post("")
async def create_user(user_data: UserCreate, request: Request, db: Session = Depends(get_db)):
    new_user = User(**user_data.model_dump())
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    return created_response(
        data=new_user,
        request=request,
        location=f"/api/users/{new_user.id}"
    )
```

**Key Changes**:
- ✅ Use `created_response()` instead of direct return
- ✅ Add `location` parameter for Location header
- ✅ Remove `status_code=201` from decorator

---

### Pattern 3: Paginated Response

**Before**:
```python
@router.get("", response_model=PaginatedResponse[UserResponse])
async def list_users(
    page: int = Query(1, ge=1),
    per_page: int = Query(20, ge=1, le=100),
    db: Session = Depends(get_db)
):
    total = db.query(User).count()
    users = db.query(User).offset((page-1)*per_page).limit(per_page).all()
    return PaginatedResponse(
        items=users,
        pagination={"page": page, "per_page": per_page, "total": total}
    )
```

**After**:
```python
@router.get("")
async def list_users(
    page: int = Query(1, ge=1),
    per_page: int = Query(20, ge=1, le=100),
    request: Request,
    db: Session = Depends(get_db)
):
    total = db.query(User).count()
    users = db.query(User).offset((page-1)*per_page).limit(per_page).all()
    return paginated_response(
        items=users,
        total=total,
        page=page,
        per_page=per_page,
        request=request
    )
```

**Key Changes**:
- ✅ Use `paginated_response()` function
- ✅ Pass `total`, `page`, `per_page` directly
- ✅ Add `request: Request` parameter

---

### Pattern 4: Deletion Response

**Before**:
```python
@router.delete("/{user_id}")
async def delete_user(user_id: int, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="Not found")
    db.delete(user)
    db.commit()
    return {"message": "User deleted"}
```

**After**:
```python
@router.delete("/{user_id}")
async def delete_user(user_id: int, request: Request, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="Not found")
    db.delete(user)
    db.commit()
    return no_content_response(request=request)
```

**Key Changes**:
- ✅ Use `no_content_response()` function
- ✅ Returns 204 with null body

---

## Standardized Response Formats

### Success Response (200, 201, etc.)
```json
{
  "success": true,
  "data": { /* actual response data */ },
  "metadata": {
    "timestamp": "2025-11-22T10:30:00.000Z",
    "request_id": "550e8400-e29b-41d4-a716-446655440000",
    "version": "1.0"
  }
}
```

### Paginated Response (200)
```json
{
  "success": true,
  "data": {
    "items": [/* array of items */],
    "pagination": {
      "page": 1,
      "per_page": 20,
      "total": 100,
      "total_pages": 5,
      "has_next": true,
      "has_previous": false
    }
  },
  "metadata": {
    "timestamp": "2025-11-22T10:30:00.000Z",
    "request_id": "550e8400-e29b-41d4-a716-446655440000",
    "version": "1.0"
  }
}
```

### Error Response (handled by FASE 4 #2)
```json
{
  "success": false,
  "error": {
    "code": "ERR_RESOURCE_NOT_FOUND",
    "message": "User with ID 123 not found",
    "status": 404,
    "request_id": "550e8400-e29b-41d4-a716-446655440000",
    "timestamp": "2025-11-22T10:30:00.000Z"
  }
}
```

---

## Files to Migrate (Priority Order)

### 🔴 Critical (ASAP)
1. **auth.py** (9 endpoints) - Authentication is foundation
2. **employees.py** (5 endpoints) - Core entity
3. **dashboard.py** (9 endpoints) - UI entry point
4. **candidates.py** (9 endpoints) - Recruitment core

### 🟠 High Priority
5. **payroll.py** (15 endpoints) - Financial operations
6. **salary.py** (10 endpoints) - Related to payroll
7. **factories.py** (9 endpoints) - Manufacturing core
8. **apartments_v2.py** (27 endpoints) - Major entity
9. **ai_agents.py** (43 endpoints) - Advanced feature

### 🟡 Medium Priority
10. **timer_cards.py** (7 endpoints)
11. **role_permissions.py** (7 endpoints)
12. **azure_ocr.py** (2 endpoints)
13. **requests.py** (7 endpoints)
14. **admin.py** (4 endpoints)
15. **timer_cards_rbac_update.py** (4 endpoints)
16. **settings.py** (2 endpoints)
17. **pages.py** (2 endpoints)

### 🔵 Low Priority (Non-critical)
18. **database.py** (6 dict returns)
19. **resilient_import.py** (7 dict returns)
20. **notifications.py** (6 dict returns)
21. **reports.py** (3 dict returns)
22. **monitoring.py** (2 dict returns)
23. **import_export.py** (no returns)

---

## Implementation Steps

### Step 1: Add Import
At the top of each file, add:
```python
from app.core.response import (
    success_response, paginated_response,
    created_response, no_content_response
)
```

### Step 2: Update Function Signatures
Add `request: Request` parameter to all endpoint functions:
```python
from fastapi import Request

@router.get("/{id}")
async def get_item(id: int, request: Request, ...):
    ...
```

### Step 3: Remove response_model
Remove `response_model=SomeSchema` from all `@router` decorators.

### Step 4: Wrap Return Values
Replace plain returns with appropriate wrapper:
- `return data` → `success_response(data=data, request=request)`
- `return {dict}` → `success_response(data={dict}, request=request)`
- `return [list]` → `paginated_response(items=list, total=count, page=page, per_page=per_page, request=request)`

### Step 5: Test
Ensure endpoints still work:
```bash
# Test success response
curl -X GET http://localhost:8000/api/users/1

# Test paginated response
curl -X GET "http://localhost:8000/api/users?page=1&per_page=20"

# Test creation
curl -X POST http://localhost:8000/api/users \
  -H "Content-Type: application/json" \
  -d '{"username":"test"}'
```

---

## Benefits of Standardization

| Aspect | Before | After |
|--------|--------|-------|
| **Response Format** | Inconsistent (varies by endpoint) | ✅ Unified across all endpoints |
| **Error Handling** | Mixed exception types | ✅ Standardized error codes (42 types) |
| **Request Tracking** | No correlation IDs | ✅ Request ID in every response |
| **Pagination** | Inconsistent params | ✅ Consistent pagination metadata |
| **Documentation** | Unclear from code | ✅ Clear patterns for frontend |
| **Client Handling** | Parse multiple formats | ✅ Single parser for all responses |
| **Debugging** | Hard to trace requests | ✅ Easy request tracking via request_id |

---

## Validation Checklist

After migrating each file, verify:

- ✅ All `response_model` decorators removed
- ✅ All endpoints have `request: Request` parameter
- ✅ All returns wrapped with response helper functions
- ✅ Imports include response wrappers
- ✅ Status codes match response type:
  - 200 for `success_response()`
  - 201 for `created_response()`
  - 204 for `no_content_response()`
- ✅ Location headers set for creation endpoints
- ✅ Pagination params correct for paginated endpoints
- ✅ Tests still pass
- ✅ Manual testing works

---

## Rollback Plan

If migration causes issues:
1. Revert file to previous state
2. Check git log for last working version
3. Manual migration with extra testing
4. Run full test suite

```bash
git checkout HEAD~1 -- backend/app/api/auth.py
```

---

## Progress Tracking

```
✅ Completed (4 files):
   - audit.py
   - contracts.py
   - requests.py
   - salary.py

🚀 In Progress:
   - [TODO]

⏳ Pending (19 files):
   - auth.py (9 endpoints)
   - employees.py (5 endpoints)
   - ... (17 more)
```

---

**Last Updated**: 2025-11-22
**Estimated Completion**: 3-4 hours
**Impact**: All 113+ API endpoints standardized

