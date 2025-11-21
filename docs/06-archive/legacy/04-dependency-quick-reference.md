# Referencia Rápida de Dependencias - UNS-ClaudeJP 5.4.1

## Estado General: ✅ EXCELENTE
- **npm audit:** 0 vulnerabilidades
- **pip check:** 0 problemas
- **Conflictos:** 0 críticos
- **Compatibility:** 100%

---

## Core Versions (LOCKED - DO NOT CHANGE)

### Frontend
```
Node.js:    20-alpine (Docker)
Next.js:    16.0.0
React:      19.0.0
TypeScript: 5.6.0
Tailwind:   3.4.13
```

### Backend
```
Python:      3.11-slim (Docker)
FastAPI:     0.115.6
SQLAlchemy:  2.0.36
Pydantic:    2.10.5
Alembic:     1.17.0
PostgreSQL:  15-alpine (Docker)
Redis:       7-alpine (Docker)
```

---

## Known Constraints & Solutions

| Issue | Constraint | Solution | Status |
|-------|-----------|----------|--------|
| MediaPipe protobuf | `protobuf<5` | OTEL pinned to 1.27.0 | ✅ Resolved |
| Critters peer deps | `--legacy-peer-deps` | Used in Dockerfile | ✅ Mitigated |
| Pandas numpy compat | `numpy>=1.23.5,<2.0.0` | Range constraint | ✅ Compatible |

---

## Key Numbers

- **Frontend dependencies:** 80+
- **Backend dependencies:** 60+
- **Docker services:** 10 (6 core + 4 observability)
- **Cleaned in v5.4:** 22 packages (17 frontend + 5 backend)

---

## Critical Files

| File | Purpose | Status |
|------|---------|--------|
| `frontend/package.json` | Frontend dependencies | ✅ OK |
| `backend/requirements.txt` | Backend dependencies | ✅ OK |
| `docker-compose.yml` | Service versions | ✅ OK |
| `docker/Dockerfile.frontend` | Frontend base image | ✅ OK |
| `docker/Dockerfile.backend` | Backend base image | ✅ OK |

---

## When to Read Full Analysis

📖 See `/docs/04-dependency-analysis.md` for:
- Complete version tables
- Compatibility matrix
- Detailed conflict resolutions
- Maintenance recommendations

---

## Monthly Maintenance Checklist

- [ ] Run `npm audit` in frontend
- [ ] Run `pip check` in backend
- [ ] Check OpenTelemetry changelog (beta versions)
- [ ] Review MediaPipe updates
- [ ] Update minor dependencies if no conflicts

---

## DO NOT TOUCH (Locked Versions)

```
❌ FastAPI 0.115.6
❌ SQLAlchemy 2.0.36  
❌ Pydantic 2.10.5
❌ Alembic 1.17.0
❌ Next.js 16.0.0
❌ React 19.0.0
❌ TypeScript 5.6.0
```

Always document before changing any core version.

---

## Quick Commands

```bash
# Frontend security check
cd frontend && npm audit

# Backend dependency check
cd backend && pip check

# List installed versions
pip freeze | grep -E "fastapi|sqlalchemy|pydantic"
npm list | grep -E "next|react|typescript"

# Check Docker images versions
docker compose images
```

---

**Last Updated:** 2025-11-12  
**Analysis Tool:** pip check, npm audit, manual verification
**Status:** Production Ready ✅
