# UNS-ClaudeJP 5.2 - Sistema de Gestión de RRHH

<div align="center">

![Version](https://img.shields.io/badge/version-5.2.0-blue.svg)
![Next.js](https://img.shields.io/badge/Next.js-16.0.0-black.svg)
![React](https://img.shields.io/badge/React-19.0.0-61dafb.svg)
![FastAPI](https://img.shields.io/badge/FastAPI-0.115.6-009688.svg)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-15-336791.svg)
![License](https://img.shields.io/badge/license-MIT-green.svg)

**Sistema integral de gestión de recursos humanos para agencias de staffing japonesas (人材派遣会社)**

[Inicio Rápido](#-inicio-rápido) •
[Documentación](#-documentación) •
[Características](#-características) •
[Stack Tecnológico](#️-stack-tecnológico) •
[Contribuir](#-contribuir)

</div>

---

## 📋 Descripción

**UNS-ClaudeJP 5.2** es un sistema completo de gestión de recursos humanos diseñado específicamente para agencias de staffing japonesas. Maneja el ciclo completo de trabajadores temporales desde candidatos hasta empleados activos, incluyendo:

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
- **Git** (opcional)
- Puertos disponibles: **3000**, **8000**, **5432**, **8080**

### Instalación Rápida (5 minutos)

#### Windows

```bash
# 1. Clonar repositorio
git clone https://github.com/jokken79/UNS-ClaudeJP-5.0.git
cd UNS-ClaudeJP-5.0

# 2. Generar configuración
python generate_env.py

# 3. Iniciar servicios
cd scripts
START.bat
```

#### Linux/macOS

```bash
# 1. Clonar repositorio
git clone https://github.com/jokken79/UNS-ClaudeJP-5.0.git
cd UNS-ClaudeJP-5.0

# 2. Generar configuración
python3 generate_env.py

# 3. Iniciar servicios
docker compose up -d
```

### Acceder al Sistema

Una vez iniciados los servicios:

- **Frontend:** http://localhost:3000
- **API Docs:** http://localhost:8000/api/docs
- **Adminer:** http://localhost:8080

**Credenciales por defecto:**
```
Usuario: admin
Contraseña: admin123
```

> ⚠️ **IMPORTANTE:** Cambiar credenciales en producción

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

## 📦 Servicios Docker

El sistema ejecuta 5 servicios:

```
┌─────────────────────────────────────────┐
│ db (PostgreSQL 15)                      │
│ - Puerto: 5432                          │
│ - Volumen: postgres_data (persistente)  │
└─────────────────────────────────────────┘

┌─────────────────────────────────────────┐
│ backend (FastAPI)                       │
│ - Puerto: 8000                          │
│ - Hot reload habilitado                 │
│ - 15 API routers                        │
└─────────────────────────────────────────┘

┌─────────────────────────────────────────┐
│ frontend (Next.js 16)                   │
│ - Puerto: 3000                          │
│ - Hot reload habilitado                 │
│ - Turbopack bundler                     │
└─────────────────────────────────────────┘

┌─────────────────────────────────────────┐
│ adminer (Database UI)                   │
│ - Puerto: 8080                          │
│ - Interfaz web para PostgreSQL          │
└─────────────────────────────────────────┘

┌─────────────────────────────────────────┐
│ importer (One-time)                     │
│ - Crea usuario admin                    │
│ - Importa datos de demostración         │
│ - Se detiene tras completar             │
└─────────────────────────────────────────┘
```

---

## 🗄️ Base de Datos

### Esquema (13 Tablas)

**Tablas de Personal:**
- `users` - Usuarios del sistema con jerarquía de roles
- `candidates` - Candidatos (履歴書) con 50+ campos
- `employees` - Empleados de dispatch (派遣社員)
- `contract_workers` - Trabajadores de contrato (請負社員)
- `staff` - Personal de oficina (スタッフ)

**Tablas de Negocio:**
- `factories` - Empresas clientes (派遣先)
- `apartments` - Vivienda de empleados (社宅)
- `documents` - Archivos con datos OCR
- `contracts` - Contratos de empleo

**Tablas de Operaciones:**
- `timer_cards` - Registros de asistencia (タイムカード)
- `salary_calculations` - Cálculos de nómina
- `requests` - Solicitudes de empleados
- `audit_log` - Log de auditoría completo

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

## 📊 Estructura del Proyecto

```
UNS-ClaudeJP-5.0/
├── backend/              # FastAPI application
│   ├── app/
│   │   ├── main.py      # Entry point (15 routers)
│   │   ├── api/         # REST endpoints
│   │   ├── models/      # SQLAlchemy ORM (13 tables)
│   │   ├── schemas/     # Pydantic models
│   │   ├── services/    # Business logic
│   │   ├── core/        # Config, database, logging
│   │   └── utils/       # Utilities
│   ├── alembic/         # Database migrations
│   └── scripts/         # Maintenance scripts
│
├── frontend/            # Next.js 16 application
│   ├── app/             # App Router (45+ pages)
│   │   ├── (dashboard)/ # Protected routes
│   │   ├── candidates/  # 6 pages
│   │   ├── employees/   # 5 pages
│   │   ├── factories/   # 2 pages
│   │   ├── timercards/  # Attendance
│   │   ├── salary/      # Payroll
│   │   ├── requests/    # Leave requests
│   │   ├── themes/      # Theme gallery
│   │   └── customizer/  # Visual customizer
│   ├── components/      # React components
│   ├── lib/             # Libraries & utilities
│   ├── stores/          # Zustand state
│   └── types/           # TypeScript types
│
├── docs/                # Documentation
│   ├── 00-START-HERE/   # 🚀 Start here
│   ├── 01-instalacion/  # Installation
│   ├── 02-configuracion/# Configuration
│   ├── 03-uso/          # Usage guides
│   ├── 04-troubleshooting/# Problems
│   ├── 05-devops/       # Git, GitHub
│   ├── 06-agentes/      # Agents
│   ├── 97-reportes/     # Reports
│   └── database/        # DB schema
│
├── scripts/             # Windows batch scripts
│   ├── START.bat        # Start services
│   ├── STOP.bat         # Stop services
│   ├── LOGS.bat         # View logs
│   └── REINSTALAR.bat   # Reinitialize
│
├── openspec/            # OpenSpec system
├── CLAUDE.md            # 🔴 Development rules
└── docker-compose.yml   # Docker orchestration
```

---

## 🔧 Comandos Útiles

### Windows (Scripts Automatizados)

```bash
# Iniciar servicios
scripts\START.bat

# Ver logs
scripts\LOGS.bat

# Detener servicios
scripts\STOP.bat

# Reiniciar (⚠️ borra datos)
scripts\REINSTALAR.bat
```

### Linux/macOS (Docker Compose)

```bash
# Iniciar servicios
docker compose up -d

# Ver logs
docker compose logs -f

# Ver logs de un servicio
docker compose logs -f backend

# Detener servicios
docker compose down

# Reiniciar
docker compose restart

# Reconstruir
docker compose up -d --build
```

### Backend

```bash
# Acceder al contenedor
docker exec -it uns-claudejp-backend bash

# Ejecutar migraciones
alembic upgrade head

# Crear migración
alembic revision --autogenerate -m "description"

# Crear usuario admin
python scripts/create_admin_user.py

# Importar datos
python scripts/import_data.py
```

### Frontend

```bash
# Acceder al contenedor
docker exec -it uns-claudejp-frontend bash

# Instalar dependencia
npm install <package-name>

# Type checking
npm run type-check

# Linting
npm run lint
```

---

## 🌐 URLs del Sistema

| Servicio | URL | Descripción |
|----------|-----|-------------|
| **Frontend** | http://localhost:3000 | Aplicación Next.js |
| **Backend API** | http://localhost:8000 | API REST FastAPI |
| **API Docs** | http://localhost:8000/api/docs | Swagger UI interactivo |
| **ReDoc** | http://localhost:8000/api/redoc | Documentación alternativa |
| **Adminer** | http://localhost:8080 | Gestión de base de datos |
| **Health Check** | http://localhost:8000/api/health | Estado del backend |

---

## 🐛 Troubleshooting

### Problemas Comunes

**Error: "Port already in use"**
```bash
# Windows
netstat -ano | findstr "3000"
taskkill /PID <pid> /F

# Linux/macOS
lsof -ti:3000 | xargs kill -9
```

**Error: "Cannot connect to Docker daemon"**
- Asegúrate de que Docker Desktop esté ejecutándose
- Windows: Abre Docker Desktop desde el menú de inicio

**Frontend pantalla en blanco**
- La compilación puede tomar 1-2 minutos la primera vez
- Espera y refresca el navegador
- Verifica logs: `docker compose logs -f frontend`

**Error 401 al hacer login**
- Verifica backend: http://localhost:8000/api/health
- Verifica credenciales: `admin` / `admin123`
- Ver: [AUTH_ERROR_401.md](docs/issues/AUTH_ERROR_401.md)

**[Guía Completa de Troubleshooting →](docs/04-troubleshooting/TROUBLESHOOTING.md)**

---

## 🤝 Contribuir

### Para Desarrolladores

1. **Lee CLAUDE.md** - 🔴 **LECTURA OBLIGATORIA**
2. Fork el proyecto
3. Crea una rama (`git checkout -b feature/amazing-feature`)
4. Commit cambios (`git commit -m 'Add amazing feature'`)
5. Push a la rama (`git push origin feature/amazing-feature`)
6. Abre un Pull Request

### Normas de Desarrollo

- **NUNCA** modificar scripts en `scripts/` sin consultar
- **NUNCA** eliminar código funcional sin reemplazo
- **SIEMPRE** usar Windows-compatible paths en batch files
- **SIEMPRE** mantener compatibilidad Docker
- **SIEMPRE** crear branch antes de cambios mayores

**[Ver Guía Git/GitHub →](docs/05-devops/COMO_SUBIR_A_GITHUB.md)**

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

[⬆ Volver arriba](#uns-claudejp-50---sistema-de-gestión-de-rrhh)

</div>
