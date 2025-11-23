import { useState, useCallback, useRef, useEffect } from 'react';
import { z, ZodSchema } from 'zod';

export type ValidationRule<T = any> = {
  validate: (value: T) => boolean | Promise<boolean>;
  message: string;
};

export type FieldValidationRules<T extends Record<string, any>> = {
  [K in keyof T]?: ValidationRule<T[K]>[];
};

export type ValidationErrors<T extends Record<string, any>> = {
  [K in keyof T]?: string;
};

export type TouchedFields<T extends Record<string, any>> = {
  [K in keyof T]?: boolean;
};

export interface UseFormValidationOptions<T extends Record<string, any>> {
  schema?: ZodSchema<T>;
  rules?: FieldValidationRules<T>;
  initialValues?: T;
  debounceMs?: number;
  validateOnChange?: boolean;
  validateOnBlur?: boolean;
}

export function useFormValidation<T extends Record<string, any>>(
  options: UseFormValidationOptions<T> = {}
) {
  const {
    schema,
    rules,
    initialValues = {} as T,
    debounceMs = 300,
    validateOnChange = false,
    validateOnBlur = true,
  } = options;

  const [errors, setErrors] = useState<ValidationErrors<T>>({});
  const [touched, setTouched] = useState<TouchedFields<T>>({});
  const [isValidating, setIsValidating] = useState(false);
  const debounceTimers = useRef<{ [key: string]: NodeJS.Timeout }>({});

  // Validate a single field using Zod schema
  const validateFieldWithSchema = useCallback(
    async (fieldName: keyof T, value: any): Promise<string | undefined> => {
      if (!schema) return undefined;

      try {
        // Parse just this field
        // Check if schema has shape property (ZodObject)
        const schemaWithShape = schema as any;
        if (schemaWithShape.shape) {
          const fieldSchema = schemaWithShape.shape[fieldName as string];
          if (fieldSchema) {
            await fieldSchema.parseAsync(value);
          }
        }
        return undefined;
      } catch (error) {
        if (error instanceof z.ZodError) {
          return error.errors[0]?.message;
        }
        return 'Validation error';
      }
    },
    [schema]
  );

  // Validate a single field using custom rules
  const validateFieldWithRules = useCallback(
    async (fieldName: keyof T, value: any): Promise<string | undefined> => {
      if (!rules || !rules[fieldName]) return undefined;

      const fieldRules = rules[fieldName]!;
      for (const rule of fieldRules) {
        const isValid = await rule.validate(value);
        if (!isValid) {
          return rule.message;
        }
      }
      return undefined;
    },
    [rules]
  );

  // Validate a single field
  const validateField = useCallback(
    async (fieldName: keyof T, value: any): Promise<string | undefined> => {
      setIsValidating(true);

      try {
        // Check schema first
        const schemaError = await validateFieldWithSchema(fieldName, value);
        if (schemaError) {
          return schemaError;
        }

        // Then check custom rules
        const ruleError = await validateFieldWithRules(fieldName, value);
        if (ruleError) {
          return ruleError;
        }

        return undefined;
      } finally {
        setIsValidating(false);
      }
    },
    [validateFieldWithSchema, validateFieldWithRules]
  );

  // Validate all fields
  const validateAll = useCallback(
    async (values: T): Promise<boolean> => {
      setIsValidating(true);
      const newErrors: ValidationErrors<T> = {};

      try {
        // Validate with Zod schema
        if (schema) {
          try {
            await schema.parseAsync(values);
          } catch (error) {
            if (error instanceof z.ZodError) {
              error.errors.forEach((err) => {
                const fieldName = err.path[0] as keyof T;
                if (fieldName) {
                  newErrors[fieldName] = err.message;
                }
              });
            }
          }
        }

        // Validate with custom rules
        if (rules) {
          for (const fieldName of Object.keys(rules) as Array<keyof T>) {
            if (!newErrors[fieldName]) {
              const error = await validateFieldWithRules(
                fieldName,
                values[fieldName]
              );
              if (error) {
                newErrors[fieldName] = error;
              }
            }
          }
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
      } finally {
        setIsValidating(false);
      }
    },
    [schema, rules, validateFieldWithRules]
  );

  // Handle field change with optional debouncing
  const handleFieldChange = useCallback(
    (fieldName: keyof T, value: any) => {
      if (!validateOnChange) return;

      // Clear existing timer
      if (debounceTimers.current[fieldName as string]) {
        clearTimeout(debounceTimers.current[fieldName as string]);
      }

      // Set new timer
      debounceTimers.current[fieldName as string] = setTimeout(async () => {
        const error = await validateField(fieldName, value);
        setErrors((prev) => ({
          ...prev,
          [fieldName]: error,
        }));
      }, debounceMs);
    },
    [validateOnChange, validateField, debounceMs]
  );

  // Handle field blur
  const handleFieldBlur = useCallback(
    async (fieldName: keyof T, value: any) => {
      setTouched((prev) => ({
        ...prev,
        [fieldName]: true,
      }));

      if (validateOnBlur) {
        const error = await validateField(fieldName, value);
        setErrors((prev) => ({
          ...prev,
          [fieldName]: error,
        }));
      }
    },
    [validateOnBlur, validateField]
  );

  // Clear field error
  const clearFieldError = useCallback((fieldName: keyof T) => {
    setErrors((prev) => {
      const newErrors = { ...prev };
      delete newErrors[fieldName];
      return newErrors;
    });
  }, []);

  // Clear all errors
  const clearAllErrors = useCallback(() => {
    setErrors({});
  }, []);

  // Reset validation state
  const reset = useCallback(() => {
    setErrors({});
    setTouched({});
    setIsValidating(false);
    Object.values(debounceTimers.current).forEach(clearTimeout);
    debounceTimers.current = {};
  }, []);

  // Check if form is valid
  const isValid = Object.keys(errors).length === 0;

  // Check if field has error and is touched
  const getFieldError = useCallback(
    (fieldName: keyof T): string | undefined => {
      return touched[fieldName] ? errors[fieldName] : undefined;
    },
    [errors, touched]
  );

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      Object.values(debounceTimers.current).forEach(clearTimeout);
    };
  }, []);

  return {
    errors,
    touched,
    isValidating,
    isValid,
    validateField,
    validateAll,
    handleFieldChange,
    handleFieldBlur,
    clearFieldError,
    clearAllErrors,
    getFieldError,
    reset,
  };
}
