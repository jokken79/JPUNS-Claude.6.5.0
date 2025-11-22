/**
 * Standardized API Response Types - FASE 4 #4
 * 
 * These types match the backend response format defined in:
 * - /backend/app/schemas/responses.py (success responses)
 * - /backend/app/core/exceptions.py (error responses)
 * 
 * All API responses follow this envelope structure for consistency.
 */

// ============================================================================
// METADATA TYPES
// ============================================================================

/**
 * Response metadata included in all successful API responses.
 * Provides request tracking and versioning information.
 */
export interface ResponseMetadata {
  /** ISO 8601 UTC timestamp of when response was generated */
  timestamp: string;
  /** Unique request identifier for tracking and debugging */
  request_id: string;
  /** API version (default: "1.0") */
  version: string;
}

// ============================================================================
// SUCCESS RESPONSE TYPES
// ============================================================================

/**
 * Generic success response envelope.
 * Wraps all successful API responses with consistent structure.
 * 
 * @template T - The type of data being returned
 * 
 * @example
 * // Single user response
 * type UserResponse = ApiResponse<User>;
 * 
 * // List of items response
 * type UsersResponse = ApiResponse<User[]>;
 * 
 * // Dictionary/object response
 * type StatsResponse = ApiResponse<{ total: number; active: number }>;
 */
export interface ApiResponse<T> {
  /** Always true for successful responses */
  success: true;
  /** Response data (type varies by endpoint) */
  data: T;
  /** Response metadata with timestamp and request tracking */
  metadata: ResponseMetadata;
}

// ============================================================================
// PAGINATION TYPES
// ============================================================================

/**
 * Pagination metadata for list responses.
 * Provides information about the current page and navigation.
 */
export interface PaginationMeta {
  /** Current page number (1-indexed) */
  page: number;
  /** Number of items per page */
  per_page: number;
  /** Total number of items available across all pages */
  total: number;
  /** Total number of pages */
  total_pages: number;
  /** Whether there is a next page available */
  has_next: boolean;
  /** Whether there is a previous page available */
  has_previous: boolean;
}

/**
 * Container for paginated data with pagination metadata.
 * 
 * @template T - The type of items in the list
 */
export interface PaginatedData<T> {
  /** List of items for current page */
  items: T[];
  /** Pagination metadata */
  pagination: PaginationMeta;
}

/**
 * Generic paginated response envelope.
 * Extends ApiResponse to include pagination metadata for list endpoints.
 * 
 * @template T - The type of items in the list
 * 
 * @example
 * // Paginated users
 * type PaginatedUsersResponse = PaginatedApiResponse<User>;
 * 
 * // Usage in component
 * const response: PaginatedApiResponse<User> = await api.get('/users');
 * const users = response.data.items;
 * const pagination = response.data.pagination;
 */
export interface PaginatedApiResponse<T> {
  /** Always true for successful responses */
  success: true;
  /** Paginated data with items and pagination metadata */
  data: PaginatedData<T>;
  /** Response metadata with timestamp and request tracking */
  metadata: ResponseMetadata;
}

// ============================================================================
// ERROR RESPONSE TYPES
// ============================================================================

/**
 * Error details included in error responses.
 * Matches backend error format from FASE 4 #2.
 */
export interface ApiErrorDetails {
  /** Error code for programmatic handling (e.g., "ERR_NOT_FOUND") */
  code: string;
  /** Human-readable error message */
  message: string;
  /** HTTP status code */
  status: number;
  /** Request ID for tracking */
  request_id: string;
  /** ISO 8601 timestamp of error */
  timestamp: string;
  /** Additional error context (only in development) */
  context?: Record<string, any>;
}

/**
 * Error response envelope.
 * All error responses follow this structure.
 * 
 * @example
 * // 404 Not Found
 * {
 *   "success": false,
 *   "error": {
 *     "code": "ERR_NOT_FOUND",
 *     "message": "Employee not found",
 *     "status": 404,
 *     "request_id": "uuid",
 *     "timestamp": "2025-11-22T10:30:00.000Z"
 *   }
 * }
 */
export interface ApiErrorResponse {
  /** Always false for error responses */
  success: false;
  /** Error details */
  error: ApiErrorDetails;
}

// ============================================================================
// UTILITY TYPES
// ============================================================================

/**
 * Union type representing any API response (success or error).
 * Useful for type guards and error handling.
 * 
 * @template T - The type of data in successful responses
 */
export type ApiResponseUnion<T> = ApiResponse<T> | ApiErrorResponse;

/**
 * Type guard to check if response is successful.
 * 
 * @param response - API response to check
 * @returns True if response is successful
 * 
 * @example
 * const response = await api.get('/users/1');
 * if (isSuccessResponse(response)) {
 *   console.log(response.data); // Type is T
 * } else {
 *   console.error(response.error); // Type is ApiErrorDetails
 * }
 */
export function isSuccessResponse<T>(
  response: ApiResponseUnion<T>
): response is ApiResponse<T> {
  return response.success === true;
}

/**
 * Type guard to check if response is an error.
 * 
 * @param response - API response to check
 * @returns True if response is an error
 */
export function isErrorResponse<T>(
  response: ApiResponseUnion<T>
): response is ApiErrorResponse {
  return response.success === false;
}

/**
 * Type guard to check if response is paginated.
 * 
 * @param response - API response to check
 * @returns True if response contains paginated data
 */
export function isPaginatedResponse<T>(
  response: ApiResponse<any>
): response is PaginatedApiResponse<T> {
  return (
    response.success === true &&
    typeof response.data === 'object' &&
    response.data !== null &&
    'items' in response.data &&
    'pagination' in response.data &&
    Array.isArray(response.data.items)
  );
}

// ============================================================================
// HELPER TYPES FOR COMMON PATTERNS
// ============================================================================

/**
 * Extract data type from ApiResponse.
 * Useful for type inference in hooks and utilities.
 * 
 * @example
 * type User = { id: number; name: string };
 * type UserResponse = ApiResponse<User>;
 * type UserData = ExtractApiData<UserResponse>; // User
 */
export type ExtractApiData<T extends ApiResponse<any>> = T['data'];

/**
 * Extract item type from PaginatedApiResponse.
 * 
 * @example
 * type UsersResponse = PaginatedApiResponse<User>;
 * type UserItem = ExtractPaginatedItem<UsersResponse>; // User
 */
export type ExtractPaginatedItem<T extends PaginatedApiResponse<any>> = 
  T['data']['items'][number];

// ============================================================================
// PAGINATION QUERY PARAMETERS
// ============================================================================

/**
 * Standard pagination query parameters.
 * Used in API calls for paginated endpoints.
 */
export interface PaginationParams {
  /** Page number (1-indexed, default: 1) */
  page?: number;
  /** Items per page (default: 20, max: 100) */
  per_page?: number;
  /** Sort field */
  sort_by?: string;
  /** Sort direction */
  sort_order?: 'asc' | 'desc';
  /** Search query */
  search?: string;
}

// ============================================================================
// RESPONSE HEADERS
// ============================================================================

/**
 * Standard response headers included by backend.
 */
export interface ApiResponseHeaders {
  /** Request ID (also in metadata) */
  'x-request-id': string;
  /** Total count (pagination) */
  'x-total-count'?: string;
  /** Current page (pagination) */
  'x-page'?: string;
  /** Items per page (pagination) */
  'x-per-page'?: string;
  /** Total pages (pagination) */
  'x-total-pages'?: string;
}

// ============================================================================
// EXPORTS
// ============================================================================

export type {
  // Main response types
  ApiResponse,
  PaginatedApiResponse,
  ApiErrorResponse,
  
  // Metadata types
  ResponseMetadata,
  PaginationMeta,
  PaginatedData,
  
  // Error types
  ApiErrorDetails,
  
  // Utility types
  ApiResponseUnion,
  ExtractApiData,
  ExtractPaginatedItem,
  
  // Parameters
  PaginationParams as StandardPaginationParams,
  
  // Headers
  ApiResponseHeaders,
};

export {
  // Type guards
  isSuccessResponse,
  isErrorResponse,
  isPaginatedResponse,
};

// ============================================================================
// USAGE EXAMPLES (for documentation)
// ============================================================================

/**
 * @example
 * // Example 1: Fetching a single user
 * async function getUser(id: number): Promise<ApiResponse<User>> {
 *   const response = await api.get<ApiResponse<User>>(`/users/${id}`);
 *   return response.data;
 * }
 * 
 * const userResponse = await getUser(1);
 * console.log(userResponse.data); // User object
 * console.log(userResponse.metadata.request_id); // Request tracking
 * 
 * 
 * @example
 * // Example 2: Fetching paginated list
 * async function getUsers(params: PaginationParams): Promise<PaginatedApiResponse<User>> {
 *   const response = await api.get<PaginatedApiResponse<User>>('/users', { params });
 *   return response.data;
 * }
 * 
 * const usersResponse = await getUsers({ page: 1, per_page: 20 });
 * const users = usersResponse.data.items; // User[]
 * const pagination = usersResponse.data.pagination; // PaginationMeta
 * console.log(`Page ${pagination.page} of ${pagination.total_pages}`);
 * 
 * 
 * @example
 * // Example 3: Error handling with type guards
 * async function fetchData(id: number) {
 *   try {
 *     const response = await api.get(`/data/${id}`);
 *     
 *     if (isSuccessResponse(response.data)) {
 *       // TypeScript knows this is ApiResponse<T>
 *       return response.data.data;
 *     } else {
 *       // TypeScript knows this is ApiErrorResponse
 *       console.error(response.data.error.message);
 *       throw new Error(response.data.error.message);
 *     }
 *   } catch (error) {
 *     // Handle network errors
 *     throw error;
 *   }
 * }
 * 
 * 
 * @example
 * // Example 4: React hook with new types
 * function useUser(id: number) {
 *   const [user, setUser] = useState<User | null>(null);
 *   const [loading, setLoading] = useState(true);
 *   const [error, setError] = useState<ApiErrorDetails | null>(null);
 *   
 *   useEffect(() => {
 *     api.get<ApiResponse<User>>(`/users/${id}`)
 *       .then(response => {
 *         if (isSuccessResponse(response.data)) {
 *           setUser(response.data.data);
 *         }
 *       })
 *       .catch(err => {
 *         if (err.response?.data && isErrorResponse(err.response.data)) {
 *           setError(err.response.data.error);
 *         }
 *       })
 *       .finally(() => setLoading(false));
 *   }, [id]);
 *   
 *   return { user, loading, error };
 * }
 */
