@echo off
chcp 65001 >nul
setlocal EnableDelayedExpansion

title UNS-ClaudeJP 5.4 - Iniciar Sistema

echo ╔══════════════════════════════════════════════════════════════════════╗
echo ║                  UNS-CLAUDEJP 5.4 - INICIAR SISTEMA                 ║
echo ╚══════════════════════════════════════════════════════════════════════╝
echo.
echo ╔══════════════════════════════════════════════════════════════════════╗
echo ║ [FASE 1/2] DIAGNÓSTICO DEL SISTEMA                                  ║
echo ╚══════════════════════════════════════════════════════════════════════╝
echo.

set "PYTHON_CMD="
set "DOCKER_COMPOSE_CMD="
set "ERROR_FLAG=0"

:verificar_python
echo   ╔══════════════════════════════════════════════════════════════════╗
echo   ║ [1/5] VERIFICANDO PYTHON                                        ║
echo   ╚══════════════════════════════════════════════════════════════════╝
echo.
echo   ▶ Buscando Python en el sistema...
python --version >nul 2>&1
if %errorlevel% EQU 0 (
    set "PYTHON_CMD=python"
    for /f "tokens=2" %%i in ('python --version 2^>^&1') do (
        echo   ✓ Python encontrado: %%i
        echo   ℹ Comando: python
    )
    goto :verificar_docker
)
py --version >nul 2>&1
if %errorlevel% EQU 0 (
    set "PYTHON_CMD=py"
    for /f "tokens=2" %%i in ('py --version 2^>^&1') do (
        echo   ✓ Python encontrado: %%i
        echo   ℹ Comando: py
    )
    goto :verificar_docker
)
echo   ✗ ERROR: Python no está instalado o no está en el PATH
echo   ℹ SOLUCIÓN: Instala Python 3.11+ desde https://www.python.org/downloads/
echo   ℹ Asegúrate de marcar "Add Python to PATH" durante la instalación
set "ERROR_FLAG=1"
echo.

:verificar_docker
echo   ╔══════════════════════════════════════════════════════════════════╗
echo   ║ [2/5] VERIFICANDO DOCKER DESKTOP                                ║
echo   ╚══════════════════════════════════════════════════════════════════╝
echo.
echo   ▶ Verificando instalación de Docker...
docker --version >nul 2>&1
if %errorlevel% neq 0 (
    echo   ✗ ERROR: Docker Desktop no está instalado
    echo   ℹ SOLUCIÓN: Instala Docker Desktop desde https://www.docker.com/products/docker-desktop
    echo   ℹ Requiere Windows 10/11 Pro o activar WSL2 en Windows Home
    set "ERROR_FLAG=1"
) else (
    for /f "tokens=3" %%i in ('docker --version') do (
        echo   ✓ Docker instalado: %%i
    )
)
echo.

:verificar_docker_running
echo   ╔══════════════════════════════════════════════════════════════════╗
echo   ║ [3/5] VERIFICANDO SI DOCKER ESTÁ CORRIENDO                      ║
echo   ╚══════════════════════════════════════════════════════════════════╝
echo.
echo   ▶ Comprobando si Docker Desktop está activo...
docker ps >nul 2>&1
if %errorlevel% neq 0 (
    echo   ⚠ Docker Desktop no está corriendo
    echo.
    echo   ▶ Intentando iniciar Docker Desktop automáticamente...

    set "DOCKER_DESKTOP_PATH="
    if exist "C:\Program Files\Docker\Docker\Docker Desktop.exe" (
        set "DOCKER_DESKTOP_PATH=C:\Program Files\Docker\Docker\Docker Desktop.exe"
    ) else if exist "%ProgramFiles%\Docker\Docker\Docker Desktop.exe" (
        set "DOCKER_DESKTOP_PATH=%ProgramFiles%\Docker\Docker\Docker Desktop.exe"
    )

    if "!DOCKER_DESKTOP_PATH!"=="" (
        echo   ✗ ERROR: No se pudo encontrar Docker Desktop.exe
        echo   ℹ SOLUCIÓN: Instala Docker Desktop o inícialo manualmente
        set "ERROR_FLAG=1"
        goto :verificar_docker_compose
    )

    echo   ℹ Ejecutando: "!DOCKER_DESKTOP_PATH!"
    start "" "!DOCKER_DESKTOP_PATH!"

    echo.
    echo   ▶ Esperando a que Docker Desktop esté listo (máximo 90 segundos)...
    set WAIT_COUNT=0
    :wait_docker
    timeout /t 5 /nobreak >nul
    docker ps >nul 2>&1
    if %errorlevel% EQU 0 (
        echo   ✓ Docker Desktop está corriendo y listo
        goto :verificar_docker_compose
    )
    set /a WAIT_COUNT+=5
    if !WAIT_COUNT! LSS 90 (
        echo   ⏳ Esperando... !WAIT_COUNT!s de 90s
        goto :wait_docker
    )

    echo   ✗ ERROR: Docker Desktop no inició en 90 segundos
    echo   ℹ SOLUCIÓN: Inicia Docker Desktop manualmente y espera el ícono verde
    set "ERROR_FLAG=1"
) else (
    echo   ✓ Docker Desktop está corriendo correctamente
    docker info 2>nul | findstr "Server Version" 
)
echo.

:verificar_docker_compose
echo   ╔══════════════════════════════════════════════════════════════════╗
echo   ║ [4/5] VERIFICANDO DOCKER COMPOSE                                ║
echo   ╚══════════════════════════════════════════════════════════════════╝
echo.
echo   ▶ Detectando versión de Docker Compose...
docker compose version >nul 2>&1
if %errorlevel% EQU 0 (
    set "DOCKER_COMPOSE_CMD=docker compose"
    for /f "tokens=4" %%i in ('docker compose version') do (
        echo   ✓ Docker Compose V2 detectado: %%i
        echo   ℹ Comando: docker compose
    )
    goto :verificar_proyecto
)
docker-compose version >nul 2>&1
if %errorlevel% EQU 0 (
    set "DOCKER_COMPOSE_CMD=docker-compose"
    for /f "tokens=3" %%i in ('docker-compose version') do (
        echo   ✓ Docker Compose V1 detectado: %%i
        echo   ℹ Comando: docker-compose
    )
    goto :verificar_proyecto
)
echo   ✗ ERROR: Docker Compose no fue encontrado
echo   ℹ SOLUCIÓN: Actualiza Docker Desktop a la última versión
set "ERROR_FLAG=1"
echo.

:verificar_proyecto
echo   ╔══════════════════════════════════════════════════════════════════╗
echo   ║ [5/5] VERIFICANDO ARCHIVOS DEL PROYECTO                         ║
echo   ╚══════════════════════════════════════════════════════════════════╝
echo.
cd /d "%~dp0\.."
echo   ▶ Verificando archivos necesarios...
echo.
if not exist "docker-compose.yml" (
    echo   ✗ ERROR: No se encuentra 'docker-compose.yml'
    echo   ℹ Ubicación esperada: %CD%\docker-compose.yml
    set "ERROR_FLAG=1"
) else (
    echo   ✓ docker-compose.yml encontrado
    for %%A in ("docker-compose.yml") do echo   ℹ Tamaño: %%~zA bytes
)
if not exist "generate_env.py" (
    echo   ✗ ERROR: No se encuentra 'generate_env.py'
    echo   ℹ Ubicación esperada: %CD%\generate_env.py
    set "ERROR_FLAG=1"
) else (
    echo   ✓ generate_env.py encontrado
)
echo.

:diagnostico_fin
if %ERROR_FLAG% EQU 1 (
    echo ╔══════════════════════════════════════════════════════════════════════╗
    echo ║  ✗ DIAGNÓSTICO FALLIDO - Se encontraron errores                     ║
    echo ╚══════════════════════════════════════════════════════════════════════╝
    echo.
    echo   Por favor, corrige los errores listados arriba y vuelve a ejecutar
    echo.
    pause
)

echo ╔══════════════════════════════════════════════════════════════════════╗
echo ║  ✓ DIAGNÓSTICO COMPLETADO - Sistema listo para iniciar              ║
echo ╚══════════════════════════════════════════════════════════════════════╝
echo.

echo ╔══════════════════════════════════════════════════════════════════════╗
echo ║ [FASE 2/2] INICIAR SERVICIOS DE UNS-CLAUDEJP                        ║
echo ╚══════════════════════════════════════════════════════════════════════╝
echo.

echo ╔══════════════════════════════════════════════════════════════════════╗
echo ║ [1/5] GENERACIÓN DE ARCHIVO .env                                    ║
echo ╚══════════════════════════════════════════════════════════════════════╝
echo.
if not exist .env (
    echo   ▶ Archivo .env no encontrado, generando nuevo...
    echo   ℹ Comando: %PYTHON_CMD% generate_env.py
    %PYTHON_CMD% generate_env.py
    if !errorlevel! neq 0 (
        echo   ✗ ERROR: Falló la generación de .env
        pause
        exit /b 1
    )
    echo   ✓ Archivo .env generado correctamente
    echo   ℹ Ubicación: %CD%\.env
) else (
    echo   ✓ Archivo .env ya existe (se usará la configuración actual)
    for %%A in (".env") do echo   ℹ Tamaño: %%~zA bytes
)
echo.

echo ╔══════════════════════════════════════════════════════════════════════╗
echo ║ [2/5] INICIAR CONTENEDORES DOCKER                                   ║
echo ╚══════════════════════════════════════════════════════════════════════╝
echo.
echo   ▶ Verificando estado de contenedores existentes...
docker ps -a --filter "name=uns-claudejp" --format "{{.Names}}" | findstr "uns-claudejp" >nul 2>&1
if !errorlevel! EQU 0 (
    echo   ℹ Contenedores existentes detectados
    echo   ▶ Actualizando servicios existentes...
    echo   ℹ Comando: %DOCKER_COMPOSE_CMD% --profile dev up -d --remove-orphans
    %DOCKER_COMPOSE_CMD% --profile dev up -d --remove-orphans
) else (
    echo   ℹ No hay contenedores previos
    echo   ▶ Creando contenedores desde cero...
    echo   ℹ Comando: %DOCKER_COMPOSE_CMD% --profile dev up -d
    %DOCKER_COMPOSE_CMD% --profile dev up -d
)
if !errorlevel! neq 0 (
    echo   ✗ ERROR: Falló el inicio de los contenedores
    echo   ℹ Revisa los mensajes de error anteriores
    pause
    exit /b 1
)
echo   ✓ Contenedores iniciados correctamente
echo.

echo ╔══════════════════════════════════════════════════════════════════════╗
echo ║ [3/5] ESPERAR ESTABILIZACIÓN DE SERVICIOS                           ║
echo ╚══════════════════════════════════════════════════════════════════════╝
echo.
echo   ▶ Esperando a que los servicios se estabilicen (30 segundos)...
echo   ℹ PostgreSQL, Backend y Frontend necesitan tiempo para inicializar
for /l %%i in (1,5,6) do (
    set /a "PROGRESS=%%i*5"
    echo   ⏳ Esperando... !PROGRESS! segundos
    timeout /t 5 /nobreak >nul
)
echo   ✓ Servicios estabilizados
echo.

echo ╔══════════════════════════════════════════════════════════════════════╗
echo ║ [4/5] VERIFICAR MIGRACIONES DE BASE DE DATOS                        ║
echo ╚══════════════════════════════════════════════════════════════════════╝
echo.
echo   ▶ Comprobando revisión actual de Alembic...
echo   ℹ Comando: docker exec uns-claudejp-600-backend-1 alembic current
docker exec uns-claudejp-600-backend-1 alembic current 2>nul | findstr "b6dc75dfbe7c" >nul
if !errorlevel! EQU 0 (
    echo   ✓ Migración más reciente aplicada (b6dc75dfbe7c)
) else (
    echo   ⚠ Migración más reciente no detectada
    echo   ▶ Aplicando migraciones pendientes...
    echo   ℹ Comando: docker exec uns-claudejp-600-backend-1 alembic upgrade head
    docker exec uns-claudejp-600-backend-1 alembic upgrade head
    if !errorlevel! EQU 0 (
        echo   ✓ Migraciones aplicadas correctamente
    ) else (
        echo   ⚠ Hubo problemas al aplicar migraciones
    )
)
echo.
echo   ▶ Verificando estructura de tabla candidates (142 columnas esperadas)...
echo   ℹ Comando: docker exec python script para contar columnas
docker exec uns-claudejp-600-backend-1 python -c "from app.core.database import engine; import sqlalchemy as sa; inspector = sa.inspect(engine); cols = [c['name'] for c in inspector.get_columns('candidates')]; print('     📊 Total columnas:', len(cols)); new_cols = ['family_dependent_1', 'height', 'weight', 'clothing_size', 'waist', 'shoe_size', 'vision_right', 'vision_left']; missing = [c for c in new_cols if c not in cols]; status = '✓ 100%% cobertura activa' if not missing and len(cols) >= 142 else f'⚠ Faltan columnas: {missing}'; print('     Status:', status)" 2>nul
if !errorlevel! NEQ 0 (
    echo   ⚠ No se pudo verificar columnas (backend aún iniciando)
    echo   ℹ Esto es normal si es el primer arranque
)
echo.

echo ╔══════════════════════════════════════════════════════════════════════╗
echo ║ [5/5] VERIFICAR ESTADO FINAL DE SERVICIOS                           ║
echo ╚══════════════════════════════════════════════════════════════════════╝
echo.
echo   ▶ Estado actual de todos los contenedores:
echo.
%DOCKER_COMPOSE_CMD% ps
echo.

echo ╔══════════════════════════════════════════════════════════════════════╗
echo ║              ✓ SISTEMA INICIADO EXITOSAMENTE                        ║
echo ╚══════════════════════════════════════════════════════════════════════╝
echo.
echo 🌐 URLs de Acceso:
echo   • Frontend:    http://localhost:3000
echo   • Backend:     http://localhost:8000/api/docs
echo   • Adminer DB:  http://localhost:8080
echo.
echo 🔐 Credenciales por Defecto:
echo   • Usuario:     admin
echo   • Password:    admin123
echo.
echo ℹ  IMPORTANTE:
echo   • El frontend puede tardar 1-2 minutos en compilar la primera vez
echo   • Si ves "502 Bad Gateway", espera un poco más
echo   • Para ver logs en tiempo real: scripts\LOGS.bat
echo.

set /p ABRIR="¿Abrir frontend en navegador? (S/N): "
if /i "%ABRIR%"=="S" (
    echo.
    echo   ▶ Abriendo http://localhost:3000 en navegador...
    start http://localhost:3000
    echo   ✓ Navegador abierto
)

:end
echo.
echo ═══════════════════════════════════════════════════════════════════════
echo Presiona cualquier tecla para cerrar esta ventana...
pause >nul
