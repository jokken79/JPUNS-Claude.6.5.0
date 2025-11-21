# Coding Standards and Best Practices
## UNS-ClaudeJP v6.0.0

**Document Version:** 1.0.0  
**Last Updated:** 2025-11-21  
**Status:** Official Standard  
**Scope:** Backend (Python/FastAPI) + Frontend (TypeScript/React/Next.js)

---

## Table of Contents

1. [General Principles](#1-general-principles)
2. [Backend Standards (Python/FastAPI)](#2-backend-standards-pythonfastapi)
3. [Frontend Standards (TypeScript/React/Nextjs)](#3-frontend-standards-typescriptreactnextjs)
4. [Version Control & Git](#4-version-control--git)
5. [Security Best Practices](#5-security-best-practices)
6. [Performance Best Practices](#6-performance-best-practices)
7. [Documentation Standards](#7-documentation-standards)
8. [Common Anti-Patterns](#8-common-anti-patterns)
9. [Tools & Automation](#9-tools--automation)
10. [Code Review Checklist](#10-code-review-checklist)
11. [Quick Reference Card](#11-quick-reference-card)

---

## 1. General Principles

### 1.1 Clean Code Principles

#### Readability First
Code is read far more often than it is written. Optimize for human comprehension.

**Good:**
```python
def calculate_overtime_pay(hours_worked: int, hourly_rate: Decimal) -> Decimal:
    """Calculate overtime pay based on Japanese labor law (25% premium)."""
    standard_hours = 40
    overtime_hours = max(0, hours_worked - standard_hours)
    overtime_rate = hourly_rate * Decimal("1.25")
    return overtime_hours * overtime_rate
```

**Bad:**
```python
def calc(h: int, r: Decimal) -> Decimal:
    o = max(0, h - 40)
    return o * r * Decimal("1.25")
```

#### Single Responsibility Principle (SRP)
Each function/class should have one clear purpose.

**Good:**
```typescript
// Good: Separate concerns
function validateEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

function sendWelcomeEmail(email: string): Promise<void> {
  if (!validateEmail(email)) {
    throw new Error('Invalid email address');
  }
  return emailService.send(email, welcomeTemplate);
}
```

**Bad:**
```typescript
// Bad: Multiple responsibilities
function processUser(email: string): Promise<void> {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    throw new Error('Invalid email');
  }
  // Validate
  // Send email
  // Update database
  // Log analytics
  // ... too many responsibilities
}
```

### 1.2 SOLID Principles

#### S - Single Responsibility
Already covered above.

#### O - Open/Closed Principle
Open for extension, closed for modification.

**Good (Python):**
```python
from abc import ABC, abstractmethod

class PaymentProcessor(ABC):
    @abstractmethod
    def process_payment(self, amount: Decimal) -> bool:
        pass

class CreditCardProcessor(PaymentProcessor):
    def process_payment(self, amount: Decimal) -> bool:
        # Credit card specific logic
        pass

class BankTransferProcessor(PaymentProcessor):
    def process_payment(self, amount: Decimal) -> bool:
        # Bank transfer specific logic
        pass

# Adding new payment method doesn't modify existing code
class DigitalWalletProcessor(PaymentProcessor):
    def process_payment(self, amount: Decimal) -> bool:
        # Digital wallet logic
        pass
```

#### L - Liskov Substitution Principle
Derived classes must be substitutable for their base classes.

#### I - Interface Segregation
Clients shouldn't depend on interfaces they don't use.

#### D - Dependency Inversion
Depend on abstractions, not concretions.

### 1.3 DRY (Don't Repeat Yourself)

**Bad:**
```typescript
// Duplicated validation logic
function validateCandidateName(name: string): boolean {
  return name.length >= 2 && name.length <= 100;
}

function validateEmployeeName(name: string): boolean {
  return name.length >= 2 && name.length <= 100;
}
```

**Good:**
```typescript
// Shared validation logic
function validatePersonName(name: string): boolean {
  return name.length >= 2 && name.length <= 100;
}
```

### 1.4 KISS (Keep It Simple, Stupid)

**Bad:**
```python
# Unnecessarily complex
def is_eligible_for_bonus(employee: Employee) -> bool:
    return (
        True if employee.tenure_months >= 12 
        and employee.performance_score >= 3.5 
        and not employee.has_disciplinary_actions 
        else False
    )
```

**Good:**
```python
# Simple and clear
def is_eligible_for_bonus(employee: Employee) -> bool:
    return (
        employee.tenure_months >= 12 
        and employee.performance_score >= 3.5 
        and not employee.has_disciplinary_actions
    )
```

### 1.5 Code Review Philosophy

- **Be Kind**: Critique code, not people
- **Be Specific**: Provide actionable feedback with examples
- **Be Constructive**: Suggest improvements, don't just point out problems
- **Be Thorough**: Check logic, security, performance, and style
- **Be Responsive**: Review PRs within 24 hours

---

## 2. Backend Standards (Python/FastAPI)

### 2.1 Code Organization

#### Module Structure
```
backend/
├── app/
│   ├── __init__.py
│   ├── main.py              # FastAPI app entry point
│   ├── api/                 # API endpoints
│   │   ├── __init__.py
│   │   ├── v1/
│   │   │   ├── __init__.py
│   │   │   ├── employees.py
│   │   │   ├── candidates.py
│   │   │   └── payroll.py
│   ├── core/                # Core configurations
│   │   ├── __init__.py
│   │   ├── config.py
│   │   ├── database.py
│   │   ├── security.py
│   │   └── logging.py
│   ├── models/              # SQLAlchemy models
│   │   ├── __init__.py
│   │   ├── employee.py
│   │   └── candidate.py
│   ├── schemas/             # Pydantic schemas
│   │   ├── __init__.py
│   │   ├── employee.py
│   │   └── candidate.py
│   ├── services/            # Business logic
│   │   ├── __init__.py
│   │   ├── employee_service.py
│   │   └── payroll_service.py
│   └── utils/               # Utility functions
│       ├── __init__.py
│       └── validators.py
├── tests/
├── alembic/                 # Database migrations
└── scripts/                 # Maintenance scripts
```

#### File Header Convention
Every Python file MUST start with:
```python
# backend/app/services/employee_service.py
"""Employee service layer for business logic.

This module handles all employee-related business operations including
creation, updates, and complex queries.
"""
from __future__ import annotations
```

### 2.2 Naming Conventions

#### Variables and Functions
- **snake_case** for variables and functions
- **UPPER_CASE** for constants
- **PascalCase** for classes

```python
# Variables and functions
employee_name = "田中太郎"
total_overtime_hours = 15

def calculate_monthly_salary(base_salary: Decimal, overtime_hours: int) -> Decimal:
    pass

# Constants
MAX_OVERTIME_HOURS = 45
DEFAULT_HOURLY_RATE = Decimal("1500.00")
TAX_RATE = Decimal("0.20")

# Classes
class EmployeeService:
    pass

class PayrollCalculator:
    pass
```

#### Private vs Public
- **Private**: Prefix with single underscore `_private_method`
- **Internal/Protected**: Prefix with single underscore `_internal_use`
- **Name Mangling**: Double underscore for true private (rarely needed)

```python
class Employee:
    def __init__(self, name: str):
        self.name = name           # Public
        self._status = "active"    # Protected (internal use)
        self.__id = uuid4()        # Private (name mangled)
    
    def get_info(self) -> dict:    # Public method
        return {"name": self.name}
    
    def _validate_data(self) -> bool:  # Protected method
        return self.name is not None
```

### 2.3 Type Hints (Mandatory)

**ALL** functions MUST have type hints:

```python
from typing import Optional, List, Dict, Any
from decimal import Decimal
from datetime import datetime

# ✅ GOOD: Complete type hints
def get_employee_by_id(
    employee_id: int,
    db: Session,
    include_deleted: bool = False
) -> Optional[Employee]:
    """Fetch employee by ID with optional soft-deleted records."""
    query = db.query(Employee).filter(Employee.id == employee_id)
    if not include_deleted:
        query = query.filter(Employee.deleted_at.is_(None))
    return query.first()

# ✅ GOOD: Complex return types
def get_payroll_summary(
    month: int,
    year: int
) -> Dict[str, List[Dict[str, Any]]]:
    """Return payroll summary grouped by department."""
    pass

# ❌ BAD: Missing type hints
def get_employee(id, db):
    return db.query(Employee).filter_by(id=id).first()
```

### 2.4 Code Style (PEP 8 + Black)

#### Line Length
- **Maximum**: 100 characters (configured in pyproject.toml)
- Break long lines logically

```python
# ✅ GOOD
employee = db.query(Employee).filter(
    Employee.factory_id == factory_id,
    Employee.status == "active",
    Employee.hire_date >= start_date
).first()

# ✅ GOOD: Long function signature
def calculate_payroll_with_deductions(
    base_salary: Decimal,
    overtime_hours: int,
    bonus: Decimal,
    tax_rate: Decimal,
    insurance_deduction: Decimal
) -> Decimal:
    pass

# ❌ BAD: Too long
employee = db.query(Employee).filter(Employee.factory_id == factory_id, Employee.status == "active", Employee.hire_date >= start_date).first()
```

#### Import Organization
Use `isort` with Black profile:

```python
# 1. Future imports
from __future__ import annotations

# 2. Standard library
import os
import sys
from datetime import datetime, timedelta
from typing import Optional, List

# 3. Third-party imports
from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel, Field
from sqlalchemy import select
from sqlalchemy.orm import Session

# 4. Local imports
from app.core.config import settings
from app.core.database import get_db
from app.models.employee import Employee
from app.schemas.employee import EmployeeCreate, EmployeeResponse
from app.services.employee_service import EmployeeService
```

#### Docstrings (Google Style)
```python
def process_timer_card_with_ocr(
    image_path: str,
    employee_id: int,
    ocr_provider: str = "azure"
) -> TimerCardResult:
    """Process timer card image using OCR and extract attendance data.
    
    This function handles the complete OCR workflow including:
    - Image preprocessing
    - OCR extraction
    - Data validation
    - Database storage
    
    Args:
        image_path: Path to the timer card image file
        employee_id: ID of the employee this card belongs to
        ocr_provider: OCR provider to use ('azure', 'gemini', or 'easyocr')
    
    Returns:
        TimerCardResult object containing extracted data and metadata
    
    Raises:
        FileNotFoundError: If image_path doesn't exist
        OCRProcessingError: If OCR extraction fails
        ValidationError: If extracted data is invalid
    
    Example:
        >>> result = process_timer_card_with_ocr(
        ...     "uploads/card_001.jpg",
        ...     employee_id=42,
        ...     ocr_provider="azure"
        ... )
        >>> print(result.total_hours)
        168
    """
    pass
```

### 2.5 Database Patterns (SQLAlchemy)

#### Model Definition
```python
# backend/app/models/employee.py
from sqlalchemy import Column, Integer, String, DateTime, Numeric, ForeignKey, Index
from sqlalchemy.orm import relationship
from app.core.database import Base
from datetime import datetime

class Employee(Base):
    """Employee model representing workers in the system."""
    
    __tablename__ = "employees"
    
    # Primary key
    id = Column(Integer, primary_key=True, index=True)
    
    # Required fields
    name = Column(String(100), nullable=False, index=True)
    name_kana = Column(String(100), nullable=False)
    email = Column(String(255), unique=True, nullable=False, index=True)
    
    # Foreign keys
    factory_id = Column(Integer, ForeignKey("factories.id"), nullable=False)
    
    # Relationships
    factory = relationship("Factory", back_populates="employees")
    timer_cards = relationship("TimerCard", back_populates="employee")
    
    # Audit fields
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    deleted_at = Column(DateTime, nullable=True)
    
    # Indexes for query performance
    __table_args__ = (
        Index("idx_employee_factory_status", "factory_id", "deleted_at"),
        Index("idx_employee_name_search", "name", "name_kana"),
    )
    
    def __repr__(self) -> str:
        return f"<Employee(id={self.id}, name='{self.name}')>"
```

#### Query Optimization

**✅ GOOD: Eager loading to avoid N+1**
```python
from sqlalchemy.orm import joinedload

# Load employees with their factories in one query
employees = db.query(Employee).options(
    joinedload(Employee.factory)
).filter(Employee.deleted_at.is_(None)).all()

for employee in employees:
    print(f"{employee.name} works at {employee.factory.name}")  # No extra queries
```

**❌ BAD: N+1 query problem**
```python
# This creates 1 + N queries (1 for employees, N for factories)
employees = db.query(Employee).all()
for employee in employees:
    print(f"{employee.name} works at {employee.factory.name}")  # Query per iteration!
```

#### Transaction Handling
```python
from sqlalchemy.exc import IntegrityError

def create_employee_with_assignment(
    employee_data: EmployeeCreate,
    factory_id: int,
    db: Session
) -> Employee:
    """Create employee and assign to factory in a single transaction."""
    try:
        # Start transaction (implicit with Session)
        employee = Employee(**employee_data.dict())
        employee.factory_id = factory_id
        db.add(employee)
        
        # Create related assignment
        assignment = FactoryAssignment(
            employee_id=employee.id,
            factory_id=factory_id,
            start_date=datetime.utcnow()
        )
        db.add(assignment)
        
        # Commit transaction
        db.commit()
        db.refresh(employee)
        return employee
        
    except IntegrityError as e:
        # Rollback on error
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Employee already exists or constraint violation"
        )
    except Exception as e:
        db.rollback()
        raise
```

### 2.6 API Design (FastAPI)

#### Route Organization
```python
# backend/app/api/v1/employees.py
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from typing import List

from app.core.database import get_db
from app.core.security import get_current_user
from app.schemas.employee import EmployeeResponse, EmployeeCreate, EmployeeUpdate
from app.services.employee_service import EmployeeService

router = APIRouter(prefix="/employees", tags=["employees"])

@router.get(
    "",
    response_model=List[EmployeeResponse],
    summary="Get all employees",
    description="Retrieve a paginated list of employees with optional filtering"
)
async def get_employees(
    skip: int = Query(0, ge=0, description="Number of records to skip"),
    limit: int = Query(100, ge=1, le=1000, description="Max records to return"),
    factory_id: Optional[int] = Query(None, description="Filter by factory ID"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
) -> List[Employee]:
    """Get employees with pagination and filtering."""
    service = EmployeeService(db)
    return service.get_employees(
        skip=skip,
        limit=limit,
        factory_id=factory_id
    )

@router.post(
    "",
    response_model=EmployeeResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Create new employee"
)
async def create_employee(
    employee_data: EmployeeCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
) -> Employee:
    """Create a new employee record."""
    service = EmployeeService(db)
    return service.create_employee(employee_data)
```

#### Request/Response Patterns
```python
# backend/app/schemas/employee.py
from pydantic import BaseModel, EmailStr, Field, validator
from typing import Optional
from datetime import datetime, date

class EmployeeBase(BaseModel):
    """Shared employee fields."""
    name: str = Field(..., min_length=1, max_length=100)
    name_kana: str = Field(..., min_length=1, max_length=100)
    email: EmailStr
    phone: Optional[str] = Field(None, regex=r'^\d{10,11}$')
    hire_date: date
    
    @validator('name_kana')
    def validate_kana(cls, v: str) -> str:
        """Ensure name_kana contains only katakana characters."""
        import re
        if not re.match(r'^[ァ-ヶー\s]+$', v):
            raise ValueError('name_kana must contain only katakana characters')
        return v

class EmployeeCreate(EmployeeBase):
    """Schema for creating a new employee."""
    factory_id: int = Field(..., gt=0)
    position: str = Field(..., max_length=50)

class EmployeeUpdate(BaseModel):
    """Schema for updating an employee (all fields optional)."""
    name: Optional[str] = Field(None, min_length=1, max_length=100)
    email: Optional[EmailStr] = None
    phone: Optional[str] = Field(None, regex=r'^\d{10,11}$')
    position: Optional[str] = Field(None, max_length=50)

class EmployeeResponse(EmployeeBase):
    """Schema for employee response."""
    id: int
    factory_id: int
    position: str
    created_at: datetime
    updated_at: datetime
    
    class Config:
        from_attributes = True  # Pydantic v2 (was orm_mode in v1)
```

#### Error Responses
```python
from fastapi import HTTPException, status

# ✅ GOOD: Descriptive error messages
@router.get("/employees/{employee_id}")
async def get_employee(employee_id: int, db: Session = Depends(get_db)):
    employee = db.query(Employee).filter(Employee.id == employee_id).first()
    if not employee:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Employee with ID {employee_id} not found"
        )
    return employee

# ✅ GOOD: Custom exception with details
class EmployeeNotFoundError(HTTPException):
    def __init__(self, employee_id: int):
        super().__init__(
            status_code=status.HTTP_404_NOT_FOUND,
            detail={
                "error": "EMPLOYEE_NOT_FOUND",
                "message": f"Employee with ID {employee_id} does not exist",
                "employee_id": employee_id
            }
        )
```

### 2.7 Testing Patterns (pytest)

#### Test Structure
```python
# backend/tests/test_employee_service.py
"""Tests for employee service layer."""
import pytest
from decimal import Decimal
from datetime import datetime

from app.services.employee_service import EmployeeService
from app.models.employee import Employee
from app.schemas.employee import EmployeeCreate

class TestEmployeeService:
    """Test suite for EmployeeService."""
    
    def test_create_employee_success(self, db_session, sample_factory):
        """Test successful employee creation."""
        # Arrange
        service = EmployeeService(db_session)
        employee_data = EmployeeCreate(
            name="田中太郎",
            name_kana="タナカタロウ",
            email="tanaka@example.com",
            factory_id=sample_factory.id,
            position="作業員"
        )
        
        # Act
        employee = service.create_employee(employee_data)
        
        # Assert
        assert employee.id is not None
        assert employee.name == "田中太郎"
        assert employee.email == "tanaka@example.com"
        assert employee.factory_id == sample_factory.id
    
    def test_create_employee_duplicate_email(self, db_session):
        """Test that duplicate email raises error."""
        # Arrange
        service = EmployeeService(db_session)
        # Create first employee
        service.create_employee(EmployeeCreate(
            name="田中太郎",
            email="tanaka@example.com",
            ...
        ))
        
        # Act & Assert
        with pytest.raises(ValueError, match="Email already exists"):
            service.create_employee(EmployeeCreate(
                name="佐藤花子",
                email="tanaka@example.com",  # Duplicate!
                ...
            ))

@pytest.fixture
def sample_factory(db_session):
    """Create a sample factory for testing."""
    factory = Factory(name="Test Factory", location="Tokyo")
    db_session.add(factory)
    db_session.commit()
    return factory
```

#### Mocking Strategies
```python
from unittest.mock import Mock, patch, MagicMock

def test_ocr_with_mock(db_session):
    """Test OCR processing with mocked external service."""
    # Mock the external OCR service
    with patch('app.services.ocr_service.AzureOCRProvider') as mock_ocr:
        # Setup mock response
        mock_ocr.return_value.extract_text.return_value = {
            "employee_id": "EMP001",
            "date": "2025-11-21",
            "hours": 8
        }
        
        # Test the service
        service = TimerCardService(db_session)
        result = service.process_timer_card("test_image.jpg")
        
        # Verify mock was called correctly
        mock_ocr.return_value.extract_text.assert_called_once_with("test_image.jpg")
        assert result.employee_id == "EMP001"
```

#### Test Naming
```python
# ✅ GOOD: Descriptive test names
def test_calculate_overtime_pay_with_standard_hours():
    pass

def test_calculate_overtime_pay_with_zero_hours():
    pass

def test_calculate_overtime_pay_raises_error_for_negative_hours():
    pass

# ❌ BAD: Vague test names
def test_overtime_1():
    pass

def test_overtime_2():
    pass
```

---

## 3. Frontend Standards (TypeScript/React/Next.js)

### 3.1 Code Organization

#### Directory Structure
```
frontend/
├── app/                     # Next.js 13+ App Router
│   ├── (auth)/
│   │   ├── login/
│   │   │   └── page.tsx
│   ├── dashboard/
│   │   ├── layout.tsx
│   │   ├── page.tsx
│   │   └── employees/
│   │       └── page.tsx
│   ├── layout.tsx          # Root layout
│   └── page.tsx            # Home page
├── components/             # React components
│   ├── ui/                # Reusable UI components
│   │   ├── button.tsx
│   │   ├── input.tsx
│   │   └── card.tsx
│   ├── employees/         # Feature components
│   │   ├── EmployeeForm.tsx
│   │   └── EmployeeList.tsx
│   └── layout/
│       ├── Header.tsx
│       └── Sidebar.tsx
├── hooks/                  # Custom React hooks
│   ├── useAuth.ts
│   └── useEmployees.ts
├── lib/                    # Utility libraries
│   ├── api.ts
│   ├── utils.ts
│   └── validations.ts
├── stores/                 # Zustand stores
│   ├── auth-store.ts
│   └── employee-store.ts
├── types/                  # TypeScript types
│   ├── api.ts
│   └── employee.ts
├── styles/                 # Global styles
│   └── globals.css
└── public/                 # Static assets
```

#### File Header Convention
```typescript
// frontend/components/employees/EmployeeForm.tsx
/**
 * Employee form component for creating/editing employee records.
 * Handles validation, submission, and error states.
 */
```

### 3.2 Naming Conventions

```typescript
// ✅ GOOD: Consistent naming

// Components (PascalCase)
const EmployeeForm: React.FC = () => { };
const UserProfile: React.FC = () => { };

// Functions and variables (camelCase)
const calculateTotalSalary = (base: number, bonus: number) => base + bonus;
const employeeName = "田中太郎";
const isActive = true;

// Constants (UPPER_CASE)
const MAX_UPLOAD_SIZE = 5 * 1024 * 1024; // 5MB
const API_BASE_URL = "http://localhost:8000";
const DEFAULT_PAGE_SIZE = 20;

// Interfaces/Types (PascalCase)
interface Employee {
  id: number;
  name: string;
}

type EmployeeStatus = "active" | "inactive" | "pending";

// File names
// Components: PascalCase
EmployeeForm.tsx
UserProfile.tsx

// Utilities: camelCase  
validations.ts
apiClient.ts

// CSS classes: kebab-case
.employee-card { }
.user-profile-header { }
```

### 3.3 Component Structure

#### Functional Components (Required)
```typescript
// frontend/components/employees/EmployeeCard.tsx
import { FC } from 'react';

interface EmployeeCardProps {
  employee: Employee;
  onEdit: (id: number) => void;
  onDelete: (id: number) => void;
}

/**
 * Display card for employee information.
 */
export const EmployeeCard: FC<EmployeeCardProps> = ({ 
  employee, 
  onEdit, 
  onDelete 
}) => {
  // Hooks at the top
  const [isExpanded, setIsExpanded] = useState(false);
  const { formatDate } = useDateFormatter();
  
  // Event handlers
  const handleEdit = () => {
    onEdit(employee.id);
  };
  
  // Early returns
  if (!employee) {
    return <EmptyState message="No employee data" />;
  }
  
  // Main render
  return (
    <div className="employee-card">
      <h3>{employee.name}</h3>
      <p>{employee.email}</p>
      <button onClick={handleEdit}>Edit</button>
      <button onClick={() => onDelete(employee.id)}>Delete</button>
    </div>
  );
};
```

#### Custom Hooks Pattern
```typescript
// frontend/hooks/useEmployees.ts
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import type { Employee, EmployeeCreate } from '@/types/employee';

interface UseEmployeesOptions {
  factoryId?: number;
  page?: number;
  limit?: number;
}

export function useEmployees(options: UseEmployeesOptions = {}) {
  const queryClient = useQueryClient();
  
  // Fetch employees
  const { data, isLoading, error } = useQuery({
    queryKey: ['employees', options],
    queryFn: () => api.getEmployees(options),
  });
  
  // Create employee mutation
  const createMutation = useMutation({
    mutationFn: (employee: EmployeeCreate) => api.createEmployee(employee),
    onSuccess: () => {
      // Invalidate and refetch
      queryClient.invalidateQueries({ queryKey: ['employees'] });
    },
  });
  
  return {
    employees: data?.employees ?? [],
    total: data?.total ?? 0,
    isLoading,
    error,
    createEmployee: createMutation.mutate,
    isCreating: createMutation.isPending,
  };
}

// Usage in component
const EmployeeList: FC = () => {
  const { employees, isLoading, createEmployee } = useEmployees({ 
    factoryId: 1 
  });
  
  if (isLoading) return <LoadingSkeleton />;
  
  return (
    <div>
      {employees.map(emp => <EmployeeCard key={emp.id} employee={emp} />)}
    </div>
  );
};
```

### 3.4 Type Safety (TypeScript Strict Mode)

#### Complete Type Definitions
```typescript
// frontend/types/employee.ts

// Base interface
export interface Employee {
  id: number;
  name: string;
  nameKana: string;
  email: string;
  phone?: string;
  factoryId: number;
  position: string;
  hireDate: string;
  createdAt: string;
  updatedAt: string;
}

// Create DTO (omit generated fields)
export type EmployeeCreate = Omit<Employee, 'id' | 'createdAt' | 'updatedAt'>;

// Update DTO (all fields optional except id)
export type EmployeeUpdate = Partial<EmployeeCreate> & { id: number };

// API Response wrapper
export interface EmployeeListResponse {
  employees: Employee[];
  total: number;
  page: number;
  limit: number;
}

// Discriminated union for status
export type EmployeeStatus = 
  | { type: 'active'; lastActivity: string }
  | { type: 'inactive'; reason: string }
  | { type: 'pending'; approvalDate?: string };

// Generic API response
export interface ApiResponse<T> {
  data: T;
  message: string;
  status: 'success' | 'error';
}

// Type guards
export function isActiveEmployee(
  status: EmployeeStatus
): status is Extract<EmployeeStatus, { type: 'active' }> {
  return status.type === 'active';
}
```

#### Utility Types Usage
```typescript
// ✅ GOOD: Using TypeScript utility types

// Pick specific fields
type EmployeeSummary = Pick<Employee, 'id' | 'name' | 'email'>;

// Exclude fields
type EmployeeWithoutAudit = Omit<Employee, 'createdAt' | 'updatedAt'>;

// Make all fields optional
type PartialEmployee = Partial<Employee>;

// Make all fields required
type RequiredEmployee = Required<Employee>;

// Make all fields readonly
type ImmutableEmployee = Readonly<Employee>;

// Record type
type EmployeeMap = Record<number, Employee>;
```

### 3.5 State Management (Zustand)

```typescript
// frontend/stores/employee-store.ts
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface Employee {
  id: number;
  name: string;
  email: string;
}

interface EmployeeStore {
  // State
  employees: Employee[];
  selectedEmployee: Employee | null;
  isLoading: boolean;
  error: string | null;
  
  // Actions
  setEmployees: (employees: Employee[]) => void;
  selectEmployee: (employee: Employee | null) => void;
  addEmployee: (employee: Employee) => void;
  updateEmployee: (id: number, updates: Partial<Employee>) => void;
  deleteEmployee: (id: number) => void;
  setLoading: (isLoading: boolean) => void;
  setError: (error: string | null) => void;
  reset: () => void;
}

const initialState = {
  employees: [],
  selectedEmployee: null,
  isLoading: false,
  error: null,
};

export const useEmployeeStore = create<EmployeeStore>()(
  persist(
    (set) => ({
      ...initialState,
      
      setEmployees: (employees) => set({ employees }),
      
      selectEmployee: (employee) => set({ selectedEmployee: employee }),
      
      addEmployee: (employee) => set((state) => ({
        employees: [...state.employees, employee],
      })),
      
      updateEmployee: (id, updates) => set((state) => ({
        employees: state.employees.map((emp) =>
          emp.id === id ? { ...emp, ...updates } : emp
        ),
      })),
      
      deleteEmployee: (id) => set((state) => ({
        employees: state.employees.filter((emp) => emp.id !== id),
      })),
      
      setLoading: (isLoading) => set({ isLoading }),
      
      setError: (error) => set({ error }),
      
      reset: () => set(initialState),
    }),
    {
      name: 'employee-store',
      partialize: (state) => ({
        // Only persist selected fields
        employees: state.employees,
      }),
    }
  )
);

// Usage in components
const EmployeeList: FC = () => {
  const { employees, addEmployee, isLoading } = useEmployeeStore();
  
  return (
    <div>
      {employees.map(emp => <EmployeeCard key={emp.id} employee={emp} />)}
    </div>
  );
};
```

### 3.6 Styling (Tailwind CSS)

```typescript
// ✅ GOOD: Tailwind with proper organization
import { cn } from '@/lib/utils';

const EmployeeCard: FC<EmployeeCardProps> = ({ employee, className }) => {
  return (
    <div className={cn(
      // Layout
      "flex flex-col gap-4 p-6",
      // Appearance
      "bg-white rounded-lg shadow-md",
      // Interactive states
      "hover:shadow-lg transition-shadow duration-200",
      // Responsive
      "md:flex-row md:items-center",
      // Custom className
      className
    )}>
      <h3 className="text-lg font-semibold text-gray-900">
        {employee.name}
      </h3>
    </div>
  );
};

// ✅ GOOD: Custom utility (lib/utils.ts)
import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// ❌ BAD: Inline styles
const BadCard = () => (
  <div style={{ padding: '24px', backgroundColor: 'white' }}>
    Content
  </div>
);
```

### 3.7 Testing (Vitest + React Testing Library)

#### Component Testing
```typescript
// frontend/components/employees/__tests__/EmployeeCard.test.tsx
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { EmployeeCard } from '../EmployeeCard';
import type { Employee } from '@/types/employee';

describe('EmployeeCard', () => {
  const mockEmployee: Employee = {
    id: 1,
    name: '田中太郎',
    email: 'tanaka@example.com',
    factoryId: 1,
    position: '作業員',
    hireDate: '2024-01-01',
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
  };
  
  it('renders employee information correctly', () => {
    render(<EmployeeCard employee={mockEmployee} />);
    
    expect(screen.getByText('田中太郎')).toBeInTheDocument();
    expect(screen.getByText('tanaka@example.com')).toBeInTheDocument();
  });
  
  it('calls onEdit when edit button is clicked', () => {
    const handleEdit = vi.fn();
    render(<EmployeeCard employee={mockEmployee} onEdit={handleEdit} />);
    
    const editButton = screen.getByRole('button', { name: /edit/i });
    fireEvent.click(editButton);
    
    expect(handleEdit).toHaveBeenCalledWith(mockEmployee.id);
  });
  
  it('shows empty state when employee is null', () => {
    render(<EmployeeCard employee={null} />);
    expect(screen.getByText('No employee data')).toBeInTheDocument();
  });
});
```

#### E2E Testing (Playwright)
```typescript
// frontend/e2e/employees.spec.ts
import { test, expect } from '@playwright/test';

test.describe('Employee Management', () => {
  test.beforeEach(async ({ page }) => {
    // Login
    await page.goto('/login');
    await page.fill('[name="email"]', 'admin@example.com');
    await page.fill('[name="password"]', 'password123');
    await page.click('button[type="submit"]');
    await expect(page).toHaveURL('/dashboard');
  });
  
  test('should display employee list', async ({ page }) => {
    await page.goto('/dashboard/employees');
    
    // Wait for employees to load
    await page.waitForSelector('[data-testid="employee-card"]');
    
    // Verify at least one employee is displayed
    const employeeCards = await page.$$('[data-testid="employee-card"]');
    expect(employeeCards.length).toBeGreaterThan(0);
  });
  
  test('should create new employee', async ({ page }) => {
    await page.goto('/dashboard/employees');
    
    // Click create button
    await page.click('button:has-text("新規作成")');
    
    // Fill form
    await page.fill('[name="name"]', '佐藤花子');
    await page.fill('[name="nameKana"]', 'サトウハナコ');
    await page.fill('[name="email"]', 'sato@example.com');
    await page.selectOption('[name="factoryId"]', '1');
    
    // Submit
    await page.click('button[type="submit"]');
    
    // Verify success message
    await expect(page.locator('text=作成しました')).toBeVisible();
  });
});
```

---

## 4. Version Control & Git

### 4.1 Commit Message Format (Conventional Commits)

```
<type>(<scope>): <subject> - @agent1 @agent2

<body>

<footer>
```

#### Types:
- **feat**: New feature
- **fix**: Bug fix
- **docs**: Documentation changes
- **style**: Code style changes (formatting, no logic change)
- **refactor**: Code refactoring
- **perf**: Performance improvements
- **test**: Adding or updating tests
- **chore**: Build process, dependencies, tooling
- **ci**: CI/CD changes

#### Examples:
```bash
feat(employees): add employee creation form - @software-engineering-expert @frontend-specialist

Implemented new employee creation form with:
- Real-time validation
- Factory selection
- Photo upload

Closes #123

---

fix(payroll): correct overtime calculation for night shift - @software-engineering-expert

Fixed overtime calculation bug where night shift premium
wasn't applied correctly to hours after midnight.

Fixes #456

---

docs(api): update API documentation for v6.0.0 - @documentation-specialist

Updated endpoint documentation with new query parameters
and response schemas.

---

refactor(database): optimize employee queries with eager loading - @database-specialist

Reduced N+1 queries by implementing eager loading for
factory relationships.

Performance improvement: 80% reduction in query count
```

### 4.2 Branch Naming

```
<type>/<ticket-number>-<short-description>

Examples:
feature/UNS-123-employee-creation-form
bugfix/UNS-456-overtime-calculation
hotfix/UNS-789-security-vulnerability
refactor/UNS-012-database-optimization
docs/UNS-345-api-documentation
```

### 4.3 Pull Request Requirements

#### PR Template
```markdown
## Description
Brief description of changes

## Type of Change
- [ ] Bug fix
- [ ] New feature
- [ ] Breaking change
- [ ] Documentation update

## Related Issues
Closes #123
Related to #456

## Changes Made
- Item 1
- Item 2
- Item 3

## Testing
- [ ] Unit tests added/updated
- [ ] Integration tests added/updated
- [ ] E2E tests added/updated
- [ ] Manual testing completed

## Checklist
- [ ] Code follows project style guidelines
- [ ] Self-review completed
- [ ] Comments added for complex logic
- [ ] Documentation updated
- [ ] No console.log or debugging code
- [ ] Type safety verified
- [ ] Security implications considered
- [ ] Performance impact assessed

## Screenshots (if applicable)
[Add screenshots here]

## Additional Notes
Any additional information
```

### 4.4 Code Review Checklist

#### Functionality
- [ ] Code meets requirements
- [ ] Edge cases handled
- [ ] Error handling comprehensive
- [ ] No hardcoded values
- [ ] Logging appropriate

#### Code Quality
- [ ] DRY principle followed
- [ ] Single responsibility maintained
- [ ] Naming clear and consistent
- [ ] Comments explain "why", not "what"
- [ ] No duplicate code

#### Testing
- [ ] Unit tests cover critical paths
- [ ] Integration tests for workflows
- [ ] Test names descriptive
- [ ] Mocks used appropriately
- [ ] Test coverage adequate (>80%)

#### Security
- [ ] Input validation present
- [ ] SQL injection prevented
- [ ] XSS prevention implemented
- [ ] Authentication/authorization correct
- [ ] Sensitive data protected

#### Performance
- [ ] No N+1 queries
- [ ] Indexes used appropriately
- [ ] Caching considered
- [ ] Large datasets handled
- [ ] Memory leaks prevented

#### Type Safety (TypeScript/Python)
- [ ] All type hints present
- [ ] No `any` types (unless justified)
- [ ] Type guards used correctly
- [ ] Interfaces well-defined
- [ ] Type errors resolved

---

## 5. Security Best Practices

### 5.1 Backend Security

#### Input Validation
```python
from pydantic import BaseModel, Field, validator, EmailStr
from typing import Optional
import re

class EmployeeCreate(BaseModel):
    name: str = Field(..., min_length=1, max_length=100)
    email: EmailStr  # Built-in email validation
    phone: Optional[str] = None
    
    @validator('name')
    def validate_name(cls, v: str) -> str:
        """Validate name contains no special characters."""
        if not re.match(r'^[a-zA-Z\u3000-\u303F\u3040-\u309F\u30A0-\u30FF\s]+$', v):
            raise ValueError('Name contains invalid characters')
        return v.strip()
    
    @validator('phone')
    def validate_phone(cls, v: Optional[str]) -> Optional[str]:
        """Validate Japanese phone number format."""
        if v is None:
            return v
        # Remove hyphens
        cleaned = v.replace('-', '').replace('−', '')
        if not re.match(r'^\d{10,11}$', cleaned):
            raise ValueError('Invalid phone number format')
        return cleaned
```

#### SQL Injection Prevention
```python
# ✅ GOOD: Parameterized queries (SQLAlchemy ORM)
from sqlalchemy import select

employee = db.query(Employee).filter(
    Employee.email == user_input_email  # Automatically escaped
).first()

# ✅ GOOD: Using text() with bound parameters
from sqlalchemy import text

result = db.execute(
    text("SELECT * FROM employees WHERE email = :email"),
    {"email": user_input_email}
)

# ❌ BAD: String interpolation (SQL injection risk!)
query = f"SELECT * FROM employees WHERE email = '{user_input_email}'"
db.execute(query)  # NEVER DO THIS
```

#### Authentication/Authorization
```python
from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from jose import JWTError, jwt
from datetime import datetime, timedelta

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="token")

def create_access_token(data: dict, expires_delta: timedelta = None) -> str:
    """Create JWT access token."""
    to_encode = data.copy()
    expire = datetime.utcnow() + (expires_delta or timedelta(minutes=15))
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, settings.SECRET_KEY, algorithm="HS256")

async def get_current_user(token: str = Depends(oauth2_scheme)) -> User:
    """Validate JWT and return current user."""
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(
            token, 
            settings.SECRET_KEY, 
            algorithms=["HS256"]
        )
        user_id: str = payload.get("sub")
        if user_id is None:
            raise credentials_exception
    except JWTError:
        raise credentials_exception
    
    user = get_user(user_id)
    if user is None:
        raise credentials_exception
    return user

def require_role(required_role: str):
    """Dependency for role-based authorization."""
    async def role_checker(current_user: User = Depends(get_current_user)):
        if current_user.role != required_role:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Insufficient permissions"
            )
        return current_user
    return role_checker

# Usage in routes
@router.post("/admin/employees")
async def create_employee(
    employee_data: EmployeeCreate,
    current_user: User = Depends(require_role("admin"))
):
    # Only admins can create employees
    pass
```

#### Secrets Management
```python
# ✅ GOOD: Environment variables
from pydantic_settings import BaseSettings
from typing import Optional

class Settings(BaseSettings):
    SECRET_KEY: str
    DATABASE_URL: str
    AZURE_OCR_KEY: str
    AZURE_OCR_ENDPOINT: str
    
    class Config:
        env_file = ".env"
        case_sensitive = True

settings = Settings()

# ❌ BAD: Hardcoded secrets
SECRET_KEY = "my-secret-key-123"  # NEVER DO THIS
DATABASE_URL = "postgresql://user:password@localhost/db"  # NEVER
```

### 5.2 Frontend Security

#### XSS Prevention
```typescript
// ✅ GOOD: React automatically escapes by default
const EmployeeCard = ({ employee }: { employee: Employee }) => {
  return (
    <div>
      <h3>{employee.name}</h3>  {/* Automatically escaped */}
      <p>{employee.email}</p>
    </div>
  );
};

// ⚠️ DANGEROUS: Using dangerouslySetInnerHTML (avoid unless necessary)
const EmployeeDescription = ({ html }: { html: string }) => {
  // Only use if HTML is sanitized!
  return <div dangerouslySetInnerHTML={{ __html: sanitizeHtml(html) }} />;
};

// ✅ GOOD: Sanitization when needed
import DOMPurify from 'dompurify';

function sanitizeHtml(dirty: string): string {
  return DOMPurify.sanitize(dirty, {
    ALLOWED_TAGS: ['b', 'i', 'em', 'strong', 'p'],
    ALLOWED_ATTR: []
  });
}
```

#### CSRF Protection
```typescript
// ✅ GOOD: Include CSRF token in requests
import axios from 'axios';

const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL,
  withCredentials: true,  // Send cookies
});

// Add CSRF token to all requests
api.interceptors.request.use((config) => {
  const csrfToken = document.querySelector('meta[name="csrf-token"]')?.getAttribute('content');
  if (csrfToken) {
    config.headers['X-CSRF-Token'] = csrfToken;
  }
  return config;
});
```

#### Secure Data Handling
```typescript
// ✅ GOOD: Don't log sensitive data
const loginUser = async (email: string, password: string) => {
  console.log('Login attempt for:', email);  // OK
  // console.log('Password:', password);  // NEVER DO THIS
  
  try {
    const response = await api.post('/auth/login', { email, password });
    console.log('Login successful');  // OK
    // console.log('Token:', response.data.token);  // AVOID
    return response.data;
  } catch (error) {
    console.error('Login failed');  // OK
    // console.error('Error:', error.response.data);  // May contain sensitive info
    throw error;
  }
};

// ✅ GOOD: Clear sensitive data from memory
const logout = () => {
  // Clear token from storage
  localStorage.removeItem('auth_token');
  sessionStorage.clear();
  
  // Clear sensitive form data
  const passwordInputs = document.querySelectorAll('input[type="password"]');
  passwordInputs.forEach(input => (input as HTMLInputElement).value = '');
};
```

---

## 6. Performance Best Practices

### 6.1 Backend Performance

#### Query Optimization
```python
# ❌ BAD: N+1 query problem
employees = db.query(Employee).all()
for employee in employees:
    print(employee.factory.name)  # Separate query for each employee!

# ✅ GOOD: Eager loading
from sqlalchemy.orm import joinedload

employees = db.query(Employee).options(
    joinedload(Employee.factory)
).all()
for employee in employees:
    print(employee.factory.name)  # No additional queries

# ✅ GOOD: Selective loading with specific columns
from sqlalchemy import select

stmt = select(Employee.id, Employee.name, Factory.name).join(
    Factory
).where(Employee.deleted_at.is_(None))
results = db.execute(stmt).all()
```

#### Caching Strategies
```python
from functools import lru_cache
from redis import Redis
import json

redis_client = Redis(host='localhost', port=6379, db=0)

# ✅ GOOD: Function-level caching
@lru_cache(maxsize=128)
def get_factory_config(factory_id: int) -> dict:
    """Cache factory configuration (rarely changes)."""
    factory = db.query(Factory).filter(Factory.id == factory_id).first()
    return factory.config

# ✅ GOOD: Redis caching for frequently accessed data
def get_employee_with_cache(employee_id: int) -> Optional[Employee]:
    """Get employee with Redis caching."""
    cache_key = f"employee:{employee_id}"
    
    # Try cache first
    cached = redis_client.get(cache_key)
    if cached:
        return Employee(**json.loads(cached))
    
    # Cache miss - fetch from DB
    employee = db.query(Employee).filter(Employee.id == employee_id).first()
    if employee:
        # Cache for 1 hour
        redis_client.setex(
            cache_key,
            3600,
            json.dumps(employee.dict())
        )
    return employee

# ✅ GOOD: Cache invalidation
def update_employee(employee_id: int, updates: dict) -> Employee:
    """Update employee and invalidate cache."""
    employee = db.query(Employee).filter(Employee.id == employee_id).first()
    for key, value in updates.items():
        setattr(employee, key, value)
    db.commit()
    
    # Invalidate cache
    redis_client.delete(f"employee:{employee_id}")
    return employee
```

#### Async Operations
```python
import asyncio
from typing import List

# ✅ GOOD: Parallel async operations
async def process_multiple_timer_cards(image_paths: List[str]) -> List[dict]:
    """Process multiple timer cards in parallel."""
    async def process_single(path: str) -> dict:
        return await ocr_service.extract_data(path)
    
    # Process all images concurrently
    results = await asyncio.gather(*[
        process_single(path) for path in image_paths
    ])
    return results

# ❌ BAD: Sequential processing
def process_multiple_timer_cards_slow(image_paths: List[str]) -> List[dict]:
    """Slow sequential processing."""
    results = []
    for path in image_paths:
        result = ocr_service.extract_data(path)  # Wait for each one
        results.append(result)
    return results
```

### 6.2 Frontend Performance

#### Code Splitting
```typescript
// ✅ GOOD: Lazy loading components
import { lazy, Suspense } from 'react';

const EmployeeForm = lazy(() => import('./components/EmployeeForm'));
const PayrollDashboard = lazy(() => import('./components/PayrollDashboard'));

const App = () => (
  <Suspense fallback={<LoadingSpinner />}>
    <EmployeeForm />
  </Suspense>
);

// ✅ GOOD: Next.js dynamic imports
import dynamic from 'next/dynamic';

const HeavyChart = dynamic(() => import('./components/HeavyChart'), {
  loading: () => <p>Loading chart...</p>,
  ssr: false  // Don't render on server
});
```

#### Memoization
```typescript
import { memo, useMemo, useCallback } from 'react';

// ✅ GOOD: Memoize expensive computations
const EmployeeList: FC<{ employees: Employee[] }> = ({ employees }) => {
  const sortedEmployees = useMemo(() => {
    return [...employees].sort((a, b) => a.name.localeCompare(b.name));
  }, [employees]);
  
  return (
    <div>
      {sortedEmployees.map(emp => <EmployeeCard key={emp.id} employee={emp} />)}
    </div>
  );
};

// ✅ GOOD: Memoize callbacks
const EmployeeForm: FC = () => {
  const [employees, setEmployees] = useState<Employee[]>([]);
  
  const handleDelete = useCallback((id: number) => {
    setEmployees(prev => prev.filter(emp => emp.id !== id));
  }, []);
  
  return (
    <EmployeeList employees={employees} onDelete={handleDelete} />
  );
};

// ✅ GOOD: Memoize components
export const EmployeeCard = memo<EmployeeCardProps>(({ employee }) => {
  return <div>{employee.name}</div>;
});
```

#### Bundle Optimization
```typescript
// ✅ GOOD: Tree shaking - import only what you need
import { formatDate, formatCurrency } from '@/lib/formatters';

// ❌ BAD: Imports entire library
import * as formatters from '@/lib/formatters';

// ✅ GOOD: Next.js image optimization
import Image from 'next/image';

const EmployeePhoto: FC<{ src: string }> = ({ src }) => (
  <Image
    src={src}
    alt="Employee photo"
    width={200}
    height={200}
    loading="lazy"
    placeholder="blur"
  />
);
```

---

## 7. Documentation Standards

### 7.1 Code Comments

#### When to Comment
```python
# ✅ GOOD: Explain "why", not "what"
def calculate_pension_deduction(salary: Decimal) -> Decimal:
    """Calculate pension deduction.
    
    Note: Uses 18.3% rate as mandated by Japanese pension law (厚生年金).
    This rate is split between employer (9.15%) and employee (9.15%).
    """
    PENSION_RATE = Decimal("0.183")
    return salary * PENSION_RATE / 2  # Employee portion only

# ❌ BAD: Obvious comments
def calculate_pension_deduction(salary: Decimal) -> Decimal:
    """Calculate pension deduction."""
    rate = Decimal("0.183")  # Set rate to 0.183
    return salary * rate / 2  # Multiply salary by rate and divide by 2

# ✅ GOOD: Explain complex logic
def parse_japanese_date(date_str: str) -> datetime:
    """Parse Japanese date formats including era names.
    
    Supports:
    - 令和5年11月21日 (Reiwa 5, Nov 21)
    - 2025/11/21
    - 2025-11-21
    
    Note: Era conversion uses lookup table because Japanese calendar
    doesn't align with Gregorian years (e.g., Reiwa 1 started May 2019).
    """
    # Complex parsing logic here...
    pass
```

### 7.2 Docstrings (Python - Google Style)

```python
def process_payroll_batch(
    factory_id: int,
    month: int,
    year: int,
    include_overtime: bool = True,
    dry_run: bool = False
) -> PayrollBatchResult:
    """Process payroll for all employees in a factory for a given month.
    
    This function performs the complete payroll calculation workflow:
    1. Fetch all active employees for the factory
    2. Calculate base salary + overtime
    3. Apply deductions (tax, insurance, pension)
    4. Generate payment records
    5. Update employee records
    
    Args:
        factory_id: ID of the factory to process payroll for
        month: Month to process (1-12)
        year: Year to process (e.g., 2025)
        include_overtime: Whether to include overtime calculations.
            Default is True. Set to False for salary-only processing.
        dry_run: If True, calculate without saving to database.
            Useful for validation and testing.
    
    Returns:
        PayrollBatchResult containing:
            - processed_count: Number of employees processed
            - total_amount: Total payroll amount
            - errors: List of any errors encountered
            - records: List of PayrollRecord objects
    
    Raises:
        FactoryNotFoundError: If factory_id doesn't exist
        InvalidDateError: If month/year combination is invalid
        PayrollAlreadyProcessedError: If payroll for this period already exists
    
    Example:
        >>> result = process_payroll_batch(
        ...     factory_id=42,
        ...     month=11,
        ...     year=2025,
        ...     include_overtime=True
        ... )
        >>> print(f"Processed {result.processed_count} employees")
        Processed 150 employees
        >>> print(f"Total: ¥{result.total_amount:,.0f}")
        Total: ¥45,000,000
    
    Note:
        This operation is idempotent when dry_run=False. Running it multiple
        times for the same period will not create duplicate records.
        
    See Also:
        - calculate_employee_salary(): Individual employee calculation
        - generate_payroll_report(): Report generation from results
    """
    pass
```

### 7.3 JSDoc (TypeScript)

```typescript
/**
 * Fetch paginated employee list with optional filtering.
 * 
 * @param options - Filter and pagination options
 * @param options.page - Page number (1-indexed)
 * @param options.limit - Number of records per page (max 1000)
 * @param options.factoryId - Filter by factory ID
 * @param options.status - Filter by employee status
 * 
 * @returns Promise resolving to employee list with pagination metadata
 * 
 * @throws {ApiError} When API request fails
 * @throws {ValidationError} When parameters are invalid
 * 
 * @example
 * ```typescript
 * const { employees, total } = await getEmployees({
 *   page: 1,
 *   limit: 20,
 *   factoryId: 42,
 *   status: 'active'
 * });
 * 
 * console.log(`Showing ${employees.length} of ${total} employees`);
 * ```
 */
export async function getEmployees(
  options: EmployeeListOptions
): Promise<EmployeeListResponse> {
  // Implementation
}

/**
 * Custom hook for managing employee form state.
 * 
 * Handles:
 * - Form validation
 * - Submission logic
 * - Error handling
 * - Loading states
 * 
 * @param employeeId - Optional employee ID for edit mode
 * @returns Form state and handlers
 * 
 * @example
 * ```typescript
 * const { 
 *   formData, 
 *   errors, 
 *   isSubmitting, 
 *   handleChange, 
 *   handleSubmit 
 * } = useEmployeeForm(42);
 * ```
 */
export function useEmployeeForm(employeeId?: number) {
  // Implementation
}
```

### 7.4 API Documentation

```python
# FastAPI automatically generates OpenAPI docs, but add descriptions

@router.post(
    "/employees",
    response_model=EmployeeResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Create new employee",
    description="""
    Create a new employee record in the system.
    
    ## Permissions
    Requires `admin` or `hr_manager` role.
    
    ## Validation Rules
    - Name: 1-100 characters
    - Email: Must be unique and valid format
    - Phone: 10-11 digits (Japanese format)
    - Factory ID: Must reference existing factory
    
    ## Business Logic
    - Automatically sends welcome email to employee
    - Creates audit log entry
    - Triggers notification to factory manager
    
    ## Rate Limiting
    10 requests per minute per user
    """,
    responses={
        201: {
            "description": "Employee created successfully",
            "content": {
                "application/json": {
                    "example": {
                        "id": 123,
                        "name": "田中太郎",
                        "email": "tanaka@example.com",
                        "created_at": "2025-11-21T10:00:00Z"
                    }
                }
            }
        },
        400: {
            "description": "Validation error or duplicate email",
        },
        401: {"description": "Authentication required"},
        403: {"description": "Insufficient permissions"},
    },
    tags=["employees"]
)
async def create_employee(
    employee_data: EmployeeCreate = Body(
        ...,
        example={
            "name": "田中太郎",
            "name_kana": "タナカタロウ",
            "email": "tanaka@example.com",
            "phone": "09012345678",
            "factory_id": 1,
            "position": "作業員"
        }
    ),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
) -> Employee:
    """Create employee endpoint handler."""
    pass
```

---

## 8. Common Anti-Patterns

### 8.1 Backend Anti-Patterns

#### God Classes/Functions
```python
# ❌ BAD: God class doing everything
class EmployeeManager:
    def create_employee(self, data): pass
    def update_employee(self, id, data): pass
    def delete_employee(self, id): pass
    def calculate_salary(self, id): pass
    def process_timer_card(self, id, image): pass
    def send_notification(self, id, message): pass
    def generate_report(self, id): pass
    def export_to_excel(self, id): pass
    # ... 50 more methods

# ✅ GOOD: Separate concerns
class EmployeeService:
    def create_employee(self, data): pass
    def update_employee(self, id, data): pass
    def get_employee(self, id): pass

class PayrollService:
    def calculate_salary(self, employee_id): pass
    def process_deductions(self, employee_id): pass

class TimerCardService:
    def process_timer_card(self, image): pass
    def extract_attendance_data(self, card): pass

class NotificationService:
    def send_email(self, to, subject, body): pass
    def send_line_message(self, to, message): pass
```

#### N+1 Queries
```python
# ❌ BAD: N+1 query problem
def get_employees_with_factories_bad(db: Session) -> List[dict]:
    employees = db.query(Employee).all()  # 1 query
    return [
        {
            "name": emp.name,
            "factory": emp.factory.name  # N queries (one per employee!)
        }
        for emp in employees
    ]

# ✅ GOOD: Eager loading
from sqlalchemy.orm import joinedload

def get_employees_with_factories_good(db: Session) -> List[dict]:
    employees = db.query(Employee).options(
        joinedload(Employee.factory)  # Single join
    ).all()
    return [
        {
            "name": emp.name,
            "factory": emp.factory.name  # No additional queries
        }
        for emp in employees
    ]
```

#### Hardcoded Values
```python
# ❌ BAD: Magic numbers and hardcoded strings
def calculate_tax(salary: Decimal) -> Decimal:
    if salary > 5000000:
        return salary * 0.23
    elif salary > 3000000:
        return salary * 0.20
    else:
        return salary * 0.10

# ✅ GOOD: Named constants
TAX_BRACKETS = [
    (5_000_000, Decimal("0.23")),  # High income
    (3_000_000, Decimal("0.20")),  # Medium income
    (0, Decimal("0.10")),          # Low income
]

def calculate_tax(salary: Decimal) -> Decimal:
    """Calculate income tax based on Japanese tax brackets."""
    for threshold, rate in TAX_BRACKETS:
        if salary > threshold:
            return salary * rate
    return Decimal("0")
```

#### Missing Error Handling
```python
# ❌ BAD: No error handling
def get_employee(employee_id: int, db: Session) -> Employee:
    return db.query(Employee).filter(Employee.id == employee_id).first()

# ✅ GOOD: Comprehensive error handling
def get_employee(employee_id: int, db: Session) -> Employee:
    """Get employee by ID with error handling."""
    if employee_id <= 0:
        raise ValueError("Employee ID must be positive")
    
    employee = db.query(Employee).filter(
        Employee.id == employee_id
    ).first()
    
    if not employee:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Employee with ID {employee_id} not found"
        )
    
    if employee.deleted_at:
        raise HTTPException(
            status_code=status.HTTP_410_GONE,
            detail=f"Employee with ID {employee_id} has been deleted"
        )
    
    return employee
```

### 8.2 Frontend Anti-Patterns

#### Prop Drilling
```typescript
// ❌ BAD: Prop drilling through multiple levels
const App = () => {
  const [user, setUser] = useState<User>();
  return <Dashboard user={user} />;
};

const Dashboard = ({ user }: { user?: User }) => {
  return <Sidebar user={user} />;
};

const Sidebar = ({ user }: { user?: User }) => {
  return <UserProfile user={user} />;
};

const UserProfile = ({ user }: { user?: User }) => {
  return <div>{user?.name}</div>;
};

// ✅ GOOD: Context API or Zustand store
import { create } from 'zustand';

const useUserStore = create<UserStore>((set) => ({
  user: null,
  setUser: (user) => set({ user }),
}));

const UserProfile = () => {
  const user = useUserStore((state) => state.user);
  return <div>{user?.name}</div>;
};
```

#### Over-Memoization
```typescript
// ❌ BAD: Unnecessary memoization
const SimpleComponent: FC<{ name: string }> = memo(({ name }) => {
  const greeting = useMemo(() => `Hello, ${name}`, [name]);  // Unnecessary
  return <div>{greeting}</div>;
});

// ✅ GOOD: Only memoize expensive operations
const ComplexComponent: FC<{ employees: Employee[] }> = ({ employees }) => {
  // This is worth memoizing - expensive sort operation
  const sortedEmployees = useMemo(() => {
    return [...employees].sort((a, b) => {
      // Complex multi-field sorting logic
      return a.name.localeCompare(b.name);
    });
  }, [employees]);
  
  return <EmployeeList employees={sortedEmployees} />;
};
```

#### State Duplication
```typescript
// ❌ BAD: Derived state stored in state
const EmployeeList: FC<{ employees: Employee[] }> = ({ employees }) => {
  const [activeEmployees, setActiveEmployees] = useState<Employee[]>([]);
  
  useEffect(() => {
    setActiveEmployees(employees.filter(emp => emp.status === 'active'));
  }, [employees]);  // Duplicates data!
  
  return <div>{activeEmployees.length}</div>;
};

// ✅ GOOD: Compute derived state on render
const EmployeeList: FC<{ employees: Employee[] }> = ({ employees }) => {
  const activeEmployees = employees.filter(emp => emp.status === 'active');
  return <div>{activeEmployees.length}</div>;
};

// ✅ GOOD: Use useMemo for expensive computations
const EmployeeList: FC<{ employees: Employee[] }> = ({ employees }) => {
  const activeEmployees = useMemo(
    () => employees.filter(emp => emp.status === 'active'),
    [employees]
  );
  return <div>{activeEmployees.length}</div>;
};
```

#### Giant Components
```typescript
// ❌ BAD: 500-line component doing everything
const EmployeeDashboard: FC = () => {
  // 50 lines of state
  // 100 lines of handlers
  // 200 lines of JSX
  // 150 lines of helper functions
  return <div>{/* Massive JSX */}</div>;
};

// ✅ GOOD: Split into smaller components
const EmployeeDashboard: FC = () => {
  return (
    <div>
      <EmployeeHeader />
      <EmployeeStats />
      <EmployeeList />
      <EmployeeActions />
    </div>
  );
};

const EmployeeHeader: FC = () => {
  // Focused on header logic
};

const EmployeeStats: FC = () => {
  // Focused on statistics
};
```

#### Missing Loading States
```typescript
// ❌ BAD: No loading state
const EmployeeList: FC = () => {
  const [employees, setEmployees] = useState<Employee[]>([]);
  
  useEffect(() => {
    api.getEmployees().then(setEmployees);
  }, []);
  
  return (
    <div>
      {employees.map(emp => <EmployeeCard key={emp.id} employee={emp} />)}
    </div>
  );
};

// ✅ GOOD: Proper loading and error states
const EmployeeList: FC = () => {
  const { employees, isLoading, error } = useEmployees();
  
  if (isLoading) {
    return <LoadingSkeleton />;
  }
  
  if (error) {
    return <ErrorState error={error} />;
  }
  
  if (employees.length === 0) {
    return <EmptyState message="No employees found" />;
  }
  
  return (
    <div>
      {employees.map(emp => <EmployeeCard key={emp.id} employee={emp} />)}
    </div>
  );
};
```

---

## 9. Tools & Automation

### 9.1 Backend Tools

#### Black (Code Formatter)
```bash
# Run Black
black backend/app

# Check without modifying
black --check backend/app

# Configuration in pyproject.toml
[tool.black]
line-length = 100
target-version = ['py311']
```

#### isort (Import Sorting)
```bash
# Run isort
isort backend/app

# Check without modifying
isort --check-only backend/app

# Configuration in pyproject.toml
[tool.isort]
profile = "black"
line_length = 100
```

#### mypy (Type Checking)
```bash
# Run mypy
mypy backend/app

# Configuration in pyproject.toml or mypy.ini
[tool.mypy]
python_version = "3.11"
warn_return_any = true
strict = true
```

#### pytest (Testing)
```bash
# Run all tests
pytest

# Run with coverage
pytest --cov=app --cov-report=html

# Run specific test file
pytest tests/test_employee_service.py

# Run tests matching pattern
pytest -k "test_employee"

# Configuration in pyproject.toml
[tool.pytest.ini_options]
testpaths = ["tests"]
python_files = ["test_*.py"]
```

### 9.2 Frontend Tools

#### Prettier (Code Formatter)
```bash
# Format all files
npm run format

# Check formatting
npm run format:check

# Configuration in .prettierrc
{
  "semi": true,
  "trailingComma": "es5",
  "singleQuote": true,
  "printWidth": 100,
  "tabWidth": 2
}
```

#### ESLint (Linting)
```bash
# Run ESLint
npm run lint

# Fix auto-fixable issues
npm run lint:fix

# Configuration in eslint.config.mjs
export default [
  nextPlugin.configs["core-web-vitals"],
  eslintConfigPrettier,
  {
    rules: {
      "@next/next/no-img-element": "off",
    },
  },
];
```

#### TypeScript Compiler (Type Checking)
```bash
# Run type checking
npm run typecheck

# Watch mode
tsc --noEmit --watch

# Configuration in tsconfig.json
{
  "compilerOptions": {
    "strict": true,
    "noImplicitAny": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true
  }
}
```

#### Vitest (Unit Testing)
```bash
# Run tests
npm test

# Watch mode
npm run test:watch

# With coverage
npm test -- --coverage
```

#### Playwright (E2E Testing)
```bash
# Run E2E tests
npm run test:e2e

# Interactive UI mode
npm run test:e2e:ui

# Debug mode
npm run test:e2e:debug

# Show report
npm run test:e2e:report
```

### 9.3 Git Hooks (Pre-commit)

```yaml
# .pre-commit-config.yaml
repos:
  - repo: https://github.com/pre-commit/pre-commit-hooks
    rev: v4.5.0
    hooks:
      - id: trailing-whitespace
      - id: end-of-file-fixer
      - id: check-yaml
      - id: check-added-large-files
        args: ['--maxkb=500']
  
  - repo: https://github.com/psf/black
    rev: 23.12.0
    hooks:
      - id: black
        files: ^backend/
  
  - repo: https://github.com/pycqa/isort
    rev: 5.13.0
    hooks:
      - id: isort
        files: ^backend/
  
  - repo: https://github.com/pre-commit/mirrors-mypy
    rev: v1.7.0
    hooks:
      - id: mypy
        files: ^backend/app/
        additional_dependencies: [pydantic, sqlalchemy, fastapi]
```

```bash
# Install pre-commit hooks
pre-commit install

# Run manually on all files
pre-commit run --all-files
```

---

## 10. Code Review Checklist

### 10.1 Functionality Checklist
- [ ] Code meets all requirements in ticket/PR
- [ ] Edge cases are handled (empty lists, null values, etc.)
- [ ] Error handling is comprehensive and user-friendly
- [ ] No hardcoded values (use config/constants)
- [ ] Logging is appropriate (info, warnings, errors)
- [ ] No commented-out code or debugging statements

### 10.2 Code Quality Checklist
- [ ] DRY principle followed (no duplicate code)
- [ ] Single Responsibility Principle maintained
- [ ] Naming is clear and consistent
- [ ] Functions are small and focused (<50 lines)
- [ ] Files are reasonable size (<350 lines)
- [ ] Comments explain "why", not "what"
- [ ] Complex logic is documented

### 10.3 Testing Checklist
- [ ] Unit tests cover critical paths (>80% coverage)
- [ ] Integration tests for complex workflows
- [ ] E2E tests for user journeys
- [ ] Test names are descriptive
- [ ] Mocks/fixtures used appropriately
- [ ] Tests are deterministic (not flaky)
- [ ] Performance tests for heavy operations

### 10.4 Security Checklist
- [ ] Input validation on all user inputs
- [ ] SQL injection prevention (parameterized queries)
- [ ] XSS prevention (proper escaping)
- [ ] Authentication/authorization correct
- [ ] Sensitive data not logged
- [ ] Secrets not in code (use env vars)
- [ ] CSRF protection on state-changing endpoints

### 10.5 Performance Checklist
- [ ] No N+1 query problems
- [ ] Database indexes used appropriately
- [ ] Caching strategy considered
- [ ] Large datasets handled efficiently
- [ ] Memory leaks prevented
- [ ] Async operations for I/O-bound tasks
- [ ] Bundle size considered (frontend)

### 10.6 Type Safety Checklist
- [ ] All Python functions have type hints
- [ ] No `any` types in TypeScript (unless justified)
- [ ] Type guards used for narrowing
- [ ] Interfaces well-defined
- [ ] No type errors in build
- [ ] Pydantic/Zod schemas for validation

---

## 11. Quick Reference Card

### Python Quick Reference
```python
# Imports (always use isort)
from __future__ import annotations
import os
from typing import Optional
from fastapi import APIRouter
from app.models.employee import Employee

# Type hints (mandatory)
def get_employee(employee_id: int) -> Optional[Employee]:
    pass

# Docstrings (Google style)
def calculate_tax(salary: Decimal) -> Decimal:
    """Calculate income tax.
    
    Args:
        salary: Annual salary amount
    
    Returns:
        Tax amount to deduct
    """
    pass

# Error handling
try:
    result = operation()
except SpecificError as e:
    logger.error("Operation failed", error=str(e))
    raise

# Logging
from app.core.logging import app_logger
app_logger.info("Processing started", employee_id=42)

# Testing
def test_employee_creation(db_session):
    employee = create_employee(data)
    assert employee.id is not None
```

### TypeScript Quick Reference
```typescript
// Type definitions (always use interfaces/types)
interface Employee {
  id: number;
  name: string;
  email: string;
}

type EmployeeCreate = Omit<Employee, 'id'>;

// Component structure
const EmployeeCard: FC<EmployeeCardProps> = ({ employee }) => {
  // Hooks first
  const [isExpanded, setIsExpanded] = useState(false);
  
  // Handlers
  const handleClick = () => setIsExpanded(!isExpanded);
  
  // Early returns
  if (!employee) return <EmptyState />;
  
  // Main render
  return <div onClick={handleClick}>{employee.name}</div>;
};

// Custom hooks
function useEmployees() {
  const { data, isLoading } = useQuery({
    queryKey: ['employees'],
    queryFn: api.getEmployees,
  });
  return { employees: data ?? [], isLoading };
}

// Error handling
try {
  await api.createEmployee(data);
} catch (error) {
  if (error instanceof ValidationError) {
    showError(error.message);
  }
  throw error;
}
```

### Git Quick Reference
```bash
# Commit format
git commit -m "feat(employees): add creation form - @software-engineering-expert

Implemented employee creation with validation"

# Branch naming
git checkout -b feature/UNS-123-employee-form

# Before committing
npm run lint && npm run typecheck && npm test

# Pre-push
npm run test:e2e
```

### Common Patterns Quick Reference

**Backend:**
- File header: `# backend/app/services/employee_service.py`
- Import order: future → stdlib → third-party → local
- Line length: 100 chars (Black)
- Type hints: Mandatory on all functions
- Testing: pytest with fixtures

**Frontend:**
- File header: `// frontend/components/EmployeeCard.tsx`
- Components: PascalCase, functional only
- Files: camelCase for utils, PascalCase for components
- State: Zustand for global, useState for local
- Testing: Vitest (unit) + Playwright (E2E)

**Database:**
- Models: SQLAlchemy with type hints
- Queries: Use ORM, avoid raw SQL
- N+1: Always use joinedload/selectinload
- Transactions: Use context managers

**Security:**
- Input: Always validate (Pydantic/Zod)
- SQL: Use parameterized queries
- Auth: JWT with proper validation
- Secrets: Environment variables only

---

## Enforcement and Compliance

### Automated Checks
1. **Pre-commit hooks** catch issues before commit
2. **CI/CD pipeline** runs all linters and tests
3. **Code coverage** must be >80% for critical modules
4. **Type checking** must pass (mypy for Python, tsc for TypeScript)
5. **Security scans** run automatically (bandit, npm audit)

### Manual Review
1. All PRs require **at least one approval**
2. Reviewers use the **Code Review Checklist** (Section 10)
3. **Security-critical** changes require security team review
4. **Performance-critical** changes require performance testing

### Continuous Improvement
1. Standards reviewed **quarterly**
2. Team feedback incorporated
3. New patterns documented as they emerge
4. Anti-patterns added when discovered

---

## Appendix: Tool Configuration Files

### pyproject.toml (Backend)
See project's `/home/user/JPUNS-Claude.6.0.2/backend/pyproject.toml`

### package.json (Frontend)
See project's `/home/user/JPUNS-Claude.6.0.2/frontend/package.json`

### eslint.config.mjs
See project's `/home/user/JPUNS-Claude.6.0.2/frontend/eslint.config.mjs`

### tsconfig.json
See project's `/home/user/JPUNS-Claude.6.0.2/frontend/tsconfig.json`

---

## Document History

| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 1.0.0 | 2025-11-21 | Software Engineering Team | Initial comprehensive standards document |

---

**End of Coding Standards Document**

*This document is a living standard. All team members are responsible for following these guidelines and suggesting improvements.*
