'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  Settings,
  RefreshCw,
  AlertTriangle,
  CheckCircle,
  Database,
  Info,
  Mail,
  Flag,
  Edit2,
  Power,
  Clock,
  Users,
  Activity,
  HardDrive,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
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
import { systemSettingsService, type SystemSetting, type MaintenanceMode, type AdminStatistics } from '@/lib/api';
import { SettingEditDialog } from './setting-edit-dialog';

export function SystemSettingsPanel() {
  const [settings, setSettings] = useState<SystemSetting[]>([]);
  const [statistics, setStatistics] = useState<AdminStatistics | null>(null);
  const [maintenanceMode, setMaintenanceMode] = useState(false);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Dialog states
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [selectedSetting, setSelectedSetting] = useState<SystemSetting | null>(null);
  const [maintenanceDialogOpen, setMaintenanceDialogOpen] = useState(false);
  const [maintenanceDialogAction, setMaintenanceDialogAction] = useState<'enable' | 'disable'>('enable');

  // Fetch all data
  const fetchData = async () => {
    try {
      setLoading(true);
      const [settingsData, statsData] = await Promise.all([
        systemSettingsService.getAllSettings(),
        systemSettingsService.getStatistics(),
      ]);

      setSettings(settingsData);
      setStatistics(statsData);

      // Extract maintenance mode from statistics
      setMaintenanceMode(statsData.maintenance_mode);
    } catch (error: any) {
      console.error('Error fetching system settings:', error);
      toast.error('Failed to load system settings');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchData();
    setRefreshing(false);
    toast.success('System settings refreshed');
  };

  const handleEditSetting = (setting: SystemSetting) => {
    setSelectedSetting(setting);
    setEditDialogOpen(true);
  };

  const handleSaveSetting = async (key: string, value: any) => {
    await systemSettingsService.updateSetting(key, value);
    await fetchData(); // Refresh data
  };

  const handleMaintenanceModeToggle = (enabled: boolean) => {
    setMaintenanceDialogAction(enabled ? 'enable' : 'disable');
    setMaintenanceDialogOpen(true);
  };

  const confirmMaintenanceModeToggle = async () => {
    try {
      const enabled = maintenanceDialogAction === 'enable';
      await systemSettingsService.toggleMaintenanceMode(enabled);
      setMaintenanceMode(enabled);
      toast.success(`Maintenance mode ${enabled ? 'enabled' : 'disabled'} successfully`);
      setMaintenanceDialogOpen(false);
      await fetchData(); // Refresh statistics
    } catch (error: any) {
      console.error('Error toggling maintenance mode:', error);
      toast.error('Failed to toggle maintenance mode');
    }
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            System Settings
          </CardTitle>
          <CardDescription>Loading system settings...</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <RefreshCw className="h-8 w-8 animate-spin text-primary" />
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold flex items-center gap-2">
              <Settings className="h-6 w-6" />
              System Settings
            </h2>
            <p className="text-sm text-muted-foreground mt-1">
              Manage system-wide settings and maintenance mode
            </p>
          </div>
          <Button
            onClick={handleRefresh}
            variant="outline"
            disabled={refreshing}
            className="gap-2"
          >
            <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>

        {/* Maintenance Mode - Prominent Section */}
        <Card className={`border-2 ${maintenanceMode ? 'border-red-500 bg-red-50 dark:bg-red-950/30' : 'border-yellow-500 bg-yellow-50 dark:bg-yellow-950/30'}`}>
          <CardHeader>
            <CardTitle className={`flex items-center gap-2 ${maintenanceMode ? 'text-red-600 dark:text-red-400' : 'text-yellow-600 dark:text-yellow-400'}`}>
              <Power className="h-5 w-5" />
              Maintenance Mode
            </CardTitle>
            <CardDescription className={maintenanceMode ? 'text-red-600/80 dark:text-red-400/80' : 'text-yellow-600/80 dark:text-yellow-400/80'}>
              When enabled, only administrators can access the system
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium">Status:</span>
                  {maintenanceMode ? (
                    <Badge variant="destructive" className="gap-1">
                      <AlertTriangle className="h-3 w-3" />
                      ENABLED
                    </Badge>
                  ) : (
                    <Badge variant="default" className="bg-green-600 gap-1">
                      <CheckCircle className="h-3 w-3" />
                      DISABLED
                    </Badge>
                  )}
                </div>
                <p className="text-sm text-muted-foreground">
                  {maintenanceMode
                    ? 'System is in maintenance mode. Only admins can access.'
                    : 'System is operational. All users can access.'}
                </p>
              </div>
              <Switch
                checked={maintenanceMode}
                onCheckedChange={handleMaintenanceModeToggle}
                className="data-[state=checked]:bg-red-600"
              />
            </div>
          </CardContent>
        </Card>

        {/* System Information Card */}
        {statistics && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Info className="h-5 w-5" />
                System Information
              </CardTitle>
              <CardDescription>Current system status and statistics</CardDescription>
            </CardHeader>
            <CardContent>
              <dl className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <div className="flex items-center gap-3 p-3 bg-muted rounded-lg">
                  <Users className="h-8 w-8 text-primary" />
                  <div>
                    <dt className="text-sm text-muted-foreground">Total Users</dt>
                    <dd className="text-2xl font-bold">{statistics.total_users}</dd>
                  </div>
                </div>
                <div className="flex items-center gap-3 p-3 bg-muted rounded-lg">
                  <Activity className="h-8 w-8 text-green-600" />
                  <div>
                    <dt className="text-sm text-muted-foreground">Active Users</dt>
                    <dd className="text-2xl font-bold">{statistics.active_users}</dd>
                  </div>
                </div>
                <div className="flex items-center gap-3 p-3 bg-muted rounded-lg">
                  <Users className="h-8 w-8 text-blue-600" />
                  <div>
                    <dt className="text-sm text-muted-foreground">Candidates</dt>
                    <dd className="text-2xl font-bold">{statistics.total_candidates}</dd>
                  </div>
                </div>
                <div className="flex items-center gap-3 p-3 bg-muted rounded-lg">
                  <Users className="h-8 w-8 text-purple-600" />
                  <div>
                    <dt className="text-sm text-muted-foreground">Employees</dt>
                    <dd className="text-2xl font-bold">{statistics.total_employees}</dd>
                  </div>
                </div>
                <div className="flex items-center gap-3 p-3 bg-muted rounded-lg">
                  <HardDrive className="h-8 w-8 text-orange-600" />
                  <div>
                    <dt className="text-sm text-muted-foreground">Factories</dt>
                    <dd className="text-2xl font-bold">{statistics.total_factories}</dd>
                  </div>
                </div>
                {statistics.database_size && (
                  <div className="flex items-center gap-3 p-3 bg-muted rounded-lg">
                    <Database className="h-8 w-8 text-gray-600" />
                    <div>
                      <dt className="text-sm text-muted-foreground">Database Size</dt>
                      <dd className="text-2xl font-bold">{statistics.database_size}</dd>
                    </div>
                  </div>
                )}
                {statistics.uptime && (
                  <div className="flex items-center gap-3 p-3 bg-muted rounded-lg">
                    <Clock className="h-8 w-8 text-indigo-600" />
                    <div>
                      <dt className="text-sm text-muted-foreground">Uptime</dt>
                      <dd className="text-2xl font-bold">{statistics.uptime}</dd>
                    </div>
                  </div>
                )}
              </dl>
            </CardContent>
          </Card>
        )}

        {/* General Settings */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Settings className="h-5 w-5" />
              General Settings
            </CardTitle>
            <CardDescription>
              System-wide configuration settings ({settings.length} settings)
            </CardDescription>
          </CardHeader>
          <CardContent>
            {settings.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Settings className="h-12 w-12 mx-auto mb-4 opacity-20" />
                <p>No settings configured</p>
              </div>
            ) : (
              <div className="border rounded-lg overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-[250px]">Setting Key</TableHead>
                      <TableHead>Value</TableHead>
                      <TableHead>Description</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {settings.map((setting, index) => (
                      <motion.tr
                        key={setting.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.02 }}
                        className="border-b hover:bg-accent/50 transition-colors"
                      >
                        <TableCell className="font-medium font-mono text-sm">
                          {setting.key}
                        </TableCell>
                        <TableCell>
                          <code className="px-2 py-1 bg-muted rounded text-sm">
                            {setting.value || <span className="text-muted-foreground">null</span>}
                          </code>
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {setting.description || '-'}
                        </TableCell>
                        <TableCell className="text-right">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleEditSetting(setting)}
                            className="gap-1"
                          >
                            <Edit2 className="h-4 w-4" />
                            Edit
                          </Button>
                        </TableCell>
                      </motion.tr>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Edit Setting Dialog */}
      <SettingEditDialog
        open={editDialogOpen}
        onOpenChange={setEditDialogOpen}
        setting={selectedSetting}
        onSave={handleSaveSetting}
      />

      {/* Maintenance Mode Confirmation Dialog */}
      <AlertDialog open={maintenanceDialogOpen} onOpenChange={setMaintenanceDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              {maintenanceDialogAction === 'enable' ? (
                <AlertTriangle className="h-5 w-5 text-red-600" />
              ) : (
                <CheckCircle className="h-5 w-5 text-green-600" />
              )}
              {maintenanceDialogAction === 'enable' ? 'Enable' : 'Disable'} Maintenance Mode
            </AlertDialogTitle>
            <AlertDialogDescription>
              <div className="space-y-3">
                <p>
                  Are you sure you want to <strong>{maintenanceDialogAction}</strong> maintenance mode?
                </p>
                {maintenanceDialogAction === 'enable' ? (
                  <div className="p-3 bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800 rounded-lg">
                    <p className="text-sm font-medium text-red-600 dark:text-red-400">Warning:</p>
                    <ul className="text-sm mt-2 space-y-1 text-red-600/80 dark:text-red-400/80">
                      <li>• All non-admin users will be locked out</li>
                      <li>• Active sessions will be terminated</li>
                      <li>• Only administrators can access the system</li>
                      <li>• All pages will be disabled globally</li>
                    </ul>
                  </div>
                ) : (
                  <div className="p-3 bg-green-50 dark:bg-green-950/30 border border-green-200 dark:border-green-800 rounded-lg">
                    <p className="text-sm font-medium text-green-600 dark:text-green-400">This will:</p>
                    <ul className="text-sm mt-2 space-y-1 text-green-600/80 dark:text-green-400/80">
                      <li>• Allow all users to access the system</li>
                      <li>• Restore normal operations</li>
                      <li>• Re-enable all pages</li>
                    </ul>
                  </div>
                )}
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmMaintenanceModeToggle}
              className={maintenanceDialogAction === 'enable' ? 'bg-red-600 hover:bg-red-700' : 'bg-green-600 hover:bg-green-700'}
            >
              {maintenanceDialogAction === 'enable' ? 'Enable' : 'Disable'} Maintenance Mode
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
