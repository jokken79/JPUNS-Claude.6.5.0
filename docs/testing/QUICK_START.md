# Testing Quick Start Guide
**UNS-ClaudeJP Testing Infrastructure**

## Getting Started in 5 Minutes

### Frontend Testing

#### 1. Install Dependencies
```bash
cd frontend
npm install
```

#### 2. Run Unit Tests
```bash
npm run test              # Run all tests
npm run test:watch        # Watch mode
npm run test -- Button    # Run specific test
```

#### 3. Run E2E Tests
```bash
npm run test:e2e          # Run all E2E tests
npm run test:e2e:ui       # Interactive mode
npm run test:e2e:headed   # See browser
```

#### 4. Check Coverage
```bash
npm run test -- --coverage
open coverage/index.html
```

### Backend Testing

#### 1. Install Dependencies
```bash
cd backend
pip install -e ".[dev,test]"
```

#### 2. Run Tests
```bash
pytest                    # All tests
pytest -m unit           # Unit tests only
pytest -m api            # API tests only
pytest --cov=app         # With coverage
```

#### 3. View Coverage
```bash
pytest --cov=app --cov-report=html
open htmlcov/index.html
```

## Writing Your First Test

### Frontend Component Test

Create `components/MyComponent/__tests__/MyComponent.test.tsx`:

```typescript
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

Run: `npm run test MyComponent`

### Backend API Test

Create `tests/test_my_endpoint.py`:

```python
import pytest
from httpx import AsyncClient

@pytest.mark.api
@pytest.mark.asyncio
async def test_get_items(client: AsyncClient, auth_headers: dict):
    response = await client.get("/api/items", headers=auth_headers)
    assert response.status_code == 200
    assert len(response.json()) > 0
```

Run: `pytest tests/test_my_endpoint.py`

## Common Commands

### Frontend
```bash
# Development
npm run test:watch        # Watch mode
npm run test -- --ui      # Vitest UI
npm run test:e2e:debug    # Debug E2E

# CI
npm run typecheck         # Type checking
npm run lint              # Linting
npm run test -- --coverage # Coverage
```

### Backend
```bash
# Development  
pytest -v                 # Verbose output
pytest -x                 # Stop on first failure
pytest -k "test_name"     # Run specific test

# CI
pytest --cov=app --cov-report=html
black --check app tests
ruff check app tests
mypy app
```

## Next Steps

1. Read the [Complete Testing Guide](../TESTING_INFRASTRUCTURE_2025-11-21.md)
2. Check [Writing Tests Guide](./WRITING_TESTS.md)
3. Learn [Debugging Tests](./DEBUGGING_TESTS.md)
4. Understand [CI/CD Tests](./CI_CD_TESTS.md)

## Troubleshooting

**Tests won't run:**
```bash
# Frontend
rm -rf node_modules package-lock.json
npm install

# Backend
rm -rf .venv
python -m venv .venv
source .venv/bin/activate
pip install -e ".[dev,test]"
```

**Import errors:**
- Check path aliases in `vitest.config.ts` (frontend)
- Check Python path in `pyproject.toml` (backend)

**Database errors:**
- Ensure PostgreSQL is running
- Check `DATABASE_URL` environment variable
- Run migrations: `alembic upgrade head`

**Need help?** See [Troubleshooting Guide](../TESTING_INFRASTRUCTURE_2025-11-21.md#troubleshooting)
