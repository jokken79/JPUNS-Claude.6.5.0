@echo off
setlocal EnableDelayedExpansion

title UNS-ClaudeJP 5.2 - Limpiar Todo

echo.
echo ========================================================
echo       UNS-CLAUDEJP 5.2 - LIMPIAR TODO
echo ========================================================
echo.
echo ADVERTENCIA: Esta operacion borrara TODOS los datos!
echo.
echo Se eliminara:
echo   - Base de datos PostgreSQL
echo   - Todos los contenedores Docker
echo   - Todos los volumenes
echo.

choice /C SN /M "Deseas continuar? (S=Si, N=No)"
if errorlevel 2 goto :end
if errorlevel 1 goto :continue

:continue
echo.
echo Iniciando limpieza...
echo.

REM Cambiar al directorio raiz del proyecto
cd /d "%~dp0\.."

set "DOCKER_COMPOSE_CMD="
docker compose version >nul 2>&1
if %errorlevel% EQU 0 (
    set "DOCKER_COMPOSE_CMD=docker compose"
) else (
    docker-compose version >nul 2>&1
    if %errorlevel% EQU 0 (
        set "DOCKER_COMPOSE_CMD=docker-compose"
    ) else (
        echo ERROR: Docker Compose no encontrado
        pause
        exit /b 1
    )
)

echo [1/3] Deteniendo contenedores...
%DOCKER_COMPOSE_CMD% down -v
if %errorlevel% NEQ 0 (
    echo ADVERTENCIA: Algunos contenedores no se detuvieron
)
echo OK
echo.

echo [2/3] Eliminando volumenes...
docker volume rm uns-claudejp_postgres_data 2>nul
echo OK
echo.

echo [3/3] Limpieza completada!
echo.
echo Proximos pasos:
echo   1. Asegurate que .env existe
echo   2. Ejecuta START.bat
echo.

:end
echo.
pause
