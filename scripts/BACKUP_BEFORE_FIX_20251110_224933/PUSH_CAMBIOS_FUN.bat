@echo off
chcp 65001 >nul
setlocal EnableDelayedExpansion

color 0C
title UNS-ClaudeJP 5.2 - GIT PUSH (SUBIR CAMBIOS)

cls
echo.
echo                    ██████╗ ██╗   ██╗███████╗██╗  ██╗
echo                    ██╔══██╗██║   ██║██╔════╝██║  ██║
echo                    ██████╔╝██║   ██║███████╗███████║
echo                    ██╔═══╝ ██║   ██║╚════██║██╔══██║
echo                    ██║     ╚██████╔╝███████║██║  ██║
echo                    ╚═╝      ╚═════╝ ╚══════╝╚═╝  ╚═╝
echo.
echo                UNS-ClaudeJP 5.2 - SUBIR CAMBIOS A GITHUB
echo                   📤 GIT PUSH - SINCRONIZACIÓN 📤
echo.
timeout /t 2 /nobreak >nul

cd /d "%~dp0\.."

echo ╔════════════════════════════════════════════════════════════╗
echo ║           🔍 ANALIZANDO CAMBIOS LOCALES 🔍                ║
echo ╚════════════════════════════════════════════════════════════╝
echo.

REM Verificar git
git --version >nul 2>&1
if %errorlevel% neq 0 (
    echo   ❌ Git no está instalado
    pause
    exit /b 1
)

REM Rama actual
for /f "tokens=*" %%i in ('git rev-parse --abbrev-ref HEAD 2^>nul') do set CURRENT_BRANCH=%%i
echo   📍 Rama actual: !CURRENT_BRANCH!
echo.

REM Cambios sin staged
git diff --quiet --cached
if %errorlevel% neq 0 (
    echo   📝 Cambios no staged (sin agregar):
    git diff --name-only
    echo.
)

REM Status
git status --short | find /v "" >nul
if %errorlevel% EQU 0 (
    echo   📊 Estado de archivos:
    echo   ─────────────────────────────────────────────────────────
    git status --short
    echo   ─────────────────────────────────────────────────────────
    echo.
) else (
    echo   ✅ Repositorio limpio (nada por subir)
    echo.
    pause
    exit /b 0
)

echo ╔════════════════════════════════════════════════════════════╗
echo ║            🔐 PREPARANDO PARA SUBIR CAMBIOS 🔐            ║
echo ╚════════════════════════════════════════════════════════════╝
echo.

set /p AGREGAR="¿Agregar TODOS los cambios? (S/N): "
if /i NOT "!AGREGAR!"=="S" (
    echo   ℹ️  Uso manual: git add [archivos]
    pause
    exit /b 0
)

echo   ⏳ Agregando archivos...
for /L %%i in (1,1,10) do (
    <nul set /p ="■">nul
    timeout /t 0.1 /nobreak >nul
)
echo. [AGREGADOS]

git add .
echo   ✅ Cambios agregados
echo.

set /p MENSAJE="Mensaje de commit (ej: 'Fix: corregir bug X'): "
if "!MENSAJE!"=="" (
    echo   ❌ El mensaje no puede estar vacío
    pause
    exit /b 1
)

echo.
echo ╔════════════════════════════════════════════════════════════╗
echo ║               📤 SUBIENDO CAMBIOS A GITHUB 📤              ║
echo ╚════════════════════════════════════════════════════════════╝
echo.

echo   💾 Creando commit: "!MENSAJE!"
for /L %%i in (1,1,15) do (
    <nul set /p ="█">nul
    timeout /t 0.05 /nobreak >nul
)
echo. [COMMIT CREADO]

git commit -m "!MENSAJE!"

if %errorlevel% neq 0 (
    echo   ❌ Error al crear commit
    pause
    exit /b 1
)
echo   ✅ Commit creado
echo.

echo   📤 Subiendo a origin/!CURRENT_BRANCH!...
for /L %%i in (1,1,20) do (
    <nul set /p ="█">nul
    timeout /t 0.05 /nobreak >nul
)
echo. [SUBIENDO]
echo.

git push origin !CURRENT_BRANCH!

if %errorlevel% EQU 0 (
    cls
    echo.
    echo ╔════════════════════════════════════════════════════════════╗
    echo ║                                                            ║
    echo ║        ✅ ¡PUSH COMPLETADO EXITOSAMENTE! ✅              ║
    echo ║                                                            ║
    echo ║         📤 CAMBIOS SUBIDOS A GITHUB CORRECTAMENTE 📤     ║
    echo ║                                                            ║
    echo ╚════════════════════════════════════════════════════════════╝
    echo.
    echo   📊 INFORMACIÓN DEL PUSH:
    echo   ─────────────────────────────────────────────────────────
    echo   • Rama: !CURRENT_BRANCH!
    echo   • Mensaje: !MENSAJE!
    echo   • Estado: Sincronizado con GitHub
    echo   ─────────────────────────────────────────────────────────
    echo.
    echo   💡 Próximos pasos:
    echo      1. Abre GitHub para crear Pull Request si es necesario
    echo      2. Revisa los cambios en el repositorio
    echo      3. Notifica al equipo de los cambios
    echo.
) else (
    echo.
    echo ╔════════════════════════════════════════════════════════════╗
    echo ║             ❌ ERROR DURANTE EL GIT PUSH ❌                ║
    echo ╚════════════════════════════════════════════════════════════╝
    echo.
    echo   💡 Causas comunes:
    echo      1. Remote rechazó: hay cambios remotos no descargados
    echo      2. Permisos: verifica acceso al repositorio
    echo      3. Red: comprueba tu conexión a internet
    echo.
    echo   🔧 Solución: ejecuta PULL_CAMBIOS_FUN.bat primero
    echo.
)

echo.
pause >nul
