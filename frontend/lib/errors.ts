/**
 * Frontend Error Handling Utilities - FASE 4 #2
 * 
 * This module provides:
 * - Type-safe error handling for backend API responses
 * - Error code mapping for client-side error handling
 * - User-friendly error message generation
 * - Error logging and tracking
 */

/**
 * Standard error codes from backend (matches backend ErrorCode enum)
 */
export enum ErrorCode {
  // Validation Errors (4000-4099)
  VALIDATION_ERROR = "ERR_VALIDATION_FAILED",
  VALIDATION_FIELD = "ERR_VALIDATION_FIELD",
  VALIDATION_FORMAT = "ERR_VALIDATION_FORMAT",
  VALIDATION_RANGE = "ERR_VALIDATION_RANGE",

  // Resource Errors (4100-4199)
  RESOURCE_NOT_FOUND = "ERR_RESOURCE_NOT_FOUND",
  RESOURCE_ALREADY_EXISTS = "ERR_RESOURCE_ALREADY_EXISTS",
  RESOURCE_CONFLICT = "ERR_RESOURCE_CONFLICT",
  RESOURCE_GONE = "ERR_RESOURCE_GONE",

  // Authentication Errors (4200-4299)
  AUTH_REQUIRED = "ERR_AUTH_REQUIRED",
  AUTH_INVALID_TOKEN = "ERR_AUTH_INVALID_TOKEN",
  AUTH_EXPIRED_TOKEN = "ERR_AUTH_EXPIRED_TOKEN",
  AUTH_INVALID_CREDENTIALS = "ERR_AUTH_INVALID_CREDENTIALS",
  AUTH_FORBIDDEN = "ERR_AUTH_FORBIDDEN",
  AUTH_INSUFFICIENT_PERMISSIONS = "ERR_AUTH_INSUFFICIENT_PERMISSIONS",

  // Business Logic Errors (4300-4399)
  BUSINESS_RULE_VIOLATION = "ERR_BUSINESS_RULE",
  PAYROLL_CALCULATION_ERROR = "ERR_PAYROLL_CALCULATION",
  WORKFLOW_ERROR = "ERR_WORKFLOW",
  INSUFFICIENT_DATA = "ERR_INSUFFICIENT_DATA",
  OPERATION_NOT_ALLOWED = "ERR_OPERATION_NOT_ALLOWED",

  // File/Upload Errors (4400-4499)
  FILE_UPLOAD_ERROR = "ERR_FILE_UPLOAD",
  FILE_TOO_LARGE = "ERR_FILE_TOO_LARGE",
  FILE_TYPE_NOT_SUPPORTED = "ERR_FILE_TYPE_UNSUPPORTED",
  FILE_PROCESSING_ERROR = "ERR_FILE_PROCESSING",
  OCR_PROCESSING_ERROR = "ERR_OCR_PROCESSING",

  // External Service Errors (5000-5099)
  EXTERNAL_SERVICE_ERROR = "ERR_EXTERNAL_SERVICE",
  EXTERNAL_SERVICE_TIMEOUT = "ERR_EXTERNAL_SERVICE_TIMEOUT",
  EXTERNAL_SERVICE_UNAVAILABLE = "ERR_EXTERNAL_SERVICE_UNAVAILABLE",
  API_KEY_INVALID = "ERR_API_KEY_INVALID",

  // Database Errors (5100-5199)
  DATABASE_ERROR = "ERR_DATABASE",
  DATABASE_CONNECTION_ERROR = "ERR_DATABASE_CONNECTION",
  DATABASE_TRANSACTION_ERROR = "ERR_DATABASE_TRANSACTION",
  DATABASE_INTEGRITY_ERROR = "ERR_DATABASE_INTEGRITY",

  // Server Errors (5200-5299)
  SERVER_ERROR = "ERR_SERVER",
  SERVER_TIMEOUT = "ERR_SERVER_TIMEOUT",
  SERVER_UNAVAILABLE = "ERR_SERVER_UNAVAILABLE",
  CONFIGURATION_ERROR = "ERR_CONFIGURATION",
}

/**
 * Standard API error response structure (matches backend format)
 */
export interface APIErrorResponse {
  success: false;
  error: {
    code: string;
    message: string;
    status: number;
    request_id: string;
    timestamp: string;
    context?: Record<string, any>;
  };
}

/**
 * Parsed error object for easier handling
 */
export interface ParsedError {
  code: string;
  message: string;
  status: number;
  requestId: string;
  timestamp: Date;
  context?: Record<string, any>;
  isRetryable: boolean;
  isAuthError: boolean;
  isValidationError: boolean;
}

/**
 * Check if response is an API error response
 */
export function isAPIError(error: any): error is APIErrorResponse {
  return (
    error &&
    typeof error === 'object' &&
    error.success === false &&
    error.error &&
    typeof error.error.code === 'string' &&
    typeof error.error.message === 'string'
  );
}

/**
 * Parse error response into structured error object
 */
export function parseError(error: any): ParsedError {
  // Handle API error responses
  if (isAPIError(error)) {
    const { code, message, status, request_id, timestamp, context } = error.error;
    return {
      code,
      message,
      status,
      requestId: request_id,
      timestamp: new Date(timestamp),
      context,
      isRetryable: isRetryableError(code, status),
      isAuthError: isAuthenticationError(code, status),
      isValidationError: isValidationErr(code, status),
    };
  }

  // Handle network errors
  if (error instanceof TypeError && error.message.includes('fetch')) {
    return {
      code: 'NETWORK_ERROR',
      message: 'No se pudo conectar con el servidor. Verifica tu conexión a internet.',
      status: 0,
      requestId: '',
      timestamp: new Date(),
      isRetryable: true,
      isAuthError: false,
      isValidationError: false,
    };
  }

  // Handle generic errors
  return {
    code: 'UNKNOWN_ERROR',
    message: error?.message || 'Ha ocurrido un error inesperado',
    status: 500,
    requestId: '',
    timestamp: new Date(),
    context: error,
    isRetryable: false,
    isAuthError: false,
    isValidationError: false,
  };
}

/**
 * Check if error is retryable (network issues, timeouts, etc.)
 */
export function isRetryableError(code: string, status: number): boolean {
  // Timeout and service unavailable errors are retryable
  if (status === 503 || status === 504) return true;
  
  // Network and connection errors are retryable
  if (code === 'NETWORK_ERROR') return true;
  if (code === ErrorCode.EXTERNAL_SERVICE_TIMEOUT) return true;
  if (code === ErrorCode.EXTERNAL_SERVICE_UNAVAILABLE) return true;
  if (code === ErrorCode.SERVER_TIMEOUT) return true;
  if (code === ErrorCode.DATABASE_CONNECTION_ERROR) return true;
  
  return false;
}

/**
 * Check if error is an authentication error
 */
export function isAuthenticationError(code: string, status: number): boolean {
  if (status === 401) return true;
  
  return (
    code === ErrorCode.AUTH_REQUIRED ||
    code === ErrorCode.AUTH_INVALID_TOKEN ||
    code === ErrorCode.AUTH_EXPIRED_TOKEN ||
    code === ErrorCode.AUTH_INVALID_CREDENTIALS
  );
}

/**
 * Check if error is a validation error
 */
export function isValidationErr(code: string, status: number): boolean {
  if (status === 400 || status === 422) return true;
  
  return (
    code === ErrorCode.VALIDATION_ERROR ||
    code === ErrorCode.VALIDATION_FIELD ||
    code === ErrorCode.VALIDATION_FORMAT ||
    code === ErrorCode.VALIDATION_RANGE
  );
}

/**
 * Get user-friendly error message based on error code
 */
export function getUserFriendlyMessage(error: ParsedError): string {
  // Use backend message if available
  if (error.message) return error.message;

  // Fallback messages by error code
  const messages: Record<string, string> = {
    [ErrorCode.AUTH_REQUIRED]: 'Debes iniciar sesión para continuar',
    [ErrorCode.AUTH_INVALID_TOKEN]: 'Tu sesión ha expirado. Por favor, inicia sesión nuevamente',
    [ErrorCode.AUTH_EXPIRED_TOKEN]: 'Tu sesión ha expirado. Por favor, inicia sesión nuevamente',
    [ErrorCode.AUTH_INVALID_CREDENTIALS]: 'Usuario o contraseña incorrectos',
    [ErrorCode.AUTH_FORBIDDEN]: 'No tienes permisos para realizar esta acción',
    [ErrorCode.RESOURCE_NOT_FOUND]: 'El recurso solicitado no fue encontrado',
    [ErrorCode.RESOURCE_ALREADY_EXISTS]: 'Este recurso ya existe',
    [ErrorCode.VALIDATION_ERROR]: 'Los datos ingresados no son válidos',
    [ErrorCode.FILE_TOO_LARGE]: 'El archivo es demasiado grande',
    [ErrorCode.FILE_TYPE_NOT_SUPPORTED]: 'Tipo de archivo no soportado',
    [ErrorCode.DATABASE_ERROR]: 'Error de base de datos. Por favor, intenta nuevamente',
    [ErrorCode.EXTERNAL_SERVICE_ERROR]: 'Servicio externo no disponible',
    [ErrorCode.SERVER_ERROR]: 'Error del servidor. Por favor, intenta nuevamente',
  };

  return messages[error.code] || 'Ha ocurrido un error inesperado';
}

/**
 * Get error title based on error type
 */
export function getErrorTitle(error: ParsedError): string {
  if (error.isAuthError) return 'Error de autenticación';
  if (error.isValidationError) return 'Error de validación';
  if (error.status >= 500) return 'Error del servidor';
  if (error.status >= 400) return 'Error en la solicitud';
  return 'Error';
}

/**
 * Log error to console (and optionally to backend)
 */
export function logError(error: ParsedError, context?: Record<string, any>) {
  console.error('[Error]', {
    code: error.code,
    message: error.message,
    status: error.status,
    requestId: error.requestId,
    timestamp: error.timestamp,
    context: { ...error.context, ...context },
  });

  // TODO: Send error to backend logging endpoint
  // This would be useful for tracking client-side errors
}

/**
 * Handle API fetch errors
 */
export async function handleFetchError(response: Response): Promise<never> {
  let errorData: any;
  
  try {
    errorData = await response.json();
  } catch {
    // If response is not JSON, create generic error
    errorData = {
      success: false,
      error: {
        code: 'HTTP_ERROR',
        message: response.statusText || 'Request failed',
        status: response.status,
        request_id: response.headers.get('X-Request-ID') || '',
        timestamp: new Date().toISOString(),
      },
    };
  }

  throw errorData;
}

/**
 * Wrapper for fetch that handles errors automatically
 */
export async function apiFetch<T>(
  url: string,
  options?: RequestInit
): Promise<T> {
  try {
    const response = await fetch(url, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...options?.headers,
      },
    });

    if (!response.ok) {
      await handleFetchError(response);
    }

    return await response.json();
  } catch (error) {
    // Re-throw API errors as-is
    if (isAPIError(error)) {
      throw error;
    }

    // Wrap other errors in standard format
    throw parseError(error);
  }
}

/**
 * Retry logic for retryable errors
 */
export async function withRetry<T>(
  fn: () => Promise<T>,
  maxRetries: number = 3,
  delayMs: number = 1000
): Promise<T> {
  let lastError: any;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      const parsedError = parseError(error);
      lastError = error;

      // Don't retry if error is not retryable
      if (!parsedError.isRetryable) {
        throw error;
      }

      // Don't retry on last attempt
      if (attempt === maxRetries) {
        break;
      }

      // Wait before retrying (exponential backoff)
      await new Promise((resolve) =>
        setTimeout(resolve, delayMs * Math.pow(2, attempt))
      );

      console.log(
        `Retrying request (attempt ${attempt + 1}/${maxRetries})...`
      );
    }
  }

  throw lastError;
}

/**
 * React hook for error handling
 */
export function useErrorHandler() {
  const handleError = (error: any, context?: Record<string, any>) => {
    const parsedError = parseError(error);
    logError(parsedError, context);

    // Handle auth errors by redirecting to login
    if (parsedError.isAuthError) {
      // Redirect to login page
      window.location.href = '/login';
      return;
    }

    return parsedError;
  };

  return { handleError };
}
