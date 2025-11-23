# Port Configuration Guide - JPUNS-Claude 6.5.0

## Overview

This document describes the complete port configuration for JPUNS-Claude v6.5.0.

**Version:** 6.5.0
**Updated:** 2025-11-23 (Port Migration v2)
**Status:** Production Ready

## Port Mapping Reference

### Complete Port Mapping Table

| Service | Previous Port | Current Port | Internal Port | Access URL |
|---------|---------------|--------------|---------------|------------|
| **Frontend** | 3100 | **3200** | 3000 | http://localhost:3200 |
| **Backend API** | 8100 | **8200** | 8000 | http://localhost:8200/api |
| **PostgreSQL** | 5532 | **5632** | 5432 | postgresql://localhost:5632 |
| **Redis** | 6479 | **6579** | 6379 | redis://localhost:6579 |
| **Adminer** | 8180 | **8280** | 8080 | http://localhost:8280 |
| **Prometheus** | 9190 | **9290** | 9090 | http://localhost:9290 |
| **Grafana** | 3101 | **3201** | 3000 | http://localhost:3201 |
| **OTEL gRPC** | 4417 | **4517** | 4317 | localhost:4517 |
| **OTEL HTTP** | 4418 | **4518** | 4318 | http://localhost:4518 |
| **Tempo** | 3300 | **3400** | 3200 | http://localhost:3400 |
| **Nginx** | 80, 443 | 80, 443 | 80, 443 | http://localhost |

### Key Points

- **External Ports**: Ports exposed on the host machine
- **Internal Ports**: Ports used within Docker network
- **Format**: HOST:CONTAINER (e.g., 3100:3000)

## Why the Port Changes?

**Migration v2 (Nov 23, 2025)**: Ports changed from 3100/8100 range to 3200/8200 range due to conflict with another application using port 3100.

The external ports have been reconfigured to the 3200+/8200+ range to avoid conflicts while maintaining internal Docker networking.

## Service Access Guide

### Frontend (Next.js)
- **URL**: http://localhost:3200
- **Health**: http://localhost:3200

### Backend API (FastAPI)
- **URL**: http://localhost:8200/api
- **Docs**: http://localhost:8200/docs
- **Health**: http://localhost:8200/api/health

### PostgreSQL Database
- **Connection**: postgresql://uns_admin:PASSWORD@localhost:5632/uns_claudejp
- **Tools**: psql -h localhost -p 5632 -U uns_admin -d uns_claudejp

### Redis Cache
- **Connection**: redis-cli -h localhost -p 6579 -a PASSWORD

### Adminer (Dev Only)
- **URL**: http://localhost:8280

### Grafana
- **URL**: http://localhost:3201
- **Login**: See GRAFANA_ADMIN_PASSWORD in .env

### Prometheus
- **URL**: http://localhost:9290

## Migration Guide

### Update your .env file:

```bash
FRONTEND_URL=http://localhost:3200
BACKEND_CORS_ORIGINS=http://localhost:3200,http://127.0.0.1:3200
DATABASE_URL=postgresql://uns_admin:PASSWORD@localhost:5632/uns_claudejp
OTEL_EXPORTER_OTLP_ENDPOINT=http://localhost:4517
NEXT_PUBLIC_OTEL_EXPORTER_URL=http://localhost:4518/v1/traces
NEXT_PUBLIC_GRAFANA_URL=http://localhost:3201
```

### Update bookmarks:
- Frontend: http://localhost:3100 → http://localhost:3200
- API Docs: http://localhost:8100/docs → http://localhost:8200/docs
- Grafana: http://localhost:3101 → http://localhost:3201
- Adminer: http://localhost:8180 → http://localhost:8280

## Verification Commands

### Check ports available:

```bash
# Windows
netstat -ano | findstr "3200 8200 5632"

# Linux/Mac
lsof -i :3200 -i :8200 -i :5632
```

### Test services:

```bash
curl http://localhost:3200
curl http://localhost:8200/api/health
docker compose exec db pg_isready -U uns_admin
```


## Troubleshooting

### Port Already in Use
Find and stop the conflicting service or change the port in docker-compose.yml

### Frontend Cannot Connect to Backend
1. Verify FRONTEND_URL=http://localhost:3100 in .env
2. Verify BACKEND_CORS_ORIGINS includes http://localhost:3100
3. Restart: docker compose restart backend

### Database Connection Refused
1. Check DATABASE_URL uses port 5532
2. Verify credentials in .env
3. Test: docker compose exec db pg_isready -U uns_admin

## Quick Reference


╔══════════════════════════════════════════════╗
║  JPUNS-Claude 6.5.0 - Port Quick Reference  ║
╠══════════════════════════════════════════════╣
║  Frontend      http://localhost:3100        ║
║  Backend API   http://localhost:8100/api    ║
║  API Docs      http://localhost:8100/docs   ║
║  Grafana       http://localhost:3101        ║
║  Prometheus    http://localhost:9190        ║
║  PostgreSQL    localhost:5532               ║
║  Redis         localhost:6479               ║
╚══════════════════════════════════════════════╝
