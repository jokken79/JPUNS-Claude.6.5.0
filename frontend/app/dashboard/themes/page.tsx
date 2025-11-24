'use client';

import React, { useState } from 'react';
import { toast } from 'react-hot-toast';
import { CheckIcon } from '@heroicons/react/24/outline';

interface Theme {
  id: string;
  name: string;
  description: string;
  colors: {
    primary: string;
    secondary: string;
    accent: string;
  };
  preview?: string;
}

const themes: Theme[] = [
  {
    id: 'light',
    name: 'ライト',
    description: '明るく、クリーンなテーマ',
    colors: {
      primary: '#3B82F6',
      secondary: '#10B981',
      accent: '#F59E0B',
    },
  },
  {
    id: 'dark',
    name: 'ダーク',
    description: '目に優しい暗いテーマ',
    colors: {
      primary: '#60A5FA',
      secondary: '#34D399',
      accent: '#FBBF24',
    },
  },
  {
    id: 'system',
    name: 'システム設定に従う',
    description: 'システムの設定に合わせて自動切り替え',
    colors: {
      primary: '#8B5CF6',
      secondary: '#EC4899',
      accent: '#F97316',
    },
  },
  {
    id: 'blue',
    name: 'ブルー',
    description: 'エレガントなブルーテーマ',
    colors: {
      primary: '#2563EB',
      secondary: '#0EA5E9',
      accent: '#06B6D4',
    },
  },
];

export default function ThemesPage() {
  const [selectedTheme, setSelectedTheme] = useState<string>('light');

  const handleThemeChange = (themeId: string) => {
    setSelectedTheme(themeId);
    toast.success(`テーマを「${themes.find(t => t.id === themeId)?.name}」に変更しました`);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-4xl font-black text-slate-900 dark:text-white tracking-tight">
            テーマ管理
          </h1>
          <p className="text-slate-600 dark:text-slate-400 mt-2 text-lg">
            アプリケーションの外観をカスタマイズできます
          </p>
        </div>
      </div>

      {/* Themes Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {themes.map((theme) => (
          <button
            key={theme.id}
            onClick={() => handleThemeChange(theme.id)}
            className={`group relative overflow-hidden rounded-2xl border-2 transition-all duration-300 ${
              selectedTheme === theme.id
                ? 'border-blue-600 bg-blue-50 dark:bg-blue-950'
                : 'border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600'
            }`}
          >
            {/* Theme Preview */}
            <div className="p-6 space-y-4">
              {/* Color Swatches */}
              <div className="flex gap-2">
                <div
                  className="w-8 h-8 rounded-lg shadow-md"
                  style={{ backgroundColor: theme.colors.primary }}
                  title="Primary Color"
                />
                <div
                  className="w-8 h-8 rounded-lg shadow-md"
                  style={{ backgroundColor: theme.colors.secondary }}
                  title="Secondary Color"
                />
                <div
                  className="w-8 h-8 rounded-lg shadow-md"
                  style={{ backgroundColor: theme.colors.accent }}
                  title="Accent Color"
                />
              </div>

              {/* Theme Info */}
              <div className="text-left">
                <h3 className="font-bold text-slate-900 dark:text-white text-base">
                  {theme.name}
                </h3>
                <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">
                  {theme.description}
                </p>
              </div>
            </div>

            {/* Selection Indicator */}
            {selectedTheme === theme.id && (
              <div className="absolute top-3 right-3 bg-blue-600 text-white rounded-full p-1 shadow-lg">
                <CheckIcon className="w-4 h-4" />
              </div>
            )}
          </button>
        ))}
      </div>

      {/* Info Card */}
      <div className="bg-blue-50 dark:bg-blue-950 border-l-4 border-blue-600 rounded-lg p-4">
        <h3 className="font-bold text-blue-900 dark:text-blue-100 mb-2">
          💡 ヒント
        </h3>
        <p className="text-blue-800 dark:text-blue-200 text-sm">
          選択したテーマはお使いのブラウザに自動保存されます。別のデバイスで同期するには、アカウント設定で同期を有効にしてください。
        </p>
      </div>

      {/* Advanced Settings */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-700 p-6 space-y-4">
        <h3 className="font-bold text-slate-900 dark:text-white text-lg">
          詳細設定
        </h3>

        <div className="space-y-4">
          {/* Auto Dark Mode */}
          <label className="flex items-center gap-3 cursor-pointer">
            <input
              type="checkbox"
              className="w-5 h-5 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
              defaultChecked={true}
            />
            <div>
              <p className="font-semibold text-slate-900 dark:text-white">
                夜間に自動でダークモードに切り替え
              </p>
              <p className="text-sm text-slate-600 dark:text-slate-400">
                デバイス設定に基づいて自動的にテーマを変更します
              </p>
            </div>
          </label>

          {/* Reduced Motion */}
          <label className="flex items-center gap-3 cursor-pointer">
            <input
              type="checkbox"
              className="w-5 h-5 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
              defaultChecked={false}
            />
            <div>
              <p className="font-semibold text-slate-900 dark:text-white">
                動作を減らす (アクセシビリティ)
              </p>
              <p className="text-sm text-slate-600 dark:text-slate-400">
                アニメーションとトランジションを最小化します
              </p>
            </div>
          </label>

          {/* High Contrast */}
          <label className="flex items-center gap-3 cursor-pointer">
            <input
              type="checkbox"
              className="w-5 h-5 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
              defaultChecked={false}
            />
            <div>
              <p className="font-semibold text-slate-900 dark:text-white">
                高コントラストモード
              </p>
              <p className="text-sm text-slate-600 dark:text-slate-400">
                より高いコントラストで視認性を向上させます
              </p>
            </div>
          </label>
        </div>
      </div>
    </div>
  );
}
