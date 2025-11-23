'use client';

import React, { Component, ErrorInfo, ReactNode } from 'react';
import { ErrorDisplay, ChunkLoadError, NetworkError, AuthError } from '@/components/error-display';

interface ErrorBoundaryProps {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
  errorType: 'generic' | 'chunk' | 'network' | 'auth';
}

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      errorType: 'generic',
    };
  }

  static getDerivedStateFromError(error: Error): Partial<ErrorBoundaryState> {
    // Determine error type
    let errorType: 'generic' | 'chunk' | 'network' | 'auth' = 'generic';
    
    if (error.message.includes('Loading chunk')) {
      errorType = 'chunk';
    } else if (error.message.includes('Network') || error.message.includes('fetch')) {
      errorType = 'network';
    } else if (error.message.includes('Unauthorized') || error.message.includes('401')) {
      errorType = 'auth';
    }
    
    return { hasError: true, error, errorType };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    // Log error to console for debugging
    console.error('ErrorBoundary caught an error:', error);
    console.error('Error Info:', errorInfo);

    // Update state with error details
    this.setState({
      error,
      errorInfo,
    });

    // Call custom error handler if provided
    if (this.props.onError) {
      this.props.onError(error, errorInfo);
    }

    // You could also log the error to an error reporting service here
    // Example: logErrorToService(error, errorInfo);
  }

  handleReset = (): void => {
    // Reset error state
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
      errorType: 'generic',
    });
  };

  render(): ReactNode {
    if (this.state.hasError) {
      // If custom fallback is provided, use it
      if (this.props.fallback) {
        return this.props.fallback;
      }

      // Otherwise, render appropriate error display based on error type
      switch (this.state.errorType) {
        case 'chunk':
          return <ChunkLoadError reset={this.handleReset} />;
        case 'network':
          return <NetworkError reset={this.handleReset} />;
        case 'auth':
          return <AuthError reset={this.handleReset} />;
        default:
          return (
            <ErrorDisplay
              error={this.state.error || undefined}
              reset={this.handleReset}
            />
          );
      }
    }

    return this.props.children;
  }
}

// Hook for handling errors in functional components
export function useErrorHandler() {
  const [error, setError] = React.useState<Error | null>(null);

  const resetError = React.useCallback(() => {
    setError(null);
  }, []);

  const handleError = React.useCallback((error: Error) => {
    console.error('Error caught by useErrorHandler:', error);
    setError(error);
  }, []);

  // Throw error to be caught by ErrorBoundary
  if (error) {
    throw error;
  }

  return { handleError, resetError };
}

// HOC for wrapping components with error boundary
export function withErrorBoundary<P extends object>(
  Component: React.ComponentType<P>,
  errorBoundaryProps?: Omit<ErrorBoundaryProps, 'children'>
) {
  const WrappedComponent = (props: P) => (
    <ErrorBoundary {...errorBoundaryProps}>
      <Component {...props} />
    </ErrorBoundary>
  );

  WrappedComponent.displayName = `withErrorBoundary(${Component.displayName || Component.name})`;

  return WrappedComponent;
}
