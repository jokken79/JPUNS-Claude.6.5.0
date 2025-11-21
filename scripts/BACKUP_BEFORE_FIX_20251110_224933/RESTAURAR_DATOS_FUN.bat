@echo off
chcp 65001 >nul
title UNS-ClaudeJP 5.2 - RESTAURAR DATOS

cls
echo.
echo ╔════════════════════════════════════════════════════════════╗
echo ║                                                            ║
echo ║           📥 SISTEMA DE RESTAURACIÓN DE DATOS 📥           ║
echo ║                                                            ║
echo ║         UNS-ClaudeJP 5.2 - RECUPERACIÓN DE BACKUP        ║
echo ║                                                            ║
echo ╚════════════════════════════════════════════════════════════╝
echo.

timeout /t 2 /nobreak >nul

echo ╔════════════════════════════════════════════════════════════╗
echo ║              🔍 VERIFICANDO ARCHIVO DE BACKUP 🔍          ║
echo ╚════════════════════════════════════════════════════════════╝
echo.

REM Verificar que existe el backup
if not exist "%~dp0..\backend\backups\production_backup.sql" (
    echo ❌ ¡ARCHIVO DE BACKUP NO ENCONTRADO!
    echo.
    echo 📁 Ubicación esperada:
    echo    backend\backups\production_backup.sql
    echo.
    echo 💡 SOLUCIÓN:
    echo    1. Ejecuta primero: scripts\BACKUP_DATOS_FUN.bat
    echo    2. Luego vuelve a ejecutar este script
    echo.
    timeout /t 3 /nobreak >nul
    pause
    exit /b 1
)

echo ✅ Archivo de backup encontrado
echo 📁 Ubicación: backend\backups\production_backup.sql
echo.
timeout /t 1 /nobreak >nul

echo ╔════════════════════════════════════════════════════════════╗
echo ║           ⚠️  ADVERTENCIA DE RESTAURACIÓN ⚠️              ║
echo ╚════════════════════════════════════════════════════════════╝
echo.
echo 🚨 ESTA ACCIÓN SOBRESCRIBIRÁ LA BASE DE DATOS ACTUAL
echo.
echo   • Se eliminarán TODOS los datos actuales
echo   • Se restaurarán los datos del backup
echo   • El sistema se reiniciará después
echo.

set "CONFIRMAR="
:confirm
set /p CONFIRMAR="¿Estás seguro? (S/N): "
if /i NOT "%CONFIRMAR%"=="S" (
    echo.
    echo ❌ Restauración cancelada
    echo.
    pause
    exit /b 0
)

echo.
echo ╔════════════════════════════════════════════════════════════╗
echo ║            📥 FASE 1: PREPARANDO RESTAURACIÓN 📥          ║
echo ╚════════════════════════════════════════════════════════════╝
echo.
echo   🛑 Deteniendo servicios...
for /L %%i in (1,1,10) do (
    <nul set /p ="■">nul
    timeout /t 0.1 /nobreak >nul
)
echo. [LISTO]

docker-compose --profile dev down 2>nul
docker compose --profile dev down 2>nul

echo   ✅ Servicios detenidos
echo.
timeout /t 1 /nobreak >nul

echo ╔════════════════════════════════════════════════════════════╗
echo ║           📥 FASE 2: RESTAURANDO BASE DE DATOS 📥         ║
echo ╚════════════════════════════════════════════════════════════╝
echo.
echo   🗄️  Iniciando servicio de base de datos...
for /L %%i in (1,1,15) do (
    <nul set /p ="█">nul
    timeout /t 0.1 /nobreak >nul
)
echo. [INICIADO]

docker-compose --profile dev up -d db 2>nul
docker compose --profile dev up -d db 2>nul

echo   ⏳ Esperando que PostgreSQL esté listo...
timeout /t 15 /nobreak >nul

echo   📥 Restaurando datos del backup...
for /L %%i in (1,1,20) do (
    <nul set /p ="█">nul
    timeout /t 0.1 /nobreak >nul
)
echo. [PROCESANDO]

docker exec -i uns-claudejp-600-db psql -U uns_admin -d uns_claudejp < "%~dp0..\backend\backups\production_backup.sql"

if %ERRORLEVEL% EQU 0 (
    echo   ✅ Datos restaurados exitosamente
) else (
    echo   ❌ Error durante la restauración
    echo.
    echo 💡 Intenta:
    echo    1. Verifica que PostgreSQL está corriendo
    echo    2. Usa: docker logs uns-claudejp-600-db
    echo    3. Revisa el archivo de backup
    echo.
    pause
    exit /b 1
)
echo.
timeout /t 1 /nobreak >nul

echo ╔════════════════════════════════════════════════════════════╗
echo ║           ✅ FASE 3: REINICIANDO SERVICIOS ✅             ║
echo ╚════════════════════════════════════════════════════════════╝
echo.
echo   🚀 Iniciando todos los servicios...
for /L %%i in (1,1,15) do (
    <nul set /p ="█">nul
    timeout /t 0.1 /nobreak >nul
)
echo. [INICIADO]

docker-compose --profile dev up -d --remove-orphans 2>nul
docker compose --profile dev up -d --remove-orphans 2>nul

echo   ⏳ Esperando estabilización (30 segundos)...
timeout /t 30 /nobreak >nul

echo.
echo ╔════════════════════════════════════════════════════════════╗
echo ║                                                            ║
echo ║      ✅ ¡RESTAURACIÓN COMPLETADA EXITOSAMENTE! ✅         ║
echo ║                                                            ║
echo ║          🟢 TODOS LOS DATOS RESTAURADOS 🟢                ║
echo ║                                                            ║
echo ╚════════════════════════════════════════════════════════════╝
echo.
echo 📊 ESTADO DE SERVICIOS:
echo ─────────────────────────────────────────────────────────
docker-compose ps 2>nul
docker compose ps 2>nul
echo ─────────────────────────────────────────────────────────
echo.
echo 🌐 ACCESO:
echo    • Frontend:   http://localhost:3000
echo    • API Docs:   http://localhost:8000/api/docs
echo.

pause

pause >nul
