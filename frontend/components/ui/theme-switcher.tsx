"use client";

import * as React from "react";
import { useTheme } from "next-themes";

const AVAILABLE_THEMES = ['light', 'dark'];

export function ThemeSwitcher() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return null;
  }

  return (
    <div className="flex items-center space-x-2">
      <label htmlFor="theme-switcher" className="text-sm font-medium text-foreground">
        Theme
      </label>
      <select
        id="theme-switcher"
        value={theme}
        onChange={(e) => setTheme(e.target.value)}
        className="block w-full px-3 py-2 bg-background border border-input rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary sm:text-sm text-foreground"
      >
        {AVAILABLE_THEMES.map((t) => (
          <option key={t} value={t}>
            {t.charAt(0).toUpperCase() + t.slice(1)}
          </option>
        ))}
      </select>
    </div>
  );
}
