'use client';

import { Card, CardContent } from '@/components/ui/card';
import { Line, LineChart, ResponsiveContainer } from 'recharts';
import { motion } from 'framer-motion';
import { TrendingUp, TrendingDown, Minus, LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useState, useEffect } from 'react';
import { slideInBottom, shouldReduceMotion } from '@/lib/animations';
import { AnimatedCounter } from '@/components/ui/animated';
import { Skeleton } from '@/components/ui/skeleton';

// ============================================================================
// Types
// ============================================================================

export interface TrendDataPoint {
  value: number;
}

export interface TrendCardProps {
  title: string;
  value: number;
  previousValue?: number;
  trend?: 'up' | 'down' | 'neutral';
  trendValue?: number;
  trendLabel?: string;
  data: TrendDataPoint[];
  icon?: LucideIcon;
  loading?: boolean;
  className?: string;
  color?: string;
  valueFormatter?: (value: number) => string;
  compact?: boolean;
}

// ============================================================================
// Component
// ============================================================================

export function TrendCard({
  title,
  value,
  previousValue,
  trend,
  trendValue,
  trendLabel = 'vs anterior',
  data,
  icon: Icon,
  loading = false,
  className,
  color,
  valueFormatter = (val) => val.toLocaleString(),
  compact = false,
}: TrendCardProps) {
  const reducedMotion = shouldReduceMotion();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Auto-calculate trend if not provided
  let calculatedTrend = trend;
  let calculatedTrendValue = trendValue;

  if (!trend && previousValue !== undefined) {
    const change = value - previousValue;
    const percentChange = (change / previousValue) * 100;

    calculatedTrendValue = Math.abs(Math.round(percentChange));

    if (change > 0) calculatedTrend = 'up';
    else if (change < 0) calculatedTrend = 'down';
    else calculatedTrend = 'neutral';
  }

  // Determine colors based on trend
  const trendColors = {
    up: {
      bg: 'bg-emerald-50 dark:bg-emerald-950',
      text: 'text-emerald-700 dark:text-emerald-400',
      icon: TrendingUp,
      stroke: '#10B981',
    },
    down: {
      bg: 'bg-red-50 dark:bg-red-950',
      text: 'text-red-700 dark:text-red-400',
      icon: TrendingDown,
      stroke: '#EF4444',
    },
    neutral: {
      bg: 'bg-slate-50 dark:bg-slate-950',
      text: 'text-slate-700 dark:text-slate-400',
      icon: Minus,
      stroke: '#64748B',
    },
  };

  const currentTrend = calculatedTrend || 'neutral';
  const TrendIcon = trendColors[currentTrend].icon;
  const strokeColor = color || trendColors[currentTrend].stroke;

  // Loading state
  if (loading) {
    return (
      <Card className={cn('overflow-hidden', className)}>
        <CardContent className={cn('p-4', compact && 'p-3')}>
          <div className="flex items-center justify-between mb-2">
            <Skeleton className="h-4 w-24" />
            {Icon && <Skeleton className="h-8 w-8 rounded-lg" />}
          </div>
          <Skeleton className="h-8 w-20 mb-2" />
          <Skeleton className="h-16 w-full" />
        </CardContent>
      </Card>
    );
  }

  // Card content
  const cardContent = (
    <>
      {/* Header */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1">
          <p className={cn(
            'text-sm font-medium text-muted-foreground',
            compact && 'text-xs'
          )}>
            {title}
          </p>
        </div>
        {Icon && (
          <motion.div
            className="h-10 w-10 rounded-lg flex items-center justify-center"
            style={{ backgroundColor: `${strokeColor}20` }}
            initial={!reducedMotion ? { scale: 0, rotate: -180 } : undefined}
            animate={!reducedMotion ? { scale: 1, rotate: 0 } : undefined}
            transition={!reducedMotion ? { type: 'spring', stiffness: 200, damping: 15 } : undefined}
          >
            <Icon className="h-5 w-5" style={{ color: strokeColor }} />
          </motion.div>
        )}
      </div>

      {/* Value */}
      <div className="mb-3">
        <div className={cn(
          'text-2xl font-bold tracking-tight',
          compact && 'text-xl'
        )}>
          {mounted && !reducedMotion ? (
            <AnimatedCounter value={value} duration={1.5} />
          ) : (
            valueFormatter(value)
          )}
        </div>
      </div>

      {/* Trend Indicator */}
      {calculatedTrendValue !== undefined && (
        <motion.div
          className="flex items-center gap-2 mb-3"
          initial={!reducedMotion ? { opacity: 0, x: -10 } : undefined}
          animate={!reducedMotion ? { opacity: 1, x: 0 } : undefined}
          transition={!reducedMotion ? { delay: 0.2 } : undefined}
        >
          <div
            className={cn(
              'flex items-center gap-1 text-xs font-medium rounded-full px-2 py-0.5',
              trendColors[currentTrend].bg,
              trendColors[currentTrend].text
            )}
          >
            <TrendIcon className="h-3 w-3" />
            <span>
              {currentTrend === 'up' ? '+' : currentTrend === 'down' ? '-' : ''}
              {calculatedTrendValue}%
            </span>
          </div>
          <span className="text-xs text-muted-foreground">{trendLabel}</span>
        </motion.div>
      )}

      {/* Sparkline */}
      <div className={cn('h-16 w-full', compact && 'h-12')}>
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data}>
            <Line
              type="monotone"
              dataKey="value"
              stroke={strokeColor}
              strokeWidth={2}
              dot={false}
              animationDuration={!reducedMotion ? 1000 : 0}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </>
  );

  // Wrap in card
  const card = (
    <Card className={cn(
      'overflow-hidden transition-all duration-300',
      'hover:shadow-lg hover:scale-[1.02] cursor-pointer',
      className
    )}>
      <CardContent className={cn('p-4', compact && 'p-3')}>
        {cardContent}
      </CardContent>
    </Card>
  );

  // Wrap with motion if animations enabled
  if (reducedMotion || !mounted) {
    return card;
  }

  return (
    <motion.div
      initial="hidden"
      animate="visible"
      variants={slideInBottom}
      whileHover={{ y: -4 }}
      transition={{ type: 'spring', stiffness: 300, damping: 25 }}
    >
      {card}
    </motion.div>
  );
}

// ============================================================================
// Preset Configurations
// ============================================================================

/**
 * Generate sparkline data from a single value (simulated trend)
 */
function generateSparklineData(currentValue: number, points: number = 10): TrendDataPoint[] {
  const data: TrendDataPoint[] = [];
  const variance = currentValue * 0.15; // 15% variance

  for (let i = 0; i < points; i++) {
    const progress = i / (points - 1);
    const trend = currentValue * (0.85 + progress * 0.15);
    const random = (Math.random() - 0.5) * variance;
    data.push({ value: Math.max(0, trend + random) });
  }

  return data;
}

/**
 * Preset for employee trend
 */
export function EmployeeTrendCard({
  value,
  previousValue,
  loading,
  className,
}: {
  value: number;
  previousValue?: number;
  loading?: boolean;
  className?: string;
}) {
  return (
    <TrendCard
      title="Total Empleados"
      value={value}
      previousValue={previousValue}
      data={generateSparklineData(value)}
      loading={loading}
      className={className}
      color="#3B82F6"
    />
  );
}

/**
 * Preset for hours trend
 */
export function HoursTrendCard({
  value,
  previousValue,
  loading,
  className,
}: {
  value: number;
  previousValue?: number;
  loading?: boolean;
  className?: string;
}) {
  return (
    <TrendCard
      title="Horas Trabajadas"
      value={value}
      previousValue={previousValue}
      data={generateSparklineData(value)}
      loading={loading}
      className={className}
      color="#8B5CF6"
      valueFormatter={(val) => `${val.toLocaleString()}h`}
    />
  );
}

/**
 * Preset for salary trend
 */
export function SalaryTrendCard({
  value,
  previousValue,
  loading,
  className,
}: {
  value: number;
  previousValue?: number;
  loading?: boolean;
  className?: string;
}) {
  return (
    <TrendCard
      title="Nómina Mensual"
      value={value}
      previousValue={previousValue}
      data={generateSparklineData(value)}
      loading={loading}
      className={className}
      color="#10B981"
      valueFormatter={(val) => `¥${(val / 1000000).toFixed(1)}M`}
    />
  );
}

/**
 * Preset for candidates trend
 */
export function CandidatesTrendCard({
  value,
  previousValue,
  loading,
  className,
}: {
  value: number;
  previousValue?: number;
  loading?: boolean;
  className?: string;
}) {
  return (
    <TrendCard
      title="Candidatos Activos"
      value={value}
      previousValue={previousValue}
      data={generateSparklineData(value)}
      loading={loading}
      className={className}
      color="#F59E0B"
    />
  );
}

export default TrendCard;
