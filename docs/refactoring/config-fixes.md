# 🔧 CONFIGURACIÓN DEFINITIVA - UNS-ClaudeJP v6.0.0

> **IMPORTANTE:** Este documento registra TODAS las correcciones aplicadas para evitar problemas futuros.
> Si reinstalizas o cambias de PC, aplica TODOS estos cambios automáticamente.

---

## ⚠️ PROBLEMAS SOLUCIONADOS (2025-11-17)

### 1. ❌ Password Hash Vacío → Admin No Puede Loguear
**Síntoma:** 500 Internal Server Error - "hash could not be identified"
**Causa:** Campo `password_hash` en tabla `users` estaba vacío para usuario `admin`

**SOLUCIÓN PERMANENTE:**
```bash
# El script de inicialización debe crear el hash correcto
# Ubicación: backend/scripts/fix_admin_password.py
# Se ejecuta automáticamente en docker-compose con importer service

# Password: admin123
# Hash bcrypt válido: $2b$12$QrTtHqPOCttSOUVEivFoOOS9GuyHzrI1ZdjwXqwP293j9QZ8t9S3q
```

**Configuración en docker-compose.yml (línea importer):**
- ✅ Importer service debe ejecutarse DESPUÉS de que DB esté healthy
- ✅ Debe generar hash bcrypt válido para admin/admin123
- ✅ Debe verificar que el hash se guardó correctamente

---

### 2. ❌ Login Endpoint Trailing Slash Mismatch
**Síntoma:** 404 Not Found en POST `/api/auth/login/`
**Causa:** Endpoint registrado como `/api/auth/login` (sin slash) pero frontend llamaba `/api/auth/login/` (con slash)

**SOLUCIÓN PERMANENTE:**
```python
# Archivo: backend/app/api/auth.py (línea 70-73)

@router.post("")                          # Base path
@router.post("/login", response_model=Token)   # Sin slash
@router.post("/login/", response_model=Token)  # ⭐ CON SLASH (REQUERIDO)
@limiter.limit("10/minute")
async def login(...):
    ...
```

**✅ APLICADO:** Se agregó el decorator adicional `@router.post("/login/")`

---

### 3. ❌ GET Endpoints Retornan 404 (Trailing Slash)
**Síntoma:** 404 en `/api/candidates`, `/api/factories`, `/api/timer-cards`
**Causa:** FastAPI tenía `redirect_slashes=False` → no redirigía automáticamente

**SOLUCIÓN PERMANENTE:**
```python
# Archivo: backend/app/main.py (línea 93)

app = FastAPI(
    ...
    redirect_slashes=True,  # ⭐ CAMBIO CRÍTICO: De False a True
)
```

**Efecto:** FastAPI ahora redirige automáticamente:
- `GET /api/candidates` → 307 redirect → `GET /api/candidates/` → 200 OK
- `GET /api/factories` → 307 redirect → `GET /api/factories/` → 200 OK
- `GET /api/timer-cards` → 307 redirect → `GET /api/timer-cards/` → 200 OK

---

## 📋 CHECKLIST: Configuración Correcta

Cuando reinstales o cambies de PC, verifica TODOS estos puntos:

### Backend (FastAPI)

- [ ] **backend/app/main.py línea 93:**
  ```python
  redirect_slashes=True,  # NO debe ser False
  ```

- [ ] **backend/app/api/auth.py línea 72:**
  ```python
  @router.post("/login/", response_model=Token)  # DEBE EXISTIR
  ```

- [ ] **docker-compose.yml - Importer service:**
  - Debe ejecutarse DESPUÉS de `db` y `redis` (healthchecks)
  - Debe correr comando: `python -m app.scripts.manage_db seed`
  - Debe crear usuario admin con password `admin123`
  - Hash correcto: `$2b$12$QrTtHqPOCttSOUVEivFoOOS9GuyHzrI1ZdjwXqwP293j9QZ8t9S3q`

- [ ] **frontend/lib/api.ts:**
  ```typescript
  // Frontend llama a endpoints SIN trailing slash
  '/auth/login/'      // ✅ Correcto (backend redirige si es necesario)
  '/candidates'       // ✅ Correcto (backend redirige si es necesario)
  '/factories'        // ✅ Correcto (backend redirige si es necesario)
  '/timer-cards'      // ✅ Correcto (backend redirige si es necesario)
  ```

### Database

- [ ] **Admin user existence:**
  ```sql
  SELECT username, password_hash FROM users WHERE username='admin';
  -- Debe retornar: admin | $2b$12$QrTtHqPOCttSOUVEivFoOOS9GuyHzrI1ZdjwXqwP293j9QZ8t9S3q
  ```

- [ ] **Hash verification:**
  ```python
  from passlib.context import CryptContext
  pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
  hash_from_db = "$2b$12$QrTtHqPOCttSOUVEivFoOOS9GuyHzrI1ZdjwXqwP293j9QZ8t9S3q"
  verification = pwd_context.verify("admin123", hash_from_db)
  # verification DEBE ser True
  ```

### Docker Compose

- [ ] **Services order:** db → redis → otel → tempo → prometheus → importer → backend → frontend
- [ ] **Healthchecks:** Todos los servicios deben mostrar `(healthy)`
- [ ] **Volumes:** postgres_data, redis_data, grafana_data, prometheus_data, tempo_data

---

## 🚀 COMANDOS DE VERIFICACIÓN

Ejecuta estos comandos después de instalar para verificar que TODO está correcto:

```bash
# 1. Verificar que backend tiene redirect_slashes=True
docker exec uns-claudejp-600-backend-1 grep "redirect_slashes" /app/app/main.py

# 2. Verificar que auth.py tiene ambos decorators
docker exec uns-claudejp-600-backend-1 grep -A2 "@router.post" /app/app/api/auth.py | grep -E "login|/"

# 3. Verificar admin password en base de datos
docker exec uns-claudejp-600-db psql -U uns_admin -d uns_claudejp -c \
  "SELECT username, substring(password_hash, 1, 20) as hash_prefix FROM users WHERE username='admin';"
# Debe mostrar: admin | $2b$12$QrTtHqPOCttSO

# 4. Verificar login funciona
curl -X POST http://localhost:8000/api/auth/login/ \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "username=admin&password=admin123"
# Debe retornar JSON con access_token y refresh_token

# 5. Verificar GET endpoints funcionan
curl -H "Authorization: Bearer YOUR_TOKEN_HERE" http://localhost:8000/api/candidates
# Debe retornar JSON con datos (vacío está bien si no hay candidatos)
```

---

## 📝 CREDENCIALES ESTÁNDAR

**Nunca cambies estas credenciales sin documentarlo:**

| Campo | Valor | Ubicación |
|-------|-------|-----------|
| **Admin Username** | `admin` | users.username |
| **Admin Password** | `admin123` | Hash bcrypt en users.password_hash |
| **Admin Hash** | `$2b$12$QrTtHqPOCttSOUVEivFoOOS9GuyHzrI1ZdjwXqwP293j9QZ8t9S3q` | Verificado 2025-11-17 |

---

## 🔐 Si El Password Hash Se Corrompe De Nuevo

```bash
# 1. Accede al contenedor backend
docker exec -it uns-claudejp-600-backend-1 bash

# 2. Ejecuta el script de reparación
cd /app
python scripts/fix_admin_password.py

# 3. Verifica que funcionó
# Debe mostrar: ✅ SUCCESS: Password updated correctly!

# 4. Reinicia el backend
docker compose restart backend

# 5. Prueba login
curl -X POST http://localhost:8000/api/auth/login/ \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "username=admin&password=admin123"
```

---

## 🛠️ ARCHIVOS MODIFICADOS (2025-11-17)

| Archivo | Línea | Cambio |
|---------|-------|--------|
| **backend/app/main.py** | 93 | `redirect_slashes=False` → `redirect_slashes=True` |
| **backend/app/api/auth.py** | 72 | Agregado `@router.post("/login/", response_model=Token)` |
| **database** | users table | Admin password hash actualizado y verificado |

---

## ⏱️ TIEMPO AHORRADO

**Antes de estas correcciones:**
- ❌ 3+ horas debuggeando problemas de trailing slashes
- ❌ 1+ hora debuggeando password hash corrupto
- ❌ Reiniciar servicios múltiples veces

**Después de estas correcciones:**
- ✅ 0 minutos - Sistema arranca sin errores
- ✅ Login funciona inmediatamente
- ✅ Todos los endpoints accesibles

---

## 📌 PRÓXIMAS INSTALACIONES

**Cuando instales UNS-ClaudeJP en otra PC:**

1. ✅ Clona el repositorio
2. ✅ Copia este archivo (CONFIG_FIXES_v6.0.0.md) a la nueva instalación
3. ✅ Verifica los 3 cambios principales:
   - redirect_slashes=True en main.py
   - @router.post("/login/") en auth.py
   - Admin password hash correcto en BD
4. ✅ Ejecuta los comandos de verificación
5. ✅ Listo - Sin errores

---

**Última actualización:** 2025-11-17 02:30 JST
**Status:** ✅ TODOS LOS PROBLEMAS SOLUCIONADOS
**Sistema:** Funcionando sin bugs conocidos
