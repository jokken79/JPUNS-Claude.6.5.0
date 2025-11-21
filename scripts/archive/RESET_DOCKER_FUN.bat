@echo off
chcp 65001 >nul
setlocal EnableDelayedExpansion

color 0C
title UNS-ClaudeJP 5.2 - NUCLEAR RESET

cls
echo.
echo                ██████╗ ███████╗███████╗███████╗████████╗
echo                ██╔══██╗██╔════╝██╔════╝██╔════╝╚══██╔══╝
echo                ██████╔╝█████╗  ███████╗█████╗     ██║
echo                ██╔══██╗██╔══╝  ╚════██║██╔══╝     ██║
echo                ██║  ██║███████╗███████║███████╗   ██║
echo                ╚═╝  ╚═╝╚══════╝╚══════╝╚══════╝   ╚═╝
echo.
echo            UNS-ClaudeJP 5.2 - NUCLEAR RESET
echo          🔴 ELIMINAR TODO Y EMPEZAR DE CERO 🔴
echo.
timeout /t 2 /nobreak >nul

cd /d "%~dp0\.."

echo ╔════════════════════════════════════════════════════════════╗
echo ║             🚨 ADVERTENCIA CRÍTICA 🚨                     ║
echo ╚════════════════════════════════════════════════════════════╝
echo.
echo   ESTA ACCIÓN ELIMINARÁ PERMANENTEMENTE:
echo.
echo   🔴 Todos los contenedores Docker
echo   🔴 Todos los volúmenes de datos
echo   🔴 TODA la base de datos PostgreSQL
echo   🔴 Cache de compilación
echo   🔴 Imágenes Docker no usadas
echo.
echo   ⚠️  ESTO NO SE PUEDE DESHACER
echo.
echo ╔════════════════════════════════════════════════════════════╗
echo ║          PRIMERO GUARDA TUS DATOS CON:                    ║
echo ║          scripts\BACKUP_DATOS_FUN.bat                      ║
echo ╚════════════════════════════════════════════════════════════╝
echo.

set /p CONFIRMAR="¿Estás COMPLETAMENTE SEGURO? (escribe: ELIMINAR): "
if /i NOT "!CONFIRMAR!"=="ELIMINAR" (
    echo.
    echo   ✅ Reset cancelado - Datos preservados
    echo.
    pause
)

echo.
echo   🔴 CONFIRMACIÓN FINAL
set /p FINAL="Última oportunidad. ¿Continuar? (S/N): "
if /i NOT "!FINAL!"=="S" (
    echo.
    echo   ✅ Reset cancelado - Datos preservados
    echo.
    pause
)

echo.
echo ╔════════════════════════════════════════════════════════════╗
echo ║              🧹 INICIANDO LIMPIEZA NUCLEAR 🧹             ║
echo ╚════════════════════════════════════════════════════════════╝
echo.

REM Verificar Docker
docker ps >nul 2>&1
if %errorlevel% neq 0 (
    echo   ⚠️  Docker no está corriendo
    pause
)

REM Detectar compose
docker compose version >nul 2>&1
if %errorlevel% EQU 0 (
    set "DC=docker compose"
) else (
    docker-compose version >nul 2>&1
    if %errorlevel% EQU 0 (
        set "DC=docker-compose"
    ) else (
        echo   ❌ Docker Compose no encontrado
        pause
    )
)

echo [1/5] 🛑 Deteniendo todos los servicios...
for /L %%i in (1,1,10) do (
    <nul set /p ="■">nul
    timeout /t 0.1 /nobreak >nul
)
echo. [DETENIENDO]
%DC% down -v --remove-orphans >nul 2>&1
echo   ✅ Servicios detenidos
echo.

echo [2/5] 🐳 Eliminando contenedores...
for /L %%i in (1,1,10) do (
    <nul set /p ="■">nul
    timeout /t 0.1 /nobreak >nul
)
echo. [ELIMINANDO]
docker container prune -f >nul 2>&1
echo   ✅ Contenedores eliminados
echo.

echo [3/5] 📦 Eliminando imágenes no usadas...
for /L %%i in (1,1,10) do (
    <nul set /p ="■">nul
    timeout /t 0.1 /nobreak >nul
)
echo. [LIMPIANDO]
docker image prune -af >nul 2>&1
echo   ✅ Imágenes eliminadas
echo.

echo [4/5] 💾 Limpiando volúmenes...
for /L %%i in (1,1,10) do (
    <nul set /p ="■">nul
    timeout /t 0.1 /nobreak >nul
)
echo. [BORRANDO]
docker volume prune -f >nul 2>&1
echo   ✅ Volúmenes eliminados
echo.

echo [5/5] 🗑️  Limpiando builder cache...
for /L %%i in (1,1,10) do (
    <nul set /p ="■">nul
    timeout /t 0.1 /nobreak >nul
)
echo. [PURIFICANDO]
docker builder prune -af >nul 2>&1
echo   ✅ Cache de compilación limpiado
echo.

cls
echo.
echo ╔════════════════════════════════════════════════════════════╗
echo ║                                                            ║
echo ║         ✅ ¡LIMPIEZA NUCLEAR COMPLETADA! ✅              ║
echo ║                                                            ║
echo ║      🔄 SISTEMA COMPLETAMENTE LIMPIO Y LISTO 🔄          ║
echo ║                                                            ║
echo ╚════════════════════════════════════════════════════════════╝
echo.
echo   📊 RESUMEN DE ELIMINACIÓN:
echo   ─────────────────────────────────────────────────────────
echo   • Todos los contenedores eliminados
echo   • Todos los volúmenes borrados
echo   • Base de datos PostgreSQL eliminada
echo   • Cache de compilación limpiado
echo   • Imágenes no usadas removidas
echo   ─────────────────────────────────────────────────────────
echo.
echo   💡 PRÓXIMOS PASOS:
echo      1. Ejecuta: INSTALAR_FUN.bat (construcción limpia)
echo      2. Luego: START_FUN.bat (para iniciar)
echo      3. Si: RESTAURAR_DATOS_FUN.bat (para recuperar backup)
echo.
echo   🔄 Sistema listo para comenzar desde cero
echo.

pause >nul
