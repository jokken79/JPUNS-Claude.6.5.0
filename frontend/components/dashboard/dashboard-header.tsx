'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  RefreshCw,
  Download,
  Printer,
  Calendar,
  Filter,
  ChevronDown,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

// ============================================================================
// Types
// ============================================================================

export type QuickFilter = 'week' | 'month' | 'quarter' | 'year';

export interface DashboardHeaderProps {
  title?: string;
  subtitle?: string;
  dateRange?: {
    start: Date;
    end: Date;
  };
  showFilters?: boolean;
  showActions?: boolean;
  onRefresh?: () => void;
  onExport?: () => void;
  onPrint?: () => void;
  onFilterChange?: (filter: QuickFilter) => void;
  isRefreshing?: boolean;
  className?: string;
}

// ============================================================================
// Component
// ============================================================================

export function DashboardHeader({
  title = 'Dashboard',
  subtitle,
  dateRange,
  showFilters = true,
  showActions = true,
  onRefresh,
  onExport,
  onPrint,
  onFilterChange,
  isRefreshing = false,
  className,
}: DashboardHeaderProps) {
  const [activeFilter, setActiveFilter] = useState<QuickFilter>('month');

  const handleFilterClick = (filter: QuickFilter) => {
    setActiveFilter(filter);
    onFilterChange?.(filter);
  };

  const filterLabels: Record<QuickFilter, string> = {
    week: 'Esta Semana',
    month: 'Este Mes',
    quarter: 'Este Trimestre',
    year: 'Este Año',
  };

  // Format date range
  const dateRangeText = dateRange
    ? `${format(dateRange.start, 'dd MMM', { locale: es })} - ${format(dateRange.end, 'dd MMM yyyy', { locale: es })}`
    : format(new Date(), 'MMMM yyyy', { locale: es });

  return (
    <div className={cn('space-y-4', className)}>
      {/* Title Section */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">{title}</h1>
          {subtitle && (
            <p className="text-muted-foreground mt-1">{subtitle}</p>
          )}
          <div className="flex items-center gap-2 mt-2 text-sm text-muted-foreground">
            <Calendar className="h-4 w-4" />
            <span>{dateRangeText}</span>
          </div>
        </div>

        {/* Action Buttons */}
        {showActions && (
          <div className="flex items-center gap-2">
            {onRefresh && (
              <Button
                variant="outline"
                size="sm"
                onClick={onRefresh}
                disabled={isRefreshing}
                className="gap-2"
              >
                <RefreshCw className={cn(
                  'h-4 w-4',
                  isRefreshing && 'animate-spin'
                )} />
                <span className="hidden sm:inline">Actualizar</span>
              </Button>
            )}

            {onExport && (
              <Button
                variant="outline"
                size="sm"
                onClick={onExport}
                className="gap-2"
              >
                <Download className="h-4 w-4" />
                <span className="hidden sm:inline">Exportar</span>
              </Button>
            )}

            {onPrint && (
              <Button
                variant="outline"
                size="sm"
                onClick={onPrint}
                className="gap-2"
              >
                <Printer className="h-4 w-4" />
                <span className="hidden sm:inline">Imprimir</span>
              </Button>
            )}
          </div>
        )}
      </div>

      {/* Quick Filters */}
      {showFilters && (
        <div className="flex items-center gap-2 flex-wrap">
          <div className="flex items-center gap-1 text-sm text-muted-foreground">
            <Filter className="h-4 w-4" />
            <span>Período:</span>
          </div>

          <div className="flex items-center gap-1 border rounded-lg p-1">
            {(Object.keys(filterLabels) as QuickFilter[]).map((filter) => (
              <motion.button
                key={filter}
                onClick={() => handleFilterClick(filter)}
                className={cn(
                  'px-3 py-1.5 text-xs font-medium rounded-md transition-colors',
                  activeFilter === filter
                    ? 'bg-primary text-primary-foreground shadow-sm'
                    : 'hover:bg-muted text-muted-foreground'
                )}
                whileTap={{ scale: 0.95 }}
              >
                {filterLabels[filter]}
              </motion.button>
            ))}
          </div>

          {/* Custom Range Button */}
          <Button variant="outline" size="sm" className="gap-2">
            <Calendar className="h-4 w-4" />
            <span className="hidden sm:inline">Personalizado</span>
            <ChevronDown className="h-3 w-3" />
          </Button>
        </div>
      )}

      {/* Divider */}
      <div className="border-b" />
    </div>
  );
}

// ============================================================================
// Simplified Header Variant
// ============================================================================

export function SimpleDashboardHeader({
  title,
  description,
  onRefresh,
  isRefreshing,
  className,
}: {
  title: string;
  description?: string;
  onRefresh?: () => void;
  isRefreshing?: boolean;
  className?: string;
}) {
  return (
    <div className={cn('flex items-center justify-between', className)}>
      <div>
        <h2 className="text-2xl font-bold tracking-tight">{title}</h2>
        {description && (
          <p className="text-sm text-muted-foreground mt-1">{description}</p>
        )}
      </div>

      {onRefresh && (
        <Button
          variant="ghost"
          size="sm"
          onClick={onRefresh}
          disabled={isRefreshing}
        >
          <RefreshCw className={cn(
            'h-4 w-4',
            isRefreshing && 'animate-spin'
          )} />
        </Button>
      )}
    </div>
  );
}

export default DashboardHeader;
