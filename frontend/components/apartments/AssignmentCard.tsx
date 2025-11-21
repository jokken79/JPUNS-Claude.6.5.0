'use client';

import React from 'react';
import {
  UserIcon,
  BuildingOfficeIcon,
  CalendarIcon,
  BanknotesIcon
} from '@heroicons/react/24/outline';

export interface AssignmentCardProps {
  employeeName: string;
  apartmentName: string;
  startDate: string;
  endDate?: string;
  monthlyRent: number;
  status: 'active' | 'ended' | 'transferred' | 'cancelled';
  onView?: () => void;
  onEdit?: () => void;
  onEnd?: () => void;
}

const statusColors = {
  active: 'bg-green-100 text-green-800',
  ended: 'bg-gray-100 text-gray-800',
  transferred: 'bg-blue-100 text-blue-800',
  cancelled: 'bg-red-100 text-red-800',
};

const statusLabels = {
  active: '活動中',
  ended: '終了',
  transferred: '転居済',
  cancelled: 'キャンセル',
};

export function AssignmentCard({
  employeeName,
  apartmentName,
  startDate,
  endDate,
  monthlyRent,
  status,
  onView,
  onEdit,
  onEnd,
}: AssignmentCardProps) {
  return (
    <div className="bg-white rounded-lg shadow hover:shadow-md transition-shadow p-6 border border-gray-200">
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-2">
            <UserIcon className="h-5 w-5 text-gray-400" />
            <h3 className="text-lg font-semibold text-gray-900">
              {employeeName}
            </h3>
          </div>
          <div className="flex items-center gap-2 text-gray-600">
            <BuildingOfficeIcon className="h-4 w-4" />
            <span className="text-sm">{apartmentName}</span>
          </div>
        </div>

        <span className={`px-3 py-1 rounded-full text-xs font-medium ${statusColors[status]}`}>
          {statusLabels[status]}
        </span>
      </div>

      {/* Details */}
      <div className="grid grid-cols-2 gap-4 mb-4">
        <div>
          <div className="flex items-center gap-2 text-sm text-gray-500 mb-1">
            <CalendarIcon className="h-4 w-4" />
            <span>開始日</span>
          </div>
          <p className="text-sm font-medium text-gray-900">{startDate}</p>
        </div>

        {endDate && (
          <div>
            <div className="flex items-center gap-2 text-sm text-gray-500 mb-1">
              <CalendarIcon className="h-4 w-4" />
              <span>終了日</span>
            </div>
            <p className="text-sm font-medium text-gray-900">{endDate}</p>
          </div>
        )}

        <div>
          <div className="flex items-center gap-2 text-sm text-gray-500 mb-1">
            <BanknotesIcon className="h-4 w-4" />
            <span>月額家賃</span>
          </div>
          <p className="text-sm font-medium text-gray-900">
            ¥{monthlyRent.toLocaleString()}
          </p>
        </div>
      </div>

      {/* Actions */}
      {(onView || onEdit || onEnd) && (
        <div className="flex gap-2 pt-4 border-t border-gray-200">
          {onView && (
            <button
              onClick={onView}
              className="flex-1 px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 transition"
            >
              詳細
            </button>
          )}
          {onEdit && status === 'active' && (
            <button
              onClick={onEdit}
              className="flex-1 px-4 py-2 text-sm font-medium text-blue-700 bg-blue-50 border border-blue-300 rounded-md hover:bg-blue-100 transition"
            >
              編集
            </button>
          )}
          {onEnd && status === 'active' && (
            <button
              onClick={onEnd}
              className="flex-1 px-4 py-2 text-sm font-medium text-red-700 bg-red-50 border border-red-300 rounded-md hover:bg-red-100 transition"
            >
              終了
            </button>
          )}
        </div>
      )}
    </div>
  );
}
