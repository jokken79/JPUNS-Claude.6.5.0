/**
 * Utilities Module
 *
 * Centralized barrel export for all general utility functions.
 * This module provides:
 * - General utilities (utils.ts)
 * - Font utilities (font-utils.ts)
 * - Loading utilities (loading-utils.ts)
 *
 * Usage:
 * ```typescript
 * import { cn, loadFont, showLoading } from '@/lib/utilities';
 * ```
 */

// General utility functions (cn, classNames, etc.)
export * from '../utils';

// Font loading and management
export * from '../font-utils';

// Loading states and utilities
export * from '../loading-utils';
