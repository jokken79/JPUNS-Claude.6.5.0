'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import api from '@/lib/api'; // Default axios instance
import {
  MagnifyingGlassIcon,
  FunnelIcon,
  PlusIcon,
  BuildingOfficeIcon,
  UserGroupIcon,
  ChartBarIcon,
  CogIcon,
  XMarkIcon,
  PencilIcon,
  EyeIcon,
  MapPinIcon,
  PhoneIcon,
  UserIcon,
  CheckCircleIcon,
  XCircleIcon,
} from '@heroicons/react/24/outline';

// Factory interface matching backend schema
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
}

interface FactoryStats {
  total_factories: number;
  total_employees: number;
  factories_with_employees: number;
  empty_factories: number;
  avg_employees_per_factory: number;
}

export default function FactoriesPage() {
  const router = useRouter();
  const [search, setSearch] = useState('');
  const [activeOnly, setActiveOnly] = useState(false);
  const [showFilters, setShowFilters] = useState(false);

  // Fetch factories list
  const { data: factories = [], isLoading: factoriesLoading, error: factoriesError } = useQuery({
    queryKey: ['factories', { search, activeOnly }],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (activeOnly) params.append('is_active', 'true');

      const response = await api.get(`/factories/?${params.toString()}`);
      return response.data as Factory[];
    },
  });

  // Fetch statistics
  const { data: stats, isLoading: statsLoading } = useQuery({
    queryKey: ['factories-stats'],
    queryFn: async () => {
      const response = await api.get('/factories/stats');
      return response.data as FactoryStats;
    },
  });

  // Status badge component
  const StatusBadge = ({ isActive }: { isActive: boolean }) => {
    return isActive ? (
      <span className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium rounded-md bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400">
        <CheckCircleIcon className="h-3 w-3" />
        稼働中
      </span>
    ) : (
      <span className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium rounded-md bg-muted text-muted-foreground">
        <XCircleIcon className="h-3 w-3" />
        停止中
      </span>
    );
  };

  // Config badge component
  const ConfigBadge = ({ hasConfig }: { hasConfig: boolean }) => {
    return hasConfig ? (
      <span className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium rounded-md bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400">
        <CogIcon className="h-3 w-3" />
        設定済み
      </span>
    ) : (
      <span className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium rounded-md bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400">
        <CogIcon className="h-3 w-3" />
        未設定
      </span>
    );
  };

  // Filter factories by search term
  const filteredFactories = factories.filter(factory => {
    if (!search) return true;
    const searchLower = search.toLowerCase();
    return (
      factory.name.toLowerCase().includes(searchLower) ||
      factory.factory_id.toLowerCase().includes(searchLower) ||
      factory.company_name?.toLowerCase().includes(searchLower) ||
      factory.plant_name?.toLowerCase().includes(searchLower) ||
      factory.address?.toLowerCase().includes(searchLower)
    );
  });

  // Clear all filters
  const clearFilters = () => {
    setSearch('');
    setActiveOnly(false);
  };

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">工場管理</h1>
          <p className="text-sm text-muted-foreground mt-1">
            派遣先の管理と設定
          </p>
        </div>
        <button
          onClick={() => router.push('/factories/new')}
          className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
        >
          <PlusIcon className="h-5 w-5" />
          新規工場登録
        </button>
      </div>

      {/* Statistics Cards */}
      {stats && !statsLoading && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-card border rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">総工場数</p>
                <p className="text-2xl font-bold mt-1">{stats.total_factories}</p>
              </div>
              <BuildingOfficeIcon className="h-8 w-8 text-blue-500" />
            </div>
          </div>

          <div className="bg-card border rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">配属従業員数</p>
                <p className="text-2xl font-bold mt-1">{stats.total_employees}</p>
              </div>
              <UserGroupIcon className="h-8 w-8 text-green-500" />
            </div>
          </div>

          <div className="bg-card border rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">稼働中の工場</p>
                <p className="text-2xl font-bold mt-1">{stats.factories_with_employees}</p>
              </div>
              <ChartBarIcon className="h-8 w-8 text-yellow-500" />
            </div>
          </div>

          <div className="bg-card border rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">平均人数/工場</p>
                <p className="text-2xl font-bold mt-1">{stats.avg_employees_per_factory.toFixed(1)}</p>
              </div>
              <UserIcon className="h-8 w-8 text-purple-500" />
            </div>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="bg-card border rounded-lg p-4">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <FunnelIcon className="h-5 w-5" />
            <h2 className="font-semibold">フィルター</h2>
          </div>
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="text-sm text-primary hover:underline"
          >
            {showFilters ? '隠す' : '表示'}
          </button>
        </div>

        {/* Search bar always visible */}
        <div className="relative mb-4">
          <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
          <input
            type="text"
            placeholder="工場名、ID、企業名、工場名、住所で検索..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
          />
        </div>

        {/* Advanced filters */}
        {showFilters && (
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2">
                  <input
                    type="checkbox"
                    checked={activeOnly}
                    onChange={(e) => setActiveOnly(e.target.checked)}
                    className="mr-2"
                  />
                  稼働中のみ
                </label>
              </div>
            </div>

            <button
              onClick={clearFilters}
              className="flex items-center gap-2 px-3 py-1.5 text-sm border rounded-lg hover:bg-accent transition-colors"
            >
              <XMarkIcon className="h-4 w-4" />
              フィルターをクリア
            </button>
          </div>
        )}
      </div>

      {/* Factories Grid */}
      <div className="bg-card border rounded-lg">
        <div className="p-4 border-b">
          <h2 className="font-semibold">
            工場一覧 ({filteredFactories.length})
          </h2>
        </div>

        {factoriesLoading && (
          <div className="p-8 text-center text-muted-foreground">
            読み込み中...
          </div>
        )}

        {factoriesError && (
          <div className="p-8 text-center text-red-500">
            エラーが発生しました。もう一度お試しください。
          </div>
        )}

        {!factoriesLoading && !factoriesError && filteredFactories.length === 0 && (
          <div className="p-8 text-center text-muted-foreground">
            工場が見つかりません。
          </div>
        )}

        {!factoriesLoading && !factoriesError && filteredFactories.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 p-4">
            {filteredFactories.map((factory) => (
              <div
                key={factory.id}
                className="border rounded-lg p-4 hover:shadow-lg transition-shadow cursor-pointer"
                onClick={() => router.push(`/factories/${factory.factory_id}`)}
              >
                {/* Header */}
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-lg truncate">{factory.name}</h3>
                    {factory.company_name && (
                      <p className="text-sm text-muted-foreground truncate">
                        {factory.company_name}
                        {factory.plant_name && ` - ${factory.plant_name}`}
                      </p>
                    )}
                  </div>
                  <div className="flex flex-col gap-1 ml-2">
                    <StatusBadge isActive={factory.is_active} />
                    <ConfigBadge hasConfig={!!factory.config} />
                  </div>
                </div>

                {/* Info */}
                <div className="space-y-2 mb-3 text-sm">
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <BuildingOfficeIcon className="h-4 w-4 flex-shrink-0" />
                    <span className="truncate">{factory.factory_id}</span>
                  </div>

                  {factory.address && (
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <MapPinIcon className="h-4 w-4 flex-shrink-0" />
                      <span className="truncate">{factory.address}</span>
                    </div>
                  )}

                  <div className="flex items-center gap-2 text-muted-foreground">
                    <UserGroupIcon className="h-4 w-4 flex-shrink-0" />
                    <span>従業員: {factory.employees_count || 0}名</span>
                  </div>

                  {factory.contact_person && (
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <UserIcon className="h-4 w-4 flex-shrink-0" />
                      <span className="truncate">{factory.contact_person}</span>
                    </div>
                  )}
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2 pt-3 border-t">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      router.push(`/factories/${factory.factory_id}`);
                    }}
                    className="flex-1 flex items-center justify-center gap-2 px-3 py-1.5 text-sm border rounded hover:bg-accent transition-colors"
                  >
                    <EyeIcon className="h-4 w-4" />
                    詳細
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      router.push(`/factories/${factory.factory_id}/config`);
                    }}
                    className="flex-1 flex items-center justify-center gap-2 px-3 py-1.5 text-sm border rounded hover:bg-accent transition-colors"
                  >
                    <CogIcon className="h-4 w-4" />
                    設定
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
