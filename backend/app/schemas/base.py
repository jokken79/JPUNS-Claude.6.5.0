"""
Base Schemas for UNS-ClaudeJP 1.0
"""
from pydantic import BaseModel, EmailStr, Field, ConfigDict
from typing import Optional, TypeVar, Generic, List
from datetime import datetime, date


T = TypeVar('T')


class ResponseBase(BaseModel):
    """Base response schema"""
    success: bool = True
    message: str = "Success"


class ErrorResponse(BaseModel):
    """Error response schema"""
    success: bool = False
    message: str
    error: Optional[str] = None


class PaginationParams(BaseModel):
    """Pagination parameters"""
    page: int = Field(1, ge=1, description="Page number")
    page_size: int = Field(50, ge=1, le=100, description="Items per page")


class PaginatedResponse(BaseModel, Generic[T]):
    """
    Generic paginated response schema.

    Can be used with any model type for consistent pagination across the API.

    Example:
        response_model=PaginatedResponse[TimerCardResponse]
    """
    items: List[T] = Field(..., description="List of items for the current page")
    total: int = Field(..., description="Total number of items across all pages", ge=0)
    page: int = Field(..., description="Current page number", ge=1)
    page_size: int = Field(..., description="Number of items per page", ge=1, le=100)
    total_pages: int = Field(..., description="Total number of pages", ge=0)
    has_next: bool = Field(..., description="Whether there is a next page")
    has_previous: bool = Field(..., description="Whether there is a previous page")

    class Config:
        """Pydantic configuration"""
        json_schema_extra = {
            "example": {
                "items": [],
                "total": 100,
                "page": 1,
                "page_size": 50,
                "total_pages": 2,
                "has_next": True,
                "has_previous": False
            }
        }


def create_paginated_response(
    items: List[T],
    total: int,
    page: int,
    page_size: int
) -> PaginatedResponse[T]:
    """
    Helper function to create a paginated response.

    Args:
        items: List of items for the current page
        total: Total number of items across all pages
        page: Current page number (1-indexed)
        page_size: Number of items per page

    Returns:
        PaginatedResponse with calculated pagination metadata
    """
    total_pages = (total + page_size - 1) // page_size if total > 0 else 0

    return PaginatedResponse(
        items=items,
        total=total,
        page=page,
        page_size=page_size,
        total_pages=total_pages,
        has_next=page < total_pages,
        has_previous=page > 1
    )
