"""
Pydantic schemas for Admin Audit Log
"""
from pydantic import BaseModel, Field, ConfigDict
from typing import Optional, Dict, Any
from datetime import datetime
from enum import Enum


# Enums for validation
class AdminActionType(str, Enum):
    """Types of admin actions for audit logging"""
    PAGE_VISIBILITY_CHANGE = "PAGE_VISIBILITY_CHANGE"
    ROLE_PERMISSION_CHANGE = "ROLE_PERMISSION_CHANGE"
    BULK_OPERATION = "BULK_OPERATION"
    CONFIG_CHANGE = "CONFIG_CHANGE"
    CACHE_CLEAR = "CACHE_CLEAR"
    USER_MANAGEMENT = "USER_MANAGEMENT"
    SYSTEM_SETTINGS = "SYSTEM_SETTINGS"


class ResourceType(str, Enum):
    """Types of resources that can be audited"""
    PAGE = "PAGE"
    ROLE = "ROLE"
    SYSTEM = "SYSTEM"
    USER = "USER"
    PERMISSION = "PERMISSION"


# Base schema
class AdminAuditLogBase(BaseModel):
    """Base schema for admin audit log"""
    action_type: AdminActionType
    resource_type: ResourceType
    resource_key: Optional[str] = None
    previous_value: Optional[str] = None
    new_value: Optional[str] = None
    description: Optional[str] = None
    metadata: Optional[Dict[str, Any]] = None


# Create schema (for internal use)
class AdminAuditLogCreate(AdminAuditLogBase):
    """Schema for creating a new audit log entry"""
    admin_user_id: int
    ip_address: Optional[str] = None
    user_agent: Optional[str] = None


# Response schema with user info
class AdminUserInfo(BaseModel):
    """Simplified user info for audit log response"""
    id: int
    username: str
    full_name: Optional[str] = None
    email: Optional[str] = None
    role: str

    model_config = ConfigDict(from_attributes=True)


class AdminAuditLogResponse(AdminAuditLogBase):
    """Schema for audit log response"""
    id: int
    admin_user_id: int
    admin_user: Optional[AdminUserInfo] = None
    ip_address: Optional[str] = None
    user_agent: Optional[str] = None
    created_at: datetime
    updated_at: Optional[datetime] = None

    model_config = ConfigDict(from_attributes=True)


# Filter schema
class AdminAuditLogFilters(BaseModel):
    """Schema for filtering audit logs"""
    action_type: Optional[AdminActionType] = Field(None, description="Filter by action type")
    resource_type: Optional[ResourceType] = Field(None, description="Filter by resource type")
    resource_key: Optional[str] = Field(None, description="Filter by resource key (exact match)")
    admin_id: Optional[int] = Field(None, description="Filter by admin user ID")
    start_date: Optional[datetime] = Field(None, description="Filter by start date")
    end_date: Optional[datetime] = Field(None, description="Filter by end date")
    search: Optional[str] = Field(None, description="Full-text search in description")
    skip: int = Field(0, ge=0, description="Number of records to skip")
    limit: int = Field(50, ge=1, le=100, description="Maximum number of records to return")
    sort_by: str = Field("created_at", description="Field to sort by")
    sort_order: str = Field("desc", pattern="^(asc|desc)$", description="Sort order: asc or desc")


# Statistics schema
class AdminAuditLogStats(BaseModel):
    """Statistics about audit logs"""
    total_changes_24h: int = Field(description="Total changes in last 24 hours")
    total_changes_7d: int = Field(description="Total changes in last 7 days")
    total_changes_30d: int = Field(description="Total changes in last 30 days")
    total_changes_all: int = Field(description="Total changes all time")

    top_admins: list[Dict[str, Any]] = Field(description="Top admins making changes")
    most_modified_pages: list[Dict[str, Any]] = Field(description="Most modified pages")
    most_modified_roles: list[Dict[str, Any]] = Field(description="Most modified roles")

    changes_by_action_type: Dict[str, int] = Field(description="Count by action type")
    changes_by_resource_type: Dict[str, int] = Field(description="Count by resource type")


# Export schema
class ExportFormat(str, Enum):
    """Export format options"""
    JSON = "json"
    CSV = "csv"


class AdminAuditLogExportRequest(BaseModel):
    """Schema for export request"""
    format: ExportFormat = Field(ExportFormat.JSON, description="Export format")
    filters: Optional[AdminAuditLogFilters] = Field(None, description="Filters to apply before export")


# Bulk operation metadata schema
class BulkOperationMetadata(BaseModel):
    """Metadata for bulk operations"""
    operation_type: str
    pages_affected: Optional[list[str]] = None
    roles_affected: Optional[list[str]] = None
    total_count: int
    success_count: int
    failed_count: int = 0


# Config change metadata schema
class ConfigChangeMetadata(BaseModel):
    """Metadata for configuration changes"""
    config_section: Optional[str] = None
    impact_level: Optional[str] = None  # "low", "medium", "high"
    requires_restart: bool = False
