'use client';

import { formatDistanceToNow } from 'date-fns';
import {
  X,
  User,
  Clock,
  Globe,
  Monitor,
  Shield,
  Eye,
  Settings,
  FileText,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

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

interface AuditLogDetailProps {
  log: AdminAuditLog | null;
  open: boolean;
  onClose: () => void;
}

const getActionIcon = (actionType: string) => {
  switch (actionType) {
    case 'PAGE_VISIBILITY_CHANGE':
      return <Eye className="h-5 w-5" />;
    case 'ROLE_PERMISSION_CHANGE':
      return <Shield className="h-5 w-5" />;
    case 'BULK_OPERATION':
      return <FileText className="h-5 w-5" />;
    case 'CONFIG_CHANGE':
      return <Settings className="h-5 w-5" />;
    default:
      return <FileText className="h-5 w-5" />;
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
    default:
      return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200';
  }
};

const formatActionType = (actionType: string) => {
  return actionType
    .replace(/_/g, ' ')
    .toLowerCase()
    .replace(/\b\w/g, (l) => l.toUpperCase());
};

export function AuditLogDetail({ log, open, onClose }: AuditLogDetailProps) {
  if (!log) return null;

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <div className={`p-2 rounded ${getActionBadgeColor(log.action_type)}`}>
              {getActionIcon(log.action_type)}
            </div>
            <span>Audit Log Details</span>
          </DialogTitle>
        </DialogHeader>

        <ScrollArea className="max-h-[calc(90vh-8rem)] pr-4">
          <div className="space-y-6">
            {/* Action Information */}
            <div className="space-y-3">
              <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                Action Information
              </h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs text-gray-500 dark:text-gray-400">Action Type</label>
                  <p className="text-sm font-medium mt-1">{formatActionType(log.action_type)}</p>
                </div>
                <div>
                  <label className="text-xs text-gray-500 dark:text-gray-400">Resource Type</label>
                  <p className="text-sm font-medium mt-1">
                    <Badge variant="outline">{log.resource_type}</Badge>
                  </p>
                </div>
                {log.resource_key && (
                  <div className="col-span-2">
                    <label className="text-xs text-gray-500 dark:text-gray-400">Resource Key</label>
                    <p className="text-sm font-medium mt-1 font-mono bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded">
                      {log.resource_key}
                    </p>
                  </div>
                )}
              </div>
            </div>

            <Separator />

            {/* Admin User Information */}
            <div className="space-y-3">
              <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100 flex items-center gap-2">
                <User className="h-4 w-4" />
                Admin User
              </h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs text-gray-500 dark:text-gray-400">Username</label>
                  <p className="text-sm font-medium mt-1">
                    {log.admin_user?.username || `User #${log.admin_user_id}`}
                  </p>
                </div>
                {log.admin_user?.full_name && (
                  <div>
                    <label className="text-xs text-gray-500 dark:text-gray-400">Full Name</label>
                    <p className="text-sm font-medium mt-1">{log.admin_user.full_name}</p>
                  </div>
                )}
                {log.admin_user?.email && (
                  <div>
                    <label className="text-xs text-gray-500 dark:text-gray-400">Email</label>
                    <p className="text-sm font-medium mt-1">{log.admin_user.email}</p>
                  </div>
                )}
                {log.admin_user?.role && (
                  <div>
                    <label className="text-xs text-gray-500 dark:text-gray-400">Role</label>
                    <p className="text-sm font-medium mt-1">
                      <Badge>{log.admin_user.role}</Badge>
                    </p>
                  </div>
                )}
              </div>
            </div>

            <Separator />

            {/* Change Details */}
            {(log.previous_value || log.new_value) && (
              <>
                <div className="space-y-3">
                  <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                    Change Details
                  </h3>
                  <div className="grid grid-cols-2 gap-4">
                    {log.previous_value && (
                      <div>
                        <label className="text-xs text-gray-500 dark:text-gray-400">
                          Previous Value
                        </label>
                        <div className="mt-1 px-3 py-2 bg-red-50 border border-red-200 rounded text-sm text-red-700 dark:bg-red-900/30 dark:text-red-300">
                          {log.previous_value === 'True' || log.previous_value === 'true'
                            ? '✓ Enabled'
                            : log.previous_value === 'False' || log.previous_value === 'false'
                            ? '✗ Disabled'
                            : log.previous_value}
                        </div>
                      </div>
                    )}
                    {log.new_value && (
                      <div>
                        <label className="text-xs text-gray-500 dark:text-gray-400">
                          New Value
                        </label>
                        <div className="mt-1 px-3 py-2 bg-green-50 border border-green-200 rounded text-sm text-green-700 dark:bg-green-900/30 dark:text-green-300">
                          {log.new_value === 'True' || log.new_value === 'true'
                            ? '✓ Enabled'
                            : log.new_value === 'False' || log.new_value === 'false'
                            ? '✗ Disabled'
                            : log.new_value}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
                <Separator />
              </>
            )}

            {/* Description */}
            {log.description && (
              <>
                <div className="space-y-3">
                  <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                    Description
                  </h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400 p-3 bg-gray-50 dark:bg-gray-800 rounded">
                    {log.description}
                  </p>
                </div>
                <Separator />
              </>
            )}

            {/* Request Information */}
            <div className="space-y-3">
              <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100 flex items-center gap-2">
                <Globe className="h-4 w-4" />
                Request Information
              </h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs text-gray-500 dark:text-gray-400 flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    Timestamp
                  </label>
                  <p className="text-sm font-medium mt-1">
                    {new Date(log.created_at).toLocaleString()}
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    {formatDistanceToNow(new Date(log.created_at), { addSuffix: true })}
                  </p>
                </div>
                {log.ip_address && (
                  <div>
                    <label className="text-xs text-gray-500 dark:text-gray-400 flex items-center gap-1">
                      <Globe className="h-3 w-3" />
                      IP Address
                    </label>
                    <p className="text-sm font-medium mt-1 font-mono">{log.ip_address}</p>
                  </div>
                )}
              </div>
              {log.user_agent && (
                <div>
                  <label className="text-xs text-gray-500 dark:text-gray-400 flex items-center gap-1">
                    <Monitor className="h-3 w-3" />
                    User Agent
                  </label>
                  <p className="text-xs text-gray-600 dark:text-gray-400 mt-1 font-mono bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded break-all">
                    {log.user_agent}
                  </p>
                </div>
              )}
            </div>

            {/* Metadata */}
            {log.metadata && Object.keys(log.metadata).length > 0 && (
              <>
                <Separator />
                <div className="space-y-3">
                  <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                    Additional Metadata
                  </h3>
                  <pre className="text-xs bg-gray-100 dark:bg-gray-800 p-3 rounded overflow-x-auto">
                    {JSON.stringify(log.metadata, null, 2)}
                  </pre>
                </div>
              </>
            )}
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
