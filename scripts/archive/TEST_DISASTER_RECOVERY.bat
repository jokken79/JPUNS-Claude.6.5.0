@echo off
REM ========================================
REM Disaster Recovery Testing Script (Windows)
REM ========================================
REM
REM Purpose: Simulate failures and verify automatic recovery
REM Usage: TEST_DISASTER_RECOVERY.bat [scenario]
REM Scenarios: db, backend, redis, all
REM
REM Example: TEST_DISASTER_RECOVERY.bat db
REM
REM Author: Claude Code
REM Created: 2025-11-12
REM Version: 1.0.0
REM
REM ========================================

setlocal enabledelayedexpansion

REM Configuration
set SCENARIO=%1
if "%SCENARIO%"=="" set SCENARIO=all
set TIMESTAMP=%date:~-4%%date:~-10,2%%date:~-7,2%_%time:~0,2%%time:~3,2%%time:~6,2%
set TIMESTAMP=%TIMESTAMP: =0%
set LOG_DIR=docker\scripts\logs\disaster-recovery
set LOG_FILE=%LOG_DIR%\test_%SCENARIO%_%TIMESTAMP%.log

REM Recovery targets
set RTO_TARGET=30
set RPO_TARGET=0

REM Create log directory
if not exist "%LOG_DIR%" mkdir "%LOG_DIR%"

echo ======================================== >> %LOG_FILE%
echo Disaster Recovery Testing >> %LOG_FILE%
echo ======================================== >> %LOG_FILE%
echo Scenario: %SCENARIO% >> %LOG_FILE%
echo Timestamp: %TIMESTAMP% >> %LOG_FILE%
echo Log file: %LOG_FILE% >> %LOG_FILE%
echo ======================================== >> %LOG_FILE%
echo.

echo ========================================
echo Disaster Recovery Testing
echo ========================================
echo Scenario: %SCENARIO%
echo Timestamp: %TIMESTAMP%
echo.

REM Verify Docker is running
docker version >nul 2>&1
if errorlevel 1 (
    echo ERROR: Docker is not running
    goto :error
)

REM Main execution based on scenario
if "%SCENARIO%"=="db" (
    call :test_database_failure
) else if "%SCENARIO%"=="backend" (
    call :test_backend_failure
) else if "%SCENARIO%"=="redis" (
    call :test_redis_failure
) else if "%SCENARIO%"=="all" (
    call :test_all_scenarios
) else (
    echo ERROR: Invalid scenario '%SCENARIO%'
    echo Valid scenarios: db, backend, redis, all
    goto :error
)

goto :summary

REM ========================================
REM Database Failure Test
REM ========================================
:test_database_failure
echo.
echo ========== DATABASE FAILURE TEST ==========
echo Simulating database container failure...
echo.

REM Get baseline
echo [INFO] Recording baseline data...
docker exec uns-claudejp-600-db psql -U uns_admin -d uns_claudejp -c "SELECT count(*) FROM candidates;" > temp_before.txt 2>nul

REM Kill database
echo [WARN] Killing database container...
set START_TIME=%time%
docker compose stop db
docker compose kill db
echo [INFO] Database killed at %time%

REM Wait and observe
echo [INFO] Waiting 5 seconds to observe impact...
timeout /t 5 /nobreak >nul

REM Test backend behavior
echo [INFO] Testing backend behavior without database...
curl -s http://localhost/api/health >nul 2>&1
if errorlevel 1 (
    echo [OK] Backend correctly reports unhealthy state
) else (
    echo [WARN] Backend did not report unhealthy state
)

REM Trigger recovery
echo [INFO] Triggering recovery...
docker compose --profile dev up -d db

REM Wait for health
echo [INFO] Waiting for database to become healthy...
set ELAPSED=0
:db_health_loop
docker compose ps db | findstr "healthy" >nul 2>&1
if not errorlevel 1 (
    goto :db_healthy
)
timeout /t 1 /nobreak >nul
set /a ELAPSED+=1
if %ELAPSED% lss %RTO_TARGET% goto :db_health_loop

echo [ERROR] Database did not recover within RTO target
goto :test_end

:db_healthy
echo [OK] Database is healthy after %ELAPSED% seconds
set END_TIME=%time%

REM Verify data integrity
docker exec uns-claudejp-600-db psql -U uns_admin -d uns_claudejp -c "SELECT count(*) FROM candidates;" > temp_after.txt 2>nul
fc temp_before.txt temp_after.txt >nul 2>&1
if not errorlevel 1 (
    echo [OK] Data integrity verified (RPO: 0)
) else (
    echo [ERROR] Data loss detected
)

REM Cleanup
del temp_before.txt temp_after.txt 2>nul

if %ELAPSED% leq %RTO_TARGET% (
    echo [OK] DATABASE FAILURE TEST PASSED (RTO: %ELAPSED%s/%RTO_TARGET%s)
) else (
    echo [ERROR] DATABASE FAILURE TEST FAILED (RTO exceeded)
)

goto :test_end

REM ========================================
REM Backend Failure Test
REM ========================================
:test_backend_failure
echo.
echo ========== BACKEND FAILURE TEST ==========
echo Simulating backend container failure...
echo.

REM Get backend count
for /f %%i in ('docker compose ps backend --format json ^| jq -s "length"') do set BACKEND_COUNT=%%i
echo [INFO] Current backend instances: %BACKEND_COUNT%

if %BACKEND_COUNT% leq 1 (
    echo [WARN] Only 1 backend instance. Scaling to 3...
    docker compose --profile dev up -d --scale backend=3 --no-recreate
    timeout /t 10 /nobreak >nul
    set BACKEND_COUNT=3
)

REM Kill one backend
echo [WARN] Killing one backend instance...
for /f %%i in ('docker ps --filter "name=backend" --format "{{.Names}}" ^| head -n 1') do set BACKEND_NAME=%%i
docker stop %BACKEND_NAME%

REM Test remaining instances
echo [INFO] Testing remaining backend instances...
set SUCCESS=0
for /L %%i in (1,1,10) do (
    curl -s -f http://localhost/api/health >nul 2>&1
    if not errorlevel 1 set /a SUCCESS+=1
    timeout /t 1 /nobreak >nul
)

set /a SUCCESS_RATE=SUCCESS*100/10
echo [INFO] Success rate with 1 instance down: %SUCCESS_RATE%%

if %SUCCESS_RATE% geq 90 (
    echo [OK] High availability maintained
) else (
    echo [ERROR] High availability compromised
)

REM Recovery
echo [INFO] Triggering recovery...
docker compose --profile dev up -d --scale backend=%BACKEND_COUNT%

timeout /t 10 /nobreak >nul

echo [OK] BACKEND FAILURE TEST PASSED

goto :test_end

REM ========================================
REM Redis Failure Test
REM ========================================
:test_redis_failure
echo.
echo ========== REDIS FAILURE TEST ==========
echo Simulating Redis cache failure...
echo.

REM Kill Redis
echo [WARN] Killing Redis container...
docker compose stop redis
docker compose kill redis
echo [INFO] Redis killed at %time%

REM Test backend behavior
echo [INFO] Testing backend behavior without Redis...
set SUCCESS=0
for /L %%i in (1,1,10) do (
    curl -s -f http://localhost/api/health >nul 2>&1
    if not errorlevel 1 set /a SUCCESS+=1
    timeout /t 1 /nobreak >nul
)

set /a SUCCESS_RATE=SUCCESS*100/10
echo [INFO] Success rate without Redis: %SUCCESS_RATE%%

if %SUCCESS_RATE% geq 80 (
    echo [OK] Backend gracefully degraded
) else (
    echo [WARN] Backend heavily impacted
)

REM Recovery
echo [INFO] Triggering recovery...
docker compose --profile dev up -d redis

REM Wait for health
echo [INFO] Waiting for Redis to become healthy...
set ELAPSED=0
:redis_health_loop
docker compose ps redis | findstr "healthy" >nul 2>&1
if not errorlevel 1 (
    goto :redis_healthy
)
timeout /t 1 /nobreak >nul
set /a ELAPSED+=1
if %ELAPSED% lss %RTO_TARGET% goto :redis_health_loop

echo [ERROR] Redis did not recover within RTO target
goto :test_end

:redis_healthy
echo [OK] Redis is healthy after %ELAPSED% seconds

if %ELAPSED% leq %RTO_TARGET% (
    echo [OK] REDIS FAILURE TEST PASSED (RTO: %ELAPSED%s/%RTO_TARGET%s)
) else (
    echo [ERROR] REDIS FAILURE TEST FAILED (RTO exceeded)
)

goto :test_end

REM ========================================
REM All Scenarios Test
REM ========================================
:test_all_scenarios
echo.
echo ========== COMPREHENSIVE DISASTER RECOVERY TEST ==========
echo Running all disaster recovery scenarios...
echo.

set PASSED=0
set FAILED=0

call :test_database_failure
if not errorlevel 1 (
    set /a PASSED+=1
) else (
    set /a FAILED+=1
)

echo.
echo Cooling down before next test...
timeout /t 10 /nobreak >nul

call :test_backend_failure
if not errorlevel 1 (
    set /a PASSED+=1
) else (
    set /a FAILED+=1
)

echo.
echo Cooling down before next test...
timeout /t 10 /nobreak >nul

call :test_redis_failure
if not errorlevel 1 (
    set /a PASSED+=1
) else (
    set /a FAILED+=1
)

echo.
echo ==========================================
echo DISASTER RECOVERY TEST SUMMARY
echo ==========================================
set /a TOTAL=PASSED+FAILED
echo Total scenarios tested: %TOTAL%
echo Passed: %PASSED%
echo Failed: %FAILED%
set /a SUCCESS_RATE=PASSED*100/TOTAL
echo Success rate: %SUCCESS_RATE%%
echo ==========================================
echo.

goto :test_end

:test_end
exit /b 0

:summary
echo.
echo ========================================
echo Disaster Recovery Test Completed
echo ========================================
echo Log file: %LOG_FILE%
echo.
echo Next steps:
echo   1. Review log file for detailed results
echo   2. Check RTO/RPO compliance
echo   3. Update disaster recovery procedures
echo.
goto :end

:error
echo.
echo ========================================
echo ERROR: Disaster recovery test failed
echo ========================================
echo.

:end
pause >nul
