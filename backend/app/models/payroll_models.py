"""
Payroll Models - SQLAlchemy models for payroll tables
"""
from sqlalchemy import Column, Integer, String, Date, DateTime, Boolean, ForeignKey, Text
from sqlalchemy.types import Numeric
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.core.database import Base


class PayrollRun(Base):
    """Model for payroll runs."""
    __tablename__ = "payroll_runs"

    id = Column(Integer, primary_key=True, index=True)
    pay_period_start = Column(Date, nullable=False, index=True)
    pay_period_end = Column(Date, nullable=False, index=True)
    status = Column(String(20), default="draft", index=True)
    total_employees = Column(Integer, default=0)
    total_gross_amount = Column(Numeric(15, 2), default=0)
    total_deductions = Column(Numeric(15, 2), default=0)
    total_net_amount = Column(Numeric(15, 2), default=0)
    created_by = Column(String(255))
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    # Relationships
    employee_payrolls = relationship("EmployeePayroll", back_populates="payroll_run")


class EmployeePayroll(Base):
    """Model for employee payroll details."""
    __tablename__ = "employee_payroll"

    id = Column(Integer, primary_key=True, index=True)
    payroll_run_id = Column(Integer, ForeignKey("payroll_runs.id"), nullable=False, index=True)
    employee_id = Column(Integer, nullable=False, index=True)
    pay_period_start = Column(Date, nullable=False)
    pay_period_end = Column(Date, nullable=False)

    # Hours breakdown
    regular_hours = Column(Numeric(5, 2), default=0)
    overtime_hours = Column(Numeric(5, 2), default=0)
    night_shift_hours = Column(Numeric(5, 2), default=0)
    holiday_hours = Column(Numeric(5, 2), default=0)
    sunday_hours = Column(Numeric(5, 2), default=0)

    # Rates (JPY per hour)
    base_rate = Column(Numeric(10, 2), nullable=False)
    overtime_rate = Column(Numeric(10, 2), nullable=False)
    night_shift_rate = Column(Numeric(10, 2), nullable=False)
    holiday_rate = Column(Numeric(10, 2), nullable=False)

    # Amounts (JPY)
    base_amount = Column(Numeric(12, 2), default=0)
    overtime_amount = Column(Numeric(12, 2), default=0)
    night_shift_amount = Column(Numeric(12, 2), default=0)
    holiday_amount = Column(Numeric(12, 2), default=0)
    gross_amount = Column(Numeric(12, 2), default=0)

    # Deductions
    income_tax = Column(Numeric(10, 2), default=0)
    resident_tax = Column(Numeric(10, 2), default=0)
    health_insurance = Column(Numeric(10, 2), default=0)
    pension = Column(Numeric(10, 2), default=0)
    employment_insurance = Column(Numeric(10, 2), default=0)
    total_deductions = Column(Numeric(12, 2), default=0)

    # Net amount
    net_amount = Column(Numeric(12, 2), default=0)

    # Yukyu (有給休暇) Information
    yukyu_days_approved = Column(Numeric(4, 1), default=0)  # Días de yukyu aprobados en período
    yukyu_deduction_jpy = Column(Numeric(10, 2), default=0)  # Monto deducido por yukyu (¥)
    yukyu_request_ids = Column(Text, nullable=True)  # JSON: [1, 2, 3] para referencia a requests

    # Metadata
    timer_card_period_id = Column(Integer)
    payslip_generated = Column(Boolean, default=False)
    payslip_pdf_path = Column(String(255))
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    # Relationships
    payroll_run = relationship("PayrollRun", back_populates="employee_payrolls")


class PayrollSettings(Base):
    """
    Payroll Settings Model - Dynamic configuration for salary calculations.

    This table stores all configurable payroll settings:
    - Hour rates (overtime, night shift, holiday, sunday)
    - Tax rates (income tax, resident tax)
    - Insurance rates (health, pension, employment)
    - Standard hours per month

    These settings replace hardcoded values and allow dynamic configuration
    without code changes. Managed by PayrollConfigService.

    Fields:
        id: Primary key
        company_id: Optional company identifier for multi-company support

        Hour Rates (multipliers for base wage):
        - overtime_rate: Overtime premium rate (default: 1.25 = 125%)
        - night_shift_rate: Night shift premium rate (default: 1.25 = 125%)
        - holiday_rate: Holiday premium rate (default: 1.35 = 135%)
        - sunday_rate: Sunday premium rate (default: 1.35 = 135%)
        - standard_hours_per_month: Standard monthly hours (default: 160)

        Tax & Insurance Rates (percentage rates):
        - income_tax_rate: Income tax rate (default: 10.0%)
        - resident_tax_rate: Resident tax rate (default: 5.0%)
        - health_insurance_rate: Health insurance rate (default: 4.75%)
        - pension_rate: Pension insurance rate (default: 10.0%)
        - employment_insurance_rate: Employment insurance rate (default: 0.3%)

        Audit Fields:
        - updated_by_id: User who last updated these settings
        - updated_at: When settings were last updated
        - created_at: When settings were created
    """
    __tablename__ = "payroll_settings"

    id = Column(Integer, primary_key=True, index=True)
    company_id = Column(Integer, index=True)

    # Hour rates (multipliers for base hourly wage)
    overtime_rate = Column(Numeric(4, 2), default=1.25, nullable=False)
    night_shift_rate = Column(Numeric(4, 2), default=1.25, nullable=False)
    holiday_rate = Column(Numeric(4, 2), default=1.35, nullable=False)
    sunday_rate = Column(Numeric(4, 2), default=1.35, nullable=False)
    standard_hours_per_month = Column(Numeric(5, 2), default=160, nullable=False)

    # Tax & insurance rates (percentage rates)
    income_tax_rate = Column(Numeric(5, 2), default=10.0, nullable=False)
    resident_tax_rate = Column(Numeric(5, 2), default=5.0, nullable=False)
    health_insurance_rate = Column(Numeric(5, 2), default=4.75, nullable=False)
    pension_rate = Column(Numeric(5, 2), default=10.0, nullable=False)
    employment_insurance_rate = Column(Numeric(5, 2), default=0.3, nullable=False)

    # Audit fields
    updated_by_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())
    created_at = Column(DateTime(timezone=True), server_default=func.now())
