'use client';

import { AlertTriangle } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

interface LegacyRoleBadgeProps {
  role: 'KEITOSAN' | 'TANTOSHA';
  deprecationVersion?: string;
  migrationRole?: string;
  className?: string;
}

const MIGRATION_INFO = {
  KEITOSAN: {
    description: 'Legacy Finance Manager role',
    migrateToRole: 'KANRININSHA',
    migrateToName: 'Manager (管理人者)',
    reason: 'Use for yukyu (leave) approval - will be migrated to KANRININSHA with enhanced permissions',
  },
  TANTOSHA: {
    description: 'Legacy HR Representative role',
    migrateToRole: 'KANRININSHA',
    migrateToName: 'Manager (管理人者)',
    reason: 'Use for yukyu (leave) creation - will be migrated to KANRININSHA with enhanced permissions',
  },
};

export function LegacyRoleBadge({
  role,
  deprecationVersion = '6.0',
  migrationRole,
  className,
}: LegacyRoleBadgeProps) {
  const info = MIGRATION_INFO[role];
  const targetRole = migrationRole || info.migrateToRole;

  return (
    <TooltipProvider>
      <Tooltip delayDuration={300}>
        <TooltipTrigger asChild>
          <Badge
            variant="outline"
            className={`gap-1 border-orange-500 text-orange-600 dark:text-orange-400 bg-orange-50 dark:bg-orange-950/30 ${className}`}
          >
            <AlertTriangle className="h-3 w-3" />
            Legacy
          </Badge>
        </TooltipTrigger>
        <TooltipContent className="max-w-sm" side="right">
          <div className="space-y-2">
            <div className="font-semibold text-orange-600 dark:text-orange-400 flex items-center gap-2">
              <AlertTriangle className="h-4 w-4" />
              Deprecated in v{deprecationVersion}
            </div>
            <div className="text-sm space-y-1">
              <p className="text-muted-foreground">{info.description}</p>
              <p className="font-medium">
                Migration Path: {role} → {targetRole}
              </p>
              <p className="text-xs text-muted-foreground">{info.reason}</p>
            </div>
            <div className="pt-2 border-t text-xs text-muted-foreground">
              <p>⚠️ This role is maintained for backward compatibility.</p>
              <p className="mt-1">
                <strong>Recommendation:</strong> Migrate to {info.migrateToName} for full feature support.
              </p>
            </div>
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
