@echo off
chcp 65001 >nul
setlocal EnableDelayedExpansion

color 0A
title UNS-ClaudeJP 5.2 - INSTALACIÓN INICIAL (MODO JUEGO)

cls
echo.
echo                    ██╗███╗   ██╗███████╗████████╗
echo                    ██║████╗  ██║██╔════╝╚══██╔══╝
echo                    ██║██╔██╗ ██║███████╗   ██║
echo                    ██║██║╚██╗██║╚════██║   ██║
echo                    ██║██║ ╚████║███████║   ██║
echo                    ╚═╝╚═╝  ╚═══╝╚══════╝   ╚═╝
echo.
echo                  UNS-ClaudeJP 5.2 - INSTALACIÓN INICIAL
echo                   🚀 CONSTRUCCIÓN DEL ENTORNO 🚀
echo.
timeout /t 2 /nobreak >nul

echo ╔════════════════════════════════════════════════════════════╗
echo ║           ⚙️  FASE 1: VERIFICACIÓN DE DEPENDENCIAS ⚙️     ║
echo ╚════════════════════════════════════════════════════════════╝
echo.

set "PYTHON_CMD="
set "DOCKER_COMPOSE_CMD="
set "ERROR_FLAG=0"

:verificar_python
echo [1/5] 🐍 VERIFICANDO PYTHON
python --version >nul 2>&1
if %errorlevel% EQU 0 (
    set "PYTHON_CMD=python"
    for /f "tokens=2" %%i in ('python --version 2^>^&1') do echo     ✅ Python %%i encontrado
    goto :verificar_docker
)
py --version >nul 2>&1
if %errorlevel% EQU 0 (
    set "PYTHON_CMD=py"
    for /f "tokens=2" %%i in ('py --version 2^>^&1') do echo     ✅ Python %%i localizado (py)
    goto :verificar_docker
)
echo     ❌ ERROR: Python no esta instalado o no esta en PATH
echo     💡 Instala desde: https://www.python.org/downloads/
set "ERROR_FLAG=1"
echo.

:verificar_docker
echo.
echo [2/5] 🐳 VERIFICANDO DOCKER
docker --version >nul 2>&1
if %errorlevel% neq 0 (
    echo     ❌ ERROR: Docker Desktop no está instalado
    echo     💡 Instala desde: https://www.docker.com/products/docker-desktop
    set "ERROR_FLAG=1"
) else (
    echo     ✅ Docker Desktop instalado
)
echo.

:verificar_docker_running
echo [3/5] ⚡ VERIFICANDO ESTADO DE DOCKER
docker ps >nul 2>&1
if %errorlevel% neq 0 (
    echo     ⚠️  Docker Desktop no está corriendo
    echo     🔄 Intenta iniciar Docker Desktop manualmente
    set "ERROR_FLAG=1"
) else (
    echo     ✅ Docker Desktop está activo
)
echo.

:verificar_docker_compose
echo [4/5] 🔧 VERIFICANDO DOCKER COMPOSE
docker compose version >nul 2>&1
if %errorlevel% EQU 0 (
    set "DOCKER_COMPOSE_CMD=docker compose"
    echo     ✅ Docker Compose V2 detectado
    goto :verificar_proyecto
)
docker-compose version >nul 2>&1
if %errorlevel% EQU 0 (
    set "DOCKER_COMPOSE_CMD=docker-compose"
    echo     ✅ Docker Compose V1 detectado
    goto :verificar_proyecto
)
echo     ❌ ERROR: Docker Compose no encontrado
set "ERROR_FLAG=1"

:verificar_proyecto
echo.
echo [5/5] 📁 VERIFICANDO ARCHIVOS DEL PROYECTO
cd /d "%~dp0\.."
if not exist "docker-compose.yml" (
    echo     ❌ ERROR: No se encuentra 'docker-compose.yml'
    set "ERROR_FLAG=1"
) else (
    echo     ✅ docker-compose.yml encontrado
)
if not exist "generate_env.py" (
    echo     ❌ ERROR: No se encuentra 'generate_env.py'
    set "ERROR_FLAG=1"
) else (
    echo     ✅ generate_env.py encontrado
)
echo.

:diagnostico_fin
if %ERROR_FLAG% EQU 1 (
    cls
    echo.
    echo ╔════════════════════════════════════════════════════════════╗
    echo ║           ❌ VERIFICACIÓN FALLIDA - ERRORES ❌             ║
    echo ╚════════════════════════════════════════════════════════════╝
    echo.
    echo Por favor, corrige los errores y reintenta.
    echo.
    pause >nul
)

cls
echo.
echo ╔════════════════════════════════════════════════════════════╗
echo ║           ✅ VERIFICACIÓN COMPLETADA ✅                   ║
echo ║     🚀 INICIANDO INSTALACIÓN DEL ENTORNO 🚀              ║
echo ╚════════════════════════════════════════════════════════════╝
echo.
timeout /t 2 /nobreak >nul

echo [PASO 1/3] 🔐 Generando archivo .env
if not exist .env (
    echo   ⏳ Ejecutando generate_env.py...
    for /L %%i in (1,1,10) do (
        <nul set /p ="■">nul
        timeout /t 0.1 /nobreak >nul
    )
    echo. [GENERANDO]
    %PYTHON_CMD% generate_env.py
    if !errorlevel! neq 0 (
        echo   ❌ ERROR: Fallo la generación de .env
        pause
        exit /b 1
    )
    echo   ✅ .env generado correctamente
) else (
    echo   ✅ .env ya existe
)
echo.
timeout /t 1 /nobreak >nul

echo [PASO 2/3] 🔨 Construyendo imágenes Docker
echo   ⏳ Compilando (puede tardar 5-15 minutos la primera vez)...
echo   🔧 Inicializando compilación...
echo.
for /L %%i in (1,1,30) do (
    <nul set /p ="█">nul
    timeout /t 0.1 /nobreak >nul
)
echo.
echo   ⏳ Compilando servicios...
%DOCKER_COMPOSE_CMD% build
if !errorlevel! neq 0 (
    echo   ❌ ERROR: Fallo al construir las imágenes
    echo   💡 Revisa los logs para más detalles
    pause
    exit /b 1
)
echo   ✅ Imágenes construidas correctamente
echo.
timeout /t 1 /nobreak >nul

echo [PASO 3/3] ✅ Instalación finalizada
echo.
echo ╔════════════════════════════════════════════════════════════╗
echo ║                                                            ║
echo ║        ✅ ¡INSTALACIÓN COMPLETADA EXITOSAMENTE! ✅        ║
echo ║                                                            ║
echo ║      Las imágenes Docker están construidas y listas       ║
echo ║                                                            ║
echo ╚════════════════════════════════════════════════════════════╝
echo.
echo 🚀 PRÓXIMOS PASOS:
echo    1. Ejecuta: START_FUN.bat
echo    2. Espera a que todos los servicios estén en línea
echo    3. Abre: http://localhost:3000 en tu navegador
echo    4. Login: admin / admin123
echo.

pause >nul
