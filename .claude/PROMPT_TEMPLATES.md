# 📝 Prompt Templates - Ready to Use

**Pre-crafted prompts for common tasks across all AI types**

---

## 🎯 How to Use This File

Each template is designed to be copied and pasted directly. Fill in the `[PLACEHOLDER]` sections with your specific details.

---

## 🚀 Claude Code (Orchestrator) Templates

### Template 1: New Feature Request

```markdown
I need to implement [FEATURE_NAME] in the UNS-ClaudeJP HR system.

Requirements:
- [Requirement 1]
- [Requirement 2]
- [Requirement 3]

Constraints:
- Must use [TECHNOLOGY]
- Must follow [PATTERN]
- Performance: [REQUIREMENT]

This involves:
1. Backend API endpoint(s)
2. Database schema changes
3. Frontend UI component(s)
4. Tests

Should I proceed with orchestrating this implementation?
```

### Template 2: Bug Fix Request

```markdown
I found a bug in the [MODULE] feature.

Bug description:
- Symptom: [What happens]
- Expected: [What should happen]
- Steps to reproduce:
  1. [Step 1]
  2. [Step 2]
  3. [Step 3]

Affected files:
- [File 1]
- [File 2]

Please investigate and fix this bug.
```

### Template 3: Performance Optimization

```markdown
The [FEATURE/PAGE] is performing poorly.

Current performance:
- Load time: [X] ms
- Database queries: [N]
- Bundle size: [X] KB

Target performance:
- Load time: [X] ms
- Single database query
- Bundle size: [X] KB

Root cause (if known):
- [Cause 1]
- [Cause 2]

Please optimize this following best practices.
```

### Template 4: Refactoring Request

```markdown
I want to refactor [COMPONENT/MODULE] to improve [ASPECT].

Current state:
- [Description of current code]
- [Issues with current approach]

Desired state:
- [How it should work]
- [Benefits of refactoring]

Should I proceed?
```

### Template 5: Architecture Question

```markdown
I'm designing [FEATURE] and need architectural guidance.

Context:
- Using [TECH_STACK]
- Current architecture: [DESCRIPTION]
- Constraints: [LIST]

Question: Should I use [OPTION_A] or [OPTION_B]?

Considerations:
- Performance: [REQUIREMENT]
- Scalability: [REQUIREMENT]
- Maintainability: [REQUIREMENT]

What's your recommendation?
```

---

## 💬 ChatGPT / Claude.ai (Consultant) Templates

### Template 1: Architecture Review

```markdown
I'm building a Japanese HR system with Next.js 16 + FastAPI + PostgreSQL.

I need to implement [FEATURE_NAME].

Requirements:
- [Requirement 1]
- [Requirement 2]
- [Requirement 3]

My current approach:
[Your idea]

Please review and suggest:
1. Whether this approach is good
2. Alternative architectures
3. Potential issues to watch for
4. Code patterns to follow

Show code examples for each approach.
```

### Template 2: Code Review Request

```markdown
I have the following code (from [FILE]):

[PASTE CODE]

Questions:
1. Is this following best practices?
2. Are there security issues?
3. Could this be more performant?
4. Should this be refactored?

What would you improve?
```

### Template 3: Learning Request

```markdown
I want to understand how to implement [FEATURE] in [TECHNOLOGY].

Specifically:
- How does [CONCEPT 1] work?
- When should I use [PATTERN 1] vs [PATTERN 2]?
- What are common pitfalls?

Can you:
1. Explain the concepts
2. Show code examples
3. Explain the tradeoffs
4. Suggest best practices
```

### Template 4: Troubleshooting Help

```markdown
I'm getting this error: [ERROR_MESSAGE]

Context:
- What I was trying to do: [DESCRIPTION]
- What I expected: [EXPECTATION]
- What actually happened: [ACTUAL]
- Relevant code:
  [CODE]

Steps I've already tried:
1. [Attempted solution 1]
2. [Attempted solution 2]

What should I try next?
```

### Template 5: Design Pattern Question

```markdown
I need to implement [FEATURE] in my Next.js/FastAPI application.

Current constraints:
- [Constraint 1]
- [Constraint 2]

I'm considering these approaches:

Option A:
[Description]
Pros: [List]
Cons: [List]

Option B:
[Description]
Pros: [List]
Cons: [List]

Which would you recommend and why?
```

---

## 🔧 Gemini CLI / Code Generator Templates

### Template 1: Generate API Endpoint

```
Generate a FastAPI CRUD endpoint for the [TABLE_NAME] table:

Model: [MODEL_NAME] (from backend/app/models/models.py)
Actions: [CREATE/READ/UPDATE/DELETE/LIST]
Validation rules:
  - [Rule 1]
  - [Rule 2]
  - [Rule 3]

Requirements:
- Use dependency injection pattern
- Include error handling
- Add validation with Pydantic
- Follow FastAPI 0.115.6 patterns
- Include docstrings
```

### Template 2: Generate React Component

```
Generate a React component for [FEATURE]:

Component name: [COMPONENT_NAME]
Purpose: [DESCRIPTION]
Props:
  - [Prop 1]: [Type]
  - [Prop 2]: [Type]
  - [Prop 3]: [Type]

Features:
- [Feature 1]
- [Feature 2]
- [Feature 3]

Style: Use Shadcn/ui components and Tailwind CSS
Language: TypeScript
Framework: Next.js 16 with React 19
```

### Template 3: Generate Database Schema

```
Generate SQLAlchemy model for [TABLE_NAME]:

Fields:
- [Field 1]: [Type, constraints]
- [Field 2]: [Type, constraints]
- [Field 3]: [Type, constraints]

Relationships:
- [Relationship 1]
- [Relationship 2]

Indexes: [List]
Constraints: [List]

Requirements:
- Use SQLAlchemy 2.0.36 syntax
- Include docstrings
- Add hybrid properties if needed
- Follow UNS-ClaudeJP patterns
```

### Template 4: Generate Unit Test

```
Generate unit tests for [FUNCTION/CLASS]:

Subject: [FUNCTION_NAME] in [FILE]

Test cases to cover:
1. [Test case 1]
2. [Test case 2]
3. [Test case 3]

Edge cases:
- [Edge case 1]
- [Edge case 2]

Requirements:
- Use pytest (Python) or Vitest (JavaScript)
- Include mocking if needed
- Aim for 100% code coverage
- Include docstrings
```

### Template 5: Generate Type Definitions

```
Generate TypeScript types for [ENTITY]:

Fields needed:
- [Field 1]: [Type]
- [Field 2]: [Type]
- [Field 3]: [Type]

Also generate:
- Request DTO
- Response DTO
- Query parameters
- Update payload

Requirements:
- Use TypeScript strict mode
- Use Zod for validation if needed
- Export as named exports
- Include JSDoc comments
```

---

## 🛠️ Backend (Python/FastAPI) Templates

### Template: New API Router

```python
"""
[FEATURE_NAME] API router

Routes:
- GET /api/[resource]/ - List all
- GET /api/[resource]/{id} - Get one
- POST /api/[resource]/ - Create
- PUT /api/[resource]/{id} - Update
- DELETE /api/[resource]/{id} - Delete
"""

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.deps import get_current_user, get_db
from app.models import models
from app.schemas import [schema_module]
from app.services import [service_module]

router = APIRouter(prefix="/[resource]", tags=["[resource]"])


@router.get("/", response_model=list[[schema_module].Response])
async def list_[resource](
    skip: int = 0,
    limit: int = 100,
    db: AsyncSession = Depends(get_db),
    current_user = Depends(get_current_user),
):
    """List all [resource]"""
    service = [service_module].Service(db)
    return await service.list(skip=skip, limit=limit)


@router.get("/{id}", response_model=[schema_module].Response)
async def get_[resource](
    id: int,
    db: AsyncSession = Depends(get_db),
    current_user = Depends(get_current_user),
):
    """Get [resource] by ID"""
    service = [service_module].Service(db)
    item = await service.get(id)
    if not item:
        raise HTTPException(status_code=404, detail="Not found")
    return item


@router.post("/", response_model=[schema_module].Response, status_code=201)
async def create_[resource](
    data: [schema_module].Create,
    db: AsyncSession = Depends(get_db),
    current_user = Depends(get_current_user),
):
    """Create new [resource]"""
    service = [service_module].Service(db)
    return await service.create(data)


@router.put("/{id}", response_model=[schema_module].Response)
async def update_[resource](
    id: int,
    data: [schema_module].Update,
    db: AsyncSession = Depends(get_db),
    current_user = Depends(get_current_user),
):
    """Update [resource]"""
    service = [service_module].Service(db)
    item = await service.update(id, data)
    if not item:
        raise HTTPException(status_code=404, detail="Not found")
    return item


@router.delete("/{id}", status_code=204)
async def delete_[resource](
    id: int,
    db: AsyncSession = Depends(get_db),
    current_user = Depends(get_current_user),
):
    """Delete [resource]"""
    service = [service_module].Service(db)
    await service.delete(id)
```

---

## ⚛️ Frontend (React/Next.js) Templates

### Template: New Page Component

```typescript
// app/(dashboard)/[feature]/page.tsx

import { Metadata } from 'next'
import { [FeatureList] } from '@/components/[feature]/list'
import { Button } from '@/components/ui/button'

export const metadata: Metadata = {
  title: '[Feature Title]',
  description: '[Feature Description]',
}

export default function [FeaturePage]() {
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">[Feature Title]</h1>
          <p className="text-gray-600">[Feature Description]</p>
        </div>
        <Button>+ New [Item]</Button>
      </div>

      <[FeatureList] />
    </div>
  )
}
```

### Template: New React Component

```typescript
// components/[feature]/[component-name].tsx

'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'

interface [ComponentName]Props {
  // Props definition
  id: string
  title: string
  onUpdate?: (data: any) => Promise<void>
}

export function [ComponentName]({
  id,
  title,
  onUpdate,
}: [ComponentName]Props) {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleAction = async () => {
    setIsLoading(true)
    setError(null)
    try {
      // Logic here
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Card className="p-4">
      <h2 className="text-xl font-bold mb-4">{title}</h2>
      {error && <p className="text-red-600 mb-4">{error}</p>}
      <Button onClick={handleAction} disabled={isLoading}>
        {isLoading ? 'Loading...' : 'Action'}
      </Button>
    </Card>
  )
}
```

---

## 🧪 Testing Templates

### Template: Unit Test (Python)

```python
# backend/tests/test_[module].py

import pytest
from sqlalchemy.ext.asyncio import AsyncSession

from app.models import models
from app.schemas import [schema]
from app.services import [service]


@pytest.fixture
async def db_session() -> AsyncSession:
    """Provide test database session"""
    # Setup
    yield session
    # Teardown


@pytest.mark.asyncio
async def test_create_[item](db_session: AsyncSession):
    """Test creating [item]"""
    service = [service].Service(db_session)
    data = [schema].Create(
        name="Test",
        # Other fields
    )

    result = await service.create(data)

    assert result.id is not None
    assert result.name == "Test"


@pytest.mark.asyncio
async def test_get_[item](db_session: AsyncSession):
    """Test getting [item] by ID"""
    service = [service].Service(db_session)

    item = await service.get(1)

    assert item is not None


@pytest.mark.asyncio
async def test_update_[item](db_session: AsyncSession):
    """Test updating [item]"""
    service = [service].Service(db_session)
    data = [schema].Update(name="Updated")

    result = await service.update(1, data)

    assert result.name == "Updated"


@pytest.mark.asyncio
async def test_delete_[item](db_session: AsyncSession):
    """Test deleting [item]"""
    service = [service].Service(db_session)

    await service.delete(1)

    item = await service.get(1)
    assert item is None
```

### Template: E2E Test (Playwright)

```typescript
// tests/e2e/[feature].spec.ts

import { test, expect } from '@playwright/test'

test.describe('[Feature] Page', () => {
  test('should load page', async ({ page }) => {
    await page.goto('http://localhost:3000/[feature]')
    await expect(page).toHaveTitle(/[Feature]/)
  })

  test('should create new item', async ({ page }) => {
    await page.goto('http://localhost:3000/[feature]')

    await page.click('button:has-text("+ New")')
    await page.fill('input[name="name"]', 'Test Item')
    await page.click('button:has-text("Create")')

    await expect(page.locator('text=Test Item')).toBeVisible()
  })

  test('should edit item', async ({ page }) => {
    await page.goto('http://localhost:3000/[feature]')

    await page.click('button:has-text("Edit")')
    await page.fill('input[name="name"]', 'Updated')
    await page.click('button:has-text("Save")')

    await expect(page.locator('text=Updated')).toBeVisible()
  })

  test('should delete item', async ({ page }) => {
    await page.goto('http://localhost:3000/[feature]')

    await page.click('button:has-text("Delete")')
    await page.click('button:has-text("Confirm")')

    await expect(page.locator('text=Item deleted')).toBeVisible()
  })
})
```

---

## 📋 Migration & Database Templates

### Template: Database Migration

```python
# backend/alembic/versions/001_add_[table].py

"""Add [TABLE_NAME] table

Revision ID: 001add[table]
Revises: 000...
Create Date: 2025-11-16

"""

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers
revision = '001add[table]'
down_revision = '000...'
branch_labels = None
depends_on = None


def upgrade():
    op.create_table(
        '[table_name]',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('name', sa.String(255), nullable=False),
        sa.Column('created_at', sa.DateTime(), server_default=sa.func.now()),
        sa.Column('updated_at', sa.DateTime(), server_default=sa.func.now()),
        sa.PrimaryKeyConstraint('id'),
    )
    op.create_index(op.f('ix_[table_name]_name'), '[table_name]', ['name'])


def downgrade():
    op.drop_index(op.f('ix_[table_name]_name'), table_name='[table_name]')
    op.drop_table('[table_name]')
```

---

## 🔐 Documentation Template

### Template: API Endpoint Documentation

```markdown
# [Resource] Endpoints

## List All [Resources]

**Endpoint:** `GET /api/[resource]`

**Authentication:** Required (Bearer token)

**Query Parameters:**
- `skip` (integer, default: 0) - Number of items to skip
- `limit` (integer, default: 100) - Max items to return
- `sort_by` (string, optional) - Field to sort by
- `order` (string, optional) - `asc` or `desc`

**Response:**
```json
[
  {
    "id": 1,
    "name": "[Item Name]",
    "created_at": "2025-11-16T10:00:00Z"
  }
]
```

**Status Codes:**
- `200` - Success
- `401` - Unauthorized
- `500` - Server error

---

## Create [Resource]

**Endpoint:** `POST /api/[resource]`

**Authentication:** Required (Bearer token)

**Request Body:**
```json
{
  "name": "[Item Name]",
  "[field2]": "[value]"
}
```

**Response:** (201 Created)
```json
{
  "id": 1,
  "name": "[Item Name]",
  "created_at": "2025-11-16T10:00:00Z"
}
```

**Validation Errors:** (400 Bad Request)
```json
{
  "detail": [
    {
      "loc": ["body", "name"],
      "msg": "Field required",
      "type": "value_error.missing"
    }
  ]
}
```
```

---

## 🎯 Quick Reference

| Template | Use When | Time |
|----------|----------|------|
| New Feature Request | Starting major feature | 2 min |
| Bug Fix Request | Found a bug | 1 min |
| Architecture Question | Not sure how to proceed | 3 min |
| Code Review Request | Want feedback on code | 2 min |
| Generate API Endpoint | Need new endpoint | 30 sec |
| Generate Component | Need new UI piece | 30 sec |
| Generate Test | Need unit test coverage | 1 min |

---

**Pro Tip:** Copy these templates into your editor snippets for even faster usage! ⚡
