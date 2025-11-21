"""
API routers package for UNS-ClaudeJP 5.4.1

This module exports all FastAPI router modules for easy importing in main.py.
Use: from app.api import auth, candidates, employees

API Modules (24 routers):
- auth: JWT authentication and user management
- admin: Admin panel and system administration
- apartments_v2: Apartment management V2 with advanced features
- audit: Audit log tracking and reporting
- azure_ocr: Azure Vision OCR integration
- candidates: Candidate (履歴書/Rirekisho) CRUD + OCR processing
- contracts: Contract management
- dashboard: Statistics and analytics
- database: Database management utilities
- employees: Employee (派遣社員) management
- factories: Factory/client (派遣先) site management
- import_export: Data import/export utilities
- monitoring: System health monitoring
- notifications: Email/LINE notification management
- pages: Page management
- payroll: Payroll processing and calculations
- reports: PDF report generation
- requests: Leave request (申請) workflow
- resilient_import: Resilient data import utilities
- role_permissions: Role-based access control (RBAC)
- salary: Salary (給与) calculations and management
- settings: Application settings management
- timer_cards: Attendance (タイムカード) tracking with shift types
- yukyu: Yukyu (有給休暇 - Paid Vacation) management

Each module contains a 'router' variable (APIRouter instance).
"""

# Import all router modules for easy access
# Using relative imports to avoid circular import issues
from . import (
    admin,
    apartments_v2,
    audit,
    auth,
    azure_ocr,
    candidates,
    contracts,
    dashboard,
    database,
    employees,
    factories,
    import_export,
    monitoring,
    notifications,
    pages,
    payroll,
    reports,
    requests,
    resilient_import,
    role_permissions,
    salary,
    settings,
    timer_cards,
    yukyu,
)

__all__ = [
    "admin",
    "apartments_v2",
    "audit",
    "auth",
    "azure_ocr",
    "candidates",
    "contracts",
    "dashboard",
    "database",
    "employees",
    "factories",
    "import_export",
    "monitoring",
    "notifications",
    "pages",
    "payroll",
    "reports",
    "requests",
    "resilient_import",
    "role_permissions",
    "salary",
    "settings",
    "timer_cards",
    "yukyu",
]
