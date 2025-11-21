# QUICK DEBUG REFERENCE - For AI Agents

> **Fast lookup table** - When something breaks, find it here and get the fix immediately.

## 🚨 ERROR → SOLUTION MATRIX

### BACKEND ERRORS

| Error in Logs | Cause | File to Check | Fix Command |
|---------------|-------|---|---|
| `ModuleNotFoundError: No module named 'xxx'` | Missing dependency | `backend/requirements.txt` | `docker compose up backend` (rebuild) |
| `sqlalchemy.exc.ProgrammingError: ... column does not exist` | DB schema mismatch | `/backend/app/models/models.py` | `docker exec backend alembic upgrade head` |
| `sqlalchemy.exc.IntegrityError: ... violates foreign key constraint` | Parent record missing | `/backend/app/models/models.py` (relationships) | Check parent record exists before insert |
| `psycopg2.OperationalError: could not connect to server` | DB not running | `docker-compose.yml` db service | `docker compose restart db` |
| `redis.exceptions.ConnectionError` | Redis not running | `docker-compose.yml` redis service | `docker compose restart redis` |
| `jwt.ExpiredSignatureError` | Token expired | `/backend/app/core/security.py` | Client: call `/api/auth/refresh` |
| `jwt.InvalidTokenError` | Bad/tampered token | `/backend/app/core/security.py` | Client: re-login to get new token |
| `HTTPException(status_code=401)` | User not authenticated | `/backend/app/core/deps.py` | Add JWT token to request header |
| `HTTPException(status_code=403)` | Insufficient role | `/backend/app/core/security.py` | Check `check_role()` function |
| `ValueError: ... invalid literal for int()` | Type conversion error | `backend/app/schemas/` | Check schema validation, fix data type |
| `requests.exceptions.ConnectionError: ... refused` | Backend not running | `docker compose ps` | `docker compose up backend` |
| `timeout waiting for response` | Slow query/external API | `/backend/app/services/` | Check Prometheus for slow queries |
| `Traceback: ... (most recent call last)` | Generic error | `docker compose logs backend` | Read full traceback, search by error message |

### FRONTEND ERRORS

| Error in Browser Console | Cause | File to Check | Fix |
|---|---|---|---|
| `Uncaught TypeError: Cannot read property 'xxx' of undefined` | Component state not initialized | Component `.tsx` file | Check useState() initialization |
| `404 Not Found (GET /api/...)` | API endpoint doesn't exist | `/backend/app/api/` | Create missing endpoint or check route name |
| `401 Unauthorized (GET /api/...)` | Missing JWT token | `frontend/lib/api.ts` | Check localStorage has 'token', verify not expired |
| `Blank white page` | Component crash or missing page | Check browser console first | Look for actual error in console |
| `TypeError: Cannot read property 'map' of undefined` | Array not initialized | Component file | Initialize with `[]` in useState |
| `TypeError: setXxx is not a function` | Zustand store not initialized | `frontend/stores/` | Import store correctly: `const { xxx } = useStore()` |
| `CORS error: ... blocked by CORS policy` | Backend doesn't allow frontend origin | `backend/app/main.py` (CORS config) | Check FRONTEND_URL in .env |
| `Theme not applying / colors wrong` | Theme not loaded | `frontend/lib/themes.ts` | Clear browser cache (Ctrl+Shift+Delete) |
| `Module not found: 'xxx'` | Missing npm package | `frontend/package.json` | `docker exec frontend npm install` |

### DATABASE ERRORS

| Error | Cause | Check | Fix |
|---|---|---|---|
| `psycopg2.IntegrityError: duplicate key value violates unique constraint` | Duplicate unique field | `/backend/app/models/models.py` (unique=True) | Check for duplicates, delete or skip |
| `psycopg2.IntegrityError: ... violates not-null constraint` | Required field is NULL | Schema/schema validation | Add missing required value |
| `psycopg2.InternalError: catalog is locked` | Concurrent DDL operations | Migration state | Retry or `docker compose restart db` |
| `statement timeout` | Query too slow (usually N+1) | `/backend/app/services/` (query optimization) | Add indexes, optimize ORM query |
| `pg_restore: error: could not read file` | Backup file corrupted/missing | `./backups/` directory | Use different backup or recreate data |

### DOCKER ERRORS

| Error | Cause | Check | Fix |
|---|---|---|---|
| `docker: command not found` | Docker not installed | Docker Desktop | Install Docker from docker.com |
| `permission denied while trying to connect to Docker daemon` | Docker daemon not running | Docker Desktop | Start Docker Desktop |
| `port 3000 is already allocated` | Port in use | `netstat -ano \| findstr :3000` | Kill process or change port |
| `Service 'backend' failed to build` | Dockerfile or dependency error | Build logs | `docker compose up backend` to see error |
| `Health check failed` | Service not healthy | `docker compose ps` | `docker compose logs [service]` to see why |
| `out of memory` | Container RAM limit exceeded | Docker settings | Increase Docker memory in Desktop settings |
| `no space left on device` | Disk full | `df -h` | Clear Docker images/volumes: `docker system prune` |

---

## 🔍 DIAGNOSTIC CHECKLIST

**Use this when something is broken but you don't know what**:

```bash
# Step 1: Check all services running
docker compose ps
# Expected: All services with "healthy" or "running" status

# Step 2: Check for errors
docker compose logs --tail=50

# Step 3: Check specific service if found error
docker compose logs -f [service-name]

# Step 4: If database error
docker exec -it uns-claudejp-db psql -U uns_admin -d uns_claudejp
\dt                              # List tables
SELECT COUNT(*) FROM candidates; # Check data exists

# Step 5: If backend error
docker exec -it uns-claudejp-backend bash
cd /app && alembic current       # Check migrations applied

# Step 6: If frontend error
Open browser DevTools (F12) → Console tab
# Look for JavaScript errors

# Step 7: Test connectivity
curl http://localhost:8000/api/health
# Should return JSON with status

# Step 8: Check disk/memory
docker stats
# Watch for high memory usage

# Step 9: Restart everything
docker compose down
docker compose up -d
```

---

## ⚡ FASTEST FIXES (Copy & Paste)

### "Everything is broken, restart it"
```bash
docker compose down
docker compose up -d
docker compose logs -f
```

### "Database has wrong schema"
```bash
docker exec backend alembic upgrade head
docker exec backend python scripts/create_admin_user.py
```

### "Admin user lost/forgotten"
```bash
docker exec backend python scripts/create_admin_user.py
# Username: admin
# Password: admin123
```

### "Frontend won't load"
```bash
docker compose restart frontend
# Wait 30 seconds for startup
docker compose logs frontend
```

### "API returns 500 errors"
```bash
docker compose logs backend -f
# Read last 20 lines for exception
```

### "Can't login - 401 error"
```bash
# Backend: Verify user exists
docker exec -it uns-claudejp-db psql -U uns_admin -d uns_claudejp
SELECT * FROM users WHERE username='admin';

# Frontend: Clear localStorage
# Open DevTools → Application → localStorage → click "Clear All"
```

### "Database connection refused"
```bash
docker compose restart db
# Wait 10 seconds
docker compose logs db
```

### "Migrations failing"
```bash
docker exec backend alembic current          # See current migration
docker exec backend alembic history          # See all migrations
docker exec backend alembic upgrade head     # Apply latest
```

### "OCR not working"
```bash
# Check credentials in .env
cat .env | grep AZURE_VISION

# Test Azure connection
docker exec backend python -c "from azure.ai.vision import VisionServiceOptions; print('Azure OK')"
```

### "Port already in use"
```bash
# Windows
netstat -ano | findstr :3000
taskkill /PID <PID> /F

# Linux
lsof -i :3000
kill -9 <PID>

# Or just let Docker handle it
docker compose down -v
docker compose up -d
```

---

## 🎯 ERROR PATTERNS

### "Cannot find X" Errors
Usually means **file/route doesn't exist**

| What | Where to Check | How to Fix |
|---|---|---|
| API endpoint `/api/xxx/` | `/backend/app/api/` routers | Add endpoint to correct router file |
| Frontend page `/candidates/` | `/frontend/app/(dashboard)/candidates/` | Create `page.tsx` in correct folder |
| Database column | `/backend/app/models/models.py` | Add column to model, create migration |
| npm package | `frontend/package.json` | Run `npm install [package]` |
| Python module | `backend/requirements.txt` | Add to file, rebuild Docker image |

### "Validation Failed" Errors
Usually means **data format wrong**

| Fix | Where to Check |
|---|---|
| Check schema definition | `/backend/app/schemas/[feature].py` |
| Verify required fields | Schema file → required fields |
| Check type (int vs string) | Frontend form vs schema |
| Check regex pattern if present | Schema file → regex pattern |
| Look at Pydantic error message | Detailed validation error |

### "Permission Denied" Errors
Usually means **user doesn't have role or JWT is invalid**

| Fix | Where to Check |
|---|---|
| Verify JWT token exists | Browser DevTools → localStorage |
| Check user role | Database: `SELECT role FROM users` |
| Verify endpoint has role check | `/backend/app/api/[router].py` → @router.get decorator |
| Check role hierarchy | `/backend/app/core/security.py` → `check_role()` |

### "Timeout" Errors
Usually means **query is slow or external API is slow**

| Fix | Where to Check |
|---|---|
| Optimize database query | `/backend/app/services/` → N+1 problem |
| Add database indexes | `/backend/app/models/models.py` |
| Check external API (Azure, etc) | Network logs, API status page |
| Increase timeout value | `/backend/app/core/config.py` |

---

## 📊 CRITICAL FILE LOCATIONS

**When you need to fix X, go to:**

| To Fix | Primary File | Secondary Files |
|---|---|---|
| API endpoint | `/backend/app/api/[router].py` | `schemas/`, `services/` |
| Database schema | `/backend/app/models/models.py` | `alembic/versions/` |
| Frontend page | `/frontend/app/(dashboard)/[feature]/page.tsx` | Components in `/components/` |
| Frontend component | `/frontend/components/[feature]/` | Related components |
| Authentication | `/backend/app/core/security.py` | `core/deps.py`, `api/auth.py` |
| Data validation | `/backend/app/schemas/[feature].py` | Related models |
| Business logic | `/backend/app/services/[feature].py` | Related API router |
| Configuration | `.env` | `backend/app/core/config.py` |
| Docker services | `docker-compose.yml` | `docker/` folder |
| Frontend state | `frontend/stores/` | `contexts/`, `hooks/` |
| Styling/Themes | `frontend/lib/themes.ts` | Component CSS classes |
| Database queries | `/backend/app/services/` | ORM models |
| Migrations | `backend/alembic/versions/` | `models/models.py` |

---

## 🔐 CREDENTIALS & CONFIG

**Quick reference** (from `.env`):

```
Frontend:          http://localhost:3000
Backend API:       http://localhost:8000
Backend via Nginx: http://localhost/api

Default Admin:
- Username: admin
- Password: admin123

Database:
- Host: db (or localhost:5432)
- User: uns_admin
- Pass: [CHECK .env]
- DB: uns_claudejp

JWT Secret: [CHECK .env] (SECRET_KEY)

Azure OCR:
- Key: [CHECK .env] (AZURE_VISION_KEY)
- Endpoint: [CHECK .env] (AZURE_VISION_ENDPOINT)
```

---

## 🔄 SERVICE DEPENDENCY CHAIN

**Order matters** - Services depend on each other:

```
1. db (PostgreSQL)          - MUST start first
2. redis                    - Cache for session
3. importer                 - One-time data setup
4. backend (FastAPI)        - Waits for db + redis healthy
5. frontend (Next.js)       - Waits for backend healthy
6. otel-collector           - Telemetry collection
7. prometheus               - Metrics storage
8. tempo                    - Trace storage
9. grafana                  - Dashboards
10. nginx                   - Reverse proxy
11. adminer                 - DB UI
12. backup                  - Automated backups
```

**If Y won't start, check if X is healthy**:
- backend won't start? → Check `db` and `redis` healthy
- frontend won't start? → Check `backend` healthy
- nginx won't start? → Check `backend` and `frontend` healthy

---

## 📈 MONITORING QUICK ACCESS

| What | URL | Credentials |
|---|---|---|
| API Docs (Swagger) | http://localhost:8000/api/docs | None |
| Database UI | http://localhost:8080 | PostgreSQL creds |
| Metrics Export | http://localhost:8000/metrics | None (Prometheus scrapes) |
| Prometheus | http://localhost:9090 | None |
| Grafana Dashboards | http://localhost:3001 | admin / admin |
| Tempo Traces | http://localhost:3200 | None |
| Backend Health | http://localhost:8000/api/health | None |
| Nginx Status | http://localhost/nginx-health | None |

---

## 🚨 COMMON "I BROKE IT" SCENARIOS

### "I modified docker-compose.yml"
```bash
git checkout docker-compose.yml     # Revert changes
docker compose down -v               # Clean everything
docker compose up -d                 # Start fresh
```

### "I modified requirements.txt or package.json"
```bash
git checkout backend/requirements.txt  # OR
git checkout frontend/package.json

docker compose down -v
docker compose up -d
```

### "I accidentally deleted something"
```bash
git status                           # See what's deleted
git checkout [filename]              # Restore file

# If you committed bad changes:
git log --oneline | head            # Find commit ID
git revert [commit-id]              # Create new commit that undoes it
```

### "Database is corrupted"
```bash
# If you have a backup
cat backups/backup_YYYYMMDD.sql | docker exec -i uns-claudejp-db psql -U uns_admin uns_claudejp

# If no backup, start fresh
docker compose down -v
docker compose up -d
# importer service will recreate everything
```

### "Migrations are stuck"
```bash
# Check current state
docker exec backend alembic current

# Downgrade one version
docker exec backend alembic downgrade -1

# Upgrade to latest
docker exec backend alembic upgrade head
```

---

## ✅ VERIFICATION TESTS

**Run these to verify everything works**:

```bash
# 1. All services healthy
docker compose ps
# All should show "healthy" or "running"

# 2. Database responding
curl http://localhost:8000/api/health
# Should return JSON

# 3. Frontend accessible
curl http://localhost:3000
# Should return HTML

# 4. Admin user exists
docker exec -it uns-claudejp-db psql -U uns_admin -d uns_claudejp -c "SELECT username FROM users LIMIT 1;"
# Should return "admin"

# 5. Migrations applied
docker exec backend alembic current
# Should show: [current] 12a3b4c5d6e7f8 (or similar)

# 6. API documentation
curl http://localhost:8000/api/docs
# Should return Swagger UI HTML

# 7. Test login
curl -X POST http://localhost:8000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"admin123"}'
# Should return JWT token
```

---

## 🎯 WHEN IN DOUBT

1. **Check if service is running**: `docker compose ps`
2. **Read the error message carefully** - it usually tells you what's wrong
3. **Check the logs**: `docker compose logs [service] | tail -50`
4. **Search this document** for error message keywords
5. **Check the INFRASTRUCTURE_MAP.md** for detailed explanations
6. **Verify configuration**: Check `.env` file has all required values
7. **Restart the service**: `docker compose restart [service]`
8. **Restart everything**: `docker compose down && docker compose up -d`

---

**Last Updated**: 2025-11-16
**For**: All AI Agents
**Use when**: You need to fix something NOW

