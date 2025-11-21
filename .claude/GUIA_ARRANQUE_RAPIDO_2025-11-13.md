# 🚀 GUÍA DE ARRANQUE RÁPIDO - Sistema UNS-ClaudeJP 5.4.1

## ✅ CORRECCIONES APLICADAS (2025-11-13)

### Problemas Resueltos:

1. ✅ **Error crítico de importación en `main.py`**
   - Eliminado import del módulo `apartments` que no existía
   - Eliminado registro duplicado de `database.router`
   - Backend ahora puede iniciar sin errores

2. ✅ **Actualizado `backend/app/api/__init__.py`**
   - Ahora incluye los 24 routers completos
   - Documentación actualizada a versión 5.4.1

---

## 🎯 INSTRUCCIONES DE INICIO

### Paso 1: Verificar que Docker Desktop está corriendo

```bash
# Windows: Abrir Docker Desktop desde el menú inicio
# Debe mostrar "Docker Desktop is running"
```

### Paso 2: Iniciar el sistema

```bash
# Opción A: Usando los scripts de Windows
cd scripts
START.bat

# Opción B: Usando Docker Compose directamente
docker compose --profile dev up -d
```

### Paso 3: Esperar a que todos los servicios estén healthy

```bash
# Ver el progreso de inicio
docker compose logs -f

# O ver solo el backend
docker compose logs backend -f

# Cuando veas esto, el backend está listo:
# "Application startup complete"
# "Uvicorn running on http://0.0.0.0:8000"
```

**⏱️ Tiempo estimado de inicio:**
- Base de datos: 30-60 segundos
- Backend: 60-90 segundos
- Frontend: 90-120 segundos
- **Total: 3-5 minutos** hasta que todo esté accesible

### Paso 4: Verificar que todo funciona

```bash
# Verificar servicios
docker compose ps

# Deberías ver todos con status "healthy" o "running"
```

**URLs a probar:**

1. **Frontend:** http://localhost:3000
   - Login: `admin` / `admin123`

2. **Backend API Docs:** http://localhost:8000/api/docs
   - Debería mostrar Swagger UI con 24 grupos de endpoints

3. **Backend Health:** http://localhost:8000/api/health
   - Debería retornar `{"status": "healthy"}`

4. **Adminer (DB UI):** http://localhost:8080
   - Server: `db`
   - Username: `uns_admin`
   - Password: (el de tu .env, default: `postgres`)
   - Database: `uns_claudejp`

5. **Grafana (Observability):** http://localhost:3001
   - Login: `admin` / `admin` (configurable en .env)

---

## 🔍 VERIFICACIÓN DE FUNCIONALIDADES

### 1. Apartments V2 (Sistema de Apartamentos)

**Frontend:**
- http://localhost:3000/apartments
- Debe mostrar lista de apartamentos
- Puedes crear, editar, asignar empleados
- Ver reportes de ocupación

**API Endpoints:**
- http://localhost:8000/api/docs#/Apartments%20V2
- 19 endpoints disponibles:
  - GET/POST/PUT/DELETE apartamentos
  - Assignments (asignaciones)
  - Calculations (cálculos de renta)
  - Reports (reportes)
  - Deductions (deducciones)

### 2. Yukyu Management (Gestión de Vacaciones)

**Frontend:**
- http://localhost:3000/admin/yukyu-management - Panel de administración
- http://localhost:3000/yukyu-requests - Solicitudes
- http://localhost:3000/yukyu-history - Historial LIFO
- http://localhost:3000/yukyu-reports - Reportes

**API Endpoints:**
- http://localhost:8000/api/docs#/Yukyu%20(有給休暇%20-%20Paid%20Vacation)
- 15+ endpoints:
  - Balances calculation
  - Request creation/approval
  - LIFO usage tracking
  - Expiration management

### 3. Admin Control Panel

**Frontend:**
- http://localhost:3000/admin/control-panel
- Panel avanzado de 1,514 líneas
- RBAC completo con 9 roles
- Audit logs
- Bulk actions
- Statistics

**API Endpoints:**
- http://localhost:8000/api/docs#/Role%20Permissions
- http://localhost:8000/api/docs#/Admin%20Panel

### 4. Candidates & Employees

**Frontend:**
- http://localhost:3000/candidates - Gestión de candidatos
- http://localhost:3000/employees - Gestión de empleados

**Features:**
- OCR de 履歴書 (rirekisho)
- Face detection con MediaPipe
- CRUD completo
- Excel import/export

---

## 🐛 TROUBLESHOOTING

### Backend no inicia

```bash
# Ver logs detallados
docker compose logs backend --tail=100

# Errores comunes:
# 1. "ModuleNotFoundError" → Rebuilding container
docker compose build backend --no-cache
docker compose up -d backend

# 2. "Database connection failed" → Verificar DB
docker compose ps db
docker compose logs db --tail=50
```

### Frontend muestra página en blanco

```bash
# Ver logs
docker compose logs frontend --tail=100

# Solución:
# 1. Esperar 2-3 minutos (compilación inicial es lenta)
# 2. Forzar rebuild si persiste
docker compose build frontend --no-cache
docker compose up -d frontend
```

### Puertos ocupados

```bash
# Windows: Liberar puerto 3000
netstat -ano | findstr :3000
taskkill /PID <numero_pid> /F

# Liberar puerto 8000
netstat -ano | findstr :8000
taskkill /PID <numero_pid> /F
```

### Error "Cannot connect to Docker daemon"

```bash
# Solución: Reiniciar Docker Desktop
# 1. Cerrar Docker Desktop
# 2. Abrir como Administrador
# 3. Esperar que diga "Docker Desktop is running"
# 4. Reintentar START.bat
```

---

## 📊 CHECKLIST POST-INICIO

Marca cuando verifiques cada item:

**Servicios Docker:**
- [ ] `docker compose ps` muestra 6+ servicios running
- [ ] Backend status = "healthy"
- [ ] Frontend status = "healthy"
- [ ] Database status = "healthy"

**URLs Funcionando:**
- [ ] http://localhost:3000 carga el frontend
- [ ] http://localhost:8000/api/docs muestra Swagger
- [ ] http://localhost:8000/api/health retorna status:healthy
- [ ] http://localhost:8080 muestra Adminer

**Login & Navegación:**
- [ ] Login con admin/admin123 funciona
- [ ] Dashboard principal carga sin errores
- [ ] Menú lateral muestra todos los módulos

**Módulos Principales:**
- [ ] /apartments - Lista de apartamentos carga
- [ ] /admin/yukyu-management - Panel yukyu carga
- [ ] /admin/control-panel - Control panel carga
- [ ] /candidates - Lista de candidatos carga
- [ ] /employees - Lista de empleados carga

**API Backend:**
- [ ] Swagger muestra 24 grupos de endpoints
- [ ] /api/apartments-v2/apartments retorna 200
- [ ] /api/yukyu/balances retorna 200 o 404 (normal si no hay datos)
- [ ] /api/dashboard/stats retorna 200

---

## 🔄 REINICIOS Y MANTENIMIENTO

### Reinicio Rápido (si algo falla)

```bash
# Opción A: Scripts
cd scripts
STOP.bat
START.bat

# Opción B: Docker Compose
docker compose down
docker compose --profile dev up -d
```

### Reinicio Completo (limpieza total)

```bash
# ⚠️ CUIDADO: Esto borra todos los datos
cd scripts
REINSTALAR.bat

# O manualmente:
docker compose down -v  # -v = elimina volúmenes
docker compose --profile dev up -d
```

### Ver Logs en Tiempo Real

```bash
# Todos los servicios
cd scripts
LOGS.bat

# O específico:
docker compose logs -f backend
docker compose logs -f frontend
docker compose logs -f db
```

### Backup de Base de Datos

```bash
# Automático:
cd scripts
BACKUP_DATOS.bat

# Manual:
docker exec uns-claudejp-db pg_dump -U uns_admin uns_claudejp > backup_$(date +%Y%m%d).sql
```

---

## 📈 MONITOREO Y OBSERVABILIDAD

### Grafana Dashboards

URL: http://localhost:3001

**Dashboards disponibles:**
1. **Backend Performance**
   - Request rate
   - Response times
   - Error rates
   - Database queries

2. **Distributed Tracing**
   - Request flow visualization
   - Latency analysis
   - Error tracking

### Prometheus Metrics

URL: http://localhost:9090

**Métricas clave:**
```
http_requests_total
http_request_duration_seconds
database_query_duration_seconds
cache_hit_rate
```

---

## 🎓 PRÓXIMOS PASOS

Una vez que todo esté funcionando:

1. **Configurar OCR (opcional):**
   - Agregar API keys en `.env`:
     - `AZURE_COMPUTER_VISION_ENDPOINT`
     - `AZURE_COMPUTER_VISION_KEY`
     - `GEMINI_API_KEY`

2. **Configurar notificaciones (opcional):**
   - Email SMTP en `.env`
   - LINE Channel Access Token

3. **Importar datos iniciales:**
   ```bash
   # Desde Excel
   docker exec -it uns-claudejp-backend python scripts/import_data.py

   # O desde Adminer (http://localhost:8080)
   # SQL > Import
   ```

4. **Crear usuarios adicionales:**
   - Login como admin
   - Admin → Control Panel → Users

5. **Personalizar temas:**
   - http://localhost:3000/themes
   - http://localhost:3000/themes/customizer

---

## 📞 SOPORTE

**Si algo no funciona:**

1. **Revisa el diagnóstico completo:**
   ```
   .claude/DIAGNOSTICO_COMPLETO_2025-11-13.md
   ```

2. **Verifica logs:**
   ```bash
   cd scripts
   DIAGNOSTICO_FUN.bat
   ```

3. **Health check:**
   ```bash
   cd scripts
   HEALTH_CHECK_FUN.bat
   ```

**Archivos de log:**
- Backend: `logs/uns-claudejp.log`
- Docker logs: `docker compose logs [servicio]`

---

## ✅ SISTEMA LISTO

Si todos los checks pasan, tu sistema está **100% operativo** con:

- ✅ 75 páginas frontend funcionales
- ✅ 24 APIs backend operativas
- ✅ Apartments V2 completo
- ✅ Yukyu management completo
- ✅ Admin control panel avanzado
- ✅ OCR híbrido (Azure + EasyOCR + Gemini + Tesseract)
- ✅ Observability stack (Grafana + Prometheus + Tempo)
- ✅ Automated backups

**¡Todo funcionando! 🎉**
