'use client';

import React, { useState, useEffect } from 'react';
import { CalculatorIcon, InformationCircleIcon } from '@heroicons/react/24/outline';

interface ProratedCalculatorProps {
  apartment?: {
    id: number;
    apartment_code: string;
    address: string;
    monthly_rent: number;
  };
  onCalculate?: (result: ProratedResult) => void;
}

interface ProratedResult {
  total_days: number;
  occupied_days: number;
  daily_rate: number;
  base_amount: number;
  calculated_amount: number;
  percentage: number;
}

export function ProratedCalculator({ apartment, onCalculate }: ProratedCalculatorProps) {
  const [form, setForm] = useState({
    start_date: new Date().toISOString().split('T')[0],
    end_date: new Date().toISOString().split('T')[0],
    daily_rate: apartment?.monthly_rent ? Math.round(apartment.monthly_rent / 30) : 0,
  });

  const [result, setResult] = useState<ProratedResult | null>(null);

  useEffect(() => {
    if (apartment) {
      setForm(prev => ({
        ...prev,
        daily_rate: Math.round(apartment.monthly_rent / 30),
      }));
    }
  }, [apartment]);

  const calculate = () => {
    const start = new Date(form.start_date);
    const end = new Date(form.end_date);
    const totalDays = Math.floor((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1;
    const dailyRate = form.daily_rate;
    const baseAmount = dailyRate * 30;
    const calculatedAmount = dailyRate * totalDays;
    const percentage = (calculatedAmount / baseAmount) * 100;

    const calculationResult: ProratedResult = {
      total_days: 30,
      occupied_days: totalDays,
      daily_rate: dailyRate,
      base_amount: baseAmount,
      calculated_amount: calculatedAmount,
      percentage,
    };

    setResult(calculationResult);
    if (onCalculate) {
      onCalculate(calculationResult);
    }
  };

  const handleChange = (field: string, value: string | number) => {
    setForm(prev => ({ ...prev, [field]: value }));
  };

  return (
    <div className="space-y-4">
      {/* Info Box */}
      <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
        <div className="flex items-start gap-3">
          <InformationCircleIcon className="h-6 w-6 text-blue-600 mt-0.5" />
          <div>
            <h3 className="font-semibold text-blue-800">Calculadora de Prorrateo</h3>
            <p className="text-sm text-blue-700 mt-1">
              Fórmula: (Renta Mensual ÷ 30) × Días Ocupados
            </p>
          </div>
        </div>
      </div>

      {/* Form */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div>
          <label className="block text-sm font-medium mb-2">Fecha Inicio</label>
          <input
            type="date"
            value={form.start_date}
            onChange={(e) => handleChange('start_date', e.target.value)}
            className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">Fecha Fin</label>
          <input
            type="date"
            value={form.end_date}
            onChange={(e) => handleChange('end_date', e.target.value)}
            min={form.start_date}
            className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">Tarifa Diaria (¥)</label>
          <input
            type="number"
            value={form.daily_rate}
            onChange={(e) => handleChange('daily_rate', Number(e.target.value))}
            className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
          />
        </div>
      </div>

      <button
        onClick={calculate}
        className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
      >
        <CalculatorIcon className="h-5 w-5" />
        Calcular
      </button>

      {/* Result */}
      {result && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-6">
          <h3 className="font-semibold text-green-800 mb-3">Resultado</h3>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-green-700">Días en Período</p>
              <p className="text-2xl font-bold">{result.occupied_days}</p>
            </div>
            <div>
              <p className="text-sm text-green-700">Monto a Cobrar</p>
              <p className="text-2xl font-bold">¥{result.calculated_amount.toLocaleString()}</p>
            </div>
            <div>
              <p className="text-sm text-green-700">Tarifa Diaria</p>
              <p className="text-lg font-semibold">¥{result.daily_rate.toLocaleString()}</p>
            </div>
            <div>
              <p className="text-sm text-green-700">Porcentaje</p>
              <p className="text-lg font-semibold">{result.percentage.toFixed(1)}%</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
