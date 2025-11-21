'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { History, Eye, EyeOff, User, Clock, ChevronRight, RefreshCw } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { formatDistanceToNow } from 'date-fns';

interface AuditLogEntry {
  id: number;
  admin_username: string;
  action_type: 'enable' | 'disable' | 'bulk_enable' | 'bulk_disable' | 'update';
  target_type: 'page' | 'role_permission' | 'global';
  target_name: string;
  role_key?: string;
  details?: string;
  timestamp: string;
  created_at: string;
}

interface AuditTrailPanelProps {
  recentChanges?: AuditLogEntry[];
  loading?: boolean;
  onRefresh?: () => void;
  onViewFullHistory?: () => void;
}

const getActionBadge = (actionType: string) => {
  switch (actionType) {
    case 'enable':
      return (
        <Badge variant="default" className="bg-green-600 gap-1">
          <Eye className="h-3 w-3" />
          Enabled
        </Badge>
      );
    case 'disable':
      return (
        <Badge variant="destructive" className="gap-1">
          <EyeOff className="h-3 w-3" />
          Disabled
        </Badge>
      );
    case 'bulk_enable':
      return (
        <Badge variant="default" className="bg-green-600 gap-1">
          <Eye className="h-3 w-3" />
          Bulk Enable
        </Badge>
      );
    case 'bulk_disable':
      return (
        <Badge variant="destructive" className="gap-1">
          <EyeOff className="h-3 w-3" />
          Bulk Disable
        </Badge>
      );
    case 'update':
      return (
        <Badge variant="outline" className="gap-1">
          <RefreshCw className="h-3 w-3" />
          Updated
        </Badge>
      );
    default:
      return <Badge variant="outline">{actionType}</Badge>;
  }
};

const getActionDescription = (entry: AuditLogEntry): string => {
  const role = entry.role_key ? ` for ${entry.role_key}` : '';
  switch (entry.action_type) {
    case 'enable':
      return `Enabled ${entry.target_name}${role}`;
    case 'disable':
      return `Disabled ${entry.target_name}${role}`;
    case 'bulk_enable':
      return `Enabled multiple pages${role}`;
    case 'bulk_disable':
      return `Disabled multiple pages${role}`;
    case 'update':
      return `Updated ${entry.target_name}${role}`;
    default:
      return `${entry.action_type} ${entry.target_name}${role}`;
  }
};

export function AuditTrailPanel({
  recentChanges = [],
  loading = false,
  onRefresh,
  onViewFullHistory,
}: AuditTrailPanelProps) {
  const [refreshing, setRefreshing] = useState(false);

  const handleRefresh = async () => {
    if (onRefresh) {
      setRefreshing(true);
      await onRefresh();
      setTimeout(() => setRefreshing(false), 500);
    }
  };

  // Limit to 10 most recent changes
  const displayedChanges = recentChanges.slice(0, 10);

  return (
    <Card className="h-full">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2 text-lg">
              <History className="h-5 w-5" />
              Recent Changes
            </CardTitle>
            <CardDescription>Last 10 administrative actions</CardDescription>
          </div>
          {onRefresh && (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleRefresh}
              disabled={refreshing || loading}
              className="gap-1"
            >
              <RefreshCw className={`h-3 w-3 ${refreshing ? 'animate-spin' : ''}`} />
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent className="px-0 pb-0">
        <ScrollArea className="h-[600px]">
          <div className="px-6 pb-6">
            {loading && (
              <div className="space-y-3">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="animate-pulse">
                    <div className="h-20 bg-muted rounded-lg" />
                  </div>
                ))}
              </div>
            )}

            {!loading && displayedChanges.length === 0 && (
              <div className="text-center py-12 text-muted-foreground">
                <History className="h-12 w-12 mx-auto mb-3 opacity-50" />
                <p>No recent changes</p>
                <p className="text-xs mt-1">Administrative actions will appear here</p>
              </div>
            )}

            {!loading && displayedChanges.length > 0 && (
              <div className="space-y-3">
                {displayedChanges.map((entry, index) => (
                  <motion.div
                    key={entry.id}
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className="p-3 border rounded-lg hover:bg-accent/50 transition-colors"
                  >
                    <div className="flex items-start gap-3">
                      <div className="mt-1">
                        {getActionBadge(entry.action_type)}
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2 mb-1">
                          <p className="text-sm font-medium leading-tight">
                            {getActionDescription(entry)}
                          </p>
                        </div>

                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          <div className="flex items-center gap-1">
                            <User className="h-3 w-3" />
                            <span>{entry.admin_username}</span>
                          </div>
                          <span>•</span>
                          <div className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            <span>
                              {formatDistanceToNow(new Date(entry.created_at || entry.timestamp), {
                                addSuffix: true,
                              })}
                            </span>
                          </div>
                        </div>

                        {entry.details && (
                          <p className="text-xs text-muted-foreground mt-2 bg-muted/50 p-2 rounded">
                            {entry.details}
                          </p>
                        )}

                        {entry.target_type === 'role_permission' && (
                          <Badge variant="secondary" className="mt-2 text-xs">
                            {entry.role_key}
                          </Badge>
                        )}
                      </div>
                    </div>

                    {index < displayedChanges.length - 1 && <Separator className="mt-3" />}
                  </motion.div>
                ))}
              </div>
            )}
          </div>
        </ScrollArea>

        {onViewFullHistory && displayedChanges.length > 0 && (
          <div className="px-6 pb-4 pt-2 border-t">
            <Button
              variant="outline"
              size="sm"
              onClick={onViewFullHistory}
              className="w-full gap-2"
            >
              View Full History
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
