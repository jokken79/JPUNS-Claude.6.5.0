'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useMutation } from '@tanstack/react-query';
import { toast } from 'react-hot-toast';
import { apartmentsV2Service } from '@/lib/api';
import type { ProratedCalculationRequest, ProratedCalculationResponse } from '@/types/apartments-v2';
import {
  ArrowLeftIcon,
  CalculatorIcon,
  CalendarIcon,
  CurrencyYenIcon,
  InformationCircleIcon,
  ClipboardDocumentIcon,
} from '@heroicons/react/24/outline';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

interface FormData {
  monthly_rent: string;
  start_date: string;
  end_date: string;
}

export default function ProratedCalculatorPage() {
  const router = useRouter();
  const [form, setForm] = useState<FormData>({
    monthly_rent: '50000',
    start_date: '',
    end_date: '',
  });
  const [result, setResult] = useState<ProratedCalculationResponse | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Calculate mutation
  const calculateMutation = useMutation({
    mutationFn: async (data: ProratedCalculationRequest) => {
      return await apartmentsV2Service.calculateProratedRent(data);
    },
    onSuccess: (data) => {
      setResult(data);
      toast.success('Calculation completed!');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.detail || 'Calculation failed');
    },
  });

  const handleChange = (field: keyof FormData, value: string) => {
    setForm(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});
    setResult(null);

    // Validation
    const newErrors: Record<string, string> = {};
    if (!form.monthly_rent || Number(form.monthly_rent) <= 0) {
      newErrors.monthly_rent = 'Monthly rent must be greater than 0';
    }
    if (!form.start_date) {
      newErrors.start_date = 'Start date is required';
    }
    if (!form.end_date) {
      newErrors.end_date = 'End date is required';
    }
    if (form.start_date && form.end_date && form.start_date > form.end_date) {
      newErrors.end_date = 'End date must be >= start date';
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    // Extract year and month from start_date
    const startDate = new Date(form.start_date);
    const year = startDate.getFullYear();
    const month = startDate.getMonth() + 1;

    calculateMutation.mutate({
      monthly_rent: Number(form.monthly_rent),
      start_date: form.start_date,
      end_date: form.end_date,
      year,
      month,
    });
  };

  const handleClear = () => {
    setForm({
      monthly_rent: '50000',
      start_date: '',
      end_date: '',
    });
    setResult(null);
    setErrors({});
  };

  const handleCopyToClipboard = () => {
    if (!result) return;

    const text = `
Prorated Rent Calculation
=======================
Monthly Rent: ¥${result.monthly_rent.toLocaleString()}
Period: ${form.start_date} to ${form.end_date}
Days in Month: ${result.days_in_month}
Days Occupied: ${result.days_occupied}
Daily Rate: ¥${Math.round(result.daily_rate).toLocaleString()}
PRORATED RENT: ¥${Math.round(result.prorated_rent).toLocaleString()}

Formula: ${result.calculation_formula}
    `.trim();

    navigator.clipboard.writeText(text);
    toast.success('Copied to clipboard!');
  };

  // Calculate percentage if form is filled
  const daysOccupied = form.start_date && form.end_date
    ? Math.floor((new Date(form.end_date).getTime() - new Date(form.start_date).getTime()) / (1000 * 60 * 60 * 24)) + 1
    : 0;

  return (
    <div className="space-y-6 p-6 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-4">
        <button
          onClick={() => router.back()}
          className="p-2 hover:bg-accent rounded-lg transition-colors"
        >
          <ArrowLeftIcon className="h-5 w-5" />
        </button>
        <div>
          <h1 className="text-3xl font-bold">Prorated Rent Calculator</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Calculate prorated rent for any date range
          </p>
        </div>
      </div>

      {/* Info Card */}
      <Card className="border-blue-200 bg-blue-50/50">
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            <InformationCircleIcon className="h-6 w-6 text-blue-600 mt-0.5 flex-shrink-0" />
            <div>
              <h3 className="font-semibold text-blue-800">What is prorated rent?</h3>
              <p className="text-sm text-blue-700 mt-1">
                Prorated rent is calculated based on the actual days occupied in a month.
                Formula: <code className="bg-blue-100 px-1 rounded">(Monthly Rent ÷ Days in Month) × Days Occupied</code>
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Input Form */}
      <Card>
        <CardHeader>
          <CardTitle>Input Details</CardTitle>
          <CardDescription>Enter the monthly rent and date range</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Monthly Rent */}
              <div className="md:col-span-2">
                <label className="block text-sm font-medium mb-2">
                  <CurrencyYenIcon className="inline h-4 w-4 mr-1" />
                  Monthly Rent (¥) *
                </label>
                <Input
                  type="number"
                  value={form.monthly_rent}
                  onChange={(e) => handleChange('monthly_rent', e.target.value)}
                  placeholder="Ex: 50000"
                  min="0"
                  step="1000"
                  className={errors.monthly_rent ? 'border-red-500' : ''}
                />
                {errors.monthly_rent && (
                  <p className="text-sm text-red-500 mt-1">{errors.monthly_rent}</p>
                )}
              </div>

              {/* Start Date */}
              <div>
                <label className="block text-sm font-medium mb-2">
                  <CalendarIcon className="inline h-4 w-4 mr-1" />
                  Start Date *
                </label>
                <Input
                  type="date"
                  value={form.start_date}
                  onChange={(e) => handleChange('start_date', e.target.value)}
                  className={errors.start_date ? 'border-red-500' : ''}
                />
                {errors.start_date && (
                  <p className="text-sm text-red-500 mt-1">{errors.start_date}</p>
                )}
              </div>

              {/* End Date */}
              <div>
                <label className="block text-sm font-medium mb-2">
                  <CalendarIcon className="inline h-4 w-4 mr-1" />
                  End Date *
                </label>
                <Input
                  type="date"
                  value={form.end_date}
                  onChange={(e) => handleChange('end_date', e.target.value)}
                  min={form.start_date}
                  className={errors.end_date ? 'border-red-500' : ''}
                />
                {errors.end_date && (
                  <p className="text-sm text-red-500 mt-1">{errors.end_date}</p>
                )}
              </div>
            </div>

            {/* Days Preview */}
            {form.start_date && form.end_date && form.start_date <= form.end_date && (
              <div className="p-4 bg-muted rounded-lg">
                <p className="text-sm font-medium">
                  Period: {daysOccupied} days ({form.start_date} to {form.end_date})
                </p>
              </div>
            )}

            {/* Actions */}
            <div className="flex items-center gap-3 pt-4 border-t">
              <Button
                type="submit"
                disabled={calculateMutation.isPending}
                size="lg"
                className="flex-1"
              >
                <CalculatorIcon className="h-5 w-5 mr-2" />
                {calculateMutation.isPending ? 'Calculating...' : 'Calculate'}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={handleClear}
                size="lg"
              >
                Clear
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      {/* Results */}
      {result && (
        <Card className="border-green-200 bg-green-50/50">
          <CardHeader>
            <CardTitle className="text-green-800">Calculation Result</CardTitle>
            <CardDescription>Detailed breakdown of prorated rent</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Main Result */}
            <div className="bg-white rounded-xl p-6 border-2 border-green-300 shadow-md">
              <p className="text-sm text-green-700 mb-2">Prorated Rent</p>
              <p className="text-5xl font-bold text-green-800">
                ¥{Math.round(result.prorated_rent).toLocaleString()}
              </p>
              <p className="text-sm text-green-600 mt-2">
                {result.is_prorated ? 'Prorated (partial month)' : 'Full month'}
              </p>
            </div>

            {/* Breakdown */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-white p-4 rounded-lg border">
                <p className="text-xs text-muted-foreground">Monthly Rent</p>
                <p className="text-2xl font-bold mt-1">¥{result.monthly_rent.toLocaleString()}</p>
              </div>
              <div className="bg-white p-4 rounded-lg border">
                <p className="text-xs text-muted-foreground">Days in Month</p>
                <p className="text-2xl font-bold mt-1">{result.days_in_month}</p>
              </div>
              <div className="bg-white p-4 rounded-lg border">
                <p className="text-xs text-muted-foreground">Days Occupied</p>
                <p className="text-2xl font-bold mt-1 text-green-600">{result.days_occupied}</p>
              </div>
              <div className="bg-white p-4 rounded-lg border">
                <p className="text-xs text-muted-foreground">Daily Rate</p>
                <p className="text-2xl font-bold mt-1">¥{Math.round(result.daily_rate).toLocaleString()}</p>
              </div>
            </div>

            {/* Progress Bar */}
            <div>
              <div className="flex justify-between text-sm mb-2">
                <span>Occupancy</span>
                <span className="font-medium">
                  {result.days_occupied}/{result.days_in_month} days ({Math.round((result.days_occupied / result.days_in_month) * 100)}%)
                </span>
              </div>
              <div className="h-3 bg-gray-200 rounded-full overflow-hidden">
                <div
                  className="h-full bg-green-500 rounded-full transition-all"
                  style={{ width: `${(result.days_occupied / result.days_in_month) * 100}%` }}
                />
              </div>
            </div>

            {/* Formula */}
            <div className="bg-white p-4 rounded-lg border">
              <h4 className="font-semibold mb-2">Calculation Formula</h4>
              <code className="text-sm bg-gray-100 p-2 rounded block">
                {result.calculation_formula}
              </code>
            </div>

            {/* Actions */}
            <div className="flex gap-3 pt-4 border-t">
              <Button
                onClick={handleCopyToClipboard}
                variant="outline"
                className="flex-1"
              >
                <ClipboardDocumentIcon className="h-4 w-4 mr-2" />
                Copy to Clipboard
              </Button>
              <Button
                onClick={() => window.print()}
                variant="outline"
                className="flex-1"
              >
                Print
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Example Scenarios */}
      <Card>
        <CardHeader>
          <CardTitle>Example Scenarios</CardTitle>
          <CardDescription>Common use cases for prorated rent</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="p-3 bg-muted rounded-lg">
            <p className="font-medium text-sm">Mid-month move-in (November 15-30)</p>
            <p className="text-xs text-muted-foreground mt-1">
              Employee moves in on the 15th. Calculate rent for 16 days (Nov 15-30).
            </p>
          </div>
          <div className="p-3 bg-muted rounded-lg">
            <p className="font-medium text-sm">Mid-month move-out (May 1-20)</p>
            <p className="text-xs text-muted-foreground mt-1">
              Employee moves out on the 20th. Calculate rent for 20 days (May 1-20).
            </p>
          </div>
          <div className="p-3 bg-muted rounded-lg">
            <p className="font-medium text-sm">Full month (January 1-31)</p>
            <p className="text-xs text-muted-foreground mt-1">
              Employee occupies the entire month. No proration needed.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
