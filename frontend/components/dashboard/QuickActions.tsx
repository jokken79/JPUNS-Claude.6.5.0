'use client';

import React from 'react';
import Link from 'next/link';
import {
  UserPlusIcon,
  DocumentPlusIcon,
  BuildingOfficeIcon,
  CalendarIcon,
  BanknotesIcon,
  ClockIcon,
  UserGroupIcon,
  ChartBarIcon,
  DocumentTextIcon,
  Cog6ToothIcon
} from '@heroicons/react/24/outline';

export interface QuickAction {
  id: string;
  label: string;
  description: string;
  href: string;
  icon: React.ElementType;
  color: 'primary' | 'secondary' | 'accent' | 'success' | 'warning' | 'destructive' | 'info';
  badge?: string | number;
}

export interface QuickActionsProps {
  actions?: QuickAction[];
  title?: string;
  columns?: 2 | 3 | 4;
  loading?: boolean;
}

// Color classes using CSS variables (respecting theme preferences)
// NO hardcoded colors - all colors come from theme variables
const colorClasses = {
  primary: {
    bg: 'bg-primary/5',
    border: 'border-primary/20',
    icon: 'bg-primary',
    text: 'text-primary',
    hover: 'hover:bg-primary/10'
  },
  secondary: {
    bg: 'bg-secondary/5',
    border: 'border-secondary/20',
    icon: 'bg-secondary',
    text: 'text-secondary',
    hover: 'hover:bg-secondary/10'
  },
  accent: {
    bg: 'bg-accent/5',
    border: 'border-accent/20',
    icon: 'bg-accent',
    text: 'text-accent',
    hover: 'hover:bg-accent/10'
  },
  success: {
    bg: 'bg-success/5',
    border: 'border-success/20',
    icon: 'bg-success',
    text: 'text-success',
    hover: 'hover:bg-success/10'
  },
  warning: {
    bg: 'bg-warning/5',
    border: 'border-warning/20',
    icon: 'bg-warning',
    text: 'text-warning',
    hover: 'hover:bg-warning/10'
  },
  destructive: {
    bg: 'bg-destructive/5',
    border: 'border-destructive/20',
    icon: 'bg-destructive',
    text: 'text-destructive',
    hover: 'hover:bg-destructive/10'
  },
  info: {
    bg: 'bg-info/5',
    border: 'border-info/20',
    icon: 'bg-info',
    text: 'text-info',
    hover: 'hover:bg-info/10'
  }
};

// Default quick actions
const defaultActions: QuickAction[] = [
  {
    id: 'add-candidate',
    label: 'Add Candidate',
    description: 'Register new candidate',
    href: '/dashboard/candidates/new',
    icon: UserPlusIcon,
    color: 'primary'
  },
  {
    id: 'add-employee',
    label: 'Add Employee',
    description: 'Register new employee',
    href: '/dashboard/employees/new',
    icon: UserGroupIcon,
    color: 'success'
  },
  {
    id: 'create-payroll',
    label: 'Create Payroll',
    description: 'Start new payroll run',
    href: '/dashboard/payroll/new',
    icon: BanknotesIcon,
    color: 'accent'
  },
  {
    id: 'add-timer-card',
    label: 'Timer Card',
    description: 'Record attendance',
    href: '/dashboard/timercards/new',
    icon: ClockIcon,
    color: 'warning'
  },
  {
    id: 'apartment-assignment',
    label: 'Assign Apartment',
    description: 'Assign employee to apartment',
    href: '/dashboard/apartments/assignments/new',
    icon: BuildingOfficeIcon,
    color: 'secondary'
  },
  {
    id: 'create-request',
    label: 'New Request',
    description: 'Submit employee request',
    href: '/dashboard/requests/new',
    icon: DocumentPlusIcon,
    color: 'info'
  },
  {
    id: 'view-reports',
    label: 'View Reports',
    description: 'Access system reports',
    href: '/dashboard/reports',
    icon: ChartBarIcon,
    color: 'accent'
  },
  {
    id: 'settings',
    label: 'Settings',
    description: 'System configuration',
    href: '/dashboard/settings',
    icon: Cog6ToothIcon,
    color: 'destructive'
  }
];

/**
 * QuickActions - Dashboard Quick Actions Component
 *
 * Displays a grid of quick action buttons for common tasks:
 * - Customizable action list
 * - Icon and color variants
 * - Badge support for notifications
 * - Responsive grid layout (2, 3, or 4 columns)
 * - Loading state with skeleton
 */
export function QuickActions({
  actions = defaultActions,
  title = 'Quick Actions',
  columns = 4,
  loading = false
}: QuickActionsProps) {
  const gridCols = {
    2: 'grid-cols-2',
    3: 'grid-cols-3',
    4: 'grid-cols-4'
  };

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow p-6 animate-pulse">
        <div className="h-6 bg-gray-200 rounded w-1/3 mb-6"></div>
        <div className={`grid ${gridCols[columns]} gap-4`}>
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="h-24 bg-gray-200 rounded"></div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow p-6">
      {/* Header */}
      <div className="mb-6">
        <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
        <p className="text-sm text-gray-500 mt-1">Frequently used actions</p>
      </div>

      {/* Actions Grid */}
      <div className={`grid ${gridCols[columns]} gap-4`}>
        {actions.map((action) => {
          const Icon = action.icon;
          const colors = colorClasses[action.color];

          return (
            <Link
              key={action.id}
              href={action.href}
              className={`
                relative block p-4 rounded-lg border transition-all
                ${colors.bg} ${colors.border} ${colors.hover}
                hover:shadow-md
              `}
            >
              {/* Badge */}
              {action.badge && (
                <div className="absolute -top-2 -right-2 bg-destructive text-destructive-foreground text-xs font-bold rounded-full h-6 w-6 flex items-center justify-center">
                  {action.badge}
                </div>
              )}

              {/* Icon */}
              <div className={`${colors.icon} rounded-full p-2 inline-block mb-3`}>
                <Icon className="h-6 w-6 text-white" />
              </div>

              {/* Label and Description */}
              <div>
                <p className={`font-medium ${colors.text} mb-1`}>{action.label}</p>
                <p className="text-xs text-gray-600">{action.description}</p>
              </div>
            </Link>
          );
        })}
      </div>

      {/* Footer Note */}
      {actions.length === 0 && (
        <div className="text-center py-8 text-gray-400">
          <DocumentTextIcon className="h-12 w-12 mx-auto mb-2" />
          <p className="text-sm">No quick actions configured</p>
        </div>
      )}
    </div>
  );
}
