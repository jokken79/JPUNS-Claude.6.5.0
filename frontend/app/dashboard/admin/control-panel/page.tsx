'use client';

// Disable static generation for this page (uses client-side hooks)
export const dynamic = 'force-dynamic';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Settings,
  Eye,
  EyeOff,
  Activity,
  PieChart,
  Download,
  Upload,
  Shield,
  AlertTriangle,
  CheckCircle,
  RefreshCw,
  Wrench,
  Users,
  UserCog,
  Search,
  Database,
  Trash2,
  TrendingUp,
  X,
  Info,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { toast } from 'sonner';
import { useAllPagesVisibility } from '@/hooks/use-page-visibility';
import api, { adminControlPanelService, type AuditLogEntry, type RoleStatsResponse, type AdminStatistics } from '@/lib/api';
import {
  clearPermissionCache,
  getCacheCounts,
  getTotalCacheSize,
  clearExpiredCache,
} from '@/lib/cache/permission-cache';
import {
  ROLE_CATEGORIES,
  getRoleCategory,
  groupRolesByCategory,
  isLegacyRole,
  type RoleCategory,
} from '@/lib/role-categories';

// Enhanced components
import { LegacyRoleBadge } from '@/components/admin/legacy-role-badge';
import { RoleReferenceCard } from '@/components/admin/role-reference-card';
import { EnhancedRoleStats } from '@/components/admin/enhanced-role-stats';
import { PageCategoryGroup } from '@/components/admin/page-category-group';
import { AuditTrailPanel } from '@/components/admin/audit-trail-panel';
import { UserManagementPanel } from '@/components/admin/user-management-panel';
import { SystemSettingsPanel } from '@/components/admin/system-settings-panel';
import { ImportConfigDialog } from '@/components/admin/import-config-dialog';

// Chart components
import { RoleStatsChart } from '@/components/admin/role-stats-chart';
import { AuditActivityChart } from '@/components/admin/audit-activity-chart';
import { SystemStatsDashboard } from '@/components/admin/system-stats-dashboard';

interface Statistics {
  pages: {
    total: number;
    enabled: number;
    disabled: number;
    percentage_enabled: number;
  };
  system: {
    maintenance_mode: boolean;
    recent_changes_24h: number;
  };
}

interface RolePermission {
  role_key: string;
  page_key: string;
  is_enabled: boolean;
  created_at: string;
  updated_at: string;
}

interface RolePermissionsResponse {
  role_key: string;
  permissions: RolePermission[];
  total_pages: number;
  enabled_pages: number;
}

interface Role {
  key: string;
  name: string;
  name_en: string;
  description: string;
}

interface Page {
  key: string;
  name: string;
  name_en: string;
  description?: string;
}

interface BulkActionDialog {
  isOpen: boolean;
  action: 'enable' | 'disable' | null;
  scope: 'global' | 'role' | null;
  roleKey?: string;
  affectedCount: number;
}

export default function AdminControlPanelPage() {
  const { pages: globalPages, loading: pagesLoading, updatePageVisibility } = useAllPagesVisibility();
  const [statistics, setStatistics] = useState<Statistics | null>(null);
  const [statisticsLoading, setStatisticsLoading] = useState(true);
  const [bulkActionLoading, setBulkActionLoading] = useState(false);
  const [rolePermissions, setRolePermissions] = useState<Record<string, RolePermissionsResponse>>({});
  const [roleLoading, setRoleLoading] = useState<Record<string, boolean>>({});
  const [activeTab, setActiveTab] = useState('global');
  const [activeRoleCategory, setActiveRoleCategory] = useState<RoleCategory>('core');

  // NEW: Dynamic roles and pages from API
  const [roles, setRoles] = useState<Role[]>([]);
  const [rolesLoading, setRolesLoading] = useState(true);
  const [availablePages, setAvailablePages] = useState<Page[]>([]);
  const [availablePagesLoading, setAvailablePagesLoading] = useState(true);
  const [initializingDefaults, setInitializingDefaults] = useState(false);

  // NEW: Search filter
  const [searchQuery, setSearchQuery] = useState('');

  // NEW: Cache management state
  const [cacheStats, setCacheStats] = useState<{ total: number; valid: number; expired: number } | null>(null);
  const [clearingCache, setClearingCache] = useState(false);

  // NEW: Audit trail state
  const [auditLog, setAuditLog] = useState<AuditLogEntry[]>([]);
  const [auditLogLoading, setAuditLogLoading] = useState(false);

  // NEW: Role stats state
  const [roleStats, setRoleStats] = useState<RoleStatsResponse[]>([]);
  const [roleStatsLoading, setRoleStatsLoading] = useState(false);

  // NEW: Admin statistics state (for charts)
  const [adminStatistics, setAdminStatistics] = useState<AdminStatistics | null>(null);
  const [adminStatisticsLoading, setAdminStatisticsLoading] = useState(false);

  // NEW: Bulk action confirmation dialog
  const [bulkDialog, setBulkDialog] = useState<BulkActionDialog>({
    isOpen: false,
    action: null,
    scope: null,
    affectedCount: 0,
  });

  // NEW: Show role reference panel
  const [showRoleReference, setShowRoleReference] = useState(false);

  // NEW: Import config dialog state
  const [showImportDialog, setShowImportDialog] = useState(false);

  // Fetch roles from API
  const fetchRoles = async () => {
    try {
      setRolesLoading(true);
      const response = await api.get('/role-permissions/roles');
      setRoles(response.data);
    } catch (error: any) {
      console.error('Error fetching roles:', error);
      toast.error('Failed to fetch roles');
    } finally {
      setRolesLoading(false);
    }
  };

  // Fetch available pages from API
  const fetchAvailablePages = async () => {
    try {
      setAvailablePagesLoading(true);
      const response = await api.get('/role-permissions/pages');
      setAvailablePages(response.data);
    } catch (error: any) {
      console.error('Error fetching pages:', error);
      toast.error('Failed to fetch pages');
    } finally {
      setAvailablePagesLoading(false);
    }
  };

  const fetchStatistics = async () => {
    try {
      setStatisticsLoading(true);
      const response = await api.get('/admin/statistics');
      setStatistics(response.data);
    } catch (error: any) {
      console.error('Error fetching statistics:', error);
      toast.error('Failed to fetch statistics');
    } finally {
      setStatisticsLoading(false);
    }
  };

  // NEW: Fetch audit log
  const fetchAuditLog = async () => {
    try {
      setAuditLogLoading(true);
      const data = await adminControlPanelService.getRecentAuditLog(10);
      setAuditLog(data);
    } catch (error: any) {
      console.error('Error fetching audit log:', error);
      // Don't show error toast for audit log failures (non-critical feature)
    } finally {
      setAuditLogLoading(false);
    }
  };

  // NEW: Fetch role stats
  const fetchRoleStats = async () => {
    try {
      setRoleStatsLoading(true);
      const data = await adminControlPanelService.getRoleStats();
      setRoleStats(data);
    } catch (error: any) {
      console.error('Error fetching role stats:', error);
      // Don't show error toast for role stats failures (non-critical feature)
    } finally {
      setRoleStatsLoading(false);
    }
  };

  // NEW: Fetch admin statistics (for charts)
  const fetchAdminStatistics = async () => {
    try {
      setAdminStatisticsLoading(true);
      const response = await api.get('/admin/statistics');
      setAdminStatistics(response.data);
    } catch (error: any) {
      console.error('Error fetching admin statistics:', error);
      // Don't show error toast for admin statistics failures (non-critical feature)
    } finally {
      setAdminStatisticsLoading(false);
    }
  };

  // Update cache statistics
  const updateCacheStats = () => {
    const stats = getCacheCounts();
    setCacheStats(stats);
  };

  // Clear permission cache
  const handleClearCache = () => {
    try {
      setClearingCache(true);

      // Get stats before clearing
      const beforeStats = getCacheCounts();
      const beforeSize = getTotalCacheSize();

      // Clear all permission cache
      clearPermissionCache();

      // Update stats
      updateCacheStats();

      toast.success(
        `Cache cleared successfully! Removed ${beforeStats.total} entries (${(beforeSize / 1024).toFixed(2)} KB)`,
        { duration: 5000 }
      );
    } catch (error: any) {
      console.error('Error clearing cache:', error);
      toast.error('Failed to clear cache');
    } finally {
      setClearingCache(false);
    }
  };

  // Clear only expired cache entries
  const handleClearExpiredCache = () => {
    try {
      const clearedCount = clearExpiredCache();
      updateCacheStats();

      if (clearedCount > 0) {
        toast.success(`Cleared ${clearedCount} expired cache entries`);
      } else {
        toast.info('No expired cache entries found');
      }
    } catch (error: any) {
      console.error('Error clearing expired cache:', error);
      toast.error('Failed to clear expired cache');
    }
  };

  useEffect(() => {
    fetchRoles();
    fetchAvailablePages();
    fetchStatistics();
    fetchAuditLog();
    fetchRoleStats();
    fetchAdminStatistics();
    updateCacheStats(); // Update cache stats on mount
  }, []);

  const fetchRolePermissions = async (roleKey: string) => {
    try {
      setRoleLoading(prev => ({ ...prev, [roleKey]: true }));
      const response = await api.get(`/role-permissions/${roleKey}`);
      setRolePermissions(prev => ({
        ...prev,
        [roleKey]: response.data
      }));
    } catch (error: any) {
      console.error(`Error fetching permissions for role ${roleKey}:`, error);
      toast.error(`Failed to fetch permissions for role ${roleKey}`);
    } finally {
      setRoleLoading(prev => ({ ...prev, [roleKey]: false }));
    }
  };

  const handleRoleToggle = async (roleKey: string, pageKey: string, currentState: boolean) => {
    try {
      await api.put(`/role-permissions/${roleKey}/${pageKey}`, {
        is_enabled: !currentState
      });
      toast.success(`Permission updated for ${roleKey} - ${pageKey}`);

      // Update local state
      await fetchRolePermissions(roleKey);
      await fetchAuditLog(); // Refresh audit log
      await fetchRoleStats(); // Refresh role stats
    } catch (error: any) {
      console.error('Error updating permission:', error);
      toast.error('Failed to update permission');
    }
  };

  const handleBulkRoleEnable = async (roleKey: string) => {
    const roleData = rolePermissions[roleKey];
    if (!roleData) return;

    const disabledPages = roleData.permissions.filter(p => !p.is_enabled);
    if (disabledPages.length === 0) {
      toast.info('All pages are already enabled for this role');
      return;
    }

    setBulkDialog({
      isOpen: true,
      action: 'enable',
      scope: 'role',
      roleKey,
      affectedCount: disabledPages.length,
    });
  };

  const handleBulkRoleDisable = async (roleKey: string) => {
    const roleData = rolePermissions[roleKey];
    if (!roleData) return;

    const enabledPages = roleData.permissions.filter(p => p.is_enabled);
    if (enabledPages.length === 0) {
      toast.info('All pages are already disabled for this role');
      return;
    }

    setBulkDialog({
      isOpen: true,
      action: 'disable',
      scope: 'role',
      roleKey,
      affectedCount: enabledPages.length,
    });
  };

  const executeBulkRoleAction = async () => {
    if (!bulkDialog.roleKey || !bulkDialog.action) return;

    try {
      setRoleLoading(prev => ({ ...prev, [bulkDialog.roleKey!]: true }));
      const roleData = rolePermissions[bulkDialog.roleKey];
      if (!roleData) return;

      const targetPages = bulkDialog.action === 'enable'
        ? roleData.permissions.filter(p => !p.is_enabled)
        : roleData.permissions.filter(p => p.is_enabled);

      await api.post(`/role-permissions/bulk-update/${bulkDialog.roleKey}`, {
        permissions: targetPages.map(p => ({
          page_key: p.page_key,
          is_enabled: bulkDialog.action === 'enable'
        }))
      });

      toast.success(`${bulkDialog.action === 'enable' ? 'Enabled' : 'Disabled'} ${targetPages.length} pages for ${bulkDialog.roleKey}`);
      await fetchRolePermissions(bulkDialog.roleKey);
      await fetchAuditLog();
      await fetchRoleStats();
    } catch (error: any) {
      console.error('Error performing bulk action:', error);
      toast.error('Failed to perform bulk action');
    } finally {
      setRoleLoading(prev => ({ ...prev, [bulkDialog.roleKey!]: false }));
      setBulkDialog({ isOpen: false, action: null, scope: null, affectedCount: 0 });
    }
  };

  const handleToggle = async (pageKey: string, currentState: boolean) => {
    try {
      await updatePageVisibility(pageKey, !currentState);
      toast.success(`Page ${!currentState ? 'enabled' : 'disabled'} successfully`);
      fetchStatistics(); // Refresh statistics
      fetchAuditLog(); // Refresh audit log
    } catch (error: any) {
      toast.error('Failed to update page visibility');
    }
  };

  const handleBulkEnable = async () => {
    const disabledPages = globalPages.filter(p => !p.is_enabled);
    if (disabledPages.length === 0) {
      toast.info('All pages are already enabled');
      return;
    }

    setBulkDialog({
      isOpen: true,
      action: 'enable',
      scope: 'global',
      affectedCount: disabledPages.length,
    });
  };

  const handleBulkDisable = async () => {
    const enabledPages = globalPages.filter(p => p.is_enabled);
    if (enabledPages.length === 0) {
      toast.info('All pages are already disabled');
      return;
    }

    setBulkDialog({
      isOpen: true,
      action: 'disable',
      scope: 'global',
      affectedCount: enabledPages.length,
    });
  };

  const executeBulkGlobalAction = async () => {
    try {
      setBulkActionLoading(true);
      const targetPages = bulkDialog.action === 'enable'
        ? globalPages.filter(p => !p.is_enabled)
        : globalPages.filter(p => p.is_enabled);

      await api.post('/admin/pages/bulk-toggle', {
        page_keys: targetPages.map(p => p.page_key),
        is_enabled: bulkDialog.action === 'enable',
      });
      toast.success(`${bulkDialog.action === 'enable' ? 'Enabled' : 'Disabled'} ${targetPages.length} pages`);
      window.location.reload();
    } catch (error: any) {
      toast.error('Failed to perform bulk action');
    } finally {
      setBulkActionLoading(false);
      setBulkDialog({ isOpen: false, action: null, scope: null, affectedCount: 0 });
    }
  };

  const executeBulkAction = async () => {
    if (bulkDialog.scope === 'global') {
      await executeBulkGlobalAction();
    } else if (bulkDialog.scope === 'role') {
      await executeBulkRoleAction();
    }
  };

  const handleExportConfig = async () => {
    try {
      const response = await api.get('/admin/export-config');
      const dataStr = JSON.stringify(response.data, null, 2);
      const dataBlob = new Blob([dataStr], { type: 'application/json' });
      const url = URL.createObjectURL(dataBlob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `uns-control-panel-config-${new Date().toISOString().split('T')[0]}.json`;
      link.click();
      URL.revokeObjectURL(url);
      toast.success('Configuration exported successfully');
    } catch (error: any) {
      toast.error('Failed to export configuration');
    }
  };

  // NEW: Handle import success
  const handleImportSuccess = async () => {
    // Refresh all data after import
    await Promise.all([
      fetchStatistics(),
      fetchAuditLog(),
      fetchRoleStats(),
    ]);
    // Reload the page to reflect changes in page visibility
    window.location.reload();
  };

  // NEW: Initialize default permissions
  const handleInitializeDefaults = async () => {
    try {
      setInitializingDefaults(true);
      const response = await api.post('/role-permissions/initialize-defaults');
      toast.success('Default permissions initialized successfully');
      console.log('Initialization summary:', response.data);

      // Refresh all data
      await Promise.all([
        fetchStatistics(),
        fetchAuditLog(),
        fetchRoleStats(),
        ...roles.map(role => fetchRolePermissions(role.key))
      ]);
    } catch (error: any) {
      console.error('Error initializing defaults:', error);
      toast.error('Failed to initialize default permissions');
    } finally {
      setInitializingDefaults(false);
    }
  };

  // Filter permissions by search query
  const filterPermissions = (permissions: RolePermission[]) => {
    if (!searchQuery.trim()) return permissions;
    const query = searchQuery.toLowerCase();
    return permissions.filter(p =>
      p.page_key.toLowerCase().includes(query)
    );
  };

  // Get role icon
  const getRoleIcon = (roleKey: string) => {
    switch (roleKey) {
      case 'SUPER_ADMIN':
      case 'ADMIN':
        return Shield;
      case 'COORDINATOR':
      case 'TANTOSHA':
      case 'KANRININSHA':
        return Users;
      case 'KEITOSAN':
        return PieChart;
      case 'EMPLOYEE':
      case 'CONTRACT_WORKER':
        return UserCog;
      default:
        return Users;
    }
  };

  // Group roles by category
  const groupedRoles = groupRolesByCategory(roles.map(r => r.key));

  if (pagesLoading || statisticsLoading || rolesLoading || availablePagesLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center space-y-4">
          <RefreshCw className="h-12 w-12 animate-spin text-primary mx-auto" />
          <p className="text-muted-foreground">Loading Control Panel...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Settings className="h-8 w-8" />
            Admin Control Panel
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Manage system-wide page visibility and role-based permissions ({roles.length} roles, {availablePages.length} pages)
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            onClick={() => setShowRoleReference(!showRoleReference)}
            variant="outline"
            className="gap-2"
          >
            <Info className="h-4 w-4" />
            Role Reference
          </Button>
          <Button
            onClick={handleClearCache}
            disabled={clearingCache}
            variant="outline"
            className="gap-2"
            title={cacheStats ? `Cache: ${cacheStats.total} entries (${cacheStats.valid} valid, ${cacheStats.expired} expired)` : 'Clear permission cache'}
          >
            {clearingCache ? (
              <RefreshCw className="h-4 w-4 animate-spin" />
            ) : (
              <Trash2 className="h-4 w-4" />
            )}
            Clear Cache
            {cacheStats && cacheStats.total > 0 && (
              <Badge variant="secondary" className="ml-1">
                {cacheStats.total}
              </Badge>
            )}
          </Button>
          <Button
            onClick={handleInitializeDefaults}
            disabled={initializingDefaults}
            variant="default"
            className="gap-2"
          >
            {initializingDefaults ? (
              <RefreshCw className="h-4 w-4 animate-spin" />
            ) : (
              <Database className="h-4 w-4" />
            )}
            Initialize Defaults
          </Button>
          <Button
            onClick={() => setShowImportDialog(true)}
            variant="outline"
            className="gap-2"
          >
            <Upload className="h-4 w-4" />
            Import Config
          </Button>
          <Button onClick={handleExportConfig} variant="outline" className="gap-2">
            <Download className="h-4 w-4" />
            Export Config
          </Button>
        </div>
      </div>

      {/* Role Reference Panel */}
      <AnimatePresence>
        {showRoleReference && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3 }}
          >
            <div className="relative">
              <Button
                onClick={() => setShowRoleReference(false)}
                variant="ghost"
                size="sm"
                className="absolute top-4 right-4 z-10"
              >
                <X className="h-4 w-4" />
              </Button>
              <RoleReferenceCard />
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Layout: Stats + Tabs + Sidebar */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Statistics and Tabs (2/3 width) */}
        <div className="lg:col-span-2 space-y-6">
          {/* Statistics Cards */}
          {statistics && (
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    Total Pages
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{statistics.pages.total}</div>
                  <p className="text-xs text-muted-foreground mt-1">
                    Registered pages
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    Enabled
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-green-600">
                    {statistics.pages.enabled}
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    {statistics.pages.percentage_enabled}% of total
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    Disabled
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-red-600">
                    {statistics.pages.disabled}
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    Under construction
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    Recent Changes
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-blue-600">
                    {statistics.system.recent_changes_24h}
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    Last 24 hours
                  </p>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Role Statistics */}
          {roleStats.length > 0 && (
            <EnhancedRoleStats roleStats={roleStats} loading={roleStatsLoading} />
          )}

          {/* Tabs */}
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-7">
              <TabsTrigger value="global" className="gap-2">
                <Settings className="h-4 w-4" />
                <span className="hidden sm:inline">Global</span>
              </TabsTrigger>
              <TabsTrigger value="analytics" className="gap-2">
                <TrendingUp className="h-4 w-4" />
                <span className="hidden sm:inline">Analytics</span>
              </TabsTrigger>
              <TabsTrigger value="users" className="gap-2">
                <UserCog className="h-4 w-4" />
                <span className="hidden sm:inline">Users</span>
              </TabsTrigger>
              <TabsTrigger value="settings" className="gap-2">
                <Wrench className="h-4 w-4" />
                <span className="hidden sm:inline">Settings</span>
              </TabsTrigger>
              <TabsTrigger value="core" className="gap-2">
                <Shield className="h-4 w-4" />
                <span className="hidden sm:inline">Core</span>
                <Badge variant="secondary" className="ml-1 hidden md:inline-flex">
                  {groupedRoles.core.length}
                </Badge>
              </TabsTrigger>
              <TabsTrigger value="modern" className="gap-2">
                <Users className="h-4 w-4" />
                <span className="hidden sm:inline">Modern</span>
                <Badge variant="secondary" className="ml-1 hidden md:inline-flex">
                  {groupedRoles.modern.length}
                </Badge>
              </TabsTrigger>
              <TabsTrigger value="legacy" className="gap-2">
                <AlertTriangle className="h-4 w-4" />
                <span className="hidden sm:inline">Legacy</span>
                <Badge variant="outline" className="ml-1 border-orange-500 text-orange-600 hidden md:inline-flex">
                  {groupedRoles.legacy.length}
                </Badge>
              </TabsTrigger>
            </TabsList>

            {/* Analytics Tab */}
            <TabsContent value="analytics" className="space-y-6 mt-6">
              {/* System Statistics Dashboard */}
              {adminStatistics && (
                <SystemStatsDashboard
                  statistics={adminStatistics}
                  loading={adminStatisticsLoading}
                />
              )}

              {/* Role Statistics Chart */}
              {roleStats.length > 0 && (
                <RoleStatsChart data={roleStats} loading={roleStatsLoading} />
              )}

              {/* Audit Activity Chart */}
              {auditLog.length > 0 && (
                <AuditActivityChart logs={auditLog} loading={auditLogLoading} />
              )}

              {/* No Data Message */}
              {!adminStatisticsLoading && !roleStatsLoading && !auditLogLoading &&
                (!adminStatistics || roleStats.length === 0) && (
                  <Card>
                    <CardContent className="py-12">
                      <div className="text-center text-muted-foreground">
                        <TrendingUp className="h-12 w-12 mx-auto mb-4 opacity-50" />
                        <p>No analytics data available yet.</p>
                        <p className="text-sm mt-2">
                          Data will appear as the system is used and configured.
                        </p>
                      </div>
                    </CardContent>
                  </Card>
                )}
            </TabsContent>

            {/* User Management Tab */}
            <TabsContent value="users" className="space-y-6 mt-6">
              <UserManagementPanel />
            </TabsContent>

            {/* System Settings Tab */}
            <TabsContent value="settings" className="space-y-6 mt-6">
              <SystemSettingsPanel />
            </TabsContent>

            {/* Global Tab */}
            <TabsContent value="global" className="space-y-6 mt-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Wrench className="h-5 w-5" />
                    Bulk Actions (Global)
                  </CardTitle>
                  <CardDescription>
                    Enable or disable multiple pages globally
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex gap-4">
                    <Button
                      onClick={handleBulkEnable}
                      disabled={bulkActionLoading}
                      variant="outline"
                      className="gap-2"
                    >
                      <CheckCircle className="h-4 w-4" />
                      Enable All
                    </Button>
                    <Button
                      onClick={handleBulkDisable}
                      disabled={bulkActionLoading}
                      variant="outline"
                      className="gap-2"
                    >
                      <AlertTriangle className="h-4 w-4" />
                      Disable All
                    </Button>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <PieChart className="h-5 w-5" />
                    Page Control (Global)
                  </CardTitle>
                  <CardDescription>
                    Enable or disable specific modules for all users
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {globalPages.map((page, index) => (
                      <motion.div
                        key={page.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.03 }}
                      >
                        <div className="flex items-center justify-between p-4 border rounded-lg hover:bg-accent/50 transition-colors">
                          <div className="flex-1">
                            <div className="flex items-center gap-3">
                              <h3 className="font-semibold">{page.page_name}</h3>
                              <Badge variant="secondary" className="text-xs">
                                {page.page_name_en}
                              </Badge>
                              {page.is_enabled ? (
                                <Badge variant="default" className="bg-green-600">
                                  <Eye className="h-3 w-3 mr-1" />
                                  Enabled
                                </Badge>
                              ) : (
                                <Badge variant="destructive">
                                  <EyeOff className="h-3 w-3 mr-1" />
                                  Disabled
                                </Badge>
                              )}
                            </div>
                            <p className="text-sm text-muted-foreground mt-1">
                              {page.description || 'No description'}
                            </p>
                            <p className="text-xs text-muted-foreground mt-1">
                              Path: {page.path}
                            </p>
                          </div>
                          <div className="flex items-center gap-4">
                            <Switch
                              checked={page.is_enabled}
                              onCheckedChange={() => handleToggle(page.page_key, page.is_enabled)}
                            />
                          </div>
                        </div>
                        {index < globalPages.length - 1 && <Separator className="mt-4" />}
                      </motion.div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Core Roles Tab */}
            <TabsContent value="core" className="space-y-6 mt-6">
              {groupedRoles.core.map(roleKey => {
                const role = roles.find(r => r.key === roleKey);
                if (!role) return null;

                const Icon = getRoleIcon(role.key);

                return (
                  <div key={role.key}>
                    {/* Role Header */}
                    <div className="flex items-center justify-between mb-4">
                      <div>
                        <h2 className="text-2xl font-bold flex items-center gap-2">
                          <Icon className="h-6 w-6" />
                          {role.name}
                        </h2>
                        <p className="text-sm text-muted-foreground mt-1">
                          {role.description}
                        </p>
                      </div>
                    </div>

                    {/* Role Statistics */}
                    {rolePermissions[role.key] && (
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                        <Card>
                          <CardHeader className="pb-2">
                            <CardTitle className="text-sm font-medium text-muted-foreground">
                              Total Pages
                            </CardTitle>
                          </CardHeader>
                          <CardContent>
                            <div className="text-2xl font-bold">{rolePermissions[role.key].total_pages}</div>
                          </CardContent>
                        </Card>
                        <Card>
                          <CardHeader className="pb-2">
                            <CardTitle className="text-sm font-medium text-muted-foreground">
                              Enabled
                            </CardTitle>
                          </CardHeader>
                          <CardContent>
                            <div className="text-2xl font-bold text-green-600">
                              {rolePermissions[role.key].enabled_pages}
                            </div>
                          </CardContent>
                        </Card>
                        <Card>
                          <CardHeader className="pb-2">
                            <CardTitle className="text-sm font-medium text-muted-foreground">
                              Disabled
                            </CardTitle>
                          </CardHeader>
                          <CardContent>
                            <div className="text-2xl font-bold text-red-600">
                              {rolePermissions[role.key].total_pages - rolePermissions[role.key].enabled_pages}
                            </div>
                          </CardContent>
                        </Card>
                      </div>
                    )}

                    {/* Role Bulk Actions */}
                    <Card className="mb-6">
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                          <Wrench className="h-5 w-5" />
                          Bulk Actions for {role.key}
                        </CardTitle>
                        <CardDescription>
                          Enable or disable multiple pages for this role
                        </CardDescription>
                      </CardHeader>
                      <CardContent>
                        <div className="flex gap-4">
                          <Button
                            onClick={() => handleBulkRoleEnable(role.key)}
                            disabled={roleLoading[role.key]}
                            variant="outline"
                            className="gap-2"
                          >
                            <CheckCircle className="h-4 w-4" />
                            Enable All
                          </Button>
                          <Button
                            onClick={() => handleBulkRoleDisable(role.key)}
                            disabled={roleLoading[role.key]}
                            variant="outline"
                            className="gap-2"
                          >
                            <AlertTriangle className="h-4 w-4" />
                            Disable All
                          </Button>
                        </div>
                      </CardContent>
                    </Card>

                    {/* Role Permissions List */}
                    <Card>
                      <CardHeader>
                        <div className="flex items-center justify-between">
                          <div>
                            <CardTitle className="flex items-center gap-2">
                              <Activity className="h-5 w-5" />
                              Access Permissions - {role.key}
                            </CardTitle>
                            <CardDescription>
                              Control which pages this role can access ({availablePages.length} pages available)
                            </CardDescription>
                          </div>
                          {rolePermissions[role.key] && (
                            <div className="relative">
                              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                              <Input
                                placeholder="Search pages..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="pl-9 w-64"
                              />
                            </div>
                          )}
                        </div>
                      </CardHeader>
                      <CardContent>
                        {!rolePermissions[role.key] && !roleLoading[role.key] && (
                          <Button
                            onClick={() => fetchRolePermissions(role.key)}
                            variant="outline"
                            className="gap-2"
                          >
                            <RefreshCw className="h-4 w-4" />
                            Load Permissions
                          </Button>
                        )}

                        {roleLoading[role.key] && (
                          <div className="flex items-center justify-center py-8">
                            <RefreshCw className="h-6 w-6 animate-spin text-primary" />
                          </div>
                        )}

                        {rolePermissions[role.key] && (
                          <PageCategoryGroup
                            permissions={filterPermissions(rolePermissions[role.key].permissions).map(p => ({
                              ...p,
                              page_name: availablePages.find(ap => ap.key === p.page_key)?.name,
                              page_name_en: availablePages.find(ap => ap.key === p.page_key)?.name_en,
                              description: availablePages.find(ap => ap.key === p.page_key)?.description,
                            }))}
                            onToggle={(pageKey, currentState) => handleRoleToggle(role.key, pageKey, currentState)}
                          />
                        )}

                        {rolePermissions[role.key] && filterPermissions(rolePermissions[role.key].permissions).length === 0 && (
                          <div className="text-center py-8 text-muted-foreground">
                            No pages found matching "{searchQuery}"
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  </div>
                );
              })}
            </TabsContent>

            {/* Modern Roles Tab */}
            <TabsContent value="modern" className="space-y-6 mt-6">
              {groupedRoles.modern.map(roleKey => {
                const role = roles.find(r => r.key === roleKey);
                if (!role) return null;

                const Icon = getRoleIcon(role.key);

                return (
                  <div key={role.key}>
                    {/* Role Header */}
                    <div className="flex items-center justify-between mb-4">
                      <div>
                        <h2 className="text-2xl font-bold flex items-center gap-2">
                          <Icon className="h-6 w-6" />
                          {role.name}
                        </h2>
                        <p className="text-sm text-muted-foreground mt-1">
                          {role.description}
                        </p>
                      </div>
                    </div>

                    {/* Role Statistics */}
                    {rolePermissions[role.key] && (
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                        <Card>
                          <CardHeader className="pb-2">
                            <CardTitle className="text-sm font-medium text-muted-foreground">
                              Total Pages
                            </CardTitle>
                          </CardHeader>
                          <CardContent>
                            <div className="text-2xl font-bold">{rolePermissions[role.key].total_pages}</div>
                          </CardContent>
                        </Card>
                        <Card>
                          <CardHeader className="pb-2">
                            <CardTitle className="text-sm font-medium text-muted-foreground">
                              Enabled
                            </CardTitle>
                          </CardHeader>
                          <CardContent>
                            <div className="text-2xl font-bold text-green-600">
                              {rolePermissions[role.key].enabled_pages}
                            </div>
                          </CardContent>
                        </Card>
                        <Card>
                          <CardHeader className="pb-2">
                            <CardTitle className="text-sm font-medium text-muted-foreground">
                              Disabled
                            </CardTitle>
                          </CardHeader>
                          <CardContent>
                            <div className="text-2xl font-bold text-red-600">
                              {rolePermissions[role.key].total_pages - rolePermissions[role.key].enabled_pages}
                            </div>
                          </CardContent>
                        </Card>
                      </div>
                    )}

                    {/* Role Bulk Actions */}
                    <Card className="mb-6">
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                          <Wrench className="h-5 w-5" />
                          Bulk Actions for {role.key}
                        </CardTitle>
                        <CardDescription>
                          Enable or disable multiple pages for this role
                        </CardDescription>
                      </CardHeader>
                      <CardContent>
                        <div className="flex gap-4">
                          <Button
                            onClick={() => handleBulkRoleEnable(role.key)}
                            disabled={roleLoading[role.key]}
                            variant="outline"
                            className="gap-2"
                          >
                            <CheckCircle className="h-4 w-4" />
                            Enable All
                          </Button>
                          <Button
                            onClick={() => handleBulkRoleDisable(role.key)}
                            disabled={roleLoading[role.key]}
                            variant="outline"
                            className="gap-2"
                          >
                            <AlertTriangle className="h-4 w-4" />
                            Disable All
                          </Button>
                        </div>
                      </CardContent>
                    </Card>

                    {/* Role Permissions List */}
                    <Card>
                      <CardHeader>
                        <div className="flex items-center justify-between">
                          <div>
                            <CardTitle className="flex items-center gap-2">
                              <Activity className="h-5 w-5" />
                              Access Permissions - {role.key}
                            </CardTitle>
                            <CardDescription>
                              Control which pages this role can access ({availablePages.length} pages available)
                            </CardDescription>
                          </div>
                          {rolePermissions[role.key] && (
                            <div className="relative">
                              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                              <Input
                                placeholder="Search pages..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="pl-9 w-64"
                              />
                            </div>
                          )}
                        </div>
                      </CardHeader>
                      <CardContent>
                        {!rolePermissions[role.key] && !roleLoading[role.key] && (
                          <Button
                            onClick={() => fetchRolePermissions(role.key)}
                            variant="outline"
                            className="gap-2"
                          >
                            <RefreshCw className="h-4 w-4" />
                            Load Permissions
                          </Button>
                        )}

                        {roleLoading[role.key] && (
                          <div className="flex items-center justify-center py-8">
                            <RefreshCw className="h-6 w-6 animate-spin text-primary" />
                          </div>
                        )}

                        {rolePermissions[role.key] && (
                          <PageCategoryGroup
                            permissions={filterPermissions(rolePermissions[role.key].permissions).map(p => ({
                              ...p,
                              page_name: availablePages.find(ap => ap.key === p.page_key)?.name,
                              page_name_en: availablePages.find(ap => ap.key === p.page_key)?.name_en,
                              description: availablePages.find(ap => ap.key === p.page_key)?.description,
                            }))}
                            onToggle={(pageKey, currentState) => handleRoleToggle(role.key, pageKey, currentState)}
                          />
                        )}

                        {rolePermissions[role.key] && filterPermissions(rolePermissions[role.key].permissions).length === 0 && (
                          <div className="text-center py-8 text-muted-foreground">
                            No pages found matching "{searchQuery}"
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  </div>
                );
              })}
            </TabsContent>

            {/* Legacy Roles Tab */}
            <TabsContent value="legacy" className="space-y-6 mt-6">
              {/* Legacy Warning Banner */}
              <Card className="border-orange-500 bg-orange-50 dark:bg-orange-950/30">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-orange-600 dark:text-orange-400">
                    <AlertTriangle className="h-5 w-5" />
                    Legacy Roles - Deprecated
                  </CardTitle>
                  <CardDescription className="text-orange-600/80 dark:text-orange-400/80">
                    These roles are maintained for backward compatibility only. Please migrate users to modern roles (KANRININSHA or COORDINATOR) for full feature support.
                  </CardDescription>
                </CardHeader>
              </Card>

              {groupedRoles.legacy.map(roleKey => {
                const role = roles.find(r => r.key === roleKey);
                if (!role) return null;

                const Icon = getRoleIcon(role.key);

                return (
                  <div key={role.key}>
                    {/* Role Header */}
                    <div className="flex items-center justify-between mb-4">
                      <div>
                        <h2 className="text-2xl font-bold flex items-center gap-2">
                          <Icon className="h-6 w-6" />
                          {role.name}
                          <LegacyRoleBadge role={role.key as 'KEITOSAN' | 'TANTOSHA'} />
                        </h2>
                        <p className="text-sm text-muted-foreground mt-1">
                          {role.description}
                        </p>
                      </div>
                    </div>

                    {/* Role Statistics */}
                    {rolePermissions[role.key] && (
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                        <Card>
                          <CardHeader className="pb-2">
                            <CardTitle className="text-sm font-medium text-muted-foreground">
                              Total Pages
                            </CardTitle>
                          </CardHeader>
                          <CardContent>
                            <div className="text-2xl font-bold">{rolePermissions[role.key].total_pages}</div>
                          </CardContent>
                        </Card>
                        <Card>
                          <CardHeader className="pb-2">
                            <CardTitle className="text-sm font-medium text-muted-foreground">
                              Enabled
                            </CardTitle>
                          </CardHeader>
                          <CardContent>
                            <div className="text-2xl font-bold text-green-600">
                              {rolePermissions[role.key].enabled_pages}
                            </div>
                          </CardContent>
                        </Card>
                        <Card>
                          <CardHeader className="pb-2">
                            <CardTitle className="text-sm font-medium text-muted-foreground">
                              Disabled
                            </CardTitle>
                          </CardHeader>
                          <CardContent>
                            <div className="text-2xl font-bold text-red-600">
                              {rolePermissions[role.key].total_pages - rolePermissions[role.key].enabled_pages}
                            </div>
                          </CardContent>
                        </Card>
                      </div>
                    )}

                    {/* Role Bulk Actions */}
                    <Card className="mb-6">
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                          <Wrench className="h-5 w-5" />
                          Bulk Actions for {role.key}
                        </CardTitle>
                        <CardDescription>
                          Enable or disable multiple pages for this role
                        </CardDescription>
                      </CardHeader>
                      <CardContent>
                        <div className="flex gap-4">
                          <Button
                            onClick={() => handleBulkRoleEnable(role.key)}
                            disabled={roleLoading[role.key]}
                            variant="outline"
                            className="gap-2"
                          >
                            <CheckCircle className="h-4 w-4" />
                            Enable All
                          </Button>
                          <Button
                            onClick={() => handleBulkRoleDisable(role.key)}
                            disabled={roleLoading[role.key]}
                            variant="outline"
                            className="gap-2"
                          >
                            <AlertTriangle className="h-4 w-4" />
                            Disable All
                          </Button>
                        </div>
                      </CardContent>
                    </Card>

                    {/* Role Permissions List */}
                    <Card>
                      <CardHeader>
                        <div className="flex items-center justify-between">
                          <div>
                            <CardTitle className="flex items-center gap-2">
                              <Activity className="h-5 w-5" />
                              Access Permissions - {role.key}
                            </CardTitle>
                            <CardDescription>
                              Control which pages this role can access ({availablePages.length} pages available)
                            </CardDescription>
                          </div>
                          {rolePermissions[role.key] && (
                            <div className="relative">
                              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                              <Input
                                placeholder="Search pages..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="pl-9 w-64"
                              />
                            </div>
                          )}
                        </div>
                      </CardHeader>
                      <CardContent>
                        {!rolePermissions[role.key] && !roleLoading[role.key] && (
                          <Button
                            onClick={() => fetchRolePermissions(role.key)}
                            variant="outline"
                            className="gap-2"
                          >
                            <RefreshCw className="h-4 w-4" />
                            Load Permissions
                          </Button>
                        )}

                        {roleLoading[role.key] && (
                          <div className="flex items-center justify-center py-8">
                            <RefreshCw className="h-6 w-6 animate-spin text-primary" />
                          </div>
                        )}

                        {rolePermissions[role.key] && (
                          <PageCategoryGroup
                            permissions={filterPermissions(rolePermissions[role.key].permissions).map(p => ({
                              ...p,
                              page_name: availablePages.find(ap => ap.key === p.page_key)?.name,
                              page_name_en: availablePages.find(ap => ap.key === p.page_key)?.name_en,
                              description: availablePages.find(ap => ap.key === p.page_key)?.description,
                            }))}
                            onToggle={(pageKey, currentState) => handleRoleToggle(role.key, pageKey, currentState)}
                          />
                        )}

                        {rolePermissions[role.key] && filterPermissions(rolePermissions[role.key].permissions).length === 0 && (
                          <div className="text-center py-8 text-muted-foreground">
                            No pages found matching "{searchQuery}"
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  </div>
                );
              })}
            </TabsContent>
          </Tabs>
        </div>

        {/* Right Column: Audit Trail Sidebar (1/3 width) */}
        <div className="lg:col-span-1">
          <div className="sticky top-6">
            <AuditTrailPanel
              recentChanges={auditLog}
              loading={auditLogLoading}
              onRefresh={fetchAuditLog}
            />
          </div>
        </div>
      </div>

      {/* System Information */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5" />
              System Information
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <p className="text-sm">
              <strong>Roles Configured:</strong>{' '}
              <Badge variant="default">{roles.length} roles</Badge>
            </p>
            <p className="text-sm">
              <strong>Pages Available:</strong>{' '}
              <Badge variant="default">{availablePages.length} pages</Badge>
            </p>
            <p className="text-sm">
              <strong>Maintenance Mode:</strong>{' '}
              {statistics?.system.maintenance_mode ? (
                <Badge variant="destructive">Active</Badge>
              ) : (
                <Badge variant="default" className="bg-green-600">Inactive</Badge>
              )}
            </p>
            <Separator className="my-2" />
            <p className="text-sm text-muted-foreground">
              Disabled pages show an "Under construction" message to users
            </p>
            <p className="text-sm text-muted-foreground">
              Role permissions provide granular control over page access per user role
            </p>
            <p className="text-sm text-muted-foreground">
              Use "Initialize Defaults" to restore default permissions for all roles
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <Database className="h-5 w-5" />
                Permission Cache
              </CardTitle>
              <Button
                onClick={handleClearExpiredCache}
                variant="ghost"
                size="sm"
                className="gap-1"
              >
                <RefreshCw className="h-3 w-3" />
                Clear Expired
              </Button>
            </div>
            <CardDescription>
              Client-side caching reduces API calls and improves performance
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {cacheStats ? (
              <>
                <div className="grid grid-cols-3 gap-2">
                  <div className="text-center p-3 border rounded-lg">
                    <div className="text-2xl font-bold text-primary">{cacheStats.total}</div>
                    <div className="text-xs text-muted-foreground">Total Entries</div>
                  </div>
                  <div className="text-center p-3 border rounded-lg">
                    <div className="text-2xl font-bold text-green-600">{cacheStats.valid}</div>
                    <div className="text-xs text-muted-foreground">Valid</div>
                  </div>
                  <div className="text-center p-3 border rounded-lg">
                    <div className="text-2xl font-bold text-orange-600">{cacheStats.expired}</div>
                    <div className="text-xs text-muted-foreground">Expired</div>
                  </div>
                </div>
                <Separator />
                <div className="space-y-1">
                  <p className="text-sm">
                    <strong>Cache Size:</strong>{' '}
                    <Badge variant="secondary">
                      {(getTotalCacheSize() / 1024).toFixed(2)} KB
                    </Badge>
                  </p>
                  <p className="text-sm">
                    <strong>TTL:</strong>{' '}
                    <Badge variant="secondary">5 minutes</Badge>
                  </p>
                  <p className="text-xs text-muted-foreground mt-2">
                    Cache automatically clears on logout and permission changes
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Expired entries are auto-cleaned every 5 minutes
                  </p>
                </div>
              </>
            ) : (
              <div className="text-center py-4 text-muted-foreground">
                No cache data available
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Bulk Action Confirmation Dialog */}
      <AlertDialog open={bulkDialog.isOpen} onOpenChange={(open) => !open && setBulkDialog({ isOpen: false, action: null, scope: null, affectedCount: 0 })}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              {bulkDialog.action === 'enable' ? (
                <CheckCircle className="h-5 w-5 text-green-600" />
              ) : (
                <AlertTriangle className="h-5 w-5 text-orange-600" />
              )}
              Confirm Bulk {bulkDialog.action === 'enable' ? 'Enable' : 'Disable'}
            </AlertDialogTitle>
            <AlertDialogDescription>
              <div className="space-y-3">
                <p>
                  You are about to {bulkDialog.action} <strong>{bulkDialog.affectedCount}</strong> pages
                  {bulkDialog.scope === 'role' && bulkDialog.roleKey && ` for role ${bulkDialog.roleKey}`}.
                </p>
                <div className="p-3 bg-muted rounded-lg">
                  <p className="text-sm font-medium">Impact Preview:</p>
                  <ul className="text-sm mt-2 space-y-1">
                    <li>• {bulkDialog.affectedCount} pages will be {bulkDialog.action}d</li>
                    {bulkDialog.scope === 'global' && (
                      <li>• This affects all users across all roles</li>
                    )}
                    {bulkDialog.scope === 'role' && (
                      <li>• This affects only users with role {bulkDialog.roleKey}</li>
                    )}
                    <li>• Changes take effect immediately</li>
                  </ul>
                </div>
                <p className="text-xs text-muted-foreground">
                  This action can be reversed by using the opposite bulk action.
                </p>
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={executeBulkAction}>
              {bulkDialog.action === 'enable' ? 'Enable' : 'Disable'} {bulkDialog.affectedCount} Pages
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Import Config Dialog */}
      <ImportConfigDialog
        open={showImportDialog}
        onOpenChange={setShowImportDialog}
        onSuccess={handleImportSuccess}
      />
    </div>
  );
}
