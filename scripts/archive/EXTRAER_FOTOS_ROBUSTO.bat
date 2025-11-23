@echo off
REM ============================================================================
REM  EXTRACCIÓN ROBUSTA DE FOTOS DESDE ACCESS DATABASE
REM  Versión 2025-11-10 - Con verificaciones exhaustivas
REM ============================================================================
chcp 65001 >nul 2>&1
setlocal EnableDelayedExpansion
title UNS-ClaudeJP 5.4 - Extracción de Fotos (ROBUSTO)

color 0F
cls

echo.
echo ============================================================================
echo    UNS-CLAUDEJP 5.4 - EXTRACCIÓN DE FOTOS (VERSIÓN ROBUSTA)
echo ============================================================================
echo    Este script extrae fotos de la base de datos Access
echo    y las guarda en config/access_photo_mappings.json
echo ============================================================================
echo.

REM Variables globales
set "ERROR_COUNT=0"
set "DB_PATH="
set "PYTHON_CMD="
set "FORCE_FLAG="

REM ============================================================================
REM  VERIFICACIÓN 1: Python Instalado
REM ============================================================================
echo [VERIFICACIÓN 1/6] Verificando Python...

python --version >nul 2>&1
if %errorlevel% EQU 0 (
    set "PYTHON_CMD=python"
    for /f "tokens=2" %%i in ('python --version 2^>^&1') do (
        echo    [OK] Python %%i encontrado ^(comando: python^)
    )
) else (
    py --version >nul 2>&1
    if %errorlevel% EQU 0 (
        set "PYTHON_CMD=py"
        for /f "tokens=2" %%i in ('py --version 2^>^&1') do (
            echo    [OK] Python %%i encontrado ^(comando: py^)
        )
    ) else (
        echo    [X] ERROR: Python NO encontrado
        echo.
        echo    SOLUCIÓN:
        echo    1. Instalar Python 3.11+ desde: https://www.python.org/downloads/
        echo    2. Durante instalación, marcar "Add Python to PATH"
        echo    3. Reiniciar terminal y ejecutar este script nuevamente
        echo.
        set /a ERROR_COUNT+=1
        goto :error_exit
    )
)
echo.

REM ============================================================================
REM  VERIFICACIÓN 2: pyodbc Instalado
REM ============================================================================
echo [VERIFICACIÓN 2/6] Verificando pyodbc...

%PYTHON_CMD% -c "import pyodbc" >nul 2>&1
if %errorlevel% EQU 0 (
    echo    [OK] pyodbc está instalado
) else (
    echo    [X] ERROR: pyodbc NO está instalado
    echo.
    echo    SOLUCIÓN:
    echo    1. Ejecutar: %PYTHON_CMD% -m pip install pyodbc
    echo    2. Esperar a que termine la instalación
    echo    3. Ejecutar este script nuevamente
    echo.
    echo    ¿Desea instalar pyodbc ahora? ^(S/N^):
    choice /c SN /n /m "    Opción: "
    if errorlevel 2 (
        echo.
        echo    Instalación cancelada
        set /a ERROR_COUNT+=1
        goto :error_exit
    )
    echo.
    echo    Instalando pyodbc...
    %PYTHON_CMD% -m pip install pyodbc
    if %errorlevel% NEQ 0 (
        echo    [X] ERROR: Falló la instalación de pyodbc
        set /a ERROR_COUNT+=1
        goto :error_exit
    )
    echo    [OK] pyodbc instalado correctamente
)
echo.

REM ============================================================================
REM  VERIFICACIÓN 3: Microsoft Access Database Engine
REM ============================================================================
echo [VERIFICACIÓN 3/6] Verificando Microsoft Access Database Engine...

REM Verificar registro de Windows para drivers ODBC
reg query "HKLM\SOFTWARE\ODBC\ODBCINST.INI\Microsoft Access Driver (*.mdb, *.accdb)" >nul 2>&1
if %errorlevel% EQU 0 (
    echo    [OK] Microsoft Access Database Engine está instalado
) else (
    echo    [!] ADVERTENCIA: Microsoft Access Database Engine NO detectado
    echo.
    echo    SOLUCIÓN:
    echo    1. Descargar desde: https://www.microsoft.com/download/details.aspx?id=54920
    echo    2. IMPORTANTE: Descargar versión que coincida con tu Python:
    echo.
    echo       Verificar versión de Python:
    %PYTHON_CMD% -c "import struct; print('      Python es', struct.calcsize('P') * 8, 'bits')"
    echo.
    echo       Si Python es 64-bit: Descargar AccessDatabaseEngine_X64.exe
    echo       Si Python es 32-bit: Descargar AccessDatabaseEngine.exe
    echo.
    echo    3. Instalar el archivo descargado
    echo    4. Ejecutar este script nuevamente
    echo.
    echo    ¿Desea continuar de todas formas? ^(S/N^):
    choice /c SN /n /m "    Opción: "
    if errorlevel 2 (
        echo.
        echo    Proceso cancelado
        set /a ERROR_COUNT+=1
        goto :error_exit
    )
)
echo.

REM ============================================================================
REM  VERIFICACIÓN 4: Buscar Base de Datos Access
REM ============================================================================
echo [VERIFICACIÓN 4/6] Buscando base de datos Access...

cd /d "%~dp0\.."

REM Buscar en ubicaciones comunes
set "DB_FOUND=0"

REM Ubicación 1: BASEDATEJP local
if exist "BASEDATEJP\*.accdb" (
    for %%f in (BASEDATEJP\*.accdb) do (
        set "DB_PATH=%%f"
        set "DB_FOUND=1"
        echo    [OK] Base de datos encontrada: %%~nxf
        for %%A in ("%%f") do (
            set /a "DB_SIZE_MB=%%~zA / 1024 / 1024"
            echo        Ubicación: %%f
            echo        Tamaño: !DB_SIZE_MB! MB
        )
        goto :db_found
    )
)

REM Ubicación 2: D:\BASEDATEJP
if exist "D:\BASEDATEJP\*.accdb" (
    for %%f in (D:\BASEDATEJP\*.accdb) do (
        set "DB_PATH=%%f"
        set "DB_FOUND=1"
        echo    [OK] Base de datos encontrada: %%~nxf
        for %%A in ("%%f") do (
            set /a "DB_SIZE_MB=%%~zA / 1024 / 1024"
            echo        Ubicación: %%f
            echo        Tamaño: !DB_SIZE_MB! MB
        )
        goto :db_found
    )
)

REM Ubicación 3: Carpeta padre
if exist "..\BASEDATEJP\*.accdb" (
    for %%f in (..\BASEDATEJP\*.accdb) do (
        set "DB_PATH=%%f"
        set "DB_FOUND=1"
        echo    [OK] Base de datos encontrada: %%~nxf
        for %%A in ("%%f") do (
            set /a "DB_SIZE_MB=%%~zA / 1024 / 1024"
            echo        Ubicación: %%f
            echo        Tamaño: !DB_SIZE_MB! MB
        )
        goto :db_found
    )
)

:db_found

if !DB_FOUND! EQU 0 (
    echo    [X] ERROR: Base de datos Access NO encontrada
    echo.
    echo ============================================================================
    echo  INSTRUCCIONES PARA DESCARGAR LA BASE DE DATOS
    echo ============================================================================
    echo.
    echo  1. Abrir Google Drive:
    echo     https://drive.google.com/drive/folders/17LucJZatnR6BFOt7DYsHWtFyltd4CoGb
    echo.
    echo  2. Buscar archivo: ユニバーサル企画㈱データベースv25.3.24.accdb
    echo     ^(o cualquier archivo .accdb con 'データベース' en el nombre^)
    echo.
    echo  3. Descargar el archivo a tu computadora
    echo.
    echo  4. Crear carpeta BASEDATEJP:
    echo     mkdir %CD%\BASEDATEJP
    echo.
    echo  5. Mover el archivo .accdb descargado a:
    echo     %CD%\BASEDATEJP\
    echo.
    echo  6. Ejecutar este script nuevamente
    echo.
    echo ============================================================================
    echo.
    set /a ERROR_COUNT+=1
    goto :error_exit
)
echo.

REM ============================================================================
REM  VERIFICACIÓN 5: Verificar Archivo No Está Bloqueado
REM ============================================================================
echo [VERIFICACIÓN 5/6] Verificando que archivo Access no está bloqueado...

REM Buscar archivo .laccdb (lock file)
for %%f in ("!DB_PATH!") do set "DB_DIR=%%~dpf"
for %%f in ("!DB_PATH!") do set "DB_NAME=%%~nf"

if exist "!DB_DIR!!DB_NAME!.laccdb" (
    echo    [!] ADVERTENCIA: Archivo de bloqueo detectado: !DB_NAME!.laccdb
    echo.
    echo    SOLUCIÓN:
    echo    1. Cerrar Microsoft Access si está abierto
    echo    2. Esperar 5 segundos y presionar cualquier tecla
    echo.
    pause

    REM Intentar eliminar archivo de bloqueo
    del /f "!DB_DIR!!DB_NAME!.laccdb" >nul 2>&1
    if exist "!DB_DIR!!DB_NAME!.laccdb" (
        echo    [X] ERROR: No se pudo eliminar archivo de bloqueo
        echo       Cierre Microsoft Access y vuelva a intentar
        set /a ERROR_COUNT+=1
        goto :error_exit
    ) else (
        echo    [OK] Archivo de bloqueo eliminado
    )
) else (
    echo    [OK] Archivo no está bloqueado
)
echo.

REM ============================================================================
REM  VERIFICACIÓN 6: Verificar Carpeta config Existe
REM ============================================================================
echo [VERIFICACIÓN 6/6] Verificando carpeta config...

if not exist "config\" (
    echo    [!] Carpeta config no existe, creando...
    mkdir "config"
    if %errorlevel% NEQ 0 (
        echo    [X] ERROR: No se pudo crear carpeta config
        set /a ERROR_COUNT+=1
        goto :error_exit
    )
)
echo    [OK] Carpeta config existe
echo.

REM ============================================================================
REM  TODAS LAS VERIFICACIONES PASARON
REM ============================================================================
echo ============================================================================
echo    [OK] TODAS LAS VERIFICACIONES PASARON
echo ============================================================================
echo.
echo    Base de datos: !DB_PATH!
echo    Archivo de salida: %CD%\config\access_photo_mappings.json
echo.

REM Verificar si JSON ya existe
if exist "config\access_photo_mappings.json" (
    echo [ADVERTENCIA] El archivo config\access_photo_mappings.json YA EXISTE
    echo.
    for %%A in ("config\access_photo_mappings.json") do (
        set /a "JSON_SIZE_MB=%%~zA / 1024 / 1024"
        echo    Archivo existente:
        echo      Tamaño: !JSON_SIZE_MB! MB
        echo      Fecha: %%~tA
    )
    echo.
    echo    ¿Desea REGENERAR las fotos? ^(S/N^):
    choice /c SN /n /m "    Opción: "
    if errorlevel 2 (
        echo.
        echo    [OK] Usando archivo existente - no es necesario extraer nuevamente
        echo.
        echo    El archivo config\access_photo_mappings.json será utilizado
        echo    automáticamente cuando reinicies los servicios con:
        echo      scripts\STOP.bat
        echo      scripts\START.bat
        echo.
        goto :success_exit
    )
    echo.
    echo    [OK] Regenerando fotos...
    set "FORCE_FLAG=--force"
)

echo.
echo ============================================================================
echo    EXTRAYENDO FOTOS DE LA BASE DE DATOS ACCESS
echo ============================================================================
echo.
echo    Este proceso puede tardar 15-30 minutos para ~1,148 fotos
echo    Por favor NO cierres esta ventana durante el proceso
echo.
echo    Ejecutando: %PYTHON_CMD% backend\scripts\auto_extract_photos_from_databasejp.py %FORCE_FLAG%
echo.

REM Ejecutar script de extracción
%PYTHON_CMD% backend\scripts\auto_extract_photos_from_databasejp.py %FORCE_FLAG%
set "PYTHON_EXIT=%errorlevel%"

echo.
echo ============================================================================

if !PYTHON_EXIT! EQU 0 (
    if exist "config\access_photo_mappings.json" (
        echo    [OK] EXTRACCIÓN EXITOSA
        echo ============================================================================
        echo.
        for %%A in ("config\access_photo_mappings.json") do (
            set /a "JSON_SIZE_MB=%%~zA / 1024 / 1024"
            echo    Archivo generado: config\access_photo_mappings.json
            echo    Tamaño: !JSON_SIZE_MB! MB ^(%%~zA bytes^)
            echo    Fecha: %%~tA
        )
        echo.
        echo ============================================================================
        echo    PRÓXIMOS PASOS
        echo ============================================================================
        echo.
        echo    1. Las fotos se importarán AUTOMÁTICAMENTE al reiniciar servicios
        echo.
        echo    2. Ejecuta en orden:
        echo       cd scripts
        echo       STOP.bat
        echo       START.bat
        echo.
        echo    3. Durante el inicio verás:
        echo       "Photo mappings file found - importing photos..."
        echo       "Photo import completed"
        echo.
        echo    4. Verifica en http://localhost:3000/candidates que las fotos aparecen
        echo.
        goto :success_exit
    ) else (
        echo    [X] ERROR: Script terminó OK pero NO generó archivo JSON
        echo ============================================================================
        echo.
        echo    DIAGNÓSTICO:
        echo      - Verifica que la tabla T_履歴書 existe en Access
        echo      - Verifica que la columna 写真 tiene datos
        echo      - Revisa los mensajes anteriores para más detalles
        echo.
        set /a ERROR_COUNT+=1
        goto :error_exit
    )
) else (
    echo    [X] ERROR: Extracción falló con código !PYTHON_EXIT!
    echo ============================================================================
    echo.
    echo    POSIBLES CAUSAS:
    echo      1. pyodbc no puede conectar al archivo Access
    echo      2. Microsoft Access Database Engine no instalado
    echo      3. Archivo Access corrupto o bloqueado
    echo      4. Tabla o columna de fotos no encontrada
    echo.
    echo    SOLUCIÓN:
    echo      1. Revisa los mensajes de error anteriores
    echo      2. Verifica las verificaciones 2 y 3
    echo      3. Intenta abrir el archivo Access manualmente
    echo.
    set /a ERROR_COUNT+=1
    goto :error_exit
)

REM ============================================================================
REM  SALIDA CON ÉXITO
REM ============================================================================
:success_exit
echo.
echo ============================================================================
echo    PRESIONA CUALQUIER TECLA PARA CERRAR ESTA VENTANA
echo ============================================================================
pause >nul

REM ============================================================================
REM  SALIDA CON ERROR
REM ============================================================================
:error_exit
echo.
echo ============================================================================
echo    [X] PROCESO FINALIZADO CON !ERROR_COUNT! ERROR(ES)
echo ============================================================================
echo.
echo    Revisa los mensajes anteriores para solucionar los problemas
echo.
echo ============================================================================
echo    PRESIONA CUALQUIER TECLA PARA CERRAR ESTA VENTANA
echo ============================================================================
pause >nul
