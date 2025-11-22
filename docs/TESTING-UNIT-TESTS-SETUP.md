# Unit Testing Setup Guide
**FASE 4 #9a: Testing Strategy - Unit Tests Setup**

## Overview

This document provides comprehensive guidance on unit testing for both backend (Python/pytest) and frontend (TypeScript/Vitest) components of the UNS-ClaudeJP system.

## Table of Contents

1. [Backend Unit Testing](#backend-unit-testing)
2. [Frontend Unit Testing](#frontend-unit-testing)
3. [Running Tests](#running-tests)
4. [Coverage Reports](#coverage-reports)
5. [Writing Tests](#writing-tests)
6. [Best Practices](#best-practices)
7. [Debugging Tests](#debugging-tests)
8. [CI/CD Integration](#cicd-integration)

---

## Backend Unit Testing

### Configuration

#### Pytest Configuration (`backend/pytest.ini`)

```ini
[pytest]
testpaths = tests
python_files = test_*.py
python_classes = Test*
python_functions = test_*

addopts =
    -v
    --strict-markers
    --tb=short
    --disable-warnings

markers =
    slow: marks tests as slow
    integration: marks integration tests
    unit: marks unit tests
    api: marks API endpoint tests
    service: marks service layer tests
    db: marks tests requiring database
    asyncio: marks async tests

asyncio_mode = auto
```

### Test Structure

```
backend/tests/
├── __init__.py
├── conftest.py              # Global fixtures
├── factories.py             # Test data factories
├── fixtures/                # Test data files
│   └── sample_timer_card_data.py
├── services/                # Service unit tests
│   ├── __init__.py
│   ├── test_auth_service.py
│   └── test_candidate_service.py
├── api/                     # API endpoint tests
│   └── __init__.py
└── utils/                   # Utility tests
```

### Fixtures and Factories

#### Global Fixtures (`conftest.py`)

Key fixtures available in all tests:

- **`db_engine`** - In-memory SQLite database engine
- **`db_session`** - Database session with automatic rollback
- **`app`** - FastAPI application instance
- **`client`** - FastAPI TestClient
- **`test_user`** - Regular test user
- **`admin_user`** - Admin test user
- **`auth_token`** - Valid JWT token for test user
- **`auth_headers`** - Authorization headers
- **`test_employee`** - Test employee record
- **`test_candidate`** - Test candidate record

#### Data Factories (`factories.py`)

Factory classes for generating test data:

- **`UserFactory`** - Create user data
  - `UserFactory.build()` - Regular user
  - `UserFactory.build_admin()` - Admin user

- **`EmployeeFactory`** - Create employee data
  - `EmployeeFactory.build()` - Single employee
  - `EmployeeFactory.build_batch(count=5)` - Multiple employees

- **`CandidateFactory`** - Create candidate data
- **`TimerCardFactory`** - Create timer card data
- **`PayrollFactory`** - Create payroll data
- **`ApartmentFactory`** - Create apartment data

### Example Service Test

```python
# backend/tests/services/test_auth_service.py

import pytest
from sqlalchemy.orm import Session
from app.services.auth_service import AuthService
from tests.factories import UserFactory

@pytest.mark.unit
class TestPasswordHashing:
    """Test password hashing and verification."""
    
    def test_hash_password(self):
        """Test password hashing produces valid bcrypt hash."""
        # Arrange
        password = "TestPassword123!"
        
        # Act
        hashed = AuthService.get_password_hash(password)
        
        # Assert
        assert hashed is not None
        assert hashed != password
        assert hashed.startswith("$2b$")
    
    def test_verify_password_correct(self):
        """Test password verification with correct password."""
        # Arrange
        password = "TestPassword123!"
        hashed = AuthService.get_password_hash(password)
        
        # Act
        result = AuthService.verify_password(password, hashed)
        
        # Assert
        assert result is True

@pytest.mark.unit
class TestUserAuthentication:
    """Test user authentication methods."""
    
    def test_authenticate_user_success(self, db_session: Session):
        """Test successful user authentication."""
        # Arrange
        user_data = UserFactory.build()
        # ... create user in database
        
        # Act
        authenticated_user = AuthService.authenticate_user(
            db=db_session,
            username=user_data["username"],
            password=user_data["password"]
        )
        
        # Assert
        assert authenticated_user is not None
```

### Running Backend Tests

```bash
# Run all tests
cd backend
pytest

# Run with coverage
pytest --cov=app --cov-report=html --cov-report=term

# Run specific test file
pytest tests/services/test_auth_service.py

# Run specific test class
pytest tests/services/test_auth_service.py::TestPasswordHashing

# Run specific test
pytest tests/services/test_auth_service.py::TestPasswordHashing::test_hash_password

# Run tests by marker
pytest -m unit                    # Only unit tests
pytest -m "unit and service"      # Unit tests in services
pytest -m "not slow"              # Exclude slow tests

# Run with verbose output
pytest -v

# Run with detailed output
pytest -vv

# Run failed tests only
pytest --lf
```

---

## Frontend Unit Testing

### Configuration

#### Vitest Configuration (`frontend/vitest.config.ts`)

```typescript
export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    setupFiles: ['./tests/setup.ts'],
    globals: true,
    
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html', 'lcov'],
      
      thresholds: {
        lines: 75,
        functions: 75,
        branches: 70,
        statements: 75
      },
      
      include: [
        'components/**/*.{ts,tsx}',
        'stores/**/*.{ts,tsx}',
        'hooks/**/*.{ts,tsx}',
        'lib/**/*.{ts,tsx}',
        'utils/**/*.{ts,tsx}'
      ]
    }
  }
});
```

### Test Structure

```
frontend/
├── __tests__/               # Unit tests
│   ├── components/
│   │   ├── Button.test.tsx
│   │   └── Input.test.tsx
│   ├── hooks/
│   │   └── use-toast.test.ts
│   └── stores/
│       └── auth-store.test.ts
├── tests/                   # Test utilities
│   ├── setup.ts            # Global test setup
│   ├── fixtures/           # Mock data
│   │   ├── api-responses.ts
│   │   └── component-props.ts
│   └── utils/              # Test helpers
│       └── test-helpers.ts
└── e2e/                    # E2E tests (separate)
```

### Test Utilities

#### Global Setup (`tests/setup.ts`)

Provides:
- Extended matchers from `@testing-library/jest-dom`
- Automatic cleanup after each test
- Mock implementations for:
  - Next.js router
  - `window.matchMedia`
  - `IntersectionObserver`
  - `localStorage` and `sessionStorage`

#### Test Helpers (`tests/utils/test-helpers.ts`)

Key utilities:

- **`createTestQueryClient()`** - Create QueryClient for tests
- **`renderWithProviders(ui, options)`** - Custom render with providers
- **`mockFetch(data, status)`** - Mock fetch responses
- **`mockFetchError(error)`** - Mock fetch errors
- **`createMockRouter(overrides)`** - Create mock Next.js router
- **`createMockFile(name, size, type)`** - Create mock File objects
- **`expectErrorMessage(getByText, message)`** - Assert error display

#### Mock Data Fixtures (`tests/fixtures/api-responses.ts`)

Pre-defined mock data:

- **`mockUser`** - User data
- **`mockEmployee`** - Employee data
- **`mockCandidate`** - Candidate data
- **`mockLoginResponse`** - Login response
- **`createMockEmployee(overrides)`** - Factory functions

### Example Component Test

```typescript
// __tests__/components/Input.test.tsx

import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';

describe('Input Component', () => {
  it('renders with label', () => {
    render(<Input name="username" label="Username" />);
    
    expect(screen.getByLabelText('Username')).toBeInTheDocument();
  });

  it('handles onChange events', () => {
    const handleChange = vi.fn();
    render(<Input name="username" onChange={handleChange} />);
    
    const input = screen.getByRole('textbox');
    fireEvent.change(input, { target: { value: 'newuser' } });
    
    expect(handleChange).toHaveBeenCalledTimes(1);
  });

  it('displays error message', () => {
    render(<Input name="email" error="Email is required" />);
    
    expect(screen.getByRole('alert')).toHaveTextContent('Email is required');
  });
});
```

### Example Hook Test

```typescript
// __tests__/hooks/use-toast.test.ts

import { renderHook, act } from '@testing-library/react';
import { describe, it, expect } from 'vitest';

describe('useToast Hook', () => {
  it('creates success toast', () => {
    const { result } = renderHook(() => useToast());

    act(() => {
      result.current.toast.success('Operation successful');
    });

    expect(result.current.toasts).toHaveLength(1);
    expect(result.current.toasts[0].type).toBe('success');
  });

  it('dismisses toast by ID', () => {
    const { result } = renderHook(() => useToast());

    let toastId: number;
    
    act(() => {
      toastId = result.current.toast.success('Toast to dismiss');
    });

    act(() => {
      result.current.toast.dismiss(toastId);
    });

    expect(result.current.toasts).toHaveLength(0);
  });
});
```

### Example Store Test

```typescript
// __tests__/stores/auth-store.test.ts

import { renderHook, act } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { mockFetch } from '@/tests/utils/test-helpers';
import { mockLoginResponse } from '@/tests/fixtures/api-responses';

describe('Auth Store', () => {
  it('successfully logs in user', async () => {
    mockFetch(mockLoginResponse);
    const { result } = renderHook(() => useAuthStore());

    await act(async () => {
      await result.current.login('test@example.com', 'password');
    });

    expect(result.current.isAuthenticated).toBe(true);
    expect(result.current.user).toEqual(mockLoginResponse.user);
  });

  it('clears user state on logout', () => {
    const { result } = renderHook(() => useAuthStore());

    act(() => {
      result.current.logout();
    });

    expect(result.current.user).toBeNull();
    expect(result.current.isAuthenticated).toBe(false);
  });
});
```

### Running Frontend Tests

```bash
# Run all tests
cd frontend
npm run test

# Run with coverage
npm run test -- --coverage

# Run in watch mode
npm run test -- --watch

# Run specific test file
npm run test -- __tests__/components/Input.test.tsx

# Run tests matching pattern
npm run test -- --testNamePattern="Input Component"

# Run with UI (interactive)
npm run test -- --ui

# Update snapshots
npm run test -- --update
```

---

## Coverage Reports

### Backend Coverage

```bash
# Generate HTML coverage report
cd backend
pytest --cov=app --cov-report=html

# Open coverage report
open htmlcov/index.html  # macOS
xdg-open htmlcov/index.html  # Linux
start htmlcov/index.html  # Windows

# Terminal coverage report
pytest --cov=app --cov-report=term

# Coverage by module
pytest --cov=app --cov-report=term-missing
```

**Coverage Targets:**
- Overall: 80%+
- Services: 85%+
- API endpoints: 80%+
- Models: 90%+

### Frontend Coverage

```bash
# Generate coverage report
cd frontend
npm run test -- --coverage

# View HTML report
open coverage/index.html

# Coverage summary in terminal
npm run test -- --coverage --reporter=verbose
```

**Coverage Targets:**
- Overall: 75%+
- Components: 80%+
- Hooks: 85%+
- Stores: 90%+
- Utilities: 80%+

---

## Writing Tests

### Test Structure (AAA Pattern)

All tests should follow the **Arrange-Act-Assert** pattern:

```python
def test_example():
    # Arrange - Set up test data and conditions
    user_data = UserFactory.build()
    service = AuthService()
    
    # Act - Execute the operation being tested
    result = service.authenticate_user(user_data)
    
    # Assert - Verify the expected outcome
    assert result is not None
    assert result.username == user_data["username"]
```

### Test Naming Conventions

**Backend:**
- File names: `test_<module_name>.py`
- Class names: `Test<Functionality>`
- Method names: `test_<behavior>`

```python
# test_auth_service.py
class TestPasswordHashing:
    def test_hash_password(self):
        pass
    
    def test_verify_password_correct(self):
        pass
```

**Frontend:**
- File names: `<Component>.test.tsx` or `<hook-name>.test.ts`
- Describe blocks: Component/Hook name
- Test names: Describe behavior

```typescript
describe('Input Component', () => {
  describe('Rendering', () => {
    it('renders with label', () => {});
  });
  
  describe('User Interactions', () => {
    it('handles onChange events', () => {});
  });
});
```

### Test Data

**Use Factories, Not Hardcoded Data:**

❌ Bad:
```python
def test_create_user():
    user = User(
        email="test@example.com",
        username="testuser",
        # ... 20 more fields
    )
```

✅ Good:
```python
def test_create_user():
    user_data = UserFactory.build()
    user = User(**user_data)
```

**Override Only What You Need:**

```python
# Override specific fields
user_data = UserFactory.build(
    email="specific@example.com",
    is_superuser=True
)
```

### Mocking

**Backend - Mock External Dependencies:**

```python
from unittest.mock import patch, MagicMock

def test_send_email(monkeypatch):
    # Mock external service
    mock_smtp = MagicMock()
    monkeypatch.setattr('smtplib.SMTP', mock_smtp)
    
    # Test email sending
    send_email("test@example.com", "Subject", "Body")
    
    assert mock_smtp.called
```

**Frontend - Mock API Calls:**

```typescript
import { mockFetch } from '@/tests/utils/test-helpers';

it('fetches user data', async () => {
  mockFetch({ id: 1, name: 'Test User' });
  
  const user = await fetchUser(1);
  
  expect(user.name).toBe('Test User');
});
```

---

## Best Practices

### 1. Test One Thing at a Time

❌ Bad - Testing multiple behaviors:
```python
def test_user_operations():
    # Creates user
    user = create_user(data)
    assert user.id
    
    # Updates user
    updated_user = update_user(user.id, new_data)
    assert updated_user.name == new_data["name"]
    
    # Deletes user
    delete_user(user.id)
    assert get_user(user.id) is None
```

✅ Good - Separate tests:
```python
def test_create_user():
    user = create_user(data)
    assert user.id is not None

def test_update_user():
    user = create_user(data)
    updated_user = update_user(user.id, new_data)
    assert updated_user.name == new_data["name"]

def test_delete_user():
    user = create_user(data)
    delete_user(user.id)
    assert get_user(user.id) is None
```

### 2. Use Descriptive Test Names

❌ Bad:
```python
def test_auth():
def test_1():
def test_user():
```

✅ Good:
```python
def test_authenticate_user_with_valid_credentials():
def test_authenticate_user_fails_with_invalid_password():
def test_authenticate_inactive_user_returns_false():
```

### 3. Avoid Test Interdependence

Tests should be independent and runnable in any order:

❌ Bad:
```python
# Test 2 depends on Test 1
def test_create_user():
    global user_id
    user = create_user(data)
    user_id = user.id

def test_update_user():
    # Uses user_id from previous test
    update_user(user_id, new_data)
```

✅ Good:
```python
def test_create_user():
    user = create_user(data)
    assert user.id is not None

def test_update_user():
    # Create its own user
    user = create_user(data)
    updated_user = update_user(user.id, new_data)
    assert updated_user.name == new_data["name"]
```

### 4. Test Edge Cases

```python
def test_division_by_zero():
    with pytest.raises(ZeroDivisionError):
        divide(10, 0)

def test_empty_list():
    result = process_list([])
    assert result == []

def test_null_input():
    result = process_data(None)
    assert result is None
```

### 5. Keep Tests Fast

- Use in-memory databases
- Mock external services
- Avoid sleep/delays
- Run tests in parallel when possible

```bash
# Backend - parallel execution
pytest -n auto

# Frontend - parallel by default
npm run test
```

---

## Debugging Tests

### Backend Debugging

**Print Debugging:**
```python
def test_example(capfd):
    print("Debug info:", user_data)
    result = function_under_test()
    captured = capfd.readouterr()
    print(captured.out)  # See print output
```

**Use pytest's `-s` flag:**
```bash
pytest -s tests/test_auth.py  # Show print statements
```

**Use `-vv` for verbose output:**
```bash
pytest -vv tests/test_auth.py
```

**Use `--pdb` to drop into debugger on failure:**
```bash
pytest --pdb tests/test_auth.py
```

**Run specific test in isolation:**
```bash
pytest tests/test_auth.py::TestAuth::test_login -v
```

### Frontend Debugging

**Use `screen.debug()`:**
```typescript
it('renders component', () => {
  render(<MyComponent />);
  screen.debug();  // Prints DOM tree
});
```

**Use `--reporter=verbose`:**
```bash
npm run test -- --reporter=verbose
```

**Run single test:**
```bash
npm run test -- __tests__/components/Input.test.tsx
```

**Use Vitest UI:**
```bash
npm run test -- --ui
```

**Check element queries:**
```typescript
// See all available queries
screen.logTestingPlaygroundURL();
```

---

## CI/CD Integration

### GitHub Actions Workflows

**Backend Tests (`.github/workflows/test-backend.yml`):**

```yaml
name: Backend Tests

on:
  push:
    paths:
      - 'backend/**'

jobs:
  unit-tests:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-python@v4
        with:
          python-version: '3.11'
      
      - name: Install dependencies
        run: |
          cd backend
          pip install -e ".[dev,test]"
      
      - name: Run tests with coverage
        run: |
          cd backend
          pytest --cov=app --cov-report=xml
      
      - name: Upload coverage
        uses: codecov/codecov-action@v3
        with:
          files: ./backend/coverage.xml
          flags: backend-unit
```

**Frontend Tests (`.github/workflows/test-frontend.yml`):**

```yaml
name: Frontend Tests

on:
  push:
    paths:
      - 'frontend/**'

jobs:
  unit-tests:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
      
      - name: Install dependencies
        run: |
          cd frontend
          npm ci
      
      - name: Run tests with coverage
        run: |
          cd frontend
          npm run test -- --coverage
      
      - name: Upload coverage
        uses: codecov/codecov-action@v3
        with:
          files: ./frontend/coverage/lcov.info
          flags: frontend-unit
```

---

## Quick Reference

### Backend Commands

```bash
# Run all tests
pytest

# Run with coverage
pytest --cov=app --cov-report=html

# Run specific markers
pytest -m unit
pytest -m "not slow"

# Run specific file
pytest tests/services/test_auth_service.py

# Verbose output
pytest -vv

# Stop on first failure
pytest -x

# Run failed tests
pytest --lf

# Parallel execution
pytest -n auto
```

### Frontend Commands

```bash
# Run all tests
npm run test

# Run with coverage
npm run test -- --coverage

# Watch mode
npm run test -- --watch

# UI mode
npm run test -- --ui

# Run specific file
npm run test -- __tests__/components/Input.test.tsx

# Update snapshots
npm run test -- --update
```

---

## Coverage Goals

### Current Coverage (Baseline)
- Backend: 45%
- Frontend: 40%

### Target Coverage (FASE 4 Goal)
- Backend: 80%+
- Frontend: 80%+

### Critical Paths (90%+ Required)
- Authentication (login, logout, token validation)
- Payment processing
- Data validation
- Security features

### Nice to Have (70%+)
- UI components
- Utility functions
- Helper modules

---

## Troubleshooting

### Common Issues

**Backend:**

1. **Import errors**
   ```bash
   # Install package in editable mode
   pip install -e .
   ```

2. **Database errors**
   ```python
   # Ensure fixtures are used correctly
   def test_example(db_session):  # Inject db_session
       # test code
   ```

3. **Async test failures**
   ```python
   # Mark async tests
   @pytest.mark.asyncio
   async def test_async_function():
       result = await async_function()
   ```

**Frontend:**

1. **Module not found**
   ```bash
   # Clear cache and reinstall
   rm -rf node_modules
   npm install
   ```

2. **React component errors**
   ```typescript
   // Import React
   import React from 'react';
   
   // Use renderWithProviders
   import { renderWithProviders } from '@/tests/utils/test-helpers';
   ```

3. **Async test timeouts**
   ```typescript
   // Increase timeout
   it('async test', async () => {
     // test code
   }, 10000); // 10 second timeout
   ```

---

## Resources

### Documentation
- [Pytest Documentation](https://docs.pytest.org/)
- [Vitest Documentation](https://vitest.dev/)
- [Testing Library](https://testing-library.com/)
- [FastAPI Testing](https://fastapi.tiangolo.com/tutorial/testing/)

### Internal Resources
- Backend tests: `/backend/tests/`
- Frontend tests: `/frontend/__tests__/`
- Test utilities: `/frontend/tests/utils/`
- Mock data: `/frontend/tests/fixtures/`

---

## Next Steps

After completing unit test setup:

1. **FASE 4 #9b**: Integration Testing
2. **FASE 4 #9c**: E2E Testing
3. **FASE 4 #9d**: Performance Testing
4. **Code review and refactoring**
5. **Continuous improvement**

---

**Last Updated:** 2025-01-22  
**Version:** 1.0  
**Status:** ✅ Complete
