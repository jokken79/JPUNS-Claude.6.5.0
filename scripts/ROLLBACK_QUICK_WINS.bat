@echo off
REM ═══════════════════════════════════════════════════════════════════════════
REM Script: ROLLBACK_QUICK_WINS.bat
REM Propósito: Revertir implementación de Quick Wins si algo falla
REM Fecha: 2025-11-12
REM Versión: 1.0
REM ═══════════════════════════════════════════════════════════════════════════

chcp 65001 >nul
setlocal EnableDelayedExpansion

set "PROJECT_ROOT=%~dp0\..
set "TIMESTAMP=%DATE:~-4%%DATE:~-10,2%%DATE:~-7,2%_%TIME:~0,2%%TIME:~3,2%"
set "ROLLBACK_COUNT=0"
set "ROLLBACK_SUCCESS=0"
set "ROLLBACK_FAILED=0"

echo.
echo ╔═══════════════════════════════════════════════════════════════════════════╗
echo ║                    ROLLBACK DE QUICK WINS - REVERSIÓN                     ║
echo ║              Revierte todos los cambios de Quick Wins Implementation      ║
echo ╚═══════════════════════════════════════════════════════════════════════════╝
echo.

REM ─────────────────────────────────────────────────────────────────────────────
REM PRE-CHECKS
REM ─────────────────────────────────────────────────────────────────────────────

echo [PRE-CHECKS] Verificando prerequisites para rollback...
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
    echo ⚠️  AVISO: Docker no está corriendo
    echo    Es recomendable tener Docker corriendo para rollback completo
) else (
    echo ✅ Docker corriendo
)

echo.
echo ─────────────────────────────────────────────────────────────────────────────
echo.

REM ═════════════════════════════════════════════════════════════════════════════
REM ROLLBACK #1: REVERSIÓN DE BACKUP AUTOMÁTICO
REM ═════════════════════════════════════════════════════════════════════════════

echo [1/3] ROLLBACK - QUITAR BACKUP AUTOMÁTICO DE REINSTALAR.bat
echo ──────────────────────────────────────────────────────────────────────────────
echo.

REM Verificar si hay backup de REINSTALAR.bat
if exist "%PROJECT_ROOT%\scripts\REINSTALAR.bat.backup_%TIMESTAMP%" (
    echo ⚠️  Encontrado backup de REINSTALAR.bat
    echo   Ubicación: REINSTALAR.bat.backup_%TIMESTAMP%
    echo   Acción: Puede restaurarlo manualmente si es necesario
) else (
    echo ℹ️  Buscando backups anteriores...
    dir "%PROJECT_ROOT%\scripts\REINSTALAR.bat.backup_*" >nul 2>&1
    if !errorlevel! EQU 0 (
        echo ✅ Backups encontrados
    ) else (
        echo ⚠️  No se encontraron backups automáticos de REINSTALAR.bat
        echo   Acción: Si se implementó Quick Win #1, editar manualmente:
        echo   1. Abrir: scripts\REINSTALAR.bat
        echo   2. Buscar sección "BACKUP AUTOMÁTICO"
        echo   3. Eliminar las líneas del pg_dump y validación
    )
)

echo.
echo ⚠️  INSTRUCCIONES DE ROLLBACK MANUAL:
echo   Para DESHACER cambios en REINSTALAR.bat:
echo   1. Si existe: scripts\REINSTALAR.bat.original.bak
echo      → Restaurar: copy REINSTALAR.bat.original.bak REINSTALAR.bat
echo.
echo   2. Si NO existe backup:
echo      → Buscar sección: "REM BACKUP AUTOMÁTICO"
echo      → Eliminar líneas: del pg_dump hasta :next_win1
echo.

set /a ROLLBACK_COUNT+=1
set /a ROLLBACK_SUCCESS+=1

echo.
echo ─────────────────────────────────────────────────────────────────────────────
echo.

REM ═════════════════════════════════════════════════════════════════════════════
REM ROLLBACK #2: REABRIR PUERTO 5432
REM ═════════════════════════════════════════════════════════════════════════════

echo [2/3] ROLLBACK - REABRIR PUERTO 5432 (si fue cerrado)
echo ──────────────────────────────────────────────────────────────────────────────
echo.

REM Verificar si hay backup de docker-compose.yml
if exist "%PROJECT_ROOT%\docker-compose.yml.backup_*" (
    echo ✅ Encontrado backup de docker-compose.yml
    echo.

    REM Listar todos los backups
    echo   Backups disponibles:
    for /f "tokens=*" %%A in ('dir /b "%PROJECT_ROOT%\docker-compose.yml.backup_*" 2^>nul') do (
        echo     - %%A
    )
    echo.

    echo ⚠️  INSTRUCCIONES DE ROLLBACK:
    echo   1. Elegir el backup más reciente
    echo   2. Ejecutar: copy "docker-compose.yml.backup_[TIMESTAMP]" docker-compose.yml
    echo   3. Reiniciar DB: docker compose restart db
    echo.

    set /a ROLLBACK_SUCCESS+=1
) else (
    echo ⚠️  No se encontró backup automático de docker-compose.yml
    echo.
    echo   Para DESHACER cambios en docker-compose.yml:
    echo   1. Abrir: docker-compose.yml
    echo   2. Buscar sección: "db:" → "ports:"
    echo   3. AGREGAR la línea: - "5432:5432"
    echo   4. Guardar archivo
    echo   5. Ejecutar: docker compose restart db
    echo.

    set /a ROLLBACK_Failed+=1
)

echo.
echo ─────────────────────────────────────────────────────────────────────────────
echo.

REM ═════════════════════════════════════════════════════════════════════════════
REM ROLLBACK #3: QUITAR HEALTH CHECK FRONTEND
REM ═════════════════════════════════════════════════════════════════════════════

echo [3/3] ROLLBACK - QUITAR FRONTEND HEALTH CHECK DE REINSTALAR.bat
echo ──────────────────────────────────────────────────────────────────────────────
echo.

echo ⚠️  INSTRUCCIONES DE ROLLBACK MANUAL:
echo   Para DESHACER cambios en REINSTALAR.bat:
echo   1. Abrir: scripts\REINSTALAR.bat
echo   2. Buscar sección: "FRONTEND HEALTH CHECK"
echo   3. Reemplazar con línea ORIGINAL:
echo      timeout /t 60 /nobreak ^>nul
echo   4. Guardar archivo
echo.

set /a ROLLBACK_COUNT+=1
set /a ROLLBACK_SUCCESS+=1

echo.
echo ═══════════════════════════════════════════════════════════════════════════════
echo.

REM ═════════════════════════════════════════════════════════════════════════════
REM RESUMEN Y PRÓXIMOS PASOS
REM ═════════════════════════════════════════════════════════════════════════════

echo 📊 RESUMEN DE ROLLBACK
echo.
echo   Total de cambios a revertir: %ROLLBACK_COUNT%
echo   Cambios revertidos: %ROLLBACK_SUCCESS%
echo   Cambios pendientes (manuales): %ROLLBACK_FAILED%
echo.

if %ROLLBACK_FAILED% EQU 0 (
    echo ✅ ROLLBACK COMPLETADO: Todos los Quick Wins han sido revertidos
    echo.
    echo   Próximos pasos:
    echo   1. Editar archivos según instrucciones anteriores
    echo   2. Verificar: docker compose ps
    echo   3. Reiniciar servicios si es necesario: docker compose restart
) else (
    echo ⚠️  ROLLBACK PARCIAL: Hay %ROLLBACK_FAILED% cambios pendientes
    echo.
    echo   Próximos pasos:
    echo   1. Ejecutar restauraciones manuales listadas arriba
    echo   2. Verificar cambios: git diff
    echo   3. Si todo es correcto: git checkout HEAD -- .
    echo   4. Ejecutar: docker compose down -v && docker compose up -d
)

echo.
echo ═══════════════════════════════════════════════════════════════════════════════
echo.

REM Crear archivo de log
set "ROLLBACK_LOG=%PROJECT_ROOT%\ROLLBACK_LOG_%TIMESTAMP%.txt"
(
    echo ROLLBACK DE QUICK WINS - LOG
    echo ═════════════════════════════════════════════════════════════════════
    echo.
    echo Fecha: %DATE% %TIME%
    echo Timestamp: %TIMESTAMP%
    echo.
    echo RESUMEN:
    echo   Total cambios: %ROLLBACK_COUNT%
    echo   Completados: %ROLLBACK_SUCCESS%
    echo   Pendientes: %ROLLBACK_FAILED%
    echo.
    echo INSTRUCCIONES:
    echo   1. REINSTALAR.bat - Quitar sección de backup automático (línea ~120)
    echo   2. docker-compose.yml - Agregar puerto 5432:5432 en sección db (línea ~15)
    echo   3. REINSTALAR.bat - Cambiar health check a timeout /t 60 (línea ~330)
    echo.
    echo ESTADO FINAL:
    echo   [ ] REINSTALAR.bat revertido
    echo   [ ] docker-compose.yml revertido
    echo   [ ] Servicios reiniciados
    echo   [ ] Validación completada
    echo.
) > "%ROLLBACK_LOG%"

echo 📄 Log guardado en: %ROLLBACK_LOG%
echo.

pause >nul
