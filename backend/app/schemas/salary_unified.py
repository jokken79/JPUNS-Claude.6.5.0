"""
Unified Salary Schema - Consolidated payroll and salary calculations

This module consolidates and improves upon:
- backend/app/schemas/salary.py (108 lines) - Basic salary calculations
- backend/app/schemas/payroll.py (309 lines) - Detailed payroll processing

Purpose:
--------
Provides a comprehensive, type-safe schema system for all salary and payroll
operations in the UNS-ClaudeJP HR management system.

Features:
---------
- Complete salary calculation models with detailed breakdowns
- Request/Response patterns for all salary operations
- Helper models for hours, rates, deductions, and amounts
- Bulk calculation support for payroll processing
- Validation helpers and error handling
- Statistics and reporting schemas
- Payslip generation schemas
- Full Pydantic validation with examples

Usage Example:
--------------
```python
from app.schemas.salary_unified import (
    SalaryCalculateRequest,
    SalaryCalculationResponse
)

# Calculate individual salary
request = SalaryCalculateRequest(
    employee_id=123,
    month=10,
    year=2025,
    use_timer_cards=True
)

# Response will include complete breakdown
response = SalaryCalculationResponse(
    employee_id=123,
    gross_salary=350000,
    net_salary=280000,
    # ... full details
)
```

Version: 5.4.1
Author: UNS-ClaudeJP Development Team
"""

from typing import List, Optional, Dict, Any
from pydantic import BaseModel, Field, field_validator, ConfigDict
from decimal import Decimal
from datetime import datetime
from enum import Enum


# ============================================================================
# ENUMS - Status Types
# ============================================================================


class SalaryStatus(str, Enum):
    """Salary calculation status"""
    DRAFT = "draft"
    CALCULATED = "calculated"
    VALIDATED = "validated"
    APPROVED = "approved"
    PAID = "paid"
    CANCELLED = "cancelled"


class PayrollRunStatus(str, Enum):
    """Payroll run status"""
    DRAFT = "draft"
    PROCESSING = "processing"
    COMPLETED = "completed"
    APPROVED = "approved"
    FAILED = "failed"


# ============================================================================
# HELPER MODELS - Building Blocks
# ============================================================================


class HoursBreakdown(BaseModel):
    """
    Detailed breakdown of work hours by type.

    Used to separate different types of hours worked which may have
    different pay rates applied (regular, overtime, night shift, etc.)
    """
    regular_hours: float = Field(
        default=0.0,
        ge=0,
        le=744,  # Max hours in a month (31 days * 24 hours)
        description="Standard work hours"
    )
    overtime_hours: float = Field(
        default=0.0,
        ge=0,
        description="Overtime hours (超過勤務)"
    )
    night_hours: float = Field(
        default=0.0,
        ge=0,
        description="Night shift hours (22:00-05:00)"
    )
    holiday_hours: float = Field(
        default=0.0,
        ge=0,
        description="Holiday work hours"
    )
    sunday_hours: float = Field(
        default=0.0,
        ge=0,
        description="Sunday work hours"
    )
    total_hours: float = Field(
        default=0.0,
        ge=0,
        description="Total hours worked"
    )
    work_days: int = Field(
        default=0,
        ge=0,
        le=31,
        description="Number of days worked"
    )

    model_config = ConfigDict(
        json_schema_extra={
            "example": {
                "regular_hours": 160.0,
                "overtime_hours": 20.0,
                "night_hours": 15.0,
                "holiday_hours": 8.0,
                "sunday_hours": 8.0,
                "total_hours": 211.0,
                "work_days": 22
            }
        }
    )

    @field_validator('total_hours')
    @classmethod
    def validate_total_hours(cls, v, info):
        """Ensure total_hours matches sum of individual hour types"""
        if info.data:
            calculated_total = (
                info.data.get('regular_hours', 0) +
                info.data.get('overtime_hours', 0) +
                info.data.get('night_hours', 0) +
                info.data.get('holiday_hours', 0) +
                info.data.get('sunday_hours', 0)
            )
            if abs(v - calculated_total) > 0.01:  # Allow small floating point errors
                return calculated_total
        return v


class RatesConfiguration(BaseModel):
    """
    Hourly rates and multipliers applied to different work types.

    Japanese labor law requires specific multipliers:
    - Overtime: 1.25x (25% premium)
    - Night shift: 1.25x (25% premium)
    - Holiday: 1.35x (35% premium)
    - Sunday: 1.35x (35% premium)
    """
    base_rate: float = Field(
        ...,
        gt=0,
        description="Base hourly rate in JPY"
    )
    regular_rate: float = Field(
        ...,
        gt=0,
        description="Regular hours rate (usually same as base_rate)"
    )
    overtime_rate: float = Field(
        default=1.25,
        ge=1.0,
        le=2.0,
        description="Overtime multiplier (労働基準法: 1.25x minimum)"
    )
    night_rate: float = Field(
        default=1.25,
        ge=1.0,
        le=2.0,
        description="Night shift multiplier (22:00-05:00)"
    )
    holiday_rate: float = Field(
        default=1.35,
        ge=1.0,
        le=2.0,
        description="Holiday work multiplier"
    )
    sunday_rate: float = Field(
        default=1.35,
        ge=1.0,
        le=2.0,
        description="Sunday work multiplier"
    )

    model_config = ConfigDict(
        json_schema_extra={
            "example": {
                "base_rate": 1200.0,
                "regular_rate": 1200.0,
                "overtime_rate": 1.25,
                "night_rate": 1.25,
                "holiday_rate": 1.35,
                "sunday_rate": 1.35
            }
        }
    )


class SalaryAmounts(BaseModel):
    """
    Calculated payment amounts for each hour type.

    Each amount is calculated as: hours * rate
    """
    regular_amount: float = Field(
        default=0.0,
        ge=0,
        description="Regular hours payment"
    )
    overtime_amount: float = Field(
        default=0.0,
        ge=0,
        description="Overtime hours payment"
    )
    night_amount: float = Field(
        default=0.0,
        ge=0,
        description="Night shift payment"
    )
    holiday_amount: float = Field(
        default=0.0,
        ge=0,
        description="Holiday work payment"
    )
    sunday_amount: float = Field(
        default=0.0,
        ge=0,
        description="Sunday work payment"
    )
    bonus: float = Field(
        default=0.0,
        ge=0,
        description="Additional bonus payment"
    )
    gasoline_allowance: float = Field(
        default=0.0,
        ge=0,
        description="Transportation/gasoline allowance (ガソリン代)"
    )
    subtotal: float = Field(
        default=0.0,
        ge=0,
        description="Subtotal before deductions"
    )

    model_config = ConfigDict(
        json_schema_extra={
            "example": {
                "regular_amount": 192000.0,
                "overtime_amount": 30000.0,
                "night_amount": 22500.0,
                "holiday_amount": 12960.0,
                "sunday_amount": 12960.0,
                "bonus": 20000.0,
                "gasoline_allowance": 15000.0,
                "subtotal": 305420.0
            }
        }
    )

    @field_validator('subtotal')
    @classmethod
    def validate_subtotal(cls, v, info):
        """Ensure subtotal matches sum of all amounts"""
        if info.data:
            calculated = (
                info.data.get('regular_amount', 0) +
                info.data.get('overtime_amount', 0) +
                info.data.get('night_amount', 0) +
                info.data.get('holiday_amount', 0) +
                info.data.get('sunday_amount', 0) +
                info.data.get('bonus', 0) +
                info.data.get('gasoline_allowance', 0)
            )
            if abs(v - calculated) > 0.01:
                return calculated
        return v


class DeductionsDetail(BaseModel):
    """
    Detailed breakdown of all deductions from gross salary.

    Japanese payroll typically includes:
    - Income tax (所得税)
    - Resident tax (住民税)
    - Health insurance (健康保険)
    - Pension (厚生年金)
    - Employment insurance (雇用保険)
    - Apartment rent (寮費)
    """
    income_tax: float = Field(
        default=0.0,
        ge=0,
        description="Income tax (所得税)"
    )
    resident_tax: float = Field(
        default=0.0,
        ge=0,
        description="Resident tax (住民税)"
    )
    health_insurance: float = Field(
        default=0.0,
        ge=0,
        description="Health insurance (健康保険)"
    )
    pension: float = Field(
        default=0.0,
        ge=0,
        description="Pension insurance (厚生年金)"
    )
    employment_insurance: float = Field(
        default=0.0,
        ge=0,
        description="Employment insurance (雇用保険)"
    )
    apartment_deduction: float = Field(
        default=0.0,
        ge=0,
        description="Apartment/dormitory rent (寮費)"
    )
    other_deductions: float = Field(
        default=0.0,
        ge=0,
        description="Other miscellaneous deductions"
    )
    total_deductions: float = Field(
        default=0.0,
        ge=0,
        description="Total amount deducted"
    )

    model_config = ConfigDict(
        json_schema_extra={
            "example": {
                "income_tax": 15271.0,
                "resident_tax": 8000.0,
                "health_insurance": 14500.0,
                "pension": 18300.0,
                "employment_insurance": 1527.0,
                "apartment_deduction": 30000.0,
                "other_deductions": 0.0,
                "total_deductions": 87598.0
            }
        }
    )

    @field_validator('total_deductions')
    @classmethod
    def validate_total_deductions(cls, v, info):
        """Ensure total_deductions matches sum of individual deductions"""
        if info.data:
            calculated = (
                info.data.get('income_tax', 0) +
                info.data.get('resident_tax', 0) +
                info.data.get('health_insurance', 0) +
                info.data.get('pension', 0) +
                info.data.get('employment_insurance', 0) +
                info.data.get('apartment_deduction', 0) +
                info.data.get('other_deductions', 0)
            )
            if abs(v - calculated) > 0.01:
                return calculated
        return v


class PayrollSummary(BaseModel):
    """
    Final summary of gross, deductions, and net salary.
    """
    gross_salary: float = Field(
        ...,
        ge=0,
        description="Total gross salary before deductions"
    )
    total_deductions: float = Field(
        ...,
        ge=0,
        description="Total deductions"
    )
    net_salary: float = Field(
        ...,
        ge=0,
        description="Net salary paid to employee (手取り)"
    )
    factory_payment: float = Field(
        default=0.0,
        ge=0,
        description="Amount paid by factory/client"
    )
    company_profit: float = Field(
        default=0.0,
        description="Company profit margin (can be negative)"
    )

    model_config = ConfigDict(
        json_schema_extra={
            "example": {
                "gross_salary": 305420.0,
                "total_deductions": 87598.0,
                "net_salary": 217822.0,
                "factory_payment": 350000.0,
                "company_profit": 44580.0
            }
        }
    )

    @field_validator('net_salary')
    @classmethod
    def validate_net_salary(cls, v, info):
        """Ensure net_salary = gross_salary - total_deductions"""
        if info.data and 'gross_salary' in info.data and 'total_deductions' in info.data:
            calculated = info.data['gross_salary'] - info.data['total_deductions']
            if abs(v - calculated) > 0.01:
                return calculated
        return v


class TimerRecord(BaseModel):
    """
    Individual timer card record for a work day.
    """
    work_date: str = Field(
        ...,
        description="Work date in YYYY-MM-DD format"
    )
    clock_in: str = Field(
        ...,
        description="Clock in time (HH:MM format)"
    )
    clock_out: str = Field(
        ...,
        description="Clock out time (HH:MM format)"
    )
    break_minutes: int = Field(
        default=60,
        ge=0,
        le=480,
        description="Break time in minutes"
    )

    model_config = ConfigDict(
        json_schema_extra={
            "example": {
                "work_date": "2025-10-15",
                "clock_in": "09:00",
                "clock_out": "18:00",
                "break_minutes": 60
            }
        }
    )


# ============================================================================
# CORE MODELS - Main Response Schema
# ============================================================================


class SalaryCalculationResponse(BaseModel):
    """
    Complete salary calculation response with all details.

    This is the primary response model for salary calculations,
    containing employee info, hours breakdown, rates, amounts,
    deductions, and final totals.
    """
    # Identifiers
    id: int = Field(..., description="Salary calculation record ID")
    employee_id: int = Field(..., description="Employee ID")
    employee_name: str = Field(..., description="Employee full name")

    # Period
    month: int = Field(..., ge=1, le=12, description="Salary month")
    year: int = Field(..., ge=2020, le=2100, description="Salary year")

    # Hours breakdown
    regular_hours: float = Field(default=0.0, ge=0, description="Regular work hours")
    overtime_hours: float = Field(default=0.0, ge=0, description="Overtime hours")
    night_hours: float = Field(default=0.0, ge=0, description="Night shift hours")
    holiday_hours: float = Field(default=0.0, ge=0, description="Holiday work hours")
    sunday_hours: float = Field(default=0.0, ge=0, description="Sunday work hours")
    total_hours: float = Field(default=0.0, ge=0, description="Total hours worked")
    work_days: int = Field(default=0, ge=0, description="Number of work days")

    # Rates
    base_rate: float = Field(..., gt=0, description="Base hourly rate")
    regular_rate: float = Field(..., gt=0, description="Regular hours rate")
    overtime_rate: float = Field(default=1.25, description="Overtime multiplier")
    night_rate: float = Field(default=1.25, description="Night shift multiplier")
    holiday_rate: float = Field(default=1.35, description="Holiday multiplier")
    sunday_rate: float = Field(default=1.35, description="Sunday multiplier")

    # Amounts
    regular_amount: float = Field(default=0.0, ge=0, description="Regular hours payment")
    overtime_amount: float = Field(default=0.0, ge=0, description="Overtime payment")
    night_amount: float = Field(default=0.0, ge=0, description="Night shift payment")
    holiday_amount: float = Field(default=0.0, ge=0, description="Holiday payment")
    sunday_amount: float = Field(default=0.0, ge=0, description="Sunday payment")
    bonus: float = Field(default=0.0, ge=0, description="Bonus payment")
    gasoline_allowance: float = Field(default=0.0, ge=0, description="Gas allowance")

    # Deductions
    apartment_deduction: float = Field(default=0.0, ge=0, description="Apartment rent")
    income_tax: float = Field(default=0.0, ge=0, description="Income tax")
    resident_tax: float = Field(default=0.0, ge=0, description="Resident tax")
    health_insurance: float = Field(default=0.0, ge=0, description="Health insurance")
    pension: float = Field(default=0.0, ge=0, description="Pension")
    employment_insurance: float = Field(default=0.0, ge=0, description="Employment insurance")
    other_deductions: float = Field(default=0.0, ge=0, description="Other deductions")

    # Totals
    gross_salary: float = Field(..., ge=0, description="Total gross salary")
    total_deductions: float = Field(..., ge=0, description="Total deductions")
    net_salary: float = Field(..., ge=0, description="Net salary (take-home)")
    factory_payment: float = Field(default=0.0, ge=0, description="Factory payment")
    company_profit: float = Field(default=0.0, description="Company profit")

    # Status
    status: SalaryStatus = Field(default=SalaryStatus.DRAFT, description="Calculation status")

    # Metadata
    payslip_path: Optional[str] = Field(None, description="Path to generated payslip PDF")
    notes: Optional[str] = Field(None, description="Additional notes")
    created_at: datetime = Field(..., description="Creation timestamp")
    updated_at: datetime = Field(..., description="Last update timestamp")
    paid_at: Optional[datetime] = Field(None, description="Payment timestamp")

    model_config = ConfigDict(
        from_attributes=True,
        json_schema_extra={
            "example": {
                "id": 1,
                "employee_id": 123,
                "employee_name": "田中太郎",
                "month": 10,
                "year": 2025,
                "regular_hours": 160.0,
                "overtime_hours": 20.0,
                "night_hours": 15.0,
                "holiday_hours": 8.0,
                "sunday_hours": 8.0,
                "total_hours": 211.0,
                "work_days": 22,
                "base_rate": 1200.0,
                "regular_rate": 1200.0,
                "overtime_rate": 1.25,
                "night_rate": 1.25,
                "holiday_rate": 1.35,
                "sunday_rate": 1.35,
                "regular_amount": 192000.0,
                "overtime_amount": 30000.0,
                "night_amount": 22500.0,
                "holiday_amount": 12960.0,
                "sunday_amount": 12960.0,
                "bonus": 20000.0,
                "gasoline_allowance": 15000.0,
                "apartment_deduction": 30000.0,
                "income_tax": 15271.0,
                "resident_tax": 8000.0,
                "health_insurance": 14500.0,
                "pension": 18300.0,
                "employment_insurance": 1527.0,
                "other_deductions": 0.0,
                "gross_salary": 305420.0,
                "total_deductions": 87598.0,
                "net_salary": 217822.0,
                "factory_payment": 350000.0,
                "company_profit": 44580.0,
                "status": "calculated",
                "payslip_path": "/payslips/2025/10/123_payslip.pdf",
                "notes": None,
                "created_at": "2025-10-31T10:00:00",
                "updated_at": "2025-10-31T10:00:00",
                "paid_at": None
            }
        }
    )


# ============================================================================
# REQUEST MODELS
# ============================================================================


class SalaryCalculateRequest(BaseModel):
    """
    Request to calculate salary for a single employee.
    """
    employee_id: int = Field(..., gt=0, description="Employee ID")
    month: int = Field(..., ge=1, le=12, description="Calculation month")
    year: int = Field(..., ge=2020, le=2100, description="Calculation year")
    use_timer_cards: bool = Field(
        default=True,
        description="Use timer card data for calculation"
    )
    bonus: Optional[float] = Field(
        default=0.0,
        ge=0,
        description="Additional bonus amount"
    )
    gasoline_allowance: Optional[float] = Field(
        default=0.0,
        ge=0,
        description="Gasoline allowance"
    )
    other_deductions: Optional[float] = Field(
        default=0.0,
        ge=0,
        description="Other deductions"
    )
    notes: Optional[str] = Field(None, max_length=1000, description="Calculation notes")

    model_config = ConfigDict(
        json_schema_extra={
            "example": {
                "employee_id": 123,
                "month": 10,
                "year": 2025,
                "use_timer_cards": True,
                "bonus": 20000.0,
                "gasoline_allowance": 15000.0,
                "other_deductions": 0.0,
                "notes": "Regular monthly calculation"
            }
        }
    )


class SalaryBulkCalculateRequest(BaseModel):
    """
    Request to calculate salaries for multiple employees.
    """
    employee_ids: Optional[List[int]] = Field(
        None,
        description="List of employee IDs (None = all employees)"
    )
    factory_id: Optional[str] = Field(
        None,
        description="Calculate for specific factory only"
    )
    month: int = Field(..., ge=1, le=12, description="Calculation month")
    year: int = Field(..., ge=2020, le=2100, description="Calculation year")
    use_timer_cards: bool = Field(
        default=True,
        description="Use timer card data"
    )

    model_config = ConfigDict(
        json_schema_extra={
            "example": {
                "employee_ids": [123, 124, 125],
                "factory_id": None,
                "month": 10,
                "year": 2025,
                "use_timer_cards": True
            }
        }
    )


class SalaryMarkPaidRequest(BaseModel):
    """
    Request to mark salary calculation(s) as paid.
    """
    salary_ids: List[int] = Field(..., min_length=1, description="Salary record IDs")
    payment_date: Optional[datetime] = Field(
        None,
        description="Payment date (defaults to now)"
    )
    notes: Optional[str] = Field(None, max_length=1000, description="Payment notes")

    model_config = ConfigDict(
        json_schema_extra={
            "example": {
                "salary_ids": [1, 2, 3],
                "payment_date": "2025-10-31T15:00:00",
                "notes": "Bank transfer completed"
            }
        }
    )


class SalaryValidateRequest(BaseModel):
    """
    Request to validate salary data before calculation.
    """
    employee_id: int = Field(..., gt=0, description="Employee ID")
    month: int = Field(..., ge=1, le=12, description="Month to validate")
    year: int = Field(..., ge=2020, le=2100, description="Year to validate")

    model_config = ConfigDict(
        json_schema_extra={
            "example": {
                "employee_id": 123,
                "month": 10,
                "year": 2025
            }
        }
    )


class SalaryUpdateRequest(BaseModel):
    """
    Request to update an existing salary calculation.
    """
    bonus: Optional[float] = Field(None, ge=0, description="Update bonus")
    gasoline_allowance: Optional[float] = Field(None, ge=0, description="Update allowance")
    other_deductions: Optional[float] = Field(None, ge=0, description="Update deductions")
    notes: Optional[str] = Field(None, max_length=1000, description="Update notes")
    status: Optional[SalaryStatus] = Field(None, description="Update status")

    model_config = ConfigDict(
        json_schema_extra={
            "example": {
                "bonus": 25000.0,
                "gasoline_allowance": 18000.0,
                "other_deductions": 5000.0,
                "notes": "Bonus increased for good performance",
                "status": "approved"
            }
        }
    )


# ============================================================================
# RESPONSE MODELS
# ============================================================================


class SalaryResponse(BaseModel):
    """
    Standard response wrapper for salary operations.
    """
    success: bool = Field(..., description="Operation success status")
    id: int = Field(..., description="Salary record ID")
    status: SalaryStatus = Field(..., description="Current status")
    data: SalaryCalculationResponse = Field(..., description="Salary calculation details")
    message: Optional[str] = Field(None, description="Optional message")

    model_config = ConfigDict(
        json_schema_extra={
            "example": {
                "success": True,
                "id": 1,
                "status": "calculated",
                "data": {},  # Full SalaryCalculationResponse object
                "message": "Salary calculated successfully"
            }
        }
    )


class SalaryListResponse(BaseModel):
    """
    Paginated list of salary calculations.
    """
    items: List[SalaryCalculationResponse] = Field(..., description="Salary records")
    total: int = Field(..., ge=0, description="Total number of records")
    page: int = Field(..., ge=1, description="Current page")
    pages: int = Field(..., ge=1, description="Total pages")
    page_size: int = Field(..., ge=1, le=100, description="Items per page")

    model_config = ConfigDict(
        json_schema_extra={
            "example": {
                "items": [],  # List of SalaryCalculationResponse
                "total": 150,
                "page": 1,
                "pages": 15,
                "page_size": 10
            }
        }
    )


class BulkCalculateResponse(BaseModel):
    """
    Response for bulk salary calculation operations.
    """
    successful: int = Field(..., ge=0, description="Number of successful calculations")
    failed: int = Field(..., ge=0, description="Number of failed calculations")
    total: int = Field(..., ge=0, description="Total employees processed")
    results: List[SalaryResponse] = Field(..., description="Individual results")
    errors: Dict[int, str] = Field(
        default_factory=dict,
        description="Errors by employee_id"
    )
    total_gross_amount: float = Field(default=0.0, ge=0, description="Total gross salary")
    total_net_amount: float = Field(default=0.0, ge=0, description="Total net salary")
    total_company_profit: float = Field(default=0.0, description="Total company profit")

    model_config = ConfigDict(
        json_schema_extra={
            "example": {
                "successful": 45,
                "failed": 3,
                "total": 48,
                "results": [],  # List of SalaryResponse
                "errors": {
                    126: "Missing timer card data",
                    127: "Employee not found",
                    128: "Invalid hourly rate"
                },
                "total_gross_amount": 13743900.0,
                "total_net_amount": 9820730.0,
                "total_company_profit": 1897840.0
            }
        }
    )


class ValidationResult(BaseModel):
    """
    Result of salary data validation.
    """
    is_valid: bool = Field(..., description="Overall validation status")
    errors: List[str] = Field(default_factory=list, description="Validation errors")
    warnings: List[str] = Field(default_factory=list, description="Validation warnings")
    validated_at: datetime = Field(
        default_factory=datetime.now,
        description="Validation timestamp"
    )

    model_config = ConfigDict(
        json_schema_extra={
            "example": {
                "is_valid": False,
                "errors": [
                    "No timer card records found for October 2025",
                    "Employee hourly rate not set"
                ],
                "warnings": [
                    "High overtime hours detected (65 hours)"
                ],
                "validated_at": "2025-10-31T09:00:00"
            }
        }
    )


class SalaryStatistics(BaseModel):
    """
    Statistical summary of salary calculations for a period.
    """
    month: int = Field(..., ge=1, le=12, description="Statistics month")
    year: int = Field(..., ge=2020, le=2100, description="Statistics year")
    total_employees: int = Field(..., ge=0, description="Number of employees")
    total_gross_amount: float = Field(..., ge=0, description="Total gross salary")
    total_deductions: float = Field(..., ge=0, description="Total deductions")
    total_net_amount: float = Field(..., ge=0, description="Total net salary")
    company_total_profit: float = Field(..., description="Total company profit")
    average_salary: float = Field(..., ge=0, description="Average salary")
    highest_salary: float = Field(..., ge=0, description="Highest salary")
    lowest_salary: float = Field(..., ge=0, description="Lowest salary")
    by_factory: Optional[List[Dict[str, Any]]] = Field(
        None,
        description="Statistics grouped by factory"
    )

    model_config = ConfigDict(
        json_schema_extra={
            "example": {
                "month": 10,
                "year": 2025,
                "total_employees": 45,
                "total_gross_amount": 13743900.0,
                "total_deductions": 3923170.0,
                "total_net_amount": 9820730.0,
                "company_total_profit": 1897840.0,
                "average_salary": 218238.44,
                "highest_salary": 387500.0,
                "lowest_salary": 145800.0,
                "by_factory": [
                    {
                        "factory_id": "F001",
                        "factory_name": "Toyota Factory",
                        "employees": 15,
                        "total_gross": 4872000.0
                    }
                ]
            }
        }
    )


# ============================================================================
# PAYSLIP MODELS
# ============================================================================


class PayslipGenerateRequest(BaseModel):
    """
    Request to generate payslip PDF.
    """
    salary_id: int = Field(..., gt=0, description="Salary calculation ID")
    include_breakdown: bool = Field(
        default=True,
        description="Include detailed hours/deductions breakdown"
    )
    language: str = Field(
        default="ja",
        description="Payslip language (ja/en)"
    )

    model_config = ConfigDict(
        json_schema_extra={
            "example": {
                "salary_id": 1,
                "include_breakdown": True,
                "language": "ja"
            }
        }
    )


class PayslipResponse(BaseModel):
    """
    Response after generating payslip.
    """
    success: bool = Field(..., description="Generation success")
    salary_id: int = Field(..., description="Salary record ID")
    pdf_path: Optional[str] = Field(None, description="File system path to PDF")
    pdf_url: Optional[str] = Field(None, description="URL to download PDF")
    generated_at: datetime = Field(..., description="Generation timestamp")

    model_config = ConfigDict(
        json_schema_extra={
            "example": {
                "success": True,
                "salary_id": 1,
                "pdf_path": "/payslips/2025/10/123_payslip.pdf",
                "pdf_url": "/api/payslips/download/1",
                "generated_at": "2025-10-31T11:00:00"
            }
        }
    )


# ============================================================================
# CRUD OPERATION MODELS
# ============================================================================


class SalaryCreateResponse(BaseModel):
    """
    Response after creating a salary calculation.
    """
    id: int = Field(..., description="Created salary record ID")
    status: SalaryStatus = Field(..., description="Initial status")
    created_at: datetime = Field(..., description="Creation timestamp")
    message: str = Field(default="Salary calculation created successfully")

    model_config = ConfigDict(
        json_schema_extra={
            "example": {
                "id": 1,
                "status": "draft",
                "created_at": "2025-10-31T10:00:00",
                "message": "Salary calculation created successfully"
            }
        }
    )


class SalaryUpdateResponse(BaseModel):
    """
    Response after updating a salary calculation.
    """
    id: int = Field(..., description="Updated salary record ID")
    status: SalaryStatus = Field(..., description="Current status")
    updated_at: datetime = Field(..., description="Update timestamp")
    message: str = Field(default="Salary calculation updated successfully")

    model_config = ConfigDict(
        json_schema_extra={
            "example": {
                "id": 1,
                "status": "approved",
                "updated_at": "2025-10-31T14:00:00",
                "message": "Salary calculation updated successfully"
            }
        }
    )


class SalaryDeleteResponse(BaseModel):
    """
    Response after deleting a salary calculation.
    """
    id: int = Field(..., description="Deleted salary record ID")
    deleted_at: datetime = Field(..., description="Deletion timestamp")
    message: str = Field(default="Salary calculation deleted successfully")

    model_config = ConfigDict(
        json_schema_extra={
            "example": {
                "id": 1,
                "deleted_at": "2025-10-31T16:00:00",
                "message": "Salary calculation deleted successfully"
            }
        }
    )


# ============================================================================
# ERROR MODELS
# ============================================================================


class SalaryError(BaseModel):
    """
    Standard error response for salary operations.
    """
    error: str = Field(..., description="Error type/code")
    detail: Optional[str] = Field(None, description="Detailed error message")
    employee_id: Optional[int] = Field(None, description="Related employee ID")
    timestamp: datetime = Field(default_factory=datetime.now, description="Error timestamp")

    model_config = ConfigDict(
        json_schema_extra={
            "example": {
                "error": "CALCULATION_FAILED",
                "detail": "Missing timer card data for specified period",
                "employee_id": 123,
                "timestamp": "2025-10-31T10:00:00"
            }
        }
    )


# ============================================================================
# NEW SCHEMAS FOR MISSING ENDPOINTS
# ============================================================================


class SalaryUpdate(BaseModel):
    """
    Schema for updating existing salary calculation.
    Only allows updating bonus, gasoline_allowance, other_deductions, and notes.
    """
    bonus: Optional[float] = Field(None, ge=0, description="Update bonus amount")
    gasoline_allowance: Optional[float] = Field(None, ge=0, description="Update gasoline allowance")
    other_deductions: Optional[float] = Field(None, ge=0, description="Update other deductions")
    notes: Optional[str] = Field(None, max_length=1000, description="Update notes")

    model_config = ConfigDict(
        json_schema_extra={
            "example": {
                "bonus": 25000.0,
                "gasoline_allowance": 18000.0,
                "other_deductions": 5000.0,
                "notes": "Bonus adjusted for performance"
            }
        }
    )


class MarkSalaryPaidRequest(BaseModel):
    """
    Request schema for marking a salary as paid.
    """
    payment_date: datetime = Field(..., description="Date when payment was made")
    payment_method: Optional[str] = Field(None, max_length=50, description="Payment method (transfer, cash, check)")
    notes: Optional[str] = Field(None, max_length=1000, description="Payment notes")

    model_config = ConfigDict(
        json_schema_extra={
            "example": {
                "payment_date": "2025-10-31T15:00:00",
                "payment_method": "transfer",
                "notes": "Bank transfer completed successfully"
            }
        }
    )


class PayrollRunUpdate(BaseModel):
    """
    Schema for updating payroll run.
    Only allows updating if status is DRAFT.
    """
    pay_period_start: Optional[datetime] = Field(None, description="Update pay period start date")
    pay_period_end: Optional[datetime] = Field(None, description="Update pay period end date")
    description: Optional[str] = Field(None, max_length=500, description="Update description")

    model_config = ConfigDict(
        json_schema_extra={
            "example": {
                "pay_period_start": "2025-10-01T00:00:00",
                "pay_period_end": "2025-10-31T23:59:59",
                "description": "October 2025 payroll run - updated"
            }
        }
    )


class MarkPayrollPaidRequest(BaseModel):
    """
    Request schema for marking an entire payroll run as paid.
    """
    payment_date: datetime = Field(..., description="Date when payments were made")
    payment_method: Optional[str] = Field(None, max_length=50, description="Payment method")
    notes: Optional[str] = Field(None, max_length=1000, description="Payment notes")

    model_config = ConfigDict(
        json_schema_extra={
            "example": {
                "payment_date": "2025-10-31T15:00:00",
                "payment_method": "bank_transfer",
                "notes": "All employees paid via bank transfer"
            }
        }
    )


class SalaryReportFilters(BaseModel):
    """
    Filters for salary report generation.
    """
    start_date: str = Field(..., description="Start date in YYYY-MM-DD format")
    end_date: str = Field(..., description="End date in YYYY-MM-DD format")
    employee_ids: Optional[List[int]] = Field(None, description="Filter by employee IDs")
    factory_ids: Optional[List[str]] = Field(None, description="Filter by factory IDs")
    is_paid: Optional[bool] = Field(None, description="Filter by paid status")

    model_config = ConfigDict(
        json_schema_extra={
            "example": {
                "start_date": "2025-10-01",
                "end_date": "2025-10-31",
                "employee_ids": [123, 124, 125],
                "factory_ids": ["F001", "F002"],
                "is_paid": False
            }
        }
    )


class SalaryExportResponse(BaseModel):
    """
    Response schema for salary export operations (Excel/PDF).
    """
    success: bool = Field(..., description="Export success status")
    file_url: str = Field(..., description="URL to download the exported file")
    filename: str = Field(..., description="Name of the exported file")
    format: str = Field(..., description="File format (excel/pdf)")
    generated_at: datetime = Field(..., description="Generation timestamp")

    model_config = ConfigDict(
        json_schema_extra={
            "example": {
                "success": True,
                "file_url": "/api/salary/downloads/salary_report_2025-10.xlsx",
                "filename": "salary_report_2025-10.xlsx",
                "format": "excel",
                "generated_at": "2025-10-31T16:00:00"
            }
        }
    )


class SalaryReportResponse(BaseModel):
    """
    Response schema for salary reports with summary statistics.
    """
    total_count: int = Field(..., ge=0, description="Total number of salaries in report")
    salaries: List[SalaryCalculationResponse] = Field(..., description="List of salary calculations")
    summary: Dict[str, Any] = Field(..., description="Summary statistics")

    model_config = ConfigDict(
        json_schema_extra={
            "example": {
                "total_count": 45,
                "salaries": [],  # List of SalaryCalculationResponse
                "summary": {
                    "total_employees": 45,
                    "total_gross": 13743900.0,
                    "total_deductions": 3923170.0,
                    "total_net": 9820730.0,
                    "average_salary": 218238.44,
                    "paid_count": 30,
                    "unpaid_count": 15
                }
            }
        }
    )
