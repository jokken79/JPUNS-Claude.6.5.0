from pydantic import BaseModel, Field
from datetime import datetime
from typing import Optional


class ApartmentBase(BaseModel):
    """Base schema for Apartment"""
    apartment_code: str = Field(..., min_length=1, max_length=50, description="Código del apartamento")
    address: str = Field(..., min_length=1, description="Dirección completa del edificio")
    monthly_rent: int = Field(..., ge=0, description="Renta mensual en yenes")
    capacity: Optional[int] = Field(default=4, ge=1, description="Capacidad máxima de personas")
    is_available: bool = Field(default=True, description="Apartamento disponible para asignación")
    notes: Optional[str] = Field(default=None, description="Notas adicionales")


class ApartmentCreate(ApartmentBase):
    """Schema for creating a new apartment"""
    pass


class ApartmentUpdate(BaseModel):
    """Schema for updating an apartment (all fields optional)"""
    apartment_code: Optional[str] = Field(None, min_length=1, max_length=50)
    address: Optional[str] = Field(None, min_length=1)
    monthly_rent: Optional[int] = Field(None, ge=0)
    capacity: Optional[int] = Field(None, ge=1)
    is_available: Optional[bool] = None
    notes: Optional[str] = None


class ApartmentResponse(ApartmentBase):
    """Schema for apartment response with calculated fields"""
    id: int
    created_at: datetime
    employees_count: int = Field(default=0, description="Número de empleados asignados actualmente")
    occupancy_rate: float = Field(default=0.0, ge=0.0, le=100.0, description="Porcentaje de ocupación")
    status: str = Field(default="disponible", description="Estado: disponible/parcial/lleno")

    class Config:
        from_attributes = True


class EmployeeBasic(BaseModel):
    """Basic employee info for apartment details"""
    id: int
    hakenmoto_id: int
    full_name_kanji: str
    full_name_kana: Optional[str] = None
    phone: Optional[str] = None
    apartment_start_date: Optional[datetime] = None

    class Config:
        from_attributes = True


class ApartmentWithEmployees(ApartmentResponse):
    """Apartment response with employee details"""
    employees: list[EmployeeBasic] = Field(default_factory=list, description="Lista de empleados asignados")


class ApartmentStats(BaseModel):
    """Estadísticas globales de apartamentos"""
    total_apartments: int
    total_capacity: int
    apartments_occupied: int
    apartments_available: int
    apartments_full: int
    total_employees_assigned: int
    occupancy_percentage: float
    total_monthly_rent: int
    average_rent: float


class EmployeeAssignment(BaseModel):
    """Schema for assigning/removing employee from apartment"""
    employee_id: int = Field(..., description="ID del empleado")
    start_date: Optional[datetime] = Field(default=None, description="Fecha de entrada al apartamento")
    end_date: Optional[datetime] = Field(default=None, description="Fecha de salida del apartamento")
    rent_amount: Optional[int] = Field(default=None, description="Monto de renta para este empleado")
