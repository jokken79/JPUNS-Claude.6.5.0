"""
Dependency Injection Container for UNS-ClaudeJP Backend
FASE 4 Task #1: Service Layer Refactoring with DI

This module provides centralized service instantiation using FastAPI's
native dependency injection system. All services should be obtained through
these factory functions to ensure proper lifecycle management and testability.

Architecture:
- Uses FastAPI Depends() for declarative dependency injection
- Services are instantiated per-request (stateless or request-scoped)
- Database sessions are properly managed via get_db()
- Type-safe with full mypy support
- Easy to test with dependency overrides

Usage in routes:
    from app.core.di import get_candidate_service
    from fastapi import Depends
    
    @router.post("/candidates")
    async def create_candidate(
        candidate_service: CandidateService = Depends(get_candidate_service)
    ):
        return await candidate_service.create_candidate(...)
"""
from typing import Optional
from fastapi import Depends
from sqlalchemy.orm import Session

from app.core.database import get_db

# Import all services
from app.services.auth_service import AuthService
from app.services.candidate_service import CandidateService
from app.services.apartment_service import ApartmentService
from app.services.audit_service import AuditService
from app.services.notification_service import NotificationService
from app.services.photo_service import PhotoService
from app.services.report_service import ReportService
from app.services.cache_service import CacheService
from app.services.analytics_service import AnalyticsService
from app.services.import_service import ImportService
from app.services.config_service import PayrollConfigService
from app.services.employee_matching_service import EmployeeMatchingService
from app.services.hybrid_ocr_service import HybridOCRService
from app.services.ai_gateway import AIGatewayService
from app.services.ai_usage_service import AIUsageService
from app.services.ai_budget_service import AIBudgetService
from app.services.additional_charge_service import AdditionalChargeService
from app.services.assignment_service import AssignmentService
from app.services.yukyu_service import YukyuService
from app.services.ocr_cache_service import OCRCacheService
from app.services.face_detection_service import FaceDetectionService
from app.services.timer_card_ocr_service import TimerCardOCRService
from app.services.payroll.payroll_service import PayrollService


# ==============================================================================
# TIER 1 SERVICES - Foundation (Highest Priority)
# ==============================================================================

def get_auth_service() -> AuthService:
    """
    Get AuthService instance (stateless singleton pattern).
    
    AuthService is stateless and uses static methods for most operations.
    Can be safely instantiated per-request without performance penalty.
    
    Returns:
        AuthService: Authenticated service instance
    """
    return AuthService()


def get_candidate_service(db: Session = Depends(get_db)) -> CandidateService:
    """
    Get CandidateService instance with database session.
    
    Args:
        db: SQLAlchemy database session (injected via Depends)
    
    Returns:
        CandidateService: Candidate service instance
    """
    return CandidateService(db=db)


# ==============================================================================
# TIER 2 SERVICES - Core Business Logic
# ==============================================================================

def get_apartment_service(db: Session = Depends(get_db)) -> ApartmentService:
    """
    Get ApartmentService instance with database session.
    
    Args:
        db: SQLAlchemy database session (injected via Depends)
    
    Returns:
        ApartmentService: Apartment service instance
    """
    return ApartmentService(db=db)


def get_audit_service(db: Session = Depends(get_db)) -> AuditService:
    """
    Get AuditService instance with database session.
    
    Args:
        db: SQLAlchemy database session (injected via Depends)
    
    Returns:
        AuditService: Audit service instance
    """
    return AuditService(db=db)


def get_notification_service(db: Session = Depends(get_db)) -> NotificationService:
    """
    Get NotificationService instance with database session.
    
    Args:
        db: SQLAlchemy database session (injected via Depends)
    
    Returns:
        NotificationService: Notification service instance
    """
    return NotificationService(db=db)


def get_payroll_service(db: Session = Depends(get_db)) -> PayrollService:
    """
    Get PayrollService instance with database session.
    
    Args:
        db: SQLAlchemy database session (injected via Depends)
    
    Returns:
        PayrollService: Payroll service instance
    """
    return PayrollService(db_session=db)


def get_assignment_service(db: Session = Depends(get_db)) -> AssignmentService:
    """
    Get AssignmentService instance with database session.
    
    Args:
        db: SQLAlchemy database session (injected via Depends)
    
    Returns:
        AssignmentService: Assignment service instance
    """
    return AssignmentService(db=db)


def get_additional_charge_service(db: Session = Depends(get_db)) -> AdditionalChargeService:
    """
    Get AdditionalChargeService instance with database session.
    
    Args:
        db: SQLAlchemy database session (injected via Depends)
    
    Returns:
        AdditionalChargeService: Additional charge service instance
    """
    return AdditionalChargeService(db=db)


# ==============================================================================
# TIER 3 SERVICES - Extended Functionality
# ==============================================================================

def get_photo_service() -> PhotoService:
    """
    Get PhotoService instance (stateless).
    
    Returns:
        PhotoService: Photo service instance
    """
    return PhotoService()


def get_report_service(db: Session = Depends(get_db)) -> ReportService:
    """
    Get ReportService instance with database session.
    
    Args:
        db: SQLAlchemy database session (injected via Depends)
    
    Returns:
        ReportService: Report service instance
    """
    return ReportService(db=db)


def get_cache_service() -> CacheService:
    """
    Get CacheService instance.
    
    Returns:
        CacheService: Cache service instance
    """
    return CacheService()


def get_analytics_service(db: Session = Depends(get_db)) -> AnalyticsService:
    """
    Get AnalyticsService instance with database session.
    
    Args:
        db: SQLAlchemy database session (injected via Depends)
    
    Returns:
        AnalyticsService: Analytics service instance
    """
    return AnalyticsService(db=db)


def get_import_service(db: Session = Depends(get_db)) -> ImportService:
    """
    Get ImportService instance with database session.
    
    Args:
        db: SQLAlchemy database session (injected via Depends)
    
    Returns:
        ImportService: Import service instance
    """
    return ImportService(db=db)


def get_payroll_config_service(db: Session = Depends(get_db)) -> PayrollConfigService:
    """
    Get PayrollConfigService instance with database session.
    
    Args:
        db: SQLAlchemy database session (injected via Depends)
    
    Returns:
        PayrollConfigService: Payroll config service instance
    """
    return PayrollConfigService(db=db)


def get_employee_matching_service(db: Session = Depends(get_db)) -> EmployeeMatchingService:
    """
    Get EmployeeMatchingService instance with database session.
    
    Args:
        db: SQLAlchemy database session (injected via Depends)
    
    Returns:
        EmployeeMatchingService: Employee matching service instance
    """
    return EmployeeMatchingService(db=db)


def get_hybrid_ocr_service(db: Session = Depends(get_db)) -> HybridOCRService:
    """
    Get HybridOCRService instance with database session.
    
    Args:
        db: SQLAlchemy database session (injected via Depends)
    
    Returns:
        HybridOCRService: Hybrid OCR service instance
    """
    return HybridOCRService(db=db)


def get_ai_gateway_service(db: Session = Depends(get_db)) -> AIGatewayService:
    """
    Get AIGatewayService instance with database session.
    
    Args:
        db: SQLAlchemy database session (injected via Depends)
    
    Returns:
        AIGatewayService: AI Gateway service instance
    """
    return AIGatewayService(db=db)


def get_ai_usage_service(db: Session = Depends(get_db)) -> AIUsageService:
    """
    Get AIUsageService instance with database session.
    
    Args:
        db: SQLAlchemy database session (injected via Depends)
    
    Returns:
        AIUsageService: AI Usage service instance
    """
    return AIUsageService(db=db)


def get_ai_budget_service(db: Session = Depends(get_db)) -> AIBudgetService:
    """
    Get AIBudgetService instance with database session.
    
    Args:
        db: SQLAlchemy database session (injected via Depends)
    
    Returns:
        AIBudgetService: AI Budget service instance
    """
    return AIBudgetService(db=db)


def get_yukyu_service(db: Session = Depends(get_db)) -> YukyuService:
    """
    Get YukyuService instance with database session.
    
    Args:
        db: SQLAlchemy database session (injected via Depends)
    
    Returns:
        YukyuService: Yukyu (paid leave) service instance
    """
    return YukyuService(db=db)


def get_ocr_cache_service(db: Session = Depends(get_db)) -> OCRCacheService:
    """
    Get OCRCacheService instance with database session.
    
    Args:
        db: SQLAlchemy database session (injected via Depends)
    
    Returns:
        OCRCacheService: OCR Cache service instance
    """
    return OCRCacheService(db=db)


def get_face_detection_service() -> FaceDetectionService:
    """
    Get FaceDetectionService instance.
    
    Returns:
        FaceDetectionService: Face detection service instance
    """
    return FaceDetectionService()


def get_timer_card_ocr_service(db: Session = Depends(get_db)) -> TimerCardOCRService:
    """
    Get TimerCardOCRService instance with database session.
    
    Args:
        db: SQLAlchemy database session (injected via Depends)
    
    Returns:
        TimerCardOCRService: Timer card OCR service instance
    """
    return TimerCardOCRService(db=db)


# ==============================================================================
# SERVICE REGISTRY - For reflection and testing
# ==============================================================================

SERVICE_REGISTRY = {
    # Tier 1 - Foundation
    "auth": get_auth_service,
    "candidate": get_candidate_service,
    
    # Tier 2 - Core Business
    "apartment": get_apartment_service,
    "audit": get_audit_service,
    "notification": get_notification_service,
    "payroll": get_payroll_service,
    "assignment": get_assignment_service,
    "additional_charge": get_additional_charge_service,
    
    # Tier 3 - Extended
    "photo": get_photo_service,
    "report": get_report_service,
    "cache": get_cache_service,
    "analytics": get_analytics_service,
    "import": get_import_service,
    "payroll_config": get_payroll_config_service,
    "employee_matching": get_employee_matching_service,
    "hybrid_ocr": get_hybrid_ocr_service,
    "ai_gateway": get_ai_gateway_service,
    "ai_usage": get_ai_usage_service,
    "ai_budget": get_ai_budget_service,
    "yukyu": get_yukyu_service,
    "ocr_cache": get_ocr_cache_service,
    "face_detection": get_face_detection_service,
    "timer_card_ocr": get_timer_card_ocr_service,
}


def get_service(service_name: str):
    """
    Get service factory function by name (for dynamic access).
    
    Args:
        service_name: Name of the service (e.g., "candidate", "auth")
    
    Returns:
        Service factory function
    
    Raises:
        KeyError: If service name not found
    """
    if service_name not in SERVICE_REGISTRY:
        raise KeyError(f"Service '{service_name}' not found in registry")
    return SERVICE_REGISTRY[service_name]


__all__ = [
    # Tier 1
    "get_auth_service",
    "get_candidate_service",
    # Tier 2
    "get_apartment_service",
    "get_audit_service",
    "get_notification_service",
    "get_payroll_service",
    "get_assignment_service",
    "get_additional_charge_service",
    # Tier 3
    "get_photo_service",
    "get_report_service",
    "get_cache_service",
    "get_analytics_service",
    "get_import_service",
    "get_payroll_config_service",
    "get_employee_matching_service",
    "get_hybrid_ocr_service",
    "get_ai_gateway_service",
    "get_ai_usage_service",
    "get_ai_budget_service",
    "get_yukyu_service",
    "get_ocr_cache_service",
    "get_face_detection_service",
    "get_timer_card_ocr_service",
    # Utilities
    "SERVICE_REGISTRY",
    "get_service",
]
