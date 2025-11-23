'use client';

import React, { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  Calendar,
  User,
  Search,
  TrendingDown,
  Clock,
  FileText,
  Filter
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import api from '@/lib/api';
import { useAuthStore } from '@/stores/auth-store';
import { canViewAllYukyuHistory } from '@/lib/yukyu-roles';

interface YukyuUsageDetail {
  id: number;
  request_id: number;
  balance_id: number;
  usage_date: string;
  days_deducted: number;
  request_type: string;
  request_status: string;
  request_start_date: string;
  request_end_date: string;
  fiscal_year: number;
  balance_status: string;
  notes?: string;
}

interface EmployeeInfo {
  id: number;
  full_name_kanji: string;
  hakenmoto_id: number;  // 社員№ (Employee Number) - INTEGER in database
  total_available: number;
  total_used: number;
  total_expired: number;
}

export default function YukyuHistoryPage() {
  const [employeeIdInput, setEmployeeIdInput] = useState<string>('');
  const [selectedEmployeeId, setSelectedEmployeeId] = useState<string>('');
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');
  const [fiscalYear, setFiscalYear] = useState<string>('');
  const { user } = useAuthStore();

  // Access control: Regular employees can only view their own history
  // 一般ユーザーは自分の履歴のみ閲覧可能
  const canViewAllHistory = useMemo(() => canViewAllYukyuHistory(user?.role), [user?.role]);

  // Fetch employees
  const { data: employees } = useQuery({
    queryKey: ['employees'],
    queryFn: async () => {
      const res = await api.get('/employees');
      return res.data.items || [];
    },
    // Only fetch all employees if user can view all history (ADMIN/KEIRI)
    // 管理者のみ全従業員を取得
    enabled: canViewAllHistory
  });

  // Fetch employee yukyu summary
  const { data: employeeInfo } = useQuery({
    queryKey: ['yukyu-employee-info', selectedEmployeeId],
    queryFn: async () => {
      const res = await api.get(`/yukyu/balances/${selectedEmployeeId}`);
      return res.data;
    },
    enabled: !!selectedEmployeeId
  });

  // Fetch usage history from real backend endpoint
  const { data: usageHistory, isLoading: historyLoading, refetch: refetchHistory } = useQuery({
    queryKey: ['yukyu-usage-history', selectedEmployeeId, startDate, endDate, fiscalYear],
    queryFn: async () => {
      if (!selectedEmployeeId) return [];

      const params = new URLSearchParams();
      if (startDate) params.append('start_date', startDate);
      if (endDate) params.append('end_date', endDate);
      if (fiscalYear) params.append('fiscal_year', fiscalYear);
      params.append('include_expired', 'true'); // Always include expired balances for history

      const res = await api.get(`/yukyu/usage-history/${selectedEmployeeId}?${params.toString()}`);
      return res.data;
    },
    enabled: false // Only execute when user clicks "Buscar"
  });

  const handleEmployeeIdChange = (value: string) => {
    setEmployeeIdInput(value);

    // Search employee by hakenmoto_id (社員№) or system ID
    if (value && employees) {
      const numericValue = parseInt(value);
      const employee = employees.find((emp: any) =>
        emp.hakenmoto_id === numericValue || emp.id === numericValue
      );

      if (employee) {
        setSelectedEmployeeId(employee.id.toString());
      } else if (!isNaN(numericValue)) {
        // Fallback: if it's a number but not found, assume it's system ID
        setSelectedEmployeeId(value);
      }
    }
  };

  const handleSearch = () => {
    if (!selectedEmployeeId) {
      return;
    }
    // Trigger refetch to load history
    refetchHistory();
  };

  const getRequestTypeLabel = (type: string) => {
    const types: Record<string, string> = {
      'yukyu': '有給休暇',
      'hankyu': '半休',
      'ikkikokoku': '一時帰国',
      'taisha': '退社'
    };
    return types[type] || type;
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, { bg: string; text: string }> = {
      'approved': { bg: 'bg-green-100', text: 'text-green-800' },
      'pending': { bg: 'bg-yellow-100', text: 'text-yellow-800' },
      'rejected': { bg: 'bg-red-100', text: 'text-red-800' }
    };
    const variant = variants[status] || { bg: 'bg-gray-100', text: 'text-gray-800' };
    return (
      <Badge variant="outline" className={`${variant.bg} ${variant.text}`}>
        {status === 'approved' ? '承認済み' : status === 'pending' ? '承認待ち' : '却下'}
      </Badge>
    );
  };

  const getFiscalYearColor = (year: number) => {
    const colors = [
      'bg-blue-100 text-blue-800',
      'bg-purple-100 text-purple-800',
      'bg-green-100 text-green-800',
      'bg-amber-100 text-amber-800',
      'bg-pink-100 text-pink-800'
    ];
    return colors[year % colors.length];
  };

  return (
    <div className="container mx-auto p-6">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
          有給休暇使用履歴
        </h1>
        <p className="text-gray-600 dark:text-gray-400">
          Historial detallado de uso de yukyus con información LIFO
        </p>
      </div>

      {/* Filters */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Filtros de Búsqueda
          </CardTitle>
          <CardDescription>
            Selecciona un empleado y período para ver el historial detallado
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {/* Access control notice for regular employees */}
            {!canViewAllHistory && (
              <Alert className="bg-blue-50 border-blue-200 dark:bg-blue-900/20 dark:border-blue-800">
                <AlertDescription className="text-blue-800 dark:text-blue-100">
                  自分の有給休暇履歴のみ閲覧可能です。 (You can only view your own yukyu history)
                </AlertDescription>
              </Alert>
            )}

            {/* Employee Shain Number Input */}
            <div>
              <Label>社員№ (Número de Empleado) *</Label>
              <div className="relative">
                <User className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  type="text"
                  placeholder={canViewAllHistory ? "Digita el 社員№ del empleado (ej: 200901)" : "Solo puedes ver tu propio historial"}
                  value={employeeIdInput}
                  onChange={(e) => handleEmployeeIdChange(e.target.value)}
                  disabled={!canViewAllHistory}
                  className="pl-10"
                />
              </div>
              {!canViewAllHistory && (
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  管理者のみ他の従業員の履歴を検索できます (Only admins can search other employees)
                </p>
              )}
            </div>

            {/* Employee Info Display (Auto-shown when shain number is entered) */}
            {employeeInfo && (
              <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                <h4 className="font-medium text-blue-900 dark:text-blue-100 mb-2">
                  ✓ Empleado Encontrado
                </h4>
                <div className="grid grid-cols-3 gap-3 text-sm">
                  <div>
                    <span className="text-gray-600 dark:text-gray-400">社員№: </span>
                    <span className="font-medium">{employeeInfo.hakenmoto_id || 'N/A'}</span>
                  </div>
                  <div>
                    <span className="text-gray-600 dark:text-gray-400">Nombre: </span>
                    <span className="font-medium">{employeeInfo.employee_name}</span>
                  </div>
                  <div>
                    <span className="text-gray-600 dark:text-gray-400">ID Sistema: </span>
                    <span className="font-medium">{selectedEmployeeId}</span>
                  </div>
                </div>
              </div>
            )}

            {/* Date Filters */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div>
                <Label>Desde</Label>
                <Input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                />
              </div>
              <div>
                <Label>Hasta</Label>
                <Input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                />
              </div>
              <div>
                <Label>Año Fiscal (opcional)</Label>
                <Input
                  type="number"
                  placeholder="2020"
                  value={fiscalYear}
                  onChange={(e) => setFiscalYear(e.target.value)}
                />
              </div>
              <div className="flex items-end">
                <Button onClick={handleSearch} disabled={!selectedEmployeeId} className="w-full">
                  <Search className="mr-2 h-4 w-4" />
                  Buscar Historial
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Employee Info Card */}
      {employeeInfo && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Empleado</p>
                  <p className="text-lg font-bold">{employeeInfo.employee_name}</p>
                </div>
                <User className="h-12 w-12 text-blue-600 opacity-20" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Disponible</p>
                  <p className="text-3xl font-bold text-green-600">{employeeInfo.total_available}</p>
                </div>
                <Calendar className="h-12 w-12 text-green-600 opacity-20" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Usado</p>
                  <p className="text-3xl font-bold text-blue-600">{employeeInfo.total_used}</p>
                </div>
                <TrendingDown className="h-12 w-12 text-blue-600 opacity-20" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Expirado</p>
                  <p className="text-3xl font-bold text-red-600">{employeeInfo.total_expired}</p>
                </div>
                <Clock className="h-12 w-12 text-red-600 opacity-20" />
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Usage History Table */}
      {selectedEmployeeId && (
        <Card>
          <CardHeader>
            <CardTitle>Historial Detallado de Uso</CardTitle>
            <CardDescription>
              Muestra de qué balance (año fiscal) se dedujo cada día usando lógica LIFO
            </CardDescription>
          </CardHeader>
          <CardContent>
            {historyLoading ? (
              <div className="text-center py-8">Cargando historial...</div>
            ) : usageHistory && usageHistory.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left p-3 font-medium">Fecha Uso</th>
                      <th className="text-left p-3 font-medium">Tipo</th>
                      <th className="text-right p-3 font-medium">Días</th>
                      <th className="text-center p-3 font-medium">Año Fiscal</th>
                      <th className="text-center p-3 font-medium">Estado</th>
                      <th className="text-left p-3 font-medium">Notas</th>
                    </tr>
                  </thead>
                  <tbody>
                    {usageHistory.map((usage: YukyuUsageDetail) => (
                      <tr key={usage.id} className="border-b hover:bg-gray-50 dark:hover:bg-gray-800">
                        <td className="p-3">
                          {new Date(usage.usage_date).toLocaleDateString('es-ES')}
                        </td>
                        <td className="p-3">{getRequestTypeLabel(usage.request_type)}</td>
                        <td className="p-3 text-right font-mono">{usage.days_deducted.toFixed(1)}</td>
                        <td className="p-3 text-center">
                          <Badge variant="outline" className={getFiscalYearColor(usage.fiscal_year)}>
                            {usage.fiscal_year}年度
                          </Badge>
                        </td>
                        <td className="p-3 text-center">
                          {getStatusBadge(usage.request_status)}
                        </td>
                        <td className="p-3 text-sm text-gray-600">{usage.notes || '-'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <Alert>
                <FileText className="h-4 w-4" />
                <AlertDescription>
                  {selectedEmployeeId
                    ? 'No se encontraron registros de uso de yukyu para este empleado y período.'
                    : 'Selecciona un empleado y haz click en "Buscar" para ver el historial.'}
                </AlertDescription>
              </Alert>
            )}
          </CardContent>
        </Card>
      )}

      {/* LIFO Explanation */}
      <Card className="mt-6 border-blue-200 dark:border-blue-800">
        <CardHeader>
          <CardTitle className="text-blue-900 dark:text-blue-100">
            ℹ️ Sobre la Lógica LIFO
          </CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-blue-800 dark:text-blue-200">
          <p className="mb-2">
            El sistema utiliza <strong>LIFO (Last In, First Out)</strong> para deducir yukyus:
          </p>
          <ul className="list-disc list-inside space-y-1">
            <li>Los yukyus más recientes se usan primero</li>
            <li>Esto maximiza el uso antes de que expiren (2 años)</li>
            <li>Cada deducción se vincula al balance (año fiscal) específico</li>
            <li>Los colores indican de qué año fiscal se dedujo cada día</li>
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}
