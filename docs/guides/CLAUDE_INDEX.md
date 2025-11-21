# CLAUDE - Índice de Documentación

> **Archivo índice para guiar a Claude Code y desarrolladores por la documentación especializada**

## 📚 Documentos de Referencia Rápida

| Archivo | Contenido | Cuándo Usar |
|---------|-----------|-------------|
| **[📋 CLAUDE.md](CLAUDE.md)** | Documentación completa del proyecto | Para vista general y contexto completo |
| **[🔧 CLAUDE_BACKEND.md](CLAUDE_BACKEND.md)** | **Solo Backend FastAPI** - APIs, DB, modelos | Al trabajar con backend, APIs, base de datos |
| **[⚛️ CLAUDE_FRONTEND.md](CLAUDE_FRONTEND.md)** | **Solo Frontend Next.js** - Páginas, componentes, UI | Al trabajar con frontend, React, UI |
| **[🚨 CLAUDE_RULES.md](CLAUDE_RULES.md)** | **Solo Reglas Críticas** - No hacer, archivos protegidos | Antes de hacer cualquier cambio |
| **[🚀 CLAUDE_QUICK.md](CLAUDE_QUICK.md)** | Comandos esenciales y troubleshooting | Referencia rápida diaria |

## 🎯 Guía de Lectura por Tarea

### Si vas a trabajar en **BACKEND**:
1. Lee **[CLAUDE_RULES.md](CLAUDE_RULES.md)** primero (5 min)
2. Consulta **[CLAUDE_BACKEND.md](CLAUDE_BACKEND.md)** (10 min)
3. Revisa sección específica en **[CLAUDE.md](CLAUDE.md)** si necesitas contexto

### Si vas a trabajar en **FRONTEND**:
1. Lee **[CLAUDE_RULES.md](CLAUDE_RULES.md)** primero (5 min)
2. Consulta **[CLAUDE_FRONTEND.md](CLAUDE_FRONTEND.md)** (10 min)
3. Revisa sección específica en **[CLAUDE.md](CLAUDE.md)** si necesitas contexto

### Si vas a hacer **CAMBIOS IMPORTANTES**:
1. Lee **[CLAUDE_RULES.md](CLAUDE_RULES.md)** ⚠️ (OBLIGATORIO)
2. Lee **[CLAUDE.md](CLAUDE.md)** completo (15 min)
3. Consulta archivos especializados según necesites

### Si solo necesitas **COMANDOS**:
- Ve directo a **[CLAUDE_QUICK.md](CLAUDE_QUICK.md)** (2 min)

## 🏗️ Arquitectura del Proyecto

```
UNS-ClaudeJP-5.4/
├── CLAUDE_INDEX.md        ← Este archivo
├── CLAUDE.md              ← Documentación completa (1,288 líneas)
├── CLAUDE_BACKEND.md      ← Solo backend (FastAPI, DB)
├── CLAUDE_FRONTEND.md     ← Solo frontend (Next.js, React)
├── CLAUDE_RULES.md        ← Solo reglas críticas
├── CLAUDE_QUICK.md        ← Comandos esenciales
├── .claude/               ← Sistema de agentes
└── [resto del proyecto]
```

## ⚡ Comandos Esenciales (Preview)

### Iniciar Sistema
```bash
# Windows
scripts\START.bat

# Linux/macOS
docker compose up -d
```

### Backend (FastAPI)
```bash
# Migrations
alembic upgrade head
alembic revision --autogenerate -m "description"

# Tests
pytest backend/tests/ -v
pytest backend/tests/test_auth.py -vs
```

### Frontend (Next.js)
```bash
# Development
npm run dev
npm run type-check
npm run lint

# Tests
npm test
npm run test:e2e
```

### Database
```bash
# PostgreSQL
docker exec -it uns-claudejp-db psql -U uns_admin -d uns_claudejp

# Import data
docker exec uns-claudejp-backend python scripts/import_data.py
```

## 🔗 URLs del Sistema

| Servicio | URL | Credenciales |
|----------|-----|-------------|
| Frontend | http://localhost:3000 | - |
| Backend API | http://localhost:8000 | - |
| API Docs | http://localhost:8000/api/docs | Swagger |
| Adminer | http://localhost:8080 | `uns_admin` / `POSTGRES_PASSWORD` |
| Health | http://localhost:8000/api/health | - |

**Login por defecto:** `admin` / `admin123`

## 📊 Stack Tecnológico (Resumen)

| Layer | Technology | Version |
|-------|-----------|---------|
| Frontend | Next.js | 16.0.0 |
| UI | React | 19.0.0 |
| Type Safety | TypeScript | 5.6 |
| Backend | FastAPI | 0.115.6 |
| DB | PostgreSQL | 15 |
| ORM | SQLAlchemy | 2.0.36 |

## 🚨 Primero Lee

⚠️ **NUNCA MODIFIQUES SIN LEER:**
- Archivos en `scripts/` (críticos)
- `docker-compose.yml` (orquestación)
- `.env` (configuración)
- `.claude/` (sistema de agentes)
- `backend/alembic/versions/` (migraciones)

## 📖 Documentación Adicional

- **[README.md](README.md)** - Vista general del proyecto
- **[docs/INDEX.md](docs/INDEX.md)** - Índice de toda la documentación
- **[.github/copilot-instructions.md](.github/copilot-instructions.md)** - Reglas para IAs

---

**Para desarrolladores nuevos:** Empieza con `CLAUDE_QUICK.md` → `CLAUDE_RULES.md` → archivo específico
