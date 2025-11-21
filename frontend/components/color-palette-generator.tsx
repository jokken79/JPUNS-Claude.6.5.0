"use client";

import * as React from "react";
import {
  Palette,
  Copy,
  Download,
  RefreshCw,
  Lock,
  Unlock,
  Shuffle,
} from "lucide-react";
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

type ColorScale = 50 | 100 | 200 | 300 | 400 | 500 | 600 | 700 | 800 | 900;
type GenerationMode =
  | "shades"
  | "complementary"
  | "analogous"
  | "triadic"
  | "tetradic"
  | "monochromatic";

interface ColorPalette {
  [key: number]: string;
}

interface LockedColors {
  [key: number]: boolean;
}

export function ColorPaletteGenerator() {
  const { toast } = useToast();

  const [primaryColor, setPrimaryColor] = React.useState("#3B82F6");
  const [mode, setMode] = React.useState<GenerationMode>("shades");
  const [palette, setPalette] = React.useState<ColorPalette>({});
  const [lockedColors, setLockedColors] = React.useState<LockedColors>({});

  const scales: ColorScale[] = [50, 100, 200, 300, 400, 500, 600, 700, 800, 900];

  // Helper: Convert hex to HSL
  const hexToHsl = (hex: string): { h: number; s: number; l: number } => {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    if (!result) return { h: 0, s: 0, l: 0 };

    let r = parseInt(result[1], 16) / 255;
    let g = parseInt(result[2], 16) / 255;
    let b = parseInt(result[3], 16) / 255;

    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);
    let h = 0;
    let s = 0;
    const l = (max + min) / 2;

    if (max !== min) {
      const d = max - min;
      s = l > 0.5 ? d / (2 - max - min) : d / (max + min);

      switch (max) {
        case r:
          h = ((g - b) / d + (g < b ? 6 : 0)) / 6;
          break;
        case g:
          h = ((b - r) / d + 2) / 6;
          break;
        case b:
          h = ((r - g) / d + 4) / 6;
          break;
      }
    }

    return { h: h * 360, s: s * 100, l: l * 100 };
  };

  // Helper: Convert HSL to hex
  const hslToHex = (h: number, s: number, l: number): string => {
    s /= 100;
    l /= 100;

    const c = (1 - Math.abs(2 * l - 1)) * s;
    const x = c * (1 - Math.abs(((h / 60) % 2) - 1));
    const m = l - c / 2;

    let r = 0,
      g = 0,
      b = 0;

    if (h >= 0 && h < 60) {
      r = c;
      g = x;
      b = 0;
    } else if (h >= 60 && h < 120) {
      r = x;
      g = c;
      b = 0;
    } else if (h >= 120 && h < 180) {
      r = 0;
      g = c;
      b = x;
    } else if (h >= 180 && h < 240) {
      r = 0;
      g = x;
      b = c;
    } else if (h >= 240 && h < 300) {
      r = x;
      g = 0;
      b = c;
    } else {
      r = c;
      g = 0;
      b = x;
    }

    const toHex = (n: number) => {
      const hex = Math.round((n + m) * 255).toString(16);
      return hex.length === 1 ? "0" + hex : hex;
    };

    return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
  };

  // Generate palette based on mode
  const generatePalette = React.useCallback(() => {
    const hsl = hexToHsl(primaryColor);
    const newPalette: ColorPalette = {};

    switch (mode) {
      case "shades":
        // Generate tints and shades
        scales.forEach((scale) => {
          if (lockedColors[scale]) {
            newPalette[scale] = palette[scale];
            return;
          }

          let lightness: number;
          if (scale === 50) lightness = 95;
          else if (scale === 100) lightness = 90;
          else if (scale === 200) lightness = 80;
          else if (scale === 300) lightness = 70;
          else if (scale === 400) lightness = 60;
          else if (scale === 500) lightness = 50;
          else if (scale === 600) lightness = 40;
          else if (scale === 700) lightness = 30;
          else if (scale === 800) lightness = 20;
          else lightness = 10;

          newPalette[scale] = hslToHex(hsl.h, hsl.s, lightness);
        });
        break;

      case "complementary":
        const compHue = (hsl.h + 180) % 360;
        scales.forEach((scale, index) => {
          if (lockedColors[scale]) {
            newPalette[scale] = palette[scale];
            return;
          }

          const useComp = index % 2 === 1;
          const h = useComp ? compHue : hsl.h;
          const lightness = 95 - index * 9;
          newPalette[scale] = hslToHex(h, hsl.s, lightness);
        });
        break;

      case "analogous":
        const analogous1 = (hsl.h + 30) % 360;
        const analogous2 = (hsl.h - 30 + 360) % 360;
        scales.forEach((scale, index) => {
          if (lockedColors[scale]) {
            newPalette[scale] = palette[scale];
            return;
          }

          let h = hsl.h;
          if (index % 3 === 1) h = analogous1;
          else if (index % 3 === 2) h = analogous2;

          const lightness = 95 - index * 9;
          newPalette[scale] = hslToHex(h, hsl.s, lightness);
        });
        break;

      case "triadic":
        const triadic1 = (hsl.h + 120) % 360;
        const triadic2 = (hsl.h + 240) % 360;
        scales.forEach((scale, index) => {
          if (lockedColors[scale]) {
            newPalette[scale] = palette[scale];
            return;
          }

          let h = hsl.h;
          if (index % 3 === 1) h = triadic1;
          else if (index % 3 === 2) h = triadic2;

          const lightness = 95 - index * 9;
          newPalette[scale] = hslToHex(h, hsl.s, lightness);
        });
        break;

      case "tetradic":
        const tetradic1 = (hsl.h + 90) % 360;
        const tetradic2 = (hsl.h + 180) % 360;
        const tetradic3 = (hsl.h + 270) % 360;
        scales.forEach((scale, index) => {
          if (lockedColors[scale]) {
            newPalette[scale] = palette[scale];
            return;
          }

          let h = hsl.h;
          if (index % 4 === 1) h = tetradic1;
          else if (index % 4 === 2) h = tetradic2;
          else if (index % 4 === 3) h = tetradic3;

          const lightness = 95 - index * 9;
          newPalette[scale] = hslToHex(h, hsl.s, lightness);
        });
        break;

      case "monochromatic":
        scales.forEach((scale, index) => {
          if (lockedColors[scale]) {
            newPalette[scale] = palette[scale];
            return;
          }

          const saturation = hsl.s - index * 5;
          const lightness = 95 - index * 9;
          newPalette[scale] = hslToHex(
            hsl.h,
            Math.max(0, saturation),
            lightness
          );
        });
        break;
    }

    setPalette(newPalette);
  }, [primaryColor, mode, lockedColors, palette, scales]);

  // Generate on mount and when dependencies change
  React.useEffect(() => {
    generatePalette();
  }, [mode]); // Only regenerate when mode changes

  // Toggle color lock
  const toggleLock = (scale: ColorScale) => {
    setLockedColors((prev) => ({
      ...prev,
      [scale]: !prev[scale],
    }));
  };

  // Copy color to clipboard
  const copyColor = async (color: string) => {
    try {
      await navigator.clipboard.writeText(color);
      toast({
        title: "Copied!",
        description: `${color} copied to clipboard.`,
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
    const css = Object.entries(palette)
      .map(([scale, color]) => `  --color-${scale}: ${color};`)
      .join("\n");

    const fullCSS = `:root {\n${css}\n}`;

    const blob = new Blob([fullCSS], { type: "text/css" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "palette.css";
    a.click();
    URL.revokeObjectURL(url);

    toast({
      title: "Exported",
      description: "Palette exported as CSS.",
    });
  };

  // Export as Tailwind
  const exportAsTailwind = () => {
    const colors = Object.entries(palette)
      .map(([scale, color]) => `        ${scale}: '${color}',`)
      .join("\n");

    const config = `module.exports = {
  theme: {
    extend: {
      colors: {
        primary: {
${colors}
        },
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
      description: "Palette exported as Tailwind config.",
    });
  };

  // Export as JSON
  const exportAsJSON = () => {
    const json = JSON.stringify(palette, null, 2);

    const blob = new Blob([json], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "palette.json";
    a.click();
    URL.revokeObjectURL(url);

    toast({
      title: "Exported",
      description: "Palette exported as JSON.",
    });
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Palette className="h-5 w-5" />
          Color Palette Generator
        </CardTitle>
        <CardDescription>
          Generate complete color palettes from a single color
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Primary Color Input */}
        <div className="space-y-3">
          <Label>Primary Color</Label>
          <div className="flex gap-2">
            <input
              type="color"
              value={primaryColor}
              onChange={(e) => setPrimaryColor(e.target.value)}
              className="h-12 w-20 rounded border cursor-pointer"
            />
            <Input
              value={primaryColor}
              onChange={(e) => setPrimaryColor(e.target.value)}
              className="font-mono text-sm"
              placeholder="#3B82F6"
            />
            <Button onClick={generatePalette} size="icon" className="shrink-0">
              <RefreshCw className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Generation Mode */}
        <div className="space-y-2">
          <Label>Generation Mode</Label>
          <Select
            value={mode}
            onValueChange={(value) => setMode(value as GenerationMode)}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="shades">Tints & Shades</SelectItem>
              <SelectItem value="complementary">Complementary</SelectItem>
              <SelectItem value="analogous">Analogous</SelectItem>
              <SelectItem value="triadic">Triadic</SelectItem>
              <SelectItem value="tetradic">Tetradic</SelectItem>
              <SelectItem value="monochromatic">Monochromatic</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Color Scale */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <Label>Color Scale</Label>
            <Badge variant="secondary">{scales.length} colors</Badge>
          </div>

          <div className="space-y-2">
            {scales.map((scale) => (
              <div
                key={scale}
                className="flex items-center gap-2 p-2 rounded-lg border bg-muted/30 hover:bg-muted/50 transition-colors"
              >
                <div
                  className="w-12 h-12 rounded border-2 border-border shrink-0"
                  style={{ backgroundColor: palette[scale] || "#000000" }}
                />
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium">{scale}</div>
                  <div className="text-xs font-mono text-muted-foreground">
                    {palette[scale] || "—"}
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8"
                    onClick={() => toggleLock(scale)}
                  >
                    {lockedColors[scale] ? (
                      <Lock className="h-3 w-3" />
                    ) : (
                      <Unlock className="h-3 w-3" />
                    )}
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8"
                    onClick={() => copyColor(palette[scale] || "")}
                  >
                    <Copy className="h-3 w-3" />
                  </Button>
                </div>
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
          <Button onClick={exportAsJSON} variant="outline" className="col-span-2">
            <Download className="h-4 w-4 mr-2" />
            Export JSON
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
