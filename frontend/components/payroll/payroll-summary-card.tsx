'use client';

/**
 * Payroll Summary Card Component
 * Card reutilizable para mostrar KPIs de payroll
 */
import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { LucideIcon } from 'lucide-react';

interface PayrollSummaryCardProps {
  title: string;
  value: string | number;
  icon?: LucideIcon;
  iconClassName?: string;
  className?: string;
}

export function PayrollSummaryCard({
  title,
  value,
  icon: Icon,
  iconClassName,
  className,
}: PayrollSummaryCardProps) {
  return (
    <Card className={cn('hover:shadow-lg transition-shadow', className)}>
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div className="flex-1">
            <p className="text-sm font-medium text-muted-foreground mb-2">
              {title}
            </p>
            <p className="text-2xl font-bold text-foreground">
              {value}
            </p>
          </div>
          {Icon && (
            <div
              className={cn(
                'p-3 rounded-lg bg-primary/10',
                iconClassName
              )}
            >
              <Icon className="h-6 w-6" />
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
