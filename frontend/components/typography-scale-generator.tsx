"use client";

import * as React from "react";
import { Type, Copy, Download } from "lucide-react";
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";

interface TypeScale {
  name: string;
  size: number;
  rem: string;
  lineHeight: number;
}

const SCALE_RATIOS = [
  { name: "Minor Second", value: 1.067 },
  { name: "Major Second", value: 1.125 },
  { name: "Minor Third", value: 1.2 },
  { name: "Major Third", value: 1.25 },
  { name: "Perfect Fourth", value: 1.333 },
  { name: "Augmented Fourth", value: 1.414 },
  { name: "Perfect Fifth", value: 1.5 },
  { name: "Golden Ratio", value: 1.618 },
];

const FONT_FAMILIES = [
  "Inter",
  "Roboto",
  "Open Sans",
  "Lato",
  "Montserrat",
  "Poppins",
  "Playfair Display",
  "Merriweather",
  "Georgia",
  "Times New Roman",
];

const FONT_WEIGHTS = [
  { name: "Light", value: "300" },
  { name: "Regular", value: "400" },
  { name: "Medium", value: "500" },
  { name: "Semi Bold", value: "600" },
  { name: "Bold", value: "700" },
  { name: "Extra Bold", value: "800" },
];

export function TypographyScaleGenerator() {
  const { toast } = useToast();

  const [baseSize, setBaseSize] = React.useState(16);
  const [ratio, setRatio] = React.useState(1.25);
  const [fontFamily, setFontFamily] = React.useState("Inter");
  const [fontWeight, setFontWeight] = React.useState("400");

  // Generate type scale
  const typeScale = React.useMemo((): TypeScale[] => {
    const scales = [
      { name: "xs", steps: -2 },
      { name: "sm", steps: -1 },
      { name: "base", steps: 0 },
      { name: "lg", steps: 1 },
      { name: "xl", steps: 2 },
      { name: "2xl", steps: 3 },
      { name: "3xl", steps: 4 },
      { name: "4xl", steps: 5 },
    ];

    return scales.map(({ name, steps }) => {
      const size = Math.round(baseSize * Math.pow(ratio, steps));
      const rem = (size / 16).toFixed(3);
      const lineHeight = size <= 18 ? 1.5 : size <= 24 ? 1.4 : 1.3;

      return { name, size, rem, lineHeight };
    });
  }, [baseSize, ratio]);

  // Copy single size
  const copySize = async (scale: TypeScale) => {
    try {
      await navigator.clipboard.writeText(
        `font-size: ${scale.rem}rem; /* ${scale.size}px */`
      );
      toast({
        title: "Copied!",
        description: `${scale.name} size copied to clipboard.`,
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
    const css = typeScale
      .map(
        (scale) =>
          `  --font-size-${scale.name}: ${scale.rem}rem; /* ${scale.size}px */\n  --line-height-${scale.name}: ${scale.lineHeight};`
      )
      .join("\n");

    const fullCSS = `:root {\n  /* Typography Scale */\n  --font-family-base: ${fontFamily}, sans-serif;\n  --font-weight-base: ${fontWeight};\n  \n${css}\n}`;

    const blob = new Blob([fullCSS], { type: "text/css" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "typography-scale.css";
    a.click();
    URL.revokeObjectURL(url);

    toast({
      title: "Exported",
      description: "Typography scale exported as CSS.",
    });
  };

  // Export as Tailwind
  const exportAsTailwind = () => {
    const fontSize: Record<string, [string, { lineHeight: string }]> = {};

    typeScale.forEach((scale) => {
      fontSize[scale.name] = [`${scale.rem}rem`, { lineHeight: scale.lineHeight.toString() }];
    });

    const config = `module.exports = {
  theme: {
    extend: {
      fontSize: ${JSON.stringify(fontSize, null, 8)},
      fontFamily: {
        sans: ['${fontFamily}', 'sans-serif'],
      },
      fontWeight: {
        normal: '${fontWeight}',
      },
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
      description: "Typography scale exported as Tailwind config.",
    });
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Type className="h-5 w-5" />
          Typography Scale Generator
        </CardTitle>
        <CardDescription>
          Generate harmonious type scales with perfect ratios
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Configuration */}
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>Base Font Size (px)</Label>
            <Input
              type="number"
              value={baseSize}
              onChange={(e) => setBaseSize(Number(e.target.value))}
              min={12}
              max={24}
            />
          </div>

          <div className="space-y-2">
            <Label>Scale Ratio</Label>
            <Select
              value={ratio.toString()}
              onValueChange={(value) => setRatio(Number(value))}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {SCALE_RATIOS.map((r) => (
                  <SelectItem key={r.value} value={r.value.toString()}>
                    {r.name} ({r.value})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Font Family</Label>
            <Select value={fontFamily} onValueChange={setFontFamily}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {FONT_FAMILIES.map((font) => (
                  <SelectItem key={font} value={font}>
                    {font}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Font Weight</Label>
            <Select value={fontWeight} onValueChange={setFontWeight}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {FONT_WEIGHTS.map((weight) => (
                  <SelectItem key={weight.value} value={weight.value}>
                    {weight.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Type Scale Preview */}
        <div className="space-y-3">
          <Label>Type Scale Preview</Label>

          <div className="space-y-2">
            {typeScale.map((scale) => (
              <div
                key={scale.name}
                className="flex items-center gap-4 p-3 rounded-lg border bg-muted/30 hover:bg-muted/50 transition-colors"
              >
                <div className="w-16 shrink-0">
                  <Badge variant="secondary">{scale.name}</Badge>
                </div>

                <div className="flex-1 min-w-0">
                  <div
                    style={{
                      fontFamily: fontFamily,
                      fontSize: `${scale.size}px`,
                      fontWeight: fontWeight,
                      lineHeight: scale.lineHeight,
                    }}
                  >
                    The quick brown fox
                  </div>
                </div>

                <div className="text-xs text-muted-foreground font-mono text-right shrink-0 w-32">
                  <div>{scale.size}px</div>
                  <div>{scale.rem}rem</div>
                  <div>LH: {scale.lineHeight}</div>
                </div>

                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 shrink-0"
                  onClick={() => copySize(scale)}
                >
                  <Copy className="h-3 w-3" />
                </Button>
              </div>
            ))}
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

        {/* Info */}
        <div className="p-4 rounded-lg bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800">
          <p className="text-sm text-blue-900 dark:text-blue-100">
            <strong>Tip:</strong> The {SCALE_RATIOS.find((r) => r.value === ratio)?.name} ratio ({ratio}) creates {ratio > 1.4 ? "dramatic" : ratio > 1.3 ? "balanced" : "subtle"} size relationships. Line heights are automatically calculated for optimal readability.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
