export type CustomTheme = {
  id: string;
  name: string;
  colors: Record<string, string>;
};

const CUSTOM_THEMES_KEY = "custom-themes";

/**
 * Get custom themes from localStorage
 * Returns empty array if no custom themes exist or if running on server
 */
export function getCustomThemes(): CustomTheme[] {
  // Check if we're running on the server (SSR)
  if (typeof window === "undefined") {
    return [];
  }

  try {
    const stored = localStorage.getItem(CUSTOM_THEMES_KEY);
    if (!stored) {
      return [];
    }

    const parsed = JSON.parse(stored);
    if (!Array.isArray(parsed)) {
      return [];
    }

    return parsed;
  } catch (error) {
    console.error("Error loading custom themes:", error);
    return [];
  }
}

/**
 * Save custom themes to localStorage
 */
export function saveCustomThemes(themes: CustomTheme[]): void {
  if (typeof window === "undefined") {
    return;
  }

  try {
    localStorage.setItem(CUSTOM_THEMES_KEY, JSON.stringify(themes));
  } catch (error) {
    console.error("Error saving custom themes:", error);
  }
}

/**
 * Add a new custom theme
 */
export function addCustomTheme(theme: CustomTheme): void {
  const themes = getCustomThemes();
  themes.push(theme);
  saveCustomThemes(themes);
}

/**
 * Remove a custom theme by id
 */
export function removeCustomTheme(themeId: string): void {
  const themes = getCustomThemes();
  const filtered = themes.filter((t) => t.id !== themeId);
  saveCustomThemes(filtered);
}

/**
 * Update an existing custom theme
 */
export function updateCustomTheme(themeId: string, updates: Partial<CustomTheme>): void {
  const themes = getCustomThemes();
  const index = themes.findIndex((t) => t.id === themeId);

  if (index !== -1) {
    themes[index] = { ...themes[index], ...updates };
    saveCustomThemes(themes);
  }
}

/**
 * Clear all theme-related cache from localStorage
 * This includes custom themes and theme favorites
 */
export function clearThemeCache(): void {
  if (typeof window === "undefined") {
    return;
  }

  try {
    // Clear custom themes
    localStorage.removeItem(CUSTOM_THEMES_KEY);

    // Clear theme favorites
    localStorage.removeItem("theme-favorites");

    // Clear any other theme-related cache
    const themeKeys = Object.keys(localStorage).filter(key =>
      key.startsWith("theme-") || key.includes("custom-theme")
    );

    themeKeys.forEach(key => {
      localStorage.removeItem(key);
    });

    if (process.env.NODE_ENV === 'development') {
      console.log('🗑️ Theme cache cleared successfully');
    }
  } catch (error) {
    console.error("Error clearing theme cache:", error);
    throw error;
  }
}

/**
 * Get the size of theme cache in bytes
 */
export function getThemeCacheSize(): number {
  if (typeof window === "undefined") {
    return 0;
  }

  try {
    const customThemes = localStorage.getItem(CUSTOM_THEMES_KEY) || "";
    const favorites = localStorage.getItem("theme-favorites") || "";

    return new Blob([customThemes, favorites]).size;
  } catch (error) {
    console.error("Error calculating cache size:", error);
    return 0;
  }
}
