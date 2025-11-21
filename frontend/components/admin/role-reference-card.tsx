'use client';

import { Shield, Users, UserCog, PieChart, TrendingUp } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { LegacyRoleBadge } from './legacy-role-badge';

type RoleCategory = 'core' | 'modern' | 'legacy';

interface RoleInfo {
  key: string;
  name: string;
  category: RoleCategory;
  icon: React.ComponentType<{ className?: string }>;
  description: string;
  capabilities: string[];
  migrationNote?: string;
}

const ROLE_CATEGORIES: Record<RoleCategory, { label: string; color: string; bgColor: string }> = {
  core: {
    label: 'Core Roles',
    color: 'text-blue-600 dark:text-blue-400',
    bgColor: 'bg-blue-50 dark:bg-blue-950/30',
  },
  modern: {
    label: 'Modern Roles',
    color: 'text-green-600 dark:text-green-400',
    bgColor: 'bg-green-50 dark:bg-green-950/30',
  },
  legacy: {
    label: 'Legacy Roles',
    color: 'text-orange-600 dark:text-orange-400',
    bgColor: 'bg-orange-50 dark:bg-orange-950/30',
  },
};

const ROLES_INFO: RoleInfo[] = [
  {
    key: 'SUPER_ADMIN',
    name: 'Super Administrator',
    category: 'core',
    icon: Shield,
    description: 'Full system control with all permissions',
    capabilities: [
      'Complete database access',
      'User management',
      'System configuration',
      'All module access',
      'Security settings',
    ],
  },
  {
    key: 'ADMIN',
    name: 'Administrator',
    category: 'core',
    icon: Shield,
    description: 'All permissions except database management',
    capabilities: [
      'User management',
      'Module configuration',
      'All business operations',
      'Reporting and analytics',
      'System settings',
    ],
  },
  {
    key: 'COORDINATOR',
    name: 'Coordinator',
    category: 'modern',
    icon: Users,
    description: 'HR + Reporting (modern coordination role)',
    capabilities: [
      'Employee management',
      'Candidate management',
      'Factory assignments',
      'Report generation',
      'Request approval',
    ],
  },
  {
    key: 'KANRININSHA',
    name: 'Manager (管理人者)',
    category: 'modern',
    icon: TrendingUp,
    description: 'Manager - HR + Finance operations',
    capabilities: [
      'HR operations',
      'Finance management',
      'Payroll processing',
      'Leave approval',
      'Team oversight',
    ],
  },
  {
    key: 'KEITOSAN',
    name: 'Finance Manager (経都算)',
    category: 'legacy',
    icon: PieChart,
    description: 'Finance Manager (legacy - for yukyu approval)',
    capabilities: ['Leave approval', 'Financial reports', 'Budget oversight'],
    migrationNote: 'Migrate to KANRININSHA for enhanced permissions and modern workflow',
  },
  {
    key: 'TANTOSHA',
    name: 'HR Representative (担当者)',
    category: 'legacy',
    icon: Users,
    description: 'HR Representative (legacy - for yukyu creation)',
    capabilities: ['Leave request creation', 'Employee records', 'Basic HR tasks'],
    migrationNote: 'Migrate to KANRININSHA for enhanced permissions and modern workflow',
  },
  {
    key: 'EMPLOYEE',
    name: 'Employee (社員)',
    category: 'modern',
    icon: UserCog,
    description: 'Self-service access for employees',
    capabilities: [
      'Personal dashboard',
      'Leave requests',
      'Timecard viewing',
      'Salary information',
      'Profile management',
    ],
  },
  {
    key: 'CONTRACT_WORKER',
    name: 'Contract Worker (契約社員)',
    category: 'modern',
    icon: UserCog,
    description: 'Minimal access for contract workers',
    capabilities: ['Basic dashboard', 'Timecard viewing', 'Personal information'],
  },
];

export function RoleReferenceCard() {
  const groupedRoles = ROLES_INFO.reduce((acc, role) => {
    if (!acc[role.category]) {
      acc[role.category] = [];
    }
    acc[role.category].push(role);
    return acc;
  }, {} as Record<RoleCategory, RoleInfo[]>);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Shield className="h-5 w-5" />
          Role Reference Guide
        </CardTitle>
        <CardDescription>
          Complete overview of all system roles, their capabilities, and migration recommendations
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {Object.entries(groupedRoles).map(([category, roles]) => {
          const categoryInfo = ROLE_CATEGORIES[category as RoleCategory];
          return (
            <div key={category} className="space-y-3">
              <div className="flex items-center gap-2">
                <Badge className={`${categoryInfo.bgColor} ${categoryInfo.color} border-0`}>
                  {categoryInfo.label}
                </Badge>
                {category === 'legacy' && (
                  <span className="text-xs text-muted-foreground">(Backward compatibility only)</span>
                )}
              </div>

              <div className="grid gap-3">
                {roles.map((role) => {
                  const Icon = role.icon;
                  return (
                    <div
                      key={role.key}
                      className="p-4 border rounded-lg hover:bg-accent/50 transition-colors"
                    >
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <Icon className="h-5 w-5 text-primary" />
                          <div>
                            <div className="font-semibold flex items-center gap-2">
                              {role.name}
                              {role.category === 'legacy' && (
                                <LegacyRoleBadge role={role.key as 'KEITOSAN' | 'TANTOSHA'} />
                              )}
                            </div>
                            <div className="text-xs text-muted-foreground">{role.key}</div>
                          </div>
                        </div>
                      </div>

                      <p className="text-sm text-muted-foreground mb-3">{role.description}</p>

                      <div className="space-y-2">
                        <div className="text-xs font-medium text-muted-foreground">Key Capabilities:</div>
                        <ul className="text-xs space-y-1 ml-4 list-disc text-muted-foreground">
                          {role.capabilities.map((capability, idx) => (
                            <li key={idx}>{capability}</li>
                          ))}
                        </ul>
                      </div>

                      {role.migrationNote && (
                        <div className="mt-3 p-2 bg-orange-50 dark:bg-orange-950/30 border border-orange-200 dark:border-orange-800 rounded text-xs">
                          <strong className="text-orange-600 dark:text-orange-400">
                            Migration Recommendation:
                          </strong>
                          <p className="text-muted-foreground mt-1">{role.migrationNote}</p>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}
