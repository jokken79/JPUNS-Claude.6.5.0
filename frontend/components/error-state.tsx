'use client';

/**
 * ErrorState Component
 *
 * Displays error states with different variants for different error types.
 * Includes retry, go back, and optional report issue actions.
 */

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
  WifiOff,
  FileQuestion,
  ShieldAlert,
  ServerCrash,
  AlertCircle,
  RefreshCw,
  ArrowLeft,
  Bug,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';

export type ErrorType = 'network' | 'notfound' | 'forbidden' | 'server' | 'validation' | 'unknown' | 'chunk-load' | 'auth';
export type ErrorLocale = 'en' | 'es';

export interface ErrorStateProps {
  /**
   * Type of error to display
   */
  type?: ErrorType;

  /**
   * Error object (for Error Boundary integration)
   */
  error?: Error;

  /**
   * Reset callback (for Error Boundary integration)
   */
  reset?: () => void;

  /**
   * Error title
   */
  title?: string;

  /**
   * Error message
   */
  message?: string;

  /**
   * Detailed error information (collapsible)
   */
  details?: string | Error;

  /**
   * Retry callback
   */
  onRetry?: () => void;

  /**
   * Go back callback (defaults to router.back())
   */
  onGoBack?: () => void;

  /**
   * Report issue callback
   */
  onReportIssue?: () => void;

  /**
   * Show retry button
   */
  showRetry?: boolean;

  /**
   * Show go back button
   */
  showGoBack?: boolean;

  /**
   * Show report issue button
   */
  showReportIssue?: boolean;

  /**
   * Show reload page button (for error-display compatibility)
   */
  showReload?: boolean;

  /**
   * Show home button (for error-display compatibility)
   */
  showHome?: boolean;

  /**
   * Custom className
   */
  className?: string;

  /**
   * Full height container
   */
  fullHeight?: boolean;

  /**
   * Locale for translations
   */
  locale?: ErrorLocale;

  /**
   * Show action suggestions list
   */
  showSuggestions?: boolean;

  /**
   * Custom suggestions to display
   */
  suggestions?: string[];
}

const errorConfig = {
  network: {
    icon: WifiOff,
    defaultTitle: { en: 'Connection Error', es: 'Error de Conexión' },
    defaultMessage: {
      en: 'Unable to connect to the server. Please check your internet connection and try again.',
      es: 'No se pudo conectar con el servidor. Por favor, verifica tu conexión a internet e intenta de nuevo.'
    },
    iconColor: 'text-orange-500',
    bgColor: 'bg-orange-50 dark:bg-orange-950/20',
  },
  notfound: {
    icon: FileQuestion,
    defaultTitle: { en: 'Not Found', es: 'No Encontrado' },
    defaultMessage: {
      en: 'The requested resource could not be found. It may have been moved or deleted.',
      es: 'El recurso solicitado no pudo ser encontrado. Puede haber sido movido o eliminado.'
    },
    iconColor: 'text-blue-500',
    bgColor: 'bg-blue-50 dark:bg-blue-950/20',
  },
  forbidden: {
    icon: ShieldAlert,
    defaultTitle: { en: 'Access Denied', es: 'Acceso Denegado' },
    defaultMessage: {
      en: 'You do not have permission to access this resource. Please contact your administrator.',
      es: 'No tienes permiso para acceder a este recurso. Por favor, contacta a tu administrador.'
    },
    iconColor: 'text-red-500',
    bgColor: 'bg-red-50 dark:bg-red-950/20',
  },
  server: {
    icon: ServerCrash,
    defaultTitle: { en: 'Server Error', es: 'Error del Servidor' },
    defaultMessage: {
      en: 'An unexpected error occurred on the server. Our team has been notified.',
      es: 'Se produjo un error inesperado en el servidor. Nuestro equipo ha sido notificado.'
    },
    iconColor: 'text-purple-500',
    bgColor: 'bg-purple-50 dark:bg-purple-950/20',
  },
  validation: {
    icon: AlertCircle,
    defaultTitle: { en: 'Validation Error', es: 'Error de Validación' },
    defaultMessage: {
      en: 'The provided data is invalid. Please check your input and try again.',
      es: 'Los datos proporcionados son inválidos. Por favor, verifica tu entrada e intenta de nuevo.'
    },
    iconColor: 'text-yellow-500',
    bgColor: 'bg-yellow-50 dark:bg-yellow-950/20',
  },
  unknown: {
    icon: AlertCircle,
    defaultTitle: { en: 'Error', es: 'Error' },
    defaultMessage: {
      en: 'An unexpected error occurred. Please try again.',
      es: 'Se produjo un error inesperado. Por favor, intenta de nuevo.'
    },
    iconColor: 'text-gray-500',
    bgColor: 'bg-gray-50 dark:bg-gray-950/20',
  },
  'chunk-load': {
    icon: ServerCrash,
    defaultTitle: { en: 'Loading Error', es: 'Error de Carga' },
    defaultMessage: {
      en: 'Could not load a required resource. This may be due to connection issues or an outdated application version.',
      es: 'No se pudo cargar un recurso necesario. Esto puede deberse a problemas de conexión o a una versión desactualizada de la aplicación.'
    },
    iconColor: 'text-purple-500',
    bgColor: 'bg-purple-50 dark:bg-purple-950/20',
  },
  auth: {
    icon: ShieldAlert,
    defaultTitle: { en: 'Authentication Error', es: 'Error de Autenticación' },
    defaultMessage: {
      en: 'Your session has expired or you do not have permission to access this page. Please sign in again.',
      es: 'Tu sesión ha expirado o no tienes permisos para acceder a esta página. Por favor, inicia sesión de nuevo.'
    },
    iconColor: 'text-red-500',
    bgColor: 'bg-red-50 dark:bg-red-950/20',
  },
};

// Localization strings
const localeStrings = {
  en: {
    retry: 'Retry',
    goBack: 'Go Back',
    reportIssue: 'Report Issue',
    reload: 'Reload Page',
    home: 'Go Home',
    showDetails: 'Show Details',
    hideDetails: 'Hide Details',
    stackTrace: 'Stack Trace',
    error: 'Error:',
    whatYouCanDo: 'What you can do:',
    suggestions: [
      'Try reloading the page',
      'Check your internet connection',
      'Clear your browser cache',
      'Try again in a few moments',
      'Contact technical support if the issue persists',
    ],
  },
  es: {
    retry: 'Intentar de nuevo',
    goBack: 'Volver',
    reportIssue: 'Reportar Problema',
    reload: 'Recargar Página',
    home: 'Ir al inicio',
    showDetails: 'Mostrar Detalles',
    hideDetails: 'Ocultar Detalles',
    stackTrace: 'Rastreo de Pila',
    error: 'Error:',
    whatYouCanDo: 'Qué puedes hacer:',
    suggestions: [
      'Intenta recargar la página',
      'Verifica tu conexión a internet',
      'Borra la caché de tu navegador',
      'Intenta de nuevo en unos momentos',
      'Contacta al soporte técnico si el problema persiste',
    ],
  },
};

export function ErrorState({
  type = 'unknown',
  error,
  reset,
  title,
  message,
  details: detailsProp,
  onRetry,
  onGoBack,
  onReportIssue,
  showRetry = true,
  showGoBack = true,
  showReportIssue = false,
  showReload = false,
  showHome = false,
  className,
  fullHeight = false,
  locale = 'en',
  showSuggestions = false,
  suggestions,
}: ErrorStateProps) {
  const router = useRouter();
  const [showDetails, setShowDetails] = useState(false);

  const config = errorConfig[type] || errorConfig.unknown;
  const Icon = config.icon;
  const strings = localeStrings[locale];

  const errorTitle = title || (typeof config.defaultTitle === 'string' ? config.defaultTitle : config.defaultTitle[locale]);
  const errorMessage = message || (typeof config.defaultMessage === 'string' ? config.defaultMessage : config.defaultMessage[locale]);

  // Use provided details or extract from error object
  const details = detailsProp || error;

  // Handle reload page (for error-display compatibility)
  const handleReload = () => {
    if (showReload) {
      window.location.reload();
    }
  };

  // Handle go home (for error-display compatibility)
  const handleGoHome = () => {
    if (showHome) {
      window.location.href = '/';
    }
  };

  const handleGoBack = () => {
    if (onGoBack) {
      onGoBack();
    } else {
      router.back();
    }
  };

  const detailsText = details
    ? typeof details === 'string'
      ? details
      : `${details.name}: ${details.message}\n${details.stack || ''}`
    : null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className={cn(
        'flex items-center justify-center p-8',
        fullHeight && 'min-h-[400px]',
        className
      )}
    >
      <div className="w-full max-w-md">
        {/* Error Icon */}
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.1, type: 'spring', stiffness: 200 }}
          className={cn(
            'mx-auto mb-6 w-20 h-20 rounded-full flex items-center justify-center',
            config.bgColor
          )}
        >
          <Icon className={cn('w-10 h-10', config.iconColor)} strokeWidth={1.5} />
        </motion.div>

        {/* Error Content */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="text-center space-y-4"
        >
          {/* Title */}
          <h3 className="text-2xl font-bold text-foreground">
            {errorTitle}
          </h3>

          {/* Message */}
          <p className="text-muted-foreground leading-relaxed">
            {errorMessage}
          </p>

          {/* Suggestions (if available) */}
          {(showSuggestions || suggestions?.length) && (
            <div className="mt-4 p-4 bg-muted/30 rounded-lg text-left">
              <h4 className="font-semibold text-sm mb-2">
                {strings.whatYouCanDo}
              </h4>
              <ul className="text-sm space-y-1 text-muted-foreground list-disc list-inside">
                {(suggestions || strings.suggestions).map((suggestion, index) => (
                  <li key={index}>{suggestion}</li>
                ))}
              </ul>
            </div>
          )}

          {/* Details (Collapsible) */}
          {detailsText && (
            <div className="mt-4">
              <button
                onClick={() => setShowDetails(!showDetails)}
                className="flex items-center gap-2 mx-auto text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                {showDetails ? (
                  <>
                    <ChevronUp className="w-4 h-4" />
                    {strings.hideDetails}
                  </>
                ) : (
                  <>
                    <ChevronDown className="w-4 h-4" />
                    {strings.showDetails}
                  </>
                )}
              </button>

              <AnimatePresence>
                {showDetails && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.2 }}
                    className="overflow-hidden"
                  >
                    <div className="mt-3 p-4 bg-muted rounded-lg text-left">
                      <pre className="text-xs text-muted-foreground whitespace-pre-wrap break-words font-mono">
                        {detailsText}
                      </pre>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          )}

          {/* Action Buttons */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="flex flex-col sm:flex-row items-center justify-center gap-3 mt-6 flex-wrap"
          >
            {/* Retry (from onRetry or reset) */}
            {showRetry && (onRetry || reset) && (
              <Button
                onClick={onRetry || reset}
                variant="default"
                size="lg"
                className="w-full sm:w-auto"
              >
                <RefreshCw className="w-4 h-4 mr-2" />
                {strings.retry}
              </Button>
            )}

            {/* Go Back */}
            {showGoBack && (
              <Button
                onClick={handleGoBack}
                variant="outline"
                size="lg"
                className="w-full sm:w-auto"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                {strings.goBack}
              </Button>
            )}

            {/* Reload Page */}
            {showReload && (
              <Button
                onClick={handleReload}
                variant="outline"
                size="lg"
                className="w-full sm:w-auto"
              >
                <RefreshCw className="w-4 h-4 mr-2" />
                {strings.reload}
              </Button>
            )}

            {/* Go Home */}
            {showHome && (
              <Button
                onClick={handleGoHome}
                variant="secondary"
                size="lg"
                className="w-full sm:w-auto"
              >
                <Bug className="w-4 h-4 mr-2" />
                {strings.home}
              </Button>
            )}

            {/* Report Issue */}
            {showReportIssue && onReportIssue && (
              <Button
                onClick={onReportIssue}
                variant="ghost"
                size="lg"
                className="w-full sm:w-auto"
              >
                <Bug className="w-4 h-4 mr-2" />
                {strings.reportIssue}
              </Button>
            )}
          </motion.div>
        </motion.div>
      </div>
    </motion.div>
  );
}

/**
 * Specialized error state components for common scenarios
 */

export function NetworkError(props: Omit<ErrorStateProps, 'type'>) {
  return <ErrorState type="network" {...props} />;
}

export function NotFoundError(props: Omit<ErrorStateProps, 'type'>) {
  return <ErrorState type="notfound" {...props} />;
}

export function ForbiddenError(props: Omit<ErrorStateProps, 'type'>) {
  return <ErrorState type="forbidden" {...props} />;
}

export function ServerError(props: Omit<ErrorStateProps, 'type'>) {
  return <ErrorState type="server" {...props} />;
}

export function ValidationError(props: Omit<ErrorStateProps, 'type'>) {
  return <ErrorState type="validation" {...props} />;
}

export function ChunkLoadError(props: Omit<ErrorStateProps, 'type'>) {
  return <ErrorState type="chunk-load" {...props} />;
}

export function AuthError(props: Omit<ErrorStateProps, 'type'>) {
  return <ErrorState type="auth" {...props} />;
}

/**
 * Spanish variants of error components
 */

export function ErrorStateES(props: Omit<ErrorStateProps, 'locale'>) {
  return <ErrorState {...props} locale="es" />;
}

export function NetworkErrorES(props: Omit<ErrorStateProps, 'type' | 'locale'>) {
  return <ErrorState type="network" {...props} locale="es" />;
}

export function AuthErrorES(props: Omit<ErrorStateProps, 'type' | 'locale'>) {
  return <ErrorState type="auth" {...props} locale="es" />;
}

export function ChunkLoadErrorES(props: Omit<ErrorStateProps, 'type' | 'locale'>) {
  return <ErrorState type="chunk-load" {...props} locale="es" />;
}

/**
 * Backward compatibility alias for error-display.tsx users
 */
export const ErrorDisplay = ErrorState;
