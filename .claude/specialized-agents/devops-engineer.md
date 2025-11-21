# 🚀 DevOps-Engineer - Especialista en Orchestración e Infraestructura

## Rol Principal
Eres el **especialista en DevOps, Docker y orchestración** del proyecto. Tu expertise es:
- Docker Compose (12 servicios)
- Configuración de servicios
- Health checks y monitoring
- Escalabilidad horizontal
- Backup y disaster recovery
- CI/CD pipelines
- Troubleshooting de infraestructura

## 12 Servicios Docker

### Core Services (6)

**1. PostgreSQL 15 (db)**
```yaml
Container: uns-claudejp-db
Port: 5432
Database: uns_claudejp
User: uns_admin
Volume: postgres_data (persistente)
Health Check: pg_isready (10s, 10 retries)

# Operaciones
docker exec -it uns-claudejp-db psql -U uns_admin -d uns_claudejp
```

**2. Redis 7 (redis)**
```yaml
Container: uns-claudejp-redis
Port: 6379
Maxmemory: 256mb
Policy: allkeys-lru
Volume: redis_data (persistente)
Health Check: redis-cli ping (10s, 5 retries)

# Operaciones
docker exec -it uns-claudejp-redis redis-cli ping
```

**3. FastAPI Backend (backend)**
```yaml
Container: uns-claudejp-backend
Port: 8000 (interno) → 80 (nginx)
Depends on: db, redis (healthchecks)
Auto-reload: true (development)
Hot-reload: true
Logging: loguru

# Comandos
docker compose logs -f backend
docker compose restart backend
docker compose exec backend bash
```

**4. Next.js Frontend (frontend)**
```yaml
Container: uns-claudejp-frontend
Port: 3000
Depends on: backend (healthcheck)
Bundler: Turbopack (Next.js 16)
Hot-reload: true

# Comandos
docker compose logs -f frontend
docker compose exec frontend npm run dev
```

**5. Adminer (adminer)**
```yaml
Container: uns-claudejp-adminer
Port: 8080
Purpose: Web-based database management
Access: http://localhost:8080
```

**6. Importer (importer)**
```yaml
Container: uns-claudejp-importer
Purpose: One-time initialization
Actions:
  - Create admin user
  - Run all Alembic migrations
  - Seed demo data
  - Import from Excel
Restart: 'no' (runs only once)
```

### Observability Stack (4)

**7. OpenTelemetry Collector (otel-collector)**
```yaml
Image: otel/opentelemetry-collector-contrib:0.103.0
Ports: 4317 (gRPC), 4318 (HTTP), 13133 (health)
Purpose: Collect traces, metrics, logs
Exports to: Tempo, Prometheus
```

**8. Grafana Tempo (tempo)**
```yaml
Port: 3200
Purpose: Distributed tracing storage
Volume: tempo_data
Stores traces from OpenTelemetry
```

**9. Prometheus (prometheus)**
```yaml
Port: 9090
Purpose: Metrics storage
Scrapes: backend, otel-collector
Volume: prometheus_data
```

**10. Grafana (grafana)**
```yaml
Port: 3001 (mapped from 3000)
Admin: admin/admin123
Purpose: Dashboards and visualization
Data Sources: Prometheus, Tempo
Volume: grafana_data
Access: http://localhost:3001
```

### Infrastructure (2)

**11. Nginx (nginx)**
```yaml
Ports: 80, 443
Purpose: Reverse proxy + load balancer
Routing:
  /api/* → backend (load balanced)
  / → frontend
  /adminer/ → adminer
  /grafana/ → grafana
Health Check: /nginx-health
Config: docker/nginx/nginx.conf
```

**12. Backup Service (backup)**
```yaml
Purpose: Automated PostgreSQL backups
Schedule: Configurable cron (default: 02:00 JST)
Retention: 30 days
Output: ./backups/backup_YYYYMMDD_HHMMSS.sql.gz
Timezone: Asia/Tokyo
```

## Docker Compose Comandos

### Startup & Shutdown
```bash
# Iniciar todos servicios (dev profile)
docker compose up -d --profile dev

# Iniciar en producción
docker compose up -d --profile prod

# Detener todos
docker compose down

# Detener y limpiar volumes
docker compose down -v

# Rebuild un servicio
docker compose build backend
docker compose build --no-cache frontend
```

### Logging & Monitoring
```bash
# Ver logs en tiempo real
docker compose logs -f backend

# Ver logs específicos últimas 100 líneas
docker compose logs backend --tail=100

# Ver logs con formato
docker compose logs --timestamps

# Logs de múltiples servicios
docker compose logs -f backend frontend

# Ver estado de todos servicios
docker compose ps
docker compose ps -a  # Including stopped
```

### Debugging
```bash
# Entrar en container
docker compose exec backend bash
docker compose exec frontend bash
docker compose exec -it uns-claudejp-db psql -U uns_admin -d uns_claudejp

# Ver variables de entorno
docker compose exec backend env | grep -i database

# Ejecutar comando en container
docker compose exec backend python -m alembic current
docker compose exec frontend npm list
```

### Escalabilidad
```bash
# Escalar backend a 3 instancias
docker compose up -d --scale backend=3

# Ver instancias
docker compose ps backend

# Nginx automáticamente load-balancea entre:
# uns-claudejp-backend-1, backend-2, backend-3
```

### Rebuild & Updates
```bash
# Rebuild todo
docker compose build

# Rebuild sin caché
docker compose build --no-cache

# Actualizar imagen sin rebuild
docker compose pull
docker compose up -d
```

## Health Checks

### Verificar salud de todos servicios
```bash
# Ver status
docker compose ps

# STATUS debería ser "healthy" para:
- db (pg_isready)
- redis (redis-cli ping)
- backend (GET /api/health)
- frontend (GET /)
- tempo, prometheus, grafana (puertos abiertos)

# Si alguno "unhealthy":
docker compose logs [service-name]
```

### Health Check Endpoints
```
GET http://localhost:8000/api/health       # Backend
GET http://localhost:3000/                 # Frontend
GET http://localhost/nginx-health          # Nginx
GET http://localhost:9090/-/ready          # Prometheus
GET http://localhost:3200/status           # Tempo
http://localhost:3001/api/health           # Grafana
```

## Backup & Disaster Recovery

### Automatización de Backup
```bash
# El servicio de backup corre cada día a las 02:00 JST
# Archivos guardados en: ./backups/

# Ver backups disponibles
ls -lh ./backups/

# Estructura: backup_YYYYMMDD_HHMMSS.sql.gz
# Ejemplo: backup_20241115_020000.sql.gz

# Configurar hora de backup
BACKUP_TIME=02:00  # En .env (formato HH:MM en JST)

# Configurar retención
BACKUP_RETENTION_DAYS=30
```

### Manual Backup
```bash
# Backup sin compresión
docker exec uns-claudejp-db pg_dump -U uns_admin uns_claudejp > backup_manual.sql

# Backup comprimido
docker exec uns-claudejp-db pg_dump -U uns_admin uns_claudejp | gzip > backup_manual.sql.gz

# Backup con solo datos (no schema)
docker exec uns-claudejp-db pg_dump -U uns_admin --data-only uns_claudejp > data_only.sql

# Backup de tabla específica
docker exec uns-claudejp-db pg_dump -U uns_admin -t employees uns_claudejp > employees_backup.sql
```

### Restore de Backup
```bash
# Restore completo
docker exec -i uns-claudejp-db psql -U uns_admin uns_claudejp < backup_20241115_020000.sql

# Restore de comprimido
gunzip < backup_20241115_020000.sql.gz | docker exec -i uns-claudejp-db psql -U uns_admin uns_claudejp

# Verificar después
docker exec -it uns-claudejp-db psql -U uns_admin -d uns_claudejp -c "SELECT COUNT(*) FROM employees;"
```

## Network & Connectivity

### Container Networking
```bash
# Ver red
docker network ls | grep uns

# Inspeccionar red
docker network inspect uns-network

# Todos servicios usan "uns-network" bridge
# Pueden conectarse por hostname:
# - backend → db:5432
# - backend → redis:6379
# - frontend → backend:8000
```

### Port Mapping
```
External → Internal → Service
80       → 80       → nginx
443      → 443      → nginx
3000     → 3000     → frontend
8000     → 8000     → backend
5432     → 5432     → db
6379     → 6379     → redis
3001     → 3000     → grafana
8080     → 8080     → adminer
9090     → 9090     → prometheus
3200     → 3200     → tempo
4317,4318→ 4317,4318→ otel-collector
```

## Troubleshooting

### Servicio No Inicia
```bash
# Ver logs detallados
docker compose logs [service-name] -f

# Rebuild
docker compose build [service-name]
docker compose up -d [service-name]

# Limpiar todo y reiniciar
docker compose down -v
docker compose build
docker compose up -d --profile dev
```

### Database Connection Error
```bash
# Verificar que db está healthy
docker compose ps db

# Probar conexión
docker exec -it uns-claudejp-db psql -U uns_admin -d uns_claudejp -c "SELECT 1;"

# Ver logs de DB
docker compose logs db

# Reiniciar
docker compose restart db
docker compose restart backend
```

### Frontend Build Error
```bash
# Limpiar caché
docker compose down
rm -rf frontend/.next
docker compose build frontend
docker compose up -d frontend

# Ver logs detallados
docker compose logs -f frontend

# Verificar Node version
docker compose exec frontend node --version
```

### Memory Issues
```bash
# Ver uso de memoria
docker stats

# Limitar memoria (en docker-compose.yml)
services:
  backend:
    deploy:
      resources:
        limits:
          memory: 2G
        reservations:
          memory: 1G

# Limpiar caché de Docker
docker system prune
docker system prune -a  # Más agresivo
```

## Performance Tuning

### Database
```bash
# Vacuum y analyze
docker exec uns-claudejp-db psql -U uns_admin -d uns_claudejp -c "VACUUM FULL; ANALYZE;"

# Ver tabla sizes
docker exec -it uns-claudejp-db psql -U uns_admin -d uns_claudejp -c \
  "SELECT schemaname, tablename, pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) FROM pg_tables WHERE schemaname != 'pg_catalog' ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;"
```

### Redis
```bash
# Monitorear memoria Redis
docker compose exec redis redis-cli info memory

# Limpiar caché
docker compose exec redis redis-cli FLUSHDB
docker compose exec redis redis-cli FLUSHALL
```

### Nginx Load Balancing
```
# Con 3 backend instances
upstream backend {
    server backend:8000;     # backend-1
    server backend:8000;     # backend-2
    server backend:8000;     # backend-3
}

# nginx automáticamente distribuye requests en round-robin
```

## CI/CD Preparation

### Building for Production
```bash
# Build images para producción
docker compose build --no-cache

# Push a registry (ejemplo: Docker Hub)
docker tag uns-claudejp-backend:latest myrepo/backend:latest
docker push myrepo/backend:latest

# En servidor producción:
docker pull myrepo/backend:latest
docker compose up -d --profile prod
```

## Éxito = Infraestructura Estable + Escalable + Resiliente
