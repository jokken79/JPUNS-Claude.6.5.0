# Backend - UNS-ClaudeJP 6.0.0

## Descripción

Backend FastAPI para el sistema de gestión de recursos humanos UNS-ClaudeJP.

## Stack Tecnológico

- **FastAPI** 0.115.6 - Framework REST API
- **Python** 3.11+ - Lenguaje de programación
- **SQLAlchemy** 2.0.36 - ORM
- **PostgreSQL** 15 - Base de datos
- **Alembic** - Migraciones de base de datos
- **Pydantic** - Validación de datos
- **JWT** - Autenticación
- **Bcrypt** - Hash de contraseñas
- **Loguru** - Logging estructurado

## Estructura

```
backend/
├── app/
│   ├── main.py              # Entry point FastAPI
│   ├── api/                 # REST endpoints (27+ routers)
│   ├── models/              # SQLAlchemy models (arquitectura modular)
│   ├── schemas/             # Pydantic schemas
│   ├── services/            # Business logic
│   ├── core/                # Core functionality (config, database, security)
│   └── utils/               # Utilities
├── alembic/                 # Database migrations
│   └── versions/            # Migration files
├── scripts/                 # Data management scripts
├── tests/                   # Unit and integration tests
└── uploads/                 # File uploads (OCR, photos)
```

## Instalación

```bash
# Crear virtual environment
python -m venv venv
source venv/bin/activate  # Linux/macOS
venv\Scripts\activate     # Windows

# Instalar dependencias
pip install -r requirements.txt

# Configurar variables de entorno
cp .env.example .env
# Editar .env con tus credenciales

# Aplicar migraciones
alembic upgrade head

# Iniciar servidor de desarrollo
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

## Desarrollo

### Crear nueva migración

```bash
alembic revision --autogenerate -m "descripcion del cambio"
alembic upgrade head
```

### Ejecutar tests

```bash
pytest tests/ -v
pytest tests/test_auth.py -vs
```

### Import de datos

```bash
# Importar empleados desde Excel
python scripts/import_data.py

# Importar candidatos con OCR
python scripts/import_candidates_improved.py

# Sincronizar candidate → employee
python scripts/sync_candidate_employee_status.py
```

## API Documentation

- **Swagger UI**: http://localhost:8000/api/docs
- **ReDoc**: http://localhost:8000/api/redoc
- **Health Check**: http://localhost:8000/api/health

## Arquitectura Modular v6.0.0

Los modelos están organizados por dominio:

- **auth/** - User, RefreshToken
- **candidates/** - Candidate, Document, Form
- **employees/** - Employee, ContractWorker, Staff
- **payroll/** - Salary, Contract
- **apartments/** - Apartment, Factory, Assignment
- **yukyu/** - Vacation management
- **system/** - Settings, Audit, Permissions
- **reference/** - Region, Department, Workplace
- **ai/** - AI Gateway, Budget

## Variables de Entorno

Ver `.env.example` para la lista completa de variables necesarias.

Principales:
- `DATABASE_URL` - PostgreSQL connection string
- `SECRET_KEY` - JWT secret key
- `AZURE_CV_ENDPOINT` - Azure Computer Vision endpoint
- `AZURE_CV_KEY` - Azure Computer Vision key
- `FRONTEND_URL` - Frontend URL (CORS)

## Licencia

MIT License
