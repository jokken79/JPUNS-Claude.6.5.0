# ANÁLISIS COMPLETO DE ESTRUCTURA - UNS-ClaudeJP 5.4.1

## RESUMEN EJECUTIVO

Este es un HR Management System completo para agencias de staffing temporal japonesas (人材派遣会社).
La aplicación tiene **73 páginas frontend** y **27 routers backend** organizados en **8 módulos principales**.

---

## 1. MÓDULOS PRINCIPALES DEL PROYECTO

### Backend - Estructura `/backend/app/`
```
backend/app/
├── api/                    # 27 routers API
├── models/                 # SQLAlchemy ORM (13 tablas)
├── schemas/                # Pydantic validation models
├── services/               # Business logic layer
├── core/                   # Config, database, security
├── utils/                  # Utility functions
├── main.py                 # FastAPI entry point
└── migrations/             # Alembic database migrations
```

### Frontend - Estructura `/frontend/app/(dashboard)/`
```
frontend/app/
├── (dashboard)/            # 73+ páginas organizadas por módulo
├── page.tsx                # Landing page
├── login/                  # Authentication
├── profile/                # User profile
├── components/             # Reusable UI components
├── lib/                    # API client, utilities
└── stores/                 # Zustand state management
```

---

## 2. ROUTERS API BACKEND (27 TOTAL)

### Importación/Exportación de Datos
**Archivo**: `/backend/app/api/import_export.py` (301 líneas)
**Prefix**: `/api/import`
**Endpoints**:
1. `POST /api/import/employees` - Importar empleados desde Excel
2. `POST /api/import/timer-cards` - Importar tarjetas de tiempo
3. `POST /api/import/factory-configs` - Importar configuración de fábricas desde JSON
4. `GET /api/import/template/employees` - Descargar template Excel para empleados
5. `GET /api/import/template/timer-cards` - Descargar template Excel para tarjetas

### Importación Resiliente (Con Recuperación)
**Archivo**: `/backend/app/api/resilient_import.py` (374 líneas)
**Prefix**: `/api/resilient-import`
**Endpoints**:
1. `POST /api/resilient-import/employees` - Importar empleados con resiliencia
2. `POST /api/resilient-import/factories` - Importar fábricas con resiliencia
3. `GET /api/resilient-import/status/{operation_id}` - Obtener estado de importación
4. `POST /api/resilient-import/resume/{operation_id}` - Reanudar importación fallida
5. `GET /api/resilient-import/checkpoints` - Listar checkpoints disponibles
6. `GET /api/resilient-import/health` - Health check del sistema

### Otros Routers API Principales
| Archivo | Prefix | Función | Endpoints |
|---------|--------|---------|-----------|
| `auth.py` | `/api/auth` | Autenticación JWT | login, refresh, logout, validate |
| `candidates.py` | `/api/candidates` | Gestión de candidatos (履歴書) | CRUD, OCR, evaluate, approve, reject |
| `employees.py` | `/api/employees` | Gestión de empleados (派遣社員) | CRUD, assignment, import-excel |
| `factories.py` | `/api/factories` | Gestión de fábricas (派遣先) | CRUD, config, employees list |
| `timer_cards.py` | `/api/timer-cards` | Tarjetas de asistencia (タイムカード) | CRUD, upload, process, OCR |
| `payroll.py` | `/api/payroll` | Nóminas automáticas (給与) | CRUD, calculate, export |
| `salary.py` | `/api/salary` | Gestión de salarios | CRUD, calculations, reports |
| `requests.py` | `/api/requests` | Solicitudes de empleados | CRUD, workflow, approvals |
| `apartments_v2.py` | `/api/apartments` | Gestión de vivienda | CRUD, assignments, reports |
| `reports.py` | `/api/reports` | Reportes y PDF | Generate, export, templates |
| `database.py` | `/api/database` | Admin tools | Health, stats, maintenance |
| `admin.py` | `/api/admin` | Panel de administración | User management, logs, settings |
| `audit.py` | `/api/audit` | Audit logging | History, trail, compliance |
| `monitoring.py` | `/api/monitoring` | Health y métricas | Health check, metrics, status |
| `notifications.py` | `/api/notifications` | Email/LINE alerts | Send, templates, logs |
| `azure_ocr.py` | `/api/azure-ocr` | OCR Azure | Process, cache, status |
| `dashboard.py` | `/api/dashboard` | Widgets y analytics | Stats, charts, summaries |
| `contracts.py` | `/api/contracts` | Contratos | CRUD, templates, signatures |
| `settings.py` | `/api/settings` | Configuración | User prefs, app config |
| `role_permissions.py` | `/api/role-permissions` | RBAC | Roles, permissions, assignments |
| `yukyu.py` | `/api/yukyu` | Vacaciones pagadas (有給休暇) | CRUD, balance, requests |
| `pages.py` | `/api/pages` | Content management | Pages, navigation |

---

## 3. PÁGINAS FRONTEND (73 TOTAL)

### Módulo Candidatos (履歴書/Rirekisho)
**Ruta Base**: `(dashboard)/candidates/`
1. `page.tsx` - Lista de candidatos
2. `new/page.tsx` - Crear nuevo candidato
3. `[id]/page.tsx` - Detalle del candidato
4. `[id]/edit/page.tsx` - Editar candidato
5. `[id]/print/page.tsx` - Imprimir rirekisho
6. `rirekisho/page.tsx` - Vista especial de rirekisho

**Funcionalidades**:
- Importación de candidatos desde Excel
- OCR procesamiento de 履歴書 (resume)
- Evaluación automática
- Aprobación/rechazo de candidatos
- Fotografía y extracción de datos

### Módulo Empleados (派遣社員)
**Ruta Base**: `(dashboard)/employees/`
1. `page.tsx` - Lista de empleados
2. `new/page.tsx` - Crear nuevo empleado
3. `[id]/page.tsx` - Detalle del empleado
4. `[id]/edit/page.tsx` - Editar empleado
5. `excel-view/page.tsx` - Vista tipo Excel de empleados

**Funcionalidades**:
- Importación masiva desde Excel
- Vinculación con candidatos
- Asignación a fábricas
- Gestión de tipo de empleado (regular, contrato, staff)

### Módulo Fábricas (派遣先)
**Ruta Base**: `(dashboard)/factories/`
1. `page.tsx` - Lista de fábricas
2. `new/page.tsx` - Crear nueva fábrica
3. `[factory_id]/page.tsx` - Detalle de fábrica
4. `[factory_id]/config/page.tsx` - Configuración de fábrica

**Funcionalidades**:
- Gestión de sitios de trabajo
- Configuraciones específicas por fábrica
- Asignación de empleados

### Módulo Tarjetas de Tiempo (タイムカード)
**Ruta Base**: `(dashboard)/timercards/`
1. `page.tsx` - Lista/dashboard de tarjetas
2. `upload/page.tsx` - Carga de tarjetas (PDF con OCR)

**Funcionalidades**:
- Importación desde Excel
- OCR de PDFs de asistencia
- Matching automático de empleados
- Validación de datos

### Módulo Nóminas (給与/Payroll)
**Ruta Base**: `(dashboard)/payroll/`
1. `page.tsx` - Dashboard de nóminas
2. `create/page.tsx` - Crear nueva nómina
3. `[id]/page.tsx` - Detalle de nómina
4. `calculate/page.tsx` - Calculadora de nóminas
5. `settings/page.tsx` - Configuración de nóminas
6. `timer-cards/page.tsx` - Vinculación tarjetas-nómina
7. `yukyu-summary/page.tsx` - Resumen de vacaciones

**Módulo Alternativo**:
- `(dashboard)/salary/page.tsx` - Gestión de salarios
- `(dashboard)/salary/[id]/page.tsx` - Detalle de salario
- `(dashboard)/salary/reports/page.tsx` - Reportes de salarios

### Módulo Solicitudes/Workflows
**Ruta Base**: `(dashboard)/requests/`
1. `page.tsx` - Lista de solicitudes
2. `[id]/page.tsx` - Detalle de solicitud

**Funcionalidades**:
- Flujos de aprobación
- Tracking de estado

### Módulo Vivienda (アパート/Corporate Housing)
**Ruta Base**: `(dashboard)/apartments/`
1. `page.tsx` - Lista de apartamentos
2. `create/page.tsx` - Crear apartamento
3. `[id]/page.tsx` - Detalle de apartamento
4. `[id]/edit/page.tsx` - Editar apartamento
5. `[id]/assign/page.tsx` - Asignar empleado
6. `search/page.tsx` - Búsqueda avanzada

**Subruta**: `(dashboard)/apartment-assignments/`
1. `page.tsx` - Lista de asignaciones
2. `create/page.tsx` - Crear asignación
3. `[id]/page.tsx` - Detalle de asignación
4. `[id]/end/page.tsx` - Finalizar asignación
5. `transfer/page.tsx` - Transferencia entre apartamentos

**Subruta**: `(dashboard)/apartment-reports/`
1. `page.tsx` - Dashboard de reportes
2. `occupancy/page.tsx` - Tasa de ocupación
3. `costs/page.tsx` - Análisis de costos
4. `arrears/page.tsx` - Mora y deuda
5. `maintenance/page.tsx` - Mantenimiento

**Subruta**: `(dashboard)/apartment-calculations/`
1. `page.tsx` - Dashboard de cálculos
2. `total/page.tsx` - Cálculos totales
3. `prorated/page.tsx` - Cálculos prorrateados

### Módulo Vacaciones Pagadas (有給休暇/Yukyu)
**Ruta Base**: `(dashboard)/yukyu/`
1. `page.tsx` - Dashboard de vacaciones
2. `yukyu-requests/page.tsx` - Solicitudes de vacaciones
3. `yukyu-requests/create/page.tsx` - Crear solicitud
4. `yukyu-history/page.tsx` - Historial de vacaciones
5. `yukyu-reports/page.tsx` - Reportes de vacaciones

### Módulo Admin
**Ruta Base**: `(dashboard)/admin/`
1. `control-panel/page.tsx` - Panel de control principal
2. `audit-logs/page.tsx` - Logs de auditoría
3. `yukyu-management/page.tsx` - Gestión de vacaciones (admin)

### Módulo Reportes/Análisis
1. `(dashboard)/reports/page.tsx` - Reportes generales
2. `(dashboard)/monitoring/page.tsx` - Dashboard de monitoreo
3. `(dashboard)/monitoring/health/page.tsx` - Health checks
4. `(dashboard)/monitoring/performance/page.tsx` - Métricas de rendimiento
5. `(dashboard)/dashboard/page.tsx` - Dashboard principal

### Módulos Adicionales
- `(dashboard)/additional-charges/page.tsx` - Cargos adicionales
- `(dashboard)/rent-deductions/[year]/[month]/page.tsx` - Descuentos de renta
- `(dashboard)/design-system/page.tsx` - Design system showcase
- `(dashboard)/design-preferences/page.tsx` - Preferencias de diseño
- `(dashboard)/themes/page.tsx` - Galerías de temas
- `(dashboard)/themes/customizer/page.tsx` - Personalizador de temas
- `(dashboard)/settings/appearance/page.tsx` - Configuración visual
- `(dashboard)/examples/forms/page.tsx` - Formularios de ejemplo
- `(dashboard)/help/page.tsx` - Ayuda y documentación
- `(dashboard)/support/page.tsx` - Soporte
- `(dashboard)/terms/page.tsx` - Términos y condiciones
- `(dashboard)/privacy/page.tsx` - Privacidad
- `(dashboard)/construction/page.tsx` - En construcción
- `(dashboard)/keiri/yukyu-dashboard/page.tsx` - Dashboard de accounting

### Páginas Raíz (No dashboard)
1. `/page.tsx` - Landing page
2. `/login/page.tsx` - Login
3. `/profile/page.tsx` - Perfil de usuario
4. `/database-management/page.tsx` - Gestión de BD
5. `/under-construction/page.tsx` - En construcción

---

## 4. SCRIPTS DE IMPORTACIÓN BACKEND

### Directorio: `/backend/scripts/`

#### Scripts Principales de Importación
| Script | Tamaño | Propósito |
|--------|--------|----------|
| `import_data.py` | 50K | Script principal - Importa factories, employees, candidates (legacy) |
| `import_candidates_improved.py` | 20K | Importa candidatos desde JSON con 100% cobertura de campos (172 campos) |
| `import_access_candidates.py` | 26K | Importa candidatos desde Access database (.mdb) |
| `import_all_from_databasejp.py` | 15K | Importación completa desde legacy database |
| `import_factories_from_json.py` | 9.3K | Importa fábricas desde JSON |
| `import_candidates_from_json.py` | 3.8K | Importa candidatos desde JSON (simple) |
| `import_candidates_simple.py` | 4.6K | Versión simplificada |
| `import_demo_candidates.py` | 8.8K | Datos de demo para candidatos |
| `import_photos_from_json.py` | 9.6K | Importa fotografías desde JSON |
| `import_photos_from_json_simple.py` | 11K | Versión simplificada de fotos |
| `import_yukyu_data.py` | 9.1K | Importa datos de vacaciones pagadas |

#### Scripts de Sincronización/Validación
| Script | Propósito |
|--------|----------|
| `sync_candidate_employee_status.py` | Sincroniza estado entre candidatos y empleados |
| `sync_employee_data_advanced.py` | Sincronización avanzada de datos de empleados |
| `sync_employee_photos.py` | Sincroniza fotografías de empleados |
| `sync_photos_retroactive.py` | Sincronización retroactiva de fotos |
| `link_employees_to_candidates.py` | Vincula empleados con candidatos |
| `link_employees_to_factories.py` | Vincula empleados con fábricas |

#### Scripts de Gestión de Base de Datos
| Script | Propósito |
|--------|----------|
| `create_admin_user.py` | Crea/resetea usuario admin |
| `create_apartments_from_employees.py` | Genera apartamentos basados en empleados |
| `init_db.py` | Inicializa base de datos |
| `init_payroll_config.py` | Inicializa configuración de nóminas |
| `manage_db.py` | Gestión general de BD |
| `ensure_admin_user.py` | Asegura existencia de admin |
| `reset_admin_password.py` | Resetea contraseña de admin |
| `reset_admin_simple.py` | Reset simple de admin |
| `reset_admin_now.py` | Reset inmediato de admin |
| `fix_admin_password.py` | Corrige contraseña de admin |

#### Scripts de Extracción/Exportación
| Script | Propósito |
|--------|----------|
| `export_access_to_json.py` | Exporta datos de Access a JSON |
| `export_candidates_to_json.py` | Exporta candidatos a JSON |
| `extract_access_attachments.py` | Extrae attachments de Access |
| `extract_access_with_photos.py` | Extrae Access con fotografías |
| `extract_ole_photos_to_base64.py` | Extrae fotos OLE a Base64 |
| `extract_photos_from_access_db_v52.py` | Extrae fotos de Access |
| `extract_photos_fixed.py` | Extracción de fotos (versión fija) |

#### Scripts de Validación/Diagnóstico
| Script | Propósito |
|--------|----------|
| `verify.py` | Verificación general del sistema |
| `verify_all_apis.py` | Verifica todos los endpoints API |
| `verify_candidates_imported.py` | Verifica candidatos importados |
| `verify_factory_cascade.py` | Verifica cascada de fábricas |
| `verify_import_fixes.py` | Verifica correcciones de importación |
| `verify_migrations.py` | Verifica migraciones de BD |
| `verify_photo_integration.py` | Verifica integración de fotos |
| `verify_import_validates.py` | Valida importaciones |
| `verify_system_integrity.py` | Verifica integridad del sistema |
| `validate_imports.py` | Valida datos importados |
| `validate_system.py` | Validación general del sistema |
| `validate_factories_json.py` | Valida JSON de fábricas |

#### Scripts Especializados
| Script | Propósito |
|--------|----------|
| `resilient_importer.py` | Importador con resiliencia y checkpoints |
| `simple_importer.py` | Importador simple y básico |
| `populate_reference_tables.py` | Puebla tablas de referencia |
| `populate_page_visibility.py` | Configura visibilidad de páginas |
| `populate_workplaces_from_excel.py` | Puebla workplaces desde Excel |
| `delete_factory.py` | Elimina una fábrica |
| `check_factory_names.py` | Valida nombres de fábricas |
| `list_factories_with_employees.py` | Lista fábricas con empleados |
| `analyze_excel_structure.py` | Analiza estructura de Excel |
| `analyze_table_structure.py` | Analiza estructura de tablas |
| `compare_excel.py` | Compara archivos Excel |
| `check_photo_order.py` | Verifica orden de fotos |
| `check_photos.py` | Chequea fotografías |
| `analyze_old_photos.py` | Analiza fotos antiguas |
| `clear_candidates.py` | Limpia candidatos |
| `test_photo_compression.py` | Prueba compresión de fotos |
| `test_yukyu_system.py` | Prueba sistema de vacaciones |
| `seed_salary_data.py` | Siembra datos de salarios |
| `unified_photo_import.py` | Importación unificada de fotos |
| `diagnostico_ocr.py` | Diagnóstico de OCR |
| `fix_factories_json.py` | Corrige JSON de fábricas |
| `fix_photo_data.py` | Corrige datos de fotos |
| `fix_employee_photos.py` | Corrige fotos de empleados |
| `create_employee_view.py` | Crea vista de empleados |
| `inspect_photos.py` | Inspecciona fotografías |
| `load_factories_from_json.py` | Carga fábricas desde JSON |
| `load_photos_from_json.py` | Carga fotos desde JSON |
| `generate_hash.py` | Genera hash de contraseña |
| `check_pmi_otsuka.py` | Verifica PMI Otsuka |
| `migrate_corporate_housing.py` | Migra vivienda corporativa |

**Total**: 87 scripts Python en backend/scripts

---

## 5. SERVICIOS BACKEND (Business Logic)

### Ubicación: `/backend/app/services/`

| Servicio | Propósito |
|----------|----------|
| `import_service.py` | Lógica de importación desde Excel/JSON |
| `candidate_service.py` | Gestión de candidatos |
| `employee_service.py` | Gestión de empleados |
| `payroll_service.py` | Cálculos de nóminas |
| `salary_service.py` | Gestión de salarios |
| `timer_card_ocr_service.py` | OCR de tarjetas de tiempo |
| `azure_ocr_service.py` | Integración con Azure OCR |
| `hybrid_ocr_service.py` | OCR híbrido (Azure + EasyOCR + Tesseract) |
| `easyocr_service.py` | Integración con EasyOCR |
| `tesseract_ocr_service.py` | Integración con Tesseract |
| `face_detection_service.py` | Detección de rostros (MediaPipe) |
| `apartment_service.py` | Gestión de apartamentos |
| `assignment_service.py` | Gestión de asignaciones |
| `yukyu_service.py` | Gestión de vacaciones pagadas |
| `notification_service.py` | Email/LINE notifications |
| `report_service.py` | Generación de reportes |
| `payroll_integration_service.py` | Integración de nóminas |
| `payslip_service.py` | Generación de nóminas |
| `audit_service.py` | Auditoría y logging |
| `auth_service.py` | Autenticación JWT |
| `additional_charge_service.py` | Cargos adicionales |
| `deduction_service.py` | Descuentos y retenciones |
| `employee_matching_service.py` | Matching de empleados |
| `ocr_cache_service.py` | Cache de OCR |
| `ocr_weighting.py` | Weighting para OCR |
| `photo_service.py` | Gestión de fotografías |
| `config_service.py` | Configuración de sistema |
| `salary_export_service.py` | Exportación de salarios |

---

## 6. COMPONENTES FRONTEND DE IMPORTACIÓN

### Ubicación: `/frontend/components/`

| Componente | Propósito |
|-----------|----------|
| `components/ui/file-upload.tsx` | Componente genérico de carga de archivos |
| `components/admin/import-config-dialog.tsx` | Diálogo para configurar importación |

### Características del FileUpload
- Drag & drop
- Validación de archivo
- Progress bar
- Preview de imágenes
- Soporte múltiple archivos
- Límites de tamaño configurable

---

## 7. FLUJO DE IMPORTACIÓN COMPLETO

### Opción 1: Vía API REST (Frontend UI)

```
Usuario abre Frontend
    ↓
Selecciona módulo (Candidates/Employees/Factories)
    ↓
Click "Importar"
    ↓
FileUpload component
    ↓
Selecciona archivo (Excel/JSON/PDF)
    ↓
Frontend envía: POST /api/import/[resource]
    ↓
Backend: import_export.py router
    ↓
ImportService procesa archivo
    ↓
Valida datos
    ↓
Inserta en BD con transacciones
    ↓
Retorna reporte de éxito/errores
```

### Opción 2: Vía Script Python (Backend Directo)

```
Ejecutar script: python backend/scripts/import_X.py
    ↓
Lee archivo (Excel/JSON/Access)
    ↓
Procesa filas/registros
    ↓
Mapea a modelos SQLAlchemy
    ↓
Valida campos requeridos
    ↓
Crea/actualiza registros
    ↓
Commit a PostgreSQL
    ↓
Genera reporte
```

### Opción 3: Vía Importador Resiliente (Con Checkpoints)

```
POST /api/resilient-import/[resource]
    ↓
ImportOrchestrator crea operation_id
    ↓
Valida prerequisites
    ↓
Carga archivo y shapea datos
    ↓
Procesa en batches con savepoints
    ↓
Almacena checkpoints cada N registros
    ↓
Si falla: puede reanudar desde checkpoint
    ↓
GET /api/resilient-import/status/{operation_id}
    ↓
Obtiene estado actual
    ↓
POST /api/resilient-import/resume/{operation_id}
    ↓
Continúa desde último checkpoint
```

---

## 8. CAMPOS IMPORTABLES POR MÓDULO

### Candidatos (Rirekisho - 履歴書)
- 172+ campos totales mapeados
- Datos personales: nombre, kana, roman, DOB, sexo, nacionalidad
- Contacto: teléfono, email, dirección, código postal
- Documentos: visa, zairyu card, permiso de conducir
- Fotografía: face detection automático, Base64 storage
- Familia: referentes de emergencia
- Experiencia: trabajos previos, habilidades
- Evaluación: estado, calificación, aprobación/rechazo
- Notas: observaciones y historial

### Empleados (派遣社員)
- ID de empleado (hakenmoto_id)
- Nombre completo (kanji/kana/roman)
- Fecha de nacimiento
- Sexo, nacionalidad
- Contacto completo
- Dirección y código postal
- Información de visa
- Vínculo con rirekisho (rirekisho_id)
- Asignación a fábrica (factory_id)
- Tipo de empleado (employee_type)
- Estado: activo/inactivo
- Datos de nómina

### Tarjetas de Tiempo (タイムカード)
- Fecha de trabajo (work_date)
- ID/nombre de empleado (auto-matching)
- Hora de entrada (clock_in)
- Hora de salida (clock_out)
- Minutos de descanso (break_minutes)
- Factory_id para contexto
- Validación automática

### Fábricas (派遣先)
- ID de fábrica (factory_id)
- Nombre de compañía (company_name)
- Nombre de planta (plant_name)
- Prefectura (prefecture)
- Dirección completa
- Teléfono/contacto
- Configuración específica

### Nóminas (給与)
- Período (year/month)
- ID de empleado
- Salario base (base_salary)
- Cálculos: horas, tasa, deducción
- Impuestos: income tax, social insurance
- Bonificaciones y cargos
- Deducciones de renta
- Monto final neto

---

## 9. RUTAS DE API COMPLETAS

### Importación Estándar
```
POST   /api/import/employees              # Importar empleados
POST   /api/import/timer-cards            # Importar tarjetas
POST   /api/import/factory-configs        # Importar fábricas
GET    /api/import/template/employees     # Template Excel
GET    /api/import/template/timer-cards   # Template Excel
```

### Importación Resiliente
```
POST   /api/resilient-import/employees     # Importar con checkpoints
POST   /api/resilient-import/factories     # Importar fábricas resiliente
GET    /api/resilient-import/status/{id}   # Estado de operación
POST   /api/resilient-import/resume/{id}   # Reanudar import
GET    /api/resilient-import/checkpoints   # Listar checkpoints
GET    /api/resilient-import/health        # Health check
```

### Candidatos
```
GET    /api/candidates                     # Lista
POST   /api/candidates                     # Crear
GET    /api/candidates/{id}                # Detalle
PUT    /api/candidates/{id}                # Actualizar
DELETE /api/candidates/{id}                # Eliminar
POST   /api/candidates/{id}/evaluate       # Evaluar
POST   /api/candidates/{id}/approve        # Aprobar
POST   /api/candidates/{id}/reject         # Rechazar
POST   /api/candidates/{id}/upload         # Subir documento
POST   /api/candidates/ocr/process         # Procesar OCR
```

### Empleados
```
GET    /api/employees                      # Lista
POST   /api/employees                      # Crear
GET    /api/employees/{id}                 # Detalle
PUT    /api/employees/{id}                 # Actualizar
DELETE /api/employees/{id}                 # Eliminar
POST   /api/employees/{id}/terminate       # Terminar
POST   /api/employees/{id}/restore         # Restaurar
POST   /api/employees/import-excel         # Importar desde Excel
```

### Fábricas
```
GET    /api/factories                      # Lista
POST   /api/factories                      # Crear
GET    /api/factories/{id}                 # Detalle
PUT    /api/factories/{id}                 # Actualizar
DELETE /api/factories/{id}                 # Eliminar
GET    /api/factories/{id}/config          # Configuración
PUT    /api/factories/{id}/config          # Actualizar config
GET    /api/factories/{id}/employees       # Empleados de fábrica
```

### Tarjetas de Tiempo
```
GET    /api/timer-cards                    # Lista
POST   /api/timer-cards                    # Crear
GET    /api/timer-cards/{id}               # Detalle
PUT    /api/timer-cards/{id}               # Actualizar
DELETE /api/timer-cards/{id}               # Eliminar
POST   /api/timer-cards/upload             # Subir PDF
```

---

## 10. ESTRUCTURA DE DATOS

### Tablas Base (13 total)

| Tabla | Propósito | Registros típicos |
|-------|----------|------------------|
| `users` | Usuarios del sistema | 5-10 |
| `candidates` | Candidatos (履歴書) | 1,000+ |
| `employees` | Empleados activos | 500+ |
| `contract_workers` | Trabajadores por contrato | 200+ |
| `staff` | Personal administrativo | 50+ |
| `factories` | Sitios de trabajo (派遣先) | 100+ |
| `apartments` | Vivienda corporativa | 200+ |
| `documents` | Documentos adjuntos | 2,000+ |
| `contracts` | Contratos | 500+ |
| `timer_cards` | Tarjetas de tiempo | 50,000+ |
| `salary_calculations` | Cálculos de nómina | 10,000+ |
| `requests` | Solicitudes de empleados | 1,000+ |
| `audit_log` | Logs de auditoría | 100,000+ |

---

## 11. RESUMEN ESTADÍSTICO

| Métrica | Cantidad |
|---------|----------|
| **Total Routers API** | 27 |
| **Endpoints de Importación** | 11 (5 standard + 6 resiliente) |
| **Páginas Frontend** | 73+ |
| **Scripts de Importación** | 87 |
| **Servicios Backend** | 28 |
| **Tablas BD** | 13 |
| **Módulos Principales** | 8 |
| **Campos de Candidato** | 172+ |
| **Componentes UI** | 50+ (Shadcn/ui) |
| **Temas disponibles** | 12 predefinidos + custom |

---

## 12. FLUJOS DE IMPORTACIÓN DISPONIBLES

### 1. Importación Simple (Excel → API)
- Uploading simple de Excel
- Validación básica
- Inserción inmediata
- Reporteimple

### 2. Importación Masiva (Python Scripts)
- Batch processing
- Validación avanzada
- Logging completo
- Soporte para múltiples formatos

### 3. Importación Resiliente (Checkpoints)
- Saves automáticos cada N registros
- Resume desde fallos
- Idempotencia garantizada
- Detailed logging

### 4. Importación desde Legacy
- Access database
- JSON exports
- CSV/Excel
- Fotografías en Base64

---

## CONCLUSIÓN

UNS-ClaudeJP es un sistema **enterprise-grade** con:
- Múltiples opciones de importación (API, Scripts, Resiliente)
- Cobertura completa de módulos HR (candidatos, empleados, nóminas, vivienda)
- 73 páginas frontend especializadas
- 87 scripts Python para automatización
- OCR híbrido para procesamiento de documentos
- Auditoría y compliance completos
- Sistema de recuperación ante fallos

