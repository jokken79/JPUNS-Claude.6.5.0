'use client';

import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  Calendar,
  Users,
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Clock,
  BarChart3,
  PieChart,
  FileDown,
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import api from '@/lib/api';
import { useAuthStore } from '@/stores/auth-store';
import { canViewYukyuReports } from '@/lib/yukyu-roles';
import { ErrorState } from '@/components/error-state';

interface YukyuSummary {
  employee_id: number;
  employee_name: string;
  total_available: number;
  total_used: number;
  total_expired: number;
  oldest_expiration_date: string | null;
  needs_to_use_minimum_5_days: boolean;
}

interface YukyuStats {
  total_employees: number;
  total_available_days: number;
  total_used_days: number;
  total_expired_days: number;
  employees_need_to_use_5_days: number;
  upcoming_expirations: Array<{
    employee_name: string;
    days_expiring: number;
    expiration_date: string;
  }>;
}

export default function YukyuReportsPage() {
  const [isExporting, setIsExporting] = useState(false);
  const { user } = useAuthStore();

  // Role validation: Only Finance Manager and Admin can view detailed reports
  // 詳細レポートの閲覧は経理管理者以上のユーザーのみ
  if (!canViewYukyuReports(user?.role)) {
    return (
      <ErrorState
        type="forbidden"
        title="アクセス拒否 (Access Denied)"
        message="有給休暇レポートの閲覧は経理管理者以上のユーザーのみが利用できます。"
        showRetry={false}
        showGoBack={true}
      />
    );
  }

  // Fetch all employee summaries
  const { data: employees } = useQuery<any[]>({
    queryKey: ['employees'],
    queryFn: async () => {
      const res = await api.get('/employees');
      return res.data.items || [];
    }
  });

  // Fetch yukyu requests
  const { data: requests = [] } = useQuery<any[]>({
    queryKey: ['yukyu-requests'],
    queryFn: async () => {
      try {
        const res = await api.get('/requests?type=yukyu');
        return res.data.items || [];
      } catch {
        return [];
      }
    }
  });

  // Fetch yukyu balances
  const { data: balances = [] } = useQuery<any[]>({
    queryKey: ['yukyu-balances'],
    queryFn: async () => {
      try {
        const res = await api.get('/yukyu/balances');
        return res.data;
      } catch {
        return [];
      }
    }
  });

  // Export to Excel function
  const handleExportToExcel = async () => {
    setIsExporting(true);
    try {
      const token = localStorage.getItem('access_token');
      const res = await fetch('/api/yukyu/reports/export-excel', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!res.ok) throw new Error('Failed to export');

      // Get the blob and download
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `yukyu_report_${new Date().toISOString().split('T')[0]}.xlsx`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      toast.success('レポートをエクスポートしました');
    } catch (error) {
      console.error('Export error:', error);
      toast.error('エクスポートに失敗しました');
    } finally {
      setIsExporting(false);
    }
  };

  // Calculate statistics
  const stats = React.useMemo(() => {
    if (!employees || !Array.isArray(employees)) return null;

    const totalEmployees = employees.length;
    const totalAvailable = employees.reduce((sum, e) => sum + (e.yukyu_remaining || 0), 0);

    // Calculate totalUsed from requests data
    const totalUsed = requests.reduce((sum, req) => {
      return sum + (req.days_used || req.days_requested || 0);
    }, 0);

    // Calculate totalExpired from balances data
    const totalExpired = balances.reduce((sum, bal) => {
      return sum + (bal.expired_days || 0);
    }, 0);

    return {
      totalEmployees,
      totalAvailable,
      totalUsed,
      totalExpired,
      averageAvailable: totalEmployees > 0 ? (totalAvailable / totalEmployees).toFixed(1) : '0.0',
      utilizationRate: totalAvailable > 0 ? ((totalUsed / (totalUsed + totalAvailable)) * 100).toFixed(1) : '0.0',
    };
  }, [employees, requests, balances]);

  // Group employees by yukyu range
  const yukyuDistribution = React.useMemo(() => {
    if (!employees || !Array.isArray(employees)) return [];

    const ranges = [
      { label: '0日', min: 0, max: 0, count: 0, color: 'bg-red-500' },
      { label: '1-5日', min: 1, max: 5, count: 0, color: 'bg-yellow-500' },
      { label: '6-10日', min: 6, max: 10, count: 0, color: 'bg-blue-500' },
      { label: '11-15日', min: 11, max: 15, count: 0, color: 'bg-green-500' },
      { label: '16日以上', min: 16, max: 999, count: 0, color: 'bg-purple-500' },
    ];

    employees.forEach(e => {
      const yukyu = e.yukyu_remaining || 0;
      const range = ranges.find(r => yukyu >= r.min && yukyu <= r.max);
      if (range) range.count++;
    });

    return ranges;
  }, [employees]);

  // Employees needing attention
  const alerts = React.useMemo(() => {
    if (!employees || !Array.isArray(employees)) return {
      noYukyu: [],
      lowYukyu: [],
      highYukyu: [],
    };

    return {
      noYukyu: employees.filter(e => (e.yukyu_remaining || 0) === 0),
      lowYukyu: employees.filter(e => {
        const yukyu = e.yukyu_remaining || 0;
        return yukyu > 0 && yukyu <= 3;
      }),
      highYukyu: employees.filter(e => (e.yukyu_remaining || 0) >= 15),
    };
  }, [employees]);

  return (
    <div className="container mx-auto p-6">
      {/* Header */}
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            有給休暇レポート
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            有給休暇の使用状況と統計
          </p>
        </div>
        <Button
          onClick={handleExportToExcel}
          disabled={isExporting}
          className="gap-2"
        >
          <FileDown className="h-4 w-4" />
          {isExporting ? 'エクスポート中...' : 'Excelエクスポート'}
        </Button>
      </div>

      {/* Main Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">総従業員数</p>
                <p className="text-3xl font-bold">{stats?.totalEmployees || 0}</p>
              </div>
              <Users className="h-12 w-12 text-blue-600 opacity-20" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">総利用可能日数</p>
                <p className="text-3xl font-bold text-green-600">{stats?.totalAvailable || 0}</p>
              </div>
              <Calendar className="h-12 w-12 text-green-600 opacity-20" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">平均保有日数</p>
                <p className="text-3xl font-bold text-blue-600">{stats?.averageAvailable || 0}</p>
              </div>
              <BarChart3 className="h-12 w-12 text-blue-600 opacity-20" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">使用率</p>
                <p className="text-3xl font-bold text-purple-600">{stats?.utilizationRate || 0}%</p>
              </div>
              <TrendingUp className="h-12 w-12 text-purple-600 opacity-20" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Distribution Chart */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <PieChart className="h-5 w-5" />
            有給休暇日数の分布
          </CardTitle>
          <CardDescription>従業員の保有日数別人数</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {yukyuDistribution.map((range, index) => (
              <div key={index} className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="font-medium">{range.label}</span>
                  <span className="text-gray-600">{range.count} 名</span>
                </div>
                <div className="flex items-center gap-2">
                  <Progress
                    value={stats?.totalEmployees ? (range.count / stats.totalEmployees) * 100 : 0}
                    className="flex-1"
                  />
                  <span className="text-sm text-gray-500 w-12 text-right">
                    {stats?.totalEmployees ? Math.round((range.count / stats.totalEmployees) * 100) : 0}%
                  </span>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Alerts */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        {/* No Yukyu Alert */}
        <Card className="border-red-200 dark:border-red-800">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-red-600">
              <XCircle className="h-5 w-5" />
              有給休暇0日
            </CardTitle>
            <CardDescription>{alerts.noYukyu.length} 名</CardDescription>
          </CardHeader>
          <CardContent>
            {alerts.noYukyu.length === 0 ? (
              <p className="text-sm text-gray-500">該当者なし</p>
            ) : (
              <div className="space-y-2 max-h-48 overflow-y-auto">
                {alerts.noYukyu.slice(0, 10).map((emp) => (
                  <div key={emp.id} className="flex items-center justify-between p-2 bg-red-50 dark:bg-red-900/20 rounded">
                    <span className="text-sm font-medium">{emp.full_name_kanji}</span>
                    <Badge variant="destructive">0日</Badge>
                  </div>
                ))}
                {alerts.noYukyu.length > 10 && (
                  <p className="text-xs text-gray-500 text-center">他 {alerts.noYukyu.length - 10} 名...</p>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Low Yukyu Warning */}
        <Card className="border-yellow-200 dark:border-yellow-800">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-yellow-600">
              <AlertTriangle className="h-5 w-5" />
              残日数少 (1-3日)
            </CardTitle>
            <CardDescription>{alerts.lowYukyu.length} 名</CardDescription>
          </CardHeader>
          <CardContent>
            {alerts.lowYukyu.length === 0 ? (
              <p className="text-sm text-gray-500">該当者なし</p>
            ) : (
              <div className="space-y-2 max-h-48 overflow-y-auto">
                {alerts.lowYukyu.slice(0, 10).map((emp) => (
                  <div key={emp.id} className="flex items-center justify-between p-2 bg-yellow-50 dark:bg-yellow-900/20 rounded">
                    <span className="text-sm font-medium">{emp.full_name_kanji}</span>
                    <Badge variant="outline" className="bg-yellow-100 text-yellow-700">
                      {emp.yukyu_remaining}日
                    </Badge>
                  </div>
                ))}
                {alerts.lowYukyu.length > 10 && (
                  <p className="text-xs text-gray-500 text-center">他 {alerts.lowYukyu.length - 10} 名...</p>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {/* High Yukyu */}
        <Card className="border-green-200 dark:border-green-800">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-green-600">
              <CheckCircle2 className="h-5 w-5" />
              残日数多 (15日以上)
            </CardTitle>
            <CardDescription>{alerts.highYukyu.length} 名</CardDescription>
          </CardHeader>
          <CardContent>
            {alerts.highYukyu.length === 0 ? (
              <p className="text-sm text-gray-500">該当者なし</p>
            ) : (
              <div className="space-y-2 max-h-48 overflow-y-auto">
                {alerts.highYukyu.slice(0, 10).map((emp) => (
                  <div key={emp.id} className="flex items-center justify-between p-2 bg-green-50 dark:bg-green-900/20 rounded">
                    <span className="text-sm font-medium">{emp.full_name_kanji}</span>
                    <Badge variant="outline" className="bg-green-100 text-green-700">
                      {emp.yukyu_remaining}日
                    </Badge>
                  </div>
                ))}
                {alerts.highYukyu.length > 10 && (
                  <p className="text-xs text-gray-500 text-center">他 {alerts.highYukyu.length - 10} 名...</p>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Important Notice */}
      <Alert className="border-blue-200 dark:border-blue-800 bg-blue-50 dark:bg-blue-900/20">
        <Clock className="h-4 w-4 text-blue-600" />
        <AlertTitle className="text-blue-900 dark:text-blue-100">労働基準法に基づく注意事項</AlertTitle>
        <AlertDescription className="text-blue-800 dark:text-blue-200">
          <ul className="list-disc list-inside space-y-1 mt-2">
            <li>従業員は年間最低5日間の有給休暇を取得する必要があります</li>
            <li>有給休暇は付与日から2年間で時効となります</li>
            <li>時効前に使用を促進してください</li>
          </ul>
        </AlertDescription>
      </Alert>
    </div>
  );
}
