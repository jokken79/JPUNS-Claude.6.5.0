# FASE 3 #10 - Detailed Migration Plan

## Salary/Payroll Schema Consolidation - Implementation Guide

**Status**: Ready for implementation
**Complexity**: HIGH (971 lines in salary.py + 1000+ lines in payroll.py)
**Time Estimate**: 4-6 hours with testing
**Risk**: MEDIUM (API contracts change)

---

## Phase 1: API Route Migration - salary.py

### Current State (backend/app/api/salary.py)
- **Size**: 971 lines
- **Routes**: 13 endpoints
- **Status**: Partially migrated (uses both schemas)

### Import Changes Required

**Current (Mixed)**:
```python
from app.schemas.salary import (
    SalaryCalculate, SalaryCalculationResponse, SalaryBulkCalculate,
    SalaryBulkResult, SalaryMarkPaid, SalaryStatistics
)
from app.schemas.salary_unified import (
    SalaryUpdate, MarkSalaryPaidRequest, SalaryReportFilters,
    SalaryExportResponse, SalaryReportResponse
)
```

**Target (Unified)**:
```python
from app.schemas.salary_unified import (
    SalaryCalculateRequest,
    SalaryCalculationResponse,
    SalaryBulkCalculateRequest,
    BulkCalculateResponse,
    SalaryMarkPaidRequest,
    SalaryStatistics,
    SalaryUpdate,
    MarkSalaryPaidRequest,  # Keep for compatibility
    SalaryReportFilters,
    SalaryExportResponse,
    SalaryReportResponse
)
```

### Route-by-Route Changes

| Line | Route | Current Type | Target Type | Notes |
|------|-------|---|---|---|
| 145 | POST /calculate | SalaryCalculate → SalaryCalculationResponse | SalaryCalculateRequest → SalaryCalculationResponse | Rename request param |
| 149 | salary_data | SalaryCalculate | SalaryCalculateRequest | Type change |
| 204 | POST /calculate/bulk | SalaryBulkCalculate → SalaryBulkResult | SalaryBulkCalculateRequest → BulkCalculateResponse | Type name change |
| 206 | bulk_data | SalaryBulkCalculate | SalaryBulkCalculateRequest | Type change |
| 263 | GET / | PaginatedResponse[SalaryCalculationResponse] | Same | No change needed |
| 314 | GET /{id} | SalaryCalculationResponse | Same | No change needed |
| 346 | POST /mark-paid | SalaryMarkPaid | SalaryMarkPaidRequest | Already in unified |
| 348 | payment_data | SalaryMarkPaid | SalaryMarkPaidRequest | Verify field names match |
| 368 | GET /statistics | SalaryStatistics | Same | No change needed |
| 423 | PUT /{id} | SalaryUpdate | Same | Already correct |
| 546 | POST /{id}/mark-paid | MarkSalaryPaidRequest | Same | Already correct |
| 603 | GET /reports | SalaryReportResponse | Same | Already correct |
| 707 | POST /export/excel | SalaryReportFilters | Same | Already correct |
| 794 | POST /export/pdf | SalaryReportFilters | Same | Already correct |

### Implementation Steps

**Step 1.1**: Update imports (lines 18-25)
- Remove salary.py import completely
- Consolidate all imports from salary_unified

**Step 1.2**: Fix route signatures (lines 145-204)
- Line 145: Change response_model=SalaryCalculationResponse (might be same type, verify)
- Line 149: Rename salary_data parameter type
- Line 204: Change response_model=SalaryBulkResult → BulkCalculateResponse
- Line 206: Rename bulk_data parameter type

**Step 1.3**: Verify field names compatibility
- Check if SalaryCalculateRequest fields match what calculate_salary() returns
- Check if SalaryBulkCalculateRequest fields match what bulk calculation expects
- Check if SalaryMarkPaidRequest fields match what mark_salary_paid() expects

**Step 1.4**: Testing checklist
- [ ] All salary calculation endpoints still work
- [ ] Bulk calculation returns correct type
- [ ] Statistics endpoint returns correct data format
- [ ] Mark paid endpoints work
- [ ] Export endpoints work

---

## Phase 2: API Route Migration - payroll.py

### Current State (backend/app/api/payroll.py)
- **Size**: Estimated 500-1000 lines
- **Routes**: TBD (need to examine)
- **Status**: Unknown (use salary.py patterns as reference)

### Same migration approach as salary.py

---

## Phase 3: Service Layer Updates

### Files to Update
- `backend/app/services/salary_export_service.py`
- `backend/app/services/payslip_service.py`
- Any other services importing from salary.py or payroll.py

### Changes
- Update imports to use salary_unified
- Update type annotations to use unified schemas
- Verify return types match what APIs expect

---

## Phase 4: Schema File Cleanup

### Files to Delete
1. `backend/app/schemas/salary.py` (107 lines)
2. `backend/app/schemas/payroll.py` (341 lines)

### Files to Update
- `backend/app/schemas/__init__.py`
  - Remove imports of salary.py classes
  - Keep imports of salary_unified classes
  - Update __all__ list

### Update __init__.py
```python
# REMOVE these imports:
from app.schemas.salary import (
    SalaryCalculationBase,
    SalaryCalculate,
    SalaryCalculationResponse,
    SalaryBulkCalculate,
    SalaryBulkResult,
    SalaryMarkPaid,
    SalaryReport,
    SalaryStatistics,
)

# REMOVE these exports from __all__:
"SalaryCalculationBase",
"SalaryCalculate",
"SalaryCalculationResponse",
"SalaryBulkCalculate",
"SalaryBulkResult",
"SalaryMarkPaid",
"SalaryReport",
"SalaryStatistics",

# payroll.py imports/exports to remove (same pattern)
```

---

## Phase 5: Testing

### Unit Tests to Update
- `backend/tests/test_salary_system.py`
- `backend/tests/test_payroll_api.py`
- `backend/tests/test_payroll_api_integration.py`
- `backend/tests/test_payroll_service.py`
- `backend/tests/test_employee_payroll_integration.py`
- `backend/tests/test_payroll_timer_card_integration.py`

### Integration Tests
- Test salary calculation endpoint with new schemas
- Test bulk salary calculation
- Test payroll processing
- Test export functionality (Excel & PDF)

### Verification Checklist
- [ ] All 100+ tests pass
- [ ] No import errors in entire codebase
- [ ] API endpoints return correct response types
- [ ] No breaking changes to external consumers

---

## Implementation Timeline

| Phase | Task | Effort | Risk |
|-------|------|--------|------|
| 1 | Examine payroll.py to map changes | 30 min | LOW |
| 2 | Update salary.py imports | 15 min | LOW |
| 3 | Update salary.py route signatures | 30 min | MEDIUM |
| 4 | Verify field name compatibility | 30 min | MEDIUM |
| 5 | Update payroll.py (same as salary) | 60 min | MEDIUM |
| 6 | Update service layers | 30 min | MEDIUM |
| 7 | Update __init__.py exports | 15 min | LOW |
| 8 | Delete legacy files | 5 min | LOW |
| 9 | Update and run tests | 90 min | MEDIUM |
| 10 | Integration testing | 45 min | MEDIUM |
| 11 | Code review and commit | 20 min | LOW |
| **TOTAL** | | **~6 hours** | **MEDIUM** |

---

## Risk Mitigation

### Before Making Changes
- [ ] Save current API response examples
- [ ] Document current field names and types
- [ ] Create detailed field mapping between schemas
- [ ] Verify no external consumers depend on exact response format

### During Implementation
- [ ] Make changes in small, testable chunks
- [ ] Run tests after each major change
- [ ] Keep git commits atomic and well-documented

### After Implementation
- [ ] Run full test suite
- [ ] Manually test each API endpoint
- [ ] Verify export functionality (Excel & PDF)
- [ ] Check database compatibility
- [ ] Deploy to staging for smoke testing

---

## Success Criteria

- ✅ All imports from salary.py and payroll.py removed from codebase
- ✅ All schemas use salary_unified definitions
- ✅ All 13 salary API routes work correctly
- ✅ All payroll API routes work correctly
- ✅ Export functionality (Excel/PDF) works
- ✅ All 100+ tests pass
- ✅ 448 lines of legacy code removed
- ✅ Single source of truth in salary_unified.py
- ✅ Zero breaking changes to API consumers

---

## Important Notes

### Why salary_unified is Better
1. **Comprehensive**: Covers all salary/payroll operations
2. **Well-documented**: Includes examples and field descriptions
3. **Type-safe**: Full Pydantic validation
4. **Future-proof**: Designed for expansion
5. **Already in use**: Services already importing from it

### Field Name Differences to Watch
- salary.py: `SalaryCalculate` → salary_unified: `SalaryCalculateRequest`
- salary.py: `SalaryBulkCalculate` → salary_unified: `SalaryBulkCalculateRequest`
- salary.py: `SalaryBulkResult` → salary_unified: `BulkCalculateResponse`
- Other fields appear to have same names (verify!)

### Potential Issues
- ⚠️ Response model types might have different field names
- ⚠️ Some optional vs required field differences
- ⚠️ Decimal vs int type differences
- ⚠️ Missing fields in legacy schemas that unified has

### Validation Approach
- Create test fixtures with sample data
- Compare old vs new schema outputs
- Ensure backward compatibility where possible
- Document any breaking changes

---

## Recommended Execution

**Day 1**: Research & Planning
- Examine payroll.py thoroughly
- Map all field differences
- Create test data fixtures

**Day 2**: Implementation
- Update salary.py (Phase 1)
- Update payroll.py (Phase 2)
- Update service layer (Phase 3)
- Delete legacy files (Phase 4)

**Day 3**: Testing & Verification
- Run tests (Phase 5)
- Fix any issues
- Final integration testing
- Documentation and commit

---

**Status**: Ready for execution
**Next Step**: Examine payroll.py to understand its structure and create detailed mapping
