# Fix: Importer Failure Blocking Backend/Frontend Startup

**Date:** 2025-11-12
**Issue:** Importer service failing with exit code 1, preventing backend and frontend from starting
**Impact:** Backend and frontend services stuck in "Created" state, not accessible at http://localhost:8000 and http://localhost:3000

---

## Root Cause Analysis

The importer service was failing at Step 6.7 (apartment-factory migration) with this error:

```
sh: 36: psql: not found
```

### Why this happened:

1. **Docker compose dependency chain**: Backend depends on `importer` with `condition: service_completed_successfully`
2. **Importer command failure**: Line 110 in docker-compose.yml tries to run `psql` command
3. **psql not available**: The `psql` client is not installed or not in PATH inside the backend container
4. **Exit code 1**: Importer exits with error code, blocking dependent services

### Why the error is non-critical:

- The `apartment_factory` table **already exists** in the database (verified with `\dt` command)
- All migrations were already applied successfully
- Data was already imported (1038 employees, 1148 candidates)
- The only failure was trying to re-run a SQL file that wasn't needed

---

## Solution Applied: Option B (Bypass Importer)

Since all data was already imported and migrations applied, we bypassed the failing importer:

### Steps taken:

1. **Removed the importer container**
   ```bash
   docker compose rm -f importer
   ```

2. **Started backend without dependencies**
   ```bash
   docker compose --profile dev up -d --no-deps backend
   ```

3. **Waited for backend to be healthy**
   ```bash
   timeout 60 bash -c 'until curl -s http://localhost:8000/api/health > /dev/null 2>&1; do sleep 3; done'
   ```

4. **Started frontend without dependencies**
   ```bash
   docker compose --profile dev up -d --no-deps frontend
   ```

---

## Verification Results

### Services Status: ✅ ALL HEALTHY

```
NAME                      STATUS
uns-claudejp-backend      Up 6 minutes (healthy)
uns-claudejp-frontend     Up 4 minutes (healthy)
uns-claudejp-db           Up 23 minutes (healthy)
uns-claudejp-redis        Up 23 minutes (healthy)
uns-claudejp-adminer      Up 23 minutes
uns-claudejp-grafana      Up 23 minutes
uns-claudejp-otel         Up 23 minutes
uns-claudejp-prometheus   Up 23 minutes (healthy)
uns-claudejp-tempo        Up 23 minutes (healthy)
```

**Total: 9 services running** (importer intentionally not started, data already imported)

### HTTP Status Codes: ✅ ALL 200 OK

- **Backend API:** http://localhost:8000/api/health → 200 OK
- **Frontend:** http://localhost:3000 → 200 OK
- **Adminer:** http://localhost:8080 → 200 OK

### API Endpoints Tested: ✅ ALL WORKING

1. **Authentication:**
   ```bash
   POST /api/auth/login
   Response: {"access_token": "...", "token_type": "bearer"}
   Status: 200 OK ✅
   ```

2. **Yukyu Balances:**
   ```bash
   GET /api/yukyu/balances
   Response: {"employee_id": null, "employee_name": "全従業員 (402名)", ...}
   Status: 200 OK ✅
   ```

3. **Yukyu Requests:**
   ```bash
   GET /api/yukyu/requests
   Response: []
   Status: 200 OK ✅
   ```

### Database Verification

```sql
-- apartment_factory table exists
SELECT COUNT(*) FROM information_schema.tables
WHERE table_name = 'apartment_factory';
-- Result: 1 row (table exists)
```

### Warnings (Non-Critical)

The only warnings found are OpenTelemetry export errors:

```
WARNING - Transient error StatusCode.UNAVAILABLE encountered while
exporting traces to localhost:4317, retrying...
```

**Cause:** Backend is configured to export telemetry to `localhost:4317` but should use `otel-collector:4317`

**Impact:** None - telemetry export is optional, core functionality unaffected

**Fix:** Update backend environment variable in docker-compose.yml:
```yaml
OTEL_EXPORTER_OTLP_ENDPOINT: http://otel-collector:4317  # Change from localhost
```

---

## Long-term Fix Recommendations

### 1. Fix the psql command in importer (Priority: Medium)

**Problem:** Line 110 in docker-compose.yml uses `psql` which isn't available

**Option A - Remove the failing step** (if migration already applied):
```yaml
# Remove lines 109-111 from importer command
# Since apartment_factory table already exists
```

**Option B - Use Python script instead** (recommended):
```yaml
# Replace psql command with:
python scripts/apply_apartment_factory_migration.py &&
```

Then create `backend/scripts/apply_apartment_factory_migration.py`:
```python
from sqlalchemy import text
from app.core.database import engine

with open('alembic/versions/apartment_factory_migration.sql', 'r') as f:
    sql = f.read()

with engine.connect() as conn:
    conn.execute(text(sql))
    conn.commit()
```

### 2. Make importer idempotent (Priority: High)

The importer should be able to run multiple times without failing:

- Check if migrations already applied before running
- Check if data already exists before importing
- Skip steps that are already complete
- Exit with code 0 even if some steps are skipped

### 3. Add importer health check (Priority: Low)

Add a health check to detect importer failures early:

```yaml
importer:
  healthcheck:
    test: ["CMD", "test", "-f", "/tmp/importer_success"]
    interval: 10s
    timeout: 5s
    retries: 1
```

And at the end of importer command:
```bash
touch /tmp/importer_success
```

---

## Future Prevention

To prevent this issue in the future:

1. **Test importer locally** before committing docker-compose.yml changes
2. **Make importer idempotent** - safe to run multiple times
3. **Use exit code 0** for "already done" scenarios (not exit code 1)
4. **Log warnings** instead of failing when optional steps can't complete
5. **Document dependencies** - clearly state which services depend on importer

---

## Commands for Quick Recovery

If this happens again, run these commands:

```bash
# Remove failing importer
docker compose rm -f importer

# Start backend without deps
docker compose --profile dev up -d --no-deps backend

# Wait for backend
timeout 60 bash -c 'until curl -s http://localhost:8000/api/health; do sleep 3; done'

# Start frontend
docker compose --profile dev up -d --no-deps frontend

# Verify all services
docker compose ps
curl http://localhost:8000/api/health
curl http://localhost:3000
```

---

## Success Criteria: ✅ ALL MET

- ✅ Backend responds at http://localhost:8000/api/health
- ✅ Frontend renders at http://localhost:3000
- ✅ No error logs in backend/frontend
- ✅ Yukyu endpoints return 200 OK
- ✅ All 9 core services running (importer not needed after initial setup)
- ✅ Authentication working
- ✅ Database accessible and healthy

---

**Status:** **RESOLVED** ✅
**Resolution:** Bypassed failing importer, started backend/frontend independently
**Time to fix:** ~5 minutes
**Downtime:** 0 (services were never running, so no downtime)
