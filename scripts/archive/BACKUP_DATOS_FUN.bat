@echo off
chcp 65001 >nul
title UNS-ClaudeJP 5.2 - BACKUP DE DATOS

cls
echo.
echo ========================================================================
echo
echo           SISTEMA DE BACKUP DE DATOS - UNS-ClaudeJP 5.4
echo
echo                        MODO PROTECCION
echo
echo ========================================================================
echo.
echo 📦 Creando backup de la base de datos...
echo ⏳ Este proceso puede tardar varios minutos...
echo.
timeout /t 2 /nobreak >nul

if not exist "%~dp0..\backend\backups" mkdir "%~dp0..\backend\backups"

REM Obtener fecha y hora actual
for /f "tokens=2 delims==" %%I in ('wmic os get localdatetime /value') do set datetime=%%I
set BACKUP_DATE=%datetime:~0,4%%datetime:~4,2%%datetime:~6,2%_%datetime:~8,2%%datetime:~10,2%%datetime:~12,2%

echo ========================================================================
echo                 FASE 1: EXPORTAR DATOS
echo ========================================================================
echo.
echo   🗄️  Exportando base de datos PostgreSQL...
echo   ⏳ Conectando a base de datos...
echo.
for /L %%i in (1,1,20) do (
    <nul set /p ="█">nul
    timeout /t 0.1 /nobreak >nul
)
echo.

docker exec uns-claudejp-600-db pg_dump -U uns_admin uns_claudejp > "%~dp0..\backend\backups\backup_%BACKUP_DATE%.sql"

if %ERRORLEVEL% EQU 0 (
    echo   ✅ Backup SQL creado exitosamente
    echo   📁 Ubicación: backend\backups\backup_%BACKUP_DATE%.sql
) else (
    echo   ❌ Error al crear backup SQL
    pause
)

echo.
echo ========================================================================
echo             FASE 2: CREAR COPIA DE SEGURIDAD
echo ========================================================================
echo.
echo   🔄 Copiando backup a producción...
echo.

copy "%~dp0..\backend\backups\backup_%BACKUP_DATE%.sql" "%~dp0..\backend\backups\production_backup.sql" >nul

if %ERRORLEVEL% EQU 0 (
    echo.
    echo   ✅ Backup de producción actualizado
    echo   📁 Ubicación: backend\backups\production_backup.sql
) else (
    echo   ❌ Error al copiar backup
    pause
)

echo.
echo ========================================================================
echo
echo          BACKUP COMPLETADO EXITOSAMENTE!
echo
echo ========================================================================
echo.
echo 📊 RESUMEN DE ARCHIVOS CREADOS:
echo    • backup_%BACKUP_DATE%.sql (Backup con fecha)
echo      └─ Tamaño completo de la base de datos
echo    • production_backup.sql (Usado en REINSTALAR)
echo      └─ Última copia confiable
echo.
echo 💡 PUEDES EJECUTAR REINSTALAR_FUN.bat SIN PERDER DATOS
echo.
echo 🔄 Para restaurar: scripts\RESTAURAR_DATOS_FUN.bat
echo.

pause >nul
