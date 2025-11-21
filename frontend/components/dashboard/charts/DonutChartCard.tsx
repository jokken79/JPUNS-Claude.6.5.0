'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip,
  Legend,
} from 'recharts';
import { motion } from 'framer-motion';
import { useState, useEffect } from 'react';
import { slideInBottom, shouldReduceMotion } from '@/lib/animations';
import { Skeleton } from '@/components/ui/skeleton';
import { AnimatedCounter } from '@/components/ui/animated';

// ============================================================================
// Types
// ============================================================================

export interface DonutChartDataPoint {
  name: string;
  value: number;
  color: string;
  percentage?: number;
}

export interface DonutChartCardProps {
  title: string;
  description?: string;
  data: DonutChartDataPoint[];
  height?: number;
  loading?: boolean;
  className?: string;
  showLegend?: boolean;
  showCenterStat?: boolean;
  centerLabel?: string;
  innerRadius?: number;
  outerRadius?: number;
  animationDuration?: number;
  tooltipFormatter?: (value: number, name: string) => [string, string];
}

// ============================================================================
// Component
// ============================================================================

export function DonutChartCard({
  title,
  description,
  data,
  height = 350,
  loading = false,
  className,
  showLegend = true,
  showCenterStat = true,
  centerLabel = 'Total',
  innerRadius = 60,
  outerRadius = 100,
  animationDuration = 1000,
  tooltipFormatter,
}: DonutChartCardProps) {
  const reducedMotion = shouldReduceMotion();
  const [mounted, setMounted] = useState(false);
  const [activeIndex, setActiveIndex] = useState<number | null>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Calculate total
  const total = data.reduce((sum, item) => sum + item.value, 0);

  // Custom tooltip component
  const CustomTooltip = ({ active, payload }: any) => {
    if (!active || !payload || payload.length === 0) return null;

    const data = payload[0];
    const [formattedValue, formattedName] = tooltipFormatter
      ? tooltipFormatter(data.value, data.name)
      : [data.value.toLocaleString(), data.name];

    const percentage = ((data.value / total) * 100).toFixed(1);

    return (
      <motion.div
        initial={!reducedMotion ? { opacity: 0, scale: 0.9 } : undefined}
        animate={!reducedMotion ? { opacity: 1, scale: 1 } : undefined}
        className="bg-background border rounded-lg shadow-lg p-3"
      >
        <div className="flex items-center gap-2 mb-1">
          <span
            className="w-3 h-3 rounded-full"
            style={{ backgroundColor: data.payload.color }}
          />
          <p className="font-semibold text-sm">{formattedName}</p>
        </div>
        <div className="text-xs text-muted-foreground">
          <p>Valor: <span className="font-semibold text-foreground">{formattedValue}</span></p>
          <p>Porcentaje: <span className="font-semibold text-foreground">{percentage}%</span></p>
        </div>
      </motion.div>
    );
  };

  // Custom legend with better formatting
  const CustomLegend = ({ payload }: any) => {
    return (
      <div className="flex flex-wrap gap-3 justify-center mt-4">
        {payload.map((entry: any, index: number) => {
          const percentage = ((entry.value / total) * 100).toFixed(1);
          return (
            <motion.div
              key={`legend-${index}`}
              className="flex items-center gap-2 text-xs cursor-pointer hover:opacity-80 transition-opacity"
              initial={!reducedMotion ? { opacity: 0, x: -10 } : undefined}
              animate={!reducedMotion ? { opacity: 1, x: 0 } : undefined}
              transition={!reducedMotion ? { delay: index * 0.1 } : undefined}
              onMouseEnter={() => setActiveIndex(index)}
              onMouseLeave={() => setActiveIndex(null)}
            >
              <span
                className="w-3 h-3 rounded-full"
                style={{ backgroundColor: entry.color }}
              />
              <span className="font-medium">{entry.value}</span>
              <span className="text-muted-foreground">
                {entry.payload.name} ({percentage}%)
              </span>
            </motion.div>
          );
        })}
      </div>
    );
  };

  // Center label component
  const CenterLabel = ({ viewBox }: any) => {
    const { cx, cy } = viewBox;

    return (
      <g>
        <text
          x={cx}
          y={cy - 10}
          className="fill-muted-foreground text-xs"
          textAnchor="middle"
          dominantBaseline="middle"
        >
          {centerLabel}
        </text>
        <text
          x={cx}
          y={cy + 15}
          className="fill-foreground text-2xl font-bold"
          textAnchor="middle"
          dominantBaseline="middle"
        >
          {mounted && !reducedMotion ? (
            <AnimatedCounter value={total} duration={1.5} />
          ) : (
            total.toLocaleString()
          )}
        </text>
      </g>
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
          <div className="flex items-center justify-center" style={{ height }}>
            <Skeleton className="w-64 h-64 rounded-full" />
          </div>
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
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              labelLine={false}
              label={false}
              innerRadius={innerRadius}
              outerRadius={outerRadius}
              paddingAngle={2}
              dataKey="value"
              animationDuration={!reducedMotion ? animationDuration : 0}
              animationBegin={0}
              activeIndex={activeIndex !== null ? activeIndex : undefined}
              activeShape={{
                strokeWidth: 2,
                stroke: 'hsl(var(--background))',
              }}
            >
              {data.map((entry, index) => (
                <Cell
                  key={`cell-${index}`}
                  fill={entry.color}
                  className="cursor-pointer transition-all hover:opacity-80"
                  onMouseEnter={() => setActiveIndex(index)}
                  onMouseLeave={() => setActiveIndex(null)}
                />
              ))}
              {showCenterStat && <CenterLabel />}
            </Pie>

            <Tooltip content={<CustomTooltip />} />

            {showLegend && <Legend content={<CustomLegend />} />}
          </PieChart>
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
 * Preset for employee status distribution
 */
export function EmployeeStatusDonutChart({
  data,
  loading,
  className,
}: {
  data: DonutChartDataPoint[];
  loading?: boolean;
  className?: string;
}) {
  return (
    <DonutChartCard
      title="Estado de Empleados"
      description="Distribución por estado laboral"
      data={data}
      loading={loading}
      className={className}
      centerLabel="Empleados"
      height={320}
    />
  );
}

/**
 * Preset for nationality distribution
 */
export function NationalityDonutChart({
  data,
  loading,
  className,
}: {
  data: DonutChartDataPoint[];
  loading?: boolean;
  className?: string;
}) {
  return (
    <DonutChartCard
      title="Nacionalidades"
      description="Distribución de empleados por nacionalidad"
      data={data}
      loading={loading}
      className={className}
      centerLabel="Total"
      height={320}
    />
  );
}

/**
 * Preset for factory distribution
 */
export function FactoryDonutChart({
  data,
  loading,
  className,
}: {
  data: DonutChartDataPoint[];
  loading?: boolean;
  className?: string;
}) {
  return (
    <DonutChartCard
      title="Distribución por Fábrica"
      description="Empleados asignados a cada cliente"
      data={data}
      loading={loading}
      className={className}
      centerLabel="Empleados"
      height={320}
    />
  );
}

/**
 * Preset for contract type distribution
 */
export function ContractTypeDonutChart({
  data,
  loading,
  className,
}: {
  data: DonutChartDataPoint[];
  loading?: boolean;
  className?: string;
}) {
  return (
    <DonutChartCard
      title="Tipos de Contrato"
      description="Distribución por tipo de contratación"
      data={data}
      loading={loading}
      className={className}
      centerLabel="Contratos"
      height={320}
    />
  );
}

export default DonutChartCard;
