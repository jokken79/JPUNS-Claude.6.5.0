"""
Response Wrapper Functions - FASE 4 #4

This module provides convenient wrapper functions for creating standardized
API responses using the unified response models.

Features:
- Auto-extract request_id from request context
- Auto-generate timestamps
- Type-safe response creation
- Pagination support
- Consistent metadata across all responses

Usage:
    from fastapi import Request
    from app.core.response import success_response, paginated_response
    from app.schemas.employee import EmployeeSchema
    
    @app.get("/users/{user_id}")
    async def get_user(user_id: int, request: Request):
        user = get_user_from_db(user_id)
        return success_response(
            data=user,
            request=request,
            status_code=200
        )
    
    @app.get("/users")
    async def list_users(request: Request, page: int = 1, per_page: int = 20):
        users, total = get_users_paginated(page, per_page)
        return paginated_response(
            items=users,
            total=total,
            page=page,
            per_page=per_page,
            request=request
        )
"""

from __future__ import annotations

import logging
from typing import Any, Dict, List, Optional, TypeVar

from fastapi import Request, status
from fastapi.responses import JSONResponse

from app.schemas.responses import (
    ResponseMetadata,
    SuccessResponse,
    PaginatedResponse,
    PaginationMeta,
    PaginatedData,
)

logger = logging.getLogger(__name__)

T = TypeVar('T')


# ============================================================================
# REQUEST ID EXTRACTION
# ============================================================================

def get_request_id(request: Optional[Request] = None, request_id: Optional[str] = None) -> str:
    """
    Extract request_id from request context or use provided value.
    
    Request IDs are set by ErrorHandlerMiddleware (FASE 4 #2) and
    stored in request.state.request_id.
    
    Args:
        request: FastAPI Request object (optional)
        request_id: Explicit request_id (optional, overrides request)
        
    Returns:
        Request ID string (from request.state, explicit value, or "unknown")
    
    Examples:
        # From request context (preferred)
        request_id = get_request_id(request=request)
        
        # Explicit request_id (for background tasks)
        request_id = get_request_id(request_id="custom-id-123")
        
        # Fallback (not recommended)
        request_id = get_request_id()  # Returns "unknown"
    """
    # Explicit request_id takes precedence
    if request_id:
        return request_id
    
    # Try to get from request.state (set by ErrorHandlerMiddleware)
    if request and hasattr(request, "state") and hasattr(request.state, "request_id"):
        return request.state.request_id
    
    # Fallback (should rarely happen if middleware is properly configured)
    logger.warning(
        "No request_id available in request.state. "
        "Ensure ErrorHandlerMiddleware is properly configured."
    )
    return "unknown"


# ============================================================================
# SUCCESS RESPONSE HELPERS
# ============================================================================

def success_response(
    data: Any,
    request: Optional[Request] = None,
    request_id: Optional[str] = None,
    status_code: int = status.HTTP_200_OK,
    version: str = "1.0",
    headers: Optional[Dict[str, str]] = None
) -> JSONResponse:
    """
    Create a standardized success response.
    
    This wraps the data in a SuccessResponse envelope with metadata
    and returns a JSONResponse with appropriate status code and headers.
    
    Args:
        data: Response data (any JSON-serializable object)
        request: FastAPI Request object (for request_id extraction)
        request_id: Explicit request_id (optional, overrides request)
        status_code: HTTP status code (default: 200)
        version: API version (default: "1.0")
        headers: Additional HTTP headers (optional)
        
    Returns:
        JSONResponse with standardized format
    
    Examples:
        # Simple success response
        return success_response(
            data={"id": 1, "name": "John"},
            request=request
        )
        
        # Created response (201)
        return success_response(
            data=new_user,
            request=request,
            status_code=201
        )
        
        # No content (null data)
        return success_response(
            data=None,
            request=request,
            status_code=200
        )
    """
    req_id = get_request_id(request=request, request_id=request_id)
    
    # Create metadata
    metadata = ResponseMetadata.create(
        request_id=req_id,
        version=version
    )
    
    # Create response envelope
    response_data = {
        "success": True,
        "data": data,
        "metadata": metadata.model_dump()
    }
    
    # Prepare headers
    response_headers = {"X-Request-ID": req_id}
    if headers:
        response_headers.update(headers)
    
    return JSONResponse(
        status_code=status_code,
        content=response_data,
        headers=response_headers
    )


def created_response(
    data: Any,
    request: Optional[Request] = None,
    request_id: Optional[str] = None,
    location: Optional[str] = None,
    version: str = "1.0"
) -> JSONResponse:
    """
    Create a standardized 201 Created response.
    
    Convenience wrapper for success_response with 201 status code
    and optional Location header.
    
    Args:
        data: Created resource data
        request: FastAPI Request object
        request_id: Explicit request_id (optional)
        location: URL of created resource (sets Location header)
        version: API version (default: "1.0")
        
    Returns:
        JSONResponse with 201 status code
    
    Example:
        return created_response(
            data=new_user,
            request=request,
            location=f"/api/users/{new_user.id}"
        )
    """
    headers = {}
    if location:
        headers["Location"] = location
    
    return success_response(
        data=data,
        request=request,
        request_id=request_id,
        status_code=status.HTTP_201_CREATED,
        version=version,
        headers=headers
    )


def no_content_response(
    request: Optional[Request] = None,
    request_id: Optional[str] = None
) -> JSONResponse:
    """
    Create a standardized 204 No Content response.
    
    Returns success response with null data and 204 status code.
    Useful for DELETE operations or updates without response body.
    
    Args:
        request: FastAPI Request object
        request_id: Explicit request_id (optional)
        
    Returns:
        JSONResponse with 204 status code and null data
    
    Example:
        @app.delete("/users/{user_id}")
        async def delete_user(user_id: int, request: Request):
            delete_user_from_db(user_id)
            return no_content_response(request=request)
    """
    return success_response(
        data=None,
        request=request,
        request_id=request_id,
        status_code=status.HTTP_204_NO_CONTENT
    )


# ============================================================================
# PAGINATED RESPONSE HELPERS
# ============================================================================

def paginated_response(
    items: List[Any],
    total: int,
    page: int,
    per_page: int,
    request: Optional[Request] = None,
    request_id: Optional[str] = None,
    status_code: int = status.HTTP_200_OK,
    version: str = "1.0",
    headers: Optional[Dict[str, str]] = None
) -> JSONResponse:
    """
    Create a standardized paginated response.
    
    This wraps a list of items in a PaginatedResponse envelope with
    pagination metadata (page, per_page, total, total_pages, has_next, has_previous).
    
    Args:
        items: List of items for current page
        total: Total number of items available (across all pages)
        page: Current page number (1-indexed)
        per_page: Number of items per page
        request: FastAPI Request object (for request_id extraction)
        request_id: Explicit request_id (optional, overrides request)
        status_code: HTTP status code (default: 200)
        version: API version (default: "1.0")
        headers: Additional HTTP headers (optional)
        
    Returns:
        JSONResponse with paginated format
    
    Examples:
        # Basic pagination
        users, total = get_users_paginated(page=1, per_page=20)
        return paginated_response(
            items=users,
            total=total,
            page=1,
            per_page=20,
            request=request
        )
        
        # With query parameters
        @app.get("/users")
        async def list_users(
            request: Request,
            page: int = Query(1, ge=1),
            per_page: int = Query(20, ge=1, le=100)
        ):
            users, total = get_users_paginated(page, per_page)
            return paginated_response(
                items=users,
                total=total,
                page=page,
                per_page=per_page,
                request=request
            )
    """
    req_id = get_request_id(request=request, request_id=request_id)
    
    # Create pagination metadata
    pagination_meta = PaginationMeta.create(
        page=page,
        per_page=per_page,
        total=total
    )
    
    # Create response metadata
    response_metadata = ResponseMetadata.create(
        request_id=req_id,
        version=version
    )
    
    # Create response envelope
    response_data = {
        "success": True,
        "data": {
            "items": items,
            "pagination": pagination_meta.model_dump()
        },
        "metadata": response_metadata.model_dump()
    }
    
    # Prepare headers
    response_headers = {
        "X-Request-ID": req_id,
        "X-Total-Count": str(total),
        "X-Page": str(page),
        "X-Per-Page": str(per_page),
        "X-Total-Pages": str(pagination_meta.total_pages)
    }
    if headers:
        response_headers.update(headers)
    
    return JSONResponse(
        status_code=status_code,
        content=response_data,
        headers=response_headers
    )


# ============================================================================
# UTILITY FUNCTIONS
# ============================================================================

def empty_paginated_response(
    page: int,
    per_page: int,
    request: Optional[Request] = None,
    request_id: Optional[str] = None,
    version: str = "1.0"
) -> JSONResponse:
    """
    Create a paginated response with no items.
    
    Useful when a query returns no results.
    
    Args:
        page: Current page number
        per_page: Items per page
        request: FastAPI Request object
        request_id: Explicit request_id (optional)
        version: API version (default: "1.0")
        
    Returns:
        JSONResponse with empty items list
    
    Example:
        if not users:
            return empty_paginated_response(
                page=page,
                per_page=per_page,
                request=request
            )
    """
    return paginated_response(
        items=[],
        total=0,
        page=page,
        per_page=per_page,
        request=request,
        request_id=request_id,
        version=version
    )


# ============================================================================
# EXPORTS
# ============================================================================

__all__ = [
    # Request ID helpers
    "get_request_id",
    
    # Success response helpers
    "success_response",
    "created_response",
    "no_content_response",
    
    # Paginated response helpers
    "paginated_response",
    "empty_paginated_response",
]
