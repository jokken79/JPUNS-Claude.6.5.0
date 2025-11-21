@echo off
setlocal EnableDelayedExpansion

title UNS-ClaudeJP 5.2 - Diagnostico

echo.
echo ========================================================
echo       UNS-CLAUDEJP 5.2 - DIAGNOSTICO DEL SISTEMA
echo ========================================================
echo.

REM Cambiar al directorio raiz del proyecto
cd /d "%~dp0\.."

echo [1/5] Verificando Python...
echo --------------------------------------------------------
python --version >nul 2>&1
if %errorlevel% NEQ 0 (
    echo [ERROR] Python no esta instalado
    echo [SOLUCION] Descarga Python desde: https://www.python.org/downloads
    goto :error
) else (
    for /f "tokens=2" %%i in ('python --version 2^>^&1') do set PYTHON_VERSION=%%i
    echo [OK] Python encontrado (Version !PYTHON_VERSION!)
)
echo.

echo [2/5] Verificando Docker...
echo --------------------------------------------------------
docker --version >nul 2>&1
if %errorlevel% NEQ 0 (
    echo [ERROR] ERROR: Docker Desktop no esta instalado.
    echo [SOLUCION] SOLUCION: Instala Docker Desktop desde https://www.docker.com/products/docker-desktop
    goto :error
) else (
    echo [OK] Docker instalado.
)
echo.

echo [3/5] Verificando Docker Desktop...
echo --------------------------------------------------------
docker ps >nul 2>&1
if %errorlevel% NEQ 0 (
    echo [AVISO] Docker Desktop no esta corriendo.
    echo [WAIT] Iniciando Docker Desktop desde: C:\Program Files\Docker\Docker\Docker Desktop.exe
    echo [WAIT] Esperando a que Docker Desktop este listo (maximo 90 segundos)
    start "" "C:\Program Files\Docker\Docker\Docker Desktop.exe"
    timeout /t 90 /nobreak >nul
    docker ps >nul 2>&1
    if %errorlevel% NEQ 0 (
        echo [ERROR] Docker Desktop no pudo iniciarse
        goto :error
    )
    echo [OK] Docker Desktop esta corriendo.
) else (
    echo [OK] Docker Desktop esta activo.
)
echo.

echo [4/5] Verificando Docker Compose...
echo --------------------------------------------------------
docker compose version >nul 2>&1
if %errorlevel% EQU 0 (
    echo [OK] Docker Compose V2 detectado.
) else (
    docker-compose --version >nul 2>&1
    if %errorlevel% EQU 0 (
        echo [OK] Docker Compose V1 detectado.
    ) else (
        echo [ERROR] Docker Compose no esta disponible.
        goto :error
    )
)
echo.

echo [5/5] Verificando archivos del proyecto...
echo --------------------------------------------------------

if not exist "docker-compose.yml" (
    echo [ERROR] ERROR: No se encuentra 'docker-compose.yml'.
    goto :error
) else (
    echo [OK] 'docker-compose.yml' encontrado.
)

if not exist "generate_env.py" (
    echo [ERROR] ERROR: No se encuentra 'generate_env.py'.
    goto :error
) else (
    echo [OK] 'generate_env.py' encontrado.
)

if not exist "backend" (
    echo [ERROR] ERROR: No se encuentra carpeta 'backend'.
    goto :error
) else (
    echo [OK] Carpeta 'backend' encontrada.
)

if not exist "frontend" (
    echo [ERROR] ERROR: No se encuentra carpeta 'frontend'.
    goto :error
) else (
    echo [OK] Carpeta 'frontend' encontrada.
)

echo.
echo ========================================================
echo DIAGNOSTICO COMPLETADO
echo ========================================================
echo [OK] Todos los checks pasaron!
echo.
echo PROXIMOS PASOS:
echo   1. Ejecuta: START.bat
echo   2. Espera a que todos los servicios esten "Up"
echo   3. Abre navegador: http://localhost:3000
echo   4. Login: admin / admin123
echo.
echo Si tienes problemas, ejecuta: LOGS.bat
echo.
pause

:error
echo.
echo ========================================================
echo [ERROR] DIAGNOSTICO FALLIDO. Se encontraron errores.
echo ========================================================
echo.
echo Por favor, corrige los errores listados arriba y
echo vuelve a ejecutar el script.
echo.
pause

pause >nul
