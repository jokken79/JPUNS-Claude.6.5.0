# FASE 5: Edge Cases & Error Handling Guide
**Version**: 1.0
**Date**: 2025-11-22
**Status**: Edge Case Test Suite Complete & Documented

---

## 📋 Overview

This document describes all edge cases tested in FASE 5 yukyu dashboard and the error handling strategies implemented.

**Test File**: `backend/tests/test_yukyu_edge_cases.py`
**Test Classes**: 9 comprehensive test classes
**Test Cases**: 25+ individual test cases

---

## 🎯 Edge Cases Covered

### 1. FISCAL YEAR BOUNDARIES (3 test cases)

Japanese fiscal year: **April 1 - March 31**

#### 1.1 March 31 → April 1 Transition
```
Test: test_fiscal_year_march_31_to_april_1_transition

Scenario:
├─ March 31, 2025 → FY 2024
├─ April 1, 2025 → FY 2025
└─ Calculation: fiscal_year = date.year if date.month >= 4 else date.year - 1

Why it matters:
└─ Legal requirement: Compliance checked within fiscal year
   └─ Employee hired April 1 gets 5 days for FY 2024-2025
   └─ But only 4.75 days if hired April 1 for FY 2024-2025 remainder

Expected behavior:
├─ System correctly identifies fiscal year
├─ Compliance checks use correct fiscal year
├─ No requests miscounted across year boundary
```

#### 1.2 All Months Classified Correctly
```
Test: test_fiscal_year_boundaries_all_months

Coverage:
├─ January → FY 2024
├─ March 31 → FY 2024
├─ April 1 → FY 2025
└─ December → FY 2025

Verification:
└─ All 12 months properly classified
```

#### 1.3 Requests Spanning Fiscal Year Boundary
```
Test: test_yukyu_request_spanning_fiscal_year_boundary

Scenario:
Request from March 31 to April 2 (2.5 days)
├─ 0.5 days in FY 2024
├─ 2.0 days in FY 2025
└─ In compliance check: Count toward FY 2025

Why handled:
└─ Most days in new fiscal year → count there
└─ Prevents double-counting across years
```

---

### 2. FRACTIONAL DAYS (5 test cases)

Japanese labor law allows requests in 0.5 day increments.

#### 2.1 Half-Day Request (0.5 days)
```
Test: test_half_day_request

Scenario:
Employee requests 0.5 day off
├─ Date: May 1, 2024
├─ Days: 0.5
└─ Reason: Half-day request

Implementation:
├─ start_date = end_date (same day)
├─ days_requested = 0.5
└─ Deduction: 0.5 × 8 hours × ¥1,200/hour = ¥4,800

Validation:
└─ System accepts 0.5 day increments
```

#### 2.2 Fractional Day Calculation
```
Test: test_fractional_day_calculation

Calculation Formula:
deduction = days × hours_per_day × hourly_rate
         = days × 8 × 1,200

Examples:
├─ 1.5 days = 1.5 × 8 × 1,200 = ¥14,400
├─ 2.5 days = 2.5 × 8 × 1,200 = ¥24,000
└─ 0.5 days = 0.5 × 8 × 1,200 = ¥4,800

Precision:
└─ Use Decimal for financial calculations
   └─ Avoid floating-point rounding errors
```

#### 2.3 Fractional Days Accumulation
```
Test: test_fractional_days_accumulation

Scenario: Employee makes multiple requests
├─ April 1: 0.5 days
├─ April 2: 0.5 days
├─ April 3: 1.0 days
└─ April 4: 1.5 days
   └─ Total: 3.5 days

Validation:
├─ Each request stored with correct fraction
├─ Sum correctly: 0.5 + 0.5 + 1.0 + 1.5 = 3.5
└─ Compliance shows: used 3.5, remaining 1.5
```

#### 2.4 Very Small Fractional Days (0.25)
```
Test: test_very_small_fractional_days

Scenario:
Employee requests 0.25 day (quarter day)
├─ Duration: 2 hours
├─ Rate: ¥1,200/hour
└─ Deduction: ¥2,400

Handling:
└─ System supports increments as small as 0.25
   └─ Some systems require 0.5 minimum
   └─ This implementation allows 0.25+
```

#### 2.5 Complex Fractional Accumulation
```
Scenario: Multiple employees with various fractions

Employee A:
├─ 0.5 + 0.5 + 1.0 = 2.0 days

Employee B:
├─ 0.25 + 0.75 + 1.5 = 2.5 days

Employee C:
├─ 3.0 + 1.5 + 0.5 = 5.0 days (exactly minimum)

Compliance:
├─ Employee A: Compliant (used 2, remaining 3, total 5)
├─ Employee B: Compliant (used 2.5, remaining 2.5, total 5)
└─ Employee C: Compliant (used 5, remaining 0, total 5)
```

---

### 3. NEGATIVE & ZERO BALANCE (3 test cases)

#### 3.1 Employee with Zero Balance
```
Test: test_employee_with_zero_balance

Scenario:
New employee with no yukyu requests yet
├─ Used: 0 days
├─ Remaining: 5.0 days
├─ Total: 5.0 days
└─ Compliant: ✅ YES

Dashboard shows:
├─ Pérdida Estimada: ¥0 (no deductions)
├─ Compliance: ✅ GREEN (5.0 ≥ 5.0)
└─ Deducción: ¥0
```

#### 3.2 Employee Over-Allocation
```
Test: test_employee_over_allocation

Scenario: Employee uses MORE than allocated (shouldn't happen normally)
Requests:
├─ Request 1: 3.0 days ✅
├─ Request 2: 2.0 days ✅
└─ Request 3: 1.5 days ✅
   └─ Total: 6.5 days (exceeds 5.0)

Compliance Status:
├─ Used: 6.5 days
├─ Remaining: -1.5 days (negative!)
├─ Total: 6.5 days
└─ Compliant: ❌ NO (used 6.5 > 5.0)

Visual: 🔴 RED status

Why it happens:
└─ Management error: Approving more than limit
└─ System should prevent but tracks if it occurs

Remediation:
├─ Identify in Compliance Status tab (🔴 red)
├─ Contact KEITOSAN to review
├─ Potentially void excessive request or
└─ Defer usage to next fiscal year
```

#### 3.3 Minimum Balance Exactly 5.0
```
Test: test_minimum_balance_exactly_5_days

Scenario:
Employee with exactly 5.0 days (legal minimum)
├─ Used: 0 days
├─ Remaining: 5.0 days
├─ Total: 5.0 days
└─ Compliant: ✅ YES (borderline)

Visual: 🟡 YELLOW status (warning - at minimum)

Why important:
└─ Law requires MINIMUM 5.0 days
└─ 5.0 exactly meets requirement
└─ 4.9 violates requirement
└─ System alerts if approaching: 🟡 YELLOW for 4.5-4.99

Threshold Logic:
├─ >= 5.0: ✅ GREEN (compliant)
├─ 4.5 - 4.99: 🟡 YELLOW (warning)
└─ < 4.5: 🔴 RED (non-compliant)
```

---

### 4. CONCURRENT OPERATIONS (2 test cases)

#### 4.1 Concurrent Approval of Same Request
```
Test: test_concurrent_approval_same_request

Scenario:
Two managers try to approve SAME request simultaneously
├─ Manager 1: clicks "Aprobar" at 10:00:00
├─ Manager 2: clicks "Aprobar" at 10:00:00.005 (5ms later)
└─ Request ID: 12345

What happens:
├─ Manager 1: UPDATE requests SET status='APPROVED' WHERE id=12345
├─ Manager 2: UPDATE requests SET status='APPROVED' WHERE id=12345
└─ Result: One approval recorded (idempotent operation)

Database handling:
├─ SQL locks prevent double-processing
├─ First transaction commits successfully
├─ Second sees status already APPROVED
└─ No error thrown (idempotent)

Implementation:
```python
# Database-level check
if request.status == RequestStatus.PENDING:
    request.status = RequestStatus.APPROVED
    request.approved_by_id = current_user.id
    request.approved_at = datetime.utcnow()
    db.commit()
else:
    # Already processed, silently succeed
    return {"message": "Already approved"}
```

Why important:
└─ Users may retry on network timeout
└─ Second request should not double-process
```

#### 4.2 Approval/Rejection Conflict
```
Test: test_concurrent_rejection_conflict

Scenario:
Manager 1 approves request while Manager 2 rejects same request
├─ Time 1: Manager 1 changes to APPROVED
├─ Time 2: Manager 2 changes to REJECTED (conflicts!)
└─ Conflict: Last write wins (race condition)

Implementation Strategy 1: Pessimistic Locking
```python
request = db.query(YukyuRequest).with_for_update().filter(...).first()
# Locks row until transaction completes
request.status = RequestStatus.APPROVED
db.commit()  # Other managers wait here
```

Implementation Strategy 2: Optimistic Locking (preferred)
```python
# Add version field to request
request = db.query(YukyuRequest).filter(
    YukyuRequest.id == request_id,
    YukyuRequest.version == expected_version  # Prevent conflicts
).first()

if not request:
    raise ConflictError("Request was modified by another user")

request.status = RequestStatus.APPROVED
request.version += 1
db.commit()
```

Resolution:
├─ Show error: "Request was modified by another manager"
├─ Refresh UI to show current status
├─ User decides to retry or accept other decision
└─ Audit log shows both attempts
```

---

### 5. DATABASE CONSTRAINTS (4 test cases)

#### 5.1 Invalid Date Range (end before start)
```
Test: test_invalid_date_range

Scenario:
Request with end_date < start_date
├─ start_date: May 5, 2024
├─ end_date: May 1, 2024
└─ Invalid: End before start

Validation:
```python
if request.end_date < request.start_date:
    raise ValueError("End date must be on or after start date")
```

Database Constraint:
```sql
CHECK (end_date >= start_date)
```

Error Response:
```json
{
  "error": "Invalid date range",
  "details": "End date (2024-05-01) must be on or after start date (2024-05-05)",
  "status": 400
}
```
```

#### 5.2 Negative Days Requested
```
Test: test_negative_days_requested

Scenario:
Request with negative days
└─ days_requested: -1.0

Validation:
```python
if request.days_requested <= 0:
    raise ValueError("Days requested must be greater than zero")
```

Why rejected:
├─ Semantically invalid (negative vacation?)
├─ Would add days back to employee
├─ Separate endpoint needed for "corrections"
└─ Prevents accidental negative deductions

Error Response:
```json
{
  "error": "Invalid days requested",
  "details": "Days must be positive (got -1.0)",
  "status": 400
}
```
```

#### 5.3 Zero Days Requested
```
Test: test_zero_days_requested

Scenario:
Request with 0.0 days
└─ days_requested: 0.0

Validation:
```python
if request.days_requested == 0:
    raise ValueError("Must request at least 0.25 days")
```

Why rejected:
├─ No purpose (zero deduction)
├─ Creates orphaned request record
├─ Wastes database space
└─ Unnecessary audit log entry

Minimum accepted:
└─ 0.25 days (2 hours)
```

#### 5.4 Excessive Days Requested
```
Test: test_excessive_days_requested

Scenario:
Request for more days than exist in fiscal year
├─ Fiscal year: 365 days (or 366 in leap year)
├─ Request: 400 days
└─ Impossible to fulfill

Validation:
```python
fiscal_year_days = 365  # or 366
if request.days_requested > fiscal_year_days:
    raise ValueError(
        f"Cannot request more than {fiscal_year_days} days in fiscal year"
    )
```

Also check allocation:
```python
if request.days_requested > 5.0:
    raise ValueError("Cannot request more than 5 days allocated per year")
```

Error Response:
```json
{
  "error": "Excessive days requested",
  "details": "Maximum 5.0 days allowed per fiscal year (requested 366.0)",
  "status": 400
}
```
```

---

### 6. SPECIAL EMPLOYEE STATUSES (3 test cases)

#### 6.1 Recently Hired Employee (Proportional Entitlement)
```
Test: test_recently_hired_employee_yukyu_entitlement

Scenario:
Employee hired October 15, 2024
└─ FY 2024-2025 (April 1, 2024 - March 31, 2025)

Entitlement Calculation:
├─ Hire date: Oct 15, 2024
├─ FY end: Mar 31, 2025
├─ Days employed in FY: (Mar 31 - Oct 15) = 168 days
├─ Entitlement: 5.0 × (168/365) = 2.3 days (rounded to 2.5)
└─ Minimum: 2.5 days (rounded up per Japanese law)

Implementation:
```python
def calculate_yukyu_entitlement(hire_date: date) -> float:
    # Current fiscal year
    if hire_date.month >= 4:
        fy_start = date(hire_date.year, 4, 1)
        fy_end = date(hire_date.year + 1, 3, 31)
    else:
        fy_start = date(hire_date.year - 1, 4, 1)
        fy_end = date(hire_date.year, 3, 31)

    # Calculate proportion
    days_in_fy = (fy_end - fy_start).days + 1
    days_employed = (fy_end - hire_date).days + 1

    if days_employed <= 0:
        return 0

    proportion = days_employed / days_in_fy
    entitlement = 5.0 * proportion

    # Round up to nearest 0.5
    return math.ceil(entitlement * 2) / 2
```

Examples:
├─ Hired Jan 1: 5.0 days (full year)
├─ Hired Apr 1: 5.0 days (first day of FY)
├─ Hired Oct 15: 2.5 days (168/365 ≈ 0.46 → rounds up to 2.5)
└─ Hired Mar 1: 0.5 days (30 days left)
```

#### 6.2 Employee on Leave of Absence
```
Test: test_employee_on_leave_status

Scenario:
Employee on unpaid leave (status = "on_leave")
├─ Leave dates: Jan 15 - Mar 15, 2025
├─ Should employee accrue yukyu during leave?
└─ Japanese law: No yukyu accrual during leave

Implementation:
```python
if employee.status == "on_leave":
    # Don't process new requests
    raise ValueError("Cannot request yukyu during leave of absence")

    # Don't include in compliance check
    # (Separate tracking for leave period)
```

Compliance:
├─ System excludes from compliance calculations
├─ Dashboard shows "on leave" note
└─ Resume normal tracking upon return
```

#### 6.3 Retired Employee Cleanup
```
Test: test_retired_employee_cleanup

Scenario:
Employee retiring March 31, 2025 (end of fiscal year)
├─ Status changes to "retired"
├─ Should system allow final yukyu requests?
└─ Japanese law: Yes, must allow through last day

Implementation:
```python
if employee.status == "retired":
    # Allow requests through last working day
    if date.today() > employee.last_day:
        raise ValueError(
            f"Cannot request yukyu after retirement date {employee.last_day}"
        )

    # Allow requests (they may have remaining days)
    # But prevent new accruals
```

Process:
├─ Employee can request remaining days before retirement
├─ Any unused days are forfeited (not paid out in Japan)
├─ Final compliance check shows actual usage
└─ Archive employee data after completion
```

---

### 7. CALCULATION PRECISION (3 test cases)

#### 7.1 Deduction Calculation Precision
```
Test: test_deduction_calculation_precision

Scenario:
Calculate deduction for 2.5 days at ¥1,200/hour

Using Decimal (recommended):
```python
from decimal import Decimal

days = Decimal('2.5')
hours_per_day = Decimal('8')
hourly_rate = Decimal('1200')

deduction = days * hours_per_day * hourly_rate
# Result: Decimal('24000')
```

Using Float (NOT recommended):
```python
deduction = 2.5 * 8 * 1200
# Result: 24000.0
# Risk: Floating point rounding errors in complex calculations
```

Why Decimal?
├─ Exact precision for financial amounts
├─ No rounding errors from binary representation
├─ Standard for accounting applications
└─ Required for compliance audit trails

Example precision issue:
```python
# Float arithmetic
result = 0.1 + 0.2
print(result)  # 0.30000000000000004 (not 0.3!)

# Decimal arithmetic
result = Decimal('0.1') + Decimal('0.2')
print(result)  # 0.3 (correct)
```
```

#### 7.2 Fractional Deduction Rounding
```
Test: test_fractional_deduction_rounding

Scenario:
Calculate deduction for 1.333 days
└─ 1.333 × 8 × 1,200 = ¥12,796.8

Rounding Strategy:
```python
from decimal import Decimal, ROUND_HALF_UP

deduction = Decimal('12796.8')

# Round to nearest yen (ROUND_HALF_UP)
deduction_rounded = deduction.quantize(
    Decimal('1'),
    rounding=ROUND_HALF_UP
)
# Result: Decimal('12797')
```

Standard: ROUND_HALF_UP
├─ 12796.4 → 12796 (rounds down)
├─ 12796.5 → 12797 (rounds up)
└─ 12796.9 → 12797 (rounds up)

Why standardize:
└─ Ensures consistent rounding across all calculations
└─ Meets Japanese accounting standards
└─ Prevents disputes over rounding differences
```

#### 7.3 Compliance Percentage Precision
```
Test: test_compliance_percentage_precision

Scenario:
45 out of 50 employees comply
└─ Percentage: 45 / 50 = 0.9 = 90.0%

Calculation:
```python
compliant = 45
total = 50
percentage = (compliant / total) * 100
# Result: 90.0
```

Dashboard shows: 90% (rounded to whole number)

Precision handling:
├─ Store as: 90.0 (one decimal place)
├─ Display as: "90%" (rounded)
├─ Use for calculations: 90.0 (full precision)
└─ Export as: 0.90 (decimal form)
```

---

## 🛡️ Error Handling Strategy

### Error Classification

```
1. VALIDATION ERRORS (4xx)
   └─ Input validation failures
   └─ Return: 400 Bad Request with details
   └─ User can correct and retry

2. CONSTRAINT VIOLATIONS (4xx)
   └─ Business logic violations
   └─ Return: 422 Unprocessable Entity
   └─ User must take different action

3. AUTHORIZATION ERRORS (4xx)
   └─ User doesn't have permission
   └─ Return: 403 Forbidden
   └─ Different user role needed

4. NOT FOUND ERRORS (4xx)
   └─ Resource doesn't exist
   └─ Return: 404 Not Found
   └─ Check resource ID

5. CONFLICT ERRORS (4xx)
   └─ Race condition or conflict
   └─ Return: 409 Conflict
   └─ Refresh and retry

6. SERVER ERRORS (5xx)
   └─ Unexpected system error
   └─ Return: 500 Internal Server Error
   └─ Contact support
```

### Standard Error Response Format

```json
{
  "status": "error",
  "error": "Error Title",
  "message": "Human-readable error message",
  "details": "Technical details for debugging",
  "timestamp": "2025-11-22T10:30:00Z",
  "request_id": "req-12345-67890",
  "code": "ERROR_CODE"
}
```

Example:
```json
{
  "status": "error",
  "error": "Invalid Date Range",
  "message": "End date must be on or after start date",
  "details": "start_date=2024-05-05, end_date=2024-05-01",
  "timestamp": "2025-11-22T10:30:00Z",
  "request_id": "req-abc-123",
  "code": "INVALID_DATE_RANGE"
}
```

---

## 📊 Test Coverage Summary

| Category | Test Class | Tests | Status |
|----------|-----------|-------|--------|
| Fiscal Year | TestFiscalYearBoundary | 3 | ✅ |
| Fractional Days | TestFractionalDays | 5 | ✅ |
| Negative Balance | TestNegativeBalance | 3 | ✅ |
| Concurrent Ops | TestConcurrentApprovals | 2 | ✅ |
| Constraints | TestDatabaseConstraints | 4 | ✅ |
| Errors | TestErrorMessages | 3 | ✅ |
| Special Status | TestSpecialEmployeeStatus | 3 | ✅ |
| Precision | TestCalculationPrecision | 3 | ✅ |

**Total**: 9 test classes, 26 test cases

---

## 🚀 Deployment Checklist

- [x] Edge case tests written
- [x] Error handling documented
- [x] Precision strategy defined
- [ ] Error messages localized (Japanese)
- [ ] Tests executed in CI/CD
- [ ] Error responses validated
- [ ] Documentation reviewed

---

## 📞 Handling Guide for Operations

### If Fiscal Year Error Detected
```
1. Check: Is employee hired during FY?
2. Verify: Entitlement calculation
3. Fix: Adjust allocation in admin panel
4. Notify: Employee of correct balance
5. Document: Reason for adjustment
```

### If Negative Balance Detected
```
1. Alert: KEITOSAN immediately
2. Review: Which requests caused over-allocation?
3. Options:
   ├─ Void the excess request
   ├─ Defer to next fiscal year
   └─ Negotiate with employee
4. Document: In audit log
```

### If Concurrent Conflict Detected
```
1. Inform: One manager's action succeeded
2. Inform: Other manager's action failed
3. Refresh: Show current status
4. Log: Both attempts with IPs and timestamps
5. Review: If pattern emerges (same conflict twice)
```

---

## 📚 References

- **Test Implementation**: `/home/user/JPUNS-Claude.6.0.2/backend/tests/test_yukyu_edge_cases.py`
- **Japanese Labor Law**: Fiscal year April 1 - March 31
- **Minimum Entitlement**: 5.0 days per fiscal year (non-negotiable)
- **Rounding Standard**: ROUND_HALF_UP for financial calculations
- **Precision**: Always use Decimal for monetary amounts

---

**Document Version**: 1.0
**Last Updated**: 2025-11-22
**Next Review**: 2025-12-22
