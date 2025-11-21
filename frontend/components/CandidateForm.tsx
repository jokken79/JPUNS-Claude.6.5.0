'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { ArrowLeftIcon, UserPlusIcon, PencilIcon, UserCircleIcon } from '@heroicons/react/24/outline';
import { toast } from 'react-hot-toast';
import { candidateService } from '@/lib/api';
import { FloatingInput } from '@/components/ui/floating-input';
import { AnimatedTextarea } from '@/components/ui/animated-textarea';
import { DatePicker } from '@/components/ui/date-picker';
import { SearchableSelect } from '@/components/ui/searchable-select';
import { FileUpload } from '@/components/ui/file-upload';
import { Toggle } from '@/components/ui/toggle';

interface CandidateFormData {
  // Personal Information
  full_name_kanji: string;
  full_name_kana: string;
  full_name_romaji: string;
  gender: string;
  date_of_birth: string;
  nationality: string;
  current_country: string;

  // Contact Information
  email: string;
  phone: string;
  postal_code: string;
  address: string;
  emergency_contact_name: string;
  emergency_contact_phone: string;
  emergency_contact_relation: string;

  // Visa & Documents
  visa_type: string;
  visa_status: string;
  visa_expire_date: string;
  passport_number: string;
  passport_expire_date: string;

  // Education
  education_level: string;
  school_name: string;
  graduation_year: string;

  // Work Experience
  previous_job: string;
  years_of_experience: string;
  skills: string;

  // Japanese Language
  japanese_level: string;
  japanese_test: string;
  japanese_test_date: string;

  // Application
  desired_position: string;
  desired_salary: string;
  available_start_date: string;
  application_date: string;
  application_source: string;

  // Status
  status: string;
  approval_status: string;
  notes: string;
  photo_url: string;
}

interface CandidateFormProps {
  candidateId?: string;
  isEdit?: boolean;
}

export default function CandidateForm({ candidateId, isEdit = false }: CandidateFormProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [formData, setFormData] = useState<CandidateFormData>({
    full_name_kanji: '',
    full_name_kana: '',
    full_name_romaji: '',
    gender: '男',
    date_of_birth: '',
    nationality: '',
    current_country: '',
    email: '',
    phone: '',
    postal_code: '',
    address: '',
    emergency_contact_name: '',
    emergency_contact_phone: '',
    emergency_contact_relation: '',
    visa_type: '',
    visa_status: '',
    visa_expire_date: '',
    passport_number: '',
    passport_expire_date: '',
    education_level: '',
    school_name: '',
    graduation_year: '',
    previous_job: '',
    years_of_experience: '',
    skills: '',
    japanese_level: '',
    japanese_test: '',
    japanese_test_date: '',
    desired_position: '',
    desired_salary: '',
    available_start_date: '',
    application_date: new Date().toISOString().split('T')[0],
    application_source: '',
    status: 'active',
    approval_status: 'pending',
    notes: '',
    photo_url: '',
  });

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handlePhotoUpload = (files: File[]) => {
    if (files.length > 0) {
      const file = files[0];
      const reader = new FileReader();
      reader.onloadend = () => {
        setPhotoPreview(reader.result as string);
        setFormData((prev) => ({ ...prev, photo_url: reader.result as string }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validation
    if (!formData.full_name_kanji) {
      toast.error('氏名（漢字）を入力してください');
      return;
    }
    if (!formData.email) {
      toast.error('メールアドレスを入力してください');
      return;
    }

    try {
      setSubmitting(true);

      if (isEdit && candidateId) {
        // Update existing candidate
        await candidateService.updateCandidate(candidateId, formData);
      } else {
        // Create new candidate
        await candidateService.createCandidate(formData);
      }

      toast.success(isEdit ? '候補者情報を更新しました' : '候補者を登録しました');
      router.push('/candidates');
    } catch (err: any) {
      const errorMessage = err.response?.data?.detail || '保存に失敗しました';
      toast.error(errorMessage);
      console.error('Error saving candidate:', err);
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
              onClick={() => router.push('/candidates')}
              className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-xl shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 transition"
            >
              <ArrowLeftIcon className="h-5 w-5 mr-2" />
              戻る
            </button>
            <h1 className="text-3xl font-black bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
              {isEdit ? '候補者情報編集' : '候補者新規登録'}
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
              <FileUpload
                accept="image/*"
                maxSize={5 * 1024 * 1024}
                maxFiles={1}
                multiple={false}
                showPreview
                animated
                mode="compact"
                onUpload={handlePhotoUpload}
              />
            </div>
          </div>

          {/* Personal Information */}
          <div className="bg-white/90 backdrop-blur-sm shadow-lg rounded-2xl border border-gray-200">
            <div className="px-6 py-4 border-b border-gray-200 bg-gradient-to-r from-purple-50 to-blue-50">
              <h2 className="text-lg font-bold text-gray-900">個人情報</h2>
            </div>
            <div className="px-6 py-5 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FloatingInput
                  label="氏名（漢字）"
                  name="full_name_kanji"
                  value={formData.full_name_kanji}
                  onChange={(e) => handleChange(e)}
                  required
                  placeholder="山田 太郎"
                />

                <FloatingInput
                  label="氏名（カナ）"
                  name="full_name_kana"
                  value={formData.full_name_kana}
                  onChange={(e) => handleChange(e)}
                  placeholder="ヤマダ タロウ"
                />

                <FloatingInput
                  label="氏名（ローマ字）"
                  name="full_name_romaji"
                  value={formData.full_name_romaji}
                  onChange={(e) => handleChange(e)}
                  placeholder="Yamada Taro"
                />

                <SearchableSelect
                  label="性別"
                  options={[
                    { value: '男', label: '男性' },
                    { value: '女', label: '女性' },
                    { value: 'その他', label: 'その他' },
                  ]}
                  value={formData.gender}
                  onChange={(value) =>
                    setFormData((prev) => ({ ...prev, gender: value as string }))
                  }
                />

                <DatePicker
                  label="生年月日"
                  value={formData.date_of_birth ? new Date(formData.date_of_birth) : undefined}
                  onChange={(date) =>
                    setFormData((prev) => ({
                      ...prev,
                      date_of_birth: date?.toISOString().split('T')[0] || '',
                    }))
                  }
                />

                <FloatingInput
                  label="国籍"
                  name="nationality"
                  value={formData.nationality}
                  onChange={(e) => handleChange(e)}
                  placeholder="日本"
                />
              </div>
            </div>
          </div>

          {/* Contact Information */}
          <div className="bg-white/90 backdrop-blur-sm shadow-lg rounded-2xl border border-gray-200">
            <div className="px-6 py-4 border-b border-gray-200 bg-gradient-to-r from-orange-50 to-yellow-50">
              <h2 className="text-lg font-bold text-gray-900">連絡先情報</h2>
            </div>
            <div className="px-6 py-5 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FloatingInput
                  label="メールアドレス"
                  name="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => handleChange(e)}
                  required
                  placeholder="example@email.com"
                />

                <FloatingInput
                  label="電話番号"
                  name="phone"
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => handleChange(e)}
                  placeholder="090-1234-5678"
                />

                <FloatingInput
                  label="郵便番号"
                  name="postal_code"
                  value={formData.postal_code}
                  onChange={(e) => handleChange(e)}
                  placeholder="123-4567"
                />

                <div className="md:col-span-2">
                  <FloatingInput
                    label="住所"
                    name="address"
                    value={formData.address}
                    onChange={(e) => handleChange(e)}
                    placeholder="愛知県名古屋市..."
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
                <FloatingInput
                  label="ビザ種類"
                  name="visa_type"
                  value={formData.visa_type}
                  onChange={(e) => handleChange(e)}
                  placeholder="技能実習"
                />

                <DatePicker
                  label="ビザ期限"
                  value={formData.visa_expire_date ? new Date(formData.visa_expire_date) : undefined}
                  onChange={(date) =>
                    setFormData((prev) => ({
                      ...prev,
                      visa_expire_date: date?.toISOString().split('T')[0] || '',
                    }))
                  }
                />
              </div>
            </div>
          </div>

          {/* Japanese Language Skills */}
          <div className="bg-white/90 backdrop-blur-sm shadow-lg rounded-2xl border border-gray-200">
            <div className="px-6 py-4 border-b border-gray-200 bg-gradient-to-r from-blue-50 to-indigo-50">
              <h2 className="text-lg font-bold text-gray-900">日本語能力</h2>
            </div>
            <div className="px-6 py-5 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <SearchableSelect
                  label="日本語レベル"
                  options={[
                    { value: 'N1', label: 'N1 (最上級)' },
                    { value: 'N2', label: 'N2 (上級)' },
                    { value: 'N3', label: 'N3 (中級)' },
                    { value: 'N4', label: 'N4 (初級)' },
                    { value: 'N5', label: 'N5 (入門)' },
                  ]}
                  value={formData.japanese_level}
                  onChange={(value) =>
                    setFormData((prev) => ({ ...prev, japanese_level: value as string }))
                  }
                />

                <FloatingInput
                  label="試験名"
                  name="japanese_test"
                  value={formData.japanese_test}
                  onChange={(e) => handleChange(e)}
                  placeholder="JLPT N3"
                />
              </div>
            </div>
          </div>

          {/* Application Information */}
          <div className="bg-white/90 backdrop-blur-sm shadow-lg rounded-2xl border border-gray-200">
            <div className="px-6 py-4 border-b border-gray-200 bg-gradient-to-r from-green-50 to-emerald-50">
              <h2 className="text-lg font-bold text-gray-900">応募情報</h2>
            </div>
            <div className="px-6 py-5 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FloatingInput
                  label="希望職種"
                  name="desired_position"
                  value={formData.desired_position}
                  onChange={(e) => handleChange(e)}
                  placeholder="製造作業員"
                />

                <FloatingInput
                  label="希望給与"
                  name="desired_salary"
                  type="number"
                  value={formData.desired_salary}
                  onChange={(e) => handleChange(e)}
                  placeholder="250000"
                />

                <DatePicker
                  label="就業可能日"
                  value={formData.available_start_date ? new Date(formData.available_start_date) : undefined}
                  onChange={(date) =>
                    setFormData((prev) => ({
                      ...prev,
                      available_start_date: date?.toISOString().split('T')[0] || '',
                    }))
                  }
                />
              </div>
            </div>
          </div>

          {/* Notes */}
          <div className="bg-white/90 backdrop-blur-sm shadow-lg rounded-2xl border border-gray-200">
            <div className="px-6 py-4 border-b border-gray-200 bg-gradient-to-r from-gray-50 to-slate-50">
              <h2 className="text-lg font-bold text-gray-900">備考</h2>
            </div>
            <div className="px-6 py-5">
              <AnimatedTextarea
                label="備考"
                name="notes"
                value={formData.notes}
                onChange={(e) => handleChange(e)}
                rows={4}
                maxLength={1000}
                showCounter
                autoResize
                placeholder="その他特記事項..."
              />
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex justify-end space-x-4 pb-6">
            <button
              type="button"
              onClick={() => router.push('/candidates')}
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
