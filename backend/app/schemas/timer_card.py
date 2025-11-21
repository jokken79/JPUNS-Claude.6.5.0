"""
Timer Card Schemas
"""
from pydantic import BaseModel, ConfigDict
from typing import Optional, List, Any, Dict
from datetime import date, time, datetime
from decimal import Decimal
from app.models.models import ShiftType


class EmployeeMatchInfo(BaseModel):
    """Información de empleado matched"""
    hakenmoto_id: Optional[int] = None
    full_name_kanji: str
    confidence: float  # 0.0-1.0


class TimerCardBase(BaseModel):
    """Base timer card schema"""
    hakenmoto_id: int
    factory_id: str
    work_date: date
    clock_in: Optional[time] = None
    clock_out: Optional[time] = None
    break_minutes: int = 0
    shift_type: Optional[ShiftType] = None
    notes: Optional[str] = None


class TimerCardCreate(TimerCardBase):
    """Create timer card"""
    pass


class TimerCardUpdate(BaseModel):
    """Update timer card"""
    clock_in: Optional[time] = None
    clock_out: Optional[time] = None
    break_minutes: Optional[int] = None
    shift_type: Optional[ShiftType] = None
    notes: Optional[str] = None
    is_approved: Optional[bool] = None


class TimerCardResponse(TimerCardBase):
    """Timer card response"""
    id: int
    regular_hours: Decimal
    overtime_hours: Decimal
    night_hours: Decimal
    holiday_hours: Decimal
    is_approved: bool
    created_at: datetime
    updated_at: Optional[datetime]
    
    model_config = ConfigDict(from_attributes=True)


class TimerCardBulkCreate(BaseModel):
    """Bulk create timer cards"""
    records: list[TimerCardCreate]


class TimerCardProcessResult(BaseModel):
    """Timer card processing result"""
    total_records: int
    successful: int
    failed: int
    errors: list[str]
    created_ids: list[int]


class TimerCardOCRData(BaseModel):
    """Datos extraídos de timer card por OCR"""
    page_number: int
    work_date: str  # YYYY-MM-DD
    employee_name_ocr: str  # Nombre extraído del PDF
    employee_matched: Optional[EmployeeMatchInfo] = None
    clock_in: str  # HH:MM
    clock_out: str  # HH:MM
    break_minutes: int = 0
    validation_errors: List[str] = []
    confidence_score: float = 0.0  # Confianza del OCR


class TimerCardUploadResponse(BaseModel):
    """Respuesta del endpoint de upload con OCR"""
    file_name: str
    pages_processed: int
    records_found: int
    ocr_data: List[TimerCardOCRData]
    processing_errors: List[Dict[str, Any]] = []
    message: str


class TimerCardApprove(BaseModel):
    """Approve timer cards"""
    timer_card_ids: list[int]
    notes: Optional[str] = None
