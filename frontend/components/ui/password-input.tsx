'use client';

import * as React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import { formAnimations } from '@/lib/form-animations';
import {
  EyeIcon,
  EyeSlashIcon,
  CheckCircleIcon,
  XCircleIcon,
} from '@heroicons/react/24/outline';

export type PasswordStrength = 'weak' | 'medium' | 'strong';

export interface PasswordInputProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'type'> {
  label?: string;
  error?: string;
  showStrengthMeter?: boolean;
  showRequirements?: boolean;
  hint?: string;
}

interface PasswordRequirement {
  label: string;
  test: (password: string) => boolean;
}

const requirements: PasswordRequirement[] = [
  {
    label: '最低8文字',
    test: (pwd) => pwd.length >= 8,
  },
  {
    label: '大文字を含む',
    test: (pwd) => /[A-Z]/.test(pwd),
  },
  {
    label: '数字を含む',
    test: (pwd) => /[0-9]/.test(pwd),
  },
  {
    label: '特殊文字を含む',
    test: (pwd) => /[!@#$%^&*(),.?":{}|<>]/.test(pwd),
  },
];

const calculateStrength = (password: string): PasswordStrength => {
  if (!password) return 'weak';

  const passedRequirements = requirements.filter((req) =>
    req.test(password)
  ).length;

  if (passedRequirements <= 2) return 'weak';
  if (passedRequirements === 3) return 'medium';
  return 'strong';
};

const strengthColors = {
  weak: {
    bg: 'bg-red-500',
    text: 'text-red-600',
    label: '弱い',
  },
  medium: {
    bg: 'bg-amber-500',
    text: 'text-amber-600',
    label: '普通',
  },
  strong: {
    bg: 'bg-green-500',
    text: 'text-green-600',
    label: '強い',
  },
};

const PasswordInput = React.forwardRef<HTMLInputElement, PasswordInputProps>(
  (
    {
      className,
      label,
      error,
      showStrengthMeter = false,
      showRequirements = false,
      hint,
      value,
      disabled,
      required,
      onChange,
      ...props
    },
    ref
  ) => {
    const [showPassword, setShowPassword] = React.useState(false);
    const [password, setPassword] = React.useState('');

    React.useEffect(() => {
      setPassword((value as string) || '');
    }, [value]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      setPassword(e.target.value);
      onChange?.(e);
    };

    const togglePasswordVisibility = () => {
      setShowPassword((prev) => !prev);
    };

    const strength = calculateStrength(password);
    const strengthConfig = strengthColors[strength];
    const strengthPercentage =
      strength === 'weak' ? 33 : strength === 'medium' ? 66 : 100;

    return (
      <div className="w-full space-y-2">
        {/* Label */}
        {label && (
          <label
            className={cn(
              'block text-sm font-medium',
              error ? 'text-red-600' : 'text-foreground',
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
        )}

        {/* Input Container */}
        <motion.div
          className="relative"
          animate={error ? 'animate' : 'initial'}
          variants={error ? formAnimations.shake : undefined}
        >
          <div className="relative flex items-center">
            {/* Input */}
            <input
              type={showPassword ? 'text' : 'password'}
              className={cn(
                'flex h-10 w-full rounded-md border bg-transparent px-3 py-2 pr-10 text-base shadow-sm transition-all duration-200',
                'placeholder:text-muted-foreground',
                'focus-visible:outline-none focus-visible:ring-2',
                'disabled:cursor-not-allowed disabled:opacity-50',
                error
                  ? 'border-red-500 focus-visible:ring-red-500 bg-red-50/50'
                  : 'border-input focus-visible:ring-ring',
                className
              )}
              ref={ref}
              value={value}
              disabled={disabled}
              onChange={handleChange}
              {...props}
            />

            {/* Toggle Visibility Button */}
            <button
              type="button"
              onClick={togglePasswordVisibility}
              disabled={disabled}
              className={cn(
                'absolute right-3 top-1/2 -translate-y-1/2',
                'text-muted-foreground hover:text-foreground transition-colors',
                'focus:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded',
                disabled && 'opacity-50 cursor-not-allowed'
              )}
              aria-label={showPassword ? 'パスワードを隠す' : 'パスワードを表示'}
            >
              <motion.div
                initial={false}
                animate={{ scale: [1, 0.8, 1] }}
                transition={{ duration: 0.2 }}
                key={showPassword ? 'visible' : 'hidden'}
              >
                {showPassword ? (
                  <EyeSlashIcon className="w-5 h-5" />
                ) : (
                  <EyeIcon className="w-5 h-5" />
                )}
              </motion.div>
            </button>
          </div>
        </motion.div>

        {/* Password Strength Meter */}
        <AnimatePresence>
          {showStrengthMeter && password && (
            <motion.div
              className="space-y-2"
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.2 }}
            >
              {/* Strength Bar */}
              <div className="flex items-center gap-2">
                <div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden">
                  <motion.div
                    className={cn('h-full rounded-full', strengthConfig.bg)}
                    initial={{ width: 0 }}
                    animate={{ width: `${strengthPercentage}%` }}
                    transition={{ duration: 0.3, ease: 'easeOut' }}
                  />
                </div>
                <span
                  className={cn(
                    'text-xs font-medium',
                    strengthConfig.text
                  )}
                >
                  {strengthConfig.label}
                </span>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Password Requirements */}
        <AnimatePresence>
          {showRequirements && password && (
            <motion.div
              className="space-y-1.5"
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.2 }}
            >
              {requirements.map((requirement, index) => {
                const isMet = requirement.test(password);
                return (
                  <motion.div
                    key={requirement.label}
                    className="flex items-center gap-2 text-xs"
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.05 }}
                  >
                    <motion.div
                      animate={isMet ? 'animate' : 'initial'}
                      variants={isMet ? formAnimations.pulse : undefined}
                    >
                      {isMet ? (
                        <CheckCircleIcon className="w-4 h-4 text-green-600" />
                      ) : (
                        <XCircleIcon className="w-4 h-4 text-gray-400" />
                      )}
                    </motion.div>
                    <span
                      className={cn(
                        isMet ? 'text-green-600' : 'text-muted-foreground'
                      )}
                    >
                      {requirement.label}
                    </span>
                  </motion.div>
                );
              })}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Hint Text */}
        {hint && !error && (
          <p className="text-xs text-muted-foreground">{hint}</p>
        )}

        {/* Error Message */}
        <AnimatePresence>
          {error && (
            <motion.div
              className="text-xs text-red-600 flex items-center gap-1"
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

PasswordInput.displayName = 'PasswordInput';

export { PasswordInput };
