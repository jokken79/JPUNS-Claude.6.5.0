'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { CheckCircle2, XCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

// ============================================================================
// Types
// ============================================================================

export interface PendingYukyuRequest {
  id: number;
  employeeId: number;
  employeeName: string;
  daysRequested: number;
  startDate: string; // Format: YYYY-MM-DD
  endDate: string; // Format: YYYY-MM-DD
  reason?: string;
  requestedAt: string; // ISO datetime
  factoryId?: string;
  factoryName?: string;
}

// ============================================================================
// Component
// ============================================================================

interface PendingRequestsTableProps {
  requests: PendingYukyuRequest[];
  loading?: boolean;
  onApprove?: (requestId: number) => Promise<void>;
  onReject?: (requestId: number) => Promise<void>;
  className?: string;
}

export function PendingRequestsTable({
  requests,
  loading = false,
  onApprove,
  onReject,
  className,
}: PendingRequestsTableProps) {
  const [approvingId, setApprovingId] = useState<number | null>(null);
  const [rejectingId, setRejectingId] = useState<number | null>(null);

  const handleApprove = async (requestId: number) => {
    if (!onApprove) return;

    setApprovingId(requestId);
    try {
      await onApprove(requestId);
    } finally {
      setApprovingId(null);
    }
  };

  const handleReject = async (requestId: number) => {
    if (!onReject) return;

    setRejectingId(requestId);
    try {
      await onReject(requestId);
    } finally {
      setRejectingId(null);
    }
  };

  const formatDate = (dateStr: string) => {
    try {
      return new Date(dateStr).toLocaleDateString('ja-JP', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
      });
    } catch {
      return dateStr;
    }
  };

  if (loading) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle>Pending Yukyu Requests</CardTitle>
          <CardDescription>Requests awaiting approval</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {[...Array(3)].map((_, i) => (
              <Skeleton key={i} className="h-12 w-full rounded" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (requests.length === 0) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle>Pending Yukyu Requests</CardTitle>
          <CardDescription>Requests awaiting approval</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <p className="text-muted-foreground">No pending requests</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle>Pending Yukyu Requests</CardTitle>
        <CardDescription>
          {requests.length} request{requests.length !== 1 ? 's' : ''} awaiting approval
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="border rounded-lg overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Employee</TableHead>
                <TableHead className="text-center">Days</TableHead>
                <TableHead>Period</TableHead>
                <TableHead className="text-center">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {requests.map((request) => (
                <TableRow key={request.id}>
                  <TableCell>
                    <div className="space-y-1">
                      <div className="font-medium">{request.employeeName}</div>
                      {request.factoryName && (
                        <div className="text-xs text-muted-foreground">
                          {request.factoryName}
                        </div>
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="text-center font-semibold">
                    {request.daysRequested}
                  </TableCell>
                  <TableCell>
                    <div className="space-y-1">
                      <div className="text-sm">
                        {formatDate(request.startDate)} → {formatDate(request.endDate)}
                      </div>
                      {request.reason && (
                        <div className="text-xs text-muted-foreground line-clamp-2">
                          {request.reason}
                        </div>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center justify-center gap-2">
                      <Button
                        size="sm"
                        variant="ghost"
                        className={cn(
                          'gap-1 text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50',
                          approvingId === request.id && 'opacity-50 cursor-not-allowed'
                        )}
                        onClick={() => handleApprove(request.id)}
                        disabled={approvingId === request.id}
                        title="Approve"
                      >
                        <CheckCircle2 className="h-4 w-4" />
                        {approvingId === request.id ? 'Approving...' : 'Approve'}
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        className={cn(
                          'gap-1 text-red-600 hover:text-red-700 hover:bg-red-50',
                          rejectingId === request.id && 'opacity-50 cursor-not-allowed'
                        )}
                        onClick={() => handleReject(request.id)}
                        disabled={rejectingId === request.id}
                        title="Reject"
                      >
                        <XCircle className="h-4 w-4" />
                        {rejectingId === request.id ? 'Rejecting...' : 'Reject'}
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}
