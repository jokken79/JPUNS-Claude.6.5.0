'use client';

import React from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import api from '@/lib/api'; // Default axios instance
import {
  ArrowLeftIcon,
  PencilIcon,
  BuildingOfficeIcon,
  MapPinIcon,
  PhoneIcon,
  UserIcon,
  UserGroupIcon,
  CalendarIcon,
  CheckCircleIcon,
  XCircleIcon,
  CogIcon,
} from '@heroicons/react/24/outline';

interface EmployeeBasic {
  id: number;
  hakenmoto_id: number;
  full_name_kanji: string;
  full_name_kana: string | null;
  phone: string | null;
  employment_start_date: string | null;
}

interface Factory {
  id: number;
  factory_id: string;
  name: string;
  company_name: string | null;
  plant_name: string | null;
  address: string | null;
  phone: string | null;
  contact_person: string | null;
  config: any;
  is_active: boolean;
  created_at: string;
  employees_count?: number;
  employees?: EmployeeBasic[];
}

export default function FactoryDetailsPage() {
  const router = useRouter();
  const params = useParams();
  const factoryId = params.factory_id as string;

  // Fetch factory details
  const { data: factory, isLoading, error } = useQuery({
    queryKey: ['factory', factoryId],
    queryFn: async () => {
      const response = await api.get(`/factories/${factoryId}`);
      return response.data as Factory;
    },
  });

  // Status badge component
  const StatusBadge = ({ isActive }: { isActive: boolean }) => {
    return isActive ? (
      <span className="inline-flex items-center gap-1 px-3 py-1 text-sm font-medium rounded-full bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400">
        <CheckCircleIcon className="h-4 w-4" />
        稼働中
      </span>
    ) : (
      <span className="inline-flex items-center gap-1 px-3 py-1 text-sm font-medium rounded-full bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400">
        <XCircleIcon className="h-4 w-4" />
        停止中
      </span>
    );
  };

  // Config badge component
  const ConfigBadge = ({ hasConfig }: { hasConfig: boolean }) => {
    return hasConfig ? (
      <span className="inline-flex items-center gap-1 px-3 py-1 text-sm font-medium rounded-full bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400">
        <CogIcon className="h-4 w-4" />
        設定済み
      </span>
    ) : (
      <span className="inline-flex items-center gap-1 px-3 py-1 text-sm font-medium rounded-full bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400">
        <CogIcon className="h-4 w-4" />
        未設定
      </span>
    );
  };

  // Format date
  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('ja-JP', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  if (isLoading) {
    return (
      <div className="p-6">
        <div className="text-center py-12">工場情報を読み込んでいます...</div>
      </div>
    );
  }

  if (error || !factory) {
    return (
      <div className="p-6">
        <div className="text-center py-12 text-red-500">
          工場情報の読み込みに失敗しました。もう一度お試しください。
        </div>
      </div>
    );
  }

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
            {factory.company_name && (
              <p className="text-sm text-muted-foreground mt-1">
                {factory.company_name}
                {factory.plant_name && ` - ${factory.plant_name}`}
              </p>
            )}
          </div>
          <div className="flex items-center gap-2">
            <StatusBadge isActive={factory.is_active} />
            <ConfigBadge hasConfig={!!factory.config} />
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => router.push(`/factories/${factoryId}/config`)}
            className="flex items-center gap-2 px-4 py-2 border rounded-lg hover:bg-accent transition-colors"
          >
            <PencilIcon className="h-5 w-5" />
            編集
          </button>
        </div>
      </div>

      {/* Main Information */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Details Card */}
        <div className="lg:col-span-2 bg-card border rounded-lg p-6 space-y-6">
          <h2 className="text-xl font-semibold">工場情報</h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="flex items-start gap-3">
              <BuildingOfficeIcon className="h-6 w-6 text-primary mt-1" />
              <div>
                <p className="text-sm text-muted-foreground">工場ID</p>
                <p className="font-medium">{factory.factory_id}</p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <BuildingOfficeIcon className="h-6 w-6 text-primary mt-1" />
              <div>
                <p className="text-sm text-muted-foreground">工場名</p>
                <p className="font-medium">{factory.name}</p>
              </div>
            </div>

            {factory.company_name && (
              <div className="flex items-start gap-3">
                <BuildingOfficeIcon className="h-6 w-6 text-primary mt-1" />
                <div>
                  <p className="text-sm text-muted-foreground">企業名</p>
                  <p className="font-medium">{factory.company_name}</p>
                </div>
              </div>
            )}

            {factory.plant_name && (
              <div className="flex items-start gap-3">
                <BuildingOfficeIcon className="h-6 w-6 text-primary mt-1" />
                <div>
                  <p className="text-sm text-muted-foreground">工場名</p>
                  <p className="font-medium">{factory.plant_name}</p>
                </div>
              </div>
            )}

            {factory.address && (
              <div className="flex items-start gap-3">
                <MapPinIcon className="h-6 w-6 text-primary mt-1" />
                <div>
                  <p className="text-sm text-muted-foreground">住所</p>
                  <p className="font-medium">{factory.address}</p>
                </div>
              </div>
            )}

            {factory.phone && (
              <div className="flex items-start gap-3">
                <PhoneIcon className="h-6 w-6 text-primary mt-1" />
                <div>
                  <p className="text-sm text-muted-foreground">電話番号</p>
                  <p className="font-medium">{factory.phone}</p>
                </div>
              </div>
            )}

            {factory.contact_person && (
              <div className="flex items-start gap-3">
                <UserIcon className="h-6 w-6 text-primary mt-1" />
                <div>
                  <p className="text-sm text-muted-foreground">担当者</p>
                  <p className="font-medium">{factory.contact_person}</p>
                </div>
              </div>
            )}

            <div className="flex items-start gap-3">
              <CalendarIcon className="h-6 w-6 text-primary mt-1" />
              <div>
                <p className="text-sm text-muted-foreground">登録日</p>
                <p className="font-medium">{formatDate(factory.created_at)}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Stats Card */}
        <div className="space-y-4">
          <div className="bg-card border rounded-lg p-6">
            <h3 className="font-semibold mb-4">統計情報</h3>

            <div className="space-y-4">
              <div>
                <p className="text-sm text-muted-foreground">配属従業員数</p>
                <p className="text-2xl font-bold mt-1">{factory.employees_count || 0}</p>
              </div>

              <div className="pt-4 border-t">
                <p className="text-sm text-muted-foreground">状態</p>
                <div className="mt-2">
                  {factory.is_active ? (
                    <span className="text-green-600 dark:text-green-400 font-medium">稼働中</span>
                  ) : (
                    <span className="text-gray-600 dark:text-gray-400 font-medium">停止中</span>
                  )}
                </div>
              </div>

              <div className="pt-4 border-t">
                <p className="text-sm text-muted-foreground">設定状態</p>
                <div className="mt-2">
                  {factory.config ? (
                    <span className="text-blue-600 dark:text-blue-400 font-medium">設定済み</span>
                  ) : (
                    <span className="text-yellow-600 dark:text-yellow-400 font-medium">未設定</span>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Employees List */}
      <div className="bg-card border rounded-lg">
        <div className="p-4 border-b flex items-center justify-between">
          <h2 className="font-semibold">
            配属従業員一覧 ({factory.employees?.length || 0})
          </h2>
        </div>

        {!factory.employees || factory.employees.length === 0 ? (
          <div className="p-8 text-center text-muted-foreground">
            この工場に配属されている従業員はいません。
          </div>
        ) : (
          <div className="divide-y">
            {factory.employees.map((employee) => (
              <div
                key={employee.id}
                className="p-4 hover:bg-accent cursor-pointer transition-colors"
                onClick={() => router.push(`/employees/${employee.id}`)}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="h-12 w-12 bg-primary/10 rounded-full flex items-center justify-center">
                      <UserIcon className="h-6 w-6 text-primary" />
                    </div>
                    <div>
                      <p className="font-medium">{employee.full_name_kanji}</p>
                      {employee.full_name_kana && (
                        <p className="text-sm text-muted-foreground">{employee.full_name_kana}</p>
                      )}
                      <div className="flex items-center gap-4 mt-1">
                        <span className="text-xs text-muted-foreground">
                          ID: {employee.hakenmoto_id}
                        </span>
                        {employee.phone && (
                          <span className="text-xs text-muted-foreground flex items-center gap-1">
                            <PhoneIcon className="h-3 w-3" />
                            {employee.phone}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {employee.employment_start_date && (
                    <div className="text-right">
                      <p className="text-sm text-muted-foreground">配属開始日</p>
                      <p className="text-sm font-medium">{formatDate(employee.employment_start_date)}</p>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
