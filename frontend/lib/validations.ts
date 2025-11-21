/**
 * Form Validation Utilities
 *
 * Provides validation functions for common form inputs with
 * Japanese business rules support.
 */

// Date Validations
export const dateValidations = {
  /**
   * Check if date is in the past
   */
  isPastDate: (date: Date | string): boolean => {
    const inputDate = typeof date === 'string' ? new Date(date) : date;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return inputDate < today;
  },

  /**
   * Check if date is in the future
   */
  isFutureDate: (date: Date | string): boolean => {
    const inputDate = typeof date === 'string' ? new Date(date) : date;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return inputDate > today;
  },

  /**
   * Check if date is within a range
   */
  isDateInRange: (date: Date | string, minDate: Date | string, maxDate: Date | string): boolean => {
    const inputDate = typeof date === 'string' ? new Date(date) : date;
    const min = typeof minDate === 'string' ? new Date(minDate) : minDate;
    const max = typeof maxDate === 'string' ? new Date(maxDate) : maxDate;
    return inputDate >= min && inputDate <= max;
  },

  /**
   * Check if start date is before end date
   */
  isStartBeforeEnd: (startDate: Date | string, endDate: Date | string): boolean => {
    const start = typeof startDate === 'string' ? new Date(startDate) : startDate;
    const end = typeof endDate === 'string' ? new Date(endDate) : endDate;
    return start < end;
  },

  /**
   * Validate age (for employee/candidate registration)
   * Minimum working age in Japan: 15 years old
   */
  isValidAge: (birthDate: Date | string, minAge: number = 15, maxAge: number = 100): boolean => {
    const birth = typeof birthDate === 'string' ? new Date(birthDate) : birthDate;
    const today = new Date();
    const age = today.getFullYear() - birth.getFullYear();
    const monthDiff = today.getMonth() - birth.getMonth();

    const actualAge =
      monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())
        ? age - 1
        : age;

    return actualAge >= minAge && actualAge <= maxAge;
  },

  /**
   * Validate if date is a valid Japanese fiscal year start (April 1)
   */
  isFiscalYearStart: (date: Date | string): boolean => {
    const inputDate = typeof date === 'string' ? new Date(date) : date;
    return inputDate.getMonth() === 3 && inputDate.getDate() === 1; // April 1 (0-indexed)
  },

  /**
   * Format date for display (YYYY-MM-DD)
   */
  formatDate: (date: Date | string): string => {
    const d = typeof date === 'string' ? new Date(date) : date;
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  },

  /**
   * Parse date string safely
   */
  parseDate: (dateString: string): Date | null => {
    try {
      const date = new Date(dateString);
      return isNaN(date.getTime()) ? null : date;
    } catch {
      return null;
    }
  }
};

// Input Sanitization
export const sanitization = {
  /**
   * Remove HTML tags from string
   */
  stripHtml: (input: string): string => {
    return input.replace(/<[^>]*>/g, '');
  },

  /**
   * Remove special characters (keep only alphanumeric, Japanese, and basic punctuation)
   */
  sanitizeText: (input: string): string => {
    // Allow: letters, numbers, Japanese characters, spaces, and basic punctuation
    return input.replace(/[^\w\s\u3040-\u309F\u30A0-\u30FF\u4E00-\u9FFF.,!?@\-()]/g, '');
  },

  /**
   * Sanitize email input
   */
  sanitizeEmail: (email: string): string => {
    return email.toLowerCase().trim().replace(/[^a-z0-9@._\-]/g, '');
  },

  /**
   * Sanitize phone number (Japanese format)
   */
  sanitizePhone: (phone: string): string => {
    // Remove everything except digits and hyphens
    return phone.replace(/[^\d\-]/g, '');
  },

  /**
   * Sanitize numeric input
   */
  sanitizeNumber: (input: string): string => {
    return input.replace(/[^\d.\-]/g, '');
  },

  /**
   * Trim and normalize whitespace
   */
  normalizeWhitespace: (input: string): string => {
    return input.trim().replace(/\s+/g, ' ');
  }
};

// Number Validations
export const numberValidations = {
  /**
   * Check if number is within range
   */
  isInRange: (value: number, min: number, max: number): boolean => {
    return value >= min && value <= max;
  },

  /**
   * Check if number is positive
   */
  isPositive: (value: number): boolean => {
    return value > 0;
  },

  /**
   * Check if number is non-negative
   */
  isNonNegative: (value: number): boolean => {
    return value >= 0;
  },

  /**
   * Validate salary (reasonable range for Japan)
   */
  isValidSalary: (salary: number): boolean => {
    const MIN_SALARY = 100000; // 100,000 yen/month minimum
    const MAX_SALARY = 10000000; // 10,000,000 yen/month maximum
    return salary >= MIN_SALARY && salary <= MAX_SALARY;
  },

  /**
   * Validate working hours (max 40 hours/week standard, 60 with overtime)
   */
  isValidWorkHours: (hours: number, includeOvertime: boolean = true): boolean => {
    const maxHours = includeOvertime ? 60 : 40;
    return hours >= 0 && hours <= maxHours;
  }
};

// String Validations
export const stringValidations = {
  /**
   * Check if string is not empty
   */
  isNotEmpty: (value: string): boolean => {
    return value.trim().length > 0;
  },

  /**
   * Check if string length is within range
   */
  isLengthInRange: (value: string, min: number, max: number): boolean => {
    const length = value.trim().length;
    return length >= min && length <= max;
  },

  /**
   * Validate email format
   */
  isValidEmail: (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  },

  /**
   * Validate Japanese phone number format
   * Formats: 03-1234-5678, 090-1234-5678, 0312345678, 09012345678
   */
  isValidJapanesePhone: (phone: string): boolean => {
    const phoneRegex = /^(0\d{1,4}-?\d{1,4}-?\d{4}|0\d{9,10})$/;
    return phoneRegex.test(phone.replace(/\s/g, ''));
  },

  /**
   * Validate postal code (Japanese format: 123-4567)
   */
  isValidPostalCode: (postalCode: string): boolean => {
    const postalRegex = /^\d{3}-?\d{4}$/;
    return postalRegex.test(postalCode);
  },

  /**
   * Check if string contains only Japanese characters
   */
  isJapanese: (text: string): boolean => {
    const japaneseRegex = /^[\u3040-\u309F\u30A0-\u30FF\u4E00-\u9FFF\s]+$/;
    return japaneseRegex.test(text);
  },

  /**
   * Check if string contains only alphanumeric characters
   */
  isAlphanumeric: (text: string): boolean => {
    const alphanumericRegex = /^[a-zA-Z0-9]+$/;
    return alphanumericRegex.test(text);
  }
};

// Form-specific validations
export const formValidations = {
  /**
   * Validate candidate registration form
   */
  validateCandidateForm: (data: {
    fullName?: string;
    dateOfBirth?: string;
    email?: string;
    phone?: string;
  }): { valid: boolean; errors: string[] } => {
    const errors: string[] = [];

    if (!data.fullName || !stringValidations.isNotEmpty(data.fullName)) {
      errors.push('Full name is required');
    }

    if (data.dateOfBirth && !dateValidations.isValidAge(data.dateOfBirth)) {
      errors.push('Invalid age (must be 15-100 years old)');
    }

    if (data.email && !stringValidations.isValidEmail(data.email)) {
      errors.push('Invalid email format');
    }

    if (data.phone && !stringValidations.isValidJapanesePhone(data.phone)) {
      errors.push('Invalid Japanese phone number format');
    }

    return {
      valid: errors.length === 0,
      errors
    };
  },

  /**
   * Validate payroll run form
   */
  validatePayrollForm: (data: {
    startDate?: string;
    endDate?: string;
  }): { valid: boolean; errors: string[] } => {
    const errors: string[] = [];

    if (!data.startDate || !data.endDate) {
      errors.push('Start date and end date are required');
      return { valid: false, errors };
    }

    if (!dateValidations.isStartBeforeEnd(data.startDate, data.endDate)) {
      errors.push('Start date must be before end date');
    }

    const start = new Date(data.startDate);
    const end = new Date(data.endDate);
    const daysDiff = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));

    if (daysDiff < 7 || daysDiff > 31) {
      errors.push('Pay period must be between 7 and 31 days');
    }

    return {
      valid: errors.length === 0,
      errors
    };
  },

  /**
   * Validate apartment assignment form
   */
  validateAssignmentForm: (data: {
    employeeId?: number;
    apartmentId?: number;
    startDate?: string;
    endDate?: string;
    monthlyRent?: number;
  }): { valid: boolean; errors: string[] } => {
    const errors: string[] = [];

    if (!data.employeeId) {
      errors.push('Employee is required');
    }

    if (!data.apartmentId) {
      errors.push('Apartment is required');
    }

    if (!data.startDate) {
      errors.push('Start date is required');
    }

    if (data.endDate && !dateValidations.isStartBeforeEnd(data.startDate!, data.endDate)) {
      errors.push('Start date must be before end date');
    }

    if (data.monthlyRent && !numberValidations.isPositive(data.monthlyRent)) {
      errors.push('Monthly rent must be a positive number');
    }

    return {
      valid: errors.length === 0,
      errors
    };
  }
};

// Export all validation utilities
export const validations = {
  date: dateValidations,
  sanitize: sanitization,
  number: numberValidations,
  string: stringValidations,
  form: formValidations
};

export default validations;
