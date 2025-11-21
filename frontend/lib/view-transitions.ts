/**
 * View Transitions API Support
 *
 * Progressive enhancement for browsers that support the native View Transitions API.
 * Falls back to Framer Motion for unsupported browsers.
 *
 * @see https://developer.mozilla.org/en-US/docs/Web/API/View_Transitions_API
 */

/**
 * Check if View Transitions API is supported
 */
export function isViewTransitionsSupported(): boolean {
  if (typeof document === 'undefined') return false;
  return 'startViewTransition' in document;
}

/**
 * Wrapper for View Transitions API with fallback
 */
export async function withViewTransition(
  updateCallback: () => void | Promise<void>
): Promise<void> {
  // Check if API is supported
  if (!isViewTransitionsSupported()) {
    // Fallback: just run the callback
    await updateCallback();
    return;
  }

  try {
    // Use native View Transitions API
    const transition = (document as any).startViewTransition(updateCallback);
    await transition.finished;
  } catch (error) {
    console.error('View transition failed:', error);
    // Fallback on error
    await updateCallback();
  }
}

/**
 * Create a named view transition (for shared element animations)
 */
export function createNamedTransition(name: string): string {
  return `view-transition-name: ${name}`;
}

/**
 * View transition class names for CSS animations
 */
export const viewTransitionClasses = {
  root: 'view-transition',
  old: 'view-transition-old',
  new: 'view-transition-new',
  groupWrapper: 'view-transition-group-wrapper',
  imageWrapper: 'view-transition-image-wrapper',
} as const;

/**
 * Utility to add view transition name to element
 */
export function addViewTransitionName(
  element: HTMLElement | null,
  name: string
): void {
  if (!element) return;
  element.style.viewTransitionName = name;
}

/**
 * Utility to remove view transition name from element
 */
export function removeViewTransitionName(element: HTMLElement | null): void {
  if (!element) return;
  element.style.viewTransitionName = '';
}

/**
 * Prefetch and prepare for page transition
 */
export function preparePageTransition(href: string): void {
  // Prefetch the route
  const link = document.createElement('link');
  link.rel = 'prefetch';
  link.href = href;
  document.head.appendChild(link);
}

/**
 * Get transition duration from CSS
 */
export function getTransitionDuration(element: HTMLElement): number {
  const styles = window.getComputedStyle(element);
  const duration = styles.transitionDuration || '0s';

  // Parse duration (e.g., "0.3s" -> 300ms)
  const match = duration.match(/^([\d.]+)(s|ms)$/);
  if (!match) return 0;

  const value = parseFloat(match[1]);
  const unit = match[2];

  return unit === 's' ? value * 1000 : value;
}
