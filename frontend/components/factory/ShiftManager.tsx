'use client';

import React, { useState } from 'react';
import {
  PlusIcon,
  PencilIcon,
  TrashIcon,
  CheckIcon,
  XMarkIcon,
  ClockIcon,
} from '@heroicons/react/24/outline';

interface ShiftConfig {
  shift_name: string;
  start_time: string;
  end_time: string;
  break_minutes: number;
}

interface ShiftManagerProps {
  shifts: ShiftConfig[];
  onChange: (shifts: ShiftConfig[]) => void;
}

export default function ShiftManager({ shifts, onChange }: ShiftManagerProps) {
  const [isAdding, setIsAdding] = useState(false);
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [formData, setFormData] = useState<ShiftConfig>({
    shift_name: '',
    start_time: '',
    end_time: '',
    break_minutes: 60,
  });

  // Calculate work hours
  const calculateWorkHours = (startTime: string, endTime: string, breakMinutes: number): string => {
    if (!startTime || !endTime) return '-';

    const [startHour, startMin] = startTime.split(':').map(Number);
    const [endHour, endMin] = endTime.split(':').map(Number);

    let totalMinutes = (endHour * 60 + endMin) - (startHour * 60 + startMin);

    // Handle overnight shifts
    if (totalMinutes < 0) {
      totalMinutes += 24 * 60;
    }

    const workMinutes = totalMinutes - breakMinutes;
    const hours = Math.floor(workMinutes / 60);
    const minutes = workMinutes % 60;

    return `${hours}時間${minutes}分`;
  };

  // Validate time format (HH:MM)
  const isValidTimeFormat = (time: string): boolean => {
    const regex = /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/;
    return regex.test(time);
  };

  // Handle add new shift
  const handleAdd = () => {
    if (!formData.shift_name || !formData.start_time || !formData.end_time) {
      alert('すべての必須項目を入力してください');
      return;
    }

    if (!isValidTimeFormat(formData.start_time) || !isValidTimeFormat(formData.end_time)) {
      alert('時刻は HH:MM 形式で入力してください (例: 08:00)');
      return;
    }

    onChange([...shifts, formData]);
    setFormData({
      shift_name: '',
      start_time: '',
      end_time: '',
      break_minutes: 60,
    });
    setIsAdding(false);
  };

  // Handle edit shift
  const handleEdit = (index: number) => {
    setEditingIndex(index);
    setFormData(shifts[index]);
  };

  // Handle save edit
  const handleSaveEdit = () => {
    if (editingIndex === null) return;

    if (!formData.shift_name || !formData.start_time || !formData.end_time) {
      alert('すべての必須項目を入力してください');
      return;
    }

    if (!isValidTimeFormat(formData.start_time) || !isValidTimeFormat(formData.end_time)) {
      alert('時刻は HH:MM 形式で入力してください (例: 08:00)');
      return;
    }

    const updatedShifts = [...shifts];
    updatedShifts[editingIndex] = formData;
    onChange(updatedShifts);
    setEditingIndex(null);
    setFormData({
      shift_name: '',
      start_time: '',
      end_time: '',
      break_minutes: 60,
    });
  };

  // Handle cancel edit
  const handleCancelEdit = () => {
    setEditingIndex(null);
    setFormData({
      shift_name: '',
      start_time: '',
      end_time: '',
      break_minutes: 60,
    });
  };

  // Handle delete shift
  const handleDelete = (index: number) => {
    if (confirm('このシフトを削除してもよろしいですか？')) {
      const updatedShifts = shifts.filter((_, i) => i !== index);
      onChange(updatedShifts);
    }
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">シフト設定</h3>
          <p className="text-sm text-muted-foreground">勤務時間と休憩時間を設定します</p>
        </div>
        {!isAdding && editingIndex === null && (
          <button
            onClick={() => setIsAdding(true)}
            className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
          >
            <PlusIcon className="h-5 w-5" />
            シフトを追加
          </button>
        )}
      </div>

      {/* Add New Shift Form */}
      {isAdding && (
        <div className="border rounded-lg p-4 bg-blue-50 dark:bg-blue-950/20">
          <h4 className="font-medium mb-3">新しいシフトを追加</h4>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">
                シフト名 <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                placeholder="朝番"
                value={formData.shift_name}
                onChange={(e) => setFormData({ ...formData, shift_name: e.target.value })}
                className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">
                開始時刻 <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                placeholder="08:00"
                value={formData.start_time}
                onChange={(e) => setFormData({ ...formData, start_time: e.target.value })}
                className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">
                終了時刻 <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                placeholder="17:00"
                value={formData.end_time}
                onChange={(e) => setFormData({ ...formData, end_time: e.target.value })}
                className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">
                休憩時間 (分)
              </label>
              <input
                type="number"
                min="0"
                max="180"
                value={formData.break_minutes}
                onChange={(e) => setFormData({ ...formData, break_minutes: parseInt(e.target.value) || 0 })}
                className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
          </div>

          <div className="flex items-center gap-2 mt-4">
            <button
              onClick={handleAdd}
              className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
            >
              <CheckIcon className="h-5 w-5" />
              追加
            </button>
            <button
              onClick={() => {
                setIsAdding(false);
                setFormData({
                  shift_name: '',
                  start_time: '',
                  end_time: '',
                  break_minutes: 60,
                });
              }}
              className="flex items-center gap-2 px-4 py-2 border rounded-lg hover:bg-accent transition-colors"
            >
              <XMarkIcon className="h-5 w-5" />
              キャンセル
            </button>
          </div>
        </div>
      )}

      {/* Shifts List */}
      {shifts.length === 0 ? (
        <div className="border rounded-lg p-8 text-center text-muted-foreground">
          <ClockIcon className="h-12 w-12 mx-auto mb-3 opacity-50" />
          <p>シフトが設定されていません</p>
          <p className="text-sm mt-1">「シフトを追加」ボタンから設定を開始してください</p>
        </div>
      ) : (
        <div className="space-y-3">
          {shifts.map((shift, index) => (
            <div key={index}>
              {editingIndex === index ? (
                /* Edit Form */
                <div className="border rounded-lg p-4 bg-yellow-50 dark:bg-yellow-950/20">
                  <h4 className="font-medium mb-3">シフトを編集</h4>
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div>
                      <label className="block text-sm font-medium mb-1">
                        シフト名 <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        value={formData.shift_name}
                        onChange={(e) => setFormData({ ...formData, shift_name: e.target.value })}
                        className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium mb-1">
                        開始時刻 <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        value={formData.start_time}
                        onChange={(e) => setFormData({ ...formData, start_time: e.target.value })}
                        className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium mb-1">
                        終了時刻 <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        value={formData.end_time}
                        onChange={(e) => setFormData({ ...formData, end_time: e.target.value })}
                        className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium mb-1">
                        休憩時間 (分)
                      </label>
                      <input
                        type="number"
                        min="0"
                        max="180"
                        value={formData.break_minutes}
                        onChange={(e) => setFormData({ ...formData, break_minutes: parseInt(e.target.value) || 0 })}
                        className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                      />
                    </div>
                  </div>

                  <div className="flex items-center gap-2 mt-4">
                    <button
                      onClick={handleSaveEdit}
                      className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
                    >
                      <CheckIcon className="h-5 w-5" />
                      保存
                    </button>
                    <button
                      onClick={handleCancelEdit}
                      className="flex items-center gap-2 px-4 py-2 border rounded-lg hover:bg-accent transition-colors"
                    >
                      <XMarkIcon className="h-5 w-5" />
                      キャンセル
                    </button>
                  </div>
                </div>
              ) : (
                /* Display Shift */
                <div className="border rounded-lg p-4 hover:shadow-md transition-shadow">
                  <div className="flex items-center justify-between">
                    <div className="flex-1 grid grid-cols-1 md:grid-cols-5 gap-4">
                      <div>
                        <p className="text-sm text-muted-foreground">シフト名</p>
                        <p className="font-semibold text-lg">{shift.shift_name}</p>
                      </div>

                      <div>
                        <p className="text-sm text-muted-foreground">開始時刻</p>
                        <p className="font-medium">{shift.start_time}</p>
                      </div>

                      <div>
                        <p className="text-sm text-muted-foreground">終了時刻</p>
                        <p className="font-medium">{shift.end_time}</p>
                      </div>

                      <div>
                        <p className="text-sm text-muted-foreground">休憩時間</p>
                        <p className="font-medium">{shift.break_minutes}分</p>
                      </div>

                      <div>
                        <p className="text-sm text-muted-foreground">実働時間</p>
                        <p className="font-medium text-blue-600">
                          {calculateWorkHours(shift.start_time, shift.end_time, shift.break_minutes)}
                        </p>
                      </div>
                    </div>

                    {editingIndex === null && !isAdding && (
                      <div className="flex items-center gap-2 ml-4">
                        <button
                          onClick={() => handleEdit(index)}
                          className="p-2 border rounded-lg hover:bg-accent transition-colors"
                          title="編集"
                        >
                          <PencilIcon className="h-5 w-5" />
                        </button>
                        <button
                          onClick={() => handleDelete(index)}
                          className="p-2 border border-red-200 text-red-600 rounded-lg hover:bg-red-50 transition-colors"
                          title="削除"
                        >
                          <TrashIcon className="h-5 w-5" />
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Help Text */}
      <div className="text-sm text-muted-foreground bg-gray-50 dark:bg-gray-900/20 rounded-lg p-3">
        <p className="font-medium mb-1">💡 ヒント:</p>
        <ul className="list-disc list-inside space-y-1">
          <li>時刻は24時間形式で入力してください (例: 08:00, 17:00)</li>
          <li>夜勤シフトの場合、終了時刻が開始時刻より前でも自動計算されます</li>
          <li>休憩時間は実働時間から自動的に差し引かれます</li>
        </ul>
      </div>
    </div>
  );
}
