'use client'

import { Palette, AlertCircle } from 'lucide-react'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { ColorIntensityPicker } from '@/components/design-tools/color-intensity-picker'
import { AnimationSpeedPicker } from '@/components/design-tools/animation-speed-picker'
import { DesignPreview } from '@/components/design-tools/design-preview'

export default function DesignPreferencesPage() {
  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-4xl font-bold flex items-center gap-3 mb-2">
          <Palette className="w-10 h-10" />
          Design Preferences
        </h1>
        <p className="text-lg text-muted-foreground">
          Customize your visual experience with color intensity and animation speed
        </p>
      </div>

      {/* Important Note */}
      <Alert className="border-blue-200 bg-blue-50 dark:bg-blue-950 dark:border-blue-800">
        <AlertCircle className="h-4 w-4 text-blue-600 dark:text-blue-400" />
        <AlertDescription className="text-blue-900 dark:text-blue-100">
          Your preferences are saved automatically and applied across the entire application.
          No re-renders or page reloads needed!
        </AlertDescription>
      </Alert>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - Preferences */}
        <div className="lg:col-span-2 space-y-6">
          <ColorIntensityPicker />
          <AnimationSpeedPicker />
        </div>

        {/* Right Column - Preview */}
        <div className="lg:col-span-1">
          <DesignPreview />
        </div>
      </div>
    </div>
  )
}
