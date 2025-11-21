"""
Servicio de Asignaciones V2.0
=============================

Servicio para gestión de asignaciones empleado-apartamento (社宅) con:
- Crear/actualizar/finalizar asignaciones
- Cálculo de renta prorrateada
- Transferencias entre apartamentos
- Integración con cargos adicionales y deducciones

Autor: Sistema UNS-ClaudeJP
"""

from sqlalchemy.orm import Session
from sqlalchemy import and_, or_, func, desc
from typing import List, Optional, Tuple
from datetime import datetime, date, timedelta
import calendar
from decimal import Decimal
import logging

from app.models.models import (
    Apartment,
    ApartmentAssignment,
    Employee,
    User,
    AssignmentStatus,
    RentDeduction,
    DeductionStatus,
    ApartmentStatus,
    RoomType,
)

# Configure logging
logger = logging.getLogger(__name__)
from app.schemas.apartment_v2 import (
    AssignmentCreate,
    AssignmentResponse,
    AssignmentUpdate,
    AssignmentListItem,
    TransferRequest,
    TransferResponse,
    ProratedCalculationRequest,
    ProratedCalculationResponse,
    TotalCalculationRequest,
    TotalCalculationResponse,
    AssignmentStatus,
    AssignmentStatisticsResponse,
    ApartmentResponse,
)


class AssignmentService:
    """Servicio para operaciones de asignaciones"""

    def __init__(self, db: Session):
        self.db = db

    # -------------------------------------------------------------------------
    # HELPER METHODS
    # -------------------------------------------------------------------------

    def _get_apartment_capacity(self, apartment: Apartment) -> int:
        """
        Obtener capacidad del apartamento basada en room_type

        Capacidades definidas:
        - 1K/1DK/STUDIO = 1 persona
        - 1LDK/2DK/2K = 2 personas
        - 2LDK = 3 personas
        - 3LDK = 4 personas
        - OTHER = 1 persona (default)

        Args:
            apartment: Apartamento

        Returns:
            Capacidad máxima del apartamento
        """
        # Si apartment.capacity ya está definido, usarlo
        if hasattr(apartment, 'capacity') and apartment.capacity is not None and apartment.capacity > 0:
            return apartment.capacity

        # Calcular capacidad basada en room_type
        capacity_map = {
            RoomType.ONE_K: 1,
            RoomType.ONE_DK: 1,
            RoomType.STUDIO: 1,
            RoomType.ONE_LDK: 2,
            RoomType.TWO_DK: 2,
            RoomType.TWO_K: 2,
            RoomType.TWO_LDK: 3,
            RoomType.THREE_LDK: 4,
            RoomType.OTHER: 1,
        }

        return capacity_map.get(apartment.room_type, 1)

    # -------------------------------------------------------------------------
    # GESTIÓN DE ASIGNACIONES
    # -------------------------------------------------------------------------

    async def create_assignment(
        self,
        assignment: AssignmentCreate,
        user_id: int,
    ) -> AssignmentResponse:
        """
        Crear nueva asignación empleado-apartamento

        Flujo completo:
        1. Validar apartamento existe y está activo
        2. Validar empleado existe y está activo
        3. Verificar que empleado no tiene otra asignación activa
        4. Calcular renta prorrateada si es necesario
        5. Calcular total a descontar
        6. Crear registro en apartment_assignments
        7. Actualizar empleado (apartment_id)
        8. Generar deducción (si es mes completo)

        Args:
            assignment: Datos de la asignación
            user_id: ID del usuario

        Returns:
            Asignación creada

        Raises:
            HTTPException: Si hay validaciones fallidas
        """
        from fastapi import HTTPException

        # 1. Validar apartamento
        apartment = self.db.query(Apartment).filter(
            and_(
                Apartment.id == assignment.apartment_id,
                Apartment.deleted_at.is_(None)
            )
        ).first()

        if not apartment:
            logger.error(f"Apartment not found: apartment_id={assignment.apartment_id}")
            raise HTTPException(
                status_code=404,
                detail="Apartamento no encontrado / Apartment not found"
            )

        # Validación: Apartamento debe estar ACTIVE
        if apartment.status != ApartmentStatus.ACTIVE:
            logger.error(
                f"Apartment not available: apartment_id={apartment.id}, "
                f"status={apartment.status.value}"
            )
            raise HTTPException(
                status_code=400,
                detail=f"Apartamento no disponible para asignación (estado: {apartment.status.value}) / "
                       f"Apartment not available for assignment (status: {apartment.status.value})"
            )

        # 2. Validar empleado
        employee = self.db.query(Employee).filter(
            and_(
                Employee.id == assignment.employee_id,
                Employee.deleted_at.is_(None)
            )
        ).first()

        if not employee:
            logger.error(f"Employee not found: employee_id={assignment.employee_id}")
            raise HTTPException(
                status_code=404,
                detail="Empleado no encontrado / Employee not found"
            )

        # Validación: Empleado debe estar ACTIVO
        if not employee.is_active:
            logger.error(
                f"Employee not active: employee_id={employee.id}, "
                f"is_active={employee.is_active}"
            )
            raise HTTPException(
                status_code=400,
                detail="El empleado no está activo / Employee not available for assignment (inactive)"
            )

        # 2.1. Validación: Fechas válidas (start_date y end_date)
        today = date.today()

        # start_date no puede ser en el pasado (tolerancia de 1 día para correcciones)
        if assignment.start_date < today - timedelta(days=1):
            logger.error(
                f"Start date in the past: start_date={assignment.start_date}, today={today}"
            )
            raise HTTPException(
                status_code=400,
                detail=f"La fecha de inicio no puede ser en el pasado (start_date: {assignment.start_date}) / "
                       f"Start date cannot be in the past"
            )

        # Si hay end_date, debe ser >= start_date
        if assignment.end_date and assignment.end_date < assignment.start_date:
            logger.error(
                f"Invalid date range: start_date={assignment.start_date}, end_date={assignment.end_date}"
            )
            raise HTTPException(
                status_code=400,
                detail=f"La fecha de finalización ({assignment.end_date}) no puede ser anterior a "
                       f"la fecha de inicio ({assignment.start_date}) / "
                       f"End date cannot be before start date"
            )

        # 2.2. Validación: end_date no puede exceder contract_end_date del apartamento
        if assignment.end_date and apartment.contract_end_date:
            if assignment.end_date > apartment.contract_end_date:
                logger.error(
                    f"Assignment end_date exceeds apartment contract: "
                    f"assignment_end={assignment.end_date}, "
                    f"apartment_contract_end={apartment.contract_end_date}"
                )
                raise HTTPException(
                    status_code=400,
                    detail=f"La fecha de finalización de la asignación ({assignment.end_date}) "
                           f"excede el contrato del apartamento ({apartment.contract_end_date}) / "
                           f"Assignment end date exceeds apartment contract end date"
                )

        # 2.3. Validación: Verificar capacidad disponible del apartamento
        # Contar asignaciones activas actuales
        current_occupancy = self.db.query(func.count(ApartmentAssignment.id)).filter(
            and_(
                ApartmentAssignment.apartment_id == assignment.apartment_id,
                ApartmentAssignment.status == AssignmentStatus.ACTIVE,
                ApartmentAssignment.deleted_at.is_(None)
            )
        ).scalar() or 0

        # Obtener capacidad del apartamento basada en room_type
        apartment_capacity = self._get_apartment_capacity(apartment)

        if current_occupancy >= apartment_capacity:
            logger.error(
                f"Apartment at maximum capacity: apartment_id={apartment.id}, "
                f"room_type={apartment.room_type.value if apartment.room_type else 'N/A'}, "
                f"capacity={apartment_capacity}, current_occupancy={current_occupancy}"
            )
            raise HTTPException(
                status_code=400,
                detail=f"Apartamento en capacidad máxima ({apartment_capacity}/{apartment_capacity}). "
                       f"No se puede asignar más empleados / "
                       f"Apartment at maximum capacity ({apartment_capacity}/{apartment_capacity})"
            )

        # 3. Validación: Verificar que empleado NO tiene asignación ACTIVA
        # Verificar tanto en Employee como en ApartmentAssignment
        existing_employee_assignment = self.db.query(Employee).filter(
            and_(
                Employee.id == assignment.employee_id,
                Employee.apartment_id.isnot(None),
                Employee.deleted_at.is_(None)
            )
        ).first()

        existing_assignment_record = self.db.query(ApartmentAssignment).filter(
            and_(
                ApartmentAssignment.employee_id == assignment.employee_id,
                ApartmentAssignment.status == AssignmentStatus.ACTIVE,
                ApartmentAssignment.deleted_at.is_(None)
            )
        ).first()

        if existing_employee_assignment or existing_assignment_record:
            logger.error(
                f"Employee already has active assignment: employee_id={assignment.employee_id}, "
                f"existing_apartment_id={existing_employee_assignment.apartment_id if existing_employee_assignment else existing_assignment_record.apartment_id}"
            )
            raise HTTPException(
                status_code=409,  # 409 Conflict for business logic conflict
                detail="El empleado ya tiene una asignación activa. Debe finalizarla primero / "
                       "Employee already has active assignment. Must end it first."
            )

        # 3.1. Validación: Verificar NO hay overlap de fechas para el mismo empleado
        # Buscar asignaciones del empleado que se solapan con las fechas nuevas
        overlapping_query = self.db.query(ApartmentAssignment).filter(
            and_(
                ApartmentAssignment.employee_id == assignment.employee_id,
                ApartmentAssignment.deleted_at.is_(None),
                # Overlap condition: nueva asignación empieza antes de que termine una existente
                or_(
                    # Caso 1: Asignación existente sin fecha fin (activa)
                    ApartmentAssignment.end_date.is_(None),
                    # Caso 2: Asignación existente termina después del inicio de la nueva
                    ApartmentAssignment.end_date >= assignment.start_date
                )
            )
        )

        # Si hay end_date en la nueva asignación, verificar también que no empiece durante una existente
        if assignment.end_date:
            overlapping_query = overlapping_query.filter(
                # La asignación existente empieza antes de que termine la nueva
                ApartmentAssignment.start_date <= assignment.end_date
            )

        overlapping = overlapping_query.first()

        if overlapping:
            logger.error(
                f"Date overlap detected: employee_id={assignment.employee_id}, "
                f"existing_assignment_id={overlapping.id}, "
                f"existing_dates={overlapping.start_date} to {overlapping.end_date or 'active'}, "
                f"new_dates={assignment.start_date} to {assignment.end_date or 'active'}"
            )
            raise HTTPException(
                status_code=409,  # 409 Conflict
                detail=f"El empleado tiene una asignación con fechas que se solapan (ID: {overlapping.id}, "
                       f"desde {overlapping.start_date} hasta {overlapping.end_date or 'activa'}) / "
                       f"Employee has overlapping assignment dates (ID: {overlapping.id})"
            )

        # 4. Calcular renta prorrateada si es necesario
        prorated_rent = await self._calculate_rent_for_assignment(
            assignment.monthly_rent,
            assignment.start_date,
            assignment.end_date,
            assignment.year if hasattr(assignment, 'year') else assignment.start_date.year,
            assignment.month if hasattr(assignment, 'month') else assignment.start_date.month,
        )

        # 5. Calcular total a descontar (solo renta por ahora)
        total_deduction = prorated_rent.prorated_rent

        try:
            # 6. Crear registro en apartment_assignments
            assignment_record = ApartmentAssignment(
                apartment_id=assignment.apartment_id,
                employee_id=assignment.employee_id,
                start_date=assignment.start_date,
                end_date=assignment.end_date,
                monthly_rent=assignment.monthly_rent,
                days_in_month=prorated_rent.days_in_month,
                days_occupied=prorated_rent.days_occupied,
                prorated_rent=prorated_rent.prorated_rent,
                is_prorated=prorated_rent.is_prorated,
                total_deduction=total_deduction,
                contract_type=assignment.contract_type,
                status=AssignmentStatus.ACTIVE,
                notes=assignment.notes,
            )
            self.db.add(assignment_record)
            self.db.flush()  # Para obtener el ID

            # 7. SINCRONIZAR: Actualizar employee.apartment_id
            self._sync_employee_apartment(
                employee_id=assignment.employee_id,
                apartment_id=assignment.apartment_id,
                start_date=assignment.start_date,
                monthly_rent=assignment.monthly_rent,
                action="assign",
            )

            # 8. Generar deducción si es mes completo
            if not prorated_rent.is_prorated:
                # Crear deducción en rent_deductions para mes completo
                deduction = RentDeduction(
                    assignment_id=assignment_record.id,
                    employee_id=assignment.employee_id,
                    apartment_id=assignment.apartment_id,
                    year=assignment.start_date.year,
                    month=assignment.start_date.month,
                    base_rent=assignment.monthly_rent,
                    additional_charges=0,  # Se agregarán después vía AdditionalCharge
                    total_deduction=assignment.monthly_rent,
                    status=DeductionStatus.PENDING,
                    created_at=datetime.now(),
                )
                self.db.add(deduction)
                self.db.flush()

            self.db.commit()

            # Log success
            logger.info(
                f"Assignment created successfully: assignment_id={assignment_record.id}, "
                f"employee_id={assignment.employee_id}, apartment_id={assignment.apartment_id}, "
                f"start_date={assignment.start_date}, monthly_rent={assignment.monthly_rent}, "
                f"prorated_rent={prorated_rent.prorated_rent}"
            )

            # Construir respuesta
            return await self._build_assignment_response(
                assignment_id=assignment_record.id,
                assignment_data=assignment,
                employee_data=employee,
                apartment_data=apartment,
                prorated_rent=prorated_rent,
            )

        except HTTPException:
            # Re-raise HTTPException (validations already logged)
            self.db.rollback()
            raise
        except Exception as e:
            self.db.rollback()
            logger.error(
                f"Unexpected error creating assignment: employee_id={assignment.employee_id}, "
                f"apartment_id={assignment.apartment_id}, error={str(e)}"
            )
            raise HTTPException(
                status_code=500,
                detail=f"Error al crear asignación: {str(e)}"
            )

    async def end_assignment(
        self,
        assignment_id: int,
        update: AssignmentUpdate,
        user_id: int,
    ) -> AssignmentResponse:
        """
        Finalizar asignación (salida del empleado)

        Proceso:
        1. Validar asignación existe y está activa
        2. Calcular días ocupados hasta fecha fin
        3. Calcular renta prorrateada
        4. Agregar cargo de limpieza
        5. Agregar otros cargos adicionales
        6. Calcular total a descontar
        7. Actualizar asignación como 'ended'
        8. Actualizar empleado (apartment_id = null)
        9. Generar deducción final

        Args:
            assignment_id: ID de la asignación
            update: Datos de actualización
            user_id: ID del usuario

        Returns:
            Asignación finalizada

        Raises:
            HTTPException: Si hay validaciones fallidas
        """
        from fastapi import HTTPException

        # 1. Validar asignación existe y está activa
        assignment = self.db.query(ApartmentAssignment).filter(
            and_(
                ApartmentAssignment.id == assignment_id,
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
                detail=f"La asignación no está activa (estado actual: {assignment.status.value})"
            )

        # Validar que end_date se haya proporcionado
        if not update.end_date:
            raise HTTPException(
                status_code=400,
                detail="Debe proporcionar una fecha de finalización"
            )

        # Validar que end_date sea >= start_date
        if update.end_date < assignment.start_date:
            raise HTTPException(
                status_code=400,
                detail="La fecha de finalización no puede ser anterior a la fecha de inicio"
            )

        try:
            # 2-3. Calcular renta prorrateada hasta la fecha de fin
            prorated_rent = await self._calculate_rent_for_assignment(
                assignment.monthly_rent,
                assignment.start_date,
                update.end_date,
                update.end_date.year,
                update.end_date.month,
            )

            # 4. Calcular total con cargos adicionales (limpieza, etc.)
            # TODO: Agregar cargos adicionales de AdditionalCharge
            total_deduction = prorated_rent.prorated_rent

            # 5. Actualizar asignación como 'ended'
            assignment.end_date = update.end_date
            assignment.status = AssignmentStatus.ENDED
            assignment.days_occupied = prorated_rent.days_occupied
            assignment.prorated_rent = prorated_rent.prorated_rent
            assignment.is_prorated = prorated_rent.is_prorated
            assignment.total_deduction = total_deduction
            if update.notes:
                assignment.notes = update.notes
            assignment.updated_at = datetime.now()

            self.db.flush()

            # 6. SINCRONIZAR: Actualizar empleado (apartment_id = null)
            self._sync_employee_apartment(
                employee_id=assignment.employee_id,
                apartment_id=None,
                action="unassign",
            )

            # 7. Generar deducción final
            # TODO: Crear deducción en rent_deductions

            self.db.commit()

            # Obtener datos para respuesta
            employee = self.db.query(Employee).filter(Employee.id == assignment.employee_id).first()
            apartment = self.db.query(Apartment).filter(Apartment.id == assignment.apartment_id).first()

            # Construir datos de asignación para la respuesta
            from app.schemas.apartment_v2 import AssignmentCreate
            assignment_data = AssignmentCreate(
                apartment_id=assignment.apartment_id,
                employee_id=assignment.employee_id,
                start_date=assignment.start_date,
                end_date=assignment.end_date,
                monthly_rent=assignment.monthly_rent,
                contract_type=assignment.contract_type,
                notes=assignment.notes,
            )

            return await self._build_assignment_response(
                assignment_id=assignment.id,
                assignment_data=assignment_data,
                employee_data=employee,
                apartment_data=apartment,
                prorated_rent=prorated_rent,
            )

        except HTTPException:
            self.db.rollback()
            raise
        except Exception as e:
            self.db.rollback()
            raise HTTPException(
                status_code=500,
                detail=f"Error al finalizar asignación: {str(e)}"
            )

    async def transfer_assignment(
        self,
        transfer: TransferRequest,
        user_id: int,
    ) -> TransferResponse:
        """
        Transferir empleado de un apartamento a otro (mudanza)

        Proceso atómico (3 pasos):
        1. Finalizar apartamento actual
        2. Iniciar nuevo apartamento
        3. Actualizar empleado

        Args:
            transfer: Datos de la transferencia
            user_id: ID del usuario

        Returns:
            Detalles de la transferencia

        Raises:
            HTTPException: Si hay validaciones fallidas
        """
        from fastapi import HTTPException
        from sqlalchemy.exc import SQLAlchemyError

        try:
            # 0. Validación: old_apartment != new_apartment
            if transfer.current_apartment_id == transfer.new_apartment_id:
                logger.error(
                    f"Transfer to same apartment: apartment_id={transfer.current_apartment_id}"
                )
                raise HTTPException(
                    status_code=400,
                    detail="No se puede transferir al mismo apartamento / Cannot transfer to same apartment"
                )

            # 1. Buscar asignación actual del empleado
            current_assignment = self.db.query(ApartmentAssignment).filter(
                and_(
                    ApartmentAssignment.employee_id == transfer.employee_id,
                    ApartmentAssignment.apartment_id == transfer.current_apartment_id,
                    ApartmentAssignment.status == AssignmentStatus.ACTIVE,
                    ApartmentAssignment.deleted_at.is_(None)
                )
            ).first()

            if not current_assignment:
                logger.error(
                    f"Active assignment not found for transfer: employee_id={transfer.employee_id}, "
                    f"current_apartment_id={transfer.current_apartment_id}"
                )
                raise HTTPException(
                    status_code=404,
                    detail="No se encontró una asignación activa para este empleado en el apartamento actual / "
                           "Active assignment not found"
                )

            # 2. Validar nuevo apartamento existe y está disponible
            new_apartment = self.db.query(Apartment).filter(
                and_(
                    Apartment.id == transfer.new_apartment_id,
                    Apartment.deleted_at.is_(None)
                )
            ).first()

            if not new_apartment:
                logger.error(f"New apartment not found: apartment_id={transfer.new_apartment_id}")
                raise HTTPException(
                    status_code=404,
                    detail="El nuevo apartamento no existe / New apartment not found"
                )

            # Validación: Nuevo apartamento debe estar ACTIVE
            if new_apartment.status != ApartmentStatus.ACTIVE:
                logger.error(
                    f"New apartment not available: apartment_id={new_apartment.id}, "
                    f"status={new_apartment.status.value}"
                )
                raise HTTPException(
                    status_code=400,
                    detail=f"El nuevo apartamento no está disponible (estado: {new_apartment.status.value}) / "
                           f"New apartment not available (status: {new_apartment.status.value})"
                )

            # 2.1. Validación: Verificar capacidad del nuevo apartamento
            new_apartment_occupancy = self.db.query(func.count(ApartmentAssignment.id)).filter(
                and_(
                    ApartmentAssignment.apartment_id == transfer.new_apartment_id,
                    ApartmentAssignment.status == AssignmentStatus.ACTIVE,
                    ApartmentAssignment.deleted_at.is_(None)
                )
            ).scalar() or 0

            new_apartment_capacity = self._get_apartment_capacity(new_apartment)

            if new_apartment_occupancy >= new_apartment_capacity:
                logger.error(
                    f"New apartment at maximum capacity: apartment_id={new_apartment.id}, "
                    f"capacity={new_apartment_capacity}, current_occupancy={new_apartment_occupancy}"
                )
                raise HTTPException(
                    status_code=400,
                    detail=f"El nuevo apartamento está en capacidad máxima ({new_apartment_capacity}/{new_apartment_capacity}) / "
                           f"New apartment at maximum capacity"
                )

            # 3. Calcular renta prorrateada hasta transfer_date para apartamento actual
            prorated_old = await self._calculate_rent_for_assignment(
                current_assignment.monthly_rent,
                current_assignment.start_date,
                transfer.transfer_date,
                transfer.transfer_date.year,
                transfer.transfer_date.month,
            )

            # 4. Finalizar asignación actual con renta prorrateada + limpieza
            current_assignment.end_date = transfer.transfer_date
            current_assignment.status = AssignmentStatus.TRANSFERRED
            current_assignment.days_occupied = prorated_old.days_occupied
            current_assignment.prorated_rent = prorated_old.prorated_rent
            current_assignment.is_prorated = True

            # Agregar cargo de limpieza
            old_apartment = self.db.query(Apartment).filter(Apartment.id == transfer.current_apartment_id).first()
            cleaning_fee = old_apartment.default_cleaning_fee if old_apartment else 20000

            current_assignment.total_deduction = prorated_old.prorated_rent + cleaning_fee
            current_assignment.notes = (current_assignment.notes or "") + f"\nTransferido a apartamento {transfer.new_apartment_id} el {transfer.transfer_date}"
            current_assignment.updated_at = datetime.now()

            self.db.flush()

            # 5. Calcular renta prorrateada desde transfer_date para nuevo apartamento
            prorated_new = await self._calculate_rent_for_assignment(
                new_apartment.base_rent,
                transfer.transfer_date,
                None,  # Sin fecha fin, es activa
                transfer.transfer_date.year,
                transfer.transfer_date.month,
            )

            # 6. Crear nueva asignación
            new_assignment = ApartmentAssignment(
                apartment_id=transfer.new_apartment_id,
                employee_id=transfer.employee_id,
                start_date=transfer.transfer_date,
                end_date=None,  # Asignación activa
                monthly_rent=new_apartment.base_rent,
                days_in_month=prorated_new.days_in_month,
                days_occupied=prorated_new.days_occupied,
                prorated_rent=prorated_new.prorated_rent,
                is_prorated=prorated_new.is_prorated,
                total_deduction=prorated_new.prorated_rent,
                contract_type=current_assignment.contract_type,
                status=AssignmentStatus.ACTIVE,
                notes=transfer.notes or f"Transferido desde apartamento {transfer.current_apartment_id}",
            )
            self.db.add(new_assignment)
            self.db.flush()

            # 7. Actualizar Employee.apartment_id
            self._sync_employee_apartment(
                employee_id=transfer.employee_id,
                apartment_id=transfer.new_apartment_id,
                start_date=transfer.transfer_date,
                monthly_rent=new_apartment.base_rent,
                action="transfer",
            )

            self.db.commit()

            # Log success
            logger.info(
                f"Transfer completed successfully: employee_id={transfer.employee_id}, "
                f"old_apartment_id={transfer.current_apartment_id}, "
                f"new_apartment_id={transfer.new_apartment_id}, "
                f"transfer_date={transfer.transfer_date}, "
                f"ended_assignment_id={current_assignment.id}, "
                f"new_assignment_id={new_assignment.id}"
            )

            # 8. Construir respuesta con breakdown de costos
            employee = self.db.query(Employee).filter(Employee.id == transfer.employee_id).first()

            # Construir AssignmentResponse para asignación finalizada
            from app.schemas.apartment_v2 import AssignmentCreate
            ended_data = AssignmentCreate(
                apartment_id=current_assignment.apartment_id,
                employee_id=current_assignment.employee_id,
                start_date=current_assignment.start_date,
                end_date=current_assignment.end_date,
                monthly_rent=current_assignment.monthly_rent,
                contract_type=current_assignment.contract_type,
                notes=current_assignment.notes,
            )

            ended_response = await self._build_assignment_response(
                assignment_id=current_assignment.id,
                assignment_data=ended_data,
                employee_data=employee,
                apartment_data=old_apartment,
                prorated_rent=prorated_old,
            )
            ended_response.status = AssignmentStatus.TRANSFERRED
            ended_response.total_deduction = current_assignment.total_deduction

            # Construir AssignmentResponse para nueva asignación
            new_data = AssignmentCreate(
                apartment_id=new_assignment.apartment_id,
                employee_id=new_assignment.employee_id,
                start_date=new_assignment.start_date,
                end_date=new_assignment.end_date,
                monthly_rent=new_assignment.monthly_rent,
                contract_type=new_assignment.contract_type,
                notes=new_assignment.notes,
            )

            new_response = await self._build_assignment_response(
                assignment_id=new_assignment.id,
                assignment_data=new_data,
                employee_data=employee,
                apartment_data=new_apartment,
                prorated_rent=prorated_new,
            )

            # Calcular totales
            old_apartment_cost = prorated_old.prorated_rent + cleaning_fee
            new_apartment_cost = prorated_new.prorated_rent
            total_monthly_cost = old_apartment_cost + new_apartment_cost

            # Breakdown detallado
            breakdown = {
                "old_apartment": {
                    "apartment_id": transfer.current_apartment_id,
                    "apartment_name": old_apartment.name if old_apartment else "Unknown",
                    "prorated_rent": prorated_old.prorated_rent,
                    "days_occupied": prorated_old.days_occupied,
                    "cleaning_fee": cleaning_fee,
                    "subtotal": old_apartment_cost,
                },
                "new_apartment": {
                    "apartment_id": transfer.new_apartment_id,
                    "apartment_name": new_apartment.name,
                    "prorated_rent": prorated_new.prorated_rent,
                    "days_occupied": prorated_new.days_occupied,
                    "subtotal": new_apartment_cost,
                },
                "transfer_date": transfer.transfer_date.isoformat(),
                "total_deduction": total_monthly_cost,
            }

            return TransferResponse(
                ended_assignment=ended_response,
                new_assignment=new_response,
                old_apartment_cost=old_apartment_cost,
                new_apartment_cost=new_apartment_cost,
                total_monthly_cost=total_monthly_cost,
                breakdown=breakdown,
            )

        except HTTPException:
            # Re-raise HTTPException (validations already logged)
            self.db.rollback()
            raise
        except Exception as e:
            self.db.rollback()
            logger.error(
                f"Unexpected error transferring employee: employee_id={transfer.employee_id}, "
                f"old_apartment_id={transfer.current_apartment_id}, "
                f"new_apartment_id={transfer.new_apartment_id}, error={str(e)}"
            )
            raise HTTPException(
                status_code=500,
                detail=f"Error al transferir empleado: {str(e)}"
            )

    # -------------------------------------------------------------------------
    # LISTADO Y CONSULTA
    # -------------------------------------------------------------------------

    async def list_assignments(
        self,
        skip: int = 0,
        limit: int = 100,
        employee_id: Optional[int] = None,
        apartment_id: Optional[int] = None,
        status_filter: Optional[str] = None,
        start_date_from: Optional[date] = None,
        start_date_to: Optional[date] = None,
    ) -> List[AssignmentListItem]:
        """
        Listar asignaciones con filtros

        Args:
            skip: Registros a omitir
            limit: Límite de registros
            employee_id: Filtrar por empleado
            apartment_id: Filtrar por apartamento
            status_filter: Filtrar por estado
            start_date_from: Fecha inicio desde
            start_date_to: Fecha inicio hasta

        Returns:
            Lista de asignaciones
        """
        # Query base con joins
        query = self.db.query(
            ApartmentAssignment,
            Apartment.name.label('apartment_name'),
            Apartment.building_name.label('apartment_code'),
            Employee.full_name_kanji.label('employee_name_kanji'),
            Employee.full_name_kana.label('employee_name_kana'),
        ).join(
            Apartment,
            ApartmentAssignment.apartment_id == Apartment.id
        ).join(
            Employee,
            ApartmentAssignment.employee_id == Employee.id
        ).filter(
            ApartmentAssignment.deleted_at.is_(None)
        )

        # Aplicar filtros
        if employee_id is not None:
            query = query.filter(ApartmentAssignment.employee_id == employee_id)

        if apartment_id is not None:
            query = query.filter(ApartmentAssignment.apartment_id == apartment_id)

        if status_filter:
            query = query.filter(ApartmentAssignment.status == status_filter)

        if start_date_from:
            query = query.filter(ApartmentAssignment.start_date >= start_date_from)

        if start_date_to:
            query = query.filter(ApartmentAssignment.start_date <= start_date_to)

        # Ordenar por fecha de inicio descendente (más recientes primero)
        query = query.order_by(desc(ApartmentAssignment.start_date))

        # Paginación
        query = query.offset(skip).limit(limit)

        # Ejecutar query
        results = query.all()

        # Construir lista de items
        assignments = []
        for assignment, apt_name, apt_code, emp_name_kanji, emp_name_kana in results:
            assignments.append(AssignmentListItem(
                id=assignment.id,
                apartment_id=assignment.apartment_id,
                employee_id=assignment.employee_id,
                start_date=assignment.start_date,
                end_date=assignment.end_date,
                status=assignment.status,
                total_deduction=assignment.total_deduction,
                created_at=assignment.created_at,
                apartment_name=apt_name or "Unknown",
                apartment_code=apt_code,
                employee_name_kanji=emp_name_kanji or "Unknown",
                employee_name_kana=emp_name_kana,
            ))

        return assignments

    async def get_assignment(
        self,
        assignment_id: int,
    ) -> AssignmentResponse:
        """
        Obtener asignación por ID

        Args:
            assignment_id: ID de la asignación

        Returns:
            Asignación con detalles

        Raises:
            HTTPException: Si no se encuentra
        """
        from fastapi import HTTPException

        # Query con joins para obtener datos relacionados
        assignment = self.db.query(ApartmentAssignment).filter(
            and_(
                ApartmentAssignment.id == assignment_id,
                ApartmentAssignment.deleted_at.is_(None)
            )
        ).first()

        if not assignment:
            raise HTTPException(
                status_code=404,
                detail="Asignación no encontrada"
            )

        # Obtener apartamento
        apartment = self.db.query(Apartment).filter(
            Apartment.id == assignment.apartment_id
        ).first()

        # Obtener empleado
        employee = self.db.query(Employee).filter(
            Employee.id == assignment.employee_id
        ).first()

        if not apartment or not employee:
            raise HTTPException(
                status_code=404,
                detail="Datos relacionados no encontrados"
            )

        # Calcular estadísticas
        days_elapsed = 0
        if assignment.end_date:
            days_elapsed = (assignment.end_date - assignment.start_date).days + 1
        else:
            days_elapsed = (date.today() - assignment.start_date).days + 1

        # Construir prorated rent response para usar en _build_assignment_response
        from app.schemas.apartment_v2 import ProratedCalculationResponse
        prorated_rent = ProratedCalculationResponse(
            monthly_rent=assignment.monthly_rent,
            year=assignment.start_date.year,
            month=assignment.start_date.month,
            days_in_month=assignment.days_in_month,
            start_date=assignment.start_date,
            end_date=assignment.end_date,
            days_occupied=assignment.days_occupied,
            daily_rate=Decimal(assignment.monthly_rent) / Decimal(assignment.days_in_month),
            prorated_rent=assignment.prorated_rent,
            is_prorated=assignment.is_prorated,
        )

        # Construir AssignmentCreate para _build_assignment_response
        from app.schemas.apartment_v2 import AssignmentCreate
        assignment_data = AssignmentCreate(
            apartment_id=assignment.apartment_id,
            employee_id=assignment.employee_id,
            start_date=assignment.start_date,
            end_date=assignment.end_date,
            monthly_rent=assignment.monthly_rent,
            contract_type=assignment.contract_type,
            notes=assignment.notes,
        )

        # Construir respuesta completa
        response = await self._build_assignment_response(
            assignment_id=assignment.id,
            assignment_data=assignment_data,
            employee_data=employee,
            apartment_data=apartment,
            prorated_rent=prorated_rent,
        )

        # Actualizar con valores reales de la asignación
        response.status = assignment.status
        response.created_at = assignment.created_at
        response.updated_at = assignment.updated_at
        response.total_deduction = assignment.total_deduction

        return response

    async def get_active_assignments(
        self,
    ) -> List[AssignmentListItem]:
        """
        Obtener todas las asignaciones activas

        Returns:
            Lista de asignaciones activas
        """
        # Reutilizar list_assignments con filtro de status
        return await self.list_assignments(
            skip=0,
            limit=1000,  # Suficiente para la mayoría de casos
            status_filter=AssignmentStatus.ACTIVE.value
        )

    # -------------------------------------------------------------------------
    # CÁLCULOS
    # -------------------------------------------------------------------------

    async def calculate_prorated_rent(
        self,
        calculation: ProratedCalculationRequest,
    ) -> ProratedCalculationResponse:
        """
        Calcular renta prorrateada

        Args:
            calculation: Datos para el cálculo

        Returns:
            Resultado del cálculo

        Raises:
            HTTPException: Si los datos de entrada son inválidos
        """
        from fastapi import HTTPException

        # Calcular días en el mes
        days_in_month = calendar.monthrange(calculation.year, calculation.month)[1]

        # Calcular días ocupados
        if calculation.end_date:
            days_occupied = (calculation.end_date - calculation.start_date).days + 1
        else:
            # Hasta fin de mes
            end_of_month = datetime(calculation.year, calculation.month, days_in_month).date()
            days_occupied = (end_of_month - calculation.start_date).days + 1

        # Validación: days_occupied debe ser >= 1
        if days_occupied < 1:
            logger.error(
                f"Invalid days_occupied calculated: days_occupied={days_occupied}, "
                f"start_date={calculation.start_date}, end_date={calculation.end_date}"
            )
            raise HTTPException(
                status_code=400,
                detail=f"Días ocupados inválidos: {days_occupied}. Debe ser >= 1 / "
                       f"Invalid occupied days: {days_occupied}"
            )

        # Validación: days_occupied no debe exceder days_in_month
        if days_occupied > days_in_month:
            logger.warning(
                f"Days occupied exceeds days in month: days_occupied={days_occupied}, "
                f"days_in_month={days_in_month}. Clamping to {days_in_month}"
            )
            days_occupied = days_in_month

        # Calcular tasa diaria (con decimales)
        daily_rate = Decimal(calculation.monthly_rent) / Decimal(days_in_month)

        # Calcular renta prorrateada y redondear
        prorated_rent = int((daily_rate * Decimal(days_occupied)).quantize(Decimal('1')))

        # Validación: prorated_rent debe ser >= 0
        if prorated_rent < 0:
            logger.error(
                f"Negative prorated_rent calculated: prorated_rent={prorated_rent}, "
                f"monthly_rent={calculation.monthly_rent}, days_occupied={days_occupied}"
            )
            raise HTTPException(
                status_code=400,
                detail=f"Renta prorrateada inválida: {prorated_rent}. Debe ser >= 0 / "
                       f"Invalid prorated rent: {prorated_rent}"
            )

        is_prorated = days_occupied != days_in_month

        # Generar fórmula de cálculo
        if is_prorated:
            calculation_formula = f"¥{calculation.monthly_rent:,} ÷ {days_in_month} días × {days_occupied} días = ¥{prorated_rent:,}"
        else:
            calculation_formula = f"Mes completo: ¥{calculation.monthly_rent:,}"

        return ProratedCalculationResponse(
            monthly_rent=calculation.monthly_rent,
            year=calculation.year,
            month=calculation.month,
            days_in_month=days_in_month,
            start_date=calculation.start_date,
            end_date=calculation.end_date,
            days_occupied=days_occupied,
            daily_rate=daily_rate,
            prorated_rent=prorated_rent,
            is_prorated=is_prorated,
            calculation_formula=calculation_formula,
        )

    async def calculate_total_deduction(
        self,
        calculation: TotalCalculationRequest,
    ) -> TotalCalculationResponse:
        """
        Calcular deducción total (renta + cargos adicionales)

        Fórmula:
        Total = Renta + Σ(Cargos Adicionales)

        Args:
            calculation: Datos para el cálculo

        Returns:
            Resultado del cálculo
        """
        # Sumar cargos adicionales
        additional_charges_total = sum(
            charge.get("amount", 0)
            for charge in calculation.additional_charges
        )

        # Calcular total
        total_deduction = calculation.base_rent + additional_charges_total

        # Construir breakdown
        breakdown = [
            {
                "type": "rent",
                "amount": calculation.base_rent,
                "description": "Renta prorrateada" if calculation.is_prorated else "Renta mensual"
            }
        ]

        for charge in calculation.additional_charges:
            breakdown.append({
                "type": charge.get("charge_type", "other"),
                "amount": charge.get("amount", 0),
                "description": charge.get("description", "Cargo adicional")
            })

        return TotalCalculationResponse(
            base_rent=calculation.base_rent,
            additional_charges_total=additional_charges_total,
            total_deduction=total_deduction,
            breakdown=breakdown,
        )

    # -------------------------------------------------------------------------
    # MÉTODOS AUXILIARES
    # -------------------------------------------------------------------------

    async def _calculate_rent_for_assignment(
        self,
        monthly_rent: int,
        start_date: date,
        end_date: Optional[date],
        year: int,
        month: int,
    ) -> ProratedCalculationResponse:
        """Calcular renta para una asignación"""
        # Crear request de cálculo
        calculation = ProratedCalculationRequest(
            monthly_rent=monthly_rent,
            start_date=start_date,
            end_date=end_date,
            year=year,
            month=month,
        )

        return await self.calculate_prorated_rent(calculation)

    async def _build_assignment_response(
        self,
        assignment_id: int,
        assignment_data: AssignmentCreate,
        employee_data: Employee,
        apartment_data: Apartment,
        prorated_rent: ProratedCalculationResponse,
    ) -> AssignmentResponse:
        """Construir respuesta de asignación"""
        # Placeholder - TODO: Implementar con datos reales
        return AssignmentResponse(
            id=assignment_id,
            apartment_id=assignment_data.apartment_id,
            employee_id=assignment_data.employee_id,
            start_date=assignment_data.start_date,
            end_date=assignment_data.end_date,
            monthly_rent=assignment_data.monthly_rent,
            days_in_month=prorated_rent.days_in_month,
            days_occupied=prorated_rent.days_occupied,
            prorated_rent=prorated_rent.prorated_rent,
            is_prorated=prorated_rent.is_prorated,
            total_deduction=prorated_rent.prorated_rent,
            contract_type=assignment_data.contract_type,
            notes=assignment_data.notes,
            status=AssignmentStatus.ACTIVE,
            created_at=datetime.now(),
            updated_at=datetime.now(),
            apartment=ApartmentResponse(
                id=apartment_data.id,
                name=apartment_data.name,
                building_name=apartment_data.building_name,
                room_number=apartment_data.room_number,
                floor_number=apartment_data.floor_number,
                postal_code=apartment_data.postal_code,
                prefecture=apartment_data.prefecture,
                city=apartment_data.city,
                address_line1=apartment_data.address_line1,
                address_line2=apartment_data.address_line2,
                room_type=apartment_data.room_type,
                size_sqm=apartment_data.size_sqm,
                base_rent=apartment_data.base_rent,
                management_fee=apartment_data.management_fee,
                deposit=apartment_data.deposit,
                key_money=apartment_data.key_money,
                default_cleaning_fee=apartment_data.default_cleaning_fee,
                contract_start_date=apartment_data.contract_start_date,
                contract_end_date=apartment_data.contract_end_date,
                landlord_name=apartment_data.landlord_name,
                landlord_contact=apartment_data.landlord_contact,
                real_estate_agency=apartment_data.real_estate_agency,
                emergency_contact=apartment_data.emergency_contact,
                notes=apartment_data.notes,
                status=apartment_data.status,
                created_at=apartment_data.created_at,
                updated_at=apartment_data.updated_at,
                full_address=None,
                total_monthly_cost=apartment_data.base_rent + apartment_data.management_fee,
                active_assignments=0,
            ),
            employee={
                "id": employee_data.id,
                "full_name_kanji": employee_data.full_name_kanji,
                "full_name_kana": employee_data.full_name_kana,
            },
        )

    def _sync_employee_apartment(
        self,
        employee_id: int,
        apartment_id: Optional[int],
        start_date: Optional[date] = None,
        monthly_rent: Optional[int] = None,
        action: str = "assign",
    ) -> Employee:
        """
        Sincronizar employee.apartment_id con ApartmentAssignment

        Esta función mantiene la sincronización bidireccional entre:
        - Employee.apartment_id (sistema legacy V1)
        - ApartmentAssignment (sistema moderno V2)

        Args:
            employee_id: ID del empleado
            apartment_id: ID del apartamento (None para limpiar)
            start_date: Fecha de inicio de asignación
            monthly_rent: Renta mensual
            action: 'assign' | 'unassign' | 'transfer'

        Returns:
            Empleado actualizado

        Raises:
            HTTPException: Si el empleado no existe
        """
        from fastapi import HTTPException

        employee = self.db.query(Employee).filter(
            and_(
                Employee.id == employee_id,
                Employee.deleted_at.is_(None)
            )
        ).first()

        if not employee:
            raise HTTPException(status_code=404, detail="Empleado no encontrado")

        if action == "assign":
            employee.apartment_id = apartment_id
            employee.apartment_start_date = start_date or date.today()
            employee.apartment_rent = monthly_rent or 0
            employee.apartment_move_out_date = None

        elif action == "unassign":
            employee.apartment_id = None
            employee.apartment_move_out_date = date.today()
            employee.apartment_rent = None

        elif action == "transfer":
            employee.apartment_id = apartment_id
            employee.apartment_start_date = start_date or date.today()
            employee.apartment_rent = monthly_rent or 0

        employee.updated_at = datetime.now()
        self.db.flush()

        return employee

    # -------------------------------------------------------------------------
    # ESTADÍSTICAS
    # -------------------------------------------------------------------------

    async def get_assignment_statistics(
        self,
        period_start: Optional[date] = None,
        period_end: Optional[date] = None,
    ) -> AssignmentStatisticsResponse:
        """
        Obtener estadísticas de asignaciones

        Args:
            period_start: Fecha inicio del período (opcional)
            period_end: Fecha fin del período (opcional)

        Returns:
            Estadísticas de asignaciones
        """
        # Query base
        query = self.db.query(ApartmentAssignment).filter(
            ApartmentAssignment.deleted_at.is_(None)
        )

        # Filtrar por período si se proporciona
        if period_start:
            query = query.filter(ApartmentAssignment.start_date >= period_start)

        if period_end:
            query = query.filter(
                or_(
                    ApartmentAssignment.end_date.is_(None),
                    ApartmentAssignment.end_date <= period_end
                )
            )

        # Ejecutar query para obtener todas las asignaciones
        all_assignments = query.all()

        # Calcular estadísticas con aggregations
        total_assignments = len(all_assignments)

        active_assignments = sum(
            1 for a in all_assignments if a.status == AssignmentStatus.ACTIVE
        )

        completed_assignments = sum(
            1 for a in all_assignments if a.status == AssignmentStatus.ENDED
        )

        cancelled_assignments = sum(
            1 for a in all_assignments if a.status == AssignmentStatus.CANCELLED
        )

        transferred_assignments = sum(
            1 for a in all_assignments if a.status == AssignmentStatus.TRANSFERRED
        )

        # Calcular total de renta cobrada (total_deduction acumulado)
        total_rent_collected = sum(
            a.total_deduction for a in all_assignments if a.total_deduction
        )

        # Calcular renta promedio
        average_rent = 0.0
        if total_assignments > 0:
            average_rent = sum(
                a.monthly_rent for a in all_assignments if a.monthly_rent
            ) / total_assignments

        # Calcular promedio de días de ocupación (solo asignaciones finalizadas)
        ended_assignments = [
            a for a in all_assignments
            if a.end_date is not None
        ]

        average_occupancy_days = 0.0
        if ended_assignments:
            total_days = sum(
                (a.end_date - a.start_date).days + 1
                for a in ended_assignments
            )
            average_occupancy_days = total_days / len(ended_assignments)

        return AssignmentStatisticsResponse(
            total_assignments=total_assignments,
            active_assignments=active_assignments,
            completed_assignments=completed_assignments,
            cancelled_assignments=cancelled_assignments,
            transferred_assignments=transferred_assignments,
            total_rent_collected=total_rent_collected,
            average_rent=round(average_rent, 2),
            average_occupancy_days=round(average_occupancy_days, 2),
            period_start=period_start,
            period_end=period_end,
        )
