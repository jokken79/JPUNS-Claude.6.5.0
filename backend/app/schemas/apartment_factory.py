from pydantic import BaseModel, Field
from datetime import date, datetime
from typing import Optional
from decimal import Decimal


class ApartmentFactoryBase(BaseModel):
    """Base schema for ApartmentFactory M:N relationship"""
    apartment_id: int = Field(..., description="Apartment ID")
    factory_id: int = Field(..., description="Factory ID")
    is_primary: bool = Field(default=True, description="Primary factory for this apartment")
    priority: int = Field(default=1, ge=1, description="Priority order")
    distance_km: Optional[Decimal] = Field(None, ge=0, max_digits=6, decimal_places=2, description="Distance in km")
    commute_minutes: Optional[int] = Field(None, ge=0, description="Commute time in minutes")
    effective_from: date = Field(default_factory=date.today, description="Effective from date")
    effective_until: Optional[date] = Field(None, description="Effective until date")
    notes: Optional[str] = Field(None, description="Additional notes")


class ApartmentFactoryCreate(ApartmentFactoryBase):
    """Schema for creating a new apartment-factory association"""
    pass


class ApartmentFactoryUpdate(BaseModel):
    """Schema for updating an apartment-factory association (all fields optional)"""
    is_primary: Optional[bool] = None
    priority: Optional[int] = Field(None, ge=1)
    distance_km: Optional[Decimal] = Field(None, ge=0, max_digits=6, decimal_places=2)
    commute_minutes: Optional[int] = Field(None, ge=0)
    effective_from: Optional[date] = None
    effective_until: Optional[date] = None
    notes: Optional[str] = None


class ApartmentFactoryResponse(ApartmentFactoryBase):
    """Schema for apartment-factory response"""
    id: int
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True
