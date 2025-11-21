@echo off
chcp 65001 >nul
setlocal EnableDelayedExpansion

color 0B
title UNS-ClaudeJP 5.2 - GIT PULL (DESCARGAR CAMBIOS)

cls
echo.
echo                    ██████╗ ██╗   ██╗██╗     ██╗
echo                    ██╔══██╗██║   ██║██║     ██║
echo                    ██████╔╝██║   ██║██║     ██║
echo                    ██╔═══╝ ██║   ██║██║     ██║
echo                    ██║     ╚██████╔╝███████╗███████╗
echo                    ╚═╝      ╚═════╝ ╚══════╝╚══════╝
echo.
echo                UNS-ClaudeJP 5.2 - DESCARGAR CAMBIOS DE GITHUB
echo                  📥 GIT PULL - SINCRONIZACIÓN 📥
echo.
timeout /t 2 /nobreak >nul

cd /d "%~dp0\.."

echo ╔════════════════════════════════════════════════════════════╗
echo ║           🔍 VERIFICANDO ESTADO DEL REPOSITORIO 🔍        ║
echo ╚════════════════════════════════════════════════════════════╝
echo.

REM Verificar git
git --version >nul 2>&1
if %errorlevel% neq 0 (
    echo   ❌ Git no está instalado
    echo   💡 Descarga desde: https://git-scm.com/download/win
    pause
)
echo   ✅ Git detectado
echo.

REM Mostrar rama actual
for /f "tokens=*" %%i in ('git rev-parse --abbrev-ref HEAD 2^>nul') do set CURRENT_BRANCH=%%i
echo   📍 Rama actual: !CURRENT_BRANCH!
echo.

REM Verificar cambios locales sin guardar
git diff --quiet
if %errorlevel% neq 0 (
    echo   ⚠️  Hay cambios sin guardar en archivos
    echo.
    echo ╔════════════════════════════════════════════════════════════╗
    echo ║            ⚠️  CAMBIOS LOCALES NO GUARDADOS ⚠️            ║
    echo ╚════════════════════════════════════════════════════════════╝
    echo.
    echo   Los siguientes archivos han sido modificados:
    echo   ─────────────────────────────────────────────────────────
    git status --short
    echo   ─────────────────────────────────────────────────────────
    echo.
    set /p CONTINUAR="¿Descartar cambios locales y continuar? (S/N): "
    if /i NOT "!CONTINUAR!"=="S" (
        echo.
        echo   ❌ Operación cancelada
        pause
    )
    echo.
    echo   🔄 Descartando cambios locales...
    git checkout -- .
    echo   ✅ Cambios descartados
    echo.
) else (
    echo   ✅ No hay cambios sin guardar
    echo.
)

echo ╔════════════════════════════════════════════════════════════╗
echo ║              📥 DESCARGANDO CAMBIOS DE GITHUB 📥          ║
echo ╚════════════════════════════════════════════════════════════╝
echo.
echo   🔄 Conectando con GitHub...
for /L %%i in (1,1,20) do (
    <nul set /p ="█">nul
    timeout /t 0.05 /nobreak >nul
)
echo. [CONECTADO]
echo.

echo   📦 Descargando cambios de origin/!CURRENT_BRANCH!...
echo.

git pull origin !CURRENT_BRANCH!

if %errorlevel% EQU 0 (
    cls
    echo.
    echo ╔════════════════════════════════════════════════════════════╗
    echo ║                                                            ║
    echo ║        ✅ ¡PULL COMPLETADO EXITOSAMENTE! ✅              ║
    echo ║                                                            ║
    echo ║          📥 CAMBIOS DESCARGADOS CORRECTAMENTE 📥         ║
    echo ║                                                            ║
    echo ╚════════════════════════════════════════════════════════════╝
    echo.
    echo   📊 ESTADÍSTICAS DE CAMBIOS:
    echo   ─────────────────────────────────────────────────────────
    git log origin/!CURRENT_BRANCH!..HEAD --oneline 2>nul | find /c /v "" >nul
    echo.
    echo   📍 Rama: !CURRENT_BRANCH!
    echo   ✅ Estado: Sincronizado con GitHub
    echo.
    echo   💡 Próximos pasos:
    echo      1. Si hay cambios en dependencias: npm install (frontend)
    echo      2. Si hay cambios en BD: REINSTALAR_FUN.bat
    echo      3. Si cambios simples: START_FUN.bat
    echo.
) else (
    echo.
    echo ╔════════════════════════════════════════════════════════════╗
    echo ║             ❌ ERROR DURANTE EL GIT PULL ❌                ║
    echo ╚════════════════════════════════════════════════════════════╝
    echo.
    echo   💡 Soluciones comunes:
    echo      1. Conflictos de merge: resuelve manualmente y commit
    echo      2. Permisos: verifica acceso a GitHub
    echo      3. Red: comprueba tu conexión a internet
    echo.
)

echo.
pause >nul
