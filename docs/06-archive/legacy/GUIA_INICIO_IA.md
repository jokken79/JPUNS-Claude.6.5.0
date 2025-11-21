# 🤖 GUÍA DE INICIO PARA IAs - UNS-ClaudeJP v5.4

**Sistema**: Sistema de Gestión de RRHH para Agencias de Personal Japonesas  
**Versión**: 5.4  
**Última actualización**: 2025-11-07  
**Propósito**: Inicializar contexto completo de IA en < 5 minutos

---

## ⚡ INICIO ULTRA-RÁPIDO (30 segundos)

### 🎯 LO QUE NECESITAS SABER AHORA MISMO

**Este es un sistema de gestión de RRHH para agencias de personal japonesas** que gestiona:
- 📄 Candidatos (履歴書 - Rirekisho/CV japonés)
- 👷 Empleados temporales (派遣社員)
- 🏭 Fábricas cliente (派遣先)
- ⏰ Tarjetas de tiempo (タイムカード)
- 💰 Nómina (給与)
- 📝 Solicitudes (申請)

**Stack Tecnológico:**
```
Frontend:  Next.js 15.5 + TypeScript 5.6 + Tailwind CSS
Backend:   FastAPI 0.115+ + SQLAlchemy 2.0 + PostgreSQL 15
DevOps:    Docker Compose (todo en contenedores)
```

**Credenciales por defecto:** `admin` / `admin123`

**Servicios:**
- Frontend: http://localhost:3000
- Backend API: http://localhost:8000
- DB Admin: http://localhost:8080

---

## 🚨 REGLAS CRÍTICAS - NUNCA VIOLAR

```
⛔ NUNCA BORRAR código funcional
⛔ NUNCA BORRAR archivos .bat, .py de scripts, Dockerfiles
⛔ NUNCA MODIFICAR sin confirmar primero
⛔ NUNCA crear archivos .md duplicados (buscar primero)
⛔ NUNCA tocar /subagentes/ sin autorización explícita
⛔ SIEMPRE mantener compatibilidad Windows
⛔ SIEMPRE usar formato fecha en .md: ## 📅 YYYY-MM-DD - [TÍTULO]
```

---

## 📚 DOCUMENTACIÓN ESENCIAL (Leer en Orden)

### Nivel 1: CRÍTICO (Leer SIEMPRE al iniciar)
1. **[`INDEX_DOCUMENTACION.md`](./INDEX_DOCUMENTACION.md)** - Mapa completo de docs
2. **[`core/CLAUDE.md`](./core/CLAUDE.md)** - Guía completa desarrollo IA (496 líneas)
3. **[`core/README.md`](./core/README.md)** - Documentación principal

### Nivel 2: ALTA PRIORIDAD (Leer según contexto)
4. **[`core/MIGRATION_V5.4_README.md`](./core/MIGRATION_V5.4_README.md)** - Cambios V5.2→V5.4
5. **[`changelogs/CHANGELOG_V5.2_TO_V5.4.md`](./changelogs/CHANGELOG_V5.2_TO_V5.4.md)** - Historial detallado

### Nivel 3: CONSULTA (Según tarea específica)
6. **[`scripts/SOLUCION_PROBLEMAS_LIMPIAR_CACHE.md`](./scripts/SOLUCION_PROBLEMAS_LIMPIAR_CACHE.md)** - Solución problemas
7. **[`integration/TIMER_CARD_PAYROLL_INTEGRATION.md`](./integration/TIMER_CARD_PAYROLL_INTEGRATION.md)** - Integraciones
8. **[`github/copilot-instructions.md`](./github/copilot-instructions.md)** - Config Copilot

---

## 🏗️ ARQUITECTURA DEL SISTEMA

### Contenedores Docker
```yaml
📦 uns-claudejp-db          # PostgreSQL 15 (puerto 5432)
📦 uns-claudejp-backend     # FastAPI + Python 3.11 (puerto 8000)
📦 uns-claudejp-frontend    # Next.js 15 + Node 20 (puerto 3000)
📦 uns-claudejp-importer    # Importador de datos inicial
```

### Modelo de Datos Principales (13 Tablas)
```python
# backend/app/models/models.py (703 líneas)
candidates      # Candidatos/CVs japoneses
employees       # Empleados temporales contratados
factories       # Empresas cliente (派遣先)
timer_cards     # Tarjetas de tiempo/asistencia
salary          # Registros de nómina
requests        # Solicitudes/申請
users           # Sistema de usuarios
employee_files  # Archivos adjuntos
factory_files   # Documentos de fábricas
# + más tablas relacionales
```

### Rutas de Archivos Críticos
```
/
├── docker-compose.yml              # Orquestación completa
├── generate_env.py                 # Auto-generación .env
├── START.bat                       # Inicio del sistema
├── /backend/
│   ├── app/models/models.py        # Modelos SQLAlchemy (703 líneas)
│   ├── app/api/*.py                # 24+ endpoints REST
│   └── alembic/versions/           # Migraciones BD
├── /frontend/
│   ├── app/(dashboard)/*/page.tsx  # Páginas Next.js 45+
│   ├── components/ui/              # Componentes UI (Radix+Tailwind)
│   ├── stores/                     # Zustand stores (estado global)
│   └── lib/api.ts                  # Cliente API con auth JWT
├── /scripts/                       # 30+ scripts batch/PowerShell
├── /config/                        # Configuraciones y plantillas Excel
└── /docs/                          # TODA LA DOCUMENTACIÓN
```

---

## ⚙️ COMANDOS FRECUENTES

### Inicio y Gestión del Sistema
```bash
# Windows (desde raíz del proyecto)
START.bat                           # Inicia todos los servicios
STOP.bat                            # Detiene servicios
LOGS.bat                            # Ver logs interactivos
DIAGNOSTICO.bat                     # Diagnóstico del sistema

# Acceso a contenedores
docker exec -it uns-claudejp-backend bash
docker exec -it uns-claudejp-frontend bash
docker exec -it uns-claudejp-db psql -U uns_admin -d uns_claudejp
```

### Backend - Migraciones y Datos
```bash
# Dentro del contenedor backend
cd /app
alembic upgrade head                # Aplicar migraciones
alembic revision --autogenerate -m "descripción"  # Nueva migración
python scripts/create_admin_user.py # Crear/resetear admin
python scripts/import_data.py       # Importar datos demo
```

### Frontend - Desarrollo
```bash
# Dentro del contenedor frontend
npm run dev                         # Dev server (auto-reinicia)
npm run build                       # Build producción
npm run lint                        # Verificar código
```

### Base de Datos - Consultas Rápidas
```sql
-- Conectar a DB
docker exec -it uns-claudejp-db psql -U uns_admin -d uns_claudejp

-- Consultas útiles
\dt                                 -- Listar tablas
SELECT * FROM users LIMIT 5;        -- Ver usuarios
SELECT * FROM employees LIMIT 10;   -- Ver empleados
SELECT COUNT(*) FROM candidates;    -- Contar candidatos
```

---

## 🔐 SISTEMA DE AUTENTICACIÓN

### Roles de Usuario
```python
SUPER_ADMIN      # Acceso total al sistema
ADMIN            # Administrador general
COORDINATOR      # Coordinador de RH
KANRININSHA      # Gerente (管理人者)
EMPLOYEE         # Empleado
CONTRACT_WORKER  # Trabajador temporal
```

### Flujo de Auth
1. Login → POST `/api/auth/login` con `{username, password}`
2. Recibe → `{access_token, user_data, role}`
3. Frontend almacena → localStorage + Zustand store
4. Requests → Header `Authorization: Bearer {token}`
5. JWT expira en → 8 horas (480 minutos)
6. 401 Response → Auto-redirect a `/login`

### Verificación Auth
```bash
# Test de endpoint protegido
curl -H "Authorization: Bearer YOUR_TOKEN" http://localhost:8000/api/users/me
```

---

## 🎨 SISTEMA DE TEMAS (Frontend)

**12 Temas Predefinidos:**
- slate, gray, zinc, neutral, stone, red, orange, amber, yellow, green, blue, purple

**Ubicaciones:**
- Configuración: `/frontend/lib/theme-config.ts`
- Store: `/frontend/stores/themeStore.ts`
- Provider: `/frontend/components/providers.tsx`

**Cambio de Tema:**
```typescript
import { useThemeStore } from '@/stores/themeStore';
const { setTheme } = useThemeStore();
setTheme('blue');
```

---

## 🔧 PATRONES DE DESARROLLO

### Backend - Crear Nuevo Endpoint
```python
# 1. Agregar en backend/app/api/nuevo_modulo.py
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from ..database import get_db

router = APIRouter(prefix="/api/nuevo", tags=["nuevo"])

@router.get("/")
async def listar(db: Session = Depends(get_db)):
    return {"data": []}

# 2. Registrar en backend/app/main.py
from .api import nuevo_modulo
app.include_router(nuevo_modulo.router)
```

### Frontend - Crear Nueva Página
```typescript
// 1. Crear app/(dashboard)/nueva-pagina/page.tsx
export default function NuevaPaginaPage() {
  return <div>Nueva Página</div>
}

// 2. Agregar en navegación si necesario
// frontend/components/layout/sidebar.tsx
```

### Agregar Nueva Tabla (Migración)
```bash
# 1. Editar backend/app/models/models.py
class NuevaTabla(Base):
    __tablename__ = "nueva_tabla"
    id = Column(Integer, primary_key=True)
    nombre = Column(String(255))

# 2. Crear migración
docker exec -it uns-claudejp-backend bash
cd /app
alembic revision --autogenerate -m "Agregar tabla nueva_tabla"

# 3. Aplicar
alembic upgrade head
```

---

## 🐛 SOLUCIÓN DE PROBLEMAS COMUNES

### Error: "Cannot connect to database"
```bash
# Verificar que DB está corriendo
docker ps | grep uns-claudejp-db

# Revisar logs
docker logs uns-claudejp-db

# Reiniciar servicios
STOP.bat
START.bat
```

### Error: "401 Unauthorized" en Frontend
```bash
# Token expirado - hacer logout y login nuevamente
# O limpiar localStorage en DevTools
localStorage.clear()
```

### Error: "Port already in use"
```bash
# Ver qué está usando el puerto
netstat -ano | findstr :3000
netstat -ano | findstr :8000

# Matar proceso (reemplazar PID)
taskkill /PID <PID> /F
```

### Limpiar Caché/Reset Completo
```bash
LIMPIAR_CACHE.bat     # Limpia caché Docker
# o
REINSTALAR.bat        # Reinstalación completa (¡cuidado!)
```

---

## 📊 DATOS DE PRUEBA

**Usuarios Predefinidos:**
```
admin / admin123         # Super Admin
coordinator1 / pass123   # Coordinador
employee1 / pass123      # Empleado
```

**Datos Demo:**
- ~50 candidatos
- ~30 empleados
- ~10 fábricas
- Tarjetas de tiempo de muestra
- Registros de nómina

**Importar Datos:**
```bash
docker exec -it uns-claudejp-backend python scripts/import_data.py
```

---

## 🚀 FLUJOS DE TRABAJO COMUNES

### 1. Agregar Nueva Funcionalidad
```
1. Leer CLAUDE.md sección relevante
2. Verificar modelo de datos en models.py
3. Crear/modificar endpoint en backend
4. Crear/modificar página en frontend
5. Probar manualmente
6. Actualizar documentación si es relevante
```

### 2. Resolver Bug Reportado
```
1. Reproducir el bug
2. Revisar logs: LOGS.bat
3. Verificar BD si es necesario
4. Aplicar fix
5. Probar
6. Documentar en changelog si es importante
```

### 3. Actualizar Dependencias
```
1. Backend: Editar requirements.txt
2. Rebuild: docker-compose build backend
3. Frontend: docker exec ... npm install <pkg>
4. Probar
5. Actualizar docs si API cambió
```

---

## 📁 ESTRUCTURA DE `/docs/` (Tu Ubicación Actual)

```
/docs/
├── INDEX_DOCUMENTACION.md          # 📋 Índice maestro
├── GUIA_INICIO_IA.md               # 🤖 Este archivo
├── core/                           # Documentación central
│   ├── README.md
│   ├── CLAUDE.md                   # ⭐ 496 líneas - Guía completa
│   └── MIGRATION_V5.4_README.md
├── changelogs/                     # Historial de cambios
├── integration/                    # Documentación de integraciones
├── scripts/                        # Docs de scripts
├── github/                         # Config GitHub/Copilot
├── database/                       # Docs de BD
├── analysis/                       # Análisis técnicos
└── ai/                            # Docs específicas para IA
```

---

## 🔗 ENLACES RÁPIDOS

- **Código Backend**: `/backend/app/`
- **Código Frontend**: `/frontend/app/`
- **Scripts Batch**: `/scripts/`
- **Configuraciones**: `/config/`
- **Docker**: `/docker-compose.yml`
- **Migraciones**: `/backend/alembic/versions/`

---

## 🎓 PRÓXIMOS PASOS DESPUÉS DE LEER ESTO

### Para Tareas de Desarrollo:
1. Lee **`core/CLAUDE.md`** completo (496 líneas)
2. Revisa modelo de datos en **`backend/app/models/models.py`**
3. Explora estructura de frontend en **`frontend/app/`**

### Para Debugging:
1. Lee **`scripts/SOLUCION_PROBLEMAS_LIMPIAR_CACHE.md`**
2. Revisa logs: `LOGS.bat`
3. Verifica estado de BD

### Para Nuevas Funcionalidades:
1. Revisa **`changelogs/CHANGELOG_V5.2_TO_V5.4.md`** para contexto reciente
2. Lee integración relevante en **`integration/`**
3. Consulta patrones en código existente

---

## 💡 CONSEJOS PARA IAs

1. **Siempre verificar archivos existentes antes de crear nuevos**
2. **Usar búsqueda semántica para encontrar código similar**
3. **Respetar convenciones de código existentes**
4. **Nunca asumir - verificar siempre con grep/search**
5. **Documentar cambios importantes**
6. **Mantener compatibilidad con Windows**
7. **Probar en contenedor antes de confirmar**

---

## 📞 CONTACTOS Y RECURSOS

- **Proyecto**: Sistema RRHH Agencias Japonesas
- **Versión**: 5.4 (migrado desde 5.2)
- **Documentación Completa**: `/docs/INDEX_DOCUMENTACION.md`
- **Issues**: Verificar `/docs/analysis/` para análisis técnicos

---

**✅ CONTEXTO INICIALIZADO**  
Ahora tienes el contexto esencial para trabajar en UNS-ClaudeJP v5.4.

**Siguiente paso recomendado:**  
```bash
# Leer guía completa de desarrollo
cat docs/core/CLAUDE.md
```

---

*Generado: 2025-11-07*  
*Mantenido por: Sistema de IA*