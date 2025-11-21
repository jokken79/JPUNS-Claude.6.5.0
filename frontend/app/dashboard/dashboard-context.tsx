'use client';

import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { getAllDashboardData, type DashboardData } from '@/lib/dashboard-data';

// ============================================================================
// Types
// ============================================================================

export type DateRangeType = '7days' | '30days' | '90days' | '1year' | 'custom';

export interface DateRange {
  type: DateRangeType;
  start: Date;
  end: Date;
}

export interface ComparisonMode {
  enabled: boolean;
  period: 'previous' | 'lastYear' | 'custom';
}

export interface DashboardContextValue {
  // Data
  data: DashboardData | null;
  isLoading: boolean;
  error: Error | null;

  // Date range
  dateRange: DateRange;
  setDateRange: (type: DateRangeType, start?: Date, end?: Date) => void;

  // Comparison
  comparison: ComparisonMode;
  setComparison: (mode: ComparisonMode) => void;

  // Refresh
  refresh: () => void;
  lastRefreshed: Date | null;
  autoRefresh: boolean;
  setAutoRefresh: (enabled: boolean) => void;

  // Filters
  selectedFactories: string[];
  setSelectedFactories: (factories: string[]) => void;

  // View preferences
  chartType: 'line' | 'bar' | 'area';
  setChartType: (type: 'line' | 'bar' | 'area') => void;
}

// ============================================================================
// Context
// ============================================================================

const DashboardContext = createContext<DashboardContextValue | undefined>(undefined);

// ============================================================================
// Provider Component
// ============================================================================

interface DashboardProviderProps {
  children: React.ReactNode;
  initialData?: DashboardData;
}

export function DashboardProvider({ children, initialData }: DashboardProviderProps) {
  // Data state
  const [data, setData] = useState<DashboardData | null>(initialData || null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  // Date range state (default: last 30 days)
  const [dateRange, setDateRangeState] = useState<DateRange>(() => {
    const end = new Date();
    const start = new Date();
    start.setDate(start.getDate() - 30);
    return {
      type: '30days',
      start,
      end,
    };
  });

  // Comparison state
  const [comparison, setComparison] = useState<ComparisonMode>({
    enabled: true,
    period: 'previous',
  });

  // Refresh state
  const [lastRefreshed, setLastRefreshed] = useState<Date | null>(null);
  const [autoRefresh, setAutoRefresh] = useState(false);

  // Filter state
  const [selectedFactories, setSelectedFactories] = useState<string[]>([]);

  // View preferences
  const [chartType, setChartType] = useState<'line' | 'bar' | 'area'>('area');

  // ============================================================================
  // Functions
  // ============================================================================

  /**
   * Refresh dashboard data
   */
  const refresh = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      // Simulate API call delay in development
      await new Promise(resolve => setTimeout(resolve, 500));

      // Get fresh data
      const freshData = getAllDashboardData();
      setData(freshData);
      setLastRefreshed(new Date());
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to refresh dashboard'));
      console.error('Dashboard refresh error:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  /**
   * Set date range with helper function
   */
  const setDateRange = useCallback((type: DateRangeType, start?: Date, end?: Date) => {
    const newEnd = end || new Date();
    let newStart = start || new Date();

    // Calculate start date based on type if not provided
    if (!start) {
      switch (type) {
        case '7days':
          newStart = new Date();
          newStart.setDate(newStart.getDate() - 7);
          break;
        case '30days':
          newStart = new Date();
          newStart.setDate(newStart.getDate() - 30);
          break;
        case '90days':
          newStart = new Date();
          newStart.setDate(newStart.getDate() - 90);
          break;
        case '1year':
          newStart = new Date();
          newStart.setFullYear(newStart.getFullYear() - 1);
          break;
        case 'custom':
          // Keep provided dates
          break;
      }
    }

    setDateRangeState({
      type,
      start: newStart,
      end: newEnd,
    });

    // Refresh data when date range changes
    refresh();
  }, [refresh]);

  // ============================================================================
  // Effects
  // ============================================================================

  /**
   * Load initial data
   */
  useEffect(() => {
    if (!data && !initialData) {
      refresh();
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  /**
   * Auto-refresh every 30 seconds if enabled
   */
  useEffect(() => {
    if (!autoRefresh) return;

    const interval = setInterval(() => {
      refresh();
    }, 30000); // 30 seconds

    return () => clearInterval(interval);
  }, [autoRefresh, refresh]);

  /**
   * Refresh when comparison mode changes
   */
  useEffect(() => {
    if (data) {
      refresh();
    }
  }, [comparison.enabled, comparison.period]); // eslint-disable-line react-hooks/exhaustive-deps

  // ============================================================================
  // Context Value
  // ============================================================================

  const contextValue: DashboardContextValue = {
    // Data
    data,
    isLoading,
    error,

    // Date range
    dateRange,
    setDateRange,

    // Comparison
    comparison,
    setComparison,

    // Refresh
    refresh,
    lastRefreshed,
    autoRefresh,
    setAutoRefresh,

    // Filters
    selectedFactories,
    setSelectedFactories,

    // View preferences
    chartType,
    setChartType,
  };

  return (
    <DashboardContext.Provider value={contextValue}>
      {children}
    </DashboardContext.Provider>
  );
}

// ============================================================================
// Hook
// ============================================================================

/**
 * Use dashboard context
 */
export function useDashboard() {
  const context = useContext(DashboardContext);
  if (context === undefined) {
    throw new Error('useDashboard must be used within a DashboardProvider');
  }
  return context;
}

// ============================================================================
// Exports
// ============================================================================

export default DashboardContext;
