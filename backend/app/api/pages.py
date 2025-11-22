"""
Page Visibility API Endpoints
Control which pages are visible/enabled to users
"""

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import desc
from datetime import datetime
from typing import List

from app.core.database import get_db
from fastapi import Request
from app.core.cache import cache, CacheKey, CacheTTL
from app.core.response import success_response, created_response, paginated_response, no_content_response
from app.api.deps import get_current_user
from app.models.models import PageVisibility, User, UserRole

router = APIRouter(prefix="/api/pages", tags=["pages"])


# ============================================
# SCHEMAS (Pydantic)
# ============================================

from pydantic import BaseModel
from app.core.rate_limiter import limiter

class PageVisibilityResponse(BaseModel):
    id: int
    page_key: str
    page_name: str
    page_name_en: str | None
    is_enabled: bool
    path: str
    description: str | None
    disabled_message: str | None
    last_toggled_by: int | None
    last_toggled_at: datetime | None

    class Config:
        from_attributes = True


class PageVisibilityToggle(BaseModel):
    is_enabled: bool
    disabled_message: str | None = None


# ============================================
# ENDPOINTS
# ============================================

@router.get("/visibility", response_model=List[PageVisibilityResponse])
@cache.cached(ttl=CacheTTL.MEDIUM)
@limiter.limit("60/minute")
async def get_all_page_visibility(
    request: Request,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Get all page visibility settings
    Available to all authenticated users
    """
    pages = db.query(PageVisibility).order_by(PageVisibility.page_key).all()
    return paginated_response(data=pages, request=request)


@router.get("/visibility/{page_key}", response_model=PageVisibilityResponse)
@cache.cached(ttl=CacheTTL.MEDIUM)
@limiter.limit("60/minute")
async def get_page_visibility(
    page_key: str,
    request: Request,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Get visibility status for a specific page
    """
    page = db.query(PageVisibility).filter(PageVisibility.page_key == page_key).first()
    if not page:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Page '{page_key}' not found"
        )
    return success_response(data=page, request=request)


@router.put("/visibility/{page_key}")
@limiter.limit("60/minute")
async def toggle_page_visibility(
    page_key: str,
    toggle_data: PageVisibilityToggle,
    request: Request,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Toggle page visibility (ON/OFF)
    Only ADMIN and SUPER_ADMIN can toggle pages
    """
    # Check authorization
    if current_user.role not in [UserRole.ADMIN, UserRole.SUPER_ADMIN]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only admins can toggle page visibility"
        )

    page = db.query(PageVisibility).filter(PageVisibility.page_key == page_key).first()
    if not page:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Page '{page_key}' not found"
        )

    # Update page visibility
    page.is_enabled = toggle_data.is_enabled
    page.disabled_message = toggle_data.disabled_message
    page.last_toggled_by = current_user.id
    page.last_toggled_at = datetime.utcnow()

    db.commit()
    db.refresh(page)

    return success_response(
        data={
            "page_key": page.page_key,
            "is_enabled": page.is_enabled,
            "message": f"Page '{page.page_name}' is now {'enabled' if page.is_enabled else 'disabled'}"
        },
        request=request
    )


@router.post("/visibility/init")
@limiter.limit("60/minute")
async def initialize_page_visibility(
    request: Request,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Initialize default page visibility settings
    Only SUPER_ADMIN can run this
    """
    if current_user.role != UserRole.SUPER_ADMIN:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only super admins can initialize page visibility"
        )

    # Default pages configuration
    default_pages = [
        {
            "page_key": "timer-cards",
            "page_name": "タイムカード",
            "page_name_en": "Timer Cards",
            "is_enabled": True,
            "path": "/dashboard/timercards",
            "description": "Time card tracking system"
        },
        {
            "page_key": "candidates",
            "page_name": "候補者",
            "page_name_en": "Candidates",
            "is_enabled": True,
            "path": "/dashboard/candidates",
            "description": "Candidate management"
        },
        {
            "page_key": "employees",
            "page_name": "従業員",
            "page_name_en": "Employees",
            "is_enabled": True,
            "path": "/dashboard/employees",
            "description": "Employee management"
        },
        {
            "page_key": "factories",
            "page_name": "工場",
            "page_name_en": "Factories",
            "is_enabled": True,
            "path": "/dashboard/factories",
            "description": "Factory/workplace management"
        },
        {
            "page_key": "salary",
            "page_name": "給与",
            "page_name_en": "Salary",
            "is_enabled": True,
            "path": "/dashboard/salary",
            "description": "Salary management"
        },
        {
            "page_key": "requests",
            "page_name": "申請",
            "page_name_en": "Requests",
            "is_enabled": True,
            "path": "/dashboard/requests",
            "description": "Request management"
        },
        {
            "page_key": "reports",
            "page_name": "レポート",
            "page_name_en": "Reports",
            "is_enabled": True,
            "path": "/dashboard/reports",
            "description": "Reports and analytics"
        },
    ]

    # Create or update pages
    for page_config in default_pages:
        existing = db.query(PageVisibility).filter(
            PageVisibility.page_key == page_config["page_key"]
        ).first()

        if not existing:
            new_page = PageVisibility(**page_config)
            db.add(new_page)

    db.commit()

    return created_response(
        data={
            "message": f"Initialized {len(default_pages)} pages",
            "pages": len(default_pages)
        },
        request=request
    )
