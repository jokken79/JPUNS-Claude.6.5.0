# Análisis Exhaustivo de UNS-ClaudeJP 6.0.0

## Información del Proyecto

| Aspecto | Detalle |
|--------|---------|
| **Aplicación** | UNS-ClaudeJP 6.0.0 |
| **Descripción** | Sistema integral de gestión de RRHH para agencias de staffing japonesas |
| **Versión** | 6.0.0 |
| **Archivos Fuente** | 660+ archivos |
| **Líneas de Código** | ~25,000+ LOC |
| **Fecha Análisis** | 2025-11-19 |

---

## Estructura General

```
UNS-ClaudeJP-6.0.0/
├── frontend/              # Next.js 16 + React 19 + TypeScript
│   ├── app/              # 30+ páginas (App Router)
│   ├── components/       # 171 componentes reutilizables
│   ├── lib/              # Librerías (API, validación, telemetría)
│   ├── stores/           # 8 stores Zustand (estado global)
│   ├── hooks/            # 12 custom hooks
│   ├── types/            # Tipos TypeScript
│   └── tests/            # Playwright E2E + Vitest
│
├── backend/              # FastAPI + Python 3.11+
│   ├── app/api/          # 24 routers FastAPI
│   ├── app/models/       # SQLAlchemy (1,816 LOC)
│   ├── app/services/     # 20 servicios de negocio
│   ├── app/core/         # Configuración core
│   └── tests/            # Tests unitarios/integración
│
├── docker/              # Docker Compose (6 servicios)
├── docs/                # Documentación exhaustiva
├── scripts/             # Utilidades de setup
├── config/              # Configuración de factories
└── base-datos/          # Datos y backups
```

---

## Stack Tecnológico

### Frontend
- **Framework**: Next.js 16.0.0
- **React**: 19.0.0
- **TypeScript**: 5.6.0 (Strict Mode)
- **Estilos**: TailwindCSS 3.4.13 + Radix UI (20+ componentes)
- **Formularios**: React Hook Form 7.65.0 + Zod 3.25.76
- **Estado**: Zustand 5.0.8 (8 stores)
- **Data Fetching**: React Query (TanStack) 5.59.0 + Axios 1.7.7
- **Testing**: Playwright 1.56.1 (E2E) + Vitest 2.1.5 (Unit)
- **Gráficos**: Recharts 2.15.4
- **Animaciones**: Framer Motion 11.15.0
- **Telemetría**: OpenTelemetry 1.9.0
- **Notificaciones**: Sonner 2.0.7 + React Hot Toast 2.6.0

### Backend
- **Framework**: FastAPI 0.115.6
- **Lenguaje**: Python 3.11+
- **BD**: PostgreSQL 15
- **Cache**: Redis 7
- **ORM**: SQLAlchemy 2.0
- **Validación**: Pydantic 2.0
- **Autenticación**: JWT (HS256)
- **OCR**: Azure Vision, EasyOCR, Tesseract, Gemini API
- **IA**: OpenAI, Gemini, Anthropic Claude, Zhipu
- **Telemetría**: OpenTelemetry
- **Monitoreo**: Prometheus + Grafana

---

## Páginas Principales (30+)

### Autenticación
- `/login` - Página de login

### Dashboard
- `/dashboard` - Dashboard principal
- `/dashboard/page` - Inicio del dashboard

### Gestión de Nómina
- `/dashboard/salary` - Listado de salarios
- `/dashboard/salary/reports` - Reportes
- `/dashboard/salary/[id]` - Detalle de salario

### Gestión de Apartamentos
- `/dashboard/apartments` - Listado
- `/dashboard/apartments/create` - Crear
- `/dashboard/apartments/[id]` - Detalle
- `/dashboard/apartments/[id]/assign` - Asignar empleado
- `/dashboard/apartments/[id]/edit` - Editar

### Gestión de Fábricas/Clientes
- `/dashboard/factories` - Listado
- `/dashboard/factories/[id]` - Detalle
- `/dashboard/factories/[id]/config` - Configuración
- `/dashboard/factories/new` - Crear

### Asistencia (タイムカード)
- `/dashboard/timercards` - Listado
- `/dashboard/timercards/upload` - Subir archivos

### Vacaciones (有給休暇)
- `/dashboard/yukyu` - Listado
- `/dashboard/yukyu-requests` - Solicitudes
- `/dashboard/yukyu-requests/create` - Crear

### Nómina (給与)
- `/dashboard/payroll` - Gestión
- `/dashboard/payroll/create` - Crear
- `/dashboard/payroll/calculate` - Calcular
- `/dashboard/payroll/yukyu-summary` - Resumen

### Otros
- `/dashboard/profile` - Perfil
- `/dashboard/reports` - Reportes
- `/dashboard/design-system` - Sistema de diseño
- `/dashboard/design-preferences` - Preferencias
- `/dashboard/help` - Ayuda

---

## Componentes (171 Total)

### Dashboard (20 componentes)
- `header.tsx`, `sidebar.tsx`, `metric-card.tsx`, `stats-chart.tsx`
- `QuickActions.tsx`, `PayrollSummaryCard.tsx`
- `dashboard-tabs-wrapper.tsx`, `layout-controls.tsx`
- Charts: `AreaChartCard.tsx`, `BarChartCard.tsx`, `DonutChartCard.tsx`, `OccupancyChart.tsx`
- Tabs: `ApartmentsTab.tsx`, `EmployeesTab.tsx`, `FinancialsTab.tsx`, etc.

### Apartamentos (8)
- `ApartmentSelector.tsx`, `ApartmentSelector-enhanced.tsx`
- `AssignmentForm.tsx`, `DeductionCard.tsx`

### Nómina (5)
- `SalaryReportFilters.tsx`, `SalaryBreakdownTable.tsx`
- `SalaryDeductionsTable.tsx`, `SalaryCharts.tsx`, `SalarySummaryCards.tsx`

### Admin (2)
- `user-management-panel.tsx`, `system-settings-panel.tsx`

### UI Base (30+)
- Componentes primitivos de Radix UI
- Button, Input, Dialog, Select, etc.

### OCR (2)
- `OCRUploader.tsx`, `AzureOCRUploader.tsx`

### Otros (40+)
- `error-boundary.tsx`, `error-state.tsx`, `empty-state.tsx`
- `page-guard.tsx`, `progress-indicator.tsx`

---

## API Endpoints (24 Routers)

### Autenticación (`auth`)
- `POST /api/auth/login/` - Login
- `POST /api/auth/register` - Registro
- `GET /api/auth/me/` - Usuario actual
- `GET /api/auth/users` - Listar (admin)

### Empleados (`employees`)
- `GET/POST /api/employees/`
- `GET/PUT/DELETE /api/employees/{id}/`
- `GET /api/employees/available-for-apartment`

### Candidatos (`candidates`)
- `GET/POST /api/candidates/`
- `GET/PUT/DELETE /api/candidates/{id}/`
- `POST /api/candidates/{id}/approve/`
- `POST /api/candidates/{id}/reject/`

### Fábricas (`factories`)
- `GET/POST /api/factories`
- `GET/PUT/DELETE /api/factories/{id}/`

### Tarjetas de Asistencia (`timer_cards`)
- `GET/POST /api/timer-cards`
- `POST /api/timer-cards/upload/`
- `POST /api/timer-cards/bulk/`
- `GET/PUT/DELETE /api/timer-cards/{id}/`

### Salarios (`salary`)
- `GET/POST /api/salary/`
- `POST /api/salary/calculate/`
- `PUT /api/salary/{id}/mark-paid/`
- `POST /api/salary/{id}/payslip/`
- `POST /api/salary/export/excel/`
- `POST /api/salary/export/pdf/`

### Apartamentos V2 (`apartments_v2`)
- `GET/POST /api/apartments/apartments`
- `GET/PUT/DELETE /api/apartments/apartments/{id}`
- `GET/POST /api/apartments/assignments`
- `GET/PUT /api/apartments/assignments/{id}`
- `POST /api/apartments/assignments/transfer`
- `GET /api/apartments/charges`
- `GET /api/apartments/deductions`
- `POST /api/apartments/deductions/generate`
- `GET /api/apartments/reports/occupancy`
- `GET /api/apartments/reports/arrears`
- `GET /api/apartments/reports/maintenance`
- `GET /api/apartments/reports/costs`

### Vacaciones (`yukyu`)
- `GET/POST /api/yukyu/`
- `GET/PUT/DELETE /api/yukyu/{id}/`

### Solicitudes (`requests`)
- `GET/POST /api/requests/`
- `POST /api/requests/{id}/approve/`
- `POST /api/requests/{id}/reject/`

### Administración (`admin`)
- `GET /api/admin/settings`
- `PUT /api/admin/settings/{key}`
- `GET /api/admin/statistics`
- `POST /api/admin/maintenance-mode`
- `GET /api/admin/audit-log`

### Dashboard
- `GET /api/dashboard/stats/`
- `GET /api/dashboard/recent-activity/`

### Otros (8 más)
- `ai_agents`, `audit`, `azure_ocr`, `contracts`, `database`, `import_export`, `monitoring`, `notifications`, `payroll`, `reports`, `resilient_import`, `role_permissions`, `settings`

---

## Modelos Base de Datos (SQLAlchemy)

### Enumeraciones
- `UserRole` - Roles de usuario
- `CandidateStatus` - Estados de candidato
- `DocumentType` - Tipos de documento
- `RequestType` y `RequestStatus` - Solicitudes
- `YukyuStatus` - Estado de vacación
- `ShiftType` - Tipo de turno
- `RoomType` - Tipo de habitación
- `ApartmentStatus` y `AssignmentStatus` - Apartamentos
- `ChargeType` y `DeductionStatus` - Cargos
- `AdminActionType` - Acciones admin
- `AIProvider` - Proveedores IA

### Modelos Principales
- **User** - Usuarios del sistema
- **Candidate** - Candidatos (履歴書)
- **Employee** - Empleados (派遣社員)
- **Factory** - Fábricas/Clientes (派遣先)
- **TimerCard** - Asistencia (タイムカード)
- **SalaryCalculation** - Cálculos de salario
- **Request** - Solicitudes de empleados (申請)
- **Yukyu** - Vacaciones pagadas (有給休暇)
- **Apartment** - Apartamentos para empleados
- **Assignment** - Asignación empleado-apartamento
- **AdditionalCharge** - Cargos adicionales
- **Deduction** - Descuentos de renta
- **AuditLog** - Log de auditoría
- **SystemSetting** - Configuración del sistema
- **RolePermission** - Permisos por rol

---

## Almacenamiento de Estado (Zustand - 8 Stores)

| Store | Propósito |
|-------|-----------|
| `auth-store.ts` | Autenticación y usuario (token, user) |
| `salary-store.ts` | Salarios y filtros |
| `dashboard-tabs-store.ts` | Navegación de tabs |
| `payroll-store.ts` | Estado de nómina |
| `fonts-store.ts` | Fuentes y tipografía |
| `layout-store.ts` | Layout y tema (sidebar, theme) |
| `themeStore.ts` | Temas personalizados |
| `settings-store.ts` | Configuración general |

---

## Servicios Backend (20 Total)

| Servicio | Propósito |
|----------|-----------|
| `yukyu_service.py` | Gestión de vacaciones |
| `additional_charge_service.py` | Cargos adicionales |
| `ocr_cache_service.py` | Cache OCR |
| `payroll_service.py` | Procesamiento de nómina |
| `notification_service.py` | Email y LINE |
| `import_service.py` | Importación de datos |
| `audit_service.py` | Auditoría |
| `employee_matching_service.py` | Matching de empleados |
| `ai_gateway.py` | Gateway multi-IA |
| `ai_usage_service.py` | Seguimiento de uso IA |
| `payroll/payroll_validator.py` | Validación nómina |
| `payroll/deduction_calculator.py` | Cálculo de descuentos |
| `payroll/payslip_generator.py` | Generación de recibos |
| `payroll/rate_calculator.py` | Cálculo de tasas |
| `payroll/overtime_calculator.py` | Cálculo de horas extras |
| `additional_providers.py` | Proveedores IA adicionales |
| `streaming_service.py` | Servicio de streaming |
| `batch_optimizer.py` | Optimización batch |

---

## Variables de Entorno Críticas

### Obligatorias
- `SECRET_KEY` (64 bytes para JWT)
- `POSTGRES_PASSWORD`
- `DATABASE_URL`
- `REDIS_PASSWORD`

### Opcionales (IA/Integración)
- `GEMINI_API_KEY`
- `OPENAI_API_KEY`
- `ANTHROPIC_API_KEY`
- `AZURE_COMPUTER_VISION_ENDPOINT` + `KEY`
- `LINE_CHANNEL_ACCESS_TOKEN`
- `SMTP_*` (Email)

---

## Docker Compose (6 Servicios)

```yaml
Servicios:
- backend (FastAPI, puerto 8000)
- frontend (Next.js, puerto 3000)
- postgres (PostgreSQL 15, puerto 5432)
- redis (Redis 7, puerto 6379)
- adminer (Gestor BD, puerto 8080)
- grafana (Monitoreo, puerto 3001)

Red: uns-network
```

---

## Problemas de Seguridad Identificados

### Vulnerabilidades

#### 1. XSS - innerHTML (ALTA)
- **Ubicación**: `frontend/app/dashboard/candidates/page.tsx`
- **Problema**: `icon.innerHTML = '<svg...>...'`
- **Riesgo**: Si contenido viene de usuario, riesgo de XSS
- **Recomendación**: Usar `textContent`, `createElement` o `innerText`

#### 2. XSS - dangerouslySetInnerHTML (MEDIA)
- **Ubicación**: `frontend/app/layout.tsx`
- **Problema**: Uso de `dangerouslySetInnerHTML`
- **Riesgo**: XSS si HTML no está sanitizado
- **Recomendación**: Usar DOMPurify o sanitize-html

#### 3. Demo Credentials Expuestas (MEDIA)
- **Ubicación**: `.env.example` líneas 196-198
- **Problema**: `NEXT_PUBLIC_DEMO_USER=admin, NEXT_PUBLIC_DEMO_PASS=admin123`
- **Riesgo**: En producción deben estar deshabilitadas
- **Recomendación**: Validar en init que no estén en producción

#### 4. CORS Configuration (BAJA)
- **Ubicación**: `.env.example`
- **Problema**: `BACKEND_CORS_ORIGINS=http://localhost:3000`
- **Riesgo**: En producción debe ser específico al dominio
- **Recomendación**: Revisar `backend/app/core/config.py`

---

## Mejoras Recomendadas

### Seguridad (ALTA PRIORIDAD)
- [ ] Reemplazar `innerHTML` con métodos seguros
- [ ] Implementar sanitización HTML (DOMPurify)
- [ ] Agregar Content Security Policy (CSP) headers
- [ ] Implementar rate limiting en endpoints
- [ ] Validar y sanitizar datos OCR
- [ ] Usar HTTPS en todas las conexiones

### Performance (MEDIA)
- [ ] Caching más agresivo con Redis
- [ ] Optimizar queries de BD con índices
- [ ] Lazy loading en componentes grandes
- [ ] Cachear resultados OCR
- [ ] Pagination en listas grandes
- [ ] Comprimir gzip en backend

### Testing (MEDIA)
- [ ] Aumentar cobertura (target: 80%+)
- [ ] Tests de integración más exhaustivos
- [ ] Load tests para OCR y nómina
- [ ] Tests de seguridad (OWASP)
- [ ] Completar TODOs pendientes

### Arquitectura (BAJA)
- [ ] Considerar microservicios para OCR
- [ ] Message queue (RabbitMQ)
- [ ] BD read/write split si es necesario
- [ ] API versioning explícito
- [ ] Consideración GraphQL

### DevOps (MEDIA)
- [ ] CI/CD pipeline (GitHub Actions)
- [ ] Health checks en servicios
- [ ] Auto-scaling
- [ ] Backup automático
- [ ] Disaster recovery plan
- [ ] Monitoreo de costos

---

## TODOs Pendientes en Código

1. **backend/tests/test_payroll_integration.py**
   - SEMANA 6.3: Implementar métodos integración nómina-timer cards

2. **backend/app/api/payroll.py**
   - SEMANA 6: Implementar `calculate_payroll_from_timer_cards`

3. **backend/app/api/admin.py**
   - Implementar cálculo tamaño de BD
   - Implementar cálculo de uptime

4. **backend/app/api/ai_gateway.py**
   - Implementar rate limiting (cuando esté disponible)

---

## Flujos de Datos Principales

### Autenticación
```
Usuario → login/page.tsx → authService.login 
→ POST /api/auth/login/ → JWT token → auth-store → localStorage
```

### Gestión de Empleados
```
Candidato → CandidateEvaluator → candidateService 
→ POST /api/candidates/{id}/approve/ → Employee
```

### Nómina
```
TimerCard → SalaryReportFilters → salaryService.calculateSalary 
→ POST /api/salary/calculate/ → salary-store
```

### Apartamentos
```
ApartmentSelector → apartmentsV2Service 
→ GET/POST /api/apartments/apartments → AssignmentForm
```

### OCR
```
Archivo → OCRUploader → timerCardService.uploadTimerCardPDF 
→ POST /api/timer-cards/upload/ → Azure Vision API
```

---

## Métricas del Proyecto

| Métrica | Valor |
|---------|-------|
| Archivos fuente | 660+ |
| Líneas de código | ~25,000+ |
| Páginas frontend | 30+ |
| Componentes | 171 |
| Routers API | 24 |
| Modelos BD | 17+ |
| Servicios backend | 20 |
| Stores Zustand | 8 |
| Custom hooks | 12 |
| Tests | 30+ |

---

## Configuración Docker

### Puertos Requeridos
- 3000: Frontend Next.js
- 8000: Backend FastAPI
- 5432: PostgreSQL
- 6379: Redis
- 8080: Adminer
- 3001: Grafana

### Almacenamiento Persistente
- PostgreSQL: Datos de BD
- Redis: Cache y sesiones
- Volúmenes: uploads/, reports/

### Red
- `uns-network` - Red docker compartida

---

## Conclusiones

### Fortalezas
- Arquitectura moderna y escalable (monorepo)
- Stack tecnológico actualizado (Next.js 16, React 19, FastAPI)
- TypeScript strict mode en frontend
- Validación con Pydantic + Zod
- Testing (Playwright E2E + Vitest)
- Sistema de roles y permisos (RBAC)
- Auditoría de cambios integrada
- Soporte múltiples IA providers
- Documentación exhaustiva

### Áreas de Mejora
- Vulnerabilidades XSS identificadas (bajo impacto)
- Rate limiting no implementado
- Cobertura de tests podría mejorar
- CI/CD pipeline no existe
- Health checks limitados
- Algunas características pendientes (TODOs)

### Próximas Acciones
1. **Inmediato**: Arreglar vulnerabilidades XSS
2. **Corto plazo**: Implementar rate limiting y CSP headers
3. **Mediano plazo**: Aumentar cobertura de tests, CI/CD
4. **Largo plazo**: Considerar arquitectura de microservicios

---

**Análisis completo disponible en**: `ANALISIS_APLICACION_COMPLETO.json`
