"""
Common dependencies for API routes - REFACTORED for DI (FASE 4 Task #1)

This module provides common FastAPI dependencies used across all API routes.
Now uses the centralized DI container for service instantiation.

Key Changes:
- AuthService now injected via get_auth_service() from DI container
- Maintains backward compatibility with existing routes
- Clear separation between authentication and service dependencies
"""
from fastapi import Depends, HTTPException, status, Query
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.orm import Session
from typing import Optional, List

from app.core.database import get_db
from app.core.di import get_auth_service
from app.models.models import User, PageVisibility
from app.services.auth_service import AuthService

# Security scheme
security = HTTPBearer()


def get_current_user(
    db: Session = Depends(get_db),
    credentials: HTTPAuthorizationCredentials = Depends(security),
    auth_service: AuthService = Depends(get_auth_service)
) -> User:
    """
    Get current authenticated user.
    
    Now uses dependency injection for AuthService.
    
    Args:
        db: Database session (injected)
        credentials: HTTP Bearer credentials (injected)
        auth_service: AuthService instance (injected via DI)
    
    Returns:
        User: Current authenticated user
    
    Raises:
        HTTPException: If authentication fails
    """
    return auth_service.get_current_active_user(db=db, token=credentials.credentials)


def require_admin(
    current_user: User = Depends(get_current_user)
) -> User:
    """
    Require admin role to access endpoint.
    
    Args:
        current_user: Current authenticated user (injected)
    
    Returns:
        User: Current user if admin
    
    Raises:
        HTTPException: If user is not admin
    """
    if current_user.role not in ["SUPER_ADMIN", "ADMIN"]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Insufficient permissions. Admin access required."
        )
    return current_user


def require_super_admin(
    current_user: User = Depends(get_current_user)
) -> User:
    """
    Require super admin role to access endpoint.
    
    Args:
        current_user: Current authenticated user (injected)
    
    Returns:
        User: Current user if super admin
    
    Raises:
        HTTPException: If user is not super admin
    """
    if current_user.role != "SUPER_ADMIN":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Insufficient permissions. Super Admin access required."
        )
    return current_user


def get_page_visibility(
    page_key: str,
    db: Session = Depends(get_db)
) -> Optional[PageVisibility]:
    """
    Get page visibility configuration.
    
    Args:
        page_key: Page identifier key
        db: Database session (injected)
    
    Returns:
        Optional[PageVisibility]: Page visibility config or None
    """
    return db.query(PageVisibility).filter(PageVisibility.page_key == page_key).first()


def get_pagination_params(
    page: int = Query(1, ge=1, description="Page number (starting from 1)"),
    page_size: int = Query(50, ge=1, le=100, description="Items per page (max 100)")
) -> dict:
    """
    Get pagination parameters with validation.
    
    Args:
        page: Page number (1-indexed)
        page_size: Number of items per page
    
    Returns:
        dict: Pagination parameters {offset, limit, page, page_size}
    """
    offset = (page - 1) * page_size
    return {
        "offset": offset,
        "limit": page_size,
        "page": page,
        "page_size": page_size
    }


# Backward compatibility: Export commonly used dependencies
__all__ = [
    "security",
    "get_db",
    "get_current_user",
    "require_admin",
    "require_super_admin",
    "get_page_visibility",
    "get_pagination_params",
]
