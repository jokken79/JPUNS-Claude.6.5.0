"""
Factories API Endpoints
"""
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import func

from app.core.database import get_db
from app.core.redis_client import redis_client, invalidate_cache
from app.models.models import Factory, User, Employee
from app.schemas.factory import (
    FactoryCreate,
    FactoryUpdate,
    FactoryResponse,
    FactoryConfig,
    FactoryStats,
    FactoryWithEmployees
)
from app.services.auth_service import auth_service

router = APIRouter()


@router.post("/", response_model=FactoryResponse, status_code=status.HTTP_201_CREATED)
async def create_factory(
    factory: FactoryCreate,
    current_user: User = Depends(auth_service.require_role("super_admin")),
    db: Session = Depends(get_db)
):
    """Create new factory"""
    existing = db.query(Factory).filter(Factory.factory_id == factory.factory_id).first()
    if existing:
        raise HTTPException(status_code=400, detail="Factory ID already exists")

    new_factory = Factory(**factory.model_dump())
    db.add(new_factory)
    db.commit()
    db.refresh(new_factory)

    # Invalidar cache de factories
    invalidate_cache("factories:*")

    return new_factory


@router.get("/", response_model=list[FactoryResponse])
async def list_factories(
    is_active: bool = True,
    current_user: User = Depends(auth_service.get_current_active_user),
    db: Session = Depends(get_db)
):
    """List all factories (with 5min Redis cache)"""
    # Generar clave de cache
    cache_key = f"factories:list:active={is_active}"

    # Intentar obtener del cache
    cached = redis_client.get(cache_key)
    if cached:
        return cached

    # Si no está en cache, consultar DB
    query = db.query(Factory)
    if is_active is not None:
        query = query.filter(Factory.is_active == is_active)

    factories = query.all()

    # Calculate employees_count for each factory
    # FIX: Must compare Employee.factory_id (String) with Factory.factory_id (String)
    factories_with_count = []
    for factory in factories:
        employees_count = db.query(func.count(Employee.id)).filter(
            Employee.factory_id == factory.factory_id,
            Employee.is_active == True
        ).scalar() or 0

        factory_dict = FactoryResponse.model_validate(factory).model_dump()
        factory_dict['employees_count'] = employees_count
        factories_with_count.append(factory_dict)

    # Guardar en cache (5 minutos)
    redis_client.set(cache_key, factories_with_count, ttl=300)

    return factories_with_count


@router.get("/stats", response_model=FactoryStats)
async def get_factories_stats(
    current_user: User = Depends(auth_service.get_current_active_user),
    db: Session = Depends(get_db)
):
    """Get statistics across all factories (with 5min Redis cache)"""
    cache_key = "factories:stats"

    # Intentar obtener del cache
    cached = redis_client.get(cache_key)
    if cached:
        return FactoryStats(**cached)

    # Si no está en cache, calcular estadísticas
    # Total factories
    total_factories = db.query(func.count(Factory.id)).filter(Factory.is_active == True).scalar()

    # Total employees assigned to factories
    total_employees = db.query(func.count(Employee.id)).filter(
        Employee.factory_id.isnot(None),
        Employee.is_active == True
    ).scalar()

    # Factories with employees
    factories_with_employees = db.query(func.count(func.distinct(Employee.factory_id))).filter(
        Employee.factory_id.isnot(None),
        Employee.is_active == True
    ).scalar()

    # Empty factories
    empty_factories = total_factories - (factories_with_employees or 0)

    # Average employees per factory
    avg_employees_per_factory = (total_employees / total_factories) if total_factories > 0 else 0

    stats = FactoryStats(
        total_factories=total_factories or 0,
        total_employees=total_employees or 0,
        factories_with_employees=factories_with_employees or 0,
        empty_factories=empty_factories,
        avg_employees_per_factory=round(avg_employees_per_factory, 2)
    )

    # Guardar en cache
    redis_client.set(cache_key, stats.model_dump(), ttl=300)

    return stats


@router.get("/{factory_id}", response_model=FactoryResponse)
async def get_factory(
    factory_id: str,
    current_user: User = Depends(auth_service.get_current_active_user),
    db: Session = Depends(get_db)
):
    """Get factory by ID"""
    factory = db.query(Factory).filter(Factory.factory_id == factory_id).first()
    if not factory:
        raise HTTPException(status_code=404, detail="Factory not found")
    return factory


@router.put("/{factory_id}", response_model=FactoryResponse)
async def update_factory(
    factory_id: str,
    factory_update: FactoryUpdate,
    current_user: User = Depends(auth_service.require_role("admin")),
    db: Session = Depends(get_db)
):
    """Update factory"""
    factory = db.query(Factory).filter(Factory.factory_id == factory_id).first()
    if not factory:
        raise HTTPException(status_code=404, detail="Factory not found")

    for field, value in factory_update.model_dump(exclude_unset=True).items():
        setattr(factory, field, value)

    db.commit()
    db.refresh(factory)

    # Invalidar cache de factories
    invalidate_cache("factories:*")

    return factory


@router.delete("/{factory_id}")
async def delete_factory(
    factory_id: str,
    current_user: User = Depends(auth_service.require_role("super_admin")),
    db: Session = Depends(get_db)
):
    """Delete factory"""
    factory = db.query(Factory).filter(Factory.factory_id == factory_id).first()
    if not factory:
        raise HTTPException(status_code=404, detail="Factory not found")

    db.delete(factory)
    db.commit()

    # Invalidar cache de factories
    invalidate_cache("factories:*")

    return {"message": "Factory deleted successfully"}


# ============ Configuration Management Endpoints ============

@router.get("/{factory_id}/config", response_model=FactoryConfig)
async def get_factory_config(
    factory_id: str,
    current_user: User = Depends(auth_service.get_current_active_user),
    db: Session = Depends(get_db)
):
    """Get factory configuration"""
    factory = db.query(Factory).filter(Factory.factory_id == factory_id).first()
    if not factory:
        raise HTTPException(status_code=404, detail="Factory not found")

    # Return config or empty config with defaults
    if factory.config:
        return FactoryConfig(**factory.config)
    else:
        return FactoryConfig()


@router.put("/{factory_id}/config", response_model=FactoryResponse)
async def update_factory_config(
    factory_id: str,
    config: FactoryConfig,
    current_user: User = Depends(auth_service.require_role("admin")),
    db: Session = Depends(get_db)
):
    """Update factory configuration"""
    factory = db.query(Factory).filter(Factory.factory_id == factory_id).first()
    if not factory:
        raise HTTPException(status_code=404, detail="Factory not found")

    # Convert Pydantic model to dict for JSON storage
    factory.config = config.model_dump()

    db.commit()
    db.refresh(factory)
    return factory


@router.post("/{factory_id}/config/validate", response_model=dict)
async def validate_factory_config(
    factory_id: str,
    config: FactoryConfig,
    current_user: User = Depends(auth_service.get_current_active_user),
    db: Session = Depends(get_db)
):
    """Validate factory configuration without saving"""
    factory = db.query(Factory).filter(Factory.factory_id == factory_id).first()
    if not factory:
        raise HTTPException(status_code=404, detail="Factory not found")

    # If we reach here, Pydantic validation passed
    return {
        "valid": True,
        "message": "Configuration is valid",
        "config": config.model_dump()
    }

@router.get("/{factory_id}/employees", response_model=FactoryWithEmployees)
async def get_factory_with_employees(
    factory_id: str,
    current_user: User = Depends(auth_service.get_current_active_user),
    db: Session = Depends(get_db)
):
    """Get factory details with employee list"""
    factory = db.query(Factory).filter(Factory.factory_id == factory_id).first()
    if not factory:
        raise HTTPException(status_code=404, detail="Factory not found")

    # Get employees for this factory
    # FIX: Employee.factory_id is a String (e.g., "Company__Plant"), not Integer
    # Must compare with factory.factory_id, NOT factory.id
    employees = db.query(Employee).filter(Employee.factory_id == factory.factory_id).all()

    # Convert factory to response model
    factory_dict = {
        "id": factory.id,
        "factory_id": factory.factory_id,
        "name": factory.name,
        "company_name": factory.company_name,
        "plant_name": factory.plant_name,
        "address": factory.address,
        "phone": factory.phone,
        "contact_person": factory.contact_person,
        "config": FactoryConfig(**factory.config) if factory.config else None,
        "is_active": factory.is_active,
        "created_at": factory.created_at,
        "updated_at": factory.updated_at,
        "employees_count": len(employees),
        "employees": [
            {
                "id": emp.id,
                "hakenmoto_id": emp.hakenmoto_id,
                "full_name_kanji": emp.full_name_kanji,
                "full_name_kana": emp.full_name_kana,
                "status": emp.status,
                "hire_date": emp.hire_date.isoformat() if emp.hire_date else None
            }
            for emp in employees
        ]
    }

    return FactoryWithEmployees(**factory_dict)
