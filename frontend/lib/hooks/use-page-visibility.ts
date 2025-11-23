import { useEffect, useState } from 'react';
import axiosInstance from '@/lib/api';

export interface PageVisibility {
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
}

interface UsePageVisibilityReturn {
  pages: PageVisibility[];
  loading: boolean;
  error: string | null;
  getPageStatus: (pageKey: string) => PageVisibility | undefined;
  togglePageVisibility: (pageKey: string, isEnabled: boolean, message?: string) => Promise<void>;
}

export function usePageVisibility(): UsePageVisibilityReturn {
  const [pages, setPages] = useState<PageVisibility[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch all page visibility settings
  const fetchPages = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await axiosInstance.get('/pages/visibility');
      setPages(response.data);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch page visibility');
      console.error('Error fetching page visibility:', err);
    } finally {
      setLoading(false);
    }
  };

  // Initial fetch
  useEffect(() => {
    fetchPages();
  }, []);

  // Get status of a specific page
  const getPageStatus = (pageKey: string): PageVisibility | undefined => {
    return pages.find(p => p.page_key === pageKey);
  };

  // Toggle page visibility
  const togglePageVisibility = async (pageKey: string, isEnabled: boolean, message?: string) => {
    try {
      setError(null);
      await axiosInstance.put(`/pages/visibility/${pageKey}`, {
        is_enabled: isEnabled,
        disabled_message: message,
      });
      // Refresh pages list
      await fetchPages();
    } catch (err: any) {
      const errorMsg = err.response?.data?.detail || err.message || 'Failed to toggle page visibility';
      setError(errorMsg);
      throw new Error(errorMsg);
    }
  };

  return {
    pages,
    loading,
    error,
    getPageStatus,
    togglePageVisibility,
  };
}
