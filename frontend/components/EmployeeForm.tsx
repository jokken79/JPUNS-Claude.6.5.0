'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { employeeService } from '@/lib/api';
import { ArrowLeftIcon, UserPlusIcon, PencilIcon, UserCircleIcon } from '@heroicons/react/24/outline';
import { toast } from 'react-hot-toast';
import FactorySelector from './FactorySelector';
import ApartmentSelector from './ApartmentSelector';

interface EmployeeFormData {
  // Identificación
  rirekisho_id: string;
  factory_id: string;
  hakensaki_shain_id: string;
  photo_url: string;

  // Personal
  full_name_kanji: string;
  full_name_kana: string;
  date_of_birth: string;
  gender: string;
  nationality: string;
  address: string;
  address_banchi: string;
  address_building: string;
  phone: string;
  email: string;
  postal_code: string;

  // Assignment
  assignment_location: string;
  assignment_line: string;
  job_description: string;

  // Employment
  hire_date: string;
  current_hire_date: string;
  entry_request_date: string;
  position: string;
  contract_type: string;

  // Financial
  jikyu: number;
  jikyu_revision_date: string;
  hourly_rate_charged: string;
  billing_revision_date: string;
  profit_difference: string;
  standard_compensation: string;
  health_insurance: string;
  nursing_insurance: string;
  pension_insurance: string;
  social_insurance_date: string;

  // Visa
  visa_type: string;
  zairyu_expire_date: string;

  // Documents
  license_type: string;
  license_expire_date: string;
  commute_method: string;
  optional_insurance_expire: string;
  japanese_level: string;
  career_up_5years: boolean;

  // Apartment
  apartment_id: string;
  apartment_start_date: string;
  apartment_move_out_date: string;
  apartment_rent: string;
  is_corporate_housing: boolean;
  housing_subsidy: string;

  // Status & Notes
  current_status: string;
  notes: string;
}

interface EmployeeFormProps {
  employeeId?: string;
  isEdit?: boolean;
}

export default function EmployeeForm({ employeeId, isEdit = false }: EmployeeFormProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [formData, setFormData] = useState<EmployeeFormData>({
    rirekisho_id: '',
    factory_id: '',
    hakensaki_shain_id: '',
    photo_url: '',
    full_name_kanji: '',
    full_name_kana: '',
    date_of_birth: '',
    gender: '男',
    nationality: '',
    address: '',
    address_banchi: '',
    address_building: '',
    phone: '',
    email: '',
    postal_code: '',
    assignment_location: '',
    assignment_line: '',
    job_description: '',
    hire_date: new Date().toISOString().split('T')[0],
    current_hire_date: '',
    entry_request_date: '',
    position: '',
    contract_type: '派遣',
    jikyu: 1000,
    jikyu_revision_date: '',
    hourly_rate_charged: '',
    billing_revision_date: '',
    profit_difference: '',
    standard_compensation: '',
    health_insurance: '',
    nursing_insurance: '',
    pension_insurance: '',
    social_insurance_date: '',
    visa_type: '',
    zairyu_expire_date: '',
    license_type: '',
    license_expire_date: '',
    commute_method: '',
    optional_insurance_expire: '',
    japanese_level: '',
    career_up_5years: false,
    apartment_id: '',
    apartment_start_date: '',
    apartment_move_out_date: '',
    apartment_rent: '',
    is_corporate_housing: false,
    housing_subsidy: '',
    current_status: 'active',
    notes: '',
  });

  const fetchEmployee = useCallback(async () => {
    try {
      setLoading(true);
      const employee = await employeeService.getEmployee(employeeId!);

      setFormData({
        rirekisho_id: employee.rirekisho_id || '',
        factory_id: employee.factory_id ? employee.factory_id.toString() : '',
        hakensaki_shain_id: employee.hakensaki_shain_id || '',
        photo_url: employee.photo_url || '',
        full_name_kanji: employee.full_name_kanji || '',
        full_name_kana: employee.full_name_kana || '',
        date_of_birth: employee.date_of_birth || '',
        gender: employee.gender || '男',
        nationality: employee.nationality || '',
        address: employee.address || '',
        address_banchi: employee.address_banchi || '',
        address_building: employee.address_building || '',
        phone: employee.phone || '',
        email: employee.email || '',
        postal_code: employee.postal_code || '',
        assignment_location: employee.assignment_location || '',
        assignment_line: employee.assignment_line || '',
        job_description: employee.job_description || '',
        hire_date: employee.hire_date || '',
        current_hire_date: employee.current_hire_date || '',
        entry_request_date: employee.entry_request_date || '',
        position: employee.position || '',
        contract_type: employee.contract_type || '派遣',
        jikyu: employee.jikyu || 1000,
        jikyu_revision_date: employee.jikyu_revision_date || '',
        hourly_rate_charged: employee.hourly_rate_charged ? employee.hourly_rate_charged.toString() : '',
        billing_revision_date: employee.billing_revision_date || '',
        profit_difference: employee.profit_difference ? employee.profit_difference.toString() : '',
        standard_compensation: employee.standard_compensation ? employee.standard_compensation.toString() : '',
        health_insurance: employee.health_insurance ? employee.health_insurance.toString() : '',
        nursing_insurance: employee.nursing_insurance ? employee.nursing_insurance.toString() : '',
        pension_insurance: employee.pension_insurance ? employee.pension_insurance.toString() : '',
        social_insurance_date: employee.social_insurance_date || '',
        visa_type: employee.visa_type || '',
        zairyu_expire_date: employee.zairyu_expire_date || '',
        license_type: employee.license_type || '',
        license_expire_date: employee.license_expire_date || '',
        commute_method: employee.commute_method || '',
        optional_insurance_expire: employee.optional_insurance_expire || '',
        japanese_level: employee.japanese_level || '',
        career_up_5years: employee.career_up_5years || false,
        apartment_id: employee.apartment_id ? employee.apartment_id.toString() : '',
        apartment_start_date: employee.apartment_start_date || '',
        apartment_move_out_date: employee.apartment_move_out_date || '',
        apartment_rent: employee.apartment_rent ? employee.apartment_rent.toString() : '',
        is_corporate_housing: employee.is_corporate_housing || false,
        housing_subsidy: employee.housing_subsidy ? employee.housing_subsidy.toString() : '',
        current_status: employee.current_status || 'active',
        notes: employee.notes || '',
      });

      if (employee.photo_url) {
        setPhotoPreview(employee.photo_url);
      }
    } catch (err: any) {
      toast.error('従業員情報の読み込みに失敗しました');
      console.error('Error fetching employee:', err);
    } finally {
      setLoading(false);
    }
  }, [employeeId]);

  useEffect(() => {
    if (isEdit && employeeId) {
      void fetchEmployee();
    }
  }, [employeeId, fetchEmployee, isEdit]);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    const { name, value, type } = e.target;

    if (type === 'checkbox') {
      const checked = (e.target as HTMLInputElement).checked;
      setFormData((prev) => ({
        ...prev,
        [name]: checked,
      }));
    } else {
      setFormData((prev) => ({
        ...prev,
        [name]: value,
      }));
    }
  };

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Create preview
      const reader = new FileReader();
      reader.onloadend = () => {
        setPhotoPreview(reader.result as string);
      };
      reader.readAsDataURL(file);

      // In a real implementation, you would upload the file here
      // For now, we'll just store the preview URL
      setFormData(prev => ({
        ...prev,
        photo_url: reader.result as string
      }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validation
    if (!formData.full_name_kanji) {
      toast.error('氏名（漢字）を入力してください');
      return;
    }
    if (!formData.hire_date) {
      toast.error('入社日を入力してください');
      return;
    }
    if (!formData.jikyu || formData.jikyu < 0) {
      toast.error('時給を正しく入力してください');
      return;
    }
    if (!formData.factory_id) {
      toast.error('派遣先IDを入力してください');
      return;
    }

    try {
      setSubmitting(true);

      // Prepare data
      const submitData: any = {
        rirekisho_id: formData.rirekisho_id || null,
        factory_id: formData.factory_id,
        hakensaki_shain_id: formData.hakensaki_shain_id || null,
        photo_url: formData.photo_url || null,
        full_name_kanji: formData.full_name_kanji,
        full_name_kana: formData.full_name_kana || null,
        date_of_birth: formData.date_of_birth || null,
        gender: formData.gender || null,
        nationality: formData.nationality || null,
        address: formData.address || null,
        address_banchi: formData.address_banchi || null,
        address_building: formData.address_building || null,
        phone: formData.phone || null,
        email: formData.email || null,
        postal_code: formData.postal_code || null,
        assignment_location: formData.assignment_location || null,
        assignment_line: formData.assignment_line || null,
        job_description: formData.job_description || null,
        hire_date: formData.hire_date,
        current_hire_date: formData.current_hire_date || null,
        entry_request_date: formData.entry_request_date || null,
        position: formData.position || null,
        contract_type: formData.contract_type || null,
        jikyu: parseInt(formData.jikyu.toString()),
        jikyu_revision_date: formData.jikyu_revision_date || null,
        hourly_rate_charged: formData.hourly_rate_charged ? parseInt(formData.hourly_rate_charged) : null,
        billing_revision_date: formData.billing_revision_date || null,
        profit_difference: formData.profit_difference ? parseInt(formData.profit_difference) : null,
        standard_compensation: formData.standard_compensation ? parseInt(formData.standard_compensation) : null,
        health_insurance: formData.health_insurance ? parseInt(formData.health_insurance) : null,
        nursing_insurance: formData.nursing_insurance ? parseInt(formData.nursing_insurance) : null,
        pension_insurance: formData.pension_insurance ? parseInt(formData.pension_insurance) : null,
        social_insurance_date: formData.social_insurance_date || null,
        visa_type: formData.visa_type || null,
        zairyu_expire_date: formData.zairyu_expire_date || null,
        license_type: formData.license_type || null,
        license_expire_date: formData.license_expire_date || null,
        commute_method: formData.commute_method || null,
        optional_insurance_expire: formData.optional_insurance_expire || null,
        japanese_level: formData.japanese_level || null,
        career_up_5years: formData.career_up_5years,
        apartment_id: formData.apartment_id ? parseInt(formData.apartment_id) : null,
        apartment_start_date: formData.apartment_start_date || null,
        apartment_move_out_date: formData.apartment_move_out_date || null,
        apartment_rent: formData.apartment_rent ? parseInt(formData.apartment_rent) : null,
        is_corporate_housing: formData.is_corporate_housing,
        housing_subsidy: formData.housing_subsidy ? parseInt(formData.housing_subsidy) : null,
        current_status: formData.current_status || null,
        notes: formData.notes || null,
      };

      if (isEdit) {
        await employeeService.updateEmployee(employeeId!, submitData);
        toast.success('従業員情報を更新しました');
      } else {
        await employeeService.createEmployee(submitData);
        toast.success('従業員を登録しました');
      }

      router.push('/employees');
    } catch (err: any) {
      const errorMessage = err.response?.data?.detail || '保存に失敗しました';
      toast.error(errorMessage);
      console.error('Error saving employee:', err);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-indigo-50 p-6">
      <div className="max-w-5xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <button
              onClick={() => router.push('/employees')}
              className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-xl shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 transition"
            >
              <ArrowLeftIcon className="h-5 w-5 mr-2" />
              戻る
            </button>
            <h1 className="text-3xl font-black bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
              {isEdit ? '従業員情報編集' : '従業員新規登録'}
            </h1>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Photo Section */}
          <div className="bg-white/90 backdrop-blur-sm shadow-lg rounded-2xl border border-gray-200">
            <div className="px-6 py-4 border-b border-gray-200 bg-gradient-to-r from-purple-50 to-blue-50">
              <h2 className="text-lg font-bold text-gray-900">写真</h2>
            </div>
            <div className="px-6 py-5">
              <div className="flex items-center gap-6">
                {photoPreview ? (
                  <Image
                    src={photoPreview}
                    alt="Preview"
                    width={128}
                    height={128}
                    className="w-32 h-32 rounded-full object-cover border-4 border-blue-200 shadow-lg"
                    unoptimized
                  />
                ) : (
                  <div className="w-32 h-32 rounded-full bg-gray-200 flex items-center justify-center">
                    <UserCircleIcon className="w-20 h-20 text-gray-400" />
                  </div>
                )}
                <div className="flex-1">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    写真をアップロード
                  </label>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handlePhotoChange}
                    className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100"
                  />
                  <p className="mt-2 text-xs text-gray-500">JPG, PNG, GIF (最大5MB)</p>
                </div>
              </div>
            </div>
          </div>

          {/* Personal Information */}
          <div className="bg-white/90 backdrop-blur-sm shadow-lg rounded-2xl border border-gray-200">
            <div className="px-6 py-4 border-b border-gray-200 bg-gradient-to-r from-purple-50 to-blue-50">
              <h2 className="text-lg font-bold text-gray-900">個人情報</h2>
            </div>
            <div className="px-6 py-5 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    履歴書ID
                  </label>
                  <input
                    type="text"
                    name="rirekisho_id"
                    value={formData.rirekisho_id}
                    onChange={handleChange}
                    placeholder="RRS-2025-001"
                    className="block w-full px-4 py-2.5 border border-gray-300 rounded-xl shadow-sm focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    氏名（漢字） <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="full_name_kanji"
                    value={formData.full_name_kanji}
                    onChange={handleChange}
                    required
                    placeholder="山田 太郎"
                    className="block w-full px-4 py-2.5 border border-gray-300 rounded-xl shadow-sm focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    氏名（カナ）
                  </label>
                  <input
                    type="text"
                    name="full_name_kana"
                    value={formData.full_name_kana}
                    onChange={handleChange}
                    placeholder="ヤマダ タロウ"
                    className="block w-full px-4 py-2.5 border border-gray-300 rounded-xl shadow-sm focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    生年月日
                  </label>
                  <input
                    type="date"
                    name="date_of_birth"
                    value={formData.date_of_birth}
                    onChange={handleChange}
                    className="block w-full px-4 py-2.5 border border-gray-300 rounded-xl shadow-sm focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    性別
                  </label>
                  <select
                    name="gender"
                    value={formData.gender}
                    onChange={handleChange}
                    className="block w-full px-4 py-2.5 border border-gray-300 rounded-xl shadow-sm focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition appearance-none"
                  >
                    <option value="男">男</option>
                    <option value="女">女</option>
                    <option value="その他">その他</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    国籍
                  </label>
                  <input
                    type="text"
                    name="nationality"
                    value={formData.nationality}
                    onChange={handleChange}
                    placeholder="日本"
                    className="block w-full px-4 py-2.5 border border-gray-300 rounded-xl shadow-sm focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    郵便番号
                  </label>
                  <input
                    type="text"
                    name="postal_code"
                    value={formData.postal_code}
                    onChange={handleChange}
                    placeholder="123-4567"
                    className="block w-full px-4 py-2.5 border border-gray-300 rounded-xl shadow-sm focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    現住所
                  </label>
                  <input
                    type="text"
                    name="address"
                    value={formData.address}
                    onChange={handleChange}
                    placeholder="愛知県名古屋市..."
                    className="block w-full px-4 py-2.5 border border-gray-300 rounded-xl shadow-sm focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    番地
                  </label>
                  <input
                    type="text"
                    name="address_banchi"
                    value={formData.address_banchi}
                    onChange={handleChange}
                    placeholder="1-2-3"
                    className="block w-full px-4 py-2.5 border border-gray-300 rounded-xl shadow-sm focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    物件名
                  </label>
                  <input
                    type="text"
                    name="address_building"
                    value={formData.address_building}
                    onChange={handleChange}
                    placeholder="マンション名・号室"
                    className="block w-full px-4 py-2.5 border border-gray-300 rounded-xl shadow-sm focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    電話番号
                  </label>
                  <input
                    type="tel"
                    name="phone"
                    value={formData.phone}
                    onChange={handleChange}
                    placeholder="090-1234-5678"
                    className="block w-full px-4 py-2.5 border border-gray-300 rounded-xl shadow-sm focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    メールアドレス
                  </label>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    placeholder="example@email.com"
                    className="block w-full px-4 py-2.5 border border-gray-300 rounded-xl shadow-sm focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Assignment Information */}
          <div className="bg-white/90 backdrop-blur-sm shadow-lg rounded-2xl border border-gray-200">
            <div className="px-6 py-4 border-b border-gray-200 bg-gradient-to-r from-orange-50 to-yellow-50">
              <h2 className="text-lg font-bold text-gray-900">配属情報</h2>
            </div>
            <div className="px-6 py-5 space-y-4">
              {/* Factory Selector con Cascada: Empresa → Fábrica */}
              <div className="border-2 border-indigo-100 rounded-xl p-4 bg-indigo-50/30">
                <h4 className="text-sm font-semibold text-indigo-900 mb-3">派遣先選択</h4>
                <FactorySelector
                  value={formData.factory_id}
                  onChange={(factoryId) => setFormData(prev => ({ ...prev, factory_id: factoryId }))}
                  required={true}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    派遣先社員ID
                  </label>
                  <input
                    type="text"
                    name="hakensaki_shain_id"
                    value={formData.hakensaki_shain_id}
                    onChange={handleChange}
                    placeholder="派遣先での社員番号"
                    className="block w-full px-4 py-2.5 border border-gray-300 rounded-xl shadow-sm focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    配属先
                  </label>
                  <input
                    type="text"
                    name="assignment_location"
                    value={formData.assignment_location}
                    onChange={handleChange}
                    placeholder="第一工場"
                    className="block w-full px-4 py-2.5 border border-gray-300 rounded-xl shadow-sm focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    配属ライン
                  </label>
                  <input
                    type="text"
                    name="assignment_line"
                    value={formData.assignment_line}
                    onChange={handleChange}
                    placeholder="組立ライン A"
                    className="block w-full px-4 py-2.5 border border-gray-300 rounded-xl shadow-sm focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    仕事内容
                  </label>
                  <textarea
                    name="job_description"
                    value={formData.job_description}
                    onChange={handleChange}
                    rows={3}
                    placeholder="自動車部品の組立作業..."
                    className="block w-full px-4 py-2.5 border border-gray-300 rounded-xl shadow-sm focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Employment Information */}
          <div className="bg-white/90 backdrop-blur-sm shadow-lg rounded-2xl border border-gray-200">
            <div className="px-6 py-4 border-b border-gray-200 bg-gradient-to-r from-blue-50 to-indigo-50">
              <h2 className="text-lg font-bold text-gray-900">雇用情報</h2>
            </div>
            <div className="px-6 py-5 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    入社日 <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="date"
                    name="hire_date"
                    value={formData.hire_date}
                    onChange={handleChange}
                    required
                    className="block w-full px-4 py-2.5 border border-gray-300 rounded-xl shadow-sm focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    現入社
                  </label>
                  <input
                    type="date"
                    name="current_hire_date"
                    value={formData.current_hire_date}
                    onChange={handleChange}
                    className="block w-full px-4 py-2.5 border border-gray-300 rounded-xl shadow-sm focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    入社依頼
                  </label>
                  <input
                    type="date"
                    name="entry_request_date"
                    value={formData.entry_request_date}
                    onChange={handleChange}
                    className="block w-full px-4 py-2.5 border border-gray-300 rounded-xl shadow-sm focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    契約形態
                  </label>
                  <select
                    name="contract_type"
                    value={formData.contract_type}
                    onChange={handleChange}
                    className="block w-full px-4 py-2.5 border border-gray-300 rounded-xl shadow-sm focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition appearance-none"
                  >
                    <option value="派遣">派遣社員</option>
                    <option value="請負">請負社員</option>
                    <option value="スタッフ">スタッフ</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    職種
                  </label>
                  <input
                    type="text"
                    name="position"
                    value={formData.position}
                    onChange={handleChange}
                    placeholder="製造作業員"
                    className="block w-full px-4 py-2.5 border border-gray-300 rounded-xl shadow-sm focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Financial Information */}
          <div className="bg-white/90 backdrop-blur-sm shadow-lg rounded-2xl border border-gray-200">
            <div className="px-6 py-4 border-b border-gray-200 bg-gradient-to-r from-green-50 to-emerald-50">
              <h2 className="text-lg font-bold text-gray-900">給与・保険情報</h2>
            </div>
            <div className="px-6 py-5 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    時給 <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <span className="absolute inset-y-0 left-0 pl-4 flex items-center text-gray-500 font-semibold">
                      ¥
                    </span>
                    <input
                      type="number"
                      name="jikyu"
                      value={formData.jikyu}
                      onChange={handleChange}
                      required
                      min="0"
                      step="10"
                      className="block w-full pl-8 pr-4 py-2.5 border border-gray-300 rounded-xl shadow-sm focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    時給改定
                  </label>
                  <input
                    type="date"
                    name="jikyu_revision_date"
                    value={formData.jikyu_revision_date}
                    onChange={handleChange}
                    className="block w-full px-4 py-2.5 border border-gray-300 rounded-xl shadow-sm focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    請求単価
                  </label>
                  <div className="relative">
                    <span className="absolute inset-y-0 left-0 pl-4 flex items-center text-gray-500 font-semibold">
                      ¥
                    </span>
                    <input
                      type="number"
                      name="hourly_rate_charged"
                      value={formData.hourly_rate_charged}
                      onChange={handleChange}
                      min="0"
                      step="10"
                      className="block w-full pl-8 pr-4 py-2.5 border border-gray-300 rounded-xl shadow-sm focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    請求改定
                  </label>
                  <input
                    type="date"
                    name="billing_revision_date"
                    value={formData.billing_revision_date}
                    onChange={handleChange}
                    className="block w-full px-4 py-2.5 border border-gray-300 rounded-xl shadow-sm focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    差額利益
                  </label>
                  <div className="relative">
                    <span className="absolute inset-y-0 left-0 pl-4 flex items-center text-gray-500 font-semibold">
                      ¥
                    </span>
                    <input
                      type="number"
                      name="profit_difference"
                      value={formData.profit_difference}
                      onChange={handleChange}
                      min="0"
                      step="10"
                      className="block w-full pl-8 pr-4 py-2.5 border border-gray-300 rounded-xl shadow-sm focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    標準報酬
                  </label>
                  <div className="relative">
                    <span className="absolute inset-y-0 left-0 pl-4 flex items-center text-gray-500 font-semibold">
                      ¥
                    </span>
                    <input
                      type="number"
                      name="standard_compensation"
                      value={formData.standard_compensation}
                      onChange={handleChange}
                      min="0"
                      step="1000"
                      className="block w-full pl-8 pr-4 py-2.5 border border-gray-300 rounded-xl shadow-sm focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    健康保険
                  </label>
                  <div className="relative">
                    <span className="absolute inset-y-0 left-0 pl-4 flex items-center text-gray-500 font-semibold">
                      ¥
                    </span>
                    <input
                      type="number"
                      name="health_insurance"
                      value={formData.health_insurance}
                      onChange={handleChange}
                      min="0"
                      step="100"
                      className="block w-full pl-8 pr-4 py-2.5 border border-gray-300 rounded-xl shadow-sm focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    介護保険
                  </label>
                  <div className="relative">
                    <span className="absolute inset-y-0 left-0 pl-4 flex items-center text-gray-500 font-semibold">
                      ¥
                    </span>
                    <input
                      type="number"
                      name="nursing_insurance"
                      value={formData.nursing_insurance}
                      onChange={handleChange}
                      min="0"
                      step="100"
                      className="block w-full pl-8 pr-4 py-2.5 border border-gray-300 rounded-xl shadow-sm focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    厚生年金
                  </label>
                  <div className="relative">
                    <span className="absolute inset-y-0 left-0 pl-4 flex items-center text-gray-500 font-semibold">
                      ¥
                    </span>
                    <input
                      type="number"
                      name="pension_insurance"
                      value={formData.pension_insurance}
                      onChange={handleChange}
                      min="0"
                      step="100"
                      className="block w-full pl-8 pr-4 py-2.5 border border-gray-300 rounded-xl shadow-sm focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    社保加入
                  </label>
                  <input
                    type="date"
                    name="social_insurance_date"
                    value={formData.social_insurance_date}
                    onChange={handleChange}
                    className="block w-full px-4 py-2.5 border border-gray-300 rounded-xl shadow-sm focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Visa Information */}
          <div className="bg-white/90 backdrop-blur-sm shadow-lg rounded-2xl border border-gray-200">
            <div className="px-6 py-4 border-b border-gray-200 bg-gradient-to-r from-red-50 to-pink-50">
              <h2 className="text-lg font-bold text-gray-900">ビザ情報</h2>
            </div>
            <div className="px-6 py-5 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    ビザ種類
                  </label>
                  <input
                    type="text"
                    name="visa_type"
                    value={formData.visa_type}
                    onChange={handleChange}
                    placeholder="技能実習"
                    className="block w-full px-4 py-2.5 border border-gray-300 rounded-xl shadow-sm focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    ビザ期限
                  </label>
                  <input
                    type="date"
                    name="zairyu_expire_date"
                    value={formData.zairyu_expire_date}
                    onChange={handleChange}
                    className="block w-full px-4 py-2.5 border border-gray-300 rounded-xl shadow-sm focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Documents Information */}
          <div className="bg-white/90 backdrop-blur-sm shadow-lg rounded-2xl border border-gray-200">
            <div className="px-6 py-4 border-b border-gray-200 bg-gradient-to-r from-purple-50 to-indigo-50">
              <h2 className="text-lg font-bold text-gray-900">資格・証明書情報</h2>
            </div>
            <div className="px-6 py-5 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    免許種類
                  </label>
                  <input
                    type="text"
                    name="license_type"
                    value={formData.license_type}
                    onChange={handleChange}
                    placeholder="普通自動車免許"
                    className="block w-full px-4 py-2.5 border border-gray-300 rounded-xl shadow-sm focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    免許期限
                  </label>
                  <input
                    type="date"
                    name="license_expire_date"
                    value={formData.license_expire_date}
                    onChange={handleChange}
                    className="block w-full px-4 py-2.5 border border-gray-300 rounded-xl shadow-sm focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    通勤方法
                  </label>
                  <input
                    type="text"
                    name="commute_method"
                    value={formData.commute_method}
                    onChange={handleChange}
                    placeholder="自転車"
                    className="block w-full px-4 py-2.5 border border-gray-300 rounded-xl shadow-sm focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    任意保険期限
                  </label>
                  <input
                    type="date"
                    name="optional_insurance_expire"
                    value={formData.optional_insurance_expire}
                    onChange={handleChange}
                    className="block w-full px-4 py-2.5 border border-gray-300 rounded-xl shadow-sm focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    日本語検定
                  </label>
                  <input
                    type="text"
                    name="japanese_level"
                    value={formData.japanese_level}
                    onChange={handleChange}
                    placeholder="N3"
                    className="block w-full px-4 py-2.5 border border-gray-300 rounded-xl shadow-sm focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition"
                  />
                </div>

                <div className="flex items-center">
                  <input
                    type="checkbox"
                    name="career_up_5years"
                    checked={formData.career_up_5years}
                    onChange={handleChange}
                    className="h-4 w-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"
                  />
                  <label className="ml-2 block text-sm font-medium text-gray-700">
                    キャリアアップ5年目
                  </label>
                </div>
              </div>
            </div>
          </div>

          {/* Apartment Information */}
          <div className="bg-white/90 backdrop-blur-sm shadow-lg rounded-2xl border border-gray-200">
            <div className="px-6 py-4 border-b border-gray-200 bg-gradient-to-r from-yellow-50 to-amber-50">
              <h2 className="text-lg font-bold text-gray-900">社宅・住宅情報</h2>
            </div>
            <div className="px-6 py-5 space-y-4">
              {/* Checkbox: Corporate Housing */}
              <div className="flex items-center p-4 bg-indigo-50/50 rounded-xl border border-indigo-100">
                <input
                  type="checkbox"
                  name="is_corporate_housing"
                  checked={formData.is_corporate_housing}
                  onChange={handleChange}
                  className="h-5 w-5 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"
                />
                <label className="ml-3 block text-sm font-semibold text-gray-900">
                  社宅に住んでいる（Corporate Housing）
                </label>
              </div>

              {/* Conditional Fields - Only show if is_corporate_housing is true */}
              {formData.is_corporate_housing && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 border-t border-gray-200 pt-4">
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      アパート選択 <span className="text-red-500">*</span>
                    </label>
                    <ApartmentSelector
                      value={formData.apartment_id}
                      onChange={(apartmentId) => setFormData(prev => ({ ...prev, apartment_id: apartmentId }))}
                      required={formData.is_corporate_housing}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      家賃（月額）
                    </label>
                    <div className="relative">
                      <span className="absolute inset-y-0 left-0 pl-4 flex items-center text-gray-500 font-semibold">
                        ¥
                      </span>
                      <input
                        type="number"
                        name="apartment_rent"
                        value={formData.apartment_rent}
                        onChange={handleChange}
                        min="0"
                        step="1000"
                        placeholder="30000"
                        className="block w-full pl-8 pr-4 py-2.5 border border-gray-300 rounded-xl shadow-sm focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      入居日
                    </label>
                    <input
                      type="date"
                      name="apartment_start_date"
                      value={formData.apartment_start_date}
                      onChange={handleChange}
                      className="block w-full px-4 py-2.5 border border-gray-300 rounded-xl shadow-sm focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      退去日（予定）
                    </label>
                    <input
                      type="date"
                      name="apartment_move_out_date"
                      value={formData.apartment_move_out_date}
                      onChange={handleChange}
                      className="block w-full px-4 py-2.5 border border-gray-300 rounded-xl shadow-sm focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition"
                    />
                  </div>
                </div>
              )}

              {/* Housing Subsidy - Always visible */}
              <div className="border-t border-gray-200 pt-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  住宅手当（Housing Subsidy）
                </label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-4 flex items-center text-gray-500 font-semibold">
                    ¥
                  </span>
                  <input
                    type="number"
                    name="housing_subsidy"
                    value={formData.housing_subsidy}
                    onChange={handleChange}
                    min="0"
                    step="1000"
                    placeholder="10000"
                    className="block w-full pl-8 pr-4 py-2.5 border border-gray-300 rounded-xl shadow-sm focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition"
                  />
                </div>
                <p className="mt-1 text-xs text-gray-500">
                  {formData.is_corporate_housing ? '社宅の場合、会社が負担する補助金額を入力してください' : '社外住宅の場合の住宅手当を入力してください'}
                </p>
              </div>
            </div>
          </div>

          {/* Status & Notes */}
          <div className="bg-white/90 backdrop-blur-sm shadow-lg rounded-2xl border border-gray-200">
            <div className="px-6 py-4 border-b border-gray-200 bg-gradient-to-r from-gray-50 to-slate-50">
              <h2 className="text-lg font-bold text-gray-900">備考・ステータス</h2>
            </div>
            <div className="px-6 py-5 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  現在
                </label>
                <select
                  name="current_status"
                  value={formData.current_status}
                  onChange={handleChange}
                  className="block w-full px-4 py-2.5 border border-gray-300 rounded-xl shadow-sm focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition appearance-none"
                >
                  <option value="active">在籍中</option>
                  <option value="terminated">退社済</option>
                  <option value="suspended">休職中</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  備考
                </label>
                <textarea
                  name="notes"
                  value={formData.notes}
                  onChange={handleChange}
                  rows={4}
                  placeholder="その他特記事項..."
                  className="block w-full px-4 py-2.5 border border-gray-300 rounded-xl shadow-sm focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition"
                />
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex justify-end space-x-4 pb-6">
            <button
              type="button"
              onClick={() => router.push('/employees')}
              className="px-6 py-3 border border-gray-300 rounded-xl shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 transition-all hover:scale-105"
            >
              キャンセル
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-indigo-500 to-purple-500 text-white rounded-xl font-semibold shadow-lg shadow-indigo-500/30 hover:shadow-indigo-500/50 transition-all duration-300 hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
            >
              {submitting ? (
                <>
                  <svg
                    className="animate-spin -ml-1 mr-2 h-5 w-5 text-white"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    ></circle>
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    ></path>
                  </svg>
                  保存中...
                </>
              ) : (
                <>
                  {isEdit ? (
                    <>
                      <PencilIcon className="h-5 w-5 mr-2" />
                      更新
                    </>
                  ) : (
                    <>
                      <UserPlusIcon className="h-5 w-5 mr-2" />
                      登録
                    </>
                  )}
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
