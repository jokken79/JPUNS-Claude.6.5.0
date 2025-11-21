from pydantic import BaseModel, Field
from datetime import datetime
from typing import Optional
from enum import Enum


class DocumentType(str, Enum):
    """Document types for validation"""
    RIREKISHO = "rirekisho"
    ZAIRYU_CARD = "zairyu_card"
    LICENSE = "license"
    CONTRACT = "contract"
    OTHER = "other"


class DocumentBase(BaseModel):
    """Base schema for Document"""
    document_type: DocumentType = Field(..., description="Type of document")
    file_name: str = Field(..., min_length=1, max_length=255, description="File name")
    file_path: str = Field(..., min_length=1, max_length=500, description="File path")
    file_size: Optional[int] = Field(None, ge=0, description="File size in bytes")
    mime_type: Optional[str] = Field(None, max_length=100, description="MIME type")
    ocr_data: Optional[dict] = Field(None, description="OCR extracted data")


class DocumentCreate(DocumentBase):
    """Schema for creating a new document"""
    candidate_id: Optional[int] = Field(None, description="Candidate ID (if applicable)")
    employee_id: Optional[int] = Field(None, description="Employee ID (if applicable)")
    uploaded_by: Optional[int] = Field(None, description="User ID who uploaded")

    # At least one parent ID must be provided
    def validate_parent(self):
        if not self.candidate_id and not self.employee_id:
            raise ValueError("Either candidate_id or employee_id must be provided")


class DocumentUpdate(BaseModel):
    """Schema for updating a document (all fields optional)"""
    document_type: Optional[DocumentType] = None
    file_name: Optional[str] = Field(None, min_length=1, max_length=255)
    file_path: Optional[str] = Field(None, min_length=1, max_length=500)
    file_size: Optional[int] = Field(None, ge=0)
    mime_type: Optional[str] = Field(None, max_length=100)
    ocr_data: Optional[dict] = None
    candidate_id: Optional[int] = None
    employee_id: Optional[int] = None


class DocumentResponse(DocumentBase):
    """Schema for document response"""
    id: int
    candidate_id: Optional[int] = None
    employee_id: Optional[int] = None
    uploaded_by: Optional[int] = None
    uploaded_at: datetime

    class Config:
        from_attributes = True
