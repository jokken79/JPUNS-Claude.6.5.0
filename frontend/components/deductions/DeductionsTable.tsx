'use client';

import React from 'react';
import { CurrencyYenIcon, CalendarIcon, BuildingOfficeIcon, UserGroupIcon } from '@heroicons/react/24/outline';

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

interface DeductionsTableProps {
  deductions: Deduction[];
  isLoading?: boolean;
  onViewDetails?: (deduction: Deduction) => void;
}

export function DeductionsTable({ deductions, isLoading, onViewDetails }: DeductionsTableProps) {
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  if (isLoading) {
    return (
      <div className="p-8 text-center text-muted-foreground">
        Cargando deducciones...
      </div>
    );
  }

  if (deductions.length === 0) {
    return (
      <div className="p-8 text-center text-muted-foreground">
        No se encontraron deducciones.
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full">
        <thead>
          <tr className="border-b">
            <th className="text-left py-3 px-4">Empleado</th>
            <th className="text-left py-3 px-4">Apartamento</th>
            <th className="text-left py-3 px-4">Tipo</th>
            <th className="text-left py-3 px-4">Fecha</th>
            <th className="text-left py-3 px-4">Motivo</th>
            <th className="text-right py-3 px-4">Monto</th>
          </tr>
        </thead>
        <tbody>
          {deductions.map((deduction) => (
            <tr
              key={deduction.id}
              className="border-b hover:bg-accent transition-colors"
              onClick={() => onViewDetails && onViewDetails(deduction)}
            >
              <td className="py-3 px-4">
                <div className="flex items-center gap-2">
                  <UserGroupIcon className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="font-medium">{deduction.employee.full_name_kanji}</p>
                    <p className="text-xs text-muted-foreground">ID: {deduction.employee.hakenmoto_id}</p>
                  </div>
                </div>
              </td>
              <td className="py-3 px-4">
                <div className="flex items-center gap-2">
                  <BuildingOfficeIcon className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="font-medium">{deduction.apartment.apartment_code}</p>
                    <p className="text-xs text-muted-foreground">{deduction.apartment.address}</p>
                  </div>
                </div>
              </td>
              <td className="py-3 px-4">
                <span className="px-2 py-1 text-xs font-medium rounded-full bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400">
                  {deduction.deduction_type}
                </span>
              </td>
              <td className="py-3 px-4">
                <div className="flex items-center gap-2">
                  <CalendarIcon className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm">{formatDate(deduction.deduction_date)}</span>
                </div>
              </td>
              <td className="py-3 px-4">
                <p className="text-sm">{deduction.reason}</p>
              </td>
              <td className="py-3 px-4 text-right">
                <div className="flex items-center justify-end gap-1">
                  <CurrencyYenIcon className="h-4 w-4 text-red-500" />
                  <span className="text-lg font-bold text-red-600">
                    -{deduction.amount.toLocaleString()}
                  </span>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
