@echo off
REM ============================================================
REM EXTRACT PHOTOS FROM ACCESS DATABASE (MEJORADO)
REM ============================================================
REM Mantiene la ventana abierta para ver resultados
REM ============================================================

setlocal enabledelayedexpansion

echo.
echo ============================================================
echo EXTRAYENDO FOTOS DE LA BASE DE DATOS ACCESS
echo ============================================================
echo.

REM Check if pywin32 is installed
python -c "import win32com.client" 2>nul
if errorlevel 1 (
    echo ERROR: pywin32 no esta instalado!
    echo.
    echo Para instalar, ejecuta:
    echo   pip install pywin32
    echo.
    pause
)

echo pywin32 encontrado - OK
echo.

cd /d "%~dp0.."

echo OPCIONES:
echo   1 = Test con primeras 5 fotos (RECOMENDADO)
echo   2 = Extraer TODAS las fotos (puede tardar 20+ min)
echo   3 = Extraer primeras 100 fotos
echo   q = Salir
echo.

set /p choice="Selecciona opcion (1/2/3/q): "

if /i "%choice%"=="q" (
    exit /b 0
)

if /i "%choice%"=="1" (
    echo.
    echo Ejecutando: python backend\scripts\extract_access_attachments.py --sample
    echo.
    python backend\scripts\extract_access_attachments.py --sample
    goto success
)

if /i "%choice%"=="2" (
    echo.
    echo ADVERTENCIA: Esto puede tardar 20-30 minutos
    echo.
    set /p confirm="Continuar? (s/n): "
    if /i not "%confirm%"=="s" (
        echo Cancelado
        goto end
    )
    echo.
    echo Ejecutando: python backend\scripts\extract_access_attachments.py --full
    echo.
    python backend\scripts\extract_access_attachments.py --full
    goto success
)

if /i "%choice%"=="3" (
    echo.
    echo Ejecutando: python backend\scripts\extract_access_attachments.py --limit 100
    echo.
    python backend\scripts\extract_access_attachments.py --limit 100
    goto success
)

echo Opcion invalida
goto end

:success
echo.
echo ============================================================
echo Extraccion completada!
echo ============================================================
echo.

REM Verificar si se genero el archivo JSON
if exist "backend\scripts\access_photo_mappings.json" (
    echo OK: Se genero access_photo_mappings.json
    echo.
    echo Proximo paso:
    echo   Ejecuta: python backend\scripts\import_photos_from_json.py
    echo.
    echo O en Docker:
    echo   docker exec -it uns-claudejp-600-backend-1 python scripts/import_photos_from_json.py
) else (
    echo ADVERTENCIA: No se genero access_photo_mappings.json
    echo Revisa los errores arriba
)

:end
echo.
pause
