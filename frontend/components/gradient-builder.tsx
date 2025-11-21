"use client";

import * as React from "react";
import {
  Palette,
  Plus,
  Trash2,
  Copy,
  Download,
  Upload,
  RotateCw,
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";

type GradientType = "linear" | "radial" | "conic";
type RadialPosition =
  | "center"
  | "top"
  | "bottom"
  | "left"
  | "right"
  | "top-left"
  | "top-right"
  | "bottom-left"
  | "bottom-right";

interface ColorStop {
  color: string;
  position: number;
}

interface GradientPreset {
  name: string;
  type: GradientType;
  angle?: number;
  position?: RadialPosition;
  stops: ColorStop[];
}

const GRADIENT_PRESETS: GradientPreset[] = [
  {
    name: "Sunset",
    type: "linear",
    angle: 135,
    stops: [
      { color: "#FF512F", position: 0 },
      { color: "#DD2476", position: 100 },
    ],
  },
  {
    name: "Ocean",
    type: "linear",
    angle: 180,
    stops: [
      { color: "#2E3192", position: 0 },
      { color: "#1BFFFF", position: 100 },
    ],
  },
  {
    name: "Neon",
    type: "linear",
    angle: 45,
    stops: [
      { color: "#B06AB3", position: 0 },
      { color: "#4568DC", position: 100 },
    ],
  },
  {
    name: "Forest",
    type: "linear",
    angle: 90,
    stops: [
      { color: "#134E5E", position: 0 },
      { color: "#71B280", position: 100 },
    ],
  },
  {
    name: "Aurora",
    type: "radial",
    position: "center",
    stops: [
      { color: "#00C9FF", position: 0 },
      { color: "#92FE9D", position: 100 },
    ],
  },
  {
    name: "Fire",
    type: "linear",
    angle: 180,
    stops: [
      { color: "#FF0000", position: 0 },
      { color: "#FFA500", position: 50 },
      { color: "#FFFF00", position: 100 },
    ],
  },
  {
    name: "Cotton Candy",
    type: "linear",
    angle: 120,
    stops: [
      { color: "#FEC5BB", position: 0 },
      { color: "#FFC8DD", position: 50 },
      { color: "#CDB4DB", position: 100 },
    ],
  },
  {
    name: "Purple Haze",
    type: "linear",
    angle: 45,
    stops: [
      { color: "#360033", position: 0 },
      { color: "#0b8793", position: 100 },
    ],
  },
  {
    name: "Emerald",
    type: "radial",
    position: "center",
    stops: [
      { color: "#348F50", position: 0 },
      { color: "#56B4D3", position: 100 },
    ],
  },
  {
    name: "Cosmic",
    type: "conic",
    angle: 0,
    stops: [
      { color: "#FF006E", position: 0 },
      { color: "#8338EC", position: 33 },
      { color: "#3A86FF", position: 66 },
      { color: "#FF006E", position: 100 },
    ],
  },
];

export function GradientBuilder() {
  const { toast } = useToast();

  const [gradientType, setGradientType] = React.useState<GradientType>("linear");
  const [angle, setAngle] = React.useState(90);
  const [radialPosition, setRadialPosition] = React.useState<RadialPosition>("center");
  const [stops, setStops] = React.useState<ColorStop[]>([
    { color: "#3B82F6", position: 0 },
    { color: "#8B5CF6", position: 100 },
  ]);

  // Generate CSS gradient string
  const gradientCSS = React.useMemo(() => {
    const sortedStops = [...stops].sort((a, b) => a.position - b.position);
    const stopsString = sortedStops
      .map((stop) => `${stop.color} ${stop.position}%`)
      .join(", ");

    switch (gradientType) {
      case "linear":
        return `linear-gradient(${angle}deg, ${stopsString})`;
      case "radial":
        return `radial-gradient(circle at ${radialPosition}, ${stopsString})`;
      case "conic":
        return `conic-gradient(from ${angle}deg, ${stopsString})`;
      default:
        return "";
    }
  }, [gradientType, angle, radialPosition, stops]);

  // Add new color stop
  const addStop = () => {
    if (stops.length >= 10) {
      toast({
        title: "Maximum Reached",
        description: "You can have a maximum of 10 color stops.",
        variant: "destructive",
      });
      return;
    }

    const newPosition = 50; // Add at middle
    setStops([...stops, { color: "#000000", position: newPosition }]);
  };

  // Remove color stop
  const removeStop = (index: number) => {
    if (stops.length <= 2) {
      toast({
        title: "Minimum Required",
        description: "You need at least 2 color stops.",
        variant: "destructive",
      });
      return;
    }
    setStops(stops.filter((_, i) => i !== index));
  };

  // Update stop color
  const updateStopColor = (index: number, color: string) => {
    const newStops = [...stops];
    newStops[index].color = color;
    setStops(newStops);
  };

  // Update stop position
  const updateStopPosition = (index: number, position: number) => {
    const newStops = [...stops];
    newStops[index].position = position;
    setStops(newStops);
  };

  // Apply preset
  const applyPreset = (preset: GradientPreset) => {
    setGradientType(preset.type);
    setStops(preset.stops);
    if (preset.angle !== undefined) {
      setAngle(preset.angle);
    }
    if (preset.position) {
      setRadialPosition(preset.position);
    }
    toast({
      title: "Preset Applied",
      description: `"${preset.name}" gradient loaded.`,
    });
  };

  // Copy CSS to clipboard
  const copyCSS = async () => {
    try {
      await navigator.clipboard.writeText(`background: ${gradientCSS};`);
      toast({
        title: "Copied!",
        description: "CSS gradient code copied to clipboard.",
      });
    } catch (error) {
      toast({
        title: "Copy Failed",
        description: "Failed to copy to clipboard.",
        variant: "destructive",
      });
    }
  };

  // Export as JSON
  const exportJSON = () => {
    const data = {
      name: "Custom Gradient",
      type: gradientType,
      angle: gradientType !== "radial" ? angle : undefined,
      position: gradientType === "radial" ? radialPosition : undefined,
      stops,
    };

    const blob = new Blob([JSON.stringify(data, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "gradient.json";
    a.click();
    URL.revokeObjectURL(url);

    toast({
      title: "Exported",
      description: "Gradient exported as JSON.",
    });
  };

  // Import from JSON
  const importJSON = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = JSON.parse(e.target?.result as string);

        if (!data.type || !data.stops || !Array.isArray(data.stops)) {
          throw new Error("Invalid gradient file structure");
        }

        setGradientType(data.type);
        setStops(data.stops);
        if (data.angle !== undefined) {
          setAngle(data.angle);
        }
        if (data.position) {
          setRadialPosition(data.position);
        }

        toast({
          title: "Imported",
          description: "Gradient loaded from JSON.",
        });
      } catch (error) {
        toast({
          title: "Import Failed",
          description: error instanceof Error ? error.message : "Invalid JSON file.",
          variant: "destructive",
        });
      }
    };
    reader.readAsText(file);
    event.target.value = ""; // Reset input
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Palette className="h-5 w-5" />
          Gradient Builder
        </CardTitle>
        <CardDescription>
          Create beautiful CSS gradients with live preview
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Live Preview */}
        <div className="space-y-2">
          <Label>Live Preview</Label>
          <div
            className="w-full h-48 rounded-lg border-2 border-border transition-all duration-300"
            style={{ background: gradientCSS }}
          />
        </div>

        {/* Gradient Type */}
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Gradient Type</Label>
              <Select
                value={gradientType}
                onValueChange={(value) => setGradientType(value as GradientType)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="linear">Linear</SelectItem>
                  <SelectItem value="radial">Radial</SelectItem>
                  <SelectItem value="conic">Conic</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {gradientType !== "radial" && (
              <div className="space-y-2">
                <Label>Angle: {angle}°</Label>
                <Slider
                  value={[angle]}
                  onValueChange={([value]) => setAngle(value)}
                  min={0}
                  max={360}
                  step={1}
                  className="pt-2"
                />
              </div>
            )}

            {gradientType === "radial" && (
              <div className="space-y-2">
                <Label>Position</Label>
                <Select
                  value={radialPosition}
                  onValueChange={(value) =>
                    setRadialPosition(value as RadialPosition)
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="center">Center</SelectItem>
                    <SelectItem value="top">Top</SelectItem>
                    <SelectItem value="bottom">Bottom</SelectItem>
                    <SelectItem value="left">Left</SelectItem>
                    <SelectItem value="right">Right</SelectItem>
                    <SelectItem value="top-left">Top Left</SelectItem>
                    <SelectItem value="top-right">Top Right</SelectItem>
                    <SelectItem value="bottom-left">Bottom Left</SelectItem>
                    <SelectItem value="bottom-right">Bottom Right</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>
        </div>

        {/* Color Stops */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <Label>Color Stops</Label>
            <Badge variant="secondary">{stops.length} stops</Badge>
          </div>

          <div className="space-y-3">
            {stops.map((stop, index) => (
              <div
                key={index}
                className="p-3 border rounded-lg space-y-3 bg-muted/30"
              >
                <div className="flex items-center gap-2">
                  <div className="flex items-center gap-2 flex-1">
                    <input
                      type="color"
                      value={stop.color}
                      onChange={(e) => updateStopColor(index, e.target.value)}
                      className="h-10 w-16 rounded border cursor-pointer"
                    />
                    <Input
                      value={stop.color}
                      onChange={(e) => updateStopColor(index, e.target.value)}
                      className="font-mono text-sm"
                      placeholder="#000000"
                    />
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => removeStop(index)}
                    disabled={stops.length <= 2}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>

                <div className="space-y-1">
                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <span>Position</span>
                    <span>{stop.position}%</span>
                  </div>
                  <Slider
                    value={[stop.position]}
                    onValueChange={([value]) => updateStopPosition(index, value)}
                    min={0}
                    max={100}
                    step={1}
                  />
                </div>
              </div>
            ))}
          </div>

          <Button
            variant="outline"
            className="w-full"
            onClick={addStop}
            disabled={stops.length >= 10}
          >
            <Plus className="h-4 w-4 mr-2" />
            Add Color Stop
          </Button>
        </div>

        {/* Preset Gradients */}
        <div className="space-y-3">
          <Label>Preset Gradients</Label>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {GRADIENT_PRESETS.map((preset) => {
              const presetGradient = (() => {
                const sortedStops = [...preset.stops].sort(
                  (a, b) => a.position - b.position
                );
                const stopsString = sortedStops
                  .map((s) => `${s.color} ${s.position}%`)
                  .join(", ");

                switch (preset.type) {
                  case "linear":
                    return `linear-gradient(${preset.angle || 90}deg, ${stopsString})`;
                  case "radial":
                    return `radial-gradient(circle at ${
                      preset.position || "center"
                    }, ${stopsString})`;
                  case "conic":
                    return `conic-gradient(from ${
                      preset.angle || 0
                    }deg, ${stopsString})`;
                  default:
                    return "";
                }
              })();

              return (
                <button
                  key={preset.name}
                  onClick={() => applyPreset(preset)}
                  className="relative h-20 rounded-lg border-2 border-border hover:border-primary transition-all overflow-hidden group"
                  style={{ background: presetGradient }}
                >
                  <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <span className="text-white text-sm font-medium">
                      {preset.name}
                    </span>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Actions */}
        <div className="grid grid-cols-2 gap-2 pt-4 border-t">
          <Button onClick={copyCSS} variant="outline">
            <Copy className="h-4 w-4 mr-2" />
            Copy CSS
          </Button>
          <Button onClick={exportJSON} variant="outline">
            <Download className="h-4 w-4 mr-2" />
            Export JSON
          </Button>
          <Button variant="outline" asChild className="col-span-2">
            <label className="cursor-pointer">
              <Upload className="h-4 w-4 mr-2" />
              Import JSON
              <input
                type="file"
                accept=".json"
                className="hidden"
                onChange={importJSON}
              />
            </label>
          </Button>
        </div>

        {/* CSS Code Display */}
        <div className="space-y-2">
          <Label>CSS Code</Label>
          <div className="relative">
            <code className="block p-3 bg-muted rounded-lg text-xs font-mono overflow-x-auto">
              background: {gradientCSS};
            </code>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
