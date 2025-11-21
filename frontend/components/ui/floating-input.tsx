'use client';

import * as React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import { formAnimations } from '@/lib/form-animations';

export interface FloatingInputProps
  extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  leadingIcon?: React.ReactNode;
  trailingIcon?: React.ReactNode;
  onClear?: () => void;
}

const FloatingInput = React.forwardRef<HTMLInputElement, FloatingInputProps>(
  (
    {
      className,
      type,
      label,
      error,
      leadingIcon,
      trailingIcon,
      required,
      value,
      defaultValue,
      disabled,
      onClear,
      onFocus,
      onBlur,
      ...props
    },
    ref
  ) => {
    const [isFocused, setIsFocused] = React.useState(false);
    const [hasValue, setHasValue] = React.useState(
      !!(value || defaultValue)
    );

    const isFloating = isFocused || hasValue;

    React.useEffect(() => {
      setHasValue(!!value);
    }, [value]);

    const handleFocus = (e: React.FocusEvent<HTMLInputElement>) => {
      setIsFocused(true);
      onFocus?.(e);
    };

    const handleBlur = (e: React.FocusEvent<HTMLInputElement>) => {
      setIsFocused(false);
      onBlur?.(e);
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      setHasValue(!!e.target.value);
      props.onChange?.(e);
    };

    return (
      <div className="relative w-full">
        {/* Input Container */}
        <motion.div
          className={cn(
            'relative flex items-center',
            error && 'animate-shake'
          )}
          animate={error ? 'animate' : 'initial'}
          variants={error ? formAnimations.shake : undefined}
        >
          {/* Leading Icon */}
          {leadingIcon && (
            <div className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none z-10">
              {leadingIcon}
            </div>
          )}

          {/* Input */}
          <input
            type={type}
            className={cn(
              'flex h-11 w-full rounded-md border border-input bg-transparent px-3 py-2 text-base shadow-sm transition-all duration-200',
              'placeholder:text-transparent',
              'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
              'disabled:cursor-not-allowed disabled:opacity-50',
              leadingIcon && 'pl-10',
              (trailingIcon || (onClear && hasValue)) && 'pr-10',
              error &&
                'border-red-500 focus-visible:ring-red-500 bg-red-50/50',
              !error &&
                hasValue &&
                !isFocused &&
                'border-green-500 bg-green-50/30',
              className
            )}
            ref={ref}
            value={value}
            defaultValue={defaultValue}
            disabled={disabled}
            onFocus={handleFocus}
            onBlur={handleBlur}
            onChange={handleChange}
            {...props}
          />

          {/* Floating Label */}
          {label && (
            <motion.label
              className={cn(
                'absolute left-3 pointer-events-none transition-all duration-150 ease-out',
                'text-muted-foreground origin-left',
                leadingIcon && 'left-10',
                disabled && 'opacity-50'
              )}
              animate={isFloating ? 'float' : 'rest'}
              variants={{
                float: {
                  y: -32,
                  scale: 0.85,
                  color: error
                    ? '#EF4444'
                    : isFocused
                    ? '#6366F1'
                    : '#71717A',
                },
                rest: {
                  y: 0,
                  scale: 1,
                  color: '#71717A',
                },
              }}
              transition={{ duration: 0.15, ease: 'easeOut' }}
            >
              {label}
              {required && (
                <span className="text-red-500 ml-1" aria-label="required">
                  *
                </span>
              )}
            </motion.label>
          )}

          {/* Trailing Icon / Clear Button */}
          <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1">
            {onClear && hasValue && !disabled && (
              <motion.button
                type="button"
                onClick={onClear}
                className="text-muted-foreground hover:text-foreground transition-colors"
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
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
            )}
            {trailingIcon && (
              <div className="text-muted-foreground">{trailingIcon}</div>
            )}
          </div>
        </motion.div>

        {/* Error Message */}
        <AnimatePresence>
          {error && (
            <motion.div
              className="text-xs text-red-600 mt-1.5 flex items-center gap-1"
              variants={formAnimations.slideDown}
              initial="initial"
              animate="animate"
              exit="exit"
            >
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
              {error}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    );
  }
);

FloatingInput.displayName = 'FloatingInput';

export { FloatingInput };
