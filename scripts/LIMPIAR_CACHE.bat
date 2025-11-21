@echo off
chcp 65001 >nul
title UNS-ClaudeJP - Limpiar Cache

echo.
echo ========================================================
echo   UNS-CLAUDEJP - LIMPIEZA DE CACHE
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

set /p CONFIRMAR="¿Continuar? (S/N): "
if /i NOT "%CONFIRMAR%"=="S" goto :cancelled

cd /d "%~dp0\.."

echo.
echo [1/5] Eliminando __pycache__ de Python
for /d /r backend %%d in (__pycache__) do @if exist "%%d" rd /s /q "%%d"
del /s /q backend\*.pyc 2>nul
echo   [OK] Python cache eliminado

echo.
echo [2/5] Eliminando cache de Next.js
if exist "frontend\.next" rd /s /q "frontend\.next"
if exist "frontend\out" rd /s /q "frontend\out"
echo   [OK] Next.js cache eliminado

echo.
echo [3/5] Eliminando cache de npm
if exist "frontend\node_modules\.cache" rd /s /q "frontend\node_modules\.cache"
echo   [OK] npm cache eliminado

echo.
echo [4/5] Limpiando build cache de Docker
docker builder prune -af
echo   [OK] Docker cache limpiado

echo.
echo [5/5] Limpiando imágenes colgadas (dangling)
docker image prune -f
echo   [OK] Imágenes colgadas eliminadas

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

pause >nul
