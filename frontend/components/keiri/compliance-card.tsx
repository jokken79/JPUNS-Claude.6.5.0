'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { AlertTriangle, CheckCircle2, AlertCircle } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';
import { useState, useEffect } from 'react';
import { shouldReduceMotion } from '@/lib/animations';

// ============================================================================
// Types
// ============================================================================

export interface ComplianceEmployee {
  employeeId: number;
  employeeName: string;
  totalUsedThisYear: number;
  totalRemaining: number;
  legalMinimum: number;
  isCompliant: boolean;
  warning?: string;
}

export interface ComplianceStatusData {
  period: string;
  totalEmployees: number;
  compliantEmployees: number;
  nonCompliantEmployees: number;
  employeesDetails: ComplianceEmployee[];
}

// ============================================================================
// Component
// ============================================================================

interface ComplianceCardProps {
  data: ComplianceStatusData;
  loading?: boolean;
  className?: string;
  showDetails?: boolean;
  maxDetailsDisplay?: number;
}

export function ComplianceCard({
  data,
  loading = false,
  className,
  showDetails = true,
  maxDetailsDisplay = 5,
}: ComplianceCardProps) {
  const reducedMotion = shouldReduceMotion();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const complianceRate = data.totalEmployees > 0
    ? Math.round((data.compliantEmployees / data.totalEmployees) * 100)
    : 0;

  const hasNonCompliant = data.nonCompliantEmployees > 0;

  if (loading) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle>Yukyu Compliance Status</CardTitle>
          <CardDescription>Japanese labor law compliance (Article 39)</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <Skeleton className="h-16 w-full rounded" />
            <Skeleton className="h-20 w-full rounded" />
          </div>
        </CardContent>
      </Card>
    );
  }

  const containerVariants = {
    hidden: reducedMotion ? {} : { opacity: 0 },
    visible: reducedMotion ? {} : {
      opacity: 1,
      transition: { staggerChildren: 0.1, delayChildren: 0.1 },
    },
  };

  const itemVariants = {
    hidden: reducedMotion ? {} : { opacity: 0, y: 10 },
    visible: reducedMotion ? {} : { opacity: 1, y: 0 },
  };

  const displayedDetails = showDetails
    ? data.employeesDetails.slice(0, maxDetailsDisplay)
    : [];

  return (
    <motion.div
      initial="hidden"
      animate="visible"
      variants={containerVariants}
    >
      <Card className={cn(hasNonCompliant && 'border-amber-200 dark:border-amber-800', className)}>
        <CardHeader>
          <div className="flex items-start justify-between">
            <div>
              <CardTitle>Yukyu Compliance Status</CardTitle>
              <CardDescription>
                {data.period} - Japanese labor law compliance (Article 39)
              </CardDescription>
            </div>
            {hasNonCompliant ? (
              <AlertTriangle className="h-6 w-6 text-amber-600" />
            ) : (
              <CheckCircle2 className="h-6 w-6 text-emerald-600" />
            )}
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Summary Stats */}
          <motion.div
            variants={itemVariants}
            className="grid grid-cols-2 gap-4 sm:grid-cols-3"
          >
            <div className="text-center">
              <div className="text-2xl font-bold">{complianceRate}%</div>
              <div className="text-xs text-muted-foreground">Compliance Rate</div>
            </div>
            <div className="text-center">
              <div className={cn(
                'text-2xl font-bold',
                data.compliantEmployees > 0 ? 'text-emerald-600' : 'text-gray-400'
              )}>
                {data.compliantEmployees}
              </div>
              <div className="text-xs text-muted-foreground">Compliant</div>
            </div>
            <div className="text-center">
              <div className={cn(
                'text-2xl font-bold',
                hasNonCompliant ? 'text-amber-600' : 'text-gray-400'
              )}>
                {data.nonCompliantEmployees}
              </div>
              <div className="text-xs text-muted-foreground">At Risk</div>
            </div>
          </motion.div>

          {/* Compliance Bar */}
          <motion.div
            variants={itemVariants}
            className="space-y-2"
          >
            <div className="flex items-center justify-between text-sm">
              <span className="font-medium">Overall Status</span>
              <Badge
                variant={complianceRate >= 100 ? 'default' : 'destructive'}
                className={complianceRate >= 100 ? 'bg-emerald-500' : 'bg-amber-500'}
              >
                {complianceRate >= 100 ? '✓ Compliant' : `⚠ ${data.nonCompliantEmployees} at risk`}
              </Badge>
            </div>
            <div className="h-2 bg-gray-200 rounded-full overflow-hidden dark:bg-gray-800">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${complianceRate}%` }}
                transition={{ duration: 1, delay: 0.3 }}
                className={cn(
                  'h-full transition-colors',
                  complianceRate >= 100 ? 'bg-emerald-500' : 'bg-amber-500'
                )}
              />
            </div>
          </motion.div>

          {/* Alert Message */}
          {hasNonCompliant && (
            <motion.div
              variants={itemVariants}
              className="rounded-lg bg-amber-50 dark:bg-amber-950/20 p-3 border border-amber-200 dark:border-amber-800"
            >
              <div className="flex items-start gap-2">
                <AlertCircle className="h-5 w-5 text-amber-600 flex-shrink-0 mt-0.5" />
                <div className="text-sm text-amber-900 dark:text-amber-100">
                  <p className="font-medium mb-1">Non-Compliance Warning</p>
                  <p>{data.nonCompliantEmployees} employee{data.nonCompliantEmployees !== 1 ? 's' : ''} below the legal minimum of 5 days</p>
                </div>
              </div>
            </motion.div>
          )}

          {/* Detailed List */}
          {showDetails && displayedDetails.length > 0 && (
            <motion.div
              variants={itemVariants}
              className="space-y-3 border-t pt-4"
            >
              <h4 className="font-medium text-sm">
                {data.nonCompliantEmployees > 0
                  ? 'Employees Below Minimum'
                  : 'Recent Employees'}
              </h4>
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {displayedDetails.map((employee) => (
                  <motion.div
                    key={employee.employeeId}
                    variants={itemVariants}
                    className={cn(
                      'rounded-lg p-3 text-sm',
                      employee.isCompliant
                        ? 'bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-800'
                        : 'bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800'
                    )}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <p className="font-medium truncate">{employee.employeeName}</p>
                        <p className="text-xs text-muted-foreground mt-1">
                          Used: {employee.totalUsedThisYear.toFixed(1)} days | Remaining: {employee.totalRemaining.toFixed(1)} days
                        </p>
                        {employee.warning && (
                          <p className="text-xs mt-1 text-amber-600 dark:text-amber-400">
                            {employee.warning}
                          </p>
                        )}
                      </div>
                      <Badge
                        variant={employee.isCompliant ? 'outline' : 'secondary'}
                        className={employee.isCompliant
                          ? 'text-emerald-700 border-emerald-200'
                          : 'text-amber-700 border-amber-200'
                        }
                      >
                        {employee.isCompliant ? '✓' : '⚠'}
                      </Badge>
                    </div>
                  </motion.div>
                ))}
              </div>

              {data.employeesDetails.length > maxDetailsDisplay && (
                <p className="text-xs text-muted-foreground text-center pt-2">
                  +{data.employeesDetails.length - maxDetailsDisplay} more
                </p>
              )}
            </motion.div>
          )}

          {/* Legal Info */}
          <motion.div
            variants={itemVariants}
            className="text-xs text-muted-foreground pt-2 border-t"
          >
            <p>
              <strong>Article 39 (Japanese Labor Law):</strong> Employers must provide minimum 5 days of paid annual leave per year
            </p>
          </motion.div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
