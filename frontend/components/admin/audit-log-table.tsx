'use client';

import { useState } from 'react';
import { formatDistanceToNow } from 'date-fns';
import {
  Eye,
  Shield,
  Settings,
  Users,
  FileText,
  Clock,
  AlertCircle,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

// Types
export interface AdminAuditLog {
  id: number;
  admin_user_id: number;
  admin_user?: {
    id: number;
    username: string;
    full_name?: string;
    email?: string;
    role: string;
  };
  action_type: string;
  resource_type: string;
  resource_key?: string;
  previous_value?: string;
  new_value?: string;
  description?: string;
  ip_address?: string;
  user_agent?: string;
  metadata?: Record<string, any>;
  created_at: string;
  updated_at?: string;
}

interface AuditLogTableProps {
  logs: AdminAuditLog[];
  onRowClick?: (log: AdminAuditLog) => void;
  isLoading?: boolean;
}

// Action type icons and colors
const getActionIcon = (actionType: string) => {
  switch (actionType) {
    case 'PAGE_VISIBILITY_CHANGE':
      return <Eye className="h-4 w-4" />;
    case 'ROLE_PERMISSION_CHANGE':
      return <Shield className="h-4 w-4" />;
    case 'BULK_OPERATION':
      return <FileText className="h-4 w-4" />;
    case 'CONFIG_CHANGE':
      return <Settings className="h-4 w-4" />;
    case 'CACHE_CLEAR':
      return <AlertCircle className="h-4 w-4" />;
    case 'USER_MANAGEMENT':
      return <Users className="h-4 w-4" />;
    default:
      return <FileText className="h-4 w-4" />;
  }
};

const getActionBadgeColor = (actionType: string) => {
  switch (actionType) {
    case 'PAGE_VISIBILITY_CHANGE':
      return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
    case 'ROLE_PERMISSION_CHANGE':
      return 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200';
    case 'BULK_OPERATION':
      return 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200';
    case 'CONFIG_CHANGE':
      return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200';
    case 'CACHE_CLEAR':
      return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
    case 'USER_MANAGEMENT':
      return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
    default:
      return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200';
  }
};

// Format action type for display
const formatActionType = (actionType: string) => {
  return actionType
    .replace(/_/g, ' ')
    .toLowerCase()
    .replace(/\b\w/g, (l) => l.toUpperCase());
};

// Format resource type badge
const getResourceBadge = (resourceType: string) => {
  const colors: Record<string, string> = {
    PAGE: 'bg-blue-50 text-blue-700 border-blue-200',
    ROLE: 'bg-purple-50 text-purple-700 border-purple-200',
    SYSTEM: 'bg-gray-50 text-gray-700 border-gray-200',
    USER: 'bg-green-50 text-green-700 border-green-200',
    PERMISSION: 'bg-orange-50 text-orange-700 border-orange-200',
  };

  return (
    <Badge variant="outline" className={colors[resourceType] || ''}>
      {resourceType}
    </Badge>
  );
};

// Format change display
const formatChange = (previousValue?: string, newValue?: string) => {
  if (!previousValue && !newValue) return null;

  return (
    <div className="flex items-center gap-2 text-sm">
      {previousValue && (
        <span className="px-2 py-1 bg-red-50 text-red-700 rounded border border-red-200 dark:bg-red-900/30 dark:text-red-300">
          {previousValue === 'True' || previousValue === 'true' ? '✓ Enabled' : '✗ Disabled'}
        </span>
      )}
      <span className="text-gray-400">→</span>
      {newValue && (
        <span className="px-2 py-1 bg-green-50 text-green-700 rounded border border-green-200 dark:bg-green-900/30 dark:text-green-300">
          {newValue === 'True' || newValue === 'true' ? '✓ Enabled' : '✗ Disabled'}
        </span>
      )}
    </div>
  );
};

export function AuditLogTable({ logs, onRowClick, isLoading = false }: AuditLogTableProps) {
  const [expandedRow, setExpandedRow] = useState<number | null>(null);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  if (!logs || logs.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <FileText className="h-12 w-12 text-gray-400 mb-4" />
        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">
          No audit logs found
        </h3>
        <p className="text-sm text-gray-500 dark:text-gray-400">
          There are no audit log entries matching your criteria.
        </p>
      </div>
    );
  }

  const toggleRow = (id: number) => {
    setExpandedRow(expandedRow === id ? null : id);
  };

  return (
    <div className="border rounded-lg overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-12"></TableHead>
            <TableHead>Timestamp</TableHead>
            <TableHead>Admin</TableHead>
            <TableHead>Action</TableHead>
            <TableHead>Resource</TableHead>
            <TableHead>Change</TableHead>
            <TableHead className="w-20">Details</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {logs.map((log) => (
            <>
              <TableRow
                key={log.id}
                className="cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800"
                onClick={() => onRowClick?.(log)}
              >
                <TableCell>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleRow(log.id);
                    }}
                  >
                    {expandedRow === log.id ? (
                      <ChevronUp className="h-4 w-4" />
                    ) : (
                      <ChevronDown className="h-4 w-4" />
                    )}
                  </Button>
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4 text-gray-400" />
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <span className="text-sm">
                            {formatDistanceToNow(new Date(log.created_at), { addSuffix: true })}
                          </span>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>{new Date(log.created_at).toLocaleString()}</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </div>
                </TableCell>
                <TableCell>
                  <div className="flex flex-col">
                    <span className="font-medium text-sm">
                      {log.admin_user?.username || `User #${log.admin_user_id}`}
                    </span>
                    {log.admin_user?.full_name && (
                      <span className="text-xs text-gray-500">{log.admin_user.full_name}</span>
                    )}
                  </div>
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <div className={`p-1.5 rounded ${getActionBadgeColor(log.action_type)}`}>
                      {getActionIcon(log.action_type)}
                    </div>
                    <span className="text-sm">{formatActionType(log.action_type)}</span>
                  </div>
                </TableCell>
                <TableCell>
                  <div className="flex flex-col gap-1">
                    {getResourceBadge(log.resource_type)}
                    {log.resource_key && (
                      <span className="text-xs text-gray-600 dark:text-gray-400 font-mono">
                        {log.resource_key}
                      </span>
                    )}
                  </div>
                </TableCell>
                <TableCell>
                  {formatChange(log.previous_value, log.new_value)}
                </TableCell>
                <TableCell>
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button variant="ghost" size="sm">
                          <Eye className="h-4 w-4" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>View details</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </TableCell>
              </TableRow>
              {expandedRow === log.id && (
                <TableRow>
                  <TableCell colSpan={7} className="bg-gray-50 dark:bg-gray-900">
                    <div className="p-4 space-y-3">
                      {log.description && (
                        <div>
                          <span className="font-semibold text-sm">Description:</span>
                          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                            {log.description}
                          </p>
                        </div>
                      )}
                      {log.ip_address && (
                        <div>
                          <span className="font-semibold text-sm">IP Address:</span>
                          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1 font-mono">
                            {log.ip_address}
                          </p>
                        </div>
                      )}
                      {log.metadata && Object.keys(log.metadata).length > 0 && (
                        <div>
                          <span className="font-semibold text-sm">Metadata:</span>
                          <pre className="text-xs bg-gray-100 dark:bg-gray-800 p-2 rounded mt-1 overflow-x-auto">
                            {JSON.stringify(log.metadata, null, 2)}
                          </pre>
                        </div>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              )}
            </>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
