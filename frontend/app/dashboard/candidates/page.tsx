'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { useAuthStore } from '@/stores/auth-store';
import {
  UserPlusIcon,
  MagnifyingGlassIcon,
  PencilIcon,
  EyeIcon,
  PrinterIcon,
  PlusIcon,
  HandThumbUpIcon,
  HandThumbDownIcon
} from '@heroicons/react/24/outline';
import { candidateService } from '@/lib/api';
import { SkeletonListItem } from '@/components/ui/skeleton';
import { EmptyState } from '@/components/empty-state';
import { ErrorState } from '@/components/error-state';
import { useDelayedLoading, getErrorType } from '@/lib/loading-utils';
import { CandidateStatus, type Candidate, type PaginatedResponse } from '@/types/api';

type CandidatesResponse = PaginatedResponse<Candidate>;

export default function CandidatesPage() {
  const router = useRouter();
  const { isAuthenticated, isHydrated } = useAuthStore();
  const [mounted, setMounted] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [sortOrder, setSortOrder] = useState('newest');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(12);

  useEffect(() => {
    setMounted(true);
  }, []);

  const { data, isLoading, error, refetch } = useQuery<CandidatesResponse>({
    queryKey: ['candidates', currentPage, statusFilter, searchTerm, sortOrder, pageSize],
    enabled: isAuthenticated && isHydrated && mounted,
    queryFn: async () => {
      const params: {
        page: number;
        page_size: number;
        status_filter?: string;
        search?: string;
        sort?: string;
      } = {
        page: currentPage,
        page_size: pageSize,
      };

      if (statusFilter !== 'all') {
        params.status_filter = statusFilter;
      }

      if (searchTerm) {
        params.search = searchTerm;
      }

      if (sortOrder) {
        // Mapear sortOrder al parámetro correcto
        if (sortOrder === 'newest') {
          params.sort = 'id_desc'; // Ordenar por ID numérico descendente (más nuevo primero)
        } else if (sortOrder === 'oldest') {
          params.sort = 'id_asc'; // Ordenar por ID numérico ascendente (más antiguo primero)
        } else {
          params.sort = sortOrder;
        }
      }

      return await candidateService.getCandidates(params);
    },
    retry: 1,
  });

  // Smart delayed loading to prevent flashing
  const showLoading = useDelayedLoading(isLoading || !isHydrated || !mounted, 200);

  const candidates = data?.items || [];
  const total = data?.total || 0;
  const totalPages = Math.ceil(total / pageSize);

  // Show loading while auth is hydrating
  if (!mounted || !isHydrated) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background to-muted/20 p-4 sm:p-8">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {[...Array(12)].map((_, i) => (
              <div key={i} className="bg-card rounded-xl shadow-sm border">
                <SkeletonListItem
                  variant="shimmer"
                  withAvatar={true}
                  className="p-6"
                />
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // Redirect if not authenticated after hydration
  if (isHydrated && !isAuthenticated) {
    router.push('/login');
    return null;
  }

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setCurrentPage(1);
    refetch();
  };

  const handleApprove = async (candidateId: number) => {
    if (!confirm('この候補者を承認しますか？')) return;

    try {
      await candidateService.updateCandidate(candidateId.toString(), { status: CandidateStatus.APPROVED });
      refetch(); // Reload the list
    } catch (error) {
      console.error('Error approving candidate:', error);
      alert('承認に失敗しました');
    }
  };

  const handleReject = async (candidateId: number) => {
    if (!confirm('この候補者を却下しますか？')) return;

    try {
      await candidateService.updateCandidate(candidateId.toString(), { status: CandidateStatus.REJECTED });
      refetch(); // Reload the list
    } catch (error) {
      console.error('Error rejecting candidate:', error);
      alert('却下に失敗しました');
    }
  };

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      pending: {
        bg: 'bg-pending',
        text: 'text-pending-foreground',
        label: '審査中'
      },
      approved: {
        bg: 'bg-success',
        text: 'text-success-foreground',
        label: '承認済み'
      },
      rejected: {
        bg: 'bg-destructive',
        text: 'text-destructive-foreground',
        label: '却下'
      },
      hired: {
        bg: 'bg-info',
        text: 'text-info-foreground',
        label: '採用済み'
      }
    };

    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.pending;
    return (
      <span className={`px-2.5 py-1.5 text-xs font-medium rounded-md ${config.bg} ${config.text}`}>
        {config.label}
      </span>
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-muted/20 p-4 sm:p-8">
      <div className="max-w-7xl mx-auto">

        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-extrabold text-foreground">候補者一覧</h1>
            <p className="text-muted-foreground mt-1">登録済み候補者の管理・編集</p>
          </div>

          <div className="flex gap-3">
            <button
              onClick={() => router.push('/candidates/new')}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 transition-colors"
            >
              <PlusIcon className="h-5 w-5 mr-2" />
              新規候補者登録
            </button>
          </div>
        </div>

        {/* Search and Filters */}
        <div className="bg-card rounded-xl shadow-sm border p-6 mb-6">
          <form onSubmit={handleSearch} className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <MagnifyingGlassIcon className="h-5 w-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground" />
                <input
                  type="text"
                  placeholder="名前、ID、電話番号で検索..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-input rounded-lg focus:ring-2 focus:ring-primary focus:border-primary bg-background"
                />
              </div>
            </div>

            <div className="sm:w-40">
              <select
                value={sortOrder}
                onChange={(e) => setSortOrder(e.target.value)}
                className="w-full px-3 py-2 border border-input rounded-lg focus:ring-2 focus:ring-primary focus:border-primary bg-background"
                title="並び順"
              >
                <option value="newest">新しい順</option>
                <option value="oldest">古い順</option>
              </select>
            </div>

            <div className="sm:w-48">
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full px-3 py-2 border border-input rounded-lg focus:ring-2 focus:ring-primary focus:border-primary bg-background"
                title="ステータスフィルター"
              >
                <option value="all">全ステータス</option>
                <option value="pending">審査中</option>
                <option value="approved">承認済み</option>
                <option value="rejected">却下</option>
                <option value="hired">採用済み</option>
              </select>
            </div>

            <div className="sm:w-32">
              <select
                value={pageSize}
                onChange={(e) => {
                  setPageSize(Number(e.target.value));
                  setCurrentPage(1); // Reset to page 1 when changing page size
                }}
                className="w-full px-3 py-2 border border-input rounded-lg focus:ring-2 focus:ring-primary focus:border-primary bg-background"
                title="表示件数"
              >
                <option value="12">12件</option>
                <option value="16">16件</option>
                <option value="24">24件</option>
                <option value="32">32件</option>
                <option value="40">40件</option>
              </select>
            </div>

            <button
              type="submit"
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
            >
              検索
            </button>
          </form>
        </div>

        {/* Results Count */}
        <div className="mb-4">
          <p className="text-muted-foreground">
            {total > 0 ? `${total}件中 ${(currentPage - 1) * pageSize + 1}-${Math.min(currentPage * pageSize, total)}件を表示` : '候補者が見つかりませんでした'}
          </p>
        </div>

        {/* Error State */}
        {error && !showLoading && (
          <ErrorState
            type={getErrorType(error)}
            title="Failed to Load Candidates"
            message="Unable to fetch candidate data. Please try again."
            details={error}
            onRetry={refetch}
            showRetry={true}
            showGoBack={false}
          />
        )}

        {/* Loading State - Using staggered skeleton items */}
        {showLoading && !error && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {[...Array(pageSize)].map((_, i) => (
              <div key={i} className="bg-card rounded-xl shadow-sm border">
                <SkeletonListItem
                  variant="shimmer"
                  withAvatar={true}
                  className="p-6"
                />
              </div>
            ))}
          </div>
        )}

        {/* Empty State */}
        {!showLoading && !error && candidates.length === 0 && (
          <EmptyState
            variant="no-results"
            icon={<UserPlusIcon className="w-12 h-12 text-blue-500" />}
            title="候補者がいません"
            description="検索条件を変更するか、新しい候補者を登録してください"
            action={{
              label: '新規候補者登録',
              onClick: () => router.push('/candidates/new'),
              icon: PlusIcon,
              variant: 'default',
            }}
          />
        )}

        {/* Candidates Grid */}
        {!showLoading && !error && candidates.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {candidates.map((candidate) => (
              <div key={candidate.id} className="bg-card rounded-xl shadow-sm border hover:shadow-md transition-shadow">
                <div className="p-6">
                  {/* Candidate Header */}
                  <div className="flex items-start gap-4 mb-4">
                    <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center overflow-hidden flex-shrink-0">
                      {candidate.photo_data_url && candidate.photo_data_url.trim() !== '' ? (
                        <img
                          src={candidate.photo_data_url}
                          alt="候補者写真"
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            // Hide broken image and show fallback
                            e.currentTarget.style.display = 'none';
                            const parent = e.currentTarget.parentElement;
                            if (parent) {
                              const icon = document.createElement('div');
                              icon.innerHTML = '<svg class="h-8 w-8 text-gray-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M19 7.5v3m0 0v3m0-3h3m-3 0h-3m-2.25-4.125a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zM4 19.235v-.11a6.375 6.375 0 0112.75 0v.109A12.318 12.318 0 0110.374 21c-2.331 0-4.512-.645-6.374-1.766z" /></svg>';
                              parent.appendChild(icon.firstChild!);
                            }
                          }}
                        />
                      ) : (
                        <UserPlusIcon className="h-8 w-8 text-muted-foreground" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-foreground truncate">
                        {candidate.full_name_kanji || candidate.full_name_roman || '名前未設定'}
                      </h3>
                      <p className="text-sm text-muted-foreground truncate">
                        {candidate.full_name_kana}
                      </p>
                      <p className="text-xs text-primary font-medium">
                        ID: {candidate.id} ({candidate.rirekisho_id})
                      </p>
                    </div>
                  </div>

                  {/* Candidate Info */}
                  <div className="space-y-2 mb-4">
                    {candidate.age && (
                      <p className="text-sm text-muted-foreground">
                        年齢: {candidate.age}歳
                      </p>
                    )}
                    {candidate.nationality && (
                      <p className="text-sm text-muted-foreground">
                        国籍: {candidate.nationality}
                      </p>
                    )}
                    {candidate.phone && (
                      <p className="text-sm text-muted-foreground truncate">
                        TEL: {candidate.phone}
                      </p>
                    )}
                  </div>

                  {/* Status */}
                  <div className="mb-4">
                    <div className="flex items-center gap-2">
                      {getStatusBadge(candidate.status || 'pending')}

                      {/* Quick approval buttons for pending status */}
                      {(candidate.status === 'pending' || !candidate.status) && (
                        <div className="flex gap-1 ml-auto">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleApprove(candidate.id);
                            }}
                            className="p-1.5 rounded-md bg-green-50 dark:bg-green-900/20 hover:bg-green-100 dark:hover:bg-green-900/30 text-green-600 dark:text-green-400 transition-colors"
                            title="承認"
                          >
                            <HandThumbUpIcon className="h-4 w-4" />
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleReject(candidate.id);
                            }}
                            className="p-1.5 rounded-md bg-red-50 dark:bg-red-900/20 hover:bg-red-100 dark:hover:bg-red-900/30 text-red-600 dark:text-red-400 transition-colors"
                            title="却下"
                          >
                            <HandThumbDownIcon className="h-4 w-4" />
                          </button>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex gap-2">
                    <button
                      onClick={() => router.push(`/candidates/${candidate.id}`)}
                      className="flex-1 inline-flex items-center justify-center px-3 py-2 border border-input text-sm font-medium rounded-md text-foreground bg-card hover:bg-accent transition-colors"
                      title="詳細表示"
                    >
                      <EyeIcon className="h-4 w-4 mr-1" />
                      詳細
                    </button>
                    <button
                      onClick={() => router.push(`/candidates/${candidate.id}/edit`)}
                      className="flex-1 inline-flex items-center justify-center px-3 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 transition-colors"
                      title="編集"
                    >
                      <PencilIcon className="h-4 w-4 mr-1" />
                      編集
                    </button>
                    <button
                      onClick={() => router.push(`/candidates/${candidate.id}/print`)}
                      className="px-3 py-2 border border-input text-sm font-medium rounded-md text-foreground bg-card hover:bg-accent transition-colors"
                      title="印刷"
                    >
                      <PrinterIcon className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="mt-8 flex justify-center">
            <nav className="flex items-center gap-2">
              <button
                onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                disabled={currentPage === 1}
                className="px-4 py-2 text-sm font-medium text-muted-foreground bg-card border border-input rounded-md hover:bg-accent disabled:opacity-50 disabled:cursor-not-allowed"
              >
                前へ
              </button>

              {(() => {
                // Calculate visible page range (up to 5 pages)
                const maxVisible = 5;
                let startPage = Math.max(1, currentPage - Math.floor(maxVisible / 2));
                let endPage = Math.min(totalPages, startPage + maxVisible - 1);

                // Adjust if we're near the end
                if (endPage - startPage + 1 < maxVisible) {
                  startPage = Math.max(1, endPage - maxVisible + 1);
                }

                // Generate unique sequential pages
                const pages = Array.from(
                  { length: endPage - startPage + 1 },
                  (_, i) => startPage + i
                );

                return pages.map((page) => (
                  <button
                    key={`page-${page}`}
                    onClick={() => setCurrentPage(page)}
                    className={`px-4 py-2 text-sm font-medium rounded-md ${
                      page === currentPage
                        ? 'text-primary bg-primary/10 border border-primary/30'
                        : 'text-muted-foreground bg-card border border-input hover:bg-accent'
                    }`}
                  >
                    {page}
                  </button>
                ));
              })()}

              <button
                onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                disabled={currentPage === totalPages}
                className="px-4 py-2 text-sm font-medium text-muted-foreground bg-card border border-input rounded-md hover:bg-accent disabled:opacity-50 disabled:cursor-not-allowed"
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
