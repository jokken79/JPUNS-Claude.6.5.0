@echo off
setlocal EnableDelayedExpansion

title UNS-ClaudeJP 5.4 - Importacion de Datos

echo.
echo ============================================================================
echo                   UNS-CLAUDEJP 5.4 - IMPORTACION DE DATOS
echo                   Version 2025-11-13
echo ============================================================================
echo.

:: Variables globales
set "DOCKER_COMPOSE_CMD="
set "ERROR_FLAG=0"
set "BACKEND_CONTAINER="

:: ===========================================================================
::  FASE 1: VERIFICACION DEL SISTEMA
:: ===========================================================================

echo [FASE 1/4] Verificacion del Sistema
echo.

:: Verificar Docker
echo   [*] Docker Running........
docker ps >nul 2>&1
if !errorlevel! NEQ 0 (
    echo     [X] NO CORRIENDO
    echo.
    echo [X] ERROR: Docker Desktop no esta corriendo
    echo     Por favor inicia Docker Desktop y vuelve a ejecutar este script
    pause >nul
    goto :eof
)
echo     [OK]

:: Verificar Docker Compose
echo   [*] Docker Compose........
docker compose version >nul 2>&1
if !errorlevel! EQU 0 (
    set "DOCKER_COMPOSE_CMD=docker compose"
    echo     [OK] ^(V2^)
) else (
    docker-compose version >nul 2>&1
    if !errorlevel! EQU 0 (
        set "DOCKER_COMPOSE_CMD=docker-compose"
        echo     [OK] ^(V1^)
    ) else (
        echo     [X] NO ENCONTRADO
        set "ERROR_FLAG=1"
    )
)

:: Cambiar al directorio raiz del proyecto
cd /d "%~dp0\.."

:: Verificar archivos necesarios
echo   [*] employee_master.xlsm..
if exist "config\employee_master.xlsm" (
    echo     [OK]
) else (
    echo     [X] FALTA
    echo.
    echo [X] ERROR: No se encontro config\employee_master.xlsm
    echo     Este archivo es necesario para importar empleados
    pause >nul
    goto :eof
)

echo   [*] access_candidates_data.json..
if exist "config\access_candidates_data.json" (
    echo     [OK]
) else (
    echo     ! Warning: config\access_candidates_data.json no encontrado
    echo     i Se omitira la importacion de candidatos
)

echo.

:: Verificar si hay errores
if %ERROR_FLAG% EQU 1 (
    echo.
    echo [X] VERIFICACION FALLIDA - Corrige los errores antes de continuar
    pause >nul
    goto :eof
)

:: Verificar servicios Docker
echo   [*] Verificando servicios Docker...
%DOCKER_COMPOSE_CMD% ps backend >nul 2>&1
if !errorlevel! NEQ 0 (
    echo     [X] Servicio backend NO esta corriendo
    echo.
    echo [X] ERROR: El sistema debe estar corriendo antes de importar datos
    echo     Ejecuta primero: scripts\START.bat o scripts\REINSTALAR.bat
    pause >nul
    goto :eof
)

:: Detectar nombre del contenedor backend (puede ser uns-claudejp-600-backend-1 o uns-claudejp-541-backend-1)
for /f "tokens=*" %%a in ('docker ps --filter "name=backend" --format "{{.Names}}" 2^>nul ^| findstr /i "backend"') do (
    set "BACKEND_CONTAINER=%%a"
    goto :backend_found
)

:backend_found
if "%BACKEND_CONTAINER%"=="" (
    echo     [X] No se encontro contenedor backend
    echo.
    echo [X] ERROR: El contenedor backend no esta corriendo
    pause >nul
    goto :eof
)

echo     [OK] Backend: %BACKEND_CONTAINER%

%DOCKER_COMPOSE_CMD% ps db >nul 2>&1
if !errorlevel! NEQ 0 (
    echo     [X] Servicio db NO esta corriendo
    echo.
    echo [X] ERROR: La base de datos debe estar corriendo
    pause >nul
    goto :eof
)

:: Detectar nombre del contenedor db (puede ser uns-claudejp-600-db o uns-claudejp-600-db-1)
set "DB_CONTAINER="
for /f "tokens=*" %%a in ('docker ps --filter "name=db" --format "{{.Names}}" 2^>nul ^| findstr /i "db"') do (
    set "DB_CONTAINER=%%a"
    goto :db_found
)

:db_found
if "%DB_CONTAINER%"=="" (
    echo     [X] No se encontro contenedor db
    echo.
    echo [X] ERROR: El contenedor db no esta corriendo
    pause >nul
    goto :eof
)

echo     [OK] Database: %DB_CONTAINER%

echo.
echo [OK] Verificacion completada
echo.

:: ===========================================================================
::  FASE 2: CONFIRMACION
:: ===========================================================================

echo [FASE 2/4] Confirmacion
echo.
echo ============================================================================
echo                    ! ADVERTENCIA IMPORTANTE !
echo ============================================================================
echo  Esta accion ELIMINARA los datos actuales de empleados y los
echo  reemplazara con los datos del archivo Excel:
echo.
echo    [*] Archivo: config\employee_master.xlsm
echo    [*] Candidatos: config\access_candidates_data.json
echo    [*] Fotos: config\access_photo_mappings.json
echo.
echo  Los datos importados son REALES (no demo).
echo ============================================================================
echo.

set /p "CONFIRMAR=¿Continuar con la importacion? (S/N): "
if /i not "%CONFIRMAR%"=="S" if /i not "%CONFIRMAR%"=="SI" (
    echo.
    echo [X] Importacion cancelada
    echo.
    pause >nul
    goto :eof
)

echo.

:: ===========================================================================
::  FASE 3: IMPORTACION DE DATOS
:: ===========================================================================

echo [FASE 3/4] Importacion de Datos
echo.

:: Paso 1: Limpiar empleados actuales
echo ============================================================================
echo  [1/4] LIMPIAR EMPLEADOS ACTUALES
echo ============================================================================
echo.
echo   [*] Eliminando empleados actuales...
docker exec %DB_CONTAINER% psql -U uns_admin -d uns_claudejp -c "DELETE FROM employees;" >nul 2>&1
if !errorlevel! NEQ 0 (
    echo   ! Warning: Error al eliminar empleados (puede ser normal si no habia datos)
) else (
    echo   [OK] Empleados actuales eliminados
)
echo.

:: Paso 2: Validar estructura del archivo Excel
echo ============================================================================
echo  [2/5] VALIDAR ESTRUCTURA DEL ARCHIVO EXCEL
echo ============================================================================
echo.
echo   [*] Validando estructura de config\employee_master.xlsm...
echo   i Se verificaran las hojas y columnas requeridas...
echo.

REM BUG #8 FIX: Validar estructura del Excel antes de importar
docker exec %BACKEND_CONTAINER% python -c "
import openpyxl
import sys

try:
    # Cargar el workbook
    wb = openpyxl.load_workbook('/app/config/employee_master.xlsm', data_only=False)

    # Hojas requeridas
    required_sheets = ['派遣社員', '請負社員', 'スタッフ']
    missing_sheets = [sheet for sheet in required_sheets if sheet not in wb.sheetnames]

    if missing_sheets:
        print(f'ERROR: Hojas faltantes en el Excel: {missing_sheets}')
        sys.exit(1)

    # Columnas requeridas por hoja
    required_columns = {
        '派遣社員': ['社員№', '氏名', '派遣先'],
        '請負社員': ['社員№', '氏名'],
        'スタッフ': ['社員№', '氏名'],
    }

    # Validar columnas en cada hoja
    for sheet_name, required_cols in required_columns.items():
        ws = wb[sheet_name]
        header_row = [cell.value for cell in ws[1]]
        missing_cols = [col for col in required_cols if col not in header_row]

        if missing_cols:
            print(f'ERROR en hoja {sheet_name}: Columnas faltantes: {missing_cols}')
            sys.exit(1)

        # Contar filas de datos
        data_rows = ws.max_row - 1
        print(f'OK: {sheet_name} tiene {data_rows} filas de datos')

    print('OK: Validacion de estructura completada exitosamente')
    sys.exit(0)

except Exception as e:
    print(f'ERROR: Fallo la validacion del Excel: {str(e)}')
    sys.exit(1)
" >nul 2>&1

if !errorlevel! NEQ 0 (
    echo   [X] ERROR: El archivo Excel no tiene la estructura correcta
    echo.
    echo   Estructura requerida:
    echo     - Hoja 1: 派遣社員 (Columnas: 社員№, 氏名, 派遣先)
    echo     - Hoja 2: 請負社員 (Columnas: 社員№, 氏名)
    echo     - Hoja 3: スタッフ (Columnas: 社員№, 氏名)
    echo.
    pause >nul
    goto :eof
) else (
    echo   [OK] Estructura del Excel validada correctamente
)
echo.

:: Paso 3: Importar empleados desde Excel
echo ============================================================================
echo  [3/5] IMPORTAR EMPLEADOS DESDE EXCEL
echo ============================================================================
echo.

REM BUG #9 FIX: Agregar reintentos con exponential backoff
set "RETRY_COUNT=0"
set "MAX_RETRIES=3"
set "IMPORT_SUCCESS=0"

:import_retry_loop
set /a RETRY_COUNT+=1
echo   [*] Intento %RETRY_COUNT%/%MAX_RETRIES%: Ejecutando import_data.py...
echo   i Archivo: config\employee_master.xlsm
echo   i Este proceso puede tardar 2-3 minutos
echo.

docker exec %BACKEND_CONTAINER% python scripts/import_data.py
if !errorlevel! EQU 0 (
    set "IMPORT_SUCCESS=1"
    echo.
    echo   [OK] Empleados importados correctamente
    echo.
    goto :import_done
)

REM Si falló, verificar si hay más reintentos
if !RETRY_COUNT! LSS !MAX_RETRIES! (
    echo.
    echo   ! Warning: Intento %RETRY_COUNT% falló, reintentando en unos segundos...
    echo   i Esperando 5 segundos antes de reintentar...
    echo.
    timeout /t 5 /nobreak >nul
    goto :import_retry_loop
) else (
    echo.
    echo   [X] ERROR: Fallo la importacion de empleados despues de %MAX_RETRIES% intentos
    echo   i Revisa los mensajes de error arriba
    echo   i Verifica que el archivo Excel tenga la estructura correcta
    echo.
    pause >nul
    goto :eof
)

:import_done

:: Paso 4: Sincronizar fotos de candidatos a empleados
echo ============================================================================
echo  [4/5] SINCRONIZAR FOTOS CANDIDATOS -^> EMPLEADOS
echo ============================================================================
echo.
echo   [*] Sincronizando fotos por full_name_kanji...
docker exec %DB_CONTAINER% psql -U uns_admin -d uns_claudejp -c "UPDATE employees e SET photo_data_url = c.photo_data_url FROM candidates c WHERE e.full_name_kanji = c.full_name_kanji AND c.photo_data_url IS NOT NULL AND e.photo_data_url IS NULL;" >nul 2>&1
if !errorlevel! NEQ 0 (
    echo   ! Warning: Error en sincronizacion de fotos
) else (
    echo   [OK] Fotos sincronizadas
)
echo.

:: Paso 5: Sincronizar status de candidatos
echo ============================================================================
echo  [5/5] SINCRONIZAR STATUS CANDIDATOS ^<-^> EMPLEADOS
echo ============================================================================
echo.
echo   [*] Ejecutando sync_candidate_employee_status.py...
echo   i Este script vincula candidatos con empleados/staff/contract_workers
docker exec %BACKEND_CONTAINER% python scripts/sync_candidate_employee_status.py 2>&1
if !errorlevel! NEQ 0 (
    echo   ! Warning: Error en sincronizacion de status (puede ser normal si no hay candidatos)
) else (
    echo   [OK] Sincronizacion de status completada
)
echo.

:: ===========================================================================
::  FASE 4: VERIFICACION Y REPORTE FINAL
:: ===========================================================================

echo [FASE 4/4] Verificacion y Reporte Final
echo.

:: Generar reporte de importacion
echo ============================================================================
echo  REPORTE DE IMPORTACION
echo ============================================================================
echo.

docker exec %DB_CONTAINER% psql -U uns_admin -d uns_claudejp -c "SELECT 'Empleados totales' as metrica, COUNT(*)::text as valor FROM employees UNION ALL SELECT 'Empleados con foto', COUNT(*)::text FROM employees WHERE photo_data_url IS NOT NULL UNION ALL SELECT 'Empleados sin foto', COUNT(*)::text FROM employees WHERE photo_data_url IS NULL UNION ALL SELECT 'Candidatos totales', COUNT(*)::text FROM candidates UNION ALL SELECT 'Candidatos con foto', COUNT(*)::text FROM candidates WHERE photo_data_url IS NOT NULL;" 2>nul

echo.
echo ============================================================================

echo.
echo ============================================================================
echo             [OK] IMPORTACION COMPLETADA EXITOSAMENTE
echo ============================================================================
echo.
echo URLs para verificar:
echo   [*] Frontend:    http://localhost:3000
echo   [*] Backend:     http://localhost:8000
echo   [*] API Docs:    http://localhost:8000/api/docs
echo   [*] Adminer:     http://localhost:8080
echo.
echo Credenciales:
echo   [*] Usuario:     admin
echo   [*] Password:    admin123
echo.
echo ============================================================================
echo  [OK] TODO LISTO - PRESIONA CUALQUIER TECLA PARA CERRAR
echo ============================================================================
echo.
pause >nul
