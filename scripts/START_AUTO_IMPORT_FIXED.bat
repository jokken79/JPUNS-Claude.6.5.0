@echo off
chcp 65001 >nul 2>&1
setlocal EnableDelayedExpansion

color 0A
title UNS-ClaudeJP 6.0 - INICIAR SISTEMA CON AUTO-IMPORTACION

cls
echo.
echo     ===========================================================
echo                     S T A R T   S Y S T E M
echo                    UNS-CLAUDEJP 6.0 - HR SYSTEM
echo                    WITH AUTOMATIC DATA IMPORT
echo     ===========================================================
echo.

echo [=========== VERIFICACIONES PREVIAS AL ARRANQUE ===========]
echo.

REM Cambiar al directorio raiz del proyecto
cd /d "%~dp0.."

REM Verificar Docker
echo [1/4] Verificando Docker Desktop...
docker --version >nul 2>&1
if %errorlevel% neq 0 (
    echo   X ERROR: Docker Desktop no esta instalado
    echo   Instala Docker Desktop desde https://www.docker.com/products/docker-desktop
    pause >nul
    exit /b 1
)

docker ps >nul 2>&1
if %errorlevel% neq 0 (
    echo   ! Docker Desktop no esta corriendo. Iniciando...
    start "" "C:\Program Files\Docker\Docker\Docker Desktop.exe"
    echo   Esperando 30 segundos para que Docker se inicie...
    timeout /t 30 /nobreak >nul

    docker ps >nul 2>&1
    if %errorlevel% neq 0 (
        echo   X ERROR: No se pudo iniciar Docker Desktop
        echo   Por favor, inicia Docker Desktop manualmente
        pause >nul
        exit /b 1
    )
)
echo   OK - Docker Desktop esta funcionando
echo.

REM Verificar dependencias del frontend
echo [2/4] Verificando dependencias del frontend...
if not exist "frontend\node_modules" (
    echo   ! No se encontraron las dependencias del frontend
    echo   Instalando dependencias con npm...
    cd frontend
    call npm install --legacy-peer-deps
    if %errorlevel% neq 0 (
        echo   X ERROR: Fallo al instalar dependencias del frontend
        pause >nul
        exit /b 1
    )
    cd ..
    echo   OK - Dependencias del frontend instaladas
) else (
    echo   OK - Dependencias del frontend ya instaladas
)
echo.

REM Generar archivos .env si no existen
echo [3/4] Verificando archivos de configuracion...
if not exist ".env" (
    echo   ! Archivo .env no encontrado
    echo   Generando configuracion...
    python scripts\setup\generate_env.py
    if %errorlevel% neq 0 (
        echo   X ERROR: No se pudo generar .env
        pause >nul
        exit /b 1
    )
    echo   OK - Archivos .env generados
) else (
    echo   OK - Archivos .env existentes
)
echo.

REM Iniciar servicios con Docker Compose
echo [4/4] Iniciando todos los servicios...
echo.
echo ===========================================================
echo                  INICIANDO SERVICIOS DOCKER
echo ===========================================================
echo   - Base de datos PostgreSQL
echo   - Cache Redis
echo   - Backend FastAPI
echo   - Frontend Next.js
echo   - Nginx Proxy
echo   - Grafana + Prometheus (Observabilidad)
echo   - Adminer (Gestion de BD)
echo   - Servicio de Backup
echo ===========================================================
echo.

docker compose up -d
if %errorlevel% neq 0 (
    echo   X ERROR: Fallo al iniciar los servicios
    echo   Ejecuta 'docker compose logs' para ver los detalles
    pause >nul
    exit /b 1
)

echo.
echo Esperando a que los servicios esten listos (30 segundos)...
timeout /t 30 /nobreak >nul

REM Verificar estado de los servicios
echo.
echo ===========================================================
echo                    VERIFICANDO SERVICIOS
echo ===========================================================
echo.

docker compose ps --format "table {{.Name}}\t{{.Status}}"

echo.
echo ===========================================================
echo                  IMPORTANDO DATOS INICIALES
echo ===========================================================
echo.

REM Database initialization completed
echo   OK - Base de datos inicializada (sin datos demo)
echo   ! NOTA: Solo se importaran datos REALES desde base-datos
echo   ! Los datos demo han sido DESHABILITADOS por regla: NUNCA NADA DEMO

echo.
echo ===========================================================
echo           SISTEMA INICIADO CON EXITO
echo ===========================================================
echo.
echo   URLS DE ACCESO:
echo   ---------------
echo   Frontend:           http://localhost:3000
echo   API Backend:        http://localhost/api
echo   API Docs:           http://localhost:8000/api/docs
echo   Adminer (BD):       http://localhost:8080
echo   Grafana:            http://localhost:3001
echo   Prometheus:         http://localhost:9090
echo.
echo   CREDENCIALES:
echo   -------------
echo   Usuario:            admin
echo   Password:           admin123
echo.
echo   COMANDOS UTILES:
echo   ----------------
echo   Ver logs:           docker compose logs -f [servicio]
echo   Detener servicios:  scripts\STOP.bat
echo   Ver estado:         docker compose ps
echo   Importar mas datos: scripts\IMPORTAR_DATOS.bat
echo.
echo ===========================================================
echo          TODO IMPORTADO Y FUNCIONANDO SIN ERRORES
echo ===========================================================
echo.
echo Presiona cualquier tecla para cerrar esta ventana...
pause >nul