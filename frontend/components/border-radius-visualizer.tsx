"use client";

import * as React from "react";
import { Box, Copy, Link2, Link2Off } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";

interface BorderRadiusPreset {
  name: string;
  value: string;
  corners: { tl: number; tr: number; br: number; bl: number };
}

const PRESETS: BorderRadiusPreset[] = [
  { name: "Sharp", value: "0px", corners: { tl: 0, tr: 0, br: 0, bl: 0 } },
  { name: "Soft", value: "4px", corners: { tl: 4, tr: 4, br: 4, bl: 4 } },
  { name: "Round", value: "12px", corners: { tl: 12, tr: 12, br: 12, bl: 12 } },
  {
    name: "Extra Round",
    value: "20px",
    corners: { tl: 20, tr: 20, br: 20, bl: 20 },
  },
  {
    name: "Pill",
    value: "9999px",
    corners: { tl: 9999, tr: 9999, br: 9999, bl: 9999 },
  },
  {
    name: "Top Round",
    value: "12px 12px 0 0",
    corners: { tl: 12, tr: 12, br: 0, bl: 0 },
  },
  {
    name: "Bottom Round",
    value: "0 0 12px 12px",
    corners: { tl: 0, tr: 0, br: 12, bl: 12 },
  },
  {
    name: "Asymmetric",
    value: "20px 0 20px 0",
    corners: { tl: 20, tr: 0, br: 20, bl: 0 },
  },
];

export function BorderRadiusVisualizer() {
  const { toast } = useToast();

  const [topLeft, setTopLeft] = React.useState(12);
  const [topRight, setTopRight] = React.useState(12);
  const [bottomRight, setBottomRight] = React.useState(12);
  const [bottomLeft, setBottomLeft] = React.useState(12);
  const [linked, setLinked] = React.useState(true);

  // Generate CSS border-radius
  const borderRadiusCSS = React.useMemo(() => {
    if (
      topLeft === topRight &&
      topRight === bottomRight &&
      bottomRight === bottomLeft
    ) {
      return `${topLeft}px`;
    }
    return `${topLeft}px ${topRight}px ${bottomRight}px ${bottomLeft}px`;
  }, [topLeft, topRight, bottomRight, bottomLeft]);

  // Update all corners
  const updateAllCorners = (value: number) => {
    setTopLeft(value);
    setTopRight(value);
    setBottomRight(value);
    setBottomLeft(value);
  };

  // Apply preset
  const applyPreset = (preset: BorderRadiusPreset) => {
    setTopLeft(preset.corners.tl);
    setTopRight(preset.corners.tr);
    setBottomRight(preset.corners.br);
    setBottomLeft(preset.corners.bl);
    toast({
      title: "Preset Applied",
      description: `"${preset.name}" border radius applied.`,
    });
  };

  // Copy CSS to clipboard
  const copyCSS = async () => {
    try {
      await navigator.clipboard.writeText(`border-radius: ${borderRadiusCSS};`);
      toast({
        title: "Copied!",
        description: "CSS border-radius code copied to clipboard.",
      });
    } catch (error) {
      toast({
        title: "Copy Failed",
        description: "Failed to copy to clipboard.",
        variant: "destructive",
      });
    }
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Box className="h-5 w-5" />
          Border Radius Visualizer
        </CardTitle>
        <CardDescription>
          Customize border radius with live preview
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Live Preview */}
        <div className="space-y-2">
          <Label>Live Preview</Label>
          <div className="w-full h-64 rounded-lg bg-gradient-to-br from-muted to-muted/50 flex items-center justify-center p-8">
            <div
              className="w-48 h-48 bg-primary transition-all duration-300"
              style={{ borderRadius: borderRadiusCSS }}
            >
              <div className="h-full flex items-center justify-center">
                <Box className="h-12 w-12 text-primary-foreground" />
              </div>
            </div>
          </div>
        </div>

        {/* Link/Unlink Toggle */}
        <div className="flex items-center justify-between p-3 rounded-lg border bg-muted/30">
          <Label className="text-sm">Link All Corners</Label>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setLinked(!linked)}
            className="h-8"
          >
            {linked ? (
              <>
                <Link2 className="h-4 w-4 mr-2" />
                Linked
              </>
            ) : (
              <>
                <Link2Off className="h-4 w-4 mr-2" />
                Unlinked
              </>
            )}
          </Button>
        </div>

        {/* Radius Controls */}
        {linked ? (
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs">
              <Label>All Corners</Label>
              <span className="text-muted-foreground">{topLeft}px</span>
            </div>
            <Slider
              value={[topLeft]}
              onValueChange={([value]) => updateAllCorners(value)}
              min={0}
              max={100}
              step={1}
            />
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-4">
            {/* Top Left */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs">
                <Label>Top Left</Label>
                <span className="text-muted-foreground">{topLeft}px</span>
              </div>
              <Slider
                value={[topLeft]}
                onValueChange={([value]) => setTopLeft(value)}
                min={0}
                max={100}
                step={1}
              />
            </div>

            {/* Top Right */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs">
                <Label>Top Right</Label>
                <span className="text-muted-foreground">{topRight}px</span>
              </div>
              <Slider
                value={[topRight]}
                onValueChange={([value]) => setTopRight(value)}
                min={0}
                max={100}
                step={1}
              />
            </div>

            {/* Bottom Right */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs">
                <Label>Bottom Right</Label>
                <span className="text-muted-foreground">{bottomRight}px</span>
              </div>
              <Slider
                value={[bottomRight]}
                onValueChange={([value]) => setBottomRight(value)}
                min={0}
                max={100}
                step={1}
              />
            </div>

            {/* Bottom Left */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs">
                <Label>Bottom Left</Label>
                <span className="text-muted-foreground">{bottomLeft}px</span>
              </div>
              <Slider
                value={[bottomLeft]}
                onValueChange={([value]) => setBottomLeft(value)}
                min={0}
                max={100}
                step={1}
              />
            </div>
          </div>
        )}

        {/* Presets */}
        <div className="space-y-3">
          <Label>Presets</Label>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {PRESETS.map((preset) => (
              <button
                key={preset.name}
                onClick={() => applyPreset(preset)}
                className="h-20 rounded-lg border-2 border-border hover:border-primary transition-all bg-background group relative overflow-hidden"
              >
                <div
                  className="absolute inset-4 bg-primary transition-all"
                  style={{
                    borderRadius: `${preset.corners.tl}px ${preset.corners.tr}px ${preset.corners.br}px ${preset.corners.bl}px`,
                  }}
                />
                <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                  <span className="text-white text-xs font-medium">
                    {preset.name}
                  </span>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Actions */}
        <div className="grid grid-cols-1 gap-2 pt-4 border-t">
          <Button onClick={copyCSS} variant="outline">
            <Copy className="h-4 w-4 mr-2" />
            Copy CSS
          </Button>
        </div>

        {/* CSS Code Display */}
        <div className="space-y-2">
          <Label>CSS Code</Label>
          <div className="relative">
            <code className="block p-3 bg-muted rounded-lg text-xs font-mono overflow-x-auto">
              border-radius: {borderRadiusCSS};
            </code>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
