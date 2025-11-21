'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'react-hot-toast';
import { apartmentsV2Service } from '@/lib/api';
import type { ProratedCalculationRequest } from '@/types/apartments-v2';
import {
  ArrowLeftIcon,
  CalculatorIcon,
  CalendarIcon,
  CurrencyYenIcon,
  PlusIcon,
  XMarkIcon,
  ClipboardDocumentIcon,
  DocumentTextIcon,
} from '@heroicons/react/24/outline';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

interface AdditionalCharge {
  id: string;
  type: string;
  description: string;
  amount: number;
}

interface FormData {
  monthly_rent: string;
  management_fee: string;
  start_date: string;
  is_prorated: boolean;
  parking_fee: string;
  housing_subsidy: string;
}

interface CalculationResult {
  base_rent: number;
  management_fee: number;
  additional_charges_sum: number;
  parking_fee: number;
  housing_subsidy: number;
  total_deduction: number;
  is_prorated: boolean;
  days_in_month?: number;
  days_occupied?: number;
}

const CHARGE_TYPES = [
  { value: 'cleaning', label: 'Cleaning Fee (清掃費)' },
  { value: 'repair', label: 'Repair (修理費)' },
  { value: 'penalty', label: 'Penalty (違約金)' },
  { value: 'utilities', label: 'Utilities (光熱費)' },
  { value: 'other', label: 'Other (その他)' },
];

export default function TotalDeductionCalculatorPage() {
  const router = useRouter();
  const [form, setForm] = useState<FormData>({
    monthly_rent: '50000',
    management_fee: '3000',
    start_date: '',
    is_prorated: false,
    parking_fee: '0',
    housing_subsidy: '0',
  });
  const [additionalCharges, setAdditionalCharges] = useState<AdditionalCharge[]>([]);
  const [newCharge, setNewCharge] = useState({
    type: 'cleaning',
    description: '',
    amount: '',
  });
  const [result, setResult] = useState<CalculationResult | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isCalculating, setIsCalculating] = useState(false);

  const handleChange = (field: keyof FormData, value: string | boolean) => {
    setForm(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const handleAddCharge = () => {
    if (!newCharge.description || !newCharge.amount || Number(newCharge.amount) <= 0) {
      toast.error('Please enter a valid description and amount');
      return;
    }

    const charge: AdditionalCharge = {
      id: Date.now().toString(),
      type: newCharge.type,
      description: newCharge.description,
      amount: Number(newCharge.amount),
    };

    setAdditionalCharges(prev => [...prev, charge]);
    setNewCharge({ type: 'cleaning', description: '', amount: '' });
    toast.success('Charge added!');
  };

  const handleRemoveCharge = (id: string) => {
    setAdditionalCharges(prev => prev.filter(c => c.id !== id));
    toast.success('Charge removed!');
  };

  const handleCalculate = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});
    setResult(null);

    // Validation
    const newErrors: Record<string, string> = {};
    if (!form.monthly_rent || Number(form.monthly_rent) <= 0) {
      newErrors.monthly_rent = 'Monthly rent must be greater than 0';
    }
    if (form.is_prorated && !form.start_date) {
      newErrors.start_date = 'Start date is required for prorated calculation';
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setIsCalculating(true);

    try {
      let baseRent = Number(form.monthly_rent);
      let daysInMonth: number | undefined;
      let daysOccupied: number | undefined;

      // If prorated, calculate prorated rent
      if (form.is_prorated && form.start_date) {
        const startDate = new Date(form.start_date);
        const year = startDate.getFullYear();
        const month = startDate.getMonth() + 1;

        // Calculate end of month
        const endOfMonth = new Date(year, month, 0);
        const endDate = endOfMonth.toISOString().split('T')[0];

        const proratedData: ProratedCalculationRequest = {
          monthly_rent: baseRent,
          start_date: form.start_date,
          end_date: endDate,
          year,
          month,
        };

        const proratedResult = await apartmentsV2Service.calculateProratedRent(proratedData);
        baseRent = proratedResult.prorated_rent;
        daysInMonth = proratedResult.days_in_month;
        daysOccupied = proratedResult.days_occupied;
      }

      // Calculate totals
      const managementFee = Number(form.management_fee) || 0;
      const additionalChargesSum = additionalCharges.reduce((sum, charge) => sum + charge.amount, 0);
      const parkingFee = Number(form.parking_fee) || 0;
      const housingSubsidy = Number(form.housing_subsidy) || 0;

      const totalDeduction = baseRent + managementFee + additionalChargesSum + parkingFee - housingSubsidy;

      setResult({
        base_rent: baseRent,
        management_fee: managementFee,
        additional_charges_sum: additionalChargesSum,
        parking_fee: parkingFee,
        housing_subsidy: housingSubsidy,
        total_deduction: totalDeduction,
        is_prorated: form.is_prorated,
        days_in_month: daysInMonth,
        days_occupied: daysOccupied,
      });

      toast.success('Calculation completed!');
    } catch (error: any) {
      toast.error(error.response?.data?.detail || 'Calculation failed');
    } finally {
      setIsCalculating(false);
    }
  };

  const handleClear = () => {
    setForm({
      monthly_rent: '50000',
      management_fee: '3000',
      start_date: '',
      is_prorated: false,
      parking_fee: '0',
      housing_subsidy: '0',
    });
    setAdditionalCharges([]);
    setNewCharge({ type: 'cleaning', description: '', amount: '' });
    setResult(null);
    setErrors({});
  };

  const handleCopyToClipboard = () => {
    if (!result) return;

    const chargesText = additionalCharges.map(c => `  - ${c.description}: ¥${c.amount.toLocaleString()}`).join('\n');

    const text = `
Total Monthly Deduction Calculation
===================================
Base Rent: ¥${Math.round(result.base_rent).toLocaleString()} ${result.is_prorated ? `(Prorated: ${result.days_occupied}/${result.days_in_month} days)` : '(Full month)'}
Management Fee: ¥${result.management_fee.toLocaleString()}
Additional Charges: ¥${result.additional_charges_sum.toLocaleString()}
${chargesText}
Parking Fee: ¥${result.parking_fee.toLocaleString()}
Housing Subsidy: -¥${result.housing_subsidy.toLocaleString()}

TOTAL DEDUCTION: ¥${Math.round(result.total_deduction).toLocaleString()}
    `.trim();

    navigator.clipboard.writeText(text);
    toast.success('Copied to clipboard!');
  };

  const handleLoadExample = (example: string) => {
    if (example === 'standard') {
      setForm({
        monthly_rent: '60000',
        management_fee: '5000',
        start_date: '',
        is_prorated: false,
        parking_fee: '5000',
        housing_subsidy: '0',
      });
      setAdditionalCharges([]);
    } else if (example === 'prorated') {
      const today = new Date();
      const midMonth = new Date(today.getFullYear(), today.getMonth(), 15);
      setForm({
        monthly_rent: '50000',
        management_fee: '3000',
        start_date: midMonth.toISOString().split('T')[0],
        is_prorated: true,
        parking_fee: '0',
        housing_subsidy: '10000',
      });
      setAdditionalCharges([]);
    } else if (example === 'with-charges') {
      setForm({
        monthly_rent: '70000',
        management_fee: '4000',
        start_date: '',
        is_prorated: false,
        parking_fee: '8000',
        housing_subsidy: '5000',
      });
      setAdditionalCharges([
        { id: '1', type: 'cleaning', description: 'Deep cleaning', amount: 20000 },
        { id: '2', type: 'repair', description: 'Window repair', amount: 5000 },
      ]);
    }
    toast.success('Example loaded!');
  };

  return (
    <div className="space-y-6 p-6 max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-4">
        <button
          onClick={() => router.back()}
          className="p-2 hover:bg-accent rounded-lg transition-colors"
        >
          <ArrowLeftIcon className="h-5 w-5" />
        </button>
        <div>
          <h1 className="text-3xl font-bold">Total Monthly Deduction Calculator</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Calculate total monthly deduction including rent, fees, and charges
          </p>
        </div>
      </div>

      {/* Input Form */}
      <Card>
        <CardHeader>
          <CardTitle>Input Details</CardTitle>
          <CardDescription>Enter rent, fees, and additional charges</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleCalculate} className="space-y-6">
            {/* Base Rent Section */}
            <div>
              <h3 className="font-semibold mb-3 flex items-center gap-2">
                <CurrencyYenIcon className="h-5 w-5 text-primary" />
                Base Rent
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2">
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
                <div>
                  <label className="block text-sm font-medium mb-2">
                    Management Fee (¥)
                  </label>
                  <Input
                    type="number"
                    value={form.management_fee}
                    onChange={(e) => handleChange('management_fee', e.target.value)}
                    placeholder="Ex: 3000"
                    min="0"
                    step="1000"
                  />
                </div>
              </div>
            </div>

            {/* Prorated Section */}
            <div className="p-4 bg-muted rounded-lg">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={form.is_prorated}
                  onChange={(e) => handleChange('is_prorated', e.target.checked)}
                  className="h-4 w-4 rounded border-gray-300"
                />
                <span className="text-sm font-medium">Calculate prorated rent (partial month)</span>
              </label>
              {form.is_prorated && (
                <div className="mt-3">
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
                  <p className="text-xs text-muted-foreground mt-1">
                    Rent will be prorated from this date to the end of the month
                  </p>
                </div>
              )}
            </div>

            {/* Additional Charges Section */}
            <div>
              <h3 className="font-semibold mb-3 flex items-center gap-2">
                <DocumentTextIcon className="h-5 w-5 text-primary" />
                Additional Charges
              </h3>
              <div className="space-y-3">
                {/* Add Charge Form */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                  <div>
                    <label className="block text-sm font-medium mb-2">Type</label>
                    <select
                      value={newCharge.type}
                      onChange={(e) => setNewCharge(prev => ({ ...prev, type: e.target.value }))}
                      className="w-full px-3 py-2 border-2 border-gray-200 rounded-xl h-11 bg-white text-sm font-medium"
                    >
                      {CHARGE_TYPES.map(type => (
                        <option key={type.value} value={type.value}>{type.label}</option>
                      ))}
                    </select>
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium mb-2">Description</label>
                    <Input
                      value={newCharge.description}
                      onChange={(e) => setNewCharge(prev => ({ ...prev, description: e.target.value }))}
                      placeholder="Ex: Deep cleaning service"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">Amount (¥)</label>
                    <div className="flex gap-2">
                      <Input
                        type="number"
                        value={newCharge.amount}
                        onChange={(e) => setNewCharge(prev => ({ ...prev, amount: e.target.value }))}
                        placeholder="Ex: 20000"
                        min="0"
                        step="1000"
                      />
                      <Button
                        type="button"
                        onClick={handleAddCharge}
                        variant="default"
                        size="icon"
                      >
                        <PlusIcon className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>

                {/* Charges List */}
                {additionalCharges.length > 0 && (
                  <div className="space-y-2">
                    {additionalCharges.map(charge => (
                      <div key={charge.id} className="flex items-center justify-between p-3 bg-white border rounded-lg">
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-medium text-muted-foreground uppercase">
                              {CHARGE_TYPES.find(t => t.value === charge.type)?.label}
                            </span>
                          </div>
                          <p className="text-sm font-medium mt-1">{charge.description}</p>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className="text-lg font-bold">¥{charge.amount.toLocaleString()}</span>
                          <button
                            onClick={() => handleRemoveCharge(charge.id)}
                            className="p-1 hover:bg-red-50 rounded text-red-600"
                          >
                            <XMarkIcon className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Other Fees and Subsidies */}
            <div>
              <h3 className="font-semibold mb-3">Other Fees & Subsidies</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2">
                    Parking Fee (¥)
                  </label>
                  <Input
                    type="number"
                    value={form.parking_fee}
                    onChange={(e) => handleChange('parking_fee', e.target.value)}
                    placeholder="Ex: 5000"
                    min="0"
                    step="1000"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">
                    Housing Subsidy (¥) <span className="text-green-600">(reduces total)</span>
                  </label>
                  <Input
                    type="number"
                    value={form.housing_subsidy}
                    onChange={(e) => handleChange('housing_subsidy', e.target.value)}
                    placeholder="Ex: 10000"
                    min="0"
                    step="1000"
                  />
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-3 pt-4 border-t">
              <Button
                type="submit"
                disabled={isCalculating}
                size="lg"
                className="flex-1"
              >
                <CalculatorIcon className="h-5 w-5 mr-2" />
                {isCalculating ? 'Calculating...' : 'Calculate Total'}
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
            <CardDescription>Detailed breakdown of total monthly deduction</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Main Result */}
            <div className="bg-white rounded-xl p-6 border-2 border-green-300 shadow-md">
              <p className="text-sm text-green-700 mb-2">Total Monthly Deduction</p>
              <p className="text-5xl font-bold text-green-800">
                ¥{Math.round(result.total_deduction).toLocaleString()}
              </p>
            </div>

            {/* Itemized Breakdown */}
            <div className="bg-white p-6 rounded-lg border space-y-3">
              <h4 className="font-semibold mb-3">Itemized Breakdown</h4>

              <div className="flex justify-between py-2">
                <span className="text-muted-foreground">
                  Base Rent {result.is_prorated && `(${result.days_occupied}/${result.days_in_month} days)`}
                </span>
                <span className="font-medium">¥{Math.round(result.base_rent).toLocaleString()}</span>
              </div>

              <div className="flex justify-between py-2">
                <span className="text-muted-foreground">Management Fee</span>
                <span className="font-medium">¥{result.management_fee.toLocaleString()}</span>
              </div>

              {additionalCharges.length > 0 && (
                <div className="py-2">
                  <div className="flex justify-between mb-2">
                    <span className="text-muted-foreground font-medium">Additional Charges</span>
                    <span className="font-medium">¥{result.additional_charges_sum.toLocaleString()}</span>
                  </div>
                  <div className="ml-4 space-y-1">
                    {additionalCharges.map(charge => (
                      <div key={charge.id} className="flex justify-between text-sm">
                        <span className="text-muted-foreground">• {charge.description}</span>
                        <span>¥{charge.amount.toLocaleString()}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="flex justify-between py-2">
                <span className="text-muted-foreground">Parking Fee</span>
                <span className="font-medium">¥{result.parking_fee.toLocaleString()}</span>
              </div>

              {result.housing_subsidy > 0 && (
                <div className="flex justify-between py-2 text-green-600">
                  <span>Housing Subsidy</span>
                  <span className="font-medium">-¥{result.housing_subsidy.toLocaleString()}</span>
                </div>
              )}

              <div className="flex justify-between py-3 border-t-2 text-lg font-bold">
                <span>TOTAL</span>
                <span className="text-green-600">¥{Math.round(result.total_deduction).toLocaleString()}</span>
              </div>
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
          <CardDescription>Load preset examples to test the calculator</CardDescription>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <button
            onClick={() => handleLoadExample('standard')}
            className="p-4 bg-muted rounded-lg hover:bg-accent transition-colors text-left"
          >
            <p className="font-medium text-sm">Standard Full Month</p>
            <p className="text-xs text-muted-foreground mt-1">
              Full month rent + management + parking
            </p>
          </button>
          <button
            onClick={() => handleLoadExample('prorated')}
            className="p-4 bg-muted rounded-lg hover:bg-accent transition-colors text-left"
          >
            <p className="font-medium text-sm">Prorated with Subsidy</p>
            <p className="text-xs text-muted-foreground mt-1">
              Mid-month start + housing subsidy
            </p>
          </button>
          <button
            onClick={() => handleLoadExample('with-charges')}
            className="p-4 bg-muted rounded-lg hover:bg-accent transition-colors text-left"
          >
            <p className="font-medium text-sm">With Additional Charges</p>
            <p className="text-xs text-muted-foreground mt-1">
              Full month + cleaning + repairs
            </p>
          </button>
        </CardContent>
      </Card>
    </div>
  );
}
