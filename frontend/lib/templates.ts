export interface TemplateLike {
  id: string;
  name: string;
  config: Record<string, any>;
  isCustom?: boolean;
}

export interface TemplateSelection {
  type: 'preset' | 'custom';
  id: string;
}

export const TEMPLATE_EVENT_NAME = 'template-applied';
export const TEMPLATE_STORAGE_KEY = 'template-storage';
export const CUSTOM_TEMPLATE_STORAGE_KEY = 'custom-template-storage';

// Default template configuration
const DEFAULT_TEMPLATE: TemplateLike = {
  id: 'default',
  name: 'Default Template',
  config: {
    colors: {
      primary: '#3b82f6',
      secondary: '#64748b',
      accent: '#8b5cf6',
      background: '#ffffff',
      foreground: '#0f172a',
    },
    typography: {
      fontFamily: 'system-ui, -apple-system, sans-serif',
      fontSize: '16px',
    },
  },
};

// Preset templates (basic implementation)
const PRESET_TEMPLATES: TemplateLike[] = [
  DEFAULT_TEMPLATE,
  {
    id: 'modern',
    name: 'Modern',
    config: {
      colors: {
        primary: '#6366f1',
        secondary: '#a855f7',
        accent: '#ec4899',
        background: '#ffffff',
        foreground: '#1e293b',
      },
    },
  },
  {
    id: 'dark',
    name: 'Dark',
    config: {
      colors: {
        primary: '#60a5fa',
        secondary: '#818cf8',
        accent: '#a78bfa',
        background: '#0f172a',
        foreground: '#f1f5f9',
      },
    },
  },
];

export const applyTemplateToDocument = (template: TemplateLike): void => {
  try {
    // Apply template colors to CSS variables
    if (template.config?.colors) {
      const root = document.documentElement;
      Object.entries(template.config.colors).forEach(([key, value]) => {
        root.style.setProperty(`--color-${key}`, value as string);
      });
    }

    // Apply typography settings
    if (template.config?.typography) {
      const root = document.documentElement;
      Object.entries(template.config.typography).forEach(([key, value]) => {
        root.style.setProperty(`--${key}`, value as string);
      });
    }

    // Dispatch event to notify listeners
    window.dispatchEvent(new CustomEvent(TEMPLATE_EVENT_NAME, { detail: template }));
  } catch (error) {
    console.error('Error applying template to document:', error);
  }
};

export const getActiveTemplateSelection = (): TemplateSelection => {
  try {
    if (typeof window === 'undefined') {
      return { type: 'preset', id: DEFAULT_TEMPLATE.id };
    }

    const stored = localStorage.getItem(TEMPLATE_STORAGE_KEY);
    if (stored) {
      const parsed = JSON.parse(stored) as TemplateSelection;
      // Validate the structure
      if (parsed.type && parsed.id) {
        return parsed;
      }
    }
  } catch (error) {
    console.warn('Error reading template selection from localStorage:', error);
  }

  // Return default selection
  return { type: 'preset', id: DEFAULT_TEMPLATE.id };
};

export const getDefaultTemplate = (): TemplateLike => {
  return DEFAULT_TEMPLATE;
};

export const getTemplateById = (id: string): TemplateLike | undefined => {
  return PRESET_TEMPLATES.find(template => template.id === id);
};

export const setActiveTemplateSelection = (selection: TemplateSelection): void => {
  try {
    if (typeof window === 'undefined') {
      return;
    }

    localStorage.setItem(TEMPLATE_STORAGE_KEY, JSON.stringify(selection));

    // Dispatch event to notify listeners
    window.dispatchEvent(new CustomEvent(TEMPLATE_EVENT_NAME, { detail: selection }));
  } catch (error) {
    console.error('Error saving template selection to localStorage:', error);
  }
};

export const toTemplateLike = (template: any): TemplateLike => {
  // If it's already a TemplateLike, return as is
  if (template && typeof template === 'object' && template.id && template.name && template.config) {
    return template as TemplateLike;
  }

  // Fallback to default template
  console.warn('Invalid template object, returning default template');
  return DEFAULT_TEMPLATE;
};
