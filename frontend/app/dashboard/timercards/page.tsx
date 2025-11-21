'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import Link from 'next/link';
import {
  ClockIcon,
  MagnifyingGlassIcon,
  CalendarIcon,
  UserIcon,
  SunIcon,
  MoonIcon,
  CloudIcon,
  DocumentArrowUpIcon
} from '@heroicons/react/24/outline';
import { timerCardService } from '@/lib/api';
import { PageGuard } from '@/components/page-guard';
import { PageVisibilityToggle } from '@/components/page-visibility-toggle';
import { Button } from '@/components/ui/button';

interface TimerCard {
  id: number;
  employee_id: number;
  employee_name?: string;
  factory_id?: string;
  work_date: string;
  clock_in?: string;
  clock_out?: string;
  break_minutes: number;
  regular_hours: number;
  overtime_hours: number;
  night_hours: number;
  holiday_hours: number;
  shift_type?: string;
  notes?: string;
  is_approved: boolean;
}

interface TimerCardsResponse {
  items: TimerCard[];
  total: number;
}

export default function TimerCardsPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 50;

  const { data, isLoading } = useQuery<TimerCardsResponse>({
    queryKey: ['timercards', searchTerm, selectedDate, currentPage],
    queryFn: async (): Promise<TimerCardsResponse> => {
      const params: any = {
        page: currentPage,
        page_size: pageSize,
      };
      if (searchTerm) params.search = searchTerm;
      if (selectedDate) params.work_date = selectedDate;
      const response = await timerCardService.getTimerCards<TimerCard[]>(params);
      return {
        items: response,
        total: response.length,
      };
    },
  });

  const getShiftIcon = (shift?: string) => {
    switch (shift) {
      case 'asa': return <SunIcon className="h-5 w-5 text-yellow-500" title="朝番" />;
      case 'hiru': return <CloudIcon className="h-5 w-5 text-blue-500" title="昼番" />;
      case 'yoru': return <MoonIcon className="h-5 w-5 text-indigo-600" title="夜番" />;
      default: return <ClockIcon className="h-5 w-5 text-gray-400" />;
    }
  };

  const getShiftLabel = (shift?: string) => {
    switch (shift) {
      case 'asa': return '朝番';
      case 'hiru': return '昼番';
      case 'yoru': return '夜番';
      default: return '通常';
    }
  };

  const timercards = data?.items || [];
  const total = data?.total || 0;
  const totalPages = Math.ceil(total / pageSize);

  // Calculate totals
  const totalRegular = timercards.reduce((sum: number, tc: TimerCard) => sum + Number(tc.regular_hours || 0), 0);
  const totalOvertime = timercards.reduce((sum: number, tc: TimerCard) => sum + Number(tc.overtime_hours || 0), 0);
  const totalNight = timercards.reduce((sum: number, tc: TimerCard) => sum + Number(tc.night_hours || 0), 0);
  const totalHoliday = timercards.reduce((sum: number, tc: TimerCard) => sum + Number(tc.holiday_hours || 0), 0);

  const content = (
    <div className="min-h-screen bg-gradient-to-br from-background to-muted/20 p-4 sm:p-8">
      <div className="max-w-7xl mx-auto">

        {/* Header with Visibility Toggle */}
        <div className="mb-8 space-y-4">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-extrabold text-foreground">タイムカード管理</h1>
              <p className="text-muted-foreground mt-1">従業員の勤怠管理</p>
            </div>
            <Link href="/timercards/upload">
              <Button className="flex items-center gap-2">
                <DocumentArrowUpIcon className="h-5 w-5" />
                PDFでOCR取り込み
              </Button>
            </Link>
          </div>
          <PageVisibilityToggle
            pageKey="timer-cards"
            pageName="タイムカード（タイムカード管理）"
          />
        </div>

        {/* Search and Filters */}
        <div className="bg-card rounded-xl shadow-sm border p-6 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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

            <div className="relative">
              <CalendarIcon className="h-5 w-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground" />
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-input rounded-lg focus:ring-2 focus:ring-primary bg-background"
                title="日付選択"
              />
            </div>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-card rounded-xl shadow-sm border p-4">
            <p className="text-sm text-muted-foreground mb-1">通常時間</p>
            <p className="text-2xl font-bold text-foreground">{totalRegular.toFixed(1)}h</p>
          </div>
          <div className="bg-card rounded-xl shadow-sm border p-4">
            <p className="text-sm text-muted-foreground mb-1">残業時間</p>
            <p className="text-2xl font-bold text-orange-600">{totalOvertime.toFixed(1)}h</p>
          </div>
          <div className="bg-card rounded-xl shadow-sm border p-4">
            <p className="text-sm text-muted-foreground mb-1">深夜時間</p>
            <p className="text-2xl font-bold text-indigo-600">{totalNight.toFixed(1)}h</p>
          </div>
          <div className="bg-card rounded-xl shadow-sm border p-4">
            <p className="text-sm text-muted-foreground mb-1">休日時間</p>
            <p className="text-2xl font-bold text-green-600">{totalHoliday.toFixed(1)}h</p>
          </div>
        </div>

        {/* Results */}
        <div className="mb-4">
          <p className="text-muted-foreground">
            {total > 0 ? `${total}件中 ${(currentPage - 1) * pageSize + 1}-${Math.min(currentPage * pageSize, total)}件を表示` : 'タイムカードが見つかりませんでした'}
          </p>
        </div>

        {/* TimerCards Table */}
        {isLoading ? (
          <div className="bg-card rounded-xl shadow-sm border p-8">
            <div className="animate-pulse space-y-4">
              {[...Array(10)].map((_, i) => (
                <div key={i} className="h-16 bg-muted rounded"></div>
              ))}
            </div>
          </div>
        ) : timercards.length === 0 ? (
          <div className="bg-card rounded-xl shadow-sm border p-12 text-center">
            <ClockIcon className="h-16 w-16 text-muted-foreground/50 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-foreground mb-2">タイムカードがありません</h3>
            <p className="text-muted-foreground">選択した日付のタイムカードが見つかりませんでした</p>
          </div>
        ) : (
          <div className="bg-card rounded-xl shadow-sm border overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-border">
                <thead className="bg-muted/50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">従業員</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">日付</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">シフト</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">出勤</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">退勤</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">通常</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">残業</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">深夜</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">休日</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">状態</th>
                  </tr>
                </thead>
                <tbody className="bg-card divide-y divide-border">
                  {timercards.map((tc: TimerCard) => (
                    <tr key={tc.id} className="hover:bg-accent/50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <UserIcon className="h-5 w-5 text-muted-foreground mr-2" />
                          <div>
                            <div className="text-sm font-medium text-foreground">{tc.employee_name || `ID: ${tc.employee_id}`}</div>
                            {tc.factory_id && <div className="text-xs text-muted-foreground">{tc.factory_id}</div>}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-foreground">
                        {new Date(tc.work_date).toLocaleDateString('ja-JP')}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          {getShiftIcon(tc.shift_type)}
                          <span className="text-sm text-foreground">{getShiftLabel(tc.shift_type)}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-foreground">{tc.clock_in || '-'}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-foreground">{tc.clock_out || '-'}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-foreground">{tc.regular_hours}h</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-orange-600 font-medium">{tc.overtime_hours}h</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-indigo-600 font-medium">{tc.night_hours}h</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-green-600 font-medium">{tc.holiday_hours}h</td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 py-1 text-xs rounded-full ${
                          tc.is_approved
                            ? 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-400'
                            : 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-400'
                        }`}>
                          {tc.is_approved ? '承認済み' : '未承認'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="mt-6 flex justify-center">
            <nav className="flex items-center gap-2">
              <button
                onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                disabled={currentPage === 1}
                className="px-4 py-2 text-sm font-medium text-muted-foreground bg-card border border-input rounded-md hover:bg-accent disabled:opacity-50"
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
                        : 'text-muted-foreground bg-card border border-input hover:bg-accent'
                    }`}
                  >
                    {page}
                  </button>
                );
              })}

              <button
                onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                disabled={currentPage === totalPages}
                className="px-4 py-2 text-sm font-medium text-muted-foreground bg-card border border-input rounded-md hover:bg-accent disabled:opacity-50"
              >
                次へ
              </button>
            </nav>
          </div>
        )}
      </div>
    </div>
  );

  return (
    <PageGuard pageKey="timer-cards">
      {content}
    </PageGuard>
  );
}
