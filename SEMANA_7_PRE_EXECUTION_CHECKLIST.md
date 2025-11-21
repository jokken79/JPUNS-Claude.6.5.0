# SEMANA 7: Pre-Execution Checklist

**Purpose:** Verify all prerequisites before executing performance, security, and observability phases
**Status:** 🟡 READY FOR VERIFICATION
**Date Prepared:** 2025-11-19

---

## ✅ System Requirements

### Docker & Environment
- [ ] Docker is installed and running
- [ ] `docker --version` returns version 20.10+
- [ ] `docker compose --version` returns version 2.0+
- [ ] Minimum 8GB RAM available
- [ ] Minimum 2GB disk space for reports and logs
- [ ] All 12 Docker services healthy: `docker compose ps`

### Tools & Dependencies
- [ ] `curl` command available for API testing
- [ ] `psql` available for database queries
- [ ] `jq` available for JSON parsing (optional, helpful)
- [ ] Git installed and configured
- [ ] Python 3.11+ available in backend container

### Credentials & Access
- [ ] PostgreSQL connection working (test with `docker exec -it uns-claudejp-db psql -U uns_admin -d uns_claudejp -c "SELECT 1;"`
- [ ] Backend container accessible: `docker exec uns-claudejp-backend echo OK`
- [ ] Frontend container accessible: `docker exec uns-claudejp-frontend echo OK`
- [ ] Grafana accessible at http://localhost:3001 (default: admin/admin)
- [ ] Prometheus accessible at http://localhost:9090

---

## 🔧 Docker Services Health

### Core Services Status
```bash
# Run this and verify all show "Up" status
docker compose ps
```

- [ ] **db** (PostgreSQL) - Status: Up
- [ ] **redis** (Cache) - Status: Up
- [ ] **backend** (FastAPI) - Status: Up
- [ ] **frontend** (Next.js) - Status: Up
- [ ] **adminer** (Database UI) - Status: Up

### Observability Services Status
```bash
# Verify telemetry stack
docker compose ps | grep -E "otel|prometheus|grafana|tempo"
```

- [ ] **otel-collector** - Status: Up
- [ ] **tempo** (Tracing) - Status: Up
- [ ] **prometheus** (Metrics) - Status: Up
- [ ] **grafana** (Dashboards) - Status: Up
- [ ] **nginx** (Reverse Proxy) - Status: Up
- [ ] **backup** (Database Backup) - Status: Up

### Service Health Verification

```bash
# Database health
docker exec -it uns-claudejp-db psql -U uns_admin -d uns_claudejp -c "SELECT version();"
```
- [ ] PostgreSQL responding and version 15+

```bash
# Redis health
docker exec uns-claudejp-redis redis-cli ping
```
- [ ] Redis responds with "PONG"

```bash
# Backend health
curl http://localhost:8000/api/health
```
- [ ] Backend returns health status

```bash
# OpenTelemetry Collector
curl http://localhost:4318/health
```
- [ ] otel-collector health check passes

```bash
# Prometheus
curl http://localhost:9090/-/healthy
```
- [ ] Prometheus is healthy

```bash
# Grafana
curl http://localhost:3001/api/health
```
- [ ] Grafana is accessible

```bash
# Tempo
curl http://localhost:3200/status
```
- [ ] Tempo is running

---

## 📊 Data & Coverage Reports

### SEMANA 6.4 Coverage Reports

```bash
# Verify coverage reports exist from previous phase
ls -lh coverage/backend/
ls -lh coverage/frontend/
```

- [ ] `coverage/backend/coverage.json` exists
- [ ] `coverage/backend/html/index.html` exists
- [ ] `coverage/frontend/coverage/coverage.json` exists
- [ ] `coverage/frontend/lcov-report/index.html` exists
- [ ] Coverage percentages documented (backend %, frontend %)

### Database State

```bash
# Verify database has test/demo data
docker exec -it uns-claudejp-db psql -U uns_admin -d uns_claudejp -c "SELECT COUNT(*) as table_count FROM pg_tables WHERE schemaname='public';"
```

- [ ] Database has 50+ tables (public schema)
- [ ] Sample data exists for analysis

```bash
# Check key tables
docker exec -it uns-claudejp-db psql -U uns_admin -d uns_claudejp -c "SELECT COUNT(*) as candidates FROM candidates; SELECT COUNT(*) as employees FROM employees; SELECT COUNT(*) as timer_cards FROM timer_cards;"
```

- [ ] candidates table has records (for analysis)
- [ ] employees table has records
- [ ] timer_cards table has records

---

## 🔍 Phase 7.1: Performance Analysis

### Required Tools & Data

```bash
# Verify performance analysis tools
docker exec uns-claudejp-backend python -c "import psycopg2, sqlalchemy; print('✅ Python dependencies OK')"
```

- [ ] Backend Python dependencies available
- [ ] Can execute psycopg2 queries for analysis

```bash
# Check if slow query logging is enabled (optional)
docker exec -it uns-claudejp-db psql -U uns_admin -d uns_claudejp -c "SHOW log_min_duration_statement;"
```

- [ ] Can access PostgreSQL logs and statistics

### Prometheus Metrics Available

```bash
# Verify metrics are being collected
curl -s http://localhost:9090/api/v1/query?query=up | grep -q '"value":\[' && echo "✅ Metrics available"
```

- [ ] Prometheus has metrics from backend service
- [ ] Metrics span at least 1 hour of data (for baselines)

### Pre-Phase 7.1 Tasks

- [ ] Close all unnecessary applications to reduce system noise
- [ ] Ensure stable system state (no heavy background jobs)
- [ ] Note current system load: `uptime`
- [ ] Clear recent logs: `docker compose logs --tail 10 backend`

---

## 🔒 Phase 7.2: Security Audit

### Security Scanning Tools

```bash
# Install security tools in containers
docker exec uns-claudejp-backend pip install bandit safety -q
docker exec uns-claudejp-frontend npm install snyk eslint-plugin-security -g -q
```

- [ ] bandit installed in backend (Python security scanner)
- [ ] safety installed in backend (dependency vulnerability scanner)
- [ ] snyk available for frontend (optional)
- [ ] eslint-plugin-security available

### Dependency Inventory

```bash
# Backend dependencies
docker exec uns-claudejp-backend pip list | wc -l
```

- [ ] Backend has ~50+ installed packages (verify count)
- [ ] No obsolete or orphaned packages visible

```bash
# Frontend dependencies
docker exec uns-claudejp-frontend npm list | wc -l
```

- [ ] Frontend has ~40+ installed packages (verify count)

### Pre-Phase 7.2 Tasks

- [ ] Backup current .env file (contains credentials)
- [ ] Note current SECRET_KEY and JWT settings
- [ ] Create list of third-party services (Azure OCR, AI Gateway, etc.)
- [ ] Document current authentication mechanisms
- [ ] Note any known security considerations from installation

---

## 📈 Phase 7.3: Observability Validation

### OpenTelemetry Integration

```bash
# Verify otel-collector is receiving data
docker compose logs otel-collector | tail -20 | grep -i "received"
```

- [ ] otel-collector showing "received" logs (data flowing in)

```bash
# Check data is being exported to Tempo
docker compose logs tempo | tail -20 | grep -i "trace"
```

- [ ] Tempo showing incoming traces

```bash
# Verify Prometheus scrape targets
curl -s http://localhost:9090/api/v1/targets | jq '.data.activeTargets | length'
```

- [ ] Prometheus has 3+ active scrape targets (backend, prometheus, otel-collector)

### Grafana Dashboards

```bash
# Access Grafana and verify dashboards exist
curl -s -u admin:admin http://localhost:3001/api/search?query=dashboard | jq '.[] | .title'
```

- [ ] At least 2-3 dashboards visible
- [ ] "Backend" or "FastAPI" dashboard exists
- [ ] Prometheus data source configured

### Baseline Metrics Availability

```bash
# Check if we have 1+ hour of metric data
curl -s 'http://localhost:9090/api/v1/query?query=http_requests_total' | jq '.data.result | length'
```

- [ ] Prometheus has http request metrics
- [ ] Can query rate() and other time-series functions

### Pre-Phase 7.3 Tasks

- [ ] Review current Grafana dashboards (if any exist)
- [ ] Document current alert rules (if any)
- [ ] Note Tempo trace sampling rate (default: 100% in dev)
- [ ] Note OpenTelemetry collector configuration

---

## 🚀 Pre-Execution Preparation (Timeline)

### 1 Hour Before Execution

- [ ] Review SEMANA_7_EXECUTION_PLAN.md completely
- [ ] Close all unnecessary applications
- [ ] Ensure stable internet connection (for telemetry)
- [ ] Have Grafana (http://localhost:3001) open in browser
- [ ] Have database client ready (adminer or psql)

### 30 Minutes Before

- [ ] Clear Docker build cache: `docker builder prune -a --force`
- [ ] Review resource availability: `docker stats --no-stream`
- [ ] Document current system load: `uptime`
- [ ] Confirm all services healthy: `docker compose ps`
- [ ] Prepare terminal windows:
  - Terminal 1: Execution (main)
  - Terminal 2: Log monitoring (`docker compose logs -f backend`)
  - Terminal 3: Resource monitoring (`docker stats`)
  - Terminal 4: Grafana/reporting

### 10 Minutes Before

- [ ] Make final git commit: `git status` (should be clean)
- [ ] Verify all scripts are executable: `ls -la scripts/run_semana_7_*.sh`
- [ ] Review success criteria document
- [ ] Set up monitoring dashboards in Grafana
- [ ] Open text editor for notes (to capture observations)

### 5 Minutes Before

- [ ] Take screenshot of system state
- [ ] Note exact start time
- [ ] Confirm ready to begin
- [ ] Have this checklist open for reference

---

## 📋 Execution Readiness Sign-Off

### Pre-Flight Checks Complete

- [ ] **System:** Docker running, 8GB RAM available, all services healthy
- [ ] **Data:** Coverage reports available, database has analysis data
- [ ] **Tools:** Security scanners ready, performance tools available
- [ ] **Observability:** OpenTelemetry data flowing, Prometheus scraping, Grafana ready
- [ ] **Documentation:** Execution plan reviewed, success criteria understood
- [ ] **Git:** Working tree clean, on correct branch

### Risk Assessment

- [ ] Backup of .env file created (if needed)
- [ ] Previous reports backed up (if needed)
- [ ] Rollback plan understood (not needed - analysis only, no data modification)
- [ ] Escalation path clear (report to stakeholders if critical issues found)

---

## ⚠️ Known Issues & Workarounds

### Issue: Prometheus Metrics Not Available
**Solution:** Wait 30+ seconds for first scrape, then query again
```bash
docker compose logs prometheus | grep -i "scrape"
curl http://localhost:9090/api/v1/targets
```

### Issue: Tempo Traces Not Appearing
**Solution:** Trigger some requests through the application
```bash
# Generate traces
curl -X GET http://localhost/api/health -v
docker exec uns-claudejp-backend pytest backend/tests/test_health.py -v
```

### Issue: Grafana Dashboard Data Not Loading
**Solution:** Verify Prometheus data source is configured correctly
```bash
# In Grafana UI: Configuration → Data Sources → Prometheus → Test
# Should show "datasource is working"
```

### Issue: Permission Denied Running Scripts
**Solution:** Make scripts executable
```bash
chmod +x scripts/run_semana_7_*.sh
```

### Issue: Database Connection Timeout During Analysis
**Solution:** Restart database service
```bash
docker compose restart db
sleep 30
docker exec -it uns-claudejp-db psql -U uns_admin -d uns_claudejp -c "SELECT 1;"
```

### Issue: Bandit Security Scanner Not Found
**Solution:** Install in backend container
```bash
docker exec uns-claudejp-backend pip install bandit safety
```

### Issue: Frontend Instrumentation Data Missing
**Solution:** Access frontend app to generate RUM data
```bash
curl http://localhost:3000  # or http://localhost/
# Wait 30 seconds for data to appear in Grafana
```

---

## 🔄 Health Check Commands

Run these anytime to verify system state:

```bash
# Overall status
docker compose ps

# Performance baseline
docker stats --no-stream

# Database stats
docker exec -it uns-claudejp-db psql -U uns_admin -d uns_claudejp \
  -c "SELECT datname, numbackends FROM pg_stat_database WHERE datname='uns_claudejp';"

# Prometheus metrics (sample)
curl -s 'http://localhost:9090/api/v1/query?query=http_requests_total' | jq '.data.result | .[0]'

# Tempo trace count
curl -s 'http://localhost:3200/api/traces?limit=1' | jq '.traces | length'

# Grafana health
curl -I http://localhost:3001
```

---

## 📝 Execution Commands

When ready to execute SEMANA 7:

### Option A: Run Complete Orchestration (Recommended)
```bash
cd /path/to/project
chmod +x scripts/run_semana_7_*.sh
./scripts/run_semana_7_complete.sh
```

**Expected duration:** 30-45 minutes
**Output:** 3 comprehensive reports + implementation roadmap

### Option B: Run Individual Phases
```bash
# Phase 7.1: Performance Analysis (10-12 min)
./scripts/run_semana_7_1_performance_profiling.sh

# Phase 7.2: Security Audit (12-15 min)
./scripts/run_semana_7_2_security_audit.sh

# Phase 7.3: Observability Validation (8-10 min)
./scripts/run_semana_7_3_observability_validation.sh
```

### Option C: Run Manually (For Troubleshooting)
Follow the detailed steps in SEMANA_7_EXECUTION_PLAN.md manually

---

## 📊 Success Criteria

After execution completes, verify:

✅ **Reports Generated:**
- `SEMANA_7_PERFORMANCE_ANALYSIS_REPORT.md` (exists, >2KB)
- `SEMANA_7_SECURITY_AUDIT_REPORT.md` (exists, >2KB)
- `SEMANA_7_OBSERVABILITY_VALIDATION_REPORT.md` (exists, >2KB)

✅ **Data Quality:**
- Performance baseline metrics documented
- Security findings catalogued with severity
- Observability infrastructure validated

✅ **Documentation:**
- Optimization recommendations prioritized
- Security remediation plan created
- Monitoring runbooks documented

✅ **Git Commits:**
- All reports committed to branch
- Clear commit messages documenting each phase
- No conflicts with main branch

---

## 🎯 Final Approval

**Before executing SEMANA 7, confirm:**

- [ ] **Preparation:** All checklist items above completed
- [ ] **Understanding:** Execution plan reviewed and understood
- [ ] **Risk:** Aware of potential findings and escalation path
- [ ] **Time:** 30-45 minutes available for uninterrupted execution
- [ ] **Resources:** System is stable with adequate resources
- [ ] **Readiness:** Ready to proceed with comprehensive analysis

---

## 📞 Support Resources

**Documentation:**
- Main plan: `SEMANA_7_EXECUTION_PLAN.md`
- This checklist: `SEMANA_7_PRE_EXECUTION_CHECKLIST.md`
- Previous phase: `SEMANA_6.4_EXECUTION_PLAN.md`

**Key Commands:**
- Status: `docker compose ps`
- Logs: `docker compose logs -f [service]`
- Health: `curl http://localhost:8000/api/health`

**Troubleshooting:**
- Check service logs first
- Restart unhealthy services
- Verify connectivity before proceeding
- Document any issues found

---

**Status:** 🟢 CHECKLIST READY
**Date:** 2025-11-19
**Next Step:** Verify all items above, then execute

