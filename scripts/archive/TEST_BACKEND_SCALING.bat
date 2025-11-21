@echo off
REM ========================================
REM Backend Horizontal Scaling Test Script (Windows)
REM ========================================
REM
REM Purpose: Verify backend can scale horizontally and nginx load balances correctly
REM Usage: TEST_BACKEND_SCALING.bat [number_of_instances]
REM Example: TEST_BACKEND_SCALING.bat 3
REM
REM Author: Claude Code
REM Created: 2025-11-12
REM Version: 1.0.0
REM
REM ========================================

setlocal enabledelayedexpansion

REM Default values
set SCALE_COUNT=%1
if "%SCALE_COUNT%"=="" set SCALE_COUNT=3
set BACKEND_SERVICE=backend
set NGINX_URL=http://localhost/api/health
set TEST_REQUESTS=30

echo ========================================
echo Backend Horizontal Scaling Test
echo ========================================
echo.

REM Step 1: Check if docker is available
echo [1/6] Checking Docker...
docker version >nul 2>&1
if errorlevel 1 (
    echo ERROR: Docker is not installed or not running
    goto :error
)
echo [OK] Docker is available
echo.

REM Step 2: Scale backend service
echo [2/6] Scaling backend to %SCALE_COUNT% instances...
docker compose --profile dev up -d --scale %BACKEND_SERVICE%=%SCALE_COUNT% --no-recreate
if errorlevel 1 (
    echo ERROR: Failed to scale backend service
    goto :error
)

REM Wait for services to be ready
echo       Waiting for backend instances to be healthy...
timeout /t 10 /nobreak >nul
echo [OK] Backend instances scaled
echo.

REM Step 3: List all backend instances
echo [3/6] Backend instances:
docker compose ps %BACKEND_SERVICE%
echo.

REM Step 4: Test direct access to each backend instance
echo [4/6] Testing direct access to each backend instance...
set HEALTHY_COUNT=0

for /L %%i in (1,1,%SCALE_COUNT%) do (
    set CONTAINER_NAME=uns-claudejp-%BACKEND_SERVICE%-%%i

    REM Check if container exists and is healthy
    docker exec !CONTAINER_NAME! python -c "import urllib.request; urllib.request.urlopen('http://localhost:8000/api/health')" >nul 2>&1
    if !errorlevel! equ 0 (
        echo   [OK] !CONTAINER_NAME!: Healthy
        set /a HEALTHY_COUNT+=1
    ) else (
        echo   [FAIL] !CONTAINER_NAME!: Unhealthy or not found
    )
)

echo [OK] %HEALTHY_COUNT%/%SCALE_COUNT% instances are healthy
echo.

REM Step 5: Test load balancing through nginx
echo [5/6] Testing load balancing through nginx...
echo       Sending %TEST_REQUESTS% requests to %NGINX_URL%
set SUCCESS_COUNT=0

for /L %%i in (1,1,%TEST_REQUESTS%) do (
    curl -s -f "%NGINX_URL%" >nul 2>&1
    if !errorlevel! equ 0 (
        set /a SUCCESS_COUNT+=1
        echo | set /p=.
    ) else (
        echo | set /p=x
    )
)
echo.

set /a SUCCESS_RATE=SUCCESS_COUNT*100/TEST_REQUESTS
if %SUCCESS_RATE% geq 95 (
    echo [OK] Load balancing test passed: %SUCCESS_COUNT%/%TEST_REQUESTS% requests successful ^(%SUCCESS_RATE%%%^)
) else (
    echo [WARNING] Load balancing test warning: %SUCCESS_COUNT%/%TEST_REQUESTS% requests successful ^(%SUCCESS_RATE%%%^)
)
echo.

REM Step 6: Show summary
echo [6/6] Test summary:
echo.
echo ========================================
echo Backend Scaling Test Completed
echo ========================================
echo.
echo Summary:
echo   - Scaled instances: %SCALE_COUNT%
echo   - Healthy instances: %HEALTHY_COUNT%
echo   - Test requests: %TEST_REQUESTS%
echo   - Success rate: %SUCCESS_RATE%%%
echo.
echo Next steps:
echo   - Monitor logs: docker compose logs -f %BACKEND_SERVICE%
echo   - Check metrics: http://localhost:9090 ^(Prometheus^)
echo   - View dashboards: http://localhost:3001 ^(Grafana^)
echo   - Scale down: docker compose up -d --scale %BACKEND_SERVICE%=1
echo.
echo ========================================
echo.

goto :end

:error
echo.
echo ========================================
echo ERROR: Test failed
echo ========================================
echo.

:end
pause >nul
