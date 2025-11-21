from pydantic import BaseModel, Field
from datetime import datetime
from typing import Optional


class RolePagePermissionBase(BaseModel):
    """Base schema for RolePagePermission (ロール権限)"""
    role_key: str = Field(..., min_length=1, max_length=50, description="Role key (ADMIN, KEITOSAN, etc.)")
    page_key: str = Field(..., min_length=1, max_length=100, description="Page key identifier")
    is_enabled: bool = Field(default=True, description="Role can access this page")


class RolePagePermissionCreate(RolePagePermissionBase):
    """Schema for creating a new role-page permission"""
    pass


class RolePagePermissionUpdate(BaseModel):
    """Schema for updating role-page permission (all fields optional)"""
    is_enabled: Optional[bool] = None


class RolePagePermissionResponse(RolePagePermissionBase):
    """Schema for role-page permission response"""
    id: int
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True
