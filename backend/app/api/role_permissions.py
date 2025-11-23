"""
Role-Based Permissions API
Controls which pages each role can access (ADMIN, KEITOSAN, TANTOSHA, EMPLOYEE)
"""
from fastapi import APIRouter, Depends, HTTPException, Query, Request
from sqlalchemy.orm import Session
from typing import List, Optional, Dict, Any
from pydantic import BaseModel

from app.core.database import get_db
from app.models.models import RolePagePermission, User, UserRole
from app.api.deps import get_current_user, require_admin
from app.services.audit_service import AuditService

router = APIRouter(prefix="/api/role-permissions", tags=["role-permissions"])


# ================================
# HELPER FUNCTIONS
# ================================

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


# ================================
# SCHEMAS (Pydantic Models)
# ================================

class PermissionResponse(BaseModel):
    """Response schema for a single permission"""
    role_key: str
    page_key: str
    is_enabled: bool
    created_at: str
    updated_at: str

class PermissionUpdate(BaseModel):
    """Request schema for updating a permission"""
    is_enabled: bool

class BulkPermissionUpdate(BaseModel):
    """Request schema for bulk updating permissions"""
    permissions: List[Dict[str, Any]]  # List of {page_key: str, is_enabled: bool}

class RolePermissionsResponse(BaseModel):
    """Response schema for all permissions of a role"""
    role_key: str
    permissions: List[PermissionResponse]
    total_pages: int
    enabled_pages: int

class UserPermissionsResponse(BaseModel):
    """Response schema for current user's permissions"""
    user_role: str
    permissions: List[str]  # List of page_keys user can access

class PageInfo(BaseModel):
    """Schema for page information"""
    key: str
    name: str
    name_en: Optional[str] = None
    description: Optional[str] = None

# ================================
# AVAILABLE PAGES CONSTANT
# ================================

AVAILABLE_PAGES = [
    # Main Modules (15)
    {"key": "dashboard", "name": "ダッシュボード", "name_en": "Dashboard", "description": "Main dashboard"},
    {"key": "candidates", "name": "候補者", "name_en": "Candidates", "description": "Manage job candidates"},
    {"key": "employees", "name": "従業員", "name_en": "Employees", "description": "Manage employees"},
    {"key": "factories", "name": "派遣先", "name_en": "Factories", "description": "Client factories"},
    {"key": "apartments", "name": "アパート", "name_en": "Apartments", "description": "Employee housing"},
    {"key": "timer_cards", "name": "タイムカード", "name_en": "Time Cards", "description": "Attendance tracking"},
    {"key": "salary", "name": "給与", "name_en": "Salary", "description": "Payroll management"},
    {"key": "requests", "name": "申請", "name_en": "Requests", "description": "Leave requests"},
    {"key": "reports", "name": "レポート", "name_en": "Reports", "description": "Analytics and reports"},
    {"key": "design_system", "name": "デザインシステム", "name_en": "Design System", "description": "UI components"},
    {"key": "forms", "name": "フォーム", "name_en": "Forms", "description": "Form templates"},
    {"key": "support", "name": "サポート", "name_en": "Support", "description": "Help and support"},
    {"key": "help", "name": "ヘルプ", "name_en": "Help", "description": "Documentation"},
    {"key": "terms", "name": "利用規約", "name_en": "Terms", "description": "Terms of service"},
    {"key": "privacy", "name": "プライバシーポリシー", "name_en": "Privacy Policy", "description": "Privacy policy"},

    # Candidates Module (3)
    {"key": "candidates_create", "name": "候補者作成", "name_en": "Create Candidate", "description": "Create new candidate"},
    {"key": "candidates_edit", "name": "候補者編集", "name_en": "Edit Candidate", "description": "Edit candidate details"},
    {"key": "candidates_upload", "name": "候補者アップロード", "name_en": "Upload Candidate", "description": "Upload candidate resume (OCR)"},

    # Employees Module (3)
    {"key": "employees_create", "name": "従業員作成", "name_en": "Create Employee", "description": "Create new employee"},
    {"key": "employees_edit", "name": "従業員編集", "name_en": "Edit Employee", "description": "Edit employee details"},
    {"key": "employees_bulk_operations", "name": "従業員一括操作", "name_en": "Bulk Operations", "description": "Bulk employee operations"},

    # Factories Module (2)
    {"key": "factories_create", "name": "派遣先作成", "name_en": "Create Factory", "description": "Create new factory"},
    {"key": "factories_edit", "name": "派遣先編集", "name_en": "Edit Factory", "description": "Edit factory details"},

    # Apartments Module (2)
    {"key": "apartments_create", "name": "アパート作成", "name_en": "Create Apartment", "description": "Create new apartment"},
    {"key": "apartments_edit", "name": "アパート編集", "name_en": "Edit Apartment", "description": "Edit apartment details"},

    # Salary Module (3)
    {"key": "salary_calculations", "name": "給与計算", "name_en": "Salary Calculations", "description": "Salary calculations"},
    {"key": "salary_history", "name": "給与履歴", "name_en": "Salary History", "description": "Salary history"},
    {"key": "salary_export", "name": "給与エクスポート", "name_en": "Export Salary", "description": "Export salary data"},

    # Requests Module (2)
    {"key": "requests_create", "name": "申請作成", "name_en": "Create Request", "description": "Create new request"},
    {"key": "requests_approval", "name": "申請承認", "name_en": "Request Approval", "description": "Approve/reject requests"},

    # Reports Module (3)
    {"key": "reports_attendance", "name": "出勤レポート", "name_en": "Attendance Report", "description": "Attendance reports"},
    {"key": "reports_payroll", "name": "給与レポート", "name_en": "Payroll Report", "description": "Payroll reports"},
    {"key": "reports_export", "name": "レポートエクスポート", "name_en": "Export Reports", "description": "Export reports"},

    # Settings Module (8)
    {"key": "settings", "name": "設定", "name_en": "Settings", "description": "System settings"},
    {"key": "settings_appearance", "name": "外観設定", "name_en": "Appearance Settings", "description": "Theme and appearance"},
    {"key": "settings_profile", "name": "プロフィール設定", "name_en": "Profile Settings", "description": "User profile"},
    {"key": "settings_language", "name": "言語設定", "name_en": "Language Settings", "description": "Language preferences"},
    {"key": "settings_notifications", "name": "通知設定", "name_en": "Notification Settings", "description": "Notification preferences"},
    {"key": "settings_security", "name": "セキュリティ設定", "name_en": "Security Settings", "description": "Security settings"},
    {"key": "settings_integrations", "name": "連携設定", "name_en": "Integration Settings", "description": "Integration settings"},
    {"key": "settings_backup", "name": "バックアップ設定", "name_en": "Backup Settings", "description": "Backup and restore"},

    # Admin Module (5)
    {"key": "admin", "name": "管理", "name_en": "Admin", "description": "Admin panel"},
    {"key": "admin_users", "name": "ユーザー管理", "name_en": "User Management", "description": "Manage users"},
    {"key": "admin_roles", "name": "ロール管理", "name_en": "Role Management", "description": "Manage roles and permissions"},
    {"key": "admin_system", "name": "システム管理", "name_en": "System Management", "description": "System configuration"},
    {"key": "admin_audit", "name": "監査ログ", "name_en": "Audit Log", "description": "System audit log"},
    {"key": "admin_database", "name": "データベース管理", "name_en": "Database Management", "description": "Database tools"},

    # Other Features (8)
    {"key": "notifications", "name": "通知", "name_en": "Notifications", "description": "Notifications center"},
    {"key": "import_export", "name": "インポート/エクスポート", "name_en": "Import/Export", "description": "Data import/export"},
    {"key": "themes", "name": "テーマ", "name_en": "Themes", "description": "Theme gallery"},
    {"key": "themes_customizer", "name": "テーマカスタマイザー", "name_en": "Theme Customizer", "description": "Custom theme builder"},
    {"key": "themes_gallery", "name": "テーマギャラリー", "name_en": "Theme Gallery", "description": "Theme gallery"},
    {"key": "monitoring", "name": "モニタリング", "name_en": "Monitoring", "description": "System monitoring"},
    {"key": "monitoring_health", "name": "ヘルスチェック", "name_en": "Health Check", "description": "System health"},
    {"key": "monitoring_performance", "name": "パフォーマンス", "name_en": "Performance", "description": "Performance metrics"},
]

# ================================
# AVAILABLE ROLES CONSTANT
# ================================

AVAILABLE_ROLES = [
    {"key": "SUPER_ADMIN", "name": "スーパー管理者", "name_en": "Super Administrator", "description": "Full system control"},
    {"key": "ADMIN", "name": "アドミニストレーター", "name_en": "Administrator", "description": "Administrative access"},
    {"key": "COORDINATOR", "name": "コーディネーター", "name_en": "Coordinator", "description": "Coordination tasks"},
    {"key": "KANRININSHA", "name": "管理人者", "name_en": "Manager", "description": "Manager role"},
    {"key": "EMPLOYEE", "name": "従業員", "name_en": "Employee", "description": "Employee access"},
    {"key": "CONTRACT_WORKER", "name": "契約社員", "name_en": "Contract Worker", "description": "Contract worker access"},
    {"key": "KEITOSAN", "name": "経理管理", "name_en": "Finance Manager", "description": "Finance and accounting (legacy)"},
    {"key": "TANTOSHA", "name": "担当者", "name_en": "Representative", "description": "HR and operations (legacy)"},
]


# ================================
# DEFAULT PERMISSIONS MATRIX
# ================================

def get_default_permissions_matrix() -> Dict[str, List[str]]:
    """
    Returns the default permissions matrix for each role
    Maps role_key -> list of enabled page_keys
    """
    # Extract all page keys
    all_pages = [page["key"] for page in AVAILABLE_PAGES]

    # Define restricted pages that require admin/elevated access
    admin_only_pages = [
        "admin", "admin_users", "admin_roles", "admin_system",
        "admin_audit", "admin_database", "monitoring",
        "monitoring_health", "monitoring_performance",
        "settings_integrations", "settings_backup",
        "import_export"
    ]

    finance_pages = [
        "salary", "salary_calculations", "salary_history",
        "salary_export", "reports_payroll"
    ]

    hr_pages = [
        "candidates", "candidates_create", "candidates_edit", "candidates_upload",
        "employees", "employees_create", "employees_edit", "employees_bulk_operations",
        "factories", "factories_create", "factories_edit",
        "apartments", "apartments_create", "apartments_edit",
        "requests_approval", "reports_attendance"
    ]

    basic_pages = [
        "dashboard", "timer_cards", "requests", "requests_create",
        "notifications", "support", "help", "terms", "privacy",
        "settings", "settings_appearance", "settings_profile",
        "settings_language", "settings_notifications", "settings_security",
        "design_system", "forms", "themes", "themes_customizer", "themes_gallery"
    ]

    return {
        "SUPER_ADMIN": all_pages,  # Full access to all 54 pages

        "ADMIN": [p for p in all_pages if p != "admin_database"],  # All except DB admin

        "COORDINATOR": basic_pages + hr_pages + [
            "reports", "reports_attendance", "reports_export"
        ],

        "KANRININSHA": basic_pages + hr_pages + finance_pages + [
            "reports", "reports_attendance", "reports_payroll", "reports_export"
        ],

        "EMPLOYEE": basic_pages + [
            "candidates", "employees", "factories", "apartments",
            "salary", "salary_history", "reports", "reports_attendance"
        ],

        "CONTRACT_WORKER": [
            "dashboard", "timer_cards", "requests", "requests_create",
            "notifications", "support", "help", "terms", "privacy",
            "settings", "settings_appearance", "settings_profile",
            "settings_language", "settings_notifications"
        ],

        # Legacy roles (backward compatibility)
        "KEITOSAN": basic_pages + finance_pages + [
            "employees", "reports", "reports_payroll", "reports_export"
        ],

        "TANTOSHA": basic_pages + hr_pages + [
            "reports", "reports_attendance", "reports_export"
        ],
    }


# ================================
# ENDPOINTS
# ================================

@router.get("/roles", response_model=List[Dict[str, str]], summary="List available roles")
async def list_roles():
    """Get list of all available roles"""
    return AVAILABLE_ROLES


@router.get("/pages", response_model=List[PageInfo], summary="List available pages")
async def list_pages():
    """Get list of all available pages"""
    return AVAILABLE_PAGES


@router.get("/{role_key}", response_model=RolePermissionsResponse, summary="Get permissions for a role")
async def get_role_permissions(
    role_key: str,
    current_user: User = Depends(require_admin),
    db: Session = Depends(get_db)
):
    """
    Get all page permissions for a specific role
    Only ADMIN users can access this endpoint
    """
    # Validate role exists
    if role_key not in [r["key"] for r in AVAILABLE_ROLES]:
        raise HTTPException(status_code=404, detail=f"Role '{role_key}' not found")

    # Get all permissions for this role
    permissions = db.query(RolePagePermission).filter(
        RolePagePermission.role_key == role_key
    ).all()

    # Ensure all pages are represented (fill missing with default false)
    permission_dict = {p.page_key: p for p in permissions}
    result_permissions = []

    for page in AVAILABLE_PAGES:
        page_key = page["key"]
        if page_key in permission_dict:
            perm = permission_dict[page_key]
            result_permissions.append(PermissionResponse(
                role_key=role_key,
                page_key=page_key,
                is_enabled=perm.is_enabled,
                created_at=perm.created_at.isoformat(),
                updated_at=perm.updated_at.isoformat() if perm.updated_at else ""
            ))
        else:
            # Page not explicitly set, default to false
            result_permissions.append(PermissionResponse(
                role_key=role_key,
                page_key=page_key,
                is_enabled=False,
                created_at="",
                updated_at=""
            ))

    # Count enabled pages
    enabled_count = sum(1 for p in result_permissions if p.is_enabled)

    return RolePermissionsResponse(
        role_key=role_key,
        permissions=result_permissions,
        total_pages=len(result_permissions),
        enabled_pages=enabled_count
    )


@router.put("/{role_key}/{page_key}", response_model=PermissionResponse, summary="Update a single permission")
async def update_permission(
    role_key: str,
    page_key: str,
    permission: PermissionUpdate,
    request: Request,
    current_user: User = Depends(require_admin),
    db: Session = Depends(get_db)
):
    """
    Update a single page permission for a role
    Only ADMIN users can access this endpoint
    """
    # Validate role
    if role_key not in [r["key"] for r in AVAILABLE_ROLES]:
        raise HTTPException(status_code=404, detail=f"Role '{role_key}' not found")

    # Validate page
    if page_key not in [p["key"] for p in AVAILABLE_PAGES]:
        raise HTTPException(status_code=404, detail=f"Page '{page_key}' not found")

    # Get or create permission
    db_permission = db.query(RolePagePermission).filter(
        RolePagePermission.role_key == role_key,
        RolePagePermission.page_key == page_key
    ).first()

    # Store old value for audit log
    old_value = db_permission.is_enabled if db_permission else False

    if not db_permission:
        db_permission = RolePagePermission(
            role_key=role_key,
            page_key=page_key,
            is_enabled=permission.is_enabled
        )
        db.add(db_permission)
    else:
        db_permission.is_enabled = permission.is_enabled

    db.commit()
    db.refresh(db_permission)

    # Log the change in audit log
    AuditService.log_role_permission_change(
        db=db,
        admin_id=current_user.id,
        role_key=role_key,
        page_key=page_key,
        old_value=old_value,
        new_value=permission.is_enabled,
        ip_address=get_client_ip(request),
        user_agent=get_user_agent(request)
    )

    return PermissionResponse(
        role_key=role_key,
        page_key=page_key,
        is_enabled=db_permission.is_enabled,
        created_at=db_permission.created_at.isoformat(),
        updated_at=db_permission.updated_at.isoformat() if db_permission.updated_at else ""
    )


@router.post("/bulk-update/{role_key}", response_model=RolePermissionsResponse, summary="Bulk update permissions for a role")
async def bulk_update_permissions(
    role_key: str,
    bulk_update: BulkPermissionUpdate,
    request: Request,
    current_user: User = Depends(require_admin),
    db: Session = Depends(get_db)
):
    """
    Update multiple permissions for a role at once
    Only ADMIN users can access this endpoint
    """
    # Validate role
    if role_key not in [r["key"] for r in AVAILABLE_ROLES]:
        raise HTTPException(status_code=404, detail=f"Role '{role_key}' not found")

    # Track changes for audit log
    pages_affected = []
    success_count = 0

    # Process each permission update
    for perm_data in bulk_update.permissions:
        page_key = perm_data.get("page_key")
        is_enabled = perm_data.get("is_enabled")

        if not page_key or is_enabled is None:
            raise HTTPException(status_code=400, detail="Invalid permission data")

        # Validate page
        if page_key not in [p["key"] for p in AVAILABLE_PAGES]:
            raise HTTPException(status_code=404, detail=f"Page '{page_key}' not found")

        # Get or create permission
        db_permission = db.query(RolePagePermission).filter(
            RolePagePermission.role_key == role_key,
            RolePagePermission.page_key == page_key
        ).first()

        if not db_permission:
            db_permission = RolePagePermission(
                role_key=role_key,
                page_key=page_key,
                is_enabled=is_enabled
            )
            db.add(db_permission)
        else:
            db_permission.is_enabled = is_enabled

        pages_affected.append(page_key)
        success_count += 1

    db.commit()

    # Log the bulk operation in audit log
    operation_type = f"bulk_update_role_permissions_{role_key}"
    AuditService.log_bulk_operation(
        db=db,
        admin_id=current_user.id,
        operation_type=operation_type,
        pages_affected=pages_affected,
        roles_affected=[role_key],
        total_count=len(bulk_update.permissions),
        success_count=success_count,
        ip_address=get_client_ip(request),
        user_agent=get_user_agent(request)
    )

    # Return updated permissions
    return await get_role_permissions(role_key, current_user, db)


@router.get("/check/{role_key}/{page_key}", summary="Check if a role has access to a page")
async def check_permission(
    role_key: str,
    page_key: str,
    db: Session = Depends(get_db)
):
    """
    Check if a role has access to a specific page
    This endpoint can be used by the frontend to verify access
    """
    # Validate role and page
    if role_key not in [r["key"] for r in AVAILABLE_ROLES]:
        return {"has_access": False, "reason": "Role not found"}

    if page_key not in [p["key"] for p in AVAILABLE_PAGES]:
        return {"has_access": False, "reason": "Page not found"}

    # Check permission
    permission = db.query(RolePagePermission).filter(
        RolePagePermission.role_key == role_key,
        RolePagePermission.page_key == page_key
    ).first()

    if not permission:
        # If no explicit permission set, default to false
        return {"has_access": False, "reason": "No permission set"}

    return {
        "has_access": permission.is_enabled,
        "role_key": role_key,
        "page_key": page_key
    }


@router.get("/user/{user_id}/permissions", response_model=UserPermissionsResponse, summary="Get current user's permissions")
async def get_user_permissions(
    user_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Get all permissions for the current user based on their role
    """
    # Get user
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    # Get permissions for user's role
    permissions = db.query(RolePagePermission).filter(
        RolePagePermission.role_key == user.role,
        RolePagePermission.is_enabled == True
    ).all()

    # Return list of page_keys user can access
    return UserPermissionsResponse(
        user_role=user.role,
        permissions=[p.page_key for p in permissions]
    )


@router.post("/reset/{role_key}", summary="Reset permissions to default for a role")
async def reset_permissions(
    role_key: str,
    current_user: User = Depends(require_admin),
    db: Session = Depends(get_db)
):
    """
    Reset all permissions for a role to their default values
    Only ADMIN users can access this endpoint
    """
    # Validate role
    if role_key not in [r["key"] for r in AVAILABLE_ROLES]:
        raise HTTPException(status_code=404, detail=f"Role '{role_key}' not found")

    # Delete existing permissions
    db.query(RolePagePermission).filter(
        RolePagePermission.role_key == role_key
    ).delete()

    db.commit()

    # Return success message
    return {
        "message": f"Permissions reset for role '{role_key}'",
        "note": "Use the default permissions setup to restore specific values"
    }


@router.post("/initialize-defaults", summary="Initialize default permissions for all roles")
async def initialize_default_permissions(
    current_user: User = Depends(require_admin),
    db: Session = Depends(get_db)
):
    """
    Initialize default permissions for all roles based on the default matrix
    This endpoint will:
    1. Clear ALL existing permissions from the database
    2. Create fresh permissions based on get_default_permissions_matrix()
    3. Return a summary of created permissions

    Only ADMIN/SUPER_ADMIN users can access this endpoint
    Use this for initial setup or to restore default permissions
    """
    try:
        # Step 1: Clear all existing permissions
        deleted_count = db.query(RolePagePermission).delete()
        db.commit()

        # Step 2: Get default permissions matrix
        default_matrix = get_default_permissions_matrix()

        # Step 3: Create permissions for each role
        created_count = 0
        role_summary = {}

        for role_key, page_keys in default_matrix.items():
            enabled_pages = []

            for page_key in page_keys:
                # Validate page exists in AVAILABLE_PAGES
                if page_key not in [p["key"] for p in AVAILABLE_PAGES]:
                    continue  # Skip invalid page keys

                # Create permission
                db_permission = RolePagePermission(
                    role_key=role_key,
                    page_key=page_key,
                    is_enabled=True
                )
                db.add(db_permission)
                enabled_pages.append(page_key)
                created_count += 1

            role_summary[role_key] = {
                "total_pages": len(enabled_pages),
                "enabled_pages": enabled_pages
            }

        db.commit()

        # Step 4: Return summary
        return {
            "success": True,
            "message": "Default permissions initialized successfully",
            "summary": {
                "deleted_permissions": deleted_count,
                "created_permissions": created_count,
                "total_roles": len(default_matrix),
                "total_pages": len(AVAILABLE_PAGES),
                "role_summary": role_summary
            }
        }

    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=500,
            detail=f"Failed to initialize default permissions: {str(e)}"
        )
