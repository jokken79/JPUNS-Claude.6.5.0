'use client';

import React, { ReactNode } from 'react';
import { ErrorBoundary } from '@/components/error-boundary';

interface ErrorBoundaryWrapperProps {
  children: ReactNode;
}

export function ErrorBoundaryWrapper({ children }: ErrorBoundaryWrapperProps) {
  return (
    <ErrorBoundary
      onError={(error, errorInfo) => {
        console.error('Global error caught:', error);
        console.error('Error component stack:', errorInfo.componentStack);

        // Log to external service if needed
        // logErrorToService(error, errorInfo);
      }}
    >
      {children}
    </ErrorBoundary>
  );
}
