# 🔧 OPERATIONAL RUNBOOK
## UNS-ClaudeJP 5.4.1 - Procedures de Operación

**Fecha:** 2025-11-12
**Versión:** 1.0 - Final
**Actualizado:** 2025-11-12

---

## 📋 Tabla de Contenidos

1. [Daily Operations](#daily-operations)
2. [Backup & Restore](#backup--restore)
3. [Troubleshooting](#troubleshooting)
4. [Performance Tuning](#performance-tuning)
5. [Security Procedures](#security-procedures)
6. [Disaster Recovery](#disaster-recovery)
7. [Escalation Procedures](#escalation-procedures)

---

## 🚀 Daily Operations

### START - Iniciar Servicios

**Windows (Recomendado):**
```bash
cd scripts
START.bat
```

**Línea de comandos directa:**
```bash
docker compose --profile dev up -d
```

**Verificar que todos estén running:**
```bash
docker compose ps
```

**Expected output:**
```
NAME                          STATUS
uns-claudejp-db               Up (healthy)
uns-claudejp-redis            Up (healthy)
uns-claudejp-backend          Up (healthy)
uns-claudejp-frontend         Up
uns-claudejp-adminer          Up
uns-claudejp-otel-collector   Up
uns-claudejp-prometheus       Up
uns-claudejp-tempo            Up
uns-claudejp-grafana          Up
```

**Acceso a URLs:**
- **Frontend:** http://localhost:3000
- **API Docs:** http://localhost:8000/api/docs
- **Database UI:** http://localhost:8080
- **Grafana:** http://localhost:3001 (admin/admin)
- **Prometheus:** http://localhost:9090

### STOP - Detener Servicios

**Windows:**
```bash
cd scripts
STOP.bat
```

**Línea de comandos:**
```bash
docker compose down
```

**Con limpieza de volúmenes (PELIGROSO - borra datos):**
```bash
docker compose down -v
```

### LOGS - Ver Registros

**Windows (Menú interactivo):**
```bash
cd scripts
LOGS.bat
```

**Línea de comandos:**
```bash
# Todo
docker compose logs -f

# Específico
docker compose logs -f backend
docker compose logs -f frontend
docker compose logs -f db

# Con límite
docker compose logs -f backend --tail 100
```

### RESTART - Reiniciar Servicios

```bash
# Reiniciar todo
docker compose restart

# Reiniciar específico
docker compose restart backend
docker compose restart frontend
docker compose restart db
```

---

## 💾 Backup & Restore

### Manual Database Backup

```bash
# Crear backup
docker exec uns-claudejp-db pg_dump -U uns_admin uns_claudejp > backup_$(date +%Y%m%d_%H%M%S).sql

# O en Windows (simplificado)
docker exec uns-claudejp-db pg_dump -U uns_admin uns_claudejp > backup.sql
```

**Ubicación recomendada:** `backend/backups/`

### Automated Backup Script

**Windows:**
```bash
cd scripts
BACKUP_DATOS.bat
```

**Características:**
- ✅ Crea timestamp automático
- ✅ Valida que el backup sea válido (>10KB)
- ✅ Almacena en `backend/backups/`
- ✅ Mantiene últimos 5 backups

### Restore Database

**Windows:**
```bash
cd scripts
RESTAURAR_DATOS.bat backup_20251112_120000.sql
```

**Línea de comandos:**
```bash
# Restaurar desde archivo
cat backup.sql | docker exec -i uns-claudejp-db psql -U uns_admin uns_claudejp
```

**Verificar restauración:**
```bash
docker exec uns-claudejp-db psql -U uns_admin -d uns_claudejp -c "SELECT COUNT(*) FROM candidates;"
```

### Backup Strategy

| Freuencia | Método | Retención |
|-----------|--------|-----------|
| **Diaria** | Automático en `backend/backups/` | 7 días |
| **Semanal** | Manual antes de cambios mayores | 30 días |
| **Mensual** | Backup comprimido a almacenamiento externo | 90 días |
| **Crítico** | Inmediatamente antes de REINSTALAR.bat | Indefinido |

---

## 🐛 Troubleshooting

### Frontend Blank Page

**Síntomas:**
- Página blanca en http://localhost:3000
- Sin contenido visible
- Console errors

**Solución Rápida:**
```bash
# 1. Ver logs
docker logs uns-claudejp-frontend --tail 50

# 2. Buscar "Ready in" o errores
# 3. Si compila correctamente:
docker compose restart frontend

# 4. Esperar 2-3 minutos (compilación Next.js)

# 5. Limpiar caché del navegador
# Ctrl+Shift+Delete → Clear all → Reload
```

**Si persiste:**
```bash
# Reconstruir imagen
docker compose build frontend
docker compose up -d frontend

# Esperar indicador "Ready in"
```

### Backend Won't Start

**Síntomas:**
- Error en logs del backend
- API no responde en http://localhost:8000

**Solución:**
```bash
# 1. Ver logs detallados
docker logs uns-claudejp-backend --tail 100

# 2. Común: Error de DATABASE_URL
type .env | findstr "DATABASE_URL"

# 3. Verificar DB está healthy
docker ps | findstr "uns-claudejp-db"
# Debe mostrar "healthy"

# 4. Si DB no está ready, esperar
docker logs uns-claudejp-db --tail 50

# 5. Reiniciar backend después que DB esté healthy
docker compose restart backend
```

### Database Connection Error

**Síntomas:**
- Backend logs: "connection refused"
- Adminer no conecta

**Solución:**
```bash
# 1. Verificar DB está running y healthy
docker ps | findstr "uns-claudejp-db"

# 2. Si no está healthy, ver logs
docker logs uns-claudejp-db --tail 100

# 3. Ejecutar health check manual
docker exec uns-claudejp-db pg_isready -U uns_admin -d uns_claudejp

# 4. Restart DB
docker compose restart db

# 5. Esperar ~60 segundos

# 6. Re-apply migrations
docker exec uns-claudejp-backend bash -c "cd /app && alembic upgrade head"
```

### Port Already in Use

**Síntomas:**
- Error: "Address already in use"
- No se puede iniciar servicios

**Windows:**
```bash
# Encontrar qué usa el puerto 3000
netstat -ano | findstr ":3000"
# Obtiene PID (ej: 5284)

# Matar proceso
taskkill /PID 5284 /F

# O liberar todos los puertos Docker
docker compose down
```

**Linux/macOS:**
```bash
# Encontrar proceso
lsof -i :3000

# Matar
kill -9 <PID>
```

### TypeScript Errors

**Síntomas:**
- Errores en `npm run type-check`
- Build falla

**Solución:**
```bash
# En frontend container
docker exec uns-claudejp-frontend npm run type-check

# Revisar errores específicos
# Generalmente son tipos mal importados

# Limpiar node_modules
docker exec uns-claudejp-frontend rm -rf node_modules/.vite
docker compose restart frontend
```

### CORS Errors

**Síntomas:**
- Console error: "Access to XMLHttpRequest has been blocked by CORS policy"

**Solución:**
```bash
# Verificar FRONTEND_URL en .env
type .env | findstr "FRONTEND_URL"
# Debe ser: http://localhost:3000

# Verificar backend tiene CORS configurado
type backend/app/main.py | findstr -A5 "add_middleware"

# Restart backend después de cambios
docker compose restart backend
```

---

## ⚙️ Performance Tuning

### Database Query Performance

```bash
# Ver queries lentas en logs
docker logs uns-claudejp-db --tail 200 | findstr "slow"

# Habilitar query logging (editorial en docker-compose.yml)
# postgres_parameters: {log_min_duration_statement: 1000}

# Analizar query
docker exec uns-claudejp-db psql -U uns_admin -d uns_claudejp
> EXPLAIN ANALYZE SELECT * FROM candidates WHERE status='ACTIVE';
```

### Memory Management

```bash
# Ver uso de memoria por servicio
docker stats

# Limitar memoria de servicio (editar docker-compose.yml)
services:
  backend:
    deploy:
      resources:
        limits:
          memory: 2G
        reservations:
          memory: 1G
```

### Redis Cache Optimization

```bash
# Ver tamaño del cache
docker exec uns-claudejp-redis redis-cli INFO memory

# Limpiar cache
docker exec uns-claudejp-redis redis-cli FLUSHDB

# Monitorear operaciones en tiempo real
docker exec uns-claudejp-redis redis-cli MONITOR
```

---

## 🔐 Security Procedures

### Change Admin Password

**Método 1: A través de UI (RECOMENDADO)**
```
1. Login a http://localhost:3000 con admin/admin123
2. Ir a Settings → Users → Cambiar contraseña
3. Ingresar nueva contraseña segura
4. Guardar
```

**Método 2: Script directo**
```bash
docker exec uns-claudejp-backend python -c "
from app.core.security import get_password_hash
from app.models.models import User
from app.core.database import SessionLocal

db = SessionLocal()
user = db.query(User).filter(User.username=='admin').first()
user.hashed_password = get_password_hash('NEW_PASSWORD_HERE')
db.commit()
print('✅ Password actualizado')
"
```

### Regenerate SECRET_KEY

```bash
# 1. Generar nueva clave
python -c "import secrets; print(secrets.token_urlsafe(64))"
# Output: nuevo_secret_key_aqui

# 2. Actualizar .env
# Editar: SECRET_KEY=nuevo_secret_key_aqui

# 3. Restart backend
docker compose restart backend

# 4. Usuarios necesitarán hacer login nuevamente (tokens inválidos)
```

### Audit Log Review

```bash
# Ver cambios de usuarios
docker exec uns-claudejp-db psql -U uns_admin -d uns_claudejp -c "
SELECT timestamp, user_id, action, entity_type
FROM audit_log
ORDER BY timestamp DESC
LIMIT 100;"
```

### Port Exposure Verification

```bash
# Verificar que 5432 (DB) NO está expuesto
netstat -ano | findstr "5432"
# Resultado esperado: VACIO (no está escuchando en 0.0.0.0)

# Verificar que 3000 y 8000 SÍ están escuchando
netstat -ano | findstr "3000\|8000"
# Resultado esperado: Muestra puertos escuchando en localhost
```

---

## 🆘 Disaster Recovery

### Complete System Rebuild

```bash
# 1. Hacer backup crítico
docker exec uns-claudejp-db pg_dump -U uns_admin uns_claudejp > backup_critical_$(date +%Y%m%d_%H%M%S).sql

# 2. Detener todo
cd scripts
STOP.bat

# 3. Limpiar datos (PELIGROSO)
docker compose down -v

# 4. Reiniciar sistema completo
cd scripts
START.bat

# 5. Esperar ~120 segundos (primera compilación)

# 6. Validar
cd scripts
TEST_INSTALLATION_FULL.bat
```

### Restore from Backup

```bash
# 1. Detener backend para desconectar conexiones
docker compose stop backend

# 2. Restaurar base de datos
cat backup_critical.sql | docker exec -i uns-claudejp-db psql -U uns_admin uns_claudejp

# 3. Reiniciar backend
docker compose up -d backend

# 4. Verificar
curl http://localhost:8000/api/health
```

### Container Logs Recovery

```bash
# Guardar logs antes de perderlos
docker logs uns-claudejp-backend > backend_logs_$(date +%Y%m%d_%H%M%S).txt
docker logs uns-claudejp-frontend > frontend_logs_$(date +%Y%m%d_%H%M%S).txt
docker logs uns-claudejp-db > db_logs_$(date +%Y%m%d_%H%M%S).txt

# En directorio: logs/
```

---

## 📞 Escalation Procedures

### Level 1: Self-Help (30 minutos)

1. **Revisar logs:** `docker compose logs -f [service]`
2. **Ejecutar health check:** `curl http://localhost:8000/api/health`
3. **Restart servicio:** `docker compose restart [service]`
4. **Revisar documentación:** TROUBLESHOOTING.md

**Si se resuelve → FIN**
**Si no se resuelve → Escalar a Level 2**

### Level 2: Automated Diagnostics (15 minutos)

```bash
# Ejecutar diagnóstico automático
cd scripts
DIAGNOSTICO_FUN.bat

# Revisar salida
# Buscar [FAIL] o [ERROR]

# Ejecutar validación de instalación
VALIDATE_QUICK_WINS.bat

# Ejecutar health check
HEALTH_CHECK_FUN.bat
```

**Si diagnóstico pasa → FIN**
**Si diagnóstico falla → Escalar a Level 3**

### Level 3: Advanced Troubleshooting (1 hora)

```bash
# 1. Crear log completo del sistema
docker compose logs > system_logs_$(date +%Y%m%d_%H%M%S).txt

# 2. Exportar configuración
docker compose config > docker_config.yml

# 3. Verificar resources
docker stats --no-stream > docker_stats.txt

# 4. Database diagnostics
docker exec uns-claudejp-db pg_dump -U uns_admin uns_claudejp > diagnostic_backup.sql

# 5. Recolectar en archivo ZIP
# Incluir: system_logs.txt, docker_config.yml, docker_stats.txt, diagnostic_backup.sql
```

**Enviar a:** soporte@empresa.com
**Asunto:** "UNS-ClaudeJP 5.4.1 - System Failure - Level 3 Escalation"

### Level 4: Critical System Failure (Disaster Recovery)

```bash
# 1. Shut down completamente
docker compose down

# 2. Restaurar backup más reciente
cat backend/backups/backup_20251112_120000.sql | docker exec -i uns-claudejp-db psql -U uns_admin uns_claudejp

# 3. Reconstruir imágenes
docker compose build

# 4. Iniciar sistema
docker compose --profile dev up -d

# 5. Monitorear
docker compose logs -f
```

**Si aún falla → Reconstruir desde REINSTALAR.bat**

---

## 📊 Monitoring & Alerting

### Prometheus Metrics

```bash
# Acceder a Prometheus
http://localhost:9090

# Queries útiles:
# Sistema corriendo:
up{job="backend"}

# Errores HTTP en backend:
rate(http_requests_total{status=~"5.."}[5m])

# Latencia de API:
histogram_quantile(0.95, rate(http_request_duration_seconds_bucket[5m]))
```

### Grafana Dashboards

```bash
# Acceder a Grafana
http://localhost:3001
# Login: admin / admin

# Dashboards pre-configurados:
# - UNS-ClaudeJP Overview
# - Backend Performance
# - Database Metrics
# - HTTP Requests
```

### Alert Thresholds (Recomendado)

| Métrica | Threshold | Acción |
|---------|-----------|--------|
| Backend CPU | >80% por 5 min | Investigar memory leak |
| Database Load | >80% queries concurrentes | Añadir índices o scale |
| Disk Free | <10% disponible | Limpiar backups antiguos |
| Error Rate | >1% de requests | Revisar logs |
| Response Time | >1000ms p95 | Optimizar queries |

---

## 📝 Checklists de Operación

### Daily Checklist

- [ ] Servicios all running: `docker compose ps`
- [ ] No errors en logs: `docker compose logs | grep ERROR`
- [ ] Backend responding: `curl http://localhost:8000/api/health`
- [ ] Frontend accessible: `curl http://localhost:3000`
- [ ] Database accessible: `docker exec uns-claudejp-db psql -U uns_admin -d uns_claudejp -c "SELECT 1"`

### Weekly Checklist

- [ ] Database backup creado
- [ ] Logs archivados
- [ ] Resource usage monitoreado
- [ ] Security audit review
- [ ] Disk space verificado

### Monthly Checklist

- [ ] Full system backup
- [ ] Performance analysis
- [ ] Security patch review
- [ ] Dependency updates checked
- [ ] DR test (restore from backup)

---

## 🎓 Reference

**Documentos Relacionados:**
- CHECKLIST_VALIDACION_INSTALACION.md - Validación inicial
- TROUBLESHOOTING.md - Guía de troubleshooting completa
- PLAN_ACCION_MAESTRO.md - Plan de implementación
- CLAUDE.md - Guía de desarrollo

**Contacto de Soporte:**
- Email: soporte@empresa.com
- Slack: #ups-claudejp-5.4.1
- Jira: UNS-CLAUDEJP-5.4.1

---

**Última actualización:** 2025-11-12
**Versión:** 1.0 - Final Production Ready ✅
