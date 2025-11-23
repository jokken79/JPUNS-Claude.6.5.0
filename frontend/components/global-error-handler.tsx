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
