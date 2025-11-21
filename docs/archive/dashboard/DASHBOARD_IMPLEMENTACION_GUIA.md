# 🎨 GUÍA DE IMPLEMENTACIÓN: Dashboard con Dark/Light Mode

## ⚡ INICIO RÁPIDO

### **Paso 1: Ejecuta el setup**
```bash
# Desde la raíz del proyecto
SETUP_DASHBOARD.bat
```

Este script creará:
- ✅ Carpetas necesarias
- ✅ Instalará `next-themes`

---

### **Paso 2: Crea los archivos**

Usa esta guía para crear cada archivo. Copia el contenido exactamente como aparece.

---

## 📁 ARCHIVOS A CREAR (Total: 15 archivos)

### **1. Theme Context** 
📄 `frontend/contexts/theme-context.tsx`

```typescript
import { createContext, useContext, useEffect, useState } from 'react'

type Theme = 'light' | 'dark' | 'system'

interface ThemeContextType {
  theme: Theme
  setTheme: (theme: Theme) => void
  resolvedTheme: 'light' | 'dark'
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined)

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setThemeState] = useState<Theme>('system')
  const [resolvedTheme, setResolvedTheme] = useState<'light' | 'dark'>('light')

  useEffect(() => {
    const stored = localStorage.getItem('theme') as Theme | null
    if (stored) {
      setThemeState(stored)
    }
  }, [])

  useEffect(() => {
    const root = window.document.documentElement
    root.classList.remove('light', 'dark')

    let resolved: 'light' | 'dark'

    if (theme === 'system') {
      const systemTheme = window.matchMedia('(prefers-color-scheme: dark)').matches
        ? 'dark'
        : 'light'
      resolved = systemTheme
    } else {
      resolved = theme
    }

    root.classList.add(resolved)
    setResolvedTheme(resolved)
    localStorage.setItem('theme', theme)
  }, [theme])

  const setTheme = (newTheme: Theme) => {
    setThemeState(newTheme)
  }

  return (
    <ThemeContext.Provider value={{ theme, setTheme, resolvedTheme }}>
      {children}
    </ThemeContext.Provider>
  )
}

export function useTheme() {
  const context = useContext(ThemeContext)
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider')
  }
  return context
}
```

---

### **2. Theme Toggle Button**
📄 `frontend/components/ui/theme-toggle.tsx`

```typescript
'use client'

import { Moon, Sun } from 'lucide-react'
import { useTheme } from '@/contexts/theme-context'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'

export function ThemeToggle() {
  const { theme, setTheme } = useTheme()

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="h-9 w-9">
          <Sun className="h-[1.2rem] w-[1.2rem] rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
          <Moon className="absolute h-[1.2rem] w-[1.2rem] rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
          <span className="sr-only">Toggle theme</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={() => setTheme('light')}>
          <Sun className="mr-2 h-4 w-4" />
          <span>Light</span>
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => setTheme('dark')}>
          <Moon className="mr-2 h-4 w-4" />
          <span>Dark</span>
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => setTheme('system')}>
          <span className="mr-2 h-4 w-4">💻</span>
          <span>System</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
```

---

### **3. Design Tokens**
📄 `frontend/lib/design-tokens.ts`

```typescript
export const designTokens = {
  layout: {
    sidebarWidth: '280px',
    sidebarCollapsed: '64px',
    navbarHeight: '64px',
    contentPadding: '24px',
  },
  spacing: {
    cardPadding: '24px',
    cardGap: '24px',
    gridGap: '24px',
  },
  typography: {
    fontFamily: {
      sans: ['Inter', 'system-ui', 'sans-serif'],
      mono: ['JetBrains Mono', 'Courier New', 'monospace'],
    },
    fontSize: {
      metricValue: '2.25rem',
      metricLabel: '0.875rem',
      h1: '1.875rem',
      h2: '1.5rem',
      h3: '1.25rem',
      base: '1rem',
      sm: '0.875rem',
      xs: '0.75rem',
    },
  },
  shadows: {
    card: '0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1)',
    cardHover: '0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)',
    navbar: '0 1px 3px 0 rgb(0 0 0 / 0.05)',
  },
  radius: {
    card: '12px',
    button: '8px',
    input: '8px',
    badge: '6px',
  },
  animations: {
    cardHover: {
      transform: 'translateY(-4px)',
      transition: 'all 200ms ease-in-out',
    },
    sidebarToggle: {
      transition: 'width 300ms cubic-bezier(0.4, 0, 0.2, 1)',
    },
  },
  breakpoints: {
    mobile: '640px',
    tablet: '768px',
    desktop: '1024px',
    wide: '1280px',
  },
} as const
```

---

## 💡 SIGUIENTE PASO

Una vez ejecutes `SETUP_DASHBOARD.bat` y hayas creado estos 3 archivos iniciales, **responde "CONTINUAR"** y te daré los siguientes 12 archivos.

---

**Estado Actual:**
- ✅ Archivos 1-3 de 15 (20%)
- ⏳ Siguientes: Layout components (Sidebar, Navbar)
- ⏳ Después: Dashboard components (Cards, Charts, Tables)

**Tiempo estimado restante:** 4 horas

---

¿Listo para continuar con los siguientes archivos?
