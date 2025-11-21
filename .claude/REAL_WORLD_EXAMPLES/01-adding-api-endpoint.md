# 📚 Real World Example #1: Adding an API Endpoint

**Complete walkthrough of adding a candidate import API endpoint**

---

## 🎯 The Request

```
User: "I need to add a candidate import feature that lets users upload Excel files
with candidate data. It should validate the data, check for duplicates, and save
to the database."
```

---

## 🔄 Claude Code's Workflow

### Step 1: Understand the Requirement

Claude Code (Orchestrator) reads:
- agents.md (to understand the system)
- SPECIALIST_MATRIX.md (to find the right agents)
- PROMPT_TEMPLATES.md (to use templates)

**Decision:**
- This requires API + Database + Frontend
- Need to coordinate 3+ specialists
- Should use TodoWrite to track work

---

### Step 2: Create Todo List

```markdown
Claude Code uses TodoWrite:

[ ] Design API schema and validation
[ ] Implement FastAPI endpoint for import
[ ] Create database logic to save candidates
[ ] Build React form component for upload
[ ] Write backend tests
[ ] Write E2E tests
[ ] Test complete flow
```

---

### Step 3: Research (if needed)

If Excel parsing isn't familiar, Claude Code would:

```
Task(
    subagent_type="general-purpose",
    description="Research Excel parsing in Python",
    prompt="Research how to parse Excel files in Python using pandas/openpyxl for FastAPI"
)
```

Gets back: Research document with patterns.

---

### Step 4: Delegate First Task - API Design

Claude Code invokes api-developer specialist:

```
Task(
    subagent_type="general-purpose",
    description="Design candidate import API endpoint",
    prompt="""
    You are the api-developer specialist.

    Task: Design and implement POST /api/candidates/import endpoint

    Requirements:
    - Accept multipart/form-data with Excel file
    - Validate required columns: employee_id, full_name, email, date_of_birth
    - Check for duplicate candidates (by email)
    - Save valid records to database
    - Return import result: { success: bool, imported: int, errors: [] }

    Error cases to handle:
    1. Invalid file format
    2. Missing required columns
    3. Invalid data types
    4. Duplicate email addresses
    5. Database insert failure

    Authentication: Require ADMIN role

    Provide:
    1. Pydantic schemas for request/response
    2. FastAPI route handler with validation
    3. Error handling with appropriate HTTP codes
    4. OpenAPI documentation
    """
)
```

**api-developer produces:**

`backend/app/schemas/candidate.py`:
```python
from pydantic import BaseModel, EmailStr, validator
from datetime import date

class CandidateImport(BaseModel):
    employee_id: str
    full_name: str
    full_name_kana: str | None = None
    email: EmailStr
    date_of_birth: date

    @validator('email')
    def validate_email(cls, v):
        if not v.endswith(('@company.jp', '@example.com')):
            raise ValueError('Email must be from allowed domains')
        return v

class ImportResponse(BaseModel):
    success: bool
    imported: int
    total: int
    errors: list[dict]
```

`backend/app/api/candidates.py`:
```python
from fastapi import APIRouter, Depends, File, UploadFile, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
import pandas as pd

router = APIRouter(prefix="/candidates", tags=["candidates"])

@router.post("/import", response_model=ImportResponse)
async def import_candidates(
    file: UploadFile = File(...),
    db: AsyncSession = Depends(get_db),
    current_user = Depends(get_current_user),
):
    """Import candidates from Excel file"""

    if current_user.role != "ADMIN":
        raise HTTPException(status_code=403, detail="Admin access required")

    try:
        # Read Excel file
        df = pd.read_excel(file.file, sheet_name=0)

        # Validate columns
        required_cols = ['employee_id', 'full_name', 'email', 'date_of_birth']
        if not all(col in df.columns for col in required_cols):
            raise ValueError("Missing required columns")

        # Process and validate rows
        imported = 0
        errors = []

        for idx, row in df.iterrows():
            try:
                candidate_data = CandidateImport(**row.to_dict())

                # Check for duplicates
                existing = await db.execute(
                    select(models.Candidate).where(
                        models.Candidate.email == candidate_data.email
                    )
                )
                if existing.scalar():
                    errors.append({
                        "row": idx + 2,  # +2 for header + 1-based indexing
                        "error": "Email already exists"
                    })
                    continue

                # Create candidate
                candidate = models.Candidate(**candidate_data.dict())
                db.add(candidate)
                imported += 1

            except ValidationError as e:
                errors.append({"row": idx + 2, "error": str(e)})

        await db.commit()

        return ImportResponse(
            success=len(errors) == 0,
            imported=imported,
            total=len(df),
            errors=errors
        )

    except Exception as e:
        await db.rollback()
        raise HTTPException(status_code=400, detail=str(e))
```

---

### Step 5: Mark Todo Complete & Test

Claude Code invokes testing-qa:

```
Task(
    subagent_type="general-purpose",
    description="Test candidate import API endpoint",
    prompt="""
    Test the candidate import endpoint I just created.

    Tests needed:
    1. Valid Excel file with 10 candidates
    2. Excel with missing columns
    3. Excel with invalid email
    4. Excel with duplicate email
    5. Unauthorized user (not ADMIN)

    Verify:
    - Returns correct response schema
    - Saves to database correctly
    - Doesn't save duplicate emails
    - Returns proper error messages
    - Requires ADMIN role
    """
)
```

testing-qa produces:

`backend/tests/test_candidates_import.py`:
```python
@pytest.mark.asyncio
async def test_import_valid_candidates(client, db_session):
    """Test importing valid candidates"""

    # Create test Excel file
    df = pd.DataFrame([
        {
            "employee_id": "E001",
            "full_name": "田中太郎",
            "email": "tanaka@company.jp",
            "date_of_birth": "1990-01-01"
        },
        # ... more rows
    ])
    excel_file = io.BytesIO()
    df.to_excel(excel_file, index=False)
    excel_file.seek(0)

    # Make request
    response = client.post(
        "/api/candidates/import",
        files={"file": ("test.xlsx", excel_file, "application/octet-stream")},
        headers={"Authorization": f"Bearer {admin_token}"}
    )

    # Verify response
    assert response.status_code == 200
    data = response.json()
    assert data["success"] == True
    assert data["imported"] == 2
    assert len(data["errors"]) == 0

    # Verify database
    candidates = await db_session.execute(select(models.Candidate))
    assert len(candidates.scalars().all()) == 2

@pytest.mark.asyncio
async def test_import_duplicate_email(client, db_session):
    """Test that duplicate emails are caught"""

    # First, add a candidate
    candidate = models.Candidate(
        employee_id="E001",
        full_name="田中太郎",
        email="tanaka@company.jp",
        date_of_birth=date(1990, 1, 1)
    )
    db_session.add(candidate)
    await db_session.commit()

    # Try to import same email
    df = pd.DataFrame([
        {
            "employee_id": "E002",
            "full_name": "別の田中",
            "email": "tanaka@company.jp",  # Same email
            "date_of_birth": "1991-01-01"
        }
    ])

    response = client.post(
        "/api/candidates/import",
        files={"file": ("test.xlsx", create_excel_file(df))},
        headers={"Authorization": f"Bearer {admin_token}"}
    )

    # Verify error
    assert response.status_code == 200
    data = response.json()
    assert data["success"] == False
    assert len(data["errors"]) == 1
    assert "already exists" in data["errors"][0]["error"]
```

**Tests pass:** ✅

---

### Step 6: Next Todo - Database Logic

Claude Code marks API todo as complete and moves to database.

Actually, the api-developer already handles this, but Claude Code could delegate to database-specialist if it was a complex case.

---

### Step 7: Frontend Component

Claude Code invokes frontend-architect then ui-designer:

```
Task(
    subagent_type="general-purpose",
    description="Create candidate import form component",
    prompt="""
    You are the ui-designer specialist.

    Task: Create React form component for candidate import

    Features:
    - File upload input (accept .xlsx, .csv)
    - Show upload progress
    - Display import results:
      - Number imported
      - List of errors with row numbers
    - Validation feedback
    - Success/error messages
    - Loading state while importing

    Use:
    - Shadcn/ui components
    - Tailwind CSS
    - Next.js 16 + React 19
    - TypeScript

    API endpoint: POST /api/candidates/import
    """
)
```

ui-designer produces:

`frontend/components/candidates/import-form.tsx`:
```typescript
'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { api } from '@/lib/api'

interface ImportResponse {
  success: boolean
  imported: number
  total: number
  errors: Array<{row: number, error: string}>
}

export function CandidateImportForm() {
  const [file, setFile] = useState<File | null>(null)
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<ImportResponse | null>(null)
  const [error, setError] = useState<string | null>(null)

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file && (file.name.endsWith('.xlsx') || file.name.endsWith('.csv'))) {
      setFile(file)
      setError(null)
    } else {
      setError('Please upload an Excel file (.xlsx or .csv)')
      setFile(null)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!file) return

    setLoading(true)
    setError(null)

    try {
      const formData = new FormData()
      formData.append('file', file)

      const response = await api.post('/candidates/import', formData)
      setResult(response.data)

      if (response.data.success) {
        setFile(null)
      }
    } catch (err) {
      setError('Import failed. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Card className="p-6 space-y-4">
      <h2 className="text-xl font-bold">Import Candidates</h2>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="border-2 border-dashed border-gray-300 rounded-lg p-6">
          <input
            type="file"
            accept=".xlsx,.csv"
            onChange={handleFileChange}
            disabled={loading}
            className="w-full"
          />
          {file && <p className="text-sm text-gray-600 mt-2">{file.name}</p>}
        </div>

        {error && (
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <Button type="submit" disabled={!file || loading}>
          {loading ? 'Importing...' : 'Import'}
        </Button>
      </form>

      {result && (
        <div className="space-y-4">
          {result.success ? (
            <Alert className="bg-green-50 border-green-200">
              <AlertDescription className="text-green-800">
                Successfully imported {result.imported} candidates!
              </AlertDescription>
            </Alert>
          ) : (
            <Alert variant="destructive">
              <AlertDescription>
                {result.imported} candidates imported, {result.errors.length} errors
              </AlertDescription>
            </Alert>
          )}

          {result.errors.length > 0 && (
            <div className="space-y-2">
              <h3 className="font-bold">Errors:</h3>
              {result.errors.map((err, idx) => (
                <div key={idx} className="text-sm text-red-600">
                  Row {err.row}: {err.error}
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </Card>
  )
}
```

---

### Step 8: E2E Testing

Claude Code invokes testing-qa for E2E tests:

```
Task(
    subagent_type="general-purpose",
    description="Write E2E tests for candidate import feature",
    prompt="""
    Write Playwright E2E tests for the candidate import feature.

    Test scenarios:
    1. User navigates to import form
    2. User selects Excel file
    3. User submits form
    4. System shows loading state
    5. System shows success message with count
    6. Candidates appear in list

    Use:
    - Playwright
    - http://localhost:3000 (frontend)
    - http://localhost:8000 (backend)
    """
)
```

testing-qa produces:

`tests/e2e/candidate-import.spec.ts`:
```typescript
import { test, expect } from '@playwright/test'

test.describe('Candidate Import Feature', () => {
  test('should import candidates successfully', async ({ page }) => {
    // 1. Navigate to candidates page
    await page.goto('http://localhost:3000/candidates')

    // 2. Click import button
    await page.click('button:has-text("Import")')

    // 3. Expect import form
    await expect(page.locator('h2:has-text("Import Candidates")')).toBeVisible()

    // 4. Upload test file
    const fileInput = page.locator('input[type="file"]')
    await fileInput.setInputFiles('tests/fixtures/candidates.xlsx')

    // 5. Submit form
    await page.click('button[type="submit"]:has-text("Import")')

    // 6. Wait for success message
    await expect(page.locator('text=Successfully imported')).toBeVisible()

    // 7. Verify candidates in list
    await page.goto('http://localhost:3000/candidates')
    await expect(page.locator('text=田中太郎')).toBeVisible()
  })
})
```

**E2E tests pass:** ✅

---

### Step 9: Final Verification

Claude Code checks:
- ✅ All unit tests passing
- ✅ All E2E tests passing
- ✅ No TypeScript errors
- ✅ No console errors
- ✅ Feature works end-to-end
- ✅ Code follows patterns
- ✅ Documentation complete

---

### Step 10: Create PR

Claude Code marks all todos as complete and creates PR.

---

## 📊 Summary

| Aspect | Handled By | Result |
|--------|-----------|--------|
| API Design | api-developer | ✅ Endpoint with validation |
| Database | database-specialist (implied) | ✅ Models included |
| Frontend | ui-designer | ✅ React component |
| Backend Tests | testing-qa | ✅ Unit tests |
| E2E Tests | testing-qa | ✅ Playwright tests |
| Coordination | orchestrator-master (Claude Code) | ✅ Everything orchestrated |

**Total time:** 2-3 hours of AI work (could be days for humans)
**Code quality:** Production-ready with full test coverage
**Follows patterns:** Yes, all 13 agent specialists followed project patterns

---

## 🎓 Key Learnings

1. **Orchestration is key:** Claude Code didn't try to do everything
2. **Delegation works:** Each specialist did ONE thing well
3. **Testing is mandatory:** Every piece was tested before PR
4. **Patterns matter:** All code follows existing project patterns
5. **Context is everything:** Each specialist got complete context

---

**This is how the agent system is supposed to work!** 🚀
