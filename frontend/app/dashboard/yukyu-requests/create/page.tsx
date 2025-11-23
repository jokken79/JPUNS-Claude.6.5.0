'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Calendar, Users, Building2, FileText, AlertCircle, CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useAuthStore } from '@/stores/auth-store';
import { canCreateYukyuRequest } from '@/lib/yukyu-roles';
import { ErrorState } from '@/components/error-state';

interface Employee {
  id: number;
  rirekisho_id: string;
  full_name_kanji: string;
  full_name_kana: string | null;
  factory_id: string;
  factory_name: string | null;
  hire_date: string;
  yukyu_available: number;
}

interface Factory {
  id: string;
  name: string;
}

export default function CreateYukyuRequestPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { user } = useAuthStore();

  // Role validation: Only TANTOSHA (HR) and ADMIN can create yukyu requests
  // 有給休暇申請の作成は担当者以上のユーザーのみ
  if (!canCreateYukyuRequest(user?.role)) {
    return (
      <ErrorState
        type="forbidden"
        title="アクセス拒否 (Access Denied)"
        message="有給休暇申請の作成は担当者以上のユーザーのみが利用できます。"
        showRetry={false}
        showGoBack={true}
      />
    );
  }

  // Form state
  const [selectedFactoryId, setSelectedFactoryId] = useState<string>('');
  const [selectedEmployeeId, setSelectedEmployeeId] = useState<string>('');
  const [requestType, setRequestType] = useState<string>('yukyu');
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');
  const [daysRequested, setDaysRequested] = useState<string>('1.0');
  const [notes, setNotes] = useState<string>('');
  const [error, setError] = useState<string>('');
  const [success, setSuccess] = useState<string>('');

  // Fetch factories
  const { data: factories } = useQuery<Factory[]>({
    queryKey: ['factories'],
    queryFn: async () => {
      const res = await fetch('/api/factories', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('access_token')}`
        }
      });
      if (!res.ok) throw new Error('Failed to fetch factories');
      return res.json();
    }
  });

  // Fetch employees by factory
  const { data: employees, isLoading: employeesLoading } = useQuery<Employee[]>({
    queryKey: ['employees-by-factory', selectedFactoryId],
    queryFn: async () => {
      if (!selectedFactoryId) return [];
      const res = await fetch(`/api/yukyu/employees/by-factory/${selectedFactoryId}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('access_token')}`
        }
      });
      if (!res.ok) throw new Error('Failed to fetch employees');
      return res.json();
    },
    enabled: !!selectedFactoryId
  });

  // Create request mutation
  const createRequest = useMutation({
    mutationFn: async (requestData: any) => {
      const res = await fetch('/api/yukyu/requests/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('access_token')}`
        },
        body: JSON.stringify(requestData)
      });
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.detail || 'Failed to create request');
      }
      return res.json();
    },
    onSuccess: () => {
      setSuccess('✅ 有給休暇申請が作成されました！');
      queryClient.invalidateQueries({ queryKey: ['yukyu-requests'] });

      // Reset form
      setTimeout(() => {
        setSelectedEmployeeId('');
        setStartDate('');
        setEndDate('');
        setDaysRequested('1.0');
        setNotes('');
        setError('');
        setSuccess('');
      }, 3000);
    },
    onError: (error: Error) => {
      setError(error.message);
    }
  });

  // Get selected employee
  const selectedEmployee = employees?.find(e => e.id === parseInt(selectedEmployeeId));

  // Handle submit
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!selectedEmployeeId || !startDate || !endDate) {
      setError('全ての必須項目を入力してください。');
      return;
    }

    const days = parseFloat(daysRequested);
    if (selectedEmployee && days > selectedEmployee.yukyu_available) {
      setError(`利用可能日数を超えています！ 利用可能: ${selectedEmployee.yukyu_available}日`);
      return;
    }

    createRequest.mutate({
      employee_id: parseInt(selectedEmployeeId),
      factory_id: selectedFactoryId,
      request_type: requestType,
      start_date: startDate,
      end_date: endDate,
      days_requested: days,
      notes: notes || undefined
    });
  };

  return (
    <div className="container mx-auto p-6 max-w-4xl">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
          有給休暇申請作成
        </h1>
        <p className="text-gray-600 dark:text-gray-400">
          従業員の有給休暇を申請します（担当者用）
        </p>
      </div>

      {/* Success Alert */}
      {success && (
        <Alert className="mb-6 bg-green-50 border-green-200 dark:bg-green-900/20 dark:border-green-800">
          <CheckCircle className="h-4 w-4 text-green-600 dark:text-green-400" />
          <AlertDescription className="text-green-800 dark:text-green-200">
            {success}
          </AlertDescription>
        </Alert>
      )}

      {/* Error Alert */}
      {error && (
        <Alert variant="destructive" className="mb-6">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <form onSubmit={handleSubmit}>
        <div className="space-y-6">
          {/* Factory Selection */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Building2 className="h-5 w-5" />
                派遣先選択
              </CardTitle>
              <CardDescription>申請する従業員の派遣先を選択してください</CardDescription>
            </CardHeader>
            <CardContent>
              <Select value={selectedFactoryId} onValueChange={setSelectedFactoryId}>
                <SelectTrigger>
                  <SelectValue placeholder="派遣先を選択..." />
                </SelectTrigger>
                <SelectContent>
                  {factories?.map((factory) => (
                    <SelectItem key={factory.id} value={factory.id}>
                      {factory.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </CardContent>
          </Card>

          {/* Employee Selection */}
          {selectedFactoryId && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5" />
                  従業員選択
                </CardTitle>
                <CardDescription>
                  {employeesLoading ? '読み込み中...' : `${employees?.length || 0} 名の従業員`}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Select value={selectedEmployeeId} onValueChange={setSelectedEmployeeId}>
                  <SelectTrigger>
                    <SelectValue placeholder="従業員を選択..." />
                  </SelectTrigger>
                  <SelectContent>
                    {employees?.map((employee) => (
                      <SelectItem key={employee.id} value={employee.id.toString()}>
                        <div className="flex justify-between items-center w-full">
                          <span>{employee.full_name_kanji}</span>
                          <span className="ml-4 text-sm text-gray-500">
                            残: {employee.yukyu_available}日
                          </span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                {/* Employee Details */}
                {selectedEmployee && (
                  <div className="mt-4 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
                    <h4 className="font-semibold text-blue-900 dark:text-blue-100 mb-2">
                      従業員情報
                    </h4>
                    <div className="grid grid-cols-2 gap-2 text-sm">
                      <div>
                        <span className="text-gray-600 dark:text-gray-400">氏名:</span>
                        <span className="ml-2 font-medium">{selectedEmployee.full_name_kanji}</span>
                      </div>
                      <div>
                        <span className="text-gray-600 dark:text-gray-400">履歴書ID:</span>
                        <span className="ml-2 font-medium">{selectedEmployee.rirekisho_id}</span>
                      </div>
                      <div>
                        <span className="text-gray-600 dark:text-gray-400">入社日:</span>
                        <span className="ml-2 font-medium">{selectedEmployee.hire_date}</span>
                      </div>
                      <div>
                        <span className="text-gray-600 dark:text-gray-400">利用可能日数:</span>
                        <span className="ml-2 font-bold text-green-600 dark:text-green-400">
                          {selectedEmployee.yukyu_available} 日
                        </span>
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Request Details */}
          {selectedEmployeeId && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="h-5 w-5" />
                  申請内容
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Request Type */}
                <div>
                  <Label htmlFor="requestType">申請種類 *</Label>
                  <Select value={requestType} onValueChange={setRequestType}>
                    <SelectTrigger id="requestType">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="yukyu">有給休暇（全日）</SelectItem>
                      <SelectItem value="hankyu">半休（半日）</SelectItem>
                      <SelectItem value="ikkikokoku">一時帰国</SelectItem>
                      <SelectItem value="taisha">退社</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Dates */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="startDate">開始日 *</Label>
                    <Input
                      id="startDate"
                      type="date"
                      value={startDate}
                      onChange={(e) => {
                        setStartDate(e.target.value);
                        if (!endDate) setEndDate(e.target.value);
                      }}
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="endDate">終了日 *</Label>
                    <Input
                      id="endDate"
                      type="date"
                      value={endDate}
                      onChange={(e) => setEndDate(e.target.value)}
                      min={startDate}
                      required
                    />
                  </div>
                </div>

                {/* Days Requested */}
                <div>
                  <Label htmlFor="daysRequested">申請日数 *</Label>
                  <Select value={daysRequested} onValueChange={setDaysRequested}>
                    <SelectTrigger id="daysRequested">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="0.5">0.5日（半休）</SelectItem>
                      <SelectItem value="1.0">1.0日</SelectItem>
                      <SelectItem value="2.0">2.0日</SelectItem>
                      <SelectItem value="3.0">3.0日</SelectItem>
                      <SelectItem value="4.0">4.0日</SelectItem>
                      <SelectItem value="5.0">5.0日</SelectItem>
                    </SelectContent>
                  </Select>
                  <p className="text-sm text-gray-500 mt-1">
                    利用可能: {selectedEmployee.yukyu_available} 日
                  </p>
                </div>

                {/* Notes */}
                <div>
                  <Label htmlFor="notes">備考</Label>
                  <Textarea
                    id="notes"
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="備考があれば入力してください..."
                    rows={3}
                  />
                </div>
              </CardContent>
            </Card>
          )}

          {/* Submit Buttons */}
          {selectedEmployeeId && (
            <div className="flex gap-4 justify-end">
              <Button
                type="button"
                variant="outline"
                onClick={() => router.back()}
              >
                キャンセル
              </Button>
              <Button
                type="submit"
                disabled={createRequest.isPending}
                className="bg-blue-600 hover:bg-blue-700"
              >
                <FileText className="mr-2 h-4 w-4" />
                {createRequest.isPending ? '申請中...' : '申請を作成'}
              </Button>
            </div>
          )}
        </div>
      </form>
    </div>
  );
}
