'use client';

import { SalaryCalculation } from '@/types/api';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

interface SalaryDeductionsTableProps {
  salary: SalaryCalculation;
}

export function SalaryDeductionsTable({ salary }: SalaryDeductionsTableProps) {
  const formatCurrency = (amount: number) => {
    return `¥${amount.toLocaleString('ja-JP')}`;
  };

  const calculatePercentage = (amount: number) => {
    if (salary.gross_salary === 0) return '0.0';
    return ((amount / salary.gross_salary) * 100).toFixed(1);
  };

  const deductions = [
    {
      label: '社宅控除',
      labelEn: 'Apartment Deduction',
      amount: salary.apartment_deduction,
      icon: '🏠',
    },
    {
      label: '所得税',
      labelEn: 'Income Tax',
      amount: salary.income_tax,
      icon: '📊',
    },
    {
      label: '住民税',
      labelEn: 'Resident Tax',
      amount: salary.resident_tax,
      icon: '🏛️',
    },
    {
      label: '健康保険',
      labelEn: 'Health Insurance',
      amount: salary.health_insurance,
      icon: '🏥',
    },
    {
      label: '厚生年金',
      labelEn: 'Pension Insurance',
      amount: salary.pension,
      icon: '👴',
    },
    {
      label: '雇用保険',
      labelEn: 'Employment Insurance',
      amount: salary.employment_insurance,
      icon: '💼',
    },
    {
      label: 'その他控除',
      labelEn: 'Other Deductions',
      amount: salary.other_deductions,
      icon: '📝',
    },
  ];

  const taxesTotal = salary.income_tax + salary.resident_tax;
  const insuranceTotal = salary.health_insurance + salary.pension + salary.employment_insurance;

  return (
    <div className="space-y-6">
      {/* Deduction Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {deductions.map((deduction) => (
          <div
            key={deduction.labelEn}
            className="bg-card border rounded-lg p-4 hover:shadow-md transition-shadow"
          >
            <div className="flex items-center gap-2 mb-2">
              <span className="text-2xl">{deduction.icon}</span>
              <div>
                <p className="text-sm font-medium">{deduction.label}</p>
                <p className="text-xs text-muted-foreground">{deduction.labelEn}</p>
              </div>
            </div>
            <p className="text-2xl font-bold text-red-600 dark:text-red-400">
              {formatCurrency(deduction.amount)}
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              {calculatePercentage(deduction.amount)}% of gross
            </p>
          </div>
        ))}
      </div>

      {/* Summary Table */}
      <div>
        <h3 className="text-lg font-semibold mb-4">控除内訳サマリー (Deductions Summary)</h3>
        <div className="border rounded-lg overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>項目 (Item)</TableHead>
                <TableHead className="text-right">金額 (Amount)</TableHead>
                <TableHead className="text-right">総支給比 (%)</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {deductions.map((deduction) => (
                <TableRow key={deduction.labelEn}>
                  <TableCell>
                    <span className="mr-2">{deduction.icon}</span>
                    {deduction.label}
                    <span className="text-xs text-muted-foreground ml-2">({deduction.labelEn})</span>
                  </TableCell>
                  <TableCell className="text-right font-semibold">
                    {formatCurrency(deduction.amount)}
                  </TableCell>
                  <TableCell className="text-right text-muted-foreground">
                    {calculatePercentage(deduction.amount)}%
                  </TableCell>
                </TableRow>
              ))}
              <TableRow className="bg-muted/30">
                <TableCell className="font-semibold">税金合計 (Total Taxes)</TableCell>
                <TableCell className="text-right font-semibold">{formatCurrency(taxesTotal)}</TableCell>
                <TableCell className="text-right">{calculatePercentage(taxesTotal)}%</TableCell>
              </TableRow>
              <TableRow className="bg-muted/30">
                <TableCell className="font-semibold">保険合計 (Total Insurance)</TableCell>
                <TableCell className="text-right font-semibold">{formatCurrency(insuranceTotal)}</TableCell>
                <TableCell className="text-right">{calculatePercentage(insuranceTotal)}%</TableCell>
              </TableRow>
              <TableRow className="bg-muted/50 font-bold">
                <TableCell>控除総額 (Total Deductions)</TableCell>
                <TableCell className="text-right text-red-600 dark:text-red-400">
                  {formatCurrency(salary.total_deductions)}
                </TableCell>
                <TableCell className="text-right">{calculatePercentage(salary.total_deductions)}%</TableCell>
              </TableRow>
              <TableRow className="bg-primary/10 font-bold">
                <TableCell>手取り額 (Net Salary)</TableCell>
                <TableCell className="text-right text-green-600 dark:text-green-400">
                  {formatCurrency(salary.net_salary)}
                </TableCell>
                <TableCell className="text-right">
                  {calculatePercentage(salary.net_salary)}%
                </TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </div>
      </div>
    </div>
  );
}
