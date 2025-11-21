@echo off
REM ==============================================================================
REM RUN_TESTS.bat - Run all tests (backend + frontend)
REM ==============================================================================
REM Description:
REM   Runs pytest tests for backend and Playwright E2E tests for frontend
REM
REM Usage:
REM   RUN_TESTS.bat                 - Run all tests
REM   RUN_TESTS.bat backend         - Run only backend tests
REM   RUN_TESTS.bat frontend        - Run only frontend tests
REM   RUN_TESTS.bat e2e             - Run only E2E tests
REM ==============================================================================

echo.
echo ================================================================================
echo                        UNS-ClaudeJP Test Runner
echo ================================================================================
echo.

REM Parse command line arguments
set TEST_TYPE=%1
if "%TEST_TYPE%"=="" set TEST_TYPE=all

REM Check if Docker is running
docker ps >nul 2>&1
if errorlevel 1 (
    echo [ERROR] Docker is not running. Please start Docker Desktop first.
    goto :error
)

REM Check if services are running
docker ps | findstr "uns-claudejp-600-backend-1" >nul 2>&1
if errorlevel 1 (
    echo [ERROR] Backend service is not running.
    echo Please run START.bat first to start all services.
    goto :error
)

echo [INFO] Running tests: %TEST_TYPE%
echo.

REM Run backend tests
if "%TEST_TYPE%"=="all" goto :run_backend
if "%TEST_TYPE%"=="backend" goto :run_backend
goto :check_frontend

:run_backend
echo ================================================================================
echo                        Backend Tests (pytest)
echo ================================================================================
echo.

docker exec uns-claudejp-600-backend-1 bash -c "cd /app && pytest backend/tests/ -v --tb=short"
if errorlevel 1 (
    echo.
    echo [WARNING] Some backend tests failed!
    set BACKEND_FAILED=1
) else (
    echo.
    echo [SUCCESS] All backend tests passed!
    set BACKEND_FAILED=0
)
echo.

:check_frontend
if "%TEST_TYPE%"=="backend" goto :summary

REM Run frontend unit tests
if "%TEST_TYPE%"=="all" goto :run_frontend_unit
if "%TEST_TYPE%"=="frontend" goto :run_frontend_unit
goto :check_e2e

:run_frontend_unit
echo ================================================================================
echo                        Frontend Unit Tests (Vitest)
echo ================================================================================
echo.

docker exec uns-claudejp-600-frontend bash -c "cd /app && npm test"
if errorlevel 1 (
    echo.
    echo [WARNING] Some frontend unit tests failed!
    set FRONTEND_FAILED=1
) else (
    echo.
    echo [SUCCESS] All frontend unit tests passed!
    set FRONTEND_FAILED=0
)
echo.

:check_e2e
if "%TEST_TYPE%"=="frontend" goto :summary

REM Run E2E tests
if "%TEST_TYPE%"=="all" goto :run_e2e
if "%TEST_TYPE%"=="e2e" goto :run_e2e
goto :summary

:run_e2e
echo ================================================================================
echo                        E2E Tests (Playwright)
echo ================================================================================
echo.
echo [INFO] Make sure frontend is running at http://localhost:3000
echo.

docker exec uns-claudejp-600-frontend bash -c "cd /app && npm run test:e2e"
if errorlevel 1 (
    echo.
    echo [WARNING] Some E2E tests failed!
    set E2E_FAILED=1
) else (
    echo.
    echo [SUCCESS] All E2E tests passed!
    set E2E_FAILED=0
)
echo.

:summary
echo ================================================================================
echo                        Test Summary
echo ================================================================================
echo.

if "%TEST_TYPE%"=="all" (
    if "%BACKEND_FAILED%"=="0" (
        echo [PASS] Backend Tests
    ) else (
        echo [FAIL] Backend Tests
    )
    if "%FRONTEND_FAILED%"=="0" (
        echo [PASS] Frontend Unit Tests
    ) else (
        echo [FAIL] Frontend Unit Tests
    )
    if "%E2E_FAILED%"=="0" (
        echo [PASS] E2E Tests
    ) else (
        echo [FAIL] E2E Tests
    )
)

if "%TEST_TYPE%"=="backend" (
    if "%BACKEND_FAILED%"=="0" (
        echo [PASS] Backend Tests
    ) else (
        echo [FAIL] Backend Tests
    )
)

if "%TEST_TYPE%"=="frontend" (
    if "%FRONTEND_FAILED%"=="0" (
        echo [PASS] Frontend Unit Tests
    ) else (
        echo [FAIL] Frontend Unit Tests
    )
)

if "%TEST_TYPE%"=="e2e" (
    if "%E2E_FAILED%"=="0" (
        echo [PASS] E2E Tests
    ) else (
        echo [FAIL] E2E Tests
    )
)

echo.
echo ================================================================================
echo                        Test run completed!
echo ================================================================================
echo.
echo [TIP] To view detailed test reports:
echo   - Backend: Check pytest output above
echo   - Frontend: Check Vitest output above
echo   - E2E: Run 'npx playwright show-report' in frontend directory
echo.
pause >nul
exit /b 0

:error
echo.
echo [ERROR] Test run failed!
echo.
pause >nul
