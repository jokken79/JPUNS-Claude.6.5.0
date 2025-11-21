'use client';

import { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import {
  DocumentArrowDownIcon,
  DocumentTextIcon,
  EnvelopeIcon,
  ChartBarIcon,
  UserGroupIcon,
  CalendarDaysIcon,
  BuildingOfficeIcon,
  BanknotesIcon,
} from '@heroicons/react/24/outline';
import { salaryService } from '@/lib/api';
import { SalaryReportFilters } from '@/types/api';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { SalaryReportFiltersComponent } from '@/components/salary/SalaryReportFilters';
import { useToast } from '@/hooks/use-toast';
import { useRouter } from 'next/navigation';

export default function SalaryReportsPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [filters, setFilters] = useState<SalaryReportFilters>({});
  const [activeTab, setActiveTab] = useState('summary');

  // Fetch report data
  const { data: reportData, isLoading, refetch } = useQuery({
    queryKey: ['salary-report', filters],
    queryFn: () => salaryService.getSalaryReport(filters),
    enabled: Object.keys(filters).length > 0,
  });

  // Export Excel mutation
  const exportExcelMutation = useMutation({
    mutationFn: () => salaryService.exportSalaryExcel(filters),
    onSuccess: (blob) => {
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `salary-report-${Date.now()}.xlsx`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

      toast({
        title: '成功',
        description: 'Excelファイルをダウンロードしました',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'エラー',
        description: error.message || 'エクスポートに失敗しました',
        variant: 'destructive',
      });
    },
  });

  // Export PDF mutation
  const exportPdfMutation = useMutation({
    mutationFn: () => salaryService.exportSalaryPdf(filters),
    onSuccess: (blob) => {
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `salary-report-${Date.now()}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

      toast({
        title: '成功',
        description: 'PDFファイルをダウンロードしました',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'エラー',
        description: error.message || 'エクスポートに失敗しました',
        variant: 'destructive',
      });
    },
  });

  const handleApplyFilters = (newFilters: SalaryReportFilters) => {
    setFilters(newFilters);
    refetch();
  };

  const handleClearFilters = () => {
    setFilters({});
  };

  const handleExportExcel = () => {
    if (Object.keys(filters).length === 0) {
      toast({
        title: '警告',
        description: 'フィルターを設定してからエクスポートしてください',
        variant: 'destructive',
      });
      return;
    }
    exportExcelMutation.mutate();
  };

  const handleExportPdf = () => {
    if (Object.keys(filters).length === 0) {
      toast({
        title: '警告',
        description: 'フィルターを設定してからエクスポートしてください',
        variant: 'destructive',
      });
      return;
    }
    exportPdfMutation.mutate();
  };

  const formatCurrency = (amount: number) => {
    return `¥${amount.toLocaleString('ja-JP')}`;
  };

  const formatPercentage = (value: number) => {
    return `${value.toFixed(1)}%`;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-muted/20 p-4 sm:p-8">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-extrabold text-foreground">給与レポート</h1>
          <p className="text-muted-foreground mt-1">Salary Reports - 給与データの分析と輸出</p>
        </div>

        {/* Filters */}
        <SalaryReportFiltersComponent
          onApplyFilters={handleApplyFilters}
          onClearFilters={handleClearFilters}
          loading={isLoading}
        />

        {/* Export Section */}
        {reportData && (
          <div className="bg-card rounded-xl border shadow-sm p-6">
            <h3 className="text-lg font-semibold mb-4">エクスポート (Export)</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Button
                onClick={handleExportExcel}
                variant="outline"
                className="h-24 flex-col gap-2"
                disabled={exportExcelMutation.isPending}
              >
                <DocumentTextIcon className="h-8 w-8 text-green-600" />
                <span className="font-semibold">
                  {exportExcelMutation.isPending ? 'エクスポート中...' : 'Excel エクスポート'}
                </span>
                <span className="text-xs text-muted-foreground">複数シート、グラフ付き</span>
              </Button>

              <Button
                onClick={handleExportPdf}
                variant="outline"
                className="h-24 flex-col gap-2"
                disabled={exportPdfMutation.isPending}
              >
                <DocumentArrowDownIcon className="h-8 w-8 text-red-600" />
                <span className="font-semibold">
                  {exportPdfMutation.isPending ? 'エクスポート中...' : 'PDF エクスポート'}
                </span>
                <span className="text-xs text-muted-foreground">プロフェッショナルレポート</span>
              </Button>

              <Button
                onClick={() => {
                  toast({
                    title: '準備中',
                    description: 'メール送信機能は近日公開予定です',
                  });
                }}
                variant="outline"
                className="h-24 flex-col gap-2"
              >
                <EnvelopeIcon className="h-8 w-8 text-blue-600" />
                <span className="font-semibold">メール送信</span>
                <span className="text-xs text-muted-foreground">近日公開予定</span>
              </Button>
            </div>
          </div>
        )}

        {/* Report Content */}
        {isLoading ? (
          <div className="bg-card rounded-xl border shadow-sm p-8">
            <div className="animate-pulse space-y-4">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="h-20 bg-muted rounded"></div>
              ))}
            </div>
          </div>
        ) : !reportData ? (
          <div className="bg-card rounded-xl border shadow-sm p-12 text-center">
            <ChartBarIcon className="h-16 w-16 text-muted-foreground/50 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-foreground mb-2">レポートを生成してください</h3>
            <p className="text-muted-foreground">
              フィルターを設定して「レポート生成」ボタンをクリックしてください
            </p>
          </div>
        ) : (
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-5">
              <TabsTrigger value="summary">概要</TabsTrigger>
              <TabsTrigger value="by-employee">従業員別</TabsTrigger>
              <TabsTrigger value="by-period">期間別</TabsTrigger>
              <TabsTrigger value="by-factory">工場別</TabsTrigger>
              <TabsTrigger value="tax-analysis">税務分析</TabsTrigger>
            </TabsList>

            {/* Tab 1: Executive Summary */}
            <TabsContent value="summary" className="mt-6">
              <div className="space-y-6">
                {/* KPI Cards */}
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  <div className="bg-card rounded-lg border shadow-sm p-6">
                    <div className="flex items-center gap-3 mb-2">
                      <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                        <UserGroupIcon className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                      </div>
                      <p className="text-sm text-muted-foreground font-medium">処理済み従業員数</p>
                    </div>
                    <p className="text-3xl font-bold">
                      {reportData.total_employees || 0}
                      <span className="text-sm font-normal text-muted-foreground ml-2">名</span>
                    </p>
                  </div>

                  <div className="bg-card rounded-lg border shadow-sm p-6">
                    <div className="flex items-center gap-3 mb-2">
                      <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-lg">
                        <BanknotesIcon className="h-6 w-6 text-green-600 dark:text-green-400" />
                      </div>
                      <p className="text-sm text-muted-foreground font-medium">総支給額</p>
                    </div>
                    <p className="text-3xl font-bold text-green-600 dark:text-green-400">
                      {formatCurrency(reportData.total_gross_salary || 0)}
                    </p>
                  </div>

                  <div className="bg-card rounded-lg border shadow-sm p-6">
                    <div className="flex items-center gap-3 mb-2">
                      <div className="p-2 bg-red-100 dark:bg-red-900/30 rounded-lg">
                        <ChartBarIcon className="h-6 w-6 text-red-600 dark:text-red-400" />
                      </div>
                      <p className="text-sm text-muted-foreground font-medium">総控除額</p>
                    </div>
                    <p className="text-3xl font-bold text-red-600 dark:text-red-400">
                      {formatCurrency(reportData.total_deductions || 0)}
                    </p>
                  </div>

                  <div className="bg-card rounded-lg border shadow-sm p-6">
                    <div className="flex items-center gap-3 mb-2">
                      <div className="p-2 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
                        <BanknotesIcon className="h-6 w-6 text-purple-600 dark:text-purple-400" />
                      </div>
                      <p className="text-sm text-muted-foreground font-medium">手取り総額</p>
                    </div>
                    <p className="text-3xl font-bold text-purple-600 dark:text-purple-400">
                      {formatCurrency(reportData.total_net_salary || 0)}
                    </p>
                  </div>

                  <div className="bg-card rounded-lg border shadow-sm p-6">
                    <div className="flex items-center gap-3 mb-2">
                      <div className="p-2 bg-orange-100 dark:bg-orange-900/30 rounded-lg">
                        <UserGroupIcon className="h-6 w-6 text-orange-600 dark:text-orange-400" />
                      </div>
                      <p className="text-sm text-muted-foreground font-medium">平均給与</p>
                    </div>
                    <p className="text-3xl font-bold text-orange-600 dark:text-orange-400">
                      {formatCurrency(reportData.average_salary || 0)}
                    </p>
                  </div>

                  <div className="bg-card rounded-lg border shadow-sm p-6">
                    <div className="flex items-center gap-3 mb-2">
                      <div className="p-2 bg-teal-100 dark:bg-teal-900/30 rounded-lg">
                        <ChartBarIcon className="h-6 w-6 text-teal-600 dark:text-teal-400" />
                      </div>
                      <p className="text-sm text-muted-foreground font-medium">支払率</p>
                    </div>
                    <p className="text-3xl font-bold text-teal-600 dark:text-teal-400">
                      {formatPercentage(reportData.payment_rate || 0)}
                    </p>
                  </div>
                </div>

                {/* Summary Stats */}
                <div className="bg-card rounded-xl border shadow-sm p-6">
                  <h3 className="text-lg font-semibold mb-4">統計サマリー</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <h4 className="text-sm font-medium text-muted-foreground mb-3">支払構成</h4>
                      <div className="space-y-2">
                        <div className="flex justify-between items-center">
                          <span className="text-sm">総支給額</span>
                          <span className="font-semibold">{formatCurrency(reportData.total_gross_salary || 0)}</span>
                        </div>
                        <div className="flex justify-between items-center text-red-600 dark:text-red-400">
                          <span className="text-sm">総控除額</span>
                          <span className="font-semibold">
                            -{formatCurrency(reportData.total_deductions || 0)}
                          </span>
                        </div>
                        <div className="border-t pt-2 flex justify-between items-center text-lg font-bold text-green-600 dark:text-green-400">
                          <span>手取り総額</span>
                          <span>{formatCurrency(reportData.total_net_salary || 0)}</span>
                        </div>
                      </div>
                    </div>

                    <div>
                      <h4 className="text-sm font-medium text-muted-foreground mb-3">平均値</h4>
                      <div className="space-y-2">
                        <div className="flex justify-between items-center">
                          <span className="text-sm">平均給与</span>
                          <span className="font-semibold">{formatCurrency(reportData.average_salary || 0)}</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-sm">控除率</span>
                          <span className="font-semibold">
                            {reportData.total_gross_salary > 0
                              ? formatPercentage(
                                  (reportData.total_deductions / reportData.total_gross_salary) * 100
                                )
                              : '0.0%'}
                          </span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-sm">支払率</span>
                          <span className="font-semibold">{formatPercentage(reportData.payment_rate || 0)}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </TabsContent>

            {/* Tab 2: By Employee */}
            <TabsContent value="by-employee" className="mt-6">
              <div className="bg-card rounded-xl border shadow-sm overflow-hidden">
                <div className="p-6 border-b">
                  <h3 className="text-lg font-semibold">従業員別給与 (Salaries by Employee)</h3>
                  <p className="text-sm text-muted-foreground mt-1">
                    {reportData.by_employee?.length || 0}件の給与計算
                  </p>
                </div>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>従業員名</TableHead>
                      <TableHead>期間</TableHead>
                      <TableHead className="text-right">総支給額</TableHead>
                      <TableHead className="text-right">控除額</TableHead>
                      <TableHead className="text-right">手取り額</TableHead>
                      <TableHead className="text-center">状態</TableHead>
                      <TableHead className="text-center">操作</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {reportData.by_employee?.map((salary: any) => (
                      <TableRow key={salary.id}>
                        <TableCell className="font-medium">
                          {salary.employee_name || `従業員ID: ${salary.employee_id}`}
                        </TableCell>
                        <TableCell>
                          {salary.year}年{salary.month}月
                        </TableCell>
                        <TableCell className="text-right">{formatCurrency(salary.gross_salary)}</TableCell>
                        <TableCell className="text-right text-red-600">
                          {formatCurrency(salary.total_deductions)}
                        </TableCell>
                        <TableCell className="text-right font-semibold text-green-600">
                          {formatCurrency(salary.net_salary)}
                        </TableCell>
                        <TableCell className="text-center">
                          <Badge variant={salary.is_paid ? 'default' : 'secondary'}>
                            {salary.is_paid ? '支払済み' : '未払い'}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-center">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => router.push(`/salary/${salary.id}`)}
                          >
                            詳細
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </TabsContent>

            {/* Tab 3: By Period */}
            <TabsContent value="by-period" className="mt-6">
              <div className="bg-card rounded-xl border shadow-sm overflow-hidden">
                <div className="p-6 border-b">
                  <h3 className="text-lg font-semibold">期間別統計 (Statistics by Period)</h3>
                  <p className="text-sm text-muted-foreground mt-1">
                    {reportData.by_period?.length || 0}期間のデータ
                  </p>
                </div>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>期間</TableHead>
                      <TableHead className="text-center">従業員数</TableHead>
                      <TableHead className="text-right">総支給額</TableHead>
                      <TableHead className="text-right">控除額</TableHead>
                      <TableHead className="text-right">手取り額</TableHead>
                      <TableHead className="text-center">支払済み</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {reportData.by_period?.map((period: any, index: number) => (
                      <TableRow key={index}>
                        <TableCell className="font-medium">
                          <div className="flex items-center gap-2">
                            <CalendarDaysIcon className="h-4 w-4 text-muted-foreground" />
                            {period.period}
                          </div>
                        </TableCell>
                        <TableCell className="text-center">{period.total_employees}名</TableCell>
                        <TableCell className="text-right">{formatCurrency(period.gross_salary)}</TableCell>
                        <TableCell className="text-right text-red-600">
                          {formatCurrency(period.deductions)}
                        </TableCell>
                        <TableCell className="text-right font-semibold text-green-600">
                          {formatCurrency(period.net_salary)}
                        </TableCell>
                        <TableCell className="text-center">
                          {period.paid_count}/{period.total_employees}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </TabsContent>

            {/* Tab 4: By Factory */}
            <TabsContent value="by-factory" className="mt-6">
              <div className="bg-card rounded-xl border shadow-sm overflow-hidden">
                <div className="p-6 border-b">
                  <h3 className="text-lg font-semibold">工場別統計 (Statistics by Factory)</h3>
                  <p className="text-sm text-muted-foreground mt-1">
                    {reportData.by_factory?.length || 0}工場のデータ
                  </p>
                </div>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>工場名</TableHead>
                      <TableHead className="text-center">従業員数</TableHead>
                      <TableHead className="text-right">総支給額</TableHead>
                      <TableHead className="text-right">控除額</TableHead>
                      <TableHead className="text-right">手取り額</TableHead>
                      <TableHead className="text-right">会社利益</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {reportData.by_factory?.map((factory: any) => (
                      <TableRow key={factory.factory_id}>
                        <TableCell className="font-medium">
                          <div className="flex items-center gap-2">
                            <BuildingOfficeIcon className="h-4 w-4 text-muted-foreground" />
                            {factory.factory_name}
                          </div>
                        </TableCell>
                        <TableCell className="text-center">{factory.employee_count}名</TableCell>
                        <TableCell className="text-right">{formatCurrency(factory.gross_salary)}</TableCell>
                        <TableCell className="text-right text-red-600">
                          {formatCurrency(factory.deductions)}
                        </TableCell>
                        <TableCell className="text-right font-semibold text-green-600">
                          {formatCurrency(factory.net_salary)}
                        </TableCell>
                        <TableCell className="text-right font-semibold text-purple-600">
                          {formatCurrency(factory.company_profit)}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </TabsContent>

            {/* Tab 5: Tax Analysis */}
            <TabsContent value="tax-analysis" className="mt-6">
              <div className="bg-card rounded-xl border shadow-sm overflow-hidden">
                <div className="p-6 border-b">
                  <h3 className="text-lg font-semibold">税務分析 (Tax Analysis)</h3>
                  <p className="text-sm text-muted-foreground mt-1">控除内訳と税務統計</p>
                </div>
                <div className="p-6">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>控除種別</TableHead>
                        <TableHead className="text-right">金額</TableHead>
                        <TableHead className="text-right">総支給比率</TableHead>
                        <TableHead className="text-right">総控除比率</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {reportData.tax_analysis?.map((tax: any, index: number) => (
                        <TableRow key={index}>
                          <TableCell className="font-medium">{tax.type}</TableCell>
                          <TableCell className="text-right">{formatCurrency(tax.amount)}</TableCell>
                          <TableCell className="text-right">
                            {reportData.total_gross_salary > 0
                              ? formatPercentage((tax.amount / reportData.total_gross_salary) * 100)
                              : '0.0%'}
                          </TableCell>
                          <TableCell className="text-right">
                            {formatPercentage(tax.percentage)}
                          </TableCell>
                        </TableRow>
                      ))}
                      <TableRow className="bg-muted/50 font-bold">
                        <TableCell>合計</TableCell>
                        <TableCell className="text-right">{formatCurrency(reportData.total_deductions)}</TableCell>
                        <TableCell className="text-right">
                          {reportData.total_gross_salary > 0
                            ? formatPercentage(
                                (reportData.total_deductions / reportData.total_gross_salary) * 100
                              )
                            : '0.0%'}
                        </TableCell>
                        <TableCell className="text-right">100.0%</TableCell>
                      </TableRow>
                    </TableBody>
                  </Table>
                </div>
              </div>
            </TabsContent>
          </Tabs>
        )}
      </div>
    </div>
  );
}
