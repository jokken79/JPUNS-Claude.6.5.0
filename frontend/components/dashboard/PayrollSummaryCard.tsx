'use client';

import React from 'react';
import {
  BanknotesIcon,
  UserGroupIcon,
  ClockIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  ArrowTrendingUpIcon,
  ArrowTrendingDownIcon
} from '@heroicons/react/24/outline';

export interface PayrollSummary {
  totalEmployees: number;
  totalGrossAmount: number;
  totalNetAmount: number;
  totalDeductions: number;
  totalHours: number;
  averageGrossAmount: number;
  statusCounts: {
    draft: number;
    approved: number;
    paid: number;
    cancelled: number;
  };
  comparisonVsPrevious?: {
    grossAmount: number; // percentage change
    netAmount: number;
    employees: number;
  };
}

export interface PayrollSummaryCardProps {
  summary: PayrollSummary;
  periodLabel?: string;
  loading?: boolean;
  onViewDetails?: () => void;
}

/**
 * PayrollSummaryCard - Payroll Overview Component
 *
 * Displays comprehensive payroll summary with:
 * - Total amounts (gross, net, deductions)
 * - Employee and hours statistics
 * - Status breakdown
 * - Comparison with previous period
 * - Quick action buttons
 */
export function PayrollSummaryCard({
  summary,
  periodLabel = 'Current Period',
  loading = false,
  onViewDetails
}: PayrollSummaryCardProps) {
  const formatCurrency = (amount: number) => {
    return `¥${amount.toLocaleString('ja-JP')}`;
  };

  const formatPercentage = (value: number) => {
    const sign = value >= 0 ? '+' : '';
    return `${sign}${value.toFixed(1)}%`;
  };

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow p-6 animate-pulse">
        <div className="h-6 bg-gray-200 rounded w-1/2 mb-4"></div>
        <div className="grid grid-cols-2 gap-4 mb-4">
          <div className="h-20 bg-gray-200 rounded"></div>
          <div className="h-20 bg-gray-200 rounded"></div>
        </div>
        <div className="h-32 bg-gray-200 rounded"></div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow hover:shadow-lg transition-shadow p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
            <BanknotesIcon className="h-6 w-6 text-green-500" />
            Payroll Summary
          </h3>
          <p className="text-sm text-gray-500 mt-1">{periodLabel}</p>
        </div>
        {onViewDetails && (
          <button
            onClick={onViewDetails}
            className="px-4 py-2 text-sm font-medium text-blue-700 bg-blue-50 border border-blue-300 rounded-md hover:bg-blue-100 transition"
          >
            View Details
          </button>
        )}
      </div>

      {/* Main Statistics */}
      <div className="grid grid-cols-2 gap-4 mb-6">
        {/* Total Gross Amount */}
        <div className="bg-green-50 rounded-lg p-4 border border-green-200">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm font-medium text-green-700">Total Gross</p>
            {summary.comparisonVsPrevious && (
              <div className={`flex items-center text-xs ${
                summary.comparisonVsPrevious.grossAmount >= 0 ? 'text-green-600' : 'text-red-600'
              }`}>
                {summary.comparisonVsPrevious.grossAmount >= 0 ? (
                  <ArrowTrendingUpIcon className="h-4 w-4 mr-1" />
                ) : (
                  <ArrowTrendingDownIcon className="h-4 w-4 mr-1" />
                )}
                {formatPercentage(summary.comparisonVsPrevious.grossAmount)}
              </div>
            )}
          </div>
          <p className="text-2xl font-bold text-green-900">
            {formatCurrency(summary.totalGrossAmount)}
          </p>
        </div>

        {/* Total Net Amount */}
        <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm font-medium text-blue-700">Total Net</p>
            {summary.comparisonVsPrevious && (
              <div className={`flex items-center text-xs ${
                summary.comparisonVsPrevious.netAmount >= 0 ? 'text-green-600' : 'text-red-600'
              }`}>
                {summary.comparisonVsPrevious.netAmount >= 0 ? (
                  <ArrowTrendingUpIcon className="h-4 w-4 mr-1" />
                ) : (
                  <ArrowTrendingDownIcon className="h-4 w-4 mr-1" />
                )}
                {formatPercentage(summary.comparisonVsPrevious.netAmount)}
              </div>
            )}
          </div>
          <p className="text-2xl font-bold text-blue-900">
            {formatCurrency(summary.totalNetAmount)}
          </p>
        </div>

        {/* Total Deductions */}
        <div className="bg-orange-50 rounded-lg p-4 border border-orange-200">
          <p className="text-sm font-medium text-orange-700 mb-2">Total Deductions</p>
          <p className="text-2xl font-bold text-orange-900">
            {formatCurrency(summary.totalDeductions)}
          </p>
        </div>

        {/* Average Gross */}
        <div className="bg-purple-50 rounded-lg p-4 border border-purple-200">
          <p className="text-sm font-medium text-purple-700 mb-2">Avg per Employee</p>
          <p className="text-2xl font-bold text-purple-900">
            {formatCurrency(summary.averageGrossAmount)}
          </p>
        </div>
      </div>

      {/* Employee and Hours Statistics */}
      <div className="grid grid-cols-2 gap-4 mb-6">
        <div className="flex items-center gap-3 bg-gray-50 rounded-lg p-4">
          <div className="bg-blue-500 rounded-full p-2">
            <UserGroupIcon className="h-5 w-5 text-white" />
          </div>
          <div>
            <p className="text-sm text-gray-600">Total Employees</p>
            <p className="text-xl font-bold text-gray-900">{summary.totalEmployees}</p>
            {summary.comparisonVsPrevious && (
              <p className={`text-xs ${
                summary.comparisonVsPrevious.employees >= 0 ? 'text-green-600' : 'text-red-600'
              }`}>
                {formatPercentage(summary.comparisonVsPrevious.employees)} vs previous
              </p>
            )}
          </div>
        </div>

        <div className="flex items-center gap-3 bg-gray-50 rounded-lg p-4">
          <div className="bg-indigo-500 rounded-full p-2">
            <ClockIcon className="h-5 w-5 text-white" />
          </div>
          <div>
            <p className="text-sm text-gray-600">Total Hours</p>
            <p className="text-xl font-bold text-gray-900">
              {summary.totalHours.toLocaleString()}
            </p>
            <p className="text-xs text-gray-500">
              {(summary.totalHours / summary.totalEmployees).toFixed(1)} avg/employee
            </p>
          </div>
        </div>
      </div>

      {/* Status Breakdown */}
      <div className="border-t border-gray-200 pt-4">
        <p className="text-sm font-medium text-gray-700 mb-3">Payroll Run Status</p>
        <div className="grid grid-cols-4 gap-3">
          {/* Draft */}
          <div className="text-center p-3 bg-gray-50 rounded-lg">
            <ExclamationTriangleIcon className="h-6 w-6 text-gray-500 mx-auto mb-1" />
            <p className="text-lg font-bold text-gray-900">{summary.statusCounts.draft}</p>
            <p className="text-xs text-gray-600">Draft</p>
          </div>

          {/* Approved */}
          <div className="text-center p-3 bg-blue-50 rounded-lg">
            <CheckCircleIcon className="h-6 w-6 text-blue-500 mx-auto mb-1" />
            <p className="text-lg font-bold text-blue-900">{summary.statusCounts.approved}</p>
            <p className="text-xs text-blue-600">Approved</p>
          </div>

          {/* Paid */}
          <div className="text-center p-3 bg-green-50 rounded-lg">
            <CheckCircleIcon className="h-6 w-6 text-green-500 mx-auto mb-1" />
            <p className="text-lg font-bold text-green-900">{summary.statusCounts.paid}</p>
            <p className="text-xs text-green-600">Paid</p>
          </div>

          {/* Cancelled */}
          <div className="text-center p-3 bg-red-50 rounded-lg">
            <ExclamationTriangleIcon className="h-6 w-6 text-red-500 mx-auto mb-1" />
            <p className="text-lg font-bold text-red-900">{summary.statusCounts.cancelled}</p>
            <p className="text-xs text-red-600">Cancelled</p>
          </div>
        </div>
      </div>

      {/* Insights */}
      {summary.statusCounts.draft > 0 && (
        <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
          <p className="text-sm text-yellow-800">
            <ExclamationTriangleIcon className="h-4 w-4 inline mr-1" />
            <strong>{summary.statusCounts.draft}</strong> payroll run(s) awaiting approval
          </p>
        </div>
      )}
    </div>
  );
}
