'use client';

import * as React from 'react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

export type ToggleSize = 'sm' | 'md' | 'lg';
export type LabelPosition = 'left' | 'right' | 'both';

export interface ToggleProps {
  checked?: boolean;
  defaultChecked?: boolean;
  onChange?: (checked: boolean) => void;
  disabled?: boolean;
  isLoading?: boolean;
  size?: ToggleSize;
  label?: string;
  description?: string;
  labelPosition?: LabelPosition;
  leftLabel?: string;
  rightLabel?: string;
  icon?: React.ReactNode;
  checkedIcon?: React.ReactNode;
  uncheckedIcon?: React.ReactNode;
  className?: string;
}

const sizeClasses = {
  sm: {
    track: 'h-5 w-9',
    thumb: 'h-4 w-4',
    translate: 'translate-x-4',
    icon: 'w-3 h-3',
  },
  md: {
    track: 'h-6 w-11',
    thumb: 'h-5 w-5',
    translate: 'translate-x-5',
    icon: 'w-3.5 h-3.5',
  },
  lg: {
    track: 'h-7 w-14',
    thumb: 'h-6 w-6',
    translate: 'translate-x-7',
    icon: 'w-4 h-4',
  },
};

const Toggle = React.forwardRef<HTMLButtonElement, ToggleProps>(
  (
    {
      checked: controlledChecked,
      defaultChecked = false,
      onChange,
      disabled = false,
      isLoading = false,
      size = 'md',
      label,
      description,
      labelPosition = 'right',
      leftLabel,
      rightLabel,
      icon,
      checkedIcon,
      uncheckedIcon,
      className,
    },
    ref
  ) => {
    const [uncontrolledChecked, setUncontrolledChecked] =
      React.useState(defaultChecked);

    const isControlled = controlledChecked !== undefined;
    const checked = isControlled ? controlledChecked : uncontrolledChecked;

    const handleToggle = () => {
      if (disabled || isLoading) return;

      const newChecked = !checked;

      if (!isControlled) {
        setUncontrolledChecked(newChecked);
      }

      onChange?.(newChecked);
    };

    const sizes = sizeClasses[size];

    const displayIcon = icon || (checked ? checkedIcon : uncheckedIcon);

    return (
      <div className={cn('inline-flex items-center gap-3', className)}>
        {/* Left Label */}
        {(labelPosition === 'left' || labelPosition === 'both') && leftLabel && (
          <label
            className={cn(
              'text-sm font-medium cursor-pointer select-none',
              disabled && 'opacity-50 cursor-not-allowed'
            )}
            onClick={handleToggle}
          >
            {leftLabel}
          </label>
        )}

        {/* Toggle Button */}
        <button
          ref={ref}
          type="button"
          role="switch"
          aria-checked={checked}
          disabled={disabled || isLoading}
          onClick={handleToggle}
          className={cn(
            'relative inline-flex items-center rounded-full transition-all duration-200 ease-out',
            'focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
            sizes.track,
            checked
              ? 'bg-indigo-600 hover:bg-indigo-700'
              : 'bg-gray-200 hover:bg-gray-300',
            disabled && 'opacity-50 cursor-not-allowed',
            isLoading && 'opacity-70 cursor-wait'
          )}
        >
          <motion.span
            className={cn(
              'inline-flex items-center justify-center rounded-full bg-white shadow-lg',
              sizes.thumb
            )}
            initial={false}
            animate={{
              x: checked ? sizes.translate : '0.125rem',
            }}
            transition={{
              type: 'spring',
              stiffness: 500,
              damping: 30,
            }}
          >
            {/* Loading Spinner */}
            {isLoading ? (
              <motion.div
                animate={{ rotate: 360 }}
                transition={{
                  duration: 1,
                  repeat: Infinity,
                  ease: 'linear',
                }}
                className={sizes.icon}
              >
                <svg
                  className={cn('text-indigo-600', sizes.icon)}
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
              displayIcon && (
                <motion.div
                  key={checked ? 'checked' : 'unchecked'}
                  initial={{ scale: 0, rotate: -180 }}
                  animate={{ scale: 1, rotate: 0 }}
                  exit={{ scale: 0, rotate: 180 }}
                  transition={{ duration: 0.2 }}
                  className={cn(
                    'flex items-center justify-center',
                    checked ? 'text-indigo-600' : 'text-gray-400',
                    sizes.icon
                  )}
                >
                  {displayIcon}
                </motion.div>
              )
            )}
          </motion.span>
        </button>

        {/* Right Label / Label with Description */}
        {(labelPosition === 'right' || labelPosition === 'both') &&
          (label || rightLabel) && (
            <div
              className={cn(
                'flex flex-col gap-0.5 cursor-pointer select-none',
                disabled && 'opacity-50 cursor-not-allowed'
              )}
              onClick={handleToggle}
            >
              <label
                className={cn(
                  'text-sm font-medium',
                  disabled ? 'cursor-not-allowed' : 'cursor-pointer'
                )}
              >
                {label || rightLabel}
              </label>
              {description && (
                <p className="text-xs text-muted-foreground">{description}</p>
              )}
            </div>
          )}
      </div>
    );
  }
);

Toggle.displayName = 'Toggle';

export { Toggle };
