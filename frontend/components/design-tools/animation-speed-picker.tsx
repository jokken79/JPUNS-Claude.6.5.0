'use client'

import React from 'react'
import { Check } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { useDesignPreferences, type AnimationSpeed } from '@/hooks/useDesignPreferences'
import { cn } from '@/lib/utils'

interface AnimationSpeedOption {
  value: AnimationSpeed
  label: string
  description: string
  emoji: string
}

const ANIMATION_SPEED_OPTIONS: AnimationSpeedOption[] = [
  {
    value: 'SMOOTH',
    label: 'Smooth',
    description: 'Slower, elegant animations - premium feel',
    emoji: '🌊',
  },
  {
    value: 'DYNAMIC',
    label: 'Dynamic',
    description: 'Faster, snappier animations - responsive feel',
    emoji: '⚡',
  },
]

export function AnimationSpeedPicker() {
  const { preferences, updatePreference } = useDesignPreferences()

  const handleSelect = (speed: AnimationSpeed) => {
    updatePreference('animationSpeed', speed)
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Animation Speed</CardTitle>
        <CardDescription>
          Choose how quickly animations should play
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Options Grid */}
        <div className="grid grid-cols-2 gap-3">
          {ANIMATION_SPEED_OPTIONS.map((option) => (
            <button
              key={option.value}
              onClick={() => handleSelect(option.value)}
              className={cn(
                'relative p-4 rounded-lg border-2 transition-all duration-200',
                'hover:border-primary/50 hover:bg-muted/50',
                'focus:outline-none focus:ring-2 focus:ring-ring',
                preferences.current.animationSpeed === option.value
                  ? 'border-primary bg-primary/10'
                  : 'border-border'
              )}
            >
              {/* Emoji Icon */}
              <div className="text-3xl mb-2">{option.emoji}</div>

              {/* Label */}
              <div className="text-sm font-semibold text-left">{option.label}</div>

              {/* Selected Indicator */}
              {preferences.current.animationSpeed === option.value && (
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
            {ANIMATION_SPEED_OPTIONS.find((o) => o.value === preferences.current.animationSpeed)?.description}
          </p>
        </div>

        {/* Animation Preview */}
        <div className="space-y-2">
          <p className="text-xs font-semibold text-muted-foreground">Animation Preview</p>
          <div className="h-20 bg-muted/50 rounded-lg border border-border flex items-center justify-center overflow-hidden">
            <div className="scale-in w-8 h-8 bg-primary rounded-full"></div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
