'use client';

import { motion } from 'framer-motion';
import { TrendingUp, TrendingDown, Minus, Shield, Users, UserCog, PieChart } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { LegacyRoleBadge } from './legacy-role-badge';

interface RoleStats {
  role_key: string;
  role_name: string;
  total_pages: number;
  enabled_pages: number;
  disabled_pages: number;
  percentage: number;
}

interface EnhancedRoleStatsProps {
  roleStats: RoleStats[];
  loading?: boolean;
}

const getRoleIcon = (roleKey: string) => {
  switch (roleKey) {
    case 'SUPER_ADMIN':
    case 'ADMIN':
      return Shield;
    case 'COORDINATOR':
    case 'TANTOSHA':
    case 'KANRININSHA':
      return Users;
    case 'KEITOSAN':
      return PieChart;
    case 'EMPLOYEE':
    case 'CONTRACT_WORKER':
      return UserCog;
    default:
      return Users;
  }
};

const getProgressColor = (percentage: number): string => {
  if (percentage >= 80) return 'bg-green-500';
  if (percentage >= 50) return 'bg-yellow-500';
  return 'bg-red-500';
};

const getProgressTextColor = (percentage: number): string => {
  if (percentage >= 80) return 'text-green-600 dark:text-green-400';
  if (percentage >= 50) return 'text-yellow-600 dark:text-yellow-400';
  return 'text-red-600 dark:text-red-400';
};

const getAccessLevel = (percentage: number): { label: string; icon: React.ComponentType<{ className?: string }> } => {
  if (percentage >= 80) return { label: 'Full Access', icon: TrendingUp };
  if (percentage >= 50) return { label: 'Medium Access', icon: Minus };
  return { label: 'Minimal Access', icon: TrendingDown };
};

const isLegacyRole = (roleKey: string): boolean => {
  return roleKey === 'KEITOSAN' || roleKey === 'TANTOSHA';
};

export function EnhancedRoleStats({ roleStats, loading = false }: EnhancedRoleStatsProps) {
  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Role Access Statistics</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="animate-pulse">
                <div className="h-20 bg-muted rounded-lg" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  // Sort roles: Core roles first, then Modern, then Legacy
  const sortedRoles = [...roleStats].sort((a, b) => {
    const order = ['SUPER_ADMIN', 'ADMIN', 'COORDINATOR', 'KANRININSHA', 'EMPLOYEE', 'CONTRACT_WORKER', 'KEITOSAN', 'TANTOSHA'];
    return order.indexOf(a.role_key) - order.indexOf(b.role_key);
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Shield className="h-5 w-5" />
          Role Access Statistics
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {sortedRoles.map((stat, index) => {
            const Icon = getRoleIcon(stat.role_key);
            const progressColor = getProgressColor(stat.percentage);
            const textColor = getProgressTextColor(stat.percentage);
            const accessLevel = getAccessLevel(stat.percentage);
            const AccessIcon = accessLevel.icon;

            return (
              <motion.div
                key={stat.role_key}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.05 }}
                className="p-4 border rounded-lg hover:bg-accent/50 transition-colors"
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <Icon className="h-5 w-5 text-primary" />
                    <div>
                      <div className="font-semibold flex items-center gap-2">
                        {stat.role_name}
                        {isLegacyRole(stat.role_key) && (
                          <LegacyRoleBadge role={stat.role_key as 'KEITOSAN' | 'TANTOSHA'} />
                        )}
                      </div>
                      <div className="text-xs text-muted-foreground">{stat.role_key}</div>
                    </div>
                  </div>

                  <div className="text-right">
                    <div className={`text-2xl font-bold ${textColor}`}>
                      {stat.percentage.toFixed(0)}%
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {stat.enabled_pages}/{stat.total_pages} pages
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <Badge
                      variant="outline"
                      className={`gap-1 ${
                        stat.percentage >= 80
                          ? 'bg-green-50 dark:bg-green-950/30 border-green-500 text-green-600 dark:text-green-400'
                          : stat.percentage >= 50
                          ? 'bg-yellow-50 dark:bg-yellow-950/30 border-yellow-500 text-yellow-600 dark:text-yellow-400'
                          : 'bg-red-50 dark:bg-red-950/30 border-red-500 text-red-600 dark:text-red-400'
                      }`}
                    >
                      <AccessIcon className="h-3 w-3" />
                      {accessLevel.label}
                    </Badge>
                    <span className="text-muted-foreground">
                      {stat.disabled_pages} disabled
                    </span>
                  </div>

                  <Progress
                    value={stat.percentage}
                    className="h-2"
                    // @ts-ignore - Custom className for indicator
                    indicatorClassName={progressColor}
                  />
                </div>

                {/* Comparison indicator */}
                {stat.percentage < 50 && (
                  <div className="mt-2 text-xs text-orange-600 dark:text-orange-400 flex items-center gap-1">
                    <TrendingDown className="h-3 w-3" />
                    Below expected access level
                  </div>
                )}

                {stat.percentage >= 90 && (
                  <div className="mt-2 text-xs text-green-600 dark:text-green-400 flex items-center gap-1">
                    <TrendingUp className="h-3 w-3" />
                    Full or near-full access
                  </div>
                )}
              </motion.div>
            );
          })}

          {sortedRoles.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              No role statistics available
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
