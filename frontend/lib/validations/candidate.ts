import { z } from 'zod'

export const candidateSchema = z.object({
  // Información básica (REQUERIDOS)
  nameKanji: z.string().min(1, '氏名（漢字）を入力してください'),
  nameFurigana: z.string().min(1, 'フリガナを入力してください'),

  // Email (con validación de formato)
  email: z.string().email('有効なメールアドレスを入力してください').optional().or(z.literal('')),

  // Fecha de nacimiento (con validación de rango)
  birthday: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, '生年月日の形式が不正です（YYYY-MM-DD）').refine(
    (date) => {
      const birthDate = new Date(date)
      const today = new Date()
      return birthDate < today
    },
    { message: '生年月日は過去の日付である必要があります' }
  ).optional().or(z.literal('')),

  // Teléfono (con validación de formato japonés)
  mobile: z.string().regex(/^[0-9-+()]+$/, '電話番号の形式が不正です').optional().or(z.literal('')),
  phone: z.string().regex(/^[0-9-+()]+$/, '電話番号の形式が不正です').optional().or(z.literal('')),

  // Código postal (formato japonés XXX-XXXX)
  postalCode: z.string().regex(/^\d{3}-\d{4}$/, '郵便番号の形式が不正です（XXX-XXXX）').optional().or(z.literal('')),

  // Género
  gender: z.enum(['男性', '女性', 'その他', '']).optional(),

  // Nacionalidad
  nationality: z.string().optional(),

  // Dirección
  address: z.string().optional(),
  addressBanchi: z.string().optional(),
  addressBuilding: z.string().optional(),

  // Visa
  visaType: z.string().optional(),
  residenceCardNo: z.string().optional(),

  // Licencia
  licenseNo: z.string().optional(),

  // Contacto de emergencia
  emergencyName: z.string().optional(),
  emergencyRelation: z.string().optional(),
  emergencyPhone: z.string().optional(),
})

export type CandidateFormData = z.infer<typeof candidateSchema>
