# 🎯 Code Deduplication - Detailed Action Items

**Status**: 📋 Ready for Implementation
**Priority**: 🔴 High (Critical path issues identified)
**Date Created**: 2025-11-21

---

## Table of Contents
1. [Quick Checklist](#quick-checklist)
2. [Detailed Task Breakdown](#detailed-task-breakdown)
3. [Testing Plan](#testing-plan)
4. [Risk Assessment](#risk-assessment)

---

## Quick Checklist

### FASE 1: CRÍTICA Issues (Start Here)
- [ ] **PayrollService Consolidation**
  - [ ] Compare monolithic vs orchestrator implementations
  - [ ] Audit all imports across codebase
  - [ ] Create unit tests for orchestrator version
  - [ ] Merge missing features
  - [ ] Update all imports
  - [ ] Delete monolithic version
  - [ ] Full integration testing

- [ ] **AdditionalChargeForm Consolidation**
  - [ ] Identify all usage of both versions
  - [ ] Ensure modern version complete
  - [ ] Update all imports to modern version
  - [ ] Delete legacy version
  - [ ] UI/UX testing

### FASE 2: MODERADA Issues (Medium Priority)
- [ ] usePageVisibility Hook Standardization
- [ ] Database Pages Route Consolidation
- [ ] Zustand Store Factory Pattern
- [ ] Salary/Payroll Schemas Unification

### FASE 3: MENOR Issues (Can Parallelize)
- [ ] Models Organization Decision
- [ ] Salary/Payroll Endpoint Consolidation

---

## Detailed Task Breakdown

### CRITICAL PATH: PayrollService Consolidation

#### Task 1: Audit & Compare Implementations
**Effort**: 4-6 hours | **Risk**: 🟢 LOW

**Steps**:
1. Open both files side-by-side:
   ```bash
   # Terminal 1
   code /backend/app/services/payroll_service.py

   # Terminal 2
   code /backend/app/services/payroll/payroll_service.py
   ```

2. Create comparison matrix:
   - List all methods in monolithic version
   - List all methods in orchestrator version
   - Mark which methods exist in both
   - Mark which are unique to each
   - Note architectural differences

3. Document findings in `/docs/refactoring/payroll-service-audit.md`:
   ```markdown
   # Payroll Service Audit

   ## Methods Comparison
   - monolithic.calculate_salary() → orchestrator.calculate_salary()
   - monolithic.process_bonuses() → NOT IN ORCHESTRATOR (needs backport)
   - ...

   ## Architectural Differences
   - Monolithic: Single class with ~50 methods
   - Orchestrator: Factory pattern with specialized handlers
   ```

4. Identify critical missing features in orchestrator

**Validation**:
- ✅ Comparison document created
- ✅ All unique methods identified
- ✅ Missing features documented

---

#### Task 2: Enhance Orchestrator Version
**Effort**: 6-8 hours | **Risk**: 🟡 MEDIUM

**Steps**:
1. Add missing methods from monolithic to orchestrator
   ```python
   # Example: If monolithic has unique method, add to orchestrator
   class PayrollOrchestrator:
       def process_bonuses(self, employee_id: int, period: str) -> BonusResult:
           """Backported from monolithic version"""
           # Implementation
   ```

2. Create unit tests for all methods:
   ```bash
   # Create test file if not exists
   touch /backend/tests/unit/services/test_payroll_orchestrator.py

   # Write tests for each method
   # Target: 90%+ coverage
   ```

3. Compare behavior:
   - Run same inputs through both implementations
   - Verify outputs match
   - Document any behavioral differences
   - Resolve differences in favor of correct/newer implementation

4. Performance testing:
   ```bash
   # Benchmark orchestrator version
   pytest /backend/tests/unit/services/test_payroll_orchestrator.py --profile
   ```

**Validation**:
- ✅ All unique methods implemented
- ✅ Unit tests written (90%+ coverage)
- ✅ Behavioral consistency verified
- ✅ Performance acceptable

---

#### Task 3: Update All Imports
**Effort**: 2-3 hours | **Risk**: 🟢 LOW

**Steps**:
1. Find all imports of monolithic version:
   ```bash
   grep -r "from app.services.payroll_service import" /backend --include="*.py"
   grep -r "from app.services import payroll_service" /backend --include="*.py"
   ```

2. Document all occurrences:
   - `/backend/app/api/payroll.py` (line X)
   - `/backend/app/api/salary.py` (line Y)
   - Any other imports

3. Update each import:
   ```python
   # BEFORE
   from app.services.payroll_service import PayrollService

   # AFTER
   from app.services.payroll.payroll_service import PayrollOrchestrator
   ```

4. Update usage:
   ```python
   # BEFORE
   service = PayrollService()

   # AFTER
   service = PayrollOrchestrator()
   ```

5. Verify compilation:
   ```bash
   cd /backend && python -m py_compile app/api/*.py
   cd /backend && python -m pytest --collect-only  # No import errors
   ```

**Validation**:
- ✅ All imports updated
- ✅ No dangling references to monolithic version
- ✅ Code compiles without errors
- ✅ No import cycles detected

---

#### Task 4: Delete Monolithic Version
**Effort**: 0.5 hours | **Risk**: 🟢 LOW

**Steps**:
1. Backup (git handles this):
   ```bash
   # Git will preserve history
   git rm /backend/app/services/payroll_service.py
   ```

2. Verify no remaining imports:
   ```bash
   grep -r "payroll_service" /backend --include="*.py"
   # Should return 0 results
   ```

3. Commit:
   ```bash
   git commit -m "refactor: Remove monolithic PayrollService, use orchestrator pattern"
   ```

**Validation**:
- ✅ Monolithic version deleted
- ✅ No imports reference it
- ✅ Committed to git history

---

#### Task 5: Integration Testing
**Effort**: 4-5 hours | **Risk**: 🟡 MEDIUM

**Steps**:
1. Run all payroll tests:
   ```bash
   cd /backend
   pytest tests/integration/test_payroll_api.py -v
   pytest tests/integration/test_salary_api.py -v
   pytest tests/unit/services/test_payroll_orchestrator.py -v
   ```

2. Test endpoints manually:
   - POST /api/payroll/calculate
   - POST /api/payroll/process
   - GET /api/payroll/{id}
   - etc.

3. Verify database state:
   - Calculations correct
   - No orphaned records
   - Referential integrity maintained

4. Load testing (optional):
   ```bash
   # Test with realistic payroll volume
   k6 run tests/load/payroll_load_test.js
   ```

**Validation**:
- ✅ All tests pass
- ✅ Endpoints function correctly
- ✅ Database state valid
- ✅ Performance acceptable

---

### CRITICAL PATH: AdditionalChargeForm Consolidation

#### Task 1: Identify All Usage
**Effort**: 1-2 hours | **Risk**: 🟢 LOW

```bash
# Find all imports
grep -r "AdditionalChargeForm" /frontend --include="*.tsx" --include="*.ts"

# Expected output:
# apartments/AdditionalChargeForm.tsx (definition - KEEP)
# charges/AdditionalChargeForm.tsx (definition - DELETE)
# apartments/page.tsx (import from apartments/AdditionalChargeForm)
# dashboard/page.tsx (import from charges/AdditionalChargeForm)
# ... etc
```

**Document findings**:
- List all files importing legacy version
- List all files importing modern version
- Identify any version-specific customizations

---

#### Task 2: Verify Feature Parity
**Effort**: 2-3 hours | **Risk**: 🟢 LOW

Compare component props:

```typescript
// Legacy version props
interface AdditionalChargeFormProps {
  apartmentId: string;
  onSubmit: (data: any) => void;
  initialData?: any;
}

// Modern version props
interface AdditionalChargeFormProps {
  apartmentId: string;
  onSubmit: (data: ChargeFormData) => void;
  initialData?: Partial<ChargeFormData>;
  onCancel?: () => void;
}
```

Ensure modern version covers all use cases from legacy.

---

#### Task 3: Update All Imports
**Effort**: 2-3 hours | **Risk**: 🟢 LOW

```bash
# For each file importing legacy version:
# dashboard/page.tsx
# Before:
import AdditionalChargeForm from '@/components/charges/AdditionalChargeForm'

# After:
import AdditionalChargeForm from '@/components/apartments/AdditionalChargeForm'

# (or relocate to /components/forms/AdditionalChargeForm if desired)
```

---

#### Task 4: Delete Legacy Component
**Effort**: 0.5 hours | **Risk**: 🟢 LOW

```bash
git rm /frontend/components/charges/AdditionalChargeForm.tsx

# Clean up empty directory if needed
rmdir /frontend/components/charges/ 2>/dev/null || true

git commit -m "refactor: Remove legacy AdditionalChargeForm, use modern version"
```

---

#### Task 5: UI/UX Testing
**Effort**: 2-3 hours | **Risk**: 🟡 MEDIUM

```bash
# Start dev server
cd /frontend
npm run dev

# Manual testing checklist:
# [ ] Form renders correctly
# [ ] All input fields present
# [ ] Validation works (required fields, formats)
# [ ] Error messages display
# [ ] Submit button works
# [ ] Success feedback shown
# [ ] Cancel button works
# [ ] Form styling consistent with rest of app
# [ ] Mobile responsive
# [ ] Accessibility OK (keyboard navigation, screen readers)
```

---

## Testing Plan

### Unit Tests
```bash
# Backend
cd /backend
pytest tests/unit/ -v --cov=app/services --cov-report=html

# Frontend (if tests exist)
cd /frontend
npm run test -- --coverage
```

### Integration Tests
```bash
cd /backend
pytest tests/integration/ -v

# Frontend E2E (if configured)
cd /frontend
npm run test:e2e
```

### Manual Testing Checklist
- [ ] All affected workflows tested
- [ ] No broken links in UI
- [ ] Database integrity verified
- [ ] API responses valid
- [ ] Performance acceptable (no slowdown)
- [ ] Error handling works
- [ ] Logging captures issues

---

## Risk Assessment

### High Risk Areas
- **PayrollService changes**: Could affect financial calculations
  - Mitigation: Comprehensive testing, rollback plan ready

- **Database schema changes**: If schemas modified
  - Mitigation: Backup database, test restore procedure

### Medium Risk Areas
- **Route consolidation**: URL changes could break bookmarks
  - Mitigation: Add redirects, communicate to users

- **Component updates**: Visual changes to UI
  - Mitigation: Screenshot testing, user feedback period

### Low Risk Areas
- **Hook consolidation**: Isolated to specific features
  - Mitigation: Standard unit testing

---

## Success Criteria

Before considering remediation complete:

✅ **Code Quality**:
- [ ] Zero duplicate implementations remain
- [ ] All code follows style guide
- [ ] TypeScript strict mode passes
- [ ] No ESLint warnings

✅ **Testing**:
- [ ] 90%+ test coverage (critical code)
- [ ] All tests pass
- [ ] No known bugs introduced
- [ ] Performance metrics stable

✅ **Documentation**:
- [ ] CHANGELOG.md updated
- [ ] Code comments explain changes
- [ ] No broken links in docs
- [ ] User guide updated if needed

✅ **Git Hygiene**:
- [ ] Clean commit history
- [ ] Descriptive commit messages
- [ ] No large files added
- [ ] All changes reviewed

---

## Communication Plan

### When to Update Stakeholders
1. **Before Starting**: Notify of deduplication plan
2. **Phase 1 Completion**: Report on CRÍTICA fixes
3. **Phase 2 Completion**: Report on MODERADA fixes
4. **Final**: List all improvements and metrics

### What to Communicate
- Summary of changes
- Why changes were needed
- What users/developers need to know
- Any breaking changes or deprecations

---

## Estimated Timeline

| Phase | Issues | Est. Hours | Weeks |
|-------|--------|-----------|-------|
| 1 (CRÍTICA) | 2 | 40-50 | 1.5-2 |
| 2 (MODERADA) | 4 | 45-60 | 2-3 |
| 3 (MENOR) | 2 | 12-18 | 1 |
| **TOTAL** | **8** | **97-128** | **4-6** |

---

## Next Steps

1. ✅ Prioritize CRÍTICA issues (do first)
2. ✅ Create feature branches for each task
3. ✅ Write tests BEFORE refactoring (TDD)
4. ✅ Get code reviews
5. ✅ Merge to main
6. ✅ Deploy and monitor
7. ✅ Document lessons learned

---

**Created**: 2025-11-21
**Status**: Ready for team assignment
**Contact**: Development Lead
