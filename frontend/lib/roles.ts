/**
 * Unified Role Management System
 * Single source of truth for all role-related constants and utilities
 *
 * This file consolidates:
 * - User role definitions (USER_ROLES)
 * - Role categorization system (ROLE_CATEGORIES, ROLE_DESCRIPTIONS)
 * - Role category utilities (getRoleCategory, isLegacyRole, etc.)
 * - Yukyu-specific permissions (YUKYU_ROLES, YUKYU_PAGE_ACCESS)
 * - Yukyu permission functions (canApproveYukyu, canCreateYukyuRequest, etc.)
 *
 * Previously split across role-categories.ts and yukyu-roles.ts
 */

// =============================================================================
// ROLE DEFINITIONS (Single Source of Truth)
// =============================================================================

/**
 * All available user roles in the system
 * Update this single constant when adding new roles
 */
export const USER_ROLES = {
  SUPER_ADMIN: 'SUPER_ADMIN',
  ADMIN: 'ADMIN',
  KEITOSAN: 'KEITOSAN', // 経理管理 - Finance Manager (Legacy)
  TANTOSHA: 'TANTOSHA', // 担当者 - HR Representative (Legacy)
  COORDINATOR: 'COORDINATOR',
  KANRININSHA: 'KANRININSHA', // 管理人者 - Manager
  EMPLOYEE: 'EMPLOYEE',
  CONTRACT_WORKER: 'CONTRACT_WORKER',
} as const;

export type UserRole = typeof USER_ROLES[keyof typeof USER_ROLES];

// =============================================================================
// ROLE CATEGORIZATION SYSTEM
// =============================================================================

export type RoleCategory = 'core' | 'modern' | 'legacy';

export interface RoleCategoryInfo {
  category: RoleCategory;
  label: string;
  description: string;
  color: string;
  bgColor: string;
  roles: UserRole[];
}

/**
 * Role categories with metadata
 * Organizes roles into Core (admin), Modern (current), and Legacy groups
 */
export const ROLE_CATEGORIES: Record<RoleCategory, RoleCategoryInfo> = {
  core: {
    category: 'core',
    label: 'Core Roles',
    description: 'System administrators with full or near-full access',
    color: 'text-blue-600 dark:text-blue-400',
    bgColor: 'bg-blue-50 dark:bg-blue-950/30',
    roles: [USER_ROLES.SUPER_ADMIN, USER_ROLES.ADMIN],
  },
  modern: {
    category: 'modern',
    label: 'Modern Roles',
    description: 'Current operational roles with specific permissions',
    color: 'text-green-600 dark:text-green-400',
    bgColor: 'bg-green-50 dark:bg-green-950/30',
    roles: [USER_ROLES.COORDINATOR, USER_ROLES.KANRININSHA, USER_ROLES.EMPLOYEE, USER_ROLES.CONTRACT_WORKER],
  },
  legacy: {
    category: 'legacy',
    label: 'Legacy Roles',
    description: 'Deprecated roles maintained for backward compatibility',
    color: 'text-orange-600 dark:text-orange-400',
    bgColor: 'bg-orange-50 dark:bg-orange-950/30',
    roles: [USER_ROLES.KEITOSAN, USER_ROLES.TANTOSHA],
  },
};

/**
 * Role descriptions for reference card
 * Provides human-readable information about each role
 */
export const ROLE_DESCRIPTIONS: Record<
  UserRole,
  {
    name: string;
    description: string;
    capabilities: string[];
    migrationNote?: string;
  }
> = {
  SUPER_ADMIN: {
    name: 'Super Administrator',
    description: 'Full system control with all permissions',
    capabilities: [
      'Complete database access',
      'User management',
      'System configuration',
      'All module access',
      'Security settings',
    ],
  },
  ADMIN: {
    name: 'Administrator',
    description: 'All permissions except database management',
    capabilities: [
      'User management',
      'Module configuration',
      'All business operations',
      'Reporting and analytics',
      'System settings',
    ],
  },
  COORDINATOR: {
    name: 'Coordinator',
    description: 'HR + Reporting (modern coordination role)',
    capabilities: [
      'Employee management',
      'Candidate management',
      'Factory assignments',
      'Report generation',
      'Request approval',
    ],
  },
  KANRININSHA: {
    name: 'Manager (管理人者)',
    description: 'Manager - HR + Finance operations',
    capabilities: [
      'HR operations',
      'Finance management',
      'Payroll processing',
      'Leave approval',
      'Team oversight',
    ],
  },
  KEITOSAN: {
    name: 'Finance Manager (経都算)',
    description: 'Finance Manager (legacy - for yukyu approval)',
    capabilities: ['Leave approval', 'Financial reports', 'Budget oversight'],
    migrationNote: 'Migrate to KANRININSHA for enhanced permissions and modern workflow',
  },
  TANTOSHA: {
    name: 'HR Representative (担当者)',
    description: 'HR Representative (legacy - for yukyu creation)',
    capabilities: ['Leave request creation', 'Employee records', 'Basic HR tasks'],
    migrationNote: 'Migrate to KANRININSHA for enhanced permissions and modern workflow',
  },
  EMPLOYEE: {
    name: 'Employee (社員)',
    description: 'Self-service access for employees',
    capabilities: [
      'Personal dashboard',
      'Leave requests',
      'Timecard viewing',
      'Salary information',
      'Profile management',
    ],
  },
  CONTRACT_WORKER: {
    name: 'Contract Worker (契約社員)',
    description: 'Minimal access for contract workers',
    capabilities: ['Basic dashboard', 'Timecard viewing', 'Personal information'],
  },
};

// =============================================================================
// ROLE CATEGORIZATION UTILITIES
// =============================================================================

/**
 * Get category for a specific role
 */
export function getRoleCategory(roleKey: string): RoleCategory {
  for (const [category, info] of Object.entries(ROLE_CATEGORIES)) {
    if (info.roles.includes(roleKey as UserRole)) {
      return category as RoleCategory;
    }
  }
  return 'modern'; // Default to modern if not found
}

/**
 * Check if a role is legacy
 */
export function isLegacyRole(roleKey: string): boolean {
  return ROLE_CATEGORIES.legacy.roles.includes(roleKey as UserRole);
}

/**
 * Get all roles in a category
 */
export function getRolesByCategory(category: RoleCategory): UserRole[] {
  return ROLE_CATEGORIES[category]?.roles || [];
}

/**
 * Group roles by category
 */
export function groupRolesByCategory(roles: string[]): Record<RoleCategory, UserRole[]> {
  const grouped: Record<RoleCategory, UserRole[]> = {
    core: [],
    modern: [],
    legacy: [],
  };

  for (const role of roles) {
    const category = getRoleCategory(role);
    grouped[category].push(role as UserRole);
  }

  return grouped;
}

/**
 * Get category metadata
 */
export function getCategoryInfo(category: RoleCategory): RoleCategoryInfo {
  return ROLE_CATEGORIES[category];
}

// =============================================================================
// YUKYU-SPECIFIC ROLE PERMISSIONS
// =============================================================================

/**
 * Yukyu Permission Definitions
 * 有給休暇の権限定義
 */
export const YUKYU_ROLES = {
  // Roles that can approve/reject yukyu requests (KEIRI - Finance Manager)
  KEIRI: [USER_ROLES.SUPER_ADMIN, USER_ROLES.ADMIN, USER_ROLES.KEITOSAN],

  // Roles that can create yukyu requests (TANTOSHA - HR Representative)
  TANTOSHA: [USER_ROLES.SUPER_ADMIN, USER_ROLES.ADMIN, USER_ROLES.TANTOSHA, USER_ROLES.COORDINATOR],

  // Roles that can view detailed reports
  REPORT_VIEWER: [USER_ROLES.SUPER_ADMIN, USER_ROLES.ADMIN, USER_ROLES.KEITOSAN],

  // Roles that can manage yukyu administration
  ADMIN_ONLY: [USER_ROLES.SUPER_ADMIN, USER_ROLES.ADMIN],
} as const;

/**
 * Yukyu Page Access Matrix
 * 有給休暇ページへのアクセスマトリックス
 */
export const YUKYU_PAGE_ACCESS = {
  '/yukyu': {
    allowedRoles: Object.values(USER_ROLES),
    description: 'Personal yukyu dashboard (全員アクセス可能)',
  },
  '/yukyu-requests/create': {
    allowedRoles: YUKYU_ROLES.TANTOSHA,
    description: 'Create yukyu request (担当者以上)',
  },
  '/yukyu-requests': {
    allowedRoles: YUKYU_ROLES.KEIRI,
    description: 'Approve/reject requests (経理管理者以上)',
  },
  '/yukyu-history': {
    allowedRoles: Object.values(USER_ROLES),
    description: 'Yukyu usage history (自分のみ、管理者は全員)',
  },
  '/yukyu-reports': {
    allowedRoles: YUKYU_ROLES.REPORT_VIEWER,
    description: 'Detailed reports (経理管理者以上)',
  },
  '/admin/yukyu-management': {
    allowedRoles: YUKYU_ROLES.ADMIN_ONLY,
    description: 'Admin management (管理者のみ)',
  },
} as const;

// =============================================================================
// YUKYU PERMISSION UTILITIES
// =============================================================================

/**
 * Check if user can approve/reject yukyu requests
 * ユーザーが有給休暇申請を承認・却下できるかチェック
 * @param role User's role
 * @returns true if user can approve/reject
 */
export function canApproveYukyu(role?: string): boolean {
  return role ? YUKYU_ROLES.KEIRI.includes(role as any) : false;
}

/**
 * Check if user can create yukyu requests
 * ユーザーが有給休暇申請を作成できるかチェック
 * @param role User's role
 * @returns true if user can create requests
 */
export function canCreateYukyuRequest(role?: string): boolean {
  return role ? YUKYU_ROLES.TANTOSHA.includes(role as any) : false;
}

/**
 * Check if user can view detailed yukyu reports
 * ユーザーが詳細なレポートを閲覧できるかチェック
 * @param role User's role
 * @returns true if user can view reports
 */
export function canViewYukyuReports(role?: string): boolean {
  return role ? YUKYU_ROLES.REPORT_VIEWER.includes(role as any) : false;
}

/**
 * Check if user is an administrator
 * ユーザーが管理者かチェック
 * @param role User's role
 * @returns true if user is admin
 */
export function isYukyuAdmin(role?: string): boolean {
  return role ? YUKYU_ROLES.ADMIN_ONLY.includes(role as any) : false;
}

/**
 * Check if user can access yukyu history of other employees
 * ユーザーが他の従業員の有給休暇履歴にアクセスできるかチェック
 * @param role User's role
 * @returns true if user can view all history
 */
export function canViewAllYukyuHistory(role?: string): boolean {
  return role
    ? [USER_ROLES.SUPER_ADMIN, USER_ROLES.ADMIN, USER_ROLES.KEITOSAN, USER_ROLES.TANTOSHA].includes(role as any)
    : false;
}

/**
 * Get permission level description
 * 権限レベルの説明を取得
 * @param role User's role
 * @returns Human-readable permission description
 */
export function getYukyuPermissionDescription(role?: string): string {
  if (!role) return 'No access';

  if (canApproveYukyu(role)) {
    return '有給休暇申請の承認・却下が可能 (Approval Rights)';
  }

  if (canCreateYukyuRequest(role)) {
    return '有給休暇申請の作成が可能 (Create Rights)';
  }

  if (canViewAllYukyuHistory(role)) {
    return '有給休暇履歴の閲覧が可能 (View Rights)';
  }

  return '基本的なアクセス権 (Basic Access)';
}
