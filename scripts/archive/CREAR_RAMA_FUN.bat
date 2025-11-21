@echo off
chcp 65001 >nul
setlocal EnableDelayedExpansion

color 0A
title UNS-ClaudeJP 5.2 - CREAR RAMA GIT

cls
echo.
echo ========================================================================
echo          UNS-ClaudeJP 5.4 - CREAR RAMA GIT
echo                 GESTION DE RAMAS
echo ========================================================================
echo.
timeout /t 2 /nobreak >nul

cd /d "%~dp0\.."

echo ========================================================================
echo             VERIFICANDO REPOSITORIO
echo ========================================================================
echo.

REM Verificar git
git --version >nul 2>&1
if %errorlevel% neq 0 (
    echo   ❌ Git no está instalado
    pause
)
echo   ✅ Git detectado
echo.

REM Rama actual
for /f "tokens=*" %%i in ('git rev-parse --abbrev-ref HEAD 2^>nul') do set CURRENT_BRANCH=%%i
echo   📍 Rama actual: !CURRENT_BRANCH!
echo.

REM Mostrar ramas existentes
echo   📋 Ramas existentes en el repositorio:
echo   ─────────────────────────────────────────────────────────
git branch -a | findstr /v "^  remotes"
echo   ─────────────────────────────────────────────────────────
echo.

echo ========================================================================
echo            SELECCIONA TIPO DE RAMA
echo ========================================================================
echo.
echo   1 - feature/  (Nueva funcionalidad)
echo   2 - bugfix/   (Corrección de bugs)
echo   3 - hotfix/   (Corrección urgente)
echo   4 - release/  (Preparar release)
echo   5 - custom    (Nombre personalizado)
echo.

choice /C 12345 /M "Selecciona tipo: "

if errorlevel 5 (
    set "PREFIJO="
    goto :custom_name
)
if errorlevel 4 (
    set "PREFIJO=release/"
    goto :input_name
)
if errorlevel 3 (
    set "PREFIJO=hotfix/"
    goto :input_name
)
if errorlevel 2 (
    set "PREFIJO=bugfix/"
    goto :input_name
)
if errorlevel 1 (
    set "PREFIJO=feature/"
    goto :input_name
)

:input_name
set /p NOMBRE="Nombre de la rama (ej: login-google): "
set "RAMA_COMPLETA=!PREFIJO!!NOMBRE!"
goto :crear_rama

:custom_name
set /p RAMA_COMPLETA="Nombre completo de rama (ej: experimental): "

:crear_rama
echo.
echo ╔════════════════════════════════════════════════════════════╗
echo ║              🔄 CREANDO RAMA !RAMA_COMPLETA! 🔄           ║
echo ╚════════════════════════════════════════════════════════════╝
echo.

REM Validar nombre
echo !RAMA_COMPLETA! | findstr /R "^[a-z0-9-]*$" >nul
if %errorlevel% neq 0 (
    echo   ❌ Nombre inválido. Usa solo minúsculas, números y guiones
    pause
)

echo   🔄 Descargando cambios de main...
for /L %%i in (1,1,10) do (
    <nul set /p ="█">nul
    timeout /t 0.1 /nobreak >nul
)
echo. [ACTUALIZADO]

git fetch origin >nul 2>&1

echo   ✅ Repositorio sincronizado
echo.

echo   🌳 Creando rama desde main...
for /L %%i in (1,1,15) do (
    <nul set /p ="█">nul
    timeout /t 0.05 /nobreak >nul
)
echo. [CREANDO]

git checkout -b !RAMA_COMPLETA! origin/main

if %errorlevel% EQU 0 (
    cls
    echo.
    echo ╔════════════════════════════════════════════════════════════╗
    echo ║                                                            ║
    echo ║        ✅ ¡RAMA CREADA EXITOSAMENTE! ✅                  ║
    echo ║                                                            ║
    echo ║           🌳 !RAMA_COMPLETA! LISTA PARA USAR 🌳          ║
    echo ║                                                            ║
    echo ╚════════════════════════════════════════════════════════════╝
    echo.
    echo   📊 INFORMACIÓN DE LA RAMA:
    echo   ─────────────────────────────────────────────────────────
    echo   • Nombre: !RAMA_COMPLETA!
    echo   • Creada desde: origin/main
    echo   • Estado: Activa (checked out)
    echo   ─────────────────────────────────────────────────────────
    echo.
    echo   💡 Próximos pasos:
    echo      1. Realiza tus cambios
    echo      2. Commit con: git commit -m "mensaje"
    echo      3. Sube con: PUSH_CAMBIOS_FUN.bat
    echo      4. Crea Pull Request en GitHub
    echo.
) else (
    echo.
    echo ╔════════════════════════════════════════════════════════════╗
    echo ║           ❌ ERROR AL CREAR LA RAMA ❌                    ║
    echo ╚════════════════════════════════════════════════════════════╝
    echo.
    echo   💡 Posibles causas:
    echo      1. La rama ya existe
    echo      2. Nombre inválido
    echo      3. Cambios sin guardar
    echo.
    echo   🔧 Intenta: git branch -a (para ver todas las ramas)
    echo.
)

echo.
pause >nul
