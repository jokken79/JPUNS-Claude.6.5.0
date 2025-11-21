/**
 * Motion & Animations Module
 *
 * Centralized barrel export for all animation-related utilities.
 * This module provides:
 * - General animations (animations.ts)
 * - Form-specific animations (form-animations.ts)
 * - Route transitions (route-transitions.ts)
 * - View transitions (view-transitions.ts)
 *
 * Usage:
 * ```typescript
 * import { fadeIn, formAnimations, routeVariants } from '@/lib/motion';
 * ```
 */

// General animation variants and spring configs
export * from '../animations';

// Form-specific animations
export * from '../form-animations';

// Route transition utilities
export * from '../route-transitions';

// View transition API helpers
export * from '../view-transitions';
