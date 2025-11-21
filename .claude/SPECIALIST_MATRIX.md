# 🎭 Specialist Matrix - 13 Agents Reference

**Complete reference for all specialized agents and when to invoke them**

---

## 📋 Quick Summary Table

| # | Agent Name | Category | Expertise | Activation Keywords | Context Window |
|---|-----------|----------|-----------|-------------------|-----------------|
| 1 | api-developer | Backend | FastAPI, REST, endpoints | api, endpoint, route, router | Focused |
| 2 | backend-architect | Backend | System design, patterns | architecture, design, backend, system | Medium |
| 3 | database-specialist | Backend | PostgreSQL, ORM, migrations | database, sql, postgres, migration | Focused |
| 4 | frontend-architect | Frontend | Next.js, React, patterns | frontend, nextjs, react, architecture | Medium |
| 5 | ui-designer | Frontend | Components, styling, UX | ui, design, component, tailwind | Focused |
| 6 | devops-engineer | DevOps | Docker, deployment, scaling | docker, deploy, infrastructure | Focused |
| 7 | ocr-specialist | Feature | Document processing | ocr, document, image, scan | Focused |
| 8 | payroll-calculator | Feature | Salary, tax, calculations | payroll, salary, tax, compensation | Focused |
| 9 | orchestrator-master | Orchestration | Coordination, planning | orchestrate, plan, coordinate | 200k (You!) |
| 10 | bug-hunter | QA | Debugging, error detection | bug, debug, error, issue | Focused |
| 11 | performance-optimizer | QA | Speed, memory, optimization | performance, optimize, speed | Medium |
| 12 | security-auditor | QA | Auth, RBAC, vulnerabilities | security, auth, vulnerability | Medium |
| 13 | testing-qa | QA | Tests, verification, QA | test, qa, verify, validation | Focused |

---

## 🔍 Detailed Agent Profiles

### 1️⃣ API Developer

**Purpose:** Design and implement REST API endpoints

**When to Invoke:**
- Creating new API routes
- Modifying existing endpoints
- Implementing request/response handling
- Error handling in endpoints
- Dependency injection setup

**What to Provide:**
```markdown
Task: Implement POST /api/candidates/import endpoint

Specifications:
- Accept multipart/form-data (Excel/CSV)
- Validate required columns: employee_id, name, email
- Return: { success: bool, imported: int, errors: [] }
- Authentication: ADMIN role required
- Database: Save to candidates table

Example request:
[Show format]

Example response:
[Show format]

Error cases:
- Invalid file format
- Missing required columns
- Duplicate data
```

**Specialist's Responsibilities:**
✅ Design endpoint signature (method, path, parameters)
✅ Create Pydantic request/response schemas
✅ Implement validation logic
✅ Add error handling with appropriate HTTP codes
✅ Include dependency injection (get_current_user, get_db)
✅ Add OpenAPI documentation
✅ Register router in app/main.py

**Output Format:**
- `backend/app/schemas/[resource].py` (Pydantic models)
- `backend/app/api/[resource].py` (Route handlers)
- Updated `backend/app/main.py` (router registration)

**Example:**
```python
# What api-developer produces
@router.post("/candidates/import", response_model=ImportResponse)
async def import_candidates(
    file: UploadFile,
    db: AsyncSession = Depends(get_db),
    current_user = Depends(get_current_user),
):
    """Import candidates from Excel file"""
    service = CandidateService(db)
    return await service.import_from_file(file)
```

---

### 2️⃣ Backend Architect

**Purpose:** Design system architecture and patterns

**When to Invoke:**
- Designing new modules
- Making major architectural decisions
- Choosing between design patterns
- Setting up service layer patterns
- Planning database structure

**What to Provide:**
```markdown
Problem: Building a new "Contracts" module

Requirements:
- Contracts for temporary workers
- Multiple contract types (standard, probation, etc.)
- Track contract dates, status, terms
- Link to employees and factories
- Support contract renewal workflow

Current system:
[Describe existing patterns]

Questions:
1. How should contracts relate to employees?
2. Should statuses be enum or table?
3. How to handle contract history?
4. What's the service layer pattern?
```

**Specialist's Responsibilities:**
✅ Design database schema (tables, relationships)
✅ Plan service layer architecture
✅ Choose design patterns (Repository, Factory, etc.)
✅ Plan API endpoint structure
✅ Consider scalability and performance
✅ Document architecture decisions

**Output Format:**
- Architecture diagram (text or Mermaid)
- Database schema with relationships
- Service layer structure
- API endpoint blueprint

---

### 3️⃣ Database Specialist

**Purpose:** Design and manage database schema, migrations

**When to Invoke:**
- Creating new tables
- Adding columns to existing tables
- Creating relationships/foreign keys
- Writing complex queries
- Optimizing database performance
- Creating/running migrations

**What to Provide:**
```markdown
Task: Add contract management to database

Table design:
- Contracts table
  - id (PK)
  - employee_id (FK to employees)
  - contract_type (enum: standard, probation)
  - start_date
  - end_date
  - terms (JSON)
  - status (active, expired, renewed)
  - created_at, updated_at

Relationships:
- contracts.employee_id → employees.id
- One employee can have many contracts

Indexes:
- On employee_id (for filtering by employee)
- On status (for finding active contracts)

Migration strategy:
- Create table
- Add indexes
- Migrate existing data
```

**Specialist's Responsibilities:**
✅ Design table structure (columns, types, constraints)
✅ Design relationships and foreign keys
✅ Create Alembic migration file
✅ Handle data migration for schema changes
✅ Create/update SQLAlchemy models
✅ Optimize with indexes and constraints

**Output Format:**
- `backend/app/models/models.py` (SQLAlchemy model)
- `backend/alembic/versions/XXX_[description].py` (Migration file)

**Example:**
```python
# What database-specialist produces
class Contract(Base):
    __tablename__ = "contracts"

    id = Column(Integer, primary_key=True)
    employee_id = Column(Integer, ForeignKey("employees.id"))
    contract_type = Column(String)
    start_date = Column(DateTime)
    end_date = Column(DateTime)

    employee = relationship("Employee", back_populates="contracts")
```

---

### 4️⃣ Frontend Architect

**Purpose:** Design React/Next.js component architecture

**When to Invoke:**
- Planning page structure
- Designing component hierarchy
- Choosing server vs client components
- Planning state management
- Designing data flow

**What to Provide:**
```markdown
Task: Design Candidates page structure

Features:
- List all candidates with filtering
- Search by name/email
- Sort by date added
- View candidate detail modal
- Edit candidate information
- Delete candidate (with confirmation)
- Bulk import (link to import feature)

Performance:
- 1000+ candidates expected
- Must load in < 2s
- Pagination needed

State:
- Selected candidates (filter state)
- Current page
- Search term
- Sorting
```

**Specialist's Responsibilities:**
✅ Plan page/component hierarchy
✅ Choose server vs client components
✅ Design state management strategy
✅ Plan data fetching approach
✅ Design error/loading states
✅ Plan responsive design

**Output Format:**
- Component tree diagram
- File structure plan
- Data flow diagram
- Server/client component breakdown

---

### 5️⃣ UI Designer

**Purpose:** Implement UI components with styling

**When to Invoke:**
- Creating new components
- Styling pages/components
- Implementing responsive design
- Ensuring accessibility
- Using theme system

**What to Provide:**
```markdown
Task: Create Candidate Card component

Design:
- Show candidate photo, name, contact
- Display status badge (active, inactive, review)
- Show date added
- Action buttons: View, Edit, Delete
- Responsive (mobile, tablet, desktop)

Styling:
- Use Shadcn/ui components
- Tailwind CSS for styling
- Theme colors from lib/themes.ts
- Dark mode support
- WCAG AA contrast ratio

Interactions:
- Hover effects
- Loading states
- Error states
- Empty state
```

**Specialist's Responsibilities:**
✅ Create React components
✅ Use Shadcn/ui for base components
✅ Apply Tailwind CSS styling
✅ Support light/dark themes
✅ Ensure mobile responsiveness
✅ Follow accessibility standards (WCAG)
✅ Add loading/error/empty states

**Output Format:**
- `frontend/components/[feature]/[component].tsx`
- Proper TypeScript types
- Responsive CSS

---

### 6️⃣ DevOps Engineer

**Purpose:** Docker, deployment, infrastructure

**When to Invoke:**
- Setting up Docker services
- Configuring health checks
- Setting up scaling
- Environment configuration
- Monitoring and logging

**What to Provide:**
```markdown
Task: Add backup service to docker-compose

Requirements:
- Automated daily backups of PostgreSQL
- Backup time: 02:00 JST
- Retention: 30 days
- Location: ./backups/
- Backup format: .sql.gz

Features:
- Cron scheduling
- Healthcheck
- Volume for backup storage
- Logging for monitoring

Integration:
- Add to docker-compose.yml
- Set environment variables
- Update .env template
```

**Specialist's Responsibilities:**
✅ Configure Docker service
✅ Set up health checks
✅ Configure volumes and networks
✅ Set environment variables
✅ Add startup dependencies
✅ Configure scaling if needed
✅ Add logging/monitoring

**Output Format:**
- Updated `docker-compose.yml`
- Service configuration files
- Scripts for setup

---

### 7️⃣ OCR Specialist

**Purpose:** Document processing and OCR

**When to Invoke:**
- Processing document images
- Extracting data from documents
- Japanese document processing
- Fallback provider selection
- Face detection

**What to Provide:**
```markdown
Task: Add OCR processing for driving licenses

Document: 運転免許証 (Driver's License)

Fields to extract:
- Full name (漢字 + ローマ字)
- Date of birth
- License number
- Expiration date
- Address
- License category

Processing:
- Accept JPG/PNG
- Max file size: 5MB
- Support Japanese characters
- Use provider cascade:
  1. Azure Computer Vision (primary)
  2. EasyOCR (secondary)
  3. Tesseract (fallback)

Validation:
- Verify required fields extracted
- Date format validation
```

**Specialist's Responsibilities:**
✅ Choose appropriate OCR provider
✅ Configure provider credentials
✅ Parse OCR output to extract fields
✅ Validate extracted data
✅ Implement fallback logic
✅ Handle errors gracefully

**Output Format:**
- Service class with OCR logic
- Schema for extracted fields
- Validation rules

---

### 8️⃣ Payroll Calculator

**Purpose:** Salary calculations, tax, insurance

**When to Invoke:**
- Implementing salary calculations
- Japanese tax/insurance logic
- Bonus calculations
- Deduction handling
- Payroll reporting

**What to Provide:**
```markdown
Task: Implement Japanese payroll calculation

Requirements:
- Base salary + overtime (1.25x)
- Monthly bonus (bonetto)
- Deductions:
  - Income tax (所得税) - use tax tables
  - Social insurance (社会保険) - 10.3%
  - Pension (厚生年金) - 9.15%
  - Health insurance (健康保険)

- Taxable income calculation
- Rounding rules (round down to nearest 100 yen)
- Generate payslip

Input:
- Base salary
- Hours worked
- Overtime hours
- Bonus amount

Output:
- Gross salary
- Deductions (itemized)
- Net salary
```

**Specialist's Responsibilities:**
✅ Implement salary calculation logic
✅ Apply Japanese tax/insurance rules
✅ Handle edge cases
✅ Create calculation service
✅ Validate calculations
✅ Generate payslips

**Output Format:**
- Service class with calculations
- Test cases with expected values
- Documentation of formulas

---

### 9️⃣ Orchestrator Master

**Purpose:** Coordination and high-level planning

**When to Invoke:**
- You are Claude Code (always active!)
- Planning multi-component features
- Coordinating between specialists
- Making architectural decisions
- Tracking overall progress

**Your Responsibilities:**
✅ Create comprehensive todo lists
✅ Detect which specialists are needed
✅ Research new technologies
✅ Delegate work to appropriate specialists
✅ Test implementations
✅ Track progress
✅ Make big-picture decisions
✅ Escalate to humans when needed

**Context Window:** 200k tokens (you!)

**Output Format:**
- TodoWrite todo lists
- Delegated work to specialists
- Test reports
- Final PR summaries

---

### 🔟 Bug Hunter

**Purpose:** Debugging and error detection

**When to Invoke:**
- Found a bug with stack trace
- Feature not working as expected
- Intermittent errors
- Logic errors
- Edge case issues

**What to Provide:**
```markdown
Task: Debug login failure for some users

Problem:
- Users report "Authentication failed" error
- Happens inconsistently (maybe 1 in 100 logins)
- Affects both web and mobile
- Started after recent update

Error logs:
[Stack trace]
[Error message]
[Timestamp]

Steps to reproduce:
1. [Step 1]
2. [Step 2]
3. [Step 3]

Expected: User logs in successfully
Actual: Authentication fails

Environment:
- Backend version: X.Y.Z
- Database: PostgreSQL 15
- JWT library: PyJWT X.Y.Z
```

**Specialist's Responsibilities:**
✅ Analyze error logs
✅ Reproduce the issue
✅ Identify root cause
✅ Suggest fixes
✅ Verify fix resolves issue

**Output Format:**
- Root cause analysis
- Fix implementation
- Test cases to prevent regression

---

### 1️⃣1️⃣ Performance Optimizer

**Purpose:** Speed, memory, bundle size optimization

**When to Invoke:**
- Feature is slow (> X ms)
- Memory usage too high
- Bundle size too large
- Database queries slow
- Rendering performance issues

**What to Provide:**
```markdown
Task: Optimize Candidates list page

Current performance:
- Load time: 8000 ms (should be < 2000 ms)
- Database queries: 45 queries (N+1 problem)
- Bundle size: 2.5 MB (should be < 1 MB)

Bottlenecks:
- 1000 candidates loading
- No pagination
- No query optimization
- Including all relationships

Target:
- Load time: < 2000 ms
- Database queries: < 3 queries
- Bundle size: < 1 MB
- Support 10,000+ candidates
```

**Specialist's Responsibilities:**
✅ Profile performance issues
✅ Identify bottlenecks
✅ Optimize queries (indexes, eager loading)
✅ Optimize frontend (code splitting, lazy loading)
✅ Optimize bundle size
✅ Verify improvements

**Output Format:**
- Performance analysis
- Optimization implementation
- Before/after metrics

---

### 1️⃣2️⃣ Security Auditor

**Purpose:** Authentication, authorization, security

**When to Invoke:**
- Implementing authentication
- Adding role-based access control
- Security vulnerability found
- Password/credential handling
- Data encryption needed

**What to Provide:**
```markdown
Task: Implement RBAC for Payroll feature

Requirements:
- Roles: ADMIN, PAYROLL_MANAGER, EMPLOYEE
- ADMIN: Full access to all payroll
- PAYROLL_MANAGER: Can view/edit payroll
- EMPLOYEE: Can only view own payroll

Endpoints:
- GET /api/payroll/ (list)
- GET /api/payroll/{id} (view)
- PUT /api/payroll/{id} (edit)
- DELETE /api/payroll/{id} (delete)

Security:
- Use JWT tokens
- Check roles in endpoint handlers
- Audit access to sensitive data
```

**Specialist's Responsibilities:**
✅ Design authentication flow
✅ Implement JWT token handling
✅ Create RBAC permission matrix
✅ Audit vulnerable code
✅ Implement encryption where needed
✅ Add security headers

**Output Format:**
- Authentication service
- RBAC middleware/decorator
- Security audit report

---

### 1️⃣3️⃣ Testing QA

**Purpose:** Unit tests, E2E tests, verification

**When to Invoke:**
- Need to write tests
- Creating test data
- Setting up test infrastructure
- Verifying feature works end-to-end
- Code coverage issues

**What to Provide:**
```markdown
Task: Test new Candidate import feature

What to test:
1. Import valid CSV
   - File validation
   - Data validation
   - Database insertion
   - Return success count

2. Import invalid data
   - Missing required columns
   - Invalid email format
   - Duplicate candidates
   - Return error list

3. Edge cases
   - Empty file
   - Large file (10,000 rows)
   - Special characters (Japanese)

Test data:
- Valid CSV template
- Invalid CSV samples

Success criteria:
- 100% code coverage
- All happy paths work
- All error cases handled
- E2E test passes
```

**Specialist's Responsibilities:**
✅ Write unit tests (pytest)
✅ Write E2E tests (Playwright)
✅ Create test data fixtures
✅ Set up test database
✅ Mock external dependencies
✅ Achieve code coverage targets
✅ Verify feature works completely

**Output Format:**
- Test files (backend/tests/*, tests/e2e/*)
- Test data fixtures
- Coverage report

---

## 🎯 How to Invoke Specialists

### Format (Claude Code)

```python
from app.tools import Task

# Simple invocation
Task(
    subagent_type="general-purpose",
    description="Implement candidate import API endpoint",
    prompt="""
    You are the api-developer specialist.

    Task: Implement POST /api/candidates/import endpoint

    Specifications:
    - Accept multipart/form-data (Excel/CSV)
    - Validate required columns
    - Save to candidates table
    - Return { success: bool, imported: int, errors: [] }
    - Require ADMIN authentication

    Provide:
    1. Pydantic schema
    2. Route handler
    3. Error handling
    4. Unit tests
    """
)
```

---

## 📊 Specialist Selection Guide

**Ask yourself:**

```
"What needs to be done?"
    ↓
"Is it an API endpoint?"
├─ YES → api-developer
└─ NO → Continue
    ↓
"Is it database related?"
├─ YES → database-specialist
└─ NO → Continue
    ↓
"Is it React/UI component?"
├─ YES → ui-designer or frontend-architect
└─ NO → Continue
    ↓
"Is it Docker/deployment?"
├─ YES → devops-engineer
└─ NO → Continue
    ↓
"Is it a bug?"
├─ YES → bug-hunter
└─ NO → Continue
    ↓
"Is it testing?"
├─ YES → testing-qa
└─ NO → Continue
    ↓
"Is it slow?"
├─ YES → performance-optimizer
└─ NO → Continue
    ↓
"Is it about authentication/security?"
├─ YES → security-auditor
└─ NO → Continue
    ↓
"Is it document processing?"
├─ YES → ocr-specialist
└─ NO → Continue
    ↓
"Is it salary calculations?"
├─ YES → payroll-calculator
└─ NO → Continue
    ↓
"Is it big architectural question?"
├─ YES → backend-architect or frontend-architect
└─ NO → orchestrator-master (you!)
```

---

## 🚨 Common Mistakes

### ❌ Mistake 1: Asking wrong specialist

```
WRONG: Ask ui-designer to design database schema
RIGHT: Ask database-specialist, then ask ui-designer to style it
```

### ❌ Mistake 2: Not providing enough context

```
WRONG: "Implement the import feature"
RIGHT: [See example in api-developer section above]
```

### ❌ Mistake 3: Asking multiple specialists at once

```
WRONG: Ask api-developer AND database-specialist simultaneously
RIGHT: Ask database-specialist first (for schema)
       Then ask api-developer (with schema context)
```

### ❌ Mistake 4: Not testing specialist's work

```
WRONG: Accept specialist's code without verification
RIGHT: Always test with testing-qa before marking complete
```

---

## ✅ Best Practices

1. **Know which specialist you need** - Use decision tree above
2. **Provide complete context** - Don't leave details out
3. **Show examples if available** - Help specialist understand pattern
4. **Review and test** - Always verify specialist's work
5. **Provide feedback** - Help them improve
6. **Chain specialists** - Some tasks need multiple specialists in sequence

---

**Reference this matrix when delegating work!** 🎯
