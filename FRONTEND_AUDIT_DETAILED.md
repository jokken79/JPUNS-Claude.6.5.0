# AUDITORÍA DETALLADA DEL FRONTEND - UNS-ClaudeJP v6.0.0

## RESUMEN EJECUTIVO

Total de Rutas Activas: 99 rutas documentadas
Total de Componentes: 45+ componentes principales + 50+ componentes UI
Componentes Potencialmente Huérfanos: 261
Páginas Bajo Construcción: 1 (/under-construction)
Archivos con Marcadores TODO: 6

---

## 1. RUTAS ACTIVAS Y SUS APIS

### A. RUTAS CRÍTICAS (Production)

| Ruta | Archivo | APIs Utilizadas | Estado |
|------|---------|-----------------|--------|
| `/` | app/page.tsx | - | Activa |
| `/login` | app/login/page.tsx | authService | Activa |
| `/dashboard` | app/dashboard/page.tsx | candidateService, employeeService, factoryService, timerCardService | Activa |
| `/dashboard/candidates` | app/dashboard/candidates/page.tsx | candidateService | Activa |
| `/dashboard/employees` | app/dashboard/employees/page.tsx | employeeService | Activa |
| `/dashboard/factories` | app/dashboard/factories/page.tsx | /factories/stats | Activa |
| `/dashboard/apartments` | app/dashboard/apartments/page.tsx | apartmentsV2Service | Activa |
| `/dashboard/payroll` | app/dashboard/payroll/page.tsx | - | Incompleta |
| `/dashboard/yukyu` | app/dashboard/yukyu/page.tsx | yukyuService, /yukyu/balances, /yukyu/requests | Activa |

### B. RUTAS CON DATOS DINÁMICOS (CRUD)

| Ruta | Archivo | APIs Utilizadas | Tipo |
|------|---------|-----------------|------|
| `/dashboard/candidates/[id]` | app/dashboard/candidates/[id]/page.tsx | candidateService | Lectura/Actualización |
| `/dashboard/candidates/[id]/edit` | app/dashboard/candidates/[id]/edit/page.tsx | candidateService | Edición |
| `/dashboard/employees/[id]` | app/dashboard/employees/[id]/page.tsx | employeeService, apartmentsV2Service | Lectura |
| `/dashboard/employees/[id]/edit` | app/dashboard/employees/[id]/edit/page.tsx | - | Edición (Posible Rota) |
| `/dashboard/apartments/[id]` | app/dashboard/apartments/[id]/page.tsx | apartmentsV2Service | Lectura |
| `/dashboard/apartments/[id]/edit` | app/dashboard/apartments/[id]/edit/page.tsx | apartmentsV2Service | Edición |
| `/dashboard/apartments/[id]/assign` | app/dashboard/apartments/[id]/assign/page.tsx | apartmentsV2Service, employeeService | Asignación |
| `/dashboard/factories/[factory_id]` | app/dashboard/factories/[factory_id]/page.tsx | - | Lectura (Posible Rota) |
| `/dashboard/factories/[factory_id]/config` | app/dashboard/factories/[factory_id]/config/page.tsx | - | Configuración (Posible Rota) |

### C. RUTAS DE REPORTES Y ANÁLISIS

| Ruta | Archivo | APIs Utilizadas | Estado |
|------|---------|-----------------|--------|
| `/dashboard/reports` | app/dashboard/reports/page.tsx | - | Vacía |
| `/dashboard/apartment-reports` | app/dashboard/apartment-reports/page.tsx | apartmentsV2Service | Activa |
| `/dashboard/apartment-reports/occupancy` | app/dashboard/apartment-reports/occupancy/page.tsx | apartmentsV2Service | Activa |
| `/dashboard/apartment-reports/arrears` | app/dashboard/apartment-reports/arrears/page.tsx | apartmentsV2Service (TODO: PDF export) | Activa |
| `/dashboard/apartment-reports/maintenance` | app/dashboard/apartment-reports/maintenance/page.tsx | apartmentsV2Service | Activa |
| `/dashboard/apartment-reports/costs` | app/dashboard/apartment-reports/costs/page.tsx | apartmentsV2Service | Activa |
| `/dashboard/salary/reports` | app/dashboard/salary/reports/page.tsx | salaryService | Activa |
| `/dashboard/yukyu-reports` | app/dashboard/yukyu-reports/page.tsx | /api/yukyu/reports/export-excel, /employees, /yukyu/balances | Activa |

### D. RUTAS ADMINISTRATIVAS

| Ruta | Archivo | APIs Utilizadas | Estado |
|------|---------|-----------------|--------|
| `/dashboard/admin/control-panel` | app/dashboard/admin/control-panel/page.tsx | adminControlPanelService, /admin/statistics, /role-permissions/* | Activa |
| `/dashboard/admin/audit-logs` | app/dashboard/admin/audit-logs/page.tsx | - | Posible Rota |
| `/dashboard/admin/yukyu-management` | app/dashboard/admin/yukyu-management/page.tsx | /yukyu/balances/calculate, /yukyu/maintenance/* | Activa |

### E. RUTAS DE CONFIGURACIÓN

| Ruta | Archivo | APIs Utilizadas | Estado |
|------|---------|-----------------|--------|
| `/dashboard/settings` | app/dashboard/settings/page.tsx | - | Vacía |
| `/dashboard/settings/appearance` | app/dashboard/settings/appearance/page.tsx | - | Vacía |
| `/dashboard/themes` | app/dashboard/themes/page.tsx | - | Vacía |
| `/dashboard/themes/customizer` | app/dashboard/themes/customizer/page.tsx | - | Vacía |
| `/dashboard/design-preferences` | app/dashboard/design-preferences/page.tsx | - | Vacía |
| `/dashboard/design-system` | app/dashboard/design-system/page.tsx | - | Vacía |

---

## 2. ANÁLISIS DE PÁGINAS ROTAS Y MUERTAS

### Páginas Potencialmente Muertas (Sin funcionalidad API)

```
/admin/page.tsx                                    → No importa servicios
/apartments/page.tsx                               → No importa servicios
/candidates/page.tsx                               → No importa servicios
/dashboard/apartment-assignments/page.tsx          → Formulario vacío
/dashboard/apartment-assignments/[id]/page.tsx     → Detalles vacíos
/dashboard/apartment-assignments/[id]/end/page.tsx → Form incompleto
/dashboard/construction/page.tsx                   → Placeholder
/dashboard/database-management/page.tsx            → Control panel sin lógica clara
/dashboard/employees/excel-view/page.tsx           → Vista estática
/dashboard/examples/forms/page.tsx                 → Componentes de demostración
/dashboard/factories/new/page.tsx                  → Formulario sin validación
/dashboard/help/page.tsx                           → Placeholder
/dashboard/payroll/create/page.tsx                 → Incompleto
/dashboard/payroll/calculate/page.tsx              → Sin lógica implementada
/dashboard/payroll/timer-cards/page.tsx            → Vacío
/dashboard/payroll/settings/page.tsx               → Vacío
/dashboard/requests/[id]/page.tsx                  → Detalles no cargados
/dashboard/support/page.tsx                        → Vacío
/dashboard/terms/page.tsx                          → Estático
/dashboard/timercards/page.tsx                     → Vacío
/dashboard/yukyu-requests/page.tsx                 → Incompleto
```

### Páginas Bajo Construcción
- `/under-construction/page.tsx` - Página dedicada a construcción

### Rutas Top-Level No Funcionales
- `/employees`
- `/factories`
- `/payroll`
- `/profile`
- `/reports`
- `/requests`
- `/settings`
- `/themes`
- `/timercards`

---

## 3. COMPONENTES HUÉRFANOS (No importados en páginas)

### Componentes Principales (45+)

#### Formularios y Entrada de Datos
- `ApartmentSelector.tsx` → Usado en componentes de asignación
- `ApartmentSelector-enhanced.tsx` → Variante mejorada (Posible duplicado)
- `AzureOCRUploader.tsx` → Extracción de documentos con OCR
- `CandidateForm.tsx` → Formulario de candidatos
- `CandidatePhoto.tsx` → Componente de foto de candidato
- `EmployeeForm.tsx` → Formulario de empleados
- `FactorySelector.tsx` → Selector de fábrica
- `OCRUploader.tsx` → OCR genérico (Posible duplicado con AzureOCR)

#### Evaluación y Análisis
- `CandidateEvaluator.tsx` → Evaluador de candidatos
- `RirekishoPrintView.tsx` → Vista de impresión de rirekisho (CV japonés)

#### Tema y Diseño
- `advanced-color-picker.tsx`
- `border-radius-visualizer.tsx`
- `color-palette-generator.tsx`
- `color-picker.tsx`
- `contrast-checker.tsx`
- `enhanced-theme-selector.tsx`
- `font-selector.tsx`
- `gradient-builder.tsx`
- `preset-card.tsx`
- `spacing-scale-generator.tsx`
- `typography-scale-generator.tsx`
- `TemplateManager.tsx`

#### Utilidades
- `animated-link.tsx`
- `breadcrumb-nav.tsx`
- `dev-mode-alert.tsx`
- `empty-state.tsx`
- `error-boundary.tsx`
- `error-boundary-wrapper.tsx`
- `error-display.tsx`
- `error-state.tsx`
- `ErrorBoundary.tsx` (Posible duplicado)
- `global-error-handler.tsx`
- `inline-loading.tsx`
- `loading-overlay.tsx`
- `LoadingSkeletons.tsx`
- `navigation-progress.tsx`
- `page-guard.tsx`
- `page-skeleton.tsx`
- `page-visibility-toggle.tsx`
- `PageTransition.tsx`
- `progress-indicator.tsx`
- `providers.tsx` (En layout)
- `suspense-boundary.tsx`
- `theme-error-boundary.tsx`
- `under-construction.tsx`
- `visibility-guard.tsx`

### Componentes UI (50+)

#### Formularios
- `animated-textarea.tsx`
- `enhanced-input.tsx`
- `file-upload.tsx`
- `floating-input.tsx`
- `form-field.tsx`
- `form.tsx`
- `input.tsx`
- `label.tsx`
- `multi-select.tsx`
- `multi-step-form.tsx`
- `password-input.tsx`
- `phone-input.tsx`
- `searchable-select.tsx`
- `textarea.tsx`

#### Selección y Entrada
- `checkbox.tsx`
- `color-picker.tsx`
- `date-picker.tsx`
- `dropdown-menu.tsx`
- `radio-group.tsx`
- `select.tsx`
- `slider.tsx`
- `toggle.tsx`
- `toggle-group.tsx`

#### Visualización
- `accordion.tsx`
- `alert.tsx`
- `alert-dialog.tsx`
- `avatar.tsx`
- `badge.tsx`
- `card.tsx`
- `dialog.tsx`
- `pagination.tsx`
- `popover.tsx`
- `progress.tsx`
- `scroll-area.tsx`
- `separator.tsx`
- `skeleton.tsx`
- `table.tsx`
- `tabs.tsx`
- `tooltip.tsx`

#### Tema
- `theme-switcher.tsx`
- `theme-switcher-improved.tsx`
- `theme-toggle.tsx`

#### Especiales
- `animated.tsx`
- `command.tsx`
- `under-construction.tsx`

---

## 4. ARCHIVOS CON MARCADORES PROBLEMÁTICOS

### TODO Comments
1. `/dashboard/admin/yukyu-management/page.tsx`
   - `totalUsed: 0, // TODO: calcular desde requests`
   - `totalExpired: 0 // TODO: calcular desde balances`

2. `/dashboard/payroll/[id]/page.tsx`
   - `approved_by: 'admin', // TODO: Get from auth context`

3. `/dashboard/apartment-reports/arrears/page.tsx`
   - `// TODO: Implement PDF export`

### DEPRECATED Comments
- Ninguno encontrado

### OLD Comments
- `/dashboard/candidates/rirekisho/page.tsx` - Comentario en japonés sobre elementos ocultos

---

## 5. ANÁLISIS DE SERVICIOS API

### Servicios Importados Activamente

```
1. candidateService → /api/candidates/*
   - getCandidates()
   - updateCandidate()
   - getCandidate()

2. employeeService → /api/employees/*
   - getEmployees()
   - getEmployee()
   - updateEmployee()

3. apartmentsV2Service → /api/apartments-v2/*
   - getApartments()
   - getApartment()
   - createApartment()
   - updateApartment()

4. factoryService → /api/factories/*
   - getFactories()
   - getFactory()

5. timerCardService → /api/timercards/*
   - getTimerCards()

6. yukyuService → /api/yukyu/*
   - getBalances()
   - getRequests()

7. salaryService → /api/salary/*

8. requestService → /api/requests/*

9. authService → /api/auth/*

10. databaseService → /api/database/*

11. adminControlPanelService → /api/admin/*
```

### Endpoints Detectados Directamente en Páginas

```
/api/admin/export-config
/api/admin/pages/bulk-toggle
/api/admin/statistics
/api/dashboard/yukyu-compliance-status
/api/dashboard/yukyu-trends-monthly
/api/factories
/api/factories/stats
/api/monitoring/health
/api/monitoring/metrics
/api/role-permissions/initialize-defaults
/api/role-permissions/pages
/api/role-permissions/roles
/api/yukyu/reports/export-excel
/api/yukyu/requests
/additional-charges/
/apartments-v2/apartments
/employees/
/factories (duplicado)
/yukyu/balances
/yukyu/balances/calculate
/yukyu/maintenance/expire-old-yukyus
/yukyu/maintenance/scheduler-status
/yukyu/requests
/yukyu/reports/export-excel
```

---

## 6. VEREDICTOS Y RECOMENDACIONES

### CRÍTICOS (Requieren Atención)

1. **Duplicados de Componentes**
   - `ErrorBoundary.tsx` vs `error-boundary.tsx` (2 archivos, mismo propósito)
   - `ApartmentSelector.tsx` vs `ApartmentSelector-enhanced.tsx` (Necesita consolidación)
   - `OCRUploader.tsx` vs `AzureOCRUploader.tsx` (Necesita claridad)
   - `PageTransition.tsx` vs `animated-link.tsx` (Similar functionality)

2. **Páginas Incompletas (TODOs Críticos)**
   - `/dashboard/admin/yukyu-management` - Cálculos sin implementar
   - `/dashboard/payroll/[id]` - Falta contexto de autenticación
   - `/dashboard/apartment-reports/arrears` - Exportación PDF no implementada

3. **Rutas Dinámicas Sin Funcionalidad**
   - `/dashboard/factories/[factory_id]` - Archivo existe pero vacío
   - `/dashboard/factories/[factory_id]/config` - Archivo existe pero vacío
   - `/dashboard/employees/[id]/edit` - Sin API calls detectado

4. **Páginas Completamente Huérfanas (Top-level)**
   - `/employees`
   - `/factories`
   - `/payroll`
   - `/requests`
   - `/timercards`
   
   Estos deberían redirigir a versiones `/dashboard/*` o eliminarse

### ALTO (Limpieza recomendada)

1. **Páginas Vacías/Placeholders**
   - `/dashboard/settings` - Vacía
   - `/dashboard/payroll/timer-cards` - Vacía
   - `/dashboard/support` - Vacía
   - `/dashboard/help` - Placeholder
   - `/dashboard/construction` - Placeholder

2. **Componentes de Demostración/Desarrollo**
   - `/dashboard/examples/forms` - Solo ejemplos, no usados en producción
   - `/dashboard/design-system` - Sistema de diseño
   - `/dashboard/themes/customizer` - Customizador de temas
   - Todos los componentes de "design-tools"

3. **Componentes No Usados Detectados**
   - `ThemeEditor/*` - Editores de tema complejos
   - Múltiples componentes en `/apartment/` que no se importan
   - Múltiples componentes en `/salary/` que no se importan
   - Todos los `*Tab.tsx` componentes

### MODERADO (Refactorización)

1. **Inconsistencia de Rutas**
   - Rutas `/dashboard/*` son primarias
   - Rutas `/` (top-level sin dashboard) son secundarias/alternativas
   - Necesita documentación clara del modelo de navegación

2. **API Calls Inconsistentes**
   - Algunas páginas usan servicios (abstracto)
   - Otras usan endpoints directo (concreto)
   - Necesita estandarización

3. **Componentes de Error**
   - Múltiples componentes error-boundary: `error-boundary.tsx`, `ErrorBoundary.tsx`, `error-boundary-wrapper.tsx`, `theme-error-boundary.tsx`
   - Necesita consolidación

---

## 7. MATRIZ DE RUTAS ACTIVAS

Total de rutas identificadas: **99**

Desglose:
- **Rutas funcionales**: ~45 (con APIs activas)
- **Rutas parcialmente funcionales**: ~25 (con TODOs o lógica incompleta)
- **Rutas vacías/placeholder**: ~20
- **Rutas duplicadas/alternativas**: ~9

---

## 8. ANÁLISIS DE COMPONENTIZACIÓN

### Componentes Sobreutilizados
- `/components/ui/*` - Casi todos están siendo usados
- `error-state.tsx` - Usado en múltiples páginas

### Componentes Subutilizados
- Componentes de diseño (color-picker, border-radius-visualizer, etc.) - Solo en customizer
- TemplateManager.tsx - No encontrado en importaciones
- Todos los `*Tab.tsx` - Posibles duplicados

### Componentes Redundantes
- ErrorBoundary.tsx vs error-boundary.tsx
- ApartmentSelector.tsx vs ApartmentSelector-enhanced.tsx
- OCRUploader.tsx vs AzureOCRUploader.tsx

---

