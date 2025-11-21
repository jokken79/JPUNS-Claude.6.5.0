"""
Dashboard Schemas
"""
from pydantic import BaseModel
from typing import Optional, List
from datetime import date


class DashboardStats(BaseModel):
    """Main dashboard statistics"""
    total_candidates: int
    pending_candidates: int
    total_employees: int
    active_employees: int
    total_factories: int
    pending_requests: int
    pending_timer_cards: int
    total_salary_current_month: int
    total_profit_current_month: int


class FactoryDashboard(BaseModel):
    """Factory dashboard"""
    factory_id: str
    factory_name: str
    total_employees: int
    active_employees: int
    current_month_hours: float
    current_month_salary: int
    current_month_revenue: int
    current_month_profit: int
    profit_margin: float


class EmployeeAlert(BaseModel):
    """Employee alerts"""
    employee_id: int
    employee_name: str
    alert_type: str  # zairyu_expiring, contract_ending, yukyu_expiring
    alert_date: date
    days_until: int
    message: str


class MonthlyTrend(BaseModel):
    """Monthly trend data"""
    month: str
    total_employees: int
    total_hours: float
    total_salary: int
    total_revenue: int
    total_profit: int


class TopPerformer(BaseModel):
    """Top performing employee"""
    employee_id: int
    employee_name: str
    factory_name: str
    total_hours: float
    attendance_rate: float
    performance_score: float


class RecentActivity(BaseModel):
    """Recent activity"""
    activity_type: str  # candidate_registered, employee_hired, salary_calculated
    description: str
    timestamp: str
    user: Optional[str]


class AdminDashboard(BaseModel):
    """Admin dashboard response"""
    stats: DashboardStats
    factories: List[FactoryDashboard]
    alerts: List[EmployeeAlert]
    monthly_trends: List[MonthlyTrend]
    recent_activities: List[RecentActivity]


class EmployeeDashboard(BaseModel):
    """Employee dashboard"""
    employee_id: int
    employee_name: str
    factory_name: str
    position: str
    hire_date: date
    current_salary: int
    yukyu_remaining: int
    last_payment: Optional[int]
    last_payment_date: Optional[date]
    current_month_hours: float
    pending_requests: int


class CoordinatorDashboard(BaseModel):
    """Coordinator dashboard"""
    assigned_factories: List[FactoryDashboard]
    total_employees_supervised: int
    pending_approvals: int
    recent_activities: List[RecentActivity]


class YukyuTrendMonth(BaseModel):
    """Monthly yukyu trend data"""
    month: str  # Format: "2025-01"
    total_approved_days: float  # Total yukyu days approved in month
    employees_with_yukyu: int  # Count of employees with approved yukyu
    total_deduction_jpy: float  # Total deduction amount in JPY
    avg_deduction_per_employee: float  # Average deduction per employee


class YukyuComplianceDetail(BaseModel):
    """Individual employee compliance detail"""
    employee_id: int
    employee_name: str
    total_used_this_year: float  # Total yukyu days used (used + deducted)
    total_remaining: float  # Remaining yukyu days
    legal_minimum: float  # Minimum required by law (5 days)
    is_compliant: bool  # Whether employee meets legal minimum
    warning: Optional[str]  # Warning message if below minimum


class YukyuComplianceStatus(BaseModel):
    """Yukyu compliance status for all employees"""
    period: str  # Format: "2025-01" or fiscal year
    total_employees: int
    compliant_employees: int  # Employees with >= 5 days remaining
    non_compliant_employees: int  # Employees with < 5 days remaining
    employees_details: List[YukyuComplianceDetail]
