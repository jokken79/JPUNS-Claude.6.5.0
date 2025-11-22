"""
Unified API Response Schemas - FASE 4 #4

This module provides standardized response formats for all API endpoints,
matching the error response structure from FASE 4 #2.

Response Format:
    Success Response:
        {
            "success": true,
            "data": <any>,
            "metadata": {
                "timestamp": "2025-11-22T10:30:00.000Z",
                "request_id": "uuid",
                "version": "1.0"
            }
        }
    
    Error Response (from FASE 4 #2):
        {
            "success": false,
            "error": {
                "code": "ERR_...",
                "message": "...",
                "status": 4xx/5xx,
                "request_id": "uuid",
                "timestamp": "ISO 8601"
            }
        }

Usage:
    from app.schemas.responses import SuccessResponse, PaginatedResponse
    
    # Single resource
    @app.get("/users/{id}", response_model=SuccessResponse[UserSchema])
    async def get_user(id: int):
        user = get_user_from_db(id)
        return SuccessResponse(data=user)
    
    # Paginated list
    @app.get("/users", response_model=PaginatedResponse[UserSchema])
    async def list_users(page: int = 1, per_page: int = 20):
        users, total = get_users_paginated(page, per_page)
        return PaginatedResponse.create(
            items=users,
            total=total,
            page=page,
            per_page=per_page
        )
"""

from __future__ import annotations

from datetime import datetime
from typing import Any, Dict, Generic, List, Optional, TypeVar

from pydantic import BaseModel, Field, field_validator


# ============================================================================
# TYPE VARIABLES FOR GENERICS
# ============================================================================

T = TypeVar('T')


# ============================================================================
# METADATA MODELS
# ============================================================================

class ResponseMetadata(BaseModel):
    """
    Metadata included in all successful API responses.
    
    Attributes:
        timestamp: ISO 8601 formatted UTC timestamp
        request_id: Unique identifier for request tracking
        version: API version (default: "1.0")
    """
    timestamp: str = Field(
        ...,
        description="ISO 8601 UTC timestamp of when response was generated",
        examples=["2025-11-22T10:30:00.000Z"]
    )
    request_id: str = Field(
        ...,
        description="Unique request identifier for tracking and debugging",
        examples=["550e8400-e29b-41d4-a716-446655440000"]
    )
    version: str = Field(
        default="1.0",
        description="API version",
        examples=["1.0"]
    )
    
    @classmethod
    def create(cls, request_id: str, version: str = "1.0") -> ResponseMetadata:
        """
        Create metadata with current timestamp.
        
        Args:
            request_id: Unique request identifier
            version: API version (default: "1.0")
            
        Returns:
            ResponseMetadata instance with current timestamp
        """
        return cls(
            timestamp=datetime.utcnow().isoformat() + "Z",
            request_id=request_id,
            version=version
        )


# ============================================================================
# SUCCESS RESPONSE MODELS
# ============================================================================

class SuccessResponse(BaseModel, Generic[T]):
    """
    Generic success response wrapper for all API endpoints.
    
    This provides a consistent envelope for successful responses,
    matching the structure of error responses from FASE 4 #2.
    
    Type Parameters:
        T: The type of data being returned
    
    Attributes:
        success: Always True for success responses
        data: The actual response data (any type)
        metadata: Request tracking and version information
    
    Examples:
        Single user:
            {
                "success": true,
                "data": {"id": 1, "name": "John Doe"},
                "metadata": {
                    "timestamp": "2025-11-22T10:30:00.000Z",
                    "request_id": "uuid",
                    "version": "1.0"
                }
            }
        
        Empty response (204 No Content):
            {
                "success": true,
                "data": null,
                "metadata": {...}
            }
    """
    success: bool = Field(
        default=True,
        description="Indicates successful operation",
        examples=[True]
    )
    data: Optional[T] = Field(
        ...,
        description="Response data (type varies by endpoint)"
    )
    metadata: ResponseMetadata = Field(
        ...,
        description="Response metadata with timestamp and request tracking"
    )
    
    @classmethod
    def create(
        cls,
        data: Optional[T],
        request_id: str,
        version: str = "1.0"
    ) -> SuccessResponse[T]:
        """
        Create a success response with metadata.
        
        Args:
            data: The response data
            request_id: Unique request identifier
            version: API version (default: "1.0")
            
        Returns:
            SuccessResponse instance with metadata
        """
        return cls(
            success=True,
            data=data,
            metadata=ResponseMetadata.create(
                request_id=request_id,
                version=version
            )
        )


# ============================================================================
# PAGINATION MODELS
# ============================================================================

class PaginationMeta(BaseModel):
    """
    Pagination metadata for list responses.
    
    Attributes:
        page: Current page number (1-indexed)
        per_page: Number of items per page
        total: Total number of items available
        total_pages: Total number of pages
        has_next: Whether there is a next page
        has_previous: Whether there is a previous page
    """
    page: int = Field(
        ...,
        ge=1,
        description="Current page number (1-indexed)",
        examples=[1]
    )
    per_page: int = Field(
        ...,
        ge=1,
        le=1000,
        description="Number of items per page",
        examples=[20]
    )
    total: int = Field(
        ...,
        ge=0,
        description="Total number of items available",
        examples=[150]
    )
    total_pages: int = Field(
        ...,
        ge=0,
        description="Total number of pages",
        examples=[8]
    )
    has_next: bool = Field(
        ...,
        description="Whether there is a next page",
        examples=[True]
    )
    has_previous: bool = Field(
        ...,
        description="Whether there is a previous page",
        examples=[False]
    )
    
    @classmethod
    def create(cls, page: int, per_page: int, total: int) -> PaginationMeta:
        """
        Create pagination metadata with calculated values.
        
        Args:
            page: Current page number (1-indexed)
            per_page: Items per page
            total: Total number of items
            
        Returns:
            PaginationMeta instance with calculated total_pages, has_next, has_previous
        """
        total_pages = (total + per_page - 1) // per_page if per_page > 0 else 0
        
        return cls(
            page=page,
            per_page=per_page,
            total=total,
            total_pages=total_pages,
            has_next=page < total_pages,
            has_previous=page > 1
        )


class PaginatedData(BaseModel, Generic[T]):
    """
    Container for paginated data with pagination metadata.
    
    Type Parameters:
        T: The type of items in the list
    
    Attributes:
        items: List of items for current page
        pagination: Pagination metadata
    """
    items: List[T] = Field(
        ...,
        description="List of items for current page"
    )
    pagination: PaginationMeta = Field(
        ...,
        description="Pagination metadata"
    )


class PaginatedResponse(BaseModel, Generic[T]):
    """
    Generic paginated response wrapper for list endpoints.
    
    This extends SuccessResponse to include pagination metadata
    for list endpoints.
    
    Type Parameters:
        T: The type of items in the list
    
    Attributes:
        success: Always True for success responses
        data: Object containing items and pagination metadata
        metadata: Request tracking and version information
    
    Examples:
        Paginated users list:
            {
                "success": true,
                "data": {
                    "items": [
                        {"id": 1, "name": "John"},
                        {"id": 2, "name": "Jane"}
                    ],
                    "pagination": {
                        "page": 1,
                        "per_page": 20,
                        "total": 150,
                        "total_pages": 8,
                        "has_next": true,
                        "has_previous": false
                    }
                },
                "metadata": {
                    "timestamp": "2025-11-22T10:30:00.000Z",
                    "request_id": "uuid",
                    "version": "1.0"
                }
            }
    """
    success: bool = Field(
        default=True,
        description="Indicates successful operation",
        examples=[True]
    )
    data: PaginatedData[T] = Field(
        ...,
        description="Paginated data with items and pagination metadata"
    )
    metadata: ResponseMetadata = Field(
        ...,
        description="Response metadata with timestamp and request tracking"
    )
    
    @classmethod
    def create(
        cls,
        items: List[T],
        total: int,
        page: int,
        per_page: int,
        request_id: str,
        version: str = "1.0"
    ) -> PaginatedResponse[T]:
        """
        Create a paginated response with metadata.
        
        Args:
            items: List of items for current page
            total: Total number of items available
            page: Current page number (1-indexed)
            per_page: Items per page
            request_id: Unique request identifier
            version: API version (default: "1.0")
            
        Returns:
            PaginatedResponse instance with pagination and metadata
        """
        return cls(
            success=True,
            data=PaginatedData(
                items=items,
                pagination=PaginationMeta.create(
                    page=page,
                    per_page=per_page,
                    total=total
                )
            ),
            metadata=ResponseMetadata.create(
                request_id=request_id,
                version=version
            )
        )


# ============================================================================
# LEGACY COMPATIBILITY (for gradual migration)
# ============================================================================

class BaseResponse(BaseModel):
    """
    DEPRECATED: Legacy base response.
    Use SuccessResponse[T] instead.
    
    This is kept for backward compatibility during migration.
    """
    success: bool = Field(..., description="Indicates if the operation was successful")
    message: Optional[str] = Field(None, description="Optional human readable message")


class OCRData(BaseModel):
    """OCR-specific response data (kept for backward compatibility)."""
    text: str | None = Field(None, description="Extracted text")
    method: Optional[str] = Field(None, description="OCR method used")
    confidence: Optional[float] = Field(None, description="Confidence score")
    processing_time: Optional[float] = Field(None, description="Processing time in seconds")
    document_type: Optional[str] = None
    cache_key: Optional[str] = None


class OCRResponse(BaseResponse):
    """DEPRECATED: Use SuccessResponse[OCRData] instead."""
    data: OCRData | Dict[str, Any]


class CacheStatsResponse(BaseResponse):
    """DEPRECATED: Use SuccessResponse[Dict] instead."""
    stats: Dict[str, Any]


class ErrorResponse(BaseModel):
    """
    DEPRECATED: Error responses now use ApplicationError.to_dict()
    This is kept for OpenAPI schema compatibility.
    """
    detail: str


# ============================================================================
# EXPORTS
# ============================================================================

__all__ = [
    # New unified response models
    "SuccessResponse",
    "PaginatedResponse",
    "ResponseMetadata",
    "PaginationMeta",
    "PaginatedData",
    
    # Legacy models (deprecated)
    "BaseResponse",
    "OCRData",
    "OCRResponse",
    "CacheStatsResponse",
    "ErrorResponse",
]
