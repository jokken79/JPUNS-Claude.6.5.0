from pydantic import BaseModel, Field
from datetime import datetime
from typing import Optional


class RegionBase(BaseModel):
    """Base schema for Region (地域)"""
    name: str = Field(..., min_length=1, max_length=100, description="Region name")
    description: Optional[str] = Field(None, description="Region description")
    is_active: bool = Field(default=True, description="Active status")


class RegionCreate(RegionBase):
    """Schema for creating a new region"""
    pass


class RegionUpdate(BaseModel):
    """Schema for updating a region (all fields optional)"""
    name: Optional[str] = Field(None, min_length=1, max_length=100)
    description: Optional[str] = None
    is_active: Optional[bool] = None


class RegionResponse(RegionBase):
    """Schema for region response"""
    id: int
    created_at: datetime
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True
