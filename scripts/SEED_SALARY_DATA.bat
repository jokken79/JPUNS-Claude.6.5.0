@echo off
REM ============================================
REM Seed Salary System Test Data
REM ============================================
REM
REM Este script crea datos de prueba para el sistema de salarios:
REM - 5 empleados con tasas horarias variadas
REM - 2 factories con configuraciones diferentes
REM - 5 apartamentos con rentas variadas
REM - 100 timer cards (octubre 2025)
REM - 5 salary calculations
REM - PayrollSettings configurado
REM - 1 PayrollRun con EmployeePayroll
REM
REM ============================================

setlocal enabledelayedexpansion

echo.
echo ============================================================
echo   SEED SALARY SYSTEM TEST DATA
echo ============================================================
echo.
echo Este script creara datos de prueba para testing del sistema
echo de salarios y nominas.
echo.
echo ADVERTENCIA: Esto eliminara datos de prueba existentes!
echo - Employees con hakenmoto_id ^>= 1001
echo - Timer cards relacionados
echo - Salary calculations relacionados
echo - Payroll runs de prueba
echo.
echo Datos de PRODUCCION NO seran afectados.
echo.

REM Verificar si Docker esta corriendo
docker ps >nul 2>&1
if errorlevel 1 (
    echo [ERROR] Docker no esta corriendo.
    echo Por favor inicie Docker Desktop y vuelva a intentar.
    pause >nul
    exit /b 1
)

REM Verificar si el contenedor backend existe
docker ps -a --format "{{.Names}}" | findstr /C:"uns-claudejp-600-backend-1" >nul
if errorlevel 1 (
    echo [ERROR] Contenedor 'uns-claudejp-600-backend-1' no encontrado.
    echo Por favor ejecute START.bat primero.
    pause >nul
    exit /b 1
)

REM Verificar si el contenedor esta corriendo
docker ps --format "{{.Names}}" | findstr /C:"uns-claudejp-600-backend-1" >nul
if errorlevel 1 (
    echo [ADVERTENCIA] Contenedor backend no esta corriendo.
    echo Iniciando contenedor...
    docker start uns-claudejp-600-backend-1 >nul 2>&1
    timeout /t 3 /nobreak >nul
)

echo Desea continuar? (S/N)
set /p CONFIRM=^>
if /i not "%CONFIRM%"=="S" (
    echo.
    echo Operacion cancelada.
    pause >nul
    exit /b 0
)

echo.
echo [INFO] Ejecutando script de seed...
echo.

REM Ejecutar script de seed
docker exec uns-claudejp-600-backend-1 python backend/scripts/seed_salary_data.py

if errorlevel 1 (
    echo.
    echo [ERROR] Error al ejecutar el script de seed.
    echo Revise los logs arriba para mas detalles.
    pause >nul
    exit /b 1
)

echo.
echo ============================================================
echo   VERIFICANDO DATOS CREADOS
echo ============================================================
echo.

REM Ejecutar script de verificacion
docker exec uns-claudejp-600-backend-1 python backend/scripts/verify_salary_seed.py

if errorlevel 1 (
    echo.
    echo [ADVERTENCIA] Verificacion fallo. Revise los datos creados.
    pause >nul
    exit /b 1
)

echo.
echo ============================================================
echo   SEED COMPLETADO EXITOSAMENTE
echo ============================================================
echo.
echo Puede ahora:
echo - Acceder a la API en http://localhost:8000/api/docs
echo - Probar endpoints de salary en /api/salary/
echo - Probar endpoints de payroll en /api/payroll/
echo - Ver los datos en http://localhost:8080 (Adminer)
echo.
echo Credenciales Adminer:
echo - Sistema: PostgreSQL
echo - Servidor: db
echo - Usuario: uns_admin
echo - Password: uns_password
echo - Base de datos: uns_claudejp
echo.
echo Para ver los datos creados, ejecute queries SQL:
echo   SELECT * FROM employees WHERE hakenmoto_id ^>= 1001;
echo   SELECT * FROM timer_cards ORDER BY work_date;
echo   SELECT * FROM salary_calculations;
echo   SELECT * FROM payroll_runs;
echo.

pause >nul
exit /b 0
