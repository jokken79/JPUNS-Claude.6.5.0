'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function NewCandidatePage() {
  const router = useRouter();

  useEffect(() => {
    // Redirect to the new rirekisho form
    router.replace('/candidates/rirekisho');
  }, [router]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-muted/20 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-5xl mx-auto text-center">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground mb-2">
            新規候補者登録
          </h1>
          <p className="text-muted-foreground">
            履歴書フォームにリダイレクトしています...
          </p>
        </div>
      </div>
    </div>
  );
}
