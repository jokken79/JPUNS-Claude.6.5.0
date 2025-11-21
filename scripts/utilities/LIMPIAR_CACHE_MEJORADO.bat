@echo off
chcp 65001 >nul
title UNS-ClaudeJP - Limpiar Cache Mejorado

echo.
echo ========================================================
echo   UNS-CLAUDEJP - LIMPIEZA DE CACHE MEJORADA
echo ========================================================
echo.
echo Este script eliminará archivos innecesarios que hacen
echo lento el build de Docker:
echo.
echo   - __pycache__/ (Python compiled)
echo   - *.pyc (Python bytecode)
echo   - .next/ (Next.js build cache)
echo   - node_modules/.cache/
echo   - Build cache de Docker
echo.
echo ========================================================
echo.

REM Verificar si se ejecuta como administrador
net session >nul 2>&1
if %errorLevel% == 0 (
    echo [INFO] Ejecutando con privilegios de administrador
) else (
    echo [ADVERTENCIA] No se detectan privilegios de administrador
    echo Algunas operaciones podrían fallar
    echo.
)

set /p CONFIRMAR="¿Continuar? (S/N): "
if /i NOT "%CONFIRMAR%"=="S" goto :cancelled

REM Cambiar al directorio raíz del proyecto
cd /d "%~dp0\.."
if %errorLevel% neq 0 (
    echo [ERROR] No se puede cambiar al directorio del proyecto
    pause
)

echo [INFO] Directorio actual: %CD%
echo.

echo [1/6] Eliminando __pycache__ de Python
if exist "backend" (
    for /d /r backend %%d in (__pycache__) do (
        if exist "%%d" (
            echo   Eliminando: %%d
            rd /s /q "%%d" 2>nul
            if !errorLevel! equ 0 (
                echo   [OK] %%d eliminado
            ) else (
                echo   [ADVERTENCIA] No se pudo eliminar %%d
            )
        )
    )
    del /s /q backend\*.pyc 2>nul
    echo   [OK] Limpieza de Python cache completada
) else (
    echo [ADVERTENCIA] Directorio backend no encontrado
)

echo.
echo [2/6] Eliminando cache de Next.js
if exist "frontend\.next" (
    echo   Eliminando: frontend\.next
    rd /s /q "frontend\.next"
    if %errorLevel% equ 0 (
        echo   [OK] Next.js .next eliminado
    ) else (
        echo   [ADVERTENCIA] No se pudo eliminar .next
    )
) else (
    echo [INFO] No se encontró frontend\.next
)

if exist "frontend\out" (
    echo   Eliminando: frontend\out
    rd /s /q "frontend\out"
    if %errorLevel% equ 0 (
        echo   [OK] Next.js out eliminado
    ) else (
        echo   [ADVERTENCIA] No se pudo eliminar out
    )
) else (
    echo [INFO] No se encontró frontend\out
)

echo.
echo [3/6] Eliminando cache de npm
if exist "frontend\node_modules\.cache" (
    echo   Eliminando: frontend\node_modules\.cache
    rd /s /q "frontend\node_modules\.cache"
    if %errorLevel% equ 0 (
        echo   [OK] npm cache eliminado
    ) else (
        echo   [ADVERTENCIA] No se pudo eliminar npm cache
    )
) else (
    echo [INFO] No se encontró frontend\node_modules\.cache
)

echo.
echo [4/6] Verificando Docker
docker --version >nul 2>&1
if %errorLevel% equ 0 (
    echo [OK] Docker está instalado
    docker info >nul 2>&1
    if %errorLevel% equ 0 (
        echo [OK] Docker está en ejecución
        
        echo.
        echo [5/6] Limpiando build cache de Docker
        docker builder prune -af
        if %errorLevel% equ 0 (
            echo   [OK] Docker cache limpiado
        ) else (
            echo   [ADVERTENCIA] Error al limpiar Docker cache
        )
        
        echo.
        echo [6/6] Limpiando imágenes colgadas (dangling)
        docker image prune -f
        if %errorLevel% equ 0 (
            echo   [OK] Imágenes colgadas eliminadas
        ) else (
            echo   [ADVERTENCIA] Error al eliminar imágenes colgadas
        )
    ) else (
        echo [ADVERTENCIA] Docker está instalado pero no en ejecución
        echo Inicia Docker y vuelve a ejecutar el script
    )
) else (
    echo [ADVERTENCIA] Docker no está instalado o no está en el PATH
    echo Omitiendo limpieza de Docker
)

echo.
echo ========================================================
echo   [OK] LIMPIEZA COMPLETADA
echo ========================================================
echo.
echo Ahora puedes ejecutar REINSTALAR.bat
echo El build será mucho más rápido.
echo.
goto :end

:cancelled
echo.
echo Limpieza cancelada.
echo.

:end
pause