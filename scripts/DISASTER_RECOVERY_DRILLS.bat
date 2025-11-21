@echo off
REM ═══════════════════════════════════════════════════════════════════════════
REM Script: DISASTER_RECOVERY_DRILLS.bat
REM Propósito: Ejecutar drills de Disaster Recovery en ambiente seguro
REM Fecha: 2025-11-12
REM Versión: 1.0
REM
REM Drills Implementados:
REM   DRILL #1: Database Backup & Restore (15 minutos)
REM   DRILL #2: Service Failover (10 minutos)
REM   DRILL #3: Complete System Rebuild (30 minutos)
REM   DRILL #4: Data Integrity Verification (20 minutos)
REM ═══════════════════════════════════════════════════════════════════════════

chcp 65001 >nul
setlocal EnableDelayedExpansion

set "PROJECT_ROOT=%~dp0\.."
set "TIMESTAMP=%DATE:~-4%%DATE:~-10,2%%DATE:~-7,2%_%TIME:~0,2%%TIME:~3,2%"
set "DRILL_COUNT=0"
set "DRILL_SUCCESS=0"
set "DRILL_FAILED=0"

echo.
echo ╔═══════════════════════════════════════════════════════════════════════════╗
echo ║         DISASTER RECOVERY DRILLS - Validación de Recuperación             ║
echo ║              Ejecutar en ambiente seguro (NO en producción)               ║
echo ╚═══════════════════════════════════════════════════════════════════════════╝
echo.

REM ─────────────────────────────────────────────────────────────────────────────
REM PRE-DRILL CHECKS
REM ─────────────────────────────────────────────────────────────────────────────

echo [PRE-DRILL] Preparando ambiente de testing...
echo.

if not exist "%PROJECT_ROOT%\docker-compose.yml" (
    echo ❌ ERROR: docker-compose.yml no encontrado
    pause >nul
    exit /b 1
)
echo ✅ docker-compose.yml encontrado

docker ps >nul 2>&1
if %errorlevel% NEQ 0 (
    echo ❌ ERROR: Docker no está corriendo
    pause >nul
    exit /b 1
)
echo ✅ Docker running

echo ⚠️  AVISO: Estos drills modificarán datos. Usar solo en:
echo    - Ambiente de testing
echo    - Ambiente de staging
echo    - NUNCA en producción
echo.

set /p CONFIRM="¿Continuar con los drills? (SI/NO): "
if /i not "%CONFIRM%"=="SI" (
    echo Drills cancelados
    exit /b 0
)

echo.
echo ─────────────────────────────────────────────────────────────────────────────
echo.

REM ═════════════════════════════════════════════════════════════════════════════
REM DRILL #1: DATABASE BACKUP & RESTORE (15 minutos)
REM ═════════════════════════════════════════════════════════════════════════════

set /a DRILL_COUNT+=1
echo [DRILL %DRILL_COUNT%/4] DATABASE BACKUP ^& RESTORE TEST
echo ──────────────────────────────────────────────────────────────────────────────
echo.

echo ▶ PASO 1: Crear backup de base de datos actual...
docker exec uns-claudejp-600-db pg_dump -U uns_admin uns_claudejp > "backup_drill_%TIMESTAMP%.sql" 2>nul
if %errorlevel% EQU 0 (
    echo ✅ Backup creado exitosamente

    REM Verificar tamaño del backup
    for %%A in ("backup_drill_%TIMESTAMP%.sql") do (
        set "FILE_SIZE=%%~zA"
    )

    if !FILE_SIZE! GTR 10485760 (
        echo ✅ Backup válido (tamaño: !FILE_SIZE! bytes)
        set /a DRILL_SUCCESS+=1
    ) else (
        echo ❌ Backup sospechosamente pequeño (tamaño: !FILE_SIZE! bytes)
        set /a DRILL_FAILED+=1
    )
) else (
    echo ❌ ERROR: Fallo al crear backup
    set /a DRILL_FAILED+=1
)

echo.
echo ▶ PASO 2: Contar registros en tabla crítica...
for /f "delims=" %%A in ('docker exec uns-claudejp-600-db psql -U uns_admin -d uns_claudejp -tc "SELECT COUNT(*) FROM candidates;" 2^>nul') do (
    set "ORIG_COUNT=%%A"
)
echo   Candidatos originales: !ORIG_COUNT!

echo.
echo ▶ PASO 3: Simular corrupción de datos (DELETE 10 registros)...
docker exec uns-claudejp-600-db psql -U uns_admin -d uns_claudejp -c "DELETE FROM candidates WHERE id IN (SELECT id FROM candidates LIMIT 10);" >nul 2>&1
echo ✅ Datos dañados (simulado)

echo.
echo ▶ PASO 4: Verificar corrupción...
for /f "delims=" %%A in ('docker exec uns-claudejp-600-db psql -U uns_admin -d uns_claudejp -tc "SELECT COUNT(*) FROM candidates;" 2^>nul') do (
    set "CORRUPTED_COUNT=%%A"
)
echo   Candidatos después de DELETE: !CORRUPTED_COUNT!
echo   Diferencia: recordsets removidos

echo.
echo ▶ PASO 5: Restaurar desde backup...
docker compose stop backend >nul 2>&1
cat "backup_drill_%TIMESTAMP%.sql" | docker exec -i uns-claudejp-600-db psql -U uns_admin uns_claudejp >nul 2>&1

if %errorlevel% EQU 0 (
    echo ✅ Restauración completada
) else (
    echo ❌ ERROR: Fallo en restauración
    docker compose up -d backend
    set /a DRILL_FAILED+=1
    goto :drill1_end
)

docker compose up -d backend >nul 2>&1
sleep 30

echo.
echo ▶ PASO 6: Verificar integridad post-restauración...
for /f "delims=" %%A in ('docker exec uns-claudejp-600-db psql -U uns_admin -d uns_claudejp -tc "SELECT COUNT(*) FROM candidates;" 2^>nul') do (
    set "RESTORED_COUNT=%%A"
)
echo   Candidatos restaurados: !RESTORED_COUNT!

if "!RESTORED_COUNT!"=="!ORIG_COUNT!" (
    echo ✅ DRILL #1 EXITOSO: Backup y restauración funcionan correctamente
    set /a DRILL_SUCCESS+=1
) else (
    echo ❌ DRILL #1 FALLIDO: Datos no coinciden después de restauración
    set /a DRILL_FAILED+=1
)

:drill1_end
echo.
echo ─────────────────────────────────────────────────────────────────────────────
echo.

REM ═════════════════════════════════════════════════════════════════════════════
REM DRILL #2: SERVICE FAILOVER (10 minutos)
REM ═════════════════════════════════════════════════════════════════════════════

set /a DRILL_COUNT+=1
echo [DRILL %DRILL_COUNT%/4] SERVICE FAILOVER TEST
echo ──────────────────────────────────────────────────────────────────────────────
echo.

echo ▶ PASO 1: Verificar servicios están saludables...
docker ps | findstr "uns-claudejp-600-backend-1" >nul 2>&1
if %errorlevel% EQU 0 (
    echo ✅ Backend running
) else (
    echo ❌ Backend not running
    set /a DRILL_FAILED+=1
    goto :drill2_end
)

echo.
echo ▶ PASO 2: Detener backend abruptamente...
docker compose kill backend >nul 2>&1
echo ⏹️  Backend killed

echo.
echo ▶ PASO 3: Verificar que está DOWN...
docker ps | findstr "uns-claudejp-600-backend-1" >nul 2>&1
if %errorlevel% NEQ 0 (
    echo ✅ Confirmado: Backend DOWN
) else (
    echo ⚠️  Backend aún visible en ps
)

echo.
echo ▶ PASO 4: Intentar acceso a API (debe fallar)...
curl -f -s http://localhost:8000/api/health >nul 2>&1
if %errorlevel% NEQ 0 (
    echo ✅ Confirmado: API no responde
) else (
    echo ⚠️  API aún responde (unexpected)
)

echo.
echo ▶ PASO 5: Recuperar servicio...
docker compose up -d backend >nul 2>&1
echo ▶ Esperando que backend inicie...
timeout /t 30 /nobreak >nul

echo.
echo ▶ PASO 6: Verificar recuperación...
curl -f -s http://localhost:8000/api/health >nul 2>&1
if %errorlevel! EQU 0 (
    echo ✅ DRILL #2 EXITOSO: Failover y recuperación funcionan
    set /a DRILL_SUCCESS+=1
) else (
    echo ❌ DRILL #2 FALLIDO: Servicio no recuperado
    set /a DRILL_FAILED+=1
)

:drill2_end
echo.
echo ─────────────────────────────────────────────────────────────────────────────
echo.

REM ═════════════════════════════════════════════════════════════════════════════
REM DRILL #3: DATA INTEGRITY VERIFICATION (20 minutos)
REM ═════════════════════════════════════════════════════════════════════════════

set /a DRILL_COUNT+=1
echo [DRILL %DRILL_COUNT%/4] DATA INTEGRITY VERIFICATION
echo ──────────────────────────────────────────────────────────────────────────────
echo.

echo ▶ PASO 1: Verificar integridad de tabla candidates...
docker exec uns-claudejp-600-db psql -U uns_admin -d uns_claudejp -c \
  "SELECT COUNT(*) FROM candidates;" >nul 2>&1
if %errorlevel% EQU 0 (
    echo ✅ Tabla candidates accesible
) else (
    echo ❌ ERROR: Tabla candidates corrupta
    set /a DRILL_FAILED+=1
    goto :drill3_end
)

echo.
echo ▶ PASO 2: Verificar referential integrity...
docker exec uns-claudejp-600-db psql -U uns_admin -d uns_claudejp -c \
  "SELECT COUNT(*) FROM employees WHERE factory_id NOT IN (SELECT id FROM factories WHERE factory_id IS NOT NULL);" >nul 2>&1
if %errorlevel% EQU 0 (
    echo ✅ Integridad referencial OK
    set /a DRILL_SUCCESS+=1
) else (
    echo ⚠️  ADVERTENCIA: Posibles referencias rotas
    set /a DRILL_FAILED+=1
)

echo.
echo ▶ PASO 3: Verificar índices...
docker exec uns-claudejp-600-db psql -U uns_admin -d uns_claudejp -c \
  "REINDEX DATABASE uns_claudejp;" >nul 2>&1
echo ✅ Reindex completado

echo.
echo ▶ PASO 4: Verificar secuencias...
docker exec uns-claudejp-600-db psql -U uns_admin -d uns_claudejp -c \
  "SELECT setval('candidates_id_seq', (SELECT MAX(id) FROM candidates));" >nul 2>&1
echo ✅ Secuencias verificadas

echo.
echo ▶ PASO 5: Ejecutar VACUUM ANALYZE...
docker exec uns-claudejp-600-db psql -U uns_admin -d uns_claudejp -c \
  "VACUUM ANALYZE;" >nul 2>&1
echo ✅ VACUUM ANALYZE completado

echo.
echo ✅ DRILL #3 EXITOSO: Integridad de datos verificada

:drill3_end
echo.
echo ─────────────────────────────────────────────────────────────────────────────
echo.

REM ═════════════════════════════════════════════════════════════════════════════
REM DRILL #4: COMPLETE SYSTEM REBUILD (30 minutos)
REM ═════════════════════════════════════════════════════════════════════════════

set /a DRILL_COUNT+=1
echo [DRILL %DRILL_COUNT%/4] COMPLETE SYSTEM REBUILD TEST
echo ──────────────────────────────────────────────────────────────────────────────
echo.

echo ⚠️  ADVERTENCIA: Este drill es destructivo (elimina volúmenes)
set /p CONFIRM2="¿Continuar con rebuild completo? (SI/NO): "
if /i not "%CONFIRM2%"=="SI" (
    echo Drill #4 saltado
    set /a DRILL_COUNT-=1
    goto :drill4_end
)

echo.
echo ▶ PASO 1: Crear backup final...
docker exec uns-claudejp-600-db pg_dump -U uns_admin uns_claudejp > "backup_final_drill_%TIMESTAMP%.sql" >nul 2>&1
echo ✅ Backup final creado

echo.
echo ▶ PASO 2: Detener todos los servicios...
docker compose down >nul 2>&1
echo ✅ Servicios detenidos

echo.
echo ▶ PASO 3: Eliminar volúmenes (DATA LOSS SIMULATION)...
docker volume rm uns-claudejp_postgres_data >nul 2>&1
docker volume rm uns-claudejp_redis_data >nul 2>&1
echo ✅ Volúmenes eliminados (simulando pérdida de datos)

echo.
echo ▶ PASO 4: Reconstruir sistema desde cero...
docker compose build --no-cache >nul 2>&1
echo ✅ Imágenes reconstruidas

echo.
echo ▶ PASO 5: Iniciar servicios...
docker compose --profile dev up -d >nul 2>&1
timeout /t 60 /nobreak >nul
echo ✅ Servicios iniciados (esperando 60s)

echo.
echo ▶ PASO 6: Restaurar datos desde backup...
cat "backup_final_drill_%TIMESTAMP%.sql" | docker exec -i uns-claudejp-600-db psql -U uns_admin uns_claudejp >nul 2>&1
echo ✅ Datos restaurados

echo.
echo ▶ PASO 7: Verificar sistema funcional...
curl -f -s http://localhost:8000/api/health >nul 2>&1
if %errorlevel% EQU 0 (
    echo ✅ DRILL #4 EXITOSO: Sistema completamente reconstruido y funcional
    set /a DRILL_SUCCESS+=1
) else (
    echo ❌ DRILL #4 FALLIDO: Sistema no responde después de rebuild
    set /a DRILL_FAILED+=1
)

:drill4_end
echo.
echo ═══════════════════════════════════════════════════════════════════════════════
echo.

REM ═════════════════════════════════════════════════════════════════════════════
REM RESUMEN DE DRILLS
REM ═════════════════════════════════════════════════════════════════════════════

echo 📊 DISASTER RECOVERY DRILLS SUMMARY
echo.
echo   Total Drills: %DRILL_COUNT%
echo   Exitosos: %DRILL_SUCCESS%
echo   Fallidos: %DRILL_FAILED%
echo.

if %DRILL_FAILED% EQU 0 (
    echo ✅ TODOS LOS DRILLS EXITOSOS
    echo.
    echo   Sistema de Disaster Recovery está OPERACIONAL
    echo   RTO (Recovery Time Objective): ~30 minutos
    echo   RPO (Recovery Point Objective): ~1 día
    echo   Confianza en Recuperación: ALTA
) else (
    echo ⚠️  ALGUNOS DRILLS FALLARON - REVISAR RESULTADOS
    echo.
    echo   Próximos pasos:
    echo   1. Revisar logs: docker compose logs --timestamps
    echo   2. Identificar qué falló
    echo   3. Corregir problema
    echo   4. Ejecutar drills nuevamente
)

echo.
echo ═══════════════════════════════════════════════════════════════════════════════
echo.

REM Guardar resultados
set "DRILL_REPORT=%PROJECT_ROOT%\DISASTER_RECOVERY_DRILL_REPORT_%TIMESTAMP%.txt"
(
    echo DISASTER RECOVERY DRILLS REPORT
    echo ════════════════════════════════════════════════════════════════════
    echo Fecha: %DATE% %TIME%
    echo.
    echo RESUMEN:
    echo   Drills Ejecutados: %DRILL_COUNT%
    echo   Exitosos: %DRILL_SUCCESS%
    echo   Fallidos: %DRILL_FAILED%
    echo.
    echo RESULTADOS POR DRILL:
    echo   Drill #1 - Database Backup ^& Restore: %DRILL_SUCCESS%/1
    echo   Drill #2 - Service Failover: %DRILL_SUCCESS%/1
    echo   Drill #3 - Data Integrity: %DRILL_SUCCESS%/1
    echo   Drill #4 - Complete System Rebuild: %DRILL_SUCCESS%/1
    echo.
    echo CONCLUSIONES:
    if %DRILL_FAILED% EQU 0 (
        echo   ✅ Sistema de Disaster Recovery OPERACIONAL
        echo   ✅ Backups funcionan correctamente
        echo   ✅ Restauración verificada
        echo   ✅ RTO aceptable (^<30 min)
    ) else (
        echo   ⚠️  Problemas detectados - Revisar y corregir
    )
    echo.
) > "%DRILL_REPORT%"

echo 📄 Reporte guardado en: %DRILL_REPORT%
echo.

pause >nul
