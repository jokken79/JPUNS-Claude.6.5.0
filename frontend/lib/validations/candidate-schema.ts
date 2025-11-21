import { z } from 'zod';

/**
 * Candidate Form Validation Schema
 *
 * Comprehensive validation for all candidate fields
 * with Japanese error messages
 */

// Helper regexes
const japanesePhoneRegex = /^(0[0-9]{1,4}-[0-9]{1,4}-[0-9]{4}|[0-9]{10,11})$/;
const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const postalCodeRegex = /^\d{3}-?\d{4}$/;

export const candidateSchema = z.object({
  // ===== Personal Information =====
  full_name_kanji: z
    .string()
    .min(1, '氏名（漢字）を入力してください')
    .max(100, '氏名は100文字以内で入力してください'),

  full_name_kana: z
    .string()
    .max(100, 'フリガナは100文字以内で入力してください')
    .optional()
    .or(z.literal('')),

  full_name_romaji: z
    .string()
    .max(100, 'ローマ字氏名は100文字以内で入力してください')
    .optional()
    .or(z.literal('')),

  gender: z.enum(['男', '女', 'その他'], {
    errorMap: () => ({ message: '性別を選択してください' }),
  }),

  date_of_birth: z
    .string()
    .min(1, '生年月日を入力してください')
    .refine(
      (date) => {
        const birthDate = new Date(date);
        const today = new Date();
        const age = today.getFullYear() - birthDate.getFullYear();
        return age >= 15 && age <= 100;
      },
      { message: '生年月日が有効な範囲ではありません（15-100歳）' }
    ),

  nationality: z
    .string()
    .min(1, '国籍を入力してください')
    .max(50, '国籍は50文字以内で入力してください'),

  current_country: z
    .string()
    .max(50, '現在の国は50文字以内で入力してください')
    .optional()
    .or(z.literal('')),

  // ===== Contact Information =====
  email: z
    .string()
    .min(1, 'メールアドレスを入力してください')
    .regex(emailRegex, '有効なメールアドレスを入力してください')
    .max(100, 'メールアドレスは100文字以内で入力してください')
    .toLowerCase(),

  phone: z
    .string()
    .min(1, '電話番号を入力してください')
    .regex(japanesePhoneRegex, '有効な電話番号を入力してください（例: 090-1234-5678）'),

  postal_code: z
    .string()
    .regex(postalCodeRegex, '有効な郵便番号を入力してください（例: 123-4567）')
    .optional()
    .or(z.literal('')),

  address: z
    .string()
    .max(200, '住所は200文字以内で入力してください')
    .optional()
    .or(z.literal('')),

  emergency_contact_name: z
    .string()
    .max(100, '緊急連絡先氏名は100文字以内で入力してください')
    .optional()
    .or(z.literal('')),

  emergency_contact_phone: z
    .string()
    .regex(japanesePhoneRegex, '有効な電話番号を入力してください（例: 090-1234-5678）')
    .optional()
    .or(z.literal(''))
    .or(z.string().length(0)),

  emergency_contact_relation: z
    .string()
    .max(50, '続柄は50文字以内で入力してください')
    .optional()
    .or(z.literal('')),

  // ===== Visa & Documents =====
  visa_type: z
    .string()
    .max(50, '在留資格は50文字以内で入力してください')
    .optional()
    .or(z.literal('')),

  visa_status: z
    .string()
    .max(50, '在留資格ステータスは50文字以内で入力してください')
    .optional()
    .or(z.literal('')),

  visa_expire_date: z
    .string()
    .optional()
    .or(z.literal(''))
    .refine(
      (date) => {
        if (!date || date === '') return true;
        const expireDate = new Date(date);
        return expireDate > new Date();
      },
      { message: '有効期限が過去の日付です' }
    ),

  passport_number: z
    .string()
    .max(20, 'パスポート番号は20文字以内で入力してください')
    .optional()
    .or(z.literal('')),

  passport_expire_date: z
    .string()
    .optional()
    .or(z.literal(''))
    .refine(
      (date) => {
        if (!date || date === '') return true;
        const expireDate = new Date(date);
        return expireDate > new Date();
      },
      { message: '有効期限が過去の日付です' }
    ),

  // ===== Education =====
  education_level: z
    .string()
    .max(50, '最終学歴は50文字以内で入力してください')
    .optional()
    .or(z.literal('')),

  school_name: z
    .string()
    .max(100, '学校名は100文字以内で入力してください')
    .optional()
    .or(z.literal('')),

  graduation_year: z
    .string()
    .max(4, '卒業年は4文字以内で入力してください')
    .optional()
    .or(z.literal(''))
    .refine(
      (year) => {
        if (!year || year === '') return true;
        const y = parseInt(year);
        const currentYear = new Date().getFullYear();
        return y >= 1950 && y <= currentYear + 10;
      },
      { message: '卒業年が有効な範囲ではありません' }
    ),

  // ===== Work Experience =====
  previous_job: z
    .string()
    .max(100, '前職は100文字以内で入力してください')
    .optional()
    .or(z.literal('')),

  years_of_experience: z
    .string()
    .max(10, '経験年数は10文字以内で入力してください')
    .optional()
    .or(z.literal(''))
    .refine(
      (years) => {
        if (!years || years === '') return true;
        const y = parseFloat(years);
        return y >= 0 && y <= 50;
      },
      { message: '経験年数が有効な範囲ではありません（0-50年）' }
    ),

  skills: z
    .string()
    .max(500, 'スキルは500文字以内で入力してください')
    .optional()
    .or(z.literal('')),

  // ===== Japanese Language =====
  japanese_level: z
    .string()
    .max(20, '日本語レベルは20文字以内で入力してください')
    .optional()
    .or(z.literal('')),

  japanese_test: z
    .string()
    .max(50, '日本語試験は50文字以内で入力してください')
    .optional()
    .or(z.literal('')),

  japanese_test_date: z
    .string()
    .optional()
    .or(z.literal('')),

  // ===== Application =====
  desired_position: z
    .string()
    .max(100, '希望職種は100文字以内で入力してください')
    .optional()
    .or(z.literal('')),

  desired_salary: z
    .string()
    .max(20, '希望給与は20文字以内で入力してください')
    .optional()
    .or(z.literal('')),

  available_start_date: z
    .string()
    .optional()
    .or(z.literal('')),

  application_date: z
    .string()
    .min(1, '申請日を入力してください'),

  application_source: z
    .string()
    .max(100, '応募経路は100文字以内で入力してください')
    .optional()
    .or(z.literal('')),

  // ===== Status =====
  status: z.enum(['active', 'inactive', 'pending'], {
    errorMap: () => ({ message: '有効なステータスを選択してください' }),
  }),

  approval_status: z.enum(['pending', 'approved', 'rejected'], {
    errorMap: () => ({ message: '有効な承認ステータスを選択してください' }),
  }),

  notes: z
    .string()
    .max(1000, '備考は1000文字以内で入力してください')
    .optional()
    .or(z.literal('')),

  photo_url: z
    .string()
    .optional()
    .or(z.literal('')),
});

export type CandidateFormData = z.infer<typeof candidateSchema>;

/**
 * Validate candidate form data
 * @param data Form data to validate
 * @returns Validation result with parsed data or errors
 */
export function validateCandidateForm(data: unknown) {
  return candidateSchema.safeParse(data);
}

/**
 * Get validation errors as a key-value object
 * @param errors Zod validation errors
 * @returns Object with field names as keys and error messages as values
 */
export function getValidationErrors(errors: z.ZodError) {
  const fieldErrors: Record<string, string> = {};

  errors.errors.forEach((error) => {
    const path = error.path.join('.');
    fieldErrors[path] = error.message;
  });

  return fieldErrors;
}
