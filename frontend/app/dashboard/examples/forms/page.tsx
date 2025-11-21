'use client';

import React, { useState } from 'react';
import { FloatingInput } from '@/components/ui/floating-input';
import { EnhancedInput } from '@/components/ui/enhanced-input';
import { AnimatedTextarea } from '@/components/ui/animated-textarea';
import { FormField } from '@/components/ui/form-field';
import { Toggle } from '@/components/ui/toggle';
import { PasswordInput } from '@/components/ui/password-input';
import { PhoneInput } from '@/components/ui/phone-input';
import { FileUpload } from '@/components/ui/file-upload';
import { DatePicker } from '@/components/ui/date-picker';
import { SearchableSelect } from '@/components/ui/searchable-select';
import {
  MultiStepForm,
  Step,
  Progress,
  Content,
  Navigation,
} from '@/components/ui/multi-step-form';
import {
  UserIcon,
  EnvelopeIcon,
  BriefcaseIcon,
  CheckIcon,
  BellIcon,
  SunIcon,
  MoonIcon,
} from '@heroicons/react/24/outline';

export default function FormsExamplesPage() {
  const [floatingValue, setFloatingValue] = useState('');
  const [enhancedValue, setEnhancedValue] = useState('');
  const [textareaValue, setTextareaValue] = useState('');
  const [toggleValue, setToggleValue] = useState(false);
  const [passwordValue, setPasswordValue] = useState('');
  const [phoneValue, setPhoneValue] = useState('');
  const [dateValue, setDateValue] = useState<Date>();
  const [selectValue, setSelectValue] = useState<string>('');
  const [multiSelectValue, setMultiSelectValue] = useState<string[]>([]);

  const selectOptions = [
    { value: 'option1', label: 'オプション 1', description: '最初のオプション' },
    { value: 'option2', label: 'オプション 2', description: '2番目のオプション' },
    { value: 'option3', label: 'オプション 3', description: '3番目のオプション' },
    { value: 'option4', label: 'オプション 4', description: '4番目のオプション' },
    { value: 'option5', label: 'オプション 5', description: '5番目のオプション' },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-muted/20 p-6">
      <div className="max-w-6xl mx-auto space-y-8">
        {/* Header */}
        <div>
          <h1 className="text-4xl font-foreground bg-gradient-to-r from-primary to-primary/90 bg-clip-text text-transparent mb-2">
            フォームコンポーネント例
          </h1>
          <p className="text-muted-foreground">
            モダンなUXを提供する強化されたフォームコンポーネント
          </p>
        </div>

        {/* Floating Input Examples */}
        <section className="bg-card/90 backdrop-blur-sm shadow-lg rounded-2xl border p-6">
          <h2 className="text-2xl font-bold mb-4">フローティングラベル入力</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <FloatingInput
              label="メールアドレス"
              type="email"
              value={floatingValue}
              onChange={(e) => setFloatingValue(e.target.value)}
              required
              leadingIcon={<EnvelopeIcon className="w-5 h-5" />}
              onClear={() => setFloatingValue('')}
            />

            <FloatingInput
              label="ユーザー名"
              value={floatingValue}
              onChange={(e) => setFloatingValue(e.target.value)}
              error="このユーザー名は既に使用されています"
              leadingIcon={<UserIcon className="w-5 h-5" />}
            />
          </div>
        </section>

        {/* Enhanced Input Examples */}
        <section className="bg-card/90 backdrop-blur-sm shadow-lg rounded-2xl border p-6">
          <h2 className="text-2xl font-bold mb-4">バリデーション付き入力</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <EnhancedInput
              label="成功状態"
              status="success"
              message="利用可能なユーザー名です"
              value={enhancedValue}
              onChange={(e) => setEnhancedValue(e.target.value)}
              clearable
              onClear={() => setEnhancedValue('')}
            />

            <EnhancedInput
              label="エラー状態"
              status="error"
              message="無効なメールアドレス形式です"
              value={enhancedValue}
              onChange={(e) => setEnhancedValue(e.target.value)}
            />

            <EnhancedInput
              label="警告状態"
              status="warning"
              message="パスワードの強度が低いです"
              value={enhancedValue}
              onChange={(e) => setEnhancedValue(e.target.value)}
            />

            <EnhancedInput
              label="ローディング状態"
              isLoading
              hint="ユーザー名を確認中..."
              value={enhancedValue}
              onChange={(e) => setEnhancedValue(e.target.value)}
            />
          </div>
        </section>

        {/* Animated Textarea */}
        <section className="bg-card/90 backdrop-blur-sm shadow-lg rounded-2xl border p-6">
          <h2 className="text-2xl font-bold mb-4">アニメーション付きテキストエリア</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <AnimatedTextarea
              label="自己紹介"
              value={textareaValue}
              onChange={(e) => setTextareaValue(e.target.value)}
              maxLength={500}
              showCounter
              autoResize
              hint="500文字以内で入力してください"
            />

            <AnimatedTextarea
              label="コメント"
              status="success"
              message="保存されました"
              value={textareaValue}
              onChange={(e) => setTextareaValue(e.target.value)}
              rows={5}
            />
          </div>
        </section>

        {/* Form Field Composition */}
        <section className="bg-card/90 backdrop-blur-sm shadow-lg rounded-2xl border p-6">
          <h2 className="text-2xl font-bold mb-4">フォームフィールド構成</h2>
          <div className="space-y-4">
            <FormField status="success">
              <FormField.Label required>フルネーム</FormField.Label>
              <FormField.Input
                placeholder="山田 太郎"
                leadingIcon={<UserIcon className="w-5 h-5" />}
              />
              <FormField.Hint>本名を入力してください</FormField.Hint>
            </FormField>

            <FormField error="メールアドレスは必須です">
              <FormField.Label required>メールアドレス</FormField.Label>
              <FormField.Input
                type="email"
                placeholder="example@email.com"
                leadingIcon={<EnvelopeIcon className="w-5 h-5" />}
              />
              <FormField.Error />
            </FormField>

            <FormField>
              <FormField.Label>備考</FormField.Label>
              <FormField.Textarea
                placeholder="追加情報を入力..."
                rows={3}
              />
              <FormField.Hint>任意項目です</FormField.Hint>
            </FormField>
          </div>
        </section>

        {/* Toggle Switches */}
        <section className="bg-card/90 backdrop-blur-sm shadow-lg rounded-2xl border p-6">
          <h2 className="text-2xl font-bold mb-4">トグルスイッチ</h2>
          <div className="space-y-6">
            <Toggle
              label="通知を有効にする"
              description="新しいメッセージの通知を受け取る"
              checked={toggleValue}
              onChange={setToggleValue}
              size="md"
              checkedIcon={<BellIcon className="w-4 h-4" />}
            />

            <Toggle
              leftLabel="ライトモード"
              rightLabel="ダークモード"
              labelPosition="both"
              size="lg"
              checkedIcon={<MoonIcon className="w-4 h-4" />}
              uncheckedIcon={<SunIcon className="w-4 h-4" />}
            />

            <Toggle
              label="読み込み中..."
              isLoading
              size="sm"
            />
          </div>
        </section>

        {/* Password Input */}
        <section className="bg-card/90 backdrop-blur-sm shadow-lg rounded-2xl border p-6">
          <h2 className="text-2xl font-bold mb-4">パスワード入力</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <PasswordInput
              label="新しいパスワード"
              value={passwordValue}
              onChange={(e) => setPasswordValue(e.target.value)}
              showStrengthMeter
              showRequirements
              required
            />

            <PasswordInput
              label="パスワード確認"
              value={passwordValue}
              onChange={(e) => setPasswordValue(e.target.value)}
              hint="上記と同じパスワードを入力してください"
            />
          </div>
        </section>

        {/* Phone Input */}
        <section className="bg-card/90 backdrop-blur-sm shadow-lg rounded-2xl border p-6">
          <h2 className="text-2xl font-bold mb-4">電話番号入力</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <PhoneInput
              label="携帯電話番号"
              value={phoneValue}
              onChange={(value) => setPhoneValue(value)}
              defaultCountry="JP"
              required
            />

            <PhoneInput
              label="国際電話番号"
              value={phoneValue}
              onChange={(value) => setPhoneValue(value)}
              defaultCountry="US"
              hint="国際形式で入力してください"
            />
          </div>
        </section>

        {/* File Upload */}
        <section className="bg-white/90 backdrop-blur-sm shadow-lg rounded-2xl border border-gray-200 p-6">
          <h2 className="text-2xl font-bold mb-4">ファイルアップロード</h2>
          <div className="space-y-6">
            <FileUpload
              label="画像をアップロード"
              accept="image/*"
              maxSize={5 * 1024 * 1024}
              maxFiles={5}
              multiple
              showPreview
              animated
              hint="JPG, PNG, GIF (最大5MB)"
              onUpload={(files) => console.log('Uploaded:', files)}
            />

            <FileUpload
              label="ドキュメント (コンパクトモード)"
              accept=".pdf,.doc,.docx"
              mode="compact"
              maxFiles={3}
              onUpload={(files) => console.log('Uploaded:', files)}
            />
          </div>
        </section>

        {/* Date Picker */}
        <section className="bg-card/90 backdrop-blur-sm shadow-lg rounded-2xl border p-6">
          <h2 className="text-2xl font-bold mb-4">日付ピッカー</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <DatePicker
              label="生年月日"
              value={dateValue}
              onChange={setDateValue}
              placeholder="日付を選択してください"
              required
            />

            <DatePicker
              label="入社日"
              value={dateValue}
              onChange={setDateValue}
              hint="YYYY年MM月DD日形式"
            />
          </div>
        </section>

        {/* Searchable Select */}
        <section className="bg-card/90 backdrop-blur-sm shadow-lg rounded-2xl border p-6">
          <h2 className="text-2xl font-bold mb-4">検索可能セレクト</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <SearchableSelect
              label="オプションを選択"
              options={selectOptions}
              value={selectValue}
              onChange={(value) => setSelectValue(value as string)}
              placeholder="選択してください"
              searchPlaceholder="検索..."
              clearable
            />

            <SearchableSelect
              label="複数選択"
              options={selectOptions}
              value={multiSelectValue}
              onChange={(value) => setMultiSelectValue(value as string[])}
              multiple
              placeholder="複数選択可能"
              searchPlaceholder="検索..."
            />
          </div>
        </section>

        {/* Multi-Step Form */}
        <section className="bg-card/90 backdrop-blur-sm shadow-lg rounded-2xl border p-6">
          <h2 className="text-2xl font-bold mb-6">マルチステップフォーム</h2>
          <MultiStepForm
            onSubmit={() => alert('フォーム送信完了！')}
            saveProgress
          >
            <Progress className="mb-8">
              <Step
                title="個人情報"
                description="基本情報を入力"
                icon={<UserIcon className="w-5 h-5" />}
              >
                <div className="space-y-4 p-6">
                  <h3 className="text-lg font-semibold mb-4">個人情報を入力してください</h3>
                </div>
              </Step>

              <Step
                title="雇用情報"
                description="職務情報を入力"
                icon={<BriefcaseIcon className="w-5 h-5" />}
              >
                <div className="space-y-4 p-6">
                  <h3 className="text-lg font-semibold mb-4">雇用情報を入力してください</h3>
                </div>
              </Step>

              <Step
                title="確認"
                description="内容を確認"
                icon={<CheckIcon className="w-5 h-5" />}
              >
                <div className="space-y-4 p-6">
                  <h3 className="text-lg font-semibold mb-4">入力内容を確認してください</h3>
                </div>
              </Step>
            </Progress>

            <Content>
              <Step
                title="個人情報"
                description="基本情報を入力"
                icon={<UserIcon className="w-5 h-5" />}
              >
                <div className="space-y-4 p-6">
                  <h3 className="text-lg font-semibold mb-4">個人情報を入力してください</h3>
                  <FloatingInput
                    label="氏名"
                    placeholder="山田 太郎"
                    required
                  />
                  <FloatingInput
                    label="メールアドレス"
                    type="email"
                    placeholder="example@email.com"
                    required
                  />
                  <DatePicker
                    label="生年月日"
                    placeholder="日付を選択"
                  />
                </div>
              </Step>

              <Step
                title="雇用情報"
                description="職務情報を入力"
                icon={<BriefcaseIcon className="w-5 h-5" />}
              >
                <div className="space-y-4 p-6">
                  <h3 className="text-lg font-semibold mb-4">雇用情報を入力してください</h3>
                  <SearchableSelect
                    label="部署"
                    options={selectOptions}
                    placeholder="部署を選択"
                  />
                  <FloatingInput
                    label="役職"
                    placeholder="エンジニア"
                  />
                  <DatePicker
                    label="入社日"
                    placeholder="日付を選択"
                  />
                </div>
              </Step>

              <Step
                title="確認"
                description="内容を確認"
                icon={<CheckIcon className="w-5 h-5" />}
              >
                <div className="space-y-4 p-6">
                  <h3 className="text-lg font-semibold mb-4">入力内容を確認してください</h3>
                  <div className="bg-muted rounded-lg p-4 space-y-2">
                    <p className="text-sm text-muted-foreground">
                      入力された情報を確認して、問題なければ送信してください。
                    </p>
                  </div>
                </div>
              </Step>
            </Content>

            <Navigation
              nextLabel="次へ進む"
              previousLabel="前に戻る"
              submitLabel="送信する"
            />
          </MultiStepForm>
        </section>

        {/* Complete Form Example */}
        <section className="bg-white/90 backdrop-blur-sm shadow-lg rounded-2xl border border-gray-200 p-6">
          <h2 className="text-2xl font-bold mb-4">完全なフォーム例</h2>
          <form className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <FloatingInput
                label="氏名"
                required
                leadingIcon={<UserIcon className="w-5 h-5" />}
              />
              <FloatingInput
                label="メールアドレス"
                type="email"
                required
                leadingIcon={<EnvelopeIcon className="w-5 h-5" />}
              />
            </div>

            <PhoneInput
              label="電話番号"
              defaultCountry="JP"
              required
            />

            <DatePicker
              label="生年月日"
              required
            />

            <SearchableSelect
              label="部署"
              options={selectOptions}
              required
            />

            <AnimatedTextarea
              label="自己紹介"
              maxLength={500}
              showCounter
              autoResize
            />

            <FileUpload
              label="履歴書をアップロード"
              accept=".pdf,.doc,.docx"
              maxSize={10 * 1024 * 1024}
            />

            <Toggle
              label="利用規約に同意する"
            />

            <div className="flex justify-end gap-4 pt-4">
              <button
                type="button"
                className="px-6 py-2 border border-input rounded-lg text-sm font-medium text-muted-foreground hover:bg-accent transition-all"
              >
                キャンセル
              </button>
              <button
                type="submit"
                className="px-6 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:bg-primary/80 transition-all shadow-lg"
              >
                登録する
              </button>
            </div>
          </form>
        </section>
      </div>
    </div>
  );
}
