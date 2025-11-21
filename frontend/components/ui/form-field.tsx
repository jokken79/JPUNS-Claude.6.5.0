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

export type FieldStatus = 'success' | 'error' | 'warning' | 'info' | 'default';

interface FormFieldContextValue {
  status: FieldStatus;
  error?: string;
  hint?: string;
  showIcon: boolean;
}

const FormFieldContext = React.createContext<FormFieldContextValue | undefined>(
  undefined
);

const useFormFieldContext = () => {
  const context = React.useContext(FormFieldContext);
  if (!context) {
    throw new Error('FormField components must be used within FormField');
  }
  return context;
};

// Main FormField Container
interface FormFieldProps {
  children: React.ReactNode;
  status?: FieldStatus;
  error?: string;
  hint?: string;
  showIcon?: boolean;
  className?: string;
}

const FormField = React.forwardRef<HTMLDivElement, FormFieldProps>(
  (
    {
      children,
      status = 'default',
      error,
      hint,
      showIcon = true,
      className,
    },
    ref
  ) => {
    // Automatically set status to error if error prop is provided
    const effectiveStatus = error ? 'error' : status;

    return (
      <FormFieldContext.Provider
        value={{ status: effectiveStatus, error, hint, showIcon }}
      >
        <motion.div
          ref={ref}
          className={cn('space-y-1.5', className)}
          animate={effectiveStatus === 'error' ? 'animate' : 'initial'}
          variants={
            effectiveStatus === 'error' ? formAnimations.shake : undefined
          }
        >
          {children}
        </motion.div>
      </FormFieldContext.Provider>
    );
  }
);

FormField.displayName = 'FormField';

// Label Component
interface FormFieldLabelProps
  extends React.LabelHTMLAttributes<HTMLLabelElement> {
  required?: boolean;
}

const FormFieldLabel = React.forwardRef<
  HTMLLabelElement,
  FormFieldLabelProps
>(({ className, children, required, ...props }, ref) => {
  const { status } = useFormFieldContext();
  const colors = status !== 'default' ? statusColors[status] : null;

  return (
    <label
      ref={ref}
      className={cn(
        'block text-sm font-medium',
        status !== 'default' ? colors?.text : 'text-foreground',
        className
      )}
      {...props}
    >
      {children}
      {required && (
        <span className="text-red-500 ml-1" aria-label="required">
          *
        </span>
      )}
    </label>
  );
});

FormFieldLabel.displayName = 'FormField.Label';

// Input Component
interface FormFieldInputProps
  extends React.InputHTMLAttributes<HTMLInputElement> {
  leadingIcon?: React.ReactNode;
  trailingIcon?: React.ReactNode;
}

const FormFieldInput = React.forwardRef<HTMLInputElement, FormFieldInputProps>(
  ({ className, leadingIcon, trailingIcon, ...props }, ref) => {
    const { status } = useFormFieldContext();
    const colors = status !== 'default' ? statusColors[status] : null;

    return (
      <div className="relative">
        {/* Leading Icon */}
        {leadingIcon && (
          <div className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none">
            {leadingIcon}
          </div>
        )}

        {/* Input */}
        <input
          ref={ref}
          className={cn(
            'flex h-10 w-full rounded-md border bg-transparent px-3 py-2 text-base shadow-sm transition-all duration-200',
            'placeholder:text-muted-foreground',
            'focus-visible:outline-none focus-visible:ring-2',
            'disabled:cursor-not-allowed disabled:opacity-50',
            // Default styles
            status === 'default' && 'border-input focus-visible:ring-ring',
            // Status-specific styles
            status !== 'default' && [
              colors?.border,
              colors?.bg,
              'focus-visible:ring-2',
              `focus-visible:${colors?.ring}`,
            ],
            leadingIcon && 'pl-10',
            trailingIcon && 'pr-10',
            className
          )}
          {...props}
        />

        {/* Trailing Icon */}
        {trailingIcon && (
          <div className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none">
            {trailingIcon}
          </div>
        )}
      </div>
    );
  }
);

FormFieldInput.displayName = 'FormField.Input';

// Textarea Component
const FormFieldTextarea = React.forwardRef<
  HTMLTextAreaElement,
  React.TextareaHTMLAttributes<HTMLTextAreaElement>
>(({ className, ...props }, ref) => {
  const { status } = useFormFieldContext();
  const colors = status !== 'default' ? statusColors[status] : null;

  return (
    <textarea
      ref={ref}
      className={cn(
        'flex min-h-[80px] w-full rounded-md border bg-transparent px-3 py-2 text-base shadow-sm transition-all duration-200',
        'placeholder:text-muted-foreground',
        'focus-visible:outline-none focus-visible:ring-2',
        'disabled:cursor-not-allowed disabled:opacity-50',
        // Default styles
        status === 'default' && 'border-input focus-visible:ring-ring',
        // Status-specific styles
        status !== 'default' && [
          colors?.border,
          colors?.bg,
          'focus-visible:ring-2',
          `focus-visible:${colors?.ring}`,
        ],
        className
      )}
      {...props}
    />
  );
});

FormFieldTextarea.displayName = 'FormField.Textarea';

// Error Component
const statusIcons = {
  success: CheckCircleIcon,
  error: XCircleIcon,
  warning: ExclamationTriangleIcon,
  info: InformationCircleIcon,
};

interface FormFieldErrorProps {
  className?: string;
  children?: React.ReactNode;
}

const FormFieldError = React.forwardRef<HTMLDivElement, FormFieldErrorProps>(
  ({ className, children }, ref) => {
    const { status, error, showIcon } = useFormFieldContext();
    const colors = status !== 'default' ? statusColors[status] : null;
    const StatusIcon = status !== 'default' ? statusIcons[status] : null;

    const message = children || error;

    if (!message) return null;

    return (
      <AnimatePresence>
        <motion.div
          ref={ref}
          className={cn('text-xs flex items-center gap-1', colors?.text, className)}
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
      </AnimatePresence>
    );
  }
);

FormFieldError.displayName = 'FormField.Error';

// Hint Component
interface FormFieldHintProps {
  className?: string;
  children?: React.ReactNode;
}

const FormFieldHint = React.forwardRef<HTMLParagraphElement, FormFieldHintProps>(
  ({ className, children }, ref) => {
    const { hint } = useFormFieldContext();
    const message = children || hint;

    if (!message) return null;

    return (
      <p
        ref={ref}
        className={cn('text-xs text-muted-foreground', className)}
      >
        {message}
      </p>
    );
  }
);

FormFieldHint.displayName = 'FormField.Hint';

// Type for compound component
type FormFieldComponent = typeof FormField & {
  Label: typeof FormFieldLabel;
  Input: typeof FormFieldInput;
  Textarea: typeof FormFieldTextarea;
  Error: typeof FormFieldError;
  Hint: typeof FormFieldHint;
};

// Create compound component
const FormFieldWithSubComponents = FormField as FormFieldComponent;
FormFieldWithSubComponents.Label = FormFieldLabel;
FormFieldWithSubComponents.Input = FormFieldInput;
FormFieldWithSubComponents.Textarea = FormFieldTextarea;
FormFieldWithSubComponents.Error = FormFieldError;
FormFieldWithSubComponents.Hint = FormFieldHint;

// Export compound component
export {
  FormFieldWithSubComponents as FormField,
  FormFieldLabel,
  FormFieldInput,
  FormFieldTextarea,
  FormFieldError,
  FormFieldHint,
};
