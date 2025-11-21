'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { candidateService } from '@/lib/api';
import { toast } from 'react-hot-toast';

export default function EditCandidatePage() {
  const router = useRouter();
  const params = useParams();
  const id = params?.id as string;
  const [isRedirecting, setIsRedirecting] = useState(false);

  // Fetch candidate data
  const { data: candidate, isLoading, error } = useQuery({
    queryKey: ['candidate', id],
    queryFn: () => candidateService.getCandidate(id),
    enabled: !!id,
  });

  useEffect(() => {
    if (error) {
      toast.error('候補者データの読み込みに失敗しました');
      router.push('/candidates');
      return;
    }

    if (candidate && !isRedirecting) {
      setIsRedirecting(true);

      // Store candidate data in sessionStorage for the rirekisho form to load
      sessionStorage.setItem('editingCandidateId', id);
      sessionStorage.setItem('editingCandidateData', JSON.stringify(candidate));

      // Also store in localStorage as backup for browser navigation
      localStorage.setItem('editingCandidateDataBackup', JSON.stringify(candidate));
      localStorage.setItem('editingCandidateIdBackup', id);

      // Debug logging
      console.log('✅ [EDIT] Datos del candidato guardados en sessionStorage y localStorage:', candidate);
      console.log('✅ [EDIT] Redirigiendo a rirekisho con ID:', id);

      // Redirect to rirekisho form with edit mode
      router.push(`/candidates/rirekisho?mode=edit&id=${id}`);
    }
  }, [candidate, error, id, router, isRedirecting]);

  if (isLoading || isRedirecting) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background to-muted/20 py-8 px-4 sm:px-6 lg:px-8">
        <div className="max-w-5xl mx-auto text-center">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-foreground mb-2">
              候補者情報編集
            </h1>
            <p className="text-muted-foreground">
              候補者ID: {id}
            </p>
            <div className="mt-8">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
              <p className="text-muted-foreground mt-4">
                候補者データを読み込んでいます...
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return null;
}
