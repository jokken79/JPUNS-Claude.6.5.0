from pydantic import BaseModel, Field
from datetime import datetime
from typing import Optional


class AuditLogBase(BaseModel):
    """Base schema for AuditLog (監査ログ)"""
    action: str = Field(..., min_length=1, max_length=100, description="Action performed")
    table_name: Optional[str] = Field(None, max_length=50, description="Table name affected")
    record_id: Optional[int] = Field(None, description="Record ID affected")
    old_values: Optional[dict] = Field(None, description="Old values before change")
    new_values: Optional[dict] = Field(None, description="New values after change")
    ip_address: Optional[str] = Field(None, max_length=50, description="IP address")
    user_agent: Optional[str] = Field(None, description="User agent string")


class AuditLogCreate(AuditLogBase):
    """Schema for creating a new audit log entry"""
    user_id: Optional[int] = Field(None, description="User ID who performed action")


class AuditLogResponse(AuditLogBase):
    """Schema for audit log response"""
    id: int
    user_id: Optional[int] = None
    created_at: datetime

    class Config:
        from_attributes = True
