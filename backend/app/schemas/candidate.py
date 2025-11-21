"""
Candidate Schemas - Complete Candidate Fields (履歴書/Rirekisho)
"""
from pydantic import BaseModel, EmailStr, Field, ConfigDict
from typing import Optional, List, Dict, Any
from datetime import date, datetime
from app.models.models import CandidateStatus, InterviewResult


class CandidateBase(BaseModel):
    """Base candidate schema with all candidate fields"""
    # 受付日・来日 (Reception & Arrival Dates)
    reception_date: Optional[date] = None
    arrival_date: Optional[date] = None

    # 基本情報 (Basic Information)
    full_name_kanji: Optional[str] = None
    full_name_kana: Optional[str] = None
    full_name_roman: Optional[str] = None
    gender: Optional[str] = None
    date_of_birth: Optional[date] = None
    photo_url: Optional[str] = None
    photo_data_url: Optional[str] = None  # Base64 photo data
    nationality: Optional[str] = None
    marital_status: Optional[str] = None
    hire_date: Optional[date] = None
    applicant_id: Optional[str] = None

    # 住所情報 (Address Information)
    postal_code: Optional[str] = None
    current_address: Optional[str] = None
    address: Optional[str] = None
    address_banchi: Optional[str] = None
    address_building: Optional[str] = None
    registered_address: Optional[str] = None

    # 連絡先 (Contact Information)
    phone: Optional[str] = None
    mobile: Optional[str] = None
    email: Optional[EmailStr] = None

    # パスポート情報 (Passport Information)
    passport_number: Optional[str] = None
    passport_expiry: Optional[date] = None

    # 在留カード情報 (Residence Card Information)
    residence_status: Optional[str] = None
    residence_expiry: Optional[date] = None
    residence_card_number: Optional[str] = None

    # 運転免許情報 (Driver's License Information)
    license_number: Optional[str] = None
    license_expiry: Optional[date] = None
    car_ownership: Optional[str] = None
    voluntary_insurance: Optional[str] = None

    # 資格・免許 (Qualifications & Licenses)
    forklift_license: Optional[str] = None
    tama_kake: Optional[str] = None
    mobile_crane_under_5t: Optional[str] = None
    mobile_crane_over_5t: Optional[str] = None
    gas_welding: Optional[str] = None

    # 家族構成 (Family Members) - 5 members
    family_name_1: Optional[str] = None
    family_relation_1: Optional[str] = None
    family_age_1: Optional[int] = None
    family_residence_1: Optional[str] = None
    family_separate_address_1: Optional[str] = None

    family_name_2: Optional[str] = None
    family_relation_2: Optional[str] = None
    family_age_2: Optional[int] = None
    family_residence_2: Optional[str] = None
    family_separate_address_2: Optional[str] = None

    family_name_3: Optional[str] = None
    family_relation_3: Optional[str] = None
    family_age_3: Optional[int] = None
    family_residence_3: Optional[str] = None
    family_separate_address_3: Optional[str] = None

    family_name_4: Optional[str] = None
    family_relation_4: Optional[str] = None
    family_age_4: Optional[int] = None
    family_residence_4: Optional[str] = None
    family_separate_address_4: Optional[str] = None

    family_name_5: Optional[str] = None
    family_relation_5: Optional[str] = None
    family_age_5: Optional[int] = None
    family_residence_5: Optional[str] = None
    family_separate_address_5: Optional[str] = None

    # 職歴 (Work History)
    work_history_company_7: Optional[str] = None
    work_history_entry_company_7: Optional[str] = None
    work_history_exit_company_7: Optional[str] = None

    # 経験作業 (Work Experience)
    exp_nc_lathe: Optional[bool] = None
    exp_lathe: Optional[bool] = None
    exp_press: Optional[bool] = None
    exp_forklift: Optional[bool] = None
    exp_packing: Optional[bool] = None
    exp_welding: Optional[bool] = None
    exp_car_assembly: Optional[bool] = None
    exp_car_line: Optional[bool] = None
    exp_car_inspection: Optional[bool] = None
    exp_electronic_inspection: Optional[bool] = None
    exp_food_processing: Optional[bool] = None
    exp_casting: Optional[bool] = None
    exp_line_leader: Optional[bool] = None
    exp_painting: Optional[bool] = None
    exp_other: Optional[str] = None

    # お弁当 (Lunch/Bento Options)
    bento_lunch_dinner: Optional[str] = None
    bento_lunch_only: Optional[str] = None
    bento_dinner_only: Optional[str] = None
    bento_bring_own: Optional[str] = None

    # 通勤 (Commute)
    commute_method: Optional[str] = None
    commute_time_oneway: Optional[int] = None

    # 面接・検査 (Interview & Tests)
    interview_result: Optional[InterviewResult] = None  # 👍👎⏳
    antigen_test_kit: Optional[str] = None
    antigen_test_date: Optional[date] = None
    covid_vaccine_status: Optional[str] = None

    # 語学スキル (Language Skills)
    language_skill_exists: Optional[str] = None
    language_skill_1: Optional[str] = None
    language_skill_2: Optional[str] = None

    # 日本語能力 (Japanese Language Ability)
    japanese_qualification: Optional[str] = None
    japanese_level: Optional[str] = None
    jlpt_taken: Optional[str] = None
    jlpt_date: Optional[date] = None
    jlpt_score: Optional[int] = None
    jlpt_scheduled: Optional[str] = None

    # 有資格 (Qualifications)
    qualification_1: Optional[str] = None
    qualification_2: Optional[str] = None
    qualification_3: Optional[str] = None

    # 学歴 (Education)
    major: Optional[str] = None

    # 身体情報 (Physical Information)
    blood_type: Optional[str] = None
    dominant_hand: Optional[str] = None
    allergy_exists: Optional[str] = None

    # 日本語能力詳細 (Japanese Ability Details)
    listening_level: Optional[str] = None
    speaking_level: Optional[str] = None

    # 緊急連絡先 (Emergency Contact)
    emergency_contact_name: Optional[str] = None
    emergency_contact_relation: Optional[str] = None
    emergency_contact_phone: Optional[str] = None

    # 作業用品 (Work Equipment)
    safety_shoes: Optional[str] = None
    lunch_preference: Optional[str] = None
    glasses: Optional[str] = None

    # 読み書き能力 (Reading & Writing Ability)
    read_katakana: Optional[str] = None
    read_hiragana: Optional[str] = None
    read_kanji: Optional[str] = None
    write_katakana: Optional[str] = None
    write_hiragana: Optional[str] = None
    write_kanji: Optional[str] = None

    # 会話能力 (Conversation Ability)
    can_speak: Optional[str] = None
    can_understand: Optional[str] = None
    can_read_kana: Optional[str] = None
    can_write_kana: Optional[str] = None

    # OCR metadata
    ocr_notes: Optional[str] = None
    photo_data_url: Optional[str] = None

    # Legacy compatibility
    address: Optional[str] = None


class CandidateCreate(CandidateBase):
    """Create candidate from candidate data"""
    pass


class CandidateUpdate(CandidateBase):
    """Update candidate"""
    status: Optional[CandidateStatus] = None


class CandidateResponse(CandidateBase):
    """Candidate response with all candidate fields"""
    id: int
    rirekisho_id: str  # Changed from uns_id
    status: CandidateStatus
    created_at: datetime
    updated_at: Optional[datetime]
    approved_by: Optional[int]
    approved_at: Optional[datetime]

    model_config = ConfigDict(from_attributes=True)


class OCRData(BaseModel):
    """OCR extracted data"""
    full_name_kanji: Optional[str] = None
    full_name_kana: Optional[str] = None
    date_of_birth: Optional[str] = None
    gender: Optional[str] = None
    address: Optional[str] = None
    phone: Optional[str] = None
    email: Optional[str] = None
    raw_text: Optional[str] = None


class DocumentUpload(BaseModel):
    """Document upload response"""
    document_id: int
    file_name: str
    file_path: str
    ocr_data: Optional[OCRData]
    message: str


class CandidateApprove(BaseModel):
    """Approve candidate"""
    notes: Optional[str] = None
    promote_to_employee: bool = True
    factory_id: Optional[str] = None
    hire_date: Optional[date] = None
    jikyu: Optional[int] = None
    position: Optional[str] = None
    contract_type: Optional[str] = None
    hakensaki_shain_id: Optional[str] = None


class CandidateReject(BaseModel):
    """Reject candidate"""
    reason: str


class RirekishoFormCreate(BaseModel):
    """Payload for saving the raw rirekisho form into the database."""

    applicant_id: Optional[str] = None
    rirekisho_id: Optional[str] = None
    form_data: Dict[str, Any]
    photo_data_url: Optional[str] = None
    azure_metadata: Optional[Dict[str, Any]] = None


class CandidateFormResponse(BaseModel):
    """Response model for stored rirekisho form snapshots."""

    id: int
    candidate_id: Optional[int] = None
    applicant_id: Optional[str] = None
    rirekisho_id: Optional[str] = None
    form_data: Dict[str, Any]
    photo_data_url: Optional[str] = None
    azure_metadata: Optional[Dict[str, Any]] = None
    created_at: datetime
    updated_at: Optional[datetime] = None

    model_config = ConfigDict(from_attributes=True)


class CandidateEvaluation(BaseModel):
    """Quick evaluation for candidate (thumbs up/down for interview + approval)"""
    # Interview result (Required) - 👍👎
    interview_result: InterviewResult = Field(..., description="Interview result: passed (👍) or failed (👎)")

    # Approval decision (based on interview)
    approved: bool  # True = approved (合格), False = pending (審査中)
    notes: Optional[str] = Field(None, max_length=500)

    model_config = ConfigDict(json_schema_extra={
        "example": {
            "interview_result": "passed",
            "approved": True,
            "notes": "良い候補者。日本語堪能"
        }
    })
