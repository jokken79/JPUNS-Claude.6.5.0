export enum UserRole {
  SUPER_ADMIN = 'SUPER_ADMIN',
  ADMIN = 'ADMIN',
  KEITOSAN = 'KEITOSAN',
  TANTOSHA = 'TANTOSHA',
  COORDINATOR = 'COORDINATOR',
  KANRININSHA = 'KANRININSHA',
  EMPLOYEE = 'EMPLOYEE',
  CONTRACT_WORKER = 'CONTRACT_WORKER',
}

export enum CandidateStatus {
  PENDING = 'pending',
  APPROVED = 'approved',
  REJECTED = 'rejected',
  HIRED = 'hired',
}

export enum InterviewResult {
  PASSED = 'passed',   // 👍
  FAILED = 'failed',   // 👎
  PENDING = 'pending', // ⏳
}

export enum DocumentType {
  RIREKISHO = 'rirekisho',
  ZAIRYU_CARD = 'zairyu_card',
  LICENSE = 'license',
  CONTRACT = 'contract',
  OTHER = 'other',
}

export enum RequestType {
  YUKYU = 'yukyu',
  HANKYU = 'hankyu',
  IKKIKOKOKU = 'ikkikokoku',
  TAISHA = 'taisha',
  NYUUSHA = 'nyuusha',  // 入社連絡票 - New hire notification form
}

export enum RequestStatus {
  PENDING = 'pending',
  APPROVED = 'approved',
  REJECTED = 'rejected',
  COMPLETED = 'completed',  // 済 - Completed/Archived (for 入社連絡票)
}

export enum ShiftType {
  ASA = 'asa',
  HIRU = 'hiru',
  YORU = 'yoru',
  OTHER = 'other',
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  page_size: number;
  total_pages: number;
  has_next: boolean;
  has_previous: boolean;
}

export interface PaginationParams {
  page?: number;
  page_size?: number;
  sort_by?: string;
  sort_order?: 'asc' | 'desc';
  search?: string;
}

export interface AuthResponse {
  access_token: string;
  refresh_token?: string;
  token_type: string;
  expires_in: number;
  user: User;
}

export interface User {
  id: number;
  username: string;
  email: string;
  role: UserRole;
  full_name?: string;
  is_active: boolean;
  created_at: string;
  updated_at?: string;
}

export interface UserCreate {
  username: string;
  email: string;
  password: string;
  full_name?: string;
  role?: UserRole;
}

export interface UserUpdate {
  email?: string;
  full_name?: string;
  password?: string;
}

export interface Candidate {
  id: number;
  rirekisho_id?: string;
  full_name_roman: string;
  full_name_kanji?: string;
  full_name_kana?: string;
  date_of_birth?: string;
  age?: number;
  gender?: string;
  nationality?: string;
  phone?: string;
  email?: string;
  address?: string;
  photo_data_url?: string;
  status: CandidateStatus | string;
  interview_result?: InterviewResult | string;  // 👍👎⏳ Interview result
  created_at: string;
  updated_at?: string;
  [key: string]: any;
}

export interface CandidateCreateData {
  full_name_roman: string;
  full_name_kanji?: string;
  date_of_birth?: string;
  gender?: string;
  nationality?: string;
  phone?: string;
  email?: string;
  address?: string;
}

export interface CandidateUpdateData extends Partial<CandidateCreateData> {
  status?: CandidateStatus;
  notes?: string;
  [key: string]: unknown;
}

export interface CandidateListParams extends PaginationParams {
  status?: CandidateStatus;
  search?: string;
}

export interface Employee {
  id: number;
  employee_id: string;
  full_name_roman: string;
  full_name_kanji?: string;
  date_of_birth?: string;
  email?: string;
  phone?: string;
  factory_id?: number;
  apartment_id?: number;
  hire_date?: string;
  status?: string;
  created_at: string;
  updated_at?: string;
  [key: string]: any;
}

export interface EmployeeCreateData {
  employee_id: string;
  full_name_roman: string;
  full_name_kanji?: string;
  date_of_birth?: string;
  email?: string;
  phone?: string;
  factory_id?: number;
  apartment_id?: number;
  hire_date?: string;
}

export interface EmployeeListParams extends PaginationParams {
  factory_id?: number;
  status?: string;
  search?: string;
}

export interface Factory {
  id: number;
  name: string;
  name_kanji?: string;
  address?: string;
  contact_person?: string;
  contact_email?: string;
  contact_phone?: string;
  status?: string;
  created_at: string;
  updated_at?: string;
  [key: string]: any;
}

export interface FactoryCreateData {
  name: string;
  name_kanji?: string;
  address?: string;
  contact_person?: string;
  contact_email?: string;
  contact_phone?: string;
}

export interface TimerCard {
  id: number;
  hakenmoto_id?: number;
  employee_id?: number;
  factory_id?: string;
  work_date: string;  // Changed from 'date' to match backend
  shift_type?: ShiftType;
  clock_in?: string;
  clock_out?: string;
  break_minutes?: number;  // Changed from 'break_duration' to match backend
  overtime_minutes?: number;
  // Calculated hours
  regular_hours?: number;
  overtime_hours?: number;
  night_hours?: number;
  holiday_hours?: number;
  // Approval fields
  notes?: string;
  is_approved?: boolean;
  approved_by?: number;
  approved_at?: string;
  // Timestamps
  created_at: string;
  updated_at?: string;
  [key: string]: any;
}

export interface TimerCardCreateData {
  hakenmoto_id?: number;
  employee_id?: number;
  factory_id?: string;
  work_date: string;  // Changed from 'date' to match backend
  shift_type?: ShiftType;
  clock_in?: string;
  clock_out?: string;
  break_minutes?: number;  // Changed from 'break_duration' to match backend
  overtime_minutes?: number;
  notes?: string;
}

export interface TimerCardUpdateData {
  work_date?: string;
  shift_type?: ShiftType;
  clock_in?: string;
  clock_out?: string;
  break_minutes?: number;
  overtime_minutes?: number;
  notes?: string;
}

export interface TimerCardApproveData {
  timer_card_ids: number[];
}

export interface TimerCardListParams extends PaginationParams {
  employee_id?: number;
  hakenmoto_id?: number;
  factory_id?: string;
  is_approved?: boolean;
  date_from?: string;
  date_to?: string;
}

export interface SalaryCalculation {
  id: number;
  employee_id: number;
  employee_name?: string;
  month: number;
  year: number;

  // Hours
  regular_hours: number;
  overtime_hours: number;
  night_hours: number;
  holiday_hours: number;
  sunday_hours: number;
  total_hours: number;

  // Rates
  regular_rate: number;
  overtime_rate: number;
  night_rate: number;
  holiday_rate: number;
  sunday_rate: number;

  // Amounts
  regular_amount: number;
  overtime_amount: number;
  night_amount: number;
  holiday_amount: number;
  sunday_amount: number;
  bonus: number;
  gasoline_allowance: number;

  // Deductions
  apartment_deduction: number;
  income_tax: number;
  resident_tax: number;
  health_insurance: number;
  pension: number;
  employment_insurance: number;
  other_deductions: number;

  // Totals
  gross_salary: number;
  total_deductions: number;
  net_salary: number;
  company_profit: number;

  // Status
  is_paid: boolean;
  paid_at?: string | null;
  created_at: string;
  updated_at: string;
}

export interface SalaryCalculationCreateData {
  employee_id: number;
  period_start: string;
  period_end: string;
  base_salary?: number;
  overtime_pay?: number;
  allowances?: number;
  deductions?: number;
}

export interface SalaryListParams extends PaginationParams {
  employee_id?: number;
  month?: number;
  year?: number;
  is_paid?: boolean;
  period_start?: string;
  period_end?: string;
}

export interface SalaryReportFilters {
  start_date?: string;
  end_date?: string;
  employee_ids?: number[];
  factory_ids?: number[];
  include_paid_only?: boolean;
  include_unpaid?: boolean;
}

export interface SalaryReport {
  total_employees: number;
  total_gross_salary: number;
  total_deductions: number;
  total_net_salary: number;
  average_salary: number;
  payment_rate: number;
  by_employee: SalaryCalculation[];
  by_period: {
    period: string;
    total_employees: number;
    gross_salary: number;
    deductions: number;
    net_salary: number;
    paid_count: number;
  }[];
  by_factory: {
    factory_id: number;
    factory_name: string;
    employee_count: number;
    gross_salary: number;
    deductions: number;
    net_salary: number;
    company_profit: number;
  }[];
  tax_analysis: {
    type: string;
    amount: number;
    percentage: number;
  }[];
}

export interface EmployeeData {
  factory_id: string;
  hire_date: string;
  jikyu: number;
  position: string;
  contract_type: string;
  hakensaki_shain_id?: string;
  apartment_id?: string;
  bank_name?: string;
  bank_account?: string;
  emergency_contact_name?: string;
  emergency_contact_phone?: string;
  notes?: string;
}

export interface Request {
  id: number;
  employee_id?: number;  // Nullable for 入社連絡票
  candidate_id?: number;  // For 入社連絡票: links to candidate
  type: RequestType;
  status: RequestStatus;
  start_date: string;
  end_date?: string;
  reason?: string;
  employee_data?: EmployeeData;  // For 入社連絡票: employee-specific data
  approved_by?: number;
  approved_at?: string;
  created_at: string;
  updated_at?: string;
  [key: string]: any;
}

export interface RequestCreateData {
  employee_id: number;
  type: RequestType;
  start_date: string;
  end_date?: string;
  reason?: string;
}

export interface RequestListParams extends PaginationParams {
  employee_id?: number;
  type?: RequestType;
  status?: RequestStatus;
  date_from?: string;
  date_to?: string;
}

export interface DashboardStats {
  total_candidates: number;
  total_employees: number;
  total_factories: number;
  active_requests: number;
  [key: string]: any;
}
