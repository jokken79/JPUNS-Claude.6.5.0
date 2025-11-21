from pydantic import BaseModel, Field
from datetime import datetime
from typing import Optional


class DepartmentBase(BaseModel):
    """Base schema for Department (部署)"""
    name: str = Field(..., min_length=1, max_length=100, description="Department name")
    description: Optional[str] = Field(None, description="Department description")
    is_active: bool = Field(default=True, description="Active status")


class DepartmentCreate(DepartmentBase):
    """Schema for creating a new department"""
    pass


class DepartmentUpdate(BaseModel):
    """Schema for updating a department (all fields optional)"""
    name: Optional[str] = Field(None, min_length=1, max_length=100)
    description: Optional[str] = None
    is_active: Optional[bool] = None


class DepartmentResponse(DepartmentBase):
    """Schema for department response"""
    id: int
    created_at: datetime
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True
