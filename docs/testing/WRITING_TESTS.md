# Writing Tests Guide
**UNS-ClaudeJP Best Practices for Test Development**

## Frontend Tests

### Component Tests (React Testing Library)

#### Best Practices

1. **Query by Accessibility**
```typescript
// ✅ Good - Accessible
screen.getByRole('button', { name: /submit/i })
screen.getByLabelText(/email/i)

// ❌ Bad - Implementation details
screen.getByTestId('submit-btn')
querySelector('.submit-button')
```

2. **User-Centric Assertions**
```typescript
// ✅ Good - Tests what user sees
expect(screen.getByText(/success/i)).toBeVisible()

// ❌ Bad - Tests internal state
expect(component.state.success).toBe(true)
```

3. **Async Handling**
```typescript
// ✅ Good - Proper async
const element = await screen.findByText(/loaded/i)

await waitFor(() => {
  expect(screen.getByText(/done/i)).toBeInTheDocument()
})

// ❌ Bad - Arbitrary timeout
await new Promise(r => setTimeout(r, 1000))
```

#### Complete Example

```typescript
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { UserForm } from '../UserForm';

describe('UserForm', () => {
  const mockOnSubmit = vi.fn();
  
  beforeEach(() => {
    mockOnSubmit.mockClear();
  });

  it('renders all fields', () => {
    render(<UserForm onSubmit={mockOnSubmit} />);
    
    expect(screen.getByLabelText(/name/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /submit/i })).toBeInTheDocument();
  });

  it('validates email format', async () => {
    const user = userEvent.setup();
    render(<UserForm onSubmit={mockOnSubmit} />);
    
    await user.type(screen.getByLabelText(/email/i), 'invalid');
    await user.click(screen.getByRole('button', { name: /submit/i }));
    
    await waitFor(() => {
      expect(screen.getByText(/invalid email/i)).toBeVisible();
    });
    expect(mockOnSubmit).not.toHaveBeenCalled();
  });

  it('submits valid data', async () => {
    const user = userEvent.setup();
    render(<UserForm onSubmit={mockOnSubmit} />);
    
    await user.type(screen.getByLabelText(/name/i), 'John Doe');
    await user.type(screen.getByLabelText(/email/i), 'john@example.com');
    await user.click(screen.getByRole('button', { name: /submit/i }));
    
    await waitFor(() => {
      expect(mockOnSubmit).toHaveBeenCalledWith({
        name: 'John Doe',
        email: 'john@example.com'
      });
    });
  });
});
```

### Hook Tests

```typescript
import { renderHook, act, waitFor } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { useCounter } from '../useCounter';

describe('useCounter', () => {
  it('increments counter', () => {
    const { result } = renderHook(() => useCounter(0));
    
    expect(result.current.count).toBe(0);
    
    act(() => {
      result.current.increment();
    });
    
    expect(result.current.count).toBe(1);
  });

  it('handles async operations', async () => {
    const { result } = renderHook(() => useCounter(0));
    
    act(() => {
      result.current.incrementAsync();
    });
    
    await waitFor(() => {
      expect(result.current.count).toBe(1);
    });
  });
});
```

### E2E Tests (Playwright)

#### Page Object Model

```typescript
// pages/LoginPage.ts
import { Page, Locator } from '@playwright/test';

export class LoginPage {
  readonly page: Page;
  readonly emailInput: Locator;
  readonly passwordInput: Locator;
  readonly submitButton: Locator;

  constructor(page: Page) {
    this.page = page;
    this.emailInput = page.getByLabel(/email/i);
    this.passwordInput = page.getByLabel(/password/i);
    this.submitButton = page.getByRole('button', { name: /sign in/i });
  }

  async goto() {
    await this.page.goto('/login');
  }

  async login(email: string, password: string) {
    await this.emailInput.fill(email);
    await this.passwordInput.fill(password);
    await this.submitButton.click();
  }
}
```

```typescript
// tests/auth.spec.ts
import { test, expect } from '@playwright/test';
import { LoginPage } from './pages/LoginPage';

test.describe('Authentication', () => {
  test('successful login', async ({ page }) => {
    const loginPage = new LoginPage(page);
    
    await loginPage.goto();
    await loginPage.login('user@example.com', 'password');
    
    await expect(page).toHaveURL('/dashboard');
    await expect(page.getByText(/welcome/i)).toBeVisible();
  });

  test('invalid credentials', async ({ page }) => {
    const loginPage = new LoginPage(page);
    
    await loginPage.goto();
    await loginPage.login('wrong@example.com', 'wrong');
    
    await expect(page.getByText(/invalid credentials/i)).toBeVisible();
  });
});
```

## Backend Tests

### API Tests

```python
import pytest
from httpx import AsyncClient
from tests.factories import EmployeeFactory


@pytest.mark.api
@pytest.mark.asyncio
async def test_create_employee(
    client: AsyncClient, 
    auth_headers: dict
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
    assert "id" in data


@pytest.mark.api
@pytest.mark.asyncio
async def test_get_employees(
    client: AsyncClient,
    db_session: AsyncSession,
    auth_headers: dict
):
    """Test retrieving employee list."""
    # Create test data
    await EmployeeFactory.create(db_session, name="John Doe")
    await EmployeeFactory.create(db_session, name="Jane Smith")
    
    response = await client.get("/api/employees", headers=auth_headers)
    
    assert response.status_code == 200
    data = response.json()
    assert len(data["items"]) == 2
```

### Service Layer Tests

```python
import pytest
from sqlalchemy.ext.asyncio import AsyncSession
from app.services.employee_service import EmployeeService
from app.exceptions import NotFoundException
from tests.factories import EmployeeFactory


@pytest.mark.service
@pytest.mark.asyncio
async def test_create_employee(db_session: AsyncSession):
    """Test creating an employee."""
    service = EmployeeService(db_session)
    employee_data = EmployeeFactory.build()
    
    employee = await service.create(employee_data)
    
    assert employee.id is not None
    assert employee.name == employee_data["name"]


@pytest.mark.service
@pytest.mark.asyncio
async def test_get_nonexistent(db_session: AsyncSession):
    """Test retrieving nonexistent employee."""
    service = EmployeeService(db_session)
    
    with pytest.raises(NotFoundException):
        await service.get_by_id(9999)
```

### Parametrized Tests

```python
@pytest.mark.parametrize("status,expected_count", [
    ("active", 2),
    ("inactive", 1),
    ("pending", 0),
])
@pytest.mark.asyncio
async def test_filter_by_status(
    db_session: AsyncSession,
    status: str,
    expected_count: int
):
    """Test filtering employees by status."""
    await EmployeeFactory.create(db_session, status="active")
    await EmployeeFactory.create(db_session, status="active")
    await EmployeeFactory.create(db_session, status="inactive")
    
    service = EmployeeService(db_session)
    employees = await service.filter_by_status(status)
    
    assert len(employees) == expected_count
```

## Test Organization

### File Structure

```
frontend/
  components/
    Button/
      Button.tsx
      __tests__/
        Button.test.tsx
    UserForm/
      UserForm.tsx
      __tests__/
        UserForm.test.tsx
  tests/
    e2e/
      auth.spec.ts
      employee-workflow.spec.ts
    fixtures/
      api-responses.ts
      component-props.ts
    utils/
      test-helpers.ts

backend/
  tests/
    test_employee_api.py
    test_employee_service.py
    test_employee_repository.py
    factories.py
    conftest.py
    fixtures/
      database.py
      api_client.py
```

### Naming Conventions

**Frontend:**
- Test files: `ComponentName.test.tsx` or `ComponentName.spec.ts`
- E2E files: `feature-name.spec.ts`
- Describe blocks: `describe('ComponentName', () => {})`
- Test names: `it('does something specific', () => {})`

**Backend:**
- Test files: `test_module_name.py`
- Test functions: `async def test_feature_behavior():`
- Test classes: `class TestFeatureName:`

## Test Data Management

### Frontend Fixtures

```typescript
// tests/fixtures/api-responses.ts
export const mockEmployee = {
  id: '1',
  name: 'John Doe',
  email: 'john@example.com',
  position: 'Developer'
};

export const createMockEmployee = (overrides = {}) => ({
  ...mockEmployee,
  ...overrides,
  id: overrides.id || Math.random().toString(36)
});
```

### Backend Factories

```python
# tests/factories.py
from faker import Faker

fake = Faker()

class EmployeeFactory:
    @staticmethod
    def build(**kwargs):
        return {
            "name": fake.name(),
            "email": fake.email(),
            "position": fake.job(),
            **kwargs
        }
    
    @staticmethod
    async def create(db: AsyncSession, **kwargs):
        data = EmployeeFactory.build(**kwargs)
        employee = Employee(**data)
        db.add(employee)
        await db.commit()
        await db.refresh(employee)
        return employee
```

## Mocking

### Frontend API Mocking

```typescript
import { vi } from 'vitest';
import { mockEmployee } from '../fixtures/api-responses';

// Mock module
vi.mock('@/lib/api', () => ({
  fetchEmployee: vi.fn(() => Promise.resolve(mockEmployee))
}));

// Use in test
it('displays employee data', async () => {
  render(<EmployeeProfile id="1" />);
  
  await waitFor(() => {
    expect(screen.getByText('John Doe')).toBeVisible();
  });
});
```

### Backend Service Mocking

```python
from unittest.mock import AsyncMock, patch

@pytest.mark.asyncio
async def test_with_mocked_service():
    """Test with mocked external service."""
    mock_service = AsyncMock()
    mock_service.get_data.return_value = {"key": "value"}
    
    with patch('app.services.external_service', mock_service):
        result = await function_using_service()
        assert result["key"] == "value"
```

## Coverage Goals

- Critical business logic: **95%+**
- API endpoints: **90%+**
- Service layer: **85%+**
- UI components: **80%+**
- Utilities: **90%+**

## Common Pitfalls to Avoid

1. ❌ Testing implementation details
2. ❌ Not cleaning up after tests
3. ❌ Tests depending on execution order
4. ❌ Hardcoded test data
5. ❌ Not testing error states
6. ❌ Overly complex test setup
7. ❌ Brittle selectors in E2E tests
8. ❌ Not using proper async/await

## Resources

- [React Testing Library Docs](https://testing-library.com/react)
- [Vitest Docs](https://vitest.dev)
- [Playwright Docs](https://playwright.dev)
- [Pytest Docs](https://pytest.org)
