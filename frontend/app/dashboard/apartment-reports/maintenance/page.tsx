'use client';

import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { apartmentsV2Service } from '@/lib/api';
import {
  ArrowLeftIcon,
  WrenchScrewdriverIcon,
  SparklesIcon,
  ExclamationCircleIcon,
  CurrencyYenIcon,
  ChartBarIcon,
  BuildingOfficeIcon,
} from '@heroicons/react/24/outline';

interface MaintenanceReport {
  summary: {
    total_charges: number;
    total_cost: number;
    average_cost_per_apartment: number;
    most_common_type: string;
    apartments_with_issues: number;
  };
  by_charge_type: {
    charge_type: string;
    count: number;
    total_cost: number;
    average_cost: number;
    percentage: number;
  }[];
  monthly_trends: {
    month: string;
    total_charges: number;
    total_cost: number;
    cleaning: number;
    repair: number;
    other: number;
  }[];
  top_apartments: {
    apartment_id: number;
    apartment_name: string;
    total_charges: number;
    total_cost: number;
    most_common_type: string;
    latest_charge_date: string;
  }[];
  recent_incidents: {
    id: number;
    apartment_name: string;
    employee_name: string;
    charge_type: string;
    description: string;
    amount: number;
    charge_date: string;
    status: string;
  }[];
}

const chargeTypeLabels: Record<string, string> = {
  cleaning: 'Limpieza',
  repair: 'Reparación',
  deposit: 'Depósito',
  penalty: 'Penalización',
  other: 'Otro',
};

const chargeTypeColors: Record<string, string> = {
  cleaning: 'bg-blue-500',
  repair: 'bg-red-500',
  deposit: 'bg-green-500',
  penalty: 'bg-yellow-500',
  other: 'bg-gray-500',
};

export default function MaintenanceReportPage() {
  const [selectedPeriod, setSelectedPeriod] = useState('6months');
  const [selectedChargeType, setSelectedChargeType] = useState<string>('');

  // Fetch maintenance report data
  const { data: report, isLoading } = useQuery({
    queryKey: ['apartment-maintenance-report', selectedPeriod, selectedChargeType],
    queryFn: async () => {
      return await apartmentsV2Service.getMaintenanceReport(selectedPeriod, selectedChargeType);
    },
  });

  if (isLoading || !report) {
    return (
      <div className="p-6">
        <div className="text-center py-12">Cargando reporte de mantenimiento...</div>
      </div>
    );
  }

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
          <h1 className="text-3xl font-bold">Reporte de Mantenimiento</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Análisis de cargos adicionales y costos de mantenimiento
          </p>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-card border rounded-lg p-4">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1">
            <label className="block text-sm font-medium mb-2">Período</label>
            <select
              value={selectedPeriod}
              onChange={(e) => setSelectedPeriod(e.target.value)}
              className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
            >
              <option value="1month">Último mes</option>
              <option value="3months">Últimos 3 meses</option>
              <option value="6months">Últimos 6 meses</option>
              <option value="1year">Último año</option>
            </select>
          </div>

          <div className="flex-1">
            <label className="block text-sm font-medium mb-2">Tipo de Cargo</label>
            <select
              value={selectedChargeType}
              onChange={(e) => setSelectedChargeType(e.target.value)}
              className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
            >
              <option value="">Todos los tipos</option>
              <option value="cleaning">Limpieza</option>
              <option value="repair">Reparación</option>
              <option value="deposit">Depósito</option>
              <option value="penalty">Penalización</option>
              <option value="other">Otro</option>
            </select>
          </div>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-card border rounded-lg p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Total Cargos</p>
              <p className="text-3xl font-bold mt-1">{report.summary.total_charges}</p>
            </div>
            <ChartBarIcon className="h-12 w-12 text-blue-500" />
          </div>
        </div>

        <div className="bg-card border rounded-lg p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Costo Total</p>
              <p className="text-3xl font-bold mt-1 text-red-600">
                ¥{report.summary.total_cost.toLocaleString()}
              </p>
            </div>
            <CurrencyYenIcon className="h-12 w-12 text-red-500" />
          </div>
        </div>

        <div className="bg-card border rounded-lg p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Promedio por Apt.</p>
              <p className="text-3xl font-bold mt-1 text-purple-600">
                ¥{report.summary.average_cost_per_apartment.toLocaleString()}
              </p>
            </div>
            <BuildingOfficeIcon className="h-12 w-12 text-purple-500" />
          </div>
        </div>

        <div className="bg-card border rounded-lg p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Apt. con Problemas</p>
              <p className="text-3xl font-bold mt-1 text-yellow-600">
                {report.summary.apartments_with_issues}
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                Tipo más común: {chargeTypeLabels[report.summary.most_common_type] || 'N/A'}
              </p>
            </div>
            <ExclamationCircleIcon className="h-12 w-12 text-yellow-500" />
          </div>
        </div>
      </div>

      {/* Charge Type Distribution */}
      <div className="bg-card border rounded-lg p-6">
        <h2 className="text-xl font-semibold mb-4">Distribución por Tipo de Cargo</h2>
        <div className="space-y-4">
          {report.by_charge_type.map((item) => (
            <div key={item.charge_type}>
              <div className="flex justify-between mb-2">
                <div className="flex items-center gap-2">
                  <div
                    className={`h-3 w-3 rounded-full ${
                      chargeTypeColors[item.charge_type] || 'bg-gray-500'
                    }`}
                  />
                  <span className="text-sm font-medium">
                    {chargeTypeLabels[item.charge_type] || item.charge_type}
                  </span>
                </div>
                <div className="flex items-center gap-4">
                  <span className="text-sm text-muted-foreground">{item.count} incidentes</span>
                  <span className="text-sm font-semibold">
                    ¥{item.total_cost.toLocaleString()}
                  </span>
                </div>
              </div>
              <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3">
                <div
                  className={`h-3 rounded-full ${
                    chargeTypeColors[item.charge_type] || 'bg-gray-500'
                  }`}
                  style={{ width: `${item.percentage}%` }}
                />
              </div>
              <div className="flex justify-between text-xs text-muted-foreground mt-1">
                <span>{item.percentage.toFixed(1)}% del total</span>
                <span>Promedio: ¥{item.average_cost.toLocaleString()}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Monthly Trends */}
      <div className="bg-card border rounded-lg p-6">
        <h2 className="text-xl font-semibold mb-4">Tendencia de Costos (Últimos 6 Meses)</h2>
        <div className="space-y-4">
          {report.monthly_trends.map((trend, index) => (
            <div key={index}>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium">{trend.month}</span>
                <div className="flex items-center gap-4">
                  <span className="text-sm">
                    <span className="text-muted-foreground">{trend.total_charges} cargos - </span>
                    <span className="font-semibold text-red-600">
                      ¥{trend.total_cost.toLocaleString()}
                    </span>
                  </span>
                </div>
              </div>
              <div className="space-y-1">
                <div className="flex gap-2">
                  <div className="flex-1">
                    <div className="flex justify-between text-xs mb-1">
                      <span className="text-blue-600">Limpieza</span>
                      <span>¥{trend.cleaning.toLocaleString()}</span>
                    </div>
                    <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                      <div
                        className="bg-blue-500 h-2 rounded-full"
                        style={{ width: `${(trend.cleaning / trend.total_cost) * 100}%` }}
                      />
                    </div>
                  </div>
                </div>
                <div className="flex gap-2">
                  <div className="flex-1">
                    <div className="flex justify-between text-xs mb-1">
                      <span className="text-red-600">Reparación</span>
                      <span>¥{trend.repair.toLocaleString()}</span>
                    </div>
                    <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                      <div
                        className="bg-red-500 h-2 rounded-full"
                        style={{ width: `${(trend.repair / trend.total_cost) * 100}%` }}
                      />
                    </div>
                  </div>
                </div>
                <div className="flex gap-2">
                  <div className="flex-1">
                    <div className="flex justify-between text-xs mb-1">
                      <span className="text-gray-600">Otros</span>
                      <span>¥{trend.other.toLocaleString()}</span>
                    </div>
                    <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                      <div
                        className="bg-gray-500 h-2 rounded-full"
                        style={{ width: `${(trend.other / trend.total_cost) * 100}%` }}
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Top Apartments with Issues */}
      <div className="bg-card border rounded-lg p-6">
        <h2 className="text-xl font-semibold mb-4">Top 10 Apartamentos con Más Problemas</h2>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b">
                <th className="text-left py-3 px-4">Apartamento</th>
                <th className="text-center py-3 px-4">Total Cargos</th>
                <th className="text-left py-3 px-4">Tipo Más Común</th>
                <th className="text-left py-3 px-4">Último Cargo</th>
                <th className="text-right py-3 px-4">Costo Total</th>
              </tr>
            </thead>
            <tbody>
              {report.top_apartments.map((apt) => (
                <tr key={apt.apartment_id} className="border-b hover:bg-accent">
                  <td className="py-3 px-4 font-medium">{apt.apartment_name}</td>
                  <td className="py-3 px-4 text-center">
                    <span
                      className={`px-2 py-1 text-xs font-medium rounded-full ${
                        apt.total_charges >= 5
                          ? 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400'
                          : apt.total_charges >= 3
                          ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400'
                          : 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400'
                      }`}
                    >
                      {apt.total_charges}
                    </span>
                  </td>
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-2">
                      <div
                        className={`h-3 w-3 rounded-full ${
                          chargeTypeColors[apt.most_common_type] || 'bg-gray-500'
                        }`}
                      />
                      <span className="text-sm">
                        {chargeTypeLabels[apt.most_common_type] || apt.most_common_type}
                      </span>
                    </div>
                  </td>
                  <td className="py-3 px-4 text-muted-foreground">
                    {new Date(apt.latest_charge_date).toLocaleDateString('es-ES')}
                  </td>
                  <td className="py-3 px-4 text-right font-semibold text-red-600">
                    ¥{apt.total_cost.toLocaleString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Recent Incidents */}
      <div className="bg-card border rounded-lg p-6">
        <h2 className="text-xl font-semibold mb-4">Incidentes Recientes</h2>
        <div className="space-y-3">
          {report.recent_incidents.map((incident) => (
            <div
              key={incident.id}
              className="border rounded-lg p-4 hover:bg-accent transition-colors"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <div
                      className={`h-3 w-3 rounded-full ${
                        chargeTypeColors[incident.charge_type] || 'bg-gray-500'
                      }`}
                    />
                    <span className="font-semibold">
                      {chargeTypeLabels[incident.charge_type] || incident.charge_type}
                    </span>
                    <span
                      className={`ml-2 px-2 py-1 text-xs font-medium rounded-full ${
                        incident.status === 'APPROVED'
                          ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
                          : incident.status === 'PENDING'
                          ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400'
                          : 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400'
                      }`}
                    >
                      {incident.status === 'APPROVED'
                        ? 'Aprobado'
                        : incident.status === 'PENDING'
                        ? 'Pendiente'
                        : incident.status}
                    </span>
                  </div>
                  <p className="text-sm text-muted-foreground mb-2">{incident.description}</p>
                  <div className="flex items-center gap-4 text-xs text-muted-foreground">
                    <span>Apartamento: {incident.apartment_name}</span>
                    <span>Empleado: {incident.employee_name}</span>
                    <span>
                      Fecha: {new Date(incident.charge_date).toLocaleDateString('es-ES')}
                    </span>
                  </div>
                </div>
                <div className="text-right ml-4">
                  <p className="text-lg font-bold text-red-600">
                    ¥{incident.amount.toLocaleString()}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
