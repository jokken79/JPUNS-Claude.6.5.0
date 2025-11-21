@echo off
chcp 65001 >nul
REM ====================================================================
REM BACKUP.bat - Script automatizado de backup del sistema
REM UNS-ClaudeJP 5.2
REM ====================================================================

echo.
echo ========================================================================
echo   💾 UNS-ClaudeJP 5.2 - Backup Automatizado
echo ========================================================================
echo.

REM ====================================================================
REM CONFIGURACIÓN
REM ====================================================================

REM Directorio de backups (crear en raíz del proyecto)
set BACKUP_DIR=backups
set TIMESTAMP=%date:~-4%%date:~3,2%%date:~0,2%_%time:~0,2%%time:~3,2%%time:~6,2%
set TIMESTAMP=%TIMESTAMP: =0%

REM Nombre del backup
set BACKUP_NAME=uns-claudejp-backup_%TIMESTAMP%

REM ====================================================================
REM 1. CREAR DIRECTORIO DE BACKUPS
REM ====================================================================

echo [1/5] Creando directorio de backups...
echo.

if not exist "%BACKUP_DIR%" (
    mkdir "%BACKUP_DIR%"
    echo ✅ Directorio creado: %BACKUP_DIR%
) else (
    echo ✅ Directorio ya existe: %BACKUP_DIR%
)

echo.
pause

REM ====================================================================
REM 2. BACKUP DE BASE DE DATOS
REM ====================================================================

echo.
echo [2/5] Realizando backup de base de datos PostgreSQL...
echo.

REM Verificar que PostgreSQL está corriendo
docker ps | findstr "uns-claudejp-600-db" >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ ERROR: PostgreSQL no está corriendo
    echo    Ejecutar primero: docker-compose up -d
    pause
    exit /b 1
)

REM Backup de PostgreSQL
echo 📦 Exportando base de datos...
docker exec uns-claudejp-600-db pg_dump -U uns_admin uns_claudejp > "%BACKUP_DIR%\%BACKUP_NAME%_database.sql"

if %errorlevel% equ 0 (
    echo ✅ Backup de base de datos completado
    for %%A in ("%BACKUP_DIR%\%BACKUP_NAME%_database.sql") do (
        echo    Tamaño: %%~zA bytes
    )
) else (
    echo ❌ ERROR: Backup de base de datos falló
)

echo.
pause

REM ====================================================================
REM 3. BACKUP DE ARCHIVOS DEL PROYECTO
REM ====================================================================

echo.
echo [3/5] Realizando backup de archivos del proyecto...
echo.

REM Verificar si 7z está instalado
where 7z >nul 2>&1
if %errorlevel% neq 0 (
    echo ⚠️  7-Zip no encontrado
    echo    Instalando con tar (más lento)...

    REM Usar tar (incluido en Windows 10+)
    tar -czf "%BACKUP_DIR%\%BACKUP_NAME%_files.tar.gz" ^
        --exclude=node_modules ^
        --exclude=.git ^
        --exclude=.next ^
        --exclude=dist ^
        --exclude=build ^
        --exclude=.playwright-mcp ^
        --exclude=backups ^
        --exclude=LIXO ^
        . 2>nul

    if %errorlevel% equ 0 (
        echo ✅ Backup de archivos completado (tar.gz)
        for %%A in ("%BACKUP_DIR%\%BACKUP_NAME%_files.tar.gz") do (
            echo    Tamaño: %%~zA bytes
        )
    ) else (
        echo ❌ ERROR: Backup con tar falló
    )
) else (
    echo 📦 Comprimiendo archivos con 7-Zip (alta compresión)...

    7z a -t7z -mx=9 "%BACKUP_DIR%\%BACKUP_NAME%_files.7z" ^
        -x!node_modules ^
        -x!.git ^
        -x!.next ^
        -x!dist ^
        -x!build ^
        -x!.playwright-mcp ^
        -x!backups ^
        -x!LIXO ^
        . >nul 2>&1

    if %errorlevel% equ 0 (
        echo ✅ Backup de archivos completado (7z)
        for %%A in ("%BACKUP_DIR%\%BACKUP_NAME%_files.7z") do (
            echo    Tamaño: %%~zA bytes
        )
    ) else (
        echo ❌ ERROR: Backup con 7-Zip falló
    )
)

echo.
pause

REM ====================================================================
REM 4. BACKUP DE ARCHIVO DE FOTOS (SI EXISTE)
REM ====================================================================

echo.
echo [4/5] Verificando archivo de fotos...
echo.

if exist "access_photo_mappings.json" (
    echo 📸 Copiando access_photo_mappings.json...
    copy /Y "access_photo_mappings.json" "%BACKUP_DIR%\%BACKUP_NAME%_photos.json" >nul

    if %errorlevel% equ 0 (
        echo ✅ Backup de fotos completado
        for %%A in ("%BACKUP_DIR%\%BACKUP_NAME%_photos.json") do (
            echo    Tamaño: %%~zA bytes
        )
    ) else (
        echo ❌ ERROR: Copia de fotos falló
    )
) else (
    echo ⚠️  access_photo_mappings.json no encontrado (omitiendo)
)

echo.
pause

REM ====================================================================
REM 5. BACKUP DE ARCHIVO .env (CUIDADO: CONTIENE SECRETS)
REM ====================================================================

echo.
echo [5/5] Backup de configuración (.env)...
echo.

if exist ".env" (
    echo ⚠️  ADVERTENCIA: .env contiene passwords y API keys
    echo.
    choice /C SN /M "¿Incluir .env en backup? (S=Sí, N=No - recomendado)"

    if errorlevel 2 (
        echo ⏭️  .env omitido del backup (recomendado)
    ) else (
        echo 🔐 Copiando .env (MANTENER SEGURO)...
        copy /Y ".env" "%BACKUP_DIR%\%BACKUP_NAME%_env.txt" >nul

        if %errorlevel% equ 0 (
            echo ✅ .env respaldado
            echo    ⚠️  ADVERTENCIA: Archivo contiene secrets
            echo    ⚠️  NO subir a GitHub ni compartir públicamente
        )
    )
) else (
    echo ⚠️  .env no encontrado
)

echo.
pause

REM ====================================================================
REM RESUMEN
REM ====================================================================

echo.
echo ========================================================================
echo   ✅ BACKUP COMPLETADO
echo ========================================================================
echo.

echo 📂 Archivos de backup:
echo.

if exist "%BACKUP_DIR%\%BACKUP_NAME%_database.sql" (
    for %%A in ("%BACKUP_DIR%\%BACKUP_NAME%_database.sql") do (
        echo    📊 Base de datos:  %%~nxA (%%~zA bytes)
    )
)

if exist "%BACKUP_DIR%\%BACKUP_NAME%_files.7z" (
    for %%A in ("%BACKUP_DIR%\%BACKUP_NAME%_files.7z") do (
        echo    📦 Archivos (7z):  %%~nxA (%%~zA bytes)
    )
)

if exist "%BACKUP_DIR%\%BACKUP_NAME%_files.tar.gz" (
    for %%A in ("%BACKUP_DIR%\%BACKUP_NAME%_files.tar.gz") do (
        echo    📦 Archivos (tar): %%~nxA (%%~zA bytes)
    )
)

if exist "%BACKUP_DIR%\%BACKUP_NAME%_photos.json" (
    for %%A in ("%BACKUP_DIR%\%BACKUP_NAME%_photos.json") do (
        echo    📸 Fotos:          %%~nxA (%%~zA bytes)
    )
)

if exist "%BACKUP_DIR%\%BACKUP_NAME%_env.txt" (
    for %%A in ("%BACKUP_DIR%\%BACKUP_NAME%_env.txt") do (
        echo    🔐 Config (.env):  %%~nxA (%%~zA bytes) ⚠️  CONFIDENCIAL
    )
)

echo.
echo 💾 Ubicación: %BACKUP_DIR%\
echo.

REM ====================================================================
REM LIMPIEZA DE BACKUPS ANTIGUOS (OPCIONAL)
REM ====================================================================

echo ========================================================================
echo   🧹 LIMPIEZA DE BACKUPS ANTIGUOS
echo ========================================================================
echo.

REM Contar archivos de backup
dir /b "%BACKUP_DIR%\uns-claudejp-backup_*" 2>nul | find /c /v "" > temp_count.txt
set /p BACKUP_COUNT=<temp_count.txt
del temp_count.txt >nul 2>&1

echo Se encontraron %BACKUP_COUNT% backups anteriores
echo.

if %BACKUP_COUNT% GTR 10 (
    echo ⚠️  Tienes más de 10 backups
    echo.
    choice /C SN /M "¿Eliminar backups antiguos (mantener últimos 5)? (S=Sí, N=No)"

    if errorlevel 1 (
        echo.
        echo 🧹 Eliminando backups antiguos...

        REM Listar archivos ordenados por fecha (más antiguos primero)
        REM Eliminar todos excepto los últimos 5
        for /f "skip=5 delims=" %%f in ('dir /b /o-d "%BACKUP_DIR%\uns-claudejp-backup_*"') do (
            echo    Eliminando: %%f
            del "%BACKUP_DIR%\%%f" >nul 2>&1
        )

        echo ✅ Limpieza completada
    )
)

echo.

REM ====================================================================
REM INSTRUCCIONES DE RESTAURACIÓN
REM ====================================================================

echo ========================================================================
echo   📖 INSTRUCCIONES DE RESTAURACIÓN
echo ========================================================================
echo.

echo Para restaurar desde este backup:
echo.
echo   1. Base de datos:
echo      docker exec -i uns-claudejp-600-db psql -U uns_admin uns_claudejp ^< %BACKUP_DIR%\%BACKUP_NAME%_database.sql
echo.
echo   2. Archivos (si usaste 7z):
echo      7z x %BACKUP_DIR%\%BACKUP_NAME%_files.7z
echo.
echo   3. Archivos (si usaste tar.gz):
echo      tar -xzf %BACKUP_DIR%\%BACKUP_NAME%_files.tar.gz
echo.
echo   4. Fotos:
echo      copy %BACKUP_DIR%\%BACKUP_NAME%_photos.json access_photo_mappings.json
echo.
echo   5. .env (si lo respaldaste):
echo      copy %BACKUP_DIR%\%BACKUP_NAME%_env.txt .env
echo.

echo ========================================================================
echo.

pause

REM ====================================================================
REM OPCIÓN: SUBIR A GOOGLE DRIVE / DROPBOX (MANUAL)
REM ====================================================================

echo.
echo ¿Quieres abrir la carpeta de backups para subirla manualmente?
choice /C SN /M "(S=Sí, N=No)"

if errorlevel 2 goto end
if errorlevel 1 explorer "%BACKUP_DIR%"

:end
echo.
echo ✅ Backup completado exitosamente
echo.
echo 💡 Recomendación: Subir backups a Google Drive/Dropbox para seguridad adicional
echo.

pause >nul
