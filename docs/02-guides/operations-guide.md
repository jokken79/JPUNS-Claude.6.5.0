# 📋 Operations Runbook - UNS-ClaudeJP 5.4.1

## Table of Contents
1. Daily Operations
2. Common Issues & Solutions
3. Emergency Procedures
4. Maintenance Tasks
5. Performance Optimization
6. Security Operations

---

## 🔧 Daily Operations

### Morning Checklist (Start of Day)

```bash
#!/bin/bash
# Daily morning checklist

echo "=== Daily Operations Checklist ==="
echo ""

# 1. Check container health
echo "1. Checking container health..."
docker compose ps
# All should show "healthy" or "running"

# 2. Check disk space
echo "2. Checking disk space..."
df -h | grep -E "/$|/data"
# Should have >20% free space

# 3. Check memory
echo "3. Checking memory..."
free -h
# Should have available memory

# 4. Check database
echo "4. Checking database..."
docker exec uns-claudejp-db pg_isready
# Should return "accepting connections"

# 5. Check Redis
echo "5. Checking Redis..."
docker exec uns-claudejp-redis redis-cli ping
# Should return "PONG"

# 6. Check recent errors in logs
echo "6. Checking for errors..."
docker compose logs --since 24h | grep -i error | tail -20

# 7. Verify backups
echo "7. Checking backups..."
ls -lh ./backups/ | head -5
# Should show recent backup files

echo ""
echo "=== Morning Checklist Complete ==="
```

### Monitoring Dashboard Access

```bash
# Access monitoring tools
- Grafana: http://your-domain:3001
  Login: prodadmin / [GRAFANA_ADMIN_PASSWORD]
  
- Prometheus: http://your-domain:9090
  No authentication needed
  
- Tempo (Traces): Accessible through Grafana
  
- API Health: http://your-domain/api/health
```

### View Logs

```bash
# Real-time backend logs
docker compose logs -f backend

# Real-time frontend logs
docker compose logs -f frontend

# Real-time database logs
docker compose logs -f db

# View last 50 lines of backend logs
docker compose logs --tail=50 backend

# View logs from last 1 hour
docker compose logs --since 1h backend

# Search for errors
docker compose logs backend | grep -i error
```

---

## 🐛 Common Issues & Solutions

### Issue 1: High CPU Usage

**Symptoms**: CPU >80%, slow response times

**Solution**:
```bash
# 1. Identify which container
docker stats
# Note the container with high CPU

# 2. Check logs for errors
docker logs [container-name]

# 3. Restart service
docker compose restart [service-name]

# 4. If persists, scale backend
docker compose up -d --scale backend=3

# 5. Monitor
docker stats
```

### Issue 2: High Memory Usage

**Symptoms**: Memory >85%, out of memory errors

**Solution**:
```bash
# 1. Check which container
docker stats

# 2. View memory usage details
docker exec [container] ps aux | sort -k4 -rn

# 3. Increase memory limit in docker-compose.yml
# And restart

# 4. Or restart the service
docker compose restart [service-name]
```

### Issue 3: Database Connection Errors

**Symptoms**: "too many connections" or connection refused

**Solution**:
```bash
# 1. Check connection count
docker exec uns-claudejp-db psql -U uns_admin -d uns_claudejp \
  -c "SELECT count(*) FROM pg_stat_activity;"

# 2. Check connection pool settings
docker exec uns-claudejp-backend grep pool_size /app/app/core/database.py

# 3. Restart database
docker compose restart db

# 4. Restart backend to clear connections
docker compose restart backend
```

### Issue 4: Slow API Responses

**Symptoms**: API calls taking >5 seconds

**Solution**:
```bash
# 1. Check backend logs for slow queries
docker compose logs backend | grep "took"

# 2. Check database slow query log
docker exec uns-claudejp-db psql -U uns_admin -d uns_claudejp -c \
  "SELECT query, calls, total_time FROM pg_stat_statements 
   ORDER BY total_time DESC LIMIT 10;"

# 3. Check if index is missing
# Review missing indexes from Grafana or query logs

# 4. Restart backend
docker compose restart backend

# 5. Monitor performance metrics
docker stats
```

### Issue 5: Application Won't Start

**Symptoms**: Container keeps restarting or exits immediately

**Solution**:
```bash
# 1. Check logs
docker compose logs backend

# 2. Check configuration
grep -v "^#" .env.prod | grep -v "^$"
# Verify all variables are set correctly

# 3. Check disk space
df -h

# 4. Check port conflicts
netstat -tulpn | grep LISTEN

# 5. Rebuild and restart
docker compose down
docker compose build --no-cache
docker compose up -d

# 6. Monitor startup
docker compose logs -f backend
```

### Issue 6: Database Won't Start

**Symptoms**: Database container exits or is unhealthy

**Solution**:
```bash
# 1. Check logs
docker compose logs db

# 2. Check if data directory is corrupted
docker exec uns-claudejp-db pg_verify_checksums

# 3. Restore from backup
docker compose down
cat ./backups/backup-LATEST.sql | \
  docker exec -i uns-claudejp-db psql -U uns_admin uns_claudejp

# 4. Start database
docker compose up -d db

# 5. Verify
docker compose ps db
```

### Issue 7: Backup Failed

**Symptoms**: Backups not being created, backup service unhealthy

**Solution**:
```bash
# 1. Check backup logs
docker compose logs backup

# 2. Check backup directory
ls -lh ./backups/
du -sh ./backups/

# 3. Verify disk space
df -h ./backups/

# 4. Manually create backup
docker exec uns-claudejp-db pg_dump -U uns_admin uns_claudejp > \
  ./backups/manual-$(date +%Y%m%d-%H%M%S).sql

# 5. Restart backup service
docker compose restart backup
```

---

## 🚨 Emergency Procedures

### Emergency: Application Down (Complete Outage)

**Step 1: Immediate Response**
```bash
# 1. Check status
docker compose ps

# 2. Try to restart everything
docker compose down
sleep 10
docker compose up -d

# 3. Wait and check
sleep 30
docker compose ps
```

**Step 2: If Still Down**
```bash
# 1. Check logs for errors
docker compose logs | tail -100

# 2. Check system resources
df -h
free -h
top -b -n 1 | head -20

# 3. Rebuild and restart
docker compose down
docker compose build --no-cache backend frontend
docker compose up -d
```

**Step 3: If Database Issues**
```bash
# 1. Try to recover
docker exec uns-claudejp-db pg_isready

# 2. Check for corruption
docker exec uns-claudejp-db pg_verify_checksums

# 3. Restore from latest backup
docker compose stop db
# See "Restore Database" section below
docker compose start db
```

**Step 4: Notify Users**
```bash
# 1. Update status page
# 2. Send notification email
# 3. Inform support team
# 4. Document incident
```

### Emergency: Data Loss / Corruption

**Immediate Actions**:
```bash
# 1. STOP the application
docker compose down

# 2. BACKUP current state (if possible)
tar -czf ./backups/corrupted-state-$(date +%Y%m%d-%H%M%S).tar.gz ./

# 3. IDENTIFY latest good backup
ls -lh ./backups/ | grep ".sql"

# 4. RESTORE from backup
docker compose up -d db
sleep 30
cat ./backups/LATEST-GOOD-BACKUP.sql | \
  docker exec -i uns-claudejp-db psql -U uns_admin uns_claudejp

# 5. VERIFY data integrity
docker exec uns-claudejp-db psql -U uns_admin -d uns_claudejp \
  -c "SELECT COUNT(*) FROM candidates, employees, factories;"

# 6. RESTART application
docker compose up -d

# 7. TEST functionality
curl http://localhost/api/health
# Manually test key workflows
```

### Emergency: Security Breach Suspected

**Immediate Actions**:
```bash
# 1. CHECK recent logs for unauthorized access
docker compose logs backend | grep "401\|403\|unauthorized"

# 2. REVIEW audit logs
docker exec uns-claudejp-db psql -U uns_admin -d uns_claudejp \
  -c "SELECT * FROM audit_log ORDER BY created_at DESC LIMIT 50;"

# 3. ROTATE credentials immediately
# Change POSTGRES_PASSWORD, SECRET_KEY, REDIS_PASSWORD, etc.
# Update .env and restart services

# 4. REVIEW user access
# Check if any unauthorized users were created

# 5. RESTORE from known-good backup if compromised
# See "Emergency Data Recovery" section

# 6. NOTIFY security team
# Document incident
```

---

## 🔄 Maintenance Tasks

### Rotate Passwords

```bash
# 1. GENERATE new passwords
python -c "import secrets; print(secrets.token_hex(32))"

# 2. UPDATE .env.prod with new passwords
nano .env.prod
# Change: POSTGRES_PASSWORD, SECRET_KEY, REDIS_PASSWORD, etc.

# 3. RESTART services
docker compose down
docker compose up -d

# 4. VERIFY services are healthy
docker compose ps
```

### Update Application

```bash
# 1. BACKUP everything
./backups/pre-update-$(date +%Y%m%d).sql

# 2. FETCH latest code
git fetch origin
git pull origin [branch]

# 3. BUILD new images
docker compose build --no-cache

# 4. VERIFY tests
./run_all_tests.sh

# 5. RESTART services
docker compose down
docker compose up -d

# 6. MONITOR
docker compose logs -f
```

### Clean Up Disk Space

```bash
# 1. Remove old backups
find ./backups/ -name "*.sql" -mtime +30 -delete

# 2. Prune docker images
docker image prune -a

# 3. Prune docker volumes
docker volume prune

# 4. Clean logs
docker compose logs --follow | wc -l

# 5. Verify space
df -h
```

### Database Maintenance

```bash
# 1. VACUUM (reclaim disk space)
docker exec uns-claudejp-db vacuumdb -U uns_admin -d uns_claudejp

# 2. ANALYZE (update statistics)
docker exec uns-claudejp-db analyzedb -U uns_admin -d uns_claudejp

# 3. REINDEX (rebuild indexes)
docker exec uns-claudejp-db reindexdb -U uns_admin -d uns_claudejp
```

---

## 📊 Performance Optimization

### Identify Slow Queries

```bash
# 1. Enable query logging
docker exec uns-claudejp-db psql -U uns_admin -d uns_claudejp -c \
  "ALTER SYSTEM SET log_min_duration_statement = 1000;"

# 2. Reload config
docker exec uns-claudejp-db psql -U uns_admin -d uns_claudejp -c \
  "SELECT pg_reload_conf();"

# 3. View slow queries
docker exec uns-claudejp-db tail -f /var/log/postgresql/postgresql.log | grep "duration:"

# 4. Analyze with EXPLAIN
docker exec uns-claudejp-db psql -U uns_admin -d uns_claudejp -c \
  "EXPLAIN ANALYZE SELECT * FROM candidates WHERE status = 'ACTIVE';"
```

### Scale Backend for Load

```bash
# 1. Monitor current load
docker stats

# 2. Scale backend to 3 instances
docker compose up -d --scale backend=3

# 3. Verify all healthy
docker compose ps backend

# 4. Monitor load distribution
docker stats | grep backend
```

### Cache Optimization

```bash
# 1. Check Redis memory usage
docker exec uns-claudejp-redis redis-cli info memory

# 2. Monitor cache hit rate
docker exec uns-claudejp-redis redis-cli info stats

# 3. Clear cache if needed (WARNING: affects performance)
docker exec uns-claudejp-redis redis-cli FLUSHALL
```

---

## 🔒 Security Operations

### Regular Security Checks

```bash
# 1. Review access logs for anomalies
docker compose logs backend | grep "login\|failed\|error"

# 2. Check for unauthorized users
docker exec uns-claudejp-db psql -U uns_admin -d uns_claudejp \
  -c "SELECT username, role, created_at FROM users ORDER BY created_at DESC;"

# 3. Review audit trail
docker exec uns-claudejp-db psql -U uns_admin -d uns_claudejp \
  -c "SELECT * FROM admin_audit_log ORDER BY created_at DESC LIMIT 100;"

# 4. Check failed login attempts
docker compose logs backend | grep "401\|Unauthorized" | wc -l
```

### SSL Certificate Renewal

```bash
# Before certificate expires (30 days before)

# 1. Renew with Let's Encrypt
certbot renew

# 2. Copy new certificate to certs directory
cp /etc/letsencrypt/live/domain.com/fullchain.pem ./certs/
cp /etc/letsencrypt/live/domain.com/privkey.pem ./certs/

# 3. Restart nginx
docker exec uns-claudejp-nginx nginx -s reload

# 4. Verify
curl -I https://your-domain.com
```

---

## 📞 Escalation Procedures

### When to Escalate to DevOps

- Service down >15 minutes and not fixed
- Database corruption suspected
- Data loss occurred
- Security breach suspected
- Cannot restore from backup
- Need to scale infrastructure

### When to Contact Development

- Bug in application code
- Data migration issues
- Feature malfunction
- API endpoint not working
- Type errors in frontend

### When to Contact Security Team

- Unauthorized access detected
- Credentials compromised
- DDoS attack
- Malware suspected
- Compliance issue

---

## 📝 Incident Reporting

```bash
# Create incident report
cat > ./incidents/incident-$(date +%Y%m%d-%H%M%S).md << EOF
# Incident Report

## Time
$(date)

## Issue
[Description of issue]

## Impact
- Services affected: [list]
- Users affected: [estimate]
- Duration: [time]

## Root Cause
[Analysis]

## Resolution
[What was done]

## Prevention
[How to prevent in future]

## Timeline
- Detection: [time]
- Investigation: [time]
- Resolution: [time]
- Post-mortem: [time]
EOF
```

---

## 🆘 Quick Reference

| Problem | Command |
|---------|---------|
| Check health | `docker compose ps` |
| View logs | `docker compose logs -f backend` |
| Restart service | `docker compose restart backend` |
| Check resources | `docker stats` |
| Database status | `docker exec uns-claudejp-db pg_isready` |
| View backups | `ls -lh ./backups/` |
| Create backup | `docker exec uns-claudejp-db pg_dump ... > backup.sql` |
| Restore backup | `cat backup.sql \| docker exec -i uns-claudejp-db psql ...` |

---

**Last Updated**: November 14, 2025  
**Next Review**: December 14, 2025

