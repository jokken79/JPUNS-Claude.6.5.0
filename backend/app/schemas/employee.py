"""
Employee Schemas
"""
from pydantic import BaseModel, EmailStr, ConfigDict, Field, field_validator
from typing import Optional
from datetime import date, datetime


class EmployeeBase(BaseModel):
    """Base employee schema"""
    full_name_kanji: str
    full_name_kana: Optional[str] = None
    date_of_birth: Optional[date] = None
    gender: Optional[str] = None
    nationality: Optional[str] = None
    zairyu_card_number: Optional[str] = None
    zairyu_expire_date: Optional[date] = None
    address: Optional[str] = None
    current_address: Optional[str] = None  # 現住所 - Base address
    address_banchi: Optional[str] = None  # 番地 - Block/lot number
    address_building: Optional[str] = None  # 物件名 - Building name
    phone: Optional[str] = None
    email: Optional[EmailStr] = None
    emergency_contact: Optional[str] = None
    emergency_phone: Optional[str] = None


class EmployeeCreate(EmployeeBase):
    """Create employee from candidate"""
    rirekisho_id: str  # Changed from uns_id
    factory_id: int = Field(..., gt=0, description="工場/クライアントID (Factory/Client ID)")
    hakensaki_shain_id: Optional[str] = None
    hire_date: date
    jikyu: int = Field(..., gt=0, description="時給 - Hourly rate in JPY")
    position: Optional[str] = None
    contract_type: Optional[str] = None
    apartment_id: Optional[int] = None
    apartment_start_date: Optional[date] = None
    apartment_rent: Optional[int] = Field(None, ge=0, description="Apartment rent - Optional")
    is_corporate_housing: bool = False  # 社宅 (Corporate Housing)
    housing_subsidy: Optional[int] = Field(0, ge=0, description="住宅手当 - Housing Subsidy")

    @field_validator('factory_id')
    @classmethod
    def validate_factory_id(cls, v):
        """Ensure factory_id is positive integer"""
        if v <= 0:
            raise ValueError('factory_id must be positive integer')
        return v

    @field_validator('jikyu')
    @classmethod
    def validate_jikyu(cls, v):
        """Ensure jikyu (hourly rate) is positive"""
        if v <= 0:
            raise ValueError('jikyu (hourly rate) must be positive')
        return v


class EmployeeUpdate(BaseModel):
    """Update employee"""
    full_name_kanji: Optional[str] = None
    full_name_kana: Optional[str] = None
    factory_id: Optional[int] = Field(None, gt=0, description="工場/クライアントID (Factory/Client ID)")
    hakensaki_shain_id: Optional[str] = None
    jikyu: Optional[int] = Field(None, gt=0, description="時給 - Hourly rate in JPY")
    position: Optional[str] = None
    address: Optional[str] = None
    current_address: Optional[str] = None  # 現住所 - Base address
    address_banchi: Optional[str] = None  # 番地 - Block/lot number
    address_building: Optional[str] = None  # 物件名 - Building name
    phone: Optional[str] = None
    email: Optional[EmailStr] = None
    emergency_contact: Optional[str] = None
    emergency_phone: Optional[str] = None
    apartment_id: Optional[int] = None
    apartment_rent: Optional[int] = Field(None, ge=0, description="Apartment rent - Optional")
    is_corporate_housing: bool = False  # 社宅 (Corporate Housing)
    housing_subsidy: Optional[int] = Field(0, ge=0, description="住宅手当 - Housing Subsidy")
    zairyu_expire_date: Optional[date] = None

    @field_validator('factory_id')
    @classmethod
    def validate_factory_id(cls, v):
        """Ensure factory_id is positive integer when provided"""
        if v is not None and v <= 0:
            raise ValueError('factory_id must be positive integer')
        return v

    @field_validator('jikyu')
    @classmethod
    def validate_jikyu(cls, v):
        """Ensure jikyu (hourly rate) is positive when provided"""
        if v is not None and v <= 0:
            raise ValueError('jikyu (hourly rate) must be positive')
        return v


class EmployeeResponse(EmployeeBase):
    """Employee response"""
    id: int
    hakenmoto_id: int
    rirekisho_id: Optional[str]  # Changed from uns_id
    factory_id: Optional[int] = Field(None, description="工場/クライアントID (Factory/Client ID)")
    factory_name: Optional[str] = None  # Nombre de la fábrica
    hakensaki_shain_id: Optional[str]  # 派遣先ID - ID que la fábrica asigna al empleado
    hire_date: Optional[date]  # 入社日
    current_hire_date: Optional[date]  # 現入社 - Fecha de entrada a fábrica actual
    jikyu: int = Field(..., description="時給 - Hourly rate in JPY")  # 時給
    jikyu_revision_date: Optional[date]  # 時給改定
    photo_url: Optional[str] = None  # Added photo
    photo_data_url: Optional[str] = None  # Base64 encoded photo data
    position: Optional[str]
    contract_type: Optional[str]
    current_address: Optional[str] = None  # 現住所 - Base address
    address_banchi: Optional[str] = None  # 番地 - Block/lot number
    address_building: Optional[str] = None  # 物件名 - Building name

    # Assignment information
    assignment_location: Optional[str]  # 配属先
    assignment_line: Optional[str]  # 配属ライン
    job_description: Optional[str]  # 仕事内容

    # Financial
    hourly_rate_charged: Optional[int]  # 請求単価
    billing_revision_date: Optional[date]  # 請求改定
    profit_difference: Optional[int]  # 差額利益
    standard_compensation: Optional[int]  # 標準報酬
    health_insurance: Optional[int]  # 健康保険
    nursing_insurance: Optional[int]  # 介護保険
    pension_insurance: Optional[int]  # 厚生年金
    social_insurance_date: Optional[date]  # 社保加入日

    # Visa and documents
    visa_type: Optional[str]  # ビザ種類
    visa_renewal_alert: Optional[bool]  # ビザ更新アラート
    visa_alert_days: Optional[int]  # アラート日数
    license_type: Optional[str]  # 免許種類
    license_expire_date: Optional[date]  # 免許期限
    commute_method: Optional[str]  # 通勤方法
    optional_insurance_expire: Optional[date]  # 任意保険期限
    japanese_level: Optional[str]  # 日本語検定
    career_up_5years: Optional[bool]  # キャリアアップ5年目
    entry_request_date: Optional[date]  # 入社依頼日
    notes: Optional[str]  # 備考
    postal_code: Optional[str]  # 〒

    # Apartment
    apartment_id: Optional[int]  # アパートID
    apartment_start_date: Optional[date]  # 入居日
    apartment_move_out_date: Optional[date]  # 退去日
    apartment_rent: Optional[int]
    is_corporate_housing: bool = False  # 社宅 (Corporate Housing)
    housing_subsidy: Optional[int] = 0  # 住宅手当 (Housing Subsidy)

    # Yukyu (paid vacation)
    yukyu_total: int
    yukyu_used: int
    yukyu_remaining: int

    # Status
    current_status: Optional[str]  # 現在: active, terminated, suspended
    is_active: bool
    termination_date: Optional[date]  # 退社日
    termination_reason: Optional[str]
    created_at: datetime
    updated_at: Optional[datetime]

    model_config = ConfigDict(from_attributes=True)


class EmployeeTerminate(BaseModel):
    """Terminate employee"""
    termination_date: date
    termination_reason: str


class YukyuUpdate(BaseModel):
    """Update yukyu balance"""
    yukyu_total: int
    notes: Optional[str] = None


# ============================================
# SCHEMAS SEPARADOS POR TIPO DE EMPLEADO
# ============================================

class StaffResponse(BaseModel):
    """Schema para Staff (スタッフ - Personal de oficina)"""
    id: int
    staff_id: int
    rirekisho_id: Optional[str] = None

    # Información personal
    full_name_kanji: str
    full_name_kana: Optional[str] = None
    photo_url: Optional[str] = None
    photo_data_url: Optional[str] = None
    date_of_birth: Optional[date] = None
    gender: Optional[str] = None
    nationality: Optional[str] = None

    # Contacto
    phone: Optional[str] = None
    email: Optional[EmailStr] = None
    address: Optional[str] = None
    postal_code: Optional[str] = None
    emergency_contact_name: Optional[str] = None
    emergency_contact_phone: Optional[str] = None
    emergency_contact_relationship: Optional[str] = None

    # Empleo
    hire_date: Optional[date] = None
    position: Optional[str] = None
    department: Optional[str] = None
    monthly_salary: Optional[int] = None  # Salario fijo mensual (Staff)

    # Seguro social
    health_insurance: Optional[int] = None
    nursing_insurance: Optional[int] = None
    pension_insurance: Optional[int] = None
    social_insurance_date: Optional[date] = None

    # Yukyu (vacaciones pagadas)
    yukyu_total: int = 0
    yukyu_used: int = 0
    yukyu_remaining: int = 0

    # Status
    is_active: bool = True
    termination_date: Optional[date] = None
    termination_reason: Optional[str] = None
    notes: Optional[str] = None
    is_corporate_housing: bool = False
    housing_subsidy: Optional[int] = 0  # 住宅手当 (Housing Subsidy)

    # Metadata
    created_at: datetime
    updated_at: Optional[datetime] = None

    model_config = ConfigDict(from_attributes=True)


class ContractWorkerResponse(BaseModel):
    """Schema para ContractWorker (請負社員 - Ukeoi)"""
    id: int
    hakenmoto_id: int
    rirekisho_id: Optional[str] = None

    # Información de fábrica
    factory_id: Optional[str] = None
    company_name: Optional[str] = None
    plant_name: Optional[str] = None
    hakensaki_shain_id: Optional[str] = None

    # Información personal
    full_name_kanji: str
    full_name_kana: Optional[str] = None
    photo_url: Optional[str] = None
    photo_data_url: Optional[str] = None
    date_of_birth: Optional[date] = None
    gender: Optional[str] = None
    nationality: Optional[str] = None

    # Información de visa
    zairyu_card_number: Optional[str] = None
    zairyu_expire_date: Optional[date] = None

    # Contacto
    phone: Optional[str] = None
    email: Optional[EmailStr] = None
    address: Optional[str] = None
    postal_code: Optional[str] = None
    emergency_contact_name: Optional[str] = None
    emergency_contact_phone: Optional[str] = None
    emergency_contact_relationship: Optional[str] = None

    # Empleo
    hire_date: Optional[date] = None
    current_hire_date: Optional[date] = None
    jikyu: Optional[int] = None  # Salario por hora
    jikyu_revision_date: Optional[date] = None
    position: Optional[str] = None
    contract_type: Optional[str] = None

    # Asignación
    assignment_location: Optional[str] = None
    assignment_line: Optional[str] = None
    job_description: Optional[str] = None

    # Información financiera
    hourly_rate_charged: Optional[int] = None
    billing_revision_date: Optional[date] = None
    profit_difference: Optional[int] = None
    standard_compensation: Optional[int] = None
    health_insurance: Optional[int] = None
    nursing_insurance: Optional[int] = None
    pension_insurance: Optional[int] = None
    social_insurance_date: Optional[date] = None

    # Visa y documentos
    visa_type: Optional[str] = None
    license_type: Optional[str] = None
    license_expire_date: Optional[date] = None
    commute_method: Optional[str] = None
    optional_insurance_expire: Optional[date] = None
    japanese_level: Optional[str] = None
    career_up_5years: Optional[bool] = False
    entry_request_date: Optional[date] = None

    # Apartamento
    apartment_id: Optional[int] = None
    apartment_start_date: Optional[date] = None
    apartment_move_out_date: Optional[date] = None
    apartment_rent: Optional[int] = None
    is_corporate_housing: bool = False
    housing_subsidy: Optional[int] = 0  # 住宅手当 (Housing Subsidy)

    # Yukyu (vacaciones pagadas)
    yukyu_total: int = 0
    yukyu_used: int = 0
    yukyu_remaining: int = 0

    # Status
    is_active: bool = True
    termination_date: Optional[date] = None
    termination_reason: Optional[str] = None
    notes: Optional[str] = None

    # Metadata
    created_at: datetime
    updated_at: Optional[datetime] = None

    model_config = ConfigDict(from_attributes=True)
