# UNS-ClaudeJP 5.4.1 - COMPLETE INFRASTRUCTURE MAP

> **FOR ALL AI AGENTS**: This is your master reference guide to understand where everything is, how it works, and where to fix things.

## 🎯 QUICK NAVIGATION

| What You Need | Where to Look |
|---------------|----|
| **API broken?** | → See "API ENDPOINT MAP" + "SERVICE FAILURE DIAGNOSIS" |
| **Frontend not rendering?** | → See "FRONTEND STRUCTURE" + "COMPONENT ARCHITECTURE" |
| **Database issue?** | → See "DATABASE SCHEMA" + "DATA FLOW DIAGRAM" |
| **Service won't start?** | → See "DOCKER SERVICES" + "DEPENDENCY CHAIN" |
| **Don't know where to fix something?** | → See "FAILURE POINTS" section |

---

## 📍 PROJECT ROOT STRUCTURE

```
/home/user/UNS-ClaudeJP-5.4.1/
├── .claude/                          # Agent orchestration (DO NOT MODIFY)
│   ├── INFRASTRUCTURE_MAP.md          # ← YOU ARE HERE
│   ├── agents.json                    # Agent configs
│   ├── CLAUDE.md                      # Orchestration rules
│   └── [other-configs]
│
├── backend/                           # FastAPI application
│   ├── app/
│   │   ├── api/                       # 26 routers, 200+ endpoints (SEE API MAP BELOW)
│   │   ├── models/models.py           # 31 tables (1466 lines) - PROTECTED
│   │   ├── schemas/                   # Pydantic validation models
│   │   ├── services/                  # Business logic separated by domain
│   │   ├── core/
│   │   │   ├── security.py            # JWT, password hashing
│   │   │   ├── database.py            # SQLAlchemy engine setup
│   │   │   ├── config.py              # Environment variables
│   │   │   └── deps.py                # Dependency injection
│   │   └── main.py                    # FastAPI app factory
│   ├── alembic/
│   │   └── versions/                  # 19 database migration files
│   ├── scripts/                       # Data management and utilities
│   │   ├── create_admin_user.py       # Initialize admin account
│   │   ├── import_data.py             # Bulk employee import
│   │   ├── import_candidates_improved.py
│   │   └── [10+ other scripts]
│   ├── requirements.txt                # 95 locked Python dependencies
│   └── tests/                         # Pytest test suite
│
├── frontend/                          # Next.js 16 application
│   ├── app/
│   │   ├── (dashboard)/
│   │   │   ├── layout.tsx             # Dashboard shell layout
│   │   │   ├── [47+ page folders]     # SEE FRONTEND MAP BELOW
│   │   │   └── page.tsx               # Main dashboard page
│   │   └── [other-routes]
│   ├── components/                    # 167 React components
│   │   ├── ui/                        # Shadcn/ui components (Radix UI)
│   │   └── [feature-components]
│   ├── lib/
│   │   ├── api.ts                     # Axios client with JWT interceptor
│   │   ├── themes.ts                  # 12 + custom themes
│   │   └── [utilities]
│   ├── stores/                        # Zustand state management
│   ├── contexts/                      # React Context API
│   ├── hooks/                         # Custom React hooks
│   ├── package.json                   # 79 locked dependencies
│   └── next.config.js
│
├── docker/                            # Docker service configurations
│   ├── backend.dockerfile
│   ├── frontend.dockerfile
│   ├── nginx.conf
│   ├── prometheus.yml
│   ├── grafana-datasources.yml
│   └── [other-configs]
│
├── docker-compose.yml                 # 12 services orchestration (PROTECTED)
├── .env                               # Environment variables (SECRETS)
├── .env.example                       # Template (check for reference)
├── CLAUDE.md                          # Development guide
└── scripts/                           # Windows batch automation
    ├── START.bat                      # Start all services
    ├── STOP.bat                       # Stop all services
    ├── LOGS.bat                       # View logs
    └── [150+ other scripts]           # Database backup, health checks, etc
```

---

## 🏗️ SERVICE ARCHITECTURE (12 Docker Services)

### CORE SERVICES (6)

#### 1. **db** - PostgreSQL 15
- **Port**: 5432
- **Purpose**: Data persistence for entire app
- **Files**:
  - `docker-compose.yml` line ~50-80
  - Data path: `/var/lib/postgresql/data` (volume: `postgres_data`)
  - Initialization: `/docker-entrypoint-initdb.d/01_init_database.sql`
- **Health Check**: `pg_isready -U uns_admin` (10s interval, 10 retries)
- **Credentials**: `un_admin` / `un_password` (check `.env`)
- **Failure Signs**:
  - Backend logs: `connection refused: 5432`
  - Solution: `docker compose ps db` → ensure `healthy` status

#### 2. **redis** - Redis 7 (Cache)
- **Port**: 6379
- **Purpose**: Session caching, temporary data
- **Files**:
  - `docker-compose.yml` line ~81-100
  - Data path: `/data` (volume: `redis_data`)
- **Health Check**: `redis-cli ping` (10s, 5 retries)
- **Failure Signs**: Backend logs mention `redis` timeouts
  - Solution: `docker compose restart redis`

#### 3. **importer** - Data Initialization
- **Port**: None (one-time service)
- **Purpose**: Seeds admin user, runs migrations, imports demo data
- **Files**:
  - `docker-compose.yml` line ~101-130
  - Scripts: `backend/scripts/create_admin_user.py`, `manage_db.py`
- **Runs**: Only on initial `docker compose up`
- **Failure Signs**: Admin user missing, migrations not applied
  - Solution: `docker compose up importer` or reset `docker compose down -v`

#### 4. **backend** - FastAPI 0.115.6
- **Port**: 8000 (internal), via nginx at :80
- **Purpose**: REST API for all operations
- **Main File**: `/backend/app/main.py`
- **Routes**: See "API ENDPOINT MAP" below
- **Health Check**: `/api/health` (30s, 3 retries, 40s timeout)
- **Failure Signs**:
  - 500 errors in logs
  - Can't connect to database
  - Solution: `docker compose logs backend | tail -50`

#### 5. **frontend** - Next.js 16
- **Port**: 3000
- **Purpose**: React UI for users
- **Main File**: `/frontend/app/(dashboard)/layout.tsx`
- **Health Check**: HTTP GET `/api/health` (30s, 3 retries)
- **Failure Signs**:
  - Blank white page
  - TypeScript errors
  - Solution: `docker compose logs frontend | tail -50`

#### 6. **adminer** - Database UI
- **Port**: 8080
- **Purpose**: Web interface to browse/edit database
- **URL**: http://localhost:8080
- **Files**: `docker-compose.yml` line ~150

### OBSERVABILITY STACK (4) - Added in v5.6.0

#### 7. **otel-collector** - OpenTelemetry
- **Purpose**: Collects traces, metrics, logs from backend/frontend
- **Ports**: 4317 (gRPC), 4318 (HTTP)

#### 8. **tempo** - Grafana Tempo (Tracing)
- **Port**: 3200
- **Purpose**: Store and query distributed traces

#### 9. **prometheus** - Metrics Storage
- **Port**: 9090
- **Purpose**: Scrape and store metrics
- **URL**: http://localhost:9090

#### 10. **grafana** - Observability Dashboards
- **Port**: 3001 (mapped from 3000 inside container)
- **URL**: http://localhost:3001
- **Credentials**: `admin` / `admin` (configurable)

### INFRASTRUCTURE SERVICES (2)

#### 11. **nginx** - Reverse Proxy
- **Ports**: 80 (HTTP), 443 (HTTPS)
- **Purpose**: Route requests, load balancing
- **Config**: `docker/nginx.conf`
- **Routes**:
  - `/api/*` → backend services
  - `/` → frontend application

#### 12. **backup** - Automated Backups
- **Purpose**: Daily PostgreSQL backups
- **Config**: `.env` variables `BACKUP_TIME`, `BACKUP_RETENTION_DAYS`
- **Location**: `./backups/` directory

---

## 🔌 API ENDPOINT MAP (200+ endpoints across 26 routers)

### Router Locations & Purposes

| Router | Path | Endpoints | Key Files |
|--------|------|-----------|-----------|
| **auth** | `/api/auth/` | login, logout, refresh, register | `backend/app/api/auth.py` |
| **candidates** | `/api/candidates/` | CRUD, upload OCR docs, list | `backend/app/api/candidates.py` |
| **employees** | `/api/employees/` | CRUD, assignments, status | `backend/app/api/employees.py` |
| **factories** | `/api/factories/` | CRUD client sites | `backend/app/api/factories.py` |
| **timer_cards** | `/api/timer_cards/` | Attendance tracking | `backend/app/api/timer_cards.py` |
| **payroll** | `/api/payroll/` | Salary calculations | `backend/app/api/payroll.py` |
| **requests** | `/api/requests/` | Leave, vacation workflows | `backend/app/api/requests.py` |
| **dashboard** | `/api/dashboard/` | Analytics, stats, reports | `backend/app/api/dashboard.py` |
| **azure_ocr** | `/api/azure_ocr/` | Document OCR processing | `backend/app/api/azure_ocr.py` |
| **[19+ more]** | ... | ... | See full list in `/backend/app/api/` |

### Common Endpoint Patterns

```python
# Pattern used throughout backend
GET    /api/resource/              # List all
GET    /api/resource/{id}          # Get one
POST   /api/resource/              # Create
PUT    /api/resource/{id}          # Update full
PATCH  /api/resource/{id}          # Update partial
DELETE /api/resource/{id}          # Delete

# Authentication requirement
All endpoints except /api/auth/* require JWT token in header:
Authorization: Bearer <token>
```

### Key Endpoints for Debugging

| What You Need | Endpoint | Method | Notes |
|---------------|----------|--------|-------|
| User login | `/api/auth/login` | POST | Returns JWT token |
| List candidates | `/api/candidates/` | GET | Paginated, filterable |
| Get candidate details | `/api/candidates/{id}` | GET | Full data + OCR results |
| Submit time card | `/api/timer_cards/` | POST | Requires factory_id, date |
| Calculate payroll | `/api/payroll/calculate` | POST | Complex calculations |
| Backend health | `/api/health` | GET | Docker health check |

---

## 📊 DATABASE SCHEMA (31 Tables)

### Critical Tables

| Table | Purpose | Key Fields | Relationships |
|-------|---------|-----------|-----------------|
| **users** | Login accounts | id, username, email, password_hash, role | ← employees, audit_log |
| **candidates** | Job applicants (履歴書) | id, full_name, email, phone, rirekisho_data | → employees |
| **employees** | Active workers (派遣社員) | id, rirekisho_id, factory_id, apartment_id, status | ← candidates, → factories, apartments |
| **factories** | Client sites (派遣先) | id, name, address, contact | ← employees |
| **apartments** | Housing | id, address, capacity, available | ← employees |
| **timer_cards** | Attendance (タイムカード) | id, employee_id, date, check_in, check_out | ← employees |
| **salary_calculations** | Payroll (給与) | id, employee_id, month, gross_salary, deductions | ← employees |
| **documents** | Stored files | id, candidate_id, type, ocr_data, file_path | ← candidates |
| **contracts** | Employment contracts | id, employee_id, start_date, end_date | ← employees |
| **requests** | Leave requests (申請) | id, employee_id, type, status, dates | ← employees |
| **audit_log** | Change tracking | id, user_id, table_name, action, old_value, new_value | ← users |
| [21+ more tables] | ... | ... | ... |

### Schema Diagram

```
users
  ↓
  ├─→ candidates → documents (OCR data)
  │   ↓
  │   employees
  │   ├─→ factories
  │   ├─→ apartments
  │   ├─→ timer_cards
  │   ├─→ salary_calculations
  │   ├─→ contracts
  │   └─→ requests (leave)
  │
  └─→ audit_log (tracks all changes)
```

### Database Files

- **Models definition**: `/backend/app/models/models.py` (1466 lines)
- **Database engine**: `/backend/app/core/database.py`
- **Migrations**: `/backend/alembic/versions/` (19 migration files)
- **Connection string**: `.env` → `DATABASE_URL`

### Common Database Issues & Fixes

| Problem | Root Cause | Solution |
|---------|-----------|----------|
| `Foreign key violation` | Deleting parent before children | Check cascade rules in models.py |
| `Column not found` | Missing migration | `docker exec backend alembic upgrade head` |
| `Duplicate key error` | Unique constraint violation | Check constraints in `models/models.py` |
| `Connection refused` | DB not ready | `docker compose ps db` (wait for healthy) |
| `Deadlock detected` | Concurrent transactions | Retry or increase timeout |

---

## 🎨 FRONTEND STRUCTURE (47+ Pages, 167 Components)

### Page Organization

```
frontend/app/(dashboard)/
├── page.tsx                          # Home/dashboard
├── candidates/
│   ├── page.tsx                      # List candidates
│   ├── [id]/page.tsx                 # View candidate details
│   └── create/page.tsx               # Create new candidate
├── employees/
│   ├── page.tsx                      # List employees
│   ├── [id]/page.tsx                 # View employee details
│   └── [10+ sub-pages]
├── factories/
│   └── [similar structure]
├── timercards/
│   └── [time card management]
├── payroll/
│   └── [salary calculations]
├── requests/
│   └── [leave management]
├── [12+ more page folders]
└── layout.tsx                        # Dashboard layout shell
```

### Component Architecture

```
frontend/components/
├── ui/                               # Shadcn/ui (Radix UI based)
│   ├── button.tsx
│   ├── dialog.tsx
│   ├── table.tsx
│   ├── form.tsx
│   ├── input.tsx
│   └── [20+ UI components]
├── candidates/                       # Candidate feature components
│   ├── candidate-list.tsx            # List with filters
│   ├── candidate-form.tsx            # Create/edit form
│   ├── candidate-details.tsx         # View details
│   └── ocr-processor.tsx             # Document OCR handler
├── employees/                        # Employee feature components
├── factories/
├── payroll/
├── [other features]
└── layout/                           # Layout components
    ├── navbar.tsx                    # Top navigation
    ├── sidebar.tsx                   # Left sidebar
    └── footer.tsx                    # Footer
```

### Frontend Data Flow

```
Page Component (app/(dashboard)/candidates/page.tsx)
    ↓
    calls API via lib/api.ts (Axios)
    ↓
Backend returns JSON
    ↓
useQuery() or useState() (React Query / Zustand)
    ↓
Components render with data
    ↓
User interactions
    ↓
POST/PUT/DELETE to API
    ↓
Update local state (Zustand store)
    ↓
Component re-renders
```

### Key Frontend Files

| File | Purpose |
|------|---------|
| `frontend/lib/api.ts` | Axios instance, all API calls, JWT interceptor |
| `frontend/lib/themes.ts` | 12 predefined + custom theme definitions |
| `frontend/stores/*.ts` | Zustand stores (candidates, employees, ui state) |
| `frontend/contexts/*.tsx` | React Contexts (auth, theme) |
| `frontend/hooks/*.ts` | Custom hooks (useAuth, useFetch, etc) |
| `frontend/package.json` | Dependencies (React 19, Next.js 16, TypeScript 5.6) |

### Theme System

- **Definitions**: `frontend/lib/themes.ts`
- **Themes**: 12 predefined + unlimited custom
- **Examples**: default-light, default-dark, uns-kikaku, ocean-blue, royal-purple, etc.
- **Theme Switcher**: `frontend/app/(dashboard)/themes/customizer/page.tsx`

---

## 🔐 AUTHENTICATION & SECURITY

### JWT Flow

```
1. User POSTs username/password to /api/auth/login
2. Backend validates, generates JWT token
3. Frontend stores in localStorage
4. Every API request: Authorization: Bearer <token>
5. Backend validates token via dependency injection
6. If token expired: /api/auth/refresh gets new token
7. If invalid: 401 Unauthorized
```

### Files

- **Backend auth**: `/backend/app/api/auth.py`
- **JWT logic**: `/backend/app/core/security.py`
- **Dependency injection**: `/backend/app/core/deps.py` → `get_current_user`
- **Frontend auth**: `frontend/contexts/auth.tsx`
- **Token storage**: `localStorage.getItem('token')`

### Role-Based Access Control (RBAC)

```
Roles (in order of privilege):
SUPER_ADMIN > ADMIN > COORDINATOR > KANRININSHA > EMPLOYEE > CONTRACT_WORKER
```

- **Backend enforcement**: Each endpoint has `Depends(get_current_user)`
- **Role checks**: `/backend/app/core/security.py` → `check_role`
- **Frontend guards**: `frontend/components/layout/auth-guard.tsx`

---

## 🚨 FAILURE POINTS & DEBUGGING GUIDE

### Common Failures & Where to Look

#### 1. **"Cannot connect to database" Error**

**Diagnosis Steps**:
1. Check DB is running: `docker compose ps db`
2. If not running: `docker compose up db`
3. If running but unhealthy: `docker compose logs db | tail -20`
4. Verify credentials in `.env` file
5. Check if migrations applied: `docker exec backend alembic current`

**Fix**:
```bash
# If fresh start
docker compose down -v
docker compose up -d

# If migrations stuck
docker exec backend alembic upgrade head
```

#### 2. **"401 Unauthorized" on API calls**

**Diagnosis Steps**:
1. Is JWT token in localStorage? Check DevTools → Application → localStorage
2. Is token expired? Calculate expiration from token
3. Is Authorization header being sent? Check DevTools → Network tab

**Files to Check**:
- Frontend: `frontend/lib/api.ts` (JWT interceptor)
- Backend: `/backend/app/core/deps.py` (get_current_user)
- Backend: `/backend/app/core/security.py` (verify_token)

**Fix**:
```bash
# Manually test token
curl -H "Authorization: Bearer <token>" http://localhost:8000/api/health

# Reset admin user if needed
docker exec backend python scripts/create_admin_user.py
```

#### 3. **Frontend Blank Page**

**Diagnosis Steps**:
1. Check browser console (F12 → Console) for JS errors
2. Check frontend logs: `docker compose logs frontend | tail -50`
3. Check network tab for failed API requests
4. Clear cache: Ctrl+Shift+Delete in browser

**Common Causes**:
- API not responding (check backend)
- TypeScript compilation error (check logs)
- Theme not loading properly
- Invalid route/page doesn't exist

**Files to Check**:
- Page file: `/frontend/app/(dashboard)/[requested-page]/page.tsx`
- Layout: `/frontend/app/(dashboard)/layout.tsx`
- Theme context: `frontend/contexts/theme.tsx`

#### 4. **"Port Already in Use" Error**

**Problem**: Port 3000, 8000, 5432, etc. already in use

**Fix**:
```bash
# Windows
netstat -ano | findstr :3000
taskkill /PID <PID> /F

# Linux
lsof -i :3000
kill -9 <PID>

# Or just restart Docker
docker compose down
docker compose up -d
```

#### 5. **OCR Processing Failed**

**Diagnosis Steps**:
1. Check Azure credentials in `.env`: `AZURE_VISION_KEY`, `AZURE_VISION_ENDPOINT`
2. Check file size (max 4MB for most OCR)
3. Check file format (JPG, PNG supported)

**Files to Check**:
- Backend OCR router: `/backend/app/api/azure_ocr.py`
- Hybrid OCR service: `/backend/app/services/hybrid_ocr.py`
- Models for OCR data: `/backend/app/models/models.py` → `Document` table

**Cascade**: Azure → EasyOCR → Tesseract (order matters!)

#### 6. **Database Migration Failed**

**Problem**: "Alembic migration failed" or "Column not found"

**Diagnosis Steps**:
1. Check current migration: `docker exec backend alembic current`
2. Check migration history: `docker exec backend alembic history`
3. View migration file: `/backend/alembic/versions/[migration_id]_*.py`

**Files to Check**:
- Current models: `/backend/app/models/models.py`
- Migration versions: `/backend/alembic/versions/`

**Fix**:
```bash
# Upgrade to latest
docker exec backend alembic upgrade head

# Downgrade one version if needed
docker exec backend alembic downgrade -1

# Create new migration
docker exec backend alembic revision --autogenerate -m "description"
```

#### 7. **Service Won't Start (Docker)**

**Common Causes**:
- Port conflict
- Volume permission issue
- Out of disk space
- Missing environment variable

**Diagnosis**:
```bash
docker compose logs [service-name] | tail -50
```

**Common Issues by Service**:

| Service | Common Problem | Solution |
|---------|---|---|
| backend | Module import error | `pip install -r requirements.txt` |
| frontend | Node module missing | `npm install` |
| db | Permission denied | `docker compose down -v && docker compose up` |
| redis | Connection refused | Restart: `docker compose restart redis` |
| nginx | Port 80 in use | Change port in docker-compose.yml |

#### 8. **Performance/Slow Queries**

**Diagnosis**:
1. Check database logs: `docker compose logs db | grep slow`
2. Check Prometheus: http://localhost:9090 (query metrics)
3. Check Grafana: http://localhost:3001 (view dashboards)

**Files to Check**:
- Query optimization: `/backend/app/services/` (all services)
- Database config: `/backend/app/core/database.py`
- ORM models: `/backend/app/models/models.py`

---

## 🔄 DATA FLOW DIAGRAMS

### User Login Flow

```
User enters username/password
    ↓ (POST /api/auth/login)
Backend validates against DB
    ↓
Generate JWT token
    ↓
Return token to frontend
    ↓
Frontend stores in localStorage
    ↓
Frontend stores in Zustand store
    ↓
Frontend redirects to /dashboard
```

### Create Candidate Flow

```
Frontend form submission
    ↓ (POST /api/candidates/)
Backend validates with Pydantic schema
    ↓
Backend saves to candidates table
    ↓ (File upload for rirekisho/resume)
Frontend sends OCR request (POST /api/azure_ocr/)
    ↓
Backend processes OCR (Azure → EasyOCR → Tesseract)
    ↓
Saves OCR results to documents table
    ↓
Returns JSON with extracted fields
    ↓
Frontend updates component state
    ↓
User sees results
```

### Payroll Calculation Flow

```
User triggers payroll (POST /api/payroll/calculate)
    ↓
Backend fetches employee data + timer cards
    ↓
Calculate gross salary from hours worked
    ↓
Apply deductions (taxes, insurance, etc)
    ↓
Save to salary_calculations table
    ↓
Generate PDF report
    ↓
Return to frontend
    ↓
User can download/email
```

---

## 📦 DEPENDENCIES & VERSIONS (LOCKED - DO NOT CHANGE)

### Backend (Python 3.11+)

**Critical Dependencies** (see `/backend/requirements.txt` for all 95):

| Package | Version | Purpose | Notes |
|---------|---------|---------|-------|
| fastapi | 0.115.6 | Web framework | Core API |
| sqlalchemy | 2.0.36 | ORM | Database queries |
| pydantic | 2.10.5 | Data validation | Schema validation |
| psycopg2-binary | 2.9.12 | PostgreSQL driver | DB connection |
| alembic | 1.17.0 | Migrations | Schema versioning |
| python-jose | 0.3.3 | JWT tokens | Authentication |
| passlib | 1.7.4 | Password hashing | Security |
| python-multipart | 0.0.7 | Form handling | File uploads |
| requests | 2.32.3 | HTTP client | API calls |
| pillow | 11.0.0 | Image processing | OCR input |
| azure-ai-vision | Latest | Azure OCR | Document processing |
| easyocr | Latest | EasyOCR fallback | Text extraction |
| pytesseract | Latest | Tesseract fallback | Text extraction |

### Frontend (Node.js LTS)

**Critical Dependencies** (see `/frontend/package.json` for all 79):

| Package | Version | Purpose | Notes |
|---------|---------|---------|-------|
| next | 16.0.0 | Framework | App Router |
| react | 19.0.0 | UI library | Components |
| typescript | 5.6 | Type safety | All .tsx files |
| tailwindcss | 3.4 | Styling | CSS utilities |
| zustand | Latest | State management | UI state |
| react-query | Latest | Data fetching | Server state caching |
| axios | Latest | HTTP client | API calls |
| zod | Latest | Schema validation | Form validation |
| shadcn/ui | Latest | Component library | Pre-built UI |
| radix-ui | Latest | Base components | Accessibility |

### ⚠️ Version Lock Policy

**NEVER change these versions without explicit permission**:
- Python 3.11
- PostgreSQL 15
- FastAPI 0.115.6
- SQLAlchemy 2.0.36
- Next.js 16.0.0
- React 19.0.0
- TypeScript 5.6
- Tailwind CSS 3.4

**If you need to update**:
1. STOP - Do not proceed
2. Ask user for permission
3. Justify why it's necessary
4. Wait for explicit approval

---

## 🛡️ PROTECTED FILES & DIRECTORIES

**DO NOT MODIFY** unless instructed:

```
PROTECTED:
├── docker-compose.yml              # Service orchestration
├── .env (structure)                # Secrets and config keys
├── backend/alembic/versions/       # Migration history
├── backend/app/models/models.py    # 31 table definitions
├── backend/requirements.txt         # Dependency versions
├── frontend/package.json            # Dependency versions
├── frontend/package-lock.json       # Dependency lock file
├── scripts/*.bat                    # Windows automation (DO NOT MODIFY)
├── .claude/                         # Agent system (DO NOT MODIFY)
├── docker/                          # Service configurations
└── docker-compose.yml               # Service dependencies
```

---

## 🚀 QUICK REFERENCE COMMANDS

### Starting Everything

```bash
# From project root
cd scripts
START.bat                            # Windows

# Or Linux/macOS
python generate_env.py
docker compose up -d
```

### Debugging Specific Service

```bash
# View logs
docker compose logs -f [service-name]

# Real-time logs for backend
docker compose logs -f backend | tail -50

# Check service health
docker compose ps

# Restart specific service
docker compose restart backend

# Enter backend container
docker exec -it uns-claudejp-backend bash

# Enter database
docker exec -it uns-claudejp-db psql -U uns_admin -d uns_claudejp
```

### Database Operations

```bash
# Apply migrations
docker exec backend alembic upgrade head

# Create admin user
docker exec backend python scripts/create_admin_user.py

# Import demo data
docker exec backend python scripts/import_data.py

# Database backup
docker exec uns-claudejp-db pg_dump -U uns_admin uns_claudejp > backup.sql

# Database restore
cat backup.sql | docker exec -i uns-claudejp-db psql -U uns_admin uns_claudejp
```

### Frontend/Backend Development

```bash
# Type checking
docker exec frontend npm run type-check

# Linting
docker exec frontend npm run lint

# Backend tests
docker exec backend pytest -v

# Frontend tests
docker exec frontend npm test
```

---

## 🎯 WHERE TO FIX WHAT

### By Component Type

| Component | Location | File Pattern | Common Issues |
|-----------|----------|--------------|---------------|
| **API Endpoint** | `backend/app/api/` | `*.py` routers | Missing route, 500 error |
| **Database Query** | `backend/app/models/` | `models.py` | Foreign key, constraint |
| **Business Logic** | `backend/app/services/` | `*.py` services | Wrong calculation, logic error |
| **Data Validation** | `backend/app/schemas/` | `*.py` schemas | Invalid data format |
| **Page/Component** | `frontend/app/` or `frontend/components/` | `*.tsx` | Blank page, styling issue |
| **API Client** | `frontend/lib/api.ts` | Single file | JWT expired, headers |
| **State Management** | `frontend/stores/` | `*.ts` | State not updating |
| **Theme/Styling** | `frontend/lib/themes.ts` | Single file | Colors not applying |
| **Database Schema** | `backend/app/models/models.py` | Single file | Column missing |
| **Migrations** | `backend/alembic/versions/` | `*.py` migration files | Schema mismatch |
| **Docker Service** | `docker-compose.yml` | Single file | Service won't start |
| **Configuration** | `.env` | Single file | Missing credentials |

### By Error Type

| Error Message | Where to Look | What to Check |
|---------------|---|---|
| `404 Not Found` | Frontend route + Backend router | Page file exists? Route registered? |
| `401 Unauthorized` | `frontend/lib/api.ts` + `/backend/app/core/deps.py` | Token valid? Header set? |
| `500 Internal Server Error` | `docker compose logs backend` | Check exception traceback |
| `Connection refused` | `docker compose ps` | Is service running and healthy? |
| `ValidationError` | `backend/app/schemas/` | Schema matches? Required fields? |
| `ForeignKeyError` | `/backend/app/models/models.py` | Parent exists? Cascade correct? |
| `Module not found` | `backend/requirements.txt` or `frontend/package.json` | Dependency installed? Version correct? |
| `TypeScript error` | Frontend component file | Type annotations correct? |
| `Blank page` | Browser console (F12) | Check console for JS errors |
| `Slow query` | Prometheus/Grafana | Check query time metrics |

---

## 📈 MONITORING & OBSERVABILITY

### Access URLs

| Tool | URL | Purpose |
|------|-----|---------|
| **Grafana** | http://localhost:3001 | Dashboards (admin/admin) |
| **Prometheus** | http://localhost:9090 | Metrics queries |
| **Tempo** | http://localhost:3200 | Trace viewing |
| **API Docs** | http://localhost:8000/api/docs | Swagger UI |
| **Adminer** | http://localhost:8080 | Database UI |
| **Metrics Export** | http://localhost:8000/metrics | Prometheus metrics |

### Useful Queries

```promql
# Request rate (per second)
rate(http_requests_total[1m])

# Response time (milliseconds)
histogram_quantile(0.95, http_request_duration_seconds)

# Error rate
rate(http_requests_total{status=~"5.."}[1m])

# Database connection pool
pg_stat_activity_count

# Backend response time
rate(http_request_duration_seconds[5m])
```

---

## 📚 IMPORTANT REFERENCE DOCUMENTS

**In this project**:
- `/CLAUDE.md` - Development guide
- `/PROMPT_RECONSTRUCCION_COMPLETO.md` - Complete spec (25,000+ words)
- `/docs/` - Architecture, guides, troubleshooting
- `.cursorrules` - Rules for all AI assistants
- `AI_RULES.md` - Universal rules

**For agents**:
- **This file** (`INFRASTRUCTURE_MAP.md`) - You are here
- `.claude/CLAUDE.md` - Orchestration system
- `.claude/agents.json` - Agent configurations

---

## 🔍 VERIFICATION CHECKLIST

When something is broken, verify in this order:

- [ ] Service is running: `docker compose ps`
- [ ] Service is healthy: Check status column
- [ ] Logs show actual error: `docker compose logs [service]`
- [ ] Port is not in use: `netstat -ano | findstr :[port]`
- [ ] Environment variables set: Check `.env`
- [ ] Database migrated: `docker exec backend alembic current`
- [ ] No disk space issues: `df -h`
- [ ] No memory issues: `docker stats`
- [ ] Network connectivity: Try curl request
- [ ] Credentials are correct: `.env` values match service requirements

---

## 🎯 AGENT USAGE GUIDE

**You (AI agent) should use this document when**:

1. **Fixing a bug** → Go to "FAILURE POINTS & DEBUGGING GUIDE"
2. **Adding a new endpoint** → Check "API ENDPOINT MAP" for pattern
3. **Modifying database** → See "DATABASE SCHEMA" + check `/backend/app/models/models.py`
4. **Creating new page** → Check "FRONTEND STRUCTURE" for location
5. **Need to understand service flow** → Check "DATA FLOW DIAGRAMS"
6. **Lost about where code is** → Use "QUICK NAVIGATION" at top
7. **Need to restart service** → Check "QUICK REFERENCE COMMANDS"
8. **Debugging error** → Use "WHERE TO FIX WHAT" section

**ALWAYS reference this when**:
- You need to know where a file is
- You don't understand the architecture
- Something breaks and you need to debug
- You're about to modify something

---

**Last Updated**: 2025-11-16
**Version**: UNS-ClaudeJP 5.4.1
**Context Window**: For all AI agents

---

