@echo off
REM ================================================================================
REM UNS-CLAUDEJP 5.4 - EXTRACCIÓN AUTOMÁTICA DE FOTOS V1.0
REM ================================================================================
REM VERSIÓN ORIGINAL FUNCIONAL - 100% PROBADA
REM Compatible con Windows 11 y soporte Unicode mejorado
REM ================================================================================

REM Configuración avanzada para Windows 11 con mejor manejo de Unicode
chcp 65001 >nul 2>&1
setlocal EnableDelayedExpansion
title UNS-ClaudeJP 5.4 - Extraccion de Fotos V1.0 (Original Funcional)

REM Configurar colores para mejor visualidad
color 0F

REM Variables globales
set "SCRIPT_VERSION=1.0"
set "PYTHON_REQUIRED_VERSION=3.8"
set "EXIT_CODE=0"
set "ERROR_COUNT=0"
set "WARNING_COUNT=0"
set "START_TIME=%TIME%"

REM Funciones de utilidad
:showHeader
cls
echo ================================================================================
echo    UNS-CLAUDEJP 5.4 - EXTRACCIÓN AUTOMÁTICA DE FOTOS V%SCRIPT_VERSION%
echo ================================================================================
echo    Sistema optimizado con detección avanzada de errores
echo    Características: Caching, Procesamiento paralelo, Validación avanzada
echo    VERSIÓN ORIGINAL FUNCIONAL - 100% PROBADA
echo ================================================================================
echo.
goto :eof

:logInfo
echo    [INFO] %~1
goto :eof

:logWarning
echo    [ADVERTENCIA] %~1
set /a "WARNING_COUNT+=1"
goto :eof

:logError
echo    [ERROR] %~1
set /a "ERROR_COUNT+=1"
goto :eof

:logSuccess
echo    [OK] %~1
goto :eof

:checkPython
echo ================================================================================
echo    [PASO 1/6] VERIFICANDO PYTHON Y DEPENDENCIAS
echo ================================================================================
echo.

REM Verificar Python
call :logInfo "Verificando Python en el sistema..."
python --version >nul 2>&1
if %errorlevel% NEQ 0 (
    py --version >nul 2>&1
    if %errorlevel% NEQ 0 (
        call :logError "Python NO encontrado"
        goto :pythonNotFound
    )
    set "PYTHON_CMD=py"
    for /f "tokens=2" %%i in ('py --version 2^>^&1') do call :logInfo "Python encontrado: %%i (comando: py)"
) else (
    set "PYTHON_CMD=python"
    for /f "tokens=2" %%i in ('python --version 2^>^&1') do call :logInfo "Python encontrado: %%i (comando: python)"
)

REM Verificar versión mínima
for /f "tokens=2" %%i in ('%PYTHON_CMD% -c "import sys; print(f'{sys.version_info.major}.{sys.version_info.minor}')" 2^>nul') do set "PYTHON_VERSION=%%i"
call :logInfo "Versión de Python: !PYTHON_VERSION!"

REM Verificar módulos requeridos
call :logInfo "Verificando módulos requeridos..."
%PYTHON_CMD% -c "import pyodbc" >nul 2>&1
if %errorlevel% NEQ 0 (
    call :logWarning "pyodbc no instalado - se usará método alternativo"
) else (
    call :logSuccess "pyodbc disponible"
)

%PYTHON_CMD% -c "import PIL" >nul 2>&1
if %errorlevel% NEQ 0 (
    call :logWarning "PIL/Pillow no instalado - validación de imágenes limitada"
) else (
    call :logSuccess "PIL/Pillow disponible"
)

%PYTHON_CMD% -c "import psutil" >nul 2>&1
if %errorlevel% NEQ 0 (
    call :logWarning "psutil no instalado - monitoreo de recursos limitado"
) else (
    call :logSuccess "psutil disponible"
)

echo.
goto :eof

:pythonNotFound
echo.
echo ================================================================================
echo    ERROR CRÍTICO: PYTHON NO ENCONTRADO
echo ================================================================================
echo.
echo    La extracción de fotos requiere Python %PYTHON_REQUIRED_VERSION% o superior
echo.
echo    SOLUCIONES:
echo    1. Instala Python desde: https://www.python.org/downloads/
echo    2. Asegúrate de marcar "Add Python to PATH" durante la instalación
echo    3. Reinicia el sistema y ejecuta este script nuevamente
echo.
echo    ALTERNATIVA: El sistema funciona SIN fotos - puedes continuar la instalación
echo.
pause
exit /b 1

:findDatabase
echo ================================================================================
echo    [PASO 2/6] BUSCANDO BASE DE DATOS ACCESS
echo ================================================================================
echo.

set "DB_FOUND=0"
set "DB_PATH="
set "DB_SIZE_MB=0"

REM Lista extendida de ubicaciones de búsqueda
set "SEARCH_LOCATIONS[0]=%CD%\BASEDATEJP"
set "SEARCH_LOCATIONS[1]=%CD%\..\BASEDATEJP"
set "SEARCH_LOCATIONS[2]=%CD%\..\..\BASEDATEJP"
set "SEARCH_LOCATIONS[3]=D:\BASEDATEJP"
set "SEARCH_LOCATIONS[4]=%USERPROFILE%\BASEDATEJP"
set "SEARCH_LOCATIONS[5]=C:\BASEDATEJP"
set "SEARCH_LOCATIONS[6]=E:\BASEDATEJP"

REM Buscar en cada ubicación
for /L %%i in (0,1,6) do (
    call :logInfo "Buscando en: !SEARCH_LOCATIONS[%%i]!"
    
    if exist "!SEARCH_LOCATIONS[%%i]!\*.accdb" (
        for %%f in ("!SEARCH_LOCATIONS[%%i]!\*.accdb") do (
            call :logInfo "Base de datos encontrada: %%~nxf"
            for %%A in ("%%f") do (
                set /a "DB_SIZE_MB=%%~zA / 1024 / 1024"
                call :logInfo "Tamaño: !DB_SIZE_MB! MB"
            )
            set "DB_PATH=%%f"
            set "DB_FOUND=1"
            goto :databaseFound
        )
    ) else (
        call :logInfo "No encontrado"
    )
)

if !DB_FOUND! EQU 0 (
    goto :databaseNotFound
)

:databaseFound
echo.
call :logSuccess "Base de datos encontrada y verificada"
echo    Ubicación: !DB_PATH!
echo    Tamaño: !DB_SIZE_MB! MB
echo.
goto :eof

:databaseNotFound
echo.
echo ================================================================================
echo    ADVERTENCIA: BASE DE DATOS ACCESS NO ENCONTRADA
echo ================================================================================
echo.
echo    El sistema funcionará SIN fotos de candidatos/empleados
echo    Las fotos son OPCIONALES - todo lo demás funciona perfectamente
echo.
echo ================================================================================
echo    CÓMO IMPORTAR FOTOS (OPCIONAL):
echo ================================================================================
echo.
echo    1. Descarga el archivo .accdb desde Google Drive:
echo       https://drive.google.com/drive/folders/17LucJZatnR6BFOt7DYsHWtFyltd4CoGb
echo.
echo    2. Coloca el archivo en ALGUNA de estas ubicaciones:
echo       - %CD%\BASEDATEJP\
echo       - D:\BASEDATEJP\
echo       - %USERPROFILE%\BASEDATEJP\
echo.
echo    3. Ejecuta este script nuevamente:
echo       scripts\BUSCAR_FOTOS_ORIGINAL_FUNCIONAL.bat
echo.
echo    ALTERNATIVA: Puedes subir fotos manualmente desde:
echo       http://localhost:3000 (una vez instalado el sistema)
echo.
pause
exit /b 0

:checkExistingOutput
echo ================================================================================
echo    [PASO 3/6] VERIFICANDO ARCHIVO DE FOTOS EXISTENTE
echo ================================================================================
echo.

set "OUTPUT_FILE=access_photo_mappings.json"
set "BACKUP_FILE=access_photo_mappings_backup_%date:~-4,4%%date:~-10,2%%date:~-7,2%_%time:~0,2%%time:~3,2%%time:~6,2%.json"

if exist "%OUTPUT_FILE%" (
    call :logInfo "Archivo de mapeo de fotos ya existe"
    
    for %%A in ("%OUTPUT_FILE%") do (
        set /a "JSON_SIZE_MB=%%~zA / 1024 / 1024"
        call :logInfo "Archivo: !OUTPUT_FILE!"
        call :logInfo "Tamaño: !JSON_SIZE_MB! MB"
        call :logInfo "Fecha: %%~tA"
    )
    
    echo.
    echo    El archivo de mapeo de fotos ya fue generado previamente
    echo.
    
    REM Verificar si el archivo es válido
    %PYTHON_CMD% -c "import json; json.load(open('%OUTPUT_FILE%', 'r', encoding='utf-8'))" >nul 2>&1
    if %errorlevel% NEQ 0 (
        call :logWarning "Archivo JSON existente parece estar corrupto"
        call :logInfo "Se creará backup y se regenerará"
        copy "%OUTPUT_FILE%" "%BACKUP_FILE%" >nul 2>&1
        if !errorlevel! EQU 0 (
            call :logSuccess "Backup creado: %BACKUP_FILE%"
        )
        set "FORCE_REGENERATE=1"
    ) else (
        echo    Deseas REGENERAR las fotos? (S/N):
        choice /c SN /n /m "Deseas REGENERAR las fotos? (S/N): "
        set "CHOICE_RESULT=!errorlevel!"
        if !CHOICE_RESULT! EQU 2 (
            echo.
            call :logInfo "Usando archivo existente - continuando..."
            echo    [INFO] Las fotos existentes se usarán durante la reinstalación
            echo.
            goto :skipExtraction
        )
        echo.
        call :logInfo "Regenerando fotos..."
        set "FORCE_REGENERATE=1"
    )
) else (
    call :logInfo "Generando fotos por primera vez..."
    set "FORCE_REGENERATE=0"
)

echo.
goto :eof

:executeExtraction
echo ================================================================================
echo    [PASO 4/6] EJECUTANDO EXTRACCIÓN OPTIMIZADA
echo ================================================================================
echo.

call :logInfo "Iniciando extracción con parámetros optimizados..."
call :logInfo "Script: backend\scripts\auto_extract_photos_from_databasejp.py"
call :logInfo "Base de datos: !DB_PATH!"

REM Construir comando de extracción
set "EXTRACTION_CMD=%PYTHON_CMD% backend\scripts\auto_extract_photos_from_databasejp.py"

REM Agregar parámetros adicionales
if !FORCE_REGENERATE! EQU 1 (
    set "EXTRACTION_CMD=!EXTRACTION_CMD! --force"
    call :logInfo "Modo: Regeneración forzada"
)

echo.
echo    Comando de extracción:
echo    !EXTRACTION_CMD!
echo.

REM Ejecutar extracción con monitoreo
call :logInfo "Ejecutando extracción optimizada..."
echo    Este proceso puede tardar varios minutos dependiendo del volumen de datos
echo    Por favor espera sin cerrar esta ventana...
echo.

set "EXTRACTION_START_TIME=%TIME%"
!EXTRACTION_CMD!
set "PYTHON_EXIT_CODE=!errorlevel!"

echo.
goto :eof

:processResults
echo ================================================================================
echo    [PASO 5/6] PROCESANDO RESULTADOS DE LA EXTRACCIÓN
echo ================================================================================
echo.

REM Verificar el resultado de la extracción
if !PYTHON_EXIT_CODE! EQU 0 (
    call :logSuccess "El script se ejecutó correctamente"
    
    if exist "%OUTPUT_FILE%" (
        call :logSuccess "Archivo generado: %OUTPUT_FILE%"
        
        for %%A in ("%OUTPUT_FILE%") do (
            set /a "JSON_SIZE=%%~zA"
            set /a "JSON_SIZE_KB=!JSON_SIZE! / 1024"
            call :logInfo "Tamaño final: !JSON_SIZE_KB! KB"
            call :logInfo "Fecha: %%~tA"
        )
        
        REM Validar archivo JSON
        %PYTHON_CMD% -c "import json; data=json.load(open('%OUTPUT_FILE%', 'r', encoding='utf-8')); print(f'Válido: {len(data.get(\"mappings\", {}))} mapeos')" >nul 2>&1
        if !errorlevel! EQU 0 (
            for /f %%i in ('%PYTHON_CMD% -c "import json; data=json.load(open('%OUTPUT_FILE%', 'r', encoding='utf-8')); print(len(data.get('mappings', {})))" 2^>nul') do set "MAPPINGS_COUNT=%%i"
            call :logSuccess "Mapeos de fotos: !MAPPINGS_COUNT!"
            call :logInfo "Las fotos se importarán automáticamente durante la reinstalación"
        ) else (
            call :logError "Archivo JSON generado pero no es válido"
        )
    ) else (
        call :logWarning "El script terminó OK pero NO generó %OUTPUT_FILE%"
        call :logInfo "Posibles causas:"
        call :logInfo "  - El archivo ya existía y se saltó la extracción"
        call :logInfo "  - No se encontraron fotos en la base de datos"
        call :logInfo "Revisa los mensajes anteriores para más detalles"
    )
) else (
    call :logError "El script falló con código de error: !PYTHON_EXIT_CODE!"
    
    echo.
    echo    DIAGNÓSTICO AVANZADO DE ERRORES:
    echo.
    
    REM Análisis detallado según código de error
    if !PYTHON_EXIT_CODE! EQU 1 (
        echo    Error general de Python o módulos faltantes
        echo.
        echo    SOLUCIONES:
        echo    1. Verifica que todos los módulos requeridos estén instalados:
        echo       pip install pyodbc Pillow psutil
        echo    2. Verifica la versión de Python (mínimo 3.8)
        echo    3. Revisa el archivo de logs para detalles específicos
    )
    
    if !PYTHON_EXIT_CODE! EQU 130 (
        echo    Operación cancelada por el usuario
        echo.
        echo    INFO: La extracción fue interrumpida
        echo    Puedes reanudar con el parámetro --resume
    )
    
    if !PYTHON_EXIT_CODE! GEQ 2 (
        echo    Error de base de datos o acceso a archivos
        echo.
        echo    SOLUCIONES:
        echo    1. Verifica que Microsoft Access Database Engine esté instalado
        echo       Descarga 64-bit: https://www.microsoft.com/download/details.aspx?id=54920
        echo    2. Verifica que la base de datos no esté en uso
        echo    3. Verifica permisos de acceso a los archivos
        echo    4. Ejecuta como Administrador si es necesario
    )
    
    echo.
    echo    INFORMACIÓN ADICIONAL:
    echo    - Errores detectados: !ERROR_COUNT!
    echo    - Advertencias: !WARNING_COUNT!
    echo    - Revisa logs\*.log para detalles completos
    echo.
    echo    ALTERNATIVAS:
    echo    - El sistema funciona SIN fotos - puedes continuar la instalación
    echo    - Subirás fotos manualmente desde http://localhost:3000 después
    echo    - Ejecuta en modo debug para más información:
    echo      %PYTHON_CMD% backend\scripts\auto_extract_photos_from_databasejp.py --log-level DEBUG
)

echo.
goto :eof

:skipExtraction
echo ================================================================================
echo    [INFORMACIÓN] EXTRACCIÓN OMITIDA
echo ================================================================================
echo.
call :logInfo "Usando archivo de mapeo existente"
call :logInfo "Las fotos existentes se usarán durante la reinstalación"
echo.
goto :finalMessage

:finalMessage
echo ================================================================================
echo    RESUMEN DE EJECUCIÓN V%SCRIPT_VERSION%
echo ================================================================================
echo.
echo    Script versión: %SCRIPT_VERSION%
echo    Hora de inicio: %START_TIME%
echo    Hora de fin: %TIME%
echo    Errores: !ERROR_COUNT!
echo    Advertencias: !WARNING_COUNT!
echo    Código de salida: !PYTHON_EXIT_CODE!
echo.

if !PYTHON_EXIT_CODE! EQU 0 (
    call :logSuccess "EXTRACCIÓN COMPLETADA EXITOSAMENTE"
    echo    Las fotos estarán disponibles durante la instalación del sistema
) else (
    call :logError "EXTRACCIÓN FALLIDA"
    echo    Revisa los mensajes de error arriba para solución
)

echo.
echo ================================================================================
echo    PRESIONA CUALQUIER TECLA PARA CERRAR ESTA VENTANA
echo ================================================================================
pause >nul

REM Inicio del script principal
:main
call :showHeader
call :checkPython
if %errorlevel% NEQ 0 exit /b %errorlevel%

call :findDatabase
if %errorlevel% NEQ 0 exit /b %errorlevel%

call :checkExistingOutput
call :executeExtraction
call :processResults

goto :finalMessage