"""
Business Logic Services for UNS-ClaudeJP 6.0.0

This module exports all service classes for dependency injection.
Use: from app.services import AuthService, HybridOCRService

Services:
- AuthService: JWT authentication and user management
- FaceDetectionService: MediaPipe face detection for photo verification
- HybridOCRService: Multi-provider OCR orchestration (Azure → EasyOCR → Tesseract)
- ImportService: Excel/CSV data import utilities
- NotificationService: Email and LINE notifications
- PayrollService: Salary calculation and payroll processing
- ReportService: PDF report generation

Note: Individual OCR services (AzureOCRService, EasyOCRService, TesseractOCRService)
were consolidated into HybridOCRService during v6.0.0 cleanup (SEMANA 3-4).
"""

from app.services.auth_service import AuthService
from app.services.face_detection_service import FaceDetectionService
from app.services.hybrid_ocr_service import HybridOCRService
from app.services.import_service import ImportService
from app.services.notification_service import NotificationService
from app.services.payroll.payroll_service import PayrollService
from app.services.report_service import ReportService

__all__ = [
    "AuthService",
    "FaceDetectionService",
    "HybridOCRService",
    "ImportService",
    "NotificationService",
    "PayrollService",
    "ReportService",
]
