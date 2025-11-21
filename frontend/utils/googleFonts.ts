export interface GoogleFont {
  family: string;
  variants: string[];
  category: string;
  displayName: string;
}

export interface FontCategory {
  name: string;
  fonts: GoogleFont[];
}

export interface FontPairing {
  name: string;
  heading: string;
  body: string;
}

export interface FontStats {
  totalAvailable: number;
  loaded: number;
  loading: number;
  loadedFonts: string[];
  loadingFonts: string[];
}

const fontLoadState = {
  loaded: new Set<string>(),
  loading: new Set<string>(),
};

const fontPromises = new Map<string, Promise<void>>();

export const GOOGLE_FONTS: FontCategory[] = [
  {
    name: 'Sans Serif',
    fonts: [
      {
        family: 'Inter',
        variants: ['100', '200', '300', '400', '500', '600', '700', '800', '900'],
        category: 'sans-serif',
        displayName: 'Inter',
      },
      {
        family: 'Roboto',
        variants: ['100', '300', '400', '500', '700', '900'],
        category: 'sans-serif',
        displayName: 'Roboto',
      },
      {
        family: 'Noto Sans JP',
        variants: ['100', '200', '300', '400', '500', '600', '700', '900'],
        category: 'sans-serif',
        displayName: 'Noto Sans JP',
      },
    ],
  },
  {
    name: 'Serif',
    fonts: [
      {
        family: 'Noto Serif JP',
        variants: ['200', '300', '400', '500', '600', '700', '900'],
        category: 'serif',
        displayName: 'Noto Serif JP',
      },
      {
        family: 'Merriweather',
        variants: ['300', '400', '700', '900'],
        category: 'serif',
        displayName: 'Merriweather',
      },
    ],
  },
  {
    name: 'Display',
    fonts: [
      {
        family: 'Playfair Display',
        variants: ['400', '500', '600', '700', '800', '900'],
        category: 'display',
        displayName: 'Playfair Display',
      },
      {
        family: 'Oswald',
        variants: ['200', '300', '400', '500', '600', '700'],
        category: 'display',
        displayName: 'Oswald',
      },
    ],
  },
];

export const ALL_GOOGLE_FONTS: string[] = GOOGLE_FONTS.flatMap(category =>
  category.fonts.map(font => font.family)
);

export const FONT_PAIRINGS: FontPairing[] = [
  {
    name: 'Modern Minimal',
    heading: 'Inter',
    body: 'Roboto',
  },
  {
    name: 'Elegant Editorial',
    heading: 'Playfair Display',
    body: 'Inter',
  },
  {
    name: 'Professional JP',
    heading: 'Noto Sans JP',
    body: 'Roboto',
  },
  {
    name: 'Classic Serif',
    heading: 'Noto Serif JP',
    body: 'Inter',
  },
];

const waitForFont = async (family: string): Promise<void> => {
  if (typeof document === 'undefined' || typeof document.fonts === 'undefined') {
    return;
  }

  try {
    await document.fonts.load(`1rem ${family}`);
  } catch {
    // Ignore failures – the browser may still render the font once loaded.
  }
};

export function getFontByFamily(family: string): GoogleFont | undefined {
  for (const category of GOOGLE_FONTS) {
    const font = category.fonts.find(f => f.family === family);
    if (font) {
      return font;
    }
  }
  return undefined;
}

export function getAllFontFamilies(): string[] {
  return [...ALL_GOOGLE_FONTS];
}

export function getFontCategory(family: string): string | undefined {
  for (const category of GOOGLE_FONTS) {
    if (category.fonts.some(font => font.family === family)) {
      return category.name;
    }
  }
  return undefined;
}

export function buildGoogleFontsUrl(fonts: { family: string; variants?: string[] }[]): string {
  const fontFamilies = fonts.map(font => {
    const family = font.family.replace(/ /g, '+');
    const variants = font.variants && font.variants.length > 0 ? `:wght@${font.variants.join(';')}` : '';
    return `family=${family}${variants}`;
  });

  return `https://fonts.googleapis.com/css2?${fontFamilies.join('&')}&display=swap`;
}

export function getFontsByCategory(categoryName: string): GoogleFont[] {
  const category = GOOGLE_FONTS.find(cat => cat.name === categoryName);
  return category ? category.fonts : [];
}

export function getFontStats(): FontStats {
  return {
    totalAvailable: ALL_GOOGLE_FONTS.length,
    loaded: fontLoadState.loaded.size,
    loading: fontLoadState.loading.size,
    loadedFonts: Array.from(fontLoadState.loaded),
    loadingFonts: Array.from(fontLoadState.loading),
  };
}

export function getRandomFontPairing(): FontPairing {
  if (FONT_PAIRINGS.length === 0) {
    return { name: 'Default', heading: 'Inter', body: 'Roboto' };
  }

  const index = Math.floor(Math.random() * FONT_PAIRINGS.length);
  return FONT_PAIRINGS[index];
}

export async function loadGoogleFont(family: string): Promise<void> {
  if (!family) return;

  if (fontLoadState.loaded.has(family)) {
    return;
  }

  if (fontPromises.has(family)) {
    return fontPromises.get(family);
  }

  if (typeof document === 'undefined') {
    // Server environment – skip loading.
    return;
  }

  const font = getFontByFamily(family);
  if (!font) {
    return;
  }

  fontLoadState.loading.add(family);

  const promise = new Promise<void>((resolve, reject) => {
    const existingLink = document.querySelector<HTMLLinkElement>(`link[data-google-font=\"${family}\"]`);
    if (existingLink) {
      resolve();
      return;
    }

    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = buildGoogleFontsUrl([{ family, variants: font.variants }]);
    link.setAttribute('data-google-font', family);
    link.onload = () => resolve();
    link.onerror = () => reject(new Error(`Failed to load font ${family}`));
    document.head.appendChild(link);
  })
    .then(() => waitForFont(family))
    .then(() => {
      fontLoadState.loading.delete(family);
      fontLoadState.loaded.add(family);
    })
    .catch(error => {
      fontLoadState.loading.delete(family);
      throw error;
    })
    .finally(() => {
      fontPromises.delete(family);
    });

  fontPromises.set(family, promise);
  return promise;
}

export function isFontLoaded(family: string): boolean {
  if (!family) return false;
  if (fontLoadState.loaded.has(family)) {
    return true;
  }

  if (typeof document === 'undefined' || typeof document.fonts === 'undefined') {
    return false;
  }

  try {
    return document.fonts.check(`1rem ${family}`);
  } catch {
    return false;
  }
}

export function loadGoogleFontsBulk(families: string[]): Promise<void[]> {
  return Promise.all(families.map(font => loadGoogleFont(font)));
}
