"""
Factory Schemas with Complete Configuration Validation
"""
from pydantic import BaseModel, ConfigDict, Field, field_validator
from typing import Optional, List
from datetime import datetime, time


# ============ Configuration Sub-Schemas ============

class ShiftConfig(BaseModel):
    """Individual shift configuration"""
    shift_name: str = Field(..., min_length=1, max_length=50, description="Nombre del turno (朝番/昼番/夜番)")
    start_time: str = Field(..., pattern=r"^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$", description="Hora de inicio (HH:MM)")
    end_time: str = Field(..., pattern=r"^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$", description="Hora de fin (HH:MM)")
    break_minutes: int = Field(default=60, ge=0, le=180, description="Minutos de descanso")

    class Config:
        json_schema_extra = {
            "example": {
                "shift_name": "朝番",
                "start_time": "08:00",
                "end_time": "17:00",
                "break_minutes": 60
            }
        }


class OvertimeRulesConfig(BaseModel):
    """Overtime calculation rules"""
    normal_rate_multiplier: float = Field(default=1.25, ge=1.0, le=3.0, description="Multiplicador horas extras normales")
    night_rate_multiplier: float = Field(default=1.5, ge=1.0, le=3.0, description="Multiplicador horas extras nocturnas")
    holiday_rate_multiplier: float = Field(default=1.35, ge=1.0, le=3.0, description="Multiplicador días festivos")
    night_start: str = Field(default="22:00", pattern=r"^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$", description="Inicio horario nocturno")
    night_end: str = Field(default="05:00", pattern=r"^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$", description="Fin horario nocturno")

    class Config:
        json_schema_extra = {
            "example": {
                "normal_rate_multiplier": 1.25,
                "night_rate_multiplier": 1.5,
                "holiday_rate_multiplier": 1.35,
                "night_start": "22:00",
                "night_end": "05:00"
            }
        }


class BonusesConfig(BaseModel):
    """Bonus and allowance configuration"""
    attendance_bonus: int = Field(default=0, ge=0, description="Bono de asistencia mensual (¥)")
    perfect_attendance_bonus: int = Field(default=0, ge=0, description="Bono de asistencia perfecta (¥)")
    transportation_allowance: int = Field(default=0, ge=0, description="Subsidio de transporte (¥)")
    meal_allowance: int = Field(default=0, ge=0, description="Subsidio de comida (¥)")
    housing_allowance: int = Field(default=0, ge=0, description="Subsidio de vivienda (¥)")
    other_allowances: Optional[dict] = Field(default=None, description="Otros subsidios personalizados")

    class Config:
        json_schema_extra = {
            "example": {
                "attendance_bonus": 5000,
                "perfect_attendance_bonus": 10000,
                "transportation_allowance": 5000,
                "meal_allowance": 0,
                "housing_allowance": 0
            }
        }


class HolidaysConfig(BaseModel):
    """Holiday configuration"""
    weekly_holidays: List[str] = Field(default=["土", "日"], description="Días festivos semanales")
    public_holidays: bool = Field(default=True, description="Incluir festivos nacionales japoneses")
    company_holidays: List[str] = Field(default_factory=list, description="Festivos de empresa (YYYY-MM-DD)")

    @field_validator('company_holidays')
    @classmethod
    def validate_dates(cls, v):
        """Validate date format"""
        from datetime import datetime
        for date_str in v:
            try:
                datetime.strptime(date_str, '%Y-%m-%d')
            except ValueError:
                raise ValueError(f"Invalid date format: {date_str}. Use YYYY-MM-DD")
        return v

    class Config:
        json_schema_extra = {
            "example": {
                "weekly_holidays": ["土", "日"],
                "public_holidays": True,
                "company_holidays": ["2025-12-29", "2025-12-30", "2025-12-31"]
            }
        }


class AttendanceRulesConfig(BaseModel):
    """Attendance and penalty rules"""
    late_penalty: int = Field(default=0, ge=0, description="Penalización por tardanza (¥)")
    absence_penalty: int = Field(default=0, ge=0, description="Penalización por ausencia (¥)")
    early_leave_penalty: int = Field(default=0, ge=0, description="Penalización por salida anticipada (¥)")
    grace_period_minutes: int = Field(default=5, ge=0, le=30, description="Período de gracia para tardanzas (min)")
    require_advance_notice: bool = Field(default=True, description="Requiere aviso previo para ausencias")

    class Config:
        json_schema_extra = {
            "example": {
                "late_penalty": 1000,
                "absence_penalty": 5000,
                "early_leave_penalty": 1000,
                "grace_period_minutes": 5,
                "require_advance_notice": True
            }
        }


class FactoryConfig(BaseModel):
    """Complete factory configuration"""
    shifts: List[ShiftConfig] = Field(default_factory=list, description="Configuración de turnos")
    overtime_rules: OvertimeRulesConfig = Field(default_factory=OvertimeRulesConfig, description="Reglas de horas extras")
    bonuses: BonusesConfig = Field(default_factory=BonusesConfig, description="Bonos y subsidios")
    holidays: HolidaysConfig = Field(default_factory=HolidaysConfig, description="Días festivos")
    attendance_rules: AttendanceRulesConfig = Field(default_factory=AttendanceRulesConfig, description="Reglas de asistencia")

    class Config:
        json_schema_extra = {
            "example": {
                "shifts": [
                    {
                        "shift_name": "朝番",
                        "start_time": "08:00",
                        "end_time": "17:00",
                        "break_minutes": 60
                    }
                ],
                "overtime_rules": {
                    "normal_rate_multiplier": 1.25,
                    "night_rate_multiplier": 1.5,
                    "holiday_rate_multiplier": 1.35
                },
                "bonuses": {
                    "attendance_bonus": 5000,
                    "perfect_attendance_bonus": 10000
                },
                "holidays": {
                    "weekly_holidays": ["土", "日"],
                    "public_holidays": True
                },
                "attendance_rules": {
                    "late_penalty": 1000,
                    "absence_penalty": 5000
                }
            }
        }


# ============ Main Factory Schemas ============

class FactoryBase(BaseModel):
    """Base factory schema"""
    name: str = Field(..., min_length=1, max_length=100)
    company_name: Optional[str] = Field(None, max_length=100, description="企業名 - Company name")
    plant_name: Optional[str] = Field(None, max_length=100, description="工場名 - Plant/Factory name")
    address: Optional[str] = None
    phone: Optional[str] = Field(None, max_length=20)
    contact_person: Optional[str] = Field(None, max_length=100)


class FactoryCreate(FactoryBase):
    """Create factory"""
    factory_id: str = Field(..., min_length=1, max_length=200)
    config: Optional[FactoryConfig] = None


class FactoryUpdate(BaseModel):
    """Update factory"""
    name: Optional[str] = Field(None, min_length=1, max_length=100)
    company_name: Optional[str] = Field(None, max_length=100)
    plant_name: Optional[str] = Field(None, max_length=100)
    address: Optional[str] = None
    phone: Optional[str] = Field(None, max_length=20)
    contact_person: Optional[str] = Field(None, max_length=100)
    config: Optional[FactoryConfig] = None
    is_active: Optional[bool] = None


class FactoryResponse(FactoryBase):
    """Factory response"""
    id: int
    factory_id: str
    config: Optional[FactoryConfig] = None
    is_active: bool
    created_at: datetime
    updated_at: Optional[datetime]
    employees_count: Optional[int] = 0

    model_config = ConfigDict(from_attributes=True)


class FactoryWithEmployees(FactoryResponse):
    """Factory with employee list"""
    employees: List[dict] = Field(default_factory=list)


class FactoryStats(BaseModel):
    """Factory statistics"""
    total_factories: int
    total_employees: int
    factories_with_employees: int
    empty_factories: int
    avg_employees_per_factory: float


class OldFactoryStats(BaseModel):
    """Factory statistics"""
    factory_id: str
    factory_name: str
    total_employees: int
    active_employees: int
    total_hours_current_month: float
    total_salary_current_month: int
    total_revenue_current_month: int
    profit_current_month: int


# ============ Configuration Management Schemas ============

class ConfigTemplateCreate(BaseModel):
    """Create a configuration template"""
    template_name: str = Field(..., min_length=1, max_length=100)
    description: Optional[str] = None
    config: FactoryConfig


class ConfigTemplateResponse(BaseModel):
    """Configuration template response"""
    id: int
    template_name: str
    description: Optional[str]
    config: FactoryConfig
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)
