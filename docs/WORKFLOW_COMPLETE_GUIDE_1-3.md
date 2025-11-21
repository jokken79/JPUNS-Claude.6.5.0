# 🚀 COMPLETE APPLICATION WORKFLOW GUIDE - PART 1-3
## Housing, Paid Leave & Advanced Workflows (社宅 → 有給休暇 → 申請管理)

**System:** UNS-ClaudeJP 6.0.0
**Date:** 2025-11-17
**Version:** 1.0 - Complete Housing & Advanced Workflows

---

## 📋 TABLE OF CONTENTS

1. [Housing Management System (社宅 / Shataku)](#1-housing-management-system)
2. [Apartment Assignment & Lifecycle](#2-apartment-assignment--lifecycle)
3. [Rent Deduction & Financial Integration](#3-rent-deduction--financial-integration)
4. [Paid Leave System (有給休暇 / Yukyu)](#4-paid-leave-system-yukyuh)
5. [Yukyu Request Workflow](#5-yukyu-request-workflow)
6. [Advanced Request Types](#6-advanced-request-types)
7. [Database Schema](#7-database-schema)
8. [API Endpoints Reference](#8-api-endpoints-reference)
9. [Role-Based Access & Workflows](#9-role-based-access--workflows)
10. [Integration & Reporting](#10-integration--reporting)

---

## 1. HOUSING MANAGEMENT SYSTEM (社宅 / SHATAKU)

### 1.1 Overview

**Purpose:** Manage corporate housing for temporary workers (派遣社員)

```
┌─────────────────────────────────────────────────────────────┐
│             HOUSING SYSTEM ARCHITECTURE                      │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  INVENTORY MANAGEMENT:                                      │
│  ├─ 450+ apartments in database                             │
│  ├─ Capacity per apartment (typically 2-4 people)           │
│  ├─ Base rent per apartment (¥40,000-¥80,000)              │
│  └─ Occupancy status (available / occupied / maintenance)  │
│                                                              │
│  ASSIGNMENT LIFECYCLE:                                      │
│  ├─ Assignment (Employee → Apartment)                       │
│  ├─ Monthly Deduction (Rent deducted from salary)          │
│  ├─ Transfer (Move to different apartment)                 │
│  ├─ Vacancy/Exit (Employee leaves, cleanup charges)        │
│  └─ Archive (Historical record maintained)                 │
│                                                              │
│  FINANCIAL INTEGRATION:                                     │
│  ├─ Prorated rent (per-day calculation on hire)            │
│  ├─ Monthly deductions (auto-deducted from salary)         │
│  ├─ Additional charges (cleaning, repairs, etc.)           │
│  ├─ Transfer adjustments                                   │
│  └─ Exit settlements                                        │
│                                                              │
│  REPORTING:                                                 │
│  ├─ Occupancy rate (how many units occupied)               │
│  ├─ Revenue tracking (total rent collected)                │
│  ├─ Delinquency monitoring                                 │
│  └─ Expense reports (cleaning, maintenance)                │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

### 1.2 Apartment Inventory

**Table:** `apartments`

```sql
CREATE TABLE apartments (
    id SERIAL PRIMARY KEY,
    apartment_code VARCHAR(100) UNIQUE NOT NULL,  -- サンハイツ101
    address TEXT,
    city VARCHAR(255),
    prefecture VARCHAR(255),
    postal_code VARCHAR(10),

    -- Physical characteristics
    capacity INT DEFAULT 2,           -- How many people can live
    square_meters DECIMAL(8,2),      -- Floor area
    room_count INT,                  -- Number of rooms
    bathroom_count INT DEFAULT 1,

    -- Financial
    base_rent DECIMAL(10,2) NOT NULL,  -- Monthly rent ¥
    maintenance_fee DECIMAL(10,2) DEFAULT 0,
    is_pet_allowed BOOLEAN DEFAULT FALSE,

    -- Status
    is_available BOOLEAN DEFAULT TRUE,
    status VARCHAR(50) DEFAULT 'available',  -- available|occupied|maintenance|abandoned
    current_occupants INT DEFAULT 0,

    -- Management
    manager_name VARCHAR(255),
    manager_phone VARCHAR(20),
    contract_start_date DATE,
    contract_end_date DATE,

    -- Metadata
    notes TEXT,
    is_corporate_housing BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    INDEX idx_code (apartment_code),
    INDEX idx_status (status),
    INDEX idx_available (is_available)
);
```

**Real Examples from Database:**

| Apartment Code | Address | Rent | Capacity | Current |
|---|---|---|---|---|
| サンハイツ101 | Tokyo, Meguro | ¥45,000 | 2 | 2 |
| グリーンガーデン205 | Kanagawa, Kawasaki | ¥48,000 | 2 | 1 |
| パークサイド303 | Saitama, Saitama | ¥42,000 | 3 | 3 |
| (450 more apartments...) | ... | ... | ... | ... |

---

## 2. APARTMENT ASSIGNMENT & LIFECYCLE

### 2.1 Employee Assignment at Hire

**Timing:** During NYUUSHA (新社連絡票) approval

**Endpoint:**
```
POST /api/apartments-v2/assign
{
    "employee_id": 456,
    "apartment_id": 123,
    "assignment_date": "2025-12-01",
    "expected_exit_date": "2026-12-01"  # Optional (contract end)
}

Response:
{
    "assignment_id": 789,
    "employee_id": 456,
    "apartment_id": 123,
    "apartment_code": "サンハイツ101",
    "assignment_date": "2025-12-01",
    "status": "active",
    "prorated_rent": ¥50000,  # First month (partial)
    "regular_rent": ¥45000,   # Subsequent months
}
```

**Database Changes:**

```sql
-- Create ApartmentAssignment
INSERT INTO apartment_assignments (
    employee_id, apartment_id,
    assignment_date, status,
    created_at
) VALUES (
    456, 123,
    '2025-12-01', 'active',
    CURRENT_TIMESTAMP
);

-- Update Apartment occupancy
UPDATE apartments
SET current_occupants = current_occupants + 1,
    is_available = (current_occupants + 1 < capacity)
WHERE id = 123;

-- Create first rent deduction (prorated)
INSERT INTO rent_deductions (
    employee_id, apartment_id,
    deduction_date, amount,
    status, payment_period
) VALUES (
    456, 123,
    '2025-12-01',  -- First day of next month
    50000,         -- Prorated rent
    'pending',
    '2025-12'
);
```

### 2.2 Prorated Rent Calculation

**Logic:** Days actually lived in apartment × (daily rate)

```python
def calculate_prorated_rent(
    base_monthly_rent: float,
    hire_date: date,
    apartment_assignment_date: date = None
) -> float:
    """
    Calculate prorated rent for partial month
    Used when: Employee assigned mid-month or mid-period
    """

    if apartment_assignment_date is None:
        apartment_assignment_date = hire_date

    # Get last day of month
    if apartment_assignment_date.month == 12:
        first_of_next_month = date(
            apartment_assignment_date.year + 1, 1, 1
        )
    else:
        first_of_next_month = date(
            apartment_assignment_date.year,
            apartment_assignment_date.month + 1,
            1
        )

    last_day_of_month = first_of_next_month - timedelta(days=1)

    # Days lived this month
    days_lived = (
        last_day_of_month - apartment_assignment_date
    ).days + 1

    # Days in month
    days_in_month = last_day_of_month.day

    # Daily rate
    daily_rate = base_monthly_rent / days_in_month

    # Prorated amount
    prorated_rent = daily_rate * days_lived

    return prorated_rent

# Example:
# Hire: Dec 10, 2025 (base rent ¥45,000)
# Days in Dec: 31
# Days lived: Dec 10-31 = 22 days
# Daily rate: ¥45,000 / 31 = ¥1,451.61/day
# Prorated: ¥1,451.61 × 22 = ¥31,935.48 ≈ ¥32,000
```

### 2.3 Transfer Between Apartments

**Scenario:** Employee moves to different apartment

**Endpoint:**
```
POST /api/apartments-v2/transfer
{
    "assignment_id": 789,          # Current assignment
    "new_apartment_id": 124,       # Target apartment
    "transfer_date": "2025-12-15", # When to move
    "transfer_reason": "Upgrade to larger unit"
}

Response:
{
    "old_assignment": {..., "status": "transferred"},
    "new_assignment": {..., "status": "active"},
    "adjustments": {
        "old_apartment_refund": ¥15000,  # For remaining days
        "new_apartment_charge": ¥16000,  # For new rent (prorated)
        "net_adjustment": ¥1000          # Transfer fee
    }
}
```

**Processing:**

```python
async def transfer_apartment_assignment(
    assignment_id: int,
    new_apartment_id: int,
    transfer_date: date
):
    """Transfer employee to different apartment"""

    # 1. Get current assignment
    old_assignment = db.query(ApartmentAssignment).filter_by(
        id=assignment_id
    ).first()

    # 2. Calculate refund for old apartment
    # (remaining days of month × daily rate)
    refund_amount = calculate_refund(
        old_assignment.apartment.base_rent,
        transfer_date
    )

    # 3. Mark old assignment as transferred
    old_assignment.status = "transferred"
    old_assignment.exit_date = transfer_date

    # 4. Adjust old apartment occupancy
    update_occupancy(old_assignment.apartment_id, -1)

    # 5. Create rent credit for old apartment
    # (Deduction: negative amount means credit/refund)
    credit = RentDeduction(
        employee_id=old_assignment.employee_id,
        apartment_id=old_assignment.apartment_id,
        deduction_date=transfer_date,
        amount=-refund_amount,  # Negative = credit
        status="applied",
        payment_period=transfer_date.strftime("%Y-%m"),
        reason="transfer_refund"
    )
    db.add(credit)

    # 6. Create new assignment
    new_assignment = ApartmentAssignment(
        employee_id=old_assignment.employee_id,
        apartment_id=new_apartment_id,
        assignment_date=transfer_date,
        status="active"
    )
    db.add(new_assignment)

    # 7. Calculate prorated rent for new apartment
    new_apartment = db.query(Apartment).filter_by(
        id=new_apartment_id
    ).first()

    prorated_rent = calculate_prorated_rent(
        new_apartment.base_rent,
        transfer_date
    )

    # 8. Create rent deduction for new apartment
    new_deduction = RentDeduction(
        employee_id=old_assignment.employee_id,
        apartment_id=new_apartment_id,
        deduction_date=transfer_date,
        amount=prorated_rent,
        status="pending",
        payment_period=transfer_date.strftime("%Y-%m")
    )
    db.add(new_deduction)

    # 9. Update new apartment occupancy
    update_occupancy(new_apartment_id, +1)

    # 10. Commit all changes
    db.commit()

    return {
        "old_assignment": old_assignment,
        "new_assignment": new_assignment,
        "refund": refund_amount,
        "new_rent": prorated_rent
    }
```

### 2.4 Apartment Exit & Settlement

**Scenario:** Employee leaves company, exits apartment

**Endpoint:**
```
POST /api/apartments-v2/exit
{
    "assignment_id": 789,
    "exit_date": "2025-12-31",
    "exit_reason": "contract_end",
    "cleaning_charges": 5000,        # Optional
    "damage_charges": 0,             # Optional
    "final_notes": "Standard condition"
}

Response:
{
    "assignment": {..., "status": "vacated"},
    "final_deduction": ¥45000,       # Last rent
    "adjustments": {
        "cleaning_charge": ¥5000,
        "damage_charge": ¥0,
        "utility_bills": ¥0
    },
    "net_settlement": ¥50000         # Total charge
}
```

### 2.5 Assignment Status Lifecycle

```
┌──────────────────────────────────────────────────────┐
│            APARTMENT ASSIGNMENT LIFECYCLE            │
├──────────────────────────────────────────────────────┤
│                                                      │
│  active                                              │
│    ├─ Created on hire date                          │
│    ├─ Rent deducted monthly                         │
│    ├─ Can transfer to another apartment             │
│    └─ Duration: Hire date → Exit date               │
│                                                      │
│  transferred                                         │
│    ├─ Marked when employee moves                    │
│    ├─ Final rent calculated (prorated)              │
│    ├─ Refund/credit issued                          │
│    └─ New assignment created                        │
│                                                      │
│  vacated                                             │
│    ├─ Marked on exit date                           │
│    ├─ Cleaning/damage charges applied               │
│    ├─ Final settlement calculated                   │
│    └─ Archive kept for records                      │
│                                                      │
│  archived                                            │
│    └─ Historical record (no active deductions)      │
│                                                      │
└──────────────────────────────────────────────────────┘
```

---

## 3. RENT DEDUCTION & FINANCIAL INTEGRATION

### 3.1 Automatic Monthly Deductions

**Timing:** Deductions created at end of month, deducted from next month's salary

**Process:**

```python
# Scheduled job: Runs on 25th of each month
async def create_monthly_rent_deductions():
    """
    For all active apartment assignments:
    Create rent deduction for next month
    """

    # Get all active assignments
    active_assignments = db.query(ApartmentAssignment).filter_by(
        status="active"
    ).all()

    next_month = date.today() + relativedelta(months=1)

    for assignment in active_assignments:
        apartment = assignment.apartment
        employee_id = assignment.employee_id

        # Create deduction for next month
        deduction = RentDeduction(
            employee_id=employee_id,
            apartment_id=apartment.id,
            deduction_date=date(next_month.year, next_month.month, 1),
            amount=apartment.base_rent,  # Full month rent
            status="pending",
            payment_period=next_month.strftime("%Y-%m"),
            reason="monthly_rent"
        )
        db.add(deduction)

    db.commit()
    logger.info(f"Created {len(active_assignments)} rent deductions")
```

### 3.2 Rent Deduction Table

```sql
CREATE TABLE rent_deductions (
    id SERIAL PRIMARY KEY,
    employee_id INT NOT NULL REFERENCES employees(id),
    apartment_id INT NOT NULL REFERENCES apartments(id),

    -- Financial
    deduction_date DATE,             -- When deducted
    amount DECIMAL(10,2),            -- Rent amount
    payment_period VARCHAR(7),       -- "2025-12"

    -- Status
    status VARCHAR(50) DEFAULT 'pending',
    -- pending: Waiting for salary run
    -- applied: Deducted from salary
    -- paid: Paid/settled
    -- adjusted: Modified (credit/refund)

    -- Details
    reason VARCHAR(255),             -- monthly_rent, cleaning, transfer_refund
    notes TEXT,

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(employee_id, apartment_id, deduction_date),
    INDEX idx_employee_month (employee_id, payment_period),
    INDEX idx_status (status)
);
```

### 3.3 Integration with Payroll

**During Salary Calculation:**

```python
# In backend/app/services/payroll_service.py
async def calculate_employee_payroll(...):
    # ... existing code ...

    # Get rent deductions for this month
    rent_deductions = db.query(RentDeduction).filter(
        RentDeduction.employee_id == employee_id,
        RentDeduction.payment_period == f"{year}-{month:02d}"
    ).all()

    # Sum apartment deductions
    apartment_rent_total = sum(d.amount for d in rent_deductions)

    # Add to total deductions
    deductions["apartment_rent"] = apartment_rent_total

    # Update status to "applied"
    for deduction in rent_deductions:
        deduction.status = "applied"

    # Net pay calculation
    net_amount = gross_amount - total_deductions  # Includes rent!
```

---

## 4. PAID LEAVE SYSTEM (有給休暇 / YUKYU)

### 4.1 Yukyu Overview

**Definition:** Paid vacation days provided to employees per Japanese labor law

```
┌─────────────────────────────────────────────────────────────┐
│            PAID LEAVE (有給休暇) SYSTEM OVERVIEW            │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  ACCRUAL SCHEDULE (Japanese Labor Standard):                │
│  ├─ 6 months: 10 days                                       │
│  ├─ 1 year: 10 days                                         │
│  ├─ 1.5 years: 11 days                                      │
│  ├─ 2.5 years: 12 days                                      │
│  ├─ 3.5 years: 14 days                                      │
│  ├─ 4.5 years: 16 days                                      │
│  ├─ 5.5 years: 18 days                                      │
│  ├─ 6.5+ years: 20 days                                     │
│  └─ Maximum carry-over: 40 days (2 years × 20 days)       │
│                                                              │
│  WORKFLOW:                                                  │
│  ├─ Employee accrues days automatically                     │
│  ├─ TANTOSHA (staff) requests vacation                      │
│  ├─ KEITOSAN (accounting) approves                          │
│  ├─ Days deducted from balance (LIFO: newest first)        │
│  └─ Records maintained for 2 years                          │
│                                                              │
│  ANNUAL RESET:                                              │
│  ├─ Occurs on hire date anniversary                         │
│  ├─ Unused days > 2 years expires                           │
│  ├─ New allotment based on service time                     │
│  └─ Carry-over capped at 40 days max                       │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

### 4.2 Yukyu Balance Calculation

**Endpoint:**
```
POST /api/yukyu/balances/calculate
{
    "employee_id": 456
}

Response:
{
    "employee_id": 456,
    "employee_name": "Tanaka Taro",
    "hire_date": "2024-12-01",
    "service_months": 12.5,
    "status": "just_crossed_1_year",

    "balances": {
        "current": 10,  # Available now
        "pending": 0,   # Will accrue in future
        "total": 10
    },

    "breakdown": [
        {
            "accrual_date": "2024-12-01",
            "accrual_amount": 10,
            "expiry_date": "2026-12-01",
            "status": "active",
            "used": 0,
            "remaining": 10
        }
    ],

    "annual_reset_schedule": {
        "next_reset_date": "2025-12-01",
        "next_accrual": 11,  # 1.5 years = 11 days
        "expires_balance": 0   # Nothing expires yet
    }
}
```

**Backend Logic:**

```python
def calculate_yukyu_balance(employee_id: int) -> YukyuBalance:
    """
    Calculate yukyu balance based on:
    1. Hire date + service period
    2. Annual accrual schedule
    3. Used/approved requests (LIFO: newest first)
    4. Expiry (2 years)
    """

    employee = db.query(Employee).filter_by(id=employee_id).first()
    hire_date = employee.hire_date

    today = date.today()
    service_days = (today - hire_date).days
    service_months = service_days / 30.44  # Average month

    # Determine applicable accrual schedule
    accrual_schedule = get_accrual_schedule(service_months)

    # Get all yukyu accrual records
    accruals = db.query(YukyuBalance).filter_by(
        employee_id=employee_id,
        status="active"
    ).order_by(YukyuBalance.accrual_date.desc()).all()  # Newest first!

    # Get all used/approved requests
    used_requests = db.query(YukyuRequest).filter(
        YukyuRequest.employee_id == employee_id,
        YukyuRequest.status.in_(["approved", "used"])
    ).order_by(YukyuRequest.request_date.desc()).all()  # LIFO

    # Calculate remaining balance
    total_available = sum(a.accrual_amount for a in accruals)
    total_used = sum(r.days_requested for r in used_requests)
    total_remaining = total_available - total_used

    # Check for expiring balances
    expiring = []
    for accrual in accruals:
        expiry_date = accrual.accrual_date + timedelta(days=365*2)
        if expiry_date < today:
            expiring.append(accrual)

    return YukyuBalance(
        employee_id=employee_id,
        total_accrued=total_available,
        total_used=total_used,
        remaining=total_remaining,
        accrual_details=accruals,
        used_details=used_requests,
        expiring_soon=expiring
    )
```

---

## 5. YUKYU REQUEST WORKFLOW

### 5.1 Employee Request Creation

**Location:** Frontend: `app/(dashboard)/yukyu/requests/new/page.tsx`

```
┌──────────────────────────────────────────────────────────┐
│  有給休暇申請 (Yukyu Request)                            │
├──────────────────────────────────────────────────────────┤
│                                                          │
│  Current Balance:                                        │
│  ├─ Available: 10 days                                  │
│  ├─ Pending Approval: 3 days                            │
│  └─ Total: 13 days                                      │
│                                                          │
│  Request Details:                                        │
│                                                          │
│  Request Type: *                                        │
│  ○ 有給 (Full day)                                      │
│  ○ 半休午前 (Half day - AM)                             │
│  ○ 半休午後 (Half day - PM)                             │
│                                                          │
│  Start Date: *                                          │
│  ┌──────────────┐                                       │
│  │ 2025-12-15   │                                       │
│  └──────────────┘                                       │
│                                                          │
│  End Date (if multi-day): *                             │
│  ┌──────────────┐                                       │
│  │ 2025-12-17   │ (3 days total)                        │
│  └──────────────┘                                       │
│                                                          │
│  Days Requested: 3 days                                 │
│  Total With This Request: 6 days used                   │
│  Remaining After: 7 days                                │
│                                                          │
│  Reason: (optional)                                     │
│  ┌──────────────────────────────────────┐               │
│  │ Doctor appointment, medical leave    │               │
│  └──────────────────────────────────────┘               │
│                                                          │
│  ┌──────────────┐ ┌──────────────────┐                 │
│  │ 下書き保存  │ │ 申請            │                 │
│  │ (Draft)    │ │ (Submit)        │                 │
│  └──────────────┘ └──────────────────┘                 │
│                                                          │
└──────────────────────────────────────────────────────────┘
```

**API Endpoint:**
```
POST /api/yukyu/requests/
{
    "employee_id": 456,
    "request_type": "full_day",      # full_day|half_am|half_pm
    "start_date": "2025-12-15",
    "end_date": "2025-12-17",
    "days_requested": 3,
    "reason": "Medical appointment",
    "notes": "Doctor appointment, back by evening"
}

Response:
{
    "request_id": 890,
    "employee_id": 456,
    "status": "pending",  # Waiting for approval
    "days_requested": 3,
    "created_at": "2025-11-17T10:30:00Z",
    "next_step": "Awaiting KEITOSAN approval"
}
```

### 5.2 KEITOSAN Approval Workflow

**Role:** KEITOSAN (経理 / Accounting) - Only this role can approve

**Location:** Frontend: `app/(dashboard)/yukyu/approvals/page.tsx`

```
┌──────────────────────────────────────────────────────────┐
│  有給休暇承認 (Yukyu Approvals)                          │
│  KEITOSAN管理画面 (Accounting Manager Dashboard)        │
├──────────────────────────────────────────────────────────┤
│                                                          │
│  Filter:                                                │
│  [Status: All ▼] [Factory: All ▼] [Period: This Month] │
│                                                          │
│  Pending Approvals (15):                                │
│  ┌──────────────────────────────────────────────────────┐ │
│  │ Request #890                                         │ │
│  ├──────────────────────────────────────────────────────┤ │
│  │ Employee: 田中太郎 (Tanaka Taro)                    │ │
│  │ ID: E-2025-001                                      │ │
│  │ Factory: 高雄工業_本社工場                           │ │
│  │                                                      │ │
│  │ Request Details:                                    │ │
│  │ ├─ Type: 有給 (Full day)                            │ │
│  │ ├─ Date: 2025-12-15 ~ 2025-12-17 (3 days)         │ │
│  │ ├─ Reason: Medical appointment                     │ │
│  │ └─ Current Balance: 10 days                         │ │
│  │                                                      │ │
│  │ [📋 View Details] [✅ Approve] [❌ Reject]          │ │
│  └──────────────────────────────────────────────────────┘ │
│                                                          │
│  ┌──────────────────────────────────────────────────────┐ │
│  │ Request #891                                         │ │
│  ├──────────────────────────────────────────────────────┤ │
│  │ Employee: グエン　バン　A (Nguyen Van A)            │ │
│  │ ... more requests ...                                │ │
│  └──────────────────────────────────────────────────────┘ │
│                                                          │
│  [Bulk Actions]                                         │
│  ☑ Select all                                           │
│  [✅ Approve Selected] [❌ Reject Selected]             │
│                                                          │
└──────────────────────────────────────────────────────────┘
```

**Approval Endpoint:**
```
PUT /api/yukyu/requests/{request_id}/approve
{
    "approved": true,
    "approver_notes": "Approved - doctor's note provided"
}

Response:
{
    "request_id": 890,
    "status": "approved",
    "approved_by": 100,  # KEITOSAN user ID
    "approved_at": "2025-11-17T14:30:00Z",
    "days_deducted": 3,
    "balance_after": 7
}
```

### 5.3 LIFO (Last-In-First-Out) Deduction

**Rule:** Newest yukyu days are used first

```python
def deduct_yukyu_days(
    employee_id: int,
    days_to_deduct: int
) -> DeductionResult:
    """
    Use LIFO logic: Deduct from newest accrual first
    (Last-In-First-Out)
    """

    # Get all active yukyu accruals, ordered by newest first
    accruals = db.query(YukyuBalance).filter(
        YukyuBalance.employee_id == employee_id,
        YukyuBalance.status == "active"
    ).order_by(
        YukyuBalance.accrual_date.desc()  # ← NEWEST FIRST!
    ).all()

    deductions = []
    remaining_to_deduct = days_to_deduct

    for accrual in accruals:
        if remaining_to_deduct == 0:
            break

        available = accrual.remaining  # Days not yet used

        if available >= remaining_to_deduct:
            # This accrual has enough days
            deduct_amount = remaining_to_deduct
            accrual.used += deduct_amount
            remaining_to_deduct = 0
        else:
            # Use all available from this accrual
            deduct_amount = available
            accrual.used = accrual.accrual_amount
            remaining_to_deduct -= deduct_amount

        deductions.append({
            "accrual_id": accrual.id,
            "accrual_date": accrual.accrual_date,
            "days_deducted": deduct_amount,
            "expiry_date": accrual.accrual_date + timedelta(days=730)
        })

    if remaining_to_deduct > 0:
        raise InsufficientYukyuError(f"Not enough days. Need {remaining_to_deduct} more")

    return DeductionResult(
        total_deducted=days_to_deduct,
        deductions=deductions  # Detail which accruals were used
    )
```

**Example:**

```
Employee has 3 yukyu accruals:
┌─────────────────────────────────────────┐
│ Accrual #1 (Dec 2023): 10 days          │
│ ├─ Used: 5 days                         │
│ ├─ Remaining: 5 days                    │
│ └─ Expires: Dec 2025 (IN 6 MONTHS!)    │
│                                         │
│ Accrual #2 (Dec 2024): 10 days          │
│ ├─ Used: 2 days                         │
│ ├─ Remaining: 8 days                    │
│ └─ Expires: Dec 2026                    │
│                                         │
│ Accrual #3 (Dec 2025): 11 days          │
│ ├─ Used: 0 days                         │
│ ├─ Remaining: 11 days                   │
│ └─ Expires: Dec 2027                    │
└─────────────────────────────────────────┘

TANTOSHA requests 3 days off:

LIFO Deduction (Newest First):
1. Deduct from Accrual #3 (Dec 2025): 3 days
   └─ Remaining: 8 days

Result: Only Accrual #1 (Dec 2023) is at risk of expiring!
```

---

## 6. ADVANCED REQUEST TYPES

### 6.1 Request Types Overview

**Table:** `requests` (multiple types)

| Type | Japanese | Description | Approval Flow |
|---|---|---|---|
| YUKYU | 有給休暇 | Paid vacation | TANTOSHA → KEITOSAN |
| HANKYU | 半休 | Half day | TANTOSHA → KEITOSAN |
| IKKIKOKOKU | 一時帰国 | Temporary return to home country | TANTOSHA → KEITOSAN → ADMIN |
| TAISHA | 退社 | Resignation | EMPLOYEE → ADMIN |
| NYUUSHA | 入社連絡票 | New hire notification | CANDIDATE → KEITOSAN |

### 6.2 Temporary Return (一時帰国)

**For:** Foreign workers returning home temporarily (family visit, renewal, etc.)

```
POST /api/requests/ (type=ikkikokoku)
{
    "employee_id": 456,
    "request_type": "ikkikokoku",
    "leave_date": "2025-12-20",
    "return_date": "2025-12-31",
    "reason": "Family visit",
    "days_duration": 11,
    "notes": "Will renew visa while in home country"
}

Approval Chain:
1. TANTOSHA (Staff) - Can request on behalf of employee
2. KEITOSAN (Accounting) - Approves payroll impact
3. ADMIN - Final approval (may affect contract)
```

### 6.3 Resignation (退社)

**For:** Employee formally resigning from company

```
POST /api/requests/ (type=taisha)
{
    "employee_id": 456,
    "request_type": "taisha",
    "resignation_date": "2025-12-31",
    "reason": "Returning to home country",
    "notice_days": 30,
    "final_day_worked": "2025-12-31",
    "settlement_details": {
        "final_payment_date": "2026-01-15",
        "apartment_exit_date": "2025-12-31",
        "visa_surrender_date": "2026-01-05"
    }
}

Actions:
1. Request submitted by ADMIN
2. Final salary calculated
3. Apartment assignment terminated
4. Resignation recorded
5. Employee status: "inactive"
```

---

## 7. DATABASE SCHEMA

### 7.1 Apartment Tables

```sql
CREATE TABLE apartments (
    id SERIAL PRIMARY KEY,
    apartment_code VARCHAR(100) UNIQUE NOT NULL,
    address TEXT,
    base_rent DECIMAL(10,2),
    capacity INT,
    current_occupants INT DEFAULT 0,
    is_available BOOLEAN DEFAULT TRUE,
    status VARCHAR(50),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE apartment_assignments (
    id SERIAL PRIMARY KEY,
    employee_id INT REFERENCES employees(id),
    apartment_id INT REFERENCES apartments(id),
    assignment_date DATE,
    exit_date DATE,
    status VARCHAR(50),  -- active|transferred|vacated
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(employee_id, apartment_id, assignment_date)
);

CREATE TABLE rent_deductions (
    id SERIAL PRIMARY KEY,
    employee_id INT REFERENCES employees(id),
    apartment_id INT REFERENCES apartments(id),
    deduction_date DATE,
    amount DECIMAL(10,2),
    payment_period VARCHAR(7),  -- "2025-12"
    status VARCHAR(50),  -- pending|applied|paid
    reason VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### 7.2 Yukyu Tables

```sql
CREATE TABLE yukyu_balances (
    id SERIAL PRIMARY KEY,
    employee_id INT REFERENCES employees(id),
    accrual_date DATE,
    accrual_amount INT,  -- Days
    used INT DEFAULT 0,
    expiry_date DATE,
    status VARCHAR(50),  -- active|expired
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE yukyu_requests (
    id SERIAL PRIMARY KEY,
    employee_id INT REFERENCES employees(id),
    request_type VARCHAR(50),  -- full_day|half_am|half_pm
    start_date DATE,
    end_date DATE,
    days_requested INT,
    reason TEXT,
    status VARCHAR(50),  -- pending|approved|rejected|used
    approved_by INT REFERENCES users(id),
    approved_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

---

## 8. API ENDPOINTS REFERENCE

### Housing (Apartment) Endpoints

| # | Method | Endpoint | Purpose |
|---|--------|----------|---------|
| 1 | GET | `/api/apartments-v2/` | List all apartments |
| 2 | POST | `/api/apartments-v2/assign` | Assign employee to apartment |
| 3 | POST | `/api/apartments-v2/transfer` | Transfer between apartments |
| 4 | POST | `/api/apartments-v2/exit` | Process apartment exit |
| 5 | GET | `/api/apartments-v2/{id}` | View apartment details |
| 6 | GET | `/api/apartments-v2/occupancy-report` | Occupancy statistics |
| 7 | GET | `/api/apartments-v2/revenue-report` | Revenue tracking |

### Yukyu (Paid Leave) Endpoints

| # | Method | Endpoint | Purpose |
|---|--------|----------|---------|
| 1 | POST | `/api/yukyu/balances/calculate` | Calculate employee balance |
| 2 | GET | `/api/yukyu/balances/{employee_id}` | Get balance details |
| 3 | POST | `/api/yukyu/requests/` | Create request |
| 4 | GET | `/api/yukyu/requests/` | List requests |
| 5 | PUT | `/api/yukyu/requests/{id}/approve` | Approve request |
| 6 | PUT | `/api/yukyu/requests/{id}/reject` | Reject request |
| 7 | GET | `/api/yukyu/usage-history/{employee_id}` | View usage history |
| 8 | GET | `/api/yukyu/reports/export-excel` | Export to Excel |

---

## 9. ROLE-BASED ACCESS & WORKFLOWS

### Role Hierarchy

```
SUPER_ADMIN (最高権限)
  ├─ Can: Create/delete users, modify all roles
  └─ Access: All features

ADMIN (管理者)
  ├─ Can: Manage employees, factories, apartments
  ├─ Approve IKKIKOKOKU, TAISHA requests
  └─ Access: All features except user management

COORDINATOR (調整者)
  ├─ Can: Create candidates, approve evaluations
  ├─ Create NYUUSHA requests
  └─ Access: Candidates, employees, factories

KEITOSAN (経理 / Accounting) ⭐ KEY ROLE
  ├─ Can: Approve YUKYU, HANKYU, IKKIKOKOKU requests
  ├─ Create/finalize payroll
  ├─ Manage rent deductions
  └─ Access: All approval workflows, financial reports

TANTOSHA (担当者 / Staff) ⭐ KEY ROLE
  ├─ Can: Create YUKYU/HANKYU/IKKIKOKOKU requests
  ├─ Submit timecard entries
  ├─ Request employee changes
  └─ Access: Employee data, request creation

EMPLOYEE (従業員)
  ├─ Can: View own balance, request vacation
  ├─ Submit TAISHA resignation
  └─ Access: Own data, vacation system

CONTRACT_WORKER (契約社員)
  └─ Limited access, no request creation
```

### YUKYU Approval Workflow by Role

```
┌─────────────────────────────────────────────────────┐
│          YUKYU REQUEST APPROVAL CHAIN              │
├─────────────────────────────────────────────────────┤
│                                                     │
│  TANTOSHA Creates Request                           │
│  ├─ Fills in dates, reason                         │
│  └─ Submits: POST /api/yukyu/requests/             │
│                ↓                                    │
│  Request Status: "pending"                          │
│  ├─ Dashboard shows: Awaiting KEITOSAN approval    │
│  └─ Notification sent to KEITOSAN                  │
│                ↓                                    │
│  KEITOSAN Receives Notification                    │
│  ├─ Reviews in /yukyu/approvals                    │
│  ├─ Checks:                                        │
│  │  ├─ Sufficient balance?                         │
│  │  ├─ Date conflict with others?                  │
│  │  ├─ Payroll impact?                             │
│  │  └─ Valid reason?                               │
│  ├─ Approves: PUT /api/yukyu/requests/{id}/approve│
│  │  └─ Days auto-deducted (LIFO)                  │
│  └─ OR Rejects with reason                         │
│                ↓                                    │
│  Request Status: "approved" or "rejected"          │
│  ├─ Notification sent to requester                 │
│  ├─ If approved: Days reserved on calendar         │
│  ├─ If rejected: Can edit & resubmit              │
│  └─ History maintained for audit                   │
│                                                     │
└─────────────────────────────────────────────────────┘
```

---

## 10. INTEGRATION & REPORTING

### 10.1 Monthly Reporting Dashboard

**Location:** Frontend: `app/(dashboard)/reports/monthly/page.tsx`

```
┌──────────────────────────────────────────────────────┐
│  月間レポート (Monthly Report)                       │
│  December 2025                                       │
├──────────────────────────────────────────────────────┤
│                                                      │
│  APARTMENT SUMMARY:                                 │
│  ├─ Total Units: 450                                │
│  ├─ Occupied: 387 (86%)                             │
│  ├─ Available: 63 (14%)                             │
│  ├─ Maintenance: 5 (1%)                             │
│  └─ Total Monthly Revenue: ¥17,415,000             │
│                                                      │
│  YUKYU SUMMARY:                                     │
│  ├─ Approvals This Month: 47                        │
│  │  ├─ Full days: 35                                │
│  │  ├─ Half days: 12                                │
│  │  └─ Avg days per employee: 3.1                   │
│  │                                                   │
│  ├─ Expiring Soon (< 3 months):                     │
│  │  └─ 23 employees with 40+ days at risk          │
│  │                                                   │
│  └─ Approval Rate: 98% (2 rejections)              │
│                                                      │
│  PAYROLL SUMMARY:                                   │
│  ├─ Employees Processed: 150                        │
│  ├─ Total Gross: ¥33,367,500                       │
│  ├─ Total Deductions: ¥11,700,000                  │
│  │  ├─ Apartment Rent: ¥6,750,000                  │
│  │  ├─ Insurance: ¥2,340,000                       │
│  │  ├─ Tax: ¥1,610,000                             │
│  │  └─ Other: ¥1,000,000                           │
│  └─ Total Net: ¥21,667,500                         │
│                                                      │
│  [Export Excel] [PDF Report] [Email]                │
│                                                      │
└──────────────────────────────────────────────────────┘
```

### 10.2 Integration Points

```
┌────────────────────────────────────────────────────┐
│          SYSTEM INTEGRATION POINTS                │
├────────────────────────────────────────────────────┤
│                                                    │
│  Candidates → Employees                           │
│  ├─ Link via rirekisho_id                         │
│  └─ Auto-assignment to apartment (if available)   │
│                                                    │
│  Employees → Apartment Assignments                │
│  ├─ Assigned at hire (NYUUSHA approval)          │
│  ├─ Transfer via UI                              │
│  └─ Exit on resignation                          │
│                                                    │
│  Apartment Assignments → Rent Deductions          │
│  ├─ Monthly deductions auto-generated            │
│  ├─ Integrated into payroll calculation          │
│  └─ Visible in payslips                          │
│                                                    │
│  Yukyu Requests → Salary Impact                   │
│  ├─ No direct impact (employee paid for vacation)│
│  ├─ Days tracked separately from payroll         │
│  └─ Used for scheduling/capacity planning        │
│                                                    │
│  Timer Cards → Payroll → Deductions               │
│  └─ Net = Gross - Apartment - Insurance - Tax    │
│                                                    │
└────────────────────────────────────────────────────┘
```

---

## Summary

**Complete Advanced Workflow Coverage:**

### Housing (社宅)
1. **Assignment** - Employee hired → Assigned apartment
2. **Rent Deduction** - Auto-deducted monthly from salary
3. **Transfer** - Move to different apartment with prorated adjustment
4. **Exit** - Leave with cleanup charges and settlement

### Yukyu (有給休暇)
1. **Accrual** - Automatic based on service time
2. **Request** - TANTOSHA submits request
3. **Approval** - KEITOSAN reviews and approves
4. **Deduction** - LIFO logic (newest days first)
5. **Expiry** - 2-year limit, annual reset

### Other Requests
1. **IKKIKOKOKU** - Temporary return (TANTOSHA → KEITOSAN → ADMIN)
2. **TAISHA** - Resignation (EMPLOYEE → ADMIN)
3. **NYUUSHA** - New hire (COORDINATOR → KEITOSAN)

**Key Metrics:**
- 450+ apartments managed
- 20 day yukyu at 6+ years service
- LIFO deduction algorithm
- 2-year expiry window
- Automatic monthly rent integration with payroll

