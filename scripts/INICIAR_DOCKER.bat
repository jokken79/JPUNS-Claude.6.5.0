@echo off
setlocal EnableDelayedExpansion

title Iniciando Docker Desktop...

echo.
echo ============================================================================
echo                    INICIANDO DOCKER DESKTOP
echo ============================================================================
echo.

:: Detectar si Docker Desktop ya esta corriendo
docker ps >nul 2>&1
if !errorlevel! EQU 0 (
    echo [OK] Docker Desktop ya esta corriendo
    echo.
    pause >nul
    goto :eof
)

:: Intenta iniciar Docker Desktop
echo [*] Buscando Docker Desktop...

:: Ruta comun en Windows 10/11 (C:\Program Files\Docker\Docker\Docker Desktop.exe)
set "DOCKER_PATH=C:\Program Files\Docker\Docker\Docker Desktop.exe"

if exist "!DOCKER_PATH!" (
    echo [*] Encontrado en: !DOCKER_PATH!
    echo [*] Iniciando Docker Desktop...
    echo.
    start "" "!DOCKER_PATH!"

    echo [*] Esperando que Docker inicie (esto puede tardar 30-60 segundos)...
    echo.

    :: Esperar 60 segundos maximo
    set "WAIT=0"
    :wait_loop
    docker ps >nul 2>&1
    if !errorlevel! EQU 0 (
        echo [OK] Docker Desktop esta listo
        echo.
        echo ============================================================================
        echo  Docker esta listo. Ahora puedes ejecutar: scripts\REINSTALAR.bat
        echo ============================================================================
        echo.
        pause >nul
        goto :eof
    )

    set /a WAIT+=1
    if !WAIT! GEQ 12 (
        echo.
        echo [X] Tiempo agotado esperando Docker
        echo.
        echo [!] Por favor:
        echo  1. Abre Docker Desktop manualmente
        echo  2. Espera a que se inicie completamente (mira la bandeja de tareas)
        echo  3. Luego ejecuta: scripts\REINSTALAR.bat
        echo.
        pause >nul
        goto :eof
    )

    echo [...]Esperando... !WAIT!/12
    timeout /t 5 /nobreak >nul
    goto :wait_loop

) else (
    echo.
    echo [X] ERROR: No se encontro Docker Desktop
    echo.
    echo [!] Por favor:
    echo  1. Descarga Docker Desktop desde: https://www.docker.com/products/docker-desktop
    echo  2. Instala Docker Desktop
    echo  3. Ejecuta este script nuevamente
    echo.
    pause >nul
    goto :eof
)
