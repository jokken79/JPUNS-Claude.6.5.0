"use client";
import React, { useMemo, useRef, useState, useEffect } from "react";
import { toast } from "react-hot-toast";
import dynamic from "next/dynamic";
import {
  CheckCircleIcon,
  DocumentMagnifyingGlassIcon,
  InformationCircleIcon,
} from "@heroicons/react/24/outline";

// Lazy load heavy components for better initial page load performance
const AzureOCRUploader = dynamic(() => import("@/components/AzureOCRUploader"), {
  loading: () => (
    <div className="flex items-center justify-center p-8 bg-blue-50 rounded-lg border-2 border-dashed border-blue-300">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      <span className="ml-3 text-blue-700">Cargando módulo OCR...</span>
    </div>
  ),
  ssr: false, // OCR uses browser APIs
});

const RirekishoPrintView = dynamic(() => import("@/components/RirekishoPrintView"), {
  loading: () => (
    <div className="flex items-center justify-center p-8 bg-green-50 rounded-lg border-2 border-dashed border-green-300">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600"></div>
      <span className="ml-3 text-green-700">Preparando vista de impresión...</span>
    </div>
  ),
  ssr: false, // Print view is client-side only
});

/**
 * 履歴書（A4縦）— 単一ファイル TSX コンポーネント
 * - 画面：入力フォーム（日本語ラベル）＋ツールバー（印刷／保存）
 * - 印刷：入力枠をそのまま表示（公式様式風の枠線を保持）
 * - 注意：在留カード・免許証などの「書類画像」は印刷しません（本フォームは履歴書のみ）
 *
 * 配置想定：/app/(dashboard)/candidates/rirekisho/page.tsx
 */

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? "/api";

export default function Page() {
  // --- State Management ---
  const [data, setData] = useState<FormDataState>(() => ({
    applicantId: `UNS-${Date.now().toString().slice(-6)}`,
    receptionDate: "",
    timeInJapan: "",
    nameKanji: "",
    nameFurigana: "",
    birthday: "",
    age: "",
    gender: "",
    nationality: "",
    postalCode: "",
    address: "",
    addressBanchi: "",
    addressBuilding: "",
    mobile: "",
    phone: "",
    emergencyName: "",
    emergencyRelation: "",
    emergencyPhone: "",
    visaType: "",
    visaPeriod: "",
    residenceCardNo: "",
    passportNo: "",
    passportExpiry: "",
    licenseNo: "",
    licenseExpiry: "",
    carOwner: "",
    insurance: "",
    speakLevel: "",
    listenLevel: "",
    kanjiReadLevel: "",
    kanjiWriteLevel: "",
    hiraganaReadLevel: "",
    hiraganaWriteLevel: "",
    katakanaReadLevel: "",
    katakanaWriteLevel: "",
    education: "",
    major: "",
    height: "",
    weight: "",
    uniformSize: "",
    waist: "",
    shoeSize: "",
    bloodType: "",
    visionRight: "",
    visionLeft: "",
    glasses: "",
    dominantArm: "",
    allergy: "",
    safetyShoes: "",
    vaccine: "",
    forkliftLicense: false,
    jlpt: false,
    jlptLevel: "",
    otherQualifications: "",
    lunchPref: "昼/夜",
    commuteTimeMin: "",
    commuteMethod: "",
    jobs: [],
    family: [],
  }));

  const [isEditMode, setIsEditMode] = useState(false);
  const [editingCandidateId, setEditingCandidateId] = useState<string | null>(null);

  const [editingRelationIndex, setEditingRelationIndex] = useState<number | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const photoDataUrl = useRef<string>("");
  const [photoPreview, setPhotoPreview] = useState<string>("");
  const [showAzurePanel, setShowAzurePanel] = useState(false);
  const [azureAppliedFields, setAzureAppliedFields] = useState<{ label: string; value: string }[]>([]);
  const [lastAzureDocumentType, setLastAzureDocumentType] = useState<string | null>(null);
  const [lastAzureRaw, setLastAzureRaw] = useState<Record<string, unknown> | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isPrinting, setIsPrinting] = useState(false);
  const [showPrintPreview, setShowPrintPreview] = useState(false);

  // --- Load candidate data if in edit mode ---
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const urlParams = new URLSearchParams(window.location.search);
    const mode = urlParams.get('mode');
    const candidateId = urlParams.get('id');

    if (mode === 'edit' && candidateId) {
      setIsEditMode(true);
      setEditingCandidateId(candidateId);

      // Try to get data from sessionStorage first
      let storedData = sessionStorage.getItem('editingCandidateData');
      
      // If not in sessionStorage, try to fetch from API
      if (!storedData) {
        console.log('🔄 [RIREKISHO] Datos no encontrados en sessionStorage, intentando fetch desde API...');
        loadCandidateFromAPI(candidateId);
        return;
      }

      console.log('� [RIREKISHO] Modo edit detectado. ID:', candidateId);
      console.log('🔍 [RIREKISHO] Datos en sessionStorage:', storedData ? 'ENCONTRADOS' : 'NO ENCONTRADOS');

      try {
        const candidate = JSON.parse(storedData);
        console.log('✅ [RIREKISHO] Datos parseados correctamente:', candidate);

        // Load candidate data into form
        loadCandidateData(candidate);

        // Store in localStorage as backup for navigation
        localStorage.setItem('editingCandidateDataBackup', storedData);
        localStorage.setItem('editingCandidateIdBackup', candidateId);

      } catch (error) {
        console.error('Failed to load candidate data from sessionStorage:', error);
        // Try to load from API as fallback
        loadCandidateFromAPI(candidateId);
      }
    }
  }, []);

  // Function to load candidate data from API
  const loadCandidateFromAPI = async (candidateId: string) => {
    try {
      console.log('🔄 [RIREKISHO] Cargando datos desde API para candidato:', candidateId);
      const token = localStorage.getItem("token");
      if (!token) {
        toast.error("認証トークンが見つかりません。ログインし直してください。");
        return;
      }

      const response = await fetch(`${API_BASE_URL}/candidates/${candidateId}`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error('候補者データの取得に失敗しました');
      }

      const candidate = await response.json();
      console.log('✅ [RIREKISHO] Datos cargados desde API:', candidate);

      // Load candidate data into form
      loadCandidateData(candidate);

      // Store in sessionStorage and localStorage as backup
      const candidateDataString = JSON.stringify(candidate);
      sessionStorage.setItem('editingCandidateData', candidateDataString);
      localStorage.setItem('editingCandidateDataBackup', candidateDataString);
      localStorage.setItem('editingCandidateIdBackup', candidateId);

    } catch (error) {
      console.error('Failed to load candidate data from API:', error);
      toast.error('候補者データの読み込みに失敗しました');
    }
  };

  // Function to load candidate data into form
  const loadCandidateData = (candidate: any) => {
    // Map candidate data to form fields
    const formData: Partial<FormDataState> = {
      applicantId: candidate.rirekisho_id || `UNS-${candidate.id}`,
      receptionDate: candidate.reception_date || "",
      nameKanji: candidate.full_name_kanji || "",
      nameFurigana: candidate.full_name_kana || "",
      birthday: candidate.date_of_birth || "",
      age: candidate.age?.toString() || "",
      gender: candidate.gender || "",
      nationality: candidate.nationality || "",
      postalCode: candidate.postal_code || "",
      address: candidate.current_address || candidate.address || "",
      addressBanchi: candidate.address_banchi || "",
      addressBuilding: candidate.address_building || "",
      mobile: candidate.mobile || "",
      phone: candidate.phone || "",
      emergencyName: candidate.emergency_contact_name || "",
      emergencyRelation: candidate.emergency_contact_relation || "",
      emergencyPhone: candidate.emergency_contact_phone || "",
      visaType: candidate.residence_status || "",
      visaPeriod: candidate.residence_expiry || "",
      residenceCardNo: candidate.residence_card_number || "",
      passportNo: candidate.passport_number || "",
      passportExpiry: candidate.passport_expiry || "",
      licenseNo: candidate.license_number || "",
      licenseExpiry: candidate.license_expiry || "",
      carOwner: candidate.car_ownership || "",
      insurance: candidate.voluntary_insurance || "",
      speakLevel: candidate.speaking_level || "",
      listenLevel: candidate.listening_level || "",
      kanjiReadLevel: candidate.read_kanji || "",
      kanjiWriteLevel: candidate.write_kanji || "",
      hiraganaReadLevel: candidate.read_hiragana || "",
      hiraganaWriteLevel: candidate.write_hiragana || "",
      katakanaReadLevel: candidate.read_katakana || "",
      katakanaWriteLevel: candidate.write_katakana || "",
      education: candidate.education || "",
      major: candidate.major || "",
      bloodType: candidate.blood_type || "",
      glasses: candidate.glasses || "",
      dominantArm: candidate.dominant_hand || "",
      allergy: candidate.allergy_exists || "",
      vaccine: candidate.covid_vaccine_status || "",
      forkliftLicense: candidate.forklift_license === "有" || false,
      jlpt: !!candidate.jlpt_level,
      jlptLevel: candidate.jlpt_level || "",
      commuteMethod: candidate.commute_method || "",
      commuteTimeMin: candidate.commute_time_oneway?.toString() || "",
      lunchPref: (candidate.lunch_preference || "昼/夜") as FormDataState["lunchPref"],
    };

    // Load family data
    const family: FamilyEntry[] = [];
    for (let i = 1; i <= 5; i++) {
      const name = candidate[`family_name_${i}`];
      const relation = candidate[`family_relation_${i}`];
      const age = candidate[`family_age_${i}`];
      const residence = candidate[`family_residence_${i}`];

      if (name || relation || age || residence) {
        family.push({
          name: name || "",
          relation: relation || "",
          age: age?.toString() || "",
          residence: residence || "",
          dependent: "",
        });
      }
    }
    if (family.length > 0) {
      formData.family = family;
    }

    console.log('📋 [RIREKISHO] Datos mapeados para el formulario:', formData);

    setData(prev => ({ ...prev, ...formData }));

    // Load photo if available
    if (candidate.photo_data_url) {
      photoDataUrl.current = candidate.photo_data_url;
      setPhotoPreview(candidate.photo_data_url);
      console.log('📷 [RIREKISHO] Foto cargada exitosamente');
    } else {
      console.log('⚠️ [RIREKISHO] No hay foto disponible para este candidato');
    }

    toast.success(`候補者 ${candidate.full_name_kanji || candidate.id} のデータを読み込みました`);
  };

  // Add effect to handle browser back/forward navigation
  useEffect(() => {
    const handlePopState = () => {
      const urlParams = new URLSearchParams(window.location.search);
      const mode = urlParams.get('mode');
      const candidateId = urlParams.get('id');

      if (mode === 'edit' && candidateId && isEditMode) {
        console.log('🔄 [RIREKISHO] Navegación detectada, recargando datos...');
        
        // Try to restore from localStorage backup first
        const backupData = localStorage.getItem('editingCandidateDataBackup');
        const backupId = localStorage.getItem('editingCandidateIdBackup');
        
        if (backupData && backupId === candidateId) {
          try {
            const candidate = JSON.parse(backupData);
            loadCandidateData(candidate);
            sessionStorage.setItem('editingCandidateData', backupData);
          } catch (error) {
            console.error('Failed to restore from backup:', error);
            loadCandidateFromAPI(candidateId);
          }
        } else {
          loadCandidateFromAPI(candidateId);
        }
      }
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, [isEditMode]);

  // --- Core Functions ---
  function onChange<K extends keyof FormDataState>(key: K, value: FormDataState[K]) {
    setData((prev) => ({ ...prev, [key]: value }));
  }

  // --- Handlers for formatting Height, Weight, Waist, CommuteTime on Blur ---
  const handleBlurHeight = () => {
    const heightValue = (data.height || "").toString().replace(/[^0-9.]/g, '');
    if (heightValue && !isNaN(parseFloat(heightValue))) {
      setData(prev => ({ ...prev, height: `${heightValue} cm` }));
    } else if (data.height !== "") {
      setData(prev => ({ ...prev, height: "" }));
    }
  };

  const handleBlurWeight = () => {
    const weightValue = (data.weight || "").toString().replace(/[^0-9.]/g, '');
    if (weightValue && !isNaN(parseFloat(weightValue))) {
      setData(prev => ({ ...prev, weight: `${weightValue} kg` }));
    } else if (data.weight !== "") {
      setData(prev => ({ ...prev, weight: "" }));
    }
  };

  const handleBlurWaist = () => {
    const waistValue = (data.waist || "").toString().replace(/[^0-9.]/g, '');
    if (waistValue && !isNaN(parseFloat(waistValue))) {
      setData(prev => ({ ...prev, waist: `${waistValue} cm` }));
    } else if (data.waist !== "") {
      setData(prev => ({ ...prev, waist: "" }));
    }
  };

  const handleBlurCommuteTime = () => {
    const timeValue = (data.commuteTimeMin || "").toString().replace(/[^0-9]/g, '');
    if (timeValue && !isNaN(parseInt(timeValue, 10))) {
      setData(prev => ({ ...prev, commuteTimeMin: `${timeValue} 分` }));
    } else if (data.commuteTimeMin !== "") {
      setData(prev => ({ ...prev, commuteTimeMin: "" }));
    }
  };

  function addJob() {
    setData((prev) => ({
      ...prev,
      jobs: [
        ...prev.jobs,
        { start: "", end: "", hakenmoto: "", hakensaki: "", content: "", reason: "" },
      ],
    }));
  }

  function removeJob(idx: number) {
    setData((prev) => ({ ...prev, jobs: prev.jobs.filter((_, i) => i !== idx) }));
  }

  function updateJob(idx: number, patch: Partial<JobEntry>) {
    setData((prev) => ({
      ...prev,
      jobs: prev.jobs.map((row, i) => (i === idx ? { ...row, ...patch } : row)),
    }));
  }

  function addFamily() {
    setData((prev) => ({
      ...prev,
      family: [
        ...prev.family,
        { name: "", relation: "", age: "", residence: "", dependent: "" },
      ],
    }));
  }

  function removeFamily(idx: number) {
    setData((prev) => ({ ...prev, family: prev.family.filter((_, i) => i !== idx) }));
  }

  function updateFamily(idx: number, patch: Partial<FamilyEntry>) {
    setData((prev) => ({
      ...prev,
      family: prev.family.map((row, i) => (i === idx ? { ...row, ...patch } : row)),
    }));
  }

  function onSelectPhoto(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    if (!f) return;
    const reader = new FileReader();
    reader.onload = () => {
      const url = String(reader.result || "");
      photoDataUrl.current = url;
      setPhotoPreview(url);
    };
    reader.readAsDataURL(f);
  }

  // Mejorada función handlePrint
  function handlePrint() {
    console.log("Attempting to print...");
    setIsPrinting(true);
    
    // Mostrar vista previa de impresión
    setShowPrintPreview(true);
    
    // Esperar un poco para que se renderice la vista previa y luego imprimir
    setTimeout(() => {
      window.print();
    }, 500);
  }

  function handlePrintFromPreview() {
    window.print();
  }

  function handleClosePrintPreview() {
    setShowPrintPreview(false);
    setIsPrinting(false);
  }

  async function handleSaveToDatabase() {
    if (isSaving) return;

    try {
      setIsSaving(true);
      const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
      if (!token) {
        toast.error("認証トークンが見つかりません。ログインし直してください。");
        return;
      }

      const payloadFormData = {
        ...data,
        photoDataUrl: photoDataUrl.current || null,
        azureDocumentType: lastAzureDocumentType,
        azureAppliedFields,
        azureRaw: lastAzureRaw,
      };

      // If in edit mode, update the existing candidate
      if (isEditMode && editingCandidateId) {
        const response = await fetch(`${API_BASE_URL}/candidates/${editingCandidateId}`, {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            rirekisho_id: data.applicantId,
            full_name_kanji: data.nameKanji,
            full_name_kana: data.nameFurigana,
            date_of_birth: data.birthday || null,
            age: data.age ? parseInt(data.age) : null,
            gender: data.gender,
            nationality: data.nationality,
            postal_code: data.postalCode,
            current_address: data.address,
            address_banchi: data.addressBanchi,
            address_building: data.addressBuilding,
            mobile: data.mobile,
            phone: data.phone,
            emergency_contact_name: data.emergencyName,
            emergency_contact_relation: data.emergencyRelation,
            emergency_contact_phone: data.emergencyPhone,
            residence_status: data.visaType,
            residence_expiry: data.visaPeriod || null,
            residence_card_number: data.residenceCardNo,
            passport_number: data.passportNo,
            passport_expiry: data.passportExpiry || null,
            license_number: data.licenseNo,
            license_expiry: data.licenseExpiry || null,
            car_ownership: data.carOwner,
            voluntary_insurance: data.insurance,
            blood_type: data.bloodType,
            glasses: data.glasses,
            dominant_hand: data.dominantArm,
            allergy_exists: data.allergy,
            covid_vaccine_status: data.vaccine,
            forklift_license: data.forkliftLicense ? "有" : "無",
            jlpt_level: data.jlptLevel,
            commute_method: data.commuteMethod,
            commute_time_oneway: data.commuteTimeMin ? parseInt(data.commuteTimeMin.replace(/[^0-9]/g, '')) : null,
            lunch_preference: data.lunchPref,
            major: data.major,
            photo_data_url: photoDataUrl.current || null,
          }),
        });

        if (!response.ok) {
          const errorPayload = await response.json().catch(() => ({}));
          const message = typeof errorPayload.detail === "string" ? errorPayload.detail : "候補者の更新に失敗しました。";
          throw new Error(message);
        }

        toast.success(`候補者 ${data.nameKanji || editingCandidateId} を更新しました`);
      } else {
        // Create new candidate
        const response = await fetch(`${API_BASE_URL}/candidates/rirekisho/form`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            applicantId: data.applicantId,
            rirekishoId: data.applicantId,
            formData: payloadFormData,
            photoDataUrl: photoDataUrl.current || null,
            azureMetadata: lastAzureRaw,
          }),
        });

        if (!response.ok) {
          const errorPayload = await response.json().catch(() => ({}));
          const message = typeof errorPayload.detail === "string" ? errorPayload.detail : "データベースへの保存に失敗しました。";
          throw new Error(message);
        }

        const savedForm = (await response.json()) as {
          rirekisho_id?: string;
          applicant_id?: string;
        };

        const resolvedId = savedForm?.rirekisho_id || savedForm?.applicant_id;
        if (resolvedId) {
          setData((prev) => ({ ...prev, applicantId: resolvedId }));
        }

        toast.success(resolvedId ? `履歴書を保存しました (ID: ${resolvedId})` : "履歴書をデータベースに保存しました。");
      }
    } catch (error) {
      console.error(error);
      toast.error(error instanceof Error ? error.message : "保存処理で予期せぬエラーが発生しました。");
    } finally {
      setIsSaving(false);
    }
  }

  const normalizeJapaneseDate = (value: string) => {
    if (!value) return "";
    const trimmed = value.trim();
    if (!trimmed) return "";

    const withoutSuffix = trimmed.replace(/まで$/u, "").trim();
    const jpMatch = withoutSuffix.match(/^(\d{4})年(\d{1,2})月(\d{1,2})日?$/u);
    if (jpMatch) {
      const [, year, month, day] = jpMatch;
      return `${year}-${month.padStart(2, "0")}-${day.padStart(2, "0")}`;
    }

    const normalized = withoutSuffix.replace(/[\.\/]/g, "-");
    const isoMatch = normalized.match(/^(\d{4})-(\d{1,2})-(\d{1,2})$/);
    if (isoMatch) {
      const [, year, month, day] = isoMatch;
      return `${year}-${month.padStart(2, "0")}-${day.padStart(2, "0")}`;
    }

    return trimmed;
  };

  const normalizeVisaPeriod = (value: string) => {
    const normalized = normalizeJapaneseDate(value);
    return normalized || value.trim();
  };

  const normalizePhoneNumber = (value: string) => {
    if (!value) return "";
    const digits = value.replace(/[^0-9+]/g, "");
    if (!digits) return "";

    if (digits.startsWith("+81")) {
      const rest = digits.slice(3);
      if (!rest) return "";
      return rest.startsWith("0") ? rest : `0${rest}`;
    }

    if (digits.startsWith("81") && digits.length >= 4) {
      return `0${digits.slice(2)}`;
    }

    return digits;
  };

  const formatPostalCode = (value: string) => {
    if (!value) return "";
    const digits = value.replace(/[^0-9]/g, "");
    if (digits.length === 7) {
      return `${digits.slice(0, 3)}-${digits.slice(3)}`;
    }
    return value.trim();
  };

  const normalizeGender = (value: string) => {
    if (!value) return "";
    const normalized = value.trim().toLowerCase();
    if (!normalized) return "";
    if (normalized.includes("male") || normalized.includes("男")) return "男性";
    if (normalized.includes("female") || normalized.includes("女")) return "女性";
    return value.trim();
  };

  const ensureDataUrl = (value: string) => {
    if (!value) return "";
    return value.startsWith("data:") ? value : `data:image/jpeg;base64,${value}`;
  };

  const handleAzureOcrComplete = (ocrRaw: Record<string, unknown>) => {
    if (!ocrRaw || typeof ocrRaw !== "object") {
      toast.error("Azure OCR の結果を読み取れませんでした。");
      return;
    }

    const updates: Partial<FormDataState> = {};
    const applied: { label: string; value: string }[] = [];

    const applyField = (
      targetKey: FormDataStringKey,
      label: string,
      ...sourceKeys: string[]
    ) => {
      const rawValue = sourceKeys
        .map((key) => ocrRaw[key])
        .find((value) => {
          if (value === undefined || value === null) {
            return false;
          }
          if (typeof value === "string") {
            return value.trim() !== "";
          }
          return true;
        });

      if (rawValue === undefined || rawValue === null) {
        return;
      }

      const rawString = typeof rawValue === "string" ? rawValue : String(rawValue);
      let value = rawString.trim();
      if (!value) return;

      if (targetKey === "postalCode") {
        value = formatPostalCode(value);
      }

      if (targetKey === "phone" || targetKey === "mobile" || targetKey === "emergencyPhone") {
        value = normalizePhoneNumber(value);
        if (!value) return;
      }

      if (targetKey === "birthday" || targetKey === "passportExpiry" || targetKey === "licenseExpiry") {
        value = normalizeJapaneseDate(value);
      }

      if (targetKey === "visaPeriod") {
        value = normalizeVisaPeriod(value);
      }

      if (targetKey === "gender") {
        value = normalizeGender(value);
      }

      if (targetKey === "nationality") {
        const upper = value.toUpperCase();
        if (upper === value) {
          value = `${upper.charAt(0)}${upper.slice(1).toLowerCase()}`;
        }
      }

      updates[targetKey] = value as FormDataState[typeof targetKey];
      applied.push({ label, value });
    };

    applyField("nameKanji", "氏名（漢字）", "full_name_kanji", "name_kanji", "name_roman");
    applyField("nameFurigana", "フリガナ", "full_name_kana", "name_kana", "name_katakana");
    applyField("birthday", "生年月日", "date_of_birth", "birthday");
    applyField("age", "年齢", "age");
    applyField("gender", "性別", "gender");
    applyField("nationality", "国籍", "nationality");
    applyField("postalCode", "郵便番号", "postal_code", "zip_code");
    applyField("address", "現住所", "current_address", "address", "registered_address");
    applyField("mobile", "携帯電話", "mobile", "mobile_phone", "cell_phone");
    applyField("phone", "電話番号", "phone", "phone_number");
    applyField("visaType", "在留資格", "residence_status", "visa_status");
    applyField("visaPeriod", "在留期間", "visa_period", "residence_expiry", "period_of_stay");
    applyField("residenceCardNo", "在留カード番号", "residence_card_number", "zairyu_card_number");
    applyField("passportNo", "パスポート番号", "passport_number");
    applyField("passportExpiry", "パスポート有効期限", "passport_expiry", "passport_expire_date");
    applyField("licenseNo", "免許証番号", "license_number", "menkyo_number");
    applyField("licenseExpiry", "免許証有効期限", "license_expiry", "license_expire_date");
    applyField("emergencyName", "緊急連絡先 氏名", "emergency_contact_name");
    applyField("emergencyRelation", "緊急連絡先 続柄", "emergency_contact_relation");
    applyField("emergencyPhone", "緊急連絡先 電話", "emergency_contact_phone");

    const photoCandidate = ["photo_url", "photo", "face_photo"]
      .map((key) => ocrRaw[key])
      .find((value): value is string => typeof value === "string" && value.trim() !== "");

    if (photoCandidate) {
      const safePhoto = ensureDataUrl(photoCandidate);
      photoDataUrl.current = safePhoto;
      setPhotoPreview(safePhoto);
      applied.push({ label: "証明写真", value: "Azure OCR から自動抽出" });
    }

    if (Object.keys(updates).length > 0) {
      setData((prev) => ({ ...prev, ...updates }));
    }

    if (applied.length > 0) {
      toast.success("Azure OCR の結果をフォームへ反映しました。");
    } else {
      toast("Azure OCR から読み取れる項目がありませんでした。", { icon: "ℹ️" });
    }

    setAzureAppliedFields(applied);
    setLastAzureDocumentType(typeof ocrRaw.document_type === "string" ? ocrRaw.document_type : null);
    setLastAzureRaw(ocrRaw);
    setShowAzurePanel(true);
  };

  const levels = useMemo(
    () => ({
      speak: ["初級（挨拶程度）", "中級（日常会話・就職可）", "上級（通訳可）"],
      listen: ["初級（挨拶程度）", "中級（日常会話・就職可）", "上級（通訳可）"],
      simple: ["できる", "少し", "できない"],
      timeInJapan: [
        ...[...Array(11).keys()].map(i => `${i + 1}ヶ月`),
        ...[...Array(20).keys()].map(i => `${i + 1}年`),
        "20年以上",
      ],
      residenceOptions: ["同居", "別居", "国内", "国外"],
      commuteOptions: ["自家用車", "送迎", "原付電動機", "自転車", "歩き"],
      relationOptions: ["妻", "長男", "次男", "息子", "子", "長女", "次女", "娘", "母", "父", "その他"],
    }),
    []
  );

  useEffect(() => {
    const handleAfterPrint = () => {
      console.log("After print event triggered");
      setIsPrinting(false);
      setShowPrintPreview(false);
    };

    window.addEventListener('afterprint', handleAfterPrint);

    return () => {
      window.removeEventListener('afterprint', handleAfterPrint);
    };
  }, []);

  // Si se muestra la vista previa de impresión, renderizar solo el componente de impresión
  if (showPrintPreview) {
    return (
      <div className="print-preview-container">
        <div className="print-preview-toolbar">
          <button onClick={handlePrintFromPreview} className="print-btn">
            印刷する
          </button>
          <button onClick={handleClosePrintPreview} className="close-btn">
            閉じる
          </button>
        </div>
        <div className="print-preview-content">
          <RirekishoPrintView data={data} photoPreview={photoPreview} />
        </div>
        <style jsx>{`
          .print-preview-container {
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background-color: white;
            z-index: 9999;
            overflow: auto;
          }
          
          .print-preview-toolbar {
            position: sticky;
            top: 0;
            background-color: #f5f5f5;
            padding: 10px;
            display: flex;
            justify-content: center;
            gap: 15px;
            z-index: 10000;
            border-bottom: 1px solid #ddd;
          }
          
          .print-btn {
            background-color: #2563eb;
            color: white;
            border: none;
            padding: 8px 16px;
            border-radius: 4px;
            cursor: pointer;
            font-weight: bold;
          }
          
          .close-btn {
            background-color: #6b7280;
            color: white;
            border: none;
            padding: 8px 16px;
            border-radius: 4px;
            cursor: pointer;
          }
          
          @media print {
            .print-preview-toolbar {
              display: none !important;
            }
          }
        `}</style>
      </div>
    );
  }

  return (
    <div className={`print-form-container mx-auto max-w-[1200px] px-4 py-6 font-noto-sans-jp ${isPrinting ? 'printing' : ''}`}>
      {/* Toolbar */}
      <div className="sticky top-0 z-10 mb-6 rounded-xl border bg-card/80 p-3 shadow-md backdrop-blur print:hidden">
        {isEditMode && (
          <div className="mb-2 text-center">
            <span className="inline-block bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300 px-3 py-1 rounded-full text-sm font-semibold">
              編集モード - 候補者ID: {editingCandidateId}
            </span>
          </div>
        )}
        <div className="flex items-center justify-center gap-3">
        <button
          onClick={() => fileInputRef.current?.click()}
          className="rounded-lg border px-4 py-2 font-semibold hover:bg-accent"
          title="証明写真は印刷されます（書類画像は印刷しません）"
        >
          写真アップロード
        </button>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={onSelectPhoto}
        />
        <button onClick={handlePrint} className="rounded-lg bg-primary px-4 py-2 font-semibold text-primary-foreground hover:bg-primary/90">
          印刷する
        </button>
        <button
          onClick={() => setShowAzurePanel((prev) => !prev)}
          className={`flex items-center gap-2 rounded-lg border px-4 py-2 font-semibold transition ${
            showAzurePanel
              ? "border-sky-500 bg-sky-50 dark:bg-sky-900/30 text-sky-700 dark:text-sky-300 shadow-inner"
              : "hover:bg-accent"
          }`}
        >
          <DocumentMagnifyingGlassIcon className="h-5 w-5" />
          Azure OCR 連携
        </button>
        <button
          onClick={handleSaveToDatabase}
          disabled={isSaving}
          className={`rounded-lg border px-4 py-2 font-semibold transition ${
            isSaving ? "cursor-not-allowed bg-muted text-muted-foreground" : "hover:bg-accent"
          }`}
        >
          {isSaving ? "保存中..." : isEditMode ? "更新" : "データベース保存"}
        </button>
        {isEditMode && (
          <button
            onClick={() => window.location.href = '/candidates'}
            className="rounded-lg border border-input px-4 py-2 font-semibold transition hover:bg-accent"
          >
            キャンセル
          </button>
        )}
        </div>
      </div>

      {showAzurePanel && (
        <div className="mb-6 space-y-4 rounded-2xl border border-sky-100 bg-card/90 p-6 shadow-lg backdrop-blur print:hidden">
          <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
            <div className="flex items-center gap-3 text-foreground">
              <DocumentMagnifyingGlassIcon className="h-6 w-6 text-sky-600" />
              <div>
                <h2 className="text-lg font-semibold text-foreground">Azure OCR アシスタント</h2>
                <p className="text-sm text-muted-foreground">
                  在留カードや免許証の画像をアップロードして氏名・在留資格・顔写真を自動でフォームに転記します。
                </p>
              </div>
            </div>
            <button
              onClick={() => setShowAzurePanel(false)}
              className="text-sm font-medium text-muted-foreground transition hover:text-foreground"
            >
              パネルを閉じる
            </button>
          </div>

          <AzureOCRUploader onResult={handleAzureOcrComplete} />

          {azureAppliedFields.length > 0 ? (
            <div className="rounded-xl border border-emerald-200 bg-emerald-50/80 dark:bg-emerald-900/20 p-4">
              <div className="flex items-center gap-2 text-emerald-700 dark:text-emerald-300">
                <CheckCircleIcon className="h-5 w-5" />
                <span className="text-sm font-semibold">フォームに反映された項目</span>
                {lastAzureDocumentType && (
                  <span className="rounded-full bg-emerald-100 dark:bg-emerald-900/30 px-2 py-0.5 text-xs font-medium text-emerald-700 dark:text-emerald-300">
                    {lastAzureDocumentType === "zairyu_card"
                      ? "在留カード"
                      : lastAzureDocumentType === "license"
                      ? "運転免許証"
                      : "履歴書"}
                  </span>
                )}
              </div>
              <ul className="mt-3 grid gap-2 md:grid-cols-2">
                {azureAppliedFields.map((field, index) => (
                  <li
                    key={`${field.label}-${index}`}
                    className="rounded-lg bg-card/80 px-3 py-2 text-sm text-foreground shadow-sm"
                  >
                    <span className="block text-xs text-muted-foreground">{field.label}</span>
                    <span className="font-medium text-foreground">{field.value}</span>
                  </li>
                ))}
              </ul>
            </div>
          ) : lastAzureRaw ? (
            <div className="flex items-start gap-2 rounded-lg border border-amber-200 bg-amber-50 dark:bg-amber-900/20 p-3 text-sm text-amber-700 dark:text-amber-300">
              <InformationCircleIcon className="mt-0.5 h-5 w-5 flex-shrink-0" />
              <div>
                <p className="font-medium">Azure OCR から転記できるフィールドが見つかりませんでした。</p>
                <p className="text-xs text-amber-600 dark:text-amber-400">
                  画像の解像度や明るさを調整して再度お試しください。必要に応じて手入力で補完できます。
                </p>
              </div>
            </div>
          ) : null}

          {lastAzureRaw && (
            <details className="rounded-xl border border-border bg-muted p-4 text-xs text-muted-foreground">
              <summary className="cursor-pointer font-medium text-foreground">Azure OCR 詳細データを表示</summary>
              <pre className="mt-3 max-h-64 overflow-auto whitespace-pre-wrap break-all text-[11px]">
                {JSON.stringify(lastAzureRaw, null, 2)}
              </pre>
            </details>
          )}
        </div>
      )}

      {/* A4 Canvas - Changed to portrait */}
      <div
        className="print-a4-container relative mx-auto box-border flex flex-col bg-card p-6 shadow print:p-0 print:shadow-none"
        style={{ width: "210mm", minHeight: "297mm" }}
      >
        <h1 className="mb-4 text-center text-3xl font-extrabold tracking-widest print:hidden">履 歴 書</h1>

        {/* Basic Info & Contact - Layout corregido para impresión */}
        <div className="form-section mb-4 flex flex-row items-start gap-4 print:flex-row" style={{ pageBreakInside: "avoid" }}>
          <div className="flex-shrink-0 grid place-items-center" style={{ width: "40mm", height: "50mm" }}>
            <div className="grid place-items-center border border-black w-full h-full">
              {photoPreview ? (
                <img src={photoPreview} className="h-full w-full object-cover" alt="証明写真" />
              ) : (
                <span className="text-xs text-muted-foreground">写真</span>
              )}
            </div>
          </div>
          <table className="w-full table-fixed border-collapse border border-black text-[11pt]">
            <colgroup><col className="w-[10%]" /><col className="w-[15%]" /><col className="w-[10%]" /><col className="w-[15%]" /><col className="w-[10%]" /><col className="w-[15%]" /><col className="w-[10%]" /><col className="w-[15%]" /></colgroup>
            <tbody>
              <tr>
                <th className="border border-black bg-muted px-2 py-1 text-left">受付日</th>
                <td className="border border-black px-2 py-1" colSpan={3}>
                  <input
                    id="receptionDateInput" type="date" value={data.receptionDate}
                    onChange={(e) => onChange("receptionDate", e.target.value)}
                    className="w-full border-0 p-0 outline-none bg-transparent print:hidden"
                    data-print-target="receptionDatePrint" />
                  <span id="receptionDatePrint" className="hidden print:inline">{data.receptionDate}</span>
                </td>
                <th className="border border-black bg-muted px-2 py-1 text-left">来日</th>
                <td className="border border-black px-2 py-1" colSpan={3}>
                  <select value={data.timeInJapan} onChange={(e) => onChange("timeInJapan", e.target.value)} className="w-full border-0 p-0 outline-none bg-transparent">
                    <option value="">選択</option>
                    {levels.timeInJapan.map(item => <option key={item} value={item}>{item}</option>)}
                  </select>
                </td>
              </tr>
              <tr>
                <th className="border border-black bg-muted px-2 py-1 text-left">氏名</th>
                <td className="border border-black px-2 py-1" colSpan={3}>
                  <input value={data.nameKanji} onChange={(e) => onChange("nameKanji", e.target.value)} className="w-full border-0 p-0 outline-none" />
                </td>
                <th className="border border-black bg-muted px-2 py-1 text-left">フリガナ</th>
                <td className="border border-black px-2 py-1" colSpan={3}>
                  <input value={data.nameFurigana} onChange={(e) => onChange("nameFurigana", e.target.value)} className="w-full border-0 p-0 outline-none" />
                </td>
              </tr>
              <tr>
                <th className="border border-black bg-muted px-2 py-1 text-left">生年月日</th>
                <td className="border border-black px-2 py-1">
                  <input id="birthdayInput" type="date" value={data.birthday} onChange={(e) => onChange("birthday", e.target.value)} className="w-full border-0 p-0 outline-none bg-transparent print:hidden" data-print-target="birthdayPrint" />
                  <span id="birthdayPrint" className="hidden print:inline">{data.birthday}</span>
                </td>
                <th className="border border-black bg-muted px-2 py-1 text-left">年齢</th>
                <td className="border border-black px-2 py-1">
                  <input type="number" min={18} max={80} value={data.age} onChange={(e) => onChange("age", e.target.value)} className="w-full border-0 p-0 outline-none" />
                </td>
                <th className="border border-black bg-muted px-2 py-1 text-left">性別</th>
                <td className="border border-black px-2 py-1">
                  <select value={data.gender} onChange={(e) => onChange("gender", e.target.value)} className="w-full border-0 p-0 outline-none bg-transparent">
                    <option value="">選択</option>
                    <option value="男性">男性</option>
                    <option value="女性">女性</option>
                  </select>
                </td>
                <th className="border border-black bg-muted px-2 py-1 text-left">国籍</th>
                <td className="border border-black px-2 py-1">
                  <input value={data.nationality} onChange={(e) => onChange("nationality", e.target.value)} className="w-full border-0 p-0 outline-none" />
                </td>
              </tr>
              <tr>
                <th className="border border-black bg-muted px-2 py-1 text-left">郵便番号</th>
                <td className="border border-black px-2 py-1">
                  <input value={data.postalCode} onChange={(e) => onChange("postalCode", e.target.value)} placeholder="000-0000" className="w-full border-0 p-0 outline-none" />
                </td>
                <th className="border border-black bg-muted px-2 py-1 text-left">携帯電話</th>
                <td className="border border-black px-2 py-1">
                  <input value={data.mobile} onChange={(e) => onChange("mobile", e.target.value)} className="w-full border-0 p-0 outline-none" />
                </td>
                <th className="border border-black bg-muted px-2 py-1 text-left">電話番号</th>
                <td className="border border-black px-2 py-1" colSpan={3}>
                  <input value={data.phone} onChange={(e) => onChange("phone", e.target.value)} className="w-full border-0 p-0 outline-none" />
                </td>
              </tr>
              <tr>
                <th className="border border-black bg-muted px-2 py-1 text-left">現住所</th>
                <td className="border border-black px-2 py-1" colSpan={7}>
                  <input value={data.address} onChange={(e) => onChange("address", e.target.value)} placeholder="愛知県名古屋市..." className="w-full border-0 p-0 outline-none" />
                </td>
              </tr>
              <tr>
                <th className="border border-black bg-muted px-2 py-1 text-left">番地</th>
                <td className="border border-black px-2 py-1" colSpan={7}>
                  <input value={data.addressBanchi} onChange={(e) => onChange("addressBanchi", e.target.value)} placeholder="1-2-3" className="w-full border-0 p-0 outline-none" />
                </td>
              </tr>
              <tr>
                <th className="border border-black bg-muted px-2 py-1 text-left">物件名</th>
                <td className="border border-black px-2 py-1" colSpan={7}>
                  <input value={data.addressBuilding} onChange={(e) => onChange("addressBuilding", e.target.value)} placeholder="マンション名・号室" className="w-full border-0 p-0 outline-none" />
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* Emergency Contact */}
        <div className="form-section mb-3">
          <div className="mb-1 font-semibold">緊急連絡先</div>
          <table className="w-full table-fixed border-collapse border border-black text-[11pt]">
            <colgroup><col className="w-[10%]" /><col className="w-[calc(100%/6*0.9)]" /><col className="w-[10%]" /><col className="w-[calc(100%/6*0.9)]" /><col className="w-[10%]" /><col className="w-[calc(100%/6*0.9)]" /></colgroup>
            <tbody>
              <tr>
                <th className="border border-black bg-muted px-2 py-1 text-left">氏名</th>
                <td className="border border-black px-2 py-1">
                  <input
                    value={data.emergencyName}
                    onChange={(e) => onChange("emergencyName", e.target.value)}
                    className="w-full border-0 p-0 outline-none"
                  />
                </td>
                <th className="border border-black bg-muted px-2 py-1 text-left">続柄</th>
                <td className="border border-black px-2 py-1">
                  <input
                    value={data.emergencyRelation}
                    onChange={(e) => onChange("emergencyRelation", e.target.value)}
                    className="w-full border-0 p-0 outline-none"
                  />
                </td>
                <th className="border border-black bg-muted px-2 py-1 text-left">電話番号</th>
                <td className="border border-black px-2 py-1">
                  <input
                    value={data.emergencyPhone}
                    onChange={(e) => onChange("emergencyPhone", e.target.value)}
                    className="w-full border-0 p-0 outline-none"
                  />
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* Documents */}
        <div className="form-section mb-3">
          <div className="mb-1 font-semibold">書類関係</div>
          <table className="w-full table-fixed border-collapse border border-black text-[11pt]">
            <tbody>
              <tr>
                <th className="w-[16%] border border-black bg-muted px-2 py-1 text-left">在留種類</th>
                <td className="w-[18%] border border-black px-2 py-1">
                  <input
                    value={data.visaType}
                    onChange={(e) => onChange("visaType", e.target.value)}
                    className="w-full border-0 p-0 outline-none"
                  />
                </td>
                <th className="w-[16%] border border-black bg-muted px-2 py-1 text-left">在留期間</th>
                <td className="w-[18%] border border-black px-2 py-1">
                  <input
                    value={data.visaPeriod}
                    onChange={(e) => onChange("visaPeriod", e.target.value)}
                    className="w-full border-0 p-0 outline-none"
                  />
                </td>
                <th className="w-[16%] border border-black bg-muted px-2 py-1 text-left">在留カード番号</th>
                <td className="w-[16%] border border-black px-2 py-1">
                  <input
                    value={data.residenceCardNo}
                    onChange={(e) => onChange("residenceCardNo", e.target.value)}
                    className="w-full border-0 p-0 outline-none"
                  />
                </td>
              </tr>
              <tr>
                <th className="border border-black bg-muted px-2 py-1 text-left">パスポート番号</th>
                <td className="border border-black px-2 py-1">
                  <input
                    value={data.passportNo}
                    onChange={(e) => onChange("passportNo", e.target.value)}
                    className="w-full border-0 p-0 outline-none"
                  />
                </td>
                <th className="border border-black bg-muted px-2 py-1 text-left">パスポート期限</th>
                <td className="border border-black px-2 py-1">
                  <input
                    id="passportExpiryInput"
                    type="date"
                    value={data.passportExpiry}
                    onChange={(e) => onChange("passportExpiry", e.target.value)}
                    className="w-full border-0 p-0 outline-none bg-transparent print:hidden"
                    data-print-target="passportExpiryPrint"
                  />
                  <span id="passportExpiryPrint" className="hidden print:inline">{data.passportExpiry}</span>
                </td>
                <th className="border border-black bg-muted px-2 py-1 text-left">運転免許番号</th>
                <td className="border border-black px-2 py-1">
                  <input
                    value={data.licenseNo}
                    onChange={(e) => onChange("licenseNo", e.target.value)}
                    className="w-full border-0 p-0 outline-none"
                  />
                </td>
              </tr>
              <tr>
                <th className="border border-black bg-muted px-2 py-1 text-left">運転免許期限</th>
                <td className="border border-black px-2 py-1">
                  <input
                    id="licenseExpiryInput"
                    type="date"
                    value={data.licenseExpiry}
                    onChange={(e) => onChange("licenseExpiry", e.target.value)}
                    className="w-full border-0 p-0 outline-none bg-transparent print:hidden"
                    data-print-target="licenseExpiryPrint"
                  />
                  <span id="licenseExpiryPrint" className="hidden print:inline">{data.licenseExpiry}</span>
                </td>
                <th className="border border-black bg-muted px-2 py-1 text-left">自動車所有</th>
                <td className="border border-black px-2 py-1">
                  <select
                    value={data.carOwner}
                    onChange={(e) => onChange("carOwner", e.target.value)}
                    className="w-full border-0 p-0 outline-none"
                  >
                    <option value="">選択</option>
                    <option value="有">有</option>
                    <option value="無">無</option>
                  </select>
                </td>
                <th className="border border-black bg-muted px-2 py-1 text-left">任意保険加入</th>
                <td className="border border-black px-2 py-1">
                  <select
                    value={data.insurance}
                    onChange={(e) => onChange("insurance", e.target.value)}
                    className="w-full border-0 p-0 outline-none"
                  >
                    <option value="">選択</option>
                    <option value="有">有</option>
                    <option value="無">無</option>
                  </select>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* Language & Education */}
        <div className="form-section mb-3">
          <div className="mb-1 font-semibold">日本語能力・学歴</div>
          <table className="mb-2 w-full table-fixed border-collapse border border-black text-[11pt]">
            <tbody>
              <tr>
                <th className="w-[20%] border border-black bg-muted px-2 py-1 text-left">話す</th>
                <td className="w-[30%] border border-black px-2 py-1">
                  <select
                    value={data.speakLevel}
                    onChange={(e) => onChange("speakLevel", e.target.value)}
                    className="w-full border-0 p-0 outline-none"
                  >
                    <option value="">選択</option>
                    {levels.speak.map((lv) => (
                      <option key={lv} value={lv}>{lv}</option>
                    ))}
                  </select>
                </td>
                <th className="w-[20%] border border-black bg-muted px-2 py-1 text-left">聞く</th>
                <td className="w-[30%] border border-black px-2 py-1">
                  <select
                    value={data.listenLevel}
                    onChange={(e) => onChange("listenLevel", e.target.value)}
                    className="w-full border-0 p-0 outline-none"
                  >
                    <option value="">選択</option>
                    {levels.listen.map((lv) => (
                      <option key={lv} value={lv}>{lv}</option>
                    ))}
                  </select>
                </td>
              </tr>
              <tr>
                <th className="border border-black bg-muted px-2 py-1 text-left align-middle">読み書き</th>
                <td className="border border-black px-2 py-1" colSpan={3}>
                  <div className="grid grid-cols-2 gap-x-6 gap-y-2">
                    <div className="flex items-center gap-1">
                      <label className="shrink-0 w-28">漢字(読み):</label>
                      <select value={data.kanjiReadLevel} onChange={(e) => onChange("kanjiReadLevel", e.target.value)} className="w-full border-0 p-0 outline-none bg-transparent">
                        <option value="">選択</option>
                        {levels.simple.map((lv) => (<option key={lv} value={lv}>{lv}</option>))}
                      </select>
                    </div>
                    <div className="flex items-center gap-1">
                      <label className="shrink-0 w-28">漢字(書き):</label>
                      <select value={data.kanjiWriteLevel} onChange={(e) => onChange("kanjiWriteLevel", e.target.value)} className="w-full border-0 p-0 outline-none bg-transparent">
                        <option value="">選択</option>
                        {levels.simple.map((lv) => (<option key={lv} value={lv}>{lv}</option>))}
                      </select>
                    </div>
                    <div className="flex items-center gap-1">
                      <label className="shrink-0 w-28">ひらがな(読み):</label>
                      <select value={data.hiraganaReadLevel} onChange={(e) => onChange("hiraganaReadLevel", e.target.value)} className="w-full border-0 p-0 outline-none bg-transparent">
                        <option value="">選択</option>
                        {levels.simple.map((lv) => (<option key={lv} value={lv}>{lv}</option>))}
                      </select>
                    </div>
                    <div className="flex items-center gap-1">
                      <label className="shrink-0 w-28">ひらがな(書き):</label>
                      <select value={data.hiraganaWriteLevel} onChange={(e) => onChange("hiraganaWriteLevel", e.target.value)} className="w-full border-0 p-0 outline-none bg-transparent">
                        <option value="">選択</option>
                        {levels.simple.map((lv) => (<option key={lv} value={lv}>{lv}</option>))}
                      </select>
                    </div>
                    <div className="flex items-center gap-1">
                      <label className="shrink-0 w-28">カタカナ(読み):</label>
                      <select value={data.katakanaReadLevel} onChange={(e) => onChange("katakanaReadLevel", e.target.value)} className="w-full border-0 p-0 outline-none bg-transparent">
                        <option value="">選択</option>
                        {levels.simple.map((lv) => (<option key={lv} value={lv}>{lv}</option>))}
                      </select>
                    </div>
                    <div className="flex items-center gap-1">
                      <label className="shrink-0 w-28">カタカナ(書き):</label>
                      <select value={data.katakanaWriteLevel} onChange={(e) => onChange("katakanaWriteLevel", e.target.value)} className="w-full border-0 p-0 outline-none bg-transparent">
                        <option value="">選択</option>
                        {levels.simple.map((lv) => (<option key={lv} value={lv}>{lv}</option>))}
                      </select>
                    </div>
                  </div>
                </td>
              </tr>
              <tr>
                <th className="border border-black bg-muted px-2 py-1 text-left">最終学歴</th>
                <td className="border border-black px-2 py-1">
                  <input
                    value={data.education}
                    onChange={(e) => onChange("education", e.target.value)}
                    className="w-full border-0 p-0 outline-none"
                  />
                </td>
                <th className="border border-black bg-muted px-2 py-1 text-left">専攻</th>
                <td className="border border-black px-2 py-1">
                  <input
                    value={data.major}
                    onChange={(e) => onChange("major", e.target.value)}
                    className="w-full border-0 p-0 outline-none"
                  />
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* Qualifications */}
        <div className="form-section mb-3">
          <div className="mb-1 font-semibold">有資格取得</div>
          <div className="flex items-center gap-x-6 gap-y-2 border border-black p-2 text-[11pt] flex-wrap">
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={data.forkliftLicense}
                onChange={(e) => onChange("forkliftLicense", e.target.checked)}
                className="h-4 w-4"
              />
              <span>フォークリフト資格</span>
            </label>
            <div className="flex items-center gap-2">
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={data.jlpt}
                  onChange={(e) => onChange("jlpt", e.target.checked)}
                  className="h-4 w-4"
                />
                <span>日本語検定</span>
              </label>
              {data.jlpt && (
                <select
                  value={data.jlptLevel}
                  onChange={(e) => onChange("jlptLevel", e.target.value)}
                  className="border-input rounded-md shadow-sm outline-none p-0.5"
                >
                  <option value="">レベル選択</option>
                  <option value="N1">N1</option>
                  <option value="N2">N2</option>
                  <option value="N3">N3</option>
                  <option value="N4">N4</option>
                  <option value="N5">N5</option>
                </select>
              )}
            </div>
            <div className="flex items-center gap-2">
              <span>その他:</span>
              <input
                type="text"
                value={data.otherQualifications}
                onChange={(e) => onChange('otherQualifications', e.target.value)}
                className="border-input rounded-md shadow-sm outline-none p-1"
                placeholder="その他の資格を入力"
              />
            </div>
          </div>
        </div>

        {/* Physical Info */}
        <div className="form-section mb-3">
          <div className="mb-1 font-semibold">身体情報・健康状態</div>
          <table className="w-full table-fixed border-collapse border border-black text-[11pt]">
            <tbody>
              <tr>
                <th className="w-[16%] border border-black bg-muted px-2 py-1 text-left">身長(cm)</th>
                <td className="w-[12%] border border-black px-2 py-1">
                  <input
                    type="text"
                    value={data.height}
                    onChange={(e) => onChange("height", e.target.value.replace(/[^0-9.]/g, ''))}
                    onBlur={handleBlurHeight}
                    className="w-full border-0 p-0 outline-none" />
                </td>
                <th className="w-[16%] border border-black bg-muted px-2 py-1 text-left">体重(kg)</th>
                <td className="w-[12%] border border-black px-2 py-1">
                  <input
                    type="text"
                    value={data.weight}
                    onChange={(e) => onChange("weight", e.target.value.replace(/[^0-9.]/g, ''))}
                    onBlur={handleBlurWeight}
                    className="w-full border-0 p-0 outline-none" />
                </td>
                <th className="w-[16%] border border-black bg-muted px-2 py-1 text-left">服のサイズ</th>
                <td className="w-[12%] border border-black px-2 py-1">
                  <input value={data.uniformSize} onChange={(e) => onChange("uniformSize", e.target.value)} className="w-full border-0 p-0 outline-none" />
                </td>
                <th className="w-[16%] border border-black bg-muted px-2 py-1 text-left">ウエスト(cm)</th>
                <td className="w-[12%] border border-black px-2 py-1">
                  <input
                    type="text"
                    value={data.waist}
                    onChange={(e) => onChange("waist", e.target.value.replace(/[^0-9.]/g, ''))}
                    onBlur={handleBlurWaist}
                    className="w-full border-0 p-0 outline-none" />
                </td>
              </tr>
              <tr>
                <th className="border border-black bg-muted px-2 py-1 text-left">靴サイズ(cm)</th>
                <td className="border border-black px-2 py-1">
                  <input value={data.shoeSize} onChange={(e) => onChange("shoeSize", e.target.value)} className="w-full border-0 p-0 outline-none" />
                </td>
                <th className="border border-black bg-muted px-2 py-1 text-left">血液型</th>
                <td className="border border-black px-2 py-1">
                  <input value={data.bloodType} onChange={(e) => onChange("bloodType", e.target.value)} className="w-full border-0 p-0 outline-none" />
                </td>
                <th className="border border-black bg-muted px-2 py-1 text-left">視力(右)</th>
                <td className="border border-black px-2 py-1">
                  <input value={data.visionRight} onChange={(e) => onChange("visionRight", e.target.value)} className="w-full border-0 p-0 outline-none" />
                </td>
                <th className="border border-black bg-muted px-2 py-1 text-left">視力(左)</th>
                <td className="border border-black px-2 py-1">
                  <input value={data.visionLeft} onChange={(e) => onChange("visionLeft", e.target.value)} className="w-full border-0 p-0 outline-none" />
                </td>
              </tr>
              <tr>
                <th className="border border-black bg-muted px-2 py-1 text-left">メガネ使用</th>
                <td className="border border-black px-2 py-1">
                  <select value={data.glasses} onChange={(e) => onChange("glasses", e.target.value)} className="w-full border-0 p-0 outline-none">
                    <option value="">選択</option>
                    <option value="有">有</option>
                    <option value="無">無</option>
                  </select>
                </td>
                <th className="border border-black bg-muted px-2 py-1 text-left">利き腕</th>
                <td className="border border-black px-2 py-1">
                  <select value={data.dominantArm} onChange={(e) => onChange("dominantArm", e.target.value)} className="w-full border-0 p-0 outline-none">
                    <option value="">選択</option>
                    <option value="右">右</option>
                    <option value="左">左</option>
                  </select>
                </td>
                <th className="border border-black bg-muted px-2 py-1 text-left">アレルギー</th>
                <td className="border border-black px-2 py-1">
                  <select value={data.allergy} onChange={(e) => onChange("allergy", e.target.value)} className="w-full border-0 p-0 outline-none">
                    <option value="">選択</option>
                    <option value="有">有</option>
                    <option value="無">無</option>
                  </select>
                </td>
                <th className="border border-black bg-muted px-2 py-1 text-left">安全靴</th>
                <td className="border border-black px-2 py-1">
                  <select value={data.safetyShoes} onChange={(e) => onChange("safetyShoes", e.target.value)} className="w-full border-0 p-0 outline-none">
                    <option value="">選択</option>
                    <option value="有">有</option>
                    <option value="無">無</option>
                  </select>
                </td>
              </tr>
              <tr>
                <th className="border border-black bg-muted px-2 py-1 text-left">コロナワクチン</th>
                <td className="border border-black px-2 py-1" colSpan={7}>
                  <select value={data.vaccine} onChange={(e) => onChange("vaccine", e.target.value)} className="w-full border-0 p-0 outline-none">
                    <option value="">選択</option>
                    <option value="未接種">未接種</option>
                    <option value="1回">1回接種</option>
                    <option value="2回">2回接種</option>
                    <option value="3回">3回接種</option>
                    <option value="4回">4回接種</option>
                  </select>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* Work History */}
        <div className="form-section mb-3">
          <div className="mb-1 flex items-center justify-between">
            <span className="font-semibold">職務経歴</span>
            <button onClick={addJob} className="rounded border px-3 py-1 text-sm hover:bg-accent print:hidden">職歴追加</button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[720px] table-fixed border-collapse border border-black text-[11pt]">
              <thead>
                <tr className="bg-muted">
                  <th className="w-[13%] border border-black px-2 py-1 text-left">開始</th>
                  <th className="w-[13%] border border-black px-2 py-1 text-left">終了</th>
                  <th className="w-[17%] border border-black bg-muted px-2 py-1 text-left">派遣元</th>
                  <th className="w-[17%] border border-black bg-muted px-2 py-1 text-left">派遣先</th>
                  <th className="w-[15%] border border-black px-2 py-1 text-left">勤務地</th>
                  <th className="border border-black px-2 py-1 text-left">内容</th>
                </tr>
              </thead>
              <tbody>
                {data.jobs.map((row, i) => (
                  <tr key={i}>
                    <td className="border border-black px-2 py-1">
                      <input id={`jobStartInput-${i}`} type="month" value={row.start} onChange={(e) => updateJob(i, { start: e.target.value })} className="w-full border-0 p-0 outline-none print:hidden" data-print-target={`jobStartPrint-${i}`} />
                      <span id={`jobStartPrint-${i}`} className="hidden print:inline"></span>
                    </td>
                    <td className="border border-black px-2 py-1">
                      <input id={`jobEndInput-${i}`} type="month" value={row.end} onChange={(e) => updateJob(i, { end: e.target.value })} className="w-full border-0 p-0 outline-none print:hidden" data-print-target={`jobEndPrint-${i}`} />
                      <span id={`jobEndPrint-${i}`} className="hidden print:inline"></span>
                    </td>
                    <td className="border border-black px-2 py-1"><input value={row.hakenmoto} onChange={(e) => updateJob(i, { hakenmoto: e.target.value })} className="w-full border-0 p-0 outline-none" /></td>
                    <td className="border border-black px-2 py-1"><input value={row.hakensaki} onChange={(e) => updateJob(i, { hakensaki: e.target.value })} className="w-full border-0 p-0 outline-none" /></td>
                    <td className="border border-black px-2 py-1">
                      <div className="flex gap-2">
                        <input value={row.reason} onChange={(e) => updateJob(i, { reason: e.target.value })} className="w-full border-0 p-0 outline-none" />
                        <button type="button" onClick={() => removeJob(i)} className="h-7 w-7 shrink-0 rounded-full bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 print:hidden" title="行を削除">×</button>
                      </div>
                    </td>
                    <td className="border border-black px-2 py-1">
                      <div className="flex items-center gap-1">
                        <input value={row.content} onChange={(e) => updateJob(i, { content: e.target.value })} className="w-full border-0 p-0 outline-none" />
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Family Composition */}
        <div className="form-section mb-3">
          <div className="mb-1 flex items-center justify-between">
            <span className="font-semibold">家族構成</span>
            <button onClick={addFamily} className="rounded border px-3 py-1 text-sm hover:bg-accent print:hidden">家族追加</button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[600px] table-fixed border-collapse border border-black text-[11pt]">
              <colgroup><col className="w-[25%]" /><col className="w-[20%]" /><col className="w-[15%]" /><col className="w-[20%]" /><col className="w-[10%]" /><col className="w-[10%]" /></colgroup>
              <thead>
                <tr className="bg-muted">
                  <th className="border border-black px-2 py-1 text-left">氏名</th>
                  <th className="border border-black px-2 py-1 text-left">続柄</th>
                  <th className="border border-black px-2 py-1 text-left">年齢</th>
                  <th className="border border-black px-2 py-1 text-left">居住</th>
                  <th className="border border-black px-2 py-1 text-left">扶養</th>
                  <th className="border border-black px-2 py-1 text-left"></th>
                </tr>
              </thead>
              <tbody>
                {data.family.map((row, i) => {
                  const isCustomRelation = row.relation && !levels.relationOptions.includes(row.relation);
                  const showTextInput = editingRelationIndex === i || isCustomRelation;

                  return (
                    <tr key={i}>
                      <td className="border border-black px-2 py-1"><input value={row.name} onChange={(e) => updateFamily(i, { name: e.target.value })} className="w-full border-0 p-0 outline-none" /></td>
                      <td className="border border-black px-2 py-1 relative">
                        {showTextInput ? (
                          <input
                            type="text"
                            value={row.relation}
                            onChange={(e) => updateFamily(i, { relation: e.target.value })}
                            onBlur={() => {
                              if (data.family[i].relation === "") {
                                updateFamily(i, { relation: "" });
                              }
                              setEditingRelationIndex(null);
                            }}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter' || e.key === 'Tab') {
                                if (e.currentTarget.value === "") {
                                  updateFamily(i, { relation: "" });
                                }
                                setEditingRelationIndex(null);
                                e.preventDefault();
                              }
                            }}
                            placeholder="関係を入力"
                            className="w-full border-input rounded-md shadow-sm outline-none p-1 text-[10pt]"
                            autoFocus={editingRelationIndex === i}
                          />
                        ) : (
                          <div onClick={() => setEditingRelationIndex(i)} className="cursor-pointer w-full h-full flex items-center min-h-[24px]">
                            <select
                              value={row.relation || ""}
                              onChange={(e) => {
                                const newValue = e.target.value;
                                if (newValue === 'その他') {
                                  updateFamily(i, { relation: "" });
                                  setEditingRelationIndex(i);
                                } else {
                                  updateFamily(i, { relation: newValue });
                                  setEditingRelationIndex(null);
                                }
                              }}
                              onClick={() => {
                                if (row.relation && !levels.relationOptions.includes(row.relation)) {
                                  setEditingRelationIndex(i);
                                }
                              }}
                              className="w-full border-0 p-0 outline-none bg-transparent appearance-none cursor-pointer"
                            >
                              <option value="">選択</option>
                              {levels.relationOptions.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                            </select>
                            <span className="absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none text-muted-foreground">▼</span>
                          </div>
                        )}
                      </td>
                      <td className="border border-black px-2 py-1"><input type="number" value={row.age} onChange={(e) => updateFamily(i, { age: e.target.value })} className="w-full border-0 p-0 outline-none" /></td>
                      <td className="border border-black px-2 py-1">
                        <select
                          value={row.residence}
                          onChange={(e) => updateFamily(i, { residence: e.target.value })}
                          className="w-full border-0 p-0 outline-none bg-transparent"
                        >
                          <option value="">選択</option>
                          {levels.residenceOptions.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                        </select>
                      </td>
                      <td className="border border-black px-2 py-1">
                        <select
                          value={row.dependent}
                          onChange={(e) =>
                            updateFamily(i, {
                              dependent: e.target.value as FamilyEntry["dependent"],
                            })
                          }
                          className="w-full border-0 p-0 outline-none"
                        >
                          <option value="">選択</option>
                          <option value="有">有</option>
                          <option value="無">無</option>
                        </select>
                      </td>
                      <td className="border border-black px-2 py-1 align-middle text-center">
                        <button type="button" onClick={() => removeFamily(i)} className="h-7 w-7 shrink-0 rounded-full bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 print:hidden" title="行を削除">×</button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Footer */}
        <div className="print-footer mt-auto pt-4">
          <table className="w-full table-fixed border-collapse border border-black text-[11pt]">
            <colgroup><col className="w-[15%]" /><col className="w-[18.33%]" /><col className="w-[15%]" /><col className="w-[18.33%]" /><col className="w-[15%]" /><col className="w-[18.33%]" /></colgroup>
            <tbody>
              <tr>
                <th className="border border-black bg-muted px-2 py-1 text-left">通勤方法</th>
                <td className="border border-black px-2 py-1">
                  <select
                    value={data.commuteMethod}
                    onChange={(e) => onChange("commuteMethod", e.target.value)}
                    className="w-full border-0 p-0 outline-none bg-transparent"
                  >
                    <option value="">選択</option>
                    {levels.commuteOptions.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                  </select>
                </td>
                <th className="border border-black bg-muted px-2 py-1 text-left">通勤片道時間（分）</th>
                <td className="border border-black px-2 py-1">
                  <input
                    type="text"
                    value={data.commuteTimeMin}
                    onChange={(e) => onChange("commuteTimeMin", e.target.value.replace(/[^0-9]/g, ''))}
                    onBlur={handleBlurCommuteTime}
                    className="w-full border-0 p-0 outline-none" />
                </td>
                <th className="border border-black bg-muted px-2 py-1 text-left">お弁当（社内食堂）</th>
                <td className="border border-black px-2 py-1">
                  <select
                    value={data.lunchPref}
                    onChange={(e) =>
                      onChange("lunchPref", e.target.value as FormDataState["lunchPref"])
                    }
                    className="w-full border-0 p-0 outline-none"
                  >
                    {(["昼/夜", "昼のみ", "夜のみ", "持参"] as const).map((v) => (<option key={v} value={v}>{v}</option>))}
                  </select>
                </td>
              </tr>
            </tbody>
          </table>
          <div className="mt-4 text-center text-[10pt]">
            <div>ユニバーサル企画株式会社</div>
            <div>TEL 052-938-8840　FAX 052-938-8841</div>
          </div>
        </div>
      </div>

      {/* Print Styles */}
      <style jsx>{`
        @import url('https://fonts.googleapis.com/css2?family=Noto+Sans+JP:wght@400;500;700&display=swap');
        .font-noto-sans-jp { font-family: 'Noto Sans JP', sans-serif; }
        
        /* Configuración de página para impresión A4 vertical */
        @page {
          size: A4 portrait;
          margin: 8mm;
        }
        
        @media print {
          /* Resetear márgenes y padding */
          html, body {
            margin: 0 !important;
            padding: 0 !important;
            background: white !important;
            font-family: 'Noto Sans JP', sans-serif !important;
            font-size: 10pt !important;
            line-height: 1.3 !important;
            color: black !important;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }

          /* Ocultar TODOS los elementos del dashboard y no deseados */
          body > *:not(.print-preview-container):not(.print-preview-container *) {
            display: none !important;
            visibility: hidden !important;
          }

          /* Ocultar elementos específicos del dashboard */
          header,
          aside,
          footer,
          nav,
          .sidebar,
          .header,
          .dashboard-header,
          .dashboard-sidebar,
          .dashboard-footer,
          .toaster,
          .react-query-devtools,
          [class*="react-query"],
          [class*="tanstack"],
          [data-testid*="devtools"],
          .theme-selector,
          .dropdown-menu,
          .notification-badge,
          .search-bar,
          .user-menu,
          .navigation-menu,
          .breadcrumb,
          .pagination,
          .toolbar,
          .action-buttons,
          .print-toolbar,
          [data-testid="header"],
          [data-testid="sidebar"],
          [data-testid="footer"],
          [role="navigation"],
          [role="toolbar"],
          [aria-label*="navigation"],
          [aria-label*="menu"],
          [class*="sidebar"],
          [class*="header"],
          [class*="footer"],
          [class*="toolbar"],
          [class*="navigation"],
          [class*="breadcrumb"],
          [class*="pagination"],
          [class*="toaster"],
          [class*="notification"],
          [class*="dropdown"],
          [class*="menu"] {
            display: none !important;
            visibility: hidden !important;
          }

          /* Ocultar timestamps y metadatos */
          .timestamp,
          .date-time,
          .print-date,
          .generated-date,
          .page-info,
          [data-timestamp],
          [class*="timestamp"],
          [class*="date-time"] {
            display: none !important;
            visibility: hidden !important;
          }

          /* Contenedor principal del formulario */
          .print-preview-container {
            display: block !important;
            visibility: visible !important;
            position: absolute !important;
            top: 0 !important;
            left: 0 !important;
            width: 100% !important;
            height: 100vh !important;
            background: white !important;
            padding: 0 !important;
            margin: 0 !important;
            overflow: visible !important;
          }

          /* Asegurar que el contenido del formulario sea visible */
          .print-preview-container * {
            visibility: visible !important;
          }

          /* Contenedor A4 */
          .print-a4-container {
            width: 190mm !important;
            min-height: 277mm !important;
            margin: 0 auto !important;
            padding: 6mm !important;
            background: white !important;
            box-shadow: none !important;
            border: none !important;
            page-break-inside: avoid !important;
            position: relative !important;
          }

          /* Corregir layout de foto y tabla - MANTENER ALINEACIÓN HORIZONTAL */
          .form-section:first-child {
            display: flex !important;
            flex-direction: row !important;
            gap: 4mm !important;
            margin-bottom: 6pt !important;
            page-break-inside: avoid !important;
          }

          .form-section:first-child > div:first-child {
            flex-shrink: 0 !important;
            width: 40mm !important;
            height: 50mm !important;
          }

          .form-section:first-child > table {
            flex: 1 !important;
            width: auto !important;
            margin-left: 0 !important;
          }

          /* Ocultar elementos interactivos */
          .print-hidden,
          button,
          .btn,
          [role="button"],
          input[type="button"],
          input[type="submit"],
          .toolbar,
          .action-buttons {
            display: none !important;
          }

          /* Estilos para tablas */
          table {
            width: 100% !important;
            border-collapse: collapse !important;
            page-break-inside: avoid !important;
            margin-bottom: 3pt !important;
            table-layout: fixed !important;
          }

          th, td {
            border: 1px solid black !important;
            padding: 1.5px 3px !important;
            font-size: 8pt !important;
            vertical-align: middle !important;
            background: transparent !important;
            color: black !important;
            word-wrap: break-word !important;
          }

          th {
            background-color: #f0f0f0 !important;
            font-weight: bold !important;
            text-align: left !important;
            width: auto !important;
          }

          /* Estilos para inputs y selects en impresión */
          input, select, textarea {
            background: transparent !important;
            border: none !important;
            box-shadow: none !important;
            color: black !important;
            font-size: 8pt !important;
            padding: 0 !important;
            margin: 0 !important;
            width: 100% !important;
            -webkit-appearance: none !important;
            -moz-appearance: none !important;
            appearance: none !important;
          }

          /* Ocultar flechas de selects */
          select::-ms-expand,
          select::-webkit-calendar-picker-indicator {
            display: none !important;
          }

          /* Ocultar iconos de date/month picker */
          input[type="date"]::-webkit-calendar-picker-indicator,
          input[type="month"]::-webkit-calendar-picker-indicator,
          input[type="date"]::-moz-calendar-picker-indicator,
          input[type="month"]::-moz-calendar-picker-indicator {
            display: none !important;
            -webkit-appearance: none !important;
          }

          /* Estilos para checkboxes */
          input[type="checkbox"] {
            -webkit-appearance: none !important;
            -moz-appearance: none !important;
            appearance: none !important;
            width: 10px !important;
            height: 10px !important;
            border: 1px solid black !important;
            background: transparent !important;
            position: relative !important;
            margin-right: 3px !important;
          }

          input[type="checkbox"]:checked::after {
            content: '✓' !important;
            position: absolute !important;
            top: -2px !important;
            left: 0px !important;
            font-size: 8pt !important;
            color: black !important;
          }

          /* Estilos para imágenes */
          img {
            max-width: 100% !important;
            height: auto !important;
            page-break-inside: avoid !important;
            object-fit: cover !important;
          }

          /* Estilos para texto */
          h1, h2, h3, h4, h5, h6 {
            color: black !important;
            page-break-after: avoid !important;
            page-break-inside: avoid !important;
            margin: 0 !important;
          }

          h1 {
            font-size: 18pt !important;
            text-align: center !important;
            margin-bottom: 8pt !important;
            font-weight: bold !important;
          }

          h2 {
            font-size: 12pt !important;
            margin-bottom: 4pt !important;
            margin-top: 6pt !important;
            font-weight: bold !important;
          }

          h3 {
            font-size: 10pt !important;
            margin-bottom: 3pt !important;
            margin-top: 4pt !important;
            font-weight: bold !important;
          }

          /* Evitar cortes de página */
          .form-section {
            page-break-inside: avoid !important;
            margin-bottom: 4pt !important;
          }

          /* Footer de impresión */
          .print-footer {
            margin-top: 6pt !important;
            page-break-inside: avoid !important;
          }

          /* Optimización para diferentes navegadores */
          @media print and (-webkit-min-device-pixel-ratio:0) {
            .print-a4-container {
              -webkit-transform: scale(1) !important;
              transform: scale(1) !important;
            }
          }

          /* Firefox */
          @media print and (min--moz-device-pixel-ratio:0) {
            .print-a4-container {
              width: 190mm !important;
            }
          }

          /* Edge */
          @media print and (-ms-high-contrast: none), (-ms-high-contrast: active) {
            .print-a4-container {
              width: 190mm !important;
            }
          }

          /* Asegurar que solo el contenido del formulario sea visible */
          * {
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
        }
      `}</style>
    </div>
  );
}

// --- Types ---
type JobEntry = { start: string; end: string; hakenmoto: string; hakensaki: string; content: string; reason: string; };
type FamilyEntry = {
  name: string;
  relation: string;
  age: string;
  residence: string;
  dependent: "有" | "無" | "";
};

type FormDataState = {
  applicantId: string; receptionDate: string; timeInJapan: string; nameKanji: string; nameFurigana: string; birthday: string; age: string; gender: string;
  nationality: string; postalCode: string; address: string; addressBanchi: string; addressBuilding: string; mobile: string; phone: string; emergencyName: string;
  emergencyRelation: string; emergencyPhone: string; visaType: string; visaPeriod: string; residenceCardNo: string;
  passportNo: string; passportExpiry: string; licenseNo: string; licenseExpiry: string; carOwner: string; insurance: string;
  speakLevel: string; listenLevel: string; kanjiReadLevel: string; kanjiWriteLevel: string; hiraganaReadLevel: string; hiraganaWriteLevel: string; katakanaReadLevel: string; katakanaWriteLevel: string; education: string;
  major: string; height: string; weight: string; uniformSize: string; waist: string; shoeSize: string; bloodType: string;
  visionRight: string; visionLeft: string; glasses: string; dominantArm: string; allergy: string; safetyShoes: string;
  vaccine: string; forkliftLicense: boolean; jlpt: boolean; jlptLevel: string; otherQualifications: string; lunchPref: "昼/夜" | "昼のみ" | "夜のみ" | "持参";
  commuteTimeMin: string; commuteMethod: string;
  jobs: JobEntry[];
  family: FamilyEntry[];
};

type FormDataStringKey = {
  [K in keyof FormDataState]: FormDataState[K] extends string
    ? (string extends FormDataState[K] ? K : never)
    : never;
}[keyof FormDataState];
