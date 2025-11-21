# 🚀 Performance Optimization Guide

## Objetivo

Identificar y optimizar queries lentas, agregar índices de base de datos y mejorar tiempos de respuesta de la API.

---

## 1️⃣ Identifying Slow Queries

### Método 1: PostgreSQL Query Logs

Habilitar logging de queries lentas en PostgreSQL:

```sql
-- Conectarse a PostgreSQL como admin
psql -U postgres -d uns_claudejp

-- Ver configuración actual
SHOW log_min_duration_statement;

-- Configurar para loguear queries > 1000ms
ALTER SYSTEM SET log_min_duration_statement = 1000;

-- Recargar configuración
SELECT pg_reload_conf();

-- Ver logs
tail -f /var/log/postgresql/postgresql-<date>.log | grep duration
```

### Método 2: SQLAlchemy Query Events

```python
# backend/app/core/database.py
from sqlalchemy import event
import logging
import time

logger = logging.getLogger(__name__)

@event.listens_for(Engine, "before_cursor_execute")
def before_cursor_execute(conn, cursor, statement, parameters, context, executemany):
    conn.info.setdefault('query_start_time', []).append(time.time())

@event.listens_for(Engine, "after_cursor_execute")
def after_cursor_execute(conn, cursor, statement, parameters, context, executemany):
    total = time.time() - conn.info['query_start_time'].pop(-1)
    if total > 1.0:  # Log queries > 1 second
        logger.warning(f"SLOW QUERY ({total:.2f}s): {statement}")
```

### Método 3: FastAPI Middleware

```python
# backend/app/core/middleware.py
from fastapi import Request
import time
import logging

logger = logging.getLogger(__name__)

@app.middleware("http")
async def log_request_time(request: Request, call_next):
    start = time.time()
    response = await call_next(request)
    duration = time.time() - start

    if duration > 1.0:  # Log requests > 1 second
        logger.warning(f"SLOW ENDPOINT ({duration:.2f}s): {request.method} {request.url.path}")

    return response
```

---

## 2️⃣ Common Performance Issues & Fixes

### Issue 1: N+1 Query Problem

**Problem**: Loading related data one by one

```python
# ❌ BAD: N+1 queries
employees = db.query(Employee).all()
for emp in employees:
    print(emp.factory.name)  # Separate query for each employee!
```

**Solution**: Use eager loading

```python
# ✅ GOOD: Single query with joins
from sqlalchemy.orm import joinedload

employees = db.query(Employee).options(
    joinedload(Employee.factory)
).all()
```

### Issue 2: Missing Indexes

**Problem**: No index on frequently queried columns

```python
# ❌ SLOW: Scanning all rows
db.query(Employee).filter(Employee.email == "user@example.com")

db.query(TimeCard).filter(TimeCard.employee_id == 1)

db.query(Payroll).filter(Payroll.created_at >= date(2025, 1, 1))
```

**Solution**: Add indexes

```sql
-- Add indexes to frequently filtered columns
CREATE INDEX idx_employee_email ON employees(email);
CREATE INDEX idx_timecard_employee_id ON timer_cards(hakenmoto_id);
CREATE INDEX idx_timecard_date ON timer_cards(work_date);
CREATE INDEX idx_payroll_created_at ON payroll_runs(created_at);
CREATE INDEX idx_payroll_employee_id ON payroll_runs(employee_id);
```

### Issue 3: Selecting Unnecessary Columns

**Problem**: Loading all columns when you only need a few

```python
# ❌ BAD: Get all columns, only use 2
employees = db.query(Employee).all()
for emp in employees:
    print(emp.id, emp.full_name_kanji)
```

**Solution**: Select specific columns

```python
# ✅ GOOD: Only get needed columns
employees = db.query(
    Employee.id,
    Employee.full_name_kanji
).all()
```

### Issue 4: Missing Pagination

**Problem**: Returning thousands of records

```python
# ❌ BAD: Returns ALL candidates
candidates = db.query(Candidate).all()
```

**Solution**: Implement pagination

```python
# ✅ GOOD: Paginate results
page = 1
per_page = 20
skip = (page - 1) * per_page

candidates = db.query(Candidate).offset(skip).limit(per_page).all()
total = db.query(func.count(Candidate.id)).scalar()
```

### Issue 5: Suboptimal Filtering

**Problem**: Loading data then filtering in Python

```python
# ❌ BAD: Filter in Python (slow)
all_employees = db.query(Employee).all()
active = [e for e in all_employees if e.is_active]
```

**Solution**: Filter in database

```python
# ✅ GOOD: Filter in SQL
active = db.query(Employee).filter(Employee.is_active == True).all()
```

---

## 3️⃣ Optimization Checklist

### Database Level

- [ ] Create indexes on:
  - `employee.email`
  - `timecard.employee_id`
  - `timecard.work_date`
  - `payroll.created_at`
  - `candidate.email`
  - `user.email`

- [ ] Enable query logging to identify slow queries
- [ ] Analyze query execution plans: `EXPLAIN ANALYZE SELECT ...`
- [ ] Vacuum and analyze tables: `VACUUM ANALYZE;`

### ORM Level (SQLAlchemy)

- [ ] Use `joinedload()` for related objects
- [ ] Use `selectinload()` for collections
- [ ] Select specific columns instead of full rows
- [ ] Batch operations instead of looping

Example:
```python
from sqlalchemy.orm import selectinload

# Good: Load employee with all timecards efficiently
employees = db.query(Employee).options(
    selectinload(Employee.timecards)
).all()
```

### API Level (FastAPI)

- [ ] Implement pagination on list endpoints
- [ ] Cache frequently accessed data
- [ ] Use response compression (gzip)
- [ ] Implement async/await properly

Example:
```python
@router.get("/employees")
async def list_employees(
    skip: int = Query(0, ge=0),
    limit: int = Query(20, ge=1, le=100),
    db: Session = Depends(get_db)
):
    # Paginate results
    total = db.query(func.count(Employee.id)).scalar()
    employees = db.query(Employee).offset(skip).limit(limit).all()

    return {
        "data": employees,
        "total": total,
        "page": skip // limit + 1,
        "per_page": limit
    }
```

### Frontend Level (Next.js)

- [ ] Lazy load components
- [ ] Implement image optimization
- [ ] Use React.memo() for expensive components
- [ ] Implement virtual scrolling for large lists

---

## 4️⃣ Critical Queries to Optimize

### Query 1: Get Employee with All Related Data

**Current (Slow)**:
```python
employee = db.query(Employee).filter(Employee.id == emp_id).first()
# Then accessing:
employee.timecards  # N+1 query for each timecard
employee.payroll    # N+1 query for payroll
employee.apartment  # Another query
```

**Optimized**:
```python
from sqlalchemy.orm import joinedload, selectinload

employee = db.query(Employee).filter(
    Employee.id == emp_id
).options(
    joinedload(Employee.apartment),
    selectinload(Employee.timecards),
    selectinload(Employee.payroll_runs)
).first()
```

### Query 2: List Employees with Pagination

**Current (Slow)**:
```python
employees = db.query(Employee).all()  # Loads ALL employees
return employees[0:20]  # Then filter in Python
```

**Optimized**:
```python
page = request.query_params.get("page", 1)
per_page = 20
skip = (int(page) - 1) * per_page

employees = db.query(Employee).offset(skip).limit(per_page).all()
total = db.query(func.count(Employee.id)).scalar()

return {
    "data": employees,
    "total": total,
    "page": int(page),
    "pages": (total + per_page - 1) // per_page
}
```

### Query 3: Calculate Payroll Statistics

**Current (Slow)**:
```python
payrolls = db.query(Payroll).filter(
    Payroll.period_start >= start_date,
    Payroll.period_end <= end_date
).all()

# Then calculate in Python:
total_gross = sum(p.gross_salary for p in payrolls)
total_net = sum(p.net_salary for p in payrolls)
```

**Optimized**:
```python
from sqlalchemy import func

stats = db.query(
    func.sum(Payroll.gross_salary).label("total_gross"),
    func.sum(Payroll.net_salary).label("total_net"),
    func.count(Payroll.id).label("count")
).filter(
    Payroll.period_start >= start_date,
    Payroll.period_end <= end_date
).first()

return {
    "total_gross": float(stats.total_gross or 0),
    "total_net": float(stats.total_net or 0),
    "count": stats.count
}
```

---

## 5️⃣ Caching Strategy

### Redis Cache for Frequently Accessed Data

```python
from app.services.cache_service import CacheService

cache_service = CacheService()

# Get employees with caching
@router.get("/employees")
async def list_employees(db: Session = Depends(get_db)):
    # Try to get from cache
    cached = await cache_service.get("employees_list")
    if cached:
        return cached

    # If not in cache, query database
    employees = db.query(Employee).all()

    # Store in cache for 1 hour
    await cache_service.set("employees_list", employees, ttl=3600)

    return employees
```

### Cache Invalidation

```python
@router.post("/employees")
async def create_employee(
    request: EmployeeCreate,
    db: Session = Depends(get_db)
):
    # Create employee
    employee = Employee(**request.dict())
    db.add(employee)
    db.commit()

    # Invalidate related caches
    await cache_service.delete("employees_list")
    await cache_service.delete(f"employee_{employee.id}")

    return employee
```

---

## 6️⃣ Monitoring & Profiling

### Use New Relic or DataDog

```python
# Install and configure monitoring
# pip install newrelic

import newrelic.agent
newrelic.agent.initialize('newrelic.ini')
app = newrelic.agent.wsgi_application()(app)
```

### Profile Endpoints with Py-Spy

```bash
# Install
pip install py-spy

# Profile a running process
py-spy record -o profile.svg --pid <PID>

# View profile
open profile.svg
```

---

## 7️⃣ Implementation Roadmap

### Week 1: Foundation
- [ ] Enable query logging
- [ ] Create critical indexes
- [ ] Add pagination to list endpoints

### Week 2: ORM Optimization
- [ ] Implement eager loading with joinedload/selectinload
- [ ] Optimize N+1 queries
- [ ] Add query result caching

### Week 3: Advanced
- [ ] Implement Redis caching layer
- [ ] Profile endpoints with py-spy
- [ ] Optimize slowest 10% of queries

### Week 4: Monitoring
- [ ] Set up monitoring (New Relic/DataDog)
- [ ] Create performance dashboards
- [ ] Implement alerting for slow queries

---

## 8️⃣ Expected Improvements

| Metric | Before | After | Improvement |
|--------|--------|-------|-------------|
| List employees endpoint | 1500ms | 150ms | 90% faster |
| Get employee detail | 800ms | 200ms | 75% faster |
| Calculate payroll | 3000ms | 500ms | 83% faster |
| Database size | 500MB | 450MB | 10% smaller |
| Query count per request | 25 | 5 | 80% reduction |

---

## 9️⃣ Resources

- [SQLAlchemy Performance Tips](https://docs.sqlalchemy.org/en/14/faq/performance.html)
- [PostgreSQL Index Tips](https://wiki.postgresql.org/wiki/Performance_Optimization)
- [FastAPI Performance](https://fastapi.tiangolo.com/deployment/concepts/#scaling)
- [New Relic Python Agent](https://docs.newrelic.com/docs/agents/python-agent)

---

**Start with Section 2 (Common Issues) - most improvements come from fixing N+1 queries and adding missing indexes.**
