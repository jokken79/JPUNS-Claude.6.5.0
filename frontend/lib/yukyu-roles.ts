/**
 * Yukyu Role Management Constants and Utilities
 * 有給休暇管理のロールと権限
 */

export const USER_ROLES = {
  SUPER_ADMIN: 'SUPER_ADMIN',
  ADMIN: 'ADMIN',
  KEITOSAN: 'KEITOSAN',        // 経理管理 - Finance Manager
  TANTOSHA: 'TANTOSHA',          // 担当者 - HR Representative
  COORDINATOR: 'COORDINATOR',
  KANRININSHA: 'KANRININSHA',
  EMPLOYEE: 'EMPLOYEE',
  CONTRACT_WORKER: 'CONTRACT_WORKER',
} as const;

/**
 * Yukyu Permission Definitions
 * 有給休暇の権限定義
 */
export const YUKYU_ROLES = {
  // Roles that can approve/reject yukyu requests (KEIRI - Finance Manager)
  KEIRI: [
    USER_ROLES.SUPER_ADMIN,
    USER_ROLES.ADMIN,
    USER_ROLES.KEITOSAN,
  ],

  // Roles that can create yukyu requests (TANTOSHA - HR Representative)
  TANTOSHA: [
    USER_ROLES.SUPER_ADMIN,
    USER_ROLES.ADMIN,
    USER_ROLES.TANTOSHA,
    USER_ROLES.COORDINATOR,
  ],

  // Roles that can view detailed reports
  REPORT_VIEWER: [
    USER_ROLES.SUPER_ADMIN,
    USER_ROLES.ADMIN,
    USER_ROLES.KEITOSAN,
  ],

  // Roles that can manage yukyu administration
  ADMIN_ONLY: [
    USER_ROLES.SUPER_ADMIN,
    USER_ROLES.ADMIN,
  ],
} as const;

/**
 * Permission Check Functions
 * 権限チェック関数
 */

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
    ? [
        USER_ROLES.SUPER_ADMIN,
        USER_ROLES.ADMIN,
        USER_ROLES.KEITOSAN,
        USER_ROLES.TANTOSHA,
      ].includes(role as any)
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
