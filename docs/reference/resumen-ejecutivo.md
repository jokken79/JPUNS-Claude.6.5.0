# RESUMEN EJECUTIVO - UNS-ClaudeJP 5.4.1

## DATOS CLAVE EN UN VISTAZO

| Aspecto | Cantidad |
|---------|----------|
| **Páginas Frontend** | 73+ |
| **Routers API** | 27 |
| **Endpoints de Importación** | 11 |
| **Scripts Python** | 87 |
| **Servicios Backend** | 28 |
| **Tablas BD** | 13 |
| **Campos de Candidato** | 172+ |
| **Módulos Principales** | 8 |

---

## MÓDULOS PRINCIPALES

1. **Candidatos (履歴書)** - Gestión de curriculum y selección
2. **Empleados (派遣社員)** - Gestión de personal en plantilla
3. **Fábricas (派遣先)** - Gestión de sitios de trabajo
4. **Tarjetas de Tiempo (タイムカード)** - Control de asistencia
5. **Nóminas (給与)** - Cálculos automáticos de salarios
6. **Apartamentos (アパート)** - Vivienda corporativa
7. **Vacaciones (有給休暇)** - Gestión de días de descanso
8. **Administración** - Panel de control y auditoría

---

## TRES FORMAS DE IMPORTAR DATOS

### 1. VÍA API REST (Web UI)
```
Usuario → Upload archivo → POST /api/import/[resource] → BD
```
Endpoints:
- POST /api/import/employees
- POST /api/import/timer-cards  
- POST /api/import/factory-configs
- GET /api/import/template/*

### 2. VÍA SCRIPTS PYTHON (CLI)
```
$ python backend/scripts/import_X.py → BD
```
87 scripts disponibles para:
- Importación masiva
- Sincronización
- Validación
- Migración de datos legacy

### 3. VÍA IMPORTADOR RESILIENTE (Con Recuperación)
```
POST /api/resilient-import/[resource] → Checkpoints → Reanudar si falla
```
Endpoints:
- POST /api/resilient-import/employees
- POST /api/resilient-import/factories
- GET /api/resilient-import/status/{operation_id}
- POST /api/resilient-import/resume/{operation_id}

---

## PÁGINAS POR MÓDULO

### Candidatos (6)
`page | new | [id] | [id]/edit | [id]/print | rirekisho`

### Empleados (5)
`page | new | [id] | [id]/edit | excel-view`

### Fábricas (4)
`page | new | [id] | [id]/config`

### Tarjetas Tiempo (2)
`page | upload`

### Nóminas (7)
`page | create | [id] | calculate | settings | timer-cards | yukyu-summary`

### Apartamentos (12)
`apartments/(6 páginas) | assignments/(5) | reports/(4) | calculations/(3)`

### Vacaciones (5)
`page | requests | requests/create | history | reports`

### Admin (3)
`control-panel | audit-logs | yukyu-management`

### Otros (19)
`dashboard | reports | monitoring | settings | themes | profiles | help | support | privacidad | etc`

---

## CAMPOS IMPORTABLES PRINCIPALES

### Candidatos (172+ campos mapeados)
```
Personales: nombre kanji/kana/roman, DOB, sexo, nacionalidad
Contacto: email, teléfono, dirección
Visa: tipo, residence card, expiración
Documento: foto (Base64), DNI, pasaporte
Experiencia: trabajos, habilidades, idiomas
Evaluación: estado, score, aprobación
```

### Empleados
```
ID: hakenmoto_id
Datos: nombre, DOB, sexo, contacto
Relaciones: rirekisho (candidato), factory (fábrica), apartment (vivienda)
Estado: active/inactive, employee_type
```

### Tarjetas Tiempo
```
Referencia: employee_id, factory_id, work_date
Tiempo: clock_in, clock_out, break_minutes
Validación: total_hours, status
```

### Nóminas
```
Período: year/month
Base: base_salary, hourly_rate, hours_worked
Cálculos: gross, net, deductions
Impuestos: income_tax, social_insurance, health_insurance
```

---

## FLUJO TÍPICO DE IMPORTACIÓN

```
1. PREPARAR ARCHIVO
   └─ Excel (.xlsx) o JSON (.json)

2. ABRIR MÓDULO EN FRONTEND
   └─ Ir a Candidatos/Empleados/Fábricas

3. CLICK "IMPORTAR"
   └─ Selector de archivo

4. VALIDACIÓN
   ├─ Tipo de archivo ✓
   ├─ Estructura de datos ✓
   └─ Campos requeridos ✓

5. PROCESAMIENTO
   ├─ Mapeo a modelos SQLAlchemy
   ├─ Validación de referencias
   └─ Batch inserts en BD

6. REPORTE
   ├─ Registros importados
   ├─ Errores encontrados
   └─ Advertencias
```

---

## RUTAS DE API MÁS USADAS

### Importación
```
POST /api/import/employees              Importar empleados Excel
POST /api/import/timer-cards            Importar tarjetas tiempo
GET  /api/import/template/employees     Descargar plantilla
```

### Candidatos
```
GET  /api/candidates                    Listar
POST /api/candidates                    Crear
POST /api/candidates/{id}/evaluate      Evaluar
POST /api/candidates/{id}/approve       Aprobar
```

### Empleados
```
GET  /api/employees                     Listar
POST /api/employees                     Crear
PUT  /api/employees/{id}                Actualizar
POST /api/employees/import-excel        Importar Excel
```

### Fábricas
```
GET  /api/factories                     Listar
POST /api/factories                     Crear
GET  /api/factories/{id}/config         Obtener configuración
```

---

## DATOS IMPORTANTES

- **BD**: PostgreSQL 15 con 13 tablas
- **Backend**: FastAPI 0.115.6 (Python 3.11)
- **Frontend**: Next.js 16 + React 19 + TypeScript
- **OCR**: Azure (primary) + EasyOCR + Tesseract
- **Autenticación**: JWT tokens
- **Validación**: Pydantic schemas

---

## ARCHIVOS CLAVE

### Backend
```
backend/app/api/
├─ import_export.py (301 líneas)        ← Importación estándar
├─ resilient_import.py (374 líneas)     ← Importación resiliente
├─ candidates.py                         ← CRUD candidatos
├─ employees.py                          ← CRUD empleados
├─ factories.py                          ← CRUD fábricas
└─ ... (21 routers más)

backend/app/services/
├─ import_service.py                    ← Lógica de importación
├─ candidate_service.py
├─ employee_service.py
└─ ... (25 servicios más)

backend/scripts/
├─ import_data.py (50K)                 ← Script principal
├─ import_candidates_improved.py (20K)  ← 172 campos
├─ import_access_candidates.py (26K)    ← Desde Access DB
└─ ... (84 scripts más)
```

### Frontend
```
frontend/app/(dashboard)/
├─ candidates/                           ← 6 páginas
├─ employees/                            ← 5 páginas
├─ factories/                            ← 4 páginas
├─ timercards/                           ← 2 páginas
├─ payroll/                              ← 7 páginas
├─ apartments/                           ← 12 páginas
├─ yukyu/                                ← 5 páginas
└─ ... (más módulos)

frontend/components/
├─ ui/file-upload.tsx                   ← Componente upload
└─ admin/import-config-dialog.tsx        ← Diálogo configuración
```

---

## CONCLUSIÓN

UNS-ClaudeJP es un **sistema completo de gestión HR** con:

✓ Importación de datos en 3 niveles (simple, scripts, resiliente)
✓ 73+ páginas para 8 módulos principales
✓ 172+ campos de candidatos mapeados completamente
✓ 87 scripts Python para automatización
✓ OCR híbrido para documentos
✓ Auditoría y compliance completos
✓ Recuperación ante fallos (checkpoints)

Ideal para **agencias de staffing temporal** (人材派遣会社) en Japón.

