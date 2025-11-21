# Coding Standards - Quick Summary
## UNS-ClaudeJP v6.0.0

**For full details, see:** [CODING_STANDARDS_2025-11-21.md](./CODING_STANDARDS_2025-11-21.md)

---

## At-a-Glance Reference

### Backend (Python/FastAPI)

**Naming:**
- Variables/Functions: `snake_case`
- Classes: `PascalCase`
- Constants: `UPPER_CASE`
- Private: `_private_method`

**Type Hints:**
- Mandatory on all functions
- Use `Optional`, `List`, `Dict` from `typing`
- Pydantic for schemas

**Code Style:**
- Line length: 100 chars (Black)
- Import order: future → stdlib → third-party → local (isort)
- Docstrings: Google style

**Testing:**
- Framework: pytest
- Coverage: >80% for critical modules
- Naming: `test_<function>_<scenario>`

**File Header:**
```python
# backend/app/services/employee_service.py
"""Module description."""
from __future__ import annotations
```

### Frontend (TypeScript/React/Next.js)

**Naming:**
- Components: `PascalCase` (EmployeeCard.tsx)
- Functions/variables: `camelCase`
- Constants: `UPPER_CASE`
- CSS classes: `kebab-case`

**Components:**
- Functional only (no class components)
- Props: TypeScript interfaces required
- Hooks at top, handlers next, render last

**Type Safety:**
- Strict mode enabled
- No `any` types (unless justified)
- Interfaces for all data structures

**Testing:**
- Unit: Vitest + React Testing Library
- E2E: Playwright
- Coverage: >80%

**File Header:**
```typescript
// frontend/components/employees/EmployeeCard.tsx
/**
 * Component description.
 */
```

### Git Conventions

**Commit Messages:**
```
<type>(<scope>): <subject> - @agent1 @agent2

Examples:
feat(employees): add creation form - @software-engineering-expert
fix(payroll): correct overtime calculation - @software-engineering-expert
docs(api): update endpoint docs - @documentation-specialist
```

**Branch Naming:**
```
feature/UNS-123-description
bugfix/UNS-456-description
hotfix/UNS-789-description
```

### Security Rules

**Backend:**
- Always validate input (Pydantic)
- Use parameterized queries (no string interpolation)
- JWT for authentication
- Environment variables for secrets

**Frontend:**
- React auto-escapes by default
- Avoid `dangerouslySetInnerHTML`
- CSRF tokens on state-changing requests
- Never log sensitive data

### Performance Guidelines

**Backend:**
- Use `joinedload()` to prevent N+1 queries
- Implement caching for frequently accessed data
- Async operations for I/O-bound tasks
- Index database columns used in WHERE/JOIN

**Frontend:**
- Code splitting with `lazy()` and `dynamic()`
- Memoize expensive computations with `useMemo()`
- Image optimization with Next.js `<Image>`
- Avoid unnecessary re-renders

### Common Mistakes to Avoid

**Backend:**
- ❌ Missing type hints
- ❌ N+1 query problems
- ❌ Hardcoded values
- ❌ God classes
- ❌ No error handling

**Frontend:**
- ❌ Prop drilling (use context/store)
- ❌ Over-memoization
- ❌ State duplication
- ❌ Giant components (>350 lines)
- ❌ Missing loading states

### Tool Commands

**Backend:**
```bash
# Format code
black backend/app
isort backend/app

# Type check
mypy backend/app

# Run tests
pytest --cov=app

# Lint
flake8 backend/app
```

**Frontend:**
```bash
# Format code
npm run format

# Lint
npm run lint

# Type check
npm run typecheck

# Run tests
npm test                  # Unit tests
npm run test:e2e         # E2E tests
```

### Code Review Priorities

1. **Functionality**: Does it work correctly?
2. **Security**: Is it safe?
3. **Performance**: Is it efficient?
4. **Type Safety**: Are types complete?
5. **Testing**: Is it tested?
6. **Readability**: Is it clear?

### Pre-Commit Checklist

- [ ] Code formatted (Black/Prettier)
- [ ] Imports organized (isort)
- [ ] Type hints complete (mypy/tsc)
- [ ] Tests written and passing
- [ ] No console.log or debugging code
- [ ] Documentation updated
- [ ] Commit message follows format

### File Size Limits

- **Maximum file size**: 350 lines
- **Preferred file size**: ~250 lines
- **Function size**: <50 lines
- **Nesting depth**: 2-3 levels max

### Required Documentation

**Python Functions:**
```python
def function_name(param: Type) -> ReturnType:
    """Short description.
    
    Args:
        param: Description
    
    Returns:
        Description
    
    Raises:
        ErrorType: When X happens
    """
    pass
```

**TypeScript Functions:**
```typescript
/**
 * Short description.
 * 
 * @param param - Description
 * @returns Description
 * @throws {ErrorType} When X happens
 */
function functionName(param: Type): ReturnType {
  // Implementation
}
```

### Testing Patterns

**Backend (pytest):**
```python
class TestEmployeeService:
    def test_create_employee_success(self, db_session):
        # Arrange
        data = EmployeeCreate(...)
        
        # Act
        result = service.create_employee(data)
        
        # Assert
        assert result.id is not None
```

**Frontend (Vitest):**
```typescript
describe('EmployeeCard', () => {
  it('renders employee information correctly', () => {
    // Arrange
    const mockEmployee = { id: 1, name: 'Test' };
    
    // Act
    render(<EmployeeCard employee={mockEmployee} />);
    
    // Assert
    expect(screen.getByText('Test')).toBeInTheDocument();
  });
});
```

### Anti-Pattern Examples

**❌ N+1 Queries:**
```python
# Bad
employees = db.query(Employee).all()
for emp in employees:
    print(emp.factory.name)  # Extra query each time!
```

**✅ Eager Loading:**
```python
# Good
employees = db.query(Employee).options(
    joinedload(Employee.factory)
).all()
for emp in employees:
    print(emp.factory.name)  # No extra queries
```

**❌ Prop Drilling:**
```typescript
// Bad: Passing through many levels
<A user={user}>
  <B user={user}>
    <C user={user} />
```

**✅ Context/Store:**
```typescript
// Good: Use store
const user = useUserStore((state) => state.user);
```

---

## Enforcement

### Automated
- Pre-commit hooks catch formatting issues
- CI/CD runs all linters and tests
- Type checking must pass
- Coverage must be >80%

### Manual
- All PRs require approval
- Code review checklist used
- Security review for critical changes

---

## Resources

- **Full Standards**: [CODING_STANDARDS_2025-11-21.md](./CODING_STANDARDS_2025-11-21.md)
- **Backend Config**: `/backend/pyproject.toml`
- **Frontend Config**: `/frontend/package.json`, `tsconfig.json`, `eslint.config.mjs`
- **Git Hooks**: `.pre-commit-config.yaml`

---

**Last Updated:** 2025-11-21  
**Version:** 1.0.0
