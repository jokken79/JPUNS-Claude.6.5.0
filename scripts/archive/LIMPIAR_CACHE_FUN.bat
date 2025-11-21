@echo off
chcp 65001 >nul
title UNS-ClaudeJP 5.2 - LIMPIAR CACHE

color 0C

cls
echo.
echo                    ██████╗ ██╗   ██╗███████╗██╗  ██╗
echo                    ██╔══██╗██║   ██║██╔════╝██║  ██║
echo                    ██████╔╝██║   ██║███████╗███████║
echo                    ██╔═══╝ ██║   ██║╚════██║██╔══██║
echo                    ██║     ╚██████╔╝███████║██║  ██║
echo                    ╚═╝      ╚═════╝ ╚══════╝╚═╝  ╚═╝
echo.
echo                     UNS-ClaudeJP 5.2 - LIMPIEZA DE CACHE
echo                     🧹 ELIMINANDO ARCHIVOS INNECESARIOS 🧹
echo.
timeout /t 2 /nobreak >nul

echo ╔════════════════════════════════════════════════════════════╗
echo ║                 ℹ️ INFORMACIÓN IMPORTANTE ℹ️               ║
echo ╚════════════════════════════════════════════════════════════╝
echo.
echo Este script eliminará:
echo.
echo   📁 __pycache__/
echo      └─ Archivos compilados de Python
echo.
echo   📁 *.pyc
echo      └─ Bytecode de Python
echo.
echo   📁 .next/
echo      └─ Cache de compilación de Next.js
echo.
echo   📁 node_modules/.cache/
echo      └─ Cache de npm
echo.
echo   📁 Docker build cache
echo      └─ Imágenes colgadas (no usadas)
echo.
echo 💡 Después de limpiar, el siguiente build será más lento (first build)
echo    pero luego será mucho más rápido.
echo.
echo ╔════════════════════════════════════════════════════════════╗
echo.

set /p CONFIRMAR="¿Continuar con la limpieza? (S/N): "
if /i NOT "%CONFIRMAR%"=="S" (
    echo.
    echo ❌ Limpieza cancelada
    echo.
    pause
)

cd /d "%~dp0\.."

echo.
echo ╔════════════════════════════════════════════════════════════╗
echo ║             🧹 INICIANDO SECUENCIA DE LIMPIEZA 🧹         ║
echo ╚════════════════════════════════════════════════════════════╝
echo.

echo [1/5] 🐍 Eliminando __pycache__ de Python
echo   ⏳ Procesando...
for /d /r backend %%d in (__pycache__) do @if exist "%%d" rd /s /q "%%d"
del /s /q backend\*.pyc 2>nul
echo   ✅ Python cache eliminado
echo.

echo [2/5] 🎨 Eliminando cache de Next.js
echo   ⏳ Procesando...
if exist "frontend\.next" rd /s /q "frontend\.next"
if exist "frontend\out" rd /s /q "frontend\out"
echo   ✅ Next.js cache eliminado
echo.

echo [3/5] 📦 Eliminando cache de npm
echo   ⏳ Procesando...
if exist "frontend\node_modules\.cache" rd /s /q "frontend\node_modules\.cache"
echo   ✅ npm cache eliminado
echo.

echo [4/5] 🐳 Limpiando build cache de Docker
echo   ⏳ Procesando (esto puede tardar un poco)...
docker builder prune -af
echo   ✅ Docker build cache limpiado
echo.

echo [5/5] 🗑️  Eliminando imágenes colgadas (dangling)
echo   ⏳ Procesando...
docker image prune -f
echo   ✅ Imágenes colgadas eliminadas
echo.

echo ╔════════════════════════════════════════════════════════════╗
echo ║                                                            ║
echo ║         ✅ ¡LIMPIEZA COMPLETADA EXITOSAMENTE! ✅          ║
echo ║                                                            ║
echo ║    💾 ESPACIO LIBERADO - BUILD SERÁ MÁS RÁPIDO 💾        ║
echo ║                                                            ║
echo ╚════════════════════════════════════════════════════════════╝
echo.
echo 🚀 Próximo paso:
echo    Ejecuta: REINSTALAR_FUN.bat
echo    (El rebuild será notablemente más rápido)
echo.

pause

pause >nul
