'use client';

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

// Types
export type FontType = 'body' | 'heading' | 'ui' | 'japanese';
export type FontVariant = string;

// Font collections for each category
const BODY_FONTS = [
  'system-ui',
  'Inter',
  'Roboto',
  'Open Sans',
  'Lato',
  'Manrope',
  'Source Sans Pro',
  'Nunito',
] as const;

const HEADING_FONTS = [
  'Poppins',
  'Montserrat',
  'Raleway',
  'Playfair Display',
  'Bebas Neue',
  'Oswald',
  'Merriweather',
  'PT Serif',
] as const;

const UI_FONTS = [
  'JetBrains Mono',
  'Monaco',
  'Consolas',
  'Courier New',
  'Fira Code',
  'Source Code Pro',
  'Roboto Mono',
  'monospace',
] as const;

const JAPANESE_FONTS = [
  'Noto Sans JP',
  'Hiragino Sans',
  'Hiragino Kaku Gothic ProN',
  'Yu Gothic',
  'Meiryo',
  'MS Gothic',
  'Noto Serif JP',
  'YuMincho',
] as const;

// Font display names mapping for better UX
const FONT_DISPLAY_NAMES: Record<string, string> = {
  'system-ui': 'System UI',
  'Inter': 'Inter',
  'Roboto': 'Roboto',
  'Open Sans': 'Open Sans',
  'Lato': 'Lato',
  'Manrope': 'Manrope',
  'Source Sans Pro': 'Source Sans Pro',
  'Nunito': 'Nunito',
  'Poppins': 'Poppins',
  'Montserrat': 'Montserrat',
  'Raleway': 'Raleway',
  'Playfair Display': 'Playfair Display',
  'Bebas Neue': 'Bebas Neue',
  'Oswald': 'Oswald',
  'Merriweather': 'Merriweather',
  'PT Serif': 'PT Serif',
  'JetBrains Mono': 'JetBrains Mono',
  'Monaco': 'Monaco',
  'Consolas': 'Consolas',
  'Courier New': 'Courier New',
  'Fira Code': 'Fira Code',
  'Source Code Pro': 'Source Code Pro',
  'Roboto Mono': 'Roboto Mono',
  'monospace': 'Monospace',
  'Noto Sans JP': 'Noto Sans JP (ゴシック)',
  'Hiragino Sans': 'Hiragino Sans (ヒラギノ角ゴ)',
  'Hiragino Kaku Gothic ProN': 'Hiragino Kaku Gothic ProN',
  'Yu Gothic': 'Yu Gothic (游ゴシック)',
  'Meiryo': 'Meiryo (メイリオ)',
  'MS Gothic': 'MS Gothic (MSゴシック)',
  'Noto Serif JP': 'Noto Serif JP (明朝)',
  'YuMincho': 'YuMincho (游明朝)',
};

/**
 * Get available fonts for a specific category
 * @param category - The font type category
 * @returns Array of font names available for that category
 */
export function getAvailableFonts(category: FontType): string[] {
  switch (category) {
    case 'body':
      return [...BODY_FONTS];
    case 'heading':
      return [...HEADING_FONTS];
    case 'ui':
      return [...UI_FONTS];
    case 'japanese':
      return [...JAPANESE_FONTS];
    default:
      return [];
  }
}

/**
 * Get user-friendly display name for a font
 * @param font - The font family name
 * @returns Display name with localization (e.g., Japanese font names)
 */
export function getFontDisplayName(font: string): string {
  return FONT_DISPLAY_NAMES[font] || font;
}

// Store interface
interface FontsStoreState {
  // Font selections
  fontBody: FontVariant;
  fontHeading: FontVariant;
  fontUI: FontVariant;
  fontJapanese: FontVariant;

  // Font size settings
  baseFontSize: number;
  headingScale: number;

  // Actions
  setFontBody: (font: FontVariant) => void;
  setFontHeading: (font: FontVariant) => void;
  setFontUI: (font: FontVariant) => void;
  setFontJapanese: (font: FontVariant) => void;
  setBaseFontSize: (size: number) => void;
  setHeadingScale: (scale: number) => void;
  applyFonts: () => void;
  reset: () => void;
}

// Default values
const DEFAULT_VALUES = {
  fontBody: 'Manrope',
  fontHeading: 'Poppins',
  fontUI: 'JetBrains Mono',
  fontJapanese: 'Noto Sans JP',
  baseFontSize: 16,
  headingScale: 1.2,
};

/**
 * Zustand store for managing font settings across the application
 * Persists to localStorage and automatically applies fonts to DOM
 */
export const useFontsStore = create<FontsStoreState>()(
  persist(
    (set, get) => ({
      // Default values
      ...DEFAULT_VALUES,

      // Actions
      setFontBody: (font) => {
        set({ fontBody: font });
        // Apply immediately after state update
        setTimeout(() => get().applyFonts(), 0);
      },

      setFontHeading: (font) => {
        set({ fontHeading: font });
        setTimeout(() => get().applyFonts(), 0);
      },

      setFontUI: (font) => {
        set({ fontUI: font });
        setTimeout(() => get().applyFonts(), 0);
      },

      setFontJapanese: (font) => {
        set({ fontJapanese: font });
        setTimeout(() => get().applyFonts(), 0);
      },

      setBaseFontSize: (size) => {
        set({ baseFontSize: Math.max(12, Math.min(size, 24)) });
        setTimeout(() => get().applyFonts(), 0);
      },

      setHeadingScale: (scale) => {
        set({ headingScale: Math.max(0.8, Math.min(scale, 1.5)) });
        setTimeout(() => get().applyFonts(), 0);
      },

      /**
       * Apply current font settings to the DOM
       * Creates CSS custom properties and dynamic styles
       */
      applyFonts: () => {
        if (typeof window === 'undefined') return;

        const state = get();
        const root = document.documentElement;

        // Apply font families as CSS custom properties
        root.style.setProperty('--font-body', `"${state.fontBody}", system-ui, sans-serif`);
        root.style.setProperty('--font-heading', `"${state.fontHeading}", system-ui, sans-serif`);
        root.style.setProperty('--font-ui', `"${state.fontUI}", monospace`);
        root.style.setProperty('--font-japanese', `"${state.fontJapanese}", sans-serif`);

        // Apply font sizes
        root.style.setProperty('--font-size-base', `${state.baseFontSize}px`);

        // Apply heading scale (h1 through h6)
        const scale = state.headingScale;
        root.style.setProperty('--font-size-h1', `${state.baseFontSize * Math.pow(scale, 4)}px`);
        root.style.setProperty('--font-size-h2', `${state.baseFontSize * Math.pow(scale, 3)}px`);
        root.style.setProperty('--font-size-h3', `${state.baseFontSize * Math.pow(scale, 2)}px`);
        root.style.setProperty('--font-size-h4', `${state.baseFontSize * Math.pow(scale, 1)}px`);
        root.style.setProperty('--font-size-h5', `${state.baseFontSize}px`);
        root.style.setProperty('--font-size-h6', `${state.baseFontSize * 0.875}px`);

        // Apply to specific Tailwind classes and HTML elements
        // This allows using font-sans, font-heading, font-japanese in components
        const style = document.getElementById('fonts-dynamic-styles') || document.createElement('style');
        style.id = 'fonts-dynamic-styles';
        style.textContent = `
          :root {
            font-size: ${state.baseFontSize}px;
          }

          body {
            font-family: var(--font-body);
          }

          .font-sans {
            font-family: var(--font-body);
          }

          .font-heading {
            font-family: var(--font-heading);
          }

          .font-ui {
            font-family: var(--font-ui);
          }

          .font-japanese {
            font-family: var(--font-japanese);
          }

          h1 {
            font-family: var(--font-heading);
            font-size: var(--font-size-h1);
          }

          h2 {
            font-family: var(--font-heading);
            font-size: var(--font-size-h2);
          }

          h3 {
            font-family: var(--font-heading);
            font-size: var(--font-size-h3);
          }

          h4 {
            font-family: var(--font-heading);
            font-size: var(--font-size-h4);
          }

          h5 {
            font-family: var(--font-heading);
            font-size: var(--font-size-h5);
          }

          h6 {
            font-family: var(--font-heading);
            font-size: var(--font-size-h6);
          }
        `;

        if (!document.head.contains(style)) {
          document.head.appendChild(style);
        }
      },

      /**
       * Reset all font settings to defaults
       */
      reset: () => {
        set(DEFAULT_VALUES);
        setTimeout(() => get().applyFonts(), 0);
      },
    }),
    {
      name: 'uns-fonts-store',
      storage: createJSONStorage(() => {
        // SSR-safe storage - returns dummy storage on server
        if (typeof window === 'undefined') {
          return {
            getItem: () => null,
            setItem: () => undefined,
            removeItem: () => undefined,
          };
        }
        return localStorage;
      }),
      // Apply fonts after rehydration from localStorage
      onRehydrateStorage: () => (state) => {
        if (state) {
          setTimeout(() => state.applyFonts(), 0);
        }
      },
    }
  )
);
