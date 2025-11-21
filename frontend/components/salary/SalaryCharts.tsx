'use client';

import { SalaryCalculation } from '@/types/api';

interface SalaryChartsProps {
  salary: SalaryCalculation;
}

export function SalaryCharts({ salary }: SalaryChartsProps) {
  const formatCurrency = (amount: number) => {
    return `¥${amount.toLocaleString('ja-JP')}`;
  };

  // Hours breakdown data
  const hoursData = [
    { name: '通常', value: salary.regular_hours, color: '#3b82f6' },
    { name: '残業', value: salary.overtime_hours, color: '#f97316' },
    { name: '深夜', value: salary.night_hours, color: '#8b5cf6' },
    { name: '休日', value: salary.holiday_hours, color: '#10b981' },
    { name: '日曜', value: salary.sunday_hours, color: '#ef4444' },
  ].filter((item) => item.value > 0);

  // Salary breakdown data
  const salaryData = [
    { name: '総支給額', value: salary.gross_salary, color: '#3b82f6' },
    { name: '控除額', value: salary.total_deductions, color: '#ef4444' },
    { name: '手取り額', value: salary.net_salary, color: '#10b981' },
  ];

  // Deductions breakdown data
  const deductionsData = [
    { name: '社宅', value: salary.apartment_deduction, color: '#8b5cf6' },
    { name: '所得税', value: salary.income_tax, color: '#f59e0b' },
    { name: '住民税', value: salary.resident_tax, color: '#ec4899' },
    { name: '健康保険', value: salary.health_insurance, color: '#06b6d4' },
    { name: '年金', value: salary.pension, color: '#6366f1' },
    { name: '雇用保険', value: salary.employment_insurance, color: '#14b8a6' },
    { name: 'その他', value: salary.other_deductions, color: '#64748b' },
  ].filter((item) => item.value > 0);

  const totalHours = hoursData.reduce((sum, item) => sum + item.value, 0);

  return (
    <div className="space-y-8">
      {/* Hours Distribution - Simple Bar Chart */}
      <div>
        <h3 className="text-lg font-semibold mb-4">勤務時間内訳 (Hours Distribution)</h3>
        <div className="space-y-3">
          {hoursData.map((item) => {
            const percentage = totalHours > 0 ? (item.value / totalHours) * 100 : 0;
            return (
              <div key={item.name} className="space-y-1">
                <div className="flex justify-between items-center text-sm">
                  <span className="font-medium">{item.name}</span>
                  <span className="text-muted-foreground">
                    {item.value.toFixed(1)}h ({percentage.toFixed(1)}%)
                  </span>
                </div>
                <div className="h-8 bg-muted rounded-lg overflow-hidden flex items-center">
                  <div
                    className="h-full flex items-center justify-end px-3 text-white text-sm font-semibold transition-all"
                    style={{
                      width: `${percentage}%`,
                      backgroundColor: item.color,
                      minWidth: percentage > 15 ? 'auto' : '50px',
                    }}
                  >
                    {percentage > 15 && `${item.value.toFixed(1)}h`}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Salary Comparison - Bar Chart */}
      <div>
        <h3 className="text-lg font-semibold mb-4">給与比較 (Salary Comparison)</h3>
        <div className="space-y-3">
          {salaryData.map((item) => {
            const maxValue = Math.max(...salaryData.map((d) => d.value));
            const percentage = maxValue > 0 ? (item.value / maxValue) * 100 : 0;
            return (
              <div key={item.name} className="space-y-1">
                <div className="flex justify-between items-center text-sm">
                  <span className="font-medium">{item.name}</span>
                  <span className="text-muted-foreground font-mono">{formatCurrency(item.value)}</span>
                </div>
                <div className="h-12 bg-muted rounded-lg overflow-hidden flex items-center">
                  <div
                    className="h-full flex items-center justify-end px-4 text-white text-sm font-bold transition-all"
                    style={{
                      width: `${percentage}%`,
                      backgroundColor: item.color,
                      minWidth: percentage > 20 ? 'auto' : '100px',
                    }}
                  >
                    {formatCurrency(item.value)}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Deductions Breakdown - Pie Chart Alternative */}
      {deductionsData.length > 0 && (
        <div>
          <h3 className="text-lg font-semibold mb-4">控除内訳 (Deductions Breakdown)</h3>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {deductionsData.map((item) => {
              const percentage = salary.total_deductions > 0 ? (item.value / salary.total_deductions) * 100 : 0;
              return (
                <div
                  key={item.name}
                  className="border rounded-lg p-4 hover:shadow-md transition-shadow"
                  style={{ borderLeftColor: item.color, borderLeftWidth: '4px' }}
                >
                  <div className="flex items-center gap-2 mb-2">
                    <div
                      className="w-3 h-3 rounded-full"
                      style={{ backgroundColor: item.color }}
                    ></div>
                    <p className="text-sm font-medium">{item.name}</p>
                  </div>
                  <p className="text-xl font-bold">{formatCurrency(item.value)}</p>
                  <p className="text-xs text-muted-foreground mt-1">{percentage.toFixed(1)}% of total</p>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Summary Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-4 border-t">
        <div className="text-center">
          <p className="text-sm text-muted-foreground mb-1">総勤務時間</p>
          <p className="text-2xl font-bold">{salary.total_hours.toFixed(1)}</p>
          <p className="text-xs text-muted-foreground">hours</p>
        </div>
        <div className="text-center">
          <p className="text-sm text-muted-foreground mb-1">平均時給</p>
          <p className="text-2xl font-bold">
            {salary.total_hours > 0
              ? formatCurrency(Math.round(salary.gross_salary / salary.total_hours))
              : '¥0'}
          </p>
          <p className="text-xs text-muted-foreground">per hour</p>
        </div>
        <div className="text-center">
          <p className="text-sm text-muted-foreground mb-1">控除率</p>
          <p className="text-2xl font-bold text-red-600">
            {salary.gross_salary > 0
              ? ((salary.total_deductions / salary.gross_salary) * 100).toFixed(1)
              : '0.0'}
            %
          </p>
          <p className="text-xs text-muted-foreground">deduction rate</p>
        </div>
        <div className="text-center">
          <p className="text-sm text-muted-foreground mb-1">利益率</p>
          <p className="text-2xl font-bold text-purple-600">
            {salary.gross_salary > 0
              ? ((salary.company_profit / salary.gross_salary) * 100).toFixed(1)
              : '0.0'}
            %
          </p>
          <p className="text-xs text-muted-foreground">profit margin</p>
        </div>
      </div>
    </div>
  );
}
