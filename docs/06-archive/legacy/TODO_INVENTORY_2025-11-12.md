# TODO Inventory - UNS-ClaudeJP 5.4.1
**Date:** 2025-11-12
**Status:** Documented for future sprints
**Total TODOs:** 8 actionable (6 false positives excluded)

---

## Summary

This document inventories all TODO comments found in the codebase. Most are enhancements for future sprints, not critical bugs.

### False Positives (Spanish "TODOS" = "ALL")
- `backend/app/api/employees.py:288` - "busca en TODOS los campos" ❌ Not a TODO
- `backend/app/core/redis_client.py:108` - "Limpia TODO el cache" ❌ Not a TODO
- `backend/app/services/*_service.py` - "MÉTODOS AUXILIARES" (3 occurrences) ❌ Not TODOs
- `frontend/app/(dashboard)/candidates/rirekisho/page.tsx:1728` - "Ocultar TODOS" ❌ Not a TODO

---

## Backend TODOs (6 items)

### 1. Permissions System - Additional Charges
**File:** `backend/app/services/additional_charge_service.py:493`
**Priority:** LOW
**Description:** Implement role-based permissions for additional charge management

```python
# TODO: Implementar sistema de permisos
# - KEIRI can approve/modify charges
# - ADMIN can override
# - Regular users can only view
```

**Impact:** Currently all authenticated users can manage additional charges
**Recommendation:** Implement in next sprint when RBAC system is enhanced

---

### 2. Apartment Capacity Verification
**File:** `backend/app/services/apartment_service.py:733`
**Priority:** MEDIUM
**Description:** Verify available capacity before assigning employee

```python
# TODO: Verificar capacidad disponible
# - Check current_occupancy < max_capacity
# - Prevent overbooking
# - Show warning if at capacity
```

**Impact:** Apartments can be over-assigned without warnings
**Recommendation:** Implement when multi-occupancy feature is added

---

### 3. Apartment Capacity Field
**File:** `backend/app/services/assignment_service.py:138`
**Priority:** MEDIUM
**Description:** Add capacity field to apartments table for multi-occupancy

```python
# TODO: Agregar campo capacity en tabla apartments si se necesita más de 1 empleado por apartamento
# Current: One employee per apartment
# Proposed: Multiple employees per apartment (e.g., shared housing)
```

**Impact:** Currently assumes 1:1 employee-apartment relationship
**Recommendation:** Create Alembic migration if multi-occupancy is needed

---

### 4. Additional Charges in Assignments
**File:** `backend/app/services/assignment_service.py:358`
**Priority:** LOW
**Description:** Include additional charges when calculating assignment costs

```python
# TODO: Agregar cargos adicionales de AdditionalCharge
# - Electricity, water, parking fees
# - Should be itemized in payroll deductions
```

**Impact:** Additional charges not included in assignment cost calculation
**Recommendation:** Link AdditionalCharge table to assignments

---

### 5. Rent Deductions Creation
**File:** `backend/app/services/assignment_service.py:382`
**Priority:** MEDIUM
**Description:** Automatically create rent deduction when assignment is made

```python
# TODO: Crear deducción en rent_deductions
# When employee is assigned to apartment:
# 1. Calculate monthly rent
# 2. Create RentDeduction record
# 3. Link to payroll system
```

**Impact:** Manual rent deduction creation required
**Recommendation:** Implement in payroll integration sprint

---

### 6. Real Data Implementation
**File:** `backend/app/services/assignment_service.py:979`
**Priority:** LOW
**Description:** Replace placeholder data with real implementation

```python
# Placeholder - TODO: Implementar con datos reales
# Current: Returns mock/default values
# Needed: Actual database queries
```

**Impact:** Some helper methods return placeholder data
**Recommendation:** Review and implement when feature is activated

---

## Frontend TODOs (2 items)

### 7. Yukyu Totals Calculation
**File:** `frontend/app/(dashboard)/admin/yukyu-management/page.tsx:137-138`
**Priority:** HIGH ⚠️
**Description:** Calculate totalUsed and totalExpired from backend data

```typescript
// TODO: calcular desde requests
totalUsed: 0,
// TODO: calcular desde balances
totalExpired: 0
```

**Current Implementation:** Hardcoded to 0
**Expected Implementation:**
```typescript
const {data: stats} = useQuery({
  queryKey: ['yukyu-stats'],
  queryFn: () => yukyuService.getStats()
})

const summary = {
  totalUsed: stats?.total_used || 0,
  totalExpired: stats?.total_expired || 0
}
```

**Impact:** Admin dashboard shows incorrect yukyu statistics
**Recommendation:** HIGH PRIORITY - Implement immediately

**Solution:**
1. Backend already has `/api/yukyu/balances` endpoint that returns aggregate data
2. Frontend should fetch this data instead of using hardcoded 0
3. Update yukyu-management page to use React Query

---

### 8. Yukyu History Endpoint
**File:** `frontend/app/(dashboard)/yukyu-history/page.tsx:79`
**Priority:** MEDIUM
**Description:** Create backend endpoint for yukyu usage history

```typescript
// TODO: Este endpoint debe ser creado en el backend si no existe
const response = await api.get('/yukyu/usage-history')
```

**Current State:** Frontend expects endpoint that doesn't exist
**Required Backend Endpoint:**
```python
@router.get("/usage-history", response_model=List[YukyuUsageDetailResponse])
async def get_yukyu_usage_history(
    employee_id: Optional[int] = None,
    start_date: Optional[date] = None,
    end_date: Optional[date] = None,
    db: Session = Depends(get_db)
):
    # Return yukyu_usage_details with date range filters
```

**Impact:** Yukyu history page non-functional
**Recommendation:** MEDIUM PRIORITY - Create endpoint in next sprint

---

## Priority Matrix

### High Priority ⚠️
- [ ] #7: Yukyu totals calculation (Admin dashboard shows incorrect stats)

### Medium Priority
- [ ] #2: Apartment capacity verification
- [ ] #3: Add capacity field to apartments table
- [ ] #5: Rent deductions creation
- [ ] #8: Yukyu history endpoint

### Low Priority
- [ ] #1: Permissions system for additional charges
- [ ] #4: Additional charges in assignments
- [ ] #6: Replace placeholder data

---

## Implementation Recommendations

### Sprint 1 (Immediate - Current Sprint)
**Focus:** Yukyu fixes and admin dashboard
- ✅ Bug #1: SQLAlchemy filter construction (DONE)
- ✅ Bug #2: Request hybrid property (DONE)
- 🔴 TODO #7: Fix yukyu totals calculation in admin dashboard

**Estimated Effort:** 2 hours

### Sprint 2 (Next Sprint)
**Focus:** Yukyu enhancements
- 🟡 TODO #8: Create yukyu usage history endpoint
- 🟡 TODO #5: Auto-create rent deductions on assignment

**Estimated Effort:** 1 day

### Sprint 3 (Future)
**Focus:** Apartment multi-occupancy
- 🟡 TODO #2: Apartment capacity verification
- 🟡 TODO #3: Add capacity field migration

**Estimated Effort:** 2 days

### Backlog (Low Priority)
- 🟢 TODO #1: Permissions system
- 🟢 TODO #4: Additional charges integration
- 🟢 TODO #6: Replace placeholders

**Estimated Effort:** 3-5 days total

---

## Related Documentation

- `docs/RESUMEN_EJECUTIVO_YUKYU_2025-11-12.md` - Yukyu system fixes
- `docs/YUKYU_CALCULATE_BALANCES_ISSUE_2025-11-12.md` - Known calculate endpoint issue
- `backend/app/services/assignment_service.py` - Assignment business logic
- `frontend/app/(dashboard)/admin/yukyu-management/page.tsx` - Admin yukyu dashboard

---

**Last Updated:** 2025-11-12 09:45 JST
**Documented By:** Claude Code
**Status:** Inventory complete, ready for sprint planning
