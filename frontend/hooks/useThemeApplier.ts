"use client";

import { useEffect, useRef } from 'react';
import { useTheme } from 'next-themes';
import { themes } from '@/lib/themes';
import { getCustomThemes, type CustomTheme } from '@/lib/custom-themes';

/**
 * Hook to apply theme colors to DOM
 *
 * Automatically applies CSS custom properties when theme changes
 * Persists theme selection in localStorage via next-themes
 * Synchronizes theme changes across browser tabs
 *
 * Usage: Call this hook in root layout or app component
 */
export function useThemeApplier() {
  const { theme, resolvedTheme, setTheme } = useTheme();
  const channelRef = useRef<BroadcastChannel | null>(null);

  useEffect(() => {
    // Skip if not mounted yet
    if (typeof window === 'undefined') return;

    // Get current theme name (use resolvedTheme as fallback)
    let currentThemeName = theme || resolvedTheme;
    if (!currentThemeName) return;

    // Sanitize theme name: convert names with spaces to IDs (e.g., "Forest Green" → "forest-green")
    const allThemes = [...themes, ...getCustomThemes()];
    const themeByName = allThemes.find(t => t.name === currentThemeName);
    if (themeByName && currentThemeName.includes(' ')) {
      // If the theme name has spaces and we found it, use the ID instead
      currentThemeName = themeByName.id;
    }

    // For basic light/dark themes, let Tailwind CSS handle it
    if (currentThemeName === 'light' || currentThemeName === 'dark') {
      const root = document.documentElement;

      // Remove any custom theme colors to let Tailwind defaults work
      const defaultLightTheme = themes.find(t => t.id === 'default-light');
      const defaultDarkTheme = themes.find(t => t.id === 'default-dark');

      const themeColors = currentThemeName === 'dark' ? defaultDarkTheme?.colors : defaultLightTheme?.colors;

      if (themeColors) {
        Object.entries(themeColors).forEach(([key, value]) => {
          const cssVar = key.startsWith('--') ? key : `--${key}`;
          root.style.setProperty(cssVar, value as string);
        });
      }

      // Log theme change in development
      if (process.env.NODE_ENV === 'development') {
        console.log(`🎨 Theme applied: ${currentThemeName}`);
      }
      return;
    }

    // For custom themes, find and apply them
    const predefinedTheme = themes.find(t => t.id === currentThemeName || t.name === currentThemeName);

    // If not found in predefined, check custom themes
    let themeColors = predefinedTheme?.colors;

    if (!themeColors) {
      const customThemes = getCustomThemes();
      const customTheme = customThemes.find(t => t.id === currentThemeName || t.name === currentThemeName);
      themeColors = customTheme?.colors;
    }

    // If still not found, use default-light
    if (!themeColors) {
      const defaultTheme = themes.find(t => t.id === 'default-light');
      themeColors = defaultTheme?.colors;
    }

    // Apply theme colors to DOM
    if (themeColors) {
      const root = document.documentElement;

      Object.entries(themeColors).forEach(([key, value]) => {
        // Add -- prefix if not present
        const cssVar = key.startsWith('--') ? key : `--${key}`;
        root.style.setProperty(cssVar, value as string);
      });

      // Log theme change in development
      if (process.env.NODE_ENV === 'development') {
        console.log(`🎨 Custom theme applied: ${currentThemeName}`);
      }
    }
  }, [theme, resolvedTheme]);

  // Cross-tab synchronization effect
  useEffect(() => {
    if (typeof window === 'undefined') return;

    // Initialize BroadcastChannel for cross-tab communication
    try {
      channelRef.current = new BroadcastChannel('theme-sync');

      // Listen for theme changes from other tabs
      channelRef.current.onmessage = (event) => {
        if (event.data.type === 'theme-change' && event.data.theme) {
          // Apply theme change from another tab
          setTheme(event.data.theme);

          if (process.env.NODE_ENV === 'development') {
            console.log(`🔄 Theme synchronized from another tab: ${event.data.theme}`);
          }
        }
      };
    } catch (error) {
      // BroadcastChannel not supported, fallback to storage events
      console.warn('BroadcastChannel not supported, using storage events for sync');
    }

    // Fallback: Listen for localStorage changes (for browsers without BroadcastChannel)
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'theme' && e.newValue && e.newValue !== theme) {
        setTheme(e.newValue);

        if (process.env.NODE_ENV === 'development') {
          console.log(`🔄 Theme synchronized via storage event: ${e.newValue}`);
        }
      }
    };

    window.addEventListener('storage', handleStorageChange);

    // Cleanup
    return () => {
      if (channelRef.current) {
        channelRef.current.close();
        channelRef.current = null;
      }
      window.removeEventListener('storage', handleStorageChange);
    };
  }, [theme, setTheme]);

  // Broadcast theme changes to other tabs
  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (!theme) return;

    // Broadcast theme change to other tabs
    if (channelRef.current) {
      try {
        channelRef.current.postMessage({
          type: 'theme-change',
          theme: theme,
          timestamp: Date.now(),
        });
      } catch (error) {
        // Silently fail if broadcast fails
        console.error('Failed to broadcast theme change:', error);
      }
    }
  }, [theme]);
}
