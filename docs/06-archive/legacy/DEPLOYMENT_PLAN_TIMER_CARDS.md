# 🚀 Timer Card Module Deployment Plan

**Version:** v5.4.1 - Timer Card Remediation
**Date:** 2025-11-12
**Status:** Pre-Deployment
**Target Environment:** Production (Docker Compose)
**Estimated Duration:** 2-3 hours (including verification)

---

## 📋 Executive Summary

This deployment plan provides step-by-step procedures for deploying the Timer Card module remediation (Phase 1-4) to production. The remediation includes:

- **Security Fixes**: IDOR vulnerability patched, RBAC implemented
- **Data Integrity**: Redundant FK removed, constraints added, triggers implemented
- **Business Logic**: Night hours/holiday hours calculations fixed, approval workflow validated
- **Performance**: 9 indexes added, N+1 queries eliminated, OCR timeouts implemented

**Risk Level**: **MEDIUM** (No data loss, one breaking API change)
**Downtime Required**: **5-15 minutes** (database migration window)
**Rollback Time**: **10-20 minutes** (with backup restoration)

---

## ✅ Pre-Deployment Checklist

### Environment Preparation (Day Before)

- [ ] Verify Docker Compose stack is healthy: `docker compose ps`
- [ ] Confirm all 6 core services running (db, redis, importer, backend, frontend, adminer)
- [ ] Backup production database: `cd scripts && BACKUP_DATOS.bat > backup_$(date +%s).sql`
- [ ] Document current database schema: `docker exec uns-claudejp-db pg_dump -s -U uns_admin uns_claudejp > schema_backup.sql`
- [ ] Export timer_cards data: `docker exec uns-claudejp-db psql -U uns_admin -d uns_claudejp -c "COPY timer_cards TO STDOUT" > timer_cards_backup.csv`
- [ ] Review all 5 migration files in `backend/alembic/versions/2025_11_12_*`
- [ ] Test migrations in development environment first
- [ ] Notify operations team of deployment window

### Deployment Day - 30 Minutes Before Start

- [ ] Review this deployment plan line by line
- [ ] Confirm backup files exist and are readable
- [ ] Check database connection: `docker exec uns-claudejp-db pg_isready`
- [ ] Monitor backend logs: `docker compose logs -f backend`
- [ ] Monitor frontend logs: `docker compose logs -f frontend`
- [ ] Set maintenance mode (if available): `echo "MAINTENANCE=true" >> .env`
- [ ] Alert users that system will be offline during deployment

---

## 🔄 Deployment Procedure

### Phase 1: Pre-Flight Checks (5 minutes)

**Step 1.1: Verify Current State**

```bash
# Check services health
docker compose ps

# Expected output:
# STATUS: all services "Up" with health status "healthy"

# Verify database connection
docker exec uns-claudejp-db psql -U uns_admin -d uns_claudejp -c "SELECT version();"

# Check current timer_cards record count
docker exec uns-claudejp-db psql -U uns_admin -d uns_claudejp -c "SELECT COUNT(*) FROM timer_cards;"
```

**Step 1.2: Create Final Backup**

```bash
# Create timestamped backup
BACKUP_FILE="production_backup_$(date +%Y%m%d_%H%M%S).sql"

docker exec uns-claudejp-db pg_dump -U uns_admin uns_claudejp > "$BACKUP_FILE"

# Verify backup integrity
if [ -s "$BACKUP_FILE" ]; then
    echo "[OK] Backup created: $BACKUP_FILE"
else
    echo "[X] Backup failed!"
    exit 1
fi

# Store backup location
echo "$BACKUP_FILE" > CURRENT_BACKUP.txt
```

**Step 1.3: Check API Health**

```bash
# Verify backend is accessible
curl -s http://localhost:8000/api/health | jq .

# Expected: {"status": "healthy", "database": "connected"}

# If health check fails, DO NOT PROCEED
```

### Phase 2: Database Migration (10-15 minutes)

**Step 2.1: Execute Alembic Migrations**

```bash
# Access backend container
docker exec -it uns-claudejp-backend bash

# Verify current migration status
cd /app
alembic current

# Expected: Last revision before these new migrations

# Apply new migrations IN ORDER (critical!)
alembic upgrade head

# Verify all migrations applied
alembic history

# Expected: All 5 new migrations listed with "head" status
```

**Migration Sequence** (applied by `alembic upgrade head`):

1. `2025_11_12_1804`: Add parking and plus fields (if not already applied)
2. `2025_11_12_1900`: Add timer card indexes and constraints
3. `2025_11_12_2000`: Remove redundant employee_id
4. `2025_11_12_2015`: Add consistency triggers

**Critical Points:**
- ⚠️ Migration `2025_11_12_2000` is BREAKING - removes employee_id column
- ⚠️ If this migration fails, STOP and rollback immediately (see Rollback section)
- ⚠️ Migrations must be applied IN ORDER

### Phase 3: Verify Database Integrity (5 minutes)

```bash
# Check migration status
docker exec uns-claudejp-db psql -U uns_admin -d uns_claudejp -c "SELECT * FROM alembic_version;"

# Verify indexes created
docker exec uns-claudejp-db psql -U uns_admin -d uns_claudejp -c "\di timer_cards*"

# Expected: 9 indexes related to timer_cards

# Verify constraints exist
docker exec uns-claudejp-db psql -U uns_admin -d uns_claudejp \
  -c "SELECT constraint_name FROM information_schema.table_constraints WHERE table_name='timer_cards' AND constraint_type='CHECK';"

# Expected: Multiple CHECK constraints (not_null_*, valid_*, etc.)

# Verify triggers exist
docker exec uns-claudejp-db psql -U uns_admin -d uns_claudejp -c "\dt+ timer_cards"

# Check trigger functions
docker exec uns-claudejp-db psql -U uns_admin -d uns_claudejp \
  -c "SELECT proname FROM pg_proc WHERE proname LIKE '%timer_card%';"

# Expected: 5 trigger functions (prevent_duplicate, calculate_hours, sync_factory, validate_approval, update_timestamp)

# Verify data integrity
docker exec uns-claudejp-db psql -U uns_admin -d uns_claudejp -c "SELECT COUNT(*) FROM timer_cards;"

# Should match count from step 1.2 (no data loss)
```

### Phase 4: Deploy Code Changes (5 minutes)

**Step 4.1: Pull Latest Code**

```bash
# Fetch latest changes
git fetch origin claude/analyze-timer-card-agents-011CV41DXT6SHZsDHxK96WJ9

# Verify branch
git branch -v

# Expected: Current branch shows all 9 commits
```

**Step 4.2: Rebuild Backend**

```bash
# Rebuild backend image with new code
docker compose build backend --no-cache

# Expected: Build completes successfully

# Verify image size (should be ~1.2GB)
docker images | grep backend
```

**Step 4.3: Rebuild Frontend**

```bash
# Rebuild frontend image
docker compose build frontend --no-cache

# Expected: Build completes, Turbopack compiles Next.js
```

**Step 4.4: Restart Services**

```bash
# Stop services (gracefully)
docker compose stop backend frontend

# Wait for services to stop
sleep 5

# Start services
docker compose up -d backend frontend

# Expected: Services start, health checks pass within 30s
```

### Phase 5: Post-Deployment Verification (10 minutes)

**Step 5.1: Health Checks**

```bash
# Check service health
docker compose ps

# Expected: All services "Up" with health status "healthy" or "starting"

# Wait for services to become healthy (max 60 seconds)
for i in {1..6}; do
  if docker compose exec -T backend curl -s http://localhost:8000/api/health | grep -q "healthy"; then
    echo "[OK] Backend healthy"
    break
  fi
  echo "Waiting for backend... ($i/6)"
  sleep 10
done
```

**Step 5.2: API Functionality Tests**

```bash
# Test timer cards GET endpoint
curl -s http://localhost:8000/api/timer-cards/ \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" | jq . | head -20

# Test timer card detail endpoint
curl -s http://localhost:8000/api/timer-cards/1 \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" | jq .

# Expected: Returns timer card data with new fields (night_hours, holiday_hours, is_approved)

# Test RBAC (should return only user's timer cards)
# EMPLOYEE user should see only their own cards
# KANRININSHA should see only factory's cards
# ADMIN/SUPER_ADMIN should see all cards
```

**Step 5.3: Database Verification**

```bash
# Check that triggers fire correctly
docker exec uns-claudejp-db psql -U uns_admin -d uns_claudejp -c "
  INSERT INTO timer_cards (hakenmoto_id, work_date, clock_in, clock_out, break_minutes)
  VALUES (1, '2025-11-12', '09:00:00', '17:00:00', 60)
  RETURNING regular_hours, night_hours, holiday_hours, is_approved;
"

# Expected: Triggers calculate hours correctly
# regular_hours: ~7.00
# night_hours: 0
# holiday_hours: 0
# is_approved: false

# Test approval workflow validation
docker exec uns-claudejp-db psql -U uns_admin -d uns_claudejp -c "
  UPDATE timer_cards SET is_approved = true WHERE id = 1;
"

# Expected: Should fail with error message about missing approved_by and approved_at
```

**Step 5.4: Frontend Verification**

```bash
# Check frontend is serving
curl -s http://localhost:3000/api/health | jq .

# Navigate to timer cards page: http://localhost:3000/timercards
# Verify:
# - Timer card list loads without errors
# - Night hours column shows values
# - Holiday hours column shows values
# - Approval status shows correctly
# - RBAC filtering works (only relevant cards visible)

# Check browser console for errors (F12 DevTools)
# Expected: No TypeScript errors, no 404s
```

**Step 5.5: Performance Verification**

```bash
# Check database query performance
docker exec uns-claudejp-backend bash -c "cd /app && python scripts/performance_check.py"

# Check index usage in queries
docker exec uns-claudejp-db psql -U uns_admin -d uns_claudejp -c "
  EXPLAIN ANALYZE
  SELECT * FROM timer_cards WHERE hakenmoto_id = 1 AND work_date >= '2025-11-01';
"

# Expected: Plan shows index scan (not sequential scan)
```

### Phase 6: Final Documentation (5 minutes)

**Step 6.1: Record Deployment**

```bash
# Document deployment in log
cat > DEPLOYMENT_LOG_$(date +%Y%m%d_%H%M%S).txt << EOF
DEPLOYMENT COMPLETED SUCCESSFULLY

Date: $(date)
Branch: claude/analyze-timer-card-agents-011CV41DXT6SHZsDHxK96WJ9
Migrations Applied:
  1. 2025_11_12_1900_add_timer_cards_indexes_constraints
  2. 2025_11_12_2000_remove_redundant_employee_id_from_timer_cards
  3. 2025_11_12_2015_add_timer_card_consistency_triggers

Backup: $(cat CURRENT_BACKUP.txt)

All health checks: PASSED
All verification tests: PASSED
RBAC: WORKING
Performance: IMPROVED (indexes active)

Signed Off By: [Operations Team]
Date/Time: $(date)
EOF
```

---

## 🆘 Rollback Procedure

**When to Rollback:**
- Database migration fails
- Services won't start after deployment
- Critical business functions broken
- Data corruption detected
- Performance degradation > 50%

**Rollback Time: 10-20 minutes**

### Immediate Rollback (Within 1 Hour)

**Step 1: Stop Current Services**

```bash
# Stop all services
docker compose stop

# Wait for graceful shutdown
sleep 5
```

**Step 2: Restore Database**

```bash
# Get backup file
BACKUP_FILE=$(cat CURRENT_BACKUP.txt)

# Restore database
docker compose up -d db

# Wait for database to start
sleep 10

# Restore from backup
cat "$BACKUP_FILE" | docker exec -i uns-claudejp-db psql -U uns_admin

# Verify restore
docker exec uns-claudejp-db psql -U uns_admin -d uns_claudejp -c "SELECT COUNT(*) FROM timer_cards;"
```

**Step 3: Revert Code**

```bash
# Checkout previous working commit
git checkout HEAD~9  # Go back 9 commits before new migrations

# Rebuild images with old code
docker compose build --no-cache

# Restart services
docker compose up -d

# Wait for health checks
sleep 30

# Verify services online
docker compose ps
```

**Step 4: Verify Rollback Success**

```bash
# Check API health
curl http://localhost:8000/api/health

# Check timer cards work
curl -s http://localhost:8000/api/timer-cards/ \
  -H "Authorization: Bearer JWT_TOKEN" | jq . | head -10

# Expected: System working as before deployment
```

### Cold Rollback (Complete Restart)

If warm rollback fails:

```bash
# Stop everything
docker compose down -v

# Clean up images
docker rmi uns-claudejp-backend uns-claudejp-frontend

# Run REINSTALAR.bat
cd scripts
REINSTALAR.bat

# Select "NO" when asked about reinstallation
# When prompted, restore from backup instead
```

---

## 📊 Monitoring During Deployment

### Terminal 1: Watch Services

```bash
watch -n 1 'docker compose ps'
```

### Terminal 2: Backend Logs

```bash
docker compose logs -f backend | grep -E "(ERROR|WARNING|INFO|migration)"
```

### Terminal 3: Frontend Logs

```bash
docker compose logs -f frontend | grep -E "(ERROR|WARNING|INFO|failed)"
```

### Terminal 4: Database Logs

```bash
docker compose logs -f db | grep -E "(ERROR|LOG|FATAL)"
```

### In Browser: Real-Time Testing

Open DevTools (F12) and monitor:
- Network tab: API calls succeed with 200/201
- Console: No errors or warnings
- Application tab: Timer card data has new fields

---

## 🔒 Security Considerations

### During Deployment

- [ ] Database backups encrypted and stored securely
- [ ] No credentials or secrets in deployment logs
- [ ] Firewall rules not modified
- [ ] No direct database access from internet
- [ ] SSL/TLS connections used for all external APIs

### Post-Deployment

- [ ] RBAC verified - users can only see their own data
- [ ] IDOR vulnerability patched - timer cards isolated by hakenmoto_id
- [ ] SQL injection not possible - all queries use ORM/parameterized
- [ ] Rate limiting active on API endpoints
- [ ] Audit logs recording all approvals/changes

---

## ⚠️ Known Limitations & Risks

### Risk 1: Breaking API Change

**Issue**: Column `employee_id` removed from timer_cards table
**Impact**: Any code/scripts using `employee_id` will break
**Mitigation**:
- Update all references to use `hakenmoto_id` instead
- Check frontend code: `employee_id` removed from `TimerCardResponse` type
- Check backend code: all queries use `hakenmoto_id`

**Testing**: Run `grep -r "employee_id" backend/app/api/timer_cards.py` - should return EMPTY

### Risk 2: Migration Downtime

**Issue**: Database migration with schema changes
**Impact**: ~5-15 minutes downtime during migration window
**Mitigation**:
- Deploy during off-peak hours (22:00-05:00 JST)
- Inform users in advance
- Have rollback plan ready
- Monitor closely during migration

### Risk 3: Trigger Performance

**Issue**: New triggers may impact INSERT/UPDATE performance
**Impact**: ~5-10% slowdown per trigger
**Mitigation**:
- Triggers optimized (minimal calculations)
- Indexes added to optimize lookups
- Batch operations may need tuning
- Monitor query performance post-deployment

### Risk 4: Data Inconsistency

**Issue**: Existing timer cards may have missing night_hours/holiday_hours
**Impact**: Old records don't have calculated values
**Mitigation**:
- Run cleanup script to recalculate old records:
  ```sql
  UPDATE timer_cards SET updated_at = NOW() WHERE night_hours = 0;
  -- This triggers the calculate_hours function to recalculate
  ```

---

## 📋 Sign-Off Checklist

**Deployment Approved By:** ________________________
**Date/Time:** ________________________

**Pre-Deployment:**
- [ ] Database backed up (location: __________________)
- [ ] Schema backed up (location: __________________)
- [ ] All stakeholders notified
- [ ] Maintenance window scheduled: ________________

**Deployment Completed:**
- [ ] All migrations applied successfully
- [ ] Database integrity verified
- [ ] Code deployed and restarted
- [ ] Health checks passing
- [ ] API tests passing
- [ ] RBAC working correctly
- [ ] Performance acceptable
- [ ] No data corruption

**Post-Deployment:**
- [ ] Logs reviewed for errors
- [ ] Users notified deployment complete
- [ ] Monitoring active
- [ ] Rollback plan ready if needed

---

## 📞 Support & Escalation

**During Deployment Issues:**

1. **Check Logs First**
   ```bash
   docker compose logs backend | tail -50
   docker compose logs db | tail -50
   ```

2. **If Issue Persists**: Execute Rollback Procedure (10-20 minutes)

3. **If Rollback Fails**: Contact Database Administrator
   - Have backup file ready
   - Have git branch information ready
   - Have exact error messages from logs

**Post-Deployment Support:**
- Monitor for 24 hours after deployment
- Watch for unusual query patterns
- Track error rates in logs
- Verify user reports of issues
- Be ready to apply hotfix if critical bug found

---

## 📚 Related Documentation

- **Triggers Implementation**: `/backend/alembic/versions/2025_11_12_2015_*`
- **Migration Details**: Each migration file has complete documentation
- **Rollback Plan**: See "Rollback Procedure" section above
- **Disaster Recovery**: See `DISASTER_RECOVERY_PLAN.md`
- **Operations Manual**: See `OPERATIONS_MANUAL.md`

---

**Document Version:** 1.0
**Last Updated:** 2025-11-12
**Next Review:** Post-Deployment (2025-11-13)
