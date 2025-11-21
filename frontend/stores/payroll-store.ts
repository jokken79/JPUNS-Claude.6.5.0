/**
 * Payroll Store - Zustand State Management
 * Gestión de estado para el sistema de payroll
 */
import { create } from 'zustand';
import {
  PayrollRun,
  EmployeePayrollResult,
  PayrollSettings,
  PayrollSummary,
  BulkPayrollResult,
} from '@/lib/payroll-api';

interface PayrollState {
  // Data
  payrollRuns: PayrollRun[];
  selectedPayrollRun: PayrollRun | null;
  payrollSummary: PayrollSummary[];
  payrollSettings: PayrollSettings | null;
  currentEmployeePayroll: EmployeePayrollResult | null;
  bulkCalculationResult: BulkPayrollResult | null;

  // UI State
  loading: boolean;
  error: string | null;

  // Actions
  setPayrollRuns: (runs: PayrollRun[]) => void;
  setSelectedPayrollRun: (run: PayrollRun | null) => void;
  setPayrollSummary: (summary: PayrollSummary[]) => void;
  setPayrollSettings: (settings: PayrollSettings) => void;
  setCurrentEmployeePayroll: (payroll: EmployeePayrollResult | null) => void;
  setBulkCalculationResult: (result: BulkPayrollResult | null) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  clearError: () => void;
}

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

  // Actions
  setPayrollRuns: (runs) => set({ payrollRuns: runs }),
  setSelectedPayrollRun: (run) => set({ selectedPayrollRun: run }),
  setPayrollSummary: (summary) => set({ payrollSummary: summary }),
  setPayrollSettings: (settings) => set({ payrollSettings: settings }),
  setCurrentEmployeePayroll: (payroll) => set({ currentEmployeePayroll: payroll }),
  setBulkCalculationResult: (result) => set({ bulkCalculationResult: result }),
  setLoading: (loading) => set({ loading }),
  setError: (error) => set({ error }),
  clearError: () => set({ error: null }),
}));

// Helper hooks
export const usePayrollRuns = () => usePayrollStore((state) => state.payrollRuns);
export const useSelectedPayrollRun = () => usePayrollStore((state) => state.selectedPayrollRun);
export const usePayrollSummary = () => usePayrollStore((state) => state.payrollSummary);
export const usePayrollSettings = () => usePayrollStore((state) => state.payrollSettings);
export const useCurrentEmployeePayroll = () => usePayrollStore((state) => state.currentEmployeePayroll);
export const useBulkCalculationResult = () => usePayrollStore((state) => state.bulkCalculationResult);
export const usePayrollLoading = () => usePayrollStore((state) => state.loading);
export const usePayrollError = () => usePayrollStore((state) => state.error);
