'use client';

import * as React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import { formAnimations, statusColors } from '@/lib/animations';
import {
  CheckCircleIcon,
  XCircleIcon,
  ExclamationTriangleIcon,
  InformationCircleIcon,
  XMarkIcon,
} from '@heroicons/react/24/outline';
import { InputLabel, ErrorShakeContainer, ErrorMessage, HintText, StatusIcon, ClearButton, getStatusColors } from './input-parts';

export type InputStatus = 'success' | 'error' | 'warning' | 'info' | 'default';

export interface EnhancedInputProps
  extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  status?: InputStatus;
  message?: string;
  showIcon?: boolean;
  clearable?: boolean;
  onClear?: () => void;
  isLoading?: boolean;
  hint?: string;
}

const statusIcons = {
  success: CheckCircleIcon,
  error: XCircleIcon,
  warning: ExclamationTriangleIcon,
  info: InformationCircleIcon,
};

const EnhancedInput = React.forwardRef<HTMLInputElement, EnhancedInputProps>(
  (
    {
      className,
      type,
      label,
      status = 'default',
      message,
      showIcon = true,
      clearable = false,
      onClear,
      isLoading = false,
      hint,
      value,
      disabled,
      required,
      ...props
    },
    ref
  ) => {
    const hasValue = !!value;
    const StatusIconComponent = status !== 'default' ? statusIcons[status] : null;
    const colors = getStatusColors(status) || null;

    const handleClear = () => {
      onClear?.();
    };

    return (
      <div className="w-full space-y-1.5">
        {/* Label */}
        <InputLabel
          label={label}
          error={status === 'error' ? 'error' : undefined}
          disabled={disabled}
          required={required}
          className={status !== 'default' && status !== 'error' ? colors?.text : undefined}
        />

        {/* Input Container */}
        <ErrorShakeContainer error={status === 'error' ? 'error' : undefined}>
          <div className="relative flex items-center">
            {/* Input */}
            <input
              type={type}
              className={cn(
                'flex h-10 w-full rounded-md border bg-transparent px-3 py-2 text-base shadow-sm transition-all duration-200',
                'placeholder:text-muted-foreground',
                'focus-visible:outline-none focus-visible:ring-2',
                'disabled:cursor-not-allowed disabled:opacity-50',
                // Default styles
                status === 'default' &&
                  'border-input focus-visible:ring-ring',
                // Status-specific styles
                status !== 'default' && [
                  colors?.border,
                  colors?.bg,
                  'focus-visible:ring-2',
                  `focus-visible:${colors?.ring}`,
                ],
                // Add padding for icons
                (showIcon && status !== 'default') || isLoading
                  ? 'pr-10'
                  : clearable && hasValue
                  ? 'pr-10'
                  : '',
                className
              )}
              ref={ref}
              value={value}
              disabled={disabled || isLoading}
              {...props}
            />

            {/* Status Icon / Loading Spinner / Clear Button */}
            <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1">
              {isLoading ? (
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{
                    duration: 1,
                    repeat: Infinity,
                    ease: 'linear',
                  }}
                  className="w-4 h-4"
                >
                  <svg
                    className="w-4 h-4 text-muted-foreground"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    />
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    />
                  </svg>
                </motion.div>
              ) : (
                <>
                  {/* Clear Button */}
                  <AnimatePresence>
                    {clearable && hasValue && !disabled && (
                      <ClearButton onClick={handleClear} disabled={disabled} ariaLabel="Clear input" />
                    )}
                  </AnimatePresence>

                  {/* Status Icon */}
                  {showIcon && StatusIconComponent && (
                    <StatusIcon
                      icon={StatusIconComponent}
                      status={status}
                      colors={colors}
                    />
                  )}
                </>
              )}
            </div>

            {/* Success Pulse Effect */}
            {status === 'success' && (
              <motion.div
                className="absolute inset-0 rounded-md pointer-events-none"
                initial={{ scale: 1, opacity: 0 }}
                animate={{ scale: 1.05, opacity: [0, 0.2, 0] }}
                transition={{ duration: 0.5 }}
              >
                <div className={cn('w-full h-full rounded-md', colors?.bg)} />
              </motion.div>
            )}
          </div>
        </ErrorShakeContainer>

        {/* Hint Text and Message */}
        <HintText hint={hint} error={message} className={colors?.text} />

        {/* Message (Error/Success/Warning/Info) - with status icon */}
        <AnimatePresence>
          {message && (
            <motion.div
              className={cn('text-xs flex items-center gap-1', colors?.text)}
              variants={formAnimations.slideDown}
              initial="initial"
              animate="animate"
              exit="exit"
            >
              {showIcon && StatusIconComponent && (
                <StatusIconComponent className="w-3.5 h-3.5 flex-shrink-0" />
              )}
              <span>{message}</span>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    );
  }
);

EnhancedInput.displayName = 'EnhancedInput';

export { EnhancedInput };
