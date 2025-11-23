import { useState, useCallback } from 'react';
import { validations } from '@/lib/validations';

/**
 * useFormValidation - Custom Hook for Form Validation
 *
 * Provides a simple way to validate form fields with custom rules.
 *
 * Usage:
 * ```tsx
 * const { errors, validate, clearError, clearAllErrors } = useFormValidation();
 *
 * const handleSubmit = (e) => {
 *   e.preventDefault();
 *
 *   if (!validate('email', email, validations.string.isValidEmail)) {
 *     return;
 *   }
 *
 *   // Submit form
 * };
 * ```
 */

export interface ValidationRule<T = any> {
  validator: (value: T) => boolean;
  message: string;
}

export interface ValidationErrors {
  [field: string]: string;
}

export function useFormValidation() {
  const [errors, setErrors] = useState<ValidationErrors>({});

  /**
   * Validate a single field
   */
  const validate = useCallback(
    <T = any>(
      field: string,
      value: T,
      validator: (value: T) => boolean,
      errorMessage?: string
    ): boolean => {
      const isValid = validator(value);

      if (!isValid) {
        setErrors((prev) => ({
          ...prev,
          [field]: errorMessage || `Invalid ${field}`
        }));
      } else {
        setErrors((prev) => {
          const newErrors = { ...prev };
          delete newErrors[field];
          return newErrors;
        });
      }

      return isValid;
    },
    []
  );

  /**
   * Validate multiple fields with rules
   */
  const validateMultiple = useCallback(
    (validations: { field: string; value: any; rules: ValidationRule[] }[]): boolean => {
      let allValid = true;
      const newErrors: ValidationErrors = {};

      validations.forEach(({ field, value, rules }) => {
        for (const rule of rules) {
          if (!rule.validator(value)) {
            newErrors[field] = rule.message;
            allValid = false;
            break; // Stop at first failing rule
          }
        }
      });

      setErrors(newErrors);
      return allValid;
    },
    []
  );

  /**
   * Validate entire form object
   */
  const validateForm = useCallback(
    <T extends Record<string, any>>(
      formData: T,
      rules: {
        [K in keyof T]?: ValidationRule<T[K]>[];
      }
    ): boolean => {
      let allValid = true;
      const newErrors: ValidationErrors = {};

      Object.keys(rules).forEach((field) => {
        const fieldRules = rules[field as keyof T];
        const value = formData[field as keyof T];

        if (fieldRules) {
          for (const rule of fieldRules) {
            if (!rule.validator(value)) {
              newErrors[field] = rule.message;
              allValid = false;
              break;
            }
          }
        }
      });

      setErrors(newErrors);
      return allValid;
    },
    []
  );

  /**
   * Set custom error for a field
   */
  const setError = useCallback((field: string, message: string) => {
    setErrors((prev) => ({
      ...prev,
      [field]: message
    }));
  }, []);

  /**
   * Clear error for a specific field
   */
  const clearError = useCallback((field: string) => {
    setErrors((prev) => {
      const newErrors = { ...prev };
      delete newErrors[field];
      return newErrors;
    });
  }, []);

  /**
   * Clear all errors
   */
  const clearAllErrors = useCallback(() => {
    setErrors({});
  }, []);

  /**
   * Check if form has any errors
   */
  const hasErrors = useCallback((): boolean => {
    return Object.keys(errors).length > 0;
  }, [errors]);

  /**
   * Get error message for a field
   */
  const getError = useCallback(
    (field: string): string | undefined => {
      return errors[field];
    },
    [errors]
  );

  return {
    errors,
    validate,
    validateMultiple,
    validateForm,
    setError,
    clearError,
    clearAllErrors,
    hasErrors,
    getError
  };
}

/**
 * useFieldValidation - Simpler hook for single field validation
 */
export function useFieldValidation(
  initialValue: string = '',
  rules: ValidationRule<string>[] = []
) {
  const [value, setValue] = useState(initialValue);
  const [error, setError] = useState<string>('');
  const [touched, setTouched] = useState(false);

  const validateField = useCallback(
    (newValue?: string) => {
      const valueToValidate = newValue !== undefined ? newValue : value;

      for (const rule of rules) {
        if (!rule.validator(valueToValidate)) {
          setError(rule.message);
          return false;
        }
      }

      setError('');
      return true;
    },
    [value, rules]
  );

  const handleChange = useCallback(
    (newValue: string) => {
      setValue(newValue);
      if (touched) {
        validateField(newValue);
      }
    },
    [touched, validateField]
  );

  const handleBlur = useCallback(() => {
    setTouched(true);
    validateField();
  }, [validateField]);

  const reset = useCallback(() => {
    setValue(initialValue);
    setError('');
    setTouched(false);
  }, [initialValue]);

  return {
    value,
    error,
    touched,
    setValue: handleChange,
    onBlur: handleBlur,
    validate: validateField,
    reset,
    isValid: !error && touched
  };
}

/**
 * Common validation rules for reuse
 */
export const commonRules = {
  required: (fieldName: string): ValidationRule => ({
    validator: (value: any) => {
      if (typeof value === 'string') {
        return validations.string.isNotEmpty(value);
      }
      return value !== null && value !== undefined && value !== '';
    },
    message: `${fieldName} is required`
  }),

  email: (): ValidationRule<string> => ({
    validator: validations.string.isValidEmail,
    message: 'Invalid email format'
  }),

  phone: (): ValidationRule<string> => ({
    validator: validations.string.isValidJapanesePhone,
    message: 'Invalid Japanese phone number'
  }),

  minLength: (min: number): ValidationRule<string> => ({
    validator: (value: string) => value.length >= min,
    message: `Minimum ${min} characters required`
  }),

  maxLength: (max: number): ValidationRule<string> => ({
    validator: (value: string) => value.length <= max,
    message: `Maximum ${max} characters allowed`
  }),

  number: (): ValidationRule<string> => ({
    validator: (value: string) => !isNaN(Number(value)),
    message: 'Must be a valid number'
  }),

  positiveNumber: (): ValidationRule<number> => ({
    validator: validations.number.isPositive,
    message: 'Must be a positive number'
  }),

  range: (min: number, max: number): ValidationRule<number> => ({
    validator: (value: number) => validations.number.isInRange(value, min, max),
    message: `Must be between ${min} and ${max}`
  }),

  dateNotPast: (): ValidationRule<string> => ({
    validator: (value: string) => !validations.date.isPastDate(value),
    message: 'Date cannot be in the past'
  }),

  dateNotFuture: (): ValidationRule<string> => ({
    validator: (value: string) => !validations.date.isFutureDate(value),
    message: 'Date cannot be in the future'
  }),

  validAge: (): ValidationRule<string> => ({
    validator: validations.date.isValidAge,
    message: 'Invalid age (must be 15-100 years old)'
  })
};

export default useFormValidation;
