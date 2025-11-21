'use client';

import { useState, useEffect, useCallback } from 'react';
import { useAuthStore } from '@/stores/auth-store';
import api from '@/lib/api';
import {
  getPermissionCache,
  setPermissionCache,
  buildRolePermissionKey,
  buildRoleAllPagesKey,
  buildUserPermissionsKey,
  invalidateRoleCache,
  invalidateUserCache,
  DEFAULT_CACHE_TTL_MS,
} from '@/lib/cache/permission-cache';

// =============================================================================
// TYPES
// =============================================================================

interface PagePermission {
  page_key: string;
  is_enabled: boolean;
}

interface RolePermission {
  has_access: boolean;
  role: string;
  page_key: string;
}

interface UseCachedPagePermissionReturn {
  hasPermission: boolean | null;
  loading: boolean;
  refresh: (forceRefresh?: boolean) => Promise<void>;
  cacheHit: boolean;
  cacheExpiresIn: number;
}

// =============================================================================
// SINGLE PAGE PERMISSION HOOK (with cache)
// =============================================================================

/**
 * Hook to check if user has permission to access a specific page with caching
 *
 * Features:
 * - Checks cache first before making API call
 * - Automatically handles user role changes
 * - Provides cache hit/miss telemetry
 * - Supports force refresh to bypass cache
 * - Development mode shortcut for admin users
 *
 * @param pageKey - The page key to check permission for
 * @param ttlMs - Cache TTL in milliseconds (default: 5 minutes)
 * @returns Permission status with cache metadata
 */
export function useCachedPagePermission(
  pageKey: string,
  ttlMs: number = DEFAULT_CACHE_TTL_MS
): UseCachedPagePermissionReturn {
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(true);
  const [cacheHit, setCacheHit] = useState(false);
  const [cacheExpiresIn, setCacheExpiresIn] = useState(0);
  const user = useAuthStore((state) => state.user);
  const isHydrated = useAuthStore((state) => state.isHydrated);

  const cacheKey = user?.role
    ? buildRolePermissionKey(user.role, pageKey)
    : '';

  /**
   * Check permission from cache or API
   */
  const checkPermission = useCallback(
    async (forceRefresh = false) => {
      // Wait for auth hydration before checking permissions
      if (!isHydrated) {
        setLoading(true);
        return;
      }

      if (!user) {
        setHasPermission(false);
        setLoading(false);
        setCacheHit(false);
        return;
      }

      try {
        setLoading(true);

        // Development mode shortcut for admin
        if (process.env.NODE_ENV === 'development' && user.role === 'ADMIN') {
          setHasPermission(true);
          setLoading(false);
          setCacheHit(false);
          return;
        }

        // Check cache first (unless force refresh)
        if (!forceRefresh && cacheKey) {
          const cached = getPermissionCache<RolePermission>(cacheKey);

          if (cached !== null) {
            setHasPermission(cached.has_access);
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
        const response = await api.get(
          `/role-permissions/check/${user.role}/${pageKey}`
        );
        const data = response.data;

        setHasPermission(data.has_access);

        // Store in cache
        if (cacheKey) {
          const cacheData: RolePermission = {
            has_access: data.has_access,
            role: user.role,
            page_key: pageKey,
          };
          setPermissionCache(cacheKey, cacheData, ttlMs);
          setCacheExpiresIn(ttlMs);
        }
      } catch (error) {
        console.error('Error checking permission:', error);
        // If there's an error, deny permission for safety
        setHasPermission(false);
      } finally {
        setLoading(false);
      }
    },
    [user, pageKey, cacheKey, ttlMs, isHydrated]
  );

  /**
   * Refresh permission
   */
  const refresh = useCallback(
    async (forceRefresh = false) => {
      await checkPermission(forceRefresh);
    },
    [checkPermission]
  );

  useEffect(() => {
    checkPermission();
  }, [checkPermission]);

  return {
    hasPermission,
    loading,
    refresh,
    cacheHit,
    cacheExpiresIn,
  };
}

// =============================================================================
// ALL PAGES PERMISSION HOOK (with cache)
// =============================================================================

interface UseCachedAllPagesPermissionReturn {
  permissions: Record<string, boolean>;
  loading: boolean;
  refresh: (forceRefresh?: boolean) => Promise<void>;
  hasPermission: (pageKey: string) => boolean;
  cacheHit: boolean;
  cacheExpiresIn: number;
}

/**
 * Hook to get all page permissions for current user's role with caching
 *
 * Useful for bulk permission checks without making multiple API calls
 *
 * @param ttlMs - Cache TTL in milliseconds (default: 5 minutes)
 * @returns All permissions for user's role with cache metadata
 */
export function useCachedAllPagesPermission(
  ttlMs: number = DEFAULT_CACHE_TTL_MS
): UseCachedAllPagesPermissionReturn {
  const [permissions, setPermissions] = useState<Record<string, boolean>>({});
  const [loading, setLoading] = useState(true);
  const [cacheHit, setCacheHit] = useState(false);
  const [cacheExpiresIn, setCacheExpiresIn] = useState(0);
  const user = useAuthStore((state) => state.user);
  const isHydrated = useAuthStore((state) => state.isHydrated);

  const cacheKey = user?.role ? buildRoleAllPagesKey(user.role) : '';

  /**
   * Fetch all permissions from cache or API
   */
  const fetchAllPermissions = useCallback(
    async (forceRefresh = false) => {
      // Wait for auth hydration before fetching permissions
      if (!isHydrated) {
        setLoading(true);
        return;
      }

      if (!user) {
        setPermissions({});
        setLoading(false);
        setCacheHit(false);
        return;
      }

      try {
        setLoading(true);

        // Development mode shortcut for admin
        if (process.env.NODE_ENV === 'development' && user.role === 'ADMIN') {
          // Grant all permissions in dev mode for admin
          setPermissions({});
          setLoading(false);
          setCacheHit(false);
          return;
        }

        // Check cache first (unless force refresh)
        if (!forceRefresh && cacheKey) {
          const cached = getPermissionCache<Record<string, boolean>>(cacheKey);

          if (cached !== null) {
            setPermissions(cached);
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
        const response = await api.get(`/role-permissions/role/${user.role}`);
        const data = response.data;

        // Convert array to record
        const permissionsMap: Record<string, boolean> = {};
        if (Array.isArray(data)) {
          data.forEach((perm: PagePermission) => {
            permissionsMap[perm.page_key] = perm.is_enabled;
          });
        }

        setPermissions(permissionsMap);

        // Store in cache
        if (cacheKey) {
          setPermissionCache(cacheKey, permissionsMap, ttlMs);
          setCacheExpiresIn(ttlMs);
        }
      } catch (error) {
        console.error('Error fetching all permissions:', error);
        setPermissions({});
      } finally {
        setLoading(false);
      }
    },
    [user, cacheKey, ttlMs, isHydrated]
  );

  /**
   * Check if user has permission for specific page
   */
  const hasPermission = useCallback(
    (pageKey: string): boolean => {
      // In development, admin has all permissions
      if (
        process.env.NODE_ENV === 'development' &&
        user?.role === 'ADMIN'
      ) {
        return true;
      }

      return permissions[pageKey] ?? false;
    },
    [permissions, user]
  );

  /**
   * Refresh all permissions
   */
  const refresh = useCallback(
    async (forceRefresh = false) => {
      await fetchAllPermissions(forceRefresh);
    },
    [fetchAllPermissions]
  );

  useEffect(() => {
    fetchAllPermissions();
  }, [fetchAllPermissions]);

  return {
    permissions,
    loading,
    refresh,
    hasPermission,
    cacheHit,
    cacheExpiresIn,
  };
}

// =============================================================================
// USER PERMISSIONS HOOK (with cache)
// =============================================================================

interface UserPermissions {
  userId: number;
  role: string;
  pagePermissions: Record<string, boolean>;
  customPermissions?: Record<string, any>;
}

interface UseCachedUserPermissionsReturn {
  permissions: UserPermissions | null;
  loading: boolean;
  refresh: (forceRefresh?: boolean) => Promise<void>;
  hasPageAccess: (pageKey: string) => boolean;
  cacheHit: boolean;
  cacheExpiresIn: number;
}

/**
 * Hook to get complete user permissions with caching
 *
 * Combines role-based permissions with any user-specific overrides
 *
 * @param userId - User ID (defaults to current user)
 * @param ttlMs - Cache TTL in milliseconds (default: 5 minutes)
 * @returns Complete user permissions with cache metadata
 */
export function useCachedUserPermissions(
  userId?: number,
  ttlMs: number = DEFAULT_CACHE_TTL_MS
): UseCachedUserPermissionsReturn {
  const [permissions, setPermissions] = useState<UserPermissions | null>(null);
  const [loading, setLoading] = useState(true);
  const [cacheHit, setCacheHit] = useState(false);
  const [cacheExpiresIn, setCacheExpiresIn] = useState(0);
  const currentUser = useAuthStore((state) => state.user);
  const isHydrated = useAuthStore((state) => state.isHydrated);

  const targetUserId = userId ?? currentUser?.id;
  const cacheKey = targetUserId
    ? buildUserPermissionsKey(targetUserId)
    : '';

  /**
   * Fetch user permissions from cache or API
   */
  const fetchUserPermissions = useCallback(
    async (forceRefresh = false) => {
      // Wait for auth hydration before fetching permissions
      if (!isHydrated) {
        setLoading(true);
        return;
      }

      if (!targetUserId || !currentUser) {
        setPermissions(null);
        setLoading(false);
        setCacheHit(false);
        return;
      }

      try {
        setLoading(true);

        // Check cache first (unless force refresh)
        if (!forceRefresh && cacheKey) {
          const cached = getPermissionCache<UserPermissions>(cacheKey);

          if (cached !== null) {
            setPermissions(cached);
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

        // Fetch role permissions
        const rolePermsResponse = await api.get(
          `/role-permissions/role/${currentUser.role}`
        );
        const rolePerms = rolePermsResponse.data;

        // Convert to record
        const pagePermissions: Record<string, boolean> = {};
        if (Array.isArray(rolePerms)) {
          rolePerms.forEach((perm: PagePermission) => {
            pagePermissions[perm.page_key] = perm.is_enabled;
          });
        }

        const userPermissions: UserPermissions = {
          userId: targetUserId,
          role: currentUser.role || '',
          pagePermissions,
        };

        setPermissions(userPermissions);

        // Store in cache
        if (cacheKey) {
          setPermissionCache(cacheKey, userPermissions, ttlMs);
          setCacheExpiresIn(ttlMs);
        }
      } catch (error) {
        console.error('Error fetching user permissions:', error);
        setPermissions(null);
      } finally {
        setLoading(false);
      }
    },
    [targetUserId, currentUser, cacheKey, ttlMs, isHydrated]
  );

  /**
   * Check if user has access to specific page
   */
  const hasPageAccess = useCallback(
    (pageKey: string): boolean => {
      if (!permissions) return false;

      // Development mode shortcut
      if (
        process.env.NODE_ENV === 'development' &&
        permissions.role === 'ADMIN'
      ) {
        return true;
      }

      return permissions.pagePermissions[pageKey] ?? false;
    },
    [permissions]
  );

  /**
   * Refresh user permissions
   */
  const refresh = useCallback(
    async (forceRefresh = false) => {
      await fetchUserPermissions(forceRefresh);
    },
    [fetchUserPermissions]
  );

  useEffect(() => {
    fetchUserPermissions();
  }, [fetchUserPermissions]);

  return {
    permissions,
    loading,
    refresh,
    hasPageAccess,
    cacheHit,
    cacheExpiresIn,
  };
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
 * Utility function to invalidate all permission caches for current user
 */
export function invalidateCurrentUserPermissions(): void {
  const user = useAuthStore.getState().user;

  if (user) {
    // Invalidate role-based caches
    if (user.role) {
      invalidateRoleCache(user.role);
    }

    // Invalidate user-specific caches
    invalidateUserCache(user.id);
  }
}

/**
 * Utility function to invalidate permission caches for specific role
 */
export function invalidateRolePermissions(role: string): void {
  invalidateRoleCache(role);
}
