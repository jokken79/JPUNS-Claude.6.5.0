/**
 * API Module
 *
 * Centralized barrel export for all API-related utilities.
 * This module provides:
 * - Main API client (api.ts)
 * - Database service (database.ts)
 *
 * Usage:
 * ```typescript
 * import api, { databaseService } from '@/lib/api';
 * ```
 */

// Main axios API client with interceptors
export { default } from '../api';
export { default as api } from '../api';

// Database management service
export * from './database';
