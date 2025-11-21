@echo off
chcp 65001 >nul
setlocal EnableDelayedExpansion

title UNS-ClaudeJP - Reinstalar Sistema (Corregido)

:: ============================================================================
:: SECCION DE DIAGNOSTICO
:: ============================================================================
echo.
echo ========================================================
echo   UNS-CLAUDEJP - REINSTALACION DE SISTEMA (v4.2 Corregido)
echo ========================================================
echo.
echo [FASE 1 de 3] Realizando diagnostico del sistema
echo.

set "PYTHON_CMD="
set "DOCKER_COMPOSE_CMD="
set "ERROR_FLAG=0"

:verificar_python
echo   [1/5] Verificando Python
python --version >nul 2>&1
if %errorlevel% EQU 0 (
    set "PYTHON_CMD=python"
    for /f "tokens=2" %%i in ('python --version 2^>^&1') do echo     [OK] Python encontrado (Version %%i)
    goto :verificar_docker
)
py --version >nul 2>&1
if %errorlevel% EQU 0 (
    set "PYTHON_CMD=py"
    for /f "tokens=2" %%i in ('py --version 2^>^&1') do echo     [OK] Python encontrado (Version %%i)
    goto :verificar_docker
)
echo     [ERROR] ERROR: Python no esta instalado o no esta en el PATH.
echo        SOLUCION: Instala Python desde https://www.python.org/downloads/
echo                  (Asegurate de marcar "Add Python to PATH" durante la instalacion)
set "ERROR_FLAG=1"
echo.

:verificar_docker
echo   [2/5] Verificando Docker
docker --version >nul 2>&1
if %errorlevel% neq 0 (
    echo     [ERROR] ERROR: Docker Desktop no esta instalado.
    echo        SOLUCION: Instala Docker Desktop desde https://www.docker.com/products/docker-desktop
    set "ERROR_FLAG=1"
) else (
    echo     [OK] Docker instalado.
)
echo.

:verificar_docker_running
echo   [3/5] Verificando si Docker Desktop esta corriendo
docker ps >nul 2>&1
if %errorlevel% neq 0 (
    echo     [AVISO] Docker Desktop no esta corriendo.
    echo     [>] Intentando iniciar Docker Desktop automaticamente

    REM Buscar Docker Desktop en rutas comunes
    set "DOCKER_DESKTOP_PATH="
    if exist "C:\Program Files\Docker\Docker\Docker Desktop.exe" (
        set "DOCKER_DESKTOP_PATH=C:\Program Files\Docker\Docker\Docker Desktop.exe"
    ) else if exist "%ProgramFiles%\Docker\Docker\Docker Desktop.exe" (
        set "DOCKER_DESKTOP_PATH=%ProgramFiles%\Docker\Docker\Docker Desktop.exe"
    ) else if exist "%ProgramFiles(x86)%\Docker\Docker\Docker Desktop.exe" (
        set "DOCKER_DESKTOP_PATH=%ProgramFiles(x86)%\Docker\Docker\Docker Desktop.exe"
    ) else if exist "%LOCALAPPDATA%\Docker\Docker Desktop.exe" (
        set "DOCKER_DESKTOP_PATH=%LOCALAPPDATA%\Docker\Docker Desktop.exe"
    )

    if "!DOCKER_DESKTOP_PATH!"=="" (
        echo     [ERROR] ERROR: No se pudo encontrar Docker Desktop.exe
        echo        SOLUCION: Instala Docker Desktop desde https://www.docker.com/products/docker-desktop
        set "ERROR_FLAG=1"
        goto :verificar_docker_compose
    )

    REM Iniciar Docker Desktop
    echo     [i] Iniciando Docker Desktop desde: !DOCKER_DESKTOP_PATH!
    start "" "!DOCKER_DESKTOP_PATH!"

    REM Esperar hasta 90 segundos a que Docker este listo
    echo     [WAIT] Esperando a que Docker Desktop este listo (maximo 90 segundos)
    set WAIT_COUNT=0
    :wait_docker
    timeout /t 5 /nobreak >nul
    docker ps >nul 2>&1
    if %errorlevel% EQU 0 (
        echo     [OK] Docker Desktop esta corriendo.
        goto :verificar_docker_compose
    )
    set /a WAIT_COUNT+=5
    if !WAIT_COUNT! LSS 90 (
        echo     [WAIT] Esperando(!WAIT_COUNT!s de 90s^)
        goto :wait_docker
    )

    echo     [ERROR] ERROR: Docker Desktop no inicio en 90 segundos.
    echo        SOLUCION: Inicia Docker Desktop manualmente y espera a que este listo.
    set "ERROR_FLAG=1"
) else (
    echo     [OK] Docker Desktop esta corriendo.
)
echo.

:verificar_docker_compose
echo   [4/5] Verificando Docker Compose
docker compose version >nul 2>&1
if %errorlevel% EQU 0 (
    set "DOCKER_COMPOSE_CMD=docker compose"
    echo     [OK] Docker Compose V2 detectado.
    goto :verificar_proyecto
)
docker-compose version >nul 2>&1
if %errorlevel% EQU 0 (
    set "DOCKER_COMPOSE_CMD=docker-compose"
    echo     [OK] Docker Compose V1 detectado.
    goto :verificar_proyecto
)
echo     [ERROR] ERROR: Docker Compose no fue encontrado.
echo        SOLUCION: Asegurate que Docker Desktop este actualizado.
set "ERROR_FLAG=1"
echo.

:verificar_proyecto
echo   [5/5] Verificando archivos del proyecto
cd /d "%~dp0\.."
if not exist "docker-compose.yml" (
    echo     [ERROR] ERROR: No se encuentra 'docker-compose.yml'.
    set "ERROR_FLAG=1"
) else (
    echo     [OK] 'docker-compose.yml' encontrado.
)
if not exist "generate_env.py" (
    echo     [ERROR] ERROR: No se encuentra 'generate_env.py'.
    set "ERROR_FLAG=1"
) else (
    echo     [OK] 'generate_env.py' encontrado.
)
echo.

:diagnostico_fin
if %ERROR_FLAG% EQU 1 (
    echo ========================================================
    echo [ERROR] DIAGNOSTICO FALLIDO. Se encontraron errores.
    echo ========================================================
    echo.
    echo    Por favor, corrige los errores listados arriba y
    echo    vuelve a ejecutar el script.
    echo.
    echo Presiona cualquier tecla para salir
    pause >nul
    exit /b 1
)

echo ========================================================
echo [OK] DIAGNOSTICO COMPLETADO. Sistema listo para reinstalar.
echo ========================================================
echo.

:: ============================================================================
:: SECCION DE REINSTALACION
:: ============================================================================

echo [FASE 2 de 3] Preparando para la reinstalacion
echo.
echo ========================================================
echo                 ADVERTENCIA IMPORTANTE
echo ========================================================
echo.
echo    Esta accion eliminara TODOS los datos existentes:
echo      - Contenedores, Base de Datos, Imagenes Docker.
echo.
echo    Se reinstalara todo desde cero.
echo.
echo ========================================================
echo.

set /p CONFIRMAR="Estas SEGURO que deseas continuar? (S/N): "
if /i NOT "%CONFIRMAR%"=="S" goto :cancelled

:continue_reinstall
echo.
echo [Paso 1/5] Generando archivo .env si no existe
if not exist .env (
    echo      .env no encontrado. Generando
    %PYTHON_CMD% generate_env.py
    if !errorlevel! neq 0 (
        echo [ERROR] ERROR: Fallo la generacion de .env.
        pause
        exit /b 1
    )
    echo      [OK] .env generado.
) else (
    echo      [OK] .env ya existe.
)
echo.

echo [Paso 2/5] Deteniendo y eliminando contenedores y volumenes
%DOCKER_COMPOSE_CMD% down -v
echo      [OK] Servicios detenidos y datos eliminados.
echo.

echo [Paso 3/5] Reconstruyendo imagenes desde cero (puede tardar 3-5 mins)
%DOCKER_COMPOSE_CMD% build --no-cache
if !errorlevel! neq 0 (
    echo [ERROR] ERROR: Fallo al construir las imagenes. Revisa los logs.
    pause
    exit /b 1
)
echo      [OK] Imagenes reconstruidas.
echo.

echo [Paso 4/5] Iniciando servicios
echo      [4.1] Iniciando PostgreSQL
%DOCKER_COMPOSE_CMD% up -d db --remove-orphans
echo      [4.2] Esperando 30s a que la base de datos se estabilice
timeout /t 30 /nobreak >nul
echo      [4.3] Iniciando el resto de servicios
%DOCKER_COMPOSE_CMD% up -d --remove-orphans
if !errorlevel! neq 0 (
    echo [ERROR] ERROR: Fallo al iniciar los servicios.
    pause
    exit /b 1
)
echo      [OK] Servicios iniciados.
echo.

echo [Paso 5/5] Esperando y verificando
echo      [5.1] Esperando 60s para la compilacion del frontend y la BD
timeout /t 60 /nobreak >nul
echo.
echo      [5.2] Verificando si existe backup de produccion
if exist "%~dp0\..\backend\backups\production_backup.sql" (
    echo      [OK] Backup encontrado: backend\backups\production_backup.sql
    echo.
    set /p RESTORE="¿Deseas restaurar tus datos guardados? (S/N): "
    if /i "!RESTORE!"=="S" (
        echo.
        echo      [>] Restaurando datos desde backup
        docker exec -i uns-claudejp-600-db psql -U uns_admin -d uns_claudejp < "%~dp0\..\backend\backups\production_backup.sql" >nul 2>&1
        if !errorlevel! EQU 0 (
            echo      [OK] Datos restaurados exitosamente.
        ) else (
            echo      [AVISO] Error al restaurar backup. Puede ser normal si las tablas ya existen.
        )
    ) else (
        echo      [i] Usando datos demo por defecto.
    )
) else (
    echo      [i] No se encontro backup. Usando datos demo por defecto.
    echo         (Puedes crear uno con BACKUP_DATOS.bat)
)
echo.

echo [FASE 3 de 3] Verificacion final
echo.
%DOCKER_COMPOSE_CMD% ps
echo.

echo ========================================================
echo       [OK] REINSTALACION COMPLETADA
echo ========================================================
echo.
echo URLs de Acceso:
echo   Frontend:  http://localhost:3000
echo   Backend:   http://localhost:8000/api/docs
echo   Adminer:   http://localhost:8080
echo.
echo Credenciales: admin / admin123
echo.
echo Nota: El frontend puede tardar 1-2 minutos mas en compilar.
echo.
goto :end

:cancelled
echo.
echo Reinstalacion cancelada.
echo.

:end
echo Presiona cualquier tecla para salir
pause >nul
