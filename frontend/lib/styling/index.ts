/**
 * Styling Utilities Module
 *
 * Centralized barrel export for all styling-related utilities.
 * This module provides:
 * - Color manipulation utilities (color-utils.ts)
 * - CSS export functionality (css-export.ts)
 * - Preset combinations (preset-combinations.ts)
 *
 * Usage:
 * ```typescript
 * import { hexToHSL, exportToCSS, presetCombinations } from '@/lib/styling';
 * ```
 */

// Color manipulation (hex to HSL, color validation, etc.)
export * from '../color-utils';

// CSS export utilities (export themes/templates as CSS)
export * from '../css-export';

// Preset theme+template combinations
export * from '../preset-combinations';
