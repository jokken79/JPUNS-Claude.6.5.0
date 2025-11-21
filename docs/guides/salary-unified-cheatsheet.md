# Unified Salary Schema - Quick Reference (Cheat Sheet)

**Version:** 5.4.1 | **Date:** 2025-11-12

---

## 🚀 Quick Import

```python
from app.schemas import (
    # Core Response
    UnifiedSalaryCalculationResponse,

    # Main Requests
    SalaryCalculateRequest,
    SalaryBulkCalculateRequest,
    SalaryMarkPaidRequest,
    SalaryUpdateRequest,

    # Main Responses
    SalaryResponse,
    SalaryListResponse,
    BulkCalculateResponse,

    # Helpers
    UnifiedHoursBreakdown,
    RatesConfiguration,
    SalaryAmounts,
    UnifiedDeductionsDetail,
    PayrollSummary,

    # Enums
    SalaryStatus,
)
```

---

## 📊 Most Used Models

### 1. Calculate Single Salary

```python
request = SalaryCalculateRequest(
    employee_id=123,
    month=10,
    year=2025,
    use_timer_cards=True,  # Use timer card data
    bonus=20000.0,         # Optional bonus
    gasoline_allowance=15000.0,
    notes="Regular calculation"
)
```

### 2. Calculate Multiple Salaries

```python
request = SalaryBulkCalculateRequest(
    employee_ids=[123, 124, 125],  # Or None for all
    factory_id=None,  # Or specific factory
    month=10,
    year=2025
)
```

### 3. Mark as Paid

```python
request = SalaryMarkPaidRequest(
    salary_ids=[1, 2, 3],
    payment_date=datetime.now(),
    notes="Bank transfer completed"
)
```

### 4. Update Salary

```python
request = SalaryUpdateRequest(
    bonus=25000.0,
    status=SalaryStatus.APPROVED
)
```

---

## 📦 Response Structure

### Standard Response

```python
{
    "success": true,
    "id": 1,
    "status": "calculated",
    "data": {
        # Full SalaryCalculationResponse
        "employee_id": 123,
        "gross_salary": 305420.0,
        "net_salary": 217822.0,
        # ... 50+ fields
    },
    "message": "Success"
}
```

### Bulk Response

```python
{
    "successful": 45,
    "failed": 3,
    "total": 48,
    "results": [...],
    "errors": {126: "Error message"},
    "total_gross_amount": 13743900.0,
    "total_net_amount": 9820730.0,
    "total_company_profit": 1897840.0
}
```

---

## 🎯 Status Values

```python
SalaryStatus.DRAFT       # Initial draft
SalaryStatus.CALCULATED  # Calculated
SalaryStatus.VALIDATED   # Validated
SalaryStatus.APPROVED    # Approved for payment
SalaryStatus.PAID        # Paid
SalaryStatus.CANCELLED   # Cancelled
```

---

## 📐 Helper Models Quick Reference

### Hours Breakdown

```python
hours = UnifiedHoursBreakdown(
    regular_hours=160.0,
    overtime_hours=20.0,
    night_hours=15.0,
    holiday_hours=8.0,
    sunday_hours=8.0,
    total_hours=211.0,  # Auto-validated
    work_days=22
)
```

### Rates Configuration

```python
rates = RatesConfiguration(
    base_rate=1200.0,
    regular_rate=1200.0,
    overtime_rate=1.25,   # 労働基準法
    night_rate=1.25,
    holiday_rate=1.35,
    sunday_rate=1.35
)
```

### Salary Amounts

```python
amounts = SalaryAmounts(
    regular_amount=192000.0,
    overtime_amount=30000.0,
    night_amount=22500.0,
    holiday_amount=12960.0,
    sunday_amount=12960.0,
    bonus=20000.0,
    gasoline_allowance=15000.0,
    subtotal=305420.0  # Auto-calculated
)
```

### Deductions Detail

```python
deductions = UnifiedDeductionsDetail(
    income_tax=15271.0,        # 所得税
    resident_tax=8000.0,       # 住民税
    health_insurance=14500.0,  # 健康保険
    pension=18300.0,           # 厚生年金
    employment_insurance=1527.0,
    apartment_deduction=30000.0,
    other_deductions=0.0,
    total_deductions=87598.0   # Auto-calculated
)
```

### Payroll Summary

```python
summary = PayrollSummary(
    gross_salary=305420.0,
    total_deductions=87598.0,
    net_salary=217822.0,      # Auto-validated
    factory_payment=350000.0,
    company_profit=44580.0
)
```

---

## ✅ Auto-Validators

**These fields auto-validate/correct:**

1. `total_hours` = sum of all hour types
2. `subtotal` = sum of all amounts
3. `total_deductions` = sum of all deductions
4. `net_salary` = gross_salary - total_deductions

**Don't worry about calculation errors - validators fix them!**

---

## 🔧 Common Patterns

### Pattern 1: Validate → Calculate

```python
# Step 1: Validate
validate_req = SalaryValidateRequest(
    employee_id=123, month=10, year=2025
)
validation = await service.validate(validate_req)

# Step 2: Calculate if valid
if validation.is_valid:
    calc_req = SalaryCalculateRequest(
        employee_id=123, month=10, year=2025
    )
    result = await service.calculate(calc_req)
```

### Pattern 2: Bulk Calculate → Handle Errors

```python
bulk_req = SalaryBulkCalculateRequest(
    factory_id="F001", month=10, year=2025
)
response = await service.bulk_calculate(bulk_req)

print(f"✅ Success: {response.successful}")
print(f"❌ Failed: {response.failed}")

for emp_id, error in response.errors.items():
    print(f"Employee {emp_id}: {error}")
```

### Pattern 3: Calculate → Generate Payslip → Mark Paid

```python
# Step 1: Calculate
calc_req = SalaryCalculateRequest(...)
salary = await service.calculate(calc_req)

# Step 2: Generate payslip
payslip_req = PayslipGenerateRequest(
    salary_id=salary.id,
    include_breakdown=True,
    language="ja"
)
payslip = await payslip_service.generate(payslip_req)

# Step 3: Mark as paid
paid_req = SalaryMarkPaidRequest(
    salary_ids=[salary.id],
    payment_date=datetime.now()
)
await service.mark_paid(paid_req)
```

---

## 📊 Statistics Example

```python
stats = await service.get_statistics(month=10, year=2025)

print(f"👥 Employees: {stats.total_employees}")
print(f"💵 Gross: ¥{stats.total_gross_amount:,.0f}")
print(f"💰 Net: ¥{stats.total_net_amount:,.0f}")
print(f"📈 Profit: ¥{stats.company_total_profit:,.0f}")
print(f"📊 Average: ¥{stats.average_salary:,.0f}")
```

---

## 🚫 Common Mistakes

### ❌ WRONG

```python
# Using string for status
if salary.status == "calculated":  # Typo-prone
    ...

# Not handling errors
result = await service.calculate(req)  # May throw
```

### ✅ CORRECT

```python
# Using enum for status
if salary.status == SalaryStatus.CALCULATED:  # Type-safe
    ...

# Handling errors properly
try:
    result = await service.calculate(req)
except ValueError as e:
    # Handle error
    ...
```

---

## 🔗 All Available Models (25 Total)

### Enums (2)
- `SalaryStatus`
- `PayrollRunStatus`

### Helpers (6)
- `UnifiedHoursBreakdown`
- `RatesConfiguration`
- `SalaryAmounts`
- `UnifiedDeductionsDetail`
- `PayrollSummary`
- `UnifiedTimerRecord`

### Core (1)
- `UnifiedSalaryCalculationResponse`

### Requests (5)
- `SalaryCalculateRequest`
- `SalaryBulkCalculateRequest`
- `SalaryMarkPaidRequest`
- `SalaryValidateRequest`
- `SalaryUpdateRequest`

### Responses (5)
- `SalaryResponse`
- `SalaryListResponse`
- `BulkCalculateResponse`
- `ValidationResult`
- `UnifiedSalaryStatistics`

### Payslips (2)
- `PayslipGenerateRequest`
- `PayslipResponse`

### CRUD (3)
- `SalaryCreateResponse`
- `SalaryUpdateResponse`
- `SalaryDeleteResponse`

### Errors (1)
- `SalaryError`

---

## 📚 More Info

- **Full Guide**: `/docs/guides/salary-unified-schema-guide.md`
- **Source Code**: `/backend/app/schemas/salary_unified.py`
- **Implementation**: `/SALARY_UNIFIED_IMPLEMENTATION.md`

---

**Last Updated:** 2025-11-12 | **Version:** 5.4.1
