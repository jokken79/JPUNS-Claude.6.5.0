# 🚨 INCIDENT RESPONSE PLAYBOOK
## UNS-ClaudeJP 5.4.1 - Quick Response Procedures

**Fecha:** 2025-11-12
**Versión:** 1.0
**Audience:** On-Call Engineers & Incident Commanders

---

## 📋 Quick Reference

### Critical Issues (P1 - Respond in 15 min)
1. **Complete Service Outage**
2. **Data Loss / Corruption**
3. **Security Breach**
4. **All Services Down**

### High Priority Issues (P2 - Respond in 1 hour)
1. **API Returning 500 Errors**
2. **Database Unavailable**
3. **Frontend Blank Page for All Users**
4. **Performance Degradation (p95 > 2 sec)**

### Medium Priority (P3 - Respond in 4 hours)
1. **Specific Endpoint Slow**
2. **Intermittent Errors**
3. **Memory Leak (gradual)**
4. **Cache Not Working**

---

## 🚨 P1 INCIDENTS - Critical (15 minutes)

### Incident: Complete Service Outage

**Detection:**
```
Monitoring alert: Multiple services DOWN
Error rate: 100% (all requests failing)
Uptime: 0%
```

**Immediate Actions (First 5 minutes):**

```bash
# 1. Check if it's a local issue
ping 8.8.8.8  # Internet connectivity
docker ps     # Docker running
docker stats  # Resources

# 2. Get status of all services
docker compose ps

# 3. Check logs
docker compose logs --timestamps --tail 100
```

**Diagnosis & Response (5-15 minutes):**

```bash
# Check each service
curl -v http://localhost:8000/api/health     # Backend
curl -v http://localhost:3000                # Frontend
docker exec uns-claudejp-db psql -c "SELECT 1"  # Database

# If database is down:
docker compose restart db
sleep 90  # Wait for startup
docker exec uns-claudejp-db psql -c "SELECT 1"

# If backend is down:
docker compose logs backend --tail 50 | grep ERROR
docker compose restart backend
sleep 30

# If frontend is down:
docker compose restart frontend
sleep 60  # Wait for compilation
```

**Communication:**

```
Slack message:
🚨 P1 INCIDENT: Service Outage
Time: [TIMESTAMP]
Services: All
Status: Investigating
ETA: [TIME]
Action: [WHAT WE'RE DOING]

Update every 5 minutes until resolved.
```

**Post-Incident:**

```
Root Cause Analysis (RCA):
- What caused the outage?
- Why wasn't this caught?
- What can we prevent this?
- Create ticket for fix
- Schedule post-mortem
```

---

### Incident: Data Loss / Corruption

**Detection:**
```
Database queries failing
Missing data in responses
Reports showing 0 records
```

**Immediate Actions:**

```bash
# 1. STOP WRITING TO DATABASE IMMEDIATELY
docker compose stop backend
docker compose stop importer

# 2. Check for backups
ls -lh backend/backups/
# Get the most recent valid backup

# 3. Notify stakeholders
# Email: "Data issue detected, investigating restoration"

# 4. Assess damage scope
docker exec uns-claudejp-db psql -c "SELECT COUNT(*) FROM candidates;"
# Compare with known good count (should be 1116+)
```

**Recovery:**

```bash
# 1. Restore from backup (tested procedure)
docker compose down
cat backend/backups/[LATEST_BACKUP].sql | docker exec -i uns-claudejp-db psql -U uns_admin uns_claudejp

# 2. Start backend
docker compose up -d backend

# 3. Verify data integrity
docker exec uns-claudejp-db psql -c "SELECT COUNT(*) FROM candidates;"

# 4. Announce recovery
# Email: "Data issue resolved. Service restored."
```

**Prevention:**

```
Increase backup frequency:
- Daily → Hourly backups
- Enable WAL archiving
- Cross-region backup replication
```

---

### Incident: Security Breach

**Detection:**
```
Unauthorized access attempts
Sensitive data exposed
Account takeover detected
```

**Immediate Actions (Critical):**

```bash
# 1. ISOLATE AFFECTED SYSTEMS
docker compose pause backend   # Prevent further damage

# 2. REVOKE COMPROMISED CREDENTIALS
# Change all passwords
# Regenerate API keys
# Revoke active tokens

# 3. COLLECT EVIDENCE
docker logs backend > /tmp/incident_logs_$(date +%s).txt
docker exec uns-claudejp-db pg_dump > /tmp/incident_db_backup.sql

# 4. NOTIFY SECURITY TEAM IMMEDIATELY
# Email security@company.com with "URGENT: Security Incident"
```

**Investigation:**

```bash
# Check logs for unauthorized access
docker logs backend | grep "401\|403\|unauthorized"

# Check database access logs
docker exec uns-claudejp-db psql -c \
  "SELECT * FROM pg_stat_statements WHERE query LIKE '%DROP%' OR query LIKE '%DELETE%' LIMIT 10;"

# Check for data exfiltration
docker logs backend | grep "SELECT.*FROM" | wc -l
# Compare with normal baseline

# Check system files for modifications
docker exec uns-claudejp-backend find /app -newer /app/main.py
```

**Recovery:**

```bash
# 1. If credentials compromised:
# - Change SECRET_KEY immediately
# - Reset all user passwords
# - Revoke all active sessions

# 2. If data exposed:
# - Notify affected users
# - Implement data protection measures
# - Enable enhanced logging

# 3. Restore from backup
docker compose down
cat [CLEAN_BACKUP].sql | docker exec -i uns-claudejp-db psql -U uns_admin uns_claudejp
docker compose up -d
```

**Post-Incident:**

```
Mandatory actions:
- Full forensic investigation
- Security audit
- Implement MFA
- WAF rules for API
- Incident report to management
- Notify users if data exposed
```

---

## ⚠️ P2 INCIDENTS - High Priority (1 hour)

### Incident: API Returning 500 Errors

**Detection:**
```
Error rate: >10% for specific endpoint
Alert: Error Rate threshold exceeded
Monitoring: 500 errors in logs
```

**Response (First 10 minutes):**

```bash
# 1. Isolate the problem
curl -v http://localhost:8000/api/candidates  # Failing endpoint
curl -v http://localhost:8000/api/health      # Health check

# 2. Check backend logs
docker logs uns-claudejp-backend --tail 100 | grep ERROR

# 3. Check database
docker exec uns-claudejp-db psql -c "SELECT 1;"

# 4. Check recent changes
git log --oneline -10
git diff HEAD~1 HEAD
```

**Solution Options:**

```bash
# Option A: Restart backend service
docker compose restart backend
# Monitor error rate - should drop to <1% within 30 sec

# Option B: Rollback code if recent change
git revert HEAD
docker compose build backend
docker compose restart backend

# Option C: Scale backend if overloaded
docker compose up -d --scale backend=2

# Option D: Check database
docker exec uns-claudejp-db psql -c "SELECT pg_stat_activity;"
# Kill long-running queries if necessary
```

**Verification:**

```bash
# Check error rate
curl -s http://localhost:9090/api/v1/query?query=rate(http_requests_total{status="500"}[1m])

# Test specific endpoint multiple times
for i in {1..10}; do
  curl -w "%{http_code}\n" -s http://localhost:8000/api/candidates -o /dev/null
done
# Should see 200 responses (not 500)
```

---

### Incident: Database Unavailable

**Detection:**
```
Error: "Connection refused" from backend
Alert: Database health check failing
Prometheus: ups{job="db"} == 0
```

**Response (First 5 minutes):**

```bash
# 1. Check database container
docker ps | grep db
# If not running: docker compose up -d db

# 2. Check database logs
docker logs uns-claudejp-db --tail 50

# 3. Check health
docker exec uns-claudejp-db pg_isready -U uns_admin

# 4. If issues, restart
docker compose restart db
# Wait 90 seconds for startup

# 5. Verify
curl http://localhost:8000/api/health
# Should return {"status":"healthy"}
```

**Common Solutions:**

```bash
# Disk full
df -h  # Check disk space
# Delete old backups if needed

# Memory exhausted
docker stats
# Increase memory allocation if needed

# Connection pool exhausted
docker exec uns-claudejp-db psql -c "SELECT COUNT(*) FROM pg_stat_activity;"
# Kill idle connections:
docker exec uns-claudejp-db psql -c \
  "SELECT pg_terminate_backend(pid) FROM pg_stat_activity WHERE state = 'idle';"
```

---

### Incident: Frontend Blank Page

**Detection:**
```
Frontend at http://localhost:3000 = blank/white page
User complaints: "Can't see dashboard"
Error rate: High for 3000 port
```

**Response (First 10 minutes):**

```bash
# 1. Check frontend logs
docker logs uns-claudejp-frontend --tail 100

# 2. Look for build errors
docker logs uns-claudejp-frontend | grep -i "error\|fail"

# 3. Check if Next.js compiled
docker logs uns-claudejp-frontend | grep "Ready in"

# 4. Restart frontend
docker compose restart frontend

# 5. Wait for recompilation (3 minutes)
sleep 180
```

**Browser-side fixes:**

```
From browser:
1. Ctrl+Shift+Delete - Clear all cache
2. F5 - Hard refresh
3. F12 - Open DevTools
4. Check Console tab for JavaScript errors
5. Check Network tab for 404/500 responses
```

**If still fails:**

```bash
# Check backend connectivity
# In browser console:
fetch('/api/health').then(r => r.json()).then(console.log)
# Should show health status

# Rebuild frontend
docker compose build --no-cache frontend
docker compose up -d frontend
```

---

## 🛠️ Common P2 Patterns

### Pattern: Slow Performance (p95 > 2 seconds)

```bash
# 1. Check resources
docker stats

# 2. Check slow queries
docker exec uns-claudejp-db psql -c \
  "SELECT query, calls, mean_time FROM pg_stat_statements \
   ORDER BY mean_time DESC LIMIT 5;"

# 3. Solutions
# - Add database indexes
# - Implement caching
# - Scale horizontally (add replicas)
# - Optimize query
```

### Pattern: Intermittent 500 Errors

```bash
# 1. Collect stack traces
docker logs backend 2>&1 | grep -A10 "Traceback\|Error"

# 2. Identify pattern
# - Same endpoint always fails?
# - Specific time of day?
# - After certain operations?

# 3. Reproduce issue
# Try to replicate the error manually
# Add logging to identify root cause

# 4. Fix
# Deploy code fix
# Verify with repeated testing
```

---

## 📋 Incident Response Checklist

### Detection & Reporting
- [ ] Alert received in Slack/PagerDuty
- [ ] Incident confirmed (not false alarm)
- [ ] Severity level assigned (P1/P2/P3)
- [ ] On-call engineer notified
- [ ] Incident channel created

### Assessment & Isolation
- [ ] System status assessed (health checks run)
- [ ] Scope of impact determined
- [ ] Root cause hypothesis formed
- [ ] Affected services isolated if needed
- [ ] Stakeholders notified

### Resolution & Recovery
- [ ] Solution implemented
- [ ] Fix verified (health checks passing)
- [ ] Services operational
- [ ] Performance metrics normal
- [ ] Stakeholders informed of resolution

### Post-Incident
- [ ] Incident log documented
- [ ] Root cause verified
- [ ] RCA ticket created
- [ ] Preventative measures identified
- [ ] Post-mortem scheduled (if P1)

---

## 🔄 Escalation Path

```
Level 1: On-Call Engineer (15 min response)
  ├─ Assess severity
  ├─ Start troubleshooting
  └─ If can't resolve in 15 min → escalate

Level 2: Team Lead (1 hour response)
  ├─ Review situation
  ├─ Bring additional resources
  └─ If can't resolve in 1 hour → escalate

Level 3: Manager (24/7 availability)
  ├─ Make business decisions
  ├─ Notify executive team
  └─ Coordinate external communication

Level 4: Vendor Support (if applicable)
  ├─ For infrastructure issues
  ├─ Database vendor support
  └─ Cloud provider support
```

---

## 📞 Contact Information

```
On-Call Rotation: [Schedule Link]
Slack Channel: #incidents
PagerDuty: [Organization ID]

Team Lead: [Name] - [Phone] - [Slack]
Manager: [Name] - [Phone] - [Slack]
Security Team: security@company.com
Vendors: [Contact Info]
```

---

## 🎓 Training

Every team member should:
- [ ] Read this playbook completely
- [ ] Understand their escalation path
- [ ] Know how to run diagnostic scripts
- [ ] Practice incident response quarterly
- [ ] Participate in post-mortems

---

**Versión:** 1.0
**Última Actualización:** 2025-11-12
**Próxima Revisión:** 2026-02-12
