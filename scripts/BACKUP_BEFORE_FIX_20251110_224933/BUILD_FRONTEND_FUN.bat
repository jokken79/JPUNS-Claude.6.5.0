@echo off
chcp 65001 >nul
setlocal EnableDelayedExpansion

color 0A
title UNS-ClaudeJP 5.2 - BUILD FRONTEND

cls
echo.
echo ========================================================================
echo          UNS-ClaudeJP 5.4 - COMPILAR FRONTEND
echo                 NEXT.JS 16 + TURBOPACK
echo ========================================================================
echo.
timeout /t 2 /nobreak >nul

cd /d "%~dp0\.."

echo ========================================================================
echo           VERIFICANDO DEPENDENCIAS
echo ========================================================================
echo.

REM Verificar Docker
docker --version >nul 2>&1
if %errorlevel% neq 0 (
    echo   ❌ Docker no está instalado
    pause
    exit /b 1
)
echo   ✅ Docker detectado
echo.

REM Verificar docker-compose
docker compose version >nul 2>&1
if %errorlevel% neq 0 (
    docker-compose version >nul 2>&1
    if %errorlevel% neq 0 (
        echo   ❌ Docker Compose no encontrado
        pause
        exit /b 1
    )
    set "DC=docker-compose"
) else (
    set "DC=docker compose"
)
echo   ✅ Docker Compose detectado
echo.

REM Verificar frontend existe
if not exist "frontend" (
    echo   ❌ Carpeta frontend no encontrada
    pause
    exit /b 1
)
echo   ✅ Carpeta frontend existe
echo.

echo ========================================================================
echo          COMPILANDO FRONTEND (NEXT.JS 16)
echo ========================================================================
echo.
echo   💾 Este proceso compilará:
echo      • React 19.0.0 con Server Components
echo      • Next.js 16.0.0 con Turbopack (bundler por defecto)
echo      • TypeScript 5.6
echo      • Tailwind CSS 3.4
echo.
echo   ⏳ Puede tardar 3-10 minutos en la primera ejecución
echo.

set /p CONTINUAR="¿Continuar con la compilación? (S/N): "
if /i NOT "!CONTINUAR!"=="S" (
    echo.
    echo   ❌ Compilación cancelada
    pause
    exit /b 0
)

echo.
echo   🔄 Construyendo imagen Docker del frontend...
echo.

%DC% build --no-cache frontend

if %errorlevel% neq 0 (
    echo.
    echo ========================================================================
    echo        ERROR DURANTE LA COMPILACION
    echo ========================================================================
    echo.
    echo   💡 Soluciones:
    echo      1. Revisa los logs arriba
    echo      2. Intenta: LIMPIAR_CACHE_FUN.bat
    echo      3. Luego reintenta BUILD_FRONTEND_FUN.bat
    echo.
    pause
    exit /b 1
)

cls
echo.
echo ========================================================================
echo
echo     FRONTEND COMPILADO EXITOSAMENTE!
echo
echo  NEXT.JS 16 CON TURBOPACK LISTO PARA USAR
echo
echo ========================================================================
echo.
echo   📊 INFORMACIÓN DE LA COMPILACIÓN:
echo   ─────────────────────────────────────────────────────────
echo   • Framework: Next.js 16.0.0
echo   • Bundler: Turbopack (defecto en v16)
echo   • React: 19.0.0 (Server Components)
echo   • TypeScript: 5.6
echo   • CSS: Tailwind 3.4
echo   ─────────────────────────────────────────────────────────
echo.
echo   💡 Próximos pasos:
echo      1. Para iniciar: START_FUN.bat
echo      2. Frontend estará en: http://localhost:3000
echo      3. Si hay cambios en deps: npm install
echo.

echo.
pause >nul
