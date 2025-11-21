'use client';

/**
 * LoadingOverlay Component
 *
 * Full-screen or contained loading overlay for blocking async operations.
 * Prevents user interaction while operations are in progress.
 */

import { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

export type SpinnerVariant = 'spinner' | 'dots' | 'bars';

export interface LoadingOverlayProps {
  /**
   * Whether the overlay is visible
   */
  visible: boolean;

  /**
   * Loading message to display
   */
  message?: string;

  /**
   * Spinner variant
   */
  spinner?: SpinnerVariant;

  /**
   * Apply backdrop blur
   */
  blur?: boolean;

  /**
   * Full screen overlay (vs contained)
   */
  fullScreen?: boolean;

  /**
   * z-index value
   */
  zIndex?: number;

  /**
   * Custom className
   */
  className?: string;

  /**
   * Prevent ESC key from closing
   */
  preventEscape?: boolean;
}

/**
 * Spinner component
 */
function Spinner({ variant = 'spinner' }: { variant: SpinnerVariant }) {
  if (variant === 'spinner') {
    return <Loader2 className="w-8 h-8 text-primary animate-spin" />;
  }

  if (variant === 'dots') {
    return (
      <div className="flex items-center gap-2">
        {[0, 1, 2].map((i) => (
          <motion.div
            key={i}
            className="w-3 h-3 bg-primary rounded-full"
            animate={{
              scale: [1, 1.5, 1],
              opacity: [1, 0.5, 1],
            }}
            transition={{
              duration: 1,
              repeat: Infinity,
              delay: i * 0.2,
            }}
          />
        ))}
      </div>
    );
  }

  if (variant === 'bars') {
    return (
      <div className="flex items-center gap-1.5">
        {[0, 1, 2, 3].map((i) => (
          <motion.div
            key={i}
            className="w-1.5 bg-primary rounded-full"
            animate={{
              height: ['16px', '32px', '16px'],
            }}
            transition={{
              duration: 0.8,
              repeat: Infinity,
              delay: i * 0.1,
            }}
          />
        ))}
      </div>
    );
  }

  return null;
}

export function LoadingOverlay({
  visible,
  message = 'Loading...',
  spinner = 'spinner',
  blur = true,
  fullScreen = true,
  zIndex = 50,
  className,
  preventEscape = true,
}: LoadingOverlayProps) {
  // Prevent scrolling when overlay is visible
  useEffect(() => {
    if (visible && fullScreen) {
      document.body.style.overflow = 'hidden';
      return () => {
        document.body.style.overflow = 'unset';
      };
    }
  }, [visible, fullScreen]);

  // Handle ESC key
  useEffect(() => {
    if (!visible || !preventEscape) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        e.stopPropagation();
      }
    };

    document.addEventListener('keydown', handleKeyDown, true);
    return () => {
      document.removeEventListener('keydown', handleKeyDown, true);
    };
  }, [visible, preventEscape]);

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          className={cn(
            'flex items-center justify-center',
            fullScreen ? 'fixed inset-0' : 'absolute inset-0',
            'bg-background/80',
            blur && 'backdrop-blur-sm',
            className
          )}
          style={{ zIndex }}
          onClick={(e) => e.stopPropagation()}
          onKeyDown={(e) => preventEscape && e.key === 'Escape' && e.preventDefault()}
          role="dialog"
          aria-modal="true"
          aria-label="Loading"
        >
          <motion.div
            initial={{ scale: 0.9, y: 20 }}
            animate={{ scale: 1, y: 0 }}
            exit={{ scale: 0.9, y: 20 }}
            transition={{ duration: 0.2 }}
            className="flex flex-col items-center gap-4 p-8 rounded-lg bg-card shadow-lg border"
          >
            {/* Spinner */}
            <Spinner variant={spinner} />

            {/* Message */}
            {message && (
              <p className="text-sm font-medium text-muted-foreground">
                {message}
              </p>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

/**
 * Compact loading overlay for buttons or small containers
 */
export function CompactLoadingOverlay({
  visible,
  spinner = 'spinner',
  blur = true,
  className,
}: Pick<LoadingOverlayProps, 'visible' | 'spinner' | 'blur' | 'className'>) {
  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.15 }}
          className={cn(
            'absolute inset-0 flex items-center justify-center',
            'bg-background/60',
            blur && 'backdrop-blur-[2px]',
            'rounded-md',
            className
          )}
          style={{ zIndex: 10 }}
        >
          <Spinner variant={spinner} />
        </motion.div>
      )}
    </AnimatePresence>
  );
}
