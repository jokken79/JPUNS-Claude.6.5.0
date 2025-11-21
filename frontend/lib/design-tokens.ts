/**
 * Design Tokens - Dashboard Template
 * Extracted from: https://dashboard-template-1-ivory.vercel.app
 */

export const designTokens = {
  // Layout
  layout: {
    sidebarWidth: '280px',
    sidebarCollapsed: '64px',
    navbarHeight: '64px',
    contentPadding: '24px',
  },

  // Spacing
  spacing: {
    cardPadding: '24px',
    cardGap: '24px',
    gridGap: '24px',
  },

  // Typography
  typography: {
    fontFamily: {
      sans: ['Inter', 'system-ui', 'sans-serif'],
      mono: ['JetBrains Mono', 'Courier New', 'monospace'],
    },
    fontSize: {
      metricValue: '2.25rem', // 36px
      metricLabel: '0.875rem', // 14px
      h1: '1.875rem', // 30px
      h2: '1.5rem', // 24px
      h3: '1.25rem', // 20px
      base: '1rem', // 16px
      sm: '0.875rem', // 14px
      xs: '0.75rem', // 12px
    },
  },

  // Shadows
  shadows: {
    card: '0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1)',
    cardHover:
      '0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)',
    navbar: '0 1px 3px 0 rgb(0 0 0 / 0.05)',
  },

  // Border Radius
  radius: {
    card: '12px',
    button: '8px',
    input: '8px',
    badge: '6px',
  },

  // Animations
  animations: {
    cardHover: {
      transform: 'translateY(-4px)',
      transition: 'all 200ms ease-in-out',
    },
    sidebarToggle: {
      transition: 'width 300ms cubic-bezier(0.4, 0, 0.2, 1)',
    },
  },

  // Breakpoints
  breakpoints: {
    mobile: '640px',
    tablet: '768px',
    desktop: '1024px',
    wide: '1280px',
  },
} as const
