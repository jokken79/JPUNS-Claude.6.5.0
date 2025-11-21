# Testing Infrastructure Guide
## UNS-ClaudeJP Comprehensive Testing Architecture
**Version:** 1.0.0  
**Date:** 2025-11-21  
**Status:** Production Ready

---

## Table of Contents

1. [Overview](#overview)
2. [Testing Philosophy](#testing-philosophy)
3. [Frontend Testing Architecture](#frontend-testing-architecture)
4. [Backend Testing Architecture](#backend-testing-architecture)
5. [CI/CD Testing Integration](#cicd-testing-integration)
6. [Test Data & Fixtures](#test-data--fixtures)
7. [Coverage & Metrics](#coverage--metrics)
8. [Best Practices](#best-practices)
9. [Troubleshooting](#troubleshooting)
10. [Quick Start](#quick-start)

---

## Overview

### Purpose
This document provides a comprehensive guide to the testing infrastructure for the UNS-ClaudeJP application, covering all aspects of quality assurance from unit tests to end-to-end workflows.

### Testing Tiers
```
┌─────────────────────────────────────────────────────────────┐
│                      Testing Pyramid                         │
├─────────────────────────────────────────────────────────────┤
│                                                               │
│                    E2E Tests (10%)                            │
│                  ▲ Slow, Expensive                            │
│               ┌─────────────────┐                             │
│              │  Playwright Tests │                            │
│              │  User Workflows   │                            │
│              └─────────────────┘                             │
│                                                               │
│              Integration Tests (30%)                          │
│            ▲ Moderate Speed & Cost                            │
│         ┌───────────────────────────┐                         │
│        │  API Tests                 │                         │
│        │  Service Integration       │                         │
│        │  Database Tests            │                         │
│        └───────────────────────────┘                         │
│                                                               │
│         Unit Tests (60%)                                      │
│      ▲ Fast, Cheap, Abundant                                  │
│   ┌─────────────────────────────────────┐                     │
│  │  Component Tests (React)             │                     │
│  │  Hook Tests                          │                     │
│  │  Utility Function Tests              │                     │
│  │  Service Layer Tests                 │                     │
│  └─────────────────────────────────────┘                     │
│                                                               │
└─────────────────────────────────────────────────────────────┘
```

### Technology Stack

**Frontend Testing:**
- **Vitest** - Unit and integration testing framework
- **React Testing Library** - Component testing with user-centric approach
- **Playwright** - Cross-browser E2E testing
- **@testing-library/jest-dom** - DOM matchers

**Backend Testing:**
- **Pytest** - Python testing framework
- **httpx** - Async HTTP client for API testing
- **Faker** - Test data generation
- **pytest-asyncio** - Async test support
- **pytest-cov** - Coverage reporting

**CI/CD:**
- **GitHub Actions** - Automated testing workflows
- **Codecov/Coveralls** - Coverage tracking
- **Pre-commit hooks** - Quality gates

---

## Testing Philosophy

### Core Principles

1. **Test Behavior, Not Implementation**
   - Focus on what the code does, not how it does it
   - Tests should survive refactoring
   - User-centric assertions

2. **Fast Feedback Loops**
   - Unit tests run in milliseconds
   - Quick local testing before commits
   - Parallel test execution in CI

3. **Reliable & Deterministic**
   - No flaky tests tolerated
   - Proper test isolation
   - Controlled test data

4. **Comprehensive Coverage**
   - Critical paths: 95%+ coverage
   - Overall: 80%+ coverage
   - Quality over quantity

5. **Maintainable Test Code**
   - DRY principle in tests
   - Shared fixtures and utilities
   - Clear test naming conventions

### Coverage Targets

| Test Type | Target Coverage | Priority |
|-----------|----------------|----------|
| Critical Business Logic | 95%+ | HIGH |
| API Endpoints | 90%+ | HIGH |
| Service Layer | 85%+ | HIGH |
| UI Components | 80%+ | MEDIUM |
| Utility Functions | 90%+ | MEDIUM |
| Integration Paths | 70%+ | MEDIUM |
| E2E Workflows | 40%+ | LOW |

---

## Frontend Testing Architecture

### 1. Unit Testing with Vitest

#### Configuration

**File:** `frontend/vitest.config.ts`

```typescript
import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import path from 'path';

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
        lines: 80,
        functions: 80,
        branches: 75,
        statements: 80
      }
    }
  },
  
  resolve: {
    alias: {
      '@': path.resolve(__dirname, '.'),
      '@/components': path.resolve(__dirname, 'components'),
      '@/lib': path.resolve(__dirname, 'lib'),
      '@/stores': path.resolve(__dirname, 'stores')
    }
  }
});
```

#### Setup File

**File:** `frontend/tests/setup.ts`

```typescript
import '@testing-library/jest-dom';
import { cleanup } from '@testing-library/react';
import { afterEach, vi } from 'vitest';

// Cleanup after each test
afterEach(() => {
  cleanup();
});

// Mock Next.js router
vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: vi.fn(),
    replace: vi.fn(),
    prefetch: vi.fn(),
  }),
  usePathname: () => '/',
  useSearchParams: () => new URLSearchParams(),
}));

// Mock environment variables
process.env.NEXT_PUBLIC_API_URL = 'http://localhost:8000';
```

#### Component Test Example

**File:** `frontend/components/Button/__tests__/Button.test.tsx`

```typescript
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { Button } from '../Button';

describe('Button Component', () => {
  it('renders with text', () => {
    render(<Button>Click me</Button>);
    expect(screen.getByText('Click me')).toBeInTheDocument();
  });

  it('handles click events', () => {
    const handleClick = vi.fn();
    render(<Button onClick={handleClick}>Click me</Button>);
    
    fireEvent.click(screen.getByText('Click me'));
    expect(handleClick).toHaveBeenCalledTimes(1);
  });

  it('can be disabled', () => {
    render(<Button disabled>Disabled</Button>);
    expect(screen.getByText('Disabled')).toBeDisabled();
  });

  it('supports different variants', () => {
    const { rerender } = render(<Button variant="primary">Primary</Button>);
    expect(screen.getByText('Primary')).toHaveClass('bg-blue-600');
    
    rerender(<Button variant="danger">Danger</Button>);
    expect(screen.getByText('Danger')).toHaveClass('bg-red-600');
  });
});
```

#### Hook Test Example

**File:** `frontend/hooks/__tests__/useDebounce.test.ts`

```typescript
import { renderHook, waitFor } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { useDebounce } from '../useDebounce';

describe('useDebounce', () => {
  it('debounces value changes', async () => {
    const { result, rerender } = renderHook(
      ({ value, delay }) => useDebounce(value, delay),
      { initialProps: { value: 'initial', delay: 500 } }
    );

    expect(result.current).toBe('initial');

    // Change value
    rerender({ value: 'updated', delay: 500 });
    
    // Value should not change immediately
    expect(result.current).toBe('initial');

    // Wait for debounce delay
    await waitFor(() => {
      expect(result.current).toBe('updated');
    }, { timeout: 600 });
  });
});
```

#### Store Test Example (Zustand)

**File:** `frontend/stores/__tests__/userStore.test.ts`

```typescript
import { renderHook, act } from '@testing-library/react';
import { describe, it, expect, beforeEach } from 'vitest';
import { useUserStore } from '../userStore';

describe('userStore', () => {
  beforeEach(() => {
    // Reset store before each test
    useUserStore.setState({ user: null, isLoading: false });
  });

  it('initializes with null user', () => {
    const { result } = renderHook(() => useUserStore());
    expect(result.current.user).toBeNull();
    expect(result.current.isLoading).toBe(false);
  });

  it('sets user', () => {
    const { result } = renderHook(() => useUserStore());
    const mockUser = { id: '1', name: 'Test User', email: 'test@example.com' };

    act(() => {
      result.current.setUser(mockUser);
    });

    expect(result.current.user).toEqual(mockUser);
  });

  it('clears user on logout', () => {
    const { result } = renderHook(() => useUserStore());
    const mockUser = { id: '1', name: 'Test User', email: 'test@example.com' };

    act(() => {
      result.current.setUser(mockUser);
    });
    expect(result.current.user).toEqual(mockUser);

    act(() => {
      result.current.logout();
    });
    expect(result.current.user).toBeNull();
  });
});
```

### 2. Component Testing with React Testing Library

#### Best Practices

1. **Query Priority:**
   ```typescript
   // ✅ Accessible queries (preferred)
   screen.getByRole('button', { name: /submit/i })
   screen.getByLabelText(/email/i)
   screen.getByPlaceholderText(/search/i)
   screen.getByText(/welcome/i)

   // ⚠️ Semantic queries (fallback)
   screen.getByAltText(/profile/i)
   screen.getByTitle(/close/i)

   // ❌ Avoid (brittle)
   screen.getByTestId('submit-button')
   ```

2. **User-Centric Assertions:**
   ```typescript
   // ✅ Good - tests what user sees
   expect(screen.getByText(/error/i)).toBeVisible()
   
   // ❌ Bad - tests implementation
   expect(component.state.hasError).toBe(true)
   ```

3. **Async Testing:**
   ```typescript
   // ✅ Wait for element to appear
   const element = await screen.findByText(/loaded/i)
   
   // ✅ Wait for element to disappear
   await waitForElementToBeRemoved(() => screen.getByText(/loading/i))
   
   // ✅ Wait for assertion
   await waitFor(() => {
     expect(screen.getByText(/success/i)).toBeInTheDocument()
   })
   ```

#### Complex Component Test Example

**File:** `frontend/components/EmployeeForm/__tests__/EmployeeForm.test.tsx`

```typescript
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi } from 'vitest';
import { EmployeeForm } from '../EmployeeForm';

describe('EmployeeForm', () => {
  const mockOnSubmit = vi.fn();
  
  beforeEach(() => {
    mockOnSubmit.mockClear();
  });

  it('renders all required fields', () => {
    render(<EmployeeForm onSubmit={mockOnSubmit} />);
    
    expect(screen.getByLabelText(/name/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/phone/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/position/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /submit/i })).toBeInTheDocument();
  });

  it('validates required fields', async () => {
    render(<EmployeeForm onSubmit={mockOnSubmit} />);
    
    const submitButton = screen.getByRole('button', { name: /submit/i });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText(/name is required/i)).toBeInTheDocument();
      expect(screen.getByText(/email is required/i)).toBeInTheDocument();
    });

    expect(mockOnSubmit).not.toHaveBeenCalled();
  });

  it('validates email format', async () => {
    const user = userEvent.setup();
    render(<EmployeeForm onSubmit={mockOnSubmit} />);
    
    const emailInput = screen.getByLabelText(/email/i);
    await user.type(emailInput, 'invalid-email');
    
    const submitButton = screen.getByRole('button', { name: /submit/i });
    await user.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText(/invalid email/i)).toBeInTheDocument();
    });
  });

  it('submits valid form data', async () => {
    const user = userEvent.setup();
    render(<EmployeeForm onSubmit={mockOnSubmit} />);
    
    await user.type(screen.getByLabelText(/name/i), 'John Doe');
    await user.type(screen.getByLabelText(/email/i), 'john@example.com');
    await user.type(screen.getByLabelText(/phone/i), '123-456-7890');
    await user.selectOptions(screen.getByLabelText(/position/i), 'Developer');
    
    await user.click(screen.getByRole('button', { name: /submit/i }));

    await waitFor(() => {
      expect(mockOnSubmit).toHaveBeenCalledWith({
        name: 'John Doe',
        email: 'john@example.com',
        phone: '123-456-7890',
        position: 'Developer'
      });
    });
  });

  it('displays loading state during submission', async () => {
    const user = userEvent.setup();
    const slowSubmit = vi.fn(() => new Promise(resolve => setTimeout(resolve, 1000)));
    
    render(<EmployeeForm onSubmit={slowSubmit} />);
    
    await user.type(screen.getByLabelText(/name/i), 'John Doe');
    await user.type(screen.getByLabelText(/email/i), 'john@example.com');
    await user.click(screen.getByRole('button', { name: /submit/i }));

    expect(screen.getByText(/submitting/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /submit/i })).toBeDisabled();
  });

  it('handles submission errors', async () => {
    const user = userEvent.setup();
    const failingSubmit = vi.fn(() => Promise.reject(new Error('Server error')));
    
    render(<EmployeeForm onSubmit={failingSubmit} />);
    
    await user.type(screen.getByLabelText(/name/i), 'John Doe');
    await user.type(screen.getByLabelText(/email/i), 'john@example.com');
    await user.click(screen.getByRole('button', { name: /submit/i }));

    await waitFor(() => {
      expect(screen.getByText(/server error/i)).toBeInTheDocument();
    });
  });
});
```

### 3. E2E Testing with Playwright

#### Configuration

**File:** `frontend/playwright.config.ts`

```typescript
import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './tests/e2e',
  timeout: 30 * 1000,
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  
  reporter: [
    ['html', { outputFolder: 'playwright-report' }],
    ['list'],
    ['json', { outputFile: 'playwright-results.json' }],
    ['junit', { outputFile: 'test-results/junit.xml' }]
  ],
  
  use: {
    baseURL: process.env.PLAYWRIGHT_BASE_URL || 'http://localhost:3000',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
    actionTimeout: 10000,
    navigationTimeout: 30000,
  },
  
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'firefox',
      use: { ...devices['Desktop Firefox'] },
    },
    {
      name: 'webkit',
      use: { ...devices['Desktop Safari'] },
    },
    {
      name: 'Mobile Chrome',
      use: { ...devices['Pixel 5'] },
    },
    {
      name: 'Mobile Safari',
      use: { ...devices['iPhone 12'] },
    },
  ],
  
  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:3000',
    reuseExistingServer: !process.env.CI,
    timeout: 120 * 1000,
  },
});
```

#### Page Object Model

**File:** `frontend/tests/e2e/pages/LoginPage.ts`

```typescript
import { Page, Locator } from '@playwright/test';

export class LoginPage {
  readonly page: Page;
  readonly emailInput: Locator;
  readonly passwordInput: Locator;
  readonly submitButton: Locator;
  readonly errorMessage: Locator;

  constructor(page: Page) {
    this.page = page;
    this.emailInput = page.getByLabel(/email/i);
    this.passwordInput = page.getByLabel(/password/i);
    this.submitButton = page.getByRole('button', { name: /sign in/i });
    this.errorMessage = page.getByRole('alert');
  }

  async goto() {
    await this.page.goto('/login');
  }

  async login(email: string, password: string) {
    await this.emailInput.fill(email);
    await this.passwordInput.fill(password);
    await this.submitButton.click();
  }

  async getErrorMessage() {
    return await this.errorMessage.textContent();
  }
}
```

**File:** `frontend/tests/e2e/pages/EmployeePage.ts`

```typescript
import { Page, Locator } from '@playwright/test';

export class EmployeePage {
  readonly page: Page;
  readonly createButton: Locator;
  readonly searchInput: Locator;
  readonly employeeTable: Locator;

  constructor(page: Page) {
    this.page = page;
    this.createButton = page.getByRole('button', { name: /create employee/i });
    this.searchInput = page.getByPlaceholder(/search employees/i);
    this.employeeTable = page.getByRole('table');
  }

  async goto() {
    await this.page.goto('/employees');
  }

  async createEmployee(data: {
    name: string;
    email: string;
    phone: string;
    position: string;
  }) {
    await this.createButton.click();
    
    await this.page.getByLabel(/name/i).fill(data.name);
    await this.page.getByLabel(/email/i).fill(data.email);
    await this.page.getByLabel(/phone/i).fill(data.phone);
    await this.page.getByLabel(/position/i).selectOption(data.position);
    
    await this.page.getByRole('button', { name: /submit/i }).click();
  }

  async searchEmployee(query: string) {
    await this.searchInput.fill(query);
  }

  async getEmployeeCount() {
    return await this.employeeTable.getByRole('row').count() - 1; // Exclude header
  }
}
```

#### E2E Test Example

**File:** `frontend/tests/e2e/employee-workflow.spec.ts`

```typescript
import { test, expect } from '@playwright/test';
import { LoginPage } from './pages/LoginPage';
import { EmployeePage } from './pages/EmployeePage';

test.describe('Employee Management Workflow', () => {
  let loginPage: LoginPage;
  let employeePage: EmployeePage;

  test.beforeEach(async ({ page }) => {
    loginPage = new LoginPage(page);
    employeePage = new EmployeePage(page);
    
    // Login before each test
    await loginPage.goto();
    await loginPage.login('admin@example.com', 'password123');
    await page.waitForURL('/dashboard');
  });

  test('should create new employee', async ({ page }) => {
    await employeePage.goto();
    
    const employeeData = {
      name: 'Jane Smith',
      email: 'jane.smith@example.com',
      phone: '555-0123',
      position: 'Developer'
    };

    await employeePage.createEmployee(employeeData);

    // Verify success message
    await expect(page.getByText(/employee created successfully/i)).toBeVisible();
    
    // Verify employee appears in table
    await employeePage.searchEmployee('Jane Smith');
    await expect(page.getByText('jane.smith@example.com')).toBeVisible();
  });

  test('should search employees', async ({ page }) => {
    await employeePage.goto();
    
    await employeePage.searchEmployee('John');
    
    // Wait for search results
    await page.waitForTimeout(500);
    
    const count = await employeePage.getEmployeeCount();
    expect(count).toBeGreaterThan(0);
  });

  test('should edit employee', async ({ page }) => {
    await employeePage.goto();
    
    // Click edit on first employee
    await page.getByRole('button', { name: /edit/i }).first().click();
    
    // Update phone number
    const phoneInput = page.getByLabel(/phone/i);
    await phoneInput.clear();
    await phoneInput.fill('555-9999');
    
    await page.getByRole('button', { name: /save/i }).click();
    
    // Verify update
    await expect(page.getByText(/updated successfully/i)).toBeVisible();
  });

  test('should delete employee', async ({ page }) => {
    await employeePage.goto();
    
    const initialCount = await employeePage.getEmployeeCount();
    
    // Click delete on first employee
    await page.getByRole('button', { name: /delete/i }).first().click();
    
    // Confirm deletion
    await page.getByRole('button', { name: /confirm/i }).click();
    
    // Verify deletion
    await expect(page.getByText(/deleted successfully/i)).toBeVisible();
    
    const newCount = await employeePage.getEmployeeCount();
    expect(newCount).toBe(initialCount - 1);
  });
});
```

#### Visual Regression Testing

**File:** `frontend/tests/e2e/visual-regression.spec.ts`

```typescript
import { test, expect } from '@playwright/test';

test.describe('Visual Regression Tests', () => {
  test('dashboard layout matches screenshot', async ({ page }) => {
    await page.goto('/dashboard');
    await page.waitForLoadState('networkidle');
    
    // Hide dynamic content
    await page.addStyleTag({
      content: `
        [data-testid="timestamp"],
        [data-testid="user-count"] {
          visibility: hidden !important;
        }
      `
    });
    
    await expect(page).toHaveScreenshot('dashboard.png', {
      fullPage: true,
      animations: 'disabled'
    });
  });

  test('employee list responsive design', async ({ page }) => {
    await page.goto('/employees');
    
    // Desktop
    await page.setViewportSize({ width: 1920, height: 1080 });
    await expect(page).toHaveScreenshot('employees-desktop.png');
    
    // Tablet
    await page.setViewportSize({ width: 768, height: 1024 });
    await expect(page).toHaveScreenshot('employees-tablet.png');
    
    // Mobile
    await page.setViewportSize({ width: 375, height: 667 });
    await expect(page).toHaveScreenshot('employees-mobile.png');
  });
});
```

### 4. Running Frontend Tests

```bash
# Unit tests
npm run test              # Run all unit tests
npm run test:watch        # Watch mode
npm run test -- --coverage # With coverage

# E2E tests
npm run test:e2e          # Run all E2E tests
npm run test:e2e:ui       # Interactive UI mode
npm run test:e2e:headed   # Headed mode (see browser)
npm run test:e2e:debug    # Debug mode
npm run test:e2e:report   # View test report

# Specific tests
npm run test Button       # Run Button tests
npm run test:e2e employee # Run employee E2E tests
```

---

## Backend Testing Architecture

### 1. Unit Testing with Pytest

#### Configuration

**File:** `backend/pytest.ini`

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
    -p no:cacheprovider
    --cov=app
    --cov-report=html
    --cov-report=term
    --cov-report=json

markers =
    slow: marks tests as slow
    integration: marks tests as integration tests
    unit: marks tests as unit tests
    api: marks tests as API endpoint tests
    service: marks tests as service layer tests
    db: marks tests that require database
    asyncio: marks tests as async

asyncio_mode = auto

log_cli = false
log_cli_level = INFO
log_cli_format = %(asctime)s [%(levelname)8s] %(message)s
log_cli_date_format = %Y-%m-%d %H:%M:%S
```

#### Conftest (Shared Fixtures)

**File:** `backend/tests/conftest.py`

```python
import pytest
import asyncio
from typing import AsyncGenerator, Generator
from httpx import AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession, create_async_engine
from sqlalchemy.orm import sessionmaker

from app.main import app
from app.database import Base, get_db
from app.config import settings

# Test database URL
TEST_DATABASE_URL = "postgresql+asyncpg://test:test@localhost:5432/test_db"

# Create test engine
test_engine = create_async_engine(TEST_DATABASE_URL, echo=False)
TestSessionLocal = sessionmaker(
    test_engine, class_=AsyncSession, expire_on_commit=False
)


@pytest.fixture(scope="session")
def event_loop() -> Generator:
    """Create event loop for async tests."""
    loop = asyncio.get_event_loop_policy().new_event_loop()
    yield loop
    loop.close()


@pytest.fixture(scope="function")
async def db_session() -> AsyncGenerator[AsyncSession, None]:
    """Create database session for tests."""
    async with test_engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    
    async with TestSessionLocal() as session:
        yield session
    
    async with test_engine.begin() as conn:
        await conn.run_sync(Base.metadata.drop_all)


@pytest.fixture(scope="function")
async def client(db_session: AsyncSession) -> AsyncGenerator[AsyncClient, None]:
    """Create test client."""
    async def override_get_db():
        yield db_session
    
    app.dependency_overrides[get_db] = override_get_db
    
    async with AsyncClient(app=app, base_url="http://test") as client:
        yield client
    
    app.dependency_overrides.clear()


@pytest.fixture
async def auth_headers(client: AsyncClient) -> dict:
    """Get authentication headers."""
    response = await client.post(
        "/api/auth/login",
        json={"email": "admin@example.com", "password": "admin123"}
    )
    token = response.json()["access_token"]
    return {"Authorization": f"Bearer {token}"}
```

#### Factory Fixtures

**File:** `backend/tests/factories.py`

```python
from faker import Faker
from typing import Dict, Any
from app.models import User, Employee, Candidate

fake = Faker()


class UserFactory:
    @staticmethod
    def create(db: AsyncSession, **kwargs) -> User:
        data = {
            "email": fake.email(),
            "username": fake.user_name(),
            "full_name": fake.name(),
            "hashed_password": "hashed_password",
            "is_active": True,
            **kwargs
        }
        user = User(**data)
        db.add(user)
        return user

    @staticmethod
    def build(**kwargs) -> Dict[str, Any]:
        return {
            "email": fake.email(),
            "username": fake.user_name(),
            "full_name": fake.name(),
            "password": "Password123!",
            **kwargs
        }


class EmployeeFactory:
    @staticmethod
    async def create(db: AsyncSession, **kwargs) -> Employee:
        data = {
            "name": fake.name(),
            "email": fake.email(),
            "phone": fake.phone_number(),
            "position": fake.job(),
            "department": fake.word(),
            "hire_date": fake.date_this_year(),
            **kwargs
        }
        employee = Employee(**data)
        db.add(employee)
        await db.commit()
        await db.refresh(employee)
        return employee

    @staticmethod
    def build(**kwargs) -> Dict[str, Any]:
        return {
            "name": fake.name(),
            "email": fake.email(),
            "phone": fake.phone_number(),
            "position": fake.job(),
            "department": fake.word(),
            **kwargs
        }


class CandidateFactory:
    @staticmethod
    async def create(db: AsyncSession, **kwargs) -> Candidate:
        data = {
            "name": fake.name(),
            "email": fake.email(),
            "phone": fake.phone_number(),
            "status": "applied",
            **kwargs
        }
        candidate = Candidate(**data)
        db.add(candidate)
        await db.commit()
        await db.refresh(candidate)
        return candidate

    @staticmethod
    def build(**kwargs) -> Dict[str, Any]:
        return {
            "name": fake.name(),
            "email": fake.email(),
            "phone": fake.phone_number(),
            "resume": fake.text(),
            **kwargs
        }
```

### 2. API Testing

**File:** `backend/tests/test_employee_api.py`

```python
import pytest
from httpx import AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession

from tests.factories import EmployeeFactory


@pytest.mark.api
class TestEmployeeAPI:
    
    @pytest.mark.asyncio
    async def test_create_employee(
        self, client: AsyncClient, auth_headers: dict
    ):
        """Test creating a new employee."""
        employee_data = EmployeeFactory.build()
        
        response = await client.post(
            "/api/employees",
            json=employee_data,
            headers=auth_headers
        )
        
        assert response.status_code == 201
        data = response.json()
        assert data["name"] == employee_data["name"]
        assert data["email"] == employee_data["email"]
        assert "id" in data

    @pytest.mark.asyncio
    async def test_get_employees(
        self, client: AsyncClient, db_session: AsyncSession, auth_headers: dict
    ):
        """Test retrieving employee list."""
        # Create test employees
        await EmployeeFactory.create(db_session, name="John Doe")
        await EmployeeFactory.create(db_session, name="Jane Smith")
        
        response = await client.get("/api/employees", headers=auth_headers)
        
        assert response.status_code == 200
        data = response.json()
        assert len(data["items"]) == 2
        assert data["total"] == 2

    @pytest.mark.asyncio
    async def test_get_employee_by_id(
        self, client: AsyncClient, db_session: AsyncSession, auth_headers: dict
    ):
        """Test retrieving a specific employee."""
        employee = await EmployeeFactory.create(db_session, name="John Doe")
        
        response = await client.get(
            f"/api/employees/{employee.id}",
            headers=auth_headers
        )
        
        assert response.status_code == 200
        data = response.json()
        assert data["id"] == employee.id
        assert data["name"] == "John Doe"

    @pytest.mark.asyncio
    async def test_update_employee(
        self, client: AsyncClient, db_session: AsyncSession, auth_headers: dict
    ):
        """Test updating an employee."""
        employee = await EmployeeFactory.create(db_session, name="John Doe")
        
        update_data = {"name": "John Updated", "phone": "555-9999"}
        response = await client.patch(
            f"/api/employees/{employee.id}",
            json=update_data,
            headers=auth_headers
        )
        
        assert response.status_code == 200
        data = response.json()
        assert data["name"] == "John Updated"
        assert data["phone"] == "555-9999"

    @pytest.mark.asyncio
    async def test_delete_employee(
        self, client: AsyncClient, db_session: AsyncSession, auth_headers: dict
    ):
        """Test deleting an employee."""
        employee = await EmployeeFactory.create(db_session)
        
        response = await client.delete(
            f"/api/employees/{employee.id}",
            headers=auth_headers
        )
        
        assert response.status_code == 204
        
        # Verify deletion
        get_response = await client.get(
            f"/api/employees/{employee.id}",
            headers=auth_headers
        )
        assert get_response.status_code == 404

    @pytest.mark.asyncio
    async def test_search_employees(
        self, client: AsyncClient, db_session: AsyncSession, auth_headers: dict
    ):
        """Test searching employees."""
        await EmployeeFactory.create(db_session, name="John Developer")
        await EmployeeFactory.create(db_session, name="Jane Designer")
        
        response = await client.get(
            "/api/employees?search=Developer",
            headers=auth_headers
        )
        
        assert response.status_code == 200
        data = response.json()
        assert len(data["items"]) == 1
        assert "Developer" in data["items"][0]["name"]

    @pytest.mark.asyncio
    async def test_pagination(
        self, client: AsyncClient, db_session: AsyncSession, auth_headers: dict
    ):
        """Test employee pagination."""
        # Create 25 employees
        for i in range(25):
            await EmployeeFactory.create(db_session)
        
        # Get first page
        response = await client.get(
            "/api/employees?page=1&limit=10",
            headers=auth_headers
        )
        
        assert response.status_code == 200
        data = response.json()
        assert len(data["items"]) == 10
        assert data["total"] == 25
        assert data["page"] == 1
        assert data["pages"] == 3

    @pytest.mark.asyncio
    async def test_validation_errors(
        self, client: AsyncClient, auth_headers: dict
    ):
        """Test validation errors."""
        invalid_data = {
            "name": "",  # Empty name
            "email": "invalid-email",  # Invalid email
        }
        
        response = await client.post(
            "/api/employees",
            json=invalid_data,
            headers=auth_headers
        )
        
        assert response.status_code == 422
        errors = response.json()["detail"]
        assert any(e["loc"] == ["body", "name"] for e in errors)
        assert any(e["loc"] == ["body", "email"] for e in errors)

    @pytest.mark.asyncio
    async def test_unauthorized_access(self, client: AsyncClient):
        """Test API requires authentication."""
        response = await client.get("/api/employees")
        assert response.status_code == 401
```

### 3. Service Layer Testing

**File:** `backend/tests/test_employee_service.py`

```python
import pytest
from sqlalchemy.ext.asyncio import AsyncSession

from app.services.employee_service import EmployeeService
from app.exceptions import NotFoundException, ValidationError
from tests.factories import EmployeeFactory


@pytest.mark.service
class TestEmployeeService:
    
    @pytest.mark.asyncio
    async def test_create_employee(self, db_session: AsyncSession):
        """Test creating an employee."""
        service = EmployeeService(db_session)
        employee_data = EmployeeFactory.build()
        
        employee = await service.create(employee_data)
        
        assert employee.id is not None
        assert employee.name == employee_data["name"]
        assert employee.email == employee_data["email"]

    @pytest.mark.asyncio
    async def test_create_duplicate_email(self, db_session: AsyncSession):
        """Test creating employee with duplicate email."""
        service = EmployeeService(db_session)
        await EmployeeFactory.create(db_session, email="duplicate@example.com")
        
        with pytest.raises(ValidationError, match="Email already exists"):
            await service.create(
                EmployeeFactory.build(email="duplicate@example.com")
            )

    @pytest.mark.asyncio
    async def test_get_by_id(self, db_session: AsyncSession):
        """Test retrieving employee by ID."""
        service = EmployeeService(db_session)
        created = await EmployeeFactory.create(db_session)
        
        employee = await service.get_by_id(created.id)
        
        assert employee.id == created.id
        assert employee.name == created.name

    @pytest.mark.asyncio
    async def test_get_nonexistent(self, db_session: AsyncSession):
        """Test retrieving nonexistent employee."""
        service = EmployeeService(db_session)
        
        with pytest.raises(NotFoundException, match="Employee not found"):
            await service.get_by_id(9999)

    @pytest.mark.asyncio
    async def test_update(self, db_session: AsyncSession):
        """Test updating an employee."""
        service = EmployeeService(db_session)
        employee = await EmployeeFactory.create(db_session, name="Original Name")
        
        updated = await service.update(employee.id, {"name": "Updated Name"})
        
        assert updated.name == "Updated Name"

    @pytest.mark.asyncio
    async def test_delete(self, db_session: AsyncSession):
        """Test deleting an employee."""
        service = EmployeeService(db_session)
        employee = await EmployeeFactory.create(db_session)
        
        await service.delete(employee.id)
        
        with pytest.raises(NotFoundException):
            await service.get_by_id(employee.id)

    @pytest.mark.asyncio
    async def test_search(self, db_session: AsyncSession):
        """Test searching employees."""
        service = EmployeeService(db_session)
        await EmployeeFactory.create(db_session, name="John Developer")
        await EmployeeFactory.create(db_session, name="Jane Designer")
        
        results = await service.search("Developer")
        
        assert len(results) == 1
        assert "Developer" in results[0].name
```

### 4. Database Testing

**File:** `backend/tests/test_employee_repository.py`

```python
import pytest
from sqlalchemy.ext.asyncio import AsyncSession

from app.repositories.employee_repository import EmployeeRepository
from tests.factories import EmployeeFactory


@pytest.mark.db
class TestEmployeeRepository:
    
    @pytest.mark.asyncio
    async def test_create(self, db_session: AsyncSession):
        """Test creating an employee."""
        repo = EmployeeRepository(db_session)
        employee_data = EmployeeFactory.build()
        
        employee = await repo.create(employee_data)
        
        assert employee.id is not None
        assert employee.name == employee_data["name"]

    @pytest.mark.asyncio
    async def test_get_by_id(self, db_session: AsyncSession):
        """Test retrieving by ID."""
        repo = EmployeeRepository(db_session)
        created = await EmployeeFactory.create(db_session)
        
        employee = await repo.get_by_id(created.id)
        
        assert employee.id == created.id

    @pytest.mark.asyncio
    async def test_get_all(self, db_session: AsyncSession):
        """Test retrieving all employees."""
        repo = EmployeeRepository(db_session)
        await EmployeeFactory.create(db_session)
        await EmployeeFactory.create(db_session)
        
        employees = await repo.get_all()
        
        assert len(employees) == 2

    @pytest.mark.asyncio
    async def test_update(self, db_session: AsyncSession):
        """Test updating an employee."""
        repo = EmployeeRepository(db_session)
        employee = await EmployeeFactory.create(db_session, name="Original")
        
        updated = await repo.update(employee.id, {"name": "Updated"})
        
        assert updated.name == "Updated"

    @pytest.mark.asyncio
    async def test_delete(self, db_session: AsyncSession):
        """Test deleting an employee."""
        repo = EmployeeRepository(db_session)
        employee = await EmployeeFactory.create(db_session)
        
        await repo.delete(employee.id)
        
        result = await repo.get_by_id(employee.id)
        assert result is None

    @pytest.mark.asyncio
    async def test_find_by_email(self, db_session: AsyncSession):
        """Test finding employee by email."""
        repo = EmployeeRepository(db_session)
        await EmployeeFactory.create(db_session, email="test@example.com")
        
        employee = await repo.find_by_email("test@example.com")
        
        assert employee is not None
        assert employee.email == "test@example.com"

    @pytest.mark.asyncio
    async def test_search(self, db_session: AsyncSession):
        """Test searching employees."""
        repo = EmployeeRepository(db_session)
        await EmployeeFactory.create(db_session, name="John Developer")
        await EmployeeFactory.create(db_session, name="Jane Designer")
        
        results = await repo.search("Developer")
        
        assert len(results) == 1
        assert "Developer" in results[0].name
```

### 5. Running Backend Tests

```bash
# All tests
pytest

# With coverage
pytest --cov=app --cov-report=html

# Specific markers
pytest -m unit          # Unit tests only
pytest -m integration   # Integration tests only
pytest -m api          # API tests only
pytest -m "not slow"   # Exclude slow tests

# Specific files
pytest tests/test_employee_api.py
pytest tests/test_employee_service.py

# Verbose output
pytest -v

# Stop on first failure
pytest -x

# Parallel execution
pytest -n auto

# Generate reports
pytest --html=report.html --self-contained-html
pytest --json-report --json-report-file=report.json
```

---

## CI/CD Testing Integration

### 1. Frontend Test Workflow

**File:** `.github/workflows/test-frontend.yml`

```yaml
name: Frontend Tests

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main, develop]

jobs:
  unit-tests:
    name: Unit Tests
    runs-on: ubuntu-latest
    
    steps:
      - uses: actions/checkout@v4
      
      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'
          cache-dependency-path: frontend/package-lock.json
      
      - name: Install dependencies
        working-directory: frontend
        run: npm ci
      
      - name: Run unit tests
        working-directory: frontend
        run: npm run test -- --coverage
      
      - name: Upload coverage
        uses: codecov/codecov-action@v3
        with:
          files: ./frontend/coverage/lcov.info
          flags: frontend-unit
          name: frontend-unit-coverage
      
      - name: Upload test results
        if: always()
        uses: actions/upload-artifact@v3
        with:
          name: frontend-unit-test-results
          path: frontend/coverage/
  
  e2e-tests:
    name: E2E Tests
    runs-on: ubuntu-latest
    
    services:
      postgres:
        image: postgres:15
        env:
          POSTGRES_DB: test_db
          POSTGRES_USER: test
          POSTGRES_PASSWORD: test
        options: >-
          --health-cmd pg_isready
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5
        ports:
          - 5432:5432
    
    steps:
      - uses: actions/checkout@v4
      
      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'
          cache-dependency-path: frontend/package-lock.json
      
      - name: Setup Python
        uses: actions/setup-python@v4
        with:
          python-version: '3.11'
      
      - name: Install frontend dependencies
        working-directory: frontend
        run: npm ci
      
      - name: Install backend dependencies
        working-directory: backend
        run: |
          pip install -e ".[dev]"
      
      - name: Install Playwright browsers
        working-directory: frontend
        run: npx playwright install --with-deps chromium
      
      - name: Start backend server
        working-directory: backend
        run: |
          uvicorn app.main:app --host 0.0.0.0 --port 8000 &
          sleep 5
      
      - name: Run migrations
        working-directory: backend
        run: alembic upgrade head
      
      - name: Start frontend server
        working-directory: frontend
        run: |
          npm run build
          npm run start &
          sleep 10
      
      - name: Run E2E tests
        working-directory: frontend
        run: npm run test:e2e
      
      - name: Upload Playwright report
        if: always()
        uses: actions/upload-artifact@v3
        with:
          name: playwright-report
          path: frontend/playwright-report/
      
      - name: Upload screenshots
        if: failure()
        uses: actions/upload-artifact@v3
        with:
          name: playwright-screenshots
          path: frontend/test-results/
```

### 2. Backend Test Workflow

**File:** `.github/workflows/test-backend.yml`

```yaml
name: Backend Tests

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main, develop]

jobs:
  unit-integration-tests:
    name: Unit & Integration Tests
    runs-on: ubuntu-latest
    
    services:
      postgres:
        image: postgres:15
        env:
          POSTGRES_DB: test_db
          POSTGRES_USER: test
          POSTGRES_PASSWORD: test
        options: >-
          --health-cmd pg_isready
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5
        ports:
          - 5432:5432
      
      redis:
        image: redis:7
        options: >-
          --health-cmd "redis-cli ping"
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5
        ports:
          - 6379:6379
    
    steps:
      - uses: actions/checkout@v4
      
      - name: Setup Python
        uses: actions/setup-python@v4
        with:
          python-version: '3.11'
          cache: 'pip'
      
      - name: Install dependencies
        working-directory: backend
        run: |
          pip install -e ".[dev,test]"
      
      - name: Run tests with coverage
        working-directory: backend
        env:
          DATABASE_URL: postgresql+asyncpg://test:test@localhost:5432/test_db
          REDIS_URL: redis://localhost:6379
        run: |
          pytest -v \
            --cov=app \
            --cov-report=html \
            --cov-report=xml \
            --cov-report=term \
            --html=report.html \
            --self-contained-html \
            --json-report \
            --json-report-file=report.json
      
      - name: Upload coverage to Codecov
        uses: codecov/codecov-action@v3
        with:
          files: ./backend/coverage.xml
          flags: backend
          name: backend-coverage
      
      - name: Upload test report
        if: always()
        uses: actions/upload-artifact@v3
        with:
          name: backend-test-report
          path: |
            backend/htmlcov/
            backend/report.html
            backend/report.json
      
      - name: Check coverage thresholds
        working-directory: backend
        run: |
          coverage report --fail-under=80
```

### 3. Combined Test Workflow

**File:** `.github/workflows/test-all.yml`

```yaml
name: All Tests

on:
  pull_request:
    branches: [main]

jobs:
  frontend:
    name: Frontend Tests
    uses: ./.github/workflows/test-frontend.yml

  backend:
    name: Backend Tests
    uses: ./.github/workflows/test-backend.yml

  coverage-report:
    name: Combined Coverage Report
    needs: [frontend, backend]
    runs-on: ubuntu-latest
    
    steps:
      - uses: actions/checkout@v4
      
      - name: Download frontend coverage
        uses: actions/download-artifact@v3
        with:
          name: frontend-unit-test-results
          path: frontend-coverage
      
      - name: Download backend coverage
        uses: actions/download-artifact@v3
        with:
          name: backend-test-report
          path: backend-coverage
      
      - name: Generate combined report
        run: |
          echo "## Test Coverage Summary" >> $GITHUB_STEP_SUMMARY
          echo "" >> $GITHUB_STEP_SUMMARY
          echo "### Frontend Coverage" >> $GITHUB_STEP_SUMMARY
          echo "See artifacts for detailed report" >> $GITHUB_STEP_SUMMARY
          echo "" >> $GITHUB_STEP_SUMMARY
          echo "### Backend Coverage" >> $GITHUB_STEP_SUMMARY
          echo "See artifacts for detailed report" >> $GITHUB_STEP_SUMMARY

  status-check:
    name: Status Check
    needs: [frontend, backend, coverage-report]
    runs-on: ubuntu-latest
    if: always()
    
    steps:
      - name: Check test results
        run: |
          if [ "${{ needs.frontend.result }}" != "success" ] || [ "${{ needs.backend.result }}" != "success" ]; then
            echo "Tests failed!"
            exit 1
          fi
          echo "All tests passed!"
```

### 4. Pre-commit Hook

**File:** `.husky/pre-commit`

```bash
#!/bin/sh
. "$(dirname "$0")/_/husky.sh"

echo "🔍 Running pre-commit checks..."

# Frontend checks
cd frontend

echo "📝 Checking TypeScript types..."
npm run typecheck || exit 1

echo "🎨 Checking code formatting..."
npm run format:check || exit 1

echo "🔎 Running linter..."
npm run lint || exit 1

echo "🧪 Running unit tests..."
npm run test -- --run --reporter=dot || exit 1

cd ..

# Backend checks (if Python files changed)
if git diff --cached --name-only | grep -q "backend/.*\.py$"; then
  cd backend
  
  echo "🐍 Checking Python types..."
  mypy app || exit 1
  
  echo "🎨 Checking Python formatting..."
  black --check app tests || exit 1
  
  echo "📏 Running Python linter..."
  ruff check app tests || exit 1
  
  echo "🧪 Running quick backend tests..."
  pytest -m unit --maxfail=1 -q || exit 1
  
  cd ..
fi

echo "✅ All pre-commit checks passed!"
```

---

## Test Data & Fixtures

### Frontend Fixtures

**File:** `frontend/tests/fixtures/api-responses.ts`

```typescript
export const mockUserResponse = {
  id: '1',
  email: 'test@example.com',
  full_name: 'Test User',
  is_active: true,
  created_at: '2025-01-01T00:00:00Z'
};

export const mockEmployeeResponse = {
  id: '1',
  name: 'John Doe',
  email: 'john@example.com',
  phone: '555-0123',
  position: 'Developer',
  department: 'Engineering',
  hire_date: '2024-01-01'
};

export const mockEmployeesListResponse = {
  items: [
    mockEmployeeResponse,
    {
      id: '2',
      name: 'Jane Smith',
      email: 'jane@example.com',
      phone: '555-0124',
      position: 'Designer',
      department: 'Design',
      hire_date: '2024-02-01'
    }
  ],
  total: 2,
  page: 1,
  pages: 1
};
```

**File:** `frontend/tests/utils/test-helpers.ts`

```typescript
import { ReactElement } from 'react';
import { render, RenderOptions } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

const createTestQueryClient = () => new QueryClient({
  defaultOptions: {
    queries: { retry: false },
    mutations: { retry: false }
  }
});

export const renderWithProviders = (
  ui: ReactElement,
  options?: RenderOptions
) => {
  const queryClient = createTestQueryClient();
  
  const Wrapper = ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  );

  return render(ui, { wrapper: Wrapper, ...options });
};

export const mockFetch = (data: any, status: number = 200) => {
  global.fetch = vi.fn(() =>
    Promise.resolve({
      ok: status >= 200 && status < 300,
      status,
      json: () => Promise.resolve(data)
    } as Response)
  );
};
```

### Backend Fixtures

**File:** `backend/tests/fixtures/database.py`

```python
import pytest
from typing import AsyncGenerator
from sqlalchemy.ext.asyncio import AsyncSession, create_async_engine
from sqlalchemy.orm import sessionmaker

from app.database import Base
from app.config import settings

TEST_DATABASE_URL = settings.TEST_DATABASE_URL or \
    "postgresql+asyncpg://test:test@localhost:5432/test_db"

test_engine = create_async_engine(TEST_DATABASE_URL, echo=False)
TestSessionLocal = sessionmaker(
    test_engine, class_=AsyncSession, expire_on_commit=False
)


@pytest.fixture(scope="function")
async def db_session() -> AsyncGenerator[AsyncSession, None]:
    """Create fresh database session for each test."""
    async with test_engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    
    async with TestSessionLocal() as session:
        yield session
        await session.rollback()
    
    async with test_engine.begin() as conn:
        await conn.run_sync(Base.metadata.drop_all)
```

**File:** `backend/tests/fixtures/api_client.py`

```python
import pytest
from typing import AsyncGenerator
from httpx import AsyncClient

from app.main import app


@pytest.fixture(scope="function")
async def client() -> AsyncGenerator[AsyncClient, None]:
    """Create test HTTP client."""
    async with AsyncClient(app=app, base_url="http://test") as client:
        yield client


@pytest.fixture
async def authenticated_client(client: AsyncClient) -> AsyncClient:
    """Create authenticated test client."""
    # Login to get token
    response = await client.post(
        "/api/auth/login",
        json={"email": "admin@example.com", "password": "admin123"}
    )
    token = response.json()["access_token"]
    
    # Add auth header
    client.headers.update({"Authorization": f"Bearer {token}"})
    return client
```

---

## Coverage & Metrics

### Coverage Configuration

**Frontend Coverage** (`vitest.config.ts`):
```typescript
coverage: {
  provider: 'v8',
  reporter: ['text', 'json', 'html', 'lcov'],
  thresholds: {
    lines: 80,
    functions: 80,
    branches: 75,
    statements: 80
  }
}
```

**Backend Coverage** (`pyproject.toml`):
```toml
[tool.coverage.run]
source = ["app"]
branch = true
parallel = true

[tool.coverage.report]
precision = 2
show_missing = true
skip_covered = false

[tool.coverage.html]
directory = "htmlcov"
```

### Coverage Targets by Component

| Component | Lines | Functions | Branches | Priority |
|-----------|-------|-----------|----------|----------|
| Auth System | 95% | 95% | 90% | CRITICAL |
| API Endpoints | 90% | 90% | 85% | HIGH |
| Business Logic | 85% | 85% | 80% | HIGH |
| UI Components | 80% | 80% | 75% | MEDIUM |
| Utilities | 90% | 90% | 85% | MEDIUM |
| E2E Workflows | 40% | N/A | N/A | LOW |

### Generating Reports

```bash
# Frontend
cd frontend
npm run test -- --coverage
open coverage/index.html

# Backend
cd backend
pytest --cov=app --cov-report=html
open htmlcov/index.html

# CI/CD integration
# Reports automatically uploaded to Codecov/Coveralls
```

---

## Best Practices

### 1. Test Naming Conventions

```typescript
// ✅ Good - Descriptive, follows pattern
describe('UserProfile Component', () => {
  it('displays user information correctly', () => {})
  it('handles edit button click', () => {})
  it('shows error state when fetch fails', () => {})
});

// ❌ Bad - Vague, unclear intent
describe('UserProfile', () => {
  it('works', () => {})
  it('test 1', () => {})
});
```

### 2. Arrange-Act-Assert Pattern

```typescript
it('creates new employee', async () => {
  // ARRANGE - Setup test data and conditions
  const employeeData = {
    name: 'John Doe',
    email: 'john@example.com'
  };
  
  // ACT - Perform the action being tested
  const response = await createEmployee(employeeData);
  
  // ASSERT - Verify the expected outcome
  expect(response.status).toBe(201);
  expect(response.data.name).toBe('John Doe');
});
```

### 3. Test Independence

```typescript
// ✅ Good - Each test is independent
describe('Employee Tests', () => {
  beforeEach(() => {
    // Fresh setup for each test
    mockDatabase.reset();
  });

  it('test 1', () => {
    // Independent test
  });

  it('test 2', () => {
    // Does not depend on test 1
  });
});

// ❌ Bad - Tests depend on each other
describe('Employee Tests', () => {
  let employee;

  it('creates employee', () => {
    employee = createEmployee(); // Sets shared state
  });

  it('updates employee', () => {
    updateEmployee(employee.id); // Depends on previous test
  });
});
```

### 4. Mock External Dependencies

```typescript
// ✅ Good - Mock external API
vi.mock('@/lib/api', () => ({
  fetchUser: vi.fn(() => Promise.resolve(mockUserData))
}));

// ✅ Good - Mock browser APIs
vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: vi.fn() })
}));

// ❌ Bad - No mocking, real API calls
it('fetches user', async () => {
  const user = await fetch('https://api.example.com/user'); // Real network call
});
```

### 5. Test Error States

```typescript
describe('Error Handling', () => {
  it('displays error message on API failure', async () => {
    // Mock API error
    vi.mocked(fetchUser).mockRejectedValue(new Error('Network error'));
    
    render(<UserProfile />);
    
    await waitFor(() => {
      expect(screen.getByText(/network error/i)).toBeVisible();
    });
  });

  it('handles validation errors', async () => {
    // Test validation
  });

  it('handles timeout scenarios', async () => {
    // Test timeouts
  });
});
```

### 6. Avoid Test Duplication

```typescript
// ✅ Good - Use test.each for similar tests
describe('Button variants', () => {
  test.each([
    ['primary', 'bg-blue-600'],
    ['secondary', 'bg-gray-600'],
    ['danger', 'bg-red-600']
  ])('%s variant has correct class', (variant, expectedClass) => {
    render(<Button variant={variant}>Click</Button>);
    expect(screen.getByRole('button')).toHaveClass(expectedClass);
  });
});

// ❌ Bad - Duplicated test code
it('primary has blue background', () => {
  render(<Button variant="primary">Click</Button>);
  expect(screen.getByRole('button')).toHaveClass('bg-blue-600');
});
it('secondary has gray background', () => {
  render(<Button variant="secondary">Click</Button>);
  expect(screen.getByRole('button')).toHaveClass('bg-gray-600');
});
```

---

## Troubleshooting

### Common Issues

#### 1. Flaky Tests

**Problem:** Tests pass/fail randomly

**Solutions:**
```typescript
// ✅ Use waitFor for async operations
await waitFor(() => {
  expect(screen.getByText(/loaded/i)).toBeInTheDocument();
});

// ✅ Use findBy queries (built-in waiting)
const element = await screen.findByText(/loaded/i);

// ❌ Avoid arbitrary timeouts
await new Promise(resolve => setTimeout(resolve, 1000));
```

#### 2. Slow Tests

**Problem:** Test suite takes too long

**Solutions:**
```bash
# Run tests in parallel
npm run test -- --reporter=dot  # Faster reporter
pytest -n auto  # Parallel backend tests

# Run only changed tests
npm run test -- --changed
pytest --testmon  # Track changes

# Skip slow tests in development
pytest -m "not slow"
```

#### 3. Import Errors

**Problem:** Module not found in tests

**Solutions:**
```typescript
// vitest.config.ts - Add path aliases
resolve: {
  alias: {
    '@': path.resolve(__dirname, '.'),
    '@/components': path.resolve(__dirname, 'components')
  }
}
```

#### 4. Database Test Issues

**Problem:** Database state pollution between tests

**Solutions:**
```python
@pytest.fixture(scope="function")
async def db_session():
    """Create fresh session for each test."""
    async with TestSessionLocal() as session:
        yield session
        await session.rollback()  # Rollback after test
```

#### 5. CI/CD Failures

**Problem:** Tests pass locally but fail in CI

**Solutions:**
```yaml
# Ensure consistent environment
- name: Set environment variables
  run: |
    echo "NODE_ENV=test" >> $GITHUB_ENV
    echo "CI=true" >> $GITHUB_ENV

# Use exact Node/Python versions
- uses: actions/setup-node@v4
  with:
    node-version: '20.x'  # Specific version
```

---

## Quick Start

### Initial Setup

```bash
# Frontend
cd frontend
npm install
npm run test              # Run unit tests
npm run test:e2e          # Run E2E tests

# Backend
cd backend
pip install -e ".[dev,test]"
pytest                    # Run all tests
pytest --cov=app         # With coverage
```

### Writing Your First Test

**Frontend Component Test:**
```typescript
// components/MyComponent/__tests__/MyComponent.test.tsx
import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { MyComponent } from '../MyComponent';

describe('MyComponent', () => {
  it('renders correctly', () => {
    render(<MyComponent title="Test" />);
    expect(screen.getByText('Test')).toBeInTheDocument();
  });
});
```

**Backend API Test:**
```python
# tests/test_my_endpoint.py
import pytest
from httpx import AsyncClient

@pytest.mark.api
@pytest.mark.asyncio
async def test_get_items(client: AsyncClient, auth_headers: dict):
    response = await client.get("/api/items", headers=auth_headers)
    assert response.status_code == 200
    assert len(response.json()) > 0
```

### Running Tests in CI

Tests run automatically on:
- Push to `main` or `develop`
- Pull requests
- Manual workflow dispatch

View results:
- GitHub Actions tab
- Codecov dashboard
- Test artifacts in workflow runs

---

## Appendix

### A. Testing Tools Reference

| Tool | Purpose | Documentation |
|------|---------|---------------|
| Vitest | Unit testing | https://vitest.dev |
| React Testing Library | Component testing | https://testing-library.com/react |
| Playwright | E2E testing | https://playwright.dev |
| Pytest | Python testing | https://pytest.org |
| httpx | Async HTTP client | https://www.python-httpx.org |

### B. Coverage Metrics Explained

- **Line Coverage**: Percentage of lines executed
- **Function Coverage**: Percentage of functions called
- **Branch Coverage**: Percentage of conditional branches taken
- **Statement Coverage**: Percentage of statements executed

### C. Test Markers Reference

**Backend Pytest Markers:**
```python
@pytest.mark.unit          # Fast, isolated tests
@pytest.mark.integration   # Tests with dependencies
@pytest.mark.api          # API endpoint tests
@pytest.mark.service      # Service layer tests
@pytest.mark.db           # Database tests
@pytest.mark.slow         # Long-running tests
@pytest.mark.asyncio      # Async tests
```

### D. Continuous Improvement

- Review coverage reports weekly
- Identify untested critical paths
- Refactor flaky tests immediately
- Update fixtures as models evolve
- Add integration tests for new features
- Monitor test execution times
- Retire obsolete tests

---

**Document Version:** 1.0.0  
**Last Updated:** 2025-11-21  
**Maintained By:** QA Team  
**Status:** Production Ready ✅

