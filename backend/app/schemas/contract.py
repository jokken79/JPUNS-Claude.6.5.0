"""
Contract Schemas for UNS-ClaudeJP
"""
from pydantic import BaseModel, Field
from typing import Optional
from datetime import datetime, date


class ContractBase(BaseModel):
    """Base schema for contract"""
    employee_id: int = Field(..., description="Employee ID")
    contract_type: str = Field(..., min_length=1, max_length=50, description="Contract type")
    contract_number: Optional[str] = Field(None, max_length=50, description="Contract number")
    start_date: date = Field(..., description="Contract start date")
    end_date: Optional[date] = Field(None, description="Contract end date")
    pdf_path: Optional[str] = Field(None, max_length=500, description="Path to PDF file")
    signed: bool = Field(False, description="Whether contract is signed")
    signed_at: Optional[datetime] = Field(None, description="Signature timestamp")
    signature_data: Optional[str] = Field(None, description="Base64 signature data")


class ContractCreate(ContractBase):
    """Schema for creating contract"""
    pass


class ContractUpdate(BaseModel):
    """Schema for updating contract"""
    employee_id: Optional[int] = None
    contract_type: Optional[str] = Field(None, min_length=1, max_length=50)
    contract_number: Optional[str] = Field(None, max_length=50)
    start_date: Optional[date] = None
    end_date: Optional[date] = None
    pdf_path: Optional[str] = Field(None, max_length=500)
    signed: Optional[bool] = None
    signed_at: Optional[datetime] = None
    signature_data: Optional[str] = None


class ContractResponse(ContractBase):
    """Schema for contract response"""
    id: int
    created_at: datetime
    deleted_at: Optional[datetime] = Field(None, description="Soft delete timestamp")

    class Config:
        from_attributes = True
