@echo off
REM ============================================================================
REM SCRIPT: VERIFY_CONFIG.bat
REM Propósito: Verificar que la configuración está correcta sin bugs
REM Evita los 3 problemas principales que causan 3+ horas de debugging
REM ============================================================================

setlocal enabledelayedexpansion

echo.
echo ============================================================================
echo  VERIFICADOR DE CONFIGURACION - UNS-ClaudeJP v6.0.0
echo ============================================================================
echo.

REM Colores (simulados con variables)
set "OK=[OK]"
set "ERROR=[ERROR]"
set "WARN=[WARN]"

REM ============================================================================
REM 1. Verificar que Docker está corriendo
REM ============================================================================
echo [1/5] Verificando Docker...
docker compose ps >nul 2>&1
if errorlevel 1 (
    echo %ERROR% Docker no está corriendo o no hay proyecto Docker activo
    echo       Inicia Docker Desktop primero
    goto :end_error
)
echo %OK% Docker está corriendo

REM ============================================================================
REM 2. Verificar backend/app/main.py tiene redirect_slashes=True
REM ============================================================================
echo [2/5] Verificando backend/app/main.py...
findstr /C:"redirect_slashes=True" backend\app\main.py >nul 2>&1
if errorlevel 1 (
    echo %ERROR% redirect_slashes debe ser True, no False
    echo       Línea debe ser: redirect_slashes=True,
    echo.
    echo       Abriendo archivo para corregir...
    notepad backend\app\main.py
    goto :end_error
)
echo %OK% redirect_slashes=True está configurado correctamente

REM ============================================================================
REM 3. Verificar backend/app/api/auth.py tiene @router.post("/login/")
REM ============================================================================
echo [3/5] Verificando backend/app/api/auth.py...
findstr /C:"@router.post(\"/login/\", response_model=Token)" backend\app\api\auth.py >nul 2>&1
if errorlevel 1 (
    echo %ERROR% Falta el decorator @router.post^(\"/login/\"^)
    echo       Debe haber dos decorators:
    echo       - @router.post^(\"/login\"^)
    echo       - @router.post^(\"/login/\"^)
    echo.
    echo       Abriendo archivo para corregir...
    notepad backend\app\api\auth.py
    goto :end_error
)
echo %OK% @router.post^(\"/login/\"^) está configurado correctamente

REM ============================================================================
REM 4. Verificar admin user password hash en base de datos
REM ============================================================================
echo [4/5] Verificando admin user en base de datos...
docker exec uns-claudejp-600-db psql -U uns_admin -d uns_claudejp -c "SELECT password_hash FROM users WHERE username='admin';" > temp_hash.txt 2>nul
findstr /C:"$2b$12$" temp_hash.txt >nul 2>&1
if errorlevel 1 (
    echo %ERROR% Admin password hash no está correctamente configurado
    echo       Ejecutando fix_admin_password.py...
    docker exec uns-claudejp-600-backend-1 python /app/scripts/fix_admin_password.py
    if errorlevel 1 (
        echo %ERROR% No se pudo reparar el password
        goto :end_error
    )
    echo %OK% Password reparado correctamente
) else (
    echo %OK% Admin password hash es válido
)
del temp_hash.txt 2>nul

REM ============================================================================
REM 5. Verificar que todos los servicios están healthy
REM ============================================================================
echo [5/5] Verificando servicios Docker...
docker compose ps | findstr "(healthy)" >nul 2>&1
if errorlevel 1 (
    echo %WARN% Algunos servicios no están healthy
    echo       Espera 10 segundos e intenta de nuevo...
    timeout /t 10 /nobreak
    docker compose ps
) else (
    echo %OK% Todos los servicios están healthy
)

echo.
echo ============================================================================
echo  ✅ VERIFICACION COMPLETADA - SISTEMA SIN BUGS
echo ============================================================================
echo.
echo Ahora puedes:
echo   1. Abrir: http://localhost:3000/login
echo   2. Login: admin / admin123
echo   3. El dashboard debería cargar sin errores 404
echo.
pause >nul
goto :end_success

:end_error
echo.
echo ============================================================================
echo  ❌ VERIFICACION FALLIDA
echo ============================================================================
echo.
pause >nul
exit /b 1

:end_success
exit /b 0
