from pydantic import BaseModel, Field
from datetime import datetime
from typing import Optional


class WorkplaceBase(BaseModel):
    """Base schema for Workplace (職場)"""
    name: str = Field(..., min_length=1, max_length=200, description="Workplace name")
    workplace_type: Optional[str] = Field(None, max_length=50, description="Type: factory, office, warehouse, etc.")
    company_name: Optional[str] = Field(None, max_length=100, description="Company name")
    location_name: Optional[str] = Field(None, max_length=100, description="Location name")
    region_id: Optional[int] = Field(None, description="Region/Prefecture ID")
    address: Optional[str] = Field(None, description="Full address")
    description: Optional[str] = Field(None, description="Description")
    is_active: bool = Field(default=True, description="Active status")


class WorkplaceCreate(WorkplaceBase):
    """Schema for creating a new workplace"""
    pass


class WorkplaceUpdate(BaseModel):
    """Schema for updating a workplace (all fields optional)"""
    name: Optional[str] = Field(None, min_length=1, max_length=200)
    workplace_type: Optional[str] = Field(None, max_length=50)
    company_name: Optional[str] = Field(None, max_length=100)
    location_name: Optional[str] = Field(None, max_length=100)
    region_id: Optional[int] = None
    address: Optional[str] = None
    description: Optional[str] = None
    is_active: Optional[bool] = None


class WorkplaceResponse(WorkplaceBase):
    """Schema for workplace response"""
    id: int
    created_at: datetime
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True
