@echo off
REM ========================================
REM Docker Image Security Scanning with Trivy (Windows)
REM ========================================
REM
REM Purpose: Scan Docker images for vulnerabilities using Trivy
REM Usage: SECURITY_SCAN.bat [image_name]
REM
REM Example: SECURITY_SCAN.bat backend
REM          SECURITY_SCAN.bat all
REM
REM Author: Claude Code
REM Created: 2025-11-12
REM Version: 1.0.0
REM
REM ========================================

setlocal enabledelayedexpansion

REM Configuration
set IMAGE_NAME=%1
if "%IMAGE_NAME%"=="" set IMAGE_NAME=all
set SEVERITY=CRITICAL,HIGH,MEDIUM
set TIMESTAMP=%date:~-4%%date:~-10,2%%date:~-7,2%_%time:~0,2%%time:~3,2%%time:~6,2%
set TIMESTAMP=%TIMESTAMP: =0%
set REPORT_DIR=docker\scripts\logs\security-scans
set REPORT_FILE=%REPORT_DIR%\scan_%IMAGE_NAME%_%TIMESTAMP%.txt

REM Create report directory
if not exist "%REPORT_DIR%" mkdir "%REPORT_DIR%"

echo ======================================== >> %REPORT_FILE%
echo Docker Image Security Scan >> %REPORT_FILE%
echo ======================================== >> %REPORT_FILE%
echo Image: %IMAGE_NAME% >> %REPORT_FILE%
echo Severity: %SEVERITY% >> %REPORT_FILE%
echo Timestamp: %TIMESTAMP% >> %REPORT_FILE%
echo. >> %REPORT_FILE%

echo ========================================
echo Docker Image Security Scan
echo ========================================
echo Image: %IMAGE_NAME%
echo Severity: %SEVERITY%
echo Timestamp: %TIMESTAMP%
echo.

REM Check if Docker is running
docker version >nul 2>&1
if errorlevel 1 (
    echo ERROR: Docker is not running
    goto :error
)

if "%IMAGE_NAME%"=="all" (
    call :scan_all
) else (
    call :scan_image %IMAGE_NAME%
)

goto :summary

REM ========================================
REM Scan single image
REM ========================================
:scan_image
set IMG=%1
set FULL_IMAGE=uns-claudejp-%IMG%:latest

echo [Scanning] %FULL_IMAGE%...
echo [Scanning] %FULL_IMAGE%... >> %REPORT_FILE%

REM Check if image exists
docker images | findstr "uns-claudejp-%IMG%" >nul 2>&1
if errorlevel 1 (
    echo [ERROR] Image %FULL_IMAGE% not found. Build it first.
    echo [ERROR] Image %FULL_IMAGE% not found >> %REPORT_FILE%
    goto :error
)

REM Run Trivy scan - HTML report
echo Running Trivy scan (HTML)...
docker run --rm -v /var/run/docker.sock:/var/run/docker.sock ^
    -v %cd%\%REPORT_DIR%:/reports ^
    aquasec/trivy:latest image ^
    --severity %SEVERITY% ^
    --format template ^
    --template "@contrib/html.tpl" ^
    --output /reports/scan_%IMG%_%TIMESTAMP%.html ^
    %FULL_IMAGE%

REM Run Trivy scan - JSON report
echo Running Trivy scan (JSON)...
docker run --rm -v /var/run/docker.sock:/var/run/docker.sock ^
    -v %cd%\%REPORT_DIR%:/reports ^
    aquasec/trivy:latest image ^
    --severity %SEVERITY% ^
    --format json ^
    --output /reports/scan_%IMG%_%TIMESTAMP%.json ^
    %FULL_IMAGE%

REM Run Trivy scan - Console output
echo Running Trivy scan (Console)...
docker run --rm -v /var/run/docker.sock:/var/run/docker.sock ^
    aquasec/trivy:latest image ^
    --severity %SEVERITY% ^
    %FULL_IMAGE% >> %REPORT_FILE% 2>&1

echo.
echo ========================================
echo Scan Summary for %IMG%:
echo ========================================
echo See detailed reports in:
echo   - HTML: %REPORT_DIR%\scan_%IMG%_%TIMESTAMP%.html
echo   - JSON: %REPORT_DIR%\scan_%IMG%_%TIMESTAMP%.json
echo   - Text: %REPORT_FILE%
echo ========================================
echo.

echo [OK] Scan completed for %IMG%
exit /b 0

REM ========================================
REM Scan all images
REM ========================================
:scan_all
echo [Scanning] All UNS-ClaudeJP images...
echo.

set IMAGES=backend frontend
set FAILED=0

for %%I in (%IMAGES%) do (
    echo ========================================
    echo Scanning: %%I
    echo ========================================
    echo.

    call :scan_image %%I
    if errorlevel 1 (
        echo [FAIL] %%I scan failed
        set /a FAILED+=1
    ) else (
        echo [OK] %%I scan completed
    )
    echo.
)

echo ========================================
echo Overall Scan Summary
echo ========================================
echo Images scanned: 2
if %FAILED%==0 (
    echo Images passed: 2
    echo Images failed: 0
    echo [SUCCESS] All images passed security scan!
) else (
    echo Images passed: 1
    echo Images failed: %FAILED%
    echo [WARNING] Some images have vulnerabilities
)
echo ========================================
echo.

exit /b %FAILED%

:summary
echo.
echo ========================================
echo Security scan completed!
echo ========================================
echo.
echo Reports saved to: %REPORT_DIR%
echo.
echo Next steps:
echo   1. Review HTML report in browser
echo   2. Update base images if needed
echo   3. Update dependencies to patch vulnerabilities
echo   4. Re-scan after fixes
echo.
goto :end

:error
echo.
echo ========================================
echo ERROR: Security scan failed
echo ========================================
echo.

:end
pause >nul
