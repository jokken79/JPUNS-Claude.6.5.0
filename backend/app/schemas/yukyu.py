"""
Yukyu (有給休暇 - Paid Vacation) Schemas
"""
from pydantic import BaseModel, ConfigDict, Field
from typing import Optional, List
from datetime import date, datetime
from decimal import Decimal


# ============================================
# YUKYU BALANCE SCHEMAS
# ============================================

class YukyuBalanceBase(BaseModel):
    """Base yukyu balance schema"""
    employee_id: int
    fiscal_year: int
    assigned_date: date
    months_worked: int
    days_assigned: int = 0
    days_carried_over: int = 0
    days_total: int = 0
    days_used: int = 0
    days_remaining: int = 0
    days_expired: int = 0
    days_available: int = 0
    expires_on: date
    status: str = "active"
    notes: Optional[str] = None


class YukyuBalanceCreate(BaseModel):
    """Create yukyu balance"""
    employee_id: int
    fiscal_year: int
    assigned_date: date
    months_worked: int
    days_assigned: int
    days_carried_over: int = 0
    expires_on: date
    notes: Optional[str] = None


class YukyuBalanceUpdate(BaseModel):
    """Update yukyu balance"""
    days_assigned: Optional[int] = None
    days_carried_over: Optional[int] = None
    days_used: Optional[int] = None
    days_expired: Optional[int] = None
    status: Optional[str] = None
    notes: Optional[str] = None


class YukyuBalanceResponse(YukyuBalanceBase):
    """Yukyu balance response"""
    id: int
    created_at: datetime
    updated_at: Optional[datetime] = None

    model_config = ConfigDict(from_attributes=True)


class YukyuBalanceSummary(BaseModel):
    """Summary of all yukyu balances for an employee (or aggregate for admins)"""
    employee_id: Optional[int] = None  # None for admin aggregate view
    employee_name: str
    total_available: int
    total_used: int
    total_expired: int
    balances: List[YukyuBalanceResponse]
    oldest_expiration_date: Optional[date] = None
    needs_to_use_minimum_5_days: bool = False  # Alert if hasn't used 5 days


# ============================================
# YUKYU REQUEST SCHEMAS
# ============================================

class YukyuRequestBase(BaseModel):
    """Base yukyu request schema"""
    employee_id: int
    factory_id: Optional[int] = None
    request_type: str = "yukyu"  # yukyu, hankyu, ikkikokoku, taisha
    start_date: date
    end_date: date
    days_requested: Decimal = Field(..., ge=0.5, le=40.0, decimal_places=1)
    notes: Optional[str] = None


class YukyuRequestCreate(YukyuRequestBase):
    """Create yukyu request (by TANTOSHA)"""
    pass


class YukyuRequestUpdate(BaseModel):
    """Update yukyu request"""
    start_date: Optional[date] = None
    end_date: Optional[date] = None
    days_requested: Optional[Decimal] = None
    notes: Optional[str] = None


class YukyuRequestApprove(BaseModel):
    """Approve yukyu request (by KEITOSAN - Finance Manager)"""
    notes: Optional[str] = None


class YukyuRequestReject(BaseModel):
    """Reject yukyu request (by KEITOSAN - Finance Manager)"""
    rejection_reason: str


class YukyuRequestResponse(YukyuRequestBase):
    """Yukyu request response"""
    id: int
    requested_by_user_id: int
    yukyu_available_at_request: int
    request_date: datetime
    status: str  # pending, approved, rejected
    approved_by_user_id: Optional[int] = None
    approval_date: Optional[datetime] = None
    rejection_reason: Optional[str] = None
    created_at: datetime
    updated_at: Optional[datetime] = None

    # Additional info
    employee_name: Optional[str] = None
    factory_name: Optional[str] = None
    requested_by_name: Optional[str] = None
    approved_by_name: Optional[str] = None

    model_config = ConfigDict(from_attributes=True)


# ============================================
# YUKYU USAGE DETAIL SCHEMAS
# ============================================

class YukyuUsageDetailBase(BaseModel):
    """Base yukyu usage detail schema"""
    request_id: int
    balance_id: int
    usage_date: date
    days_deducted: Decimal = Field(default=Decimal("1.0"), ge=0.5, le=1.0, decimal_places=1)


class YukyuUsageDetailCreate(YukyuUsageDetailBase):
    """Create yukyu usage detail"""
    pass


class YukyuUsageDetailResponse(YukyuUsageDetailBase):
    """Yukyu usage detail response"""
    id: int
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


# ============================================
# CALCULATION & REPORT SCHEMAS
# ============================================

class YukyuCalculationRequest(BaseModel):
    """Request to calculate yukyus for an employee"""
    employee_id: int
    calculation_date: Optional[date] = None  # Defaults to today


class YukyuCalculationResponse(BaseModel):
    """Result of yukyu calculation"""
    employee_id: int
    employee_name: str
    hire_date: date
    months_since_hire: int
    yukyus_created: int  # Number of new balances created
    total_available_days: int
    message: str


class YukyuReport(BaseModel):
    """Report of yukyus by factory or employee"""
    total_employees: int
    total_available_days: int
    total_used_days: int
    total_expired_days: int
    employees_need_to_use_5_days: int  # Count of employees who haven't used 5 days
    upcoming_expirations: List[dict]  # List of balances expiring soon


class YukyuAlert(BaseModel):
    """Alert for yukyu issues"""
    employee_id: int
    employee_name: str
    alert_type: str  # "expiring_soon", "needs_5_days", "expired"
    days_affected: int
    expiration_date: Optional[date] = None
    message: str


# ============================================
# EMPLOYEE BY FACTORY SCHEMA
# ============================================

class EmployeeByFactoryResponse(BaseModel):
    """Employee info for yukyu request creation"""
    id: int
    rirekisho_id: Optional[str]
    full_name_kanji: str
    full_name_kana: Optional[str] = None
    factory_id: Optional[str]
    factory_name: Optional[str]
    hire_date: Optional[date]
    yukyu_available: int  # Total yukyu days currently available

    model_config = ConfigDict(from_attributes=True)


# ============================================
# YUKYU HISTORY SCHEMA (Extended with request/balance info)
# ============================================

class YukyuUsageHistoryResponse(BaseModel):
    """
    Extended yukyu usage detail with request and balance information.
    Used for displaying complete history including expired yukyus from past years.
    """
    id: int
    request_id: int
    balance_id: int
    usage_date: date
    days_deducted: Decimal

    # Request information
    request_type: str  # 'yukyu', 'hankyu', 'ikkikokoku', 'taisha'
    request_status: str  # 'pending', 'approved', 'rejected'
    request_start_date: date
    request_end_date: date

    # Balance information (which fiscal year was used)
    fiscal_year: int
    balance_status: str  # 'ACTIVE', 'EXPIRED', 'USED_UP'

    # Optional notes
    notes: Optional[str] = None

    model_config = ConfigDict(from_attributes=True)
