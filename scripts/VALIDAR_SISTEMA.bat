@echo off
chcp 65001 >nul
setlocal EnableDelayedExpansion

title UNS-ClaudeJP 5.4 - Validación Completa del Sistema

echo.
echo ╔══════════════════════════════════════════════════════════════════════╗
echo ║              VALIDACIÓN COMPLETA DEL SISTEMA v5.4                  ║
echo ╚══════════════════════════════════════════════════════════════════════╝
echo.

set "ERROR_COUNT=0"
set "WARNING_COUNT=0"

:: Cambiar al directorio raíz del proyecto
cd /d "%~dp0\.."

:: ══════════════════════════════════════════════════════════════════════════
::  VALIDACIÓN 1: SERVICIOS DOCKER
:: ══════════════════════════════════════════════════════════════════════════

echo [1/10] VALIDACIÓN DE SERVICIOS DOCKER
echo.

docker ps --format "{{.Names}}" | findstr "uns-claudejp-600-db" >nul
if !errorlevel! EQU 0 (
    echo   ✓ PostgreSQL corriendo
) else (
    echo   ✗ PostgreSQL NO corriendo
    set /a ERROR_COUNT+=1
)

docker ps --format "{{.Names}}" | findstr "uns-claudejp-600-backend-1" >nul
if !errorlevel! EQU 0 (
    echo   ✓ Backend corriendo
) else (
    echo   ✗ Backend NO corriendo
    set /a ERROR_COUNT+=1
)

docker ps --format "{{.Names}}" | findstr "uns-claudejp-600-frontend" >nul
if !errorlevel! EQU 0 (
    echo   ✓ Frontend corriendo
) else (
    echo   ✗ Frontend NO corriendo
    set /a ERROR_COUNT+=1
)

docker ps --format "{{.Names}}" | findstr "uns-claudejp-600-redis" >nul
if !errorlevel! EQU 0 (
    echo   ✓ Redis corriendo
) else (
    echo   ⚠ Redis NO corriendo
    set /a WARNING_COUNT+=1
)

echo.

:: ══════════════════════════════════════════════════════════════════════════
::  VALIDACIÓN 2: BASE DE DATOS
:: ══════════════════════════════════════════════════════════════════════════

echo [2/10] VALIDACIÓN DE BASE DE DATOS
echo.

docker exec uns-claudejp-600-db psql -U uns_admin -d uns_claudejp -c "SELECT 1" >nul 2>&1
if !errorlevel! EQU 0 (
    echo   ✓ Conexión a base de datos OK

    :: Contar tablas
    for /f "tokens=*" %%i in ('docker exec uns-claudejp-600-db psql -U uns_admin -d uns_claudejp -t -c "SELECT COUNT(*) FROM information_schema.tables WHERE table_schema='public';" 2^>nul') do set "TABLE_COUNT=%%i"
    echo   ✓ Tablas encontradas: !TABLE_COUNT!

    :: Verificar tablas críticas
    docker exec uns-claudejp-600-db psql -U uns_admin -d uns_claudejp -c "\dt candidates" 2>nul | findstr "candidates" >nul
    if !errorlevel! EQU 0 (
        echo   ✓ Tabla candidates existe
    ) else (
        echo   ✗ Tabla candidates NO existe
        set /a ERROR_COUNT+=1
    )

    docker exec uns-claudejp-600-db psql -U uns_admin -d uns_claudejp -c "\dt employees" 2>nul | findstr "employees" >nul
    if !errorlevel! EQU 0 (
        echo   ✓ Tabla employees existe
    ) else (
        echo   ✗ Tabla employees NO existe
        set /a ERROR_COUNT+=1
    )

    docker exec uns-claudejp-600-db psql -U uns_admin -d uns_claudejp -c "\dt apartments" 2>nul | findstr "apartments" >nul
    if !errorlevel! EQU 0 (
        echo   ✓ Tabla apartments existe (V2)
    ) else (
        echo   ✗ Tabla apartments NO existe
        set /a ERROR_COUNT+=1
    )
) else (
    echo   ✗ NO se puede conectar a base de datos
    set /a ERROR_COUNT+=1
)

echo.

:: ══════════════════════════════════════════════════════════════════════════
::  VALIDACIÓN 3: APARTAMENTOS V2
:: ══════════════════════════════════════════════════════════════════════════

echo [3/10] VALIDACIÓN DE APARTAMENTOS V2
echo.

:: Verificar tablas V2
docker exec uns-claudejp-600-db psql -U uns_admin -d uns_claudejp -c "\dt apartment_assignments" 2>nul | findstr "apartment_assignments" >nul
if !errorlevel! EQU 0 (
    echo   ✓ Tabla apartment_assignments existe
) else (
    echo   ⚠ Tabla apartment_assignments NO existe
    set /a WARNING_COUNT+=1
)

docker exec uns-claudejp-600-db psql -U uns_admin -d uns_claudejp -c "\dt additional_charges" 2>nul | findstr "additional_charges" >nul
if !errorlevel! EQU 0 (
    echo   ✓ Tabla additional_charges existe
) else (
    echo   ⚠ Tabla additional_charges NO existe
    set /a WARNING_COUNT+=1
)

docker exec uns-claudejp-600-db psql -U uns_admin -d uns_claudejp -c "\dt rent_deductions" 2>nul | findstr "rent_deductions" >nul
if !errorlevel! EQU 0 (
    echo   ✓ Tabla rent_deductions existe
) else (
    echo   ⚠ Tabla rent_deductions NO existe
    set /a WARNING_COUNT+=1
)

:: Contar apartamentos
for /f "tokens=*" %%i in ('docker exec uns-claudejp-600-db psql -U uns_admin -d uns_claudejp -t -c "SELECT COUNT(*) FROM apartments WHERE deleted_at IS NULL;" 2^>nul') do set "APT_COUNT=%%i"
echo   ℹ Apartamentos activos: !APT_COUNT!

echo.

:: ══════════════════════════════════════════════════════════════════════════
::  VALIDACIÓN 4: BACKEND API
:: ══════════════════════════════════════════════════════════════════════════

echo [4/10] VALIDACIÓN DE BACKEND API
echo.

curl -s http://localhost:8000/api/health | findstr "status" >nul
if !errorlevel! EQU 0 (
    echo   ✓ Backend health check OK
) else (
    echo   ✗ Backend health check FALLO
    set /a ERROR_COUNT+=1
)

curl -s http://localhost:8000/api/apartments-v2/apartments | findstr "items\|detail" >nul
if !errorlevel! EQU 0 (
    echo   ✓ API Apartamentos V2 responde
) else (
    echo   ⚠ API Apartamentos V2 no responde
    set /a WARNING_COUNT+=1
)

echo.

:: ══════════════════════════════════════════════════════════════════════════
::  VALIDACIÓN 5: FRONTEND
:: ══════════════════════════════════════════════════════════════════════════

echo [5/10] VALIDACIÓN DE FRONTEND
echo.

curl -s http://localhost:3000 | findstr "DOCTYPE\|html" >nul
if !errorlevel! EQU 0 (
    echo   ✓ Frontend responde
) else (
    echo   ✗ Frontend NO responde
    set /a ERROR_COUNT+=1
)

:: Verificar página de apartamentos
curl -s http://localhost:3000/apartments 2>nul | findstr "DOCTYPE\|html\|Unauthorized" >nul
if !errorlevel! EQU 0 (
    echo   ✓ Ruta /apartments accesible
) else (
    echo   ⚠ Ruta /apartments no accesible
    set /a WARNING_COUNT+=1
)

echo.

:: ══════════════════════════════════════════════════════════════════════════
::  VALIDACIÓN 6: MIGRACIONES
:: ══════════════════════════════════════════════════════════════════════════

echo [6/10] VALIDACIÓN DE MIGRACIONES
echo.

docker exec uns-claudejp-600-backend-1 alembic current 2>nul | findstr "head\|b6dc75dfbe7c" >nul
if !errorlevel! EQU 0 (
    echo   ✓ Migraciones aplicadas correctamente
) else (
    echo   ⚠ Migraciones pueden estar pendientes
    set /a WARNING_COUNT+=1
)

echo.

:: ══════════════════════════════════════════════════════════════════════════
::  VALIDACIÓN 7: ARCHIVOS CRÍTICOS
:: ══════════════════════════════════════════════════════════════════════════

echo [7/10] VALIDACIÓN DE ARCHIVOS CRÍTICOS
echo.

if exist ".env" (echo   ✓ Archivo .env existe) else (echo   ✗ Archivo .env FALTA & set /a ERROR_COUNT+=1)
if exist "docker-compose.yml" (echo   ✓ docker-compose.yml existe) else (echo   ✗ docker-compose.yml FALTA & set /a ERROR_COUNT+=1)
if exist "backend\app\main.py" (echo   ✓ backend\app\main.py existe) else (echo   ✗ backend\app\main.py FALTA & set /a ERROR_COUNT+=1)
if exist "frontend\package.json" (echo   ✓ frontend\package.json existe) else (echo   ✗ frontend\package.json FALTA & set /a ERROR_COUNT+=1)

echo.

:: ══════════════════════════════════════════════════════════════════════════
::  VALIDACIÓN 8: DATOS
:: ══════════════════════════════════════════════════════════════════════════

echo [8/10] VALIDACIÓN DE DATOS
echo.

for /f "tokens=*" %%i in ('docker exec uns-claudejp-600-db psql -U uns_admin -d uns_claudejp -t -c "SELECT COUNT(*) FROM candidates WHERE deleted_at IS NULL;" 2^>nul') do set "CAND_COUNT=%%i"
echo   ℹ Candidatos: !CAND_COUNT!

for /f "tokens=*" %%i in ('docker exec uns-claudejp-600-db psql -U uns_admin -d uns_claudejp -t -c "SELECT COUNT(*) FROM employees WHERE deleted_at IS NULL;" 2^>nul') do set "EMP_COUNT=%%i"
echo   ℹ Empleados: !EMP_COUNT!

for /f "tokens=*" %%i in ('docker exec uns-claudejp-600-db psql -U uns_admin -d uns_claudejp -t -c "SELECT COUNT(*) FROM factories WHERE deleted_at IS NULL;" 2^>nul') do set "FAC_COUNT=%%i"
echo   ℹ Fábricas: !FAC_COUNT!

echo.

:: ══════════════════════════════════════════════════════════════════════════
::  VALIDACIÓN 9: FOTOS
:: ══════════════════════════════════════════════════════════════════════════

echo [9/10] VALIDACIÓN DE FOTOS
echo.

for /f "tokens=*" %%i in ('docker exec uns-claudejp-600-db psql -U uns_admin -d uns_claudejp -t -c "SELECT COUNT(*) FROM candidates WHERE photo_data_url IS NOT NULL;" 2^>nul') do set "CAND_PHOTOS=%%i"
echo   ℹ Candidatos con foto: !CAND_PHOTOS!

for /f "tokens=*" %%i in ('docker exec uns-claudejp-600-db psql -U uns_admin -d uns_claudejp -t -c "SELECT COUNT(*) FROM employees WHERE photo_data_url IS NOT NULL;" 2^>nul') do set "EMP_PHOTOS=%%i"
echo   ℹ Empleados con foto: !EMP_PHOTOS!

echo.

:: ══════════════════════════════════════════════════════════════════════════
::  VALIDACIÓN 10: RESUMEN FINAL
:: ══════════════════════════════════════════════════════════════════════════

echo [10/10] RESUMEN FINAL
echo.
echo ══════════════════════════════════════════════════════════════════════════
echo.

if !ERROR_COUNT! EQU 0 (
    if !WARNING_COUNT! EQU 0 (
        echo   ✅ SISTEMA 100%% FUNCIONAL
        echo   ℹ  Todos los componentes OK
    ) else (
        echo   ⚠  SISTEMA FUNCIONAL CON ADVERTENCIAS
        echo   ℹ  Advertencias: !WARNING_COUNT!
        echo   ℹ  El sistema funciona pero puede necesitar atención
    )
) else (
    echo   ❌ SISTEMA CON ERRORES
    echo   ℹ  Errores críticos: !ERROR_COUNT!
    echo   ℹ  Advertencias: !WARNING_COUNT!
    echo   ℹ  Revisa los mensajes arriba
)

echo.
echo ══════════════════════════════════════════════════════════════════════════
echo.

pause >nul
