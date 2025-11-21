import { create } from 'zustand';

export interface ElementConfig {
  id: string;
  type: string;
  // CSS Properties
  backgroundColor?: string;
  textColor?: string;
  fontSize?: string;
  fontFamily?: string;
  fontWeight?: string;
  padding?: string;
  margin?: string;
  borderRadius?: string;
  boxShadow?: string;
  borderColor?: string;
  borderWidth?: string;
  // Additional properties
  properties?: Record<string, any>;
}

interface ThemeColors {
  '--background': string;
  '--foreground': string;
  '--card': string;
  '--card-foreground': string;
  '--popover': string;
  '--popover-foreground': string;
  '--primary': string;
  '--primary-foreground': string;
  '--secondary': string;
  '--secondary-foreground': string;
  '--muted': string;
  '--muted-foreground': string;
  '--accent': string;
  '--accent-foreground': string;
  '--destructive': string;
  '--destructive-foreground': string;
  '--border': string;
  '--input': string;
  '--ring': string;
  [key: string]: string;
}

interface ThemeLayout {
  header: ElementConfig;
  sidebar: ElementConfig;
  main: ElementConfig;
  footer: ElementConfig;
  card: ElementConfig;
  [key: string]: ElementConfig;
}

interface Theme {
  colors: ThemeColors;
  layout: ThemeLayout;
  typography?: Record<string, any>;
  spacing?: Record<string, any>;
  borderRadius?: Record<string, any>;
  shadows?: Record<string, any>;
  [key: string]: any;
}

interface ThemeStore {
  selectedElement: string | null;
  setSelectedElement: (element: string | null) => void;
  currentTheme: Theme;
  selectElement: (id: string | null) => void;
  updateThemeProperty: (path: string, value: any) => void;
  getProperty: (path: string) => any;
  previewMode: boolean;
  setPreviewMode: (mode: boolean) => void;
}

// Default theme configuration
const defaultTheme: Theme = {
  colors: {
    '--background': '0 0% 100%',
    '--foreground': '222.2 84% 4.9%',
    '--card': '0 0% 100%',
    '--card-foreground': '222.2 84% 4.9%',
    '--popover': '0 0% 100%',
    '--popover-foreground': '222.2 84% 4.9%',
    '--primary': '222.2 47.4% 11.2%',
    '--primary-foreground': '210 40% 98%',
    '--secondary': '210 40% 96.1%',
    '--secondary-foreground': '222.2 47.4% 11.2%',
    '--muted': '210 40% 96.1%',
    '--muted-foreground': '215.4 16.3% 46.9%',
    '--accent': '210 40% 96.1%',
    '--accent-foreground': '222.2 47.4% 11.2%',
    '--destructive': '0 84.2% 60.2%',
    '--destructive-foreground': '210 40% 98%',
    '--border': '214.3 31.8% 91.4%',
    '--input': '214.3 31.8% 91.4%',
    '--ring': '222.2 84% 4.9%',
  },
  layout: {
    header: {
      id: 'header',
      type: 'header',
      backgroundColor: 'hsl(var(--background))',
      textColor: 'hsl(var(--foreground))',
      fontSize: '1rem',
      fontFamily: 'Inter',
      fontWeight: '400',
      padding: '1rem',
      margin: '0',
      borderRadius: '0',
      boxShadow: 'none',
      borderColor: 'hsl(var(--border))',
      borderWidth: '0',
    },
    sidebar: {
      id: 'sidebar',
      type: 'sidebar',
      backgroundColor: 'hsl(var(--card))',
      textColor: 'hsl(var(--card-foreground))',
      fontSize: '0.875rem',
      fontFamily: 'Inter',
      fontWeight: '400',
      padding: '1rem',
      margin: '0',
      borderRadius: '0',
      boxShadow: 'none',
      borderColor: 'hsl(var(--border))',
      borderWidth: '0',
    },
    main: {
      id: 'main',
      type: 'main',
      backgroundColor: 'hsl(var(--background))',
      textColor: 'hsl(var(--foreground))',
      fontSize: '1rem',
      fontFamily: 'Inter',
      fontWeight: '400',
      padding: '1.5rem',
      margin: '0',
      borderRadius: '0',
      boxShadow: 'none',
      borderColor: 'hsl(var(--border))',
      borderWidth: '0',
    },
    footer: {
      id: 'footer',
      type: 'footer',
      backgroundColor: 'hsl(var(--card))',
      textColor: 'hsl(var(--card-foreground))',
      fontSize: '0.875rem',
      fontFamily: 'Inter',
      fontWeight: '400',
      padding: '1rem',
      margin: '0',
      borderRadius: '0',
      boxShadow: 'none',
      borderColor: 'hsl(var(--border))',
      borderWidth: '0',
    },
    card: {
      id: 'card',
      type: 'card',
      backgroundColor: 'hsl(var(--card))',
      textColor: 'hsl(var(--card-foreground))',
      fontSize: '1rem',
      fontFamily: 'Inter',
      fontWeight: '400',
      padding: '1rem',
      margin: '0',
      borderRadius: '0.5rem',
      boxShadow: '0 1px 3px 0 rgb(0 0 0 / 0.1)',
      borderColor: 'hsl(var(--border))',
      borderWidth: '1px',
    },
  },
  typography: {
    fontFamily: {
      heading: 'Inter, sans-serif',
      body: 'Inter, sans-serif',
      ui: 'Inter, sans-serif',
    },
    fontSize: {
      xs: '0.75rem',
      sm: '0.875rem',
      base: '1rem',
      lg: '1.125rem',
      xl: '1.25rem',
      '2xl': '1.5rem',
      '3xl': '1.875rem',
      '4xl': '2.25rem',
    },
    fontWeight: {
      normal: '400',
      medium: '500',
      semibold: '600',
      bold: '700',
    },
    lineHeight: {
      tight: '1.25',
      normal: '1.5',
      relaxed: '1.75',
    },
  },
  spacing: {
    xs: '0.25rem',
    sm: '0.5rem',
    md: '1rem',
    lg: '1.5rem',
    xl: '2rem',
    '2xl': '3rem',
    '3xl': '4rem',
    '4xl': '5rem',
  },
  borderRadius: {
    none: '0',
    sm: '0.125rem',
    md: '0.375rem',
    lg: '0.5rem',
    xl: '0.75rem',
    '2xl': '1rem',
    full: '9999px',
  },
  shadows: {
    sm: '0 1px 2px 0 rgb(0 0 0 / 0.05)',
    md: '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)',
    lg: '0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)',
    xl: '0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1)',
    '2xl': '0 25px 50px -12px rgb(0 0 0 / 0.25)',
    inner: 'inset 0 2px 4px 0 rgb(0 0 0 / 0.05)',
  },
};

// Helper function to get nested property value
function getNestedValue(obj: any, path: string): any {
  const keys = path.split('.');
  let current = obj;
  for (const key of keys) {
    if (current === undefined || current === null) {
      return undefined;
    }
    current = current[key];
  }
  return current;
}

// Helper function to set nested property value
function setNestedValue(obj: any, path: string, value: any): void {
  const keys = path.split('.');
  const lastKey = keys.pop();
  if (!lastKey) return;

  let current = obj;
  for (const key of keys) {
    if (!(key in current)) {
      current[key] = {};
    }
    current = current[key];
  }
  current[lastKey] = value;
}

export const useThemeStore = create<ThemeStore>((set, get) => ({
  selectedElement: null,
  setSelectedElement: (element) => set({ selectedElement: element }),
  currentTheme: defaultTheme,

  // Select element by ID
  selectElement: (id) => set({ selectedElement: id }),

  // Update theme property by path (e.g., "layout.header.backgroundColor")
  updateThemeProperty: (path, value) => {
    const { currentTheme } = get();
    const newTheme = JSON.parse(JSON.stringify(currentTheme)); // Deep clone
    setNestedValue(newTheme, path, value);
    set({ currentTheme: newTheme });
  },

  // Get property value by path
  getProperty: (path) => {
    const { currentTheme } = get();
    return getNestedValue(currentTheme, path);
  },

  previewMode: false,
  setPreviewMode: (mode) => set({ previewMode: mode }),
}));
