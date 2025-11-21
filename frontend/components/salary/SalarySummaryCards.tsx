'use client';

import { BanknotesIcon, CurrencyYenIcon, ChartBarIcon, MinusCircleIcon } from '@heroicons/react/24/outline';

interface SalarySummaryCardsProps {
  grossSalary: number;
  totalDeductions: number;
  netSalary: number;
  companyProfit: number;
}

export function SalarySummaryCards({
  grossSalary,
  totalDeductions,
  netSalary,
  companyProfit,
}: SalarySummaryCardsProps) {
  const formatCurrency = (amount: number) => {
    return `¥${amount.toLocaleString('ja-JP')}`;
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {/* Gross Salary */}
      <div className="bg-card rounded-lg border shadow-sm p-6 hover:shadow-md transition-shadow">
        <div className="flex items-center gap-3 mb-2">
          <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
            <BanknotesIcon className="h-6 w-6 text-blue-600 dark:text-blue-400" />
          </div>
          <p className="text-sm text-muted-foreground font-medium">総支給額</p>
        </div>
        <p className="text-3xl font-bold text-blue-600 dark:text-blue-400">{formatCurrency(grossSalary)}</p>
        <p className="text-xs text-muted-foreground mt-1">Gross Salary</p>
      </div>

      {/* Deductions */}
      <div className="bg-card rounded-lg border shadow-sm p-6 hover:shadow-md transition-shadow">
        <div className="flex items-center gap-3 mb-2">
          <div className="p-2 bg-red-100 dark:bg-red-900/30 rounded-lg">
            <MinusCircleIcon className="h-6 w-6 text-red-600 dark:text-red-400" />
          </div>
          <p className="text-sm text-muted-foreground font-medium">総控除額</p>
        </div>
        <p className="text-3xl font-bold text-red-600 dark:text-red-400">{formatCurrency(totalDeductions)}</p>
        <p className="text-xs text-muted-foreground mt-1">Total Deductions</p>
      </div>

      {/* Net Salary */}
      <div className="bg-card rounded-lg border shadow-sm p-6 hover:shadow-md transition-shadow">
        <div className="flex items-center gap-3 mb-2">
          <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-lg">
            <CurrencyYenIcon className="h-6 w-6 text-green-600 dark:text-green-400" />
          </div>
          <p className="text-sm text-muted-foreground font-medium">手取り額</p>
        </div>
        <p className="text-3xl font-bold text-green-600 dark:text-green-400">{formatCurrency(netSalary)}</p>
        <p className="text-xs text-muted-foreground mt-1">Net Salary</p>
      </div>

      {/* Company Profit */}
      <div className="bg-card rounded-lg border shadow-sm p-6 hover:shadow-md transition-shadow">
        <div className="flex items-center gap-3 mb-2">
          <div className="p-2 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
            <ChartBarIcon className="h-6 w-6 text-purple-600 dark:text-purple-400" />
          </div>
          <p className="text-sm text-muted-foreground font-medium">会社利益</p>
        </div>
        <p className="text-3xl font-bold text-purple-600 dark:text-purple-400">{formatCurrency(companyProfit)}</p>
        <p className="text-xs text-muted-foreground mt-1">Company Profit</p>
      </div>
    </div>
  );
}
