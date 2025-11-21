'use client';

import { useState, useEffect, useCallback } from 'react';
import api from '@/lib/api';
import {
  getPermissionCache,
  setPermissionCache,
  buildPageVisibilityKey,
  buildAllPagesVisibilityKey,
  clearPermissionCache,
  DEFAULT_CACHE_TTL_MS,
  invalidatePageCache,
} from '@/lib/cache/permission-cache';

// =============================================================================
// TYPES
// =============================================================================

interface PageVisibility {
  id: number;
  page_key: string;
  page_name: string;
  page_name_en: string | null;
  is_enabled: boolean;
  path: string;
  description: string | null;
  disabled_message: string | null;
  last_toggled_by: number | null;
  last_toggled_at: string | null;
  updated_at: string;
}

interface UseCachedPageVisibilityReturn {
  isEnabled: boolean;
  loading: boolean;
  error: string | null;
  togglePage: () => Promise<void>;
  refresh: (forceRefresh?: boolean) => Promise<void>;
  cacheHit: boolean; // Indicates if data came from cache
  cacheExpiresIn: number; // Milliseconds until cache expires
}

interface UseCachedAllPagesVisibilityReturn {
  pages: PageVisibility[];
  loading: boolean;
  error: string | null;
  updatePageVisibility: (pageKey: string, isEnabled: boolean) => Promise<void>;
  refresh: (forceRefresh?: boolean) => Promise<void>;
  cacheHit: boolean;
  cacheExpiresIn: number;
}

// =============================================================================
// SINGLE PAGE VISIBILITY HOOK (with cache)
// =============================================================================

/**
 * Hook to check visibility status of a single page with caching
 *
 * Features:
 * - Checks cache first before making API call
 * - Automatically updates cache on changes
 * - Provides cache hit/miss telemetry
 * - Supports force refresh to bypass cache
 *
 * @param pageKey - The page key to check
 * @param ttlMs - Cache TTL in milliseconds (default: 5 minutes)
 * @returns Page visibility data with cache metadata
 */
export function useCachedPageVisibility(
  pageKey: string,
  ttlMs: number = DEFAULT_CACHE_TTL_MS
): UseCachedPageVisibilityReturn {
  const [isEnabled, setIsEnabled] = useState(true);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [cacheHit, setCacheHit] = useState(false);
  const [cacheExpiresIn, setCacheExpiresIn] = useState(0);

  const cacheKey = buildPageVisibilityKey(pageKey);

  /**
   * Fetch page visibility from API and update cache
   */
  const fetchPageVisibility = useCallback(
    async (forceRefresh = false) => {
      try {
        setLoading(true);
        setError(null);

        // Check cache first (unless force refresh)
        if (!forceRefresh) {
          const cached = getPermissionCache<{ is_enabled: boolean }>(cacheKey);

          if (cached !== null) {
            setIsEnabled(cached.is_enabled);
            setCacheHit(true);
            setLoading(false);

            // Update cache expiration info
            const expiresIn = getCacheExpirationTime(cacheKey);
            setCacheExpiresIn(expiresIn);

            return;
          }
        }

        // Cache miss or force refresh - fetch from API
        setCacheHit(false);
        const response = await api.get(`/admin/pages/${pageKey}`);
        const data = response.data;

        setIsEnabled(data.is_enabled);

        // Store in cache
        setPermissionCache(cacheKey, { is_enabled: data.is_enabled }, ttlMs);
        setCacheExpiresIn(ttlMs);
      } catch (err: any) {
        console.error('Error fetching page visibility:', err);
        setError(err.message || 'Failed to fetch page visibility');
        // Default to enabled if there's an error
        setIsEnabled(true);
      } finally {
        setLoading(false);
      }
    },
    [pageKey, cacheKey, ttlMs]
  );

  /**
   * Toggle page visibility
   */
  const togglePage = useCallback(async () => {
    try {
      setLoading(true);
      await api.post(`/admin/pages/${pageKey}/toggle`);

      // Invalidate cache for this page
      invalidatePageCache(pageKey);

      // Refetch to get the updated state
      await fetchPageVisibility(true);
    } catch (err: any) {
      console.error('Error toggling page:', err);
      setError(err.message || 'Failed to toggle page');
    } finally {
      setLoading(false);
    }
  }, [pageKey, fetchPageVisibility]);

  /**
   * Refresh page visibility
   */
  const refresh = useCallback(
    async (forceRefresh = false) => {
      await fetchPageVisibility(forceRefresh);
    },
    [fetchPageVisibility]
  );

  useEffect(() => {
    fetchPageVisibility();
  }, [fetchPageVisibility]);

  return {
    isEnabled,
    loading,
    error,
    togglePage,
    refresh,
    cacheHit,
    cacheExpiresIn,
  };
}

// =============================================================================
// ALL PAGES VISIBILITY HOOK (with cache)
// =============================================================================

/**
 * Hook to get all page visibility settings with caching
 *
 * @param ttlMs - Cache TTL in milliseconds (default: 5 minutes)
 * @returns All pages visibility data with cache metadata
 */
export function useCachedAllPagesVisibility(
  ttlMs: number = DEFAULT_CACHE_TTL_MS
): UseCachedAllPagesVisibilityReturn {
  const [pages, setPages] = useState<PageVisibility[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [cacheHit, setCacheHit] = useState(false);
  const [cacheExpiresIn, setCacheExpiresIn] = useState(0);

  const cacheKey = buildAllPagesVisibilityKey();

  /**
   * Fetch all pages from API and update cache
   */
  const fetchAllPages = useCallback(
    async (forceRefresh = false) => {
      try {
        setLoading(true);
        setError(null);

        // Check cache first (unless force refresh)
        if (!forceRefresh) {
          const cached = getPermissionCache<PageVisibility[]>(cacheKey);

          if (cached !== null) {
            setPages(cached);
            setCacheHit(true);
            setLoading(false);

            // Update cache expiration info
            const expiresIn = getCacheExpirationTime(cacheKey);
            setCacheExpiresIn(expiresIn);

            return;
          }
        }

        // Cache miss or force refresh - fetch from API
        setCacheHit(false);
        const response = await api.get('/admin/pages');
        const data = response.data;

        setPages(data);

        // Store in cache
        setPermissionCache(cacheKey, data, ttlMs);
        setCacheExpiresIn(ttlMs);
      } catch (err: any) {
        console.error('Error fetching all pages:', err);
        setError(err.message || 'Failed to fetch pages');
      } finally {
        setLoading(false);
      }
    },
    [cacheKey, ttlMs]
  );

  /**
   * Update page visibility and invalidate cache
   */
  const updatePageVisibility = useCallback(
    async (pageKey: string, isEnabled: boolean) => {
      try {
        await api.put(`/admin/pages/${pageKey}`, { is_enabled: isEnabled });

        // Update local state
        setPages((prev) =>
          prev.map((page) =>
            page.page_key === pageKey ? { ...page, is_enabled: isEnabled } : page
          )
        );

        // Invalidate caches
        invalidatePageCache(pageKey);
        clearPermissionCache(cacheKey); // Clear all pages cache

        // Update cache with new data
        const updatedPages = pages.map((page) =>
          page.page_key === pageKey ? { ...page, is_enabled: isEnabled } : page
        );
        setPermissionCache(cacheKey, updatedPages, ttlMs);
      } catch (err: any) {
        console.error('Error updating page:', err);
        throw err;
      }
    },
    [cacheKey, pages, ttlMs]
  );

  /**
   * Refresh all pages
   */
  const refresh = useCallback(
    async (forceRefresh = false) => {
      await fetchAllPages(forceRefresh);
    },
    [fetchAllPages]
  );

  useEffect(() => {
    fetchAllPages();
  }, [fetchAllPages]);

  return {
    pages,
    loading,
    error,
    updatePageVisibility,
    refresh,
    cacheHit,
    cacheExpiresIn,
  };
}

// =============================================================================
// CURRENT PAGE VISIBILITY HOOK (with cache)
// =============================================================================

/**
 * Hook to check if current page is enabled (auto-detects from URL) with caching
 *
 * @param ttlMs - Cache TTL in milliseconds (default: 5 minutes)
 * @returns Current page visibility data with cache metadata
 */
export function useCachedCurrentPageVisibility(
  ttlMs: number = DEFAULT_CACHE_TTL_MS
): UseCachedPageVisibilityReturn {
  const [pageKey, setPageKey] = useState<string>('');

  useEffect(() => {
    // Extract page key from current path
    const path = window.location.pathname;
    const segments = path.split('/').filter(Boolean);

    // Map common paths to page keys
    const pathToKeyMap: Record<string, string> = {
      dashboard: 'dashboard',
      candidates: 'candidates',
      employees: 'employees',
      factories: 'factories',
      apartments: 'apartments',
      timercards: 'timercards',
      salary: 'salary',
      requests: 'requests',
      reports: 'reports',
      'design-system': 'design-system',
      'examples/forms': 'examples-forms',
      support: 'support',
      help: 'help',
      privacy: 'privacy',
      terms: 'terms',
    };

    const key = pathToKeyMap[segments[0]] || segments[0];
    setPageKey(key);
  }, []);

  return useCachedPageVisibility(pageKey, ttlMs);
}

// =============================================================================
// UTILITY FUNCTIONS
// =============================================================================

/**
 * Get cache expiration time in milliseconds
 */
function getCacheExpirationTime(cacheKey: string): number {
  if (typeof window === 'undefined') return 0;

  try {
    const cached = localStorage.getItem(cacheKey);
    if (!cached) return 0;

    const cacheEntry = JSON.parse(cached);
    const now = Date.now();
    const remaining = cacheEntry.expiresAt - now;

    return remaining > 0 ? remaining : 0;
  } catch {
    return 0;
  }
}

/**
 * Utility function to invalidate all page visibility caches
 * Useful when admin updates multiple pages or settings
 */
export function invalidateAllPageVisibilityCache(): void {
  clearPermissionCache(buildAllPagesVisibilityKey());
}
