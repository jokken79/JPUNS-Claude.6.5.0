# 🚀 COMPLETE APPLICATION WORKFLOW GUIDE - PART 1-1
## Candidate Registration to Employee Hiring (履歴書 → 入社連絡票 → 派遣社員)

**System:** UNS-ClaudeJP 6.0.0
**Date:** 2025-11-17
**Version:** 1.0 - Complete End-to-End Workflow Documentation
**Scope:** Complete hiring process from candidate application through final employee creation

---

## 📋 TABLE OF CONTENTS

1. [System Overview](#1-system-overview)
2. [Phase 1: Candidate Registration (履歴書)](#2-phase-1-candidate-registration)
3. [Phase 2: Candidate Evaluation & Approval](#3-phase-2-candidate-evaluation--approval)
4. [Phase 3: New Hire Notification (入社連絡票)](#4-phase-3-new-hire-notification)
5. [Phase 4: Employee Creation & Finalization](#5-phase-4-employee-creation--finalization)
6. [Database Schema & Models](#6-database-schema--models)
7. [API Endpoints Reference](#7-api-endpoints-reference)
8. [Frontend Flow & User Interface](#8-frontend-flow--user-interface)
9. [OCR Integration in Candidate Process](#9-ocr-integration-in-candidate-process)
10. [Data Validation & Error Handling](#10-data-validation--error-handling)

---

## 1. SYSTEM OVERVIEW

### Architecture Stack

| Component | Technology | Version | Purpose |
|-----------|-----------|---------|---------|
| **Frontend** | Next.js | 16.0.0 | React with App Router (45+ pages) |
| **Backend** | FastAPI | 0.115.6 | REST API with 24+ routers |
| **Database** | PostgreSQL | 15 | Relational DB (13 tables) |
| **ORM** | SQLAlchemy | 2.0.36 | Database abstraction |
| **Language** | Python | 3.11+ | Backend runtime |
| **Cache** | Redis | 7 | Session & cache layer |

### Key Entities

```
┌─────────────────────────────────────────────────────────────┐
│                    HIRING PROCESS ENTITIES                  │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  User (ユーザー)                                             │
│  ├─ Roles: SUPER_ADMIN > ADMIN > COORDINATOR > KANRININSHA  │
│  │         > EMPLOYEE > CONTRACT_WORKER                      │
│  └─ Auth: JWT token-based with 24-hour expiration           │
│                                                              │
│  Candidate (候補者 / 履歴書)                                 │
│  ├─ Status: pending → approved → hired                      │
│  ├─ 60+ fields including name, DOB, contact, visa          │
│  ├─ Photo storage: base64 compressed image                 │
│  └─ rirekisho_id: Primary identifier (UNS-001, UNS-002...)  │
│                                                              │
│  Request (申請 / 入社連絡票)                                │
│  ├─ Type: NYUUSHA (new hire), YUKYU (vacation), etc.       │
│  ├─ Status: pending → approved → completed                 │
│  ├─ Links candidate → future employee                      │
│  └─ Stores temporary employee data (JSON)                  │
│                                                              │
│  Employee (派遣社員)                                        │
│  ├─ Status: active, inactive, on_leave                     │
│  ├─ Links: candidate (via rirekisho_id), factory, apartment│
│  ├─ Data: salary, hire date, position, contract type       │
│  └─ hakenmoto_id: Secondary identifier                     │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

---

## 2. PHASE 1: CANDIDATE REGISTRATION

### 2.1 User Submits Candidate Information (履歴書登録)

**Location:** Frontend: `app/(dashboard)/candidates/new/page.tsx`
**Access:** Available to authenticated users with COORDINATOR+ role

#### Form Fields (60+ Total)

**Basic Information:**
- `full_name_kanji` - Full name in kanji (e.g., "田中太郎")
- `full_name_kana` - Full name in kana (e.g., "タナカタロウ")
- `full_name_roman` - Full name in roman letters (e.g., "Tanaka Taro") ← **Critical for matching**
- `date_of_birth` - Date of birth (YYYY-MM-DD)
- `gender` - Gender (M/F)
- `nationality` - Country of origin
- `phone` - Contact phone number
- `email` - Contact email address

**Residence Information:**
- `address` - Current address
- `address_kanji` - Address in kanji (if different)
- `city`, `prefecture`, `postal_code`

**Immigration Documents:**
- `passport_number` - Passport ID
- `passport_expiry_date` - When passport expires
- `residence_card_number` - Zairyu card number
- `residence_card_expiry` - When residence card expires
- `visa_type` - Type of visa (work, student, spouse, etc.)
- `visa_expiry_date` - When visa expires

**Employment Information:**
- `previous_positions` - JSON array of past work experience
- `education_level` - Highest education completed
- `language_proficiency` - Languages known (JSON)
- `certifications` - Professional certifications

**Photo & Documents:**
- `photo_data_url` - Base64 encoded, compressed photo (max 500KB)

#### Frontend Workflow

```
User navigates to /candidates/new
    ↓
Form component loads with 60 empty fields
    ↓
User fills basic information (name, DOB, contact)
    ↓
User uploads photo:
    - File input accepts JPG, PNG
    - Frontend compresses image (max 500KB)
    - Converts to base64 data URL
    ↓
User fills address and visa information
    ↓
User fills employment history (optional, repeatable)
    ↓
Form validates:
    - Required fields present
    - Email format valid
    - Phone format valid
    - Date formats correct
    ↓
User clicks "保存" (Save)
    ↓
POST /api/candidates/ with all data
```

#### Backend Processing

**Endpoint:** `POST /api/candidates/`
**File:** `backend/app/api/candidates.py` (lines 329-366)
**Auth Required:** Yes (JWT token)

```python
# Request payload structure
{
    "full_name_kanji": "田中太郎",
    "full_name_kana": "タナカタロウ",
    "full_name_roman": "Tanaka Taro",
    "date_of_birth": "1990-05-15",
    "gender": "M",
    "nationality": "JP",
    "phone": "09012345678",
    "email": "tanaka@example.com",
    "address": "東京都渋谷区...",
    "passport_number": "XX123456",
    "residence_card_number": "XXXX1234",
    "visa_type": "work_visa",
    "photo_data_url": "data:image/jpeg;base64,/9j/4AAQSkZJRgAB...",
    # ... 50+ more fields
}

# Backend processing:
1. Validate user has COORDINATOR+ role
2. Create new Candidate record in database
3. Auto-generate identifiers:
   - applicant_id: Sequential number (2000, 2001, 2002...)
   - rirekisho_id: "UNS-001", "UNS-002", etc.
4. Set initial status: "pending"
5. Compress and validate photo
6. Store all 60 fields
7. Return created candidate object with ID
```

### 2.2 OCR Processing (Optional - During Registration)

**Location:** Frontend: `components/candidates/photo-upload-with-ocr.tsx`

#### Multi-Provider OCR Cascade

The system uses a **failover chain** for robust document processing:

```
┌──────────────────────────────────────┐
│  User uploads document (JPG/PNG)     │
└──────────────────────────────────────┘
              ↓
┌──────────────────────────────────────┐
│  PROVIDER 1: Azure Computer Vision   │
│  - Best for Japanese text            │
│  - Highest accuracy                  │
│  - Requires AZURE_API_KEY            │
└──────────────────────────────────────┘
   ✅ Success → Use results
   ❌ Fail (timeout, no key) → Try next
              ↓
┌──────────────────────────────────────┐
│  PROVIDER 2: EasyOCR                 │
│  - Deep learning based               │
│  - Fallback option                   │
│  - Pre-installed in Docker           │
└──────────────────────────────────────┘
   ✅ Success → Use results
   ❌ Fail → Try next
              ↓
┌──────────────────────────────────────┐
│  PROVIDER 3: Tesseract               │
│  - Open source                       │
│  - Last resort                       │
│  - Fallback to manual entry          │
└──────────────────────────────────────┘
   ✅ Success → Use results
   ❌ Fail → Return error, user enters manually
```

**Supported Documents:**
1. **履歴書 (Rirekisho)** - Resume
   - Extracts 50+ fields automatically
   - Identifies work experience, education
   - Validates date formats

2. **在留カード (Zairyu Card)** - Residence card
   - Extracts passport number
   - Reads visa expiry
   - Validates card number

3. **運転免許証 (Driver's License)** - Driving permit
   - Validates license number
   - Reads expiry date

**Face Detection:**
- Uses MediaPipe library to detect human faces
- Automatically crops and extracts photo
- Stores face photo separately if present

### 2.3 Data Storage in Database

**Table:** `candidates`
**Columns:** 60+ fields

```sql
CREATE TABLE candidates (
    id SERIAL PRIMARY KEY,

    -- Identifiers
    rirekisho_id VARCHAR(50) UNIQUE NOT NULL,        -- UNS-001
    applicant_id VARCHAR(50) UNIQUE,                  -- 2000, 2001...

    -- Names (3 formats required for matching)
    full_name_kanji VARCHAR(255),                     -- 田中太郎
    full_name_kana VARCHAR(255),                      -- タナカタロウ
    full_name_roman VARCHAR(255) NOT NULL,            -- Tanaka Taro

    -- Personal
    date_of_birth DATE,
    gender VARCHAR(10),
    nationality VARCHAR(50),

    -- Contact
    phone VARCHAR(20),
    email VARCHAR(255),
    address TEXT,

    -- Immigration
    passport_number VARCHAR(50),
    passport_expiry_date DATE,
    residence_card_number VARCHAR(50),
    residence_card_expiry DATE,
    visa_type VARCHAR(50),
    visa_expiry_date DATE,

    -- Status & Workflow
    status VARCHAR(50) DEFAULT 'pending',            -- pending|approved|hired
    approved_by INTEGER REFERENCES users(id),
    approved_at TIMESTAMP,

    -- Photo & Documents
    photo_data_url TEXT,                             -- Base64 compressed

    -- Timestamps
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    -- Metadata
    created_by INTEGER REFERENCES users(id),
    notes TEXT
);
```

**Index:**
```sql
CREATE INDEX idx_candidates_rirekisho_id ON candidates(rirekisho_id);
CREATE INDEX idx_candidates_status ON candidates(status);
CREATE INDEX idx_candidates_full_name_roman_dob ON candidates(
    TRIM(LOWER(full_name_roman)),
    date_of_birth
);  -- For matching with employees
```

---

## 3. PHASE 2: CANDIDATE EVALUATION & APPROVAL

### 3.1 Quick Evaluation (2-Click Approval)

**Location:** Frontend: `app/(dashboard)/candidates/[id]/page.tsx`
**Component:** `CandidateEvaluationCard`

#### UI: 👍/👎 Buttons

```
┌─────────────────────────────────────────┐
│  Candidate Details                      │
├─────────────────────────────────────────┤
│                                         │
│  Name: 田中太郎 (Tanaka Taro)           │
│  DOB: 1990-05-15                        │
│  Contact: 090-1234-5678                 │
│  Visa: Work Visa (expires 2026-12-31)   │
│  Status: 🔴 Pending                     │
│                                         │
│  ┌───────────────────────────────────┐  │
│  │         📸 Photo                   │  │
│  │  [Compressed JPEG - 45KB]          │  │
│  └───────────────────────────────────┘  │
│                                         │
│  Previous Experience:                  │
│  • XYZ Company - Technician (2 years)  │
│  • ABC Factory - Line Worker (3 years) │
│                                         │
│  ┌──────────────┐ ┌──────────────────┐ │
│  │  👍 Aprobar  │ │  👎 Rechazar     │ │
│  └──────────────┘ └──────────────────┘ │
│                                         │
└─────────────────────────────────────────┘
```

#### Approval Endpoint

**Endpoint:** `POST /api/candidates/{candidate_id}/evaluate`
**File:** `backend/app/api/candidates.py` (lines 581-638)

```python
# Request payload
{
    "approved": true,  # true = approve, false = reject
    "notes": "Looks good. Ready for hire."  # Optional
}

# Backend processing:
1. Validate user has COORDINATOR+ role
2. Check candidate exists
3. If approved == true:
   a. Update candidate.status = "approved"
   b. Set candidate.approved_by = current_user.id
   c. Set candidate.approved_at = now()
   d. 🆕 AUTO-CREATE Request (type=NYUUSHA)
4. If approved == false:
   a. Update candidate.status = "rejected"
   b. Send notification to HR
5. Save changes to database
6. Return updated candidate
```

### 3.2 Automatic Request Creation

**Triggered:** When candidate is approved (👍 button)

**Auto-Created Request Object:**

```python
# New Request is automatically created:
Request(
    candidate_id=123,              # Link to candidate
    hakenmoto_id=None,             # To be filled later
    request_type=RequestType.NYUUSHA,  # New hire type
    status=RequestStatus.PENDING,   # Initial state
    start_date=date.today(),        # When request created
    end_date=date.today(),          # Placeholder
    reason=f"新規採用: 田中太郎",    # Auto-generated reason
    employee_data={},               # Empty JSON, filled in Phase 3
    created_by=current_user.id,
    created_at=now(),
)
```

**What Happens:**
1. ✅ Candidate moves to "approved" status
2. ✅ New Request appears in `/requests` page with badge "入社連絡票"
3. ✅ Request is in "pending" status, waiting for Phase 3

### 3.3 Status Progression

```
┌─────────────────────────────────────────────────────────────┐
│                 CANDIDATE STATUS FLOW                       │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  pending      → approved       → hired                      │
│  (submitted)    (approved by    (employee created)          │
│                  coordinator)                               │
│                                                              │
│      ↓ Reject                                                │
│      rejected (end of process)                              │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

---

## 4. PHASE 3: NEW HIRE NOTIFICATION (入社連絡票)

### 4.1 Request Detail Page

**Location:** Frontend: `app/(dashboard)/requests/[id]/page.tsx`
**Component:** `NYuushaRequestDetail`

#### Display Layout

```
┌─────────────────────────────────────────────────────────────┐
│  入社連絡票 (New Hire Notification Form)                    │
│  Request ID: REQ-2025-0001 | Status: 🟡 Pending             │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  ┌─ CANDIDATE DATA (READ-ONLY) ────────────────────────────┐ │
│  │                                                          │ │
│  │  Name: 田中太郎 (Tanaka Taro)                           │ │
│  │  Rirekisho ID: UNS-001                                 │ │
│  │  DOB: 1990-05-15                                       │ │
│  │  Phone: 090-1234-5678                                  │ │
│  │  Email: tanaka@example.com                             │ │
│  │  Visa Expires: 2026-12-31                              │ │
│  │  Photo: [Image]                                        │ │
│  │                                                          │ │
│  └──────────────────────────────────────────────────────────┘ │
│                                                              │
│  ┌─ EMPLOYEE DATA (EDITABLE) ──────────────────────────────┐ │
│  │                                                          │ │
│  │  配属工場 (Factory Assignment): *                       │ │
│  │  ┌─────────────────────────────────┐                   │ │
│  │  │ 高雄工業株式会社_本社工場      ▼ │                   │ │
│  │  └─────────────────────────────────┘                   │ │
│  │                                                          │ │
│  │  入社日 (Hire Date): *                                  │ │
│  │  ┌──────────────┐                                       │ │
│  │  │ 2025-12-01   │ (date picker)                         │ │
│  │  └──────────────┘                                       │ │
│  │                                                          │ │
│  │  時給 (Hourly Wage): *                                  │ │
│  │  ┌──────────────┐                                       │ │
│  │  │ 1500 (JPY)   │                                       │ │
│  │  └──────────────┘                                       │ │
│  │                                                          │ │
│  │  職位 (Position): *                                     │ │
│  │  ┌──────────────────────────────────┐                   │ │
│  │  │ Line Worker (製造スタッフ)    ▼ │                   │ │
│  │  └──────────────────────────────────┘                   │ │
│  │                                                          │ │
│  │  契約タイプ (Contract Type): *                          │ │
│  │  ○ 派遣社員 (Dispatch)                                  │ │
│  │  ○ 直雇用 (Direct Hire)                                │ │
│  │  ○ 請負 (Contractor)                                  │ │
│  │                                                          │ │
│  │  社宅 (Corporate Housing):                              │ │
│  │  ┌──────────────────────────────────┐                   │ │
│  │  │ サンハイツ101                ▼ │                   │ │
│  │  └──────────────────────────────────┘                   │ │
│  │                                                          │ │
│  └──────────────────────────────────────────────────────────┘ │
│                                                              │
│  ┌──────────────┐         ┌──────────────┐                 │
│  │  💾 保存    │         │  ✅ 承認     │                 │
│  │  (Save)    │         │  (Approve)   │                 │
│  └──────────────┘         └──────────────┘                 │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

### 4.2 Data Entry Endpoints

#### Save Employee Data (Step 1)

**Endpoint:** `PUT /api/requests/{request_id}/employee-data`
**File:** `backend/app/api/requests.py` (lines 295-344)

```python
# Request payload (employee-specific data)
{
    "factory_id": 123,
    "hire_date": "2025-12-01",
    "jikyu": 1500,              # Hourly wage in JPY
    "position": "line_worker",
    "contract_type": "dispatch",
    "apartment_id": 456,        # Optional
    "notes": "Started successfully"
}

# Backend processing:
1. Validate user has HR/ADMIN role
2. Check request exists and type=NYUUSHA
3. Store data in request.employee_data JSON field
4. Update request.updated_at timestamp
5. Return updated request
```

**Result:** Employee data is saved but NOT yet finalized

```sql
-- Example data in employee_data field:
{
    "factory_id": 123,
    "hire_date": "2025-12-01",
    "jikyu": 1500,
    "position": "line_worker",
    "contract_type": "dispatch",
    "apartment_id": 456
}
```

#### Approve & Create Employee (Step 2)

**Endpoint:** `POST /api/requests/{request_id}/approve-nyuusha`
**File:** `backend/app/api/requests.py` (lines 347-486)

```python
# Request payload (can be empty - uses stored employee_data)
{}

# Backend processing:
1. Validate user has ADMIN+ role
2. Check request exists and type=NYUUSHA
3. Validate employee_data is complete
4. Create new Employee record:
   a. Copy candidate data (40+ fields from candidates table)
   b. Add employee-specific fields from employee_data
   c. Set employee.status = "active"
   d. Generate hakenmoto_id (unique employee number)
   e. Link via rirekisho_id
5. Create apartment assignment (if apartment_id provided)
6. Create initial monthly rent deduction
7. Update request.status = "approved"
8. Update candidate.status = "hired"
9. Return created employee object
```

### 4.3 Employee Creation Logic

**Employee Record Created:**

```sql
-- New employee is created with these fields:

INSERT INTO employees (
    -- From Candidate
    rirekisho_id,                  -- "UNS-001"
    full_name_kanji,               -- "田中太郎"
    full_name_kana,                -- "タナカタロウ"
    full_name_roman,               -- "Tanaka Taro"
    date_of_birth,                 -- "1990-05-15"
    gender,                        -- "M"
    nationality,                   -- "JP"
    phone,                         -- "090-1234-5678"
    email,                         -- "tanaka@example.com"
    address,                       -- "東京都渋谷区..."
    passport_number,               -- "XX123456"
    visa_type,                     -- "work_visa"
    photo_data_url,                -- "[base64 compressed]"

    -- From Employee Data (NYUUSHA)
    hakenmoto_id,                  -- "E-2025-001" (auto-generated)
    factory_id,                    -- 123
    hire_date,                     -- "2025-12-01"
    jikyu,                         -- 1500
    position,                      -- "line_worker"
    contract_type,                 -- "dispatch"
    apartment_id,                  -- 456 (optional)

    -- System Fields
    status,                        -- "active"
    created_by,                    -- current_user.id
    created_at                     -- CURRENT_TIMESTAMP
)
```

**Apartment Integration (if applicable):**

```python
# If apartment_id provided:
1. Create ApartmentAssignment record
   - Link employee to apartment
   - Set assignment_date = hire_date
   - Calculate prorated rent (per-day basis)

2. Create RentDeduction record
   - Set deduction_date = first day of next month
   - Amount = prorated rent from assignment
   - Status = pending
```

---

## 5. PHASE 4: EMPLOYEE CREATION & FINALIZATION

### 5.1 System State After Approval

After `POST /api/requests/{request_id}/approve-nyuusha` completes:

```
┌─────────────────────────────────────────────────────────────┐
│                  SYSTEM STATE CHANGES                       │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  CANDIDATES TABLE:                                          │
│  ├─ rirekisho_id: UNS-001                                   │
│  ├─ full_name_roman: Tanaka Taro                           │
│  ├─ date_of_birth: 1990-05-15                              │
│  └─ status: ✅ "hired" (was "approved")                    │
│                                                              │
│  REQUESTS TABLE:                                            │
│  ├─ request_id: REQ-2025-0001                              │
│  ├─ type: "nyuusha"                                         │
│  ├─ status: ✅ "approved" (was "pending")                  │
│  └─ employee_data: {...complete data...}                  │
│                                                              │
│  EMPLOYEES TABLE (NEW):                                     │
│  ├─ id: 456 (auto-generated)                               │
│  ├─ rirekisho_id: UNS-001 ← Link to candidate              │
│  ├─ hakenmoto_id: E-2025-001 (auto-generated)              │
│  ├─ full_name_roman: Tanaka Taro                           │
│  ├─ factory_id: 123                                        │
│  ├─ hire_date: 2025-12-01                                  │
│  ├─ jikyu: 1500 (¥/hour)                                   │
│  ├─ status: ✅ "active"                                    │
│  └─ apartment_id: 456 (if applicable)                      │
│                                                              │
│  APARTMENT_ASSIGNMENTS TABLE (if applicable):              │
│  ├─ employee_id: 456                                       │
│  ├─ apartment_id: 456                                      │
│  ├─ assignment_date: 2025-12-01                            │
│  └─ status: "active"                                       │
│                                                              │
│  RENT_DEDUCTIONS TABLE (if applicable):                    │
│  ├─ employee_id: 456                                       │
│  ├─ deduction_date: 2025-12-01 (first of next month)      │
│  ├─ amount: ¥45,000 (prorated or full)                    │
│  └─ status: "pending"                                      │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

### 5.2 Employee Verification

**Location:** Frontend: `app/(dashboard)/employees/[id]/page.tsx`

**What You'll See:**
- All candidate information copied over
- Hire date, factory, position visible
- Hourly wage displayed
- Contract type shown
- Photo available
- Active status indicated

### 5.3 Request Archival

After approval, the Request/NYUUSHA form:
- Moves to "approved" status
- Can still be viewed for historical reference
- Archived in `/requests` page
- Linked to both candidate and employee

---

## 6. DATABASE SCHEMA & MODELS

### 6.1 Key Tables & Relationships

```
┌─────────────────────────────────────────────────────────────┐
│                    DATABASE SCHEMA                          │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  CANDIDATES TABLE (履歴書)                                  │
│  ├─ PK: id (INT)                                            │
│  ├─ Unique: rirekisho_id (VARCHAR) ← Primary identifier    │
│  ├─ Fields: 60+ (name, DOB, contact, visa, photo, etc.)    │
│  ├─ Status: pending → approved → hired                     │
│  └─ Timestamps: created_at, updated_at                     │
│                                                              │
│                          ↓ (via NYUUSHA request)           │
│                                                              │
│  REQUESTS TABLE (申請)                                      │
│  ├─ PK: id (INT)                                            │
│  ├─ FK: candidate_id → candidates.id                        │
│  ├─ Type: "nyuusha" (new hire form)                        │
│  ├─ Data: employee_data (JSON) ← Temp storage              │
│  ├─ Status: pending → approved → completed                 │
│  └─ Timestamps: created_at, updated_at                     │
│                                                              │
│                          ↓ (via approve endpoint)          │
│                                                              │
│  EMPLOYEES TABLE (派遣社員)                                │
│  ├─ PK: id (INT)                                            │
│  ├─ FK: rirekisho_id → candidates.rirekisho_id              │
│  ├─ Unique: hakenmoto_id (VARCHAR) ← Secondary id          │
│  ├─ FK: factory_id → factories.id                           │
│  ├─ FK: apartment_id → apartments.id (optional)             │
│  ├─ Fields: 40+ from candidate + employee-specific        │
│  ├─ Status: active, inactive, on_leave                     │
│  └─ Timestamps: created_at, updated_at                     │
│                                                              │
│                          ↓ (if apartment assigned)         │
│                                                              │
│  APARTMENT_ASSIGNMENTS TABLE                                │
│  ├─ FK: employee_id → employees.id                          │
│  ├─ FK: apartment_id → apartments.id                        │
│  ├─ assignment_date: When moved in                         │
│  └─ status: active, transferred, vacated                   │
│                                                              │
│  FACTORIES TABLE (派遣先)                                   │
│  ├─ PK: factory_id (VARCHAR)                                │
│  ├─ Fields: company name, address, contact, rules          │
│  └─ Relationships: Many employees per factory              │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

### 6.2 Critical Matching Logic

**Problem:** How to link Candidates ↔ Employees reliably?

**Solution:** 3-tier matching strategy

```python
# STRATEGY 1: By Roman Name + Date of Birth (MOST RELIABLE)
SELECT * FROM candidates
WHERE TRIM(LOWER(full_name_roman)) = TRIM(LOWER('Tanaka Taro'))
  AND date_of_birth = '1990-05-15'
LIMIT 1;

# Why this works:
# - Roman name is more stable than furigana (less likely to change)
# - Date of birth is unique per person
# - TRIM(LOWER(...)) handles formatting variations
# - Success rate: >99%

# STRATEGY 2: By rirekisho_id (FALLBACK)
SELECT * FROM candidates
WHERE rirekisho_id = 'UNS-001'
LIMIT 1;

# Used when Strategy 1 fails
# Direct linking, no ambiguity

# STRATEGY 3: By fuzzy matching on names (LAST RESORT)
# Used only when both above fail
# Complex string similarity algorithms
```

### 6.3 SQLAlchemy Models

**File:** `backend/app/models/models.py`

```python
class Candidate(Base):
    __tablename__ = "candidates"

    id: Mapped[int] = mapped_column(primary_key=True)
    rirekisho_id: Mapped[str] = mapped_column(String(50), unique=True)
    applicant_id: Mapped[Optional[str]] = mapped_column(String(50), unique=True)

    full_name_kanji: Mapped[Optional[str]]
    full_name_kana: Mapped[Optional[str]]
    full_name_roman: Mapped[str]  # ← REQUIRED for matching
    date_of_birth: Mapped[Optional[date]]

    status: Mapped[str] = mapped_column(default="pending")
    # pending → approved → hired

    approved_by: Mapped[Optional[int]] = mapped_column(ForeignKey("users.id"))
    approved_at: Mapped[Optional[datetime]]

    photo_data_url: Mapped[Optional[str]]

    created_at: Mapped[datetime] = mapped_column(default=datetime.utcnow)
    updated_at: Mapped[datetime] = mapped_column(
        default=datetime.utcnow, onupdate=datetime.utcnow
    )

    # Relationships
    requests: Mapped[List["Request"]] = relationship(back_populates="candidate")

class Request(Base):
    __tablename__ = "requests"

    id: Mapped[int] = mapped_column(primary_key=True)
    candidate_id: Mapped[int] = mapped_column(ForeignKey("candidates.id"))

    request_type: Mapped[str]  # "nyuusha", "yukyu", etc.
    status: Mapped[str] = mapped_column(default="pending")

    employee_data: Mapped[dict] = mapped_column(JSON, default={})

    # Relationships
    candidate: Mapped["Candidate"] = relationship(back_populates="requests")

class Employee(Base):
    __tablename__ = "employees"

    id: Mapped[int] = mapped_column(primary_key=True)
    rirekisho_id: Mapped[str] = mapped_column(
        String(50), ForeignKey("candidates.rirekisho_id")
    )  # ← Links back to candidate

    hakenmoto_id: Mapped[str] = mapped_column(String(50), unique=True)

    full_name_roman: Mapped[str]
    date_of_birth: Mapped[Optional[date]]

    factory_id: Mapped[int] = mapped_column(ForeignKey("factories.factory_id"))
    apartment_id: Mapped[Optional[int]] = mapped_column(ForeignKey("apartments.id"))

    hire_date: Mapped[Optional[date]]
    jikyu: Mapped[Optional[Decimal]]  # Hourly wage
    position: Mapped[Optional[str]]
    contract_type: Mapped[Optional[str]]

    status: Mapped[str] = mapped_column(default="active")
```

---

## 7. API ENDPOINTS REFERENCE

### 7.1 Complete Candidate Workflow Endpoints

| # | Method | Endpoint | Purpose | Role Required |
|---|--------|----------|---------|---------------|
| 1 | POST | `/api/candidates/` | Create new candidate | COORDINATOR+ |
| 2 | GET | `/api/candidates/` | List all candidates | COORDINATOR+ |
| 3 | GET | `/api/candidates/{id}` | View candidate details | COORDINATOR+ |
| 4 | PUT | `/api/candidates/{id}` | Edit candidate | COORDINATOR+ |
| 5 | POST | `/api/candidates/{id}/evaluate` | Approve/reject candidate | COORDINATOR+ |
| 6 | POST | `/api/candidates/{id}/photo` | Upload/update photo | COORDINATOR+ |
| 7 | POST | `/api/candidates/rirekisho/form` | Save form with OCR | COORDINATOR+ |
| 8 | DELETE | `/api/candidates/{id}` | Delete candidate | ADMIN |

### 7.2 Request/NYUUSHA Workflow Endpoints

| # | Method | Endpoint | Purpose | Role Required |
|---|--------|----------|---------|---------------|
| 1 | GET | `/api/requests/` | List all requests | COORDINATOR+ |
| 2 | GET | `/api/requests/{id}` | View request details | COORDINATOR+ |
| 3 | PUT | `/api/requests/{id}/employee-data` | Save employee data (Phase 3.2) | ADMIN+ |
| 4 | POST | `/api/requests/{id}/approve-nyuusha` | Create employee (Phase 4) | ADMIN+ |
| 5 | DELETE | `/api/requests/{id}` | Delete request | ADMIN |

### 7.3 Employee Workflow Endpoints

| # | Method | Endpoint | Purpose | Role Required |
|---|--------|----------|---------|---------------|
| 1 | POST | `/api/employees/` | Create employee (direct, legacy) | ADMIN+ |
| 2 | GET | `/api/employees/` | List all employees | COORDINATOR+ |
| 3 | GET | `/api/employees/{id}` | View employee details | COORDINATOR+ |
| 4 | PUT | `/api/employees/{id}` | Edit employee | ADMIN+ |
| 5 | DELETE | `/api/employees/{id}` | Delete employee | ADMIN |
| 6 | GET | `/api/employees/{id}/photo` | Get employee photo | ANY |

---

## 8. FRONTEND FLOW & USER INTERFACE

### 8.1 Complete Navigation Path

```
Dashboard
  ↓
┌─────────────────────────────────────────┐
│  Candidates (履歴書管理)                 │
├─────────────────────────────────────────┤
│                                         │
│  [Page: List All Candidates]            │
│  - Search, filter by status             │
│  - View thumbnails                      │
│  - 👍/👎 quick buttons                 │
│                                         │
│  ┌─────────────────────────────────────┐│
│  │ [Button] + 新規登録 (New)           ││
│  └─────────────────────────────────────┘│
│          ↓                              │
│  [Page: Create Candidate]               │
│  - 60+ field form                       │
│  - Photo upload with compression        │
│  - Optional OCR integration             │
│  - Validation on submit                 │
│                                         │
│  ┌─────────────────────────────────────┐│
│  │ [Button] 保存 (Save)                ││
│  └─────────────────────────────────────┘│
│          ↓                              │
│  ✅ Candidate created                   │
│  ├─ rirekisho_id: UNS-001               │
│  └─ status: "pending"                   │
│                                         │
│  [Page: List Candidates - Updated]      │
│  - New candidate appears with badge     │
│  - Shows 2 buttons: 👍 / 👎             │
│                                         │
│  ┌─────────────────────────────────────┐│
│  │ [Button] 👍 Approve                ││
│  └─────────────────────────────────────┘│
│          ↓                              │
│  ✅ Candidate approved                  │
│  ├─ status: "approved"                  │
│  └─ NYUUSHA Request auto-created        │
│                                         │
└─────────────────────────────────────────┘
  ↓
┌─────────────────────────────────────────┐
│  Requests (申請管理)                     │
├─────────────────────────────────────────┤
│                                         │
│  [Page: List All Requests]              │
│  - Filter by type (NYUUSHA, YUKYU...)   │
│  - Filter by status                     │
│  - NYUUSHA badge in list                │
│                                         │
│  ┌─────────────────────────────────────┐│
│  │ [Item] REQ-2025-0001 (NYUUSHA)     ││
│  │ Candidate: 田中太郎                 ││
│  │ Status: 🟡 Pending                 ││
│  └─────────────────────────────────────┘│
│          ↓ (click to open)              │
│  [Page: NYUUSHA Detail]                 │
│  - Left: Candidate data (read-only)     │
│  - Right: Employee data form (editable) │
│  - Fields: factory, hire_date, jikyu... │
│                                         │
│  ┌─────────────────────────────────────┐│
│  │ [Button] 保存 (Save)                ││
│  └─────────────────────────────────────┘│
│          ↓                              │
│  ✅ Employee data saved                 │
│  ├─ request.employee_data = {...}       │
│  └─ status: still "pending"             │
│                                         │
│  [Page: NYUUSHA Detail - Updated]       │
│  - Form data now visible                │
│  - New button appears: 承認 (Approve)   │
│                                         │
│  ┌─────────────────────────────────────┐│
│  │ [Button] ✅ 承認 (Approve)          ││
│  └─────────────────────────────────────┘│
│          ↓                              │
│  ✅ Employee created                    │
│  ├─ Full record copied from candidate   │
│  ├─ Employee data merged in             │
│  ├─ hakenmoto_id generated              │
│  ├─ Status: "active"                    │
│  └─ Apartment assignment created        │
│                                         │
│  [Page: NYUUSHA Detail - Completed]     │
│  - Status: ✅ Approved                  │
│  - Links to new employee visible        │
│                                         │
└─────────────────────────────────────────┘
  ↓
┌─────────────────────────────────────────┐
│  Employees (派遣社員管理)                │
├─────────────────────────────────────────┤
│                                         │
│  [Page: List All Employees]             │
│  - NEW employee visible in list         │
│  - Active status shown                  │
│  - Can filter, sort, bulk edit          │
│                                         │
│  ┌─────────────────────────────────────┐│
│  │ [Item] Tanaka Taro                  ││
│  │ ID: E-2025-001                      ││
│  │ Factory: 高雄工業                   ││
│  │ Status: ✅ Active                   ││
│  └─────────────────────────────────────┘│
│          ↓ (click to open)              │
│  [Page: Employee Details]               │
│  - All candidate data visible           │
│  - Hire date: 2025-12-01                │
│  - Hourly rate: ¥1,500                  │
│  - Factory: 高雄工業_本社工場           │
│  - Apartment: サンハイツ101             │
│  - Status: Active                       │
│  - Can edit, transfer, deactivate       │
│                                         │
└─────────────────────────────────────────┘
```

### 8.2 Key Frontend Components

**File:** `frontend/components/candidates/`
- `candidate-form.tsx` - Main form for creating/editing
- `candidate-list.tsx` - List view with approval buttons
- `candidate-detail.tsx` - Detail view
- `photo-upload-with-ocr.tsx` - Photo upload + OCR integration
- `ocr-result-display.tsx` - Show OCR extracted data

**File:** `frontend/app/(dashboard)/candidates/`
- `page.tsx` - List view
- `new/page.tsx` - Create form
- `[id]/page.tsx` - Detail + evaluation
- `[id]/edit/page.tsx` - Edit form

**File:** `frontend/app/(dashboard)/requests/`
- `page.tsx` - List view
- `[id]/page.tsx` - NYUUSHA detail + employee data form

**File:** `frontend/app/(dashboard)/employees/`
- `page.tsx` - List view
- `new/page.tsx` - Create form (legacy)
- `[id]/page.tsx` - Detail view
- `[id]/edit/page.tsx` - Edit form

---

## 9. OCR INTEGRATION IN CANDIDATE PROCESS

### 9.1 Optional OCR During Registration

**When Used:**
- User uploads a document (リークシー PDF or image)
- System extracts field data automatically
- User edits extracted data for accuracy
- Submits form with combined manual + OCR data

### 9.2 Multi-Provider Cascade

**Cascade Logic:**

```python
async def process_document(image_path: str):
    """Try providers in order, use first successful result"""

    # Step 1: Try Azure Computer Vision
    try:
        result = await azure_ocr_service.extract(image_path)
        return result  # ✅ Success, return immediately
    except AzureException as e:
        logger.warning(f"Azure failed: {e}")

    # Step 2: Try EasyOCR
    try:
        result = await easyocr_service.extract(image_path)
        return result  # ✅ Success, return immediately
    except Exception as e:
        logger.warning(f"EasyOCR failed: {e}")

    # Step 3: Try Tesseract
    try:
        result = await tesseract_service.extract(image_path)
        return result  # ✅ Success, return immediately
    except Exception as e:
        logger.error(f"All OCR providers failed: {e}")

    # Step 4: Fallback - return empty, user enters manually
    return {
        "error": "All OCR providers failed",
        "message": "Please enter data manually"
    }
```

### 9.3 Extracted Fields

**From Rirekisho (Resume):**
- Personal: Name, DOB, gender, nationality
- Contact: Phone, email, address
- Immigration: Passport, residence card, visa info
- Experience: Previous positions, dates, companies
- Education: Schools attended, graduation dates
- Languages: Languages known, proficiency levels
- Certifications: Professional certifications

**From Zairyu Card (Residence Card):**
- Residence card number
- Expiry date
- Passport reference
- Visa type

**From Driver's License:**
- License number
- Expiry date
- Issued date

### 9.4 Face Detection with MediaPipe

**Automatic Photo Extraction:**

```python
import mediapipe as mp

def extract_face_from_document(image_bytes: bytes) -> Optional[bytes]:
    """Extract human face from document image"""

    mp_face_detection = mp.solutions.face_detection

    with mp_face_detection.FaceDetection() as face_detection:
        # Process image
        results = face_detection.process(cv2.imread(image_path))

        if results.detections:
            # Face found - crop and return
            for detection in results.detections:
                # Bounding box coordinates
                bbox = detection.location_data.relative_bounding_box

                # Crop face region with padding
                face_image = crop_region(image, bbox, padding=0.1)

                # Compress for storage
                return compress_image(face_image, max_size=500)

        return None  # No face detected
```

---

## 10. DATA VALIDATION & ERROR HANDLING

### 10.1 Frontend Validation

**Before Form Submission:**

```typescript
// File: frontend/lib/validations.ts

const candidateSchema = z.object({
    full_name_roman: z.string()
        .min(2, "Name too short")
        .max(255, "Name too long")
        .regex(/^[a-zA-Z\s]+$/, "Only letters allowed"),

    date_of_birth: z.string()
        .regex(/^\d{4}-\d{2}-\d{2}$/, "Invalid format (YYYY-MM-DD)")
        .refine(d => {
            const dob = new Date(d)
            const age = (Date.now() - dob.getTime()) / (365.25 * 24 * 60 * 60 * 1000)
            return age >= 18 && age <= 80
        }, "Age must be 18-80"),

    email: z.string()
        .email("Invalid email format")
        .max(255),

    phone: z.string()
        .regex(/^\d{10,15}$/, "Invalid phone format"),

    passport_number: z.string()
        .optional()
        .refine(p => !p || /^[A-Z0-9]{6,9}$/.test(p), "Invalid passport format"),

    visa_expiry_date: z.string()
        .optional()
        .refine(d => !d || new Date(d) > new Date(), "Visa already expired"),

    photo_data_url: z.string()
        .optional()
        .refine(p => !p || p.length <= 500000, "Photo too large (max 500KB)"),
});
```

### 10.2 Backend Validation

**In FastAPI Endpoint:**

```python
@router.post("/api/candidates/")
async def create_candidate(
    candidate: CandidateCreate,  # ← Pydantic validates
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Create new candidate with validation"""

    # 1. Role-based access
    if current_user.role not in ["COORDINATOR", "ADMIN", "SUPER_ADMIN"]:
        raise HTTPException(status_code=403, detail="Insufficient permissions")

    # 2. Duplicate check by rirekisho_id
    existing = db.query(Candidate).filter(
        Candidate.rirekisho_id == candidate.rirekisho_id
    ).first()
    if existing:
        raise HTTPException(status_code=400, detail="Rirekisho ID already exists")

    # 3. Visa expiry validation
    if candidate.visa_expiry_date:
        if candidate.visa_expiry_date <= date.today():
            raise HTTPException(status_code=400, detail="Visa already expired")

    # 4. Age validation
    age = (date.today() - candidate.date_of_birth).days / 365.25
    if age < 18 or age > 80:
        raise HTTPException(status_code=400, detail="Age must be 18-80")

    # 5. Photo compression
    if candidate.photo_data_url:
        candidate.photo_data_url = photo_service.compress_photo(
            candidate.photo_data_url
        )

    # 6. Generate IDs
    candidate.rirekisho_id = generate_rirekisho_id(db)
    candidate.applicant_id = generate_applicant_id(db)

    # 7. Create and save
    db_candidate = Candidate(**candidate.dict())
    db_candidate.created_by = current_user.id
    db.add(db_candidate)
    db.commit()
    db.refresh(db_candidate)

    return db_candidate
```

### 10.3 Error Responses

**Standard Error Format:**

```json
{
    "detail": "Error message",
    "status_code": 400,
    "error_type": "ValidationError"
}

Examples:
{
    "detail": "Rirekisho ID already exists",
    "status_code": 400,
    "error_type": "DuplicateError"
}

{
    "detail": "Visa already expired",
    "status_code": 400,
    "error_type": "ValidationError"
}

{
    "detail": "Insufficient permissions",
    "status_code": 403,
    "error_type": "ForbiddenError"
}
```

### 10.4 Business Logic Validations

**NYUUSHA Approval Validations:**

```python
async def approve_nyuusha(request_id: int):
    """Validate before creating employee"""

    request = db.query(Request).filter(Request.id == request_id).first()
    if not request:
        raise HTTPException(404, "Request not found")

    if request.request_type != "nyuusha":
        raise HTTPException(400, "Not a NYUUSHA request")

    if request.status != "pending":
        raise HTTPException(400, "Request not in pending state")

    # Validate employee_data is complete
    employee_data = request.employee_data
    required_fields = ["factory_id", "hire_date", "jikyu", "position"]

    missing = [f for f in required_fields if f not in employee_data]
    if missing:
        raise HTTPException(
            400,
            f"Employee data incomplete. Missing: {', '.join(missing)}"
        )

    # Validate factory exists
    factory = db.query(Factory).filter(
        Factory.factory_id == employee_data["factory_id"]
    ).first()
    if not factory:
        raise HTTPException(400, "Factory not found")

    # Validate hire_date is in future
    hire_date = datetime.strptime(employee_data["hire_date"], "%Y-%m-%d").date()
    if hire_date < date.today():
        raise HTTPException(400, "Hire date cannot be in the past")

    # ✅ All validations passed, proceed with creation
    ...
```

---

## Summary

This complete guide documents the **entire hiring workflow** from start to finish:

1. **Phase 1:** User creates candidate with 60+ fields + photo
2. **Phase 2:** Admin approves candidate (👍/👎), NYUUSHA request auto-created
3. **Phase 3:** Admin fills employee-specific data (factory, wage, position, etc.)
4. **Phase 4:** Admin approves, employee record created with full linking
5. **Result:** Candidate promoted to Employee with all data consolidated

The system uses robust matching via `full_name_roman + date_of_birth` to link candidates to employees, supports optional OCR with multi-provider fallback, and includes comprehensive validation at every step.

**Total Timeline:** 4-6 minutes per candidate (with OCR), ~2 minutes without OCR.

