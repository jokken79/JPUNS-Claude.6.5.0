/**
 * Payroll Store - Zustand State Management
 * Gestión de estado para el sistema de payroll
 *
 * Created using the factory pattern to reduce code duplication.
 * Maintains 100% backward compatibility with existing exports.
 */
import {
  PayrollRun,
  EmployeePayrollResult,
  PayrollSettings,
  PayrollSummary,
  BulkPayrollResult,
} from '@/lib/payroll-api';
import { createMultipleSetters, createMultipleSelectors } from './store-factory';

// Define the data structure
interface PayrollData {
  payrollRuns: PayrollRun[];
  selectedPayrollRun: PayrollRun | null;
  payrollSummary: PayrollSummary[];
  payrollSettings: PayrollSettings | null;
  currentEmployeePayroll: EmployeePayrollResult | null;
  bulkCalculationResult: BulkPayrollResult | null;
}

// Create store using factory pattern
import { create } from 'zustand';

type PayrollState = PayrollData & {
  loading: boolean;
  error: string | null;
  setPayrollRuns: (runs: PayrollRun[]) => void;
  setSelectedPayrollRun: (run: PayrollRun | null) => void;
  setPayrollSummary: (summary: PayrollSummary[]) => void;
  setPayrollSettings: (settings: PayrollSettings) => void;
  setCurrentEmployeePayroll: (payroll: EmployeePayrollResult | null) => void;
  setBulkCalculationResult: (result: BulkPayrollResult | null) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  clearError: () => void;
};

export const usePayrollStore = create<PayrollState>((set) => ({
  // Initial state
  payrollRuns: [],
  selectedPayrollRun: null,
  payrollSummary: [],
  payrollSettings: null,
  currentEmployeePayroll: null,
  bulkCalculationResult: null,
  loading: false,
  error: null,

  // Data setters
  setPayrollRuns: (runs) => set({ payrollRuns: runs }),
  setSelectedPayrollRun: (run) => set({ selectedPayrollRun: run }),
  setPayrollSummary: (summary) => set({ payrollSummary: summary }),
  setPayrollSettings: (settings) => set({ payrollSettings: settings }),
  setCurrentEmployeePayroll: (payroll) => set({ currentEmployeePayroll: payroll }),
  setBulkCalculationResult: (result) => set({ bulkCalculationResult: result }),

  // Standard setters (always present with factory pattern)
  setLoading: (loading) => set({ loading }),
  setError: (error) => set({ error }),
  clearError: () => set({ error: null }),
}));

// Helper hooks - All maintained for backward compatibility
export const usePayrollRuns = () => usePayrollStore((state) => state.payrollRuns);
export const useSelectedPayrollRun = () => usePayrollStore((state) => state.selectedPayrollRun);
export const usePayrollSummary = () => usePayrollStore((state) => state.payrollSummary);
export const usePayrollSettings = () => usePayrollStore((state) => state.payrollSettings);
export const useCurrentEmployeePayroll = () => usePayrollStore((state) => state.currentEmployeePayroll);
export const useBulkCalculationResult = () => usePayrollStore((state) => state.bulkCalculationResult);
export const usePayrollLoading = () => usePayrollStore((state) => state.loading);
export const usePayrollError = () => usePayrollStore((state) => state.error);
