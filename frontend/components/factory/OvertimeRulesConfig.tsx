'use client';

import React from 'react';
import { ClockIcon, MoonIcon, CalendarIcon } from '@heroicons/react/24/outline';

interface OvertimeRules {
  normal_rate_multiplier: number;
  night_rate_multiplier: number;
  holiday_rate_multiplier: number;
  night_start: string;
  night_end: string;
}

interface OvertimeRulesConfigProps {
  config: OvertimeRules;
  onChange: (config: OvertimeRules) => void;
}

export default function OvertimeRulesConfig({ config, onChange }: OvertimeRulesConfigProps) {
  const handleChange = (field: keyof OvertimeRules, value: number | string) => {
    onChange({
      ...config,
      [field]: value,
    });
  };

  // Validate time format
  const isValidTimeFormat = (time: string): boolean => {
    const regex = /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/;
    return regex.test(time);
  };

  const handleTimeChange = (field: 'night_start' | 'night_end', value: string) => {
    if (value === '' || isValidTimeFormat(value)) {
      handleChange(field, value);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h3 className="text-lg font-semibold">残業ルール設定</h3>
        <p className="text-sm text-muted-foreground">
          残業時間の計算に使用する料率と深夜時間帯を設定します
        </p>
      </div>

      {/* Multipliers Section */}
      <div className="space-y-6">
        {/* Normal Overtime */}
        <div className="border rounded-lg p-4">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
              <ClockIcon className="h-5 w-5 text-blue-600 dark:text-blue-400" />
            </div>
            <div className="flex-1">
              <h4 className="font-medium">通常残業率</h4>
              <p className="text-sm text-muted-foreground">平日の通常時間帯の残業</p>
            </div>
            <div className="text-right">
              <p className="text-3xl font-bold text-blue-600">{config.normal_rate_multiplier}x</p>
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm text-muted-foreground">
              <span>1.0x (通常)</span>
              <span>3.0x (最大)</span>
            </div>
            <input
              type="range"
              min="1.0"
              max="3.0"
              step="0.05"
              value={config.normal_rate_multiplier}
              onChange={(e) => handleChange('normal_rate_multiplier', parseFloat(e.target.value))}
              className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer dark:bg-gray-700"
            />
            <div className="flex items-center gap-2">
              <input
                type="number"
                min="1.0"
                max="3.0"
                step="0.05"
                value={config.normal_rate_multiplier}
                onChange={(e) => handleChange('normal_rate_multiplier', parseFloat(e.target.value) || 1.0)}
                className="w-24 px-3 py-2 border rounded-lg text-center focus:outline-none focus:ring-2 focus:ring-primary"
              />
              <span className="text-sm text-muted-foreground">倍率</span>
            </div>
          </div>
        </div>

        {/* Night Overtime */}
        <div className="border rounded-lg p-4">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
              <MoonIcon className="h-5 w-5 text-purple-600 dark:text-purple-400" />
            </div>
            <div className="flex-1">
              <h4 className="font-medium">深夜残業率</h4>
              <p className="text-sm text-muted-foreground">深夜時間帯の残業 (22:00-05:00)</p>
            </div>
            <div className="text-right">
              <p className="text-3xl font-bold text-purple-600">{config.night_rate_multiplier}x</p>
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm text-muted-foreground">
              <span>1.0x (通常)</span>
              <span>3.0x (最大)</span>
            </div>
            <input
              type="range"
              min="1.0"
              max="3.0"
              step="0.05"
              value={config.night_rate_multiplier}
              onChange={(e) => handleChange('night_rate_multiplier', parseFloat(e.target.value))}
              className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer dark:bg-gray-700"
            />
            <div className="flex items-center gap-2">
              <input
                type="number"
                min="1.0"
                max="3.0"
                step="0.05"
                value={config.night_rate_multiplier}
                onChange={(e) => handleChange('night_rate_multiplier', parseFloat(e.target.value) || 1.0)}
                className="w-24 px-3 py-2 border rounded-lg text-center focus:outline-none focus:ring-2 focus:ring-primary"
              />
              <span className="text-sm text-muted-foreground">倍率</span>
            </div>
          </div>
        </div>

        {/* Holiday Overtime */}
        <div className="border rounded-lg p-4">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-lg">
              <CalendarIcon className="h-5 w-5 text-green-600 dark:text-green-400" />
            </div>
            <div className="flex-1">
              <h4 className="font-medium">休日労働率</h4>
              <p className="text-sm text-muted-foreground">休日・祝日の労働</p>
            </div>
            <div className="text-right">
              <p className="text-3xl font-bold text-green-600">{config.holiday_rate_multiplier}x</p>
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm text-muted-foreground">
              <span>1.0x (通常)</span>
              <span>3.0x (最大)</span>
            </div>
            <input
              type="range"
              min="1.0"
              max="3.0"
              step="0.05"
              value={config.holiday_rate_multiplier}
              onChange={(e) => handleChange('holiday_rate_multiplier', parseFloat(e.target.value))}
              className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer dark:bg-gray-700"
            />
            <div className="flex items-center gap-2">
              <input
                type="number"
                min="1.0"
                max="3.0"
                step="0.05"
                value={config.holiday_rate_multiplier}
                onChange={(e) => handleChange('holiday_rate_multiplier', parseFloat(e.target.value) || 1.0)}
                className="w-24 px-3 py-2 border rounded-lg text-center focus:outline-none focus:ring-2 focus:ring-primary"
              />
              <span className="text-sm text-muted-foreground">倍率</span>
            </div>
          </div>
        </div>
      </div>

      {/* Night Hours Section */}
      <div className="border rounded-lg p-4 bg-gray-50 dark:bg-gray-900/20">
        <h4 className="font-medium mb-4">深夜時間帯の設定</h4>
        <p className="text-sm text-muted-foreground mb-4">
          深夜時間帯を設定します。この時間帯の労働には深夜残業率が適用されます。
        </p>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-2">
              開始時刻 <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              placeholder="22:00"
              value={config.night_start}
              onChange={(e) => handleTimeChange('night_start', e.target.value)}
              className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
            />
            <p className="text-xs text-muted-foreground mt-1">HH:MM 形式 (例: 22:00)</p>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">
              終了時刻 <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              placeholder="05:00"
              value={config.night_end}
              onChange={(e) => handleTimeChange('night_end', e.target.value)}
              className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
            />
            <p className="text-xs text-muted-foreground mt-1">HH:MM 形式 (例: 05:00)</p>
          </div>
        </div>

        {/* Visual representation */}
        <div className="mt-4 p-3 bg-white dark:bg-gray-800 rounded-lg border">
          <p className="text-sm font-medium mb-2">設定内容</p>
          <div className="flex items-center gap-2 text-sm">
            <MoonIcon className="h-4 w-4 text-purple-600" />
            <span className="text-muted-foreground">深夜時間帯:</span>
            <span className="font-medium">
              {config.night_start} 〜 {config.night_end}
            </span>
            <span className="text-muted-foreground">({config.night_rate_multiplier}x)</span>
          </div>
        </div>
      </div>

      {/* Help Section */}
      <div className="text-sm text-muted-foreground bg-blue-50 dark:bg-blue-950/20 rounded-lg p-3">
        <p className="font-medium mb-1">💡 料率について:</p>
        <ul className="list-disc list-inside space-y-1">
          <li>通常残業率: 平日の定時後に働いた時間に適用されます</li>
          <li>深夜残業率: 22:00-05:00 の時間帯に働いた場合に適用されます</li>
          <li>休日労働率: 休日・祝日に働いた場合に適用されます</li>
          <li>日本の労働基準法では最低1.25倍が推奨されています</li>
        </ul>
      </div>
    </div>
  );
}
