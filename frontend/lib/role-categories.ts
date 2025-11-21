/**
 * Role categorization system for admin control panel
 * Categorizes roles into Core, Modern, and Legacy groups
 */

export type RoleCategory = 'core' | 'modern' | 'legacy';

export interface RoleCategoryInfo {
  category: RoleCategory;
  label: string;
  description: string;
  color: string;
  bgColor: string;
  roles: string[];
}

/**
 * Role categories with metadata
 */
export const ROLE_CATEGORIES: Record<RoleCategory, RoleCategoryInfo> = {
  core: {
    category: 'core',
    label: 'Core Roles',
    description: 'System administrators with full or near-full access',
    color: 'text-blue-600 dark:text-blue-400',
    bgColor: 'bg-blue-50 dark:bg-blue-950/30',
    roles: ['SUPER_ADMIN', 'ADMIN'],
  },
  modern: {
    category: 'modern',
    label: 'Modern Roles',
    description: 'Current operational roles with specific permissions',
    color: 'text-green-600 dark:text-green-400',
    bgColor: 'bg-green-50 dark:bg-green-950/30',
    roles: ['COORDINATOR', 'KANRININSHA', 'EMPLOYEE', 'CONTRACT_WORKER'],
  },
  legacy: {
    category: 'legacy',
    label: 'Legacy Roles',
    description: 'Deprecated roles maintained for backward compatibility',
    color: 'text-orange-600 dark:text-orange-400',
    bgColor: 'bg-orange-50 dark:bg-orange-950/30',
    roles: ['KEITOSAN', 'TANTOSHA'],
  },
};

/**
 * Get category for a specific role
 */
export function getRoleCategory(roleKey: string): RoleCategory {
  for (const [category, info] of Object.entries(ROLE_CATEGORIES)) {
    if (info.roles.includes(roleKey)) {
      return category as RoleCategory;
    }
  }
  return 'modern'; // Default to modern if not found
}

/**
 * Check if a role is legacy
 */
export function isLegacyRole(roleKey: string): boolean {
  return ROLE_CATEGORIES.legacy.roles.includes(roleKey);
}

/**
 * Get all roles in a category
 */
export function getRolesByCategory(category: RoleCategory): string[] {
  return ROLE_CATEGORIES[category]?.roles || [];
}

/**
 * Group roles by category
 */
export function groupRolesByCategory(roles: string[]): Record<RoleCategory, string[]> {
  const grouped: Record<RoleCategory, string[]> = {
    core: [],
    modern: [],
    legacy: [],
  };

  for (const role of roles) {
    const category = getRoleCategory(role);
    grouped[category].push(role);
  }

  return grouped;
}

/**
 * Get category metadata
 */
export function getCategoryInfo(category: RoleCategory): RoleCategoryInfo {
  return ROLE_CATEGORIES[category];
}

/**
 * Role descriptions for reference card
 */
export const ROLE_DESCRIPTIONS: Record<
  string,
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
