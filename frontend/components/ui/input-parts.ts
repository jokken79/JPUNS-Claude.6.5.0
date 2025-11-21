'use client';

import * as React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import { formAnimations, statusColors } from '@/lib/animations';

/**
 * Shared input label component
 * Used across all input variants for consistent label rendering
 */
export function InputLabel({
  label,
  error,
  disabled,
  required,
  className,
}: {
  label?: string;
  error?: string;
  disabled?: boolean;
  required?: boolean;
  className?: string;
}) {
  if (!label) return null;

  return (
    <label
      className={cn(
        'block text-sm font-medium',
        error ? 'text-red-600' : 'text-foreground',
        disabled && 'opacity-50',
        className
      )}
    >
      {label}
      {required && (
        <span className="text-red-500 ml-1" aria-label="required">
          *
        </span>
      )}
    </label>
  );
}

/**
 * Shared error shake container
 * Wraps input to apply shake animation on error
 */
export function ErrorShakeContainer({
  error,
  children,
  className,
}: {
  error?: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <motion.div
      className={cn('relative', className)}
      animate={error ? 'animate' : 'initial'}
      variants={error ? formAnimations.shake : undefined}
    >
      {children}
    </motion.div>
  );
}

/**
 * Shared error message display
 * Animated error message with optional icon
 */
export function ErrorMessage({
  error,
  showIcon = true,
  icon = null,
  className,
}: {
  error?: string;
  showIcon?: boolean;
  icon?: React.ReactNode | null;
  className?: string;
}) {
  return (
    <AnimatePresence>
      {error && (
        <motion.div
          className={cn('text-xs text-red-600 flex items-center gap-1', className)}
          variants={formAnimations.slideDown}
          initial="initial"
          animate="animate"
          exit="exit"
        >
          {showIcon && icon === null && (
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <circle cx="12" cy="12" r="10" />
              <line x1="12" y1="8" x2="12" y2="12" />
              <line x1="12" y1="16" x2="12.01" y2="16" />
            </svg>
          )}
          {icon}
          {error}
        </motion.div>
      )}
    </AnimatePresence>
  );
}

/**
 * Shared status icon component
 * Renders status-specific icon with animations
 */
export function StatusIcon({
  icon: Icon,
  status,
  colors,
  className,
}: {
  icon?: React.ComponentType<{ className?: string }> | null;
  status?: string;
  colors?: { text: string };
  className?: string;
}) {
  if (!Icon) return null;

  return (
    <motion.div
      initial={{ scale: 0, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ type: 'spring', stiffness: 500, damping: 30 }}
      className={className}
    >
      <Icon className={cn('w-5 h-5', colors?.text)} />
    </motion.div>
  );
}

/**
 * Shared clear button component
 * Used in inputs that support clearing
 */
export function ClearButton({
  onClick,
  disabled,
  ariaLabel = 'Clear',
}: {
  onClick?: () => void;
  disabled?: boolean;
  ariaLabel?: string;
}) {
  return (
    <motion.button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={cn(
        'text-muted-foreground hover:text-foreground transition-colors',
        disabled && 'opacity-50 cursor-not-allowed'
      )}
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.8 }}
      whileHover={{ scale: 1.1 }}
      whileTap={{ scale: 0.9 }}
      aria-label={ariaLabel}
    >
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width="16"
        height="16"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <circle cx="12" cy="12" r="10" />
        <path d="m15 9-6 6" />
        <path d="m9 9 6 6" />
      </svg>
    </motion.button>
  );
}

/**
 * Shared hint text component
 */
export function HintText({
  hint,
  error,
  className,
}: {
  hint?: string;
  error?: string;
  className?: string;
}) {
  if (hint && !error) {
    return (
      <p className={cn('text-xs text-muted-foreground', className)}>{hint}</p>
    );
  }
  return null;
}

/**
 * Get status colors from the statusColors constant
 */
export function getStatusColors(status: string) {
  const colors: Record<string, any> = statusColors || {};
  return colors[status] || null;
}
