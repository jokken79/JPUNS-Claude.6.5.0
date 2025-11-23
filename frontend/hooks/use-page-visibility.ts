'use client';

/**
 * @deprecated Consider using useCachedPageVisibility from './use-cached-page-visibility'
 * for better performance with localStorage caching.
 *
 * This hook still works but makes API calls on every render.
 * The cached version checks cache first and only calls API when needed.
 */

import { useState, useEffect } from 'react';
import api from '@/lib/api';

// Re-export cached versions as recommended alternatives
export {
  useCachedPageVisibility,
  useCachedAllPagesVisibility,
  useCachedCurrentPageVisibility,
  invalidateAllPageVisibilityCache,
} from './use-cached-page-visibility';

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

interface UsePageVisibilityReturn {
  isEnabled: boolean;
  loading: boolean;
  error: string | null;
  togglePage: () => Promise<void>;
  refresh: () => Promise<void>;
}

export function usePageVisibility(pageKey: string): UsePageVisibilityReturn {
  const [isEnabled, setIsEnabled] = useState(true);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchPageVisibility = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await api.get(`/admin/pages/${pageKey}`);
      setIsEnabled(response.data.is_enabled);
    } catch (err: any) {
      console.error('Error fetching page visibility:', err);
      setError(err.message || 'Failed to fetch page visibility');
      // Default to enabled if there's an error
      setIsEnabled(true);
    } finally {
      setLoading(false);
    }
  };

  const togglePage = async () => {
    try {
      setLoading(true);
      await api.post(`/admin/pages/${pageKey}/toggle`);
      // Refetch to get the updated state
      await fetchPageVisibility();
    } catch (err: any) {
      console.error('Error toggling page:', err);
      setError(err.message || 'Failed to toggle page');
    } finally {
      setLoading(false);
    }
  };

  const refresh = async () => {
    await fetchPageVisibility();
  };

  useEffect(() => {
    fetchPageVisibility();
  }, [pageKey]);

  return {
    isEnabled,
    loading,
    error,
    togglePage,
    refresh,
  };
}

// Hook to get all page visibility settings
export function useAllPagesVisibility() {
  const [pages, setPages] = useState<PageVisibility[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchAllPages = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await api.get('/admin/pages');
      setPages(response.data);
    } catch (err: any) {
      console.error('Error fetching all pages:', err);
      setError(err.message || 'Failed to fetch pages');
    } finally {
      setLoading(false);
    }
  };

  const updatePageVisibility = async (pageKey: string, isEnabled: boolean) => {
    try {
      await api.put(`/admin/pages/${pageKey}`, { is_enabled: isEnabled });
      // Update local state
      setPages(prev => prev.map(page =>
        page.page_key === pageKey
          ? { ...page, is_enabled: isEnabled }
          : page
      ));
    } catch (err: any) {
      console.error('Error updating page:', err);
      throw err;
    }
  };

  useEffect(() => {
    fetchAllPages();
  }, []);

  return {
    pages,
    loading,
    error,
    updatePageVisibility,
    refresh: fetchAllPages,
  };
}

// Hook to check if current page is enabled (auto-detects from URL)
export function useCurrentPageVisibility(): UsePageVisibilityReturn {
  const [pageKey, setPageKey] = useState<string>('');

  useEffect(() => {
    // Extract page key from current path
    const path = window.location.pathname;
    const segments = path.split('/').filter(Boolean);

    // Map common paths to page keys
    const pathToKeyMap: Record<string, string> = {
      'dashboard': 'dashboard',
      'candidates': 'candidates',
      'employees': 'employees',
      'factories': 'factories',
      'apartments': 'apartments',
      'timercards': 'timercards',
      'salary': 'salary',
      'requests': 'requests',
      'reports': 'reports',
      'design-system': 'design-system',
      'examples/forms': 'examples-forms',
      'support': 'support',
      'help': 'help',
      'privacy': 'privacy',
      'terms': 'terms',
    };

    const key = pathToKeyMap[segments[0]] || segments[0];
    setPageKey(key);
  }, []);

  const result = usePageVisibility(pageKey);

  return result;
}
