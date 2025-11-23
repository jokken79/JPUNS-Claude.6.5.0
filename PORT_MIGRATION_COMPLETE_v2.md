# Port Migration Complete - v6.5.0 → New Range (3200+/8200+)

**Migration Date**: 2025-11-23  
**Reason**: Conflict with another application using port 3100  
**Status**: ✅ COMPLETED

---

## 🎯 Port Mapping Summary

### OLD PORTS → NEW PORTS

| Service | Old External Port | New External Port | Internal Port | Access URL |
|---------|-------------------|-------------------|---------------|------------|
| **Frontend** | 3100 | **3200** | 3000 | http://localhost:3200 |
| **Backend API** | 8100 | **8200** | 8000 | http://localhost:8200/api |
| **PostgreSQL** | 5532 | **5632** | 5432 | postgresql://localhost:5632 |
| **Redis** | 6479 | **6579** | 6379 | redis://localhost:6579 |
| **Adminer** | 8180 | **8280** | 8080 | http://localhost:8280 |
| **Prometheus** | 9190 | **9290** | 9090 | http://localhost:9290 |
| **Grafana** | 3101 | **3201** | 3000 | http://localhost:3201 |
| **OTEL Collector** | 4417, 4418 | **4517, 4518** | 4317, 4318 | http://localhost:4517 |
| **Tempo** | 3300 | **3400** | 3200 | http://localhost:3400 |
| **Nginx** | 80, 443 | 80, 443 | 80, 443 | http://localhost |

---

## 📝 Files Modified

### ✅ Core Configuration (COMPLETED)

1. **docker-compose.yml**
   - Updated all port mappings (db, redis, backend, frontend, adminer, otel, tempo, prometheus, grafana)
   - Updated FRONTEND_URL environment variables
   - Updated NEXT_PUBLIC_GRAFANA_URL environment variables

2. **.env.example** (Root)
   - Updated PORT CONFIGURATION comment block
   - Updated DATABASE_URL port: 5532 → 5632
   - Updated FRONTEND_URL: 3100 → 3200
   - Updated BACKEND_CORS_ORIGINS: 3100 → 3200
   - Updated OTEL_EXPORTER_OTLP_ENDPOINT: 4417 → 4517
   - Updated NEXT_PUBLIC_OTEL_EXPORTER_URL: 4418 → 4518
   - Updated NEXT_PUBLIC_GRAFANA_URL: 3101 → 3201

3. **backend/.env.example**
   - Updated PORT CONFIGURATION comment block
   - Updated DATABASE_URL port: 5532 → 5632
   - Updated FRONTEND_URL: 3100 → 3200
   - Updated BACKEND_CORS_ORIGINS: 3100 → 3200
   - Updated OTEL endpoints: 4317 → 4517

### ✅ Frontend Configuration (COMPLETED)

4. **frontend/next.config.ts**
   - Updated resolveApiOrigin default: 8100 → 8200
   - Updated connectSrc development ports:
     - localhost:3100 → localhost:3200
     - localhost:8100 → localhost:8200
     - ws://localhost:3100 → ws://localhost:3200
     - ws://localhost:3101 → ws://localhost:3201

### ✅ Nginx Configuration (COMPLETED)

5. **docker/conf.d/default.conf**
   - Updated CORS origin validation regex:
     - localhost:3100 → localhost:3200
     - localhost:3101 → localhost:3201
     - localhost:8100 → localhost:8200
     - localhost:8180 → localhost:8280

---

## 🚀 Next Steps Required

### IMPORTANT: Update Your Local .env File

If you have a local `.env` file (not tracked by git), you MUST update it manually:

```bash
# Copy new example
cp .env.example .env

# Then edit .env and set your passwords/secrets
```

### Update Backend .env

```bash
cd backend
cp .env.example .env
# Edit backend/.env with your settings
```

### Restart All Services

```bash
# Stop existing services
docker-compose down

# Rebuild and start with new ports
docker-compose up -d --build

# Verify services
docker-compose ps
```

### Verify Access

After restart, verify all services are accessible on new ports:

- ✅ Frontend: http://localhost:3200
- ✅ Backend API: http://localhost:8200/api/health
- ✅ API Docs: http://localhost:8200/docs
- ✅ Adminer: http://localhost:8280
- ✅ Grafana: http://localhost:3201
- ✅ Prometheus: http://localhost:9290

### Database Connection

Update your database client connections:
```
postgresql://uns_admin:YOUR_PASSWORD@localhost:5632/uns_claudejp
```

### Redis Connection

Update Redis client connections:
```
redis-cli -h localhost -p 6579 -a YOUR_PASSWORD
```

---

## 🔍 Verification Checklist

- [x] docker-compose.yml updated
- [x] .env.example (root) updated
- [x] backend/.env.example updated
- [x] frontend/next.config.ts updated
- [x] docker/conf.d/default.conf updated
- [ ] Local .env files updated (USER MUST DO THIS)
- [ ] Services restarted with new ports (USER MUST DO THIS)
- [ ] All URLs verified working (USER MUST DO THIS)

---

## ⚠️ Breaking Changes

### For Developers

If you have local development scripts or bookmarks using old ports, update them:

**Old URLs:**
- ❌ http://localhost:3100 (Frontend)
- ❌ http://localhost:8100/api (Backend)
- ❌ http://localhost:3101 (Grafana)

**New URLs:**
- ✅ http://localhost:3200 (Frontend)
- ✅ http://localhost:8200/api (Backend)
- ✅ http://localhost:3201 (Grafana)

### For Database Tools

Update connection strings in:
- DBeaver
- pgAdmin
- TablePlus
- DataGrip
- VS Code extensions

**Old:** `postgresql://uns_admin:password@localhost:5532/uns_claudejp`  
**New:** `postgresql://uns_admin:password@localhost:5632/uns_claudejp`

---

## 📊 Testing Recommendations

After migration, test these critical paths:

1. **Authentication Flow**
   - Login at http://localhost:3200
   - Verify JWT tokens work
   - Test logout

2. **API Communication**
   - Test GET /api/health
   - Test employee CRUD operations
   - Verify CORS headers

3. **Database Connectivity**
   - Connect via Adminer: http://localhost:8280
   - Run query to verify data integrity

4. **Monitoring Stack**
   - Access Grafana: http://localhost:3201
   - Verify Prometheus metrics: http://localhost:9290
   - Check OTEL traces

---

## 🛠️ Rollback Plan

If you need to rollback to old ports:

```bash
# Stop services
docker-compose down

# Checkout previous version of config files
git checkout HEAD~1 docker-compose.yml .env.example backend/.env.example frontend/next.config.ts docker/conf.d/default.conf

# Restart with old ports
docker-compose up -d
```

---

## 📞 Support

If you encounter issues after migration:

1. Check docker logs: `docker-compose logs -f`
2. Verify port conflicts: `netstat -an | findstr "3200 8200 5632"`
3. Ensure .env files are updated
4. Clear browser cache and cookies
5. Restart Docker Desktop

---

**Migration completed successfully!** 🎉

All configuration files have been updated to the new port range (3200+/8200+).

**NEXT ACTION**: Update your local .env files and restart services.
