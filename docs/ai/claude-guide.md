# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

> ℹ️ **Note**: The automated flow described in `.claude/CLAUDE.md` is preserved as historical reference. It's not mandatory for human collaborators; use this file as the source of truth.

---

## 🚀 Quick Start (Development)

### Start Services (Windows)
```bash
cd scripts
START.bat          # Start all services
LOGS.bat           # View logs (interactive menu)
STOP.bat           # Stop services
```

### Start Services (Linux/macOS)
```bash
# Generate .env from .env.example
python generate_env.py

# Start services
docker compose up -d

# View logs
docker compose logs -f

# Stop services
docker compose down
```

### Access URLs
- **Frontend:** http://localhost:3000 (Next.js 16)
- **Backend API (via nginx):** http://localhost/api (Production-like routing)
- **Backend API (direct):** http://localhost:8000 (Development only)
- **API Docs:** http://localhost:8000/api/docs (Swagger)
- **Database UI:** http://localhost:8080 (Adminer)
- **Grafana:** http://localhost:3001 (Observability dashboards)
- **Prometheus:** http://localhost:9090 (Metrics)

**Default Login:** `admin` / `admin123`

---

## 📐 Project Overview

UNS-ClaudeJP 6.0.0 is a comprehensive HR management system for Japanese staffing agencies (人材派遣会社):

- **Backend**: FastAPI 0.115.6 (Python 3.11+) with SQLAlchemy 2.0.36 ORM and PostgreSQL 15
- **Frontend**: Next.js 16.0.0 with React 19.0.0, TypeScript 5.6 and Tailwind CSS 3.4 (App Router)
- **DevOps**: Docker Compose for orchestration

Manages the complete lifecycle of temporary workers: candidates (履歴書/Rirekisho), employees (派遣社員), factories (派遣先), attendance (タイムカード), payroll (給与), and requests (申請).

**Version 6.0.0**: 45+ functional pages across 8 core modules with advanced theming system (23 predefined themes + custom themes), template designer, and professional design tools. Version 6.0.0 includes fixed AI agents router (45 endpoints), 50+ database models, dependency cleanup (17 frontend + 5 backend packages removed), observability stack (OpenTelemetry + Prometheus + Grafana), and 67% reduction in documentation files.

---

## 🔧 Core Development Commands

### Backend (FastAPI + Python 3.11)

```bash
# Access backend container
docker exec -it uns-claudejp-backend bash

# Database migrations
cd /app
alembic upgrade head                    # Apply migrations
alembic revision --autogenerate -m "description"  # Create migration
alembic downgrade -1                    # Rollback one

# Admin & data
python scripts/create_admin_user.py     # Create/reset admin user
python scripts/import_data.py           # Import demo data
python scripts/verify_data.py           # Verify database

# Testing
pytest backend/tests/ -v                # Run tests with verbose
pytest backend/tests/test_auth.py -vs   # Run single test file
pytest -k "test_login" -vs              # Run tests matching pattern
```

**Key Backend Paths:**
- API endpoints: `backend/app/api/*.py` (25 routers with FastAPI dependency injection + AI Agents)
- Database models: `backend/app/models/models.py` (single-file pattern, 50+ models/tables)
- Schemas: `backend/app/schemas/*.py` (Pydantic models for validation)
- Business logic: `backend/app/services/*.py` (separated by domain)
- Core config: `backend/app/core/` (security, database, config)
- Migrations: `backend/alembic/versions/`
- Scripts: `backend/scripts/` (data management, import/export)

**Backend API Structure:**
```python
# Pattern: dependency injection with FastAPI
from fastapi import APIRouter, Depends, HTTPException
from app.core.deps import get_current_user
from app.schemas.candidate import CandidateCreate, CandidateResponse
from app.services.candidate import CandidateService

router = APIRouter(prefix="/candidates", tags=["candidates"])

@router.post("/", response_model=CandidateResponse)
async def create_candidate(
    candidate: CandidateCreate,
    service: CandidateService = Depends(),
    current_user = Depends(get_current_user)
):
    return await service.create(candidate)
```

### Frontend (Next.js 16 + React 19)

```bash
# Access frontend container
docker exec -it uns-claudejp-frontend bash

# Development
npm run dev                              # Dev server (already running)
npm run build                            # Build for production
npm run type-check                       # TypeScript validation
npm run lint                             # ESLint check
npm test                                 # Run unit tests with Vitest
npm run test:e2e                         # Run E2E tests with Playwright

# Dependencies
npm install <package-name>              # Install package
npm list                                # Show dependencies
```

**Key Frontend Paths:**
- Pages: `frontend/app/(dashboard)/*/page.tsx` (45+ pages using Next.js App Router)
- Layouts: `frontend/app/(dashboard)/layout.tsx` (dashboard layout with auth)
- Components: `frontend/components/*.tsx` (shared components, Shadcn/ui pattern)
- UI Library: `frontend/components/ui/*` (Radix UI + Tailwind components)
- Themes: `frontend/lib/themes.ts` (23 predefined + custom theme system)
- API client: `frontend/lib/api.ts` (Axios instance with JWT interceptors)
- State: `frontend/stores/*.ts` (Zustand stores for client state)
- Contexts: `frontend/contexts/*.tsx` (React contexts)
- Hooks: `frontend/hooks/*.ts` (custom React hooks)

**Frontend Architecture Pattern:**
```typescript
// Pages: app router with server components
// app/(dashboard)/candidates/page.tsx
import { getCandidates } from '@/lib/api'
import { CandidateList } from '@/components/candidates/candidate-list'

export default async function CandidatesPage() {
  const candidates = await getCandidates()
  return <CandidateList candidates={candidates} />
}

// Client components for interactivity
// components/candidates/candidate-list.tsx
'use client'
import { useState } from 'react'
import { useCandidateStore } from '@/stores/candidates'

export function CandidateList({ candidates }) {
  const { selectedCandidate, setSelected } = useCandidateStore()
  // ... component logic
}
```

**State Management:**
- **Zustand**: Lightweight state for UI state, filters, form data
- **React Query**: Server state caching, data synchronization
- **localStorage**: JWT token persistence, theme preferences

### Database (PostgreSQL 15)

```bash
# Access PostgreSQL directly
docker exec -it uns-claudejp-db psql -U uns_admin -d uns_claudejp

# Useful SQL commands
\dt                              # List tables (50+ models/tables)
\d candidates                    # Describe candidates table
\d employees                     # Describe employees table
SELECT COUNT(*) FROM candidates; # Count records
SELECT * FROM users WHERE username='admin';  # Verify admin user

# Quick data verification
\dt                              # List all 50+ models/tables
SELECT tablename FROM pg_tables WHERE schemaname='public';

# Backup/restore
docker exec uns-claudejp-db pg_dump -U uns_admin uns_claudejp > backup_$(date +%Y%m%d).sql
cat backup.sql | docker exec -i uns-claudejp-db psql -U uns_admin uns_claudejp

# Run migrations manually (if needed)
docker exec uns-claudejp-backend bash -c "cd /app && alembic upgrade head"

# Check migration status
docker exec uns-claudejp-backend bash -c "cd /app && alembic current"
docker exec uns-claudejp-backend bash -c "cd /app && alembic history"
```

---

## 📐 Architecture at a Glance

### Tech Stack (Fixed Versions - DO NOT CHANGE)

| Layer | Technology | Version |
|-------|-----------|---------|
| **Frontend** | Next.js | 16.0.0 |
| **UI Framework** | React | 19.0.0 |
| **Type Safety** | TypeScript | 5.6 |
| **Styling** | Tailwind CSS | 3.4 |
| **Backend** | FastAPI | 0.115.6 |
| **Language** | Python | 3.11+ |
| **ORM** | SQLAlchemy | 2.0.36 |
| **Database** | PostgreSQL | 15 |
| **DevOps** | Docker Compose | - |

### Key Architecture Decisions

1. **Next.js App Router** (NOT Pages Router) - File-based routing under `app/`
2. **FastAPI with dependency injection** - Type-safe endpoints with auto-documentation
3. **SQLAlchemy ORM** - Never use raw SQL; always use the ORM
4. **PostgreSQL with 50+ models/tables** - Full normalization with triggers for business logic
5. **Hybrid OCR** - Azure (primary) → EasyOCR (secondary) → Tesseract (fallback)
6. **Zustand + React Query** - Light state management + server state caching
7. **Shadcn/ui + Tailwind** - Component-driven design with CSS utilities

### Database (50+ Models/Tables)

**Personnel:** users, candidates, employees, contract_workers, staff
**Business:** factories, apartments, documents, contracts
**Operations:** timer_cards, salary_calculations, requests, audit_log

**Key relationships:**
- candidates ← employees (via `rirekisho_id`)
- employees → factories (via `factory_id`)
- employees → apartments (via `apartment_id`)

### User Role Hierarchy (Fixed - DO NOT MODIFY)

```
SUPER_ADMIN > ADMIN > COORDINATOR > KANRININSHA > EMPLOYEE > CONTRACT_WORKER
```

**Roles:**
- **SUPER_ADMIN** - Full system control
- **ADMIN** - Administrative access
- **COORDINATOR** - Coordination tasks
- **KANRININSHA** - Manager (管理人者)
- **EMPLOYEE** - Employee access
- **CONTRACT_WORKER** - Contract worker access

### OCR System (Hybrid Multi-Provider - Fixed Priority)

**Provider Cascade (DO NOT CHANGE ORDER):**
```
1. Azure Computer Vision (primary)
   ↓ (if fails)
2. EasyOCR (secondary)
   ↓ (if fails)
3. Tesseract (fallback)
```

**Supported Documents:**
- 履歴書 (Rirekisho/Resume) - 50+ fields
- 在留カード (Zairyu Card) - Residence card
- 運転免許証 (Driver's License)

**Face Detection:**
- MediaPipe for automatic photo extraction from documents
- Photos stored in `photo_data_url` field

### Theme System (23 Predefined + Custom)

**23 Predefined Themes:**
1. **default-light** - Default light theme
2. **default-dark** - Default dark theme
3. **uns-kikaku** - Corporate theme
4. **industrial** - Industrial corporate theme
5. **ocean-blue** - Nature theme
6. **mint-green** - Nature theme
7. **forest-green** - Nature theme
8. **sunset** - Nature theme
9. **royal-purple** - Premium theme
10. **vibrant-coral** - Vibrant theme
11. **monochrome** - Minimalist theme
12. **espresso** - Warm theme

**Theme Features:**
- Live preview with 500ms hover delay
- Favorites system
- Search and filter
- Custom theme builder
- Export/import JSON
- WCAG contrast validation
- Unlimited custom themes

**Theme Files:**
- Theme definitions: `frontend/lib/themes.ts`
- Customizer: `frontend/app/(dashboard)/themes/customizer/page.tsx`
- Theme gallery: `frontend/app/(dashboard)/themes/page.tsx`

### API Structure (24 Routers)

```
/api/
├── auth/                 # JWT login, token refresh, logout
├── candidates/           # CRUD + OCR processing (履歴書)
├── employees/            # CRUD + assignment (派遣社員)
├── factories/            # CRUD client sites (派遣先)
├── timer_cards/          # Attendance tracking (タイムカード)
├── payroll/              # Payroll calculations (給与)
├── requests/             # Leave workflows (申請)
├── dashboard/            # Analytics & stats
├── azure_ocr/            # OCR endpoints
├── import_export/        # Bulk data operations
├── notifications/        # Email/LINE alerts
├── reports/              # PDF generation
├── settings/             # System configuration
├── monitoring/           # Health checks + observability metrics
├── database/             # DB admin tools
├── apartments/           # Housing management
├── admin/                # Admin operations
├── role_permissions/     # RBAC management
├── salary/               # Salary management
├── pages/                # Static pages
├── resilient_import/     # Resilient data import
├── contracts/            # Contract management
└── deps.py               # Dependency injection
```

**New in v5.6.0:**
- `/api/monitoring/` enhanced with Prometheus metrics export
- All endpoints instrumented with OpenTelemetry for distributed tracing
- Performance metrics available at `/metrics` endpoint

---

## 🐛 Troubleshooting Quick Reference

| Problem | Solution |
|---------|----------|
| **Port already in use** | `netstat -ano \| findstr :3000` then `taskkill /PID <pid> /F` (Windows) |
| **Backend won't start** | Check `docker compose logs backend` for errors; verify DB health |
| **Frontend blank page** | Wait 1-2 min for compilation; check `docker compose logs frontend` |
| **Database connection error** | Run `alembic upgrade head` to apply migrations; check `db` service health |
| **TypeScript errors** | Run `npm run type-check` to see all issues; fix type mismatches |
| **Docker not found** | Ensure Docker Desktop is running; restart Docker Desktop |
| **CORS errors** | Check `FRONTEND_URL` environment variable in .env |
| **401 Unauthorized** | Verify JWT token in localStorage; check SECRET_KEY in backend .env |
| **Import fails** | Check Excel format; verify headers match expected field names |
| **OCR not working** | Check Azure credentials; verify image format (JPG, PNG); check file size |
| **Theme not applying** | Clear browser cache; verify theme exists in `/lib/themes.ts` |
| **Migration conflicts** | `git pull` latest; never modify `backend/alembic/versions/` directly |

**📖 For detailed troubleshooting, see:**
- `docs/04-troubleshooting/TROUBLESHOOTING.md`
- `docs/guides/development-patterns.md`

**Debug Commands:**
```bash
# Check all service health
docker compose ps

# View backend logs in real-time
docker compose logs -f backend

# Check database connection
docker exec -it uns-claudejp-db psql -U uns_admin -d uns_claudejp -c "SELECT version();"

# Verify frontend build
docker exec -it uns-claudejp-frontend npm run build

# Check environment variables
docker compose exec backend env | grep -E "(DATABASE|FRONTEND|SECRET)"

# Reset everything
cd scripts && STOP.bat && START.bat
```

---

## 📁 Project Structure Overview

```
UNS-ClaudeJP-5.6.0/
├── .claude/                    # Agent orchestration system
│   ├── agents.json             # Agent configuration
│   ├── claude.md               # Orchestration instructions
│   └── [specialized-agents]/   # Individual agent configurations
│
├── backend/                    # FastAPI backend
│   ├── app/
│   │   ├── api/                # API routers (24+ endpoints)
│   │   ├── models/             # SQLAlchemy models (50+ models/tables)
│   │   ├── schemas/            # Pydantic schemas
│   │   ├── services/           # Business logic
│   │   ├── core/               # Security, config, deps
│   │   └── main.py             # FastAPI app factory
│   ├── alembic/versions/       # Database migrations
│   └── scripts/                # Data management scripts
│
├── frontend/                   # Next.js 16 frontend
│   ├── app/(dashboard)/        # App Router pages (45+ pages)
│   │   ├── candidates/         # Candidate management
│   │   ├── employees/          # Employee management
│   │   ├── factories/          # Client sites
│   │   ├── timercards/         # Attendance tracking
│   │   ├── payroll/            # Salary calculations
│   │   ├── requests/           # Employee requests
│   │   ├── themes/             # Theme system
│   │   └── layout.tsx          # Dashboard layout
│   ├── components/             # Reusable components
│   │   ├── ui/                 # Shadcn/ui components
│   │   └── [feature-components]/
│   ├── lib/
│   │   ├── api.ts              # Axios client with JWT
│   │   └── themes.ts           # Theme definitions
│   └── stores/                 # Zustand state stores
│
├── scripts/                    # Windows batch scripts
│   ├── START.bat               # Start all services
│   ├── STOP.bat                # Stop services
│   ├── LOGS.bat                # View logs
│   ├── BACKUP_DATOS.bat        # Database backup
│   └── [other-scripts]/
│
├── config/                     # Templates and configs
│   ├── employee_master.xlsm    # Employee import template
│   └── factories/              # Factory configurations
│
├── docs/                       # Documentation
│   ├── architecture/           # Architecture docs
│   ├── guides/                 # Development guides
│   └── 04-troubleshooting/     # Troubleshooting
│
├── docker-compose.yml          # Service orchestration
├── .env                        # Environment variables
└── CLAUDE.md                   # This file
```

**Safe to Modify:**
- ✅ Add new routes in `backend/app/api/`
- ✅ Add new pages in `frontend/app/(dashboard)/`
- ✅ Update components in `frontend/components/`
- ✅ Add new services in `backend/app/services/`
- ✅ Database models in `backend/app/models/models.py` (create migration afterward)

**DO NOT Modify:**
- ❌ `scripts/*.bat` - System depends on these batch files
- ❌ `docker-compose.yml` - Service orchestration
- ❌ `.env` structure - Database connection, secrets
- ❌ `backend/alembic/versions/` - Migration history
- ❌ `.claude/` directory - Agent orchestration system
- ❌ Locked dependency versions (see Tech Stack table)

---

## 🧪 Testing

### Backend Testing
```bash
# Run all backend tests
pytest backend/tests/ -v

# Run specific test file
pytest backend/tests/test_auth.py -vs

# Run tests with markers
pytest -m "not slow" -v

# Run with coverage
pytest --cov=app backend/tests/
```

### Frontend Testing
```bash
# Unit tests (Vitest)
npm test
npm test -- --watch

# E2E tests (Playwright)
npm run test:e2e
npm run test:e2e -- --headed

# Type checking
npm run type-check

# Linting
npm run lint
npm run lint:fix
```

---

## 📚 AI Assistance & Documentation

### Must-Read Documents (In Order)

When working on this project, **READ IN THIS ORDER**:

1. **`.cursorrules`** ⭐ CRITICAL - Golden rules for all AI assistants
   - NEVER delete/modify functional code
   - NEVER delete files (.bat, Docker configs, agent files)
   - Always ask before modifying existing code
   - Windows compatibility requirements
   - Protected directories and files list

2. **`PROMPT_RECONSTRUCCION_COMPLETO.md`** - Complete system specification (25,000+ words)
   - Complete architecture, modules, and example code

3. **`AI_RULES.md`** - Universal rules for all AIs

4. **`This file (CLAUDE.md)`** - Project context and development guide

### 🔄 System Reconstruction Status

This project is being **reconstructed from scratch** to eliminate accumulated errors.

---

## 🚨 CRITICAL RULES - NEVER VIOLATE

### 1. NEVER DELETE OR MODIFY FUNCTIONAL CODE
- **If something works, DON'T TOUCH IT** - Only add or enhance
- **Never delete files** - Especially batch files (.bat), Python scripts, Docker configs, or files in `.claude/`
- **Always ask before modifying** - Get user confirmation for existing code changes

### 2. FILE MANAGEMENT (NORMA #7)
**Search before creating:**
- Check if similar .md file exists in `docs/`, `docs/archive/`, `docs/guides/`
- **Reuse existing**: Add content with date format `## 📅 YYYY-MM-DD - [TITLE]`
- **Avoid duplication**: Don't create `NEW_ANALYSIS.md` if `ANALYSIS.md` exists
- **Exception**: Only create new .md if topic is completely different

### 3. WINDOWS COMPATIBILITY (MANDATORY)
- All scripts must work on any Windows PC with Docker Desktop
- Use Windows-style paths in batch files (`\` not `/`)
- PowerShell and cmd.exe compatible
- **NO WSL/Linux dependencies required**

### 4. BACKUP BEFORE MAJOR CHANGES
- Suggest creating Git branch for large changes
- Ask for confirmation before modifying existing code
- Maintain current coding style and conventions
- Verify changes don't break Docker orchestration

### 5. 🛡️ PROTECTED FILES & DIRECTORIES (DO NOT MODIFY)

**Batch Scripts (System Critical):**
- All `.bat` files in `scripts/` - System depends on these
- Must NEVER close automatically (always add `pause >nul` at end)

**Configuration & Orchestration:**
- `docker-compose.yml` - Service orchestration
- `.env` structure - Database connection and secrets
- `backend/alembic/versions/` - Migration history (Git conflicts can break database)

**Agent & Orchestration System:**
- `.claude/` directory and all subdirectories
- `.claude/agents.json` - Agent orchestration configuration
- All agent files in `.claude/*/`

**Core Application Code:**
- `backend/app/models/models.py` - Database models (703+ lines)
- Locked dependency versions (see Tech Stack table above)

**Version Locking:**
- **Backend**: FastAPI 0.115.6, SQLAlchemy 2.0.36, Alembic 1.17.0, Pydantic 2.10.5, Python 3.11+
- **Frontend**: Next.js 16.0.0, React 19.0.0, TypeScript 5.6, Tailwind CSS 3.4
- **Database**: PostgreSQL 15

**If you need to change a version:**
1. STOP - Do not proceed
2. ASK the user for permission
3. JUSTIFY why it's necessary
4. WAIT for explicit approval

---

## 📜 Windows Batch Scripts (System Critical)

**Location:** `scripts/`

**Essential Scripts (DO NOT MODIFY):**
- `START.bat` - Start all services
- `STOP.bat` - Stop all services
- `LOGS.bat` - View logs (interactive menu)
- `REINSTALAR.bat` - Complete reinstallation
- `BACKUP_DATOS.bat` - Database backup
- `RESTAURAR_DATOS.bat` - Restore database
- `HEALTH_CHECK_FUN.bat` - System health check
- `DIAGNOSTICO_FUN.bat` - System diagnostics
- `INSTALAR_FUN.bat` - Installation script
- `BUILD_BACKEND_FUN.bat` - Build backend
- `BUILD_FRONTEND_FUN.bat` - Build frontend

**Additional Utilities:**
- `FIX_ADMIN_LOGIN_FUN.bat` - Fix admin login issues
- `CREAR_RAMA_FUN.bat` - Create git branch
- `COPY_FACTORIES.ps1` - Copy factory data
- `DEBUG_ACCESS_NAMES.ps1` - Debug Access database names

**If you need to modify a script:**
1. Create new version with suffix (e.g., `START_v2.bat`)
2. DO NOT overwrite original
3. Document changes in README.md

**🚨 CRITICAL RULE: .bat Files Must NEVER Close Automatically**

When creating or modifying .bat files, they MUST ALWAYS stay open to show errors:

1. **ALWAYS add `pause >nul` at the END** of every .bat file
2. **NEVER use `exit /b 1` after `pause`** - this closes the window
3. **Remove ALL `exit /b 1`** that appear after `pause` commands
4. **To fix existing .bat files**, run: `scripts\FIX_NEVER_CLOSE_BATS.ps1`

**Example - WRONG:**
```bat
pause >nul
exit /b 1  # ❌ Window closes immediately
```

**Example - CORRECT:**
```bat
pause >nul  # ✅ Window stays open
```

This ensures users can always see error messages without windows closing.

---

## 🎯 Mandatory Development Workflow

### Before Writing Code

1. **Read Specification:**
   ```
   "I have read PROMPT_RECONSTRUCCION_COMPLETO.md
    Section [X] that covers this functionality"
   ```

2. **Confirm Scope:**
   ```
   "I will implement [feature]
    using [technology] as specified in the prompt.
    Should I proceed?"
   ```

3. **Wait for User Confirmation**

### During Implementation

**ALWAYS show code BEFORE creating files:**

```
User: "Implement the candidate module"

Claude: "I will create the following files
         according to PROMPT_RECONSTRUCCION_COMPLETO.md:

         1. backend/app/api/candidates.py
         2. backend/app/schemas/candidate.py
         3. frontend/app/(dashboard)/candidates/page.tsx

         First, let me show you the code for candidates.py:
         [SHOW COMPLETE CODE]

         Do you approve this code before creating the file?"

User: "Yes, approved"

Claude: [NOW create file]
```

### After Implementation

1. **Verify:**
   ```bash
   # Backend
   docker compose logs backend | tail -20
   curl http://localhost:8000/api/candidates

   # Frontend
   npm run type-check
   npm run build
   ```

2. **Report:**
   ```
   "Candidate module implemented:
    ✅ API endpoint working
    ✅ Frontend compiling without errors
    ✅ TypeScript types validated

    Next step: [description]
    Should I proceed?"
   ```

### Validation Checklists

**Before creating/modifying files, VERIFY:**

**Backend Checklist:**
- [ ] Uses exact versions from prompt?
- [ ] Follows specified folder structure?
- [ ] Has docstrings and type hints?
- [ ] Handles errors appropriately?
- [ ] Validates authentication/authorization?
- [ ] Uses ORM (no direct SQL)?

**Frontend Checklist:**
- [ ] Uses App Router (not Pages)?
- [ ] Uses Shadcn/ui components?
- [ ] Has validation with Zod?
- [ ] Handles loading/error states?
- [ ] Is responsive (mobile-first)?
- [ ] Passes TypeScript type-check?

**Docker Checklist:**
- [ ] Maintains 12 services (6 core + 4 observability + nginx + backup)
- [ ] Health checks configured for all services
- [ ] Volumes for persistence (postgres_data, redis_data, grafana_data, prometheus_data, tempo_data)
- [ ] Environment variables from .env
- [ ] Proper service dependencies
- [ ] Nginx reverse proxy configured correctly
- [ ] Backup service scheduled and tested

---

## 📚 Documentation & Resources

### Architecture & Structure
- **Frontend Structure**: `docs/architecture/frontend-structure.md`
- **Backend Structure**: `backend/app/` (see main README.md)
- **Database Schema**: `docs/architecture/database-schema.md`

### Development Guides
- **Development Patterns**: `docs/guides/development-patterns.md`
- **Theme System**: `docs/guides/themes.md`
- **Template System**: `docs/guides/templates.md`
- **Design Tools**: `docs/guides/design-tools.md`
- **OCR Integration**: `docs/guides/ocr-integration.md`
- **Authentication**: `docs/guides/authentication.md`

### Troubleshooting
- **Troubleshooting Guide**: `docs/04-troubleshooting/TROUBLESHOOTING.md`
- **Common Issues**: `docs/guides/common-issues.md`

### User Preferences

**"claude poder"** = Run command in terminal:
```bash
claude --dangerously-skip-permissions
```

---

## 🌐 Service URLs

| Service | URL | Description |
|---------|-----|-------------|
| **Frontend** | http://localhost:3000 | Next.js application |
| **Backend API (via nginx)** | http://localhost/api | Production-like routing |
| **Backend API (direct)** | http://localhost:8000 | Direct access (dev only) |
| **API Docs** | http://localhost:8000/api/docs | Interactive Swagger UI |
| **ReDoc** | http://localhost:8000/api/redoc | Alternative API docs |
| **Adminer** | http://localhost:8080 | Database management UI |
| **Grafana** | http://localhost:3001 | Observability dashboards |
| **Prometheus** | http://localhost:9090 | Metrics storage & query |
| **Nginx Health** | http://localhost/nginx-health | Nginx status check |
| **Health Check** | http://localhost:8000/api/health | Backend health status |

> **Note**: In development, nginx provides production-like routing. Backend can be accessed directly at port 8000 or via nginx at port 80.

---

## 🐳 Docker Services

The application runs **12 services** via Docker Compose (6 core + 4 observability + 2 infrastructure):

### Core Services (6)

1. **db** - PostgreSQL 15 with persistent volume
   - Port: 5432
   - Health check: `pg_isready` (10s interval, 10 retries)
   - Volume: `postgres_data`
   - Initializes with: `/docker-entrypoint-initdb.d/01_init_database.sql`

2. **redis** - Redis 7 cache
   - Port: 6379
   - Maxmemory: 256mb, policy: allkeys-lru
   - Volume: `redis_data`
   - Health check: `redis-cli ping` (10s interval, 5 retries)

3. **importer** - One-time data initialization service
   - Creates admin user (`admin`/`admin123`)
   - Runs ALL Alembic migrations (including new columns)
   - Seeds demo data via `backend/scripts/manage_db.py seed`
   - Imports employees from Excel template
   - Imports candidates with complete field mapping
   - Syncs candidate-employee status
   - **Runs only on initial setup** (profile: dev,prod)

4. **backend** - FastAPI application with hot reload
   - Port: 8000 (internal), routed through nginx on port 80
   - Auto-reload on code changes
   - Depends on: `db` (healthy), `redis` (healthy)
   - Health check: `/api/health` (30s interval, 3 retries, 40s timeout)
   - **Horizontal scaling supported**: Use `--scale backend=N` for load balancing
   - Container name removed to enable auto-naming: `uns-claudejp-backend-1`, `uns-claudejp-backend-2`, etc.

5. **frontend** - Next.js 16 application with hot reload
   - Port: 3000
   - Uses Turbopack (default in Next.js 16)
   - Depends on: `backend` (healthy)
   - Health check: HTTP GET to `/api/health` (30s interval, 3 retries, 40s timeout)

6. **adminer** - Database management UI
   - Port: 8080
   - Access: http://localhost:8080
   - Credentials: same as PostgreSQL

### Observability Stack (4) - New in v5.6.0

7. **otel-collector** - OpenTelemetry Collector
   - Ports: 4317 (gRPC), 4318 (HTTP), 13133 (health)
   - Collects traces, metrics, and logs from backend/frontend
   - Forwards to Tempo and Prometheus

8. **tempo** - Grafana Tempo (Distributed Tracing)
   - Port: 3200
   - Stores and queries distributed traces
   - Volume: `tempo_data`
   - Health check: `/status` endpoint

9. **prometheus** - Prometheus (Metrics Storage)
   - Port: 9090
   - Scrapes metrics from backend and otel-collector
   - Volume: `prometheus_data`
   - Health check: `/-/ready` endpoint

10. **grafana** - Grafana (Observability Dashboards)
    - Port: 3001 (mapped from 3000 inside container)
    - Access: http://localhost:3001
    - Credentials: `admin` / `admin` (configurable via GRAFANA_ADMIN_PASSWORD)
    - Pre-configured dashboards for backend metrics and traces
    - Volume: `grafana_data`

### Infrastructure Services (2) - New in v5.6.0

11. **nginx** - Reverse Proxy & Load Balancer
    - Ports: 80 (HTTP), 443 (HTTPS)
    - Routes `/api/*` to backend services with load balancing
    - Routes `/` to frontend application
    - Provides SSL termination (production)
    - Basic auth for Prometheus (optional)
    - Health check: `/nginx-health` endpoint
    - Enables horizontal scaling of backend services
    - Logs: `./logs/nginx/`

12. **backup** - Automated Database Backup Service
    - Automated PostgreSQL backups with cron scheduling
    - Configurable backup time: `BACKUP_TIME` (default: 02:00 Asia/Tokyo)
    - Retention policy: `BACKUP_RETENTION_DAYS` (default: 30 days)
    - Backup location: `./backups/` (mounted volume)
    - Runs on startup: `BACKUP_RUN_ON_STARTUP` (default: true)
    - Health check: Verifies cron running and recent backup exists
    - Timezone: Asia/Tokyo (JST)

All services communicate via **`uns-network`** bridge network.
**Startup order:** `db` → `redis` → `otel-collector` → `tempo` → `prometheus` → `importer` → `backend` → `frontend` → `adminer` → `grafana` → `nginx` → `backup`

**Service Management:**
```bash
# Start specific profile
docker compose --profile dev up -d

# View all services (including stopped)
docker compose ps -a

# Check service health
docker compose ps

# View real-time logs for specific service
docker compose logs -f backend

# Restart specific service
docker compose restart frontend

# Scale backend horizontally for load balancing (nginx handles distribution)
docker compose up -d --scale backend=3

# Test backup service
docker compose logs backup

# Check backup files
ls -lh ./backups/

# Access services via nginx (production-like routing)
curl http://localhost/api/health
```

### Horizontal Scaling (Backend)

El backend soporta escalado horizontal gracias a nginx:

```bash
# Escalar a 3 instancias del backend
docker compose up -d --scale backend=3

# Verificar instancias activas
docker compose ps backend

# Nginx distribuirá las peticiones automáticamente entre:
# - uns-claudejp-backend-1
# - uns-claudejp-backend-2
# - uns-claudejp-backend-3

# Ver logs de todas las instancias
docker compose logs -f backend
```

---

## 📊 Data Import/Export Workflows

### Employee Data Import
**Template:** `config/employee_master.xlsm` (Excel macro-enabled workbook)
**Process:**
```bash
# 1. Prepare Excel file with employee data
# 2. Run import script
docker exec uns-claudejp-backend python scripts/import_data.py

# Expected columns: employee_id, full_name_roman, full_name_kanji,
# date_of_birth, email, phone, factory_id, apartment_id, etc.
```

### Candidate Data Import
**Process:**
```bash
# Import candidates with 100% field mapping
docker exec uns-claudejp-backend python scripts/import_candidates_improved.py

# Sync candidate-employee status
docker exec uns-claudejp-backend python scripts/sync_candidate_employee_status.py
```

### Factory Data Management
**Location:** `config/factories/`
**Script:** `scripts/copy_factories.ps1`

### Backup & Restore

**Automated Backups (via backup service):**
```bash
# El servicio backup crea backups automáticos en ./backups/
# Configuración en .env:
# BACKUP_TIME=02:00 (hora de backup, zona horaria Asia/Tokyo)
# BACKUP_RETENTION_DAYS=30 (días de retención)
# BACKUP_RUN_ON_STARTUP=true (backup al iniciar)

# Ver logs del servicio de backup
docker compose logs backup

# Listar backups disponibles
ls -lh ./backups/

# Los backups se nombran: backup_YYYYMMDD_HHMMSS.sql.gz
```

**Manual Backups:**
```bash
# Create database backup (Windows)
cd scripts
BACKUP_DATOS.bat

# Restore database (Windows)
RESTAURAR_DATOS.bat backup_20251108.sql

# Manual backup (cualquier sistema)
docker exec uns-claudejp-db pg_dump -U uns_admin uns_claudejp > ./backups/manual_backup_$(date +%Y%m%d).sql

# Manual restore
cat ./backups/backup_20251108.sql | docker exec -i uns-claudejp-db psql -U uns_admin uns_claudejp
```

## 📖 Important Notes

- **Default credentials**: `admin` / `admin123` (CHANGE IN PRODUCTION!)
- **Docker required**: All services run in containers
- **Port requirements**: 80/443 (nginx), 3000 (frontend), 8000 (backend), 5432 (postgres), 8080 (adminer), 6379 (redis), 3001 (grafana), 9090 (prometheus), 3200 (tempo), 4317/4318 (otel-collector)
- **Japanese terminology**: Extensive use of Japanese HR terms (履歴書/rirekisho, 派遣社員, タイムカード, etc.)
- **Version 5.6.0**: Latest version with enhanced documentation, AI assistance, and observability stack
- **Next.js**: Uses App Router (not Pages Router), Server Components by default
- **Turbopack**: Default bundler in Next.js 16 for faster development
- **Multi-language**: UI supports both English and Japanese
- **OCR Support**: Processes Japanese documents (resume, residence card, driver's license)
- **Theme System**: 23 predefined + unlimited custom themes
- **Role-based Access**: 6 user roles (SUPER_ADMIN → CONTRACT_WORKER)
- **Timezone**: Set to Asia/Tokyo (JST) for Japanese business operations
- **Observability**: Full OpenTelemetry instrumentation with Grafana dashboards
- **Dependency Cleanup**: v5.6.0 removed 22 unused packages (17 frontend + 5 backend)

**Migration from v5.4:** See `MIGRATION_V5.6.0_README.md` for complete changelog
