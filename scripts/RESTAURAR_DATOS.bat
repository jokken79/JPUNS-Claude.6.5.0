@echo off
chcp 65001 >nul
echo.
echo ╔═══════════════════════════════════════════════════════════════╗
echo ║        📥 RESTAURAR DATOS - UNS-ClaudeJP 5.2                 ║
echo ╚═══════════════════════════════════════════════════════════════╝
echo.

REM Verificar que existe el backup
if not exist "%~dp0..\backend\backups\production_backup.sql" (
    echo ❌ No se encontró el archivo de backup: backend\backups\production_backup.sql
    echo.
    echo 💡 Primero ejecuta BACKUP_DATOS.bat para crear un backup
    echo.
    pause
)

echo 📦 Archivo de backup encontrado
echo 📁 Ubicación: backend\backups\production_backup.sql
echo.
echo ⚠️  ADVERTENCIA: Esta operación reemplazará TODOS los datos actuales
echo.
set /p CONFIRM="¿Estás seguro de que deseas continuar? (S/N): "

if /i not "%CONFIRM%"=="S" (
    echo.
    echo ❌ Operación cancelada
    pause
)

echo.
echo 🔄 Restaurando base de datos...
echo.

REM Restaurar el backup
docker exec -i uns-claudejp-600-db psql -U uns_admin uns_claudejp < "%~dp0..\backend\backups\production_backup.sql"

if %ERRORLEVEL% EQU 0 (
    echo.
    echo ╔═══════════════════════════════════════════════════════════════╗
    echo ║              ✅ DATOS RESTAURADOS EXITOSAMENTE                ║
    echo ╚═══════════════════════════════════════════════════════════════╝
    echo.
    echo 💡 Todos tus datos han sido restaurados desde el backup
    echo.
) else (
    echo ❌ Error al restaurar los datos
)

pause

pause >nul
