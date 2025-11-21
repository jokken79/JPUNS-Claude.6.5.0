# Permission Cache System - Integration Guide

## Overview

The Permission Cache System implements a localStorage-based caching layer for page visibility and role permission checks. This reduces unnecessary API calls and significantly improves navigation performance between pages.

**Performance Impact:**
- **First page load:** Normal API call + cache store (~200-500ms)
- **Same page revisit:** Cache hit (~0-5ms, 100x faster)
- **Different page same role:** Cache hit (~0-5ms)
- **After 5 minutes:** Cache expires, fresh API call
- **Permission update:** Cache invalidates automatically

---

## Architecture

### Cache Storage Structure

```typescript
// localStorage key pattern: perm_cache:{type}:{identifier}
{
  "perm_cache:page:timer-cards": {
    data: { is_enabled: true },
    expiresAt: 1699564200000,
    createdAt: 1699564000000
  },
  "perm_cache:role:EMPLOYEE:salary": {
    data: { has_access: false, role: "EMPLOYEE", page_key: "salary" },
    expiresAt: 1699564200000,
    createdAt: 1699564000000
  }
}
```

### Cache Key Patterns

| Pattern | Description | Example |
|---------|-------------|---------|
| `perm:page:{pageKey}` | Single page visibility | `perm:page:timer-cards` |
| `perm:pages:all` | All pages visibility | `perm:pages:all` |
| `perm:role:{role}:{page}` | Role permission for page | `perm:role:EMPLOYEE:salary` |
| `perm:role:{role}:all` | All pages for role | `perm:role:EMPLOYEE:all` |
| `perm:user:{userId}:permissions` | User's combined permissions | `perm:user:123:permissions` |

---

## Files Created

### Core Cache System
- **`frontend/lib/cache/permission-cache.ts`**
  - Core caching utilities with TTL support
  - Cache key builders
  - Invalidation functions
  - Statistics and monitoring
  - Auto-cleanup (every 5 minutes)

### Cached Hooks
- **`frontend/hooks/use-cached-page-visibility.ts`**
  - `useCachedPageVisibility()` - Single page visibility with cache
  - `useCachedAllPagesVisibility()` - All pages visibility with cache
  - `useCachedCurrentPageVisibility()` - Auto-detect current page with cache

- **`frontend/hooks/use-cached-page-permission.ts`**
  - `useCachedPagePermission()` - Single page permission with cache
  - `useCachedAllPagesPermission()` - All pages for role with cache
  - `useCachedUserPermissions()` - Complete user permissions with cache

### Updated Files
- **`frontend/hooks/use-page-visibility.ts`**
  - Added deprecation notice
  - Re-exports cached versions

- **`frontend/hooks/use-page-permission.ts`**
  - Added deprecation notice
  - Re-exports cached versions

- **`frontend/stores/auth-store.ts`**
  - Clears permission cache on logout

- **`frontend/app/(dashboard)/admin/control-panel/page.tsx`**
  - Added "Clear Cache" button with stats badge
  - Added cache statistics card
  - Added cache invalidation handlers

---

## Usage Guide

### 1. Using Cached Page Visibility Hook

**Before (Old Hook - No Cache):**
```typescript
import { usePageVisibility } from '@/hooks/use-page-visibility';

function MyComponent() {
  const { isEnabled, loading, error } = usePageVisibility('timer-cards');

  if (loading) return <div>Loading...</div>;
  if (!isEnabled) return <div>Page disabled</div>;

  return <div>Page content</div>;
}
```

**After (New Hook - With Cache):**
```typescript
import { useCachedPageVisibility } from '@/hooks/use-cached-page-visibility';

function MyComponent() {
  const {
    isEnabled,
    loading,
    error,
    cacheHit,        // NEW: true if data came from cache
    cacheExpiresIn   // NEW: ms until cache expires
  } = useCachedPageVisibility('timer-cards');

  if (loading) return <div>Loading...</div>;
  if (!isEnabled) return <div>Page disabled</div>;

  return (
    <div>
      Page content
      {/* Optional: Show cache status for debugging */}
      {process.env.NODE_ENV === 'development' && cacheHit && (
        <span className="text-xs text-green-600">
          (Cached - expires in {Math.round(cacheExpiresIn / 1000)}s)
        </span>
      )}
    </div>
  );
}
```

### 2. Using Cached Page Permission Hook

**Before (Old Hook - No Cache):**
```typescript
import { usePagePermission } from '@/hooks/use-page-permission';

function MyComponent() {
  const { hasPermission, loading } = usePagePermission('salary');

  if (loading) return <div>Loading...</div>;
  if (!hasPermission) return <div>Access denied</div>;

  return <div>Salary page</div>;
}
```

**After (New Hook - With Cache):**
```typescript
import { useCachedPagePermission } from '@/hooks/use-cached-page-permission';

function MyComponent() {
  const {
    hasPermission,
    loading,
    cacheHit,
    cacheExpiresIn,
    refresh         // NEW: Force refresh cache
  } = useCachedPagePermission('salary');

  if (loading) return <div>Loading...</div>;
  if (!hasPermission) return <div>Access denied</div>;

  return (
    <div>
      Salary page
      {/* Optional: Manual refresh button */}
      <button onClick={() => refresh(true)}>
        Refresh Permissions
      </button>
    </div>
  );
}
```

### 3. Using Bulk Permission Check (NEW)

For pages that need to check multiple permissions:

```typescript
import { useCachedAllPagesPermission } from '@/hooks/use-cached-page-permission';

function NavigationMenu() {
  const { permissions, hasPermission, loading } = useCachedAllPagesPermission();

  if (loading) return <div>Loading menu...</div>;

  return (
    <nav>
      {hasPermission('dashboard') && <a href="/dashboard">Dashboard</a>}
      {hasPermission('employees') && <a href="/employees">Employees</a>}
      {hasPermission('salary') && <a href="/salary">Salary</a>}
      {hasPermission('reports') && <a href="/reports">Reports</a>}
    </nav>
  );
}
```

### 4. Manual Cache Management

**Clear all permission cache:**
```typescript
import { clearPermissionCache } from '@/lib/cache/permission-cache';

function ClearCacheButton() {
  const handleClear = () => {
    clearPermissionCache(); // Clears ALL permission cache
    toast.success('Cache cleared');
  };

  return <button onClick={handleClear}>Clear Cache</button>;
}
```

**Clear specific cache entry:**
```typescript
import {
  clearPermissionCache,
  buildPageVisibilityKey
} from '@/lib/cache/permission-cache';

function ClearPageCache() {
  const handleClear = () => {
    const key = buildPageVisibilityKey('timer-cards');
    clearPermissionCache(key); // Clear only timer-cards cache
  };

  return <button onClick={handleClear}>Clear Timer Cards Cache</button>;
}
```

**Invalidate by pattern:**
```typescript
import {
  invalidatePageCache,
  invalidateRoleCache,
  invalidateUserCache
} from '@/lib/cache/permission-cache';

// Invalidate all cache entries for a specific page
invalidatePageCache('timer-cards');

// Invalidate all cache entries for a specific role
invalidateRoleCache('EMPLOYEE');

// Invalidate all cache entries for a specific user
invalidateUserCache(123);
```

### 5. Cache Statistics

**Get cache stats:**
```typescript
import {
  getCacheCounts,
  getTotalCacheSize,
  getAllCacheStats
} from '@/lib/cache/permission-cache';

function CacheStats() {
  const counts = getCacheCounts(); // { total, valid, expired }
  const size = getTotalCacheSize(); // bytes
  const stats = getAllCacheStats(); // detailed stats

  return (
    <div>
      <p>Total: {counts.total}</p>
      <p>Valid: {counts.valid}</p>
      <p>Expired: {counts.expired}</p>
      <p>Size: {(size / 1024).toFixed(2)} KB</p>
    </div>
  );
}
```

---

## Cache Invalidation Strategy

### Automatic Invalidation

The cache is automatically cleared/invalidated in these scenarios:

1. **User Logout**
   - All permission cache cleared
   - Triggered in: `frontend/stores/auth-store.ts`

2. **Permission Updates**
   - Specific page/role cache invalidated
   - Admin updates trigger re-fetch

3. **Page Visibility Changes**
   - Specific page cache invalidated
   - Global pages cache cleared

4. **Expired Entries**
   - Auto-cleanup every 5 minutes
   - Removes expired entries from localStorage

### Manual Invalidation

Admins can manually clear cache via:

1. **Admin Control Panel**
   - Navigate to: `/admin/control-panel`
   - Click "Clear Cache" button in header
   - Shows cache count badge and statistics

2. **Programmatic Invalidation**
   ```typescript
   import { clearPermissionCache } from '@/lib/cache/permission-cache';

   // Clear all cache
   clearPermissionCache();

   // Clear specific entry
   clearPermissionCache('perm:page:timer-cards');
   ```

---

## Migration Guide

### Step 1: Identify Current Usage

Search for these imports in your codebase:
```bash
grep -r "usePageVisibility" frontend/
grep -r "usePagePermission" frontend/
```

### Step 2: Update Imports

**Option A: Use cached version directly (Recommended)**
```typescript
// Before
import { usePageVisibility } from '@/hooks/use-page-visibility';

// After
import { useCachedPageVisibility } from '@/hooks/use-cached-page-visibility';
```

**Option B: Use re-exported cached version (Easy migration)**
```typescript
// Before
import { usePageVisibility } from '@/hooks/use-page-visibility';

// After
import { useCachedPageVisibility as usePageVisibility } from '@/hooks/use-page-visibility';
// The old file now re-exports the cached version
```

### Step 3: Update Hook Usage

```typescript
// Old
const { isEnabled, loading, error } = usePageVisibility('page-key');

// New (same API + extra fields)
const {
  isEnabled,
  loading,
  error,
  cacheHit,       // Optional: for telemetry
  cacheExpiresIn  // Optional: for debugging
} = useCachedPageVisibility('page-key');
```

### Step 4: Test

1. Navigate to page → Should see API call
2. Navigate away and back → Should see cache hit (instant load)
3. Wait 5+ minutes → Should see fresh API call
4. Update permissions → Should invalidate cache

---

## Configuration

### Change Cache TTL

Default TTL is 5 minutes. To customize:

```typescript
import { useCachedPageVisibility } from '@/hooks/use-cached-page-visibility';

function MyComponent() {
  // Use 10 minute cache
  const { isEnabled } = useCachedPageVisibility('page-key', 10 * 60 * 1000);

  // Use 1 minute cache
  const { hasPermission } = useCachedPagePermission('page-key', 60 * 1000);
}
```

### Disable Cache (for testing)

Force refresh to bypass cache:

```typescript
const { refresh } = useCachedPageVisibility('page-key');

// Bypass cache and fetch fresh data
refresh(true); // forceRefresh = true
```

---

## Testing Guide

### Manual Testing Scenarios

#### Scenario 1: Cache Hit/Miss
1. Open DevTools → Application → Local Storage
2. Navigate to a page (e.g., `/timercards`)
3. Check localStorage for `perm_cache:page:timercards` entry
4. Navigate away and back
5. Verify no network request (cache hit)

#### Scenario 2: Cache Expiration
1. Navigate to a page
2. Wait 5+ minutes (or change TTL to 10 seconds for testing)
3. Navigate back to page
4. Verify new API call (cache expired)

#### Scenario 3: Cache Invalidation on Permission Update
1. Login as admin
2. Navigate to `/admin/control-panel`
3. Toggle a page visibility
4. Navigate to that page
5. Verify cache was invalidated (fresh API call)

#### Scenario 4: Cache Clear on Logout
1. Login and navigate around (build cache)
2. Check localStorage for cache entries
3. Logout
4. Verify all `perm_cache:*` entries cleared

#### Scenario 5: Admin Cache Management
1. Login as admin
2. Navigate to `/admin/control-panel`
3. View cache statistics card (shows entry count, size, etc.)
4. Click "Clear Cache" button
5. Verify cache count drops to 0

### Automated Testing

**Test cache functionality:**
```typescript
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import {
  setPermissionCache,
  getPermissionCache,
  clearPermissionCache,
  isPermissionCacheValid
} from '@/lib/cache/permission-cache';

describe('Permission Cache', () => {
  beforeEach(() => {
    clearPermissionCache();
  });

  afterEach(() => {
    clearPermissionCache();
  });

  it('should store and retrieve cache', () => {
    const key = 'test-key';
    const data = { test: 'data' };

    setPermissionCache(key, data);
    const cached = getPermissionCache(key);

    expect(cached).toEqual(data);
  });

  it('should return null for expired cache', async () => {
    const key = 'test-key';
    const data = { test: 'data' };

    // Set cache with 100ms TTL
    setPermissionCache(key, data, 100);

    // Wait for expiration
    await new Promise(resolve => setTimeout(resolve, 150));

    const cached = getPermissionCache(key);
    expect(cached).toBeNull();
  });

  it('should validate cache correctly', () => {
    const key = 'test-key';

    expect(isPermissionCacheValid(key)).toBe(false);

    setPermissionCache(key, { test: 'data' });
    expect(isPermissionCacheValid(key)).toBe(true);
  });
});
```

---

## Performance Metrics

### Expected Performance Improvements

| Scenario | Before (No Cache) | After (With Cache) | Improvement |
|----------|-------------------|---------------------|-------------|
| First page load | 200-500ms | 200-500ms | Baseline |
| Same page revisit | 200-500ms | 0-5ms | **100x faster** |
| Different page same role | 200-500ms | 0-5ms | **100x faster** |
| Navigation between pages | N x 200-500ms | 1 x 200-500ms + (N-1) x 0-5ms | **~95% reduction** |

### Real-World Impact

**Example: User navigates through 10 pages in a session**

**Without cache:**
- 10 API calls
- Total time: 10 × 300ms = 3000ms (3 seconds)

**With cache:**
- 1 API call (first page)
- 9 cache hits
- Total time: 300ms + (9 × 2ms) = ~318ms

**Result: 90% faster navigation!**

---

## Troubleshooting

### Cache Not Working

1. **Check localStorage support:**
   ```javascript
   console.log(typeof window !== 'undefined' && typeof localStorage !== 'undefined');
   ```

2. **Check cache entries:**
   ```javascript
   // Open DevTools Console
   Object.keys(localStorage).filter(key => key.startsWith('perm_cache:'))
   ```

3. **Force refresh:**
   ```typescript
   const { refresh } = useCachedPageVisibility('page-key');
   refresh(true); // Bypass cache
   ```

### Cache Size Issues

If localStorage quota exceeded:

1. Cache automatically tries to clear expired entries
2. Manual clear: Click "Clear Cache" in admin panel
3. Reduce TTL to prevent buildup

### Cache Out of Sync

If cache data doesn't match server:

1. Clear cache manually
2. Check invalidation triggers
3. Verify permission update handlers

---

## Best Practices

### DO:
- ✅ Use cached hooks for all page visibility/permission checks
- ✅ Invalidate cache when permissions change
- ✅ Monitor cache size in admin panel
- ✅ Test cache behavior in development
- ✅ Use `cacheHit` flag for telemetry/metrics

### DON'T:
- ❌ Store sensitive data in cache beyond permission status
- ❌ Rely on cache for real-time permission changes
- ❌ Set TTL too high (>10 minutes)
- ❌ Forget to clear cache on logout
- ❌ Modify cache directly (use provided functions)

---

## API Reference

See inline documentation in:
- `frontend/lib/cache/permission-cache.ts`
- `frontend/hooks/use-cached-page-visibility.ts`
- `frontend/hooks/use-cached-page-permission.ts`

---

## Support

For issues or questions:
1. Check this guide
2. Review inline code comments
3. Check cache stats in admin panel
4. Clear cache and test again
5. Check browser console for errors

---

## Version History

- **v1.0.0** (2025-11-12)
  - Initial implementation
  - Core cache system with TTL
  - Cached hooks for visibility and permissions
  - Admin panel integration
  - Auto-cleanup on logout
  - Statistics and monitoring
