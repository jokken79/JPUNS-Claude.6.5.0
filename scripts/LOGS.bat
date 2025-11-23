@echo off
chcp 65001 >nul
setlocal EnableDelayedExpansion

color 0A
title UNS-ClaudeJP 5.4 - VER LOGS EN TIEMPO REAL

cls
echo.
echo                ██╗      ██████╗  ██████╗ ███████╗
echo                ██║     ██╔═══██╗██╔════╝ ██╔════╝
echo                ██║     ██║   ██║██║  ███╗███████╗
echo                ██║     ██║   ██║██║   ██║╚════██║
echo                ███████╗╚██████╔╝╚██████╔╝███████║
echo                ╚══════╝ ╚═════╝  ╚═════╝ ╚══════╝
echo.
echo           ═════════════════════════════════════════════════════
echo                     📊 UNS-CLAUDEJP 5.4 - VER LOGS 📊
echo           ═════════════════════════════════════════════════════
echo.

REM Cambiar al directorio raiz del proyecto
cd /d "%~dp0\.."

echo ┌────────────────────────────────────────────────────────────────────┐
echo │ 🐳 VERIFICANDO DOCKER DESKTOP                                     │
echo └────────────────────────────────────────────────────────────────────┘
echo.
docker ps >nul 2>&1
if %errorlevel% neq 0 (
    cls
    echo.
    echo           ██╗  ██╗██╗  ██╗██╗  ██╗  ███████╗██████╗ ██████╗  ██████╗ ██████╗
    echo           ╚██╗██╔╝╚██╗██╔╝╚██╗██╔╝  ██╔════╝██╔══██╗██╔══██╗██╔═══██╗██╔══██╗
    echo            ╚███╔╝  ╚███╔╝  ╚███╔╝   █████╗  ██████╔╝██████╔╝██║   ██║██████╔╝
    echo            ██╔██╗  ██╔██╗  ██╔██╗   ██╔══╝  ██╔══██╗██╔══██╗██║   ██║██╔══██╗
    echo           ██╔╝ ██╗██╔╝ ██╗██╔╝ ██╗  ███████╗██║  ██║██║  ██║╚██████╔╝██║  ██║
    echo           ╚═╝  ╚═╝╚═╝  ╚═╝╚═╝  ╚═╝  ╚══════╝╚═╝  ╚═╝╚═╝  ╚═╝ ╚═════╝ ╚═╝  ╚═╝
    echo.
    echo              ═══════════════════════════════════════════════════════════
    echo                           ❌ ERROR: DOCKER NO ESTÁ CORRIENDO ❌
    echo              ═══════════════════════════════════════════════════════════
    echo.
    echo   ℹ SOLUCIÓN: Inicia Docker Desktop con START.bat primero
    echo.
    pause
)
echo   ✓ Docker Desktop está corriendo
echo   ██████████ [100%%]
echo.

echo ┌────────────────────────────────────────────────────────────────────┐
echo │ 📦 VERIFICANDO DOCKER COMPOSE                                     │
echo └────────────────────────────────────────────────────────────────────┘
echo.
set "DOCKER_COMPOSE_CMD="
docker compose version >nul 2>&1
if %errorlevel% EQU 0 (
    set "DOCKER_COMPOSE_CMD=docker compose"
    echo   ✓ Docker Compose V2 detectado
    echo   ██████████ [100%%]
) else (
    docker-compose version >nul 2>&1
    if %errorlevel% EQU 0 (
        set "DOCKER_COMPOSE_CMD=docker-compose"
        echo   ✓ Docker Compose V1 detectado
        echo   ██████████ [100%%]
    ) else (
        echo   ✗ ERROR: Docker Compose no encontrado
        pause
    )
)
echo.

cls
echo.
echo                ██╗      ██████╗  ██████╗ ███████╗
echo                ██║     ██╔═══██╗██╔════╝ ██╔════╝
echo                ██║     ██║   ██║██║  ███╗███████╗
echo                ██║     ██║   ██║██║   ██║╚════██║
echo                ███████╗╚██████╔╝╚██████╔╝███████║
echo                ╚══════╝ ╚═════╝  ╚═════╝ ╚══════╝
echo.
echo           ═════════════════════════════════════════════════════
echo              📊 SELECCIONA EL SERVICIO A MONITOREAR 📊
echo           ═════════════════════════════════════════════════════
echo.
echo   ┌──────────────────────────────────────────────────────────────┐
echo   │                                                              │
echo   │   1 - 🗄️  Database (PostgreSQL)                            │
echo   │   2 - 🐍  Backend (FastAPI)                                 │
echo   │   3 - ⚛️  Frontend (Next.js)                                │
echo   │   4 - 📥  Importer                                           │
echo   │   5 - 🔧  Adminer                                            │
echo   │   6 - 📊  Todos los servicios                                │
echo   │   7 - 🚪  Salir                                              │
echo   │                                                              │
echo   └──────────────────────────────────────────────────────────────┘
echo.
echo   ═══════════════════════════════════════════════════════════════
echo.

choice /C 1234567 /M "Opción: "

if errorlevel 7 goto :end
if errorlevel 6 (
    cls
    echo.
    echo   ┌──────────────────────────────────────────────────────────────┐
    echo   │ 📊 MOSTRANDO LOGS DE TODOS LOS SERVICIOS                    │
    echo   │ ℹ  Presiona Ctrl+C para salir                                │
    echo   └──────────────────────────────────────────────────────────────┘
    echo.
    echo   ██████████ [100%%] INICIANDO LOGS EN TIEMPO REAL...
    echo.
    %DOCKER_COMPOSE_CMD% logs -f
    goto :end
)
if errorlevel 5 (
    cls
    echo.
    echo   ┌──────────────────────────────────────────────────────────────┐
    echo   │ 🔧 MOSTRANDO LOGS DE ADMINER                                │
    echo   │ ℹ  Presiona Ctrl+C para salir                                │
    echo   └──────────────────────────────────────────────────────────────┘
    echo.
    echo   ██████████ [100%%] INICIANDO LOGS EN TIEMPO REAL...
    echo.
    docker logs -f uns-claudejp-600-adminer
    goto :end
)
if errorlevel 4 (
    cls
    echo.
    echo   ┌──────────────────────────────────────────────────────────────┐
    echo   │ 📥 MOSTRANDO LOGS DE IMPORTER                               │
    echo   │ ℹ  Presiona Ctrl+C para salir                                │
    echo   └──────────────────────────────────────────────────────────────┘
    echo.
    echo   ██████████ [100%%] INICIANDO LOGS EN TIEMPO REAL...
    echo.
    docker logs -f uns-claudejp-600-importer
    goto :end
)
if errorlevel 3 (
    cls
    echo.
    echo   ┌──────────────────────────────────────────────────────────────┐
    echo   │ ⚛️ MOSTRANDO LOGS DE FRONTEND (NEXT.JS)                     │
    echo   │ ℹ  Presiona Ctrl+C para salir                                │
    echo   └──────────────────────────────────────────────────────────────┘
    echo.
    echo   ██████████ [100%%] INICIANDO LOGS EN TIEMPO REAL...
    echo.
    docker logs -f uns-claudejp-600-frontend
    goto :end
)
if errorlevel 2 (
    cls
    echo.
    echo   ┌──────────────────────────────────────────────────────────────┐
    echo   │ 🐍 MOSTRANDO LOGS DE BACKEND (FASTAPI)                      │
    echo   │ ℹ  Presiona Ctrl+C para salir                                │
    echo   └──────────────────────────────────────────────────────────────┘
    echo.
    echo   ██████████ [100%%] INICIANDO LOGS EN TIEMPO REAL...
    echo.
    docker logs -f uns-claudejp-600-backend-1
    goto :end
)
if errorlevel 1 (
    cls
    echo.
    echo   ┌──────────────────────────────────────────────────────────────┐
    echo   │ 🗄️ MOSTRANDO LOGS DE DATABASE (POSTGRESQL)                 │
    echo   │ ℹ  Presiona Ctrl+C para salir                                │
    echo   └──────────────────────────────────────────────────────────────┘
    echo.
    echo   ██████████ [100%%] INICIANDO LOGS EN TIEMPO REAL...
    echo.
    docker logs -f uns-claudejp-600-db
    goto :end
)

:end
echo.
pause >nul
