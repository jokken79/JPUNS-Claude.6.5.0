'use client';

/**
 * @deprecated Consider using useCachedPagePermission from './use-cached-page-permission'
 * for better performance with localStorage caching.
 *
 * This hook still works but makes API calls on every render.
 * The cached version checks cache first and only calls API when needed.
 */

import { useState, useEffect } from 'react';
import { useAuthStore } from '@/stores/auth-store';
import api from '@/lib/api';

// Re-export cached versions as recommended alternatives
export {
  useCachedPagePermission,
  useCachedAllPagesPermission,
  useCachedUserPermissions,
  invalidateCurrentUserPermissions,
  invalidateRolePermissions,
} from './use-cached-page-permission';

interface PagePermission {
  page_key: string;
  is_enabled: boolean;
}

export function usePagePermission(pageKey: string) {
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(true);
  const user = useAuthStore((state) => state.user);
  const isHydrated = useAuthStore((state) => state.isHydrated);

  useEffect(() => {
    const checkPermission = async () => {
      // Wait for auth hydration before checking permissions
      if (!isHydrated) {
        setLoading(true);
        return;
      }

      if (!user) {
        setHasPermission(false);
        setLoading(false);
        return;
      }

      try {
        // In development with mock user, grant all permissions to admin
        if (process.env.NODE_ENV === 'development' && user.role === 'ADMIN') {
          setHasPermission(true);
          setLoading(false);
          return;
        }

        const response = await api.get(`/role-permissions/check/${user.role}/${pageKey}`);
        setHasPermission(response.data.has_access);
      } catch (error) {
        console.error('Error checking permission:', error);
        // If there's an error, deny permission for safety
        setHasPermission(false);
      } finally {
        setLoading(false);
      }
    };

    checkPermission();
  }, [user, pageKey, isHydrated]);

  return { hasPermission, loading };
}
