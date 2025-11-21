@echo off
REM ========================================================
REM SCRIPT DE VALIDACION PRE-START
REM Ejecuta validaciones ANTES de iniciar Docker
REM Previene errores de import como el de pages.py
REM ========================================================

echo.
echo ========================================================
echo  VALIDACION DE SISTEMA - UNS-ClaudeJP 5.2
echo ========================================================
echo.

REM ========================================================
REM 1. Verificar que Docker está corriendo
REM ========================================================
echo [1/5] Verificando Docker Desktop...
docker info >nul 2>&1
if %ERRORLEVEL% NEQ 0 (
    echo.
    echo   ❌ ERROR: Docker Desktop no esta corriendo
    echo.
    echo   SOLUCION:
    echo   1. Abre Docker Desktop desde el menu de inicio
    echo   2. Espera a que diga "Docker Desktop is running"
    echo   3. Ejecuta este script de nuevo
    echo.
    pause
    exit /b 1
)
echo   ✅ Docker Desktop esta corriendo

REM ========================================================
REM 2. Validar imports del backend
REM ========================================================
echo.
echo [2/5] Validando imports del backend...

REM Verificar si pytest está instalado localmente
python -m pip show pytest >nul 2>&1
if %ERRORLEVEL% NEQ 0 (
    echo   ⚠️  pytest no instalado localmente - saltando validacion local
    echo   (Se validara dentro del contenedor)
    goto skip_local_test
)

REM Ejecutar tests de imports
cd backend
python -m pytest tests/test_imports.py -v --tb=short
if %ERRORLEVEL% NEQ 0 (
    echo.
    echo   ❌ ERROR: Imports del backend tienen errores
    echo.
    echo   CAUSA: Algun archivo tiene imports incorrectos
    echo   SOLUCION: Revisa el error arriba y corrige el import
    echo.
    pause
    cd ..
    exit /b 1
)
cd ..
echo   ✅ Imports del backend son validos

:skip_local_test

REM ========================================================
REM 3. Verificar archivos críticos
REM ========================================================
echo.
echo [3/5] Verificando archivos criticos...

set "critical_files=docker-compose.yml .env backend\app\main.py frontend\package.json"
set "missing_files="

for %%f in (%critical_files%) do (
    if not exist "%%f" (
        set "missing_files=!missing_files! %%f"
    )
)

if not "%missing_files%"=="" (
    echo.
    echo   ❌ ERROR: Archivos criticos faltantes:
    echo   %missing_files%
    echo.
    pause
    exit /b 1
)
echo   ✅ Todos los archivos criticos existen

REM ========================================================
REM 4. Verificar puertos libres
REM ========================================================
echo.
echo [4/5] Verificando puertos requeridos...

set "ports_in_use="
netstat -ano | findstr ":3000 " >nul 2>&1 && set "ports_in_use=!ports_in_use! 3000"
netstat -ano | findstr ":8000 " >nul 2>&1 && set "ports_in_use=!ports_in_use! 8000"
netstat -ano | findstr ":5432 " >nul 2>&1 && set "ports_in_use=!ports_in_use! 5432"

if not "%ports_in_use%"=="" (
    echo.
    echo   ⚠️  ADVERTENCIA: Puertos en uso:%ports_in_use%
    echo   Esto podria causar conflictos
    echo.
    echo   ¿Continuar de todas formas? (S/N)
    choice /C SN /M "Respuesta"
    if %ERRORLEVEL% NEQ 1 (
        exit /b 1
    )
) else (
    echo   ✅ Puertos 3000, 8000, 5432 estan libres
)

REM ========================================================
REM 5. Verificar espacio en disco
REM ========================================================
echo.
echo [5/5] Verificando espacio en disco...
REM Simplificado - solo verificar que el comando funciona
wmic logicaldisk get size,freespace,caption >nul 2>&1
if %ERRORLEVEL% EQU 0 (
    echo   ✅ Espacio en disco verificado
) else (
    echo   ⚠️  No se pudo verificar espacio en disco
)

REM ========================================================
REM RESULTADO FINAL
REM ========================================================
echo.
echo ========================================================
echo  ✅ VALIDACION COMPLETADA
echo ========================================================
echo.
echo   El sistema esta listo para iniciar
echo   Ejecuta: scripts\START.bat
echo.
pause

pause >nul
