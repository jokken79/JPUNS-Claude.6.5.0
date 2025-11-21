# 🆘 Disaster Recovery Plan - Timer Card Module

**Document ID:** DRP-TIMER-001
**Version:** 1.0
**Last Updated:** 2025-11-12
**Scope:** Timer Card Module (タイムカード) - UNS-ClaudeJP 5.4.1
**Recovery Time Objective (RTO):** 2-4 hours
**Recovery Point Objective (RPO):** Last backup (daily recommended)

---

## 📋 Table of Contents

1. [Overview](#overview)
2. [Disaster Scenarios](#disaster-scenarios)
3. [Recovery Procedures](#recovery-procedures)
4. [Testing & Validation](#testing--validation)
5. [Contacts & Escalation](#contacts--escalation)

---

## 📌 Overview

### Disaster Types

| Disaster | Likelihood | Impact | RTO |
|----------|-----------|--------|-----|
| **Database Corruption** | Medium | CRITICAL - Data loss | 1-2 hours |
| **Migration Failure** | Low | HIGH - Rollback needed | 30 minutes |
| **Container Crash** | Low | MEDIUM - Service down | 10 minutes |
| **Disk Full** | Low | HIGH - Write blocked | 30 minutes |
| **Network Partition** | Very Low | CRITICAL - No access | 1+ hours |
| **Backup Corruption** | Very Low | CRITICAL - No recovery | N/A |

### Recovery Priority

1. **CRITICAL (P1):** Database unavailable → Restore from backup
2. **HIGH (P2):** Data inconsistent → Validate triggers & constraints
3. **MEDIUM (P3):** Performance degraded → Rebuild indexes
4. **LOW (P4):** Warnings in logs → Review and optimize

---

## 🆘 Disaster Scenarios

### Scenario 1: Database Corruption

**Symptoms:**
```
ERROR: duplicate key value violates unique constraint
ERROR: deadlock detected
ERROR: table timer_cards does not exist
ERROR: foreign key constraint violation
```

**Recovery Steps:**

```bash
# Step 1: Stop affected services
docker compose stop backend frontend importer

# Step 2: Check database health
docker compose exec db pg_isready

# Step 3: Try to run recovery
docker compose exec db vacuumdb -U uns_admin uns_claudejp

# Step 4: If unsuccessful, restore from backup
# See: Backup Restoration Procedure (below)

# Step 5: Verify data integrity
docker exec uns-claudejp-db psql -U uns_admin -d uns_claudejp -c "
  SELECT COUNT(*) as timer_card_count FROM timer_cards;
  SELECT * FROM information_schema.triggers WHERE trigger_name LIKE '%timer_card%';
"

# Step 6: Restart services
docker compose up -d backend frontend
```

**Prevention:**
- ✅ Run daily backup jobs automatically
- ✅ Test backup restoration monthly
- ✅ Monitor database size and free space
- ✅ Enable PostgreSQL WAL archiving for point-in-time recovery

---

### Scenario 2: Migration Failure During Deployment

**Symptoms:**
```
alembic.util.exc.CommandError: Can't find identifier in the local scope
ERROR: column "employee_id" does not exist (when trying to drop)
ERROR: duplicate constraint name (when creating trigger)
```

**Recovery Steps:**

```bash
# Step 1: Check migration status
docker exec uns-claudejp-backend bash -c "cd /app && alembic current"

# Step 2: Identify which migration failed
docker exec uns-claudejp-backend bash -c "cd /app && alembic history"

# Step 3: Downgrade to last successful migration
docker exec uns-claudejp-backend bash -c "cd /app && alembic downgrade -1"

# Step 4: Review failed migration file
# Edit backend/alembic/versions/[FAILED_MIGRATION].py

# Step 5: Fix the migration (if possible)
# OR rollback to previous code version

# Step 6: Re-apply migrations
docker exec uns-claudejp-backend bash -c "cd /app && alembic upgrade head"

# Step 7: Verify success
docker exec uns-claudejp-backend bash -c "cd /app && alembic current"
```

**Prevention:**
- ✅ Test migrations in development/staging first
- ✅ Review migration code before deployment
- ✅ Have rollback plan prepared
- ✅ Execute migrations during maintenance window only

---

### Scenario 3: Data Inconsistency in Timer Cards

**Symptoms:**
```
- Timer cards missing regular_hours but should have values
- Duplicate timer cards for same employee on same date
- Approval records without approved_by user
- Factory ID mismatch with employee
```

**Recovery Steps:**

```bash
# Step 1: Identify inconsistent records
docker exec uns-claudejp-db psql -U uns_admin -d uns_claudejp -c "
  -- Find records without hours
  SELECT id, hakenmoto_id, work_date, clock_in, clock_out
  FROM timer_cards
  WHERE (regular_hours = 0 AND night_hours = 0 AND holiday_hours = 0)
    AND clock_in IS NOT NULL
    AND clock_out IS NOT NULL;
"

# Step 2: Fix hours by triggering trigger
docker exec uns-claudejp-db psql -U uns_admin -d uns_claudejp -c "
  -- Update records to trigger recalculation
  UPDATE timer_cards
  SET updated_at = NOW()
  WHERE regular_hours = 0 AND night_hours = 0;
"

# Step 3: Find duplicate entries
docker exec uns-claudejp-db psql -U uns_admin -d uns_claudejp -c "
  SELECT hakenmoto_id, work_date, COUNT(*) as count
  FROM timer_cards
  GROUP BY hakenmoto_id, work_date
  HAVING COUNT(*) > 1;
"

# Step 4: Remove duplicates (keep oldest)
docker exec uns-claudejp-db psql -U uns_admin -d uns_claudejp -c "
  DELETE FROM timer_cards a
  WHERE id NOT IN (
    SELECT MIN(id)
    FROM timer_cards b
    WHERE a.hakenmoto_id = b.hakenmoto_id
      AND a.work_date = b.work_date
  );
"

# Step 5: Find orphaned approvals
docker exec uns-claudejp-db psql -U uns_admin -d uns_claudejp -c "
  SELECT id, is_approved, approved_by, approved_at
  FROM timer_cards
  WHERE is_approved = true AND approved_by IS NULL;
"

# Step 6: Fix approval records
docker exec uns-claudejp-db psql -U uns_admin -d uns_claudejp -c "
  UPDATE timer_cards
  SET is_approved = false, approved_by = NULL, approved_at = NULL
  WHERE approved_by IS NULL;
"

# Step 7: Verify factory_id sync
docker exec uns-claudejp-db psql -U uns_admin -d uns_claudejp -c "
  UPDATE timer_cards tc
  SET factory_id = e.factory_id
  FROM employees e
  WHERE tc.hakenmoto_id = e.hakenmoto_id
    AND tc.factory_id != e.factory_id;
"
```

**Prevention:**
- ✅ Database triggers automatically maintain consistency
- ✅ Constraints prevent invalid data entry
- ✅ Regular validation scripts check integrity

---

### Scenario 4: Cascading Failure (Multiple Services Down)

**Symptoms:**
- All containers marked "Exited"
- Docker daemon not responding
- Network connectivity lost
- Disk space insufficient

**Recovery Steps:**

```bash
# Step 1: Check Docker status
docker ps -a

# Step 2: Check system resources
df -h  # Disk space
docker system df  # Docker disk usage

# Step 3: If disk full - cleanup
docker system prune -a --volumes
# WARNING: This removes all unused images/volumes

# Step 4: Restart Docker daemon
systemctl restart docker

# Step 5: Recreate network
docker network create uns-network 2>/dev/null || true

# Step 6: Bring up services in correct order
docker compose up -d db redis
sleep 10
docker compose up -d backend frontend
sleep 20
docker compose up -d adminer

# Step 7: Verify health
docker compose ps
```

**Prevention:**
- ✅ Monitor disk space (alert at 80% full)
- ✅ Implement log rotation to prevent disk fill
- ✅ Use volume management for persistent data
- ✅ Configure Docker to restart on reboot

---

### Scenario 5: Accidental Data Deletion

**Symptoms:**
```sql
-- User runs accidentally: DELETE FROM timer_cards WHERE work_date > '2025-11-01';
-- Or: DROP TABLE timer_cards;
```

**Recovery Steps:**

```bash
# Step 1: STOP all services immediately
docker compose stop

# Step 2: Check backup exists
ls -lh production_backup_*.sql

# Step 3: Verify backup integrity
head -c 100 production_backup_*.sql | grep -q "PostgreSQL"

# Step 4: Restore from backup
BACKUP_FILE="production_backup_2025_11_12_120000.sql"

docker compose up -d db
sleep 10

# Restore database
cat "$BACKUP_FILE" | docker exec -i uns-claudejp-db psql -U uns_admin

# Step 5: Verify restore
docker exec uns-claudejp-db psql -U uns_admin -d uns_claudejp -c "
  SELECT COUNT(*) as timer_card_count FROM timer_cards;
"

# Step 6: Bring up remaining services
docker compose up -d backend frontend

# Step 7: Check for any missing data (created after backup)
# May need to re-enter data manually
```

**Prevention:**
- ✅ Regular automated backups (every 6 hours)
- ✅ Offsite backup copies (AWS S3, GCS, etc.)
- ✅ Access control - don't allow direct DB access
- ✅ SQL query logging for audit trail

---

## 🔧 Recovery Procedures

### Backup Restoration Procedure

**Full Backup Restoration** (Complete database recovery)

```bash
#!/bin/bash
# restore_database.sh

BACKUP_FILE=$1
BACKUP_DATE=$(date +%s)

if [ ! -f "$BACKUP_FILE" ]; then
    echo "[X] Backup file not found: $BACKUP_FILE"
    exit 1
fi

echo "[*] Starting database restoration..."
echo "[*] Backup file: $BACKUP_FILE"
echo "[*] Timestamp: $BACKUP_DATE"

# Step 1: Verify backup integrity
echo "[*] Verifying backup integrity..."
if ! head -c 100 "$BACKUP_FILE" | grep -q "PostgreSQL"; then
    echo "[X] Backup file appears corrupted"
    exit 1
fi

# Step 2: Stop services
echo "[*] Stopping services..."
docker compose stop backend frontend importer

# Step 3: Drop existing database
echo "[*] Dropping existing database..."
docker compose up -d db
sleep 5
docker exec uns-claudejp-db psql -U uns_admin -d postgres -c "
    SELECT pg_terminate_backend(pid)
    FROM pg_stat_activity
    WHERE datname = 'uns_claudejp';
"
docker exec uns-claudejp-db psql -U uns_admin -d postgres -c "DROP DATABASE IF EXISTS uns_claudejp;"

# Step 4: Restore from backup
echo "[*] Restoring from backup (this may take several minutes)..."
cat "$BACKUP_FILE" | docker exec -i uns-claudejp-db psql -U uns_admin -d postgres

# Step 5: Verify restore
echo "[*] Verifying restore..."
TIMER_CARD_COUNT=$(docker exec uns-claudejp-db psql -U uns_admin -d uns_claudejp -t -c "SELECT COUNT(*) FROM timer_cards;")
echo "[OK] Timer cards restored: $TIMER_CARD_COUNT records"

# Step 6: Restart services
echo "[*] Restarting services..."
docker compose up -d backend frontend

# Step 7: Verify health
sleep 20
echo "[*] Verifying health..."
curl -s http://localhost:8000/api/health | jq .

echo "[OK] Database restoration completed at $BACKUP_DATE"
```

**Usage:**
```bash
chmod +x restore_database.sh
./restore_database.sh production_backup_2025_11_12_120000.sql
```

### Point-in-Time Recovery (PITR)

For recovery to a specific point in time (requires WAL archiving enabled):

```bash
# Step 1: Stop database
docker compose stop db

# Step 2: Backup current data directory
docker volume inspect uns-claudejp_postgres_data
# Note the Mountpoint

# Step 3: Copy base backup
cp -r /var/lib/docker/volumes/uns-claudejp_postgres_data/_data /backup/postgres_data_2025_11_12

# Step 4: Restore base backup
rm -rf /var/lib/docker/volumes/uns-claudejp_postgres_data/_data/*
cp -r /backup/postgres_data_base/* /var/lib/docker/volumes/uns-claudejp_postgres_data/_data/

# Step 5: Create recovery configuration
echo "recovery_target_timeline = 'latest'" > recovery.conf
echo "recovery_target_time = '2025-11-12 14:30:00'" >> recovery.conf

# Step 6: Start database
docker compose up -d db

# Step 7: Verify recovery
docker exec uns-claudejp-db psql -U uns_admin -d uns_claudejp -c "SELECT NOW();"
```

**Note:** PITR requires PostgreSQL WAL archiving configuration in docker-compose.yml

### Code Rollback Procedure

For rolling back code changes:

```bash
# Step 1: Identify working commit
git log --oneline | head -20

# Step 2: Stop services
docker compose stop backend frontend

# Step 3: Checkout previous commit
git checkout <COMMIT_SHA>

# Step 4: Rebuild images
docker compose build --no-cache backend frontend

# Step 5: Restart services
docker compose up -d

# Step 6: Verify
docker compose ps
```

---

## 🧪 Testing & Validation

### Monthly Disaster Recovery Drill

**First Friday of each month:**

```bash
#!/bin/bash
# disaster_recovery_drill.sh

echo "=== Monthly Disaster Recovery Drill ==="
echo "Date: $(date)"
echo "Purpose: Verify backup restoration procedures"

# Step 1: Create test backup
echo "[*] Creating test backup..."
TEST_BACKUP="test_backup_$(date +%Y%m%d_%H%M%S).sql"
docker exec uns-claudejp-db pg_dump -U uns_admin uns_claudejp > "$TEST_BACKUP"

# Step 2: Create test database
echo "[*] Creating test database..."
docker exec uns-claudejp-db psql -U uns_admin -d postgres -c "CREATE DATABASE uns_claudejp_test;"

# Step 3: Restore to test database
echo "[*] Restoring to test database..."
cat "$TEST_BACKUP" | docker exec -i uns-claudejp-db psql -U uns_admin -d uns_claudejp_test

# Step 4: Verify data
echo "[*] Verifying test restore..."
PROD_COUNT=$(docker exec uns-claudejp-db psql -U uns_admin -d uns_claudejp -t -c "SELECT COUNT(*) FROM timer_cards;")
TEST_COUNT=$(docker exec uns-claudejp-db psql -U uns_admin -d uns_claudejp_test -t -c "SELECT COUNT(*) FROM timer_cards;")

if [ "$PROD_COUNT" == "$TEST_COUNT" ]; then
    echo "[OK] Restore verification PASSED"
else
    echo "[X] Restore verification FAILED: $PROD_COUNT != $TEST_COUNT"
fi

# Step 5: Cleanup
echo "[*] Cleaning up test database..."
docker exec uns-claudejp-db psql -U uns_admin -d postgres -c "DROP DATABASE uns_claudejp_test;"
rm "$TEST_BACKUP"

echo "[OK] Drill completed"
```

### Data Integrity Checks

**Run weekly:**

```sql
-- Check for duplicates
SELECT hakenmoto_id, work_date, COUNT(*)
FROM timer_cards
GROUP BY hakenmoto_id, work_date
HAVING COUNT(*) > 1;

-- Check for invalid approval states
SELECT COUNT(*) as invalid_approvals
FROM timer_cards
WHERE is_approved = true AND (approved_by IS NULL OR approved_at IS NULL);

-- Check trigger functions exist
SELECT proname FROM pg_proc
WHERE proname LIKE '%timer_card%'
ORDER BY proname;

-- Check indexes are being used
SELECT schemaname, tablename, indexname
FROM pg_indexes
WHERE tablename = 'timer_cards'
ORDER BY indexname;
```

---

## 📞 Contacts & Escalation

### Disaster Response Team

| Role | Name | Phone | Email |
|------|------|-------|-------|
| **Primary DBA** | (Name) | +81-90-XXXX-XXXX | dba@company.com |
| **Secondary DBA** | (Name) | +81-90-XXXX-XXXX | dba2@company.com |
| **DevOps Lead** | (Name) | +81-90-XXXX-XXXX | devops@company.com |
| **System Admin** | (Name) | +81-90-XXXX-XXXX | admin@company.com |

### Escalation Matrix

**Severity P1 (Critical):**
- Notify: Primary DBA + DevOps Lead
- Response time: 15 minutes
- Actions: Immediate restoration from backup
- Communication: Every 15 minutes

**Severity P2 (High):**
- Notify: Primary DBA
- Response time: 1 hour
- Actions: Troubleshoot and resolve
- Communication: Every 30 minutes

**Severity P3 (Medium):**
- Notify: Support Team
- Response time: 4 hours
- Actions: Schedule fix during maintenance
- Communication: Daily update

### Incident Communication

**All team members should receive:**
1. **Incident Notification**: Problem type + estimated impact
2. **Status Updates**: Every 30 minutes (P1) or 1 hour (P2)
3. **Resolution Update**: When issue is resolved
4. **Post-Incident Report**: Root cause analysis + prevention plan

---

## 📋 Backup Management

### Backup Schedule

| Backup Type | Frequency | Retention | Location |
|------------|-----------|-----------|----------|
| **Hourly** | Every hour | 24 hours | `/backups/hourly/` |
| **Daily** | 02:00 JST | 7 days | `/backups/daily/` |
| **Weekly** | Sunday 02:00 | 4 weeks | `/backups/weekly/` |
| **Monthly** | 1st of month | 12 months | AWS S3 / GCS |

### Backup Verification

**Daily automated checks:**

```bash
# Check backup file exists
if [ ! -f "/backups/daily/backup_$(date +%Y%m%d).sql" ]; then
    ALERT: "Daily backup missing!"
fi

# Check backup size (should be > 10MB for production)
SIZE=$(stat -f%z "/backups/daily/backup_$(date +%Y%m%d).sql")
if [ "$SIZE" -lt 10485760 ]; then
    ALERT: "Backup file suspiciously small: $SIZE bytes"
fi

# Check backup integrity
if ! head -c 100 "/backups/daily/backup_$(date +%Y%m%d).sql" | grep -q "PostgreSQL"; then
    ALERT: "Backup file appears corrupted!"
fi
```

### Off-Site Backup (Critical)

**Store monthly backups in:**
- AWS S3: `s3://company-backups/timer-cards/`
- Google Cloud Storage: `gs://company-backups/timer-cards/`
- Azure Blob Storage: `container: timer-card-backups`

**Encryption:** AES-256 for all backups
**Access Control:** Restricted to DBA team only

---

## 🔄 Testing Recovery Procedures

### Annual DR Test

Conducted once per year:
1. Declare "disaster" scenario
2. Attempt full restoration from month-old backup
3. Verify all data restored correctly
4. Document recovery time and any issues
5. Update procedures based on lessons learned

### Documentation Review

Update this document:
- Monthly: Add new scenarios encountered
- Quarterly: Review and update contact info
- Annually: Full review and DR test

---

**Document Owner:** Database Administrator
**Last Reviewed:** 2025-11-12
**Next Review:** 2025-12-12
