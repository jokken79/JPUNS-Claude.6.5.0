# 📖 Timer Card Module - Operations Manual

**Version:** 1.0
**Document ID:** OPS-TIMER-001
**Last Updated:** 2025-11-12
**Target Audience:** Production Operations Team, System Administrators, L2 Support
**Timezone:** Asia/Tokyo (JST)

---

## 📋 Table of Contents

1. [Daily Operations Checklist](#daily-operations-checklist)
2. [Monitoring & Alerting](#monitoring--alerting)
3. [Common Issues & Solutions](#common-issues--solutions)
4. [Performance Tuning](#performance-tuning)
5. [Data Management](#data-management)
6. [User Support Procedures](#user-support-procedures)
7. [Emergency Procedures](#emergency-procedures)

---

## ✅ Daily Operations Checklist

### Morning Routine (09:00 JST)

```bash
#!/bin/bash
# morning_check.sh

echo "=== Morning Operations Check ==="
echo "Time: $(date '+%Y-%m-%d %H:%M:%S %Z')"

# 1. Check all services are running
echo "[*] Checking services..."
docker compose ps

# Expected: All services "Up" with health "healthy" or "starting"
if [ "$(docker compose ps | grep -c healthy)" -lt 5 ]; then
    echo "[!] WARNING: Not all services healthy"
fi

# 2. Check database connectivity
echo "[*] Checking database..."
docker exec uns-claudejp-db pg_isready
if [ $? -ne 0 ]; then
    echo "[X] Database not responding!"
    # Run recovery procedure
    docker compose restart db
fi

# 3. Check API health
echo "[*] Checking API..."
HEALTH=$(curl -s http://localhost:8000/api/health | jq -r '.database')
if [ "$HEALTH" != "connected" ]; then
    echo "[X] Database connection failed in API"
fi

# 4. Check disk space
echo "[*] Checking disk space..."
DISK_USAGE=$(df / | awk 'NR==2 {print $5}' | sed 's/%//')
if [ "$DISK_USAGE" -gt 80 ]; then
    echo "[!] WARNING: Disk usage at $DISK_USAGE%"
fi

# 5. Check recent errors in logs
echo "[*] Checking for errors in logs..."
ERROR_COUNT=$(docker compose logs --tail=1000 | grep -i "ERROR" | wc -l)
if [ "$ERROR_COUNT" -gt 10 ]; then
    echo "[!] WARNING: $ERROR_COUNT errors in recent logs"
    docker compose logs --tail=50 | grep -i "ERROR"
fi

# 6. Check database size
echo "[*] Checking database size..."
DB_SIZE=$(docker exec uns-claudejp-db psql -U uns_admin -t -d uns_claudejp -c "SELECT pg_size_pretty(pg_database_size('uns_claudejp'));")
echo "   Database size: $DB_SIZE"

# 7. Timer card statistics
echo "[*] Gathering timer card stats..."
CARD_COUNT=$(docker exec uns-claudejp-db psql -U uns_admin -d uns_claudejp -t -c "SELECT COUNT(*) FROM timer_cards;")
APPROVED_COUNT=$(docker exec uns-claudejp-db psql -U uns_admin -d uns_claudejp -t -c "SELECT COUNT(*) FROM timer_cards WHERE is_approved = true;")
PENDING_COUNT=$(docker exec uns-claudejp-db psql -U uns_admin -d uns_claudejp -t -c "SELECT COUNT(*) FROM timer_cards WHERE is_approved = false;")

echo "   Total cards: $CARD_COUNT"
echo "   Approved: $APPROVED_COUNT"
echo "   Pending approval: $PENDING_COUNT"

echo "[OK] Morning check completed"
```

**Run this script:**
```bash
chmod +x morning_check.sh
./morning_check.sh
```

### End of Day Routine (18:00 JST)

```bash
#!/bin/bash
# evening_check.sh

echo "=== Evening Operations Check ==="

# 1. Verify all backup jobs completed
echo "[*] Checking backups..."
ls -lh /backups/daily/backup_$(date +%Y%m%d).sql

# 2. Check for any warnings or errors today
echo "[*] Summarizing logs..."
docker compose logs --since 5h | grep -i "WARNING\|ERROR\|FAIL" | tail -20

# 3. Review any failed operations
echo "[*] Checking failed operations..."
docker compose logs --since 5h | grep -i "FAILED\|TIMEOUT\|CRASHED"

# 4. Check resource usage
echo "[*] Resource usage:"
docker stats --no-stream

# 5. Prepare tomorrow's report
echo "[*] Generating tomorrow's report..."
docker exec uns-claudejp-db psql -U uns_admin -d uns_claudejp -t -c "
  SELECT
    (SELECT COUNT(*) FROM timer_cards WHERE work_date = CURRENT_DATE) as today_entries,
    (SELECT COUNT(*) FROM timer_cards WHERE is_approved = false AND work_date < CURRENT_DATE) as overdue_approvals,
    (SELECT COUNT(*) FROM users WHERE last_login > NOW() - INTERVAL '1 day') as active_users;
"

echo "[OK] Evening check completed"
```

---

## 📊 Monitoring & Alerting

### Key Metrics to Monitor

#### 1. Database Health

```bash
# Monitor database connections
watch -n 5 'docker exec uns-claudejp-db psql -U uns_admin -t -d uns_claudejp -c "
  SELECT count(*) as active_connections FROM pg_stat_activity;
"'

# Alert threshold: > 50 connections
```

#### 2. API Response Time

```bash
# Monitor API response time
while true; do
  START=$(date +%s%N | cut -b1-13)
  curl -s http://localhost:8000/api/health > /dev/null
  END=$(date +%s%N | cut -b1-13)
  LATENCY=$((END - START))
  echo "$(date): API latency: ${LATENCY}ms"
  sleep 10
done

# Alert threshold: > 1000ms for health endpoint
```

#### 3. Query Performance

```bash
# Monitor slow queries
docker exec uns-claudejp-db psql -U uns_admin -d uns_claudejp -c "
  SELECT
    query,
    calls,
    mean_time::numeric(10,2) as avg_ms,
    max_time::numeric(10,2) as max_ms
  FROM pg_stat_statements
  WHERE mean_time > 100  -- queries averaging >100ms
  ORDER BY mean_time DESC
  LIMIT 10;
"

# Alert threshold: Any query averaging > 500ms
```

#### 4. Disk Space

```bash
# Monitor disk usage
df -h | awk 'NR>1 {print $5 " - " $6}' | column -t

# Alert thresholds:
# - WARNING: 80% full
# - CRITICAL: 90% full
```

#### 5. Timer Card Processing

```bash
# Monitor timer card metrics
docker exec uns-claudejp-db psql -U uns_admin -d uns_claudejp -c "
  SELECT
    work_date,
    COUNT(*) as total_cards,
    COUNT(CASE WHEN is_approved = true THEN 1 END) as approved,
    COUNT(CASE WHEN is_approved = false THEN 1 END) as pending,
    AVG(regular_hours::numeric) as avg_regular_hours,
    AVG(night_hours::numeric) as avg_night_hours,
    AVG(holiday_hours::numeric) as avg_holiday_hours
  FROM timer_cards
  WHERE work_date >= CURRENT_DATE - INTERVAL '7 days'
  GROUP BY work_date
  ORDER BY work_date DESC;
"
```

### Setting Up Alerts in Docker

Create alert script for common issues:

```bash
#!/bin/bash
# setup_alerts.sh

# Alert: Database Down
docker exec uns-claudejp-db pg_isready || {
    echo "ALERT: Database is not responding!"
    # Attempt recovery
    docker compose restart db
}

# Alert: Disk Full (>90%)
DISK_USAGE=$(df / | awk 'NR==2 {print $5}' | sed 's/%//')
if [ "$DISK_USAGE" -gt 90 ]; then
    echo "CRITICAL ALERT: Disk usage at $DISK_USAGE%"
    docker system prune -a --volumes -f
fi

# Alert: High Error Rate
ERROR_RATE=$(docker compose logs --tail=10000 | grep -c "ERROR")
if [ "$ERROR_RATE" -gt 50 ]; then
    echo "ALERT: High error rate detected ($ERROR_RATE errors in recent logs)"
fi

# Alert: API Timeout
if ! curl -s --max-time 5 http://localhost:8000/api/health > /dev/null; then
    echo "ALERT: API not responding within 5 seconds"
fi

# Alert: Memory Pressure
MEMORY_USAGE=$(docker stats --no-stream | grep backend | awk '{print $7}' | sed 's/%//')
if [ "$MEMORY_USAGE" -gt 80 ]; then
    echo "ALERT: Backend memory usage at $MEMORY_USAGE%"
fi
```

---

## 🆘 Common Issues & Solutions

### Issue 1: "Duplicate Timer Card" Error

**Symptom:**
```
ERROR: Duplicate timer card for hakenmoto_id 123 on date 2025-11-12
```

**Diagnosis:**
```bash
# Find duplicates
docker exec uns-claudejp-db psql -U uns_admin -d uns_claudejp -c "
  SELECT hakenmoto_id, work_date, COUNT(*), array_agg(id) as ids
  FROM timer_cards
  GROUP BY hakenmoto_id, work_date
  HAVING COUNT(*) > 1;
"
```

**Solution:**
```bash
# Option 1: Delete duplicate (keep newest)
docker exec uns-claudejp-db psql -U uns_admin -d uns_claudejp -c "
  DELETE FROM timer_cards a
  WHERE id NOT IN (
    SELECT MAX(id)
    FROM timer_cards b
    WHERE a.hakenmoto_id = b.hakenmoto_id
      AND a.work_date = b.work_date
  );
"

# Option 2: Merge data from both entries (if they have different data)
# This requires manual review - contact DBA
```

**Prevention:**
- ✅ Application should check for existing cards before creating
- ✅ Database unique constraint prevents duplicates at write time
- ✅ Regular validation: `CONSTRAINT uq_timer_cards_hakenmoto_work_date`

---

### Issue 2: Approval Workflow Broken

**Symptom:**
```
is_approved = true, but approved_by is NULL
```

**Diagnosis:**
```bash
# Find broken approval records
docker exec uns-claudejp-db psql -U uns_admin -d uns_claudejp -c "
  SELECT id, hakenmoto_id, work_date, is_approved, approved_by, approved_at
  FROM timer_cards
  WHERE is_approved = true AND (approved_by IS NULL OR approved_at IS NULL);
"
```

**Solution:**
```bash
# Reset approval (auto-corrected by trigger)
docker exec uns-claudejp-db psql -U uns_admin -d uns_claudejp -c "
  UPDATE timer_cards
  SET is_approved = false, approved_by = NULL, approved_at = NULL
  WHERE is_approved = true AND approved_by IS NULL;
"
```

---

### Issue 3: Missing Hours Calculations

**Symptom:**
```
regular_hours = 0, night_hours = 0, holiday_hours = 0
But clock_in and clock_out are set
```

**Diagnosis:**
```bash
# Find records needing recalculation
docker exec uns-claudejp-db psql -U uns_admin -d uns_claudejp -c "
  SELECT id, hakenmoto_id, work_date, clock_in, clock_out,
         regular_hours, night_hours, holiday_hours
  FROM timer_cards
  WHERE clock_in IS NOT NULL
    AND clock_out IS NOT NULL
    AND regular_hours + night_hours + holiday_hours = 0;
"
```

**Solution:**
```bash
# Trigger recalculation by updating timestamp
docker exec uns-claudejp-db psql -U uns_admin -d uns_claudejp -c "
  UPDATE timer_cards
  SET updated_at = NOW()
  WHERE clock_in IS NOT NULL
    AND clock_out IS NOT NULL
    AND regular_hours + night_hours + holiday_hours = 0;
"

# Verify recalculation
docker exec uns-claudejp-db psql -U uns_admin -d uns_claudejp -c "
  SELECT id, hakenmoto_id, regular_hours, night_hours, holiday_hours
  FROM timer_cards
  WHERE updated_at > NOW() - INTERVAL '1 minute'
  LIMIT 10;
"
```

---

### Issue 4: RBAC Permission Denied

**Symptom:**
```
HTTP 403 Forbidden - User cannot access timer card
```

**Diagnosis:**
```bash
# Check user role
curl -s http://localhost:8000/api/users/me \
  -H "Authorization: Bearer YOUR_TOKEN" | jq .role

# Check user email
curl -s http://localhost:8000/api/users/me \
  -H "Authorization: Bearer YOUR_TOKEN" | jq .email

# Find associated employee
docker exec uns-claudejp-db psql -U uns_admin -d uns_claudejp -c "
  SELECT hakenmoto_id FROM employees WHERE email = 'user@example.com';
"
```

**Solution:**
```bash
# For EMPLOYEE role - verify email matches employee record
# For KANRININSHA role - verify factory_id assignment
# For ADMIN/SUPER_ADMIN - should always have access

# If still denied after verification:
# 1. Verify token is valid: JWT expiry time
# 2. Check secret key hasn't changed
# 3. Verify user role in database:

docker exec uns-claudejp-db psql -U uns_admin -d uns_claudejp -c "
  SELECT id, username, email, role FROM users WHERE email = 'user@example.com';
"
```

---

### Issue 5: OCR Timeout

**Symptom:**
```
504 Gateway Timeout - OCR processing took too long
```

**Diagnosis:**
```bash
# Check OCR service logs
docker compose logs backend | grep -i "ocr\|timeout"

# Check Azure OCR quota
# Log into Azure Portal and verify Computer Vision API quota
```

**Solution:**
```bash
# Option 1: Retry with simpler image
# Re-upload the document with better quality/size

# Option 2: Override provider
# Edit environment to skip Azure: FALLBACK_TO_EASYOCR=true

# Option 3: Increase timeout (in production code)
# Update backend/app/services/hybrid_ocr_service.py
# Change: TIMEOUT_SECONDS = 30 → 60

# Option 4: Use direct fallback
# Deploy alternative OCR provider (EasyOCR or Tesseract)
docker compose exec backend python -c "
from app.services.hybrid_ocr_service import HybridOCRService
service = HybridOCRService()
# This will use EasyOCR if Azure fails
"
```

---

### Issue 6: Database Connection Pool Exhausted

**Symptom:**
```
sqlalchemy.pool.NullPool - QueuePool object at 0x... is exhausted
No connection from pool available within 10 seconds
```

**Diagnosis:**
```bash
# Check active connections
docker exec uns-claudejp-db psql -U uns_admin -t -d uns_claudejp -c "
  SELECT usename, count(*) FROM pg_stat_activity GROUP BY usename;
"

# Check long-running queries
docker exec uns-claudejp-db psql -U uns_admin -d uns_claudejp -c "
  SELECT pid, usename, application_name, state, query,
         NOW() - pg_stat_activity.query_start AS duration
  FROM pg_stat_activity
  WHERE state != 'idle'
  ORDER BY duration DESC;
"
```

**Solution:**
```bash
# Option 1: Restart backend service
docker compose restart backend

# Option 2: Kill long-running queries
docker exec uns-claudejp-db psql -U uns_admin -d uns_claudejp -c "
  SELECT pg_terminate_backend(pid)
  FROM pg_stat_activity
  WHERE usename = 'uns_admin'
    AND NOW() - query_start > INTERVAL '5 minutes';
"

# Option 3: Increase connection pool
# Edit backend/app/core/database.py
# Change: pool_size=20 → pool_size=50

# Option 4: Enable connection pooling with PgBouncer
# Add to docker-compose.yml:
#   pgbouncer:
#     image: pgbouncer:latest
#     command: /etc/pgbouncer/pgbouncer.ini
```

---

## 🔧 Performance Tuning

### Database Query Optimization

```bash
# Identify slow queries
docker exec uns-claudejp-db psql -U uns_admin -d uns_claudejp -c "
  -- Enable pg_stat_statements extension
  CREATE EXTENSION IF NOT EXISTS pg_stat_statements;
"

# Find queries to optimize
docker exec uns-claudejp-db psql -U uns_admin -d uns_claudejp -c "
  SELECT
    query,
    calls,
    mean_time::numeric(10,2) as avg_ms,
    total_time::numeric(10,2) as total_ms
  FROM pg_stat_statements
  WHERE mean_time > 100
  ORDER BY mean_time DESC
  LIMIT 10;
"

# Verify indexes are being used
docker exec uns-claudejp-db psql -U uns_admin -d uns_claudejp -c "
  EXPLAIN ANALYZE
  SELECT * FROM timer_cards
  WHERE hakenmoto_id = 1 AND work_date >= '2025-11-01';
"

# Should show: "Index Scan" not "Sequential Scan"
```

### Backend Performance Tuning

```bash
# Monitor backend resource usage
docker stats uns-claudejp-backend --no-stream

# If high CPU:
# 1. Check for N+1 queries: logs should show query patterns
# 2. Enable query batching where possible
# 3. Increase uvicorn worker count:
#    docker compose edit
#    Change: WORKERS=4 → WORKERS=8

# If high memory:
# 1. Check for memory leaks: restart backend every 24h
# 2. Reduce cache size
# 3. Implement request timeouts
```

### Frontend Performance

```bash
# Monitor frontend build time
docker compose logs frontend | grep "Compiled client\|Built in"

# If slow compilation:
# 1. Clear Next.js cache: rm -rf frontend/.next
# 2. Rebuild frontend: docker compose build frontend --no-cache
# 3. Enable SWC minification (faster than Terser)

# Monitor browser performance
# 1. Chrome DevTools > Performance tab
# 2. Record page load
# 3. Identify slow components
# 4. Check Network tab for slow API calls
```

---

## 📊 Data Management

### Regular Database Maintenance

```bash
#!/bin/bash
# maintenance.sh - Run weekly

echo "=== Database Maintenance ==="

# 1. VACUUM and ANALYZE
docker exec uns-claudejp-db psql -U uns_admin -d uns_claudejp -c "
  VACUUM ANALYZE timer_cards;
"

# 2. Reindex if needed
docker exec uns-claudejp-db psql -U uns_admin -d uns_claudejp -c "
  REINDEX INDEX CONCURRENTLY idx_timer_cards_hakenmoto;
"

# 3. Update table statistics
docker exec uns-claudejp-db psql -U uns_admin -d uns_claudejp -c "
  ANALYZE timer_cards;
"

# 4. Check for bloat
docker exec uns-claudejp-db psql -U uns_admin -d uns_claudejp -c "
  SELECT schemaname, tablename,
         ROUND(100 * (CASE WHEN n_tup_upd = 0 THEN 0 ELSE n_tup_dead / (n_tup_live + n_tup_dead) END)::numeric, 2) as dead_ratio
  FROM pg_stat_user_tables
  WHERE n_tup_live + n_tup_dead > 0
  ORDER BY dead_ratio DESC
  LIMIT 10;
"

echo "[OK] Maintenance completed"
```

### Data Archival

```bash
# Archive old timer cards (older than 1 year)
docker exec uns-claudejp-db psql -U uns_admin -d uns_claudejp -c "
  -- Create archive table
  CREATE TABLE IF NOT EXISTS timer_cards_archive AS
  SELECT * FROM timer_cards WHERE work_date < '2024-11-12';

  -- Delete archived records from main table
  DELETE FROM timer_cards WHERE work_date < '2024-11-12';

  -- Reindex main table
  REINDEX TABLE timer_cards;
"

# Backup archive table
docker exec uns-claudejp-db pg_dump -U uns_admin -t timer_cards_archive uns_claudejp > timer_cards_archive_2025.sql
```

---

## 👥 User Support Procedures

### Handling User Issues

**Step 1: Gather Information**

```bash
# From user:
- What are they trying to do?
- What error do they see?
- When did it start happening?
- Is it affecting just them or multiple users?
```

**Step 2: Check User Status**

```bash
# Find user in database
docker exec uns-claudejp-db psql -U uns_admin -d uns_claudejp -c "
  SELECT id, username, email, role, is_active, last_login FROM users
  WHERE email = 'user@example.com';
"

# Check if account is locked
SELECT * FROM audit_log WHERE user_id = 123 ORDER BY created_at DESC LIMIT 10;
```

**Step 3: Troubleshoot Issue**

```bash
# Is it an authentication issue?
# Test login with JWT endpoint
curl -X POST http://localhost:8000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"user","password":"pass"}'

# Is it a timer card access issue?
# Verify RBAC filtering works
curl http://localhost:8000/api/timer-cards/ \
  -H "Authorization: Bearer TOKEN"

# Is it a data issue?
# Check if user has timer cards
docker exec uns-claudejp-db psql -U uns_admin -d uns_claudejp -c "
  SELECT COUNT(*) FROM timer_cards
  WHERE hakenmoto_id = (
    SELECT hakenmoto_id FROM employees WHERE email = 'user@example.com'
  );
"
```

**Step 4: Provide Solution**

| Issue | Solution |
|-------|----------|
| **Can't login** | Reset password via admin panel or create new account |
| **Can't see timer cards** | Verify employee_hakenmoto_id assignment |
| **Can't approve cards** | Verify user role is COORDINATOR or above |
| **Wrong data showing** | Verify RBAC filtering (check user role + factory assignment) |
| **OCR failing** | Re-upload document in JPG format, <5MB |

---

## 🚨 Emergency Procedures

### Service Down - Immediate Response

```bash
#!/bin/bash
# emergency_response.sh

echo "EMERGENCY: Service Down!"
echo "Time: $(date)"

# Step 1: Assess the situation
echo "[*] Checking services..."
docker compose ps

# Step 2: Check which service is down
docker compose ps | grep "Exited\|Unhealthy"

# Step 3: Get error message
docker compose logs --tail=100

# Step 4: Immediate restart (safe option)
echo "[*] Attempting service restart..."
docker compose restart backend frontend

# Step 5: Monitor recovery
for i in {1..30}; do
  if curl -s http://localhost:8000/api/health | grep -q "healthy"; then
    echo "[OK] Services restored at attempt $i"
    break
  fi
  sleep 2
done

# Step 6: If still down, escalate
if ! curl -s http://localhost:8000/api/health > /dev/null; then
  echo "[X] Services still down after restart"
  echo "[!] ESCALATING: Call DBA on-call"
fi
```

### Data Corruption Detected

```bash
#!/bin/bash
# data_corruption_response.sh

echo "WARNING: Data corruption detected!"

# Step 1: STOP all writes
docker compose stop backend importer

# Step 2: Verify extent of corruption
docker exec uns-claudejp-db psql -U uns_admin -d uns_claudejp -c "
  -- Run integrity checks
  SELECT COUNT(*) FROM pg_constraint;
  REINDEX DATABASE CONCURRENTLY uns_claudejp;
"

# Step 3: If REINDEX fails - restore from backup
# See: Disaster Recovery Plan

# Step 4: Notify management
echo "ALERT: Data corruption detected, restoring from backup"
```

---

## 📞 Support Escalation

**Level 1: Common Issues (30 min)**
- User cannot login → Reset password
- Duplicate timer card → Delete and recreate
- Missing data → Check RBAC permissions

**Level 2: Technical Issues (1-2 hours)**
- Database performance → Run maintenance
- API timeout → Check resource usage
- RBAC not working → Verify role assignments

**Level 3: Critical Issues (Escalate immediately)**
- Database down → Restore from backup
- Data corruption → DBA investigation
- All services down → Emergency response team

**Level 4: DBA Escalation**
- PostgreSQL config changes needed
- Migration failures
- Data recovery from backup

---

**Operations Manual Owner:** DevOps Team
**Last Updated:** 2025-11-12
**Next Review:** 2025-12-12
**Contact:** operations@company.com | +81-90-XXXX-XXXX
