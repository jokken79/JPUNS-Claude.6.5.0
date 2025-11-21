'use client';

import React, { useState } from 'react';
import {
  CalendarIcon,
  PlusIcon,
  TrashIcon,
  CheckIcon,
  XMarkIcon,
} from '@heroicons/react/24/outline';

interface HolidaysConfig {
  weekly_holidays: string[];
  public_holidays: boolean;
  company_holidays: string[];
}

interface HolidaysConfigProps {
  config: HolidaysConfig;
  onChange: (config: HolidaysConfig) => void;
}

const DAYS_OF_WEEK = [
  { value: '月', label: '月曜日', abbr: '月' },
  { value: '火', label: '火曜日', abbr: '火' },
  { value: '水', label: '水曜日', abbr: '水' },
  { value: '木', label: '木曜日', abbr: '木' },
  { value: '金', label: '金曜日', abbr: '金' },
  { value: '土', label: '土曜日', abbr: '土' },
  { value: '日', label: '日曜日', abbr: '日' },
];

export default function HolidaysConfig({ config, onChange }: HolidaysConfigProps) {
  const [isAddingHoliday, setIsAddingHoliday] = useState(false);
  const [newHolidayDate, setNewHolidayDate] = useState('');
  const [newHolidayName, setNewHolidayName] = useState('');

  // Toggle weekly holiday
  const toggleWeeklyHoliday = (day: string) => {
    const newWeeklyHolidays = config.weekly_holidays.includes(day)
      ? config.weekly_holidays.filter((d) => d !== day)
      : [...config.weekly_holidays, day];

    onChange({
      ...config,
      weekly_holidays: newWeeklyHolidays,
    });
  };

  // Toggle public holidays
  const togglePublicHolidays = () => {
    onChange({
      ...config,
      public_holidays: !config.public_holidays,
    });
  };

  // Add company holiday
  const handleAddCompanyHoliday = () => {
    if (!newHolidayDate) {
      alert('日付を選択してください');
      return;
    }

    const holidayEntry = newHolidayName.trim()
      ? `${newHolidayDate} - ${newHolidayName}`
      : newHolidayDate;

    if (config.company_holidays.some((h) => h.startsWith(newHolidayDate))) {
      alert('この日付はすでに登録されています');
      return;
    }

    onChange({
      ...config,
      company_holidays: [...config.company_holidays, holidayEntry].sort(),
    });

    setNewHolidayDate('');
    setNewHolidayName('');
    setIsAddingHoliday(false);
  };

  // Remove company holiday
  const handleRemoveCompanyHoliday = (holiday: string) => {
    onChange({
      ...config,
      company_holidays: config.company_holidays.filter((h) => h !== holiday),
    });
  };

  // Parse holiday entry (format: "YYYY-MM-DD - Name" or "YYYY-MM-DD")
  const parseHolidayEntry = (entry: string) => {
    const parts = entry.split(' - ');
    return {
      date: parts[0],
      name: parts[1] || null,
    };
  };

  // Format date for display
  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      const year = date.getFullYear();
      const month = date.getMonth() + 1;
      const day = date.getDate();
      const dayOfWeek = ['日', '月', '火', '水', '木', '金', '土'][date.getDay()];
      return `${year}年${month}月${day}日 (${dayOfWeek})`;
    } catch {
      return dateString;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h3 className="text-lg font-semibold">休日設定</h3>
        <p className="text-sm text-muted-foreground">
          工場の休日と勤務カレンダーを設定します
        </p>
      </div>

      {/* Weekly Holidays */}
      <div className="border rounded-lg p-4">
        <h4 className="font-medium mb-3 flex items-center gap-2">
          <CalendarIcon className="h-5 w-5 text-blue-600" />
          週次休日
        </h4>
        <p className="text-sm text-muted-foreground mb-4">
          毎週の定休日を選択してください（複数選択可）
        </p>

        <div className="grid grid-cols-7 gap-2">
          {DAYS_OF_WEEK.map((day) => {
            const isSelected = config.weekly_holidays.includes(day.value);
            return (
              <button
                key={day.value}
                onClick={() => toggleWeeklyHoliday(day.value)}
                className={`
                  flex flex-col items-center justify-center p-3 rounded-lg border-2 transition-all
                  ${
                    isSelected
                      ? 'border-blue-600 bg-blue-50 dark:bg-blue-950/20'
                      : 'border-gray-200 hover:border-blue-300'
                  }
                `}
              >
                <span className={`text-lg font-bold ${isSelected ? 'text-blue-600' : ''}`}>
                  {day.abbr}
                </span>
                <span className="text-xs text-muted-foreground mt-1">
                  {day.label.replace('曜日', '')}
                </span>
                {isSelected && (
                  <CheckIcon className="h-4 w-4 text-blue-600 mt-1" />
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Public Holidays */}
      <div className="border rounded-lg p-4">
        <div className="flex items-center justify-between">
          <div className="flex-1">
            <h4 className="font-medium mb-1">日本の祝日</h4>
            <p className="text-sm text-muted-foreground">
              国民の祝日を休日として自動的に適用します
            </p>
          </div>
          <button
            onClick={togglePublicHolidays}
            className={`
              relative inline-flex h-6 w-11 items-center rounded-full transition-colors
              ${config.public_holidays ? 'bg-blue-600' : 'bg-gray-200'}
            `}
          >
            <span
              className={`
                inline-block h-4 w-4 transform rounded-full bg-white transition-transform
                ${config.public_holidays ? 'translate-x-6' : 'translate-x-1'}
              `}
            />
          </button>
        </div>

        {config.public_holidays && (
          <div className="mt-3 p-3 bg-blue-50 dark:bg-blue-950/20 rounded-lg">
            <p className="text-sm text-blue-800 dark:text-blue-300">
              ✓ 日本の国民の祝日が自動的に休日として扱われます
            </p>
          </div>
        )}
      </div>

      {/* Company Holidays */}
      <div className="border rounded-lg p-4">
        <div className="flex items-center justify-between mb-3">
          <h4 className="font-medium flex items-center gap-2">
            <CalendarIcon className="h-5 w-5 text-purple-600" />
            会社休日
          </h4>
          {!isAddingHoliday && (
            <button
              onClick={() => setIsAddingHoliday(true)}
              className="flex items-center gap-2 px-3 py-1.5 text-sm border rounded-lg hover:bg-accent transition-colors"
            >
              <PlusIcon className="h-4 w-4" />
              追加
            </button>
          )}
        </div>

        <p className="text-sm text-muted-foreground mb-4">
          夏季休暇、年末年始など会社独自の休日を設定します
        </p>

        {/* Add Holiday Form */}
        {isAddingHoliday && (
          <div className="border rounded-lg p-4 bg-purple-50 dark:bg-purple-950/20 mb-3">
            <h5 className="font-medium mb-3 text-sm">新しい休日を追加</h5>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium mb-1">
                  日付 <span className="text-red-500">*</span>
                </label>
                <input
                  type="date"
                  value={newHolidayDate}
                  onChange={(e) => setNewHolidayDate(e.target.value)}
                  className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">
                  休日名（任意）
                </label>
                <input
                  type="text"
                  placeholder="例: 夏季休暇"
                  value={newHolidayName}
                  onChange={(e) => setNewHolidayName(e.target.value)}
                  className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>
            </div>
            <div className="flex items-center gap-2 mt-3">
              <button
                onClick={handleAddCompanyHoliday}
                className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors text-sm"
              >
                追加
              </button>
              <button
                onClick={() => {
                  setIsAddingHoliday(false);
                  setNewHolidayDate('');
                  setNewHolidayName('');
                }}
                className="px-4 py-2 border rounded-lg hover:bg-accent transition-colors text-sm"
              >
                キャンセル
              </button>
            </div>
          </div>
        )}

        {/* Company Holidays List */}
        {config.company_holidays.length > 0 ? (
          <div className="space-y-2">
            {config.company_holidays.map((holiday, index) => {
              const parsed = parseHolidayEntry(holiday);
              return (
                <div
                  key={index}
                  className="flex items-center justify-between border rounded-lg p-3 hover:bg-accent transition-colors"
                >
                  <div>
                    <p className="font-medium">{formatDate(parsed.date)}</p>
                    {parsed.name && (
                      <p className="text-sm text-muted-foreground">{parsed.name}</p>
                    )}
                  </div>
                  <button
                    onClick={() => handleRemoveCompanyHoliday(holiday)}
                    className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                    title="削除"
                  >
                    <TrashIcon className="h-5 w-5" />
                  </button>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="text-center text-sm text-muted-foreground py-4 border rounded-lg">
            会社休日が設定されていません
          </div>
        )}
      </div>

      {/* Summary */}
      <div className="border rounded-lg p-4 bg-gray-50 dark:bg-gray-900/20">
        <h4 className="font-medium mb-3">休日設定サマリー</h4>
        <div className="space-y-3 text-sm">
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground">週次休日</span>
            <span className="font-medium">
              {config.weekly_holidays.length > 0
                ? config.weekly_holidays.join('、')
                : '設定なし'}
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground">日本の祝日</span>
            <span className={`font-medium ${config.public_holidays ? 'text-blue-600' : ''}`}>
              {config.public_holidays ? '含む' : '含まない'}
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground">会社休日数</span>
            <span className="font-medium">{config.company_holidays.length}日</span>
          </div>
        </div>
      </div>

      {/* Help Section */}
      <div className="text-sm text-muted-foreground bg-blue-50 dark:bg-blue-950/20 rounded-lg p-3">
        <p className="font-medium mb-1">💡 ヒント:</p>
        <ul className="list-disc list-inside space-y-1">
          <li>週次休日は毎週繰り返される定休日です（土日など）</li>
          <li>日本の祝日を有効にすると、元日・成人の日などが自動適用されます</li>
          <li>会社休日は夏季休暇や年末年始など特定の日を登録できます</li>
          <li>休日設定は給与計算や勤務時間の計算に使用されます</li>
        </ul>
      </div>
    </div>
  );
}
