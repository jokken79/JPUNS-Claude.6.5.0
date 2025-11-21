@echo off
setlocal enabledelayedexpansion

REM ============================================================
REM UNS-ClaudeJP 5.0 - System Verification Script
REM Verifies that all components are working correctly
REM ============================================================

echo.
echo ============================================================
echo    UNS-ClaudeJP 5.0 - System Verification
echo ============================================================
echo.

REM Color codes
setlocal enabledelayedexpansion

set "count=0"
set "failed=0"

REM ============================================================
REM Check 1: Docker Installation
REM ============================================================
echo [1/10] Checking Docker installation...
docker --version >nul 2>&1
if !errorlevel! equ 0 (
    echo      [✓] Docker is installed
    set /a count+=1
) else (
    echo      [✗] Docker not found. Install Docker Desktop.
    set /a failed+=1
)
echo.

REM ============================================================
REM Check 2: Docker Daemon Running
REM ============================================================
echo [2/10] Checking Docker daemon...
docker ps >nul 2>&1
if !errorlevel! equ 0 (
    echo      [✓] Docker daemon is running
    set /a count+=1
) else (
    echo      [✗] Docker daemon not running. Start Docker Desktop.
    set /a failed+=1
)
echo.

REM ============================================================
REM Check 3: Required Files
REM ============================================================
echo [3/10] Checking project files...
if exist ".env" (
    echo      [✓] .env file exists
    set /a count+=1
) else (
    echo      [✗] .env file not found
    set /a failed+=1
)

if exist "docker-compose.yml" (
    echo      [✓] docker-compose.yml exists
    set /a count+=1
) else (
    echo      [✗] docker-compose.yml not found
    set /a failed+=1
)

if exist "config\factories\backup" (
    echo      [✓] Factory backup directory exists
    set /a count+=1
) else (
    echo      [✗] Factory backup directory not found
    set /a failed+=1
)
echo.

REM ============================================================
REM Check 4: Docker Containers Status
REM ============================================================
echo [4/10] Checking Docker containers...
docker ps --format "table {{.Names}}\t{{.Status}}" | findstr "uns-claudejp" >nul
if !errorlevel! equ 0 (
    echo      [✓] Containers are running:
    docker ps --filter "name=uns-claudejp" --format "        {{.Names}}: {{.Status}}"
    set /a count+=1
) else (
    echo      [!] Containers not running yet (normal on first startup)
    echo      Run: scripts\START.bat
)
echo.

REM ============================================================
REM Check 5: Backend API Health
REM ============================================================
echo [5/10] Checking Backend API health...
curl -s http://localhost:8000/api/health >nul 2>&1
if !errorlevel! equ 0 (
    echo      [✓] Backend API is responding
    set /a count+=1
) else (
    echo      [!] Backend API not responding (normal if just started)
)
echo.

REM ============================================================
REM Check 6: Frontend Access
REM ============================================================
echo [6/10] Checking Frontend...
curl -s http://localhost:3000 >nul 2>&1
if !errorlevel! equ 0 (
    echo      [✓] Frontend is accessible
    set /a count+=1
) else (
    echo      [!] Frontend not responding (normal if building)
)
echo.

REM ============================================================
REM Check 7: Database Connection
REM ============================================================
echo [7/10] Checking Database...
docker exec uns-claudejp-600-db psql -U uns_admin -d uns_claudejp -c "\dt" >nul 2>&1
if !errorlevel! equ 0 (
    echo      [✓] Database is accessible

    REM Count candidates
    for /f "tokens=*" %%A in ('docker exec uns-claudejp-600-db psql -U uns_admin -d uns_claudejp -t -c "SELECT COUNT(*) FROM candidates;"') do set "candidate_count=%%A"

    echo      [✓] Total candidates in database: !candidate_count!

    if "!candidate_count!" == "0" (
        echo      [!] Warning: No candidates imported yet
        echo         This is normal if still importing - check logs with: docker logs uns-claudejp-600-importer
    )
    set /a count+=1
) else (
    echo      [!] Database not accessible (normal if just started)
)
echo.

REM ============================================================
REM Check 8: Excel File Status
REM ============================================================
echo [8/10] Checking Excel file (optional)...
if exist "config\employee_master.xlsm" (
    echo      [✓] Excel file found - Real candidates will import
    set /a count+=1
) else (
    echo      [!] Excel file not found - Demo candidates will be used
    echo         Place config/employee_master.xlsm if you want real data
)
echo.

REM ============================================================
REM Check 9: Import Script Status
REM ============================================================
echo [9/10] Checking import script logs...
docker logs uns-claudejp-600-importer 2>nul | findstr "Importación completada" >nul
if !errorlevel! equ 0 (
    echo      [✓] Data import appears to have completed
    set /a count+=1
) else (
    echo      [!] Checking if import is still in progress...
    docker logs uns-claudejp-600-importer 2>nul | findstr "Procesados" >nul
    if !errorlevel! equ 0 (
        echo      [~] Import in progress - please wait
    ) else (
        echo      [!] Import not yet started or not visible
    )
)
echo.

REM ============================================================
REM Check 10: Factory Data
REM ============================================================
echo [10/10] Checking Factory data...
docker exec uns-claudejp-600-db psql -U uns_admin -d uns_claudejp -t -c "SELECT COUNT(*) FROM factories;" >nul 2>&1
if !errorlevel! equ 0 (
    for /f "tokens=*" %%A in ('docker exec uns-claudejp-600-db psql -U uns_admin -d uns_claudejp -t -c "SELECT COUNT(*) FROM factories;"') do set "factory_count=%%A"

    if "!factory_count!" == "0" (
        echo      [!] No factories imported yet
    ) else (
        echo      [✓] Factories imported: !factory_count!
    )
    set /a count+=1
) else (
    echo      [!] Could not check factories
)
echo.

REM ============================================================
REM Summary
REM ============================================================
echo ============================================================
echo    VERIFICATION SUMMARY
echo ============================================================
echo.
echo    Checks passed: !count!/10
echo    Issues found:  !failed!
echo.

if !failed! equ 0 (
    echo    STATUS: All checks passed ✓
    echo.
    echo    Next steps:
    echo    1. Open http://localhost:3000 in your browser
    echo    2. Login with: admin / admin123
    echo    3. Navigate to Candidatos to see imported data
    echo.
) else (
    echo    STATUS: Some issues found
    echo.
    echo    Recommended actions:
    echo    1. Start Docker Desktop if not running
    echo    2. Run: scripts\START.bat
    echo    3. Wait 2-3 minutes for all services to start
    echo    4. Run this script again
    echo.
    echo    For detailed help, see: VERIFICATION_GUIDE.md
)

echo ============================================================
echo.

REM Offer to show full logs
set /p show_logs="Show Docker logs? (y/n): "
if "!show_logs!"=="y" (
    echo.
    echo Importer logs (data import):
    docker logs uns-claudejp-600-importer
    echo.
    echo Backend logs (API):
    docker logs uns-claudejp-600-backend-1 | tail -20
)
