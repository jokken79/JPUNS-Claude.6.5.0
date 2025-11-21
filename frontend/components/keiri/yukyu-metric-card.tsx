'use client';

import { MetricCard, type MetricCardProps } from '@/components/dashboard/metric-card';
import {
  Calendar,
  Users,
  DollarSign,
  AlertCircle,
  CheckCircle,
  TrendingDown
} from 'lucide-react';

// ============================================================================
// Types
// ============================================================================

export interface YukyuMetricValue {
  label: string;
  value: number;
  unit?: string;
  format?: 'number' | 'currency' | 'decimal';
}

export type YukyuMetricType =
  | 'total_days'
  | 'employees_count'
  | 'total_deduction'
  | 'avg_deduction'
  | 'compliance_rate'
  | 'non_compliant_count';

// ============================================================================
// Metric Configurations
// ============================================================================

const metricConfigs: Record<YukyuMetricType, {
  icon: any;
  theme: any;
  variant: any;
  description?: string;
}> = {
  total_days: {
    icon: Calendar,
    theme: 'info',
    variant: 'default',
    description: 'Days approved this period',
  },
  employees_count: {
    icon: Users,
    theme: 'default',
    variant: 'default',
    description: 'Employees with yukyu',
  },
  total_deduction: {
    icon: DollarSign,
    theme: 'warning',
    variant: 'large',
    description: 'Total salary deduction',
  },
  avg_deduction: {
    icon: TrendingDown,
    theme: 'default',
    variant: 'compact',
    description: 'Average per employee',
  },
  compliance_rate: {
    icon: CheckCircle,
    theme: 'success',
    variant: 'default',
    description: 'Legal compliance rate',
  },
  non_compliant_count: {
    icon: AlertCircle,
    theme: 'danger',
    variant: 'featured',
    description: 'Employees below 5 days',
  },
};

// ============================================================================
// Helper Functions
// ============================================================================

const formatValue = (
  value: number,
  format: 'number' | 'currency' | 'decimal' = 'number'
): string => {
  switch (format) {
    case 'currency':
      return `¥${value.toLocaleString('ja-JP', {
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
      })}`;
    case 'decimal':
      return value.toLocaleString('ja-JP', {
        minimumFractionDigits: 1,
        maximumFractionDigits: 1,
      });
    case 'number':
    default:
      return value.toLocaleString('ja-JP');
  }
};

// ============================================================================
// Component
// ============================================================================

interface YukyuMetricCardProps {
  type: YukyuMetricType;
  value: number;
  title?: string;
  unit?: string;
  trend?: {
    value: number;
    isPositive: boolean;
    label?: string;
  };
  className?: string;
  loading?: boolean;
}

export function YukyuMetricCard({
  type,
  value,
  title,
  unit,
  trend,
  className,
  loading = false,
}: YukyuMetricCardProps) {
  const config = metricConfigs[type];

  if (!config) {
    return null;
  }

  const format =
    type === 'total_deduction' || type === 'avg_deduction'
      ? 'currency'
      : type === 'compliance_rate'
      ? 'decimal'
      : 'number';

  const formattedValue = formatValue(value, format);
  const displayValue = unit ? `${formattedValue} ${unit}` : formattedValue;
  const defaultTitle = title || config.description || type.replace(/_/g, ' ');

  return (
    <MetricCard
      title={defaultTitle}
      value={displayValue}
      icon={config.icon}
      theme={config.theme}
      variant={config.variant}
      trend={trend}
      loading={loading}
      className={className}
    />
  );
}

// ============================================================================
// Preset Cards (Common Configurations)
// ============================================================================

export function TotalYukyuDaysCard({
  value,
  loading = false,
  className
}: {
  value: number;
  loading?: boolean;
  className?: string;
}) {
  return (
    <YukyuMetricCard
      type="total_days"
      value={value}
      unit="days"
      className={className}
      loading={loading}
    />
  );
}

export function EmployeesWithYukyuCard({
  value,
  loading = false,
  className
}: {
  value: number;
  loading?: boolean;
  className?: string;
}) {
  return (
    <YukyuMetricCard
      type="employees_count"
      value={value}
      unit="employees"
      className={className}
      loading={loading}
    />
  );
}

export function TotalDeductionCard({
  value,
  loading = false,
  className
}: {
  value: number;
  loading?: boolean;
  className?: string;
}) {
  return (
    <YukyuMetricCard
      type="total_deduction"
      value={value}
      className={className}
      loading={loading}
    />
  );
}

export function ComplianceRateCard({
  value,
  nonCompliantCount,
  loading = false,
  className
}: {
  value: number;
  nonCompliantCount: number;
  loading?: boolean;
  className?: string;
}) {
  return (
    <YukyuMetricCard
      type="compliance_rate"
      value={value}
      unit="%"
      trend={nonCompliantCount > 0 ? {
        value: nonCompliantCount,
        isPositive: false,
        label: `${nonCompliantCount} non-compliant`,
      } : undefined}
      className={className}
      loading={loading}
    />
  );
}
