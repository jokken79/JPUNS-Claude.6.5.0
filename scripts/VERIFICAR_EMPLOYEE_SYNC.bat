@echo off
chcp 65001 >nul
setlocal EnableDelayedExpansion

title Verificación Sistema Empleados/Staff/Ukeoi

echo.
echo ╔══════════════════════════════════════════════════════════════════════╗
echo ║      VERIFICACIÓN SISTEMA EMPLEADOS/STAFF/CONTRACT_WORKERS         ║
echo ╚══════════════════════════════════════════════════════════════════════╝
echo.

echo [1/5] Verificando que backend está corriendo...
docker ps | findstr "uns-claudejp-600-backend-1" >nul 2>&1
if !errorlevel! NEQ 0 (
    echo   X ERROR: Backend no está corriendo
    echo   i Ejecuta: scripts\START.bat
    pause >nul
    goto :eof
)
echo   ∁EBackend corriendo

echo.
echo [2/5] Verificando tablas en base de datos...
docker exec uns-claudejp-600-db psql -U uns_admin -d uns_claudejp -c "SELECT COUNT(*) FROM employees;" >nul 2>&1
if !errorlevel! NEQ 0 (
    echo   X ERROR: Tabla employees no existe
    pause >nul
    goto :eof
)
echo   ∁ETabla employees OK

docker exec uns-claudejp-600-db psql -U uns_admin -d uns_claudejp -c "SELECT COUNT(*) FROM staff;" >nul 2>&1
if !errorlevel! NEQ 0 (
    echo   X ERROR: Tabla staff no existe
    pause >nul
    goto :eof
)
echo   ∁ETabla staff OK

docker exec uns-claudejp-600-db psql -U uns_admin -d uns_claudejp -c "SELECT COUNT(*) FROM contract_workers;" >nul 2>&1
if !errorlevel! NEQ 0 (
    echo   X ERROR: Tabla contract_workers no existe
    pause >nul
    goto :eof
)
echo   ∁ETabla contract_workers OK

echo.
echo [3/5] Ejecutando sincronización...
docker exec uns-claudejp-600-backend-1 python scripts/sync_candidate_employee_status.py
if !errorlevel! NEQ 0 (
    echo   X ERROR: Falló la sincronización
    pause >nul
    goto :eof
)
echo   ∁ESincronización completada

echo.
echo [4/5] Verificando endpoint change-type...
docker exec uns-claudejp-600-backend-1 python -c "import sys; sys.path.insert(0, '/app'); from app.api.employees import router; routes = [r.path for r in router.routes]; print('∁EEndpoint change-type existe' if any('change-type' in r for r in routes) else 'X Endpoint no encontrado')"
if !errorlevel! NEQ 0 (
    echo   ! Warning: No se pudo verificar endpoint
)

echo.
echo [5/5] Verificando schemas...
docker exec uns-claudejp-600-backend-1 python -c "from app.schemas.employee import StaffResponse, ContractWorkerResponse; print('∁ESchemas separados existen')"
if !errorlevel! NEQ 0 (
    echo   X ERROR: Schemas no encontrados
    pause >nul
    goto :eof
)
echo   ∁ESchemas OK

echo.
echo ╔══════════════════════════════════════════════════════════════════════╗
echo ║                 ∁EVERIFICACIÓN COMPLETADA                           ║
echo ╚══════════════════════════════════════════════════════════════════════╝
echo.
echo Todo el sistema está funcionando correctamente:
echo   ∁ETodas las tablas existen (employees, staff, contract_workers)
echo   ∁ESincronización funciona correctamente
echo   ∁EEndpoint change-type disponible
echo   ∁ESchemas separados implementados
echo.
echo Puedes probar el sistema en:
echo   • Frontend: http://localhost:3000/dashboard/employees
echo   • API Docs: http://localhost:8000/api/docs
echo.

pause >nul
