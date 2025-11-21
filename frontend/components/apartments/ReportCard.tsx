'use client';

import React from 'react';
import { ArrowUpIcon, ArrowDownIcon, Loader2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';

interface ReportCardProps {
  title: string;
  value: number | string;
  unit?: string;
  icon?: React.ReactNode;
  trend?: 'up' | 'down';
  trendValue?: number;
  trendLabel?: string;
  description?: string;
  loading?: boolean;
  colorScheme?: 'default' | 'success' | 'warning' | 'danger' | 'info';
  className?: string;
}

const COLOR_SCHEMES = {
  default: {
    bg: 'bg-blue-500',
    icon: 'text-blue-600 dark:text-blue-400',
    trend: {
      up: 'text-blue-600',
      down: 'text-blue-600',
    },
  },
  success: {
    bg: 'bg-green-500',
    icon: 'text-green-600 dark:text-green-400',
    trend: {
      up: 'text-green-600',
      down: 'text-green-600',
    },
  },
  warning: {
    bg: 'bg-yellow-500',
    icon: 'text-yellow-600 dark:text-yellow-400',
    trend: {
      up: 'text-yellow-600',
      down: 'text-yellow-600',
    },
  },
  danger: {
    bg: 'bg-red-500',
    icon: 'text-red-600 dark:text-red-400',
    trend: {
      up: 'text-red-600',
      down: 'text-red-600',
    },
  },
  info: {
    bg: 'bg-purple-500',
    icon: 'text-purple-600 dark:text-purple-400',
    trend: {
      up: 'text-purple-600',
      down: 'text-purple-600',
    },
  },
};

export function ReportCard({
  title,
  value,
  unit,
  icon,
  trend,
  trendValue,
  trendLabel,
  description,
  loading = false,
  colorScheme = 'default',
  className,
}: ReportCardProps) {
  const colors = COLOR_SCHEMES[colorScheme];

  if (loading) {
    return (
      <Card className={cn('animate-pulse', className)}>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium text-muted-foreground">
            {title}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center h-16">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={cn('hover:shadow-lg transition-shadow', className)}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-medium text-muted-foreground">
            {title}
          </CardTitle>
          {icon && (
            <div className={cn('p-2 rounded-full', colors.bg, 'bg-opacity-10')}>
              <div className={cn('h-5 w-5', colors.icon)}>{icon}</div>
            </div>
          )}
        </div>
      </CardHeader>

      <CardContent className="space-y-2">
        {/* Main Value */}
        <div className="flex items-baseline gap-2">
          <span className="text-3xl font-bold tracking-tight">{value}</span>
          {unit && <span className="text-lg text-muted-foreground">{unit}</span>}
        </div>

        {/* Trend */}
        {trend && (
          <div className="flex items-center gap-2">
            <div
              className={cn(
                'flex items-center gap-1 text-sm font-medium',
                trend === 'up' ? colors.trend.up : colors.trend.down
              )}
            >
              {trend === 'up' ? (
                <ArrowUpIcon className="h-4 w-4" />
              ) : (
                <ArrowDownIcon className="h-4 w-4" />
              )}
              {trendValue !== undefined && (
                <span>
                  {Math.abs(trendValue)}%
                </span>
              )}
            </div>
            {trendLabel && (
              <span className="text-sm text-muted-foreground">{trendLabel}</span>
            )}
          </div>
        )}

        {/* Description */}
        {description && (
          <p className="text-sm text-muted-foreground">{description}</p>
        )}
      </CardContent>
    </Card>
  );
}

export default ReportCard;
