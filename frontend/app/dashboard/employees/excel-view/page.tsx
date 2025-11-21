'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { employeeService } from '@/lib/api';
import {
  ArrowLeftIcon,
  MagnifyingGlassIcon,
  UserCircleIcon,
} from '@heroicons/react/24/outline';

// Complete Employee interface with ALL 42+ fields
interface Employee {
  id: number;
  hakenmoto_id: number;
  rirekisho_id: string | null;
  factory_id: string | null;
  factory_name: string | null;
  hakensaki_shain_id: string | null;
  photo_url: string | null;

  // Personal
  full_name_kanji: string;
  full_name_kana: string | null;
  date_of_birth: string | null;
  gender: string | null;
  nationality: string | null;
  address: string | null;
  phone: string | null;
  email: string | null;
  postal_code: string | null;

  // Assignment
  assignment_location: string | null;
  assignment_line: string | null;
  job_description: string | null;

  // Employment
  hire_date: string;
  current_hire_date: string | null;
  entry_request_date: string | null;
  termination_date: string | null;

  // Financial
  jikyu: number;
  jikyu_revision_date: string | null;
  hourly_rate_charged: number | null;
  billing_revision_date: string | null;
  profit_difference: number | null;
  standard_compensation: number | null;
  health_insurance: number | null;
  nursing_insurance: number | null;
  pension_insurance: number | null;
  social_insurance_date: string | null;

  // Visa
  visa_type: string | null;
  zairyu_expire_date: string | null;
  visa_renewal_alert: boolean | null;
  visa_alert_days: number | null;

  // Documents
  license_type: string | null;
  license_expire_date: string | null;
  commute_method: string | null;
  optional_insurance_expire: string | null;
  japanese_level: string | null;
  career_up_5years: boolean | null;

  // Apartment
  apartment_id: number | null;
  apartment_start_date: string | null;
  apartment_move_out_date: string | null;
  apartment_rent: number | null;

  // Yukyu
  yukyu_remaining: number;

  // Status
  current_status: string | null;
  is_active: boolean;
  notes: string | null;
  contract_type: string | null;
}

interface PaginatedResponse {
  items: Employee[];
  total: number;
  page: number;
  page_size: number;
  total_pages: number;
}

export default function ExcelViewPage() {
  const router = useRouter();
  const [searchTerm, setSearchTerm] = useState('');
  const [filterActive, setFilterActive] = useState<boolean | null>(null);
  const pageSize = 1000; // Load all employees for Excel view

  // Fetch ALL employees
  const { data, isLoading } = useQuery<PaginatedResponse>({
    queryKey: ['employees-excel', searchTerm, filterActive],
    queryFn: async (): Promise<PaginatedResponse> => {
      const params: any = {
        page: 1,
        page_size: pageSize,
      };

      if (searchTerm) params.search = searchTerm;
      if (filterActive !== null) params.is_active = filterActive;

      const response = await employeeService.getEmployees(params);
      return response as unknown as PaginatedResponse;
    },
  });

  const employees = data?.items || [];
  const total = data?.total || 0;

  // Helper functions
  const formatDate = (dateString: string | null) => {
    if (!dateString) return '';
    return new Date(dateString).toLocaleDateString('ja-JP');
  };

  const formatCurrency = (amount: number | null) => {
    if (amount === null) return '';
    return `¥${amount.toLocaleString()}`;
  };

  const calculateAge = (dateOfBirth: string | null) => {
    if (!dateOfBirth) return '';
    const today = new Date();
    const birthDate = new Date(dateOfBirth);
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    return `${age}`;
  };

  const getStatusText = (status: string | null) => {
    const statusMap: Record<string, string> = {
      active: '在籍中',
      terminated: '退社済',
      suspended: '休職中',
    };
    return status ? statusMap[status] || status : '';
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-screen bg-card-foreground">
        <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-primary-foreground"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-card-foreground text-primary-foreground">
      {/* Fixed Header */}
      <div className="fixed top-0 left-0 right-0 z-50 bg-card-foreground border-b border-border shadow-lg">
        <div className="flex items-center justify-between px-6 py-4">
          <div className="flex items-center gap-4">
            <button
              onClick={() => router.push('/employees')}
              className="flex items-center gap-2 px-4 py-2 bg-muted hover:bg-accent rounded-lg transition-colors"
            >
              <ArrowLeftIcon className="h-5 w-5" />
              <span className="font-medium">通常表示に戻る</span>
            </button>
            <div>
              <h1 className="text-2xl font-bold text-primary-foreground">従業員管理 - Excel ビュー</h1>
              <p className="text-sm text-muted-foreground">全 {total} 名 | 全列表示モード</p>
            </div>
          </div>

          {/* Quick Search */}
          <div className="flex items-center gap-4">
            <div className="relative">
              <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="検索..."
                className="pl-10 pr-4 py-2 bg-muted border border-input rounded-lg text-primary-foreground placeholder-muted-foreground focus:ring-2 focus:ring-primary focus:border-transparent"
              />
            </div>
            <select
              value={filterActive === null ? '' : filterActive.toString()}
              onChange={(e) => {
                const value = e.target.value;
                setFilterActive(value === '' ? null : value === 'true');
              }}
              className="px-4 py-2 bg-muted border border-input rounded-lg text-primary-foreground focus:ring-2 focus:ring-primary"
            >
              <option value="">全て</option>
              <option value="true">在籍中</option>
              <option value="false">退社済</option>
            </select>
          </div>
        </div>
      </div>

      {/* Excel-style Table - Full Screen */}
      <div className="pt-24 px-4 pb-4">
        <div className="bg-card rounded-lg shadow-2xl overflow-hidden">
          <div className="overflow-x-auto overflow-y-auto" style={{ height: 'calc(100vh - 140px)' }}>
            <table className="w-full border-collapse" style={{ minWidth: '5000px' }}>
              {/* Header Row */}
              <thead className="sticky top-0 z-10">
                <tr className="bg-card-foreground">
                  <th className="px-3 py-2 text-left text-xs font-bold text-primary-foreground border border-input sticky left-0 bg-card-foreground z-20">写真</th>
                  <th className="px-3 py-2 text-left text-xs font-bold text-primary-foreground border border-input">現在</th>
                  <th className="px-3 py-2 text-left text-xs font-bold text-primary-foreground border border-input">社員№</th>
                  <th className="px-3 py-2 text-left text-xs font-bold text-primary-foreground border border-input">派遣先ID</th>
                  <th className="px-3 py-2 text-left text-xs font-bold text-primary-foreground border border-input">派遣先</th>
                  <th className="px-3 py-2 text-left text-xs font-bold text-primary-foreground border border-input">配属先</th>
                  <th className="px-3 py-2 text-left text-xs font-bold text-primary-foreground border border-input">配属ライン</th>
                  <th className="px-3 py-2 text-left text-xs font-bold text-primary-foreground border border-input">仕事内容</th>
                  <th className="px-3 py-2 text-left text-xs font-bold text-primary-foreground border border-input">氏名</th>
                  <th className="px-3 py-2 text-left text-xs font-bold text-primary-foreground border border-input">カナ</th>
                  <th className="px-3 py-2 text-left text-xs font-bold text-primary-foreground border border-input">性別</th>
                  <th className="px-3 py-2 text-left text-xs font-bold text-primary-foreground border border-input">国籍</th>
                  <th className="px-3 py-2 text-left text-xs font-bold text-primary-foreground border border-input">生年月日</th>
                  <th className="px-3 py-2 text-left text-xs font-bold text-primary-foreground border border-input">年齢</th>
                  <th className="px-3 py-2 text-left text-xs font-bold text-primary-foreground border border-input">時給</th>
                  <th className="px-3 py-2 text-left text-xs font-bold text-primary-foreground border border-input">時給改定</th>
                  <th className="px-3 py-2 text-left text-xs font-bold text-primary-foreground border border-input">請求単価</th>
                  <th className="px-3 py-2 text-left text-xs font-bold text-primary-foreground border border-input">請求改定</th>
                  <th className="px-3 py-2 text-left text-xs font-bold text-primary-foreground border border-input">差額利益</th>
                  <th className="px-3 py-2 text-left text-xs font-bold text-primary-foreground border border-input">標準報酬</th>
                  <th className="px-3 py-2 text-left text-xs font-bold text-primary-foreground border border-input">健康保険</th>
                  <th className="px-3 py-2 text-left text-xs font-bold text-primary-foreground border border-input">介護保険</th>
                  <th className="px-3 py-2 text-left text-xs font-bold text-primary-foreground border border-input">厚生年金</th>
                  <th className="px-3 py-2 text-left text-xs font-bold text-primary-foreground border border-input">ビザ期限</th>
                  <th className="px-3 py-2 text-left text-xs font-bold text-primary-foreground border border-input">ビザ種類</th>
                  <th className="px-3 py-2 text-left text-xs font-bold text-primary-foreground border border-input">〒</th>
                  <th className="px-3 py-2 text-left text-xs font-bold text-primary-foreground border border-input">住所</th>
                  <th className="px-3 py-2 text-left text-xs font-bold text-primary-foreground border border-input">電話</th>
                  <th className="px-3 py-2 text-left text-xs font-bold text-primary-foreground border border-input">Email</th>
                  <th className="px-3 py-2 text-left text-xs font-bold text-primary-foreground border border-input">ｱﾊﾟｰﾄ</th>
                  <th className="px-3 py-2 text-left text-xs font-bold text-primary-foreground border border-input">入居</th>
                  <th className="px-3 py-2 text-left text-xs font-bold text-primary-foreground border border-input">入社日</th>
                  <th className="px-3 py-2 text-left text-xs font-bold text-primary-foreground border border-input">現入社</th>
                  <th className="px-3 py-2 text-left text-xs font-bold text-primary-foreground border border-input">退社日</th>
                  <th className="px-3 py-2 text-left text-xs font-bold text-primary-foreground border border-input">退去</th>
                  <th className="px-3 py-2 text-left text-xs font-bold text-primary-foreground border border-input">社保加入</th>
                  <th className="px-3 py-2 text-left text-xs font-bold text-primary-foreground border border-input">入社依頼</th>
                  <th className="px-3 py-2 text-left text-xs font-bold text-primary-foreground border border-input">免許種類</th>
                  <th className="px-3 py-2 text-left text-xs font-bold text-primary-foreground border border-input">免許期限</th>
                  <th className="px-3 py-2 text-left text-xs font-bold text-primary-foreground border border-input">通勤方法</th>
                  <th className="px-3 py-2 text-left text-xs font-bold text-primary-foreground border border-input">任意保険期限</th>
                  <th className="px-3 py-2 text-left text-xs font-bold text-primary-foreground border border-input">日本語検定</th>
                  <th className="px-3 py-2 text-left text-xs font-bold text-primary-foreground border border-input">キャリアアップ5年目</th>
                  <th className="px-3 py-2 text-left text-xs font-bold text-primary-foreground border border-input">有給残</th>
                  <th className="px-3 py-2 text-left text-xs font-bold text-primary-foreground border border-input">備考</th>
                </tr>
              </thead>

              {/* Data Rows */}
              <tbody>
                {employees.length === 0 ? (
                  <tr>
                    <td colSpan={45} className="px-6 py-12 text-center text-sm text-muted-foreground bg-card">
                      従業員が見つかりませんでした
                    </td>
                  </tr>
                ) : (
                  employees.map((emp: Employee, index: number) => (
                    <tr
                      key={emp.id}
                      className={`${index % 2 === 0 ? 'bg-card' : 'bg-muted'} hover:bg-accent transition-colors`}
                    >
                      {/* Photo */}
                      <td className="px-3 py-2 border border-input text-xs text-foreground sticky left-0 bg-inherit">
                        {emp.photo_url ? (
                          <img
                            src={emp.photo_url}
                            alt={emp.full_name_kanji}
                            className="w-10 h-10 rounded object-cover border border-input"
                          />
                        ) : (
                          <div className="w-10 h-10 rounded bg-muted flex items-center justify-center">
                            <UserCircleIcon className="w-6 h-6 text-muted-foreground" />
                          </div>
                        )}
                      </td>
                      <td className="px-3 py-2 border border-input text-xs text-foreground">{getStatusText(emp.current_status)}</td>
                      <td className="px-3 py-2 border border-input text-xs text-foreground font-medium">{emp.hakenmoto_id}</td>
                      <td className="px-3 py-2 border border-input text-xs text-primary font-medium">{emp.hakensaki_shain_id || ''}</td>
                      <td className="px-3 py-2 border border-input text-xs text-foreground">{emp.factory_name || emp.factory_id || ''}</td>
                      <td className="px-3 py-2 border border-input text-xs text-foreground">{emp.assignment_location || ''}</td>
                      <td className="px-3 py-2 border border-input text-xs text-foreground">{emp.assignment_line || ''}</td>
                      <td className="px-3 py-2 border border-input text-xs text-foreground max-w-[200px] truncate">{emp.job_description || ''}</td>
                      <td className="px-3 py-2 border border-input text-xs text-foreground font-medium">{emp.full_name_kanji}</td>
                      <td className="px-3 py-2 border border-input text-xs text-foreground">{emp.full_name_kana || ''}</td>
                      <td className="px-3 py-2 border border-input text-xs text-foreground">{emp.gender || ''}</td>
                      <td className="px-3 py-2 border border-input text-xs text-foreground">{emp.nationality || ''}</td>
                      <td className="px-3 py-2 border border-input text-xs text-foreground">{formatDate(emp.date_of_birth)}</td>
                      <td className="px-3 py-2 border border-input text-xs text-foreground">{calculateAge(emp.date_of_birth)}</td>
                      <td className="px-3 py-2 border border-input text-xs text-foreground text-right">{formatCurrency(emp.jikyu)}</td>
                      <td className="px-3 py-2 border border-input text-xs text-foreground">{formatDate(emp.jikyu_revision_date)}</td>
                      <td className="px-3 py-2 border border-input text-xs text-foreground text-right">{formatCurrency(emp.hourly_rate_charged)}</td>
                      <td className="px-3 py-2 border border-input text-xs text-foreground">{formatDate(emp.billing_revision_date)}</td>
                      <td className="px-3 py-2 border border-input text-xs text-foreground text-right">{formatCurrency(emp.profit_difference)}</td>
                      <td className="px-3 py-2 border border-input text-xs text-foreground text-right">{formatCurrency(emp.standard_compensation)}</td>
                      <td className="px-3 py-2 border border-input text-xs text-foreground text-right">{formatCurrency(emp.health_insurance)}</td>
                      <td className="px-3 py-2 border border-input text-xs text-foreground text-right">{formatCurrency(emp.nursing_insurance)}</td>
                      <td className="px-3 py-2 border border-input text-xs text-foreground text-right">{formatCurrency(emp.pension_insurance)}</td>
                      <td className="px-3 py-2 border border-input text-xs text-foreground">{formatDate(emp.zairyu_expire_date)}</td>
                      <td className="px-3 py-2 border border-input text-xs text-foreground">{emp.visa_type || ''}</td>
                      <td className="px-3 py-2 border border-input text-xs text-foreground">{emp.postal_code || ''}</td>
                      <td className="px-3 py-2 border border-input text-xs text-foreground max-w-[250px] truncate">{emp.address || ''}</td>
                      <td className="px-3 py-2 border border-input text-xs text-foreground">{emp.phone || ''}</td>
                      <td className="px-3 py-2 border border-input text-xs text-foreground">{emp.email || ''}</td>
                      <td className="px-3 py-2 border border-input text-xs text-foreground">{emp.apartment_id ? `#${emp.apartment_id}` : ''}</td>
                      <td className="px-3 py-2 border border-input text-xs text-foreground">{formatDate(emp.apartment_start_date)}</td>
                      <td className="px-3 py-2 border border-input text-xs text-foreground">{formatDate(emp.hire_date)}</td>
                      <td className="px-3 py-2 border border-input text-xs text-foreground">{formatDate(emp.current_hire_date)}</td>
                      <td className="px-3 py-2 border border-input text-xs text-foreground">{formatDate(emp.termination_date)}</td>
                      <td className="px-3 py-2 border border-input text-xs text-foreground">{formatDate(emp.apartment_move_out_date)}</td>
                      <td className="px-3 py-2 border border-input text-xs text-foreground">{formatDate(emp.social_insurance_date)}</td>
                      <td className="px-3 py-2 border border-input text-xs text-foreground">{formatDate(emp.entry_request_date)}</td>
                      <td className="px-3 py-2 border border-input text-xs text-foreground">{emp.license_type || ''}</td>
                      <td className="px-3 py-2 border border-input text-xs text-foreground">{formatDate(emp.license_expire_date)}</td>
                      <td className="px-3 py-2 border border-input text-xs text-foreground">{emp.commute_method || ''}</td>
                      <td className="px-3 py-2 border border-input text-xs text-foreground">{formatDate(emp.optional_insurance_expire)}</td>
                      <td className="px-3 py-2 border border-input text-xs text-foreground">{emp.japanese_level || ''}</td>
                      <td className="px-3 py-2 border border-input text-xs text-foreground text-center">{emp.career_up_5years ? '✓' : ''}</td>
                      <td className="px-3 py-2 border border-input text-xs text-foreground text-center">{emp.yukyu_remaining}</td>
                      <td className="px-3 py-2 border border-input text-xs text-foreground max-w-[200px] truncate">{emp.notes || ''}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Footer Info */}
        <div className="mt-4 text-center text-sm text-muted-foreground">
          <p>全 {employees.length} 件の従業員データを表示中 | 横スクロールで全列を確認できます</p>
        </div>
      </div>
    </div>
  );
}
