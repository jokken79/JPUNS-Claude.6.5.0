# Frontend Docker Fix - Node Modules Persistence

## Problem Description

When running the frontend service with Docker Compose, the volume mount `./frontend:/app` was overwriting the `node_modules` directory that was installed during the Docker build process. This caused runtime errors because dependencies were missing.

## Root Cause

The issue occurred because:

1. **Docker build stage** installs dependencies into `/app/node_modules`
2. **Docker Compose** mounts the local `./frontend` directory to `/app` in the container
3. The local `./frontend` directory doesn't have `node_modules` installed (it's in `.dockerignore`)
4. The mount **overwrites** the container's `/app` directory, losing the built `node_modules`
5. Anonymous volumes (`/app/node_modules`) don't always persist reliably on Windows

## Solution Applied

### 1. Changed Anonymous Volumes to Named Volumes

**Before (in docker-compose.yml):**
```yaml
volumes:
  - ./frontend:/app
  - /app/node_modules        # Anonymous volume - unreliable
  - /app/.next               # Anonymous volume - unreliable
```

**After:**
```yaml
volumes:
  - ./frontend:/app
  - uns_claudejp_600_frontend_node_modules:/app/node_modules  # Named volume - persistent
  - uns_claudejp_600_frontend_next:/app/.next                 # Named volume - persistent
```

### 2. Added Named Volumes Declaration

Added to the `volumes:` section at the bottom of `docker-compose.yml`:

```yaml
volumes:
  uns_claudejp_600_frontend_node_modules:
    driver: local
  uns_claudejp_600_frontend_next:
    driver: local
```

### 3. Optimized Dockerfile for Development

Updated `docker/Dockerfile.frontend` to:
- Copy `node_modules` from the deps stage
- Add package.json for reference
- Document that application code is mounted via volume
- Remove unnecessary `COPY . .` in development stage (code comes from volume)

## How It Works Now

1. **Build time**: Docker installs all npm dependencies into the `deps` stage
2. **Development stage**: Copies `node_modules` from deps stage into the image
3. **Runtime**: Named volumes preserve `node_modules` and `.next` directories
4. **Hot reload**: Application code is still mounted from `./frontend` for live editing
5. **Persistence**: `node_modules` survive container restarts and recreations

## Files Modified

1. **`docker-compose.yml`**
   - Changed frontend service volumes from anonymous to named volumes
   - Added two new volume declarations

2. **`docker/Dockerfile.frontend`**
   - Optimized development stage
   - Added comments for clarity
   - Removed unnecessary COPY in development stage

## How to Apply This Fix

### Step 1: Stop and Remove Existing Containers

```bash
# Stop all services
docker compose down

# Remove frontend containers and volumes (IMPORTANT!)
docker compose rm -f frontend
docker volume rm uns-claudejp-600_frontend  # If exists
```

### Step 2: Rebuild the Frontend Container

```bash
# Rebuild frontend with no cache to ensure fresh install
docker compose build --no-cache frontend
```

### Step 3: Start Services

```bash
# Start all services
docker compose up -d

# Or start with specific profile
docker compose --profile dev up -d
```

### Step 4: Verify Dependencies Installed

```bash
# Check that node_modules exists in the container
docker exec uns-claudejp-600-frontend ls -la /app/node_modules | head -20

# Check that dependencies are accessible
docker exec uns-claudejp-600-frontend npm list --depth=0
```

### Step 5: Check Frontend Logs

```bash
# View frontend startup logs
docker compose logs -f frontend

# You should see Next.js starting without module errors
```

## Verification Checklist

- [ ] Frontend container starts without errors
- [ ] No "Cannot find module" errors in logs
- [ ] Next.js dev server runs on http://localhost:3000
- [ ] Hot reload works when editing frontend code
- [ ] Named volumes persist across container restarts
- [ ] `node_modules` directory is populated in container

## Troubleshooting

### If you still see "Cannot find module" errors:

1. **Completely remove volumes:**
```bash
docker compose down -v  # Remove ALL volumes
docker volume prune -f
```

2. **Rebuild from scratch:**
```bash
docker compose build --no-cache frontend
docker compose up -d
```

### If hot reload doesn't work:

1. **Check volume mounts:**
```bash
docker inspect uns-claudejp-600-frontend | grep -A 20 Mounts
```

2. **Verify file watching:**
```bash
# Inside container
docker exec -it uns-claudejp-600-frontend sh
cat package.json  # Should show your latest changes
```

### If build is slow:

Named volumes persist across rebuilds, so subsequent builds will be faster. The first build after this change may take longer as it populates the named volumes.

## Benefits of This Approach

1. **Reliable persistence**: Named volumes are more reliable than anonymous volumes, especially on Windows
2. **Fast rebuilds**: Dependencies are cached in named volumes
3. **Hot reload preserved**: Application code is still mounted for live editing
4. **Clean separation**: Node modules are isolated from source code
5. **Production ready**: Production stage (frontend-prod) is unaffected and uses standalone build

## Additional Notes

- **Windows compatibility**: Named volumes work better on Windows than anonymous volumes
- **Volume inspection**: You can inspect the volumes with `docker volume inspect uns_claudejp_600_frontend_node_modules`
- **Cleanup**: To completely reset, remove volumes with `docker volume rm uns_claudejp_600_frontend_node_modules uns_claudejp_600_frontend_next`
- **Production**: The production stage (frontend-prod) uses a different approach (standalone build) and is not affected by this change

## Related Files

- `docker-compose.yml` - Service and volume configuration
- `docker/Dockerfile.frontend` - Multi-stage build configuration
- `frontend/.dockerignore` - Excludes node_modules from COPY operations
- `frontend/package.json` - Dependency definitions

## References

- Docker Compose named volumes: https://docs.docker.com/compose/compose-file/07-volumes/
- Next.js Docker documentation: https://nextjs.org/docs/deployment#docker-image
- Volume mount precedence: https://docs.docker.com/storage/volumes/
