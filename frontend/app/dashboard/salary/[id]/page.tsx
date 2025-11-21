'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  ArrowLeftIcon,
  DocumentArrowDownIcon,
  CheckCircleIcon,
  PencilIcon,
  TrashIcon,
  ClockIcon,
  CalendarIcon,
} from '@heroicons/react/24/outline';
import { salaryService } from '@/lib/api';
import { SalaryCalculation } from '@/types/api';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { SalarySummaryCards } from '@/components/salary/SalarySummaryCards';
import { SalaryBreakdownTable } from '@/components/salary/SalaryBreakdownTable';
import { SalaryDeductionsTable } from '@/components/salary/SalaryDeductionsTable';
import { SalaryCharts } from '@/components/salary/SalaryCharts';
import { useToast } from '@/hooks/use-toast';

export default function SalaryDetailPage() {
  const params = useParams();
  const router = useRouter();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const salaryId = params.id as string;

  // Fetch salary data
  const { data: salary, isLoading, error } = useQuery<SalaryCalculation>({
    queryKey: ['salary', salaryId],
    queryFn: () => salaryService.getSalary(salaryId),
    enabled: !!salaryId,
  });

  // Mark as paid mutation
  const markPaidMutation = useMutation({
    mutationFn: () => salaryService.markSalaryPaid(salaryId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['salary', salaryId] });
      toast({
        title: '成功',
        description: '給与を支払済みにマークしました',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'エラー',
        description: error.message || '支払い状態の更新に失敗しました',
        variant: 'destructive',
      });
    },
  });

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: () => salaryService.deleteSalary(salaryId),
    onSuccess: () => {
      toast({
        title: '成功',
        description: '給与計算を削除しました',
      });
      router.push('/salary');
    },
    onError: (error: any) => {
      toast({
        title: 'エラー',
        description: error.message || '削除に失敗しました',
        variant: 'destructive',
      });
    },
  });

  // Generate payslip mutation
  const generatePayslipMutation = useMutation({
    mutationFn: () => salaryService.generatePayslip(salaryId),
    onSuccess: (blob) => {
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `payslip-${salaryId}-${Date.now()}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

      toast({
        title: '成功',
        description: '給与明細をダウンロードしました',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'エラー',
        description: error.message || '給与明細の生成に失敗しました',
        variant: 'destructive',
      });
    },
  });

  const handleMarkPaid = () => {
    if (window.confirm('この給与を支払済みにマークしますか？')) {
      markPaidMutation.mutate();
    }
  };

  const handleDelete = () => {
    if (window.confirm('この給与計算を削除しますか？この操作は取り消せません。')) {
      deleteMutation.mutate();
    }
  };

  const handleDownloadPayslip = () => {
    generatePayslipMutation.mutate();
  };

  const formatCurrency = (amount: number) => {
    return `¥${amount.toLocaleString('ja-JP')}`;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('ja-JP', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background to-muted/20 p-4 sm:p-8">
        <div className="max-w-7xl mx-auto">
          <div className="animate-pulse space-y-6">
            <div className="h-8 bg-muted rounded w-1/3"></div>
            <div className="h-64 bg-muted rounded"></div>
            <div className="grid grid-cols-2 gap-4">
              <div className="h-32 bg-muted rounded"></div>
              <div className="h-32 bg-muted rounded"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error || !salary) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background to-muted/20 p-4 sm:p-8">
        <div className="max-w-7xl mx-auto">
          <div className="bg-card rounded-xl border p-12 text-center">
            <h3 className="text-lg font-semibold text-foreground mb-2">給与データが見つかりません</h3>
            <p className="text-muted-foreground mb-4">指定された給与計算が見つかりませんでした</p>
            <Button onClick={() => router.push('/salary')} variant="outline">
              <ArrowLeftIcon className="h-4 w-4 mr-2" />
              給与一覧に戻る
            </Button>
          </div>
        </div>
      </div>
    );
  }

  const period = `${salary.year}年${salary.month}月`;

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-muted/20 p-4 sm:p-8">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <Button
              onClick={() => router.push('/salary')}
              variant="ghost"
              size="sm"
              className="mb-2"
            >
              <ArrowLeftIcon className="h-4 w-4 mr-2" />
              給与一覧に戻る
            </Button>
            <h1 className="text-3xl font-extrabold text-foreground">
              {salary.employee_name || `従業員ID: ${salary.employee_id}`}
            </h1>
            <div className="flex items-center gap-3 mt-2">
              <div className="flex items-center gap-2 text-muted-foreground">
                <CalendarIcon className="h-4 w-4" />
                <span>{period}</span>
              </div>
              <Badge variant={salary.is_paid ? 'default' : 'secondary'}>
                {salary.is_paid ? '支払済み' : '未払い'}
              </Badge>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-wrap gap-2">
            <Button
              onClick={handleDownloadPayslip}
              variant="outline"
              disabled={generatePayslipMutation.isPending}
            >
              <DocumentArrowDownIcon className="h-4 w-4 mr-2" />
              {generatePayslipMutation.isPending ? 'ダウンロード中...' : 'PDF ダウンロード'}
            </Button>

            {!salary.is_paid && (
              <>
                <Button
                  onClick={handleMarkPaid}
                  variant="default"
                  disabled={markPaidMutation.isPending}
                >
                  <CheckCircleIcon className="h-4 w-4 mr-2" />
                  {markPaidMutation.isPending ? '更新中...' : '支払済みにする'}
                </Button>
                <Button onClick={() => router.push(`/salary/${salaryId}/edit`)} variant="outline">
                  <PencilIcon className="h-4 w-4 mr-2" />
                  編集
                </Button>
                <Button
                  onClick={handleDelete}
                  variant="destructive"
                  disabled={deleteMutation.isPending}
                >
                  <TrashIcon className="h-4 w-4 mr-2" />
                  {deleteMutation.isPending ? '削除中...' : '削除'}
                </Button>
              </>
            )}
          </div>
        </div>

        {/* Summary Cards */}
        <SalarySummaryCards
          grossSalary={salary.gross_salary}
          totalDeductions={salary.total_deductions}
          netSalary={salary.net_salary}
          companyProfit={salary.company_profit}
        />

        {/* Tabs */}
        <Tabs defaultValue="breakdown" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="breakdown">内訳 (Breakdown)</TabsTrigger>
            <TabsTrigger value="deductions">控除 (Deductions)</TabsTrigger>
            <TabsTrigger value="audit">監査 (Audit)</TabsTrigger>
          </TabsList>

          {/* Tab 1: Breakdown */}
          <TabsContent value="breakdown" className="mt-6">
            <div className="bg-card rounded-xl border shadow-sm p-6 space-y-6">
              <SalaryBreakdownTable salary={salary} />
              <div className="border-t pt-6">
                <SalaryCharts salary={salary} />
              </div>
            </div>
          </TabsContent>

          {/* Tab 2: Deductions */}
          <TabsContent value="deductions" className="mt-6">
            <div className="bg-card rounded-xl border shadow-sm p-6">
              <SalaryDeductionsTable salary={salary} />
            </div>
          </TabsContent>

          {/* Tab 3: Audit */}
          <TabsContent value="audit" className="mt-6">
            <div className="bg-card rounded-xl border shadow-sm p-6">
              <h3 className="text-lg font-semibold mb-6">監査情報 (Audit Information)</h3>

              <div className="space-y-6">
                {/* Creation Info */}
                <div>
                  <h4 className="text-sm font-medium text-muted-foreground mb-3">作成情報</h4>
                  <div className="bg-muted/50 rounded-lg p-4 space-y-2">
                    <div className="flex items-center gap-2">
                      <ClockIcon className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm font-medium">作成日時:</span>
                      <span className="text-sm">{formatDate(salary.created_at)}</span>
                    </div>
                  </div>
                </div>

                {/* Update Info */}
                <div>
                  <h4 className="text-sm font-medium text-muted-foreground mb-3">更新情報</h4>
                  <div className="bg-muted/50 rounded-lg p-4 space-y-2">
                    <div className="flex items-center gap-2">
                      <ClockIcon className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm font-medium">最終更新日時:</span>
                      <span className="text-sm">{formatDate(salary.updated_at)}</span>
                    </div>
                  </div>
                </div>

                {/* Payment Info */}
                {salary.is_paid && salary.paid_at && (
                  <div>
                    <h4 className="text-sm font-medium text-muted-foreground mb-3">支払情報</h4>
                    <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4 space-y-2">
                      <div className="flex items-center gap-2">
                        <CheckCircleIcon className="h-5 w-5 text-green-600 dark:text-green-400" />
                        <span className="text-sm font-medium">支払日時:</span>
                        <span className="text-sm font-semibold">{formatDate(salary.paid_at)}</span>
                      </div>
                      <p className="text-sm text-muted-foreground ml-7">
                        この給与は支払済みです。編集や削除はできません。
                      </p>
                    </div>
                  </div>
                )}

                {/* Summary Stats */}
                <div>
                  <h4 className="text-sm font-medium text-muted-foreground mb-3">統計情報</h4>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="bg-muted/50 rounded-lg p-4">
                      <p className="text-xs text-muted-foreground mb-1">給与ID</p>
                      <p className="text-lg font-bold">#{salary.id}</p>
                    </div>
                    <div className="bg-muted/50 rounded-lg p-4">
                      <p className="text-xs text-muted-foreground mb-1">従業員ID</p>
                      <p className="text-lg font-bold">{salary.employee_id}</p>
                    </div>
                    <div className="bg-muted/50 rounded-lg p-4">
                      <p className="text-xs text-muted-foreground mb-1">対象期間</p>
                      <p className="text-lg font-bold">{period}</p>
                    </div>
                    <div className="bg-muted/50 rounded-lg p-4">
                      <p className="text-xs text-muted-foreground mb-1">状態</p>
                      <Badge variant={salary.is_paid ? 'default' : 'secondary'} className="mt-1">
                        {salary.is_paid ? '支払済み' : '未払い'}
                      </Badge>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
