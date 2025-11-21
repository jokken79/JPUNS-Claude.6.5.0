# Diagramas Visuales: Relación Candidatos ↔ Empleados

## 1. DIAGRAMA DE ENTIDADES Y RELACIONES

```
┌──────────────────────────────────────────────────────────────────┐
│                         DATABASE SCHEMA                          │
└──────────────────────────────────────────────────────────────────┘

                          ┌─────────────────┐
                          │   CANDIDATES    │
                          │  (履歴書)        │
                          └────────┬────────┘
                                   │
        ┌──────────────────────────┼──────────────────────────┐
        │                          │                          │
        │                          │                          │
        ▼                          ▼                          ▼
  ┌──────────────┐         ┌──────────────┐         ┌──────────────┐
  │  EMPLOYEES   │         │CONTRACT      │         │    STAFF     │
  │ (派遣社員)   │         │WORKERS       │         │  (スタッフ)  │
  │              │         │(請負社員)    │         │              │
  │ 1:N via      │         │ 1:N via      │         │ 1:N via      │
  │ rirekisho_id │         │ rirekisho_id │         │ rirekisho_id │
  └──────────────┘         └──────────────┘         └──────────────┘

                     Todas comparten:
           - rirekisho_id (Foreign Key)
           - photo_data_url (sincronizado)
           - Otros campos personales


┌─────────────────────────────────────────────────────────────────┐
│                  CANDIDATES TABLE FIELDS                        │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│ KEY FIELDS:                                                    │
│ ├─ id (PK)                     INTEGER PRIMARY KEY            │
│ ├─ rirekisho_id (UK)          STRING(20) UNIQUE ←────────┐   │
│ ├─ applicant_id               STRING(50)                 │   │
│ │                                                        │   │
│ APPROVAL FIELDS:                                        │   │
│ ├─ status                     STRING (pending/approved/  │   │
│ │                              rejected/hired)          │   │
│ ├─ approved_by                INT FK → users.id         │   │
│ ├─ approved_at                DATETIME                  │   │
│ │                                                        │   │
│ PHOTO FIELDS:                                           │   │
│ ├─ photo_url                  STRING(255) [LEGACY]      │   │
│ ├─ photo_data_url ★           TEXT (BASE64) [PRIMARY]   │   │
│ │                                                        │   │
│ PERSONAL INFO:                                          │   │
│ ├─ full_name_kanji            STRING(100)               │   │
│ ├─ full_name_kana             STRING(100)               │   │
│ ├─ full_name_roman            STRING(100)               │   │
│ ├─ date_of_birth              DATE                      │   │
│ ├─ gender                     STRING(10)                │   │
│ ├─ nationality                STRING(50)                │   │
│ ├─ phone, mobile, email       STRING/VARCHAR            │   │
│ ├─ postal_code, address       STRING/TEXT               │   │
│ │                                                        │   │
│ AUDIT:                                                  │   │
│ ├─ created_at                 DATETIME                  │   │
│ ├─ updated_at                 DATETIME                  │   │
│ ├─ deleted_at                 DATETIME [SOFT DELETE]    │   │
│                                                          │   │
└──────────────────────────────────────────────────────────┼───┘
                                                           │
                   REFERENCES (FK)                         │
                                                           │
┌──────────────────────────────────────────────────────────┼───┐
│                EMPLOYEES TABLE FIELDS                    │   │
├──────────────────────────────────────────────────────────┼───┤
│                                                          │   │
│ KEY FIELDS:                                            │   │
│ ├─ id (PK)                     INTEGER PRIMARY KEY      │   │
│ ├─ hakenmoto_id (UK)           INTEGER UNIQUE           │   │
│ ├─ rirekisho_id (FK) ◄─────────────────────────────────┘   │
│ │                                                          │
│ PHOTO FIELDS:                                            │
│ ├─ photo_url                  STRING(255)               │
│ ├─ photo_data_url ★           TEXT (SYNCED FROM C)      │
│ │                                                          │
│ PERSONAL INFO (inherited from EmployeeBaseMixin):       │
│ ├─ full_name_kanji            STRING(100)               │
│ ├─ full_name_kana             STRING(100)               │
│ ├─ date_of_birth              DATE                      │
│ ├─ gender, nationality        STRING                    │
│ ├─ phone, email               STRING                    │
│ ├─ address, postal_code       TEXT/STRING               │
│ │                                                          │
│ EMPLOYMENT FIELDS:                                      │
│ ├─ factory_id (FK)            STRING(200) → factories   │
│ ├─ apartment_id (FK)          INT → apartments          │
│ ├─ hire_date, current_hire_   DATE                      │
│ ├─ jikyu (hourly rate)        INT                       │
│ ├─ position                   STRING(100)               │
│ ├─ assignment_location        STRING(200)               │
│ ├─ assignment_line            STRING(200)               │
│ ├─ job_description            TEXT                      │
│ │                                                          │
│ AUDIT:                                                   │
│ ├─ created_at                 DATETIME                  │
│ ├─ updated_at                 DATETIME                  │
│ ├─ deleted_at                 DATETIME [SOFT DELETE]    │
│                                                          │
└──────────────────────────────────────────────────────────┘

★ = CRITICAL FIELD
← = RELATIONSHIP DIRECTION
```

---

## 2. FLUJO DE FOTOS (DETAILED)

```
┌────────────────────────────────────────────────────────────────┐
│               PHOTO UPLOAD & SYNC WORKFLOW                    │
└────────────────────────────────────────────────────────────────┘

STEP 1: USER UPLOADS PHOTO TO CANDIDATE
═════════════════════════════════════════════════════════════════

    Frontend (browser)
         │
         │ User selects image file
         │
         ▼
    POST /api/candidates/rirekisho/form
         │
         │ payload: {
         │   form_data: {...},
         │   photo_data_url: "data:image/jpeg;base64,/9j/..."  ← 原始
         │   rirekisho_id?: "UNS-123"
         │ }
         │
         ▼
    Backend: save_rirekisho_form()
         │
         ├─ photo_service.validate_photo_size()
         │  └─ Check: size <= 10MB ✓
         │
         ├─ photo_service.compress_photo()
         │  ├─ Decode base64
         │  ├─ Open with PIL
         │  ├─ Convert to RGB (handle transparency)
         │  ├─ Resize: fit within 800x1000px (maintain aspect ratio)
         │  ├─ Compress: JPEG quality 85
         │  ├─ Encode back to base64
         │  └─ Return: "data:image/jpeg;base64,<compressed>" ✓
         │
         ├─ Create/Update Candidate
         │  ├─ UPDATE candidates SET
         │  │  ├─ photo_data_url = <compressed>
         │  │  ├─ photo_url = <compressed>  [legacy field]
         │  │  └─ ... other form fields
         │  └─ COMMIT
         │
         └─ Return: CandidateFormResponse (with form snapshot)


STEP 2: CREATING EMPLOYEE FROM APPROVED CANDIDATE
═════════════════════════════════════════════════════════════════

    Admin approves candidate:
         │
         ├─ POST /api/candidates/{id}/evaluate?approved=true
         │  └─ candidates.status = "approved" ✓
         │
         └─ POST /api/employees/ (with rirekisho_id)
            │
            ├─ Verify: candidate exists
            ├─ Verify: candidate.status == "approved"
            │
            ├─ Load candidate from DB
            │  └─ SELECT * FROM candidates WHERE rirekisho_id = 'UNS-123'
            │
            ├─ Copy PHOTO from candidate to employee
            │  ├─ IF candidate.photo_url:
            │  │  └─ employee_data['photo_url'] = candidate.photo_url
            │  │
            │  └─ IF candidate.photo_data_url:
            │     └─ employee_data['photo_data_url'] = candidate.photo_data_url  ← SYNC
            │
            ├─ Generate hakenmoto_id (sequential)
            │
            ├─ Create Employee record
            │  └─ INSERT INTO employees
            │     ├─ hakenmoto_id = N
            │     ├─ rirekisho_id = 'UNS-123'
            │     ├─ photo_url = <value from candidate>
            │     ├─ photo_data_url = <base64 from candidate>  ← SYNCED
            │     └─ ... other fields
            │
            ├─ Copy documents from candidate
            │  ├─ SELECT * FROM documents WHERE candidate_id = X
            │  └─ FOR EACH doc:
            │     └─ INSERT INTO documents
            │        ├─ employee_id = Y
            │        ├─ candidate_id = X
            │        └─ ... other fields
            │
            ├─ Mark candidate as hired
            │  └─ UPDATE candidates SET status = 'hired'
            │
            └─ COMMIT


STEP 3: RESULT IN DATABASE
═════════════════════════════════════════════════════════════════

BEFORE (only candidate):
┌──────────────────────────────────────────┐
│ candidates                               │
├───────────┬─────────┬──────────────────┤
│ rirekisho │ photo_  │ photo_data_url   │
│ _id       │ url     │                  │
├───────────┼─────────┼──────────────────┤
│ UNS-123   │ NULL    │ data:image/jpeg  │  ← Original (compressed)
│           │         │ ;base64,/9j/...  │
└───────────┴─────────┴──────────────────┘


AFTER (candidate + employee linked):
┌─────────────────────────────────────────┐
│ candidates                              │
├───────────┬──────────┬─────────────────┤
│ rirekisho │ photo_url│ photo_data_url  │
│ _id       │          │                 │
├───────────┼──────────┼─────────────────┤
│ UNS-123   │ NULL     │ data:image/jpeg │  ← Same
│           │          │ ;base64,/9j/... │
└───────────┴──────────┴─────────────────┘

┌──────────────────────────────────────────┐
│ employees                                │
├────────┬──────────┬──────────────────────┤
│hakenmoto│rirekisho │ photo_data_url      │
│_id      │_id       │                     │
├────────┼──────────┼──────────────────────┤
│   1    │ UNS-123  │ data:image/jpeg    │  ← SYNCED
│        │          │ ;base64,/9j/...    │
└────────┴──────────┴──────────────────────┘


STEP 4: FRONTEND DISPLAY
═════════════════════════════════════════════════════════════════

Candidate Detail Page:
    <img src={candidate.photo_data_url || candidate.photo_url}
         alt="Candidate photo" />

Employee Detail Page:
    <img src={employee.photo_url || '/default.png'}
         alt="Employee photo" />
         
    Note: photo_data_url exists in DB but not exposed in API response
          (could be included if needed for editing)
```

---

## 3. ESTADO DEL CANDIDATO (STATUS WORKFLOW)

```
┌────────────────────────────────────────────────────────────────┐
│         CANDIDATE STATUS STATE MACHINE                         │
└────────────────────────────────────────────────────────────────┘

                            ┌─────────────┐
                            │   pending   │  ← Default (new candidate)
                            │  (審査中)    │
                            └──────┬──────┘
                                   │
                    ┌──────────────┼──────────────┐
                    │              │              │
                    ▼              ▼              ▼
              ┌──────────┐  ┌──────────┐  ┌──────────┐
              │approved  │  │ rejected │  │ pending  │
              │ (合格)   │  │(不合格)  │  │ (same)   │
              └────┬─────┘  └──────────┘  └──────────┘
                   │
       User: POST /candidates/{id}/evaluate?approved=true
       OR: POST /candidates/{id}/approve
       OR: Admin manual update
                   │
                   │ Only route to next state:
                   │ Create employee from approved candidate
                   │
                   ▼
              ┌──────────────┐
              │    hired     │  ← Employee created
              │   (採用)     │    status auto-updated
              └──────────────┘


TRANSITIONS:
═════════════════════════════════════════════════════════════════

1. pending → approved
   ├─ Trigger: Coordinator calls evaluate?approved=true
   ├─ Automatic: NO
   ├─ Reversible: YES (back to pending)
   └─ Created: NYUUSHA request (入社連絡票)

2. pending → rejected
   ├─ Trigger: Coordinator calls evaluate?approved=false
   ├─ Automatic: NO
   ├─ Reversible: YES (back to pending)
   └─ Created: Nothing

3. approved → hired
   ├─ Trigger: Admin creates employee with this candidate
   ├─ Automatic: YES (auto-set in POST /employees/)
   ├─ Reversible: NO (one-way)
   └─ Created: Employee record + copied documents

4. ANY → pending (by sync script if employee deleted)
   ├─ Trigger: sync_candidate_employee_status.py
   ├─ Automatic: YES (if employee gets deleted)
   ├─ Reversible: YES
   └─ Created: Nothing


SYNC SCRIPT LOGIC (sync_candidate_employee_status.py):
═════════════════════════════════════════════════════════════════

FOR EACH candidate:
    
    IF EXISTS employee/contract_worker/staff 
       WHERE rirekisho_id = candidate.rirekisho_id:
        → SET candidate.status = 'hired'
    
    ELSE:
        → SET candidate.status = 'pending'


STATUS FIELD DETAILS:
═════════════════════════════════════════════════════════════════

Column Definition:
├─ Type: String(20)
├─ Default: "pending"
├─ Nullable: NO
├─ Indexed: NO
├─ Searchable: YES
└─ Enum values:
   ├─ "pending"   (審査中)  - New, under review
   ├─ "approved"  (合格)    - Approved, ready to hire
   ├─ "rejected"  (不合格)  - Rejected
   └─ "hired"     (採用)    - Hired (employee created)
```

---

## 4. RELACIÓN UNO-A-MUCHOS

```
┌────────────────────────────────────────────────────────────────┐
│       ONE-TO-MANY RELATIONSHIP (1 Candidate : N Employees)    │
└────────────────────────────────────────────────────────────────┘

SCENARIO: Same candidate hired at multiple factories/times
═════════════════════════════════════════════════════════════════

Candidate: UNS-1 (John Doe)
├─ photo_data_url = data:image/jpeg;base64,...
├─ status = "hired" (because has employees)
└─ employees = [Employee 1, Employee 2, Employee 3]

     ┌────────────────────┬────────────────────┬────────────────────┐
     │                    │                    │                    │
     ▼                    ▼                    ▼                    ▼
   
Employee 1          Employee 2          Employee 3        Employee 4
├─ hakenmoto_id: 1  ├─ hakenmoto_id: 2  ├─ hakenmoto_id: 3  (not hired yet)
├─ rirekisho_id: UNS-1  ├─ rirekisho_id: UNS-1  ├─ rirekisho_id: UNS-1  ├─ rirekisho_id: UNS-2
├─ factory_id: A    ├─ factory_id: B    ├─ factory_id: C    └─ (different candidate)
├─ hire_date: 2024-01  ├─ hire_date: 2024-06  ├─ hire_date: 2024-11
├─ photo_data_url: (synced from UNS-1)
├─ status: active   ├─ status: terminated  ├─ status: active
└─ apartment: Apt-1 └─ apartment: NULL     └─ apartment: Apt-2


REAL-WORLD SCENARIO:
═════════════════════════════════════════════════════════════════

John Doe (Candidate UNS-1) applies:
│
├─ Hired at Factory A (Jan 2024)
│  └─ Employee record created
│  └─ Assigned to Apartment 1
│  └─ Works as assembler
│
├─ Transferred to Factory B (Jun 2024)
│  └─ Original employee terminated
│  └─ New employee record created
│  └─ No apartment assignment
│  └─ Works as inspector
│
└─ Hired at Factory C (Nov 2024)
   └─ Another employee record created
   └─ Assigned to Apartment 2
   └─ Works as line leader


DATABASE QUERIES:
═════════════════════════════════════════════════════════════════

Q1: Get all employees for a candidate
    SELECT * FROM employees
    WHERE rirekisho_id = 'UNS-1'

Q2: Get current employee for a candidate
    SELECT * FROM employees
    WHERE rirekisho_id = 'UNS-1' AND is_active = true

Q3: Get total income from all assignments
    SELECT SUM(jikyu * worked_hours) FROM employees
    WHERE rirekisho_id = 'UNS-1'

Q4: Get candidates without employees
    SELECT c.* FROM candidates c
    WHERE c.rirekisho_id NOT IN (
        SELECT DISTINCT rirekisho_id FROM employees
    )
```

---

## 5. PHOTO DATA URL FORMAT

```
┌────────────────────────────────────────────────────────────────┐
│          DATA URL FORMAT & ENCODING                            │
└────────────────────────────────────────────────────────────────┘

ANATOMY OF DATA URL:
═════════════════════════════════════════════════════════════════

data:image/jpeg;base64,/9j/4AAQSkZJRgABAQEAYABgAAD...
│    │     │     │     │  │                         │
│    │     │     │     │  └─ Base64 encoded binary image data
│    │     │     │     └─ Encoding method (base64)
│    │     │     └─ Separator (;)
│    │     └─ MIME type (image/jpeg, image/png, image/webp)
│    └─ Resource type (image)
└─ Data URL scheme (always "data:")


EXAMPLES:
═════════════════════════════════════════════════════════════════

JPEG:
    data:image/jpeg;base64,/9j/4AAQSkZJRgABAQEAYABgA...

PNG:
    data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEA...

WebP:
    data:image/webp;base64,UklGRiYAAABXRUJQVlA4IBIAAAAw...


DATABASE STORAGE:
═════════════════════════════════════════════════════════════════

Table: candidates
Column: photo_data_url (TEXT)

Sample entry (~300KB):
┌─────────────────────────────────────────────────────────────┐
│ data:image/jpeg;base64,/9j/4AAQSkZJRgABAQEAYABgAAD...    │
│ (full base64 string, ~400,000 characters when typical)      │
└─────────────────────────────────────────────────────────────┘

PostgreSQL TEXT type supports:
├─ Max size: Several MB (plenty for photos)
├─ Performance: Slower than file storage, but OK for <1MB
├─ Advantage: Everything in DB, no file system needed
└─ Disadvantage: Larger database size, slower queries


COMPRESSION APPLIED:
═════════════════════════════════════════════════════════════════

Original Photo
    ↓ (1920x1080, 2.5MB)
    
Compression Rules:
├─ Resize: Fit within 800x1000px (maintain aspect ratio)
├─ Quality: JPEG quality 85
├─ Format: Convert to RGB (handle transparency)
└─ Result: 200-300KB

Process (PIL/Pillow):
1. Decode base64
2. Open with Image.open()
3. If RGBA/P/LA: convert to RGB
4. If width > 800 or height > 1000: resize
5. Encode to JPEG with quality=85
6. Encode back to base64
7. Return: data:image/jpeg;base64,...

Example sizes:
├─ Original: 2.5MB (2048x1536 pixels)
├─ After: 280KB (800x600 pixels after resize)
└─ Reduction: ~89%
```

---

## 6. IMPORT PIPELINE

```
┌────────────────────────────────────────────────────────────────┐
│              DATA IMPORT PIPELINE                              │
└────────────────────────────────────────────────────────────────┘

STEP 1: RUN MIGRATIONS
═════════════════════════════════════════════════════════════════
docker exec backend alembic upgrade head
    ↓
Creates database schema with:
├─ candidates table
├─ employees table  
├─ contract_workers table
├─ staff table
└─ All relationships


STEP 2: IMPORT CANDIDATES & PHOTOS
═════════════════════════════════════════════════════════════════

Option A: From Excel/JSON
    python backend/scripts/import_candidates_improved.py
        ├─ Read candidates from Excel
        ├─ Generate rirekisho_id
        ├─ Extract photos (if available)
        ├─ Convert to data:image/... format
        └─ INSERT INTO candidates

Option B: From Access Database
    python backend/scripts/unified_photo_import.py
        ├─ Connect to Access .mdb file
        ├─ Extract photo attachments
        ├─ Convert to data URLs
        ├─ Match by rirekisho_id
        └─ UPDATE candidates SET photo_data_url


STEP 3: IMPORT EMPLOYEES
═════════════════════════════════════════════════════════════════
python backend/scripts/import_employees_complete.py
    ├─ Read employees from Excel
    ├─ Match to candidates by rirekisho_id
    ├─ Copy photo_data_url from candidate
    ├─ Generate hakenmoto_id
    └─ INSERT INTO employees


STEP 4: SYNC CANDIDATE STATUS
═════════════════════════════════════════════════════════════════
python backend/scripts/sync_candidate_employee_status.py
    ├─ FOR EACH candidate:
    ├─   IF has employee/contract_worker/staff:
    │     → status = "hired"
    │   ELSE:
    │     → status = "pending"
    └─ UPDATE candidates


DOCKER COMPOSE ENTRY:
═════════════════════════════════════════════════════════════════

services:
  importer:
    image: ...
    depends_on:
      - db (healthy)
    command: |
      /bin/bash -c "
        cd /app &&
        alembic upgrade head &&
        python scripts/manage_db.py seed &&
        python scripts/import_data.py &&
        python scripts/sync_candidate_employee_status.py
      "


TIMELINE:
═════════════════════════════════════════════════════════════════

Container startup:
    │
    ├─ (1) migrations created ✓
    ├─ (2) candidates imported ✓
    │      └─ photo_data_url populated
    │
    ├─ (3) employees imported ✓
    │      └─ photo_data_url SYNCED from candidates
    │
    ├─ (4) status synchronized ✓
    │      └─ hired/pending set based on employee existence
    │
    └─ Container ready for API calls
```

---

## 7. API ENDPOINTS CHEAT SHEET

```
┌────────────────────────────────────────────────────────────────┐
│           API ENDPOINTS FOR CANDIDATE-EMPLOYEE FLOW            │
└────────────────────────────────────────────────────────────────┘

CANDIDATE ENDPOINTS:
═════════════════════════════════════════════════════════════════

POST /api/candidates
├─ Create candidate (manual)
├─ Body: { full_name_kanji, full_name_roman, ... }
└─ Returns: Candidate with generated rirekisho_id

POST /api/candidates/rirekisho/form
├─ Save rirekisho form + photo ⭐ PRIMARY
├─ Body: { form_data, photo_data_url, rirekisho_id? }
├─ Compresses photo automatically
└─ Returns: CandidateForm snapshot

GET /api/candidates
├─ List all candidates (paginated)
├─ Params: skip, limit, status_filter, search, sort
└─ Returns: { items: [Candidate], total, pages, ... }

GET /api/candidates/{id}
├─ Get single candidate with all details
└─ Returns: Candidate

PUT /api/candidates/{id}
├─ Update candidate fields
├─ Body: { full_name_kanji, ... }
└─ Returns: Updated Candidate

POST /api/candidates/{id}/evaluate
├─ Quick evaluation (👍/👎) ⭐
├─ Body: { approved: boolean, notes?: string }
├─ Effect: Sets status = "approved" or "pending"
│         Creates NYUUSHA request if approved
└─ Returns: Updated Candidate

POST /api/candidates/{id}/approve
├─ Formal approval (alternative to evaluate)
├─ Body: { approve_data }
└─ Returns: Updated Candidate

POST /api/candidates/{id}/reject
├─ Formal rejection
├─ Body: { reason }
└─ Returns: Updated Candidate


EMPLOYEE ENDPOINTS:
═════════════════════════════════════════════════════════════════

POST /api/employees
├─ Create employee from approved candidate ⭐ CRITICAL
├─ Body: { rirekisho_id, factory_id, jikyu, hire_date, ... }
├─ Requirements:
│  ├─ Candidate must exist with this rirekisho_id
│  ├─ Candidate.status must be "approved"
├─ Automatic actions:
│  ├─ Generates hakenmoto_id
│  ├─ Copies photo_data_url from candidate
│  ├─ Sets candidate.status = "hired"
│  └─ Copies documents
└─ Returns: Employee with synced data

GET /api/employees
├─ List all employees (paginated)
├─ Params: skip, limit, factory_id, is_active, search
└─ Returns: { items: [Employee], total, pages, ... }

GET /api/employees/{id}
├─ Get single employee with all details
├─ Note: photo_data_url stored in DB but may not be in response
└─ Returns: EmployeeDetails

PUT /api/employees/{id}
├─ Update employee (doesn't sync back to candidate)
├─ Body: { full_name_kanji, jikyu, factory_id, ... }
└─ Returns: Updated Employee

DELETE /api/employees/{id}
├─ Soft delete employee
├─ Effect: Sets deleted_at timestamp
└─ Returns: Success message


WORKFLOW SEQUENCE:
═════════════════════════════════════════════════════════════════

User Flow A: Create Candidate with Form
═════════════════════════════════════════════════════════════════

1. POST /api/candidates/rirekisho/form
   ├─ Input: rirekisho form data + photo
   ├─ Photo: Compressed automatically (800x1000, q85)
   └─ Output: CandidateFormResponse
         ↓
2. GET /api/candidates/{id}  [verify created]
   └─ Confirm: status = "pending", photo_data_url = "data:..."
         ↓
3. POST /api/candidates/{id}/evaluate?approved=true
   ├─ Input: { approved: true, notes?: "..." }
   └─ Output: status = "approved"
         ↓
4. POST /api/employees
   ├─ Input: { rirekisho_id: "UNS-X", factory_id: "...", ... }
   ├─ Backend:
   │  ├─ Verify candidate exists & approved ✓
   │  ├─ Generate hakenmoto_id ✓
   │  ├─ Copy photo_data_url ✓
   │  ├─ Create employee ✓
   │  └─ Set candidate.status = "hired" ✓
   └─ Output: Employee with photo_data_url = <synced>
         ↓
5. GET /api/employees/{id}  [verify created]
   └─ Confirm: rirekisho_id = "UNS-X", photo synced


User Flow B: Import Bulk Data
═════════════════════════════════════════════════════════════════

1. python scripts/import_candidates_improved.py
   └─ Candidates in DB (with photos)

2. python scripts/import_employees_complete.py
   └─ Employees in DB (photos synced)

3. python scripts/sync_candidate_employee_status.py
   └─ Status synchronized (hired/pending)

4. GET /api/candidates
   └─ All candidates visible with status
```

---

## 8. KEY FILES REFERENCE

```
┌────────────────────────────────────────────────────────────────┐
│            KEY FILES FOR CANDIDATE-EMPLOYEE RELATION           │
└────────────────────────────────────────────────────────────────┘

DATABASE MODELS:
  /backend/app/models/models.py
  ├─ Candidate (lines 191-410)
  │  ├─ rirekisho_id (key)
  │  ├─ status (pending/approved/rejected/hired)
  │  ├─ photo_url, photo_data_url
  │  └─ employees relationship
  │
  ├─ Employee (lines 652-710)
  │  ├─ rirekisho_id (FK to candidate)
  │  ├─ hakenmoto_id (unique)
  │  ├─ photo_url, photo_data_url
  │  └─ candidate relationship
  │
  ├─ ContractWorker (lines 712-731)
  │  ├─ Same structure as Employee
  │  └─ Inherits EmployeeBaseMixin
  │
  ├─ Staff (lines 733-786)
  │  ├─ Similar structure
  │  └─ For office personnel (no dispatch)
  │
  └─ EmployeeBaseMixin (lines 564-650)
     └─ Shared fields for Employee/ContractWorker


API ENDPOINTS:
  /backend/app/api/candidates.py
  ├─ POST /candidates (create)
  ├─ POST /candidates/rirekisho/form ⭐ Photo upload
  ├─ GET /candidates (list)
  ├─ GET /candidates/{id}
  ├─ PUT /candidates/{id}
  ├─ POST /candidates/{id}/evaluate ⭐ Status change
  ├─ POST /candidates/{id}/approve
  └─ POST /candidates/{id}/reject

  /backend/app/api/employees.py
  ├─ POST /employees ⭐ Create + sync photos
  ├─ GET /employees (list)
  ├─ GET /employees/{id}
  ├─ PUT /employees/{id}
  └─ DELETE /employees/{id}


SERVICES:
  /backend/app/services/candidate_service.py
  └─ CandidateService (business logic)

  /backend/app/services/photo_service.py
  └─ PhotoService (compression, validation)


SCRIPTS:
  /backend/scripts/sync_candidate_employee_status.py
  └─ Synchronize status (run after imports) ⭐

  /backend/scripts/import_candidates_improved.py
  └─ Import candidates with photos

  /backend/scripts/import_employees_complete.py
  └─ Import employees (syncs photos)

  /backend/scripts/unified_photo_import.py
  └─ Import photos from Access/legacy


FRONTEND:
  /frontend/app/dashboard/candidates/[id]/page.tsx
  └─ Candidate detail (displays photo_data_url)

  /frontend/app/dashboard/employees/[id]/page.tsx
  └─ Employee detail (displays photo_url)


TESTS:
  /backend/tests/test_sync_candidate_employee.py
  └─ Tests for sync functionality
```

---

## SUMMARY TABLE

```
┌─────────────────────────────────────────────────────────────────┐
│           QUICK REFERENCE: FIELDS & RELATIONSHIPS              │
└─────────────────────────────────────────────────────────────────┘

RELATIONSHIP:
  Cardinality: 1 Candidate : N Employees
  Key Field: rirekisho_id
  Type: One-to-Many (ForeignKey)

STATUS FLOW:
  pending → approved → hired
  OR
  pending → rejected

PHOTO FLOW:
  Candidate (photo_data_url)
    ↓ (copied on employee creation)
  Employee (photo_data_url)
  
PHOTO FORMAT:
  Type: Data URL (base64)
  Max Original: 10MB
  Max Stored: ~200-300KB (after compression)
  Compression: 800x1000px, JPEG quality 85

KEY FIELDS:
  Candidate:
    - rirekisho_id (unique, 20 chars)
    - status (enum: pending/approved/rejected/hired)
    - photo_data_url (TEXT, base64)
    - approved_by, approved_at
  
  Employee:
    - hakenmoto_id (unique, sequential)
    - rirekisho_id (FK)
    - photo_data_url (synced from candidate)
    - factory_id, apartment_id (business fields)

SYNC BEHAVIOR:
  Manual: Photo copy (create employee)
  Automatic: Status update (sync script)
  One-way: Candidate → Employee only

ENDPOINTS:
  POST /candidates/rirekisho/form (upload photo)
  POST /candidates/{id}/evaluate (change status)
  POST /employees (create + sync)
  python sync_candidate_employee_status.py (bulk sync)
```

