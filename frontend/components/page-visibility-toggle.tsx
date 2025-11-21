'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Eye, EyeOff, Loader2 } from 'lucide-react';
import { Switch } from '@/components/ui/switch';
import { useAuthStore } from '@/stores/auth-store';
import { usePageVisibility } from '@/lib/hooks/use-page-visibility';

interface PageVisibilityToggleProps {
  pageKey: string;
  pageName?: string;
}

export function PageVisibilityToggle({
  pageKey,
  pageName = 'Page',
}: PageVisibilityToggleProps) {
  const { user } = useAuthStore();
  const { getPageStatus, togglePageVisibility } = usePageVisibility();
  const [isUpdating, setIsUpdating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const pageStatus = getPageStatus(pageKey);
  const isAdmin = user?.role === 'ADMIN' || user?.role === 'SUPER_ADMIN';
  const isEnabled = pageStatus?.is_enabled ?? true;

  const handleToggle = async (checked: boolean) => {
    if (!isAdmin) return;

    setIsUpdating(true);
    setError(null);

    try {
      await togglePageVisibility(pageKey, checked);
    } catch (err: any) {
      setError(err.message);
      console.error('Error toggling page:', err);
    } finally {
      setIsUpdating(false);
    }
  };

  if (!isAdmin) {
    return null;
  }

  return (
    <motion.div
      className="flex items-center gap-3 px-4 py-3 rounded-lg bg-secondary/50 border border-border hover:bg-secondary/70 transition-colors"
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <div className="flex items-center gap-2 flex-1">
        {isEnabled ? (
          <Eye className="h-4 w-4 text-green-600" />
        ) : (
          <EyeOff className="h-4 w-4 text-red-600" />
        )}
        <div className="flex-1">
          <p className="text-xs font-semibold text-foreground">
            {isEnabled ? 'Visible' : 'En construcción'}
          </p>
          <p className="text-[10px] text-muted-foreground">
            {pageName} {isEnabled ? 'está activa' : 'está deshabilitada'}
          </p>
        </div>
      </div>

      <div className="flex items-center gap-2">
        {isUpdating && (
          <Loader2 className="h-4 w-4 animate-spin text-blue-500" />
        )}
        <Switch
          checked={isEnabled}
          onCheckedChange={handleToggle}
          disabled={isUpdating}
          className="data-[state=checked]:bg-green-600"
        />
      </div>

      {error && (
        <p className="text-[10px] text-red-500 mt-1">
          Error: {error}
        </p>
      )}
    </motion.div>
  );
}
