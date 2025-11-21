# ANÁLISIS COMPLETO: AUTENTICACIÓN Y CONTROL DE ROLES (RBAC)
## UNS-ClaudeJP 5.4.1

---

## 1. AUTENTICACIÓN (JWT + TOKENS)

### 1.1 Generación y Validación de Tokens

**Archivo:** `backend/app/services/auth_service.py` (líneas 74-616)

#### Access Token (Acceso a API)
- **Algoritmo:** HS256 (HMAC-SHA256)
- **Duración:** `settings.ACCESS_TOKEN_EXPIRE_MINUTES` (default: 480 minutos = 8 horas)
- **Claims Incluidos:**
  - `sub`: Username (sujeto/usuario)
  - `exp`: Fecha de expiración
  - `iat`: Fecha de emisión
  - `nbf`: Not Before (no válido antes de)
  - `iss`: Issuer (emisor - desde config)
  - `aud`: Audience (audiencia - desde config)
  - `jti`: JWT ID (único por token)
  - `type`: "access" (tipo de token)
  - Datos custom: role, etc.

#### Refresh Token (Renovación)
- **Duración:** `settings.REFRESH_TOKEN_EXPIRE_DAYS` (default: 30 días)
- **Almacenamiento:** Tabla `refresh_tokens` en PostgreSQL
- **Rotación:** Token viejo se revoca al generar uno nuevo
- **Estado Auditado:**
  - `user_agent`: User-Agent del cliente
  - `ip_address`: IP del cliente
  - `revoked`: Flag de revocación
  - `revoked_at`: Marca de tiempo de revocación

**Problemas Detectados:**
❌ Los tokens se almacenan en HttpOnly cookies Y en el response body (líneas 118-143 en auth.py)
❌ El frontend guarda el token en localStorage (línea 89 de auth-store.ts) cuando debería venir de cookies
❌ Doble almacenamiento = riesgo de XSS si localStorage se ve comprometido

### 1.2 Endpoints de Autenticación

| Endpoint | Método | Protección | Tasa Límite | Descripción |
|----------|--------|-----------|-----------|------------|
| `/api/auth/register` | POST | No | 3/hora | Registrar usuario nuevo |
| `/api/auth/login` | POST | No | 5/minuto | Login (username/password) |
| `/api/auth/refresh` | POST | No | 10/minuto | Renovar access token |
| `/api/auth/logout` | POST | **Sí** | No | Revocar refresh token |
| `/api/auth/me` | GET | **Sí** | No | Obtener usuario actual |
| `/api/auth/me` | PUT | **Sí** | No | Actualizar usuario actual |
| `/api/auth/change-password` | POST | **Sí** | No | Cambiar contraseña |
| `/api/auth/users` | GET | **Sí (admin)** | No | Listar todos los usuarios |
| `/api/auth/users/{id}` | DELETE | **Sí (super_admin)** | No | Eliminar usuario |

**Problemas Detectados:**
❌ `/api/auth/register` está abierto - permite registro sin restricciones
⚠️ Limitador de tasa débil en login (5/minuto = 7200 intentos/día por IP)
❌ No hay validación de contraseña fuerte en registro

### 1.3 Verificación de Tokens

**Función:** `AuthService.get_current_user()` (líneas 406-478)

```python
# DEV MODE BYPASS - CRITICO
if settings.ENVIRONMENT == "development" and token and token.startswith("dev-admin-token-"):
    user = db.query(User).filter(User.username == "admin").first()
    return user
```

**PROBLEMA CRÍTICO:**
❌ En modo desarrollo, cualquier token que empiece con "dev-admin-token-" es válido
❌ NO se verifica JWT
❌ NO valida firma ni expiración
❌ Retorna automáticamente usuario admin
❌ Riesgo de que esto se deje activado en producción

**Validación Correcta:**
✓ Verifica firma JWT con SECRET_KEY
✓ Verifica expiración (exp claim)
✓ Verifica issuer (iss claim)
✓ Verifica audience (aud claim)
✓ Verifica tipo de token (type == "access")
✓ Verifica que usuario existe en DB

---

## 2. JERARQUÍA DE ROLES Y PERMISOS

### 2.1 6 Roles Principales (Estándar)

**Archivo:** `backend/app/models/models.py` (líneas 21-29)

```
SUPER_ADMIN (0)
    ↓
ADMIN (1)
    ↓
COORDINATOR (2)
    ↓
KANRININSHA (3)
    ↓
EMPLOYEE (4)
    ↓
CONTRACT_WORKER (5)
```

**Matriz de Permisos por Rol:**

| Página/Recurso | SUPER_ADMIN | ADMIN | COORDINATOR | KANRININSHA | EMPLOYEE | CONTRACT_WORKER |
|---|---|---|---|---|---|---|
| Dashboard | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |
| Candidatos (CRUD) | ✓ | ✓ | ✓ | ✓ | ✗ | ✗ |
| Empleados (CRUD) | ✓ | ✓ | ✓ | ✓ | ✗ | ✗ |
| Fábricas (CRUD) | ✓ | ✓ | ✓ | ✓ | ✗ | ✗ |
| Apartamentos (CRUD) | ✓ | ✓ | ✓ | ✓ | ✗ | ✗ |
| Tarjetas de Tiempo | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |
| Nómina (Ver) | ✓ | ✓ | ✓ | ✓ | ✓ | ✗ |
| Nómina (Editar) | ✓ | ✓ | ✗ | ✓ | ✗ | ✗ |
| Solicitudes (Crear) | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |
| Solicitudes (Aprobar) | ✓ | ✓ | ✓ | ✓ | ✗ | ✗ |
| Reportes | ✓ | ✓ | ✓ | ✓ | ✓ | ✗ |
| Admin (Usuarios) | ✓ | ✓ | ✗ | ✗ | ✗ | ✗ |
| Admin (Sistema) | ✓ | ✓ | ✗ | ✗ | ✗ | ✗ |
| Monitoreo | ✓ | ✓ | ✗ | ✗ | ✗ | ✗ |
| Respaldo de DB | **Solo SUPER_ADMIN** | - | - | - | - | - |

### 2.2 2 Roles Legacy (Compatibilidad)

**Archivo:** `backend/app/models/models.py` (líneas 24-25)

```python
KEITOSAN = "KEITOSAN"      # 経理管理 - Finance/Accounting Manager
TANTOSHA = "TANTOSHA"      # 担当者 - HR/Operations Representative
```

**Permisos Legacy:**
- **KEITOSAN:** Finance pages (salary, payroll reports) + HR base
- **TANTOSHA:** HR pages (candidates, employees, factories) + base

**PROBLEMA:**
❌ Roles legacy NO incluidos en la jerarquía principal
❌ No se pueden comparar con `require_role("admin")` - deben manejarse especialmente
❌ Crean inconsistencia en validación de acceso
⚠️ Los permisos hardcodeados pueden desincronizarse con `role_permissions` API

---

## 3. RBAC (ROLE-BASED ACCESS CONTROL)

### 3.1 Mecanismo de Protección de Endpoints

**2 Métodos de Protección:**

#### Método 1: `require_role()` (Backend - Recomendado)
```python
@router.post("/salary/calculate/")
async def calculate_salary(
    current_user: User = Depends(auth_service.require_role("admin"))
):
    # Solo SUPER_ADMIN y ADMIN
```

**Validación de rol (líneas 552-569 en auth_service.py):**
```python
allowed_roles = {
    'super_admin': ['SUPER_ADMIN'],
    'admin': ['SUPER_ADMIN', 'ADMIN'],
    'coordinator': ['SUPER_ADMIN', 'ADMIN', 'COORDINATOR'],
    'kanrininsha': ['SUPER_ADMIN', 'ADMIN', 'COORDINATOR', 'KANRININSHA'],
    'employee': [...5 roles...],
    'contract_worker': [...6 roles...],
}
```

**Uso en Backend:**
- `auth.py`: 2 endpoints (lista usuarios, borra usuarios)
- `salary.py`: 7 endpoints
- `database.py`: 8 endpoints
- `admin.py`: Todos los endpoints

#### Método 2: `role_permissions` API (Frontend Dynamic)
**Archivo:** `backend/app/api/role_permissions.py`

- Base de datos de permisos por rol/página
- 54 páginas definidas en `AVAILABLE_PAGES` (líneas 59-136)
- 8 roles en `AVAILABLE_ROLES` (líneas 142-151)
- Matriz de permisos configurable en runtime

**Endpoints:**
- `GET /api/role-permissions/roles` - Lista roles disponibles
- `GET /api/role-permissions/pages` - Lista páginas disponibles
- `GET /api/role-permissions/{role_key}` - Permisos de un rol
- `PUT /api/role-permissions/{role_key}/{page_key}` - Actualizar permiso
- `POST /api/role-permissions/bulk-update/{role_key}` - Bulk update
- `GET /api/role-permissions/check/{role_key}/{page_key}` - Verificar acceso
- `GET /api/role-permissions/user/{user_id}/permissions` - Permisos del usuario
- `POST /api/role-permissions/reset/{role_key}` - Reset a defaults
- `POST /api/role-permissions/initialize-defaults` - Inicializar todo

### 3.2 Protección en Frontend

**Archivo:** `frontend/lib/api.ts`

**Interceptor de Respuesta (líneas 107-136):**
```javascript
if (error.response?.status === 401) {
    useAuthStore.getState().logout();
    if (typeof window !== 'undefined' && window.location.pathname !== '/login') {
        window.location.href = '/login';
    }
}
```

✓ Si token expira (401), logout automático
✓ Redirección a login
❌ Pero el token también está en localStorage, así que hay redundancia

---

## 4. PROBLEMAS DE SEGURIDAD IDENTIFICADOS

### 4.1 CRÍTICOS

| ID | Problema | Ubicación | Impacto | Severidad |
|---|---------|-----------|--------|----------|
| **AUTH-001** | Dev token bypass | `auth_service.py:451-455` | Autenticación completamente ignorada en dev | 🔴 CRÍTICO |
| **AUTH-002** | Doble almacenamiento de tokens | `auth.py:138-143` + `auth-store.ts:89` | XSS puede robar del localStorage | 🔴 CRÍTICO |
| **AUTH-003** | Roles legacy sin integración | `deps.py:36` | Inconsistencia en validación de rol | 🔴 CRÍTICO |
| **AUTH-004** | Direct role comparisons | `apartments_v2.py`, `employees.py`, etc. | Bypasses de require_role posibles | 🔴 CRÍTICO |

### 4.2 ALTOS

| ID | Problema | Ubicación | Impacto | Severidad |
|---|---------|-----------|--------|----------|
| **AUTH-005** | Registro abierto sin validación | `auth.py:24-66` | Spam, creación de cuentas maliciosas | 🟠 ALTO |
| **AUTH-006** | Rate limit débil en login | `auth.py:70` | 7200 intentos/día por IP | 🟠 ALTO |
| **AUTH-007** | Roles legacy no en hierarchy | `models.py:24-25` | Comparaciones desincronizadas | 🟠 ALTO |
| **AUTH-008** | `require_admin` simplificado | `deps.py:30-41` | Solo compara strings, no enum | 🟠 ALTO |

### 4.3 MEDIOS

| ID | Problema | Ubicación | Impacto | Severidad |
|---|---------|-----------|--------|----------|
| **AUTH-009** | Permisos DB vs hardcoded | `role_permissions.py` vs `auth_service.py` | Inconsistencia en aplicación | 🟡 MEDIO |
| **AUTH-010** | Sin verificación email | `auth.py:24-66` | Cuentas con emails inválidos | 🟡 MEDIO |
| **AUTH-011** | Token en body + cookie | `auth.py:138-143` | Confusión sobre source of truth | 🟡 MEDIO |
| **AUTH-012** | Sin MFA/2FA | Ninguno | Cuentas vulnerable a fuerza bruta | 🟡 MEDIO |

---

## 5. MATRIZ DE PROTECCIÓN DE ENDPOINTS

### 5.1 Endpoints SIN Protección

```
POST /api/auth/register           ← ABIERTO
POST /api/auth/login              ← ABIERTO (solo rate limited)
POST /api/auth/refresh            ← ABIERTO (solo rate limited)
GET  /                            ← ABIERTO (root endpoint)
GET  /api/health                  ← ABIERTO (salud del sistema)
```

### 5.2 Endpoints CON Protección require_role("admin")

```
Endpoint                          | Línea | Protección
GET    /api/salary/                 | 146 | require_role("admin")
POST   /api/salary/calculate/        | 203 | require_role("admin")
GET    /api/salary/reports/          | 345 | require_role("admin")
PUT    /api/salary/{id}/mark-paid/   | 368 | require_role("admin")
GET    /api/salary/stats/            | 423 | require_role("admin")
POST   /api/salary/export/excel/     | 495 | require_role("admin")
POST   /api/salary/export/pdf/       | 546 | require_role("admin")

GET    /api/admin/pages              | 63  | require_admin
PUT    /api/admin/pages/{key}        | 89  | require_admin
GET    /api/admin/settings           | 143 | require_admin
etc...
```

### 5.3 Endpoints CON Protección require_role("super_admin")

```
GET    /api/database/tables          | 37  | require_role("super_admin")
DELETE /api/auth/users/{id}         | 353 | require_role("super_admin")
```

---

## 6. INCONSISTENCIAS Y CONFLICTOS

### 6.1 Direct Role Checks (No recomendado)

Estos endpoints hacen comparaciones de rol directas en lugar de usar `require_role()`:

```python
# ❌ apartments_v2.py (línea)
if current_user.role not in [UserRole.ADMIN, UserRole.COORDINATOR]:

# ❌ employees.py  
if current_user.role != UserRole.SUPER_ADMIN:

# ❌ pages.py
if current_user.role not in [UserRole.ADMIN, UserRole.SUPER_ADMIN]:

# ❌ requests.py
if current_user.role.value == "employee":

# ❌ salary.py
if current_user.role.value == "EMPLOYEE":

# ❌ timer_cards.py
user_role = current_user.role.value

# ❌ yukyu.py
if current_user.role in [UserRole.ADMIN, UserRole.SUPER_ADMIN, UserRole.KEITOSAN]:
```

**Problemas:**
1. Falta KANRININSHA, COORDINATOR en muchos checks
2. No incluyen roles legacy (KEITOSAN, TANTOSHA)
3. Inconsistencia: algunos usan `.name`, otros `.value`
4. Fácil de bugear si se añade un nuevo rol

### 6.2 String vs Enum

- `auth_service.py`: Compara strings (`'admin'`, `'SUPER_ADMIN'`)
- `apartments_v2.py`: Compara enums (`UserRole.ADMIN`)
- `deps.py`: Compara strings (`"SUPER_ADMIN"`, `"ADMIN"`)
- `timer_cards.py`: Compara `.value` (string)

**Problema:** Inconsistencia hace difícil mantener/debugear

---

## 7. FLUJO COMPLETO DE AUTENTICACIÓN

```
1. Usuario hace login
   POST /api/auth/login
   {username: "admin", password: "admin123"}
   ↓
2. Backend autentica
   - Busca usuario en DB
   - Verifica password con bcrypt
   - Si OK, crea tokens
   ↓
3. Tokens generados
   - access_token (480 min): JWT con claims
   - refresh_token (30 días): JWT + registrado en DB
   ↓
4. Response al cliente
   {
     "access_token": "eyJ...",
     "refresh_token": "eyJ...",
     "token_type": "bearer"
   }
   + HttpOnly cookies con ambos tokens
   ↓
5. Frontend almacena
   localStorage: token (AUTH-002: PROBLEMA)
   cookies: access_token, refresh_token (HttpOnly)
   ↓
6. Requests posteriores
   - axios interceptor agrega "Authorization: Bearer {token}"
   - O usa cookie si no hay header
   ↓
7. Backend valida
   - Extrae token de header O cookie
   - Verifica JWT
   - Busca usuario en DB
   - Verifica activo (is_active=True)
   ↓
8. Si 401 (token expirado)
   - Frontend intercepta error 401
   - Intenta refresh
   POST /api/auth/refresh con refresh_token
   ↓
9. Token renovado
   - Refresh token viejo se revoca
   - Nuevos tokens se crean
   - Cliente continúa
```

---

## 8. CHECKLIST DE SEGURIDAD

### JWT y Tokens
- ✓ Algoritmo seguro (HS256)
- ✓ Claims completos (exp, iat, iss, aud, jti)
- ✓ Verificación de firma
- ✓ Verificación de expiración
- ✓ Refresh token en DB (permite revocación)
- ❌ Dev token bypass activo
- ❌ Doble almacenamiento (localStorage + cookie)
- ❌ Sin MFA/2FA

### Contraseñas
- ✓ Hashed con bcrypt (CRYPT_CONTEXT)
- ✓ Verificación segura (timing attack resistant)
- ✓ `change-password` endpoint
- ❌ Registro sin validación de fortaleza
- ❌ Sin requisitos de complejidad

### Roles y Permisos
- ✓ Jerarquía clara (6 roles)
- ✓ Sistema RBAC en DB
- ✓ Endpoints protegidos con `require_role()`
- ✓ Auditoría de tokens (user_agent, ip_address)
- ❌ Roles legacy sin integración
- ❌ Direct role checks en algunos endpoints
- ❌ String vs Enum inconsistente
- ❌ Permisos DB vs hardcoded pueden desincronizarse

### Endpoints
- ✓ Rate limiting en login y registro
- ✓ Logout revoca refresh tokens
- ✓ Logout from all devices disponible
- ❌ Registro abierto sin validación
- ❌ Rate limit débil (5/min login)
- ❌ Health check sin autenticación (normal)

---

## 9. RECOMENDACIONES

### Inmediatas (Críticas)

1. **Deshabilitar dev token bypass**
   ```python
   # Eliminar líneas 451-455 en auth_service.py
   if settings.ENVIRONMENT == "development" and token and token.startswith("dev-admin-token-"):
       ...
   ```

2. **Usar solo cookies HttpOnly para tokens**
   - NO guardar en localStorage
   - Axios puede leer de cookies automáticamente
   - CSRF protection con SameSite=Strict (ya configurado)

3. **Consolidar validación de roles**
   - Usar SIEMPRE `require_role()` vs direct checks
   - Mover todo a enums (no strings)
   - Incluir roles legacy en validación

4. **Sincronizar permisos**
   - `role_permissions.py` debe ser source of truth
   - Direct checks en endpoints deben usar eso
   - O hardcodear en un solo lugar

### Corto Plazo (Altos)

1. Validar contraseña en registro (12+ caracteres, mixto)
2. Aumentar rate limit login (2-3/min en lugar de 5)
3. Agregar email verification
4. Documentar roles legacy y deprecarlos

### Mediano Plazo

1. Implementar MFA/2FA
2. Audit log de auth (login/logout/token refresh)
3. Session management (logout expira todas)
4. OAuth2 integración (Google, etc.)

---

## 10. ARCHIVOS CLAVE

| Archivo | Responsabilidad | Estado |
|---------|-----------------|--------|
| `backend/app/services/auth_service.py` | Lógica de auth (JWT, password) | ⚠️ Dev bypass |
| `backend/app/api/auth.py` | Endpoints de auth | ⚠️ Registro abierto |
| `backend/app/api/deps.py` | Dependencias (require_admin) | ⚠️ Simplificado |
| `backend/app/api/role_permissions.py` | RBAC en DB | ✓ OK |
| `backend/app/models/models.py` | User, RefreshToken models | ⚠️ Legacy roles |
| `frontend/lib/api.ts` | API client + interceptors | ⚠️ localStorage |
| `frontend/stores/auth-store.ts` | Auth state (Zustand) | ⚠️ localStorage |

