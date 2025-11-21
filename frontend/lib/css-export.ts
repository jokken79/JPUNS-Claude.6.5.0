/**
 * CSS Export Utility
 * Provides functions to export design tokens in various formats
 */

export interface DesignTokens {
  colors?: Record<string, string>;
  typography?: {
    fontFamily?: string;
    fontSizes?: Record<string, string>;
    fontWeights?: Record<string, string>;
    lineHeights?: Record<string, string>;
  };
  spacing?: Record<string, string>;
  shadows?: Record<string, string>;
  borderRadius?: Record<string, string>;
  gradients?: Record<string, string>;
}

/**
 * Export design tokens as CSS custom properties
 */
export function exportAsCSS(tokens: DesignTokens): string {
  let css = `:root {\n`;

  // Colors
  if (tokens.colors) {
    css += `  /* Colors */\n`;
    Object.entries(tokens.colors).forEach(([key, value]) => {
      css += `  --color-${key}: ${value};\n`;
    });
    css += `\n`;
  }

  // Typography
  if (tokens.typography) {
    css += `  /* Typography */\n`;

    if (tokens.typography.fontFamily) {
      css += `  --font-family: ${tokens.typography.fontFamily};\n`;
    }

    if (tokens.typography.fontSizes) {
      Object.entries(tokens.typography.fontSizes).forEach(([key, value]) => {
        css += `  --font-size-${key}: ${value};\n`;
      });
    }

    if (tokens.typography.fontWeights) {
      Object.entries(tokens.typography.fontWeights).forEach(([key, value]) => {
        css += `  --font-weight-${key}: ${value};\n`;
      });
    }

    if (tokens.typography.lineHeights) {
      Object.entries(tokens.typography.lineHeights).forEach(([key, value]) => {
        css += `  --line-height-${key}: ${value};\n`;
      });
    }

    css += `\n`;
  }

  // Spacing
  if (tokens.spacing) {
    css += `  /* Spacing */\n`;
    Object.entries(tokens.spacing).forEach(([key, value]) => {
      css += `  --spacing-${key}: ${value};\n`;
    });
    css += `\n`;
  }

  // Shadows
  if (tokens.shadows) {
    css += `  /* Shadows */\n`;
    Object.entries(tokens.shadows).forEach(([key, value]) => {
      css += `  --shadow-${key}: ${value};\n`;
    });
    css += `\n`;
  }

  // Border Radius
  if (tokens.borderRadius) {
    css += `  /* Border Radius */\n`;
    Object.entries(tokens.borderRadius).forEach(([key, value]) => {
      css += `  --radius-${key}: ${value};\n`;
    });
    css += `\n`;
  }

  // Gradients
  if (tokens.gradients) {
    css += `  /* Gradients */\n`;
    Object.entries(tokens.gradients).forEach(([key, value]) => {
      css += `  --gradient-${key}: ${value};\n`;
    });
  }

  css += `}\n`;

  return css;
}

/**
 * Export design tokens as Tailwind CSS config
 */
export function exportAsTailwind(tokens: DesignTokens): string {
  const config: any = {
    theme: {
      extend: {},
    },
  };

  // Colors
  if (tokens.colors) {
    config.theme.extend.colors = tokens.colors;
  }

  // Typography
  if (tokens.typography) {
    if (tokens.typography.fontFamily) {
      config.theme.extend.fontFamily = {
        sans: [tokens.typography.fontFamily, "sans-serif"],
      };
    }

    if (tokens.typography.fontSizes) {
      config.theme.extend.fontSize = {};
      Object.entries(tokens.typography.fontSizes).forEach(([key, value]) => {
        const lineHeight = tokens.typography?.lineHeights?.[key] || "1.5";
        config.theme.extend.fontSize[key] = [value, { lineHeight }];
      });
    }

    if (tokens.typography.fontWeights) {
      config.theme.extend.fontWeight = tokens.typography.fontWeights;
    }
  }

  // Spacing
  if (tokens.spacing) {
    config.theme.extend.spacing = tokens.spacing;
  }

  // Shadows
  if (tokens.shadows) {
    config.theme.extend.boxShadow = tokens.shadows;
  }

  // Border Radius
  if (tokens.borderRadius) {
    config.theme.extend.borderRadius = tokens.borderRadius;
  }

  // Gradients (as background images)
  if (tokens.gradients) {
    config.theme.extend.backgroundImage = tokens.gradients;
  }

  return `module.exports = ${JSON.stringify(config, null, 2)};`;
}

/**
 * Export design tokens as SCSS variables
 */
export function exportAsSCSS(tokens: DesignTokens): string {
  let scss = `// Design Tokens\n\n`;

  // Colors
  if (tokens.colors) {
    scss += `// Colors\n`;
    Object.entries(tokens.colors).forEach(([key, value]) => {
      scss += `$color-${key}: ${value};\n`;
    });
    scss += `\n`;
  }

  // Typography
  if (tokens.typography) {
    scss += `// Typography\n`;

    if (tokens.typography.fontFamily) {
      scss += `$font-family: ${tokens.typography.fontFamily};\n`;
    }

    if (tokens.typography.fontSizes) {
      Object.entries(tokens.typography.fontSizes).forEach(([key, value]) => {
        scss += `$font-size-${key}: ${value};\n`;
      });
    }

    if (tokens.typography.fontWeights) {
      Object.entries(tokens.typography.fontWeights).forEach(([key, value]) => {
        scss += `$font-weight-${key}: ${value};\n`;
      });
    }

    if (tokens.typography.lineHeights) {
      Object.entries(tokens.typography.lineHeights).forEach(([key, value]) => {
        scss += `$line-height-${key}: ${value};\n`;
      });
    }

    scss += `\n`;
  }

  // Spacing
  if (tokens.spacing) {
    scss += `// Spacing\n`;
    Object.entries(tokens.spacing).forEach(([key, value]) => {
      scss += `$spacing-${key}: ${value};\n`;
    });
    scss += `\n`;
  }

  // Shadows
  if (tokens.shadows) {
    scss += `// Shadows\n`;
    Object.entries(tokens.shadows).forEach(([key, value]) => {
      scss += `$shadow-${key}: ${value};\n`;
    });
    scss += `\n`;
  }

  // Border Radius
  if (tokens.borderRadius) {
    scss += `// Border Radius\n`;
    Object.entries(tokens.borderRadius).forEach(([key, value]) => {
      scss += `$radius-${key}: ${value};\n`;
    });
    scss += `\n`;
  }

  // Gradients
  if (tokens.gradients) {
    scss += `// Gradients\n`;
    Object.entries(tokens.gradients).forEach(([key, value]) => {
      scss += `$gradient-${key}: ${value};\n`;
    });
  }

  return scss;
}

/**
 * Export design tokens as JSON
 */
export function exportAsJSON(tokens: DesignTokens): string {
  return JSON.stringify(tokens, null, 2);
}

/**
 * Download a file with given content
 */
export function downloadFile(content: string, filename: string, type: string = "text/plain") {
  const blob = new Blob([content], { type });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

/**
 * Export and download design tokens in specified format
 */
export function exportAndDownload(
  tokens: DesignTokens,
  format: "css" | "tailwind" | "scss" | "json",
  filename?: string
) {
  let content: string;
  let defaultFilename: string;
  let mimeType: string;

  switch (format) {
    case "css":
      content = exportAsCSS(tokens);
      defaultFilename = "design-tokens.css";
      mimeType = "text/css";
      break;
    case "tailwind":
      content = exportAsTailwind(tokens);
      defaultFilename = "tailwind.config.js";
      mimeType = "text/javascript";
      break;
    case "scss":
      content = exportAsSCSS(tokens);
      defaultFilename = "design-tokens.scss";
      mimeType = "text/scss";
      break;
    case "json":
      content = exportAsJSON(tokens);
      defaultFilename = "design-tokens.json";
      mimeType = "application/json";
      break;
  }

  downloadFile(content, filename || defaultFilename, mimeType);
}
