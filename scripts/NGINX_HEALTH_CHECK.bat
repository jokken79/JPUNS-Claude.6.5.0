@echo off
REM Nginx Health Check and Auto-Reload Script (Windows)
REM Monitors nginx-backend connectivity and reloads on DNS cache issues

setlocal EnableDelayedExpansion

set CONTAINER_NAME=uns-claudejp-600-nginx
set MAX_RETRIES=3
set RETRY_DELAY=2
set retries=0

echo === Nginx Health Check ===
echo Container: %CONTAINER_NAME%
echo Checking backend connectivity...

:check_loop
REM Check backend from nginx container
docker exec %CONTAINER_NAME% wget -q -O- http://backend:8000/api/health >nul 2>&1
if errorlevel 1 (
    echo [X] Backend unreachable from nginx attempt %retries%/%MAX_RETRIES%
    call :reload_nginx
    goto increment_retry
)

echo [OK] Backend is reachable from nginx

REM Check from host via nginx proxy
curl -s -f http://localhost/api/health >nul 2>&1
if errorlevel 1 (
    echo [X] Nginx proxy failed, reloading...
    call :reload_nginx
    goto increment_retry
)

echo [OK] Nginx proxy is working correctly
echo.
echo === Health Check PASSED ===
pause >nul
exit /b 0

:increment_retry
set /a retries+=1
if %retries% lss %MAX_RETRIES% (
    timeout /t %RETRY_DELAY% /nobreak >nul
    goto check_loop
)

echo.
echo [X] Health check failed after %MAX_RETRIES% attempts
echo === Health Check FAILED ===
pause >nul
exit /b 1

:reload_nginx
echo Reloading nginx to refresh DNS cache...
docker exec %CONTAINER_NAME% nginx -s reload
timeout /t 2 /nobreak >nul
goto :eof
