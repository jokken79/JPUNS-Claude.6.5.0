/**
 * Permission Cache - Implementation Examples
 *
 * This file contains ready-to-use examples for implementing
 * the permission cache system in different scenarios.
 *
 * Copy and adapt these examples to your use case.
 */

// =============================================================================
// EXAMPLE 1: Basic Page Visibility Check
// =============================================================================

import { useCachedPageVisibility } from '@/hooks/use-cached-page-visibility';

function Example1_BasicPageCheck() {
  const { isEnabled, loading, error } = useCachedPageVisibility('timer-cards');

  if (loading) {
    return <div className="p-4">Loading page visibility...</div>;
  }

  if (error) {
    return <div className="p-4 text-red-500">Error: {error}</div>;
  }

  if (!isEnabled) {
    return (
      <div className="p-4 border-2 border-yellow-500 rounded">
        <h2 className="text-xl font-bold">Page Under Construction</h2>
        <p>This page is currently disabled by administrators.</p>
      </div>
    );
  }

  return (
    <div className="p-4">
      <h1>Timer Cards Page</h1>
      <p>Page is enabled and accessible.</p>
    </div>
  );
}

// =============================================================================
// EXAMPLE 2: Page Permission Check with Cache Status
// =============================================================================

import { useCachedPagePermission } from '@/hooks/use-cached-page-permission';
import { Badge } from '@/components/ui/badge';

function Example2_PermissionWithCacheStatus() {
  const {
    hasPermission,
    loading,
    cacheHit,
    cacheExpiresIn,
  } = useCachedPagePermission('salary');

  if (loading) {
    return <div>Checking permissions...</div>;
  }

  if (!hasPermission) {
    return <div className="p-4 border-2 border-red-500 rounded">Access Denied</div>;
  }

  return (
    <div className="p-4">
      <div className="flex items-center gap-2 mb-4">
        <h1>Salary Management</h1>
        {process.env.NODE_ENV === 'development' && (
          <Badge variant={cacheHit ? 'default' : 'secondary'}>
            {cacheHit
              ? `Cached (${Math.round(cacheExpiresIn / 1000)}s)`
              : 'Fresh API'}
          </Badge>
        )}
      </div>
      <p>You have permission to view salary data.</p>
    </div>
  );
}

// =============================================================================
// EXAMPLE 3: Bulk Permission Check for Navigation Menu
// =============================================================================

import { useCachedAllPagesPermission } from '@/hooks/use-cached-page-permission';
import Link from 'next/link';

function Example3_NavigationMenu() {
  const { hasPermission, loading } = useCachedAllPagesPermission();

  if (loading) {
    return <nav className="flex gap-4">Loading menu...</nav>;
  }

  const menuItems = [
    { key: 'dashboard', label: 'Dashboard', href: '/dashboard' },
    { key: 'employees', label: 'Employees', href: '/employees' },
    { key: 'factories', label: 'Factories', href: '/factories' },
    { key: 'timercards', label: 'Timer Cards', href: '/timercards' },
    { key: 'salary', label: 'Salary', href: '/salary' },
    { key: 'reports', label: 'Reports', href: '/reports' },
  ];

  return (
    <nav className="flex gap-4">
      {menuItems.map((item) =>
        hasPermission(item.key) ? (
          <Link
            key={item.key}
            href={item.href}
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
          >
            {item.label}
          </Link>
        ) : null
      )}
    </nav>
  );
}

// =============================================================================
// EXAMPLE 4: Manual Cache Refresh with Button
// =============================================================================

import { Button } from '@/components/ui/button';
import { RefreshCw } from 'lucide-react';
import { toast } from 'sonner';

function Example4_ManualRefresh() {
  const {
    isEnabled,
    loading,
    refresh,
    cacheHit,
  } = useCachedPageVisibility('employees');

  const handleRefresh = async () => {
    try {
      await refresh(true); // Force refresh, bypass cache
      toast.success('Page visibility refreshed');
    } catch (error) {
      toast.error('Failed to refresh');
    }
  };

  return (
    <div className="p-4">
      <div className="flex items-center justify-between mb-4">
        <h1>Employees Page</h1>
        <Button
          onClick={handleRefresh}
          disabled={loading}
          variant="outline"
          className="gap-2"
        >
          <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      {cacheHit && (
        <div className="mb-4 p-2 bg-green-100 rounded text-sm">
          Data loaded from cache (fast!)
        </div>
      )}

      {isEnabled ? (
        <p>Page is enabled</p>
      ) : (
        <p>Page is disabled</p>
      )}
    </div>
  );
}

// =============================================================================
// EXAMPLE 5: Custom Cache TTL
// =============================================================================

function Example5_CustomTTL() {
  // 10 minute cache for rarely changing data
  const longCache = useCachedPageVisibility('settings', 10 * 60 * 1000);

  // 1 minute cache for frequently changing data
  const shortCache = useCachedPageVisibility('dashboard', 60 * 1000);

  return (
    <div className="p-4 space-y-4">
      <div>
        <h2>Settings Page (10 min cache)</h2>
        <p>Status: {longCache.isEnabled ? 'Enabled' : 'Disabled'}</p>
      </div>

      <div>
        <h2>Dashboard (1 min cache)</h2>
        <p>Status: {shortCache.isEnabled ? 'Enabled' : 'Disabled'}</p>
      </div>
    </div>
  );
}

// =============================================================================
// EXAMPLE 6: Cache Management Component
// =============================================================================

import {
  clearPermissionCache,
  getCacheCounts,
  getTotalCacheSize,
  clearExpiredCache,
} from '@/lib/cache/permission-cache';
import { useState, useEffect } from 'react';
import { Trash2, Database } from 'lucide-react';

function Example6_CacheManagement() {
  const [stats, setStats] = useState({ total: 0, valid: 0, expired: 0 });
  const [size, setSize] = useState(0);

  const updateStats = () => {
    setStats(getCacheCounts());
    setSize(getTotalCacheSize());
  };

  useEffect(() => {
    updateStats();
    // Update stats every 10 seconds
    const interval = setInterval(updateStats, 10000);
    return () => clearInterval(interval);
  }, []);

  const handleClearAll = () => {
    clearPermissionCache();
    updateStats();
    toast.success('All cache cleared');
  };

  const handleClearExpired = () => {
    const cleared = clearExpiredCache();
    updateStats();
    toast.success(`Cleared ${cleared} expired entries`);
  };

  return (
    <div className="p-4 border rounded">
      <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
        <Database className="h-5 w-5" />
        Permission Cache Manager
      </h2>

      <div className="grid grid-cols-3 gap-4 mb-4">
        <div className="p-3 border rounded text-center">
          <div className="text-2xl font-bold">{stats.total}</div>
          <div className="text-sm text-gray-500">Total Entries</div>
        </div>
        <div className="p-3 border rounded text-center">
          <div className="text-2xl font-bold text-green-600">{stats.valid}</div>
          <div className="text-sm text-gray-500">Valid</div>
        </div>
        <div className="p-3 border rounded text-center">
          <div className="text-2xl font-bold text-orange-600">{stats.expired}</div>
          <div className="text-sm text-gray-500">Expired</div>
        </div>
      </div>

      <p className="mb-4 text-sm">
        Cache Size: <strong>{(size / 1024).toFixed(2)} KB</strong>
      </p>

      <div className="flex gap-2">
        <Button onClick={handleClearExpired} variant="outline">
          Clear Expired Only
        </Button>
        <Button onClick={handleClearAll} variant="destructive" className="gap-2">
          <Trash2 className="h-4 w-4" />
          Clear All Cache
        </Button>
      </div>
    </div>
  );
}

// =============================================================================
// EXAMPLE 7: Protected Route Component
// =============================================================================

import { useRouter } from 'next/navigation';
import { ReactNode } from 'react';

interface ProtectedRouteProps {
  pageKey: string;
  children: ReactNode;
  fallback?: ReactNode;
}

function Example7_ProtectedRoute({
  pageKey,
  children,
  fallback,
}: ProtectedRouteProps) {
  const router = useRouter();
  const { hasPermission, loading } = useCachedPagePermission(pageKey);

  if (loading) {
    return <div className="p-4">Checking permissions...</div>;
  }

  if (!hasPermission) {
    if (fallback) {
      return <>{fallback}</>;
    }

    return (
      <div className="p-4 border-2 border-red-500 rounded">
        <h2 className="text-xl font-bold mb-2">Access Denied</h2>
        <p className="mb-4">You don't have permission to access this page.</p>
        <Button onClick={() => router.push('/dashboard')}>
          Go to Dashboard
        </Button>
      </div>
    );
  }

  return <>{children}</>;
}

// Usage:
function Example7_Usage() {
  return (
    <Example7_ProtectedRoute pageKey="salary">
      <div className="p-4">
        <h1>Salary Management</h1>
        <p>This content is only visible to users with salary permission.</p>
      </div>
    </Example7_ProtectedRoute>
  );
}

// =============================================================================
// EXAMPLE 8: Invalidate Cache on Update
// =============================================================================

import {
  invalidatePageCache,
  invalidateRoleCache,
} from '@/lib/cache/permission-cache';
import api from '@/lib/api';

function Example8_InvalidateOnUpdate() {
  const [loading, setLoading] = useState(false);

  const handleUpdatePageVisibility = async (pageKey: string, isEnabled: boolean) => {
    try {
      setLoading(true);

      // Update via API
      await api.put(`/admin/pages/${pageKey}`, { is_enabled: isEnabled });

      // Invalidate cache for this page
      invalidatePageCache(pageKey);

      toast.success('Page visibility updated and cache invalidated');
    } catch (error) {
      toast.error('Failed to update page visibility');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateRolePermissions = async (role: string, permissions: any) => {
    try {
      setLoading(true);

      // Update via API
      await api.post(`/role-permissions/bulk-update/${role}`, { permissions });

      // Invalidate all cache for this role
      invalidateRoleCache(role);

      toast.success('Role permissions updated and cache invalidated');
    } catch (error) {
      toast.error('Failed to update role permissions');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-4">
      <h2>Admin Actions</h2>
      <div className="space-y-2 mt-4">
        <Button
          onClick={() => handleUpdatePageVisibility('employees', true)}
          disabled={loading}
        >
          Enable Employees Page
        </Button>
        <Button
          onClick={() => handleUpdateRolePermissions('EMPLOYEE', [])}
          disabled={loading}
        >
          Update Employee Permissions
        </Button>
      </div>
    </div>
  );
}

// =============================================================================
// EXAMPLE 9: Cache Telemetry/Analytics
// =============================================================================

function Example9_CacheTelemetry() {
  const { cacheHit, cacheExpiresIn } = useCachedPageVisibility('employees');

  useEffect(() => {
    if (cacheHit) {
      // Track cache hit in analytics
      console.log('[Analytics] Cache hit - fast load', {
        page: 'employees',
        expiresIn: cacheExpiresIn,
        timestamp: new Date().toISOString(),
      });
    } else {
      // Track cache miss - API call made
      console.log('[Analytics] Cache miss - API call', {
        page: 'employees',
        timestamp: new Date().toISOString(),
      });
    }
  }, [cacheHit, cacheExpiresIn]);

  return <div>Check console for telemetry data</div>;
}

// =============================================================================
// EXAMPLE 10: Conditional Rendering Based on Multiple Permissions
// =============================================================================

function Example10_MultiplePermissions() {
  const employeesPerm = useCachedPagePermission('employees');
  const salaryPerm = useCachedPagePermission('salary');
  const reportsPerm = useCachedPagePermission('reports');

  const loading = employeesPerm.loading || salaryPerm.loading || reportsPerm.loading;

  if (loading) {
    return <div>Loading permissions...</div>;
  }

  const hasAllPermissions =
    employeesPerm.hasPermission &&
    salaryPerm.hasPermission &&
    reportsPerm.hasPermission;

  const hasAnyPermission =
    employeesPerm.hasPermission ||
    salaryPerm.hasPermission ||
    reportsPerm.hasPermission;

  return (
    <div className="p-4 space-y-4">
      {hasAllPermissions && (
        <div className="p-4 bg-green-100 rounded">
          <h2>Full Access Dashboard</h2>
          <p>You have access to all modules.</p>
        </div>
      )}

      {!hasAllPermissions && hasAnyPermission && (
        <div className="p-4 bg-yellow-100 rounded">
          <h2>Partial Access Dashboard</h2>
          <p>You have limited access.</p>
        </div>
      )}

      {!hasAnyPermission && (
        <div className="p-4 bg-red-100 rounded">
          <h2>No Access</h2>
          <p>Contact administrator for access.</p>
        </div>
      )}

      <div className="grid grid-cols-3 gap-4">
        <div className={`p-4 border rounded ${employeesPerm.hasPermission ? 'bg-green-50' : 'bg-gray-50'}`}>
          Employees: {employeesPerm.hasPermission ? '✓' : '✗'}
        </div>
        <div className={`p-4 border rounded ${salaryPerm.hasPermission ? 'bg-green-50' : 'bg-gray-50'}`}>
          Salary: {salaryPerm.hasPermission ? '✓' : '✗'}
        </div>
        <div className={`p-4 border rounded ${reportsPerm.hasPermission ? 'bg-green-50' : 'bg-gray-50'}`}>
          Reports: {reportsPerm.hasPermission ? '✓' : '✗'}
        </div>
      </div>
    </div>
  );
}

// =============================================================================
// EXPORTS
// =============================================================================

export {
  Example1_BasicPageCheck,
  Example2_PermissionWithCacheStatus,
  Example3_NavigationMenu,
  Example4_ManualRefresh,
  Example5_CustomTTL,
  Example6_CacheManagement,
  Example7_ProtectedRoute,
  Example7_Usage,
  Example8_InvalidateOnUpdate,
  Example9_CacheTelemetry,
  Example10_MultiplePermissions,
};
