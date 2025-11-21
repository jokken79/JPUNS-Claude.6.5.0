# QUICK REFERENCE: Candidatos ↔ Empleados

## EN UNA PÁGINA

| Aspecto | Detalle |
|---------|---------|
| **Relación DB** | 1 Candidato : N Empleados (via `rirekisho_id`) |
| **Clave de Relación** | `rirekisho_id` (String 20, unique en candidates, FK en employees) |
| **Tablas Involucradas** | `candidates`, `employees`, `contract_workers`, `staff`, `documents` |
| **Foto: Campo Principal** | `photo_data_url` (TEXT, base64 data URL) |
| **Foto: Campo Legacy** | `photo_url` (String 255, deprecated pero soportado) |
| **Foto: Formato** | `data:image/jpeg;base64,/9j/4AAQSkZJRgAB...` |
| **Foto: Tamaño Máximo Original** | 10MB (validado en POST) |
| **Foto: Tamaño Después Compresión** | ~200-300KB |
| **Foto: Compresión** | 800x1000px, JPEG quality 85 |
| **Foto: Sincronización** | Automática al crear empleado (copia directa) |
| **Status del Candidato** | `pending` → `approved` → `hired` (o `rejected`) |
| **Status Sincronización** | Automática via `sync_candidate_employee_status.py` |
| **Aprobación** | `approved_by` (FK a users), `approved_at` (datetime) |
| **Endpoint Foto** | `POST /api/candidates/rirekisho/form` (con photo_data_url) |
| **Endpoint Aprobación** | `POST /api/candidates/{id}/evaluate?approved=true` |
| **Endpoint Crear Empleado** | `POST /api/employees/` (copia fotos automáticamente) |
| **Documentos** | Copiados automáticamente al crear empleado |
| **Script Sincronización** | `backend/scripts/sync_candidate_employee_status.py` |
| **Test Suite** | `backend/tests/test_sync_candidate_employee.py` |

---

## CAMPOS CANDIDATO MÁS IMPORTANTES

```python
class Candidate:
    # KEY
    id: int (PK)
    rirekisho_id: str(20) [UNIQUE] ← CLAVE RELACIÓN
    
    # APROBACIÓN
    status: str = "pending" | "approved" | "rejected" | "hired"
    approved_by: int (FK → users)
    approved_at: datetime
    
    # FOTOS
    photo_url: str(255)           ← LEGACY
    photo_data_url: text          ← PRIMARY (base64)
    
    # RELACIONES
    employees: List[Employee]     ← One-to-many
    documents: List[Document]
```

---

## CAMPOS EMPLEADO MÁS IMPORTANTES

```python
class Employee:
    # KEY
    id: int (PK)
    hakenmoto_id: int [UNIQUE]    ← ID de empleado
    rirekisho_id: str(20) (FK)    ← Vínculo a candidato
    
    # FOTOS (SINCRONIZADAS)
    photo_url: str(255)
    photo_data_url: text          ← Copia de candidate
    
    # RELACIONES
    candidate: Candidate          ← Many-to-one
    factory_id: str(200) (FK)
    apartment_id: int (FK)
```

---

## FLUJO MÍNIMO PARA CREAR EMPLEADO

```
1. Usuario crea candidato con formulario + foto
   POST /api/candidates/rirekisho/form
   ├─ foto comprimida automáticamente (800x1000, q85)
   └─ rirekisho_id generado → "UNS-123"

2. Candidato aprobado por coordinador
   POST /api/candidates/{id}/evaluate?approved=true
   └─ status → "approved"

3. Admin crea empleado
   POST /api/employees
   ├─ rirekisho_id: "UNS-123"
   ├─ factory_id, hire_date, etc.
   └─ Backend automáticamente:
      ├─ Copia photo_data_url del candidato
      ├─ Genera hakenmoto_id único
      ├─ Sets candidate.status = "hired"
      └─ Copia documentos

4. RESULTADO:
   ├─ Candidato (rirekisho_id=UNS-123, photo_data_url=base64, status=hired)
   └─ Empleado (hakenmoto_id=1, rirekisho_id=UNS-123, photo_data_url=base64)
      ↑ Fotos idénticas, sincronizadas ✓
```

---

## ENDPOINTS CRÍTICOS

```
# CANDIDATOS
POST   /api/candidates/rirekisho/form         ← Guardar formulario + foto
POST   /api/candidates/{id}/evaluate          ← Cambiar status (approve/reject)
GET    /api/candidates/{id}                   ← Ver detalles
GET    /api/candidates                        ← Listar todos

# EMPLEADOS
POST   /api/employees                         ← Crear (copia fotos automáticamente)
GET    /api/employees/{id}                    ← Ver detalles
GET    /api/employees                         ← Listar todos
PUT    /api/employees/{id}                    ← Actualizar (NO afecta candidato)

# SCRIPTS
python sync_candidate_employee_status.py      ← Sincronizar status (run after import)
```

---

## FOTO: CÓMO FUNCIONA

```
UPLOAD CANDIDATO:
  User selects image (max 10MB)
    ↓
  POST /api/candidates/rirekisho/form
    ├─ photo_service.validate_photo_size() → ✓
    ├─ photo_service.compress_photo()
    │  ├─ Decode base64
    │  ├─ Resize to fit 800x1000px
    │  ├─ JPEG quality 85
    │  └─ Encode back to base64
    └─ UPDATE candidates SET photo_data_url = compressed


CREAR EMPLEADO:
  POST /api/employees (with candidate.rirekisho_id)
    ├─ Verify candidate exists & approved
    ├─ Copy: employee.photo_data_url = candidate.photo_data_url
    └─ INSERT employee
    
RESULTADO:
  Candidato: photo_data_url = "data:image/jpeg;base64,..."
  Empleado:  photo_data_url = "data:image/jpeg;base64,...  (IDENTICAL)
```

---

## STATUS DEL CANDIDATO: STATE MACHINE

```
pending (default)
  ├─→ approved (POST /candidates/{id}/evaluate?approved=true)
  │    └─→ hired (POST /employees with this candidate)
  │
  └─→ rejected (POST /candidates/{id}/evaluate?approved=false)

SYNC SCRIPT LOGIC:
  FOR EACH candidate:
    IF EXISTS employee/contract_worker/staff WHERE rirekisho_id = X:
      SET status = "hired"
    ELSE:
      SET status = "pending"
```

---

## ARCHIVO CLAVE: RELACIÓN SQL

```sql
-- Candidatos
CREATE TABLE candidates (
  id SERIAL PRIMARY KEY,
  rirekisho_id VARCHAR(20) UNIQUE NOT NULL,  ← KEY
  status VARCHAR(20) DEFAULT 'pending',      ← pending/approved/rejected/hired
  photo_url VARCHAR(255),
  photo_data_url TEXT,                        ← BASE64 IMAGE
  approved_by INTEGER REFERENCES users(id),
  approved_at TIMESTAMP WITH TIME ZONE,
  ...
);

-- Empleados
CREATE TABLE employees (
  id SERIAL PRIMARY KEY,
  hakenmoto_id INTEGER UNIQUE NOT NULL,
  rirekisho_id VARCHAR(20) REFERENCES candidates(rirekisho_id),  ← FK
  photo_url VARCHAR(255),
  photo_data_url TEXT,                       ← SYNCED FROM CANDIDATE
  ...
);

-- Vista lógica
candidatos.rirekisho_id ←→ employees.rirekisho_id  [1:N]
candidatos.photo_data_url → employees.photo_data_url [COPY ON INSERT]
```

---

## SCRIPTS IMPORTACIÓN (EN ORDEN)

```bash
# 1. Migrations
alembic upgrade head

# 2. Importar candidatos + fotos
python scripts/import_candidates_improved.py

# 3. Importar empleados (copia fotos automáticamente)
python scripts/import_employees_complete.py

# 4. Sincronizar status
python scripts/sync_candidate_employee_status.py

# O importar fotos desde Access:
python scripts/unified_photo_import.py
```

---

## DOCKER COMPOSE: SERVICIO IMPORTER

```yaml
importer:
  image: ...
  depends_on:
    - db (healthy)
  command: |
    /bin/bash -c "
      cd /app &&
      alembic upgrade head &&
      python scripts/import_data.py &&
      python scripts/sync_candidate_employee_status.py
    "
```

---

## SINCRONIZACIÓN: QUÉ SE COPIA Y CUÁNDO

| Qué | Cuándo | Cómo | Automático? |
|-----|--------|------|-------------|
| `photo_data_url` | Al crear empleado | Copia directa | SÍ |
| `photo_url` | Al crear empleado | Copia directa | SÍ |
| Documentos | Al crear empleado | Copia records | SÍ |
| `status` | Al crear empleado | Set to "hired" | SÍ |
| `status` | Al correr sync script | Set hired/pending | MANUAL (script) |
| Cambios en empleado | Nunca | No se sincroniza | NO |
| Cambios en candidato | Nunca | No se sincroniza a empleado | NO |

---

## MODELO: DATOS TÍPICOS

```
CANDIDATO:
├─ id: 42
├─ rirekisho_id: "UNS-123"
├─ full_name_kanji: "田中太郎"
├─ date_of_birth: 1990-05-15
├─ status: "hired"
├─ approved_by: 1 (user_id)
├─ approved_at: 2024-11-01 10:30:00
├─ photo_data_url: "data:image/jpeg;base64,/9j/4AAQSkZJRgABBQEAYA..."
├─ photo_url: NULL
└─ created_at: 2024-10-25

EMPLEADO:
├─ id: 5
├─ hakenmoto_id: 1001
├─ rirekisho_id: "UNS-123" ← Vinculado
├─ full_name_kanji: "田中太郎" (copia)
├─ factory_id: "ABC Manufacturing__Osaka Plant"
├─ hire_date: 2024-11-01
├─ jikyu: 1200 (yen/hour)
├─ photo_data_url: "data:image/jpeg;base64,/9j/4AAQSkZJRgABBQEAYA..." ← IDÉNTICA
├─ photo_url: NULL
└─ created_at: 2024-11-01 11:00:00

VÍNCULO:
├─ Candidato.rirekisho_id = Empleado.rirekisho_id
├─ Fotos idénticas (sincronización en creación)
└─ Candidato.status = "hired" (automático)
```

---

## TÉRMINOS CLAVE

| Término | Significado | Tabla |
|---------|-----------|-------|
| **rirekisho_id** | ID de resume/candidato (ej: "UNS-123") | candidates, employees |
| **hakenmoto_id** | ID único de empleado (secuencial: 1, 2, 3...) | employees |
| **photo_data_url** | Foto en base64 data URL | candidates, employees |
| **status** | Estado candidato: pending/approved/rejected/hired | candidates |
| **approved_by** | Usuario que aprobó (FK a users) | candidates |
| **factory_id** | Lugar de asignación de trabajo | employees |
| **apartment_id** | Apartamento asignado | employees |
| **jikyu** | Salario por hora (時給) | employees |
| **sync script** | Actualiza status basado en relación | (external) |

---

## ERRORES COMUNES A EVITAR

| Error | Causa | Solución |
|-------|-------|----------|
| Foto no sincroniza a empleado | Actualizar foto DESPUÉS de crear empleado | Actualizar foto ANTES de crear empleado |
| Status candidato no es "hired" | Sync script no ejecutado | Run `sync_candidate_employee_status.py` |
| Duplicados rirekisho_id | No validar unicidad | Usar rirekisho_id generado, no manual |
| Empleado sin foto | Candidato no tenía foto | Cargar foto en candidato antes de crear empleado |
| Validación FK falla | rirekisho_id no existe en candidatos | Crear candidato primero con id específico |
| Import falla | Candidatos no importados | Ejecutar import en orden: candidates → employees → sync |

---

## REFERENCIAS CÓDIGO

**Modelos:**
- `backend/app/models/models.py` líneas 191-410 (Candidate)
- `backend/app/models/models.py` líneas 652-710 (Employee)
- `backend/app/models/models.py` líneas 564-650 (EmployeeBaseMixin)

**API:**
- `backend/app/api/candidates.py` líneas 369-466 (save_rirekisho_form)
- `backend/app/api/candidates.py` líneas 581-638 (evaluate)
- `backend/app/api/employees.py` líneas 46-104 (create_employee)

**Servicios:**
- `backend/app/services/photo_service.py` (compression)
- `backend/app/services/candidate_service.py` (business logic)

**Scripts:**
- `backend/scripts/sync_candidate_employee_status.py` (STATUS SYNC)
- `backend/scripts/import_candidates_improved.py` (candidate import)
- `backend/scripts/import_employees_complete.py` (employee import)

**Frontend:**
- `frontend/app/dashboard/candidates/[id]/page.tsx` (candidate detail)
- `frontend/app/dashboard/employees/[id]/page.tsx` (employee detail)

---

## PARA RECORDAR

✓ **Foto se comprime automáticamente** en POST /candidates/rirekisho/form  
✓ **Foto se copia automáticamente** al crear empleado (POST /employees)  
✓ **Status se actualiza automáticamente** al crear empleado  
✓ **Status se sincroniza automáticamente** al ejecutar sync_candidate_employee_status.py  
✓ **relación es 1:N** (1 candidato puede tener N empleados)  
✓ **rirekisho_id es la clave** de la relación  
✓ **No sincroniza cambios posteriores** (solo en creación)  
✓ **Cambios en empleado NO afectan candidato**  

