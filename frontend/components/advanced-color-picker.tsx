"use client";

import * as React from "react";
import {
  Palette,
  Copy,
  Star,
  StarOff,
  Pipette,
  History,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";

type ColorMode = "hex" | "rgb" | "hsl";

interface ColorValue {
  hex: string;
  rgb: { r: number; g: number; b: number };
  hsl: { h: number; s: number; l: number };
  opacity: number;
}

export function AdvancedColorPicker() {
  const { toast } = useToast();

  const [color, setColor] = React.useState<ColorValue>({
    hex: "#3B82F6",
    rgb: { r: 59, g: 130, b: 246 },
    hsl: { h: 217, s: 91, l: 60 },
    opacity: 1,
  });

  const [mode, setMode] = React.useState<ColorMode>("hex");
  const [recentColors, setRecentColors] = React.useState<string[]>([]);
  const [favoriteColors, setFavoriteColors] = React.useState<string[]>(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("favoriteColors");
      return saved ? JSON.parse(saved) : [];
    }
    return [];
  });

  // Save favorites to localStorage
  React.useEffect(() => {
    if (typeof window !== "undefined") {
      localStorage.setItem("favoriteColors", JSON.stringify(favoriteColors));
    }
  }, [favoriteColors]);

  // Helper: Convert hex to RGB
  const hexToRgb = (hex: string): { r: number; g: number; b: number } => {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result
      ? {
          r: parseInt(result[1], 16),
          g: parseInt(result[2], 16),
          b: parseInt(result[3], 16),
        }
      : { r: 0, g: 0, b: 0 };
  };

  // Helper: Convert RGB to hex
  const rgbToHex = (r: number, g: number, b: number): string => {
    return (
      "#" +
      [r, g, b]
        .map((x) => {
          const hex = Math.round(x).toString(16);
          return hex.length === 1 ? "0" + hex : hex;
        })
        .join("")
    );
  };

  // Helper: Convert RGB to HSL
  const rgbToHsl = (
    r: number,
    g: number,
    b: number
  ): { h: number; s: number; l: number } => {
    r /= 255;
    g /= 255;
    b /= 255;

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

    return { h: Math.round(h * 360), s: Math.round(s * 100), l: Math.round(l * 100) };
  };

  // Helper: Convert HSL to RGB
  const hslToRgb = (
    h: number,
    s: number,
    l: number
  ): { r: number; g: number; b: number } => {
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

    return {
      r: Math.round((r + m) * 255),
      g: Math.round((g + m) * 255),
      b: Math.round((b + m) * 255),
    };
  };

  // Update color from hex
  const updateFromHex = (hex: string) => {
    const rgb = hexToRgb(hex);
    const hsl = rgbToHsl(rgb.r, rgb.g, rgb.b);
    setColor({ hex, rgb, hsl, opacity: color.opacity });
    addToRecent(hex);
  };

  // Update color from RGB
  const updateFromRgb = (r: number, g: number, b: number) => {
    const hex = rgbToHex(r, g, b);
    const hsl = rgbToHsl(r, g, b);
    setColor({ hex, rgb: { r, g, b }, hsl, opacity: color.opacity });
    addToRecent(hex);
  };

  // Update color from HSL
  const updateFromHsl = (h: number, s: number, l: number) => {
    const rgb = hslToRgb(h, s, l);
    const hex = rgbToHex(rgb.r, rgb.g, rgb.b);
    setColor({ hex, rgb, hsl: { h, s, l }, opacity: color.opacity });
    addToRecent(hex);
  };

  // Add to recent colors
  const addToRecent = (hex: string) => {
    setRecentColors((prev) => {
      const filtered = prev.filter((c) => c !== hex);
      return [hex, ...filtered].slice(0, 10);
    });
  };

  // Toggle favorite
  const toggleFavorite = () => {
    if (favoriteColors.includes(color.hex)) {
      setFavoriteColors(favoriteColors.filter((c) => c !== color.hex));
      toast({
        title: "Removed from Favorites",
        description: `${color.hex} removed.`,
      });
    } else {
      if (favoriteColors.length >= 20) {
        toast({
          title: "Maximum Reached",
          description: "You can save up to 20 favorite colors.",
          variant: "destructive",
        });
        return;
      }
      setFavoriteColors([...favoriteColors, color.hex]);
      toast({
        title: "Added to Favorites",
        description: `${color.hex} saved.`,
      });
    }
  };

  // Copy to clipboard
  const copyToClipboard = (format: "hex" | "rgb" | "rgba" | "hsl" | "hsla") => {
    let value = "";

    switch (format) {
      case "hex":
        value = color.hex;
        break;
      case "rgb":
        value = `rgb(${color.rgb.r}, ${color.rgb.g}, ${color.rgb.b})`;
        break;
      case "rgba":
        value = `rgba(${color.rgb.r}, ${color.rgb.g}, ${color.rgb.b}, ${color.opacity})`;
        break;
      case "hsl":
        value = `hsl(${color.hsl.h}, ${color.hsl.s}%, ${color.hsl.l}%)`;
        break;
      case "hsla":
        value = `hsla(${color.hsl.h}, ${color.hsl.s}%, ${color.hsl.l}%, ${color.opacity})`;
        break;
    }

    navigator.clipboard.writeText(value);
    toast({
      title: "Copied!",
      description: `${value} copied to clipboard.`,
    });
  };

  // Eyedropper (if supported)
  const useEyedropper = async () => {
    if (!("EyeDropper" in window)) {
      toast({
        title: "Not Supported",
        description: "Eyedropper is not supported in your browser.",
        variant: "destructive",
      });
      return;
    }

    try {
      // @ts-ignore - EyeDropper API not in TypeScript types yet
      const eyeDropper = new EyeDropper();
      const result = await eyeDropper.open();
      updateFromHex(result.sRGBHex);
      toast({
        title: "Color Picked",
        description: `${result.sRGBHex} selected.`,
      });
    } catch (error) {
      // User cancelled
    }
  };

  const isFavorite = favoriteColors.includes(color.hex);

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Palette className="h-5 w-5" />
          Advanced Color Picker
        </CardTitle>
        <CardDescription>
          Pick colors with multiple formats and history
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Preview */}
        <div className="space-y-2">
          <Label>Preview</Label>
          <div
            className="w-full h-24 rounded-lg border-2 border-border"
            style={{
              backgroundColor: color.hex,
              opacity: color.opacity,
            }}
          />
        </div>

        {/* Color Input Modes */}
        <Tabs value={mode} onValueChange={(v) => setMode(v as ColorMode)}>
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="hex">HEX</TabsTrigger>
            <TabsTrigger value="rgb">RGB</TabsTrigger>
            <TabsTrigger value="hsl">HSL</TabsTrigger>
          </TabsList>

          <TabsContent value="hex" className="space-y-3 pt-4">
            <div className="flex gap-2">
              <input
                type="color"
                value={color.hex}
                onChange={(e) => updateFromHex(e.target.value)}
                className="h-12 w-20 rounded border cursor-pointer"
              />
              <Input
                value={color.hex}
                onChange={(e) => updateFromHex(e.target.value)}
                className="font-mono"
                placeholder="#3B82F6"
              />
            </div>
          </TabsContent>

          <TabsContent value="rgb" className="space-y-3 pt-4">
            <div className="space-y-3">
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <Label>Red</Label>
                  <span>{color.rgb.r}</span>
                </div>
                <Slider
                  value={[color.rgb.r]}
                  onValueChange={([r]) => updateFromRgb(r, color.rgb.g, color.rgb.b)}
                  min={0}
                  max={255}
                  step={1}
                />
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <Label>Green</Label>
                  <span>{color.rgb.g}</span>
                </div>
                <Slider
                  value={[color.rgb.g]}
                  onValueChange={([g]) => updateFromRgb(color.rgb.r, g, color.rgb.b)}
                  min={0}
                  max={255}
                  step={1}
                />
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <Label>Blue</Label>
                  <span>{color.rgb.b}</span>
                </div>
                <Slider
                  value={[color.rgb.b]}
                  onValueChange={([b]) => updateFromRgb(color.rgb.r, color.rgb.g, b)}
                  min={0}
                  max={255}
                  step={1}
                />
              </div>
            </div>
          </TabsContent>

          <TabsContent value="hsl" className="space-y-3 pt-4">
            <div className="space-y-3">
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <Label>Hue</Label>
                  <span>{color.hsl.h}°</span>
                </div>
                <Slider
                  value={[color.hsl.h]}
                  onValueChange={([h]) => updateFromHsl(h, color.hsl.s, color.hsl.l)}
                  min={0}
                  max={360}
                  step={1}
                />
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <Label>Saturation</Label>
                  <span>{color.hsl.s}%</span>
                </div>
                <Slider
                  value={[color.hsl.s]}
                  onValueChange={([s]) => updateFromHsl(color.hsl.h, s, color.hsl.l)}
                  min={0}
                  max={100}
                  step={1}
                />
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <Label>Lightness</Label>
                  <span>{color.hsl.l}%</span>
                </div>
                <Slider
                  value={[color.hsl.l]}
                  onValueChange={([l]) => updateFromHsl(color.hsl.h, color.hsl.s, l)}
                  min={0}
                  max={100}
                  step={1}
                />
              </div>
            </div>
          </TabsContent>
        </Tabs>

        {/* Opacity */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs">
            <Label>Opacity</Label>
            <span>{Math.round(color.opacity * 100)}%</span>
          </div>
          <Slider
            value={[color.opacity * 100]}
            onValueChange={([opacity]) =>
              setColor({ ...color, opacity: opacity / 100 })
            }
            min={0}
            max={100}
            step={1}
          />
        </div>

        {/* Actions */}
        <div className="grid grid-cols-2 gap-2">
          <Button variant="outline" onClick={toggleFavorite}>
            {isFavorite ? (
              <Star className="h-4 w-4 mr-2 fill-current" />
            ) : (
              <StarOff className="h-4 w-4 mr-2" />
            )}
            {isFavorite ? "Unfavorite" : "Favorite"}
          </Button>
          <Button variant="outline" onClick={useEyedropper}>
            <Pipette className="h-4 w-4 mr-2" />
            Eyedropper
          </Button>
        </div>

        {/* Copy Formats */}
        <div className="space-y-2">
          <Label>Copy As</Label>
          <div className="grid grid-cols-2 gap-2">
            <Button variant="outline" size="sm" onClick={() => copyToClipboard("hex")}>
              <Copy className="h-3 w-3 mr-2" />
              HEX
            </Button>
            <Button variant="outline" size="sm" onClick={() => copyToClipboard("rgb")}>
              <Copy className="h-3 w-3 mr-2" />
              RGB
            </Button>
            <Button variant="outline" size="sm" onClick={() => copyToClipboard("rgba")}>
              <Copy className="h-3 w-3 mr-2" />
              RGBA
            </Button>
            <Button variant="outline" size="sm" onClick={() => copyToClipboard("hsl")}>
              <Copy className="h-3 w-3 mr-2" />
              HSL
            </Button>
          </div>
        </div>

        {/* Recent Colors */}
        {recentColors.length > 0 && (
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <History className="h-4 w-4" />
              <Label>Recent Colors</Label>
            </div>
            <div className="grid grid-cols-5 gap-2">
              {recentColors.map((recentColor, index) => (
                <button
                  key={index}
                  onClick={() => updateFromHex(recentColor)}
                  className="h-12 rounded border-2 border-border hover:border-primary transition-colors"
                  style={{ backgroundColor: recentColor }}
                  title={recentColor}
                />
              ))}
            </div>
          </div>
        )}

        {/* Favorite Colors */}
        {favoriteColors.length > 0 && (
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Star className="h-4 w-4 fill-current" />
              <Label>Favorite Colors</Label>
            </div>
            <div className="grid grid-cols-5 gap-2">
              {favoriteColors.map((favColor, index) => (
                <button
                  key={index}
                  onClick={() => updateFromHex(favColor)}
                  className="h-12 rounded border-2 border-border hover:border-primary transition-colors"
                  style={{ backgroundColor: favColor }}
                  title={favColor}
                />
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
