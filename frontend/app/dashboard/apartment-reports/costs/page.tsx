'use client';

import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { apartmentsV2Service } from '@/lib/api';
import {
  ArrowLeftIcon,
  CurrencyYenIcon,
  ChartBarIcon,
  ArrowTrendingUpIcon,
  ArrowTrendingDownIcon,
  DocumentTextIcon,
} from '@heroicons/react/24/outline';

interface CostReport {
  summary: {
    total_revenue: number;
    total_expenses: number;
    net_profit: number;
    profit_margin: number;
    average_rent: number;
    previous_period_profit: number;
  };
  revenue_breakdown: {
    category: string;
    amount: number;
    percentage: number;
  }[];
  expense_breakdown: {
    category: string;
    amount: number;
    percentage: number;
  }[];
  by_apartment: {
    id: number;
    apartment_code: string;
    address: string;
    revenue: number;
    expenses: number;
    profit: number;
    profit_margin: number;
  }[];
  monthly_trends: {
    month: string;
    revenue: number;
    expenses: number;
    profit: number;
  }[];
}

export default function CostsReportPage() {
  const currentYear = new Date().getFullYear();
  const currentMonth = new Date().getMonth() + 1;
  const [selectedYear, setSelectedYear] = useState(currentYear);
  const [selectedMonth, setSelectedMonth] = useState(currentMonth);

  // Fetch cost report data
  const { data: report, isLoading } = useQuery({
    queryKey: ['apartment-costs-report', selectedYear, selectedMonth],
    queryFn: async () => {
      return await apartmentsV2Service.getCostAnalysisReport(selectedYear, selectedMonth);
    },
  });

  if (isLoading || !report) {
    return (
      <div className="p-6">
        <div className="text-center py-12">Cargando reporte de costos...</div>
      </div>
    );
  }

  const profitChange = report.summary.net_profit - report.summary.previous_period_profit;
  const isProfitIncreasing = profitChange >= 0;

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <button
          onClick={() => window.history.back()}
          className="p-2 hover:bg-accent rounded-lg transition-colors"
        >
          <ArrowLeftIcon className="h-5 w-5" />
        </button>
        <div>
          <h1 className="text-3xl font-bold">Reporte de Costos</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Análisis financiero de ingresos, gastos y rentabilidad
          </p>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-card border rounded-lg p-4">
        <div className="flex gap-4">
          <div className="flex-1">
            <label className="block text-sm font-medium mb-2">Año</label>
            <select
              value={selectedYear}
              onChange={(e) => setSelectedYear(Number(e.target.value))}
              className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
            >
              {[currentYear - 2, currentYear - 1, currentYear, currentYear + 1].map((year) => (
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
              <p className="text-sm text-muted-foreground">Ingresos Totales</p>
              <p className="text-3xl font-bold mt-1 text-green-600">
                ¥{report.summary.total_revenue.toLocaleString()}
              </p>
            </div>
            <CurrencyYenIcon className="h-12 w-12 text-green-500" />
          </div>
        </div>

        <div className="bg-card border rounded-lg p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Gastos Totales</p>
              <p className="text-3xl font-bold mt-1 text-red-600">
                ¥{report.summary.total_expenses.toLocaleString()}
              </p>
            </div>
            <ChartBarIcon className="h-12 w-12 text-red-500" />
          </div>
        </div>

        <div className="bg-card border rounded-lg p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Ganancia Neta</p>
              <p className="text-3xl font-bold mt-1 text-blue-600">
                ¥{report.summary.net_profit.toLocaleString()}
              </p>
              <div className="flex items-center gap-1 mt-1">
                {isProfitIncreasing ? (
                  <ArrowTrendingUpIcon className="h-4 w-4 text-green-500" />
                ) : (
                  <ArrowTrendingDownIcon className="h-4 w-4 text-red-500" />
                )}
                <span className={`text-xs ${isProfitIncreasing ? 'text-green-500' : 'text-red-500'}`}>
                  {Math.abs(profitChange).toLocaleString()} vs anterior
                </span>
              </div>
            </div>
            <CurrencyYenIcon className="h-12 w-12 text-blue-500" />
          </div>
        </div>

        <div className="bg-card border rounded-lg p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Margen de Ganancia</p>
              <p className="text-3xl font-bold mt-1 text-purple-600">
                {report.summary.profit_margin.toFixed(1)}%
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                Promedio: ¥{report.summary.average_rent.toLocaleString()}/mes
              </p>
            </div>
            <ChartBarIcon className="h-12 w-12 text-purple-500" />
          </div>
        </div>
      </div>

      {/* Trends Chart */}
      <div className="bg-card border rounded-lg p-6">
        <h2 className="text-xl font-semibold mb-4">Tendencias Financieras</h2>
        <div className="space-y-6">
          {report.monthly_trends.map((trend, index) => (
            <div key={index}>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium">{trend.month}</span>
                <div className="flex items-center gap-4">
                  <span className="text-sm">
                    <span className="text-muted-foreground">Ganancia: </span>
                    <span className="font-semibold text-green-600">
                      ¥{trend.profit.toLocaleString()}
                    </span>
                  </span>
                </div>
              </div>
              <div className="space-y-2">
                <div className="flex gap-2">
                  <div className="flex-1">
                    <div className="flex justify-between text-xs mb-1">
                      <span className="text-green-600">Ingresos</span>
                      <span>¥{trend.revenue.toLocaleString()}</span>
                    </div>
                    <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                      <div
                        className="bg-green-500 h-2 rounded-full"
                        style={{ width: `${(trend.revenue / (trend.revenue + trend.expenses)) * 100}%` }}
                      />
                    </div>
                  </div>
                </div>
                <div className="flex gap-2">
                  <div className="flex-1">
                    <div className="flex justify-between text-xs mb-1">
                      <span className="text-red-600">Gastos</span>
                      <span>¥{trend.expenses.toLocaleString()}</span>
                    </div>
                    <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                      <div
                        className="bg-red-500 h-2 rounded-full"
                        style={{ width: `${(trend.expenses / (trend.revenue + trend.expenses)) * 100}%` }}
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Revenue & Expense Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Revenue Breakdown */}
        <div className="bg-card border rounded-lg p-6">
          <h2 className="text-xl font-semibold mb-4">Desglose de Ingresos</h2>
          <div className="space-y-3">
            {report.revenue_breakdown.map((item, index) => (
              <div key={index}>
                <div className="flex justify-between text-sm mb-1">
                  <span className="font-medium">{item.category}</span>
                  <span className="font-semibold">¥{item.amount.toLocaleString()}</span>
                </div>
                <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                  <div
                    className="bg-green-500 h-2 rounded-full"
                    style={{ width: `${item.percentage}%` }}
                  />
                </div>
                <div className="text-xs text-muted-foreground mt-1">
                  {item.percentage.toFixed(1)}% del total
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Expense Breakdown */}
        <div className="bg-card border rounded-lg p-6">
          <h2 className="text-xl font-semibold mb-4">Desglose de Gastos</h2>
          <div className="space-y-3">
            {report.expense_breakdown.map((item, index) => (
              <div key={index}>
                <div className="flex justify-between text-sm mb-1">
                  <span className="font-medium">{item.category}</span>
                  <span className="font-semibold">¥{item.amount.toLocaleString()}</span>
                </div>
                <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                  <div
                    className="bg-red-500 h-2 rounded-full"
                    style={{ width: `${item.percentage}%` }}
                  />
                </div>
                <div className="text-xs text-muted-foreground mt-1">
                  {item.percentage.toFixed(1)}% del total
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* By Apartment */}
      <div className="bg-card border rounded-lg p-6">
        <h2 className="text-xl font-semibold mb-4">Rentabilidad por Apartamento</h2>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b">
                <th className="text-left py-3 px-4">Apartamento</th>
                <th className="text-left py-3 px-4">Dirección</th>
                <th className="text-right py-3 px-4">Ingresos</th>
                <th className="text-right py-3 px-4">Gastos</th>
                <th className="text-right py-3 px-4">Ganancia</th>
                <th className="text-right py-3 px-4">Margen</th>
              </tr>
            </thead>
            <tbody>
              {report.by_apartment.map((apt) => (
                <tr key={apt.id} className="border-b hover:bg-accent">
                  <td className="py-3 px-4 font-medium">{apt.apartment_code}</td>
                  <td className="py-3 px-4 text-muted-foreground">{apt.address}</td>
                  <td className="py-3 px-4 text-right font-semibold text-green-600">
                    ¥{apt.revenue.toLocaleString()}
                  </td>
                  <td className="py-3 px-4 text-right font-semibold text-red-600">
                    ¥{apt.expenses.toLocaleString()}
                  </td>
                  <td className="py-3 px-4 text-right font-semibold text-blue-600">
                    ¥{apt.profit.toLocaleString()}
                  </td>
                  <td className="py-3 px-4 text-right">
                    <span
                      className={`font-semibold ${
                        apt.profit_margin >= 70
                          ? 'text-green-600'
                          : apt.profit_margin >= 40
                          ? 'text-yellow-600'
                          : 'text-red-600'
                      }`}
                    >
                      {apt.profit_margin.toFixed(1)}%
                    </span>
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
