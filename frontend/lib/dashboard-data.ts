/**
 * Dashboard Mock Data Generator
 * Generates realistic HR metrics for development and testing
 */

// ============================================================================
// TypeScript Interfaces
// ============================================================================

export interface TimeSeriesDataPoint {
  month: string;
  monthFull: string;
  date: string;
  employees: number;
  activeEmployees: number;
  hours: number;
  salary: number;
  factories: number;
  candidates: number;
  pendingApprovals: number;
}

export interface DistributionDataItem {
  name: string;
  value: number;
  percentage: number;
  color: string;
}

export interface DistributionData {
  byStatus: DistributionDataItem[];
  byFactory: DistributionDataItem[];
  byNationality: DistributionDataItem[];
  byContractType: DistributionDataItem[];
}

export interface ActivityLog {
  id: string;
  type: 'employee_added' | 'candidate_approved' | 'timecard_submitted' | 'salary_calculated' | 'request_approved' | 'document_expired';
  user: string;
  description: string;
  timestamp: Date;
  icon: string;
}

export interface UpcomingItem {
  id: string;
  type: 'pending_approval' | 'expiring_document' | 'missing_timecard' | 'payroll_date';
  title: string;
  description: string;
  dueDate: Date;
  priority: 'high' | 'medium' | 'low';
  icon: string;
}

export interface DashboardStats {
  current: {
    totalEmployees: number;
    activeEmployees: number;
    totalCandidates: number;
    pendingCandidates: number;
    totalFactories: number;
    totalHours: number;
    totalSalary: number;
    pendingApprovals: number;
  };
  previous: {
    totalEmployees: number;
    activeEmployees: number;
    totalCandidates: number;
    pendingCandidates: number;
    totalFactories: number;
    totalHours: number;
    totalSalary: number;
    pendingApprovals: number;
  };
  changes: {
    employees: { value: number; isPositive: boolean };
    activeEmployees: { value: number; isPositive: boolean };
    candidates: { value: number; isPositive: boolean };
    pendingCandidates: { value: number; isPositive: boolean };
    factories: { value: number; isPositive: boolean };
    hours: { value: number; isPositive: boolean };
    salary: { value: number; isPositive: boolean };
    approvals: { value: number; isPositive: boolean };
  };
}

export interface DashboardData {
  stats: DashboardStats;
  timeSeries: TimeSeriesDataPoint[];
  distribution: DistributionData;
  recentActivity: ActivityLog[];
  upcomingItems: UpcomingItem[];
}

// ============================================================================
// Constants & Helpers
// ============================================================================

const MONTH_NAMES = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
];

const MONTH_SHORT = [
  'Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun',
  'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'
];

const FACTORY_NAMES = [
  'Toyota Aichi Plant', 'Honda Suzuka Factory', 'Nissan Kyushu Plant',
  'Panasonic Osaka', 'Sony Nagano', 'Mitsubishi Nagoya',
  'Subaru Gunma', 'Mazda Hiroshima'
];

const NATIONALITIES = [
  { name: 'Vietnamita', color: '#EF4444' },
  { name: 'Filipino', color: '#3B82F6' },
  { name: 'Chino', color: '#F59E0B' },
  { name: 'Japonés', color: '#10B981' },
  { name: 'Brasileño', color: '#8B5CF6' },
  { name: 'Peruano', color: '#EC4899' },
];

const ACTIVITY_TYPES = [
  { type: 'employee_added', icon: 'UserPlus', messages: ['añadió nuevo empleado', 'registró empleado'] },
  { type: 'candidate_approved', icon: 'CheckCircle', messages: ['aprobó candidato', 'validó candidato'] },
  { type: 'timecard_submitted', icon: 'Clock', messages: ['envió タイムカード', 'registró asistencia'] },
  { type: 'salary_calculated', icon: 'DollarSign', messages: ['calculó nómina', 'procesó salario'] },
  { type: 'request_approved', icon: 'FileCheck', messages: ['aprobó solicitud', 'validó permiso'] },
  { type: 'document_expired', icon: 'AlertTriangle', messages: ['documento expirado', 'visa vencida'] },
];

const USER_NAMES = [
  'Admin', 'María González', 'Tanaka-san', 'Yamamoto-san',
  'Nguyen Van', 'Chen Wei', 'Santos Juan'
];

// ============================================================================
// Data Generation Functions
// ============================================================================

/**
 * Generate time series data for the last N months
 */
export function generateTimeSeriesData(months: number = 12): TimeSeriesDataPoint[] {
  const data: TimeSeriesDataPoint[] = [];
  const now = new Date();

  // Base values with realistic ranges
  let baseEmployees = 45;
  let baseFactories = 6;
  let baseCandidates = 25;

  for (let i = months - 1; i >= 0; i--) {
    const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const monthIndex = date.getMonth();

    // Add some seasonal variation and growth trend
    const seasonalFactor = 1 + Math.sin((monthIndex / 12) * Math.PI * 2) * 0.15;
    const growthFactor = 1 + ((months - i) / months) * 0.3;

    const employees = Math.round(baseEmployees * seasonalFactor * growthFactor);
    const activeEmployees = Math.round(employees * (0.85 + Math.random() * 0.1));
    const hours = Math.round(employees * (75 + Math.random() * 15)); // 75-90 hrs per employee
    const salary = Math.round(employees * (155000 + Math.random() * 10000)); // ~160k JPY avg
    const factories = baseFactories + Math.floor(Math.random() * 3);
    const candidates = Math.round(baseCandidates * (0.8 + Math.random() * 0.4));
    const pendingApprovals = Math.floor(candidates * (0.2 + Math.random() * 0.2));

    data.push({
      month: MONTH_SHORT[monthIndex],
      monthFull: MONTH_NAMES[monthIndex],
      date: date.toISOString(),
      employees,
      activeEmployees,
      hours,
      salary,
      factories,
      candidates,
      pendingApprovals,
    });
  }

  return data;
}

/**
 * Generate distribution data for various categories
 */
export function generateDistributionData(): DistributionData {
  // Status distribution
  const statusData = [
    { name: 'Activos', value: 58, color: '#10B981' },
    { name: 'En permiso', value: 7, color: '#F59E0B' },
    { name: 'Terminado', value: 3, color: '#EF4444' },
  ];
  const statusTotal = statusData.reduce((sum, item) => sum + item.value, 0);
  const byStatus = statusData.map(item => ({
    ...item,
    percentage: Math.round((item.value / statusTotal) * 100),
  }));

  // Factory distribution
  const factoryData = FACTORY_NAMES.slice(0, 6).map((name, index) => ({
    name,
    value: Math.floor(15 - index * 2 + Math.random() * 3),
    color: `hsl(${index * 60}, 70%, 50%)`,
  }));
  const factoryTotal = factoryData.reduce((sum, item) => sum + item.value, 0);
  const byFactory = factoryData.map(item => ({
    ...item,
    percentage: Math.round((item.value / factoryTotal) * 100),
  }));

  // Nationality distribution
  const nationalityData = NATIONALITIES.map((nat, index) => ({
    name: nat.name,
    value: Math.floor(25 - index * 3 + Math.random() * 5),
    color: nat.color,
  }));
  const nationalityTotal = nationalityData.reduce((sum, item) => sum + item.value, 0);
  const byNationality = nationalityData.map(item => ({
    ...item,
    percentage: Math.round((item.value / nationalityTotal) * 100),
  }));

  // Contract type distribution
  const contractData = [
    { name: 'Tiempo completo', value: 45, color: '#3B82F6' },
    { name: 'Medio tiempo', value: 12, color: '#8B5CF6' },
    { name: 'Temporal', value: 8, color: '#EC4899' },
  ];
  const contractTotal = contractData.reduce((sum, item) => sum + item.value, 0);
  const byContractType = contractData.map(item => ({
    ...item,
    percentage: Math.round((item.value / contractTotal) * 100),
  }));

  return {
    byStatus,
    byFactory,
    byNationality,
    byContractType,
  };
}

/**
 * Generate recent activity logs
 */
export function generateActivityLogs(count: number = 20): ActivityLog[] {
  const logs: ActivityLog[] = [];
  const now = new Date();

  for (let i = 0; i < count; i++) {
    // Random activity type
    const activityType = ACTIVITY_TYPES[Math.floor(Math.random() * ACTIVITY_TYPES.length)];
    const messages = activityType.messages;

    // Random timestamp (last 7 days)
    const daysAgo = Math.floor(Math.random() * 7);
    const hoursAgo = Math.floor(Math.random() * 24);
    const timestamp = new Date(now);
    timestamp.setDate(timestamp.getDate() - daysAgo);
    timestamp.setHours(timestamp.getHours() - hoursAgo);

    logs.push({
      id: `activity-${i}`,
      type: activityType.type as ActivityLog['type'],
      user: USER_NAMES[Math.floor(Math.random() * USER_NAMES.length)],
      description: messages[Math.floor(Math.random() * messages.length)],
      timestamp,
      icon: activityType.icon,
    });
  }

  // Sort by timestamp descending (most recent first)
  return logs.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
}

/**
 * Generate upcoming items and alerts
 */
export function generateUpcomingItems(): UpcomingItem[] {
  const items: UpcomingItem[] = [];
  const now = new Date();

  // Pending approvals
  items.push({
    id: 'approval-1',
    type: 'pending_approval',
    title: '5 candidatos pendientes de aprobación',
    description: 'Revisar y aprobar candidatos nuevos',
    dueDate: new Date(now.getTime() + 1 * 24 * 60 * 60 * 1000),
    priority: 'high',
    icon: 'UserCheck',
  });

  // Expiring documents
  items.push({
    id: 'doc-1',
    type: 'expiring_document',
    title: '3 visas expiran este mes',
    description: 'Nguyen Van, Chen Wei, Santos Juan',
    dueDate: new Date(now.getTime() + 15 * 24 * 60 * 60 * 1000),
    priority: 'high',
    icon: 'AlertTriangle',
  });

  items.push({
    id: 'doc-2',
    type: 'expiring_document',
    title: '2 contratos por renovar',
    description: 'Revisar contratos que vencen próximamente',
    dueDate: new Date(now.getTime() + 20 * 24 * 60 * 60 * 1000),
    priority: 'medium',
    icon: 'FileText',
  });

  // Missing timecards
  items.push({
    id: 'timecard-1',
    type: 'missing_timecard',
    title: '8 タイムカード faltantes',
    description: 'Empleados sin registrar asistencia esta semana',
    dueDate: new Date(now.getTime() + 2 * 24 * 60 * 60 * 1000),
    priority: 'medium',
    icon: 'Clock',
  });

  // Upcoming payroll
  items.push({
    id: 'payroll-1',
    type: 'payroll_date',
    title: 'Procesamiento de nómina',
    description: 'Fecha límite para cálculo de salarios',
    dueDate: new Date(now.getFullYear(), now.getMonth(), 25),
    priority: 'high',
    icon: 'DollarSign',
  });

  items.push({
    id: 'approval-2',
    type: 'pending_approval',
    title: '12 solicitudes de permiso',
    description: 'Revisar solicitudes de 有給 y 半休',
    dueDate: new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000),
    priority: 'medium',
    icon: 'FileCheck',
  });

  // Sort by due date and priority
  return items.sort((a, b) => {
    // High priority first
    if (a.priority === 'high' && b.priority !== 'high') return -1;
    if (a.priority !== 'high' && b.priority === 'high') return 1;
    // Then by due date
    return a.dueDate.getTime() - b.dueDate.getTime();
  });
}

/**
 * Generate complete dashboard statistics with comparisons
 */
export function generateDashboardStats(): DashboardStats {
  // Current month stats
  const current = {
    totalEmployees: 65,
    activeEmployees: 58,
    totalCandidates: 32,
    pendingCandidates: 5,
    totalFactories: 8,
    totalHours: 5200,
    totalSalary: 10400000,
    pendingApprovals: 12,
  };

  // Previous month stats
  const previous = {
    totalEmployees: 58,
    activeEmployees: 52,
    totalCandidates: 28,
    pendingCandidates: 7,
    totalFactories: 8,
    totalHours: 4640,
    totalSalary: 9280000,
    pendingApprovals: 15,
  };

  // Calculate percentage changes
  const calculateChange = (current: number, previous: number) => {
    const change = ((current - previous) / previous) * 100;
    return {
      value: Math.abs(Math.round(change)),
      isPositive: change >= 0,
    };
  };

  const changes = {
    employees: calculateChange(current.totalEmployees, previous.totalEmployees),
    activeEmployees: calculateChange(current.activeEmployees, previous.activeEmployees),
    candidates: calculateChange(current.totalCandidates, previous.totalCandidates),
    pendingCandidates: {
      value: Math.abs(current.pendingCandidates - previous.pendingCandidates),
      isPositive: current.pendingCandidates < previous.pendingCandidates
    },
    factories: calculateChange(current.totalFactories, previous.totalFactories),
    hours: calculateChange(current.totalHours, previous.totalHours),
    salary: calculateChange(current.totalSalary, previous.totalSalary),
    approvals: {
      value: Math.abs(current.pendingApprovals - previous.pendingApprovals),
      isPositive: current.pendingApprovals < previous.pendingApprovals
    },
  };

  return {
    current,
    previous,
    changes,
  };
}

/**
 * Get all dashboard data in one call
 */
export function getAllDashboardData(): DashboardData {
  return {
    stats: generateDashboardStats(),
    timeSeries: generateTimeSeriesData(12),
    distribution: generateDistributionData(),
    recentActivity: generateActivityLogs(20),
    upcomingItems: generateUpcomingItems(),
  };
}

// ============================================================================
// Export default
// ============================================================================

export default {
  generateTimeSeriesData,
  generateDistributionData,
  generateActivityLogs,
  generateUpcomingItems,
  generateDashboardStats,
  getAllDashboardData,
};
