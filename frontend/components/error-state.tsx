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

export type ErrorType = 'network' | 'notfound' | 'forbidden' | 'server' | 'validation' | 'unknown';

export interface ErrorStateProps {
  /**
   * Type of error to display
   */
  type?: ErrorType;

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
   * Custom className
   */
  className?: string;

  /**
   * Full height container
   */
  fullHeight?: boolean;
}

const errorConfig = {
  network: {
    icon: WifiOff,
    defaultTitle: 'Connection Error',
    defaultMessage: 'Unable to connect to the server. Please check your internet connection and try again.',
    iconColor: 'text-orange-500',
    bgColor: 'bg-orange-50 dark:bg-orange-950/20',
  },
  notfound: {
    icon: FileQuestion,
    defaultTitle: 'Not Found',
    defaultMessage: 'The requested resource could not be found. It may have been moved or deleted.',
    iconColor: 'text-blue-500',
    bgColor: 'bg-blue-50 dark:bg-blue-950/20',
  },
  forbidden: {
    icon: ShieldAlert,
    defaultTitle: 'Access Denied',
    defaultMessage: 'You do not have permission to access this resource. Please contact your administrator.',
    iconColor: 'text-red-500',
    bgColor: 'bg-red-50 dark:bg-red-950/20',
  },
  server: {
    icon: ServerCrash,
    defaultTitle: 'Server Error',
    defaultMessage: 'An unexpected error occurred on the server. Our team has been notified.',
    iconColor: 'text-purple-500',
    bgColor: 'bg-purple-50 dark:bg-purple-950/20',
  },
  validation: {
    icon: AlertCircle,
    defaultTitle: 'Validation Error',
    defaultMessage: 'The provided data is invalid. Please check your input and try again.',
    iconColor: 'text-yellow-500',
    bgColor: 'bg-yellow-50 dark:bg-yellow-950/20',
  },
  unknown: {
    icon: AlertCircle,
    defaultTitle: 'Error',
    defaultMessage: 'An unexpected error occurred. Please try again.',
    iconColor: 'text-gray-500',
    bgColor: 'bg-gray-50 dark:bg-gray-950/20',
  },
};

export function ErrorState({
  type = 'unknown',
  title,
  message,
  details,
  onRetry,
  onGoBack,
  onReportIssue,
  showRetry = true,
  showGoBack = true,
  showReportIssue = false,
  className,
  fullHeight = false,
}: ErrorStateProps) {
  const router = useRouter();
  const [showDetails, setShowDetails] = useState(false);

  const config = errorConfig[type];
  const Icon = config.icon;

  const errorTitle = title || config.defaultTitle;
  const errorMessage = message || config.defaultMessage;

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
                    Hide Details
                  </>
                ) : (
                  <>
                    <ChevronDown className="w-4 h-4" />
                    Show Details
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
            className="flex flex-col sm:flex-row items-center justify-center gap-3 mt-6"
          >
            {showRetry && onRetry && (
              <Button
                onClick={onRetry}
                variant="default"
                size="lg"
                className="w-full sm:w-auto"
              >
                <RefreshCw className="w-4 h-4 mr-2" />
                Retry
              </Button>
            )}

            {showGoBack && (
              <Button
                onClick={handleGoBack}
                variant="outline"
                size="lg"
                className="w-full sm:w-auto"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Go Back
              </Button>
            )}

            {showReportIssue && onReportIssue && (
              <Button
                onClick={onReportIssue}
                variant="ghost"
                size="lg"
                className="w-full sm:w-auto"
              >
                <Bug className="w-4 h-4 mr-2" />
                Report Issue
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
