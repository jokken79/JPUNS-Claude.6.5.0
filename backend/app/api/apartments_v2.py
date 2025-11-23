"""
Sistema de Gestión de Apartamentos V2.0 (社宅)
==============================================

Sistema completo para gestión de apartamentos corporativos con:
- Cálculos de renta prorrateada
- Cargos adicionales personalizables
- Transferencias entre apartamentos
- Generación de deducciones automáticas
- Reportes y análisis

Autor: Sistema UNS-ClaudeJP
Fecha: 2025-11-10
"""

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session
from sqlalchemy import func, and_, or_
from typing import List, Optional
from datetime import date, datetime, timedelta
from calendar import monthrange

from app.core.database import get_db
from app.api.deps import get_current_user
from app.models.models import User, UserRole
import logging

logger = logging.getLogger(__name__)
from app.schemas.apartment_v2 import (
    # Apartment schemas
    ApartmentCreate,
    ApartmentUpdate,
    ApartmentResponse,
    ApartmentWithStats,
    PaginatedResponse,

    # Assignment schemas
    AssignmentCreate,
    AssignmentResponse,
    AssignmentUpdate,
    AssignmentListItem,
    TransferRequest,
    TransferResponse,

    # Additional charges schemas
    AdditionalChargeCreate,
    AdditionalChargeResponse,
    AdditionalChargeUpdate,

    # Deductions schemas
    DeductionCreate,
    DeductionResponse,
    DeductionListItem,
    DeductionStatusUpdate,

    # Calculation schemas
    ProratedCalculationRequest,
    ProratedCalculationResponse,
    TotalCalculationRequest,
    TotalCalculationResponse,
    CleaningFeeRequest,
    CleaningFeeResponse,

    # Report schemas
    OccupancyReport,
    ArrearsReport,
    MaintenanceReport,
    CostAnalysisReport,
)

from app.services.apartment_service import ApartmentService
from app.services.assignment_service import AssignmentService
from app.services.additional_charge_service import AdditionalChargeService
from app.services.deduction_service import DeductionService
from app.services.report_service import ReportService

# NOTE: Prefix is now empty because this router will be registered at /api/apartments in main.py
# This is the official Apartments API (formerly V2, now the only version)
router = APIRouter(prefix="", tags=["apartments"])


# =============================================================================
# 1. APARTAMENTOS (Gestión básica de inmuebles)
# =============================================================================

@router.get(
    "",
    response_model=PaginatedResponse,
    summary="Lista de apartamentos",
    description="Obtener lista paginada de apartamentos con filtros opcionales"
)
async def list_apartments(
    page: int = Query(1, ge=1, description="Número de página"),
    page_size: int = Query(12, ge=1, le=100, description="Tamaño de página"),
    available_only: bool = Query(False, description="Filtrar solo apartamentos disponibles"),
    search: Optional[str] = Query(None, description="Búsqueda por nombre, dirección o código"),
    min_rent: Optional[int] = Query(None, ge=0, description="Renta mínima"),
    max_rent: Optional[int] = Query(None, ge=0, description="Renta máxima"),
    prefecture: Optional[str] = Query(None, description="Filtrar por prefectura"),
    factory_id: Optional[int] = Query(None, description="Filtrar por ID de fábrica"),
    region_id: Optional[int] = Query(None, description="Filtrar por ID de región"),
    zone: Optional[str] = Query(None, description="Filtrar por zona"),
    has_factory: Optional[bool] = Query(None, description="Filtrar apartamentos con/sin fábrica asignada"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    **Casos de uso:**
    - Listar todos los apartamentos
    - Filtrar por disponibilidad
    - Buscar por texto
    - Filtrar por rango de renta
    - Filtrar por prefectura

    **Ejemplo de uso:**
    ```
    GET /api/apartments?page=1&page_size=12&available_only=true&min_rent=30000&max_rent=70000
    ```
    """
    service = ApartmentService(db)
    return await service.list_apartments_paginated(
        page=page,
        page_size=page_size,
        available_only=available_only,
        search=search,
        min_rent=min_rent,
        max_rent=max_rent,
        prefecture=prefecture,
        factory_id=factory_id,
        region_id=region_id,
        zone=zone,
        has_factory=has_factory
    )


@router.post(
    "",
    response_model=ApartmentResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Crear apartamento",
    description="Crear un nuevo apartamento en el sistema"
)
async def create_apartment(
    apartment: ApartmentCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    **Validaciones:**
    - Código de apartamento único
    - Renta mensual > 0
    - Días en mes válidos (28-31)
    - Cargo de limpieza por defecto >= 0

    **Ejemplo de request:**
    ```json
    {
        "name": "サンシティ A-301",
        "building_name": "サンシティビル",
        "room_number": "A-301",
        "floor_number": 3,
        "postal_code": "100-0001",
        "prefecture": "東京都",
        "city": "千代田区",
        "address_line1": "千代田1-1-1",
        "room_type": "1K",
        "size_sqm": 25.5,
        "base_rent": 50000,
        "management_fee": 5000,
        "deposit": 100000,
        "key_money": 50000,
        "default_cleaning_fee": 20000
    }
    ```
    """
    service = ApartmentService(db)
    return await service.create_apartment(apartment, current_user.id)


@router.get(
    "/{apartment_id}",
    response_model=ApartmentWithStats,
    summary="Detalles de apartamento",
    description="Obtener información completa de un apartamento específico"
)
async def get_apartment(
    apartment_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    **Incluye:**
    - Información básica del apartamento
    - Asignaciones activas
    - Historial de empleados
    - Estadísticas de ocupación
    - Cargos adicionales recientes
    """
    service = ApartmentService(db)
    return await service.get_apartment_with_stats(apartment_id)


@router.put(
    "/{apartment_id}",
    response_model=ApartmentResponse,
    summary="Actualizar apartamento",
    description="Actualizar información de un apartamento existente"
)
async def update_apartment(
    apartment_id: int,
    apartment: ApartmentUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    **Campos actualizables:**
    - Información del apartamento (nombre, dirección, etc.)
    - Precios (renta base, gastos de administración, depósito, key money)
    - Cargo de limpieza por defecto
    - Fechas de contrato
    - Información del propietario
    - Estado (active/inactive)
    """
    service = ApartmentService(db)
    return await service.update_apartment(apartment_id, apartment, current_user.id)


@router.delete(
    "/{apartment_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    summary="Eliminar apartamento",
    description="Eliminar apartamento (soft delete si tiene asignaciones activas)"
)
async def delete_apartment(
    apartment_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    **Comportamiento:**
    - Si no tiene asignaciones: eliminación completa
    - Si tiene asignaciones activas: soft delete
    - Si tiene asignaciones con deduciones pendientes: error 409
    """
    service = ApartmentService(db)
    await service.delete_apartment(apartment_id, current_user.id)
    return None


@router.get(
    "/search/advanced",
    response_model=List[ApartmentResponse],
    summary="Búsqueda avanzada",
    description="Búsqueda avanzada con múltiples filtros combinables"
)
async def search_apartments(
    q: Optional[str] = Query(None, description="Búsqueda de texto libre"),
    capacity_min: Optional[int] = Query(None, ge=1, description="Capacidad mínima"),
    size_min: Optional[float] = Query(None, ge=0, description="Tamaño mínimo en m²"),
    room_types: Optional[List[str]] = Query(None, description="Tipos de habitación (1K, 1DK, 1LDK, etc.)"),
    prefectures: Optional[List[str]] = Query(None, description="Lista de prefecturas"),
    has_management_fee: Optional[bool] = Query(None, description="Tiene gastos de administración"),
    max_total_cost: Optional[int] = Query(None, ge=0, description="Costo total máximo"),
    is_available: Optional[bool] = Query(None, description="Disponibilidad"),
    sort_by: Optional[str] = Query("name", description="Campo de ordenamiento"),
    sort_order: Optional[str] = Query("asc", description="Dirección de ordenamiento (asc/desc)"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    **Filtros combinables:**
    - Búsqueda de texto (nombre, dirección, edificio, etc.)
    - Capacidad y tamaño
    - Tipos de habitación
    - Ubicación (prefecturas)
    - Costos (renta + gastos adicionales)
    - Disponibilidad

    **Ejemplo:**
    ```
    GET /api/apartments/search/advanced?room_types=1K,1DK&prefectures=東京都,神奈川県&max_total_cost=70000
    ```
    """
    service = ApartmentService(db)
    return await service.search_apartments(
        q=q,
        capacity_min=capacity_min,
        size_min=size_min,
        room_types=room_types,
        prefectures=prefectures,
        has_management_fee=has_management_fee,
        max_total_cost=max_total_cost,
        is_available=is_available,
        sort_by=sort_by,
        sort_order=sort_order
    )


# =============================================================================
# 2. ASIGNACIONES (Empleado ↔ Apartamento)
# =============================================================================

@router.post(
    "/assignments",
    response_model=AssignmentResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Asignar empleado",
    description="Asignar un empleado a un apartamento"
)
async def create_assignment(
    assignment: AssignmentCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    **Flujo completo:**
    1. Validar apartamento disponible
    2. Validar empleado activo
    3. Calcular renta prorrateada (si aplica)
    4. Crear asignación en apartment_assignments
    5. Actualizar apartment_id en employees
    6. Generar deducción mensual (si es mes completo)
    7. Retornar cálculo completo

    **Validaciones:**
    - Empleado no asignado a otro apartamento activo
    - Apartamento tiene capacidad disponible
    - Fechas válidas (start_date <= end_date si se proporciona)
    - Monto de renta válido

    **Ejemplo de request:**
    ```json
    {
        "employee_id": 123,
        "apartment_id": 45,
        "start_date": "2025-11-09",
        "end_date": null,
        "monthly_rent": 50000,
        "is_prorated": true,
        "notes": "Entrada a mitad de mes"
    }
    ```
    """
    service = AssignmentService(db)
    return await service.create_assignment(assignment, current_user.id)


@router.get(
    "/assignments",
    response_model=List[AssignmentListItem],
    summary="Listar asignaciones",
    description="Obtener lista paginada de asignaciones con filtros"
)
async def list_assignments(
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=500),
    employee_id: Optional[int] = Query(None, description="Filtrar por empleado"),
    apartment_id: Optional[int] = Query(None, description="Filtrar por apartamento"),
    status_filter: Optional[str] = Query(None, description="Filtrar por estado (active/ended/cancelled)"),
    start_date_from: Optional[date] = Query(None, description="Fecha inicio desde"),
    start_date_to: Optional[date] = Query(None, description="Fecha inicio hasta"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    **Filtros disponibles:**
    - Empleado específico
    - Apartamento específico
    - Estado de la asignación
    - Rango de fechas de inicio

    **Ordenamiento por defecto:** start_date desc
    """
    service = AssignmentService(db)
    return await service.list_assignments(
        skip=skip,
        limit=limit,
        employee_id=employee_id,
        apartment_id=apartment_id,
        status_filter=status_filter,
        start_date_from=start_date_from,
        start_date_to=start_date_to
    )


@router.get(
    "/assignments/{assignment_id}",
    response_model=AssignmentResponse,
    summary="Detalles de asignación",
    description="Obtener información completa de una asignación específica"
)
async def get_assignment(
    assignment_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    **Incluye:**
    - Datos de la asignación
    - Información del empleado
    - Información del apartamento
    - Cargos adicionales asociados
    - Deducciones generadas
    """
    service = AssignmentService(db)
    return await service.get_assignment(assignment_id)


@router.get(
    "/assignments/active",
    response_model=List[AssignmentListItem],
    summary="Asignaciones activas",
    description="Obtener todas las asignaciones actualmente activas"
)
async def get_active_assignments(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    **Casos de uso:**
    - Dashboard de ocupación
    - Reportes de asignaciones vigentes
    - Verificación de disponibilidad
    """
    service = AssignmentService(db)
    return await service.get_active_assignments()


@router.put(
    "/assignments/{assignment_id}/end",
    response_model=AssignmentResponse,
    summary="Finalizar asignación",
    description="Finalizar una asignación (salida del empleado)"
)
async def end_assignment(
    assignment_id: int,
    update: AssignmentUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    **Proceso completo:**
    1. Validar asignación existe y está activa
    2. Calcular días ocupados
    3. Calcular renta prorrateada
    4. Agregar cargo de limpieza (si aplica)
    5. Agregar otros cargos especificados
    6. Actualizar asignación como 'ended'
    7. Generar deducción final
    8. Actualizar empleado (apartment_id = null)

    **Validaciones:**
    - end_date >= start_date
    - end_date no puede ser futura
    - Confirmación de cargo de limpieza

    **Ejemplo de request:**
    ```json
    {
        "end_date": "2025-12-15",
        "include_cleaning_fee": true,
        "cleaning_fee": 20000,
        "additional_charges": [
            {
                "charge_type": "repair",
                "description": "Reparación de pared dañada",
                "amount": 15000
            }
        ],
        "notes": "Salida a mitad de mes con daños"
    }
    ```
    """
    service = AssignmentService(db)
    return await service.end_assignment(assignment_id, update, current_user.id)


@router.post(
    "/assignments/transfer",
    response_model=TransferResponse,
    summary="Transferir empleado",
    description="Transferir empleado de un apartamento a otro (mudanza)"
)
async def transfer_assignment(
    transfer: TransferRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    **Proceso completo (3 pasos atómicos):**

    **Paso 1: Finalizar apartamento actual**
    - Calcular días ocupados hasta fecha de mudanza
    - Calcular renta prorrateada
    - Agregar cargo de limpieza
    - Generar deducción parcial

    **Paso 2: Iniciar nuevo apartamento**
    - Calcular días restantes del mes
    - Calcular renta prorrateada
    - Sin cargo de limpieza
    - Generar deducción parcial

    **Paso 3: Actualizar empleado**
    - Actualizar apartment_id
    - Fechas de mudanza

    **Validaciones:**
    - Empleado tiene asignación activa
    - Nuevo apartamento disponible
    - Fechas válidas (mudanza <= mes actual)
    - Cálculos correctos

    **Ejemplo de request:**
    ```json
    {
        "employee_id": 789,
        "current_apartment_id": 12,
        "new_apartment_id": 34,
        "transfer_date": "2026-01-20",
        "notes": "Mudanza por mejora en ubicación"
    }
    ```

    **Respuesta incluye:**
    - Detalles de ambas asignaciones
    - Cálculo total del mes
    - Breakdown de deducciones
    """
    service = AssignmentService(db)
    return await service.transfer_assignment(transfer, current_user.id)


# =============================================================================
# 3. CÁLCULOS (Prorrateo, limpieza, total)
# =============================================================================

@router.post(
    "/calculate/prorated",
    response_model=ProratedCalculationResponse,
    summary="Calcular renta prorrateada",
    description="Calcular renta prorrateada basada en días ocupados"
)
async def calculate_prorated_rent(
    calculation: ProratedCalculationRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    **Fórmula:**
    ```
    Renta Diaria = Renta Mensual ÷ Días en el Mes
    Renta Prorrateada = Renta Diaria × Días Ocupados
    Redondeo: Al yen más cercano (entero)
    ```

    **Validaciones:**
    - Días en mes válidos (28-31)
    - Días ocupados > 0 y <= días en mes
    - start_date <= end_date

    **Ejemplo de request:**
    ```json
    {
        "monthly_rent": 50000,
        "start_date": "2025-11-09",
        "end_date": "2025-11-30",
        "year": 2025,
        "month": 11
    }
    ```

    **Ejemplo de respuesta:**
    ```json
    {
        "monthly_rent": 50000,
        "year": 2025,
        "month": 11,
        "days_in_month": 30,
        "start_date": "2025-11-09",
        "end_date": "2025-11-30",
        "days_occupied": 22,
        "daily_rate": 1666.67,
        "prorated_rent": 36667,
        "is_prorated": true
    }
    ```
    """
    service = AssignmentService(db)
    return await service.calculate_prorated_rent(calculation)


@router.get(
    "/calculate/cleaning-fee/{apartment_id}",
    response_model=CleaningFeeResponse,
    summary="Obtener cargo de limpieza",
    description="Obtener el cargo de limpieza configurado para un apartamento"
)
async def get_cleaning_fee(
    apartment_id: int,
    custom_amount: Optional[int] = Query(None, description="Sobrescribir monto por defecto"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    **Casos de uso:**
    - Consultar cargo estándar de un apartamento
    - Verificar monto antes de finalizar asignación
    - Calcular costo total de salida

    **Respuesta incluye:**
    - Monto por defecto del apartamento
    - Monto solicitado (si se sobrescribe)
    - Validación del monto
    """
    service = ApartmentService(db)
    return await service.get_cleaning_fee(apartment_id, custom_amount)


@router.post(
    "/calculate/total",
    response_model=TotalCalculationResponse,
    summary="Calcular deducción total",
    description="Calcular deducción total (renta + cargos adicionales)"
)
async def calculate_total_deduction(
    calculation: TotalCalculationRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    **Fórmula:**
    ```
    Total = Renta (prorrateada o completa) + Σ(Cargos Adicionales)
    ```

    **Validaciones:**
    - Montos >= 0
    - Tipos de cargo válidos
    - Fechas válidas

    **Ejemplo de request:**
    ```json
    {
        "base_rent": 29032,
        "is_prorated": true,
        "additional_charges": [
            {
                "charge_type": "cleaning",
                "amount": 20000
            },
            {
                "charge_type": "repair",
                "amount": 15000
            }
        ]
    }
    ```

    **Ejemplo de respuesta:**
    ```json
    {
        "base_rent": 29032,
        "additional_charges_total": 35000,
        "total_deduction": 64032,
        "breakdown": [
            {"type": "rent", "amount": 29032, "description": "Renta prorrateada"},
            {"type": "cleaning", "amount": 20000, "description": "Limpieza"},
            {"type": "repair", "amount": 15000, "description": "Reparación"}
        ]
    }
    ```
    """
    service = AssignmentService(db)
    return await service.calculate_total_deduction(calculation)


# =============================================================================
# 4. CARGOS ADICIONALES (Reparaciones, limpieza, etc.)
# =============================================================================

@router.post(
    "/charges",
    response_model=AdditionalChargeResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Agregar cargo adicional",
    description="Agregar un cargo adicional a una asignación"
)
async def create_additional_charge(
    charge: AdditionalChargeCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    **Tipos de cargo soportados:**
    - `cleaning`: Limpieza al salir
    - `repair`: Reparaciones y daños
    - `deposit`: Depósito de seguridad
    - `penalty`: Multas y penalizaciones
    - `other`: Otros cargos

    **Estados:**
    - `pending`: Creado, pendiente de aprobación
    - `approved`: Aprobado por usuario autorizado
    - `cancelled`: Cancelado
    - `paid`: Pagado (incluido en deducción)

    **Validaciones:**
    - Asignación existe y está activa
    - Monto > 0
    - Tipo de cargo válido
    - Fecha no futura

    **Permisos:**
    - COORDINATOR+: Crear cargos pending
    - ADMIN+: Aprobar cargos
    """
    service = AdditionalChargeService(db)
    return await service.create_additional_charge(charge, current_user.id)


@router.get(
    "/charges",
    response_model=List[AdditionalChargeResponse],
    summary="Listar cargos adicionales",
    description="Obtener lista de cargos con filtros opcionales"
)
async def list_additional_charges(
    assignment_id: Optional[int] = Query(None, description="Filtrar por asignación"),
    employee_id: Optional[int] = Query(None, description="Filtrar por empleado"),
    apartment_id: Optional[int] = Query(None, description="Filtrar por apartamento"),
    charge_type: Optional[str] = Query(None, description="Filtrar por tipo de cargo"),
    status: Optional[str] = Query(None, description="Filtrar por estado"),
    date_from: Optional[date] = Query(None, description="Fecha desde"),
    date_to: Optional[date] = Query(None, description="Fecha hasta"),
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=500),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    **Filtros combinables:**
    - Por asignación específica
    - Por empleado
    - Por apartamento
    - Por tipo de cargo
    - Por estado
    - Por rango de fechas

    **Ordenamiento:** charge_date desc
    """
    service = AdditionalChargeService(db)
    return await service.list_additional_charges(
        assignment_id=assignment_id,
        employee_id=employee_id,
        apartment_id=apartment_id,
        charge_type=charge_type,
        status=status,
        date_from=date_from,
        date_to=date_to,
        skip=skip,
        limit=limit
    )


@router.get(
    "/charges/{charge_id}",
    response_model=AdditionalChargeResponse,
    summary="Detalles de cargo",
    description="Obtener información de un cargo adicional específico"
)
async def get_additional_charge(
    charge_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    **Incluye:**
    - Información del cargo
    - Detalles de la asignación
    - Información del empleado
    - Datos de aprobación (si aplica)
    """
    service = AdditionalChargeService(db)
    return await service.get_additional_charge(charge_id)


@router.put(
    "/charges/{charge_id}/approve",
    response_model=AdditionalChargeResponse,
    summary="Aprobar cargo",
    description="Aprobar un cargo adicional (requiere permisos de admin)"
)
async def approve_additional_charge(
    charge_id: int,
    update: AdditionalChargeUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    **Permisos requeridos:**
    - ADMIN o superior

    **Estados válidos:**
    - pending → approved
    - approved → pending (revertir)

    **Ejemplo de request:**
    ```json
    {
        "status": "approved",
        "notes": "Aprobado - daño verificado por gerente de propiedad"
    }
    ```
    """
    service = AdditionalChargeService(db)
    return await service.approve_additional_charge(charge_id, update, current_user)


@router.put(
    "/charges/{charge_id}/cancel",
    response_model=AdditionalChargeResponse,
    summary="Cancelar cargo",
    description="Cancelar un cargo adicional"
)
async def cancel_additional_charge(
    charge_id: int,
    update: AdditionalChargeUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    **Estados válidos:**
    - pending → cancelled
    - approved → cancelled (requiere permisos altos)

    **Validaciones:**
    - Cargo no pagado aún
    - Confirmación de cancelación
    """
    service = AdditionalChargeService(db)
    return await service.cancel_additional_charge(charge_id, update, current_user.id)


@router.delete(
    "/charges/{charge_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    summary="Eliminar cargo",
    description="Eliminar un cargo adicional (solo si está pendiente)"
)
async def delete_additional_charge(
    charge_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    **Solo para cargos pending**
    - No se pueden eliminar cargos approved
    - Para approved, usar cancelación

    **Permisos:**
    - Creador del cargo
    - ADMIN+
    """
    service = AdditionalChargeService(db)
    await service.delete_additional_charge(charge_id, current_user.id)
    return None


# =============================================================================
# 5. DEDUCCIONES (Nómina y pagos)
# =============================================================================

@router.get(
    "/deductions/{year}/{month}",
    response_model=List[DeductionListItem],
    summary="Deducciones del mes",
    description="Obtener todas las deducciones de renta para un mes específico"
)
async def get_monthly_deductions(
    year: int,
    month: int,
    apartment_id: Optional[int] = Query(None, description="Filtrar por apartamento"),
    employee_id: Optional[int] = Query(None, description="Filtrar por empleado"),
    status: Optional[str] = Query(None, description="Filtrar por estado"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    **Validaciones de entrada:**
    - year entre 2020-2030
    - month entre 1-12

    **Estados de deducción:**
    - `pending`: Generada, pendiente de procesamiento
    - `processed`: Procesada para nómina
    - `paid`: Confirmada como pagada
    - `cancelled`: Cancelada

    **Filtros:**
    - Apartamento específico
    - Empleado específico
    - Estado específico

    **Ejemplo de uso:**
    ```
    GET /api/apartments/deductions/2025/12?status=pending
    ```
    """
    service = DeductionService(db)
    return await service.get_monthly_deductions(
        year=year,
        month=month,
        apartment_id=apartment_id,
        employee_id=employee_id,
        status=status
    )


@router.post(
    "/deductions/generate",
    response_model=List[DeductionResponse],
    status_code=status.HTTP_201_CREATED,
    summary="Generar deducciones automáticas",
    description="Generar deducciones automáticas para el mes especificado"
)
async def generate_monthly_deductions(
    year: int,
    month: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    **Proceso automático:**
    1. Buscar asignaciones activas en el mes
    2. Para cada asignación:
       - Calcular días ocupados
       - Calcular renta prorrateada
       - Sumar cargos adicionales approved
       - Generar deducción
    3. Evitar duplicados (usar UNIQUE constraint)

    **Reglas:**
    - Solo asignaciones con deducción pendiente para ese mes
    - Asignaciones que empiecen o terminen en el mes
    - Asignaciones completas del mes

    **Respuesta incluye:**
    - Lista de deducciones generadas
    - Total a descontar en el mes
    - Breakdown por apartamento/empleado

    **Permisos:**
    - COORDINATOR+ (para generar)
    - ADMIN+ (para sobreescribir si ya existen)
    """
    service = DeductionService(db)
    return await service.generate_monthly_deductions(year, month, current_user.id)


@router.get(
    "/deductions/export/{year}/{month}",
    summary="Exportar deducciones a Excel",
    description="Exportar deducciones del mes a archivo Excel"
)
async def export_deductions_excel(
    year: int,
    month: int,
    apartment_id: Optional[int] = Query(None),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    **Formato Excel incluye:**
    - Datos del empleado (ID, nombre, kanji, kana)
    - Datos del apartamento (código, dirección, renta)
    - Cálculos (renta base, cargos, total)
    - Fechas (inicio, fin, días ocupados)
    - Estado de la deducción
    - Notas

    **Columnas del Excel:**
    ```
    A: Empleado ID
    B: Nombre Kanji
    C: Nombre Kana
    D: Apartamento Código
    E: Apartamento Dirección
    F: Renta Base
    G: Cargos Adicionales
    H: Total Deducción
    I: Días Ocupados
    J: Fecha Inicio
    K: Fecha Fin
    L: Estado
    M: Notas
    ```

    **Permisos:**
    - ADMIN+ (exportar datos sensibles)
    """
    service = DeductionService(db)
    return await service.export_deductions_excel(year, month, apartment_id, current_user.id)


@router.put(
    "/deductions/{deduction_id}/status",
    response_model=DeductionResponse,
    summary="Actualizar estado de deducción",
    description="Marcar deducción como procesada o pagada"
)
async def update_deduction_status(
    deduction_id: int,
    update: DeductionStatusUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    **Estados válidos:**
    - pending → processed
    - processed → paid
    - paid → processed (revertir)
    - pending → cancelled

    **Validaciones:**
    - No saltar estados (pending → paid no válido)
    - Confirmación para marcar como pagado
    - Usuario autorizado

    **Ejemplo de request:**
    ```json
    {
        "status": "processed",
        "processed_date": "2025-12-31",
        "notes": "Procesado para nómina de diciembre"
    }
    ```

    **Permisos:**
    - COORDINATOR+ (marcar como processed)
    - ADMIN+ (marcar como paid)
    """
    service = DeductionService(db)
    return await service.update_deduction_status(deduction_id, update, current_user.id)


@router.get(
    "/deductions/{deduction_id}",
    response_model=DeductionResponse,
    summary="Detalles de deducción",
    description="Obtener información completa de una deducción específica"
)
async def get_deduction(
    deduction_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    **Incluye:**
    - Datos de la deducción
    - Asignación relacionada
    - Empleado y apartamento
    - Breakdown de cargos
    - Historial de cambios de estado
    """
    service = DeductionService(db)
    return await service.get_deduction(deduction_id)


# =============================================================================
# 6. REPORTES Y ANÁLISIS
# =============================================================================

@router.get(
    "/reports/occupancy",
    response_model=OccupancyReport,
    summary="Reporte de ocupación",
    description="Obtener estadísticas de ocupación de apartamentos"
)
async def get_occupancy_report(
    prefecture: Optional[str] = Query(None, description="Filtrar por prefectura"),
    building_name: Optional[str] = Query(None, description="Filtrar por edificio"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    **Métricas incluidas:**
    - Total de apartamentos
    - Apartamentos ocupados/vacantes
    - Tasa de ocupación global (%)
    - Capacidad total vs utilizada
    - Promedio de ocupación por edificio
    - Días promedio de ocupación

    **Desglose por:**
    - Prefectura
    - Edificio
    - Tipo de habitación
    - Rango de renta

    **Ejemplo de respuesta:**
    ```json
    {
        "total_apartments": 150,
        "occupied_apartments": 128,
        "vacant_apartments": 22,
        "occupancy_rate": 85.33,
        "total_capacity": 450,
        "occupied_beds": 385,
        "utilization_rate": 85.56,
        "average_occupancy_per_building": 87.2,
        "breakdown_by_prefecture": {...},
        "breakdown_by_room_type": {...}
    }
    ```
    """
    service = ReportService(db)
    return service.get_occupancy_report(prefecture, building_name)


@router.get(
    "/reports/arrears",
    response_model=dict,
    summary="Reporte de pagos pendientes",
    description="Obtener reporte de deducciones y pagos pendientes"
)
async def get_arrears_report(
    year: int = Query(..., ge=2020, le=2100, description="Año del reporte"),
    month: int = Query(..., ge=1, le=12, description="Mes (1-12)"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
) -> dict:
    """
    Obtener reporte de pagos pendientes por mes

    Muestra:
    - Total esperado, pagado, pendiente
    - Tasa de cobranza
    - Tendencias mensuales (últimos 6 meses)
    - Top deudores
    - Desglose por apartamento

    **Roles requeridos:** ADMIN, COORDINATOR

    **Parámetros:**
    - year: Año del reporte (ej: 2025)
    - month: Mes del reporte (1-12)

    **Respuesta:**
    ```json
    {
      "summary": {
        "total_expected": 1200000,
        "total_paid": 800000,
        "total_pending": 400000,
        "collection_rate": 66.67
      },
      "monthly_trends": [...],
      "by_status": [...],
      "top_debtors": [...],
      "by_apartment": [...]
    }
    ```

    **Métricas incluidas:**
    - Total a cobrar en el mes
    - Total cobrado
    - Total pendiente
    - Número de empleados con adeudos
    - Promedio de adeudo por empleado
    - Deducciones vencidas (>30 días)

    **Desglose por:**
    - Estado (pending/processed/paid)
    - Apartamento
    - Empleado

    **Casos de uso:**
    - Seguimiento de cobranza
    - Identificar empleados con problemas de pago
    - Reportes para contabilidad
    """
    # Validar rol
    if current_user.role not in [UserRole.ADMIN, UserRole.COORDINATOR]:
        raise HTTPException(status_code=403, detail="Access denied")

    # Validar año/mes
    if year < 2020 or year > 2100:
        raise HTTPException(status_code=400, detail="Year must be between 2020-2100")
    if month < 1 or month > 12:
        raise HTTPException(status_code=400, detail="Month must be between 1-12")

    # Obtener reporte
    service = ReportService(db)
    report = service.get_arrears_report(year, month)

    logger.info(f"Arrears report generated for {year}-{month:02d} by user {current_user.id}")

    return report


@router.get(
    "/reports/maintenance",
    response_model=dict,
    summary="Reporte de mantenimiento",
    description="Obtener estado de mantenimiento de apartamentos"
)
async def get_maintenance_report(
    period: str = Query("6months", description="Período: 3months, 6months, 1year"),
    charge_type: Optional[str] = Query(None, description="Filtrar por tipo: cleaning, repair, deposit, penalty, other"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
) -> dict:
    """
    Obtener reporte de mantenimiento e incidentes

    Muestra:
    - Total de cargos, costo total, promedio por apartamento
    - Distribución por tipo (limpieza, reparación, etc.)
    - Tendencia mensual de costos
    - Top 10 apartamentos con más problemas
    - Incidentes recientes

    **Roles requeridos:** ADMIN, COORDINATOR

    **Parámetros:**
    - period: Rango de tiempo (3months, 6months, 1year)
    - charge_type: Filtrar por tipo de cargo (opcional)

    **Respuesta:**
    ```json
    {
      "summary": {
        "total_charges": 45,
        "total_cost": 850000,
        "average_cost_per_apartment": 35416
      },
      "by_charge_type": [...],
      "monthly_trends": [...],
      "top_apartments": [...],
      "recent_incidents": [...]
    }
    ```

    **Métricas incluidas:**
    - Total de cargos de mantenimiento
    - Desglose por tipo (limpieza, reparación, otros)
    - Promedio de costo por categoría
    - Tendencias mensuales
    - Apartamentos con más incidentes

    **Filtros disponibles:**
    - Por tipo de cargo
    - Por rango de fechas
    - Por apartamento

    **Casos de uso:**
    - Análisis de costos de mantenimiento
    - Identificar apartamentos problemáticos
    - Planificar presupuesto
    """
    # Validar rol
    if current_user.role not in [UserRole.ADMIN, UserRole.COORDINATOR]:
        raise HTTPException(status_code=403, detail="Access denied")

    # Validar período
    valid_periods = ["3months", "6months", "1year"]
    if period not in valid_periods:
        raise HTTPException(
            status_code=400,
            detail=f"Period must be one of: {', '.join(valid_periods)}"
        )

    # Validar charge_type si se proporciona
    if charge_type:
        valid_types = ["cleaning", "repair", "deposit", "penalty", "key_replacement", "other"]
        if charge_type not in valid_types:
            raise HTTPException(
                status_code=400,
                detail=f"Charge type must be one of: {', '.join(valid_types)}"
            )

    # Obtener reporte
    service = ReportService(db)
    report = service.get_maintenance_report()

    # Si se especificó charge_type, filtrar resultados
    if charge_type:
        # Filtrar by_charge_type para mostrar solo el solicitado
        if "by_charge_type" in report and isinstance(report["by_charge_type"], dict):
            # Si es un diccionario, filtrar por clave
            filtered_by_type = {k: v for k, v in report["by_charge_type"].items() if k == charge_type}
            report["by_charge_type"] = filtered_by_type

    logger.info(f"Maintenance report generated (period={period}, charge_type={charge_type}) by user {current_user.id}")

    return report


@router.get(
    "/reports/costs",
    response_model=CostAnalysisReport,
    summary="Análisis de costos",
    description="Obtener análisis completo de costos del sistema de apartamentos"
)
async def get_cost_analysis_report(
    year: int,
    month: Optional[int] = Query(None, description="Mes específico (opcional)"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    **Análisis de costos incluye:**

    **1. Costos totales:**
    - Renta pagada a propietarios
    - Gastos de administración
    - Costos de mantenimiento
    - Otros gastos operativos

    **2. Deducciones por empleado:**
    - Total recaudado por rentas
    - Total de cargos adicionales
    - Efectividad de cobranza

    **3. Análisis de rentabilidad:**
    - Margen de ganancia (si aplica)
    - Costo promedio por apartamento
    - Comparativo mes anterior

    **4. Proyecciones:**
    - Proyección de ingresos
    - Estimación de gastos futuros
    - Recomendaciones

    **Casos de uso:**
    - Análisis financiero
    - Planificación presupuestaria
    - Decisiones estratégicas
    - Reportes para dirección

    **Permisos:**
    - ADMIN+ (información financiera)
    """
    service = ReportService(db)
    return service.get_cost_analysis_report(year, month)
