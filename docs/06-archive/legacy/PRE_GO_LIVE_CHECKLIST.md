# ✅ Pre-Go-Live Checklist - Timer Card Module Remediation

**Document ID:** PGL-TIMER-001
**Version:** 1.0
**Date Created:** 2025-11-12
**Target Go-Live Date:** 2025-11-15
**Status:** READY FOR REVIEW

---

## 📋 Checklist Overview

This document provides a complete sign-off checklist for deploying the Timer Card Module remediation to production. All items must be verified and signed off before deployment.

**Total Checklist Items:** 87
**Critical Items:** 15
**High Priority Items:** 22
**Medium Priority Items:** 30
**Low Priority Items:** 20

---

## 🔒 Security & Compliance Checks

### Access Control & RBAC

- [ ] **IDOR Vulnerability Patched**
  - [ ] EMPLOYEE users can only see their own timer cards
  - [ ] KANRININSHA users can only see factory's timer cards
  - [ ] ADMIN/SUPER_ADMIN can see all timer cards
  - **Test:** Run RBAC test script in testing section
  - **Sign-off:** _______________

- [ ] **Authentication Tokens Valid**
  - [ ] JWT token generation working
  - [ ] Token expiry configured (default 24 hours)
  - [ ] Refresh token mechanism tested
  - **Sign-off:** _______________

- [ ] **Password Encryption Verified**
  - [ ] Passwords hashed with bcrypt (cost > 10)
  - [ ] No plaintext passwords in logs
  - [ ] Admin password changed from default
  - **Sign-off:** _______________

- [ ] **API Rate Limiting Active**
  - [ ] Rate limit: 100 requests/minute for public endpoints
  - [ ] Rate limit: 1000 requests/minute for authenticated endpoints
  - [ ] Endpoints protected with rate limiting decorator
  - **Sign-off:** _______________

### Data Security

- [ ] **Database Encryption**
  - [ ] Database connection uses SSL/TLS
  - [ ] Secrets stored in .env (not in code)
  - [ ] Database credentials not in version control
  - **Sign-off:** _______________

- [ ] **Backup Security**
  - [ ] Backups encrypted at rest
  - [ ] Backup access restricted to DBAs only
  - [ ] Off-site backup copies exist
  - **Sign-off:** _______________

- [ ] **Audit Logging**
  - [ ] All approvals logged in audit_log table
  - [ ] Approval changes tracked: who, what, when
  - [ ] Logs not accessible to regular users
  - **Sign-off:** _______________

---

## 🗄️ Database Checks

### Schema & Migrations

- [ ] **All Migrations Applied**
  - [ ] Indexes created (9 total)
    - [ ] idx_timer_cards_hakenmoto
    - [ ] idx_timer_cards_work_date
    - [ ] idx_timer_cards_employee_work_date
    - [ ] idx_timer_cards_is_approved
    - [ ] idx_timer_cards_factory_id
    - [ ] idx_timer_cards_created_at
    - [ ] idx_timer_cards_updated_at
    - [ ] idx_timer_cards_approved_by
    - [ ] idx_timer_cards_hakenmoto_work_date
  - [ ] Constraints created (7+ total)
  - **Command:** `docker exec uns-claudejp-backend bash -c "cd /app && alembic current"`
  - **Expected:** All 4 new migrations applied (head state)
  - **Sign-off:** _______________

- [ ] **Foreign Key Redundancy Removed**
  - [ ] `employee_id` column removed from timer_cards
  - [ ] Only `hakenmoto_id` FK remains
  - [ ] No references to `employee_id` in code
  - **Command:** `docker exec uns-claudejp-db psql -U uns_admin -d uns_claudejp -c "\d timer_cards"`
  - **Expected:** No `employee_id` column shown
  - **Sign-off:** _______________

- [ ] **Triggers Installed & Working**
  - [ ] Prevent duplicate trigger active
  - [ ] Calculate hours trigger active
  - [ ] Sync factory trigger active
  - [ ] Validate approval trigger active
  - [ ] Update timestamp trigger active
  - **Command:** `docker exec uns-claudejp-db psql -U uns_admin -d uns_claudejp -c "\dt+ timer_cards"`
  - **Sign-off:** _______________

### Data Integrity

- [ ] **No Orphaned Records**
  - [ ] All timer_cards reference valid employees (hakenmoto_id exists)
  - [ ] No missing clock_in/clock_out with calculated hours
  - [ ] All approvals have both approved_by AND approved_at (if is_approved=true)
  - **Command:** See "Data Integrity Verification" script below
  - **Sign-off:** _______________

- [ ] **Duplicate Detection**
  - [ ] No duplicate (hakenmoto_id, work_date) pairs
  - [ ] Unique constraint prevents future duplicates
  - **Command:** `docker exec uns-claudejp-db psql -U uns_admin -d uns_claudejp -c "SELECT COUNT(*) FROM timer_cards GROUP BY hakenmoto_id, work_date HAVING COUNT(*) > 1;"`
  - **Expected:** No rows returned
  - **Sign-off:** _______________

- [ ] **Data Consistency Validated**
  - [ ] factory_id matches employee's factory_id
  - [ ] approval_workflows complete
  - [ ] Triggers fire on INSERT/UPDATE
  - **Sign-off:** _______________

---

## 🔄 Migration Testing

### Pre-Migration Verification

- [ ] **Development Environment Tested**
  - [ ] All migrations applied successfully
  - [ ] No errors in alembic upgrade
  - [ ] No errors in alembic downgrade
  - [ ] Data integrity maintained after downgrade/upgrade
  - **Sign-off:** _______________

- [ ] **Staging Environment Tested**
  - [ ] Migrations applied on staging
  - [ ] All tests pass: `pytest backend/tests/ -v`
  - [ ] API endpoints working correctly
  - [ ] Frontend compiles without errors
  - **Sign-off:** _______________

- [ ] **Database Size Impact**
  - [ ] New indexes increase disk usage < 10%
  - [ ] Query performance improved (benchmarked)
  - [ ] Backup size remains reasonable
  - **Sign-off:** _______________

### Rollback Verification

- [ ] **Rollback Tested**
  - [ ] Can downgrade from head to previous migration
  - [ ] Data preserved during rollback
  - [ ] No data loss in rollback scenario
  - **Command:** `alembic downgrade -1` in staging
  - **Sign-off:** _______________

---

## ✅ Code Quality Checks

### Backend Code

- [ ] **Python Code Standards**
  - [ ] No syntax errors: `python -m py_compile backend/app/api/timer_cards.py`
  - [ ] Type hints complete: `mypy backend/app/api/timer_cards.py`
  - [ ] Tests passing: `pytest backend/tests/test_timer_card* -v`
  - [ ] Code formatted: `black backend/app/api/timer_cards.py`
  - [ ] Linting clean: `pylint backend/app/api/timer_cards.py`
  - **Sign-off:** _______________

- [ ] **RBAC Implementation**
  - [ ] GET / filters by user role ✅
  - [ ] GET /{id} filters by user role ✅
  - [ ] POST/PUT/DELETE filters by user role ✅
  - [ ] No hardcoded role checks (should use UserRole enum)
  - **Test:** curl -H "Authorization: Bearer TOKEN" http://localhost:8000/api/timer-cards/
  - **Sign-off:** _______________

- [ ] **Error Handling**
  - [ ] All HTTP exceptions use proper status codes
  - [ ] Error messages don't leak sensitive info
  - [ ] Timeouts implemented for external APIs (OCR)
  - [ ] Database errors handled gracefully
  - **Sign-off:** _______________

### Frontend Code

- [ ] **TypeScript Compilation**
  - [ ] No TypeScript errors: `npm run type-check`
  - [ ] `employee_id` references removed
  - [ ] New fields imported: `night_hours`, `holiday_hours`
  - [ ] RBAC UI updated (only show relevant data)
  - **Sign-off:** _______________

- [ ] **Build Succeeds**
  - [ ] `npm run build` completes without errors
  - [ ] Production bundle size acceptable
  - [ ] No unused dependencies
  - **Sign-off:** _______________

### Documentation

- [ ] **Code Documented**
  - [ ] All functions have docstrings
  - [ ] Complex logic explained with comments
  - [ ] API endpoints documented with examples
  - [ ] Triggers documented with purpose
  - **Sign-off:** _______________

---

## 🧪 Testing & Validation

### Unit Tests

- [ ] **Backend Unit Tests Pass**
  - [ ] `pytest backend/tests/ -v` shows all green
  - [ ] Test coverage > 70% for timer_cards module
  - [ ] Edge cases covered (night hours, holidays, duplicates)
  - [ ] RBAC tests included
  - **Command:** `pytest backend/tests/test_timer_card* -v --cov`
  - **Sign-off:** _______________

- [ ] **Frontend Unit Tests Pass**
  - [ ] `npm test` shows all passing
  - [ ] Component rendering tests included
  - [ ] Form validation tests included
  - **Sign-off:** _______________

### Integration Tests

- [ ] **API Integration Tests**
  - [ ] Create timer card → Verify in database
  - [ ] Update timer card → Triggers fire
  - [ ] Delete timer card → Verify removed
  - [ ] Approve timer card → Audit logged
  - [ ] RBAC filtering working
  - **Sign-off:** _______________

- [ ] **Database Trigger Tests**
  - [ ] Insert with duplicate → Error raised
  - [ ] Insert with clock_in/out → Hours calculated
  - [ ] Update factory_id → Synced from employee
  - [ ] Approve without approved_by → Error or auto-corrected
  - **Sign-off:** _______________

### End-to-End Tests

- [ ] **User Journey Tests (Playwright)**
  - [ ] EMPLOYEE: Can view/update own timer cards
  - [ ] KANRININSHA: Can view/approve factory cards
  - [ ] ADMIN: Can view all cards
  - [ ] Approval workflow: Submit → Approve → Payroll
  - [ ] No 403 errors for authorized users
  - **Command:** `npm run test:e2e`
  - **Sign-off:** _______________

### Data Validation Tests

```bash
# Run these scripts before sign-off:

# Data Integrity Check
docker exec uns-claudejp-db psql -U uns_admin -d uns_claudejp << 'SQL'
-- 1. Check for orphaned timer_cards
SELECT COUNT(*) as orphaned_cards
FROM timer_cards tc
WHERE NOT EXISTS (SELECT 1 FROM employees e WHERE e.hakenmoto_id = tc.hakenmoto_id);

-- 2. Check for duplicates
SELECT COUNT(*) as duplicate_count
FROM timer_cards
GROUP BY hakenmoto_id, work_date
HAVING COUNT(*) > 1;

-- 3. Check invalid approval state
SELECT COUNT(*) as invalid_approval
FROM timer_cards
WHERE is_approved = true AND (approved_by IS NULL OR approved_at IS NULL);

-- 4. Check for records needing recalculation
SELECT COUNT(*) as zero_hours
FROM timer_cards
WHERE clock_in IS NOT NULL
  AND clock_out IS NOT NULL
  AND regular_hours + night_hours + holiday_hours = 0;

-- All should return 0 (no issues found)
SQL
```

- [ ] **Data Integrity Passed**
  - [ ] Orphaned cards: 0
  - [ ] Duplicates: 0
  - [ ] Invalid approval states: 0
  - [ ] Zero hours records: 0
  - **Sign-off:** _______________

---

## 📊 Performance Testing

### Load Testing

- [ ] **Query Performance**
  - [ ] GET / returns in < 500ms with 1000 records
  - [ ] GET /{id} returns in < 100ms
  - [ ] Indexes used for filtering queries (EXPLAIN ANALYZE)
  - [ ] No sequential scans on large tables
  - **Command:** `time curl http://localhost:8000/api/timer-cards/`
  - **Sign-off:** _______________

- [ ] **Database Performance**
  - [ ] Average query time < 50ms
  - [ ] 99th percentile query time < 500ms
  - [ ] Connection pool not exhausted (< 80% usage)
  - [ ] Slow queries logged and optimized
  - **Sign-off:** _______________

### Stress Testing

- [ ] **Concurrent User Test**
  - [ ] 50 concurrent requests to GET /
  - [ ] No 5xx errors
  - [ ] No connection pool exhaustion
  - [ ] Response time < 2 seconds per request
  - **Sign-off:** _______________

- [ ] **Bulk Operation Test**
  - [ ] Import 10,000 timer cards
  - [ ] No database corruption
  - [ ] Triggers fire correctly
  - [ ] Import completes in < 5 minutes
  - **Sign-off:** _______________

---

## 🐳 Docker & Infrastructure

### Container Health

- [ ] **All Services Healthy**
  - [ ] Backend: Running, health check passing
  - [ ] Frontend: Running, health check passing
  - [ ] Database: Running, health check passing
  - [ ] Redis: Running, health check passing
  - **Command:** `docker compose ps`
  - **Expected:** All "Up" with health "healthy"
  - **Sign-off:** _______________

- [ ] **Resource Limits Set**
  - [ ] Backend memory limit: 2GB
  - [ ] Frontend memory limit: 1GB
  - [ ] Database memory limit: 4GB
  - [ ] No out-of-memory errors
  - **Sign-off:** _______________

- [ ] **Volume Mounts Correct**
  - [ ] postgres_data persists database
  - [ ] redis_data persists cache
  - [ ] Volumes not full (< 80% usage)
  - **Sign-off:** _______________

### Network & Connectivity

- [ ] **Services Accessible**
  - [ ] Frontend: http://localhost:3000 ✓
  - [ ] Backend API: http://localhost:8000 ✓
  - [ ] API Docs: http://localhost:8000/api/docs ✓
  - [ ] Database UI: http://localhost:8080 ✓
  - **Sign-off:** _______________

- [ ] **Cross-Service Communication**
  - [ ] Backend can connect to database
  - [ ] Frontend can connect to backend
  - [ ] Redis connections working
  - [ ] OCR services reachable (if external)
  - **Sign-off:** _______________

---

## 📋 Configuration & Secrets

### Environment Variables

- [ ] **.env File Correct**
  - [ ] DATABASE_URL set correctly
  - [ ] FRONTEND_URL matches frontend URL
  - [ ] SECRET_KEY is secure (> 32 chars)
  - [ ] No secrets in .env.example
  - [ ] ENVIRONMENT=production (not development)
  - **Sign-off:** _______________

- [ ] **Secrets Not in Code**
  - [ ] No API keys in source code
  - [ ] No database passwords in git history
  - [ ] All secrets in environment variables
  - [ ] .gitignore includes .env and secrets
  - **Sign-off:** _______________

### Logging Configuration

- [ ] **Logging Level Set Correctly**
  - [ ] Production: INFO (not DEBUG)
  - [ ] Error logs captured
  - [ ] No sensitive data logged
  - [ ] Logs rotated to prevent disk fill
  - **Sign-off:** _______________

---

## 📞 Communication & Documentation

### Stakeholder Notification

- [ ] **All Teams Notified**
  - [ ] Operations team: Deployment schedule
  - [ ] User support team: What changed and how to handle questions
  - [ ] Management: Business impact and benefits
  - [ ] Finance/HR: Data improvements in payroll
  - **Sign-off:** _______________

- [ ] **Documentation Complete**
  - [ ] User guide updated
  - [ ] API documentation updated
  - [ ] Deployment procedure written
  - [ ] Disaster recovery plan created
  - [ ] Operations manual created
  - [ ] Pre-go-live checklist (this document)
  - **Sign-off:** _______________

### Known Issues Documented

- [ ] **Breaking Changes Listed**
  - [ ] employee_id column removed (API breaking change)
  - [ ] All clients must use hakenmoto_id instead
  - [ ] Deployment procedure updated to handle migration
  - **Sign-off:** _______________

- [ ] **Workarounds for Known Issues**
  - [ ] If OCR times out: Re-upload document
  - [ ] If duplicate card error: Delete older one
  - [ ] If RBAC denies access: Verify role assignment
  - **Sign-off:** _______________

---

## 🎯 Final Verification

### Go-Live Readiness

- [ ] **Deployment Package Ready**
  - [ ] Code compiled and tested
  - [ ] Migrations ready to apply
  - [ ] Backups created and verified
  - [ ] Rollback plan documented
  - [ ] Deployment procedure written
  - **Sign-off:** _______________

- [ ] **Monitoring Ready**
  - [ ] Alerting configured
  - [ ] Logs being collected
  - [ ] Performance baseline established
  - [ ] Error tracking enabled
  - **Sign-off:** _______________

- [ ] **Support Team Ready**
  - [ ] L1/L2 support trained
  - [ ] Documentation provided
  - [ ] Escalation procedures clear
  - [ ] On-call contact info shared
  - **Sign-off:** _______________

---

## 🔄 Approval & Sign-Off

### Pre-Deployment Review

| Role | Name | Date | Signature |
|------|------|------|-----------|
| **Technical Lead** | _____________ | _____________ | _____________ |
| **Database Admin** | _____________ | _____________ | _____________ |
| **QA Manager** | _____________ | _____________ | _____________ |
| **Operations Lead** | _____________ | _____________ | _____________ |
| **Security Officer** | _____________ | _____________ | _____________ |
| **Project Manager** | _____________ | _____________ | _____________ |

### Deployment Authorization

**All items completed and signed off:** [ ]

**Authorized to proceed with deployment:** [ ]

**Authorized by:** _______________
**Date/Time:** _______________
**Deployment Window:** _______________

---

## 📊 Sign-Off Summary

**Total Checklist Items:** 87
**Items Completed:** ___ / 87
**Pass Rate:** ___%

| Category | Completed | Total | Status |
|----------|-----------|-------|--------|
| Security & Compliance | ___/9 | 9 | ⭕ |
| Database Checks | ___/11 | 11 | ⭕ |
| Migration Testing | ___/5 | 5 | ⭕ |
| Code Quality | ___/11 | 11 | ⭕ |
| Testing & Validation | ___/17 | 17 | ⭕ |
| Performance Testing | ___/6 | 6 | ⭕ |
| Docker & Infrastructure | ___/11 | 11 | ⭕ |
| Configuration & Secrets | ___/8 | 8 | ⭕ |
| Communication & Documentation | ___/8 | 8 | ⭕ |
| Final Verification | ___/5 | 5 | ⭕ |
| **TOTAL** | **___ / 87** | **87** | ⭕ |

---

## 📞 Support Contacts

**During Deployment:**
- Technical Lead: _________________ Phone: _________________
- Database Admin: _________________ Phone: _________________
- DevOps: _________________ Phone: _________________

**Post-Deployment (24 hours):**
- All issues to: _________________ Email: _________________

---

**Checklist Version:** 1.0
**Last Updated:** 2025-11-12
**Next Update:** Post-Go-Live Review
**Prepared By:** Development & QA Teams
