@echo off
chcp 65001 >nul
setlocal EnableDelayedExpansion

title UNS-ClaudeJP 5.4 - Reparación de Migraciones Alembic

echo.
echo ╔══════════════════════════════════════════════════════════════════════╗
echo ║              REPARACIÓN DE MIGRACIONES ALEMBIC                        ║
echo ║                    UNS-ClaudeJP 5.4                                   ║
echo ╚══════════════════════════════════════════════════════════════════════╝
echo.

:: ========================================================================
:: FASE 1: DETENER SERVICIOS
:: ========================================================================
echo [1/6] Deteniendo todos los servicios...
docker compose down 2>nul
if !errorlevel! NEQ 0 (
    echo   ⚠ No había servicios corriendo
) else (
    echo   ✓ Servicios detenidos
)
echo.

:: ========================================================================
:: FASE 2: LIMPIAR VOLÚMENES (OPCIONAL)
:: ========================================================================
echo [2/6] ¿Deseas eliminar volúmenes de base de datos? (borra TODOS los datos)
set /p "CLEAN_VOLUMES=Continuar sin limpiar? (S/N): "
if /i "!CLEAN_VOLUMES!"=="N" (
    echo   ▶ Eliminando volúmenes...
    docker compose down -v 2>nul
    echo   ✓ Volúmenes eliminados - BASE DE DATOS LIMPIA
) else (
    echo   ✓ Conservando volúmenes - datos existentes preservados
)
echo.

:: ========================================================================
:: FASE 3: CREAR CONTENEDOR TEMPORAL
:: ========================================================================
echo [3/6] Preparando contenedor temporal para migraciones...
docker run --rm -d --name temp-migration-fix --network uns-claudejp-541_uns-network -v "%cd%\backend:/app" -v "%cd%\.env:/app/.env" --env-file .env uns-claudejp-541-backend sleep 600 2>nul
if !errorlevel! NEQ 0 (
    echo   ✗ Error creando contenedor temporal
    pause
    exit /b 1
)
echo   ✓ Contenedor temporal iniciado
echo.

:: ========================================================================
:: FASE 4: CREAR TABLAS DIRECTAMENTE
:: ========================================================================
echo [4/6] Creando tablas de base de datos (método directo)...
docker exec temp-migration-fix bash -c "cd /app && python -c \"
from app.models.models import *
from sqlalchemy import create_engine

engine = create_engine('postgresql://uns_admin:VF3sp-ZYs0ohQknm_rEmYU5UuEVfm7nGA3i-a_NetOs@db:5432/uns_claudejp')
Base.metadata.create_all(bind=engine)
print('✅ Tablas creadas exitosamente')
\" 2>&1"

if !errorlevel! NEQ 0 (
    echo   ✗ Error creando tablas
    docker stop temp-migration-fix 2>nul
    pause
    exit /b 1
)
echo   ✓ Tablas creadas
echo.

:: ========================================================================
:: FASE 5: CREAR USUARIO ADMIN
:: ========================================================================
echo [5/6] Creando usuario administrador...
docker exec temp-migration-fix bash -c "cd /app && python scripts/create_admin_user.py" 2>&1 | findstr "Usuario administrador"
if !errorlevel! NEQ 0 (
    echo   ⚠ Warning: Error creando usuario admin
) else (
    echo   ✓ Usuario admin creado
)
echo.

:: ========================================================================
:: FASE 6: INICIAR SERVICIOS
:: ========================================================================
echo [6/6] Iniciando servicios finales...
docker stop temp-migration-fix 2>nul

:: Iniciar sin importer
docker compose up -d db redis backend frontend adminer grafana prometheus tempo otel-collector 2>&1

if !errorlevel! NEQ 0 (
    echo   ✗ Error iniciando servicios
    pause
    exit /b 1
)

echo.
echo ✓ Servicios iniciados
echo.

:: Esperar compilación
echo   ▶ Esperando compilación del frontend (60s)...
timeout /t 60 /nobreak >nul

:: ========================================================================
:: VALIDACIÓN FINAL
:: ========================================================================
echo ╔══════════════════════════════════════════════════════════════════════╗
echo ║                    VALIDACIÓN DEL SISTEMA                             ║
echo ╚══════════════════════════════════════════════════════════════════════╝
echo.

echo   ▶ Verificando tablas en base de datos...
docker exec uns-claudejp-600-db psql -U uns_admin -d uns_claudejp -c "\dt" 2>&1 | findstr "public"

echo.
echo   ▶ Verificando backend...
timeout /t 10 /nobreak >nul
curl -s http://localhost:8000/api/health 2>&1 | findstr "status" >nul
if !errorlevel! EQU 0 (
    echo   ✓ Backend responde: http://localhost:8000/api/health
) else (
    echo   ⚠ Backend aún iniciando...
)

echo.
echo   ▶ Verificando frontend...
timeout /t 10 /nobreak >nul
curl -s http://localhost:3000 2>&1 | findstr "html" >nul
if !errorlevel! EQU 0 (
    echo   ✓ Frontend responde: http://localhost:3000
) else (
    echo   ⚠ Frontend aún iniciando...
)

echo.
echo ╔══════════════════════════════════════════════════════════════════════╗
echo ║                    ✅ REPARACIÓN COMPLETADA                           ║
echo ╚══════════════════════════════════════════════════════════════════════╝
echo.
echo URLs de acceso:
echo   • Frontend:   http://localhost:3000
echo   • Backend:    http://localhost:8000
echo   • API Docs:   http://localhost:8000/api/docs
echo   • Adminer:    http://localhost:8080
echo.
echo Credenciales:
echo   • Usuario:    admin
echo   • Password:   UldXY0fsVRv@6MoL (o la generada automáticamente)
echo.
echo ⚠ Si la password fue generada automáticamente, cámbiala en el primer login
echo.

pause >nul
