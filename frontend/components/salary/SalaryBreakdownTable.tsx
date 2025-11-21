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

interface SalaryBreakdownTableProps {
  salary: SalaryCalculation;
}

export function SalaryBreakdownTable({ salary }: SalaryBreakdownTableProps) {
  const formatCurrency = (amount: number) => {
    return `¥${amount.toLocaleString('ja-JP')}`;
  };

  const breakdownRows = [
    {
      concept: '通常勤務',
      conceptEn: 'Regular',
      hours: salary.regular_hours,
      rate: salary.regular_rate,
      amount: salary.regular_amount,
      multiplier: '1.0x',
    },
    {
      concept: '残業',
      conceptEn: 'Overtime',
      hours: salary.overtime_hours,
      rate: salary.overtime_rate,
      amount: salary.overtime_amount,
      multiplier: '1.25x',
    },
    {
      concept: '深夜',
      conceptEn: 'Night',
      hours: salary.night_hours,
      rate: salary.night_rate,
      amount: salary.night_amount,
      multiplier: '1.25x',
    },
    {
      concept: '休日',
      conceptEn: 'Holiday',
      hours: salary.holiday_hours,
      rate: salary.holiday_rate,
      amount: salary.holiday_amount,
      multiplier: '1.35x',
    },
    {
      concept: '日曜',
      conceptEn: 'Sunday',
      hours: salary.sunday_hours,
      rate: salary.sunday_rate,
      amount: salary.sunday_amount,
      multiplier: '1.35x',
    },
  ];

  return (
    <div className="space-y-6">
      {/* Hours Section */}
      <div>
        <h3 className="text-lg font-semibold mb-4">勤務時間 (Working Hours)</h3>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          {breakdownRows.map((row) => (
            <div key={row.conceptEn} className="bg-muted/50 rounded-lg p-4">
              <p className="text-sm text-muted-foreground mb-1">{row.concept}</p>
              <p className="text-2xl font-bold">
                {row.hours}
                <span className="text-sm font-normal text-muted-foreground ml-1">h</span>
              </p>
              <p className="text-xs text-muted-foreground mt-1">@ {formatCurrency(row.rate)}/h ({row.multiplier})</p>
            </div>
          ))}
        </div>
      </div>

      {/* Bonuses Section */}
      {(salary.bonus > 0 || salary.gasoline_allowance > 0) && (
        <div>
          <h3 className="text-lg font-semibold mb-4">手当 (Allowances)</h3>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {salary.bonus > 0 && (
              <div className="bg-muted/50 rounded-lg p-4">
                <p className="text-sm text-muted-foreground mb-1">賞与 (Bonus)</p>
                <p className="text-2xl font-bold text-green-600">{formatCurrency(salary.bonus)}</p>
              </div>
            )}
            {salary.gasoline_allowance > 0 && (
              <div className="bg-muted/50 rounded-lg p-4">
                <p className="text-sm text-muted-foreground mb-1">ガソリン手当 (Gas Allowance)</p>
                <p className="text-2xl font-bold text-green-600">{formatCurrency(salary.gasoline_allowance)}</p>
              </div>
            )}
            <div className="bg-primary/10 rounded-lg p-4">
              <p className="text-sm text-muted-foreground mb-1">手当合計 (Total Allowances)</p>
              <p className="text-2xl font-bold text-primary">
                {formatCurrency(salary.bonus + salary.gasoline_allowance)}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Breakdown Table */}
      <div>
        <h3 className="text-lg font-semibold mb-4">支給内訳詳細 (Payment Breakdown)</h3>
        <div className="border rounded-lg overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>区分 (Category)</TableHead>
                <TableHead className="text-right">時間 (Hours)</TableHead>
                <TableHead className="text-right">単価 (Rate)</TableHead>
                <TableHead className="text-right">倍率 (Multiplier)</TableHead>
                <TableHead className="text-right">金額 (Amount)</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {breakdownRows.map((row) => (
                <TableRow key={row.conceptEn}>
                  <TableCell className="font-medium">
                    {row.concept}
                    <span className="text-xs text-muted-foreground ml-2">({row.conceptEn})</span>
                  </TableCell>
                  <TableCell className="text-right">{row.hours.toFixed(2)}</TableCell>
                  <TableCell className="text-right">{formatCurrency(row.rate)}</TableCell>
                  <TableCell className="text-right">{row.multiplier}</TableCell>
                  <TableCell className="text-right font-semibold">{formatCurrency(row.amount)}</TableCell>
                </TableRow>
              ))}
              <TableRow className="bg-muted/50 font-bold">
                <TableCell>合計 (Total)</TableCell>
                <TableCell className="text-right">{salary.total_hours.toFixed(2)}</TableCell>
                <TableCell className="text-right">-</TableCell>
                <TableCell className="text-right">-</TableCell>
                <TableCell className="text-right text-primary">
                  {formatCurrency(
                    salary.regular_amount +
                      salary.overtime_amount +
                      salary.night_amount +
                      salary.holiday_amount +
                      salary.sunday_amount
                  )}
                </TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </div>
      </div>
    </div>
  );
}
