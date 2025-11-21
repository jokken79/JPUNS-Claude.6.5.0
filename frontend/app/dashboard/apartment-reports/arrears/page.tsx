'use client';

import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { apartmentsV2Service } from '@/lib/api';
import {
  ArrowLeftIcon,
  CurrencyYenIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  ClockIcon,
  UserGroupIcon,
  DocumentArrowDownIcon,
} from '@heroicons/react/24/outline';
import { DevModeAlert } from '@/components/dev-mode-alert';

interface ArrearsReport {
  summary: {
    total_expected: number;
    total_paid: number;
    total_pending: number;
    collection_rate: number;
    total_debtors: number;
    average_debt: number;
  };
  monthly_trends: {
    month: string;
    expected: number;
    paid: number;
    pending: number;
    collection_rate: number;
  }[];
  by_status: {
    status: string;
    count: number;
    total_amount: number;
  }[];
  top_debtors: {
    employee_id: number;
    employee_name: string;
    apartment_name: string;
    total_pending: number;
    oldest_pending_date: string;
    pending_months: number;
  }[];
  by_apartment: {
    apartment_id: number;
    apartment_name: string;
    total_pending: number;
    pending_deductions: number;
    latest_payment_date: string;
  }[];
}

export default function ArrearsReportPage() {
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);

  // Fetch arrears report data
  const { data: report, isLoading } = useQuery({
    queryKey: ['apartment-arrears-report', selectedYear, selectedMonth],
    queryFn: async () => {
      return await apartmentsV2Service.getArrearsReport(selectedYear, selectedMonth);
    },
  });

  if (isLoading || !report) {
    return (
      <div className="p-6">
        <div className="text-center py-12">Cargando reporte de pagos pendientes...</div>
      </div>
    );
  }

  const handleExportPDF = () => {
    // TODO: Implement PDF export
    alert('Función de exportación a PDF en desarrollo');
  };

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button
            onClick={() => window.history.back()}
            className="p-2 hover:bg-accent rounded-lg transition-colors"
          >
            <ArrowLeftIcon className="h-5 w-5" />
          </button>
          <div>
            <h1 className="text-3xl font-bold">Reporte de Pagos Pendientes</h1>
            <p className="text-sm text-muted-foreground mt-1">
              Análisis de deducciones pendientes y tasa de cobranza
            </p>
          </div>
        </div>
        <button
          onClick={handleExportPDF}
          className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
        >
          <DocumentArrowDownIcon className="h-5 w-5" />
          Exportar PDF
        </button>
      </div>

      {/* Development Alert */}
      <DevModeAlert
        pageName="Arrears Report"
        message="PDF export functionality is currently under development. All other features are fully functional."
      />

      {/* Filters */}
      <div className="bg-card border rounded-lg p-4">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1">
            <label className="block text-sm font-medium mb-2">Año</label>
            <select
              value={selectedYear}
              onChange={(e) => setSelectedYear(Number(e.target.value))}
              className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
            >
              {[2023, 2024, 2025, 2026].map((year) => (
                <option key={year} value={year}>
                  {year}
                </option>
              ))}
            </select>
          </div>

          <div className="flex-1">
            <label className="block text-sm font-medium mb-2">Mes</label>
            <select
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(Number(e.target.value))}
              className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
            >
              {Array.from({ length: 12 }, (_, i) => i + 1).map((month) => (
                <option key={month} value={month}>
                  {new Date(2000, month - 1).toLocaleDateString('es-ES', { month: 'long' })}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-card border rounded-lg p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Total Esperado</p>
              <p className="text-3xl font-bold mt-1">
                ¥{report.summary.total_expected.toLocaleString()}
              </p>
            </div>
            <CurrencyYenIcon className="h-12 w-12 text-blue-500" />
          </div>
        </div>

        <div className="bg-card border rounded-lg p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Total Pagado</p>
              <p className="text-3xl font-bold mt-1 text-green-600">
                ¥{report.summary.total_paid.toLocaleString()}
              </p>
            </div>
            <CheckCircleIcon className="h-12 w-12 text-green-500" />
          </div>
        </div>

        <div className="bg-card border rounded-lg p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Total Pendiente</p>
              <p className="text-3xl font-bold mt-1 text-red-600">
                ¥{report.summary.total_pending.toLocaleString()}
              </p>
            </div>
            <ExclamationTriangleIcon className="h-12 w-12 text-red-500" />
          </div>
        </div>

        <div className="bg-card border rounded-lg p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Tasa de Cobranza</p>
              <p className="text-3xl font-bold mt-1 text-purple-600">
                {report.summary.collection_rate.toFixed(1)}%
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                {report.summary.total_debtors} deudores
              </p>
            </div>
            <ClockIcon className="h-12 w-12 text-purple-500" />
          </div>
        </div>
      </div>

      {/* Monthly Trends */}
      <div className="bg-card border rounded-lg p-6">
        <h2 className="text-xl font-semibold mb-4">Tendencia de Cobranza (Últimos 6 Meses)</h2>
        <div className="space-y-4">
          {report.monthly_trends.map((trend, index) => (
            <div key={index}>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium">{trend.month}</span>
                <div className="flex items-center gap-4">
                  <span className="text-sm">
                    <span className="text-muted-foreground">Tasa: </span>
                    <span className="font-semibold text-purple-600">
                      {trend.collection_rate.toFixed(1)}%
                    </span>
                  </span>
                </div>
              </div>
              <div className="space-y-2">
                <div className="flex gap-2">
                  <div className="flex-1">
                    <div className="flex justify-between text-xs mb-1">
                      <span className="text-green-600">Pagado</span>
                      <span>¥{trend.paid.toLocaleString()}</span>
                    </div>
                    <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                      <div
                        className="bg-green-500 h-2 rounded-full"
                        style={{ width: `${(trend.paid / trend.expected) * 100}%` }}
                      />
                    </div>
                  </div>
                </div>
                <div className="flex gap-2">
                  <div className="flex-1">
                    <div className="flex justify-between text-xs mb-1">
                      <span className="text-red-600">Pendiente</span>
                      <span>¥{trend.pending.toLocaleString()}</span>
                    </div>
                    <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                      <div
                        className="bg-red-500 h-2 rounded-full"
                        style={{ width: `${(trend.pending / trend.expected) * 100}%` }}
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Status Distribution */}
      <div className="bg-card border rounded-lg p-6">
        <h2 className="text-xl font-semibold mb-4">Distribución por Estado</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {report.by_status.map((item) => (
            <div key={item.status} className="border rounded-lg p-4">
              <div className="flex items-center gap-3 mb-3">
                <div
                  className={`h-4 w-4 rounded-full ${
                    item.status === 'PAID'
                      ? 'bg-green-500'
                      : item.status === 'PROCESSED'
                      ? 'bg-yellow-500'
                      : 'bg-red-500'
                  }`}
                />
                <h3 className="font-semibold">
                  {item.status === 'PAID'
                    ? 'Pagado'
                    : item.status === 'PROCESSED'
                    ? 'Procesado'
                    : 'Pendiente'}
                </h3>
              </div>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Cantidad:</span>
                  <span className="font-medium">{item.count}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Monto Total:</span>
                  <span className="font-semibold">¥{item.total_amount.toLocaleString()}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Top Debtors */}
      <div className="bg-card border rounded-lg p-6">
        <h2 className="text-xl font-semibold mb-4">Top Deudores</h2>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b">
                <th className="text-left py-3 px-4">Empleado</th>
                <th className="text-left py-3 px-4">Apartamento</th>
                <th className="text-center py-3 px-4">Meses Pendientes</th>
                <th className="text-left py-3 px-4">Fecha Más Antigua</th>
                <th className="text-right py-3 px-4">Monto Pendiente</th>
              </tr>
            </thead>
            <tbody>
              {report.top_debtors.map((debtor) => (
                <tr key={debtor.employee_id} className="border-b hover:bg-accent">
                  <td className="py-3 px-4 font-medium">{debtor.employee_name}</td>
                  <td className="py-3 px-4 text-muted-foreground">{debtor.apartment_name}</td>
                  <td className="py-3 px-4 text-center">
                    <span
                      className={`px-2 py-1 text-xs font-medium rounded-full ${
                        debtor.pending_months >= 3
                          ? 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400'
                          : debtor.pending_months >= 2
                          ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400'
                          : 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400'
                      }`}
                    >
                      {debtor.pending_months} {debtor.pending_months === 1 ? 'mes' : 'meses'}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-muted-foreground">
                    {new Date(debtor.oldest_pending_date).toLocaleDateString('es-ES')}
                  </td>
                  <td className="py-3 px-4 text-right font-semibold text-red-600">
                    ¥{debtor.total_pending.toLocaleString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* By Apartment */}
      <div className="bg-card border rounded-lg p-6">
        <h2 className="text-xl font-semibold mb-4">Pendientes por Apartamento</h2>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b">
                <th className="text-left py-3 px-4">Apartamento</th>
                <th className="text-center py-3 px-4">Deducciones Pendientes</th>
                <th className="text-left py-3 px-4">Último Pago</th>
                <th className="text-right py-3 px-4">Monto Pendiente</th>
              </tr>
            </thead>
            <tbody>
              {report.by_apartment.map((apt) => (
                <tr key={apt.apartment_id} className="border-b hover:bg-accent">
                  <td className="py-3 px-4 font-medium">{apt.apartment_name}</td>
                  <td className="py-3 px-4 text-center">{apt.pending_deductions}</td>
                  <td className="py-3 px-4 text-muted-foreground">
                    {apt.latest_payment_date
                      ? new Date(apt.latest_payment_date).toLocaleDateString('es-ES')
                      : 'Sin pagos'}
                  </td>
                  <td className="py-3 px-4 text-right font-semibold text-red-600">
                    ¥{apt.total_pending.toLocaleString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
