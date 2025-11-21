'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { apartmentsV2Service } from '@/lib/api';
import {
  ChartBarIcon,
  CurrencyYenIcon,
  BuildingOfficeIcon,
  UserGroupIcon,
  ArrowRightIcon,
  CalendarIcon,
  ArrowTrendingUpIcon,
} from '@heroicons/react/24/outline';

interface ReportData {
  overview: {
    total_apartments: number;
    total_capacity: number;
    total_occupied: number;
    occupancy_rate: number;
    total_monthly_rent: number;
    average_rent: number;
  };
  trends: {
    period: string;
    occupancy: number;
    revenue: number;
  }[];
  top_apartments: {
    id: number;
    apartment_code: string;
    address: string;
    occupancy_rate: number;
    monthly_rent: number;
  }[];
  status_distribution: {
    status: string;
    count: number;
  }[];
}

export default function ApartmentReportsPage() {
  const router = useRouter();
  const [selectedPeriod, setSelectedPeriod] = useState('6months');

  // Fetch report data
  const { data: report, isLoading } = useQuery({
    queryKey: ['apartment-reports', selectedPeriod],
    queryFn: async () => {
      const response = await apartmentsV2Service.getOccupancyReport();
      return response as ReportData;
    },
  });

  if (isLoading || !report) {
    return (
      <div className="p-6">
        <div className="text-center py-12">Cargando reportes...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Reportes de Apartamentos</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Dashboard de analytics y métricas de gestión de vivienda
          </p>
        </div>
        <select
          value={selectedPeriod}
          onChange={(e) => setSelectedPeriod(e.target.value)}
          className="px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
        >
          <option value="1month">Último mes</option>
          <option value="3months">Últimos 3 meses</option>
          <option value="6months">Últimos 6 meses</option>
          <option value="1year">Último año</option>
        </select>
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-card border rounded-lg p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Total Apartamentos</p>
              <p className="text-3xl font-bold mt-1">{report.overview.total_apartments}</p>
              <p className="text-sm text-muted-foreground mt-1">
                Capacidad: {report.overview.total_capacity} personas
              </p>
            </div>
            <BuildingOfficeIcon className="h-12 w-12 text-blue-500" />
          </div>
        </div>

        <div className="bg-card border rounded-lg p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Tasa de Ocupación</p>
              <p className="text-3xl font-bold mt-1 text-green-600">
                {report.overview.occupancy_rate.toFixed(1)}%
              </p>
              <p className="text-sm text-muted-foreground mt-1">
                {report.overview.total_occupied}/{report.overview.total_capacity} ocupados
              </p>
            </div>
            <UserGroupIcon className="h-12 w-12 text-green-500" />
          </div>
        </div>

        <div className="bg-card border rounded-lg p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Ingresos Mensuales</p>
              <p className="text-3xl font-bold mt-1">
                ¥{report.overview.total_monthly_rent.toLocaleString()}
              </p>
              <p className="text-sm text-muted-foreground mt-1">
                Promedio: ¥{report.overview.average_rent.toLocaleString()}
              </p>
            </div>
            <CurrencyYenIcon className="h-12 w-12 text-purple-500" />
          </div>
        </div>

        <div className="bg-card border rounded-lg p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Tendencia</p>
              <p className="text-3xl font-bold mt-1 text-green-600">↗ +5.2%</p>
              <p className="text-sm text-muted-foreground mt-1">
                vs período anterior
              </p>
            </div>
            <ArrowTrendingUpIcon className="h-12 w-12 text-green-500" />
          </div>
        </div>
      </div>

      {/* Quick Access Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <button
          onClick={() => router.push('/apartment-reports/occupancy')}
          className="bg-card border rounded-lg p-6 hover:shadow-lg transition-shadow text-left"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="h-16 w-16 bg-blue-100 rounded-lg flex items-center justify-center">
                <ChartBarIcon className="h-8 w-8 text-blue-600" />
              </div>
              <div>
                <h3 className="text-xl font-semibold">Reporte de Ocupación</h3>
                <p className="text-sm text-muted-foreground mt-1">
                  Analiza la ocupación por apartamento, tendencias y capacidad
                </p>
              </div>
            </div>
            <ArrowRightIcon className="h-6 w-6 text-muted-foreground" />
          </div>
        </button>

        <button
          onClick={() => router.push('/apartment-reports/arrears')}
          className="bg-card border rounded-lg p-6 hover:shadow-lg transition-shadow text-left"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="h-16 w-16 bg-red-100 rounded-lg flex items-center justify-center">
                <CurrencyYenIcon className="h-8 w-8 text-red-600" />
              </div>
              <div>
                <h3 className="text-xl font-semibold">Reporte de Pagos Pendientes</h3>
                <p className="text-sm text-muted-foreground mt-1">
                  Seguimiento de deducciones pendientes y tasa de cobranza
                </p>
              </div>
            </div>
            <ArrowRightIcon className="h-6 w-6 text-muted-foreground" />
          </div>
        </button>

        <button
          onClick={() => router.push('/apartment-reports/maintenance')}
          className="bg-card border rounded-lg p-6 hover:shadow-lg transition-shadow text-left"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="h-16 w-16 bg-yellow-100 rounded-lg flex items-center justify-center">
                <BuildingOfficeIcon className="h-8 w-8 text-yellow-600" />
              </div>
              <div>
                <h3 className="text-xl font-semibold">Reporte de Mantenimiento</h3>
                <p className="text-sm text-muted-foreground mt-1">
                  Análisis de cargos adicionales y costos de mantenimiento
                </p>
              </div>
            </div>
            <ArrowRightIcon className="h-6 w-6 text-muted-foreground" />
          </div>
        </button>

        <button
          onClick={() => router.push('/apartment-reports/costs')}
          className="bg-card border rounded-lg p-6 hover:shadow-lg transition-shadow text-left"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="h-16 w-16 bg-green-100 rounded-lg flex items-center justify-center">
                <CurrencyYenIcon className="h-8 w-8 text-green-600" />
              </div>
              <div>
                <h3 className="text-xl font-semibold">Reporte de Costos</h3>
                <p className="text-sm text-muted-foreground mt-1">
                  Analiza gastos, ingresos y rentabilidad por apartamento
                </p>
              </div>
            </div>
            <ArrowRightIcon className="h-6 w-6 text-muted-foreground" />
          </div>
        </button>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Occupancy Trends */}
        <div className="bg-card border rounded-lg p-6">
          <h2 className="text-xl font-semibold mb-4">Tendencia de Ocupación</h2>
          <div className="space-y-3">
            {report.trends.map((trend, index) => (
              <div key={index} className="flex items-center justify-between">
                <div className="flex-1">
                  <p className="text-sm font-medium">{trend.period}</p>
                  <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2 mt-1">
                    <div
                      className="bg-blue-500 h-2 rounded-full"
                      style={{ width: `${trend.occupancy}%` }}
                    />
                  </div>
                </div>
                <div className="ml-4 text-right">
                  <p className="text-sm font-semibold">{trend.occupancy.toFixed(1)}%</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Status Distribution */}
        <div className="bg-card border rounded-lg p-6">
          <h2 className="text-xl font-semibold mb-4">Distribución por Estado</h2>
          <div className="space-y-3">
            {report.status_distribution.map((item, index) => (
              <div key={index} className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div
                    className={`h-3 w-3 rounded-full ${
                      item.status === 'disponible'
                        ? 'bg-green-500'
                        : item.status === 'parcial'
                        ? 'bg-yellow-500'
                        : 'bg-red-500'
                    }`}
                  />
                  <span className="text-sm font-medium">
                    {item.status === 'disponible' ? 'Disponible' :
                     item.status === 'parcial' ? 'Parcial' : 'Lleno'}
                  </span>
                </div>
                <span className="text-sm font-semibold">{item.count}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Top Performing Apartments */}
      <div className="bg-card border rounded-lg p-6">
        <h2 className="text-xl font-semibold mb-4">Apartamentos Destacados</h2>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b">
                <th className="text-left py-3 px-4">Apartamento</th>
                <th className="text-left py-3 px-4">Dirección</th>
                <th className="text-left py-3 px-4">Ocupación</th>
                <th className="text-right py-3 px-4">Renta Mensual</th>
              </tr>
            </thead>
            <tbody>
              {report.top_apartments.map((apt) => (
                <tr key={apt.id} className="border-b hover:bg-accent">
                  <td className="py-3 px-4 font-medium">{apt.apartment_code}</td>
                  <td className="py-3 px-4 text-muted-foreground">{apt.address}</td>
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-2">
                      <div className="w-24 bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                        <div
                          className={`h-2 rounded-full ${
                            apt.occupancy_rate >= 90
                              ? 'bg-green-500'
                              : apt.occupancy_rate >= 50
                              ? 'bg-yellow-500'
                              : 'bg-red-500'
                          }`}
                          style={{ width: `${apt.occupancy_rate}%` }}
                        />
                      </div>
                      <span className="text-sm font-medium">{apt.occupancy_rate.toFixed(0)}%</span>
                    </div>
                  </td>
                  <td className="py-3 px-4 text-right font-semibold">
                    ¥{apt.monthly_rent.toLocaleString()}
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
