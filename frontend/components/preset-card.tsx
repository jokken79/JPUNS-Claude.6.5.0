"use client";

import * as React from "react";
import { Check, Eye, Sparkles } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { PresetCombination } from "@/lib/preset-combinations";

interface PresetCardProps {
  preset: PresetCombination;
  onPreview: () => void;
  onApply: () => void;
}

export function PresetCard({ preset, onPreview, onApply }: PresetCardProps) {
  return (
    <div className="group relative overflow-hidden rounded-xl border-2 border-border hover:border-primary/50 transition-all duration-300 hover:shadow-xl">
      {/* Preview Area */}
      <div
        className="relative w-full h-48 overflow-hidden"
        style={{
          background: preset.preview.gradient,
        }}
      >
        {/* Emoji Icon */}
        <div className="absolute top-4 left-4 text-6xl opacity-20">
          {preset.preview.emoji}
        </div>

        {/* Preview Content */}
        <div className="relative w-full h-full p-6 flex flex-col justify-between">
          {/* Title Badge */}
          <Badge variant="secondary" className="w-fit bg-white/20 backdrop-blur-sm text-white border-white/30">
            <Sparkles className="h-3 w-3 mr-1" />
            Preset Combo
          </Badge>

          {/* Bottom Preview Elements */}
          <div className="flex gap-2">
            <div className="bg-white/20 backdrop-blur-sm px-4 py-2 rounded-lg">
              <div className="h-2 w-16 bg-white/60 rounded-full"></div>
            </div>
            <div className="bg-white/15 backdrop-blur-sm px-4 py-2 rounded-lg border border-white/20">
              <div className="h-2 w-12 bg-white/50 rounded-full"></div>
            </div>
          </div>
        </div>

        {/* Overlay Buttons */}
        <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex items-center justify-center gap-2">
          <Button
            size="sm"
            variant="secondary"
            onClick={(e) => {
              e.stopPropagation();
              onPreview();
            }}
            className="shadow-lg"
          >
            <Eye className="h-4 w-4 mr-1" />
            Preview
          </Button>
          <Button
            size="sm"
            onClick={(e) => {
              e.stopPropagation();
              onApply();
            }}
            className="shadow-lg"
          >
            <Check className="h-4 w-4 mr-1" />
            Apply Both
          </Button>
        </div>
      </div>

      {/* Preset Info */}
      <div className="p-4 bg-card space-y-3">
        {/* Header */}
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xl">{preset.preview.emoji}</span>
              <h3 className="font-bold text-base truncate">{preset.name}</h3>
            </div>
            <p className="text-sm text-muted-foreground line-clamp-2">
              {preset.description}
            </p>
          </div>
          <Badge variant="outline" className="text-xs capitalize shrink-0">
            {preset.category}
          </Badge>
        </div>

        {/* Combination Details */}
        <div className="space-y-2 text-xs">
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground">Template:</span>
            <code className="bg-muted px-2 py-0.5 rounded">
              {preset.templateId}
            </code>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground">Theme:</span>
            <code className="bg-muted px-2 py-0.5 rounded">
              {preset.themeName}
            </code>
          </div>
        </div>

        {/* Tags */}
        <div className="flex flex-wrap gap-1">
          {preset.tags.slice(0, 3).map((tag) => (
            <Badge key={tag} variant="secondary" className="text-xs">
              {tag}
            </Badge>
          ))}
          {preset.tags.length > 3 && (
            <Badge variant="secondary" className="text-xs">
              +{preset.tags.length - 3}
            </Badge>
          )}
        </div>
      </div>
    </div>
  );
}
