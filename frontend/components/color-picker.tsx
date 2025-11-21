"use client";

import { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card } from "@/components/ui/card";

interface ColorPickerProps {
  value: string; // HSL string like "200 50% 50%"
  onChange: (value: string) => void;
  label?: string;
  description?: string;
}

/**
 * Convert HSL string to individual H, S, L values
 * @param hsl - HSL string like "200 50% 50%"
 * @returns Object with h, s, l values
 */
function parseHslString(hsl: string): { h: number; s: number; l: number } {
  const parts = hsl.trim().split(/\s+/);

  if (parts.length !== 3) {
    return { h: 0, s: 0, l: 0 };
  }

  const h = parseInt(parts[0], 10);
  const s = parseInt(parts[1].replace("%", ""), 10);
  const l = parseInt(parts[2].replace("%", ""), 10);

  return {
    h: isNaN(h) ? 0 : h,
    s: isNaN(s) ? 0 : s,
    l: isNaN(l) ? 0 : l,
  };
}

/**
 * Convert H, S, L values to HSL string
 * @param h - Hue (0-360)
 * @param s - Saturation (0-100)
 * @param l - Lightness (0-100)
 * @returns HSL string like "200 50% 50%"
 */
function formatHslString(h: number, s: number, l: number): string {
  return `${h} ${s}% ${l}%`;
}

/**
 * Convert HSL to Hex color
 * @param h - Hue (0-360)
 * @param s - Saturation (0-100)
 * @param l - Lightness (0-100)
 * @returns Hex color like "#3b82f6"
 */
function hslToHex(h: number, s: number, l: number): string {
  const hDecimal = h / 360;
  const sDecimal = s / 100;
  const lDecimal = l / 100;

  let r, g, b;

  if (sDecimal === 0) {
    r = g = b = lDecimal;
  } else {
    const hue2rgb = (p: number, q: number, t: number) => {
      if (t < 0) t += 1;
      if (t > 1) t -= 1;
      if (t < 1 / 6) return p + (q - p) * 6 * t;
      if (t < 1 / 2) return q;
      if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;
      return p;
    };

    const q = lDecimal < 0.5 ? lDecimal * (1 + sDecimal) : lDecimal + sDecimal - lDecimal * sDecimal;
    const p = 2 * lDecimal - q;

    r = hue2rgb(p, q, hDecimal + 1 / 3);
    g = hue2rgb(p, q, hDecimal);
    b = hue2rgb(p, q, hDecimal - 1 / 3);
  }

  const toHex = (x: number) => {
    const hex = Math.round(x * 255).toString(16);
    return hex.length === 1 ? "0" + hex : hex;
  };

  return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
}

/**
 * Convert Hex to HSL
 * @param hex - Hex color like "#3b82f6"
 * @returns Object with h, s, l values
 */
function hexToHsl(hex: string): { h: number; s: number; l: number } {
  // Remove # if present
  hex = hex.replace("#", "");

  // Parse hex values
  const r = parseInt(hex.substring(0, 2), 16) / 255;
  const g = parseInt(hex.substring(2, 4), 16) / 255;
  const b = parseInt(hex.substring(4, 6), 16) / 255;

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

  return {
    h: Math.round(h * 360),
    s: Math.round(s * 100),
    l: Math.round(l * 100),
  };
}

/**
 * ColorPicker Component
 *
 * A visual color picker supporting both HSL sliders and Hex input
 */
export function ColorPicker({ value, onChange, label, description }: ColorPickerProps) {
  const [mode, setMode] = useState<"hsl" | "hex">("hsl");
  const [hsl, setHsl] = useState(() => parseHslString(value));
  const [hexValue, setHexValue] = useState(() => hslToHex(hsl.h, hsl.s, hsl.l));

  // Update internal state when external value changes
  useEffect(() => {
    const parsed = parseHslString(value);
    setHsl(parsed);
    setHexValue(hslToHex(parsed.h, parsed.s, parsed.l));
  }, [value]);

  const handleHslChange = (component: "h" | "s" | "l", newValue: number) => {
    const newHsl = { ...hsl, [component]: newValue };
    setHsl(newHsl);

    const hslString = formatHslString(newHsl.h, newHsl.s, newHsl.l);
    onChange(hslString);

    // Update hex value
    setHexValue(hslToHex(newHsl.h, newHsl.s, newHsl.l));
  };

  const handleHexChange = (newHex: string) => {
    setHexValue(newHex);

    // Validate hex format
    const hexRegex = /^#?([A-Fa-f0-9]{6})$/;
    if (hexRegex.test(newHex)) {
      const parsed = hexToHsl(newHex);
      setHsl(parsed);

      const hslString = formatHslString(parsed.h, parsed.s, parsed.l);
      onChange(hslString);
    }
  };

  const previewColor = `hsl(${hsl.h}, ${hsl.s}%, ${hsl.l}%)`;

  return (
    <div className="space-y-4">
      {label && (
        <div className="space-y-1">
          <Label className="text-base font-medium">{label}</Label>
          {description && (
            <p className="text-sm text-muted-foreground">{description}</p>
          )}
        </div>
      )}

      {/* Color Preview */}
      <Card className="p-4">
        <div className="flex items-center gap-4">
          <div
            className="w-20 h-20 rounded-lg border-2 border-border shadow-sm"
            style={{ backgroundColor: previewColor }}
          />
          <div className="flex-1 space-y-1">
            <p className="text-sm font-medium">Preview</p>
            <p className="text-xs text-muted-foreground font-mono">
              HSL: {formatHslString(hsl.h, hsl.s, hsl.l)}
            </p>
            <p className="text-xs text-muted-foreground font-mono">
              HEX: {hexValue.toUpperCase()}
            </p>
          </div>
        </div>
      </Card>

      {/* Color Input Modes */}
      <Tabs value={mode} onValueChange={(v) => setMode(v as "hsl" | "hex")}>
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="hsl">HSL Sliders</TabsTrigger>
          <TabsTrigger value="hex">Hex Input</TabsTrigger>
        </TabsList>

        {/* HSL Sliders Mode */}
        <TabsContent value="hsl" className="space-y-6 mt-4">
          {/* Hue Slider */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label htmlFor="hue" className="text-sm font-medium">
                Hue
              </Label>
              <span className="text-sm text-muted-foreground font-mono">
                {hsl.h}°
              </span>
            </div>
            <Slider
              id="hue"
              min={0}
              max={360}
              step={1}
              value={[hsl.h]}
              onValueChange={([v]) => handleHslChange("h", v)}
              className="w-full"
              style={{
                background: `linear-gradient(to right,
                  hsl(0, ${hsl.s}%, ${hsl.l}%),
                  hsl(60, ${hsl.s}%, ${hsl.l}%),
                  hsl(120, ${hsl.s}%, ${hsl.l}%),
                  hsl(180, ${hsl.s}%, ${hsl.l}%),
                  hsl(240, ${hsl.s}%, ${hsl.l}%),
                  hsl(300, ${hsl.s}%, ${hsl.l}%),
                  hsl(360, ${hsl.s}%, ${hsl.l}%)
                )`,
              }}
            />
          </div>

          {/* Saturation Slider */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label htmlFor="saturation" className="text-sm font-medium">
                Saturation
              </Label>
              <span className="text-sm text-muted-foreground font-mono">
                {hsl.s}%
              </span>
            </div>
            <Slider
              id="saturation"
              min={0}
              max={100}
              step={1}
              value={[hsl.s]}
              onValueChange={([v]) => handleHslChange("s", v)}
              className="w-full"
              style={{
                background: `linear-gradient(to right,
                  hsl(${hsl.h}, 0%, ${hsl.l}%),
                  hsl(${hsl.h}, 100%, ${hsl.l}%)
                )`,
              }}
            />
          </div>

          {/* Lightness Slider */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label htmlFor="lightness" className="text-sm font-medium">
                Lightness
              </Label>
              <span className="text-sm text-muted-foreground font-mono">
                {hsl.l}%
              </span>
            </div>
            <Slider
              id="lightness"
              min={0}
              max={100}
              step={1}
              value={[hsl.l]}
              onValueChange={([v]) => handleHslChange("l", v)}
              className="w-full"
              style={{
                background: `linear-gradient(to right,
                  hsl(${hsl.h}, ${hsl.s}%, 0%),
                  hsl(${hsl.h}, ${hsl.s}%, 50%),
                  hsl(${hsl.h}, ${hsl.s}%, 100%)
                )`,
              }}
            />
          </div>
        </TabsContent>

        {/* Hex Input Mode */}
        <TabsContent value="hex" className="space-y-4 mt-4">
          <div className="space-y-2">
            <Label htmlFor="hex-input" className="text-sm font-medium">
              Hex Color Code
            </Label>
            <div className="flex gap-2">
              <div className="relative flex-1">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                  #
                </span>
                <Input
                  id="hex-input"
                  type="text"
                  value={hexValue.replace("#", "")}
                  onChange={(e) => handleHexChange("#" + e.target.value)}
                  placeholder="3b82f6"
                  maxLength={6}
                  className="pl-7 font-mono uppercase"
                />
              </div>
              <div
                className="w-12 h-10 rounded border-2 border-border"
                style={{ backgroundColor: hexValue }}
              />
            </div>
            <p className="text-xs text-muted-foreground">
              Enter a 6-digit hex color code (e.g., 3b82f6)
            </p>
          </div>
        </TabsContent>
      </Tabs>

      {/* Quick Color Presets */}
      <div className="space-y-2">
        <Label className="text-sm font-medium">Quick Presets</Label>
        <div className="grid grid-cols-8 gap-2">
          {[
            { name: "Red", hsl: "0 80% 50%" },
            { name: "Orange", hsl: "30 90% 55%" },
            { name: "Yellow", hsl: "50 95% 60%" },
            { name: "Green", hsl: "120 70% 45%" },
            { name: "Blue", hsl: "220 85% 55%" },
            { name: "Purple", hsl: "270 80% 60%" },
            { name: "Pink", hsl: "330 75% 65%" },
            { name: "Gray", hsl: "0 0% 50%" },
          ].map((preset) => {
            const presetHsl = parseHslString(preset.hsl);
            const presetColor = `hsl(${presetHsl.h}, ${presetHsl.s}%, ${presetHsl.l}%)`;

            return (
              <button
                key={preset.name}
                type="button"
                onClick={() => onChange(preset.hsl)}
                className="w-8 h-8 rounded border-2 border-border hover:border-primary transition-colors"
                style={{ backgroundColor: presetColor }}
                title={preset.name}
              />
            );
          })}
        </div>
      </div>
    </div>
  );
}
