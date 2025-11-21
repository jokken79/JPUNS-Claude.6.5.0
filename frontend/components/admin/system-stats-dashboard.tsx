'use client';

import {
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  RadialBarChart,
  RadialBar,
} from 'recharts';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Database, Users, Building2, UserCheck, TrendingUp, PieChart as PieChartIcon } from 'lucide-react';
import type { AdminStatistics } from '@/lib/api';

interface SystemStatsDashboardProps {
  statistics: AdminStatistics;
  loading?: boolean;
}

const ENTITY_COLORS = {
  candidates: '#3b82f6', // blue-500
  employees: '#10b981', // green-500
  factories: '#f59e0b', // amber-500
};

const USER_STATUS_COLORS = {
  active: '#10b981', // green-500
  inactive: '#6b7280', // gray-500
};

const CustomPieLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent, name }: any) => {
  const RADIAN = Math.PI / 180;
  const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
  const x = cx + radius * Math.cos(-midAngle * RADIAN);
  const y = cy + radius * Math.sin(-midAngle * RADIAN);

  if (percent < 0.05) return null; // Don't show label if too small

  return (
    <text
      x={x}
      y={y}
      fill="white"
      textAnchor={x > cx ? 'start' : 'end'}
      dominantBaseline="central"
      className="text-xs font-bold"
    >
      {`${(percent * 100).toFixed(0)}%`}
    </text>
  );
};

const CustomTooltip = ({ active, payload }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-popover border border-border rounded-lg shadow-lg p-3">
        <p className="font-bold text-sm mb-1">{payload[0].name}</p>
        <p className="text-xs text-muted-foreground">
          Count: <span className="font-medium text-foreground">{payload[0].value}</span>
        </p>
        {payload[0].payload.percent && (
          <p className="text-xs text-muted-foreground">
            Percentage: <span className="font-medium text-foreground">
              {(payload[0].payload.percent * 100).toFixed(1)}%
            </span>
          </p>
        )}
      </div>
    );
  }
  return null;
};

export function SystemStatsDashboard({ statistics, loading = false }: SystemStatsDashboardProps) {
  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <Card key={i}>
            <CardHeader>
              <div className="h-6 w-32 bg-muted animate-pulse rounded" />
            </CardHeader>
            <CardContent>
              <div className="h-[250px] bg-muted animate-pulse rounded" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  // Prepare entity distribution data for pie chart
  const entityData = [
    {
      name: 'Candidates',
      value: statistics.total_candidates,
      color: ENTITY_COLORS.candidates,
      icon: Users,
    },
    {
      name: 'Employees',
      value: statistics.total_employees,
      color: ENTITY_COLORS.employees,
      icon: UserCheck,
    },
    {
      name: 'Factories',
      value: statistics.total_factories,
      color: ENTITY_COLORS.factories,
      icon: Building2,
    },
  ].filter(item => item.value > 0); // Only show non-zero entities

  // Prepare user status data for bar chart
  const userStatusData = [
    {
      status: 'Active',
      count: statistics.active_users,
      fill: USER_STATUS_COLORS.active,
    },
    {
      status: 'Inactive',
      count: statistics.total_users - statistics.active_users,
      fill: USER_STATUS_COLORS.inactive,
    },
  ];

  // Prepare radial data for user activity percentage
  const activityPercentage = statistics.total_users > 0
    ? (statistics.active_users / statistics.total_users) * 100
    : 0;

  const radialData = [
    {
      name: 'Active Users',
      value: activityPercentage,
      fill: USER_STATUS_COLORS.active,
    },
  ];

  const totalEntities = statistics.total_candidates + statistics.total_employees + statistics.total_factories;

  return (
    <div className="space-y-4">
      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <Users className="h-4 w-4" />
              Total Users
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{statistics.total_users}</div>
            <p className="text-xs text-muted-foreground mt-1">
              {statistics.active_users} active
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <Users className="h-4 w-4" />
              Candidates
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">
              {statistics.total_candidates}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Resume database
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <UserCheck className="h-4 w-4" />
              Employees
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {statistics.total_employees}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Active workers
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <Building2 className="h-4 w-4" />
              Factories
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-amber-600">
              {statistics.total_factories}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Client sites
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Entity Distribution Pie Chart */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <PieChartIcon className="h-4 w-4" />
              Entity Distribution
            </CardTitle>
            <CardDescription>
              Breakdown of system entities ({totalEntities} total)
            </CardDescription>
          </CardHeader>
          <CardContent>
            {entityData.length > 0 ? (
              <div className="space-y-4">
                <ResponsiveContainer width="100%" height={250}>
                  <PieChart>
                    <Pie
                      data={entityData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={CustomPieLabel}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {entityData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip content={<CustomTooltip />} />
                  </PieChart>
                </ResponsiveContainer>

                {/* Legend */}
                <div className="flex flex-wrap justify-center gap-3">
                  {entityData.map((entry) => {
                    const Icon = entry.icon;
                    return (
                      <div key={entry.name} className="flex items-center gap-2">
                        <div
                          className="w-3 h-3 rounded-full"
                          style={{ backgroundColor: entry.color }}
                        />
                        <Icon className="h-4 w-4" style={{ color: entry.color }} />
                        <span className="text-xs font-medium">{entry.name}</span>
                        <Badge variant="secondary" className="text-xs">
                          {entry.value}
                        </Badge>
                      </div>
                    );
                  })}
                </div>
              </div>
            ) : (
              <div className="h-[250px] flex items-center justify-center text-muted-foreground">
                No entity data available
              </div>
            )}
          </CardContent>
        </Card>

        {/* User Status Bar Chart */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <TrendingUp className="h-4 w-4" />
              User Activity Status
            </CardTitle>
            <CardDescription>
              Active vs inactive users ({statistics.total_users} total)
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={userStatusData} margin={{ top: 20, right: 30, left: 0, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis dataKey="status" className="text-xs" />
                <YAxis className="text-xs" />
                <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(0, 0, 0, 0.05)' }} />
                <Bar dataKey="count" radius={[8, 8, 0, 0]}>
                  {userStatusData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.fill} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>

            {/* Activity Percentage */}
            <div className="text-center pt-2 border-t border-border mt-2">
              <div className="text-2xl font-bold text-green-600">
                {activityPercentage.toFixed(1)}%
              </div>
              <div className="text-xs text-muted-foreground">User Activity Rate</div>
            </div>
          </CardContent>
        </Card>

        {/* User Activity Radial Chart */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <UserCheck className="h-4 w-4" />
              Activity Gauge
            </CardTitle>
            <CardDescription>
              Percentage of active users in the system
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <RadialBarChart
                cx="50%"
                cy="50%"
                innerRadius="60%"
                outerRadius="90%"
                barSize={20}
                data={radialData}
                startAngle={180}
                endAngle={0}
              >
                <RadialBar
                  background
                  dataKey="value"
                  cornerRadius={10}
                  fill={USER_STATUS_COLORS.active}
                />
                <text
                  x="50%"
                  y="50%"
                  textAnchor="middle"
                  dominantBaseline="middle"
                  className="text-3xl font-bold fill-foreground"
                >
                  {activityPercentage.toFixed(0)}%
                </text>
                <text
                  x="50%"
                  y="60%"
                  textAnchor="middle"
                  dominantBaseline="middle"
                  className="text-xs fill-muted-foreground"
                >
                  Active Users
                </text>
              </RadialBarChart>
            </ResponsiveContainer>

            <div className="grid grid-cols-2 gap-2 text-center pt-2 border-t border-border mt-2">
              <div>
                <div className="text-lg font-bold text-green-600">
                  {statistics.active_users}
                </div>
                <div className="text-xs text-muted-foreground">Active</div>
              </div>
              <div>
                <div className="text-lg font-bold text-gray-600">
                  {statistics.total_users - statistics.active_users}
                </div>
                <div className="text-xs text-muted-foreground">Inactive</div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* System Information Card */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Database className="h-4 w-4" />
              System Information
            </CardTitle>
            <CardDescription>
              Database and system status
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {/* Maintenance Mode */}
              <div className="flex items-center justify-between p-3 border rounded-lg">
                <div className="flex items-center gap-2">
                  <div
                    className={`h-3 w-3 rounded-full ${
                      statistics.maintenance_mode ? 'bg-red-500' : 'bg-green-500'
                    }`}
                  />
                  <span className="text-sm font-medium">Maintenance Mode</span>
                </div>
                <Badge
                  variant={statistics.maintenance_mode ? 'destructive' : 'default'}
                  className={statistics.maintenance_mode ? '' : 'bg-green-600'}
                >
                  {statistics.maintenance_mode ? 'Active' : 'Inactive'}
                </Badge>
              </div>

              {/* Database Size */}
              {statistics.database_size && (
                <div className="flex items-center justify-between p-3 border rounded-lg">
                  <span className="text-sm font-medium">Database Size</span>
                  <Badge variant="secondary">{statistics.database_size}</Badge>
                </div>
              )}

              {/* System Uptime */}
              {statistics.uptime && (
                <div className="flex items-center justify-between p-3 border rounded-lg">
                  <span className="text-sm font-medium">System Uptime</span>
                  <Badge variant="secondary">{statistics.uptime}</Badge>
                </div>
              )}

              {/* Total Entities */}
              <div className="flex items-center justify-between p-3 border rounded-lg bg-primary/5">
                <span className="text-sm font-medium">Total Entities</span>
                <Badge className="text-base">{totalEntities}</Badge>
              </div>

              {/* Quick Stats */}
              <div className="grid grid-cols-3 gap-2 pt-2">
                <div className="text-center p-2 border rounded-lg">
                  <div className="text-lg font-bold text-blue-600">
                    {statistics.total_candidates}
                  </div>
                  <div className="text-[10px] text-muted-foreground">Candidates</div>
                </div>
                <div className="text-center p-2 border rounded-lg">
                  <div className="text-lg font-bold text-green-600">
                    {statistics.total_employees}
                  </div>
                  <div className="text-[10px] text-muted-foreground">Employees</div>
                </div>
                <div className="text-center p-2 border rounded-lg">
                  <div className="text-lg font-bold text-amber-600">
                    {statistics.total_factories}
                  </div>
                  <div className="text-[10px] text-muted-foreground">Factories</div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
