# CLAUDE_BACKEND.md - Guía Backend

> **Guía especializada para trabajar con el Backend FastAPI**

## 🏗️ Arquitectura Backend

**Framework:** FastAPI 0.115.6 (Python 3.11+)
**ORM:** SQLAlchemy 2.0.36
**Database:** PostgreSQL 15

### Estructura de Directorios
```
backend/
├── app/
│   ├── main.py              # FastAPI app factory
│   ├── api/                 # 24+ API routers
│   │   ├── auth/            # JWT authentication
│   │   ├── candidates/      # Candidate management
│   │   ├── employees/       # Employee management
│   │   ├── factories/       # Client companies
│   │   ├── timer_cards/     # Attendance tracking
│   │   ├── payroll/         # Salary calculations
│   │   ├── requests/        # Leave requests
│   │   ├── azure_ocr/       # OCR integration
│   │   └── [15+ routers]
│   ├── models/
│   │   └── models.py        # SQLAlchemy ORM (703+ líneas, 13 tablas)
│   ├── schemas/             # Pydantic models
│   ├── services/            # Business logic
│   ├── core/
│   │   ├── config.py        # Configuration
│   │   ├── database.py      # DB connection
│   │   ├── security.py      # JWT & auth
│   │   └── deps.py          # Dependency injection
│   └── utils/               # Utilities
├── alembic/versions/        # Database migrations
└── scripts/                 # Data management
```

## 🔧 Comandos Esenciales

### Development
```bash
# Acceder al contenedor
docker exec -it uns-claudejp-backend bash

# Dentro del contenedor
cd /app

# Run server (con hot reload)
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000

# Tests
pytest backend/tests/ -v
pytest backend/tests/test_auth.py -vs
pytest -k "test_login" -vs

# Coverage
pytest --cov=app backend/tests/
```

### Database Migrations
```bash
# Aplicar migraciones
alembic upgrade head

# Crear migración
alembic revision --autogenerate -m "description"

# Rollback
alembic downgrade -1

# Ver estado
alembic current
alembic history
alembic heads
```

### Data Management
```bash
# Crear usuario admin
python scripts/create_admin_user.py

# Importar empleados (Excel)
python scripts/import_data.py

# Importar candidatos
python scripts/import_candidates_improved.py

# Sincronizar candidates → employees
python scripts/sync_candidate_employee_status.py

# Verificar datos
python scripts/verify_data.py
```

## 🗄️ Base de Datos

### 13 Tablas
**Personnel:** users, candidates, employees, contract_workers, staff
**Business:** factories, apartments, documents, contracts
**Operations:** timer_cards, salary_calculations, requests, audit_log

### Acceso Directo
```bash
# PostgreSQL
docker exec -it uns-claudejp-db psql -U uns_admin -d uns_claudejp

# Comandos útiles
\dt                              # List tables
\d candidates                    # Describe table
\d employees                     # Describe table
SELECT COUNT(*) FROM candidates; # Count records
SELECT * FROM users WHERE username='admin';  # Verify admin
\q                              # Quit
```

### Esquema
**Archivo:** `backend/app/models/models.py`
- 703+ líneas
- 13 tablas SQLAlchemy
- Triggers para business logic
- Relaciones bien definidas

## 🔌 API Endpoints (24+ Routers)

### Estructura Típica
```python
# Patrón: dependency injection con FastAPI
from fastapi import APIRouter, Depends, HTTPException
from app.core.deps import get_current_user
from app.schemas.candidate import CandidateCreate, CandidateResponse
from app.services.candidate import CandidateService

router = APIRouter(prefix="/candidates", tags=["candidates"])

@router.post("/", response_model=CandidateResponse)
async def create_candidate(
    candidate: CandidateCreate,
    service: CandidateService = Depends(),
    current_user = Depends(get_current_user)
):
    return await service.create(candidate)
```

### Principales Routers
```
/api/
├── auth/                 # JWT login, token refresh, logout
├── candidates/           # CRUD + OCR processing (履歴書)
├── employees/            # CRUD + assignment (派遣社員)
├── factories/            # CRUD client sites (派遣先)
├── timer_cards/          # Attendance tracking (タイムカード)
├── payroll/              # Payroll calculations (給与)
├── requests/             # Leave workflows (申請)
├── dashboard/            # Analytics & stats
├── azure_ocr/            # OCR endpoints
├── import_export/        # Bulk data operations
├── notifications/        # Email/LINE alerts
├── reports/              # PDF generation
├── settings/             # System configuration
├── monitoring/           # Health checks
├── database/             # DB admin tools
├── apartments/           # Housing management
├── admin/                # Admin operations
├── role_permissions/     # RBAC management
├── salary/               # Salary management
├── pages/                # Static pages
├── resilient_import/     # Resilient data import
└── deps.py               # Dependency injection
```

### Testing APIs
```bash
# Health check
curl http://localhost:8000/api/health

# Swagger UI
# http://localhost:8000/api/docs

# Login
curl -X POST http://localhost:8000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username": "admin", "password": "admin123"}'
```

## 🔐 Autenticación & Seguridad

### JWT Configuration
- **Access token:** 8 hours
- **Refresh token:** 7 days with auto-rotation
- **Device tracking:** IP, user-agent
- **Storage:** HttpOnly cookies (no localStorage)

### User Roles (6 niveles)
```
SUPER_ADMIN > ADMIN > COORDINATOR > KANRININSHA > EMPLOYEE > CONTRACT_WORKER
```

### Protected Endpoint Pattern
```python
from fastapi import APIRouter, Depends, HTTPException, status
from app.core.deps import get_current_user

router = APIRouter()

@router.get("/protected-endpoint")
async def protected_endpoint(current_user = Depends(get_current_user)):
    return {"message": f"Hello {current_user.username}"}
```

## 🔄 OCR Integration

### Hybrid System
**Cascada de providers:**
1. Azure Computer Vision (primario)
2. EasyOCR (secundario)
3. Tesseract (fallback)

### Supported Documents
- 履歴書 (Rirekisho/Resume) - 50+ fields
- 在留カード (Zairyu Card)
- 運転免許証 (Driver's License)

### OCR Endpoint
```python
POST /api/azure_ocr/process
Content-Type: multipart/form-data

# Returns:
{
  "success": true,
  "data": {...},
  "provider": "azure",
  "confidence": 0.95
}
```

## 🔗 Critical Relationship: Candidates ↔ Employees

**Matching Strategy (OBLIGATORY):**
1. **PRIMARY:** `full_name_roman` + `date_of_birth`
2. **FALLBACK:** `rirekisho_id`
3. **LAST RESORT:** Fuzzy matching

**Why NOT furigana?**
- Can change between tables
- Not reliable for matching

**Script to sync:**
```bash
python backend/scripts/sync_employee_data_advanced.py
```

## 📊 Business Logic Services

### Service Pattern
```python
# app/services/candidate.py
from app.models.models import Candidate
from app.schemas.candidate import CandidateCreate, CandidateUpdate
from app.core.database import get_db

class CandidateService:
    def __init__(self, db: Database):
        self.db = db

    async def create(self, candidate_data: CandidateCreate):
        # Business logic here
        pass
```

### Key Services
- `CandidateService` - OCR processing, validation
- `EmployeeService` - Assignment, status sync
- `TimerCardService` - Attendance calculation
- `PayrollService` - Salary calculation
- `ApartmentService` - Housing management

## 🧪 Testing

### Run All Tests
```bash
docker exec -it uns-claudejp-backend bash
cd /app
pytest backend/tests/ -v
```

### Run Specific Test
```bash
# Test file
pytest backend/tests/test_auth.py -vs

# Test pattern
pytest -k "test_login" -vs

# With markers
pytest -m "not slow" -v
```

### Test Structure
```
backend/tests/
├── conftest.py           # Test configuration
├── test_auth.py          # Authentication tests
├── test_candidates.py    # Candidate tests
├── test_employees.py     # Employee tests
└── [test files]
```

## 🐛 Debugging

### View Logs
```bash
# Container logs
docker compose logs -f backend

# With timestamps
docker compose logs -f -t backend

# Last 100 lines
docker compose logs --tail=100 backend
```

### Debug Commands
```bash
# Check DB connection
python -c "from app.core.database import engine; print('DB OK' if engine else 'DB FAIL')"

# Test auth
python -c "from app.core.security import verify_password; print(verify_password('admin123', '$2b$...'))"

# Check environment
docker compose exec backend env | grep -E "(DATABASE|SECRET|AZURE)"
```

### Common Errors

**Database Connection Error:**
```bash
# 1. Check DB service
docker compose ps db

# 2. Apply migrations
alembic upgrade head

# 3. Test connection
docker exec -it uns-claudejp-backend bash -c "python -c 'from app.core.database import engine; engine.connect()'"
```

**Import Errors:**
```bash
# Check Excel format
# Verify headers match expected field names
# Run with verbose
python scripts/import_data.py
```

## 📁 Key Files

### Configuration
- `app/core/config.py` - App settings
- `app/core/database.py` - DB connection
- `app/core/security.py` - JWT & passwords
- `app/core/deps.py` - Dependency injection

### API
- `app/api/deps.py` - API dependencies
- Each router in `app/api/*.py` - REST endpoints

### Models & Schemas
- `app/models/models.py` - DB models (703+ lines)
- `app/schemas/*.py` - Pydantic validators

### Services
- `app/services/*.py` - Business logic by domain

---

**💡 Tip:** Always use `alembic` for DB changes, never modify tables directly
**⚠️ Warning:** `app/models/models.py` is protected - never edit directly
