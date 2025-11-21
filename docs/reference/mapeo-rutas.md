# MAPEO VISUAL DE RUTAS - UNS-ClaudeJP

## ESTRUCTURA DE RUTAS API

```
┌─ /api/import                    (import_export.py)
│  ├─ POST   /employees           → Importar empleados Excel
│  ├─ POST   /timer-cards         → Importar tarjetas Excel
│  ├─ POST   /factory-configs     → Importar fábricas JSON
│  ├─ GET    /template/employees  → Descargar template
│  └─ GET    /template/timer-cards → Descargar template
│
├─ /api/resilient-import          (resilient_import.py)
│  ├─ POST   /employees           → Importar con checkpoints
│  ├─ POST   /factories           → Importar fábricas resiliente
│  ├─ GET    /status/{op_id}      → Ver estado importación
│  ├─ POST   /resume/{op_id}      → Reanudar importación
│  ├─ GET    /checkpoints         → Listar checkpoints
│  └─ GET    /health              → Health check
│
├─ /api/candidates                (candidates.py)
│  ├─ GET    /                    → Listar candidatos
│  ├─ POST   /                    → Crear candidato
│  ├─ GET    /{id}                → Detalle
│  ├─ PUT    /{id}                → Actualizar
│  ├─ DELETE /{id}                → Eliminar
│  ├─ POST   /{id}/evaluate       → Evaluar
│  ├─ POST   /{id}/approve        → Aprobar
│  ├─ POST   /{id}/reject         → Rechazar
│  ├─ POST   /{id}/upload         → Subir documento
│  ├─ POST   /{id}/restore        → Restaurar
│  ├─ POST   /rirekisho/form      → Guardar formulario
│  ├─ POST   /ocr/process         → Procesar OCR
│  └─ OPTIONS /ocr/process        → CORS preflight
│
├─ /api/employees                 (employees.py)
│  ├─ GET    /                    → Listar empleados
│  ├─ POST   /                    → Crear empleado
│  ├─ GET    /available-for-apt   → Disponibles para apt.
│  ├─ GET    /{id}                → Detalle
│  ├─ PUT    /{id}                → Actualizar
│  ├─ DELETE /{id}                → Eliminar
│  ├─ POST   /{id}/terminate      → Terminar
│  ├─ POST   /{id}/restore        → Restaurar
│  ├─ PUT    /{id}/yukyu          → Actualizar vacaciones
│  ├─ PATCH  /{id}/change-type    → Cambiar tipo
│  ├─ POST   /import-excel        → Importar Excel
│  └─ GET    /by-rirekisho/{rid}  → Buscar por rirekisho
│
├─ /api/factories                 (factories.py)
│  ├─ GET    /                    → Listar fábricas
│  ├─ POST   /                    → Crear fábrica
│  ├─ GET    /stats               → Estadísticas
│  ├─ GET    /{id}                → Detalle
│  ├─ PUT    /{id}                → Actualizar
│  ├─ DELETE /{id}                → Eliminar
│  ├─ GET    /{id}/config         → Obtener config
│  ├─ PUT    /{id}/config         → Actualizar config
│  ├─ POST   /{id}/config/validate → Validar config
│  └─ GET    /{id}/employees      → Empleados de fábrica
│
├─ /api/timer-cards              (timer_cards.py)
│  ├─ GET    /                    → Listar tarjetas
│  ├─ POST   /                    → Crear tarjeta
│  ├─ GET    /{id}                → Detalle
│  ├─ PUT    /{id}                → Actualizar
│  ├─ DELETE /{id}                → Eliminar
│  ├─ POST   /upload              → Subir PDF
│  └─ POST   /process             → Procesar
│
├─ /api/payroll                   (payroll.py)
│  ├─ GET    /                    → Dashboard
│  ├─ POST   /create              → Crear nómina
│  ├─ GET    /{id}                → Detalle
│  ├─ PUT    /{id}                → Actualizar
│  ├─ POST   /calculate           → Calcular
│  ├─ POST   /settings            → Config
│  └─ POST   /export              → Exportar
│
├─ /api/salary                    (salary.py)
│  ├─ GET    /                    → Listar salarios
│  ├─ POST   /                    → Crear
│  ├─ GET    /{id}                → Detalle
│  ├─ PUT    /{id}                → Actualizar
│  ├─ DELETE /{id}                → Eliminar
│  └─ GET    /reports             → Reportes
│
├─ /api/apartments                (apartments_v2.py)
│  ├─ GET    /                    → Listar apartamentos
│  ├─ POST   /                    → Crear apartamento
│  ├─ GET    /{id}                → Detalle
│  ├─ PUT    /{id}                → Actualizar
│  ├─ DELETE /{id}                → Eliminar
│  ├─ GET    /{id}/assignments    → Asignaciones
│  └─ POST   /{id}/assign         → Asignar empleado
│
├─ /api/auth                      (auth.py)
│  ├─ POST   /login               → Login
│  ├─ POST   /refresh             → Refresh token
│  ├─ POST   /logout              → Logout
│  ├─ POST   /validate            → Validar token
│  └─ POST   /verify              → Verificar
│
├─ /api/requests                  (requests.py)
│  ├─ GET    /                    → Listar solicitudes
│  ├─ POST   /                    → Crear solicitud
│  ├─ GET    /{id}                → Detalle
│  ├─ PUT    /{id}                → Actualizar
│  ├─ DELETE /{id}                → Eliminar
│  ├─ POST   /{id}/approve        → Aprobar
│  └─ POST   /{id}/reject         → Rechazar
│
├─ /api/reports                   (reports.py)
│  ├─ GET    /                    → Listar reportes
│  ├─ POST   /generate            → Generar reporte
│  ├─ GET    /{id}                → Descargar
│  └─ POST   /export              → Exportar
│
├─ /api/monitoring                (monitoring.py)
│  ├─ GET    /health              → Health check
│  ├─ GET    /metrics             → Métricas
│  ├─ GET    /status              → Estado
│  └─ GET    /performance         → Rendimiento
│
├─ /api/admin                     (admin.py)
│  ├─ GET    /users               → Listar usuarios
│  ├─ POST   /users               → Crear usuario
│  ├─ PUT    /users/{id}          → Actualizar usuario
│  ├─ DELETE /users/{id}          → Eliminar usuario
│  ├─ GET    /settings            → Configuración
│  └─ PUT    /settings            → Actualizar config
│
├─ /api/audit                     (audit.py)
│  ├─ GET    /logs                → Listar logs
│  ├─ GET    /logs/{id}           → Detalle log
│  ├─ GET    /trail               → Trail de cambios
│  └─ GET    /export              → Exportar logs
│
├─ /api/notifications             (notifications.py)
│  ├─ POST   /send                → Enviar notificación
│  ├─ GET    /templates           → Listar templates
│  ├─ POST   /templates           → Crear template
│  └─ GET    /logs                → Logs de notificaciones
│
├─ /api/yukyu                     (yukyu.py)
│  ├─ GET    /                    → Listar vacaciones
│  ├─ POST   /                    → Crear
│  ├─ GET    /{id}                → Detalle
│  ├─ PUT    /{id}                → Actualizar
│  ├─ DELETE /{id}                → Eliminar
│  ├─ GET    /balance/{emp_id}    → Balance de días
│  ├─ GET    /history/{emp_id}    → Historial
│  └─ POST   /approve/{id}        → Aprobar solicitud
│
├─ /api/dashboard                 (dashboard.py)
│  ├─ GET    /summary             → Resumen
│  ├─ GET    /stats               → Estadísticas
│  ├─ GET    /charts              → Gráficos
│  └─ GET    /widgets             → Widgets
│
├─ /api/database                  (database.py)
│  ├─ GET    /health              → Health check BD
│  ├─ GET    /stats               → Estadísticas
│  ├─ POST   /backup              → Backup
│  ├─ POST   /restore             → Restore
│  └─ GET    /tables              → Info tablas
│
└─ /api/settings                  (settings.py)
   ├─ GET    /                    → Configuración
   ├─ PUT    /                    → Actualizar
   ├─ GET    /user                → Prefs usuario
   └─ PUT    /user                → Actualizar prefs
```

---

## ESTRUCTURA DE RUTAS FRONTEND

```
/                                    Landing page
├─ /login                            Página de login
├─ /profile                          Perfil de usuario
├─ /database-management              Gestión BD
├─ /under-construction               En construcción
│
└─ /(dashboard)/                     DASHBOARD PRINCIPAL
   ├─ /dashboard                     Dashboard principal
   │
   ├─ MÓDULO CANDIDATOS (6 páginas)
   │  ├─ /candidates                 Lista de candidatos
   │  ├─ /candidates/new             Crear candidato
   │  ├─ /candidates/[id]            Detalle candidato
   │  ├─ /candidates/[id]/edit       Editar candidato
   │  ├─ /candidates/[id]/print      Imprimir rirekisho
   │  └─ /candidates/rirekisho       Vista rirekisho
   │
   ├─ MÓDULO EMPLEADOS (5 páginas)
   │  ├─ /employees                  Lista de empleados
   │  ├─ /employees/new              Crear empleado
   │  ├─ /employees/[id]             Detalle empleado
   │  ├─ /employees/[id]/edit        Editar empleado
   │  └─ /employees/excel-view       Vista tipo Excel
   │
   ├─ MÓDULO FÁBRICAS (4 páginas)
   │  ├─ /factories                  Lista de fábricas
   │  ├─ /factories/new              Crear fábrica
   │  ├─ /factories/[id]             Detalle fábrica
   │  └─ /factories/[id]/config      Configuración
   │
   ├─ MÓDULO TARJETAS TIEMPO (2 páginas)
   │  ├─ /timercards                 Dashboard tarjetas
   │  └─ /timercards/upload          Cargar tarjetas
   │
   ├─ MÓDULO NÓMINAS (7 páginas)
   │  ├─ /payroll                    Dashboard nóminas
   │  ├─ /payroll/create             Crear nómina
   │  ├─ /payroll/[id]               Detalle nómina
   │  ├─ /payroll/calculate          Calculadora
   │  ├─ /payroll/settings           Configuración
   │  ├─ /payroll/timer-cards        Vincular tarjetas
   │  └─ /payroll/yukyu-summary      Resumen vacaciones
   │
   ├─ MÓDULO SALARIOS (3 páginas)
   │  ├─ /salary                     Gestión salarios
   │  ├─ /salary/[id]                Detalle salario
   │  └─ /salary/reports             Reportes
   │
   ├─ MÓDULO APARTAMENTOS (12 páginas)
   │  ├─ /apartments                 Lista apartamentos
   │  ├─ /apartments/create          Crear apartamento
   │  ├─ /apartments/[id]            Detalle apartamento
   │  ├─ /apartments/[id]/edit       Editar apartamento
   │  ├─ /apartments/[id]/assign     Asignar empleado
   │  ├─ /apartments/search          Búsqueda avanzada
   │  ├─ /apartment-assignments      Listar asignaciones
   │  ├─ /apartment-assignments/create Crear asignación
   │  ├─ /apartment-assignments/[id] Detalle asignación
   │  ├─ /apartment-assignments/[id]/end Finalizar
   │  ├─ /apartment-assignments/transfer Transferencia
   │  └─ REPORTES Y CÁLCULOS (8 páginas)
   │     ├─ /apartment-reports       Dashboard reportes
   │     ├─ /apartment-reports/occupancy Ocupación
   │     ├─ /apartment-reports/costs  Costos
   │     ├─ /apartment-reports/arrears Mora
   │     ├─ /apartment-reports/maintenance Mantenimiento
   │     ├─ /apartment-calculations   Dashboard cálculos
   │     ├─ /apartment-calculations/total Cálculos totales
   │     └─ /apartment-calculations/prorated Prorrateados
   │
   ├─ MÓDULO VACACIONES (5 páginas)
   │  ├─ /yukyu                      Dashboard vacaciones
   │  ├─ /yukyu-requests             Solicitudes
   │  ├─ /yukyu-requests/create      Crear solicitud
   │  ├─ /yukyu-history              Historial
   │  └─ /yukyu-reports              Reportes
   │
   ├─ MÓDULO SOLICITUDES (2 páginas)
   │  ├─ /requests                   Lista de solicitudes
   │  └─ /requests/[id]              Detalle solicitud
   │
   ├─ MÓDULO ADMIN (3 páginas)
   │  ├─ /admin/control-panel        Panel de control
   │  ├─ /admin/audit-logs           Logs de auditoría
   │  └─ /admin/yukyu-management     Gestión vacaciones
   │
   ├─ MÓDULO REPORTES (5 páginas)
   │  ├─ /reports                    Reportes generales
   │  ├─ /monitoring                 Dashboard monitoreo
   │  ├─ /monitoring/health          Health checks
   │  ├─ /monitoring/performance     Métricas rendimiento
   │  └─ /keiri/yukyu-dashboard      Dashboard accounting
   │
   ├─ MÓDULO CONFIGURACIÓN (3 páginas)
   │  ├─ /settings/appearance        Configuración visual
   │  ├─ /themes                     Galerías de temas
   │  └─ /themes/customizer          Personalizador
   │
   └─ PÁGINAS ADICIONALES (8 páginas)
      ├─ /additional-charges         Cargos adicionales
      ├─ /rent-deductions/[año]/[mes] Descuentos renta
      ├─ /design-system              Design system
      ├─ /design-preferences         Preferencias diseño
      ├─ /examples/forms             Formularios ejemplo
      ├─ /help                       Ayuda
      ├─ /support                    Soporte
      ├─ /terms                      Términos
      ├─ /privacy                    Privacidad
      └─ /construction               En construcción
```

---

## FLUJO DE DATOS - IMPORTACIÓN

```
OPCIÓN 1: VÍA UI WEB (Cliente)
═════════════════════════════════════════════

Usuario Frontend
    │
    ├─→ selecciona módulo (Candidates/Employees/Factories)
    │
    ├─→ click "Importar" / "Upload"
    │
    ├─→ FileUpload Component
    │   ├─ Validación de archivo
    │   ├─ Validación de tamaño
    │   └─ Preview
    │
    ├─→ POST /api/import/[resource]
    │   ├─ Archivo en FormData
    │   └─ Parámetros query (factory_id, año, mes)
    │
    └─→ Backend recibe


OPCIÓN 2: VÍA BACKEND SCRIPTS (Servidor)
═════════════════════════════════════════════

Ejecutar en CLI:
$ python /backend/scripts/import_X.py

    ├─→ Lee archivo (Excel/JSON/Access)
    │
    ├─→ Valida formato y estructura
    │
    ├─→ Procesa cada fila/registro
    │   ├─ Mapea a modelo SQLAlchemy
    │   ├─ Valida campos requeridos
    │   ├─ Transforma datos (dates, ints, etc)
    │   └─ Vincula relaciones (FK)
    │
    ├─→ Batch commit cada N registros
    │   └─ Savepoint para rollback
    │
    └─→ Genera reporte de éxito/errores


OPCIÓN 3: VÍA RESILIENT IMPORTER (Con Recuperación)
═════════════════════════════════════════════════════

POST /api/resilient-import/[resource]

    ├─→ ImportOrchestrator.start()
    │   └─ Crea operation_id único
    │
    ├─→ ValidatePrerequisites()
    │   ├─ Verifica BD disponible
    │   ├─ Verifica storage checkpoint
    │   └─ Valida estructura archivo
    │
    ├─→ LoadAndShape()
    │   └─ Lee en memoria (streaming si grande)
    │
    ├─→ ProcessInBatches()
    │   ├─ Procesa 100 registros por batch
    │   ├─ Transacción parcial (savepoint)
    │   ├─ Almacena checkpoint
    │   └─ Continúa si error
    │
    ├─ SI FALLA EN BATCH N:
    │   │
    │   ├─ Almacena checkpoint con N-1
    │   │
    │   └─ Retorna:
    │       ├─ operation_id para reanudar
    │       ├─ Estadísticas parciales
    │       └─ Línea de error
    │
    ├─→ GET /api/resilient-import/status/{operation_id}
    │   └─ Verifica estado actual
    │
    └─→ POST /api/resilient-import/resume/{operation_id}
        └─ Continúa desde último checkpoint


PROCESAMIENTO EN BACKEND
═════════════════════════

Recibe POST /api/import/[resource]
    │
    ├─→ import_export.py router
    │
    ├─→ _write_upload_to_temp()
    │   └─ Guarda en /upload/import_temp/
    │
    ├─→ ImportService.import_X_from_excel()
    │
    ├─→ Valida datos
    │   ├─ Campos requeridos
    │   ├─ Tipos correctos
    │   ├─ Referencias válidas (FK)
    │   └─ Duplicados
    │
    ├─→ Mapea a modelos
    │
    ├─→ Inserta en BD
    │   ├─ INSERT nuevos
    │   ├─ UPDATE existentes
    │   └─ ON CONFLICT handling
    │
    ├─→ Limpia temp file
    │
    └─→ Retorna JSON
        ├─ success: bool
        ├─ imported: int
        ├─ failed: int
        ├─ errors: list
        └─ warnings: list
```

---

## RELACIONES DE DATOS

```
users (autenticación)
  │
  ├─→ candidates (履歴書)
  │   ├─ user_id (who created)
  │   ├─ 172+ campos de datos personales
  │   ├─ photo_data_url (Base64)
  │   └─ status (applicant/candidate/approved/rejected)
  │
  ├─→ employees (派遣社員)
  │   ├─ hakenmoto_id (PK)
  │   ├─ rirekisho_id (FK → candidates) ◄── VINCULACIÓN
  │   ├─ factory_id (FK → factories)    ◄── ASIGNACIÓN
  │   ├─ apartment_id (FK → apartments) ◄── VIVIENDA
  │   └─ employee_type (regular/contract/staff)
  │
  ├─→ contract_workers (請負社員)
  │   ├─ worker_id
  │   └─ factories (many-to-many)
  │
  ├─→ staff (スタッフ)
  │   ├─ staff_id
  │   └─ role, permissions
  │
  ├─→ factories (派遣先)
  │   ├─ factory_id (PK)
  │   ├─ company_name, plant_name
  │   ├─ employees (one-to-many) ◄── EMPLEADOS ASIGNADOS
  │   └─ config (factory-specific settings)
  │
  ├─→ apartments (アパート)
  │   ├─ apartment_id (PK)
  │   ├─ employees (one-to-many via assignment)
  │   └─ assignments (housing assignments)
  │
  ├─→ timer_cards (タイムカード)
  │   ├─ employee_id (FK)
  │   ├─ factory_id (FK)
  │   └─ work_date, clock_in, clock_out
  │
  ├─→ salary_calculations (給与)
  │   ├─ employee_id (FK)
  │   ├─ year, month, period
  │   ├─ base_salary, bonuses, deductions
  │   └─ net_amount
  │
  ├─→ requests (申請)
  │   ├─ employee_id (FK)
  │   ├─ request_type (leave, transfer, etc)
  │   └─ status (pending/approved/rejected)
  │
  └─→ audit_log (監査ログ)
      ├─ user_id (who did it)
      ├─ entity_type (what was changed)
      ├─ entity_id (which record)
      ├─ action (CREATE/UPDATE/DELETE)
      └─ changes (before/after JSON)
```

---

## CAMPOS POR MÓDULO

### CANDIDATOS (172+ campos)
```
Personales:       rirekisho_id, full_name_kanji, full_name_kana,
                  full_name_roman, date_of_birth, gender, nationality

Contacto:         email, phone_number, phone_mobile,
                  postal_code, address

Visa:             visa_type, residence_card_number,
                  visa_expiration_date, visa_status

Documentos:       driver_license, passport, zairyu_card,
                  photo_data_url (Base64 con face detection)

Familia:          emergency_contact, family_members,
                  dependents

Experiencia:      previous_jobs, skills, languages,
                  certifications

Evaluación:       status (applicant/candidate/approved/rejected),
                  evaluation_score, notes, approval_date
```

### EMPLEADOS
```
ID:               hakenmoto_id (PK), employee_id (FK)
Nombre:           full_name_kanji, full_name_kana, full_name_roman
Fechas:           date_of_birth, hire_date, end_date
Contacto:         email, phone, address, postal_code
Documentos:       passport, residence_card, visa_type,
                  visa_expiration
Asignación:       rirekisho_id (→ candidato),
                  factory_id (→ fábrica)
Vivienda:         apartment_id (→ apartamento)
Nómina:           salary_base, salary_notes, yukyu_balance
Estado:           active/inactive, employee_type
```

### FÁBRICAS
```
ID:               factory_id (PK)
Nombre:           company_name, plant_name
Ubicación:        prefecture, address, postal_code
Contacto:         phone, email, contact_person
Operacional:      operating_hours, holidays, max_capacity
Config:           special_rules, requirements, certifications
```

### TARJETAS TIEMPO
```
Referencia:       employee_id (FK), factory_id (FK)
Fecha:            work_date
Tiempo:           clock_in, clock_out, break_minutes
Validación:       total_hours, validation_status
Notas:            remarks, corrections
```

### NÓMINAS
```
Período:          year, month
Empleado:         employee_id (FK)
Base:             base_salary, hourly_rate, hours_worked
Cálculos:         gross_salary, total_deductions, net_salary
Impuestos:        income_tax, social_insurance, health_insurance
Otros:            bonuses, allowances, additional_charges,
                  rent_deduction, other_deductions
```

