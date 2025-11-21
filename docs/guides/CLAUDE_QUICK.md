# CLAUDE_QUICK.md - Referencia Rápida

> **Comandos esenciales y solución rápida de problemas**

## 🚀 Iniciar Sistema

```bash
# Windows
scripts\START.bat

# Linux/macOS
docker compose up -d
docker compose logs -f
```

## 🔧 Comandos Backend (FastAPI)

```bash
# Acceder
docker exec -it uns-claudejp-backend bash

# Migrations
alembic upgrade head
alembic revision --autogenerate -m "description"
alembic downgrade -1

# Import data
python scripts/import_data.py
python scripts/import_candidates_improved.py
python scripts/sync_candidate_employee_status.py

# Tests
pytest backend/tests/ -v
pytest backend/tests/test_auth.py -vs
pytest -k "test_login" -vs
```

## ⚛️ Comandos Frontend (Next.js)

```bash
# Acceder
docker exec -it uns-claudejp-frontend bash

# Development
npm run dev
npm run build
npm run type-check
npm run lint
npm run lint:fix

# Tests
npm test
npm test -- --watch
npm run test:e2e
npm run test:e2e -- --headed
```

## 🗄️ Base de Datos (PostgreSQL)

```bash
# Acceder
docker exec -it uns-claudejp-db psql -U uns_admin -d uns_claudejp

# Ver datos
\dt                              # List tables
\d candidates                    # Describe table
SELECT COUNT(*) FROM candidates; # Count records

# Backup
docker exec uns-claudejp-db pg_dump -U uns_admin uns_claudejp > backup.sql
cat backup.sql | docker exec -i uns-claudejp-db psql -U uns_admin uns_claudejp
```

## 🐛 Troubleshooting Rápido

### Port already in use
```bash
# Windows
netstat -ano | findstr :3000
taskkill /PID <pid> /F
```

### Backend won't start
```bash
docker compose logs backend
docker compose logs -f backend
```

### Frontend blank page
```bash
docker compose logs frontend
# Wait 1-2 min for compilation
```

### Database connection error
```bash
docker exec uns-claudejp-backend alembic upgrade head
docker compose ps db
```

### 401 Unauthorized
```bash
curl http://localhost:8000/api/health
# Verificar: admin / admin123
```

## 🌐 URLs del Sistema

| Servicio | URL | Descripción |
|----------|-----|-------------|
| Frontend | http://localhost:3000 | Next.js app |
| Backend API | http://localhost:8000 | FastAPI |
| API Docs | http://localhost:8000/api/docs | Swagger |
| Adminer | http://localhost:8080 | Database UI |
| Health | http://localhost:8000/api/health | Backend status |

**Login:** `admin` / `admin123`

## 📊 Verificar Estado

```bash
# Todos los servicios
docker compose ps

# Health check
docker compose ps --format "table {{.Name}}\t{{.Status}}"

# Logs en tiempo real
docker compose logs -f --tail=100

# API health
curl http://localhost:8000/api/health
```

## 💾 Backup & Restore

```bash
# Backup
cd scripts
BACKUP_DATOS.bat

# Restore
RESTAURAR_DATOS.bat backup_20251108.sql

# Manual
docker exec uns-claudejp-db pg_dump -U uns_admin uns_claudejp > backup.sql
```

## 🔄 Import/Export

```bash
# Import empleados
docker exec uns-claudejp-backend python scripts/import_data.py

# Import candidatos
docker exec uns-claudejp-backend python scripts/import_candidates_improved.py

# Sincronizar
docker exec uns-claudejp-backend python scripts/sync_candidate_employee_status.py
```

## 📂 Rutas Clave

**Backend:**
- API: `backend/app/api/*.py` (24+ routers)
- Models: `backend/app/models/models.py` (13 tablas)
- Migrations: `backend/alembic/versions/`

**Frontend:**
- Pages: `frontend/app/(dashboard)/*/page.tsx` (45+ pages)
- Components: `frontend/components/*.tsx`
- API client: `frontend/lib/api.ts`
- Themes: `frontend/lib/themes.ts`

## 🚨 Scripts Windows Críticos

| Script | Función |
|--------|---------|
| `START.bat` | Iniciar todos los servicios |
| `STOP.bat` | Detener servicios |
| `LOGS.bat` | Ver logs (menú) |
| `BACKUP_DATOS.bat` | Backup DB |
| `RESTAURAR_DATOS.bat` | Restore DB |
| `REINSTALAR.bat` | Reinstalación completa |
| `HEALTH_CHECK_FUN.bat` | Health check |
| `DIAGNOSTICO_FUN.bat` | Diagnósticos |

## ✅ Verificación Rápida

```bash
# 1. Verificar servicios
docker compose ps

# 2. Verificar health
curl http://localhost:8000/api/health

# 3. Verificar DB
docker exec -it uns-claudejp-db psql -U uns_admin -d uns_claudejp -c "SELECT 1;"

# 4. Verificar frontend
curl http://localhost:3000
```

## 🔐 Credenciales

**Sistema (Frontend/Backend):**
- Usuario: `admin`
- Contraseña: `admin123`

**Adminer (Database):**
- Usuario: `uns_admin`
- Password: (ver .env o POSTGRES_PASSWORD)

---

**💡 Tip:** `LOGS.bat` tiene menú interactivo para ver logs de cualquier servicio
