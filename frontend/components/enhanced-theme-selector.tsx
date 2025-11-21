"use client";

import * as React from "react";
import { Palette, Check, Search, Star, Grid3x3, X } from "lucide-react";
import { useTheme } from "next-themes";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { themes as defaultThemes } from "@/lib/themes";
import { getCustomThemes as getThemes, type CustomTheme } from "@/lib/custom-themes";
import { hslToRgb, parseHslString, getCategoryForTheme, THEME_CATEGORIES } from "@/lib/theme-utils";
import { useThemePreview } from "@/hooks/useThemePreview";

// Category metadata
const categoryMetadata = [
  { id: "corporate", emoji: "🏢", label: "Corporate" },
  { id: "minimal", emoji: "✨", label: "Minimal" },
  { id: "creative", emoji: "🎨", label: "Creative" },
  { id: "nature", emoji: "🌿", label: "Nature" },
  { id: "premium", emoji: "💎", label: "Premium" },
  { id: "vibrant", emoji: "🌈", label: "Vibrant" },
];

// Theme metadata with emojis and descriptions
const themeMetadata: Record<string, { emoji: string; label: string; description: string; category: string }> = {
  "uns-kikaku": {
    emoji: "🏢",
    label: "UNS Kikaku",
    description: "Tema corporativo oficial",
    category: "corporate"
  },
  "default-light": {
    emoji: "☀️",
    label: "Light Default",
    description: "Classic light theme",
    category: "minimal"
  },
  "default-dark": {
    emoji: "🌙",
    label: "Dark Default",
    description: "Classic dark theme",
    category: "minimal"
  },
  "ocean-blue": {
    emoji: "🌊",
    label: "Ocean Blue",
    description: "Calming ocean waves",
    category: "creative"
  },
  "sunset": {
    emoji: "🌅",
    label: "Sunset",
    description: "Warm sunset colors",
    category: "creative"
  },
  "mint-green": {
    emoji: "🌿",
    label: "Mint Green",
    description: "Fresh mint vibes",
    category: "creative"
  },
  "royal-purple": {
    emoji: "👑",
    label: "Royal Purple",
    description: "Majestic purple tones",
    category: "creative"
  },
  "industrial": {
    emoji: "🏭",
    label: "Industrial",
    description: "Professional steel blue",
    category: "corporate"
  },
  "vibrant-coral": {
    emoji: "🪸",
    label: "Vibrant Coral",
    description: "Energetic coral pink",
    category: "creative"
  },
  "forest-green": {
    emoji: "🌲",
    label: "Forest Green",
    description: "Natural forest tones",
    category: "creative"
  },
  "monochrome": {
    emoji: "⚫",
    label: "Monochrome",
    description: "Black and white elegance",
    category: "minimal"
  },
  "espresso": {
    emoji: "☕",
    label: "Espresso",
    description: "Warm coffee tones",
    category: "creative"
  },
};

interface ThemeCardProps {
  theme: typeof defaultThemes[0] | CustomTheme;
  isActive: boolean;
  isFavorite: boolean;
  onSelect: () => void;
  onToggleFavorite: () => void;
  onPreviewStart: () => void;
  onPreviewEnd: () => void;
}

function ThemeCard({ theme, isActive, isFavorite, onSelect, onToggleFavorite, onPreviewStart, onPreviewEnd }: ThemeCardProps) {
  const metadata = themeMetadata[theme.id] || {
    emoji: "🎨",
    label: theme.name,
    description: "Custom theme",
    category: "custom"
  };

  const primaryHsl = parseHslString(theme.colors["--primary"]) || [0, 0, 0];
  const bgHsl = parseHslString(theme.colors["--background"]) || [0, 0, 100];
  const cardHsl = parseHslString(theme.colors["--card"]) || [0, 0, 100];
  const accentHsl = parseHslString(theme.colors["--accent"]) || [0, 0, 50];

  const primaryRgb = hslToRgb(...primaryHsl);
  const bgRgb = hslToRgb(...bgHsl);
  const cardRgb = hslToRgb(...cardHsl);
  const accentRgb = hslToRgb(...accentHsl);

  const primaryColor = `rgb(${primaryRgb.join(',')})`;
  const bgColor = `rgb(${bgRgb.join(',')})`;
  const cardColor = `rgb(${cardRgb.join(',')})`;
  const accentColor = `rgb(${accentRgb.join(',')})`;

  return (
    <div
      className="group relative cursor-pointer transition-all duration-200 hover:scale-105"
      onClick={onSelect}
      onMouseEnter={onPreviewStart}
      onMouseLeave={onPreviewEnd}
      onDoubleClick={(e) => {
        e.stopPropagation();
        onToggleFavorite();
      }}
    >
      {/* Card Container */}
      <div className={`
        relative overflow-hidden rounded-xl border-2 transition-all duration-200
        ${isActive ? 'border-primary shadow-lg ring-2 ring-primary/20' : 'border-border hover:border-primary/50'}
      `}>
        {/* Preview Background */}
        <div
          className="h-24 w-full relative"
          style={{
            background: `linear-gradient(135deg, ${bgColor} 0%, ${cardColor} 100%)`,
          }}
        >
          {/* Color Palette Preview */}
          <div className="absolute bottom-2 left-2 flex gap-1">
            <div
              className="h-6 w-6 rounded-full border-2 border-white shadow-sm"
              style={{ backgroundColor: primaryColor }}
              title="Primary"
            />
            <div
              className="h-6 w-6 rounded-full border-2 border-white shadow-sm"
              style={{ backgroundColor: accentColor }}
              title="Accent"
            />
            <div
              className="h-6 w-6 rounded-full border-2 border-white shadow-sm"
              style={{ backgroundColor: cardColor }}
              title="Card"
            />
          </div>

          {/* Active Indicator */}
          {isActive && (
            <div className="absolute top-2 right-2 rounded-full bg-primary p-1.5 shadow-lg">
              <Check className="h-3 w-3 text-primary-foreground" />
            </div>
          )}

          {/* Favorite Star */}
          <button
            className="absolute top-2 left-2 opacity-0 group-hover:opacity-100 transition-opacity"
            onClick={(e) => {
              e.stopPropagation();
              onToggleFavorite();
            }}
          >
            <Star
              className={`h-4 w-4 ${isFavorite ? 'fill-yellow-400 text-yellow-400' : 'text-white'}`}
            />
          </button>
        </div>

        {/* Theme Info */}
        <div className="p-3 bg-card">
          <div className="flex items-start justify-between gap-2">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className="text-lg">{metadata.emoji}</span>
                <span className="text-sm font-semibold truncate">
                  {metadata.label}
                </span>
              </div>
              <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">
                {metadata.description}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Hover Preview Text */}
      <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
        <span className="bg-primary text-primary-foreground px-3 py-1 rounded-full text-xs font-medium shadow-lg">
          Preview
        </span>
      </div>
    </div>
  );
}

export function EnhancedThemeSelector() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = React.useState(false);
  const [customThemes, setCustomThemes] = React.useState<CustomTheme[]>([]);
  const [searchQuery, setSearchQuery] = React.useState("");
  const [selectedCategory, setSelectedCategory] = React.useState("all");
  const [favorites, setFavorites] = React.useState<string[]>([]);
  const [isOpen, setIsOpen] = React.useState(false);

  const { startPreview, cancelPreview } = useThemePreview();

  React.useEffect(() => {
    setMounted(true);
    loadCustomThemes();
    loadFavorites();
  }, []);

  const loadCustomThemes = () => {
    const themes = getThemes();
    setCustomThemes(themes);
  };

  const loadFavorites = () => {
    try {
      const stored = localStorage.getItem('theme-favorites');
      if (stored) {
        setFavorites(JSON.parse(stored));
      }
    } catch (error) {
      console.warn('Error loading favorites:', error);
    }
  };

  const toggleFavorite = (themeName: string) => {
    const newFavorites = favorites.includes(themeName)
      ? favorites.filter(f => f !== themeName)
      : [...favorites, themeName];

    setFavorites(newFavorites);
    localStorage.setItem('theme-favorites', JSON.stringify(newFavorites));
  };

  const allThemes = [...defaultThemes, ...customThemes];

  // Filter themes
  const filteredThemes = allThemes.filter((t) => {
    const matchesSearch = t.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      themeMetadata[t.id]?.label?.toLowerCase().includes(searchQuery.toLowerCase());

    const category = getCategoryForTheme(t.id);
    const matchesCategory = selectedCategory === "all" || category === selectedCategory;

    return matchesSearch && matchesCategory;
  });

  // Sort: favorites first, then alphabetically
  const sortedThemes = [...filteredThemes].sort((a, b) => {
    const aIsFav = favorites.includes(a.id);
    const bIsFav = favorites.includes(b.id);

    if (aIsFav && !bIsFav) return -1;
    if (!aIsFav && bIsFav) return 1;

    return a.name.localeCompare(b.name);
  });

  if (!mounted) {
    return (
      <Button variant="ghost" size="icon" disabled>
        <Palette className="h-5 w-5" />
      </Button>
    );
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="h-9 w-9"
          title="Cambiar tema"
        >
          <Palette className="h-5 w-5" />
          <span className="sr-only">Selector de temas</span>
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <div>
              <DialogTitle className="flex items-center gap-2">
                <Palette className="h-5 w-5" />
                Theme Gallery
              </DialogTitle>
              <DialogDescription>
                Click to apply, hover to preview, double-click to favorite
              </DialogDescription>
            </div>
            <Badge variant="outline">
              {sortedThemes.length} themes
            </Badge>
          </div>
        </DialogHeader>

        {/* Search and Filter */}
        <div className="space-y-4 py-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search themes..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
            />
            {searchQuery && (
              <button
                className="absolute right-3 top-1/2 -translate-y-1/2"
                onClick={() => setSearchQuery("")}
              >
                <X className="h-4 w-4 text-muted-foreground hover:text-foreground" />
              </button>
            )}
          </div>

          {/* Category Tabs */}
          <Tabs value={selectedCategory} onValueChange={setSelectedCategory} className="w-full">
            <TabsList className="w-full justify-start overflow-x-auto">
              {categoryMetadata.map((cat) => (
                <TabsTrigger key={cat.id} value={cat.id} className="gap-1.5">
                  <span>{cat.emoji}</span>
                  <span>{cat.label}</span>
                </TabsTrigger>
              ))}
            </TabsList>
          </Tabs>
        </div>

        {/* Theme Grid */}
        <div className="flex-1 overflow-y-auto pr-2">
          {sortedThemes.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-64 text-center">
              <Grid3x3 className="h-12 w-12 text-muted-foreground mb-4" />
              <p className="text-sm text-muted-foreground">
                No themes found matching your criteria
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 pb-4">
              {sortedThemes.map((themeOption) => (
                <ThemeCard
                  key={themeOption.id}
                  theme={themeOption}
                  isActive={theme === themeOption.id}
                  isFavorite={favorites.includes(themeOption.id)}
                  onSelect={() => {
                    setTheme(themeOption.id);
                    cancelPreview();
                  }}
                  onToggleFavorite={() => toggleFavorite(themeOption.id)}
                  onPreviewStart={() => startPreview(themeOption, 500)}
                  onPreviewEnd={cancelPreview}
                />
              ))}
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-between pt-4 border-t">
          <div className="text-xs text-muted-foreground">
            {favorites.length > 0 && (
              <span className="flex items-center gap-1">
                <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                {favorites.length} favorite{favorites.length !== 1 ? 's' : ''}
              </span>
            )}
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => window.location.href = '/settings/appearance'}
          >
            Advanced Settings
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
