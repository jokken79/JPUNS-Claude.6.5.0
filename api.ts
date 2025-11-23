
// ============================================
// CANDIDATE TYPES
// ============================================

export interface Candidate {
  id: number;
  rirekisho_id: string;
  reception_date?: string;
  arrival_date?: string;
  full_name_kanji?: string;
  full_name_kana?: string;
  full_name_roman?: string;
  gender?: string;
  date_of_birth?: string;
  photo_url?: string;
  photo_data_url?: string;
  nationality?: string;
  marital_status?: string;
  hire_date?: string;
  applicant_id?: string;
  postal_code?: string;
  current_address?: string;
  address?: string;
  address_banchi?: string;
  address_building?: string;
  registered_address?: string;
  phone?: string;
  mobile?: string;
  email?: string;
  passport_number?: string;
  passport_expiry?: string;
  residence_status?: string;
  residence_expiry?: string;
  residence_card_number?: string;
  license_number?: string;
  license_expiry?: string;
  car_ownership?: string;
  voluntary_insurance?: string;
  forklift_license?: string;
  tama_kake?: string;
  mobile_crane_under_5t?: string;
  mobile_crane_over_5t?: string;
  gas_welding?: string;
  family_name_1?: string;
  family_relation_1?: string;
  family_age_1?: number;
  family_residence_1?: string;
  family_separate_address_1?: string;
  family_dependent_1?: string;
  family_name_2?: string;
  family_relation_2?: string;
  family_age_2?: number;
  family_residence_2?: string;
  family_separate_address_2?: string;
  family_dependent_2?: string;
  family_name_3?: string;
  family_relation_3?: string;
  family_age_3?: number;
  family_residence_3?: string;
  family_separate_address_3?: string;
  family_dependent_3?: string;
  family_name_4?: string;
  family_relation_4?: string;
  family_age_4?: number;
  family_residence_4?: string;
  family_separate_address_4?: string;
  family_dependent_4?: string;
  family_name_5?: string;
  family_relation_5?: string;
  family_age_5?: number;
  family_residence_5?: string;
  family_separate_address_5?: string;
  family_dependent_5?: string;
  work_history_company_7?: string;
  work_history_entry_company_7?: string;
  work_history_exit_company_7?: string;
  exp_nc_lathe?: boolean;
  exp_lathe?: boolean;
  exp_press?: boolean;
  exp_forklift?: boolean;
  exp_packing?: boolean;
  exp_welding?: boolean;
  exp_car_assembly?: boolean;
  exp_car_line?: boolean;
  exp_car_inspection?: boolean;
  exp_electronic_inspection?: boolean;
  exp_food_processing?: boolean;
  exp_casting?: boolean;
  exp_line_leader?: boolean;
  exp_painting?: boolean;
  exp_other?: string;
  bento_lunch_dinner?: string;
  bento_lunch_only?: string;
  bento_dinner_only?: string;
  bento_bring_own?: string;
  lunch_preference?: string;
  commute_method?: string;
  commute_time_oneway?: number;
  interview_result?: string;
  antigen_test_kit?: string;
  antigen_test_date?: string;
  covid_vaccine_status?: string;
  language_skill_exists?: string;
  language_skill_1?: string;
  language_skill_2?: string;
  japanese_qualification?: string;
  japanese_level?: string;
  jlpt_taken?: string;
  jlpt_date?: string;
  jlpt_score?: number;
  jlpt_scheduled?: string;
  qualification_1?: string;
  qualification_2?: string;
  qualification_3?: string;
  major?: string;
  height?: number;
  weight?: number;
  clothing_size?: string;
  waist?: number;
  shoe_size?: number;
  blood_type?: string;
  vision_right?: number;
  vision_left?: number;
  dominant_hand?: string;
  allergy_exists?: string;
  glasses?: string;
  listening_level?: string;
  speaking_level?: string;
  emergency_contact_name?: string;
  emergency_contact_relation?: string;
  emergency_contact_phone?: string;
  safety_shoes?: string;
  read_katakana?: string;
  read_hiragana?: string;
  read_kanji?: string;
  write_katakana?: string;
  write_hiragana?: string;
  write_kanji?: string;
  can_speak?: string;
  can_understand?: string;
  can_read_kana?: string;
  can_write_kana?: string;
  age?: number;
  ocr_notes?: string;
  status: CandidateStatus;
  created_at: string;
  updated_at?: string;
  approved_by?: number;
  approved_at?: string;
}

export interface CandidateCreateData {
  rirekisho_id: string;
  reception_date?: string;
  arrival_date?: string;
  full_name_kanji?: string;
  full_name_kana?: string;
  full_name_roman?: string;
  gender?: string;
  date_of_birth?: string;
  photo_url?: string;
  photo_data_url?: string;
  nationality?: string;
  marital_status?: string;
  hire_date?: string;
  postal_code?: string;
  current_address?: string;
  address?: string;
  address_banchi?: string;
  address_building?: string;
  phone?: string;
  mobile?: string;
  email?: string;
  passport_number?: string;
  passport_expiry?: string;
  residence_status?: string;
  residence_expiry?: string;
  residence_card_number?: string;
  license_number?: string;
  license_expiry?: string;
  car_ownership?: string;
  voluntary_insurance?: string;
  forklift_license?: string;
  tama_kake?: string;
  mobile_crane_under_5t?: string;
  mobile_crane_over_5t?: string;
  gas_welding?: string;
  emergency_contact_name?: string;
  emergency_contact_relation?: string;
  emergency_contact_phone?: string;
  [key: string]: any;
}

export interface CandidateListParams extends PaginationParams {
  status_filter?: string;
}

// ============================================
// EMPLOYEE TYPES
// ============================================

export interface Employee {
  id: number;
  hakenmoto_id: number;
  rirekisho_id?: string;
  factory_id?: string;
  company_name?: string;
  plant_name?: string;
  hakensaki_shain_id?: string;
  full_name_kanji: string;
  full_name_kana?: string;
  photo_url?: string;
  photo_data_url?: string;
  date_of_birth?: string;
  gender?: string;
  nationality?: string;
  zairyu_card_number?: string;
  zairyu_expire_date?: string;
  address?: string;
  current_address?: string;
  address_banchi?: string;
  address_building?: string;
  phone?: string;
  email?: string;
  emergency_contact_name?: string;
  emergency_contact_phone?: string;
  emergency_contact_relationship?: string;
  hire_date?: string;
  current_hire_date?: string;
  jikyu: number;
  jikyu_revision_date?: string;
  position?: string;
  contract_type?: string;
  assignment_location?: string;
  assignment_line?: string;
  job_description?: string;
  hourly_rate_charged?: number;
  billing_revision_date?: string;
  profit_difference?: number;
  standard_compensation?: number;
  health_insurance?: number;
  nursing_insurance?: number;
  pension_insurance?: number;
  social_insurance_date?: string;
  visa_type?: string;
  visa_renewal_alert?: boolean;
  visa_alert_days?: number;
  license_type?: string;
  license_expire_date?: string;
  commute_method?: string;
  optional_insurance_expire?: string;
  japanese_level?: string;
  career_up_5years?: boolean;
  entry_request_date?: string;
  notes?: string;
  postal_code?: string;
  apartment_id?: number;
  apartment_start_date?: string;
  apartment_move_out_date?: string;
  apartment_rent?: number;
  is_corporate_housing?: boolean;
  yukyu_total: number;
  yukyu_used: number;
  yukyu_remaining: number;
  current_status?: string;
  is_active: boolean;
  termination_date?: string;
  termination_reason?: string;
  created_at: string;
  updated_at?: string;
}

export interface EmployeeCreateData {
  rirekisho_id: string;
  factory_id: string;
  hakensaki_shain_id?: string;
  hire_date: string;
  jikyu: number;
  position?: string;
  contract_type?: string;
  full_name_kanji: string;
  full_name_kana?: string;
  date_of_birth?: string;
  gender?: string;
  nationality?: string;
  zairyu_card_number?: string;
  zairyu_expire_date?: string;
  address?: string;
  current_address?: string;
  address_banchi?: string;
  address_building?: string;
  phone?: string;
  email?: string;
  emergency_contact_name?: string;
  emergency_contact_phone?: string;
  emergency_contact_relationship?: string;
  apartment_id?: number;
  apartment_start_date?: string;
  apartment_rent?: number;
  is_corporate_housing?: boolean;
}

export interface EmployeeListParams extends PaginationParams {
  factory_id?: string;
  status?: string;
}

// ============================================
// FACTORY TYPES
// ============================================

export interface ShiftConfig {
  shift_name: string;
  start_time: string;
  end_time: string;
  break_minutes: number;
}

export interface OvertimeRulesConfig {
  normal_rate_multiplier: number;
  night_rate_multiplier: number;
  holiday_rate_multiplier: number;
  night_start: string;
  night_end: string;
}

export interface BonusesConfig {
  attendance_bonus: number;
  perfect_attendance_bonus: number;
  transportation_allowance: number;
  meal_allowance: number;
  housing_allowance: number;
  other_allowances?: Record<string, any>;
}

export interface HolidaysConfig {
  weekly_holidays: string[];
  public_holidays: boolean;
  company_holidays: string[];
}

export interface AttendanceRulesConfig {
  late_penalty: number;
  absence_penalty: number;
  early_leave_penalty: number;
  grace_period_minutes: number;
  require_advance_notice: boolean;
}

export interface FactoryConfig {
  shifts: ShiftConfig[];
  overtime_rules: OvertimeRulesConfig;
  bonuses: BonusesConfig;
  holidays: HolidaysConfig;
  attendance_rules: AttendanceRulesConfig;
}

export interface Factory {
  id: number;
  factory_id: string;
  name: string;
  company_name?: string;
  plant_name?: string;
  address?: string;
  phone?: string;
  contact_person?: string;
  config?: FactoryConfig;
  is_active: boolean;
  created_at: string;
  updated_at?: string;
  employees_count?: number;
}

export interface FactoryCreateData {
  factory_id: string;
  name: string;
  company_name?: string;
  plant_name?: string;
  address?: string;
  phone?: string;
  contact_person?: string;
  config?: FactoryConfig;
}

// ============================================
// TIMER CARD TYPES
// ============================================

export interface TimerCard {
  id: number;
  hakenmoto_id?: number;
  employee_id?: number;
  factory_id?: string;
  work_date: string;
  shift_type?: ShiftType;
  clock_in?: string;
  clock_out?: string;
  break_minutes: number;
  overtime_minutes: number;
  regular_hours: number;
  overtime_hours: number;
  night_hours: number;
  holiday_hours: number;
  notes?: string;
  is_approved: boolean;
  approved_by?: number;
  approved_at?: string;
  created_at: string;
  updated_at?: string;
}

export interface TimerCardCreateData {
  employee_id: number;
  factory_id: string;
  work_date: string;
  clock_in?: string;
  clock_out?: string;
  break_minutes?: number;
  shift_type?: ShiftType;
  notes?: string;
}

export interface TimerCardListParams extends PaginationParams {
  employee_id?: number;
  factory_id?: string;
  start_date?: string;
  end_date?: string;
  is_approved?: boolean;
}

// ============================================
// SALARY TYPES
// ============================================

export interface SalaryCalculation {
  id: number;
  employee_id: number;
  month: number;
  year: number;
  total_regular_hours: number;
  total_overtime_hours: number;
  total_night_hours: number;
  total_holiday_hours: number;
  base_salary: number;
  overtime_pay: number;
  night_pay: number;
  holiday_pay: number;
  bonus: number;
  gasoline_allowance: number;
  apartment_deduction: number;
  other_deductions: number;
  gross_salary: number;
  net_salary: number;
  factory_payment: number;
  company_profit: number;
  is_paid: boolean;
  paid_at?: string;
  created_at: string;
}

export interface SalaryCalculationCreateData {
  employee_id: number;
  month: number;
  year: number;
  bonus?: number;
  gasoline_allowance?: number;
  other_deductions?: number;
  notes?: string;
}

export interface SalaryListParams extends PaginationParams {
  employee_id?: number;
  factory_id?: string;
  month?: number;
  year?: number;
  is_paid?: boolean;
}

// ============================================
// REQUEST TYPES
// ============================================

export interface Request {
  id: number;
  employee_id: number;
  request_type: RequestType;
  status: RequestStatus;
  start_date: string;
  end_date: string;
  total_days?: number;
  reason?: string;
  notes?: string;
  approved_by?: number;
  approved_at?: string;
  created_at: string;
  updated_at?: string;
}

export interface RequestCreateData {
  employee_id: number;
  request_type: RequestType;
  start_date: string;
  end_date: string;
  reason?: string;
  notes?: string;
}

export interface RequestListParams extends PaginationParams {
  employee_id?: number;
  request_type?: RequestType;
  status?: RequestStatus;
}

// ============================================
// DASHBOARD TYPES
// ============================================

export interface DashboardStats {
  total_candidates: number;
  pending_candidates: number;
  total_employees: number;
  active_employees: number;
  total_factories: number;
  pending_requests: number;
  pending_timer_cards: number;
  total_salary_current_month: number;
  total_profit_current_month: number;
}

export interface FactoryDashboard {
  factory_id: string;
  factory_name: string;
  total_employees: number;
  active_employees: number;
  current_month_hours: number;
  current_month_salary: number;
  current_month_revenue: number;
  current_month_profit: number;
  profit_margin: number;
}

export interface EmployeeAlert {
  employee_id: number;
  employee_name: string;
  alert_type: string;
  alert_date: string;
  days_until: number;
  message: string;
}

export interface MonthlyTrend {
  month: string;
  total_employees: number;
  total_hours: number;
  total_salary: number;
  total_revenue: number;
  total_profit: number;
}

export interface TopPerformer {
  employee_id: number;
  employee_name: string;
  factory_name: string;
  total_hours: number;
  attendance_rate: number;
  performance_score: number;
}

export interface RecentActivity {
  activity_type: string;
  description: string;
  timestamp: string;
  user?: string;
}

// ============================================
// APARTMENT TYPES
// ============================================

export interface Apartment {
  id: number;
  apartment_code: string;
  address: string;
  monthly_rent: number;
  capacity?: number;
  is_available: boolean;
  notes?: string;
  created_at: string;
}

// ============================================
// ADDITIONAL HELPER TYPES
// ============================================

export interface ApiError {
  error: string;
  message: string;
  status_code: number;
  details?: any;
}

export interface OCRData {
  full_name_kanji?: string;
  full_name_kana?: string;
  date_of_birth?: string;
  gender?: string;
  address?: string;
  phone?: string;
  email?: string;
  raw_text?: string;
}

export interface DocumentUpload {
  document_id: number;
  file_name: string;
  file_path: string;
  ocr_data?: OCRData;
  message: string;
}

export interface TimerCardOCRData {
  page_number: number;
  work_date: string;
  employee_name_ocr: string;
  employee_matched?: {
    hakenmoto_id?: number;
    full_name_kanji: string;
    confidence: number;
  };
  clock_in: string;
  clock_out: string;
  break_minutes: number;
  validation_errors: string[];
  confidence_score: number;
}

export interface TimerCardUploadResponse {
  file_name: string;
  pages_processed: number;
  records_found: number;
  ocr_data: TimerCardOCRData[];
  processing_errors: any[];
  message: string;
}
