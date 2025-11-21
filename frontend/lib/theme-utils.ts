/**
 * Validate WCAG contrast ratio between two HSL colors
 * @param hslColor1 HSL color string in format "h s% l%" or "h s l"
 * @param hslColor2 HSL color string in format "h s% l%" or "h s l"
 * @param level WCAG level to validate against ('AA' or 'AAA')
 * @param isLargeText Whether the text is considered large (18pt+ or 14pt+ bold)
 * @returns true if contrast meets WCAG requirements, false otherwise
 */
export function validateContrast(
  hslColor1: string,
  hslColor2: string,
  level: 'AA' | 'AAA' = 'AA',
  isLargeText: boolean = false
): boolean {
  // Parse HSL strings
  const hsl1 = parseHslString(hslColor1);
  const hsl2 = parseHslString(hslColor2);

  if (!hsl1 || !hsl2) {
    console.warn('Invalid HSL color format for contrast validation');
    return false;
  }

  // Convert to RGB
  const rgb1 = hslToRgb(...hsl1);
  const rgb2 = hslToRgb(...hsl2);

  // Calculate contrast ratio
  const ratio = getContrastRatio(rgb1, rgb2);

  // WCAG 2.1 requirements:
  // Level AA: 4.5:1 for normal text, 3:1 for large text
  // Level AAA: 7:1 for normal text, 4.5:1 for large text
  const requiredRatio = level === 'AAA'
    ? (isLargeText ? 4.5 : 7)
    : (isLargeText ? 3 : 4.5);

  return ratio >= requiredRatio;
}

/**
 * Generate a color palette from a base color (placeholder implementation)
 * @param baseColor Base HSL color string
 * @returns Object with generated palette colors
 */
export function generatePalette(baseColor: string): Record<string, string> {
  // Placeholder implementation - to be enhanced in future iterations
  return { primary: baseColor };
}

export const themeUtils = {
  validateContrast,
  generatePalette,
};

/**
 * Theme categories for organization
 */
export const THEME_CATEGORIES = [
  "corporate",
  "minimal",
  "creative",
  "nature",
  "premium",
  "vibrant",
] as const;

export type ThemeCategory = (typeof THEME_CATEGORIES)[number];

/**
 * Map of theme IDs to their categories
 */
const THEME_CATEGORY_MAP: Record<string, ThemeCategory> = {
  "default-light": "minimal",
  "default-dark": "minimal",
  "uns-kikaku": "corporate",
  "industrial": "corporate",
  "ocean-blue": "nature",
  "mint-green": "nature",
  "forest-green": "nature",
  "sunset": "nature",
  "royal-purple": "premium",
  "vibrant-coral": "vibrant",
  "monochrome": "minimal",
  "espresso": "premium",
};

/**
 * Get the category for a theme
 */
export function getCategoryForTheme(themeId: string): string {
  return THEME_CATEGORY_MAP[themeId] || "creative";
}

/**
 * Convert HSL to RGB
 * @param h Hue (0-360)
 * @param s Saturation (0-100)
 * @param l Lightness (0-100)
 * @returns [r, g, b] values (0-255)
 */
export function hslToRgb(h: number, s: number, l: number): [number, number, number] {
  // Normalize inputs
  h = h / 360;
  s = s / 100;
  l = l / 100;

  let r: number, g: number, b: number;

  if (s === 0) {
    r = g = b = l; // achromatic
  } else {
    const hue2rgb = (p: number, q: number, t: number) => {
      if (t < 0) t += 1;
      if (t > 1) t -= 1;
      if (t < 1 / 6) return p + (q - p) * 6 * t;
      if (t < 1 / 2) return q;
      if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;
      return p;
    };

    const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
    const p = 2 * l - q;
    r = hue2rgb(p, q, h + 1 / 3);
    g = hue2rgb(p, q, h);
    b = hue2rgb(p, q, h - 1 / 3);
  }

  return [Math.round(r * 255), Math.round(g * 255), Math.round(b * 255)];
}

/**
 * Parse HSL string from Tailwind format
 * @param hslString String in format "h s% l%" or "h s l"
 * @returns [h, s, l] values
 */
export function parseHslString(hslString: string): [number, number, number] | null {
  const parts = hslString.trim().split(/\s+/);
  if (parts.length !== 3) return null;

  const h = parseFloat(parts[0]);
  const s = parseFloat(parts[1].replace("%", ""));
  const l = parseFloat(parts[2].replace("%", ""));

  if (isNaN(h) || isNaN(s) || isNaN(l)) return null;

  return [h, s, l];
}

/**
 * Calculate relative luminance of RGB color
 * Used for WCAG contrast calculations
 */
export function getLuminance(r: number, g: number, b: number): number {
  const [rs, gs, bs] = [r, g, b].map((c) => {
    c = c / 255;
    return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
  });

  return 0.2126 * rs + 0.7152 * gs + 0.0722 * bs;
}

/**
 * Calculate contrast ratio between two colors
 * @returns Contrast ratio (1-21)
 */
export function getContrastRatio(rgb1: [number, number, number], rgb2: [number, number, number]): number {
  const lum1 = getLuminance(...rgb1);
  const lum2 = getLuminance(...rgb2);

  const lighter = Math.max(lum1, lum2);
  const darker = Math.min(lum1, lum2);

  return (lighter + 0.05) / (darker + 0.05);
}
