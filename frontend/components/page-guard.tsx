'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { usePageVisibility } from '@/lib/hooks/use-page-visibility';
import { Loader2 } from 'lucide-react';

interface PageGuardProps {
  pageKey: string;
  children: React.ReactNode;
  fallbackPath?: string; // Where to redirect if page is disabled
}

export function PageGuard({
  pageKey,
  children,
  fallbackPath = '/dashboard/construction',
}: PageGuardProps) {
  const router = useRouter();
  const { pages, loading } = usePageVisibility();
  const [isAllowed, setIsAllowed] = useState<boolean | null>(null);

  useEffect(() => {
    if (loading) return;

    const pageStatus = pages.find(p => p.page_key === pageKey);

    // If page is enabled, show content
    if (pageStatus?.is_enabled) {
      setIsAllowed(true);
    } else {
      // If page is disabled, redirect to construction page
      setIsAllowed(false);
      router.replace(fallbackPath);
    }
  }, [pages, loading, pageKey, fallbackPath, router]);

  // Loading state
  if (loading || isAllowed === null) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-sm text-muted-foreground">Verificando acceso...</p>
        </div>
      </div>
    );
  }

  // Show content if allowed
  if (isAllowed) {
    return <>{children}</>;
  }

  // Redirect in progress
  return null;
}
