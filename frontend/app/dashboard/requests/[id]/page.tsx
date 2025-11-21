/**
 * Request Detail Page - 入社連絡票 (Nyūsha Renrakuhyō)
 *
 * This page handles the New Hire Notification Form workflow:
 * 1. Display candidate data (read-only)
 * 2. Fill in employee-specific data (editable form)
 * 3. Save employee data
 * 4. Approve 入社連絡票 and create employee record
 */

'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { Request, RequestType, RequestStatus, Candidate, EmployeeData } from '@/types/api';
import { RequestTypeBadge, RequestStatusBadge } from '@/components/requests/RequestTypeBadge';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { AlertCircle, CheckCircle, ArrowLeft, Save, Check } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';

export default function RequestDetailPage() {
  const params = useParams();
  const router = useRouter();
  const requestId = params?.id as string;

  const [request, setRequest] = useState<Request | null>(null);
  const [candidate, setCandidate] = useState<Candidate | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [approving, setApproving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Employee data form state
  const [employeeData, setEmployeeData] = useState<EmployeeData>({
    factory_id: '',
    hire_date: new Date().toISOString().split('T')[0],
    jikyu: 1200,
    position: '',
    contract_type: '正社員',
  });

  // Load request and candidate data
  useEffect(() => {
    if (requestId) {
      loadRequestData();
    }
  }, [requestId]);

  const loadRequestData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Load request
      const requestResponse = await fetch(`/api/requests/${requestId}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
      });

      if (!requestResponse.ok) {
        throw new Error('Failed to load request');
      }

      const requestData: Request = await requestResponse.json();
      setRequest(requestData);

      // Load candidate if available
      if (requestData.candidate_id) {
        const candidateResponse = await fetch(`/api/candidates/${requestData.candidate_id}`, {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`,
          },
        });

        if (candidateResponse.ok) {
          const candidateData: Candidate = await candidateResponse.json();
          setCandidate(candidateData);
        }
      }

      // Load existing employee_data if available
      if (requestData.employee_data) {
        setEmployeeData(requestData.employee_data);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveEmployeeData = async () => {
    try {
      setSaving(true);
      setError(null);
      setSuccessMessage(null);

      const response = await fetch(`/api/requests/${requestId}/employee-data`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
        body: JSON.stringify(employeeData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Failed to save employee data');
      }

      setSuccessMessage('従業員データを保存しました (Employee data saved successfully)');
      await loadRequestData(); // Reload to get updated data
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save data');
    } finally {
      setSaving(false);
    }
  };

  const handleApprove = async () => {
    if (!confirm('入社連絡票を承認して従業員を作成しますか？\n\nApprove 入社連絡票 and create employee record?')) {
      return;
    }

    try {
      setApproving(true);
      setError(null);
      setSuccessMessage(null);

      const response = await fetch(`/api/requests/${requestId}/approve-nyuusha`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Failed to approve request');
      }

      const result = await response.json();

      alert(`✅ 入社連絡票が承認されました！\n\n従業員が作成されました:\n- 派遣元ID: ${result.hakenmoto_id}\n- 履歴書ID: ${result.rirekisho_id}`);

      // Redirect to employee page or requests list
      router.push(`/employees/${result.hakenmoto_id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to approve');
    } finally {
      setApproving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="text-lg">読み込み中... (Loading...)</div>
      </div>
    );
  }

  if (!request) {
    return (
      <div className="container mx-auto py-8">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>Request not found</AlertDescription>
        </Alert>
      </div>
    );
  }

  const isNyuushaRequest = request.type === RequestType.NYUUSHA;
  const isPending = request.status === RequestStatus.PENDING;
  const canEdit = isNyuushaRequest && isPending;

  return (
    <div className="container mx-auto py-8 px-4 max-w-6xl">
      {/* Header */}
      <div className="flex items-center gap-4 mb-6">
        <Button variant="outline" size="icon" onClick={() => router.back()}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div className="flex-1">
          <h1 className="text-3xl font-bold">入社連絡票 (New Hire Notification Form)</h1>
          <p className="text-muted-foreground">Request #{requestId}</p>
        </div>
        <div className="flex gap-2">
          <RequestTypeBadge type={request.type} />
          <RequestStatusBadge status={request.status} />
        </div>
      </div>

      {/* Alert Messages */}
      {error && (
        <Alert variant="destructive" className="mb-6">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {successMessage && (
        <Alert className="mb-6 border-green-500 bg-green-50">
          <CheckCircle className="h-4 w-4 text-green-600" />
          <AlertDescription className="text-green-800">{successMessage}</AlertDescription>
        </Alert>
      )}

      {!isNyuushaRequest && (
        <Alert variant="destructive" className="mb-6">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            This page is only for 入社連絡票 (NYUUSHA) requests.
            This is a {request.type} request.
          </AlertDescription>
        </Alert>
      )}

      {/* Candidate Data (Read-Only) */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>候補者情報 (Candidate Information) - 参照のみ</CardTitle>
          <CardDescription>
            This data comes from the approved candidate and cannot be edited here.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {candidate ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <div>
                <Label className="text-muted-foreground">履歴書番号 (Rirekisho ID)</Label>
                <p className="font-mono font-semibold">{candidate.rirekisho_id}</p>
              </div>
              <div>
                <Label className="text-muted-foreground">氏名 (漢字)</Label>
                <p className="font-semibold">{candidate.full_name_kanji || 'N/A'}</p>
              </div>
              <div>
                <Label className="text-muted-foreground">氏名 (ローマ字)</Label>
                <p>{candidate.full_name_roman || 'N/A'}</p>
              </div>
              <div>
                <Label className="text-muted-foreground">生年月日 (Date of Birth)</Label>
                <p>{candidate.date_of_birth || 'N/A'}</p>
              </div>
              <div>
                <Label className="text-muted-foreground">Email</Label>
                <p>{candidate.email || 'N/A'}</p>
              </div>
              <div>
                <Label className="text-muted-foreground">電話番号 (Phone)</Label>
                <p>{candidate.phone || 'N/A'}</p>
              </div>
              <div>
                <Label className="text-muted-foreground">国籍 (Nationality)</Label>
                <p>{candidate.nationality || 'N/A'}</p>
              </div>
              <div>
                <Label className="text-muted-foreground">Status</Label>
                <p className="capitalize">{candidate.status || 'N/A'}</p>
              </div>
            </div>
          ) : (
            <p className="text-muted-foreground">候補者データがありません (No candidate data available)</p>
          )}

          {candidate && (
            <div className="mt-4">
              <Link href={`/candidates/${candidate.id}`}>
                <Button variant="outline" size="sm">
                  候補者詳細を見る (View Candidate Details) →
                </Button>
              </Link>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Employee Data Form (Editable) */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>従業員情報 (Employee Information) - 入力</CardTitle>
          <CardDescription>
            {canEdit
              ? 'Fill in the employee-specific data below. This data will be used to create the employee record after approval.'
              : 'This request has been processed and cannot be edited.'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Factory ID */}
            <div>
              <Label htmlFor="factory_id">派遣先工場 (Factory ID) *</Label>
              <Input
                id="factory_id"
                value={employeeData.factory_id}
                onChange={(e) => setEmployeeData({ ...employeeData, factory_id: e.target.value })}
                disabled={!canEdit}
                placeholder="FAC-001"
                required
              />
            </div>

            {/* Hire Date */}
            <div>
              <Label htmlFor="hire_date">入社日 (Hire Date) *</Label>
              <Input
                id="hire_date"
                type="date"
                value={employeeData.hire_date}
                onChange={(e) => setEmployeeData({ ...employeeData, hire_date: e.target.value })}
                disabled={!canEdit}
                required
              />
            </div>

            {/* Jikyu (Time Wage) */}
            <div>
              <Label htmlFor="jikyu">時給 (Hourly Wage) *</Label>
              <Input
                id="jikyu"
                type="number"
                value={employeeData.jikyu}
                onChange={(e) => setEmployeeData({ ...employeeData, jikyu: Number(e.target.value) })}
                disabled={!canEdit}
                min={800}
                max={5000}
                required
              />
            </div>

            {/* Position */}
            <div>
              <Label htmlFor="position">役職 (Position) *</Label>
              <Input
                id="position"
                value={employeeData.position}
                onChange={(e) => setEmployeeData({ ...employeeData, position: e.target.value })}
                disabled={!canEdit}
                placeholder="製造スタッフ"
                required
              />
            </div>

            {/* Contract Type */}
            <div>
              <Label htmlFor="contract_type">契約形態 (Contract Type) *</Label>
              <Select
                value={employeeData.contract_type}
                onValueChange={(value) => setEmployeeData({ ...employeeData, contract_type: value })}
                disabled={!canEdit}
              >
                <SelectTrigger id="contract_type">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="正社員">正社員 (Regular Employee)</SelectItem>
                  <SelectItem value="契約社員">契約社員 (Contract Employee)</SelectItem>
                  <SelectItem value="パート">パート (Part-time)</SelectItem>
                  <SelectItem value="派遣">派遣 (Temporary)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Hakensaki Shain ID */}
            <div>
              <Label htmlFor="hakensaki_shain_id">派遣先社員ID (Optional)</Label>
              <Input
                id="hakensaki_shain_id"
                value={employeeData.hakensaki_shain_id || ''}
                onChange={(e) => setEmployeeData({ ...employeeData, hakensaki_shain_id: e.target.value })}
                disabled={!canEdit}
                placeholder="EMP-2025-001"
              />
            </div>

            {/* Apartment ID */}
            <div>
              <Label htmlFor="apartment_id">社宅ID (Apartment ID) - Optional</Label>
              <Input
                id="apartment_id"
                value={employeeData.apartment_id || ''}
                onChange={(e) => setEmployeeData({ ...employeeData, apartment_id: e.target.value })}
                disabled={!canEdit}
                placeholder="APT-001"
              />
            </div>

            {/* Bank Name */}
            <div>
              <Label htmlFor="bank_name">銀行名 (Bank Name) - Optional</Label>
              <Input
                id="bank_name"
                value={employeeData.bank_name || ''}
                onChange={(e) => setEmployeeData({ ...employeeData, bank_name: e.target.value })}
                disabled={!canEdit}
                placeholder="三菱UFJ銀行"
              />
            </div>

            {/* Bank Account */}
            <div>
              <Label htmlFor="bank_account">口座番号 (Account Number) - Optional</Label>
              <Input
                id="bank_account"
                value={employeeData.bank_account || ''}
                onChange={(e) => setEmployeeData({ ...employeeData, bank_account: e.target.value })}
                disabled={!canEdit}
                placeholder="1234567890"
              />
            </div>

            {/* Emergency Contact Name */}
            <div>
              <Label htmlFor="emergency_contact_name">緊急連絡先 (Emergency Contact) - Optional</Label>
              <Input
                id="emergency_contact_name"
                value={employeeData.emergency_contact_name || ''}
                onChange={(e) => setEmployeeData({ ...employeeData, emergency_contact_name: e.target.value })}
                disabled={!canEdit}
                placeholder="田中太郎"
              />
            </div>

            {/* Emergency Contact Phone */}
            <div>
              <Label htmlFor="emergency_contact_phone">緊急連絡先電話 (Emergency Phone) - Optional</Label>
              <Input
                id="emergency_contact_phone"
                value={employeeData.emergency_contact_phone || ''}
                onChange={(e) => setEmployeeData({ ...employeeData, emergency_contact_phone: e.target.value })}
                disabled={!canEdit}
                placeholder="090-1234-5678"
              />
            </div>

            {/* Notes (Full Width) */}
            <div className="md:col-span-2">
              <Label htmlFor="notes">備考 (Notes) - Optional</Label>
              <Textarea
                id="notes"
                value={employeeData.notes || ''}
                onChange={(e) => setEmployeeData({ ...employeeData, notes: e.target.value })}
                disabled={!canEdit}
                placeholder="Additional notes..."
                rows={3}
              />
            </div>
          </div>
        </CardContent>

        {canEdit && (
          <CardFooter className="flex justify-between">
            <p className="text-sm text-muted-foreground">* 必須項目 (Required fields)</p>
            <div className="flex gap-2">
              <Button
                onClick={handleSaveEmployeeData}
                disabled={saving}
                variant="outline"
              >
                {saving ? '保存中...' : (
                  <>
                    <Save className="mr-2 h-4 w-4" />
                    保存 (Save)
                  </>
                )}
              </Button>

              <Button
                onClick={handleApprove}
                disabled={approving || !employeeData.factory_id || !employeeData.position}
              >
                {approving ? '承認中...' : (
                  <>
                    <Check className="mr-2 h-4 w-4" />
                    承認して従業員作成 (Approve & Create Employee)
                  </>
                )}
              </Button>
            </div>
          </CardFooter>
        )}
      </Card>

      {/* Request Metadata */}
      <Card>
        <CardHeader>
          <CardTitle>Request Details</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div>
              <Label className="text-muted-foreground">Request ID</Label>
              <p className="font-mono">{request.id}</p>
            </div>
            <div>
              <Label className="text-muted-foreground">Created At</Label>
              <p>{new Date(request.created_at).toLocaleString('ja-JP')}</p>
            </div>
            {request.approved_at && (
              <div>
                <Label className="text-muted-foreground">Approved At</Label>
                <p>{new Date(request.approved_at).toLocaleString('ja-JP')}</p>
              </div>
            )}
            {request.approved_by && (
              <div>
                <Label className="text-muted-foreground">Approved By</Label>
                <p>User #{request.approved_by}</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
