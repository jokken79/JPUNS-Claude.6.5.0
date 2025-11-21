"""
ORM Models for UNS-ClaudeJP 5.2

This module exports all SQLAlchemy models and enums for easy importing.
Use: from app.models import User, Candidate, Employee

Contains 13 database tables:
- Core Personnel: User, Candidate, Employee, ContractWorker, Staff
- Business: Factory, Apartment, Document, Contract
- Operations: TimerCard, SalaryCalculation, Request
- System: AuditLog, SocialInsuranceRate, SystemSettings
"""

from app.models.models import (
    # Enums
    UserRole,
    CandidateStatus,
    DocumentType,
    RequestType,
    RequestStatus,
    ShiftType,

    # Core Personnel Models
    User,
    Candidate,
    CandidateForm,
    Employee,
    ContractWorker,
    Staff,

    # Business Models
    Factory,
    Apartment,
    Document,
    Contract,

    # Operations Models
    TimerCard,
    SalaryCalculation,
    Request,

    # System Models
    AuditLog,
    SocialInsuranceRate,
    SystemSettings,
)

__all__ = [
    # Enums
    "UserRole",
    "CandidateStatus",
    "DocumentType",
    "RequestType",
    "RequestStatus",
    "ShiftType",

    # Core Personnel Models
    "User",
    "Candidate",
    "CandidateForm",
    "Employee",
    "ContractWorker",
    "Staff",

    # Business Models
    "Factory",
    "Apartment",
    "Document",
    "Contract",

    # Operations Models
    "TimerCard",
    "SalaryCalculation",
    "Request",

    # System Models
    "AuditLog",
    "SocialInsuranceRate",
    "SystemSettings",
]
