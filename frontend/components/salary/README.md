# Salary Module Components

Componentes reutilizables para el módulo de salarios (給与管理).

## 📁 Estructura

```
components/salary/
├── SalarySummaryCards.tsx        # Tarjetas KPI de resumen (4 tarjetas)
├── SalaryBreakdownTable.tsx      # Tabla de desglose de horas y montos
├── SalaryDeductionsTable.tsx     # Tabla de deducciones detalladas
├── SalaryCharts.tsx              # Gráficos visuales (horas, comparación, deducciones)
├── SalaryReportFilters.tsx       # Filtros para reportes (fechas, estado)
├── index.ts                      # Barrel export
└── README.md                     # Este archivo
```

## 🎯 Componentes

### SalarySummaryCards

**Propósito:** Mostrar 4 tarjetas KPI principales de un salario.

**Props:**
```typescript
interface SalarySummaryCardsProps {
  grossSalary: number;        // 総支給額
  totalDeductions: number;    // 総控除額
  netSalary: number;          // 手取り額
  companyProfit: number;      // 会社利益
}
```

**Uso:**
```tsx
<SalarySummaryCards
  grossSalary={salary.gross_salary}
  totalDeductions={salary.total_deductions}
  netSalary={salary.net_salary}
  companyProfit={salary.company_profit}
/>
```

---

### SalaryBreakdownTable

**Propósito:** Mostrar desglose detallado de horas trabajadas y montos calculados.

**Props:**
```typescript
interface SalaryBreakdownTableProps {
  salary: SalaryCalculation;
}
```

**Features:**
- Sección de horas (通常, 残業, 深夜, 休日, 日曜)
- Sección de bonos (賞与, ガソリン手当)
- Tabla detallada con tasas y multiplicadores
- Totales calculados automáticamente

**Uso:**
```tsx
<SalaryBreakdownTable salary={salary} />
```

---

### SalaryDeductionsTable

**Propósito:** Mostrar todas las deducciones con porcentajes y totales.

**Props:**
```typescript
interface SalaryDeductionsTableProps {
  salary: SalaryCalculation;
}
```

**Features:**
- 7 tipos de deducciones (社宅, 所得税, 住民税, 健康保険, 厚生年金, 雇用保険, その他)
- Tarjetas individuales con iconos
- Tabla resumen con porcentajes
- Subtotales de impuestos y seguros

**Uso:**
```tsx
<SalaryDeductionsTable salary={salary} />
```

---

### SalaryCharts

**Propósito:** Visualizar datos de salario con gráficos simples (CSS-based).

**Props:**
```typescript
interface SalaryChartsProps {
  salary: SalaryCalculation;
}
```

**Features:**
- Gráfico de barras: Distribución de horas
- Gráfico de barras: Comparación bruto vs deducciones vs neto
- Grid de tarjetas: Desglose de deducciones con colores
- Estadísticas adicionales (tiempo total, promedio por hora, etc.)

**Uso:**
```tsx
<SalaryCharts salary={salary} />
```

---

### SalaryReportFiltersComponent

**Propósito:** Filtros interactivos para reportes de salarios.

**Props:**
```typescript
interface SalaryReportFiltersProps {
  onApplyFilters: (filters: SalaryReportFilters) => void;
  onClearFilters: () => void;
  loading?: boolean;
}
```

**Features:**
- Date range picker (desde/hasta)
- Botones de selección rápida (今月, 先月, 直近3ヶ月, 今年)
- Checkboxes de estado (支払済みのみ, 未払いのみ)
- Botones de acción (レポート生成, クリア)

**Uso:**
```tsx
<SalaryReportFiltersComponent
  onApplyFilters={handleApplyFilters}
  onClearFilters={handleClearFilters}
  loading={isLoading}
/>
```

---

## 🔧 Dependencias

- `@heroicons/react/24/outline` - Iconos
- `@/components/ui/*` - Componentes Shadcn/ui (Button, Badge, Table, Tabs, Checkbox, Label)
- `@/types/api` - Tipos TypeScript

## 🎨 Estilos

Todos los componentes usan:
- Tailwind CSS 3.4
- Dark mode support
- Responsive design (mobile-first)
- Colores consistentes:
  - Azul (`blue-600`): Salario bruto
  - Rojo (`red-600`): Deducciones
  - Verde (`green-600`): Salario neto
  - Púrpura (`purple-600`): Ganancia empresa

## 📦 Exportación

Todos los componentes se exportan desde `index.ts`:

```typescript
import {
  SalarySummaryCards,
  SalaryBreakdownTable,
  SalaryDeductionsTable,
  SalaryCharts,
  SalaryReportFiltersComponent,
} from '@/components/salary';
```

## ✅ Compatibilidad

- Next.js 16.0.0
- React 19.0.0
- TypeScript 5.6
- Tailwind CSS 3.4

## 📝 Notas

- Todos los componentes son "client components" (`'use client'`)
- Formato de moneda: `¥X,XXX,XXX` (yen japonés)
- Formato de fechas: `YYYY年MM月` o `YYYY年MM月DD日`
- Todos los textos están en japonés con traducción en inglés
