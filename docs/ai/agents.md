# 🤖 agents.md - Multi-AI Orchestration Guide

**Version:** 2.0.0
**Last Updated:** 2025-11-16
**Format:** OpenAI agents.md standard + UNS-ClaudeJP extensions
**Target AIs:** Claude Code, ChatGPT, Claude.ai, Gemini CLI, and any compatible AI system

---

## 🎯 Purpose

This is a **dedicated, predictable place** to provide context and instructions to help **coding agents and AI assistants** work effectively on the **UNS-ClaudeJP** HR management system.

Think of this as a **README for AI systems** — just as README.md guides human developers, **agents.md guides AI assistants**.

---

## 📋 Table of Contents

1. [Project Overview](#project-overview)
2. [Architecture & Agent System](#architecture--agent-system)
3. [Development Environment Setup](#development-environment-setup)
4. [Development Workflows by AI Type](#development-workflows-by-ai-type)
5. [Specialized Agent Triggers](#specialized-agent-triggers)
6. [Testing Instructions](#testing-instructions)
7. [PR & Deployment Instructions](#pr--deployment-instructions)
8. [Troubleshooting](#troubleshooting)
9. [Quick Commands Reference](#quick-commands-reference)

---

## Project Overview

**UNS-ClaudeJP 5.4.1** is a comprehensive **Japanese HR Management System** for staffing agencies (人材派遣会社).

### Core Tech Stack (Fixed Versions - DO NOT CHANGE)

| Layer | Technology | Version |
|-------|-----------|---------|
| **Frontend** | Next.js | 16.0.0 |
| **UI Framework** | React | 19.0.0 |
| **Backend** | FastAPI | 0.115.6 |
| **Database** | PostgreSQL | 15 |
| **DevOps** | Docker Compose | - |
| **Language** | Python 3.11+ | - |
| **ORM** | SQLAlchemy | 2.0.36 |

### Project Structure

```
UNS-ClaudeJP-5.4.1/
├── .claude/                    # 🤖 Agent orchestration system (THIS IS CRITICAL)
│   ├── agents.json             # Master agent registry
│   ├── CLAUDE.md               # Orchestrator master blueprint
│   ├── settings.json           # Global AI settings
│   ├── hooks/
│   │   └── session-start.sh    # Auto-setup dependencies
│   └── specialized-agents/     # 13 domain-specific agent configs
│
├── backend/                    # FastAPI + SQLAlchemy (Python)
│   ├── app/
│   │   ├── api/                # 27 API routers
│   │   ├── models/models.py    # 22 database tables
│   │   ├── schemas/            # Pydantic validation
│   │   ├── services/           # Business logic
│   │   └── core/               # Security & config
│   ├── alembic/versions/       # Database migrations
│   └── scripts/                # Data management
│
├── frontend/                   # Next.js 16 (React 19 + TypeScript)
│   ├── app/(dashboard)/        # 45+ pages (App Router)
│   ├── components/             # 44+ reusable components
│   ├── lib/
│   │   ├── api.ts              # Axios JWT client
│   │   └── themes.ts           # 12 predefined + custom themes
│   └── stores/                 # Zustand state management
│
├── scripts/                    # Windows batch automation
│   ├── START.bat               # Start all services
│   ├── STOP.bat                # Stop all services
│   └── ...                     # 10+ utility scripts
│
├── docker-compose.yml          # 12 service orchestration
├── CLAUDE.md                   # Original orchestration guide
└── agents.md                   # This file
```

---

## Architecture & Agent System

### 🎭 The 13 Specialized Agents

Your project uses a **hierarchical AI orchestration system** with 13 specialized agents, each with deep domain knowledge:

#### **Backend Specialists (3)**

1. **api-developer** - REST endpoint design, FastAPI routing, dependency injection
2. **backend-architect** - System design, architecture decisions, integration patterns
3. **database-specialist** - PostgreSQL, SQLAlchemy ORM, migrations (Alembic)

#### **Frontend Specialists (2)**

4. **frontend-architect** - Next.js App Router, React patterns, server/client components
5. **ui-designer** - Shadcn/ui components, Tailwind CSS, responsive design, accessibility

#### **DevOps Specialist (1)**

6. **devops-engineer** - Docker Compose, Nginx, health checks, scaling, CI/CD

#### **Quality Assurance (4)**

7. **bug-hunter** - Debugging, error detection, edge cases, stack traces
8. **performance-optimizer** - Speed optimization, memory leaks, bundle analysis
9. **security-auditor** - JWT auth, RBAC, vulnerability scanning, encryption
10. **testing-qa** - Unit tests (pytest), E2E tests (Playwright), type checking

#### **Feature Specialists (2)**

11. **ocr-specialist** - Azure OCR, EasyOCR, Tesseract, Japanese document processing
12. **payroll-calculator** - Salary calculations, Japanese tax/insurance systems, financial logic

#### **Orchestration Master (1)**

13. **orchestrator-master** - Coordination, planning, delegation, big-picture decisions (uses 200k context!)

### Agent Activation Rules

Each agent auto-activates based on **keywords in your request**:

```
Request contains → Agent activates
─────────────────────────────────
"api" OR "endpoint" OR "router" → api-developer
"architecture" OR "design" → backend-architect OR frontend-architect
"database" OR "migration" → database-specialist
"react" OR "nextjs" → frontend-architect
"ui" OR "component" OR "design" → ui-designer
"docker" OR "deploy" → devops-engineer
"security" OR "auth" → security-auditor
"ocr" OR "document" → ocr-specialist
"salary" OR "payroll" → payroll-calculator
"bug" OR "debug" → bug-hunter
"test" OR "qa" → testing-qa
"optimize" OR "performance" → performance-optimizer
"plan" OR "coordinate" → orchestrator-master
```

### How Agents Communicate

```
YOUR REQUEST
    ↓
ORCHESTRATOR (200k context window)
├─ Analyzes your request
├─ Creates detailed todo list (TodoWrite)
├─ Detects new technologies? → Research (Jina AI)
├─ For each task:
│  ├─ Route to APPROPRIATE SPECIALIST (api-developer, frontend-architect, etc.)
│  └─ Specialist works in its own isolated context
│      └─ Invoke TESTER (Playwright) to verify each piece
└─ Compile results & report back
```

**Key Point:** Each agent gets a **clean, focused context window** for one specific task. They never interfere with each other.

---

## Development Environment Setup

### 🚀 First Time Setup (All AIs)

```bash
# 1. Clone/navigate to project directory
cd /home/user/UNS-ClaudeJP-5.4.1

# 2. SessionStart hook automatically installs dependencies
# (This runs automatically in Claude Code / compatible environments)
# It will:
#   - Install Python 3.11+ dependencies (requirements.txt)
#   - Install Node.js dependencies (npm install)
#   - Configure environment variables

# 3. Start Docker services
docker compose up -d

# 4. Verify setup
docker compose ps  # Should show 12 services all healthy
```

### 📍 Key Development Paths

**Backend Development:**
```
backend/app/
├── api/                    # ← Add new API routers here
│   ├── candidates.py       # Example: candidate management routes
│   ├── employees.py        # Example: employee routes
│   ├── factories.py        # Example: client site routes
│   └── __init__.py         # Register routers in main.py
├── services/               # ← Business logic goes here
│   ├── candidate.py        # Example: candidate business logic
│   └── employee.py         # Example: employee business logic
├── models/models.py        # ← SQLAlchemy models (single file, 22 tables)
├── schemas/                # ← Pydantic validation schemas
└── core/                   # ← Security & configuration
```

**Frontend Development:**
```
frontend/
├── app/(dashboard)/        # ← Add new pages here
│   ├── candidates/         # Example: candidates module
│   │   ├── page.tsx        # Main candidates page
│   │   └── [id]/           # Dynamic routes
│   ├── employees/          # Example: employees module
│   └── layout.tsx          # Dashboard layout (navigation, auth check)
├── components/             # ← Reusable components here
│   ├── ui/                 # Shadcn/ui components
│   ├── candidates/         # Feature-specific components
│   └── employees/          # Feature-specific components
└── lib/
    ├── api.ts              # Axios instance with JWT interceptors
    └── themes.ts           # Theme system (12 predefined + custom)
```

### 🔧 Docker Services (12 total)

**Core Services (6):**
- `db` - PostgreSQL 15 (port 5432)
- `redis` - Cache layer (port 6379)
- `backend` - FastAPI (port 8000)
- `frontend` - Next.js (port 3000)
- `adminer` - DB UI (port 8080)
- `importer` - Init & migrations service

**Observability (4):**
- `otel-collector` - Trace collection
- `tempo` - Distributed tracing
- `prometheus` - Metrics storage
- `grafana` - Dashboards (port 3001)

**Infrastructure (2):**
- `nginx` - Reverse proxy + load balancer (port 80)
- `backup` - Automated database backups

### 🔗 Access URLs

| Service | URL | Purpose |
|---------|-----|---------|
| Frontend | http://localhost:3000 | Next.js app |
| Backend (direct) | http://localhost:8000 | FastAPI (dev only) |
| Backend (via nginx) | http://localhost/api | Production-like routing |
| API Docs | http://localhost:8000/api/docs | Swagger UI |
| Database UI | http://localhost:8080 | Adminer |
| Grafana | http://localhost:3001 | Metrics dashboards |
| Prometheus | http://localhost:9090 | Metrics query |

### ✅ Verify Setup

```bash
# Check all services are healthy
docker compose ps
# Expected output: All 12 services with "Up (healthy)" status

# Quick API test
curl http://localhost:8000/api/health
# Expected: {"status": "healthy", "database": "connected"}

# Frontend compile check
docker exec -it uns-claudejp-frontend npm run typecheck
# Expected: "0 errors"
```

---

## Development Workflows by AI Type

### 🤖 For Claude Code (Primary AI)

**You are the ORCHESTRATOR. Your workflow:**

1. **Create comprehensive todo list**
   ```markdown
   - [ ] Feature 1 (pending)
   - [ ] Feature 2 (pending)
   - [ ] Testing & verification (pending)
   ```

2. **For each todo, delegate to specialists**
   - Detect which specialist you need (backend-architect? frontend-architect?)
   - Invoke Task tool with appropriate `subagent_type`
   - Pass todo + research docs to specialist
   - Wait for completion

3. **Test every implementation**
   - Always invoke testing-qa or tester after code changes
   - Verify with Playwright E2E tests
   - Check TypeScript compilation

4. **Maintain big picture**
   - You have 200k context — use it!
   - Keep track of architectural decisions
   - Monitor for inconsistencies

**Example:**
```
User: "Add candidate import feature"

Claude Code (You):
1. Create todo list (TodoWrite)
   - [ ] Design API endpoint for import
   - [ ] Create Pydantic validation schema
   - [ ] Implement CSV/Excel parsing
   - [ ] Add error handling & logging
   - [ ] Create frontend form
   - [ ] Test end-to-end

2. Detect: "API endpoint" → Need api-developer
   → Task(subagent_type="general-purpose",
           prompt="Design POST /api/candidates/import endpoint...")

3. Detect: "Frontend form" → Need frontend-architect
   → Task(subagent_type="general-purpose",
           prompt="Create candidate import form component...")

4. Always test:
   → Task(subagent_type="general-purpose",
           prompt="Test import feature: upload CSV, verify records created...")
```

---

### 💬 For ChatGPT / Claude.ai (Web Versions)

**You can help with research & architectural questions, but cannot execute code.**

**Best Uses:**
- ✅ Explain architecture and design patterns
- ✅ Code review and suggestions
- ✅ Troubleshooting and debugging advice
- ✅ Writing documentation
- ❌ Cannot run Bash commands
- ❌ Cannot commit code to Git
- ❌ Cannot run tests directly

**Example Prompt Format:**
```
Context: I'm working on UNS-ClaudeJP HR system (Next.js + FastAPI)

Question: "How should I structure the candidate import feature?
- Backend: I need to validate CSV/Excel data
- Frontend: I need a form component
- Database: I need to handle duplicate detection

What's the best approach? Show me the code patterns I should use."

Then copy-paste this response into Claude Code and it will execute the implementation.
```

---

### 🔍 For Gemini CLI / Google AI Studio

**Specialized for code generation and analysis.**

**Best Uses:**
- ✅ Generate boilerplate code (API routes, components, schemas)
- ✅ Analyze code for bugs and improvements
- ✅ Generate test cases
- ✅ Documentation generation
- ✅ Schema and type definitions

**Setup for Gemini CLI:**
```bash
# Install Gemini CLI (if not already done)
npm install -g @google-cloud/ai-sdk

# Set API key
export GOOGLE_API_KEY="your-api-key-here"

# Example: Generate FastAPI endpoint
gemini-cli generate-code --template=fastapi-endpoint \
  --model="FastAPI" \
  --module="candidates" \
  --action="import"
```

---

### 🚀 For Any New AI (General Pattern)

**All AI systems should follow this pattern:**

```
1. READ THIS FILE (agents.md)
   ↓
2. READ CLAUDE.md (.claude/CLAUDE.md)
   ↓
3. READ PROJECT SPEC (CLAUDE.md in root, or PROMPT_RECONSTRUCCION_COMPLETO.md)
   ↓
4. UNDERSTAND YOUR ROLE:
   - Are you an orchestrator? (200k context) → Coordinate everything
   - Are you a specialist? (focused context) → Do ONE task well
   - Are you a researcher? (docs/tech) → Fetch & summarize
   - Are you a tester? (Playwright) → Verify implementations
   ↓
5. FOLLOW MANDATORY RULES:
   - Never implement code without understanding spec
   - Always delegate to specialists (don't do everything yourself)
   - Always test before marking complete
   - Always escalate to human if blocked
   ↓
6. USE THE TOOLS:
   - TodoWrite for task management
   - Bash for commands
   - Task tool for delegating work
   - Grep/Glob for searching
   - Read/Edit for files
```

---

## Specialized Agent Triggers

### How to Invoke Specialists (For Orchestrators)

When you (Claude Code) encounter a request, **automatically route to the right specialist**:

```python
# Pattern for invoking specialists
Task(
    subagent_type="general-purpose",
    description="Short description",
    prompt="""
Full context:
- What needs to be done
- What files are involved
- What technology is needed
- Link to research docs if new tech
    """
)
```

### Specialist Profiles

#### 🔗 api-developer
**When:** New API endpoint, REST route, FastAPI router
**What to provide:**
- Endpoint spec (method, path, parameters)
- Request/response schemas
- Authentication requirements
- Error cases to handle

**Example:**
```
Task: Implement POST /api/candidates/import
- Accepts: multipart/form-data (Excel/CSV)
- Validates: required columns, data types
- Returns: { success: bool, imported: int, errors: [] }
- Auth: Requires ADMIN role
```

#### 🏗️ backend-architect
**When:** System design, architecture decisions, integration patterns
**What to provide:**
- Problem statement
- Current architecture
- Constraints/requirements
- Scale considerations

#### 🗄️ database-specialist
**When:** Schema changes, migrations, queries, performance
**What to provide:**
- Table structure needed
- Relationships to other tables
- Migration scripts
- Performance requirements

#### ⚛️ frontend-architect
**When:** Page structure, routing, component architecture
**What to provide:**
- Page/route hierarchy
- Component breakdown
- State management approach
- Server/client component decisions

#### 🎨 ui-designer
**When:** Component implementation, styling, responsive design
**What to provide:**
- Figma/design reference (if available)
- Component requirements
- Accessibility needs
- Theme/color system usage

#### 🐳 devops-engineer
**When:** Docker, deployment, scaling, monitoring
**What to provide:**
- Service requirements
- Performance targets
- Backup/restore needs
- Monitoring requirements

#### 🔐 security-auditor
**When:** Authentication, authorization, vulnerabilities
**What to provide:**
- Security requirements
- Role/permission matrix
- Data sensitivity level
- Compliance requirements

#### 📄 ocr-specialist
**When:** Document processing, OCR, image handling
**What to provide:**
- Document type (履歴書, 免許証, etc.)
- Fields to extract
- Image quality expectations
- Fallback logic needed

#### 💰 payroll-calculator
**When:** Salary, tax, insurance, compensation logic
**What to provide:**
- Calculation formula
- Japanese tax/insurance rules
- Edge cases
- Rounding rules

#### 🐛 bug-hunter
**When:** Debugging errors, stack traces, edge cases
**What to provide:**
- Error message/stack trace
- Steps to reproduce
- Expected vs actual behavior
- Environment info

#### ⚡ performance-optimizer
**When:** Speed, memory, bundle size optimization
**What to provide:**
- Bottleneck details
- Current vs target performance
- Profiling data
- Constraints (CPU, memory)

#### ✅ testing-qa
**When:** Test planning, execution, verification
**What to provide:**
- What to test (features, flows)
- Test data requirements
- Success criteria
- Edge cases to cover

#### 🎯 orchestrator-master
**When:** You need to coordinate multiple tasks
**What to provide:**
- Overall goal
- Dependencies between tasks
- Timeline/priority
- Resource constraints

---

## Testing Instructions

### ✅ Backend Testing

```bash
# Access backend container
docker exec -it uns-claudejp-backend bash

# Run all tests
pytest backend/tests/ -v

# Run specific test file
pytest backend/tests/test_candidates.py -v

# Run with coverage
pytest backend/tests/ --cov=app --cov-report=html

# Run specific test
pytest backend/tests/test_auth.py::test_login_success -vs

# Run tests with markers
pytest -m "not slow" -v

# Watch mode (auto-run on file changes)
ptw backend/tests/ -v
```

**Expected Output:**
```
collected 150 items
test_auth.py::test_login_success PASSED
test_candidates.py::test_create_candidate PASSED
...
========================== 150 passed in 12.34s ==========================
```

### ✅ Frontend Testing

```bash
# Access frontend container
docker exec -it uns-claudejp-frontend bash

# Type checking (REQUIRED before commit)
npm run typecheck

# Unit tests (Vitest)
npm test

# Unit tests in watch mode
npm test -- --watch

# E2E tests (Playwright - REQUIRED before PR)
npm run test:e2e

# E2E tests in headed mode (see browser)
npm run test:e2e -- --headed

# Linting
npm run lint
npm run lint:fix

# Build check
npm run build
```

**Expected Output:**
```
✓ 0 errors reported by TypeScript
✓ 45 passed (Vitest)
✓ 12 E2E tests passed (Playwright)
✓ No lint errors
```

### ✅ Docker & Integration Testing

```bash
# Health checks for all services
docker compose ps
# All services should show "healthy" status

# Quick API health check
curl http://localhost:8000/api/health
# Expected: {"status": "healthy", "database": "connected", "redis": "connected"}

# Frontend startup check
curl http://localhost:3000
# Should return HTML (Next.js page)

# Database connection check
docker exec -it uns-claudejp-db psql -U uns_admin -d uns_claudejp -c "SELECT COUNT(*) FROM users;"
# Expected: user count

# Full system test (run from project root)
./scripts/HEALTH_CHECK_FUN.bat  # Windows
# Or: bash scripts/health-check.sh  # Linux/Mac
```

### ✅ Pre-Commit Testing Checklist

**BEFORE you commit ANY code:**

```bash
# 1. Backend type checking
docker exec -it uns-claudejp-backend bash -c "cd /app && mypy app/"

# 2. Backend tests
docker exec -it uns-claudejp-backend bash -c "cd /app && pytest tests/ -v"

# 3. Frontend type checking (CRITICAL)
docker exec -it uns-claudejp-frontend npm run typecheck

# 4. Frontend tests
docker exec -it uns-claudejp-frontend npm test

# 5. Frontend E2E tests (CRITICAL - tests real flow)
docker exec -it uns-claudejp-frontend npm run test:e2e

# 6. Frontend build check
docker exec -it uns-claudejp-frontend npm run build

# 7. Linting
docker exec -it uns-claudejp-frontend npm run lint
```

**If ANY of these fail → DO NOT COMMIT**

---

## PR & Deployment Instructions

### 🔀 Creating a Pull Request

**Branch Naming Convention:**
```
claude/feature-description-SESSION_ID

Example:
claude/add-agents-documentation-01CRQGeQETU9LQbL3BYfJ9gU
```

**Pre-PR Checklist:**

```bash
# 1. Pull latest changes
git pull origin main

# 2. Run all tests (see Testing section above)
# Backend: pytest backend/tests/ -v ✅
# Frontend: npm run typecheck ✅
# Frontend: npm test ✅
# Frontend: npm run test:e2e ✅

# 3. Check for console errors
docker compose logs backend | grep -i error
docker compose logs frontend | grep -i error

# 4. Verify no secrets in code
git diff main -- backend/ frontend/ | grep -i "password\|secret\|key\|token"
# Should return nothing

# 5. Format code consistently
docker exec -it uns-claudejp-frontend npm run lint:fix
docker exec -it uns-claudejp-backend bash -c "cd /app && black app/ && isort app/"

# 6. Create/update CHANGELOG
# Document what changed in docs/CHANGELOG.md with date and version
```

**Create PR with Description:**

```markdown
## Summary
Brief description of what this PR does.

## Type
- [ ] Bug fix
- [ ] New feature
- [ ] Enhancement
- [ ] Documentation
- [ ] DevOps

## Changes
- Point 1
- Point 2
- Point 3

## Testing
- [ ] Backend tests pass (pytest)
- [ ] Frontend typecheck passes
- [ ] E2E tests pass (Playwright)
- [ ] No console errors
- [ ] Tested in Chrome, Firefox

## Deployment Notes
Any special deployment considerations, database migrations, environment variable changes, etc.

## Related Issues
Closes #123
```

### 🚀 Deployment Steps

```bash
# 1. Merge PR to main (GitHub web interface)

# 2. Pull latest main locally
git pull origin main

# 3. Run full test suite
pytest backend/tests/ -v --tb=short
docker exec -it uns-claudejp-frontend npm run typecheck && npm test

# 4. Create backup
docker exec uns-claudejp-db pg_dump -U uns_admin uns_claudejp > backup_pre_deploy_$(date +%Y%m%d).sql

# 5. Run migrations (if database changes)
docker exec -it uns-claudejp-backend bash -c "cd /app && alembic upgrade head"

# 6. Rebuild containers
docker compose build --no-cache

# 7. Restart services (no downtime)
docker compose up -d --no-deps --build backend frontend

# 8. Verify services are healthy
docker compose ps
sleep 10  # Wait for startup
curl http://localhost:8000/api/health
curl http://localhost:3000

# 9. Check logs for errors
docker compose logs backend | grep ERROR
docker compose logs frontend | grep ERROR

# 10. Smoke test critical flows
# Manual testing or automated Playwright tests
npm run test:e2e -- --grep "critical"
```

### ⚠️ Rollback Steps (If Deployment Fails)

```bash
# 1. Immediately stop new services
docker compose down

# 2. Revert code to previous commit
git reset --hard HEAD~1

# 3. Rebuild with previous code
docker compose build --no-cache
docker compose up -d

# 4. Restore from backup if database corrupted
cat backup_pre_deploy_20251116.sql | docker exec -i uns-claudejp-db psql -U uns_admin uns_claudejp

# 5. Verify service health
docker compose ps
curl http://localhost:8000/api/health

# 6. Alert team and investigate
# Document what went wrong for postmortem
```

---

## Troubleshooting

### 🚨 Common Issues & Solutions

#### **Port Already in Use**
```bash
# Windows
netstat -ano | findstr :3000
taskkill /PID <PID> /F

# Linux/Mac
lsof -i :3000
kill -9 <PID>

# Or just use different ports in .env
FRONTEND_PORT=3001
BACKEND_PORT=8001
```

#### **Backend Won't Start**
```bash
# Check logs
docker compose logs backend

# Common causes:
# 1. Database not ready
docker compose restart db
docker compose up -d backend

# 2. Migrations not applied
docker exec -it uns-claudejp-backend bash -c "cd /app && alembic upgrade head"

# 3. Environment variables missing
# Check .env file exists and has DATABASE_URL set
cat .env | grep DATABASE_URL
```

#### **Frontend Blank Page**
```bash
# 1. Wait 2-3 minutes for compilation (Next.js is slow first time)
# 2. Check browser console for errors (F12)
# 3. Check frontend logs
docker compose logs -f frontend

# 4. Clear cache
rm -rf frontend/.next
docker compose restart frontend
```

#### **Database Connection Error**
```bash
# 1. Verify PostgreSQL is running
docker compose ps db

# 2. Test connection directly
docker exec -it uns-claudejp-db psql -U uns_admin -d uns_claudejp -c "\dt"

# 3. Check DATABASE_URL format in .env
# Should be: postgresql://uns_admin:password@db:5432/uns_claudejp

# 4. Verify migrations applied
docker exec -it uns-claudejp-backend bash -c "cd /app && alembic current"
```

#### **TypeScript Errors Before Commit**
```bash
# Run type-check
docker exec -it uns-claudejp-frontend npm run typecheck

# Fix all errors (required before commit!)
# Most common:
# - Missing @ts-ignore comments
# - Wrong prop types
# - Missing null checks

# Don't commit with errors!
```

#### **Tests Failing**
```bash
# 1. Check what's failing
docker exec -it uns-claudejp-backend bash -c "cd /app && pytest tests/ -v"

# 2. Run specific failing test with more detail
docker exec -it uns-claudejp-backend bash -c "cd /app && pytest tests/test_file.py::test_func -vvs"

# 3. Check test database state
docker exec -it uns-claudejp-db psql -U uns_admin -d uns_claudejp_test -c "SELECT * FROM users;"

# 4. Most common causes:
# - Data state (test expected empty table, but data exists)
# - Transaction not rolled back
# - Mock not configured properly
```

#### **Docker Permission Denied**
```bash
# Add current user to docker group (Linux)
sudo usermod -aG docker $USER
newgrp docker

# Restart Docker Desktop (Windows/Mac)
# Restart → Docker Desktop → Dashboard
```

#### **Migrations Conflict**
```bash
# NEVER modify applied migrations!
# If you need to undo:

# 1. Check current migration
docker exec -it uns-claudejp-backend bash -c "cd /app && alembic current"

# 2. Downgrade one step
docker exec -it uns-claudejp-backend bash -c "cd /app && alembic downgrade -1"

# 3. Delete the .py file in alembic/versions/
# 4. Regenerate migration
docker exec -it uns-claudejp-backend bash -c "cd /app && alembic revision --autogenerate -m 'fix_schema'"

# 5. Apply migrations
docker exec -it uns-claudejp-backend bash -c "cd /app && alembic upgrade head"
```

---

## Quick Commands Reference

### 🚀 Project Startup
```bash
# Terminal 1: Start all services
docker compose up -d

# Terminal 2: Watch backend logs
docker compose logs -f backend

# Terminal 3: Watch frontend logs
docker compose logs -f frontend

# Verify all services healthy
docker compose ps
```

### 🐍 Backend Development
```bash
# Enter backend shell
docker exec -it uns-claudejp-backend bash

# Inside container:
cd /app

# Run tests
pytest tests/ -v

# Apply migrations
alembic upgrade head

# Create migration
alembic revision --autogenerate -m "add_field"

# View current schema
alembic current

# Create admin user
python scripts/create_admin_user.py
```

### ⚛️ Frontend Development
```bash
# Enter frontend shell
docker exec -it uns-claudejp-frontend bash

# Type check
npm run typecheck

# Test
npm test

# E2E test
npm run test:e2e

# Build
npm run build

# Lint
npm run lint -- --fix
```

### 📊 Database Commands
```bash
# Enter PostgreSQL
docker exec -it uns-claudejp-db psql -U uns_admin -d uns_claudejp

# Inside psql:
\dt                    # List tables
\d candidates          # Describe table
SELECT COUNT(*) FROM candidates;  # Count records
SELECT * FROM users WHERE username='admin';  # Query specific user

# Backup
docker exec uns-claudejp-db pg_dump -U uns_admin uns_claudejp > backup.sql

# Restore
cat backup.sql | docker exec -i uns-claudejp-db psql -U uns_admin uns_claudejp
```

### 🛑 Stopping Services
```bash
# Stop all services (data persisted)
docker compose down

# Stop and remove volumes (WARNING: data lost!)
docker compose down -v

# Stop specific service
docker compose stop backend

# Restart service
docker compose restart backend
```

### 🔍 Debugging
```bash
# View all logs
docker compose logs

# View specific service logs
docker compose logs backend
docker compose logs frontend

# Real-time logs
docker compose logs -f backend

# Last 50 lines
docker compose logs --tail=50 backend

# Filter logs
docker compose logs backend | grep ERROR
```

### 📈 Health Checks
```bash
# All services status
docker compose ps

# Backend health
curl http://localhost:8000/api/health

# Frontend running
curl http://localhost:3000

# Database ready
docker exec uns-claudejp-db pg_isready -U uns_admin

# Redis ready
docker exec uns-claudejp-redis redis-cli ping
```

---

## Critical Rules (MUST FOLLOW)

### ✅ DO

- ✅ Read `.cursorrules` and `CLAUDE.md` at the start of every session
- ✅ Use TodoWrite to track tasks (mark as in_progress → completed)
- ✅ Delegate to specialists via Task tool (don't do everything yourself)
- ✅ Test every implementation before marking complete
- ✅ Create todo lists when work is complex (3+ steps)
- ✅ Reference file:line_number when discussing code
- ✅ Use Git branches for feature development
- ✅ Document what you changed before committing
- ✅ Escalate to humans when blocked (use AskUserQuestion)
- ✅ Follow semantic versioning (MAJOR.MINOR.PATCH)

### ❌ DON'T

- ❌ Modify `.claude/`, `docker-compose.yml`, `.cursorrules`, or `CLAUDE.md` without permission
- ❌ Change locked dependency versions (see Tech Stack table)
- ❌ Implement code without understanding the spec
- ❌ Skip testing (all code must pass tests before commit)
- ❌ Create features without creating corresponding tests
- ❌ Use raw SQL (always use SQLAlchemy ORM)
- ❌ Hardcode credentials or secrets
- ❌ Modify `backend/alembic/versions/` applied migrations
- ❌ Implement multiple features in one commit
- ❌ Merge PRs without passing all checks

---

## 🎓 Learning Resources

### For AI Systems (Recommended Reading Order)

1. **[.cursorrules](.cursorrules)** ⭐ CRITICAL
   - Golden rules for AI assistants
   - Windows compatibility requirements
   - Protected files list

2. **[CLAUDE.md](./CLAUDE.md)**
   - Orchestrator patterns
   - How to delegate work
   - Mandatory workflows

3. **[This file: agents.md](./agents.md)**
   - Development guide for AIs
   - Testing instructions
   - Deployment procedures

4. **[PROMPT_RECONSTRUCCION_COMPLETO.md](./PROMPT_RECONSTRUCCION_COMPLETO.md)**
   - Complete system specification (25,000+ words)
   - Every feature detailed
   - Architecture rationale

5. **[docs/architecture/]** folder
   - Database schema
   - Frontend structure
   - Backend patterns

---

## 🤝 Support & Feedback

### Get Help

- **Claude Code Help**: `/help` in Claude Code CLI
- **Issues**: https://github.com/anthropics/claude-code/issues
- **Project Issues**: Create a GitHub issue in your project

### Report Issues

When reporting problems:

```markdown
**Environment:**
- AI: Claude Code / ChatGPT / Gemini
- OS: Windows / Linux / macOS
- Docker version: X.Y.Z
- Node/Python version: X.Y.Z

**Problem:**
[Detailed description]

**Steps to Reproduce:**
1. ...
2. ...
3. ...

**Error Message:**
[Full stack trace]

**Expected Behavior:**
[What should happen]

**Actual Behavior:**
[What actually happened]
```

---

## 📝 Version History

| Version | Date | Changes |
|---------|------|---------|
| 2.0.0 | 2025-11-16 | Complete rewrite with multi-AI support, specialized agents, comprehensive testing guide |
| 1.0.0 | 2025-11-13 | Initial agents.md creation |

---

## 📄 License

Same as UNS-ClaudeJP project (proprietary)

---

**Last Updated:** 2025-11-16
**Maintained by:** UNS-ClaudeJP Development Team
**Format:** OpenAI agents.md standard v1.0 + UNS-ClaudeJP extensions

---

**Remember:** This file is for AI systems to understand the project structure, development workflow, and how to contribute effectively. For humans, read the main CLAUDE.md and project README.

🚀 **Happy coding!**
