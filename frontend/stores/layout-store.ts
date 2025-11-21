'use client';

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

interface LayoutStoreState {
  // Content width mode: 'auto' | 'full' | 'compact'
  contentWidth: 'auto' | 'full' | 'compact';
  
  // Padding multiplier (1 = normal, 2 = double, etc)
  paddingMultiplier: number;

  // Actions
  setContentWidth: (width: 'auto' | 'full' | 'compact') => void;
  setPaddingMultiplier: (multiplier: number) => void;
  reset: () => void;
}

export const useLayoutStore = create<LayoutStoreState>()(
  persist(
    (set) => ({
      // Default values
      contentWidth: 'auto',
      paddingMultiplier: 1,

      // Actions
      setContentWidth: (width) => {
        set({ contentWidth: width });
      },

      setPaddingMultiplier: (multiplier) => {
        set({ paddingMultiplier: Math.max(0.5, Math.min(multiplier, 3)) });
      },

      reset: () => {
        set({
          contentWidth: 'auto',
          paddingMultiplier: 1,
        });
      },
    }),
    {
      name: 'uns-layout-store',
      storage: createJSONStorage(() => {
        if (typeof window === 'undefined') {
          return {
            getItem: () => null,
            setItem: () => undefined,
            removeItem: () => undefined,
          };
        }
        return localStorage;
      }),
    }
  )
);
