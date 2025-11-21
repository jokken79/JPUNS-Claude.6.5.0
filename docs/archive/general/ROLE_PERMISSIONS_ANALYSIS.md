# ANÁLISIS EXHAUSTIVO: SISTEMA DE ROLES Y PERMISOS DE UNS-ClaudeJP-5.4.1

**Fecha de Análisis:** 11 de Noviembre 2025  
**Nivel de Minuciosidad:** Very Thorough  
**Estado:** COMPLETO - No modifica archivos, solo explora y documenta

---

## 1. ESTRUCTURA ACTUAL DE ROLES DE USUARIO

### 1.1 Definición de Roles (Backend)

**Archivo:** `/home/user/UNS-ClaudeJP-5.4.1/backend/app/models/models.py` (líneas 19-27)

```python
class UserRole(str, enum.Enum):
    SUPER_ADMIN = "SUPER_ADMIN"      # Control total del sistema
    ADMIN = "ADMIN"                  # Acceso administrativo completo
    KEITOSAN = "KEITOSAN"            # 経理管理 - Finanzas/Contabilidad
    TANTOSHA = "TANTOSHA"            # 担当者 - RRHH/Operaciones
    COORDINATOR = "COORDINATOR"      # Coordinador (Legado)
    KANRININSHA = "KANRININSHA"      # 管理人者 - Personal de Oficina/RRHH
    EMPLOYEE = "EMPLOYEE"            # 派遣元社員 - Trabajadores en Plantilla
    CONTRACT_WORKER = "CONTRACT_WORKER"  # 請負 - Trabajadores por Contrato
```

### 1.2 Tabla de Usuarios - Campos Relacionados con Roles

**Archivo:** `/home/user/UNS-ClaudeJP-5.4.1/backend/app/models/models.py` (líneas 69-83)

| Campo | Tipo | Descripción |
|-------|------|-------------|
| `id` | Integer | Clave primaria |
| `username` | String(50) | Nombre único de usuario |
| `email` | String(100) | Email único |
| `password_hash` | String(255) | Hash seguro de contraseña |
| `role` | SQLEnum(UserRole) | **ROL PRINCIPAL** - Determina permisos |
| `full_name` | String(100) | Nombre completo |
| `is_active` | Boolean | Estado activo/inactivo |
| `created_at` | DateTime | Timestamp de creación |
| `updated_at` | DateTime | Timestamp de última actualización |

**Relación:** Tabla `refresh_tokens` (para tokens JWT con soporte multi-dispositivo)

---

## 2. SISTEMA DE PERMISOS POR ROL Y PÁGINA

### 2.1 Tabla de Base de Datos: RolePagePermission

**Archivo:** `/home/user/UNS-ClaudeJP-5.4.1/backend/app/models/models.py` (líneas 894-911)

```python
class RolePagePermission(Base):
    """
    Role-Based Page Permissions - Control granular de qué páginas puede ver cada rol
    Habilita permisos a nivel de página por cada rol
    """
    __tablename__ = "role_page_permissions"

    id: Integer (primary_key)
    role_key: String(50) - índice - Ej: "ADMIN", "KEITOSAN", "TANTOSHA", "EMPLOYEE"
    page_key: String(100) - índice - Ej: "dashboard", "candidates", "employees"
    is_enabled: Boolean (default=True) - True = Rol puede ver página, False = Bloqueado
    created_at: DateTime
    updated_at: DateTime
```

**Propósito:** Matriz granular de control de acceso. Cada combinación rol-página determina visibilidad.

### 2.2 Tabla de Base de Datos: PageVisibility

**Archivo:** `/home/user/UNS-ClaudeJP-5.4.1/backend/app/models/models.py` (líneas 873-891)

```python
class PageVisibility(Base):
    """
    Page Visibility Settings - Control global de qué páginas están disponibles
    Muestra "Under Construction" si disabled
    """
    __tablename__ = "page_visibility"

    id: Integer (primary_key)
    page_key: String(100) - unique - Identificador único de página
    page_name: String(100) - Nombre en japonés (Ej: 'ダッシュボード')
    page_name_en: String(100) - Nombre en inglés (Ej: 'Dashboard')
    is_enabled: Boolean (default=True) - Controla visibilidad global
    path: String(255) - Ruta de la página (Ej: '/dashboard')
    description: Text - Descripción para admin
    disabled_message: String(255) - Mensaje personalizado cuando está deshabilitada
    last_toggled_by: Integer FK (users.id) - Admin que hizo el último cambio
    last_toggled_at: DateTime - Cuándo fue el último cambio
    updated_at: DateTime
    created_at: DateTime
```

**Propósito:** Control global sobre visibilidad de páginas. Muestra "En construcción" si disabled.

---

## 3. API BACKEND - ENDPOINTS DE PERMISOS

### 3.1 Endpoint: Role Permissions API

**Archivo:** `/home/user/UNS-ClaudeJP-5.4.1/backend/app/api/role_permissions.py` (líneas 1-344)

**Ruta Base:** `/api/role-permissions`

| Método | Endpoint | Descripción | Requiere | Línea |
|--------|----------|-------------|----------|-------|
| GET | `/api/role-permissions/roles` | Lista todos los roles disponibles | Público | 93-96 |
| GET | `/api/role-permissions/pages` | Lista todas las páginas disponibles | Público | 99-102 |
| GET | `/api/role-permissions/{role_key}` | Obtiene permisos de un rol específico | require_admin | 105-157 |
| PUT | `/api/role-permissions/{role_key}/{page_key}` | Actualiza permiso individual | require_admin | 160-205 |
| POST | `/api/role-permissions/bulk-update/{role_key}` | Actualiza múltiples permisos de un rol | require_admin | 208-254 |
| GET | `/api/role-permissions/check/{role_key}/{page_key}` | Verifica si un rol tiene acceso a una página | Público | 257-288 |
| GET | `/api/role-permissions/user/{user_id}/permissions` | Obtiene permisos del usuario actual | get_current_user | 291-315 |
| POST | `/api/role-permissions/reset/{role_key}` | Resetea permisos de un rol a default | require_admin | 318-343 |

#### 3.1.1 Constantes de Roles y Páginas Disponibles

**Roles Configurados (líneas 81-86):**
```python
AVAILABLE_ROLES = [
    {"key": "ADMIN", "name": "アドミニストレーター", "name_en": "Administrator"},
    {"key": "KEITOSAN", "name": "経理管理", "name_en": "Finance Manager"},
    {"key": "TANTOSHA", "name": "担当者", "name_en": "Representative"},
    {"key": "EMPLOYEE", "name": "従業員", "name_en": "Employee"},
]
```

**Páginas Configuradas (líneas 59-75):**
```python
AVAILABLE_PAGES = [
    {"key": "dashboard", "name": "ダッシュボード", "name_en": "Dashboard"},
    {"key": "candidates", "name": "候補者", "name_en": "Candidates"},
    {"key": "employees", "name": "従業員", "name_en": "Employees"},
    {"key": "factories", "name": "派遣先", "name_en": "Factories"},
    {"key": "apartments", "name": "アパート", "name_en": "Apartments"},
    {"key": "timer_cards", "name": "タイムカード", "name_en": "Time Cards"},
    {"key": "salary", "name": "給与", "name_en": "Salary"},
    {"key": "requests", "name": "申請", "name_en": "Requests"},
    {"key": "reports", "name": "レポート", "name_en": "Reports"},
    {"key": "design_system", "name": "デザインシステム", "name_en": "Design System"},
    {"key": "forms", "name": "フォーム", "name_en": "Forms"},
    {"key": "support", "name": "サポート", "name_en": "Support"},
    {"key": "help", "name": "ヘルプ", "name_en": "Help"},
    {"key": "terms", "name": "利用規約", "name_en": "Terms"},
    {"key": "privacy", "name": "プライバシーポリシー", "name_en": "Privacy Policy"},
]
```

### 3.2 Endpoint: Admin Panel API

**Archivo:** `/home/user/UNS-ClaudeJP-5.4.1/backend/app/api/admin.py` (líneas 1-375)

**Ruta Base:** `/api/admin`

| Método | Endpoint | Descripción | Requiere | Línea |
|--------|----------|-------------|----------|-------|
| GET | `/api/admin/pages` | Lista configuración de visibilidad de todas las páginas | require_admin | 63-72 |
| GET | `/api/admin/pages/{page_key}` | Obtiene visibilidad de una página | require_admin | 74-87 |
| PUT | `/api/admin/pages/{page_key}` | Actualiza visibilidad de una página | require_admin | 89-114 |
| POST | `/api/admin/pages/bulk-toggle` | Habilita/deshabilita múltiples páginas | require_admin | 116-142 |
| POST | `/api/admin/pages/{page_key}/toggle` | Alterna visibilidad de una página | require_admin | 144-169 |
| GET | `/api/admin/settings` | Obtiene configuración del sistema | require_admin | 175-184 |
| GET | `/api/admin/settings/{setting_key}` | Obtiene una configuración específica | require_admin | 186-199 |
| PUT | `/api/admin/settings/{setting_key}` | Actualiza una configuración | require_admin | 201-221 |
| POST | `/api/admin/maintenance-mode` | Activa/desactiva modo mantenimiento | require_admin | 223-259 |
| GET | `/api/admin/statistics` | Obtiene estadísticas del panel | require_admin | 265-301 |
| GET | `/api/admin/export-config` | Exporta configuración a JSON | require_admin | 307-339 |
| POST | `/api/admin/import-config` | Importa configuración desde JSON | require_admin | 341-374 |

### 3.3 Endpoint: Pages API

**Archivo:** `/home/user/UNS-ClaudeJP-5.4.1/backend/app/api/pages.py` (líneas 1-215)

**Ruta Base:** `/api/pages`

| Método | Endpoint | Descripción | Requiere | Línea |
|--------|----------|-------------|----------|-------|
| GET | `/api/pages/visibility` | Lista visibilidad de todas las páginas | get_current_user | 50-60 |
| GET | `/api/pages/visibility/{page_key}` | Obtiene visibilidad de una página | get_current_user | 63-78 |
| PUT | `/api/pages/visibility/{page_key}` | Actualiza visibilidad (ADMIN only) | ADMIN/SUPER_ADMIN | 81-120 |
| POST | `/api/pages/visibility/init` | Inicializa configuración default | SUPER_ADMIN | 123-214 |

---

## 4. DECORADORES Y MIDDLEWARE DE AUTORIZACIÓN (BACKEND)

### 4.1 Archivo de Dependencias

**Archivo:** `/home/user/UNS-ClaudeJP-5.4.1/backend/app/api/deps.py` (líneas 1-53)

```python
def get_current_user(
    db: Session = Depends(get_db),
    credentials: HTTPAuthorizationCredentials = Depends(security)
) -> User:
    """Obtiene usuario actual autenticado (todos los usuarios)"""
    return auth_service.get_current_active_user(db=db, token=credentials.credentials)

def require_admin(
    current_user: User = Depends(get_current_user)
) -> User:
    """Requiere rol SUPER_ADMIN o ADMIN para acceder"""
    if current_user.role not in ["SUPER_ADMIN", "ADMIN"]:
        raise HTTPException(status_code=403, detail="Admin access required")
    return current_user

def get_page_visibility(
    page_key: str,
    db: Session = Depends(get_db)
) -> Optional[PageVisibility]:
    """Obtiene configuración de visibilidad de una página"""
    page = db.query(PageVisibility).filter(PageVisibility.page_key == page_key).first()
    return page
```

### 4.2 Servicio de Autenticación

**Archivo:** `/home/user/UNS-ClaudeJP-5.4.1/backend/app/services/auth_service.py`

Los servicios implementan:
- Validación de JWT tokens
- Hash y verificación de contraseñas
- Gestión de refresh tokens
- Revocación de tokens

---

## 5. PÁGINAS DEL FRONTEND - LISTA COMPLETA

### 5.1 Estructura de Rutas (Next.js App Router)

**Base:** `/home/user/UNS-ClaudeJP-5.4.1/frontend/app/(dashboard)/`

**Páginas Principales (49 archivos):**

| Ruta | Archivo | Descripción |
|------|---------|-------------|
| `/dashboard` | `dashboard/page.tsx` | Panel principal con métricas |
| `/candidates` | `candidates/page.tsx` | Lista de candidatos |
| `/candidates/new` | `candidates/new/page.tsx` | Crear nuevo candidato |
| `/candidates/[id]` | `candidates/[id]/page.tsx` | Ver detalles candidato |
| `/candidates/[id]/edit` | `candidates/[id]/edit/page.tsx` | Editar candidato |
| `/candidates/[id]/print` | `candidates/[id]/print/page.tsx` | Imprimir perfil candidato |
| `/candidates/rirekisho` | `candidates/rirekisho/page.tsx` | Gestión de Rirekisho (CV) |
| `/employees` | `employees/page.tsx` | Lista de empleados |
| `/employees/new` | `employees/new/page.tsx` | Crear nuevo empleado |
| `/employees/[id]` | `employees/[id]/page.tsx` | Ver detalles empleado |
| `/employees/[id]/edit` | `employees/[id]/edit/page.tsx` | Editar empleado |
| `/employees/excel-view` | `employees/excel-view/page.tsx` | Vista tipo Excel |
| `/factories` | `factories/page.tsx` | Lista de fábricas |
| `/factories/new` | `factories/new/page.tsx` | Crear nueva fábrica |
| `/factories/[factory_id]` | `factories/[factory_id]/page.tsx` | Ver detalles fábrica |
| `/factories/[factory_id]/config` | `factories/[factory_id]/config/page.tsx` | Configurar fábrica |
| `/apartments` | `apartments/page.tsx` | Lista de apartamentos |
| `/apartments/[id]` | `apartments/[id]/page.tsx` | Ver detalles apartamento |
| `/apartments/[id]/edit` | `apartments/[id]/edit/page.tsx` | Editar apartamento |
| `/apartments/create` | `apartments/create/page.tsx` | Crear apartamento |
| `/apartments/search` | `apartments/search/page.tsx` | Buscar apartamentos |
| `/apartment-assignments` | `apartment-assignments/page.tsx` | Asignaciones de apartamentos |
| `/apartment-assignments/create` | `apartment-assignments/create/page.tsx` | Nueva asignación |
| `/apartment-assignments/[id]` | `apartment-assignments/[id]/page.tsx` | Ver asignación |
| `/apartment-assignments/[id]/end` | `apartment-assignments/[id]/end/page.tsx` | Finalizar asignación |
| `/apartment-assignments/transfer` | `apartment-assignments/transfer/page.tsx` | Transferir apartamento |
| `/apartment-calculations` | `apartment-calculations/page.tsx` | Cálculos de apartamentos |
| `/apartment-calculations/prorated` | `apartment-calculations/prorated/page.tsx` | Cálculos prorrateados |
| `/apartment-calculations/total` | `apartment-calculations/total/page.tsx` | Cálculos totales |
| `/apartment-reports` | `apartment-reports/page.tsx` | Reportes de apartamentos |
| `/apartment-reports/costs` | `apartment-reports/costs/page.tsx` | Costos de apartamentos |
| `/apartment-reports/occupancy` | `apartment-reports/occupancy/page.tsx` | Ocupación de apartamentos |
| `/timercards` | `timercards/page.tsx` | Control horario |
| `/timercards/upload` | `timercards/upload/page.tsx` | Subir tarjetas de tiempo |
| `/payroll` | `payroll/page.tsx` | Gestión de nómina |
| `/payroll/calculate` | `payroll/calculate/page.tsx` | Calcular nómina |
| `/payroll/settings` | `payroll/settings/page.tsx` | Configuración nómina |
| `/payroll/timer-cards` | `payroll/timer-cards/page.tsx` | Tarjetas de tiempo (nómina) |
| `/salary` | `salary/page.tsx` | Gestión de salarios |
| `/requests` | `requests/page.tsx` | Solicitudes de empleados |
| `/additional-charges` | `additional-charges/page.tsx` | Cargos adicionales |
| `/rent-deductions` | `rent-deductions/page.tsx` | Deducciones de renta |
| `/rent-deductions/[year]/[month]` | `rent-deductions/[year]/[month]/page.tsx` | Deducción por mes |
| `/reports` | `reports/page.tsx` | Reportes y análisis |
| `/design-system` | `design-system/page.tsx` | Guía de componentes UI |
| `/examples/forms` | `examples/forms/page.tsx` | Ejemplos de formularios |
| `/admin/control-panel` | `admin/control-panel/page.tsx` | **Panel administrativo** |
| `/construction` | `construction/page.tsx` | Página "En construcción" |
| `/help` | `help/page.tsx` | Centro de ayuda |
| `/support` | `support/page.tsx` | Soporte |
| `/privacy` | `privacy/page.tsx` | Política de privacidad |
| `/terms` | `terms/page.tsx` | Términos de servicio |

**Total: 54 páginas**

### 5.2 Menú de Navegación Configurado

**Archivo:** `/home/user/UNS-ClaudeJP-5.4.1/frontend/lib/constants/dashboard-config.ts`

**Navegación Principal (9 items):**
1. Panel Principal (`/dashboard`)
2. Candidatos (`/candidates`)
3. Empleados (`/employees`)
4. Fábricas (`/factories`)
5. Apartamentos (`/apartments`)
6. Reportes (`/reports`)
7. Salarios (`/salary`)
8. Control Horario (`/timercards`)
9. Payroll (`/payroll`)

**Navegación Secundaria (7 items):**
1. Solicitudes (`/requests`)
2. Design System (`/design-system`)
3. Ejemplos de Formularios (`/examples/forms`)
4. Soporte (`/support`)
5. Centro de Ayuda (`/help`)
6. Privacidad (`/privacy`)
7. Términos (`/terms`)

---

## 6. PROTECCIÓN DE RUTAS (FRONTEND)

### 6.1 Componente VisibilityGuard

**Archivo:** `/home/user/UNS-ClaudeJP-5.4.1/frontend/components/visibility-guard.tsx`

```typescript
export function VisibilityGuard({ children }: VisibilityGuardProps) {
  const { user } = useAuthStore();  // Obtiene usuario del store
  const { visibilityEnabled, fetchVisibilityToggle } = useSettingsStore();

  useEffect(() => {
    if (user) {
      fetchVisibilityToggle();  // Fetch visibilidad global
    }
  }, [user]);

  // Solo ADMIN y KANRINSHA ven la página de construcción
  const isAffectedRole = user?.role === 'ADMIN' || user?.role === 'KANRINSHA';
  const shouldShowConstruction = isAffectedRole && !visibilityEnabled;

  if (shouldShowConstruction) {
    return <UnderConstruction />;  // Muestra "En construcción"
  }

  return <>{children}</>;
}
```

**Ubicación:** Envuelve todo el contenido en `/frontend/app/(dashboard)/layout.tsx` (línea 51)

**Funcionalidad:**
- Verifica si usuario está autenticado
- Obtiene estado de visibilidad global
- Muestra "En construcción" solo para ADMIN y KANRINSHA cuando está deshabilitada
- Otros roles ven contenido normalmente

### 6.2 Layout del Dashboard

**Archivo:** `/home/user/UNS-ClaudeJP-5.4.1/frontend/app/(dashboard)/layout.tsx`

```typescript
// Estructura:
// 1. NavigationProvider - Contexto de navegación
// 2. SimpleNavigationProgress - Barra de progreso
// 3. Sidebar - Barra lateral con menú
// 4. Header - Encabezado con usuario
// 5. VisibilityGuard - Protección de visibilidad
// 6. Main Content - Contenido de página
// 7. Footer - Pie de página con links
```

---

## 7. STORES Y MANEJO DE ESTADO (FRONTEND)

### 7.1 Auth Store - useAuthStore

**Archivo:** `/home/user/UNS-ClaudeJP-5.4.1/frontend/stores/auth-store.ts` (líneas 1-104)

```typescript
interface User {
  id: number;
  username: string;
  email?: string;
  role?: string;  // ← Rol del usuario
}

interface AuthState {
  token: string | null;
  user: User | null;
  isAuthenticated: boolean;
  login: (token: string, user: User) => void;
  logout: () => void;
  setUser: (user: User) => void;
  rehydrate: () => void;
}
```

**Métodos:**
- `login()` - Autentica usuario y almacena token
- `logout()` - Limpia token y user
- `setUser()` - Actualiza datos del usuario
- `rehydrate()` - Recupera estado después de refresh

**Persistencia:** localStorage bajo `auth-storage`

### 7.2 Settings Store - useSettingsStore

**Archivo:** `/home/user/UNS-ClaudeJP-5.4.1/frontend/stores/settings-store.ts` (líneas 1-94)

```typescript
interface SettingsState {
  visibilityEnabled: boolean;  // ← Toggle de visibilidad global
  isLoading: boolean;
  setVisibilityEnabled: (enabled: boolean) => void;
  fetchVisibilityToggle: () => Promise<void>;
  updateVisibilityToggle: (enabled: boolean) => Promise<void>;
}
```

**Endpoints:**
- `GET /settings/visibility` - Obtiene estado
- `PUT /settings/visibility` - Actualiza estado

---

## 8. HOOKS PERSONALIZADOS

### 8.1 usePageVisibility Hook

**Archivo:** `/home/user/UNS-ClaudeJP-5.4.1/frontend/hooks/use-page-visibility.ts` (líneas 1-164)

```typescript
function usePageVisibility(pageKey: string): UsePageVisibilityReturn
  - Obtiene estado de visibilidad de una página específica
  - Permite toggle de visibilidad
  - Soporta refresh de datos

function useAllPagesVisibility()
  - Obtiene TODAS las páginas y visibilidades
  - Permite actualizar múltiples páginas
  - Usado en el panel administrativo

function useCurrentPageVisibility()
  - Auto-detecta página actual desde URL
  - Mapea rutas a page_keys
  - Retorna visibilidad actual
```

**Mapeo de Rutas a Page Keys (líneas 138-154):**
```typescript
const pathToKeyMap: Record<string, string> = {
  'dashboard': 'dashboard',
  'candidates': 'candidates',
  'employees': 'employees',
  'factories': 'factories',
  'apartments': 'apartments',
  'timercards': 'timercards',
  'salary': 'salary',
  'requests': 'requests',
  'reports': 'reports',
  'design-system': 'design-system',
  'examples/forms': 'examples-forms',
  'support': 'support',
  'help': 'help',
  'privacy': 'privacy',
  'terms': 'terms',
};
```

---

## 9. CLIENTE API (FRONTEND)

### 9.1 Axios Instance - lib/api.ts

**Archivo:** `/home/user/UNS-ClaudeJP-5.4.1/frontend/lib/api.ts` (líneas 1-334)

```typescript
// Base URL normalizada
const API_BASE_URL = normalizeBaseUrl(
  process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'
);

// Axios instance con interceptores
const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000,  // 30 segundos para operaciones OCR
});

// Request Interceptor - Añade token JWT automáticamente
api.interceptors.request.use((config) => {
  const token = getAuthToken();
  if (token && !config.headers?.authorization) {
    config.headers.authorization = `Bearer ${token}`;
  }
  return config;
});

// Response Interceptor - Maneja errores de autenticación
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401) {
      useAuthStore.getState().logout();
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);
```

**Servicios Incluidos:**
- `authService` - Login, logout, getCurrentUser
- `employeeService` - CRUD empleados
- `candidateService` - CRUD candidatos
- `factoryService` - CRUD fábricas
- `timerCardService` - CRUD tarjetas de tiempo
- `salaryService` - Gestión de salarios
- `requestService` - CRUD solicitudes
- `dashboardService` - Estadísticas

---

## 10. PANEL DE ADMINISTRACIÓN

### 10.1 Panel de Control - Control Panel Page

**Archivo:** `/home/user/UNS-ClaudeJP-5.4.1/frontend/app/(dashboard)/admin/control-panel/page.tsx` (líneas 1-654)

**Funcionalidades:**

#### 10.1.1 Pestaña Global
- **Estadísticas de Páginas:**
  - Total de páginas
  - Páginas habilitadas (con porcentaje)
  - Páginas deshabilitadas
  - Cambios recientes (últimas 24h)

- **Acciones en Lote (Global):**
  - Habilitar todas las páginas
  - Deshabilitar todas las páginas

- **Control de Páginas (Global):**
  - Lista todas las páginas con switches
  - Toggle individual de cada página
  - Muestra estado (habilitado/deshabilitado)

#### 10.1.2 Pestaña por Rol (ADMIN, KEITOSAN, TANTOSHA, EMPLOYEE)
Para cada rol:
- **Estadísticas del Rol:**
  - Total de páginas
  - Páginas habilitadas
  - Páginas deshabilitadas

- **Acciones en Lote del Rol:**
  - Habilitar todas las páginas para el rol
  - Deshabilitar todas las páginas para el rol

- **Permisos de Acceso:**
  - Lista de páginas con switches por rol
  - Muestra última actualización
  - Toggle individual de acceso

#### 10.1.3 Información del Sistema
- Estado del Modo Mantenimiento
- Descripción de página de construcción
- Explicación de control granular por rol

#### 10.1.4 Acciones Disponibles
- **Exportar Configuración** (JSON)
  - Descarga archivo con estado actual de todas las páginas y permisos

---

## 11. PROBLEMAS Y LIMITACIONES IDENTIFICADOS

### 11.1 PROBLEMA 1: Inconsistencia de Roles Definidos

**Estado:** CRÍTICO

**Descripción:**
- Backend define 8 roles: SUPER_ADMIN, ADMIN, KEITOSAN, TANTOSHA, COORDINATOR, KANRININSHA, EMPLOYEE, CONTRACT_WORKER
- Panel de administración solo lista 4 roles: ADMIN, KEITOSAN, TANTOSHA, EMPLOYEE
- **Roles faltantes en panel:** SUPER_ADMIN, COORDINATOR, KANRININSHA, CONTRACT_WORKER

**Ubicaciones:**
- Definición completa: `/backend/app/models/models.py` (líneas 19-27)
- Panel admin: `/frontend/app/(dashboard)/admin/control-panel/page.tsx` (líneas 63-68)
- API: `/backend/app/api/role_permissions.py` (líneas 81-86)

**Impacto:** Imposible gestionar permisos para 4 roles desde el panel de administración

### 11.2 PROBLEMA 2: Desincronización de Páginas

**Estado:** MODERADO

**Descripción:**
- Dashboard-config define 16 páginas en menú
- role_permissions.py define 15 páginas disponibles
- Hay inconsistencias en nombres (ej: "timercards" vs "timer_cards")
- **Páginas faltantes:**
  - Todas las rutas de apartment assignments
  - Todas las rutas de apartment calculations/reports
  - Todas las rutas de rent deductions

**Ubicaciones:**
- Menú: `/frontend/lib/constants/dashboard-config.ts` (líneas 33-134)
- API: `/backend/app/api/role_permissions.py` (líneas 59-75)

**Impacto:** Muchas páginas no pueden ser controladas desde el panel admin

### 11.3 PROBLEMA 3: Protección de Rutas Incompleta

**Estado:** MODERADO

**Descripción:**
- VisibilityGuard solo afecta a ADMIN y KANRINSHA
- Otros roles no tienen protección de visibilidad
- No hay validación de permisos por rol en el frontend
- Teoretically, un usuario podría navegar directamente a URLs bloqueadas

**Ubicación:** `/frontend/components/visibility-guard.tsx` (líneas 24-26)

**Impacto:** Frontend no respeta completamente los permisos por rol

### 11.4 PROBLEMA 4: Inicialización de Datos

**Estado:** BAJO

**Descripción:**
- Tabla `page_visibility` requiere inicialización manual
- Endpoint `/api/pages/visibility/init` (POST) solo es accesible para SUPER_ADMIN
- Sin seed de datos automático al crear BD

**Ubicación:** `/backend/app/api/pages.py` (líneas 123-214)

**Impacto:** Admin debe ejecutar endpoint manualmente o insertar datos

### 11.5 PROBLEMA 5: Falta de Auditoría de Cambios

**Estado:** BAJO

**Descripción:**
- Sistema registra `last_toggled_by` y `last_toggled_at`
- No hay tabla de auditoría de cambios de permisos
- No hay historial de quién cambió qué y cuándo

**Ubicación:** `PageVisibility` y `RolePagePermission` (no tienen auditoría completa)

**Impacto:** No hay trazabilidad completa de cambios de seguridad

---

## 12. ESTADO ACTUAL DE PROTECCIÓN POR ROL

### 12.1 Matriz de Acceso Teórica

**Status:** Definida pero no completamente implementada

| Rol | Páginas Protegidas | Visibilidad Global | Permisos Granulares |
|-----|-------------------|-------------------|-------------------|
| SUPER_ADMIN | Ninguna (acceso total) | ✅ Sí | ✅ Sí |
| ADMIN | Control: ADMIN only | ✅ Sí | ✅ Sí |
| KEITOSAN | Gestible | ✅ Sí | ✅ Sí |
| TANTOSHA | Gestible | ✅ Sí | ✅ Sí |
| COORDINATOR | Gestible | ❌ No en panel | ❌ No en panel |
| KANRININSHA | Control + construcción | ✅ Sí (afectado por guard) | ❌ No en panel |
| EMPLOYEE | Solo lectura datos propios | ✅ Sí | ❌ No en panel |
| CONTRACT_WORKER | Solo lectura datos propios | ✅ Sí | ❌ No en panel |

---

## 13. FLUJO DE AUTENTICACIÓN Y AUTORIZACIÓN

### 13.1 Flujo de Login

```
1. Usuario ingresa credenciales en /login
   ↓
2. API POST /auth/login/ valida con auth_service
   ├─ Verifica username/password
   ├─ Valida que is_active == True
   ├─ Crea access_token (JWT 8h default)
   └─ Crea refresh_token (rotación segura)
   ↓
3. Frontend recibe tokens:
   ├─ Token almacenado en localStorage
   ├─ User data almacenado en auth-store
   └─ Cookie HttpOnly también establecida
   ↓
4. Redirect a /dashboard
```

### 13.2 Flujo de Autorización en Endpoints

```
GET /api/admin/pages  (requiere admin)
   ↓
FastAPI checks: Depends(require_admin)
   ├─ Extrae token del header Authorization
   ├─ Valida JWT
   ├─ Obtiene User desde DB
   ├─ Verifica user.role in ["SUPER_ADMIN", "ADMIN"]
   └─ Si falla → HTTP 403 Forbidden
   ↓
Si pasa: endpoint ejecuta y retorna datos
```

### 13.3 Flujo de Protección de Páginas (Frontend)

```
Usuario navega a /candidates
   ↓
Next.js renderiza layout.tsx
   ├─ Renderiza Sidebar (lee de dashboardConfig)
   └─ Renderiza VisibilityGuard (envuelve children)
   ↓
VisibilityGuard ejecuta:
   ├─ Lee user del useAuthStore
   ├─ Fetch /settings/visibility
   ├─ Si user.role en [ADMIN, KANRINSHA]:
   │  └─ Si visibilityEnabled == False
   │     └─ Muestra UnderConstruction
   └─ Si otro rol: muestra página (sin protección granular)
```

---

## 14. ENDPOINTS PARA GESTIONAR PERMISOS

### 14.1 Operaciones Comunes

#### 14.1.1 Obtener Permisos de un Rol
```bash
GET /api/role-permissions/ADMIN
Requiere: ADMIN
Retorna: Todos los permisos de ADMIN con is_enabled status
```

#### 14.1.2 Cambiar Permiso Individual
```bash
PUT /api/role-permissions/ADMIN/candidates
Body: { "is_enabled": true }
Requiere: ADMIN
```

#### 14.1.3 Cambio en Lote
```bash
POST /api/role-permissions/bulk-update/TANTOSHA
Body: {
  "permissions": [
    { "page_key": "candidates", "is_enabled": true },
    { "page_key": "employees", "is_enabled": false }
  ]
}
Requiere: ADMIN
```

#### 14.1.4 Verificar Acceso
```bash
GET /api/role-permissions/check/EMPLOYEE/candidates
Retorna: { "has_access": true/false, "role_key": "EMPLOYEE", "page_key": "candidates" }
```

#### 14.1.5 Obtener Permisos de Usuario Actual
```bash
GET /api/role-permissions/user/123/permissions
Requiere: get_current_user
Retorna: Todas las páginas que el usuario puede ver
```

---

## 15. ARCHIVOS CLAVE POR COMPONENTE

### 15.1 Base de Datos
- **Tablas de Permisos:**
  - `/backend/app/models/models.py` líneas 873-911 (PageVisibility, RolePagePermission)

### 15.2 Backend API
- **Role Permissions:** `/backend/app/api/role_permissions.py` (344 líneas)
- **Admin Panel:** `/backend/app/api/admin.py` (375 líneas)
- **Pages:** `/backend/app/api/pages.py` (215 líneas)
- **Deps (Decoradores):** `/backend/app/api/deps.py` (53 líneas)
- **Auth:** `/backend/app/api/auth.py` (379 líneas)

### 15.3 Frontend Componentes
- **Layout:** `/frontend/app/(dashboard)/layout.tsx` (98 líneas)
- **VisibilityGuard:** `/frontend/components/visibility-guard.tsx` (34 líneas)
- **Sidebar:** `/frontend/components/dashboard/sidebar.tsx` (200+ líneas)
- **Control Panel:** `/frontend/app/(dashboard)/admin/control-panel/page.tsx` (654 líneas)

### 15.4 Frontend Stores y Hooks
- **Auth Store:** `/frontend/stores/auth-store.ts` (104 líneas)
- **Settings Store:** `/frontend/stores/settings-store.ts` (94 líneas)
- **usePageVisibility Hook:** `/frontend/hooks/use-page-visibility.ts` (164 líneas)
- **API Client:** `/frontend/lib/api.ts` (334 líneas)

### 15.5 Configuración
- **Dashboard Config:** `/frontend/lib/constants/dashboard-config.ts` (135 líneas)
- **Role Permissions Config:** `/backend/app/api/role_permissions.py` líneas 59-86

---

## 16. RESUMEN EJECUTIVO

### 16.1 Lo Que Funciona Bien

✅ **JWT Authentication:** Sistema robusto con refresh tokens y rotación  
✅ **Admin Control Panel:** UI completa para gestionar visibilidad global  
✅ **Permisos por Rol:** API endpoints disponibles para control granular  
✅ **Auditoría básica:** Registro de quién cambió qué y cuándo  
✅ **Multi-lenguaje:** Nombres de páginas en japonés e inglés  
✅ **Exportación/Importación:** Capacidad de backup de configuración  

### 16.2 Lo Que Falta o Está Incompleto

❌ **Desincronización de Roles:** 8 definidos vs 4 en panel  
❌ **Desincronización de Páginas:** No todas las rutas del frontend están en permisos  
❌ **Protección Frontend:** Sin validación granular de permisos en rutas  
❌ **Inicialización Automática:** Requiere setup manual  
❌ **Auditoría Completa:** No hay tabla de historial de cambios  
❌ **Documentación:** Falta especificación de matriz de permisos default  

### 16.3 Recomendaciones Críticas

1. **URGENTE:** Sincronizar lista de roles en backend, API y panel frontend
2. **URGENTE:** Sincronizar lista de páginas en todas las definiciones
3. **IMPORTANTE:** Implementar protección de rutas granular en frontend
4. **IMPORTANTE:** Crear seed de datos para inicialización automática
5. **DESEABLE:** Implementar auditoría completa de cambios de seguridad

---

**Fin del Análisis Exhaustivo**  
*Este documento NO contiene modificaciones de código, solo exploración y documentación.*
