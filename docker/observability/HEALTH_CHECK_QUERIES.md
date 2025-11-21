# Health Check Queries - UNS-ClaudeJP 6.0.0

## Overview

This document provides a comprehensive collection of health check queries for monitoring the UNS-ClaudeJP HR application. These queries can be used in Grafana dashboards, Prometheus alerts, or manual verification.

---

## Table of Contents

1. [Backend Health Checks](#backend-health-checks)
2. [Database Health Checks](#database-health-checks)
3. [Redis Health Checks](#redis-health-checks)
4. [System Resource Checks](#system-resource-checks)
5. [Application Performance Checks](#application-performance-checks)
6. [Payroll System Checks](#payroll-system-checks)
7. [OCR Service Checks](#ocr-service-checks)
8. [OpenTelemetry Checks](#opentelemetry-checks)

---

## Backend Health Checks

### HTTP Endpoint Health Check

**Purpose**: Verify backend API is responding

**Method 1: Direct HTTP Request**
```bash
curl -f http://localhost:8000/api/health
```

**Expected Response**:
```json
{
  "status": "ok",
  "timestamp": 1700000000.0,
  "system": {
    "platform": "Linux-4.4.0",
    "python": "3.11.0",
    "cpu_percent": 15.2,
    "memory_percent": 45.8
  },
  "application": {
    "version": "6.0.0",
    "environment": "development"
  }
}
```

**Method 2: Prometheus Query**
```promql
# Backend service is up (1 = up, 0 = down)
up{job="backend"}

# Last successful scrape
time() - timestamp(up{job="backend"})
```

**Expected**: `1` (service is up)

---

### Backend Response Time

**Prometheus Query**:
```promql
# Average response time (last 5 minutes)
rate(http_request_duration_seconds_sum{job="backend"}[5m])
/
rate(http_request_duration_seconds_count{job="backend"}[5m])

# P95 response time
histogram_quantile(0.95,
  sum(rate(http_request_duration_seconds_bucket{job="backend"}[5m])) by (le)
)

# P99 response time
histogram_quantile(0.99,
  sum(rate(http_request_duration_seconds_bucket{job="backend"}[5m])) by (le)
)
```

**Healthy Thresholds**:
- Average: < 0.5s
- P95: < 1.0s
- P99: < 2.0s

---

### Backend Error Rate

**Prometheus Query**:
```promql
# HTTP 5xx error rate (percentage)
(
  sum(rate(http_requests_total{job="backend",status=~"5.."}[5m]))
  /
  sum(rate(http_requests_total{job="backend"}[5m]))
) * 100

# Total errors per second
sum(rate(http_requests_total{job="backend",status=~"5.."}[5m]))
```

**Healthy Thresholds**:
- Error rate: < 1%
- Total errors: < 0.1 errors/sec

---

### Backend Request Rate

**Prometheus Query**:
```promql
# Total requests per second
sum(rate(http_requests_total{job="backend"}[5m]))

# Requests per second by endpoint
sum(rate(http_requests_total{job="backend"}[5m])) by (handler)

# Requests per second by status code
sum(rate(http_requests_total{job="backend"}[5m])) by (status)
```

---

## Database Health Checks

### PostgreSQL Connection Check

**SQL Query**:
```sql
-- Basic connectivity test
SELECT 1;

-- Current database
SELECT current_database();

-- PostgreSQL version
SELECT version();
```

**Bash Command**:
```bash
# Test connection from backend container
docker exec -it uns-claudejp-600-backend python -c "
from app.core.database import engine
try:
    with engine.connect() as conn:
        result = conn.execute('SELECT 1')
        print('Database connection: OK')
except Exception as e:
    print(f'Database connection: FAILED - {e}')
"
```

---

### Database Size

**SQL Query**:
```sql
-- Current database size (human-readable)
SELECT pg_size_pretty(pg_database_size(current_database())) as database_size;

-- Database size in bytes
SELECT pg_database_size(current_database()) as size_bytes;

-- Growth rate (compare with historical data)
SELECT
  datname,
  pg_size_pretty(pg_database_size(datname)) as size,
  pg_database_size(datname) as size_bytes
FROM pg_database
WHERE datname = current_database();
```

**Healthy Thresholds**:
- Total size: < 10 GB (warning), < 50 GB (critical)
- Growth rate: < 1 GB/week

---

### Active Connections

**SQL Query**:
```sql
-- Total active connections
SELECT COUNT(*) as active_connections
FROM pg_stat_activity
WHERE state = 'active';

-- Connections by state
SELECT
  state,
  COUNT(*) as count
FROM pg_stat_activity
GROUP BY state
ORDER BY count DESC;

-- Connection details
SELECT
  pid,
  usename,
  datname,
  state,
  query_start,
  state_change,
  LEFT(query, 50) as query_preview
FROM pg_stat_activity
WHERE state != 'idle'
ORDER BY query_start;

-- Max connections setting
SELECT setting::int as max_connections
FROM pg_settings
WHERE name = 'max_connections';

-- Connection pool utilization
SELECT
  (SELECT COUNT(*) FROM pg_stat_activity) as current_connections,
  (SELECT setting::int FROM pg_settings WHERE name = 'max_connections') as max_connections,
  ROUND(
    (SELECT COUNT(*)::numeric FROM pg_stat_activity) /
    (SELECT setting::numeric FROM pg_settings WHERE name = 'max_connections') * 100,
    2
  ) as utilization_percent;
```

**Healthy Thresholds**:
- Active connections: < 50
- Connection pool utilization: < 80%

---

### Long-Running Queries

**SQL Query**:
```sql
-- Queries running > 30 seconds
SELECT
  pid,
  usename,
  datname,
  state,
  EXTRACT(EPOCH FROM (now() - query_start)) as duration_seconds,
  LEFT(query, 100) as query
FROM pg_stat_activity
WHERE state = 'active'
  AND now() - query_start > interval '30 seconds'
  AND query NOT LIKE '%pg_stat_activity%'
ORDER BY duration_seconds DESC;

-- Queries running > 5 minutes
SELECT
  pid,
  usename,
  datname,
  state,
  EXTRACT(EPOCH FROM (now() - query_start)) as duration_seconds,
  query
FROM pg_stat_activity
WHERE state = 'active'
  AND now() - query_start > interval '5 minutes'
ORDER BY duration_seconds DESC;

-- Kill a long-running query (if needed)
-- SELECT pg_terminate_backend(pid);
```

**Healthy Thresholds**:
- No queries > 5 minutes
- < 3 queries > 30 seconds

---

### Table Sizes

**SQL Query**:
```sql
-- Top 10 largest tables
SELECT
  schemaname,
  tablename,
  pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) AS size,
  pg_total_relation_size(schemaname||'.'||tablename) AS size_bytes
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY size_bytes DESC
LIMIT 10;

-- Specific table sizes
SELECT
  pg_size_pretty(pg_table_size('employee')) as employee_table_size,
  pg_size_pretty(pg_table_size('salary_calculations')) as salary_calculations_size,
  pg_size_pretty(pg_table_size('payroll_runs')) as payroll_runs_size;
```

---

### Cache Hit Ratio

**SQL Query**:
```sql
-- Cache hit ratio (should be > 95%)
SELECT
  CASE
    WHEN (blks_hit + blks_read) > 0
    THEN ROUND((blks_hit::numeric / (blks_hit + blks_read)::numeric) * 100, 2)
    ELSE 100
  END as cache_hit_ratio_percent,
  blks_hit as cache_hits,
  blks_read as disk_reads
FROM pg_stat_database
WHERE datname = current_database();

-- Per-table cache statistics
SELECT
  schemaname,
  relname,
  heap_blks_read,
  heap_blks_hit,
  CASE
    WHEN (heap_blks_hit + heap_blks_read) > 0
    THEN ROUND((heap_blks_hit::numeric / (heap_blks_hit + heap_blks_read)::numeric) * 100, 2)
    ELSE 100
  END as cache_hit_ratio
FROM pg_statio_user_tables
ORDER BY heap_blks_read DESC
LIMIT 10;
```

**Healthy Threshold**: > 95%

---

### Vacuum Status

**SQL Query**:
```sql
-- Tables needing vacuum (high dead tuples)
SELECT
  schemaname,
  relname as tablename,
  n_live_tup as live_tuples,
  n_dead_tup as dead_tuples,
  ROUND((n_dead_tup::numeric / NULLIF(n_live_tup, 0)::numeric) * 100, 2) as dead_tuple_percent,
  last_vacuum,
  last_autovacuum
FROM pg_stat_user_tables
WHERE n_dead_tup > 1000
ORDER BY n_dead_tup DESC;

-- Autovacuum settings
SELECT
  name,
  setting,
  unit,
  context
FROM pg_settings
WHERE name LIKE '%autovacuum%'
ORDER BY name;
```

**Healthy Thresholds**:
- Dead tuple percentage: < 20%
- Last vacuum: < 7 days

---

### Index Usage

**SQL Query**:
```sql
-- Unused indexes (never scanned)
SELECT
  schemaname,
  tablename,
  indexname,
  idx_scan as scans,
  pg_size_pretty(pg_relation_size(indexrelid)) as size
FROM pg_stat_user_indexes
WHERE idx_scan = 0
ORDER BY pg_relation_size(indexrelid) DESC;

-- Most used indexes
SELECT
  schemaname,
  tablename,
  indexname,
  idx_scan as scans,
  idx_tup_read as tuples_read,
  idx_tup_fetch as tuples_fetched,
  pg_size_pretty(pg_relation_size(indexrelid)) as size
FROM pg_stat_user_indexes
ORDER BY idx_scan DESC
LIMIT 10;
```

---

## Redis Health Checks

### Redis Connection Check

**Bash Command**:
```bash
# Ping Redis
docker exec -it uns-claudejp-600-redis redis-cli ping
# Expected: PONG

# Check Redis is responding
docker exec -it uns-claudejp-600-redis redis-cli --stat

# Test connection from backend
docker exec -it uns-claudejp-600-backend python -c "
import redis
r = redis.from_url('redis://redis:6379/0')
print(r.ping())  # Should print True
"
```

---

### Redis Memory Usage

**Redis CLI Commands**:
```bash
# Memory info
docker exec -it uns-claudejp-600-redis redis-cli info memory

# Specific memory metrics
docker exec -it uns-claudejp-600-redis redis-cli info memory | grep used_memory_human
docker exec -it uns-claudejp-600-redis redis-cli info memory | grep used_memory_peak_human
docker exec -it uns-claudejp-600-redis redis-cli info memory | grep maxmemory_human

# Memory usage percentage
docker exec -it uns-claudejp-600-redis redis-cli --eval - <<EOF
local used = redis.call('INFO', 'memory'):match('used_memory:(%d+)')
local max = redis.call('CONFIG', 'GET', 'maxmemory')[2]
if max == '0' then
  return 'maxmemory not set'
else
  return string.format('%.2f%%', (used / max) * 100)
end
EOF
```

**Healthy Thresholds**:
- Memory usage: < 80% of maxmemory
- Evictions: 0 (ideally)

---

### Redis Key Count

**Redis CLI Commands**:
```bash
# Total keys in database
docker exec -it uns-claudejp-600-redis redis-cli dbsize

# Keys by pattern
docker exec -it uns-claudejp-600-redis redis-cli --scan --pattern "session:*" | wc -l
docker exec -it uns-claudejp-600-redis redis-cli --scan --pattern "cache:*" | wc -l

# Keyspace info
docker exec -it uns-claudejp-600-redis redis-cli info keyspace
```

---

### Redis Performance

**Redis CLI Commands**:
```bash
# Server stats
docker exec -it uns-claudejp-600-redis redis-cli info stats

# Operations per second
docker exec -it uns-claudejp-600-redis redis-cli info stats | grep instantaneous_ops_per_sec

# Connected clients
docker exec -it uns-claudejp-600-redis redis-cli info clients | grep connected_clients

# Latency monitoring
docker exec -it uns-claudejp-600-redis redis-cli --latency
docker exec -it uns-claudejp-600-redis redis-cli --latency-history
```

---

## System Resource Checks

### CPU Usage

**Prometheus Query**:
```promql
# System CPU usage (%)
100 - (avg(irate(node_cpu_seconds_total{mode="idle"}[5m])) * 100)

# Per-service CPU usage
irate(process_cpu_seconds_total{job="backend"}[5m]) * 100

# CPU usage by mode
sum(irate(node_cpu_seconds_total[5m])) by (mode) * 100
```

**Bash Command**:
```bash
# System CPU usage
top -bn1 | grep "Cpu(s)" | sed "s/.*, *\([0-9.]*\)%* id.*/\1/" | awk '{print 100 - $1"%"}'

# Container CPU usage
docker stats --no-stream --format "table {{.Name}}\t{{.CPUPerc}}"
```

**Healthy Thresholds**:
- System CPU: < 70%
- Backend CPU: < 50%

---

### Memory Usage

**Prometheus Query**:
```promql
# System memory usage (%)
(1 - (node_memory_MemAvailable_bytes / node_memory_MemTotal_bytes)) * 100

# Backend memory usage (bytes)
process_resident_memory_bytes{job="backend"}

# Backend memory usage (MB)
process_resident_memory_bytes{job="backend"} / 1024 / 1024
```

**Bash Command**:
```bash
# System memory
free -h

# Container memory usage
docker stats --no-stream --format "table {{.Name}}\t{{.MemUsage}}\t{{.MemPerc}}"
```

**Healthy Thresholds**:
- System memory: < 80%
- Backend memory: < 512 MB

---

### Disk Space

**Prometheus Query**:
```promql
# Disk space available (%)
(
  node_filesystem_avail_bytes{mountpoint="/"}
  /
  node_filesystem_size_bytes{mountpoint="/"}
) * 100

# Disk space used (GB)
(
  node_filesystem_size_bytes{mountpoint="/"}
  -
  node_filesystem_avail_bytes{mountpoint="/"}
) / 1024 / 1024 / 1024
```

**Bash Command**:
```bash
# Disk usage
df -h /

# Docker volume usage
docker system df -v
```

**Healthy Thresholds**:
- Disk available: > 20%
- Critical: < 10%

---

## Application Performance Checks

### Request Rate

**Prometheus Query**:
```promql
# Total requests per second
sum(rate(http_requests_total{job="backend"}[5m]))

# Requests per second by endpoint
sum(rate(http_requests_total{job="backend"}[5m])) by (handler)

# Requests per second by method
sum(rate(http_requests_total{job="backend"}[5m])) by (method)
```

---

### Error Rate

**Prometheus Query**:
```promql
# Error rate (%)
(
  sum(rate(http_requests_total{job="backend",status=~"5.."}[5m]))
  /
  sum(rate(http_requests_total{job="backend"}[5m]))
) * 100

# 4xx client errors per second
sum(rate(http_requests_total{job="backend",status=~"4.."}[5m]))

# 5xx server errors per second
sum(rate(http_requests_total{job="backend",status=~"5.."}[5m]))
```

---

## Payroll System Checks

### Payroll Calculation Rate

**SQL Query**:
```sql
-- Calculations in last hour
SELECT COUNT(*) as calculations_last_hour
FROM salary_calculations
WHERE created_at > NOW() - INTERVAL '1 hour';

-- Calculations per hour (last 24 hours)
SELECT
  DATE_TRUNC('hour', created_at) as hour,
  COUNT(*) as calculations
FROM salary_calculations
WHERE created_at > NOW() - INTERVAL '24 hours'
GROUP BY hour
ORDER BY hour DESC;

-- Average calculations per day (last 30 days)
SELECT
  AVG(daily_count) as avg_calculations_per_day
FROM (
  SELECT
    DATE(created_at) as day,
    COUNT(*) as daily_count
  FROM salary_calculations
  WHERE created_at > NOW() - INTERVAL '30 days'
  GROUP BY day
) subquery;
```

---

### Payroll Calculation Performance

**SQL Query**:
```sql
-- Average calculation time (seconds)
SELECT
  AVG(EXTRACT(EPOCH FROM (updated_at - created_at))) as avg_time_seconds,
  MIN(EXTRACT(EPOCH FROM (updated_at - created_at))) as min_time_seconds,
  MAX(EXTRACT(EPOCH FROM (updated_at - created_at))) as max_time_seconds
FROM salary_calculations
WHERE created_at > NOW() - INTERVAL '1 hour'
  AND updated_at IS NOT NULL;

-- Slow calculations (> 10 seconds)
SELECT
  id,
  employee_id,
  EXTRACT(EPOCH FROM (updated_at - created_at)) as duration_seconds,
  status,
  created_at
FROM salary_calculations
WHERE created_at > NOW() - INTERVAL '24 hours'
  AND updated_at IS NOT NULL
  AND EXTRACT(EPOCH FROM (updated_at - created_at)) > 10
ORDER BY duration_seconds DESC;
```

**Healthy Thresholds**:
- Average time: < 5 seconds
- No calculations > 30 seconds

---

### Payroll Error Rate

**SQL Query**:
```sql
-- Error rate (last 24 hours)
SELECT
  COUNT(*) FILTER (WHERE status = 'error') as errors,
  COUNT(*) as total,
  ROUND((COUNT(*) FILTER (WHERE status = 'error')::numeric / NULLIF(COUNT(*), 0)::numeric) * 100, 2) as error_rate_percent
FROM salary_calculations
WHERE created_at > NOW() - INTERVAL '24 hours';

-- Recent errors
SELECT
  id,
  employee_id,
  status,
  error_message,
  created_at
FROM salary_calculations
WHERE status = 'error'
  AND created_at > NOW() - INTERVAL '24 hours'
ORDER BY created_at DESC
LIMIT 10;
```

**Healthy Threshold**: < 1% error rate

---

## OCR Service Checks

### OCR Request Rate

**Prometheus Query**:
```promql
# OCR requests per second
rate(ocr_requests_total[5m])

# OCR requests per minute
rate(ocr_requests_total[5m]) * 60

# OCR requests per hour
sum(increase(ocr_requests_total[1h]))

# OCR requests by provider
sum(rate(ocr_requests_total[5m])) by (ocr_method)
```

---

### OCR Success Rate

**Prometheus Query**:
```promql
# OCR success rate (%)
(1 - (
  sum(rate(ocr_failures_total[5m]))
  /
  sum(rate(ocr_requests_total[5m]))
)) * 100

# OCR error rate (%)
(
  sum(rate(ocr_failures_total[5m]))
  /
  sum(rate(ocr_requests_total[5m]))
) * 100

# Failures per second
sum(rate(ocr_failures_total[5m]))
```

**Healthy Threshold**: > 95% success rate

---

### OCR Processing Time

**Prometheus Query**:
```promql
# Average processing time (seconds)
rate(ocr_processing_seconds_sum[5m])
/
rate(ocr_processing_seconds_count[5m])

# P95 processing time
histogram_quantile(0.95,
  sum(rate(ocr_processing_seconds_bucket[5m])) by (le)
)

# P99 processing time
histogram_quantile(0.99,
  sum(rate(ocr_processing_seconds_bucket[5m])) by (le)
)

# Processing time by provider
sum(rate(ocr_processing_seconds_sum[5m])) by (ocr_method)
/
sum(rate(ocr_processing_seconds_count[5m])) by (ocr_method)
```

**Healthy Thresholds**:
- Average: < 3 seconds
- P95: < 5 seconds
- P99: < 10 seconds

---

## OpenTelemetry Checks

### OTel Collector Health

**Prometheus Query**:
```promql
# OTel Collector is up
up{job="otel-collector"}

# OTel Collector memory usage (MB)
process_resident_memory_bytes{job="otel-collector"} / 1024 / 1024

# Spans received per second
rate(otelcol_receiver_accepted_spans[5m])

# Spans exported per second
rate(otelcol_exporter_sent_spans[5m])

# Spans dropped (should be 0)
rate(otelcol_processor_dropped_spans[5m])
```

**Bash Command**:
```bash
# Check OTel Collector logs
docker logs uns-claudejp-600-otel --tail 50

# Check if receiving metrics
curl -s http://localhost:13133/metrics | head -20
```

**Healthy Thresholds**:
- Memory usage: < 400 MB
- Dropped spans: 0
- Export success rate: > 99%

---

## Quick Health Check Script

**Comprehensive Health Check Bash Script**:

```bash
#!/bin/bash
# health-check.sh - Comprehensive system health check

echo "=== UNS-ClaudeJP Health Check ==="
echo "Date: $(date)"
echo ""

# Backend
echo "Backend Health:"
curl -sf http://localhost:8000/api/health > /dev/null && echo "✅ Backend: OK" || echo "❌ Backend: FAILED"

# Database
echo "Database Health:"
docker exec uns-claudejp-600-db pg_isready -U postgres > /dev/null 2>&1 && echo "✅ Database: OK" || echo "❌ Database: FAILED"

# Redis
echo "Redis Health:"
docker exec uns-claudejp-600-redis redis-cli ping > /dev/null 2>&1 && echo "✅ Redis: OK" || echo "❌ Redis: FAILED"

# Prometheus
echo "Prometheus Health:"
curl -sf http://localhost:9090/-/healthy > /dev/null && echo "✅ Prometheus: OK" || echo "❌ Prometheus: FAILED"

# Grafana
echo "Grafana Health:"
curl -sf http://localhost:3001/api/health > /dev/null && echo "✅ Grafana: OK" || echo "❌ Grafana: FAILED"

# Tempo
echo "Tempo Health:"
curl -sf http://localhost:3200/status > /dev/null && echo "✅ Tempo: OK" || echo "❌ Tempo: FAILED"

# Disk space
echo ""
echo "Disk Space:"
df -h / | tail -1 | awk '{print "Used: "$3" / "$2" ("$5")"}'

# Memory
echo ""
echo "Memory Usage:"
free -h | grep Mem | awk '{print "Used: "$3" / "$2" ("$3/$2*100"%)"}'

# Docker containers
echo ""
echo "Container Status:"
docker ps --filter "name=uns-claudejp-600" --format "table {{.Names}}\t{{.Status}}" | grep -v "STATUS" | while read line; do
  echo "$line"
done

echo ""
echo "=== Health Check Complete ==="
```

**Usage**:
```bash
chmod +x health-check.sh
./health-check.sh
```

---

**Document Version**: 1.0.0
**Last Updated**: 2025-11-19
**Maintained By**: @observability-engineer
