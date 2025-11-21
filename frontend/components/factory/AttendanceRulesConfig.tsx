'use client';

import React from 'react';
import {
  ClockIcon,
  ExclamationTriangleIcon,
  BellAlertIcon,
  CheckCircleIcon,
  XCircleIcon,
} from '@heroicons/react/24/outline';

interface AttendanceRules {
  late_penalty: number;
  absence_penalty: number;
  early_leave_penalty: number;
  grace_period_minutes: number;
  require_advance_notice: boolean;
}

interface AttendanceRulesConfigProps {
  config: AttendanceRules;
  onChange: (config: AttendanceRules) => void;
}

export default function AttendanceRulesConfig({ config, onChange }: AttendanceRulesConfigProps) {
  const handleChange = (field: keyof AttendanceRules, value: number | boolean) => {
    onChange({
      ...config,
      [field]: value,
    });
  };

  const formatYen = (amount: number): string => {
    return `¥${amount.toLocaleString()}`;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h3 className="text-lg font-semibold">勤怠ルール設定</h3>
        <p className="text-sm text-muted-foreground">
          遅刻・欠勤・早退に対するペナルティと勤怠管理ルールを設定します
        </p>
      </div>

      {/* Penalties Section */}
      <div>
        <h4 className="font-medium mb-3 flex items-center gap-2">
          <ExclamationTriangleIcon className="h-5 w-5 text-orange-600" />
          ペナルティ設定
        </h4>
        <p className="text-sm text-muted-foreground mb-4">
          各種違反に対する金銭的ペナルティを設定します
        </p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Late Penalty */}
          <div className="border rounded-lg p-4">
            <div className="flex items-center gap-2 mb-3">
              <ClockIcon className="h-5 w-5 text-yellow-600" />
              <label className="text-sm font-medium">遅刻ペナルティ</label>
            </div>
            <p className="text-xs text-muted-foreground mb-3">
              猶予期間を超えた遅刻に対するペナルティ
            </p>
            <div className="relative mb-2">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                ¥
              </span>
              <input
                type="number"
                min="0"
                step="100"
                value={config.late_penalty}
                onChange={(e) => handleChange('late_penalty', parseInt(e.target.value) || 0)}
                className="w-full pl-8 pr-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
            <p className="text-right text-lg font-bold text-yellow-600">
              {formatYen(config.late_penalty)}
            </p>
          </div>

          {/* Absence Penalty */}
          <div className="border rounded-lg p-4">
            <div className="flex items-center gap-2 mb-3">
              <XCircleIcon className="h-5 w-5 text-red-600" />
              <label className="text-sm font-medium">欠勤ペナルティ</label>
            </div>
            <p className="text-xs text-muted-foreground mb-3">
              無断欠勤または承認なしの欠勤に対するペナルティ
            </p>
            <div className="relative mb-2">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                ¥
              </span>
              <input
                type="number"
                min="0"
                step="100"
                value={config.absence_penalty}
                onChange={(e) => handleChange('absence_penalty', parseInt(e.target.value) || 0)}
                className="w-full pl-8 pr-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
            <p className="text-right text-lg font-bold text-red-600">
              {formatYen(config.absence_penalty)}
            </p>
          </div>

          {/* Early Leave Penalty */}
          <div className="border rounded-lg p-4">
            <div className="flex items-center gap-2 mb-3">
              <ClockIcon className="h-5 w-5 text-orange-600" />
              <label className="text-sm font-medium">早退ペナルティ</label>
            </div>
            <p className="text-xs text-muted-foreground mb-3">
              承認なしの早退に対するペナルティ
            </p>
            <div className="relative mb-2">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                ¥
              </span>
              <input
                type="number"
                min="0"
                step="100"
                value={config.early_leave_penalty}
                onChange={(e) => handleChange('early_leave_penalty', parseInt(e.target.value) || 0)}
                className="w-full pl-8 pr-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
            <p className="text-right text-lg font-bold text-orange-600">
              {formatYen(config.early_leave_penalty)}
            </p>
          </div>
        </div>
      </div>

      {/* Grace Period */}
      <div className="border rounded-lg p-4">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
            <ClockIcon className="h-5 w-5 text-blue-600 dark:text-blue-400" />
          </div>
          <div className="flex-1">
            <h4 className="font-medium">猶予期間</h4>
            <p className="text-sm text-muted-foreground">
              遅刻とみなさない許容時間（分単位）
            </p>
          </div>
          <div className="text-right">
            <p className="text-3xl font-bold text-blue-600">{config.grace_period_minutes}</p>
            <p className="text-sm text-muted-foreground">分</p>
          </div>
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm text-muted-foreground">
            <span>0分 (猶予なし)</span>
            <span>60分 (最大)</span>
          </div>
          <input
            type="range"
            min="0"
            max="60"
            step="5"
            value={config.grace_period_minutes}
            onChange={(e) => handleChange('grace_period_minutes', parseInt(e.target.value))}
            className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer dark:bg-gray-700"
          />
          <div className="flex items-center gap-2">
            <input
              type="number"
              min="0"
              max="60"
              step="5"
              value={config.grace_period_minutes}
              onChange={(e) => handleChange('grace_period_minutes', parseInt(e.target.value) || 0)}
              className="w-24 px-3 py-2 border rounded-lg text-center focus:outline-none focus:ring-2 focus:ring-primary"
            />
            <span className="text-sm text-muted-foreground">分</span>
          </div>
        </div>

        {/* Grace Period Info */}
        <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-950/20 rounded-lg">
          <p className="text-sm text-blue-800 dark:text-blue-300">
            💡 例: 猶予期間が{config.grace_period_minutes}分の場合、勤務開始時刻から{config.grace_period_minutes}分以内の到着は遅刻とみなされません
          </p>
        </div>
      </div>

      {/* Advance Notice Requirement */}
      <div className="border rounded-lg p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3 flex-1">
            <div className={`p-2 rounded-lg ${
              config.require_advance_notice
                ? 'bg-green-100 dark:bg-green-900/30'
                : 'bg-gray-100 dark:bg-gray-900/30'
            }`}>
              <BellAlertIcon className={`h-5 w-5 ${
                config.require_advance_notice
                  ? 'text-green-600 dark:text-green-400'
                  : 'text-gray-600 dark:text-gray-400'
              }`} />
            </div>
            <div className="flex-1">
              <h4 className="font-medium">事前通知の要求</h4>
              <p className="text-sm text-muted-foreground">
                欠勤・早退時に事前連絡を必須とする
              </p>
            </div>
          </div>
          <button
            onClick={() => handleChange('require_advance_notice', !config.require_advance_notice)}
            className={`
              relative inline-flex h-6 w-11 items-center rounded-full transition-colors
              ${config.require_advance_notice ? 'bg-green-600' : 'bg-gray-200'}
            `}
          >
            <span
              className={`
                inline-block h-4 w-4 transform rounded-full bg-white transition-transform
                ${config.require_advance_notice ? 'translate-x-6' : 'translate-x-1'}
              `}
            />
          </button>
        </div>

        {config.require_advance_notice && (
          <div className="mt-3 p-3 bg-green-50 dark:bg-green-950/20 rounded-lg">
            <p className="text-sm text-green-800 dark:text-green-300">
              ✓ 従業員は欠勤・早退時に事前連絡が必要です。連絡なしの場合、ペナルティが適用されます。
            </p>
          </div>
        )}

        {!config.require_advance_notice && (
          <div className="mt-3 p-3 bg-gray-50 dark:bg-gray-900/20 rounded-lg">
            <p className="text-sm text-gray-700 dark:text-gray-300">
              事前通知は任意です。ただし、連絡がない場合でもペナルティは適用されます。
            </p>
          </div>
        )}
      </div>

      {/* Summary */}
      <div className="border rounded-lg p-4 bg-gray-50 dark:bg-gray-900/20">
        <h4 className="font-medium mb-3">勤怠ルールサマリー</h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <p className="text-sm text-muted-foreground mb-2">ペナルティ合計（最大）</p>
            <p className="text-2xl font-bold text-red-600">
              {formatYen(
                config.late_penalty +
                config.absence_penalty +
                config.early_leave_penalty
              )}
            </p>
          </div>
          <div className="space-y-2 text-sm">
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">猶予期間</span>
              <span className="font-medium">{config.grace_period_minutes}分</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">事前通知</span>
              <span className={`font-medium ${
                config.require_advance_notice ? 'text-green-600' : 'text-gray-600'
              }`}>
                {config.require_advance_notice ? '必須' : '任意'}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Rules Examples */}
      <div className="border rounded-lg p-4 bg-purple-50 dark:bg-purple-950/20">
        <h4 className="font-medium mb-3 flex items-center gap-2">
          <CheckCircleIcon className="h-5 w-5 text-purple-600" />
          適用例
        </h4>
        <div className="space-y-3 text-sm">
          <div className="flex items-start gap-2">
            <span className="font-medium min-w-[60px]">遅刻:</span>
            <span className="text-muted-foreground">
              勤務開始時刻から{config.grace_period_minutes}分後までの到着は猶予、
              それ以降は{formatYen(config.late_penalty)}のペナルティ
            </span>
          </div>
          <div className="flex items-start gap-2">
            <span className="font-medium min-w-[60px]">欠勤:</span>
            <span className="text-muted-foreground">
              {config.require_advance_notice ? '事前連絡なしの' : '承認なしの'}
              欠勤は{formatYen(config.absence_penalty)}のペナルティ
            </span>
          </div>
          <div className="flex items-start gap-2">
            <span className="font-medium min-w-[60px]">早退:</span>
            <span className="text-muted-foreground">
              {config.require_advance_notice ? '事前連絡なしの' : '承認なしの'}
              早退は{formatYen(config.early_leave_penalty)}のペナルティ
            </span>
          </div>
        </div>
      </div>

      {/* Help Section */}
      <div className="text-sm text-muted-foreground bg-blue-50 dark:bg-blue-950/20 rounded-lg p-3">
        <p className="font-medium mb-1">💡 ヒント:</p>
        <ul className="list-disc list-inside space-y-1">
          <li>ペナルティ金額は給与計算時に自動的に差し引かれます</li>
          <li>猶予期間は交通遅延などの軽微な遅刻を考慮したものです</li>
          <li>事前通知を必須にすることで、無断欠勤を防ぐことができます</li>
          <li>これらの設定は労働法規を遵守するように設定してください</li>
        </ul>
      </div>
    </div>
  );
}
