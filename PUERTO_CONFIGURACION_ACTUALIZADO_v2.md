# PUERTO CONFIGURACION ACTUALIZADO v2 - COMPLETADO

**Fecha**: 2025-11-23  
**Razón**: Conflicto con otra aplicación usando puerto 3100  
**Estado**: ✅ COMPLETADO EXITOSAMENTE

---

## 📊 RESUMEN DE CAMBIOS

### Puertos Actualizados

| Servicio | Puerto Anterior | Puerto Nuevo | Estado |
|----------|----------------|--------------|--------|
| Frontend | 3100 | **3200** | ✅ |
| Backend API | 8100 | **8200** | ✅ |
| PostgreSQL | 5532 | **5632** | ✅ |
| Redis | 6479 | **6579** | ✅ |
| Adminer | 8180 | **8280** | ✅ |
| Prometheus | 9190 | **9290** | ✅ |
| Grafana | 3101 | **3201** | ✅ |
| OTEL gRPC | 4417 | **4517** | ✅ |
| OTEL HTTP | 4418 | **4518** | ✅ |
| Tempo | 3300 | **3400** | ✅ |

---

## 📝 ARCHIVOS MODIFICADOS

### ✅ Configuración Principal
1. **docker-compose.yml** - Todos los puertos actualizados
2. **.env.example** (raíz) - Variables de entorno actualizadas
3. **backend/.env.example** - Configuración backend actualizada

### ✅ Configuración Frontend
4. **frontend/next.config.ts** - URLs y CSP actualizados

### ✅ Configuración Nginx
5. **docker/conf.d/default.conf** - CORS origins actualizados

### ✅ Documentación
6. **README.md** - Todas las URLs actualizadas
7. **PORT_CONFIGURATION_6.5.0.md** - Guía de puertos actualizada
8. **PORT_MIGRATION_COMPLETE_v2.md** - Guía de migración creada

---

## 🚀 PRÓXIMOS PASOS PARA EL USUARIO

### 1. Actualizar archivo .env local

```bash
# Copiar el nuevo ejemplo
cp .env.example .env

# Editar y configurar tus contraseñas
notepad .env
```

**Variables críticas a actualizar:**
```env
FRONTEND_URL=http://localhost:3200
BACKEND_CORS_ORIGINS=http://localhost:3200,http://127.0.0.1:3200
DATABASE_URL=postgresql://uns_admin:TU_PASSWORD@localhost:5632/uns_claudejp
OTEL_EXPORTER_OTLP_ENDPOINT=http://localhost:4517
NEXT_PUBLIC_OTEL_EXPORTER_URL=http://localhost:4518/v1/traces
NEXT_PUBLIC_GRAFANA_URL=http://localhost:3201
```

### 2. Actualizar backend/.env

```bash
cd backend
cp .env.example .env
notepad .env
```

### 3. Reiniciar servicios

```bash
# Detener servicios existentes
docker-compose down

# Reconstruir y arrancar con nuevos puertos
docker-compose up -d --build

# Verificar estado
docker-compose ps
```

### 4. Verificar acceso

Después de reiniciar, verifica que todos los servicios estén accesibles:

```bash
# Frontend
curl http://localhost:3200

# Backend API
curl http://localhost:8200/api/health

# API Docs
start http://localhost:8200/docs

# Adminer
start http://localhost:8280

# Grafana
start http://localhost:3201
```

---

## 🔍 VERIFICACIÓN DE NO CONFLICTOS

### Verificar que los puertos nuevos están libres:

```bash
# Windows
netstat -ano | findstr "3200 8200 5632 6579 8280 9290 3201 4517 4518 3400"

# Si algún puerto está en uso, aparecerá en la lista
# Los puertos nuevos NO deben aparecer antes de arrancar Docker
```

### Verificar que la otra aplicación no está en conflicto:

```bash
# Verificar que puerto 3100 está ocupado por otra app (como debe ser)
netstat -ano | findstr "3100"

# Debería mostrar la otra aplicación usando 3100
```

---

## 📋 CHECKLIST DE MIGRACIÓN

- [x] docker-compose.yml actualizado con nuevos puertos
- [x] .env.example (raíz) actualizado
- [x] backend/.env.example actualizado
- [x] frontend/next.config.ts actualizado
- [x] docker/conf.d/default.conf actualizado (CORS)
- [x] README.md actualizado con nuevas URLs
- [x] PORT_CONFIGURATION_6.5.0.md actualizado
- [x] Documentación de migración creada
- [ ] **USUARIO:** Actualizar .env local
- [ ] **USUARIO:** Actualizar backend/.env local
- [ ] **USUARIO:** Reiniciar servicios Docker
- [ ] **USUARIO:** Verificar acceso a todas las URLs
- [ ] **USUARIO:** Actualizar marcadores del navegador
- [ ] **USUARIO:** Actualizar herramientas de DB (DBeaver, etc.)

---

## 🎯 URLs DE ACCESO ACTUALIZADAS

### Desarrollo Local

| Servicio | URL Nueva | Descripción |
|----------|-----------|-------------|
| **Frontend** | http://localhost:3200 | Aplicación Next.js |
| **Backend API** | http://localhost:8200/api | API REST |
| **API Docs** | http://localhost:8200/docs | Swagger UI |
| **ReDoc** | http://localhost:8200/redoc | Documentación alternativa |
| **Health Check** | http://localhost:8200/api/health | Estado del backend |
| **Adminer** | http://localhost:8280 | Gestión PostgreSQL |
| **Grafana** | http://localhost:3201 | Dashboards |
| **Prometheus** | http://localhost:9290 | Métricas |

### Conexiones de Base de Datos

**PostgreSQL:**
```
Host: localhost
Port: 5632
Database: uns_claudejp
User: uns_admin
Password: [tu contraseña de .env]
```

**Redis:**
```bash
redis-cli -h localhost -p 6579 -a [tu contraseña de .env]
```

---

## ⚠️ CAMBIOS CRÍTICOS

### Para Desarrolladores

**Actualizar scripts locales** que usen URLs antiguas:

**ANTES (❌ Ya no funciona):**
```javascript
const API_URL = 'http://localhost:8100/api';
const FRONTEND_URL = 'http://localhost:3100';
```

**AHORA (✅ Nuevo):**
```javascript
const API_URL = 'http://localhost:8200/api';
const FRONTEND_URL = 'http://localhost:3200';
```

### Para Herramientas de DB

**Actualizar conexiones en:**
- DBeaver
- pgAdmin
- TablePlus
- DataGrip
- VS Code PostgreSQL extensions

**String de conexión ANTIGUA:**
```
postgresql://uns_admin:password@localhost:5532/uns_claudejp
```

**String de conexión NUEVA:**
```
postgresql://uns_admin:password@localhost:5632/uns_claudejp
```

---

## 🛠️ SOLUCIÓN DE PROBLEMAS

### Error: "Port already in use"

Si al iniciar Docker ves errores de puerto en uso:

```bash
# Verificar qué está usando el puerto
netstat -ano | findstr "3200"

# Si es otra aplicación, detenerla o cambiar el puerto nuevamente
```

### Error: "Cannot connect to database"

Verifica que usas el puerto correcto:

```bash
# Debe ser 5632, NO 5532
psql -h localhost -p 5632 -U uns_admin -d uns_claudejp
```

### Frontend no carga

1. Verifica que el puerto sea 3200:
```bash
curl http://localhost:3200
```

2. Limpia caché del navegador

3. Verifica logs:
```bash
docker-compose logs frontend
```

---

## 📞 SOPORTE

Si encuentras problemas:

1. Revisa logs de Docker: `docker-compose logs -f`
2. Verifica que .env esté actualizado
3. Reinicia Docker Desktop
4. Limpia caché del navegador
5. Verifica que NO haya otros servicios usando los puertos nuevos

---

## ✅ VERIFICACIÓN FINAL

Ejecuta estos comandos para verificar que todo funciona:

```bash
# 1. Verificar que los servicios están corriendo
docker-compose ps

# 2. Verificar backend health
curl http://localhost:8200/api/health

# 3. Verificar frontend
curl http://localhost:3200

# 4. Verificar base de datos
docker-compose exec db pg_isready -U uns_admin

# 5. Verificar Redis
docker-compose exec redis redis-cli -a YOUR_PASSWORD ping
```

**Respuestas esperadas:**
- Backend health: `{"status":"ok",...}`
- Frontend: HTML de Next.js
- PostgreSQL: `accepting connections`
- Redis: `PONG`

---

**🎉 MIGRACIÓN COMPLETADA EXITOSAMENTE**

Todos los archivos de configuración han sido actualizados al nuevo rango de puertos (3200+/8200+).

**ACCIÓN SIGUIENTE**: Actualiza tus archivos .env locales y reinicia los servicios.

---

**Notas de Migración:**
- Migración v1: 3000/8000 → 3100/8100 (Fecha anterior)
- Migración v2: 3100/8100 → 3200/8200 (2025-11-23) ← **ACTUAL**

