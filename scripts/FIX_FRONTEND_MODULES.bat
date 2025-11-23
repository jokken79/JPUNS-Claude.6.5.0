@echo off
REM ========================================
REM Fix Frontend Node Modules Persistence
REM ========================================
REM This script fixes the issue where npm dependencies
REM are not persisting in the frontend container
REM ========================================

echo.
echo ========================================
echo Frontend Node Modules Persistence Fix
echo ========================================
echo.
echo This will:
echo 1. Stop frontend container
echo 2. Remove old volumes
echo 3. Rebuild frontend container
echo 4. Start services with new configuration
echo.
echo Press any key to continue or Ctrl+C to cancel...
pause >nul

echo.
echo [1/5] Stopping frontend container...
docker compose stop frontend
if errorlevel 1 (
    echo ERROR: Failed to stop frontend container
    echo Make sure Docker Desktop is running
    pause >nul
    exit /b 1
)

echo.
echo [2/5] Removing old frontend volumes...
docker volume rm uns-claudejp-600_frontend 2>nul
echo Note: It's OK if the above volume doesn't exist

echo.
echo [3/5] Rebuilding frontend container (this may take a few minutes)...
docker compose build --no-cache frontend
if errorlevel 1 (
    echo ERROR: Failed to build frontend container
    echo Check the logs above for details
    pause >nul
    exit /b 1
)

echo.
echo [4/5] Starting all services...
docker compose up -d
if errorlevel 1 (
    echo ERROR: Failed to start services
    pause >nul
    exit /b 1
)

echo.
echo [5/5] Waiting for frontend to be ready (30 seconds)...
timeout /t 30 /nobreak >nul

echo.
echo ========================================
echo Verification
echo ========================================
echo.
echo Checking if node_modules exists in container...
docker exec uns-claudejp-600-frontend ls -la /app/node_modules | findstr "total"
if errorlevel 1 (
    echo WARNING: node_modules might not be installed correctly
) else (
    echo SUCCESS: node_modules directory exists
)

echo.
echo Checking frontend health...
docker compose ps frontend

echo.
echo ========================================
echo Fix Applied Successfully!
echo ========================================
echo.
echo Next steps:
echo 1. Open http://localhost:3000 in your browser
echo 2. Check for any errors in the console
echo 3. If issues persist, run: docker compose logs -f frontend
echo.
echo To view live logs, run:
echo   docker compose logs -f frontend
echo.
echo For detailed troubleshooting, see:
echo   FRONTEND_DOCKER_FIX.md
echo.
pause >nul
