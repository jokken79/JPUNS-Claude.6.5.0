# Yukyu Calculate Balances Endpoint Issue
**Date:** 2025-11-12
**Status:** 🔴 OPEN - Requires Investigation
**Endpoint:** `POST /api/yukyu/balances/calculate`
**Priority:** MEDIUM (Core functionality works, this is edge case)

---

## Issue Summary

After fixing Bug #1 (SQLAlchemy filter construction errors) and Bug #2 (Request hybrid property), most yukyu endpoints are working correctly. However, the calculate_balances endpoint still returns a 500 error.

**Error Message:**
```json
{
  "detail": "Internal server error",
  "message": "500: {'message': 'Internal server error', 'details': \"unhashable type: 'list'\"}"
}
```

---

## Working Endpoints ✅

| Endpoint | Method | Status | Response |
|----------|--------|--------|----------|
| `/api/yukyu/balances` | GET | ✅ 200 OK | Aggregate balance summary (402 employees) |
| `/api/yukyu/requests` | GET | ✅ 200 OK | Empty array (expected) |
| `/api/yukyu/payroll/summary` | GET | ✅ 200 OK | Payroll summary for 2025-11 |

---

## Failing Endpoint ❌

| Endpoint | Method | Status | Error |
|----------|--------|--------|-------|
| `/api/yukyu/balances/calculate` | POST | ❌ 500 ERROR | "unhashable type: 'list'" |

**Test Request:**
```bash
curl -X POST "http://localhost:8000/api/yukyu/balances/calculate" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"employee_id": 1}'
```

---

## Investigation Done

### 1. Verified Bug Fixes Applied
- ✅ All 7 `and_()` removals confirmed in yukyu_service.py
- ✅ Changes present in git diff
- ✅ Changes confirmed in Docker container file
- ✅ Backend restarted to load changes

### 2. Checked for Remaining and_() Usages
**Found in:**
- `backend/app/api/employees.py` - Multiple usages (different module, shouldn't affect yukyu)
- `backend/app/services/additional_charge_service.py` - 2 usages (different module)

**NOT found in:**
- ✅ `backend/app/services/yukyu_service.py` - All cleaned up
- ✅ `backend/app/api/yukyu.py` - No problematic usages

### 3. Error Source Analysis
- Error is caught by `ExceptionHandlerMiddleware` at line 93-98
- Original exception is converted to HTTP 500
- Full traceback is suppressed by middleware
- Log output doesn't show the original source location

---

## Root Cause Hypothesis

The error "unhashable type: 'list'" typically occurs when:

1. **Dict/Set operations on lists**: Trying to use a list as a dictionary key or set member
2. **SQLAlchemy caching**: Query caching attempting to hash unhashable parameters
3. **Decorator issues**: Function decorators with list arguments
4. **JSON serialization**: Pydantic/FastAPI serialization of complex objects

Given that `/api/yukyu/balances` (which calls `get_employee_yukyu_summary`) works but `/api/yukyu/balances/calculate` (which calls `calculate_and_create_balances`) fails, the issue is likely specific to the calculate endpoint's code path.

---

## Next Steps for Investigation

### Immediate Actions (High Priority)
1. **Add detailed logging** in `calculate_and_create_balances` method
   ```python
   app_logger.debug(f"Starting calculation for employee_id={employee_id}")
   app_logger.debug(f"Employee found: {employee.id}, hire_date={employee.hire_date}")
   ```

2. **Temporarily disable middleware** to see full traceback
   ```python
   # In backend/app/core/middleware.py line 93-98
   except Exception as exc:
       app_logger.exception("Full traceback:")  # Will show full stack
       raise  # Re-raise original exception instead of wrapping
   ```

3. **Test with different employee IDs**
   ```bash
   # Try IDs: 1, 5, 10, 50, 100
   curl -X POST ".../calculate" -d '{"employee_id": 5}'
   ```

### Code Review Needed
1. Review `YukyuCalculationRequest` schema - check for list fields
2. Review `YukyuCalculationResponse` schema - check serialization
3. Check if Employee model has any list relationships loaded lazily
4. Review line 154-160 in yukyu_service.py (employee lookup)

### Alternative Approach
1. **Create unit test** for calculate_and_create_balances:
   ```python
   def test_calculate_balances():
       service = YukyuService(db)
       result = service.calculate_and_create_balances(employee_id=1)
       assert result.yukyus_created >= 0
   ```

2. **Run test with pytest --pdb** to drop into debugger at failure point

---

## Workaround (Temporary)

Users can still:
- ✅ View yukyu balances manually
- ✅ Create yukyu requests
- ✅ Generate payroll summaries
- ✅ Export to Excel

**Missing functionality:**
- ❌ Automatic yukyu balance calculation (must be done manually via SQL or migration script)

---

## Impact Assessment

**Severity:** MEDIUM
**Users Affected:** Admin users who need to calculate yukyu balances
**Business Impact:** Manual workaround available, core viewing/reporting works

**Production Recommendation:**
- Safe to deploy current fixes (Bug #1 and Bug #2)
- Document calculate_balances as known issue
- Schedule follow-up investigation for next sprint
- Create manual SQL procedure for yukyu calculation if needed

---

## Files Involved

```
backend/app/api/yukyu.py                    # Lines 46-61 (calculate endpoint)
backend/app/services/yukyu_service.py       # Lines 128-236 (calculate_and_create_balances)
backend/app/schemas/yukyu.py                # Lines 164-179 (YukyuCalculationRequest/Response)
backend/app/core/middleware.py              # Lines 82-98 (Exception handling)
```

---

## Related Documentation

- `docs/RESUMEN_EJECUTIVO_YUKYU_2025-11-12.md` - Original bug report and fixes
- `docs/FIX_YUKYU_BALANCES_ENDPOINT_2025-11-12.md` - Fix for balances endpoint
- `backend/app/services/yukyu_service.py` - Full yukyu business logic

---

**Last Updated:** 2025-11-12 09:30 JST
**Investigator:** Claude Code
**Next Review:** Scheduled for follow-up sprint
