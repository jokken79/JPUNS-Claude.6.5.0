# Coding Standards - Start Here
## UNS-ClaudeJP v6.0.0

Welcome to the UNS-ClaudeJP coding standards documentation!

---

## Quick Navigation

### 📖 For Daily Development
**[Coding Standards Quick Summary](./CODING_STANDARDS_SUMMARY.md)**
- At-a-glance reference
- Common commands
- Quick patterns
- **Read this first!**

### 📚 For Comprehensive Reference
**[Full Coding Standards Guide](./CODING_STANDARDS_2025-11-21.md)**
- Complete standards (73KB, 2,809 lines)
- All code examples
- Detailed explanations
- Anti-patterns with solutions

### 📊 For Project Managers
**[Implementation Audit](./audits/CODING_STANDARDS_AUDIT_2025-11-21.md)**
- Coverage verification
- Compliance metrics
- Recommendations
- Action items

---

## What's Covered

### Backend (Python/FastAPI)
- Code organization and structure
- Naming conventions
- Type hints (mandatory)
- Database patterns (SQLAlchemy)
- API design (FastAPI)
- Testing (pytest)
- Security best practices
- Performance optimization

### Frontend (TypeScript/React/Next.js)
- Component patterns
- Type safety (strict mode)
- State management (Zustand)
- Styling (Tailwind CSS)
- Testing (Vitest + Playwright)
- Security (XSS, CSRF)
- Performance optimization

### General
- SOLID principles
- Clean code practices
- Git conventions (conventional commits)
- Code review guidelines
- Documentation standards
- Tool automation

---

## Quick Start for Developers

### 1. Read the Summary
Start with [CODING_STANDARDS_SUMMARY.md](./CODING_STANDARDS_SUMMARY.md) - takes 10 minutes

### 2. Set Up Tools

**Backend:**
```bash
cd backend
pip install -r requirements.txt
pip install -e ".[dev]"  # Install dev dependencies
pre-commit install       # Install git hooks
```

**Frontend:**
```bash
cd frontend
npm install
```

### 3. Run Quality Checks

**Backend:**
```bash
black backend/app
isort backend/app
mypy backend/app
pytest --cov=app
```

**Frontend:**
```bash
npm run format
npm run lint
npm run typecheck
npm test
```

### 4. Before Each Commit
- [ ] Code formatted
- [ ] Tests passing
- [ ] Type checking clean
- [ ] No console.log
- [ ] Commit message follows format

---

## Code Examples

### Python Function Template
```python
# backend/app/services/example_service.py
"""Service description."""
from __future__ import annotations

from typing import Optional
from sqlalchemy.orm import Session

def process_data(
    data: dict,
    db: Session,
    validate: bool = True
) -> Optional[Result]:
    """Process data with validation.
    
    Args:
        data: Input data to process
        db: Database session
        validate: Whether to validate input
    
    Returns:
        Processed result or None if validation fails
    
    Raises:
        ValidationError: If data is invalid
    """
    if validate:
        validate_data(data)
    
    result = perform_processing(data, db)
    return result
```

### TypeScript Component Template
```typescript
// frontend/components/example/ExampleCard.tsx
/**
 * Example card component displaying data.
 */
import { FC } from 'react';

interface ExampleCardProps {
  data: ExampleData;
  onAction: (id: number) => void;
}

export const ExampleCard: FC<ExampleCardProps> = ({ data, onAction }) => {
  // Hooks
  const [isExpanded, setIsExpanded] = useState(false);
  
  // Event handlers
  const handleClick = () => {
    setIsExpanded(!isExpanded);
  };
  
  // Early returns
  if (!data) {
    return <EmptyState />;
  }
  
  // Main render
  return (
    <div className="p-4 bg-white rounded-lg shadow">
      <h3 className="text-lg font-semibold">{data.title}</h3>
      <button onClick={handleClick}>Toggle</button>
    </div>
  );
};
```

---

## Common Commands

### Backend Quality Checks
```bash
# Format code
black backend/app && isort backend/app

# Check types
mypy backend/app

# Run tests with coverage
pytest --cov=app --cov-report=html

# Lint
flake8 backend/app
```

### Frontend Quality Checks
```bash
# Format code
npm run format

# Lint
npm run lint

# Type check
npm run typecheck

# Run all tests
npm test && npm run test:e2e
```

### Git Workflow
```bash
# Create feature branch
git checkout -b feature/UNS-123-description

# Commit with proper format
git commit -m "feat(scope): description - @software-engineering-expert"

# Before pushing
npm run lint && npm run typecheck && npm test
```

---

## Getting Help

### Documentation
1. **Quick Summary**: Fast reference for common patterns
2. **Full Guide**: Comprehensive standards with examples
3. **Audit Report**: Project compliance and recommendations

### Team Resources
- Code review checklist in Section 10
- Anti-patterns catalog in Section 8
- Quick reference card in Section 11

### Questions?
- Check the full guide for detailed explanations
- Review code examples in the main document
- Consult with team leads for clarifications

---

## Document Versions

| Document | Version | Date | Size | Lines |
|----------|---------|------|------|-------|
| Full Standards | 1.0.0 | 2025-11-21 | 73KB | 2,809 |
| Quick Summary | 1.0.0 | 2025-11-21 | - | - |
| Audit Report | 1.0.0 | 2025-11-21 | - | - |

---

## Key Principles

1. **Readability over cleverness**
2. **Type safety is mandatory**
3. **Testing is not optional**
4. **Security first, always**
5. **Performance matters**
6. **Documentation is code**

---

**Start with the summary, reference the guide, follow the standards!**

Happy coding! 🚀
