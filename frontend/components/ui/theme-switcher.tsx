"use client";

import * as React from "react";
import {
  Palette,
  Search,
  Star,
  X,
  Settings,
  Grid3x3,
  Check,
  ExternalLink,
  Plus,
} from "lucide-react";
import { useTheme } from "next-themes";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { themes as defaultThemes } from "@/lib/themes";
import { getCustomThemes, type CustomTheme } from "@/lib/custom-themes";
import {
  hslToRgb,
  parseHslString,
  getCategoryForTheme,
  THEME_CATEGORIES,
} from "@/lib/theme-utils";
import { useThemePreview } from "@/hooks/useThemePreview";

// Category metadata with icons
const categoryMetadata = [
  { id: "all", emoji: "🎨", label: "All" },
  { id: "corporate", emoji: "🏢", label: "Corporate" },
  { id: "minimal", emoji: "✨", label: "Minimal" },
  { id: "creative", emoji: "🎨", label: "Creative" },
  { id: "nature", emoji: "🌿", label: "Nature" },
  { id: "premium", emoji: "💎", label: "Premium" },
  { id: "vibrant", emoji: "🌈", label: "Vibrant" },
];

// Theme metadata
const themeMetadata: Record<
  string,
  { emoji: string; label: string; description: string }
> = {
  "uns-kikaku": {
    emoji: "🏢",
    label: "UNS Kikaku",
    description: "Corporate theme",
  },
  "default-light": {
    emoji: "☀️",
    label: "Light",
    description: "Classic light",
  },
  "default-dark": { emoji: "🌙", label: "Dark", description: "Classic dark" },
  "ocean-blue": { emoji: "🌊", label: "Ocean", description: "Calming blue" },
  sunset: { emoji: "🌅", label: "Sunset", description: "Warm sunset" },
  "mint-green": { emoji: "🌿", label: "Mint", description: "Fresh mint" },
  "royal-purple": { emoji: "👑", label: "Royal", description: "Purple tones" },
  industrial: { emoji: "🏭", label: "Industrial", description: "Steel blue" },
  "vibrant-coral": { emoji: "🪸", label: "Coral", description: "Coral pink" },
  "forest-green": { emoji: "🌲", label: "Forest", description: "Forest tones" },
  monochrome: { emoji: "⚫", label: "Mono", description: "B&W elegance" },
  espresso: { emoji: "☕", label: "Espresso", description: "Coffee tones" },
  pastel: { emoji: "🎀", label: "Pastel", description: "Soft pastels" },
  neon: { emoji: "💡", label: "Neon", description: "Neon lights" },
  vintage: { emoji: "📻", label: "Vintage", description: "Retro vibes" },
  modern: { emoji: "🏙️", label: "Modern", description: "Clean modern" },
  minimalist: { emoji: "⬜", label: "Minimal", description: "Pure minimal" },
  "neon-aurora": {
    emoji: "🌌",
    label: "Aurora",
    description: "Neon aurora",
  },
  "deep-ocean": { emoji: "🌊", label: "Deep", description: "Deep ocean" },
  "forest-magic": {
    emoji: "🌲",
    label: "Magic",
    description: "Forest magic",
  },
  "sunset-blaze": { emoji: "🔥", label: "Blaze", description: "Sunset blaze" },
  "cosmic-purple": {
    emoji: "💫",
    label: "Cosmic",
    description: "Cosmic purple",
  },
};

interface CompactThemeCardProps {
  theme: (typeof defaultThemes)[0] | CustomTheme;
  isActive: boolean;
  isFavorite: boolean;
  onSelect: () => void;
  onToggleFavorite: (e: React.MouseEvent) => void;
  onPreviewStart: () => void;
  onPreviewEnd: () => void;
}

/**
 * Compact theme card for the switcher grid
 */
function CompactThemeCard({
  theme,
  isActive,
  isFavorite,
  onSelect,
  onToggleFavorite,
  onPreviewStart,
  onPreviewEnd,
}: CompactThemeCardProps) {
  const metadata = themeMetadata[theme.id] || {
    emoji: "🎨",
    label: theme.name,
    description: "Custom",
  };

  // Parse colors
  const primaryHsl = parseHslString(theme.colors["--primary"]) || [0, 0, 0];
  const bgHsl = parseHslString(theme.colors["--background"]) || [0, 0, 100];
  const accentHsl = parseHslString(theme.colors["--accent"]) || [0, 0, 50];

  const primaryRgb = hslToRgb(...primaryHsl);
  const bgRgb = hslToRgb(...bgHsl);
  const accentRgb = hslToRgb(...accentHsl);

  const primaryColor = `rgb(${primaryRgb.join(",")})`;
  const bgColor = `rgb(${bgRgb.join(",")})`;
  const accentColor = `rgb(${accentRgb.join(",")})`;

  return (
    <div
      className={`
        group relative cursor-pointer rounded-lg border-2 transition-all duration-200
        hover:scale-105 hover:shadow-md
        ${
          isActive
            ? "border-primary shadow-lg ring-2 ring-primary/20"
            : "border-border hover:border-primary/50"
        }
      `}
      onClick={onSelect}
      onMouseEnter={onPreviewStart}
      onMouseLeave={onPreviewEnd}
      role="button"
      tabIndex={0}
      aria-label={`Apply ${metadata.label} theme`}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onSelect();
        }
      }}
    >
      {/* Preview Background */}
      <div
        className="h-16 w-full rounded-t-md relative"
        style={{
          background: `linear-gradient(135deg, ${bgColor} 0%, ${accentColor} 100%)`,
        }}
      >
        {/* Color dots */}
        <div className="absolute bottom-1.5 left-1.5 flex gap-1">
          <div
            className="h-3 w-3 rounded-full border border-white/50"
            style={{ backgroundColor: primaryColor }}
          />
          <div
            className="h-3 w-3 rounded-full border border-white/50"
            style={{ backgroundColor: accentColor }}
          />
        </div>

        {/* Active indicator */}
        {isActive && (
          <div className="absolute top-1.5 right-1.5 rounded-full bg-primary p-0.5">
            <Check className="h-2.5 w-2.5 text-primary-foreground" />
          </div>
        )}

        {/* Favorite star */}
        <button
          className="absolute top-1.5 left-1.5 opacity-0 group-hover:opacity-100 transition-opacity"
          onClick={onToggleFavorite}
          aria-label={
            isFavorite
              ? `Remove ${metadata.label} from favorites`
              : `Add ${metadata.label} to favorites`
          }
        >
          <Star
            className={`h-3 w-3 ${
              isFavorite ? "fill-yellow-400 text-yellow-400" : "text-white"
            }`}
          />
        </button>
      </div>

      {/* Theme info */}
      <div className="p-2 bg-card">
        <div className="flex items-center gap-1.5">
          <span className="text-sm">{metadata.emoji}</span>
          <span className="text-xs font-medium truncate">{metadata.label}</span>
        </div>
      </div>
    </div>
  );
}

/**
 * Favorite theme quick button
 */
function FavoriteButton({
  theme,
  isActive,
  onSelect,
  onPreviewStart,
  onPreviewEnd,
}: {
  theme: (typeof defaultThemes)[0] | CustomTheme;
  isActive: boolean;
  onSelect: () => void;
  onPreviewStart: () => void;
  onPreviewEnd: () => void;
}) {
  const metadata = themeMetadata[theme.id] || {
    emoji: "🎨",
    label: theme.name,
  };

  return (
    <Button
      variant={isActive ? "default" : "outline"}
      size="sm"
      className="h-8 gap-1.5 text-xs"
      onClick={onSelect}
      onMouseEnter={onPreviewStart}
      onMouseLeave={onPreviewEnd}
    >
      <span>{metadata.emoji}</span>
      <span className="max-w-[80px] truncate">{metadata.label}</span>
      {isActive && <Check className="h-3 w-3" />}
    </Button>
  );
}

/**
 * Theme Switcher Component
 * Advanced popover with favorites, search, categories, and quick access
 *
 * Features:
 * - Favorites system with localStorage persistence
 * - Search functionality across all themes
 * - Category filtering
 * - Theme preview on hover
 * - Visual grid with color previews
 * - Quick access to theme gallery and customizer
 */
export function ThemeSwitcher() {
  const { theme, setTheme } = useTheme();
  const router = useRouter();
  const [mounted, setMounted] = React.useState(false);
  const [customThemes, setCustomThemes] = React.useState<CustomTheme[]>([]);
  const [searchQuery, setSearchQuery] = React.useState("");
  const [selectedCategory, setSelectedCategory] = React.useState("all");
  const [favorites, setFavorites] = React.useState<string[]>([]);
  const [isOpen, setIsOpen] = React.useState(false);

  const { startPreview, cancelPreview } = useThemePreview();

  // Load data on mount
  React.useEffect(() => {
    setMounted(true);
    loadCustomThemes();
    loadFavorites();
  }, []);

  const loadCustomThemes = () => {
    const themes = getCustomThemes();
    setCustomThemes(themes);
  };

  const loadFavorites = () => {
    if (typeof window === "undefined") return;
    try {
      const stored = localStorage.getItem("theme-favorites");
      if (stored) {
        setFavorites(JSON.parse(stored));
      }
    } catch (error) {
      console.warn("Error loading favorites:", error);
    }
  };

  const toggleFavorite = (themeName: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const newFavorites = favorites.includes(themeName)
      ? favorites.filter((f) => f !== themeName)
      : [...favorites, themeName];

    setFavorites(newFavorites);
    if (typeof window !== "undefined") {
      localStorage.setItem("theme-favorites", JSON.stringify(newFavorites));
    }
  };

  // Combine all themes
  const allThemes = [...defaultThemes, ...customThemes];

  // Filter themes
  const filteredThemes = allThemes.filter((t) => {
    const matchesSearch =
      t.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      themeMetadata[t.id]?.label
        ?.toLowerCase()
        .includes(searchQuery.toLowerCase());

    const category = getCategoryForTheme(t.id);
    const matchesCategory =
      selectedCategory === "all" || category === selectedCategory;

    return matchesSearch && matchesCategory;
  });

  // Get favorite themes (limit to 5 for quick access)
  const favoriteThemes = allThemes
    .filter((t) => favorites.includes(t.id))
    .slice(0, 5);

  // Sort: favorites first, then alphabetically
  const sortedThemes = [...filteredThemes].sort((a, b) => {
    const aIsFav = favorites.includes(a.id);
    const bIsFav = favorites.includes(b.id);

    if (aIsFav && !bIsFav) return -1;
    if (!aIsFav && bIsFav) return 1;

    return a.name.localeCompare(b.name);
  });

  // Handle theme application
  const applyTheme = (themeName: string) => {
    setTheme(themeName);
    cancelPreview();
    // Optionally close popover after selection
    // setIsOpen(false);
  };

  if (!mounted) {
    return (
      <Button variant="ghost" size="icon" disabled className="h-9 w-9">
        <Palette className="h-5 w-5" />
      </Button>
    );
  }

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="h-9 w-9"
          aria-label="Theme switcher"
        >
          <Palette className="h-5 w-5" />
          <span className="sr-only">Switch theme</span>
        </Button>
      </PopoverTrigger>
      <PopoverContent
        className="w-[380px] p-0"
        align="end"
        sideOffset={8}
        onOpenAutoFocus={(e) => e.preventDefault()}
      >
        <div className="flex flex-col h-[600px]">
          {/* Header */}
          <div className="p-4 border-b bg-muted/50">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Palette className="h-4 w-4" />
                <h3 className="font-semibold text-sm">Theme Switcher</h3>
              </div>
              <Badge variant="outline" className="text-xs">
                {allThemes.length}
              </Badge>
            </div>

            {/* Favorites Quick Access */}
            {favoriteThemes.length > 0 && (
              <div className="space-y-2">
                <div className="flex items-center gap-1.5">
                  <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                  <span className="text-xs text-muted-foreground font-medium">
                    Favorites
                  </span>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {favoriteThemes.map((favoriteTheme) => (
                    <FavoriteButton
                      key={favoriteTheme.id}
                      theme={favoriteTheme}
                      isActive={theme === favoriteTheme.id}
                      onSelect={() => applyTheme(favoriteTheme.id)}
                      onPreviewStart={() => startPreview(favoriteTheme, 500)}
                      onPreviewEnd={cancelPreview}
                    />
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Search */}
          <div className="p-3 border-b">
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
              <Input
                placeholder="Search themes..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="h-8 pl-8 pr-8 text-sm"
                aria-label="Search themes"
              />
              {searchQuery && (
                <button
                  className="absolute right-2.5 top-1/2 -translate-y-1/2"
                  onClick={() => setSearchQuery("")}
                  aria-label="Clear search"
                >
                  <X className="h-3.5 w-3.5 text-muted-foreground hover:text-foreground" />
                </button>
              )}
            </div>
          </div>

          {/* Category Filter */}
          <div className="border-b">
            <Tabs
              value={selectedCategory}
              onValueChange={setSelectedCategory}
              className="w-full"
            >
              <TabsList className="w-full h-9 justify-start rounded-none bg-transparent p-0 border-0">
                <ScrollArea className="w-full">
                  <div className="flex px-2">
                    {categoryMetadata.map((cat) => (
                      <TabsTrigger
                        key={cat.id}
                        value={cat.id}
                        className="gap-1 text-xs h-8 data-[state=active]:bg-muted"
                      >
                        <span className="text-sm">{cat.emoji}</span>
                        <span className="hidden sm:inline">{cat.label}</span>
                      </TabsTrigger>
                    ))}
                  </div>
                </ScrollArea>
              </TabsList>
            </Tabs>
          </div>

          {/* Theme Grid */}
          <ScrollArea className="flex-1 p-3">
            {sortedThemes.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-center py-12">
                <Grid3x3 className="h-12 w-12 text-muted-foreground mb-3" />
                <p className="text-sm text-muted-foreground">
                  No themes found
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  Try a different search or category
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-3 gap-2">
                {sortedThemes.map((themeOption) => (
                  <CompactThemeCard
                    key={themeOption.id}
                    theme={themeOption}
                    isActive={theme === themeOption.id}
                    isFavorite={favorites.includes(themeOption.id)}
                    onSelect={() => applyTheme(themeOption.id)}
                    onToggleFavorite={(e) => toggleFavorite(themeOption.id, e)}
                    onPreviewStart={() => startPreview(themeOption, 500)}
                    onPreviewEnd={cancelPreview}
                  />
                ))}
              </div>
            )}
          </ScrollArea>

          {/* Footer Actions */}
          <div className="p-3 border-t bg-muted/50 flex items-center justify-between gap-2">
            <div className="flex gap-1.5">
              <Button
                variant="outline"
                size="sm"
                className="h-7 text-xs gap-1.5"
                onClick={() => {
                  router.push("/themes");
                  setIsOpen(false);
                }}
              >
                <Grid3x3 className="h-3 w-3" />
                Gallery
                <ExternalLink className="h-2.5 w-2.5" />
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="h-7 text-xs gap-1.5"
                onClick={() => {
                  router.push("/themes/customizer");
                  setIsOpen(false);
                }}
              >
                <Plus className="h-3 w-3" />
                Create
                <ExternalLink className="h-2.5 w-2.5" />
              </Button>
            </div>
            {favorites.length > 0 && (
              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                <span>{favorites.length}</span>
              </div>
            )}
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}

/**
 * Backward compatibility alias
 */
export const ThemeSwitcherImproved = ThemeSwitcher;
