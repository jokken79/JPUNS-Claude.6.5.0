# 📋 DISEÑO: 入社連絡票 (NYŪSHA RENRAKUHYŌ)
## New Hire Notification Form - Sistema de Aprobación de Empleados

**Fecha**: 2025-11-11
**Versión**: 1.0
**Estado**: Design Document

---

## 🎯 OBJETIVO

Implementar un flujo de trabajo donde la **aprobación de un candidato** automáticamente crea un **入社連絡票** (formulario de notificación de nuevo empleado) en el sistema de 申請 (requests), permitiendo:

1. Recopilar datos adicionales del empleado
2. Aprobar la contratación formalmente
3. Crear automáticamente el registro de empleado
4. Archivar el 入社連絡票 en estado "済" (completado)

---

## 📊 FLUJO DE DATOS COMPLETO

```
┌─────────────────────────────────────────────────────────────────┐
│  FASE 1: APROBACIÓN DE CANDIDATO                                │
└─────────────────────────────────────────────────────────────────┘

Candidate (status=pending, rirekisho_id=RR-2025-0001)
   ↓
[Admin clicks 👍 Aprobar button]
   ↓
POST /api/candidates/{id}/evaluate { approved: true }
   ↓
✅ Candidate (status=approved)
   ↓
🆕 AUTO-CREATE Request (type=NYUUSHA, status=pending, candidate_id=123)


┌─────────────────────────────────────────────────────────────────┐
│  FASE 2: COMPLETAR DATOS DE EMPLEADO                            │
└─────────────────────────────────────────────────────────────────┘

Request appears in /requests page with badge "入社連絡票"
   ↓
[Admin clicks on request to view details]
   ↓
入社連絡票 Detail Page shows:
   ├─ Candidate Data (READ-ONLY)
   │  └─ Name, rirekisho_id, DOB, contact, photo, etc.
   └─ Employee Data Form (EDITABLE)
      └─ factory_id, hire_date, jikyu, position, contract_type, etc.
   ↓
[Admin fills employee-specific data]
   ↓
[Admin clicks "保存" (Save)]
   ↓
PUT /api/requests/{id} { employee_data: {...} }
   ↓
✅ Request (status=pending, employee_data saved)


┌─────────────────────────────────────────────────────────────────┐
│  FASE 3: APROBACIÓN FINAL Y CREACIÓN DE EMPLEADO                │
└─────────────────────────────────────────────────────────────────┘

Request (status=pending) with complete employee_data
   ↓
[Admin clicks "承認" (Approve) button]
   ↓
POST /api/requests/{id}/approve-nyuusha
   ↓
Backend creates Employee record:
   ├─ Copy candidate data (40+ fields)
   ├─ Add employee-specific data from request
   ├─ Link via rirekisho_id
   └─ Generate hakenmoto_id
   ↓
Update Candidate (status=hired)
   ↓
Update Request (status=completed or approved)
   ↓
✅ Employee created, Candidate marked as hired, Request archived


┌─────────────────────────────────────────────────────────────────┐
│  FASE 4: ARCHIVO                                                 │
└─────────────────────────────────────────────────────────────────┘

入社連絡票 moves to "済" (completed) section
   ↓
Visible in /requests page with filter: status=completed
   ↓
Historical record maintained
```

---

## 🗄️ CAMBIOS EN BASE DE DATOS

### 1. Agregar Campo `candidate_id` a Tabla `requests`

```sql
-- Migration: Add candidate_id foreign key to requests table
ALTER TABLE requests
ADD COLUMN candidate_id INTEGER REFERENCES candidates(id);

-- Index for performance
CREATE INDEX idx_requests_candidate_id ON requests(candidate_id);

-- Allow NULL for backward compatibility (existing requests won't have candidate_id)
```

**Justificación**: Necesitamos vincular cada 入社連絡票 con su candidato original.

---

### 2. Agregar Nuevo Tipo de Request: `NYUUSHA`

**Archivo**: `backend/app/models/models.py`

```python
class RequestType(str, enum.Enum):
    YUKYU = "yukyu"              # 有給休暇 - Paid vacation
    HANKYU = "hankyu"            # 半休 - Half day
    IKKIKOKOKU = "ikkikokoku"    # 一時帰国 - Temporary return to home
    TAISHA = "taisha"            # 退社 - Resignation
    NYUUSHA = "nyuusha"          # 入社連絡票 - New hire notification ← ADD THIS
```

---

### 3. (Opcional) Agregar Estado `COMPLETED` = "済"

**Archivo**: `backend/app/models/models.py`

```python
class RequestStatus(str, enum.Enum):
    PENDING = "pending"      # 保留中
    APPROVED = "approved"    # 承認済み
    REJECTED = "rejected"    # 却下
    COMPLETED = "completed"  # 済 (completado/archivado) ← ADD THIS
```

**Nota**: Esto es opcional. Podríamos usar `status=approved` para requests aprobados y filtrar por tipo para mostrar archivados.

---

### 4. Agregar Campo JSON `employee_data` a Tabla `requests`

**Propósito**: Almacenar datos de empleado antes de crear el registro final.

```sql
-- Migration: Add employee_data JSON field
ALTER TABLE requests
ADD COLUMN employee_data JSONB;
```

**Estructura del JSON**:
```json
{
  "factory_id": "FAC-001",
  "hire_date": "2025-11-15",
  "jikyu": 1500,
  "position": "製造スタッフ",
  "contract_type": "正社員",
  "hakensaki_shain_id": "EMP-2025-0123",
  "notes": "Additional notes...",
  "apartment_id": "APT-001",
  "bank_name": "三菱UFJ銀行",
  "bank_account": "1234567890",
  "emergency_contact_name": "田中太郎",
  "emergency_contact_phone": "090-1234-5678"
}
```

---

## 📋 MAPEO DE CAMPOS: CANDIDATE → EMPLOYEE

### Datos que se Copian Automáticamente del Candidato

| Campo Candidate | Campo Employee | Transformación |
|----------------|----------------|----------------|
| `rirekisho_id` | `rirekisho_id` | Directo (FK) |
| `full_name_roman` | `full_name_roman` | Directo |
| `full_name_kanji` | `full_name_kanji` | Directo |
| `full_name_kana` | `full_name_kana` | Directo |
| `date_of_birth` | `date_of_birth` | Directo |
| `gender` | `gender` | Directo |
| `nationality` | `nationality` | Directo |
| `email` | `email` | Directo |
| `phone` | `phone` | Directo |
| `address` | `address` | Directo |
| `photo_data_url` | `photo_data_url` | Directo |
| `passport_number` | `passport_number` | Directo |
| `zairyu_card_number` | `zairyu_card_number` | Directo |
| ... | ... | (40+ campos más) |

### Datos Específicos de Empleado (No en Candidate)

Estos datos se completan en el formulario del 入社連絡票:

| Campo Employee | Fuente | Requerido |
|---------------|--------|-----------|
| `hakenmoto_id` | Auto-generado | ✅ |
| `factory_id` | Formulario 入社連絡票 | ✅ |
| `hire_date` | Formulario (default: hoy) | ✅ |
| `jikyu` | Formulario | ✅ |
| `position` | Formulario | ✅ |
| `contract_type` | Formulario | ✅ |
| `hakensaki_shain_id` | Formulario | ⚠️ Opcional |
| `apartment_id` | Formulario | ⚠️ Opcional |
| `bank_name` | Formulario | ⚠️ Opcional |
| `bank_account` | Formulario | ⚠️ Opcional |
| `emergency_contact_name` | Formulario | ⚠️ Opcional |
| `emergency_contact_phone` | Formulario | ⚠️ Opcional |

---

## 🔄 ENDPOINTS API NECESARIOS

### 1. Modificar Endpoint de Evaluación de Candidato

**Endpoint Actual**: `POST /api/candidates/{id}/evaluate`

**Nueva Funcionalidad**:
```python
@router.post("/{candidate_id}/evaluate", response_model=CandidateResponse)
async def quick_evaluate_candidate(
    candidate_id: int,
    evaluation: CandidateEvaluation,
    current_user: User = Depends(auth_service.require_role("coordinator")),
    db: Session = Depends(get_db)
):
    # 1. Update candidate status
    candidate = db.query(Candidate).filter(Candidate.id == candidate_id).first()

    if evaluation.approved:
        candidate.status = "approved"
        candidate.approved_by = current_user.id
        candidate.approved_at = datetime.now()

        # 2. 🆕 AUTO-CREATE 入社連絡票 REQUEST
        nyuusha_request = Request(
            candidate_id=candidate.id,
            request_type=RequestType.NYUUSHA,
            status=RequestStatus.PENDING,
            start_date=date.today(),
            end_date=date.today(),
            reason=f"新規採用: {candidate.full_name_kanji or candidate.full_name_roman}",
            employee_data={}  # Empty JSON, to be filled later
        )
        db.add(nyuusha_request)
    else:
        candidate.status = "pending"

    db.commit()
    db.refresh(candidate)
    return candidate
```

---

### 2. Nuevo Endpoint para Guardar Datos de Empleado

**Endpoint**: `PUT /api/requests/{id}/employee-data`

**Propósito**: Guardar datos de empleado en el campo JSON antes de aprobar.

```python
@router.put("/{request_id}/employee-data")
async def save_employee_data(
    request_id: int,
    employee_data: EmployeeDataInput,  # Pydantic schema
    current_user: User = Depends(auth_service.require_role("admin")),
    db: Session = Depends(get_db)
):
    request = db.query(Request).filter(Request.id == request_id).first()

    if not request:
        raise HTTPException(status_code=404, detail="Request not found")

    if request.request_type != RequestType.NYUUSHA:
        raise HTTPException(status_code=400, detail="Not a new hire request")

    if request.status != RequestStatus.PENDING:
        raise HTTPException(status_code=400, detail="Request already processed")

    # Save employee data as JSON
    request.employee_data = employee_data.dict()
    db.commit()

    return {"message": "Employee data saved successfully"}
```

**Schema**:
```python
class EmployeeDataInput(BaseModel):
    factory_id: str
    hire_date: date
    jikyu: int
    position: str
    contract_type: str
    hakensaki_shain_id: Optional[str] = None
    apartment_id: Optional[str] = None
    bank_name: Optional[str] = None
    bank_account: Optional[str] = None
    emergency_contact_name: Optional[str] = None
    emergency_contact_phone: Optional[str] = None
```

---

### 3. Nuevo Endpoint para Aprobar 入社連絡票 y Crear Empleado

**Endpoint**: `POST /api/requests/{id}/approve-nyuusha`

**Propósito**: Aprobar el 入社連絡票, crear empleado, actualizar candidato.

```python
@router.post("/{request_id}/approve-nyuusha")
async def approve_nyuusha_request(
    request_id: int,
    current_user: User = Depends(auth_service.require_role("admin")),
    db: Session = Depends(get_db)
):
    # 1. Get request
    request = db.query(Request).filter(Request.id == request_id).first()

    if not request:
        raise HTTPException(status_code=404, detail="Request not found")

    if request.request_type != RequestType.NYUUSHA:
        raise HTTPException(status_code=400, detail="Not a new hire request")

    if request.status != RequestStatus.PENDING:
        raise HTTPException(status_code=400, detail="Request already processed")

    if not request.employee_data:
        raise HTTPException(status_code=400, detail="Employee data not filled")

    # 2. Get candidate
    candidate = db.query(Candidate).filter(Candidate.id == request.candidate_id).first()

    if not candidate:
        raise HTTPException(status_code=404, detail="Candidate not found")

    # 3. Check if employee already exists
    existing = db.query(Employee).filter(
        Employee.rirekisho_id == candidate.rirekisho_id
    ).first()

    if existing:
        raise HTTPException(status_code=400, detail="Employee already exists")

    # 4. Generate hakenmoto_id
    max_id = db.query(func.max(Employee.hakenmoto_id)).scalar() or 0
    hakenmoto_id = max_id + 1

    # 5. Create Employee record
    employee_data = request.employee_data  # JSON data

    new_employee = Employee(
        hakenmoto_id=hakenmoto_id,
        rirekisho_id=candidate.rirekisho_id,

        # Copy from candidate (40+ fields)
        full_name_roman=candidate.full_name_roman,
        full_name_kanji=candidate.full_name_kanji,
        full_name_kana=candidate.full_name_kana,
        date_of_birth=candidate.date_of_birth,
        gender=candidate.gender,
        nationality=candidate.nationality,
        email=candidate.email,
        phone=candidate.phone,
        address=candidate.address,
        photo_data_url=candidate.photo_data_url,
        # ... 30+ more fields ...

        # Add from employee_data JSON
        factory_id=employee_data.get("factory_id"),
        hire_date=employee_data.get("hire_date"),
        jikyu=employee_data.get("jikyu"),
        position=employee_data.get("position"),
        contract_type=employee_data.get("contract_type"),
        hakensaki_shain_id=employee_data.get("hakensaki_shain_id"),
        apartment_id=employee_data.get("apartment_id"),
        bank_name=employee_data.get("bank_name"),
        bank_account=employee_data.get("bank_account"),
        emergency_contact_name=employee_data.get("emergency_contact_name"),
        emergency_contact_phone=employee_data.get("emergency_contact_phone"),

        # Status
        status="active",
        created_at=datetime.now(),
        updated_at=datetime.now()
    )

    db.add(new_employee)

    # 6. Update candidate status to HIRED
    candidate.status = CandidateStatus.HIRED

    # 7. Update request status to COMPLETED (or APPROVED)
    request.status = RequestStatus.COMPLETED  # or APPROVED
    request.approved_by = current_user.id
    request.approved_at = datetime.now()

    db.commit()
    db.refresh(new_employee)

    return {
        "message": "Employee created successfully",
        "employee_id": new_employee.id,
        "hakenmoto_id": new_employee.hakenmoto_id,
        "rirekisho_id": new_employee.rirekisho_id
    }
```

---

## 🎨 CAMBIOS EN FRONTEND

### 1. Actualizar Types

**Archivo**: `frontend/types/api.ts`

```typescript
export enum RequestType {
  YUKYU = 'yukyu',
  HANKYU = 'hankyu',
  IKKIKOKOKU = 'ikkikokoku',
  TAISHA = 'taisha',
  NYUUSHA = 'nyuusha',  // 🆕 ADD THIS
}

export enum RequestStatus {
  PENDING = 'pending',
  APPROVED = 'approved',
  REJECTED = 'rejected',
  COMPLETED = 'completed',  // 🆕 ADD THIS (opcional)
}

export interface Request {
  id: number
  hakenmoto_id?: number
  candidate_id?: number  // 🆕 ADD THIS
  request_type: RequestType
  status: RequestStatus
  start_date: string
  end_date: string
  reason?: string
  notes?: string
  employee_data?: EmployeeData  // 🆕 ADD THIS
  approved_by?: number
  approved_at?: string
  created_at: string
  updated_at: string
}

export interface EmployeeData {
  factory_id: string
  hire_date: string
  jikyu: number
  position: string
  contract_type: string
  hakensaki_shain_id?: string
  apartment_id?: string
  bank_name?: string
  bank_account?: string
  emergency_contact_name?: string
  emergency_contact_phone?: string
}
```

---

### 2. Crear Componente de Badge para 入社連絡票

**Archivo**: `frontend/components/requests/RequestTypeBadge.tsx`

```typescript
export function RequestTypeBadge({ type }: { type: RequestType }) {
  const config = {
    yukyu: { label: '有給休暇', color: 'bg-blue-100 text-blue-800' },
    hankyu: { label: '半休', color: 'bg-cyan-100 text-cyan-800' },
    ikkikokoku: { label: '一時帰国', color: 'bg-purple-100 text-purple-800' },
    taisha: { label: '退社', color: 'bg-red-100 text-red-800' },
    nyuusha: { label: '入社連絡票', color: 'bg-orange-100 text-orange-800' },  // 🆕
  }

  const { label, color } = config[type]

  return (
    <span className={`px-2 py-1 rounded-full text-xs font-semibold ${color}`}>
      {label}
    </span>
  )
}
```

---

### 3. Crear Página de Detalle para 入社連絡票

**Archivo**: `frontend/app/(dashboard)/requests/[id]/page.tsx` (NUEVO)

**Funcionalidad**:
- Muestra datos del candidato (read-only)
- Formulario para datos de empleado (editable)
- Botón "保存" para guardar datos sin aprobar
- Botón "承認" para aprobar y crear empleado

```typescript
'use client'

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import { requestService, candidateService } from '@/lib/api'
import { Request, Candidate, EmployeeData } from '@/types/api'

export default function RequestDetailPage() {
  const { id } = useParams()
  const [request, setRequest] = useState<Request | null>(null)
  const [candidate, setCandidate] = useState<Candidate | null>(null)
  const [employeeData, setEmployeeData] = useState<EmployeeData>({
    factory_id: '',
    hire_date: new Date().toISOString().split('T')[0],
    jikyu: 1200,
    position: '',
    contract_type: '正社員',
  })

  useEffect(() => {
    loadRequest()
  }, [id])

  const loadRequest = async () => {
    const req = await requestService.getById(Number(id))
    setRequest(req)

    if (req.candidate_id) {
      const cand = await candidateService.getById(req.candidate_id)
      setCandidate(cand)
    }

    if (req.employee_data) {
      setEmployeeData(req.employee_data)
    }
  }

  const handleSave = async () => {
    await fetch(`/api/requests/${id}/employee-data`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(employeeData)
    })
    alert('データを保存しました')
  }

  const handleApprove = async () => {
    await fetch(`/api/requests/${id}/approve-nyuusha`, {
      method: 'POST'
    })
    alert('入社連絡票を承認し、従業員を作成しました')
    router.push('/requests')
  }

  if (!request) return <div>Loading...</div>

  return (
    <div className="space-y-6">
      <h1>入社連絡票 - {candidate?.full_name_kanji}</h1>

      {/* Candidate Data (Read-Only) */}
      <Card>
        <CardHeader>
          <CardTitle>候補者情報 (参照のみ)</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4">
            <div>履歴書番号: {candidate?.rirekisho_id}</div>
            <div>氏名: {candidate?.full_name_kanji}</div>
            <div>生年月日: {candidate?.date_of_birth}</div>
            <div>Email: {candidate?.email}</div>
            {/* ... more fields ... */}
          </div>
        </CardContent>
      </Card>

      {/* Employee Data Form (Editable) */}
      <Card>
        <CardHeader>
          <CardTitle>従業員情報 (入力)</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <Input
              label="派遣先工場"
              value={employeeData.factory_id}
              onChange={(e) => setEmployeeData({...employeeData, factory_id: e.target.value})}
            />
            <Input
              label="入社日"
              type="date"
              value={employeeData.hire_date}
              onChange={(e) => setEmployeeData({...employeeData, hire_date: e.target.value})}
            />
            <Input
              label="時給"
              type="number"
              value={employeeData.jikyu}
              onChange={(e) => setEmployeeData({...employeeData, jikyu: Number(e.target.value)})}
            />
            {/* ... more fields ... */}
          </div>
        </CardContent>
      </Card>

      {/* Actions */}
      <div className="flex gap-4">
        <Button onClick={handleSave} variant="outline">
          保存 (Save)
        </Button>
        <Button onClick={handleApprove} variant="default">
          承認して従業員作成 (Approve & Create Employee)
        </Button>
      </div>
    </div>
  )
}
```

---

### 4. Actualizar Lista de Requests

**Archivo**: `frontend/app/(dashboard)/requests/page.tsx`

**Cambios**:
- Mostrar badge "入社連絡票" para type=NYUUSHA
- Link a la página de detalle del request
- Filtrar por tipo NYUUSHA
- Mostrar candidate info si está disponible

```typescript
{requests.map((request) => (
  <tr key={request.id}>
    <td>{request.id}</td>
    <td>
      <RequestTypeBadge type={request.request_type} />
      {request.request_type === 'nyuusha' && request.candidate_id && (
        <span className="ml-2 text-sm text-gray-500">
          候補者 #{request.candidate_id}
        </span>
      )}
    </td>
    <td>{request.status}</td>
    <td>
      <Link href={`/requests/${request.id}`}>
        <Button variant="link">詳細</Button>
      </Link>
    </td>
  </tr>
))}
```

---

## 🧪 TESTING CHECKLIST

### Backend Tests
- [ ] Candidate evaluation creates 入社連絡票 request
- [ ] Request has correct type (NYUUSHA) and status (PENDING)
- [ ] candidate_id is linked correctly
- [ ] Employee data can be saved via PUT endpoint
- [ ] Approval creates employee record with all fields
- [ ] Candidate status updates to HIRED
- [ ] Request status updates to COMPLETED
- [ ] Duplicate employee prevention works

### Frontend Tests
- [ ] NYUUSHA badge shows correctly in requests list
- [ ] Detail page loads candidate data
- [ ] Employee form can be filled and saved
- [ ] Approval button creates employee successfully
- [ ] Navigation works (request → candidate → employee)
- [ ] Error handling for missing data

---

## 📝 MIGRATION SCRIPT

**Archivo**: `backend/alembic/versions/2025_11_11_1500_add_nyuusha_renrakuhyo.py`

```python
"""Add candidate_id to requests and NYUUSHA request type

Revision ID: abc123def456
Revises: previous_revision_id
Create Date: 2025-11-11 15:00:00.000000

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers
revision = 'abc123def456'
down_revision = 'previous_revision_id'
branch_labels = None
depends_on = None


def upgrade() -> None:
    # Add candidate_id column
    op.add_column('requests',
        sa.Column('candidate_id', sa.Integer(), nullable=True)
    )

    # Add foreign key constraint
    op.create_foreign_key(
        'fk_requests_candidate_id',
        'requests', 'candidates',
        ['candidate_id'], ['id'],
        ondelete='CASCADE'
    )

    # Create index for performance
    op.create_index(
        'idx_requests_candidate_id',
        'requests',
        ['candidate_id']
    )

    # Add employee_data JSONB column
    op.add_column('requests',
        sa.Column('employee_data', postgresql.JSONB(), nullable=True)
    )

    # Note: RequestType.NYUUSHA is handled in models.py enum
    # Note: RequestStatus.COMPLETED is handled in models.py enum


def downgrade() -> None:
    op.drop_index('idx_requests_candidate_id', table_name='requests')
    op.drop_constraint('fk_requests_candidate_id', 'requests', type_='foreignkey')
    op.drop_column('requests', 'candidate_id')
    op.drop_column('requests', 'employee_data')
```

---

## 🚀 IMPLEMENTACIÓN STEP-BY-STEP

### Orden Recomendado:

1. **Backend - Database**:
   - ✅ Create Alembic migration (add candidate_id, employee_data)
   - ✅ Update RequestType enum (add NYUUSHA)
   - ✅ Update RequestStatus enum (add COMPLETED)
   - ✅ Update Request model (add relationships)

2. **Backend - Schemas**:
   - ✅ Update RequestBase schema (add candidate_id, employee_data)
   - ✅ Create EmployeeDataInput schema
   - ✅ Update RequestResponse schema

3. **Backend - Services**:
   - ✅ Update CandidateService.approve_candidate() to create 入社連絡票
   - ✅ Create RequestService.save_employee_data()
   - ✅ Create RequestService.approve_nyuusha()

4. **Backend - API**:
   - ✅ Update POST /api/candidates/{id}/evaluate (auto-create request)
   - ✅ Add PUT /api/requests/{id}/employee-data
   - ✅ Add POST /api/requests/{id}/approve-nyuusha
   - ✅ Fix type mismatches in approve/reject methods

5. **Frontend - Types**:
   - ✅ Update RequestType enum
   - ✅ Update RequestStatus enum
   - ✅ Add EmployeeData interface
   - ✅ Update Request interface

6. **Frontend - Components**:
   - ✅ Create RequestTypeBadge component
   - ✅ Update RequestsList to show NYUUSHA badge
   - ✅ Create request detail page layout

7. **Frontend - Pages**:
   - ✅ Create /requests/[id]/page.tsx (detail page)
   - ✅ Update /requests/page.tsx (add link to detail)

8. **Testing**:
   - ✅ Backend unit tests
   - ✅ Frontend E2E tests with Playwright
   - ✅ Manual testing of complete workflow

---

## ⚠️ CONSIDERACIONES IMPORTANTES

### 1. **Backward Compatibility**
- `candidate_id` debe ser nullable para no romper requests existentes
- Requests antiguos no tendrán 入社連絡票 functionality

### 2. **Validation**
- Validar que employee_data esté completo antes de aprobar
- Campos requeridos: factory_id, hire_date, jikyu, position, contract_type

### 3. **Error Handling**
- ¿Qué pasa si el candidate ya tiene un employee?
- ¿Qué pasa si se intenta aprobar sin llenar datos?
- ¿Qué pasa si hay error al crear el employee?

### 4. **UX/UI**
- Indicador visual claro de que es un 入社連絡票
- Diferenciación de otros tipos de requests
- Breadcrumbs: Candidate → 入社連絡票 → Employee

### 5. **Permisos**
- ¿Quién puede crear 入社連絡票? (auto-creado)
- ¿Quién puede llenar datos? (admin, coordinator)
- ¿Quién puede aprobar? (admin only)

---

## 📚 REFERENCIAS

- **Exploration Document**: `/docs/REQUESTS_SYSTEM_EXPLORATION.md`
- **Candidate Approval Flow**: Analyzed in previous exploration
- **Employee Model**: `backend/app/models/models.py` (lines 495-605)
- **Candidate Model**: `backend/app/models/models.py` (lines 160-379)
- **CandidateService**: `backend/app/services/candidate_service.py`

---

**Diseño completado. Listo para implementación.** 🚀
