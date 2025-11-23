# 🎨 DASHBOARD COMPLETO - TODOS LOS ARCHIVOS (Dark/Light Mode)

## 📋 INSTRUCCIONES

1. **Ejecuta primero el setup:**
   ```cmd
   cd D:\UNS-ClaudeJP-5.4.1\frontend
   mkdir components\layout
   mkdir components\dashboard
   mkdir components\dashboard\charts
   npm install next-themes
   ```

2. **Copia cada sección** en su archivo correspondiente
3. **Sigue el orden** de los archivos
4. **Verifica** que no haya errores de sintaxis al pegar

---

## 📁 ARCHIVO 1/15: Theme Context Provider

**Ruta:** `frontend/contexts/theme-context.tsx`

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
  const [theme, setThemeState] = useState<Theme>('system')
  const [resolvedTheme, setResolvedTheme] = useState<'light' | 'dark'>('light')
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
    const stored = localStorage.getItem('theme') as Theme | null
    if (stored) {
      setThemeState(stored)
    }
  }, [])

  useEffect(() => {
    if (!mounted) return

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
  }, [theme, mounted])

  const setTheme = (newTheme: Theme) => {
    setThemeState(newTheme)
  }

  if (!mounted) {
    return <>{children}</>
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

## 📁 ARCHIVO 2/15: Theme Toggle Button

**Ruta:** `frontend/components/ui/theme-toggle.tsx`

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

## 📁 ARCHIVO 3/15: Design Tokens

**Ruta:** `frontend/lib/design-tokens.ts`

```typescript
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
```

---

## 📁 ARCHIVO 4/15: Dashboard Layout

**Ruta:** `frontend/components/layout/dashboard-layout.tsx`

```typescript
'use client'

import { useState } from 'react'
import { DashboardSidebar } from './dashboard-sidebar'
import { DashboardNavbar } from './dashboard-navbar'
import { cn } from '@/lib/utils'

interface DashboardLayoutProps {
  children: React.ReactNode
}

export function DashboardLayout({ children }: DashboardLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)

  return (
    <div className="flex h-screen overflow-hidden bg-gray-50 dark:bg-slate-900">
      {/* Sidebar Desktop */}
      <aside
        className={cn(
          'hidden lg:flex lg:flex-shrink-0 transition-all duration-300',
          sidebarCollapsed ? 'lg:w-16' : 'lg:w-[280px]'
        )}
      >
        <DashboardSidebar
          collapsed={sidebarCollapsed}
          onToggleCollapse={() => setSidebarCollapsed(!sidebarCollapsed)}
        />
      </aside>

      {/* Sidebar Mobile Overlay */}
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
        <DashboardSidebar
          collapsed={false}
          onToggleCollapse={() => {}}
          onClose={() => setSidebarOpen(false)}
        />
      </aside>

      {/* Main Content */}
      <div className="flex flex-1 flex-col overflow-hidden">
        <DashboardNavbar onMenuClick={() => setSidebarOpen(true)} />
        
        <main className="flex-1 overflow-y-auto overflow-x-hidden">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
            {children}
          </div>
        </main>
      </div>
    </div>
  )
}
```

---

## 📁 ARCHIVO 5/15: Dashboard Sidebar

**Ruta:** `frontend/components/layout/dashboard-sidebar.tsx`

```typescript
'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  LayoutDashboard,
  Users,
  FolderKanban,
  BarChart3,
  Settings,
  ChevronLeft,
  ChevronRight,
  X,
  Building2,
  CalendarDays,
  CreditCard,
  UserCircle,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'

interface DashboardSidebarProps {
  collapsed: boolean
  onToggleCollapse: () => void
  onClose?: () => void
}

const menuItems = [
  {
    title: 'Dashboard',
    icon: LayoutDashboard,
    href: '/dashboard',
  },
  {
    title: 'Empleados',
    icon: Users,
    href: '/dashboard/employees',
  },
  {
    title: 'Candidatos',
    icon: UserCircle,
    href: '/dashboard/candidates',
  },
  {
    title: 'Apartamentos',
    icon: Building2,
    href: '/dashboard/apartments',
  },
  {
    title: 'Fábricas',
    icon: FolderKanban,
    href: '/dashboard/factories',
  },
  {
    title: 'Timer Cards',
    icon: CalendarDays,
    href: '/dashboard/timercards',
  },
  {
    title: 'Payroll',
    icon: CreditCard,
    href: '/dashboard/payroll',
  },
  {
    title: 'Reportes',
    icon: BarChart3,
    href: '/dashboard/reports',
  },
  {
    title: 'Configuración',
    icon: Settings,
    href: '/dashboard/settings',
  },
]

export function DashboardSidebar({
  collapsed,
  onToggleCollapse,
  onClose,
}: DashboardSidebarProps) {
  const pathname = usePathname()

  return (
    <div className="flex h-full flex-col bg-white dark:bg-slate-800 border-r border-gray-200 dark:border-slate-700">
      {/* Header */}
      <div className="flex h-16 items-center justify-between px-4 border-b border-gray-200 dark:border-slate-700">
        {!collapsed && (
          <Link href="/dashboard" className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-600">
              <span className="text-lg font-bold text-white">U</span>
            </div>
            <span className="text-lg font-semibold text-gray-900 dark:text-white">
              UNS-ClaudeJP
            </span>
          </Link>
        )}

        {/* Mobile close button */}
        {onClose && (
          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
            className="lg:hidden"
          >
            <X className="h-5 w-5" />
          </Button>
        )}

        {/* Desktop collapse toggle */}
        {!onClose && (
          <Button
            variant="ghost"
            size="icon"
            onClick={onToggleCollapse}
            className="hidden lg:flex"
          >
            {collapsed ? (
              <ChevronRight className="h-5 w-5" />
            ) : (
              <ChevronLeft className="h-5 w-5" />
            )}
          </Button>
        )}
      </div>

      {/* Navigation */}
      <ScrollArea className="flex-1 px-3 py-4">
        <nav className="space-y-1">
          {menuItems.map((item) => {
            const Icon = item.icon
            const isActive = pathname === item.href

            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                  isActive
                    ? 'bg-blue-50 text-blue-600 dark:bg-blue-600/10 dark:text-blue-400'
                    : 'text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-slate-700',
                  collapsed && 'justify-center'
                )}
                title={collapsed ? item.title : undefined}
              >
                <Icon className="h-5 w-5 flex-shrink-0" />
                {!collapsed && <span>{item.title}</span>}
              </Link>
            )
          })}
        </nav>
      </ScrollArea>

      {/* User Profile */}
      {!collapsed && (
        <div className="border-t border-gray-200 dark:border-slate-700 p-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-600">
              <span className="text-sm font-medium text-white">AD</span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                Admin User
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                admin@uns-kikaku.com
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
```

---

## 📁 ARCHIVO 6/15: Dashboard Navbar

**Ruta:** `frontend/components/layout/dashboard-navbar.tsx`

```typescript
'use client'

import { Menu, Search, Bell } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { ThemeToggle } from '@/components/ui/theme-toggle'

interface DashboardNavbarProps {
  onMenuClick: () => void
}

export function DashboardNavbar({ onMenuClick }: DashboardNavbarProps) {
  return (
    <header className="sticky top-0 z-30 flex h-16 items-center gap-4 border-b border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-4 sm:px-6 lg:px-8">
      {/* Mobile menu button */}
      <Button
        variant="ghost"
        size="icon"
        onClick={onMenuClick}
        className="lg:hidden"
      >
        <Menu className="h-5 w-5" />
        <span className="sr-only">Toggle menu</span>
      </Button>

      {/* Page Title */}
      <div className="flex-1">
        <h1 className="text-lg font-semibold text-gray-900 dark:text-white">
          Dashboard Overview
        </h1>
      </div>

      {/* Search */}
      <div className="hidden md:flex flex-1 max-w-md">
        <div className="relative w-full">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <Input
            type="search"
            placeholder="Buscar empleados, candidatos..."
            className="w-full pl-10 bg-gray-50 dark:bg-slate-900 border-gray-200 dark:border-slate-700"
          />
        </div>
      </div>

      {/* Right Actions */}
      <div className="flex items-center gap-2">
        {/* Theme Toggle */}
        <ThemeToggle />

        {/* Notifications */}
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="h-5 w-5" />
          <span className="absolute top-1 right-1 h-2 w-2 rounded-full bg-red-600" />
          <span className="sr-only">Notifications</span>
        </Button>

        {/* User Menu */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-600">
                <span className="text-xs font-medium text-white">AD</span>
              </div>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuLabel>
              <div className="flex flex-col space-y-1">
                <p className="text-sm font-medium">Admin User</p>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  admin@uns-kikaku.com
                </p>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem>
              <span>Mi Perfil</span>
            </DropdownMenuItem>
            <DropdownMenuItem>
              <span>Configuración</span>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem className="text-red-600 dark:text-red-400">
              Cerrar Sesión
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  )
}
```

---

## 📁 ARCHIVO 7/15: Metric Card Component

**Ruta:** `frontend/components/dashboard/metric-card.tsx`

```typescript
import { LucideIcon, TrendingUp, TrendingDown, ArrowRight } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { cn } from '@/lib/utils'

interface MetricCardProps {
  title: string
  value: string | number
  trend?: {
    value: number
    type: 'up' | 'down' | 'neutral'
  }
  icon: LucideIcon
  iconColor?: string
}

export function MetricCard({
  title,
  value,
  trend,
  icon: Icon,
  iconColor = 'text-blue-600',
}: MetricCardProps) {
  const getTrendIcon = () => {
    if (!trend) return null
    if (trend.type === 'up') return <TrendingUp className="h-4 w-4" />
    if (trend.type === 'down') return <TrendingDown className="h-4 w-4" />
    return <ArrowRight className="h-4 w-4" />
  }

  const getTrendColor = () => {
    if (!trend) return ''
    if (trend.type === 'up') return 'text-green-600 dark:text-green-400'
    if (trend.type === 'down') return 'text-red-600 dark:text-red-400'
    return 'text-gray-600 dark:text-gray-400'
  }

  return (
    <Card className="hover:shadow-lg transition-all duration-200 hover:-translate-y-1">
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div className="flex-1">
            <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
              {title}
            </p>
            <div className="mt-2 flex items-baseline gap-2">
              <p className="text-3xl font-bold text-gray-900 dark:text-white">
                {value}
              </p>
              {trend && (
                <div className={cn('flex items-center gap-1 text-sm font-medium', getTrendColor())}>
                  {getTrendIcon()}
                  <span>{trend.value > 0 ? '+' : ''}{trend.value}%</span>
                </div>
              )}
            </div>
          </div>
          <div className={cn('flex h-12 w-12 items-center justify-center rounded-lg bg-blue-50 dark:bg-blue-600/10', iconColor)}>
            <Icon className="h-6 w-6" />
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
```

---

## 📁 ARCHIVO 8/15: Metric Grid

**Ruta:** `frontend/components/dashboard/metric-grid.tsx`

```typescript
interface MetricGridProps {
  children: React.ReactNode
}

export function MetricGrid({ children }: MetricGridProps) {
  return (
    <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
      {children}
    </div>
  )
}
```

---

## 📁 ARCHIVO 9/15: Revenue Chart

**Ruta:** `frontend/components/dashboard/charts/revenue-chart.tsx`

```typescript
'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts'

const data = [
  { month: 'Ene', revenue: 12000, expenses: 8000 },
  { month: 'Feb', revenue: 15000, expenses: 9000 },
  { month: 'Mar', revenue: 18000, expenses: 11000 },
  { month: 'Abr', revenue: 22000, expenses: 13000 },
  { month: 'May', revenue: 25000, expenses: 15000 },
  { month: 'Jun', revenue: 28000, expenses: 16000 },
]

export function RevenueChart() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Tendencia de Empleados</CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={350}>
          <LineChart data={data}>
            <CartesianGrid strokeDasharray="3 3" className="stroke-gray-200 dark:stroke-slate-700" />
            <XAxis 
              dataKey="month" 
              className="text-xs text-gray-600 dark:text-gray-400"
            />
            <YAxis className="text-xs text-gray-600 dark:text-gray-400" />
            <Tooltip 
              contentStyle={{
                backgroundColor: 'hsl(var(--background))',
                border: '1px solid hsl(var(--border))',
                borderRadius: '8px',
              }}
            />
            <Legend />
            <Line
              type="monotone"
              dataKey="revenue"
              stroke="#3b82f6"
              strokeWidth={2}
              name="Activos"
            />
            <Line
              type="monotone"
              dataKey="expenses"
              stroke="#94a3b8"
              strokeWidth={2}
              name="Total"
            />
          </LineChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  )
}
```

---

## 📁 ARCHIVO 10/15: Traffic Chart (Donut)

**Ruta:** `frontend/components/dashboard/charts/traffic-chart.tsx`

```typescript
'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts'

const data = [
  { name: 'Empleados', value: 450, color: '#3b82f6' },
  { name: 'Contract Workers', value: 120, color: '#10b981' },
  { name: 'Staff', value: 80, color: '#f59e0b' },
]

export function TrafficChart() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Distribución de Personal</CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={350}>
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              innerRadius={80}
              outerRadius={120}
              paddingAngle={5}
              dataKey="value"
            >
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} />
              ))}
            </Pie>
            <Tooltip 
              contentStyle={{
                backgroundColor: 'hsl(var(--background))',
                border: '1px solid hsl(var(--border))',
                borderRadius: '8px',
              }}
            />
            <Legend />
          </PieChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  )
}
```

---

## 📁 ARCHIVO 11/15: Recent Activity Table

**Ruta:** `frontend/components/dashboard/recent-activity-table.tsx`

```typescript
'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'

const activities = [
  {
    id: 1,
    date: '2024-11-10',
    employee: 'Juan Pérez',
    action: 'Contratado',
    status: 'completed',
  },
  {
    id: 2,
    date: '2024-11-09',
    employee: 'María García',
    action: 'Yukyu Aprobado',
    status: 'pending',
  },
  {
    id: 3,
    date: '2024-11-08',
    employee: 'Carlos López',
    action: 'Apartamento Asignado',
    status: 'completed',
  },
  {
    id: 4,
    date: '2024-11-07',
    employee: 'Ana Martínez',
    action: 'Timer Card Registrado',
    status: 'completed',
  },
]

export function RecentActivityTable() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Actividad Reciente</CardTitle>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Fecha</TableHead>
              <TableHead>Empleado</TableHead>
              <TableHead>Acción</TableHead>
              <TableHead>Estado</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {activities.map((activity) => (
              <TableRow key={activity.id}>
                <TableCell className="font-medium">{activity.date}</TableCell>
                <TableCell>{activity.employee}</TableCell>
                <TableCell>{activity.action}</TableCell>
                <TableCell>
                  <Badge
                    variant={
                      activity.status === 'completed' ? 'default' : 'secondary'
                    }
                  >
                    {activity.status === 'completed' ? 'Completado' : 'Pendiente'}
                  </Badge>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  )
}
```

---

## 📁 ARCHIVO 12/15: Dashboard Page

**Ruta:** `frontend/app/(dashboard)/dashboard/page.tsx`

```typescript
import { Users, UserCheck, Building2, TrendingUp } from 'lucide-react'
import { DashboardLayout } from '@/components/layout/dashboard-layout'
import { MetricGrid } from '@/components/dashboard/metric-grid'
import { MetricCard } from '@/components/dashboard/metric-card'
import { RevenueChart } from '@/components/dashboard/charts/revenue-chart'
import { TrafficChart } from '@/components/dashboard/charts/traffic-chart'
import { RecentActivityTable } from '@/components/dashboard/recent-activity-table'

export default function DashboardPage() {
  return (
    <DashboardLayout>
      <div className="space-y-8">
        {/* Metrics */}
        <MetricGrid>
          <MetricCard
            title="Total Empleados"
            value="650"
            trend={{ value: 12.5, type: 'up' }}
            icon={Users}
            iconColor="text-blue-600"
          />
          <MetricCard
            title="Candidatos Activos"
            value="89"
            trend={{ value: 8.2, type: 'up' }}
            icon={UserCheck}
            iconColor="text-green-600"
          />
          <MetricCard
            title="Apartamentos"
            value="449"
            trend={{ value: 0, type: 'neutral' }}
            icon={Building2}
            iconColor="text-purple-600"
          />
          <MetricCard
            title="Tasa de Crecimiento"
            value="14.6%"
            trend={{ value: 2.4, type: 'up' }}
            icon={TrendingUp}
            iconColor="text-orange-600"
          />
        </MetricGrid>

        {/* Charts */}
        <div className="grid gap-6 lg:grid-cols-2">
          <RevenueChart />
          <TrafficChart />
        </div>

        {/* Recent Activity */}
        <RecentActivityTable />
      </div>
    </DashboardLayout>
  )
}
```

---

## 📁 ARCHIVO 13/15: Dashboard Layout Wrapper

**Ruta:** `frontend/app/(dashboard)/layout.tsx`

```typescript
import { ThemeProvider } from '@/contexts/theme-context'

export default function DashboardRootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <ThemeProvider>{children}</ThemeProvider>
}
```

---

## 📁 ARCHIVO 14/15: Global CSS Update

**Ruta:** `frontend/app/globals.css`

**AÑADE estas líneas al final del archivo existente:**

```css
/* Dashboard Dark Mode Support */
.dark {
  --background: 222.2 84% 4.9%;
  --foreground: 210 40% 98%;
  --card: 222.2 84% 4.9%;
  --card-foreground: 210 40% 98%;
  --popover: 222.2 84% 4.9%;
  --popover-foreground: 210 40% 98%;
  --primary: 217.2 91.2% 59.8%;
  --primary-foreground: 222.2 47.4% 11.2%;
  --secondary: 217.2 32.6% 17.5%;
  --secondary-foreground: 210 40% 98%;
  --muted: 217.2 32.6% 17.5%;
  --muted-foreground: 215 20.2% 65.1%;
  --accent: 217.2 32.6% 17.5%;
  --accent-foreground: 210 40% 98%;
  --destructive: 0 62.8% 30.6%;
  --destructive-foreground: 210 40% 98%;
  --border: 217.2 32.6% 17.5%;
  --input: 217.2 32.6% 17.5%;
  --ring: 224.3 76.3% 48%;
}
```

---

## 📁 ARCHIVO 15/15: Root Layout Update

**Ruta:** `frontend/app/layout.tsx`

**MODIFICA** el layout raíz para añadir la clase `dark`:

Busca la etiqueta `<html>` y añade `suppressHydrationWarning`:

```typescript
export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="es" suppressHydrationWarning>
      <body className={inter.className}>
        {children}
      </body>
    </html>
  )
}
```

---

## ✅ VERIFICACIÓN FINAL

Después de crear todos los archivos:

```bash
# 1. Verificar que no hay errores de TypeScript
cd frontend
npm run typecheck

# 2. Verificar que compila
npm run build

# 3. Iniciar en desarrollo
npm run dev
```

---

## 🎯 RESULTADO ESPERADO

Accede a: `http://localhost:3000/dashboard`

**Deberías ver:**
- ✅ Sidebar con navegación (collapsible)
- ✅ Navbar con search, notificaciones, theme toggle
- ✅ 4 Metric cards con trends
- ✅ 2 Charts (línea + donut)
- ✅ Tabla de actividad reciente
- ✅ Toggle dark/light mode funcionando
- ✅ Responsive (mobile/tablet/desktop)

---

## 🔄 ROLLBACK (Si no te gusta)

```bash
git checkout main
git branch -D design/vercel-dashboard-dark-light
```

Todo vuelve como estaba en 2 segundos.

---

**Creado:** 2025-11-12  
**Por:** @ui-clone-master  
**Archivos:** 15 de 15 (100%)  
**Tiempo estimado de copia:** 30-45 minutos
