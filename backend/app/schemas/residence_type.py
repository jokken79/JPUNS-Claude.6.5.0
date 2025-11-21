from pydantic import BaseModel, Field
from datetime import datetime
from typing import Optional


class ResidenceTypeBase(BaseModel):
    """Base schema for ResidenceType"""
    name: str = Field(..., min_length=1, max_length=50, description="Residence type name")
    description: Optional[str] = Field(None, description="Residence type description")
    is_active: bool = Field(default=True, description="Active status")


class ResidenceTypeCreate(ResidenceTypeBase):
    """Schema for creating a new residence type"""
    pass


class ResidenceTypeUpdate(BaseModel):
    """Schema for updating a residence type (all fields optional)"""
    name: Optional[str] = Field(None, min_length=1, max_length=50)
    description: Optional[str] = None
    is_active: Optional[bool] = None


class ResidenceTypeResponse(ResidenceTypeBase):
    """Schema for residence type response"""
    id: int
    created_at: datetime
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True
