'use client';

import { useEffect } from 'react';
import { ErrorDisplay } from '@/components/error-display';

interface GlobalErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function GlobalError({ error, reset }: GlobalErrorProps) {
  useEffect(() => {
    // Log error to console for debugging
    console.error('Global error caught:', error);
  }, [error]);

  // Check if it's a chunk loading error
  if (error.message.includes('Loading chunk')) {
    return (
      <ErrorDisplay
        title="Error de carga"
        description="No se pudo cargar un recurso necesario para la aplicación. Esto puede deberse a problemas de conexión o a una versión desactualizada."
        error={error}
        reset={reset}
        showRetry={true}
        showHome={true}
      />
    );
  }

  // Check if it's a network error
  if (error.message.includes('Network') || error.message.includes('fetch')) {
    return (
      <ErrorDisplay
        title="Error de conexión"
        description="No se pudo conectar con el servidor. Por favor, verifica tu conexión a internet e intenta de nuevo."
        error={error}
        reset={reset}
        showRetry={true}
        showHome={false}
      />
    );
  }

  // Default error display
  return (
    <ErrorDisplay
      error={error}
      reset={reset}
      showRetry={true}
      showHome={true}
    />
  );
}

// Component for handling chunk loading errors at the window level
export function ChunkErrorHandler() {
  useEffect(() => {
    const handleChunkError = (event: ErrorEvent) => {
      if (event.message && event.message.includes('Loading chunk')) {
        console.error('Chunk loading error detected:', event);
        // Reload the page after a short delay to retry loading the chunk
        setTimeout(() => {
          window.location.reload();
        }, 1000);
      }
    };

    const handleUnhandledRejection = (event: PromiseRejectionEvent) => {
      console.error('Unhandled promise rejection:', event);
      // You might want to show a toast notification here
    };

    window.addEventListener('error', handleChunkError);
    window.addEventListener('unhandledrejection', handleUnhandledRejection);

    return () => {
      window.removeEventListener('error', handleChunkError);
      window.removeEventListener('unhandledrejection', handleUnhandledRejection);
    };
  }, []);

  return null;
}