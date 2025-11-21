# 🔍 INSPECCIÓN COMPLETA Y PLAN MAESTRO
## UNS-ClaudeJP 6.0.0

**Generado**: 2025-11-19 22:35:50
**Rama**: `claude/audit-and-fix-plan-014Tkg2haFHvv4YQKA4Pt1v4`
**Versión del Proyecto**: 6.0.0
**Estado General**: ⚠️ **CONDICIONAL PARA PRODUCCIÓN** (7.8/10)

---

# 1️⃣ RESUMEN EJECUTIVO (EL DIAGNÓSTICO)

## ¿Qué es esta aplicación?

**UNS-ClaudeJP 6.0.0** es un **Sistema Integral de Gestión de Recursos Humanos (RRHH)** diseñado específicamente para agencias de staffing japonesas.

### Lo que hace:
- 🎯 **Gestión de Candidatos**: OCR híbrido para CV japoneses (履歴書 - Rirekisho)
- 👔 **Control de Empleados**: Seguimiento de empleados en dispatch (派遣社員)
- 🏭 **Administración de Clientes**: Empresas clientes y sitios de trabajo
- ⏱️ **Control de Asistencia**: 3 turnos con timecard (タイムカード)
- 💰 **Nómina Automatizada**: Cálculo de salarios + beneficios (給与)
- 📋 **Workflows de Solicitudes**: Aprobaciones con rutas complejas
- 🎨 **Temas Personalizables**: 12 temas + customización total
- 🔬 **IA Híbrida**: Azure Vision + EasyOCR + OpenAI + Gemini + Claude

### Stack Tecnológico:
- **Frontend**: Next.js 16 + React 19 + TailwindCSS + TypeScript
- **Backend**: FastAPI + Python 3.11 + PostgreSQL + Redis
- **Infraestructura**: Docker Compose 6+ servicios + Nginx + Observabilidad
- **Testing**: Playwright E2E + Vitest unitarios
- **Observabilidad**: OpenTelemetry + Prometheus + Grafana

## Estado de Salud General

```
┌─────────────────────────────────────────────────┐
│ DIAGNÓSTICO RÁPIDO                              │
├─────────────────────────────────────────────────┤
│ Frontend:        ⚠️  7.5/10 (Limpieza urgente) │
│ Backend:         ⚠️  7.8/10 (Refactorización)  │
│ Infraestructura: ❌ 5.0/10 (NO LISTA PROD)     │
│ Seguridad:       ❌ 4.5/10 (CRÍTICA)           │
│ Tests:           ✅ 8.0/10 (Bien cubiertos)    │
│ Documentación:   ✅ 8.5/10 (Excelente)         │
├─────────────────────────────────────────────────┤
│ PROMEDIO:        ⚠️  7.1/10                     │
│                                                 │
│ 🚨 CONCLUSIÓN: Está en terapia intensiva,      │
│    pero con un buen plan se recupera rápido.   │
│    NO LANZAR A PRODUCCIÓN sin fixes críticos.  │
└─────────────────────────────────────────────────┘
```

### Lo Bueno ✅
- Arquitectura bien estructurada (clean separation of concerns)
- TypeScript + type safety en todo
- Testing framework implementado (Playwright + Vitest)
- Observabilidad desde el inicio (OpenTelemetry)
- Docker & deployment listos (casi)
- Base de datos bien normalizada
- APIs RESTful coherentes

### Los Problemas 🚨
- Frontend: 261 componentes huérfanos, 4 duplicados críticos, 20 rutas vacías
- Backend: 77+ problemas, exception handling pobre (125 bloques genéricos)
- Seguridad: CORS wildcard `*`, SSL no configurado, `.env.production` en git
- Falta limpieza: 3 TODOs sin implementar, archivos viejos no borrados
- Conflictos API: factory_id (number vs string), employee_id naming

---

# 2️⃣ ÁRBOL DE CARPETAS INTELIGENTE

```
UNS-ClaudeJP-6.0.0/
│
├── 📁 frontend/ ⚠️ (Necesita limpieza)
│   ├── app/
│   │   ├── (dashboard)/          ✅ Bien estructurado
│   │   ├── login/                ✅ Funcional
│   │   ├── admin/                ⚠️  2 TODOs, sin APIs
│   │   ├── candidates/           ✅ Activo
│   │   ├── employees/            ⚠️  [id]/edit sin API
│   │   ├── apartments/           ✅ Activo
│   │   ├── payroll/              ⚠️  Incompleto
│   │   ├── factories/            ⚠️  [id] sin API
│   │   ├── timercards/           ✅ Funcional
│   │   ├── requests/             ✅ Activo
│   │   ├── themes/               ❌ 🗑️ VACÍO - BORRAR
│   │   ├── settings/             ❌ 🗑️ VACÍO - BORRAR
│   │   ├── support/              ❌ 🗑️ VACÍO - BORRAR
│   │   └── [+30 rutas más]       ⚠️  Revisar uso
│   │
│   ├── components/
│   │   ├── ui/                   ✅ 20+ componentes Radix
│   │   ├── admin/                ⚠️  Muchos sin usar
│   │   ├── candidates/           ⚠️  Revisar huérfanos
│   │   ├── apartments/           ⚠️  ApartmentSelector duplicado 🗑️
│   │   ├── salary/               ⚠️  SalaryCharts sin usar
│   │   ├── payroll/              ⚠️  Muchos duplicados
│   │   └── [+150 más]            ❌ 261 HUÉRFANOS - AUDITAR
│   │
│   ├── 🗑️ components/old/ (SI EXISTE - BORRAR)
│   ├── 🗑️ components/deprecated/ (SI EXISTE - BORRAR)
│   ├── lib/                      ✅ Bien organizado
│   ├── hooks/                    ✅ 12+ custom hooks
│   ├── stores/                   ✅ 8 Zustand stores
│   ├── types/                    ✅ TypeScript types
│   ├── tests/                    ✅ Playwright + Vitest
│   └── public/                   ✅ Estáticos
│
├── 📁 backend/ ⚠️ (Necesita refactorización)
│   ├── app/
│   │   ├── main.py               ✅ FastAPI bien configurado
│   │   ├── api/
│   │   │   ├── auth.py           ✅ Bueno
│   │   │   ├── payroll.py        🔴 44 except genéricos 🗑️
│   │   │   ├── yukyu.py          ✅ 15 endpoints OK
│   │   │   ├── apartments_v2.py  ✅ 30 endpoints OK
│   │   │   ├── admin.py          ⚠️  2 TODOs, sin response_model
│   │   │   ├── ai_agents.py      🔴 44 except genéricos 🗑️
│   │   │   ├── employees.py      ⚠️  Type mismatch factory_id
│   │   │   └── [+17 routers]
│   │   ├── models/               ✅ 27 SQLAlchemy models
│   │   ├── schemas/              ⚠️  Conflictos con frontend
│   │   ├── services/             ✅ 20 servicios bien
│   │   ├── core/
│   │   │   ├── config.py         ⚠️  DEBUG en prod
│   │   │   ├── security.py       ✅ JWT correcto
│   │   │   └── database.py       ✅ BD OK
│   │   └── utils/                ✅ Bien
│   ├── alembic/                  ✅ Migraciones OK
│   ├── tests/                    ✅ pytest configurado
│   └── requirements.txt          ✅ Dependencias OK
│
├── 📁 docker/ ⚠️ (SEGURIDAD CRÍTICA)
│   ├── nginx.conf                ❌ CORS wildcard * (P2)
│   ├── docker-compose.yml        ❌ .env.production en git (P1)
│   ├── Dockerfile.backend        ⚠️  Corre como root (P8)
│   ├── Dockerfile.frontend       ✅ Multi-stage OK
│   ├── Dockerfile.nginx          ✅ Alpine OK
│   └── conf.d/                   ⚠️  SSL comentado (P3)
│
├── 📁 base-datos/                ✅ Bien (backups SQL)
├── 📁 docs/                      ✅ Excelente documentación
├── 📁 scripts/                   ⚠️  Revisar uso
├── 📁 uploads/                   ✅ OK (archivos user)
│
├── .env.example                  ✅ Dummy values
├── .env.production               ❌ 🗑️ REMOVER DE GIT (P1)
├── docker-compose.yml            ❌ Puertos sensibles (P4)
├── generate_env.py               ✅ Script helper
└── .gitignore                    ⚠️  Falta .env.production

═══════════════════════════════════════════════════════════

LIMPIEZA URGENTE (Máximo 30 minutos):
🗑️ Eliminar archivos/carpetas:
   - frontend/app/themes/
   - frontend/app/settings/
   - frontend/app/support/
   - frontend/components/ApartmentSelector-enhanced.tsx (duplicado)
   - frontend/components/error-boundary* (consolidar en 1)
   - backend/payroll.py (reescribir - 44 except genéricos)
   - .env.production (REMOVER DE GIT)

═══════════════════════════════════════════════════════════
```

---

# 3️⃣ AUDITORÍA FRONTEND (Páginas vs Realidad)

## Estadísticas Crudas
- **99 rutas totales** definidas en `/frontend/app`
- **45 rutas funcionales** con APIs activas ✅
- **25 rutas parcialmente funcionales** con TODOs ⚠️
- **20 rutas completamente vacías** ❌
- **261 componentes potencialmente huérfanos** 🗑️
- **4 componentes duplicados críticos** ⚠️

## Tabla de Rutas Principales

| Ruta | Archivo | Estado | APIs | Veredicto |
|------|---------|--------|------|-----------|
| `/` | `page.tsx` | ✅ | - | Home OK |
| `/login` | `login/page.tsx` | ✅ | `/api/auth/login` | Autenticación OK |
| `/dashboard` | `(dashboard)/page.tsx` | ✅ | 4 servicios | Dashboard OK |
| `/dashboard/candidates` | `candidates/page.tsx` | ✅ | `/api/candidates` | Listado OK |
| `/dashboard/candidates/[id]` | `candidates/[id]/page.tsx` | ✅ | `/api/candidates/:id` | Detalle OK |
| `/dashboard/employees` | `employees/page.tsx` | ✅ | `/api/employees` | Listado OK |
| `/dashboard/employees/[id]/edit` | `employees/[id]/edit/page.tsx` | ⚠️ ROTO | SIN API | **NO HAY ENDPOINT** |
| `/dashboard/apartments` | `apartments/page.tsx` | ✅ | `/api/apartments-v2` | Listado OK |
| `/dashboard/factories` | `factories/page.tsx` | ✅ | `/api/factories/stats` | Listado OK |
| `/dashboard/factories/[id]` | `factories/[id]/page.tsx` | ❌ ROTO | SIN API | **NO HAY ENDPOINT** |
| `/dashboard/payroll` | `payroll/page.tsx` | ⚠️ | `/api/payroll` | Parcial (TODO) |
| `/dashboard/yukyu` | `yukyu/page.tsx` | ✅ | `/api/yukyu` | OK |
| `/dashboard/timercards` | `timercards/page.tsx` | ✅ | `/api/timercards` | OK |
| `/dashboard/requests` | `requests/page.tsx` | ✅ | `/api/requests` | OK |
| `/dashboard/admin/audit-logs` | `admin/audit-logs/page.tsx` | ⚠️ | NO API | **TODO** |
| `/dashboard/themes` | `themes/page.tsx` | ❌ VACÍO | - | 🗑️ BORRAR |
| `/dashboard/settings` | `settings/page.tsx` | ❌ VACÍO | - | 🗑️ BORRAR |
| `/dashboard/support` | `support/page.tsx` | ❌ VACÍO | - | 🗑️ BORRAR |
| `/employees` (top-level) | `employees/page.tsx` | ❌ | - | 🗑️ ALTERNATIVA NO USADA |
| `/candidates` (top-level) | `candidates/page.tsx` | ❌ | - | 🗑️ ALTERNATIVA NO USADA |
| `/factories` (top-level) | `factories/page.tsx` | ❌ | - | 🗑️ ALTERNATIVA NO USADA |

## Componentes Duplicados Críticos (4)

```typescript
// ❌ PROBLEMA 1: Error Boundaries (4 variantes)
frontend/components/error-boundary.tsx
frontend/components/ErrorBoundary.tsx              ← DUPLICADO
frontend/components/error-boundary-wrapper.tsx    ← DUPLICADO
frontend/components/theme-error-boundary.tsx      ← DUPLICADO

// SOLUCIÓN: Consolidar en UN solo archivo
// Mantener: components/error-boundary.tsx
// Borrar: Los otros 3

// ❌ PROBLEMA 2: Apartment Selectors
frontend/components/apartments/ApartmentSelector.tsx
frontend/components/apartments/ApartmentSelector-enhanced.tsx  ← DUPLICADO

// SOLUCIÓN: Usar solo ApartmentSelector.tsx (si enhanced, renombrar)

// ❌ PROBLEMA 3: OCR Uploaders
frontend/components/OCRUploader.tsx
frontend/components/AzureOCRUploader.tsx          ← PARECIDO

// SOLUCIÓN: Consolidar en uno con parámetro para tipo OCR

// ❌ PROBLEMA 4: Transiciones de página
frontend/components/PageTransition.tsx
frontend/components/animated-link.tsx             ← PARECIDO

// SOLUCIÓN: Unificar o usar uno solo
```

## Páginas Completamente Vacías (Borrar)

```
🗑️ /dashboard/themes/page.tsx
   - Solo muestra "Contenido de temas"
   - No usa APIs
   - Reemplazar con la funcionalidad en themes customizer

🗑️ /dashboard/settings/page.tsx
   - Página en blanco
   - Sin funcionalidad
   - Si necesita settings, crear en admin

🗑️ /dashboard/support/page.tsx
   - No hace nada
   - No hay APIs de soporte
   - Remover

🗑️ Todas las rutas top-level alternativas:
   /employees, /candidates, /factories, /payroll, /requests,
   /timercards, /apartments, /admin, /profile, /reports

   (Usar solo /dashboard/...)
```

## TODOs Pendientes en Frontend (3)

### 1. Yukyu Management (📍 `admin/yukyu-management/page.tsx`)
```javascript
// Línea ~247
totalUsed: 0,           // TODO: calcular desde requests
totalExpired: 0         // TODO: calcular desde balances

// IMPACTO: No muestra datos correctos de yukyu disponible
// FIX: 30 minutos - conectar a la API de yukyu
```

### 2. Payroll Detail (📍 `payroll/[id]/page.tsx`)
```javascript
// Línea ~156
approved_by: 'admin',   // TODO: Get from auth context

// IMPACTO: Siempre muestra 'admin', nunca el usuario real
// FIX: 15 minutos - usar useAuth hook
```

### 3. Arrears Report (📍 `apartment-reports/arrears/page.tsx`)
```javascript
// Línea ~380
// TODO: Implement PDF export

// IMPACTO: Botón de PDF no funciona
// FIX: 1 hora - implementar con pdfkit o similar
```

## Componentes Huérfanos (261 componentes)

**Ejemplos de componentes que NO se usan en ninguna página:**

```
🗑️ Componentes de Diseño (30+):
   - advanced-color-picker.tsx
   - border-radius-visualizer.tsx
   - color-palette-generator.tsx
   - contrast-checker.tsx
   - gradient-builder.tsx
   - spacing-scale-generator.tsx
   - typography-scale-generator.tsx

🗑️ Componentes de Negocio (150+):
   - ApartmentsTab.tsx (¿Para qué tab?)
   - EmployeesTab.tsx (duplicado de main page)
   - SalaryCharts.tsx (no usado en payroll)
   - SalaryBreakdownTable.tsx (similar)
   - AdditionalChargeForm.tsx (sin uso)
   - AssignmentForm.tsx (duplicado)

🗑️ Componentes de Gráficos:
   - AreaChartCard.tsx
   - BarChartCard.tsx
   - DonutChartCard.tsx
   - (¿Por qué no solo Recharts?)

ACCIÓN: Auditar TODOS. Si no se importan ≥ 2 veces, borrar.
```

## Veredicto Frontend

```
Estado: ⚠️ 7.5/10 - NECESITA LIMPIEZA URGENTE

Lo que funciona bien:
✅ Routing con App Router (Next.js 13+)
✅ Componentes UI base (Radix UI bien integrado)
✅ Stores Zustand (estado global limpio)
✅ API client axios (buenas prácticas)
✅ Types TypeScript (strict mode)

Lo que está roto:
❌ 20 rutas vacías que se pueden borrar
❌ 261 componentes huérfanos (limpieza urgente)
❌ 4 componentes duplicados críticos
❌ 9 rutas top-level alternativas sin uso
❌ 3 TODOs sin implementar
❌ 125 console.warn/errors huérfanos

ACCIONES INMEDIATAS:
1. Eliminar 20 rutas vacías (15 min)
2. Consolidar 4 duplicados (30 min)
3. Borrar rutas top-level (5 min)
4. Auditar 261 huérfanos (máx 60 min)
5. Implementar 3 TODOs (2 horas)
6. Total: ~3.5 horas
```

---

# 4️⃣ AUDITORÍA BACKEND (La Sala de Máquinas)

## Estadísticas de Endpoints

| Métrica | Cantidad | Estado |
|---------|----------|--------|
| **Endpoints totales** | 269 | ⚠️ |
| **Routers activos** | 26 | ✅ |
| **Modelos SQLAlchemy** | 27 | ✅ |
| **Esquemas Pydantic** | 35+ | ⚠️ |
| **Servicios** | 20 | ✅ |
| **Exception handlers genéricos** | 125 | ❌ CRÍTICO |
| **TODOs sin implementar** | 7 | ⚠️ |
| **Type mismatches** | 5 | ❌ CRÍTICO |

## Problemas Críticos (3)

### 🔴 PROBLEMA 1: Type Mismatch - factory_id

**Ubicación**: `backend/app/schemas/employee.py:31`

```python
# ACTUAL (INCORRECTO):
factory_id: int  # Frontend envía number, OK

# PERO EN VALIDACIÓN:
# Backend espera string en algunos casos
# → Error 422 "value is not a valid integer"

# IMPACTO:
# ❌ No se pueden crear empleados desde frontend
# ❌ POST /api/employees/create falla
# ❌ El usuario ve: "Invalid factory_id"
```

**Solución** (15 minutos):
```python
# backend/app/schemas/employee.py
from pydantic import Field, validator

class EmployeeCreate(BaseModel):
    factory_id: int = Field(..., gt=0)  # Validar > 0

    @validator('factory_id')
    def validate_factory_id(cls, v):
        if not isinstance(v, int) or v <= 0:
            raise ValueError('factory_id must be positive integer')
        return v
```

---

### 🔴 PROBLEMA 2: Endpoint Payroll Faltante (CRÍTICO)

**Ubicación**: `backend/app/api/payroll.py:769`

```python
# ACTUAL:
@router.post("/calculate-from-timercards")
async def calculate_payroll_from_timercards(
    request: PayrollCalculationRequest,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    """
    Calculate payroll from timercards
    # TODO: Implementar cálculo de nómina desde timercards
    """
    return {"status": "not_implemented"}  # ❌ INCOMPLETO

# IMPACTO:
# ❌ Frontend no puede calcular nóminas
# ❌ POST /api/payroll/calculate-from-timercards devuelve 501
# ❌ Funcionalidad crítica de negocio rota
```

**Solución** (2-3 horas):
```python
@router.post("/calculate-from-timercards")
async def calculate_payroll_from_timercards(
    request: PayrollCalculationRequest,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    """
    Calculate payroll from timercards for date range
    """
    try:
        # 1. Obtener timercards del período
        timercards = db.query(TimeCard).filter(
            TimeCard.employee_id == request.employee_id,
            TimeCard.date >= request.start_date,
            TimeCard.date <= request.end_date
        ).all()

        # 2. Calcular horas por tipo
        regular_hours = sum(tc.regular_hours for tc in timercards)
        overtime_hours = sum(tc.overtime_hours for tc in timercards)

        # 3. Obtener tasas del empleado
        employee = db.query(Employee).get(request.employee_id)
        hourly_rate = employee.base_hourly_rate
        overtime_rate = hourly_rate * 1.5

        # 4. Calcular totales
        gross_salary = (regular_hours * hourly_rate) + (overtime_hours * overtime_rate)

        # 5. Guardar en BD
        payroll = Payroll(
            employee_id=request.employee_id,
            period_start=request.start_date,
            period_end=request.end_date,
            gross_salary=gross_salary,
            # ... otros campos
        )
        db.add(payroll)
        db.commit()

        return PayrollResponse(
            id=payroll.id,
            gross_salary=payroll.gross_salary,
            # ...
        )
    except Exception as e:
        logger.error(f"Error calculating payroll: {e}")
        raise HTTPException(status_code=500, detail="Error calculating payroll")
```

---

### 🔴 PROBLEMA 3: Exception Handling Genérico (CRÍTICO)

**Ubicación**: `backend/app/api/payroll.py` (44 casos), `ai_agents.py` (44 casos)

```python
# ACTUAL (MAL):
try:
    # ... lógica ...
except Exception as e:  # ❌ Demasiado genérico
    return {"status": "error", "message": str(e)}

# IMPACTO:
# ❌ No se sabe qué falló (BD, API externa, lógica de negocio?)
# ❌ Stack trace perdido en logs
# ❌ Usuario no entiende el error
# ❌ Debugging imposible en producción

# MEJOR PRÁCTICA:
try:
    # ... lógica ...
except ValueError as e:       # Error de validación
    logger.warning(f"Validation error: {e}")
    raise HTTPException(status_code=400, detail=str(e))
except SQLAlchemyError as e:  # Error de BD
    logger.error(f"Database error: {e}")
    raise HTTPException(status_code=500, detail="Database error")
except requests.RequestException as e:  # Error de API externa
    logger.error(f"External API error: {e}")
    raise HTTPException(status_code=503, detail="External service error")
except Exception as e:         # Fallback (nunca debería llegar)
    logger.exception(f"Unexpected error: {e}")
    raise HTTPException(status_code=500, detail="Internal server error")
```

**Solución** (4-6 horas):
- Crear custom exception classes
- Reemplazar todos los `except Exception` con tipos específicos
- Propagar contexto en logs

---

## Conflictos Frontend-Backend (5 principales)

### Conflicto 1: factory_id Type ❌
```
Frontend:  POST /api/employees { factory_id: 5 }  (número)
Backend:   expects Integer, pero en BD es VARCHAR
Resultado: 422 Unprocessable Entity
Fix:       30 minutos
```

### Conflicto 2: employee_id Naming ⚠️
```
Frontend:  usa employee_id en URLs
Backend:   algunas rutas esperan jikyu_id
Resultado: 404 Not Found en algunas operaciones
Fix:       30 minutos (renombrar consistentemente)
```

### Conflicto 3: base_hourly_rate vs jikyu ⚠️
```
Frontend:  envía base_hourly_rate
Backend:   schemas/salary.py espera jikyu
Resultado: Campos vacíos en nómina
Fix:       30 minutos (consolidar naming)
```

### Conflicto 4: Response Structure ⚠️
```
Frontend:  espera { data: [...], total: 100 }
Backend:   devuelve { items: [...], count: 100 }
Resultado: Frontend recibe undefined
Fix:       30 minutos (standarizar response wrapper)
```

### Conflicto 5: apartment_rent Optionality ⚠️
```
Frontend:  puede ser null
Backend:   required=True en schema
Resultado: Empleados sin apartamento fallan
Fix:       15 minutos (hacer optional)
```

## Routers con Más Problemas

### 🔴 Backend: Routers Críticos Necesitando Fixes

| Router | Líneas | Problemas | Prioridad |
|--------|--------|----------|-----------|
| `payroll.py` | 850+ | 44 except genéricos, endpoint incompleto | 🔴 P1 |
| `ai_agents.py` | 600+ | 44 except genéricos, OCR sin error handling | 🔴 P1 |
| `employees.py` | 400+ | Type mismatches, validaciones incompletas | 🔴 P2 |
| `admin.py` | 300+ | 2 TODOs, response_models faltando | 🟠 P3 |
| `requests.py` | 280+ | Validación incompleta, pass statements | 🟠 P3 |
| `apartments_v2.py` | 500+ | ✅ Bien implementado | - |
| `yukyu.py` | 400+ | ✅ Bien implementado | - |
| `auth.py` | 200+ | ✅ Correcto | - |

## TODOs Sin Implementar (7)

```python
# 1️⃣ payroll.py:769
# TODO: Implementar cálculo de nómina desde timercards
@router.post("/calculate-from-timercards")
async def calculate_payroll_from_timercards(...):
    return {"status": "not_implemented"}

# 2️⃣ admin.py:245
# TODO: Implementar auditoría de cambios
@router.post("/audit-log")
async def get_audit_log(...):
    return []  # Vacío

# 3️⃣ requests.py:120
# TODO: Validar workflow de aprobación
def validate_approval_workflow(...):
    pass  # Sin implementación

# 4️⃣ reports.py:89
# TODO: PDF export functionality
@router.get("/export-pdf")
async def export_pdf(...):
    # Solo JSON, no PDF
    pass

# 5️⃣ apartments.py:340
# TODO: Calcular arrears automáticamente
def calculate_arrears(...):
    pass  # Sin implementación

# 6️⃣ ai_agents.py:200
# TODO: Mejorar extracción de datos OCR
def extract_resume_data(...):
    # accuracy: 70%, debería ser 90%+
    pass

# 7️⃣ salaries.py:456
# TODO: Soporte para múltiples monedas
def convert_salary(...):
    # Solo JPY
    pass
```

## Veredicto Backend

```
Estado: ⚠️ 7.8/10 - REFACTORIZACIÓN URGENTE

Lo que funciona bien:
✅ 269 endpoints bien distribuidos
✅ 27 modelos SQLAlchemy coherentes
✅ Autenticación JWT correcta
✅ Rate limiting (slowapi) implementado
✅ Base de datos bien normalizada
✅ Middleware de seguridad presentes

Lo que está roto:
❌ 125 exception handlers genéricos (125 bloques)
❌ 5 type mismatches Frontend-Backend
❌ 7 TODOs sin implementar
❌ Lógica incompleta en endpoints críticos
❌ Validaciones incompletas en schemas
❌ Sin response_models en algunos routers

TIEMPO DE FIXES:
- Críticos:     3 horas
- Altos:        6-8 horas
- Medios:       3-4 horas
- Total:        19-29 horas

ACCIONES INMEDIATAS:
1. Factory_id type validator (30 min)
2. Payroll endpoint implementation (2-3h)
3. Exception handling refactor (4-6h)
4. Response model standardization (2h)
5. Implementar 7 TODOs (5-6h)
```

---

# 5️⃣ INFRAESTRUCTURA (Docker & Config)

## Problemas Críticos de Seguridad (Bloquean Producción)

### 🔴 P1: `.env.production` en Git (CRÍTICA)

**Ubicación**: `.env.production` - COMMITEADO EN GIT

```bash
# PROBLEMA:
# El archivo .env.production está en git con valores reales
# Cualquiera que clone el repo tiene acceso a:
# - DATABASE_PASSWORD
# - SECRET_KEY
# - API_KEYS (Azure, OpenAI, etc.)
# - CREDENCIALES

# CONSECUENCIAS:
# ❌ Acceso no autorizado a BD
# ❌ Hackeos de API externa
# ❌ Fuga de datos sensibles
# ❌ VIOLACIÓN DE SEGURIDAD CRÍTICA

# SOLUCIÓN INMEDIATA (5 minutos):
git rm --cached .env.production
echo ".env.production" >> .gitignore
git commit -m "Remove production env from version control - SECURITY FIX"

# Luego regenerar SECRET_KEY:
python -c "import secrets; print('SECRET_KEY=' + secrets.token_hex(32))"
```

---

### 🔴 P2: CORS Wildcard en Nginx (CRÍTICA)

**Ubicación**: `docker/conf.d/default.conf:29`

```nginx
# ACTUAL (INSECURO):
add_header 'Access-Control-Allow-Origin' '*';  # ❌ CUALQUIER ORIGEN
add_header 'Access-Control-Allow-Methods' 'GET, POST, PUT, DELETE, OPTIONS';
add_header 'Access-Control-Allow-Headers' '*';
add_header 'Access-Control-Allow-Credentials' 'true';  # ❌ + credentials = PROBLEMA

# PROBLEMA:
# ❌ Permite XSS desde cualquier dominio
# ❌ Permite CSRF attacks
# ❌ Con credentials:true, agrega credenciales automáticamente
# ❌ Combinar "*" + credentials = no válido en navegadores (pero backend lo permite)

# SOLUCIÓN (segura):
set $cors_origin "";
if ($http_origin ~* ^https?://(localhost|domain\.com|app\.domain\.com)$) {
    set $cors_origin $http_origin;
}

add_header 'Access-Control-Allow-Origin' $cors_origin always;
add_header 'Access-Control-Allow-Methods' 'GET, POST, PUT, DELETE, OPTIONS' always;
add_header 'Access-Control-Allow-Headers' 'Content-Type, Authorization' always;
add_header 'Access-Control-Allow-Credentials' 'true' always;
```

---

### 🔴 P3: SSL/HTTPS No Configurado (CRÍTICA)

**Ubicación**: `docker/nginx.conf:227-244` - COMENTADO

```nginx
# ACTUAL (COMENTADO - NO ACTIVO):
# server {
#     listen 443 ssl http2;
#     ssl_certificate /etc/nginx/ssl/cert.pem;
#     ssl_certificate_key /etc/nginx/ssl/key.pem;
# }

# PROBLEMA:
# ❌ TODO en HTTP plaintext
# ❌ Tokens JWT transmitidos sin encripción
# ❌ Credenciales de usuario visibles en red
# ❌ NO CUMPLE GDPR/HIPAA/PCI-DSS
# ❌ NO LISTO PARA PRODUCCIÓN

# SOLUCIÓN (con Let's Encrypt):
# 1. Usar certbot para generar certificados
# 2. Auto-renew con cron job
# 3. Redirigir HTTP → HTTPS

docker run -it --rm -v /etc/letsencrypt:/etc/letsencrypt \
  certbot/certbot certonly --standalone \
  -d domain.com -d www.domain.com

# 2. En docker-compose: mapear /etc/letsencrypt
volumes:
  - /etc/letsencrypt:/etc/nginx/ssl:ro

# 3. En nginx.conf:
server {
    listen 80;
    return 301 https://$server_name$request_uri;  # Redirigir HTTPS
}

server {
    listen 443 ssl http2;
    ssl_certificate /etc/nginx/ssl/live/domain.com/fullchain.pem;
    ssl_certificate_key /etc/nginx/ssl/live/domain.com/privkey.pem;

    # SSL moderno
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;
    ssl_prefer_server_ciphers on;
}
```

---

### 🔴 P4: Puertos Sensibles Expuestos (CRÍTICA)

**Ubicación**: `docker-compose.yml` - múltiples líneas

```yaml
# ACTUAL (EXPUESTO):
services:
  db:
    ports:
      - "5432:5432"  # ❌ PostgreSQL visible en localhost:5432

  redis:
    ports:
      - "6379:6379"  # ❌ Redis visible sin autenticación

  adminer:
    ports:
      - "8080:8080"  # ❌ GUI de BD sin autenticación

  prometheus:
    ports:
      - "9090:9090"  # ❌ Métricas públicas

# PROBLEMA:
# ❌ Cualquiera en la red puede:
#    - Conectarse a BD
#    - Leer todos los datos
#    - Modificar/borrar información
# ❌ En producción = DESASTRE

# SOLUCIÓN:
# NO exponer en docker-compose.yml
# Solo comunicación interna entre servicios

services:
  db:
    # NO INCLUIR ports: - solo internal
    # Backend conecta por hostname interno "db:5432"
    expose:
      - "5432"

  redis:
    # NO INCLUIR ports: - solo internal
    expose:
      - "6379"

  adminer:
    # REMOVER completamente en producción
    # O si es necesario: proteger con nginx + auth
    ports:
      - "127.0.0.1:8080:8080"  # Solo localhost
```

---

## Problemas Altos

### 🟠 P5: Prometheus & Grafana sin Autenticación

**Ubicación**: `docker-compose.yml` líneas 436-481

```yaml
prometheus:
  ports:
    - "9090:9090"  # ❌ Acceso público a TODAS las métricas

grafana:
  ports:
    - "3001:3001"  # ❌ Acceso público a dashboards
  environment:
    GF_SECURITY_ADMIN_PASSWORD: admin123  # ❌ Contraseña default
```

**Solución**:
```nginx
# En docker/nginx.conf - proteger con basic auth
location /prometheus/ {
    auth_basic "Prometheus Access";
    auth_basic_user_file /etc/nginx/.prometheus_passwd;
    proxy_pass http://prometheus:9090/;
}

location /grafana/ {
    # Cambiar contraseña Grafana default
    # O proteger con auth corporativa (LDAP/OAuth)
    proxy_pass http://grafana:3000/;
}

# Generar .prometheus_passwd:
htpasswd -c /etc/nginx/.prometheus_passwd admin
```

---

### 🟠 P6: Redis sin Contraseña

**Ubicación**: `docker-compose.yml:74`

```yaml
redis:
  command: redis-server --maxmemory 256mb --maxmemory-policy allkeys-lru
  # ❌ SIN requirepass - acceso abierto

# SOLUCIÓN:
command: redis-server --requirepass ${REDIS_PASSWORD} --maxmemory 256mb...

# Y en config.py:
REDIS_URL = "redis://:password@redis:6379/0"
```

---

### 🟠 P7: Database Password en Shell Commands

**Ubicación**: `backend/scripts/resilient_importer.py:92`

```python
# ACTUAL (INSECURO):
os.system(f"PGPASSWORD={POSTGRES_PASSWORD} psql -h {db_host}...")

# PROBLEMA:
# ❌ `PGPASSWORD=contraseña` visible en:
#    - docker logs
#    - `ps aux` listing
#    - shell history
#    - proceso memory

# SOLUCIÓN: Usar .pgpass
# ~/.pgpass:
# localhost:5432:database:user:password

# Y luego:
import subprocess
subprocess.run(["psql", "-h", db_host, ...])  # Lee de .pgpass automáticamente
```

---

## Problemas Medios

### 🟡 P8: Backend Corre como Root en Docker

**Ubicación**: `docker/Dockerfile.backend:6-38`

```dockerfile
# ACTUAL:
FROM python:3.11-slim
# ... instala paquetes ...
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0"]
# ❌ Corre como root (uid 0)

# PROBLEMA:
# Si app es comprometida, acceso total al contenedor
# Escalamiento de privilegios

# SOLUCIÓN:
FROM python:3.11-slim

# Crear usuario no-root
RUN groupadd -r appuser && \
    useradd -r -g appuser appuser

# ... instala paquetes ...
# ... copia código ...

# Cambiar permisos
RUN chown -R appuser:appuser /app

# Cambiar usuario
USER appuser

CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0"]
```

---

### 🟡 P9: npm install --legacy-peer-deps en Frontend

**Ubicación**: `docker/Dockerfile.frontend:15`

```dockerfile
# ACTUAL:
RUN npm install --legacy-peer-deps
# ❌ Ignora conflictos de versiones
# ❌ Oculta problemas de dependencias
# ❌ Puede romper en actualización

# MEJOR: Resolver root cause
# npm update (compatible versions)
# O ajustar package.json
```

---

### 🟡 P10: DEBUG Logging en Producción

**Ubicación**: `backend/app/core/config.py:161`

```python
# ACTUAL:
DEBUG: bool = os.getenv("DEBUG", "false")

# PROBLEMA:
# Si DEBUG=true en producción:
# ❌ Stack traces completos expuestos
# ❌ Variables locales en traceback
# ❌ Información sensible revelada

# VERIFICACIÓN:
# En .env.production DEBE tener:
DEBUG=false

# Y en FastAPI:
if not DEBUG:
    app = FastAPI(docs_url=None, redoc_url=None)
    # Ocultar swagger/redoc en producción
```

---

## Checklist de Configuración

```
┌─────────────────────────────────────────────────────┐
│ ESTADO DE SEGURIDAD - PRODUCCIÓN READINESS         │
├─────────────────────────────────────────────────────┤
│ CRÍTICOS (Bloquean deployment):                    │
│ ❌ P1 - .env.production en git                     │
│ ❌ P2 - CORS wildcard * en nginx                   │
│ ❌ P3 - SSL/HTTPS no configurado                   │
│ ❌ P4 - Puertos sensibles (5432, 6379) expuestos   │
│                                                     │
│ ALTOS (Hacer antes de producción):                 │
│ ❌ P5 - Prometheus/Grafana sin auth                │
│ ❌ P6 - Redis sin contraseña                       │
│ ❌ P7 - DB password en shell commands              │
│                                                     │
│ MEDIOS (Mejorar cuando sea posible):               │
│ ⚠️  P8 - Backend corre como root                    │
│ ⚠️  P9 - npm legacy-peer-deps                       │
│ ⚠️  P10 - DEBUG logging posible                     │
│                                                     │
│ BIEN IMPLEMENTADO:                                  │
│ ✅ Health checks en todos servicios                │
│ ✅ JWT con HS256                                    │
│ ✅ Rate limiting con slowapi                        │
│ ✅ COOKIE_HTTPONLY = true                          │
│ ✅ .gitignore protege .env                         │
│ ✅ Docker logging centralizado                     │
└─────────────────────────────────────────────────────┘
```

---

# 6️⃣ EL PLAN MAESTRO (Tus Órdenes)

## Estructura del Plan

Divido el trabajo en **3 FASES** basadas en urgencia y impacto:

- 🔥 **FASE 1**: Apagar fuegos (errores que rompen la app)
- 🛠️ **FASE 2**: Mecánica (endpoints rotos, validaciones)
- 🧹 **FASE 3**: Estética y orden (limpieza, refactorización)

---

## 🔥 FASE 1: APAGAR FUEGOS (2-3 horas)

### Objetivo
Que la app arranque y funcione sin errores críticos.

### Tarea 1.1: Remover `.env.production` de Git (5 min) 🚨
**Urgencia**: CRÍTICA

```bash
# Paso 1: Remover del historio git
git rm --cached .env.production
git commit -m "🔒 SECURITY: Remove production env from version control"

# Paso 2: Agregar a .gitignore
echo ".env.production" >> .gitignore
git add .gitignore
git commit -m "chore: Add .env.production to gitignore"

# Paso 3: Verificar que no está en git
git ls-files | grep .env.production
# Debe devolver vacío

# Paso 4: Regenerar SECRET_KEY
python3 -c "import secrets; print('SECRET_KEY=' + secrets.token_hex(32))"
# Copiar valor a .env.production (en máquina de producción, NO en git)
```

**Verificación**:
```bash
git log --all --full-history -- .env.production
# Si devuelve commits, limpiar con git filter-branch o BFG
```

---

### Tarea 1.2: Fijar CORS en Nginx (30 min) 🚨
**Urgencia**: CRÍTICA

**Archivo**: `docker/conf.d/default.conf`

```nginx
# ANTES (línea 29):
add_header 'Access-Control-Allow-Origin' '*';

# DESPUÉS:
# 1. Define variable con origen permitido
set $cors_origin "";
if ($http_origin ~* ^https?://(localhost:3000|localhost:3001|domain\.com|app\.domain\.com)$) {
    set $cors_origin $http_origin;
}

# 2. Usa variable en header
add_header 'Access-Control-Allow-Origin' $cors_origin always;
add_header 'Access-Control-Allow-Credentials' 'true' always;
add_header 'Access-Control-Allow-Methods' 'GET, POST, PUT, DELETE, OPTIONS' always;
add_header 'Access-Control-Allow-Headers' 'Content-Type, Authorization' always;

# 3. Handle preflight
if ($request_method = 'OPTIONS') {
    add_header 'Access-Control-Max-Age' 1728000;
    add_header 'Content-Type' 'text/plain charset=UTF-8';
    add_header 'Content-Length' 0;
    return 204;
}
```

**Verificación**:
```bash
docker-compose restart nginx
curl -H "Origin: http://localhost:3000" \
  -H "Access-Control-Request-Method: POST" \
  -X OPTIONS http://localhost/api/health

# Debe devolver header Access-Control-Allow-Origin: http://localhost:3000
```

---

### Tarea 1.3: Implementar SSL/HTTPS (45 min) 🚨
**Urgencia**: CRÍTICA

#### Opción A: Desarrollo Local (Self-signed)
```bash
# 1. Generar certificado auto-firmado
mkdir -p docker/ssl
openssl req -x509 -newkey rsa:4096 -nodes \
  -out docker/ssl/cert.pem \
  -keyout docker/ssl/key.pem \
  -days 365 \
  -subj "/CN=localhost"

# 2. En docker-compose.yml, mapear volumen:
nginx:
  volumes:
    - ./docker/ssl:/etc/nginx/ssl:ro

# 3. En docker/nginx.conf:
server {
    listen 80;
    server_name localhost;
    return 301 https://$server_name$request_uri;  # Redirigir HTTPS
}

server {
    listen 443 ssl http2 default_server;
    server_name localhost;

    ssl_certificate /etc/nginx/ssl/cert.pem;
    ssl_certificate_key /etc/nginx/ssl/key.pem;
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;
    ssl_prefer_server_ciphers on;

    # ... resto de config ...
}
```

#### Opción B: Producción (Let's Encrypt)
```bash
# 1. Instalar certbot
sudo apt-get install certbot python3-certbot-nginx

# 2. Generar certificados
sudo certbot certonly --standalone \
  -d domain.com -d www.domain.com \
  --email admin@domain.com

# 3. En docker-compose.yml:
volumes:
  - /etc/letsencrypt:/etc/nginx/ssl:ro

# 4. Configurar auto-renew
echo "0 0 1 * * certbot renew --quiet" | sudo crontab -
```

**En docker/nginx.conf**:
```nginx
server {
    listen 80 default_server;
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2 default_server;
    ssl_certificate /etc/nginx/ssl/live/domain.com/fullchain.pem;
    ssl_certificate_key /etc/nginx/ssl/live/domain.com/privkey.pem;
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers ECDHE-RSA-AES128-GCM-SHA256:HIGH:!aNULL:!MD5;
    ssl_prefer_server_ciphers on;

    # ... resto ...
}
```

---

### Tarea 1.4: Desexponer Puertos Sensibles (20 min) 🚨
**Urgencia**: CRÍTICA

**Archivo**: `docker-compose.yml`

```yaml
# ANTES (INCORRECTO):
postgres:
  ports:
    - "5432:5432"  # ❌ Expuesto

redis:
  ports:
    - "6379:6379"  # ❌ Expuesto

adminer:
  ports:
    - "8080:8080"  # ❌ Sin auth

prometheus:
  ports:
    - "9090:9090"  # ❌ Métricas públicas

# DESPUÉS (CORRECTO):
postgres:
  # NO ports: - solo expose para red interna
  expose:
    - "5432"
  environment:
    POSTGRES_INITDB_ARGS: "-c shared_preload_libraries=pg_stat_statements"

redis:
  expose:
    - "6379"
  command: redis-server --requirepass ${REDIS_PASSWORD}

adminer:
  # REMOVER en producción, O proteger con nginx auth
  profiles: ["dev"]  # Solo en desarrollo
  ports:
    - "127.0.0.1:8080:8080"  # Solo localhost

prometheus:
  expose:
    - "9090"
  # Backend conecta por hostname interno: http://prometheus:9090
```

**Verificación**:
```bash
docker-compose up -d
netstat -tlnp | grep -E '5432|6379|8080|9090'

# Debe estar vacío (puertos no expuestos)
# Para conectar desde host, usar docker-compose exec:
docker-compose exec postgres psql -U postgres
```

---

### Resumen FASE 1

```
✅ Tarea 1.1: Remover .env.production de git        [5 min]
✅ Tarea 1.2: Fijar CORS en nginx                   [30 min]
✅ Tarea 1.3: Implementar SSL/HTTPS                 [45 min]
✅ Tarea 1.4: Desexponer puertos sensibles          [20 min]
────────────────────────────────────────────────────
⏱️  TOTAL FASE 1: ~2 horas
```

**Después de FASE 1**:
- ✅ App arranca sin errores de seguridad
- ✅ Comunicación encriptada (HTTPS)
- ✅ CORS configurado correctamente
- ✅ Secretos no expuestos

---

## 🛠️ FASE 2: MECÁNICA (6-8 horas)

### Objetivo
Que todos los endpoints funcionen y no haya conflictos Frontend-Backend.

### Tarea 2.1: Fijar Type Mismatches (1 hora) 🔴

#### Problema: factory_id validation

**Archivo**: `backend/app/schemas/employee.py`

```python
# ANTES:
class EmployeeCreate(BaseModel):
    factory_id: int
    # Sin validación específica

# DESPUÉS:
from pydantic import Field, field_validator

class EmployeeCreate(BaseModel):
    factory_id: int = Field(
        ...,
        gt=0,  # > 0
        description="ID de la fábrica/cliente"
    )

    @field_validator('factory_id')
    @classmethod
    def validate_factory_id(cls, v):
        if not isinstance(v, int) or v <= 0:
            raise ValueError('factory_id debe ser número positivo')
        return v

    class Config:
        json_schema_extra = {
            "example": {
                "factory_id": 1,
                "first_name": "太郎",
                "last_name": "田中"
            }
        }
```

#### Problema: employee_id vs jikyu_id

**Archivo**: `backend/app/schemas/employee.py` + `backend/app/api/employees.py`

```python
# Revisar todas las referencias
# Buscar "jikyu_id" - reemplazar con "employee_id" consistentemente
grep -r "jikyu_id" backend/app/

# En schemas, consolidar:
class EmployeeResponse(BaseModel):
    id: int = Field(..., alias="employee_id")  # Frontend ve employee_id

    class Config:
        populate_by_name = True  # Acepta ambos employee_id e id
```

#### Problema: base_hourly_rate vs jikyu

**Archivo**: `backend/app/schemas/salary.py`

```python
# ANTES:
class SalarySchema(BaseModel):
    jikyu: float  # ❌ Nombre confuso

# DESPUÉS:
class SalarySchema(BaseModel):
    base_hourly_rate: float = Field(..., description="基本時給 (Tasa base por hora)")

    # Para compatibilidad con código antiguo:
    @field_validator('base_hourly_rate', mode='before')
    @classmethod
    def convert_from_jikyu(cls, v):
        if isinstance(v, dict) and 'jikyu' in v:
            return v['jikyu']
        return v
```

**Test**:
```bash
curl -X POST http://localhost:8000/api/employees \
  -H "Content-Type: application/json" \
  -d '{
    "factory_id": 1,
    "first_name": "太郎",
    "base_hourly_rate": 1500
  }'

# Debe devolver 200 OK con los datos guardados
```

---

### Tarea 2.2: Implementar Payroll Endpoint (2-3 horas) 🔴

**Archivo**: `backend/app/api/payroll.py:769`

```python
from datetime import datetime, date
from sqlalchemy import and_, func
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
import logging

logger = logging.getLogger(__name__)

class PayrollCalculationRequest(BaseModel):
    employee_id: int
    start_date: date
    end_date: date
    factory_id: int

class PayrollResponse(BaseModel):
    id: int
    employee_id: int
    period_start: date
    period_end: date
    regular_hours: float
    overtime_hours: float
    gross_salary: float
    deductions: float
    net_salary: float

    class Config:
        from_attributes = True

@router.post("/calculate-from-timercards")
async def calculate_payroll_from_timercards(
    request: PayrollCalculationRequest,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    """
    Calcular nómina desde timecards para período específico
    """
    try:
        # 1. Validar que empleado existe
        employee = db.query(Employee).filter(
            Employee.id == request.employee_id,
            Employee.factory_id == request.factory_id
        ).first()

        if not employee:
            raise HTTPException(
                status_code=404,
                detail=f"Empleado {request.employee_id} no encontrado"
            )

        # 2. Obtener timercards del período
        timercards = db.query(TimeCard).filter(
            and_(
                TimeCard.employee_id == request.employee_id,
                TimeCard.date >= request.start_date,
                TimeCard.date <= request.end_date
            )
        ).all()

        if not timercards:
            raise HTTPException(
                status_code=400,
                detail=f"Sin timercards para {request.start_date} - {request.end_date}"
            )

        # 3. Calcular horas totales
        regular_hours = sum(tc.regular_hours or 0 for tc in timercards)
        overtime_hours = sum(tc.overtime_hours or 0 for tc in timercards)

        # 4. Obtener tasas salariales
        hourly_rate = employee.base_hourly_rate or 0
        overtime_multiplier = 1.5  # 150% para horas extra

        # 5. Calcular salario bruto
        gross_salary = (
            (regular_hours * hourly_rate) +
            (overtime_hours * hourly_rate * overtime_multiplier)
        )

        # 6. Obtener deducciones (impuestos, seguro, etc.)
        salary_deductions = db.query(SalaryDeduction).filter(
            SalaryDeduction.employee_id == request.employee_id
        ).all()

        total_deductions = sum(
            (gross_salary * (sd.percentage or 0) / 100) + (sd.fixed_amount or 0)
            for sd in salary_deductions
        )

        # 7. Calcular salario neto
        net_salary = gross_salary - total_deductions

        # 8. Crear registro de nómina
        payroll = Payroll(
            employee_id=request.employee_id,
            factory_id=request.factory_id,
            period_start=request.start_date,
            period_end=request.end_date,
            regular_hours=regular_hours,
            overtime_hours=overtime_hours,
            gross_salary=gross_salary,
            deductions=total_deductions,
            net_salary=net_salary,
            status="calculated",
            created_by=current_user.id,
            created_at=datetime.utcnow()
        )

        db.add(payroll)
        db.commit()
        db.refresh(payroll)

        logger.info(
            f"Payroll calculated: employee={request.employee_id}, "
            f"period={request.start_date}-{request.end_date}, "
            f"gross={gross_salary}, net={net_salary}"
        )

        return PayrollResponse.from_orm(payroll)

    except ValueError as e:
        logger.warning(f"Validation error in payroll calculation: {e}")
        raise HTTPException(status_code=400, detail=str(e))
    except SQLAlchemyError as e:
        logger.error(f"Database error in payroll calculation: {e}")
        raise HTTPException(status_code=500, detail="Error en base de datos")
    except Exception as e:
        logger.exception(f"Unexpected error in payroll calculation: {e}")
        raise HTTPException(status_code=500, detail="Error inesperado")
```

**Test**:
```bash
curl -X POST http://localhost:8000/api/payroll/calculate-from-timercards \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "employee_id": 1,
    "factory_id": 1,
    "start_date": "2025-11-01",
    "end_date": "2025-11-30"
  }'

# Debe devolver 200 con estructura PayrollResponse
```

---

### Tarea 2.3: Refactorizar Exception Handling (4-6 horas) 🔴

Este es un problema grande: 125 `except Exception as e` bloques genéricos.

#### Paso 1: Crear Custom Exceptions

**Archivo**: `backend/app/core/exceptions.py` (NUEVO)

```python
from fastapi import HTTPException
import logging

logger = logging.getLogger(__name__)

# Excepciones de negocio
class PayrollCalculationError(Exception):
    """Error en cálculo de nómina"""
    pass

class ValidationError(Exception):
    """Error de validación de datos"""
    pass

class ResourceNotFoundError(Exception):
    """Recurso no encontrado"""
    pass

class UnauthorizedError(Exception):
    """No autorizado"""
    pass

class ExternalServiceError(Exception):
    """Error de servicio externo (API)"""
    pass

# Handler para convertir a HTTPException
def handle_business_exception(e: Exception):
    """Convierte excepciones de negocio a HTTPException"""

    if isinstance(e, ValidationError):
        logger.warning(f"Validation error: {e}")
        return HTTPException(status_code=400, detail=str(e))

    elif isinstance(e, ResourceNotFoundError):
        logger.warning(f"Resource not found: {e}")
        return HTTPException(status_code=404, detail=str(e))

    elif isinstance(e, UnauthorizedError):
        logger.warning(f"Unauthorized: {e}")
        return HTTPException(status_code=401, detail="Unauthorized")

    elif isinstance(e, ExternalServiceError):
        logger.error(f"External service error: {e}")
        return HTTPException(status_code=503, detail="External service unavailable")

    elif isinstance(e, PayrollCalculationError):
        logger.error(f"Payroll calculation error: {e}")
        return HTTPException(status_code=500, detail="Error calculating payroll")

    else:
        logger.exception(f"Unexpected error: {e}")
        return HTTPException(status_code=500, detail="Internal server error")
```

#### Paso 2: Reemplazar try-except genéricos

**Antes**:
```python
@router.post("/calculate")
async def calculate(request: PayrollRequest, db: Session = Depends(get_db)):
    try:
        # ... lógica ...
    except Exception as e:  # ❌ GENÉRICO
        return {"error": str(e)}
```

**Después**:
```python
@router.post("/calculate")
async def calculate(request: PayrollRequest, db: Session = Depends(get_db)):
    try:
        # Validar input
        if request.employee_id <= 0:
            raise ValidationError("employee_id debe ser positivo")

        # Buscar empleado
        employee = db.query(Employee).get(request.employee_id)
        if not employee:
            raise ResourceNotFoundError(f"Empleado {request.employee_id} no existe")

        # Calcular
        result = calculate_payroll(employee, request)

        return result

    except (ValidationError, ResourceNotFoundError, PayrollCalculationError) as e:
        raise handle_business_exception(e)
    except SQLAlchemyError as e:
        logger.error(f"Database error: {e}")
        raise HTTPException(status_code=500, detail="Database error")
    except requests.RequestException as e:
        logger.error(f"External API error: {e}")
        raise HTTPException(status_code=503, detail="External service error")
    except Exception as e:
        logger.exception(f"Unexpected error: {e}")
        raise HTTPException(status_code=500, detail="Internal server error")
```

#### Paso 3: Automatizar reemplazo

Usar script de búsqueda/reemplazo:
```bash
# Buscar todos los archivos con "except Exception"
grep -r "except Exception" backend/app/api/*.py

# Para cada archivo encontrado:
# 1. Identificar el contexto
# 2. Reemplazar con excepciones específicas
# 3. Agregar logging apropiado
```

**Plan de ataque**:
- `ai_agents.py`: 44 bloques genéricos → Específicas para OCR/API/BD
- `payroll.py`: 44 bloques genéricos → Específicas para cálculos/validación
- `requests.py`: 3 bloques → Específicas para workflows
- Otros: ~34 bloques diseminados

**Tiempo estimado**: 4-6 horas (½ hora por 15-20 bloques)

---

### Tarea 2.4: Response Models Estándar (1 hora)

Crear wrapper estándar para responses:

**Archivo**: `backend/app/core/response.py` (NUEVO)

```python
from typing import Generic, TypeVar, Optional, List, Any
from pydantic import BaseModel

T = TypeVar('T')

class PaginatedResponse(BaseModel, Generic[T]):
    """Wrapper para respuestas paginadas"""
    data: List[T]
    total: int
    page: int
    per_page: int
    pages: int

    class Config:
        json_schema_extra = {
            "example": {
                "data": [...],
                "total": 100,
                "page": 1,
                "per_page": 10,
                "pages": 10
            }
        }

class SingleResponse(BaseModel, Generic[T]):
    """Wrapper para respuesta de un solo objeto"""
    data: T

    class Config:
        json_schema_extra = {
            "example": {
                "data": {...}
            }
        }

class ListResponse(BaseModel, Generic[T]):
    """Wrapper para lista simple"""
    data: List[T]

    class Config:
        json_schema_extra = {
            "example": {
                "data": [...]
            }
        }
```

**Uso en routers**:
```python
@router.get("/employees", response_model=PaginatedResponse[EmployeeResponse])
async def list_employees(
    skip: int = 0,
    limit: int = 10,
    db: Session = Depends(get_db)
):
    total = db.query(Employee).count()
    items = db.query(Employee).offset(skip).limit(limit).all()

    return PaginatedResponse(
        data=[EmployeeResponse.from_orm(item) for item in items],
        total=total,
        page=skip // limit + 1,
        per_page=limit,
        pages=(total + limit - 1) // limit
    )
```

---

### Tarea 2.5: Implementar TODOs Backend (2-3 horas)

Hay 7 TODOs en backend que deben implementarse:

1. **Audit logging** (`admin.py:245`) - 30 min
2. **Approval workflow validation** (`requests.py:120`) - 45 min
3. **PDF export** (`reports.py:89`) - 1 hora
4. **Auto calculate arrears** (`apartments.py:340`) - 30 min
5. **Improve OCR extraction** (`ai_agents.py:200`) - 1 hora
6. **Multi-currency support** (`salaries.py:456`) - 45 min
7. **Factory audit trail** (agregado) - 30 min

Para cada TODO, crear issue en GitHub y asignar a sprints de trabajo.

---

### Resumen FASE 2

```
✅ Tarea 2.1: Fijar type mismatches (factory_id, employee_id, jikyu)
✅ Tarea 2.2: Implementar payroll endpoint completo
✅ Tarea 2.3: Refactorizar 125 exception handlers genéricos
✅ Tarea 2.4: Crear response models estándar
✅ Tarea 2.5: Implementar 7 TODOs backend
────────────────────────────────────────────────────────────
⏱️  TOTAL FASE 2: ~6-8 horas
```

**Después de FASE 2**:
- ✅ Todos los endpoints funcionan
- ✅ Validaciones correctas
- ✅ Manejo de errores robusto
- ✅ API estable y predecible

---

## 🧹 FASE 3: ESTÉTICA Y ORDEN (3-4 horas)

### Objetivo
Limpieza, refactorización, documentación.

### Tarea 3.1: Limpiar Frontend (1 hora)

**Paso 1**: Eliminar páginas vacías
```bash
rm -rf frontend/app/dashboard/themes
rm -rf frontend/app/dashboard/settings
rm -rf frontend/app/dashboard/support

# Remover rutas top-level alternativas
rm -rf frontend/app/employees
rm -rf frontend/app/candidates
rm -rf frontend/app/factories
rm -rf frontend/app/payroll
rm -rf frontend/app/requests
rm -rf frontend/app/timercards
rm -rf frontend/app/apartments
rm -rf frontend/app/admin
rm -rf frontend/app/profile
rm -rf frontend/app/reports
rm -rf frontend/app/settings
rm -rf frontend/app/themes
```

**Paso 2**: Consolidar componentes duplicados
```bash
# Error boundaries - mantener un solo archivo
rm frontend/components/ErrorBoundary.tsx
rm frontend/components/error-boundary-wrapper.tsx
rm frontend/components/theme-error-boundary.tsx

# Apartment selector - mantener genérico
rm frontend/components/apartments/ApartmentSelector-enhanced.tsx

# OCR - consolidar en uno genérico
cat frontend/components/OCRUploader.tsx > frontend/components/AzureOCRUploader.tsx.bak
# Reescribir OCRUploader.tsx para aceptar tipo (azure, tesseract, etc.)
rm frontend/components/AzureOCRUploader.tsx

# Transiciones - usar una sola
rm frontend/components/animated-link.tsx
```

**Paso 3**: Auditar huérfanos
```bash
# Crear script para detectar componentes no usados
grep -r "from.*components/" frontend/app --include="*.tsx" | \
  awk -F':' '{print $2}' | \
  sort -u > /tmp/used_components.txt

ls frontend/components/**/*.tsx | \
  while read f; do
    basename=$(basename "$f")
    if ! grep -q "$basename" /tmp/used_components.txt; then
      echo "🗑️ Huérfano: $f"
    fi
  done

# Para cada huérfano: verificar manualmente, luego borrar si no se usa
```

---

### Tarea 3.2: Implementar TODOs Frontend (1 hora)

#### TODO 1: Yukyu Management

**Archivo**: `frontend/app/dashboard/admin/yukyu-management/page.tsx`

```typescript
// ANTES:
totalUsed: 0,           // TODO: calcular desde requests
totalExpired: 0         // TODO: calcular desde balances

// DESPUÉS:
// Obtener datos reales
const fetchYukyuData = async () => {
    try {
        // 1. Requests activos
        const requestsRes = await yukyuService.getRequests({ status: 'active' });
        const usedCount = requestsRes.data.length;

        // 2. Expirados
        const balancesRes = await yukyuService.getYukyuBalance(employeeId);
        const expiredCount = balancesRes.data.filter(b => b.is_expired).length;

        setYukyuStats({
            totalUsed: usedCount,
            totalExpired: expiredCount
        });
    } catch (error) {
        console.error('Error fetching yukyu data:', error);
    }
};

useEffect(() => {
    fetchYukyuData();
}, []);
```

#### TODO 2: Payroll Context

**Archivo**: `frontend/app/dashboard/payroll/[id]/page.tsx`

```typescript
// ANTES:
approved_by: 'admin',   // TODO: Get from auth context

// DESPUÉS:
const { user } = useAuth();  // Hook existente en stores/authStore.ts

// En el componente:
const approvedBy = user?.id || 'unknown';

// O mejor aún, desde el servidor:
const payrollResponse = await salaryService.getPayroll(id);
// El servidor devuelve approved_by ya completado
```

#### TODO 3: PDF Export

**Archivo**: `frontend/app/dashboard/apartment-reports/arrears/page.tsx`

```typescript
import jsPDF from 'jspdf';
import 'jspdf-autotable';

// ANTES:
// TODO: Implement PDF export

// DESPUÉS:
const handlePdfExport = async () => {
    try {
        const pdf = new jsPDF();

        // Título
        pdf.setFontSize(16);
        pdf.text('Arrears Report', 20, 20);

        // Fecha
        pdf.setFontSize(10);
        pdf.text(`Generated: ${new Date().toLocaleDateString()}`, 20, 30);

        // Tabla
        const columns = ['Apartment', 'Tenant', 'Arrears', 'Since'];
        const rows = arrearsData.map(a => [
            a.apartment_name,
            a.tenant_name,
            `¥${a.arrears_amount.toLocaleString()}`,
            a.arrears_since
        ]);

        (pdf as any).autoTable({
            head: [columns],
            body: rows,
            startY: 40,
            margin: { left: 20, right: 20 },
            styles: { fontSize: 9 },
            headStyles: { fillColor: [41, 128, 185], textColor: 255 }
        });

        // Descargar
        pdf.save(`arrears-${new Date().toISOString().split('T')[0]}.pdf`);
    } catch (error) {
        console.error('Error generating PDF:', error);
        toast.error('Error generating PDF');
    }
};

// En el botón:
<button onClick={handlePdfExport}>📥 Export to PDF</button>
```

**Instalar dependencia**:
```bash
npm install jspdf jspdf-autotable
npm install --save-dev @types/jspdf
```

---

### Tarea 3.3: Documentar API & Actualizar README (1 hora)

#### Archivo: `docs/API.md`

```markdown
# API Documentation

## Endpoints Principales

### Candidatos
- `GET /api/candidates` - Listar candidatos
- `POST /api/candidates` - Crear candidato
- `GET /api/candidates/{id}` - Obtener detalles
- `PUT /api/candidates/{id}` - Actualizar
- `DELETE /api/candidates/{id}` - Eliminar

### Empleados
- `GET /api/employees` - Listar
- `POST /api/employees` - Crear
- `GET /api/employees/{id}` - Detalle
- `PUT /api/employees/{id}` - Actualizar
- `DELETE /api/employees/{id}` - Eliminar

### Nómina (Payroll)
- `GET /api/payroll` - Listar nóminas
- `POST /api/payroll/calculate-from-timercards` - **[NUEVO]** Calcular desde timecards
- `GET /api/payroll/{id}` - Detalle
- `PUT /api/payroll/{id}` - Actualizar
- `POST /api/payroll/{id}/approve` - Aprobar

### Timecards
- `GET /api/timercards` - Listar
- `POST /api/timercards` - Crear registro
- `GET /api/timercards/{id}` - Detalle
- `PUT /api/timercards/{id}` - Actualizar

### Apartamentos
- `GET /api/apartments-v2` - Listar
- `POST /api/apartments-v2` - Crear
- `GET /api/apartments-v2/{id}` - Detalle
- `PUT /api/apartments-v2/{id}` - Actualizar

## Modelos Principales

### EmployeeCreate
```json
{
  "factory_id": 1,
  "first_name": "太郎",
  "last_name": "田中",
  "email": "taro@example.com",
  "base_hourly_rate": 1500,
  "start_date": "2025-01-01"
}
```

### PayrollCalculationRequest
```json
{
  "employee_id": 1,
  "factory_id": 1,
  "start_date": "2025-11-01",
  "end_date": "2025-11-30"
}
```

### PayrollResponse
```json
{
  "id": 1,
  "employee_id": 1,
  "period_start": "2025-11-01",
  "period_end": "2025-11-30",
  "regular_hours": 160,
  "overtime_hours": 10,
  "gross_salary": 250000,
  "deductions": 25000,
  "net_salary": 225000
}
```

## Authentication
Todos los endpoints requieren JWT token en header:
```
Authorization: Bearer <token>
```

## Error Responses
```json
{
  "detail": "Error description"
}
```

Códigos:
- `400` - Bad Request (validación)
- `401` - Unauthorized
- `404` - Not Found
- `500` - Internal Server Error
```

---

### Tarea 3.4: Agregar Tests (1-2 horas)

#### Backend Tests

**Archivo**: `backend/tests/test_payroll.py` (NUEVO)

```python
import pytest
from datetime import date
from app.api.payroll import calculate_payroll_from_timercards
from app.schemas.payroll import PayrollCalculationRequest
from app.models import Employee, TimeCard, Payroll

@pytest.mark.asyncio
async def test_payroll_calculation(db_session, auth_user):
    """Test payroll calculation from timercards"""

    # Setup
    employee = Employee(
        id=1,
        factory_id=1,
        first_name="太郎",
        base_hourly_rate=1500
    )
    db_session.add(employee)

    # Add timercards
    for day in range(1, 21):  # 20 días
        tc = TimeCard(
            employee_id=1,
            date=date(2025, 11, day),
            regular_hours=8,
            overtime_hours=0
        )
        db_session.add(tc)

    db_session.commit()

    # Request
    request = PayrollCalculationRequest(
        employee_id=1,
        factory_id=1,
        start_date=date(2025, 11, 1),
        end_date=date(2025, 11, 30)
    )

    # Execute
    response = await calculate_payroll_from_timercards(
        request=request,
        db=db_session,
        current_user=auth_user
    )

    # Assert
    assert response.employee_id == 1
    assert response.regular_hours == 160  # 20 días * 8 horas
    assert response.gross_salary == 240000  # 160 * 1500
```

#### Frontend Tests

**Archivo**: `frontend/tests/payroll.spec.ts` (NUEVO)

```typescript
import { test, expect } from '@playwright/test';

test.describe('Payroll Management', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('http://localhost:3000/login');
    await page.fill('input[name="email"]', 'admin@test.com');
    await page.fill('input[name="password"]', 'password123');
    await page.click('button[type="submit"]');
    await page.waitForNavigation();
  });

  test('should calculate payroll from timercards', async ({ page }) => {
    await page.goto('http://localhost:3000/dashboard/payroll');

    // Click calculate button
    await page.click('button:has-text("Calculate")');

    // Fill form
    await page.fill('input[name="employee_id"]', '1');
    await page.fill('input[name="start_date"]', '2025-11-01');
    await page.fill('input[name="end_date"]', '2025-11-30');

    // Submit
    await page.click('button:has-text("Calculate Payroll")');

    // Verify success
    await expect(page.locator('text=Payroll calculated successfully')).toBeVisible();

    // Verify data
    await expect(page.locator('text=¥240,000')).toBeVisible();  // Gross
  });
});
```

Run tests:
```bash
# Backend
cd backend
pytest tests/test_payroll.py -v

# Frontend
cd frontend
npm run test:e2e
```

---

### Tarea 3.5: Actualizar .gitignore (10 min)

**Archivo**: `.gitignore`

```
# Environment variables - NUNCA comitear
.env
.env.local
.env.production        # ← Agregado (SECURITY)
.env.*.local

# Secretos
*.pem
*.key
*.p12
*.pfx
docker/ssl/          # Certificados locales

# IDEs
.vscode/
.idea/
*.swp
*.swo

# Node
node_modules/
npm-debug.log
.next/
out/

# Python
__pycache__/
*.py[cod]
*$py.class
venv/
env/
.venv

# Uploads (usuario files)
uploads/*
!uploads/.gitkeep

# OS
.DS_Store
Thumbs.db

# Logs
*.log
logs/
```

---

### Resumen FASE 3

```
✅ Tarea 3.1: Limpiar frontend (eliminar vacíos, duplicados)  [30 min]
✅ Tarea 3.2: Implementar TODOs frontend                       [30 min]
✅ Tarea 3.3: Documentar API y actualizar docs                [30 min]
✅ Tarea 3.4: Agregar tests (backend + e2e)                   [1-2 horas]
✅ Tarea 3.5: Actualizar .gitignore                           [10 min]
────────────────────────────────────────────────────────────
⏱️  TOTAL FASE 3: ~3.5 horas
```

**Después de FASE 3**:
- ✅ Código limpio y organizado
- ✅ Tests cubriendo funcionalidad crítica
- ✅ Documentación actualizada
- ✅ Secretos protegidos

---

# 📋 RESUMEN TEMPORAL COMPLETO

```
┌──────────────────────────────────────────────────────────┐
│                   PLAN MAESTRO - TIMELINE                │
├──────────────────────────────────────────────────────────┤
│                                                          │
│ 🔥 FASE 1: APAGAR FUEGOS                                │
│    ├─ 1.1: Remover .env.production de git     [ 5 min] │
│    ├─ 1.2: Fijar CORS en nginx               [30 min] │
│    ├─ 1.3: Implementar SSL/HTTPS             [45 min] │
│    └─ 1.4: Desexponer puertos sensibles      [20 min] │
│    ═════════════════════════════════════════════════   │
│    ⏱️  SUBTOTAL: ~2 horas                              │
│                                                          │
│ 🛠️  FASE 2: MECÁNICA                                     │
│    ├─ 2.1: Fijar type mismatches              [1 hora] │
│    ├─ 2.2: Implementar payroll endpoint      [2-3h]   │
│    ├─ 2.3: Refactorizar exception handling  [4-6h]   │
│    ├─ 2.4: Response models estándar         [1 hora] │
│    └─ 2.5: Implementar TODOs backend        [2-3h]   │
│    ═════════════════════════════════════════════════   │
│    ⏱️  SUBTOTAL: ~6-8 horas                            │
│                                                          │
│ 🧹 FASE 3: ESTÉTICA Y ORDEN                             │
│    ├─ 3.1: Limpiar frontend                 [30 min] │
│    ├─ 3.2: Implementar TODOs frontend       [30 min] │
│    ├─ 3.3: Documentar API                   [30 min] │
│    ├─ 3.4: Agregar tests                   [1-2h]   │
│    └─ 3.5: Actualizar .gitignore           [10 min] │
│    ═════════════════════════════════════════════════   │
│    ⏱️  SUBTOTAL: ~3.5 horas                            │
│                                                          │
├──────────────────────────────────────────────────────────┤
│ ⏱️  TOTAL: 11.5 - 13.5 horas                             │
│                                                          │
│ Con breaks (cada 90 min): ~14-15 horas de trabajo      │
│ En 2 jornadas intensas: ~2 días completos              │
└──────────────────────────────────────────────────────────┘
```

---

# 🚀 CÓMO USAR ESTE PLAN

## Paso 1: Revisar y Priorizar
Lee las 3 fases. Si necesitas que la app funcione rápido:
- **Mínimo**: Haz FASE 1 (2 horas) → App segura
- **Recomendado**: FASE 1 + FASE 2 (8 horas) → App completamente funcional
- **Completo**: FASE 1 + FASE 2 + FASE 3 (14 horas) → Código listo para mantenimiento

## Paso 2: Trabajar en Orden
Sigue tarea por tarea en el orden especificado. Cada tarea es independiente pero construye sobre las anteriores.

## Paso 3: Testing
Después de cada fase, verifica:
- FASE 1: `docker-compose up` arranca sin errores
- FASE 2: `npm run test` y `pytest tests/` pasan
- FASE 3: `npm run build` compila sin warnings

## Paso 4: Commit & Push
Después de cada FASE, hacer commits:
```bash
git add .
git commit -m "FASE 1: Security hardening - HTTPS, CORS, secrets"
git push -u origin claude/audit-and-fix-plan-014Tkg2haFHvv4YQKA4Pt1v4
```

## Paso 5: Verificación Final
```bash
# Build
docker-compose build

# Tests
npm run test --prefix frontend
pytest tests/ --prefix backend

# Deploy
docker-compose up -d

# Health check
curl https://localhost/api/health
```

---

# 🎯 MÉTRICAS DE ÉXITO

**Después de este plan, deberías tener**:

```
FRONTEND:
✅ 99 → 45 rutas (solo dashboard)
✅ 261 → <100 componentes (huérfanos eliminados)
✅ 4 → 1 error boundary
✅ 0 TODOs sin implementar

BACKEND:
✅ 125 → 0 exception handlers genéricos
✅ 7 → 0 TODOs sin implementar
✅ 5 → 0 type mismatches
✅ 269 endpoints 100% funcionales

SEGURIDAD:
✅ CORS específico (no wildcard)
✅ HTTPS/SSL implementado
✅ Secretos no en git
✅ Puertos sensibles privados
✅ Prometheus/Grafana protegidos

TESTING:
✅ Payroll endpoint covered
✅ E2E tests en lugar clave
✅ Backend tests pasando

DOCUMENTACIÓN:
✅ API.md actualizado
✅ Responses estándarizados
✅ Ejemplos en código
```

---

# 📞 NOTAS FINALES

### Lo que Hicimos Bien 👍
- Arquitectura moderna y escalable
- TypeScript en frontend y type hints en backend
- Testing framework presente
- Observabilidad desde el inicio
- Documentación excelente

### Lo que Necesita Arreglo 🔧
- Frontend muy grande (261 componentes huérfanos)
- Backend con exception handling pobre
- Seguridad no lista para producción
- Secretos cometidos a git

### Riesgo Actual ⚠️
**NO LANZAR A PRODUCCIÓN** sin hacer al menos FASE 1 (seguridad).
Si launchas así:
- Secretos expuestos
- CORS inseguro
- Sin HTTPS
- Datos en plaintext

### Siguiente Paso
1. Comienza con FASE 1 (2 horas)
2. Haz commits a tu rama
3. Avanza a FASE 2 si todo funciona
4. Refina en FASE 3

¡Adelante! 🚀

---

**Documento generado**: 2025-11-19 22:35:50
**Versión**: 1.0
**Estado**: ✅ LISTO PARA IMPLEMENTACIÓN
