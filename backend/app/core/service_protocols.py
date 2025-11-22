"""
Service Protocol Interfaces for Dependency Injection
UNS-ClaudeJP Backend - FASE 4 Task #1

This module defines Protocol interfaces for all services to ensure type safety
and provide clear contracts for service implementations.
"""
from typing import Protocol, Optional, List, runtime_checkable
from sqlalchemy.orm import Session
from datetime import datetime, date

from app.models.models import User, Candidate, Employee


@runtime_checkable
class BaseService(Protocol):
    """Base protocol for all services"""
    pass


@runtime_checkable
class DatabaseServiceProtocol(Protocol):
    """Protocol for services that require database access"""
    db: Session


@runtime_checkable
class AuthServiceProtocol(Protocol):
    """Protocol for authentication service"""
    
    @staticmethod
    def verify_password(plain_password: str, hashed_password: str) -> bool:
        """Verify password against hash"""
        ...
    
    @staticmethod
    def get_password_hash(password: str) -> str:
        """Hash a password"""
        ...
    
    def create_access_token(self, data: dict) -> str:
        """Create JWT access token"""
        ...


@runtime_checkable
class CandidateServiceProtocol(DatabaseServiceProtocol):
    """Protocol for candidate service"""
    
    async def create_candidate(self, candidate_data, current_user: User) -> Candidate:
        """Create a new candidate"""
        ...
    
    async def get_candidate(self, candidate_id: int) -> Optional[Candidate]:
        """Get candidate by ID"""
        ...
    
    async def update_candidate(self, candidate_id: int, updates, current_user: User) -> Candidate:
        """Update candidate"""
        ...


@runtime_checkable
class ApartmentServiceProtocol(DatabaseServiceProtocol):
    """Protocol for apartment service"""
    
    def get_all_apartments(self) -> List:
        """Get all apartments"""
        ...


@runtime_checkable
class PayrollServiceProtocol(DatabaseServiceProtocol):
    """Protocol for payroll service"""
    pass


@runtime_checkable
class AuditServiceProtocol(DatabaseServiceProtocol):
    """Protocol for audit service"""
    pass


@runtime_checkable
class NotificationServiceProtocol(DatabaseServiceProtocol):
    """Protocol for notification service"""
    pass


# Additional service protocols can be added as needed
