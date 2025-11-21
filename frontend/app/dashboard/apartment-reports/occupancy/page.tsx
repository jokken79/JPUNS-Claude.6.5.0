'use client';

import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { apartmentsV2Service } from '@/lib/api';
import {
  ArrowLeftIcon,
  UserGroupIcon,
  BuildingOfficeIcon,
  CalendarIcon,
  ChartBarIcon,
  ArrowTrendingUpIcon,
  ArrowTrendingDownIcon,
} from '@heroicons/react/24/outline';

interface OccupancyData {
  summary: {
    total_apartments: number;
    total_capacity: number;
    total_occupied: number;
    available_spaces: number;
    occupancy_rate: number;
    previous_period_rate: number;
  };
  by_apartment: {
    id: number;
    apartment_code: string;
    address: string;
    capacity: number;
    occupied: number;
    occupancy_rate: number;
    status: string;
    monthly_rent: number;
  }[];
  trends: {
    date: string;
    occupancy_rate: number;
    occupied_units: number;
    available_units: number;
  }[];
  by_status: {
    status: string;
    count: number;
    capacity: number;
    occupied: number;
  }[];
}

export default function OccupancyReportPage() {
  const [selectedPeriod, setSelectedPeriod] = useState('3months');
  const [selectedStatus, setSelectedStatus] = useState<string>('');

  // Fetch occupancy data
  const { data: report, isLoading } = useQuery({
    queryKey: ['apartment-occupancy-report', selectedPeriod, selectedStatus],
    queryFn: async () => {
      return await apartmentsV2Service.getOccupancyReport();
    },
  });

  if (isLoading || !report) {
    return (
      <div className="p-6">
        <div className="text-center py-12">Cargando reporte de ocupación...</div>
      </div>
    );
  }

  const rateChange = report.summary.occupancy_rate - report.summary.previous_period_rate;
  const isIncreasing = rateChange >= 0;

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
          <h1 className="text-3xl font-bold">Reporte de Ocupación</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Análisis detallado de la ocupación de apartamentos
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
            <label className="block text-sm font-medium mb-2">Estado</label>
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
            >
              <option value="">Todos los estados</option>
              <option value="disponible">Disponible</option>
              <option value="parcial">Parcial</option>
              <option value="lleno">Lleno</option>
            </select>
          </div>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-card border rounded-lg p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Total Apartamentos</p>
              <p className="text-3xl font-bold mt-1">{report.summary.total_apartments}</p>
            </div>
            <BuildingOfficeIcon className="h-12 w-12 text-blue-500" />
          </div>
        </div>

        <div className="bg-card border rounded-lg p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Capacidad Total</p>
              <p className="text-3xl font-bold mt-1">{report.summary.total_capacity}</p>
              <p className="text-xs text-muted-foreground mt-1">personas</p>
            </div>
            <UserGroupIcon className="h-12 w-12 text-green-500" />
          </div>
        </div>

        <div className="bg-card border rounded-lg p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Ocupación Actual</p>
              <p className="text-3xl font-bold mt-1">{report.summary.total_occupied}</p>
              <p className="text-xs text-muted-foreground mt-1">
                {report.summary.available_spaces} disponibles
              </p>
            </div>
            <UserGroupIcon className="h-12 w-12 text-purple-500" />
          </div>
        </div>

        <div className="bg-card border rounded-lg p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Tasa de Ocupación</p>
              <p className="text-3xl font-bold mt-1">{report.summary.occupancy_rate.toFixed(1)}%</p>
              <div className="flex items-center gap-1 mt-1">
                {isIncreasing ? (
                  <ArrowTrendingUpIcon className="h-4 w-4 text-green-500" />
                ) : (
                  <ArrowTrendingDownIcon className="h-4 w-4 text-red-500" />
                )}
                <span className={`text-xs ${isIncreasing ? 'text-green-500' : 'text-red-500'}`}>
                  {Math.abs(rateChange).toFixed(1)}% vs anterior
                </span>
              </div>
            </div>
            <ChartBarIcon className="h-12 w-12 text-yellow-500" />
          </div>
        </div>
      </div>

      {/* Trends Chart */}
      <div className="bg-card border rounded-lg p-6">
        <h2 className="text-xl font-semibold mb-4">Tendencia de Ocupación</h2>
        <div className="space-y-4">
          {report.trends.map((trend, index) => (
            <div key={index} className="relative">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <CalendarIcon className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm font-medium">
                    {new Date(trend.date).toLocaleDateString('es-ES', {
                      month: 'long',
                      year: 'numeric',
                    })}
                  </span>
                </div>
                <span className="text-sm font-semibold">{trend.occupancy_rate.toFixed(1)}%</span>
              </div>
              <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3">
                <div
                  className="bg-gradient-to-r from-blue-500 to-purple-500 h-3 rounded-full transition-all duration-500"
                  style={{ width: `${trend.occupancy_rate}%` }}
                />
              </div>
              <div className="flex justify-between text-xs text-muted-foreground mt-1">
                <span>Ocupados: {trend.occupied_units}</span>
                <span>Disponibles: {trend.available_units}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* By Status */}
      <div className="bg-card border rounded-lg p-6">
        <h2 className="text-xl font-semibold mb-4">Ocupación por Estado</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {report.by_status.map((item) => (
            <div key={item.status} className="border rounded-lg p-4">
              <div className="flex items-center gap-3 mb-3">
                <div
                  className={`h-4 w-4 rounded-full ${
                    item.status === 'disponible'
                      ? 'bg-green-500'
                      : item.status === 'parcial'
                      ? 'bg-yellow-500'
                      : 'bg-red-500'
                  }`}
                />
                <h3 className="font-semibold">
                  {item.status === 'disponible' ? 'Disponible' :
                   item.status === 'parcial' ? 'Parcial' : 'Lleno'}
                </h3>
              </div>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Apartamentos:</span>
                  <span className="font-medium">{item.count}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Capacidad:</span>
                  <span className="font-medium">{item.capacity}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Ocupados:</span>
                  <span className="font-medium">{item.occupied}</span>
                </div>
                <div className="pt-2 border-t flex justify-between">
                  <span className="text-muted-foreground">Tasa:</span>
                  <span className="font-semibold">
                    {((item.occupied / item.capacity) * 100).toFixed(1)}%
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Detailed Table */}
      <div className="bg-card border rounded-lg p-6">
        <h2 className="text-xl font-semibold mb-4">Detalle por Apartamento</h2>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b">
                <th className="text-left py-3 px-4">Apartamento</th>
                <th className="text-left py-3 px-4">Dirección</th>
                <th className="text-left py-3 px-4">Estado</th>
                <th className="text-center py-3 px-4">Capacidad</th>
                <th className="text-center py-3 px-4">Ocupados</th>
                <th className="text-center py-3 px-4">Ocupación</th>
                <th className="text-right py-3 px-4">Renta</th>
              </tr>
            </thead>
            <tbody>
              {report.by_apartment.map((apt) => (
                <tr key={apt.id} className="border-b hover:bg-accent">
                  <td className="py-3 px-4 font-medium">{apt.apartment_code}</td>
                  <td className="py-3 px-4 text-muted-foreground">{apt.address}</td>
                  <td className="py-3 px-4">
                    <span
                      className={`px-2 py-1 text-xs font-medium rounded-full ${
                        apt.status === 'disponible'
                          ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
                          : apt.status === 'parcial'
                          ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400'
                          : 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400'
                      }`}
                    >
                      {apt.status === 'disponible' ? 'Disponible' :
                       apt.status === 'parcial' ? 'Parcial' : 'Lleno'}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-center">{apt.capacity}</td>
                  <td className="py-3 px-4 text-center">{apt.occupied}</td>
                  <td className="py-3 px-4 text-center">
                    <div className="flex items-center gap-2">
                      <div className="w-20 bg-gray-200 dark:bg-gray-700 rounded-full h-2">
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
