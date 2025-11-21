'use client';

import React, { useMemo } from 'react';
import { differenceInDays, getDaysInMonth, startOfMonth, endOfMonth } from 'date-fns';
import { CalculatorIcon } from '@heroicons/react/24/outline';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

interface RentCalculatorProps {
  baseRent: number;
  startDate: Date;
  endDate?: Date;
  managementFee?: number;
  showFormula?: boolean;
}

export function RentCalculator({
  baseRent,
  startDate,
  endDate,
  managementFee = 0,
  showFormula = true,
}: RentCalculatorProps) {
  const calculation = useMemo(() => {
    if (!startDate) {
      return null;
    }

    const monthStart = startOfMonth(startDate);
    const monthEnd = endOfMonth(startDate);
    const daysInMonth = getDaysInMonth(startDate);

    // Calculate days occupied
    const actualStartDate = startDate;
    const actualEndDate = endDate || monthEnd;

    // Ensure dates are within the same month for prorated calculation
    const effectiveStartDate = actualStartDate > monthStart ? actualStartDate : monthStart;
    const effectiveEndDate = actualEndDate < monthEnd ? actualEndDate : monthEnd;

    const daysOccupied = differenceInDays(effectiveEndDate, effectiveStartDate) + 1; // +1 to include both start and end dates

    // Calculate daily rate
    const dailyRate = baseRent / daysInMonth;

    // Calculate prorated rent
    const proratedRent = dailyRate * daysOccupied;

    // Determine if it's prorated
    const isProrated = daysOccupied < daysInMonth;

    // Calculate total with management fee
    const totalRent = proratedRent + managementFee;

    // Formula
    const formula = isProrated
      ? `(¥${baseRent.toLocaleString()} / ${daysInMonth} días) × ${daysOccupied} días`
      : `¥${baseRent.toLocaleString()} (mes completo)`;

    return {
      baseRent,
      daysInMonth,
      daysOccupied,
      dailyRate,
      proratedRent,
      managementFee,
      totalRent,
      isProrated,
      formula,
    };
  }, [baseRent, startDate, endDate, managementFee]);

  if (!calculation) {
    return null;
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-base">
            <CalculatorIcon className="h-5 w-5" />
            Cálculo de Renta
          </CardTitle>
          {calculation.isProrated && (
            <Badge variant="secondary">Prorrateado</Badge>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Base Information */}
        <div className="grid grid-cols-2 gap-3 text-sm">
          <div>
            <span className="text-muted-foreground">Renta Base</span>
            <p className="font-medium">¥{calculation.baseRent.toLocaleString()}</p>
          </div>
          <div>
            <span className="text-muted-foreground">Días del Mes</span>
            <p className="font-medium">{calculation.daysInMonth} días</p>
          </div>
          <div>
            <span className="text-muted-foreground">Días Ocupados</span>
            <p className="font-medium">{calculation.daysOccupied} días</p>
          </div>
          <div>
            <span className="text-muted-foreground">Tarifa Diaria</span>
            <p className="font-medium">¥{calculation.dailyRate.toFixed(2)}</p>
          </div>
        </div>

        {/* Formula */}
        {showFormula && (
          <div className="p-3 bg-muted rounded text-sm">
            <span className="text-muted-foreground font-medium">Fórmula:</span>
            <p className="mt-1 font-mono">{calculation.formula}</p>
          </div>
        )}

        {/* Prorated Rent */}
        <div className="pt-3 border-t space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">
              {calculation.isProrated ? 'Renta Prorrateada' : 'Renta Completa'}
            </span>
            <span className="font-medium">¥{calculation.proratedRent.toFixed(2)}</span>
          </div>

          {calculation.managementFee > 0 && (
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Cuota de Administración</span>
              <span className="font-medium">+¥{calculation.managementFee.toLocaleString()}</span>
            </div>
          )}

          {/* Total */}
          <div className="flex items-center justify-between text-base font-bold pt-2 border-t">
            <span>Total Renta</span>
            <span className="text-lg text-primary">
              ¥{Math.round(calculation.totalRent).toLocaleString()}
            </span>
          </div>
        </div>

        {/* Info Message */}
        {calculation.isProrated && (
          <div className="text-xs text-muted-foreground p-2 bg-blue-50 dark:bg-blue-950/20 rounded border border-blue-200 dark:border-blue-800">
            La renta ha sido calculada de forma prorrateada según los días ocupados en el mes.
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export default RentCalculator;
