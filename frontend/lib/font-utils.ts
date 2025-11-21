/**
 * Font Utility Functions for 21-Font System
 *
 * Provides utilities for managing, applying, and querying fonts
 * in the UNS-ClaudeJP 4.2 application.
 */

// =============================================================================
// Types & Interfaces
// =============================================================================

/**
 * Font metadata information
 */
export interface FontInfo {
  /** Display name (e.g., "Work Sans") */
  name: string;
  /** CSS variable name (e.g., "--font-work-sans") */
  variable: string;
  /** Font category */
  category: 'Sans-serif' | 'Serif' | 'Display';
  /** Available font weights */
  weights: number[];
  /** Brief description of the font */
  description: string;
  /** Whether this font is recommended for this theme type */
  recommended: boolean;
  /** Usage recommendations */
  usage: {
    heading: boolean;
    body: boolean;
    ui: boolean;
  };
}

// =============================================================================
// Font Database
// =============================================================================

/**
 * Complete database of all 21 available fonts
 */
const FONTS_DATABASE: FontInfo[] = [
  // EXISTING FONTS (11)
  {
    name: 'Inter',
    variable: '--font-inter',
    category: 'Sans-serif',
    weights: [100, 200, 300, 400, 500, 600, 700, 800, 900],
    description: 'Neo Grotesque, designed for computer screens with excellent readability',
    recommended: true,
    usage: { heading: true, body: true, ui: true }
  },
  {
    name: 'Manrope',
    variable: '--font-manrope',
    category: 'Sans-serif',
    weights: [200, 300, 400, 500, 600, 700, 800],
    description: 'Geometric sans-serif with rounded terminals, modern and friendly',
    recommended: true,
    usage: { heading: true, body: true, ui: true }
  },
  {
    name: 'Space Grotesk',
    variable: '--font-space-grotesk',
    category: 'Sans-serif',
    weights: [300, 400, 500, 600, 700],
    description: 'Proportional variant of Space Mono, technical yet approachable',
    recommended: false,
    usage: { heading: true, body: false, ui: true }
  },
  {
    name: 'Urbanist',
    variable: '--font-urbanist',
    category: 'Sans-serif',
    weights: [100, 200, 300, 400, 500, 600, 700, 800, 900],
    description: 'Geometric sans-serif, clean and contemporary',
    recommended: true,
    usage: { heading: true, body: true, ui: true }
  },
  {
    name: 'Lora',
    variable: '--font-lora',
    category: 'Serif',
    weights: [400, 500, 600, 700],
    description: 'Calligraphic serif, excellent for body text with personality',
    recommended: true,
    usage: { heading: true, body: true, ui: false }
  },
  {
    name: 'Poppins',
    variable: '--font-poppins',
    category: 'Sans-serif',
    weights: [100, 200, 300, 400, 500, 600, 700, 800, 900],
    description: 'Geometric sans-serif, friendly and approachable',
    recommended: true,
    usage: { heading: true, body: true, ui: true }
  },
  {
    name: 'Playfair Display',
    variable: '--font-playfair-display',
    category: 'Serif',
    weights: [400, 500, 600, 700, 800, 900],
    description: 'Transitional serif, elegant and classic for headings',
    recommended: true,
    usage: { heading: true, body: false, ui: false }
  },
  {
    name: 'DM Sans',
    variable: '--font-dm-sans',
    category: 'Sans-serif',
    weights: [100, 200, 300, 400, 500, 600, 700, 800, 900],
    description: 'Geometric sans-serif, optimized for UI and text',
    recommended: true,
    usage: { heading: true, body: true, ui: true }
  },
  {
    name: 'Plus Jakarta Sans',
    variable: '--font-plus-jakarta-sans',
    category: 'Sans-serif',
    weights: [200, 300, 400, 500, 600, 700, 800],
    description: 'Geometric sans-serif, modern and versatile',
    recommended: true,
    usage: { heading: true, body: true, ui: true }
  },
  {
    name: 'Sora',
    variable: '--font-sora',
    category: 'Sans-serif',
    weights: [100, 200, 300, 400, 500, 600, 700, 800],
    description: 'Geometric sans-serif, technical and precise',
    recommended: false,
    usage: { heading: true, body: true, ui: true }
  },
  {
    name: 'Montserrat',
    variable: '--font-montserrat',
    category: 'Sans-serif',
    weights: [100, 200, 300, 400, 500, 600, 700, 800, 900],
    description: 'Geometric sans-serif inspired by Buenos Aires signage',
    recommended: true,
    usage: { heading: true, body: true, ui: true }
  },

  // NEW FONTS (10)
  {
    name: 'Work Sans',
    variable: '--font-work-sans',
    category: 'Sans-serif',
    weights: [100, 200, 300, 400, 500, 600, 700, 800, 900],
    description: 'Neo Grotesque, professional and optimized for screen display',
    recommended: true,
    usage: { heading: true, body: true, ui: true }
  },
  {
    name: 'IBM Plex Sans',
    variable: '--font-ibm-plex-sans',
    category: 'Sans-serif',
    weights: [100, 200, 300, 400, 500, 600, 700],
    description: 'Corporate typeface by IBM, technical and neutral',
    recommended: true,
    usage: { heading: true, body: true, ui: true }
  },
  {
    name: 'Rubik',
    variable: '--font-rubik',
    category: 'Sans-serif',
    weights: [300, 400, 500, 600, 700, 800, 900],
    description: 'Rounded sans-serif, friendly and approachable',
    recommended: true,
    usage: { heading: true, body: true, ui: true }
  },
  {
    name: 'Nunito',
    variable: '--font-nunito',
    category: 'Sans-serif',
    weights: [200, 300, 400, 500, 600, 700, 800, 900],
    description: 'Rounded sans-serif, warm and friendly',
    recommended: true,
    usage: { heading: true, body: true, ui: true }
  },
  {
    name: 'Source Sans 3',
    variable: '--font-source-sans-3',
    category: 'Sans-serif',
    weights: [200, 300, 400, 500, 600, 700, 800, 900],
    description: 'Humanist sans-serif by Adobe, highly legible',
    recommended: true,
    usage: { heading: true, body: true, ui: true }
  },
  {
    name: 'Lato',
    variable: '--font-lato',
    category: 'Sans-serif',
    weights: [100, 300, 400, 700, 900],
    description: 'Humanist sans-serif, warm and stable',
    recommended: true,
    usage: { heading: true, body: true, ui: true }
  },
  {
    name: 'Fira Sans',
    variable: '--font-fira-sans',
    category: 'Sans-serif',
    weights: [100, 200, 300, 400, 500, 600, 700, 800, 900],
    description: 'Humanist sans-serif by Mozilla, technical and clear',
    recommended: true,
    usage: { heading: true, body: true, ui: true }
  },
  {
    name: 'Open Sans',
    variable: '--font-open-sans',
    category: 'Sans-serif',
    weights: [300, 400, 500, 600, 700, 800],
    description: 'Humanist sans-serif, neutral and friendly',
    recommended: true,
    usage: { heading: true, body: true, ui: true }
  },
  {
    name: 'Roboto',
    variable: '--font-roboto',
    category: 'Sans-serif',
    weights: [100, 300, 400, 500, 700, 900],
    description: 'Neo Grotesque by Google, mechanical yet friendly',
    recommended: true,
    usage: { heading: true, body: true, ui: true }
  },
  {
    name: 'Libre Franklin',
    variable: '--font-libre-franklin',
    category: 'Sans-serif',
    weights: [100, 200, 300, 400, 500, 600, 700, 800, 900],
    description: 'Grotesque sans-serif, classic American style',
    recommended: true,
    usage: { heading: true, body: true, ui: true }
  }
];

// =============================================================================
// Utility Functions
// =============================================================================

/**
 * Get all available fonts with metadata
 *
 * @returns Array of all 21 fonts with complete metadata
 * @example
 * const fonts = getAllFonts();
 * console.log(fonts.length); // 21
 */
export function getAllFonts(): FontInfo[] {
  return [...FONTS_DATABASE];
}

/**
 * Get font metadata by display name
 *
 * @param name - Font display name (case-insensitive)
 * @returns Font metadata or undefined if not found
 * @example
 * const font = getFontByName('Work Sans');
 * console.log(font?.variable); // "--font-work-sans"
 */
export function getFontByName(name: string): FontInfo | undefined {
  const normalized = name.trim().toLowerCase();
  return FONTS_DATABASE.find(
    font => font.name.toLowerCase() === normalized
  );
}

/**
 * Get CSS variable name for a font
 *
 * @param name - Font display name (case-insensitive)
 * @returns CSS variable string or null if not found
 * @example
 * const variable = getFontVariable('Work Sans');
 * console.log(variable); // "--font-work-sans"
 */
export function getFontVariable(name: string): string | null {
  const font = getFontByName(name);
  return font ? font.variable : null;
}

/**
 * Convert CSS variable to display name
 *
 * @param variable - CSS variable name (e.g., "--font-work-sans")
 * @returns Font display name or the original variable if not found
 * @example
 * const name = getFontDisplayName('--font-work-sans');
 * console.log(name); // "Work Sans"
 */
export function getFontDisplayName(variable: string): string {
  const normalized = variable.trim();
  const font = FONTS_DATABASE.find(f => f.variable === normalized);
  return font ? font.name : normalized;
}

/**
 * Apply font to document root element
 *
 * Sets the CSS variable on document.documentElement to apply the font globally.
 *
 * @param fontName - Font display name
 * @returns true if font was applied successfully, false otherwise
 * @example
 * const success = applyFont('Work Sans');
 * if (success) {
 *   console.log('Font applied successfully');
 * }
 */
export function applyFont(fontName: string): boolean {
  // Check if we're in a browser environment
  if (typeof document === 'undefined') {
    console.warn('applyFont: Not in browser environment');
    return false;
  }

  const font = getFontByName(fontName);
  if (!font) {
    console.warn(`applyFont: Font "${fontName}" not found`);
    return false;
  }

  try {
    // Apply the font variable to document root
    document.documentElement.style.setProperty(
      '--font-primary',
      `var(${font.variable})`
    );
    return true;
  } catch (error) {
    console.error('applyFont: Error applying font', error);
    return false;
  }
}

/**
 * Validate if a font name exists in the database
 *
 * @param name - Font display name (case-insensitive)
 * @returns true if font exists, false otherwise
 * @example
 * console.log(isValidFontName('Work Sans')); // true
 * console.log(isValidFontName('Comic Sans')); // false
 */
export function isValidFontName(name: string): boolean {
  return getFontByName(name) !== undefined;
}

/**
 * Get fonts recommended for specific usage category
 *
 * @param category - Usage category to filter by
 * @returns Array of fonts recommended for the specified category
 * @example
 * const headingFonts = getRecommendedFonts('heading');
 * const bodyFonts = getRecommendedFonts('body');
 * const allFonts = getRecommendedFonts('all');
 */
export function getRecommendedFonts(
  category: 'heading' | 'body' | 'ui' | 'all'
): FontInfo[] {
  if (category === 'all') {
    return FONTS_DATABASE.filter(font => font.recommended);
  }

  return FONTS_DATABASE.filter(
    font => font.recommended && font.usage[category]
  );
}

/**
 * Get fonts by category type
 *
 * @param category - Font category
 * @returns Array of fonts matching the category
 * @example
 * const serifFonts = getFontsByCategory('Serif');
 * const sansSerifFonts = getFontsByCategory('Sans-serif');
 */
export function getFontsByCategory(
  category: 'Sans-serif' | 'Serif' | 'Display'
): FontInfo[] {
  return FONTS_DATABASE.filter(font => font.category === category);
}

/**
 * Search fonts by name or description
 *
 * @param query - Search query (case-insensitive)
 * @returns Array of fonts matching the search query
 * @example
 * const results = searchFonts('geometric');
 * const rounded = searchFonts('rounded');
 */
export function searchFonts(query: string): FontInfo[] {
  const normalized = query.trim().toLowerCase();
  if (!normalized) return [];

  return FONTS_DATABASE.filter(font => {
    return (
      font.name.toLowerCase().includes(normalized) ||
      font.description.toLowerCase().includes(normalized) ||
      font.category.toLowerCase().includes(normalized)
    );
  });
}

/**
 * Get font weight options for a specific font
 *
 * @param fontName - Font display name
 * @returns Array of available weights or empty array if font not found
 * @example
 * const weights = getFontWeights('Work Sans');
 * console.log(weights); // [100, 200, 300, 400, 500, 600, 700, 800, 900]
 */
export function getFontWeights(fontName: string): number[] {
  const font = getFontByName(fontName);
  return font ? [...font.weights] : [];
}

/**
 * Check if a font supports a specific weight
 *
 * @param fontName - Font display name
 * @param weight - Font weight to check (100-900)
 * @returns true if font supports the weight, false otherwise
 * @example
 * console.log(hasFontWeight('Work Sans', 700)); // true
 * console.log(hasFontWeight('Lora', 100)); // false
 */
export function hasFontWeight(fontName: string, weight: number): boolean {
  const font = getFontByName(fontName);
  return font ? font.weights.includes(weight) : false;
}
