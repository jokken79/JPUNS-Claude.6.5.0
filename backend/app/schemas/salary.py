"""
Salary Calculation Schemas
"""
from pydantic import BaseModel, ConfigDict
from typing import Optional
from datetime import datetime
from decimal import Decimal


class SalaryCalculationBase(BaseModel):
    """Base salary calculation schema"""
    employee_id: int
    month: int
    year: int


class SalaryCalculate(BaseModel):
    """Calculate salary request"""
    employee_id: int
    month: int
    year: int
    bonus: Optional[int] = 0
    gasoline_allowance: Optional[int] = 0
    other_deductions: Optional[int] = 0
    notes: Optional[str] = None


class SalaryCalculationResponse(SalaryCalculationBase):
    """Salary calculation response"""
    id: int
    total_regular_hours: Decimal
    total_overtime_hours: Decimal
    total_night_hours: Decimal
    total_holiday_hours: Decimal
    base_salary: int
    overtime_pay: int
    night_pay: int
    holiday_pay: int
    bonus: int
    gasoline_allowance: int
    apartment_deduction: int
    other_deductions: int
    gross_salary: int
    net_salary: int
    factory_payment: int
    company_profit: int
    is_paid: bool
    paid_at: Optional[datetime]
    created_at: datetime
    
    model_config = ConfigDict(from_attributes=True)


class SalaryBulkCalculate(BaseModel):
    """Bulk calculate salaries"""
    month: int
    year: int
    employee_ids: Optional[list[int]] = None  # If None, calculate for all
    factory_id: Optional[str] = None  # Calculate for specific factory


class SalaryBulkResult(BaseModel):
    """Bulk salary calculation result"""
    total_employees: int
    successful: int
    failed: int
    total_gross_salary: int
    total_net_salary: int
    total_company_profit: int
    errors: list[str]


class SalaryMarkPaid(BaseModel):
    """Mark salary as paid"""
    salary_ids: list[int]
    payment_date: Optional[datetime] = None
    notes: Optional[str] = None


class SalaryReport(BaseModel):
    """Salary report"""
    employee_id: int
    employee_name: str
    factory_name: str
    month: int
    year: int
    work_days: int
    total_hours: Decimal
    hourly_rate: int
    gross_salary: int
    deductions: int
    net_salary: int
    payment_date: Optional[datetime]


class SalaryStatistics(BaseModel):
    """Salary statistics"""
    month: int
    year: int
    total_employees: int
    total_gross_salary: int
    total_net_salary: int
    total_deductions: int
    total_company_revenue: int
    total_company_profit: int
    average_salary: int
    factories: list[dict]
