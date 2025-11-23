"""
Servicio de Deducciones de Renta V2.0
======================================

Servicio para gestión de deducciones de renta:
- Crear, actualizar, cancelar deducciones
- Aprobar/rechazar deducciones
- Listado con filtros
- Reportes por estado

Autor: Sistema UNS-ClaudeJP
"""

from sqlalchemy.orm import Session
from sqlalchemy import and_, or_, func, desc
from typing import List, Optional
from datetime import datetime, date

from app.models.models import (
    User,
    RentDeduction,
    ApartmentAssignment,
    Employee,
    Apartment,
    AssignmentStatus,
    DeductionStatus,
)
from app.schemas.apartment_v2 import (
    DeductionCreate,
    DeductionResponse,
    DeductionStatusUpdate,
)


class DeductionService:
    """Servicio para operaciones de deducciones de renta"""

    def __init__(self, db: Session):
        self.db = db

    # -------------------------------------------------------------------------
    # CRUD DEDUCCIONES
    # -------------------------------------------------------------------------

    async def create_rent_deduction(
        self,
        deduction: DeductionCreate,
        user_id: int,
    ) -> DeductionResponse:
        """
        Crear nueva deducción de renta

        Args:
            deduction: Datos de la deducción
            user_id: ID del usuario

        Returns:
            Deducción creada

        Raises:
            HTTPException: Si hay validaciones fallidas
        """
        from fastapi import HTTPException

        # Validar que la asignación existe y está activa
        assignment = self.db.query(ApartmentAssignment).filter(
            and_(
                ApartmentAssignment.id == deduction.assignment_id,
                ApartmentAssignment.deleted_at.is_(None)
            )
        ).first()

        if not assignment:
            raise HTTPException(
                status_code=404,
                detail="Asignación no encontrada"
            )

        if assignment.status != AssignmentStatus.ACTIVE:
            raise HTTPException(
                status_code=400,
                detail="Solo se pueden crear deducciones para asignaciones activas"
            )

        # Crear deducción
        db_deduction = RentDeduction(
            assignment_id=deduction.assignment_id,
            year=deduction.year,
            month=deduction.month,
            amount=deduction.amount,
            status=DeductionStatus.PENDING,
            created_by_id=user_id,
        )

        self.db.add(db_deduction)
        self.db.commit()
        self.db.refresh(db_deduction)

        return DeductionResponse.model_validate(db_deduction)

    async def get_rent_deduction(
        self,
        deduction_id: int,
    ) -> Optional[DeductionResponse]:
        """Obtener deducción por ID"""
        deduction = self.db.query(RentDeduction).filter(
            and_(
                RentDeduction.id == deduction_id,
                RentDeduction.deleted_at.is_(None)
            )
        ).first()

        if not deduction:
            return None

        return DeductionResponse.model_validate(deduction)

    async def list_rent_deductions(
        self,
        assignment_id: Optional[int] = None,
        year: Optional[int] = None,
        month: Optional[int] = None,
        status: Optional[DeductionStatus] = None,
        skip: int = 0,
        limit: int = 100,
    ) -> List[DeductionResponse]:
        """Listar deducciones con filtros"""
        query = self.db.query(RentDeduction).filter(
            RentDeduction.deleted_at.is_(None)
        )

        if assignment_id:
            query = query.filter(RentDeduction.assignment_id == assignment_id)
        if year:
            query = query.filter(RentDeduction.year == year)
        if month:
            query = query.filter(RentDeduction.month == month)
        if status:
            query = query.filter(RentDeduction.status == status)

        deductions = query.order_by(
            desc(RentDeduction.year),
            desc(RentDeduction.month)
        ).offset(skip).limit(limit).all()

        return [DeductionResponse.model_validate(d) for d in deductions]

    async def update_rent_deduction(
        self,
        deduction_id: int,
        deduction: DeductionStatusUpdate,
        user_id: int,
    ) -> Optional[DeductionResponse]:
        """Actualizar deducción"""
        from fastapi import HTTPException

        db_deduction = self.db.query(RentDeduction).filter(
            and_(
                RentDeduction.id == deduction_id,
                RentDeduction.deleted_at.is_(None)
            )
        ).first()

        if not db_deduction:
            return None

        # Solo se pueden actualizar deducciones pendientes
        if db_deduction.status != DeductionStatus.PENDING:
            raise HTTPException(
                status_code=400,
                detail="Solo se pueden actualizar deducciones pendientes"
            )

        # Actualizar campos
        if deduction.amount is not None:
            db_deduction.amount = deduction.amount
        if deduction.notes is not None:
            db_deduction.notes = deduction.notes

        db_deduction.updated_at = datetime.utcnow()

        self.db.commit()
        self.db.refresh(db_deduction)

        return DeductionResponse.model_validate(db_deduction)

    async def approve_rent_deduction(
        self,
        deduction_id: int,
        user_id: int,
    ) -> Optional[DeductionResponse]:
        """Aprobar deducción"""
        from fastapi import HTTPException

        db_deduction = self.db.query(RentDeduction).filter(
            and_(
                RentDeduction.id == deduction_id,
                RentDeduction.deleted_at.is_(None)
            )
        ).first()

        if not db_deduction:
            return None

        if db_deduction.status != DeductionStatus.PENDING:
            raise HTTPException(
                status_code=400,
                detail="Solo se pueden aprobar deducciones pendientes"
            )

        db_deduction.status = DeductionStatus.APPROVED
        db_deduction.approved_by_id = user_id
        db_deduction.approved_at = datetime.utcnow()
        db_deduction.updated_at = datetime.utcnow()

        self.db.commit()
        self.db.refresh(db_deduction)

        return DeductionResponse.model_validate(db_deduction)

    async def cancel_rent_deduction(
        self,
        deduction_id: int,
        user_id: int,
    ) -> Optional[DeductionResponse]:
        """Cancelar deducción"""
        from fastapi import HTTPException

        db_deduction = self.db.query(RentDeduction).filter(
            and_(
                RentDeduction.id == deduction_id,
                RentDeduction.deleted_at.is_(None)
            )
        ).first()

        if not db_deduction:
            return None

        if db_deduction.status == DeductionStatus.CANCELLED:
            raise HTTPException(
                status_code=400,
                detail="La deducción ya está cancelada"
            )

        db_deduction.status = DeductionStatus.CANCELLED
        db_deduction.updated_at = datetime.utcnow()

        self.db.commit()
        self.db.refresh(db_deduction)

        return DeductionResponse.model_validate(db_deduction)
