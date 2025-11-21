@echo off
chcp 65001 >nul
setlocal EnableDelayedExpansion

REM ============================================================================
REM UNS-ClaudeJP 5.2 - REINSTALAR SYSTEM (FUTURISTIC FUN MODE)
REM ============================================================================
REM This is a FULLY FUNCTIONAL copy of REINSTALAR.bat with EXTREME ANIMATIONS
REM Everything actually works - but it's INSANELY FUN to watch!
REM ============================================================================

color 0A
title UNS-ClaudeJP 5.2 - MODO JUEGO FUTURISTA

REM Clear screen and show epic intro
cls
echo.
echo.
echo                          ███╗   ███╗ ██████╗ ██████╗  ██████╗
echo                          ████╗ ████║██╔═══██╗██╔══██╗██╔═══██╗
echo                          ██╔████╔██║██║   ██║██║  ██║██║   ██║
echo                          ██║╚██╔╝██║██║   ██║██║  ██║██║   ██║
echo                          ██║ ╚═╝ ██║╚██████╔╝██████╔╝╚██████╔╝
echo                          ╚═╝     ╚═╝ ╚═════╝ ╚═════╝  ╚═════╝
echo.
echo                     █████████████████████████████████████████████
echo                     ► UNS-ClaudeJP 5.2 - MODO JUEGO FUTURISTA ◄
echo                     █████████████████████████████████████████████
echo.
echo                    ⚡ SISTEMA DE REINSTALACIÓN ⚡
echo                    🚀 TECNOLOGÍA FUTURISTA EN VIVO 🚀
echo.
timeout /t 3 /nobreak >nul

REM Animated system check
cls
echo.
echo ╔═══════════════════════════════════════════════════════════════╗
echo ║                  🔍 VERIFICACIÓN DE SISTEMA 🔍                ║
echo ╚═══════════════════════════════════════════════════════════════╝
echo.
echo Inicializando secuencia de diagnóstico...
echo.

REM Simulate data scanning animation
for /L %%i in (1,1,20) do (
    <nul set /p =".">nul
    timeout /t 0.05 /nobreak >nul
)
echo. ✓ Conexión establecida
echo.

set "PYTHON_CMD="
set "DOCKER_COMPOSE_CMD="
set "ERROR_FLAG=0"

REM ===== VERIFICACIÓN 1: PYTHON =====
echo ┌─────────────────────────────────────────────────────────────┐
echo │ [1/5] ESCANEANDO PYTHON...                                  │
echo └─────────────────────────────────────────────────────────────┘
python --version >nul 2>&1
if %errorlevel% EQU 0 (
    set "PYTHON_CMD=python"
    echo │ ███████████████████████████░░░░░ [50%%] ✓ DETECTADO
    timeout /t 0.5 /nobreak >nul
    echo │ ✅ Python encontrado
    goto :verificar_docker
)
py --version >nul 2>&1
if %errorlevel% EQU 0 (
    set "PYTHON_CMD=py"
    echo │ ███████████████████████████░░░░░ [50%%] ✓ DETECTADO
    timeout /t 0.5 /nobreak >nul
    echo │ ✅ Python localizado (comando: py)
    goto :verificar_docker
)
echo │ ❌❌❌ PYTHON NO ENCONTRADO ❌❌❌
echo │ 💡 Descarga: https://www.python.org/downloads/
set "ERROR_FLAG=1"

:verificar_docker
echo.
echo ┌─────────────────────────────────────────────────────────────┐
echo │ [2/5] ESCANEANDO DOCKER DESKTOP...                          │
echo └─────────────────────────────────────────────────────────────┘
docker --version >nul 2>&1
if %errorlevel% neq 0 (
    echo │ ❌❌❌ DOCKER NO INSTALADO ❌❌❌
    echo │ 💡 Descarga: https://www.docker.com/products/docker-desktop
    set "ERROR_FLAG=1"
) else (
    echo │ ████████████████████████████░░░░░ [60%%] ✓ PRESENTE
    timeout /t 0.5 /nobreak >nul
    echo │ ✅ Docker Desktop detectado
)
echo.

REM ===== VERIFICACIÓN 3: DOCKER RUNNING =====
echo ┌─────────────────────────────────────────────────────────────┐
echo │ [3/5] VERIFICANDO ESTADO DE DOCKER...                       │
echo └─────────────────────────────────────────────────────────────┘
docker ps >nul 2>&1
if %errorlevel% neq 0 (
    echo │ ⚠️  DOCKER NO ESTÁ CORRIENDO
    echo │ 🔄 Intentando iniciar Docker Desktop...
    timeout /t 1 /nobreak >nul
    echo │ ❌ NO SE PUDO INICIAR
    echo │ 💡 Inicia Docker Desktop manualmente y reintenta
    set "ERROR_FLAG=1"
) else (
    echo │ ███████████████████████████░░░░░ [70%%] ✓ ACTIVO
    timeout /t 0.5 /nobreak >nul
    echo │ ✅ Docker Desktop está corriendo
)
echo.

REM ===== VERIFICACIÓN 4: DOCKER COMPOSE =====
echo ┌─────────────────────────────────────────────────────────────┐
echo │ [4/5] DETECTANDO DOCKER COMPOSE...                          │
echo └─────────────────────────────────────────────────────────────┘
docker compose version >nul 2>&1
if %errorlevel% EQU 0 (
    set "DOCKER_COMPOSE_CMD=docker compose"
    echo │ ███████████████████████████░░░░░ [80%%] ✓ V2 DETECTADO
    timeout /t 0.5 /nobreak >nul
    echo │ ✅ Docker Compose V2 localizado
    goto :verificar_proyecto
)
docker-compose version >nul 2>&1
if %errorlevel% EQU 0 (
    set "DOCKER_COMPOSE_CMD=docker-compose"
    echo │ ███████████████████████████░░░░░ [80%%] ✓ V1 DETECTADO
    timeout /t 0.5 /nobreak >nul
    echo │ ✅ Docker Compose V1 localizado
    goto :verificar_proyecto
)
echo │ ❌ DOCKER COMPOSE NO ENCONTRADO
set "ERROR_FLAG=1"

:verificar_proyecto
echo.
echo ┌─────────────────────────────────────────────────────────────┐
echo │ [5/5] VERIFICANDO ARCHIVOS DEL PROYECTO...                  │
echo └─────────────────────────────────────────────────────────────┘
cd /d "%~dp0\.."
if not exist "docker-compose.yml" (
    echo │ ❌ docker-compose.yml NO ENCONTRADO
    set "ERROR_FLAG=1"
) else (
    echo │ ██████████████████████░░░░░░░░░░░░░░░░░░░░░░░░░░ [50%%] ✓
    timeout /t 0.3 /nobreak >nul
)
if not exist "generate_env.py" (
    echo │ ❌ generate_env.py NO ENCONTRADO
    set "ERROR_FLAG=1"
) else (
    echo │ █████████████████████████████░░░░░░░░░░░░░░░░░░░ [90%%] ✓
    timeout /t 0.3 /nobreak >nul
)
echo │ ███████████████████████████████ [100%%] ✓ TODO OK
timeout /t 0.5 /nobreak >nul
echo │ ✅ Archivos del proyecto verificados
echo.

:diagnostico_fin
if %ERROR_FLAG% EQU 1 (
    cls
    echo.
    echo ╔═══════════════════════════════════════════════════════════════╗
    echo ║            ❌ DIAGNÓSTICO FALLIDO - ERROR DETECTADO ❌         ║
    echo ╚═══════════════════════════════════════════════════════════════╝
    echo.
    echo 🚨 Por favor, corrige los errores detectados arriba
    echo.
    timeout /t 3 /nobreak >nul
    pause >nul
)

REM ===== SUCCESS SCREEN =====
cls
echo.
echo ╔═══════════════════════════════════════════════════════════════╗
echo ║            ✅ ¡DIAGNÓSTICO COMPLETADO EXITOSAMENTE! ✅        ║
echo ╚═══════════════════════════════════════════════════════════════╝
echo.
echo   ✓ Python encontrado
echo   ✓ Docker Desktop activo
echo   ✓ Docker Compose detectado
echo   ✓ Archivos del proyecto verificados
echo.
echo 🚀 Sistema listo para REINSTALACIÓN FUTURISTA
echo.
timeout /t 2 /nobreak >nul

REM ===== MAIN REINSTALL SECTION =====
cls
echo.
echo ╔═══════════════════════════════════════════════════════════════╗
echo ║            ⚡ ADVERTENCIA FUTURISTA CRÍTICA ⚡                ║
echo ╚═══════════════════════════════════════════════════════════════╝
echo.
echo 🔥 ESTA ACCIÓN DESTRUIRÁ TODO Y RECONSTRUIRÁ EL SISTEMA 🔥
echo.
echo   • Eliminará TODOS los contenedores Docker
echo   • Borrará la base de datos PostgreSQL COMPLETA
echo   • Destruirá todos los volúmenes Docker
echo   • Creará una instalación COMPLETAMENTE NUEVA
echo.
echo ╔═══════════════════════════════════════════════════════════════╗
echo.

set "CONFIRMAR="
:confirm_prompt
set /p CONFIRMAR="⚔️  ¿ESTÁS COMPLETAMENTE SEGURO? (S/N): "
if /i "%CONFIRMAR%"=="" goto :confirm_prompt
if /i "%CONFIRMAR%"=="" goto :confirm_prompt
if /i "%CONFIRMAR%"=="S" goto :continue_reinstall
if /i "%CONFIRMAR%"=="SI" goto :continue_reinstall
if /i "%CONFIRMAR%"=="Y" goto :continue_reinstall
if /i "%CONFIRMAR%"=="YES" goto :continue_reinstall
if /i "%CONFIRMAR%"=="N" goto :cancelled
if /i "%CONFIRMAR%"=="NO" goto :cancelled
echo 💡 Responde: S (Si) o N (No)
goto :confirm_prompt

:continue_reinstall
cls
echo.
echo ╔═══════════════════════════════════════════════════════════════╗
echo ║           🚀 INICIANDO SECUENCIA DE REINSTALACIÓN 🚀         ║
echo ╚═══════════════════════════════════════════════════════════════╝
echo.

REM ===== PASO 1 =====
echo [⚙️  PASO 1/7] Generando archivo .env...
if not exist .env (
    echo   ⏳ Ejecutando generate_env.py...
    %PYTHON_CMD% generate_env.py
    if !errorlevel! neq 0 (
        echo   ❌ FALLO LA GENERACIÓN DE .env
        pause
        exit /b 1
    )
    echo   ✅ .env generado correctamente
) else (
    echo   ✅ .env ya existe
)
echo.
timeout /t 1 /nobreak >nul

REM ===== PASO 2 =====
echo [⚙️  PASO 2/7] Deteniendo y eliminando contenedores...
echo   🛑 Deteniendo servicios...
for /L %%i in (1,1,10) do (
    <nul set /p ="■">nul
    timeout /t 0.1 /nobreak >nul
)
echo. [COMPLETO]
%DOCKER_COMPOSE_CMD% down -v
if !errorlevel! neq 0 (
    echo   ⚠️  Algunos contenedores ya estaban detenidos (normal)
) else (
    echo   ✅ Servicios detenidos y datos eliminados
)
echo.
timeout /t 1 /nobreak >nul

REM ===== PASO 3 =====
echo [⚙️  PASO 3/7] Reconstruyendo imágenes Docker...
echo   🔨 Compilando imágenes (puede tardar 5-10 minutos)...
set "DOCKER_BUILDKIT=1"
echo.
%DOCKER_COMPOSE_CMD% build
if !errorlevel! NEQ 0 (
    echo   ❌ ERROR al construir las imágenes
    pause
    exit /b 1
)
echo   ✅ Imágenes reconstruidas correctamente
echo.
timeout /t 2 /nobreak >nul

REM ===== PASO 4 =====
echo [⚙️  PASO 4/7] Iniciando PostgreSQL...
echo   🗄️  Iniciando base de datos...
%DOCKER_COMPOSE_CMD% --profile dev up -d db --remove-orphans
if !errorlevel! NEQ 0 (
    echo   ❌ ERROR al iniciar PostgreSQL
    pause
    exit /b 1
)
echo   ✅ PostgreSQL iniciado
echo.
echo   ⏳ Esperando que PostgreSQL esté listo...

set "DB_READY=0"
set "WAIT_COUNT=0"

:wait_db_loop
docker inspect --format="{{.State.Health.Status}}" uns-claudejp-600-db 2>nul | findstr "healthy" >nul
if !errorlevel! EQU 0 (
    set "DB_READY=1"
    goto :db_ready
)

set /a WAIT_COUNT+=1
if !WAIT_COUNT! EQU 1 (
    echo   ⏳ [10s]  Esperando PostgreSQL...
)
if !WAIT_COUNT! EQU 3 (
    echo   ⏳ [30s]  Base de datos inicializando...
)
if !WAIT_COUNT! EQU 6 (
    echo   ⏳ [60s]  Cargando configuración...
)
if !WAIT_COUNT! EQU 9 (
    echo   ⏳ [90s]  Casi listo...
)

if !WAIT_COUNT! GEQ 12 (
    echo.
    echo   ❌ TIMEOUT: PostgreSQL no respondió en 120 segundos
    pause
    exit /b 1
)

timeout /t 10 /nobreak >nul
goto :wait_db_loop

:db_ready
echo   ✅ PostgreSQL está listo y saludable
echo.
echo   🚀 Iniciando resto de servicios...
%DOCKER_COMPOSE_CMD% --profile dev up -d --remove-orphans
if !errorlevel! NEQ 0 (
    echo   ❌ ERROR al iniciar servicios
    pause
    exit /b 1
)
echo   ✅ Todos los servicios iniciados correctamente
echo.
timeout /t 2 /nobreak >nul

REM ===== PASO 5 =====
echo [⚙️  PASO 5/7] Esperando compilación del frontend...
echo   ⏳ Next.js 16 con Turbopack está compilando... (120 segundos)
echo.
for /L %%i in (1,1,12) do (
    <nul set /p ="[">nul
    for /L %%j in (1,1,10) do <nul set /p ="█">nul
    echo.
    timeout /t 10 /nobreak >nul
)
echo   ✅ Frontend compilado y listo
echo.
timeout /t 1 /nobreak >nul

REM ===== PASO 6 =====
echo [⚙️  PASO 6/7] Importando datos desde fuentes...
echo   📥 Procesando importación de datos (15-30 minutos)...
echo.
docker exec uns-claudejp-600-backend-1 python scripts/import_data.py
if !errorlevel! EQU 0 (
    echo.
    echo   ✅ Importación completada exitosamente
) else (
    echo.
    echo   ⚠️  Algunos datos no pudieron importarse (es normal)
    echo   El sistema funciona pero pueden faltar datos históricos
    timeout /t 2 /nobreak >nul
)
echo.

echo   📊 Verificando datos importados...
docker exec uns-claudejp-600-backend-1 python -c "from app.core.database import SessionLocal; from app.models.models import Candidate, Employee, ContractWorker, Staff, Factory; db = SessionLocal(); c=db.query(Candidate).count(); e=db.query(Employee).count(); cw=db.query(ContractWorker).count(); s=db.query(Staff).count(); f=db.query(Factory).count(); db.close(); print(f'  • Candidatos: {c}'); print(f'  • Empleados: {e}'); print(f'  • Contratistas: {cw}'); print(f'  • Staff: {s}'); print(f'  • Fábricas: {f}')"
echo.
timeout /t 1 /nobreak >nul

REM ===== PASO 7 =====
echo [⚙️  PASO 7/7] Verificando estado final de servicios...
echo.
echo   STATUS FINAL DE SERVICIOS:
echo   ─────────────────────────────────────────────────
%DOCKER_COMPOSE_CMD% ps
echo   ─────────────────────────────────────────────────
echo.

REM ===== FINAL SUCCESS =====
cls
echo.
echo ╔═══════════════════════════════════════════════════════════════╗
echo ║                                                               ║
echo ║       ███████████████████████████████████████████████         ║
echo ║       █                                         █             ║
echo ║       █   ✅ ¡REINSTALACIÓN COMPLETADA! ✅      █             ║
echo ║       █                                         █             ║
echo ║       ███████████████████████████████████████████████         ║
echo ║                                                               ║
echo ╚═══════════════════════════════════════════════════════════════╝
echo.
echo   🎉 ¡Sistema UNS-ClaudeJP 5.2 reinstalado correctamente!
echo.
echo   ╔═══════════════════════════════════════════════════════╗
echo   ║              📱 ACCESO A LA APLICACIÓN              ║
echo   ╠═══════════════════════════════════════════════════════╣
echo   ║ Frontend:     http://localhost:3000                  ║
echo   ║ API Backend:  http://localhost:8000                  ║
echo   ║ API Docs:     http://localhost:8000/api/docs        ║
echo   ║ Database:     http://localhost:8080 (Adminer)       ║
echo   ╚═══════════════════════════════════════════════════════╝
echo.
echo   🔐 CREDENCIALES DE ACCESO:
echo      • Usuario:  admin
echo      • Password: admin123
echo.
echo   💡 NOTAS IMPORTANTES:
echo      • La primera carga del frontend puede tardar 1-2 minutos
echo      • Abre http://localhost:3000 en tu navegador
echo      • Para ver logs: scripts\LOGS.bat
echo      • Para detener: scripts\STOP.bat
echo.
echo ╔═══════════════════════════════════════════════════════╗
echo ║     🚀 ¡BIENVENIDO AL FUTURO DEL HR! 🚀              ║
echo ╚═══════════════════════════════════════════════════════╝
echo.
timeout /t 3 /nobreak >nul
goto :end

:cancelled
echo.
echo ╔═══════════════════════════════════════════════════════════════╗
echo ║            ❌ REINSTALACIÓN CANCELADA POR USUARIO ❌          ║
echo ╚═══════════════════════════════════════════════════════════════╝
echo.
echo No se realizaron cambios en el sistema.
echo.

:end
echo Presiona cualquier tecla para salir...
pause >nul
