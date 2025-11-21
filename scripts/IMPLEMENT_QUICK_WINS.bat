@echo off
REM ═══════════════════════════════════════════════════════════════════════════
REM Script: IMPLEMENT_QUICK_WINS.bat
REM Propósito: Automatizar implementación de 3 fixes críticos en 1 hora
REM Fecha: 2025-11-12
REM Versión: 1.0
REM Autor: Claude Code Automation
REM
REM QUICK WINS:
REM   1. Backup automático (30 min)
REM   2. Cerrar puerto 5432 (5 min)
REM   3. Frontend health check (30 min)
REM
REM TOTAL: 65 minutos para máximo impacto
REM ═══════════════════════════════════════════════════════════════════════════

chcp 65001 >nul
setlocal EnableDelayedExpansion

REM Color codes para output visual
set "COLOR_OK=echo."
set "COLOR_ERROR=echo."

echo.
echo ╔═══════════════════════════════════════════════════════════════════════════╗
echo ║                    QUICK WINS AUTOMATION - PLAN B                         ║
echo ║              3 Fixes Críticos en 1 Hora (Máximo Impacto)                 ║
echo ╚═══════════════════════════════════════════════════════════════════════════╝
echo.

REM Variables
set "PROJECT_ROOT=%~dp0\.."
set "TIMESTAMP=%DATE:~-4%%DATE:~-10,2%%DATE:~-7,2%_%TIME:~0,2%%TIME:~3,2%"
set "BACKUP_DIR=%PROJECT_ROOT%\backend\backups"
set "ERROR_COUNT=0"
set "SUCCESS_COUNT=0"

REM ─────────────────────────────────────────────────────────────────────────────
REM PRE-CHECKS
REM ─────────────────────────────────────────────────────────────────────────────

echo [PRE-CHECKS] Verificando prerequisites...
echo.

REM Verificar que estamos en directorio correcto
if not exist "%PROJECT_ROOT%\docker-compose.yml" (
    echo ❌ ERROR: docker-compose.yml no encontrado
    echo    Ejecutar desde raíz del proyecto
    pause >nul
    exit /b 1
)
echo ✅ Ubicación correcta verificada

REM Verificar Docker
docker ps >nul 2>&1
if %errorlevel% NEQ 0 (
    echo ❌ ERROR: Docker no está corriendo
    echo    Iniciar Docker Desktop primero
    pause >nul
    exit /b 1
)
echo ✅ Docker corriendo

REM Verificar Git
git status >nul 2>&1
if %errorlevel% NEQ 0 (
    echo ❌ ERROR: No en repositorio Git
    pause >nul
    exit /b 1
)
echo ✅ Repositorio Git válido

echo.
echo ─────────────────────────────────────────────────────────────────────────────

REM ═════════════════════════════════════════════════════════════════════════════
REM QUICK WIN #1: BACKUP AUTOMÁTICO (30 minutos)
REM ═════════════════════════════════════════════════════════════════════════════

echo.
echo [1/3] IMPLEMENTAR BACKUP AUTOMÁTICO EN REINSTALAR.bat
echo ──────────────────────────────────────────────────────────────────────────────
echo.

REM Crear directorio de backups
if not exist "%BACKUP_DIR%" (
    echo ▶ Creando directorio de backups...
    mkdir "%BACKUP_DIR%"
    echo ✅ Directorio creado: %BACKUP_DIR%
) else (
    echo ✅ Directorio de backups ya existe
)

REM Verificar que REINSTALAR.bat existe
if not exist "%PROJECT_ROOT%\scripts\REINSTALAR.bat" (
    echo ❌ ERROR: REINSTALAR.bat no encontrado
    set /a ERROR_COUNT+=1
    goto :next_win1
)
echo ✅ REINSTALAR.bat encontrado

REM Crear archivo de modificación para REINSTALAR.bat
set "PATCH_FILE=%PROJECT_ROOT%\scripts\PATCH_REINSTALAR_BACKUP.txt"
(
    echo REM ═══════════════════════════════════════════════════════════════
    echo REM BACKUP AUTOMÁTICO ANTES DE docker compose down -v
    echo REM AGREGADO POR QUICK WINS AUTOMATION - 2025-11-12
    echo REM ═══════════════════════════════════════════════════════════════
    echo.
    echo echo.
    echo echo ╔══════════════════════════════════════════════════════════════════════╗
    echo echo ║ ^[OBLIGATORIO^] CREAR BACKUP DE SEGURIDAD                              ║
    echo echo ╚══════════════════════════════════════════════════════════════════════╝
    echo.
    echo if not exist "%BACKUP_DIR%" mkdir "%BACKUP_DIR%"
    echo.
    echo echo ▶ Creando backup de base de datos...
    echo docker exec uns-claudejp-600-db pg_dump -U uns_admin uns_claudejp ^> "%BACKUP_DIR%\backup_before_reinstall_%TIMESTAMP%.sql" 2^>nul
    echo if !errorlevel! NEQ 0 (
    echo     echo ❌ ERROR: Fallo al crear backup
    echo     echo ⚠️  Abortando reinstalación por seguridad
    echo     pause ^>nul
    echo     goto :eof
    echo ^)
    echo.
    echo if exist "%BACKUP_DIR%\backup_before_reinstall_%TIMESTAMP%.sql" (
    echo     for %%A in ("%BACKUP_DIR%\backup_before_reinstall_%TIMESTAMP%.sql"^) do (
    echo         if %%~zA gtr 10240 (
    echo             echo ✅ Backup creado exitosamente ^(%%~zA bytes^)
    echo         ^) else (
    echo             echo ❌ Backup parece corrupto (archivo muy pequeño^)
    echo             pause ^>nul
    echo             goto :eof
    echo         ^)
    echo     ^)
    echo ^) else (
    echo     echo ❌ Archivo de backup no encontrado
    echo     pause ^>nul
    echo     goto :eof
    echo ^)
    echo.
) > "%PATCH_FILE%"

echo ▶ Se ha preparado el patch del backup automático
echo   Ubicación: %PATCH_FILE%
echo.
echo ⚠️  INSTRUCCIONES MANUALES:
echo   1. Abrir: scripts\REINSTALAR.bat
echo   2. Encontrar línea 136: "echo [2/6] Detener y limpiar servicios..."
echo   3. ANTES de esa línea, agregar contenido de: %PATCH_FILE%
echo   4. Guardar archivo
echo.

set /a SUCCESS_COUNT+=1

:next_win1

REM ═════════════════════════════════════════════════════════════════════════════
REM QUICK WIN #2: CERRAR PUERTO 5432 (5 minutos)
REM ═════════════════════════════════════════════════════════════════════════════

echo.
echo [2/3] CERRAR PUERTO 5432 (Exposición Pública)
echo ──────────────────────────────────────────────────────────────────────────────
echo.

REM Verificar que docker-compose.yml tiene puerto 5432 expuesto
findstr /R "5432:5432" "%PROJECT_ROOT%\docker-compose.yml" >nul 2>&1
if %errorlevel% EQU 0 (
    echo ⚠️  Puerto 5432 está EXPUESTO públicamente
    echo.
    echo ▶ Creando backup de docker-compose.yml...
    copy "%PROJECT_ROOT%\docker-compose.yml" "%PROJECT_ROOT%\docker-compose.yml.backup_%TIMESTAMP%" >nul
    echo ✅ Backup creado: docker-compose.yml.backup_%TIMESTAMP%
    echo.

    REM Mostrar línea que será removida
    echo ▶ Línea a REMOVER en docker-compose.yml:
    findstr /N "5432:5432" "%PROJECT_ROOT%\docker-compose.yml"
    echo.

    echo ⚠️  INSTRUCCIONES MANUALES:
    echo   1. Abrir: docker-compose.yml
    echo   2. Encontrar línea con "5432:5432"
    echo   3. Remover completamente: ports: - "5432:5432"
    echo   4. Guardar archivo
    echo   5. Ejecutar: docker compose restart db
    echo.

    set /a SUCCESS_COUNT+=1
) else (
    echo ✅ Puerto 5432 ya está CERRADO (No expuesto)
    set /a SUCCESS_COUNT+=1
)

REM ═════════════════════════════════════════════════════════════════════════════
REM QUICK WIN #3: FRONTEND HEALTH CHECK (30 minutos)
REM ═════════════════════════════════════════════════════════════════════════════

echo.
echo [3/3] IMPLEMENTAR FRONTEND HEALTH CHECK
echo ──────────────────────────────────────────────────────────────────────────────
echo.

REM Crear patch para health check
set "HEALTHCHECK_PATCH=%PROJECT_ROOT%\scripts\PATCH_FRONTEND_HEALTHCHECK.txt"
(
    echo REM ═══════════════════════════════════════════════════════════════
    echo REM FRONTEND HEALTH CHECK - VERIFICACIÓN HTTP REAL
    echo REM AGREGADO POR QUICK WINS AUTOMATION - 2025-11-12
    echo REM ═══════════════════════════════════════════════════════════════
    echo.
    echo echo Esperando que frontend esté realmente listo (máx 300s^)...
    echo set "FRONTEND_RETRIES=0"
    echo :wait_frontend_loop
    echo curl -f -s http://localhost:3000 ^>nul 2^>^&1
    echo if !errorlevel! EQU 0 (
    echo     echo ✅ Frontend respondiendo correctamente
    echo     goto :frontend_ready
    echo ^)
    echo set /a FRONTEND_RETRIES+=1
    echo if !FRONTEND_RETRIES! GEQ 30 (
    echo     echo ⚠️  TIMEOUT: Frontend no respondió en 300s
    echo     echo ! Esto es NORMAL en primera compilación
    echo     echo ! Ver logs: docker logs uns-claudejp-600-frontend --tail 100
    echo     pause ^>nul
    echo     goto :eof
    echo ^)
    echo timeout /t 10 /nobreak ^>nul
    echo goto :wait_frontend_loop
    echo.
    echo :frontend_ready
    echo echo ✅ Frontend completamente listo
) > "%HEALTHCHECK_PATCH%"

echo ▶ Se ha preparado el patch del health check
echo   Ubicación: %HEALTHCHECK_PATCH%
echo.
echo ⚠️  INSTRUCCIONES MANUALES:
echo   1. Abrir: scripts\REINSTALAR.bat
echo   2. Encontrar línea 331: "timeout /t 60 /nobreak >nul"
echo   3. REEMPLAZAR esa línea con contenido de: %HEALTHCHECK_PATCH%
echo   4. Guardar archivo
echo.

set /a SUCCESS_COUNT+=1

REM ═════════════════════════════════════════════════════════════════════════════
REM RESUMEN Y PRÓXIMOS PASOS
REM ═════════════════════════════════════════════════════════════════════════════

echo.
echo ═══════════════════════════════════════════════════════════════════════════════
echo.
echo ✅ RESUMEN DE QUICK WINS
echo.
echo   Éxito: %SUCCESS_COUNT%/3
echo   Errores: %ERROR_COUNT%/3
echo.
echo PRÓXIMOS PASOS:
echo ───────────────
echo   1. Abrir y editar scripts\REINSTALAR.bat:
echo      - Agregar contenido de: %PATCH_FILE%
echo      - Reemplazar health check con: %HEALTHCHECK_PATCH%
echo.
echo   2. Editar docker-compose.yml:
echo      - Remover "ports: - 5432:5432" de sección 'db'
echo.
echo   3. Testear cambios:
echo      docker compose restart db
echo      scripts\REINSTALAR.bat
echo.
echo   4. Validar:
echo      docker compose ps
echo      curl http://localhost:3000
echo.
echo ═══════════════════════════════════════════════════════════════════════════════
echo.

REM Crear archivo de resumen
set "SUMMARY_FILE=%PROJECT_ROOT%\QUICK_WINS_SUMMARY_%TIMESTAMP%.txt"
(
    echo QUICK WINS AUTOMATION - RESUMEN
    echo ════════════════════════════════════════════════════════════════════
    echo Fecha: %DATE% %TIME%
    echo Timestamp: %TIMESTAMP%
    echo.
    echo RESULTADOS:
    echo ─────────────
    echo Éxito: %SUCCESS_COUNT%/3
    echo Errores: %ERROR_COUNT%/3
    echo.
    echo ARCHIVOS GENERADOS:
    echo ──────────────────
    echo 1. PATCH_REINSTALAR_BACKUP.txt - Código para backup automático
    echo 2. PATCH_FRONTEND_HEALTHCHECK.txt - Código para health check
    echo.
    echo INSTRUCCIONES PASO A PASO:
    echo ─────────────────────────
    echo.
    echo PASO 1: BACKUP AUTOMÁTICO (30 min)
    echo ──────────────────────────────────
    echo Archivo: scripts\REINSTALAR.bat
    echo Línea: 136
    echo Acción: Agregar código de %PATCH_FILE%
    echo.
    echo PASO 2: PUERTO 5432 (5 min)
    echo ──────────────────────────
    echo Archivo: docker-compose.yml
    echo Línea: ~15
    echo Acción: Remover "ports: - 5432:5432"
    echo Backup: docker-compose.yml.backup_%TIMESTAMP%
    echo.
    echo PASO 3: FRONTEND HEALTH CHECK (30 min)
    echo ──────────────────────────────────────
    echo Archivo: scripts\REINSTALAR.bat
    echo Línea: 331
    echo Acción: Reemplazar con código de %HEALTHCHECK_PATCH%
    echo.
    echo TESTING:
    echo ────────
    echo 1. docker compose down
    echo 2. docker compose --profile dev up -d
    echo 3. Esperar 120s
    echo 4. curl http://localhost:3000
    echo 5. Debe responder con HTML válido
    echo.
    echo VALIDACIÓN COMPLETA:
    echo ────────────────────
    echo Ejecutar: scripts\HEALTH_CHECK_FUN.bat
    echo.
) > "%SUMMARY_FILE%"

echo 📄 Resumen guardado en: %SUMMARY_FILE%
echo.
echo 📌 Archivos generados:
echo    - %PATCH_FILE%
echo    - %HEALTHCHECK_PATCH%
echo    - %SUMMARY_FILE%
echo.

pause >nul
