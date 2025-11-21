'use client';

import React, { useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import api, { apartmentsV2Service } from '@/lib/api';
import { toast } from 'react-hot-toast';
import {
  ArrowLeftIcon,
  CalendarIcon,
  CurrencyYenIcon,
  BuildingOfficeIcon,
  UserGroupIcon,
  DocumentTextIcon,
  DocumentArrowDownIcon,
} from '@heroicons/react/24/outline';

interface Deduction {
  id: number;
  employee_id: number;
  apartment_id: number;
  deduction_type: string;
  amount: number;
  deduction_date: string;
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

export default function DeductionsByMonthPage() {
  const router = useRouter();
  const params = useParams();
  const year = params.year as string;
  const month = params.month as string;
  const [exporting, setExporting] = useState(false);

  // Fetch deductions
  const { data: deductions = [], isLoading, error } = useQuery({
    queryKey: ['rent-deductions-by-month', year, month],
    queryFn: async () => {
      const response = await api.get(`/rent-deductions/?year=${year}&month=${month}`);
      return response.data as Deduction[];
    },
  });

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const totalAmount = deductions.reduce((sum, d) => sum + d.amount, 0);

  // Group by employee
  const groupedByEmployee = deductions.reduce((acc: any, deduction: Deduction) => {
    const key = deduction.employee_id;
    if (!acc[key]) {
      acc[key] = {
        employee: deduction.employee,
        deductions: [],
        total: 0,
      };
    }
    acc[key].deductions.push(deduction);
    acc[key].total += deduction.amount;
    return acc;
  }, {});

  const employees = Object.values(groupedByEmployee);

  const handleExport = async () => {
    try {
      setExporting(true);

      const blob = await apartmentsV2Service.exportDeductions(parseInt(year), parseInt(month));

      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `deducciones-renta-${year}-${month}.csv`;
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
      <div className="flex items-center gap-4">
        <button
          onClick={() => router.back()}
          className="p-2 hover:bg-accent rounded-lg transition-colors"
        >
          <ArrowLeftIcon className="h-5 w-5" />
        </button>
        <div className="flex-1">
          <h1 className="text-3xl font-bold">
            Deducciones - {new Date(parseInt(year), parseInt(month) - 1).toLocaleDateString('es-ES', {
              year: 'numeric',
              month: 'long',
            })}
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Detalle de deducciones de renta por empleado
          </p>
        </div>
        <button
          onClick={handleExport}
          disabled={exporting}
          className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <DocumentArrowDownIcon className="h-5 w-5" />
          {exporting ? 'Exportando...' : 'Exportar'}
        </button>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-card border rounded-lg p-6">
          <div className="flex items-center gap-3 mb-2">
            <CalendarIcon className="h-6 w-6 text-blue-500" />
            <div>
              <p className="text-sm text-muted-foreground">Período</p>
              <p className="font-semibold">
                {new Date(parseInt(year), parseInt(month) - 1).toLocaleDateString('es-ES', {
                  year: 'numeric',
                  month: 'long',
                })}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-card border rounded-lg p-6">
          <div className="flex items-center gap-3 mb-2">
            <UserGroupIcon className="h-6 w-6 text-green-500" />
            <div>
              <p className="text-sm text-muted-foreground">Empleados</p>
              <p className="font-semibold text-2xl">{employees.length}</p>
            </div>
          </div>
        </div>

        <div className="bg-card border rounded-lg p-6">
          <div className="flex items-center gap-3 mb-2">
            <CurrencyYenIcon className="h-6 w-6 text-red-500" />
            <div>
              <p className="text-sm text-muted-foreground">Total Deducido</p>
              <p className="font-semibold text-2xl text-red-600">-¥{totalAmount.toLocaleString()}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Deductions by Employee */}
      <div className="bg-card border rounded-lg">
        <div className="p-4 border-b">
          <h2 className="font-semibold">Deducciones por Empleado</h2>
        </div>

        {isLoading && (
          <div className="p-8 text-center text-muted-foreground">
            Cargando deducciones...
          </div>
        )}

        {error && (
          <div className="p-8 text-center text-red-500">
            Error al cargar las deducciones. Por favor, intenta de nuevo.
          </div>
        )}

        {!isLoading && !error && deductions.length === 0 && (
          <div className="p-8 text-center text-muted-foreground">
            No se encontraron deducciones para este período.
          </div>
        )}

        {!isLoading && !error && employees.length > 0 && (
          <div className="divide-y">
            {employees.map((group: any) => (
              <div key={group.employee.id} className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h3 className="font-semibold text-lg">{group.employee.full_name_kanji}</h3>
                    <p className="text-sm text-muted-foreground">ID: {group.employee.hakenmoto_id}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-muted-foreground">Total Deducido</p>
                    <p className="text-2xl font-bold text-red-600">-¥{group.total.toLocaleString()}</p>
                  </div>
                </div>

                <div className="space-y-3">
                  {group.deductions.map((deduction: Deduction) => (
                    <div
                      key={deduction.id}
                      className="bg-muted rounded-lg p-4"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <span className="px-2 py-1 text-xs font-medium rounded-full bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400">
                              {deduction.deduction_type}
                            </span>
                            <span className="text-sm text-muted-foreground">
                              {formatDate(deduction.deduction_date)}
                            </span>
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                            <div className="flex items-center gap-2">
                              <BuildingOfficeIcon className="h-4 w-4 text-muted-foreground" />
                              <div>
                                <p className="text-muted-foreground">Apartamento:</p>
                                <p className="font-medium">{deduction.apartment.apartment_code}</p>
                                <p className="text-xs text-muted-foreground">{deduction.apartment.address}</p>
                              </div>
                            </div>

                            <div>
                              <p className="text-muted-foreground">Motivo:</p>
                              <p className="font-medium">{deduction.reason}</p>
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
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Summary Table */}
      {employees.length > 0 && (
        <div className="bg-card border rounded-lg p-6">
          <h2 className="text-xl font-semibold mb-4">Resumen por Empleado</h2>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-3 px-4">Empleado</th>
                  <th className="text-left py-3 px-4">ID</th>
                  <th className="text-left py-3 px-4">Deducciones</th>
                  <th className="text-right py-3 px-4">Total</th>
                </tr>
              </thead>
              <tbody>
                {employees.map((group: any) => (
                  <tr key={group.employee.id} className="border-b hover:bg-accent">
                    <td className="py-3 px-4 font-medium">{group.employee.full_name_kanji}</td>
                    <td className="py-3 px-4 text-muted-foreground">{group.employee.hakenmoto_id}</td>
                    <td className="py-3 px-4 text-muted-foreground">{group.deductions.length}</td>
                    <td className="py-3 px-4 text-right font-bold text-red-600">
                      -¥{group.total.toLocaleString()}
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="border-t-2">
                  <td colSpan={2} className="py-3 px-4 font-semibold">Total</td>
                  <td className="py-3 px-4 font-semibold">{deductions.length}</td>
                  <td className="py-3 px-4 text-right font-bold text-red-600 text-lg">
                    -¥{totalAmount.toLocaleString()}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
