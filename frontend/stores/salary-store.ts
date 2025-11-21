/**
 * Salary Store - Zustand State Management
 * Gestión de estado para el módulo de salarios
 */
import { create } from 'zustand';
import { SalaryCalculation, SalaryReportFilters } from '@/types/api';

interface SalaryState {
  // Data
  salaries: SalaryCalculation[];
  selectedSalary: SalaryCalculation | null;
  reportFilters: SalaryReportFilters;
  reportData: any | null;

  // UI State
  loading: boolean;
  error: string | null;

  // Actions
  setSalaries: (salaries: SalaryCalculation[]) => void;
  setSelectedSalary: (salary: SalaryCalculation | null) => void;
  setReportFilters: (filters: SalaryReportFilters) => void;
  setReportData: (data: any) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  clearError: () => void;
  reset: () => void;
}

export const useSalaryStore = create<SalaryState>((set) => ({
  // Initial state
  salaries: [],
  selectedSalary: null,
  reportFilters: {},
  reportData: null,
  loading: false,
  error: null,

  // Actions
  setSalaries: (salaries) => set({ salaries }),
  setSelectedSalary: (salary) => set({ selectedSalary: salary }),
  setReportFilters: (filters) => set({ reportFilters: filters }),
  setReportData: (data) => set({ reportData: data }),
  setLoading: (loading) => set({ loading }),
  setError: (error) => set({ error }),
  clearError: () => set({ error: null }),
  reset: () =>
    set({
      salaries: [],
      selectedSalary: null,
      reportFilters: {},
      reportData: null,
      loading: false,
      error: null,
    }),
}));

// Helper hooks
export const useSalaries = () => useSalaryStore((state) => state.salaries);
export const useSelectedSalary = () => useSalaryStore((state) => state.selectedSalary);
export const useReportFilters = () => useSalaryStore((state) => state.reportFilters);
export const useReportData = () => useSalaryStore((state) => state.reportData);
export const useSalaryLoading = () => useSalaryStore((state) => state.loading);
export const useSalaryError = () => useSalaryStore((state) => state.error);
