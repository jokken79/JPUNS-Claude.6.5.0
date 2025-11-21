@echo off
chcp 65001 >nul
setlocal EnableDelayedExpansion

color 0C
title UNS-ClaudeJP 5.2 - APAGANDO SISTEMA (MODO JUEGO)

cls
echo.
echo                     ███████╗████████╗ ██████╗ ██████╗
echo                     ██╔════╝╚══██╔══╝██╔═══██╗██╔══██╗
echo                     ███████╗   ██║   ██║   ██║██████╔╝
echo                     ╚════██║   ██║   ██║   ██║██╔═══╝
echo                     ███████║   ██║   ╚██████╔╝██║
echo                     ╚══════╝   ╚═╝    ╚═════╝ ╚═╝
echo.
echo                       UNS-ClaudeJP 5.2 - APAGANDO
echo                      🛑 SECUENCIA DE APAGADO INICIADA 🛑
echo.
timeout /t 2 /nobreak >nul

cd /d "%~dp0\.."

echo ╔════════════════════════════════════════════════════════════╗
echo ║              ⚡ VERIFICANDO DOCKER DESKTOP ⚡             ║
echo ╚════════════════════════════════════════════════════════════╝
echo.

docker ps >nul 2>&1
if %errorlevel% neq 0 (
    echo   ⚠️  Docker Desktop no está corriendo
    echo   ℹ️  No hay servicios activos para detener
    echo.
    timeout /t 2 /nobreak >nul
    goto :end
)
echo   ✅ Docker Desktop está corriendo
echo.

set "DOCKER_COMPOSE_CMD="
docker compose version >nul 2>&1
if %errorlevel% EQU 0 (
    set "DOCKER_COMPOSE_CMD=docker compose"
    echo   ✅ Usando Docker Compose V2
) else (
    docker-compose version >nul 2>&1
    if %errorlevel% EQU 0 (
        set "DOCKER_COMPOSE_CMD=docker-compose"
        echo   ✅ Usando Docker Compose V1
    ) else (
        echo   ❌ ERROR: Docker Compose no encontrado
        pause
    )
)
echo.

echo ╔════════════════════════════════════════════════════════════╗
echo ║                  🛑 DETENIENDO SERVICIOS 🛑               ║
echo ╚════════════════════════════════════════════════════════════╝
echo.
echo   ⏳ Apagando todos los servicios...
echo.

%DOCKER_COMPOSE_CMD% --profile dev down

if %errorlevel% EQU 0 (
    cls
    echo.
    echo ╔════════════════════════════════════════════════════════════╗
    echo ║                                                            ║
    echo ║         ✅ ¡TODOS LOS SERVICIOS APAGADOS! ✅              ║
    echo ║                                                            ║
    echo ║       🔴 SISTEMA EN ESTADO OFFLINE 🔴                     ║
    echo ║                                                            ║
    echo ╚════════════════════════════════════════════════════════════╝
    echo.
    echo   Estado final de contenedores:
    echo   ─────────────────────────────────────────────────────────
    %DOCKER_COMPOSE_CMD% --profile dev ps
    echo   ─────────────────────────────────────────────────────────
    echo.
    echo   💾 Para reiniciar: scripts\START_FUN.bat
    echo   🔄 Para reinstalar: scripts\REINSTALAR_FUN.bat
    echo.
) else (
    echo.
    echo ╔════════════════════════════════════════════════════════════╗
    echo ║                ❌ ERROR AL DETENER SERVICIOS ❌             ║
    echo ╚════════════════════════════════════════════════════════════╝
    echo.
    echo   Intentando verificar estado actual...
)
echo.

:end
pause >nul
