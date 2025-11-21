'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import Link from 'next/link';
import {
  DocumentTextIcon,
  MagnifyingGlassIcon,
  UserIcon,
  CalendarDaysIcon,
  ClockIcon,
  ArrowTopRightOnSquareIcon
} from '@heroicons/react/24/outline';
import { requestService } from '@/lib/api';
import { RequestTypeBadge, RequestStatusBadge } from '@/components/requests/RequestTypeBadge';
import { RequestType, RequestStatus, PaginatedResponse, Request } from '@/types/api';

export default function RequestsPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 20;

  const { data, isLoading } = useQuery<PaginatedResponse<Request>>({
    queryKey: ['requests', searchTerm, statusFilter, typeFilter, currentPage],
    queryFn: async (): Promise<PaginatedResponse<Request>> => {
      const params: any = {
        page: currentPage,
        page_size: pageSize,
      };
      if (searchTerm) params.search = searchTerm;
      if (statusFilter !== 'all') params.status = statusFilter;
      if (typeFilter !== 'all') params.request_type = typeFilter;
      return requestService.getRequests(params);
    },
  });

  // Helper to check if request is NYUUSHA type
  const isNyuushaRequest = (type: RequestType) => type === RequestType.NYUUSHA;

  // Helper to calculate total days
  const calculateTotalDays = (startDate: string, endDate?: string): number => {
    if (!endDate) return 1;
    const start = new Date(startDate);
    const end = new Date(endDate);
    return Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1;
  };

  const requests: Request[] = Array.isArray(data?.items) ? data.items : [];
  const total: number = typeof data?.total === 'number' ? data.total : 0;
  const totalPages: number = typeof data?.total_pages === 'number' ? data.total_pages : 0;

  // Count by status
  const pendingCount = requests.filter((r: Request) => r.status === 'pending').length;
  const approvedCount = requests.filter((r: Request) => r.status === 'approved').length;
  const rejectedCount = requests.filter((r: Request) => r.status === 'rejected').length;

  // Request Card Component
  const RequestCard = ({ request }: { request: Request }) => {
    const isNyuusha = isNyuushaRequest(request.type);

    const cardContent = (
      <div className="bg-card rounded-xl shadow-sm border hover:shadow-md transition-shadow relative">
        {isNyuusha && (
          <div className="absolute top-4 right-4">
            <ArrowTopRightOnSquareIcon className="h-5 w-5 text-muted-foreground" />
          </div>
        )}
        <div className="p-6">
          {/* Header */}
          <div className="flex items-start justify-between mb-4">
            <div className="flex items-center gap-3">
              <UserIcon className="h-8 w-8 text-muted-foreground" />
              <div>
                <h3 className="font-semibold text-foreground text-lg">
                  {request.employee_id ? `従業員ID: ${request.employee_id}` : `候補者ID: ${request.candidate_id}`}
                </h3>
                <p className="text-sm text-muted-foreground">
                  申請日: {new Date(request.created_at).toLocaleDateString('ja-JP')}
                </p>
                {isNyuusha && request.candidate_id && (
                  <p className="text-xs text-orange-600 font-medium mt-1">
                    📋 候補者 #{request.candidate_id} の入社手続き
                  </p>
                )}
              </div>
            </div>
            <div className="flex flex-col items-end gap-2">
              <RequestStatusBadge status={request.status as RequestStatus} />
              <RequestTypeBadge type={request.type as RequestType} />
            </div>
          </div>

          {/* Request Details */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
            <div className="flex items-center gap-2">
              <CalendarDaysIcon className="h-5 w-5 text-muted-foreground" />
              <div>
                <p className="text-xs text-muted-foreground">開始日</p>
                <p className="text-sm font-medium text-foreground">
                  {new Date(request.start_date).toLocaleDateString('ja-JP')}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <CalendarDaysIcon className="h-5 w-5 text-muted-foreground" />
              <div>
                <p className="text-xs text-muted-foreground">終了日</p>
                <p className="text-sm font-medium text-foreground">
                  {request.end_date ? new Date(request.end_date).toLocaleDateString('ja-JP') : '指定なし'}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <ClockIcon className="h-5 w-5 text-muted-foreground" />
              <div>
                <p className="text-xs text-muted-foreground">日数</p>
                <p className="text-sm font-medium text-foreground">{calculateTotalDays(request.start_date, request.end_date)}日</p>
              </div>
            </div>
          </div>

          {/* Reason */}
          {request.reason && (
            <div className="mb-4">
              <p className="text-xs text-muted-foreground mb-1">理由</p>
              <p className="text-sm text-foreground bg-muted p-3 rounded-lg">{request.reason}</p>
            </div>
          )}

          {/* Approval Info */}
          {request.status !== 'pending' && request.approved_at && (
            <div className="pt-4 border-t border-border">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">
                  審査日: {new Date(request.approved_at).toLocaleDateString('ja-JP')}
                </span>
              </div>
            </div>
          )}

          {/* View Details Button for NYUUSHA */}
          {isNyuusha && (
            <div className="pt-4 border-t border-border">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">
                  入社連絡票の詳細を確認・編集
                </span>
                <span className="text-sm font-medium text-primary flex items-center gap-1">
                  詳細を見る <ArrowTopRightOnSquareIcon className="h-4 w-4" />
                </span>
              </div>
            </div>
          )}
        </div>
      </div>
    );

    return isNyuusha ? (
      <Link key={request.id} href={`/requests/${request.id}`}>
        {cardContent}
      </Link>
    ) : (
      <div key={request.id}>{cardContent}</div>
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-muted/20 p-4 sm:p-8">
      <div className="max-w-7xl mx-auto">

        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-extrabold text-foreground">申請管理</h1>
          <p className="text-muted-foreground mt-1">従業員からの各種申請の管理・承認</p>
        </div>

        {/* Search and Filters */}
        <div className="bg-card rounded-xl shadow-sm border p-6 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="relative">
              <MagnifyingGlassIcon className="h-5 w-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground" />
              <input
                type="text"
                placeholder="従業員名、IDで検索..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-input rounded-lg focus:ring-2 focus:ring-primary bg-background"
              />
            </div>

            <div>
              <select
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value)}
                className="w-full px-3 py-2 border border-input rounded-lg focus:ring-2 focus:ring-primary bg-background"
              >
                <option value="all">全種類</option>
                <option value="yukyu">有給休暇</option>
                <option value="hankyu">半休</option>
                <option value="ikkikokoku">一時帰国</option>
                <option value="taisha">退社</option>
                <option value="nyuusha">入社連絡票</option>
              </select>
            </div>

            <div>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full px-3 py-2 border border-input rounded-lg focus:ring-2 focus:ring-primary bg-background"
              >
                <option value="all">全ステータス</option>
                <option value="pending">審査中</option>
                <option value="approved">承認済み</option>
                <option value="rejected">却下</option>
                <option value="completed">済</option>
              </select>
            </div>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-3 gap-4 mb-6">
          <div className="bg-card rounded-xl shadow-sm border p-4">
            <p className="text-sm text-muted-foreground mb-1">審査中</p>
            <p className="text-3xl font-bold text-yellow-600">{pendingCount}</p>
          </div>
          <div className="bg-card rounded-xl shadow-sm border p-4">
            <p className="text-sm text-muted-foreground mb-1">承認済み</p>
            <p className="text-3xl font-bold text-green-600">{approvedCount}</p>
          </div>
          <div className="bg-card rounded-xl shadow-sm border p-4">
            <p className="text-sm text-muted-foreground mb-1">却下</p>
            <p className="text-3xl font-bold text-red-600">{rejectedCount}</p>
          </div>
        </div>

        {/* Results */}
        <div className="mb-4">
          <p className="text-muted-foreground">
            {total > 0 ? `${total}件中 ${(currentPage - 1) * pageSize + 1}-${Math.min(currentPage * pageSize, total)}件を表示` : '申請が見つかりませんでした'}
          </p>
        </div>

        {/* Requests List */}
        {isLoading ? (
          <div className="space-y-4">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="bg-card rounded-xl shadow-sm border p-6 animate-pulse">
                <div className="flex justify-between mb-4">
                  <div className="h-6 bg-muted rounded w-1/3"></div>
                  <div className="h-6 bg-muted rounded w-20"></div>
                </div>
                <div className="space-y-2">
                  <div className="h-4 bg-muted rounded"></div>
                  <div className="h-4 bg-muted rounded w-5/6"></div>
                </div>
              </div>
            ))}
          </div>
        ) : requests.length === 0 ? (
          <div className="bg-card rounded-xl shadow-sm border p-12 text-center">
            <DocumentTextIcon className="h-16 w-16 text-muted-foreground/50 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-foreground mb-2">申請がありません</h3>
            <p className="text-muted-foreground">検索条件を変更してください</p>
          </div>
        ) : (
          <div className="space-y-4">
            {requests.map((request: Request) => (
              <RequestCard key={request.id} request={request} />
            ))}
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="mt-6 flex justify-center">
            <nav className="flex items-center gap-2">
              <button
                onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                disabled={currentPage === 1}
                className="px-4 py-2 text-sm font-medium text-muted-foreground bg-card border border-input rounded-md hover:bg-accent hover:text-accent-foreground disabled:opacity-50"
              >
                前へ
              </button>

              {[...Array(Math.min(5, totalPages))].map((_, i) => {
                const page = Math.max(1, Math.min(totalPages, currentPage - 2 + i));
                return (
                  <button
                    key={page}
                    onClick={() => setCurrentPage(page)}
                    className={`px-4 py-2 text-sm font-medium rounded-md ${
                      page === currentPage
                        ? 'text-primary bg-primary/10 border border-primary/30'
                        : 'text-muted-foreground bg-card border border-input hover:bg-accent hover:text-accent-foreground'
                    }`}
                  >
                    {page}
                  </button>
                );
              })}

              <button
                onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                disabled={currentPage === totalPages}
                className="px-4 py-2 text-sm font-medium text-muted-foreground bg-card border border-input rounded-md hover:bg-accent hover:text-accent-foreground disabled:opacity-50"
              >
                次へ
              </button>
            </nav>
          </div>
        )}
      </div>
    </div>
  );
}
