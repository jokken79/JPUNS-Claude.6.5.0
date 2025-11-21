'use client';

import { useState, useMemo } from 'react';
import {
  LineChart,
  Line,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Activity, Clock } from 'lucide-react';
import type { AuditLogEntry } from '@/lib/api';
import { format, parseISO, subHours, startOfHour, differenceInHours } from 'date-fns';

interface AuditActivityChartProps {
  logs: AuditLogEntry[];
  loading?: boolean;
}

interface HourlyData {
  hour: string;
  hourLabel: string;
  timestamp: Date;
  total: number;
  enable: number;
  disable: number;
  bulk_enable: number;
  bulk_disable: number;
  update: number;
}

type ChartType = 'line' | 'area';

const ACTION_COLORS = {
  enable: '#10b981', // green-500
  disable: '#ef4444', // red-500
  bulk_enable: '#059669', // green-600
  bulk_disable: '#dc2626', // red-600
  update: '#3b82f6', // blue-500
};

const ACTION_LABELS = {
  enable: 'Single Enable',
  disable: 'Single Disable',
  bulk_enable: 'Bulk Enable',
  bulk_disable: 'Bulk Disable',
  update: 'Update',
};

const aggregateLogsByHour = (logs: AuditLogEntry[]): HourlyData[] => {
  const now = new Date();
  const hoursToShow = 24;

  // Initialize all hours in the last 24 hours with zero counts
  const hourlyMap = new Map<string, HourlyData>();
  for (let i = hoursToShow - 1; i >= 0; i--) {
    const hourTime = startOfHour(subHours(now, i));
    const hourKey = hourTime.toISOString().slice(0, 13); // "2025-11-13T10"

    hourlyMap.set(hourKey, {
      hour: hourKey,
      hourLabel: format(hourTime, 'HH:mm'),
      timestamp: hourTime,
      total: 0,
      enable: 0,
      disable: 0,
      bulk_enable: 0,
      bulk_disable: 0,
      update: 0,
    });
  }

  // Aggregate logs into hourly buckets
  logs.forEach(log => {
    try {
      const logTime = parseISO(log.created_at);
      const hourKey = startOfHour(logTime).toISOString().slice(0, 13);

      const hourData = hourlyMap.get(hourKey);
      if (hourData) {
        hourData.total += 1;

        // Count by action type
        if (log.action_type === 'enable') hourData.enable += 1;
        else if (log.action_type === 'disable') hourData.disable += 1;
        else if (log.action_type === 'bulk_enable') hourData.bulk_enable += 1;
        else if (log.action_type === 'bulk_disable') hourData.bulk_disable += 1;
        else if (log.action_type === 'update') hourData.update += 1;
      }
    } catch (error) {
      console.error('Error parsing log date:', error);
    }
  });

  return Array.from(hourlyMap.values()).sort((a, b) =>
    a.timestamp.getTime() - b.timestamp.getTime()
  );
};

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    const totalActions = payload.reduce((sum: number, entry: any) => sum + entry.value, 0);

    return (
      <div className="bg-popover border border-border rounded-lg shadow-lg p-3">
        <p className="font-bold text-sm mb-2">{label}</p>
        <div className="space-y-1 text-xs">
          <p className="font-semibold border-b border-border pb-1 mb-1">
            Total Actions: {totalActions}
          </p>
          {payload.map((entry: any) => (
            <p key={entry.name} style={{ color: entry.color }}>
              <span className="font-medium">{entry.name}:</span> {entry.value}
            </p>
          ))}
        </div>
      </div>
    );
  }
  return null;
};

export function AuditActivityChart({ logs, loading = false }: AuditActivityChartProps) {
  const [chartType, setChartType] = useState<ChartType>('area');

  const chartData = useMemo(() => aggregateLogsByHour(logs), [logs]);

  const totalActions = useMemo(() =>
    logs.length,
    [logs]
  );

  const actionTypeCounts = useMemo(() => {
    const counts = {
      enable: 0,
      disable: 0,
      bulk_enable: 0,
      bulk_disable: 0,
      update: 0,
    };

    logs.forEach(log => {
      if (log.action_type in counts) {
        counts[log.action_type] += 1;
      }
    });

    return counts;
  }, [logs]);

  const peakActivity = useMemo(() => {
    if (chartData.length === 0) return { hour: 'N/A', count: 0 };

    const peak = chartData.reduce((max, curr) =>
      curr.total > max.total ? curr : max
    );

    return { hour: peak.hourLabel, count: peak.total };
  }, [chartData]);

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5" />
            Activity Timeline
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-[350px] flex items-center justify-center">
            <div className="text-center space-y-2">
              <div className="h-8 w-8 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto" />
              <p className="text-sm text-muted-foreground">Loading activity data...</p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Activity className="h-5 w-5" />
              Activity Timeline
            </CardTitle>
            <CardDescription className="flex items-center gap-2 mt-1">
              <Clock className="h-3 w-3" />
              Last 24 hours ({totalActions} total actions)
            </CardDescription>
          </div>
          <Tabs value={chartType} onValueChange={(value) => setChartType(value as ChartType)}>
            <TabsList className="grid w-[200px] grid-cols-2">
              <TabsTrigger value="line">Line</TabsTrigger>
              <TabsTrigger value="area">Area</TabsTrigger>
            </TabsList>
          </Tabs>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {/* Chart */}
          {chartData.length > 0 ? (
            <ResponsiveContainer width="100%" height={300} className="text-xs">
              {chartType === 'line' ? (
                <LineChart data={chartData} margin={{ top: 5, right: 30, left: 0, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis
                    dataKey="hourLabel"
                    className="text-xs"
                    tick={{ fontSize: 10 }}
                  />
                  <YAxis className="text-xs" tick={{ fontSize: 10 }} />
                  <Tooltip content={<CustomTooltip />} />
                  <Legend
                    wrapperStyle={{ fontSize: '11px' }}
                    iconType="circle"
                  />
                  <Line
                    type="monotone"
                    dataKey="enable"
                    stroke={ACTION_COLORS.enable}
                    strokeWidth={2}
                    name={ACTION_LABELS.enable}
                    dot={{ r: 3 }}
                    activeDot={{ r: 5 }}
                  />
                  <Line
                    type="monotone"
                    dataKey="disable"
                    stroke={ACTION_COLORS.disable}
                    strokeWidth={2}
                    name={ACTION_LABELS.disable}
                    dot={{ r: 3 }}
                    activeDot={{ r: 5 }}
                  />
                  <Line
                    type="monotone"
                    dataKey="bulk_enable"
                    stroke={ACTION_COLORS.bulk_enable}
                    strokeWidth={2}
                    name={ACTION_LABELS.bulk_enable}
                    dot={{ r: 3 }}
                    activeDot={{ r: 5 }}
                  />
                  <Line
                    type="monotone"
                    dataKey="bulk_disable"
                    stroke={ACTION_COLORS.bulk_disable}
                    strokeWidth={2}
                    name={ACTION_LABELS.bulk_disable}
                    dot={{ r: 3 }}
                    activeDot={{ r: 5 }}
                  />
                  <Line
                    type="monotone"
                    dataKey="update"
                    stroke={ACTION_COLORS.update}
                    strokeWidth={2}
                    name={ACTION_LABELS.update}
                    dot={{ r: 3 }}
                    activeDot={{ r: 5 }}
                  />
                </LineChart>
              ) : (
                <AreaChart data={chartData} margin={{ top: 5, right: 30, left: 0, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis
                    dataKey="hourLabel"
                    className="text-xs"
                    tick={{ fontSize: 10 }}
                  />
                  <YAxis className="text-xs" tick={{ fontSize: 10 }} />
                  <Tooltip content={<CustomTooltip />} />
                  <Legend
                    wrapperStyle={{ fontSize: '11px' }}
                    iconType="circle"
                  />
                  <Area
                    type="monotone"
                    dataKey="enable"
                    stackId="1"
                    stroke={ACTION_COLORS.enable}
                    fill={ACTION_COLORS.enable}
                    fillOpacity={0.6}
                    name={ACTION_LABELS.enable}
                  />
                  <Area
                    type="monotone"
                    dataKey="disable"
                    stackId="1"
                    stroke={ACTION_COLORS.disable}
                    fill={ACTION_COLORS.disable}
                    fillOpacity={0.6}
                    name={ACTION_LABELS.disable}
                  />
                  <Area
                    type="monotone"
                    dataKey="bulk_enable"
                    stackId="1"
                    stroke={ACTION_COLORS.bulk_enable}
                    fill={ACTION_COLORS.bulk_enable}
                    fillOpacity={0.6}
                    name={ACTION_LABELS.bulk_enable}
                  />
                  <Area
                    type="monotone"
                    dataKey="bulk_disable"
                    stackId="1"
                    stroke={ACTION_COLORS.bulk_disable}
                    fill={ACTION_COLORS.bulk_disable}
                    fillOpacity={0.6}
                    name={ACTION_LABELS.bulk_disable}
                  />
                  <Area
                    type="monotone"
                    dataKey="update"
                    stackId="1"
                    stroke={ACTION_COLORS.update}
                    fill={ACTION_COLORS.update}
                    fillOpacity={0.6}
                    name={ACTION_LABELS.update}
                  />
                </AreaChart>
              )}
            </ResponsiveContainer>
          ) : (
            <div className="h-[300px] flex items-center justify-center border border-dashed border-border rounded-lg">
              <div className="text-center text-muted-foreground">
                <Activity className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p className="text-sm">No activity data in the last 24 hours</p>
              </div>
            </div>
          )}

          {/* Summary Statistics */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-4 border-t border-border">
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">
                {actionTypeCounts.enable + actionTypeCounts.bulk_enable}
              </div>
              <div className="text-xs text-muted-foreground">Enable Actions</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-red-600">
                {actionTypeCounts.disable + actionTypeCounts.bulk_disable}
              </div>
              <div className="text-xs text-muted-foreground">Disable Actions</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">
                {actionTypeCounts.update}
              </div>
              <div className="text-xs text-muted-foreground">Updates</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-primary">
                {peakActivity.count}
              </div>
              <div className="text-xs text-muted-foreground">
                Peak at {peakActivity.hour}
              </div>
            </div>
          </div>

          {/* Action Type Breakdown */}
          <div className="flex flex-wrap justify-center gap-2 pt-2">
            {Object.entries(ACTION_LABELS).map(([key, label]) => (
              <Badge
                key={key}
                variant="outline"
                style={{
                  borderColor: ACTION_COLORS[key as keyof typeof ACTION_COLORS],
                  color: ACTION_COLORS[key as keyof typeof ACTION_COLORS],
                }}
              >
                {label}: {actionTypeCounts[key as keyof typeof actionTypeCounts]}
              </Badge>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
