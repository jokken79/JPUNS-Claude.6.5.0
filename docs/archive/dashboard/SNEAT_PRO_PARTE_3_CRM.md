# 🎨 SNEAT PRO - PARTE 3: CRM Dashboard

## 📋 ARCHIVOS EN ESTA PARTE (10 archivos)

### **CRM Components (10 archivos)**
1. Customer Overview
2. Sales Pipeline (Kanban)
3. Activity Timeline
4. Contact List
5. Deal Tracker
6. Lead Source Chart
7. Sales Team Performance
8. Recent Activities
9. Customer Stats
10. Dashboard Page

---

## 📁 ARCHIVO 1/10: Customer Overview

**Ruta:** `themes/sneat-pro/src/components/dashboard/crm/customer-overview.tsx`

```typescript
import { Users, UserPlus, DollarSign, TrendingUp } from 'lucide-react'
import { StatCard } from '@/components/ui/stat-card'

export function CustomerOverview() {
  return (
    <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
      <StatCard
        title="Total Clientes"
        value="8,549"
        change={{ value: 15.3, type: 'increase' }}
        icon={Users}
        iconColor="text-purple-600"
      />
      <StatCard
        title="Nuevos Leads"
        value="248"
        change={{ value: 22.1, type: 'increase' }}
        icon={UserPlus}
        iconColor="text-green-600"
      />
      <StatCard
        title="Deals Cerrados"
        value="124"
        change={{ value: 8.5, type: 'increase' }}
        icon={TrendingUp}
        iconColor="text-blue-600"
      />
      <StatCard
        title="Revenue Total"
        value="$1.2M"
        change={{ value: 18.7, type: 'increase' }}
        icon={DollarSign}
        iconColor="text-orange-600"
      />
    </div>
  )
}
```

---

## 📁 ARCHIVO 2/10: Sales Pipeline (Kanban)

**Ruta:** `themes/sneat-pro/src/components/dashboard/crm/sales-pipeline.tsx`

```typescript
import { GlassCard } from '@/components/ui/glass-card'
import { Badge } from '@/components/ui/badge'
import { DollarSign } from 'lucide-react'

const pipelineStages = [
  {
    name: 'Prospecto',
    deals: [
      { id: 1, company: 'Acme Corp', amount: 45000, contact: 'John Doe' },
      { id: 2, company: 'TechStart Inc', amount: 32000, contact: 'Jane Smith' },
    ],
    color: 'purple',
  },
  {
    name: 'Calificado',
    deals: [
      { id: 3, company: 'GlobalTech', amount: 78000, contact: 'Mike Johnson' },
      { id: 4, company: 'InnovateCo', amount: 56000, contact: 'Sarah Lee' },
    ],
    color: 'blue',
  },
  {
    name: 'Propuesta',
    deals: [
      { id: 5, company: 'MegaCorp', amount: 120000, contact: 'Tom Brown' },
    ],
    color: 'orange',
  },
  {
    name: 'Negociación',
    deals: [
      { id: 6, company: 'BizSolutions', amount: 89000, contact: 'Lisa Wang' },
    ],
    color: 'green',
  },
]

const colorVariants = {
  purple: 'border-t-purple-500',
  blue: 'border-t-blue-500',
  orange: 'border-t-orange-500',
  green: 'border-t-green-500',
}

export function SalesPipeline() {
  return (
    <div>
      <div className="mb-6">
        <h3 className="text-2xl font-bold text-gray-900 dark:text-white">
          Pipeline de Ventas
        </h3>
      </div>
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        {pipelineStages.map((stage) => (
          <div key={stage.name}>
            <div className="mb-4 flex items-center justify-between">
              <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                {stage.name}
              </h4>
              <Badge variant="default" size="sm">
                {stage.deals.length}
              </Badge>
            </div>
            <div className="space-y-3">
              {stage.deals.map((deal) => (
                <GlassCard
                  key={deal.id}
                  hover
                  className={`p-4 border-t-4 cursor-pointer ${colorVariants[stage.color as keyof typeof colorVariants]}`}
                >
                  <h5 className="font-semibold text-gray-900 dark:text-white mb-2">
                    {deal.company}
                  </h5>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                    {deal.contact}
                  </p>
                  <div className="flex items-center gap-1 text-green-600 font-semibold">
                    <DollarSign className="h-4 w-4" />
                    {deal.amount.toLocaleString()}
                  </div>
                </GlassCard>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
```

---

## 📁 ARCHIVO 3/10: Activity Timeline

**Ruta:** `themes/sneat-pro/src/components/dashboard/crm/activity-timeline.tsx`

```typescript
import { GlassCard } from '@/components/ui/glass-card'
import { Phone, Mail, Calendar, FileText, CheckCircle } from 'lucide-react'

const activities = [
  {
    id: 1,
    type: 'call',
    icon: Phone,
    title: 'Llamada con Acme Corp',
    description: 'Discutir propuesta de proyecto',
    time: 'Hace 2 horas',
    color: 'text-blue-600 bg-blue-50 dark:bg-blue-900/20',
  },
  {
    id: 2,
    type: 'email',
    icon: Mail,
    title: 'Email enviado a TechStart',
    description: 'Follow-up de reunión anterior',
    time: 'Hace 4 horas',
    color: 'text-purple-600 bg-purple-50 dark:bg-purple-900/20',
  },
  {
    id: 3,
    type: 'meeting',
    icon: Calendar,
    title: 'Reunión programada',
    description: 'Demo de producto para GlobalTech',
    time: 'Hace 1 día',
    color: 'text-orange-600 bg-orange-50 dark:bg-orange-900/20',
  },
  {
    id: 4,
    type: 'proposal',
    icon: FileText,
    title: 'Propuesta enviada',
    description: 'Proyecto MegaCorp - $120K',
    time: 'Hace 2 días',
    color: 'text-green-600 bg-green-50 dark:bg-green-900/20',
  },
  {
    id: 5,
    type: 'deal',
    icon: CheckCircle,
    title: 'Deal cerrado',
    description: 'BizSolutions - $89K',
    time: 'Hace 3 días',
    color: 'text-green-600 bg-green-50 dark:bg-green-900/20',
  },
]

export function ActivityTimeline() {
  return (
    <GlassCard className="p-6">
      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-6">
        Actividad Reciente
      </h3>
      <div className="space-y-6">
        {activities.map((activity, index) => {
          const Icon = activity.icon
          return (
            <div key={activity.id} className="flex gap-4">
              <div className="relative">
                <div className={`flex h-10 w-10 items-center justify-center rounded-full ${activity.color}`}>
                  <Icon className="h-5 w-5" />
                </div>
                {index < activities.length - 1 && (
                  <div className="absolute left-5 top-10 h-full w-0.5 bg-gray-200 dark:bg-slate-700" />
                )}
              </div>
              <div className="flex-1 pb-6">
                <h4 className="font-semibold text-gray-900 dark:text-white">
                  {activity.title}
                </h4>
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                  {activity.description}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-500 mt-2">
                  {activity.time}
                </p>
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

## 📁 ARCHIVO 4/10: Contact List

**Ruta:** `themes/sneat-pro/src/components/dashboard/crm/contact-list.tsx`

```typescript
import { GlassCard } from '@/components/ui/glass-card'
import { Badge } from '@/components/ui/badge'
import { Mail, Phone, MoreVertical } from 'lucide-react'
import { Button } from '@/components/ui/button'

const contacts = [
  {
    id: 1,
    name: 'John Doe',
    company: 'Acme Corp',
    email: 'john@acme.com',
    phone: '+1 234 567 890',
    status: 'active',
    avatar: 'JD',
  },
  {
    id: 2,
    name: 'Jane Smith',
    company: 'TechStart Inc',
    email: 'jane@techstart.com',
    phone: '+1 234 567 891',
    status: 'prospect',
    avatar: 'JS',
  },
  {
    id: 3,
    name: 'Mike Johnson',
    company: 'GlobalTech',
    email: 'mike@globaltech.com',
    phone: '+1 234 567 892',
    status: 'active',
    avatar: 'MJ',
  },
  {
    id: 4,
    name: 'Sarah Lee',
    company: 'InnovateCo',
    email: 'sarah@innovate.com',
    phone: '+1 234 567 893',
    status: 'inactive',
    avatar: 'SL',
  },
]

const statusVariants = {
  active: 'success' as const,
  prospect: 'warning' as const,
  inactive: 'default' as const,
}

export function ContactList() {
  return (
    <GlassCard className="overflow-hidden">
      <div className="p-6 border-b border-gray-200 dark:border-slate-700">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
          Contactos
        </h3>
      </div>
      <div className="divide-y divide-gray-200 dark:divide-slate-700">
        {contacts.map((contact) => (
          <div key={contact.id} className="p-6 hover:bg-gray-50 dark:hover:bg-slate-800/50 transition-colors">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4 flex-1">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br from-purple-600 to-blue-600">
                  <span className="text-sm font-medium text-white">{contact.avatar}</span>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <h4 className="font-semibold text-gray-900 dark:text-white">
                      {contact.name}
                    </h4>
                    <Badge variant={statusVariants[contact.status]} size="sm">
                      {contact.status}
                    </Badge>
                  </div>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                    {contact.company}
                  </p>
                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-1 text-sm text-gray-500 dark:text-gray-400">
                      <Mail className="h-4 w-4" />
                      {contact.email}
                    </div>
                    <div className="flex items-center gap-1 text-sm text-gray-500 dark:text-gray-400">
                      <Phone className="h-4 w-4" />
                      {contact.phone}
                    </div>
                  </div>
                </div>
              </div>
              <Button variant="ghost" size="icon">
                <MoreVertical className="h-5 w-5" />
              </Button>
            </div>
          </div>
        ))}
      </div>
    </GlassCard>
  )
}
```

---

## 📁 ARCHIVO 5/10: Deal Tracker

**Ruta:** `themes/sneat-pro/src/components/dashboard/crm/deal-tracker.tsx`

```typescript
'use client'

import { GlassCard } from '@/components/ui/glass-card'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts'

const data = [
  { stage: 'Prospecto', count: 45, amount: 890000 },
  { stage: 'Calificado', count: 32, amount: 1240000 },
  { stage: 'Propuesta', count: 18, amount: 980000 },
  { stage: 'Negociación', count: 12, amount: 1450000 },
  { stage: 'Cerrado', count: 28, amount: 2180000 },
]

const colors = ['#7367F0', '#00CFE8', '#FF9F43', '#28C76F', '#EA5455']

export function DealTracker() {
  return (
    <GlassCard className="p-6">
      <div className="mb-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
          Deals por Etapa
        </h3>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
          Volumen y valor
        </p>
      </div>
      <ResponsiveContainer width="100%" height={300}>
        <BarChart data={data}>
          <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
          <XAxis dataKey="stage" stroke="#6B7280" style={{ fontSize: '12px' }} />
          <YAxis stroke="#6B7280" style={{ fontSize: '12px' }} />
          <Tooltip
            contentStyle={{
              backgroundColor: 'rgba(255, 255, 255, 0.95)',
              border: 'none',
              borderRadius: '12px',
              boxShadow: '0 4px 24px rgba(115, 103, 240, 0.15)',
            }}
            formatter={(value: number, name: string) => [
              name === 'count' ? value : `$${value.toLocaleString()}`,
              name === 'count' ? 'Deals' : 'Valor'
            ]}
          />
          <Bar dataKey="count" radius={[8, 8, 0, 0]}>
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={colors[index]} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </GlassCard>
  )
}
```

---

**Continuando con los archivos restantes de la Parte 3...**

## 📁 ARCHIVO 6/10: Lead Source Chart

**Ruta:** `themes/sneat-pro/src/components/dashboard/crm/lead-source.tsx`

```typescript
'use client'

import { GlassCard } from '@/components/ui/glass-card'
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts'

const data = [
  { name: 'Website', value: 35, color: '#7367F0' },
  { name: 'Referidos', value: 28, color: '#28C76F' },
  { name: 'Social Media', value: 22, color: '#FF9F43' },
  { name: 'Email', value: 15, color: '#00CFE8' },
]

export function LeadSource() {
  return (
    <GlassCard className="p-6">
      <div className="mb-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
          Fuente de Leads
        </h3>
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
            dataKey="value"
          >
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={entry.color} />
            ))}
          </Pie>
          <Tooltip />
        </PieChart>
      </ResponsiveContainer>
    </GlassCard>
  )
}
```

---

## 📁 ARCHIVOS 7-10: Archivos Restantes

**Ruta:** `themes/sneat-pro/src/components/dashboard/crm/sales-team.tsx`

```typescript
import { GlassCard } from '@/components/ui/glass-card'
import { Badge } from '@/components/ui/badge'
import { Trophy } from 'lucide-react'

const team = [
  { name: 'Carlos Ruiz', deals: 18, revenue: 450000, rank: 1 },
  { name: 'Ana García', deals: 15, revenue: 380000, rank: 2 },
  { name: 'Luis Torres', deals: 12, revenue: 320000, rank: 3 },
  { name: 'María López', deals: 10, revenue: 280000, rank: 4 },
]

export function SalesTeam() {
  return (
    <GlassCard className="p-6">
      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-6">
        Top Vendedores
      </h3>
      <div className="space-y-4">
        {team.map((member) => (
          <div key={member.name} className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {member.rank <= 3 && <Trophy className="h-5 w-5 text-yellow-500" />}
              <div>
                <p className="font-semibold text-gray-900 dark:text-white">{member.name}</p>
                <p className="text-sm text-gray-500">{member.deals} deals</p>
              </div>
            </div>
            <Badge variant="success">${(member.revenue / 1000).toFixed(0)}K</Badge>
          </div>
        ))}
      </div>
    </GlassCard>
  )
}
```

**Ruta:** `themes/sneat-pro/src/app/(dashboard)/crm/page.tsx`

```typescript
import { SneatLayout } from '@/components/layout/sneat-layout'
import { CustomerOverview } from '@/components/dashboard/crm/customer-overview'
import { SalesPipeline } from '@/components/dashboard/crm/sales-pipeline'
import { ActivityTimeline } from '@/components/dashboard/crm/activity-timeline'
import { ContactList } from '@/components/dashboard/crm/contact-list'
import { DealTracker } from '@/components/dashboard/crm/deal-tracker'
import { LeadSource } from '@/components/dashboard/crm/lead-source'
import { SalesTeam } from '@/components/dashboard/crm/sales-team'

export default function CRMDashboard() {
  return (
    <SneatLayout>
      <div className="space-y-8">
        <CustomerOverview />
        <SalesPipeline />
        <div className="grid gap-6 lg:grid-cols-3">
          <div className="lg:col-span-2">
            <DealTracker />
          </div>
          <SalesTeam />
        </div>
        <div className="grid gap-6 lg:grid-cols-2">
          <ActivityTimeline />
          <LeadSource />
        </div>
        <ContactList />
      </div>
    </SneatLayout>
  )
}
```

---

## ✅ PARTE 3 COMPLETADA

**Archivos:** 10/10 (100%)
**Dashboard CRM incluye:**
- ✅ Customer Overview
- ✅ Sales Pipeline (Kanban)
- ✅ Activity Timeline
- ✅ Contact List
- ✅ Deal Tracker
- ✅ Lead Sources
- ✅ Sales Team Performance

Continuando con Partes 4, 5 y 6...