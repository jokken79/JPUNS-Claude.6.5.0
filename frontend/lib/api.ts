import axios from 'axios';

import { useAuthStore } from '@/stores/auth-store';
import { logger } from '@/lib/logging';
import type {
  AuthResponse,
  User,
  Candidate,
  CandidateCreateData,
  CandidateUpdateData,
  CandidateListParams,
  PaginatedResponse,
  Employee,
  EmployeeCreateData,
  EmployeeListParams,
  Factory,
  FactoryCreateData,
  TimerCard,
  TimerCardCreateData,
  TimerCardListParams,
  SalaryCalculation,
  SalaryCalculationCreateData,
  SalaryListParams,
  Request,
  RequestCreateData,
  RequestListParams,
  DashboardStats,
} from '@/types/api';

import type {
  ApartmentResponse,
  ApartmentWithStats,
  ApartmentCreate,
  ApartmentUpdate,
  ApartmentListParams,
  AssignmentResponse,
  AssignmentListItem,
  AssignmentCreate,
  AssignmentUpdate,
  AssignmentListParams,
  TransferRequest,
  TransferResponse,
  AdditionalChargeResponse,
  AdditionalChargeCreate,
  AdditionalChargeUpdate,
  ChargeListParams,
  DeductionResponse,
  DeductionListParams,
  ProratedCalculationRequest,
  ProratedCalculationResponse,
  OccupancyReport,
  ArrearsReport,
  MaintenanceReport,
  CostAnalysisReport,
} from '@/types/apartments-v2';

// Normalize base URL to ensure it includes `/api` and no trailing slash
const normalizeBaseUrl = (url: string): string => {
  if (!url) return '/api';
  const trimmed = url.replace(/\/+$/, '');
  return trimmed.endsWith('/api') ? trimmed : `${trimmed}/api`;
};

const API_BASE_URL = normalizeBaseUrl(process.env.NEXT_PUBLIC_API_URL || '/api');

// Create axios instance
const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000,  // 30 seconds for OCR operations
});

const getAuthToken = (): string | null => {
  if (typeof window === 'undefined') {
    return null;
  }
  return useAuthStore.getState().token;
};

// Request interceptor to add auth token and logging
api.interceptors.request.use(
  (config: any) => {
    const token = getAuthToken();

    // Only add token if not already provided in the request config
    if (token && !config.headers?.Authorization && !config.headers?.authorization) {
      config.headers = config.headers ?? {};
      config.headers.Authorization = `Bearer ${token}`;
    }

    // Ajustar baseURL para SSR si se define un endpoint interno (Docker, etc.)
    if (typeof window === 'undefined') {
      const internal = process.env.INTERNAL_API_URL;
      if (internal) {
        config.baseURL = normalizeBaseUrl(internal);
      } else {
        // Por defecto, mantén la misma base URL normalizada
        config.baseURL = API_BASE_URL;
      }
    }

    // Add request start time for performance tracking
    config.metadata = {
      startTime: Date.now(),
    };

    // Log API request (only in browser)
    if (typeof window !== 'undefined') {
      const url = `${config.baseURL || ''}${config.url || ''}`;
      logger.debug('API request started', {
        method: config.method?.toUpperCase(),
        url,
        params: config.params,
      });
    }

    return config;
  },
  (error: unknown) => {
    if (typeof window !== 'undefined') {
      logger.error('API request failed', {
        error: error instanceof Error ? error.message : String(error),
      });
    }
    return Promise.reject(error);
  }
);

// Response interceptor to handle auth errors and logging
api.interceptors.response.use(
  (response: any) => {
    // Calculate request duration
    const duration = response.config.metadata?.startTime
      ? Date.now() - response.config.metadata.startTime
      : undefined;

    // Log successful API response (only in browser)
    if (typeof window !== 'undefined') {
      const url = `${response.config.baseURL || ''}${response.config.url || ''}`;

      // Log level based on duration and status
      if (duration && duration > 3000) {
        // Slow request warning
        logger.warn('Slow API request', {
          method: response.config.method?.toUpperCase(),
          url,
          status: response.status,
          duration_ms: duration,
        });
      } else {
        logger.debug('API request completed', {
          method: response.config.method?.toUpperCase(),
          url,
          status: response.status,
          duration_ms: duration,
        });
      }
    }

    return response;
  },
  async (error: any) => {
    // Calculate request duration
    const duration = error.config?.metadata?.startTime
      ? Date.now() - error.config.metadata.startTime
      : undefined;

    // Log detailed error information (only in browser)
    if (typeof window !== 'undefined') {
      const url = (() => {
        try {
          const base = error.config?.baseURL ?? '';
          const path = error.config?.url ?? '';
          return `${base}${path}`;
        } catch {
          return undefined;
        }
      })();

      if (error.response) {
        // Server responded with error status
        logger.error('API response error', {
          method: error.config?.method?.toUpperCase(),
          url,
          status: error.response.status,
          statusText: error.response.statusText,
          duration_ms: duration,
          errorData: error.response.data,
        });
      } else if (error.request) {
        // Request was made but no response received (network error)
        logger.error('API network error', {
          method: error.config?.method?.toUpperCase(),
          url,
          message: error.message,
          code: error.code,
          duration_ms: duration,
        });
      } else {
        // Something else happened
        logger.error('API request error', {
          message: error.message,
          error: String(error),
        });
      }
    } else {
      // Fallback console logging for SSR/debugging
      if (error.response) {
        console.error('Response error:', error.response.status);
      } else if (error.request) {
        const url = (() => {
          try {
            const base = error.config?.baseURL ?? '';
            const path = error.config?.url ?? '';
            return `${base}${path}`;
          } catch {
            return undefined;
          }
        })();
        console.error('Network error:', error.message, '| code:', error.code, '| url:', url);
      }
    }

    // Handle authentication errors
    if (error.response?.status === 401) {
      useAuthStore.getState().logout();
      if (typeof window !== 'undefined' && window.location.pathname !== '/login') {
        window.location.href = '/login';
      }
    }

    return Promise.reject(error);
  }
);

// Auth services
export const authService = {
  login: async (username: string, password: string): Promise<AuthResponse> => {
    const formData = new URLSearchParams();
    formData.set('username', username);
    formData.set('password', password);

    const response = await api.post<AuthResponse>('/auth/login/', formData, {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
    });
    return response.data;
  },

  logout: (): void => {
    useAuthStore.getState().logout();
    if (typeof window !== 'undefined') {
      window.location.href = '/login';
    }
  },

  getCurrentUser: async (token?: string): Promise<User> => {
    const config = token ? {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    } : {};
    const response = await api.get<User>('/auth/me/', config);
    return response.data;
  }
};

// Employee services
export const employeeService = {
  getEmployees: async (params?: EmployeeListParams): Promise<PaginatedResponse<Employee>> => {
    const response = await api.get<PaginatedResponse<Employee>>('/employees/', { params });
    return response.data;
  },

  getEmployee: async <T = Employee>(id: string | number): Promise<T> => {
    const response = await api.get<T>(`/employees/${id}/`);
    return response.data;
  },

  createEmployee: async (data: EmployeeCreateData): Promise<Employee> => {
    const response = await api.post<Employee>('/employees/', data);
    return response.data;
  },

  updateEmployee: async (id: string | number, data: Partial<EmployeeCreateData>): Promise<Employee> => {
    const response = await api.put<Employee>(`/employees/${id}/`, data);
    return response.data;
  },

  deleteEmployee: async (id: string | number): Promise<void> => {
    await api.delete(`/employees/${id}/`);
  },

  getAvailableForApartment: async (params?: EmployeeListParams): Promise<PaginatedResponse<Employee>> => {
    const response = await api.get<PaginatedResponse<Employee>>('/employees/available-for-apartment', { params });
    return response.data;
  }
};

// Candidate services
export const candidateService = {
  getCandidates: async (params?: CandidateListParams): Promise<PaginatedResponse<Candidate>> => {
    const response = await api.get<PaginatedResponse<Candidate>>('/candidates/', { params });
    return response.data;
  },

  getCandidate: async (id: string | number): Promise<Candidate> => {
    const response = await api.get<Candidate>(`/candidates/${id}/`);
    return response.data;
  },

  createCandidate: async (data: CandidateCreateData): Promise<Candidate> => {
    const response = await api.post<Candidate>('/candidates/', data);
    return response.data;
  },

  updateCandidate: async (id: string | number, data: CandidateUpdateData): Promise<Candidate> => {
    const response = await api.put<Candidate>(`/candidates/${id}/`, data);
    return response.data;
  },

  deleteCandidate: async (id: string | number): Promise<void> => {
    await api.delete(`/candidates/${id}/`);
  },

  approveCandidate: async (id: string | number): Promise<Candidate> => {
    const response = await api.post<Candidate>(`/candidates/${id}/approve/`);
    return response.data;
  },

  rejectCandidate: async (id: string | number, reason: string): Promise<Candidate> => {
    const response = await api.post<Candidate>(`/candidates/${id}/reject/`, { reason });
    return response.data;
  }
};

// Factory services
export const factoryService = {
  getFactories: async (params?: Record<string, unknown>): Promise<Factory[]> => {
    const response = await api.get<Factory[]>('/factories', { params });
    return response.data;
  },

  getFactory: async (id: string | number): Promise<Factory> => {
    const response = await api.get<Factory>(`/factories/${id}/`);
    return response.data;
  },

  createFactory: async (data: FactoryCreateData): Promise<Factory> => {
    const response = await api.post<Factory>('/factories', data);
    return response.data;
  },

  updateFactory: async (id: string | number, data: Partial<FactoryCreateData>): Promise<Factory> => {
    const response = await api.put<Factory>(`/factories/${id}/`, data);
    return response.data;
  },

  deleteFactory: async (id: string | number): Promise<void> => {
    await api.delete(`/factories/${id}/`);
  }
};

// Timer Card services
export const timerCardService = {
  getTimerCards: async <T = TimerCard[]>(params?: TimerCardListParams): Promise<T> => {
    const response = await api.get<T>('/timer-cards', { params });
    return response.data;
  },

  getTimerCard: async <T = TimerCard>(id: string | number): Promise<T> => {
    const response = await api.get<T>(`/timer-cards/${id}/`);
    return response.data;
  },

  createTimerCard: async (data: TimerCardCreateData): Promise<TimerCard> => {
    const response = await api.post<TimerCard>('/timer-cards', data);
    return response.data;
  },

  updateTimerCard: async (id: string | number, data: Partial<TimerCardCreateData>): Promise<TimerCard> => {
    const response = await api.put<TimerCard>(`/timer-cards/${id}/`, data);
    return response.data;
  },

  deleteTimerCard: async (id: string | number): Promise<void> => {
    await api.delete(`/timer-cards/${id}/`);
  },

  // OCR Upload services
  uploadTimerCardPDF: async (formData: FormData): Promise<any> => {
    const response = await api.post('/timer-cards/upload/', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
    return response.data;
  },

  createBulkTimerCards: async (records: any[]): Promise<any> => {
    const response = await api.post('/timer-cards/bulk/', { records });
    return response.data;
  }
};

// Salary services
export const salaryService = {
  getSalaries: async <T = SalaryCalculation[]>(params?: SalaryListParams): Promise<T> => {
    const response = await api.get<T>('/salary/', { params });
    return response.data;
  },

  getSalary: async <T = SalaryCalculation>(id: string | number): Promise<T> => {
    const response = await api.get<T>(`/salary/${id}/`);
    return response.data;
  },

  calculateSalary: async (data: SalaryCalculationCreateData): Promise<SalaryCalculation> => {
    const response = await api.post<SalaryCalculation>('/salary/calculate/', data);
    return response.data;
  },

  updateSalary: async (id: string | number, data: Partial<SalaryCalculation>): Promise<SalaryCalculation> => {
    const response = await api.put<SalaryCalculation>(`/salary/${id}/`, data);
    return response.data;
  },

  deleteSalary: async (id: string | number): Promise<void> => {
    await api.delete(`/salary/${id}/`);
  },

  markSalaryPaid: async (id: string | number): Promise<SalaryCalculation> => {
    const response = await api.put<SalaryCalculation>(`/salary/${id}/mark-paid/`);
    return response.data;
  },

  generatePayslip: async (id: string | number): Promise<Blob> => {
    const response = await api.post(`/salary/${id}/payslip/`, {}, { responseType: 'blob' });
    return response.data;
  },

  getSalaryReport: async (filters?: any): Promise<any> => {
    const response = await api.get('/salary/reports/', { params: filters });
    return response.data;
  },

  exportSalaryExcel: async (filters?: any): Promise<Blob> => {
    const response = await api.post('/salary/export/excel/', filters, { responseType: 'blob' });
    return response.data;
  },

  exportSalaryPdf: async (filters?: any): Promise<Blob> => {
    const response = await api.post('/salary/export/pdf/', filters, { responseType: 'blob' });
    return response.data;
  }
};

// Request services
export const requestService = {
  getRequests: async (params?: RequestListParams): Promise<PaginatedResponse<Request>> => {
    const response = await api.get<PaginatedResponse<Request>>('/requests/', { params });
    return response.data;
  },

  getRequest: async <T = Request>(id: string | number): Promise<T> => {
    const response = await api.get<T>(`/requests/${id}/`);
    return response.data;
  },

  createRequest: async (data: RequestCreateData): Promise<Request> => {
    const response = await api.post<Request>('/requests/', data);
    return response.data;
  },

  approveRequest: async (id: string | number): Promise<Request> => {
    const response = await api.post<Request>(`/requests/${id}/approve/`);
    return response.data;
  },

  rejectRequest: async (id: string | number, reason: string): Promise<Request> => {
    const response = await api.post<Request>(`/requests/${id}/reject/`, { reason });
    return response.data;
  }
};

// Dashboard services
export const dashboardService = {
  getStats: async (): Promise<DashboardStats> => {
    const response = await api.get<DashboardStats>('/dashboard/stats/');
    return response.data;
  },

  getRecentActivity: async (): Promise<unknown> => {
    const response = await api.get('/dashboard/recent-activity/');
    return response.data;
  }
};

// =============================================================================
// APARTMENTS V2 SERVICES
// =============================================================================

export const apartmentsV2Service = {
  // -----------------------------------------------------------------------------
  // APARTMENTS
  // -----------------------------------------------------------------------------

  /**
   * List apartments with filters and pagination
   */
  listApartments: async (params?: ApartmentListParams): Promise<PaginatedResponse<ApartmentWithStats>> => {
    const response = await api.get<PaginatedResponse<ApartmentWithStats>>('/apartments/apartments', { params });
    return response.data;
  },

  /**
   * Get apartment by ID with stats
   */
  getApartment: async (id: number): Promise<ApartmentWithStats> => {
    const response = await api.get<ApartmentWithStats>(`/apartments/apartments/${id}`);
    return response.data;
  },

  /**
   * Create new apartment
   */
  createApartment: async (data: ApartmentCreate): Promise<ApartmentResponse> => {
    const response = await api.post<ApartmentResponse>('/apartments/apartments', data);
    return response.data;
  },

  /**
   * Update existing apartment
   */
  updateApartment: async (id: number, data: ApartmentUpdate): Promise<ApartmentResponse> => {
    const response = await api.put<ApartmentResponse>(`/apartments/apartments/${id}`, data);
    return response.data;
  },

  /**
   * Soft delete apartment
   */
  deleteApartment: async (id: number): Promise<void> => {
    await api.delete(`/apartments/apartments/${id}`);
  },

  // -----------------------------------------------------------------------------
  // ASSIGNMENTS
  // -----------------------------------------------------------------------------

  /**
   * List assignments with filters and pagination
   */
  listAssignments: async (params?: AssignmentListParams): Promise<PaginatedResponse<AssignmentListItem>> => {
    const response = await api.get<PaginatedResponse<AssignmentListItem>>('/apartments/assignments', { params });
    return response.data;
  },

  /**
   * Get assignment by ID with full details
   */
  getAssignment: async (id: number): Promise<AssignmentResponse> => {
    const response = await api.get<AssignmentResponse>(`/apartments/assignments/${id}`);
    return response.data;
  },

  /**
   * Create new assignment
   */
  createAssignment: async (data: AssignmentCreate): Promise<AssignmentResponse> => {
    const response = await api.post<AssignmentResponse>('/apartments/assignments', data);
    return response.data;
  },

  /**
   * Update/end assignment
   */
  updateAssignment: async (id: number, data: AssignmentUpdate): Promise<AssignmentResponse> => {
    const response = await api.put<AssignmentResponse>(`/apartments/assignments/${id}`, data);
    return response.data;
  },

  /**
   * End assignment (convenience method)
   */
  endAssignment: async (
    id: number,
    data: {
      end_date: string;
      include_cleaning_fee?: boolean;
      cleaning_fee?: number;
      additional_charges?: Array<{
        charge_type: string;
        description: string;
        amount: number;
        charge_date: string;
      }>;
    }
  ): Promise<AssignmentResponse> => {
    const response = await api.put<AssignmentResponse>(`/apartments/assignments/${id}/end`, data);
    return response.data;
  },

  /**
   * Get active assignment for employee
   */
  getActiveAssignmentByEmployee: async (employeeId: number): Promise<AssignmentResponse | null> => {
    const response = await api.get<AssignmentResponse | null>(
      `/apartments/assignments/employee/${employeeId}/active`
    );
    return response.data;
  },

  /**
   * Get active assignments for apartment
   */
  getActiveAssignmentsByApartment: async (apartmentId: number): Promise<AssignmentResponse[]> => {
    const response = await api.get<AssignmentResponse[]>(
      `/apartments/assignments/apartment/${apartmentId}/active`
    );
    return response.data;
  },

  // -----------------------------------------------------------------------------
  // TRANSFERS
  // -----------------------------------------------------------------------------

  /**
   * Transfer employee between apartments
   */
  transferEmployee: async (data: TransferRequest): Promise<TransferResponse> => {
    const response = await api.post<TransferResponse>('/apartments/assignments/transfer', data);
    return response.data;
  },

  // -----------------------------------------------------------------------------
  // ADDITIONAL CHARGES
  // -----------------------------------------------------------------------------

  /**
   * List additional charges
   */
  listCharges: async (params?: ChargeListParams): Promise<PaginatedResponse<AdditionalChargeResponse>> => {
    const response = await api.get<PaginatedResponse<AdditionalChargeResponse>>('/apartments/charges', { params });
    return response.data;
  },

  /**
   * Get charge by ID
   */
  getCharge: async (id: number): Promise<AdditionalChargeResponse> => {
    const response = await api.get<AdditionalChargeResponse>(`/apartments/charges/${id}`);
    return response.data;
  },

  /**
   * Create additional charge
   */
  createCharge: async (data: AdditionalChargeCreate): Promise<AdditionalChargeResponse> => {
    const response = await api.post<AdditionalChargeResponse>('/apartments/charges', data);
    return response.data;
  },

  /**
   * Update additional charge
   */
  updateCharge: async (id: number, data: AdditionalChargeUpdate): Promise<AdditionalChargeResponse> => {
    const response = await api.put<AdditionalChargeResponse>(`/apartments/charges/${id}`, data);
    return response.data;
  },

  /**
   * Approve charge (admin only)
   */
  approveCharge: async (id: number): Promise<AdditionalChargeResponse> => {
    const response = await api.put<AdditionalChargeResponse>(`/apartments/charges/${id}/approve`);
    return response.data;
  },

  /**
   * Delete charge (soft delete)
   */
  deleteCharge: async (id: number): Promise<void> => {
    await api.delete(`/apartments/charges/${id}`);
  },

  // -----------------------------------------------------------------------------
  // DEDUCTIONS
  // -----------------------------------------------------------------------------

  /**
   * List rent deductions
   */
  listDeductions: async (params?: DeductionListParams): Promise<PaginatedResponse<DeductionResponse>> => {
    const response = await api.get<PaginatedResponse<DeductionResponse>>('/apartments/deductions', { params });
    return response.data;
  },

  /**
   * Get deductions for specific year/month
   */
  getDeductionsByPeriod: async (year: number, month: number): Promise<DeductionResponse[]> => {
    const response = await api.get<DeductionResponse[]>(`/apartments/deductions/${year}/${month}`);
    return response.data;
  },

  /**
   * Generate deductions for specific month
   */
  generateDeductions: async (year: number, month: number): Promise<{ created: number; skipped: number }> => {
    const response = await api.post<{ created: number; skipped: number }>(
      '/apartments/deductions/generate',
      { year, month }
    );
    return response.data;
  },

  /**
   * Export deductions to CSV
   */
  exportDeductions: async (year: number, month: number): Promise<Blob> => {
    const response = await api.get(`/apartments/deductions/export/${year}/${month}`, {
      responseType: 'blob',
    });
    return response.data;
  },

  // -----------------------------------------------------------------------------
  // CALCULATIONS
  // -----------------------------------------------------------------------------

  /**
   * Calculate prorated rent
   */
  calculateProratedRent: async (data: ProratedCalculationRequest): Promise<ProratedCalculationResponse> => {
    const response = await api.post<ProratedCalculationResponse>('/apartments/apartments/calculate/prorated', data);
    return response.data;
  },

  /**
   * Calculate transfer cost (preview)
   */
  calculateTransferCost: async (data: TransferRequest): Promise<{
    old_apartment_cost: number;
    new_apartment_cost: number;
    total_monthly_cost: number;
    breakdown: Record<string, any>;
  }> => {
    const response = await api.post('/apartments/calculate/transfer', data);
    return response.data;
  },

  // -----------------------------------------------------------------------------
  // REPORTS
  // -----------------------------------------------------------------------------

  /**
   * Get occupancy report
   *
   * @param prefecture - Optional filter by prefecture
   * @param building_name - Optional filter by building name
   * @returns Occupancy report with summary, trends, and apartment details
   */
  getOccupancyReport: async (
    prefecture?: string,
    building_name?: string
  ): Promise<OccupancyReport> => {
    const response = await api.get<OccupancyReport>('/apartments/reports/occupancy', {
      params: {
        prefecture,
        building_name,
      },
    });
    return response.data;
  },

  /**
   * Get arrears (pending payments) report
   *
   * @param year - Year for the report
   * @param month - Month for the report (1-12)
   * @returns Arrears report with payment status and debtor details
   */
  getArrearsReport: async (
    year: number,
    month: number
  ): Promise<ArrearsReport> => {
    const response = await api.get<ArrearsReport>('/apartments/reports/arrears', {
      params: { year, month },
    });
    return response.data;
  },

  /**
   * Get maintenance and charges report
   *
   * @param period - Time period (e.g., '1month', '3months', '6months', '1year')
   * @param chargeType - Optional filter by charge type (cleaning, repair, etc.)
   * @returns Maintenance report with costs and incident details
   */
  getMaintenanceReport: async (
    period?: string,
    chargeType?: string
  ): Promise<MaintenanceReport> => {
    const response = await api.get<MaintenanceReport>('/apartments/reports/maintenance', {
      params: {
        period,
        charge_type: chargeType,
      },
    });
    return response.data;
  },

  /**
   * Get cost analysis and profitability report
   *
   * @param year - Year for the report
   * @param month - Month for the report (1-12)
   * @returns Cost analysis report with revenue, expenses, and profit details
   */
  getCostAnalysisReport: async (
    year: number,
    month: number
  ): Promise<CostAnalysisReport> => {
    const response = await api.get<CostAnalysisReport>('/apartments/reports/costs', {
      params: { year, month },
    });
    return response.data;
  },
};

// =============================================================================
// ADMIN CONTROL PANEL SERVICES
// =============================================================================

export interface AuditLogEntry {
  id: number;
  admin_username: string;
  action_type: 'enable' | 'disable' | 'bulk_enable' | 'bulk_disable' | 'update';
  target_type: 'page' | 'role_permission' | 'global';
  target_name: string;
  role_key?: string;
  details?: string;
  timestamp: string;
  created_at: string;
}

export interface RoleStatsResponse {
  role_key: string;
  role_name: string;
  total_pages: number;
  enabled_pages: number;
  disabled_pages: number;
  percentage: number;
}

// =============================================================================
// ADMIN CONTROL PANEL SERVICES
// =============================================================================

export interface ImportConfigRequest {
  pages?: Array<{
    page_key: string;
    page_name: string;
    is_enabled: boolean;
    disabled_message?: string;
  }>;
  settings?: Array<{
    key: string;
    value: string;
  }>;
}

export interface ImportConfigResponse {
  success?: boolean;
  message: string;
  imported_at: string;
  imported_pages: number;
  imported_settings: number;
}

export const adminControlPanelService = {
  /**
   * Get recent audit log entries
   */
  getRecentAuditLog: async (limit: number = 10): Promise<AuditLogEntry[]> => {
    const response = await api.get<AuditLogEntry[]>(`/admin/audit-log/recent/${limit}`);
    return response.data;
  },

  /**
   * Get all audit log entries with pagination
   */
  getAllAuditLog: async (params?: { skip?: number; limit?: number }): Promise<PaginatedResponse<AuditLogEntry>> => {
    const response = await api.get<PaginatedResponse<AuditLogEntry>>('/admin/audit-log', { params });
    return response.data;
  },

  /**
   * Get role statistics (access percentages)
   */
  getRoleStats: async (): Promise<RoleStatsResponse[]> => {
    const response = await api.get<RoleStatsResponse[]>('/admin/role-stats');
    return response.data;
  },

  /**
   * Import configuration (pages and settings)
   */
  importConfiguration: async (config: ImportConfigRequest): Promise<ImportConfigResponse> => {
    const response = await api.post<ImportConfigResponse>('/admin/import-config', config);
    return response.data;
  },
};

// =============================================================================
// USER MANAGEMENT SERVICES (ADMIN)
// =============================================================================

export interface UserManagementUser {
  id: number;
  username: string;
  email: string;
  full_name?: string;
  role: string;
  is_active: boolean;
  created_at: string;
  updated_at?: string;
}

export interface CreateUserRequest {
  username: string;
  email: string;
  password: string;
  full_name?: string;
  role: string;
}

export interface UpdateUserRequest {
  username?: string;
  email?: string;
  full_name?: string;
  role?: string;
  is_active?: boolean;
}

export interface ResetPasswordRequest {
  new_password: string;
}

export interface UserListParams {
  skip?: number;
  limit?: number;
  search?: string;
  role?: string;
  is_active?: boolean;
}

export const userManagementService = {
  /**
   * List all users with optional filters
   */
  getUsers: async (params?: UserListParams): Promise<UserManagementUser[]> => {
    const response = await api.get<UserManagementUser[]>('/auth/users', { params });
    return response.data;
  },

  /**
   * Get single user by ID
   */
  getUser: async (userId: number): Promise<UserManagementUser> => {
    const response = await api.get<UserManagementUser>(`/auth/users/${userId}`);
    return response.data;
  },

  /**
   * Create new user (register)
   */
  createUser: async (userData: CreateUserRequest): Promise<UserManagementUser> => {
    const response = await api.post<UserManagementUser>('/auth/register', userData);
    return response.data;
  },

  /**
   * Update user information (admin)
   */
  updateUser: async (userId: number, userData: UpdateUserRequest): Promise<UserManagementUser> => {
    const response = await api.put<UserManagementUser>(`/auth/users/${userId}`, userData);
    return response.data;
  },

  /**
   * Delete user (super admin only)
   */
  deleteUser: async (userId: number): Promise<void> => {
    await api.delete(`/auth/users/${userId}`);
  },

  /**
   * Reset user password (admin)
   */
  resetPassword: async (userId: number, passwordData: ResetPasswordRequest): Promise<void> => {
    await api.post(`/auth/users/${userId}/reset-password`, passwordData);
  },
};

// =============================================================================
// SYSTEM SETTINGS SERVICES (ADMIN)
// =============================================================================

export interface SystemSetting {
  id: number;
  key: string;
  value: string | null;
  description: string | null;
  updated_at: string;
  // Extended for frontend
  setting_type?: 'string' | 'boolean' | 'integer' | 'enum';
  allowed_values?: string[];
}

export interface MaintenanceMode {
  enabled: boolean;
  message?: string;
}

export interface AdminStatistics {
  // Flat fields (for backward compatibility and direct access)
  total_users: number;
  active_users: number;
  total_candidates: number;
  total_employees: number;
  total_factories: number;
  maintenance_mode: boolean;
  database_size?: string;
  uptime?: string;
  // Nested fields (from backend response structure)
  pages?: {
    total: number;
    enabled: number;
    disabled: number;
    percentage_enabled: number;
  };
  system?: {
    maintenance_mode: boolean;
    recent_changes_24h: number;
  };
}

export const systemSettingsService = {
  /**
   * Get all system settings
   */
  getAllSettings: async (): Promise<SystemSetting[]> => {
    const response = await api.get<SystemSetting[]>('/admin/settings');
    return response.data;
  },

  /**
   * Get single setting by key
   */
  getSetting: async (settingKey: string): Promise<SystemSetting> => {
    const response = await api.get<SystemSetting>(`/admin/settings/${settingKey}`);
    return response.data;
  },

  /**
   * Update setting value
   */
  updateSetting: async (settingKey: string, value: any): Promise<SystemSetting> => {
    const response = await api.put<SystemSetting>(`/admin/settings/${settingKey}`, { value });
    return response.data;
  },

  /**
   * Toggle maintenance mode
   */
  toggleMaintenanceMode: async (enabled: boolean): Promise<MaintenanceMode> => {
    const response = await api.post<MaintenanceMode>('/admin/maintenance-mode', { enabled });
    return response.data;
  },

  /**
   * Get admin statistics
   */
  getStatistics: async (): Promise<AdminStatistics> => {
    const response = await api.get<AdminStatistics>('/admin/statistics');
    return response.data;
  },
};

export default api;
