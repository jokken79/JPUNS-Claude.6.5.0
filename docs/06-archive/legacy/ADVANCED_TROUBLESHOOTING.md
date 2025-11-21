# 🔧 ADVANCED TROUBLESHOOTING GUIDE
## UNS-ClaudeJP 5.4.1 - Deep Diagnostic & Resolution Procedures

**Fecha:** 2025-11-12
**Versión:** 1.0
**Audience:** Senior Engineers & DevOps

---

## 📋 Table of Contents

1. [Diagnostic Framework](#diagnostic-framework)
2. [Database Issues](#database-issues)
3. [Backend Issues](#backend-issues)
4. [Frontend Issues](#frontend-issues)
5. [Network & Connectivity](#network--connectivity)
6. [Performance Issues](#performance-issues)
7. [Memory & Resource Issues](#memory--resource-issues)
8. [Security Issues](#security-issues)
9. [Docker & Container Issues](#docker--container-issues)
10. [Advanced Debugging](#advanced-debugging)

---

## 🔍 Diagnostic Framework

### Step 1: Gather System Information

```bash
# Get complete system state
docker compose ps -a
docker stats --no-stream
docker compose logs --timestamps -f --all

# Database state
docker exec uns-claudejp-db pg_stat_statements
docker exec uns-claudejp-db pg_stat_database

# Network state
netstat -tlnp
docker network inspect uns-network

# Disk space
df -h
du -sh *

# Memory
free -h
top -b -n 1 | head -20
```

### Step 2: Check Monitoring

```bash
# Prometheus targets
curl http://localhost:9090/api/v1/targets

# Grafana alerts
curl http://localhost:3001/api/v1/annotations

# Tempo traces (last 1h)
curl 'http://localhost:3200/api/search?limit=100'

# OpenTelemetry status
curl http://localhost:13133
```

### Step 3: Review Logs

```bash
# Aggregated logs (last 100 lines with timestamps)
docker compose logs --timestamps --tail 100

# Per-service logs
docker logs --timestamps -f uns-claudejp-backend 2>&1 | head -50
docker logs --timestamps -f uns-claudejp-frontend 2>&1 | head -50
docker logs --timestamps -f uns-claudejp-db 2>&1 | head -50
```

### Step 4: Run Health Checks

```bash
# Quick health check
curl -w "\n%{http_code}\n" http://localhost:8000/api/health
curl -w "\n%{http_code}\n" http://localhost:3000
docker exec uns-claudejp-db psql -U uns_admin -d uns_claudejp -c "SELECT 1;"

# Advanced health check
scripts/ADVANCED_HEALTH_CHECK.bat
```

---

## 🗄️ Database Issues

### Symptom: "Connection refused" from Backend

**Diagnosis:**
```bash
# Check DB container status
docker ps | grep db
# Should show: "healthy"

# Check DB logs
docker logs uns-claudejp-db --tail 50 | grep ERROR

# Test direct connection
docker exec uns-claudejp-db psql -U uns_admin -d uns_claudejp -c "SELECT 1;"

# Check connection pool in backend
docker exec uns-claudejp-backend env | grep DATABASE_URL
```

**Solution:**
```bash
# 1. If DB isn't healthy, wait 90 seconds
sleep 90

# 2. Restart DB
docker compose restart db

# 3. Wait for health check
docker exec uns-claudejp-db pg_isready -U uns_admin -d uns_claudejp

# 4. Restart backend
docker compose restart backend

# 5. Verify connection
curl http://localhost:8000/api/health
```

### Symptom: "Slow Queries" or High Query Latency

**Diagnosis:**
```bash
# Check slow query log
docker exec uns-claudejp-db psql -U uns_admin -d uns_claudejp -c \
  "SELECT query, calls, mean_time, max_time FROM pg_stat_statements \
   WHERE mean_time > 100 ORDER BY mean_time DESC LIMIT 10;"

# Check table sizes
docker exec uns-claudejp-db psql -U uns_admin -d uns_claudejp -c \
  "SELECT schemaname, tablename, pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) AS size \
   FROM pg_tables WHERE schemaname='public' ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;"

# Check index usage
docker exec uns-claudejp-db psql -U uns_admin -d uns_claudejp -c \
  "SELECT schemaname, tablename, indexname, idx_scan FROM pg_stat_user_indexes ORDER BY idx_scan ASC;"
```

**Solution:**
```bash
# Create missing indexes
docker exec uns-claudejp-db psql -U uns_admin -d uns_claudejp -c "
  CREATE INDEX IF NOT EXISTS idx_candidates_status ON candidates(status);
  CREATE INDEX IF NOT EXISTS idx_employees_factory ON employees(factory_id);
  CREATE INDEX IF NOT EXISTS idx_timer_cards_date ON timer_cards(date);
"

# Analyze tables for query planner
docker exec uns-claudejp-db psql -U uns_admin -d uns_claudejp -c "ANALYZE;"

# Vacuum to clean dead rows
docker exec uns-claudejp-db psql -U uns_admin -d uns_claudejp -c "VACUUM ANALYZE;"
```

### Symptom: "Disk Space Full" on Database

**Diagnosis:**
```bash
# Check Docker volume size
docker system df -v | grep postgres

# Check database size
docker exec uns-claudejp-db psql -U uns_admin -d uns_claudejp -c \
  "SELECT pg_size_pretty(pg_database_size('uns_claudejp'));"

# Check WAL files
docker exec uns-claudejp-db ls -lh /var/lib/postgresql/data/pg_wal/ | tail -20
```

**Solution:**
```bash
# 1. Clean WAL archives (if replication not used)
docker exec uns-claudejp-db psql -U uns_admin -c "SELECT pg_switch_wal();"

# 2. Clean old backups
rm backend/backups/backup_*.sql.* (keep last 7 days)

# 3. Extend volume (if Docker volumes)
# Edit docker-compose.yml and increase volume size

# 4. Monitor going forward
docker system prune -a (careful with this!)
```

---

## 🚀 Backend Issues

### Symptom: "Module not found" or Import Errors

**Diagnosis:**
```bash
# Check Python path
docker exec uns-claudejp-backend python -c "import sys; print(sys.path)"

# Verify dependencies installed
docker exec uns-claudejp-backend pip list | grep -E "fastapi|sqlalchemy|pydantic"

# Check import directly
docker exec uns-claudejp-backend python -c "from app.main import app; print('OK')"
```

**Solution:**
```bash
# Rebuild backend image
docker compose build --no-cache backend

# Force reinstall dependencies
docker exec uns-claudejp-backend pip install --force-reinstall -r requirements.txt

# Restart backend
docker compose restart backend
```

### Symptom: "Too many open connections" to Database

**Diagnosis:**
```bash
# Check connection pool in backend
docker logs uns-claudejp-backend | grep -i "connection"

# Check active connections in database
docker exec uns-claudejp-db psql -U uns_admin -d uns_claudejp -c \
  "SELECT datname, count(*) FROM pg_stat_activity GROUP BY datname;"

# Check connection pool exhaustion
docker exec uns-claudejp-db psql -U uns_admin -d uns_claudejp -c \
  "SELECT count(*) FROM pg_stat_activity WHERE datname='uns_claudejp';"
```

**Solution:**
```bash
# 1. Increase connection pool in backend
# Edit backend/app/core/database.py:
# pool_size=20 (increase from default)
# max_overflow=40

# 2. Kill idle connections
docker exec uns-claudejp-db psql -U uns_admin -d uns_claudejp -c \
  "SELECT pg_terminate_backend(pid) FROM pg_stat_activity \
   WHERE datname='uns_claudejp' AND state='idle' AND query_start < now() - interval '10 minutes';"

# 3. Restart backend
docker compose restart backend
```

### Symptom: "API Timeout" or Slow API Responses

**Diagnosis:**
```bash
# Check backend resource usage
docker stats uns-claudejp-backend

# Check slow requests in logs
docker logs uns-claudejp-backend --tail 200 | grep "duration\|timeout"

# Check database query performance
docker exec uns-claudejp-db psql -U uns_admin -d uns_claudejp -c \
  "SELECT query, calls, mean_time FROM pg_stat_statements ORDER BY mean_time DESC LIMIT 5;"

# Profile specific endpoint
curl -w "@/tmp/curl_format.txt" http://localhost:8000/api/health
```

**Solution:**
```bash
# 1. Identify slow query
# Find in logs → analyze with EXPLAIN PLAN

# 2. Add caching
# Use Redis for frequently accessed data
# TTL: 5 min for candidates, 1 min for dynamic data

# 3. Optimize query
# Add indexes, reduce fields, implement pagination

# 4. Increase backend resources
# Edit docker-compose.yml:
# deploy.resources.limits.memory = 4G (increase if needed)
```

---

## 🎨 Frontend Issues

### Symptom: "Blank White Page" or "Not Loading"

**Diagnosis:**
```bash
# Check frontend logs
docker logs uns-claudejp-frontend --tail 100

# Check for build errors
docker logs uns-claudejp-frontend | grep -i "error\|fail"

# Check if Next.js compiled successfully
docker logs uns-claudejp-frontend | grep "Ready in"

# Check network requests (from browser console)
# F12 → Network tab → check for 404/500 errors
```

**Solution:**
```bash
# 1. Wait for Next.js compilation (first run takes 2-3 min)
docker logs uns-claudejp-frontend -f | grep "Ready in"

# 2. If still blank after 5 minutes:
docker compose restart frontend
sleep 180  # Wait 3 minutes for build

# 3. Check backend connectivity
# From browser console: fetch('/api/health').then(r => r.json()).then(console.log)

# 4. Clear browser cache
# Ctrl+Shift+Delete → Clear all → Reload

# 5. If still broken:
docker compose build --no-cache frontend
docker compose up -d frontend
```

### Symptom: "CORS Error" or "API Request Blocked"

**Diagnosis:**
```bash
# Check CORS configuration in backend
docker exec uns-claudejp-backend grep -n "CORSMiddleware" /app/app/main.py

# Check frontend API URL
docker exec uns-claudejp-frontend grep -r "NEXT_PUBLIC_API" .env

# Check browser console for exact CORS error
# F12 → Console → Look for "Access to XMLHttpRequest blocked by CORS"
```

**Solution:**
```bash
# 1. Verify FRONTEND_URL in backend .env
echo $FRONTEND_URL

# 2. Verify API URL in frontend .env
docker exec uns-claudejp-frontend cat .env | grep API

# 3. Add frontend URL to CORS allowed origins
# Edit backend/app/main.py:
# app.add_middleware(
#     CORSMiddleware,
#     allow_origins=["http://localhost:3000", "https://app.example.com"],
#     ...
# )

docker compose restart backend
```

### Symptom: "TypeError: Cannot read property" or JavaScript Errors

**Diagnosis:**
```bash
# Check TypeScript compilation errors
docker logs uns-claudejp-frontend --tail 200 | grep -i "error\|type"

# Run type check manually
docker exec uns-claudejp-frontend npm run type-check

# Check component rendering errors
docker logs uns-claudejp-frontend | grep -A5 "Error:"
```

**Solution:**
```bash
# 1. Run type check to see all errors
docker exec uns-claudejp-frontend npm run type-check

# 2. Fix errors in components
# Edit the file, save, rebuild automatically triggers

# 3. Check network tab for API errors
# F12 → Network → Find failed requests → check response body

# 4. If error persists:
docker compose restart frontend
```

---

## 🌐 Network & Connectivity

### Symptom: "Network timeout" or "Cannot reach service"

**Diagnosis:**
```bash
# Check Docker network
docker network inspect uns-network

# Check service DNS resolution
docker exec uns-claudejp-backend nslookup db
docker exec uns-claudejp-backend nslookup redis

# Check network connectivity between services
docker exec uns-claudejp-backend ping -c 3 db
docker exec uns-claudejp-backend curl -v http://db:5432

# Check firewall rules
netstat -tlnp | grep LISTEN
```

**Solution:**
```bash
# 1. Verify services are on same network
docker compose ps  # Check network column

# 2. Restart network
docker network rm uns-network
docker network create uns-network
docker compose up -d

# 3. Check service names in docker-compose.yml
# Services must use "container_name" or service name

# 4. Verify environment variables
docker exec uns-claudejp-backend env | grep "DATABASE_URL\|REDIS"
```

### Symptom: "Port already in use"

**Diagnosis:**
```bash
# Find process using port 3000
lsof -i :3000  # Linux/macOS
netstat -ano | findstr :3000  # Windows

# Check Docker container using port
docker port uns-claudejp-frontend
```

**Solution:**
```bash
# 1. Kill process using port
lsof -i :3000 -t | xargs kill -9  # Linux/macOS
taskkill /PID 1234 /F  # Windows

# 2. Or change port in docker-compose.yml
# ports: ["3001:3000"]

docker compose restart
```

---

## ⚡ Performance Issues

### Symptom: "CPU Usage Very High"

**Diagnosis:**
```bash
# Check CPU per container
docker stats --no-stream

# Find CPU-intensive process in backend
docker exec uns-claudejp-backend top -b -n 1 | head -20

# Check for infinite loops or memory leaks
docker logs uns-claudejp-backend | grep -i "loop\|recursive"

# Profile backend (if supported)
docker exec uns-claudejp-backend python -m cProfile -s cumulative /app/main.py
```

**Solution:**
```bash
# 1. Identify the cause
# - Inefficient query → optimize
# - Memory leak → restart service (temporary)
# - Load spike → increase replicas

# 2. Scale horizontally
# docker compose up -d --scale backend=2

# 3. Optimize code
# Add caching, reduce computations, use async/await

# 4. Monitor continuously
# Set CPU alert threshold in Grafana
```

### Symptom: "Response Time Very Slow (> 5 seconds)"

**Diagnosis:**
```bash
# Measure end-to-end latency
time curl http://localhost:8000/api/health

# Measure database query time
docker exec uns-claudejp-db psql -U uns_admin -d uns_claudejp -c \
  "EXPLAIN ANALYZE SELECT * FROM candidates LIMIT 100;"

# Check network latency
docker exec uns-claudejp-backend ping -c 5 db

# Check Redis latency
docker exec uns-claudejp-redis redis-cli --latency
```

**Solution:**
```bash
# 1. If database slow:
# - Create indexes on frequently queried columns
# - Implement query pagination
# - Use prepared statements

# 2. If network slow:
# - Check Docker network driver
# - Use host network mode (not recommended for security)

# 3. If frontend slow:
# - Check Time to Interactive (TTI)
# - Optimize bundle size
# - Implement code splitting

# 4. Use caching
docker exec uns-claudejp-redis redis-cli FLUSHDB  # Clear cache if stale
```

---

## 💾 Memory & Resource Issues

### Symptom: "Out of Memory" Error

**Diagnosis:**
```bash
# Check memory usage
docker stats --no-stream | grep -E "NAME|MEMORY"

# Check memory per process
docker exec uns-claudejp-backend ps aux --sort=-%mem | head -5

# Check memory limits
docker inspect uns-claudejp-backend | grep -A10 "Memory"

# Check swap usage
free -h
```

**Solution:**
```bash
# 1. Increase memory limit in docker-compose.yml
services:
  backend:
    deploy:
      resources:
        limits:
          memory: 4G
        reservations:
          memory: 2G

# 2. Clear Docker volumes (if safe)
docker volume prune

# 3. Reduce database result set
# Add LIMIT clauses, implement pagination

# 4. Cache aggressive results
# TTL: 30s for volatile data, 5 min for stable data

# 5. Restart service to clear memory
docker compose restart backend
```

---

## 🔐 Security Issues

### Symptom: "Unauthorized Access" or "401 errors"

**Diagnosis:**
```bash
# Check JWT token validity
curl -H "Authorization: Bearer $TOKEN" http://localhost:8000/api/health

# Check token expiration
docker exec uns-claudejp-backend python -c "
import jwt
token = 'YOUR_TOKEN'
jwt.decode(token, options={'verify_signature': False})
"

# Check SECRET_KEY
docker exec uns-claudejp-backend env | grep SECRET_KEY
```

**Solution:**
```bash
# 1. Get new token
curl -X POST http://localhost:8000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"PASSWORD"}'

# 2. Use token in requests
TOKEN=$(curl ... | jq -r .access_token)
curl -H "Authorization: Bearer $TOKEN" http://localhost:8000/api/health

# 3. If token expired:
# Login again to get new token
# Or implement refresh token logic
```

### Symptom: "SSL/TLS Certificate Error"

**Diagnosis:**
```bash
# Check certificate validity
openssl s_client -connect api.example.com:443

# Check certificate expiration
openssl s_client -connect api.example.com:443 | grep "notAfter"

# Check certificate chain
openssl s_client -connect api.example.com:443 -showcerts
```

**Solution:**
```bash
# 1. Renew certificate (if using Let's Encrypt)
certbot renew

# 2. Install new certificate
cp /etc/letsencrypt/live/example.com/*.pem /path/to/certs/

# 3. Restart reverse proxy (nginx/HAProxy)
systemctl restart nginx

# 4. Verify certificate
curl -v https://api.example.com 2>&1 | grep "SSL certificate"
```

---

## 🐳 Docker & Container Issues

### Symptom: "Docker Daemon Not Responding"

**Diagnosis:**
```bash
# Check Docker status
docker ps
# Should work without errors

# Check Docker daemon
systemctl status docker  # Linux
# or check Docker Desktop (macOS/Windows)

# Check Docker logs
journalctl -u docker | tail -50
```

**Solution:**
```bash
# 1. Restart Docker daemon
sudo systemctl restart docker  # Linux
# Close and reopen Docker Desktop  # macOS/Windows

# 2. If still not responding, check resources
# Increase Docker memory/CPU allocation

# 3. Reset Docker (nuclear option)
docker system prune -a --volumes  # WARNING: Deletes all images/volumes
```

### Symptom: "Container Keeps Restarting"

**Diagnosis:**
```bash
# Check restart policy
docker inspect uns-claudejp-backend | grep -A5 "RestartPolicy"

# Check container logs
docker logs uns-claudejp-backend --tail 100

# Check health check status
docker ps | grep uns-claudejp-backend

# Check startup errors
docker compose logs backend | grep -i "error\|fail" | head -20
```

**Solution:**
```bash
# 1. Fix startup issue (see logs)
# e.g., Fix configuration, missing files, etc.

# 2. Change restart policy if too aggressive
# Edit docker-compose.yml:
# restart_policy:
#   condition: on-failure
#   max_retries: 3

# 3. Increase startup timeout
# Edit health check:
# start_period: 60s

docker compose up -d
```

---

## 🔬 Advanced Debugging

### Enable Debug Logging

**Backend:**
```bash
# Set DEBUG=true in .env
docker exec uns-claudejp-backend env | grep DEBUG

# Edit .env
DEBUG=true

# Restart with verbose logging
PYTHONUNBUFFERED=1 docker compose up backend
```

**Frontend:**
```bash
# Set DEBUG=true for Next.js
docker exec uns-claudejp-frontend npm run dev
# This enables source maps and verbose output
```

### Attach Debugger

**Python (Backend):**
```bash
# Install debugger
docker exec uns-claudejp-backend pip install debugpy

# Set breakpoint in code
breakpoint()  # or import pdb; pdb.set_trace()

# Run with debugger
docker compose run --service-ports backend
```

**Node (Frontend):**
```bash
# Enable Node inspector
docker compose run --service-ports -e NODE_OPTIONS="--inspect=0.0.0.0" frontend npm run dev

# Connect from browser
chrome://inspect → Connect to localhost:9229
```

### Core Dump Analysis

```bash
# Enable core dumps
ulimit -c unlimited

# Run with core dump
docker compose up backend

# If crash occurs, analyze
gdb /path/to/python /path/to/core.dump

# Or for Python traceback
python -c "import sys; traceback.print_exc()"
```

---

## 📊 Monitoring for Issues

### Set Up Alerts

**Prometheus:**
```yaml
groups:
  - name: advanced_alerts
    rules:
      - alert: HighCPU
        expr: rate(container_cpu_usage_seconds_total[5m]) > 0.8
        for: 5m

      - alert: HighMemory
        expr: container_memory_usage_bytes / container_spec_memory_limit_bytes > 0.9
        for: 5m

      - alert: SlowQueries
        expr: histogram_quantile(0.95, rate(db_query_duration[5m])) > 1.0
        for: 5m
```

### Dashboard Panels

**Grafana:**
- Request latency distribution
- Error rate trend
- Memory usage over time
- CPU usage over time
- Database query performance
- Cache hit ratio

---

## 📞 Escalation Path

1. **Self-help:** Check this guide (usually solves 80% of issues)
2. **Automated diagnostics:** Run scripts (ADVANCED_HEALTH_CHECK.bat, etc.)
3. **Manual investigation:** Follow diagnostic steps above
4. **Expert consultation:** Contact engineering team
5. **Vendor support:** Contact relevant vendor (Docker, PostgreSQL, etc.)

---

## ✅ Troubleshooting Checklist

- [ ] Gather system information (docker compose ps, logs, etc.)
- [ ] Check monitoring (Prometheus, Grafana, Tempo)
- [ ] Run health checks (ADVANCED_HEALTH_CHECK.bat)
- [ ] Review error logs carefully
- [ ] Identify symptom category (DB, Backend, Frontend, Network, etc.)
- [ ] Follow solution steps
- [ ] Verify fix works (health check, test request, etc.)
- [ ] Document incident for future reference

---

**Versión:** 1.0
**Fecha:** 2025-11-12
**Audience:** Senior Engineers & DevOps
**Last Updated:** 2025-11-12
