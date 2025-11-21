import { useState, useEffect, useCallback } from 'react';
import { Theme } from '@/lib/themes';
import { CustomTheme } from '@/lib/custom-themes';

type ThemeLike = Theme | CustomTheme;

/**
 * Hook for managing theme preview state
 * Allows hovering over themes to see live preview without applying permanently
 */
export function useThemePreview() {
  const [previewTheme, setPreviewTheme] = useState<ThemeLike | null>(null);
  const [isPreviewActive, setIsPreviewActive] = useState(false);
  const [previewTimeout, setPreviewTimeout] = useState<NodeJS.Timeout | null>(null);

  /**
   * Start preview after a short delay (to avoid flickering on quick hovers)
   */
  const startPreview = useCallback((theme: ThemeLike, delay: number = 300) => {
    // Clear any existing timeout
    if (previewTimeout) {
      clearTimeout(previewTimeout);
    }

    const timeout = setTimeout(() => {
      setPreviewTheme(theme);
      setIsPreviewActive(true);
      applyPreviewTheme(theme);
    }, delay);

    setPreviewTimeout(timeout);
  }, [previewTimeout]);

  /**
   * Cancel preview and restore original theme
   */
  const cancelPreview = useCallback(() => {
    if (previewTimeout) {
      clearTimeout(previewTimeout);
      setPreviewTimeout(null);
    }

    if (isPreviewActive) {
      setIsPreviewActive(false);
      setPreviewTheme(null);
      restoreOriginalTheme();
    }
  }, [previewTimeout, isPreviewActive]);

  /**
   * Apply preview theme to document temporarily
   */
  const applyPreviewTheme = (theme: ThemeLike) => {
    const root = document.documentElement;

    // Store original values
    const originalValues: Record<string, string> = {};
    Object.keys(theme.colors).forEach((key) => {
      originalValues[key] = root.style.getPropertyValue(key);
    });

    // Store in session storage for restoration
    sessionStorage.setItem('theme-preview-original', JSON.stringify(originalValues));

    // Apply preview theme
    Object.entries(theme.colors).forEach(([key, value]) => {
      root.style.setProperty(key, value as string);
    });

    // Add preview indicator class
    root.setAttribute('data-theme-preview', 'true');
  };

  /**
   * Restore original theme from session storage
   */
  const restoreOriginalTheme = () => {
    const root = document.documentElement;

    try {
      const stored = sessionStorage.getItem('theme-preview-original');
      if (stored) {
        const originalValues = JSON.parse(stored);
        Object.entries(originalValues).forEach(([key, value]) => {
          if (value) {
            root.style.setProperty(key, value as string);
          }
        });
        sessionStorage.removeItem('theme-preview-original');
      }
    } catch (error) {
      console.warn('Error restoring theme:', error);
    }

    // Remove preview indicator
    root.removeAttribute('data-theme-preview');
  };

  /**
   * Cleanup on unmount
   */
  useEffect(() => {
    return () => {
      if (previewTimeout) {
        clearTimeout(previewTimeout);
      }
      if (isPreviewActive) {
        restoreOriginalTheme();
      }
    };
  }, [previewTimeout, isPreviewActive]);

  return {
    previewTheme,
    isPreviewActive,
    startPreview,
    cancelPreview,
  };
}
