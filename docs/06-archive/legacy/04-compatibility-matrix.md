# Matriz de Compatibilidad - UNS-ClaudeJP 5.4.1

## Frontend Stack Compatibility

```
┌─────────────────────────────────────────────────────────┐
│                  FRONTEND ECOSYSTEM                      │
├─────────────────────────────────────────────────────────┤
│                                                          │
│  Node 20-alpine                                         │
│         ↓                                               │
│  Next.js 16.0.0 ←→ React 19.0.0 ←→ TypeScript 5.6     │
│         ↓              ↓              ↓                 │
│    ESLint 9.0    Testing Library    Prettier 3.2      │
│         ↓              ↓              ↓                 │
│  Tailwind 3.4 ←─────────┴──────────────┘               │
│         ↓                                               │
│  Radix UI (15 components)                              │
│  + Shadcn/ui patterns                                  │
│         ↓                                               │
│  State Management:                                      │
│  ├─ Zustand 5.0.8                                      │
│  ├─ React Query 5.59.0                                 │
│  └─ React Hook Form 7.65.0                            │
│         ↓                                               │
│  Utils: Axios, Date-fns, Recharts, Framer Motion     │
│         ↓                                               │
│  Testing:                                              │
│  ├─ Vitest 2.1.5                                      │
│  ├─ Playwright 1.49.0                                 │
│  └─ Testing Library 16.1.0                            │
│         ↓                                               │
│  Observability:                                         │
│  └─ OpenTelemetry (Web SDK 2.2.0)                     │
│                                                          │
└─────────────────────────────────────────────────────────┘
```

## Backend Stack Compatibility

```
┌─────────────────────────────────────────────────────────┐
│                   BACKEND ECOSYSTEM                      │
├─────────────────────────────────────────────────────────┤
│                                                          │
│  Python 3.11-slim                                       │
│         ↓                                               │
│  FastAPI 0.115.6 ←→ Pydantic 2.10.5                   │
│         ↓              ↓                                │
│    Uvicorn 0.34   Validation                           │
│         ↓              ↓                                │
│  Route Handlers ←─────┘                                │
│         ↓                                               │
│  Database Layer:                                        │
│  ├─ SQLAlchemy 2.0.36                                  │
│  ├─ Alembic 1.17.0 (migrations)                       │
│  ├─ Psycopg2 2.9.10 (postgres adapter)                │
│  └─ PostgreSQL 15-alpine                              │
│         ↓                                               │
│  Cache Layer:                                           │
│  ├─ Redis Client 7.0.1                                │
│  └─ Redis 7-alpine (service)                          │
│         ↓                                               │
│  OCR & Image Processing:                               │
│  ├─ Azure CV 0.9.1 (primary)                          │
│  ├─ EasyOCR 1.7.2 (secondary)                         │
│  ├─ Pillow 11.1.0                                     │
│  ├─ OpenCV 4.10.0.84                                  │
│  ├─ MediaPipe 0.10.15                                 │
│  └─ NumPy (1.23.5-1.x)                                │
│         ↓                                               │
│  Data Processing:                                       │
│  ├─ Pandas 2.3.3                                      │
│  ├─ OpenPyXL 3.1.5                                    │
│  └─ Pdfplumber 0.11.5                                 │
│         ↓                                               │
│  Security:                                              │
│  ├─ Python-jose 3.3.0                                 │
│  ├─ Passlib 1.7.4                                     │
│  └─ Bcrypt 4.2.1                                      │
│         ↓                                               │
│  Testing:                                              │
│  ├─ Pytest 8.3.4                                      │
│  └─ Pytest-asyncio 0.24.0                             │
│         ↓                                               │
│  Observability:                                         │
│  ├─ OpenTelemetry SDK 1.27.0                          │
│  ├─ OTEL FastAPI Instrumentation 0.48b0              │
│  └─ Prometheus Instrumentator 7.1.0                   │
│                                                          │
└─────────────────────────────────────────────────────────┘
```

## Cross-Stack Communication

```
┌──────────────────────────────────────────────────────────┐
│               FRONTEND ←→ BACKEND BRIDGE                  │
├──────────────────────────────────────────────────────────┤
│                                                           │
│  Frontend (Browser)                                      │
│  ├─ Axios 1.7.7                                         │
│  └─ JWT token management                               │
│         ↓ HTTPS ↓                                        │
│  FastAPI REST API                                       │
│  ├─ 24+ routers                                         │
│  ├─ OpenAPI docs: /api/docs                           │
│  └─ Health check: /api/health                         │
│         ↓ JSON ↓                                         │
│  Response Validation (Pydantic 2.10.5)                 │
│         ↓                                                │
│  Frontend (React Query caching)                         │
│                                                          │
└──────────────────────────────────────────────────────────┘
```

## Docker Services Orchestration

```
┌──────────────────────────────────────────────────────────┐
│            DOCKER COMPOSE (10 SERVICES)                  │
├──────────────────────────────────────────────────────────┤
│                                                           │
│  TIER 1: Infrastructure                                  │
│  ├─ db (PostgreSQL 15-alpine)                          │
│  │  └─ Health: pg_isready ✓                            │
│  ├─ redis (Redis 7-alpine)                             │
│  │  └─ Health: redis-cli ping ✓                        │
│  └─ otel-collector (0.103.0)                           │
│     └─ Health: Always on ✓                             │
│                                                          │
│  TIER 2: Data & Initialization                          │
│  └─ importer (runs once)                               │
│     ├─ Waits for: db healthy                           │
│     ├─ Tasks: migrations, seeding, import              │
│     └─ Marks: completed_successfully ✓                 │
│                                                          │
│  TIER 3: Application Services                           │
│  ├─ backend (FastAPI dev)                              │
│  │  ├─ Port: 8000                                      │
│  │  ├─ Depends on: db, redis, importer                │
│  │  └─ Health: /api/health ✓                          │
│  ├─ backend-prod (FastAPI prod)                        │
│  │  ├─ Port: 8000 (multi-worker)                      │
│  │  └─ Depends on: db, redis, importer                │
│  └─ frontend (Next.js dev)                             │
│     ├─ Port: 3000                                      │
│     ├─ Depends on: backend                             │
│     └─ Health: HTTP GET / ✓                            │
│                                                          │
│  TIER 4: Management & Observability                     │
│  ├─ adminer (8080)                                      │
│  │  └─ DB management UI                                │
│  ├─ prometheus (9090)                                   │
│  │  └─ Metrics storage                                 │
│  ├─ tempo (3200)                                        │
│  │  └─ Distributed tracing                             │
│  └─ grafana (3001)                                      │
│     └─ Dashboards & visualization                      │
│                                                          │
│  Network: uns-network (bridge)                          │
│  Volumes: postgres_data, redis_data, grafana_data,     │
│           prometheus_data, tempo_data                   │
│                                                          │
│  Startup Order:                                         │
│  db → redis → otel-collector → importer → backend →    │
│  frontend → adminer → tempo → prometheus → grafana     │
│                                                          │
└──────────────────────────────────────────────────────────┘
```

## Version Compatibility Matrix

```
Component          Version    PostgreSQL  Redis   Python   Node   Status
───────────────────────────────────────────────────────────────────────
FastAPI            0.115.6    ✅          ✅      ✅       -      ✅
SQLAlchemy         2.0.36     ✅          -       ✅       -      ✅
Pydantic           2.10.5     ✅          -       ✅       -      ✅
Next.js            16.0.0     -           -       -        ✅     ✅
React              19.0.0     -           -       -        ✅     ✅
TypeScript         5.6.0      -           -       -        ✅     ✅
Tailwind           3.4.13     -           -       -        ✅     ✅
PostgreSQL         15         ✅          -       -        -      ✅
Redis              7          -           ✅      -        -      ✅
Python             3.11       -           -       ✅       -      ✅
Node.js            20         -           -       -        ✅     ✅
```

## Conflict Resolution Map

```
┌─────────────────────────────────────────────────────────────┐
│              KNOWN CONFLICTS & RESOLUTIONS                   │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  1. MediaPipe protobuf<5 Constraint                         │
│     ├─ Cause: MediaPipe 0.10.15 requires protobuf<5       │
│     ├─ Risk: OTEL could conflict                           │
│     └─ Fix: OTEL pinned to 1.27.0 (protobuf compatible)    │
│     Status: ✅ RESOLVED                                    │
│                                                              │
│  2. Critters Peer Dependencies                              │
│     ├─ Cause: Critters 0.0.25 vs Tailwind 3.4            │
│     ├─ Risk: npm install could fail                        │
│     └─ Fix: --legacy-peer-deps flag in Dockerfile          │
│     Status: ✅ MITIGATED                                   │
│                                                              │
│  3. NumPy/Pandas Compatibility                              │
│     ├─ Cause: Pandas 2.3.3 with NumPy 2.0                 │
│     ├─ Risk: Deprecated warnings                           │
│     └─ Fix: numpy>=1.23.5,<2.0.0 constraint              │
│     Status: ✅ COMPATIBLE                                  │
│                                                              │
│  4. Next.js 16 + React 19                                   │
│     ├─ Cause: Major React version bump                      │
│     ├─ Risk: Breaking changes                              │
│     └─ Fix: Next.js 16 explicitly supports React 19       │
│     Status: ✅ COMPATIBLE                                  │
│                                                              │
│  5. FastAPI + Pydantic 2.0                                  │
│     ├─ Cause: Major Pydantic version upgrade              │
│     ├─ Risk: API breaking changes                          │
│     └─ Fix: FastAPI 0.115.6 is v2 native                  │
│     Status: ✅ COMPATIBLE                                  │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

## Test Coverage Matrix

```
Testing Strategy:
├─ Frontend
│  ├─ Unit Tests: Vitest 2.1.5
│  ├─ E2E Tests: Playwright 1.49.0
│  └─ Component Tests: React Testing Library 16.1.0
├─ Backend
│  ├─ Unit Tests: Pytest 8.3.4
│  └─ Async Tests: Pytest-asyncio 0.24.0
└─ Integration
   ├─ API Testing: Via Playwright E2E
   └─ Database Testing: Via Pytest with migrations
```

## Observability Stack Architecture

```
Application Layer
├─ OpenTelemetry SDK 1.27.0 (Backend)
├─ OpenTelemetry Web SDK 2.2.0 (Frontend)
├─ OTEL FastAPI Instrumentation 0.48b0
└─ Prometheus Instrumentator 7.1.0
       ↓
Collection Layer
└─ OpenTelemetry Collector 0.103.0
       ↓
Storage & Analysis
├─ Prometheus v2.52.0 (metrics)
├─ Grafana Tempo 2.5.0 (traces)
└─ Grafana 11.2.0 (visualization)
       ↓
User Interface
└─ http://localhost:3001
   (admin / admin)
```

---

**Status: PRODUCTION READY ✅**  
**Last Validated: 2025-11-12**  
**All Compatibility Checks: PASSED**
