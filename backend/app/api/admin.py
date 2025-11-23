"""
Admin API - Panel de Control para gestionar módulos y configuraciones

CONSOLIDATED (2025-11-12):
- PageVisibility endpoints removed - use /api/pages/visibility instead
- SystemSettings endpoints kept for backward compatibility
- Maintenance mode, statistics, export/import endpoints kept (unique functionality)
"""
from fastapi import APIRouter, Depends, HTTPException, Query, Request
from sqlalchemy.orm import Session
from sqlalchemy import update, func
from typing import List, Optional
from datetime import datetime
import json

from app.core.database import get_db
from app.models.models import PageVisibility, SystemSettings, User, RolePagePermission, AdminActionType, ResourceType
from app.api.deps import get_current_user, require_admin
from app.services.audit_service import AuditService
from pydantic import BaseModel

router = APIRouter(prefix="/api/admin", tags=["admin"])


# ============================================
# HELPER FUNCTIONS
# ============================================

def get_client_ip(request: Request) -> Optional[str]:
    """Extract client IP address from request"""
    if "x-forwarded-for" in request.headers:
        return request.headers["x-forwarded-for"].split(",")[0].strip()
    elif "x-real-ip" in request.headers:
        return request.headers["x-real-ip"]
    else:
        return request.client.host if request.client else None


def get_user_agent(request: Request) -> Optional[str]:
    """Extract user agent from request"""
    return request.headers.get("user-agent")


# ============================================
# SCHEMAS
# ============================================

class SystemSettingResponse(BaseModel):
    id: int
    key: str
    value: Optional[str]
    description: Optional[str]
    updated_at: datetime

    class Config:
        from_attributes = True

class MaintenanceModeRequest(BaseModel):
    enabled: bool

class RoleStatsResponse(BaseModel):
    role_key: str
    role_name: str
    total_pages: int
    enabled_pages: int
    disabled_pages: int
    percentage: float

    class Config:
        from_attributes = True

# ============================================
# ENDPOINTS - SYSTEM SETTINGS
# ============================================
# NOTE: PageVisibility endpoints consolidated in pages.py router

@router.get("/settings", response_model=List[SystemSettingResponse])
async def get_system_settings(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin)
):
    """
    Obtener todas las configuraciones del sistema
    """
    settings = db.query(SystemSettings).order_by(SystemSettings.key).all()
    return settings

@router.get("/settings/{setting_key}", response_model=SystemSettingResponse)
async def get_system_setting(
    setting_key: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin)
):
    """
    Obtener una configuración específica del sistema
    """
    setting = db.query(SystemSettings).filter(SystemSettings.key == setting_key).first()
    if not setting:
        raise HTTPException(status_code=404, detail="Configuración no encontrada")

    return setting

class SystemSettingUpdate(BaseModel):
    value: str

@router.put("/settings/{setting_key}", response_model=SystemSettingResponse)
async def update_system_setting(
    setting_key: str,
    setting_data: SystemSettingUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin)
):
    """
    Actualizar una configuración del sistema
    """
    setting = db.query(SystemSettings).filter(SystemSettings.key == setting_key).first()
    if not setting:
        raise HTTPException(status_code=404, detail="Configuración no encontrada")

    setting.value = setting_data.value
    setting.updated_at = datetime.utcnow()

    db.commit()
    db.refresh(setting)

    return setting

@router.post("/maintenance-mode")
async def toggle_maintenance_mode(
    maintenance_data: MaintenanceModeRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin)
):
    """
    Activar/desactivar modo mantenimiento

    When enabling maintenance mode, all pages are disabled.
    """
    # Update maintenance mode setting
    setting = db.query(SystemSettings).filter(SystemSettings.key == "maintenance_mode").first()
    if not setting:
        # Create if doesn't exist
        setting = SystemSettings(
            key="maintenance_mode",
            value="false" if not maintenance_data.enabled else "true",
            description="Global maintenance mode toggle"
        )
        db.add(setting)
    else:
        setting.value = "true" if maintenance_data.enabled else "false"
        setting.updated_at = datetime.utcnow()

    # If enabling maintenance mode, disable all pages
    if maintenance_data.enabled:
        stmt = (
            update(PageVisibility)
            .values(
                is_enabled=False,
                last_toggled_by=current_user.id,
                last_toggled_at=datetime.utcnow(),
                updated_at=datetime.utcnow()
            )
        )
        db.execute(stmt)

    db.commit()

    action = "activado" if maintenance_data.enabled else "desactivado"
    return {
        "message": f"Modo mantenimiento {action}",
        "maintenance_mode": maintenance_data.enabled
    }

# ============================================
# ENDPOINTS - STATISTICS
# ============================================

@router.get("/statistics")
async def get_admin_statistics(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin)
):
    """
    Obtener estadísticas del panel de administración

    Returns comprehensive system statistics including:
    - Page counts (total, enabled, disabled)
    - User counts (total, active)
    - Candidate, employee, and factory counts
    - Maintenance mode status
    - Recent changes
    """
    from app.models.models import Candidate, Employee, Factory

    # Count pages
    total_pages = db.query(func.count(PageVisibility.id)).scalar() or 0
    enabled_pages = db.query(func.count(PageVisibility.id)).filter(PageVisibility.is_enabled == True).scalar() or 0
    disabled_pages = total_pages - enabled_pages

    # Count users
    total_users = db.query(func.count(User.id)).scalar() or 0
    active_users = db.query(func.count(User.id)).filter(User.is_active == True).scalar() or 0

    # Count candidates
    total_candidates = db.query(func.count(Candidate.id)).scalar() or 0

    # Count employees
    total_employees = db.query(func.count(Employee.id)).scalar() or 0

    # Count factories
    total_factories = db.query(func.count(Factory.id)).scalar() or 0

    # Get settings
    maintenance_mode = db.query(SystemSettings).filter(SystemSettings.key == "maintenance_mode").first()
    maintenance_enabled = maintenance_mode.value == "true" if maintenance_mode else False

    # Recent changes (last 24 hours)
    from datetime import timedelta
    yesterday = datetime.utcnow() - timedelta(days=1)
    recent_changes = (
        db.query(PageVisibility)
        .filter(PageVisibility.last_toggled_at >= yesterday)
        .count()
    ) if db.query(PageVisibility).first() else 0

    # Calculate database size
    try:
        from sqlalchemy import text
        # Get database size in MB (works for PostgreSQL)
        db_size_result = db.execute(
            text("SELECT pg_database_size(current_database()) / 1024 / 1024 as size_mb")
        ).scalar()
        database_size_mb = float(db_size_result) if db_size_result else 0
    except Exception as e:
        logger.warning(f"Could not calculate database size: {e}")
        database_size_mb = None

    # Calculate uptime (time since earliest record in database)
    try:
        earliest_user = db.query(User.created_at).order_by(User.created_at).first()
        if earliest_user and earliest_user[0]:
            uptime_td = datetime.utcnow() - earliest_user[0]
            uptime_days = uptime_td.days
            uptime_seconds = uptime_td.seconds % 86400
            uptime_hours = uptime_seconds // 3600
            uptime_minutes = (uptime_seconds % 3600) // 60
            uptime_str = f"{uptime_days}d {uptime_hours}h {uptime_minutes}m"
        else:
            uptime_str = "Unknown"
    except Exception as e:
        logger.warning(f"Could not calculate uptime: {e}")
        uptime_str = "Unknown"

    return {
        "pages": {
            "total": total_pages,
            "enabled": enabled_pages,
            "disabled": disabled_pages,
            "percentage_enabled": round((enabled_pages / total_pages * 100), 2) if total_pages > 0 else 0
        },
        "system": {
            "maintenance_mode": maintenance_enabled,
            "recent_changes_24h": recent_changes
        },
        # New fields for SystemSettingsPanel
        "total_users": total_users,
        "active_users": active_users,
        "total_candidates": total_candidates,
        "total_employees": total_employees,
        "total_factories": total_factories,
        "maintenance_mode": maintenance_enabled,
        "database_size_mb": database_size_mb,
        "uptime": uptime_str
    }


# ============================================
# ENDPOINTS - EXPORT/IMPORT
# ============================================

@router.get("/export-config")
async def export_configuration(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin)
):
    """
    Exportar toda la configuración del panel

    Includes both PageVisibility and SystemSettings configurations.
    """
    pages = db.query(PageVisibility).order_by(PageVisibility.page_key).all()
    settings = db.query(SystemSettings).order_by(SystemSettings.key).all()

    export_data = {
        "exported_at": datetime.utcnow().isoformat(),
        "exported_by": current_user.username,
        "pages": [
            {
                "page_key": p.page_key,
                "page_name": p.page_name,
                "is_enabled": p.is_enabled,
                "disabled_message": p.disabled_message
            }
            for p in pages
        ],
        "settings": [
            {
                "key": s.key,
                "value": s.value
            }
            for s in settings
        ]
    }

    return export_data

@router.post("/import-config")
async def import_configuration(
    config_data: dict,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin)
):
    """
    Importar configuración del panel

    Imports both PageVisibility and SystemSettings configurations.
    """
    imported_pages = 0
    imported_settings = 0

    # Import pages
    if "pages" in config_data:
        for page_data in config_data["pages"]:
            page = db.query(PageVisibility).filter(PageVisibility.page_key == page_data["page_key"]).first()
            if page:
                page.is_enabled = page_data["is_enabled"]
                page.disabled_message = page_data.get("disabled_message")
                page.last_toggled_by = current_user.id
                page.last_toggled_at = datetime.utcnow()
                page.updated_at = datetime.utcnow()
                imported_pages += 1

    # Import settings
    if "settings" in config_data:
        for setting_data in config_data["settings"]:
            setting = db.query(SystemSettings).filter(SystemSettings.key == setting_data["key"]).first()
            if setting:
                setting.value = setting_data["value"]
                setting.updated_at = datetime.utcnow()
                imported_settings += 1

    db.commit()

    return {
        "message": "Configuración importada exitosamente",
        "imported_at": datetime.utcnow().isoformat(),
        "imported_pages": imported_pages,
        "imported_settings": imported_settings
    }

# ============================================
# ENDPOINTS - ROLE STATISTICS
# ============================================

@router.get("/role-stats", response_model=List[RoleStatsResponse])
async def get_role_stats(
    request: Request,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin)
):
    """
    Get statistics for all roles showing page permission counts

    Returns statistics for each role including:
    - Total pages available
    - Enabled pages count
    - Disabled pages count
    - Percentage of enabled pages

    Only ADMIN/SUPER_ADMIN users can access this endpoint
    """
    # Define all available roles with their display names
    AVAILABLE_ROLES = [
        {"key": "SUPER_ADMIN", "name": "Super Administrator"},
        {"key": "ADMIN", "name": "Administrator"},
        {"key": "COORDINATOR", "name": "Coordinator"},
        {"key": "KANRININSHA", "name": "Manager"},
        {"key": "EMPLOYEE", "name": "Employee"},
        {"key": "CONTRACT_WORKER", "name": "Contract Worker"},
        {"key": "KEITOSAN", "name": "Finance Manager"},
        {"key": "TANTOSHA", "name": "Representative"},
    ]

    # Query permissions grouped by role
    from sqlalchemy import case

    stats_query = db.query(
        RolePagePermission.role_key,
        func.count(RolePagePermission.id).label('total_pages'),
        func.sum(case((RolePagePermission.is_enabled == True, 1), else_=0)).label('enabled_pages'),
        func.sum(case((RolePagePermission.is_enabled == False, 1), else_=0)).label('disabled_pages')
    ).group_by(RolePagePermission.role_key).all()

    # Create a dictionary for quick lookup
    stats_dict = {
        row.role_key: {
            'total_pages': row.total_pages or 0,
            'enabled_pages': row.enabled_pages or 0,
            'disabled_pages': row.disabled_pages or 0
        }
        for row in stats_query
    }

    # Build response for all roles
    result = []
    for role in AVAILABLE_ROLES:
        role_key = role['key']
        stats = stats_dict.get(role_key, {'total_pages': 0, 'enabled_pages': 0, 'disabled_pages': 0})

        total = stats['total_pages']
        enabled = stats['enabled_pages']
        disabled = stats['disabled_pages']
        percentage = round((enabled / total * 100), 2) if total > 0 else 0.0

        result.append(RoleStatsResponse(
            role_key=role_key,
            role_name=role['name'],
            total_pages=total,
            enabled_pages=enabled,
            disabled_pages=disabled,
            percentage=percentage
        ))

    # Log the statistics access in audit log (for security monitoring)
    AuditService._create_audit_log(
        db=db,
        admin_id=current_user.id,
        action_type=AdminActionType.SYSTEM_SETTINGS,
        resource_type=ResourceType.SYSTEM,
        resource_key="role_stats",
        previous_value=None,
        new_value=None,
        description=f"Admin '{current_user.username}' viewed role statistics",
        ip_address=get_client_ip(request),
        user_agent=get_user_agent(request),
        metadata={"action": "view_role_stats", "roles_count": len(result)}
    )

    return result

# ============================================
# NOTE: PageVisibility CRUD endpoints removed
# Use /api/pages/visibility/* endpoints instead
# See app/api/pages.py for PageVisibility management
# ============================================
