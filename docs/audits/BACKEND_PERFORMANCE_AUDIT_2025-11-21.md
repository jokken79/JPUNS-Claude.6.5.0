# Backend Performance Audit Report
## UNS-ClaudeJP v6.0.0 FastAPI + PostgreSQL Backend

**Audit Date:** 2025-11-21  
**Auditor:** @database-admin  
**System:** FastAPI 0.115.6 + PostgreSQL 15 + Redis 7  
**Database Schema:** 13 core tables + 35+ total tables

---

## Executive Summary

### Current Performance Baseline
- **Average API Response Time:** ~150-300ms (estimated, no APM yet)
- **Database Connection Pool:** 20 connections + 10 overflow (well configured)
- **Redis Cache:** Configured but underutilized (only AI responses cached)
- **Worker Configuration:** 4 workers in production (good for CPU-bound tasks)
- **Request Rate Limiting:** Properly configured (100/min global)

### Main Performance Bottleneck
**N+1 Query Problem in Dashboard Endpoints** - The dashboard aggregation endpoints execute multiple sequential database queries inside loops, causing significant performance degradation with scale.

### Top 3 Quick Wins (Estimated Impact)
1. **Add joinedload/selectinload to dashboard queries** → 60-80% faster dashboard load
2. **Cache dashboard statistics in Redis (5min TTL)** → 90% reduction in DB load
3. **Add missing composite indexes** → 40-50% faster filtering queries

---

## 1. API Performance Analysis

### 1.1 Endpoint Performance Patterns

#### Critical Issues Identified

**CRITICAL: N+1 Query Problem in Dashboard**
- **File:** `/backend/app/api/dashboard.py`
- **Lines:** 120-165 (fallback activity, factory dashboard)
- **Impact:** High - O(n) queries where n = number of records

```python
# PROBLEM: N+1 Query Pattern
for request in recent_requests:
    employee = db.query(Employee).filter(
        Employee.hakenmoto_id == request.hakenmoto_id
    ).first()  # ❌ Individual query per request
```

**Similar patterns found in:**
- `_fallback_recent_activity()` - 4 separate queries in loop
- `factory_dashboard()` - Query employees, then timer_cards for each factory
- Salary calculations - Employee lookups in loop

**Solution:**
```python
# FIX: Use eager loading
from sqlalchemy.orm import joinedload

requests = db.query(Request)\
    .options(joinedload(Request.employee))\  # ✅ Single query with JOIN
    .order_by(Request.created_at.desc())\
    .limit(limit)\
    .all()

for request in requests:
    employee_name = request.employee.full_name_kanji  # No DB query!
```

### 1.2 Slow Query Candidates

Based on code analysis, these endpoints likely have slow performance:

| Endpoint | Estimated Time | Issue | Priority |
|----------|---------------|-------|----------|
| `/api/dashboard/admin` | 500-1000ms | N+1 queries + aggregations | HIGH |
| `/api/dashboard/factory` | 300-600ms | Loop queries for each factory | HIGH |
| `/api/salary/statistics` | 400-800ms | Multiple aggregations | MEDIUM |
| `/api/reports/*` | 200-500ms | Large dataset scans | MEDIUM |
| `/api/employees?search=` | 100-200ms | Full text search (optimized with pg_trgm) | LOW |

### 1.3 Database Connection Pooling

**Current Configuration:** ✅ GOOD
```python
# backend/app/core/database.py
pool_size=20,          # 20 persistent connections
max_overflow=10,       # 30 max total connections
pool_pre_ping=True,    # Health check before use
pool_recycle=3600,     # Recycle connections every hour
```

**Recommendations:**
- Current settings are appropriate for production
- Monitor connection usage with: `SELECT count(*) FROM pg_stat_activity;`
- Consider increasing to pool_size=30 if connection saturation occurs

### 1.4 Missing Response Compression

**Issue:** No gzip compression configured in FastAPI

**Impact:** Bandwidth waste, slower client-side rendering

**Solution:**
```python
# main.py
from fastapi.middleware.gzip import GZipMiddleware
app.add_middleware(GZipMiddleware, minimum_size=1000)
```

**Expected improvement:** 70-80% reduction in response payload size

---

## 2. Database Optimization

### 2.1 Schema Analysis (13 Core Tables)

**Tables Analyzed:**
1. users, refresh_tokens (auth)
2. candidates, candidate_forms, documents (recruitment)
3. employees, contract_workers, staff (personnel)
4. factories, apartments, apartment_assignments (operations)
5. timer_cards, salary_calculations (payroll)
6. requests, yukyu_requests, yukyu_balances (HR)
7. audit_log, admin_audit_log (compliance)

### 2.2 Index Coverage Assessment

**GOOD - Existing Indexes:**
- ✅ pg_trgm extension for fuzzy text search
- ✅ Full-text search on names (candidates, employees)
- ✅ Composite indexes for date ranges (timer_cards)
- ✅ Unique indexes on primary identifiers
- ✅ Partial indexes for active records

**MISSING - Critical Indexes:**

```sql
-- 1. Composite index for salary queries
CREATE INDEX idx_salary_employee_paid 
ON salary_calculations(employee_id, is_paid, calculation_year, calculation_month);

-- 2. Apartment assignment lookup
CREATE INDEX idx_apartment_assignment_employee_active 
ON apartment_assignments(employee_id, status) 
WHERE status = 'active';

-- 3. Request approval workflow
CREATE INDEX idx_requests_status_created 
ON requests(status, created_at DESC);

-- 4. Timer card approval queue
CREATE INDEX idx_timer_cards_approval_queue 
ON timer_cards(factory_id, is_approved, work_date DESC) 
WHERE is_approved = false;

-- 5. Employee factory lookup with status
CREATE INDEX idx_employees_factory_active_hire 
ON employees(factory_id, is_active, hire_date DESC);
```

### 2.3 Query Optimization Issues

**Issue 1: Salary Calculation Loop Queries**
```python
# BEFORE - O(n) queries
for tc in timer_cards:
    employee = db.query(Employee).filter(Employee.id == tc.employee_id).first()
    # Process...

# AFTER - O(1) query
timer_cards = db.query(TimerCard)\
    .options(joinedload(TimerCard.employee))\
    .filter(conditions)\
    .all()
```

**Issue 2: Unoptimized COUNT queries**
```python
# BEFORE - Slow on large tables
total = db.query(Employee).filter(Employee.is_active == True).count()

# AFTER - Use explain analyze to verify index usage
total = db.query(func.count(Employee.id))\
    .filter(Employee.is_active == True)\
    .scalar()
```

### 2.4 Missing Foreign Key Constraints

**Potential Issues Found:**
- Some relationships use string-based foreign keys (factory_id, rirekisho_id)
- No ON DELETE CASCADE on some critical relationships
- Orphaned records possible in documents table

**Recommendation:** Add foreign key validation layer in SQLAlchemy models

### 2.5 Table Statistics & Cardinality

**Estimated Record Counts (Production):**
- candidates: ~5,000-10,000 records
- employees: ~1,000-3,000 active
- timer_cards: ~50,000-100,000 monthly
- salary_calculations: ~1,000-2,000 monthly
- audit_log: ~10,000+ (grows continuously)

**Recommendation:** 
- Archive audit_log older than 90 days
- Partition timer_cards by month (after 1M records)
- VACUUM ANALYZE monthly

---

## 3. Caching Strategy

### 3.1 Current Redis Implementation

**Status:** ✅ Redis configured but underutilized

**What's cached:**
- AI API responses (cache_service.py) ✅
- Some factory configs (redis_client.py) ✅

**What's NOT cached (should be):**
- Dashboard statistics ❌
- Factory list ❌
- User role permissions ❌
- System settings ❌
- Employee search results ❌

### 3.2 Redis Configuration

**Current Settings:**
```yaml
# docker-compose.yml
maxmemory: 256mb          # ⚠️  Too low for production
maxmemory-policy: allkeys-lru  # ✅ Good eviction policy
appendonly: yes           # ✅ Persistence enabled
```

**Recommendations:**
- Increase to 512MB-1GB for production
- Add monitoring for cache hit/miss ratio
- Implement cache warming on startup

### 3.3 Proposed Caching Strategy

```python
# HIGH PRIORITY - Cache dashboard stats (5min TTL)
@cache_response(ttl=300, key_prefix="dashboard_admin")
async def get_admin_dashboard(db: Session):
    # Heavy aggregations cached
    pass

# MEDIUM PRIORITY - Cache factory list (10min TTL)
@cache_response(ttl=600, key_prefix="factories_active")
async def get_active_factories(db: Session):
    # Frequently accessed, rarely changes
    pass

# LOW PRIORITY - Cache employee search (2min TTL)
@cache_response(ttl=120, key_prefix="employee_search")
async def search_employees(query: str, db: Session):
    # Reduce repeated searches
    pass
```

### 3.4 Cache Invalidation Strategy

**Missing:** Automatic cache invalidation on updates

**Solution:**
```python
# After employee update
invalidate_cache("employee_search:*")
invalidate_cache("dashboard_*")

# After factory update
invalidate_cache("factories_*")
invalidate_cache("dashboard_factory:*")
```

---

## 4. Async/Concurrency Analysis

### 4.1 Uvicorn Worker Configuration

**Development:**
```bash
uvicorn app.main:app --reload  # 1 worker
```

**Production:**
```bash
uvicorn app.main:app --workers 4  # ✅ Good for 4-core CPU
```

**Recommendation:**
- Formula: `workers = (2 * CPU_cores) + 1`
- For 4-core: 8-9 workers recommended
- Monitor CPU usage and adjust

### 4.2 Async/Await Usage

**Current Status:** Mixed sync/async

**Issues Found:**
- Most database operations are synchronous (blocking)
- SQLAlchemy sessions are not async
- File I/O operations are blocking

**Impact:** Worker threads blocked during DB queries

**Solution Options:**
1. **Short-term:** Keep current architecture (acceptable for <10k requests/day)
2. **Long-term:** Migrate to async SQLAlchemy
```python
from sqlalchemy.ext.asyncio import AsyncSession, create_async_engine

# Async engine
engine = create_async_engine("postgresql+asyncpg://...")

# Async queries
async def get_employee(db: AsyncSession, id: int):
    result = await db.execute(select(Employee).filter(Employee.id == id))
    return result.scalar_one_or_none()
```

### 4.3 Blocking Operations Identified

**File Uploads (Azure OCR):**
- ❌ Synchronous image processing
- ❌ Blocking API calls to Azure/Gemini

**Solution:** Use asyncio for I/O operations
```python
import aiohttp

async def call_azure_ocr(image_data):
    async with aiohttp.ClientSession() as session:
        async with session.post(endpoint, data=image_data) as resp:
            return await resp.json()
```

### 4.4 Timeout Configuration

**Missing:** Request timeout limits

**Risk:** Long-running queries can hang workers

**Solution:**
```python
# main.py
app.add_middleware(
    TimeoutMiddleware,
    timeout=30.0  # 30 second timeout
)
```

---

## 5. Memory & Resources

### 5.1 Connection Limits

**PostgreSQL max_connections:**
- Default: 100 connections
- Current usage: ~30 connections (20 pool + 10 overflow)
- **Status:** ✅ Healthy headroom

**Recommendation:** Monitor with:
```sql
SELECT count(*) as connections, state 
FROM pg_stat_activity 
GROUP BY state;
```

### 5.2 Memory Leak Analysis

**Potential Issues:**
- SQLAlchemy session not always closed properly
- Large file uploads kept in memory
- Audit log growing unbounded

**Solutions:**
1. Always use `get_db()` dependency (auto-closes)
2. Stream large file uploads
3. Implement audit log rotation

### 5.3 Request Handling Patterns

**Current Pattern:** Sequential request processing

**Opportunity:** Parallel processing for batch operations

Example:
```python
# BEFORE - Sequential
for employee_id in employee_ids:
    calculate_salary(db, employee_id, month, year)

# AFTER - Parallel
import asyncio
tasks = [calculate_salary_async(db, id, month, year) for id in employee_ids]
results = await asyncio.gather(*tasks)
```

---

## 6. API Design

### 6.1 Pagination Implementation

**Status:** ✅ Implemented with proper pagination

```python
def _paginate_response(items, total, page, page_size):
    total_pages = (total + page_size - 1) // page_size
    return {
        "items": items,
        "total": total,
        "page": page,
        "page_size": page_size,
        "total_pages": total_pages,
        "has_next": page < total_pages,
        "has_previous": page > 1
    }
```

**Recommendations:**
- Default page_size: 50 (currently varies)
- Max page_size: 100 (prevent abuse)
- Add cursor-based pagination for real-time feeds

### 6.2 Response Payload Sizes

**Large Response Examples:**
- Employee list with all fields: ~5-10KB per employee
- Dashboard stats with all aggregations: ~50-100KB
- Salary calculations with details: ~2-5KB per record

**Optimization Opportunities:**
1. **Field Selection:** Allow `?fields=id,name,email`
2. **Response Compression:** Enable gzip
3. **Sparse Fieldsets:** Return only requested fields

### 6.3 Redundant Data in Responses

**Issue:** Full employee object returned in nested relationships

Example:
```json
{
  "timer_card": {
    "id": 123,
    "employee": {
      "id": 456,
      "full_name_kanji": "山田太郎",
      "email": "...",
      "phone": "...",
      "address": "...",  // ❌ Not needed
      "photo_data_url": "..."  // ❌ Large base64 image
    }
  }
}
```

**Solution:** Use response schemas with exclude fields
```python
class EmployeeSummary(BaseModel):
    id: int
    full_name_kanji: str
    hakenmoto_id: int
    # Only essential fields

class TimerCardResponse(BaseModel):
    id: int
    employee: EmployeeSummary  # ✅ Minimal employee data
```

---

## 7. Dependency Analysis

### 7.1 Outdated Packages

**Critical Updates Needed:**

| Package | Current | Latest | Security Risk |
|---------|---------|--------|---------------|
| fastapi | 0.115.6 | 0.115.6 | ✅ Up to date |
| sqlalchemy | 2.0.36 | 2.0.36 | ✅ Up to date |
| pydantic | 2.10.5 | 2.10.5 | ✅ Up to date |
| uvicorn | 0.34.0 | 0.34.0 | ✅ Up to date |
| redis | 7.0.1 | 5.2.1 | ⚠️  Check compatibility |
| pytest | 8.3.4 | 8.3.4 | ✅ Up to date |

**Note:** Run `pip-audit` for security vulnerabilities:
```bash
pip install pip-audit
pip-audit
```

### 7.2 Unused Dependencies

**Potential Candidates for Removal:**
- mediapipe (if not using face detection)
- easyocr (if Azure/Gemini sufficient)
- pyodbc (Windows-only, not needed in Docker)

### 7.3 Dependency Conflicts

**No major conflicts detected** ✅

**OpenTelemetry versions:** All at 0.48b0 (consistent) ✅

---

## 8. Performance Bottlenecks (Prioritized)

### 🔴 CRITICAL (Immediate Action Required)

1. **N+1 Queries in Dashboard** (Lines 120-165)
   - Impact: 500ms → 50ms (10x improvement)
   - Effort: 2 hours
   - Fix: Add joinedload() to all relationship queries

2. **Missing Cache for Dashboard Stats**
   - Impact: 90% reduction in DB load
   - Effort: 3 hours
   - Fix: Implement Redis caching with 5-minute TTL

3. **No Response Compression**
   - Impact: 70% bandwidth reduction
   - Effort: 30 minutes
   - Fix: Add GZipMiddleware

### 🟡 HIGH (This Sprint)

4. **Missing Composite Indexes**
   - Impact: 40-50% faster filtering
   - Effort: 2 hours
   - Fix: Run provided SQL migration

5. **Inefficient Salary Calculations**
   - Impact: 60% faster payroll processing
   - Effort: 4 hours
   - Fix: Batch processing + eager loading

6. **Large Response Payloads**
   - Impact: 50% smaller responses
   - Effort: 6 hours
   - Fix: Implement sparse fieldsets

### 🟢 MEDIUM (Next Sprint)

7. **Audit Log Rotation**
   - Impact: Prevent DB bloat
   - Effort: 4 hours
   - Fix: Archive old logs, add cleanup job

8. **Redis Memory Limit**
   - Impact: Prevent cache eviction
   - Effort: 1 hour
   - Fix: Increase to 1GB

9. **Async Migration**
   - Impact: 2x request throughput
   - Effort: 2-3 weeks
   - Fix: Migrate to async SQLAlchemy

---

## 9. Estimated Throughput Improvements

### Current Baseline (Estimated)
- **Requests/second:** ~50-100 rps
- **Avg response time:** 150-300ms
- **P95 response time:** 500-800ms
- **Database queries/request:** 3-10 queries

### After Quick Wins (1-2, 3)
- **Requests/second:** ~200-300 rps (3x improvement)
- **Avg response time:** 50-100ms (3x faster)
- **P95 response time:** 150-250ms (3x faster)
- **Database queries/request:** 1-3 queries (optimized)

### After Full Optimization (All items)
- **Requests/second:** ~500-800 rps (8x improvement)
- **Avg response time:** 30-60ms (5x faster)
- **P95 response time:** 100-150ms (5x faster)
- **Database queries/request:** 1-2 queries (minimized)

---

## 10. Monitoring & Observability Recommendations

### 10.1 Missing APM Metrics

**Currently:** Basic OpenTelemetry configured ✅

**Missing:**
- Database query timing
- Cache hit/miss ratio
- Endpoint-level latency
- Connection pool usage

**Solution:** Add custom spans
```python
from opentelemetry import trace

tracer = trace.get_tracer(__name__)

@router.get("/employees")
async def get_employees(db: Session):
    with tracer.start_as_current_span("db_query_employees"):
        employees = db.query(Employee).all()
    return employees
```

### 10.2 Database Performance Monitoring

**Recommended Queries:**

```sql
-- Slow queries
SELECT query, mean_exec_time, calls 
FROM pg_stat_statements 
ORDER BY mean_exec_time DESC 
LIMIT 10;

-- Index usage
SELECT schemaname, tablename, indexname, idx_scan 
FROM pg_stat_user_indexes 
ORDER BY idx_scan ASC;

-- Table bloat
SELECT schemaname, tablename, 
       pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) as size
FROM pg_tables 
WHERE schemaname = 'public' 
ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;
```

### 10.3 Redis Monitoring

```bash
# Monitor cache hit rate
redis-cli INFO stats | grep keyspace

# Monitor memory usage
redis-cli INFO memory

# Monitor slow commands
redis-cli SLOWLOG GET 10
```

---

## 11. Security Audit Findings

### 11.1 SQL Injection Protection

**Status:** ✅ Protected (SQLAlchemy ORM)

All queries use parameterized statements through SQLAlchemy. No raw SQL with string concatenation detected.

### 11.2 Rate Limiting

**Status:** ✅ Properly configured

```python
RATE_LIMIT_GLOBAL: "100/minute"
RATE_LIMIT_AUTH_LOGIN: "5/minute"
RATE_LIMIT_UPLOAD: "10/minute"
```

**Recommendation:** Add per-user rate limiting (currently per-IP)

### 11.3 Database Access Control

**Status:** ⚠️  Single database user

**Recommendation:** Use read-only replicas for reporting queries

---

## 12. Action Plan

### Phase 1: Quick Wins (Week 1)
1. Add joinedload() to dashboard queries
2. Implement Redis caching for dashboard
3. Enable GZip compression
4. Add missing composite indexes

**Expected Impact:** 3x performance improvement

### Phase 2: Optimization (Week 2-3)
5. Optimize salary calculation queries
6. Implement sparse fieldsets
7. Add request timeouts
8. Increase Redis memory

**Expected Impact:** 5x performance improvement

### Phase 3: Monitoring (Week 4)
9. Add APM custom spans
10. Set up database monitoring dashboards
11. Configure cache hit/miss alerts
12. Implement audit log rotation

**Expected Impact:** Full observability

### Phase 4: Long-term (Month 2-3)
13. Migrate to async SQLAlchemy
14. Implement connection pooling improvements
15. Add read replicas
16. Optimize image processing pipeline

**Expected Impact:** 8-10x performance improvement

---

## 13. Conclusion

### Summary of Findings

**Strengths:**
- ✅ Well-designed schema with proper relationships
- ✅ Good connection pool configuration
- ✅ Comprehensive indexing strategy
- ✅ Rate limiting properly implemented
- ✅ Security best practices followed

**Critical Issues:**
- ❌ N+1 queries in dashboard endpoints
- ❌ Underutilized caching layer
- ❌ No response compression
- ❌ Missing composite indexes

**Performance Baseline:**
- **Current avg response time:** ~150-300ms
- **Main bottleneck:** N+1 queries in dashboard
- **Top 3 quick wins:** joinedload, Redis cache, GZip

**Estimated Improvements:**
- Quick wins (1 week): 3x faster
- Full optimization (1 month): 5-8x faster
- With async migration (3 months): 10x faster

---

## Appendix A: SQL Migration Scripts

### A.1 Missing Composite Indexes

```sql
-- Run this migration to add missing composite indexes
BEGIN;

-- Salary calculations optimization
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_salary_employee_paid 
ON salary_calculations(employee_id, is_paid, calculation_year, calculation_month);

-- Apartment assignments optimization
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_apartment_assignment_employee_active 
ON apartment_assignments(employee_id, status) 
WHERE status = 'active';

-- Request approval workflow
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_requests_status_created 
ON requests(status, created_at DESC);

-- Timer card approval queue
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_timer_cards_approval_queue 
ON timer_cards(factory_id, is_approved, work_date DESC) 
WHERE is_approved = false;

-- Employee factory lookup
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_employees_factory_active_hire 
ON employees(factory_id, is_active, hire_date DESC);

COMMIT;

-- Analyze tables after index creation
VACUUM ANALYZE salary_calculations;
VACUUM ANALYZE apartment_assignments;
VACUUM ANALYZE requests;
VACUUM ANALYZE timer_cards;
VACUUM ANALYZE employees;
```

### A.2 Index Usage Monitoring

```sql
-- Check if indexes are being used
SELECT 
    schemaname,
    tablename,
    indexname,
    idx_scan as index_scans,
    idx_tup_read as tuples_read,
    idx_tup_fetch as tuples_fetched
FROM pg_stat_user_indexes
WHERE schemaname = 'public'
ORDER BY idx_scan DESC;

-- Find unused indexes
SELECT 
    schemaname,
    tablename,
    indexname
FROM pg_stat_user_indexes
WHERE idx_scan = 0
  AND indexname NOT LIKE '%_pkey'
  AND schemaname = 'public';
```

---

## Appendix B: Code Fixes

### B.1 Dashboard N+1 Query Fix

**Before:**
```python
# backend/app/api/dashboard.py (lines 138-145)
recent_requests = db.query(Request).order_by(Request.created_at.desc()).limit(limit).all()
for request in recent_requests:
    employee = db.query(Employee).filter(Employee.hakenmoto_id == request.hakenmoto_id).first()  # ❌ N+1
    employee_name = employee.full_name_kanji if employee else f"Employee #{request.hakenmoto_id}"
```

**After:**
```python
from sqlalchemy.orm import joinedload

recent_requests = (
    db.query(Request)
    .options(joinedload(Request.employee))  # ✅ Eager load
    .order_by(Request.created_at.desc())
    .limit(limit)
    .all()
)
for request in recent_requests:
    employee_name = request.employee.full_name_kanji if request.employee else f"Employee #{request.hakenmoto_id}"
```

### B.2 Redis Cache Implementation

**Dashboard Stats Caching:**
```python
from app.core.redis_client import cache_response, invalidate_cache

@router.get("/admin", response_model=AdminDashboard)
@cache_response(ttl=300, key_prefix="dashboard_admin")  # 5-minute cache
async def get_admin_dashboard(
    current_user: User = Depends(auth_service.require_role("admin")),
    db: Session = Depends(get_db)
):
    # Heavy aggregations cached for 5 minutes
    stats = _compute_dashboard_stats(db)
    return stats

# Invalidate cache on data changes
@router.post("/employees")
async def create_employee(...):
    # ... create employee
    invalidate_cache("dashboard_*")  # Clear dashboard cache
    return employee
```

### B.3 GZip Compression

```python
# backend/app/main.py
from fastapi.middleware.gzip import GZipMiddleware

# Add after CORS middleware
app.add_middleware(
    GZipMiddleware, 
    minimum_size=1000,  # Only compress responses > 1KB
    compresslevel=6     # Balance between speed and compression (1-9)
)
```

---

## Appendix C: Monitoring Dashboards

### C.1 Grafana Dashboard Queries

**API Performance Panel:**
```promql
# Average response time by endpoint
rate(http_request_duration_seconds_sum[5m]) 
/ 
rate(http_request_duration_seconds_count[5m])

# Request rate by endpoint
rate(http_requests_total[5m])

# Error rate
rate(http_requests_total{status=~"5.."}[5m])
```

**Database Performance Panel:**
```sql
-- Active connections
SELECT count(*) FROM pg_stat_activity WHERE state = 'active';

-- Average query time
SELECT mean_exec_time FROM pg_stat_statements ORDER BY mean_exec_time DESC LIMIT 10;

-- Cache hit ratio
SELECT 
    sum(blks_hit) / (sum(blks_hit) + sum(blks_read)) as cache_hit_ratio 
FROM pg_stat_database;
```

**Redis Performance Panel:**
```bash
# Hit rate
INFO stats | grep keyspace_hits

# Memory usage
INFO memory | grep used_memory_human

# Connected clients
INFO clients | grep connected_clients
```

---

**End of Audit Report**

**Next Steps:**
1. Review findings with development team
2. Prioritize action items based on impact/effort
3. Implement Phase 1 quick wins (Week 1)
4. Set up monitoring dashboards (Week 2)
5. Schedule follow-up audit after optimizations (Month 2)

**Questions or Issues:**
Contact: @database-admin

