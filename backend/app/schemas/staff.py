from pydantic import BaseModel, Field, EmailStr
from datetime import date, datetime
from typing import Optional


class StaffBase(BaseModel):
    """Base schema for Staff (スタッフ - Office/HR Personnel)"""
    staff_id: int = Field(..., description="Unique staff ID")
    rirekisho_id: Optional[str] = Field(None, max_length=20, description="Resume ID reference")

    # Personal information
    full_name_kanji: str = Field(..., min_length=1, max_length=100, description="Full name in kanji")
    full_name_kana: Optional[str] = Field(None, max_length=100, description="Full name in kana")
    photo_url: Optional[str] = Field(None, max_length=255, description="Photo URL")
    photo_data_url: Optional[str] = Field(None, description="Base64 photo data URL")
    date_of_birth: Optional[date] = Field(None, description="Date of birth")
    gender: Optional[str] = Field(None, max_length=10, description="Gender")
    nationality: Optional[str] = Field(None, max_length=50, description="Nationality")

    # Contact information
    address: Optional[str] = Field(None, description="Address")
    phone: Optional[str] = Field(None, max_length=20, description="Phone number")
    email: Optional[str] = Field(None, max_length=100, description="Email")
    emergency_contact_name: Optional[str] = Field(None, max_length=100, description="Emergency contact name")
    emergency_contact_phone: Optional[str] = Field(None, max_length=20, description="Emergency contact phone")
    emergency_contact_relationship: Optional[str] = Field(None, max_length=50, description="Emergency contact relationship")
    postal_code: Optional[str] = Field(None, max_length=10, description="Postal code")

    # Employment information
    hire_date: Optional[date] = Field(None, description="Hire date")
    position: Optional[str] = Field(None, max_length=100, description="Position")
    department: Optional[str] = Field(None, max_length=100, description="Department")
    monthly_salary: Optional[int] = Field(None, ge=0, description="Monthly salary")

    # Social insurance
    health_insurance: Optional[int] = Field(None, description="Health insurance amount")
    nursing_insurance: Optional[int] = Field(None, description="Nursing insurance amount")
    pension_insurance: Optional[int] = Field(None, description="Pension insurance amount")
    social_insurance_date: Optional[date] = Field(None, description="Social insurance date")

    # Yukyu (有給休暇)
    yukyu_total: int = Field(default=0, ge=0, description="Total yukyu days")
    yukyu_used: int = Field(default=0, ge=0, description="Used yukyu days")
    yukyu_remaining: int = Field(default=0, ge=0, description="Remaining yukyu days")
    is_corporate_housing: bool = Field(default=False, description="Corporate housing flag")
    housing_subsidy: int = Field(default=0, ge=0, description="Housing subsidy amount")

    # Status
    is_active: bool = Field(default=True, description="Active status")
    termination_date: Optional[date] = Field(None, description="Termination date")
    termination_reason: Optional[str] = Field(None, description="Termination reason")
    notes: Optional[str] = Field(None, description="Additional notes")


class StaffCreate(StaffBase):
    """Schema for creating a new staff member"""
    pass


class StaffUpdate(BaseModel):
    """Schema for updating a staff member (all fields optional)"""
    rirekisho_id: Optional[str] = Field(None, max_length=20)
    full_name_kanji: Optional[str] = Field(None, max_length=100)
    full_name_kana: Optional[str] = Field(None, max_length=100)
    date_of_birth: Optional[date] = None
    gender: Optional[str] = Field(None, max_length=10)
    nationality: Optional[str] = Field(None, max_length=50)
    address: Optional[str] = None
    phone: Optional[str] = Field(None, max_length=20)
    email: Optional[str] = Field(None, max_length=100)
    hire_date: Optional[date] = None
    position: Optional[str] = Field(None, max_length=100)
    department: Optional[str] = Field(None, max_length=100)
    monthly_salary: Optional[int] = Field(None, ge=0)
    is_active: Optional[bool] = None
    notes: Optional[str] = None


class StaffResponse(StaffBase):
    """Schema for staff response"""
    id: int
    created_at: datetime
    updated_at: Optional[datetime] = None
    deleted_at: Optional[datetime] = None

    class Config:
        from_attributes = True
