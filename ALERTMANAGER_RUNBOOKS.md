# 🚨 JPUNS Alertmanager Runbooks - Procedimientos de Respuesta

**Versión**: 1.0
**Fecha**: 2025-11-22
**Estado**: ✅ Guía de respuesta a alertas

---

## 📋 Índice de Runbooks

1. [Alertas de API](#api-alerts)
2. [Alertas de Base de Datos](#database-alerts)
3. [Alertas de Cache](#cache-alerts)
4. [Alertas de Sistema](#system-alerts)
5. [Alertas de Yukyu](#yukyu-alerts)

---

## 🔴 API Alerts {#api-alerts}

### Alert: Backend API No Disponible (CRÍTICO)

**Síntomas:**
- Alert "BackendAPIDown" activo en Alertmanager
- Grafana muestra 0 requests
- Usuarios reportan "Connection refused"

**Pasos de Respuesta:**

#### Paso 1: Verificar estatus (1 minuto)
```bash
# Verifica si el servicio está corriendo
curl -v http://localhost:8000/health

# Ver logs
docker logs jpuns-backend | tail -50

# Ver estado del contenedor
docker ps | grep jpuns-backend
```

**Si ves "Connection refused":**
→ Continúa con Paso 2

**Si ves respuesta 500:**
→ Continúa con Paso 3

#### Paso 2: Reiniciar servicio backend (2 minutos)
```bash
# Detén el servicio
docker-compose stop jpuns-backend

# Espera 5 segundos
sleep 5

# Inicia nuevamente
docker-compose up -d jpuns-backend

# Verifica que está healthy
sleep 10
curl http://localhost:8000/health
```

**Resultado esperado:**
```json
{"status": "healthy", "timestamp": "2025-11-22T..."}
```

#### Paso 3: Investigar logs de error (5 minutos)
```bash
# Ver últimos 100 líneas
docker logs jpuns-backend | tail -100

# Buscar errores específicos
docker logs jpuns-backend | grep -i "error\|exception\|fatal"

# Si es error de base de datos, continúa con Database Alerts
# Si es error de memoria, continúa con System Alerts
```

#### Paso 4: Rollback si es necesario (5 minutos)
```bash
# Si el problema es código nuevo, revierte al último commit bueno
git log --oneline -5
git checkout <previous-good-commit>

# Reconstruye la imagen
docker-compose build jpuns-backend

# Reinicia
docker-compose up -d jpuns-backend

# Verifica
curl http://localhost:8000/health
```

#### Paso 5: Escalar si persiste (notifica a lead)
```bash
# Información a compartir:
echo "=== INFORMACIÓN DE ESCALADA ==="
docker ps jpuns-backend
docker logs jpuns-backend --tail 50
curl -s http://localhost:8000/health | python -m json.tool
ps aux | grep -i backend
```

**Thresholds de Escalada:**
- Si no responde después de 2 reintentos → Escalar a Tech Lead
- Si hay error de base de datos → Verificar Database Alerts
- Si hay OOM (Out of Memory) → Verificar System Alerts

---

### Alert: Tasa de Error Alta (> 5%) - CRÍTICO

**Síntomas:**
- Alert "HighErrorRate" activada
- Grafana muestra pico en 5xx responses
- Algunos endpoints respondiendo con error

**Pasos de Respuesta:**

#### Paso 1: Identificar endpoints afectados (2 minutos)
```bash
# En Prometheus (http://localhost:9090):
# Ejecuta esta query:
topk(10, rate(http_requests_total{status=~"5.."}[5m]))
```

**Esto mostrará qué endpoints generan más errores**

#### Paso 2: Verificar logs para errores (3 minutos)
```bash
# Busca errores en logs
docker logs jpuns-backend --since 5m | grep -i "error\|exception" | head -20

# Si es error de database:
# → Ir a Database Alerts section

# Si es error de validación:
# → Revisar datos de entrada

# Si es timeout:
# → Continúa con Paso 3
```

#### Paso 3: Verificar salud de servicios dependientes (2 minutos)
```bash
# Verifica PostgreSQL
docker exec jpuns-postgres-monitoring pg_isready -U postgres

# Verifica Redis
redis-cli PING

# Verifica conectividad entre servicios
docker exec jpuns-backend curl -v http://jpuns-postgres-monitoring:5432
```

#### Paso 4: Analizar patrones de error (5 minutos)
```bash
# Busca patrón de error específico
docker logs jpuns-backend --since 10m | grep "ERROR" | cut -d' ' -f5-10 | sort | uniq -c | sort -rn

# Ejemplo salida:
#     15 JSONDecodeError: field validation error
#      8 ConnectionRefusedError: Redis not responding
#      3 OutOfMemoryError: heap space
```

#### Paso 5: Acciones correctivas específicas

**Si es error de validación:**
```bash
# Estos errores generalmente son por datos inválidos de cliente
# Revisar logs de error detallados
docker logs jpuns-backend -f

# Posible solución: Verificar schema de API
# Si es un cambio reciente, revertir
```

**Si es timeout:**
```bash
# Aumentar timeout temporalmente
# En docker-compose.yml, busca:
#   timeout: 10s
# Cambia a:
#   timeout: 30s

docker-compose down
docker-compose up -d

# Monitorea si se resuelve:
curl -s http://localhost:9090/api/v1/query?query=rate\(http_requests_total\{status~%225..%22\}\[5m\]\) | python -m json.tool
```

**Si es problema de base de datos:**
→ Ir a Database Alerts section

**Si es falta de recursos:**
→ Ir a System Alerts section

---

### Alert: Tiempo de Respuesta Lento (> 1s) - WARNING

**Síntomas:**
- Alert "SlowAPIResponse" activada
- Usuarios reportan que el dashboard carga lentamente
- P95 response time > 1 segundo

**Pasos de Respuesta:**

#### Paso 1: Verificar si es problema de cache (2 minutos)
```bash
# Ver hit rate de cache
redis-cli INFO stats | grep -E "hits|misses"

# Si hit rate es bajo, cache está fallando:
docker logs jpuns-redis-monitoring | tail -20
```

#### Paso 2: Identificar endpoint lento (3 minutos)
```bash
# En Prometheus, ejecuta:
topk(5, histogram_quantile(0.95, rate(http_request_duration_seconds_bucket[5m])))
```

**Esto mostrará los 5 endpoints más lentos**

#### Paso 3: Analizar query del endpoint lento (5 minutos)
```bash
# Ejemplo: /api/dashboard/yukyu-trends-monthly es lento

# Verifica si hay queries lentas en DB
docker exec jpuns-postgres-monitoring \
  psql -U postgres -d jpuns_production \
  -c "SELECT query, calls, mean_time FROM pg_stat_statements WHERE mean_time > 100 ORDER BY mean_time DESC LIMIT 5;"

# Si ves query lenta:
# → Ir a Database Alerts section
```

#### Paso 4: Acciones de optimización rápida

**Opción A: Borrar cache para recargar (1 minuto)**
```bash
# Borra cache de endpoint específico
redis-cli DEL "cache:yukyu:*"

# Verifica que se vuelve a popular
curl -s http://localhost:8000/api/dashboard/yukyu-trends-monthly \
  -H "Authorization: Bearer <token>" | python -m json.tool
```

**Opción B: Escalar recursos temporalmente (5 minutos)**
```bash
# En docker-compose.yml, aumenta recursos:
services:
  jpuns-backend:
    deploy:
      resources:
        limits:
          cpus: '2.0'      # Cambiar de 1.0 a 2.0
          memory: 1024M    # Cambiar de 512M a 1024M

docker-compose up -d jpuns-backend
```

**Opción C: Reducir timeout de request (2 minutos)**
```bash
# A veces requests lentas se pueden cancelar más rápido
# En endpoint, cambiar:
#   response_timeout = 10  # A
#   response_timeout = 5

# Esto devuelve error más rápido vs esperar
```

---

## 🗄️ Database Alerts {#database-alerts}

### Alert: Base de Datos No Disponible (CRÍTICO)

**Síntomas:**
- Alert "PostgreSQLDown" activada
- Todos los endpoints retornan error 500
- "Connection refused" en logs

**Pasos de Respuesta:**

#### Paso 1: Verificar conectividad (1 minuto)
```bash
# Test de conectividad
docker exec jpuns-postgres-monitoring pg_isready -U postgres

# Output esperado: "accepting connections"
# Si no: "rejecting connections"
```

#### Paso 2: Iniciar la base de datos (2 minutos)
```bash
# Verifica si el contenedor está corriendo
docker ps | grep postgres

# Si no está corriendo:
docker-compose up -d jpuns-postgres-monitoring

# Espera 10 segundos para iniciar
sleep 10

# Verifica nuevamente
docker exec jpuns-postgres-monitoring pg_isready -U postgres
```

#### Paso 3: Verificar logs de error (3 minutos)
```bash
# Ve logs
docker logs jpuns-postgres-monitoring | tail -50 | grep -i "error\|fatal"

# Errores comunes:
# "out of disk space" → Limpia datos viejos (ver System Alerts)
# "shared memory exhausted" → Reinicia servidor
# "connection limit reached" → Ver conexiones activas
```

#### Paso 4: Reiniciar base de datos (3 minutos)
```bash
# Pausa servicios que usan la DB
docker-compose stop jpuns-backend jpuns-frontend

# Reinicia la base de datos
docker-compose restart jpuns-postgres-monitoring

# Espera a que inicie
sleep 15

# Verifica
docker exec jpuns-postgres-monitoring pg_isready -U postgres

# Reinicia servicios
docker-compose up -d jpuns-backend jpuns-frontend
```

#### Paso 5: Verificar integridad de datos (5 minutos)
```bash
# Conexión directa
docker exec -it jpuns-postgres-monitoring psql -U postgres -d jpuns_production

# En psql:
SELECT version();  -- Verifica que está online
SELECT count(*) FROM information_schema.tables WHERE table_schema = 'public';  -- Verifica tablas

# Si alguna tabla está dañada:
REINDEX INDEX index_name;
```

---

### Alert: Conexiones DB Altas (> 80%) - WARNING

**Síntomas:**
- Alert "HighDatabaseConnections" activada
- Dashboard lento
- Nuevas conexiones se rechazan

**Pasos de Respuesta:**

#### Paso 1: Ver conexiones activas (1 minuto)
```bash
# En Prometheus:
pg_stat_activity_count

# O en psql:
docker exec jpuns-postgres-monitoring psql -U postgres -d jpuns_production -c \
  "SELECT count(*) as connection_count FROM pg_stat_activity;"
```

#### Paso 2: Identificar conexiones inactivas (2 minutos)
```bash
docker exec jpuns-postgres-monitoring psql -U postgres -d jpuns_production -c \
  "SELECT pid, usename, state, query, query_start FROM pg_stat_activity WHERE state = 'idle' ORDER BY query_start DESC LIMIT 10;"
```

#### Paso 3: Terminar conexiones inactivas (2 minutos)
```bash
# CUIDADO: Verifica que son realmente inactivas

docker exec jpuns-postgres-monitoring psql -U postgres -d jpuns_production -c \
  "SELECT pg_terminate_backend(pid) FROM pg_stat_activity WHERE state = 'idle' AND query_start < now() - interval '1 hour';"
```

#### Paso 4: Aumentar límite de conexiones (5 minutos)
```bash
# En docker-compose.yml:
jpuns-postgres-monitoring:
  environment:
    - POSTGRES_INIT_ARGS=-c max_connections=200  # Cambiar de 100 a 200

docker-compose down
docker-compose up -d jpuns-postgres-monitoring
```

---

### Alert: Queries Lentas (> 1s) - WARNING

**Síntomas:**
- Alert "SlowDatabaseQueries" activada
- Algunos endpoints lentos
- CPU de DB alta

**Pasos de Respuesta:**

#### Paso 1: Identificar queries lentas (2 minutos)
```bash
docker exec jpuns-postgres-monitoring psql -U postgres -d jpuns_production -c \
  "SELECT query, calls, mean_time, max_time FROM pg_stat_statements WHERE mean_time > 1000 ORDER BY mean_time DESC LIMIT 10;"
```

#### Paso 2: Analizar plan de ejecución (3 minutos)
```bash
# Para la query más lenta, obtén el plan:
docker exec jpuns-postgres-monitoring psql -U postgres -d jpuns_production -c \
  "EXPLAIN (ANALYZE, BUFFERS) SELECT ... FROM ..."
```

**Busca PROBLEMAS:**
- Sequential Scan (debe ser Index Scan)
- High buffer reads
- High execution time

#### Paso 3: Crear índice si es necesario (5 minutos)
```bash
# Ejemplo: Query hace sequential scan en tabla grande
# Solución: Crear índice

docker exec jpuns-postgres-monitoring psql -U postgres -d jpuns_production -c \
  "CREATE INDEX idx_table_column ON table_name(column_name);"

# Verifica que se creó
docker exec jpuns-postgres-monitoring psql -U postgres -d jpuns_production -c \
  "SELECT indexname FROM pg_indexes WHERE tablename = 'table_name';"
```

#### Paso 4: Resetear estadísticas (1 minuto)
```bash
# Después de cambios, resetea para poder ver mejora
docker exec jpuns-postgres-monitoring psql -U postgres -d jpuns_production -c \
  "SELECT pg_stat_statements_reset();"
```

---

## 💾 Cache Alerts {#cache-alerts}

### Alert: Redis No Disponible (CRÍTICO)

**Síntomas:**
- Alert "RedisDown" activada
- Todos los requests van sin cache (lentos)
- "Connection refused" para cache

**Pasos de Respuesta:**

#### Paso 1: Verificar conectividad (1 minuto)
```bash
redis-cli PING

# Resultado esperado: "PONG"
# Si no: error de conexión
```

#### Paso 2: Iniciar Redis (2 minutos)
```bash
# Verifica si está corriendo
docker ps | grep redis

# Si no:
docker-compose up -d jpuns-redis-monitoring

# Espera 5 segundos
sleep 5

# Verifica
redis-cli PING
```

#### Paso 3: Limpiar datos corruptos (3 minutos)
```bash
# Si PING falla pero contenedor está corriendo:

# Conecta a Redis
redis-cli

# Verifica integridad
INFO server

# Si hay problemas, limpia cache:
FLUSHALL  # Borra TODO el cache (solo si está OK)

# Exit
exit
```

#### Paso 4: Reiniciar si persiste (2 minutos)
```bash
docker-compose restart jpuns-redis-monitoring
sleep 5
redis-cli PING
```

---

### Alert: Hit Rate de Cache Bajo (< 30%) - WARNING

**Síntomas:**
- Alert "LowCacheHitRate" activada
- APIs lentas aunque funciona
- Muchas requests a database

**Pasos de Respuesta:**

#### Paso 1: Ver estadísticas de cache (1 minuto)
```bash
redis-cli INFO stats

# Busca:
# - hits: Número de cache hits
# - misses: Número de cache misses
# - hit_rate: hits / (hits + misses)
```

#### Paso 2: Analizar patrones de acceso (3 minutos)
```bash
# Ver keys más accedidas
redis-cli --scan | head -20

# Ver tamaño de cache
redis-cli INFO memory | grep used_memory_human

# Ejemplo:
# If used_memory < 10MB y hit_rate bajo → cache vacío
# If used_memory > 500MB y hit_rate bajo → cache inefectivo
```

#### Paso 3: Calentar cache si está vacío (2 minutos)
```bash
# Opción A: Llamar endpoint principal para popular cache
curl -s http://localhost:8000/api/dashboard/yukyu-trends-monthly \
  -H "Authorization: Bearer <token>" > /dev/null

# Opción B: Scripts de pre-warming
python backend/scripts/warm_cache.py
```

#### Paso 4: Aumentar TTL de cache si expira muy rápido (3 minutos)
```bash
# En backend code, busca:
#   cache_ttl = 3600  # 1 hora
# Cambia a:
#   cache_ttl = 7200  # 2 horas

# Reconstruye:
docker-compose build jpuns-backend
docker-compose up -d jpuns-backend

# Verifica hit rate después de 5 minutos
redis-cli INFO stats | grep hits
```

---

## 🖥️ System Alerts {#system-alerts}

### Alert: CPU Muy Alta (> 95%) - CRÍTICO

**Síntomas:**
- Alert "CriticalCPUUsage" activada
- Sistema responde lentamente
- Múltiples servicios lentos

**Pasos de Respuesta:**

#### Paso 1: Identificar qué proceso usa CPU (2 minutos)
```bash
# Ver top en tiempo real
top -bn1 | head -20

# O ver por contenedor
docker stats --no-stream

# Busca el que usa > 95%
```

#### Paso 2: Si es backend
```bash
# Logs para ver qué está procesando
docker logs jpuns-backend -f

# Si ves loop infinito o proceso loco:
docker-compose restart jpuns-backend

# Monitorea
docker stats jpuns-backend
```

#### Paso 3: Si es database
```bash
# Ver query que usa CPU
docker exec jpuns-postgres-monitoring psql -U postgres -d jpuns_production -c \
  "SELECT pid, query, query_start FROM pg_stat_activity ORDER BY query_start DESC LIMIT 5;"

# Termina query problemática si es necesario:
docker exec jpuns-postgres-monitoring psql -U postgres -d jpuns_production -c \
  "SELECT pg_terminate_backend(pid) FROM pg_stat_activity WHERE pid = <PID>;"
```

#### Paso 4: Escalar recursos (5 minutos)
```bash
# En docker-compose.yml:
jpuns-backend:
  deploy:
    resources:
      limits:
        cpus: '2.0'  # Aumenta de 1.0 a 2.0

docker-compose up -d jpuns-backend
```

---

### Alert: Memoria Muy Alta (> 95%) - CRÍTICO

**Síntomas:**
- Alert "CriticalMemoryUsage" activada
- Sistema empieza a usar swap
- Aplicaciones mueren por OOM

**Pasos de Respuesta:**

#### Paso 1: Identificar qué usa memoria (2 minutos)
```bash
docker stats --no-stream

# Busca contenedor con > 95% memory
```

#### Paso 2: Analizar memory leak (3 minutos)
```bash
# Si backend:
docker stats jpuns-backend --no-stream

# Monitorea por 5 minutos:
for i in {1..5}; do docker stats jpuns-backend --no-stream; sleep 60; done

# Si memoria crece constantemente → memory leak
# Si memoria estable → normal high usage
```

#### Paso 3: Liberar memoria temporalmente (2 minutos)
```bash
# Opción A: Limpiar cache
redis-cli FLUSHALL

# Opción B: Reiniciar servicio
docker-compose restart jpuns-backend

# Ver cambio:
docker stats jpuns-backend --no-stream
```

#### Paso 4: Escalar o investigar (5 minutos)
```bash
# Si es memory leak, investigar código
git log --oneline -10
git diff HEAD~1

# Si es volumen de datos normal:
# Aumentar memoria en docker-compose.yml:
jpuns-backend:
  deploy:
    resources:
      limits:
        memory: 1024M  # Cambiar de 512M a 1024M
```

---

### Alert: Disco Bajo (< 15% libre) - WARNING

**Síntomas:**
- Alert "LowDiskSpace" activada
- Base de datos podría dejar de escribir
- Logs se detienen

**Pasos de Respuesta:**

#### Paso 1: Ver uso de disco (1 minuto)
```bash
df -h

# Busca particiones con < 15% disponible
```

#### Paso 2: Identificar qué ocupa espacio (2 minutos)
```bash
# Ver carpetas grandes
du -sh /* | sort -rh | head -10

# En específico, logs:
du -sh /var/lib/docker/volumes

# Base de datos:
docker exec jpuns-postgres-monitoring \
  du -sh /var/lib/postgresql/data
```

#### Paso 3: Limpiar datos viejos (5 minutos)
```bash
# Opción A: Limpiar logs viejos
docker logs jpuns-backend > /dev/null  # Trunca logs

# Opción B: Reducir retención de Prometheus
# En docker-compose.yml, edita Prometheus:
#   - '--storage.tsdb.retention.time=7d'  # Cambiar de 30d

docker-compose up -d jpuns-prometheus

# Opción C: Limpiar base de datos
docker exec jpuns-postgres-monitoring psql -U postgres -d jpuns_production -c \
  "DELETE FROM logs WHERE created_at < now() - interval '7 days';"
```

#### Paso 4: Monitorear liberación (2 minutos)
```bash
watch df -h

# Espera a que Prometheus compacte (puede tomar 5-10 min)
```

---

## 📊 Yukyu Alerts {#yukyu-alerts}

### Alert: Endpoint Yukyu No Responde - CRÍTICO

**Síntomas:**
- Alert "YukyuEndpointDown" activada
- Dashboard no carga datos de Yukyu
- "/api/dashboard/yukyu-*" retorna error

**Pasos de Respuesta:**

#### Paso 1: Verificar endpoint directamente (1 minuto)
```bash
# Test endpoint
curl -v http://localhost:8000/api/dashboard/yukyu-trends-monthly \
  -H "Authorization: Bearer <token>"

# Si 503: Backend no disponible → Ver API Alerts
# Si 401: Token inválido → Genera nuevo token
# Si 404: Endpoint no existe → Verificar endpoint name
# Si 500: Error de lógica → Ver logs
```

#### Paso 2: Verificar datos en database (2 minutos)
```bash
# Conecta a DB
docker exec -it jpuns-postgres-monitoring psql -U postgres -d jpuns_production

# Verifica tabla de yukyu
SELECT count(*) FROM yukyu_requests;
SELECT count(*) FROM yukyu_approvals;

# Si count = 0, hay problema de datos
```

#### Paso 3: Limpiar cache de Yukyu (1 minuto)
```bash
# Borra cache del endpoint específico
redis-cli DEL "cache:yukyu:trends:*"
redis-cli DEL "cache:yukyu:compliance:*"

# Llamar endpoint nuevamente
curl http://localhost:8000/api/dashboard/yukyu-trends-monthly \
  -H "Authorization: Bearer <token>"
```

#### Paso 4: Verificar permisos (2 minutos)
```bash
# Si 403 Forbidden, verifica rol del usuario
docker exec jpuns-postgres-monitoring psql -U postgres -d jpuns_production -c \
  "SELECT role FROM users WHERE user_id = '<user-id>';"

# Debe ser 'KEITOSAN' o 'KANRININSHA'
```

---

### Alert: Tiempo de Respuesta de Yukyu Lento - WARNING

**Síntomas:**
- Alert "SlowYukyuResponse" activada
- Dashboard tarda en cargar
- P95 > 1000ms

**Pasos de Respuesta:**

#### Paso 1: Ver tiempo en Prometheus (2 minutos)
```promql
# Query en Prometheus:
histogram_quantile(0.95, rate(http_request_duration_seconds_bucket{path="/api/dashboard/yukyu-trends-monthly"}[5m]))
```

#### Paso 2: Verificar cache hit (2 minutos)
```bash
redis-cli INFO stats

# Si hits bajo → cache miss
# Solución: Calentar cache
curl http://localhost:8000/api/dashboard/yukyu-trends-monthly

# Llamar nuevamente, debe ser más rápido
```

#### Paso 3: Analizar query de fiscal year (3 minutos)
```bash
# El endpoint calcula fiscal year, que puede ser lento
# Verifica tiempo de query:

docker exec jpuns-postgres-monitoring psql -U postgres -d jpuns_production -c \
  "EXPLAIN ANALYZE SELECT * FROM yukyu_requests WHERE fiscal_year = 2024;"

# Si es lento, crear índice:
docker exec jpuns-postgres-monitoring psql -U postgres -d jpuns_production -c \
  "CREATE INDEX idx_yukyu_fiscal_year ON yukyu_requests(fiscal_year);"
```

---

## 📞 Escalada de Alertas

### Escalation Policy

```
⏱️ 5 min: Alert dispara, equipo notificado vía Slack
⏱️ 10 min: Si no hay respuesta, mensaje a on-call engineer
⏱️ 15 min: Si no hay respuesta, llamada al Tech Lead
⏱️ 20 min: Máxima prioridad, todos notificados
```

### Cómo Escalar

```bash
# 1. En Slack, agrega el thread
# 2. Menciona @on-call
# 3. Proporciona:
#    - Alert name
#    - Current value
#    - Pasos ya realizados
#    - Logs relevantes

# Ejemplo:
# @on-call: HighErrorRate alerta
# Current: 8.5% (threshold 5%)
# Pasos realizados: Reiniciado backend, verified DB connectivity
# Logs: /tmp/escalation-logs.txt
```

---

## ✅ Checklist de Post-Resolución

- [ ] Alert resuelto y Prometheus muestra OK
- [ ] Servicios respondiendo correctamente
- [ ] Logs limpios (sin errores nuevos)
- [ ] Documentar root cause en Slack
- [ ] Crear ticket para prevenir repetición si es necesario
- [ ] Actualizar runbook si el procedimiento cambió

---

**Documento Version**: 1.0
**Última Actualización**: 2025-11-22
**Estado**: ✅ RUNBOOKS COMPLETOS Y LISTOS
