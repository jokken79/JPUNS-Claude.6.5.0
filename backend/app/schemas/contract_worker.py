from pydantic import BaseModel, Field, EmailStr
from datetime import date, datetime
from typing import Optional


class ContractWorkerBase(BaseModel):
    """Base schema for ContractWorker (請負社員)"""
    hakenmoto_id: int = Field(..., description="Unique contract worker ID")
    rirekisho_id: Optional[str] = Field(None, max_length=20, description="Resume ID reference")
    factory_id: Optional[str] = Field(None, max_length=200, description="Factory ID (Company__Plant)")
    company_name: Optional[str] = Field(None, max_length=100, description="Company name")
    plant_name: Optional[str] = Field(None, max_length=100, description="Plant name")
    hakensaki_shain_id: Optional[str] = Field(None, max_length=50, description="Client company employee ID")

    # Personal information
    full_name_kanji: str = Field(..., min_length=1, max_length=100, description="Full name in kanji")
    full_name_kana: Optional[str] = Field(None, max_length=100, description="Full name in kana")
    photo_url: Optional[str] = Field(None, max_length=255, description="Photo URL")
    photo_data_url: Optional[str] = Field(None, description="Base64 photo data URL")
    date_of_birth: Optional[date] = Field(None, description="Date of birth")
    gender: Optional[str] = Field(None, max_length=10, description="Gender")
    nationality: Optional[str] = Field(None, max_length=50, description="Nationality")
    zairyu_card_number: Optional[str] = Field(None, max_length=50, description="Residence card number")
    zairyu_expire_date: Optional[date] = Field(None, description="Residence card expiry")

    # Contact information
    address: Optional[str] = Field(None, description="Address")
    phone: Optional[str] = Field(None, max_length=20, description="Phone number")
    email: Optional[str] = Field(None, max_length=100, description="Email")
    emergency_contact_name: Optional[str] = Field(None, max_length=100, description="Emergency contact name")
    emergency_contact_phone: Optional[str] = Field(None, max_length=20, description="Emergency contact phone")
    emergency_contact_relationship: Optional[str] = Field(None, max_length=50, description="Emergency contact relationship")

    # Employment information
    hire_date: Optional[date] = Field(None, description="Hire date")
    current_hire_date: Optional[date] = Field(None, description="Current factory hire date")
    jikyu: Optional[int] = Field(None, ge=0, description="Hourly wage (時給)")
    jikyu_revision_date: Optional[date] = Field(None, description="Wage revision date")
    position: Optional[str] = Field(None, max_length=100, description="Position")
    contract_type: Optional[str] = Field(None, max_length=50, description="Contract type")

    # Assignment information
    assignment_location: Optional[str] = Field(None, max_length=200, description="Assignment location")
    assignment_line: Optional[str] = Field(None, max_length=200, description="Assignment line")
    job_description: Optional[str] = Field(None, description="Job description")

    # Financial information
    hourly_rate_charged: Optional[int] = Field(None, ge=0, description="Hourly rate charged to client")
    billing_revision_date: Optional[date] = Field(None, description="Billing revision date")
    profit_difference: Optional[int] = Field(None, description="Profit difference")
    standard_compensation: Optional[int] = Field(None, description="Standard compensation")
    health_insurance: Optional[int] = Field(None, description="Health insurance amount")
    nursing_insurance: Optional[int] = Field(None, description="Nursing insurance amount")
    pension_insurance: Optional[int] = Field(None, description="Pension insurance amount")
    social_insurance_date: Optional[date] = Field(None, description="Social insurance date")

    # Visa and documents
    visa_type: Optional[str] = Field(None, max_length=50, description="Visa type")
    license_type: Optional[str] = Field(None, max_length=100, description="License type")
    license_expire_date: Optional[date] = Field(None, description="License expiry date")
    commute_method: Optional[str] = Field(None, max_length=50, description="Commute method")
    optional_insurance_expire: Optional[date] = Field(None, description="Optional insurance expiry")
    japanese_level: Optional[str] = Field(None, max_length=50, description="Japanese language level")
    career_up_5years: bool = Field(default=False, description="Career up 5 years flag")
    entry_request_date: Optional[date] = Field(None, description="Entry request date")
    notes: Optional[str] = Field(None, description="Additional notes")
    postal_code: Optional[str] = Field(None, max_length=10, description="Postal code")

    # Apartment
    apartment_id: Optional[int] = Field(None, description="Apartment ID")
    apartment_start_date: Optional[date] = Field(None, description="Apartment start date")
    apartment_move_out_date: Optional[date] = Field(None, description="Apartment move out date")
    apartment_rent: Optional[int] = Field(None, ge=0, description="Apartment rent")
    is_corporate_housing: bool = Field(default=False, description="Corporate housing flag")
    housing_subsidy: int = Field(default=0, ge=0, description="Housing subsidy amount")

    # Yukyu (有給休暇)
    yukyu_total: int = Field(default=0, ge=0, description="Total yukyu days")
    yukyu_used: int = Field(default=0, ge=0, description="Used yukyu days")
    yukyu_remaining: int = Field(default=0, ge=0, description="Remaining yukyu days")

    # Status
    is_active: bool = Field(default=True, description="Active status")
    termination_date: Optional[date] = Field(None, description="Termination date")
    termination_reason: Optional[str] = Field(None, description="Termination reason")


class ContractWorkerCreate(ContractWorkerBase):
    """Schema for creating a new contract worker"""
    pass


class ContractWorkerUpdate(BaseModel):
    """Schema for updating a contract worker (all fields optional)"""
    rirekisho_id: Optional[str] = Field(None, max_length=20)
    factory_id: Optional[str] = Field(None, max_length=200)
    company_name: Optional[str] = Field(None, max_length=100)
    plant_name: Optional[str] = Field(None, max_length=100)
    hakensaki_shain_id: Optional[str] = Field(None, max_length=50)
    full_name_kanji: Optional[str] = Field(None, max_length=100)
    full_name_kana: Optional[str] = Field(None, max_length=100)
    date_of_birth: Optional[date] = None
    gender: Optional[str] = Field(None, max_length=10)
    nationality: Optional[str] = Field(None, max_length=50)
    address: Optional[str] = None
    phone: Optional[str] = Field(None, max_length=20)
    email: Optional[str] = Field(None, max_length=100)
    hire_date: Optional[date] = None
    jikyu: Optional[int] = Field(None, ge=0)
    position: Optional[str] = Field(None, max_length=100)
    is_active: Optional[bool] = None
    notes: Optional[str] = None


class ContractWorkerResponse(ContractWorkerBase):
    """Schema for contract worker response"""
    id: int
    created_at: datetime
    updated_at: Optional[datetime] = None
    deleted_at: Optional[datetime] = None

    class Config:
        from_attributes = True
