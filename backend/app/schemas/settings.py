"""
Pydantic schemas for system settings
"""
from pydantic import BaseModel, Field, ConfigDict
from datetime import datetime


class VisibilityToggleResponse(BaseModel):
    """Response model for visibility toggle status"""
    enabled: bool = Field(description="Whether content visibility is enabled for ADMIN and KANRINSHA")
    updated_at: datetime | None = None

    model_config = ConfigDict(from_attributes=True)


class VisibilityToggleUpdate(BaseModel):
    """Request model for updating visibility toggle"""
    enabled: bool = Field(description="Enable or disable content visibility")


class SystemSettingResponse(BaseModel):
    """Response model for system settings"""
    id: int
    key: str
    value: str | None = None
    description: str | None = None
    updated_at: datetime | None = None
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)
