# 📊 Análisis Completo del Sistema de Salarios/Nómina

**Fecha:** 2025-11-12
**Versión:** 5.4.1
**Estado:** Análisis completo en curso

---

## 🎯 Ejecutivo

El sistema de salarios/nómina contiene **DOS sistemas paralelos no integrados**:

1. **Sistema Salary (Simple)** - `SalaryCalculation` - Antiguo/básico
2. **Sistema Payroll (Completo)** - `PayrollRun` + `EmployeePayroll` - Nuevo/profesional

**Recomendación:** Consolidar en un único sistema unificado.

---

## 📐 Arquitectura Actual

### A. Backend - APIs Implementadas

#### 1. Salary API (`/api/salary/`)
**Archivo:** `backend/app/api/salary.py` (407 líneas)

**Endpoints (6):**
```
POST   /api/salary/calculate          ✅ Calcular salario individual
POST   /api/salary/calculate/bulk     ✅ Calcular salarios masivos
GET    /api/salary/                   ✅ Listar cálculos (paginado)
GET    /api/salary/{salary_id}        ✅ Obtener cálculo específico
POST   /api/salary/mark-paid          ✅ Marcar como pagado
GET    /api/salary/statistics         ✅ Estadísticas por mes
```

**Características:**
- Calcula desde timer cards aprobadas
- Soporte para horas extras, nocturnas, festivas
- Bonos y deducciones personalizables
- Deducciones de apartamento (simple integer)
- Cálculo de utilidad (factory_payment - gross_salary)

**Falta:**
- ❌ DELETE, PUT, PATCH
- ❌ Exportación a Excel/PDF
- ❌ Reportes avanzados

#### 2. Payroll API (`/api/payroll/`)
**Archivo:** `backend/app/api/payroll.py` (927 líneas)

**Endpoints (14):**
```
POST   /api/payroll/runs              ✅ Crear ejecución
GET    /api/payroll/runs              ✅ Listar ejecuciones
GET    /api/payroll/runs/{id}         ✅ Obtener ejecución
POST   /api/payroll/runs/{id}/calculate  ✅ Calcular payroll
GET    /api/payroll/runs/{id}/employees  ✅ Empleados en ejecución
POST   /api/payroll/runs/{id}/approve    ✅ Aprobar ejecución
POST   /api/payroll/calculate            ✅ Calcular individual
POST   /api/payroll/calculate-from-timer-cards/{id}  ✅ Desde BD
POST   /api/payroll/payslips/generate    ✅ Generar nómina
GET    /api/payroll/payslips/{id}       ✅ Info de nómina
GET    /api/payroll/settings            ✅ Obtener config
PUT    /api/payroll/settings            ✅ Actualizar config
GET    /api/payroll/summary             ✅ Resumen general
```

**Características:**
- Integración con BD (timer cards, empleados, apartamentos)
- Desglose detallado de horas (regular, overtime, night, holiday, sunday)
- Deducciones completas (income_tax, resident_tax, health_insurance, pension, employment_insurance)
- Generación de PDF (payslips)
- Estados: draft → calculated → approved → paid/cancelled
- Configuración en BD (payroll_settings)

**Falta:**
- ❌ DELETE, PUT para runs
- ❌ Cancelación de runs
- ❌ Marcar como pagado
- ❌ Exportación en lote

### B. Backend - Modelos de Datos

#### 1. SalaryCalculation (tabla: salary_calculations)
**Ubicación:** `backend/app/models/models.py`

**Campos:**
```python
id, employee_id, month, year,
total_regular_hours, total_overtime_hours, total_night_hours, total_holiday_hours,
base_salary, overtime_pay, night_pay, holiday_pay, bonus, gasoline_allowance,
apartment_deduction (SIMPLE INTEGER), other_deductions,
gross_salary, net_salary,
factory_payment, company_profit,
is_paid, paid_at, created_at
```

**Relaciones:**
- `employee_id` → Employee

**Problemas:**
- ⚠️ Deducciones de apartamento: simple integer (no integrado con rent_deductions)
- ⚠️ No tiene desglose de horas detallado (no por hora, solo total)
- ⚠️ No tiene deducciones de impuestos detalladas

#### 2. Payroll Models (archivos: payroll_models.py + modelo extendido en models.py)

**PayrollRun:**
```python
id, period_year, period_month, status (draft/calculated/approved/paid/cancelled),
created_by_id, approved_by_id,
total_employees, total_gross_amount, total_deductions, total_net_amount,
created_at, updated_at, approved_at
```

**EmployeePayroll:**
```python
id, payroll_run_id, employee_id,
regular_hours, overtime_hours, night_shift_hours, holiday_hours, sunday_hours,
hourly_rate, overtime_rate, night_shift_rate, holiday_rate, sunday_rate,
regular_amount, overtime_amount, night_shift_amount, holiday_amount, sunday_amount,
bonus, gasoline_allowance, total_gross_amount,
income_tax, resident_tax, health_insurance, pension, employment_insurance,
total_deductions, total_net_amount,
payslip_generated, payslip_pdf_path,
created_at, updated_at
```

**PayrollSettings:**
```python
overtime_rate (1.25), night_shift_rate (1.25), holiday_rate (1.35), sunday_rate (1.35),
standard_hours_per_month (160)
```

**RentDeduction:**
- Integración con sistema de apartamentos V2
- Tablas separadas: base_rent, additional_charges, total_deduction

#### 3. Problema: Dos Tablas, Dos Estructuras

| Aspecto | SalaryCalculation | EmployeePayroll |
|--------|------------------|-----------------|
| **Horas** | 4 campos totales | 5 campos detallados |
| **Tasas** | Hardcoded en config | En tabla payroll_settings |
| **Deducciones Apartamento** | Integer simple | Tabla rent_deductions |
| **Deducciones Fiscales** | No tiene | 5 campos detallados |
| **Estado** | is_paid boolean | status enum completo |
| **PDF** | No | payslip_pdf_path |

### C. Backend - Servicios

#### 1. PayrollService
**Archivo:** `backend/app/services/payroll_service.py` (597 líneas)

**Métodos clave:**
```python
get_employee_data_for_payroll()              # Consulta BD (empleado, rate, factory)
get_apartment_deductions_for_month()         # Consulta rent_deductions
calculate_employee_payroll()                 # Cálculo completo
_calculate_hours()                           # Desglose de horas
_calculate_night_hours()                     # Noturnas (22:00-05:00)
```

**Características:**
- Obtiene datos reales desde BD
- Integra con rent_deductions
- Tasas de configuración de BD
- Horas nocturnas automáticas (22:00-05:00)

#### 2. PayrollIntegrationService
**Archivo:** `backend/app/services/payroll_integration_service.py` (400 líneas)

**Métodos:**
```python
get_timer_cards_for_payroll()                # Lee desde BD
calculate_payroll_from_timer_cards()         # Cálculo desde histórico
get_unprocessed_timer_cards()                # Filtros
```

#### 3. Salary Service
**Ubicación:** En el router (`backend/app/api/salary.py`)

**Función:** `calculate_employee_salary()`
- Cálculo manual desde input JSON
- No consulta BD para datos
- Tasas hardcoded

**Problema:** Lógica en router (violación MVC)

### D. Frontend - Páginas

#### 1. Payroll Pages
```
/payroll                           ✅ Dashboard principal
/payroll/calculate                 ✅ Cálculo individual
/payroll/settings                  ✅ Configuración
/payroll/timer-cards               ✅ Gestión de timer cards
/payroll/yukyu-summary             ✅ Resumen
```

**Faltan:**
```
❌ /payroll/create                 Nueva ejecución
❌ /payroll/[id]                   Detalles de ejecución
❌ /payroll/[id]/edit              Editar ejecución
❌ /payroll/reports                Reportes y exportación
```

#### 2. Salary Page
```
/salary                            ✅ Dashboard principal
```

**Faltan:**
```
❌ /salary/calculate               Cálculo individual
❌ /salary/bulk-calculate          Cálculo masivo
❌ /salary/[id]                    Detalles de cálculo
❌ /salary/reports                 Reportes
```

### E. Frontend - API Client

#### 1. PayrollAPI (payroll-api.ts)
**13 métodos completos** con TypeScript types (38 interfaces)

```typescript
createPayrollRun()
getPayrollRuns()
getPayrollRun(id)
calculateBulkPayroll()
calculateEmployeePayroll()
calculatePayrollFromTimerCards()  // ⭐ Integración con BD
approvePayrollRun()
generatePayslip()
getPayslip()
getPayrollSettings()
updatePayrollSettings()
getPayrollSummary()
```

#### 2. Salary Service
**En api.ts** - Solo 3 métodos básicos

```typescript
getSalaries()
getSalary(id)
calculateSalary()
```

### F. Frontend - State Management

**PayrollStore (Zustand):**
```typescript
payrollRuns, selectedPayrollRun
payrollSummary
payrollSettings
currentEmployeePayroll
bulkCalculationResult
loading, error
```

---

## 🚨 Problemas Detectados

### Nivel 1: Crítico (Impacta funcionalidad)

#### 1.1 Dos Sistemas No Integrados
**Problema:** Salary y Payroll son sistemas completamente separados

```
Timer Cards → SalaryCalculation  (simple)
           → EmployeePayroll     (completo)  ❌ Duplicación
```

**Impacto:**
- Datos duplicados
- Confusión de cuál usar
- Mantenimiento difícil

#### 1.2 Deducciones de Apartamento Inconsistentes
**Problema:**
- SalaryCalculation: `apartment_deduction` (integer simple)
- PayrollService: integra con `rent_deductions` (tabla completa)

**Impacto:**
- Cálculos diferentes según cuál sistema se usa
- Difícil de mantener

#### 1.3 Configuración Dividida
**Problema:**
- Salary: tasas hardcoded en `config.py`
- Payroll: tasas en tabla `payroll_settings`

**Impacto:**
- No hay fuente única de verdad
- Cambios de tasas inconsistentes

#### 1.4 Lógica en Router
**Problema:** `calculate_employee_salary()` en `salary.py` (router)

**Impacto:**
- Difícil de testear
- Violarión del patrón MVC
- No reutilizable

### Nivel 2: Importante (Falta funcionalidad)

#### 2.1 Páginas Frontend Faltantes
- `/payroll/create` - Crear nueva ejecución
- `/payroll/[id]` - Detalles de ejecución
- `/salary/calculate` - Cálculo individual
- `/salary/[id]` - Detalles
- `/salary/reports` - Reportes

#### 2.2 Endpoints Faltantes
- DELETE, PUT para salary y payroll runs
- Cancelación de runs
- Marcar payroll run como pagado
- Exportación en lote

#### 2.3 Servicios Faltantes
- SalaryService (la lógica está en router)
- Servicio de PDF (la lógica está en router)
- Servicio de Excel/reportes
- Servicio de analytics

#### 2.4 Componentes Reutilizables
- No hay componentes en `/components/salary/`
- No hay componentes en `/components/payroll/`
- Todo el código está en las páginas (violación DRY)

### Nivel 3: Importante (Testing)

#### 3.1 Sin Tests
- ❌ No hay tests en `backend/tests/test_salary.py`
- ❌ No hay tests en `backend/tests/test_payroll.py`
- ❌ No hay E2E tests para flujo de nómina

---

## 📊 Matriz de Características

| Característica | Salary | Payroll | Unificado |
|---|---|---|---|
| **Cálculo de horas** | Básico (4 tipos) | Completo (5 tipos) | ✅ Completo |
| **Deducciones de apartamento** | Simple | Con BD | ✅ Con BD |
| **Deducciones fiscales** | No | Sí (5 tipos) | ✅ Sí |
| **Configuración en BD** | No | Sí | ✅ Sí |
| **Generación PDF** | No | Sí | ✅ Sí |
| **Estados completos** | is_paid | draft→paid | ✅ Estados |
| **Integración BD** | No | Sí | ✅ Sí |
| **Autorización** | JWT | JWT | ✅ JWT |

---

## 📋 Checklist de Consolidación

### Fase 1: Backend
- [ ] Crear `SalaryService` unificado
- [ ] Consolidar esquemas Pydantic
- [ ] Consolidar endpoints (`/api/salary/` absorbe todo)
- [ ] Eliminar `SalaryCalculation` obsoleto
- [ ] Unificar configuración en `payroll_settings`
- [ ] Crear tests unitarios

### Fase 2: Frontend
- [ ] Crear páginas faltantes
- [ ] Crear componentes reutilizables
- [ ] Unificar API client
- [ ] Unificar Zustand store
- [ ] Crear E2E tests

### Fase 3: Documentación
- [ ] API documentation
- [ ] User guide
- [ ] Migration guide

---

## 🔄 Flujos de Integración

### Flujo Actual (Problemático)

```
Timer Cards → Router salary.py (función directa)
           ↓
         BD (SalaryCalculation)

Timer Cards → Router payroll.py (PayrollService)
           ↓
         BD (EmployeePayroll, PayrollRun)
```

### Flujo Propuesto (Unificado)

```
Timer Cards
     ↓
SalaryService (unificado)
     ↓
PayrollService (cálculos avanzados)
     ↓
BD (único modelo unified_payroll o salary_v2)
     ↓
Frontend (una sola fuente de verdad)
```

---

## 💾 Tablas de Base de Datos

### Actuales (5 tablas)
1. `salary_calculations` - Sistema antiguo
2. `payroll_runs` - Contenedor de ejecución
3. `employee_payroll` - Detalle por empleado
4. `payroll_settings` - Configuración
5. `rent_deductions` - Apartamentos

### Propuesto (3 tablas)
1. `salary_calculations_v2` (unificado de SalaryCalculation + EmployeePayroll)
2. `payroll_runs` (mantener igual)
3. `payroll_settings` (mantener igual)
4. `rent_deductions` (mantener igual)

**Nota:** Usar alembic migration para cambio sin pérdida de datos

---

## 🎯 Plan de Acción

### Etapa 1: Análisis ✅ COMPLETADO
- [x] Exploración de codebase
- [x] Documentación de hallazgos
- [x] Identificación de problemas

### Etapa 2: Consolidación (Siguiente)
**Tareas:**
1. Crear `SalaryService` unificado
2. Consolidar esquemas
3. Unificar endpoints
4. Crear páginas faltantes
5. Crear componentes reutilizables

### Etapa 3: Testing
**Tareas:**
1. Tests unitarios backend
2. E2E tests frontend
3. Tests de integración

### Etapa 4: Documentación
**Tareas:**
1. API docs
2. User guide
3. Developer guide

---

## 📞 Contacto & Próximos Pasos

**Estado Actual:** Análisis completado
**Siguiente Paso:** Revisar recomendaciones y autorizar consolidación

**Recomendaciones Prioritarias:**
1. **Consolidar Salary + Payroll en un único sistema**
2. **Crear SalaryService en backend**
3. **Eliminar lógica en routers**
4. **Crear todas las páginas faltantes**
5. **Agregar tests unitarios y E2E**

---

**Generado automáticamente por Agent Explore**
**Última actualización:** 2025-11-12
