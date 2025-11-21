'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { employeeService } from '@/lib/api';
import {
  MagnifyingGlassIcon,
  FunnelIcon,
  UserPlusIcon,
  PencilIcon,
  EyeIcon,
  AdjustmentsHorizontalIcon,
  XMarkIcon,
  UserCircleIcon,
  TableCellsIcon,
  ChevronUpIcon,
  ChevronDownIcon,
  Bars3BottomLeftIcon,
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
  photo_data_url: string | null;

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

// Column key type with ALL 44 columns
type ColumnKey =
  | 'photo'
  | 'current_status'
  | 'hakenmoto_id'
  | 'hakensaki_shain_id'
  | 'factory_name'
  | 'assignment_location'
  | 'assignment_line'
  | 'job_description'
  | 'full_name_kanji'
  | 'full_name_kana'
  | 'gender'
  | 'nationality'
  | 'date_of_birth'
  | 'age'
  | 'jikyu'
  | 'jikyu_revision_date'
  | 'hourly_rate_charged'
  | 'billing_revision_date'
  | 'profit_difference'
  | 'standard_compensation'
  | 'health_insurance'
  | 'nursing_insurance'
  | 'pension_insurance'
  | 'zairyu_expire_date'
  | 'visa_renewal_alert'
  | 'visa_type'
  | 'postal_code'
  | 'address'
  | 'apartment_id'
  | 'apartment_start_date'
  | 'hire_date'
  | 'termination_date'
  | 'apartment_move_out_date'
  | 'social_insurance_date'
  | 'entry_request_date'
  | 'notes'
  | 'current_hire_date'
  | 'license_type'
  | 'license_expire_date'
  | 'commute_method'
  | 'optional_insurance_expire'
  | 'japanese_level'
  | 'career_up_5years'
  | 'actions';

interface ColumnDefinition {
  key: ColumnKey;
  label: string;
  defaultWidth: number;
  render: (employee: Employee) => React.ReactNode;
}

// Resizable Column Component
interface ResizableColumnProps {
  columnKey: ColumnKey;
  width: number;
  onResize: (key: ColumnKey, width: number) => void;
  children: React.ReactNode;
  isSticky?: boolean;
}

const ResizableColumn: React.FC<ResizableColumnProps> = ({
  columnKey,
  width,
  onResize,
  children,
  isSticky = false,
}) => {
  const [isResizing, setIsResizing] = useState(false);

  const handleMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    setIsResizing(true);

    const startX = e.clientX;
    const startWidth = width;

    const handleMouseMove = (e: MouseEvent) => {
      const diff = e.clientX - startX;
      const newWidth = Math.max(80, Math.min(500, startWidth + diff));
      onResize(columnKey, newWidth);
    };

    const handleMouseUp = () => {
      setIsResizing(false);
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  };

  return (
    <th
      style={{
        width: `${width}px`,
        minWidth: `${width}px`,
        maxWidth: `${width}px`,
        position: isSticky ? 'sticky' : 'relative',
        left: isSticky ? 0 : 'auto',
        zIndex: isSticky ? 20 : 10,
        backgroundColor: isSticky ? 'hsl(var(--background))' : 'transparent',
      }}
      className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-r border-gray-200"
    >
      <div className="flex items-center justify-between">
        {children}
      </div>
      <div
        onMouseDown={handleMouseDown}
        className={`absolute right-0 top-0 bottom-0 w-1 cursor-col-resize hover:bg-primary ${
          isResizing ? 'bg-primary' : 'bg-transparent'
        }`}
        style={{ zIndex: 30 }}
      />
    </th>
  );
};

export default function EmployeesPage() {
  const router = useRouter();
  const [searchInput, setSearchInput] = useState(''); // Local input value
  const [searchTerm, setSearchTerm] = useState(''); // Debounced search value
  const [filterActive, setFilterActive] = useState<boolean | null>(true);
  const [filterFactory, setFilterFactory] = useState<string>('');
  const [filterContractType, setFilterContractType] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [showColumnSelector, setShowColumnSelector] = useState(false);
  const [showExcelModal, setShowExcelModal] = useState(false); // Estado para modal Excel
  const [modalSearch, setModalSearch] = useState(''); // Búsqueda dentro del modal
  const [sortColumn, setSortColumn] = useState<string | null>(null); // Columna de ordenamiento
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc'); // Dirección de ordenamiento
  const pageSize = 500;

  // Debounce search input - espera 500ms después de que el usuario deje de escribir
  useEffect(() => {
    const timer = setTimeout(() => {
      setSearchTerm(searchInput);
    }, 500);

    return () => clearTimeout(timer);
  }, [searchInput]);

  // Load column widths from localStorage
  const [columnWidths, setColumnWidths] = useState<Record<ColumnKey, number>>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('employeeColumnWidths');
      if (saved) {
        try {
          return JSON.parse(saved);
        } catch (e) {
          console.error('Failed to parse column widths:', e);
        }
      }
    }
    // Default widths for all columns
    return {
      photo: 80,
      current_status: 100,
      hakenmoto_id: 100,
      hakensaki_shain_id: 140,
      factory_name: 180,
      assignment_location: 120,
      assignment_line: 120,
      job_description: 200,
      full_name_kanji: 140,
      full_name_kana: 140,
      gender: 80,
      nationality: 100,
      date_of_birth: 120,
      age: 80,
      jikyu: 100,
      jikyu_revision_date: 120,
      hourly_rate_charged: 120,
      billing_revision_date: 120,
      profit_difference: 120,
      standard_compensation: 120,
      health_insurance: 120,
      nursing_insurance: 120,
      pension_insurance: 120,
      zairyu_expire_date: 120,
      visa_renewal_alert: 140,
      visa_type: 140,
      postal_code: 120,
      address: 250,
      apartment_id: 120,
      apartment_start_date: 120,
      hire_date: 120,
      termination_date: 120,
      apartment_move_out_date: 120,
      social_insurance_date: 120,
      entry_request_date: 120,
      notes: 200,
      current_hire_date: 120,
      license_type: 120,
      license_expire_date: 120,
      commute_method: 120,
      optional_insurance_expire: 140,
      japanese_level: 120,
      career_up_5years: 140,
      actions: 120,
    };
  });

  // Load visible columns from localStorage - Default to top 10 important columns
  const [visibleColumns, setVisibleColumns] = useState<Record<ColumnKey, boolean>>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('employeeVisibleColumns');
      if (saved) {
        try {
          const parsed = JSON.parse(saved);
          // ALWAYS ensure 'photo' column exists in saved data (for backward compatibility)
          if (!('photo' in parsed)) {
            parsed.photo = true;
          }
          return parsed;
        } catch (e) {
          console.error('Failed to parse visible columns:', e);
        }
      }
    }
    // Default visible columns (top 10)
    return {
      photo: true,
      current_status: true,
      hakenmoto_id: true,
      hakensaki_shain_id: true,
      factory_name: true,
      assignment_location: false,
      assignment_line: false,
      job_description: false,
      full_name_kanji: true,
      full_name_kana: false,
      gender: false,
      nationality: false,
      date_of_birth: false,
      age: false,
      jikyu: true,
      jikyu_revision_date: false,
      hourly_rate_charged: false,
      billing_revision_date: false,
      profit_difference: false,
      standard_compensation: false,
      health_insurance: false,
      nursing_insurance: false,
      pension_insurance: false,
      zairyu_expire_date: true,
      visa_renewal_alert: false,
      visa_type: false,
      postal_code: false,
      address: false,
      apartment_id: false,
      apartment_start_date: false,
      hire_date: true,
      termination_date: false,
      apartment_move_out_date: false,
      social_insurance_date: false,
      entry_request_date: false,
      notes: true,
      current_hire_date: false,
      license_type: false,
      license_expire_date: false,
      commute_method: false,
      optional_insurance_expire: false,
      japanese_level: false,
      career_up_5years: false,
      actions: true,
    };
  });

  // Save to localStorage when changed
  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('employeeColumnWidths', JSON.stringify(columnWidths));
    }
  }, [columnWidths]);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('employeeVisibleColumns', JSON.stringify(visibleColumns));
    }
  }, [visibleColumns]);

  // Fetch employees with React Query
  const { data, isLoading, error } = useQuery<PaginatedResponse>({
    queryKey: [
      'employees',
      currentPage,
      searchTerm,
      filterActive,
      filterFactory,
      filterContractType,
    ],
    queryFn: async (): Promise<PaginatedResponse> => {
      const params: any = {
        page: currentPage,
        page_size: pageSize,
      };

      if (searchTerm) params.search = searchTerm;
      if (filterActive !== null) params.is_active = filterActive;
      if (filterFactory) params.factory_id = filterFactory;
      if (filterContractType) params.contract_type = filterContractType;

      const response = await employeeService.getEmployees(params);
      return response as unknown as PaginatedResponse;
    },
  });

  const employees = data?.items || [];
  const total = data?.total || 0;
  const totalPages = data?.total_pages || 1;

  // Helper functions
  const formatDate = (dateString: string | null) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleDateString('ja-JP');
  };

  const formatCurrency = (amount: number | null) => {
    if (amount === null) return '-';
    return `¥${amount.toLocaleString()}`;
  };

  const calculateAge = (dateOfBirth: string | null) => {
    if (!dateOfBirth) return '-';
    const today = new Date();
    const birthDate = new Date(dateOfBirth);
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    return `${age}歳`;
  };

  const getStatusBadge = (status: string | null) => {
    const statusMap: Record<string, { label: string; color: string }> = {
      active: { label: '在籍中', color: 'bg-green-100 text-green-800' },
      terminated: { label: '退社済', color: 'bg-muted text-muted-foreground' },
      suspended: { label: '休職中', color: 'bg-yellow-100 text-yellow-800' },
    };

    const statusInfo = status ? statusMap[status] : null;
    if (!statusInfo) return '-';

    return (
      <span className={`inline-flex items-center px-2.5 py-1.5 rounded-md text-xs font-medium ${statusInfo.color}`}>
        {statusInfo.label}
      </span>
    );
  };

  const getStatusText = (status: string | null) => {
    const statusMap: Record<string, string> = {
      active: '在籍中',
      terminated: '退社済',
      suspended: '休職中',
    };
    return status ? statusMap[status] || status : '';
  };

  const getVisaAlertBadge = (alert: boolean | null, expireDate: string | null) => {
    if (!alert) return '-';

    const isExpiringSoon = expireDate && new Date(expireDate) < new Date(Date.now() + 90 * 24 * 60 * 60 * 1000);

    return (
      <span className={`inline-flex items-center px-2.5 py-1.5 rounded-md text-xs font-medium ${
        isExpiringSoon ? 'bg-red-100 text-red-800' : 'bg-yellow-100 text-yellow-800'
      }`}>
        {isExpiringSoon ? '⚠️ 要更新' : '⚠️ 確認'}
      </span>
    );
  };

  // Handle column header click for sorting
  const handleSort = (column: string) => {
    if (sortColumn === column) {
      // Toggle direction if same column
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      // New column, default to ascending
      setSortColumn(column);
      setSortDirection('asc');
    }
  };

  // Filter and sort employees for modal
  const getFilteredAndSortedEmployees = () => {
    let filtered = [...employees];

    // Apply search filter
    if (modalSearch.trim()) {
      const searchLower = modalSearch.toLowerCase();
      filtered = filtered.filter((emp) => {
        return (
          emp.full_name_kanji?.toLowerCase().includes(searchLower) ||
          emp.full_name_kana?.toLowerCase().includes(searchLower) ||
          emp.hakenmoto_id?.toString().includes(searchLower) ||
          emp.factory_name?.toLowerCase().includes(searchLower) ||
          emp.assignment_location?.toLowerCase().includes(searchLower) ||
          emp.assignment_line?.toLowerCase().includes(searchLower) ||
          emp.job_description?.toLowerCase().includes(searchLower) ||
          emp.rirekisho_id?.toLowerCase().includes(searchLower) ||
          emp.factory_id?.toLowerCase().includes(searchLower)
        );
      });
    }

    // Apply sorting
    if (sortColumn) {
      filtered.sort((a, b) => {
        let aVal: any = (a as any)[sortColumn];
        let bVal: any = (b as any)[sortColumn];

        // Handle null/undefined values
        if (aVal == null) aVal = '';
        if (bVal == null) bVal = '';

        // Compare values
        let comparison = 0;
        if (typeof aVal === 'string' && typeof bVal === 'string') {
          comparison = aVal.localeCompare(bVal);
        } else if (typeof aVal === 'number' && typeof bVal === 'number') {
          comparison = aVal - bVal;
        } else {
          // Convert to string for comparison
          comparison = String(aVal).localeCompare(String(bVal));
        }

        return sortDirection === 'asc' ? comparison : -comparison;
      });
    }

    return filtered;
  };

  // Get sort icon for column header
  const getSortIcon = (column: string) => {
    if (sortColumn !== column) {
      return <Bars3BottomLeftIcon className="h-4 w-4 text-gray-400 opacity-0 group-hover:opacity-100" />;
    }
    return sortDirection === 'asc' ? (
      <ChevronUpIcon className="h-4 w-4 text-blue-400" />
    ) : (
      <ChevronDownIcon className="h-4 w-4 text-blue-400" />
    );
  };

  // All 44 column definitions in Excel order
  const columnDefinitions: ColumnDefinition[] = [
    {
      key: 'photo',
      label: '写真',
      defaultWidth: 80,
      render: (emp) => {
        const photoSrc = emp.photo_url || emp.photo_data_url;
        return photoSrc ? (
          <img
            src={photoSrc}
            alt={emp.full_name_kanji}
            className="w-12 h-12 rounded-full object-cover border-2 border-gray-200"
          />
        ) : (
          <div className="w-12 h-12 rounded-full bg-gray-200 flex items-center justify-center">
            <UserCircleIcon className="w-8 h-8 text-gray-400" />
          </div>
        );
      },
    },
    {
      key: 'current_status',
      label: '現在',
      defaultWidth: 100,
      render: (emp) => getStatusBadge(emp.current_status),
    },
    {
      key: 'hakenmoto_id',
      label: '社員№',
      defaultWidth: 100,
      render: (emp) => emp.hakenmoto_id,
    },
    {
      key: 'hakensaki_shain_id',
      label: '派遣先ID',
      defaultWidth: 140,
      render: (emp) => (
        <span className="font-medium text-blue-600">{emp.hakensaki_shain_id || '-'}</span>
      ),
    },
    {
      key: 'factory_name',
      label: '派遣先',
      defaultWidth: 180,
      render: (emp) => emp.factory_name || emp.factory_id || '-',
    },
    {
      key: 'assignment_location',
      label: '配属先',
      defaultWidth: 120,
      render: (emp) => emp.assignment_location || '-',
    },
    {
      key: 'assignment_line',
      label: '配属ライン',
      defaultWidth: 120,
      render: (emp) => emp.assignment_line || '-',
    },
    {
      key: 'job_description',
      label: '仕事内容',
      defaultWidth: 200,
      render: (emp) => (
        <span className="truncate max-w-[180px] inline-block" title={emp.job_description || ''}>
          {emp.job_description || '-'}
        </span>
      ),
    },
    {
      key: 'full_name_kanji',
      label: '氏名',
      defaultWidth: 140,
      render: (emp) => emp.full_name_kanji,
    },
    {
      key: 'full_name_kana',
      label: 'カナ',
      defaultWidth: 140,
      render: (emp) => emp.full_name_kana || '-',
    },
    {
      key: 'gender',
      label: '性別',
      defaultWidth: 80,
      render: (emp) => emp.gender || '-',
    },
    {
      key: 'nationality',
      label: '国籍',
      defaultWidth: 100,
      render: (emp) => emp.nationality || '-',
    },
    {
      key: 'date_of_birth',
      label: '生年月日',
      defaultWidth: 120,
      render: (emp) => formatDate(emp.date_of_birth),
    },
    {
      key: 'age',
      label: '年齢',
      defaultWidth: 80,
      render: (emp) => calculateAge(emp.date_of_birth),
    },
    {
      key: 'jikyu',
      label: '時給',
      defaultWidth: 100,
      render: (emp) => formatCurrency(emp.jikyu),
    },
    {
      key: 'jikyu_revision_date',
      label: '時給改定',
      defaultWidth: 120,
      render: (emp) => formatDate(emp.jikyu_revision_date),
    },
    {
      key: 'hourly_rate_charged',
      label: '請求単価',
      defaultWidth: 120,
      render: (emp) => formatCurrency(emp.hourly_rate_charged),
    },
    {
      key: 'billing_revision_date',
      label: '請求改定',
      defaultWidth: 120,
      render: (emp) => formatDate(emp.billing_revision_date),
    },
    {
      key: 'profit_difference',
      label: '差額利益',
      defaultWidth: 120,
      render: (emp) => formatCurrency(emp.profit_difference),
    },
    {
      key: 'standard_compensation',
      label: '標準報酬',
      defaultWidth: 120,
      render: (emp) => formatCurrency(emp.standard_compensation),
    },
    {
      key: 'health_insurance',
      label: '健康保険',
      defaultWidth: 120,
      render: (emp) => formatCurrency(emp.health_insurance),
    },
    {
      key: 'nursing_insurance',
      label: '介護保険',
      defaultWidth: 120,
      render: (emp) => formatCurrency(emp.nursing_insurance),
    },
    {
      key: 'pension_insurance',
      label: '厚生年金',
      defaultWidth: 120,
      render: (emp) => formatCurrency(emp.pension_insurance),
    },
    {
      key: 'zairyu_expire_date',
      label: 'ビザ期限',
      defaultWidth: 120,
      render: (emp) => formatDate(emp.zairyu_expire_date),
    },
    {
      key: 'visa_renewal_alert',
      label: 'ｱﾗｰﾄ(ﾋﾞｻﾞ更新)',
      defaultWidth: 140,
      render: (emp) => getVisaAlertBadge(emp.visa_renewal_alert, emp.zairyu_expire_date),
    },
    {
      key: 'visa_type',
      label: 'ビザ種類',
      defaultWidth: 140,
      render: (emp) => emp.visa_type || '-',
    },
    {
      key: 'postal_code',
      label: '〒',
      defaultWidth: 120,
      render: (emp) => emp.postal_code || '-',
    },
    {
      key: 'address',
      label: '住所',
      defaultWidth: 250,
      render: (emp) => (
        <span className="truncate max-w-[230px] inline-block" title={emp.address || ''}>
          {emp.address || '-'}
        </span>
      ),
    },
    {
      key: 'apartment_id',
      label: 'ｱﾊﾟｰﾄ',
      defaultWidth: 120,
      render: (emp) => emp.apartment_id ? `#${emp.apartment_id}` : '-',
    },
    {
      key: 'apartment_start_date',
      label: '入居',
      defaultWidth: 120,
      render: (emp) => formatDate(emp.apartment_start_date),
    },
    {
      key: 'hire_date',
      label: '入社日',
      defaultWidth: 120,
      render: (emp) => formatDate(emp.hire_date),
    },
    {
      key: 'termination_date',
      label: '退社日',
      defaultWidth: 120,
      render: (emp) => formatDate(emp.termination_date),
    },
    {
      key: 'apartment_move_out_date',
      label: '退去',
      defaultWidth: 120,
      render: (emp) => formatDate(emp.apartment_move_out_date),
    },
    {
      key: 'social_insurance_date',
      label: '社保加入',
      defaultWidth: 120,
      render: (emp) => formatDate(emp.social_insurance_date),
    },
    {
      key: 'entry_request_date',
      label: '入社依頼',
      defaultWidth: 120,
      render: (emp) => formatDate(emp.entry_request_date),
    },
    {
      key: 'notes',
      label: '備考',
      defaultWidth: 200,
      render: (emp) => (
        <span className="truncate max-w-[180px] inline-block" title={emp.notes || ''}>
          {emp.notes || '-'}
        </span>
      ),
    },
    {
      key: 'current_hire_date',
      label: '現入社',
      defaultWidth: 120,
      render: (emp) => formatDate(emp.current_hire_date),
    },
    {
      key: 'license_type',
      label: '免許種類',
      defaultWidth: 120,
      render: (emp) => emp.license_type || '-',
    },
    {
      key: 'license_expire_date',
      label: '免許期限',
      defaultWidth: 120,
      render: (emp) => formatDate(emp.license_expire_date),
    },
    {
      key: 'commute_method',
      label: '通勤方法',
      defaultWidth: 120,
      render: (emp) => emp.commute_method || '-',
    },
    {
      key: 'optional_insurance_expire',
      label: '任意保険期限',
      defaultWidth: 140,
      render: (emp) => formatDate(emp.optional_insurance_expire),
    },
    {
      key: 'japanese_level',
      label: '日本語検定',
      defaultWidth: 120,
      render: (emp) => emp.japanese_level || '-',
    },
    {
      key: 'career_up_5years',
      label: 'キャリアアップ5年目',
      defaultWidth: 140,
      render: (emp) => emp.career_up_5years ? '✓ 該当' : '-',
    },
    {
      key: 'actions',
      label: 'Actions',
      defaultWidth: 120,
      render: (emp) => (
        <div className="flex gap-2">
          <button
            onClick={() => router.push(`/employees/${emp.id}`)}
            className="text-blue-600 hover:text-blue-900"
            title="詳細を見る"
          >
            <EyeIcon className="h-5 w-5 inline" />
          </button>
          <button
            onClick={() => router.push(`/employees/${emp.id}/edit`)}
            className="text-gray-600 hover:text-gray-900"
            title="編集"
          >
            <PencilIcon className="h-5 w-5 inline" />
          </button>
        </div>
      ),
    },
  ];

  const handleColumnResize = (key: ColumnKey, width: number) => {
    setColumnWidths((prev) => ({ ...prev, [key]: width }));
  };

  const handleColumnToggle = (key: ColumnKey) => {
    setVisibleColumns((prev) => {
      const visibleCount = Object.values(prev).filter(Boolean).length;
      if (visibleCount <= 1 && prev[key]) {
        return prev;
      }
      return {
        ...prev,
        [key]: !prev[key],
      };
    });
  };

  const visibleColumnDefinitions = columnDefinitions.filter((column) => visibleColumns[column.key]);
  const activeCount = employees.filter((e: Employee) => e.is_active).length;
  const inactiveCount = employees.filter((e: Employee) => !e.is_active).length;

  if (isLoading && employees.length === 0) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-muted/20 p-6">
      <div className="max-w-[1800px] mx-auto space-y-6">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl p-6 text-white shadow-lg hover:shadow-xl transition-shadow">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-semibold opacity-90">総従業員数</h3>
              <svg className="w-8 h-8 opacity-80" fill="currentColor" viewBox="0 0 20 20">
                <path d="M9 6a3 3 0 11-6 0 3 3 0 016 0zM17 6a3 3 0 11-6 0 3 3 0 016 0zM12.93 17c.046-.327.07-.66.07-1a6.97 6.97 0 00-1.5-4.33A5 5 0 0119 16v1h-6.07zM6 11a5 5 0 015 5v1H1v-1a5 5 0 015-5z" />
              </svg>
            </div>
            <p className="text-4xl font-black">{total}</p>
            <p className="text-xs opacity-75 mt-1">登録済みデータベース</p>
          </div>

          <div className="bg-gradient-to-br from-green-500 to-emerald-600 rounded-2xl p-6 text-primary-foreground shadow-lg hover:shadow-xl transition-shadow">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-semibold opacity-90">在籍中</h3>
              <svg className="w-8 h-8 opacity-80" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
            </div>
            <p className="text-4xl font-black">{activeCount}</p>
            <p className="text-xs opacity-75 mt-1">アクティブ従業員</p>
          </div>

          <div className="bg-gradient-to-br from-gray-500 to-slate-600 rounded-2xl p-6 text-primary-foreground shadow-lg hover:shadow-xl transition-shadow">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-semibold opacity-90">退社済</h3>
              <svg className="w-8 h-8 opacity-80" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
            </div>
            <p className="text-4xl font-black">{inactiveCount}</p>
            <p className="text-xs opacity-75 mt-1">非アクティブ</p>
          </div>
        </div>

        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-4xl font-foreground bg-gradient-to-r from-primary to-primary/90 bg-clip-text text-transparent">
              従業員管理
            </h1>
            <p className="mt-2 text-sm text-gray-600">全{total}名の従業員を管理</p>
          </div>
          <div className="flex gap-3">
            <button
              onClick={() => setShowExcelModal(true)}
              className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-emerald-500 to-teal-500 text-white rounded-xl font-semibold shadow-lg shadow-emerald-500/30 hover:shadow-emerald-500/50 transition-all duration-300 hover:scale-105"
            >
              <TableCellsIcon className="h-5 w-5" />
              Excel ビュー
            </button>
            <button
              onClick={() => router.push('/employees/new')}
              className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-indigo-500 to-purple-500 text-white rounded-xl font-semibold shadow-lg shadow-indigo-500/30 hover:shadow-indigo-500/50 transition-all duration-300 hover:scale-105"
            >
              <UserPlusIcon className="h-5 w-5" />
              新規登録
            </button>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-card/90 backdrop-blur-sm rounded-2xl border p-6 shadow-lg">
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              {/* Search */}
              <div className="md:col-span-2">
                <label className="block text-sm font-semibold text-foreground mb-2">検索</label>
                <div className="relative">
                  <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                  <input
                    type="text"
                    value={searchInput}
                    onChange={(e) => {
                      setSearchInput(e.target.value);
                      setCurrentPage(1);
                    }}
                    placeholder="氏名または社員番号で検索..."
                    className="block w-full pl-10 pr-4 py-2.5 bg-muted border border-input rounded-xl focus:ring-2 focus:ring-primary focus:border-transparent transition"
                  />
                </div>
              </div>

              {/* Status Filter */}
              <div>
                <label className="block text-sm font-semibold text-foreground mb-2">在籍状況</label>
                <div className="relative">
                  <FunnelIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground pointer-events-none" />
                  <select
                    value={filterActive === null ? '' : filterActive.toString()}
                    onChange={(e) => {
                      const value = e.target.value;
                      setFilterActive(value === '' ? null : value === 'true');
                      setCurrentPage(1);
                    }}
                    className="block w-full pl-10 pr-4 py-2.5 bg-muted border border-input rounded-xl focus:ring-2 focus:ring-primary focus:border-transparent transition appearance-none"
                  >
                    <option value="">全て</option>
                    <option value="true">在籍中</option>
                    <option value="false">退社済</option>
                  </select>
                </div>
              </div>

              {/* Factory Filter */}
              <div>
                <label className="block text-sm font-semibold text-foreground mb-2">派遣先</label>
                <input
                  type="text"
                  value={filterFactory}
                  onChange={(e) => {
                    setFilterFactory(e.target.value);
                    setCurrentPage(1);
                  }}
                  placeholder="Factory-XX"
                  className="block w-full py-2.5 px-4 bg-muted border border-input rounded-xl focus:ring-2 focus:ring-primary focus:border-transparent transition"
                />
              </div>

              {/* Contract Type Filter */}
              <div>
                <label className="block text-sm font-semibold text-foreground mb-2">契約タイプ</label>
                <div className="relative">
                  <FunnelIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground pointer-events-none" />
                  <select
                    value={filterContractType === null ? '' : filterContractType}
                    onChange={(e) => {
                      const value = e.target.value;
                      setFilterContractType(value === '' ? null : value);
                      setCurrentPage(1);
                    }}
                    className="block w-full pl-10 pr-4 py-2.5 bg-muted border border-input rounded-xl focus:ring-2 focus:ring-primary focus:border-transparent transition appearance-none"
                  >
                    <option value="">全て</option>
                    <option value="請負">請負</option>
                    <option value="派遣">派遣社員</option>
                    <option value="スタッフ">スタッフ</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Column Selector Button */}
            <div className="pt-6 border-t border-border">
              <div className="flex items-center justify-between">
                <span className="text-sm font-semibold text-foreground">
                  表示中: {visibleColumnDefinitions.length}列 / 全{columnDefinitions.length}列
                </span>
                <button
                  onClick={() => setShowColumnSelector(!showColumnSelector)}
                  className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-100 text-indigo-700 rounded-lg hover:bg-indigo-200 transition-colors font-medium"
                >
                  <AdjustmentsHorizontalIcon className="h-5 w-5" />
                  {showColumnSelector ? '列選択を閉じる' : '列を選択'}
                </button>
              </div>

              {/* Column Selector Panel */}
              {showColumnSelector && (
                <div className="mt-4 p-4 bg-muted rounded-lg border border-input">
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-sm font-semibold text-foreground">表示する列を選択</span>
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          const allVisible = Object.keys(visibleColumns).reduce((acc, key) => {
                            acc[key as ColumnKey] = true;
                            return acc;
                          }, {} as Record<ColumnKey, boolean>);
                          setVisibleColumns(allVisible);
                        }}
                        className="text-xs px-3 py-1.5 bg-primary/10 text-primary rounded-lg hover:bg-primary/20 transition-colors font-medium"
                      >
                        全て表示
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setVisibleColumns({
                            photo: true,
                            current_status: true,
                            hakenmoto_id: true,
                            hakensaki_shain_id: true,
                            factory_name: true,
                            assignment_location: false,
                            assignment_line: false,
                            job_description: false,
                            full_name_kanji: true,
                            full_name_kana: false,
                            gender: false,
                            nationality: false,
                            date_of_birth: false,
                            age: false,
                            jikyu: true,
                            jikyu_revision_date: false,
                            hourly_rate_charged: false,
                            billing_revision_date: false,
                            profit_difference: false,
                            standard_compensation: false,
                            health_insurance: false,
                            nursing_insurance: false,
                            pension_insurance: false,
                            zairyu_expire_date: true,
                            visa_renewal_alert: false,
                            visa_type: false,
                            postal_code: false,
                            address: false,
                            apartment_id: false,
                            apartment_start_date: false,
                            hire_date: true,
                            termination_date: false,
                            apartment_move_out_date: false,
                            social_insurance_date: false,
                            entry_request_date: false,
                            notes: true,
                            current_hire_date: false,
                            license_type: false,
                            license_expire_date: false,
                            commute_method: false,
                            optional_insurance_expire: false,
                            japanese_level: false,
                            career_up_5years: false,
                            actions: true,
                          });
                        }}
                        className="text-xs px-3 py-1.5 bg-muted text-muted-foreground rounded-lg hover:bg-accent transition-colors font-medium"
                      >
                        デフォルト
                      </button>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
                    {columnDefinitions.map((column) => (
                      <label
                        key={column.key}
                        className="inline-flex items-center text-sm text-foreground cursor-pointer hover:text-foreground transition"
                      >
                        <input
                          type="checkbox"
                          className="h-4 w-4 text-primary border-input rounded focus:ring-primary cursor-pointer"
                          checked={visibleColumns[column.key]}
                          onChange={() => handleColumnToggle(column.key)}
                        />
                        <span className="ml-2">{column.label}</span>
                      </label>
                    ))}
                  </div>
                  <p className="mt-3 text-xs text-muted-foreground">※最低1列は表示する必要があります。</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-4">
            <p className="text-sm text-red-800">エラーが発生しました。もう一度お試しください。</p>
          </div>
        )}

        {/* Employees Table with Horizontal Scroll */}
        <div className="bg-card shadow-lg rounded-2xl overflow-hidden border">
          <div className="overflow-x-auto" style={{ maxHeight: '70vh' }}>
            <table className="w-full divide-y divide-border" style={{ minWidth: 'max-content' }}>
              <thead className="bg-gradient-to-r from-muted to-muted/50 sticky top-0 z-10">
                <tr>
                  {visibleColumnDefinitions.map((column, index) => (
                    <ResizableColumn
                      key={column.key}
                      columnKey={column.key}
                      width={columnWidths[column.key] || column.defaultWidth}
                      onResize={handleColumnResize}
                      isSticky={index === 0} // Make first column (社員№) sticky
                    >
                      {column.label}
                    </ResizableColumn>
                  ))}
                </tr>
              </thead>
              <tbody className="bg-card divide-y divide-border">
                {employees.length === 0 ? (
                  <tr>
                    <td colSpan={visibleColumnDefinitions.length} className="px-6 py-12 text-center text-sm text-muted-foreground">
                      従業員が見つかりませんでした
                    </td>
                  </tr>
                ) : (
                  employees.map((employee) => (
                    <tr key={employee.id} className="hover:bg-accent/50 transition-colors">
                      {visibleColumnDefinitions.map((column, index) => (
                        <td
                          key={column.key}
                          className="px-4 py-3 whitespace-nowrap text-sm text-foreground border-r border-border"
                          style={{
                            width: `${columnWidths[column.key] || column.defaultWidth}px`,
                            minWidth: `${columnWidths[column.key] || column.defaultWidth}px`,
                            maxWidth: `${columnWidths[column.key] || column.defaultWidth}px`,
                            position: index === 0 ? 'sticky' : 'relative',
                            left: index === 0 ? 0 : 'auto',
                            zIndex: index === 0 ? 5 : 1,
                            backgroundColor: index === 0 ? 'hsl(var(--background))' : 'transparent',
                          }}
                        >
                          {column.render(employee)}
                        </td>
                      ))}
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="bg-muted px-6 py-4 flex items-center justify-between border-t border-border">
              <div className="flex-1 flex justify-between sm:hidden">
                <button
                  onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                  disabled={currentPage === 1}
                  className="relative inline-flex items-center px-4 py-2 border border-input text-sm font-medium rounded-lg text-muted-foreground bg-card hover:bg-accent disabled:bg-muted disabled:text-muted-foreground transition"
                >
                  前へ
                </button>
                <button
                  onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                  disabled={currentPage === totalPages}
                  className="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-lg text-gray-700 bg-white hover:bg-gray-50 disabled:bg-gray-100 disabled:text-gray-400 transition"
                >
                  次へ
                </button>
              </div>
              <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
                <div>
                  <p className="text-sm text-foreground">
                    <span className="font-medium">{total}</span> 件中{' '}
                    <span className="font-medium">{(currentPage - 1) * pageSize + 1}</span> -{' '}
                    <span className="font-medium">{Math.min(currentPage * pageSize, total)}</span> 件を表示
                  </p>
                </div>
                <div>
                  <nav className="relative z-0 inline-flex rounded-lg shadow-sm -space-x-px">
                    <button
                      onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                      disabled={currentPage === 1}
                      className="relative inline-flex items-center px-3 py-2 rounded-l-lg border border-input bg-card text-sm font-medium text-muted-foreground hover:bg-accent disabled:bg-muted disabled:text-muted-foreground transition"
                    >
                      前へ
                    </button>
                    {[...Array(Math.min(5, totalPages))].map((_, idx) => {
                      const page = idx + 1;
                      return (
                        <button
                          key={page}
                          onClick={() => setCurrentPage(page)}
                          className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium transition ${
                            currentPage === page
                              ? 'z-10 bg-primary/10 border-primary text-primary'
                              : 'bg-card border-input text-muted-foreground hover:bg-accent'
                          }`}
                        >
                          {page}
                        </button>
                      );
                    })}
                    <button
                      onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                      disabled={currentPage === totalPages}
                      className="relative inline-flex items-center px-3 py-2 rounded-r-lg border border-input bg-card text-sm font-medium text-muted-foreground hover:bg-accent disabled:bg-muted disabled:text-muted-foreground transition"
                    >
                      次へ
                    </button>
                  </nav>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Excel Modal Flotante */}
      {showExcelModal && (
        <div className="fixed inset-0 z-50 overflow-hidden bg-black/50 flex items-center justify-center p-4">
          <div className="bg-card rounded-2xl shadow-2xl w-full h-full max-w-[98vw] max-h-[98vh] flex flex-col">
            {/* Modal Header */}
            <div className="flex items-center justify-between px-6 py-4 bg-card-foreground border-b rounded-t-2xl">
              <div className="flex items-center gap-6 flex-1">
                <div>
                  <h2 className="text-2xl font-bold text-card-foreground">従業員管理 - Excel ビュー</h2>
                  <p className="text-sm text-muted-foreground">全 {total} 名 | 全列表示モード</p>
                </div>
                {/* Search Field */}
                <div className="relative">
                  <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                  <input
                    type="text"
                    value={modalSearch}
                    onChange={(e) => setModalSearch(e.target.value)}
                    placeholder="検索... (名前、社員№、派遣先など)"
                    className="pl-10 pr-4 py-2 bg-card-foreground border border-input rounded-lg text-primary-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent w-96"
                  />
                  {modalSearch && (
                    <button
                      onClick={() => setModalSearch('')}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground hover:text-card-foreground"
                    >
                      <XMarkIcon className="h-4 w-4" />
                    </button>
                  )}
                </div>
              </div>
              <button
                onClick={() => setShowExcelModal(false)}
                className="p-2 hover:bg-accent rounded-lg transition-colors group"
              >
                <XMarkIcon className="h-8 w-8 text-muted-foreground group-hover:text-card-foreground" />
              </button>
            </div>

            {/* Modal Content - Excel Table */}
            <div className="flex-1 overflow-hidden p-4">
              <div className="bg-card rounded-lg shadow-2xl h-full overflow-auto">
                <table className="w-full border-collapse" style={{ minWidth: '5000px' }}>
                  {/* Header Row */}
                  <thead className="sticky top-0 z-10">
                    <tr className="bg-card-foreground">
                      {/* Photo column - not sortable */}
                      <th className="px-3 py-2 text-left text-xs font-bold text-card-foreground border border-input sticky left-0 bg-card-foreground z-20">写真</th>

                      {/* Sortable columns */}
                      {[
                        { label: '現在', field: 'current_status' },
                        { label: '社員№', field: 'hakenmoto_id' },
                        { label: '派遣先ID', field: 'factory_id' },
                        { label: '派遣先', field: 'factory_name' },
                        { label: '配属先', field: 'assignment_location' },
                        { label: '配属ライン', field: 'assignment_line' },
                        { label: '仕事内容', field: 'job_description' },
                        { label: '氏名', field: 'full_name_kanji' },
                        { label: 'カナ', field: 'full_name_kana' },
                        { label: '性別', field: 'gender' },
                        { label: '国籍', field: 'nationality' },
                        { label: '生年月日', field: 'date_of_birth' },
                        { label: '年齢', field: 'age' },
                        { label: '時給', field: 'jikyu' },
                        { label: '時給改定', field: 'jikyu_revision_date' },
                        { label: '請求単価', field: 'hourly_rate_charged' },
                        { label: '請求改定', field: 'billing_revision_date' },
                        { label: '差額利益', field: 'profit_difference' },
                        { label: '標準報酬', field: 'standard_compensation' },
                        { label: '健康保険', field: 'health_insurance' },
                        { label: '介護保険', field: 'nursing_insurance' },
                        { label: '厚生年金', field: 'pension_insurance' },
                        { label: 'ビザ期限', field: 'zairyu_expire_date' },
                        { label: 'ビザ種類', field: 'visa_type' },
                        { label: '〒', field: 'postal_code' },
                        { label: '住所', field: 'address' },
                        { label: '電話', field: 'phone' },
                        { label: 'Email', field: 'email' },
                        { label: 'ｱﾊﾟｰﾄ', field: 'apartment_id' },
                        { label: '入居', field: 'apartment_start_date' },
                        { label: '入社日', field: 'hire_date' },
                        { label: '現入社', field: 'current_hire_date' },
                        { label: '退社日', field: 'termination_date' },
                        { label: '退去', field: 'apartment_move_out_date' },
                        { label: '社保加入', field: 'social_insurance_date' },
                        { label: '入社依頼', field: 'entry_request_date' },
                        { label: '免許種類', field: 'license_type' },
                        { label: '免許期限', field: 'license_expire_date' },
                        { label: '通勤方法', field: 'commute_method' },
                        { label: '任意保険期限', field: 'optional_insurance_expire' },
                        { label: '日本語検定', field: 'japanese_level' },
                        { label: 'キャリアアップ5年目', field: 'career_up_5years' },
                        { label: '有給残', field: 'paid_leave_days' },
                        { label: '備考', field: 'notes' },
                      ].map((col) => (
                        <th
                          key={col.field}
                          onClick={() => handleSort(col.field)}
                          className="px-3 py-2 text-left text-xs font-bold text-card-foreground border border-input cursor-pointer hover:bg-accent transition-colors group"
                        >
                          <div className="flex items-center gap-2">
                            <span>{col.label}</span>
                            {getSortIcon(col.field)}
                          </div>
                        </th>
                      ))}
                    </tr>
                  </thead>

                  {/* Data Rows */}
                  <tbody>
                    {(() => {
                      const filteredEmployees = getFilteredAndSortedEmployees();
                      return filteredEmployees.length === 0 ? (
                        <tr>
                          <td colSpan={45} className="px-6 py-12 text-center text-sm text-muted-foreground bg-card">
                            {modalSearch ? '検索結果が見つかりませんでした' : '従業員が見つかりませんでした'}
                          </td>
                        </tr>
                      ) : (
                        filteredEmployees.map((emp, index) => (
                        <tr
                          key={emp.id}
                          className={`${index % 2 === 0 ? 'bg-card' : 'bg-muted'} hover:bg-accent transition-colors`}
                        >
                          <td className="px-3 py-2 border border-input text-xs text-foreground sticky left-0 bg-inherit">
                            {(() => {
                              const photoSrc = emp.photo_url || emp.photo_data_url;
                              return photoSrc ? (
                                <img
                                  src={photoSrc}
                                  alt={emp.full_name_kanji}
                                  className="w-10 h-10 rounded object-cover border border-gray-300"
                                />
                              ) : (
                                <div className="w-10 h-10 rounded bg-gray-200 flex items-center justify-center">
                                  <UserCircleIcon className="w-6 h-6 text-gray-400" />
                                </div>
                              );
                            })()}
                          </td>
                          <td className="px-3 py-2 border border-gray-300 text-xs text-gray-900">{getStatusText(emp.current_status)}</td>
                          <td className="px-3 py-2 border border-gray-300 text-xs text-gray-900 font-medium">{emp.hakenmoto_id}</td>
                          <td className="px-3 py-2 border border-gray-300 text-xs text-blue-600 font-medium">{emp.hakensaki_shain_id || ''}</td>
                          <td className="px-3 py-2 border border-gray-300 text-xs text-gray-900">{emp.factory_name || emp.factory_id || ''}</td>
                          <td className="px-3 py-2 border border-gray-300 text-xs text-gray-900">{emp.assignment_location || ''}</td>
                          <td className="px-3 py-2 border border-gray-300 text-xs text-gray-900">{emp.assignment_line || ''}</td>
                          <td className="px-3 py-2 border border-gray-300 text-xs text-gray-900 max-w-[200px] truncate">{emp.job_description || ''}</td>
                          <td className="px-3 py-2 border border-gray-300 text-xs text-gray-900 font-medium">{emp.full_name_kanji}</td>
                          <td className="px-3 py-2 border border-gray-300 text-xs text-gray-900">{emp.full_name_kana || ''}</td>
                          <td className="px-3 py-2 border border-gray-300 text-xs text-gray-900">{emp.gender || ''}</td>
                          <td className="px-3 py-2 border border-gray-300 text-xs text-gray-900">{emp.nationality || ''}</td>
                          <td className="px-3 py-2 border border-gray-300 text-xs text-gray-900">{formatDate(emp.date_of_birth)}</td>
                          <td className="px-3 py-2 border border-gray-300 text-xs text-gray-900">{calculateAge(emp.date_of_birth)}</td>
                          <td className="px-3 py-2 border border-gray-300 text-xs text-gray-900 text-right">{formatCurrency(emp.jikyu)}</td>
                          <td className="px-3 py-2 border border-gray-300 text-xs text-gray-900">{formatDate(emp.jikyu_revision_date)}</td>
                          <td className="px-3 py-2 border border-gray-300 text-xs text-gray-900 text-right">{formatCurrency(emp.hourly_rate_charged)}</td>
                          <td className="px-3 py-2 border border-gray-300 text-xs text-gray-900">{formatDate(emp.billing_revision_date)}</td>
                          <td className="px-3 py-2 border border-gray-300 text-xs text-gray-900 text-right">{formatCurrency(emp.profit_difference)}</td>
                          <td className="px-3 py-2 border border-gray-300 text-xs text-gray-900 text-right">{formatCurrency(emp.standard_compensation)}</td>
                          <td className="px-3 py-2 border border-gray-300 text-xs text-gray-900 text-right">{formatCurrency(emp.health_insurance)}</td>
                          <td className="px-3 py-2 border border-gray-300 text-xs text-gray-900 text-right">{formatCurrency(emp.nursing_insurance)}</td>
                          <td className="px-3 py-2 border border-gray-300 text-xs text-gray-900 text-right">{formatCurrency(emp.pension_insurance)}</td>
                          <td className="px-3 py-2 border border-gray-300 text-xs text-gray-900">{formatDate(emp.zairyu_expire_date)}</td>
                          <td className="px-3 py-2 border border-gray-300 text-xs text-gray-900">{emp.visa_type || ''}</td>
                          <td className="px-3 py-2 border border-gray-300 text-xs text-gray-900">{emp.postal_code || ''}</td>
                          <td className="px-3 py-2 border border-gray-300 text-xs text-gray-900 max-w-[250px] truncate">{emp.address || ''}</td>
                          <td className="px-3 py-2 border border-gray-300 text-xs text-gray-900">{emp.phone || ''}</td>
                          <td className="px-3 py-2 border border-gray-300 text-xs text-gray-900">{emp.email || ''}</td>
                          <td className="px-3 py-2 border border-gray-300 text-xs text-gray-900">{emp.apartment_id ? `#${emp.apartment_id}` : ''}</td>
                          <td className="px-3 py-2 border border-gray-300 text-xs text-gray-900">{formatDate(emp.apartment_start_date)}</td>
                          <td className="px-3 py-2 border border-gray-300 text-xs text-gray-900">{formatDate(emp.hire_date)}</td>
                          <td className="px-3 py-2 border border-gray-300 text-xs text-gray-900">{formatDate(emp.current_hire_date)}</td>
                          <td className="px-3 py-2 border border-gray-300 text-xs text-gray-900">{formatDate(emp.termination_date)}</td>
                          <td className="px-3 py-2 border border-gray-300 text-xs text-gray-900">{formatDate(emp.apartment_move_out_date)}</td>
                          <td className="px-3 py-2 border border-gray-300 text-xs text-gray-900">{formatDate(emp.social_insurance_date)}</td>
                          <td className="px-3 py-2 border border-gray-300 text-xs text-gray-900">{formatDate(emp.entry_request_date)}</td>
                          <td className="px-3 py-2 border border-gray-300 text-xs text-gray-900">{emp.license_type || ''}</td>
                          <td className="px-3 py-2 border border-gray-300 text-xs text-gray-900">{formatDate(emp.license_expire_date)}</td>
                          <td className="px-3 py-2 border border-gray-300 text-xs text-gray-900">{emp.commute_method || ''}</td>
                          <td className="px-3 py-2 border border-gray-300 text-xs text-gray-900">{formatDate(emp.optional_insurance_expire)}</td>
                          <td className="px-3 py-2 border border-gray-300 text-xs text-gray-900">{emp.japanese_level || ''}</td>
                          <td className="px-3 py-2 border border-gray-300 text-xs text-gray-900 text-center">{emp.career_up_5years ? '✓' : ''}</td>
                          <td className="px-3 py-2 border border-gray-300 text-xs text-gray-900 text-center">{emp.yukyu_remaining}</td>
                          <td className="px-3 py-2 border border-gray-300 text-xs text-gray-900 max-w-[200px] truncate">{emp.notes || ''}</td>
                        </tr>
                      ))
                      );
                    })()}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="px-6 py-4 bg-card-foreground border-t rounded-b-2xl text-center text-sm text-muted-foreground">
              全 {getFilteredAndSortedEmployees().length} 件の従業員データを表示中
              {modalSearch && ` (フィルター適用: ${employees.length}件中)`}
              {sortColumn && ` | ソート: ${sortDirection === 'asc' ? '↑昇順' : '↓降順'}`}
              | 横スクロールで全列を確認できます | ESCキーで閉じる
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
