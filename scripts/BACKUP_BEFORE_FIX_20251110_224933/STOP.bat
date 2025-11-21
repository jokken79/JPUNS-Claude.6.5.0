@echo off
chcp 65001 >nul
setlocal EnableDelayedExpansion

title UNS-ClaudeJP 5.4 - Detener Sistema

echo.
echo ========================================================
echo       UNS-CLAUDEJP 5.2 - DETENER SISTEMA
echo ========================================================
echo.

REM Cambiar al directorio raiz del proyecto
cd /d "%~dp0\.."

echo [1/3] Verificando Docker Desktop...
docker ps >nul 2>&1
if %errorlevel% neq 0 (
    echo     [AVISO] Docker Desktop no esta corriendo.
    echo     [i] No hay servicios activos para detener.
    echo.
    goto :end
)
echo     [OK] Docker Desktop esta corriendo.
echo.

echo [2/3] Verificando Docker Compose...
set "DOCKER_COMPOSE_CMD="
docker compose version >nul 2>&1
if %errorlevel% EQU 0 (
    set "DOCKER_COMPOSE_CMD=docker compose"
    echo     [OK] Docker Compose V2 detectado.
) else (
    docker-compose version >nul 2>&1
    if %errorlevel% EQU 0 (
        set "DOCKER_COMPOSE_CMD=docker-compose"
        echo     [OK] Docker Compose V1 detectado.
    ) else (
        echo     [ERROR] ERROR: Docker Compose no encontrado.
        echo        SOLUCION: Asegurate que Docker Desktop este actualizado.
        pause
        exit /b 1
    )
)
echo.

echo [3/3] Deteniendo todos los servicios...
%DOCKER_COMPOSE_CMD% --profile dev down

if %errorlevel% EQU 0 (
    echo.
    echo ========================================================
    echo     [OK] TODOS LOS SERVICIOS DETENIDOS CORRECTAMENTE
    echo ========================================================
) else (
    echo.
    echo ========================================================
    echo     [ERROR] ERROR AL DETENER LOS SERVICIOS
    echo ========================================================
    echo.
    echo Intentando verificar estado actual...
)
echo.

echo Estado final de contenedores:
%DOCKER_COMPOSE_CMD% --profile dev ps
echo.

:end
echo Presiona cualquier tecla para salir...
pause >nul
