'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import { motion } from 'framer-motion';
import { useState, useEffect } from 'react';
import { shouldReduceMotion } from '@/lib/animations';

// ============================================================================
// Types
// ============================================================================

export interface YukyuTrendDataPoint {
  month: string; // Format: "2025-01"
  totalApprovedDays: number;
  employeesWithYukyu: number;
  totalDeductionJpy: number;
  avgDeductionPerEmployee: number;
}

export type ChartType = 'area' | 'bar' | 'combined';

// ============================================================================
// Custom Tooltip
// ============================================================================

const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload || !payload.length) return null;

  return (
    <div className="bg-background border border-border rounded-lg shadow-lg p-3">
      <p className="text-sm font-medium text-foreground">{payload[0].payload.month}</p>
      {payload.map((entry: any, index: number) => (
        <p key={index} style={{ color: entry.color }} className="text-xs">
          {entry.name}: {
            entry.dataKey?.includes('Jpy')
              ? `¥${entry.value.toLocaleString('ja-JP')}`
              : entry.dataKey?.includes('Employees')
              ? `${entry.value} emp.`
              : `${entry.value.toFixed(1)}`
          }
        </p>
      ))}
    </div>
  );
};

// ============================================================================
// Component
// ============================================================================

interface YukyuTrendChartProps {
  data: YukyuTrendDataPoint[];
  loading?: boolean;
  className?: string;
  chartType?: ChartType;
  height?: number;
  showLegend?: boolean;
}

export function YukyuTrendChart({
  data,
  loading = false,
  className,
  chartType = 'combined',
  height = 300,
  showLegend = true,
}: YukyuTrendChartProps) {
  const reducedMotion = shouldReduceMotion();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (loading || !mounted) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle>Yukyu Trend</CardTitle>
          <CardDescription>Monthly yukyu approvals and deductions</CardDescription>
        </CardHeader>
        <CardContent>
          <Skeleton className="w-full" style={{ height }} />
        </CardContent>
      </Card>
    );
  }

  if (!data || data.length === 0) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle>Yukyu Trend</CardTitle>
          <CardDescription>Monthly yukyu approvals and deductions</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center text-muted-foreground" style={{ height }}>
            No data available
          </div>
        </CardContent>
      </Card>
    );
  }

  const chartVariants = {
    hidden: reducedMotion ? {} : { opacity: 0 },
    visible: reducedMotion ? {} : { opacity: 1, transition: { duration: 0.5 } },
  };

  // Prepare chart data
  const chartData = data.map(point => ({
    month: point.month,
    'Days': Math.round(point.totalApprovedDays * 10) / 10,
    'Employees': point.employeesWithYukyu,
    'Deduction (¥)': Math.round(point.totalDeductionJpy / 1000), // In thousands
    'Avg Per Emp (¥)': Math.round(point.avgDeductionPerEmployee),
  }));

  const renderChart = () => {
    switch (chartType) {
      case 'area':
        return (
          <ResponsiveContainer width="100%" height={height}>
            <AreaChart data={chartData} margin={{ top: 10, right: 30, left: 0, bottom: 10 }}>
              <defs>
                <linearGradient id="colorDays" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.8} />
                  <stop offset="95%" stopColor="#3b82f6" stopOpacity={0.1} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis yAxisId="left" />
              <Tooltip content={<CustomTooltip />} />
              {showLegend && <Legend />}
              <Area
                yAxisId="left"
                type="monotone"
                dataKey="Days"
                stroke="#3b82f6"
                fillOpacity={1}
                fill="url(#colorDays)"
              />
            </AreaChart>
          </ResponsiveContainer>
        );

      case 'bar':
        return (
          <ResponsiveContainer width="100%" height={height}>
            <BarChart data={chartData} margin={{ top: 10, right: 30, left: 0, bottom: 10 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis yAxisId="left" />
              <YAxis yAxisId="right" orientation="right" />
              <Tooltip content={<CustomTooltip />} />
              {showLegend && <Legend />}
              <Bar yAxisId="left" dataKey="Days" fill="#3b82f6" />
              <Bar yAxisId="right" dataKey="Deduction (¥)" fill="#f59e0b" />
            </BarChart>
          </ResponsiveContainer>
        );

      case 'combined':
      default:
        return (
          <ResponsiveContainer width="100%" height={height}>
            <AreaChart data={chartData} margin={{ top: 10, right: 30, left: 0, bottom: 10 }}>
              <defs>
                <linearGradient id="colorDays" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.8} />
                  <stop offset="95%" stopColor="#3b82f6" stopOpacity={0.1} />
                </linearGradient>
                <linearGradient id="colorDeduction" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.8} />
                  <stop offset="95%" stopColor="#f59e0b" stopOpacity={0.1} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis yAxisId="left" label={{ value: 'Days / Employees', angle: -90, position: 'insideLeft' }} />
              <YAxis
                yAxisId="right"
                orientation="right"
                label={{ value: 'Deduction (¥ thousands)', angle: 90, position: 'insideRight' }}
              />
              <Tooltip content={<CustomTooltip />} />
              {showLegend && <Legend />}
              <Area
                yAxisId="left"
                type="monotone"
                dataKey="Days"
                stroke="#3b82f6"
                fill="url(#colorDays)"
                strokeWidth={2}
              />
              <Area
                yAxisId="right"
                type="monotone"
                dataKey="Deduction (¥)"
                stroke="#f59e0b"
                fill="url(#colorDeduction)"
                strokeWidth={2}
              />
            </AreaChart>
          </ResponsiveContainer>
        );
    }
  };

  return (
    <motion.div
      initial="hidden"
      animate="visible"
      variants={chartVariants}
    >
      <Card className={className}>
        <CardHeader>
          <CardTitle>Yukyu Trends</CardTitle>
          <CardDescription>Monthly approved days and salary deductions</CardDescription>
        </CardHeader>
        <CardContent>
          {renderChart()}
        </CardContent>
      </Card>
    </motion.div>
  );
}

// ============================================================================
// Simplified Versions
// ============================================================================

export function YukyuDaysTrendChart({
  data,
  loading,
  className,
}: Omit<YukyuTrendChartProps, 'chartType'>) {
  return (
    <YukyuTrendChart
      data={data}
      loading={loading}
      className={className}
      chartType="area"
      height={250}
    />
  );
}

export function YukyuDeductionTrendChart({
  data,
  loading,
  className,
}: Omit<YukyuTrendChartProps, 'chartType'>) {
  return (
    <YukyuTrendChart
      data={data}
      loading={loading}
      className={className}
      chartType="bar"
      height={250}
    />
  );
}
