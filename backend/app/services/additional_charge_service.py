"""
Servicio de Cargos Adicionales V2.0
===================================

Servicio para gestión de cargos adicionales (limpieza, reparaciones, etc.):
- Crear, actualizar, cancelar cargos
- Aprobar/rechazar cargos
- Listado con filtros
- Reportes por tipo y estado

Autor: Sistema UNS-ClaudeJP
"""

from sqlalchemy.orm import Session
from sqlalchemy import and_, or_, func, desc
from typing import List, Optional
from datetime import datetime, date

from app.models.models import (
    User,
    AdditionalCharge,
    ApartmentAssignment,
    Employee,
    Apartment,
    AssignmentStatus,
    DeductionStatus,
)
from app.schemas.apartment_v2 import (
    AdditionalChargeCreate,
    AdditionalChargeResponse,
    AdditionalChargeUpdate,
    ChargeStatus,
)


class AdditionalChargeService:
    """Servicio para operaciones de cargos adicionales"""

    def __init__(self, db: Session):
        self.db = db

    # -------------------------------------------------------------------------
    # CRUD CARGOS ADICIONALES
    # -------------------------------------------------------------------------

    async def create_additional_charge(
        self,
        charge: AdditionalChargeCreate,
        user_id: int,
    ) -> AdditionalChargeResponse:
        """
        Crear nuevo cargo adicional

        Args:
            charge: Datos del cargo
            user_id: ID del usuario

        Returns:
            Cargo creado

        Raises:
            HTTPException: Si hay validaciones fallidas
        """
        from fastapi import HTTPException

        # Validar que la asignación existe y está activa
        assignment = self.db.query(ApartmentAssignment).filter(
            and_(
                ApartmentAssignment.id == charge.assignment_id,
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
                detail="La asignación no está activa"
            )

        # Verificar que empleado existe
        employee = self.db.query(Employee).filter(
            Employee.id == charge.employee_id
        ).first()

        if not employee:
            raise HTTPException(
                status_code=404,
                detail="Empleado no encontrado"
            )

        # Verificar que apartamento existe
        apartment = self.db.query(Apartment).filter(
            Apartment.id == charge.apartment_id
        ).first()

        if not apartment:
            raise HTTPException(
                status_code=404,
                detail="Apartamento no encontrado"
            )

        # Crear registro en additional_charges
        db_charge = AdditionalCharge(
            assignment_id=charge.assignment_id,
            employee_id=charge.employee_id,
            apartment_id=charge.apartment_id,
            charge_type=charge.charge_type,
            amount=charge.amount,
            charge_date=charge.charge_date,
            description=charge.description,
            status=DeductionStatus.PENDING,
            created_at=datetime.now(),
        )

        self.db.add(db_charge)
        self.db.commit()
        self.db.refresh(db_charge)

        return AdditionalChargeResponse(
            id=db_charge.id,
            assignment_id=db_charge.assignment_id,
            employee_id=db_charge.employee_id,
            apartment_id=db_charge.apartment_id,
            charge_type=db_charge.charge_type,
            amount=db_charge.amount,
            charge_date=db_charge.charge_date,
            description=db_charge.description,
            status=db_charge.status,
            approved_by=db_charge.approved_by,
            approved_at=db_charge.approved_at,
            notes=db_charge.notes,
            created_at=db_charge.created_at,
            updated_at=db_charge.updated_at,
        )

    async def get_additional_charge(
        self,
        charge_id: int,
    ) -> AdditionalChargeResponse:
        """
        Obtener cargo por ID

        Args:
            charge_id: ID del cargo

        Returns:
            Cargo con detalles

        Raises:
            HTTPException: Si no se encuentra
        """
        from fastapi import HTTPException

        # Consultar additional_charges
        charge = self.db.query(AdditionalCharge).filter(
            and_(
                AdditionalCharge.id == charge_id,
                AdditionalCharge.deleted_at.is_(None)
            )
        ).first()

        if not charge:
            raise HTTPException(
                status_code=404,
                detail="Cargo adicional no encontrado"
            )

        return AdditionalChargeResponse(
            id=charge.id,
            assignment_id=charge.assignment_id,
            employee_id=charge.employee_id,
            apartment_id=charge.apartment_id,
            charge_type=charge.charge_type,
            amount=charge.amount,
            charge_date=charge.charge_date,
            description=charge.description,
            status=charge.status,
            approved_by=charge.approved_by,
            approved_at=charge.approved_at,
            notes=charge.notes,
            created_at=charge.created_at,
            updated_at=charge.updated_at,
        )

    async def list_additional_charges(
        self,
        assignment_id: Optional[int] = None,
        employee_id: Optional[int] = None,
        apartment_id: Optional[int] = None,
        charge_type: Optional[str] = None,
        status: Optional[str] = None,
        date_from: Optional[date] = None,
        date_to: Optional[date] = None,
        skip: int = 0,
        limit: int = 100,
    ) -> List[AdditionalChargeResponse]:
        """
        Listar cargos adicionales con filtros

        Args:
            assignment_id: Filtrar por asignación
            employee_id: Filtrar por empleado
            apartment_id: Filtrar por apartamento
            charge_type: Filtrar por tipo
            status: Filtrar por estado
            date_from: Fecha desde
            date_to: Fecha hasta
            skip: Registros a omitir
            limit: Límite de registros

        Returns:
            Lista de cargos
        """
        # Construir query base
        query = self.db.query(AdditionalCharge).filter(
            AdditionalCharge.deleted_at.is_(None)
        )

        # Aplicar filtros
        if assignment_id:
            query = query.filter(AdditionalCharge.assignment_id == assignment_id)
        if employee_id:
            query = query.filter(AdditionalCharge.employee_id == employee_id)
        if apartment_id:
            query = query.filter(AdditionalCharge.apartment_id == apartment_id)
        if charge_type:
            query = query.filter(AdditionalCharge.charge_type == charge_type)
        if status:
            query = query.filter(AdditionalCharge.status == status)
        if date_from:
            query = query.filter(AdditionalCharge.charge_date >= date_from)
        if date_to:
            query = query.filter(AdditionalCharge.charge_date <= date_to)

        # Ordenar por fecha de cargo descendente
        query = query.order_by(desc(AdditionalCharge.charge_date))

        # Paginación
        charges = query.offset(skip).limit(limit).all()

        # Construir respuesta
        results = []
        for charge in charges:
            results.append(AdditionalChargeResponse(
                id=charge.id,
                assignment_id=charge.assignment_id,
                employee_id=charge.employee_id,
                apartment_id=charge.apartment_id,
                charge_type=charge.charge_type,
                amount=charge.amount,
                charge_date=charge.charge_date,
                description=charge.description,
                status=charge.status,
                approved_by=charge.approved_by,
                approved_at=charge.approved_at,
                notes=charge.notes,
                created_at=charge.created_at,
                updated_at=charge.updated_at,
            ))

        return results

    async def approve_additional_charge(
        self,
        charge_id: int,
        update: AdditionalChargeUpdate,
        current_user: User,
    ) -> AdditionalChargeResponse:
        """
        Aprobar un cargo adicional

        Args:
            charge_id: ID del cargo
            update: Datos de actualización
            current_user: Usuario actual

        Returns:
            Cargo aprobado

        Raises:
            HTTPException: Si no tiene permisos o validaciones fallidas
        """
        from fastapi import HTTPException

        # Verificar permisos (ADMIN+)
        if not self._has_permission(current_user, "approve_charge"):
            raise HTTPException(
                status_code=403,
                detail="No tiene permisos para aprobar cargos"
            )

        # Obtener cargo
        charge = self.db.query(AdditionalCharge).filter(
            and_(
                AdditionalCharge.id == charge_id,
                AdditionalCharge.deleted_at.is_(None)
            )
        ).first()

        if not charge:
            raise HTTPException(
                status_code=404,
                detail="Cargo adicional no encontrado"
            )

        # Validar estado (pending -> approved)
        if charge.status != DeductionStatus.PENDING:
            raise HTTPException(
                status_code=400,
                detail=f"El cargo no está en estado pending (estado actual: {charge.status})"
            )

        # Actualizar cargo
        charge.status = DeductionStatus.APPROVED if hasattr(DeductionStatus, 'APPROVED') else 'approved'
        charge.approved_by = current_user.id
        charge.approved_at = datetime.now()
        charge.updated_at = datetime.now()

        # Actualizar notas si se proporcionan
        if update and hasattr(update, 'notes') and update.notes:
            charge.notes = update.notes

        self.db.commit()
        self.db.refresh(charge)

        return AdditionalChargeResponse(
            id=charge.id,
            assignment_id=charge.assignment_id,
            employee_id=charge.employee_id,
            apartment_id=charge.apartment_id,
            charge_type=charge.charge_type,
            amount=charge.amount,
            charge_date=charge.charge_date,
            description=charge.description,
            status=charge.status,
            approved_by=charge.approved_by,
            approved_at=charge.approved_at,
            notes=charge.notes,
            created_at=charge.created_at,
            updated_at=charge.updated_at,
        )

    async def cancel_additional_charge(
        self,
        charge_id: int,
        update: AdditionalChargeUpdate,
        user_id: int,
    ) -> AdditionalChargeResponse:
        """
        Cancelar un cargo adicional

        Args:
            charge_id: ID del cargo
            update: Datos de actualización
            user_id: ID del usuario

        Returns:
            Cargo cancelado

        Raises:
            HTTPException: Si no tiene permisos o validaciones fallidas
        """
        from fastapi import HTTPException

        # Obtener cargo
        charge = self.db.query(AdditionalCharge).filter(
            and_(
                AdditionalCharge.id == charge_id,
                AdditionalCharge.deleted_at.is_(None)
            )
        ).first()

        if not charge:
            raise HTTPException(
                status_code=404,
                detail="Cargo adicional no encontrado"
            )

        # Validar estado (pending -> cancelled)
        if charge.status != DeductionStatus.PENDING:
            raise HTTPException(
                status_code=400,
                detail=f"Solo se pueden cancelar cargos en estado pending (estado actual: {charge.status})"
            )

        # Actualizar cargo
        charge.status = DeductionStatus.CANCELLED
        charge.updated_at = datetime.now()

        # Actualizar notas si se proporcionan
        if update and hasattr(update, 'notes') and update.notes:
            charge.notes = update.notes

        self.db.commit()
        self.db.refresh(charge)

        return AdditionalChargeResponse(
            id=charge.id,
            assignment_id=charge.assignment_id,
            employee_id=charge.employee_id,
            apartment_id=charge.apartment_id,
            charge_type=charge.charge_type,
            amount=charge.amount,
            charge_date=charge.charge_date,
            description=charge.description,
            status=charge.status,
            approved_by=charge.approved_by,
            approved_at=charge.approved_at,
            notes=charge.notes,
            created_at=charge.created_at,
            updated_at=charge.updated_at,
        )

    async def delete_additional_charge(
        self,
        charge_id: int,
        user_id: int,
    ) -> None:
        """
        Eliminar un cargo adicional (solo si está pending)

        Args:
            charge_id: ID del cargo
            user_id: ID del usuario

        Raises:
            HTTPException: Si no se puede eliminar
        """
        from fastapi import HTTPException

        # Obtener cargo
        charge = self.db.query(AdditionalCharge).filter(
            and_(
                AdditionalCharge.id == charge_id,
                AdditionalCharge.deleted_at.is_(None)
            )
        ).first()

        if not charge:
            raise HTTPException(
                status_code=404,
                detail="Cargo adicional no encontrado"
            )

        # Verificar que el cargo está pending
        if charge.status != DeductionStatus.PENDING:
            raise HTTPException(
                status_code=400,
                detail=f"Solo se pueden eliminar cargos en estado pending (estado actual: {charge.status})"
            )

        # Obtener usuario para verificar permisos
        user = self.db.query(User).filter(User.id == user_id).first()
        if not user:
            raise HTTPException(
                status_code=404,
                detail="Usuario no encontrado"
            )

        # Verificar permisos (ADMIN+ o creador del cargo)
        # Por ahora solo permitimos ADMIN+
        if user.role not in ["SUPER_ADMIN", "ADMIN", "COORDINATOR"]:
            raise HTTPException(
                status_code=403,
                detail="No tiene permisos para eliminar cargos"
            )

        # Soft delete
        charge.deleted_at = datetime.now()
        self.db.commit()

    # -------------------------------------------------------------------------
    # MÉTODOS AUXILIARES
    # -------------------------------------------------------------------------

    def _has_permission(self, user: User, action: str) -> bool:
        """
        Verificar si el usuario tiene permisos para una acción

        Args:
            user: Usuario
            action: Acción a verificar

        Returns:
            True si tiene permisos
        """
        # TODO: Implementar sistema de permisos
        # Roles: SUPER_ADMIN > ADMIN > COORDINATOR > KANRININSHA > EMPLOYEE > CONTRACT_WORKER
        return user.role in ["SUPER_ADMIN", "ADMIN", "COORDINATOR"]
