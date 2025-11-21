@echo off
chcp 65001 >nul
setlocal EnableDelayedExpansion

echo ========================================
echo TEST SCRIPT - PASO 4/7 AISLADO
echo ========================================
echo.

REM Detectar Docker Compose
set "DOCKER_COMPOSE_CMD="
docker compose version >nul 2>&1
if %errorlevel% EQU 0 (
    set "DOCKER_COMPOSE_CMD=docker compose"
    echo [OK] Docker Compose detectado: V2
) else (
    echo [ERROR] Docker Compose no encontrado
    pause
    exit /b 1
)

echo.
echo ========================================
echo EJECUTANDO DOCKER BUILD
echo ========================================
echo.

set "DOCKER_BUILDKIT=1"
echo [DEBUG] Antes de docker build
%DOCKER_COMPOSE_CMD% build --no-cache
echo [DEBUG] Despues de docker build
echo [DEBUG] ErrorLevel capturado: !errorlevel!
echo.

if !errorlevel! neq 0 (
    echo [DEBUG] DENTRO DEL IF - ERRORLEVEL NO ES CERO
    echo.
    echo ========================================
    echo [ERROR] DOCKER BUILD FALLO
    echo ========================================
    echo.
    echo Posibles causas:
    echo   - Docker Desktop sin recursos
    echo   - Problemas de red
    echo   - Archivos Dockerfile corruptos
    echo.
    pause
    exit /b 1
) else (
    echo [DEBUG] DENTRO DEL ELSE - ERRORLEVEL ES CERO
    echo.
    echo ========================================
    echo [OK] DOCKER BUILD EXITOSO
    echo ========================================
)

echo.
echo ========================================
echo TEST COMPLETADO
echo ========================================
echo.
pause
