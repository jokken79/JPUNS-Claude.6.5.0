"use client";

import * as React from "react";
import {
  BookOpen,
  Copy,
  Download,
  Search,
  Palette,
  Type,
  Box,
  Sun,
  Zap,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
import { exportAndDownload, type DesignTokens } from "@/lib/css-export";

export default function DesignSystemPage() {
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = React.useState("");

  // Design tokens (example data - in real app, this would come from theme)
  const designTokens: DesignTokens = {
    colors: {
      "primary": "#3B82F6",
      "primary-foreground": "#FFFFFF",
      "secondary": "#10B981",
      "secondary-foreground": "#FFFFFF",
      "accent": "#8B5CF6",
      "accent-foreground": "#FFFFFF",
      "background": "#FFFFFF",
      "foreground": "#0F172A",
      "card": "#F8FAFC",
      "border": "#E2E8F0",
      "muted": "#F1F5F9",
    },
    typography: {
      fontFamily: "Inter, sans-serif",
      fontSizes: {
        "xs": "0.75rem",
        "sm": "0.875rem",
        "base": "1rem",
        "lg": "1.125rem",
        "xl": "1.25rem",
        "2xl": "1.5rem",
        "3xl": "1.875rem",
        "4xl": "2.25rem",
      },
      fontWeights: {
        "light": "300",
        "normal": "400",
        "medium": "500",
        "semibold": "600",
        "bold": "700",
      },
      lineHeights: {
        "tight": "1.25",
        "normal": "1.5",
        "relaxed": "1.75",
      },
    },
    spacing: {
      "0": "0",
      "1": "0.25rem",
      "2": "0.5rem",
      "3": "0.75rem",
      "4": "1rem",
      "6": "1.5rem",
      "8": "2rem",
      "12": "3rem",
      "16": "4rem",
      "24": "6rem",
    },
    shadows: {
      "sm": "0 1px 2px rgba(0, 0, 0, 0.05)",
      "md": "0 4px 12px rgba(0, 0, 0, 0.1)",
      "lg": "0 10px 25px rgba(0, 0, 0, 0.15)",
      "xl": "0 20px 40px rgba(0, 0, 0, 0.2)",
    },
    borderRadius: {
      "sm": "0.25rem",
      "md": "0.5rem",
      "lg": "0.75rem",
      "xl": "1rem",
      "full": "9999px",
    },
  };

  // Copy token to clipboard
  const copyToken = async (name: string, value: string) => {
    try {
      await navigator.clipboard.writeText(value);
      toast({
        title: "Copied!",
        description: `${name}: ${value} copied to clipboard.`,
      });
    } catch (error) {
      toast({
        title: "Copy Failed",
        description: "Failed to copy to clipboard.",
        variant: "destructive",
      });
    }
  };

  // Export full design system
  const exportDesignSystem = (format: "css" | "tailwind" | "scss" | "json") => {
    exportAndDownload(designTokens, format);
    toast({
      title: "Exported!",
      description: `Design system exported as ${format.toUpperCase()}.`,
    });
  };

  return (
    <div className="container mx-auto py-8 px-4 max-w-7xl">
      {/* Page Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <BookOpen className="h-8 w-8 text-primary" />
          <h1 className="text-4xl font-bold">Design System</h1>
        </div>
        <p className="text-lg text-muted-foreground">
          Complete documentation of all design tokens and components
        </p>
      </div>

      {/* Search & Export */}
      <div className="flex flex-col sm:flex-row gap-4 mb-8">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search design tokens..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => exportDesignSystem("css")}
          >
            <Download className="h-4 w-4 mr-2" />
            CSS
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => exportDesignSystem("tailwind")}
          >
            <Download className="h-4 w-4 mr-2" />
            Tailwind
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => exportDesignSystem("json")}
          >
            <Download className="h-4 w-4 mr-2" />
            JSON
          </Button>
        </div>
      </div>

      {/* Design Tokens Tabs */}
      <Tabs defaultValue="colors" className="space-y-6">
        <TabsList>
          <TabsTrigger value="colors">
            <Palette className="h-4 w-4 mr-2" />
            Colors
          </TabsTrigger>
          <TabsTrigger value="typography">
            <Type className="h-4 w-4 mr-2" />
            Typography
          </TabsTrigger>
          <TabsTrigger value="spacing">
            <Box className="h-4 w-4 mr-2" />
            Spacing
          </TabsTrigger>
          <TabsTrigger value="shadows">
            <Sun className="h-4 w-4 mr-2" />
            Shadows
          </TabsTrigger>
          <TabsTrigger value="other">
            <Zap className="h-4 w-4 mr-2" />
            Other
          </TabsTrigger>
        </TabsList>

        {/* Colors Tab */}
        <TabsContent value="colors" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Color Palette</CardTitle>
              <CardDescription>
                Primary, secondary, and semantic colors used throughout the system
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {designTokens.colors &&
                  Object.entries(designTokens.colors)
                    .filter(([name]) =>
                      name.toLowerCase().includes(searchQuery.toLowerCase())
                    )
                    .map(([name, value]) => (
                      <div
                        key={name}
                        className="flex items-center gap-3 p-3 rounded-lg border bg-muted/30 hover:bg-muted/50 transition-colors group"
                      >
                        <div
                          className="w-16 h-16 rounded-lg border-2 border-border shrink-0"
                          style={{ backgroundColor: value }}
                        />
                        <div className="flex-1 min-w-0">
                          <div className="text-sm font-medium truncate">
                            {name}
                          </div>
                          <div className="text-xs font-mono text-muted-foreground">
                            {value}
                          </div>
                        </div>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="opacity-0 group-hover:opacity-100 transition-opacity"
                          onClick={() => copyToken(name, value)}
                        >
                          <Copy className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Typography Tab */}
        <TabsContent value="typography" className="space-y-4">
          {/* Font Sizes */}
          <Card>
            <CardHeader>
              <CardTitle>Font Sizes</CardTitle>
              <CardDescription>
                Type scale with corresponding rem values
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {designTokens.typography?.fontSizes &&
                  Object.entries(designTokens.typography.fontSizes)
                    .filter(([name]) =>
                      name.toLowerCase().includes(searchQuery.toLowerCase())
                    )
                    .map(([name, value]) => (
                      <div
                        key={name}
                        className="flex items-center gap-4 p-3 rounded-lg border bg-muted/30 hover:bg-muted/50 transition-colors group"
                      >
                        <Badge variant="secondary" className="w-16">
                          {name}
                        </Badge>
                        <div className="flex-1">
                          <div style={{ fontSize: value }}>
                            The quick brown fox jumps over the lazy dog
                          </div>
                        </div>
                        <div className="text-xs font-mono text-muted-foreground">
                          {value}
                        </div>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="opacity-0 group-hover:opacity-100 transition-opacity"
                          onClick={() => copyToken(name, value)}
                        >
                          <Copy className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
              </div>
            </CardContent>
          </Card>

          {/* Font Weights */}
          <Card>
            <CardHeader>
              <CardTitle>Font Weights</CardTitle>
              <CardDescription>
                Available font weight values
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {designTokens.typography?.fontWeights &&
                  Object.entries(designTokens.typography.fontWeights).map(
                    ([name, value]) => (
                      <div
                        key={name}
                        className="flex items-center justify-between p-3 rounded-lg border bg-muted/30 hover:bg-muted/50 transition-colors group"
                      >
                        <div style={{ fontWeight: value }}>
                          {name.charAt(0).toUpperCase() + name.slice(1)} ({value})
                        </div>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="opacity-0 group-hover:opacity-100 transition-opacity"
                          onClick={() => copyToken(name, value)}
                        >
                          <Copy className="h-4 w-4" />
                        </Button>
                      </div>
                    )
                  )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Spacing Tab */}
        <TabsContent value="spacing" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Spacing Scale</CardTitle>
              <CardDescription>
                Consistent spacing values for margins and padding
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {designTokens.spacing &&
                  Object.entries(designTokens.spacing)
                    .filter(([name]) =>
                      name.toLowerCase().includes(searchQuery.toLowerCase())
                    )
                    .map(([name, value]) => (
                      <div
                        key={name}
                        className="flex items-center gap-4 p-3 rounded-lg border bg-muted/30 hover:bg-muted/50 transition-colors group"
                      >
                        <Badge variant="secondary" className="w-12">
                          {name}
                        </Badge>
                        <div className="flex items-center gap-2 flex-1">
                          <div
                            className="h-8 bg-primary rounded"
                            style={{ width: value }}
                          />
                          <div className="text-xs font-mono text-muted-foreground">
                            {value}
                          </div>
                        </div>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="opacity-0 group-hover:opacity-100 transition-opacity"
                          onClick={() => copyToken(name, value)}
                        >
                          <Copy className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Shadows Tab */}
        <TabsContent value="shadows" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Box Shadows</CardTitle>
              <CardDescription>
                Elevation shadows for depth and hierarchy
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {designTokens.shadows &&
                  Object.entries(designTokens.shadows)
                    .filter(([name]) =>
                      name.toLowerCase().includes(searchQuery.toLowerCase())
                    )
                    .map(([name, value]) => (
                      <div
                        key={name}
                        className="p-4 rounded-lg border bg-muted/30 group"
                      >
                        <div className="flex items-center justify-between mb-3">
                          <Badge variant="secondary">{name}</Badge>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="opacity-0 group-hover:opacity-100 transition-opacity"
                            onClick={() => copyToken(name, value)}
                          >
                            <Copy className="h-4 w-4" />
                          </Button>
                        </div>
                        <div className="bg-gradient-to-br from-muted to-muted/50 p-8 rounded-lg flex items-center justify-center">
                          <div
                            className="w-24 h-24 bg-background rounded-lg"
                            style={{ boxShadow: value }}
                          />
                        </div>
                        <div className="mt-3 text-xs font-mono text-muted-foreground break-all">
                          {value}
                        </div>
                      </div>
                    ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Other Tab */}
        <TabsContent value="other" className="space-y-4">
          {/* Border Radius */}
          <Card>
            <CardHeader>
              <CardTitle>Border Radius</CardTitle>
              <CardDescription>
                Standard border radius values
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
                {designTokens.borderRadius &&
                  Object.entries(designTokens.borderRadius).map(
                    ([name, value]) => (
                      <div
                        key={name}
                        className="p-4 rounded-lg border bg-muted/30 group"
                      >
                        <div className="flex items-center justify-between mb-3">
                          <Badge variant="secondary" className="text-xs">
                            {name}
                          </Badge>
                        </div>
                        <div className="bg-gradient-to-br from-muted to-muted/50 p-8 rounded-lg flex items-center justify-center">
                          <div
                            className="w-20 h-20 bg-primary"
                            style={{ borderRadius: value }}
                          />
                        </div>
                        <div className="mt-3 text-xs font-mono text-muted-foreground text-center">
                          {value}
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="w-full mt-2 opacity-0 group-hover:opacity-100 transition-opacity"
                          onClick={() => copyToken(name, value)}
                        >
                          <Copy className="h-3 w-3 mr-1" />
                          Copy
                        </Button>
                      </div>
                    )
                  )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
