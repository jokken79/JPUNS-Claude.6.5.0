"""Reusable response schemas."""
from __future__ import annotations

from typing import Any, Dict, Optional

from pydantic import BaseModel, Field


class BaseResponse(BaseModel):
    success: bool = Field(..., description="Indicates if the operation was successful")
    message: Optional[str] = Field(None, description="Optional human readable message")


class OCRData(BaseModel):
    text: str | None = Field(None, description="Extracted text")
    method: Optional[str] = Field(None, description="OCR method used")
    confidence: Optional[float] = Field(None, description="Confidence score")
    processing_time: Optional[float] = Field(None, description="Processing time in seconds")
    document_type: Optional[str] = None
    cache_key: Optional[str] = None


class OCRResponse(BaseResponse):
    data: OCRData | Dict[str, Any]


class CacheStatsResponse(BaseResponse):
    stats: Dict[str, Any]


class ErrorResponse(BaseModel):
    detail: str


__all__ = ["BaseResponse", "OCRData", "OCRResponse", "CacheStatsResponse", "ErrorResponse"]
