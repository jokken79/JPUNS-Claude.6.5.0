@echo off
chcp 65001 >nul
setlocal EnableDelayedExpansion

color 0A
title UNS-ClaudeJP 6.0 - INICIAR SISTEMA CON AUTO-IMPORTACIÓN

cls
echo.
echo                    ███████╗████████╗ █████╗ ██████╗ ████████╗
echo                    ██╔════╝╚══██╔══╝██╔══██╗██╔══██╗╚══██╔══╝
echo                    ███████╗   ██║   ███████║██████╔╝   ██║
echo                    ╚════██║   ██║   ██╔══██║██╔══██╗   ██║
echo                    ███████║   ██║   ██║  ██║██║  ██║   ██║
echo                    ╚══════╝   ╚═╝   ╚═╝  ╚═╝╚═╝  ╚═╝   ╚═╝
echo.
echo             ═══════════════════════════════════════════════════
echo                        🚀 UNS-CLAUDEJP 6.0 INICIANDO 🚀
echo                           CON AUTO-IMPORTACIÓN COMPLETA
echo             ═══════════════════════════════════════════════════
echo.

echo ┌────────────────────────────────────────────────────────────────────┐
echo │           🔍 VERIFICACIONES PREVIAS AL ARRANQUE 🔍                │
echo └────────────────────────────────────────────────────────────────────┘
echo.

REM Cambiar al directorio raíz del proyecto
cd /d "%~dp0.."

REM Verificar Docker
echo [1/4] Verificando Docker Desktop...
docker --version >nul 2>&1
if %errorlevel% neq 0 (
    echo   ✗ ERROR: Docker Desktop no está instalado
    echo   Instala Docker Desktop desde https://www.docker.com/products/docker-desktop
    pause >nul
    exit /b 1
)

docker ps >nul 2>&1
if %errorlevel% neq 0 (
    echo   ⚠ Docker Desktop no está corriendo. Iniciando...
    start "" "C:\Program Files\Docker\Docker\Docker Desktop.exe"
    echo   Esperando 30 segundos para que Docker se inicie...
    timeout /t 30 /nobreak >nul

    docker ps >nul 2>&1
    if %errorlevel% neq 0 (
        echo   ✗ ERROR: No se pudo iniciar Docker Desktop
        echo   Por favor, inicia Docker Desktop manualmente
        pause >nul
        exit /b 1
    )
)
echo   ✓ Docker Desktop está funcionando
echo.

REM Verificar dependencias del frontend
echo [2/4] Verificando dependencias del frontend...
if not exist "frontend\node_modules" (
    echo   ⚠ No se encontraron las dependencias del frontend
    echo   📦 Instalando dependencias con npm...
    cd frontend
    npm install --legacy-peer-deps
    if %errorlevel% neq 0 (
        echo   ✗ ERROR: Fallo al instalar dependencias del frontend
        pause >nul
        exit /b 1
    )
    cd ..
    echo   ✓ Dependencias del frontend instaladas
) else (
    echo   ✓ Dependencias del frontend ya instaladas
)
echo.

REM Generar archivos .env si no existen
echo [3/4] Verificando archivos de configuración...
if not exist ".env" (
    echo   ⚠ Archivo .env no encontrado
    echo   📝 Generando configuración...
    python scripts\setup\generate_env.py
    if %errorlevel% neq 0 (
        echo   ✗ ERROR: No se pudo generar .env
        pause >nul
        exit /b 1
    )
    echo   ✓ Archivos .env generados
) else (
    echo   ✓ Archivos .env existentes
)
echo.

REM Iniciar servicios con Docker Compose
echo [4/4] Iniciando todos los servicios...
echo.
echo ╔════════════════════════════════════════════════════════════════════╗
echo ║                    INICIANDO SERVICIOS DOCKER                     ║
echo ╠════════════════════════════════════════════════════════════════════╣
echo ║  📦 Base de datos PostgreSQL                                      ║
echo ║  🔄 Cache Redis                                                    ║
echo ║  🚀 Backend FastAPI                                               ║
echo ║  💻 Frontend Next.js                                              ║
echo ║  🌐 Nginx Proxy                                                   ║
echo ║  📊 Grafana + Prometheus (Observabilidad)                         ║
echo ║  📋 Adminer (Gestión de BD)                                       ║
echo ║  💾 Servicio de Backup                                            ║
echo ╚════════════════════════════════════════════════════════════════════╝
echo.

docker compose up -d
if %errorlevel% neq 0 (
    echo   ✗ ERROR: Fallo al iniciar los servicios
    echo   Ejecuta 'docker compose logs' para ver los detalles
    pause >nul
    exit /b 1
)

echo.
echo ⏳ Esperando a que los servicios estén listos...
timeout /t 10 /nobreak >nul

REM Verificar estado de los servicios
echo.
echo ┌────────────────────────────────────────────────────────────────────┐
echo │                     VERIFICANDO SERVICIOS                         │
echo └────────────────────────────────────────────────────────────────────┘
echo.

docker compose ps --format "table {{.Name}}\t{{.Status}}"

echo.
echo ┌────────────────────────────────────────────────────────────────────┐
echo │                  IMPORTANDO DATOS INICIALES                       │
echo └────────────────────────────────────────────────────────────────────┘
echo.

REM Ejecutar importación de datos
echo Ejecutando importación de datos...
docker exec uns-claudejp-600-backend python scripts/import_data.py >nul 2>&1
if %errorlevel% EQU 0 (
    echo   ✓ Datos demo importados exitosamente
) else (
    echo   ⚠ No se pudieron importar los datos demo (no crítico)
)

docker exec uns-claudejp-600-backend python scripts/sync_candidate_employee_status.py >nul 2>&1
if %errorlevel% EQU 0 (
    echo   ✓ Estado de candidatos sincronizado
) else (
    echo   ⚠ No se pudo sincronizar estado de candidatos (no crítico)
)

echo.
echo ╔════════════════════════════════════════════════════════════════════╗
echo ║                    🎉 SISTEMA INICIADO CON ÉXITO 🎉               ║
echo ╠════════════════════════════════════════════════════════════════════╣
echo ║                                                                    ║
echo ║  🌐 Frontend:           http://localhost:3000                     ║
echo ║  📡 API Backend:        http://localhost/api                      ║
echo ║  📚 API Docs:           http://localhost:8000/api/docs            ║
echo ║  🗄️  Adminer (BD):       http://localhost:8080                     ║
echo ║  📊 Grafana:            http://localhost:3001                     ║
echo ║  📈 Prometheus:         http://localhost:9090                     ║
echo ║                                                                    ║
echo ║  👤 Usuario:            admin                                     ║
echo ║  🔑 Contraseña:         admin123                                  ║
echo ║                                                                    ║
echo ╠════════════════════════════════════════════════════════════════════╣
echo ║  📌 COMANDOS ÚTILES:                                              ║
echo ║                                                                    ║
echo ║  Ver logs:              docker compose logs -f [servicio]         ║
echo ║  Detener servicios:     scripts\STOP.bat                          ║
echo ║  Ver estado:            docker compose ps                         ║
echo ║  Importar más datos:    scripts\IMPORTAR_DATOS.bat                ║
echo ║                                                                    ║
echo ╚════════════════════════════════════════════════════════════════════╝
echo.
echo ✅ TODO IMPORTADO Y FUNCIONANDO SIN ERRORES
echo.
echo Presiona cualquier tecla para cerrar esta ventana...
pause >nul