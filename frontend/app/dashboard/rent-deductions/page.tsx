'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import api, { apartmentsV2Service } from '@/lib/api';
import { toast } from 'react-hot-toast';
import {
  CalendarIcon,
  CurrencyYenIcon,
  BuildingOfficeIcon,
  UserGroupIcon,
  DocumentArrowDownIcon,
  EyeIcon,
} from '@heroicons/react/24/outline';

interface Deduction {
  id: number;
  employee_id: number;
  apartment_id: number;
  deduction_type: string;
  amount: number;
  deduction_date: string;
  month: string;
  year: number;
  reason: string;
  employee: {
    full_name_kanji: string;
    hakenmoto_id: number;
  };
  apartment: {
    apartment_code: string;
    address: string;
  };
}

interface DeductionStats {
  total_deductions: number;
  total_amount: number;
  this_month: number;
  this_month_amount: number;
  by_type: Record<string, number>;
}

export default function RentDeductionsPage() {
  const router = useRouter();
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [selectedMonth, setSelectedMonth] = useState<number | ''>('');
  const [exporting, setExporting] = useState(false);

  // Fetch deductions
  const { data: deductions = [], isLoading } = useQuery({
    queryKey: ['rent-deductions', { selectedYear, selectedMonth }],
    queryFn: async () => {
      const params = new URLSearchParams();
      params.append('year', String(selectedYear));
      if (selectedMonth) params.append('month', String(selectedMonth));

      const response = await api.get(`/rent-deductions/?${params.toString()}`);
      return response.data as Deduction[];
    },
  });

  // Fetch statistics
  const { data: stats } = useQuery({
    queryKey: ['rent-deductions-stats', selectedYear],
    queryFn: async () => {
      const response = await api.get(`/rent-deductions/stats?year=${selectedYear}`);
      return response.data as DeductionStats;
    },
  });

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const formatMonth = (month: string) => {
    return new Date(parseInt(month.split('-')[0]), parseInt(month.split('-')[1]) - 1)
      .toLocaleDateString('es-ES', { year: 'numeric', month: 'long' });
  };

  const handleExport = async () => {
    if (!selectedMonth) {
      toast.error('Por favor selecciona un mes para exportar');
      return;
    }

    try {
      setExporting(true);

      const blob = await apartmentsV2Service.exportDeductions(selectedYear, Number(selectedMonth));

      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `deducciones-renta-${selectedYear}-${selectedMonth}.csv`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      toast.success('Exportación completada exitosamente');
    } catch (error) {
      console.error('Export error:', error);
      toast.error('Error al exportar las deducciones');
    } finally {
      setExporting(false);
    }
  };

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Deducciones de Renta</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Visualiza las deducciones de renta por mes y empleado
          </p>
        </div>
        <button
          onClick={handleExport}
          disabled={exporting || !selectedMonth}
          className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <DocumentArrowDownIcon className="h-5 w-5" />
          {exporting ? 'Exportando...' : 'Exportar'}
        </button>
      </div>

      {/* Statistics Cards */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-card border rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Deducciones</p>
                <p className="text-2xl font-bold mt-1">{stats.total_deductions}</p>
              </div>
              <CurrencyYenIcon className="h-8 w-8 text-blue-500" />
            </div>
          </div>

          <div className="bg-card border rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Monto Total</p>
                <p className="text-2xl font-bold mt-1">¥{stats.total_amount.toLocaleString()}</p>
              </div>
              <CurrencyYenIcon className="h-8 w-8 text-green-500" />
            </div>
          </div>

          <div className="bg-card border rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Este Mes</p>
                <p className="text-2xl font-bold mt-1 text-purple-600">{stats.this_month}</p>
              </div>
              <CalendarIcon className="h-8 w-8 text-purple-500" />
            </div>
          </div>

          <div className="bg-card border rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Monto del Mes</p>
                <p className="text-2xl font-bold mt-1">¥{stats.this_month_amount.toLocaleString()}</p>
              </div>
              <CalendarIcon className="h-8 w-8 text-yellow-500" />
            </div>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="bg-card border rounded-lg p-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium mb-2">Año</label>
            <input
              type="number"
              value={selectedYear}
              onChange={(e) => setSelectedYear(Number(e.target.value))}
              min="2020"
              max="2030"
              className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Mes</label>
            <select
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value ? Number(e.target.value) : '')}
              className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
            >
              <option value="">Todos los meses</option>
              {Array.from({ length: 12 }, (_, i) => (
                <option key={i + 1} value={i + 1}>
                  {i + 1}
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-end">
            <button
              onClick={() => {
                setSelectedYear(new Date().getFullYear());
                setSelectedMonth('');
              }}
              className="w-full px-4 py-2 border rounded-lg hover:bg-accent transition-colors"
            >
              Limpiar
            </button>
          </div>
        </div>
      </div>

      {/* Deductions by Month */}
      {selectedMonth ? (
        <DeductionsByMonth
          year={selectedYear}
          month={selectedMonth}
          deductions={deductions}
          isLoading={isLoading}
        />
      ) : (
        <DeductionsByYear
          year={selectedYear}
          deductions={deductions}
          isLoading={isLoading}
        />
      )}
    </div>
  );
}

function DeductionsByYear({ year, deductions, isLoading }: any) {
  const router = useRouter();
  const groupedByMonth = deductions.reduce((acc: any, deduction: any) => {
    const key = `${deduction.year}-${deduction.month}`;
    if (!acc[key]) {
      acc[key] = [];
    }
    acc[key].push(deduction);
    return acc;
  }, {});

  const months = Object.keys(groupedByMonth).sort().reverse();

  return (
    <div className="bg-card border rounded-lg">
      <div className="p-4 border-b">
        <h2 className="font-semibold">Deducciones por Mes - {year}</h2>
      </div>

      {isLoading && (
        <div className="p-8 text-center text-muted-foreground">
          Cargando deducciones...
        </div>
      )}

      {!isLoading && months.length === 0 && (
        <div className="p-8 text-center text-muted-foreground">
          No se encontraron deducciones para este año.
        </div>
      )}

      {!isLoading && months.length > 0 && (
        <div className="divide-y">
          {months.map((month) => {
            const monthDeductions = groupedByMonth[month];
            const totalAmount = monthDeductions.reduce((sum: number, d: any) => sum + d.amount, 0);
            const [y, m] = month.split('-');

            return (
              <div
                key={month}
                className="p-4 hover:bg-accent cursor-pointer transition-colors"
                onClick={() => router.push(`/rent-deductions/${y}/${m}`)}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-semibold">
                      {new Date(parseInt(y), parseInt(m) - 1).toLocaleDateString('es-ES', {
                        year: 'numeric',
                        month: 'long',
                      })}
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      {monthDeductions.length} deducciones
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-2xl font-bold text-red-600">
                      -¥{totalAmount.toLocaleString()}
                    </p>
                    <p className="text-sm text-muted-foreground flex items-center gap-1">
                      <EyeIcon className="h-4 w-4" />
                      Ver detalle
                    </p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

function DeductionsByMonth({ year, month, deductions, isLoading }: any) {
  const totalAmount = deductions.reduce((sum: number, d: any) => sum + d.amount, 0);

  return (
    <div className="bg-card border rounded-lg">
      <div className="p-4 border-b flex items-center justify-between">
        <h2 className="font-semibold">
          Deducciones - {new Date(year, month - 1).toLocaleDateString('es-ES', {
            year: 'numeric',
            month: 'long',
          })}
        </h2>
        <div className="text-right">
          <p className="text-sm text-muted-foreground">Total de Deducciones</p>
          <p className="text-2xl font-bold text-red-600">-¥{totalAmount.toLocaleString()}</p>
        </div>
      </div>

      {isLoading && (
        <div className="p-8 text-center text-muted-foreground">
          Cargando deducciones...
        </div>
      )}

      {!isLoading && deductions.length === 0 && (
        <div className="p-8 text-center text-muted-foreground">
          No se encontraron deducciones para este mes.
        </div>
      )}

      {!isLoading && deductions.length > 0 && (
        <div className="divide-y">
          {deductions.map((deduction: any) => (
            <div key={deduction.id} className="p-4 hover:bg-accent transition-colors">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="font-semibold">{deduction.employee.full_name_kanji}</h3>
                    <span className="px-2 py-1 text-xs font-medium rounded-full bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400">
                      {deduction.deduction_type}
                    </span>
                    <span className="text-sm text-muted-foreground">
                      ID: {deduction.employee.hakenmoto_id}
                    </span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-muted-foreground">
                    <div>
                      <span>Apartamento: </span>
                      <span className="font-medium">{deduction.apartment.apartment_code}</span>
                    </div>
                    <div>
                      <span>Fecha: </span>
                      <span className="font-medium">{new Date(deduction.deduction_date).toLocaleDateString('es-ES')}</span>
                    </div>
                    <div>
                      <span>Motivo: </span>
                      <span className="font-medium">{deduction.reason}</span>
                    </div>
                  </div>
                </div>

                <div className="text-right ml-4">
                  <p className="text-xl font-bold text-red-600">
                    -¥{deduction.amount.toLocaleString()}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
