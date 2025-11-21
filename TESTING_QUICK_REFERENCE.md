# Testing Quick Reference
**UNS-ClaudeJP Testing Commands**

## Frontend

### Unit Tests (Vitest)
```bash
cd frontend

npm run test                    # Run all tests
npm run test:watch              # Watch mode
npm run test -- --coverage      # With coverage
npm run test -- Button          # Specific test
npm run test -- --ui            # Interactive UI
```

### E2E Tests (Playwright)
```bash
cd frontend

npm run test:e2e                # Run all E2E tests
npm run test:e2e:ui             # Interactive mode
npm run test:e2e:headed         # See browser
npm run test:e2e:debug          # Debug mode
npm run test:e2e:report         # View report
```

### Quality Checks
```bash
npm run typecheck               # TypeScript check
npm run lint                    # ESLint
npm run format:check            # Prettier check
```

## Backend

### Unit & Integration Tests (Pytest)
```bash
cd backend

pytest                          # All tests
pytest -v                       # Verbose
pytest -m unit                  # Unit tests only
pytest -m integration           # Integration tests
pytest -m api                   # API tests only
pytest -m "not slow"            # Skip slow tests
pytest --cov=app                # With coverage
pytest --cov=app --cov-report=html  # HTML coverage
pytest -x                       # Stop on first failure
pytest -k "test_employee"       # Run specific tests
```

### Quality Checks
```bash
black --check app tests         # Format check
ruff check app tests            # Linting
mypy app                        # Type checking
```

## Coverage

### Frontend
```bash
cd frontend
npm run test -- --coverage
open coverage/index.html
```

### Backend
```bash
cd backend
pytest --cov=app --cov-report=html
open htmlcov/index.html
```

## CI/CD

Tests run automatically on:
- Push to main/develop/feat/fix branches
- Pull requests to main/develop

View results in GitHub Actions tab.

## Documentation

- **Main Guide:** `docs/TESTING_INFRASTRUCTURE_2025-11-21.md`
- **Quick Start:** `docs/testing/QUICK_START.md`
- **Writing Tests:** `docs/testing/WRITING_TESTS.md`
- **Deliverables:** `TESTING_INFRASTRUCTURE_DELIVERABLES.md`

## Getting Help

1. Check troubleshooting guide in main documentation
2. Review example tests in codebase
3. Consult testing best practices guide

---
**Last Updated:** 2025-11-21
