'use client';

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Cell } from 'recharts';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { TrendingUp, Shield } from 'lucide-react';
import type { RoleStatsResponse } from '@/lib/api';

interface RoleStatsChartProps {
  data: RoleStatsResponse[];
  loading?: boolean;
}

// Color scheme for roles
const ROLE_COLORS = {
  SUPER_ADMIN: '#10b981', // green-500
  ADMIN: '#059669', // green-600
  COORDINATOR: '#3b82f6', // blue-500
  KANRININSHA: '#6366f1', // indigo-500
  EMPLOYEE: '#f59e0b', // amber-500
  CONTRACT_WORKER: '#ef4444', // red-500
  KEITOSAN: '#f97316', // orange-500 (legacy)
  TANTOSHA: '#f97316', // orange-500 (legacy)
};

const getProgressColor = (percentage: number): string => {
  if (percentage >= 80) return '#10b981'; // green-500
  if (percentage >= 50) return '#f59e0b'; // amber-500
  return '#ef4444'; // red-500
};

const CustomTooltip = ({ active, payload }: any) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    return (
      <div className="bg-popover border border-border rounded-lg shadow-lg p-3">
        <p className="font-bold text-sm mb-2">{data.role_name}</p>
        <div className="space-y-1 text-xs">
          <p className="text-green-600 dark:text-green-400">
            <span className="font-medium">Enabled:</span> {data.enabled_pages} pages
          </p>
          <p className="text-red-600 dark:text-red-400">
            <span className="font-medium">Disabled:</span> {data.disabled_pages} pages
          </p>
          <p className="text-muted-foreground">
            <span className="font-medium">Total:</span> {data.total_pages} pages
          </p>
          <div className="pt-1 mt-1 border-t border-border">
            <p className="font-bold">
              Access Level: {data.percentage.toFixed(1)}%
            </p>
          </div>
        </div>
      </div>
    );
  }
  return null;
};

const CustomYAxisTick = ({ x, y, payload }: any) => {
  const roleKey = payload.value;
  const isLegacy = roleKey === 'KEITOSAN' || roleKey === 'TANTOSHA';

  return (
    <g transform={`translate(${x},${y})`}>
      <text
        x={0}
        y={0}
        dy={4}
        textAnchor="end"
        fill="currentColor"
        className="text-xs font-medium"
      >
        {roleKey}
      </text>
      {isLegacy && (
        <text
          x={0}
          y={12}
          textAnchor="end"
          className="text-[10px] fill-orange-500"
        >
          (Legacy)
        </text>
      )}
    </g>
  );
};

export function RoleStatsChart({ data, loading = false }: RoleStatsChartProps) {
  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Role Permission Distribution
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-[400px] flex items-center justify-center">
            <div className="text-center space-y-2">
              <div className="h-8 w-8 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto" />
              <p className="text-sm text-muted-foreground">Loading chart data...</p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!data || data.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Role Permission Distribution
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-[400px] flex items-center justify-center">
            <p className="text-muted-foreground">No role statistics available</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Sort roles by hierarchy (SUPER_ADMIN first)
  const sortedData = [...data].sort((a, b) => {
    const order = ['SUPER_ADMIN', 'ADMIN', 'COORDINATOR', 'KANRININSHA', 'EMPLOYEE', 'CONTRACT_WORKER', 'KEITOSAN', 'TANTOSHA'];
    return order.indexOf(a.role_key) - order.indexOf(b.role_key);
  });

  // Transform data for stacked bar chart
  const chartData = sortedData.map(role => ({
    role_key: role.role_key,
    role_name: role.role_name,
    enabled_pages: role.enabled_pages,
    disabled_pages: role.disabled_pages,
    total_pages: role.total_pages,
    percentage: role.percentage,
  }));

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <TrendingUp className="h-5 w-5" />
          Role Permission Distribution
        </CardTitle>
        <CardDescription>
          Visual comparison of enabled vs disabled pages across all roles ({data.length} roles)
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {/* Legend */}
          <div className="flex items-center justify-center gap-6 text-sm">
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-green-500 rounded" />
              <span>Enabled Pages</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-red-500 rounded" />
              <span>Disabled Pages</span>
            </div>
          </div>

          {/* Chart */}
          <ResponsiveContainer width="100%" height={400} className="text-sm">
            <BarChart
              data={chartData}
              layout="vertical"
              margin={{ top: 5, right: 30, left: 120, bottom: 5 }}
            >
              <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
              <XAxis
                type="number"
                domain={[0, Math.max(...chartData.map(d => d.total_pages))]}
                className="text-xs"
              />
              <YAxis
                type="category"
                dataKey="role_key"
                width={110}
                tick={<CustomYAxisTick />}
              />
              <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(0, 0, 0, 0.05)' }} />
              <Bar
                dataKey="enabled_pages"
                stackId="a"
                fill="#10b981"
                name="Enabled Pages"
                radius={[0, 0, 0, 0]}
              />
              <Bar
                dataKey="disabled_pages"
                stackId="a"
                fill="#ef4444"
                name="Disabled Pages"
                radius={[0, 4, 4, 0]}
              />
            </BarChart>
          </ResponsiveContainer>

          {/* Summary Statistics */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-4 border-t border-border">
            <div className="text-center">
              <div className="text-2xl font-bold text-primary">
                {data.reduce((sum, role) => sum + role.enabled_pages, 0)}
              </div>
              <div className="text-xs text-muted-foreground">Total Enabled</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-red-600">
                {data.reduce((sum, role) => sum + role.disabled_pages, 0)}
              </div>
              <div className="text-xs text-muted-foreground">Total Disabled</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">
                {Math.round(data.reduce((sum, role) => sum + role.percentage, 0) / data.length)}%
              </div>
              <div className="text-xs text-muted-foreground">Avg Access Level</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">{data.length}</div>
              <div className="text-xs text-muted-foreground">Total Roles</div>
            </div>
          </div>

          {/* Accessibility Note */}
          <div className="text-xs text-muted-foreground text-center pt-2">
            Hover over bars for detailed information. Legacy roles are marked with (Legacy) label.
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
