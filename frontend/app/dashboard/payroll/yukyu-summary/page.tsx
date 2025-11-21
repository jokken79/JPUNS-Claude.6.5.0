'use client';

import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  Calendar,
  Users,
  TrendingUp,
  Building2,
  FileDown,
  Search
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import api from '@/lib/api';

export default function PayrollYukyuSummaryPage() {
  const currentYear = new Date().getFullYear();
  const currentMonth = new Date().getMonth() + 1;

  const [year, setYear] = useState<number>(currentYear);
  const [month, setMonth] = useState<number>(currentMonth);
  const [factoryId, setFactoryId] = useState<string>('');

  // Fetch factories
  const { data: factories } = useQuery({
    queryKey: ['factories'],
    queryFn: async () => {
      const res = await api.get('/factories');
      return res.data;
    }
  });

  // Fetch payroll summary
  const { data: summary, isLoading, refetch } = useQuery({
    queryKey: ['payroll-yukyu-summary', year, month, factoryId],
    queryFn: async () => {
      const params = new URLSearchParams({ year: year.toString(), month: month.toString() });
      if (factoryId) params.append('factory_id', factoryId);

      const res = await api.get(`/yukyu/payroll/summary?${params}`);
      return res.data;
    },
    enabled: false // Solo ejecutar cuando el usuario haga click
  });

  const handleGenerateSummary = () => {
    refetch();
  };

  const handleExportExcel = async () => {
    try {
      const res = await api.get('/yukyu/reports/export-excel', {
        responseType: 'blob'
      });

      const blob = res.data;
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `yukyu_payroll_${year}_${month}.xlsx`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      toast.success('レポートをエクスポートしました');
    } catch (error) {
      toast.error('エクスポートに失敗しました');
    }
  };

  return (
    <div className="container mx-auto p-6">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
          有給休暇 - 給与連携
        </h1>
        <p className="text-gray-600 dark:text-gray-400">
          Resumen de yukyus usados por período para integración con nómina
        </p>
      </div>

      {/* Filters */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Search className="h-5 w-5" />
            Filtros de Período
          </CardTitle>
          <CardDescription>
            Selecciona el período para generar el resumen de yukyus
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <Label>Año</Label>
              <Select value={year.toString()} onValueChange={(v) => setYear(parseInt(v))}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {[2023, 2024, 2025, 2026].map((y) => (
                    <SelectItem key={y} value={y.toString()}>{y}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Mes</Label>
              <Select value={month.toString()} onValueChange={(v) => setMonth(parseInt(v))}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Array.from({ length: 12 }, (_, i) => i + 1).map((m) => (
                    <SelectItem key={m} value={m.toString()}>
                      {m}月
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Fábrica (Opcional)</Label>
              <Select value={factoryId} onValueChange={setFactoryId}>
                <SelectTrigger>
                  <SelectValue placeholder="Todas" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Todas las fábricas</SelectItem>
                  {factories?.map((f: any) => (
                    <SelectItem key={f.id} value={f.id}>{f.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-end">
              <Button onClick={handleGenerateSummary} disabled={isLoading} className="w-full">
                {isLoading ? 'Cargando...' : 'Generar Resumen'}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Summary Stats */}
      {summary && (
        <>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Período</p>
                    <p className="text-lg font-bold">
                      {summary.period.start_date} ~ {summary.period.end_date}
                    </p>
                  </div>
                  <Calendar className="h-12 w-12 text-blue-600 opacity-20" />
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Total Empleados</p>
                    <p className="text-3xl font-bold">{summary.summary.total_employees}</p>
                  </div>
                  <Users className="h-12 w-12 text-blue-600 opacity-20" />
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Total Días Usados</p>
                    <p className="text-3xl font-bold text-green-600">{summary.summary.total_days_used}</p>
                  </div>
                  <TrendingUp className="h-12 w-12 text-green-600 opacity-20" />
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Promedio por Empleado</p>
                    <p className="text-3xl font-bold text-purple-600">{summary.summary.average_days_per_employee}</p>
                  </div>
                  <Building2 className="h-12 w-12 text-purple-600 opacity-20" />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Employees Table */}
          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <div>
                  <CardTitle>Detalle por Empleado</CardTitle>
                  <CardDescription>
                    {summary.employees.length} empleados con yukyus usados en este período
                  </CardDescription>
                </div>
                <Button onClick={handleExportExcel} variant="outline" className="gap-2">
                  <FileDown className="h-4 w-4" />
                  Exportar Excel
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left p-3 font-medium">ID Empleado</th>
                      <th className="text-left p-3 font-medium">Nombre</th>
                      <th className="text-left p-3 font-medium">Fábrica</th>
                      <th className="text-right p-3 font-medium">Días Usados</th>
                      <th className="text-right p-3 font-medium">Total Disponible</th>
                      <th className="text-right p-3 font-medium">Solicitudes</th>
                    </tr>
                  </thead>
                  <tbody>
                    {summary.employees.map((emp: any) => (
                      <tr key={emp.employee_id} className="border-b hover:bg-gray-50 dark:hover:bg-gray-800">
                        <td className="p-3">{emp.employee_id}</td>
                        <td className="p-3 font-medium">{emp.employee_name}</td>
                        <td className="p-3">{emp.factory_name}</td>
                        <td className="p-3 text-right">
                          <Badge variant="outline" className="bg-green-50 text-green-700">
                            {emp.days_used_in_period} 日
                          </Badge>
                        </td>
                        <td className="p-3 text-right">{emp.total_available} 日</td>
                        <td className="p-3 text-right">{emp.requests_count}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </>
      )}

      {/* Empty State */}
      {!summary && !isLoading && (
        <Card>
          <CardContent className="p-12 text-center text-gray-500">
            <Calendar className="h-16 w-16 mx-auto mb-4 opacity-20" />
            <p className="text-lg font-medium">Selecciona un período y genera el resumen</p>
            <p className="text-sm">Los datos se mostrarán aquí</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
