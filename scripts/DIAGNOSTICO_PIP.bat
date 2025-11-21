@echo off
setlocal EnableDelayedExpansion

title UNS-ClaudeJP 5.4 - Diagnostico de pip (Build Issues)

echo.
echo ============================================================================
echo                    DIAGNOSTICO DE PROBLEMAS CON PIP BUILD
echo                              Verificacion rapida
echo ============================================================================
echo.

:: Variables
set "PYTHON_CMD="
set "DOCKER_RUNNING=0"

:: Verificar Python
echo [*] Verificando Python..
python --version >nul 2>&1
if !errorlevel! EQU 0 (
    for /f "tokens=*" %%A in ('python --version') do set "PY_VERSION=%%A"
    echo     [OK] !PY_VERSION!
    set "PYTHON_CMD=python"
) else (
    py --version >nul 2>&1
    if !errorlevel! EQU 0 (
        for /f "tokens=*" %%A in ('py --version') do set "PY_VERSION=%%A"
        echo     [OK] !PY_VERSION!
        set "PYTHON_CMD=py"
    ) else (
        echo     [X] Python no encontrado - Instala Python 3.11+
    )
)
echo.

:: Verificar Docker
echo [*] Verificando Docker..
docker --version >nul 2>&1
if !errorlevel! EQU 0 (
    for /f "tokens=*" %%A in ('docker --version') do set "DOCKER_VERSION=%%A"
    echo     [OK] !DOCKER_VERSION!
) else (
    echo     [X] Docker no encontrado
)
echo.

:: Verificar Docker Compose
echo [*] Verificando Docker Compose..
docker compose version >nul 2>&1
if !errorlevel! EQU 0 (
    echo     [OK] Docker Compose V2
) else (
    docker-compose version >nul 2>&1
    if !errorlevel! EQU 0 (
        echo     [OK] Docker Compose V1
    ) else (
        echo     [X] Docker Compose no encontrado
    )
)
echo.

:: Verificar que Docker este corriendo
echo [*] Verificando si Docker esta corriendo..
docker ps >nul 2>&1
if !errorlevel! EQU 0 (
    echo     [OK] Docker esta en ejecucion
    set "DOCKER_RUNNING=1"
) else (
    echo     [X] Docker no esta corriendo
    echo     i Abre Docker Desktop desde el menu de inicio
)
echo.

:: Verificar conectividad a PyPI
echo [*] Probando conectividad a PyPI (files.pythonhosted.org)..
timeout /t 2 /nobreak >nul
for /f "tokens=*" %%A in ('ping -n 1 files.pythonhosted.org 2^>nul ^| findstr "Reply"') do (
    if not "%%A"=="" (
        echo     [OK] Conectividad a PyPI verificada
        goto :pip_ok
    )
)
echo     [!] No se pudo contactar a PyPI (conexion lenta?)
echo     i El build podria tardar mucho tiempo o fallar
:pip_ok
echo.

:: Si Docker no esta corriendo, parar aqui
if %DOCKER_RUNNING% EQU 0 (
    echo ============================================================================
    echo  [X] Docker no esta corriendo - Inicia Docker Desktop antes de REINSTALAR.bat
    echo ============================================================================
    echo.
    pause >nul
    goto :eof
)
echo.

:: Información para troubleshooting
echo ============================================================================
echo                       INFORMACION PARA TROUBLESHOOTING
echo ============================================================================
echo.
echo Si el build falla con "ReadTimeoutError":
echo.
echo 1. AUMENTA EL TIMEOUT:
echo    docker compose build --build-arg PIP_TIMEOUT=2000
echo.
echo 2. PRUEBA CON UN MIRROR DIFERENTE:
echo    docker compose exec backend pip config set global.index-url https://mirrors.aliyun.com/pypi/simple/
echo.
echo 3. VERIFICA ESPACIO EN DISCO:
echo    diskpart
echo    list volume
echo    (Necesitas minimo 10GB libres)
echo.
echo 4. LIMPIA LOS VOLUMENES DE DOCKER:
echo    docker volume prune
echo    docker system prune
echo.
echo 5. REINICIA DOCKER COMPLETAMENTE:
echo    - Cierra Docker Desktop
echo    - Espera 30 segundos
echo    - Abre Docker Desktop nuevamente
echo    - Intenta nuevamente: REINSTALAR.bat
echo.
echo ============================================================================
echo.
pause >nul
