'use client';

import GlobalError from '@/components/global-error-handler';

// Disable static generation for error boundary
export const dynamic = 'force-dynamic';

export default function GlobalErrorBoundary({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return <GlobalError error={error} reset={reset} />;
}