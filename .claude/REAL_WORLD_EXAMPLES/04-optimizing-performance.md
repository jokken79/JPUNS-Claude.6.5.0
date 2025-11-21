# 📚 Real World Example #4: Optimizing Performance

**Complete walkthrough of optimizing slow candidates list page**

---

## 🎯 The Problem

```
User: "Candidates list is slow. Takes 5+ seconds to load with 500 candidates.
Backend shows 50+ database queries. We need it under 1 second."
```

---

## 🔄 Claude Code's Workflow

### Delegate to Performance Optimizer

```
Task(
    subagent_type="general-purpose",
    description="Optimize slow candidates list",
    prompt="""
    Profile and optimize slow candidates list page.

    Current state:
    - 500 candidates
    - Load time: 5000+ ms
    - Database queries: 50+
    - Frontend: No pagination

    Target:
    - Load time: < 1000 ms
    - Database queries: < 5
    - Support 10,000+ candidates

    Issues to investigate:
    1. N+1 queries (probably loading user for each candidate)
    2. Missing pagination
    3. Missing database indexes
    4. No query optimization (eager loading)
    5. Frontend bundling issues?

    Provide:
    1. Query optimization (eager loading with joinedload)
    2. Pagination implementation
    3. Index creation (if needed)
    4. Frontend optimization (code splitting, lazy loading)
    5. Before/after metrics
    """
)
```

---

### Performance Optimizer's Solution

**Problem 1: N+1 Queries**

```python
# BEFORE (BAD) - 50+ queries!
candidates = db.query(Candidate).all()
for candidate in candidates:
    print(candidate.user.name)  # ← Triggers 1 query per candidate!

# AFTER (GOOD) - 1 query!
from sqlalchemy.orm import joinedload

candidates = db.query(Candidate).options(
    joinedload(Candidate.user),
    joinedload(Candidate.employee),
).all()
```

**Problem 2: No Pagination**

```python
# BEFORE (loads all 500)
@router.get("/candidates")
async def list_candidates(db: AsyncSession = Depends(get_db)):
    candidates = await db.execute(select(Candidate))
    return candidates.scalars().all()

# AFTER (pagination)
@router.get("/candidates")
async def list_candidates(
    skip: int = 0,
    limit: int = 50,
    db: AsyncSession = Depends(get_db),
):
    query = select(Candidate).options(
        joinedload(Candidate.user),
        joinedload(Candidate.employee),
    ).offset(skip).limit(limit)

    result = await db.execute(query)
    total = await db.execute(select(func.count(Candidate.id)))

    return {
        "items": result.scalars().all(),
        "total": total.scalar(),
        "skip": skip,
        "limit": limit,
    }
```

**Problem 3: Missing Indexes**

```python
# Add to models
class Candidate(Base):
    __table_args__ = (
        Index("ix_candidate_email", "email"),
        Index("ix_candidate_created_at", "created_at"),
        Index("ix_candidate_status", "status"),
    )
```

**Problem 4: Frontend Pagination**

```typescript
// components/candidates/candidates-list.tsx
'use client'

import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'

export function CandidatesList() {
  const [page, setPage] = useState(0)
  const limit = 50

  const { data, isLoading } = useQuery({
    queryKey: ['candidates', page],
    queryFn: () => api.get(`/candidates?skip=${page * limit}&limit=${limit}`),
  })

  return (
    <div>
      {data?.items.map(candidate => (
        <CandidateRow key={candidate.id} candidate={candidate} />
      ))}
      <Pagination
        total={data?.total}
        page={page}
        onPageChange={setPage}
      />
    </div>
  )
}
```

---

### Results

| Metric | Before | After | Improvement |
|--------|--------|-------|------------|
| **Load time** | 5000ms | 200ms | 25x faster ✅ |
| **Database queries** | 50+ | 2-3 | 95% reduction ✅ |
| **Support** | 500 candidates | 1M+ | Unlimited ✅ |
| **Memory usage** | 500MB | 10MB | 50x less ✅ |

---

### Testing

```bash
# Load test with 10,000 candidates
locust -f tests/load_test.py --users=100 --spawn-rate=10

# Results:
# - 99th percentile: 150ms
# - 95th percentile: 100ms
# - 50th percentile: 50ms
```

**Test passes:** ✅ 100x performance improvement verified!

---

## 📊 Summary

| Optimization | Impact | Effort |
|--------------|--------|--------|
| **Eager loading** | 50 queries → 2 queries | 10 min |
| **Pagination** | Full load → 50 items | 15 min |
| **Indexes** | Query planning improved | 5 min |
| **Frontend lazy load** | 2MB bundle → 500KB | 10 min |

**Total improvement:** 25x faster, 95% fewer queries

---

## 🎓 Key Takeaway

Performance optimization checklist:
1. ✅ Profile to find real bottleneck
2. ✅ Fix N+1 queries first (biggest impact)
3. ✅ Add pagination (load what you need)
4. ✅ Add indexes (database planning)
5. ✅ Optimize frontend (bundle size, lazy loading)

**Never optimize blindly — profile first!** 📊
