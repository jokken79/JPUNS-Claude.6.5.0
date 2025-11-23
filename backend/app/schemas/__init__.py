"""
Pydantic Schemas for UNS-ClaudeJP 5.4.1

This module exports all Pydantic models for request/response validation.
Use: from app.schemas import CandidateCreate, EmployeeResponse

Organized by functional module:
- Authentication: User, login, registration schemas
- Candidates: Candidate management and OCR schemas
- Employees: Employee management schemas
- Factories: Factory/client site schemas
- Timer Cards: Attendance tracking schemas
- Salary: Payroll calculation schemas (legacy)
- Unified Salary: NEW consolidated salary/payroll schemas (RECOMMENDED)
- Requests: Leave request workflow schemas
- Dashboard: Analytics and statistics schemas
- Base/Common: Shared base schemas, pagination, responses

NEW in v5.4.1:
--------------
Unified Salary Schema (salary_unified.py):
- Consolidates salary.py + payroll.py into single comprehensive module
- Improved type safety with Pydantic validators
- Complete request/response patterns
- Detailed documentation and examples
- For new code, import from salary_unified:
  from app.schemas import SalaryCalculateRequest, SalaryResponse
"""

# Authentication schemas
from app.schemas.auth import (
    UserLogin,
    UserRegister,
    Token,
    TokenData,
    UserResponse,
    UserUpdate,
    PasswordChange,
)

# Base/Common schemas
from app.schemas.base import (
    ResponseBase,
    ErrorResponse,
    PaginationParams,
    PaginatedResponse,
)

# Response schemas
from app.schemas.responses import (
    BaseResponse,
    OCRData,
    OCRResponse,
    CacheStatsResponse,
)

# Candidate schemas
from app.schemas.candidate import (
    CandidateBase,
    CandidateCreate,
    CandidateUpdate,
    CandidateResponse,
    DocumentUpload,
    CandidateApprove,
    CandidateReject,
    RirekishoFormCreate,
    CandidateFormResponse,
)

# Employee schemas
from app.schemas.employee import (
    EmployeeBase,
    EmployeeCreate,
    EmployeeUpdate,
    EmployeeResponse,
    EmployeeTerminate,
    YukyuUpdate,
)

# Factory schemas
from app.schemas.factory import (
    FactoryBase,
    FactoryCreate,
    FactoryUpdate,
    FactoryResponse,
    FactoryConfig,
    FactoryStats,
)

# Timer Card schemas
from app.schemas.timer_card import (
    TimerCardBase,
    TimerCardCreate,
    TimerCardUpdate,
    TimerCardResponse,
    TimerCardBulkCreate,
    TimerCardProcessResult,
    TimerCardOCRData,
    TimerCardUploadResponse,
    TimerCardApprove,
)

# Salary schemas (legacy - use salary_unified for new code)
from app.schemas.salary import (
    SalaryCalculationBase,
    SalaryCalculate,
    SalaryCalculationResponse,
    SalaryBulkCalculate,
    SalaryBulkResult,
    SalaryMarkPaid,
    SalaryReport,
    SalaryStatistics,
)

# Unified Salary schemas (NEW - recommended for all new code)
from app.schemas.salary_unified import (
    # Enums
    SalaryStatus,
    PayrollRunStatus,

    # Helper Models
    HoursBreakdown as UnifiedHoursBreakdown,
    RatesConfiguration,
    SalaryAmounts,
    DeductionsDetail as UnifiedDeductionsDetail,
    PayrollSummary,
    TimerRecord as UnifiedTimerRecord,

    # Core Response
    SalaryCalculationResponse as UnifiedSalaryCalculationResponse,

    # Request Models
    SalaryCalculateRequest,
    SalaryBulkCalculateRequest,
    SalaryMarkPaidRequest,
    SalaryValidateRequest,
    SalaryUpdateRequest,

    # Response Models
    SalaryResponse,
    SalaryListResponse,
    BulkCalculateResponse,
    ValidationResult,
    SalaryStatistics as UnifiedSalaryStatistics,

    # Payslip Models
    PayslipGenerateRequest,
    PayslipResponse,

    # CRUD Models
    SalaryCreateResponse,
    SalaryUpdateResponse,
    SalaryDeleteResponse,

    # Error Models
    SalaryError,
)

# Request schemas
from app.schemas.request import (
    RequestBase,
    RequestCreate,
    RequestUpdate,
    RequestResponse,
    RequestReview,
    RequestStats,
    IkkikokokuRequest,
    TaishaRequest,
)

# Dashboard schemas
from app.schemas.dashboard import (
    DashboardStats,
    FactoryDashboard,
    EmployeeAlert,
    MonthlyTrend,
    TopPerformer,
    RecentActivity,
    AdminDashboard,
    EmployeeDashboard,
    CoordinatorDashboard,
)

# Settings schemas
from app.schemas.settings import (
    VisibilityToggleResponse,
    VisibilityToggleUpdate,
    SystemSettingResponse,
)

# Yukyu (有給休暇 - Paid Vacation) schemas
from app.schemas.yukyu import (
    YukyuBalanceBase,
    YukyuBalanceCreate,
    YukyuBalanceUpdate,
    YukyuBalanceResponse,
    YukyuBalanceSummary,
    YukyuRequestBase,
    YukyuRequestCreate,
    YukyuRequestUpdate,
    YukyuRequestApprove,
    YukyuRequestReject,
    YukyuRequestResponse,
    YukyuUsageDetailBase,
    YukyuUsageDetailCreate,
    YukyuUsageDetailResponse,
    YukyuCalculationRequest,
    YukyuCalculationResponse,
    YukyuReport,
    YukyuAlert,
    EmployeeByFactoryResponse,
)

# NEW in v5.4.1 - Missing Model Schemas (13 models)
# Document schemas
from app.schemas.document import (
    DocumentBase,
    DocumentCreate,
    DocumentUpdate,
    DocumentResponse,
)

# ContractWorker schemas
from app.schemas.contract_worker import (
    ContractWorkerBase,
    ContractWorkerCreate,
    ContractWorkerUpdate,
    ContractWorkerResponse,
)

# Staff schemas
from app.schemas.staff import (
    StaffBase,
    StaffCreate,
    StaffUpdate,
    StaffResponse,
)

# ApartmentFactory schemas
from app.schemas.apartment_factory import (
    ApartmentFactoryBase,
    ApartmentFactoryCreate,
    ApartmentFactoryUpdate,
    ApartmentFactoryResponse,
)

# Workplace schemas
from app.schemas.workplace import (
    WorkplaceBase,
    WorkplaceCreate,
    WorkplaceUpdate,
    WorkplaceResponse,
)

# Region schemas
from app.schemas.region import (
    RegionBase,
    RegionCreate,
    RegionUpdate,
    RegionResponse,
)

# Department schemas
from app.schemas.department import (
    DepartmentBase,
    DepartmentCreate,
    DepartmentUpdate,
    DepartmentResponse,
)

# ResidenceType schemas
from app.schemas.residence_type import (
    ResidenceTypeBase,
    ResidenceTypeCreate,
    ResidenceTypeUpdate,
    ResidenceTypeResponse,
)

# ResidenceStatus schemas
from app.schemas.residence_status import (
    ResidenceStatusBase,
    ResidenceStatusCreate,
    ResidenceStatusUpdate,
    ResidenceStatusResponse,
)

# SocialInsuranceRate schemas
from app.schemas.social_insurance_rate import (
    SocialInsuranceRateBase,
    SocialInsuranceRateCreate,
    SocialInsuranceRateUpdate,
    SocialInsuranceRateResponse,
)

# AuditLog schemas
from app.schemas.audit_log import (
    AuditLogBase,
    AuditLogCreate,
    AuditLogResponse,
)

# PageVisibility schemas
from app.schemas.page_visibility import (
    PageVisibilityBase,
    PageVisibilityCreate,
    PageVisibilityUpdate,
    PageVisibilityResponse,
)

# RolePagePermission schemas
from app.schemas.role_page_permission import (
    RolePagePermissionBase,
    RolePagePermissionCreate,
    RolePagePermissionUpdate,
    RolePagePermissionResponse,
)

# Apartment V2 Complete schemas (with all 35 fields)
from app.schemas.apartment_v2_complete import (
    RoomType,
    ApartmentStatus,
    ApartmentBaseV2Complete,
    ApartmentCreateV2Complete,
    ApartmentUpdateV2Complete,
    ApartmentResponseV2Complete,
    ApartmentWithEmployeesV2Complete,
)

__all__ = [
    # Authentication
    "UserLogin",
    "UserRegister",
    "Token",
    "TokenData",
    "UserResponse",
    "UserUpdate",
    "PasswordChange",

    # Base/Common
    "ResponseBase",
    "ErrorResponse",
    "PaginationParams",
    "PaginatedResponse",

    # Responses
    "BaseResponse",
    "OCRData",
    "OCRResponse",
    "CacheStatsResponse",

    # Candidates
    "CandidateBase",
    "CandidateCreate",
    "CandidateUpdate",
    "CandidateResponse",
    "DocumentUpload",
    "CandidateApprove",
    "CandidateReject",
    "RirekishoFormCreate",
    "CandidateFormResponse",

    # Employees
    "EmployeeBase",
    "EmployeeCreate",
    "EmployeeUpdate",
    "EmployeeResponse",
    "EmployeeTerminate",
    "YukyuUpdate",

    # Factories
    "FactoryBase",
    "FactoryCreate",
    "FactoryUpdate",
    "FactoryResponse",
    "FactoryConfig",
    "FactoryStats",

    # Timer Cards
    "TimerCardBase",
    "TimerCardCreate",
    "TimerCardUpdate",
    "TimerCardResponse",
    "TimerCardBulkCreate",
    "TimerCardProcessResult",
    "TimerCardOCRData",
    "TimerCardUploadResponse",
    "TimerCardApprove",

    # Salary (legacy)
    "SalaryCalculationBase",
    "SalaryCalculate",
    "SalaryCalculationResponse",
    "SalaryBulkCalculate",
    "SalaryBulkResult",
    "SalaryMarkPaid",
    "SalaryReport",
    "SalaryStatistics",

    # Unified Salary (NEW - recommended)
    "SalaryStatus",
    "PayrollRunStatus",
    "UnifiedHoursBreakdown",
    "RatesConfiguration",
    "SalaryAmounts",
    "UnifiedDeductionsDetail",
    "PayrollSummary",
    "UnifiedTimerRecord",
    "UnifiedSalaryCalculationResponse",
    "SalaryCalculateRequest",
    "SalaryBulkCalculateRequest",
    "SalaryMarkPaidRequest",
    "SalaryValidateRequest",
    "SalaryUpdateRequest",
    "SalaryResponse",
    "SalaryListResponse",
    "BulkCalculateResponse",
    "ValidationResult",
    "UnifiedSalaryStatistics",
    "PayslipGenerateRequest",
    "PayslipResponse",
    "SalaryCreateResponse",
    "SalaryUpdateResponse",
    "SalaryDeleteResponse",
    "SalaryError",

    # Requests
    "RequestBase",
    "RequestCreate",
    "RequestUpdate",
    "RequestResponse",
    "RequestReview",
    "RequestStats",
    "IkkikokokuRequest",
    "TaishaRequest",

    # Dashboard
    "DashboardStats",
    "FactoryDashboard",
    "EmployeeAlert",
    "MonthlyTrend",
    "TopPerformer",
    "RecentActivity",
    "AdminDashboard",
    "EmployeeDashboard",
    "CoordinatorDashboard",

    # Settings
    "VisibilityToggleResponse",
    "VisibilityToggleUpdate",
    "SystemSettingResponse",

    # Yukyu (有給休暇 - Paid Vacation)
    "YukyuBalanceBase",
    "YukyuBalanceCreate",
    "YukyuBalanceUpdate",
    "YukyuBalanceResponse",
    "YukyuBalanceSummary",
    "YukyuRequestBase",
    "YukyuRequestCreate",
    "YukyuRequestUpdate",
    "YukyuRequestApprove",
    "YukyuRequestReject",
    "YukyuRequestResponse",
    "YukyuUsageDetailBase",
    "YukyuUsageDetailCreate",
    "YukyuUsageDetailResponse",
    "YukyuCalculationRequest",
    "YukyuCalculationResponse",
    "YukyuReport",
    "YukyuAlert",
    "EmployeeByFactoryResponse",

    # NEW in v5.4.1 - Missing Model Schemas
    # Documents
    "DocumentBase",
    "DocumentCreate",
    "DocumentUpdate",
    "DocumentResponse",

    # ContractWorker
    "ContractWorkerBase",
    "ContractWorkerCreate",
    "ContractWorkerUpdate",
    "ContractWorkerResponse",

    # Staff
    "StaffBase",
    "StaffCreate",
    "StaffUpdate",
    "StaffResponse",

    # ApartmentFactory
    "ApartmentFactoryBase",
    "ApartmentFactoryCreate",
    "ApartmentFactoryUpdate",
    "ApartmentFactoryResponse",

    # Workplace
    "WorkplaceBase",
    "WorkplaceCreate",
    "WorkplaceUpdate",
    "WorkplaceResponse",

    # Region
    "RegionBase",
    "RegionCreate",
    "RegionUpdate",
    "RegionResponse",

    # Department
    "DepartmentBase",
    "DepartmentCreate",
    "DepartmentUpdate",
    "DepartmentResponse",

    # ResidenceType
    "ResidenceTypeBase",
    "ResidenceTypeCreate",
    "ResidenceTypeUpdate",
    "ResidenceTypeResponse",

    # ResidenceStatus
    "ResidenceStatusBase",
    "ResidenceStatusCreate",
    "ResidenceStatusUpdate",
    "ResidenceStatusResponse",

    # SocialInsuranceRate
    "SocialInsuranceRateBase",
    "SocialInsuranceRateCreate",
    "SocialInsuranceRateUpdate",
    "SocialInsuranceRateResponse",

    # AuditLog
    "AuditLogBase",
    "AuditLogCreate",
    "AuditLogResponse",

    # PageVisibility
    "PageVisibilityBase",
    "PageVisibilityCreate",
    "PageVisibilityUpdate",
    "PageVisibilityResponse",

    # RolePagePermission
    "RolePagePermissionBase",
    "RolePagePermissionCreate",
    "RolePagePermissionUpdate",
    "RolePagePermissionResponse",

    # Apartment V2 Complete (all 35 fields)
    "RoomType",
    "ApartmentStatus",
    "ApartmentBaseV2Complete",
    "ApartmentCreateV2Complete",
    "ApartmentUpdateV2Complete",
    "ApartmentResponseV2Complete",
    "ApartmentWithEmployeesV2Complete",
]
