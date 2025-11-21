"use client";

import * as React from "react";
import { Ruler, Copy, Download } from "lucide-react";
import { Button } from "@/components/ui/button";
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";

interface SpacingValue {
  name: string;
  px: number;
  rem: string;
}

const BASE_UNITS = [
  { name: "4px Base", value: 4 },
  { name: "8px Base", value: 8 },
];

export function SpacingScaleGenerator() {
  const { toast } = useToast();

  const [baseUnit, setBaseUnit] = React.useState(4);

  // Generate spacing scale
  const spacingScale = React.useMemo((): SpacingValue[] => {
    const scales = [
      0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 14, 16, 20, 24, 28, 32, 36,
      40, 44, 48, 52, 56, 60, 64, 72, 80, 96,
    ];

    return scales.map((multiplier) => {
      const px = multiplier * baseUnit;
      const rem = (px / 16).toFixed(3);

      return {
        name: multiplier.toString(),
        px,
        rem,
      };
    });
  }, [baseUnit]);

  // Copy single spacing
  const copySpacing = async (spacing: SpacingValue) => {
    try {
      await navigator.clipboard.writeText(
        `--spacing-${spacing.name}: ${spacing.rem}rem; /* ${spacing.px}px */`
      );
      toast({
        title: "Copied!",
        description: `Spacing ${spacing.name} copied to clipboard.`,
      });
    } catch (error) {
      toast({
        title: "Copy Failed",
        description: "Failed to copy to clipboard.",
        variant: "destructive",
      });
    }
  };

  // Export as CSS
  const exportAsCSS = () => {
    const css = spacingScale
      .map(
        (spacing) =>
          `  --spacing-${spacing.name}: ${spacing.rem}rem; /* ${spacing.px}px */`
      )
      .join("\n");

    const fullCSS = `:root {\n  /* Spacing Scale (Base: ${baseUnit}px) */\n${css}\n}`;

    const blob = new Blob([fullCSS], { type: "text/css" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "spacing-scale.css";
    a.click();
    URL.revokeObjectURL(url);

    toast({
      title: "Exported",
      description: "Spacing scale exported as CSS.",
    });
  };

  // Export as Tailwind
  const exportAsTailwind = () => {
    const spacing: Record<string, string> = {};

    spacingScale.forEach((s) => {
      spacing[s.name] = `${s.rem}rem`;
    });

    const config = `module.exports = {
  theme: {
    extend: {
      spacing: ${JSON.stringify(spacing, null, 8)},
    },
  },
}`;

    const blob = new Blob([config], { type: "text/javascript" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "tailwind.config.js";
    a.click();
    URL.revokeObjectURL(url);

    toast({
      title: "Exported",
      description: "Spacing scale exported as Tailwind config.",
    });
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Ruler className="h-5 w-5" />
          Spacing Scale Generator
        </CardTitle>
        <CardDescription>
          Generate consistent spacing scales for your design system
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Configuration */}
        <div className="space-y-2">
          <Label>Base Unit</Label>
          <Select
            value={baseUnit.toString()}
            onValueChange={(value) => setBaseUnit(Number(value))}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {BASE_UNITS.map((unit) => (
                <SelectItem key={unit.value} value={unit.value.toString()}>
                  {unit.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <p className="text-xs text-muted-foreground">
            All spacing values will be multiples of {baseUnit}px
          </p>
        </div>

        {/* Spacing Scale */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <Label>Spacing Scale</Label>
            <Badge variant="secondary">{spacingScale.length} values</Badge>
          </div>

          <div className="max-h-96 overflow-y-auto space-y-2 pr-2">
            {spacingScale.map((spacing) => (
              <div
                key={spacing.name}
                className="flex items-center gap-3 p-3 rounded-lg border bg-muted/30 hover:bg-muted/50 transition-colors"
              >
                {/* Visual Ruler */}
                <div className="w-24 h-8 flex items-center">
                  <div
                    className="h-2 bg-primary rounded transition-all"
                    style={{ width: `${Math.min(spacing.px, 96)}px` }}
                  />
                </div>

                {/* Name */}
                <div className="w-12 shrink-0">
                  <Badge variant="outline">{spacing.name}</Badge>
                </div>

                {/* Values */}
                <div className="flex-1 grid grid-cols-2 gap-2 text-xs font-mono">
                  <div>
                    <span className="text-muted-foreground">px:</span>{" "}
                    {spacing.px}
                  </div>
                  <div>
                    <span className="text-muted-foreground">rem:</span>{" "}
                    {spacing.rem}
                  </div>
                </div>

                {/* Copy Button */}
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 shrink-0"
                  onClick={() => copySpacing(spacing)}
                >
                  <Copy className="h-3 w-3" />
                </Button>
              </div>
            ))}
          </div>
        </div>

        {/* Visual Reference */}
        <div className="space-y-3">
          <Label>Visual Reference</Label>
          <div className="p-4 rounded-lg border bg-muted/30">
            <div className="space-y-2">
              {[0, 2, 4, 8, 12, 16, 24].map((multiplier) => {
                const spacing = spacingScale.find(
                  (s) => s.name === multiplier.toString()
                );
                if (!spacing) return null;

                return (
                  <div key={multiplier} className="flex items-center gap-2">
                    <div className="w-12 text-xs text-muted-foreground">
                      {spacing.name}
                    </div>
                    <div
                      className="bg-primary h-6 rounded"
                      style={{ width: `${spacing.px}px` }}
                    />
                    <div className="text-xs text-muted-foreground">
                      {spacing.px}px
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="grid grid-cols-2 gap-2 pt-4 border-t">
          <Button onClick={exportAsCSS} variant="outline">
            <Download className="h-4 w-4 mr-2" />
            Export CSS
          </Button>
          <Button onClick={exportAsTailwind} variant="outline">
            <Download className="h-4 w-4 mr-2" />
            Export Tailwind
          </Button>
        </div>

        {/* Common Usage */}
        <div className="p-4 rounded-lg bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800">
          <h4 className="text-sm font-medium text-blue-900 dark:text-blue-100 mb-2">
            Common Usage:
          </h4>
          <div className="text-xs text-blue-900 dark:text-blue-100 space-y-1">
            <div>
              <strong>0-4:</strong> Tight spacing (elements within components)
            </div>
            <div>
              <strong>6-12:</strong> Component spacing (padding, gaps)
            </div>
            <div>
              <strong>16-32:</strong> Section spacing (between components)
            </div>
            <div>
              <strong>40-96:</strong> Layout spacing (major sections)
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
