@echo off
chcp 65001 >nul
setlocal EnableDelayedExpansion

color 0B
title UNS-ClaudeJP 5.2 - SISTEMA EN LÍNEA (MODO JUEGO)

cls
echo.
echo.
echo                    ███████╗████████╗ █████╗ ██████╗ ████████╗
echo                    ██╔════╝╚══██╔══╝██╔══██╗██╔══██╗╚══██╔══╝
echo                    ███████╗   ██║   ███████║██████╔╝   ██║
echo                    ╚════██║   ██║   ██╔══██║██╔══██╗   ██║
echo                    ███████║   ██║   ██║  ██║██║  ██║   ██║
echo                    ╚══════╝   ╚═╝   ╚═╝  ╚═╝╚═╝  ╚═╝   ╚═╝
echo.
echo                       UNS-ClaudeJP 5.2 - INICIANDO...
echo                         🚀 MODO DE JUEGO ACTIVADO 🚀
echo.
timeout /t 2 /nobreak >nul

echo ╔════════════════════════════════════════════════════════════╗
echo ║           ⚡ FASE 1: VERIFICACIÓN DE DEPENDENCIAS ⚡      ║
echo ╚════════════════════════════════════════════════════════════╝
echo.

set "PYTHON_CMD="
set "DOCKER_COMPOSE_CMD="
set "ERROR_FLAG=0"

echo [1/5] 🐍 PYTHON...
python --version >nul 2>&1
if %errorlevel% EQU 0 (
    set "PYTHON_CMD=python"
    for /f "tokens=2" %%i in ('python --version 2^>^&1') do echo     ✅ Python %%i detectado
    goto :verificar_docker
)
py --version >nul 2>&1
if %errorlevel% EQU 0 (
    set "PYTHON_CMD=py"
    for /f "tokens=2" %%i in ('py --version 2^>^&1') do echo     ✅ Python %%i (comando py)
    goto :verificar_docker
)
echo     ❌ Python NO encontrado
set "ERROR_FLAG=1"

:verificar_docker
echo.
echo [2/5] 🐳 DOCKER DESKTOP...
docker --version >nul 2>&1
if %errorlevel% neq 0 (
    echo     ⚠️  Docker no instalado - INTENTANDO INICIAR...
    timeout /t 1 /nobreak >nul
    set "DOCKER_DESKTOP_PATH="
    if exist "C:\Program Files\Docker\Docker\Docker Desktop.exe" (
        set "DOCKER_DESKTOP_PATH=C:\Program Files\Docker\Docker\Docker Desktop.exe"
    ) else if exist "%ProgramFiles%\Docker\Docker\Docker Desktop.exe" (
        set "DOCKER_DESKTOP_PATH=%ProgramFiles%\Docker\Docker\Docker Desktop.exe"
    )
    if "!DOCKER_DESKTOP_PATH!"=="" (
        echo     ❌ Docker Desktop no encontrado
        set "ERROR_FLAG=1"
        goto :verificar_docker_compose
    )
    echo     🔄 Iniciando Docker Desktop...
    start "" "!DOCKER_DESKTOP_PATH!"
    echo     ⏳ Esperando que Docker esté listo (máx 90 segundos)...
    set WAIT_COUNT=0
    :wait_docker
    timeout /t 5 /nobreak >nul
    docker ps >nul 2>&1
    if %errorlevel% EQU 0 (
        echo     ✅ Docker Desktop iniciado correctamente
        goto :verificar_docker_compose
    )
    set /a WAIT_COUNT+=5
    if !WAIT_COUNT! LSS 90 (
        echo     ⏳ Esperando... (!WAIT_COUNT!s/90s)
        goto :wait_docker
    )
    echo     ❌ Docker no respondió en 90 segundos
    set "ERROR_FLAG=1"
) else (
    echo     ✅ Docker Desktop está activo
)
echo.

:verificar_docker_compose
echo [3/5] 🔧 DOCKER COMPOSE...
set "DOCKER_COMPOSE_CMD="
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
echo     ❌ Docker Compose no encontrado
set "ERROR_FLAG=1"

:verificar_proyecto
echo.
echo [4/5] 📁 ARCHIVOS DEL PROYECTO...
cd /d "%~dp0\.."
if not exist "docker-compose.yml" (
    echo     ❌ docker-compose.yml no encontrado
    set "ERROR_FLAG=1"
) else (
    echo     ✅ docker-compose.yml presente
)
if not exist "generate_env.py" (
    echo     ❌ generate_env.py no encontrado
    set "ERROR_FLAG=1"
) else (
    echo     ✅ generate_env.py presente
)
echo.

echo [5/5] 🎮 ESTADO GENERAL...
if %ERROR_FLAG% EQU 1 (
    echo     ❌ Errores detectados
) else (
    echo     ✅ Todos los checks pasaron
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
    pause >nul
)

cls
echo.
echo ╔════════════════════════════════════════════════════════════╗
echo ║             ✅ VERIFICACIÓN COMPLETADA ✅                 ║
echo ║              🚀 INICIANDO SERVICIOS 🚀                    ║
echo ╚════════════════════════════════════════════════════════════╝
echo.
timeout /t 2 /nobreak >nul

echo [PASO 1/4] 🔐 Generando .env...
if not exist .env (
    echo   ⏳ Ejecutando generate_env.py...
    %PYTHON_CMD% generate_env.py
    if !errorlevel! neq 0 (
        echo   ❌ ERROR en generación de .env
        pause
        exit /b 1
    )
    echo   ✅ .env generado
) else (
    echo   ✅ .env ya existe
)
echo.
timeout /t 1 /nobreak >nul

echo [PASO 2/4] 📦 Iniciando contenedores...
docker ps -a --filter "name=uns-claudejp" --format "{{.Names}}" | findstr "uns-claudejp" >nul 2>&1
if !errorlevel! EQU 0 (
    echo   🔄 Actualizando contenedores existentes...
    for /L %%i in (1,1,15) do (
        <nul set /p ="█">nul
        timeout /t 0.05 /nobreak >nul
    )
    echo. [ACTUALIZADO]
    %DOCKER_COMPOSE_CMD% --profile dev up -d --remove-orphans
) else (
    echo   🆕 Creando contenedores nuevos...
    for /L %%i in (1,1,15) do (
        <nul set /p ="█">nul
        timeout /t 0.05 /nobreak >nul
    )
    echo. [CREADO]
    %DOCKER_COMPOSE_CMD% --profile dev up -d
)
if !errorlevel! neq 0 (
    echo   ❌ ERROR al iniciar contenedores
    pause
    exit /b 1
)
echo   ✅ Contenedores iniciados
echo.
timeout /t 1 /nobreak >nul

echo [PASO 3/4] ⏳ Esperando estabilización (30 segundos)...
for /L %%i in (1,1,3) do (
    for /L %%j in (1,1,10) do (
        <nul set /p ="■">nul
        timeout /t 1 /nobreak >nul
    )
    echo. [!((%%i)*10) segundos]
)
echo   ✅ Servicios estables
echo.

echo [PASO 4/4] 🔍 Estado final de servicios...
echo.
%DOCKER_COMPOSE_CMD% ps
echo.

cls
echo.
echo ╔════════════════════════════════════════════════════════════╗
echo ║                                                            ║
echo ║    🎉 ¡SISTEMA INICIADO EXITOSAMENTE! 🎉                 ║
echo ║                                                            ║
echo ║          ✅ TODOS LOS SERVICIOS EN LÍNEA ✅               ║
echo ║                                                            ║
echo ╚════════════════════════════════════════════════════════════╝
echo.
echo   🌐 APLICACIÓN DISPONIBLE EN:
echo      • Frontend:    http://localhost:3000
echo      • Backend API: http://localhost:8000/api/docs
echo      • Adminer DB:  http://localhost:8080
echo.
echo   🔐 Credenciales: admin / admin123
echo.
echo   💡 Notas:
echo      - Frontend puede tardar 1-2 minutos en la primera carga
echo      - Para ver logs: scripts\LOGS_FUN.bat
echo      - Para detener: scripts\STOP_FUN.bat
echo.

set /p ABRIR="¿Deseas abrir http://localhost:3000 en el navegador? (S/N): "
if /i "%ABRIR%"=="S" (
    echo.
    echo   🌐 Abriendo navegador...
    start http://localhost:3000
)

:end
echo.
pause >nul
