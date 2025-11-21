'use client';

import { useState } from 'react';
import { ThumbsUp, ThumbsDown, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';

type InterviewResult = 'passed' | 'failed' | 'pending';

interface CandidateEvaluatorProps {
  candidateId: number;
  candidateName: string;
  currentInterviewResult?: InterviewResult;
  onSuccess?: () => void;
}

export function CandidateEvaluator({
  candidateId,
  candidateName,
  currentInterviewResult = 'pending',
  onSuccess
}: CandidateEvaluatorProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [notes, setNotes] = useState('');
  const [interviewResult, setInterviewResult] = useState<InterviewResult>(currentInterviewResult);
  const [selectedAction, setSelectedAction] = useState<'approve' | 'reject' | null>(null);

  const handleEvaluation = async (approved: boolean) => {
    // Interview result is now REQUIRED
    if (interviewResult === 'pending') {
      alert('面接結果を選択してください (Please select interview result)');
      return;
    }

    try {
      setIsLoading(true);

      await fetch(`/candidates/${candidateId}/evaluate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          interview_result: interviewResult,
          approved,
          notes: notes.trim() || null
        })
      });

      const action = approved ? '承認しました' : 'ペンディング状態に変更しました';
      alert(`${candidateName}を${action}`);

      setNotes('');
      setSelectedAction(null);

      if (onSuccess) {
        onSuccess();
      }
    } catch (error) {
      console.error('Evaluation error:', error);
      alert('評価の保存に失敗しました');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-4 border rounded-lg p-4 bg-card">
      <h3 className="font-semibold text-sm">クイック評価 (Quick Evaluation)</h3>

      {/* Interview Result Section (Required) */}
      <div className="space-y-2">
        <label className="text-sm font-medium">面接結果 (Interview Result) *</label>
        <p className="text-xs text-muted-foreground">必須: 面接が合格か不合格かを選択してください</p>

        <div className="flex gap-2">
          <Button
            variant={interviewResult === 'passed' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setInterviewResult('passed')}
            disabled={isLoading}
            className="flex-1 gap-2"
          >
            <ThumbsUp className="w-4 h-4 text-green-600" />
            合格 (Passed)
          </Button>

          <Button
            variant={interviewResult === 'failed' ? 'destructive' : 'outline'}
            size="sm"
            onClick={() => setInterviewResult('failed')}
            disabled={isLoading}
            className="flex-1 gap-2"
          >
            <ThumbsDown className="w-4 h-4 text-red-600" />
            不合格 (Failed)
          </Button>
        </div>
      </div>

      <hr className="my-4" />

      {/* Notes textarea */}
      <Textarea
        placeholder="評価コメント（オプション）... (Optional evaluation notes)"
        value={notes}
        onChange={(e) => setNotes(e.target.value)}
        className="min-h-24 text-sm"
        disabled={isLoading}
      />

      {/* Approval Action buttons */}
      <div className="space-y-2">
        <label className="text-sm font-medium">次のステップ (Next Step)</label>
        <div className="flex gap-2">
          <Button
            variant={selectedAction === 'approve' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setSelectedAction(selectedAction === 'approve' ? null : 'approve')}
            disabled={isLoading || interviewResult === 'pending'}
            className="flex-1 gap-2"
            title={interviewResult === 'pending' ? '面接結果を選択してください' : ''}
          >
            <ThumbsUp className="w-4 h-4" />
            承認 (Approve)
          </Button>

          <Button
            variant={selectedAction === 'reject' ? 'destructive' : 'outline'}
            size="sm"
            onClick={() => setSelectedAction(selectedAction === 'reject' ? null : 'reject')}
            disabled={isLoading || interviewResult === 'pending'}
            className="flex-1 gap-2"
            title={interviewResult === 'pending' ? '面接結果を選択してください' : ''}
          >
            <ThumbsDown className="w-4 h-4" />
            ペンディング (Pending)
          </Button>
        </div>
      </div>

      {/* Confirm button */}
      {selectedAction && (
        <Button
          className="w-full gap-2"
          onClick={() => handleEvaluation(selectedAction === 'approve')}
          disabled={isLoading || interviewResult === 'pending'}
        >
          {isLoading && <Loader2 className="w-4 h-4 animate-spin" />}
          {isLoading ? '保存中...' : 'Save Evaluation'}
        </Button>
      )}
    </div>
  );
}
