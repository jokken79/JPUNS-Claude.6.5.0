/**
 * RequestTypeBadge Component
 *
 * Displays a colored badge for different request types including 入社連絡票 (NYUUSHA).
 *
 * Usage:
 * ```tsx
 * <RequestTypeBadge type={RequestType.NYUUSHA} />
 * ```
 */

import React from 'react';
import { RequestType } from '@/types/api';

interface RequestTypeBadgeProps {
  type: RequestType;
  className?: string;
}

export function RequestTypeBadge({ type, className = '' }: RequestTypeBadgeProps) {
  // Configuration for each request type
  const config: Record<RequestType, { label: string; color: string; icon?: string }> = {
    [RequestType.YUKYU]: {
      label: '有給休暇',
      color: 'bg-blue-100 text-blue-800 border-blue-200',
      icon: '🏖️'
    },
    [RequestType.HANKYU]: {
      label: '半休',
      color: 'bg-cyan-100 text-cyan-800 border-cyan-200',
      icon: '⏰'
    },
    [RequestType.IKKIKOKOKU]: {
      label: '一時帰国',
      color: 'bg-purple-100 text-purple-800 border-purple-200',
      icon: '✈️'
    },
    [RequestType.TAISHA]: {
      label: '退社',
      color: 'bg-red-100 text-red-800 border-red-200',
      icon: '👋'
    },
    [RequestType.NYUUSHA]: {
      label: '入社連絡票',
      color: 'bg-orange-100 text-orange-800 border-orange-200',
      icon: '👤'
    },
  };

  const { label, color, icon } = config[type] || {
    label: type,
    color: 'bg-gray-100 text-gray-800 border-gray-200',
  };

  return (
    <span
      className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold border ${color} ${className}`}
      title={label}
    >
      {icon && <span>{icon}</span>}
      <span>{label}</span>
    </span>
  );
}

/**
 * RequestStatusBadge Component
 *
 * Displays a colored badge for different request statuses including 済 (COMPLETED).
 */

import { RequestStatus } from '@/types/api';

interface RequestStatusBadgeProps {
  status: RequestStatus;
  className?: string;
}

export function RequestStatusBadge({ status, className = '' }: RequestStatusBadgeProps) {
  const config: Record<RequestStatus, { label: string; color: string; icon?: string }> = {
    [RequestStatus.PENDING]: {
      label: '保留中',
      color: 'bg-yellow-100 text-yellow-800 border-yellow-200',
      icon: '⏳'
    },
    [RequestStatus.APPROVED]: {
      label: '承認済み',
      color: 'bg-green-100 text-green-800 border-green-200',
      icon: '✅'
    },
    [RequestStatus.REJECTED]: {
      label: '却下',
      color: 'bg-red-100 text-red-800 border-red-200',
      icon: '❌'
    },
    [RequestStatus.COMPLETED]: {
      label: '済',
      color: 'bg-gray-100 text-gray-800 border-gray-200',
      icon: '✔️'
    },
  };

  const { label, color, icon } = config[status] || {
    label: status,
    color: 'bg-gray-100 text-gray-800 border-gray-200',
  };

  return (
    <span
      className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold border ${color} ${className}`}
      title={label}
    >
      {icon && <span>{icon}</span>}
      <span>{label}</span>
    </span>
  );
}
