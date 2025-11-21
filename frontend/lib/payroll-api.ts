/**
 * Payroll API Client
 * Cliente API para el sistema de payroll
 */

import api from './api';

export interface PayrollRun {
  id: number;
  pay_period_start: string;
  pay_period_end: string;
  status: 'draft' | 'calculated' | 'approved' | 'paid' | 'cancelled';
  total_employees: number;
  total_gross_amount: number;
  total_deductions: number;
  total_net_amount: number;
  created_by: string;
  created_at: string;
  updated_at: string;
}

export interface PayrollRunCreate {
  pay_period_start: string;
  pay_period_end: string;
  created_by?: string;
}

export interface EmployeeData {
  employee_id: number;
  name: string;
  base_hourly_rate: number;
  factory_id: string;
  prefecture: string;
  apartment_rent: number;
  dependents: number;
}

export interface TimerRecord {
  work_date: string;
  clock_in: string;
  clock_out: string;
  break_minutes: number;
}

export interface EmployeePayrollCreate {
  employee_data: EmployeeData;
  timer_records: TimerRecord[];
  payroll_run_id?: number;
}

export interface HoursBreakdown {
  regular_hours: number;
  overtime_hours: number;
  night_shift_hours: number;
  holiday_hours: number;
  sunday_hours: number;
  total_hours: number;
  work_days: number;
}

export interface Rates {
  base_rate: number;
  overtime_rate: number;
  night_shift_rate: number;
  holiday_rate: number;
  sunday_rate: number;
}

export interface Amounts {
  base_amount: number;
  overtime_amount: number;
  night_shift_amount: number;
  holiday_amount: number;
  sunday_amount: number;
  gross_amount: number;
  total_deductions: number;
  net_amount: number;
}

export interface DeductionsDetail {
  income_tax: number;
  resident_tax: number;
  health_insurance: number;
  pension: number;
  employment_insurance: number;
  apartment: number;
  other: number;
}

export interface ValidationResult {
  is_valid: boolean;
  errors: string[];
  warnings: string[];
  validated_at: string;
}

export interface EmployeePayrollResult {
  success: boolean;
  employee_id: number;
  payroll_run_id?: number;
  pay_period_start: string;
  pay_period_end: string;
  hours_breakdown: HoursBreakdown;
  rates: Rates;
  amounts: Amounts;
  deductions_detail: DeductionsDetail;
  validation: ValidationResult;
  calculated_at: string;
}

export interface BulkPayrollRequest {
  employees_data: Record<number, any>;
  payroll_run_id?: number;
}

export interface BulkPayrollResult {
  total_employees: number;
  successful: number;
  failed: number;
  results: any[];
  errors: any[];
  calculated_at: string;
}

export interface PayslipRequest {
  employee_id: number;
  payroll_run_id: number;
}

export interface PayslipInfo {
  success: boolean;
  pdf_path?: string;
  pdf_url?: string;
  payslip_id: string;
  generated_at: string;
  employee_id: number;
  pay_period: string;
}

export interface PayrollSettings {
  id: number;
  company_id?: number;
  overtime_rate: number;
  night_shift_rate: number;
  holiday_rate: number;
  sunday_rate: number;
  standard_hours_per_month: number;
  created_at: string;
  updated_at: string;
}

export interface PayrollSettingsUpdate {
  overtime_rate?: number;
  night_shift_rate?: number;
  holiday_rate?: number;
  sunday_rate?: number;
  standard_hours_per_month?: number;
}

export interface PayrollSummary {
  payroll_run_id: number;
  pay_period_start: string;
  pay_period_end: string;
  status: string;
  total_employees: number;
  total_gross_amount: number;
  total_deductions: number;
  total_net_amount: number;
  total_hours: number;
  avg_gross_amount: number;
  created_at: string;
}

export interface PayrollApprovalRequest {
  approved_by: string;
  notes?: string;
}

export interface PayrollApprovalResponse {
  success: boolean;
  payroll_run_id: number;
  status: string;
  approved_by: string;
  approved_at: string;
}

class PayrollAPI {
  /**
   * Create a new payroll run
   */
  async createPayrollRun(data: PayrollRunCreate): Promise<PayrollRun> {
    const response = await api.post('/payroll/runs', data);
    return response.data;
  }

  /**
   * Get all payroll runs
   */
  async getPayrollRuns(params?: {
    skip?: number;
    limit?: number;
    status_filter?: string;
  }): Promise<PayrollRun[]> {
    const response = await api.get('/payroll/runs', { params });
    return response.data;
  }

  /**
   * Get payroll run details
   */
  async getPayrollRun(id: number): Promise<PayrollRun> {
    const response = await api.get(`/payroll/runs/${id}`);
    return response.data;
  }

  /**
   * Calculate payroll for all employees in a run
   */
  async calculateBulkPayroll(
    id: number,
    data: BulkPayrollRequest
  ): Promise<BulkPayrollResult> {
    const response = await api.post(`/payroll/runs/${id}/calculate`, data);
    return response.data;
  }

  /**
   * Get employees in a payroll run
   */
  async getPayrollRunEmployees(id: number): Promise<EmployeePayrollResult[]> {
    const response = await api.get(`/payroll/runs/${id}/employees`);
    return response.data;
  }

  /**
   * Approve a payroll run
   */
  async approvePayrollRun(
    id: number,
    data: PayrollApprovalRequest
  ): Promise<PayrollApprovalResponse> {
    const response = await api.post(`/payroll/runs/${id}/approve`, data);
    return response.data;
  }

  /**
   * Calculate payroll for single employee
   */
  async calculateEmployeePayroll(
    data: EmployeePayrollCreate
  ): Promise<EmployeePayrollResult> {
    const response = await api.post('/payroll/calculate', data);
    return response.data;
  }

  /**
   * Generate payslip PDF
   */
  async generatePayslip(data: PayslipRequest): Promise<PayslipInfo> {
    const response = await api.post('/payroll/payslips/generate', data);
    return response.data;
  }

  /**
   * Get payslip information
   */
  async getPayslip(id: string): Promise<PayslipInfo> {
    const response = await api.get(`/payroll/payslips/${id}`);
    return response.data;
  }

  /**
   * Get payroll settings
   */
  async getPayrollSettings(): Promise<PayrollSettings> {
    const response = await api.get('/payroll/settings');
    return response.data;
  }

  /**
   * Update payroll settings
   */
  async updatePayrollSettings(
    data: PayrollSettingsUpdate
  ): Promise<PayrollSettings> {
    const response = await api.put('/payroll/settings', data);
    return response.data;
  }

  /**
   * Get payroll summary
   */
  async getPayrollSummary(params?: {
    skip?: number;
    limit?: number;
  }): Promise<PayrollSummary[]> {
    const response = await api.get('/payroll/summary', { params });
    return response.data;
  }

  /**
   * Calculate payroll from timer card records in the database
   */
  async calculatePayrollFromTimerCards(
    employeeId: number,
    startDate: string,
    endDate: string
  ): Promise<EmployeePayrollResult> {
    const response = await api.post(`/payroll/calculate-from-timer-cards/${employeeId}`, null, {
      params: {
        start_date: startDate,
        end_date: endDate
      }
    });
    return response.data;
  }

  /**
   * Mark payroll run as paid
   */
  async markPayrollRunAsPaid(id: number): Promise<PayrollRun> {
    const response = await api.patch(`/payroll/runs/${id}/mark-paid`);
    return response.data;
  }

  /**
   * Delete payroll run
   */
  async deletePayrollRun(id: number): Promise<{ success: boolean; message: string }> {
    const response = await api.delete(`/payroll/runs/${id}`);
    return response.data;
  }

  /**
   * Update payroll run
   */
  async updatePayrollRun(
    id: number,
    data: Partial<PayrollRunCreate>
  ): Promise<PayrollRun> {
    const response = await api.put(`/payroll/runs/${id}`, data);
    return response.data;
  }
}

export const payrollAPI = new PayrollAPI();
