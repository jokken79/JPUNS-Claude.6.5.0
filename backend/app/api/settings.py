"""
System Settings API endpoints
Handles admin-controlled configuration toggles
"""
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.models.models import SystemSettings, User, UserRole
from app.api.deps import get_current_user
from app.schemas.settings import VisibilityToggleResponse, VisibilityToggleUpdate
from app.core.logging import app_logger
from app.core.rate_limiter import limiter

router = APIRouter()


@router.get("/visibility", response_model=VisibilityToggleResponse)
@limiter.limit("60/minute")
async def get_visibility_toggle(db: Session = Depends(get_db)):
    """
    Get visibility toggle status
    Public endpoint - anyone can check if content is visible
    """
    try:
        setting = db.query(SystemSettings).filter(
            SystemSettings.key == "content_visibility_enabled"
        ).first()

        if not setting:
            # Create default setting (enabled by default)
            setting = SystemSettings(
                key="content_visibility_enabled",
                value="true",
                description="Controls visibility of content for ADMIN and KANRINSHA users"
            )
            db.add(setting)
            db.commit()
            db.refresh(setting)
            app_logger.info("Created default visibility setting", enabled=True)

        enabled = setting.value.lower() == "true" if setting.value else True

        return VisibilityToggleResponse(
            enabled=enabled,
            updated_at=setting.updated_at
        )

    except Exception as e:
        app_logger.error("Error fetching visibility toggle", error=str(e))
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Error fetching visibility settings"
        )


@router.put("/visibility", response_model=VisibilityToggleResponse)
@limiter.limit("60/minute")
async def update_visibility_toggle(
    toggle_data: VisibilityToggleUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Update visibility toggle (ADMIN and SUPER_ADMIN only)
    Controls whether ADMIN and KANRINSHA users see content or construction page
    """
    # Check permissions
    if current_user.role not in [UserRole.ADMIN, UserRole.SUPER_ADMIN]:
        app_logger.warning(
            "Unauthorized visibility toggle attempt",
            user_id=current_user.id,
            role=current_user.role
        )
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Solo administradores pueden cambiar esta configuración"
        )

    try:
        setting = db.query(SystemSettings).filter(
            SystemSettings.key == "content_visibility_enabled"
        ).first()

        if not setting:
            setting = SystemSettings(
                key="content_visibility_enabled",
                value=str(toggle_data.enabled).lower(),
                description="Controls visibility of content for ADMIN and KANRINSHA users"
            )
            db.add(setting)
        else:
            setting.value = str(toggle_data.enabled).lower()

        db.commit()
        db.refresh(setting)

        app_logger.info(
            "Visibility toggle updated",
            enabled=toggle_data.enabled,
            user_id=current_user.id,
            username=current_user.username
        )

        return VisibilityToggleResponse(
            enabled=toggle_data.enabled,
            updated_at=setting.updated_at
        )

    except Exception as e:
        db.rollback()
        app_logger.error(
            "Error updating visibility toggle",
            error=str(e),
            user_id=current_user.id
        )
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Error al actualizar configuración"
        )
