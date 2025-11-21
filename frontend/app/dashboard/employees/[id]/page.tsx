'use client';

import React from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { useQuery, UseQueryResult } from '@tanstack/react-query';
import { employeeService, apartmentsV2Service } from '@/lib/api';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  ArrowLeftIcon,
  PencilIcon,
  DocumentTextIcon,
  CalendarIcon,
  BanknotesIcon,
  HomeIcon,
  PhoneIcon,
  EnvelopeIcon,
  UserCircleIcon,
  BuildingOfficeIcon,
  ClockIcon,
} from '@heroicons/react/24/outline';

interface EmployeeDetails {
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
  current_address?: string | null;
  address_banchi?: string | null;
  address_building?: string | null;
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
  is_corporate_housing: boolean;
  housing_subsidy: number | null;
  apartment?: {
    id: number;
    name: string;
    building_name: string;
    room_number: string;
    prefecture: string;
    city: string;
    address_line1: string;
    base_rent: number;
  };

  // Yukyu
  yukyu_total: number;
  yukyu_used: number;
  yukyu_remaining: number;

  // Status
  current_status: string | null;
  is_active: boolean;
  notes: string | null;
  contract_type: string | null;
  position: string | null;
  termination_reason: string | null;

  // Emergency Contact
  emergency_contact: string | null;
  emergency_phone: string | null;

  created_at: string;
  updated_at: string | null;
}

export default function EmployeeDetailPage() {
  const router = useRouter();
  const params = useParams();
  const id = params?.id as string;

  const { data: employee, isLoading, error } = useQuery<EmployeeDetails>({
    queryKey: ['employee', id],
    queryFn: async (): Promise<EmployeeDetails> => {
      const response = await employeeService.getEmployee<EmployeeDetails>(id);
      return response;
    },
    enabled: !!id,
  }) as UseQueryResult<EmployeeDetails, Error>;

  // Fetch assignment history
  const { data: assignmentHistory = [], isLoading: isLoadingAssignments } = useQuery({
    queryKey: ['employee-assignments', id],
    queryFn: async () => {
      const data = await apartmentsV2Service.listAssignments({
        employee_id: parseInt(id)
      });
      return data.items || [];
    },
    enabled: !!id,
  });

  const formatDate = (dateString: string | null) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleDateString('ja-JP');
  };

  const formatCurrency = (amount: number | null) => {
    if (amount === null || amount === undefined) return '-';
    return `¥${amount.toLocaleString()}`;
  };

  const getStatusBadge = (isActive: boolean) => {
    if (isActive) {
      return (
        <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800">
          在籍中
        </span>
      );
    } else {
      return (
        <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-gray-100 text-gray-800">
          退社済
        </span>
      );
    }
  };

  const getContractTypeBadge = (contractType: string | null) => {
    const types: { [key: string]: { label: string; color: string } } = {
      '派遣': { label: '派遣社員', color: 'bg-blue-100 text-blue-800' },
      '請負': { label: '請負社員', color: 'bg-purple-100 text-purple-800' },
      'スタッフ': { label: 'スタッフ', color: 'bg-yellow-100 text-yellow-800' },
    };

    const type = contractType ? types[contractType] : null;
    if (!type) return '-';

    return (
      <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${type.color}`}>
        {type.label}
      </span>
    );
  };

  const isVisaExpiringSoon = (expireDate: string | null) => {
    if (!expireDate) return false;
    const expire = new Date(expireDate);
    const today = new Date();
    const diffInDays = Math.ceil((expire.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    return diffInDays <= 90 && diffInDays >= 0;
  };

  const calculateDuration = (startDate: string, endDate: string | null) => {
    const start = new Date(startDate);
    const end = endDate ? new Date(endDate) : new Date();

    const diffTime = Math.abs(end.getTime() - start.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    const months = Math.floor(diffDays / 30);
    const days = diffDays % 30;

    if (months === 0) {
      return `${days}日`;
    }
    return `${months}ヶ月 ${days}日`;
  };

  const getAssignmentStatusBadge = (status: string) => {
    const statusConfig: { [key: string]: { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline' } } = {
      'active': { label: '入居中', variant: 'default' },
      'ended': { label: '退去済', variant: 'secondary' },
      'cancelled': { label: 'キャンセル', variant: 'destructive' },
      'transferred': { label: '転居', variant: 'outline' },
    };

    const config = statusConfig[status] || { label: status, variant: 'secondary' };
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  const getAssignmentStatusColor = (status: string) => {
    const colors: { [key: string]: string } = {
      'active': 'border-green-500 bg-green-50 dark:bg-green-950/20',
      'ended': 'border-gray-400 bg-gray-50 dark:bg-gray-900/20',
      'cancelled': 'border-red-500 bg-red-50 dark:bg-red-950/20',
      'transferred': 'border-blue-500 bg-blue-50 dark:bg-blue-950/20',
    };
    return colors[status] || colors['ended'];
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error || !employee) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background to-muted/20 p-6">
        <div className="max-w-7xl mx-auto">
          <div className="bg-destructive/10 border border-destructive/30 rounded-xl p-4">
            <p className="text-sm text-destructive">従業員が見つかりませんでした</p>
          </div>
          <button
            onClick={() => router.push('/employees')}
            className="mt-4 inline-flex items-center px-4 py-2 border border-input rounded-xl shadow-sm text-sm font-medium text-muted-foreground bg-card hover:bg-accent transition"
          >
            <ArrowLeftIcon className="h-5 w-5 mr-2" />
            戻る
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-muted/20 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-4">
          <div className="flex items-start space-x-4">
            <button
              onClick={() => router.push('/employees')}
              className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-xl shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 transition"
            >
              <ArrowLeftIcon className="h-5 w-5 mr-2" />
              戻る
            </button>
          </div>
          <button
            onClick={() => router.push(`/employees/${employee.id}/edit`)}
            className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-primary to-primary/90 text-primary-foreground rounded-xl font-semibold shadow-lg shadow-primary/30 hover:shadow-primary/50 transition-all duration-300 hover:scale-105"
          >
            <PencilIcon className="h-5 w-5 mr-2" />
            編集
          </button>
        </div>

        {/* Header con foto */}
        <div className="flex items-center gap-6 mb-8">
          {employee.photo_url ? (
            <img
              src={employee.photo_url}
              alt={employee.full_name_kanji}
              className="w-32 h-32 rounded-full object-cover border-4 border-primary/20 shadow-lg"
            />
          ) : (
            <div className="w-32 h-32 rounded-full bg-muted flex items-center justify-center">
              <UserCircleIcon className="w-20 h-20 text-muted-foreground" />
            </div>
          )}
          <div>
            <div className="flex items-center space-x-3 flex-wrap">
              <h1 className="text-3xl font-foreground bg-gradient-to-r from-primary to-primary/90 bg-clip-text text-transparent">
                {employee.full_name_kanji}
              </h1>
              {getStatusBadge(employee.is_active)}
              {getContractTypeBadge(employee.contract_type)}
            </div>
            <p className="mt-2 text-sm text-muted-foreground">
              社員№ <span className="font-semibold">{employee.hakenmoto_id}</span>
              {employee.rirekisho_id && <> | 履歴書ID: <span className="font-semibold">{employee.rirekisho_id}</span></>}
            </p>
          </div>
        </div>

        {/* Visa Expiring Soon Alert */}
        {employee.is_active && isVisaExpiringSoon(employee.zairyu_expire_date) && (
          <div className="bg-yellow-50 dark:bg-yellow-900/20 border-l-4 border-yellow-400 dark:border-yellow-600 rounded-xl p-4 shadow-sm">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-yellow-600 dark:text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
                  <path
                    fillRule="evenodd"
                    d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
                    clipRule="evenodd"
                  />
                </svg>
              </div>
              <div className="ml-3">
                <p className="text-sm text-yellow-700 dark:text-yellow-300">
                  <strong>警告:</strong> 在留カードの有効期限が近づいています（期限: {formatDate(employee.zairyu_expire_date)}）
                </p>
              </div>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Main Info */}
          <div className="lg:col-span-2 space-y-6">
            {/* Personal Information */}
            <div className="bg-card/90 backdrop-blur-sm shadow-lg rounded-2xl border">
              <div className="px-6 py-4 border-b border-border bg-gradient-to-r from-muted to-card">
                <h2 className="text-lg font-bold text-foreground flex items-center">
                  <UserCircleIcon className="h-6 w-6 mr-2 text-primary" />
                  個人情報
                </h2>
              </div>
              <div className="px-6 py-5">
                <dl className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  <div>
                    <dt className="text-sm font-medium text-muted-foreground">氏名（漢字）</dt>
                    <dd className="mt-1 text-sm text-foreground font-semibold">{employee.full_name_kanji}</dd>
                  </div>
                  <div>
                    <dt className="text-sm font-medium text-muted-foreground">氏名（カナ）</dt>
                    <dd className="mt-1 text-sm text-foreground">{employee.full_name_kana || '-'}</dd>
                  </div>
                  <div>
                    <dt className="text-sm font-medium text-muted-foreground">生年月日</dt>
                    <dd className="mt-1 text-sm text-foreground">{formatDate(employee.date_of_birth)}</dd>
                  </div>
                  <div>
                    <dt className="text-sm font-medium text-muted-foreground">性別</dt>
                    <dd className="mt-1 text-sm text-foreground">{employee.gender || '-'}</dd>
                  </div>
                  <div>
                    <dt className="text-sm font-medium text-muted-foreground">国籍</dt>
                    <dd className="mt-1 text-sm text-foreground">{employee.nationality || '-'}</dd>
                  </div>
                  <div className="sm:col-span-2">
                    <dt className="text-sm font-medium text-muted-foreground">郵便番号</dt>
                    <dd className="mt-1 text-sm text-foreground">{employee.postal_code || '-'}</dd>
                  </div>
                </dl>
              </div>
            </div>

            {/* Assignment Information */}
            <div className="bg-card/90 backdrop-blur-sm shadow-lg rounded-2xl border">
              <div className="px-6 py-4 border-b border-border bg-gradient-to-r from-muted to-card">
                <h2 className="text-lg font-bold text-foreground flex items-center">
                  <BuildingOfficeIcon className="h-6 w-6 mr-2 text-orange-500" />
                  配属情報
                </h2>
              </div>
              <div className="px-6 py-5">
                <dl className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  <div>
                    <dt className="text-sm font-medium text-muted-foreground">派遣先</dt>
                    <dd className="mt-1 text-sm text-foreground font-semibold">{employee.factory_name || employee.factory_id || '-'}</dd>
                  </div>
                  <div>
                    <dt className="text-sm font-medium text-muted-foreground">派遣先社員ID</dt>
                    <dd className="mt-1 text-sm text-foreground font-mono">{employee.hakensaki_shain_id || '-'}</dd>
                  </div>
                  <div>
                    <dt className="text-sm font-medium text-muted-foreground">配属先</dt>
                    <dd className="mt-1 text-sm text-foreground">{employee.assignment_location || '-'}</dd>
                  </div>
                  <div>
                    <dt className="text-sm font-medium text-muted-foreground">配属ライン</dt>
                    <dd className="mt-1 text-sm text-foreground">{employee.assignment_line || '-'}</dd>
                  </div>
                  <div className="sm:col-span-2">
                    <dt className="text-sm font-medium text-muted-foreground">仕事内容</dt>
                    <dd className="mt-1 text-sm text-foreground">{employee.job_description || '-'}</dd>
                  </div>
                </dl>
              </div>
            </div>

            {/* Contact Information */}
            <div className="bg-card/90 backdrop-blur-sm shadow-lg rounded-2xl border">
              <div className="px-6 py-4 border-b border-border bg-gradient-to-r from-muted to-card">
                <h2 className="text-lg font-bold text-foreground flex items-center">
                  <PhoneIcon className="h-6 w-6 mr-2 text-green-500" />
                  連絡先情報
                </h2>
              </div>
              <div className="px-6 py-5">
                <dl className="space-y-5">
                  <div className="sm:col-span-1">
                    <dt className="text-sm font-medium text-muted-foreground flex items-center">
                      <HomeIcon className="h-4 w-4 mr-1" />
                      住所
                    </dt>
                    <dd className="mt-1 text-sm text-gray-900">
                      {employee.current_address && (
                        <div>
                          <span className="text-xs text-muted-foreground">現住所: </span>
                          {employee.current_address}
                        </div>
                      )}
                      {employee.address_banchi && (
                        <div>
                          <span className="text-xs text-muted-foreground">番地: </span>
                          {employee.address_banchi}
                        </div>
                      )}
                      {employee.address_building && (
                        <div>
                          <span className="text-xs text-muted-foreground">物件名: </span>
                          {employee.address_building}
                        </div>
                      )}
                      {!employee.current_address && !employee.address_banchi && !employee.address_building && employee.address && (
                        <div>{employee.address}</div>
                      )}
                      {!employee.current_address && !employee.address_banchi && !employee.address_building && !employee.address && '-'}
                    </dd>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                    <div>
                      <dt className="text-sm font-medium text-muted-foreground flex items-center">
                        <PhoneIcon className="h-4 w-4 mr-1" />
                        電話番号
                      </dt>
                      <dd className="mt-1 text-sm text-gray-900 font-mono">{employee.phone || '-'}</dd>
                    </div>
                    <div>
                      <dt className="text-sm font-medium text-muted-foreground flex items-center">
                        <EnvelopeIcon className="h-4 w-4 mr-1" />
                        メールアドレス
                      </dt>
                      <dd className="mt-1 text-sm text-gray-900">{employee.email || '-'}</dd>
                    </div>
                  </div>
                  <div className="pt-5 border-t border-gray-200">
                    <h3 className="text-sm font-semibold text-foreground mb-3">緊急連絡先</h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                      <div>
                        <dt className="text-sm font-medium text-muted-foreground">名前</dt>
                        <dd className="mt-1 text-sm text-foreground">{employee.emergency_contact || '-'}</dd>
                      </div>
                      <div>
                        <dt className="text-sm font-medium text-muted-foreground">電話番号</dt>
                        <dd className="mt-1 text-sm text-foreground font-mono">{employee.emergency_phone || '-'}</dd>
                      </div>
                    </div>
                  </div>
                </dl>
              </div>
            </div>

            {/* Employment Information */}
            <div className="bg-card/90 backdrop-blur-sm shadow-lg rounded-2xl border">
              <div className="px-6 py-4 border-b border-border bg-gradient-to-r from-muted to-card">
                <h2 className="text-lg font-bold text-foreground flex items-center">
                  <BuildingOfficeIcon className="h-6 w-6 mr-2 text-primary" />
                  雇用情報
                </h2>
              </div>
              <div className="px-6 py-5">
                <dl className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  <div>
                    <dt className="text-sm font-medium text-muted-foreground">入社日</dt>
                    <dd className="mt-1 text-sm text-foreground">{formatDate(employee.hire_date)}</dd>
                  </div>
                  <div>
                    <dt className="text-sm font-medium text-muted-foreground">現入社</dt>
                    <dd className="mt-1 text-sm text-foreground">{formatDate(employee.current_hire_date)}</dd>
                  </div>
                  <div>
                    <dt className="text-sm font-medium text-muted-foreground">入社依頼</dt>
                    <dd className="mt-1 text-sm text-foreground">{formatDate(employee.entry_request_date)}</dd>
                  </div>
                  <div>
                    <dt className="text-sm font-medium text-muted-foreground">契約形態</dt>
                    <dd className="mt-1 text-sm">{getContractTypeBadge(employee.contract_type)}</dd>
                  </div>
                  <div>
                    <dt className="text-sm font-medium text-muted-foreground">職種</dt>
                    <dd className="mt-1 text-sm text-foreground">{employee.position || '-'}</dd>
                  </div>
                  {!employee.is_active && (
                    <>
                      <div>
                        <dt className="text-sm font-medium text-muted-foreground">退社日</dt>
                        <dd className="mt-1 text-sm text-foreground">{formatDate(employee.termination_date)}</dd>
                      </div>
                      <div className="sm:col-span-2">
                        <dt className="text-sm font-medium text-muted-foreground">退社理由</dt>
                        <dd className="mt-1 text-sm text-foreground">{employee.termination_reason || '-'}</dd>
                      </div>
                    </>
                  )}
                </dl>
              </div>
            </div>

            {/* Financial Information */}
            <div className="bg-card/90 backdrop-blur-sm shadow-lg rounded-2xl border">
              <div className="px-6 py-4 border-b border-border bg-gradient-to-r from-muted to-card">
                <h2 className="text-lg font-bold text-foreground flex items-center">
                  <BanknotesIcon className="h-6 w-6 mr-2 text-green-500" />
                  給与・保険情報
                </h2>
              </div>
              <div className="px-6 py-5">
                <dl className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  <div>
                    <dt className="text-sm font-medium text-muted-foreground">時給</dt>
                    <dd className="mt-1 text-lg font-bold text-primary">{formatCurrency(employee.jikyu)}</dd>
                  </div>
                  <div>
                    <dt className="text-sm font-medium text-muted-foreground">時給改定</dt>
                    <dd className="mt-1 text-sm text-foreground">{formatDate(employee.jikyu_revision_date)}</dd>
                  </div>
                  <div>
                    <dt className="text-sm font-medium text-muted-foreground">請求単価</dt>
                    <dd className="mt-1 text-sm text-foreground">{formatCurrency(employee.hourly_rate_charged)}</dd>
                  </div>
                  <div>
                    <dt className="text-sm font-medium text-muted-foreground">請求改定</dt>
                    <dd className="mt-1 text-sm text-foreground">{formatDate(employee.billing_revision_date)}</dd>
                  </div>
                  <div>
                    <dt className="text-sm font-medium text-muted-foreground">差額利益</dt>
                    <dd className="mt-1 text-sm text-foreground">{formatCurrency(employee.profit_difference)}</dd>
                  </div>
                  <div>
                    <dt className="text-sm font-medium text-muted-foreground">標準報酬</dt>
                    <dd className="mt-1 text-sm text-foreground">{formatCurrency(employee.standard_compensation)}</dd>
                  </div>
                  <div>
                    <dt className="text-sm font-medium text-muted-foreground">健康保険</dt>
                    <dd className="mt-1 text-sm text-foreground">{formatCurrency(employee.health_insurance)}</dd>
                  </div>
                  <div>
                    <dt className="text-sm font-medium text-muted-foreground">介護保険</dt>
                    <dd className="mt-1 text-sm text-foreground">{formatCurrency(employee.nursing_insurance)}</dd>
                  </div>
                  <div>
                    <dt className="text-sm font-medium text-muted-foreground">厚生年金</dt>
                    <dd className="mt-1 text-sm text-foreground">{formatCurrency(employee.pension_insurance)}</dd>
                  </div>
                  <div>
                    <dt className="text-sm font-medium text-muted-foreground">社保加入</dt>
                    <dd className="mt-1 text-sm text-foreground">{formatDate(employee.social_insurance_date)}</dd>
                  </div>
                </dl>
              </div>
            </div>

            {/* Visa Information */}
            <div className="bg-card/90 backdrop-blur-sm shadow-lg rounded-2xl border">
              <div className="px-6 py-4 border-b border-border bg-gradient-to-r from-muted to-card">
                <h2 className="text-lg font-bold text-foreground flex items-center">
                  <DocumentTextIcon className="h-6 w-6 mr-2 text-red-500" />
                  ビザ情報
                </h2>
              </div>
              <div className="px-6 py-5">
                <dl className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  <div>
                    <dt className="text-sm font-medium text-muted-foreground">ビザ種類</dt>
                    <dd className="mt-1 text-sm text-foreground">{employee.visa_type || '-'}</dd>
                  </div>
                  <div>
                    <dt className="text-sm font-medium text-muted-foreground">ビザ期限</dt>
                    <dd
                      className={`mt-1 text-sm ${
                        isVisaExpiringSoon(employee.zairyu_expire_date)
                          ? 'text-yellow-600 font-semibold'
                          : 'text-foreground'
                      }`}
                    >
                      {formatDate(employee.zairyu_expire_date)}
                      {isVisaExpiringSoon(employee.zairyu_expire_date) && ' ⚠️'}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-sm font-medium text-muted-foreground">更新アラート</dt>
                    <dd className="mt-1 text-sm text-foreground">
                      {employee.visa_renewal_alert ? (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-300">
                          ⚠️ 有効
                        </span>
                      ) : (
                        '-'
                      )}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-sm font-medium text-muted-foreground">アラート日数</dt>
                    <dd className="mt-1 text-sm text-foreground">{employee.visa_alert_days ? `${employee.visa_alert_days}日前` : '-'}</dd>
                  </div>
                </dl>
              </div>
            </div>

            {/* Documents Information */}
            <div className="bg-card/90 backdrop-blur-sm shadow-lg rounded-2xl border">
              <div className="px-6 py-4 border-b border-border bg-gradient-to-r from-muted to-card">
                <h2 className="text-lg font-bold text-foreground flex items-center">
                  <DocumentTextIcon className="h-6 w-6 mr-2 text-purple-500" />
                  資格・証明書情報
                </h2>
              </div>
              <div className="px-6 py-5">
                <dl className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  <div>
                    <dt className="text-sm font-medium text-muted-foreground">免許種類</dt>
                    <dd className="mt-1 text-sm text-foreground">{employee.license_type || '-'}</dd>
                  </div>
                  <div>
                    <dt className="text-sm font-medium text-muted-foreground">免許期限</dt>
                    <dd className="mt-1 text-sm text-foreground">{formatDate(employee.license_expire_date)}</dd>
                  </div>
                  <div>
                    <dt className="text-sm font-medium text-muted-foreground">通勤方法</dt>
                    <dd className="mt-1 text-sm text-foreground">{employee.commute_method || '-'}</dd>
                  </div>
                  <div>
                    <dt className="text-sm font-medium text-muted-foreground">任意保険期限</dt>
                    <dd className="mt-1 text-sm text-foreground">{formatDate(employee.optional_insurance_expire)}</dd>
                  </div>
                  <div>
                    <dt className="text-sm font-medium text-muted-foreground">日本語検定</dt>
                    <dd className="mt-1 text-sm text-foreground">{employee.japanese_level || '-'}</dd>
                  </div>
                  <div>
                    <dt className="text-sm font-medium text-muted-foreground">キャリアアップ5年目</dt>
                    <dd className="mt-1 text-sm text-foreground">
                      {employee.career_up_5years ? (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300">
                          ✓ 該当
                        </span>
                      ) : (
                        '-'
                      )}
                    </dd>
                  </div>
                </dl>
              </div>
            </div>

            {/* Housing Information (社宅) */}
            <div className="bg-card/90 backdrop-blur-sm shadow-lg rounded-2xl border">
              <div className="px-6 py-4 border-b border-border bg-gradient-to-r from-muted to-card">
                <h2 className="text-lg font-bold text-foreground flex items-center">
                  <HomeIcon className="h-6 w-6 mr-2 text-purple-500" />
                  社宅・住宅情報
                </h2>
              </div>
              <div className="px-6 py-5 space-y-4">
                {/* Status Badge */}
                <div>
                  {employee.is_corporate_housing ? (
                    <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-purple-100 dark:bg-purple-900/30 text-purple-800 dark:text-purple-300">
                      🏢 社宅利用中
                    </span>
                  ) : (
                    <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-300">
                      🏠 社外住宅
                    </span>
                  )}
                </div>

                {/* Corporate Housing Details */}
                {employee.is_corporate_housing && employee.apartment ? (
                  <div className="border-t border-border pt-4 space-y-4">
                    {/* Apartment Details */}
                    <div className="bg-muted/30 p-4 rounded-xl">
                      <h3 className="text-sm font-semibold text-foreground mb-3 flex items-center">
                        <HomeIcon className="h-4 w-4 mr-2 text-purple-500" />
                        アパート詳細
                      </h3>
                      <dl className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div>
                          <dt className="text-xs font-medium text-muted-foreground">物件名</dt>
                          <dd className="mt-1 text-sm text-foreground font-semibold">
                            {employee.apartment.name || `${employee.apartment.building_name} ${employee.apartment.room_number}`}
                          </dd>
                        </div>
                        <div>
                          <dt className="text-xs font-medium text-muted-foreground">住所</dt>
                          <dd className="mt-1 text-sm text-foreground">
                            {employee.apartment.prefecture} {employee.apartment.city} {employee.apartment.address_line1}
                          </dd>
                        </div>
                        <div>
                          <dt className="text-xs font-medium text-muted-foreground">基本家賃</dt>
                          <dd className="mt-1 text-sm text-foreground font-semibold">
                            {formatCurrency(employee.apartment.base_rent)}
                          </dd>
                        </div>
                        <div>
                          <dt className="text-xs font-medium text-muted-foreground">アパートID</dt>
                          <dd className="mt-1 text-sm text-foreground font-mono">#{employee.apartment_id}</dd>
                        </div>
                      </dl>
                    </div>

                    {/* Assignment Details */}
                    <div>
                      <h3 className="text-sm font-semibold text-foreground mb-3">入居情報</h3>
                      <dl className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div>
                          <dt className="text-sm font-medium text-muted-foreground">入居日</dt>
                          <dd className="mt-1 text-sm text-foreground">{formatDate(employee.apartment_start_date)}</dd>
                        </div>
                        <div>
                          <dt className="text-sm font-medium text-muted-foreground">退去予定日</dt>
                          <dd className="mt-1 text-sm text-foreground">
                            {employee.apartment_move_out_date ? formatDate(employee.apartment_move_out_date) : '未定'}
                          </dd>
                        </div>
                        <div>
                          <dt className="text-sm font-medium text-muted-foreground">従業員負担額</dt>
                          <dd className="mt-1 text-sm text-foreground font-semibold">
                            {formatCurrency(employee.apartment_rent)}
                          </dd>
                        </div>
                        <div>
                          <dt className="text-sm font-medium text-muted-foreground">会社補助額</dt>
                          <dd className="mt-1 text-sm text-foreground font-semibold text-green-600 dark:text-green-400">
                            {formatCurrency(employee.housing_subsidy)}
                          </dd>
                        </div>
                      </dl>
                    </div>

                    {/* Cost Breakdown */}
                    {employee.apartment_rent !== null && employee.housing_subsidy !== null && (
                      <div className="bg-blue-50 dark:bg-blue-950/20 p-4 rounded-xl border border-blue-200 dark:border-blue-900">
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium text-blue-900 dark:text-blue-300">会社負担総額</span>
                          <span className="text-lg font-bold text-blue-900 dark:text-blue-300">
                            {formatCurrency((employee.apartment.base_rent || 0) - (employee.apartment_rent || 0) + (employee.housing_subsidy || 0))}
                          </span>
                        </div>
                        <p className="mt-1 text-xs text-blue-700 dark:text-blue-400">
                          (基本家賃 - 従業員負担 + 補助額)
                        </p>
                      </div>
                    )}
                  </div>
                ) : employee.is_corporate_housing && !employee.apartment ? (
                  <div className="border-t border-border pt-4">
                    <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-900 rounded-xl p-4">
                      <p className="text-sm text-yellow-800 dark:text-yellow-300">
                        ⚠️ 社宅に登録されていますが、アパート情報が取得できません
                      </p>
                    </div>
                  </div>
                ) : (
                  /* Non-corporate housing */
                  <div className="border-t border-border pt-4">
                    <dl className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <dt className="text-sm font-medium text-muted-foreground">住宅手当</dt>
                        <dd className="mt-1 text-sm text-foreground font-semibold text-green-600 dark:text-green-400">
                          {formatCurrency(employee.housing_subsidy)}
                        </dd>
                      </div>
                    </dl>
                    {employee.housing_subsidy === null || employee.housing_subsidy === 0 ? (
                      <p className="mt-3 text-sm text-muted-foreground">
                        住宅手当の支給はありません
                      </p>
                    ) : null}
                  </div>
                )}
              </div>
            </div>

            {/* Assignment History Section */}
            <div className="bg-card/90 backdrop-blur-sm shadow-lg rounded-2xl border">
              <div className="px-6 py-4 border-b border-border bg-gradient-to-r from-muted to-card">
                <h2 className="text-lg font-bold text-foreground flex items-center">
                  <HomeIcon className="h-6 w-6 mr-2 text-indigo-500" />
                  住居履歴 (Assignment History)
                </h2>
                <p className="text-sm text-muted-foreground mt-1">Complete history of apartment assignments</p>
              </div>
              <div className="px-6 py-5">
                {isLoadingAssignments ? (
                  <div className="flex justify-center items-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                  </div>
                ) : assignmentHistory.length === 0 ? (
                  <p className="text-muted-foreground text-center py-8">No assignment history found</p>
                ) : (
                  <div className="space-y-4">
                    {assignmentHistory
                      .sort((a: any, b: any) => {
                        // Active first
                        if (a.status === 'active' && b.status !== 'active') return -1;
                        if (a.status !== 'active' && b.status === 'active') return 1;
                        // Then by end date desc
                        if (a.end_date && b.end_date) {
                          return new Date(b.end_date).getTime() - new Date(a.end_date).getTime();
                        }
                        // Then by start date desc
                        return new Date(b.start_date).getTime() - new Date(a.start_date).getTime();
                      })
                      .map((assignment: any) => {
                        const isActive = assignment.status === 'active';

                        return (
                          <div
                            key={assignment.id}
                            className={`border-l-4 pl-4 py-3 rounded-r-lg ${getAssignmentStatusColor(assignment.status)}`}
                          >
                            <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
                              <div className="space-y-3 flex-1">
                                {/* Status badge */}
                                <div className="flex items-center gap-2">
                                  {getAssignmentStatusBadge(assignment.status)}
                                  {isActive && (
                                    <span className="inline-flex items-center px-2 py-1 rounded-md text-xs font-semibold bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300">
                                      Current
                                    </span>
                                  )}
                                </div>

                                {/* Apartment name */}
                                <div>
                                  <h4 className="font-semibold text-foreground text-lg">
                                    <Link
                                      href={`/apartments/${assignment.apartment_id}`}
                                      className="hover:text-primary transition-colors underline decoration-dotted"
                                    >
                                      {(assignment as any).apartment?.name ||
                                       (assignment as any).apartment_name ||
                                       `Apartment #${assignment.apartment_id}`}
                                    </Link>
                                  </h4>
                                  {(assignment as any).apartment && (
                                    <p className="text-sm text-muted-foreground mt-1">
                                      {(assignment as any).apartment.prefecture} {(assignment as any).apartment.city} {(assignment as any).apartment.address_line1}
                                    </p>
                                  )}
                                </div>

                                {/* Dates */}
                                <div className="text-sm space-y-1">
                                  <div className="flex items-center gap-2">
                                    <CalendarIcon className="h-4 w-4 text-muted-foreground" />
                                    <span className="font-medium">開始:</span>
                                    <span>{formatDate(assignment.start_date)}</span>
                                  </div>
                                  <div className="flex items-center gap-2">
                                    <CalendarIcon className="h-4 w-4 text-muted-foreground" />
                                    <span className="font-medium">終了:</span>
                                    {assignment.end_date ? (
                                      <span>{formatDate(assignment.end_date)}</span>
                                    ) : (
                                      <span className="text-green-600 dark:text-green-400 font-semibold">Current</span>
                                    )}
                                  </div>
                                  <div className="flex items-center gap-2">
                                    <ClockIcon className="h-4 w-4 text-muted-foreground" />
                                    <span className="font-medium">期間:</span>
                                    <span>{calculateDuration(assignment.start_date, assignment.end_date)}</span>
                                  </div>
                                </div>

                                {/* Rent information */}
                                <div className="bg-muted/50 dark:bg-muted/20 p-3 rounded-lg space-y-2">
                                  {(assignment as any).monthly_rent !== undefined && (
                                    <div className="flex justify-between items-center">
                                      <span className="text-sm font-medium text-muted-foreground">月額家賃:</span>
                                      <span className="text-sm font-bold text-foreground">
                                        {formatCurrency((assignment as any).monthly_rent)}
                                      </span>
                                    </div>
                                  )}
                                  {(assignment as any).is_prorated && (
                                    <div className="flex justify-between items-center">
                                      <span className="text-sm font-medium text-muted-foreground">日割り計算:</span>
                                      <Badge variant="outline" className="text-xs">Prorated</Badge>
                                    </div>
                                  )}
                                  <div className="flex justify-between items-center pt-2 border-t border-border">
                                    <span className="text-sm font-medium text-muted-foreground">控除総額:</span>
                                    <span className="text-sm font-bold text-red-600 dark:text-red-400">
                                      {formatCurrency(assignment.total_deduction)}
                                    </span>
                                  </div>
                                </div>
                              </div>

                              {/* Action buttons */}
                              <div className="flex flex-col gap-2 sm:flex-shrink-0">
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => router.push(`/apartment-assignments/${assignment.id}`)}
                                  className="w-full sm:w-auto"
                                >
                                  <DocumentTextIcon className="h-4 w-4 mr-2" />
                                  Details
                                </Button>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => router.push(`/apartments/${assignment.apartment_id}`)}
                                  className="w-full sm:w-auto"
                                >
                                  <HomeIcon className="h-4 w-4 mr-2" />
                                  View Apartment
                                </Button>
                              </div>
                            </div>
                          </div>
                        );
                      })
                    }
                  </div>
                )}
              </div>
            </div>

            {/* Notes */}
            {employee.notes && (
              <div className="bg-card/90 backdrop-blur-sm shadow-lg rounded-2xl border">
                <div className="px-6 py-4 border-b border-border bg-gradient-to-r from-muted to-card">
                  <h2 className="text-lg font-bold text-foreground flex items-center">
                    <DocumentTextIcon className="h-6 w-6 mr-2 text-muted-foreground" />
                    備考
                  </h2>
                </div>
                <div className="px-6 py-5">
                  <p className="text-sm text-foreground whitespace-pre-wrap">{employee.notes}</p>
                </div>
              </div>
            )}
          </div>

          {/* Right Column - Quick Stats */}
          <div className="space-y-6">
            {/* Yukyu Card */}
            <div className="bg-gradient-to-br from-primary to-primary/90 text-primary-foreground shadow-lg rounded-2xl overflow-hidden">
              <div className="px-6 py-4 border-b border-primary/30">
                <h2 className="text-lg font-bold flex items-center">
                  <CalendarIcon className="h-6 w-6 mr-2" />
                  有給休暇
                </h2>
              </div>
              <div className="px-6 py-6 space-y-5">
                <div>
                  <dt className="text-sm font-medium opacity-90">付与日数</dt>
                  <dd className="mt-1 text-3xl font-foreground">{employee.yukyu_total}日</dd>
                </div>
                <div>
                  <dt className="text-sm font-medium opacity-90">使用日数</dt>
                  <dd className="mt-1 text-3xl font-foreground">{employee.yukyu_used}日</dd>
                </div>
                <div className="pt-5 border-t border-blue-400/30">
                  <dt className="text-sm font-medium opacity-90">残日数</dt>
                  <dd className="mt-1 text-4xl font-foreground">{employee.yukyu_remaining}日</dd>
                </div>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="bg-card/90 backdrop-blur-sm shadow-lg rounded-2xl border">
              <div className="px-6 py-4 border-b border-border">
                <h2 className="text-lg font-bold text-foreground">クイックアクション</h2>
              </div>
              <div className="px-6 py-4 space-y-3">
                <button className="w-full inline-flex items-center justify-center px-4 py-3 border border-input rounded-xl shadow-sm text-sm font-medium text-muted-foreground bg-card hover:bg-accent transition-all hover:scale-105">
                  <ClockIcon className="h-5 w-5 mr-2 text-muted-foreground" />
                  タイムカードを見る
                </button>
                <button className="w-full inline-flex items-center justify-center px-4 py-3 border border-input rounded-xl shadow-sm text-sm font-medium text-muted-foreground bg-card hover:bg-accent transition-all hover:scale-105">
                  <BanknotesIcon className="h-5 w-5 mr-2 text-muted-foreground" />
                  給与明細を見る
                </button>
                <button className="w-full inline-flex items-center justify-center px-4 py-3 border border-input rounded-xl shadow-sm text-sm font-medium text-muted-foreground bg-card hover:bg-accent transition-all hover:scale-105">
                  <DocumentTextIcon className="h-5 w-5 mr-2 text-muted-foreground" />
                  書類を見る
                </button>
              </div>
            </div>

            {/* System Info */}
            <div className="bg-gradient-to-br from-muted to-muted/50 rounded-2xl p-5 shadow-sm">
              <h3 className="text-sm font-bold text-foreground mb-3">システム情報</h3>
              <dl className="space-y-3 text-xs">
                <div>
                  <dt className="text-muted-foreground">登録日時</dt>
                  <dd className="text-foreground font-mono mt-1">{new Date(employee.created_at).toLocaleString('ja-JP')}</dd>
                </div>
                {employee.updated_at && (
                  <div>
                    <dt className="text-muted-foreground">更新日時</dt>
                    <dd className="text-foreground font-mono mt-1">{new Date(employee.updated_at).toLocaleString('ja-JP')}</dd>
                  </div>
                )}
              </dl>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
