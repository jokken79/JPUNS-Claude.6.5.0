# 📚 Real World Example #5: Deployment & Monitoring

**Complete walkthrough of deploying to production with monitoring**

---

## 🎯 The Request

```
User: "We need to deploy the new candidates module to production.
Must have health checks, monitoring, and zero downtime."
```

---

## 🔄 Claude Code's Workflow

### Delegate to DevOps Engineer

```
Task(
    subagent_type="general-purpose",
    description="Prepare production deployment with monitoring",
    prompt="""
    Prepare deployment to production for candidates module.

    Requirements:
    - Zero downtime deployment (blue-green or rolling)
    - Health checks for all services
    - Prometheus metrics
    - Grafana dashboards
    - Automated rollback if health check fails

    Deploy:
    1. Updated backend with candidates API
    2. Updated frontend with candidates UI
    3. Database migrations (from dev to prod)

    Verify:
    1. All services healthy
    2. Metrics being collected
    3. Can rollback quickly
    """
)
```

---

### DevOps Engineer's Solution

**1. Pre-deployment Checklist:**

```bash
# 1. Verify all tests pass
docker compose exec backend pytest tests/ -v
docker compose exec frontend npm test
docker compose exec frontend npm run test:e2e

# 2. Build production images
docker compose build --no-cache backend frontend

# 3. Verify no secrets in code
git diff main -- backend/ frontend/ | grep -i password

# 4. Database backup
docker exec uns-claudejp-db pg_dump -U uns_admin uns_claudejp > backup_pre_deploy_$(date +%Y%m%d).sql

# 5. Verify health endpoints
curl http://localhost:8000/api/health
curl http://localhost:3000
```

---

**2. Rolling Deployment (Zero Downtime):**

```bash
# 1. Scale backend to 3 instances
docker compose up -d --scale backend=3

# 2. Nginx load balances automatically
# 3. Deploy new version to backend-1 while backend-2,3 handle traffic
docker compose restart backend

# 4. Verify new version healthy
curl http://localhost:8000/api/health

# 5. Gradually shift traffic
# (Nginx does this automatically, but you can monitor)

# 6. All services healthy
docker compose ps
```

---

**3. Monitoring & Observability:**

```yaml
# docker-compose.yml additions
services:
  prometheus:
    image: prom/prometheus:latest
    ports:
      - "9090:9090"
    volumes:
      - ./config/prometheus.yml:/etc/prometheus/prometheus.yml
      - prometheus_data:/prometheus
    healthcheck:
      test: ["CMD", "wget", "--quiet", "--tries=1", "--spider", "http://localhost:9090"]

  grafana:
    image: grafana/grafana:latest
    ports:
      - "3001:3000"
    environment:
      - GF_SECURITY_ADMIN_PASSWORD=admin123
    volumes:
      - grafana_data:/var/lib/grafana
      - ./config/grafana/dashboards:/etc/grafana/provisioning/dashboards
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:3000/api/health"]
```

---

**4. Prometheus Metrics:**

```python
# backend/app/core/metrics.py
from prometheus_client import Counter, Histogram, Gauge
import time

# Metrics
request_count = Counter(
    'http_requests_total',
    'Total HTTP requests',
    ['method', 'endpoint', 'status']
)

request_duration = Histogram(
    'http_request_duration_seconds',
    'HTTP request duration',
    ['method', 'endpoint']
)

# Middleware to track metrics
@app.middleware("http")
async def track_metrics(request: Request, call_next):
    start = time.time()
    response = await call_next(request)
    duration = time.time() - start

    request_count.labels(
        method=request.method,
        endpoint=request.url.path,
        status=response.status_code
    ).inc()

    request_duration.labels(
        method=request.method,
        endpoint=request.url.path
    ).observe(duration)

    return response
```

---

**5. Health Checks:**

```python
# backend/app/api/health.py
from sqlalchemy import text
import redis

@router.get("/health")
async def health_check(db: AsyncSession = Depends(get_db)):
    """Comprehensive health check"""
    checks = {
        "status": "healthy",
        "timestamp": datetime.utcnow().isoformat(),
        "services": {}
    }

    # Check database
    try:
        await db.execute(text("SELECT 1"))
        checks["services"]["database"] = "ok"
    except Exception as e:
        checks["services"]["database"] = f"error: {str(e)}"
        checks["status"] = "degraded"

    # Check Redis
    try:
        redis_client = redis.Redis()
        redis_client.ping()
        checks["services"]["redis"] = "ok"
    except Exception as e:
        checks["services"]["redis"] = f"error: {str(e)}"

    return checks
```

---

**6. Grafana Dashboard:**

```json
{
  "dashboard": {
    "title": "UNS-ClaudeJP Production",
    "panels": [
      {
        "title": "Request Rate",
        "targets": [
          {
            "expr": "rate(http_requests_total[5m])"
          }
        ]
      },
      {
        "title": "Request Duration (95th percentile)",
        "targets": [
          {
            "expr": "histogram_quantile(0.95, http_request_duration_seconds)"
          }
        ]
      },
      {
        "title": "Error Rate",
        "targets": [
          {
            "expr": "rate(http_requests_total{status=~\"5..\"}[5m])"
          }
        ]
      },
      {
        "title": "Database Connections",
        "targets": [
          {
            "expr": "pg_stat_activity_count"
          }
        ]
      }
    ]
  }
}
```

---

### Deployment Verification

```bash
# 1. Health check all services
curl http://localhost/api/health
# Response: {"status": "healthy", "services": {"database": "ok", "redis": "ok"}}

# 2. Verify metrics collection
curl http://localhost:9090/api/v1/query?query=up
# Shows all targets up

# 3. Check Grafana dashboard
# Navigate to http://localhost:3001
# Should see metrics updating in real-time

# 4. Simulate traffic and verify monitoring
for i in {1..100}; do curl http://localhost/api/candidates; done

# 5. Verify dashboard updated
# Check request rate, duration, error rate graphs
```

---

### Rollback Procedure (if needed)

```bash
# If issues detected:
# 1. Revert code
git reset --hard HEAD~1

# 2. Rebuild and restart
docker compose build --no-cache
docker compose up -d

# 3. Run health checks
docker compose ps

# 4. Restore from backup if data corrupted
cat backup_pre_deploy_20251116.sql | \
  docker exec -i uns-claudejp-db psql -U uns_admin uns_claudejp
```

---

## 📊 Summary

| Component | Owner | Status |
|-----------|-------|--------|
| **Pre-deployment testing** | testing-qa | ✅ All pass |
| **Rolling deployment** | devops-engineer | ✅ Zero downtime |
| **Health monitoring** | devops-engineer | ✅ All services up |
| **Prometheus metrics** | devops-engineer | ✅ Collecting |
| **Grafana dashboards** | devops-engineer | ✅ Live |
| **Rollback procedure** | devops-engineer | ✅ Tested & ready |

---

## 🎓 Key Takeaway

Production deployment checklist:
1. ✅ All tests passing
2. ✅ Database backed up
3. ✅ Secrets not in code
4. ✅ Health checks configured
5. ✅ Monitoring active
6. ✅ Rollback plan ready
7. ✅ Deploy with zero downtime
8. ✅ Verify metrics collection
9. ✅ Monitor for 24 hours after deploy

**Never push without monitoring!** 📊
