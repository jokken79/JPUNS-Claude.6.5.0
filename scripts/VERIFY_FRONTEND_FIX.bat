@echo off
REM ========================================
REM Verify Frontend Node Modules Fix
REM ========================================
REM This script verifies that the frontend
REM container has all dependencies installed
REM ========================================

echo.
echo ========================================
echo Frontend Fix Verification
echo ========================================
echo.

REM Check if Docker is running
docker ps >nul 2>&1
if errorlevel 1 (
    echo ERROR: Docker is not running
    echo Please start Docker Desktop and try again
    pause >nul
    exit /b 1
)

echo [1/6] Checking if frontend container is running...
docker compose ps frontend | findstr "running" >nul
if errorlevel 1 (
    echo FAILED: Frontend container is not running
    echo Run: docker compose up -d
    goto :failed
) else (
    echo PASSED: Frontend container is running
)

echo.
echo [2/6] Checking if node_modules directory exists...
docker exec uns-claudejp-600-frontend ls /app/node_modules >nul 2>&1
if errorlevel 1 (
    echo FAILED: node_modules directory not found
    goto :failed
) else (
    echo PASSED: node_modules directory exists
)

echo.
echo [3/6] Checking node_modules file count...
docker exec uns-claudejp-600-frontend sh -c "ls /app/node_modules | wc -l" > temp_count.txt
set /p MODULE_COUNT=<temp_count.txt
del temp_count.txt
echo Found %MODULE_COUNT% items in node_modules
if %MODULE_COUNT% LSS 50 (
    echo WARNING: Expected more than 50 modules, found %MODULE_COUNT%
    echo Dependencies might not be fully installed
    goto :failed
) else (
    echo PASSED: Sufficient modules installed
)

echo.
echo [4/6] Checking for critical dependencies...
docker exec uns-claudejp-600-frontend ls /app/node_modules/next >nul 2>&1
if errorlevel 1 (
    echo FAILED: Next.js not found in node_modules
    goto :failed
) else (
    echo PASSED: Next.js is installed
)

docker exec uns-claudejp-600-frontend ls /app/node_modules/react >nul 2>&1
if errorlevel 1 (
    echo FAILED: React not found in node_modules
    goto :failed
) else (
    echo PASSED: React is installed
)

echo.
echo [5/6] Checking named volumes...
docker volume inspect uns_claudejp_600_frontend_node_modules >nul 2>&1
if errorlevel 1 (
    echo FAILED: Named volume for node_modules not found
    goto :failed
) else (
    echo PASSED: Named volume exists
)

echo.
echo [6/6] Checking frontend logs for errors...
docker compose logs frontend --tail=50 | findstr /I "error cannot module" >nul
if not errorlevel 1 (
    echo WARNING: Errors found in frontend logs
    echo Check logs with: docker compose logs frontend
) else (
    echo PASSED: No module errors in recent logs
)

echo.
echo ========================================
echo Verification Complete - ALL TESTS PASSED
echo ========================================
echo.
echo Frontend is configured correctly!
echo.
echo Access your application at:
echo   http://localhost:3000
echo.
echo To view live logs:
echo   docker compose logs -f frontend
echo.
goto :end

:failed
echo.
echo ========================================
echo Verification Failed
echo ========================================
echo.
echo Some checks failed. Please run the fix:
echo   scripts\FIX_FRONTEND_MODULES.bat
echo.
echo For detailed troubleshooting, see:
echo   FRONTEND_DOCKER_FIX.md
echo.
echo View frontend logs:
echo   docker compose logs -f frontend
echo.

:end
pause >nul
