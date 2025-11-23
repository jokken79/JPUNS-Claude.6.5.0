# 🎨 SNEAT PRO - PARTE 1: Core + eCommerce Dashboard

## 📋 ARCHIVOS EN ESTA PARTE (15 archivos)

### **Core System (5 archivos)**
1. Design Tokens
2. Theme Context
3. Sneat Layout
4. Glass Sidebar ⭐
5. Glass Navbar

### **UI Components (5 archivos)**
6. Glass Card ⭐
7. Stat Card
8. Gradient Button
9. Badge
10. Avatar Group

### **eCommerce Dashboard (5 archivos)**
11. Sales Overview
12. Product Grid (adaptado a Employees)
13. Order Table (adaptado a Hiring)
14. Revenue Chart (adaptado a Payroll)
15. Dashboard Page

---

## 📁 ARCHIVO 1/15: Design Tokens

**Ruta:** `themes/sneat-pro/src/lib/sneat-design-tokens.ts`

```typescript
/**
 * Sneat Pro Design Tokens
 * Purple Gradient Theme - Premium Dashboard
 */

export const sneatTokens = {
  // PURPLE COLOR SYSTEM
  colors: {
    primary: {
      50: '#F5F3FF',
      100: '#EDE9FE',
      200: '#DDD6FE',
      300: '#C4B5FD',
      400: '#A78BFA',
      500: '#7367F0',  // Main brand
      600: '#5E5CE6',
      700: '#4338CA',
      800: '#3730A3',
      900: '#312E81',
    },
    
    secondary: {
      DEFAULT: '#82868B',
      light: '#A8AAAE',
      dark: '#4B5563',
    },
    
    success: '#28C76F',
    warning: '#FF9F43',
    error: '#EA5455',
    info: '#00CFE8',
    
    dark: {
      bg: '#25293C',
      card: '#2F3349',
      border: '#3F4459',
      text: '#CFD3EC',
    },
  },
  
  gradients: {
    purple: 'linear-gradient(135deg, #7367F0 0%, #5E5CE6 100%)',
    blue: 'linear-gradient(135deg, #667EEA 0%, #764BA2 100%)',
    pink: 'linear-gradient(135deg, #F857A6 0%, #FF5858 100%)',
    green: 'linear-gradient(135deg, #28C76F 0%, #48DA89 100%)',
  },
  
  glass: {
    sidebar: {
      background: 'linear-gradient(135deg, rgba(115, 103, 240, 0.95), rgba(94, 92, 230, 0.95))',
      backdropFilter: 'blur(20px) saturate(180%)',
      border: '1px solid rgba(255, 255, 255, 0.125)',
      boxShadow: '0 8px 32px rgba(115, 103, 240, 0.2)',
    },
    
    card: {
      light: {
        background: 'rgba(255, 255, 255, 0.75)',
        backdropFilter: 'blur(10px)',
        border: '1px solid rgba(255, 255, 255, 0.5)',
      },
      dark: {
        background: 'rgba(47, 51, 73, 0.8)',
        backdropFilter: 'blur(10px)',
        border: '1px solid rgba(63, 68, 89, 0.5)',
      },
    },
  },
  
  layout: {
    sidebarWidth: '280px',
    sidebarCollapsed: '80px',
    navbarHeight: '64px',
  },
  
  shadows: {
    purple: '0 4px 24px rgba(115, 103, 240, 0.25)',
    purpleHover: '0 8px 32px rgba(115, 103, 240, 0.35)',
  },
} as const

export const { colors, gradients, glass, layout, shadows } = sneatTokens
```

---

## 📁 ARCHIVO 2/15: Theme Context

**Ruta:** `themes/sneat-pro/src/contexts/theme-context.tsx`

```typescript
'use client'

import { createContext, useContext, useEffect, useState } from 'react'

type Theme = 'light' | 'dark' | 'system'

interface ThemeContextType {
  theme: Theme
  setTheme: (theme: Theme) => void
  resolvedTheme: 'light' | 'dark'
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined)

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setThemeState] = useState<Theme>('light')
  const [resolvedTheme, setResolvedTheme] = useState<'light' | 'dark'>('light')
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
    const stored = localStorage.getItem('sneat-theme') as Theme | null
    if (stored) setThemeState(stored)
  }, [])

  useEffect(() => {
    if (!mounted) return

    const root = window.document.documentElement
    root.classList.remove('light', 'dark')

    let resolved: 'light' | 'dark'
    if (theme === 'system') {
      resolved = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
    } else {
      resolved = theme
    }

    root.classList.add(resolved)
    setResolvedTheme(resolved)
    localStorage.setItem('sneat-theme', theme)
  }, [theme, mounted])

  if (!mounted) return <>{children}</>

  return (
    <ThemeContext.Provider value={{ theme, setTheme: setThemeState, resolvedTheme }}>
      {children}
    </ThemeContext.Provider>
  )
}

export function useTheme() {
  const context = useContext(ThemeContext)
  if (!context) throw new Error('useTheme must be used within ThemeProvider')
  return context
}
```

---

## 📁 ARCHIVO 3/15: Sneat Layout

**Ruta:** `themes/sneat-pro/src/components/layout/sneat-layout.tsx`

```typescript
'use client'

import { useState } from 'react'
import { SneatSidebar } from './sneat-sidebar'
import { SneatNavbar } from './sneat-navbar'
import { cn } from '@/lib/utils'

interface SneatLayoutProps {
  children: React.ReactNode
}

export function SneatLayout({ children }: SneatLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)

  return (
    <div className="flex h-screen overflow-hidden bg-gray-50 dark:bg-slate-900">
      {/* Sidebar Desktop */}
      <aside
        className={cn(
          'hidden lg:flex lg:flex-shrink-0 transition-all duration-300',
          sidebarCollapsed ? 'lg:w-20' : 'lg:w-[280px]'
        )}
      >
        <SneatSidebar
          collapsed={sidebarCollapsed}
          onToggleCollapse={() => setSidebarCollapsed(!sidebarCollapsed)}
        />
      </aside>

      {/* Mobile Overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar Mobile */}
      <aside
        className={cn(
          'fixed inset-y-0 left-0 z-50 w-[280px] transform transition-transform duration-300 lg:hidden',
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        <SneatSidebar
          collapsed={false}
          onToggleCollapse={() => {}}
          onClose={() => setSidebarOpen(false)}
        />
      </aside>

      {/* Main Content */}
      <div className="flex flex-1 flex-col overflow-hidden">
        <SneatNavbar onMenuClick={() => setSidebarOpen(true)} />
        
        <main className="flex-1 overflow-y-auto overflow-x-hidden">
          <div className="container mx-auto px-6 py-8">
            {children}
          </div>
        </main>
      </div>
    </div>
  )
}
```

---

## 📁 ARCHIVO 4/15: Glass Sidebar ⭐ (SIGNATURE)

**Ruta:** `themes/sneat-pro/src/components/layout/sneat-sidebar.tsx`

```typescript
'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  LayoutDashboard,
  ShoppingCart,
  BarChart3,
  Users,
  GraduationCap,
  Truck,
  Share2,
  ChevronLeft,
  ChevronRight,
  X,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'

interface SneatSidebarProps {
  collapsed: boolean
  onToggleCollapse: () => void
  onClose?: () => void
}

const menuItems = [
  { title: 'eCommerce', icon: ShoppingCart, href: '/dashboard/ecommerce' },
  { title: 'Analytics', icon: BarChart3, href: '/dashboard/analytics' },
  { title: 'CRM', icon: Users, href: '/dashboard/crm' },
  { title: 'Academy', icon: GraduationCap, href: '/dashboard/academy' },
  { title: 'Logistics', icon: Truck, href: '/dashboard/logistics' },
  { title: 'Social', icon: Share2, href: '/dashboard/social' },
]

export function SneatSidebar({ collapsed, onToggleCollapse, onClose }: SneatSidebarProps) {
  const pathname = usePathname()

  return (
    <div 
      className="flex h-full flex-col relative"
      style={{
        background: 'linear-gradient(135deg, rgba(115, 103, 240, 0.95), rgba(94, 92, 230, 0.95))',
        backdropFilter: 'blur(20px) saturate(180%)',
        boxShadow: '0 8px 32px rgba(115, 103, 240, 0.2)',
      }}
    >
      {/* Header */}
      <div className="flex h-16 items-center justify-between px-4 border-b border-white/10">
        {!collapsed && (
          <Link href="/dashboard/ecommerce" className="flex items-center gap-2">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/20">
              <LayoutDashboard className="h-6 w-6 text-white" />
            </div>
            <div className="flex flex-col">
              <span className="text-lg font-bold text-white">Sneat</span>
              <span className="text-xs text-white/70">Pro Dashboard</span>
            </div>
          </Link>
        )}

        {onClose && (
          <Button variant="ghost" size="icon" onClick={onClose} className="lg:hidden text-white hover:bg-white/10">
            <X className="h-5 w-5" />
          </Button>
        )}

        {!onClose && (
          <Button
            variant="ghost"
            size="icon"
            onClick={onToggleCollapse}
            className="hidden lg:flex text-white hover:bg-white/10"
          >
            {collapsed ? <ChevronRight className="h-5 w-5" /> : <ChevronLeft className="h-5 w-5" />}
          </Button>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 space-y-1 px-3 py-4 overflow-y-auto">
        {menuItems.map((item) => {
          const Icon = item.icon
          const isActive = pathname === item.href

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex items-center gap-3 rounded-xl px-3 py-3 text-sm font-medium transition-all duration-200',
                isActive
                  ? 'bg-white text-purple-600 shadow-lg'
                  : 'text-white/90 hover:bg-white/10 hover:text-white',
                collapsed && 'justify-center px-2'
              )}
              title={collapsed ? item.title : undefined}
            >
              <Icon className="h-5 w-5 flex-shrink-0" />
              {!collapsed && <span>{item.title}</span>}
            </Link>
          )
        })}
      </nav>

      {/* User Profile */}
      {!collapsed && (
        <div className="border-t border-white/10 p-4">
          <div className="flex items-center gap-3 rounded-xl bg-white/10 p-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-white/20">
              <span className="text-sm font-medium text-white">AD</span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-white truncate">Admin User</p>
              <p className="text-xs text-white/70 truncate">admin@sneat.com</p>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
```

---

## 📁 ARCHIVO 5/15: Glass Navbar

**Ruta:** `themes/sneat-pro/src/components/layout/sneat-navbar.tsx`

```typescript
'use client'

import { Menu, Search, Bell, Moon, Sun } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useTheme } from '@/contexts/theme-context'

interface SneatNavbarProps {
  onMenuClick: () => void
}

export function SneatNavbar({ onMenuClick }: SneatNavbarProps) {
  const { theme, setTheme, resolvedTheme } = useTheme()

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center gap-4 border-b border-gray-200 dark:border-slate-700 bg-white/80 dark:bg-slate-800/80 backdrop-blur-md px-6">
      {/* Mobile menu */}
      <Button variant="ghost" size="icon" onClick={onMenuClick} className="lg:hidden">
        <Menu className="h-5 w-5" />
      </Button>

      {/* Page Title */}
      <div className="flex-1">
        <h1 className="text-lg font-semibold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
          Dashboard Overview
        </h1>
      </div>

      {/* Search */}
      <div className="hidden md:flex flex-1 max-w-md">
        <div className="relative w-full">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <Input
            type="search"
            placeholder="Search..."
            className="w-full pl-10 border-gray-200 dark:border-slate-700"
          />
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-2">
        {/* Theme Toggle */}
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setTheme(resolvedTheme === 'dark' ? 'light' : 'dark')}
        >
          {resolvedTheme === 'dark' ? (
            <Sun className="h-5 w-5" />
          ) : (
            <Moon className="h-5 w-5" />
          )}
        </Button>

        {/* Notifications */}
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="h-5 w-5" />
          <span className="absolute top-1 right-1 h-2 w-2 rounded-full bg-purple-600" />
        </Button>

        {/* User */}
        <Button variant="ghost" className="gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-purple-600 to-blue-600">
            <span className="text-xs font-medium text-white">AD</span>
          </div>
          <span className="hidden sm:inline text-sm font-medium">Admin</span>
        </Button>
      </div>
    </header>
  )
}
```

---

## 📁 ARCHIVO 6/15: Glass Card ⭐

**Ruta:** `themes/sneat-pro/src/components/ui/glass-card.tsx`

```typescript
import { cn } from '@/lib/utils'

interface GlassCardProps {
  children: React.ReactNode
  className?: string
  hover?: boolean
}

export function GlassCard({ children, className, hover = false }: GlassCardProps) {
  return (
    <div
      className={cn(
        'rounded-2xl border backdrop-blur-md transition-all duration-200',
        'bg-white/75 dark:bg-slate-800/80',
        'border-white/50 dark:border-slate-700/50',
        'shadow-lg shadow-purple-500/10',
        hover && 'hover:shadow-xl hover:shadow-purple-500/20 hover:-translate-y-1',
        className
      )}
    >
      {children}
    </div>
  )
}
```

---

## 📁 ARCHIVO 7/15: Stat Card

**Ruta:** `themes/sneat-pro/src/components/ui/stat-card.tsx`

```typescript
import { LucideIcon, TrendingUp, TrendingDown } from 'lucide-react'
import { GlassCard } from './glass-card'
import { cn } from '@/lib/utils'

interface StatCardProps {
  title: string
  value: string | number
  change?: {
    value: number
    type: 'increase' | 'decrease'
  }
  icon: LucideIcon
  iconColor?: string
}

export function StatCard({ title, value, change, icon: Icon, iconColor = 'text-purple-600' }: StatCardProps) {
  return (
    <GlassCard hover className="p-6">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <p className="text-sm font-medium text-gray-600 dark:text-gray-400">{title}</p>
          <div className="mt-2 flex items-baseline gap-2">
            <p className="text-3xl font-bold text-gray-900 dark:text-white">{value}</p>
            {change && (
              <div className={cn(
                'flex items-center gap-1 text-sm font-medium',
                change.type === 'increase' ? 'text-green-600' : 'text-red-600'
              )}>
                {change.type === 'increase' ? (
                  <TrendingUp className="h-4 w-4" />
                ) : (
                  <TrendingDown className="h-4 w-4" />
                )}
                <span>{Math.abs(change.value)}%</span>
              </div>
            )}
          </div>
        </div>
        <div className={cn(
          'flex h-12 w-12 items-center justify-center rounded-xl',
          'bg-gradient-to-br from-purple-50 to-blue-50 dark:from-purple-900/20 dark:to-blue-900/20',
          iconColor
        )}>
          <Icon className="h-6 w-6" />
        </div>
      </div>
    </GlassCard>
  )
}
```

---

---

## 📁 ARCHIVO 8/15: Gradient Button

**Ruta:** `themes/sneat-pro/src/components/ui/gradient-button.tsx`

```typescript
import { ButtonHTMLAttributes, forwardRef } from 'react'
import { cn } from '@/lib/utils'

interface GradientButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'purple' | 'blue' | 'pink' | 'green'
  size?: 'sm' | 'md' | 'lg'
}

export const GradientButton = forwardRef<HTMLButtonElement, GradientButtonProps>(
  ({ className, variant = 'purple', size = 'md', children, ...props }, ref) => {
    const gradients = {
      purple: 'bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700',
      blue: 'bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700',
      pink: 'bg-gradient-to-r from-pink-600 to-rose-600 hover:from-pink-700 hover:to-rose-700',
      green: 'bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700',
    }

    const sizes = {
      sm: 'px-3 py-1.5 text-sm',
      md: 'px-4 py-2 text-base',
      lg: 'px-6 py-3 text-lg',
    }

    return (
      <button
        ref={ref}
        className={cn(
          'rounded-xl font-semibold text-white shadow-lg transition-all duration-200',
          'hover:shadow-xl hover:-translate-y-0.5',
          'focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2',
          'disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:transform-none',
          gradients[variant],
          sizes[size],
          className
        )}
        {...props}
      >
        {children}
      </button>
    )
  }
)

GradientButton.displayName = 'GradientButton'
```

---

## 📁 ARCHIVO 9/15: Badge

**Ruta:** `themes/sneat-pro/src/components/ui/badge.tsx`

```typescript
import { cn } from '@/lib/utils'

interface BadgeProps {
  children: React.ReactNode
  variant?: 'default' | 'success' | 'warning' | 'error' | 'info'
  size?: 'sm' | 'md' | 'lg'
  className?: string
}

export function Badge({ children, variant = 'default', size = 'md', className }: BadgeProps) {
  const variants = {
    default: 'bg-purple-100 text-purple-700 dark:bg-purple-900/20 dark:text-purple-400',
    success: 'bg-green-100 text-green-700 dark:bg-green-900/20 dark:text-green-400',
    warning: 'bg-orange-100 text-orange-700 dark:bg-orange-900/20 dark:text-orange-400',
    error: 'bg-red-100 text-red-700 dark:bg-red-900/20 dark:text-red-400',
    info: 'bg-cyan-100 text-cyan-700 dark:bg-cyan-900/20 dark:text-cyan-400',
  }

  const sizes = {
    sm: 'px-2 py-0.5 text-xs',
    md: 'px-2.5 py-1 text-sm',
    lg: 'px-3 py-1.5 text-base',
  }

  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full font-medium',
        variants[variant],
        sizes[size],
        className
      )}
    >
      {children}
    </span>
  )
}
```

---

## 📁 ARCHIVO 10/15: Avatar Group

**Ruta:** `themes/sneat-pro/src/components/ui/avatar-group.tsx`

```typescript
import { cn } from '@/lib/utils'

interface Avatar {
  name: string
  image?: string
  color?: string
}

interface AvatarGroupProps {
  avatars: Avatar[]
  max?: number
  size?: 'sm' | 'md' | 'lg'
}

export function AvatarGroup({ avatars, max = 4, size = 'md' }: AvatarGroupProps) {
  const displayedAvatars = avatars.slice(0, max)
  const remaining = Math.max(0, avatars.length - max)

  const sizes = {
    sm: 'h-8 w-8 text-xs',
    md: 'h-10 w-10 text-sm',
    lg: 'h-12 w-12 text-base',
  }

  return (
    <div className="flex -space-x-2">
      {displayedAvatars.map((avatar, index) => (
        <div
          key={index}
          className={cn(
            'rounded-full border-2 border-white dark:border-slate-800 flex items-center justify-center font-medium text-white overflow-hidden',
            sizes[size]
          )}
          style={{
            backgroundColor: avatar.color || '#7367F0',
            zIndex: displayedAvatars.length - index,
          }}
          title={avatar.name}
        >
          {avatar.image ? (
            <img src={avatar.image} alt={avatar.name} className="h-full w-full object-cover" />
          ) : (
            <span>{avatar.name.charAt(0).toUpperCase()}</span>
          )}
        </div>
      ))}
      {remaining > 0 && (
        <div
          className={cn(
            'rounded-full border-2 border-white dark:border-slate-800 flex items-center justify-center font-medium bg-gray-300 dark:bg-gray-600 text-gray-700 dark:text-gray-300',
            sizes[size]
          )}
        >
          <span>+{remaining}</span>
        </div>
      )}
    </div>
  )
}
```

---

## 📁 ARCHIVO 11/15: Sales Overview

**Ruta:** `themes/sneat-pro/src/components/dashboard/ecommerce/sales-overview.tsx`

```typescript
import { Users, UserPlus, Briefcase, DollarSign } from 'lucide-react'
import { StatCard } from '@/components/ui/stat-card'

export function SalesOverview() {
  return (
    <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
      <StatCard
        title="Total Empleados"
        value="2,420"
        change={{ value: 12.5, type: 'increase' }}
        icon={Users}
        iconColor="text-purple-600"
      />
      <StatCard
        title="Nuevas Contrataciones"
        value="145"
        change={{ value: 8.2, type: 'increase' }}
        icon={UserPlus}
        iconColor="text-green-600"
      />
      <StatCard
        title="Contratos Activos"
        value="892"
        change={{ value: 0, type: 'increase' }}
        icon={Briefcase}
        iconColor="text-blue-600"
      />
      <StatCard
        title="Nómina Mensual"
        value="$248K"
        change={{ value: 4.1, type: 'increase' }}
        icon={DollarSign}
        iconColor="text-orange-600"
      />
    </div>
  )
}
```

---

## 📁 ARCHIVO 12/15: Employee Grid

**Ruta:** `themes/sneat-pro/src/components/dashboard/ecommerce/employee-grid.tsx`

```typescript
import { GlassCard } from '@/components/ui/glass-card'
import { Badge } from '@/components/ui/badge'
import { AvatarGroup } from '@/components/ui/avatar-group'
import { MoreVertical, TrendingUp } from 'lucide-react'

const employees = [
  {
    department: 'Ingeniería',
    count: 124,
    growth: '+12%',
    avatars: [
      { name: 'Juan Pérez', color: '#7367F0' },
      { name: 'María García', color: '#28C76F' },
      { name: 'Carlos López', color: '#FF9F43' },
    ],
  },
  {
    department: 'Ventas',
    count: 89,
    growth: '+8%',
    avatars: [
      { name: 'Ana Martínez', color: '#EA5455' },
      { name: 'Luis Rodríguez', color: '#00CFE8' },
    ],
  },
  {
    department: 'Marketing',
    count: 56,
    growth: '+15%',
    avatars: [
      { name: 'Sofia Torres', color: '#7367F0' },
      { name: 'Diego Ramírez', color: '#28C76F' },
      { name: 'Laura Sánchez', color: '#FF9F43' },
    ],
  },
  {
    department: 'Soporte',
    count: 67,
    growth: '+5%',
    avatars: [
      { name: 'Pedro Gómez', color: '#EA5455' },
      { name: 'Carmen Díaz', color: '#00CFE8' },
    ],
  },
]

export function EmployeeGrid() {
  return (
    <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
      {employees.map((dept) => (
        <GlassCard key={dept.department} hover className="p-6">
          <div className="flex items-start justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              {dept.department}
            </h3>
            <button className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">
              <MoreVertical className="h-5 w-5" />
            </button>
          </div>

          <div className="flex items-baseline gap-2 mb-4">
            <p className="text-3xl font-bold text-gray-900 dark:text-white">{dept.count}</p>
            <Badge variant="success" size="sm">
              <TrendingUp className="h-3 w-3 mr-1" />
              {dept.growth}
            </Badge>
          </div>

          <AvatarGroup avatars={dept.avatars} max={3} size="sm" />
        </GlassCard>
      ))}
    </div>
  )
}
```

---

## 📁 ARCHIVO 13/15: Hiring Table

**Ruta:** `themes/sneat-pro/src/components/dashboard/ecommerce/hiring-table.tsx`

```typescript
import { GlassCard } from '@/components/ui/glass-card'
import { Badge } from '@/components/ui/badge'

const hiringData = [
  {
    id: 1,
    candidate: 'Ana Martínez',
    position: 'Senior Developer',
    department: 'Ingeniería',
    status: 'Interview',
    date: '2024-11-10',
  },
  {
    id: 2,
    candidate: 'Carlos López',
    position: 'Product Manager',
    department: 'Producto',
    status: 'Offer',
    date: '2024-11-09',
  },
  {
    id: 3,
    candidate: 'María García',
    position: 'UX Designer',
    department: 'Diseño',
    status: 'Pending',
    date: '2024-11-08',
  },
  {
    id: 4,
    candidate: 'Luis Rodríguez',
    position: 'Sales Executive',
    department: 'Ventas',
    status: 'Hired',
    date: '2024-11-07',
  },
]

const statusVariants: Record<string, 'default' | 'success' | 'warning' | 'info'> = {
  Pending: 'default',
  Interview: 'info',
  Offer: 'warning',
  Hired: 'success',
}

export function HiringTable() {
  return (
    <GlassCard className="overflow-hidden">
      <div className="p-6 border-b border-gray-200 dark:border-slate-700">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
          Proceso de Contratación
        </h3>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50 dark:bg-slate-800/50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Candidato
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Posición
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Departamento
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Estado
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Fecha
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 dark:divide-slate-700">
            {hiringData.map((item) => (
              <tr key={item.id} className="hover:bg-gray-50 dark:hover:bg-slate-800/50 transition-colors">
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center">
                    <div className="flex-shrink-0 h-10 w-10">
                      <div className="h-10 w-10 rounded-full bg-gradient-to-br from-purple-600 to-blue-600 flex items-center justify-center">
                        <span className="text-sm font-medium text-white">
                          {item.candidate.charAt(0)}
                        </span>
                      </div>
                    </div>
                    <div className="ml-4">
                      <div className="text-sm font-medium text-gray-900 dark:text-white">
                        {item.candidate}
                      </div>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm text-gray-900 dark:text-white">{item.position}</div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm text-gray-500 dark:text-gray-400">{item.department}</div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <Badge variant={statusVariants[item.status]}>{item.status}</Badge>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                  {item.date}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </GlassCard>
  )
}
```

---

## 📁 ARCHIVO 14/15: Payroll Chart

**Ruta:** `themes/sneat-pro/src/components/dashboard/ecommerce/payroll-chart.tsx`

```typescript
'use client'

import { GlassCard } from '@/components/ui/glass-card'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'

const data = [
  { month: 'Ene', amount: 180000 },
  { month: 'Feb', amount: 195000 },
  { month: 'Mar', amount: 210000 },
  { month: 'Abr', amount: 225000 },
  { month: 'May', amount: 238000 },
  { month: 'Jun', amount: 248000 },
]

export function PayrollChart() {
  return (
    <GlassCard className="p-6">
      <div className="mb-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
          Evolución de Nómina
        </h3>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
          Últimos 6 meses
        </p>
      </div>
      <ResponsiveContainer width="100%" height={300}>
        <LineChart data={data}>
          <defs>
            <linearGradient id="colorAmount" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#7367F0" stopOpacity={0.3} />
              <stop offset="95%" stopColor="#7367F0" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
          <XAxis 
            dataKey="month" 
            stroke="#6B7280"
            style={{ fontSize: '12px' }}
          />
          <YAxis 
            stroke="#6B7280"
            style={{ fontSize: '12px' }}
            tickFormatter={(value) => `$${value / 1000}K`}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: 'rgba(255, 255, 255, 0.95)',
              border: 'none',
              borderRadius: '12px',
              boxShadow: '0 4px 24px rgba(115, 103, 240, 0.15)',
            }}
            formatter={(value: number) => [`$${value.toLocaleString()}`, 'Nómina']}
          />
          <Line
            type="monotone"
            dataKey="amount"
            stroke="#7367F0"
            strokeWidth={3}
            fill="url(#colorAmount)"
            dot={{ fill: '#7367F0', r: 5 }}
            activeDot={{ r: 7 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </GlassCard>
  )
}
```

---

## 📁 ARCHIVO 15/15: Dashboard Page

**Ruta:** `themes/sneat-pro/src/app/(dashboard)/ecommerce/page.tsx`

```typescript
import { SneatLayout } from '@/components/layout/sneat-layout'
import { SalesOverview } from '@/components/dashboard/ecommerce/sales-overview'
import { EmployeeGrid } from '@/components/dashboard/ecommerce/employee-grid'
import { HiringTable } from '@/components/dashboard/ecommerce/hiring-table'
import { PayrollChart } from '@/components/dashboard/ecommerce/payroll-chart'

export default function EcommerceDashboard() {
  return (
    <SneatLayout>
      <div className="space-y-8">
        {/* Overview Stats */}
        <SalesOverview />

        {/* Department Grid */}
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
            Departamentos
          </h2>
          <EmployeeGrid />
        </div>

        {/* Charts & Tables */}
        <div className="grid gap-6 lg:grid-cols-2">
          <PayrollChart />
          <div className="lg:col-span-2">
            <HiringTable />
          </div>
        </div>
      </div>
    </SneatLayout>
  )
}
```

---

## ✅ PARTE 1 COMPLETADA

**Archivos creados:** 15/15 (100%)

### **Resumen:**
- ✅ Design Tokens (colores purple, glassmorphism)
- ✅ Theme Context (dark/light mode)
- ✅ **Glass Sidebar** ⭐ (purple gradient signature)
- ✅ Glass Navbar (search, notifications)
- ✅ Glass Card & Stat Card
- ✅ Gradient Button, Badge, Avatar Group
- ✅ **Dashboard eCommerce completo** (Employee Management)

### **Siguiente:**
Continúo con las **Partes 2-6** automáticamente...
