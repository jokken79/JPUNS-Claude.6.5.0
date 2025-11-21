'use client'

import React from 'react'
import { Check } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { useDesignPreferences, type ColorIntensity } from '@/hooks/useDesignPreferences'
import { cn } from '@/lib/utils'

interface ColorIntensityOption {
  value: ColorIntensity
  label: string
  description: string
  emoji: string
}

const COLOR_INTENSITY_OPTIONS: ColorIntensityOption[] = [
  {
    value: 'PROFESSIONAL',
    label: 'Professional',
    description: 'Softer, more muted colors - ideal for business applications',
    emoji: '💼',
  },
  {
    value: 'BOLD',
    label: 'Bold',
    description: 'Vibrant, saturated colors - more visually striking and dynamic',
    emoji: '⚡',
  },
]

export function ColorIntensityPicker() {
  const { preferences, updatePreference } = useDesignPreferences()

  const handleSelect = (intensity: ColorIntensity) => {
    updatePreference('colorIntensity', intensity)
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Color Intensity</CardTitle>
        <CardDescription>
          Choose how vibrant or muted you want the colors to be
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Options Grid */}
        <div className="grid grid-cols-2 gap-3">
          {COLOR_INTENSITY_OPTIONS.map((option) => (
            <button
              key={option.value}
              onClick={() => handleSelect(option.value)}
              className={cn(
                'relative p-4 rounded-lg border-2 transition-all duration-200',
                'hover:border-primary/50 hover:bg-muted/50',
                'focus:outline-none focus:ring-2 focus:ring-ring',
                preferences.current.colorIntensity === option.value
                  ? 'border-primary bg-primary/10'
                  : 'border-border'
              )}
            >
              {/* Emoji Icon */}
              <div className="text-3xl mb-2">{option.emoji}</div>

              {/* Label */}
              <div className="text-sm font-semibold text-left">{option.label}</div>

              {/* Selected Indicator */}
              {preferences.current.colorIntensity === option.value && (
                <div className="absolute top-2 right-2 bg-primary text-primary-foreground rounded-full p-1">
                  <Check className="w-4 h-4" />
                </div>
              )}
            </button>
          ))}
        </div>

        {/* Description */}
        <div className="p-3 rounded-lg bg-muted/50 border border-border">
          <p className="text-sm text-foreground">
            {COLOR_INTENSITY_OPTIONS.find((o) => o.value === preferences.current.colorIntensity)?.description}
          </p>
        </div>

        {/* Live Color Swatches */}
        <div className="space-y-2">
          <p className="text-xs font-semibold text-muted-foreground">Live Color Samples</p>
          <div className="flex gap-2">
            <div className="flex-1 h-16 bg-primary rounded-lg border border-border shadow-sm flex items-center justify-center text-primary-foreground text-xs font-semibold">
              Primary
            </div>
            <div className="flex-1 h-16 bg-accent rounded-lg border border-border shadow-sm flex items-center justify-center text-accent-foreground text-xs font-semibold">
              Accent
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
