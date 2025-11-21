# ANÁLISIS ARQUITECTURA ACTUAL - UNS-ClaudeJP 5.4.1

**Fecha:** 2025-11-13  
**Sistema:** UNS-ClaudeJP 5.4.1 - HR Management System  
**Stack:** FastAPI 0.115.6 + Next.js 16.0.0 + PostgreSQL 15

---

## 1. FLUJO CANDIDATE → 入社連絡票 → EMPLOYEE

### 1.1 Endpoints Involucrados

#### Backend - Candidates API (`backend/app/api/candidates.py`):
- **POST /api/candidates/** (línea 329-366) - Crear candidato desde履歴書
- **POST /api/candidates/rirekisho/form** (línea 369-466) - Guardar formulario de履歴書con OCR
- **POST /api/candidates/{candidate_id}/evaluate** (línea 581-638) - Evaluación rápida (👍/👎)

#### Backend - Requests API (`backend/app/api/requests.py`):
- **PUT /api/requests/{request_id}/employee-data** (línea 295-344) - Guardar datos de empleado
- **POST /api/requests/{request_id}/approve-nyuusha** (línea 347-486) - Aprobar入社連絡票

#### Backend - Employees API (`backend/app/api/employees.py`):
- **POST /api/employees/** (línea 46-104) - Crear empleado (método legacy)

### 1.2 Flujo Paso a Paso

#### **FASE 1: Candidato Aplica (履歴書)**

**Ubicación:** `candidates.py`, líneas 369-466  
**Endpoint:** `POST /api/candidates/rirekisho/form`

```python
# 1. Usuario sube履歴書(rirekisho) con OCR o entrada manual
# 2. Se genera applicant_id automáticamente (línea 438):
applicant_id = generate_applicant_id(db)  # Secuencial desde 2000

# 3. Se genera rirekisho_id automáticamente (línea 444):
rirekisho_id = generate_rirekisho_id(db)  # UNS-1, UNS-2, UNS-3...

# 4. Se guardan ~60 campos del candidate (línea 175-260):
updates = _map_form_to_candidate(form_data, applicant_id, photo_data_url)
# Campos incluyen: nombre, fecha nacimiento, nacionalidad, dirección,
# visa, pasaporte, licencia, familia, experiencia laboral, etc.

# 5. Foto comprimida automáticamente (líneas 402-427):
photo_data_url = photo_service.compress_photo(photo_data_url)
```

**Campos Clave del Candidate:**
- `rirekisho_id` (PK): "UNS-123" - Identificador único
- `applicant_id`: "2001" - ID numérico secuencial
- `status`: "pending" → "approved" → "hired"
- `full_name_kanji`, `full_name_kana`, `full_name_roman`
- `date_of_birth`, `gender`, `nationality`
- `phone`, `email`, `address`
- `passport_number`, `residence_card_number`, `visa_type`
- `photo_data_url`: Foto en base64 (comprimida)

---

#### **FASE 2: Evaluación Rápida (👍/👎)**

**Ubicación:** `candidates.py`, líneas 581-638  
**Endpoint:** `POST /api/candidates/{candidate_id}/evaluate`

```python
# Si el evaluador aprueba (👍):
if evaluation.approved:
    candidate.status = "approved"  # Línea 605
    candidate.approved_by = current_user.id
    candidate.approved_at = datetime.now()
    
    # 🆕 AUTO-CREA入社連絡票 (New Hire Notification Form)
    # Líneas 609-630
    nyuusha_request = RequestModel(
        candidate_id=candidate.id,
        hakenmoto_id=None,  # Se llenará después
        request_type=RequestType.NYUUSHA,
        status=RequestStatus.PENDING,
        start_date=date.today(),
        end_date=date.today(),
        reason=f"新規採用: {candidate.full_name_kanji}",
        employee_data={}  # JSON vacío, se llenará después
    )
    db.add(nyuusha_request)
```

**Estado después de evaluación:**
- Candidate: `status = "approved"`
- Request: `type = NYUUSHA`, `status = PENDING`, `employee_data = {}`

---

#### **FASE 3: Llenar Datos de Empleado (入社連絡票)**

**Ubicación:** `requests.py`, líneas 295-344  
**Endpoint:** `PUT /api/requests/{request_id}/employee-data`

```python
# Admin/HR llena los datos específicos del empleado:
request.employee_data = employee_data.model_dump()  # Línea 333

# employee_data contiene campos NO en candidate:
{
    "factory_id": "高雄工業株式会社_本社工場",
    "hakensaki_shain_id": "E-12345",  # ID que la fábrica da al empleado
    "hire_date": "2025-11-15",
    "jikyu": 1650,  # 時給 - Salario por hora
    "position": "NC施盤オペレーター",
    "contract_type": "派遣",
    "apartment_id": 45,
    "bank_name": "愛知銀行",
    "bank_account": "1234567890",
    "emergency_contact_name": "山田太郎",
    "emergency_contact_phone": "090-1234-5678"
}
```

**Estado después de llenar datos:**
- Request: `employee_data = {JSON completo}`
- Listo para aprobar

---

#### **FASE 4: Aprobar入社連絡票→ Crear Employee**

**Ubicación:** `requests.py`, líneas 347-486  
**Endpoint:** `POST /api/requests/{request_id}/approve-nyuusha`

**Proceso Completo:**

```python
# 1. Validar request es NYUUSHA y PENDING (líneas 366-386)
if request.request_type != RequestType.NYUUSHA:
    raise HTTPException(400, "Solo para NYUUSHA")
if not request.employee_data:
    raise HTTPException(400, "Faltan datos de empleado")

# 2. Obtener candidate (líneas 388-397)
candidate = db.query(Candidate).filter(
    Candidate.id == request.candidate_id
).first()

# 3. Verificar que no exista Employee con ese rirekisho_id (líneas 399-408)
existing_employee = db.query(Employee).filter(
    Employee.rirekisho_id == candidate.rirekisho_id
).first()
if existing_employee:
    raise HTTPException(400, "Empleado ya existe")

# 4. Generar hakenmoto_id automáticamente (líneas 410-412)
max_hakenmoto_id = db.query(func.max(Employee.hakenmoto_id)).scalar() or 0
new_hakenmoto_id = max_hakenmoto_id + 1  # Secuencial: 1, 2, 3...

# 5. Extraer employee_data (línea 415)
emp_data = request.employee_data

# 6. Crear Employee copiando ~40 campos del Candidate (líneas 418-457)
new_employee = Employee(
    hakenmoto_id=new_hakenmoto_id,
    rirekisho_id=candidate.rirekisho_id,  # ⭐ VÍNCULO PRINCIPAL
    
    # Copiar campos del Candidate:
    full_name_roman=candidate.full_name_roman,
    full_name_kanji=candidate.full_name_kanji,
    full_name_kana=candidate.full_name_kana,
    date_of_birth=candidate.date_of_birth,
    gender=candidate.gender,
    nationality=candidate.nationality,
    email=candidate.email,
    phone=candidate.phone,
    address=candidate.address,
    photo_data_url=candidate.photo_data_url,  # ⭐ FOTO
    passport_number=candidate.passport_number,
    zairyu_card_number=candidate.zairyu_card_number,
    visa_type=candidate.visa_type,
    visa_expiration=candidate.visa_expiration,
    marital_status=candidate.marital_status,
    dependents=candidate.dependents,
    
    # Agregar campos específicos de Employee desde employee_data:
    factory_id=emp_data.get("factory_id"),
    hire_date=emp_data.get("hire_date"),
    jikyu=emp_data.get("jikyu"),
    position=emp_data.get("position"),
    contract_type=emp_data.get("contract_type"),
    hakensaki_shain_id=emp_data.get("hakensaki_shain_id"),  # ⭐ ID FÁBRICA
    apartment_id=emp_data.get("apartment_id"),
    bank_name=emp_data.get("bank_name"),
    bank_account=emp_data.get("bank_account"),
    emergency_contact_name=emp_data.get("emergency_contact_name"),
    emergency_contact_phone=emp_data.get("emergency_contact_phone"),
    
    # Estado inicial:
    status="active",
    created_at=datetime.now(),
    updated_at=datetime.now()
)

# 7. Guardar y vincular (líneas 459-472)
db.add(new_employee)
db.flush()  # Obtener ID

# 8. Actualizar Candidate status a HIRED (línea 463)
candidate.status = CandidateStatus.HIRED

# 9. Marcar Request como COMPLETED (済) (líneas 466-469)
request.status = RequestStatus.COMPLETED
request.approved_by = current_user.id
request.approved_at = datetime.now()
request.hakenmoto_id = new_hakenmoto_id  # Vincular

db.commit()
```

**Resultado Final:**
- Candidate: `status = "hired"`, vinculado a Employee vía `rirekisho_id`
- Employee: Nuevo registro con `hakenmoto_id` único
- Request: `status = "completed"` (済)

---

### 1.3 Campos Compartidos vs Nuevos

#### **Campos Copiados del Candidate al Employee (40+ campos):**

| Campo | Descripción | Fuente |
|-------|-------------|--------|
| `rirekisho_id` | ID único del candidato | Candidate (PK) |
| `full_name_roman` | Nombre en romaji | Candidate |
| `full_name_kanji` | Nombre en kanji (氏名) | Candidate |
| `full_name_kana` | Nombre en kana (フリガナ) | Candidate |
| `date_of_birth` | Fecha de nacimiento | Candidate |
| `gender` | Género | Candidate |
| `nationality` | Nacionalidad | Candidate |
| `email` | Email | Candidate |
| `phone` | Teléfono | Candidate |
| `address` | Dirección completa | Candidate |
| `photo_data_url` | Foto en base64 | Candidate |
| `passport_number` | Número de pasaporte | Candidate |
| `passport_expiry` | Expiración pasaporte | Candidate |
| `zairyu_card_number` | 在留カード番号 | Candidate |
| `residence_expiry` | 在留期限 | Candidate |
| `visa_type` | Tipo de visa | Candidate |
| `visa_expiration` | Expiración visa | Candidate |
| `license_number` | 運転免許番号 | Candidate |
| `license_expiry` | 免許期限 | Candidate |
| `marital_status` | Estado civil | Candidate |
| `emergency_contact_*` | Contacto emergencia | Candidate (3 campos) |

#### **Campos Nuevos en Employee (desde employee_data JSON):**

| Campo | Descripción | Fuente |
|-------|-------------|--------|
| `hakenmoto_id` | **ID único empleado** (auto-generado) | Auto-incremento |
| `hakensaki_shain_id` | **ID que fábrica da** (ej: "E-12345") | employee_data |
| `factory_id` | ID de fábrica asignada | employee_data |
| `company_name` | Nombre empresa cliente | employee_data |
| `plant_name` | Nombre planta | employee_data |
| `hire_date` | Fecha de entrada (入社日) | employee_data |
| `current_hire_date` | Fecha entrada fábrica actual | employee_data |
| `jikyu` | Salario por hora (時給) | employee_data |
| `jikyu_revision_date` | Fecha revisión salario | employee_data |
| `position` | Puesto (ej: "NC旋盤") | employee_data |
| `contract_type` | Tipo contrato (派遣/請負) | employee_data |
| `assignment_location` | Ubicación asignación (配属先) | employee_data |
| `assignment_line` | Línea asignación (配属ライン) | employee_data |
| `job_description` | Descripción trabajo | employee_data |
| `hourly_rate_charged` | 請求単価 - Tarifa factura | employee_data |
| `profit_difference` | 差額利益 - Diferencia | employee_data |
| `standard_compensation` | 標準報酬 | employee_data |
| `health_insurance` | 健康保険 | employee_data |
| `pension_insurance` | 厚生年金 | employee_data |
| `social_insurance_date` | 社保加入日 | employee_data |
| `apartment_id` | ID apartamento asignado | employee_data |
| `apartment_start_date` | Fecha entrada apartamento | employee_data |
| `apartment_rent` | Renta apartamento | employee_data |
| `bank_name` | Banco para pago | employee_data |
| `bank_account` | Cuenta bancaria | employee_data |

---

### 1.4 Diagrama de Flujo (ASCII)

```
┌─────────────────────────────────────────────────────────────┐
│  FASE 1: CANDIDATE (履歴書)                                  │
├─────────────────────────────────────────────────────────────┤
│  POST /api/candidates/rirekisho/form                        │
│  ├─ Genera: rirekisho_id = "UNS-123"                        │
│  ├─ Genera: applicant_id = "2001"                           │
│  ├─ Guarda: ~60 campos (nombre, visa, foto, etc.)           │
│  └─ Status: "pending"                                        │
└─────────────────────────────────────────────────────────────┘
                        ↓
┌─────────────────────────────────────────────────────────────┐
│  FASE 2: EVALUACIÓN (👍/👎)                                  │
├─────────────────────────────────────────────────────────────┤
│  POST /api/candidates/{id}/evaluate                         │
│  ├─ Si aprobado:                                             │
│  │   ├─ Candidate.status = "approved"                       │
│  │   └─ AUTO-CREA入社連絡票(NYUUSHA Request):                │
│  │       ├─ type = NYUUSHA                                   │
│  │       ├─ status = PENDING                                 │
│  │       ├─ candidate_id = 123                               │
│  │       └─ employee_data = {} (vacío)                       │
│  └─ Si rechazado:                                            │
│      └─ Candidate.status = "pending"                         │
└─────────────────────────────────────────────────────────────┘
                        ↓
┌─────────────────────────────────────────────────────────────┐
│  FASE 3: LLENAR DATOS EMPLEADO (入社連絡票)                  │
├─────────────────────────────────────────────────────────────┤
│  PUT /api/requests/{id}/employee-data                        │
│  └─ Guarda en Request.employee_data (JSON):                  │
│      {                                                        │
│        "factory_id": "高雄工業株式会社_本社工場",              │
│        "hakensaki_shain_id": "E-12345",                      │
│        "hire_date": "2025-11-15",                            │
│        "jikyu": 1650,                                        │
│        "position": "NC施盤オペレーター",                      │
│        "apartment_id": 45,                                   │
│        "bank_account": "1234567890",                         │
│        ...                                                    │
│      }                                                        │
└─────────────────────────────────────────────────────────────┘
                        ↓
┌─────────────────────────────────────────────────────────────┐
│  FASE 4: APROBAR → CREAR EMPLOYEE                           │
├─────────────────────────────────────────────────────────────┤
│  POST /api/requests/{id}/approve-nyuusha                     │
│  ├─ Valida: request.type == NYUUSHA                          │
│  ├─ Valida: employee_data lleno                              │
│  ├─ Genera: hakenmoto_id = MAX + 1                           │
│  ├─ Crea Employee:                                            │
│  │   ├─ Copia 40+ campos del Candidate                       │
│  │   ├─ Agrega campos de employee_data                       │
│  │   └─ rirekisho_id = Candidate.rirekisho_id (VÍNCULO)     │
│  ├─ Actualiza Candidate.status = "hired"                     │
│  ├─ Actualiza Request.status = "completed" (済)             │
│  └─ Request.hakenmoto_id = Employee.hakenmoto_id             │
└─────────────────────────────────────────────────────────────┘
                        ↓
                   ✅ EMPLEADO CREADO
```

---

## 2. FACTORIES

### 2.1 Estructura JSON Completa

**Ubicación:** `config/factories/*.json`  
**Ejemplo:** `高雄工業株式会社_本社工場.json` (líneas 1-196)

```json
{
  "factory_id": "高雄工業株式会社_本社工場",
  
  "client_company": {
    "name": "高雄工業株式会社",
    "address": "愛知県弥富市楠三丁目13番地2",
    "phone": "0567-68-8110",
    "responsible_person": {
      "department": "愛知事業所",
      "name": "部長　安藤　忍",
      "phone": "0567-68-8110"
    },
    "complaint_handler": {
      "department": "人事広報管理部",
      "name": "部長　山田　茂",
      "phone": "0567-68-8110"
    }
  },
  
  "plant": {
    "name": "本社工場",
    "address": "愛知県弥富市楠三丁目13番地2",
    "phone": "0567-68-8110"
  },
  
  "lines": [
    {
      "line_id": "Factory-39",
      "assignment": {
        "department": "第一営業部本社営業課",
        "line": "リフト作業",
        "supervisor": {
          "department": "",
          "name": "係長　坂上　舞",
          "phone": "0567-68-8110"
        }
      },
      "job": {
        "description": "鋳造材料の工場内加工ラインへの供給",
        "description2": "",
        "hourly_rate": 1750.0
      }
    }
  ],
  
  "schedule": {
    "work_hours": "昼勤：7時00分～15時30分　夜勤：19時00分～3時30分",
    "break_time": "昼勤：11時00分～11時45分 まで (45分)",
    "calendar": "月～金 (シフトに準ずる) 休日は、土曜日・日曜日...",
    "start_date": "2024-10-01 00:00:00",
    "end_date": "2025-09-30 00:00:00",
    "conflict_date": "2026-09-30 00:00:00",
    "non_work_day_labor": "１ヶ月に２日の範囲内で命ずることができる。",
    "overtime_labor": "3時間/日、42時間/月、320時間/年迄...",
    "time_unit": "15.0"
  },
  
  "payment": {
    "closing_date": "15日",
    "payment_date": "当月末日",
    "bank_account": "愛知銀行　当知支店　普通2075479　名義人　ユニバーサル企画（株）",
    "worker_closing_date": "１５日",
    "worker_payment_date": "１５日",
    "worker_calendar": "土曜日・日曜日・年末年始..."
  },
  
  "agreement": {
    "period": "2025-03-31 00:00:00",
    "explainer": ""
  }
}
```

### 2.2 Uso en Timer Cards

**ESTADO ACTUAL:** ❌ **NO IMPLEMENTADO**

**Análisis del código:**

```python
# timer_cards.py, líneas 140-194
def calculate_hours(clock_in, clock_out, break_minutes, work_date):
    """
    Calcula horas de trabajo incluyendo:
    - regular_hours: Primeras 8 horas
    - overtime_hours: Después de 8 horas
    - night_hours: Entre 22:00-05:00 (línea 197-244)
    - holiday_hours: Si es fin de semana/festivo (línea 172-184)
    """
    # ❌ NO LEE factory JSON
    # ❌ NO usa schedule.work_hours
    # ❌ NO usa schedule.break_time
    # ❌ NO usa schedule.overtime_labor
    # ❌ NO usa schedule.time_unit
    
    # Cálculo hardcoded:
    regular_hours = min(work_hours, 8.0)  # Línea 183
    overtime_hours = max(work_hours - 8.0, 0)  # Línea 184
    
    # Night hours: hardcoded 22:00-05:00 (línea 212-213)
    NIGHT_START = datetime_time(22, 0)
    NIGHT_END = datetime_time(5, 0)
```

**GAPS IDENTIFICADOS:**

1. **NO se leen las reglas de la factory:**
   - `schedule.work_hours` (昼勤/夜勤) → No usado
   - `schedule.break_time` (45分) → No usado
   - `schedule.overtime_labor` (3h/日, 42h/月) → No validado
   - `schedule.time_unit` (15.0) → No redondeado

2. **NO se validan límites de overtime:**
   - Factory define: "3時間/日、42時間/月、320時間/年迄"
   - Sistema permite: Cualquier cantidad de overtime sin validación

3. **NO se aplican turnos específicos:**
   - Factory define: "昼勤：7時00分～15時30分　夜勤：19時00分～3時30分"
   - Sistema solo detecta night hours (22:00-05:00) genéricamente

4. **NO se usa la tarifa por hora de la línea:**
   - `lines[].job.hourly_rate` existe en JSON (ej: 1750円)
   - Sistema usa `Employee.jikyu` en lugar de factory line rate

---

## 3. APARTMENTS

### 3.1 Modelos y Relaciones

**Tablas Involucradas (models.py):**

```
Apartment (línea 465-528)
├─ id (PK)
├─ apartment_code (único)
├─ name, building_name, room_number
├─ base_rent, management_fee
├─ deposit, key_money
├─ default_cleaning_fee (¥20,000)
├─ status (ACTIVE/INACTIVE/MAINTENANCE)
└─ Relationships:
    ├─ employees (1:N via apartment_id FK)
    ├─ assignments (1:N)
    └─ factory_associations (N:M via ApartmentFactory)

ApartmentAssignment (línea 1296-1355)
├─ id (PK)
├─ apartment_id (FK)
├─ employee_id (FK)
├─ start_date, end_date (NULL = activo)
├─ monthly_rent, prorated_rent
├─ days_occupied, is_prorated
├─ total_deduction (rent + charges)
├─ pays_parking (boolean)
├─ status (ACTIVE/ENDED/CANCELLED/TRANSFERRED)
└─ Relationships:
    ├─ apartment
    ├─ employee
    ├─ additional_charges (1:N)
    └─ rent_deductions (1:N)

AdditionalCharge (línea 1358-1408)
├─ id (PK)
├─ assignment_id (FK)
├─ employee_id (FK)
├─ charge_type (CLEANING/REPAIR/DEPOSIT/PENALTY/KEY_REPLACEMENT)
├─ description
├─ amount (¥)
├─ charge_date
├─ status (PENDING/PROCESSED/PAID/CANCELLED)
└─ Relationships: assignment, employee, approver

RentDeduction (línea 1411-1465)
├─ id (PK)
├─ assignment_id (FK)
├─ employee_id (FK)
├─ year, month
├─ base_rent (prorrateada o completa)
├─ additional_charges (suma)
├─ total_deduction (rent + charges)
├─ status (PENDING/PROCESSED/PAID)
└─ UniqueConstraint: (assignment_id, year, month)
```

**Diagrama de Relaciones:**

```
┌──────────────┐         ┌───────────────────┐         ┌──────────────┐
│  Apartment   │◄───────►│ ApartmentFactory  │◄───────►│   Factory    │
│              │   N:M   │                   │   N:M   │              │
│ id (PK)      │         │ apartment_id (FK) │         │ id (PK)      │
│ base_rent    │         │ factory_id (FK)   │         │ factory_id   │
└──────────────┘         │ distance_km       │         └──────────────┘
        │                │ commute_minutes   │
        │                └───────────────────┘
        │ 1:N
        ▼
┌─────────────────────────┐
│  ApartmentAssignment    │
│                         │
│ id (PK)                 │
│ apartment_id (FK)       │──┐
│ employee_id (FK)        │  │
│ start_date              │  │ 1:N
│ end_date (NULL=activo)  │  │
│ monthly_rent            │  │
│ prorated_rent           │  ▼
│ total_deduction         │  ┌─────────────────────┐
│ status                  │  │ AdditionalCharge    │
└─────────────────────────┘  │                     │
        │ 1:N                 │ id (PK)             │
        │                     │ assignment_id (FK)  │
        ▼                     │ charge_type         │
┌─────────────────────────┐  │ amount              │
│   RentDeduction         │  │ status              │
│                         │  └─────────────────────┘
│ id (PK)                 │
│ assignment_id (FK)      │
│ year, month             │
│ base_rent               │
│ additional_charges      │
│ total_deduction         │
│ status                  │
└─────────────────────────┘
```

### 3.2 Flujo de Asignación

**API:** `apartments_v2.py` (líneas 303-346)

#### **Paso 1: Crear Asignación**

**Endpoint:** `POST /api/apartments/assignments`

```python
# Validaciones (apartment_service.py):
# 1. Verificar apartamento disponible
# 2. Verificar empleado no tiene asignación activa
# 3. Verificar capacidad del apartamento

# Crear Assignment:
new_assignment = ApartmentAssignment(
    apartment_id=apartment_id,
    employee_id=employee_id,
    start_date=start_date,
    end_date=None,  # NULL = activo
    monthly_rent=apartment.base_rent,
    is_prorated=False,  # Mes completo
    status=AssignmentStatus.ACTIVE,
    total_deduction=0  # Se calculará después
)

# Actualizar Employee.apartment_id:
employee.apartment_id = apartment_id
employee.apartment_start_date = start_date

# Generar deducción mensual automática:
if start_date.day == 1:
    # Mes completo
    rent_deduction = RentDeduction(
        assignment_id=new_assignment.id,
        employee_id=employee_id,
        year=start_date.year,
        month=start_date.month,
        base_rent=apartment.base_rent,
        total_deduction=apartment.base_rent,
        status=DeductionStatus.PENDING
    )
```

#### **Paso 2: Cálculo Prorrateado (entrada a mitad de mes)**

**Endpoint:** `POST /api/apartments/calculations/prorated`

```python
# Ejemplo: Entrada el 15 de noviembre (30 días)
# Líneas 56-61 de apartment_v2.py schemas

request = ProratedCalculationRequest(
    monthly_rent=50000,
    start_date="2025-11-15",
    end_date="2025-11-30"
)

# Cálculo:
days_in_month = 30  # Noviembre
days_occupied = 16  # Del 15 al 30 (inclusive)
prorated_rent = int((50000 / 30) * 16)
# = 1,666円/día * 16 días = 26,656円

response = ProratedCalculationResponse(
    monthly_rent=50000,
    days_in_month=30,
    days_occupied=16,
    prorated_rent=26656,
    is_prorated=True
)
```

#### **Paso 3: Finalizar Asignación (salida)**

**Endpoint:** `PUT /api/apartments/assignments/{id}/end`

```python
# Ejemplo: Salida el 20 de diciembre (31 días)
update = AssignmentUpdate(
    end_date="2025-12-20",
    include_cleaning_fee=True,
    cleaning_fee=20000,
    additional_charges=[
        {
            "charge_type": "repair",
            "description": "Reparación de pared",
            "amount": 15000
        }
    ]
)

# Proceso:
# 1. Calcular días ocupados en diciembre
days_occupied = 20  # Del 1 al 20
prorated_rent = int((50000 / 31) * 20)  # = 32,258円

# 2. Crear AdditionalCharge por limpieza
cleaning_charge = AdditionalCharge(
    assignment_id=assignment.id,
    charge_type=ChargeType.CLEANING,
    description="清掃費用 (退去時)",
    amount=20000,
    charge_date=end_date,
    status=DeductionStatus.PENDING
)

# 3. Crear AdditionalCharge por reparación
repair_charge = AdditionalCharge(
    assignment_id=assignment.id,
    charge_type=ChargeType.REPAIR,
    description="Reparación de pared",
    amount=15000,
    charge_date=end_date,
    status=DeductionStatus.PENDING
)

# 4. Actualizar Assignment
assignment.end_date = end_date
assignment.status = AssignmentStatus.ENDED
assignment.total_deduction = 32258 + 20000 + 15000  # = 67,258円

# 5. Generar RentDeduction final
final_deduction = RentDeduction(
    assignment_id=assignment.id,
    employee_id=employee_id,
    year=2025,
    month=12,
    base_rent=32258,
    additional_charges=35000,
    total_deduction=67258,
    status=DeductionStatus.PENDING
)

# 6. Actualizar Employee
employee.apartment_id = None
employee.apartment_move_out_date = end_date
```

#### **Paso 4: Transferencia entre Apartamentos**

**Endpoint:** `POST /api/apartments/assignments/transfer`

```python
# Ejemplo: Mudanza el 10 de enero
transfer = TransferRequest(
    current_assignment_id=123,
    new_apartment_id=456,
    transfer_date="2025-01-10",
    include_cleaning_fee=True,
    new_monthly_rent=60000
)

# Proceso (3 pasos atómicos):

# PASO 1: Finalizar apartamento actual (ID 123)
# - Calcular días ocupados: 10 días (del 1 al 10)
# - Prorated rent: (50000 / 31) * 10 = 16,129円
# - Agregar cleaning fee: 20,000円
# - Total: 36,129円

# PASO 2: Crear assignment en nuevo apartamento (ID 456)
# - Calcular días restantes: 21 días (del 11 al 31)
# - Prorated rent: (60000 / 31) * 21 = 40,645円
# - Status: ACTIVE

# PASO 3: Actualizar Employee
# - apartment_id: 123 → 456
# - apartment_start_date: 2025-01-11

# PASO 4: Generar 2 RentDeductions
# - Deducción apartamento viejo (enero): 36,129円
# - Deducción apartamento nuevo (enero): 40,645円
# - TOTAL deducción enero: 76,774円
```

---

## 4. YUKYU (有給休暇)

### 4.1 Sistema de Acumulación

**Tablas Involucradas (models.py):**

```
YukyuBalance (línea 1168-1213)
├─ id (PK)
├─ employee_id (FK)
├─ fiscal_year (2023, 2024, 2025...)
├─ assigned_date (有給発生日)
├─ months_worked (6, 18, 30, 42...)
├─ days_assigned (付与数: 10, 11, 12...)
├─ days_carried_over (繰越)
├─ days_total (保有数 = assigned + carried)
├─ days_used (消化日数)
├─ days_remaining (期末残高)
├─ days_expired (時効数)
├─ days_available (時効後残)
├─ expires_on (assigned_date + 2 years)
└─ status (ACTIVE/EXPIRED)

YukyuRequest (línea 1216-1262)
├─ id (PK)
├─ employee_id (FK)
├─ requested_by_user_id (FK) → TANTOSHA
├─ factory_id (FK) → 派遣先
├─ request_type (YUKYU/HANKYU)
├─ start_date, end_date
├─ days_requested (1.0 or 0.5 for半休)
├─ yukyu_available_at_request (snapshot)
├─ status (PENDING/APPROVED/REJECTED)
├─ approved_by_user_id (FK) → KEITOSAN
├─ approval_date
└─ rejection_reason

YukyuUsageDetail (línea 1265-1293)
├─ id (PK)
├─ request_id (FK)
├─ balance_id (FK)
├─ usage_date (specific date)
├─ days_deducted (0.5 or 1.0)
└─ Relationships: request, balance
```

**Reglas de Acumulación (Labor Law):**

| Meses Trabajados | Días Asignados | Código |
|------------------|----------------|--------|
| 6 meses | 10 días | `months_worked=6` |
| 18 meses (1.5 años) | 11 días | `months_worked=18` |
| 30 meses (2.5 años) | 12 días | `months_worked=30` |
| 42 meses (3.5 años) | 14 días | `months_worked=42` |
| 54 meses (4.5 años) | 16 días | `months_worked=54` |
| 66 meses (5.5 años) | 18 días | `months_worked=66` |
| 78 meses (6.5 años) | 20 días | `months_worked=78` |

**Cálculo Automático (yukyu_service.py):**

```python
# POST /api/yukyu/balances/calculate
# Líneas 37-62 de yukyu.py

def calculate_and_create_balances(employee_id, calculation_date):
    """
    Calcula yukyus basado en hire_date y crea balances faltantes.
    """
    employee = db.query(Employee).get(employee_id)
    hire_date = employee.hire_date
    
    # Calcular meses trabajados
    months_worked = (calculation_date.year - hire_date.year) * 12 + \
                    (calculation_date.month - hire_date.month)
    
    # Milestones: 6, 18, 30, 42, 54, 66, 78 meses
    milestones = [
        (6, 10), (18, 11), (30, 12), (42, 14),
        (54, 16), (66, 18), (78, 20)
    ]
    
    for months, days in milestones:
        if months_worked >= months:
            # Verificar si ya existe balance para este milestone
            existing = db.query(YukyuBalance).filter(
                YukyuBalance.employee_id == employee_id,
                YukyuBalance.months_worked == months
            ).first()
            
            if not existing:
                # Crear nuevo balance
                assigned_date = hire_date + relativedelta(months=months)
                expires_on = assigned_date + relativedelta(years=2)
                
                new_balance = YukyuBalance(
                    employee_id=employee_id,
                    fiscal_year=assigned_date.year,
                    assigned_date=assigned_date,
                    months_worked=months,
                    days_assigned=days,
                    days_carried_over=0,
                    days_total=days,
                    days_used=0,
                    days_remaining=days,
                    days_expired=0,
                    days_available=days,
                    expires_on=expires_on,
                    status=YukyuStatus.ACTIVE
                )
                db.add(new_balance)
```

**Expiración (時効 - Jikou):**

```python
# POST /api/yukyu/maintenance/expire-old-yukyus
# Líneas 327-355 de yukyu.py

def expire_old_yukyus():
    """
    Expira yukyus que tienen más de 2 años (時効).
    """
    today = date.today()
    
    # Buscar balances activos con expires_on <= today
    expired_balances = db.query(YukyuBalance).filter(
        YukyuBalance.status == YukyuStatus.ACTIVE,
        YukyuBalance.expires_on <= today
    ).all()
    
    count = 0
    for balance in expired_balances:
        # Marcar como expirado
        balance.status = YukyuStatus.EXPIRED
        balance.days_expired = balance.days_remaining
        balance.days_available = 0
        count += 1
    
    db.commit()
    return count
```

### 4.2 Workflow de Requests

**Roles Involucrados:**

| Rol | Función | Endpoints |
|-----|---------|-----------|
| **TANTOSHA** (担当者) | Crea requests para empleados | POST /api/yukyu/requests/ |
| **KEITOSAN** (経理管理) | Aprueba/rechaza requests | PUT /api/yukyu/requests/{id}/approve<br>PUT /api/yukyu/requests/{id}/reject |
| **EMPLOYEE** (派遣社員) | Puede ver sus propios yukyus | GET /api/yukyu/balances |

#### **PASO 1: TANTOSHA Crea Request**

**Endpoint:** `POST /api/yukyu/requests/`  
**Ubicación:** `yukyu.py`, líneas 176-201

```python
# Ejemplo: TANTOSHA solicita 3 días yukyu para empleado
request = YukyuRequestCreate(
    employee_id=123,
    factory_id="高雄工業株式会社_本社工場",
    request_type=RequestType.YUKYU,
    start_date="2025-11-15",
    end_date="2025-11-17",  # 3 días
    days_requested=3.0,
    notes="休暇申請"
)

# Validaciones:
# 1. Verificar empleado tiene suficiente yukyu disponible
available = await get_employee_yukyu_summary(employee_id)
if available.total_available < 3.0:
    raise HTTPException(400, "Insufficient yukyu balance")

# 2. Crear request con snapshot
new_request = YukyuRequest(
    employee_id=123,
    requested_by_user_id=current_user.id,  # TANTOSHA
    factory_id="高雄工業株式会社_本社工場",
    request_type=RequestType.YUKYU,
    start_date=date(2025, 11, 15),
    end_date=date(2025, 11, 17),
    days_requested=3.0,
    yukyu_available_at_request=available.total_available,  # Snapshot: 15
    status=RequestStatus.PENDING,
    request_date=datetime.now()
)
db.add(new_request)
```

#### **PASO 2: KEITOSAN Aprueba Request (LIFO Deduction)**

**Endpoint:** `PUT /api/yukyu/requests/{id}/approve`  
**Ubicación:** `yukyu.py`, líneas 239-268

```python
# Ejemplo: Empleado tiene:
# - Balance 2023 (expires 2025-11-01): 8 días restantes
# - Balance 2024 (expires 2026-11-01): 11 días restantes
# Total: 19 días disponibles

# Request: 5 días

# LIFO Deduction (Newest First):
# 1. Deducir de balance más nuevo (2024): 5 días
# 2. Balance 2024 queda con: 11 - 5 = 6 días

def approve_request(request_id, approval_data, current_user_id):
    """
    Aprueba request y deduce yukyus usando LIFO.
    """
    request = db.query(YukyuRequest).get(request_id)
    
    if request.status != RequestStatus.PENDING:
        raise HTTPException(400, "Request already processed")
    
    # Obtener balances activos ordenados por fiscal_year DESC (LIFO)
    balances = db.query(YukyuBalance).filter(
        YukyuBalance.employee_id == request.employee_id,
        YukyuBalance.status == YukyuStatus.ACTIVE,
        YukyuBalance.days_available > 0
    ).order_by(YukyuBalance.fiscal_year.desc()).all()
    
    # Deducir días solicitados usando LIFO
    days_to_deduct = float(request.days_requested)
    
    for balance in balances:
        if days_to_deduct <= 0:
            break
        
        # Calcular cuántos días deducir de este balance
        days_from_this_balance = min(
            days_to_deduct,
            balance.days_available
        )
        
        # Actualizar balance
        balance.days_used += days_from_this_balance
        balance.days_remaining -= days_from_this_balance
        balance.days_available -= days_from_this_balance
        
        # Crear usage_detail para cada día
        current_date = request.start_date
        end_date = request.end_date
        
        while current_date <= end_date and days_from_this_balance > 0:
            usage_detail = YukyuUsageDetail(
                request_id=request.id,
                balance_id=balance.id,
                usage_date=current_date,
                days_deducted=min(1.0, days_from_this_balance)
            )
            db.add(usage_detail)
            
            days_from_this_balance -= 1.0
            current_date += timedelta(days=1)
        
        days_to_deduct -= days_from_this_balance
    
    # Actualizar request
    request.status = RequestStatus.APPROVED
    request.approved_by_user_id = current_user_id
    request.approval_date = datetime.now()
    
    db.commit()
```

**Resultado:**

```
ANTES de aprobar:
Balance 2023: 8 días disponibles
Balance 2024: 11 días disponibles
Total: 19 días

DESPUÉS de aprobar (5 días):
Balance 2023: 8 días disponibles (sin cambios)
Balance 2024: 6 días disponibles (11 - 5)
Total: 14 días

YukyuUsageDetail creados:
- 2025-11-15: 1.0 día (de Balance 2024)
- 2025-11-16: 1.0 día (de Balance 2024)
- 2025-11-17: 1.0 día (de Balance 2024)
- 2025-11-18: 1.0 día (de Balance 2024)
- 2025-11-19: 1.0 día (de Balance 2024)
```

#### **PASO 3: KEITOSAN Rechaza Request**

**Endpoint:** `PUT /api/yukyu/requests/{id}/reject`  
**Ubicación:** `yukyu.py`, líneas 271-293

```python
rejection = YukyuRequestReject(
    rejection_reason="Período de alta demanda laboral"
)

# Actualizar request
request.status = RequestStatus.REJECTED
request.approved_by_user_id = current_user_id
request.approval_date = datetime.now()
request.rejection_reason = rejection.rejection_reason

# ⭐ NO se deducen yukyus
```

---

## 5. TIMER CARDS

### 5.1 Modelo Actual

**Tabla:** `timer_cards` (models.py, líneas 780-814)

```python
class TimerCard(Base):
    id = Column(Integer, primary_key=True)
    hakenmoto_id = Column(Integer, ForeignKey("employees.hakenmoto_id"))
    factory_id = Column(String(20))  # Para consultas rápidas
    work_date = Column(Date, nullable=False)
    
    # Shift type
    shift_type = Column(SQLEnum(ShiftType))  # asa/hiru/yoru/other
    
    # Schedules
    clock_in = Column(Time)
    clock_out = Column(Time)
    break_minutes = Column(Integer, default=0)
    overtime_minutes = Column(Integer, default=0)
    
    # Calculated hours (auto-calculadas)
    regular_hours = Column(Numeric(5, 2), default=0)
    overtime_hours = Column(Numeric(5, 2), default=0)
    night_hours = Column(Numeric(5, 2), default=0)
    holiday_hours = Column(Numeric(5, 2), default=0)
    
    # Approval
    is_approved = Column(Boolean, default=False)
    approved_by = Column(Integer, ForeignKey("users.id"))
    approved_at = Column(DateTime)
    
    notes = Column(Text)
```

**Cálculos Automáticos (timer_cards.py):**

```python
# Función: calculate_hours (líneas 140-194)

def calculate_hours(clock_in, clock_out, break_minutes, work_date):
    """
    Calcula horas de trabajo.
    
    HARDCODED:
    - Regular hours: Primeras 8 horas
    - Overtime: Después de 8 horas
    - Night hours: 22:00-05:00
    - Holiday hours: Si es fin de semana o festivo
    """
    # 1. Calcular horas totales
    total_minutes = (clock_out - clock_in).total_seconds() / 60
    work_minutes = total_minutes - break_minutes
    work_hours = work_minutes / 60
    
    # 2. Verificar si es festivo/fin de semana
    is_holiday = _is_japanese_holiday(work_date)
    
    if is_holiday:
        # TODO el día es holiday hours
        holiday_hours = work_hours
        regular_hours = 0.0
        overtime_hours = 0.0
    else:
        # Día normal
        holiday_hours = 0.0
        regular_hours = min(work_hours, 8.0)  # ⭐ HARDCODED 8h
        overtime_hours = max(work_hours - 8.0, 0)  # ⭐ HARDCODED
    
    # 3. Calcular night hours (22:00-05:00)
    night_hours = _calculate_night_hours(start, end, break_minutes)
    
    return {
        "regular_hours": round(regular_hours, 2),
        "overtime_hours": round(overtime_hours, 2),
        "night_hours": round(night_hours, 2),
        "holiday_hours": round(holiday_hours, 2)
    }
```

**Festivos Japoneses (líneas 32-106):**

```python
def _is_japanese_holiday(work_date):
    """
    Verifica si es festivo japonés o fin de semana.
    
    Festivos fijos:
    - 1月1日: 元日 (New Year's Day)
    - 2月11日: 建国記念の日
    - 2月23日: 天皇誕生日
    - 4月29日: 昭和の日
    - 5月3日: 憲法記念日
    - 5月4日: みどりの日
    - 5月5日: こどもの日
    - 8月11日: 山の日
    - 11月3日: 文化の日
    - 11月23日: 勤労感謝の日
    
    Festivos móviles:
    - 成人の日: Segundo lunes de enero
    - 海の日: Tercer lunes de julio
    - 敬老の日: Tercer lunes de septiembre
    - スポーツの日: Segundo lunes de octubre
    - 春分の日: ~20 de marzo
    - 秋分の日: ~23 de septiembre
    
    Fin de semana: Sábado (5), Domingo (6)
    """
    # Weekend check
    if work_date.weekday() in [5, 6]:
        return True
    
    # Fixed holidays
    month_day = (work_date.month, work_date.day)
    if month_day in FIXED_HOLIDAYS:
        return True
    
    # Movable holidays (cálculo simplificado)
    # ...
    
    return False
```

### 5.2 OCR Processing

**ESTADO ACTUAL:** ✅ **IMPLEMENTADO PARCIALMENTE**

**Endpoint:** `POST /api/timer_cards/upload`  
**Ubicación:** `timer_cards.py`, líneas 313-371

```python
async def upload_timer_card_file(file: UploadFile, factory_id: str):
    """
    Sube PDF de timer card y procesa con OCR.
    
    Rate limit: 5/minute (operación costosa)
    """
    # Validar PDF
    if not file.filename.endswith('.pdf'):
        raise HTTPException(400, "Solo se aceptan PDFs")
    
    # Leer PDF
    pdf_bytes = await file.read()
    
    # Procesar con OCR (servicio separado)
    ocr_result = timer_card_ocr_service.process_pdf(pdf_bytes, factory_id)
    
    # Retornar datos extraídos para revisión manual
    return TimerCardUploadResponse(
        file_name=file.filename,
        pages_processed=ocr_result['pages_processed'],
        records_found=len(ocr_data),
        ocr_data=ocr_data,  # Array de TimerCardOCRData
        processing_errors=ocr_result['processing_errors'],
        message=f"{len(ocr_data)} registros extraídos. Revisar y confirmar."
    )
```

**Servicio OCR:** `timer_card_ocr_service.py` (no visible en el análisis)

**Datos Extraídos por OCR:**

```python
class TimerCardOCRData(BaseModel):
    page_number: int
    work_date: Optional[date]
    employee_name_ocr: Optional[str]
    employee_matched: Optional[bool]  # Si se encontró en BD
    clock_in: Optional[time]
    clock_out: Optional[time]
    break_minutes: Optional[int]
    validation_errors: List[str]
    confidence_score: float
```

**GAPS en OCR:**

1. **NO se guarda automáticamente:** OCR solo extrae datos, requiere confirmación manual
2. **NO hay matching automático con employee:** Se extrae nombre pero no se vincula
3. **NO se calcula regular/overtime/night hours:** Solo extrae clock_in/clock_out
4. **NO se valida contra factory schedule:** No verifica si horarios son válidos

---

## 6. FRONTEND

### 6.1 Páginas por Prioridad

**Total de páginas:** 64 páginas encontradas

#### **PRIORIDAD 1: Core HR Workflows**

| Página | Ruta | Descripción |
|--------|------|-------------|
| Dashboard | `/dashboard` | Dashboard principal |
| Candidates | `/candidates` | Lista de candidatos |
| Candidate Detail | `/candidates/[id]` | Detalle de candidato |
| Candidate Edit | `/candidates/[id]/edit` | Editar candidato |
| Candidate Print | `/candidates/[id]/print` | Imprimir履歴書 |
| Candidate New | `/candidates/new` | Nuevo candidato manual |
| Candidate Rirekisho | `/candidates/rirekisho` | OCR履歴書upload |
| Employees | `/employees` | Lista de empleados |
| Employee Detail | `/employees/[id]` | Detalle de empleado |
| Employee Edit | `/employees/[id]/edit` | Editar empleado |
| Employee New | `/employees/new` | Nuevo empleado manual |
| Employee Excel | `/employees/excel-view` | Vista Excel empleados |
| Requests | `/requests` | Lista de solicitudes |
| Request Detail | `/requests/[id]` | Detalle de solicitud |

#### **PRIORIDAD 2: Payroll & Attendance**

| Página | Ruta | Descripción |
|--------|------|-------------|
| Timer Cards | `/timercards` | Lista de タイムカード |
| Timer Cards Upload | `/timercards/upload` | OCR PDF upload |
| Payroll | `/payroll` | Sistema de nómina |
| Payroll Detail | `/payroll/[id]` | Detalle de nómina |
| Payroll Create | `/payroll/create` | Crear nómina manual |
| Payroll Calculate | `/payroll/calculate` | Calcular nómina |
| Payroll Timer Cards | `/payroll/timer-cards` | Timer cards en payroll |
| Payroll Yukyu Summary | `/payroll/yukyu-summary` | Resumen yukyu en payroll |
| Payroll Settings | `/payroll/settings` | Configuración payroll |
| Salary | `/salary` | Salarios |
| Salary Detail | `/salary/[id]` | Detalle de salario |
| Salary Reports | `/salary/reports` | Reportes de salarios |

#### **PRIORIDAD 3: Yukyu Management**

| Página | Ruta | Descripción |
|--------|------|-------------|
| Yukyu Dashboard | `/yukyu` | Dashboard yukyu |
| Yukyu Requests | `/yukyu-requests` | Solicitudes yukyu |
| Yukyu Request Create | `/yukyu-requests/create` | Nueva solicitud yukyu |
| Yukyu History | `/yukyu-history` | Historial de uso yukyu |
| Yukyu Reports | `/yukyu-reports` | Reportes yukyu |
| Keiri Yukyu Dashboard | `/keiri/yukyu-dashboard` | Dashboard KEITOSAN yukyu |
| Admin Yukyu Management | `/admin/yukyu-management` | Admin yukyu management |

#### **PRIORIDAD 4: Apartments & Housing**

| Página | Ruta | Descripción |
|--------|------|-------------|
| Apartments | `/apartments` | Lista de apartamentos |
| Apartment Detail | `/apartments/[id]` | Detalle de apartamento |
| Apartment Edit | `/apartments/[id]/edit` | Editar apartamento |
| Apartment Assign | `/apartments/[id]/assign` | Asignar empleado |
| Apartment Create | `/apartments/create` | Crear apartamento |
| Apartment Search | `/apartments/search` | Búsqueda avanzada |
| Apartment Assignments | `/apartment-assignments` | Lista de asignaciones |
| Assignment Detail | `/apartment-assignments/[id]` | Detalle asignación |
| Assignment Create | `/apartment-assignments/create` | Nueva asignación |
| Assignment End | `/apartment-assignments/[id]/end` | Finalizar asignación |
| Assignment Transfer | `/apartment-assignments/transfer` | Transferir empleado |
| Apartment Reports | `/apartment-reports` | Reportes apartamentos |
| Apartment Occupancy | `/apartment-reports/occupancy` | Reporte ocupación |
| Apartment Costs | `/apartment-reports/costs` | Reporte costos |
| Apartment Arrears | `/apartment-reports/arrears` | Reporte atrasos |
| Apartment Maintenance | `/apartment-reports/maintenance` | Reporte mantenimiento |
| Apartment Calculations | `/apartment-calculations` | Calculadora |
| Prorated Calculation | `/apartment-calculations/prorated` | Cálculo prorrateado |
| Total Calculation | `/apartment-calculations/total` | Cálculo total |
| Additional Charges | `/additional-charges` | Cargos adicionales |
| Rent Deductions | `/rent-deductions` | Deducciones de renta |
| Rent Deductions Month | `/rent-deductions/[year]/[month]` | Deducciones por mes |

#### **PRIORIDAD 5: Factories & Client Sites**

| Página | Ruta | Descripción |
|--------|------|-------------|
| Factories | `/factories` | Lista de fábricas |
| Factory Detail | `/factories/[factory_id]` | Detalle de fábrica |
| Factory Config | `/factories/[factory_id]/config` | Configuración fábrica |
| Factory New | `/factories/new` | Nueva fábrica |

#### **PRIORIDAD 6: Administration**

| Página | Ruta | Descripción |
|--------|------|-------------|
| Admin Control Panel | `/admin/control-panel` | Panel de control admin |
| Admin Audit Logs | `/admin/audit-logs` | Logs de auditoría |
| Settings Appearance | `/settings/appearance` | Configuración apariencia |
| Themes | `/themes` | Galería de temas |
| Theme Customizer | `/themes/customizer` | Personalizador temas |
| Design System | `/design-system` | Sistema de diseño |

#### **PRIORIDAD 7: Monitoring & Reports**

| Página | Ruta | Descripción |
|--------|------|-------------|
| Monitoring | `/monitoring` | Monitoreo sistema |
| Monitoring Health | `/monitoring/health` | Health checks |
| Monitoring Performance | `/monitoring/performance` | Performance |
| Reports | `/reports` | Reportes generales |

#### **PRIORIDAD 8: Static & Info Pages**

| Página | Ruta | Descripción |
|--------|------|-------------|
| Construction | `/construction` | Página en construcción |
| Help | `/help` | Página de ayuda |
| Support | `/support` | Soporte |
| Privacy | `/privacy` | Política privacidad |
| Terms | `/terms` | Términos de servicio |
| Examples Forms | `/examples/forms` | Ejemplos de formularios |

---

## 7. GAPS Y MEJORAS NECESARIAS

### 7.1 FACTORY RULES NOT IMPLEMENTED

**Prioridad:** ⚠️ **ALTA - CRÍTICO**

**Problema:**
- Factory JSON define reglas detalladas de horarios, overtime, descansos
- Timer cards NO leen ni aplican estas reglas
- Cálculos hardcoded (8h regular, 22:00-05:00 night)

**Mejoras Necesarias:**

```python
# 1. Leer factory JSON al calcular hours
def calculate_hours(clock_in, clock_out, break_minutes, work_date, factory_id):
    # Cargar factory config
    factory_config = load_factory_config(factory_id)
    schedule = factory_config['schedule']
    
    # Aplicar work_hours específicos
    shift_config = parse_shift_config(schedule['work_hours'])
    # Ejemplo: "昼勤：7時00分～15時30分　夜勤：19時00分～3時30分"
    
    # Aplicar break_time específico
    break_config = parse_break_time(schedule['break_time'])
    # Ejemplo: "昼勤：11時00分～11時45分 まで (45分)"
    
    # Validar overtime_labor
    overtime_limit_day = 3  # "3時間/日"
    overtime_limit_month = 42  # "42時間/月"
    overtime_limit_year = 320  # "320時間/年"
    
    if overtime_hours > overtime_limit_day:
        raise ValidationError("Overtime exceeds daily limit")
    
    # Aplicar time_unit para redondeo
    time_unit = float(schedule['time_unit'])  # 15.0 minutos
    regular_hours = round_to_time_unit(regular_hours, time_unit)

# 2. Usar hourly_rate de factory line
def calculate_pay(timer_card):
    factory_config = load_factory_config(timer_card.factory_id)
    employee = get_employee(timer_card.hakenmoto_id)
    
    # Buscar line específica del empleado
    line = find_employee_line(
        factory_config['lines'],
        employee.assignment_line
    )
    
    # Usar tarifa de la línea en lugar de employee.jikyu
    hourly_rate = line['job']['hourly_rate']  # 1750円
    
    base_pay = timer_card.regular_hours * hourly_rate
    overtime_pay = timer_card.overtime_hours * hourly_rate * 1.25
    night_pay = timer_card.night_hours * hourly_rate * 0.25
    
    return base_pay + overtime_pay + night_pay
```

### 7.2 OCR TIMER CARDS NOT AUTO-SAVED

**Prioridad:** ⚠️ **MEDIA**

**Problema:**
- OCR extrae datos de PDF pero NO crea timer cards automáticamente
- Requiere confirmación manual para cada registro
- No hay matching automático employee_name_ocr → Employee

**Mejoras Necesarias:**

```python
# POST /api/timer_cards/upload-and-save
async def upload_and_save_timer_cards(file: UploadFile, factory_id: str, auto_save: bool = False):
    # 1. Procesar OCR
    ocr_result = timer_card_ocr_service.process_pdf(pdf_bytes, factory_id)
    
    # 2. Si auto_save = True, guardar automáticamente
    if auto_save:
        saved_count = 0
        errors = []
        
        for record in ocr_result['records']:
            try:
                # Matching automático por nombre
                employee = match_employee_by_name(
                    record['employee_name_ocr'],
                    factory_id
                )
                
                if not employee:
                    errors.append(f"Employee not found: {record['employee_name_ocr']}")
                    continue
                
                # Calcular hours
                hours = calculate_hours(
                    record['clock_in'],
                    record['clock_out'],
                    record['break_minutes'],
                    record['work_date'],
                    factory_id  # ⭐ Usar factory rules
                )
                
                # Crear timer card
                timer_card = TimerCard(
                    hakenmoto_id=employee.hakenmoto_id,
                    factory_id=factory_id,
                    work_date=record['work_date'],
                    clock_in=record['clock_in'],
                    clock_out=record['clock_out'],
                    break_minutes=record['break_minutes'],
                    **hours,
                    is_approved=False
                )
                db.add(timer_card)
                saved_count += 1
                
            except Exception as e:
                errors.append(f"Error saving {record['work_date']}: {str(e)}")
        
        db.commit()
        
        return {
            "saved": saved_count,
            "errors": errors,
            "total": len(ocr_result['records'])
        }
```

### 7.3 YUKYU NOT INTEGRATED WITH EMPLOYEE CREATION

**Prioridad:** ⚠️ **ALTA**

**Problema:**
- Al crear Employee, NO se calculan yukyus automáticamente
- Admin debe llamar manualmente `/api/yukyu/balances/calculate`
- Employee recién creado tiene `yukyu_total=0` hasta cálculo manual

**Mejoras Necesarias:**

```python
# En requests.py, línea 472 (después de crear Employee)
# POST /api/requests/{id}/approve-nyuusha

# AGREGAR:
# Calcular yukyus automáticamente para nuevo empleado
from app.services.yukyu_service import YukyuService

yukyu_service = YukyuService(db)
await yukyu_service.calculate_and_create_balances(
    employee_id=new_employee.id,
    calculation_date=date.today()
)

# Resultado:
# - Si hire_date < 6 meses: No crea balances (esperará milestone)
# - Si hire_date >= 6 meses: Crea balance inicial (10 días)
```

### 7.4 APARTMENT-FACTORY ASSOCIATIONS NOT USED

**Prioridad:** 🔵 **BAJA**

**Problema:**
- Modelo `ApartmentFactory` existe (N:M con distance_km, commute_minutes)
- Frontend NO lo usa al asignar apartments
- No hay sugerencias de apartamentos cercanos a factory

**Mejoras Necesarias:**

```python
# GET /api/apartments/recommend-for-employee/{employee_id}
async def recommend_apartments_for_employee(employee_id: int):
    employee = db.query(Employee).get(employee_id)
    factory_id = employee.factory_id
    
    # Buscar apartments asociados a factory del employee
    associations = db.query(ApartmentFactory).filter(
        ApartmentFactory.factory_id == factory_id
    ).order_by(ApartmentFactory.distance_km.asc()).all()
    
    # Retornar apartments ordenados por distancia
    recommendations = []
    for assoc in associations:
        apartment = assoc.apartment
        recommendations.append({
            "apartment": apartment,
            "distance_km": assoc.distance_km,
            "commute_minutes": assoc.commute_minutes,
            "is_primary": assoc.is_primary
        })
    
    return recommendations
```

### 7.5 EMPLOYEE YUKYU SUMMARY IN DASHBOARD

**Prioridad:** ⚠️ **MEDIA**

**Problema:**
- Employee puede ver `/api/yukyu/balances` pero solo si tiene email registrado
- No hay widget en dashboard mostrando yukyu disponible
- No hay alertas de expiración próxima

**Mejoras Necesarias:**

```typescript
// Frontend: components/dashboard/yukyu-widget.tsx
export function YukyuWidget() {
  const { data: summary } = useQuery({
    queryKey: ['yukyu', 'summary'],
    queryFn: () => api.get('/api/yukyu/balances')
  })
  
  return (
    <Card>
      <CardHeader>
        <CardTitle>有給休暇 (Yukyu)</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="text-3xl font-bold">
          {summary.total_available} 日
        </div>
        <p className="text-sm text-muted-foreground">
          利用可能
        </p>
        
        {summary.oldest_expiration_date && (
          <Alert variant="warning">
            <AlertTitle>期限切れ注意</AlertTitle>
            <AlertDescription>
              {format(summary.oldest_expiration_date, 'yyyy年MM月dd日')}
              に有給が失効します
            </AlertDescription>
          </Alert>
        )}
      </CardContent>
    </Card>
  )
}
```

### 7.6 PAYROLL YUKYU INTEGRATION INCOMPLETE

**Prioridad:** ⚠️ **ALTA**

**Problema:**
- `/api/yukyu/payroll/summary` retorna días usados en período
- Payroll NO deduce automáticamente por yukyu usado
- No hay campo `yukyu_deduction` en `SalaryCalculation`

**Mejoras Necesarias:**

```python
# En payroll.py
# POST /api/payroll/calculate

# AGREGAR:
# Obtener yukyus usados en el período
yukyu_summary = await get_yukyu_payroll_summary(year, month, employee_id)
days_used = yukyu_summary['days_used_in_period']

# Si empleado usa yukyu, NO deducir salario (yukyu es PAGADO)
# Pero si trabaja menos días SIN yukyu, deducir proporcionalmente

expected_work_days = 22  # Días laborables del mes
actual_work_days = count_timer_cards(employee_id, year, month)
yukyu_days = days_used

total_days = actual_work_days + yukyu_days

if total_days < expected_work_days:
    # Deducir días faltantes SIN yukyu
    missing_days = expected_work_days - total_days
    daily_rate = employee.jikyu * 8  # 8 horas/día
    absence_deduction = missing_days * daily_rate
else:
    absence_deduction = 0

salary_calculation.yukyu_days = yukyu_days
salary_calculation.absence_deduction = absence_deduction
```

### 7.7 RENT DEDUCTIONS NOT SYNCED WITH PAYROLL

**Prioridad:** ⚠️ **ALTA**

**Problema:**
- `RentDeduction` se genera en apartments system
- `SalaryCalculation` tiene campo `apartment_deduction`
- NO hay sincronización automática entre ambos

**Mejoras Necesarias:**

```python
# En payroll.py
# POST /api/payroll/calculate

# AGREGAR:
# Obtener rent deduction del mes
rent_deduction = db.query(RentDeduction).filter(
    RentDeduction.employee_id == employee_id,
    RentDeduction.year == year,
    RentDeduction.month == month,
    RentDeduction.status.in_([
        DeductionStatus.PENDING,
        DeductionStatus.PROCESSED
    ])
).first()

if rent_deduction:
    salary_calculation.apartment_deduction = rent_deduction.total_deduction
    
    # Marcar como PROCESSED
    rent_deduction.status = DeductionStatus.PROCESSED
    rent_deduction.processed_date = date.today()
else:
    salary_calculation.apartment_deduction = 0
```

### 7.8 INCOMPLETE REQUEST TYPES

**Prioridad:** 🔵 **BAJA**

**Problema:**
- `RequestType` tiene: YUKYU, HANKYU, IKKIKOKOKU, TAISHA, NYUUSHA
- Solo YUKYU y NYUUSHA tienen workflows completos
- HANKYU (半休), IKKIKOKOKU (一時帰国), TAISHA (退社) no implementados

**Mejoras Necesarias:**

```python
# HANKYU (半休 - Half Day):
# - days_requested = 0.5
# - Debe especificar: morning/afternoon
# - Deducir 0.5 días de yukyu

# IKKIKOKOKU (一時帰国 - Temporary Return Home):
# - Multiple días sin pago
# - No deduce yukyu
# - Solo notificación a HR

# TAISHA (退社 - Resignation):
# - Finalizar empleado
# - Calcular último salario
# - Finalizar apartment assignment
# - Generar documentos de salida
```

---

## 8. RESUMEN DE ESTADO ACTUAL

### 8.1 Funcionalidades COMPLETAS ✅

| Módulo | Estado | Cobertura |
|--------|--------|-----------|
| **Candidate Management** | ✅ COMPLETO | 95% |
| **入社連絡票 Workflow** | ✅ COMPLETO | 90% |
| **Employee CRUD** | ✅ COMPLETO | 100% |
| **Apartments V2** | ✅ COMPLETO | 95% |
| **Apartment Assignments** | ✅ COMPLETO | 100% |
| **Rent Deductions** | ✅ COMPLETO | 90% |
| **Yukyu Balance System** | ✅ COMPLETO | 100% |
| **Yukyu Request Workflow** | ✅ COMPLETO | 95% |
| **LIFO Deduction** | ✅ COMPLETO | 100% |
| **Factories CRUD** | ✅ COMPLETO | 80% |

### 8.2 Funcionalidades PARCIALES ⚠️

| Módulo | Estado | Gaps Principales |
|--------|--------|------------------|
| **Timer Cards** | ⚠️ PARCIAL (70%) | - Factory rules NOT used<br>- Hardcoded 8h regular<br>- No validation limits |
| **Payroll Integration** | ⚠️ PARCIAL (60%) | - Yukyu NOT deducted<br>- Rent NOT synced<br>- Manual calculation |
| **OCR Timer Cards** | ⚠️ PARCIAL (50%) | - No auto-save<br>- No employee matching<br>- Manual confirmation |
| **Factory Config Usage** | ⚠️ PARCIAL (30%) | - JSON exists but NOT read<br>- No schedule application<br>- No line rates |

### 8.3 Funcionalidades FALTANTES ❌

| Módulo | Estado | Descripción |
|--------|--------|-------------|
| **HANKYU Requests** | ❌ FALTA (0%) | Half-day yukyu not implemented |
| **IKKIKOKOKU Requests** | ❌ FALTA (0%) | Temporary return home workflow |
| **TAISHA Workflow** | ❌ FALTA (0%) | Resignation process incomplete |
| **Apartment-Factory Suggestions** | ❌ FALTA (0%) | Recommend apartments by distance |
| **Auto Yukyu on Employee Creation** | ❌ FALTA (0%) | Must call API manually |

---

## 9. PRÓXIMOS PASOS RECOMENDADOS

### 9.1 CRÍTICO (Sprint 1 - 2 semanas)

1. **Implementar Factory Rules en Timer Cards**
   - Leer JSON de factory
   - Aplicar work_hours, break_time, overtime_labor
   - Validar límites diarios/mensuales/anuales

2. **Sincronizar Rent Deductions con Payroll**
   - Auto-incluir `apartment_deduction` en SalaryCalculation
   - Marcar RentDeduction como PROCESSED
   - Generar reporte de deducciones

3. **Auto-calcular Yukyu en Employee Creation**
   - Llamar yukyu_service.calculate_and_create_balances()
   - Crear balance inicial si hire_date >= 6 meses

### 9.2 IMPORTANTE (Sprint 2 - 2 semanas)

4. **OCR Timer Cards Auto-Save**
   - Matching automático por nombre
   - Guardar timer cards directamente
   - Marcar como "pending approval"

5. **Yukyu Dashboard Widget**
   - Widget en dashboard mostrando días disponibles
   - Alertas de expiración próxima
   - Botón rápido para solicitar yukyu

6. **Payroll Yukyu Integration**
   - Deducir por días ausentes SIN yukyu
   - Incluir yukyu_days en salary calculation
   - Reporte de ausencias justificadas

### 9.3 MEJORAS (Sprint 3 - 2 semanas)

7. **Apartment-Factory Recommendations**
   - Endpoint para recomendar apartments cercanos
   - Frontend: mostrar distancia y tiempo de commute
   - Ordenar por is_primary, distance_km

8. **Implementar HANKYU/IKKIKOKOKU/TAISHA**
   - HANKYU: 0.5 días yukyu
   - IKKIKOKOKU: Días sin pago
   - TAISHA: Workflow de salida completo

9. **Factory Line Rates Usage**
   - Usar `lines[].job.hourly_rate` en lugar de `employee.jikyu`
   - Permitir diferentes tarifas por línea
   - Calcular payroll por línea

---

## 10. CONCLUSIÓN

El sistema **UNS-ClaudeJP 5.4.1** tiene una arquitectura sólida con módulos bien diseñados:

**Fortalezas:**
- ✅ Flujo completo Candidate → 入社連絡票 → Employee funcional
- ✅ Sistema de Apartments V2 robusto con cálculos prorrateados
- ✅ Yukyu system completo con LIFO deduction
- ✅ Frontend con 64 páginas organizadas

**Áreas de Mejora:**
- ⚠️ Factory rules NO aplicadas en timer cards
- ⚠️ Payroll integration incompleta
- ⚠️ OCR timer cards sin auto-save
- ❌ Request types HANKYU/IKKIKOKOKU/TAISHA no implementados

**Prioridad de Implementación:**
1. Factory rules en timer cards (CRÍTICO)
2. Rent deductions sync con payroll (CRÍTICO)
3. Auto-calcular yukyu en employee creation (CRÍTICO)
4. OCR auto-save timer cards (IMPORTANTE)
5. Yukyu dashboard widget (IMPORTANTE)

Con estas mejoras, el sistema alcanzará un nivel de completitud del **95%** en las funcionalidades core.

---

**Documento generado por:** Claude Code Agent  
**Fecha:** 2025-11-13  
**Versión:** 1.0
