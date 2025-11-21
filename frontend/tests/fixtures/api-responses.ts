/**
 * Mock API responses for testing
 * Provides realistic data fixtures for UNS-ClaudeJP API responses
 */

// User fixtures
export const mockUser = {
  id: '1',
  email: 'test@example.com',
  username: 'testuser',
  full_name: 'Test User',
  is_active: true,
  is_superuser: false,
  created_at: '2025-01-01T00:00:00Z',
  updated_at: '2025-01-01T00:00:00Z',
};

export const mockAdminUser = {
  ...mockUser,
  id: '999',
  email: 'admin@example.com',
  username: 'admin',
  full_name: 'Admin User',
  is_superuser: true,
};

// Employee fixtures
export const mockEmployee = {
  id: '1',
  employee_id: 'EMP001',
  name: 'John Doe',
  email: 'john.doe@example.com',
  phone: '555-0123',
  position: 'Software Developer',
  department: 'Engineering',
  hire_date: '2024-01-15',
  status: 'active',
  salary: 75000,
  created_at: '2024-01-15T00:00:00Z',
  updated_at: '2024-01-15T00:00:00Z',
};

export const mockEmployees = [
  mockEmployee,
  {
    id: '2',
    employee_id: 'EMP002',
    name: 'Jane Smith',
    email: 'jane.smith@example.com',
    phone: '555-0124',
    position: 'UI/UX Designer',
    department: 'Design',
    hire_date: '2024-02-01',
    status: 'active',
    salary: 70000,
    created_at: '2024-02-01T00:00:00Z',
    updated_at: '2024-02-01T00:00:00Z',
  },
  {
    id: '3',
    employee_id: 'EMP003',
    name: 'Bob Johnson',
    email: 'bob.johnson@example.com',
    phone: '555-0125',
    position: 'Project Manager',
    department: 'Management',
    hire_date: '2023-12-01',
    status: 'active',
    salary: 85000,
    created_at: '2023-12-01T00:00:00Z',
    updated_at: '2023-12-01T00:00:00Z',
  },
];

export const mockEmployeesListResponse = {
  items: mockEmployees,
  total: mockEmployees.length,
  page: 1,
  limit: 20,
  pages: 1,
};

// Candidate fixtures
export const mockCandidate = {
  id: '1',
  name: 'Alice Williams',
  email: 'alice.williams@example.com',
  phone: '555-0200',
  status: 'interviewing',
  position_applied: 'Software Developer',
  resume_url: 'https://example.com/resumes/alice.pdf',
  applied_date: '2025-01-10',
  notes: 'Strong technical skills',
  created_at: '2025-01-10T00:00:00Z',
  updated_at: '2025-01-15T00:00:00Z',
};

export const mockCandidates = [
  mockCandidate,
  {
    id: '2',
    name: 'Charlie Brown',
    email: 'charlie.brown@example.com',
    phone: '555-0201',
    status: 'applied',
    position_applied: 'UI/UX Designer',
    resume_url: 'https://example.com/resumes/charlie.pdf',
    applied_date: '2025-01-12',
    notes: 'Good portfolio',
    created_at: '2025-01-12T00:00:00Z',
    updated_at: '2025-01-12T00:00:00Z',
  },
];

// Timer card fixtures
export const mockTimerCard = {
  id: '1',
  employee_id: '1',
  employee_name: 'John Doe',
  work_date: '2025-01-20',
  clock_in: '09:00:00',
  clock_out: '17:00:00',
  break_minutes: 60,
  work_hours: 7.0,
  overtime_hours: 0.0,
  status: 'approved',
  created_at: '2025-01-20T09:00:00Z',
  updated_at: '2025-01-20T17:00:00Z',
};

export const mockTimerCards = [
  mockTimerCard,
  {
    id: '2',
    employee_id: '2',
    employee_name: 'Jane Smith',
    work_date: '2025-01-20',
    clock_in: '08:30:00',
    clock_out: '16:30:00',
    break_minutes: 60,
    work_hours: 7.0,
    overtime_hours: 0.0,
    status: 'pending',
    created_at: '2025-01-20T08:30:00Z',
    updated_at: '2025-01-20T16:30:00Z',
  },
];

// Payroll fixtures
export const mockPayroll = {
  id: '1',
  employee_id: '1',
  employee_name: 'John Doe',
  period_start: '2025-01-01',
  period_end: '2025-01-31',
  base_salary: 75000,
  overtime_pay: 500,
  deductions: 15000,
  net_pay: 60500,
  status: 'processed',
  payment_date: '2025-02-01',
  created_at: '2025-01-31T00:00:00Z',
  updated_at: '2025-02-01T00:00:00Z',
};

// Apartment fixtures (for Yukyu workflow)
export const mockApartment = {
  id: '1',
  apartment_number: '101',
  building: 'Building A',
  floor: 1,
  rooms: 2,
  rent: 120000,
  status: 'occupied',
  tenant_name: 'John Tenant',
  lease_start: '2024-04-01',
  lease_end: '2026-03-31',
  created_at: '2024-04-01T00:00:00Z',
  updated_at: '2024-04-01T00:00:00Z',
};

export const mockApartments = [
  mockApartment,
  {
    id: '2',
    apartment_number: '102',
    building: 'Building A',
    floor: 1,
    rooms: 3,
    rent: 150000,
    status: 'vacant',
    tenant_name: null,
    lease_start: null,
    lease_end: null,
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z',
  },
];

// Auth fixtures
export const mockLoginResponse = {
  access_token: 'mock-jwt-token-12345',
  token_type: 'bearer',
  expires_in: 3600,
  user: mockUser,
};

export const mockAuthHeaders = {
  Authorization: 'Bearer mock-jwt-token-12345',
};

// Error fixtures
export const mockValidationError = {
  detail: [
    {
      loc: ['body', 'email'],
      msg: 'value is not a valid email address',
      type: 'value_error.email',
    },
    {
      loc: ['body', 'name'],
      msg: 'field required',
      type: 'value_error.missing',
    },
  ],
};

export const mockNotFoundError = {
  detail: 'Resource not found',
};

export const mockUnauthorizedError = {
  detail: 'Not authenticated',
};

export const mockServerError = {
  detail: 'Internal server error',
};

// Pagination helpers
export const createPaginatedResponse = <T>(
  items: T[],
  page: number = 1,
  limit: number = 20
) => ({
  items: items.slice((page - 1) * limit, page * limit),
  total: items.length,
  page,
  limit,
  pages: Math.ceil(items.length / limit),
});

// Factory helpers
export const createMockEmployee = (overrides: Partial<typeof mockEmployee> = {}) => ({
  ...mockEmployee,
  ...overrides,
  id: overrides.id || Math.random().toString(36).substring(7),
});

export const createMockCandidate = (overrides: Partial<typeof mockCandidate> = {}) => ({
  ...mockCandidate,
  ...overrides,
  id: overrides.id || Math.random().toString(36).substring(7),
});

export const createMockTimerCard = (overrides: Partial<typeof mockTimerCard> = {}) => ({
  ...mockTimerCard,
  ...overrides,
  id: overrides.id || Math.random().toString(36).substring(7),
});

export const createMockUser = (overrides: Partial<typeof mockUser> = {}) => ({
  ...mockUser,
  ...overrides,
  id: overrides.id || Math.random().toString(36).substring(7),
});
