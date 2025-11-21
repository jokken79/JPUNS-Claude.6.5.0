'use client';

/**
 * Permission Cache System
 *
 * Provides localStorage-based caching for permission and page visibility data
 * with TTL (Time-To-Live) support to reduce unnecessary API calls.
 *
 * Cache Key Patterns:
 * - perm:page:{pageKey}              - Single page visibility
 * - perm:pages:all                   - All pages visibility
 * - perm:role:{roleKey}:{pageKey}    - Single role permission
 * - perm:role:{roleKey}:all          - All pages for role
 * - perm:user:{userId}:permissions   - User's combined permissions
 */

// =============================================================================
// TYPES
// =============================================================================

export type CacheKey = string;

export interface PermissionCacheData<T = any> {
  data: T;
  expiresAt: number; // Unix timestamp in milliseconds
  createdAt: number; // Unix timestamp in milliseconds
}

export interface CacheStats {
  key: string;
  size: number; // Size in bytes (approximate)
  expiresAt: number;
  createdAt: number;
  ttlRemaining: number; // Milliseconds remaining
  isExpired: boolean;
}

// =============================================================================
// CONSTANTS
// =============================================================================

/**
 * Default TTL for permission cache entries
 * Default: 5 minutes (300000ms)
 */
export const DEFAULT_CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes

/**
 * Cache key prefix to avoid collisions with other localStorage data
 */
const CACHE_KEY_PREFIX = 'perm_cache:';

/**
 * Metadata key for tracking all cache entries
 */
const CACHE_METADATA_KEY = 'perm_cache_metadata';

// =============================================================================
// CACHE KEY BUILDERS
// =============================================================================

/**
 * Build cache key for single page visibility
 */
export const buildPageVisibilityKey = (pageKey: string): CacheKey => {
  return `${CACHE_KEY_PREFIX}page:${pageKey}`;
};

/**
 * Build cache key for all pages visibility
 */
export const buildAllPagesVisibilityKey = (): CacheKey => {
  return `${CACHE_KEY_PREFIX}pages:all`;
};

/**
 * Build cache key for role permission on specific page
 */
export const buildRolePermissionKey = (role: string, pageKey: string): CacheKey => {
  return `${CACHE_KEY_PREFIX}role:${role}:${pageKey}`;
};

/**
 * Build cache key for all pages for specific role
 */
export const buildRoleAllPagesKey = (role: string): CacheKey => {
  return `${CACHE_KEY_PREFIX}role:${role}:all`;
};

/**
 * Build cache key for user permissions
 */
export const buildUserPermissionsKey = (userId: number | string): CacheKey => {
  return `${CACHE_KEY_PREFIX}user:${userId}:permissions`;
};

// =============================================================================
// CORE CACHE FUNCTIONS
// =============================================================================

/**
 * Check if we're in a browser environment
 */
const isBrowser = (): boolean => {
  return typeof window !== 'undefined' && typeof localStorage !== 'undefined';
};

/**
 * Get cache metadata (list of all cache keys)
 */
const getCacheMetadata = (): Set<string> => {
  if (!isBrowser()) return new Set();

  try {
    const metadata = localStorage.getItem(CACHE_METADATA_KEY);
    return metadata ? new Set(JSON.parse(metadata)) : new Set();
  } catch (error) {
    console.warn('Failed to read cache metadata:', error);
    return new Set();
  }
};

/**
 * Update cache metadata
 */
const updateCacheMetadata = (keys: Set<string>): void => {
  if (!isBrowser()) return;

  try {
    localStorage.setItem(CACHE_METADATA_KEY, JSON.stringify(Array.from(keys)));
  } catch (error) {
    console.warn('Failed to update cache metadata:', error);
  }
};

/**
 * Add key to metadata
 */
const addKeyToMetadata = (key: string): void => {
  const metadata = getCacheMetadata();
  metadata.add(key);
  updateCacheMetadata(metadata);
};

/**
 * Remove key from metadata
 */
const removeKeyFromMetadata = (key: string): void => {
  const metadata = getCacheMetadata();
  metadata.delete(key);
  updateCacheMetadata(metadata);
};

/**
 * Store data in permission cache with TTL
 *
 * @param key - Cache key
 * @param data - Data to cache
 * @param ttlMs - Time-to-live in milliseconds (default: 5 minutes)
 */
export const setPermissionCache = <T = any>(
  key: CacheKey,
  data: T,
  ttlMs: number = DEFAULT_CACHE_TTL_MS
): void => {
  if (!isBrowser()) {
    return;
  }

  try {
    const now = Date.now();
    const cacheEntry: PermissionCacheData<T> = {
      data,
      expiresAt: now + ttlMs,
      createdAt: now,
    };

    localStorage.setItem(key, JSON.stringify(cacheEntry));
    addKeyToMetadata(key);
  } catch (error) {
    console.warn('Failed to set permission cache:', error);

    // If quota exceeded, try to clear expired entries and retry
    if (error instanceof Error && error.name === 'QuotaExceededError') {
      clearExpiredCache();
      try {
        const now = Date.now();
        const cacheEntry: PermissionCacheData<T> = {
          data,
          expiresAt: now + ttlMs,
          createdAt: now,
        };
        localStorage.setItem(key, JSON.stringify(cacheEntry));
        addKeyToMetadata(key);
      } catch (retryError) {
        console.error('Failed to set permission cache after cleanup:', retryError);
      }
    }
  }
};

/**
 * Get data from permission cache if not expired
 *
 * @param key - Cache key
 * @returns Cached data or null if not found or expired
 */
export const getPermissionCache = <T = any>(key: CacheKey): T | null => {
  if (!isBrowser()) {
    return null;
  }

  try {
    const cached = localStorage.getItem(key);
    if (!cached) {
      return null;
    }

    const cacheEntry: PermissionCacheData<T> = JSON.parse(cached);
    const now = Date.now();

    // Check if expired
    if (now > cacheEntry.expiresAt) {
      // Remove expired entry
      localStorage.removeItem(key);
      removeKeyFromMetadata(key);
      return null;
    }

    return cacheEntry.data;
  } catch (error) {
    console.warn('Failed to get permission cache:', error);
    return null;
  }
};

/**
 * Check if cache entry exists and is valid (not expired)
 *
 * @param key - Cache key
 * @returns True if cache exists and is valid
 */
export const isPermissionCacheValid = (key: CacheKey): boolean => {
  if (!isBrowser()) {
    return false;
  }

  try {
    const cached = localStorage.getItem(key);
    if (!cached) {
      return false;
    }

    const cacheEntry: PermissionCacheData = JSON.parse(cached);
    const now = Date.now();

    return now <= cacheEntry.expiresAt;
  } catch (error) {
    console.warn('Failed to check cache validity:', error);
    return false;
  }
};

/**
 * Get remaining TTL for cache entry in milliseconds
 *
 * @param key - Cache key
 * @returns Remaining TTL in milliseconds, or 0 if expired/not found
 */
export const getPermissionCacheExpiresIn = (key: CacheKey): number => {
  if (!isBrowser()) {
    return 0;
  }

  try {
    const cached = localStorage.getItem(key);
    if (!cached) {
      return 0;
    }

    const cacheEntry: PermissionCacheData = JSON.parse(cached);
    const now = Date.now();
    const remaining = cacheEntry.expiresAt - now;

    return remaining > 0 ? remaining : 0;
  } catch (error) {
    console.warn('Failed to get cache expiration:', error);
    return 0;
  }
};

/**
 * Clear specific cache entry or all permission cache if no key provided
 *
 * @param key - Optional cache key. If not provided, clears all permission cache
 */
export const clearPermissionCache = (key?: CacheKey): void => {
  if (!isBrowser()) {
    return;
  }

  try {
    if (key) {
      // Clear specific entry
      localStorage.removeItem(key);
      removeKeyFromMetadata(key);
    } else {
      // Clear all permission cache entries
      const metadata = getCacheMetadata();

      metadata.forEach((cacheKey) => {
        localStorage.removeItem(cacheKey);
      });

      // Clear metadata
      localStorage.removeItem(CACHE_METADATA_KEY);
    }
  } catch (error) {
    console.warn('Failed to clear permission cache:', error);
  }
};

/**
 * Clear all expired cache entries
 * Useful for cleanup and reclaiming localStorage space
 */
export const clearExpiredCache = (): number => {
  if (!isBrowser()) {
    return 0;
  }

  let clearedCount = 0;
  const metadata = getCacheMetadata();
  const now = Date.now();

  metadata.forEach((key) => {
    try {
      const cached = localStorage.getItem(key);
      if (!cached) {
        removeKeyFromMetadata(key);
        return;
      }

      const cacheEntry: PermissionCacheData = JSON.parse(cached);

      if (now > cacheEntry.expiresAt) {
        localStorage.removeItem(key);
        removeKeyFromMetadata(key);
        clearedCount++;
      }
    } catch (error) {
      console.warn(`Failed to check/clear cache entry ${key}:`, error);
      // Remove corrupted entry
      localStorage.removeItem(key);
      removeKeyFromMetadata(key);
      clearedCount++;
    }
  });

  return clearedCount;
};

/**
 * Invalidate cache entries by pattern
 *
 * @param pattern - RegExp or string pattern to match cache keys
 * @returns Number of invalidated entries
 */
export const invalidateCacheByPattern = (pattern: string | RegExp): number => {
  if (!isBrowser()) {
    return 0;
  }

  let invalidatedCount = 0;
  const metadata = getCacheMetadata();
  const regex = typeof pattern === 'string' ? new RegExp(pattern) : pattern;

  metadata.forEach((key) => {
    if (regex.test(key)) {
      localStorage.removeItem(key);
      removeKeyFromMetadata(key);
      invalidatedCount++;
    }
  });

  return invalidatedCount;
};

/**
 * Invalidate all cache entries for a specific user
 *
 * @param userId - User ID
 * @returns Number of invalidated entries
 */
export const invalidateUserCache = (userId: number | string): number => {
  const pattern = new RegExp(`${CACHE_KEY_PREFIX}user:${userId}:`);
  return invalidateCacheByPattern(pattern);
};

/**
 * Invalidate all cache entries for a specific role
 *
 * @param role - Role name
 * @returns Number of invalidated entries
 */
export const invalidateRoleCache = (role: string): number => {
  const pattern = new RegExp(`${CACHE_KEY_PREFIX}role:${role}:`);
  return invalidateCacheByPattern(pattern);
};

/**
 * Invalidate all cache entries for a specific page
 *
 * @param pageKey - Page key
 * @returns Number of invalidated entries
 */
export const invalidatePageCache = (pageKey: string): number => {
  const pattern = new RegExp(`${CACHE_KEY_PREFIX}.*:${pageKey}$`);
  return invalidateCacheByPattern(pattern);
};

// =============================================================================
// CACHE STATISTICS & MONITORING
// =============================================================================

/**
 * Get statistics for a specific cache entry
 *
 * @param key - Cache key
 * @returns Cache statistics or null if not found
 */
export const getCacheStats = (key: CacheKey): CacheStats | null => {
  if (!isBrowser()) {
    return null;
  }

  try {
    const cached = localStorage.getItem(key);
    if (!cached) {
      return null;
    }

    const cacheEntry: PermissionCacheData = JSON.parse(cached);
    const now = Date.now();
    const ttlRemaining = Math.max(0, cacheEntry.expiresAt - now);

    return {
      key,
      size: new Blob([cached]).size,
      expiresAt: cacheEntry.expiresAt,
      createdAt: cacheEntry.createdAt,
      ttlRemaining,
      isExpired: ttlRemaining === 0,
    };
  } catch (error) {
    console.warn('Failed to get cache stats:', error);
    return null;
  }
};

/**
 * Get statistics for all cache entries
 *
 * @returns Array of cache statistics
 */
export const getAllCacheStats = (): CacheStats[] => {
  if (!isBrowser()) {
    return [];
  }

  const metadata = getCacheMetadata();
  const stats: CacheStats[] = [];

  metadata.forEach((key) => {
    const stat = getCacheStats(key);
    if (stat) {
      stats.push(stat);
    }
  });

  return stats.sort((a, b) => a.expiresAt - b.expiresAt);
};

/**
 * Get total size of permission cache in bytes
 *
 * @returns Total size in bytes
 */
export const getTotalCacheSize = (): number => {
  const stats = getAllCacheStats();
  return stats.reduce((total, stat) => total + stat.size, 0);
};

/**
 * Get count of cache entries
 *
 * @returns Object with total, valid, and expired counts
 */
export const getCacheCounts = (): { total: number; valid: number; expired: number } => {
  const stats = getAllCacheStats();

  return {
    total: stats.length,
    valid: stats.filter(s => !s.isExpired).length,
    expired: stats.filter(s => s.isExpired).length,
  };
};

// =============================================================================
// AUTO CLEANUP
// =============================================================================

/**
 * Initialize auto-cleanup of expired cache entries
 * Runs cleanup every 5 minutes
 */
export const initAutoCleanup = (): (() => void) => {
  if (!isBrowser()) {
    return () => {};
  }

  const intervalId = setInterval(() => {
    const cleared = clearExpiredCache();
    if (cleared > 0) {
      console.log(`[Permission Cache] Auto-cleanup removed ${cleared} expired entries`);
    }
  }, 5 * 60 * 1000); // 5 minutes

  // Return cleanup function
  return () => clearInterval(intervalId);
};

// Auto-initialize cleanup on module load
if (isBrowser()) {
  initAutoCleanup();
}
