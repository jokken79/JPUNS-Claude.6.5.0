'use client';

import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { toast } from 'react-hot-toast';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  BuildingOffice2Icon,
  ArrowLeftIcon,
  CheckCircleIcon,
} from '@heroicons/react/24/outline';
import { factoryService } from '@/lib/api';

interface FactoryFormData {
  factory_id: string;
  name: string;
  address?: string;
  phone?: string;
  contact_person?: string;
  is_active: boolean;
}

export default function NewFactoryPage() {
  const router = useRouter();
  const [formData, setFormData] = useState<FactoryFormData>({
    factory_id: '',
    name: '',
    address: '',
    phone: '',
    contact_person: '',
    is_active: true,
  });

  const createMutation = useMutation({
    mutationFn: (data: FactoryFormData) => factoryService.createFactory(data),
    onSuccess: () => {
      toast.success('工場を作成しました');
      router.push('/dashboard/factories');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.detail || '作成に失敗しました');
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createMutation.mutate(formData);
  };

  const handleChange = (field: keyof FactoryFormData, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-muted/20 p-4 sm:p-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <Link href="/factories">
            <button className="inline-flex items-center text-muted-foreground hover:text-foreground mb-4 transition-colors">
              <ArrowLeftIcon className="h-5 w-5 mr-2" />
              工場一覧に戻る
            </button>
          </Link>

          <div className="flex items-center gap-4">
            <div className="p-4 bg-gradient-to-br from-primary to-primary/90 rounded-2xl shadow-lg">
              <BuildingOffice2Icon className="h-10 w-10 text-primary-foreground" />
            </div>
            <div>
              <h1 className="text-4xl font-extrabold text-foreground">新規工場登録</h1>
              <p className="text-muted-foreground mt-1">新しい派遣先を登録します</p>
            </div>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="bg-card rounded-2xl shadow-xl border overflow-hidden">
          <div className="p-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Factory ID */}
              <div className="md:col-span-1">
                <label className="block text-sm font-semibold text-foreground mb-2">
                  工場ID <span className="text-destructive">*</span>
                </label>
                <input
                  type="text"
                  value={formData.factory_id}
                  onChange={(e) => handleChange('factory_id', e.target.value)}
                  required
                  placeholder="例: Factory-001"
                  className="w-full px-4 py-3 border-2 border-input rounded-xl focus:ring-2 focus:ring-primary focus:border-primary transition-all bg-background"
                />
                <p className="mt-1.5 text-xs text-gray-500">一意の工場IDを入力してください</p>
              </div>

              {/* Factory Name */}
              <div className="md:col-span-1">
                <label className="block text-sm font-semibold text-foreground mb-2">
                  工場名 <span className="text-destructive">*</span>
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => handleChange('name', e.target.value)}
                  required
                  placeholder="例: 高雄工業株式会社 本社工場"
                  className="w-full px-4 py-3 border-2 border-input rounded-xl focus:ring-2 focus:ring-primary focus:border-primary transition-all bg-background"
                />
              </div>

              {/* Address */}
              <div className="md:col-span-2">
                <label className="block text-sm font-semibold text-foreground mb-2">
                  住所
                </label>
                <textarea
                  value={formData.address}
                  onChange={(e) => handleChange('address', e.target.value)}
                  rows={3}
                  placeholder="例: 〒700-0000 岡山県岡山市北区..."
                  className="w-full px-4 py-3 border-2 border-input rounded-xl focus:ring-2 focus:ring-primary focus:border-primary transition-all resize-none bg-background"
                />
              </div>

              {/* Phone */}
              <div className="md:col-span-1">
                <label className="block text-sm font-semibold text-foreground mb-2">
                  電話番号
                </label>
                <input
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => handleChange('phone', e.target.value)}
                  placeholder="例: 086-123-4567"
                  className="w-full px-4 py-3 border-2 border-input rounded-xl focus:ring-2 focus:ring-primary focus:border-primary transition-all bg-background"
                />
              </div>

              {/* Contact Person */}
              <div className="md:col-span-1">
                <label className="block text-sm font-semibold text-foreground mb-2">
                  担当者名
                </label>
                <input
                  type="text"
                  value={formData.contact_person}
                  onChange={(e) => handleChange('contact_person', e.target.value)}
                  placeholder="例: 山田 太郎"
                  className="w-full px-4 py-3 border-2 border-input rounded-xl focus:ring-2 focus:ring-primary focus:border-primary transition-all bg-background"
                />
              </div>

              {/* Is Active */}
              <div className="md:col-span-2">
                <div className="flex items-center p-4 bg-muted rounded-xl border-2 border-input">
                  <input
                    type="checkbox"
                    id="is_active"
                    checked={formData.is_active}
                    onChange={(e) => handleChange('is_active', e.target.checked)}
                    className="h-5 w-5 text-primary focus:ring-primary border-input rounded cursor-pointer"
                  />
                  <label htmlFor="is_active" className="ml-3 cursor-pointer">
                    <span className="text-sm font-semibold text-foreground">稼働中</span>
                    <p className="text-xs text-muted-foreground mt-0.5">この工場を稼働状態で登録します</p>
                  </label>
                </div>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="px-8 py-6 bg-muted border-t border-input flex justify-end gap-4">
            <Link href="/factories">
              <button
                type="button"
                className="px-6 py-3 border-2 border-input text-muted-foreground rounded-xl hover:bg-accent font-medium transition-all"
              >
                キャンセル
              </button>
            </Link>
            <button
              type="submit"
              disabled={createMutation.isPending}
              className="inline-flex items-center px-8 py-3 border border-transparent text-sm font-semibold rounded-xl shadow-lg text-primary-foreground bg-gradient-to-r from-primary to-primary/90 hover:from-primary/80 hover:to-primary/80 disabled:opacity-50 disabled:cursor-not-allowed transform hover:scale-105 transition-all duration-200"
            >
              {createMutation.isPending ? (
                <>
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  作成中...
                </>
              ) : (
                <>
                  <CheckCircleIcon className="h-5 w-5 mr-2" />
                  工場を登録
                </>
              )}
            </button>
          </div>
        </form>

        {/* Info Box */}
        <div className="mt-6 bg-primary/10 border-2 border-primary/30 rounded-xl p-6">
          <div className="flex gap-3">
            <div className="flex-shrink-0">
              <svg className="h-6 w-6 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div>
              <h3 className="text-sm font-semibold text-primary mb-1">ヒント</h3>
              <ul className="text-sm text-primary/80 space-y-1">
                <li>• 工場IDは一意である必要があります（例: Factory-001, Factory-002）</li>
                <li>• 工場名には会社名と工場名を含めると分かりやすくなります</li>
                <li>• 担当者名は後から変更可能です</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
