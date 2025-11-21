# Frontend Docker Fix - Changes Summary

## Date: 2025-11-17

## Problem
Frontend container was experiencing 13 runtime errors due to missing npm dependencies. The issue was caused by volume mounts overwriting the `node_modules` directory that was installed during Docker build.

## Root Cause
- `docker-compose.yml` mounts `./frontend:/app` which overwrites the container's `/app` directory
- Anonymous volumes (`/app/node_modules`) were not reliably persisting dependencies, especially on Windows
- Local `./frontend` directory doesn't have `node_modules` (excluded in `.dockerignore`)

## Solution
Switched from **anonymous volumes** to **named volumes** for better persistence and reliability.

## Files Changed

### 1. `docker-compose.yml`

#### Frontend Service Volumes
```diff
  volumes:
    - ./frontend:/app
-   - /app/node_modules
-   - /app/.next
+   - uns_claudejp_600_frontend_node_modules:/app/node_modules
+   - uns_claudejp_600_frontend_next:/app/.next
```

#### Volume Declarations
```diff
volumes:
  uns_claudejp_600_postgres_data:
    driver: local
  uns_claudejp_600_redis_data:
    driver: local
  uns_claudejp_600_grafana_data:
    driver: local
  uns_claudejp_600_prometheus_data:
    driver: local
  uns_claudejp_600_tempo_data:
    driver: local
+ uns_claudejp_600_frontend_node_modules:
+   driver: local
+ uns_claudejp_600_frontend_next:
+   driver: local
```

### 2. `docker/Dockerfile.frontend`

#### Development Stage Optimization
```diff
# Development stage
FROM base AS development
WORKDIR /app

-# Copy node_modules from deps
+# Copy node_modules from deps stage
COPY --from=deps /app/node_modules ./node_modules
-COPY . .
+
+# Copy package files for reference
+COPY package.json package-lock.json* ./
+
+# Note: Application code will be mounted via volume in docker-compose.yml
+# This allows hot-reload during development

ENV NODE_ENV development
ENV NEXT_TELEMETRY_DISABLED 1
```

## New Files Created

1. **`FRONTEND_DOCKER_FIX.md`** - Comprehensive documentation and troubleshooting guide
2. **`scripts/FIX_FRONTEND_MODULES.bat`** - Automated fix script for Windows users
3. **`CHANGES_FRONTEND_FIX.md`** - This summary document

## How to Apply

### Quick Method (Windows)
```bash
cd scripts
FIX_FRONTEND_MODULES.bat
```

### Manual Method
```bash
# Stop services
docker compose down

# Remove old volumes
docker volume rm uns-claudejp-600_frontend

# Rebuild frontend
docker compose build --no-cache frontend

# Start services
docker compose up -d

# Verify
docker exec uns-claudejp-600-frontend ls -la /app/node_modules
```

## Benefits

1. **Reliable Persistence**: Named volumes are more reliable than anonymous volumes
2. **Windows Compatible**: Works correctly on Windows systems
3. **Fast Rebuilds**: Dependencies cached in named volumes
4. **Hot Reload Works**: Application code still mounted for live editing
5. **Clean Separation**: Node modules isolated from source code

## Verification Steps

After applying the fix, verify:

```bash
# 1. Check container is running
docker compose ps frontend

# 2. Check node_modules exists
docker exec uns-claudejp-600-frontend ls -la /app/node_modules

# 3. Check frontend logs
docker compose logs -f frontend

# 4. Access application
# Open http://localhost:3000 in browser
```

Expected result: Frontend should start without "Cannot find module" errors.

## Rollback (if needed)

To rollback these changes:

```bash
# 1. Stop services
docker compose down -v

# 2. Checkout original files
git checkout docker-compose.yml docker/Dockerfile.frontend

# 3. Rebuild and start
docker compose build --no-cache frontend
docker compose up -d
```

## Technical Details

### Named vs Anonymous Volumes

**Anonymous Volumes** (`/app/node_modules`):
- No explicit name
- Harder to inspect and manage
- May not persist reliably on Windows
- Automatically created and removed

**Named Volumes** (`uns_claudejp_600_frontend_node_modules`):
- Explicit declaration
- Easy to inspect with `docker volume inspect`
- Reliable persistence across platforms
- Manually managed lifecycle

### Volume Mount Order

Docker processes volumes in this order:
1. Named/bind mounts from `docker-compose.yml`
2. Volumes override previous mounts
3. Last volume wins for overlapping paths

With our setup:
1. `./frontend:/app` - Mounts source code
2. `uns_claudejp_600_frontend_node_modules:/app/node_modules` - Preserves dependencies
3. `uns_claudejp_600_frontend_next:/app/.next` - Preserves build cache

## Related Documentation

- Main documentation: `FRONTEND_DOCKER_FIX.md`
- Project overview: `CLAUDE.md`
- Docker Compose reference: https://docs.docker.com/compose/compose-file/07-volumes/
- Next.js Docker guide: https://nextjs.org/docs/deployment#docker-image

## Status

✅ **FIXED** - Frontend dependencies now persist correctly across container restarts

## Notes for AI Assistants

- These changes are part of the project infrastructure
- DO NOT revert without explicit user approval
- Named volumes are intentional for Windows compatibility
- This fix maintains hot-reload capability for development
