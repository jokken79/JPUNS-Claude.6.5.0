@echo off
chcp 65001 >nul
title UNS-ClaudeJP - Limpiar Cache (Sin Docker)

echo.
echo ========================================================
echo   UNS-CLAUDEJP - LIMPIEZA DE CACHE (SIN DOCKER)
echo ========================================================
echo.
echo Este script eliminará archivos innecesarios que hacen
echo lento el build:
echo.
echo   - __pycache__/ (Python compiled)
echo   - *.pyc (Python bytecode)
echo   - .next/ (Next.js build cache)
echo   - node_modules/.cache/
echo.
echo NOTA: Esta versión NO limpia Docker para evitar errores
echo       si Docker no está instalado o funcionando.
echo.
echo ========================================================
echo.

set /p CONFIRMAR="¿Continuar? (S/N): "
if /i NOT "%CONFIRMAR%"=="S" goto :cancelled

cd /d "%~dp0\.."
if %errorLevel% neq 0 (
    echo [ERROR] No se puede cambiar al directorio del proyecto
    pause
    exit /b 1
)

echo [INFO] Directorio actual: %CD%
echo.

echo [1/4] Eliminando __pycache__ de Python
if exist "backend" (
    set count=0
    for /d /r backend %%d in (__pycache__) do (
        if exist "%%d" (
            echo   Eliminando: %%d
            rd /s /q "%%d" 2>nul
            if !errorLevel! equ 0 (
                set /a count+=1
            )
        )
    )
    del /s /q backend\*.pyc 2>nul
    echo   [OK] Se eliminaron %count% directorios __pycache__
) else (
    echo [ADVERTENCIA] Directorio backend no encontrado
)

echo.
echo [2/4] Eliminando cache de Next.js
set removed=0
if exist "frontend\.next" (
    echo   Eliminando: frontend\.next
    rd /s /q "frontend\.next" 2>nul
    if !errorLevel! equ 0 (
        set /a removed+=1
        echo   [OK] Next.js .next eliminado
    ) else (
        echo   [ADVERTENCIA] No se pudo eliminar .next
    )
) else (
    echo [INFO] No se encontró frontend\.next
)

if exist "frontend\out" (
    echo   Eliminando: frontend\out
    rd /s /q "frontend\out" 2>nul
    if !errorLevel! equ 0 (
        set /a removed+=1
        echo   [OK] Next.js out eliminado
    ) else (
        echo   [ADVERTENCIA] No se pudo eliminar out
    )
) else (
    echo [INFO] No se encontró frontend\out
)

echo.
echo [3/4] Eliminando cache de npm
if exist "frontend\node_modules\.cache" (
    echo   Eliminando: frontend\node_modules\.cache
    rd /s /q "frontend\node_modules\.cache" 2>nul
    if !errorLevel! equ 0 (
        echo   [OK] npm cache eliminado
    ) else (
        echo   [ADVERTENCIA] No se pudo eliminar npm cache
    )
) else (
    echo [INFO] No se encontró frontend\node_modules\.cache
)

echo.
echo [4/4] Limpiando archivos temporales adicionales
if exist "backend\app\__pycache__" (
    rd /s /q "backend\app\__pycache__" 2>nul
    echo   [OK] Eliminado backend\app\__pycache__
)

if exist "*.log" (
    del /q *.log 2>nul
    echo   [OK] Eliminados archivos .log
)

if exist "temp" (
    rd /s /q "temp" 2>nul
    echo   [OK] Eliminado directorio temp
)

echo.
echo ========================================================
echo   [OK] LIMPIEZA COMPLETADA (SIN DOCKER)
echo ========================================================
echo.
echo Cache local limpiado exitosamente.
echo Si necesitas limpiar Docker también, ejecuta:
echo   docker system prune -a
echo.
goto :end

:cancelled
echo.
echo Limpieza cancelada.
echo.

:end
pause