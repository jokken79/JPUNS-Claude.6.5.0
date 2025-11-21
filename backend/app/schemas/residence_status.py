from pydantic import BaseModel, Field
from datetime import datetime
from typing import Optional


class ResidenceStatusBase(BaseModel):
    """Base schema for ResidenceStatus (在留ステータス)"""
    name: str = Field(..., min_length=1, max_length=100, description="Residence status name")
    code: Optional[str] = Field(None, max_length=20, description="Short code for status")
    description: Optional[str] = Field(None, description="Status description")
    max_duration_months: Optional[int] = Field(None, ge=0, description="Maximum duration in months")
    is_active: bool = Field(default=True, description="Active status")


class ResidenceStatusCreate(ResidenceStatusBase):
    """Schema for creating a new residence status"""
    pass


class ResidenceStatusUpdate(BaseModel):
    """Schema for updating a residence status (all fields optional)"""
    name: Optional[str] = Field(None, min_length=1, max_length=100)
    code: Optional[str] = Field(None, max_length=20)
    description: Optional[str] = None
    max_duration_months: Optional[int] = Field(None, ge=0)
    is_active: Optional[bool] = None


class ResidenceStatusResponse(ResidenceStatusBase):
    """Schema for residence status response"""
    id: int
    created_at: datetime
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True
