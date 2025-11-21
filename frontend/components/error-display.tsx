'use client';

import React from 'react';
import { AlertTriangle, RefreshCw, Home } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface ErrorDisplayProps {
  error?: Error;
  reset?: () => void;
  title?: string;
  description?: string;
  showRetry?: boolean;
  showHome?: boolean;
}

export function ErrorDisplay({
  error,
  reset,
  title = "Algo salió mal",
  description = "Se ha producido un error inesperado en la aplicación",
  showRetry = true,
  showHome = true,
}: ErrorDisplayProps) {
  const handleReload = () => {
    window.location.reload();
  };

  const handleGoHome = () => {
    window.location.href = '/';
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <div className="max-w-md w-full space-y-6">
        <div className="text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-destructive/10 mb-4">
            <AlertTriangle className="h-8 w-8 text-destructive" />
          </div>
          <h1 className="text-2xl font-bold text-foreground">{title}</h1>
          <p className="text-muted-foreground mt-2">{description}</p>
        </div>

        {error && (
          <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-4">
            <h3 className="font-semibold text-sm mb-2 text-destructive">
              Error:
            </h3>
            <p className="text-sm font-mono text-muted-foreground break-all">
              {error.toString()}
            </p>
          </div>
        )}

        {process.env.NODE_ENV === 'development' && error?.stack && (
          <details className="bg-muted/50 border border-border rounded-lg p-4">
            <summary className="cursor-pointer font-semibold text-sm mb-2">
              Stack Trace (Development Only)
            </summary>
            <pre className="text-xs overflow-auto max-h-64 text-muted-foreground mt-2 whitespace-pre-wrap">
              {error.stack}
            </pre>
          </details>
        )}

        <div className="bg-muted/30 border border-border rounded-lg p-4">
          <h3 className="font-semibold text-sm mb-2">
            Qué puedes hacer:
          </h3>
          <ul className="text-sm space-y-1 text-muted-foreground list-disc list-inside">
            <li>Intenta volver a cargar la página</li>
            <li>Verifica tu conexión a internet</li>
            <li>Si el problema persiste, contacta al soporte técnico</li>
          </ul>
        </div>

        <div className="flex gap-3 flex-wrap">
          {showRetry && reset && (
            <Button
              onClick={reset}
              variant="outline"
              className="flex-1 min-w-[140px]"
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Intentar de nuevo
            </Button>
          )}
          
          {showRetry && (
            <Button
              onClick={handleReload}
              variant="default"
              className="flex-1 min-w-[140px]"
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Recargar página
            </Button>
          )}
          
          {showHome && (
            <Button
              onClick={handleGoHome}
              variant="secondary"
              className="flex-1 min-w-[140px]"
            >
              <Home className="h-4 w-4 mr-2" />
              Ir al inicio
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}

// Componente para errores de carga de chunks
export function ChunkLoadError({ reset }: { reset?: () => void }) {
  return (
    <ErrorDisplay
      title="Error de carga"
      description="No se pudo cargar un recurso necesario para la aplicación. Esto puede deberse a problemas de conexión o a una versión desactualizada de la aplicación."
      reset={reset}
      showRetry={true}
      showHome={true}
    />
  );
}

// Componente para errores de red
export function NetworkError({ reset }: { reset?: () => void }) {
  return (
    <ErrorDisplay
      title="Error de conexión"
      description="No se pudo conectar con el servidor. Por favor, verifica tu conexión a internet e intenta de nuevo."
      reset={reset}
      showRetry={true}
      showHome={false}
    />
  );
}

// Componente para errores de autenticación
export function AuthError({ reset }: { reset?: () => void }) {
  return (
    <ErrorDisplay
      title="Error de autenticación"
      description="Tu sesión ha expirado o no tienes permisos para acceder a esta página. Por favor, inicia sesión de nuevo."
      reset={reset}
      showRetry={false}
      showHome={false}
    />
  );
}
