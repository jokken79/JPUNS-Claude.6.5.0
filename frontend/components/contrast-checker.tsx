"use client";

import * as React from "react";
import { Check, X, ArrowLeftRight, Info } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

export function ContrastChecker() {
  const [foreground, setForeground] = React.useState("#3B82F6");
  const [background, setBackground] = React.useState("#FFFFFF");

  // Helper: Get luminance
  const getLuminance = (hex: string): number => {
    const rgb = hexToRgb(hex);
    if (!rgb) return 0;

    const [r, g, b] = [rgb.r, rgb.g, rgb.b].map((val) => {
      const v = val / 255;
      return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
    });

    return 0.2126 * r + 0.7152 * g + 0.0722 * b;
  };

  // Helper: Convert hex to RGB
  const hexToRgb = (
    hex: string
  ): { r: number; g: number; b: number } | null => {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result
      ? {
          r: parseInt(result[1], 16),
          g: parseInt(result[2], 16),
          b: parseInt(result[3], 16),
        }
      : null;
  };

  // Calculate contrast ratio
  const contrastRatio = React.useMemo(() => {
    const lum1 = getLuminance(foreground);
    const lum2 = getLuminance(background);
    const lighter = Math.max(lum1, lum2);
    const darker = Math.min(lum1, lum2);
    return (lighter + 0.05) / (darker + 0.05);
  }, [foreground, background]);

  // WCAG compliance checks
  const wcagCompliance = React.useMemo(() => {
    return {
      aa: {
        normal: contrastRatio >= 4.5,
        large: contrastRatio >= 3,
      },
      aaa: {
        normal: contrastRatio >= 7,
        large: contrastRatio >= 4.5,
      },
    };
  }, [contrastRatio]);

  // Get rating
  const getRating = () => {
    if (wcagCompliance.aaa.normal) return { label: "Excellent", color: "text-green-600" };
    if (wcagCompliance.aa.normal) return { label: "Good", color: "text-blue-600" };
    if (wcagCompliance.aa.large) return { label: "Fair", color: "text-yellow-600" };
    return { label: "Poor", color: "text-red-600" };
  };

  const rating = getRating();

  // Flip colors
  const flipColors = () => {
    const temp = foreground;
    setForeground(background);
    setBackground(temp);
  };

  // Get suggestions
  const getSuggestions = (): string[] => {
    const suggestions: string[] = [];

    if (!wcagCompliance.aa.normal) {
      suggestions.push("Increase contrast by using a darker foreground or lighter background.");
    }
    if (!wcagCompliance.aaa.normal && wcagCompliance.aa.normal) {
      suggestions.push("Consider increasing contrast further for AAA compliance.");
    }
    if (contrastRatio < 3) {
      suggestions.push("Current contrast is too low for any text. Use completely different colors.");
    }

    return suggestions;
  };

  const suggestions = getSuggestions();

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Info className="h-5 w-5" />
          Contrast Checker
        </CardTitle>
        <CardDescription>
          Check color contrast for WCAG accessibility compliance
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Color Inputs */}
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>Foreground (Text)</Label>
            <div className="space-y-2">
              <input
                type="color"
                value={foreground}
                onChange={(e) => setForeground(e.target.value)}
                className="h-12 w-full rounded border cursor-pointer"
              />
              <Input
                value={foreground}
                onChange={(e) => setForeground(e.target.value)}
                className="font-mono text-sm"
                placeholder="#3B82F6"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label>Background</Label>
            <div className="space-y-2">
              <input
                type="color"
                value={background}
                onChange={(e) => setBackground(e.target.value)}
                className="h-12 w-full rounded border cursor-pointer"
              />
              <Input
                value={background}
                onChange={(e) => setBackground(e.target.value)}
                className="font-mono text-sm"
                placeholder="#FFFFFF"
              />
            </div>
          </div>
        </div>

        <div className="flex justify-center">
          <Button variant="outline" size="sm" onClick={flipColors}>
            <ArrowLeftRight className="h-4 w-4 mr-2" />
            Flip Colors
          </Button>
        </div>

        {/* Contrast Ratio */}
        <div className="p-6 rounded-lg border bg-muted/30 text-center space-y-2">
          <div className="text-sm text-muted-foreground">Contrast Ratio</div>
          <div className="text-4xl font-bold">
            {contrastRatio.toFixed(2)}:1
          </div>
          <div className={`text-sm font-medium ${rating.color}`}>
            {rating.label}
          </div>
        </div>

        {/* WCAG Compliance */}
        <div className="space-y-3">
          <Label>WCAG Compliance</Label>

          <div className="grid grid-cols-2 gap-3">
            {/* AA Normal */}
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <div
                    className={`p-4 rounded-lg border-2 ${
                      wcagCompliance.aa.normal
                        ? "border-green-500 bg-green-50 dark:bg-green-950"
                        : "border-red-500 bg-red-50 dark:bg-red-950"
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm font-medium">AA Normal</span>
                      {wcagCompliance.aa.normal ? (
                        <Check className="h-4 w-4 text-green-600" />
                      ) : (
                        <X className="h-4 w-4 text-red-600" />
                      )}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      4.5:1 required
                    </div>
                  </div>
                </TooltipTrigger>
                <TooltipContent>
                  <p className="text-xs max-w-xs">
                    Normal text (below 18pt or 14pt bold) must have at least 4.5:1 contrast ratio.
                  </p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>

            {/* AA Large */}
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <div
                    className={`p-4 rounded-lg border-2 ${
                      wcagCompliance.aa.large
                        ? "border-green-500 bg-green-50 dark:bg-green-950"
                        : "border-red-500 bg-red-50 dark:bg-red-950"
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm font-medium">AA Large</span>
                      {wcagCompliance.aa.large ? (
                        <Check className="h-4 w-4 text-green-600" />
                      ) : (
                        <X className="h-4 w-4 text-red-600" />
                      )}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      3:1 required
                    </div>
                  </div>
                </TooltipTrigger>
                <TooltipContent>
                  <p className="text-xs max-w-xs">
                    Large text (18pt+ or 14pt+ bold) must have at least 3:1 contrast ratio.
                  </p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>

            {/* AAA Normal */}
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <div
                    className={`p-4 rounded-lg border-2 ${
                      wcagCompliance.aaa.normal
                        ? "border-green-500 bg-green-50 dark:bg-green-950"
                        : "border-red-500 bg-red-50 dark:bg-red-950"
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm font-medium">AAA Normal</span>
                      {wcagCompliance.aaa.normal ? (
                        <Check className="h-4 w-4 text-green-600" />
                      ) : (
                        <X className="h-4 w-4 text-red-600" />
                      )}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      7:1 required
                    </div>
                  </div>
                </TooltipTrigger>
                <TooltipContent>
                  <p className="text-xs max-w-xs">
                    Enhanced contrast - normal text must have at least 7:1 ratio.
                  </p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>

            {/* AAA Large */}
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <div
                    className={`p-4 rounded-lg border-2 ${
                      wcagCompliance.aaa.large
                        ? "border-green-500 bg-green-50 dark:bg-green-950"
                        : "border-red-500 bg-red-50 dark:bg-red-950"
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm font-medium">AAA Large</span>
                      {wcagCompliance.aaa.large ? (
                        <Check className="h-4 w-4 text-green-600" />
                      ) : (
                        <X className="h-4 w-4 text-red-600" />
                      )}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      4.5:1 required
                    </div>
                  </div>
                </TooltipTrigger>
                <TooltipContent>
                  <p className="text-xs max-w-xs">
                    Enhanced contrast - large text must have at least 4.5:1 ratio.
                  </p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
        </div>

        {/* Preview Samples */}
        <div className="space-y-3">
          <Label>Preview</Label>
          <div
            className="p-6 rounded-lg border-2"
            style={{ backgroundColor: background, color: foreground }}
          >
            <div className="space-y-4">
              <p className="text-sm">Normal text sample (14px)</p>
              <p className="text-lg font-semibold">
                Large text sample (18px bold)
              </p>
              <p className="text-2xl">Extra large text (24px)</p>
            </div>
          </div>
        </div>

        {/* Suggestions */}
        {suggestions.length > 0 && (
          <div className="space-y-2">
            <Label>Suggestions</Label>
            <div className="space-y-2">
              {suggestions.map((suggestion, index) => (
                <div
                  key={index}
                  className="p-3 rounded-lg bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800"
                >
                  <p className="text-sm text-blue-900 dark:text-blue-100">
                    {suggestion}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
