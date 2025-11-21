'use client';

import { useAuthStore } from '@/stores/auth-store';
import { useSettingsStore } from '@/stores/settings-store';
import { UnderConstruction } from './under-construction';

interface VisibilityGuardProps {
  children: React.ReactNode;
}

export function VisibilityGuard({ children }: VisibilityGuardProps) {
  try {
    const { user } = useAuthStore();
    const { underConstructionPages, isPageUnderConstruction } = useSettingsStore();

    const isAffectedRole = user?.role === 'ADMIN' || user?.role === 'KANRINSHA';
    const shouldShowConstruction = isAffectedRole && underConstructionPages.length > 0;

    if (shouldShowConstruction) {
      return <UnderConstruction />;
    }

    return <>{children}</>;
  } catch (error) {
    console.debug('[VisibilityGuard] Store initialization failed:', error);
    return <>{children}</>;
  }
}
