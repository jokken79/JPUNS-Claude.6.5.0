'use client';

import React, { useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';
import {
  ArrowLeftIcon,
  CheckIcon,
  XMarkIcon,
  ClockIcon,
  CurrencyYenIcon,
  CalendarIcon,
  UserGroupIcon,
  ExclamationTriangleIcon,
} from '@heroicons/react/24/outline';
import { toast } from 'react-hot-toast';
import ShiftManager from '@/components/factory/ShiftManager';
import OvertimeRulesConfig from '@/components/factory/OvertimeRulesConfig';
import BonusesConfig from '@/components/factory/BonusesConfig';
import HolidaysConfig from '@/components/factory/HolidaysConfig';
import AttendanceRulesConfig from '@/components/factory/AttendanceRulesConfig';

interface ShiftConfig {
  shift_name: string;
  start_time: string;
  end_time: string;
  break_minutes: number;
}

interface OvertimeRulesConfig {
  normal_rate_multiplier: number;
  night_rate_multiplier: number;
  holiday_rate_multiplier: number;
  night_start: string;
  night_end: string;
}

interface BonusesConfig {
  attendance_bonus: number;
  perfect_attendance_bonus: number;
  transportation_allowance: number;
  meal_allowance: number;
  housing_allowance: number;
  other_allowances: Record<string, number> | null;
}

interface HolidaysConfig {
  weekly_holidays: string[];
  public_holidays: boolean;
  company_holidays: string[];
}

interface AttendanceRulesConfig {
  late_penalty: number;
  absence_penalty: number;
  early_leave_penalty: number;
  grace_period_minutes: number;
  require_advance_notice: boolean;
}

interface FactoryConfig {
  shifts: ShiftConfig[];
  overtime_rules: OvertimeRulesConfig;
  bonuses: BonusesConfig;
  holidays: HolidaysConfig;
  attendance_rules: AttendanceRulesConfig;
}

interface Factory {
  id: number;
  factory_id: string;
  name: string;
  company_name: string | null;
  plant_name: string | null;
  config: FactoryConfig | null;
}

export default function FactoryConfigPage() {
  const router = useRouter();
  const params = useParams();
  const factoryId = params.factory_id as string;
  const queryClient = useQueryClient();

  const [activeTab, setActiveTab] = useState<'shifts' | 'overtime' | 'bonuses' | 'holidays' | 'attendance'>('shifts');

  // Fetch factory details
  const { data: factory, isLoading } = useQuery({
    queryKey: ['factory', factoryId],
    queryFn: async () => {
      const response = await api.get(`/factories/${factoryId}`);
      return response.data as Factory;
    },
  });

  // Fetch current configuration
  const { data: config, isLoading: configLoading } = useQuery({
    queryKey: ['factory-config', factoryId],
    queryFn: async () => {
      const response = await api.get(`/factories/${factoryId}/config`);
      return response.data as FactoryConfig;
    },
  });

  // Update configuration mutation
  const updateConfigMutation = useMutation({
    mutationFn: async (newConfig: FactoryConfig) => {
      const response = await api.put(`/factories/${factoryId}/config`, newConfig);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['factory-config', factoryId] });
      queryClient.invalidateQueries({ queryKey: ['factory', factoryId] });
      toast.success('設定を保存しました');
    },
    onError: (error: any) => {
      toast.error(`保存に失敗しました: ${error.response?.data?.detail || error.message}`);
    },
  });

  const handleSave = async () => {
    if (!config) return;
    updateConfigMutation.mutate(config);
  };

  if (isLoading || configLoading) {
    return (
      <div className="p-6">
        <div className="text-center py-12">設定を読み込んでいます...</div>
      </div>
    );
  }

  if (!factory || !config) {
    return (
      <div className="p-6">
        <div className="text-center py-12 text-red-500">
          工場が見つかりません。
        </div>
      </div>
    );
  }

  const tabs = [
    { id: 'shifts', label: 'シフト管理', icon: ClockIcon },
    { id: 'overtime', label: '残業ルール', icon: ClockIcon },
    { id: 'bonuses', label: 'ボーナス・手当', icon: CurrencyYenIcon },
    { id: 'holidays', label: '休日設定', icon: CalendarIcon },
    { id: 'attendance', label: '勤怠ルール', icon: UserGroupIcon },
  ] as const;

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button
            onClick={() => router.back()}
            className="p-2 hover:bg-accent rounded-lg transition-colors"
          >
            <ArrowLeftIcon className="h-5 w-5" />
          </button>
          <div>
            <h1 className="text-3xl font-bold">{factory.name}</h1>
            <p className="text-sm text-muted-foreground mt-1">工場設定の管理</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => router.push(`/factories/${factoryId}`)}
            className="flex items-center gap-2 px-4 py-2 border rounded-lg hover:bg-accent transition-colors"
          >
            <XMarkIcon className="h-5 w-5" />
            キャンセル
          </button>
          <button
            onClick={handleSave}
            disabled={updateConfigMutation.isPending}
            className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors disabled:opacity-50"
          >
            <CheckIcon className="h-5 w-5" />
            {updateConfigMutation.isPending ? '保存中...' : '保存'}
          </button>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="bg-card border rounded-lg">
        <div className="border-b">
          <nav className="flex">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-2 px-6 py-4 border-b-2 transition-colors ${
                    activeTab === tab.id
                      ? 'border-primary text-primary font-medium'
                      : 'border-transparent hover:border-gray-300'
                  }`}
                >
                  <Icon className="h-5 w-5" />
                  {tab.label}
                </button>
              );
            })}
          </nav>
        </div>

        {/* Tab Content */}
        <div className="p-6">
          {activeTab === 'shifts' && config && (
            <ShiftManager
              shifts={config.shifts}
              onChange={(newShifts) => {
                queryClient.setQueryData(['factory-config', factoryId], {
                  ...config,
                  shifts: newShifts,
                });
              }}
            />
          )}

          {activeTab === 'overtime' && config && (
            <OvertimeRulesConfig
              config={config.overtime_rules}
              onChange={(newOvertimeRules) => {
                queryClient.setQueryData(['factory-config', factoryId], {
                  ...config,
                  overtime_rules: newOvertimeRules,
                });
              }}
            />
          )}

          {activeTab === 'bonuses' && config && (
            <BonusesConfig
              config={config.bonuses}
              onChange={(newBonuses) => {
                queryClient.setQueryData(['factory-config', factoryId], {
                  ...config,
                  bonuses: newBonuses,
                });
              }}
            />
          )}

          {activeTab === 'holidays' && config && (
            <HolidaysConfig
              config={config.holidays}
              onChange={(newHolidays) => {
                queryClient.setQueryData(['factory-config', factoryId], {
                  ...config,
                  holidays: newHolidays,
                });
              }}
            />
          )}

          {activeTab === 'attendance' && config && (
            <AttendanceRulesConfig
              config={config.attendance_rules}
              onChange={(newAttendanceRules) => {
                queryClient.setQueryData(['factory-config', factoryId], {
                  ...config,
                  attendance_rules: newAttendanceRules,
                });
              }}
            />
          )}
        </div>
      </div>
    </div>
  );
}
