from pydantic import BaseModel, Field
from datetime import date, datetime
from typing import Optional


class SocialInsuranceRateBase(BaseModel):
    """Base schema for SocialInsuranceRate (社会保険料率)"""
    # Compensation range (標準報酬月額)
    min_compensation: int = Field(..., ge=0, description="Minimum compensation for this bracket")
    max_compensation: int = Field(..., ge=0, description="Maximum compensation for this bracket")
    standard_compensation: int = Field(..., ge=0, description="Standard monthly compensation (標準報酬月額)")

    # Health insurance (健康保険料)
    health_insurance_total: Optional[int] = Field(None, ge=0, description="Total health insurance")
    health_insurance_employee: Optional[int] = Field(None, ge=0, description="Employee portion of health insurance")
    health_insurance_employer: Optional[int] = Field(None, ge=0, description="Employer portion of health insurance")

    # Nursing insurance (介護保険料) - only for 40+ years old
    nursing_insurance_total: Optional[int] = Field(None, ge=0, description="Total nursing insurance")
    nursing_insurance_employee: Optional[int] = Field(None, ge=0, description="Employee portion of nursing insurance")
    nursing_insurance_employer: Optional[int] = Field(None, ge=0, description="Employer portion of nursing insurance")

    # Pension insurance (厚生年金保険料)
    pension_insurance_total: Optional[int] = Field(None, ge=0, description="Total pension insurance")
    pension_insurance_employee: Optional[int] = Field(None, ge=0, description="Employee portion of pension insurance")
    pension_insurance_employer: Optional[int] = Field(None, ge=0, description="Employer portion of pension insurance")

    # Metadata
    effective_date: date = Field(..., description="Effective date for this rate")
    prefecture: str = Field(default="愛知", max_length=20, description="Prefecture")
    notes: Optional[str] = Field(None, description="Additional notes")


class SocialInsuranceRateCreate(SocialInsuranceRateBase):
    """Schema for creating a new social insurance rate"""
    pass


class SocialInsuranceRateUpdate(BaseModel):
    """Schema for updating a social insurance rate (all fields optional)"""
    min_compensation: Optional[int] = Field(None, ge=0)
    max_compensation: Optional[int] = Field(None, ge=0)
    standard_compensation: Optional[int] = Field(None, ge=0)
    health_insurance_total: Optional[int] = Field(None, ge=0)
    health_insurance_employee: Optional[int] = Field(None, ge=0)
    health_insurance_employer: Optional[int] = Field(None, ge=0)
    nursing_insurance_total: Optional[int] = Field(None, ge=0)
    nursing_insurance_employee: Optional[int] = Field(None, ge=0)
    nursing_insurance_employer: Optional[int] = Field(None, ge=0)
    pension_insurance_total: Optional[int] = Field(None, ge=0)
    pension_insurance_employee: Optional[int] = Field(None, ge=0)
    pension_insurance_employer: Optional[int] = Field(None, ge=0)
    effective_date: Optional[date] = None
    prefecture: Optional[str] = Field(None, max_length=20)
    notes: Optional[str] = None


class SocialInsuranceRateResponse(SocialInsuranceRateBase):
    """Schema for social insurance rate response"""
    id: int
    created_at: datetime

    class Config:
        from_attributes = True
