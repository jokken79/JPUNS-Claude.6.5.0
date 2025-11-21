@echo off
chcp 65001 >nul
setlocal EnableDelayedExpansion

title UNS-ClaudeJP 5.4 - Ver Logs

echo.
echo ========================================================
echo       UNS-CLAUDEJP 5.2 - VER LOGS
echo ========================================================
echo.

REM Cambiar al directorio raiz del proyecto
cd /d "%~dp0\.."

echo Verificando Docker Desktop...
docker ps >nul 2>&1
if %errorlevel% neq 0 (
    echo     [ERROR] ERROR: Docker Desktop no esta corriendo.
    echo        SOLUCION: Inicia Docker Desktop con START.bat primero.
    echo.
    pause
    exit /b 1
)
echo     [OK] Docker Desktop esta corriendo.
echo.

set "DOCKER_COMPOSE_CMD="
docker compose version >nul 2>&1
if %errorlevel% EQU 0 (
    set "DOCKER_COMPOSE_CMD=docker compose"
) else (
    docker-compose version >nul 2>&1
    if %errorlevel% EQU 0 (
        set "DOCKER_COMPOSE_CMD=docker-compose"
    ) else (
        echo     [ERROR] ERROR: Docker Compose no encontrado.
        pause
        exit /b 1
    )
)
echo.

echo ========================================================
echo Selecciona cual servicio deseas monitorear:
echo ========================================================
echo.
echo   1 - Database (PostgreSQL)
echo   2 - Backend (FastAPI)
echo   3 - Frontend (Next.js)
echo   4 - Importer
echo   5 - Adminer
echo   6 - Todos los servicios
echo   7 - Salir
echo.
echo ========================================================
echo.

choice /C 1234567 /M "Opcion: "

if errorlevel 7 goto :end
if errorlevel 6 (
    echo.
    echo Mostrando logs de TODOS los servicios...
    echo Presiona Ctrl+C para salir
    echo.
    %DOCKER_COMPOSE_CMD% logs -f
    goto :end
)
if errorlevel 5 (
    echo.
    echo Mostrando logs de Adminer...
    echo Presiona Ctrl+C para salir
    echo.
    docker logs -f uns-claudejp-600-adminer
    goto :end
)
if errorlevel 4 (
    echo.
    echo Mostrando logs de Importer...
    echo Presiona Ctrl+C para salir
    echo.
    docker logs -f uns-claudejp-600-importer
    goto :end
)
if errorlevel 3 (
    echo.
    echo Mostrando logs de Frontend (Next.js)...
    echo Presiona Ctrl+C para salir
    echo.
    docker logs -f uns-claudejp-600-frontend
    goto :end
)
if errorlevel 2 (
    echo.
    echo Mostrando logs de Backend (FastAPI)...
    echo Presiona Ctrl+C para salir
    echo.
    docker logs -f uns-claudejp-600-backend-1
    goto :end
)
if errorlevel 1 (
    echo.
    echo Mostrando logs de Database (PostgreSQL)...
    echo Presiona Ctrl+C para salir
    echo.
    docker logs -f uns-claudejp-600-db
    goto :end
)

:end
echo.
pause >nul
