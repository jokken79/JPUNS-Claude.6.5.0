@echo off
chcp 65001 >nul
setlocal EnableDelayedExpansion

color 0B
title UNS-ClaudeJP 5.4 - DIAGNÓSTICO DEL SISTEMA

cls
echo.
echo                   ██████╗ ██╗ █████╗  ██████╗ ███████╗
echo                   ██╔══██╗██║██╔══██╗██╔════╝ ██╔════╝
echo                   ██║  ██║██║███████║██║  ███╗███████╗
echo                   ██║  ██║██║██╔══██║██║   ██║╚════██║
echo                   ██████╔╝██║██║  ██║╚██████╔╝███████║
echo                   ╚═════╝ ╚═╝╚═╝  ╚═╝ ╚═════╝ ╚══════╝
echo.
echo                   UNS-ClaudeJP 5.4 - DIAGNÓSTICO COMPLETO
echo                    🔍 ESCANEANDO TODO EL SISTEMA 🔍
echo.
timeout /t 2 /nobreak >nul

cd /d "%~dp0\.."

echo ╔════════════════════════════════════════════════════════════╗
echo ║           🔧 INICIANDO SECUENCIA DE DIAGNÓSTICO 🔧        ║
echo ╚════════════════════════════════════════════════════════════╝
echo.

REM DIAGNÓSTICO 1: PYTHON
echo [1/5] 🐍 VERIFICANDO PYTHON
echo ─────────────────────────────────────────────────────────────
python --version >nul 2>&1
if %errorlevel% NEQ 0 (
    echo ❌ FALLO: Python no está instalado
    echo 💡 SOLUCIÓN: Descarga Python desde https://www.python.org/downloads
    goto :error
) else (
    for /f "tokens=2" %%i in ('python --version 2^>^&1') do (
        echo ✅ Python %%i - INSTALADO Y FUNCIONANDO
    )
)
echo.

REM DIAGNÓSTICO 2: DOCKER
echo [2/5] 🐳 VERIFICANDO DOCKER
echo ─────────────────────────────────────────────────────────────
docker --version >nul 2>&1
if %errorlevel% NEQ 0 (
    echo ❌ FALLO: Docker Desktop no está instalado
    echo 💡 SOLUCIÓN: Instala desde https://www.docker.com/products/docker-desktop
    goto :error
) else (
    echo ✅ Docker instalado - PRESENTE
)
echo.

REM DIAGNÓSTICO 3: DOCKER RUNNING
echo [3/5] ⚡ VERIFICANDO ESTADO DE DOCKER
echo ─────────────────────────────────────────────────────────────
docker ps >nul 2>&1
if %errorlevel% NEQ 0 (
    echo ⚠️  Docker Desktop no está corriendo
    echo 🔄 Intentando iniciar desde: C:\Program Files\Docker\Docker\Docker Desktop.exe
    echo ⏳ Esperando a que Docker esté listo (máx 90 segundos)...
    start "" "C:\Program Files\Docker\Docker\Docker Desktop.exe"
    timeout /t 90 /nobreak >nul
    docker ps >nul 2>&1
    if %errorlevel% NEQ 0 (
        echo ❌ FALLO: Docker Desktop no pudo iniciarse
        echo 💡 SOLUCIÓN: Inicia Docker Desktop manualmente
        goto :error
    )
)
echo ✅ Docker Desktop está activo - FUNCIONANDO
echo.

REM DIAGNÓSTICO 4: DOCKER COMPOSE
echo [4/5] 🔧 VERIFICANDO DOCKER COMPOSE
echo ─────────────────────────────────────────────────────────────
docker compose version >nul 2>&1
if %errorlevel% EQU 0 (
    echo ✅ Docker Compose V2 detectado - OK
) else (
    docker-compose --version >nul 2>&1
    if %errorlevel% EQU 0 (
        echo ✅ Docker Compose V1 detectado - OK
    ) else (
        echo ❌ FALLO: Docker Compose no está disponible
        goto :error
    )
)
echo.

REM DIAGNÓSTICO 5: ARCHIVOS DEL PROYECTO
echo [5/5] 📁 VERIFICANDO ARCHIVOS DEL PROYECTO
echo ─────────────────────────────────────────────────────────────
if not exist "docker-compose.yml" (
    echo ❌ FALLO: No se encuentra 'docker-compose.yml'
    goto :error
) else (
    echo ✅ docker-compose.yml - PRESENTE
)
if not exist "generate_env.py" (
    echo ❌ FALLO: No se encuentra 'generate_env.py'
    goto :error
) else (
    echo ✅ generate_env.py - PRESENTE
)
if not exist "backend" (
    echo ❌ FALLO: No se encuentra carpeta 'backend'
    goto :error
) else (
    echo ✅ Carpeta backend - PRESENTE
)
if not exist "frontend" (
    echo ❌ FALLO: No se encuentra carpeta 'frontend'
    goto :error
) else (
    echo ✅ Carpeta frontend - PRESENTE
)
echo.

goto :success

:error
echo.
echo ╔════════════════════════════════════════════════════════════╗
echo ║          ❌ DIAGNÓSTICO FALLIDO - ERRORES ENCONTRADOS ❌   ║
echo ╚════════════════════════════════════════════════════════════╝
echo.
echo Por favor, corrige los errores listados arriba y reintenta.
echo.
pause

:success
echo ╔════════════════════════════════════════════════════════════╗
echo ║                                                            ║
echo ║        ✅ ¡DIAGNÓSTICO COMPLETADO EXITOSAMENTE! ✅        ║
echo ║                                                            ║
echo ║             🟢 TODOS LOS CHECKS PASARON 🟢                ║
echo ║                                                            ║
echo ╚════════════════════════════════════════════════════════════╝
echo.
echo 🎯 PRÓXIMOS PASOS:
echo    1. Ejecuta: START_FUN.bat
echo    2. Espera a que todos los servicios estén en línea
echo    3. Abre navegador: http://localhost:3000
echo    4. Login: admin / admin123
echo.
echo 📊 Si tienes problemas, ejecuta: LOGS_FUN.bat
echo.
pause >nul
