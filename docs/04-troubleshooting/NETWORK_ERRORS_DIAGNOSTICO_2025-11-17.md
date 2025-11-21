# 🔍 Diagnóstico Completo de Errores de Red y CSP - 2025-11-17

## 📋 Resumen Ejecutivo

El usuario reportó **3 categorías de errores** al acceder a `http://localhost:3000/dashboard`:

1. **Content Security Policy (CSP)** - Headers CSP bloqueando recursos
2. **Network Errors (ERR_NETWORK)** - APIs fallando en `/api/candidates`, `/api/factories`, `/api/timer-cards`
3. **Consola del navegador** - "Unable to add filesystem: <illegal path>" + CSP violations

---

## 🔍 PROBLEMA #1: Content Security Policy Errors

### Síntomas Reportados
```
- "font-src 'self' data:" blocked
- "connect-src 'self' <URL> ws:<URL>" blocked
```

### Causa Raíz
**NGINX NO TIENE CONFIGURACIÓN CSP DEFINIDA** ❌

**Evidencia:**
- Archivo: `D:\UNS-ClaudeJP-6.0.0\docker\conf.d\default.conf`
- **NINGÚN header CSP configurado** en nginx
- Nginx solo tiene configuración básica de proxy

### Impacto
- Navegador aplicando CSP **restrictiva por defecto**
- Bloqueando:
  - Fuentes de datos (`data:` URIs)
  - WebSocket connections
  - Conexiones a APIs externas
  - Recursos de frontend

### Diagnóstico Detallado

**Archivo actual: `docker/conf.d/default.conf` (líneas 20-27)**
```nginx
location /api/ {
    proxy_pass http://backend/api/;
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
    proxy_read_timeout 30s;
}
```

**❌ FALTA:**
- `add_header Content-Security-Policy`
- Directivas CSP para frontend
- Directivas CSP para APIs

---

## 🔍 PROBLEMA #2: Network Errors (ERR_NETWORK)

### Síntomas Reportados
```
ERR_NETWORK en:
- /api/candidates
- /api/factories
- /api/timer-cards
```

### Causa Raíz #1: **INCONSISTENCIA EN CONFIGURACIÓN DE URLs** ❌

**Evidencia:**

1. **Frontend `.env.local` (línea 3):**
   ```env
   NEXT_PUBLIC_API_URL=http://localhost:8000/api
   ```
   ✅ Apunta DIRECTAMENTE al backend en puerto 8000

2. **Root `.env` (línea 29):**
   ```env
   NEXT_PUBLIC_API_URL=http://localhost:8000/api
   ```
   ✅ Misma configuración

3. **Docker Compose `frontend` (línea 287):**
   ```yaml
   environment:
     NEXT_PUBLIC_API_URL: /api
   ```
   ❌ OVERRIDE con ruta RELATIVA

4. **Frontend API client `lib/api.ts` (líneas 56-63):**
   ```typescript
   const normalizeBaseUrl = (url: string): string => {
     if (!url) return '/api';
     const trimmed = url.replace(/\/+$/, '');
     return trimmed.endsWith('/api') ? trimmed : `${trimmed}/api`;
   };
   const API_BASE_URL = normalizeBaseUrl(process.env.NEXT_PUBLIC_API_URL || '/api');
   ```
   ✅ Normaliza correctamente, pero recibe `/api` del container

**RESULTADO:**
- Frontend en browser usa: `/api` (relativa)
- Browser hace request a: `http://localhost:3000/api/candidates`
- Nginx escucha en puerto 80, NO en puerto 3000
- **REQUEST NUNCA LLEGA A NGINX** ❌

### Causa Raíz #2: **BACKEND DEVUELVE HTTP 307 REDIRECT** ❌

**Evidencia de logs del backend (líneas relevantes):**
```
backend-1  | [1mINFO[0m | {'value': 0.006022724000104063, 'route': '/api/candidates', 'status': 307}
backend-1  | INFO:     172.18.0.5:38448 - "GET /api/candidates HTTP/1.1" 307 Temporary Redirect
backend-1  | INFO:     172.18.0.5:38450 - "GET /api/factories HTTP/1.1" 307 Temporary Redirect
backend-1  | INFO:     172.18.0.5:38464 - "GET /api/timer-cards HTTP/1.1" 307 Temporary Redirect
```

**ANÁLISIS:**
- Backend recibe requests correctamente
- Pero **RESPONDE CON 307 REDIRECT** en lugar de 200 OK
- El backend está configurado para **EXIGIR TRAILING SLASH** en endpoints
- Frontend hace request a: `/api/candidates` (SIN trailing slash)
- Backend redirige a: `/api/candidates/` (CON trailing slash)
- Browser no puede seguir el redirect por CORS o CSP

**Archivo: `backend/app/api/candidates.py` (ejemplo típico):**
```python
@router.get("/", response_model=PaginatedResponse[Candidate])
async def get_candidates(...):
    # Endpoint espera trailing slash
```

**Frontend: `lib/api.ts` (línea 206):**
```typescript
getCandidates: async (params?: CandidateListParams): Promise<PaginatedResponse<Candidate>> => {
  const response = await api.get<PaginatedResponse<Candidate>>('/candidates', { params });
  // ❌ FALTA trailing slash: debería ser '/candidates/'
  return response.data;
},
```

### Causa Raíz #3: **NGINX NO ESTÁ SIENDO USADO** ❌

**Evidencia:**

1. **Frontend hace requests a puerto 3000:**
   ```
   http://localhost:3000/api/candidates
   ```

2. **Nginx escucha en puerto 80:**
   ```nginx
   server {
       listen 80;
       listen [::]:80;
   }
   ```

3. **Resultado:**
   - Requests NUNCA pasan por nginx
   - Frontend intenta conectar directamente al backend
   - Pero usa URL relativa `/api` que apunta al mismo puerto (3000)
   - Backend NO escucha en puerto 3000, solo en 8000 (interno)

---

## 🔍 PROBLEMA #3: Consola del Navegador

### Síntomas Reportados
```
- "Unable to add filesystem: <illegal path>"
- CSP violations
- Network errors
```

### Causa Raíz
**COMBINACIÓN DE PROBLEMAS #1 Y #2**

1. **CSP violations** → Causado por PROBLEMA #1
2. **Network errors** → Causado por PROBLEMA #2
3. **"Unable to add filesystem"** → Likely CSP blocking filesystem access

---

## 📊 Flujo Actual vs. Flujo Esperado

### ❌ Flujo ACTUAL (ROTO)

```
Browser (localhost:3000)
    ↓
Request: GET http://localhost:3000/api/candidates
    ↓
Frontend container (puerto 3000)
    ↓ (intenta conectar internamente)
❌ FALLA - No hay servidor en /api en frontend
    ↓
ERR_NETWORK
```

### ✅ Flujo ESPERADO (CORRECTO)

```
Browser (localhost:3000)
    ↓
Request: GET http://localhost:3000/api/candidates
    ↓
[DEBE SER] Request: GET http://localhost/api/candidates/
    ↓
Nginx (puerto 80)
    ↓
proxy_pass → http://backend:8000/api/candidates/
    ↓
Backend container
    ↓
200 OK + JSON data
```

---

## 🛠️ SOLUCIONES REQUERIDAS

### Solución #1: Configurar CSP Headers en Nginx ✅

**Archivo:** `docker/conf.d/default.conf`

**Agregar en `location /api/`:**
```nginx
location /api/ {
    proxy_pass http://backend/api/;

    # Headers existentes
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
    proxy_read_timeout 30s;

    # NUEVO: CORS headers
    add_header 'Access-Control-Allow-Origin' 'http://localhost:3000' always;
    add_header 'Access-Control-Allow-Methods' 'GET, POST, PUT, DELETE, PATCH, OPTIONS' always;
    add_header 'Access-Control-Allow-Headers' 'Content-Type, Authorization, X-Request-ID, Accept' always;
    add_header 'Access-Control-Allow-Credentials' 'true' always;

    # Handle preflight requests
    if ($request_method = 'OPTIONS') {
        return 204;
    }
}
```

**Agregar en `location /`:**
```nginx
location / {
    proxy_pass http://frontend;
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;

    # NUEVO: CSP para frontend
    add_header Content-Security-Policy "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline'; font-src 'self' data:; img-src 'self' data: https:; connect-src 'self' http://localhost http://localhost:8000 http://localhost:3000 ws://localhost:3000;" always;

    # WebSocket support
    proxy_http_version 1.1;
    proxy_set_header Upgrade $http_upgrade;
    proxy_set_header Connection "upgrade";
}
```

### Solución #2: Corregir URL del Frontend ✅

**Opción 2A: Usar Nginx como proxy (RECOMENDADO)**

**Archivo:** `docker-compose.yml` (línea 287)

**CAMBIAR:**
```yaml
environment:
  NEXT_PUBLIC_API_URL: /api
```

**A:**
```yaml
environment:
  NEXT_PUBLIC_API_URL: http://localhost/api
```

**O configurar en `frontend/.env.local`:**
```env
NEXT_PUBLIC_API_URL=http://localhost/api
```

**Opción 2B: Acceso directo al backend (ALTERNATIVA)**

Si prefieres NO usar nginx:

```yaml
environment:
  NEXT_PUBLIC_API_URL: http://localhost:8000/api
```

Y exponer puerto 8000 en backend:
```yaml
backend:
  ports:
    - "8000:8000"
```

### Solución #3: Agregar Trailing Slashes en Frontend ✅

**Archivo:** `frontend/lib/api.ts`

**CAMBIAR todos los endpoints (ejemplos):**

```typescript
// Candidates
getCandidates: async (params?: CandidateListParams): Promise<PaginatedResponse<Candidate>> => {
  const response = await api.get<PaginatedResponse<Candidate>>('/candidates/', { params }); // ← Agregar /
  return response.data;
},

// Factories
getFactories: async (params?: Record<string, unknown>): Promise<Factory[]> => {
  const response = await api.get<Factory[]>('/factories/', { params }); // ← Agregar /
  return response.data;
},

// Timer Cards
getTimerCards: async <T = TimerCard[]>(params?: TimerCardListParams): Promise<T> => {
  const response = await api.get<T>('/timer-cards/', { params }); // ← Agregar /
  return response.data;
},
```

**NOTA:** FastAPI exige trailing slash en endpoints definidos con `@router.get("/")`

### Solución #4: Configurar CORS en Backend (Verificación) ✅

**Archivo:** `backend/app/main.py` (líneas 131-146)

**VERIFICAR que incluya:**
```python
safe_origins = [
    origin
    for origin in settings.BACKEND_CORS_ORIGINS
    if isinstance(origin, str) and origin.startswith(("http://", "https://"))
]

# DEBE INCLUIR:
# - http://localhost
# - http://localhost:3000
# - http://127.0.0.1:3000

app.add_middleware(
    CORSMiddleware,
    allow_origins=safe_origins,
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
    allow_headers=["Content-Type", "Authorization", "X-Request-ID", "Accept"],
    max_age=3600,
)
```

**VERIFICAR `.env` (línea 11):**
```env
BACKEND_CORS_ORIGINS=http://localhost:3000,http://127.0.0.1:3000
```

**AGREGAR si falta:**
```env
BACKEND_CORS_ORIGINS=http://localhost,http://localhost:3000,http://127.0.0.1:3000
```

---

## 🔧 PLAN DE ACCIÓN PASO A PASO

### Paso 1: Verificar Servicios Activos
```bash
docker compose ps
```

**Esperado:**
- ✅ nginx (puerto 80)
- ✅ frontend (puerto 3000)
- ✅ backend (puerto 8000 interno)

### Paso 2: Aplicar Solución #1 (CSP + CORS en Nginx)
```bash
# Editar docker/conf.d/default.conf
# Aplicar cambios de Solución #1

# Reiniciar nginx
docker compose restart nginx
```

### Paso 3: Aplicar Solución #2 (URL del Frontend)
```bash
# Opción A: Editar docker-compose.yml línea 287
# CAMBIAR: NEXT_PUBLIC_API_URL: /api
# A: NEXT_PUBLIC_API_URL: http://localhost/api

# Reiniciar frontend
docker compose restart frontend
```

### Paso 4: Aplicar Solución #3 (Trailing Slashes)
```bash
# Editar frontend/lib/api.ts
# Agregar / al final de todos los endpoints
# Ejemplos: '/candidates/', '/factories/', '/timer-cards/'

# Reiniciar frontend
docker compose restart frontend
```

### Paso 5: Verificar CORS en Backend
```bash
# Verificar .env línea 11
# BACKEND_CORS_ORIGINS=http://localhost,http://localhost:3000,http://127.0.0.1:3000

# Si cambió, reiniciar backend
docker compose restart backend
```

### Paso 6: Test Completo
```bash
# Acceder a http://localhost/dashboard (NOTA: Puerto 80, NO 3000)
# O configurar frontend para usar http://localhost:3000 pero con API en http://localhost/api

# Verificar en consola del navegador (F12):
# - ✅ No CSP errors
# - ✅ No ERR_NETWORK
# - ✅ APIs responden 200 OK
# - ✅ Dashboard carga datos correctamente
```

---

## 📋 CHECKLIST DE VERIFICACIÓN

### Nginx
- [ ] CSP headers configurados en `location /`
- [ ] CORS headers configurados en `location /api/`
- [ ] WebSocket support habilitado
- [ ] Nginx reiniciado

### Frontend
- [ ] `NEXT_PUBLIC_API_URL` apunta a `http://localhost/api` (vía nginx)
- [ ] O `http://localhost:8000/api` (directo al backend)
- [ ] Trailing slashes agregados en `lib/api.ts`
- [ ] Frontend reiniciado

### Backend
- [ ] CORS origins incluyen `http://localhost`
- [ ] Endpoints responden a trailing slashes
- [ ] Backend saludable (HTTP 200 en `/api/health`)

### Browser
- [ ] Acceder a `http://localhost/dashboard` (puerto 80)
- [ ] Consola (F12) sin CSP errors
- [ ] Network tab sin ERR_NETWORK
- [ ] APIs responden 200 OK con JSON

---

## 🎯 RESUMEN DE CAUSAS RAÍZ

| Problema | Causa Raíz | Solución |
|----------|------------|----------|
| **CSP Errors** | Nginx sin headers CSP configurados | Agregar `Content-Security-Policy` en nginx |
| **ERR_NETWORK** | Frontend usa URL relativa `/api` que apunta a puerto 3000 en lugar de 80 | Cambiar a `http://localhost/api` (nginx) |
| **HTTP 307** | Backend exige trailing slash, frontend no lo envía | Agregar `/` al final de endpoints |
| **CORS** | Backend podría no incluir `http://localhost` en origins | Verificar `BACKEND_CORS_ORIGINS` |
| **Routing** | Requests no pasan por nginx | Usar puerto 80 o configurar URL absoluta |

---

## 📝 NOTAS ADICIONALES

### Arquitectura Actual vs. Esperada

**ACTUAL (Roto):**
```
Browser → http://localhost:3000/api → Frontend container → ❌ No hay backend aquí
```

**ESPERADO (Correcto):**
```
Browser → http://localhost/api → Nginx (puerto 80) → Backend container → ✅ 200 OK
```

**ALTERNATIVA (Sin nginx):**
```
Browser → http://localhost:8000/api → Backend container → ✅ 200 OK
```

### Servicios y Puertos

| Servicio | Puerto Externo | Puerto Interno | Propósito |
|----------|---------------|----------------|-----------|
| Frontend | 3000 | 3000 | Next.js App |
| Backend | - | 8000 | FastAPI (solo interno) |
| Nginx | 80, 443 | 80, 443 | Reverse Proxy |
| PostgreSQL | 5432 | 5432 | Database |
| Adminer | 8080 | 8080 | DB UI |
| Grafana | 3001 | 3000 | Observability |
| Prometheus | 9090 | 9090 | Metrics |

### Environment Variables Críticas

```env
# Root .env
NEXT_PUBLIC_API_URL=http://localhost:8000/api  # ← Cambiar a http://localhost/api
FRONTEND_URL=http://localhost:3000
BACKEND_CORS_ORIGINS=http://localhost,http://localhost:3000,http://127.0.0.1:3000

# frontend/.env.local (override del container)
NEXT_PUBLIC_API_URL=http://localhost/api  # ← Usar nginx como proxy
```

### FastAPI Trailing Slash Behavior

FastAPI **EXIGE trailing slash** cuando endpoint está definido como:
```python
@router.get("/", ...)  # ← Espera /candidates/
```

Request a `/candidates` → **307 Redirect** a `/candidates/`

**Solución:** Agregar `/` en frontend O usar `@router.get("")` en backend

---

## 🚀 SIGUIENTE PASO

**RECOMENDACIÓN:** Aplicar soluciones en este orden:

1. ✅ **Solución #3** (Trailing slashes) - Más rápido
2. ✅ **Solución #2** (URL frontend) - Crítico
3. ✅ **Solución #1** (CSP/CORS nginx) - Importante para producción
4. ✅ **Verificación** (Test completo)

**Estimado de tiempo:** 15-30 minutos

**Prioridad:** 🔴 ALTA - Sistema actualmente no funcional en browser

---

## 📞 CONTACTO

**Generado por:** @devops-troubleshooter
**Fecha:** 2025-11-17
**Versión:** UNS-ClaudeJP 6.0.0
**Estado:** DIAGNÓSTICO COMPLETO - REQUIERE ACCIÓN
