# 🚀 COMPLETE APPLICATION WORKFLOW GUIDE - PART 1-2
## Payroll, Attendance & Salary Calculation (タイムカード → 給与計算 → 給与振込)

**System:** UNS-ClaudeJP 6.0.0
**Date:** 2025-11-17
**Version:** 1.0 - Complete Payroll & Attendance Workflow

---

## 📋 TABLE OF CONTENTS

1. [Overview & System Architecture](#1-overview--system-architecture)
2. [Phase 1: Timer Card Management (タイムカード)](#2-phase-1-timer-card-management)
3. [Phase 2: OCR Processing (PDF → Data)](#3-phase-2-ocr-processing)
4. [Phase 3: Factory Rules Application](#4-phase-3-factory-rules-application)
5. [Phase 4: Payroll Calculation (給与計算)](#5-phase-4-payroll-calculation)
6. [Phase 5: Salary Processing (給与振込)](#6-phase-5-salary-processing)
7. [Database Schema & Models](#7-database-schema--models)
8. [Japanese Labor Law Compliance](#8-japanese-labor-law-compliance)
9. [API Endpoints Reference](#9-api-endpoints-reference)
10. [Frontend UI Flow](#10-frontend-ui-flow)

---

## 1. OVERVIEW & SYSTEM ARCHITECTURE

### Payroll System Components

```
┌──────────────────────────────────────────────────────────────┐
│              PAYROLL SYSTEM ARCHITECTURE                      │
├──────────────────────────────────────────────────────────────┤
│                                                               │
│  SOURCES OF DATA:                                            │
│  ├─ Timer Cards (manual entry or OCR from PDF)              │
│  ├─ Factory Configuration (work hours, overtime rules)       │
│  ├─ Employee Data (hire date, hourly rate, position)        │
│  └─ System Settings (tax rates, insurance rates)            │
│                                                               │
│  PROCESSING PIPELINE:                                        │
│  1. Timer Card Collection                                    │
│     └─ Input: Work hours per day, overtime, holidays        │
│                                                               │
│  2. OCR Processing (if PDF upload)                          │
│     └─ Extract: dates, hours, shifts from PDF              │
│                                                               │
│  3. Factory Rules Application                               │
│     └─ Apply: work hour limits, overtime thresholds        │
│                                                               │
│  4. Payroll Calculation                                      │
│     ├─ Regular hours pay                                    │
│     ├─ Overtime pay (1.25x)                                │
│     ├─ Night shift pay (1.25x)                             │
│     ├─ Holiday pay (1.35x)                                 │
│     ├─ Deductions (apartment, insurance, tax)              │
│     └─ Net amount                                           │
│                                                               │
│  5. Salary Processing                                        │
│     └─ Generate: payslips, bank transfers, records          │
│                                                               │
│  OUTPUT:                                                      │
│  ├─ Payroll Run (monthly record)                            │
│  ├─ Salary Calculations (per employee)                      │
│  ├─ Payslips (PDF for employee)                             │
│  └─ Reports (Excel, summary statistics)                    │
│                                                               │
└──────────────────────────────────────────────────────────────┘
```

### Key Statistics

| Metric | Value |
|--------|-------|
| **Payroll Endpoints** | 20+ |
| **Salary Endpoints** | 10+ |
| **Timer Card Endpoints** | 10+ |
| **Database Tables** | 4 main (timer_cards, salary_calculations, payroll_runs, processed_timer_cards) |
| **Supported Shifts** | 3 (morning 朝番, afternoon 昼番, night 夜番) |
| **Overtime Multiplier** | 1.25x (Japanese law) |
| **Night Shift Multiplier** | 1.25x |
| **Holiday Multiplier** | 1.35x |

---

## 2. PHASE 1: TIMER CARD MANAGEMENT

### 2.1 Timer Card Entry Methods

#### Method A: Manual Daily Entry

**Location:** Frontend: `app/(dashboard)/timercards/entry/page.tsx`

```
┌──────────────────────────────────────────────────────────┐
│  タイムカード入力 (Daily Timer Card Entry)               │
├──────────────────────────────────────────────────────────┤
│                                                          │
│  Employee Selection: *                                  │
│  ┌──────────────────────────────────┐                   │
│  │ 田中太郎 (Tanaka Taro)       ▼ │                   │
│  └──────────────────────────────────┘                   │
│                                                          │
│  Date: *                                                │
│  ┌──────────────┐                                       │
│  │ 2025-12-01   │ (date picker)                         │
│  └──────────────┘                                       │
│                                                          │
│  Shift Type: *                                          │
│  ○ 朝番 (Morning: 7:00-15:30)                           │
│  ○ 昼番 (Afternoon: 10:00-18:30)                        │
│  ○ 夜番 (Night: 19:00-3:30 next day)                   │
│                                                          │
│  Start Time: *                                          │
│  ┌──────────────┐                                       │
│  │ 07:00        │ (time picker)                         │
│  └──────────────┘                                       │
│                                                          │
│  End Time: *                                            │
│  ┌──────────────┐                                       │
│  │ 15:30        │ (time picker)                         │
│  └──────────────┘                                       │
│                                                          │
│  Break Duration: *                                      │
│  ┌──────────────┐                                       │
│  │ 45           │ minutes                               │
│  └──────────────┘                                       │
│                                                          │
│  Overtime Hours: (optional)                             │
│  ┌──────────────┐                                       │
│  │ 0            │ hours                                 │
│  └──────────────┘                                       │
│                                                          │
│  Notes:                                                 │
│  ┌──────────────────────────────────┐                   │
│  │ 残業2時間 (Overtime 2h)           │                   │
│  └──────────────────────────────────┘                   │
│                                                          │
│  ┌────────────┐ ┌──────────────────┐                   │
│  │ 保存       │ │ 次を追加          │                   │
│  │ (Save)    │ │ (Add Next)        │                   │
│  └────────────┘ └──────────────────┘                   │
│                                                          │
└──────────────────────────────────────────────────────────┘
```

**API Endpoint:**
```
POST /api/timer-cards/
{
    "employee_id": 456,
    "date": "2025-12-01",
    "shift_type": "morning",  # morning|afternoon|night
    "start_time": "07:00",
    "end_time": "15:30",
    "break_duration": 45,     # minutes
    "overtime_hours": 0,
    "notes": ""
}
```

#### Method B: Batch PDF Upload (OCR)

**Location:** Frontend: `app/(dashboard)/timercards/upload/page.tsx`

```
┌──────────────────────────────────────────────────────────┐
│  タイムカード一括アップロード (Batch Upload)              │
├──────────────────────────────────────────────────────────┤
│                                                          │
│  Factory Selection: *                                   │
│  ┌──────────────────────────────────┐                   │
│  │ 高雄工業_本社工場          ▼ │                   │
│  └──────────────────────────────────┘                   │
│                                                          │
│  Year/Month: *                                          │
│  ┌──────────┐ ┌──────────┐                              │
│  │ 2025  ▼ │ │  12   ▼ │                              │
│  └──────────┘ └──────────┘                              │
│                                                          │
│  PDF File: *                                            │
│  ┌──────────────────────────────────┐                   │
│  │ [📎 Choose File]                 │                   │
│  │ or drag & drop here              │                   │
│  │ Max 50MB                         │                   │
│  └──────────────────────────────────┘                   │
│                                                          │
│  Processing Options:                                    │
│  ☑ Auto-save after OCR                                 │
│  ☑ Apply factory rules                                 │
│  ☐ Mark as approved                                    │
│                                                          │
│  ┌────────────────────────────────┐                     │
│  │ 🚀 アップロード (Upload)       │                     │
│  └────────────────────────────────┘                     │
│                                                          │
└──────────────────────────────────────────────────────────┘
```

**API Endpoint:**
```
POST /api/timer-cards/upload-batch
FormData:
  - factory_id: 123
  - year: 2025
  - month: 12
  - pdf_file: <binary PDF>
  - auto_save: true
  - apply_rules: true
```

### 2.2 Timer Card Data Structure

**Table:** `timer_cards`

```sql
CREATE TABLE timer_cards (
    id SERIAL PRIMARY KEY,

    -- Links
    employee_id INT REFERENCES employees(id),
    factory_id INT REFERENCES factories(factory_id),

    -- Date & Time
    work_date DATE NOT NULL,
    shift_type VARCHAR(50),          -- morning|afternoon|night
    start_time TIME,
    end_time TIME,

    -- Duration (minutes)
    break_duration INT DEFAULT 0,
    total_minutes INT,               -- Calculated: end - start - break

    -- Overtime (hours)
    overtime_hours DECIMAL(5,2) DEFAULT 0,

    -- Status
    status VARCHAR(50) DEFAULT 'draft',  -- draft|submitted|approved|rejected
    approved_by INT REFERENCES users(id),
    approved_at TIMESTAMP,

    -- Metadata
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    -- Index for performance
    UNIQUE(employee_id, work_date),
    INDEX idx_factory_month (factory_id, YEAR(work_date), MONTH(work_date))
);
```

### 2.3 Monthly Timer Card Summary

**Endpoint:**
```
GET /api/timer-cards/summary
?employee_id=456&month=12&year=2025

Response:
{
    "employee_id": 456,
    "month": 12,
    "year": 2025,
    "total_days": 22,           # Work days
    "total_hours": 176,         # 22 days × 8 hours
    "overtime_hours": 12,       # Extra hours worked
    "night_shift_hours": 6,     # Night shift work
    "holiday_hours": 0,         # Holiday work
    "absences": 0,
    "late_arrivals": 1,
    "status": "submitted",      # submitted|approved|rejected
    "details": [
        {
            "date": "2025-12-01",
            "shift": "morning",
            "hours": 8.0,
            "overtime": 0,
            "notes": ""
        },
        ...
    ]
}
```

---

## 3. PHASE 2: OCR PROCESSING

### 3.1 PDF Format Requirements

**Expected PDF Structure:**

```
PDF: 高雄工業_本社工場_2025年12月.pdf
├─ Page 1: Header
│  └─ Factory name, year/month, employee count
│
├─ Page 2: Employee #1 (Nguyen Van A)
│  ├─ Header:
│  │  ├─ Employee name: グエン　バン　A
│  │  ├─ Employee ID: E-12345
│  │  └─ Line assignment: Aライン
│  │
│  └─ Table: 31 rows (one per day)
│     ├─ Column 1: Date (日付)
│     ├─ Column 2: Start time (出勤)
│     ├─ Column 3: End time (退勤)
│     ├─ Column 4: Break (休憩)
│     └─ Column 5: Notes (備考)
│
├─ Page 3: Employee #2 (Tran Thi B)
│  └─ ... similar structure ...
│
└─ Page N: Employee #N
   └─ ... similar structure ...
```

### 3.2 OCR Processing Pipeline

**File:** `backend/app/services/ocr_service.py`

```python
async def process_timer_card_pdf(
    pdf_file: UploadFile,
    factory_id: int,
    year: int,
    month: int
) -> List[ProcessedTimerCard]:
    """
    1. Extract PDF content
    2. Identify pages per employee
    3. Extract table data (dates, times)
    4. Match to employees
    5. Return structured data
    """

    # Step 1: Convert PDF to images
    pdf_bytes = await pdf_file.read()
    images = pdf_to_images(pdf_bytes)

    results = []

    # Step 2: Process each page
    for page_num, image in enumerate(images):
        # Skip header page (usually page 1)
        if page_num == 0:
            continue

        # Step 3: Extract header info (employee name, ID)
        header_info = extract_header(image)
        employee_name = header_info.get("employee_name")
        employee_id = header_info.get("employee_id")

        # Step 4: Find employee in database
        employee = find_employee_by_name_and_id(employee_name, employee_id)
        if not employee:
            logger.warning(f"Employee not found: {employee_name} ({employee_id})")
            continue

        # Step 5: Extract table data
        table_data = extract_table_from_image(image)

        # Step 6: Parse each row (one per day)
        for row in table_data:
            date_str = row["日付"]                    # "1", "2", "3"... (day of month)
            start_time_str = row["出勤"]            # "07:00"
            end_time_str = row["退勤"]              # "15:30"
            break_duration_str = row["休憩"]        # "45"
            notes_str = row["備考"]                 # "残業2時間"

            # Build full date
            work_date = date(year, month, int(date_str))

            # Parse times
            start_time = time.fromisoformat(start_time_str) if start_time_str else None
            end_time = time.fromisoformat(end_time_str) if end_time_str else None

            # Detect shift type from start time
            shift_type = detect_shift_type(start_time)

            # Extract overtime from notes
            overtime_hours = parse_overtime_from_notes(notes_str)

            # Create timer card object
            timer_card = ProcessedTimerCard(
                employee_id=employee.id,
                factory_id=factory_id,
                work_date=work_date,
                shift_type=shift_type,
                start_time=start_time,
                end_time=end_time,
                break_duration=int(break_duration_str) if break_duration_str else 0,
                overtime_hours=overtime_hours,
                notes=notes_str,
                status="draft"  # Pending review
            )

            results.append(timer_card)

    return results
```

### 3.3 Shift Type Detection

**Logic:**

```python
def detect_shift_type(start_time: time) -> str:
    """Detect shift based on start time"""

    if start_time is None:
        return "unknown"

    hour = start_time.hour

    if 6 <= hour < 12:
        return "morning"      # 6:00-11:59 = 朝番
    elif 12 <= hour < 18:
        return "afternoon"    # 12:00-17:59 = 昼番
    elif hour >= 18 or hour < 6:
        return "night"        # 18:00+ or <6:00 = 夜番
    else:
        return "other"
```

### 3.4 OCR Result Review

**Frontend:** `app/(dashboard)/timercards/ocr-review/page.tsx`

```
┌──────────────────────────────────────────────────────────┐
│  OCR結果確認 (Review OCR Results)                        │
│  高雄工業_本社工場_2025年12月.pdf                         │
├──────────────────────────────────────────────────────────┤
│                                                          │
│  Processing Summary:                                    │
│  ✅ 150 rows extracted                                  │
│  ✅ 5 employees matched                                 │
│  ⚠️  2 rows could not be processed                      │
│  📝 Review before saving to database                    │
│                                                          │
│  ┌─ グエン　バン　A (Employee E-12345) ──────────────┐ │
│  │                                                      │ │
│  │  Date   │ Shift │ Start │ End   │ Break │ Overtime│ │
│  │────────┼───────┼───────┼───────┼───────┼─────────│ │
│  │ 12/01  │ 朝番  │ 07:00 │ 15:30 │  45m  │ 0h     │ │
│  │ 12/02  │ 朝番  │ 07:00 │ 17:00 │  45m  │ 2h     │ │
│  │ 12/03  │ 朝番  │ 07:00 │ 15:30 │  45m  │ 0h     │ │
│  │ ... more rows ...                                    │ │
│  │                                                      │ │
│  └──────────────────────────────────────────────────────┘ │
│                                                          │
│  ┌─ トラン　ティ　B (Employee E-12346) ──────────────┐ │
│  │ ... similar table ...                                │ │
│  └──────────────────────────────────────────────────────┘ │
│                                                          │
│  Issues Found:                                          │
│  ⚠️  Row 12/05 (Employee E-12347): Time format invalid  │
│  ⚠️  Row 12/15 (Employee E-12348): Employee not found   │
│                                                          │
│  ┌─────────────────────┐ ┌──────────────────────────┐   │
│  │ 修正してから保存    │ │ そのまま保存             │   │
│  │ (Fix & Save)       │ │ (Save Anyway)            │   │
│  └─────────────────────┘ └──────────────────────────┘   │
│                                                          │
└──────────────────────────────────────────────────────────┘
```

---

## 4. PHASE 3: FACTORY RULES APPLICATION

### 4.1 Factory Configuration

**Table:** `factories` (extended fields)

```sql
ALTER TABLE factories ADD COLUMN (
    work_hours_per_day DECIMAL(5,2) DEFAULT 8,    -- Standard 8h
    overtime_threshold DECIMAL(5,2) DEFAULT 10,   -- After 10h, overtime starts
    max_hours_per_day DECIMAL(5,2) DEFAULT 12,    -- Maximum allowed
    break_duration_minutes INT DEFAULT 45,         -- Standard break
    night_shift_multiplier DECIMAL(3,2) DEFAULT 1.25,
    overtime_multiplier DECIMAL(3,2) DEFAULT 1.25,
    holiday_multiplier DECIMAL(3,2) DEFAULT 1.35,
    weekly_day_off VARCHAR(50) DEFAULT 'Sunday',  -- 日曜日
    weekend_work_rate DECIMAL(3,2) DEFAULT 1.35   -- Saturday/Sunday rate
);
```

**Example Factory Configuration:**

```python
factory_rules = {
    "factory_id": 123,
    "factory_name": "高雄工業_本社工場",
    "work_hours_per_day": 8,           # 8時間が標準
    "overtime_threshold": 10,          # 10h以上は残業
    "max_hours_per_day": 12,           # 最大12h
    "break_duration": 45,              # 45分休憩
    "overtime_rate": 1.25,             # 1.25倍賃金
    "night_shift_rate": 1.25,          # 夜勤1.25倍
    "holiday_rate": 1.35,              # 祝日1.35倍
    "min_break_duration": 30,          # 最低30分
    "max_consecutive_days": 6,         # 連続勤務最大6日
}
```

### 4.2 Rule Application Logic

**Process:**

```python
def apply_factory_rules(
    timer_card: TimerCard,
    factory_rules: FactoryRules
) -> RuleApplicationResult:
    """
    Apply factory-specific rules to timer card
    Adjust hours, detect violations, flag issues
    """

    issues = []

    # 1. Calculate total hours
    total_minutes = (
        timer_card.end_time - timer_card.start_time
    ).total_seconds() / 60

    working_minutes = total_minutes - timer_card.break_duration
    total_hours = working_minutes / 60

    # 2. Validate against max hours
    if total_hours > factory_rules.max_hours_per_day:
        issues.append({
            "level": "warning",
            "message": f"Exceeds max hours ({total_hours}h > {factory_rules.max_hours_per_day}h)",
            "action": "review_needed"
        })

    # 3. Validate break duration
    if timer_card.break_duration < factory_rules.min_break_duration:
        issues.append({
            "level": "warning",
            "message": f"Break too short ({timer_card.break_duration}min < {factory_rules.min_break_duration}min)",
            "action": "adjust_break"
        })

    # 4. Categorize hours
    regular_hours = min(total_hours, factory_rules.work_hours_per_day)

    if total_hours > factory_rules.work_hours_per_day:
        overtime_hours = total_hours - factory_rules.work_hours_per_day
    else:
        overtime_hours = 0

    # 5. Detect shift type and apply multiplier
    shift_type = timer_card.shift_type or detect_shift_type(timer_card.start_time)

    night_shift_hours = 0
    if shift_type == "night":
        night_shift_hours = total_hours  # All night shift hours

    # 6. Calculate effective hours (for payroll)
    calculated_hours = {
        "regular": regular_hours,
        "overtime": max(overtime_hours, timer_card.overtime_hours),  # Use max
        "night_shift": night_shift_hours,
        "total": total_hours
    }

    return RuleApplicationResult(
        timer_card_id=timer_card.id,
        original_hours=total_hours,
        calculated_hours=calculated_hours,
        applied_rules=factory_rules,
        issues=issues,
        status="approved" if not issues else "review_needed"
    )
```

### 4.3 Violation Detection

**Types of Issues:**

| Issue | Threshold | Action | Severity |
|-------|-----------|--------|----------|
| Exceeds max hours | > 12h/day | Flag for review | ⚠️ Warning |
| Short break | < 30 min | Adjust break | ⚠️ Warning |
| Too many consecutive days | > 6 days | Request day off | 🔴 Error |
| Negative hours | Start > End | Data error | 🔴 Error |
| Missing data | NULL fields | Incomplete | 🟡 Info |

---

## 5. PHASE 4: PAYROLL CALCULATION

### 5.1 Monthly Payroll Generation

**Endpoint:**
```
POST /api/payroll/create-run
{
    "factory_id": 123,
    "month": 12,
    "year": 2025,
    "include_employees": [456, 457, 458],  # Optional filter
}

Response:
{
    "run_id": "RUN-2025-12-001",
    "factory_id": 123,
    "month": 12,
    "year": 2025,
    "status": "in_progress",
    "employees_count": 150,
    "processing_status": {
        "total": 150,
        "completed": 0,
        "in_progress": 1,
        "failed": 0
    }
}
```

### 5.2 Individual Payroll Calculation

**File:** `backend/app/services/payroll_service.py`

```python
async def calculate_employee_payroll(
    employee_id: int,
    month: int,
    year: int
) -> EmployeePayrollResult:
    """
    Calculate complete payroll for one employee
    """

    # 1. Fetch employee data
    employee = db.query(Employee).filter_by(id=employee_id).first()
    if not employee:
        raise EmployeeNotFoundError()

    # 2. Fetch timer cards for month
    timer_cards = db.query(TimerCard).filter(
        TimerCard.employee_id == employee_id,
        YEAR(TimerCard.work_date) == year,
        MONTH(TimerCard.work_date) == month,
        TimerCard.status == "approved"
    ).all()

    # 3. Aggregate hours
    total_regular_hours = 0
    total_overtime_hours = 0
    total_night_hours = 0
    total_holiday_hours = 0

    for tc in timer_cards:
        # Get factory rules
        factory = db.query(Factory).filter_by(
            factory_id=employee.factory_id
        ).first()

        # Apply rules
        result = apply_factory_rules(tc, factory.rules)
        hours = result.calculated_hours

        total_regular_hours += hours.get("regular", 0)
        total_overtime_hours += hours.get("overtime", 0)
        total_night_hours += hours.get("night_shift", 0)
        total_holiday_hours += hours.get("holiday", 0)

    # 4. Get hourly rates
    base_rate = employee.jikyu  # Hourly wage (e.g., 1500 yen)

    # 5. Calculate gross pay (before deductions)
    base_amount = total_regular_hours * base_rate
    overtime_amount = total_overtime_hours * base_rate * 1.25
    night_amount = total_night_hours * base_rate * 1.25
    holiday_amount = total_holiday_hours * base_rate * 1.35

    gross_amount = (
        base_amount + overtime_amount + night_amount + holiday_amount
    )

    # 6. Calculate deductions
    deductions = {
        "apartment_rent": 0,
        "health_insurance": 0,
        "unemployment_insurance": 0,
        "income_tax": 0,
        "local_tax": 0
    }

    # Apartment deduction (if assigned)
    if employee.apartment_id:
        apartment_assignment = db.query(ApartmentAssignment).filter(
            ApartmentAssignment.employee_id == employee_id,
            ApartmentAssignment.status == "active"
        ).first()

        if apartment_assignment:
            apartment = apartment_assignment.apartment
            deductions["apartment_rent"] = apartment.base_rent

    # Insurance deductions (typically company + employee split)
    # Example: 10% of gross amount
    total_insurance = gross_amount * 0.10
    deductions["health_insurance"] = total_insurance * 0.5
    deductions["unemployment_insurance"] = total_insurance * 0.5

    # Tax calculation (simplified)
    taxable_amount = gross_amount - total_insurance
    deductions["income_tax"] = taxable_amount * 0.05  # 5% estimated

    total_deductions = sum(deductions.values())

    # 7. Calculate net pay
    net_amount = gross_amount - total_deductions

    # 8. Create salary calculation record
    salary_calc = SalaryCalculation(
        employee_id=employee_id,
        month=month,
        year=year,
        base_hours=total_regular_hours,
        overtime_hours=total_overtime_hours,
        night_shift_hours=total_night_hours,
        holiday_hours=total_holiday_hours,
        base_rate=base_rate,
        gross_amount=gross_amount,
        apartment_deduction=deductions["apartment_rent"],
        insurance_deduction=total_insurance,
        tax_deduction=deductions["income_tax"],
        total_deductions=total_deductions,
        net_amount=net_amount,
        status="calculated"
    )

    return EmployeePayrollResult(
        employee_id=employee_id,
        employee_name=employee.full_name_roman,
        month=month,
        year=year,
        hours_summary={
            "regular": total_regular_hours,
            "overtime": total_overtime_hours,
            "night_shift": total_night_hours,
            "holiday": total_holiday_hours,
            "total": (
                total_regular_hours + total_overtime_hours +
                total_night_hours + total_holiday_hours
            )
        },
        rates={
            "base_rate": base_rate,
            "overtime_multiplier": 1.25,
            "night_shift_multiplier": 1.25,
            "holiday_multiplier": 1.35
        },
        amounts={
            "base_pay": base_amount,
            "overtime_pay": overtime_amount,
            "night_shift_pay": night_amount,
            "holiday_pay": holiday_amount,
            "gross_amount": gross_amount
        },
        deductions=deductions,
        net_amount=net_amount,
        status="calculated"
    )
```

### 5.3 Payroll Calculation Example

**Input:**

```
Employee: 田中太郎 (Tanaka Taro)
Hourly Rate: ¥1,500
Month: December 2025

Timer Cards (20 working days):
- 15 regular days: 8h × 15 = 120h
- 3 overtime days: 10h × 3 = 30h (includes 2h overtime each)
- 1 night shift: 8h
- 1 holiday: 8h
```

**Calculation:**

```
HOURS SUMMARY:
═════════════════════════════════════════════
Regular Hours: 120h
Overtime Hours: 6h      (2h × 3 days)
Night Shift Hours: 8h
Holiday Hours: 8h
────────────────────────────────────────────
Total Hours: 142h

GROSS PAY CALCULATION:
═════════════════════════════════════════════
Regular: 120h × ¥1,500 = ¥180,000
Overtime: 6h × ¥1,500 × 1.25 = ¥11,250
Night Shift: 8h × ¥1,500 × 1.25 = ¥15,000
Holiday: 8h × ¥1,500 × 1.35 = ¥16,200
────────────────────────────────────────────
Gross Amount: ¥222,450

DEDUCTIONS:
═════════════════════════════════════════════
Apartment Rent: ¥45,000
Health Insurance: ¥11,123  (5% × 50%)
Unemployment Insurance: ¥11,123  (5% × 50%)
Income Tax (5%): ¥10,816
────────────────────────────────────────────
Total Deductions: ¥78,062

NET PAY:
═════════════════════════════════════════════
Gross Amount: ¥222,450
- Deductions: ¥78,062
════════════════════════════════════════════
NET PAY: ¥144,388
```

---

## 6. PHASE 5: SALARY PROCESSING

### 6.1 Payslip Generation

**Endpoint:**
```
GET /api/payroll/payslip/{salary_calculation_id}
or
GET /api/payroll/payslip/{employee_id}?month=12&year=2025

Response: PDF document (binary)
```

**PDF Layout:**

```
┌─────────────────────────────────────────────────────────────┐
│                                                             │
│                      給与明細書                             │
│                   (SALARY STATEMENT)                        │
│                                                             │
│  High Kao Industrial Ltd.                                 │
│  本社工場 (Head Office Plant)                              │
│                                                             │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  Employee Name: 田中太郎 (Tanaka Taro)                    │
│  Employee ID: E-2025-001                                  │
│  Department: Manufacturing Line A                         │
│  Position: Line Worker                                    │
│  Salary Period: December 2025 (2025-12-01 ~ 2025-12-31) │
│                                                             │
├─────────────────────────────────────────────────────────────┤
│  WORK HOURS                                                │
├─────────────────────────────────────────────────────────────┤
│  Regular Hours ........... 120.0h                           │
│  Overtime Hours .......... 6.0h (¥1,500 × 1.25)           │
│  Night Shift Hours ....... 8.0h (¥1,500 × 1.25)           │
│  Holiday Hours ........... 8.0h (¥1,500 × 1.35)           │
│  ─────────────────────────────────                          │
│  Total Hours ............ 142.0h                           │
│                                                             │
├─────────────────────────────────────────────────────────────┤
│  GROSS PAY                                                 │
├─────────────────────────────────────────────────────────────┤
│  Base Pay (120h × ¥1,500) ............ ¥180,000           │
│  Overtime Pay (6h × ¥1,500 × 1.25) .. ¥11,250            │
│  Night Shift (8h × ¥1,500 × 1.25) ... ¥15,000            │
│  Holiday Pay (8h × ¥1,500 × 1.35) ... ¥16,200            │
│  ─────────────────────────────────────────────────        │
│  TOTAL GROSS PAY ..................... ¥222,450           │
│                                                             │
├─────────────────────────────────────────────────────────────┤
│  DEDUCTIONS                                                │
├─────────────────────────────────────────────────────────────┤
│  Apartment Rent (社宅) ............... ¥45,000            │
│  Health Insurance (健康保険) ......... ¥11,123            │
│  Unemployment Insurance (雇用保険) .. ¥11,123            │
│  Income Tax (所得税) ................ ¥10,816            │
│  ─────────────────────────────────────────────────        │
│  TOTAL DEDUCTIONS ................... ¥78,062            │
│                                                             │
├─────────────────────────────────────────────────────────────┤
│  NET PAY (手取り) ................... ¥144,388            │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  Payment Method: Bank Transfer (振込)                     │
│  Bank: 高雄銀行                                            │
│  Account: ****1234                                        │
│  Payment Date: 2025-12-25                                │
│                                                             │
│  ※ This statement is for reference only.                 │
│    Please contact HR for any discrepancies.              │
│                                                             │
│                           Generated: 2025-11-17           │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### 6.2 Bulk Salary Export

**Endpoint:**
```
GET /api/payroll/export-excel
?month=12&year=2025&factory_id=123

Response: Excel file (.xlsx)
```

**Excel Sheets:**

1. **Summary Sheet** - Monthly overview
2. **Employee Details** - Per-employee breakdown (150+ employees)
3. **Hour Summary** - Hours aggregation
4. **Deduction Summary** - Deductions breakdown

### 6.3 Bank Transfer File Generation

**Format:** CSV for bank integration

```csv
employee_id,full_name,bank_code,account_number,amount
E-2025-001,Tanaka Taro,0001,0000001234,144388
E-2025-002,Nguyen Van A,0001,0000001235,125000
E-2025-003,Tran Thi B,0001,0000001236,135000
...
```

### 6.4 Salary Processing Status

**Endpoint:**
```
GET /api/payroll/run/{run_id}/status

Response:
{
    "run_id": "RUN-2025-12-001",
    "month": 12,
    "year": 2025,
    "status": "completed",
    "total_employees": 150,
    "processed": 150,
    "failed": 0,
    "gross_total": ¥33,367,500,
    "deductions_total": ¥11,700,000,
    "net_total": ¥21,667,500,
    "completion_percentage": 100,
    "started_at": "2025-11-17T08:00:00Z",
    "completed_at": "2025-11-17T08:45:30Z"
}
```

---

## 7. DATABASE SCHEMA & MODELS

### 7.1 Timer Cards Table

```sql
CREATE TABLE timer_cards (
    id SERIAL PRIMARY KEY,
    employee_id INT NOT NULL REFERENCES employees(id),
    factory_id INT NOT NULL REFERENCES factories(factory_id),

    work_date DATE NOT NULL,
    shift_type VARCHAR(50),          -- morning, afternoon, night
    start_time TIME,
    end_time TIME,
    break_duration INT DEFAULT 0,
    overtime_hours DECIMAL(5,2) DEFAULT 0,

    status VARCHAR(50) DEFAULT 'draft',
    approved_by INT REFERENCES users(id),
    approved_at TIMESTAMP,

    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    UNIQUE(employee_id, work_date),
    INDEX idx_factory_month (factory_id, work_date),
    INDEX idx_employee_month (employee_id, work_date)
);
```

### 7.2 Processed Timer Cards (OCR) Table

```sql
CREATE TABLE processed_timer_cards (
    id SERIAL PRIMARY KEY,
    upload_id VARCHAR(255),          -- Link to batch upload
    employee_id INT REFERENCES employees(id),
    factory_id INT NOT NULL,

    work_date DATE,
    shift_type VARCHAR(50),
    start_time TIME,
    end_time TIME,
    break_duration INT,
    overtime_hours DECIMAL(5,2),

    status VARCHAR(50) DEFAULT 'review',  -- review, approved, rejected
    errors JSON,                      -- Array of issues found
    reviewed_by INT REFERENCES users(id),
    reviewed_at TIMESTAMP,

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(upload_id, employee_id, work_date)
);
```

### 7.3 Salary Calculations Table

```sql
CREATE TABLE salary_calculations (
    id SERIAL PRIMARY KEY,
    employee_id INT NOT NULL REFERENCES employees(id),

    month INT NOT NULL,              -- 1-12
    year INT NOT NULL,               -- 2025, etc.

    -- Hours
    base_hours DECIMAL(8,2),
    overtime_hours DECIMAL(8,2),
    night_shift_hours DECIMAL(8,2),
    holiday_hours DECIMAL(8,2),

    -- Rates
    base_rate DECIMAL(10,2),         -- ¥/hour
    overtime_multiplier DECIMAL(3,2) DEFAULT 1.25,
    night_shift_multiplier DECIMAL(3,2) DEFAULT 1.25,
    holiday_multiplier DECIMAL(3,2) DEFAULT 1.35,

    -- Amounts
    gross_amount DECIMAL(12,2),
    apartment_deduction DECIMAL(10,2) DEFAULT 0,
    insurance_deduction DECIMAL(10,2) DEFAULT 0,
    tax_deduction DECIMAL(10,2) DEFAULT 0,
    total_deductions DECIMAL(12,2),
    net_amount DECIMAL(12,2),

    -- Status
    status VARCHAR(50) DEFAULT 'calculated',  -- calculated, approved, processed
    approved_by INT REFERENCES users(id),
    approved_at TIMESTAMP,

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(employee_id, month, year)
);
```

### 7.4 Payroll Runs Table

```sql
CREATE TABLE payroll_runs (
    id SERIAL PRIMARY KEY,
    run_id VARCHAR(100) UNIQUE,      -- RUN-2025-12-001
    factory_id INT REFERENCES factories(factory_id),

    month INT,
    year INT,

    status VARCHAR(50) DEFAULT 'in_progress',  -- in_progress, completed, failed
    total_employees INT,
    processed_count INT DEFAULT 0,
    failed_count INT DEFAULT 0,

    gross_total DECIMAL(16,2),
    deductions_total DECIMAL(16,2),
    net_total DECIMAL(16,2),

    started_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    completed_at TIMESTAMP,
    created_by INT REFERENCES users(id)
);
```

---

## 8. JAPANESE LABOR LAW COMPLIANCE

### 8.1 Overtime Calculation

**Japanese Labor Standards Act (労働基準法):**

```
Regular Hours: ≤ 8 hours/day, ≤ 40 hours/week
Overtime (残業): > 8 hours/day or > 40 hours/week
  └─ Rate: 1.25× (base rate × 1.25)

Night Shift (22:00 - 5:00):
  └─ Rate: 1.25× (base rate × 1.25)

Holiday/Sunday Work (休日):
  └─ Rate: 1.35× (base rate × 1.35)

Maximum: 6 months × ≤60 hours overtime/month (average)
```

### 8.2 Legal Compliance Checks

```python
def validate_labor_law_compliance(employee_schedule: List[TimerCard]):
    """Check against Japanese Labor Standards Act"""

    violations = []

    # 1. Check daily hours
    for tc in employee_schedule:
        total_hours = calculate_hours(tc.start_time, tc.end_time)
        if total_hours > 10:  # Most factories allow up to 10h
            violations.append({
                "date": tc.work_date,
                "violation": "excessive_daily_hours",
                "actual": total_hours,
                "max_allowed": 10
            })

    # 2. Check weekly hours
    weekly_hours = sum(
        calculate_hours(tc.start_time, tc.end_time)
        for tc in employee_schedule
        if same_week(tc.work_date)
    )
    if weekly_hours > 56:  # 40 regular + 16 overtime max
        violations.append({
            "week": get_week(employee_schedule[0].work_date),
            "violation": "excessive_weekly_hours",
            "actual": weekly_hours
        })

    # 3. Check consecutive work days (no more than 6)
    consecutive_days = count_consecutive_work_days(employee_schedule)
    if consecutive_days > 6:
        violations.append({
            "violation": "excessive_consecutive_days",
            "actual": consecutive_days,
            "max_allowed": 6
        })

    # 4. Check minimum rest period (11 hours between shifts)
    for i in range(len(employee_schedule) - 1):
        rest_hours = (
            (employee_schedule[i+1].start_time) -
            (employee_schedule[i].end_time)
        ).total_seconds() / 3600

        if rest_hours < 11:
            violations.append({
                "violation": "insufficient_rest",
                "actual_hours": rest_hours,
                "required_hours": 11
            })

    return violations
```

### 8.3 Paid Leave (有給休暇) Integration

**Vacation Days Calculation (Japanese Standard):**

```
Hire Date ────────────────── Service Period → Vacation Days
                ↓
0.5 years (6 months):         0 days
1 year:                       10 days
2-6 years:                    11 days
7-9 years:                    12 days
10+ years:                    20 days
```

---

## 9. API ENDPOINTS REFERENCE

### Payroll Endpoints

| # | Method | Endpoint | Purpose |
|---|--------|----------|---------|
| 1 | POST | `/api/payroll/create-run` | Start monthly payroll calculation |
| 2 | POST | `/api/payroll/calculate-from-timer-cards/{emp_id}` | Calculate for one employee |
| 3 | GET | `/api/payroll/run/{run_id}/status` | Check processing status |
| 4 | GET | `/api/payroll/payslip/{salary_id}` | Generate PDF payslip |
| 5 | GET | `/api/payroll/export-excel` | Export all payslips to Excel |
| 6 | POST | `/api/payroll/approve` | Approve salary calculation |

### Timer Card Endpoints

| # | Method | Endpoint | Purpose |
|---|--------|----------|---------|
| 1 | POST | `/api/timer-cards/` | Create single entry |
| 2 | POST | `/api/timer-cards/upload-batch` | Upload PDF (OCR) |
| 3 | GET | `/api/timer-cards/` | List all cards |
| 4 | GET | `/api/timer-cards/summary` | Monthly summary |
| 5 | PUT | `/api/timer-cards/{id}` | Edit entry |
| 6 | DELETE | `/api/timer-cards/{id}` | Delete entry |

---

## 10. FRONTEND UI FLOW

### Complete Payroll User Journey

```
Dashboard
  ↓
┌────────────────────────────────────────┐
│ Timercards (タイムカード)              │
├────────────────────────────────────────┤
│                                        │
│  [Menu Options]                        │
│  ├─ Daily Entry (日々入力)            │
│  ├─ Batch Upload (一括アップロード)   │
│  ├─ Monthly Summary (月間サマリー)    │
│  └─ Review & Approve (確認・承認)     │
│                                        │
│  [Recent Entries]                      │
│  • 2025-12-15: Tanaka 8.0h            │
│  • 2025-12-14: Tanaka 10.0h (OT+2h)   │
│  • 2025-12-13: Nguyen 8.0h            │
│                                        │
└────────────────────────────────────────┘
  ↓
  [Choose: Daily Entry / Batch Upload]
  ↓
  ├─ Daily Entry Flow
  │  ├─ Select employee & date
  │  ├─ Enter times
  │  └─ Save
  │
  └─ Batch Upload Flow
     ├─ Upload PDF
     ├─ OCR Processing
     ├─ Review Results
     └─ Save to DB
  ↓
┌────────────────────────────────────────┐
│ Payroll (給与計算)                      │
├────────────────────────────────────────┤
│                                        │
│  [Payroll Menu]                        │
│  ├─ Create Monthly Run                │
│  ├─ View Calculations                 │
│  ├─ Generate Payslips                 │
│  ├─ Export to Excel                   │
│  └─ Approve Payroll                   │
│                                        │
│  [Recent Runs]                         │
│  • RUN-2025-12: 150 employees (Done)  │
│  • RUN-2025-11: 150 employees (Done)  │
│                                        │
└────────────────────────────────────────┘
  ↓
  [Start Payroll Run]
  ↓
  Processing...
  ├─ Reading timer cards (150 employees)
  ├─ Applying factory rules
  ├─ Calculating gross pay
  ├─ Computing deductions
  └─ Generating payslips
  ↓
  [Payroll Completed]
  ├─ Total Gross: ¥33,367,500
  ├─ Total Deductions: ¥11,700,000
  └─ Total Net: ¥21,667,500
  ↓
  [View Results]
  ├─ Individual payslip PDF (print/download)
  ├─ Export all payslips (ZIP)
  └─ Export Excel with bank transfer file
```

---

## Summary

**Complete Payroll Workflow:**

1. **Timer Card Collection** (Manual or OCR from PDF)
2. **Factory Rules Application** (Hour validation, shift detection)
3. **Payroll Calculation** (Hours aggregation, rate application, deductions)
4. **Payslip Generation** (PDF per employee)
5. **Salary Processing** (Bulk export, bank file generation)

**Japanese Compliance:**
- Overtime multiplier: 1.25× for hours > 8h or night shift
- Holiday multiplier: 1.35× for Sunday/holiday work
- Minimum rest: 11 hours between shifts
- Maximum consecutive work: 6 days

**Total Processing Time:** ~45 minutes for 150 employees (fully automated)

