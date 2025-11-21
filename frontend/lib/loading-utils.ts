/**
 * Loading Utilities
 *
 * Helper hooks and utilities for managing loading states.
 */

import { useState, useEffect, useMemo } from 'react';

/**
 * Ensures loading state is shown for a minimum duration to prevent flashing.
 * Useful for fast API responses that would otherwise cause jarring UI flashes.
 *
 * @param isLoading - The actual loading state
 * @param minDuration - Minimum duration in milliseconds (default: 500ms)
 * @returns Boolean indicating if loading UI should be shown
 *
 * @example
 * const { isLoading } = useQuery(...);
 * const showLoading = useMinLoadingTime(isLoading, 500);
 * if (showLoading) return <LoadingSkeleton />;
 */
export function useMinLoadingTime(
  isLoading: boolean,
  minDuration: number = 500
): boolean {
  const [showLoading, setShowLoading] = useState(isLoading);
  const [startTime, setStartTime] = useState<number | null>(null);

  useEffect(() => {
    if (isLoading && !startTime) {
      // Loading started
      setStartTime(Date.now());
      setShowLoading(true);
    } else if (!isLoading && startTime) {
      // Loading finished
      const elapsed = Date.now() - startTime;
      const remaining = minDuration - elapsed;

      if (remaining > 0) {
        // Wait for minimum duration before hiding
        const timer = setTimeout(() => {
          setShowLoading(false);
          setStartTime(null);
        }, remaining);

        return () => clearTimeout(timer);
      } else {
        // Minimum duration already passed
        setShowLoading(false);
        setStartTime(null);
      }
    }
  }, [isLoading, startTime, minDuration]);

  return showLoading;
}

/**
 * Delays showing loading indicator to prevent flashing for fast operations.
 * Only shows loading UI if operation takes longer than the delay threshold.
 *
 * @param isLoading - The actual loading state
 * @param delay - Delay before showing loading UI in milliseconds (default: 200ms)
 * @returns Boolean indicating if loading UI should be shown
 *
 * @example
 * const { isLoading } = useQuery(...);
 * const showLoading = useDelayedLoading(isLoading, 300);
 * if (showLoading) return <LoadingSkeleton />;
 */
export function useDelayedLoading(
  isLoading: boolean,
  delay: number = 200
): boolean {
  const [showLoading, setShowLoading] = useState(false);

  useEffect(() => {
    if (isLoading) {
      // Start timer to show loading
      const timer = setTimeout(() => {
        setShowLoading(true);
      }, delay);

      return () => {
        clearTimeout(timer);
        setShowLoading(false);
      };
    } else {
      // Hide immediately when not loading
      setShowLoading(false);
    }
  }, [isLoading, delay]);

  return showLoading;
}

/**
 * Combines multiple loading states with smart delay and minimum duration.
 * Prevents UI flashing while ensuring smooth loading transitions.
 *
 * @param loadingStates - Array of loading boolean states
 * @param options - Configuration options
 * @returns Boolean indicating if loading UI should be shown
 *
 * @example
 * const { isLoading: loadingUsers } = useQuery(['users'], ...);
 * const { isLoading: loadingPosts } = useQuery(['posts'], ...);
 * const showLoading = useCombinedLoading([loadingUsers, loadingPosts]);
 */
export function useCombinedLoading(
  loadingStates: boolean[],
  options: {
    delay?: number;
    minDuration?: number;
    mode?: 'any' | 'all'; // 'any' = show if ANY is loading, 'all' = show if ALL are loading
  } = {}
): boolean {
  const { delay = 200, minDuration = 500, mode = 'any' } = options;

  const isLoading = useMemo(() => {
    if (mode === 'any') {
      return loadingStates.some((state) => state);
    } else {
      return loadingStates.every((state) => state);
    }
  }, [loadingStates, mode]);

  const delayed = useDelayedLoading(isLoading, delay);
  const withMinDuration = useMinLoadingTime(delayed, minDuration);

  return withMinDuration;
}

/**
 * Tracks loading progress for multiple async operations.
 * Useful for showing progress bars during multi-step processes.
 *
 * @example
 * const progress = useLoadingProgress([
 *   { isLoading: uploadingFiles, weight: 2 },
 *   { isLoading: processingData, weight: 1 },
 *   { isLoading: savingResults, weight: 1 },
 * ]);
 * // progress.percentage = 0-100
 * // progress.completed = number of completed steps
 * // progress.total = total number of steps
 */
export function useLoadingProgress(
  steps: Array<{ isLoading: boolean; weight?: number }>
): {
  percentage: number;
  completed: number;
  total: number;
  isComplete: boolean;
} {
  const total = steps.length;
  const completed = steps.filter((step) => !step.isLoading).length;

  // Calculate weighted percentage if weights are provided
  const percentage = useMemo(() => {
    const hasWeights = steps.some((step) => step.weight !== undefined);

    if (!hasWeights) {
      // Simple percentage
      return (completed / total) * 100;
    }

    // Weighted percentage
    const totalWeight = steps.reduce((sum, step) => sum + (step.weight || 1), 0);
    const completedWeight = steps
      .filter((step) => !step.isLoading)
      .reduce((sum, step) => sum + (step.weight || 1), 0);

    return (completedWeight / totalWeight) * 100;
  }, [steps, completed, total]);

  return {
    percentage: Math.min(100, Math.max(0, percentage)),
    completed,
    total,
    isComplete: completed === total,
  };
}

/**
 * Debounces a loading state to prevent rapid state changes.
 * Useful for search inputs or filters that trigger API calls.
 *
 * @param isLoading - The actual loading state
 * @param debounceMs - Debounce duration in milliseconds (default: 300ms)
 * @returns Debounced loading state
 *
 * @example
 * const { isLoading } = useQuery(['search', searchTerm], ...);
 * const debouncedLoading = useDebouncedLoading(isLoading, 300);
 */
export function useDebouncedLoading(
  isLoading: boolean,
  debounceMs: number = 300
): boolean {
  const [debouncedLoading, setDebouncedLoading] = useState(isLoading);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedLoading(isLoading);
    }, debounceMs);

    return () => clearTimeout(timer);
  }, [isLoading, debounceMs]);

  return debouncedLoading;
}

/**
 * Provides loading state with timeout detection.
 * Useful for detecting stuck or slow operations.
 *
 * @param isLoading - The actual loading state
 * @param timeoutMs - Timeout duration in milliseconds (default: 10000ms)
 * @returns Object with loading state and timeout flag
 *
 * @example
 * const { isLoading } = useQuery(...);
 * const { showLoading, hasTimedOut } = useLoadingWithTimeout(isLoading, 5000);
 * if (hasTimedOut) {
 *   return <TimeoutWarning onRetry={refetch} />;
 * }
 */
export function useLoadingWithTimeout(
  isLoading: boolean,
  timeoutMs: number = 10000
): {
  showLoading: boolean;
  hasTimedOut: boolean;
  reset: () => void;
} {
  const [hasTimedOut, setHasTimedOut] = useState(false);
  const [startTime, setStartTime] = useState<number | null>(null);

  useEffect(() => {
    if (isLoading && !startTime) {
      // Loading started
      setStartTime(Date.now());
      setHasTimedOut(false);
    } else if (!isLoading) {
      // Loading finished
      setStartTime(null);
      setHasTimedOut(false);
    }
  }, [isLoading, startTime]);

  useEffect(() => {
    if (isLoading && startTime) {
      const timer = setTimeout(() => {
        setHasTimedOut(true);
      }, timeoutMs);

      return () => clearTimeout(timer);
    }
  }, [isLoading, startTime, timeoutMs]);

  const reset = () => {
    setStartTime(null);
    setHasTimedOut(false);
  };

  return {
    showLoading: isLoading,
    hasTimedOut,
    reset,
  };
}

/**
 * Simple utility to create a stable loading state key for React Query.
 * Helps prevent unnecessary re-renders.
 *
 * @param keys - Array of values to include in the key
 * @returns Stable string key
 *
 * @example
 * const queryKey = createLoadingKey(['users', page, filters]);
 * const { isLoading } = useQuery(queryKey, ...);
 */
export function createLoadingKey(...keys: any[]): string {
  return JSON.stringify(keys);
}

/**
 * Type guard to check if an error is a network error
 */
export function isNetworkError(error: any): boolean {
  return (
    error?.message?.includes('Network') ||
    error?.message?.includes('fetch') ||
    error?.code === 'ECONNREFUSED' ||
    error?.code === 'ERR_NETWORK'
  );
}

/**
 * Type guard to check if an error is a timeout error
 */
export function isTimeoutError(error: any): boolean {
  return (
    error?.message?.includes('timeout') ||
    error?.code === 'ETIMEDOUT' ||
    error?.code === 'ECONNABORTED'
  );
}

/**
 * Type guard to check if an error is a permission error
 */
export function isPermissionError(error: any): boolean {
  return (
    error?.response?.status === 403 ||
    error?.status === 403 ||
    error?.message?.includes('Forbidden') ||
    error?.message?.includes('Permission denied')
  );
}

/**
 * Type guard to check if an error is a not found error
 */
export function isNotFoundError(error: any): boolean {
  return (
    error?.response?.status === 404 ||
    error?.status === 404 ||
    error?.message?.includes('Not found')
  );
}

/**
 * Determines the appropriate error type based on the error object
 */
export function getErrorType(error: any): 'network' | 'notfound' | 'forbidden' | 'server' | 'validation' | 'unknown' {
  if (isNetworkError(error) || isTimeoutError(error)) {
    return 'network';
  }
  if (isNotFoundError(error)) {
    return 'notfound';
  }
  if (isPermissionError(error)) {
    return 'forbidden';
  }
  if (error?.response?.status >= 500 || error?.status >= 500) {
    return 'server';
  }
  if (error?.response?.status === 400 || error?.status === 400) {
    return 'validation';
  }
  return 'unknown';
}
