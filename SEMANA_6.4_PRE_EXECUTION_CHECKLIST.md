# SEMANA 6.4: Pre-Execution Checklist

**Purpose:** Verify all prerequisites before executing comprehensive test suite
**Status:** 🟡 READY FOR VERIFICATION
**Date Prepared:** 2025-11-19

---

## ✅ System Requirements

### Docker
- [ ] Docker is installed and running
- [ ] `docker --version` returns version 20.10+
- [ ] `docker compose --version` returns version 2.0+
- [ ] Docker daemon is accessible (no permission errors)

### System Resources
- [ ] Minimum 8GB RAM available
- [ ] Minimum 500MB disk space for coverage reports
- [ ] CPU with 4+ cores recommended
- [ ] Network connectivity for pulling dependencies

### Operating System
- [ ] Linux, macOS, or Windows (with WSL2)
- [ ] Bash shell available
- [ ] Git installed and configured

---

## 🔧 Project Setup

### Git Status
- [ ] Current branch is `claude/project-audit-cleanup-01BnhrSyZcJhG4EA3hg4tCyM`
- [ ] All local changes committed
- [ ] `git status` shows clean working tree
- [ ] Remote branch is up-to-date

### Code Quality
- [ ] No pending TODO comments in critical code
- [ ] All imports resolve (test with `python -c "import app"`)
- [ ] No obvious syntax errors

### Dependencies
- [ ] Backend `requirements.txt` is current
- [ ] Frontend `package.json` is current
- [ ] Docker images are built and available

---

## 🐳 Docker Services

### Service Startup
- [ ] `docker compose ps` shows all services running
- [ ] All services have status "Up"
- [ ] No services in "Restarting" state

### Backend Service
```bash
docker exec uns-claudejp-backend bash -c "echo 'OK'"
```
- [ ] Backend container is accessible
- [ ] Python environment is working
- [ ] Pytest is installed: `pytest --version`

### Frontend Service
```bash
docker exec uns-claudejp-frontend bash -c "echo 'OK'"
```
- [ ] Frontend container is accessible
- [ ] Node.js environment is working
- [ ] npm is available: `npm --version`

### Database Service
```bash
docker exec uns-claudejp-db psql -U uns_admin -d uns_claudejp -c "SELECT 1;"
```
- [ ] Database is accessible
- [ ] Can execute queries
- [ ] Database is not locked

### Redis Service
```bash
docker exec uns-claudejp-redis redis-cli ping
```
- [ ] Redis is accessible
- [ ] Returns "PONG"
- [ ] Can write/read data

---

## 📋 Test Environment Setup

### Backend Test Configuration
- [ ] `backend/pytest.ini` exists and is configured
- [ ] `backend/mypy.ini` exists
- [ ] `backend/tests/conftest.py` exists
- [ ] Database migrations are current: `docker exec uns-claudejp-backend alembic current`
- [ ] No pending migrations: `docker exec uns-claudejp-backend alembic upgrade head`

### Frontend Test Configuration
- [ ] `frontend/package.json` has test scripts
- [ ] Test framework is installed (vitest or jest)
- [ ] Coverage reporters configured
- [ ] tsconfig.json exists and is valid

### Coverage Tools
- [ ] pytest-cov installed: `docker exec uns-claudejp-backend pip list | grep pytest-cov`
- [ ] Coverage tools available: `docker exec uns-claudejp-frontend npm list | grep coverage`

---

## 📁 Directory Structure

### Coverage Directories
- [ ] `coverage/` directory exists
- [ ] `coverage/backend/` directory exists
- [ ] `coverage/frontend/` directory exists
- [ ] Directories are writable

### Test Files
- [ ] 43 backend test files exist: `find backend/tests -name "test_*.py" | wc -l`
- [ ] 16 frontend test files exist
- [ ] All test files are accessible

### Scripts
- [ ] `scripts/run_semana_6_4_backend_tests.sh` exists
- [ ] `scripts/run_semana_6_4_frontend_tests.sh` exists
- [ ] `scripts/run_semana_6_4_complete.sh` exists
- [ ] All scripts are executable: `chmod +x scripts/run_semana_6_4_*.sh`

---

## 🧪 Quick Validation Tests

### Backend Quick Test
```bash
docker exec uns-claudejp-backend pytest \
  backend/tests/test_auth.py \
  -v \
  --tb=short \
  -x
```
- [ ] Smoke test passes
- [ ] No import errors
- [ ] Database connection works
- [ ] Test execution completes in <2 minutes

### Frontend Quick Test
```bash
docker exec uns-claudejp-frontend npm test -- \
  --testPathPattern="__tests__" \
  --passWithNoTests
```
- [ ] Type check passes
- [ ] No build errors
- [ ] Test runner starts successfully

### PayrollService Test
```bash
docker exec uns-claudejp-backend pytest \
  backend/tests/test_payroll_integration.py \
  -v
```
- [ ] Test file found and loaded
- [ ] No import errors for PayrollService
- [ ] Can execute at least one test method
- [ ] Database fixtures work

---

## 📊 Pre-Execution Validation

### Space Check
```bash
df -h | grep -E "/$|^Mounted"
```
- [ ] At least 1GB free disk space
- [ ] No "100%" usage warnings

### Memory Check
```bash
docker exec uns-claudejp-backend free -h
```
- [ ] At least 2GB available memory
- [ ] Docker has sufficient memory allocation

### Performance Baseline
- [ ] Note current system load: `uptime`
- [ ] Note current memory usage
- [ ] Plan for 30-60 minutes of test execution

---

## 🚀 Pre-Execution Checklist (Run-Time)

### 1 Hour Before Execution
- [ ] Close unnecessary applications
- [ ] Stop other resource-intensive processes
- [ ] Ensure stable internet connection
- [ ] Check system temperature (if available)

### 30 Minutes Before
- [ ] Clear Docker build cache: `docker builder prune`
- [ ] Verify Docker disk usage: `docker system df`
- [ ] Review execution plan one more time
- [ ] Have monitoring tools ready (htop, docker stats)

### 10 Minutes Before
- [ ] Make final git commit with any last-minute changes
- [ ] Verify all test scripts are executable
- [ ] Check coverage directories are empty (fresh run)
- [ ] Set up monitoring: `docker stats` in separate terminal

### 5 Minutes Before
- [ ] Take snapshot of system state
- [ ] Open terminal for execution
- [ ] Have documentation ready
- [ ] Ready to capture output

---

## 📝 Execution Readiness

### Scripts Prepared
- [ ] `run_semana_6_4_backend_tests.sh` ✅
- [ ] `run_semana_6_4_frontend_tests.sh` ✅
- [ ] `run_semana_6_4_complete.sh` ✅

### Execution Command Ready
```bash
cd /path/to/project
chmod +x scripts/run_semana_6_4_*.sh
./scripts/run_semana_6_4_complete.sh
```

### Backup Plan Ready
- [ ] Have previous coverage reports backed up
- [ ] Know how to stop test execution (Ctrl+C)
- [ ] Have troubleshooting guide available
- [ ] Know how to collect logs if needed

---

## 🎯 Success Criteria

After all checks pass, you should see:

✅ **Pre-Execution:**
- All services running in Docker
- No import errors
- Test frameworks accessible
- Sufficient resources available

✅ **During Execution:**
- Tests discovering and executing
- Coverage reports generating
- No critical errors blocking progress

✅ **Post-Execution:**
- Coverage reports generated (HTML + JSON)
- Coverage percentage visible
- Test execution log complete
- Results ready for analysis

---

## 📋 Approval Sign-Off

Before launching SEMANA 6.4, confirm:

- [ ] **System Ready:** All hardware/software prerequisites met
- [ ] **Code Ready:** All code committed and clean
- [ ] **Tests Ready:** All 43+16 test files present and validated
- [ ] **Environment Ready:** Docker services healthy
- [ ] **Scripts Ready:** All three scripts prepared and tested
- [ ] **Documentation Ready:** Execution plan reviewed
- [ ] **Backup Ready:** Previous results backed up
- [ ] **Ready to Execute:** All systems GO

---

## ⚠️ Known Issues & Workarounds

### Issue: Database Connection Timeout
**Solution:** Restart database service
```bash
docker compose restart db
sleep 30
docker exec uns-claudejp-db psql -U uns_admin -d uns_claudejp -c "SELECT 1;"
```

### Issue: Tests Timeout
**Solution:** Increase timeout in test execution
```bash
# Edit scripts and change timeout from 600 to 900 seconds
sed -i 's/TIMEOUT=600/TIMEOUT=900/g' scripts/run_semana_6_4_backend_tests.sh
```

### Issue: Coverage Report Not Generated
**Solution:** Verify coverage tools installed
```bash
docker exec uns-claudejp-backend pip install pytest-cov
docker exec uns-claudejp-frontend npm install --save-dev coverage
```

### Issue: Out of Memory
**Solution:** Reduce parallel execution
```bash
# Edit scripts to use single-threaded execution
# In run_semana_6_4_complete.sh, add: --maxWorkers=1
```

---

## 🔄 Health Check Commands

Run these anytime to verify system health:

```bash
# Overall status
docker compose ps

# Backend health
docker exec uns-claudejp-backend pytest --co -q | wc -l

# Frontend health
docker exec uns-claudejp-frontend npm test -- --listTests 2>/dev/null | wc -l

# Database health
docker exec uns-claudejp-db psql -U uns_admin -d uns_claudejp -c "SELECT COUNT(*) FROM pg_tables WHERE schemaname='public';"

# Resource usage
docker stats --no-stream
```

---

## 📞 Support Resources

### Documentation
- **Execution Plan:** `SEMANA_6.4_EXECUTION_PLAN.md`
- **Backend Script:** `scripts/run_semana_6_4_backend_tests.sh`
- **Frontend Script:** `scripts/run_semana_6_4_frontend_tests.sh`
- **Main Script:** `scripts/run_semana_6_4_complete.sh`

### Troubleshooting
- Check logs in: `semana_6_4_execution_*.log`
- Review coverage reports for details
- Check Docker logs: `docker compose logs -f`

---

## ✅ Final Approval

When all checkboxes are complete, run:

```bash
./scripts/run_semana_6_4_complete.sh
```

**Expected Execution Time:** 30-45 minutes
**Expected Output:** Coverage reports in `coverage/` directory

---

**Prepared by:** Claude Code Agent
**Status:** 🟢 READY FOR DOCKER EXECUTION
**Next Step:** Verify all items and execute SEMANA 6.4

