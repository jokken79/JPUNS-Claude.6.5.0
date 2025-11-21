"""
Schemas para Background Jobs
"""
from pydantic import BaseModel
from typing import Optional, Any, Dict
from datetime import datetime


class JobResponse(BaseModel):
    """Respuesta de creación de job"""
    job_id: str
    job_type: str
    status: str
    message: str

    class Config:
        from_attributes = True


class JobStatusResponse(BaseModel):
    """Estado actual de un job"""
    job_id: str
    job_type: str
    status: str  # pending, processing, completed, failed
    result: Optional[Any] = None
    error: Optional[str] = None
    created_at: datetime
    started_at: Optional[datetime] = None
    finished_at: Optional[datetime] = None
    progress_percentage: Optional[int] = None  # 0-100

    class Config:
        from_attributes = True


class OCRJobRequest(BaseModel):
    """Request para crear job de OCR"""
    document_type: str  # "zairyu_card", "rirekisho", "license", "timer_card"
    preferred_method: str = "auto"  # "azure", "easyocr", "auto"

    class Config:
        from_attributes = True
