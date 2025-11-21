# REQUESTS (申請) SYSTEM - COMPREHENSIVE EXPLORATION

**Last Updated:** 2025-11-11
**System Version:** 5.4.1
**Explored:** Backend models, APIs, schemas, and frontend components

---

## EXECUTIVE SUMMARY

The UNS-ClaudeJP system contains **TWO SEPARATE REQUEST SYSTEMS**:

1. **Generic Requests System** - Simple, general-purpose requests for various types (員工申請)
2. **Yukyu Requests System** - Specialized for paid vacation tracking (有給休暇申請)

**Current Status:** No 入社連絡票 (new hire notification form) exists yet. This will require:
- Adding a new RequestType enum value
- Creating relationships between candidates and requests
- Implementing automatic request creation on candidate approval
- Frontend UI for viewing/processing new hire forms

---

## PART 1: GENERIC REQUESTS SYSTEM

### 1.1 REQUEST TABLE STRUCTURE

**Database:** PostgreSQL
**Table Name:** `requests`
**Location:** `backend/app/models/models.py` (lines 847-888)

#### All Fields:

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `id` | Integer | Yes | Primary key |
| `hakenmoto_id` | Integer | Yes (FK) | Employee ID (派遣元社員ID) |
| `request_type` | Enum | Yes | Type of request (see below) |
| `status` | Enum | Yes | Current status |
| `start_date` | Date | Yes | Request start date |
| `end_date` | Date | Yes | Request end date |
| `reason` | Text | No | Reason for request |
| `notes` | Text | No | Additional notes |
| `approved_by` | Integer | No (FK) | User ID who approved |
| `approved_at` | DateTime | No | Approval timestamp |
| `created_at` | DateTime | Yes | Creation timestamp |
| `updated_at` | DateTime | Yes | Last update timestamp |

#### Computed Property:
```python
@property
def total_days(self):
    """Calculated from (end_date - start_date) + 1"""
    if self.start_date and self.end_date:
        delta = self.end_date - self.start_date
        return float(delta.days + 1)
    return None
```

### 1.2 REQUEST TYPES

**Enum:** `RequestType` (in models.py)

```python
class RequestType(str, enum.Enum):
    YUKYU = "yukyu"              # 有給休暇 - Paid vacation
    HANKYU = "hankyu"            # 半休 - Half day
    IKKIKOKOKU = "ikkikokoku"    # 一時帰国 - Temporary return to home country
    TAISHA = "taisha"            # 退社 - Resignation/Leave
```

**Observation:** `IKKIKOKOKU` (一時帰国) and `TAISHA` (退社) suggest this system was designed to handle multiple request types, but the generic requests table is mostly used for yukyu/hankyu. Taisha and Ikkikokoku are partially defined in schemas but not fully utilized.

### 1.3 REQUEST STATUS WORKFLOW

**Enum:** `RequestStatus`

```python
class RequestStatus(str, enum.Enum):
    PENDING = "pending"      # 審査中 (Under review)
    APPROVED = "approved"    # 承認済み (Approved)
    REJECTED = "rejected"    # 却下 (Rejected)
```

**Workflow:**
```
PENDING → [Admin Review] → APPROVED
       ↘              ↗
          REJECTED
```

**Note:** There is NO "済" (completed) or archived status. Once approved, requests stay in APPROVED state indefinitely.

### 1.4 RELATIONSHIPS

**Primary Relationship:** Request ←→ Employee

```python
# In Request model:
employee = relationship("Employee", foreign_keys=[hakenmoto_id], back_populates="requests")

# In Employee model:
requests = relationship("Request", back_populates="employee")
```

**Cross-references:**
- `approved_by` → User (who reviewed)
- `hakenmoto_id` → Employee.hakenmoto_id (派遣元社員ID)
- **NO DIRECT RELATIONSHIP TO CANDIDATES** (important gap for 入社連絡票)

### 1.5 BACKEND API ENDPOINTS

**Base URL:** `/api/requests/`
**File:** `backend/app/api/requests.py` (lines 1-268)

#### All Endpoints:

| Endpoint | Method | Auth | Description |
|----------|--------|------|-------------|
| `/requests/` | POST | Any | Create new request |
| `/requests/` | GET | Any | List requests (paginated) |
| `/requests/{id}` | GET | Any | Get request details |
| `/requests/{id}` | PUT | Any | Update pending request |
| `/requests/{id}/review` | POST | Admin | Approve/reject request |
| `/requests/{id}/approve` | POST | Admin | Quick approve (convenience) |
| `/requests/{id}/reject` | POST | Admin | Quick reject (convenience) |
| `/requests/{id}` | DELETE | Any | Delete pending request only |

#### Detailed Endpoint Specs:

**1. CREATE REQUEST**
```
POST /api/requests/
Body: {
  "employee_id": 123,
  "request_type": "yukyu" | "hankyu" | "ikkikokoku" | "taisha",
  "start_date": "2025-12-01",
  "end_date": "2025-12-05",
  "reason": "Vacation",
  "notes": "Optional notes"
}
Returns: RequestResponse (200/201)
```

**Business Logic:**
- Verifies employee exists
- For YUKYU/HANKYU: checks yukyu_remaining balance
- Converts employee.id to hakenmoto_id before saving
- Calculates total_days automatically

**2. LIST REQUESTS**
```
GET /api/requests/?employee_id=123&status=pending&request_type=yukyu&page=1&page_size=50
Returns: PaginatedResponse[RequestResponse]
```

**Filters:**
- `employee_id` - Filter by employee (converted to hakenmoto_id)
- `status` - Filter by PENDING | APPROVED | REJECTED
- `request_type` - Filter by type
- `page` / `page_size` - Pagination (default 50, max 100)

**3. UPDATE REQUEST**
```
PUT /api/requests/{id}
Body: {
  "start_date": "2025-12-01",
  "end_date": "2025-12-05",
  "reason": "Updated reason",
  "notes": "Updated notes"
}
Returns: RequestResponse
Constraints: Only PENDING requests can be updated
```

**4. REVIEW REQUEST**
```
POST /api/requests/{id}/review
Body: {
  "status": "approved" | "rejected",
  "notes": "Review notes (optional)"
}
Returns: RequestResponse
Constraints: Requires admin role; request must be PENDING
Side Effects: If APPROVED and YUKYU/HANKYU, updates Employee.yukyu_used and yukyu_remaining
```

**5. APPROVE REQUEST (shortcut)**
```
POST /api/requests/{id}/approve
Returns: RequestResponse
```

**6. REJECT REQUEST (shortcut)**
```
POST /api/requests/{id}/reject?reason=Reason text
Returns: RequestResponse
```

**7. DELETE REQUEST**
```
DELETE /api/requests/{id}
Returns: {"message": "Request deleted"}
Constraints: Only PENDING requests can be deleted
```

### 1.6 PYDANTIC SCHEMAS

**File:** `backend/app/schemas/request.py`

```python
# Base Schema
class RequestBase(BaseModel):
    employee_id: int
    request_type: RequestType
    start_date: date
    end_date: date
    total_days: Optional[Decimal] = None
    reason: Optional[str] = None
    notes: Optional[str] = None

# Create Schema
class RequestCreate(RequestBase):
    pass

# Update Schema
class RequestUpdate(BaseModel):
    start_date: Optional[date] = None
    end_date: Optional[date] = None
    total_days: Optional[Decimal] = None
    reason: Optional[str] = None
    notes: Optional[str] = None

# Response Schema
class RequestResponse(RequestBase):
    id: int
    status: RequestStatus
    approved_by: Optional[int]
    approved_at: Optional[datetime]
    created_at: datetime
    updated_at: Optional[datetime]

# Review Schema
class RequestReview(BaseModel):
    status: RequestStatus
    notes: Optional[str] = None

# Special Request Types (partially implemented)
class IkkikokokuRequest(BaseModel):
    employee_id: int
    start_date: date
    end_date: date
    destination_country: str
    return_flight_date: date
    reason: str
    contact_during_absence: Optional[str] = None
    factory_notified: bool = False

class TaishaRequest(BaseModel):
    employee_id: int
    resignation_date: date
    last_working_day: date
    reason: str
    return_to_country: bool
    forwarding_address: Optional[str] = None
    final_payment_method: Optional[str] = None
```

### 1.7 FRONTEND TYPE DEFINITIONS

**File:** `frontend/types/api.ts`

```typescript
export enum RequestType {
  YUKYU = 'yukyu',
  HANKYU = 'hankyu',
  IKKIKOKOKU = 'ikkikokoku',
  TAISHA = 'taisha',
}

export enum RequestStatus {
  PENDING = 'pending',
  APPROVED = 'approved',
  REJECTED = 'rejected',
}

export interface Request {
  id: number;
  employee_id: number;
  type: RequestType;
  status: RequestStatus;
  start_date: string;
  end_date?: string;
  reason?: string;
  created_at: string;
  updated_at?: string;
  [key: string]: any;
}

export interface RequestCreateData {
  employee_id: number;
  type: RequestType;
  start_date: string;
  end_date?: string;
  reason?: string;
}

export interface RequestListParams extends PaginationParams {
  employee_id?: number;
  type?: RequestType;
  status?: RequestStatus;
  date_from?: string;
  date_to?: string;
}
```

### 1.8 FRONTEND API CLIENT

**File:** `frontend/lib/api.ts`

```typescript
export const requestService = {
  getRequests: async <T = Request[]>(params?: RequestListParams): Promise<T> => {
    const response = await api.get<T>('/requests/', { params });
    return response.data;
  },

  getRequest: async <T = Request>(id: string | number): Promise<T> => {
    const response = await api.get<T>(`/requests/${id}/`);
    return response.data;
  },

  createRequest: async (data: RequestCreateData): Promise<Request> => {
    const response = await api.post<Request>('/requests/', data);
    return response.data;
  },

  approveRequest: async (id: string | number): Promise<Request> => {
    const response = await api.post<Request>(`/requests/${id}/approve/`);
    return response.data;
  },

  rejectRequest: async (id: string | number, reason: string): Promise<Request> => {
    const response = await api.post<Request>(`/requests/${id}/reject/`, { reason });
    return response.data;
  }
};
```

### 1.9 FRONTEND PAGES

**Main Page:** `frontend/app/(dashboard)/requests/page.tsx`

#### Features:
- Search by employee name/ID
- Filter by request type (yukyu, hankyu, ikkikokoku, taisha)
- Filter by status (pending, approved, rejected)
- Summary cards showing counts by status
- Pagination (20 items per page)
- Display request details (date range, reason, notes)
- Show approval date and reviewer notes if already reviewed

#### UI Components Used:
- Heroicons for icons
- Tailwind CSS for styling
- React Query for data fetching
- Custom colors for request types:
  - yukyu: blue
  - hankyu: green
  - ikkikokoku: purple
  - taisha: red

**No Request Detail Page** - Requests are only viewed in list format (no [id]/page.tsx)

### 1.10 CURRENT GAPS FOR 入社連絡票 IMPLEMENTATION

| Issue | Impact | Severity |
|-------|--------|----------|
| No RequestType.NYUUSHA or SHINSHOKUDORI | Can't create new hire requests | HIGH |
| No link between Candidate and Request tables | Can't track which candidate created the request | HIGH |
| No automatic request creation on candidate approval | Manual workflow required | MEDIUM |
| No "完了" (completed) status | Completed requests stay in APPROVED indefinitely | LOW |
| No Request detail page | Can't view individual requests separately | LOW |

---

## PART 2: YUKYU (PAID VACATION) SYSTEM

**Status:** Separate, more sophisticated system for paid vacation management
**Files:**
- Models: `YukyuBalance`, `YukyuRequest`, `YukyuUsageDetail` (models.py)
- API: `backend/app/api/yukyu.py`
- Service: `backend/app/services/yukyu_service.py`
- Frontend: `frontend/app/(dashboard)/yukyu-requests/page.tsx`

**Note:** This is more complex and tracks:
- Fiscal year allocations
- Expiration dates (2-year window)
- LIFO deduction (newest balances used first)
- Usage details per day
- Much more sophisticated approval workflow

**Key Difference:** Yukyu is tracked in detail per fiscal year. Generic requests don't have this level of detail.

---

## PART 3: CANDIDATE APPROVAL FLOW

**Current Flow:**
```
Candidate (status=pending)
    ↓
[Admin Reviews] → /api/candidates/{id}/evaluate (quick_evaluate_candidate)
    ↓
Candidate (status=approved) OR Candidate (status=pending/rejected)
    ↓
[Optional] Create Employee manually via /api/employees/
    ↓
Employee (派遣元社員) created with rirekisho_id link
```

**Candidate Approval Endpoints:**
- `POST /api/candidates/{id}/evaluate` - Quick thumbs up/down
- `POST /api/candidates/{id}/approve` - Full approval
- `POST /api/candidates/{id}/reject` - Rejection

**Current:** No automatic Request creation on candidate approval.

---

## PART 4: ROUTER REGISTRATION

**Main App File:** `backend/app/main.py`

```python
app.include_router(requests.router, prefix="/api/requests", tags=["Requests"])
app.include_router(yukyu.router, prefix="/api/yukyu", tags=["Yukyu"])
```

---

## IMPLEMENTATION ROADMAP FOR 入社連絡票

### Step 1: Extend RequestType Enum
```python
class RequestType(str, enum.Enum):
    YUKYU = "yukyu"
    HANKYU = "hankyu"
    IKKIKOKOKU = "ikkikokoku"
    TAISHA = "taisha"
    NYUUSHA = "nyuusha"  # ← NEW: 入社連絡票 (New hire notification)
```

### Step 2: Add Candidate-Request Relationship
```python
# In Request model:
candidate_id = Column(Integer, ForeignKey("candidates.id"))
candidate = relationship("Candidate", backref="requests")

# In Candidate model:
requests = relationship("Request", back_populates="candidate")
```

### Step 3: Create New Request on Candidate Approval
In `backend/app/services/candidate_service.py`:
```python
async def approve_candidate(self, candidate_id: int, ...):
    # ... existing approval logic ...
    
    # Create new hire notification request
    if not candidate.hire_date:
        candidate.hire_date = date.today()
    
    nyuusha_request = Request(
        candidate_id=candidate.id,
        request_type=RequestType.NYUUSHA,
        status=RequestStatus.PENDING,
        start_date=candidate.hire_date,
        end_date=candidate.hire_date,  # Single day
        reason="新しい入社者: " + candidate.full_name_kanji
    )
    db.add(nyuusha_request)
    db.commit()
```

### Step 4: Update Frontend Types
```typescript
export enum RequestType {
  YUKYU = 'yukyu',
  HANKYU = 'hankyu',
  IKKIKOKOKU = 'ikkikokoku',
  TAISHA = 'taisha',
  NYUUSHA = 'nyuusha',  // ← NEW
}
```

### Step 5: Update Frontend UI
- Add NYUUSHA badge styling (e.g., gold/orange color)
- Display "新規採用" label
- Show candidate name and hire date
- Link to candidate profile for more details

---

## SUMMARY TABLE

| Aspect | Value |
|--------|-------|
| **Total Requests Table** | `requests` (1 table) |
| **Total Fields** | 12 (id, hakenmoto_id, request_type, status, dates, reason, notes, approval info, timestamps) |
| **Request Types Supported** | 4 (yukyu, hankyu, ikkikokoku, taisha) |
| **Status Options** | 3 (pending, approved, rejected) |
| **Total API Endpoints** | 7 (/requests GET/POST, /{id} GET/PUT/DELETE, /{id}/review POST, /{id}/approve POST, /{id}/reject POST) |
| **Frontend Pages** | 1 (/requests list only, no detail page) |
| **Relationships to Candidates** | NONE (major gap) |
| **Automatic Creation** | NO (must be manual) |
| **Completed Status** | NO (no archive/完了 state) |

---

## FILES TO MODIFY FOR 入社連絡票

### Backend:
1. `backend/app/models/models.py` - Add candidate_id FK and relationship
2. `backend/app/schemas/request.py` - Add NYUUSHA schema
3. `backend/app/api/requests.py` - Add filtering by candidate (optional)
4. `backend/app/services/candidate_service.py` - Add auto-creation on approval

### Frontend:
1. `frontend/types/api.ts` - Add NYUUSHA type
2. `frontend/app/(dashboard)/requests/page.tsx` - Update UI for new type
3. `frontend/lib/api.ts` - (No changes needed, generic service covers it)

---

**End of Documentation**
