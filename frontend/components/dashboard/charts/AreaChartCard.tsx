'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Area,
  AreaChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  CartesianGrid,
  Legend,
} from 'recharts';
import { motion } from 'framer-motion';
import { useState, useEffect } from 'react';
import { slideInBottom, shouldReduceMotion } from '@/lib/animations';
import { Skeleton } from '@/components/ui/skeleton';

// ============================================================================
// Types
// ============================================================================

export interface AreaChartDataPoint {
  [key: string]: string | number;
}

export interface AreaChartSeries {
  dataKey: string;
  name: string;
  color: string;
  gradient?: {
    start: string;
    end: string;
  };
}

export interface AreaChartCardProps {
  title: string;
  description?: string;
  data: AreaChartDataPoint[];
  series: AreaChartSeries[];
  xAxisKey: string;
  height?: number;
  loading?: boolean;
  className?: string;
  showLegend?: boolean;
  showGrid?: boolean;
  animationDuration?: number;
  tooltipFormatter?: (value: any, name: string) => [string, string];
  yAxisFormatter?: (value: any) => string;
}

// ============================================================================
// Component
// ============================================================================

export function AreaChartCard({
  title,
  description,
  data,
  series,
  xAxisKey,
  height = 350,
  loading = false,
  className,
  showLegend = true,
  showGrid = true,
  animationDuration = 1500,
  tooltipFormatter,
  yAxisFormatter,
}: AreaChartCardProps) {
  const reducedMotion = shouldReduceMotion();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Custom tooltip component
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (!active || !payload || payload.length === 0) return null;

    return (
      <motion.div
        initial={!reducedMotion ? { opacity: 0, scale: 0.9 } : undefined}
        animate={!reducedMotion ? { opacity: 1, scale: 1 } : undefined}
        className="bg-background border rounded-lg shadow-lg p-3"
      >
        <p className="font-semibold text-sm mb-2">{label}</p>
        {payload.map((entry: any, index: number) => {
          const [formattedValue, formattedName] = tooltipFormatter
            ? tooltipFormatter(entry.value, entry.name)
            : [entry.value.toLocaleString(), entry.name];

          return (
            <div
              key={index}
              className="flex items-center gap-2 text-xs"
              style={{ color: entry.color }}
            >
              <span
                className="w-3 h-3 rounded-full"
                style={{ backgroundColor: entry.color }}
              />
              <span className="text-muted-foreground">{formattedName}:</span>
              <span className="font-semibold">{formattedValue}</span>
            </div>
          );
        })}
      </motion.div>
    );
  };

  // Loading state
  if (loading) {
    return (
      <Card className={className}>
        <CardHeader>
          <Skeleton className="h-6 w-48 mb-2" />
          <Skeleton className="h-4 w-64" />
        </CardHeader>
        <CardContent>
          <Skeleton className="w-full" style={{ height }} />
        </CardContent>
      </Card>
    );
  }

  // Chart content
  const chartContent = (
    <Card className={className}>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        {description && <CardDescription>{description}</CardDescription>}
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={height}>
          <AreaChart
            data={data}
            margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
          >
            {/* Define gradients for each series */}
            <defs>
              {series.map((s, index) => {
                const gradientId = `gradient-${s.dataKey}-${index}`;
                const startColor = s.gradient?.start || s.color;
                const endColor = s.gradient?.end || s.color;

                return (
                  <linearGradient key={gradientId} id={gradientId} x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={startColor} stopOpacity={0.8} />
                    <stop offset="95%" stopColor={endColor} stopOpacity={0.1} />
                  </linearGradient>
                );
              })}
            </defs>

            {/* Grid */}
            {showGrid && (
              <CartesianGrid
                strokeDasharray="3 3"
                className="stroke-muted"
                opacity={0.3}
                vertical={false}
              />
            )}

            {/* Axes */}
            <XAxis
              dataKey={xAxisKey}
              className="text-xs"
              tick={{ fill: 'hsl(var(--muted-foreground))' }}
              tickLine={false}
              axisLine={false}
            />
            <YAxis
              className="text-xs"
              tick={{ fill: 'hsl(var(--muted-foreground))' }}
              tickLine={false}
              axisLine={false}
              tickFormatter={yAxisFormatter}
            />

            {/* Tooltip */}
            <Tooltip content={<CustomTooltip />} cursor={{ stroke: 'hsl(var(--muted))', strokeWidth: 1 }} />

            {/* Legend */}
            {showLegend && (
              <Legend
                wrapperStyle={{ paddingTop: '20px' }}
                iconType="circle"
              />
            )}

            {/* Area series */}
            {series.map((s, index) => (
              <Area
                key={s.dataKey}
                type="monotone"
                dataKey={s.dataKey}
                name={s.name}
                stroke={s.color}
                strokeWidth={2}
                fill={`url(#gradient-${s.dataKey}-${index})`}
                fillOpacity={1}
                animationDuration={!reducedMotion ? animationDuration : 0}
                animationBegin={!reducedMotion ? index * 200 : 0}
                dot={false}
                activeDot={{
                  r: 6,
                  strokeWidth: 2,
                  stroke: s.color,
                  fill: 'hsl(var(--background))',
                }}
              />
            ))}
          </AreaChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );

  // Wrap with motion if animations enabled
  if (reducedMotion || !mounted) {
    return chartContent;
  }

  return (
    <motion.div
      initial="hidden"
      animate="visible"
      variants={slideInBottom}
    >
      {chartContent}
    </motion.div>
  );
}

// ============================================================================
// Preset Configurations
// ============================================================================

/**
 * Preset for employee trends
 */
export function EmployeeTrendChart({
  data,
  loading,
  className,
}: {
  data: AreaChartDataPoint[];
  loading?: boolean;
  className?: string;
}) {
  return (
    <AreaChartCard
      title="Tendencia de Empleados"
      description="Evolución de empleados activos en los últimos meses"
      data={data}
      series={[
        {
          dataKey: 'employees',
          name: 'Total Empleados',
          color: 'hsl(var(--primary))',
        },
        {
          dataKey: 'activeEmployees',
          name: 'Empleados Activos',
          color: '#10B981',
        },
      ]}
      xAxisKey="month"
      loading={loading}
      className={className}
    />
  );
}

/**
 * Preset for work hours
 */
export function WorkHoursTrendChart({
  data,
  loading,
  className,
}: {
  data: AreaChartDataPoint[];
  loading?: boolean;
  className?: string;
}) {
  return (
    <AreaChartCard
      title="Horas Trabajadas"
      description="Total de horas trabajadas por mes"
      data={data}
      series={[
        {
          dataKey: 'hours',
          name: 'Horas Totales',
          color: '#3B82F6',
          gradient: {
            start: '#3B82F6',
            end: '#8B5CF6',
          },
        },
      ]}
      xAxisKey="month"
      loading={loading}
      className={className}
      yAxisFormatter={(value) => `${(value / 1000).toFixed(1)}k`}
      tooltipFormatter={(value, name) => [
        `${value.toLocaleString()} horas`,
        name,
      ]}
    />
  );
}

/**
 * Preset for salary trends
 */
export function SalaryTrendChart({
  data,
  loading,
  className,
}: {
  data: AreaChartDataPoint[];
  loading?: boolean;
  className?: string;
}) {
  return (
    <AreaChartCard
      title="Nómina Mensual"
      description="Evolución de la nómina total"
      data={data}
      series={[
        {
          dataKey: 'salary',
          name: 'Nómina Total',
          color: '#10B981',
          gradient: {
            start: '#10B981',
            end: '#059669',
          },
        },
      ]}
      xAxisKey="month"
      loading={loading}
      className={className}
      yAxisFormatter={(value) => `¥${(value / 1000000).toFixed(1)}M`}
      tooltipFormatter={(value, name) => [
        `¥${value.toLocaleString()}`,
        name,
      ]}
    />
  );
}

export default AreaChartCard;
