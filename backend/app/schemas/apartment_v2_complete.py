from pydantic import BaseModel, Field
from datetime import date, datetime
from typing import Optional
from decimal import Decimal
from enum import Enum


class RoomType(str, Enum):
    """Room type classifications for apartments"""
    ONE_K = "1K"
    ONE_DK = "1DK"
    ONE_LDK = "1LDK"
    TWO_K = "2K"
    TWO_DK = "2DK"
    TWO_LDK = "2LDK"
    THREE_LDK = "3LDK"
    STUDIO = "studio"
    OTHER = "other"


class ApartmentStatus(str, Enum):
    """Status of apartment availability"""
    ACTIVE = "active"
    INACTIVE = "inactive"
    MAINTENANCE = "maintenance"
    RESERVED = "reserved"


class ApartmentBaseV2Complete(BaseModel):
    """Complete base schema for Apartment with all 35 fields"""
    # Basic identification
    apartment_code: Optional[str] = Field(None, max_length=50, description="Apartment unique code")
    name: str = Field(..., min_length=1, max_length=200, description="Primary apartment name")
    building_name: Optional[str] = Field(None, max_length=200, description="Building name")
    room_number: Optional[str] = Field(None, max_length=20, description="Room number")
    floor_number: Optional[int] = Field(None, description="Floor number")

    # Address information
    postal_code: Optional[str] = Field(None, max_length=10, description="Postal code")
    prefecture: Optional[str] = Field(None, max_length=50, description="Prefecture")
    city: Optional[str] = Field(None, max_length=100, description="City")
    address: Optional[str] = Field(None, description="Full address (legacy field)")
    address_line1: Optional[str] = Field(None, max_length=200, description="Address line 1")
    address_line2: Optional[str] = Field(None, max_length=200, description="Address line 2")

    # Geographic organization
    region_id: Optional[int] = Field(None, description="Region ID")
    zone: Optional[str] = Field(None, max_length=50, description="Zone identifier")

    # Room specifications
    room_type: Optional[RoomType] = Field(None, description="Room type (1K, 1LDK, etc.)")
    size_sqm: Optional[Decimal] = Field(None, ge=0, max_digits=6, decimal_places=2, description="Size in square meters")
    capacity: Optional[int] = Field(None, ge=1, description="Maximum capacity (people)")

    # Property information
    property_type: Optional[str] = Field(None, max_length=50, description="Property type (Casa, Edificio, etc.)")

    # Financial information
    base_rent: int = Field(..., ge=0, description="Base monthly rent")
    monthly_rent: Optional[int] = Field(None, ge=0, description="Monthly rent (legacy field)")
    management_fee: int = Field(default=0, ge=0, description="Management/common area fee")
    deposit: int = Field(default=0, ge=0, description="Deposit (敷金 - Shikikin)")
    key_money: int = Field(default=0, ge=0, description="Key money (礼金 - Reikin)")
    default_cleaning_fee: int = Field(default=20000, ge=0, description="Default cleaning charge on move-out")
    parking_spaces: Optional[int] = Field(None, ge=0, description="Number of parking spaces")
    parking_price_per_unit: Optional[int] = Field(None, ge=0, description="Price per parking space in yen")
    initial_plus: int = Field(default=5000, ge=0, description="Additional initial costs")

    # Contract with landlord/agency
    contract_start_date: Optional[date] = Field(None, description="Contract start date")
    contract_end_date: Optional[date] = Field(None, description="Contract end date")
    landlord_name: Optional[str] = Field(None, max_length=200, description="Landlord name")
    landlord_contact: Optional[str] = Field(None, max_length=200, description="Landlord contact")
    real_estate_agency: Optional[str] = Field(None, max_length=200, description="Real estate agency")
    emergency_contact: Optional[str] = Field(None, max_length=200, description="Emergency contact")

    # Status and metadata
    status: ApartmentStatus = Field(default=ApartmentStatus.ACTIVE, description="Apartment status")
    is_available: bool = Field(default=True, description="Available for assignment (legacy field)")
    notes: Optional[str] = Field(None, description="Additional notes")


class ApartmentCreateV2Complete(ApartmentBaseV2Complete):
    """Schema for creating a new apartment with all fields"""
    pass


class ApartmentUpdateV2Complete(BaseModel):
    """Schema for updating an apartment (all fields optional)"""
    apartment_code: Optional[str] = Field(None, max_length=50)
    name: Optional[str] = Field(None, min_length=1, max_length=200)
    building_name: Optional[str] = Field(None, max_length=200)
    room_number: Optional[str] = Field(None, max_length=20)
    floor_number: Optional[int] = None

    postal_code: Optional[str] = Field(None, max_length=10)
    prefecture: Optional[str] = Field(None, max_length=50)
    city: Optional[str] = Field(None, max_length=100)
    address: Optional[str] = None
    address_line1: Optional[str] = Field(None, max_length=200)
    address_line2: Optional[str] = Field(None, max_length=200)

    region_id: Optional[int] = None
    zone: Optional[str] = Field(None, max_length=50)

    room_type: Optional[RoomType] = None
    size_sqm: Optional[Decimal] = Field(None, ge=0, max_digits=6, decimal_places=2)
    capacity: Optional[int] = Field(None, ge=1)

    property_type: Optional[str] = Field(None, max_length=50)

    base_rent: Optional[int] = Field(None, ge=0)
    monthly_rent: Optional[int] = Field(None, ge=0)
    management_fee: Optional[int] = Field(None, ge=0)
    deposit: Optional[int] = Field(None, ge=0)
    key_money: Optional[int] = Field(None, ge=0)
    default_cleaning_fee: Optional[int] = Field(None, ge=0)
    parking_spaces: Optional[int] = Field(None, ge=0)
    parking_price_per_unit: Optional[int] = Field(None, ge=0)
    initial_plus: Optional[int] = Field(None, ge=0)

    contract_start_date: Optional[date] = None
    contract_end_date: Optional[date] = None
    landlord_name: Optional[str] = Field(None, max_length=200)
    landlord_contact: Optional[str] = Field(None, max_length=200)
    real_estate_agency: Optional[str] = Field(None, max_length=200)
    emergency_contact: Optional[str] = Field(None, max_length=200)

    status: Optional[ApartmentStatus] = None
    is_available: Optional[bool] = None
    notes: Optional[str] = None


class ApartmentResponseV2Complete(ApartmentBaseV2Complete):
    """Schema for apartment response with all fields"""
    id: int
    created_at: datetime
    updated_at: Optional[datetime] = None
    deleted_at: Optional[datetime] = None

    class Config:
        from_attributes = True


class ApartmentWithEmployeesV2Complete(ApartmentResponseV2Complete):
    """Apartment response with employee count"""
    employees_count: int = Field(default=0, description="Number of employees assigned")
    occupancy_rate: float = Field(default=0.0, ge=0.0, le=100.0, description="Occupancy percentage")

    class Config:
        from_attributes = True
