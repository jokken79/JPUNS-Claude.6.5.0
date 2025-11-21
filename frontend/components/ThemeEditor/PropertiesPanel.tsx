'use client';

import * as React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useThemeStore } from '@/stores/themeStore';
import { cn } from '@/lib/utils';
import { HexColorPicker } from 'react-colorful';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs';
import {
  Palette,
  Type,
  Layout,
  Ruler,
  Copy,
  RotateCcw,
  Info,
  Search,
  Loader2,
} from 'lucide-react';
import {
  GOOGLE_FONTS,
  ALL_GOOGLE_FONTS,
  loadGoogleFont,
  isFontLoaded,
  getFontCategory,
} from '@/utils/googleFonts';

/**
 * PropertiesPanel Component
 *
 * Right panel for editing properties of selected theme elements.
 * Shows different controls based on the selected element type.
 */

interface PropertiesPanelProps {
  className?: string;
}

/**
 * Available font families (now using Google Fonts)
 * Legacy fonts for fallback
 */
const LEGACY_FONT_FAMILIES = [
  'Inter',
  'IBM Plex Sans',
  'Lato',
  'Nunito',
  'Source Sans 3',
  'Work Sans',
  'Fira Sans',
  'Rubik',
  'Libre Franklin',
  'Roboto',
  'Open Sans',
  'Montserrat',
];

/**
 * Font weight options
 */
const FONT_WEIGHTS = [
  { value: '300', label: 'Light (300)' },
  { value: '400', label: 'Normal (400)' },
  { value: '500', label: 'Medium (500)' },
  { value: '600', label: 'Semibold (600)' },
  { value: '700', label: 'Bold (700)' },
  { value: '800', label: 'Extra Bold (800)' },
];

/**
 * Spacing presets
 */
const SPACING_PRESETS = [
  { value: '0', label: 'None' },
  { value: '0.25rem', label: 'XS' },
  { value: '0.5rem', label: 'SM' },
  { value: '1rem', label: 'MD' },
  { value: '1.5rem', label: 'LG' },
  { value: '2rem', label: 'XL' },
  { value: '3rem', label: '2XL' },
  { value: '4rem', label: '3XL' },
];

/**
 * Border radius presets
 */
const BORDER_RADIUS_PRESETS = [
  { value: '0', label: 'None' },
  { value: '0.125rem', label: 'SM' },
  { value: '0.375rem', label: 'MD' },
  { value: '0.5rem', label: 'LG' },
  { value: '0.75rem', label: 'XL' },
  { value: '1rem', label: '2XL' },
  { value: '9999px', label: 'Full' },
];

/**
 * Shadow presets
 */
const SHADOW_PRESETS = [
  { value: 'none', label: 'None' },
  { value: '0 1px 2px 0 rgb(0 0 0 / 0.05)', label: 'SM' },
  { value: '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)', label: 'MD' },
  { value: '0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)', label: 'LG' },
  { value: '0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1)', label: 'XL' },
  { value: 'inset 0 2px 4px 0 rgb(0 0 0 / 0.05)', label: 'Inner' },
];

/**
 * Convert HSL string to HEX
 * @param hsl - HSL string in format "220 13% 91%" or "hsl(220 13% 91%)"
 * @returns HEX color string
 */
function hslToHex(hsl: string): string {
  try {
    // Extract H, S, L values
    const match = hsl.match(/(\d+\.?\d*)\s+(\d+\.?\d*)%\s+(\d+\.?\d*)%/);
    if (!match) return '#000000';

    const h = parseFloat(match[1]);
    const s = parseFloat(match[2]) / 100;
    const l = parseFloat(match[3]) / 100;

    const c = (1 - Math.abs(2 * l - 1)) * s;
    const x = c * (1 - Math.abs(((h / 60) % 2) - 1));
    const m = l - c / 2;

    let r = 0, g = 0, b = 0;

    if (h >= 0 && h < 60) {
      r = c; g = x; b = 0;
    } else if (h >= 60 && h < 120) {
      r = x; g = c; b = 0;
    } else if (h >= 120 && h < 180) {
      r = 0; g = c; b = x;
    } else if (h >= 180 && h < 240) {
      r = 0; g = x; b = c;
    } else if (h >= 240 && h < 300) {
      r = x; g = 0; b = c;
    } else if (h >= 300 && h < 360) {
      r = c; g = 0; b = x;
    }

    const toHex = (n: number) => {
      const hex = Math.round((n + m) * 255).toString(16);
      return hex.length === 1 ? '0' + hex : hex;
    };

    return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
  } catch (error) {
    console.error('Error converting HSL to HEX:', error);
    return '#000000';
  }
}

/**
 * Convert HEX to HSL string
 * @param hex - HEX color string
 * @returns HSL string in format "220 13% 91%"
 */
function hexToHsl(hex: string): string {
  try {
    // Remove # if present
    hex = hex.replace('#', '');

    // Parse RGB values
    const r = parseInt(hex.substring(0, 2), 16) / 255;
    const g = parseInt(hex.substring(2, 4), 16) / 255;
    const b = parseInt(hex.substring(4, 6), 16) / 255;

    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);
    let h = 0, s = 0;
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

    h = Math.round(h * 360);
    s = Math.round(s * 100);
    const lPercent = Math.round(l * 100);

    return `${h} ${s}% ${lPercent}%`;
  } catch (error) {
    console.error('Error converting HEX to HSL:', error);
    return '0 0% 0%';
  }
}

/**
 * Get readable label from element path
 */
function getElementLabel(path: string): string {
  const labels: Record<string, string> = {
    header: 'Header',
    sidebar: 'Sidebar',
    main: 'Main Content',
    footer: 'Footer',
    card: 'Card',
  };

  // Check if it's a simple layout element
  if (labels[path]) {
    return labels[path];
  }

  // For complex paths like "colors.--primary", extract the last part
  const parts = path.split('.');
  const lastPart = parts[parts.length - 1];

  // Format the label (e.g., "--primary" -> "Primary", "backgroundColor" -> "Background Color")
  return lastPart
    .replace(/^--/, '')
    .replace(/([A-Z])/g, ' $1')
    .replace(/^./, (str) => str.toUpperCase())
    .trim();
}

/**
 * ColorControl Component
 */
interface ColorControlProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  onReset?: () => void;
}

function ColorControl({ label, value, onChange, onReset }: ColorControlProps) {
  const [showPicker, setShowPicker] = React.useState(false);
  const [hexValue, setHexValue] = React.useState(() => hslToHex(value));
  const pickerRef = React.useRef<HTMLDivElement>(null);

  // Update hex when value changes
  React.useEffect(() => {
    setHexValue(hslToHex(value));
  }, [value]);

  // Close picker on outside click
  React.useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (pickerRef.current && !pickerRef.current.contains(event.target as Node)) {
        setShowPicker(false);
      }
    };

    if (showPicker) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [showPicker]);

  const handleColorChange = (newHex: string) => {
    setHexValue(newHex);
    const hsl = hexToHsl(newHex);
    onChange(hsl);
  };

  const handleCopy = async () => {
    await navigator.clipboard.writeText(hexValue);
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <Label className="text-sm font-medium">{label}</Label>
        <div className="flex items-center gap-1">
          <Button variant="ghost" size="sm" onClick={handleCopy} title="Copy HEX value">
            <Copy className="h-3 w-3" />
          </Button>
          {onReset && (
            <Button variant="ghost" size="sm" onClick={onReset} title="Reset to default">
              <RotateCcw className="h-3 w-3" />
            </Button>
          )}
        </div>
      </div>

      <div className="flex gap-2 items-center">
        {/* Color Swatch Button */}
        <button
          type="button"
          onClick={() => setShowPicker(!showPicker)}
          className="relative h-10 w-10 rounded-md border-2 border-border hover:scale-105 transition-transform"
          style={{ backgroundColor: hexValue }}
        >
          <div
            className="absolute inset-0 rounded opacity-10"
            style={{
              backgroundImage:
                'repeating-conic-gradient(#808080 0% 25%, transparent 0% 50%) 50% / 8px 8px',
            }}
          />
        </button>

        {/* Color Values */}
        <div className="flex-1 space-y-1">
          <Input
            type="text"
            value={hexValue.toUpperCase()}
            onChange={(e) => {
              const hex = e.target.value;
              if (/^#[0-9A-Fa-f]{0,6}$/.test(hex)) {
                setHexValue(hex);
                if (hex.length === 7) {
                  handleColorChange(hex);
                }
              }
            }}
            className="h-7 text-xs font-mono"
            placeholder="#RRGGBB"
          />
          <Badge variant="outline" className="text-xs w-full justify-center">
            HSL: {value}
          </Badge>
        </div>
      </div>

      {/* Color Picker Popover */}
      <AnimatePresence>
        {showPicker && (
          <motion.div
            ref={pickerRef}
            className="absolute z-50 mt-2 p-3 bg-popover border border-border rounded-lg shadow-lg"
            initial={{ opacity: 0, y: -10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.95 }}
            transition={{ duration: 0.2, ease: 'easeOut' }}
          >
            <HexColorPicker color={hexValue} onChange={handleColorChange} />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

/**
 * Enhanced FontControl Component with Google Fonts
 */
interface FontControlProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  onReset?: () => void;
}

function FontControl({ label, value, onChange, onReset }: FontControlProps) {
  const [search, setSearch] = React.useState('');
  const [selectedCategory, setSelectedCategory] = React.useState<string>('All');
  const [loading, setLoading] = React.useState(false);
  const [loadError, setLoadError] = React.useState<string | null>(null);
  const [isOpen, setIsOpen] = React.useState(false);

  // Get all categories
  const categories = React.useMemo(
    () => ['All', ...GOOGLE_FONTS.map(category => category.name)],
    []
  );

  // Filter fonts based on search and category
  const filteredFonts = React.useMemo(() => {
    let fonts = ALL_GOOGLE_FONTS;

    // Filter by category
    if (selectedCategory !== 'All') {
      const category = GOOGLE_FONTS.find(cat => cat.name === selectedCategory);
      fonts = category ? category.fonts.map(font => font.family) : [];
    }

    // Filter by search
    if (search.trim()) {
      const searchLower = search.toLowerCase();
      fonts = fonts.filter((font) => font.toLowerCase().includes(searchLower));
    }

    return fonts;
  }, [search, selectedCategory]);

  // Handle font selection with loading
  const handleFontSelect = async (font: string) => {
    setLoading(true);
    setLoadError(null);

    try {
      // Load the font from Google Fonts
      await loadGoogleFont(font);
      // Update the value
      onChange(font);
      setIsOpen(false);
    } catch (error) {
      console.error('Error loading font:', error);
      setLoadError(`Failed to load ${font}. Using fallback.`);
      // Still apply the font (browser might have it cached or as fallback)
      onChange(font);
    } finally {
      setLoading(false);
    }
  };

  // Preload current font if not loaded
  React.useEffect(() => {
    if (value && !isFontLoaded(value)) {
      loadGoogleFont(value).catch((error) => {
        console.error('Error preloading current font:', error);
      });
    }
  }, [value]);

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <Label className="text-sm font-medium">{label}</Label>
        <div className="flex items-center gap-1">
          {loading && <Loader2 className="h-3 w-3 animate-spin text-muted-foreground" />}
          {onReset && (
            <Button variant="ghost" size="sm" onClick={onReset} title="Reset to default">
              <RotateCcw className="h-3 w-3" />
            </Button>
          )}
        </div>
      </div>

      {/* Search Input */}
      <div className="relative">
        <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-3 w-3 text-muted-foreground" />
        <Input
          type="text"
          placeholder="Search fonts..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-7 h-8 text-xs"
        />
      </div>

      {/* Category Tabs */}
      <div className="flex gap-1 flex-wrap">
        {categories.map((category) => (
          <Button
            key={category}
            variant={selectedCategory === category ? 'default' : 'outline'}
            size="sm"
            onClick={() => setSelectedCategory(category)}
            className="h-6 text-xs px-2"
          >
            {category}
          </Button>
        ))}
      </div>

      {/* Font Selector */}
      <Select value={value} onValueChange={handleFontSelect} open={isOpen} onOpenChange={setIsOpen}>
        <SelectTrigger className="h-9">
          <SelectValue placeholder="Select font">
            <span style={{ fontFamily: value }}>{value}</span>
          </SelectValue>
        </SelectTrigger>
        <SelectContent className="max-h-[300px]">
          {filteredFonts.length > 0 ? (
            filteredFonts.map((font) => {
              const category = getFontCategory(font);
              return (
                <SelectItem
                  key={font}
                  value={font}
                  style={{ fontFamily: isFontLoaded(font) ? font : 'inherit' }}
                >
                  <div className="flex items-center justify-between w-full">
                    <span>{font}</span>
                    {category && (
                      <Badge variant="outline" className="ml-2 text-[10px] px-1 py-0">
                        {category}
                      </Badge>
                    )}
                  </div>
                </SelectItem>
              );
            })
          ) : (
            <div className="px-2 py-6 text-center text-sm text-muted-foreground">
              No fonts found matching "{search}"
            </div>
          )}
        </SelectContent>
      </Select>

      {/* Error Message */}
      {loadError && (
        <div className="text-xs text-destructive bg-destructive/10 p-2 rounded border border-destructive/20">
          {loadError}
        </div>
      )}

      {/* Font Preview */}
      <div className="space-y-2">
        <div
          className="p-3 border rounded-md text-sm bg-muted/30 transition-all"
          style={{ fontFamily: value }}
        >
          The quick brown fox jumps over the lazy dog
        </div>
        {/* Additional preview with different sizes */}
        <div
          className="p-3 border rounded-md bg-muted/30 space-y-1 transition-all"
          style={{ fontFamily: value }}
        >
          <div className="text-2xl font-bold">AaBbCc</div>
          <div className="text-xs text-muted-foreground">
            0123456789 !@#$%^&*()
          </div>
        </div>
      </div>

      {/* Font Info */}
      {value && (
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <Badge variant="secondary" className="text-[10px]">
            {getFontCategory(value) || 'Custom'}
          </Badge>
          {isFontLoaded(value) ? (
            <span className="text-green-600 dark:text-green-400">✓ Loaded</span>
          ) : (
            <span className="text-yellow-600 dark:text-yellow-400">Loading...</span>
          )}
        </div>
      )}
    </div>
  );
}

/**
 * SliderControl Component
 */
interface SliderControlProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  min?: number;
  max?: number;
  step?: number;
  unit?: string;
  onReset?: () => void;
}

function SliderControl({
  label,
  value,
  onChange,
  min = 0,
  max = 4,
  step = 0.125,
  unit = 'rem',
  onReset,
}: SliderControlProps) {
  const numericValue = parseFloat(value.replace(unit, '')) || 0;

  const handleSliderChange = (values: number[]) => {
    onChange(`${values[0]}${unit}`);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    if (!isNaN(parseFloat(val))) {
      onChange(`${val}${unit}`);
    }
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <Label className="text-sm font-medium">{label}</Label>
        <div className="flex items-center gap-2">
          <Input
            type="number"
            value={numericValue}
            onChange={handleInputChange}
            className="h-7 w-20 text-xs text-right"
            step={step}
            min={min}
            max={max}
          />
          {onReset && (
            <Button variant="ghost" size="sm" onClick={onReset} title="Reset to default">
              <RotateCcw className="h-3 w-3" />
            </Button>
          )}
        </div>
      </div>

      <Slider
        value={[numericValue]}
        onValueChange={handleSliderChange}
        min={min}
        max={max}
        step={step}
        className="w-full"
      />

      <div className="text-xs text-muted-foreground text-center">
        {value}
      </div>
    </div>
  );
}

/**
 * PresetControl Component
 */
interface PresetControlProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  presets: Array<{ value: string; label: string }>;
  onReset?: () => void;
}

function PresetControl({ label, value, onChange, presets, onReset }: PresetControlProps) {
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <Label className="text-sm font-medium">{label}</Label>
        {onReset && (
          <Button variant="ghost" size="sm" onClick={onReset} title="Reset to default">
            <RotateCcw className="h-3 w-3" />
          </Button>
        )}
      </div>

      <div className="grid grid-cols-4 gap-2">
        {presets.map((preset) => (
          <Button
            key={preset.value}
            variant={value === preset.value ? 'default' : 'outline'}
            size="sm"
            onClick={() => onChange(preset.value)}
            className="h-8 text-xs"
          >
            {preset.label}
          </Button>
        ))}
      </div>

      <Input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="h-8 text-xs font-mono"
      />
    </div>
  );
}

/**
 * LayoutElementEditor Component
 * Edits all properties of a layout element (header, sidebar, main, footer, card)
 */
interface LayoutElementEditorProps {
  elementId: string;
}

function LayoutElementEditor({ elementId }: LayoutElementEditorProps) {
  const { currentTheme, updateThemeProperty, getProperty } = useThemeStore();
  const elementConfig = currentTheme.layout[elementId as keyof typeof currentTheme.layout];

  const updateProperty = (property: string, value: string) => {
    updateThemeProperty(`layout.${elementId}.${property}`, value);
  };

  return (
    <div className="space-y-6">
      <Tabs defaultValue="colors" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="colors">
            <Palette className="h-4 w-4 mr-1" />
            Colors
          </TabsTrigger>
          <TabsTrigger value="typography">
            <Type className="h-4 w-4 mr-1" />
            Text
          </TabsTrigger>
          <TabsTrigger value="layout">
            <Layout className="h-4 w-4 mr-1" />
            Layout
          </TabsTrigger>
          <TabsTrigger value="effects">
            <Ruler className="h-4 w-4 mr-1" />
            Effects
          </TabsTrigger>
        </TabsList>

        <TabsContent value="colors" asChild>
          <motion.div
            className="space-y-4 mt-4"
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 10 }}
            transition={{ duration: 0.2 }}
          >
            <ColorControl
              label="Background Color"
              value={elementConfig.backgroundColor.replace(/^hsl\(|\)$/g, '').replace(/var\(--[^)]+\)/, currentTheme.colors['--background'])}
              onChange={(val) => updateProperty('backgroundColor', `hsl(${val})`)}
            />
            <ColorControl
              label="Text Color"
              value={elementConfig.textColor.replace(/^hsl\(|\)$/g, '').replace(/var\(--[^)]+\)/, currentTheme.colors['--foreground'])}
              onChange={(val) => updateProperty('textColor', `hsl(${val})`)}
            />
            <ColorControl
              label="Border Color"
              value={elementConfig.borderColor.replace(/^hsl\(|\)$/g, '').replace(/var\(--[^)]+\)/, currentTheme.colors['--border'])}
              onChange={(val) => updateProperty('borderColor', `hsl(${val})`)}
            />
          </motion.div>
        </TabsContent>

        <TabsContent value="typography" asChild>
          <motion.div
            className="space-y-4 mt-4"
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 10 }}
            transition={{ duration: 0.2 }}
          >
            <SliderControl
              label="Font Size"
              value={elementConfig.fontSize}
              onChange={(val) => updateProperty('fontSize', val)}
              min={0.5}
              max={4}
              step={0.125}
              unit="rem"
            />
            <div className="space-y-2">
              <Label className="text-sm font-medium">Font Weight</Label>
              <Select
                value={elementConfig.fontWeight}
                onValueChange={(val) => updateProperty('fontWeight', val)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {FONT_WEIGHTS.map((weight) => (
                    <SelectItem key={weight.value} value={weight.value}>
                      {weight.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </motion.div>
        </TabsContent>

        <TabsContent value="layout" asChild>
          <motion.div
            className="space-y-4 mt-4"
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 10 }}
            transition={{ duration: 0.2 }}
          >
            <PresetControl
              label="Padding"
              value={elementConfig.padding}
              onChange={(val) => updateProperty('padding', val)}
              presets={SPACING_PRESETS}
            />
            <PresetControl
              label="Margin"
              value={elementConfig.margin}
              onChange={(val) => updateProperty('margin', val)}
              presets={SPACING_PRESETS}
            />
            <PresetControl
              label="Border Radius"
              value={elementConfig.borderRadius}
              onChange={(val) => updateProperty('borderRadius', val)}
              presets={BORDER_RADIUS_PRESETS}
            />
            <SliderControl
              label="Border Width"
              value={elementConfig.borderWidth}
              onChange={(val) => updateProperty('borderWidth', val)}
              min={0}
              max={10}
              step={1}
              unit="px"
            />
          </motion.div>
        </TabsContent>

        <TabsContent value="effects" asChild>
          <motion.div
            className="space-y-4 mt-4"
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 10 }}
            transition={{ duration: 0.2 }}
          >
            <PresetControl
              label="Box Shadow"
              value={elementConfig.boxShadow}
              onChange={(val) => updateProperty('boxShadow', val)}
              presets={SHADOW_PRESETS}
            />
          </motion.div>
        </TabsContent>
      </Tabs>
    </div>
  );
}

/**
 * ColorPropertyEditor Component
 * Edits theme color properties (colors.--primary, etc.)
 */
interface ColorPropertyEditorProps {
  propertyPath: string;
}

function ColorPropertyEditor({ propertyPath }: ColorPropertyEditorProps) {
  const { getProperty, updateThemeProperty } = useThemeStore();
  const value = getProperty(propertyPath) || '0 0% 0%';

  return (
    <div className="space-y-4">
      <ColorControl
        label={getElementLabel(propertyPath)}
        value={value}
        onChange={(val) => updateThemeProperty(propertyPath, val)}
      />
      <div
        className="h-20 rounded-md border-2"
        style={{ backgroundColor: `hsl(${value})` }}
      />
    </div>
  );
}

/**
 * TypographyPropertyEditor Component
 */
interface TypographyPropertyEditorProps {
  propertyPath: string;
}

function TypographyPropertyEditor({ propertyPath }: TypographyPropertyEditorProps) {
  const { getProperty, updateThemeProperty } = useThemeStore();
  const value = getProperty(propertyPath) || '';

  // Determine property type from path
  const isFontFamily = propertyPath.includes('fontFamily');
  const isFontSize = propertyPath.includes('fontSize');
  const isFontWeight = propertyPath.includes('fontWeight');
  const isLineHeight = propertyPath.includes('lineHeight');

  if (isFontFamily) {
    return (
      <FontControl
        label={getElementLabel(propertyPath)}
        value={value.replace(', sans-serif', '')}
        onChange={(val) => updateThemeProperty(propertyPath, `${val}, sans-serif`)}
      />
    );
  }

  if (isFontSize) {
    return (
      <SliderControl
        label={getElementLabel(propertyPath)}
        value={value}
        onChange={(val) => updateThemeProperty(propertyPath, val)}
        min={0.5}
        max={4}
        step={0.125}
        unit="rem"
      />
    );
  }

  if (isFontWeight) {
    return (
      <div className="space-y-2">
        <Label className="text-sm font-medium">{getElementLabel(propertyPath)}</Label>
        <Select value={value} onValueChange={(val) => updateThemeProperty(propertyPath, val)}>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {FONT_WEIGHTS.map((weight) => (
              <SelectItem key={weight.value} value={weight.value}>
                {weight.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    );
  }

  if (isLineHeight) {
    return (
      <SliderControl
        label={getElementLabel(propertyPath)}
        value={value}
        onChange={(val) => updateThemeProperty(propertyPath, val)}
        min={1}
        max={2.5}
        step={0.05}
        unit=""
      />
    );
  }

  return null;
}

/**
 * SpacingPropertyEditor Component
 */
interface SpacingPropertyEditorProps {
  propertyPath: string;
}

function SpacingPropertyEditor({ propertyPath }: SpacingPropertyEditorProps) {
  const { getProperty, updateThemeProperty } = useThemeStore();
  const value = getProperty(propertyPath) || '0';

  return (
    <PresetControl
      label={getElementLabel(propertyPath)}
      value={value}
      onChange={(val) => updateThemeProperty(propertyPath, val)}
      presets={SPACING_PRESETS}
    />
  );
}

/**
 * BorderRadiusPropertyEditor Component
 */
interface BorderRadiusPropertyEditorProps {
  propertyPath: string;
}

function BorderRadiusPropertyEditor({ propertyPath }: BorderRadiusPropertyEditorProps) {
  const { getProperty, updateThemeProperty } = useThemeStore();
  const value = getProperty(propertyPath) || '0';

  return (
    <PresetControl
      label={getElementLabel(propertyPath)}
      value={value}
      onChange={(val) => updateThemeProperty(propertyPath, val)}
      presets={BORDER_RADIUS_PRESETS}
    />
  );
}

/**
 * ShadowPropertyEditor Component
 */
interface ShadowPropertyEditorProps {
  propertyPath: string;
}

function ShadowPropertyEditor({ propertyPath }: ShadowPropertyEditorProps) {
  const { getProperty, updateThemeProperty } = useThemeStore();
  const value = getProperty(propertyPath) || 'none';

  return (
    <PresetControl
      label={getElementLabel(propertyPath)}
      value={value}
      onChange={(val) => updateThemeProperty(propertyPath, val)}
      presets={SHADOW_PRESETS}
    />
  );
}

/**
 * PropertyEditor Component
 * Routes to the appropriate editor based on property path
 */
interface PropertyEditorProps {
  elementId: string;
}

function PropertyEditor({ elementId }: PropertyEditorProps) {
  // Layout elements (header, sidebar, main, footer, card)
  if (['header', 'sidebar', 'main', 'footer', 'card'].includes(elementId)) {
    return <LayoutElementEditor elementId={elementId} />;
  }

  // Color properties
  if (elementId.startsWith('colors.')) {
    return <ColorPropertyEditor propertyPath={elementId} />;
  }

  // Typography properties
  if (elementId.startsWith('typography.')) {
    return <TypographyPropertyEditor propertyPath={elementId} />;
  }

  // Spacing properties
  if (elementId.startsWith('spacing.')) {
    return <SpacingPropertyEditor propertyPath={elementId} />;
  }

  // Border radius properties
  if (elementId.startsWith('borderRadius.')) {
    return <BorderRadiusPropertyEditor propertyPath={elementId} />;
  }

  // Shadow properties
  if (elementId.startsWith('shadows.')) {
    return <ShadowPropertyEditor propertyPath={elementId} />;
  }

  return (
    <div className="text-sm text-muted-foreground">
      Unknown property type: {elementId}
    </div>
  );
}

/**
 * EmptyState Component
 */
function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center py-12 text-center px-4">
      <Info className="h-12 w-12 text-muted-foreground/50 mb-4" />
      <h3 className="font-semibold mb-2">No Element Selected</h3>
      <p className="text-sm text-muted-foreground max-w-sm">
        Select an element from the sidebar tree or click on an element in the canvas to edit its
        properties.
      </p>
    </div>
  );
}

/**
 * Main PropertiesPanel Component
 */
export function PropertiesPanel({ className }: PropertiesPanelProps) {
  const { selectedElement } = useThemeStore();

  return (
    <div className={cn('flex flex-col h-full border-l bg-background', className)}>
      {/* Header */}
      <div className="p-4 border-b">
        <h2 className="text-lg font-semibold">Properties</h2>
        <AnimatePresence mode="wait">
          {selectedElement && (
            <motion.p
              key={selectedElement}
              initial={{ opacity: 0, y: -5 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -5 }}
              transition={{ duration: 0.15 }}
              className="text-xs text-muted-foreground mt-1"
            >
              Editing: <code className="font-mono bg-muted px-1 py-0.5 rounded">{selectedElement}</code>
            </motion.p>
          )}
        </AnimatePresence>
      </div>

      {/* Content */}
      <ScrollArea className="flex-1">
        <div className="p-4">
          <AnimatePresence mode="wait">
            {selectedElement ? (
              <motion.div
                key={selectedElement}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.25, ease: 'easeInOut' }}
              >
                <PropertyEditor elementId={selectedElement} />
              </motion.div>
            ) : (
              <motion.div
                key="empty"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ duration: 0.2 }}
              >
                <EmptyState />
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </ScrollArea>
    </div>
  );
}
