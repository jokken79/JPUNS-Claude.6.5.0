# Análisis Exhaustivo: Relación Candidatos ↔ Empleados

## RESUMEN EJECUTIVO

Los **candidatos** (履歴書/Rirekisho) y **empleados** (派遣社員) tienen una relación **1:N** a través del campo `rirekisho_id`:
- **Un candidato** puede tener **varios empleados** derivados
- **Un empleado** vinculado SIEMPRE a **un candidato** via `rirekisho_id`
- Las **fotos** se sincronizan automáticamente: Candidato → Empleado
- El **estado** (status) del candidato se actualiza automáticamente según si tiene empleado vinculado

---

## 1. ESTRUCTURA DE MODELOS DE BASE DE DATOS

### Tabla `candidates` (Candidatos/履歴書)
**Archivo:** `/backend/app/models/models.py` líneas 191-410

**Campos Clave para Relación:**
```python
rirekisho_id = Column(String(20), unique=True, nullable=False)  # 履歴書ID (PRIMARY RELATIONSHIP KEY)
status = Column(String(20), server_default="pending")  # Estado: "pending" | "approved" | "rejected" | "hired"
approved_by = Column(Integer, ForeignKey("users.id"))  # Usuario que aprobó
approved_at = Column(DateTime(timezone=True))  # Fecha de aprobación

# FOTOS
photo_url = Column(String(255))  # URL simple
photo_data_url = Column(Text)  # Base64 data URL (PRIMARY FOR STORAGE)

# Relationship
employees = relationship(
    "Employee",
    back_populates="candidate",
    primaryjoin="Candidate.rirekisho_id==Employee.rirekisho_id",  # RELACIÓN VÍA rirekisho_id
    cascade="all, delete-orphan"
)
```

**Campos de Fotos:**
- `photo_url`: Deprecated, legacy compatibility
- `photo_data_url`: **PRINCIPAL** - Base64 encoded data URL (ej: `data:image/jpeg;base64,/9j/4AAQ...`)

**Estado del Candidato:**
- `pending`: Candidato nuevo, sin procesar
- `approved`: Aprobado por coordinador/admin
- `rejected`: Rechazado
- `hired`: Contratado (tiene empleado vinculado)

---

### Tabla `employees` (Empleados/派遣社員)
**Archivo:** `/backend/app/models/models.py` líneas 652-710

**Campos Clave para Relación:**
```python
rirekisho_id = Column(String(20), ForeignKey("candidates.rirekisho_id"))  # RELACIÓN A CANDIDATO
hakenmoto_id = Column(Integer, unique=True, nullable=False)  # ID único de empleado

# FOTOS - Sincronizadas desde Candidato
photo_url = Column(String(255))
photo_data_url = Column(Text)  # Base64, sincronizado desde candidate

# Relationship
candidate = relationship(
    "Candidate",
    back_populates="employees",
    primaryjoin="Employee.rirekisho_id==Candidate.rirekisho_id"
)
```

**Relación:**
- `rirekisho_id` es Foreign Key a `candidates.rirekisho_id`
- NO es un-a-uno, es uno-a-muchos (1 candidato → N empleados)
- Se heredan campos comunes del `EmployeeBaseMixin` (líneas 564-650)

---

### Tabla `contract_workers` (Trabajadores por Contrato)
Similar a `Employee`, también hereda de `EmployeeBaseMixin`:
```python
rirekisho_id = Column(String(20), ForeignKey("candidates.rirekisho_id"))
photo_data_url = Column(Text)  # Sincronizado desde candidate
```

---

### Tabla `staff` (Personal de Oficina)
También puede vincularse a candidatos:
```python
rirekisho_id = Column(String(20), ForeignKey("candidates.rirekisho_id"))
photo_data_url = Column(Text)
```

---

## 2. SINCRONIZACIÓN DE FOTOS

### Flujo de Sincronización (Candidato → Empleado)

**CREACIÓN DE EMPLEADO** (`/backend/app/api/employees.py` líneas 46-104):
```python
@router.post("/")
async def create_employee(employee: EmployeeCreate, ...):
    candidate = db.query(Candidate).filter(
        Candidate.rirekisho_id == employee.rirekisho_id
    ).first()
    
    # Copy photos from candidate
    if candidate.photo_url:
        employee_data['photo_url'] = candidate.photo_url
    if candidate.photo_data_url:
        employee_data['photo_data_url'] = candidate.photo_data_url  # ← Copia directa
    
    new_employee = Employee(hakenmoto_id=hakenmoto_id, **employee_data)
    db.add(new_employee)
    db.commit()
```

**ACTUALIZACIÓN DE CANDIDATO** (`/backend/app/api/candidates.py` líneas 369-466):
```python
@router.post("/rirekisho/form")
async def save_rirekisho_form(payload: RirekishoFormCreate, ...):
    # Compress photo automatically
    if photo_data_url:
        photo_data_url = photo_service.compress_photo(photo_data_url)  # 800x1000, quality 85
    
    updates['photo_data_url'] = photo_data_url
    updates['photo_url'] = photo_data_url  # Both set
    
    candidate.photo_data_url = photo_data_url  # Store in candidate
```

**FORMATO DE FOTO:**
- Almacenado como **data URL** (base64):
  ```
  data:image/jpeg;base64,/9j/4AAQSkZJRgABA...
  ```
- **Campos de almacenamiento:**
  - `photo_data_url`: PRIMARY (Text, puede ser grande)
  - `photo_url`: DEPRECATED (String 255, legacy)
- **Compresión:** 800x1000px, quality 85 (aplicada automáticamente en POST)

---

## 3. SCRIPTS DE IMPORTACIÓN Y SINCRONIZACIÓN

### Script Principal: `sync_candidate_employee_status.py`
**Archivo:** `/backend/scripts/sync_candidate_employee_status.py`

**Función:** Sincronizar estado (status) candidato basado en existencia de empleado

**Lógica:**
```
FOR CADA CANDIDATO:
  IF Existe empleado/contract_worker/staff CON MISMO rirekisho_id:
    → status = "hired" (採用)
  ELSE:
    → status = "pending" (審査中)
```

**Ejecución:**
- Corre DESPUÉS de `import_data.py`
- Parte de `docker-compose.yml` en servicio `importer`
- Actualiza `candidates.status` basado en relación con empleados

**Salida:**
```
✓ Actualizados: N
━ Sin cambios:  M

📊 Distribución de estados:
   審査中 (Pendientes): X
   合格 (Aprobados): Y
   不合格 (Rechazados): Z
   採用 (Contratados): W
```

---

### Script de Importación de Fotos
**Archivo:** `/backend/scripts/unified_photo_import.py`

**Función:** Importar fotos desde Access/Excel a candidatos

**Proceso:**
1. Extrae attachments de Access database
2. Convierte a data URL (base64)
3. Actualiza `candidates.photo_data_url` si está vacío:
   ```sql
   UPDATE candidates 
   SET photo_data_url = :photo_data_url
   WHERE rirekisho_id = :rirekisho_id 
   AND photo_data_url IS NULL
   ```
4. Sincroniza a empleados conectados (si existen)

---

## 4. ENDPOINTS API

### CANDIDATOS

#### POST `/api/candidates/rirekisho/form` - Guardar Formulario Rirekisho
**Archivo:** `/backend/app/api/candidates.py` líneas 369-466
```python
@router.post("/rirekisho/form")
async def save_rirekisho_form(payload: RirekishoFormCreate):
    """
    Persiste rirekisho form snapshot + sincroniza fotos
    - Comprime foto automáticamente
    - Crea/actualiza candidato
    - Almacena en photo_data_url
    """
```
**Campos:**
- `form_data`: JSON con datos del formulario
- `photo_data_url`: Data URL (opcional, se comprime)
- `rirekisho_id`: Opcional (se genera si no existe)

**Validación de Foto:**
- Max 10MB antes de compresión
- Compresión automática: 800x1000px, quality 85
- Soporta: JPEG, PNG, WebP

---

#### POST `/api/candidates/{candidate_id}/evaluate` - Evaluar Candidato
**Archivo:** `/backend/app/api/candidates.py` líneas 581-638
```python
@router.post("/{candidate_id}/evaluate")
async def quick_evaluate_candidate(evaluation: CandidateEvaluation):
    """
    Evaluación rápida (👍/👎)
    - Si approved: status = "approved" + crea 入社連絡票 (NYUUSHA request)
    - Si rejected: status = "pending"
    """
```

---

#### POST `/api/candidates/{candidate_id}/approve` - Aprobar Candidato
**Archivo:** `/backend/app/api/candidates.py` líneas 784-799
```python
@router.post("/{candidate_id}/approve")
async def approve_candidate(approve_data: CandidateApprove):
    """
    Aprobación formal de candidato
    Puede opcionalmente crear empleado
    """
```

---

### EMPLEADOS

#### POST `/api/employees/` - Crear Empleado
**Archivo:** `/backend/app/api/employees.py` líneas 46-104
```python
@router.post("/")
async def create_employee(employee: EmployeeCreate):
    """
    Crear empleado desde candidato aprobado
    
    REQUISITOS:
    - Candidato debe existir (rirekisho_id match)
    - Candidato.status must be "approved"
    
    AUTOMÁTICO:
    - Copia foto: candidate.photo_data_url → employee.photo_data_url
    - Marca candidato como "hired"
    - Copia documentos
    - Genera hakenmoto_id único
    """
```

**Flujo:**
```
1. Validar candidato existe y está "approved"
2. Generar hakenmoto_id (secuencial)
3. Copiar datos de candidato (nombre, dirección, etc)
4. Copiar FOTOS (photo_url + photo_data_url)
5. Crear empleado
6. Copiar documentos (Document.candidate_id → Document.employee_id)
7. Marcar candidato como "hired"
```

---

## 5. FLUJO DE APROBACIÓN Y CONTRATACIÓN

### Workflow: Candidato → Empleado

```
┌─────────────────────────────────────┐
│ 1. NUEVA CANDIDATURA (pending)      │
│                                      │
│ - rirekisho_id generado             │
│ - Foto cargada (photo_data_url)    │
│ - status = "pending"                │
└─────────────────────────────────────┘
              ↓
┌─────────────────────────────────────┐
│ 2. EVALUACIÓN RÁPIDA (Coordinator)  │
│                                      │
│ POST /candidates/{id}/evaluate      │
│ - evaluation.approved = true/false   │
│ - Si true: status = "approved"      │
│ - Si false: status = "pending"      │
└─────────────────────────────────────┘
              ↓ (si approved)
┌─────────────────────────────────────┐
│ 3. CREACIÓN DE EMPLEADO             │
│                                      │
│ POST /employees/                    │
│ - rirekisho_id: "UNS-123"          │
│ - Copia fotos automáticamente       │
│ - hakenmoto_id generado             │
│ - status candidato → "hired"        │
└─────────────────────────────────────┘
              ↓
┌─────────────────────────────────────┐
│ 4. CONTRATADO (hired)               │
│                                      │
│ Empleado + Candidato sincronizados  │
│ Ambos comparten:                    │
│ - rirekisho_id                      │
│ - photo_data_url                    │
└─────────────────────────────────────┘
```

---

## 6. CAMPOS DE FOTO - DETALLE TÉCNICO

### Almacenamiento de Fotos

**Base de Datos:**
```
Tabla: candidates
┌─────────────────────────────────────────────┐
│ rirekisho_id │ photo_url │ photo_data_url  │
├──────────────┼───────────┼─────────────────┤
│ UNS-1        │ NULL      │ data:image/...  │  ← Formato principal
│ UNS-2        │ /path...  │ NULL            │  ← Legacy/fallback
│ UNS-3        │ data:...  │ data:image/...  │  ← Ambas presentes
└─────────────────────────────────────────────┘

Tabla: employees
┌──────────┬────────────┬──────────────────────┐
│rirekisho_│photo_url   │ photo_data_url       │
├──────────┼────────────┼──────────────────────┤
│UNS-1     │NULL        │ data:image/jpeg;...  │  ← Sincronizado
│UNS-2     │NULL        │ data:image/jpeg;...  │  ← Sincronizado
└──────────┴────────────┴──────────────────────┘
```

**Formato de Data URL:**
```
data:image/jpeg;base64,/9j/4AAQSkZJRgABAQEAYABgA...
├────┬──────────────┬─────┬──────────────────────┤
│    │              │     └─ Base64 encoded image
│    │              └─ Separator
│    └─ Image MIME type
└─ Data URL prefix
```

**Tamaño:**
- Original: Hasta 10MB (validado en upload)
- Comprimido: ~200KB-500KB (tras compresión automática)
- Almacenado: Text field (PostgreSQL puede manejar varios MB)

---

## 7. SERVICIO DE FOTOS

**Archivo:** `/backend/app/services/photo_service.py`

### Funciones Clave:

```python
class PhotoService:
    
    @staticmethod
    def compress_photo(
        photo_data_url: str,
        max_width: int = 800,
        max_height: int = 1000,
        quality: int = 85
    ) -> str:
        """
        Comprime foto manteniendo aspecto ratio
        - Entrada: Data URL (base64)
        - Salida: Data URL comprimida
        - Tamaño máximo: 800x1000px
        - Calidad: 85 (buena relación tamaño/calidad)
        """
    
    @staticmethod
    def validate_photo_size(
        photo_data_url: str,
        max_size_mb: int = 10
    ) -> bool:
        """
        Valida tamaño antes de compresión
        - Max: 10MB
        """
    
    @staticmethod
    def get_photo_info(photo_data_url: str) -> dict:
        """
        Retorna info: ancho, alto, tamaño, formato
        """
```

---

## 8. FRONTEND - MANEJO DE FOTOS

### Página de Candidato Detail
**Archivo:** `/frontend/app/dashboard/candidates/[id]/page.tsx`

```typescript
interface Candidate {
  photo_url?: string;           // Legacy
  photo_data_url?: string;      // PRIMARY
  ...
}

// En el componente:
<img 
  src={candidate.photo_data_url || candidate.photo_url}
  alt="Candidate photo"
/>
```

### Página de Empleado Detail
**Archivo:** `/frontend/app/dashboard/employees/[id]/page.tsx`

```typescript
interface EmployeeDetails {
  photo_url: string | null;         // Puede ser NULL
  // photo_data_url no visible en interfaz (está en BD)
}

// En display:
<img 
  src={employee.photo_url || '/default.png'}
  alt="Employee photo"
/>
```

---

## 9. CAMPO DE APROBACIÓN EN BD

### Candidato
```python
class Candidate:
    status = Column(String(20), server_default="pending")
    approved_by = Column(Integer, ForeignKey("users.id"))  # Usuario que aprobó
    approved_at = Column(DateTime(timezone=True))          # Fecha/hora de aprobación
```

**Estados posibles:**
```python
class CandidateStatus(str, enum.Enum):
    PENDING = "pending"    # Nuevo, sin revisar
    APPROVED = "approved"  # Aprobado por coordinador
    REJECTED = "rejected"  # Rechazado
    HIRED = "hired"        # Contratado (empleado creado)
```

**Cambios de Estado:**

```
pending → approved    [Coordinador/Admin: POST /candidates/{id}/evaluate]
pending → rejected    [Coordinador/Admin: POST /candidates/{id}/evaluate]
approved → hired      [Admin: POST /employees/ (automático)]
```

---

## 10. SINCRONIZACIÓN AUTOMÁTICA

### Cuándo se Sincroniza:

| Evento | Qué se Sincroniza | Cómo |
|--------|------------------|------|
| Crear empleado | `photo_data_url` C→E | Copia directa en POST /employees/ |
| Actualizar foto candidato | `photo_data_url` C→E | Manual (no automático en update) |
| Sync script | `status` E→C | Ejecuta sync_candidate_employee_status.py |
| Eval. rápida | `status` | Candidato evaluation endpoint |
| Create employee | `status = hired` | Automático en creación empleado |

### Qué NO se Sincroniza Automáticamente:

- ❌ Cambios en empleado NO afectan candidato
- ❌ Cambios en candidato NO afectan empleado (después de creación)
- ❌ Fotos candidato actualizadas NO se copian a empleados existentes
- ✅ Solo flujo: Candidato → Empleado (creación inicial)

---

## 11. TESTING

**Archivo:** `/backend/tests/test_sync_candidate_employee.py`

Pruebas de sincronización candidato-empleado

---

## 12. RESUMEN DE FLUJOS DE DATOS

### A. Flujo de Foto (Upload)

```
User uploads photo
        ↓
Frontend: POST /candidates/rirekisho/form
        ↓
Backend: photo_service.validate_photo_size()
        ↓
Backend: photo_service.compress_photo()
        ↓
Backend: UPDATE candidates SET photo_data_url = compressed
        ↓
[When creating employee later]
        ↓
Backend: CREATE employee WITH photo_data_url FROM candidate
```

### B. Flujo de Estado (Status)

```
Create Candidate
        ↓
status = "pending"
        ↓
Coordinator: POST /candidates/{id}/evaluate?approved=true
        ↓
status = "approved"
        ↓
Admin: POST /employees (with rirekisho_id)
        ↓
Backend: 
  - Verify candidate.status == "approved"
  - Copy candidate.photo_data_url → employee.photo_data_url
  - SET candidate.status = "hired"
        ↓
[Or run sync script]
        ↓
Script queries: IF EXISTS employee WHERE rirekisho_id = X
        ↓
  YES → SET candidate.status = "hired"
  NO  → SET candidate.status = "pending"
```

### C. Flujo de Documentos

```
Upload document to candidate
        ↓
CREATE document(candidate_id=X)
        ↓
[When creating employee]
        ↓
FOR EACH document WHERE candidate_id = X:
  CREATE document(employee_id=Y, copy fields from candidate's doc)
```

---

## CONCLUSIÓN

**Relación Estructural:**
- **1-a-Muchos**: 1 Candidato → N Empleados
- **Clave de Relación**: `rirekisho_id`
- **Fotos**: Almacenadas como data URLs (base64) en `photo_data_url`
- **Sincronización**: Manual (foto) + Automática (estado via script)
- **Workflow**: Candidato aprobado → Empleado creado → Ambos comparten rirekisho_id + fotos

**Campos Críticos de Foto:**
- Candidato: `photo_data_url` (PRIMARY), `photo_url` (legacy)
- Empleado: `photo_data_url` (sincronizado desde candidato)
- Formato: `data:image/jpeg;base64,...`
- Compresión: 800x1000px, quality 85

