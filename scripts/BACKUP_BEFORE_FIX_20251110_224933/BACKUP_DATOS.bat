@echo off
chcp 65001 >nul
echo.
echo ========================================================================
echo           BACKUP DE DATOS - UNS-ClaudeJP 5.4
echo ========================================================================
echo.
echo 📦 Creando backup de la base de datos...
echo.

REM Crear carpeta de backups si no existe
if not exist "%~dp0..\backend\backups" mkdir "%~dp0..\backend\backups"

REM Obtener fecha y hora actual para el nombre del archivo
for /f "tokens=2 delims==" %%I in ('wmic os get localdatetime /value') do set datetime=%%I
set BACKUP_DATE=%datetime:~0,4%%datetime:~4,2%%datetime:~6,2%_%datetime:~8,2%%datetime:~10,2%%datetime:~12,2%

REM Crear backup SQL
echo 1️⃣  Exportando base de datos PostgreSQL...
docker exec uns-claudejp-600-db pg_dump -U uns_admin uns_claudejp > "%~dp0..\backend\backups\backup_%BACKUP_DATE%.sql"

if %ERRORLEVEL% EQU 0 (
    echo ✅ Backup SQL creado: backend\backups\backup_%BACKUP_DATE%.sql
) else (
    echo ❌ Error al crear backup SQL
    pause
    exit /b 1
)

echo.
echo 2️⃣  Copiando backup a carpeta de producción...
copy "%~dp0..\backend\backups\backup_%BACKUP_DATE%.sql" "%~dp0..\backend\backups\production_backup.sql" >nul

if %ERRORLEVEL% EQU 0 (
    echo ✅ Backup de producción actualizado: backend\backups\production_backup.sql
    echo.
    echo ========================================================================
    echo                    BACKUP COMPLETADO EXITOSAMENTE
    echo ========================================================================
    echo.
    echo 📁 Archivos creados:
    echo    - backend\backups\backup_%BACKUP_DATE%.sql (backup con fecha)
    echo    - backend\backups\production_backup.sql (usado en REINSTALAR)
    echo.
    echo 💡 Ahora puedes ejecutar REINSTALAR.bat sin perder tus datos
    echo.
) else (
    echo ❌ Error al copiar backup
)

pause

pause >nul
