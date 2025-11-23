# Port Migration Summary - JPUNS-Claude 6.5.0

## Date: 2025-11-23
## Status: COMPLETED ✅

---

## Changes Overview

All external ports have been reconfigured to avoid conflicts with other Docker applications. This migration affects ONLY external port mappings (host → container). Internal Docker networking remains unchanged.

---

## Files Modified

### 1. docker-compose.yml
**Changes:**
- PostgreSQL: Added port mapping 5532:5432 (now accessible from host)
- Redis: Added port mapping 6479:6379 (now accessible from host)
- Backend: Added port mapping 8100:8000
- Frontend: Changed port mapping from 3000:3000 to 3100:3000
- Frontend-prod: Changed port mapping from 3000:3000 to 3100:3000
- Adminer: Changed port mapping from 8080:8080 to 8180:8080
- Prometheus: Changed port mapping from 9090:9090 to 9190:9090
- Grafana: Changed port mapping from 3001:3000 to 3101:3000
- OpenTelemetry: Changed ports from 4317:4317, 4318:4318 to 4417:4317, 4418:4318
- Tempo: Changed port mapping from 3200:3200 to 3300:3200
- Updated all FRONTEND_URL environment variables from localhost:3000 to localhost:3100
- Updated NEXT_PUBLIC_GRAFANA_URL from localhost:3001 to localhost:3101
- Updated NEXT_PUBLIC_OTEL_EXPORTER_URL to use port 4418

### 2. .env.example (Root)
**Changes:**
- Added comprehensive port configuration section at top
- Updated FRONTEND_URL: http://localhost:3000 → http://localhost:3100
- Updated BACKEND_CORS_ORIGINS: localhost:3000 → localhost:3100
- Updated DATABASE_URL: localhost:5432 → localhost:5532
- Updated OTEL_EXPORTER_OTLP_ENDPOINT: localhost:4317 → localhost:4417
- Updated NEXT_PUBLIC_OTEL_EXPORTER_URL: localhost:4318 → localhost:4418
- Updated NEXT_PUBLIC_GRAFANA_URL: localhost:3001 → localhost:3101
- Added documentation for all port mappings

### 3. backend/.env.example
**Changes:**
- Added port configuration section
- Updated DATABASE_URL: localhost:5432 → localhost:5532
- Updated FRONTEND_URL: localhost:3000 → localhost:3100
- Updated BACKEND_CORS_ORIGINS: localhost:3000 → localhost:3100

### 4. backend/app/core/config.py
**Changes:**
- Updated FRONTEND_URL default: localhost:3000 → localhost:3100
- Updated REDIS_URL default: localhost:6379 → localhost:6479
- Updated BACKEND_CORS_ORIGINS default: localhost:3000 → localhost:3100
- Added comment explaining external vs internal ports

### 5. frontend/next.config.ts
**Changes:**
- Updated resolveApiOrigin fallback: localhost:8000 → localhost:8100
- Updated connectSrc development origins: localhost:3000 → localhost:3100
- Updated connectSrc development origins: localhost:8000 → localhost:8100
- Updated WebSocket URLs: localhost:3000 → localhost:3100, localhost:3001 → localhost:3101

### 6. README.md
**Changes:**
- Updated frontend URL: localhost:3000 → localhost:3100
- Updated backend API URL: localhost:8000 → localhost:8100
- Updated Adminer URL: localhost:8080 → localhost:8180
- Updated all curl command examples
- Updated service URLs table
- Added Grafana and Prometheus to service table

### 7. docker/conf.d/default.conf
**Changes:**
- Updated CORS origin regex: localhost:3000 → localhost:3100
- Updated CORS origin regex: localhost:3001 → localhost:3101
- Updated CORS origin regex: localhost:8000 → localhost:8100
- Updated CORS origin regex: localhost:8080 → localhost:8180
- NOTE: Backend and frontend upstream servers remain unchanged (use internal Docker names)

### 8. PORT_CONFIGURATION_6.5.0.md (NEW FILE)
**Created comprehensive documentation including:**
- Complete port mapping table
- Migration guide for existing installations
- Service access guide with all URLs
- Verification commands
- Troubleshooting section
- Quick reference card

---

## Port Mapping Reference

| Service | Old External Port | New External Port | Internal Port |
|---------|------------------|------------------|---------------|
| Frontend | 3000 | **3100** | 3000 |
| Backend API | Not exposed | **8100** | 8000 |
| PostgreSQL | Not exposed | **5532** | 5432 |
| Redis | Not exposed | **6479** | 6379 |
| Adminer | 8080 | **8180** | 8080 |
| Prometheus | 9090 | **9190** | 9090 |
| Grafana | 3001 | **3101** | 3000 |
| OTEL gRPC | 4317 | **4417** | 4317 |
| OTEL HTTP | 4318 | **4418** | 4318 |
| Tempo | 3200 | **3300** | 3200 |
| Nginx | 80, 443 | 80, 443 | 80, 443 |

---

## Internal Docker Network (UNCHANGED)

Services communicate within Docker using these internal addresses:
- Backend: 
- Frontend: 
- PostgreSQL: 
- Redis: 
- Prometheus: 
- Grafana: 
- OpenTelemetry: , 
- Tempo: 

**These internal addresses are used in docker-compose.yml and should NOT be changed.**

---

## Migration Checklist

For users upgrading from previous versions:

- [x] Update docker-compose.yml with new port mappings
- [x] Update .env.example files
- [x] Update backend configuration files
- [x] Update frontend configuration files
- [x] Update README.md documentation
- [x] Update nginx CORS configuration
- [x] Create PORT_CONFIGURATION_6.5.0.md documentation
- [ ] User action: Copy new .env.example to .env and update values
- [ ] User action: Restart Docker services
- [ ] User action: Update bookmarks to new URLs
- [ ] User action: Verify all services are accessible

---

## Testing Commands

After migration, verify all services are working:


# Stop services
docker compose down

# Start services with new configuration
docker compose up -d

# Wait for services to be ready
sleep 30

# Test frontend
curl -I http://localhost:3100

# Test backend API
curl http://localhost:8100/api/health

# Test Grafana
curl -I http://localhost:3101

# Test Prometheus
curl -I http://localhost:9190

# Test database connection
docker compose exec db pg_isready -U uns_admin

# Test Redis connection
docker compose exec redis redis-cli -a YOUR_PASSWORD ping

# View all running services
docker compose ps
