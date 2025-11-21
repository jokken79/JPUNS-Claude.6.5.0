# Quick Start - Test Coverage Implementation

## Current State
- Backend: ~30% coverage (48 test files, 22 services untested)
- Frontend: ~5% coverage (16 E2E tests, ZERO unit tests)
- **Target: 80%+ overall**

## What You Got

### 1. Complete Documentation
- **TEST_COVERAGE_PLAN.md** - Full 200+ line implementation guide
- **IMPLEMENTATION_SUMMARY.md** - Quick reference
- **QUICK_START_TESTING.md** - This file

### 2. Ready-to-Use Test Examples (6 files)

#### Backend Tests (copy from TEST_COVERAGE_PLAN.md)
```
1. test_auth_service.py (90%+ coverage target)
   - Password hashing/verification
   - JWT token creation/validation
   - User authentication

2. test_notification_service.py (85%+ coverage target)
   - Email sending (SMTP)
   - LINE notifications
   - Error handling

3. test_payroll_edge_cases.py (95%+ coverage target)
   - Night shift premiums
   - Holiday pay calculations
   - Multiple deductions
   - Edge cases
```

#### Frontend Tests (copy from TEST_COVERAGE_PLAN.md)
```
1. auth-store.test.ts (90%+ coverage target)
   - Login/logout state
   - Cookie & localStorage
   - Permission cache clearing

2. SalaryReportFilters.test.tsx (85%+ coverage target)
   - Date filters
   - Checkbox toggles
   - Preset buttons
   - User interactions

3. OCRUploader.test.tsx (80%+ coverage target)
   - File upload & validation
   - Progress indicators
   - Error handling
   - Retry logic
```

### 3. Configuration Files
- `backend/pytest.ini.new` - Updated pytest config
- `frontend/vitest.config.ts.new` - NEW Vitest config
- `frontend/tests/setup.ts` - Test setup utilities

## Installation (5 minutes)

### Backend (already has pytest)
```bash
cd /home/user/UNS-ClaudeJP-6.0.0/backend
pip install pytest-cov pytest-timeout pytest-xdist
```

### Frontend (needs Vitest installation)
```bash
cd /home/user/UNS-ClaudeJP-6.0.0/frontend

# Install test dependencies
npm install --save-dev \
  vitest@^1.0.4 \
  @vitest/ui@^1.0.4 \
  @vitest/coverage-v8@^1.0.4 \
  @vitejs/plugin-react@^4.2.1 \
  @testing-library/react@^14.1.2 \
  @testing-library/jest-dom@^6.1.5 \
  @testing-library/user-event@^14.5.1 \
  jsdom@^23.0.1

# Copy config file
mv vitest.config.ts.new vitest.config.ts
```

### Add Frontend Package.json Scripts
```json
{
  "scripts": {
    "test": "vitest",
    "test:ui": "vitest --ui",
    "test:coverage": "vitest run --coverage",
    "test:watch": "vitest watch"
  }
}
```

## Run Your First Tests (2 minutes)

### Backend
```bash
cd /home/user/UNS-ClaudeJP-6.0.0/backend

# Run existing tests
pytest -v

# Run with coverage
pytest --cov=app --cov-report=html --cov-report=term-missing

# View coverage report
# Open coverage_html/index.html in browser
```

### Frontend (after creating first test)
```bash
cd /home/user/UNS-ClaudeJP-6.0.0/frontend

# Run tests
npm run test

# Run with coverage
npm run test:coverage

# Run with UI (interactive)
npm run test:ui
```

## Create Your First Test (10 minutes)

### Option 1: Copy Example Tests
All 6 test examples are in **TEST_COVERAGE_PLAN.md** sections 4.1-4.6.
Just copy-paste them into the appropriate directories.

### Option 2: Write Your Own
Use the examples as templates and adapt to your needs.

## Critical Gaps to Fill

### Backend Priority
1. **auth_service.py** - NO tests (authentication is critical!)
2. **notification_service.py** - NO tests (email/LINE)
3. **timer_card_ocr_service.py** - NO tests (Azure OCR)
4. **yukyu_service.py** - NO tests (vacation system)
5. **payroll_service.py** - Expand from 60% to 95%

### Frontend Priority
1. **ALL stores** - NO unit tests (only E2E)
   - auth-store.ts
   - payroll-store.ts
   - salary-store.ts
   - etc. (8 stores total)

2. **Critical components** - NO unit tests
   - SalaryReportFilters.tsx
   - OCRUploader.tsx
   - PayrollSummaryCard.tsx
   - EmployeeForm.tsx

## Commands Cheat Sheet

### Backend Testing
```bash
# Run all tests
pytest

# Run specific test file
pytest tests/test_auth_service.py -v

# Run with coverage
pytest --cov=app --cov-report=html

# Run only unit tests
pytest -m unit

# Run only integration tests
pytest -m integration

# Run in parallel
pytest -n auto

# Run with specific coverage threshold
pytest --cov=app --cov-fail-under=80
```

### Frontend Testing
```bash
# Run all tests
npm run test

# Run specific test file
npm run test -- auth-store.test.ts

# Run with coverage
npm run test:coverage

# Run in watch mode
npm run test:watch

# Run with UI
npm run test:ui

# Run E2E tests (existing)
npm run test:e2e
```

## Project Structure After Implementation

```
/home/user/UNS-ClaudeJP-6.0.0/
├── TEST_COVERAGE_PLAN.md           # Main documentation
├── IMPLEMENTATION_SUMMARY.md       # Summary
├── QUICK_START_TESTING.md          # This file
│
├── backend/
│   ├── pytest.ini                  # Updated config
│   ├── coverage_html/              # Coverage reports
│   └── tests/
│       ├── conftest.py             # Test fixtures
│       ├── test_auth_service.py    # NEW - Auth tests
│       ├── test_notification_service.py  # NEW
│       ├── test_payroll_edge_cases.py    # NEW
│       └── ... (45+ existing tests)
│
└── frontend/
    ├── vitest.config.ts            # NEW - Vitest config
    ├── package.json                # Updated with test scripts
    ├── coverage/                   # Coverage reports
    ├── tests/
    │   └── setup.ts               # NEW - Test utilities
    ├── stores/
    │   ├── auth-store.ts
    │   └── __tests__/
    │       └── auth-store.test.ts  # NEW
    └── components/
        ├── salary/
        │   ├── SalaryReportFilters.tsx
        │   └── __tests__/
        │       └── SalaryReportFilters.test.tsx  # NEW
        └── __tests__/
            └── OCRUploader.test.tsx  # NEW
```

## Coverage Targets

| Module | Current | Target | Priority |
|--------|---------|--------|----------|
| Backend auth_service | 0% | 90% | HIGH |
| Backend notification_service | 0% | 85% | HIGH |
| Backend payroll_service | 60% | 95% | HIGH |
| Backend OCR services | 0% | 80% | HIGH |
| Backend yukyu_service | 0% | 85% | HIGH |
| Backend other services | 0-50% | 70% | MEDIUM |
| Frontend stores | 0% | 85% | HIGH |
| Frontend critical components | 0% | 80% | HIGH |
| Frontend other components | 0% | 70% | MEDIUM |
| **Overall Backend** | **30%** | **85%** | - |
| **Overall Frontend** | **5%** | **75%** | - |
| **Combined** | **~30%** | **80%+** | - |

## 7-Week Implementation Roadmap

- **Week 1:** Setup (install deps, configs, first test)
- **Week 2:** Critical services (auth, notification, payroll, OCR, yukyu)
- **Week 3:** Frontend stores & critical components
- **Week 4:** Remaining backend services (17 services)
- **Week 5:** Frontend components (dashboard, forms, tables)
- **Week 6:** Integration & E2E expansion
- **Week 7:** CI/CD integration & documentation

## Success Criteria

- [ ] 80%+ overall test coverage
- [ ] 90%+ coverage on critical modules (auth, payroll)
- [ ] All tests pass in CI/CD
- [ ] Test execution time < 5 min (backend), < 3 min (frontend)
- [ ] Zero flaky tests (>99% consistency)
- [ ] All PRs require tests for new code
- [ ] Coverage reports automated in CI

## Common Issues & Solutions

### Issue: "Module not found" in Vitest
**Solution:** Check path aliases in vitest.config.ts match tsconfig.json

### Issue: "Cannot find module @testing-library"
**Solution:** Run `npm install --save-dev @testing-library/react @testing-library/jest-dom`

### Issue: Pytest not finding tests
**Solution:** Ensure test files match `test_*.py` pattern and are in `tests/` directory

### Issue: Mock not working
**Solution:** Import mock before the module being tested. Use `vi.mock()` for Vitest, `@patch()` for pytest

## Resources

- **Main Plan:** `/home/user/UNS-ClaudeJP-6.0.0/TEST_COVERAGE_PLAN.md`
- **Vitest Docs:** https://vitest.dev/
- **Testing Library:** https://testing-library.com/
- **Pytest Docs:** https://docs.pytest.org/
- **Coverage.py:** https://coverage.readthedocs.io/

## Next Actions

1. **Install dependencies** (5 min)
2. **Copy first test example** from TEST_COVERAGE_PLAN.md (5 min)
3. **Run the test** and verify it works (2 min)
4. **Review coverage gaps** in TEST_COVERAGE_PLAN.md (10 min)
5. **Start implementing** following 7-week roadmap

---

**Everything you need is in TEST_COVERAGE_PLAN.md - ready to implement!**

Questions? Check TEST_COVERAGE_PLAN.md sections:
- Section 4: Test Examples (ready to copy)
- Section 5: Configuration Files
- Section 7: Implementation Roadmap
- Appendix A: Quick Reference Commands
- Appendix B: Common Mock Patterns
