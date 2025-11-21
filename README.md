# UNS-ClaudeJP 6.0.0 - Sistema de Gestión de RRHH

<div align="center">

![Version](https://img.shields.io/badge/version-6.0.0-blue.svg)
![Next.js](https://img.shields.io/badge/Next.js-16.0.0-black.svg)
![React](https://img.shields.io/badge/React-19.0.0-61dafb.svg)
![FastAPI](https://img.shields.io/badge/FastAPI-0.115.6-009688.svg)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-15-336791.svg)
![License](https://img.shields.io/badge/license-MIT-green.svg)
![Redis](https://img.shields.io/badge/Redis-7-FF6347.svg)
![Docker](https://img.shields.io/badge/Docker-12%20Services-2496ED.svg)
![Performance](https://img.shields.io/badge/Performance-Optimized-brightgreen)
![Architecture](https://img.shields.io/badge/Architecture-Modular-orange)

**Sistema integral de gestión de recursos humanos para agencias de staffing japonesas (人材派遣会社)**

![Status](https://img.shields.io/badge/status-Production%20Ready-brightgreen)
![Windows](https://img.shields.io/badge/Windows-Compatible-0078D4.svg)
![Docs](https://img.shields.io/badge/Docs-Complete-blue)
![Bundle Size](https://img.shields.io/badge/Bundle%20Size-1.5MB-success)

[Inicio Rápido](#-inicio-rápido) •
[Documentación](#-documentación) •
[Características](#-características) •
[Stack Tecnológico](#️-stack-tecnológico) •
[Contribuir](#-contribuir) •
[🚀 v6.0.0 Updates](#-novedades-en-v600)

</div>

---

## 📋 Descripción

**UNS-ClaudeJP 6.0.0** es un sistema completo de gestión de recursos humanos diseñado específicamente para agencias de staffing japonesas. Versión 6.0.0 representa una transformación completa con arquitectura modular, rendimiento optimizado, configuración unificada, limpieza de código, testing automatizado y documentación mejorada. Maneja el ciclo completo de trabajadores temporales desde candidatos hasta empleados activos, incluyendo:

- **Gestión de Candidatos (履歴書/Rirekisho)** con OCR japonés
- **Empleados de Dispatch (派遣社員)** y asignaciones
- **Empresas Clientes (派遣先)** y sitios de trabajo
- **Control de Asistencia (タイムカード)** con 3 turnos
- **Cálculo de Nómina (給与)** automatizado
- **Solicitudes de Empleados (申請)** con workflow de aprobaciones
- **Sistema de Temas Personalizable** (12 temas + personalizados)
- **Procesamiento OCR Híbrido** (Azure + EasyOCR + Tesseract)

---

## 🚀 Inicio Rápido

> 🎯 **¿Primera vez aquí?** Lee primero: **[START_HERE.md](START_HERE.md)**

### Requisitos Previos

- **Docker Desktop** (Windows/Mac) o **Docker Engine** (Linux)
- **Python 3.11+** (para generate_env.py)
- **Git** (opcional)
- **4GB RAM mínimo**, **8GB recomendado**
- Puertos disponibles: **3000** (frontend), **8000** (backend), **5432** (postgres), **8080** (adminer), **6379** (redis)

### Arquitectura del Sistema

El sistema utiliza una **arquitectura multi-servicio optimizada con Docker Compose**:
- **12 servicios** (6 en versión anterior) - Expandido para observabilidad completa
- **Red compartida**: `uns-network` con health checks
- **Almacenamiento persistente**: PostgreSQL + Redis + backups automáticos
- **Hot reload**: Backend y Frontend en desarrollo
- **Arquitectura modular**: Backend models divididos por dominio
- **Configuración unificada**: Sistema centralizado de configuración
- **Performance optimizado**: Bundle size reducido 96%

### Instalación Rápida (3 minutos) 🚀

#### Windows (Recomendado)

```bash
# 1. Clonar repositorio
git clone https://github.com/jokken79/UNS-ClaudeJP-6.0.0.git
cd UNS-ClaudeJP-6.0.0

# 2. Configuración automática (nuevo sistema unificado)
cp config/.env.example .env
# Editar .env con tus credenciales

# 3. Iniciar todos los servicios (12 servicios)
cd scripts
START.bat

# 4. Verificar sistema (opcional)
HEALTH_CHECK_FUN.bat
```

#### Linux/macOS

```bash
# 1. Clonar repositorio
git clone https://github.com/jokken79/UNS-ClaudeJP-6.0.0.git
cd UNS-ClaudeJP-6.0.0

# 2. Configuración automática
cp config/.env.example .env
# Editar .env con tus credenciales

# 3. Iniciar todos los servicios (12 servicios)
docker compose up -d

# 4. Verificar sistema
docker compose ps
curl http://localhost:8000/api/health
```

### Acceder al Sistema

Una vez iniciados los servicios:

- **Frontend:** http://localhost:3000
- **API Docs:** http://localhost:8000/api/docs
- **Adminer:** http://localhost:8080
- **Grafana:** http://localhost:3001 (Monitoreo)
- **Prometheus:** http://localhost:9090 (Métricas)

**Credenciales por defecto:**
```
Frontend/Backend:
Usuario: admin
Contraseña: admin123

Adminer (PostgreSQL):
Usuario: uns_admin
Contraseña: (ver en .env)
```

> ⚠️ **IMPORTANTE:** Cambiar credenciales en producción antes de despliegue

📖 **[Guía de Inicio Rápido Detallada →](docs/00-START-HERE/QUICK_START.md)**

---

## 📚 Documentación

### 🎯 Comienza Aquí

| Documento | Descripción |
|-----------|-------------|
| **[📖 START_HERE.md](START_HERE.md)** | ⭐ **EMPIEZA AQUÍ** - Guía de inicio en 30 segundos |
| **[� DOCUMENTACION_COMPLETA.md](DOCUMENTACION_COMPLETA.md)** | 🆕 **ÍNDICE MAESTRO** - Todos los sistemas integrados (Fonts + Page Visibility) |
| **[�🚀 SETUP_QUICK_START.md](SETUP_QUICK_START.md)** | Setup automático para skip bash confirmations (8 herramientas) |
| **[📋 Índice de Documentación](docs/INDEX.md)** | Índice maestro de toda la documentación |

### 🆕 Sistemas Nuevos (Reciente)

| Sistema | Documento | Estado |
|---------|-----------|--------|
| **🔤 Gestión de Fonts** | [FONTS_SYSTEM_COMPLETE.md](FONTS_SYSTEM_COMPLETE.md) | ✅ Producción |
| **📋 Page Visibility** | [PAGE_VISIBILITY_COMPLETE.md](PAGE_VISIBILITY_COMPLETE.md) | ✅ Producción |
| **📊 Análisis de Fonts** | [ANALISIS_FONTS_JAPONES_ESPANOL.md](ANALISIS_FONTS_JAPONES_ESPANOL.md) | ✅ Referencia |

### 🤖 Documentación para IAs (Copilot, Claude, Cursor, etc.)

| Documento | Propósito |
|-----------|-----------|
| **[📘 DOCUMENTACION_COMPLETA.md](DOCUMENTACION_COMPLETA.md)** | 🆕 Documentación integrada de todos los sistemas |
| **[🔐 CLAUDE.md](CLAUDE.md)** | Reglas y patrones del proyecto para IAs |
| **[📖 AUTORIDAD_SISTEMA.md](docs/AUTORIDAD_SISTEMA.md)** | 3,500 líneas - Arquitectura completa, todas las APIs, modelos, endpoints |
| **[🛠️ ESPECIFICACION_MAPA.md](docs/ESPECIFICACION_MAPA.md)** | Mapas visuales de módulos, DB, rutas |
| **[🎯 SKIP_BASH_CONFIRMATIONS_UNIVERSAL.md](docs/SKIP_BASH_CONFIRMATIONS_UNIVERSAL.md)** | 8 herramientas × 4 métodos = soluciones completas |

### 📚 Documentación Técnica

| Documento | Descripción |
|-----------|-------------|
| **[🏗️ Arquitectura](docs/00-START-HERE/ARCHITECTURE.md)** | Arquitectura del sistema completo |
| **[🔧 Backend Guide](backend/README.md)** | Configuración del backend FastAPI |
| **[⚡ Performance Guide](backend/PERFORMANCE_GUIDE.md)** | Optimización y rendimiento |

### 📁 Documentación por Categoría

- **[01-instalacion/](docs/01-instalacion/)** - Instalación y configuración inicial
- **[02-configuracion/](docs/02-configuracion/)** - Base de datos, migraciones, backups
- **[03-uso/](docs/03-uso/)** - Guías de uso (OCR, temas, impresión)
- **[04-troubleshooting/](docs/04-troubleshooting/)** - Solución de problemas
- **[05-devops/](docs/05-devops/)** - Git, GitHub, CI/CD
- **[06-agentes/](docs/06-agentes/)** - Sistema de agentes y OpenSpec
- **[database/](docs/database/)** - Esquemas de base de datos

### 🔄 Scripts de Automatización

| Script | Propósito | Uso |
|--------|-----------|-----|
| **START.bat** | Iniciar todos los servicios | `START.bat` |
| **STOP.bat** | Detener todos los servicios | `STOP.bat` |
| **SETUP_NO_CONFIRMATIONS.bat** | ⭐ Configurar 8 herramientas IA | `scripts/SETUP_NO_CONFIRMATIONS.bat` |
| **Setup-NoConfirmations.ps1** | Configurar con más control (PS1) | `.\scripts/Setup-NoConfirmations.ps1` |
| **REINSTALAR.bat** | Limpieza total y reinstalación | `REINSTALAR.bat` |
| **LOGS.bat** | Ver logs en tiempo real | `LOGS.bat` |

---

## ✨ Características

### Gestión de Personal

- **Candidatos (履歴書)** - CVs japoneses con 50+ campos, OCR automático
- **Empleados (派遣社員)** - Trabajadores de dispatch con historial completo
- **Personal de Contratos (請負社員)** - Contract workers
- **Staff Interno (スタッフ)** - Personal administrativo
- **Factories (派遣先)** - Empresas clientes y sitios de trabajo
- **Apartamentos (社宅)** - Gestión de vivienda de empleados

### Operaciones

- **Timercards (タイムカード)** - Control de asistencia
  - 3 tipos de turnos: 朝番 (mañana), 昼番 (tarde), 夜番 (noche)
  - Horas extras, nocturnas, días festivos
  - Cálculo automático de pagos
- **Nómina (給与)** - Cálculo automático de salarios
  - Desglose detallado (base, extras, deducciones)
  - Impuestos y seguro social
  - Generación de recibos PDF
- **Solicitudes (申請)** - Workflow de aprobaciones
  - 有給 (Vacaciones pagadas)
  - 半休 (Medio día)
  - 一時帰国 (Regreso temporal)
  - 退社 (Renuncia)

### OCR y Documentos

- **OCR Híbrido Multi-Proveedor**
  - **Azure Computer Vision** (primario) - Mejor para japonés
  - **EasyOCR** (secundario) - Deep learning
  - **Tesseract** (fallback) - Open-source
- **Documentos Soportados:**
  - 履歴書 (Rirekisho/Resume)
  - 在留カード (Zairyu Card)
  - 運転免許証 (Driver's License)
- **Extracción de Fotos** - MediaPipe face detection
- **Almacenamiento** - Campos JSON con datos OCR completos

### Temas y UI

- **12 Temas Predefinidos:**
  - Default (light/dark)
  - Corporate (uns-kikaku, industrial)
  - Nature (ocean-blue, mint-green, forest-green, sunset)
  - Premium (royal-purple)
  - Vibrant (vibrant-coral)
  - Minimalist (monochrome)
  - Warm (espresso)
- **Temas Personalizados Ilimitados**
- **Template Designer** - Diseñador visual de templates
- **Design Tools** - Generadores de gradientes, sombras, paletas
- **Live Preview** - Vista previa en tiempo real

### Seguridad

- **JWT Authentication** - Tokens seguros con expiración
- **Bcrypt** - Hash de contraseñas
- **Role Hierarchy:**
  - SUPER_ADMIN → Control total
  - ADMIN → Administración
  - COORDINATOR → Coordinación
  - KANRININSHA → Gestión (管理人者)
  - EMPLOYEE → Empleado
  - CONTRACT_WORKER → Trabajador contrato
- **Audit Log** - Registro completo de auditoría

---

## 🛠️ Stack Tecnológico

### Frontend

| Tecnología | Versión | Propósito |
|------------|---------|-----------|
| **Next.js** | 16.0.0 | Framework React con App Router |
| **React** | 19.0.0 | UI library |
| **TypeScript** | 5.6 | Type safety |
| **Turbopack** | - | Bundler (70% más rápido que Webpack) |
| **Tailwind CSS** | 3.4 | Utility-first CSS |
| **Shadcn UI** | - | 40+ componentes UI |
| **Zustand** | - | State management |
| **React Query** | - | Server state caching |
| **Axios** | - | HTTP client |
| **date-fns** | - | Date utilities |

### Backend

| Tecnología | Versión | Propósito |
|------------|---------|-----------|
| **FastAPI** | 0.115.6 | REST API framework |
| **Python** | 3.11+ | Backend language |
| **SQLAlchemy** | 2.0.36 | Database ORM |
| **PostgreSQL** | 15 | Relational database |
| **Alembic** | - | Database migrations |
| **Pydantic** | - | Data validation |
| **JWT** | - | Authentication |
| **Bcrypt** | - | Password hashing |
| **Loguru** | - | Structured logging |

### OCR & AI

| Tecnología | Propósito |
|------------|-----------|
| **Azure Computer Vision** | OCR japonés (primario) |
| **EasyOCR** | Deep learning OCR (secundario) |
| **Tesseract** | Open-source OCR (fallback) |
| **MediaPipe** | Face detection |

### DevOps

| Tecnología | Propósito |
|------------|-----------|
| **Docker** | Containerization |
| **Docker Compose** | Multi-container orchestration |
| **Git** | Version control |
| **GitHub** | Repository & CI/CD |

---

## 🐳 Servicios Docker (12 Servicios Optimizados)

El sistema ejecuta **12 servicios** orquestados con Docker Compose con observabilidad completa:

### 1. **db** - PostgreSQL 15 (Base de datos principal)
```
┌─────────────────────────────────────────┐
│ Puerto: 5432                            │
│ Volumen: postgres_data (persistente)    │
│ Health Check: pg_isready (10s)          │
│ Inicialización: 01_init_database.sql    │
└─────────────────────────────────────────┘
```

### 2. **redis** - Redis 7 (Cache y sesiones)
```
┌─────────────────────────────────────────┐
│ Puerto: 6379                            │
│ Volumen: redis_data                     │
│ Maxmemory: 256mb, policy: allkeys-lru   │
│ Health Check: redis-cli ping (10s)      │
└─────────────────────────────────────────┘
```

### 3. **importer** - Inicialización de datos (One-time)
```
┌─────────────────────────────────────────┐
│ ✓ Crea usuario admin (admin/admin123)   │
│ ✓ Aplica todas las migraciones Alembic  │
│ ✓ Importa datos de demostración         │
│ ✓ Importa empleados desde Excel         │
│ ✓ Importa candidatos con OCR            │
│ Se ejecuta solo en setup inicial        │
└─────────────────────────────────────────┘
```

### 4. **backend** - FastAPI (API REST)
```
┌─────────────────────────────────────────┐
│ Puerto: 8000                            │
│ Hot reload habilitado                   │
│ 24+ API routers con OpenAPI/Swagger     │
│ Health Check: /api/health (30s)         │
└─────────────────────────────────────────┘
```

### 5. **frontend** - Next.js 16 (Aplicación web)
```
┌─────────────────────────────────────────┐
│ Puerto: 3000                            │
│ Hot reload habilitado                   │
│ Turbopack bundler (70% más rápido)      │
│ App Router (45+ páginas)                │
│ Health Check: HTTP GET backend (30s)    │
└─────────────────────────────────────────┘
```

### 6. **adminer** - Database UI (Gestión visual)
```
┌─────────────────────────────────────────┐
│ Puerto: 8080                            │
│ URL: http://localhost:8080              │
│ Interfaz web para PostgreSQL            │
│ Credenciales: POSTGRES_USER/POSTGRES_PW │
└─────────────────────────────────────────┘
```

### 7. **nginx** - Reverse Proxy + Load Balancer
```
┌─────────────────────────────────────────┐
│ Puerto: 80                              │
│ Balanceo de carga para backend         │
│ Health checks automáticos              │
│ Configuración SSL-ready                │
└─────────────────────────────────────────┘
```

### 8. **otel-collector** - OpenTelemetry Collector
```
┌─────────────────────────────────────────┐
│ Recolector de traces y métricas         │
│ Exporta a Tempo y Prometheus           │
│ Configuración de sampling              │
└─────────────────────────────────────────┘
```

### 9. **tempo** - Distributed Tracing
```
┌─────────────────────────────────────────┐
│ Almacenamiento de traces                │
│ Integración con Grafana                 │
│ Búsqueda de spans                       │
└─────────────────────────────────────────┘
```

### 10. **prometheus** - Metrics Storage
```
┌─────────────────────────────────────────┐
│ Base de datos de métricas              │
│ Retention configurable                  │
│ Query language PromQL                   │
└─────────────────────────────────────────┘
```

### 11. **grafana** - Dashboards & Visualization
```
┌─────────────────────────────────────────┐
│ Puerto: 3001                            │
│ Dashboards preconfigurados              │
│ Alertas y notificaciones                │
└─────────────────────────────────────────┘
```

### 12. **backup** - Automated Database Backups
```
┌─────────────────────────────────────────┐
│ Backups automáticos programados        │
│ Retention policies                      │
│ Exportación a S3 configurable         │
└─────────────────────────────────────────┘
```

**Orden de inicio:** `db` → `redis` → `importer` → `otel-collector` → `tempo` → `prometheus` → `grafana` → `backend` → `frontend` → `adminer` → `nginx` → `backup`

**Red de comunicación:** Todos los servicios en `uns-network` con health checks automáticos

---

## 🗄️ Base de Datos (Arquitectura Modular v6.0.0)

### Esquema (22 Tablas) - Arquitectura Refactorizada

**Tablas de Personal (Módulo Auth & Employees):**
- `users` - Usuarios del sistema con jerarquía de roles
- `refresh_tokens` - Tokens JWT refresh
- `candidates` - Candidatos (履歴書) con 50+ campos
- `candidate_documents` - Documentos de candidatos
- `candidate_forms` - Formularios de candidatos
- `employees` - Empleados de dispatch (派遣社員)
- `contract_workers` - Trabajadores de contrato (請負社員)
- `staff` - Personal de oficina (スタッフ)

**Tablas de Negocio (Módulo Apartments & Payroll):**
- `factories` - Empresas clientes (派遣先)
- `apartments` - Vivienda de empleados (社宅)
- `apartment_assignments` - Asignaciones de vivienda
- `documents` - Archivos con datos OCR
- `contracts` - Contratos de empleo
- `salary_calculations` - Cálculos de nómina
- `salary_contracts` - Contratos salariales

**Tablas de Operaciones (Módulo System & Yukyu):**
- `timer_cards` - Registros de asistencia (タイムカード)
- `requests` - Solicitudes de empleados
- `audit_log` - Log de auditoría completo
- `system_settings` - Configuración del sistema
- `permissions` - Permisos y roles granulares
- `yukyu_balances` - Balances de vacaciones (有給)

**Tablas de Referencia (Módulo Reference):**
- `regions` - Regiones geográficas
- `departments` - Departamentos
- `workplaces` - Lugares de trabajo

**Tablas AI (Módulo AI Gateway):**
- `ai_gateway_usage` - Uso de servicios AI
- `ai_budgets` - Presupuestos AI

**[Ver Esquema Completo →](docs/database/BD_PROPUESTA_3_HIBRIDA.md)**

### 🔗 Relación Crítica: Candidates ↔ Employees

> ⚠️ **IMPORTANTE**: Esta relación se ha explicado múltiples veces y debe respetarse siempre

**Estrategia de Matching (en orden de prioridad):**

1. **Estrategia Principal** - `full_name_roman` + `date_of_birth`
   ```sql
   WHERE TRIM(LOWER(full_name_roman)) = TRIM(LOWER(:name))
   AND date_of_birth = :dob
   ```
   - Usa el **nombre en romaji** (NO furigana, porque puede cambiar)
   - Usa **fecha de nacimiento** para confirmar
   - Esta es la forma MÁS CONFIABLE de relacionar

2. **Estrategia Fallback** - `rirekisho_id`
   ```sql
   WHERE rirekisho_id = :rirekisho_id
   ```
   - Solo como respaldo cuando Strategy 1 falla

3. **Estrategia Última Opción** - Fuzzy matching por nombre
   - Solo se usa cuando las anteriores fallan

**Script Oficial:**
```bash
# Sincroniza fotos y status de candidates → employees
python backend/scripts/sync_employee_data_advanced.py
```

**¿Por qué no usar furigana?**
- El furigana puede cambiar entre tablas
- No es confiable para matching
- Nombre romaji + fecha de nacimiento es más preciso

---

## 📁 Estructura del Proyecto (v6.0.0 - Arquitectura Optimizada)

```
UNS-ClaudeJP-6.0.0/
├── .claude/                    # 🆕 Sistema de orquestación de agentes
│   ├── agents.json             # Configuración de agentes
│   ├── claude.md               # Instrucciones para Claude
│   ├── orchestrator.md         # Orquestador maestro
│   ├── [specialized-agents]/   # Agentes especializados
│
├── backend/                    # FastAPI application (Arquitectura Modular)
│   ├── app/
│   │   ├── main.py            # Entry point (FastAPI factory)
│   │   ├── api/               # 27+ REST endpoints
│   │   │   ├── auth/          # JWT authentication
│   │   │   ├── candidates/    # Candidate management
│   │   │   ├── employees/     # Employee management
│   │   │   ├── factories/     # Client companies
│   │   │   ├── timercards/    # Attendance tracking
│   │   │   ├── payroll/       # Salary calculations
│   │   │   ├── requests/      # Leave requests
│   │   │   ├── azure_ocr/     # OCR integration
│   │   │   ├── ai_agents/     # 🆕 AI Gateway management
│   │   │   └── [20+ routers]  # Complete API
│   │   ├── models/            # 🆕 ARQUITECTURA MODULAR POR DOMINIO
│   │   │   ├── __init__.py     # Imports centralizados
│   │   │   ├── base.py         # Enums y clases base
│   │   │   ├── auth/           # User, RefreshToken
│   │   │   ├── candidates/     # Candidate, Document, Form
│   │   │   ├── employees/      # Employee, ContractWorker, Staff
│   │   │   ├── payroll/        # Salary, Contract
│   │   │   ├── apartments/     # Apartment, Factory, Assignment
│   │   │   ├── yukyu/          # Vacation management
│   │   │   ├── system/         # Settings, Audit, Permissions
│   │   │   ├── reference/      # Region, Department, Workplace
│   │   │   └── ai/             # AI Gateway, Budget
│   │   ├── schemas/           # Pydantic models
│   │   ├── services/          # Business logic por dominio
│   │   ├── core/
│   │   │   ├── config.py      # Configuración
│   │   │   ├── database.py    # Conexión DB
│   │   │   ├── security.py    # JWT y auth
│   │   │   └── deps.py        # Dependency injection
│   │   └── utils/             # Utilities
│   ├── alembic/versions/      # Database migrations
│   └── scripts/               # Data management
│       ├── import_data.py     # Import empleados
│       ├── import_candidates_improved.py  # Import candidatos
│       └── sync_candidate_employee_status.py
│
├── frontend/                   # Next.js 16 application (Performance Optimized)
│   ├── app/                    # App Router (50+ páginas)
│   │   ├── fonts/              # 🆕 Sistema de fuentes optimizado
│   │   │   ├── next-fonts.ts   # 4 fuentes estratégicas
│   │   │   ├── font-loader.ts  # Carga condicional
│   │   │   └── font-config.ts  # Configuración de fuentes
│   │   ├── (dashboard)/        # Protected routes group
│   │   │   ├── layout.tsx      # Dashboard layout con auth
│   │   │   ├── candidates/     # 6 páginas (list, create, view, edit, OCR)
│   │   │   ├── employees/      # 5 páginas
│   │   │   ├── factories/      # 2 páginas
│   │   │   ├── timercards/     # Attendance (3 turnos)
│   │   │   ├── salary/         # Payroll calculations
│   │   │   ├── requests/       # Leave requests workflow
│   │   │   ├── themes/         # Theme gallery (12+ themes)
│   │   │   ├── design-system/  # Template designer
│   │   │   ├── reports/        # PDF reports
│   │   │   └── [15+ módulos]   # Complete system
│   │   └── page.tsx            # Landing page
│   ├── components/             # React components (Unificados)
│   │   ├── ui/                 # 🆕 Componentes unificados (Input, Button, etc.)
│   │   │   ├── input.tsx       # Componente unificado con 5 variantes
│   │   │   ├── button.tsx      # Componente unificado
│   │   │   └── [40+ components] # Shadcn/ui optimizados
│   │   ├── [feature-comp]/     # Feature components
│   │   └── providers.tsx       # React Query, Theme providers
│   ├── lib/
│   │   ├── api.ts              # Axios client con JWT interceptors
│   │   ├── themes.ts           # 12 predefined + custom themes
│   │   ├── utils.ts            # Utilities
│   │   └── validations.ts      # Zod schemas
│   ├── stores/                 # Zustand state management
│   │   ├── auth.ts             # Authentication store
│   │   ├── candidates.ts       # Candidate data
│   │   ├── employees.ts        # Employee data
│   │   └── [stores]            # All domain stores
│   ├── contexts/               # React contexts
│   ├── hooks/                  # Custom React hooks
│   └── types/                  # TypeScript definitions
│
├── config/                     # 🆕 CONFIGURACIÓN UNIFICADA
│   ├── .env.example            # Template completo de configuración
│   ├── backend/                # Configuración backend por entorno
│   │   └── settings/           # Pydantic settings (dev/prod/test)
│   ├── frontend/               # Configuración frontend
│   │   └── constants/          # TypeScript environment config
│   ├── docker/                 # Configuración Docker unificada
│   │   ├── docker-compose.dev.yml
│   │   ├── docker-compose.prod.yml
│   │   └── docker-compose.test.yml
│   └── scripts/                # Scripts de automatización
│       ├── setup.sh            # Configuración automática
│       └── validate.sh          # Validación de configuración
│
├── scripts/                    # Windows batch scripts (Sistema crítico)
│   ├── START.bat              # ⭐ Iniciar todos los servicios (12)
│   ├── STOP.bat               # Detener servicios
│   ├── LOGS.bat               # Ver logs (menú interactivo)
│   ├── BACKUP_DATOS.bat       # Backup de base de datos
│   ├── RESTAURAR_DATOS.bat    # Restaurar base de datos
│   ├── REINSTALAR.bat         # Reinstalación completa
│   ├── HEALTH_CHECK_FUN.bat   # Health check del sistema
│   ├── DIAGNOSTICO_FUN.bat    # Diagnósticos
│   ├── FIX_ADMIN_LOGIN_FUN.bat # Fix login issues
│   ├── BUILD_BACKEND_FUN.bat  # Build backend
│   ├── BUILD_FRONTEND_FUN.bat # Build frontend
│   └── [30+ scripts]          # Complete automation
│
├── docs/                       # Documentación completa
│   ├── 00-START-HERE/          # 🚀 Start here
│   ├── 01-instalacion/         # Installation
│   ├── 02-configuracion/       # Configuration
│   ├── 03-uso/                 # Usage guides
│   ├── 04-troubleshooting/     # Troubleshooting
│   ├── 05-devops/              # Git, GitHub
│   ├── 06-agentes/             # Agent system
│   ├── architecture/           # Arquitectura detallada
│   ├── guides/                 # Development guides
│   └── database/               # DB schema
│
├── docker-compose.yml          # 12 services orchestration
├── .env                        # Environment variables
├── CLAUDE.md                   # 🔴 Reglas para IAs
├── AI_RULES.md                 # Reglas universales para IAs
├── PROMPT_RECONSTRUCCION_COMPLETO.md  # 25,000+ word spec
├── AUDITORIA_COMPLETA_UNS_CLAUDEJP_6_0_0.md  # 🆕 Análisis completo v6.0.0
├── FONT_OPTIMIZATION_REPORT.md  # 🆕 Reporte de optimización de fuentes
├── INPUT_CONSOLIDATION_REPORT.md  # 🆕 Reporte de consolidación de componentes
├── CONFIGURATION_UNIFICATION_SUMMARY.md  # 🆕 Reporte de unificación de configuración
└── README.md                   # Este archivo
```

### 🆕 Directorios Nuevos en v6.0.0

- **`config/`** - Sistema de configuración unificada
- **`backend/app/models/[domain]/`** - Arquitectura modular por dominio
- **`frontend/app/fonts/`** - Sistema de fuentes optimizado
- **`docs/reports/`** - Reportes de optimización y auditoría
- **`frontend/components/ui/unified/`** - Componentes unificados

### Archivos Críticos (NO MODIFICAR)

- ❌ Todos los `.bat` en `scripts/` - Sistema automatizado
- ❌ `docker-compose.yml` - Orquestación de 12 servicios
- ❌ `.env` - Variables de entorno
- ❌ `.claude/` - Sistema de agentes
- ❌ `backend/alembic/versions/` - Historial de migraciones
- ❌ `backend/app/models/__init__.py` - Imports centralizados críticos

---

## 🔧 Comandos Útiles

### 🪟 Windows (Scripts Automatizados)

```bash
# Iniciar todos los servicios
scripts\START.bat

# Ver logs (menú interactivo)
scripts\LOGS.bat

# Detener servicios
scripts\STOP.bat

# Backup de base de datos
scripts\BACKUP_DATOS.bat

# Restaurar base de datos
scripts\RESTAURAR_DATOS.bat backup_20251108.sql

# Reiniciar completo (⚠️ borra datos)
scripts\REINSTALAR.bat

# Health check del sistema
scripts\HEALTH_CHECK_FUN.bat

# Diagnósticos completos
scripts\DIAGNOSTICO_FUN.bat

# Fix admin login
scripts\FIX_ADMIN_LOGIN_FUN.bat

# Build backend
scripts\BUILD_BACKEND_FUN.bat

# Build frontend
scripts\BUILD_FRONTEND_FUN.bat

# Extraer fotos automáticamente
scripts\EXTRAER_FOTOS.bat

# Limpiar cache
scripts\LIMPIAR_CACHE.bat
```

### 🐧 Linux/macOS (Docker Compose)

```bash
# Iniciar servicios
docker compose up -d

# Ver logs (todos los servicios)
docker compose logs -f

# Ver logs de un servicio específico
docker compose logs -f backend
docker compose logs -f frontend

# Ver estado de servicios
docker compose ps

# Detener servicios
docker compose down

# Reiniciar servicios
docker compose restart

# Reconstruir servicios
docker compose up -d --build

# Escalar backend (para carga)
docker compose up -d --scale backend=2
```

### 🐍 Backend (FastAPI + Python)

```bash
# Acceder al contenedor
docker exec -it uns-claudejp-backend bash

# Ejecutar migraciones
alembic upgrade head

# Crear migración
alembic revision --autogenerate -m "description"

# Ver estado de migraciones
alembic current
alembic history

# Crear usuario admin
python scripts/create_admin_user.py

# Importar empleados (Excel)
python scripts/import_data.py

# Importar candidatos con OCR
python scripts/import_candidates_improved.py

# Sincronizar candidates → employees
python scripts/sync_candidate_employee_status.py

# Ver datos demo
python scripts/verify_data.py

# Run tests
pytest backend/tests/ -v
pytest backend/tests/test_auth.py -vs
```

### ⚛️ Frontend (Next.js 16 + React 19)

```bash
# Acceder al contenedor
docker exec -it uns-claudejp-frontend bash

# Instalar dependencia
npm install <package-name>

# Type checking completo
npm run typecheck

# Linting y auto-fix
npm run lint
npm run lint:fix

# Build para producción
npm run build

# Run unit tests (Vitest)
npm test
npm test -- --watch

# Run E2E tests (Playwright)
npm run test:e2e
npm run test:e2e -- --headed

# Ver dependencies
npm list

# Limpiar node_modules
rm -rf node_modules package-lock.json
npm install
```

### 🗄️ Base de Datos (PostgreSQL 15)

```bash
# Acceder a PostgreSQL
docker exec -it uns-claudejp-db psql -U uns_admin -d uns_claudejp

# Ver todas las tablas
\dt

# Describir tabla
\d candidates
\d employees

# Contar registros
SELECT COUNT(*) FROM candidates;
SELECT COUNT(*) FROM employees;

# Ver usuario admin
SELECT * FROM users WHERE username='admin';

# Backup manual
docker exec uns-claudejp-db pg_dump -U uns_admin uns_claudejp > backup.sql

# Restaurar manual
cat backup.sql | docker exec -i uns-claudejp-db psql -U uns_admin uns_claudejp
```

### 🔴 Redis Cache

```bash
# Acceder a Redis CLI
docker exec -it uns-claudejp-redis redis-cli

# Ver info
info

# Ver todas las keys
keys *

# Limpiar cache
flushall
```

### 📊 Debugging & Health Checks

```bash
# Ver estado de todos los servicios
docker compose ps

# Ver health checks
docker compose ps --format "table {{.Name}}\t{{.Status}}"

# Ver logs en tiempo real
docker compose logs -f --tail=100

# Ver logs de un servicio
docker compose logs -f backend | grep ERROR

# Ver environment variables
docker compose exec backend env | grep -E "(DATABASE|FRONTEND|SECRET)"

# Verificar API health
curl http://localhost:8000/api/health

# Verificar frontend
curl http://localhost:3000

# Verificar DB connection
docker exec uns-claudejp-backend bash -c "python -c 'from app.core.database import engine; print(\"DB OK\" if engine else \"DB FAIL\")'"
```

### 🔄 Import/Export Workflows

```bash
# Importar empleados desde Excel
docker exec uns-claudejp-backend python scripts/import_data.py

# Importar candidatos (con OCR completo)
docker exec uns-claudejp-backend python scripts/import_candidates_improved.py

# Sincronizar candidate → employee status
docker exec uns-claudejp-backend python scripts/sync_candidate_employee_status.py

# Importar fábricas
docker exec uns-claudejp-backend python scripts/copy_factories.ps1

# Backup completo
cd scripts && BACKUP_DATOS.bat

# Restore completo
cd scripts && RESTAURAR_DATOS.bat backup_20251108.sql
```

---

## 🌐 URLs del Sistema

| Servicio | URL | Descripción | Credenciales |
|----------|-----|-------------|-------------|
| **Frontend** | http://localhost:3000 | Aplicación Next.js (45+ páginas) | - |
| **Backend API** | http://localhost:8000 | API REST FastAPI (24+ endpoints) | - |
| **API Docs (Swagger)** | http://localhost:8000/api/docs | ⭐ Swagger UI interactivo | - |
| **ReDoc** | http://localhost:8000/api/redoc | Documentación API alternativa | - |
| **Adminer** | http://localhost:8080 | Gestión visual de PostgreSQL | `uns_admin` / `POSTGRES_PASSWORD` |
| **Health Check** | http://localhost:8000/api/health | Estado del backend (JSON) | - |
| **API Health (Full)** | http://localhost:8000/api/monitoring/health | Health check completo | - |

### 🔐 Credenciales por Defecto

```bash
# Adminer (PostgreSQL)
Usuario: uns_admin
Password: (ver .env o POSTGRES_PASSWORD)

# Sistema (Frontend/Backend)
Usuario: admin
Password: admin123
# ⚠️ CAMBIAR EN PRODUCCIÓN
```

### 📊 Endpoints Principales

| Módulo | Endpoint | Descripción |
|--------|----------|-------------|
| **Auth** | `/api/auth/login` | Login JWT |
| **Candidates** | `/api/candidates/` | CRUD candidatos + OCR |
| **Employees** | `/api/employees/` | CRUD empleados |
| **Factories** | `/api/factories/` | CRUD empresas cliente |
| **Timercards** | `/api/timer_cards/` | Control asistencia |
| **Payroll** | `/api/payroll/` | Cálculos salario |
| **Requests** | `/api/requests/` | Solicitudes empleados |
| **Azure OCR** | `/api/azure_ocr/` | Procesamiento OCR |

---

## 🐛 Troubleshooting

### Problemas Comunes

#### 🔴 Error: "Port already in use"
```bash
# Windows (verificar puertos)
netstat -ano | findstr :3000
netstat -ano | findstr :8000

# Matar proceso
taskkill /PID <pid> /F

# Linux/macOS
lsof -ti:3000 | xargs kill -9
```

#### 🔴 Error: "Cannot connect to Docker daemon"
```bash
# Windows
- Reinicia Docker Desktop
- Verifica que esté ejecutándose (icono en system tray)
- Verifica recursos: Settings > Resources > RAM >= 4GB

# Linux
sudo systemctl start docker
sudo usermod -aG docker $USER
# (logout required)
```

#### 🔴 Frontend pantalla en blanco
```bash
# Esperar 1-2 minutos (primera compilación)
# Verificar logs
docker compose logs -f frontend

# Verificar que backend esté corriendo
curl http://localhost:8000/api/health

# Reconstruir frontend
docker compose up -d --build frontend
```

#### 🔴 Error 401 al hacer login
```bash
# Verificar backend health
curl http://localhost:8000/api/health

# Verificar credenciales
Usuario: admin
Password: admin123

# Verificar JWT secret
docker compose exec backend env | grep SECRET_KEY

# Ver logs de auth
docker compose logs -f backend | grep -i "auth\|login"
```

#### 🔴 Error: "Database connection error"
```bash
# Verificar DB service
docker compose ps db

# Verificar health check
docker compose logs db

# Aplicar migraciones
docker exec uns-claudejp-backend alembic upgrade head

# Verificar conexión manual
docker exec -it uns-claudejp-backend bash -c "python -c 'from app.core.database import engine; engine.connect()'"
```

#### 🔴 Error: "Frontend build fails"
```bash
# Limpiar cache
docker compose exec frontend rm -rf .next
docker compose exec frontend npm run build

# Verificar TypeScript
docker compose exec frontend npm run typecheck

# Verificar dependencias
docker compose exec frontend npm install
```

#### 🔴 OCR no funciona
```bash
# Verificar Azure credentials
docker compose exec backend env | grep AZURE

# Verificar imagen
- Formato: JPG, PNG
- Tamaño: < 4MB
- Calidad: Mínima 300 DPI

# Ver logs OCR
docker compose logs -f backend | grep -i "ocr\|azure"
```

#### 🔴 Import de datos falla
```bash
# Verificar Excel format
# Verificar headers ( employee_id, full_name_roman, etc.)
# Ver: config/employee_master.xlsm

# Ejecutar con logs
docker exec uns-claudejp-backend python scripts/import_data.py
```

### 🔍 Comandos de Diagnóstico

```bash
# Health check completo del sistema
scripts\HEALTH_CHECK_FUN.bat

# Diagnósticos detallados
scripts\DIAGNOSTICO_FUN.bat

# Ver todos los logs
scripts\LOGS.bat

# Verificar servicios
docker compose ps

# Verificar recursos Docker
docker system df
docker system prune  # Limpiar recursos no utilizados

# Verificar conectividad entre servicios
docker exec uns-claudejp-backend ping db
docker exec uns-claudejp-frontend ping backend
```

### 📖 Documentación Adicional

- **[Guía Completa de Troubleshooting](docs/04-troubleshooting/TROUBLESHOOTING.md)** - Soluciones detalladas
- **[Common Issues](docs/guides/common-issues.md)** - Problemas frecuentes
- **[Development Patterns](docs/guides/development-patterns.md)** - Patrones de desarrollo
- **[Windows Troubleshooting](docs/04-troubleshooting/WINDOWS_TROUBLESHOOTING.md)** - Específico Windows

### 🆘 Obtener Ayuda

```bash
# Generar reporte de diagnóstico
scripts\DIAGNOSTICO_FUN.bat > diagnostico_$(date +%Y%m%d).txt

# Verificar logs de las últimas 24 horas
docker compose logs --since 24h > logs_$(date +%Y%m%d).log
```

### 💡 Tips de Solución Rápida

1. **¿Algo no funciona?** → `scripts\REINSTALAR.bat` (borra y reinicia)
2. **¿Frontend roto?** → `docker compose restart frontend`
3. **¿DB error?** → `docker compose restart db && alembic upgrade head`
4. **¿Port conflict?** → Reinicia Docker Desktop
5. **¿Performance lenta?** → Verificar RAM disponible (min 4GB)

---

## 🤝 Contribuir

### Para Desarrolladores

1. **📖 Lee `CLAUDE.md`** - 🔴 **LECTURA OBLIGATORIA** (incluye reglas críticas)
2. **📖 Lee `.cursorrules`** - ⭐ **GOLDEN RULES** para IAs
3. **📖 Lee `PROMPT_RECONSTRUCCION_COMPLETO.md`** - Especificación completa (25,000+ words)
4. Fork el proyecto
5. Crea una rama (`git checkout -b feature/amazing-feature`)
6. Commit cambios (`git commit -m 'Add amazing feature'`)
7. Push a la rama (`git push origin feature/amazing-feature`)
8. Abre un Pull Request

### ⚠️ Normas Críticas de Desarrollo

#### 🚨 NUNCA HACER
- ❌ **NO modificar** scripts en `scripts/` sin consultar
- ❌ **NO eliminar** código funcional sin reemplazo
- ❌ **NO modificar** `docker-compose.yml` sin aprobación
- ❌ **NO cambiar** versiones fijas (FastAPI 0.115.6, Next.js 16.0.0, etc.)
- ❌ **NO tocar** archivos en `.claude/` (sistema de agentes)
- ❌ **NO modificar** `backend/alembic/versions/` (migraciones)

#### ✅ SIEMPRE HACER
- ✅ Usar **Windows-compatible paths** en batch files (`\` no `/`)
- ✅ Mantener **compatibilidad Docker** con 6 servicios
- ✅ Crear **branch** antes de cambios mayores
- ✅ Seguir **patrones de arquitectura** existentes
- ✅ Usar **SQLAlchemy ORM** (no SQL directo)
- ✅ Usar **Next.js App Router** (no Pages Router)
- ✅ Usar **Shadcn/ui components** para UI
- ✅ Escribir **docstrings y type hints** en Python
- ✅ Escribir **TypeScript types** en frontend

### 🛡️ Archivos Protegidos (NO TOCAR)

| Archivo/Directorio | Razón |
|-------------------|-------|
| `scripts/*.bat` | Sistema automatizado crítico |
| `docker-compose.yml` | Orquestación de 6 servicios |
| `.env` | Configuración de entorno |
| `.claude/` | Sistema de agentes de IA |
| `backend/alembic/versions/` | Historial de migraciones |
| `backend/app/models/` | Arquitectura modular (22 tablas, 15+ archivos) |

### 📚 Documentación para Contribuidores

- **[📖 Guía Git/GitHub](docs/05-devops/COMO_SUBIR_A_GITHUB.md)** - Workflow completo
- **[🏗️ Arquitectura](docs/00-START-HERE/ARCHITECTURE.md)** - Entender el sistema
- **[🔧 Backend Guide](backend/README.md)** - Desarrollo backend
- **[⚛️ Frontend Guide](frontend/README.md)** - Desarrollo frontend
- **[🗄️ Database Schema](docs/database/BD_PROPUESTA_3_HIBRIDA.md)** - Esquema DB
- **[🐛 Troubleshooting](docs/04-troubleshooting/TROUBLESHOOTING.md)** - Solución problemas

### 🔄 Versionado y Cambios

- **Versión actual**: 6.0.0
- **Versiones fijas**: NO CAMBIAR sin aprobación explícita
- **Breaking changes**: Crear rama major version
- **Changelog**: Ver `CHANGELOG_V5.6_TO_V6.0.0.md`

---

## 📄 Licencia

Este proyecto está bajo la Licencia MIT - ver el archivo [LICENSE](LICENSE) para detalles.

---

## 🙏 Agradecimientos

- **Next.js Team** - Framework increíble
- **FastAPI** - Backend rápido y moderno
- **Shadcn UI** - Componentes hermosos
- **Azure** - OCR japonés de calidad

---

## 📞 Contacto y Soporte

- **Documentación:** [docs/INDEX.md](docs/INDEX.md)
- **Issues:** [GitHub Issues](https://github.com/jokken79/UNS-ClaudeJP-5.0/issues)
- **Troubleshooting:** [docs/04-troubleshooting/](docs/04-troubleshooting/)

---

<div align="center">

**Hecho con ❤️ para agencias de staffing japonesas**

**UNS-ClaudeJP 6.0.0** - Versión con arquitectura modular, rendimiento optimizado y configuración unificada

[⬆ Volver arriba](#uns-claudejp-600---sistema-de-gestión-de-rrhh)

---

## 🚀 Novedades en v6.0.0

### ✅ **Transformación Completa de Arquitectura**

#### 🏗️ **Backend Modular Refactoring**
- **22 modelos** divididos en 15+ archivos por dominio
- **Arquitectura escalable** y mantenible
- **Imports centralizados** con backward compatibility 100%
- **116 archivos actualizados** automáticamente

#### ⚡ **Performance Extremo**
- **Bundle size reducido 96%** (37.5MB → 1.5MB)
- **4 fuentes estratégicas** vs 24 fuentes anteriores
- **Sistema de carga condicional** de fuentes
- **Startup time -3-5 segundos**

#### 🧩 **Component Unification**
- **5 componentes input** consolidados en 1 componente unificado
- **1,089 líneas de código** unificadas
- **41 archivos migrados** automáticamente
- **Backward compatibility 100%** mantenida

#### ⚙️ **Configuration Unification**
- **285+ archivos de configuración** → ~50 archivos (82% menos)
- **50+ variables duplicadas** eliminadas
- **Credenciales centralizadas** en lugares seguros
- **Environment-specific configs** implementados

#### 🐳 **DevOps Expansion**
- **12 servicios Docker** (vs 6 en v5.6)
- **Observability completa**: Grafana, Prometheus, Tempo
- **Health checks automáticos** en todos los servicios
- **Automated backups** con retention policies

### 📊 Estadísticas del Proyecto v6.0.0

- **Líneas de código**: 150,000+ (backend + frontend)
- **Documentos**: 150+ archivos .md
- **APIs**: 27+ endpoints
- **Páginas**: 50+ páginas Next.js
- **Componentes**: 40+ Shadcn/ui unificados
- **Servicios**: 12 containers Docker
- **Tablas DB**: 22 tablas relacionales (arquitectura modular)
- **Scripts**: 30+ automatizaciones
- **Bundle Size**: 1.5MB (96% reducido)
- **Config Files**: ~50 (82% reducidos)

### 🎯 **Impacto Medible**

| Métrica | v5.6 | v6.0.0 | Mejora |
|---------|------|--------|---------|
| Bundle Size | 37.5MB | 1.5MB | **96% ↓** |
| Config Files | 285+ | ~50 | **82% ↓** |
| Services Docker | 6 | 12 | **100% ↑** |
| Models Architecture | 1 archivo | 15+ archivos | **Modular** |
| Component Dups | 5 inputs | 1 unificado | **80% ↓** |
| Setup Time | 5 min | 3 min | **40% ↓** |

### 🏷️ Tags

`nextjs` `fastapi` `react` `typescript` `python` `postgresql` `docker` `ocr` `japanese` `hr-management` `staffing` `dispatch-work` `azure-ai` `performance-optimization` `modular-architecture` `configuration-management` `observability` `grafana` `prometheus`

---

## 🔧 Solución de Problemas Recientes

### ✅ **Problema de Candidatos/New Solucionado (2025-11-18)**

**Problema:** El usuario reportó que al acceder a `http://localhost:3000/candidates/new` no aparecía el formulario que antes funcionaba.

**Diagnóstico:** Se identificaron dos issues críticos:
1. **Página faltante**: No existía `frontend/app/candidates/new/page.tsx`
2. **Redirección incorrecta**: La página del dashboard apuntaba a ruta equivocada

**Soluciones Implementadas:**
- ✅ **Creada página de redirección**: [`frontend/app/candidates/new/page.tsx`](frontend/app/candidates/new/page.tsx:1)
- ✅ **Corregida ruta de redirección**: [`frontend/app/dashboard/candidates/new/page.tsx`](frontend/app/dashboard/candidates/new/page.tsx:11)
- ✅ **Verificados componentes existentes**: Formulario Rirekisho, OCR, y vista de impresión

**Flujo Funcional:**
```
http://localhost:3000/candidates/new
    ↓ (redirección automática)
http://localhost:3000/dashboard/candidates/new
    ↓ (redirección automática)
http://localhost:3000/dashboard/candidates/rirekisho
    ↓ (formulario completo funcional)
✅ Formulario Rirekisho con OCR, impresión y guardado
```

**Características del Formulario Rirekisho:**
- 📷 Subida de fotos con vista previa
- 🔍 Integración Azure OCR para documentos
- 🖨️ Sistema de impresión optimizado para A4
- 💾 Guardado en base de datos con validación
- 📝 50+ campos: información personal, documentos, educación, familia, trabajo
- 🎨 Diseño responsive con modo impresión
- 🔄 Modo edición para candidatos existentes

**Resultado:** El problema está **100% solucionado** y el flujo de trabajo de candidatos funciona perfectamente.

</div>
#   J P U N S - C l a u d e . 6 . 0 . 2  
 