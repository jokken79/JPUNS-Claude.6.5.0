# 🎨 SNEAT PRO - PARTE 2: Analytics Dashboard

## 📋 ARCHIVOS EN ESTA PARTE (10 archivos)

### **Analytics Components (9 archivos)**
1. User Metrics Widget
2. Traffic Sources Chart
3. Conversion Funnel
4. Real-time Stats
5. Growth Chart
6. Device Analytics
7. Top Pages Table
8. Revenue Analytics
9. Dashboard Page

### **Utils (1 archivo)**
10. Chart Utils

---

## 📁 ARCHIVO 1/10: User Metrics Widget

**Ruta:** `themes/sneat-pro/src/components/dashboard/analytics/user-metrics.tsx`

```typescript
import { Users, UserPlus, UserCheck, UserX } from 'lucide-react'
import { StatCard } from '@/components/ui/stat-card'

export function UserMetrics() {
  return (
    <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
      <StatCard
        title="Total Usuarios"
        value="45.2K"
        change={{ value: 18.2, type: 'increase' }}
        icon={Users}
        iconColor="text-blue-600"
      />
      <StatCard
        title="Nuevos Usuarios"
        value="3,428"
        change={{ value: 24.5, type: 'increase' }}
        icon={UserPlus}
        iconColor="text-green-600"
      />
      <StatCard
        title="Usuarios Activos"
        value="12.8K"
        change={{ value: 12.1, type: 'increase' }}
        icon={UserCheck}
        iconColor="text-purple-600"
      />
      <StatCard
        title="Churn Rate"
        value="2.4%"
        change={{ value: 0.8, type: 'decrease' }}
        icon={UserX}
        iconColor="text-red-600"
      />
    </div>
  )
}
```

---

## 📁 ARCHIVO 2/10: Traffic Sources Chart

**Ruta:** `themes/sneat-pro/src/components/dashboard/analytics/traffic-sources.tsx`

```typescript
'use client'

import { GlassCard } from '@/components/ui/glass-card'
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts'

const data = [
  { name: 'Orgánico', value: 45, color: '#7367F0' },
  { name: 'Directo', value: 25, color: '#28C76F' },
  { name: 'Social', value: 18, color: '#FF9F43' },
  { name: 'Referidos', value: 12, color: '#00CFE8' },
]

export function TrafficSources() {
  return (
    <GlassCard className="p-6">
      <div className="mb-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
          Fuentes de Tráfico
        </h3>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
          Distribución de visitas
        </p>
      </div>
      <ResponsiveContainer width="100%" height={300}>
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            labelLine={false}
            label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
            outerRadius={100}
            fill="#8884d8"
            dataKey="value"
          >
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={entry.color} />
            ))}
          </Pie>
          <Tooltip />
          <Legend />
        </PieChart>
      </ResponsiveContainer>
    </GlassCard>
  )
}
```

---

## 📁 ARCHIVO 3/10: Conversion Funnel

**Ruta:** `themes/sneat-pro/src/components/dashboard/analytics/conversion-funnel.tsx`

```typescript
import { GlassCard } from '@/components/ui/glass-card'
import { Badge } from '@/components/ui/badge'
import { ChevronRight } from 'lucide-react'

const funnelSteps = [
  { name: 'Visitas', value: 12500, percent: 100, color: 'bg-purple-500' },
  { name: 'Registro', value: 8400, percent: 67, color: 'bg-blue-500' },
  { name: 'Activación', value: 5600, percent: 45, color: 'bg-green-500' },
  { name: 'Compra', value: 2800, percent: 22, color: 'bg-orange-500' },
  { name: 'Retención', value: 2100, percent: 17, color: 'bg-pink-500' },
]

export function ConversionFunnel() {
  return (
    <GlassCard className="p-6">
      <div className="mb-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
          Embudo de Conversión
        </h3>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
          Pipeline de usuarios
        </p>
      </div>
      <div className="space-y-4">
        {funnelSteps.map((step, index) => (
          <div key={step.name} className="relative">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium text-gray-900 dark:text-white">
                  {step.name}
                </span>
                <Badge variant="default" size="sm">
                  {step.percent}%
                </Badge>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-sm font-semibold text-gray-900 dark:text-white">
                  {step.value.toLocaleString()}
                </span>
                {index < funnelSteps.length - 1 && (
                  <ChevronRight className="h-4 w-4 text-gray-400" />
                )}
              </div>
            </div>
            <div className="h-3 bg-gray-100 dark:bg-slate-700 rounded-full overflow-hidden">
              <div
                className={`h-full ${step.color} transition-all duration-500`}
                style={{ width: `${step.percent}%` }}
              />
            </div>
          </div>
        ))}
      </div>
    </GlassCard>
  )
}
```

---

## 📁 ARCHIVO 4/10: Real-time Stats

**Ruta:** `themes/sneat-pro/src/components/dashboard/analytics/realtime-stats.tsx`

```typescript
'use client'

import { useState, useEffect } from 'react'
import { GlassCard } from '@/components/ui/glass-card'
import { Badge } from '@/components/ui/badge'
import { Activity, Eye, MousePointer, Clock } from 'lucide-react'

export function RealtimeStats() {
  const [onlineUsers, setOnlineUsers] = useState(1247)

  useEffect(() => {
    const interval = setInterval(() => {
      setOnlineUsers(prev => prev + Math.floor(Math.random() * 10 - 5))
    }, 3000)
    return () => clearInterval(interval)
  }, [])

  return (
    <GlassCard className="p-6">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
          En Tiempo Real
        </h3>
        <Badge variant="success" size="sm">
          <Activity className="h-3 w-3 mr-1 animate-pulse" />
          Live
        </Badge>
      </div>

      <div className="space-y-6">
        <div>
          <div className="flex items-baseline gap-2 mb-2">
            <span className="text-4xl font-bold text-gray-900 dark:text-white">
              {onlineUsers}
            </span>
            <span className="text-sm text-gray-500 dark:text-gray-400">usuarios activos</span>
          </div>
          <div className="text-sm text-gray-600 dark:text-gray-400">
            Últimos 5 minutos
          </div>
        </div>

        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Eye className="h-4 w-4 text-purple-600" />
              <span className="text-sm text-gray-600 dark:text-gray-400">Páginas vistas</span>
            </div>
            <span className="text-sm font-semibold text-gray-900 dark:text-white">3,842</span>
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <MousePointer className="h-4 w-4 text-blue-600" />
              <span className="text-sm text-gray-600 dark:text-gray-400">Clicks totales</span>
            </div>
            <span className="text-sm font-semibold text-gray-900 dark:text-white">12,459</span>
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-green-600" />
              <span className="text-sm text-gray-600 dark:text-gray-400">Tiempo promedio</span>
            </div>
            <span className="text-sm font-semibold text-gray-900 dark:text-white">4m 32s</span>
          </div>
        </div>
      </div>
    </GlassCard>
  )
}
```

---

## 📁 ARCHIVO 5/10: Growth Chart

**Ruta:** `themes/sneat-pro/src/components/dashboard/analytics/growth-chart.tsx`

```typescript
'use client'

import { GlassCard } from '@/components/ui/glass-card'
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'

const data = [
  { month: 'Ene', users: 4000, sessions: 2400 },
  { month: 'Feb', users: 5200, sessions: 3100 },
  { month: 'Mar', users: 6800, sessions: 4200 },
  { month: 'Abr', users: 8900, sessions: 5800 },
  { month: 'May', users: 12400, sessions: 7900 },
  { month: 'Jun', users: 15600, sessions: 9800 },
]

export function GrowthChart() {
  return (
    <GlassCard className="p-6">
      <div className="mb-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
          Crecimiento de Usuarios
        </h3>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
          Usuarios vs Sesiones
        </p>
      </div>
      <ResponsiveContainer width="100%" height={300}>
        <AreaChart data={data}>
          <defs>
            <linearGradient id="colorUsers" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#7367F0" stopOpacity={0.3} />
              <stop offset="95%" stopColor="#7367F0" stopOpacity={0} />
            </linearGradient>
            <linearGradient id="colorSessions" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#28C76F" stopOpacity={0.3} />
              <stop offset="95%" stopColor="#28C76F" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
          <XAxis dataKey="month" stroke="#6B7280" style={{ fontSize: '12px' }} />
          <YAxis stroke="#6B7280" style={{ fontSize: '12px' }} />
          <Tooltip
            contentStyle={{
              backgroundColor: 'rgba(255, 255, 255, 0.95)',
              border: 'none',
              borderRadius: '12px',
              boxShadow: '0 4px 24px rgba(115, 103, 240, 0.15)',
            }}
          />
          <Area
            type="monotone"
            dataKey="users"
            stroke="#7367F0"
            strokeWidth={2}
            fillOpacity={1}
            fill="url(#colorUsers)"
          />
          <Area
            type="monotone"
            dataKey="sessions"
            stroke="#28C76F"
            strokeWidth={2}
            fillOpacity={1}
            fill="url(#colorSessions)"
          />
        </AreaChart>
      </ResponsiveContainer>
    </GlassCard>
  )
}
```

---

## 📁 ARCHIVO 6/10: Device Analytics

**Ruta:** `themes/sneat-pro/src/components/dashboard/analytics/device-analytics.tsx`

```typescript
import { GlassCard } from '@/components/ui/glass-card'
import { Monitor, Smartphone, Tablet } from 'lucide-react'

const devices = [
  { name: 'Desktop', icon: Monitor, value: 58.4, color: 'bg-purple-500' },
  { name: 'Mobile', icon: Smartphone, value: 32.8, color: 'bg-blue-500' },
  { name: 'Tablet', icon: Tablet, value: 8.8, color: 'bg-green-500' },
]

export function DeviceAnalytics() {
  return (
    <GlassCard className="p-6">
      <div className="mb-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
          Dispositivos
        </h3>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
          Distribución por tipo
        </p>
      </div>
      <div className="space-y-4">
        {devices.map((device) => {
          const Icon = device.icon
          return (
            <div key={device.name}>
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <Icon className="h-5 w-5 text-gray-600 dark:text-gray-400" />
                  <span className="text-sm font-medium text-gray-900 dark:text-white">
                    {device.name}
                  </span>
                </div>
                <span className="text-sm font-semibold text-gray-900 dark:text-white">
                  {device.value}%
                </span>
              </div>
              <div className="h-2 bg-gray-100 dark:bg-slate-700 rounded-full overflow-hidden">
                <div
                  className={`h-full ${device.color} transition-all duration-500`}
                  style={{ width: `${device.value}%` }}
                />
              </div>
            </div>
          )
        })}
      </div>
    </GlassCard>
  )
}
```

---

## 📁 ARCHIVO 7/10: Top Pages Table

**Ruta:** `themes/sneat-pro/src/components/dashboard/analytics/top-pages.tsx`

```typescript
import { GlassCard } from '@/components/ui/glass-card'
import { TrendingUp, TrendingDown } from 'lucide-react'

const pages = [
  { path: '/dashboard', views: 24580, change: 12.5, trend: 'up' },
  { path: '/productos', views: 18920, change: 8.3, trend: 'up' },
  { path: '/servicios', views: 15640, change: -2.1, trend: 'down' },
  { path: '/contacto', views: 12340, change: 15.7, trend: 'up' },
  { path: '/blog', views: 9870, change: -5.4, trend: 'down' },
]

export function TopPages() {
  return (
    <GlassCard className="overflow-hidden">
      <div className="p-6 border-b border-gray-200 dark:border-slate-700">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
          Páginas Más Visitadas
        </h3>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50 dark:bg-slate-800/50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                Página
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                Vistas
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                Cambio
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 dark:divide-slate-700">
            {pages.map((page) => (
              <tr key={page.path} className="hover:bg-gray-50 dark:hover:bg-slate-800/50">
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className="text-sm font-medium text-gray-900 dark:text-white">
                    {page.path}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right">
                  <span className="text-sm text-gray-900 dark:text-white">
                    {page.views.toLocaleString()}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right">
                  <div className={`inline-flex items-center gap-1 text-sm font-medium ${
                    page.trend === 'up' ? 'text-green-600' : 'text-red-600'
                  }`}>
                    {page.trend === 'up' ? (
                      <TrendingUp className="h-4 w-4" />
                    ) : (
                      <TrendingDown className="h-4 w-4" />
                    )}
                    {Math.abs(page.change)}%
                  </div>
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

## 📁 ARCHIVO 8/10: Revenue Analytics

**Ruta:** `themes/sneat-pro/src/components/dashboard/analytics/revenue-analytics.tsx`

```typescript
'use client'

import { GlassCard } from '@/components/ui/glass-card'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'

const data = [
  { month: 'Ene', revenue: 12000, expenses: 8000 },
  { month: 'Feb', revenue: 15000, expenses: 9500 },
  { month: 'Mar', revenue: 18000, expenses: 11000 },
  { month: 'Abr', revenue: 22000, expenses: 13000 },
  { month: 'May', revenue: 28000, expenses: 16000 },
  { month: 'Jun', revenue: 32000, expenses: 18000 },
]

export function RevenueAnalytics() {
  return (
    <GlassCard className="p-6">
      <div className="mb-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
          Ingresos vs Gastos
        </h3>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
          Últimos 6 meses
        </p>
      </div>
      <ResponsiveContainer width="100%" height={300}>
        <BarChart data={data}>
          <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
          <XAxis dataKey="month" stroke="#6B7280" style={{ fontSize: '12px' }} />
          <YAxis stroke="#6B7280" style={{ fontSize: '12px' }} />
          <Tooltip
            contentStyle={{
              backgroundColor: 'rgba(255, 255, 255, 0.95)',
              border: 'none',
              borderRadius: '12px',
              boxShadow: '0 4px 24px rgba(115, 103, 240, 0.15)',
            }}
            formatter={(value: number) => `$${value.toLocaleString()}`}
          />
          <Bar dataKey="revenue" fill="#7367F0" radius={[8, 8, 0, 0]} />
          <Bar dataKey="expenses" fill="#FF9F43" radius={[8, 8, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </GlassCard>
  )
}
```

---

## 📁 ARCHIVO 9/10: Dashboard Page

**Ruta:** `themes/sneat-pro/src/app/(dashboard)/analytics/page.tsx`

```typescript
import { SneatLayout } from '@/components/layout/sneat-layout'
import { UserMetrics } from '@/components/dashboard/analytics/user-metrics'
import { TrafficSources } from '@/components/dashboard/analytics/traffic-sources'
import { ConversionFunnel } from '@/components/dashboard/analytics/conversion-funnel'
import { RealtimeStats } from '@/components/dashboard/analytics/realtime-stats'
import { GrowthChart } from '@/components/dashboard/analytics/growth-chart'
import { DeviceAnalytics } from '@/components/dashboard/analytics/device-analytics'
import { TopPages } from '@/components/dashboard/analytics/top-pages'
import { RevenueAnalytics } from '@/components/dashboard/analytics/revenue-analytics'

export default function AnalyticsDashboard() {
  return (
    <SneatLayout>
      <div className="space-y-8">
        <UserMetrics />

        <div className="grid gap-6 lg:grid-cols-3">
          <div className="lg:col-span-2">
            <GrowthChart />
          </div>
          <RealtimeStats />
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          <TrafficSources />
          <DeviceAnalytics />
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          <ConversionFunnel />
          <RevenueAnalytics />
        </div>

        <TopPages />
      </div>
    </SneatLayout>
  )
}
```

---

## 📁 ARCHIVO 10/10: Chart Utils

**Ruta:** `themes/sneat-pro/src/lib/chart-utils.ts`

```typescript
export const chartColors = {
  purple: '#7367F0',
  blue: '#00CFE8',
  green: '#28C76F',
  orange: '#FF9F43',
  red: '#EA5455',
  pink: '#F857A6',
}

export const gradients = {
  purple: 'url(#colorPurple)',
  blue: 'url(#colorBlue)',
  green: 'url(#colorGreen)',
}

export function formatNumber(num: number): string {
  if (num >= 1000000) {
    return `${(num / 1000000).toFixed(1)}M`
  }
  if (num >= 1000) {
    return `${(num / 1000).toFixed(1)}K`
  }
  return num.toString()
}

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('es-MX', {
    style: 'currency',
    currency: 'USD',
  }).format(amount)
}

export function formatPercentage(value: number, decimals = 1): string {
  return `${value.toFixed(decimals)}%`
}
```

---

## ✅ PARTE 2 COMPLETADA

**Archivos creados:** 10/10 (100%)

**Dashboard Analytics incluye:**
- ✅ User Metrics (4 stat cards)
- ✅ Traffic Sources (pie chart)
- ✅ Conversion Funnel (visual pipeline)
- ✅ Real-time Stats (live updates)
- ✅ Growth Chart (area chart dual)
- ✅ Device Analytics (progress bars)
- ✅ Top Pages Table
- ✅ Revenue Analytics (bar chart)
- ✅ Chart Utils (helpers)

Continuando con Parte 3...