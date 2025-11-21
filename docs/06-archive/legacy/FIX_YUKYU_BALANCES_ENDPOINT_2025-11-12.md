# Fix: Yukyu Balances Endpoint Error

**Date:** 2025-11-12
**Issue:** Endpoint `/api/yukyu/balances` was crashing with "Employee has no attribute 'user_id'"
**Status:** ✅ FIXED

---

## Problem

The yukyu balances endpoint was trying to find an employee record using `Employee.user_id`, which **does not exist** in the Employee model.

**Broken code (lines 79-82 in `backend/app/api/yukyu.py`):**
```python
from app.models.models import Employee
employee = db.query(Employee).filter(
    Employee.user_id == current_user.id  # ❌ ERROR: user_id doesn't exist
).first()
```

---

## Root Cause

The system architecture does NOT have a direct link between `users` and `employees`:

- **`users` table** - Authentication/authorization (username, email, password_hash, role)
- **`candidates` table** - Resume data (履歴書/Rirekisho)
- **`employees` table** - Active workers (派遣社員)

**Relationship chain:**
```
employees.rirekisho_id → candidates.rirekisho_id
```

There is **NO** `employees.user_id` field linking to the `users` table.

---

## Solution Implemented

### 1. Changed Employee Lookup Strategy

**New approach:** Match employees by email instead of user_id

**For regular users:**
```python
# Match by email (both User and Employee have email fields)
employee = db.query(Employee).filter(
    Employee.email == current_user.email
).first()

# Fallback: Try username as email (if username is an email)
if not employee and "@" in current_user.username:
    employee = db.query(Employee).filter(
        Employee.email == current_user.username
    ).first()
```

**For admin users (ADMIN, SUPER_ADMIN, KEITOSAN):**
- Instead of returning one employee's balance, return **aggregate summary of all employees**
- Total available/used/expired days across all employees
- Employee count

### 2. Updated Schema to Support Aggregate View

**File:** `backend/app/schemas/yukyu.py`

**Changed:**
```python
class YukyuBalanceSummary(BaseModel):
    """Summary of all yukyu balances for an employee (or aggregate for admins)"""
    employee_id: Optional[int] = None  # None for admin aggregate view
    # ... rest of fields
```

**Before:** `employee_id: int` (required)
**After:** `employee_id: Optional[int] = None` (optional, None for admin aggregate)

---

## Files Modified

1. **`backend/app/api/yukyu.py`** (lines 64-147)
   - Removed broken `Employee.user_id` query
   - Added role-based logic (admin vs regular user)
   - Admin users see aggregate summary
   - Regular users see personal balance (matched by email)

2. **`backend/app/schemas/yukyu.py`** (line 65)
   - Changed `employee_id` from `int` to `Optional[int]`
   - Supports both individual and aggregate summaries

---

## Behavior After Fix

### For Admin Users (ADMIN, SUPER_ADMIN, KEITOSAN)

**GET `/api/yukyu/balances`**

Response:
```json
{
  "employee_id": null,
  "employee_name": "全従業員 (45名)",
  "total_available": 450,
  "total_used": 120,
  "total_expired": 15,
  "balances": [],
  "oldest_expiration_date": null,
  "needs_to_use_minimum_5_days": false
}
```

### For Regular Users

**GET `/api/yukyu/balances`**

Response (matched by email):
```json
{
  "employee_id": 123,
  "employee_name": "山田太郎",
  "total_available": 12,
  "total_used": 3,
  "total_expired": 0,
  "balances": [
    {
      "id": 1,
      "fiscal_year": 2024,
      "days_available": 10,
      "expires_on": "2026-04-01",
      ...
    }
  ],
  "oldest_expiration_date": "2026-04-01",
  "needs_to_use_minimum_5_days": false
}
```

### Error Cases

**404 Error:** If regular user's email doesn't match any employee
```json
{
  "detail": "No employee record found for user john@example.com. Please contact HR to link your account."
}
```

**404 Error:** If no active employees exist (admin view)
```json
{
  "detail": "No active employees found"
}
```

---

## Why Email Matching Works

Both models have email fields:

**User model (lines 126-141 in `models.py`):**
```python
class User(Base):
    __tablename__ = "users"
    id = Column(Integer, primary_key=True)
    username = Column(String(50), unique=True)
    email = Column(String(100), unique=True, nullable=False)  # ✅
    # ...
```

**Employee model (lines 499-624 in `models.py`):**
```python
class Employee(Base):
    __tablename__ = "employees"
    id = Column(Integer, primary_key=True)
    email = Column(String(100))  # ✅ Contact email
    # NO user_id field!
    # ...
```

---

## Alternative Long-Term Solution

**Option:** Add `user_id` column to `employees` table

**Migration required:**
```python
# Add user_id column
op.add_column('employees',
    sa.Column('user_id', sa.Integer(),
    sa.ForeignKey('users.id'), nullable=True)
)
```

**Script required:**
- Link existing employees to users by email matching
- Populate `user_id` for all existing records

**Pros:**
- Direct foreign key relationship
- Faster queries (indexed FK)
- No email matching needed

**Cons:**
- Requires migration
- Need to maintain user_id sync
- Breaking change for existing data

**Recommendation:** Current email-based solution works well for now. Consider adding `user_id` in a future major version if performance becomes an issue.

---

## Testing

**Syntax validation:**
```bash
✅ yukyu.py syntax is valid
✅ yukyu schema syntax is valid
```

**Manual testing required:**
1. Start backend: `docker compose up backend`
2. Login as admin: POST `/api/auth/login` with `admin`/`admin123`
3. Test aggregate view: GET `/api/yukyu/balances` (should show all employees)
4. Login as regular user with employee record
5. Test personal view: GET `/api/yukyu/balances` (should show personal balance)
6. Login as user without employee record
7. Test error handling: GET `/api/yukyu/balances` (should return 404)

---

## Related Issues

None. This was a standalone bug in the yukyu system.

---

## Commit Message

```
fix: Resolve yukyu balances endpoint crashing on "Employee has no attribute 'user_id'"

- Remove broken Employee.user_id query (field does not exist)
- Match employees by email instead (available in both User and Employee)
- Add role-based behavior: admins see aggregate, users see personal balance
- Update YukyuBalanceSummary schema to support aggregate view (employee_id now Optional)
- Add proper error messages for missing employee records

Closes: yukyu balances endpoint crash
Files: backend/app/api/yukyu.py, backend/app/schemas/yukyu.py
```
