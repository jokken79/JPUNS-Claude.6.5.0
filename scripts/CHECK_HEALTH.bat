@echo off
REM ==============================================================================
REM CHECK_HEALTH.bat - Comprehensive System Health Check
REM ==============================================================================
REM Description:
REM   Performs comprehensive health checks on all services:
REM   - Docker containers status
REM   - Database connectivity
REM   - Backend API health
REM   - Frontend availability
REM   - Redis connectivity
REM   - Port availability
REM
REM Usage:
REM   CHECK_HEALTH.bat                - Full health check
REM   CHECK_HEALTH.bat quick          - Quick check (services only)
REM   CHECK_HEALTH.bat api            - Check only API endpoints
REM ==============================================================================

echo.
echo ================================================================================
echo                    UNS-ClaudeJP System Health Check
echo ================================================================================
echo.

REM Parse command line arguments
set CHECK_TYPE=%1
if "%CHECK_TYPE%"=="" set CHECK_TYPE=full

REM Initialize counters
set PASSED=0
set FAILED=0

echo [INFO] Running health check: %CHECK_TYPE%
echo [INFO] Timestamp: %date% %time%
echo.

REM Check Docker
echo ================================================================================
echo                        Docker Status
echo ================================================================================
echo.

docker --version >nul 2>&1
if errorlevel 1 (
    echo [FAIL] Docker is not installed or not in PATH
    set /a FAILED+=1
) else (
    echo [PASS] Docker is installed
    set /a PASSED+=1
)

docker ps >nul 2>&1
if errorlevel 1 (
    echo [FAIL] Docker daemon is not running
    set /a FAILED+=1
) else (
    echo [PASS] Docker daemon is running
    set /a PASSED+=1
)
echo.

REM Check Docker Containers
echo ================================================================================
echo                        Container Health
echo ================================================================================
echo.

REM Backend
docker ps | findstr "uns-claudejp-600-backend-1" | findstr "Up" >nul 2>&1
if errorlevel 1 (
    echo [FAIL] Backend container is not running
    set /a FAILED+=1
) else (
    echo [PASS] Backend container is running
    set /a PASSED+=1
)

REM Frontend
docker ps | findstr "uns-claudejp-600-frontend" | findstr "Up" >nul 2>&1
if errorlevel 1 (
    echo [FAIL] Frontend container is not running
    set /a FAILED+=1
) else (
    echo [PASS] Frontend container is running
    set /a PASSED+=1
)

REM Database
docker ps | findstr "uns-claudejp-600-db" | findstr "Up" >nul 2>&1
if errorlevel 1 (
    echo [FAIL] Database container is not running
    set /a FAILED+=1
) else (
    echo [PASS] Database container is running
    set /a PASSED+=1
)

REM Redis
docker ps | findstr "uns-claudejp-600-redis" | findstr "Up" >nul 2>&1
if errorlevel 1 (
    echo [FAIL] Redis container is not running
    set /a FAILED+=1
) else (
    echo [PASS] Redis container is running
    set /a PASSED+=1
)
echo.

if "%CHECK_TYPE%"=="quick" goto :summary

REM Check Database Connectivity
echo ================================================================================
echo                        Database Health
echo ================================================================================
echo.

docker exec uns-claudejp-600-db psql -U uns_admin -d uns_claudejp -c "SELECT 1" >nul 2>&1
if errorlevel 1 (
    echo [FAIL] Database connection failed
    set /a FAILED+=1
) else (
    echo [PASS] Database is accessible
    set /a PASSED+=1
)

REM Count tables
for /f "tokens=*" %%i in ('docker exec uns-claudejp-600-db psql -U uns_admin -d uns_claudejp -t -c "SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = ''public'';"') do set TABLE_COUNT=%%i
echo [INFO] Database has %TABLE_COUNT% tables
echo.

REM Check Redis Connectivity
echo ================================================================================
echo                        Redis Health
echo ================================================================================
echo.

docker exec uns-claudejp-600-redis redis-cli ping >nul 2>&1
if errorlevel 1 (
    echo [FAIL] Redis connection failed
    set /a FAILED+=1
) else (
    echo [PASS] Redis is accessible
    set /a PASSED+=1
)
echo.

if "%CHECK_TYPE%"=="quick" goto :summary

REM Check API Endpoints
echo ================================================================================
echo                        API Health Endpoints
echo ================================================================================
echo.

REM Backend Health
curl -f http://localhost:8000/api/health -s >nul 2>&1
if errorlevel 1 (
    echo [FAIL] Backend API health endpoint failed
    set /a FAILED+=1
) else (
    echo [PASS] Backend API is healthy
    set /a PASSED+=1
)

REM API Docs
curl -f http://localhost:8000/api/docs -s >nul 2>&1
if errorlevel 1 (
    echo [FAIL] API documentation is not accessible
    set /a FAILED+=1
) else (
    echo [PASS] API documentation is accessible
    set /a PASSED+=1
)
echo.

REM Check Frontend
echo ================================================================================
echo                        Frontend Health
echo ================================================================================
echo.

curl -f http://localhost:3000 -s >nul 2>&1
if errorlevel 1 (
    echo [FAIL] Frontend is not accessible
    set /a FAILED+=1
) else (
    echo [PASS] Frontend is accessible
    set /a PASSED+=1
)
echo.

REM Check Ports
echo ================================================================================
echo                        Port Status
echo ================================================================================
echo.

netstat -an | findstr ":3000" | findstr "LISTENING" >nul 2>&1
if errorlevel 1 (
    echo [FAIL] Port 3000 (Frontend) is not listening
    set /a FAILED+=1
) else (
    echo [PASS] Port 3000 (Frontend) is listening
    set /a PASSED+=1
)

netstat -an | findstr ":8000" | findstr "LISTENING" >nul 2>&1
if errorlevel 1 (
    echo [FAIL] Port 8000 (Backend) is not listening
    set /a FAILED+=1
) else (
    echo [PASS] Port 8000 (Backend) is listening
    set /a PASSED+=1
)

netstat -an | findstr ":5432" | findstr "LISTENING" >nul 2>&1
if errorlevel 1 (
    echo [FAIL] Port 5432 (PostgreSQL) is not listening
    set /a FAILED+=1
) else (
    echo [PASS] Port 5432 (PostgreSQL) is listening
    set /a PASSED+=1
)

netstat -an | findstr ":6379" | findstr "LISTENING" >nul 2>&1
if errorlevel 1 (
    echo [FAIL] Port 6379 (Redis) is not listening
    set /a FAILED+=1
) else (
    echo [PASS] Port 6379 (Redis) is listening
    set /a PASSED+=1
)
echo.

REM Check Disk Space
echo ================================================================================
echo                        System Resources
echo ================================================================================
echo.

echo [INFO] Docker disk usage:
docker system df
echo.

:summary
echo ================================================================================
echo                        Health Check Summary
echo ================================================================================
echo.

set /a TOTAL=%PASSED%+%FAILED%
echo Total checks: %TOTAL%
echo Passed: %PASSED%
echo Failed: %FAILED%
echo.

if %FAILED% GTR 0 (
    echo [STATUS] UNHEALTHY - %FAILED% check(s) failed
    echo.
    echo Recommended actions:
    echo   1. Check Docker Desktop is running
    echo   2. Run START.bat to start services
    echo   3. Check logs with LOGS.bat
    echo   4. Review failed checks above
) else (
    echo [STATUS] HEALTHY - All checks passed!
    echo.
    echo System is ready for use:
    echo   Frontend: http://localhost:3000
    echo   Backend API: http://localhost:8000
    echo   API Docs: http://localhost:8000/api/docs
)

echo.
echo ================================================================================
echo                    Health check completed!
echo ================================================================================
echo.

if "%CHECK_TYPE%"=="full" (
    echo [TIP] For quick checks, run: CHECK_HEALTH.bat quick
)

echo.
pause >nul
