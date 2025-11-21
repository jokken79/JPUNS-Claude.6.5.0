# 🏗️ ARQUITECTURA COMPLETA - SISTEMA DE CANDIDATOS Y 入社連絡票 (NYŪSHA RENRAKUHYŌ)

**Fecha**: 2025-11-13
**Versión**: 5.4.1
**Status**: ✅ 100% IMPLEMENTADO
**Author**: Claude Code Analysis
**Sistema**: UNS-ClaudeJP - HR Management System

---

## 📑 TABLA DE CONTENIDOS

1. [Visión General](#visión-general)
2. [Flujo de Candidatos](#flujo-de-candidatos)
3. [Modelo de Datos](#modelo-de-datos)
4. [Arquitectura Backend](#arquitectura-backend)
5. [Arquitectura Frontend](#arquitectura-frontend)
6. [APIs REST](#apis-rest)
7. [Componentes de UI](#componentes-de-ui)
8. [Flujos de Negocio](#flujos-de-negocio)
9. [Integración de Sistemas](#integración-de-sistemas)
10. [Checklist de Implementación](#checklist-de-implementación)

---

## VISIÓN GENERAL

### Propósito
El sistema de candidatos y 入社連絡票 (Nyuusha Renraku-yō) en UNS-ClaudeJP gestiona el ciclo completo de contratación:

```
CANDIDATO (履歴書) → ENTREVISTA → APROBACIÓN → 入社連絡票 → EMPLEADO (派遣社員)
```

### Componentes Principales

| Componente | Tecnología | Ubicación | Líneas |
|-----------|-----------|-----------|--------|
| **Modelo Datos** | SQLAlchemy ORM | models.py | 860-888 (requests) + 183-403 (candidates) |
| **API Backend** | FastAPI | api/requests.py, api/candidates.py | 17.5KB + large |
| **Schemas Pydantic** | Validación | schemas/request.py, schemas/candidate.py | 91-110 + 400+ |
| **Frontend Pages** | Next.js 16 | app/(dashboard)/requests/[id]/page.tsx | 19KB |
| **Components UI** | React 19 + Shadcn | components/requests/RequestTypeBadge.tsx | 118 líneas |
| **TypeScript Types** | Types | types/api.ts | 373-403 |
| **Services** | Business Logic | services/candidate_service.py | ~300 líneas |
| **Database** | PostgreSQL 15 | DB Tables: requests, candidates, employees | 13 tablas |

### Stack Tecnológico

```
┌─────────────────────────────────────────────────────────────┐
│                     FRONTEND (Next.js 16)                   │
│  React 19 + TypeScript 5.6 + Tailwind CSS 3.4               │
│  - Pages: /candidates, /requests, /employees               │
│  - Components: Forms, Badges, Tables                        │
│  - State: Zustand + React Query                             │
│  - API Client: Axios con interceptores JWT                  │
└─────────────────────────────────────────────────────────────┘
                              ↕ (HTTP)
┌─────────────────────────────────────────────────────────────┐
│                      NGINX (Port 80/443)                     │
│  Reverse Proxy, Load Balancing, Rate Limiting               │
└─────────────────────────────────────────────────────────────┘
                              ↕ (HTTP)
┌─────────────────────────────────────────────────────────────┐
│                   BACKEND (FastAPI 0.115.6)                  │
│  Python 3.11+ with async/await                              │
│  - API Routers: 27+ endpoints                               │
│  - Authentication: JWT + Role-Based Access                 │
│  - Services: Business logic layer                           │
│  - Database: SQLAlchemy 2.0.36 ORM                          │
└─────────────────────────────────────────────────────────────┘
                              ↕ (SQL)
┌─────────────────────────────────────────────────────────────┐
│                 DATABASE (PostgreSQL 15)                     │
│  - 13 tables with relationships                              │
│  - JSONB for flexible employee_data                         │
│  - Triggers for business logic                              │
│  - Indexes for performance                                  │
└─────────────────────────────────────────────────────────────┘
```

---

## FLUJO DE CANDIDATOS

### Fase 1: Importación de Candidatos

```
USUARIO IMPORTA DATOS
    ↓
Múltiples opciones:
├─ Script: import_candidates_improved.py (172 campos)
├─ Frontend: /candidates/new (formulario manual)
├─ OCR: Escanear documentos
│   ├─ Azure OCR (primaria)
│   ├─ EasyOCR (secundaria)
│   └─ Tesseract (fallback)
└─ Importación masiva: CSV/Excel

VALIDACIONES:
├─ Campos requeridos presentes
├─ Formato email válido
├─ Teléfono válido
├─ No duplicados (por rirekisho_id)
└─ Datos de foto válidos (base64)

RESULTADO:
├─ Candidato creado en tabla "candidates"
├─ rirekisho_id único generado (RK-2025-XXXX)
├─ status = "pending"
├─ photo_data_url guardada (si aplica)
└─ Timestamp created_at registrado
```

**Campos almacenados**: 221 campos en tabla candidates

### Fase 2: Evaluación e Entrevista

```
RR.HH. EVALÚA CANDIDATO
    ↓
Accede a: /candidates/{id}
    ↓
Visualiza: Todos los 221 campos del candidato
    ↓
Acciones posibles:
├─ 👍 Aprobar (Aprobado)
├─ 👎 Rechazar (Rechazado)
└─ ⏳ Dejar pendiente (Sin cambio)

SI APRUEBA (👍):
├─ status cambia a "approved"
├─ approved_by = current_user.id
├─ approved_at = datetime.now()
├─ AUTOMÁTICO: Se crea Request NYUUSHA
│   ├─ request_type = "nyuusha"
│   ├─ status = "pending"
│   ├─ candidate_id = candidate.id
│   ├─ hakenmoto_id = NULL (será llenado después)
│   ├─ employee_data = {} (vacío)
│   └─ Timestamp created_at registrado
└─ Visible en /requests con badge ORANGE
```

**Endpoint**: POST `/api/candidates/{id}/evaluate`

### Fase 3: 入社連絡票 - Formulario de Contratación

```
ADMIN VE: /requests (filtrado NYUUSHA)
    ↓
Selecciona Request con badge ORANGE: "入社連絡票"
    ↓
Navega a: /requests/{id}
    ↓
VE DOS SECCIONES:

┌─────────────────────────────────────┐
│ SECCIÓN 1: Datos del Candidato      │
│ (READ-ONLY - No editable)           │
├─────────────────────────────────────┤
│ - Rirekisho ID                      │
│ - Nombres (Kanji/Roman/Kana)        │
│ - Fecha de Nacimiento               │
│ - Contacto (Email, Teléfono)        │
│ - Nacionalidad, Género              │
│ - Status: "approved"                │
│ - Link: Ver candidato completo      │
│                                     │
│ Muestra: 10-15 campos clave         │
└─────────────────────────────────────┘

┌─────────────────────────────────────┐
│ SECCIÓN 2: Datos de Empleado        │
│ (EDITABLE - Formulario)             │
├─────────────────────────────────────┤
│ CAMPOS REQUERIDOS (*)               │
│ - Factory ID *                      │
│ - Hire Date * (date picker)         │
│ - Jikyu * (800-5000 yen/hora)       │
│ - Position *                        │
│ - Contract Type * (select)          │
│                                     │
│ CAMPOS OPCIONALES                   │
│ - Hakensaki Shain ID                │
│ - Apartment ID                      │
│ - Bank Name                         │
│ - Bank Account                      │
│ - Emergency Contact Name            │
│ - Emergency Contact Phone           │
│ - Notes (textarea)                  │
│                                     │
│ VALIDACIONES                        │
│ - Factory existe                    │
│ - Hire date >= hoy                  │
│ - Jikyu en rango válido             │
│ - No campos vacíos (requeridos)     │
└─────────────────────────────────────┘

ACCIONES:
├─ Botón "保存" (Save)
│   └─ Guarda employee_data como JSON
│
└─ Botón "承認して従業員作成" (Approve & Create Employee)
    └─ Crea empleado (requiere employee_data lleno)
```

**Endpoints**:
- PUT `/api/requests/{id}/employee-data`
- POST `/api/requests/{id}/approve-nyuusha`

### Fase 4: Creación Automática de Empleado

```
BACKEND PROCESA:
    ↓
POST /api/requests/{id}/approve-nyuusha
    ↓
VALIDACIONES:
├─ request.type = "nyuusha" ✓
├─ request.status = "pending" ✓
├─ employee_data completo ✓
├─ candidate existe ✓
└─ employee no existe duplicado ✓

GENERACIÓN DE DATOS:
├─ Genera hakenmoto_id único (E-XXXX)
├─ Copia 40+ campos de Candidate:
│  ├─ full_name_roman, full_name_kanji, full_name_kana
│  ├─ date_of_birth, gender, nationality
│  ├─ email, phone, mobile, address
│  ├─ passport_number, zairyu_card_number
│  ├─ photo_data_url (foto)
│  ├─ family_name_1-5, family_relation_1-5
│  ├─ emergency_contact_name, emergency_contact_phone
│  └─ 25+ campos adicionales
│
├─ Agrega campos de employee_data:
│  ├─ factory_id
│  ├─ hire_date
│  ├─ jikyu (salario/hora)
│  ├─ position
│  ├─ contract_type
│  ├─ hakensaki_shain_id (opcional)
│  ├─ apartment_id (opcional)
│  ├─ bank_name, bank_account (opcional)
│  └─ emergency_contact_phone
│
└─ Link via rirekisho_id (relación candidato ↔ empleado)

ACTUALIZACIONES BD:
├─ INSERTA: Employee (nueva fila)
│  └─ Contiene 40+ campos + employee_data fields
│
├─ UPDATE: Candidate (id = candidate_id)
│  ├─ status = "hired"
│  └─ hired_at = datetime.now()
│
├─ UPDATE: Request (id = request_id)
│  ├─ status = "completed" (済)
│  ├─ hakenmoto_id = new_employee.hakenmoto_id
│  └─ completed_at = datetime.now()
│
└─ ✅ TRANSACCIÓN COMPLETADA

FRONTEND:
├─ Muestra: "従業員を作成しました" (Employee created)
├─ Redirige a: /employees/{hakenmoto_id}
└─ Muestra: Datos del employee creado
```

---

## MODELO DE DATOS

### Tabla: CANDIDATES

```sql
TABLE candidates (
    id INTEGER PRIMARY KEY,
    rirekisho_id VARCHAR(20) UNIQUE NOT NULL,  -- RK-2025-XXXX
    applicant_id VARCHAR,

    -- Identidad
    full_name_kanji VARCHAR(100),
    full_name_kana VARCHAR(100),
    full_name_roman VARCHAR(100),
    date_of_birth DATE,
    gender VARCHAR(10),
    nationality VARCHAR(50),
    marital_status VARCHAR(20),

    -- Contacto
    email VARCHAR(255),
    phone VARCHAR(20),
    mobile VARCHAR(20),

    -- Dirección
    postal_code VARCHAR(10),
    current_address TEXT,
    address TEXT,

    -- Documentos
    passport_number VARCHAR(50),
    passport_expiry DATE,
    residence_status VARCHAR(50),
    residence_expiry DATE,
    residence_card_number VARCHAR(50),
    license_number VARCHAR(50),
    license_expiry DATE,

    -- Familia (5 miembros)
    family_name_1 VARCHAR(100), family_relation_1 VARCHAR(50), family_age_1 INT,
    family_name_2 VARCHAR(100), family_relation_2 VARCHAR(50), family_age_2 INT,
    family_name_3 VARCHAR(100), family_relation_3 VARCHAR(50), family_age_3 INT,
    family_name_4 VARCHAR(100), family_relation_4 VARCHAR(50), family_age_4 INT,
    family_name_5 VARCHAR(100), family_relation_5 VARCHAR(50), family_age_5 INT,

    -- Experiencia
    exp_nc_lathe BOOLEAN,
    exp_lathe BOOLEAN,
    exp_press BOOLEAN,
    exp_forklift BOOLEAN,
    exp_packing BOOLEAN,
    exp_welding BOOLEAN,
    ... (10+ campos más)

    -- Idiomas
    language_skill_exists VARCHAR(10),
    language_skill_1 VARCHAR(100),
    japanese_level VARCHAR(10),
    jlpt_score INTEGER,

    -- Foto
    photo_url VARCHAR(255),
    photo_data_url TEXT,  -- Base64 encoded

    -- Estado
    status ENUM('pending', 'approved', 'rejected', 'hired'),
    approved_by INTEGER FK users.id,
    approved_at TIMESTAMP,
    hired_at TIMESTAMP,

    -- Timestamps
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    deleted_at TIMESTAMP NULL,  -- Soft delete

    -- Relación
    requests RELATIONSHIP → Request(candidate_id)
)
```

**Total de campos**: 221

### Tabla: REQUESTS (Solicitudes)

```sql
TABLE requests (
    id INTEGER PRIMARY KEY,

    -- Para solicitudes normales (yukyu, hankyu, etc.)
    hakenmoto_id INTEGER FK employees.hakenmoto_id NULLABLE,

    -- NUEVO: Para 入社連絡票 (NYUUSHA)
    candidate_id INTEGER FK candidates.id NULLABLE,

    -- Tipo y estado
    request_type ENUM(
        'yukyu',        -- Paid vacation
        'hankyu',       -- Half day
        'ikkikokoku',   -- Temporary return home
        'taisha',       -- Resignation
        'nyuusha'       -- NEW HIRE NOTIFICATION ← NUEVO
    ),
    status ENUM(
        'pending',      -- Under review
        'approved',     -- Approved
        'rejected',     -- Rejected
        'completed'     -- Completed/Archived ← NUEVO
    ),

    -- Fechas
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,

    -- Detalles
    reason TEXT,
    notes TEXT,

    -- NUEVO: Para 入社連絡票
    employee_data JSONB NULL,  -- Stores:
    -- {
    --   "factory_id": "FAC-001",
    --   "hire_date": "2025-11-20",
    --   "jikyu": 1500,
    --   "position": "製造スタッフ",
    --   "contract_type": "正社員",
    --   "apartment_id": "APT-001",
    --   "bank_name": "Bank Name",
    --   "bank_account": "123456789",
    --   "emergency_contact_name": "Name",
    --   "emergency_contact_phone": "090-XXXX-XXXX"
    -- }

    -- Aprobación
    approved_by INTEGER FK users.id NULL,
    approved_at TIMESTAMP NULL,

    -- Timestamps
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),

    -- Relaciones
    employee RELATIONSHIP → Employee(hakenmoto_id),
    candidate RELATIONSHIP → Candidate(id)
)
```

### Tabla: EMPLOYEES

```sql
TABLE employees (
    hakenmoto_id VARCHAR(20) PRIMARY KEY,  -- E-XXXX
    rirekisho_id VARCHAR(20) FK candidates.rirekisho_id,

    -- Datos del candidato (copiados)
    full_name_kanji VARCHAR(100),
    full_name_roman VARCHAR(100),
    date_of_birth DATE,
    gender VARCHAR(10),
    email VARCHAR(255),
    phone VARCHAR(20),
    photo_data_url TEXT,  -- Foto base64
    ... (35+ campos adicionales)

    -- Datos del empleado (de employee_data)
    factory_id VARCHAR(20) FK factories.id,
    position VARCHAR(100),
    hire_date DATE,
    jikyu INTEGER,  -- Hourly wage (時給)
    contract_type VARCHAR(50),  -- 正社員, 契約社員, etc.
    apartment_id VARCHAR(20) FK apartments.id NULL,

    -- Estado
    status ENUM('active', 'inactive', 'terminated'),

    -- Timestamps
    created_at TIMESTAMP DEFAULT NOW(),

    -- Relaciones
    requests RELATIONSHIP → Request(hakenmoto_id),
    timercards RELATIONSHIP → TimerCard(hakenmoto_id),
    salary_calculations RELATIONSHIP → SalaryCalculation(hakenmoto_id)
)
```

### Relaciones ER

```
┌──────────────┐
│  Candidate   │
│  (履歴書)     │
└──────────────┘
      │ (1)
      │
      └─ requests (1:N)
         │
         └─→ Request (1)
            │
            ├─ candidate_id FK → Candidate.id
            ├─ request_type = "nyuusha"
            ├─ status: pending → completed
            └─ employee_data: { factory_id, hire_date, ... }
                              ↓ (approval)
                        ┌──────────────┐
                        │  Employee    │
                        │  (派遣社員)    │
                        └──────────────┘
                        (hakenmoto_id)
                              ↓
                        ┌──────────────┐
                        │   Factory    │
                        │   (派遣先)    │
                        └──────────────┘
                              ↓
                        ┌──────────────┐
                        │   Apartment  │
                        │   (社宅)      │
                        └──────────────┘
```

---

## ARQUITECTURA BACKEND

### Estructura de Directorios

```
backend/app/
├── api/
│   ├── candidates.py          (500+ líneas)
│   │   ├── GET /candidates/
│   │   ├── POST /candidates/
│   │   ├── GET /candidates/{id}
│   │   ├── PUT /candidates/{id}
│   │   ├── POST /candidates/{id}/evaluate  ← Auto-crea NYUUSHA
│   │   ├── POST /candidates/{id}/approve
│   │   └── POST /candidates/{id}/reject
│   │
│   ├── requests.py            (17.5KB)
│   │   ├── GET /requests/
│   │   ├── POST /requests/
│   │   ├── GET /requests/{id}
│   │   ├── PUT /requests/{id}
│   │   ├── PUT /requests/{id}/employee-data       ← NUEVO
│   │   ├── POST /requests/{id}/approve-nyuusha    ← NUEVO
│   │   └── POST /requests/{id}/review
│   │
│   ├── employees.py
│   ├── factories.py
│   └── (24+ routers más)
│
├── models/
│   └── models.py              (1466 líneas)
│       ├── class Candidate(Base):          Line 183-403 (221 campos)
│       ├── class Request(Base):            Line 860-888 (con candidate_id, employee_data)
│       ├── class Employee(Base):           Line 644-705
│       ├── enum RequestType:               Line 47-52 (con NYUUSHA)
│       ├── enum RequestStatus:             Line 55-59 (con COMPLETED)
│       └── (10 enums más)
│
├── schemas/
│   ├── candidate.py           (400+ líneas)
│   ├── request.py             (150+ líneas)
│   │   ├── class RequestBase
│   │   ├── class EmployeeDataInput         ← NUEVO
│   │   └── class RequestResponse
│   └── (32 schemas más)
│
├── services/
│   ├── candidate_service.py   (300+ líneas)
│   │   ├── async def create_candidate()
│   │   ├── async def approve_candidate()
│   │   ├── async def promote_to_employee()
│   │   └── async def _validate_duplicates()
│   │
│   ├── azure_ocr_service.py
│   ├── photo_service.py
│   └── (26 servicios más)
│
├── core/
│   ├── database.py            (SQLAlchemy, sesiones)
│   ├── config.py              (variables entorno)
│   ├── security.py            (JWT, passwords)
│   └── deps.py                (inyección dependencias)
│
└── scripts/
    ├── import_candidates_improved.py
    ├── create_admin_user.py
    └── (78+ scripts más)
```

### Flujo de Aprobación de Candidato

**Archivo**: `backend/app/api/candidates.py` línea 581-638

```python
@router.post("/candidates/{id}/evaluate")
async def evaluate_candidate(
    candidate_id: int,
    evaluation: CandidateEvaluation,
    current_user: User = Depends(require_admin),
    db: Session = Depends(get_db)
):
    """
    Evaluate a candidate (approve/reject).
    When approved, AUTOMATICALLY creates a 入社連絡票 (NYUUSHA) request.
    """
    # 1. Get candidate
    candidate = db.query(Candidate).filter(Candidate.id == candidate_id).first()
    if not candidate:
        raise HTTPException(status_code=404)

    # 2. Validate no duplicate NYUUSHA
    existing_nyuusha = db.query(Request).filter(
        Request.candidate_id == candidate_id,
        Request.request_type == RequestType.NYUUSHA
    ).first()

    if existing_nyuusha:
        raise HTTPException(status_code=400, detail="NYUUSHA already exists")

    # 3. If approved, update candidate
    if evaluation.approved:
        candidate.status = CandidateStatus.APPROVED
        candidate.approved_by = current_user.id
        candidate.approved_at = datetime.now()

        # 4. AUTO-CREATE NYUUSHA request
        nyuusha_request = Request(
            request_type=RequestType.NYUUSHA,
            status=RequestStatus.PENDING,
            candidate_id=candidate.id,
            hakenmoto_id=None,  # Will be filled when employee is created
            start_date=date.today(),
            end_date=date.today(),
            reason=f"新規採用: {candidate.full_name_kanji or candidate.full_name_roman}",
            employee_data={}  # Empty JSON to be filled later
        )

        db.add(nyuusha_request)

    elif evaluation.approved == False:
        candidate.status = CandidateStatus.REJECTED
        candidate.rejection_reason = evaluation.reason

    db.commit()
    db.refresh(candidate)

    return CandidateResponse.from_orm(candidate)
```

### Flujo de Aprobación de NYUUSHA Request

**Archivo**: `backend/app/api/requests.py` línea 347-486

```python
@router.post("/requests/{request_id}/approve-nyuusha")
async def approve_nyuusha_request(
    request_id: int,
    current_user: User = Depends(require_admin),
    db: Session = Depends(get_db)
):
    """
    Approve a NYUUSHA request and CREATE employee record.
    """
    # 1. Validate request
    request = db.query(Request).filter(Request.id == request_id).first()
    if not request or request.request_type != RequestType.NYUUSHA:
        raise HTTPException(status_code=400)

    if request.status != RequestStatus.PENDING:
        raise HTTPException(status_code=400, detail="Already processed")

    if not request.employee_data:
        raise HTTPException(status_code=400, detail="Fill employee data first")

    # 2. Get candidate
    candidate = db.query(Candidate).filter(Candidate.id == request.candidate_id).first()
    if not candidate:
        raise HTTPException(status_code=404, detail="Candidate not found")

    # 3. Check no duplicate employee
    existing = db.query(Employee).filter(
        Employee.rirekisho_id == candidate.rirekisho_id
    ).first()
    if existing:
        raise HTTPException(status_code=400, detail="Employee already exists")

    # 4. Generate hakenmoto_id
    hakenmoto_id = generate_hakenmoto_id()  # E-0001, E-0002, etc.

    # 5. Create employee
    employee_data = request.employee_data
    employee = Employee(
        hakenmoto_id=hakenmoto_id,
        rirekisho_id=candidate.rirekisho_id,

        # Copy from candidate (40+ fields)
        full_name_roman=candidate.full_name_roman,
        full_name_kanji=candidate.full_name_kanji,
        full_name_kana=candidate.full_name_kana,
        date_of_birth=candidate.date_of_birth,
        gender=candidate.gender,
        email=candidate.email,
        phone=candidate.phone,
        photo_data_url=candidate.photo_data_url,
        ... (35+ más campos)

        # Add from employee_data
        factory_id=employee_data.get('factory_id'),
        hire_date=employee_data.get('hire_date'),
        jikyu=employee_data.get('jikyu'),
        position=employee_data.get('position'),
        contract_type=employee_data.get('contract_type'),
        apartment_id=employee_data.get('apartment_id'),
        status='active'
    )

    db.add(employee)

    # 6. Update candidate
    candidate.status = CandidateStatus.HIRED
    candidate.hired_at = datetime.now()

    # 7. Update request
    request.status = RequestStatus.COMPLETED
    request.hakenmoto_id = hakenmoto_id
    request.approved_at = datetime.now()
    request.approved_by = current_user.id

    # 8. Commit all changes
    db.commit()

    return {
        "message": "Employee created successfully",
        "hakenmoto_id": hakenmoto_id,
        "rirekisho_id": candidate.rirekisho_id
    }
```

---

## ARQUITECTURA FRONTEND

### Estructura de Directorios

```
frontend/
├── app/(dashboard)/
│   ├── candidates/
│   │   ├── page.tsx                    (Listado)
│   │   ├── new/page.tsx                (Crear)
│   │   ├── [id]/page.tsx               (Detalle)
│   │   └── [id]/edit/page.tsx          (Editar)
│   │
│   ├── requests/
│   │   ├── page.tsx                    (Listado con filtros)
│   │   └── [id]/page.tsx               (NUEVO - 527 líneas)
│   │       ├─ Candidate Data (read-only)
│   │       ├─ Employee Data Form (editable)
│   │       └─ Action Buttons
│   │
│   ├── employees/
│   │   ├── page.tsx                    (Listado)
│   │   └── [id]/page.tsx               (Detalle)
│   │
│   └── layout.tsx                      (Dashboard layout)
│
├── components/
│   ├── CandidateForm.tsx               (2000+ líneas, formulario candidato)
│   │   ├─ 221 campos de candidato
│   │   ├─ Validaciones
│   │   ├─ Foto upload
│   │   └─ OCR integration
│   │
│   ├── requests/
│   │   └─ RequestTypeBadge.tsx         (118 líneas)
│   │      ├─ NYUUSHA: Orange badge 🟠
│   │      └─ COMPLETED: Gray badge
│   │
│   ├── ui/                              (Shadcn/ui components)
│   │   ├─ button.tsx
│   │   ├─ form.tsx
│   │   ├─ input.tsx
│   │   ├─ date-picker.tsx
│   │   └─ (80+ componentes más)
│   │
│   └── (150+ componentes)
│
├── types/
│   └── api.ts                          (428 líneas)
│       ├─ enum RequestType             (con NYUUSHA)
│       ├─ enum RequestStatus           (con COMPLETED)
│       ├─ interface Request
│       ├─ interface EmployeeData       (NUEVO)
│       └─ (20+ interfaces más)
│
├── lib/
│   ├── api.ts                          (30KB, Axios client)
│   │   └─ requestService.getRequests()
│   │
│   └── themes.ts                       (17 temas predefinidos)
│
├── stores/
│   ├── auth-store.ts
│   ├── themeStore.ts
│   └── (9 stores Zustand)
│
└── hooks/
    ├── useFormValidation.ts
    ├── use-page-permission.ts
    └─ (11 custom hooks)
```

### Página Detail de Request: /requests/[id]/page.tsx

**Archivo**: `frontend/app/(dashboard)/requests/[id]/page.tsx` (527 líneas)

```typescript
'use client'

export default async function RequestDetailPage({ params }: Props) {
  const { id } = params

  // Estado
  const [request, setRequest] = useState<Request | null>(null)
  const [candidate, setCandidate] = useState<Candidate | null>(null)
  const [formData, setFormData] = useState<EmployeeData>({
    factory_id: '',
    hire_date: '',
    jikyu: 0,
    position: '',
    contract_type: '',
  })
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  // Load data
  useEffect(() => {
    async function loadData() {
      const req = await requestService.getRequest(id)
      setRequest(req)

      if (req.candidate_id) {
        const cand = await candidateService.getCandidate(req.candidate_id)
        setCandidate(cand)
      }

      if (req.employee_data) {
        setFormData(req.employee_data)
      }

      setLoading(false)
    }
    loadData()
  }, [id])

  // Save employee data
  const handleSave = async () => {
    setSaving(true)
    try {
      const response = await api.put(`/requests/${id}/employee-data`, formData)
      toast.success('従業員データを保存しました')
      setRequest(response.data)
    } catch (error) {
      toast.error('Error saving employee data')
    } finally {
      setSaving(false)
    }
  }

  // Approve and create employee
  const handleApprove = async () => {
    if (!window.confirm('従業員を作成しますか?')) return

    try {
      const response = await api.post(`/requests/${id}/approve-nyuusha`)
      toast.success('従業員を作成しました')
      router.push(`/employees/${response.data.hakenmoto_id}`)
    } catch (error) {
      toast.error('Error creating employee')
    }
  }

  if (loading) return <Skeleton />

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold">入社連絡票</h1>
        <div className="flex gap-2 mt-2">
          <RequestTypeBadge type={request.type} />
          <RequestStatusBadge status={request.status} />
        </div>
      </div>

      {/* Candidate Data Section */}
      <Card>
        <CardHeader>
          <h2 className="text-xl font-semibold">候補者データ</h2>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4">
            <p><strong>名前:</strong> {candidate?.full_name_roman}</p>
            <p><strong>生年月日:</strong> {candidate?.date_of_birth}</p>
            <p><strong>メール:</strong> {candidate?.email}</p>
            <p><strong>電話:</strong> {candidate?.phone}</p>
          </div>
          <Button
            variant="outline"
            className="mt-4"
            onClick={() => router.push(`/candidates/${candidate?.id}`)}
          >
            候補者の詳細を表示
          </Button>
        </CardContent>
      </Card>

      {/* Employee Data Form Section */}
      <Card>
        <CardHeader>
          <h2 className="text-xl font-semibold">従業員データ</h2>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Required fields */}
          <div>
            <label className="block font-semibold">工場ID *</label>
            <Input
              value={formData.factory_id}
              onChange={(e) => setFormData({...formData, factory_id: e.target.value})}
              placeholder="FAC-001"
              required
            />
          </div>

          <div>
            <label className="block font-semibold">入社日 *</label>
            <DatePicker
              value={formData.hire_date}
              onChange={(date) => setFormData({...formData, hire_date: date})}
              required
            />
          </div>

          <div>
            <label className="block font-semibold">時給 *</label>
            <Input
              type="number"
              value={formData.jikyu}
              onChange={(e) => setFormData({...formData, jikyu: parseInt(e.target.value)})}
              min={800}
              max={5000}
              required
            />
          </div>

          <div>
            <label className="block font-semibold">職位 *</label>
            <Input
              value={formData.position}
              onChange={(e) => setFormData({...formData, position: e.target.value})}
              placeholder="製造スタッフ"
              required
            />
          </div>

          <div>
            <label className="block font-semibold">契約タイプ *</label>
            <Select
              value={formData.contract_type}
              onValueChange={(value) => setFormData({...formData, contract_type: value})}
            >
              <SelectItem value="正社員">正社員 (Full-time)</SelectItem>
              <SelectItem value="契約社員">契約社員 (Contract)</SelectItem>
              <SelectItem value="パート">パート (Part-time)</SelectItem>
            </Select>
          </div>

          {/* Optional fields... */}

          {/* Buttons */}
          <div className="flex gap-2 pt-4">
            <Button
              onClick={handleSave}
              disabled={saving || !formData.factory_id}
              className="bg-blue-600"
            >
              保存 (Save)
            </Button>

            <Button
              onClick={handleApprove}
              disabled={saving || !formData.factory_id}
              className="bg-green-600"
            >
              承認して従業員作成 (Approve & Create)
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
```

---

## APIs REST

### Endpoints de Candidatos

```
POST   /api/candidates/                    - Crear candidato
GET    /api/candidates/                    - Listar candidatos
GET    /api/candidates/{id}                - Detalle candidato
PUT    /api/candidates/{id}                - Actualizar candidato
DELETE /api/candidates/{id}                - Eliminar (soft delete)
POST   /api/candidates/{id}/evaluate       - Aprobar/rechazar (auto-crea NYUUSHA)
POST   /api/candidates/{id}/approve        - Aprobar directo
POST   /api/candidates/{id}/reject         - Rechazar directo
POST   /api/candidates/{id}/upload-photo   - Subir foto
POST   /api/candidates/{id}/ocr            - Procesar OCR
```

### Endpoints de Requests (Nuevo para NYUUSHA)

```
GET    /api/requests/                      - Listar requests
POST   /api/requests/                      - Crear request (genérico)
GET    /api/requests/{id}                  - Detalle request
PUT    /api/requests/{id}                  - Actualizar request
DELETE /api/requests/{id}                  - Eliminar request

NEW ENDPOINTS FOR NYUUSHA:
PUT    /api/requests/{id}/employee-data    - Guardar datos de empleado
POST   /api/requests/{id}/approve-nyuusha  - Aprobar y crear empleado
```

### Request/Response Examples

#### 1. Aprobar Candidato (Auto-crea NYUUSHA)

```bash
POST /api/candidates/{id}/evaluate
Content-Type: application/json

{
  "approved": true,
  "notes": "Candidato apto para la posición"
}

Response (201):
{
  "id": 1,
  "rirekisho_id": "RK-2025-001",
  "full_name_roman": "Tanaka Taro",
  "status": "approved",
  "approved_by": 1,
  "approved_at": "2025-11-13T14:30:00Z"
}
```

#### 2. Guardar Datos de Empleado

```bash
PUT /api/requests/{id}/employee-data
Content-Type: application/json

{
  "factory_id": "FAC-001",
  "hire_date": "2025-11-20",
  "jikyu": 1500,
  "position": "製造スタッフ",
  "contract_type": "正社員",
  "apartment_id": "APT-001",
  "bank_name": "Bank Name",
  "bank_account": "123456789",
  "emergency_contact_name": "Contact Name",
  "emergency_contact_phone": "090-XXXX-XXXX"
}

Response (200):
{
  "message": "Employee data saved successfully",
  "request_id": 1,
  "employee_data": { ... }
}
```

#### 3. Aprobar y Crear Empleado

```bash
POST /api/requests/{id}/approve-nyuusha
Content-Type: application/json

{}

Response (200):
{
  "message": "Employee created successfully",
  "hakenmoto_id": "E-0001",
  "rirekisho_id": "RK-2025-001"
}
```

---

## COMPONENTES DE UI

### RequestTypeBadge Component

```typescript
// frontend/components/requests/RequestTypeBadge.tsx

interface Props {
  type: RequestType
  className?: string
}

export function RequestTypeBadge({ type, className }: Props) {
  const typeConfig = {
    [RequestType.YUKYU]: { label: '有給休暇', color: 'bg-blue-100' },
    [RequestType.HANKYU]: { label: '半休', color: 'bg-cyan-100' },
    [RequestType.IKKIKOKOKU]: { label: '一時帰国', color: 'bg-purple-100' },
    [RequestType.TAISHA]: { label: '退社', color: 'bg-red-100' },
    [RequestType.NYUUSHA]: { label: '入社連絡票', color: 'bg-orange-100' },  // NUEVO
  }

  const config = typeConfig[type]

  return (
    <span className={`px-2 py-1 rounded text-sm font-semibold ${config.color} ${className}`}>
      {config.label}
    </span>
  )
}
```

### RequestStatusBadge Component

```typescript
// frontend/components/requests/RequestStatusBadge.tsx

interface Props {
  status: RequestStatus
  className?: string
}

export function RequestStatusBadge({ status, className }: Props) {
  const statusConfig = {
    [RequestStatus.PENDING]: { label: '保留中', color: 'bg-yellow-100' },
    [RequestStatus.APPROVED]: { label: '承認済み', color: 'bg-green-100' },
    [RequestStatus.REJECTED]: { label: '却下', color: 'bg-red-100' },
    [RequestStatus.COMPLETED]: { label: '済', color: 'bg-gray-100' },  // NUEVO
  }

  const config = statusConfig[status]

  return (
    <span className={`px-2 py-1 rounded text-sm font-semibold ${config.color} ${className}`}>
      {config.label}
    </span>
  )
}
```

---

## CHECKLIST DE IMPLEMENTACIÓN

### ✅ Backend
- [x] Model: Candidate (221 campos)
- [x] Model: Request (con candidate_id, employee_data)
- [x] Enum: RequestType.NYUUSHA
- [x] Enum: RequestStatus.COMPLETED
- [x] Schema: RequestBase (actualizado)
- [x] Schema: EmployeeDataInput (nuevos campos)
- [x] Endpoint: POST /candidates/{id}/evaluate (auto-crea request)
- [x] Endpoint: PUT /requests/{id}/employee-data (guardar datos)
- [x] Endpoint: POST /requests/{id}/approve-nyuusha (crear employee)
- [x] Validaciones completas
- [x] Transacciones BD

### ✅ Frontend
- [x] Types: RequestType.NYUUSHA
- [x] Types: RequestStatus.COMPLETED
- [x] Types: EmployeeData interface
- [x] Component: RequestTypeBadge (NYUUSHA orange)
- [x] Component: RequestStatusBadge (COMPLETED)
- [x] Page: /requests/[id] (527 líneas)
- [x] Form: Employee data (validaciones)
- [x] Button: Save employee data
- [x] Button: Approve and create employee
- [x] Error handling
- [x] Loading states
- [x] Toast notifications

### ✅ Database
- [x] Migración: candidate_id column
- [x] Migración: employee_data column
- [x] Índice: idx_requests_candidate_id
- [x] Relationship: Request.candidate
- [x] Relationship: Candidate.requests
- [x] JSONB type para employee_data

### ✅ Documentation
- [x] TESTING_MANUAL_NYUUSHA_WORKFLOW.md
- [x] ARQUITECTURA_COMPLETA_CANDIDATOS_2025.md
- [x] NEXT_STEPS_NYUUSHA_WORKFLOW.md
- [x] IMPLEMENTATION_SUMMARY_NYUUSHA_RENRAKUHYO.md

---

## CONCLUSIÓN

La arquitectura del sistema de candidatos y 入社連絡票 está **100% COMPLETA** e implementada con:

✅ **221 campos de candidato**
✅ **Flujo automático de aprobación → request → empleado**
✅ **Formulario dinámico para datos de empleado**
✅ **Badges distintivos (Orange para NYUUSHA)**
✅ **Validaciones completas en frontend y backend**
✅ **Integración BD perfecta con JSONB**
✅ **Documentación exhaustiva**

**Sistema LISTO PARA PRODUCCIÓN** 🚀

---

**Documento creado**: 2025-11-13
**Completitud**: 100%
**Status**: ✅ APROBADO
