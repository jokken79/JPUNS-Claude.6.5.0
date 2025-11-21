/**
 * Route Change Hook
 *
 * Track route changes, navigation direction, and provide utilities
 * for handling route transitions in Next.js App Router.
 */

'use client';

import { usePathname, useSearchParams } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';
import { getNavigationDirection, type NavigationDirection } from '@/lib/route-transitions';

export interface RouteChangeState {
  isNavigating: boolean;
  previousPath: string | null;
  currentPath: string;
  direction: NavigationDirection;
}

export interface UseRouteChangeOptions {
  onRouteChangeStart?: (path: string) => void;
  onRouteChangeComplete?: (path: string) => void;
  enableScrollRestoration?: boolean;
}

/**
 * Hook to track and manage route changes
 */
export function useRouteChange(options: UseRouteChangeOptions = {}) {
  const {
    onRouteChangeStart,
    onRouteChangeComplete,
    enableScrollRestoration = true,
  } = options;

  const pathname = usePathname();
  const searchParams = useSearchParams();

  const [isNavigating, setIsNavigating] = useState(false);
  const [previousPath, setPreviousPath] = useState<string | null>(null);
  const [direction, setDirection] = useState<NavigationDirection>('forward');

  const previousPathRef = useRef<string | null>(null);
  const scrollPositionsRef = useRef<Map<string, number>>(new Map());
  const isInitialMount = useRef(true);

  // Combine pathname and search params for full path
  const fullPath = pathname + (searchParams.toString() ? `?${searchParams.toString()}` : '');

  useEffect(() => {
    // Skip on initial mount
    if (isInitialMount.current) {
      isInitialMount.current = false;
      previousPathRef.current = fullPath;
      return;
    }

    // Route change detected
    if (previousPathRef.current && previousPathRef.current !== fullPath) {
      // Start navigation
      setIsNavigating(true);
      setPreviousPath(previousPathRef.current);

      // Determine direction
      const navDirection = getNavigationDirection(previousPathRef.current, fullPath);
      setDirection(navDirection);

      // Call start callback
      onRouteChangeStart?.(fullPath);

      // Save scroll position of previous route
      if (enableScrollRestoration && previousPathRef.current) {
        scrollPositionsRef.current.set(
          previousPathRef.current,
          window.scrollY
        );
      }

      // Restore scroll position or scroll to top
      const savedPosition = scrollPositionsRef.current.get(fullPath);
      if (enableScrollRestoration && savedPosition !== undefined) {
        // Restore previous position
        window.scrollTo(0, savedPosition);
      } else {
        // Scroll to top for new pages
        window.scrollTo(0, 0);
      }

      // Complete navigation after a short delay
      const timer = setTimeout(() => {
        setIsNavigating(false);
        onRouteChangeComplete?.(fullPath);
      }, 100);

      // Update ref
      previousPathRef.current = fullPath;

      return () => clearTimeout(timer);
    }
  }, [fullPath, onRouteChangeStart, onRouteChangeComplete, enableScrollRestoration]);

  return {
    isNavigating,
    previousPath,
    currentPath: fullPath,
    direction,
  };
}

/**
 * Hook to listen for route changes with callback
 */
export function useRouteChangeListener(
  callback: (path: string, previousPath: string | null) => void
) {
  const pathname = usePathname();
  const previousPathRef = useRef<string | null>(null);

  useEffect(() => {
    if (previousPathRef.current !== pathname) {
      callback(pathname, previousPathRef.current);
      previousPathRef.current = pathname;
    }
  }, [pathname, callback]);
}

/**
 * Hook to track navigation loading state
 */
export function useNavigationLoading() {
  const [isLoading, setIsLoading] = useState(false);
  const pathname = usePathname();
  const previousPathRef = useRef(pathname);

  useEffect(() => {
    if (previousPathRef.current !== pathname) {
      setIsLoading(true);
      previousPathRef.current = pathname;

      const timer = setTimeout(() => {
        setIsLoading(false);
      }, 300);

      return () => clearTimeout(timer);
    }
  }, [pathname]);

  return isLoading;
}
