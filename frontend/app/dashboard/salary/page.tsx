'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  CurrencyYenIcon,
  MagnifyingGlassIcon,
  UserIcon,
  BanknotesIcon,
  ChartBarIcon,
  CheckCircleIcon,
  XCircleIcon
} from '@heroicons/react/24/outline';
import { salaryService } from '@/lib/api';

interface SalaryCalculation {
  id: number;
  employee_id: number;
  employee_name?: string;
  month: number;
  year: number;
  total_regular_hours: number;
  total_overtime_hours: number;
  total_night_hours: number;
  total_holiday_hours: number;
  base_salary: number;
  overtime_pay: number;
  night_pay: number;
  holiday_pay: number;
  bonus: number;
  gasoline_allowance: number;
  apartment_deduction: number;
  other_deductions: number;
  gross_salary: number;
  net_salary: number;
  factory_payment: number;
  company_profit: number;
  is_paid: boolean;
  paid_at?: string;
}

interface SalaryResponse {
  items: SalaryCalculation[];
  total: number;
}

export default function SalaryPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 50;

  const { data, isLoading } = useQuery<SalaryResponse>({
    queryKey: ['salary', searchTerm, selectedMonth, selectedYear, currentPage],
    queryFn: async (): Promise<SalaryResponse> => {
      const params: any = {
        page: currentPage,
        page_size: pageSize,
        month: selectedMonth,
        year: selectedYear,
      };
      if (searchTerm) params.search = searchTerm;
      const response = await salaryService.getSalaries<SalaryCalculation[]>(params);
      return {
        items: Array.isArray(response) ? response : [],
        total: Array.isArray(response) ? response.length : 0,
      };
    },
  });

  const salaries = Array.isArray(data?.items) ? data.items : [];
  const total = data?.total || 0;
  const totalPages = Math.ceil(total / pageSize);

  // Calculate totals
  const totalGross = Array.isArray(salaries) ? salaries.reduce((sum: number, s: SalaryCalculation) => sum + Number(s.gross_salary || 0), 0) : 0;
  const totalNet = Array.isArray(salaries) ? salaries.reduce((sum: number, s: SalaryCalculation) => sum + Number(s.net_salary || 0), 0) : 0;
  const totalProfit = Array.isArray(salaries) ? salaries.reduce((sum: number, s: SalaryCalculation) => sum + Number(s.company_profit || 0), 0) : 0;

  const formatCurrency = (amount: number) => {
    return `¥${amount.toLocaleString('ja-JP')}`;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-muted/20 p-4 sm:p-8">
      <div className="max-w-7xl mx-auto">

        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-extrabold text-foreground">給与管理</h1>
          <p className="text-muted-foreground mt-1">従業員の給与計算と支払管理</p>
        </div>

        {/* Search and Filters */}
        <div className="bg-card rounded-xl shadow-sm border p-6 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="relative">
              <MagnifyingGlassIcon className="h-5 w-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground" />
              <input
                type="text"
                placeholder="従業員名、IDで検索..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-input rounded-lg focus:ring-2 focus:ring-primary bg-background"
              />
            </div>

            <div>
              <select
                value={selectedYear}
                onChange={(e) => setSelectedYear(Number(e.target.value))}
                className="w-full px-3 py-2 border border-input rounded-lg focus:ring-2 focus:ring-primary bg-background"
              >
                {[...Array(5)].map((_, i) => {
                  const year = new Date().getFullYear() - i;
                  return <option key={year} value={year}>{year}年</option>;
                })}
              </select>
            </div>

            <div>
              <select
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(Number(e.target.value))}
                className="w-full px-3 py-2 border border-input rounded-lg focus:ring-2 focus:ring-primary bg-background"
              >
                {[...Array(12)].map((_, i) => (
                  <option key={i + 1} value={i + 1}>{i + 1}月</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
          <div className="bg-card rounded-xl shadow-sm p-6 hover:bg-accent hover:text-accent-foreground transition-colors">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 bg-blue-100 rounded-lg">
                <BanknotesIcon className="h-6 w-6 text-blue-600" />
              </div>
              <p className="text-sm text-gray-600">総支給額</p>
            </div>
            <p className="text-3xl font-bold text-gray-900">{formatCurrency(totalGross)}</p>
          </div>

          <div className="bg-card rounded-xl shadow-sm p-6 hover:bg-accent hover:text-accent-foreground transition-colors">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 bg-green-100 rounded-lg">
                <CurrencyYenIcon className="h-6 w-6 text-green-600" />
              </div>
              <p className="text-sm text-gray-600">手取り総額</p>
            </div>
            <p className="text-3xl font-bold text-green-600">{formatCurrency(totalNet)}</p>
          </div>

          <div className="bg-card rounded-xl shadow-sm p-6 hover:bg-accent hover:text-accent-foreground transition-colors">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 bg-purple-100 rounded-lg">
                <ChartBarIcon className="h-6 w-6 text-purple-600" />
              </div>
              <p className="text-sm text-gray-600">会社利益</p>
            </div>
            <p className="text-3xl font-bold text-purple-600">{formatCurrency(totalProfit)}</p>
          </div>
        </div>

        {/* Results */}
        <div className="mb-4">
          <p className="text-muted-foreground">
            {total > 0 ? `${total}件中 ${(currentPage - 1) * pageSize + 1}-${Math.min(currentPage * pageSize, total)}件を表示` : '給与計算が見つかりませんでした'}
          </p>
        </div>

        {/* Salary Table */}
        {isLoading ? (
          <div className="bg-card rounded-xl shadow-sm border p-8">
            <div className="animate-pulse space-y-4">
              {[...Array(10)].map((_, i) => (
                <div key={i} className="h-20 bg-muted rounded"></div>
              ))}
            </div>
          </div>
        ) : salaries.length === 0 ? (
          <div className="bg-card rounded-xl shadow-sm border p-12 text-center">
            <CurrencyYenIcon className="h-16 w-16 text-muted-foreground/50 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-foreground mb-2">給与データがありません</h3>
            <p className="text-muted-foreground">選択した月の給与計算が見つかりませんでした</p>
          </div>
        ) : (
          <div className="space-y-4">
            {salaries.map((salary: SalaryCalculation) => (
              <div key={salary.id} className="bg-card rounded-xl shadow-sm border hover:shadow-md transition-shadow">
                <div className="p-6">
                  {/* Header */}
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <UserIcon className="h-8 w-8 text-muted-foreground" />
                      <div>
                        <h3 className="font-semibold text-foreground text-lg">
                          {salary.employee_name || `従業員ID: ${salary.employee_id}`}
                        </h3>
                        <p className="text-sm text-muted-foreground">
                          {salary.year}年{salary.month}月分
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-2xl font-bold text-green-600">{formatCurrency(salary.net_salary)}</p>
                      <p className="text-sm text-muted-foreground">手取り額</p>
                    </div>
                  </div>

                  {/* Details Grid */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                    {/* Hours */}
                    <div>
                      <p className="text-xs text-muted-foreground mb-1">勤務時間</p>
                      <div className="space-y-1">
                        <p className="text-sm"><span className="text-muted-foreground">通常:</span> <span className="font-medium">{salary.total_regular_hours}h</span></p>
                        <p className="text-sm"><span className="text-muted-foreground">残業:</span> <span className="font-medium text-orange-600">{salary.total_overtime_hours}h</span></p>
                        <p className="text-sm"><span className="text-muted-foreground">深夜:</span> <span className="font-medium text-indigo-600">{salary.total_night_hours}h</span></p>
                        <p className="text-sm"><span className="text-muted-foreground">休日:</span> <span className="font-medium text-green-600">{salary.total_holiday_hours}h</span></p>
                      </div>
                    </div>

                    {/* Pay Breakdown */}
                    <div>
                      <p className="text-xs text-muted-foreground mb-1">支給内訳</p>
                      <div className="space-y-1">
                        <p className="text-sm"><span className="text-muted-foreground">基本給:</span> <span className="font-medium">{formatCurrency(salary.base_salary)}</span></p>
                        <p className="text-sm"><span className="text-muted-foreground">残業:</span> <span className="font-medium">{formatCurrency(salary.overtime_pay)}</span></p>
                        <p className="text-sm"><span className="text-muted-foreground">深夜:</span> <span className="font-medium">{formatCurrency(salary.night_pay)}</span></p>
                        <p className="text-sm"><span className="text-muted-foreground">休日:</span> <span className="font-medium">{formatCurrency(salary.holiday_pay)}</span></p>
                      </div>
                    </div>

                    {/* Bonuses */}
                    <div>
                      <p className="text-xs text-muted-foreground mb-1">手当</p>
                      <div className="space-y-1">
                        {salary.bonus > 0 && (
                          <p className="text-sm"><span className="text-muted-foreground">賞与:</span> <span className="font-medium">{formatCurrency(salary.bonus)}</span></p>
                        )}
                        {salary.gasoline_allowance > 0 && (
                          <p className="text-sm"><span className="text-muted-foreground">ガソリン:</span> <span className="font-medium">{formatCurrency(salary.gasoline_allowance)}</span></p>
                        )}
                        <p className="text-sm font-semibold"><span className="text-muted-foreground">総支給:</span> <span className="text-blue-600">{formatCurrency(salary.gross_salary)}</span></p>
                      </div>
                    </div>

                    {/* Deductions & Profit */}
                    <div>
                      <p className="text-xs text-muted-foreground mb-1">控除・利益</p>
                      <div className="space-y-1">
                        {salary.apartment_deduction > 0 && (
                          <p className="text-sm"><span className="text-muted-foreground">社宅:</span> <span className="font-medium text-red-600">-{formatCurrency(salary.apartment_deduction)}</span></p>
                        )}
                        {salary.other_deductions > 0 && (
                          <p className="text-sm"><span className="text-muted-foreground">その他:</span> <span className="font-medium text-red-600">-{formatCurrency(salary.other_deductions)}</span></p>
                        )}
                        <p className="text-sm font-semibold"><span className="text-muted-foreground">会社利益:</span> <span className="text-purple-600">{formatCurrency(salary.company_profit)}</span></p>
                      </div>
                    </div>
                  </div>

                  {/* Footer */}
                  <div className="flex items-center justify-between pt-4 border-t border-border">
                    <div className="flex items-center gap-2">
                      {salary.is_paid ? (
                        <>
                          <CheckCircleIcon className="h-5 w-5 text-green-500" />
                          <span className="text-sm text-green-700">支払済み</span>
                          {salary.paid_at && (
                            <span className="text-xs text-muted-foreground">
                              ({new Date(salary.paid_at).toLocaleDateString('ja-JP')})
                            </span>
                          )}
                        </>
                      ) : (
                        <>
                          <XCircleIcon className="h-5 w-5 text-yellow-500" />
                          <span className="text-sm text-yellow-700">未払い</span>
                        </>
                      )}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      工場支払: {formatCurrency(salary.factory_payment)}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="mt-6 flex justify-center">
            <nav className="flex items-center gap-2">
              <button
                onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                disabled={currentPage === 1}
                className="px-4 py-2 text-sm font-medium text-muted-foreground bg-card border border-input rounded-md hover:bg-accent hover:text-accent-foreground disabled:opacity-50"
              >
                前へ
              </button>

              {[...Array(Math.min(5, totalPages))].map((_, i) => {
                const page = Math.max(1, Math.min(totalPages, currentPage - 2 + i));
                return (
                  <button
                    key={page}
                    onClick={() => setCurrentPage(page)}
                    className={`px-4 py-2 text-sm font-medium rounded-md ${
                      page === currentPage
                        ? 'text-primary bg-primary/10 border border-primary/30'
                        : 'text-muted-foreground bg-card border border-input hover:bg-accent'
                    }`}
                  >
                    {page}
                  </button>
                );
              })}

              <button
                onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                disabled={currentPage === totalPages}
                className="px-4 py-2 text-sm font-medium text-muted-foreground bg-card border border-input rounded-md hover:bg-accent hover:text-accent-foreground disabled:opacity-50"
              >
                次へ
              </button>
            </nav>
          </div>
        )}
      </div>
    </div>
  );
}
