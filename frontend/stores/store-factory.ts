/**
 * Zustand Store Factory
 *
 * Practical factory pattern for creating standardized Zustand stores with:
 * - Pre-built state initialization with loading/error
 * - Standard setter pattern (setProperty -> set({ property: value }))
 * - Helper hooks for accessing individual properties
 * - Optional persist middleware support
 * - Optional reset action support
 * - Full TypeScript type safety
 *
 * This pattern reduces code duplication while keeping stores simple and maintainable.
 */

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { StateStorage } from 'zustand/middleware';

/**
 * Creates a standard entity store factory pattern
 *
 * Example usage:
 * ```typescript
 * interface PayrollData {
 *   payrollRuns: PayrollRun[];
 *   selectedPayrollRun: PayrollRun | null;
 *   payrollSummary: PayrollSummary[];
 * }
 *
 * export const { usePayrollStore, createPayrollActions } = createSimpleStore<PayrollData>({
 *   initialState: {
 *     payrollRuns: [],
 *     selectedPayrollRun: null,
 *     payrollSummary: [],
 *   },
 *   persistKey: 'payroll-storage',
 * });
 * ```
 */
export function createSimpleStore<TState extends Record<string, any>>(options: {
  initialState: TState;
  persistKey?: string;
  resetable?: boolean;
}) {
  // Add loading and error to state
  type State = TState & {
    loading: boolean;
    error: string | null;
  };

  // Create store
  const useStore = options.persistKey
    ? create<State>()(
        persist(
          (set) => ({
            ...options.initialState,
            loading: false,
            error: null,

            // Standard actions - always included
            setLoading: (loading: boolean) => set({ loading }),
            setError: (error: string | null) => set({ error }),
            clearError: () => set({ error: null }),

            // Reset action if enabled
            ...(options.resetable && {
              reset: () =>
                set({
                  ...options.initialState,
                  loading: false,
                  error: null,
                }),
            }),
          } as any),
          {
            name: options.persistKey,
          }
        )
      )
    : create<State>((set) => ({
        ...options.initialState,
        loading: false,
        error: null,

        // Standard actions - always included
        setLoading: (loading: boolean) => set({ loading }),
        setError: (error: string | null) => set({ error }),
        clearError: () => set({ error: null }),

        // Reset action if enabled
        ...(options.resetable && {
          reset: () =>
            set({
              ...options.initialState,
              loading: false,
              error: null,
            }),
        }),
      } as any));

  // Helper function to create setters for a property
  const createSetters = <K extends keyof TState>(key: K) => {
    const setterName = `set${String(key).charAt(0).toUpperCase()}${String(key).slice(1)}`;
    return {
      [setterName]: (value: TState[K]) => useStore.setState({ [key]: value }),
    } as Record<string, (value: TState[K]) => void>;
  };

  // Helper function to create a selector hook for a property
  const createSelector = <K extends keyof TState>(key: K) => {
    const hookName = `use${String(key).charAt(0).toUpperCase()}${String(key).slice(1)}`;
    return {
      [hookName]: () => useStore((state) => state[key]),
    } as Record<string, () => TState[K]>;
  };

  return {
    useStore,
    createSetters,
    createSelector,
  };
}

/**
 * Alternative: Helper to create multiple setters at once
 *
 * Usage:
 * ```typescript
 * const setters = createMultipleSetters<PayrollData>(usePayrollStore, [
 *   'payrollRuns',
 *   'selectedPayrollRun',
 *   'payrollSummary',
 * ]);
 * ```
 */
export function createMultipleSetters<TState extends Record<string, any>>(
  useStore: ReturnType<typeof create<TState>>,
  keys: Array<keyof TState>
): Record<string, (value: any) => void> {
  const setters: Record<string, (value: any) => void> = {};

  keys.forEach((key) => {
    const setterName = `set${String(key).charAt(0).toUpperCase()}${String(key).slice(1)}`;
    setters[setterName] = (value: any) => useStore.setState({ [key]: value });
  });

  return setters;
}

/**
 * Alternative: Helper to create multiple selector hooks at once
 *
 * Usage:
 * ```typescript
 * const selectors = createMultipleSelectors(usePayrollStore, [
 *   'payrollRuns',
 *   'selectedPayrollRun',
 *   'payrollSummary',
 * ]);
 * ```
 */
export function createMultipleSelectors<TState extends Record<string, any>>(
  useStore: ReturnType<typeof create<TState>>,
  keys: Array<keyof TState>
): Record<string, () => any> {
  const selectors: Record<string, () => any> = {};

  keys.forEach((key) => {
    const hookName = `use${String(key).charAt(0).toUpperCase()}${String(key).slice(1)}`;
    selectors[hookName] = () => useStore((state) => state[key]);
  });

  return selectors;
}
