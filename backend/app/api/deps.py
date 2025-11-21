"""
Common dependencies for API routes
"""
from fastapi import Depends, HTTPException, status, Query
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.orm import Session
from typing import Optional, List

from app.core.database import get_db
from app.models.models import User, PageVisibility
from app.services.auth_service import AuthService

# Initialize services
auth_service = AuthService()

# Security scheme
security = HTTPBearer()


def get_current_user(
    db: Session = Depends(get_db),
    credentials: HTTPAuthorizationCredentials = Depends(security)
) -> User:
    """
    Get current authenticated user
    """
    return auth_service.get_current_active_user(db=db, token=credentials.credentials)


def require_admin(
    current_user: User = Depends(get_current_user)
) -> User:
    """
    Require admin role to access endpoint
    """
    if current_user.role not in ["SUPER_ADMIN", "ADMIN"]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Insufficient permissions. Admin access required."
        )
    return current_user


def get_page_visibility(
    page_key: str,
    db: Session = Depends(get_db)
) -> Optional[PageVisibility]:
    """
    Get page visibility configuration
    """
    page = db.query(PageVisibility).filter(PageVisibility.page_key == page_key).first()
    return page
