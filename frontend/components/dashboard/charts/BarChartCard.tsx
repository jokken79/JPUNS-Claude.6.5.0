'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Bar,
  BarChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  CartesianGrid,
  Legend,
  Cell,
} from 'recharts';
import { motion } from 'framer-motion';
import { useState, useEffect } from 'react';
import { slideInBottom, shouldReduceMotion } from '@/lib/animations';
import { Skeleton } from '@/components/ui/skeleton';

// ============================================================================
// Types
// ============================================================================

export interface BarChartDataPoint {
  [key: string]: string | number;
}

export interface BarChartSeries {
  dataKey: string;
  name: string;
  color: string;
  radius?: number | [number, number, number, number];
}

export interface BarChartCardProps {
  title: string;
  description?: string;
  data: BarChartDataPoint[];
  series: BarChartSeries[];
  xAxisKey: string;
  height?: number;
  loading?: boolean;
  className?: string;
  showLegend?: boolean;
  showGrid?: boolean;
  orientation?: 'vertical' | 'horizontal';
  animationDuration?: number;
  tooltipFormatter?: (value: any, name: string) => [string, string];
  yAxisFormatter?: (value: any) => string;
  xAxisFormatter?: (value: any) => string;
  stackId?: string;
}

// ============================================================================
// Component
// ============================================================================

export function BarChartCard({
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
  orientation = 'vertical',
  animationDuration = 1000,
  tooltipFormatter,
  yAxisFormatter,
  xAxisFormatter,
  stackId,
}: BarChartCardProps) {
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
                className="w-3 h-3 rounded"
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
          <BarChart
            data={data}
            layout={orientation === 'horizontal' ? 'horizontal' : 'vertical'}
            margin={{ top: 10, right: 30, left: orientation === 'horizontal' ? 20 : 0, bottom: 0 }}
          >
            {/* Grid */}
            {showGrid && (
              <CartesianGrid
                strokeDasharray="3 3"
                className="stroke-muted"
                opacity={0.3}
                horizontal={orientation === 'vertical'}
                vertical={orientation === 'horizontal'}
              />
            )}

            {/* Axes */}
            {orientation === 'vertical' ? (
              <>
                <XAxis
                  dataKey={xAxisKey}
                  className="text-xs"
                  tick={{ fill: 'hsl(var(--muted-foreground))' }}
                  tickLine={false}
                  axisLine={false}
                  tickFormatter={xAxisFormatter}
                />
                <YAxis
                  className="text-xs"
                  tick={{ fill: 'hsl(var(--muted-foreground))' }}
                  tickLine={false}
                  axisLine={false}
                  tickFormatter={yAxisFormatter}
                />
              </>
            ) : (
              <>
                <XAxis
                  type="number"
                  className="text-xs"
                  tick={{ fill: 'hsl(var(--muted-foreground))' }}
                  tickLine={false}
                  axisLine={false}
                  tickFormatter={xAxisFormatter}
                />
                <YAxis
                  type="category"
                  dataKey={xAxisKey}
                  className="text-xs"
                  tick={{ fill: 'hsl(var(--muted-foreground))' }}
                  tickLine={false}
                  axisLine={false}
                  width={120}
                  tickFormatter={yAxisFormatter}
                />
              </>
            )}

            {/* Tooltip */}
            <Tooltip
              content={<CustomTooltip />}
              cursor={{ fill: 'hsl(var(--muted))', opacity: 0.1 }}
            />

            {/* Legend */}
            {showLegend && series.length > 1 && (
              <Legend
                wrapperStyle={{ paddingTop: '20px' }}
                iconType="rect"
              />
            )}

            {/* Bar series */}
            {series.map((s, index) => (
              <Bar
                key={s.dataKey}
                dataKey={s.dataKey}
                name={s.name}
                fill={s.color}
                radius={s.radius || [8, 8, 0, 0]}
                animationDuration={!reducedMotion ? animationDuration : 0}
                animationBegin={!reducedMotion ? index * 200 : 0}
                stackId={stackId}
              />
            ))}
          </BarChart>
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
 * Preset for monthly salary bar chart
 */
export function MonthlySalaryBarChart({
  data,
  loading,
  className,
}: {
  data: BarChartDataPoint[];
  loading?: boolean;
  className?: string;
}) {
  return (
    <BarChartCard
      title="Nómina Mensual"
      description="Evolución del gasto en nómina"
      data={data}
      series={[
        {
          dataKey: 'salary',
          name: 'Nómina Total',
          color: '#10B981',
          radius: [8, 8, 0, 0],
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

/**
 * Preset for employee distribution by factory (horizontal)
 */
export function FactoryDistributionBarChart({
  data,
  loading,
  className,
}: {
  data: BarChartDataPoint[];
  loading?: boolean;
  className?: string;
}) {
  return (
    <BarChartCard
      title="Empleados por Fábrica"
      description="Distribución de empleados activos"
      data={data}
      series={[
        {
          dataKey: 'value',
          name: 'Empleados',
          color: 'hsl(var(--primary))',
          radius: [0, 8, 8, 0],
        },
      ]}
      xAxisKey="name"
      loading={loading}
      className={className}
      orientation="horizontal"
      showLegend={false}
      height={300}
    />
  );
}

/**
 * Preset for stacked bar chart (employees vs candidates)
 */
export function StackedGrowthBarChart({
  data,
  loading,
  className,
}: {
  data: BarChartDataPoint[];
  loading?: boolean;
  className?: string;
}) {
  return (
    <BarChartCard
      title="Crecimiento de Personal"
      description="Empleados activos vs candidatos por mes"
      data={data}
      series={[
        {
          dataKey: 'employees',
          name: 'Empleados',
          color: 'hsl(var(--primary))',
        },
        {
          dataKey: 'candidates',
          name: 'Candidatos',
          color: '#F59E0B',
        },
      ]}
      xAxisKey="month"
      loading={loading}
      className={className}
      stackId="growth"
    />
  );
}

/**
 * Preset for comparison bar chart
 */
export function ComparisonBarChart({
  data,
  loading,
  className,
}: {
  data: BarChartDataPoint[];
  loading?: boolean;
  className?: string;
}) {
  return (
    <BarChartCard
      title="Comparación Mensual"
      description="Empleados, horas y fábricas"
      data={data}
      series={[
        {
          dataKey: 'employees',
          name: 'Empleados',
          color: 'hsl(var(--primary))',
        },
        {
          dataKey: 'factories',
          name: 'Fábricas',
          color: '#3B82F6',
        },
      ]}
      xAxisKey="month"
      loading={loading}
      className={className}
    />
  );
}

export default BarChartCard;
