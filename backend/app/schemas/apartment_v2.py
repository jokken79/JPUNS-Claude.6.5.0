"""
Schemas Pydantic para Sistema de Apartamentos V2.0
==================================================

Schemas para todas las entidades del sistema de gestión de apartamentos:
- Apartamentos
- Asignaciones
- Cargos adicionales
- Deducciones
- Cálculos
- Reportes
"""

from pydantic import BaseModel, Field, validator, ConfigDict
from datetime import datetime, date
from typing import Optional, List, Union
from decimal import Decimal
from enum import Enum


# =============================================================================
# ENUMS
# =============================================================================

class RoomType(str, Enum):
    """Tipos de habitación disponibles en apartamentos japoneses"""
    R = "R"  # Room (1K, 1DK, 1LDK, etc.)
    K = "K"  # Kitchen
    DK = "DK"  # Dining Kitchen
    LDK = "LDK"  # Living Dining Kitchen
    S = "S"  # Single room


class ChargeType(str, Enum):
    """Tipos de cargos adicionales"""
    CLEANING = "cleaning"
    REPAIR = "repair"
    DEPOSIT = "deposit"
    PENALTY = "penalty"
    OTHER = "other"


class AssignmentStatus(str, Enum):
    """Estados de asignación"""
    ACTIVE = "active"
    ENDED = "ended"
    CANCELLED = "cancelled"


class DeductionStatus(str, Enum):
    """Estados de deducción"""
    PENDING = "pending"
    PROCESSED = "processed"
    PAID = "paid"
    CANCELLED = "cancelled"


class ChargeStatus(str, Enum):
    """Estados de cargo adicional"""
    PENDING = "pending"
    APPROVED = "approved"
    CANCELLED = "cancelled"
    PAID = "paid"


class SortOrder(str, Enum):
    """Órdenes de ordenamiento"""
    ASC = "asc"
    DESC = "desc"


# =============================================================================
# APARTAMENTO SCHEMAS
# =============================================================================

class ApartmentBase(BaseModel):
    """Base schema para apartamento"""
    name: str = Field(..., min_length=1, max_length=200, description="Nombre del apartamento")
    building_name: Optional[str] = Field(None, max_length=200, description="Nombre del edificio")
    room_number: Optional[str] = Field(None, max_length=20, description="Número de habitación")
    floor_number: Optional[int] = Field(None, ge=0, description="Número de piso")
    postal_code: Optional[str] = Field(None, max_length=10, description="Código postal")
    prefecture: Optional[str] = Field(None, max_length=50, description="Prefectura")
    city: Optional[str] = Field(None, max_length=100, description="Ciudad")
    address_line1: Optional[str] = Field(None, max_length=200, description="Dirección línea 1")
    address_line2: Optional[str] = Field(None, max_length=200, description="Dirección línea 2")
    room_type: Optional[RoomType] = Field(None, description="Tipo de habitación")
    size_sqm: Optional[Decimal] = Field(None, ge=0, description="Tamaño en metros cuadrados")

    # Tipo de propiedad
    property_type: Optional[str] = Field(None, max_length=50, description="Tipo de propiedad (Casa, Edificio, Apartamento)")

    # Precios
    base_rent: int = Field(..., ge=0, description="Renta base mensual (en yenes)")
    management_fee: int = Field(default=0, ge=0, description="Gastos de administración")
    deposit: int = Field(default=0, ge=0, description="Depósito (敷金)")
    key_money: int = Field(default=0, ge=0, description="Key money (礼金)")

    # Cargos configurables
    default_cleaning_fee: int = Field(default=20000, ge=0, description="Cargo de limpieza por defecto")
    parking_spaces: Optional[int] = Field(None, ge=0, description="Número de estacionamientos")
    parking_price_per_unit: Optional[int] = Field(None, ge=0, description="Precio por estacionamiento (en yenes)")
    initial_plus: Optional[int] = Field(default=5000, ge=0, description="Plus adicional (gastos iniciales)")

    # Contrato con propietario
    contract_start_date: Optional[date] = Field(None, description="Inicio de contrato")
    contract_end_date: Optional[date] = Field(None, description="Fin de contrato")
    landlord_name: Optional[str] = Field(None, max_length=200, description="Nombre del propietario")
    landlord_contact: Optional[str] = Field(None, max_length=200, description="Contacto del propietario")
    real_estate_agency: Optional[str] = Field(None, max_length=200, description="Inmobiliaria")
    emergency_contact: Optional[str] = Field(None, max_length=200, description="Contacto de emergencia")

    notes: Optional[str] = Field(None, description="Notas adicionales")
    status: str = Field(default="active", description="Estado del apartamento")

    @validator("contract_end_date")
    def validate_contract_dates(cls, v, values):
        if v and "contract_start_date" in values and values["contract_start_date"]:
            if v < values["contract_start_date"]:
                raise ValueError("Fecha fin debe ser posterior a fecha inicio")
        return v


class ApartmentCreate(ApartmentBase):
    """Schema para crear apartamento"""
    pass


class ApartmentUpdate(BaseModel):
    """Schema para actualizar apartamento (todos los campos opcionales)"""
    name: Optional[str] = Field(None, min_length=1, max_length=200)
    building_name: Optional[str] = Field(None, max_length=200)
    room_number: Optional[str] = Field(None, max_length=20)
    floor_number: Optional[int] = Field(None, ge=0)
    postal_code: Optional[str] = Field(None, max_length=10)
    prefecture: Optional[str] = Field(None, max_length=50)
    city: Optional[str] = Field(None, max_length=100)
    address_line1: Optional[str] = Field(None, max_length=200)
    address_line2: Optional[str] = Field(None, max_length=200)
    room_type: Optional[RoomType] = None
    size_sqm: Optional[Decimal] = Field(None, ge=0)

    base_rent: Optional[int] = Field(None, ge=0)
    management_fee: Optional[int] = Field(None, ge=0)
    deposit: Optional[int] = Field(None, ge=0)
    key_money: Optional[int] = Field(None, ge=0)
    default_cleaning_fee: Optional[int] = Field(None, ge=0)
    parking_spaces: Optional[int] = Field(None, ge=0)
    parking_price_per_unit: Optional[int] = Field(None, ge=0)
    initial_plus: Optional[int] = Field(None, ge=0)

    contract_start_date: Optional[date] = None
    contract_end_date: Optional[date] = None
    landlord_name: Optional[str] = Field(None, max_length=200)
    landlord_contact: Optional[str] = Field(None, max_length=200)
    real_estate_agency: Optional[str] = Field(None, max_length=200)
    emergency_contact: Optional[str] = Field(None, max_length=200)

    notes: Optional[str] = None
    status: Optional[str] = None


class ApartmentResponse(BaseModel):
    """Schema de respuesta para apartamento"""
    model_config = ConfigDict(from_attributes=True)

    id: int
    name: str
    building_name: Optional[str]
    room_number: Optional[str]
    floor_number: Optional[int]
    postal_code: Optional[str]
    prefecture: Optional[str]
    city: Optional[str]
    address_line1: Optional[str]
    address_line2: Optional[str]
    room_type: Optional[RoomType]
    size_sqm: Optional[Decimal]

    base_rent: int
    management_fee: Optional[int] = 0
    deposit: Optional[int] = 0
    key_money: Optional[int] = 0
    default_cleaning_fee: Optional[int] = 20000
    parking_spaces: Optional[int] = None
    parking_price_per_unit: Optional[int] = None
    initial_plus: Optional[int] = None

    contract_start_date: Optional[date]
    contract_end_date: Optional[date]
    landlord_name: Optional[str]
    landlord_contact: Optional[str]
    real_estate_agency: Optional[str]
    emergency_contact: Optional[str]

    notes: Optional[str]
    status: Optional[str] = "active"
    created_at: datetime
    updated_at: Optional[datetime]

    # Campos calculados
    full_address: Optional[str] = Field(None, description="Dirección completa concatenada")
    total_monthly_cost: int = Field(None, description="Costo total mensual")
    active_assignments: int = Field(default=0, description="Asignaciones activas")


class ApartmentWithStats(ApartmentResponse):
    """Apartamento con estadísticas detalladas"""
    current_occupancy: int = Field(default=0, description="Ocupación actual")
    max_occupancy: int = Field(default=1, description="Capacidad máxima")
    occupancy_rate: float = Field(default=0.0, description="Tasa de ocupación (%)")
    is_available: bool = Field(default=True, description="Disponible para asignación")
    last_assignment_date: Optional[date] = Field(None, description="Fecha de última asignación")
    average_stay_duration: Optional[int] = Field(None, description="Duración promedio de estancia (días)")


# =============================================================================
# ASIGNACIÓN SCHEMAS
# =============================================================================

class AssignmentBase(BaseModel):
    """Base schema para asignación"""
    apartment_id: int = Field(..., description="ID del apartamento")
    employee_id: int = Field(..., description="ID del empleado")
    start_date: date = Field(..., description="Fecha de inicio")
    end_date: Optional[date] = Field(None, description="Fecha de fin (NULL si activa)")

    # Cálculos
    monthly_rent: int = Field(..., ge=0, description="Renta mensual")
    days_in_month: int = Field(..., ge=28, le=31, description="Días en el mes")
    days_occupied: int = Field(..., ge=1, le=31, description="Días ocupados")
    prorated_rent: int = Field(..., ge=0, description="Renta prorrateada")
    is_prorated: bool = Field(default=False, description="¿Es prorrateo?")
    total_deduction: int = Field(..., ge=0, description="Total a descontar")

    # Parking payment responsibility
    pays_parking: bool = Field(default=False, description="¿Paga estacionamiento?")

    # Metadata
    contract_type: Optional[str] = Field(None, max_length=50, description="Tipo de contrato")
    notes: Optional[str] = Field(None, description="Notas de la asignación")
    status: AssignmentStatus = Field(default=AssignmentStatus.ACTIVE, description="Estado")


class AssignmentCreate(AssignmentBase):
    """Schema para crear asignación"""
    pass


class AssignmentUpdate(BaseModel):
    """Schema para actualizar/finalizar asignación"""
    end_date: Optional[date] = Field(None, description="Fecha de fin")
    days_occupied: Optional[int] = Field(None, ge=1, le=31)
    prorated_rent: Optional[int] = Field(None, ge=0)
    total_deduction: Optional[int] = Field(None, ge=0)
    include_cleaning_fee: bool = Field(default=True, description="Incluir cargo de limpieza")
    cleaning_fee: Optional[int] = Field(None, ge=0, description="Monto de limpieza personalizado")
    additional_charges: Optional[List[dict]] = Field(None, description="Cargos adicionales a agregar")
    notes: Optional[str] = None
    status: Optional[AssignmentStatus] = None


class AssignmentResponse(BaseModel):
    """Schema de respuesta para asignación"""
    model_config = ConfigDict(from_attributes=True)

    id: int
    apartment_id: int
    employee_id: int
    start_date: date
    end_date: Optional[date]

    monthly_rent: int
    days_in_month: int
    days_occupied: int
    prorated_rent: int
    is_prorated: bool
    total_deduction: int
    pays_parking: bool

    contract_type: Optional[str]
    notes: Optional[str]
    status: AssignmentStatus
    created_at: datetime
    updated_at: Optional[datetime]

    # Datos relacionados (lazy loaded)
    apartment: Optional[ApartmentResponse] = None
    employee: Optional[dict] = None
    additional_charges: Optional[List['AdditionalChargeResponse']] = None
    deductions: Optional[List['DeductionResponse']] = None


class AssignmentListItem(BaseModel):
    """Item de lista para asignaciones (resumen)"""
    model_config = ConfigDict(from_attributes=True)

    id: int
    apartment_id: int
    employee_id: int
    start_date: date
    end_date: Optional[date]
    status: AssignmentStatus
    total_deduction: int
    created_at: datetime

    # Datos relacionados (solo campos necesarios)
    apartment_name: str = Field(..., description="Nombre del apartamento")
    apartment_code: Optional[str] = Field(None, description="Código del apartamento")
    employee_name_kanji: str = Field(..., description="Nombre del empleado (kanji)")
    employee_name_kana: Optional[str] = Field(None, description="Nombre del empleado (kana)")


# =============================================================================
# TRANSFERENCIA SCHEMAS
# =============================================================================

class TransferRequest(BaseModel):
    """Schema para solicitar transferencia de apartamento"""
    employee_id: int = Field(..., description="ID del empleado")
    current_apartment_id: int = Field(..., description="ID del apartamento actual")
    new_apartment_id: int = Field(..., description="ID del nuevo apartamento")
    transfer_date: date = Field(..., description="Fecha de mudanza")
    notes: Optional[str] = Field(None, description="Notas de la transferencia")


class TransferResponse(BaseModel):
    """Schema de respuesta para transferencia"""
    # Asignación finalizada (apartamento actual)
    ended_assignment: AssignmentResponse

    # Asignación creada (nuevo apartamento)
    new_assignment: AssignmentResponse

    # Cálculos
    old_apartment_cost: int = Field(..., description="Costo apartamento actual (prorrateado + limpieza)")
    new_apartment_cost: int = Field(..., description="Costo nuevo apartamento (prorrateado)")
    total_monthly_cost: int = Field(..., description="Total a descontar en el mes")

    # Breakdown
    breakdown: dict = Field(..., description="Desglose detallado de costos")


# =============================================================================
# CARGOS ADICIONALES SCHEMAS
# =============================================================================

class AdditionalChargeBase(BaseModel):
    """Base schema para cargo adicional"""
    assignment_id: int = Field(..., description="ID de la asignación")
    employee_id: int = Field(..., description="ID del empleado")
    apartment_id: int = Field(..., description="ID del apartamento")

    charge_type: ChargeType = Field(..., description="Tipo de cargo")
    description: str = Field(..., min_length=1, max_length=500, description="Descripción del cargo")
    amount: int = Field(..., ge=0, description="Monto del cargo")

    charge_date: date = Field(..., description="Fecha del cargo")
    status: ChargeStatus = Field(default=ChargeStatus.PENDING, description="Estado del cargo")

    notes: Optional[str] = Field(None, description="Notas adicionales")


class AdditionalChargeCreate(AdditionalChargeBase):
    """Schema para crear cargo adicional"""
    pass


class AdditionalChargeUpdate(BaseModel):
    """Schema para actualizar cargo adicional"""
    description: Optional[str] = Field(None, min_length=1, max_length=500)
    amount: Optional[int] = Field(None, ge=0)
    status: Optional[ChargeStatus] = None
    notes: Optional[str] = None


class AdditionalChargeResponse(BaseModel):
    """Schema de respuesta para cargo adicional"""
    model_config = ConfigDict(from_attributes=True)

    id: int
    assignment_id: int
    employee_id: int
    apartment_id: int

    charge_type: ChargeType
    description: str
    amount: int
    charge_date: date
    status: ChargeStatus

    approved_by: Optional[int] = Field(None, description="ID del usuario que aprobó")
    approved_at: Optional[datetime] = Field(None, description="Fecha de aprobación")
    notes: Optional[str]

    created_at: datetime
    updated_at: Optional[datetime]

    # Datos relacionados
    employee_name: Optional[str] = Field(None, description="Nombre del empleado")
    apartment_name: Optional[str] = Field(None, description="Nombre del apartamento")
    approver_name: Optional[str] = Field(None, description="Nombre de quien aprobó")


# =============================================================================
# DEDUCCIONES SCHEMAS
# =============================================================================

class DeductionBase(BaseModel):
    """Base schema para deducción"""
    assignment_id: int = Field(..., description="ID de la asignación")
    employee_id: int = Field(..., description="ID del empleado")
    apartment_id: int = Field(..., description="ID del apartamento")

    year: int = Field(..., ge=2020, le=2030, description="Año")
    month: int = Field(..., ge=1, le=12, description="Mes")

    base_rent: int = Field(..., ge=0, description="Renta base o prorrateada")
    additional_charges: int = Field(default=0, ge=0, description="Suma de cargos adicionales")
    total_deduction: int = Field(..., ge=0, description="Total a descontar")

    status: DeductionStatus = Field(default=DeductionStatus.PENDING, description="Estado")
    processed_date: Optional[date] = Field(None, description="Fecha de procesamiento")
    paid_date: Optional[date] = Field(None, description="Fecha de pago")

    notes: Optional[str] = Field(None, description="Notas adicionales")


class DeductionCreate(DeductionBase):
    """Schema para crear deducción"""
    pass


class DeductionStatusUpdate(BaseModel):
    """Schema para actualizar estado de deducción"""
    status: DeductionStatus = Field(..., description="Nuevo estado")
    processed_date: Optional[date] = Field(None, description="Fecha de procesamiento")
    paid_date: Optional[date] = Field(None, description="Fecha de pago")
    notes: Optional[str] = None


class DeductionResponse(BaseModel):
    """Schema de respuesta para deducción"""
    model_config = ConfigDict(from_attributes=True)

    id: int
    assignment_id: int
    employee_id: int
    apartment_id: int

    year: int
    month: int
    base_rent: int
    additional_charges: int
    total_deduction: int

    status: DeductionStatus
    processed_date: Optional[date]
    paid_date: Optional[date]
    notes: Optional[str]

    created_at: datetime
    updated_at: Optional[datetime]

    # Datos relacionados
    employee_name: Optional[str] = Field(None, description="Nombre del empleado")
    apartment_name: Optional[str] = Field(None, description="Nombre del apartamento")
    assignment_dates: Optional[dict] = Field(None, description="Fechas de asignación")


class DeductionListItem(BaseModel):
    """Item de lista para deducciones (resumen)"""
    model_config = ConfigDict(from_attributes=True)

    id: int
    year: int
    month: int
    total_deduction: int
    status: DeductionStatus
    created_at: datetime

    # Datos relacionados
    employee_name: str = Field(..., description="Nombre del empleado")
    apartment_name: str = Field(..., description="Nombre del apartamento")
    base_rent: int = Field(..., description="Renta base")
    additional_charges: int = Field(default=0, description="Cargos adicionales")


# =============================================================================
# CÁLCULOS SCHEMAS
# =============================================================================

class ProratedCalculationRequest(BaseModel):
    """Request para cálculo de renta prorrateada"""
    monthly_rent: int = Field(..., ge=0, description="Renta mensual")
    start_date: date = Field(..., description="Fecha de inicio")
    end_date: Optional[date] = Field(None, description="Fecha de fin (opcional)")
    year: int = Field(..., ge=2020, le=2030, description="Año")
    month: int = Field(..., ge=1, le=12, description="Mes")


class ProratedCalculationResponse(BaseModel):
    """Response para cálculo de renta prorrateada"""
    monthly_rent: int
    year: int
    month: int
    days_in_month: int

    start_date: date
    end_date: Optional[date]
    days_occupied: int

    daily_rate: Decimal = Field(..., description="Tasa diaria (con decimales)")
    prorated_rent: int = Field(..., description="Renta prorrateada (entero, redondeado)")
    is_prorated: bool = Field(default=True, description="¿Es un prorrateo?")
    calculation_formula: str = Field(..., description="Fórmula del cálculo")


class CleaningFeeRequest(BaseModel):
    """Request para consultar cargo de limpieza"""
    apartment_id: int = Field(..., description="ID del apartamento")
    custom_amount: Optional[int] = Field(None, description="Monto personalizado")


class CleaningFeeResponse(BaseModel):
    """Response para cargo de limpieza"""
    apartment_id: int
    default_amount: int = Field(..., description="Monto por defecto del apartamento")
    custom_amount: Optional[int] = Field(None, description="Monto personalizado solicitado")
    final_amount: int = Field(..., description="Monto final a aplicar")
    is_custom: bool = Field(default=False, description="¿Es un monto personalizado?")


class TotalCalculationRequest(BaseModel):
    """Request para cálculo total"""
    base_rent: int = Field(..., ge=0, description="Renta base o prorrateada")
    is_prorated: bool = Field(default=False, description="¿Es prorrateo?")
    additional_charges: List[dict] = Field(default_factory=list, description="Cargos adicionales")


class TotalCalculationResponse(BaseModel):
    """Response para cálculo total"""
    base_rent: int
    additional_charges_total: int = Field(..., description="Total de cargos adicionales")
    total_deduction: int = Field(..., description="Total a descontar")

    breakdown: List[dict] = Field(..., description="Desglose detallado")


# =============================================================================
# REPORTES SCHEMAS
# =============================================================================

class OccupancyReport(BaseModel):
    """Reporte de ocupación"""
    total_apartments: int
    occupied_apartments: int
    vacant_apartments: int
    occupancy_rate: float = Field(..., description="Tasa de ocupación (%)")

    total_capacity: int
    occupied_beds: int
    utilization_rate: float = Field(..., description="Tasa de utilización (%)")

    average_occupancy_per_building: float
    average_stay_duration: Optional[int] = Field(None, description="Duración promedio (días)")

    breakdown_by_prefecture: dict
    breakdown_by_room_type: dict
    breakdown_by_rent_range: dict


class ArrearsReport(BaseModel):
    """Reporte de pagos pendientes"""
    year: int
    month: int

    total_to_collect: int
    total_collected: int
    total_pending: int

    employees_with_arrears: int
    average_arrear_per_employee: float

    deductions_by_status: dict
    top_debtors: List[dict]
    aging_report: dict


class MaintenanceReport(BaseModel):
    """Reporte de mantenimiento"""
    total_maintenance_charges: int
    charges_by_type: dict
    average_cost_by_type: dict

    trends_monthly: dict
    problem_apartments: List[dict]
    recommended_actions: List[str]


class CostAnalysisReport(BaseModel):
    """Análisis de costos"""
    year: int
    month: Optional[int]

    # Costos totales
    total_rent_paid: int
    total_management_fees: int
    total_maintenance: int
    total_operational: int

    # Deducciones
    total_collected_from_employees: int
    total_additional_charges_collected: int

    # Análisis
    profit_margin: Optional[float] = Field(None, description="Margen de ganancia (%)")
    average_cost_per_apartment: int
    cost_trends: dict

    # Proyecciones
    projected_next_month: int
    budget_recommendations: List[str]


# =============================================================================
# ESTADÍSTICAS
# =============================================================================

class AssignmentStatisticsResponse(BaseModel):
    """Estadísticas de asignaciones"""
    total_assignments: int = Field(default=0, description="Total de asignaciones")
    active_assignments: int = Field(default=0, description="Asignaciones activas")
    completed_assignments: int = Field(default=0, description="Asignaciones completadas")
    cancelled_assignments: int = Field(default=0, description="Asignaciones canceladas")
    transferred_assignments: int = Field(default=0, description="Asignaciones transferidas")

    total_rent_collected: int = Field(default=0, description="Total de renta cobrada (¥)")
    average_rent: float = Field(default=0.0, description="Renta promedio (¥)")
    average_occupancy_days: float = Field(default=0.0, description="Promedio de días de ocupación")

    # Breakdown por período (opcional)
    period_start: Optional[date] = Field(None, description="Inicio del período")
    period_end: Optional[date] = Field(None, description="Fin del período")


# =============================================================================
# UTILITARIOS
# =============================================================================

class PaginationInfo(BaseModel):
    """Información de paginación"""
    skip: int
    limit: int
    total: int
    has_next: bool
    has_previous: bool


class PaginatedResponse(BaseModel):
    """Respuesta paginada genérica"""
    items: List[ApartmentWithStats]
    total: int
    page: int
    page_size: int
    total_pages: int
    has_next: bool
    has_previous: bool


class ApiResponse(BaseModel):
    """Respuesta estándar de la API"""
    success: bool
    message: str
    data: Optional[dict] = None
    errors: Optional[List[str]] = None


class ErrorDetail(BaseModel):
    """Detalle de error"""
    code: str
    message: str
    field: Optional[str] = None
    details: Optional[dict] = None
