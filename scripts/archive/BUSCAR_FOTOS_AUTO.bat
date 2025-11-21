@echo off
REM Configuración optimizada para Windows 11 con mejor manejo de Unicode
chcp 65001 >nul 2>&1
setlocal EnableDelayedExpansion
title UNS-ClaudeJP 5.4 - Extraccion de Fotos (Windows 11)

REM Configurar colores para mejor visualidad
color 0F


REM Inicio del script
call :showHeader

echo    [INFO] Buscando base de datos Access en ubicaciones predefinidas...
echo    [INFO] Archivo contiene fotos de empleados en formato OLE
echo.

set "DB_FOUND=0"
set "DB_PATH="

REM ===== Ubicación 1: Carpeta local BASEDATEJP =====
echo    [1/10] Buscando en: %CD%\BASEDATEJP\
if exist "BASEDATEJP\*.accdb" (
    for %%f in (BASEDATEJP\*.accdb) do (
        echo    [OK] Base de datos encontrada: %%~nxf
        for %%A in ("%%f") do set "DB_SIZE=%%~zA"
        set /a "DB_SIZE_MB=!DB_SIZE! / 1024 / 1024"
        echo    [INFO] Tamaño: !DB_SIZE_MB! MB
        set "DB_PATH=%%f"
        set "DB_FOUND=1"
        goto :found
    )
) else (
    echo    [X] No encontrado
)

REM ===== Ubicación 2: Carpeta padre =====
echo    [2/10] Buscando en: ..\BASEDATEJP\
if exist "..\BASEDATEJP\*.accdb" (
    for %%f in (..\BASEDATEJP\*.accdb) do (
        echo    [OK] Base de datos encontrada: %%~nxf
        for %%A in ("%%f") do set "DB_SIZE=%%~zA"
        set /a "DB_SIZE_MB=!DB_SIZE! / 1024 / 1024"
        echo    [INFO] Tamaño: !DB_SIZE_MB! MB
        set "DB_PATH=%%f"
        set "DB_FOUND=1"
        goto :found
    )
)

REM ===== Ubicación 3: Disco D: =====
echo    [3/10] Buscando en: D:\BASEDATEJP\
if exist "D:\BASEDATEJP\*.accdb" (
    for %%f in (D:\BASEDATEJP\*.accdb) do (
        echo    [OK] Base de datos encontrada: %%~nxf
        for %%A in ("%%f") do set "DB_SIZE=%%~zA"
        set /a "DB_SIZE_MB=!DB_SIZE! / 1024 / 1024"
        echo    [INFO] Tamaño: !DB_SIZE_MB! MB
        set "DB_PATH=%%f"
        set "DB_FOUND=1"
        goto :found
    )
)

if !DB_FOUND! EQU 0 (
    call :showHeader
    echo    [ADVERTENCIA] BASE DE DATOS ACCESS NO ENCONTRADA
    echo.
    echo    El sistema funcionara SIN fotos de candidatos/empleados
    echo    Las fotos son OPCIONALES - todo lo demas funciona perfectamente
    echo.
    echo    ================================================================================
    echo    COMO IMPORTAR FOTOS (OPCIONAL):
    echo    ================================================================================
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
    echo       scripts\BUSCAR_FOTOS_AUTO.bat
    echo.
    echo    ALTERNATIVA: Puedes subir fotos manualmente desde:
    echo       http://localhost:3000 (una vez instalado el sistema)
    echo.
    pause
    exit /b 0
)

:found
echo.
echo ================================================================================
echo    [OK] BASE DE DATOS ACCESS ENCONTRADA Y VERIFICADA
echo ================================================================================
echo.
echo    Ubicacion: !DB_PATH!
echo.
for %%A in ("!DB_PATH!") do (
    set "DB_SIZE=%%~zA"
    set /a "DB_SIZE_MB=!DB_SIZE! / 1024 / 1024"
    echo    Tamaño: !DB_SIZE_MB! MB (%%~zA bytes)
    echo    Modificado: %%~tA
)

echo.
echo ================================================================================
echo    [PASO 1/3] VERIFICANDO PYTHON PARA EXTRACCION
echo ================================================================================
echo.
echo    Buscando Python en el sistema...
python --version >nul 2>&1
if %errorlevel% NEQ 0 (
    py --version >nul 2>&1
    if %errorlevel% NEQ 0 (
        echo    [ERROR] Python NO encontrado
        echo.
        echo    Las fotos NO se extraeran automaticamente
        echo.
        echo    SOLUCION:
        echo    1. Instala Python 3.11+ desde https://www.python.org/downloads/
        echo    2. Marca "Add Python to PATH" durante instalacion
        echo    3. Ejecuta REINSTALAR.bat nuevamente
        echo.
        pause
        exit /b 0
    )
    set "PYTHON_CMD=py"
    for /f "tokens=2" %%i in ('py --version 2^>^&1') do echo    [OK] Python encontrado: %%i (comando: py)
) else (
    set "PYTHON_CMD=python"
    for /f "tokens=2" %%i in ('python --version 2^>^&1') do echo    [OK] Python encontrado: %%i (comando: python)
)
echo.

echo ================================================================================
echo    [PASO 2/3] PREPARANDO ACCESO A BASE DE DATOS
echo ================================================================================
echo.
cd /d "%~dp0\.."
if not exist "BASEDATEJP\ユニバーサル企画㈱データベースv25.3.24_be.accdb" (
    echo    Copiando base de datos a ubicacion local...
    echo    Destino: %CD%\BASEDATEJP\
    if not exist "BASEDATEJP\" (
        mkdir "BASEDATEJP\"
        echo    [OK] Carpeta BASEDATEJP creada
    )
    copy /Y "!DB_PATH!" "BASEDATEJP\ユニバーサル企画㈱データベースv25.3.24_be.accdb" >nul
    if !errorlevel! EQU 0 (
        echo    [OK] Base de datos copiada correctamente
        for %%A in ("BASEDATEJP\ユニバーサル企画㈱データベースv25.3.24_be.accdb") do (
            set /a "COPY_SIZE_MB=%%~zA / 1024 / 1024"
            echo    [INFO] Tamaño copiado: !COPY_SIZE_MB! MB
        )
    ) else (
        echo    [ADVERTENCIA] No se pudo copiar la base de datos
        echo    [INFO] Se usara la ubicacion original: !DB_PATH!
    )
) else (
    echo    [OK] Base de datos ya existe en ubicacion local
)
echo.

echo ================================================================================
echo    [PASO 3/3] VERIFICANDO ARCHIVO DE FOTOS EXISTENTE
echo ================================================================================
echo.
if exist "access_photo_mappings.json" (
    echo    [INFO] Archivo de mapeo de fotos ya existe
    echo.
    for %%A in ("access_photo_mappings.json") do (
        set /a "JSON_SIZE_MB=%%~zA / 1024 / 1024"
        echo    Archivo: access_photo_mappings.json
        echo    Tamaño: !JSON_SIZE_MB! MB (%%~zA bytes)
        echo    Fecha: %%~tA
    )
    echo.
    echo    El archivo de mapeo de fotos ya fue generado previamente
    echo.
    echo    Deseas REGENERAR las fotos? (S/N):
    choice /c SN /n /m "Deseas REGENERAR las fotos? (S/N): "
    set "CHOICE_RESULT=%errorlevel%"
    if !CHOICE_RESULT! EQU 2 (
        echo.
        echo    [OK] Usando archivo existente - continuando...
        echo.
        echo    [INFO] Las fotos existentes se usaran durante la reinstalacion
        echo.
        echo ================================================================================
        echo    PRESIONA CUALQUIER TECLA PARA CERRAR ESTA VENTANA
        echo ================================================================================
        pause >nul
        exit /b 0
    )
    echo.
    echo    [OK] Regenerando fotos...
    echo.
) else (
    echo    [INFO] Generando fotos por primera vez...
    echo.
)

echo ================================================================================
echo    [PROCESO] EXTRAYENDO FOTOS DE BASE DE DATOS ACCESS
echo ================================================================================
echo.
echo    Este proceso puede tardar 15-30 minutos para ~1,148 fotos
echo    El script usa metodo pyodbc (mas confiable que pywin32)
echo    Por favor espera sin cerrar esta ventana...
echo.

REM Determinar si se debe ejecutar con --force
set "USE_FORCE=0"
if exist "access_photo_mappings.json" (
    if !CHOICE_RESULT! EQU 1 (
        set "USE_FORCE=1"
    )
)

REM Ejecutar el script Python con o sin --force
if !USE_FORCE! EQU 1 (
    echo    Ejecutando: %PYTHON_CMD% backend\scripts\auto_extract_photos_from_databasejp.py --force
    %PYTHON_CMD% backend\scripts\auto_extract_photos_from_databasejp.py --force
) else (
    echo    Ejecutando: %PYTHON_CMD% backend\scripts\auto_extract_photos_from_databasejp.py
    %PYTHON_CMD% backend\scripts\auto_extract_photos_from_databasejp.py
)
set "PYTHON_EXIT_CODE=%errorlevel%"

echo.
echo ================================================================================
echo    [RESULTADO] ESTADO DE LA EXTRACCION
echo ================================================================================
echo.

REM Verificar el resultado de la extracción
if !PYTHON_EXIT_CODE! EQU 0 (
    echo    [OK] El script se ejecutó correctamente
    echo.
    if exist "access_photo_mappings.json" (
        echo    [OK] Archivo generado: access_photo_mappings.json
        for %%A in ("access_photo_mappings.json") do (
            set "JSON_SIZE=%%~zA"
            set /a "JSON_SIZE_MB=!JSON_SIZE! / 1024 / 1024"
            echo    Tamaño: !JSON_SIZE_MB! MB (%%~zA bytes)
            echo    Fecha: %%~tA
        )
        echo.
        echo    [OK] Las fotos se importaran automaticamente durante la reinstalacion
        echo    [INFO] El archivo contiene fotos en formato base64 listas para importar
    ) else (
        echo    [ADVERTENCIA] El script termino OK pero NO genero access_photo_mappings.json
        echo    Posibles causas:
        echo      - El archivo ya existia y se salto la extraccion
        echo      - No se encontraron fotos en la base de datos
        echo    Revisa los mensajes anteriores para mas detalles
    )
) else (
    echo    [ERROR] El script falló con código de error: !PYTHON_EXIT_CODE!
    echo.
    echo    DIAGNOSTICO DE PROBLEMAS:
    echo.
    echo    1. pywin32 NO instalado o no funciona
    echo       Solucion: pip install pywin32
    echo.
    echo    2. Microsoft Access Database Engine NO instalado
    echo       Descarga 64-bit: https://www.microsoft.com/download/details.aspx?id=54920
    echo       IMPORTANTE: Elige la versión que coincida con tu Python (32/64-bit)
    echo.
    echo    3. Base de datos Access esta corrupta o bloqueada
    echo       Cierra Microsoft Access si esta abierto
    echo       Verifica que el archivo .accdb no este en uso
    echo.
    echo    4. Permisos insuficientes
    echo       Ejecuta este script como Administrador
    echo.
    echo    ALTERNATIVAS:
    echo    - El sistema funciona SIN fotos - puedes continuar la instalacion
    echo    - Subiras fotos manualmente desde http://localhost:3000 despues
    echo    - Ejecuta: python backend\scripts\auto_extract_photos_from_databasejp.py
    echo      directamente para ver errores detallados
)

echo.
echo ================================================================================
echo    PRESIONA CUALQUIER TECLA PARA CERRAR ESTA VENTANA
echo ================================================================================
pause >nul

:showHeader
cls
echo ================================================================================
echo    UNS-CLAUDEJP 5.4 - EXTRACCION AUTOMATICA DE FOTOS DE EMPLEADOS
echo ================================================================================
echo    Sistema optimizado para Windows 11 con soporte Unicode mejorado
echo ================================================================================
echo.
goto :eof