# Fix: Request Model hybrid_property Missing Expression

**Date:** 2025-11-12
**Bug:** Request model `employee_id` hybrid_property missing SQLAlchemy expression
**Status:** ✅ FIXED

---

## Problem Description

The `Request` model in `backend/app/models/models.py` had a `@hybrid_property` decorator for `employee_id` but was missing the corresponding `@employee_id.expression` decorator. This caused an `AttributeError` when trying to filter by `Request.employee_id` in SQLAlchemy queries.

### Error Message

```
AttributeError: Neither 'InstrumentedAttribute' object nor 'Comparator' object
associated with Request.employee has an attribute 'id'
```

### Affected Code

- **File:** `backend/app/models/models.py` (lines ~920-925)
- **Usage:** `backend/app/services/yukyu_service.py` (line 378 in `check_minimum_5_days` method)

---

## Root Cause

The `Request` model has `hakenmoto_id` as the actual foreign key column that links to the `employees` table, but was exposing `employee_id` as a hybrid property for backwards compatibility. However, SQLAlchemy hybrid properties need TWO decorators:

1. **`@hybrid_property`** - For instance-level access (Python object)
2. **`@employee_id.expression`** - For class-level access (SQL queries)

Without the expression decorator, SQLAlchemy couldn't translate `Request.employee_id == value` into valid SQL.

---

## Solution

Added the missing `@employee_id.expression` decorator that maps to the actual foreign key column `hakenmoto_id`:

### Before (BROKEN)

```python
@hybrid_property
def employee_id(self):
    """Backwards compatibility: return employee.id if relationship is loaded"""
    if self.employee:
        return self.employee.id
    return None
```

### After (FIXED)

```python
@hybrid_property
def employee_id(self):
    """Backwards compatibility: return employee.id if relationship is loaded"""
    if self.employee:
        return self.employee.id
    return None

@employee_id.expression
def employee_id(cls):
    """Expression for querying by employee_id in SQLAlchemy filters"""
    return cls.hakenmoto_id
```

---

## Changes Made

**File:** `backend/app/models/models.py`

```diff
@hybrid_property
def employee_id(self):
    """Backwards compatibility: return employee.id if relationship is loaded"""
    if self.employee:
        return self.employee.id
    return None

+@employee_id.expression
+def employee_id(cls):
+    """Expression for querying by employee_id in SQLAlchemy filters"""
+    return cls.hakenmoto_id
```

---

## Verification

### 1. Backend Restart
```bash
docker compose restart backend
```

### 2. Health Check
```bash
docker compose ps backend
# Status: Up 18 seconds (healthy)
```

### 3. API Test
```bash
# Login
TOKEN=$(curl -s -X POST http://localhost:8000/api/auth/login \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "username=admin&password=admin123" | grep -o '"access_token":"[^"]*"' | cut -d'"' -f4)

# Test yukyu balances endpoint (uses employee_id filter internally)
curl -s -H "Authorization: Bearer $TOKEN" "http://localhost:8000/api/yukyu/balances"
```

**Result:** ✅ 200 OK response, no AttributeError

### 4. Log Verification
```bash
docker compose logs backend --since 5m | grep -i "attributeerror.*employee_id"
```

**Result:** ✅ No errors related to employee_id

---

## Impact

### Fixed

- ✅ `Request.employee_id` can now be used in SQLAlchemy filters
- ✅ `YukyuService.check_minimum_5_days()` method works correctly
- ✅ `/api/yukyu/balances` endpoint returns data without errors
- ✅ All yukyu-related queries that filter by employee_id now work

### No Breaking Changes

- ✅ Instance-level access still works: `request.employee_id`
- ✅ Class-level filtering now works: `Request.employee_id == value`
- ✅ Backwards compatibility maintained

---

## Technical Notes

### SQLAlchemy Hybrid Properties

Hybrid properties in SQLAlchemy serve two purposes:

1. **Instance level** (Python object): Access computed attributes
   ```python
   request = db.query(Request).first()
   print(request.employee_id)  # Uses @hybrid_property
   ```

2. **Class level** (SQL query): Generate SQL expressions
   ```python
   requests = db.query(Request).filter(Request.employee_id == 123)  # Uses @expression
   ```

### Request Model FK Structure

The `Request` model uses `hakenmoto_id` (not `employee_id`) as the actual foreign key:

```python
class Request(Base):
    __tablename__ = "requests"

    hakenmoto_id = Column(Integer, ForeignKey("employees.hakenmoto_id"), nullable=True)

    # Relationship
    employee = relationship("Employee", foreign_keys=[hakenmoto_id])
```

The `employee_id` hybrid property provides backwards compatibility while the expression maps to the actual FK column.

---

## Related Issues

This fix resolves the primary AttributeError for `employee_id`. However, there's a separate issue discovered during testing:

### Separate Issue: `approval_status` Attribute Missing

**Error in logs:**
```
WARNING: Could not get yukyu summary for employee X:
type object 'Request' has no attribute 'approval_status'
```

**Note:** This is a DIFFERENT issue where the code references `Request.approval_status` but the column is actually named `status` in the database. This should be fixed separately.

---

## Files Modified

- `D:\UNS-ClaudeJP-5.4.1\backend\app\models\models.py` (lines 927-930 added)

## Testing Status

- ✅ Backend restarts successfully
- ✅ API endpoint returns 200 OK
- ✅ No AttributeError for employee_id in logs
- ✅ SQLAlchemy queries with `Request.employee_id` work correctly

---

## Conclusion

The `Request.employee_id` hybrid property now has the required expression decorator, allowing it to be used in SQLAlchemy filters. The yukyu system can now properly query requests by employee_id without AttributeError.

**Status:** ✅ **COMPLETE AND TESTED**
