'use client';

import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  CheckCircle,
  XCircle,
  Clock,
  User,
  Building2,
  Calendar,
  FileText,
  Filter,
  AlertCircle,
  FileDown,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import api from '@/lib/api';
import { useAuthStore } from '@/stores/auth-store';
import { canApproveYukyu } from '@/lib/yukyu-roles';
import { ErrorState } from '@/components/error-state';

interface YukyuRequest {
  id: number;
  employee_id: number;
  employee_name: string;
  factory_id: string;
  factory_name: string;
  request_type: string;
  start_date: string;
  end_date: string;
  days_requested: number;
  yukyu_available_at_request: number;
  request_date: string;
  status: string;
  requested_by_name: string;
  approved_by_name: string | null;
  approval_date: string | null;
  rejection_reason: string | null;
  notes: string | null;
}

export default function YukyuRequestsPage() {
  const queryClient = useQueryClient();
  const { user } = useAuthStore();

  // Role validation: Only KEITOSAN (Finance Manager) and ADMIN can access this page
  // 有給休暇申請の承認・却下は経理管理者のみ
  if (!canApproveYukyu(user?.role)) {
    return (
      <ErrorState
        type="forbidden"
        title="アクセス拒否 (Access Denied)"
        message="有給休暇申請の承認・却下は経理管理者以上のユーザーのみが利用できます。"
        showRetry={false}
        showGoBack={true}
      />
    );
  }

  // Filters
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [factoryFilter, setFactoryFilter] = useState<string>('');

  // Dialog state
  const [selectedRequest, setSelectedRequest] = useState<YukyuRequest | null>(null);
  const [approveDialogOpen, setApproveDialogOpen] = useState(false);
  const [rejectDialogOpen, setRejectDialogOpen] = useState(false);
  const [approvalNotes, setApprovalNotes] = useState('');
  const [rejectionReason, setRejectionReason] = useState('');

  // Fetch requests
  const { data: requests, isLoading } = useQuery<YukyuRequest[]>({
    queryKey: ['yukyu-requests', statusFilter, factoryFilter],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (statusFilter && statusFilter !== 'all') params.append('status', statusFilter);
      if (factoryFilter) params.append('factory_id', factoryFilter);

      const res = await api.get(`/yukyu/requests/?${params}`);
      return res.data;
    },
    refetchInterval: 30000, // Refresh every 30 seconds
  });

  // Approve mutation
  const approveMutation = useMutation({
    mutationFn: async ({ id, notes }: { id: number; notes: string }) => {
      const res = await api.put(`/yukyu/requests/${id}/approve`, { notes });
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['yukyu-requests'] });
      setApproveDialogOpen(false);
      setSelectedRequest(null);
      setApprovalNotes('');
    }
  });

  // Reject mutation
  const rejectMutation = useMutation({
    mutationFn: async ({ id, reason }: { id: number; reason: string }) => {
      const res = await api.put(`/yukyu/requests/${id}/reject`, { rejection_reason: reason });
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['yukyu-requests'] });
      setRejectDialogOpen(false);
      setSelectedRequest(null);
      setRejectionReason('');
    }
  });

  // Open approve dialog
  const handleApprove = (request: YukyuRequest) => {
    setSelectedRequest(request);
    setApproveDialogOpen(true);
  };

  // Open reject dialog
  const handleReject = (request: YukyuRequest) => {
    setSelectedRequest(request);
    setRejectDialogOpen(true);
  };

  // Download PDF for request
  const handleDownloadPDF = async (requestId: number) => {
    try {
      const token = localStorage.getItem('access_token');
      const res = await fetch(`/api/yukyu/requests/${requestId}/pdf`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!res.ok) throw new Error('Failed to download PDF');

      // Get the blob and download
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `yukyu_request_${requestId}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      toast.success('PDFをダウンロードしました');
    } catch (error) {
      console.error('PDF download error:', error);
      toast.error('PDFのダウンロードに失敗しました');
    }
  };

  // Confirm approve
  const confirmApprove = () => {
    if (selectedRequest) {
      approveMutation.mutate({ id: selectedRequest.id, notes: approvalNotes });
    }
  };

  // Confirm reject
  const confirmReject = () => {
    if (selectedRequest && rejectionReason.trim()) {
      rejectMutation.mutate({ id: selectedRequest.id, reason: rejectionReason });
    }
  };

  // Get status badge
  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-300">
          <Clock className="mr-1 h-3 w-3" /> 承認待ち
        </Badge>;
      case 'approved':
        return <Badge variant="outline" className="bg-green-50 text-green-700 border-green-300">
          <CheckCircle className="mr-1 h-3 w-3" /> 承認済み
        </Badge>;
      case 'rejected':
        return <Badge variant="outline" className="bg-red-50 text-red-700 border-red-300">
          <XCircle className="mr-1 h-3 w-3" /> 却下
        </Badge>;
      default:
        return <Badge>{status}</Badge>;
    }
  };

  // Get request type label
  const getRequestTypeLabel = (type: string) => {
    switch (type) {
      case 'yukyu': return '有給休暇';
      case 'hankyu': return '半休';
      case 'ikkikokoku': return '一時帰国';
      case 'taisha': return '退社';
      default: return type;
    }
  };

  // Count by status
  const pendingCount = requests?.filter(r => r.status === 'pending').length || 0;
  const approvedCount = requests?.filter(r => r.status === 'approved').length || 0;
  const rejectedCount = requests?.filter(r => r.status === 'rejected').length || 0;

  return (
    <div className="container mx-auto p-6">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
          有給休暇申請管理
        </h1>
        <p className="text-gray-600 dark:text-gray-400">
          有給休暇申請の承認・却下（経理用）
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">承認待ち</p>
                <p className="text-3xl font-bold text-yellow-600">{pendingCount}</p>
              </div>
              <Clock className="h-12 w-12 text-yellow-600 opacity-20" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">承認済み</p>
                <p className="text-3xl font-bold text-green-600">{approvedCount}</p>
              </div>
              <CheckCircle className="h-12 w-12 text-green-600 opacity-20" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">却下</p>
                <p className="text-3xl font-bold text-red-600">{rejectedCount}</p>
              </div>
              <XCircle className="h-12 w-12 text-red-600 opacity-20" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            フィルター
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label>状態</Label>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">全て</SelectItem>
                  <SelectItem value="pending">承認待ち</SelectItem>
                  <SelectItem value="approved">承認済み</SelectItem>
                  <SelectItem value="rejected">却下</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Requests List */}
      {isLoading ? (
        <Card>
          <CardContent className="p-12 text-center text-gray-500">
            読み込み中...
          </CardContent>
        </Card>
      ) : requests && requests.length === 0 ? (
        <Card>
          <CardContent className="p-12 text-center text-gray-500">
            申請がありません
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {requests?.map((request) => (
            <Card key={request.id} className="hover:shadow-lg transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-start justify-between">
                  <div className="flex-1 space-y-3">
                    {/* Header */}
                    <div className="flex items-center gap-3">
                      {getStatusBadge(request.status)}
                      <Badge variant="secondary">{getRequestTypeLabel(request.request_type)}</Badge>
                      <span className="text-sm text-gray-500">
                        申請日: {new Date(request.request_date).toLocaleDateString('ja-JP')}
                      </span>
                    </div>

                    {/* Employee Info */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div className="flex items-center gap-2">
                        <User className="h-4 w-4 text-gray-400" />
                        <div>
                          <p className="text-xs text-gray-500">従業員</p>
                          <p className="font-semibold">{request.employee_name}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Building2 className="h-4 w-4 text-gray-400" />
                        <div>
                          <p className="text-xs text-gray-500">派遣先</p>
                          <p className="font-medium">{request.factory_name}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4 text-gray-400" />
                        <div>
                          <p className="text-xs text-gray-500">期間</p>
                          <p className="font-medium">
                            {request.start_date} 〜 {request.end_date}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <FileText className="h-4 w-4 text-gray-400" />
                        <div>
                          <p className="text-xs text-gray-500">申請日数</p>
                          <p className="font-bold text-blue-600">
                            {request.days_requested} 日
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Additional Info */}
                    <div className="flex items-center gap-4 text-sm text-gray-600">
                      <span>申請時残: {request.yukyu_available_at_request} 日</span>
                      <span>申請者: {request.requested_by_name}</span>
                      {request.approved_by_name && (
                        <span>承認者: {request.approved_by_name}</span>
                      )}
                    </div>

                    {/* Notes */}
                    {request.notes && (
                      <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded text-sm">
                        <p className="text-gray-600 dark:text-gray-400">備考:</p>
                        <p>{request.notes}</p>
                      </div>
                    )}

                    {/* Rejection Reason */}
                    {request.rejection_reason && (
                      <Alert variant="destructive">
                        <AlertCircle className="h-4 w-4" />
                        <AlertDescription>
                          <strong>却下理由:</strong> {request.rejection_reason}
                        </AlertDescription>
                      </Alert>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="flex flex-col gap-2 ml-4">
                    {request.status === 'pending' && (
                      <>
                        <Button
                          size="sm"
                          onClick={() => handleApprove(request)}
                          className="bg-green-600 hover:bg-green-700"
                        >
                          <CheckCircle className="mr-1 h-4 w-4" />
                          承認
                        </Button>
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => handleReject(request)}
                        >
                          <XCircle className="mr-1 h-4 w-4" />
                          却下
                        </Button>
                      </>
                    )}
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleDownloadPDF(request.id)}
                    >
                      <FileDown className="mr-1 h-4 w-4" />
                      PDF
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Approve Dialog */}
      <Dialog open={approveDialogOpen} onOpenChange={setApproveDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>申請を承認</DialogTitle>
            <DialogDescription>
              {selectedRequest?.employee_name} の有給休暇申請を承認しますか？
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <p className="text-sm"><strong>期間:</strong> {selectedRequest?.start_date} 〜 {selectedRequest?.end_date}</p>
              <p className="text-sm"><strong>申請日数:</strong> {selectedRequest?.days_requested} 日</p>
              <p className="text-sm"><strong>申請時残:</strong> {selectedRequest?.yukyu_available_at_request} 日</p>
            </div>
            <div>
              <Label>備考（任意）</Label>
              <Textarea
                value={approvalNotes}
                onChange={(e) => setApprovalNotes(e.target.value)}
                placeholder="承認メモ..."
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setApproveDialogOpen(false)}>
              キャンセル
            </Button>
            <Button
              onClick={confirmApprove}
              disabled={approveMutation.isPending}
              className="bg-green-600 hover:bg-green-700"
            >
              {approveMutation.isPending ? '処理中...' : '承認する'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Reject Dialog */}
      <Dialog open={rejectDialogOpen} onOpenChange={setRejectDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>申請を却下</DialogTitle>
            <DialogDescription>
              {selectedRequest?.employee_name} の有給休暇申請を却下しますか？
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <Label>却下理由 *</Label>
              <Textarea
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                placeholder="却下理由を入力してください..."
                rows={3}
                required
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRejectDialogOpen(false)}>
              キャンセル
            </Button>
            <Button
              variant="destructive"
              onClick={confirmReject}
              disabled={rejectMutation.isPending || !rejectionReason.trim()}
            >
              {rejectMutation.isPending ? '処理中...' : '却下する'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
