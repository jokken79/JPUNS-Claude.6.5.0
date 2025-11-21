'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import api from '@/lib/api';
import {
  CalculatorIcon,
  CalendarIcon,
  CurrencyYenIcon,
  BuildingOfficeIcon,
  UserGroupIcon,
  ArrowRightIcon,
} from '@heroicons/react/24/outline';

interface Calculation {
  id: number;
  apartment_id: number;
  calculation_type: 'prorated' | 'total' | 'partial';
  period_start: string;
  period_end: string;
  base_amount: number;
  calculated_amount: number;
  days_in_period: number;
  days_occupied: number;
  apartment: {
    apartment_code: string;
    address: string;
  };
}

interface CalculationStats {
  total_calculations: number;
  this_month: number;
  total_amount: number;
  average_amount: number;
}

export default function ApartmentCalculationsPage() {
  const router = useRouter();
  const [selectedMonth, setSelectedMonth] = useState(
    new Date().toISOString().slice(0, 7)
  );
  const [calculationType, setCalculationType] = useState<string>('');

  // Fetch calculations
  const { data: calculations = [], isLoading } = useQuery({
    queryKey: ['apartment-calculations', { selectedMonth, calculationType }],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (selectedMonth) params.append('month', selectedMonth);
      if (calculationType) params.append('type', calculationType);

      const response = await api.get(`/apartment-calculations/?${params.toString()}`);
      return response.data as Calculation[];
    },
  });

  // Fetch statistics
  const { data: stats } = useQuery({
    queryKey: ['apartment-calculations-stats'],
    queryFn: async () => {
      const response = await api.get('/apartment-calculations/stats');
      return response.data as CalculationStats;
    },
  });

  // Get unique months for filter
  const months = React.useMemo(() => {
    const unique = new Set(calculations.map(c => c.period_start.slice(0, 7)));
    return Array.from(unique).sort().reverse();
  }, [calculations]);

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Cálculos de Apartamentos</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Gestiona los cálculos de prorrateos y totales de rentas
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => router.push('/apartment-calculations/prorated')}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <CalculatorIcon className="h-5 w-5" />
            Calcular Prorrateo
          </button>
          <button
            onClick={() => router.push('/apartment-calculations/total')}
            className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
          >
            <CurrencyYenIcon className="h-5 w-5" />
            Calcular Total
          </button>
        </div>
      </div>

      {/* Statistics Cards */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-card border rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Cálculos</p>
                <p className="text-2xl font-bold mt-1">{stats.total_calculations}</p>
              </div>
              <CalculatorIcon className="h-8 w-8 text-blue-500" />
            </div>
          </div>

          <div className="bg-card border rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Este Mes</p>
                <p className="text-2xl font-bold mt-1 text-green-600">{stats.this_month}</p>
              </div>
              <CalendarIcon className="h-8 w-8 text-green-500" />
            </div>
          </div>

          <div className="bg-card border rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Monto Total</p>
                <p className="text-2xl font-bold mt-1">¥{stats.total_amount.toLocaleString()}</p>
              </div>
              <CurrencyYenIcon className="h-8 w-8 text-purple-500" />
            </div>
          </div>

          <div className="bg-card border rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Promedio</p>
                <p className="text-2xl font-bold mt-1">¥{stats.average_amount.toLocaleString()}</p>
              </div>
              <BuildingOfficeIcon className="h-8 w-8 text-yellow-500" />
            </div>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="bg-card border rounded-lg p-4">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1">
            <label className="block text-sm font-medium mb-2">Mes</label>
            <input
              type="month"
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
              className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>

          <div className="flex-1">
            <label className="block text-sm font-medium mb-2">Tipo de Cálculo</label>
            <select
              value={calculationType}
              onChange={(e) => setCalculationType(e.target.value)}
              className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
            >
              <option value="">Todos los tipos</option>
              <option value="prorated">Prorrateo</option>
              <option value="total">Total</option>
              <option value="partial">Parcial</option>
            </select>
          </div>

          <div className="flex items-end">
            <button
              onClick={() => {
                setSelectedMonth(new Date().toISOString().slice(0, 7));
                setCalculationType('');
              }}
              className="px-4 py-2 border rounded-lg hover:bg-accent transition-colors"
            >
              Limpiar
            </button>
          </div>
        </div>
      </div>

      {/* Calculations List */}
      <div className="bg-card border rounded-lg">
        <div className="p-4 border-b">
          <h2 className="font-semibold">
            Cálculos ({calculations.length})
          </h2>
        </div>

        {isLoading && (
          <div className="p-8 text-center text-muted-foreground">
            Cargando cálculos...
          </div>
        )}

        {!isLoading && calculations.length === 0 && (
          <div className="p-8 text-center text-muted-foreground">
            No se encontraron cálculos para los filtros seleccionados.
          </div>
        )}

        {!isLoading && calculations.length > 0 && (
          <div className="divide-y">
            {calculations.map((calc) => (
              <div key={calc.id} className="p-4 hover:bg-accent transition-colors">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="font-semibold">{calc.apartment.apartment_code}</h3>
                      <span className="px-2 py-1 text-xs font-medium rounded-full bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400">
                        {calc.calculation_type === 'prorated' ? 'Prorrateo' :
                         calc.calculation_type === 'total' ? 'Total' : 'Parcial'}
                      </span>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                      <div>
                        <p className="text-muted-foreground">Apartamento:</p>
                        <p className="font-medium">{calc.apartment.address}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Período:</p>
                        <p className="font-medium">
                          {new Date(calc.period_start).toLocaleDateString('es-ES')} - {' '}
                          {new Date(calc.period_end).toLocaleDateString('es-ES')}
                        </p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Ocupación:</p>
                        <p className="font-medium">
                          {calc.days_occupied}/{calc.days_in_period} días
                        </p>
                      </div>
                    </div>

                    <div className="mt-3 flex items-center gap-6 text-sm">
                      <div>
                        <p className="text-muted-foreground">Monto Base:</p>
                        <p className="font-medium">¥{calc.base_amount.toLocaleString()}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Monto Calculado:</p>
                        <p className="font-medium text-lg text-green-600">¥{calc.calculated_amount.toLocaleString()}</p>
                      </div>
                      {calc.calculation_type === 'prorated' && (
                        <div>
                          <p className="text-muted-foreground">Porcentaje:</p>
                          <p className="font-medium">
                            {((calc.calculated_amount / calc.base_amount) * 100).toFixed(1)}%
                          </p>
                        </div>
                      )}
                    </div>
                  </div>

                  <ArrowRightIcon className="h-5 w-5 text-muted-foreground ml-4" />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-card border rounded-lg p-6">
          <div className="flex items-center gap-3 mb-3">
            <div className="h-12 w-12 bg-blue-100 rounded-lg flex items-center justify-center">
              <CalculatorIcon className="h-6 w-6 text-blue-600" />
            </div>
            <div>
              <h3 className="font-semibold">Cálculo de Prorrateo</h3>
              <p className="text-sm text-muted-foreground">Calcula renta proporcional por días</p>
            </div>
          </div>
          <button
            onClick={() => router.push('/apartment-calculations/prorated')}
            className="w-full mt-3 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Ir a Prorrateo
          </button>
        </div>

        <div className="bg-card border rounded-lg p-6">
          <div className="flex items-center gap-3 mb-3">
            <div className="h-12 w-12 bg-green-100 rounded-lg flex items-center justify-center">
              <CurrencyYenIcon className="h-6 w-6 text-green-600" />
            </div>
            <div>
              <h3 className="font-semibold">Cálculo de Total</h3>
              <p className="text-sm text-muted-foreground">Calcula monto total por período</p>
            </div>
          </div>
          <button
            onClick={() => router.push('/apartment-calculations/total')}
            className="w-full mt-3 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
          >
            Ir a Total
          </button>
        </div>
      </div>
    </div>
  );
}
