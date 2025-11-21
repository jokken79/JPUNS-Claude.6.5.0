# 📊 FASE 5: DASHBOARD KEIRI ESPECIALIZADO - PLAN MAESTRO

**Objetivo:** Crear un panel especializado para KEITOSAN (経理管理/Finance Manager) para gestionar y monitorear yukyus, nómina e impacto financiero.

**Tiempo Estimado:** 1.5 horas
**Riesgo:** BAJO (reutiliza componentes existentes)
**Estado:** 📋 PLANIFICADO

---

## 🎯 REQUISITOS TÉCNICOS

### 1. PÁGINA FRONTEND

**Ubicación:** `/frontend/app/(dashboard)/keiri/yukyu-dashboard/page.tsx` (NUEVA)

**Características Principales:**

```
┌────────────────────────────────────────────────────────────┐
│  KEITOSAN YUKYU DASHBOARD                      [Filtros]   │
├────────────────────────────────────────────────────────────┤
│                                                             │
│  📊 MÉTRICAS PRINCIPALES (4 cards)                        │
│  ┌─────────────────────────────────────────────────────┐  │
│  │ Solicitudes Pendientes │ 3        │ Pendientes      │  │
│  │ Total Impacto Financiero│ ¥562,500│ Este mes        │  │
│  │ Empleados con Yukyu    │ 28       │ 28 de 42        │  │
│  │ Conformidad Legal      │ 95%      │ Requerido 100%  │  │
│  └─────────────────────────────────────────────────────┘  │
│                                                             │
│  📋 SOLICITUDES PENDIENTES (Tabla interactiva)             │
│  ┌─────────────────────────────────────────────────────┐  │
│  │ ID │ Empleado      │ Días │ Período    │ Acción      │  │
│  ├─────────────────────────────────────────────────────┤  │
│  │ #1 │ Yamada Taro   │ 1.0  │ Oct 18-19  │ [✓] [✗]     │  │
│  │ #2 │ Sato Hanako   │ 2.0  │ Oct 25-26  │ [✓] [✗]     │  │
│  │ #3 │ Tanaka Jiro   │ 0.5  │ Oct 30     │ [✓] [✗]     │  │
│  └─────────────────────────────────────────────────────┘  │
│                                                             │
│  📈 TENDENCIAS MENSUALES (Gráfico)                         │
│  ┌─────────────────────────────────────────────────────┐  │
│  │ Días Aprobados vs Impacto Financiero (últimos 6m)   │  │
│  │                                                     │  │
│  │       ▄        ▄        ▄                           │  │
│  │     ▄ █ ▄    ▄ █ ▄    ▄ █ ▄                         │  │
│  │   ▄ █ █ █ ▄ █ █ █ █ ▄ █ █ █ █                       │  │
│  │ ──────────────────────────────────────              │  │
│  │  Mayo  Jun  Jul  Ago  Sep  Oct                      │  │
│  └─────────────────────────────────────────────────────┘  │
│                                                             │
│  ⚖️ CONFORMIDAD LEGAL (Card grande)                        │
│  ┌─────────────────────────────────────────────────────┐  │
│  │ Empleados: Alertas de Conformidad                  │  │
│  │ - Yamada Taro: 8 días/año usados (mínimo 5)  ✓    │  │
│  │ - Sato Hanako: 3 días/año usados (mínimo 5)  ⚠️   │  │
│  │ - Tanaka Jiro: 2 días/año usados (mínimo 5)  ❌   │  │
│  │                                                     │  │
│  │ Regulación Laboral: Mínimo 5 días de yukyu/año    │  │
│  └─────────────────────────────────────────────────────┘  │
└────────────────────────────────────────────────────────────┘
```

### 2. COMPONENTES NECESARIOS

**A crear:**
1. `YukyuMetricCard` - Tarjeta de métrica con ícono y estado
2. `PendingRequestsTable` - Tabla de solicitudes con acciones
3. `YukyuTrendChart` - Gráfico de tendencias (recharts)
4. `ComplianceCard` - Card de conformidad legal

**A reutilizar (existentes):**
- `MetricCard` - Componente base de métrica
- `DataTable` - Para listar datos
- `AreaChartCard` - Para gráfico de tendencias
- `Button`, `Badge` - UI components

### 3. DATOS Y QUERIES

**Backend Endpoints (existentes + nuevos):**

```python
GET /api/payroll/yukyu-summary?start_date=2025-10-01&end_date=2025-10-31
# Respuesta:
{
  "period": "2025-10",
  "total_employees_with_yukyu": 28,
  "total_yukyu_days": 45.5,
  "total_yukyu_deduction_jpy": 562500,
  "average_deduction_per_employee": 13437,
  "details": [...]
}

GET /api/yukyu/requests?status=PENDING&limit=50
# Respuesta: Lista de solicitudes pendientes

GET /api/yukyu/balances?show_compliance=true
# Respuesta: Saldos de yukyu con info de conformidad (mínimo 5 días/año)
```

**Frontend Queries (React Query):**

```typescript
// Query 1: Solicitudes pendientes
const pendingRequests = useQuery({
  queryKey: ['yukyu-requests', 'pending'],
  queryFn: () => api.get('/api/yukyu/requests?status=PENDING'),
  refetchInterval: 30000  // Refetch cada 30s
})

// Query 2: Resumen de yukyu
const yukyuSummary = useQuery({
  queryKey: ['yukyu-summary', month, year],
  queryFn: () => api.get(`/api/payroll/yukyu-summary?...`)
})

// Query 3: Tendencias mensuales
const monthlyTrends = useQuery({
  queryKey: ['yukyu-trends', 'monthly'],
  queryFn: () => api.get('/api/dashboard/yukyu-trends-monthly')
})

// Query 4: Conformidad legal
const complianceStatus = useQuery({
  queryKey: ['yukyu-compliance'],
  queryFn: () => api.get('/api/yukyu/compliance-status')
})
```

---

## 📋 TAREAS DE IMPLEMENTACIÓN

### TAREA 1: Crear página principal (`page.tsx`)

**Archivo:** `/frontend/app/(dashboard)/keiri/yukyu-dashboard/page.tsx`

**Contenido:**

```typescript
'use client'

import { useQuery } from '@tanstack/react-query'
import { api } from '@/lib/api'
import { useAuthStore } from '@/stores/auth'
import { ErrorState } from '@/components/error-state'
import { LoadingSkeletons } from '@/components/loading-skeletons'

// Importar componentes nuevos
import { YukyuMetricCard } from '@/components/keiri/yukyu-metric-card'
import { PendingRequestsTable } from '@/components/keiri/pending-requests-table'
import { YukyuTrendChart } from '@/components/keiri/yukyu-trend-chart'
import { ComplianceCard } from '@/components/keiri/compliance-card'

export default function KeirisYukyuDashboard() {
  const { user } = useAuthStore()

  // Protección de rol (solo KEITOSAN)
  if (user?.role !== 'KEITOSAN' && user?.role !== 'ADMIN' && user?.role !== 'SUPER_ADMIN') {
    return <ErrorState type="forbidden" title="Acceso Denegado" message="Solo KEITOSAN puede acceder" />
  }

  // Query 1: Métricas principales
  const { data: metrics, isLoading: metricsLoading } = useQuery({
    queryKey: ['yukyu-summary', new Date().toISOString().split('T')[0]],
    queryFn: async () => {
      const response = await api.get('/api/payroll/yukyu-summary', {
        params: {
          start_date: '2025-10-01',
          end_date: '2025-10-31'
        }
      })
      return response.data
    }
  })

  // Query 2: Solicitudes pendientes
  const { data: pendingRequests, isLoading: requestsLoading } = useQuery({
    queryKey: ['yukyu-requests-pending'],
    queryFn: async () => {
      const response = await api.get('/api/yukyu/requests?status=PENDING')
      return response.data
    },
    refetchInterval: 30000  // Auto-refresh cada 30 segundos
  })

  // Query 3: Tendencias
  const { data: trends, isLoading: trendsLoading } = useQuery({
    queryKey: ['yukyu-trends-monthly'],
    queryFn: async () => {
      const response = await api.get('/api/dashboard/yukyu-trends-monthly')
      return response.data
    }
  })

  // Loading state
  const isLoading = metricsLoading || requestsLoading || trendsLoading
  if (isLoading) return <LoadingSkeletons count={4} />

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold">KEITOSAN Yukyu Dashboard</h1>
        <p className="text-gray-600">Gestión de vacaciones pagadas y conformidad legal</p>
      </div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <YukyuMetricCard
          title="Solicitudes Pendientes"
          value={pendingRequests?.length || 0}
          description="Requieren revisión"
          type="pending"
          trend={{ value: 2, isPositive: false }}
        />
        <YukyuMetricCard
          title="Impacto Financiero"
          value={`¥${metrics?.total_yukyu_deduction_jpy?.toLocaleString()}`}
          description="Este mes"
          type="financial"
          trend={{ value: 15, isPositive: false }}
        />
        <YukyuMetricCard
          title="Empleados con Yukyu"
          value={metrics?.total_employees_with_yukyu || 0}
          description={`${metrics?.total_employees_with_yukyu || 0} de 42 empleados`}
          type="employees"
        />
        <YukyuMetricCard
          title="Conformidad Legal"
          value={`${calculateCompliance(metrics)}%`}
          description="Regulación: Min 5 días/año"
          type="compliance"
          trend={{ value: 5, isPositive: true }}
        />
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-3 gap-6">
        {/* Pending Requests */}
        <div className="col-span-2">
          <PendingRequestsTable requests={pendingRequests} />
        </div>

        {/* Compliance Card */}
        <div>
          <ComplianceCard metrics={metrics} />
        </div>
      </div>

      {/* Trends */}
      <YukyuTrendChart trends={trends} />
    </div>
  )
}
```

### TAREA 2: Crear componente de Métrica (`yukyu-metric-card.tsx`)

**Archivo:** `/frontend/components/keiri/yukyu-metric-card.tsx`

```typescript
import { Card } from '@/components/ui/card'
import { TrendIcon } from 'lucide-react'

interface YukyuMetricCardProps {
  title: string
  value: string | number
  description: string
  type: 'pending' | 'financial' | 'employees' | 'compliance'
  trend?: { value: number; isPositive: boolean }
}

export function YukyuMetricCard({
  title,
  value,
  description,
  type,
  trend
}: YukyuMetricCardProps) {
  const colors = {
    pending: 'border-yellow-200 bg-yellow-50',
    financial: 'border-red-200 bg-red-50',
    employees: 'border-blue-200 bg-blue-50',
    compliance: 'border-green-200 bg-green-50'
  }

  return (
    <Card className={`${colors[type]} p-4 border`}>
      <div className="flex justify-between items-start">
        <div>
          <p className="text-sm text-gray-600">{title}</p>
          <p className="text-2xl font-bold mt-1">{value}</p>
          <p className="text-xs text-gray-500 mt-2">{description}</p>
        </div>
        {trend && (
          <div className={`text-sm ${trend.isPositive ? 'text-green-600' : 'text-red-600'}`}>
            <TrendIcon size={16} />
            {trend.value}%
          </div>
        )}
      </div>
    </Card>
  )
}
```

### TAREA 3: Tabla de solicitudes pendientes (`pending-requests-table.tsx`)

**Archivo:** `/frontend/components/keiri/pending-requests-table.tsx`

```typescript
import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { useMutation } from '@tanstack/react-query'
import { api } from '@/lib/api'

export function PendingRequestsTable({ requests }: any) {
  const [actioningId, setActioningId] = useState<number | null>(null)

  const approveMutation = useMutation({
    mutationFn: (id: number) =>
      api.put(`/api/yukyu/requests/${id}/approve`, {
        approved_by: 'current_user_id'
      })
  })

  const rejectMutation = useMutation({
    mutationFn: (id: number) =>
      api.put(`/api/yukyu/requests/${id}/reject`, {
        rejection_reason: 'No aprobado'
      })
  })

  return (
    <div className="border rounded-lg overflow-hidden">
      <table className="w-full">
        <thead className="bg-gray-50">
          <tr>
            <th className="px-4 py-2 text-left text-sm font-semibold">ID</th>
            <th className="px-4 py-2 text-left text-sm font-semibold">Empleado</th>
            <th className="px-4 py-2 text-left text-sm font-semibold">Días</th>
            <th className="px-4 py-2 text-left text-sm font-semibold">Período</th>
            <th className="px-4 py-2 text-left text-sm font-semibold">Acciones</th>
          </tr>
        </thead>
        <tbody className="divide-y">
          {requests?.map((req: any) => (
            <tr key={req.id} className="hover:bg-gray-50">
              <td className="px-4 py-2">#{req.id}</td>
              <td className="px-4 py-2">{req.employee_name}</td>
              <td className="px-4 py-2">{req.days_requested}</td>
              <td className="px-4 py-2">
                {req.start_date} a {req.end_date}
              </td>
              <td className="px-4 py-2 space-x-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => approveMutation.mutate(req.id)}
                  disabled={actioningId === req.id}
                >
                  ✓ Aprobar
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => rejectMutation.mutate(req.id)}
                  disabled={actioningId === req.id}
                >
                  ✗ Rechazar
                </Button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
```

### TAREA 4: Gráfico de tendencias (`yukyu-trend-chart.tsx`)

**Archivo:** `/frontend/components/keiri/yukyu-trend-chart.tsx`

```typescript
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from 'recharts'

export function YukyuTrendChart({ trends }: any) {
  return (
    <div className="border rounded-lg p-4 bg-white">
      <h3 className="text-lg font-semibold mb-4">Tendencias Mensuales</h3>
      <AreaChart width={800} height={300} data={trends}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="month" />
        <YAxis />
        <Tooltip />
        <Legend />
        <Area
          type="monotone"
          dataKey="days"
          stackId="1"
          stroke="#3b82f6"
          fill="#bfdbfe"
          name="Días Aprobados"
        />
        <Area
          type="monotone"
          dataKey="deduction"
          stackId="1"
          stroke="#ef4444"
          fill="#fecaca"
          name="Impacto Financiero (¥1000s)"
        />
      </AreaChart>
    </div>
  )
}
```

### TAREA 5: Card de conformidad (`compliance-card.tsx`)

**Archivo:** `/frontend/components/keiri/compliance-card.tsx`

```typescript
import { Card } from '@/components/ui/card'
import { AlertCircle, CheckCircle, XCircle } from 'lucide-react'

export function ComplianceCard({ metrics }: any) {
  return (
    <Card className="p-4 border-2 border-blue-200 bg-blue-50">
      <h3 className="font-semibold mb-3">Conformidad Legal</h3>
      <div className="space-y-2 text-sm">
        <div className="flex items-center gap-2">
          <CheckCircle className="w-4 h-4 text-green-600" />
          <span>Yamada: 8 días/año ✓</span>
        </div>
        <div className="flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-yellow-600" />
          <span>Sato: 3 días/año ⚠️</span>
        </div>
        <div className="flex items-center gap-2">
          <XCircle className="w-4 h-4 text-red-600" />
          <span>Tanaka: 2 días/año ❌</span>
        </div>
      </div>
      <p className="text-xs text-gray-600 mt-3 border-t pt-2">
        Regulación: Mínimo 5 días yukyu/año en Japón
      </p>
    </Card>
  )
}
```

### TAREA 6: Backend Endpoint - Tendencias Mensuales

**Archivo:** `backend/app/api/dashboard.py` (agregar nuevo endpoint)

```python
@router.get("/yukyu-trends-monthly")
async def get_yukyu_trends_monthly(
    db: Session = Depends(get_db),
    current_user = Depends(auth_service.require_role("keitosan"))
):
    """Get monthly yukyu trends for the last 6 months."""
    trends = []

    for month_offset in range(6, 0, -1):
        # Calcular mes y año
        month_date = datetime.now() - timedelta(days=30 * month_offset)
        month_str = month_date.strftime("%Y-%m")

        # Query yukyus aprobados en ese mes
        yukyu_requests = db.query(YukyuRequest).filter(
            YukyuRequest.status == RequestStatus.APPROVED,
            extract('year', YukyuRequest.start_date) == month_date.year,
            extract('month', YukyuRequest.start_date) == month_date.month
        ).all()

        total_days = sum(float(r.days_requested) for r in yukyu_requests)
        total_deduction = sum(
            int(float(r.days_requested) * 8 * r.employee.jikyu)
            for r in yukyu_requests if r.employee
        )

        trends.append({
            'month': month_str,
            'days': total_days,
            'deduction': total_deduction // 1000  # En miles de ¥
        })

    return trends
```

### TAREA 7: Backend Endpoint - Compliance Status

```python
@router.get("/yukyu/compliance-status")
async def get_compliance_status(
    db: Session = Depends(get_db),
    current_user = Depends(auth_service.require_role("keitosan"))
):
    """Check compliance status of all employees (min 5 days/year)."""
    employees = db.query(Employee).all()
    compliance = []

    for emp in employees:
        # Contar días yukyu aprobados en este año fiscal
        fiscal_year_start = datetime(datetime.now().year, 4, 1).date()
        fiscal_year_end = datetime(datetime.now().year + 1, 3, 31).date()

        approved_days = db.query(func.sum(YukyuRequest.days_requested)).filter(
            YukyuRequest.employee_id == emp.id,
            YukyuRequest.status == RequestStatus.APPROVED,
            YukyuRequest.start_date >= fiscal_year_start,
            YukyuRequest.end_date <= fiscal_year_end
        ).scalar() or 0

        status = "compliant" if approved_days >= 5 else "warning" if approved_days >= 3 else "non_compliant"

        compliance.append({
            'employee_id': emp.id,
            'employee_name': emp.full_name_kanji,
            'days_used': float(approved_days),
            'minimum_required': 5,
            'status': status
        })

    return compliance
```

---

## 🔧 DEPENDENCIAS Y LIBRERÍAS

**Ya instaladas:**
- `recharts` - Gráficos
- `lucide-react` - Íconos
- `@tanstack/react-query` - Queries y mutations
- `shadcn/ui` - Componentes base

**No se necesita agregar nada nuevo**

---

## ✅ CHECKLIST DE IMPLEMENTACIÓN

- [ ] Crear directorio `/frontend/components/keiri/`
- [ ] Crear `yukyu-metric-card.tsx`
- [ ] Crear `pending-requests-table.tsx`
- [ ] Crear `yukyu-trend-chart.tsx`
- [ ] Crear `compliance-card.tsx`
- [ ] Crear página principal `/frontend/app/(dashboard)/keiri/yukyu-dashboard/page.tsx`
- [ ] Agregar endpoint `GET /api/dashboard/yukyu-trends-monthly` en backend
- [ ] Agregar endpoint `GET /api/yukyu/compliance-status` en backend
- [ ] Validar que todo compile sin errores
- [ ] Hacer commit con mensaje semántico
- [ ] Push a rama remote

---

## 📊 ESTIMADO DE LÍNEAS DE CÓDIGO

- `page.tsx`: ~120 líneas
- `yukyu-metric-card.tsx`: ~30 líneas
- `pending-requests-table.tsx`: ~60 líneas
- `yukyu-trend-chart.tsx`: ~25 líneas
- `compliance-card.tsx`: ~30 líneas
- Backend endpoints: ~80 líneas
- **Total:** ~345 líneas

---

## 🚀 PRÓXIMOS PASOS DESPUÉS DE FASE 5

1. FASE 6: Documentación & Training (guías para KEITOSAN/TANTOSHA)
2. FASE 7: Testing (E2E tests para dashboard + unit tests)
3. FASE 8: Validación final (verificar en staging)
4. FASE 9: Reporte final (resumen ejecutivo completo)

---

**Rama:** `claude/analyze-yukyus-structure-011CV3zF69mdcFr3HmQBNJZp`
**Estado:** 📋 PLANIFICADO
**Próximo:** Implementación de FASE 5
