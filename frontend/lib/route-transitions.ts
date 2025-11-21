/**
 * Route Transition Configuration
 *
 * Defines transition types for different routes and navigation patterns.
 * Provides intelligent transition selection based on route hierarchy.
 */

export type TransitionVariant =
  | 'fade'
  | 'slide'
  | 'slideUp'
  | 'slideDown'
  | 'scale'
  | 'rotate'
  | 'blur'
  | 'reveal';

export type NavigationDirection = 'forward' | 'backward' | 'same-level';

/**
 * Route-specific transition configurations
 */
export const routeTransitions: Record<string, TransitionVariant> = {
  '/dashboard': 'fade',
  '/candidates': 'slide',
  '/candidates/new': 'slideUp',
  '/employees': 'slide',
  '/employees/new': 'slideUp',
  '/factories': 'slide',
  '/timercards': 'slide',
  '/salary': 'slide',
  '/requests': 'slide',
  '/settings': 'reveal',
  '/privacy': 'slideUp',
  '/terms': 'slideUp',
  '/support': 'slideUp',
};

/**
 * Route hierarchy for determining navigation direction
 */
const routeHierarchy: Record<string, number> = {
  '/': 0,
  '/login': 0,
  '/dashboard': 1,
  '/candidates': 2,
  '/candidates/new': 3,
  '/employees': 2,
  '/employees/new': 3,
  '/factories': 2,
  '/timercards': 2,
  '/salary': 2,
  '/requests': 2,
  '/settings': 2,
};

/**
 * Get the depth of a route path
 */
function getRouteDepth(path: string): number {
  // Remove trailing slash
  const cleanPath = path.replace(/\/$/, '');

  // Check if exact match exists in hierarchy
  if (routeHierarchy[cleanPath] !== undefined) {
    return routeHierarchy[cleanPath];
  }

  // For dynamic routes like /employees/123, count segments
  const segments = cleanPath.split('/').filter(Boolean);
  return segments.length;
}

/**
 * Determine navigation direction based on route paths
 */
export function getNavigationDirection(
  fromPath: string,
  toPath: string
): NavigationDirection {
  const fromDepth = getRouteDepth(fromPath);
  const toDepth = getRouteDepth(toPath);

  if (fromDepth < toDepth) return 'forward';
  if (fromDepth > toDepth) return 'backward';
  return 'same-level';
}

/**
 * Get the appropriate transition variant for a route
 */
export function getTransitionForRoute(
  path: string,
  fromPath?: string
): TransitionVariant {
  // Remove trailing slash and query params
  const cleanPath = path.split('?')[0].replace(/\/$/, '');

  // Check for exact match
  if (routeTransitions[cleanPath]) {
    return routeTransitions[cleanPath];
  }

  // Check for partial matches (for dynamic routes)
  for (const [routePattern, variant] of Object.entries(routeTransitions)) {
    if (cleanPath.startsWith(routePattern)) {
      return variant;
    }
  }

  // Determine transition based on navigation direction
  if (fromPath) {
    const direction = getNavigationDirection(fromPath, cleanPath);

    switch (direction) {
      case 'forward':
        return 'slideUp';
      case 'backward':
        return 'slideDown';
      default:
        return 'slide';
    }
  }

  // Default fallback
  return 'fade';
}

/**
 * Check if route is a detail page (has dynamic segment)
 */
export function isDetailPage(path: string): boolean {
  // Check if path contains a numeric segment (likely an ID)
  const segments = path.split('/').filter(Boolean);
  return segments.some(segment => /^\d+$/.test(segment));
}

/**
 * Check if route is a form page (new/edit)
 */
export function isFormPage(path: string): boolean {
  return path.includes('/new') || path.includes('/edit');
}

/**
 * Get parent route path
 */
export function getParentRoute(path: string): string {
  const cleanPath = path.replace(/\/$/, '');
  const segments = cleanPath.split('/').filter(Boolean);

  if (segments.length <= 1) {
    return '/dashboard';
  }

  segments.pop();
  return '/' + segments.join('/');
}

/**
 * Check if two routes are siblings (same parent)
 */
export function areSiblingRoutes(path1: string, path2: string): boolean {
  return getParentRoute(path1) === getParentRoute(path2);
}
