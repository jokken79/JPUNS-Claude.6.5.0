"""
Contracts API Endpoints
"""
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from typing import Optional

from app.core.database import get_db
from fastapi import Request
from app.core.cache import cache, CacheKey, CacheTTL
from app.core.response import success_response, created_response, paginated_response, no_content_response
from app.models.models import Contract, Employee, User
from app.schemas.contract import ContractCreate, ContractUpdate, ContractResponse
from app.schemas.base import PaginatedResponse, create_paginated_response
from app.services.auth_service import auth_service
from app.core.rate_limiter import limiter

router = APIRouter()


@router.post("/", response_model=ContractResponse, status_code=status.HTTP_201_CREATED)
@limiter.limit("60/minute")
async def create_contract(
    contract: ContractCreate,
    current_user: User = Depends(auth_service.require_role("admin")),
    db: Session = Depends(get_db)
):
    """Create new contract"""
    # Verify employee exists and is not deleted
    employee = db.query(Employee).filter(
        Employee.id == contract.employee_id,
        Employee.deleted_at.is_(None)
    ).first()
    if not employee:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Employee not found"
        )

    # Check if contract number already exists (if provided)
    if contract.contract_number:
        existing = db.query(Contract).filter(
            Contract.contract_number == contract.contract_number,
            Contract.deleted_at.is_(None)
        ).first()
        if existing:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Contract number already exists"
            )

    new_contract = Contract(**contract.model_dump())
    db.add(new_contract)
    db.commit()
    db.refresh(new_contract)
    return new_contract


@router.get("/", response_model=PaginatedResponse[ContractResponse])
@cache.cached(ttl=CacheTTL.MEDIUM)
@limiter.limit("60/minute")
async def list_contracts(
    employee_id: Optional[int] = Query(None, description="Filter by employee ID"),
    signed: Optional[bool] = Query(None, description="Filter by signed status"),
    page: int = Query(1, ge=1, description="Page number"),
    page_size: int = Query(50, ge=1, le=100, description="Items per page"),
    current_user: User = Depends(auth_service.get_current_active_user),
    db: Session = Depends(get_db)
):
    """List all contracts with pagination"""
    query = db.query(Contract)

    # Exclude soft-deleted contracts by default
    query = query.filter(Contract.deleted_at.is_(None))

    # Apply filters
    if employee_id is not None:
        query = query.filter(Contract.employee_id == employee_id)
    if signed is not None:
        query = query.filter(Contract.signed == signed)

    # Get total count
    total = query.count()

    # Pagination
    skip = (page - 1) * page_size
    items = (
        query
        .order_by(Contract.created_at.desc())
        .offset(skip)
        .limit(page_size)
        .all()
    )

    return create_paginated_response(
        items=items,
        total=total,
        page=page,
        page_size=page_size
    )


@router.get("/{contract_id}", response_model=ContractResponse)
@cache.cached(ttl=CacheTTL.MEDIUM)
@limiter.limit("60/minute")
async def get_contract(
    contract_id: int,
    current_user: User = Depends(auth_service.get_current_active_user),
    db: Session = Depends(get_db)
):
    """Get contract by ID"""
    contract = db.query(Contract).filter(
        Contract.id == contract_id,
        Contract.deleted_at.is_(None)  # Exclude soft-deleted
    ).first()

    if not contract:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Contract not found"
        )

    return contract


@router.put("/{contract_id}", response_model=ContractResponse)
@limiter.limit("60/minute")
async def update_contract(
    contract_id: int,
    contract_update: ContractUpdate,
    current_user: User = Depends(auth_service.require_role("admin")),
    db: Session = Depends(get_db)
):
    """Update contract"""
    contract = db.query(Contract).filter(
        Contract.id == contract_id,
        Contract.deleted_at.is_(None)
    ).first()

    if not contract:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Contract not found"
        )

    # Check if updating contract_number and it conflicts
    if contract_update.contract_number and contract_update.contract_number != contract.contract_number:
        existing = db.query(Contract).filter(
            Contract.contract_number == contract_update.contract_number,
            Contract.id != contract_id,
            Contract.deleted_at.is_(None)
        ).first()
        if existing:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Contract number already exists"
            )

    # Verify employee exists if updating employee_id
    if contract_update.employee_id and contract_update.employee_id != contract.employee_id:
        employee = db.query(Employee).filter(
            Employee.id == contract_update.employee_id,
            Employee.deleted_at.is_(None)
        ).first()
        if not employee:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Employee not found"
            )

    # Update fields
    update_data = contract_update.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(contract, field, value)

    db.commit()
    db.refresh(contract)
    return contract


@router.delete("/{contract_id}")
@limiter.limit("60/minute")
async def delete_contract(
    contract_id: int,
    current_user: User = Depends(auth_service.require_role("admin")),
    db: Session = Depends(get_db)
):
    """Soft delete contract"""
    contract = db.query(Contract).filter(Contract.id == contract_id).first()
    if not contract:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Contract not found"
        )

    # Check if already deleted
    if contract.is_deleted:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Contract is already deleted"
        )

    contract.soft_delete()
    db.commit()

    return no_content_response(data={"message": "Contract deleted successfully"}, request=request)


@router.post("/{contract_id}/restore")
@limiter.limit("60/minute")
async def restore_contract(
    contract_id: int,
    current_user: User = Depends(auth_service.require_role("admin")),
    db: Session = Depends(get_db)
):
    """Restore soft-deleted contract"""
    contract = db.query(Contract).filter(Contract.id == contract_id).first()
    if not contract:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Contract not found"
        )

    # Check if not deleted
    if not contract.is_deleted:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Contract is not deleted"
        )

    contract.restore()
    db.commit()

    return created_response(data={"message": "Contract restored successfully"}, request=request)
