'use client'

import React from 'react'
import { Eye } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { useDesignPreferences } from '@/hooks/useDesignPreferences'

export function DesignPreview() {
  const { preferences } = useDesignPreferences()

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Eye className="w-5 h-5" />
            <CardTitle>Design Preview</CardTitle>
          </div>
          <div className="flex gap-2">
            <Badge variant="outline">{preferences.current.colorIntensity}</Badge>
            <Badge variant="outline">{preferences.current.animationSpeed}</Badge>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Color Intensity Preview */}
        <div className="space-y-3">
          <h4 className="text-sm font-semibold">Color Intensity</h4>
          <div className="flex gap-2 rounded-lg overflow-hidden border border-border h-20">
            <div className="flex-1 bg-primary flex items-center justify-center text-primary-foreground font-semibold text-xs">
              Primary
            </div>
            <div className="flex-1 bg-accent flex items-center justify-center text-accent-foreground font-semibold text-xs">
              Accent
            </div>
            <div className="flex-1 bg-success flex items-center justify-center text-success-foreground font-semibold text-xs">
              Success
            </div>
          </div>
        </div>

        {/* Animation Speed Preview */}
        <div className="space-y-3">
          <h4 className="text-sm font-semibold">Animation Speed</h4>
          <div className="h-20 bg-muted/50 rounded-lg border border-border flex items-center justify-center overflow-hidden">
            <div className="scale-in w-10 h-10 bg-primary rounded-lg"></div>
          </div>
        </div>

        {/* Current Settings */}
        <div className="p-3 rounded-lg bg-muted/50 border border-border text-xs space-y-1 font-mono">
          <p className="text-muted-foreground">Active Settings:</p>
          <p>Color: {preferences.current.colorIntensity} (×{preferences.current.colorIntensity === 'BOLD' ? '1.3' : '0.9'})</p>
          <p>Speed: {preferences.current.animationSpeed} (×{preferences.current.animationSpeed === 'DYNAMIC' ? '0.7' : '1'})</p>
        </div>
      </CardContent>
    </Card>
  )
}
