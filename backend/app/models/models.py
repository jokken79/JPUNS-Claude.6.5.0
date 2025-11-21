"""
SQLAlchemy Models for UNS-ClaudeJP 1.0
"""
from sqlalchemy import Boolean, Column, Integer, String, Text, DateTime, Date, Time, Numeric, Float, ForeignKey, Enum as SQLEnum, JSON, CheckConstraint, UniqueConstraint
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.orm import relationship
from sqlalchemy.ext.hybrid import hybrid_property
from sqlalchemy.sql import func
from datetime import datetime
from decimal import Decimal
import enum

from app.core.database import Base
from app.models.mixins import SoftDeleteMixin


# ============================================
# ENUMS
# ============================================

class UserRole(str, enum.Enum):
    SUPER_ADMIN = "SUPER_ADMIN"
    ADMIN = "ADMIN"
    KEITOSAN = "KEITOSAN"  # 経理管理 - Finance/Accounting
    TANTOSHA = "TANTOSHA"  # 担当者 - HR/Operations
    COORDINATOR = "COORDINATOR"
    KANRININSHA = "KANRININSHA"  # Staff - Office/HR personnel
    EMPLOYEE = "EMPLOYEE"  # 派遣元社員 - Dispatch workers
    CONTRACT_WORKER = "CONTRACT_WORKER"  # 請負 - Contract workers


class CandidateStatus(str, enum.Enum):
    PENDING = "pending"
    APPROVED = "approved"
    REJECTED = "rejected"
    HIRED = "hired"


class InterviewResult(str, enum.Enum):
    """Interview result - Thumbs up/down visual"""
    PASSED = "passed"  # 👍 Entrevista pasada
    FAILED = "failed"  # 👎 Entrevista fallida
    PENDING = "pending"  # ⏳ Entrevista pendiente


class DocumentType(str, enum.Enum):
    RIREKISHO = "rirekisho"
    ZAIRYU_CARD = "zairyu_card"
    LICENSE = "license"
    CONTRACT = "contract"
    OTHER = "other"


class RequestType(str, enum.Enum):
    YUKYU = "yukyu"
    HANKYU = "hankyu"
    IKKIKOKOKU = "ikkikokoku"
    TAISHA = "taisha"
    NYUUSHA = "nyuusha"  # 入社連絡票 - New hire notification form


class RequestStatus(str, enum.Enum):
    PENDING = "pending"
    APPROVED = "approved"
    REJECTED = "rejected"
    COMPLETED = "completed"  # 済 - Completed/Archived (used for 入社連絡票 after employee creation)


class YukyuStatus(str, enum.Enum):
    """Status of yukyu balance - active or expired"""
    ACTIVE = "active"
    EXPIRED = "expired"


class ShiftType(str, enum.Enum):
    ASA = "asa"  # 朝番
    HIRU = "hiru"  # 昼番
    YORU = "yoru"  # 夜番
    OTHER = "other"


class RoomType(str, enum.Enum):
    """Room type classifications for apartments"""
    ONE_K = "1K"
    ONE_DK = "1DK"
    ONE_LDK = "1LDK"
    TWO_K = "2K"
    TWO_DK = "2DK"
    TWO_LDK = "2LDK"
    THREE_LDK = "3LDK"
    STUDIO = "studio"
    OTHER = "other"


class ApartmentStatus(str, enum.Enum):
    """Status of apartment availability"""
    ACTIVE = "active"
    INACTIVE = "inactive"
    MAINTENANCE = "maintenance"
    RESERVED = "reserved"


class AssignmentStatus(str, enum.Enum):
    """Status of apartment assignment"""
    ACTIVE = "active"
    ENDED = "ended"
    CANCELLED = "cancelled"
    TRANSFERRED = "transferred"


class ChargeType(str, enum.Enum):
    """Types of additional charges"""
    CLEANING = "cleaning"
    REPAIR = "repair"
    DEPOSIT = "deposit"
    PENALTY = "penalty"
    KEY_REPLACEMENT = "key_replacement"
    OTHER = "other"


class DeductionStatus(str, enum.Enum):
    """Status of rent deduction"""
    PENDING = "pending"
    PROCESSED = "processed"
    PAID = "paid"
    CANCELLED = "cancelled"


class AdminActionType(str, enum.Enum):
    """Types of admin actions for audit logging"""
    PAGE_VISIBILITY_CHANGE = "PAGE_VISIBILITY_CHANGE"
    ROLE_PERMISSION_CHANGE = "ROLE_PERMISSION_CHANGE"
    BULK_OPERATION = "BULK_OPERATION"
    CONFIG_CHANGE = "CONFIG_CHANGE"
    CACHE_CLEAR = "CACHE_CLEAR"
    USER_MANAGEMENT = "USER_MANAGEMENT"
    SYSTEM_SETTINGS = "SYSTEM_SETTINGS"


class ResourceType(str, enum.Enum):
    """Types of resources that can be audited"""
    PAGE = "PAGE"
    ROLE = "ROLE"
    SYSTEM = "SYSTEM"
    USER = "USER"
    PERMISSION = "PERMISSION"


class AIProvider(str, enum.Enum):
    """AI Service providers for AIGateway"""
    GEMINI = "gemini"
    OPENAI = "openai"
    CLAUDE_API = "claude_api"
    LOCAL_CLI = "local_cli"


# ============================================
# MODELS
# ============================================

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    username = Column(String(50), unique=True, nullable=False, index=True)
    email = Column(String(100), unique=True, nullable=False, index=True)
    password_hash = Column(String(255), nullable=False)
    role = Column(SQLEnum(UserRole, name='user_role'), nullable=False, default=UserRole.EMPLOYEE)
    full_name = Column(String(100))
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    # Relationships
    refresh_tokens = relationship("RefreshToken", back_populates="user", cascade="all, delete-orphan")


class RefreshToken(Base):
    """Refresh Token Table for JWT token rotation"""
    __tablename__ = "refresh_tokens"

    id = Column(Integer, primary_key=True, index=True)
    token = Column(String(500), unique=True, nullable=False, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    expires_at = Column(DateTime(timezone=True), nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    revoked = Column(Boolean, default=False)
    revoked_at = Column(DateTime(timezone=True), nullable=True)

    # Store device/client info for security auditing
    user_agent = Column(String(500))
    ip_address = Column(String(45))  # IPv6 max length

    # Relationships
    user = relationship("User", back_populates="refresh_tokens")


class Candidate(Base, SoftDeleteMixin):
    """Candidate Table - Complete Resume/CV fields (履歴書/Rirekisho)"""
    __tablename__ = "candidates"

    # Primary Key & IDs
    id = Column(Integer, primary_key=True, index=True)
    rirekisho_id = Column(String(20), unique=True, nullable=False, index=True)  # 履歴書ID

    # 受付日・来日 (Reception & Arrival Dates)
    reception_date = Column(Date)  # 受付日
    arrival_date = Column(Date)  # 来日

    # 基本情報 (Basic Information)
    full_name_kanji = Column(String(100))  # 氏名
    full_name_kana = Column(String(100))  # フリガナ
    full_name_roman = Column(String(100))  # 氏名（ローマ字)
    gender = Column(String(10))  # 性別
    date_of_birth = Column(Date)  # 生年月日
    photo_url = Column(String(255))  # 写真
    photo_data_url = Column(Text)  # Base64データURLの証明写真
    nationality = Column(String(50))  # 国籍
    marital_status = Column(String(20))  # 配偶者
    hire_date = Column(Date)  # 入社日

    # 住所情報 (Address Information)
    postal_code = Column(String(10))  # 郵便番号
    current_address = Column(Text)  # 現住所
    address = Column(Text)  # 住所 (principal)
    address_banchi = Column(String(100))  # 番地
    address_building = Column(String(100))  # 物件名 (Building/apartment name)
    registered_address = Column(Text)  # 登録住所

    # 連絡先 (Contact Information)
    phone = Column(String(20))  # 電話番号
    mobile = Column(String(20))  # 携帯電話

    # パスポート情報 (Passport Information)
    passport_number = Column(String(50))  # パスポート番号
    passport_expiry = Column(Date)  # パスポート期限

    # 在留カード情報 (Residence Card Information)
    residence_status = Column(String(50))  # 在留資格
    residence_expiry = Column(Date)  # （在留カード記載）在留期限
    residence_card_number = Column(String(50))  # 在留カード番号

    # 運転免許情報 (Driver's License Information)
    license_number = Column(String(50))  # 運転免許番号及び条件
    license_expiry = Column(Date)  # 運転免許期限
    car_ownership = Column(String(10))  # 自動車所有
    voluntary_insurance = Column(String(10))  # 任意保険加入

    # 資格・免許 (Qualifications & Licenses)
    forklift_license = Column(String(10))  # ﾌｫｰｸﾘﾌﾄ免許
    tama_kake = Column(String(10))  # 玉掛
    mobile_crane_under_5t = Column(String(10))  # 移動式ｸﾚｰﾝ運転士(5ﾄﾝ未満)
    mobile_crane_over_5t = Column(String(10))  # 移動式ｸﾚｰﾝ運転士(5ﾄﾝ以上)
    gas_welding = Column(String(10))  # ｶﾞｽ溶接作業者

    # 家族構成 (Family Members) - Member 1
    family_name_1 = Column(String(100))  # 家族構成氏名1
    family_relation_1 = Column(String(50))  # 家族構成続柄1
    family_age_1 = Column(Integer)  # 年齢1
    family_residence_1 = Column(String(50))  # 居住1
    family_separate_address_1 = Column(Text)  # 別居住住所1
    family_dependent_1 = Column(String(50))  # 扶養1

    # 家族構成 - Member 2
    family_name_2 = Column(String(100))  # 家族構成氏名2
    family_relation_2 = Column(String(50))  # 家族構成続柄2
    family_age_2 = Column(Integer)  # 年齢2
    family_residence_2 = Column(String(50))  # 居住2
    family_separate_address_2 = Column(Text)  # 別居住住所2
    family_dependent_2 = Column(String(50))  # 扶養2

    # 家族構成 - Member 3
    family_name_3 = Column(String(100))  # 氏名3
    family_relation_3 = Column(String(50))  # 家族構成続柄3
    family_age_3 = Column(Integer)  # 年齢3
    family_residence_3 = Column(String(50))  # 居住3
    family_separate_address_3 = Column(Text)  # 別居住住所3
    family_dependent_3 = Column(String(50))  # 扶養3

    # 家族構成 - Member 4
    family_name_4 = Column(String(100))  # 家族構成氏名4
    family_relation_4 = Column(String(50))  # 家族構成続柄4
    family_age_4 = Column(Integer)  # 年齢4
    family_residence_4 = Column(String(50))  # 居住4
    family_separate_address_4 = Column(Text)  # 別居住住所4
    family_dependent_4 = Column(String(50))  # 扶養4

    # 家族構成 - Member 5
    family_name_5 = Column(String(100))  # 家族構成氏名5
    family_relation_5 = Column(String(50))  # 家族構成続柄5
    family_age_5 = Column(Integer)  # 年齢5
    family_residence_5 = Column(String(50))  # 居住5
    family_separate_address_5 = Column(Text)  # 別居住住所5
    family_dependent_5 = Column(String(50))  # 扶養5

    # 職歴 (Work History) - Entry 7 (as per your column list)
    work_history_company_7 = Column(String(200))  # 家族構成社社7
    work_history_entry_company_7 = Column(String(200))  # 職歴入社会社名7
    work_history_exit_company_7 = Column(String(200))  # 職歴退社会社名7

    # 経験作業 (Work Experience)
    exp_nc_lathe = Column(Boolean)  # NC旋盤
    exp_lathe = Column(Boolean)  # 旋盤
    exp_press = Column(Boolean)  # ﾌﾟﾚｽ
    exp_forklift = Column(Boolean)  # ﾌｫｰｸﾘﾌﾄ
    exp_packing = Column(Boolean)  # 梱包
    exp_welding = Column(Boolean)  # 溶接
    exp_car_assembly = Column(Boolean)  # 車部品組立
    exp_car_line = Column(Boolean)  # 車部品ライン
    exp_car_inspection = Column(Boolean)  # 車部品検査
    exp_electronic_inspection = Column(Boolean)  # 電子部品検査
    exp_food_processing = Column(Boolean)  # 食品加工
    exp_casting = Column(Boolean)  # 鋳造
    exp_line_leader = Column(Boolean)  # ラインリーダー
    exp_painting = Column(Boolean)  # 塗装
    exp_other = Column(Text)  # その他

    # お弁当 (Lunch/Bento Options)
    bento_lunch_dinner = Column(String(10))  # お弁当　昼/夜
    bento_lunch_only = Column(String(10))  # お弁当　昼のみ
    bento_dinner_only = Column(String(10))  # お弁当　夜のみ
    bento_bring_own = Column(String(10))  # お弁当　持参
    lunch_preference = Column(String(50))  # お弁当（社内食堂）

    # 通勤 (Commute)
    commute_method = Column(String(50))  # 通勤方法
    commute_time_oneway = Column(Integer)  # 通勤片道時間

    # 面接・検査 (Interview & Tests)
    interview_result = Column(SQLEnum(InterviewResult), server_default="pending")  # 面接結果 (👍👎⏳)
    antigen_test_kit = Column(String(20))  # 簡易抗原検査キット
    antigen_test_date = Column(Date)  # 簡易抗原検査実施日
    covid_vaccine_status = Column(String(50))  # コロナワクチン予防接種状態

    # 語学スキル (Language Skills)
    language_skill_exists = Column(String(10))  # 語学スキル有無
    language_skill_1 = Column(String(100))  # 語学スキル有無１
    language_skill_2 = Column(String(100))  # 語学スキル有無2

    # 日本語能力 (Japanese Language Ability)
    japanese_qualification = Column(String(50))  # 日本語能力資格
    japanese_level = Column(String(10))  # 日本語能力資格Level
    jlpt_taken = Column(String(10))  # 能力試験受験
    jlpt_date = Column(Date)  # 能力試験受験日付
    jlpt_score = Column(Integer)  # 能力試験受験点数
    jlpt_scheduled = Column(String(30))  # 能力試験受験受験予定 (ISO datetime: 'YYYY-MM-DDTHH:MM:SS')

    # 有資格 (Qualifications)
    qualification_1 = Column(String(100))  # 有資格取得
    qualification_2 = Column(String(100))  # 有資格取得1
    qualification_3 = Column(String(100))  # 有資格取得2

    # 学歴 (Education)
    major = Column(String(100))  # 専攻

    # 身体情報 (Physical Information)
    height = Column(Float)  # 身長(cm)
    weight = Column(Float)  # 体重(kg)
    clothing_size = Column(String(10))  # 服のサイズ
    waist = Column(Integer)  # ウエスト(cm)
    shoe_size = Column(Float)  # 靴サイズ(cm)
    blood_type = Column(String(5))  # 血液型
    vision_right = Column(Float)  # 視力(右)
    vision_left = Column(Float)  # 視力(左)
    dominant_hand = Column(String(10))  # 利き腕
    allergy_exists = Column(String(10))  # アレルギー有無
    glasses = Column(String(100))  # 眼（メガネ、コンタクト使用）

    # 日本語能力詳細 (Japanese Ability Details)
    listening_level = Column(String(20))  # 聞く選択
    speaking_level = Column(String(20))  # 話す選択

    # 緊急連絡先 (Emergency Contact)
    emergency_contact_name = Column(String(100))  # 緊急連絡先　氏名
    emergency_contact_relation = Column(String(50))  # 緊急連絡先　続柄
    emergency_contact_phone = Column(String(20))  # 緊急連絡先　電話番号

    # 作業用品 (Work Equipment)
    safety_shoes = Column(String(10))  # 安全靴

    # 読み書き能力 (Reading & Writing Ability)
    read_katakana = Column(String(20))  # 読む　カナ
    read_hiragana = Column(String(20))  # 読む　ひら
    read_kanji = Column(String(20))  # 読む　漢字
    write_katakana = Column(String(20))  # 書く　カナ
    write_hiragana = Column(String(20))  # 書く　ひら
    write_kanji = Column(String(20))  # 書く　漢字氏名3

    # 会話能力 (Conversation Ability)
    can_speak = Column(String(20))  # 会話ができる
    can_understand = Column(String(20))  # 会話が理解できる
    can_read_kana = Column(String(20))  # ひらがな・カタカナ読める
    can_write_kana = Column(String(20))  # ひらがな・カタカナ書け

    # Legacy fields for compatibility
    email = Column(String(100))
    # phone y address ya están definidos arriba, no duplicar

    ocr_notes = Column(Text)  # OCR処理に関するメモ

    # Status & Audit Fields (usando String en lugar de SQLEnum para evitar problemas de serialización)
    status = Column(String(20), server_default="pending")
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    approved_by = Column(Integer, ForeignKey("users.id"))
    approved_at = Column(DateTime(timezone=True))

    # Relationships
    documents = relationship("Document", back_populates="candidate")
    form_submissions = relationship("CandidateForm", back_populates="candidate", cascade="all, delete-orphan")
    employees = relationship(
        "Employee",
        back_populates="candidate",
        primaryjoin="Candidate.rirekisho_id==Employee.rirekisho_id",
        cascade="all, delete-orphan"
    )
    requests = relationship("Request", back_populates="candidate")


class CandidateForm(Base):
    """Raw rirekisho form submissions stored as JSON snapshots."""

    __tablename__ = "candidate_forms"

    id = Column(Integer, primary_key=True, index=True)
    candidate_id = Column(Integer, ForeignKey("candidates.id", ondelete="SET NULL"))
    rirekisho_id = Column(String(20), index=True)
    applicant_id = Column(String(50), index=True)
    form_data = Column(JSON, nullable=False)
    photo_data_url = Column(Text)
    azure_metadata = Column(JSON)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    candidate = relationship("Candidate", back_populates="form_submissions")


class Document(Base):
    __tablename__ = "documents"

    id = Column(Integer, primary_key=True, index=True)
    candidate_id = Column(Integer, ForeignKey("candidates.id", ondelete="CASCADE"))
    employee_id = Column(Integer, ForeignKey("employees.id", ondelete="CASCADE"))
    document_type = Column(SQLEnum(DocumentType, name='document_type'), nullable=False)
    file_name = Column(String(255), nullable=False)
    file_path = Column(String(500), nullable=False)
    file_size = Column(Integer)
    mime_type = Column(String(100))
    ocr_data = Column(JSON)
    uploaded_at = Column(DateTime(timezone=True), server_default=func.now())
    uploaded_by = Column(Integer, ForeignKey("users.id"))

    # Relationships
    candidate = relationship("Candidate", back_populates="documents")
    employee = relationship("Employee", back_populates="documents")


class Factory(Base, SoftDeleteMixin):
    __tablename__ = "factories"

    id = Column(Integer, primary_key=True, index=True)
    factory_id = Column(String(200), unique=True, nullable=False, index=True)  # Compound: Company__Plant
    company_name = Column(String(100))  # 企業名 - Company name
    plant_name = Column(String(100))    # 工場名 - Plant/Factory name
    name = Column(String(100), nullable=False)
    address = Column(Text)
    phone = Column(String(20))
    contact_person = Column(String(100))
    config = Column(JSON)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    # Relationships
    employees = relationship("Employee", back_populates="factory", primaryjoin="Factory.factory_id==foreign(Employee.factory_id)")
    contract_workers = relationship("ContractWorker", back_populates="factory", primaryjoin="Factory.factory_id==foreign(ContractWorker.factory_id)")
    apartment_associations = relationship("ApartmentFactory", back_populates="factory", cascade="all, delete-orphan")


class Apartment(Base, SoftDeleteMixin):
    __tablename__ = "apartments"

    id = Column(Integer, primary_key=True, index=True)

    # Basic identification (legacy fields kept for compatibility)
    apartment_code = Column(String(50), unique=True, nullable=True)  # Made nullable for migration
    name = Column(String(200), nullable=False, index=True)  # Primary name
    building_name = Column(String(200))
    room_number = Column(String(20))
    floor_number = Column(Integer)

    # Address information
    postal_code = Column(String(10))
    prefecture = Column(String(50), index=True)
    city = Column(String(100), index=True)
    address = Column(Text)  # Legacy field, kept for compatibility
    address_line1 = Column(String(200))
    address_line2 = Column(String(200))

    # Geographic organization (added for apartment-factory relationship)
    region_id = Column(Integer, ForeignKey("regions.id"), index=True)
    zone = Column(String(50), index=True)

    # Room specifications
    room_type = Column(SQLEnum(RoomType, name='room_type'))
    size_sqm = Column(Numeric(6, 2))  # Size in square meters
    capacity = Column(Integer)  # Legacy field, kept

    # Property information
    property_type = Column(String(50), nullable=True)  # Casa, Edificio, Apartamento

    # Financial information
    base_rent = Column(Integer, nullable=False)  # Base monthly rent
    monthly_rent = Column(Integer)  # Legacy field, kept for compatibility
    management_fee = Column(Integer, default=0)  # Management/common area fee
    deposit = Column(Integer, default=0)  # 敷金 (Shikikin)
    key_money = Column(Integer, default=0)  # 礼金 (Reikin)
    default_cleaning_fee = Column(Integer, default=20000)  # Default cleaning charge on move-out
    parking_spaces = Column(Integer, nullable=True)  # Number of parking spaces
    parking_price_per_unit = Column(Integer, nullable=True)  # Price per parking space in yen
    initial_plus = Column(Integer, nullable=True, default=5000)  # Additional initial costs

    # Contract with landlord/agency
    contract_start_date = Column(Date)
    contract_end_date = Column(Date)
    landlord_name = Column(String(200))
    landlord_contact = Column(String(200))
    real_estate_agency = Column(String(200))
    emergency_contact = Column(String(200))

    # Status and metadata
    status = Column(SQLEnum(ApartmentStatus, name='apartment_status'), default=ApartmentStatus.ACTIVE)
    is_available = Column(Boolean, default=True)  # Legacy field, kept
    notes = Column(Text)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    # Relationships
    employees = relationship("Employee", back_populates="apartment")
    contract_workers = relationship("ContractWorker", back_populates="apartment")
    assignments = relationship("ApartmentAssignment", back_populates="apartment", cascade="all, delete-orphan")
    factory_associations = relationship("ApartmentFactory", back_populates="apartment", cascade="all, delete-orphan")


class ApartmentFactory(Base):
    """Many-to-many relationship between apartments and factories with temporal tracking"""
    __tablename__ = "apartment_factory"

    id = Column(Integer, primary_key=True)
    apartment_id = Column(Integer, ForeignKey("apartments.id", ondelete="CASCADE"), nullable=False, index=True)
    factory_id = Column(Integer, ForeignKey("factories.id", ondelete="CASCADE"), nullable=False, index=True)
    is_primary = Column(Boolean, default=True, index=True)
    priority = Column(Integer, default=1)
    distance_km = Column(Numeric(6, 2))
    commute_minutes = Column(Integer)
    effective_from = Column(Date, default=func.current_date())
    effective_until = Column(Date)
    notes = Column(Text)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    # Relationships
    apartment = relationship("Apartment", back_populates="factory_associations")
    factory = relationship("Factory", back_populates="apartment_associations")


# ============================================
# EMPLOYEE BASE MIXIN (Shared fields)
# ============================================

class EmployeeBaseMixin:
    """
    Shared fields between Employee (派遣社員) and ContractWorker (請負社員)

    REFACTORED (2025-11-12): Extracted common fields to eliminate duplication.
    This mixin contains ~60 shared fields that both employee types use.
    """

    # Core identifiers (common)
    id = Column(Integer, primary_key=True, index=True)
    hakenmoto_id = Column(Integer, unique=True, nullable=False, index=True)
    rirekisho_id = Column(String(20), ForeignKey("candidates.rirekisho_id"))
    factory_id = Column(String(200), ForeignKey("factories.factory_id"))  # Compound: Company__Plant
    company_name = Column(String(100))  # 企業名 - Company name (denormalized)
    plant_name = Column(String(100))    # 工場名 - Plant name (denormalized)
    hakensaki_shain_id = Column(String(50))

    # Personal information (common)
    full_name_kanji = Column(String(100), nullable=False)
    full_name_kana = Column(String(100))
    photo_url = Column(String(255))
    photo_data_url = Column(Text)  # Base64 data URL photo synchronized from candidates
    date_of_birth = Column(Date)
    gender = Column(String(10))
    nationality = Column(String(50))
    zairyu_card_number = Column(String(50))
    zairyu_expire_date = Column(Date)

    # Contact information (common)
    address = Column(Text)
    phone = Column(String(20))
    email = Column(String(100))
    emergency_contact_name = Column(String(100))
    emergency_contact_phone = Column(String(20))
    emergency_contact_relationship = Column(String(50))

    # Employment information (common)
    hire_date = Column(Date)  # 入社日
    current_hire_date = Column(Date)  # 現入社 - Fecha de entrada a fábrica actual
    jikyu = Column(Integer)  # 時給
    jikyu_revision_date = Column(Date)  # 時給改定 - Fecha de revisión de salario
    position = Column(String(100))
    contract_type = Column(String(50))

    # Assignment information (common)
    assignment_location = Column(String(200))  # 配属先 - Ubicación de asignación
    assignment_line = Column(String(200))  # 配属ライン - Línea de asignación
    job_description = Column(Text)  # 仕事内容 - Descripción del trabajo

    # Financial information (common)
    hourly_rate_charged = Column(Integer)  # 請求単価
    billing_revision_date = Column(Date)  # 請求改定 - Fecha de revisión de facturación
    profit_difference = Column(Integer)    # 差額利益
    standard_compensation = Column(Integer)  # 標準報酬
    health_insurance = Column(Integer)     # 健康保険
    nursing_insurance = Column(Integer)    # 介護保険
    pension_insurance = Column(Integer)    # 厚生年金
    social_insurance_date = Column(Date)   # 社保加入日

    # Visa and documents (common)
    visa_type = Column(String(50))         # ビザ種類
    license_type = Column(String(100))     # 免許種類
    license_expire_date = Column(Date)     # 免許期限
    commute_method = Column(String(50))    # 通勤方法
    optional_insurance_expire = Column(Date)  # 任意保険期限
    japanese_level = Column(String(50))    # 日本語検定
    career_up_5years = Column(Boolean, default=False)  # キャリアアップ5年目
    entry_request_date = Column(Date)      # 入社依頼日
    notes = Column(Text)                   # 備考
    postal_code = Column(String(10))       # 郵便番号

    # Apartment (common)
    apartment_id = Column(Integer, ForeignKey("apartments.id"))
    apartment_start_date = Column(Date)
    apartment_move_out_date = Column(Date) # 退去日
    apartment_rent = Column(Integer)
    is_corporate_housing = Column(Boolean, default=False, nullable=False)  # 社宅 (Corporate Housing)
    housing_subsidy = Column(Integer, default=0)  # 住宅手当 (Housing Subsidy)

    # Status (common)
    is_active = Column(Boolean, default=True)
    termination_date = Column(Date)
    termination_reason = Column(Text)

    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())


class Employee(Base, SoftDeleteMixin, EmployeeBaseMixin):
    """派遣社員 - Dispatch Workers

    REFACTORED (2025-11-12): Common fields moved to EmployeeBaseMixin.
    This class now only contains Employee-specific fields.
    """
    __tablename__ = "employees"

    # Employee-specific contact fields (not in ContractWorker)
    current_address = Column(String)  # 現住所 - Base address from postal code
    address_banchi = Column(String)  # 番地 - Block/lot number
    address_building = Column(String)  # 物件名 - Building/apartment name

    # Employee-specific assignment fields
    workplace_id = Column(Integer, ForeignKey("workplaces.id"))  # 職場 - Current workplace

    # Regional management fields (Employee-specific)
    current_region_id = Column(Integer, ForeignKey("regions.id"))
    current_factory_id = Column(Integer, ForeignKey("factories.id"))
    current_department_id = Column(Integer, ForeignKey("departments.id"))
    residence_type_id = Column(Integer, ForeignKey("residence_types.id"))
    residence_status_id = Column(Integer, ForeignKey("residence_statuses.id"))
    residence_address = Column(Text)
    residence_monthly_cost = Column(Integer)
    residence_start_date = Column(Date)
    assigned_regionally_at = Column(DateTime(timezone=True))

    # Employee-specific visa fields
    visa_renewal_alert = Column(Boolean, default=False)  # ビザ更新アラート - Auto-calculado por trigger
    visa_alert_days = Column(Integer, default=30)  # Días antes de alerta de visa

    # Yukyu (Employee-specific)
    yukyu_total = Column(Integer, default=0)
    yukyu_used = Column(Integer, default=0)
    yukyu_remaining = Column(Integer, default=0)

    # Employee-specific status
    current_status = Column(String(20), default='active')  # 現在: "active", "terminated", "suspended"

    # Relationships
    candidate = relationship(
        "Candidate",
        back_populates="employees",
        primaryjoin="Employee.rirekisho_id==Candidate.rirekisho_id"
    )
    factory = relationship("Factory", back_populates="employees", primaryjoin="Employee.factory_id==Factory.factory_id")
    apartment = relationship("Apartment", back_populates="employees")
    workplace = relationship("Workplace", back_populates="employees")
    documents = relationship("Document", back_populates="employee")
    timer_cards = relationship("TimerCard", back_populates="employee")
    salary_calculations = relationship("SalaryCalculation", back_populates="employee")
    requests = relationship("Request", back_populates="employee")
    contracts = relationship("Contract", back_populates="employee")
    current_region = relationship("Region", back_populates="employees")
    current_factory_ref = relationship("Factory", primaryjoin="Employee.current_factory_id==Factory.id")
    current_department = relationship("Department", back_populates="employees")
    residence_type = relationship("ResidenceType", back_populates="employees")
    residence_status = relationship("ResidenceStatus", back_populates="employees")


class ContractWorker(Base, SoftDeleteMixin, EmployeeBaseMixin):
    """請負社員 (Ukeoi) - Contract Workers

    REFACTORED (2025-11-12): Common fields moved to EmployeeBaseMixin.
    ContractWorkers have the same base fields as Employees but lack some
    Employee-specific features like yukyu (paid vacation), regional management, etc.

    NOTE: ContractWorkers DO have yukyu fields (inherited from mixin) but may
    have different calculation rules or policies compared to regular Employees.
    """
    __tablename__ = "contract_workers"

    # ContractWorker-specific fields (if any) would go here
    # Currently ContractWorker uses only the base fields from EmployeeBaseMixin
    # No additional unique fields needed at this time

    # Relationships
    factory = relationship("Factory", back_populates="contract_workers")
    apartment = relationship("Apartment", back_populates="contract_workers")


class Staff(Base, SoftDeleteMixin):
    """スタッフ (Staff) - Office/HR Personnel Table (Kanrininsha)"""
    __tablename__ = "staff"

    id = Column(Integer, primary_key=True, index=True)
    staff_id = Column(Integer, unique=True, nullable=False, index=True)
    rirekisho_id = Column(String(20), ForeignKey("candidates.rirekisho_id"))

    # Personal information
    full_name_kanji = Column(String(100), nullable=False)
    full_name_kana = Column(String(100))
    photo_url = Column(String(255))
    photo_data_url = Column(Text)  # Base64 data URL photo synchronized from candidates
    date_of_birth = Column(Date)
    gender = Column(String(10))
    nationality = Column(String(50))

    # Contact information
    address = Column(Text)
    phone = Column(String(20))
    email = Column(String(100))
    emergency_contact_name = Column(String(100))
    emergency_contact_phone = Column(String(20))
    emergency_contact_relationship = Column(String(50))
    postal_code = Column(String(10))

    # Employment information
    hire_date = Column(Date)
    position = Column(String(100))
    department = Column(String(100))
    monthly_salary = Column(Integer)  # Fixed monthly salary instead of hourly

    # Social insurance
    health_insurance = Column(Integer)
    nursing_insurance = Column(Integer)
    pension_insurance = Column(Integer)
    social_insurance_date = Column(Date)

    # Yukyu (有給休暇)
    yukyu_total = Column(Integer, default=0)
    yukyu_used = Column(Integer, default=0)
    is_corporate_housing = Column(Boolean, default=False, nullable=False)  # 社宅 (Corporate Housing) - para contabilidad (accounting)
    housing_subsidy = Column(Integer, default=0)  # 住宅手当 (Housing Subsidy)
    yukyu_remaining = Column(Integer, default=0)

    # Status
    is_active = Column(Boolean, default=True)
    termination_date = Column(Date)
    termination_reason = Column(Text)
    notes = Column(Text)

    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())


class TimerCard(Base):
    __tablename__ = "timer_cards"

    id = Column(Integer, primary_key=True, index=True)
    hakenmoto_id = Column(Integer, ForeignKey("employees.hakenmoto_id", ondelete="CASCADE"), nullable=True)
    factory_id = Column(String(20), nullable=True)  # For easier querying
    work_date = Column(Date, nullable=False)

    # Shift type
    shift_type = Column(SQLEnum(ShiftType, name='shift_type'))

    # Schedules
    clock_in = Column(Time)
    clock_out = Column(Time)
    break_minutes = Column(Integer, default=0)
    overtime_minutes = Column(Integer, default=0)

    # Calculated hours
    regular_hours = Column(Numeric(5, 2), default=0)
    overtime_hours = Column(Numeric(5, 2), default=0)
    night_hours = Column(Numeric(5, 2), default=0)
    holiday_hours = Column(Numeric(5, 2), default=0)

    # Notes and approval
    notes = Column(Text)
    is_approved = Column(Boolean, default=False)
    approved_by = Column(Integer, ForeignKey("users.id"))
    approved_at = Column(DateTime(timezone=True))

    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    # Relationships
    employee = relationship("Employee", back_populates="timer_cards")
    approver = relationship("User")


class SalaryCalculation(Base):
    __tablename__ = "salary_calculations"

    id = Column(Integer, primary_key=True, index=True)
    employee_id = Column(Integer, ForeignKey("employees.id", ondelete="CASCADE"), nullable=False)
    month = Column(Integer, nullable=False)
    year = Column(Integer, nullable=False)

    # Hours
    total_regular_hours = Column(Numeric(5, 2))
    total_overtime_hours = Column(Numeric(5, 2))
    total_night_hours = Column(Numeric(5, 2))
    total_holiday_hours = Column(Numeric(5, 2))

    # Payments
    base_salary = Column(Integer)
    overtime_pay = Column(Integer)
    night_pay = Column(Integer)
    holiday_pay = Column(Integer)
    bonus = Column(Integer, default=0)
    gasoline_allowance = Column(Integer, default=0)

    # Deductions
    apartment_deduction = Column(Integer, default=0)
    other_deductions = Column(Integer, default=0)

    # Total
    gross_salary = Column(Integer)
    net_salary = Column(Integer)

    # Company profit
    factory_payment = Column(Integer)  # 時給単価 total
    company_profit = Column(Integer)

    is_paid = Column(Boolean, default=False)
    paid_at = Column(DateTime(timezone=True))

    created_at = Column(DateTime(timezone=True), server_default=func.now())

    # Relationships
    employee = relationship("Employee", back_populates="salary_calculations")


class Request(Base):
    __tablename__ = "requests"

    id = Column(Integer, primary_key=True, index=True)
    hakenmoto_id = Column(Integer, ForeignKey("employees.hakenmoto_id", ondelete="CASCADE"), nullable=True)  # Nullable for 入社連絡票
    candidate_id = Column(Integer, ForeignKey("candidates.id", ondelete="SET NULL"), nullable=True)  # For 入社連絡票
    request_type = Column(SQLEnum(RequestType, name='request_type'), nullable=False)
    status = Column(SQLEnum(RequestStatus, name='request_status'), default=RequestStatus.PENDING)

    # Dates
    start_date = Column(Date, nullable=False)
    end_date = Column(Date, nullable=False)
    # Note: total_days is computed from start_date and end_date, not stored in DB

    # Details
    reason = Column(Text)
    notes = Column(Text)
    employee_data = Column(JSONB, nullable=True)  # For 入社連絡票: stores employee-specific data before approval

    # Approval
    approved_by = Column(Integer, ForeignKey("users.id"))
    approved_at = Column(DateTime(timezone=True))

    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    # Relationships
    employee = relationship("Employee", back_populates="requests")
    candidate = relationship("Candidate", back_populates="requests")

    @property
    def total_days(self):
        """Computed property: calculate total days from start_date and end_date"""
        if self.start_date and self.end_date:
            delta = self.end_date - self.start_date
            return float(delta.days + 1)
        return None

    @hybrid_property
    def employee_id(self):
        """Backwards compatibility: return employee.id if relationship is loaded"""
        if self.employee:
            return self.employee.id
        return None

    @employee_id.expression
    def employee_id(cls):
        """Expression for querying by employee_id in SQLAlchemy filters"""
        return cls.hakenmoto_id


class Contract(Base, SoftDeleteMixin):
    __tablename__ = "contracts"

    id = Column(Integer, primary_key=True, index=True)
    employee_id = Column(Integer, ForeignKey("employees.id", ondelete="CASCADE"), nullable=False)
    contract_type = Column(String(50), nullable=False)
    contract_number = Column(String(50), unique=True)

    start_date = Column(Date, nullable=False)
    end_date = Column(Date)

    pdf_path = Column(String(500))
    signed = Column(Boolean, default=False)
    signed_at = Column(DateTime(timezone=True))
    signature_data = Column(Text)  # Base64 signature

    created_at = Column(DateTime(timezone=True), server_default=func.now())

    # Relationships
    employee = relationship("Employee", back_populates="contracts")


class AuditLog(Base):
    __tablename__ = "audit_log"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    action = Column(String(100), nullable=False)
    table_name = Column(String(50))
    record_id = Column(Integer)
    old_values = Column(JSON)
    new_values = Column(JSON)
    ip_address = Column(String(50))
    user_agent = Column(Text)
    created_at = Column(DateTime(timezone=True), server_default=func.now())


class AdminAuditLog(Base):
    """
    Audit trail for admin permission changes and system configuration changes.
    Tracks who made what changes, when, and from where.
    """
    __tablename__ = "admin_audit_logs"

    id = Column(Integer, primary_key=True, index=True)

    # Who made the change
    admin_user_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    admin_user = relationship("User")

    # What type of action
    action_type = Column(SQLEnum(AdminActionType), nullable=False, index=True)

    # What resource was affected
    resource_type = Column(SQLEnum(ResourceType), nullable=False, index=True)
    resource_key = Column(String(255), index=True)  # e.g., 'timer-cards', 'EMPLOYEE'

    # Change details
    previous_value = Column(Text)  # JSON string or text representation
    new_value = Column(Text)  # JSON string or text representation

    # Request metadata
    ip_address = Column(String(45))  # IPv6 max length
    user_agent = Column(Text)

    # Human-readable description
    description = Column(Text)

    # Additional metadata
    audit_metadata = Column(JSONB)  # For additional context (e.g., affected_count for bulk operations)

    # Timestamps
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False, index=True)
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    def __repr__(self):
        return f"<AdminAuditLog(id={self.id}, admin={self.admin_user_id}, action={self.action_type}, resource={self.resource_type}:{self.resource_key})>"


class SocialInsuranceRate(Base):
    """
    Tabla de tarifas de seguros sociales (健康保険・厚生年金)
    Basada en la hoja '愛知23' del Excel
    """
    __tablename__ = "social_insurance_rates"

    id = Column(Integer, primary_key=True, index=True)

    # Rango de compensación estándar (標準報酬月額)
    min_compensation = Column(Integer, nullable=False)  # Mínimo del rango
    max_compensation = Column(Integer, nullable=False)  # Máximo del rango
    standard_compensation = Column(Integer, nullable=False)  # 標準報酬月額

    # Seguros (金額 completa, se divide entre empleado y empleador)
    health_insurance_total = Column(Integer)  # 健康保険料 (total)
    health_insurance_employee = Column(Integer)  # 健康保険料 (empleado)
    health_insurance_employer = Column(Integer)  # 健康保険料 (empleador)

    nursing_insurance_total = Column(Integer)  # 介護保険料 (total, solo >40 años)
    nursing_insurance_employee = Column(Integer)  # 介護保険料 (empleado)
    nursing_insurance_employer = Column(Integer)  # 介護保険料 (empleador)

    pension_insurance_total = Column(Integer)  # 厚生年金保険料 (total)
    pension_insurance_employee = Column(Integer)  # 厚生年金保険料 (empleado)
    pension_insurance_employer = Column(Integer)  # 厚生年金保険料 (empleador)

    # Metadata
    effective_date = Column(Date, nullable=False)  # Fecha de vigencia
    prefecture = Column(String(20), default='愛知')  # Prefectura
    notes = Column(Text)

    created_at = Column(DateTime(timezone=True), server_default=func.now())


class SystemSettings(Base):
    """
    System-wide configuration settings
    Used for admin-controlled toggles like content visibility
    """
    __tablename__ = "system_settings"

    id = Column(Integer, primary_key=True, index=True)
    key = Column(String(100), unique=True, nullable=False, index=True)
    value = Column(String(255))
    description = Column(Text)
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())
    created_at = Column(DateTime(timezone=True), server_default=func.now())


class PageVisibility(Base):
    """
    Page Visibility Settings - Control which pages are visible to users
    When a page is disabled, it shows a "Under Construction" message
    """
    __tablename__ = "page_visibility"

    id = Column(Integer, primary_key=True, index=True)
    page_key = Column(String(100), unique=True, nullable=False, index=True)  # e.g., 'timer-cards', 'candidates', 'employees'
    page_name = Column(String(100), nullable=False)  # Display name: 'タイムカード', '候補者', '従業員'
    page_name_en = Column(String(100))  # English name for reference
    is_enabled = Column(Boolean, default=True, nullable=False)  # True = visible, False = under construction
    path = Column(String(255), nullable=False)  # Route path: /dashboard/timercards
    description = Column(Text)  # Admin notes
    disabled_message = Column(String(255))  # Custom message when disabled
    last_toggled_by = Column(Integer, ForeignKey("users.id"))  # Admin who toggled this
    last_toggled_at = Column(DateTime(timezone=True))  # When it was last toggled
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())
    created_at = Column(DateTime(timezone=True), server_default=func.now())


class RolePagePermission(Base):
    """
    Role-Based Page Permissions - Control which pages each role can access
    This enables granular control over what each role (ADMIN, KEITOSAN, TANTOSHA, EMPLOYEE) can see
    """
    __tablename__ = "role_page_permissions"

    id = Column(Integer, primary_key=True, index=True)
    role_key = Column(String(50), nullable=False, index=True)  # ADMIN, KEITOSAN, TANTOSHA, EMPLOYEE
    page_key = Column(String(100), nullable=False, index=True)  # dashboard, candidates, employees, etc.
    is_enabled = Column(Boolean, default=True, nullable=False)  # True = role can access this page
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    # Unique constraint to prevent duplicate role-page combinations
    __table_args__ = (
        {"extend_existing": True},
    )


class Region(Base):
    """Regiones para gestión regional"""
    __tablename__ = "regions"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), nullable=False, unique=True)
    description = Column(Text)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    # Relationships
    employees = relationship("Employee", back_populates="current_region")


class Department(Base):
    """Departamentos para gestión organizacional"""
    __tablename__ = "departments"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), nullable=False, unique=True)
    description = Column(Text)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    # Relationships
    employees = relationship("Employee", back_populates="current_department")


class ResidenceType(Base):
    """Tipos de residencia (apartamento, casa, etc.)"""
    __tablename__ = "residence_types"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(50), nullable=False, unique=True)
    description = Column(Text)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    # Relationships
    employees = relationship("Employee", back_populates="residence_type")


class ResidenceStatus(Base):
    """Estados de residencia (visas, permisos, etc.)"""
    __tablename__ = "residence_statuses"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), nullable=False, unique=True)
    code = Column(String(20), unique=True)  # Código corto para el estado
    description = Column(Text)
    max_duration_months = Column(Integer)  # Duración máxima en meses
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    # Relationships
    employees = relationship("Employee", back_populates="residence_status")


class Workplace(Base):
    """職場 (Workplace) - Factory/Company locations where employees work"""
    __tablename__ = "workplaces"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(200), nullable=False, unique=True, index=True)  # e.g., "高雄工業 岡山"
    workplace_type = Column(String(50))  # "factory", "office", "warehouse", etc.
    company_name = Column(String(100))  # e.g., "高雄工業"
    location_name = Column(String(100))  # e.g., "岡山"
    region_id = Column(Integer, ForeignKey("regions.id"))  # Link to prefecture
    address = Column(Text)
    description = Column(Text)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    # Relationships
    region = relationship("Region", backref="workplaces")
    employees = relationship("Employee", back_populates="workplace")


# ============================================
# YUKYU (有給休暇 - PAID VACATION) MODELS
# ============================================

class YukyuBalance(Base):
    """
    有給休暇残高 (Yukyu Balance) - Tracks paid vacation days by fiscal year

    Each row represents one fiscal year's allocation of yukyu for an employee.
    Follows Japanese labor law:
    - 6 months:  10 days
    - 18 months: 11 days
    - 30 months: 12 days
    - 42 months: 14 days
    - 54 months: 16 days
    - 66+ months: 18-20 days

    Yukyus expire after 2 years (時効 - jikou).
    """
    __tablename__ = "yukyu_balances"

    id = Column(Integer, primary_key=True, index=True)
    employee_id = Column(Integer, ForeignKey("employees.id", ondelete="CASCADE"), nullable=False, index=True)

    # Year and assignment tracking
    fiscal_year = Column(Integer, nullable=False, index=True)  # 2023, 2024, 2025
    assigned_date = Column(Date, nullable=False)  # 有給発生日 - Date when yukyu was assigned
    months_worked = Column(Integer, nullable=False)  # 経過月 - Months since hire_date (6, 18, 30, 42, etc.)

    # Balance tracking (follows Excel structure)
    days_assigned = Column(Integer, nullable=False, default=0)  # 付与数 - Days assigned this year
    days_carried_over = Column(Integer, nullable=False, default=0)  # 繰越 - Carried from previous year
    days_total = Column(Integer, nullable=False, default=0)  # 保有数 - Total available (assigned + carried)
    days_used = Column(Integer, nullable=False, default=0)  # 消化日数 - Days consumed
    days_remaining = Column(Integer, nullable=False, default=0)  # 期末残高 - Balance at period end
    days_expired = Column(Integer, nullable=False, default=0)  # 時効数 - Days expired after 2 years
    days_available = Column(Integer, nullable=False, default=0)  # 時効後残 - Final available days

    # Expiration tracking
    expires_on = Column(Date, nullable=False)  # Expiration date (assigned_date + 2 years)
    status = Column(SQLEnum(YukyuStatus, name='yukyu_status'), nullable=False, default=YukyuStatus.ACTIVE)

    # Audit fields
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    notes = Column(Text)  # 備考 - Additional notes

    # Relationships
    employee = relationship("Employee", backref="yukyu_balances")
    usage_details = relationship("YukyuUsageDetail", back_populates="balance", cascade="all, delete-orphan")


class YukyuRequest(Base):
    """
    有給休暇申請 (Yukyu Request) - Yukyu request by TANTOSHA for employees

    Workflow:
    1. TANTOSHA (担当者/HR Representative) creates request for employee
    2. KEITOSAN (経理管理/Finance Manager) approves or rejects
    3. On approval, days are deducted using LIFO (newest first)
    """
    __tablename__ = "yukyu_requests"

    id = Column(Integer, primary_key=True, index=True)

    # Who and what
    employee_id = Column(Integer, ForeignKey("employees.id", ondelete="CASCADE"), nullable=False, index=True)
    requested_by_user_id = Column(Integer, ForeignKey("users.id"), nullable=False)  # TANTOSHA
    factory_id = Column(Integer, ForeignKey("factories.id"), nullable=True, index=True)  # 派遣先

    # Yukyu details
    request_type = Column(SQLEnum(RequestType, name='request_type'), nullable=False, default=RequestType.YUKYU)
    start_date = Column(Date, nullable=False)  # Yukyu start date
    end_date = Column(Date, nullable=False)  # Yukyu end date
    days_requested = Column(Numeric(4, 1), nullable=False)  # Days requested (1.0, 0.5 for hannichi)
    yukyu_available_at_request = Column(Integer, nullable=False)  # Snapshot: days available when requested

    # Request tracking
    request_date = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    status = Column(SQLEnum(RequestStatus, name='request_status'), nullable=False, default=RequestStatus.PENDING, index=True)

    # Approval/Rejection
    approved_by_user_id = Column(Integer, ForeignKey("users.id"), nullable=True)  # KEITOSAN (Finance Manager) who approved/rejected
    approval_date = Column(DateTime(timezone=True), nullable=True)
    rejection_reason = Column(Text, nullable=True)

    # Additional info
    notes = Column(Text)  # 備考 - Additional notes

    # Audit fields
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    # Relationships
    employee = relationship("Employee", backref="yukyu_requests")
    requested_by = relationship("User", backref="yukyu_requests_created", primaryjoin="YukyuRequest.requested_by_user_id==User.id", foreign_keys=[requested_by_user_id])
    approved_by = relationship("User", backref="yukyu_requests_approved", primaryjoin="YukyuRequest.approved_by_user_id==User.id", foreign_keys=[approved_by_user_id])
    factory = relationship("Factory", backref="yukyu_requests")
    usage_details = relationship("YukyuUsageDetail", back_populates="request", cascade="all, delete-orphan")


class YukyuUsageDetail(Base):
    """
    有給休暇使用明細 (Yukyu Usage Detail) - Tracks specific dates and which balance they were deducted from

    This table links:
    - YukyuRequest (the approval)
    - YukyuBalance (which fiscal year's balance was used)
    - Specific dates when yukyu was taken

    Implements LIFO deduction: newest balances are used first.
    """
    __tablename__ = "yukyu_usage_details"

    id = Column(Integer, primary_key=True, index=True)

    # Links
    request_id = Column(Integer, ForeignKey("yukyu_requests.id", ondelete="CASCADE"), nullable=False, index=True)
    balance_id = Column(Integer, ForeignKey("yukyu_balances.id", ondelete="CASCADE"), nullable=False, index=True)

    # Usage tracking
    usage_date = Column(Date, nullable=False, index=True)  # Specific date yukyu was taken (e.g., 2025年4月19日)
    days_deducted = Column(Numeric(3, 1), nullable=False, default=1.0)  # 0.5 for hannichi, 1.0 for full day

    # Audit fields
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    # Relationships
    request = relationship("YukyuRequest", back_populates="usage_details")
    balance = relationship("YukyuBalance", back_populates="usage_details")


class ApartmentAssignment(Base, SoftDeleteMixin):
    """
    アパート割り当て (Apartment Assignment) - Tracks employee apartment assignments

    This table records when an employee is assigned to an apartment, including:
    - Assignment dates (start and end)
    - Prorated rent calculations
    - Total deductions (rent + charges)

    Business rules:
    - One employee can only have ONE active assignment at a time
    - end_date = NULL means assignment is still active
    - When assignment ends, cleaning fee is automatically added
    - Prorated calculation: (monthly_rent / days_in_month) * days_occupied
    """
    __tablename__ = "apartment_assignments"

    id = Column(Integer, primary_key=True, index=True)

    # References
    apartment_id = Column(Integer, ForeignKey("apartments.id", ondelete="CASCADE"), nullable=False, index=True)
    employee_id = Column(Integer, ForeignKey("employees.id", ondelete="CASCADE"), nullable=False, index=True)

    # Assignment dates
    start_date = Column(Date, nullable=False, index=True)
    end_date = Column(Date, nullable=True, index=True)  # NULL = still active

    # Rent calculation fields
    monthly_rent = Column(Integer, nullable=False)  # Base rent at time of assignment
    days_in_month = Column(Integer)  # Days in the month (28-31)
    days_occupied = Column(Integer)  # Actual days occupied
    prorated_rent = Column(Integer)  # Calculated prorated rent
    is_prorated = Column(Boolean, default=False)  # Is it prorated or full month?

    # Total deduction (rent + all additional charges)
    total_deduction = Column(Integer, nullable=False, default=0)

    # Parking payment responsibility
    pays_parking = Column(Boolean, default=False, nullable=False)  # Indica si este empleado paga el estacionamiento

    # Contract and status
    contract_type = Column(String(50))  # Type of housing contract
    status = Column(SQLEnum(AssignmentStatus, name='assignment_status'), default=AssignmentStatus.ACTIVE, nullable=False)
    notes = Column(Text)

    # Audit timestamps
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    # Constraints
    __table_args__ = (
        CheckConstraint('end_date IS NULL OR end_date >= start_date', name='check_assignment_dates'),
        CheckConstraint('days_occupied > 0 AND days_occupied <= 31', name='check_days_occupied'),
    )

    # Relationships
    apartment = relationship("Apartment", back_populates="assignments")
    employee = relationship("Employee", backref="apartment_assignments")
    additional_charges = relationship("AdditionalCharge", back_populates="assignment", cascade="all, delete-orphan")
    rent_deductions = relationship("RentDeduction", back_populates="assignment", cascade="all, delete-orphan")


class AdditionalCharge(Base, SoftDeleteMixin):
    """
    追加料金 (Additional Charge) - Additional charges for apartment assignments

    This table tracks all additional charges beyond base rent:
    - Cleaning fees (¥20,000 default on move-out)
    - Repair charges for damages
    - Deposit deductions
    - Penalties
    - Key replacement fees
    - Other miscellaneous charges

    Business rules:
    - Charges must be approved before being included in deductions
    - Cleaning fee is automatically added when assignment ends
    - All charges are summed into assignment.total_deduction
    """
    __tablename__ = "additional_charges"

    id = Column(Integer, primary_key=True, index=True)

    # References
    assignment_id = Column(Integer, ForeignKey("apartment_assignments.id", ondelete="CASCADE"), nullable=False, index=True)
    employee_id = Column(Integer, ForeignKey("employees.id"), nullable=False, index=True)
    apartment_id = Column(Integer, ForeignKey("apartments.id"), nullable=False, index=True)

    # Charge details
    charge_type = Column(SQLEnum(ChargeType, name='charge_type'), nullable=False)
    description = Column(String(500), nullable=False)
    amount = Column(Integer, nullable=False)  # Charge amount in yen

    # Date and status
    charge_date = Column(Date, nullable=False, index=True)
    status = Column(SQLEnum(DeductionStatus, name='charge_status'), default=DeductionStatus.PENDING, nullable=False)

    # Approval workflow
    approved_by = Column(Integer, ForeignKey("users.id"))
    approved_at = Column(DateTime(timezone=True))

    # Additional notes
    notes = Column(Text)

    # Audit timestamps
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    # Relationships
    assignment = relationship("ApartmentAssignment", back_populates="additional_charges")
    employee = relationship("Employee", backref="apartment_charges")
    apartment = relationship("Apartment", backref="additional_charges")
    approver = relationship("User", backref="approved_charges")


class RentDeduction(Base, SoftDeleteMixin):
    """
    家賃控除 (Rent Deduction) - Monthly rent deductions for payroll

    This table stores the final deduction amounts to be subtracted from employee payroll:
    - Base rent (prorated or full month)
    - Sum of all additional charges
    - Total deduction amount

    Business rules:
    - One deduction record per assignment per month (UNIQUE constraint)
    - Generated automatically at month-end or manually
    - Linked to payroll processing system
    - Status tracks processing workflow (pending → processed → paid)
    """
    __tablename__ = "rent_deductions"

    id = Column(Integer, primary_key=True, index=True)

    # References
    assignment_id = Column(Integer, ForeignKey("apartment_assignments.id", ondelete="CASCADE"), nullable=False, index=True)
    employee_id = Column(Integer, ForeignKey("employees.id"), nullable=False, index=True)
    apartment_id = Column(Integer, ForeignKey("apartments.id"), nullable=False, index=True)

    # Period
    year = Column(Integer, nullable=False, index=True)
    month = Column(Integer, nullable=False, index=True)

    # Amounts
    base_rent = Column(Integer, nullable=False)  # Base or prorated rent
    additional_charges = Column(Integer, default=0)  # Sum of all charges for this period
    total_deduction = Column(Integer, nullable=False)  # Total to deduct from payroll

    # Status and processing
    status = Column(SQLEnum(DeductionStatus, name='deduction_status'), default=DeductionStatus.PENDING, nullable=False)
    processed_date = Column(Date)  # When deduction was processed in payroll
    paid_date = Column(Date)  # When deduction was actually paid

    # Notes
    notes = Column(Text)

    # Audit timestamps
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    # Constraints
    __table_args__ = (
        CheckConstraint('month >= 1 AND month <= 12', name='check_month_range'),
        UniqueConstraint('assignment_id', 'year', 'month', name='uq_assignment_year_month'),
    )

    # Relationships
    assignment = relationship("ApartmentAssignment", back_populates="rent_deductions")
    employee = relationship("Employee", backref="rent_deductions")
    apartment = relationship("Apartment", backref="rent_deductions")


class AIUsageLog(Base):
    """
    AI Gateway Usage Log - Tracks all API calls to AI providers

    用途:
    - Cost tracking and billing
    - Usage statistics and analytics
    - Rate limit enforcement
    - Performance monitoring
    - Audit trail for AI invocations

    Fields:
    - user_id: User who made the request (required)
    - provider: AI provider used (gemini, openai, claude_api, local_cli)
    - model: Specific model used (e.g., "gpt-4", "gemini-pro")
    - prompt_tokens: Input tokens used (for cost calculation)
    - completion_tokens: Output tokens used (for cost calculation)
    - total_tokens: Sum of prompt + completion tokens
    - estimated_cost: Estimated cost in USD
    - status: Request status (success, error, rate_limited, timeout)
    - error_message: Error details if status is error
    - response_time_ms: Time taken to complete request
    - metadata: Additional data (model params, temperature, etc.)
    - created_at: Timestamp of request
    """
    __tablename__ = "ai_usage_logs"

    id = Column(Integer, primary_key=True, index=True)

    # References
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)

    # Provider and model info
    provider = Column(SQLEnum(AIProvider, name='ai_provider'), nullable=False, index=True)
    model = Column(String(100), nullable=False, index=True)  # e.g., "gpt-4", "gemini-pro"

    # Token counts
    prompt_tokens = Column(Integer, default=0)
    completion_tokens = Column(Integer, default=0)
    total_tokens = Column(Integer, default=0)

    # Cost tracking
    estimated_cost = Column(Numeric(10, 4), default=0, nullable=False)  # USD

    # Request status
    status = Column(String(20), default="success", nullable=False, index=True)  # success, error, rate_limited, timeout
    error_message = Column(Text)  # Error details if failed

    # Performance
    response_time_ms = Column(Integer)  # Time to complete in milliseconds

    # Additional metadata
    extra_metadata = Column(JSONB, default={})  # temperature, max_tokens, custom params, etc.

    # Timestamps
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False, index=True)

    # Relationships
    user = relationship("User", backref="ai_usage_logs")

    # Constraints
    __table_args__ = (
        CheckConstraint('prompt_tokens >= 0', name='check_prompt_tokens_positive'),
        CheckConstraint('completion_tokens >= 0', name='check_completion_tokens_positive'),
        CheckConstraint('total_tokens >= 0', name='check_total_tokens_positive'),
        CheckConstraint('estimated_cost >= 0', name='check_cost_positive'),
    )

    def __repr__(self):
        return f"<AIUsageLog(id={self.id}, user_id={self.user_id}, provider={self.provider}, tokens={self.total_tokens}, cost=${self.estimated_cost})>"


class AIBudget(Base):
    """
    AI Gateway Budget - Per-user spending limits and controls

    用途:
    - Control spending by user and provider
    - Monthly and daily budget limits
    - Alert when approaching budget threshold
    - Prevent calls if budget exceeded
    - Track budget usage and reset dates

    Fields:
    - user_id: User this budget applies to (required, unique)
    - monthly_budget_usd: Maximum spending per month
    - daily_budget_usd: Optional maximum spending per day
    - spent_this_month: Accumulated cost this month
    - spent_today: Accumulated cost today
    - month_reset_date: When monthly budget resets
    - day_reset_date: When daily budget resets
    - alert_threshold: Percentage (e.g., 80%) to trigger alert
    - webhook_url: Endpoint to POST budget alerts to
    - is_active: Whether budget enforcement is enabled
    - created_at, updated_at: Timestamps
    """
    __tablename__ = "ai_budgets"

    id = Column(Integer, primary_key=True, index=True)

    # References
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True, unique=True)

    # Budget limits (in USD)
    monthly_budget_usd = Column(Numeric(10, 2), nullable=False)  # e.g., 100.00
    daily_budget_usd = Column(Numeric(10, 2))  # Optional daily limit

    # Spending tracking
    spent_this_month = Column(Numeric(10, 4), default=0, nullable=False)
    spent_today = Column(Numeric(10, 4), default=0, nullable=False)

    # Reset dates
    month_reset_date = Column(Date, nullable=False, index=True)  # Next monthly reset
    day_reset_date = Column(Date, nullable=False, index=True)  # Next daily reset

    # Alert settings
    alert_threshold = Column(Integer, default=80, nullable=False)  # Percentage (0-100)
    webhook_url = Column(String(500))  # POST alerts to this URL

    # Status
    is_active = Column(Boolean, default=True, nullable=False, index=True)

    # Timestamps
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at = Column(DateTime(timezone=True), onupdate=func.now(), nullable=False)

    # Relationships
    user = relationship("User", backref="ai_budget")

    # Constraints
    __table_args__ = (
        CheckConstraint('monthly_budget_usd > 0', name='check_monthly_budget_positive'),
        CheckConstraint('daily_budget_usd IS NULL OR daily_budget_usd > 0', name='check_daily_budget_positive'),
        CheckConstraint('spent_this_month >= 0', name='check_spent_month_positive'),
        CheckConstraint('spent_today >= 0', name='check_spent_today_positive'),
        CheckConstraint('alert_threshold >= 0 AND alert_threshold <= 100', name='check_threshold_range'),
    )

    def __repr__(self):
        return f"<AIBudget(user_id={self.user_id}, monthly_budget=${self.monthly_budget_usd}, spent_month=${self.spent_this_month})>"

    @property
    def monthly_remaining(self) -> Decimal:
        """Calculate remaining monthly budget"""
        return Decimal(str(self.monthly_budget_usd)) - self.spent_this_month

    @property
    def daily_remaining(self) -> Decimal:
        """Calculate remaining daily budget (if daily limit set)"""
        if not self.daily_budget_usd:
            return None
        return Decimal(str(self.daily_budget_usd)) - self.spent_today

    @property
    def monthly_percentage_used(self) -> float:
        """Calculate percentage of monthly budget used"""
        if self.monthly_budget_usd == 0:
            return 0.0
        return float((self.spent_this_month / Decimal(str(self.monthly_budget_usd))) * 100)

    @property
    def daily_percentage_used(self) -> float:
        """Calculate percentage of daily budget used (if daily limit set)"""
        if not self.daily_budget_usd or self.daily_budget_usd == 0:
            return 0.0
        return float((self.spent_today / Decimal(str(self.daily_budget_usd))) * 100)

    @property
    def should_alert_monthly(self) -> bool:
        """Check if monthly alert threshold reached"""
        return self.monthly_percentage_used >= self.alert_threshold

    @property
    def should_alert_daily(self) -> bool:
        """Check if daily alert threshold reached"""
        if not self.daily_budget_usd:
            return False
        return self.daily_percentage_used >= self.alert_threshold

    def can_afford(self, estimated_cost: Decimal) -> bool:
        """Check if user can afford this API call"""
        if not self.is_active:
            return True  # Inactive budgets don't block calls

        # Check monthly limit
        if self.spent_this_month + estimated_cost > Decimal(str(self.monthly_budget_usd)):
            return False

        # Check daily limit if set
        if self.daily_budget_usd:
            if self.spent_today + estimated_cost > Decimal(str(self.daily_budget_usd)):
                return False

        return True

