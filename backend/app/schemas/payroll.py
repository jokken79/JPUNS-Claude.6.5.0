"""
Payroll Schemas - Pydantic models for API
"""
from typing import List, Optional, Dict, Any
from pydantic import BaseModel, Field
from decimal import Decimal
from datetime import datetime

# Base Schemas


class PayrollBase(BaseModel):
    """Base schema for payroll."""
    pay_period_start: datetime = Field(..., description="Start date of pay period")
    pay_period_end: datetime = Field(..., description="End date of pay period")
    status: str = Field(default="draft", description="Payroll run status")


# Payroll Run Schemas


class PayrollRunCreate(PayrollBase):
    """Schema for creating a payroll run."""
    created_by: Optional[str] = Field(None, description="User ID who created the run")


class PayrollRun(PayrollBase):
    """Schema for payroll run."""
    id: int
    total_employees: int = 0
    total_gross_amount: float = 0
    total_deductions: float = 0
    total_net_amount: float = 0
    created_by: Optional[str] = None
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class PayrollRunSummary(BaseModel):
    """Summary schema for payroll run list."""
    id: int
    pay_period_start: datetime
    pay_period_end: datetime
    status: str
    total_employees: int
    total_gross_amount: float
    total_net_amount: float
    created_at: datetime

    class Config:
        from_attributes = True


# Employee Payroll Schemas


class TimerRecord(BaseModel):
    """Schema for timer card record."""
    work_date: str = Field(..., example="2025-10-01", description="Work date (YYYY-MM-DD)")
    clock_in: str = Field(..., example="09:00", description="Clock in time (HH:MM)")
    clock_out: str = Field(..., example="18:00", description="Clock out time (HH:MM)")
    break_minutes: int = Field(default=60, example=60, description="Break time in minutes")


class EmployeeData(BaseModel):
    """Schema for employee data."""
    employee_id: int = Field(..., description="Employee ID")
    name: str = Field(..., description="Employee name")
    base_hourly_rate: float = Field(..., ge=0, description="Base hourly rate in JPY")
    factory_id: str = Field(..., description="Factory assignment ID")
    prefecture: str = Field(default="Tokyo", description="Prefecture for resident tax")
    apartment_rent: float = Field(default=30000, ge=0, description="Monthly apartment rent")
    dependents: int = Field(default=0, ge=0, description="Number of dependents")
    standard_hours_per_month: float = Field(default=160, gt=0, le=300, description="Standard hours per month for teiji (定時) calculation")
    yukyu_days_approved: float = Field(default=0, ge=0, description="Approved yukyu days in period (有給休暇)")


class EmployeePayrollCreate(BaseModel):
    """Schema for calculating employee payroll."""
    employee_data: EmployeeData
    timer_records: List[TimerRecord]
    payroll_run_id: Optional[int] = Field(None, description="Payroll run ID")
    yukyu_days_approved: float = Field(default=0, ge=0, description="Yukyu days approved (alternative to employee_data.yukyu_days_approved)")


class HoursBreakdown(BaseModel):
    """Schema for hours breakdown."""
    regular_hours: float
    overtime_hours: float
    night_shift_hours: float
    holiday_hours: float
    sunday_hours: float
    total_hours: float
    work_days: int


class Rates(BaseModel):
    """Schema for calculated rates."""
    base_rate: float
    overtime_rate: float
    night_shift_rate: float
    holiday_rate: float
    sunday_rate: float


class Amounts(BaseModel):
    """Schema for calculated amounts."""
    base_amount: float
    overtime_amount: float
    night_shift_amount: float
    holiday_amount: float
    sunday_amount: float
    gross_amount: float
    total_deductions: float
    net_amount: float


class DeductionsDetail(BaseModel):
    """Schema for detailed deductions."""
    income_tax: float
    resident_tax: float
    health_insurance: float
    pension: float
    employment_insurance: float
    apartment: float
    other: float
    yukyu_deduction: float = Field(default=0, description="Deduction for approved yukyu days (有給休暇控除)")


class ValidationResult(BaseModel):
    """Schema for validation result."""
    is_valid: bool
    errors: List[str] = []
    warnings: List[str] = []
    validated_at: datetime


class EmployeePayrollResult(BaseModel):
    """Schema for employee payroll calculation result."""
    success: bool
    employee_id: int
    payroll_run_id: Optional[int] = None
    pay_period_start: str
    pay_period_end: str
    hours_breakdown: HoursBreakdown
    rates: Rates
    amounts: Amounts
    deductions_detail: DeductionsDetail
    validation: ValidationResult
    calculated_at: datetime


# Bulk Payroll Schemas


class BulkPayrollRequest(BaseModel):
    """Schema for bulk payroll calculation."""
    employees_data: Dict[int, Dict[str, Any]] = Field(
        ...,
        description="Dictionary of employee data with timer records"
    )
    payroll_run_id: Optional[int] = Field(None, description="Payroll run ID")


class BulkPayrollResult(BaseModel):
    """Schema for bulk payroll calculation result."""
    total_employees: int
    successful: int
    failed: int
    results: List[Dict[str, Any]]
    errors: List[Dict[str, str]]
    calculated_at: datetime


# Payslip Schemas


class PayslipRequest(BaseModel):
    """Schema for payslip generation request."""
    employee_id: int = Field(..., description="Employee ID")
    payroll_run_id: int = Field(..., description="Payroll run ID")


class PayslipInfo(BaseModel):
    """Schema for payslip information."""
    success: bool
    pdf_path: Optional[str] = None
    pdf_url: Optional[str] = None
    payslip_id: str
    generated_at: datetime
    employee_id: int
    pay_period: str


class PayslipDetail(BaseModel):
    """Schema for detailed payslip data."""
    employee_name: str
    employee_id: int
    pay_period: str
    pay_period_start: str
    pay_period_end: str
    hours: HoursBreakdown
    rates: Rates
    earnings: Amounts
    deductions: DeductionsDetail
    net_amount: float


# Payroll Settings Schemas


class PayrollSettingsBase(BaseModel):
    """
    Base schema for payroll settings.

    Includes:
    - Hour rates (multipliers for base wage)
    - Tax rates (percentage of gross salary)
    - Insurance rates (percentage of gross salary)
    - Standard hours per month
    """
    company_id: Optional[int] = None

    # Hour rates (multipliers)
    overtime_rate: float = Field(default=1.25, ge=1.0, le=2.0, description="Overtime rate multiplier (e.g., 1.25 = 125%)")
    night_shift_rate: float = Field(default=1.25, ge=1.0, le=2.0, description="Night shift rate multiplier (e.g., 1.25 = 125%)")
    holiday_rate: float = Field(default=1.35, ge=1.0, le=2.0, description="Holiday rate multiplier (e.g., 1.35 = 135%)")
    sunday_rate: float = Field(default=1.35, ge=1.0, le=2.0, description="Sunday rate multiplier (e.g., 1.35 = 135%)")
    standard_hours_per_month: float = Field(default=160, gt=0, le=300, description="Standard hours per month")

    # Tax & insurance rates (percentages)
    income_tax_rate: float = Field(default=10.0, ge=0, le=100, description="Income tax rate (%)")
    resident_tax_rate: float = Field(default=5.0, ge=0, le=100, description="Resident tax rate (%)")
    health_insurance_rate: float = Field(default=4.75, ge=0, le=100, description="Health insurance rate (%)")
    pension_rate: float = Field(default=10.0, ge=0, le=100, description="Pension insurance rate (%)")
    employment_insurance_rate: float = Field(default=0.3, ge=0, le=100, description="Employment insurance rate (%)")


class PayrollSettingsCreate(PayrollSettingsBase):
    """Schema for creating payroll settings."""
    pass


class PayrollSettingsUpdate(BaseModel):
    """
    Schema for updating payroll settings (partial updates allowed).

    All fields are optional - only provided fields will be updated.
    """
    # Hour rates (multipliers)
    overtime_rate: Optional[float] = Field(None, ge=1.0, le=2.0, description="Overtime rate multiplier")
    night_shift_rate: Optional[float] = Field(None, ge=1.0, le=2.0, description="Night shift rate multiplier")
    holiday_rate: Optional[float] = Field(None, ge=1.0, le=2.0, description="Holiday rate multiplier")
    sunday_rate: Optional[float] = Field(None, ge=1.0, le=2.0, description="Sunday rate multiplier")
    standard_hours_per_month: Optional[float] = Field(None, gt=0, le=300, description="Standard hours per month")

    # Tax & insurance rates (percentages)
    income_tax_rate: Optional[float] = Field(None, ge=0, le=100, description="Income tax rate (%)")
    resident_tax_rate: Optional[float] = Field(None, ge=0, le=100, description="Resident tax rate (%)")
    health_insurance_rate: Optional[float] = Field(None, ge=0, le=100, description="Health insurance rate (%)")
    pension_rate: Optional[float] = Field(None, ge=0, le=100, description="Pension insurance rate (%)")
    employment_insurance_rate: Optional[float] = Field(None, ge=0, le=100, description="Employment insurance rate (%)")


class PayrollSettings(PayrollSettingsBase):
    """Schema for payroll settings."""
    id: int
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


# Approval Schemas


class PayrollApprovalRequest(BaseModel):
    """Schema for approving a payroll run."""
    approved_by: str = Field(..., description="User ID who approved")
    notes: Optional[str] = Field(None, description="Approval notes")


class PayrollApprovalResponse(BaseModel):
    """Schema for payroll approval response."""
    success: bool
    payroll_run_id: int
    status: str
    approved_by: str
    approved_at: datetime


# Summary Schema


class PayrollSummary(BaseModel):
    """Schema for payroll summary view."""
    payroll_run_id: int
    pay_period_start: datetime
    pay_period_end: datetime
    status: str
    total_employees: int
    total_gross_amount: float
    total_deductions: float
    total_net_amount: float
    total_hours: float
    avg_gross_amount: float
    created_at: datetime

    class Config:
        from_attributes = True


# Error Schema


class PayrollError(BaseModel):
    """Schema for payroll errors."""
    error: str
    detail: Optional[str] = None
    timestamp: datetime


# Response Messages


class SuccessResponse(BaseModel):
    """Schema for success responses."""
    success: bool = True
    message: str
    data: Optional[Dict[str, Any]] = None


class ErrorResponse(BaseModel):
    """Schema for error responses."""
    success: bool = False
    error: str
    detail: Optional[str] = None
