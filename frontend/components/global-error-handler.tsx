'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export function ChunkErrorHandler() {
  const router = useRouter();

  useEffect(() => {
    const handleChunkError = (event: ErrorEvent) => {
      const chunkFailedMessage = /Loading chunk [\d]+ failed/;
      const cssChunkFailedMessage = /Loading CSS chunk [\d]+ failed/;

      if (
        event.message &&
        (chunkFailedMessage.test(event.message) || cssChunkFailedMessage.test(event.message))
      ) {
        console.warn('Chunk loading failed, attempting to reload...');

        // Prevent the default error handling
        event.preventDefault();

        // Show a user-friendly notification
        if (typeof window !== 'undefined') {
          const shouldReload = window.confirm(
            'A new version of the application is available. Would you like to reload the page?'
          );

          if (shouldReload) {
            window.location.reload();
          }
        }
      }
    };

    const handleUnhandledRejection = (event: PromiseRejectionEvent) => {
      const chunkFailedMessage = /Loading chunk [\d]+ failed/;
      const errorMessage = event.reason?.message || event.reason || '';

      if (chunkFailedMessage.test(errorMessage)) {
        console.warn('Chunk loading failed (unhandled promise), attempting to reload...');

        // Prevent the default error handling
        event.preventDefault();

        // Show a user-friendly notification
        if (typeof window !== 'undefined') {
          const shouldReload = window.confirm(
            'A new version of the application is available. Would you like to reload the page?'
          );

          if (shouldReload) {
            window.location.reload();
          }
        }
      }
    };

    // Add event listeners
    window.addEventListener('error', handleChunkError);
    window.addEventListener('unhandledrejection', handleUnhandledRejection);

    // Cleanup
    return () => {
      window.removeEventListener('error', handleChunkError);
      window.removeEventListener('unhandledrejection', handleUnhandledRejection);
    };
  }, [router]);

  return null;
}

// Default export for global error boundary
export default function GlobalErrorHandler({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log error to console
    console.error('Global error:', error);
  }, [error]);

  return (
    <html>
      <body>
        <div style={{ 
          display: 'flex', 
          flexDirection: 'column', 
          alignItems: 'center', 
          justifyContent: 'center', 
          minHeight: '100vh',
          padding: '20px',
          fontFamily: 'system-ui, sans-serif'
        }}>
          <h1 style={{ fontSize: '2rem', marginBottom: '1rem', color: '#dc2626' }}>
            Something went wrong!
          </h1>
          <p style={{ marginBottom: '1.5rem', color: '#6b7280', textAlign: 'center' }}>
            An unexpected error occurred. Please try refreshing the page.
          </p>
          {error.digest && (
            <p style={{ marginBottom: '1rem', fontSize: '0.875rem', color: '#9ca3af' }}>
              Error ID: {error.digest}
            </p>
          )}
          <div style={{ display: 'flex', gap: '1rem' }}>
            <button
              onClick={() => reset()}
              style={{
                padding: '0.5rem 1rem',
                backgroundColor: '#3b82f6',
                color: 'white',
                border: 'none',
                borderRadius: '0.375rem',
                cursor: 'pointer',
                fontSize: '1rem'
              }}
            >
              Try again
            </button>
            <button
              onClick={() => window.location.href = '/'}
              style={{
                padding: '0.5rem 1rem',
                backgroundColor: '#6b7280',
                color: 'white',
                border: 'none',
                borderRadius: '0.375rem',
                cursor: 'pointer',
                fontSize: '1rem'
              }}
            >
              Go to Home
            </button>
          </div>
        </div>
      </body>
    </html>
  );
}
