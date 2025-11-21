'use client';

/**
 * SuspenseBoundary Component
 *
 * Combines React Suspense with Error Boundary for robust async component handling.
 * Includes loading timeout warnings and error recovery.
 */

import { Suspense, Component, ReactNode, useState, useEffect } from 'react';
import { ErrorState } from './error-state';
import { PageSkeleton } from './page-skeleton';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertTriangle } from 'lucide-react';
import { Button } from './ui/button';

export interface SuspenseBoundaryProps {
  /**
   * Children to render
   */
  children: ReactNode;

  /**
   * Fallback component while loading
   */
  fallback?: ReactNode;

  /**
   * Fallback type (if not providing custom fallback)
   */
  fallbackType?: 'dashboard' | 'list' | 'form' | 'detail';

  /**
   * Show warning after this many milliseconds
   */
  loadingTimeoutMs?: number;

  /**
   * Custom error component
   */
  errorFallback?: (error: Error, reset: () => void) => ReactNode;

  /**
   * Error boundary name (for debugging)
   */
  name?: string;

  /**
   * Callback when error occurs
   */
  onError?: (error: Error, errorInfo: React.ErrorInfo) => void;

  /**
   * Callback when reset
   */
  onReset?: () => void;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

/**
 * Error Boundary Class Component
 */
class ErrorBoundaryComponent extends Component<
  {
    children: ReactNode;
    fallback?: (error: Error, reset: () => void) => ReactNode;
    name?: string;
    onError?: (error: Error, errorInfo: React.ErrorInfo) => void;
    onReset?: () => void;
  },
  ErrorBoundaryState
> {
  constructor(props: any) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error(
      `[ErrorBoundary${this.props.name ? ` ${this.props.name}` : ''}]:`,
      error,
      errorInfo
    );

    if (this.props.onError) {
      this.props.onError(error, errorInfo);
    }
  }

  reset = () => {
    if (this.props.onReset) {
      this.props.onReset();
    }
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError && this.state.error) {
      if (this.props.fallback) {
        return this.props.fallback(this.state.error, this.reset);
      }

      return (
        <ErrorState
          type="unknown"
          title="Something went wrong"
          message="An unexpected error occurred while rendering this component."
          details={this.state.error}
          onRetry={this.reset}
          showRetry={true}
          showGoBack={false}
        />
      );
    }

    return this.props.children;
  }
}

/**
 * Loading timeout warning component
 */
function LoadingTimeoutWarning({ onRetry }: { onRetry?: () => void }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      className="fixed top-4 right-4 z-50 max-w-sm"
    >
      <div className="bg-yellow-50 dark:bg-yellow-950/20 border-2 border-yellow-200 dark:border-yellow-800 rounded-lg p-4 shadow-lg">
        <div className="flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <h4 className="text-sm font-semibold text-yellow-900 dark:text-yellow-100 mb-1">
              Taking longer than expected
            </h4>
            <p className="text-xs text-yellow-700 dark:text-yellow-300 mb-3">
              The page is still loading. This might be due to a slow connection or server issue.
            </p>
            {onRetry && (
              <Button
                onClick={onRetry}
                size="sm"
                variant="outline"
                className="text-xs"
              >
                Refresh Page
              </Button>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  );
}

/**
 * Suspense fallback with timeout warning
 */
function SuspenseFallbackWithTimeout({
  fallback,
  timeoutMs,
  onTimeout,
}: {
  fallback: ReactNode;
  timeoutMs: number;
  onTimeout?: () => void;
}) {
  const [showWarning, setShowWarning] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setShowWarning(true);
      if (onTimeout) {
        onTimeout();
      }
    }, timeoutMs);

    return () => clearTimeout(timer);
  }, [timeoutMs, onTimeout]);

  return (
    <>
      {fallback}
      <AnimatePresence>
        {showWarning && (
          <LoadingTimeoutWarning
            onRetry={() => {
              window.location.reload();
            }}
          />
        )}
      </AnimatePresence>
    </>
  );
}

/**
 * Main SuspenseBoundary component
 */
export function SuspenseBoundary({
  children,
  fallback,
  fallbackType = 'list',
  loadingTimeoutMs = 10000, // 10 seconds
  errorFallback,
  name,
  onError,
  onReset,
}: SuspenseBoundaryProps) {
  // Use custom fallback or default PageSkeleton
  const loadingFallback = fallback || <PageSkeleton type={fallbackType} />;

  return (
    <ErrorBoundaryComponent
      fallback={errorFallback}
      name={name}
      onError={onError}
      onReset={onReset}
    >
      <Suspense
        fallback={
          <SuspenseFallbackWithTimeout
            fallback={loadingFallback}
            timeoutMs={loadingTimeoutMs}
            onTimeout={() => {
              console.warn(
                `[SuspenseBoundary${name ? ` ${name}` : ''}]: Loading timeout exceeded (${loadingTimeoutMs}ms)`
              );
            }}
          />
        }
      >
        {children}
      </Suspense>
    </ErrorBoundaryComponent>
  );
}

/**
 * Pre-configured suspense boundaries for common page types
 */

export function DashboardSuspenseBoundary({ children }: { children: ReactNode }) {
  return (
    <SuspenseBoundary fallbackType="dashboard" name="Dashboard">
      {children}
    </SuspenseBoundary>
  );
}

export function ListPageSuspenseBoundary({ children }: { children: ReactNode }) {
  return (
    <SuspenseBoundary fallbackType="list" name="ListPage">
      {children}
    </SuspenseBoundary>
  );
}

export function FormPageSuspenseBoundary({ children }: { children: ReactNode }) {
  return (
    <SuspenseBoundary fallbackType="form" name="FormPage">
      {children}
    </SuspenseBoundary>
  );
}

export function DetailPageSuspenseBoundary({ children }: { children: ReactNode }) {
  return (
    <SuspenseBoundary fallbackType="detail" name="DetailPage">
      {children}
    </SuspenseBoundary>
  );
}
