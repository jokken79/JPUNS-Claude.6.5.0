from pydantic import BaseModel, Field
from datetime import datetime
from typing import Optional


class PageVisibilityBase(BaseModel):
    """Base schema for PageVisibility (ページ表示設定)"""
    page_key: str = Field(..., min_length=1, max_length=100, description="Page key identifier")
    page_name: str = Field(..., min_length=1, max_length=100, description="Page display name")
    page_name_en: Optional[str] = Field(None, max_length=100, description="English page name")
    is_enabled: bool = Field(default=True, description="Page is visible (True) or under construction (False)")
    path: str = Field(..., min_length=1, max_length=255, description="Route path")
    description: Optional[str] = Field(None, description="Admin notes")
    disabled_message: Optional[str] = Field(None, max_length=255, description="Custom message when disabled")


class PageVisibilityCreate(PageVisibilityBase):
    """Schema for creating a new page visibility setting"""
    pass


class PageVisibilityUpdate(BaseModel):
    """Schema for updating page visibility (all fields optional)"""
    page_name: Optional[str] = Field(None, max_length=100)
    page_name_en: Optional[str] = Field(None, max_length=100)
    is_enabled: Optional[bool] = None
    path: Optional[str] = Field(None, max_length=255)
    description: Optional[str] = None
    disabled_message: Optional[str] = Field(None, max_length=255)


class PageVisibilityResponse(PageVisibilityBase):
    """Schema for page visibility response"""
    id: int
    last_toggled_by: Optional[int] = None
    last_toggled_at: Optional[datetime] = None
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True
