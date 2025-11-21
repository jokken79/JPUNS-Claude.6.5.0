# 🤖 CONTEXTO COMPLETO DEL PROYECTO - UNS-ClaudeJP v5.4

**Para**: Sistemas de Inteligencia Artificial  
**Propósito**: Contexto completo y estructurado del proyecto  
**Última actualización**: 2025-11-07

---

## 🎯 RESUMEN EJECUTIVO

**Nombre del Proyecto**: UNS-ClaudeJP  
**Versión Actual**: 5.4 (migrado desde 5.2 en noviembre 2025)  
**Tipo**: Sistema de Gestión de Recursos Humanos (HRMS)  
**Dominio**: Agencias de Personal Temporal Japonesas (人材派遣会社)  
**Usuarios Objetivo**: Coordinadores de RRHH, empleados, gerentes de agencias japonesas

---

## 🏢 CONTEXTO DE NEGOCIO

### Problema que Resuelve
Las agencias de personal japonesas necesitan gestionar:
1. **Candidatos** (履歴書 - Rirekisho): CVs en formato japonés con foto, datos personales, historial
2. **Empleados temporales** (派遣社員 - Haken Shain): Trabajadores asignados a clientes
3. **Empresas cliente** (派遣先 - Haken-saki): Fábricas y empresas que contratan personal
4. **Asistencia** (タイムカード - Time Card): Control de entrada/salida diario
5. **Nómina** (給与 - Kyūyo): Cálculo de salarios basado en horas trabajadas
6. **Solicitudes** (申請 - Shinsei): Permisos, vacaciones, cambios de turno

### Usuarios del Sistema
```
SUPER_ADMIN      → Control total del sistema
ADMIN            → Gestión general de la agencia
COORDINATOR      → Coordinadores de RRHH (día a día)
KANRININSHA      → Gerentes/管理人者 (supervisión)
EMPLOYEE         → Empleados con acceso limitado
CONTRACT_WORKER  → Trabajadores temporales (solo ver su info)
```

### Flujo de Negocio Principal
```
1. Reclutamiento
   Candidato aplica → Registro en sistema → Entrevista → Aprobación

2. Contratación
   Candidato aprobado → Empleado → Asignación a fábrica → Inicio laboral

3. Operación Diaria
   Empleado trabaja → Registra tiempo (タイムカード) → Sistema calcula horas

4. Nómina Mensual
   Fin de mes → Cálculo automático → Generación de recibos → Pago

5. Solicitudes
   Empleado solicita permiso → Aprobación coordinador → Registro en sistema
```

---

## 🏗️ ARQUITECTURA TÉCNICA DETALLADA

### Stack Tecnológico Completo

#### Frontend: Next.js 15.5 + React 19
```typescript
Framework:       Next.js 15.5 (App Router, RSC)
UI Library:      React 19.0.0
Language:        TypeScript 5.6
Styling:         Tailwind CSS 3.4 + CSS Modules
UI Components:   Radix UI (primitives) + Custom components
State:           Zustand (global) + React Query (server)
Forms:           React Hook Form + Zod validation
HTTP Client:     Axios con interceptores JWT
```

**Estructura del Frontend:**
```
/frontend/
├── app/                          # Next.js App Router
│   ├── (auth)/                   # Grupo de rutas autenticación
│   │   └── login/page.tsx        # Página de login
│   ├── (dashboard)/              # Grupo de rutas dashboard
│   │   ├── candidates/           # Gestión candidatos
│   │   ├── employees/            # Gestión empleados
│   │   ├── factories/            # Gestión fábricas
│   │   ├── timer-cards/          # Tarjetas de tiempo
│   │   ├── salary/               # Nómina
│   │   └── requests/             # Solicitudes
│   └── layout.tsx                # Layout raíz
├── components/
│   ├── ui/                       # Componentes UI reutilizables
│   ├── forms/                    # Componentes de formularios
│   ├── layout/                   # Sidebar, Header, Footer
│   └── providers.tsx             # Providers React Query + Tema
├── stores/
│   ├── authStore.ts              # Estado autenticación
│   ├── themeStore.ts             # Sistema de temas
│   └── uiStore.ts                # Estado UI general
├── lib/
│   ├── api.ts                    # Cliente API con auth
│   ├── utils.ts                  # Utilidades
│   └── theme-config.ts           # Configuración temas
└── hooks/                        # Custom hooks
    ├── useAuth.ts
    └── useTheme.ts
```

#### Backend: FastAPI 0.115+ + Python 3.11
```python
Framework:       FastAPI 0.115.6
Language:        Python 3.11+
ORM:             SQLAlchemy 2.0.36 (Async)
Database:        PostgreSQL 15
Migrations:      Alembic 1.13
Auth:            JWT (python-jose) + bcrypt
Validation:      Pydantic V2
API Docs:        OpenAPI 3.0 (Swagger UI)
```

**Estructura del Backend:**
```
/backend/
├── app/
│   ├── main.py                   # FastAPI app entry
│   ├── database.py               # DB connection + session
│   ├── api/                      # API endpoints (24 routers)
│   │   ├── auth.py               # Autenticación
│   │   ├── users.py              # Usuarios
│   │   ├── candidates.py         # Candidatos
│   │   ├── employees.py          # Empleados
│   │   ├── factories.py          # Fábricas
│   │   ├── timer_cards.py        # Tarjetas tiempo
│   │   ├── salary.py             # Nómina
│   │   ├── requests.py           # Solicitudes
│   │   └── ...                   # Más endpoints
│   ├── models/
│   │   └── models.py             # Modelos SQLAlchemy (703 líneas)
│   ├── schemas/                  # Pydantic schemas
│   ├── services/                 # Lógica de negocio
│   └── utils/                    # Utilidades
├── alembic/                      # Migraciones
│   ├── versions/                 # Archivos de migración
│   └── env.py                    # Config Alembic
├── scripts/                      # Scripts Python
│   ├── create_admin_user.py      # Crear admin
│   ├── import_data.py            # Importar datos
│   └── verify_data.py            # Verificar BD
├── tests/                        # Pruebas pytest
├── requirements.txt              # Dependencias Python
└── alembic.ini                   # Config Alembic
```

#### Base de Datos: PostgreSQL 15
```sql
-- 13 Tablas Principales --
users                 # Usuarios del sistema
candidates            # Candidatos (履歴書)
employees             # Empleados (派遣社員)
factories             # Fábricas cliente (派遣先)
timer_cards           # Tarjetas de tiempo (タイムカード)
salary                # Registros de nómina (給与)
requests              # Solicitudes (申請)
employee_files        # Archivos de empleados
factory_files         # Archivos de fábricas
candidate_files       # Archivos de candidatos
factory_contacts      # Contactos de fábricas
salary_deductions     # Deducciones de nómina
request_approvals     # Aprobaciones de solicitudes
```

**Modelo de Datos Clave (Relaciones):**
```
User (1) ───< (N) Employee
Candidate (1) ──> (1) Employee [conversión]
Employee (N) ───> (1) Factory [asignación]
Employee (1) ───< (N) TimerCard
Employee (1) ───< (N) Salary
Employee (1) ───< (N) Request
```

---

## 🔐 SISTEMA DE AUTENTICACIÓN Y SEGURIDAD

### Flujo de Autenticación JWT
```
1. Login Request
   POST /api/auth/login
   Body: { username, password }

2. Backend Verifica
   - Busca usuario en DB
   - Valida password con bcrypt
   - Genera JWT token (expira en 8h)

3. Response
   {
     access_token: "eyJ...",
     user: { id, username, role, ... },
     token_type: "bearer"
   }

4. Almacenamiento Frontend
   - localStorage: token + user data
   - Zustand store: estado en memoria
   - Axios interceptor: auto-incluye token

5. Request Autenticado
   Header: Authorization: Bearer eyJ...
   Backend valida token en cada request

6. Token Expirado (8 horas)
   - Backend retorna 401
   - Interceptor detecta 401
   - Redirect a /login
   - Limpia localStorage
```

### Niveles de Acceso por Rol
```typescript
SUPER_ADMIN: {
  candidates: 'full',      // CRUD completo
  employees: 'full',
  factories: 'full',
  salary: 'full',
  timer_cards: 'full',
  requests: 'approve',
  users: 'full',
  settings: 'full'
}

ADMIN: {
  candidates: 'full',
  employees: 'full',
  factories: 'read/update',
  salary: 'read/create',
  timer_cards: 'full',
  requests: 'approve',
  users: 'read',
  settings: 'read'
}

COORDINATOR: {
  candidates: 'full',
  employees: 'read/update',
  factories: 'read',
  salary: 'read',
  timer_cards: 'full',
  requests: 'approve',
  users: 'none',
  settings: 'none'
}

EMPLOYEE: {
  candidates: 'none',
  employees: 'read own',
  factories: 'none',
  salary: 'read own',
  timer_cards: 'read/create own',
  requests: 'create own',
  users: 'none',
  settings: 'none'
}
```

---

## 🎨 SISTEMA DE TEMAS Y DISEÑO

### Temas Predefinidos (12)
```typescript
const themes = [
  'slate', 'gray', 'zinc', 'neutral', 'stone',
  'red', 'orange', 'amber', 'yellow',
  'green', 'blue', 'purple'
];
```

### Variables CSS Dinámicas
```css
:root {
  --primary: [theme-color];
  --background: 0 0% 100%;
  --foreground: 222.2 84% 4.9%;
  --border: 214.3 31.8% 91.4%;
  /* + más variables */
}

.dark {
  --background: 222.2 84% 4.9%;
  --foreground: 210 40% 98%;
  /* ... */
}
```

### Implementación de Tema
```typescript
// stores/themeStore.ts
export const useThemeStore = create<ThemeStore>((set) => ({
  theme: 'blue',
  isDark: false,
  setTheme: (theme) => {
    set({ theme });
    document.documentElement.setAttribute('data-theme', theme);
  },
  toggleDark: () => {
    set((state) => {
      const newDark = !state.isDark;
      document.documentElement.classList.toggle('dark', newDark);
      return { isDark: newDark };
    });
  }
}));
```

---

## 📦 SISTEMA DE CONTENEDORES DOCKER

### Arquitectura Docker Compose
```yaml
services:
  db:
    image: postgres:15
    container_name: uns-claudejp-db
    ports: ["5432:5432"]
    environment:
      POSTGRES_USER: uns_admin
      POSTGRES_PASSWORD: uns_secure_password_2024
      POSTGRES_DB: uns_claudejp
    volumes:
      - postgres_data:/var/lib/postgresql/data
      - ./base-datos/01_init_database.sql:/docker-entrypoint-initdb.d/01_init_database.sql
    healthcheck:
      test: pg_isready -U uns_admin
      interval: 10s
      timeout: 5s
      retries: 5

  backend:
    build: ./docker/Dockerfile.backend
    container_name: uns-claudejp-backend
    ports: ["8000:8000"]
    depends_on:
      db: { condition: service_healthy }
    environment:
      DATABASE_URL: postgresql://uns_admin:uns_secure_password_2024@db:5432/uns_claudejp
      JWT_SECRET_KEY: your-secret-key-here-change-in-production
      JWT_ALGORITHM: HS256
      ACCESS_TOKEN_EXPIRE_MINUTES: 480
    volumes:
      - ./backend:/app
      - ./uploads:/app/uploads
    command: uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload

  frontend:
    build: ./docker/Dockerfile.frontend-nextjs
    container_name: uns-claudejp-frontend
    ports: ["3000:3000"]
    depends_on: [backend]
    environment:
      NEXT_PUBLIC_API_URL: http://localhost:8000
    volumes:
      - ./frontend:/app
      - /app/node_modules
      - /app/.next
    command: npm run dev

  importer:
    build: ./docker/Dockerfile.backend
    container_name: uns-claudejp-importer
    depends_on:
      backend: { condition: service_started }
    volumes:
      - ./backend:/app
      - ./config:/app/config
    command: python scripts/import_data.py
```

### Volúmenes Importantes
```
postgres_data:     # Persistencia de PostgreSQL
./backend:/app     # Hot reload backend
./frontend:/app    # Hot reload frontend
./uploads:/app/uploads  # Archivos subidos (compartido)
```

---

## 🚀 FLUJOS DE TRABAJO TÉCNICOS

### 1. Crear Nueva Funcionalidad (Feature)

#### Backend
```python
# 1. Definir modelo (si necesario)
# backend/app/models/models.py
class NuevaEntidad(Base):
    __tablename__ = "nueva_entidad"
    id = Column(Integer, primary_key=True, index=True)
    nombre = Column(String(255), nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)

# 2. Crear migración
# Terminal en container backend
alembic revision --autogenerate -m "Add nueva_entidad table"
alembic upgrade head

# 3. Definir schema Pydantic
# backend/app/schemas/nueva_entidad.py
class NuevaEntidadBase(BaseModel):
    nombre: str

class NuevaEntidadCreate(NuevaEntidadBase):
    pass

class NuevaEntidad(NuevaEntidadBase):
    id: int
    created_at: datetime
    
    class Config:
        from_attributes = True

# 4. Crear endpoint
# backend/app/api/nueva_entidad.py
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from ..database import get_db
from ..models import models
from ..schemas import nueva_entidad as schemas

router = APIRouter(prefix="/api/nueva-entidad", tags=["nueva_entidad"])

@router.get("/", response_model=List[schemas.NuevaEntidad])
def listar(db: Session = Depends(get_db)):
    items = db.query(models.NuevaEntidad).all()
    return items

@router.post("/", response_model=schemas.NuevaEntidad)
def crear(item: schemas.NuevaEntidadCreate, db: Session = Depends(get_db)):
    db_item = models.NuevaEntidad(**item.dict())
    db.add(db_item)
    db.commit()
    db.refresh(db_item)
    return db_item

# 5. Registrar router
# backend/app/main.py
from .api import nueva_entidad
app.include_router(nueva_entidad.router)
```

#### Frontend
```typescript
// 1. Definir tipos
// frontend/types/nueva-entidad.ts
export interface NuevaEntidad {
  id: number;
  nombre: string;
  created_at: string;
}

// 2. Crear cliente API
// frontend/lib/api/nueva-entidad.ts
import { api } from '../api';

export const nuevaEntidadApi = {
  getAll: () => api.get<NuevaEntidad[]>('/api/nueva-entidad'),
  create: (data: Omit<NuevaEntidad, 'id' | 'created_at'>) => 
    api.post<NuevaEntidad>('/api/nueva-entidad', data),
};

// 3. Crear hook React Query
// frontend/hooks/useNuevaEntidad.ts
import { useQuery, useMutation } from '@tanstack/react-query';
import { nuevaEntidadApi } from '@/lib/api/nueva-entidad';

export const useNuevaEntidades = () => {
  return useQuery({
    queryKey: ['nueva-entidades'],
    queryFn: () => nuevaEntidadApi.getAll().then(res => res.data)
  });
};

// 4. Crear página
// frontend/app/(dashboard)/nueva-entidad/page.tsx
'use client';
import { useNuevaEntidades } from '@/hooks/useNuevaEntidad';

export default function NuevaEntidadPage() {
  const { data, isLoading } = useNuevaEntidades();
  
  if (isLoading) return <div>Cargando...</div>;
  
  return (
    <div>
      <h1>Nueva Entidad</h1>
      {data?.map(item => (
        <div key={item.id}>{item.nombre}</div>
      ))}
    </div>
  );
}
```

---

## 🔧 COMANDOS Y SCRIPTS ESENCIALES

### Scripts Batch Windows (Raíz del Proyecto)
```batch
START.bat          # Iniciar sistema completo
STOP.bat           # Detener servicios
LOGS.bat           # Ver logs interactivos
DIAGNOSTICO.bat    # Diagnóstico completo
LIMPIAR_CACHE.bat  # Limpiar caché Docker
REINSTALAR.bat     # Reinstalación completa
BACKUP_DATOS.bat   # Backup de base de datos
```

### Comandos Docker Frecuentes
```bash
# Estado de servicios
docker ps
docker compose ps

# Logs
docker compose logs -f backend
docker logs uns-claudejp-backend --tail=100

# Acceso a contenedores
docker exec -it uns-claudejp-backend bash
docker exec -it uns-claudejp-frontend bash
docker exec -it uns-claudejp-db psql -U uns_admin -d uns_claudejp

# Rebuild
docker compose build backend
docker compose up -d --force-recreate backend

# Limpieza
docker compose down
docker system prune -a
docker volume prune
```

### Comandos Backend (Dentro del Contenedor)
```bash
# Migraciones
alembic upgrade head
alembic revision --autogenerate -m "description"
alembic downgrade -1
alembic history

# Scripts
python scripts/create_admin_user.py
python scripts/import_data.py
python scripts/verify_data.py

# Testing
pytest tests/ -v
pytest tests/test_auth.py -vs
pytest -k "test_login"

# Python REPL con contexto
python
>>> from app.database import SessionLocal
>>> from app.models import models
>>> db = SessionLocal()
>>> users = db.query(models.User).all()
```

### Comandos Frontend (Dentro del Contenedor)
```bash
# Desarrollo
npm run dev         # Dev server (ya corriendo)
npm run build       # Build producción
npm run start       # Start producción

# Linting y type-check
npm run lint
npm run type-check

# Testing
npm test
npm run test:e2e

# Dependencias
npm install <package>
npm uninstall <package>
npm list
```

---

## 🗂️ DATOS MAESTROS Y CONFIGURACIONES

### Archivos de Configuración Importantes
```
/config/
├── company.json                     # Datos de la empresa
├── employee_master.xlsm             # Plantilla Excel empleados
├── factories_index.json             # Índice de fábricas
├── access_candidates_data.json      # Datos candidatos Access
└── factories/
    ├── factory_001.json
    ├── factory_002.json
    └── ...
```

### Base de Datos Access Legacy
```
/BASEDATEJP/
└── ユニバーサル企画㈱データベースv25.3.24_be.accdb
    # Base de datos Access original (sistema legacy)
    # Scripts de importación convierten a PostgreSQL
```

---

## 📊 ESTADÍSTICAS DEL PROYECTO

```
Líneas de Código:
  Backend:   ~15,000 líneas (Python)
  Frontend:  ~20,000 líneas (TypeScript/TSX)
  Total:     ~35,000 líneas

Archivos:
  Backend:   ~150 archivos
  Frontend:  ~200 archivos
  Scripts:   ~50 archivos batch/PowerShell/Python
  Docs:      ~25 archivos .md

Tablas BD:         13 tablas principales
Endpoints API:     ~80 endpoints REST
Páginas Frontend:  45+ páginas funcionales
Componentes UI:    ~100 componentes React

Contenedores:      4 (db, backend, frontend, importer)
Servicios:         3 principales (PostgreSQL, FastAPI, Next.js)
```

---

## 🎯 OBJETIVOS Y ROADMAP

### Versión Actual (5.4)
- ✅ Migración completa de V5.2
- ✅ Sistema de temas mejorado
- ✅ Documentación centralizada
- ✅ Docker Compose optimizado

### Próximas Versiones (Planificado)
- ⏳ Sistema de notificaciones en tiempo real
- ⏳ Reportes avanzados con gráficos
- ⏳ App móvil (React Native)
- ⏳ Integración con APIs externas (nómina japonesa)
- ⏳ Sistema de auditoría completo

---

## 🐛 PROBLEMAS CONOCIDOS Y LIMITACIONES

### Limitaciones Actuales
1. **OCR Japonés**: Requiere Azure Cognitive Services (costo)
2. **Sincronización Tiempo Real**: No implementada (usar polling)
3. **Archivos Grandes**: Límite 50MB por archivo
4. **Concurrencia**: Sin optimistic locking en algunos endpoints
5. **i18n**: Solo español e inglés (japonés en roadmap)

### Issues Comunes
- Token JWT expira después de 8 horas (requiere re-login)
- Caché de navegador puede causar problemas con temas
- Imágenes de candidatos deben ser JPG/PNG < 5MB
- PostgreSQL requiere 2GB RAM mínimo

---

## 📚 RECURSOS ADICIONALES

### Documentación Externa
- **FastAPI**: https://fastapi.tiangolo.com/
- **Next.js**: https://nextjs.org/docs
- **SQLAlchemy**: https://docs.sqlalchemy.org/
- **Tailwind CSS**: https://tailwindcss.com/docs
- **Radix UI**: https://www.radix-ui.com/docs

### Documentación Interna
- [`INDEX_DOCUMENTACION.md`](../INDEX_DOCUMENTACION.md) - Índice completo
- [`GUIA_INICIO_IA.md`](../GUIA_INICIO_IA.md) - Inicio rápido para IAs
- [`core/CLAUDE.md`](../core/CLAUDE.md) - Guía de desarrollo completa
- [`core/README.md`](../core/README.md) - README principal

---

**🤖 CONTEXTO COMPLETO CARGADO**

Este archivo proporciona el contexto técnico y de negocio completo necesario para que un sistema de IA pueda trabajar efectivamente en el proyecto UNS-ClaudeJP v5.4.

---

*Generado: 2025-11-07*  
*Mantenido por: Sistema de IA*  
*Versión: 1.0*