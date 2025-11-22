"""
Admin Audit Log API - Track and monitor admin permission changes
"""
from fastapi import APIRouter, Depends, HTTPException, Query, Request
from fastapi.responses import Response
from sqlalchemy.orm import Session
from typing import Optional
from datetime import datetime

from app.core.database import get_db
from fastapi import Request
from app.core.cache import cache, CacheKey, CacheTTL
from app.core.response import success_response, created_response, paginated_response, no_content_response
from app.models.models import User
from app.api.deps import get_current_user, require_admin
from app.services.audit_service import AuditService
from app.schemas.audit import (
    AdminAuditLogResponse,
    AdminAuditLogFilters,
    AdminAuditLogStats,
    ExportFormat,
    AdminAuditLogExportRequest,
    AdminActionType,
    ResourceType
)
from app.schemas.base import PaginatedResponse, create_paginated_response
from app.core.rate_limiter import limiter

router = APIRouter(prefix="/api/admin/audit-log", tags=["admin-audit"])


def get_client_ip(request: Request) -> Optional[str]:
    """Extract client IP address from request"""
    if "x-forwarded-for" in request.headers:
        return success_response(data=request.headers["x-forwarded-for"].split(",")[0].strip(), request=request)
    elif "x-real-ip" in request.headers:
        return success_response(data=request.headers["x-real-ip"], request=request)
    else:
        return success_response(data=request.client.host if request.client else None, request=request)


def get_user_agent(request: Request) -> Optional[str]:
    """Extract user agent from request"""
    return success_response(data=request.headers.get("user-agent"), request=request)


# ============================================
# ENDPOINTS - AUDIT LOG RETRIEVAL
# ============================================

@router.get("", response_model=PaginatedResponse[AdminAuditLogResponse])
@cache.cached(ttl=CacheTTL.MEDIUM)
@limiter.limit("60/minute")
async def get_audit_logs(
    request: Request,
    action_type: Optional[AdminActionType] = Query(None, description="Filter by action type"),
    resource_type: Optional[ResourceType] = Query(None, description="Filter by resource type"),
    resource_key: Optional[str] = Query(None, description="Filter by resource key"),
    admin_id: Optional[int] = Query(None, description="Filter by admin user ID"),
    start_date: Optional[datetime] = Query(None, description="Filter by start date"),
    end_date: Optional[datetime] = Query(None, description="Filter by end date"),
    search: Optional[str] = Query(None, description="Search in description"),
    skip: int = Query(0, ge=0, description="Number of records to skip"),
    limit: int = Query(50, ge=1, le=100, description="Maximum number of records"),
    sort_by: str = Query("created_at", description="Field to sort by"),
    sort_order: str = Query("desc", regex="^(asc|desc)$", description="Sort order"),
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin)
):
    """
    Get audit logs with filters and pagination.
    Requires ADMIN or SUPER_ADMIN role.
    """
    filters = AdminAuditLogFilters(
        action_type=action_type,
        resource_type=resource_type,
        resource_key=resource_key,
        admin_id=admin_id,
        start_date=start_date,
        end_date=end_date,
        search=search,
        skip=skip,
        limit=limit,
        sort_by=sort_by,
        sort_order=sort_order
    )

    logs, total = AuditService.get_audit_logs(db, filters)

    # Calculate page number
    page = (skip // limit) + 1

    # Convert to response models
    log_responses = [
        AdminAuditLogResponse.model_validate(log)
        for log in logs
    ]

    return create_paginated_response(
        items=log_responses,
        total=total,
        page=page,
        page_size=limit
    )


@router.get("/{log_id}", response_model=AdminAuditLogResponse)
@cache.cached(ttl=CacheTTL.MEDIUM)
@limiter.limit("60/minute")
async def get_audit_log_by_id(
    log_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin)
):
    """
    Get a single audit log entry by ID.
    Requires ADMIN or SUPER_ADMIN role.
    """
    log = AuditService.get_audit_log_by_id(db, log_id)

    if not log:
        raise HTTPException(status_code=404, detail="Audit log entry not found")

    return success_response(data=AdminAuditLogResponse.model_validate(log), request=request)


@router.get("/recent/{limit}", response_model=list[AdminAuditLogResponse])
@cache.cached(ttl=CacheTTL.MEDIUM)
@limiter.limit("60/minute")
async def get_recent_audit_logs(
    limit: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin)
):
    """
    Get the most recent audit log entries.
    Requires ADMIN or SUPER_ADMIN role.
    """
    logs = AuditService.get_recent_logs(db, limit)

    return success_response(data=[
        AdminAuditLogResponse.model_validate(log)
        for log in logs
    ], request=request)


# ============================================
# ENDPOINTS - STATISTICS
# ============================================

@router.get("/stats/summary", response_model=AdminAuditLogStats)
@cache.cached(ttl=CacheTTL.MEDIUM)
@limiter.limit("60/minute")
async def get_audit_log_stats(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin)
):
    """
    Get statistics about audit logs.
    Requires ADMIN or SUPER_ADMIN role.
    """
    return success_response(data=AuditService.get_audit_stats(db), request=request)


# ============================================
# ENDPOINTS - EXPORT
# ============================================

@router.post("/export")
@limiter.limit("60/minute")
async def export_audit_logs(
    export_request: AdminAuditLogExportRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin)
):
    """
    Export audit logs to JSON or CSV format.
    Requires ADMIN or SUPER_ADMIN role.
    """
    filters = export_request.filters or AdminAuditLogFilters(skip=0, limit=10000)

    export_data = AuditService.export_audit_logs(db, export_request.format, filters)

    # Set content type and filename based on format
    if export_request.format == ExportFormat.JSON:
        media_type = "application/json"
        filename = f"audit_logs_{datetime.utcnow().strftime('%Y%m%d_%H%M%S')}.json"
    else:  # CSV
        media_type = "text/csv"
        filename = f"audit_logs_{datetime.utcnow().strftime('%Y%m%d_%H%M%S')}.csv"

    return success_response(data=Response(
        content=export_data,
        media_type=media_type,
        headers={
            "Content-Disposition": f"attachment; filename={filename}"
        }
    ), request=request)


# ============================================
# ENDPOINTS - SEARCH
# ============================================

@router.get("/search/query", response_model=PaginatedResponse[AdminAuditLogResponse])
@cache.cached(ttl=CacheTTL.MEDIUM)
@limiter.limit("60/minute")
async def search_audit_logs(
    q: str = Query(..., min_length=1, description="Search query"),
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=100),
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin)
):
    """
    Search audit logs by query string.
    Searches in description and resource_key fields.
    Requires ADMIN or SUPER_ADMIN role.
    """
    filters = AdminAuditLogFilters(
        search=q,
        skip=skip,
        limit=limit,
        sort_by="created_at",
        sort_order="desc"
    )

    logs, total = AuditService.get_audit_logs(db, filters)

    page = (skip // limit) + 1

    log_responses = [
        AdminAuditLogResponse.model_validate(log)
        for log in logs
    ]

    return create_paginated_response(
        items=log_responses,
        total=total,
        page=page,
        page_size=limit
    )


# ============================================
# ENDPOINTS - DELETE (SUPER_ADMIN ONLY)
# ============================================

@router.delete("/{log_id}")
@limiter.limit("60/minute")
async def delete_audit_log(
    log_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin)
):
    """
    Delete (archive) an audit log entry.
    Requires SUPER_ADMIN role.
    """
    # Only SUPER_ADMIN can delete audit logs
    if current_user.role != "SUPER_ADMIN":
        raise HTTPException(
            status_code=403,
            detail="Only SUPER_ADMIN can delete audit logs"
        )

    success = AuditService.delete_audit_log(db, log_id)

    if not success:
        raise HTTPException(status_code=404, detail="Audit log entry not found")

    return success_response(data={"success": True, "message": f"Audit log {log_id} deleted successfully"}, request=request)
