'use client'

import { useRef, useLayoutEffect } from 'react'

export type ColorIntensity = 'PROFESSIONAL' | 'BOLD'
export type AnimationSpeed = 'SMOOTH' | 'DYNAMIC'

export interface DesignPreferences {
  colorIntensity: ColorIntensity
  animationSpeed: AnimationSpeed
}

interface UseDesignPreferencesReturn {
  preferences: React.MutableRefObject<DesignPreferences>
  updatePreference: (key: keyof DesignPreferences, value: string) => void
  getPreference: (key: keyof DesignPreferences) => string
  getCSSVariable: (name: string) => string
}

const STORAGE_KEY = 'design-preferences'

const DEFAULT_PREFERENCES: DesignPreferences = {
  colorIntensity: 'PROFESSIONAL',
  animationSpeed: 'SMOOTH',
}

const COLOR_INTENSITY_MAP: Record<ColorIntensity, number> = {
  PROFESSIONAL: 0.9,
  BOLD: 1.3,
}

const ANIMATION_SPEED_MAP: Record<AnimationSpeed, number> = {
  SMOOTH: 1,
  DYNAMIC: 0.7,
}

/**
 * Hook optimized for design preferences without React re-renders
 *
 * Features:
 * - Uses useRef instead of useState (zero re-renders on preference changes)
 * - Applies CSS variables directly to DOM
 * - Persists to localStorage automatically
 * - Detects prefers-reduced-motion automatically
 *
 * Usage:
 * ```
 * const { preferences, updatePreference, getCSSVariable } = useDesignPreferences()
 * updatePreference('colorIntensity', 'BOLD')
 * ```
 */
export function useDesignPreferences(): UseDesignPreferencesReturn {
  const preferencesRef = useRef<DesignPreferences>(DEFAULT_PREFERENCES)

  // Initialize preferences from localStorage and apply CSS variables
  useLayoutEffect(() => {
    // Load from localStorage
    const stored = localStorage.getItem(STORAGE_KEY)
    if (stored) {
      try {
        const parsed = JSON.parse(stored)
        preferencesRef.current = { ...DEFAULT_PREFERENCES, ...parsed }
      } catch (error) {
        console.error('Failed to parse design preferences:', error)
        preferencesRef.current = DEFAULT_PREFERENCES
      }
    } else {
      preferencesRef.current = DEFAULT_PREFERENCES
    }

    // Check for prefers-reduced-motion
    const prefersReducedMotion = window.matchMedia(
      '(prefers-reduced-motion: reduce)'
    ).matches

    // Apply CSS variables to document root
    applyPreferencesToDOM(preferencesRef.current, prefersReducedMotion)
  }, [])

  const updatePreference = (key: keyof DesignPreferences, value: string) => {
    // Update ref (no component re-render triggered)
    preferencesRef.current[key] = value as any

    // Persist to localStorage
    localStorage.setItem(STORAGE_KEY, JSON.stringify(preferencesRef.current))

    // Check for prefers-reduced-motion
    const prefersReducedMotion = window.matchMedia(
      '(prefers-reduced-motion: reduce)'
    ).matches

    // Apply CSS variables immediately without component re-render
    applyPreferencesToDOM(preferencesRef.current, prefersReducedMotion)

    // Dispatch custom event for other components that might listen
    window.dispatchEvent(
      new CustomEvent('designPreferencesChanged', {
        detail: preferencesRef.current,
      })
    )
  }

  const getPreference = (key: keyof DesignPreferences): string => {
    return preferencesRef.current[key]
  }

  const getCSSVariable = (name: string): string => {
    if (typeof window === 'undefined') return ''
    return getComputedStyle(document.documentElement)
      .getPropertyValue(name)
      .trim()
  }

  return {
    preferences: preferencesRef,
    updatePreference,
    getPreference,
    getCSSVariable,
  }
}

/**
 * Helper function to apply preferences to DOM
 */
function applyPreferencesToDOM(
  preferences: DesignPreferences,
  prefersReducedMotion: boolean
) {
  const root = document.documentElement
  const colorIntensityValue = COLOR_INTENSITY_MAP[preferences.colorIntensity]
  const animationSpeedValue = prefersReducedMotion
    ? 0
    : ANIMATION_SPEED_MAP[preferences.animationSpeed]

  root.style.setProperty('--color-intensity', colorIntensityValue.toString())
  root.style.setProperty(
    '--animation-speed-multiplier',
    animationSpeedValue.toString()
  )

  // Set animation opacity based on prefers-reduced-motion
  root.style.setProperty(
    '--animation-opacity-disabled',
    prefersReducedMotion ? '0' : '1'
  )

  if (process.env.NODE_ENV === 'development') {
    console.log(
      `🎨 Design preferences applied:`,
      preferences,
      `| Reduced motion: ${prefersReducedMotion}`
    )
  }
}
