'use client';

import * as React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import { formAnimations, statusColors } from '@/lib/form-animations';
import {
  CheckCircleIcon,
  XCircleIcon,
  ExclamationTriangleIcon,
  InformationCircleIcon,
} from '@heroicons/react/24/outline';

export type TextareaStatus = 'success' | 'error' | 'warning' | 'info' | 'default';

export interface AnimatedTextareaProps
  extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  status?: TextareaStatus;
  message?: string;
  showIcon?: boolean;
  showCounter?: boolean;
  autoResize?: boolean;
  hint?: string;
}

const statusIcons = {
  success: CheckCircleIcon,
  error: XCircleIcon,
  warning: ExclamationTriangleIcon,
  info: InformationCircleIcon,
};

const AnimatedTextarea = React.forwardRef<
  HTMLTextAreaElement,
  AnimatedTextareaProps
>(
  (
    {
      className,
      label,
      status = 'default',
      message,
      showIcon = true,
      showCounter = false,
      autoResize = false,
      hint,
      value,
      maxLength,
      disabled,
      required,
      rows = 3,
      onChange,
      ...props
    },
    ref
  ) => {
    const textareaRef = React.useRef<HTMLTextAreaElement | null>(null);
    const [charCount, setCharCount] = React.useState(0);

    const StatusIcon = status !== 'default' ? statusIcons[status] : null;
    const colors = status !== 'default' ? statusColors[status] : null;

    // Auto-resize functionality
    React.useEffect(() => {
      if (autoResize && textareaRef.current) {
        textareaRef.current.style.height = 'auto';
        textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
      }
    }, [value, autoResize]);

    // Update character count
    React.useEffect(() => {
      if (showCounter) {
        setCharCount((value as string)?.length || 0);
      }
    }, [value, showCounter]);

    const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      if (showCounter) {
        setCharCount(e.target.value.length);
      }
      onChange?.(e);
    };

    // Calculate counter color based on usage
    const getCounterColor = () => {
      if (!maxLength) return 'text-muted-foreground';
      const percentage = (charCount / maxLength) * 100;
      if (percentage >= 100) return 'text-red-600';
      if (percentage >= 90) return 'text-amber-600';
      if (percentage >= 75) return 'text-yellow-600';
      return 'text-muted-foreground';
    };

    return (
      <div className="w-full space-y-1.5">
        {/* Label */}
        {label && (
          <div className="flex items-center justify-between">
            <label
              className={cn(
                'block text-sm font-medium',
                status !== 'default' ? colors?.text : 'text-foreground',
                disabled && 'opacity-50'
              )}
            >
              {label}
              {required && (
                <span className="text-red-500 ml-1" aria-label="required">
                  *
                </span>
              )}
            </label>

            {/* Character Counter */}
            {showCounter && (
              <motion.span
                className={cn('text-xs', getCounterColor())}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.1 }}
              >
                {charCount}
                {maxLength && ` / ${maxLength}`}
              </motion.span>
            )}
          </div>
        )}

        {/* Textarea Container */}
        <motion.div
          className="relative"
          animate={status === 'error' ? 'animate' : 'initial'}
          variants={status === 'error' ? formAnimations.shake : undefined}
        >
          <div className="relative">
            {/* Textarea */}
            <textarea
              className={cn(
                'flex min-h-[80px] w-full rounded-md border bg-transparent px-3 py-2 text-base shadow-sm transition-all duration-200 resize-none',
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
                // Auto-resize
                autoResize && 'overflow-hidden',
                className
              )}
              ref={(node) => {
                textareaRef.current = node;
                if (typeof ref === 'function') {
                  ref(node);
                } else if (ref) {
                  ref.current = node;
                }
              }}
              value={value}
              disabled={disabled}
              maxLength={maxLength}
              rows={rows}
              onChange={handleChange}
              {...props}
            />

            {/* Status Icon */}
            {showIcon && StatusIcon && status !== 'default' && (
              <motion.div
                className="absolute top-3 right-3"
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ type: 'spring', stiffness: 500, damping: 30 }}
              >
                <StatusIcon className={cn('w-5 h-5', colors?.text)} />
              </motion.div>
            )}

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
        </motion.div>

        {/* Hint Text */}
        {hint && !message && (
          <p className="text-xs text-muted-foreground">{hint}</p>
        )}

        {/* Message (Error/Success/Warning/Info) */}
        <AnimatePresence>
          {message && (
            <motion.div
              className={cn('text-xs flex items-center gap-1', colors?.text)}
              variants={formAnimations.slideDown}
              initial="initial"
              animate="animate"
              exit="exit"
            >
              {showIcon && StatusIcon && (
                <StatusIcon className="w-3.5 h-3.5 flex-shrink-0" />
              )}
              <span>{message}</span>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    );
  }
);

AnimatedTextarea.displayName = 'AnimatedTextarea';

export { AnimatedTextarea };
