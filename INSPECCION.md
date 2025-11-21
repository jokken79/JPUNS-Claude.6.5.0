# 🔍 INSPECCIÓN COMPLETA - UNS-ClaudeJP 6.0.0

**Fecha de análisis**: 2025-11-19
**Versión del proyecto**: 6.0.0
**Total de archivos analizados**: 660+
**Líneas de código**: ~25,000+ (frontend + backend)
**Páginas frontend**: 80+ páginas
**API Routers**: 28 routers especializados
**Modelos de BD**: 1,816 LOC en SQLAlchemy
**Servicios backend**: 20+ servicios especializados
**Componentes React**: 171 componentes reutilizables
**Stores Zustand**: 8 stores de estado global

---

## 📋 TABLA DE CONTENIDOS

1. [Descripción General](#descripción-general)
2. [Estructura de Carpetas](#estructura-de-carpetas)
3. [Frontend](#frontend)
4. [Backend](#backend)
5. [APIs y Endpoints](#apis-y-endpoints)
6. [Mapa de Relaciones](#mapa-de-relaciones)
7. [Problemas y Vulnerabilidades](#problemas-y-vulnerabilidades)
8. [Sugerencias de Mejora](#sugerencias-de-mejora)

---

## 1. DESCRIPCIÓN GENERAL

### ¿Qué es?
**UNS-ClaudeJP 6.0.0** es un sistema integral de gestión de recursos humanos especializado en agencias de staffing japonesas. Gestiona:

- **Candidatos y Empleados** (履歴書/Rirekisho - Currículum, 派遣社員 - Empleados enviados)
- **Fábricas/Clientes** (派遣先 - Destino de envío)
- **Tarjetas de Asistencia** (タイムカード - TimeCard con OCR)
- **Nómina y Salarios** (給与 - Salarios)
- **Apartamentos de Empleados** (Gestión de vivienda)
- **Vacaciones Pagadas** (有給休暇 - Yukyu)
- **Auditoría y Reportes**

### Stack Tecnológico

| Aspecto | Tecnología |
|---------|-----------|
| **Frontend** | Next.js 16, React 19, TypeScript 5.6, TailwindCSS 3.4 |
| **Backend** | FastAPI 0.115, Python 3.11+, PostgreSQL 15, Redis 7 |
| **UI** | Radix UI, Recharts, Framer Motion |
| **Validación** | Zod (frontend), Pydantic 2.0 (backend) |
| **Estado** | Zustand 5.0.8 |
| **Testing** | Playwright 1.56, Vitest 2.1.5 |
| **IA** | OpenAI, Gemini, Anthropic Claude, Zhipu, Azure Vision |
| **Autenticación** | JWT (HS256) |

---

## 2. ESTRUCTURA DE CARPETAS

```
UNS-ClaudeJP-6.0.0/
│
├── 📁 frontend/                                # Next.js 16 + React 19 + TypeScript 5.6
│   ├── app/                                   # 80+ páginas (App Router)
│   │   ├── (dashboard)/                       # Rutas protegidas
│   │   │   ├── apartments/                    # 📋 Gestión de apartamentos (社宅)
│   │   │   ├── candidates/                    # 👤 Candidatos (履歴書) + OCR
│   │   │   ├── employees/                     # 👥 Empleados (派遣社員)
│   │   │   ├── factories/                     # 🏭 Empresas clientes (派遣先)
│   │   │   ├── timercards/                    # ⏱️ Asistencia (タイムカード)
│   │   │   ├── salary/                        # 💰 Salarios (給与)
│   │   │   ├── payroll/                       # 📊 Nómina avanzada
│   │   │   ├── yukyu/                         # 🏖️ Vacaciones (有給休暇)
│   │   │   ├── requests/                      # 📝 Solicitudes
│   │   │   ├── design-system/                 # 🎨 Sistema de diseño
│   │   │   ├── themes/                        # 🌈 12+ temas personalizables
│   │   │   ├── reports/                       # 📈 Reportes PDF
│   │   │   └── [10+ módulos más]              # Admin, monitoring, settings, etc.
│   │   └── public/                            # Público: login, landing
│   │
│   ├── 🧩 components/                         # 171 componentes React reutilizables
│   │   ├── ui/                                # 40+ Radix UI primitivos
│   │   ├── dashboard/                         # 20 dashboard widgets
│   │   ├── apartments/                        # Selectores y formularios
│   │   ├── candidates/                        # Evaluadores y formularios
│   │   ├── payroll/                           # Cálculos y reportes
│   │   └── [15+ carpetas temáticas]           # Organizadas por dominio
│   │
│   ├── 📚 lib/                                # Librerías y utilidades
│   │   ├── api.ts (994 LOC)                   # Cliente Axios + servicios
│   │   ├── api/                               # 10+ servicios (authService, etc.)
│   │   ├── validations/                       # Esquemas Zod
│   │   ├── themes.ts                          # 12+ temas configurables
│   │   ├── utilities/                         # Funciones helper
│   │   └── constants/                         # Constantes globales
│   │
│   ├── 🏪 stores/                             # 8 Zustand stores (estado global)
│   │   ├── auth-store.ts                      # 🔐 Autenticación + JWT
│   │   ├── salary-store.ts                    # 💸 Estado de salarios
│   │   ├── payroll-store.ts                   # 📊 Estado de nómina
│   │   ├── dashboard-tabs-store.ts            # 📑 Navegación tabs
│   │   ├── layout-store.ts                    # 🎛️ Sidebar + theme
│   │   └── [3+ stores más]                    # Fonts, settings, theme custom
│   │
│   ├── 🪝 hooks/                              # 12 custom React hooks
│   │   ├── use-toast.ts                       # Notificaciones
│   │   ├── use-page-visibility.ts             # Visibilidad de página
│   │   ├── use-page-permission.ts             # Control de acceso
│   │   └── [9+ hooks más]                     # Validación, temas, rutas
│   │
│   ├── 🔤 types/                              # TypeScript definitions
│   ├── 🎨 styles/                             # CSS global + config Tailwind
│   ├── 🔌 contexts/                           # React Context (tema, auth)
│   ├── 🛠️ utils/                              # Funciones utilitarias
│   ├── 🖼️ public/                             # Archivos estáticos
│   ├── 🧪 e2e/                                # Tests Playwright
│   ├── ✅ tests/                              # Tests Vitest
│   └── 📄 next.config.js + tsconfig.json     # Configuración
│
├── 📁 backend/                                # FastAPI 0.115.6 + Python 3.11+
│   ├── app/
│   │   ├── 🔗 api/ (28 routers)               # Endpoints REST
│   │   │   ├── auth.py                        # 🔐 Login, registro, JWT
│   │   │   ├── employees.py                   # 👥 Gestión de empleados
│   │   │   ├── candidates.py                  # 👤 Candidatos + OCR
│   │   │   ├── factories.py                   # 🏭 Empresas clientes
│   │   │   ├── timer_cards.py                 # ⏱️ Asistencia
│   │   │   ├── salary.py                      # 💰 Cálculo de salarios
│   │   │   ├── payroll.py                     # 📊 Nómina avanzada
│   │   │   ├── apartments_v2.py               # 📋 Apartamentos + asignaciones
│   │   │   ├── yukyu.py                       # 🏖️ Vacaciones pagadas
│   │   │   ├── requests.py                    # 📝 Solicitudes workflow
│   │   │   ├── admin.py                       # ⚙️ Administración
│   │   │   ├── dashboard.py                   # 📈 Estadísticas
│   │   │   ├── azure_ocr.py                   # 🖼️ OCR integration
│   │   │   ├── ai_agents.py                   # 🤖 Gateway multi-IA
│   │   │   ├── audit.py                       # 📋 Auditoría
│   │   │   ├── notifications.py               # 📧 Email + LINE
│   │   │   ├── contracts.py                   # 📜 Contratos
│   │   │   ├── import_export.py               # 📤 Importación
│   │   │   ├── monitoring.py                  # 🏥 Health checks
│   │   │   └── [8+ routers más]               # Reporting, database, settings, etc.
│   │   │
│   │   ├── 🗄️ models/ (1,816 LOC)            # SQLAlchemy ORM
│   │   │   ├── models.py (1,670 LOC)          # 17+ modelos principales
│   │   │   └── payroll_models.py              # Modelos de nómina
│   │   │
│   │   ├── 🧠 services/ (20+ servicios)       # Lógica de negocio
│   │   │   ├── payroll/                       # 5 servicios nómina
│   │   │   │   ├── payroll_validator.py
│   │   │   │   ├── deduction_calculator.py
│   │   │   │   ├── payslip_generator.py
│   │   │   │   ├── rate_calculator.py
│   │   │   │   └── overtime_calculator.py
│   │   │   ├── yukyu_service.py               # Gestión de vacaciones
│   │   │   ├── ocr_cache_service.py           # Cache OCR
│   │   │   ├── notification_service.py        # Email/LINE
│   │   │   ├── ai_gateway.py                  # Multi-IA gateway
│   │   │   ├── audit_service.py               # Auditoría
│   │   │   └── [12+ servicios más]
│   │   │
│   │   ├── 📋 schemas/                        # Pydantic models (validación)
│   │   ├── ⚙️ core/                           # Configuración core
│   │   │   ├── config.py                      # Variables de entorno
│   │   │   ├── database.py                    # Conexión PostgreSQL
│   │   │   ├── security.py                    # JWT + Bcrypt
│   │   │   ├── deps.py                        # Dependency injection
│   │   │   └── resilience/                    # Circuit breakers
│   │   │
│   │   └── 🛠️ utils/                          # Funciones utilitarias
│   │
│   ├── 🔄 alembic/versions/                   # Migraciones de BD
│   ├── 🧪 tests/                              # Tests unitarios e integración
│   ├── 📁 scripts/                            # Importación de datos
│   ├── main.py                                # Punto de entrada FastAPI
│   └── requirements.txt                       # Dependencias Python (40+)
│
├── 🐳 docker/                                 # Docker & Compose
│   ├── Dockerfile.backend                     # Build backend
│   ├── Dockerfile.frontend                    # Build frontend
│   ├── Dockerfile.importer                    # Inicialización BD
│   ├── docker-compose.yml                     # 6 servicios orquestados
│   └── logging-config.yml                     # Configuración de logs
│
├── 📚 docs/                                   # Documentación exhaustiva
│   ├── 00-START-HERE/                         # Guías iniciales
│   ├── 01-instalacion/                        # Setup y configuración
│   ├── 02-configuracion/                      # BD, migraciones, backups
│   ├── 03-uso/                                # Guías de uso
│   ├── 04-troubleshooting/                    # Solución de problemas
│   ├── 05-devops/                             # Git, GitHub, CI/CD
│   └── 06-agentes/                            # Sistema de agentes IA
│
├── 🛠️ scripts/                                # Scripts de automatización
│   ├── START.bat / STOP.bat                   # Control servicios
│   ├── BACKUP_DATOS.bat                       # Backup automático
│   ├── LOGS.bat                               # Ver logs (menú interactivo)
│   └── [25+ scripts más]                      # Diagnóstico, setup, etc.
│
├── ⚙️ config/                                 # Configuración templates
│   ├── employee_master.xlsm                   # Template Excel
│   └── factories/                             # Config de fábricas
│
├── 💾 BASEDATEJP/                             # Base de datos de demostración
├── 📂 base-datos/                             # Backups y snapshots
├── 📤 uploads/                                # Almacenamiento de archivos
│
├── 🔧 Configuración raíz
│   ├── docker-compose.yml                     # Orquestación 6 servicios
│   ├── .env.example                           # Variables de entorno (ejemplo)
│   ├── .env.production                        # Config producción
│   ├── .claudE.md                             # 🔴 Instrucciones para IAs
│   ├── CLAUDE.md                              # Reglas de desarrollo
│   └── README.md (1,100+ líneas)              # Documentación principal
│
└── 📊 Documentación de análisis
    ├── INSPECCION.md (este archivo)           # Análisis completo
    ├── ANALISIS_APLICACION_RESUMEN.md         # Resumen ejecutivo
    └── RELEASE_NOTES_v6.0.0.md                # Novedades v6.0.0
```

---

## 3. FRONTEND (Next.js 16 + React 19)

### 3.1 Páginas Principales (80+ páginas)

#### 🔐 Autenticación
- `/login` - Página de login con JWT
- `/` - Landing page

#### 📊 Dashboard (Panel Principal)
- `/dashboard` - **Panel principal con widgets**
- `/dashboard/page` - Inicio del dashboard
- `/dashboard/design-system` - 🎨 Sistema de diseño
- `/dashboard/design-preferences` - Preferencias visuales
- `/dashboard/monitoring/` - Monitoreo del sistema
- `/dashboard/monitoring/health/` - Health checks
- `/dashboard/monitoring/performance/` - Métricas de rendimiento

#### 💰 Gestión de Nómina (給与)
- `/dashboard/salary/` - 📋 Listado de salarios
- `/dashboard/salary/reports/` - 📈 Reportes de salarios
- `/dashboard/salary/[id]/` - 📄 Detalle de salario individual

#### 📊 Gestión de Nómina Avanzada (Payroll)
- `/dashboard/payroll/` - Gestión de cálculos
- `/dashboard/payroll/create/` - ➕ Crear cálculo
- `/dashboard/payroll/calculate/` - 🧮 Calcular nómina
- `/dashboard/payroll/yukyu-summary/` - 📊 Resumen vacaciones
- `/dashboard/payroll/settings/` - ⚙️ Configuración
- `/dashboard/payroll/timer-cards/` - Tarjetas relacionadas
- `/dashboard/payroll/[id]/` - Detalle de cálculo

#### 📋 Gestión de Apartamentos (社宅)
- `/dashboard/apartments/` - Listado de apartamentos
- `/dashboard/apartments/create/` - Crear apartamento
- `/dashboard/apartments/search/` - Búsqueda avanzada
- `/dashboard/apartments/[id]/` - Detalle del apartamento
- `/dashboard/apartments/[id]/assign/` - Asignar empleado
- `/dashboard/apartments/[id]/edit/` - Editar información
- `/dashboard/apartment-assignments/` - Listado de asignaciones
- `/dashboard/apartment-assignments/create/` - Crear asignación
- `/dashboard/apartment-assignments/[id]/` - Detalle de asignación
- `/dashboard/apartment-assignments/[id]/end/` - Terminar asignación
- `/dashboard/apartment-assignments/transfer/` - Transferir empleado

#### 📊 Reportes de Apartamentos
- `/dashboard/apartment-reports/` - Centro de reportes
- `/dashboard/apartment-reports/occupancy/` - 📈 Ocupación
- `/dashboard/apartment-reports/arrears/` - 💳 Atrasos de pago
- `/dashboard/apartment-reports/maintenance/` - 🔧 Mantenimiento
- `/dashboard/apartment-reports/costs/` - 💵 Análisis de costos
- `/dashboard/apartment-calculations/` - Cálculos especiales
- `/dashboard/apartment-calculations/prorated/` - Cálculos prorratados
- `/dashboard/apartment-calculations/total/` - Cálculos totales
- `/dashboard/rent-deductions/` - Gestión de descuentos

#### 👤 Gestión de Candidatos (履歴書)
- `/dashboard/candidates/` - 📋 Listado de candidatos
- `/dashboard/candidates/new/` - ➕ Crear nuevo candidato
- `/dashboard/candidates/[id]/` - 👤 Perfil del candidato
- `/dashboard/candidates/[id]/edit/` - ✏️ Editar datos
- `/dashboard/candidates/[id]/print/` - 🖨️ Imprimir CV (Rirekisho)
- `/dashboard/candidates/rirekisho/` - 📄 Gestión de Rirekisho

#### 👥 Gestión de Empleados (派遣社員)
- `/dashboard/employees/` - 📋 Listado de empleados
- `/dashboard/employees/new/` - ➕ Registrar empleado
- `/dashboard/employees/[id]/` - 👤 Perfil del empleado
- `/dashboard/employees/[id]/edit/` - ✏️ Editar datos
- `/dashboard/employees/excel-view/` - 📊 Vista en Excel

#### 🏭 Gestión de Fábricas/Clientes (派遣先)
- `/dashboard/factories/` - 📋 Listado de clientes
- `/dashboard/factories/new/` - ➕ Crear empresa cliente
- `/dashboard/factories/[factory_id]/` - 🏢 Detalle del cliente
- `/dashboard/factories/[factory_id]/config/` - ⚙️ Configuración

#### ⏱️ Asistencia (タイムカード)
- `/dashboard/timercards/` - 📋 Listado de asistencia
- `/dashboard/timercards/upload/` - 📤 Subir PDF con OCR

#### 🏖️ Vacaciones (有給休暇)
- `/dashboard/yukyu/` - 📋 Listado de vacaciones
- `/dashboard/yukyu-history/` - 📜 Historial de vacaciones
- `/dashboard/yukyu-reports/` - 📈 Reportes de vacaciones
- `/dashboard/yukyu-requests/` - 📝 Solicitudes de vacaciones
- `/dashboard/yukyu-requests/create/` - ➕ Crear solicitud
- `/dashboard/additional-charges/` - Cargos adicionales
- `/dashboard/keiri/yukyu-dashboard/` - Dashboard contable

#### 📝 Solicitudes/Workflows (申請)
- `/dashboard/requests/` - 📋 Listado de solicitudes
- `/dashboard/requests/[id]/` - 📄 Detalle de solicitud

#### 🎨 Diseño y Temas
- `/dashboard/themes/` - 🌈 Galería de temas
- `/dashboard/themes/customizer/` - ✏️ Personalizador de temas

#### ⚙️ Administración
- `/dashboard/admin/` - Panel de administración
- `/dashboard/admin/control-panel/` - Control central
- `/dashboard/admin/audit-logs/` - 📋 Logs de auditoría
- `/dashboard/admin/yukyu-management/` - Gestión de vacaciones

#### 🛠️ Configuración y Utilidades
- `/dashboard/settings/` - ⚙️ Configuración general
- `/dashboard/settings/appearance/` - Apariencia
- `/dashboard/profile/` - 👤 Mi perfil
- `/dashboard/help/` - ❓ Ayuda y soporte
- `/dashboard/support/` - 🆘 Centro de soporte
- `/dashboard/reports/` - 📈 Reportes del sistema
- `/dashboard/privacy/` - 🔒 Privacidad
- `/dashboard/terms/` - 📋 Términos de servicio
- `/dashboard/database-management/` - 🗄️ Gestión de BD
- `/dashboard/construction/` - 🚧 En construcción
- `/dashboard/examples/forms/` - 📋 Ejemplos de formularios

#### 📄 Rutas públicas
- `/apartments/` - Apartamentos públicos
- `/candidates/` - Candidatos públicos
- `/employees/` - Empleados públicos
- `/factories/` - Fábricas públicas
- `/payroll/` - Nómina pública
- `/requests/` - Solicitudes públicas
- `/settings/` - Configuración pública
- `/timercards/` - Asistencia pública
- `/reports/` - Reportes públicos
- `/profile/` - Perfil público

### 3.2 Componentes (171 Total)

#### Dashboard (20)
- `header.tsx`, `sidebar.tsx`, `metric-card.tsx`, `stats-chart.tsx`
- `QuickActions.tsx`, `PayrollSummaryCard.tsx`
- `dashboard-header.tsx`, `dashboard-tabs-wrapper.tsx`
- Gráficos: `AreaChartCard.tsx`, `BarChartCard.tsx`, `DonutChartCard.tsx`, `TrendCard.tsx`, `OccupancyChart.tsx`
- Tabs: `ApartmentsTab.tsx`, `EmployeesTab.tsx`, `FinancialsTab.tsx`, `OverviewTab.tsx`, `ReportsTab.tsx`, `YukyuTab.tsx`

#### Apartamentos (8)
- `ApartmentSelector.tsx`, `ApartmentSelector-enhanced.tsx`
- `AssignmentForm.tsx`, `DeductionCard.tsx`

#### Nómina (5)
- `SalaryReportFilters.tsx`, `SalaryBreakdownTable.tsx`, `SalaryDeductionsTable.tsx`, `SalaryCharts.tsx`, `SalarySummaryCards.tsx`

#### Administración (2)
- `user-management-panel.tsx`, `system-settings-panel.tsx`

#### UI Base (30+)
- Componentes Radix UI: Button, Input, Dialog, Select, Table, Dropdown, Accordion, etc.

#### OCR (2)
- `OCRUploader.tsx` - Cargador genérico
- `AzureOCRUploader.tsx` - Cargador específico para Azure Vision

#### Otros (40+)
- `error-boundary.tsx`, `error-state.tsx`, `empty-state.tsx`
- `page-guard.tsx`, `progress-indicator.tsx`, `under-construction.tsx`

### 3.3 Estado Global (Zustand - 8 Stores)

| Store | Propósito | Archivos |
|-------|-----------|----------|
| `auth-store.ts` | Autenticación y datos del usuario | token, user, isAuthenticated |
| `salary-store.ts` | Gestión de salarios | salaries, filters, selectedSalary |
| `dashboard-tabs-store.ts` | Navegación de tabs del dashboard | activeTab, tabHistory |
| `payroll-store.ts` | Estado de nómina | payrolls, calculations |
| `fonts-store.ts` | Fuentes y tipografía | selectedFont, fontStack |
| `layout-store.ts` | Layout y tema | sidebarOpen, theme, layoutMode |
| `themeStore.ts` | Temas personalizados | currentTheme, customThemes |
| `settings-store.ts` | Configuración general | appSettings, preferences |

### 3.4 Librerías Clave

**lib/api.ts** (994 LOC)
- Cliente Axios configurado con interceptores
- Servicios: authService, employeeService, candidateService, factoryService, timerCardService, salaryService, apartmentsV2Service, etc.

**lib/validations/**
- Esquemas Zod para validación
- Archivos: candidate.ts, candidate-schema.ts, index.ts

**lib/themes.ts**
- Configuración de 12+ temas personalizados

**Hooks personalizados (12 total)**
- `use-toast.ts`, `use-page-visibility.ts`, `use-page-permission.ts`
- `use-form-validation.ts`, `use-dev-auto-login.ts`, `use-route-change.ts`
- `useThemePreview.ts`, `useThemeApplier.ts`, `useDesignPreferences.ts`

### 3.5 Configuración Frontend

**tsconfig.json**
- Target: ES2020
- Modo strict habilitado
- Path aliases: `@/*`, `@/components/*`, `@/lib/*`, `@/stores/*`, `@/types/*`

**Tailwind + Radix UI**
- 12+ temas personalizados
- Componentes accesibles

**ESLint**
- Reglas estrictas con max-warnings 0

---

## 4. BACKEND (FastAPI + Python 3.11+)

### 4.1 Routers/Endpoints (28 Total - 200+ endpoints)

| Router | Descripción | Endpoints Principales |
|--------|-----------|----------------------|
| `auth.py` | Autenticación JWT | login, register, me, users, reset-password |
| `employees.py` | Gestión de empleados (派遣社員) | CRUD + disponibilidad |
| `candidates.py` | Gestión de candidatos (履歴書) + OCR | CRUD + aprobar/rechazar |
| `factories.py` | Gestión de fábricas/clientes (派遣先) | CRUD |
| `timer_cards.py` | Tarjetas de asistencia (タイムカード) | CRUD + upload PDF + OCR |
| `salary.py` | Cálculos de salario (給与) | CRUD + calcular + exportar |
| `apartments_v2.py` | Gestión de apartamentos (V2) | CRUD + asignaciones + reportes |
| `yukyu.py` | Vacaciones pagadas (有給休暇) | CRUD |
| `requests.py` | Workflow de solicitudes (申請) | CRUD + aprobar/rechazar |
| `admin.py` | Panel de administración | settings, statistics, audit-log |
| `dashboard.py` | Estadísticas y analytics | stats, recent-activity |
| `audit.py` | Seguimiento de auditoría | Logs de cambios |
| `azure_ocr.py` | Integración Azure Vision OCR | OCR endpoints |
| `payroll.py` | Procesamiento de nómina avanzado | Cálculos detallados |
| `role_permissions.py` | Control de acceso (RBAC) | Manejo de permisos |
| `notifications.py` | Email, LINE, etc | Envío de notificaciones |
| `import_export.py` | Importación/exportación de datos | Manejo de importes |
| `resilient_import.py` | Importación con tolerancia a fallos | Importación robusta |
| `reports.py` | Generación de reportes PDF | Exportación de datos |
| `settings.py` | Configuración de la aplicación | Configuración del sistema |
| `monitoring.py` | Monitoreo de salud del sistema | Health checks |
| `contracts.py` | Gestión de contratos | CRUD contratos |
| `pages.py` | Gestión de páginas del sistema | Contenido dinámico |
| `database.py` | Utilidades de gestión de BD | Mantenimiento BD |

### 4.2 Modelos de Base de Datos (SQLAlchemy - 1,816 LOC)

**Enumeraciones principales:**
- `UserRole` - ADMIN, MANAGER, EMPLOYEE, KEIRI, VIEWER
- `CandidateStatus` - PENDING, APPROVED, REJECTED
- `RequestType`, `RequestStatus` - Tipos de solicitud
- `YukyuStatus` - Estados de vacación
- `ApartmentStatus`, `AssignmentStatus` - Estados de apartamento
- `ShiftType`, `RoomType`, `ChargeType` - Tipos varios
- `AIProvider` - OpenAI, Gemini, Claude, Zhipu

**Modelos principales (17+):**
1. **User** - Usuarios del sistema con autenticación
2. **RefreshToken** - Tokens JWT de refresco
3. **Candidate** - Candidatos (履歴書/Rirekisho)
4. **Employee** - Empleados (派遣社員)
5. **Factory** - Fábricas/Clientes (派遣先)
6. **TimerCard** - Tarjetas de asistencia (タイムカード)
7. **SalaryCalculation** - Cálculos de salario
8. **Payroll** - Nómina
9. **Request** - Solicitudes de empleados (申請)
10. **Yukyu** - Vacaciones pagadas (有給休暇)
11. **Apartment** - Apartamentos para empleados
12. **Assignment** - Asignación empleado-apartamento
13. **AdditionalCharge** - Cargos adicionales a nómina
14. **Deduction** - Descuentos de renta
15. **AuditLog** - Log de auditoría
16. **SystemSetting** - Configuración del sistema
17. **RolePermission** - Permisos por rol

### 4.3 Servicios (20 Total)

| Servicio | Propósito |
|----------|-----------|
| `yukyu_service.py` | Gestión de vacaciones pagadas |
| `additional_charge_service.py` | Cargos adicionales a nómina |
| `ocr_cache_service.py` | Cache para resultados OCR |
| `payroll_service.py` | Procesamiento principal de nómina |
| `notification_service.py` | Email y LINE notifications |
| `import_service.py` | Servicios de importación de datos |
| `audit_service.py` | Auditoría de cambios |
| `employee_matching_service.py` | Matching/emparejamiento de empleados |
| `ai_gateway.py` | Gateway multi-IA (OpenAI, Gemini, etc) |
| `ai_usage_service.py` | Seguimiento de uso de IA |
| `payroll/payroll_validator.py` | Validación de nómina |
| `payroll/deduction_calculator.py` | Cálculo de descuentos |
| `payroll/payslip_generator.py` | Generación de recibos de pago |
| `payroll/rate_calculator.py` | Cálculo de tasas de pago |
| `payroll/overtime_calculator.py` | Cálculo de horas extras |
| `additional_providers.py` | Proveedores IA adicionales |
| `streaming_service.py` | Servicio de streaming |
| `batch_optimizer.py` | Optimización de operaciones batch |

### 4.4 Configuración Core

**backend/app/core/config.py**
- Variables de entorno
- Configuración de BD, Redis, CORS
- Configuración de IA providers

**backend/app/core/security.py**
- JWT (HS256)
- Hashing de contraseñas
- Funciones de seguridad

**backend/app/core/database.py**
- SQLAlchemy session management
- Conexión PostgreSQL

**backend/app/core/redis_client.py**
- Cliente Redis para cache

**Middlewares**
- CORS
- Logging
- Timing
- Error handling

### 4.5 Variables de Entorno Críticas

**Obligatorias:**
- `SECRET_KEY` (64 bytes para JWT)
- `POSTGRES_PASSWORD`
- `DATABASE_URL`
- `REDIS_PASSWORD`

**Opcionales (IA/Integración):**
- `GEMINI_API_KEY`
- `OPENAI_API_KEY`
- `ANTHROPIC_API_KEY`
- `AZURE_COMPUTER_VISION_ENDPOINT` + `KEY`
- `GOOGLE_CLOUD_VISION_API_KEY`
- `LINE_CHANNEL_ACCESS_TOKEN`
- `SMTP_*` (Email)

---

## 5. APIs y ENDPOINTS

### Base URL
```
/api
```

### Autenticación
```
Bearer Token (JWT en header Authorization)
```

### Endpoints Principales (100+)

#### Auth
- `POST /api/auth/login/` - Login
- `POST /api/auth/register` - Registro
- `GET /api/auth/me/` - Usuario actual
- `GET /api/auth/users` - Listar usuarios (admin)
- `POST /api/auth/users/{userId}/reset-password` - Reset contraseña

#### Employees
- `GET /api/employees/` - Listar
- `POST /api/employees/` - Crear
- `GET /api/employees/{id}/` - Detalle
- `PUT /api/employees/{id}/` - Actualizar
- `DELETE /api/employees/{id}/` - Eliminar
- `GET /api/employees/available-for-apartment` - Disponibles

#### Candidates
- `GET /api/candidates/` - Listar
- `POST /api/candidates/` - Crear
- `GET /api/candidates/{id}/` - Detalle
- `PUT /api/candidates/{id}/` - Actualizar
- `DELETE /api/candidates/{id}/` - Eliminar
- `POST /api/candidates/{id}/approve/` - Aprobar
- `POST /api/candidates/{id}/reject/` - Rechazar

#### Factories
- `GET /api/factories` - Listar
- `POST /api/factories` - Crear
- `GET /api/factories/{id}/` - Detalle
- `PUT /api/factories/{id}/` - Actualizar
- `DELETE /api/factories/{id}/` - Eliminar

#### Timer Cards
- `GET /api/timer-cards` - Listar
- `POST /api/timer-cards` - Crear
- `POST /api/timer-cards/upload/` - Subir PDF/OCR
- `POST /api/timer-cards/bulk/` - Crear masivo
- `GET /api/timer-cards/{id}/` - Detalle
- `PUT /api/timer-cards/{id}/` - Actualizar
- `DELETE /api/timer-cards/{id}/` - Eliminar

#### Salary
- `GET /api/salary/` - Listar
- `POST /api/salary/calculate/` - Calcular
- `GET /api/salary/{id}/` - Detalle
- `PUT /api/salary/{id}/` - Actualizar
- `PUT /api/salary/{id}/mark-paid/` - Marcar pagado
- `POST /api/salary/{id}/payslip/` - Generar recibo
- `POST /api/salary/export/excel/` - Exportar Excel
- `POST /api/salary/export/pdf/` - Exportar PDF

#### Apartments V2
- `GET /api/apartments/apartments` - Listar
- `POST /api/apartments/apartments` - Crear
- `GET /api/apartments/apartments/{id}` - Detalle
- `PUT /api/apartments/apartments/{id}` - Actualizar
- `DELETE /api/apartments/apartments/{id}` - Eliminar
- `GET /api/apartments/assignments` - Listar asignaciones
- `POST /api/apartments/assignments` - Crear asignación
- `GET /api/apartments/assignments/{id}` - Detalle
- `PUT /api/apartments/assignments/{id}/end` - Terminar
- `POST /api/apartments/assignments/transfer` - Transferencia
- `GET /api/apartments/reports/occupancy` - Ocupación
- `GET /api/apartments/reports/arrears` - Atrasos
- `GET /api/apartments/reports/maintenance` - Mantenimiento
- `GET /api/apartments/reports/costs` - Costos

#### Yukyu (Vacaciones)
- `GET /api/yukyu/` - Listar
- `POST /api/yukyu/` - Crear
- `GET /api/yukyu/{id}/` - Detalle
- `PUT /api/yukyu/{id}/` - Actualizar
- `DELETE /api/yukyu/{id}/` - Eliminar

#### Requests (Solicitudes)
- `GET /api/requests/` - Listar
- `POST /api/requests/` - Crear
- `POST /api/requests/{id}/approve/` - Aprobar
- `POST /api/requests/{id}/reject/` - Rechazar

#### Admin
- `GET /api/admin/settings` - Obtener configuración
- `PUT /api/admin/settings/{key}` - Actualizar
- `GET /api/admin/statistics` - Estadísticas
- `POST /api/admin/maintenance-mode` - Modo mantenimiento
- `GET /api/admin/audit-log` - Log de auditoría

#### Dashboard
- `GET /api/dashboard/stats/` - Estadísticas
- `GET /api/dashboard/recent-activity/` - Actividad reciente

---

## 6. MAPA DE RELACIONES

### Flujos de Datos

```
AUTENTICACIÓN
└── User → /login → authService.login() → POST /api/auth/login/
    → JWT Token → auth-store (Zustand) → localStorage

GESTIÓN DE EMPLEADOS
└── Candidato → CandidateEvaluator → candidateService
    → POST /api/candidates/{id}/approve/ → Employee Model
    → GET /api/employees/available-for-apartment

NÓMINA (給与)
└── TimerCard → SalaryReportFilters → salaryService
    → POST /api/salary/calculate/ → SalaryCalculation
    → salary-store (Zustand)
    → POST /api/salary/export/excel/, /pdf/

APARTAMENTOS
└── ApartmentSelector → apartmentsV2Service
    → GET /api/apartments/apartments → AssignmentForm
    → POST /api/apartments/assignments

OCR & ASISTENCIA
└── Archivo → OCRUploader/AzureOCRUploader
    → timerCardService.uploadTimerCardPDF()
    → POST /api/timer-cards/upload/ → Azure Vision API
    → TimerCard Modelo

VACACIONES (有給休暇)
└── Solicitud → YukyuRequestForm → yukyuService
    → POST /api/yukyu-requests/ → Request Model
    → Aprobación → Yukyu Model
```

### Componentes y Sus APIs

| Componente | APIs Usadas | Store | Propósito |
|-----------|-----------|-------|----------|
| CandidateEvaluator | GET /api/candidates/, POST /approve/ | - | Evaluación candidatos |
| SalaryReportFilters | GET /api/salary/ | salary-store | Reportes salarios |
| ApartmentSelector | GET /api/apartments/apartments | - | Seleccionar apartamento |
| AssignmentForm | POST /api/apartments/assignments | - | Asignar empleado |
| OCRUploader | POST /api/timer-cards/upload/ | - | Cargar asistencia |
| dashboard/page | GET /api/dashboard/stats/ | dashboard-tabs-store | Panel principal |
| PayrollSummaryCard | GET /api/payroll/ | payroll-store | Resumen nómina |

---

## 7. PROBLEMAS Y VULNERABILIDADES

### 7.1 VULNERABILIDADES DE SEGURIDAD

#### 🔴 ALTA PRIORIDAD

**1. XSS - innerHTML (ALTA)**
- **Ubicación**: `frontend/app/dashboard/candidates/page.tsx`
- **Problema**: `icon.innerHTML = '<svg...>...'`
- **Riesgo**: Si el contenido viene de entrada de usuario, permite inyección de scripts
- **Recomendación**: Reemplazar con `textContent`, `createElement`, o métodos seguros

**2. XSS - dangerouslySetInnerHTML (MEDIA)**
- **Ubicación**: `frontend/app/layout.tsx`
- **Problema**: Uso de `dangerouslySetInnerHTML` en componentes React
- **Riesgo**: XSS si el HTML no está sanitizado
- **Recomendación**: Usar DOMPurify o sanitize-html library

#### 🟡 MEDIA PRIORIDAD

**3. Demo Credentials Expuestas (MEDIA)**
- **Ubicación**: `.env.example` líneas 196-198
- **Problema**: `NEXT_PUBLIC_DEMO_USER=admin` `NEXT_PUBLIC_DEMO_PASS=admin123`
- **Riesgo**: En producción deben estar deshabilitadas
- **Recomendación**: Validar en env de producción que no estén habilitadas

**4. API Base URL Configuration (MEDIA)**
- **Ubicación**: `frontend/lib/api.ts`
- **Problema**: CORS no bien configurado potencialmente
- **Riesgo**: Requests cross-origin sin validación
- **Recomendación**: Implementar CSRF tokens si usa cookies (actualmente usa Bearer JWT)

#### 🟢 BAJA PRIORIDAD

**5. CORS Configuration Genérica (BAJA)**
- **Ubicación**: `.env.example`
- **Problema**: `BACKEND_CORS_ORIGINS=http://localhost:3000` para desarrollo
- **Riesgo**: En producción debe ser específico al dominio real
- **Recomendación**: Revisar `backend/app/core/config.py` para producción

### 7.2 PROBLEMAS EN CÓDIGO

#### TODOs Pendientes
```
backend/tests/test_payroll_integration.py
└── SEMANA 6.3: Implementar métodos integración nómina-tarjetas

backend/app/api/payroll.py
└── SEMANA 6: Implementar calculate_payroll_from_timer_cards

backend/app/api/admin.py
├── Implementar cálculo del tamaño de la BD
└── Implementar cálculo de uptime

backend/app/api/ai_gateway.py
└── Implementar rate limiting (cuando esté disponible)
```

#### Bugs Conocidos
- **backend/app/api/resilient_import.py**: BUG #6 FIX - Soporte para múltiples encodings (PARCIALMENTE RESUELTO)

### 7.3 MEJORES PRÁCTICAS IMPLEMENTADAS ✅

- ✅ Bearer Token JWT para autenticación
- ✅ Validación robusta con Pydantic (backend) y Zod (frontend)
- ✅ TypeScript strict mode habilitado
- ✅ HTTPS support en producción
- ✅ Logs estructurados con OpenTelemetry
- ✅ Role-based access control (RBAC)
- ✅ Soft deletes para datos sensibles
- ✅ Auditoría de cambios integrada

---

## 8. SUGERENCIAS DE MEJORA

### 🔴 SEGURIDAD (ALTA PRIORIDAD)

- [ ] Reemplazar `innerHTML` con métodos seguros (textContent, createElement)
- [ ] Implementar DOMPurify o sanitize-html para contenido HTML
- [ ] Agregar Content Security Policy (CSP) headers
- [ ] Implementar rate limiting en endpoints REST
- [ ] Validar y sanitizar todos los datos de OCR antes de procesar
- [ ] Implementar secret rotation para API keys de IA
- [ ] Usar HTTPS en todas las conexiones (ya configurado, validar en prod)
- [ ] Agregar HSTS headers
- [ ] Implementar request signing para endpoints críticos

### 🟡 PERFORMANCE (MEDIA PRIORIDAD)

- [ ] Implementar caching más agresivo con Redis
- [ ] Optimizar queries de BD con índices adicionales
- [ ] Implementar lazy loading en componentes grandes (Dashboard, Reports)
- [ ] Cachear resultados de OCR (evitar reprocesar)
- [ ] Implementar pagination en todas las listas grandes
- [ ] Comprimir respuestas gzip en backend (FastAPI)
- [ ] Optimizar bundle size del frontend (current: desconocido)
- [ ] Agregar minificación de assets

### 📊 TESTING (MEDIA PRIORIDAD)

- [ ] Aumentar cobertura de tests (target: 80%+)
- [ ] Implementar tests de integración más exhaustivos
- [ ] Agregar performance benchmarks
- [ ] Agregar load tests para OCR y nómina
- [ ] Completar TODOs de tests pendientes
- [ ] Agregar tests de seguridad (OWASP top 10)
- [ ] Tests de validación de datos OCR

### 🏗️ ARQUITECTURA (BAJA PRIORIDAD)

- [ ] Considerar microservicios para OCR (muy pesado computacionalmente)
- [ ] Implementar message queue (RabbitMQ) para procesos asíncronos largos
- [ ] Separar BD de lectura/escritura si requiere escalabilidad extrema
- [ ] Implementar GraphQL como alternativa a REST
- [ ] Agregar API versioning explícito (/api/v1/, /api/v2/)

### 📚 DOCUMENTACIÓN (MEDIA PRIORIDAD)

- [ ] Documentar modelos de BD en detalle
- [ ] Crear diagramas UML de relaciones
- [ ] Documentar flujos de negocio por módulo
- [ ] Crear guía de contribución (CONTRIBUTING.md)
- [ ] Documentar decisiones de arquitectura (ADR)
- [ ] Crear runbooks para operaciones

### 🚀 DEVOPS (MEDIA PRIORIDAD)

- [ ] Implementar CI/CD pipeline (GitHub Actions, GitLab CI, Jenkins)
- [ ] Agregar health checks a todos los servicios
- [ ] Implementar auto-scaling para producción
- [ ] Agregar backup automático de BD (diarios, semanales)
- [ ] Implementar disaster recovery plan
- [ ] Agregar monitoreo de costos (si usa cloud)
- [ ] Implementar log aggregation (ELK, Splunk)

---

## 📈 MÉTRICAS DEL PROYECTO

| Métrica | Valor | Detalles |
|---------|-------|----------|
| **Archivos fuente totales** | 660+ | Código fuente + tests + docs |
| **Líneas de código** | ~25,000+ | Frontend + Backend combinado |
| **Páginas frontend** | 80+ | Next.js App Router (actualizadas) |
| **Componentes React** | 171 | Reutilizables + modulares |
| **Routers/Endpoints API** | 28 | Con ~200+ endpoints REST |
| **Modelos BD** | 17+ | SQLAlchemy ORM |
| **Servicios backend** | 20+ | Especializados por dominio |
| **Stores Zustand** | 8 | Estado global |
| **Custom hooks** | 12 | React hooks personalizados |
| **Tests automatizados** | 30+ | Playwright E2E + Vitest |
| **Lenguajes principales** | 3 | TypeScript, Python, YAML |
| **Documentación** | 100+ | Archivos .md exhaustivos |
| **Scripts de automatización** | 30+ | Windows batch + PowerShell |

---

## 🐳 DOCKER COMPOSE (6 SERVICIOS)

### Arquitectura de Contenedores

```
UNS-ClaudeJP-6.0.0 Sistema Multi-Contenedor
│
├─ 🗄️ PostgreSQL 15
│  ├─ Puerto: 5432
│  ├─ BD: uns_claudejp
│  ├─ Usuario: uns_admin
│  └─ Volumen: postgres_data (persistente)
│
├─ 🔴 Redis 7
│  ├─ Puerto: 6379
│  ├─ Maxmemory: 256mb
│  ├─ Policy: allkeys-lru
│  └─ Volumen: redis_data (persistente)
│
├─ 📤 Importer (One-time service)
│  ├─ Aplicar migraciones Alembic
│  ├─ Crear usuario admin
│  ├─ Importar datos demostración
│  └─ Restart: 'no' (ejecuta una sola vez)
│
├─ ⚙️ Backend FastAPI
│  ├─ Puerto: 8000
│  ├─ Endpoint API: /api
│  ├─ Swagger: /api/docs
│  ├─ ReDoc: /api/redoc
│  ├─ Health: /api/health
│  └─ Hot reload: Habilitado ✅
│
├─ 🌐 Frontend Next.js 16
│  ├─ Puerto: 3000
│  ├─ Bundler: Turbopack (70% más rápido)
│  ├─ Pages: 80+ rutas
│  └─ Hot reload: Habilitado ✅
│
├─ 🖥️ Adminer (Gestor BD Visual)
│  ├─ Puerto: 8080
│  ├─ Sistema: PostgreSQL
│  └─ Credenciales: POSTGRES_USER/PASSWORD
│
└─ 📊 Grafana (Monitoreo)
   ├─ Puerto: 3001
   └─ Dashboard: Métricas del sistema

Red Compartida: uns-claudejp-600-network (bridge)
```

### Variables de Entorno Críticas

**Obligatorias (⚠️):**
```bash
# Base de datos
POSTGRES_DB=uns_claudejp
POSTGRES_USER=uns_admin
POSTGRES_PASSWORD=<cambiar-en-producción>  # CRÍTICO

# Redis
REDIS_PASSWORD=<cambiar-en-producción>     # CRÍTICO

# JWT
SECRET_KEY=<64-bytes-aleatorios>          # CRÍTICO

# Base de datos URL
DATABASE_URL=postgresql://uns_admin:<password>@db:5432/uns_claudejp

# Frontend
NEXT_PUBLIC_API_URL=http://localhost:8000
```

**Opcionales (según funcionalidades):**
```bash
# OCR & Vision
AZURE_COMPUTER_VISION_ENDPOINT=https://...
AZURE_COMPUTER_VISION_KEY=...
GOOGLE_CLOUD_VISION_API_KEY=...

# IA Providers
OPENAI_API_KEY=sk-...
GEMINI_API_KEY=...
ANTHROPIC_API_KEY=...
ZHIPU_API_KEY=...

# Notificaciones
SMTP_SERVER=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=...
SMTP_PASSWORD=...
LINE_CHANNEL_ACCESS_TOKEN=...

# Monitoreo
GRAFANA_ADMIN_USER=admin
GRAFANA_ADMIN_PASSWORD=...
```

### Flujo de Inicio

```
1. docker compose up -d db      → PostgreSQL listo (90s)
2. db + redis healthy           → Inicia importer
3. importer aplica migraciones  → Crea tablas, usuario admin
4. backend espera DB            → Inicia cuando BD lista
5. frontend espera backend      → Inicia cuando API responde
6. adminer y grafana            → Servicios de monitoreo

Tiempo total: ~2-3 minutos (primera vez)
```

### Ports Requeridos

| Puerto | Servicio | URL | Verificación |
|--------|----------|-----|--------------|
| **3000** | Frontend (Next.js) | http://localhost:3000 | ✅ Landing page |
| **8000** | Backend (FastAPI) | http://localhost:8000 | ✅ /api/docs |
| **5432** | PostgreSQL | localhost:5432 | ✅ psql conecta |
| **6379** | Redis | localhost:6379 | ✅ redis-cli ping |
| **8080** | Adminer | http://localhost:8080 | ✅ Interface Web |
| **3001** | Grafana | http://localhost:3001 | ✅ Dashboard |

---

## 💪 FORTALEZAS DEL PROYECTO

✅ **Arquitectura moderna y escalable** - Monorepo bien organizado
✅ **Stack tecnológico actualizado** - Next.js 16, React 19, FastAPI, PostgreSQL 15
✅ **TypeScript strict mode** - Tipificación robusta
✅ **Validación exhaustiva** - Pydantic + Zod en ambos lados
✅ **Testing completo** - Playwright E2E + Vitest unit tests
✅ **Sistema RBAC** - Control de acceso por roles
✅ **Auditoría integrada** - Seguimiento de cambios
✅ **Múltiples IA providers** - OpenAI, Gemini, Claude, Zhipu
✅ **Documentación extensiva** - README, guides, deployment
✅ **Docker ready** - Docker Compose listo para producción

---

## ⚠️ ÁREAS DE MEJORA

- 🔴 2-3 vulnerabilidades XSS (bajo impacto)
- 🟡 Rate limiting no implementado
- 🟡 CI/CD pipeline inexistente
- 🟡 Cobertura de tests podría mejorar (aumentar a 80%+)
- 🟡 Algunos TODOs pendientes en backend
- 🟢 Health checks limitados
- 🟢 Escalabilidad OCR podría beneficiarse de microservicios

---

## 🎯 PRÓXIMAS ACCIONES RECOMENDADAS

### Inmediato (Semana 1)
1. ✋ **Arreglar vulnerabilidades XSS** en candidates/page.tsx y layout.tsx
2. 🔐 **Implementar DOMPurify** para sanitización HTML
3. ⚡ **Agregar rate limiting** en endpoints críticos

### Corto Plazo (2-4 semanas)
1. 🛡️ Implementar CSP headers
2. 📝 Completar TODOs de payroll integration
3. 🧪 Aumentar cobertura de tests

### Mediano Plazo (1-2 meses)
1. 🚀 Implementar CI/CD pipeline
2. 📊 Agregar performance monitoring
3. 💾 Configurar backup automático de BD
4. 📈 Optimizar performance de OCR

### Largo Plazo (2-6 meses)
1. 🏗️ Considerar arquitectura de microservicios para OCR
2. 📦 Implementar message queue (RabbitMQ)
3. 📡 Implementar GraphQL como alternativa a REST
4. 🌍 Expandir a multi-región

---

## 📞 CONTACTO Y RECURSOS

**Documentación del Proyecto**: `/home/user/UNS-ClaudeJP-6.0.0/docs/`
**Análisis Completo (JSON)**: `/home/user/UNS-ClaudeJP-6.0.0/ANALISIS_APLICACION_COMPLETO.json`
**Resumen Técnico**: `/home/user/UNS-ClaudeJP-6.0.0/ANALISIS_APLICACION_RESUMEN.md`

---

**Fin de Inspección**
*Análisis realizado: 2025-11-19*
*Versión de proyecto: 6.0.0*
