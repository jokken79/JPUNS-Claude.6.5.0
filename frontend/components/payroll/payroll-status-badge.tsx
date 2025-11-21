'use client';

/**
 * Payroll Status Badge Component
 * Badge con colores dinámicos según el estado del payroll
 */
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

interface PayrollStatusBadgeProps {
  status: 'draft' | 'calculated' | 'approved' | 'paid' | 'cancelled';
  className?: string;
}

export function PayrollStatusBadge({ status, className }: PayrollStatusBadgeProps) {
  const statusConfig = {
    draft: {
      label: '下書き',
      variant: 'secondary' as const,
      className: 'bg-gray-500 text-white',
    },
    calculated: {
      label: '計算済み',
      variant: 'default' as const,
      className: 'bg-blue-500 text-white',
    },
    approved: {
      label: '承認済み',
      variant: 'success' as const,
      className: 'bg-green-500 text-white',
    },
    paid: {
      label: '支払済み',
      variant: 'default' as const,
      className: 'bg-yellow-600 text-white',
    },
    cancelled: {
      label: 'キャンセル',
      variant: 'destructive' as const,
      className: 'bg-red-500 text-white',
    },
  };

  const config = statusConfig[status] || statusConfig.draft;

  return (
    <Badge
      variant={config.variant}
      className={cn(
        'font-medium px-3 py-1',
        config.className,
        className
      )}
    >
      {config.label}
    </Badge>
  );
}
