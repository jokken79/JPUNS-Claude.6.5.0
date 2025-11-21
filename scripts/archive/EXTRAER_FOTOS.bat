@echo off
chcp 65001 >nul 2>&1
setlocal EnableDelayedExpansion
title UNS-ClaudeJP 5.4 - Extraccion de Fotos

echo ================================================================================
echo    UNS-CLAUDEJP 5.4 - EXTRACCION AUTOMATICA DE FOTOS
echo ================================================================================
echo.

echo Verificando Python...
python --version >nul 2>&1
if %errorlevel% NEQ 0 (
    echo ERROR: Python NO encontrado
    pause
    exit /b 1
)

echo OK: Python encontrado
echo.

echo Buscando base de datos...
set "DB_FOUND=0"
if exist "BASEDATEJP\*.accdb" (
    for %%f in (BASEDATEJP\*.accdb) do (
        echo OK: Base de datos encontrada: %%~nxf
        set "DB_PATH=%%f"
        set "DB_FOUND=1"
    )
)

if !DB_FOUND! EQU 0 (
    echo ERROR: Base de datos no encontrada
    pause
    exit /b 1
)

echo OK: Base de datos: !DB_PATH!
echo.

echo Verificando archivo de mapeo...
set "OUTPUT_FILE=access_photo_mappings.json"
set "FORCE_REGENERATE="

if exist "%OUTPUT_FILE%" (
    echo INFO: Archivo ya existe
    set /p "RESPONSE=Deseas REGENERAR las fotos? (S/N): "
    if /i "!RESPONSE!"=="S" (
        echo INFO: Regenerando fotos...
        set "FORCE_REGENERATE=--force"
    ) else (
        echo INFO: Usando archivo existente
        goto :finalMessage
    )
) else (
    echo INFO: Generando fotos por primera vez...
)

echo.
echo Ejecutando extraccion...
echo Script: backend\scripts\auto_extract_photos_from_databasejp.py
echo Base de datos: !DB_PATH!
echo Parametros: !FORCE_REGENERATE!
echo.

python backend\scripts\auto_extract_photos_from_databasejp.py !FORCE_REGENERATE!
set "PYTHON_EXIT_CODE=!errorlevel!"

echo.
echo ================================================================================
echo    RESULTADO DE LA EXTRACCION
echo ================================================================================
echo.

if !PYTHON_EXIT_CODE! EQU 0 (
    echo OK: El script se ejecuto correctamente
    
    if exist "%OUTPUT_FILE%" (
        echo OK: Archivo generado: %OUTPUT_FILE%
        
        for %%A in ("%OUTPUT_FILE%") do (
            set /a "JSON_SIZE=%%~zA"
            set /a "JSON_SIZE_KB=!JSON_SIZE! / 1024"
            echo INFO: Tamaño final: !JSON_SIZE_KB! KB
            echo INFO: Fecha: %%~tA
        )
        
        echo OK: Las fotos se importaran automaticamente durante la reinstalacion
    ) else (
        echo WARNING: El script termino OK pero NO genero %OUTPUT_FILE%
    )
) else (
    echo ERROR: El script fallo con codigo de error: !PYTHON_EXIT_CODE!
    echo.
    echo SOLUCIONES:
    echo 1. Verifica que Microsoft Access Database Engine este instalado
    echo 2. Verifica que la base de datos no este en uso
    echo 3. Ejecuta como Administrador si es necesario
)

echo.
goto :finalMessage

:finalMessage
echo ================================================================================
echo    PRESIONA CUALQUIER TECLA PARA CERRAR ESTA VENTANA
echo ================================================================================
pause >nul
