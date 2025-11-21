'use client';

import React, { useState } from 'react';
import {
  CurrencyYenIcon,
  PlusIcon,
  TrashIcon,
  GiftIcon,
  TruckIcon,
  HomeIcon,
} from '@heroicons/react/24/outline';

interface Bonuses {
  attendance_bonus: number;
  perfect_attendance_bonus: number;
  transportation_allowance: number;
  meal_allowance: number;
  housing_allowance: number;
  other_allowances: Record<string, number> | null;
}

interface BonusesConfigProps {
  config: Bonuses;
  onChange: (config: Bonuses) => void;
}

export default function BonusesConfig({ config, onChange }: BonusesConfigProps) {
  const [newAllowanceName, setNewAllowanceName] = useState('');
  const [newAllowanceAmount, setNewAllowanceAmount] = useState<number>(0);
  const [isAddingCustom, setIsAddingCustom] = useState(false);

  const handleChange = (field: keyof Bonuses, value: number) => {
    onChange({
      ...config,
      [field]: value,
    });
  };

  const handleAddCustomAllowance = () => {
    if (!newAllowanceName.trim()) {
      alert('手当名を入力してください');
      return;
    }

    const updatedOtherAllowances = {
      ...(config.other_allowances || {}),
      [newAllowanceName]: newAllowanceAmount,
    };

    onChange({
      ...config,
      other_allowances: updatedOtherAllowances,
    });

    setNewAllowanceName('');
    setNewAllowanceAmount(0);
    setIsAddingCustom(false);
  };

  const handleRemoveCustomAllowance = (key: string) => {
    if (!config.other_allowances) return;

    const { [key]: removed, ...remaining } = config.other_allowances;

    onChange({
      ...config,
      other_allowances: Object.keys(remaining).length > 0 ? remaining : null,
    });
  };

  const formatYen = (amount: number): string => {
    return `¥${amount.toLocaleString()}`;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h3 className="text-lg font-semibold">ボーナス・手当設定</h3>
        <p className="text-sm text-muted-foreground">
          月次ボーナスと各種手当を設定します
        </p>
      </div>

      {/* Bonuses Section */}
      <div>
        <h4 className="font-medium mb-3 flex items-center gap-2">
          <GiftIcon className="h-5 w-5 text-green-600" />
          月次ボーナス
        </h4>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Attendance Bonus */}
          <div className="border rounded-lg p-4">
            <label className="block text-sm font-medium mb-2">
              出勤ボーナス
            </label>
            <p className="text-xs text-muted-foreground mb-2">
              月次の通常出勤に対するボーナス
            </p>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                ¥
              </span>
              <input
                type="number"
                min="0"
                step="1000"
                value={config.attendance_bonus}
                onChange={(e) => handleChange('attendance_bonus', parseInt(e.target.value) || 0)}
                className="w-full pl-8 pr-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
            <p className="text-right text-sm font-medium text-green-600 mt-2">
              {formatYen(config.attendance_bonus)}
            </p>
          </div>

          {/* Perfect Attendance Bonus */}
          <div className="border rounded-lg p-4">
            <label className="block text-sm font-medium mb-2">
              皆勤ボーナス
            </label>
            <p className="text-xs text-muted-foreground mb-2">
              無遅刻・無欠勤の場合の追加ボーナス
            </p>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                ¥
              </span>
              <input
                type="number"
                min="0"
                step="1000"
                value={config.perfect_attendance_bonus}
                onChange={(e) => handleChange('perfect_attendance_bonus', parseInt(e.target.value) || 0)}
                className="w-full pl-8 pr-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
            <p className="text-right text-sm font-medium text-green-600 mt-2">
              {formatYen(config.perfect_attendance_bonus)}
            </p>
          </div>
        </div>
      </div>

      {/* Allowances Section */}
      <div>
        <h4 className="font-medium mb-3 flex items-center gap-2">
          <CurrencyYenIcon className="h-5 w-5 text-blue-600" />
          各種手当
        </h4>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Transportation Allowance */}
          <div className="border rounded-lg p-4">
            <div className="flex items-center gap-2 mb-2">
              <TruckIcon className="h-4 w-4 text-blue-600" />
              <label className="text-sm font-medium">交通費</label>
            </div>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                ¥
              </span>
              <input
                type="number"
                min="0"
                step="1000"
                value={config.transportation_allowance}
                onChange={(e) => handleChange('transportation_allowance', parseInt(e.target.value) || 0)}
                className="w-full pl-8 pr-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
            <p className="text-right text-sm font-medium text-blue-600 mt-2">
              {formatYen(config.transportation_allowance)}
            </p>
          </div>

          {/* Meal Allowance */}
          <div className="border rounded-lg p-4">
            <div className="flex items-center gap-2 mb-2">
              <CurrencyYenIcon className="h-4 w-4 text-orange-600" />
              <label className="text-sm font-medium">食事手当</label>
            </div>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                ¥
              </span>
              <input
                type="number"
                min="0"
                step="1000"
                value={config.meal_allowance}
                onChange={(e) => handleChange('meal_allowance', parseInt(e.target.value) || 0)}
                className="w-full pl-8 pr-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
            <p className="text-right text-sm font-medium text-orange-600 mt-2">
              {formatYen(config.meal_allowance)}
            </p>
          </div>

          {/* Housing Allowance */}
          <div className="border rounded-lg p-4">
            <div className="flex items-center gap-2 mb-2">
              <HomeIcon className="h-4 w-4 text-purple-600" />
              <label className="text-sm font-medium">住宅手当</label>
            </div>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                ¥
              </span>
              <input
                type="number"
                min="0"
                step="1000"
                value={config.housing_allowance}
                onChange={(e) => handleChange('housing_allowance', parseInt(e.target.value) || 0)}
                className="w-full pl-8 pr-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
            <p className="text-right text-sm font-medium text-purple-600 mt-2">
              {formatYen(config.housing_allowance)}
            </p>
          </div>
        </div>
      </div>

      {/* Custom Allowances */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h4 className="font-medium flex items-center gap-2">
            <PlusIcon className="h-5 w-5 text-gray-600" />
            その他の手当
          </h4>
          {!isAddingCustom && (
            <button
              onClick={() => setIsAddingCustom(true)}
              className="text-sm px-3 py-1 border rounded-lg hover:bg-accent transition-colors"
            >
              追加
            </button>
          )}
        </div>

        {/* Add Custom Allowance Form */}
        {isAddingCustom && (
          <div className="border rounded-lg p-4 bg-blue-50 dark:bg-blue-950/20 mb-3">
            <h5 className="font-medium mb-3 text-sm">新しい手当を追加</h5>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium mb-1">手当名</label>
                <input
                  type="text"
                  placeholder="例: 資格手当"
                  value={newAllowanceName}
                  onChange={(e) => setNewAllowanceName(e.target.value)}
                  className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">金額 (¥)</label>
                <input
                  type="number"
                  min="0"
                  step="1000"
                  value={newAllowanceAmount}
                  onChange={(e) => setNewAllowanceAmount(parseInt(e.target.value) || 0)}
                  className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>
            </div>
            <div className="flex items-center gap-2 mt-3">
              <button
                onClick={handleAddCustomAllowance}
                className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors text-sm"
              >
                追加
              </button>
              <button
                onClick={() => {
                  setIsAddingCustom(false);
                  setNewAllowanceName('');
                  setNewAllowanceAmount(0);
                }}
                className="px-4 py-2 border rounded-lg hover:bg-accent transition-colors text-sm"
              >
                キャンセル
              </button>
            </div>
          </div>
        )}

        {/* Custom Allowances List */}
        {config.other_allowances && Object.keys(config.other_allowances).length > 0 ? (
          <div className="space-y-2">
            {Object.entries(config.other_allowances).map(([key, value]) => (
              <div key={key} className="flex items-center justify-between border rounded-lg p-3">
                <div>
                  <p className="font-medium">{key}</p>
                  <p className="text-sm text-muted-foreground">{formatYen(value)}</p>
                </div>
                <button
                  onClick={() => handleRemoveCustomAllowance(key)}
                  className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                  title="削除"
                >
                  <TrashIcon className="h-5 w-5" />
                </button>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center text-sm text-muted-foreground py-4 border rounded-lg">
            カスタム手当はありません
          </div>
        )}
      </div>

      {/* Summary */}
      <div className="border rounded-lg p-4 bg-gray-50 dark:bg-gray-900/20">
        <h4 className="font-medium mb-3">合計</h4>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="text-sm text-muted-foreground">月次ボーナス合計</p>
            <p className="text-2xl font-bold text-green-600">
              {formatYen(config.attendance_bonus + config.perfect_attendance_bonus)}
            </p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">各種手当合計</p>
            <p className="text-2xl font-bold text-blue-600">
              {formatYen(
                config.transportation_allowance +
                config.meal_allowance +
                config.housing_allowance +
                (config.other_allowances
                  ? Object.values(config.other_allowances).reduce((sum, val) => sum + val, 0)
                  : 0)
              )}
            </p>
          </div>
        </div>
      </div>

      {/* Help Section */}
      <div className="text-sm text-muted-foreground bg-blue-50 dark:bg-blue-950/20 rounded-lg p-3">
        <p className="font-medium mb-1">💡 ヒント:</p>
        <ul className="list-disc list-inside space-y-1">
          <li>ボーナスは月次で自動的に計算されます</li>
          <li>各種手当は毎月支給されます</li>
          <li>カスタム手当を追加して、工場独自の手当を設定できます</li>
          <li>金額は日本円 (¥) で入力してください</li>
        </ul>
      </div>
    </div>
  );
}
