'use client';

import { useState } from 'react';
import { SalaryReportFilters } from '@/types/api';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';

interface SalaryReportFiltersProps {
  onApplyFilters: (filters: SalaryReportFilters) => void;
  onClearFilters: () => void;
  loading?: boolean;
}

export function SalaryReportFiltersComponent({
  onApplyFilters,
  onClearFilters,
  loading = false,
}: SalaryReportFiltersProps) {
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [includePaidOnly, setIncludePaidOnly] = useState(false);
  const [includeUnpaid, setIncludeUnpaid] = useState(false);

  const handleApply = () => {
    const filters: SalaryReportFilters = {};

    if (startDate) filters.start_date = startDate;
    if (endDate) filters.end_date = endDate;
    if (includePaidOnly) filters.include_paid_only = true;
    if (includeUnpaid) filters.include_unpaid = true;

    onApplyFilters(filters);
  };

  const handleClear = () => {
    setStartDate('');
    setEndDate('');
    setIncludePaidOnly(false);
    setIncludeUnpaid(false);
    onClearFilters();
  };

  // Generate date range presets
  const getPresetDates = () => {
    const today = new Date();
    const currentYear = today.getFullYear();
    const currentMonth = today.getMonth();

    return {
      thisMonth: {
        start: new Date(currentYear, currentMonth, 1).toISOString().split('T')[0],
        end: new Date(currentYear, currentMonth + 1, 0).toISOString().split('T')[0],
      },
      lastMonth: {
        start: new Date(currentYear, currentMonth - 1, 1).toISOString().split('T')[0],
        end: new Date(currentYear, currentMonth, 0).toISOString().split('T')[0],
      },
      last3Months: {
        start: new Date(currentYear, currentMonth - 2, 1).toISOString().split('T')[0],
        end: new Date(currentYear, currentMonth + 1, 0).toISOString().split('T')[0],
      },
      thisYear: {
        start: `${currentYear}-01-01`,
        end: `${currentYear}-12-31`,
      },
    };
  };

  const presets = getPresetDates();

  return (
    <div className="bg-card rounded-xl border shadow-sm p-6">
      <h3 className="text-lg font-semibold mb-4">フィルター (Filters)</h3>

      {/* Date Range */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
        <div>
          <Label htmlFor="start-date" className="text-sm font-medium mb-2 block">
            開始日 (Start Date)
          </Label>
          <input
            id="start-date"
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            className="w-full px-3 py-2 border border-input rounded-lg focus:ring-2 focus:ring-primary bg-background"
          />
        </div>

        <div>
          <Label htmlFor="end-date" className="text-sm font-medium mb-2 block">
            終了日 (End Date)
          </Label>
          <input
            id="end-date"
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            className="w-full px-3 py-2 border border-input rounded-lg focus:ring-2 focus:ring-primary bg-background"
          />
        </div>
      </div>

      {/* Date Presets */}
      <div className="mb-4">
        <Label className="text-sm font-medium mb-2 block">クイック選択 (Quick Select)</Label>
        <div className="flex flex-wrap gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => {
              setStartDate(presets.thisMonth.start);
              setEndDate(presets.thisMonth.end);
            }}
          >
            今月
          </Button>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => {
              setStartDate(presets.lastMonth.start);
              setEndDate(presets.lastMonth.end);
            }}
          >
            先月
          </Button>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => {
              setStartDate(presets.last3Months.start);
              setEndDate(presets.last3Months.end);
            }}
          >
            直近3ヶ月
          </Button>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => {
              setStartDate(presets.thisYear.start);
              setEndDate(presets.thisYear.end);
            }}
          >
            今年
          </Button>
        </div>
      </div>

      {/* Status Filters */}
      <div className="mb-6">
        <Label className="text-sm font-medium mb-3 block">支払状態 (Payment Status)</Label>
        <div className="space-y-3">
          <div className="flex items-center space-x-2">
            <Checkbox
              id="paid-only"
              checked={includePaidOnly}
              onCheckedChange={(checked) => setIncludePaidOnly(checked === true)}
            />
            <Label htmlFor="paid-only" className="text-sm cursor-pointer">
              支払済みのみ (Paid only)
            </Label>
          </div>

          <div className="flex items-center space-x-2">
            <Checkbox
              id="unpaid"
              checked={includeUnpaid}
              onCheckedChange={(checked) => setIncludeUnpaid(checked === true)}
            />
            <Label htmlFor="unpaid" className="text-sm cursor-pointer">
              未払いのみ (Unpaid only)
            </Label>
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex gap-3">
        <Button onClick={handleApply} disabled={loading} className="flex-1">
          {loading ? '処理中...' : 'レポート生成'}
        </Button>
        <Button onClick={handleClear} variant="outline" disabled={loading}>
          クリア
        </Button>
      </div>
    </div>
  );
}
