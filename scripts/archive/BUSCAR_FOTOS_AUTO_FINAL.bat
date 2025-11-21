@echo off
chcp 65001 >nul
setlocal EnableDelayedExpansion
title UNS-ClaudeJP 5.4 - Búsqueda Automática de Fotos

echo.
echo ╔════════════════════════════════════════════════════════════════════╗
echo ║        BÚSQUEDA AUTOMÁTICA DE BASE DE DATOS ACCESS (FOTOS)          ║
echo ╚══════════════════════════════════════════════════════════════════╝
echo.
echo ℹ  Buscando archivo *.accdb en 10 ubicaciones predefinidas...
echo ℹ  Este archivo contiene las fotos de empleados en formato OLE
echo.

set "DB_FOUND=0"
set "DB_PATH="

REM ===== Ubicación 1: Carpeta local BASEDATEJP =====
echo   ▶ [1/10] Buscando en: %CD%\BASEDATEJP\
if exist "BASEDATEJP\*.accdb" (
    for %%f in (BASEDATEJP\*.accdb) do (
        echo   ✓ ENCONTRADO: %%~nxf
        for %%A in ("%%f") do set "DB_SIZE=%%~zA"
        set /a "DB_SIZE_MB=!DB_SIZE! / 1024 / 1024"
        echo   ℹ Tamaño: !DB_SIZE_MB! MB
        set "DB_PATH=%%f"
        set "DB_FOUND=1"
        goto :found
    )
) else (
    echo   ✗ No encontrado
)

REM ===== Ubicación 2: Carpeta padre =====
echo   ▶ [2/10] Buscando en: ..\BASEDATEJP\
if exist "..\BASEDATEJP\*.accdb" (
    for %%f in (..\BASEDATEJP\*.accdb) do (
        echo   ✓ ENCONTRADO: %%~nxf
        for %%A in ("%%f") do set "DB_SIZE=%%~zA"
        set /a "DB_SIZE_MB=!DB_SIZE! / 1024 / 1024"
        echo   ℹ Tamaño: !DB_SIZE_MB! MB
        set "DB_PATH=%%f"
        set "DB_FOUND=1"
        goto :found
    )
)

REM ===== Ubicación 3: Disco D: =====
echo   ▶ [3/10] Buscando en: D:\BASEDATEJP\
if exist "D:\BASEDATEJP\*.accdb" (
    for %%f in (D:\BASEDATEJP\*.accdb) do (
        echo   ✓ ENCONTRADO: %%~nxf
        for %%A in ("%%f") do set "DB_SIZE=%%~zA"
        set /a "DB_SIZE_MB=!DB_SIZE! / 1024 / 1024"
        echo   ℹ Tamaño: !DB_SIZE_MB! MB
        set "DB_PATH=%%f"
        set "DB_FOUND=1"
        goto :found
    )
)

if !DB_FOUND! EQU 0 (
    echo.
    echo ╔════════════════════════════════════════════════════════════════════╗
    echo ║  ⚠ BASE DE DATOS ACCESS NO ENCONTRADA                               ║
    echo ╚════════════════════════════════════════════════════════════════╝
    echo.
    echo ℹ  El sistema funcionará SIN fotos de candidatos/empleados
    echo ℹ  Las fotos son OPCIONALES - todo lo demás funciona perfectamente
    echo.
    echo ══════════════════════════════════════════════════════════════
    echo 📋 CÓMO IMPORTAR FOTOS (OPCIONAL):
    echo ══════════════════════════════════════════════════════════════
    echo.
    echo 1️⃣  Descarga el archivo .accdb desde Google Drive:
    echo    🔗 https://drive.google.com/drive/folders/17LucJZatnR6BFOt7DYsHWtFyltd4CoGb
    echo.
    echo 2️⃣  Coloca el archivo en ALGUNA de estas ubicaciones:
    echo    📁 %CD%\BASEDATEJP\
    echo    📁 D:\BASEDATEJP\
    echo    📁 %USERPROFILE%\BASEDATEJP\
    echo    📁 %USERPROFILE%\Documents\BASEDATEJP\
    echo    📁 %USERPROFILE%\Desktop\BASEDATEJP\
    echo.
    echo 3️⃣  Ejecuta este script nuevamente:
    echo    📝 scripts\BUSCAR_FOTOS_AUTO.bat
    echo    O reinicia la instalación: scripts\REINSTALAR.bat
    echo.
    echo ══════════════════════════════════════════════════════════════
    echo.
    echo ✅ ALTERNATIVA: Puedes subir fotos manualmente desde el frontend
    echo    → http://localhost:3000 (una vez instalado el sistema)
    echo.
    exit /b 0
)

:found
echo.
echo ╔══════════════════════════════════════════════════════════════════╗
echo ║  ✓ BASE DE DATOS ACCESS ENCONTRADA                                  ║
echo ╚══════════════════════════════════════════════════════════════════╝
echo.
echo   📁 Ubicación: !DB_PATH!
echo.
for %%A in ("!DB_PATH!") do (
    set "DB_SIZE=%%~zA"
    set /a "DB_SIZE_MB=!DB_SIZE! / 1024 / 1024"
    echo   📊 Tamaño: !DB_SIZE_MB! MB (%%~zA bytes)
    echo   📅 Modificado: %%~tA
)

echo.
REM Verificar si Python esta instalado
echo ╔════════════════════════════════════════════════════════════════╗
echo ║  VERIFICANDO PYTHON PARA EXTRACCIÓN                                 ║
echo ╚══════════════════════════════════════════════════════════════════╝
echo.
echo   ▶ Buscando Python en el sistema...
python --version >nul 2>&1
if %errorlevel% NEQ 0 (
    py --version >nul 2>&1
    if %errorlevel% NEQ 0 (
        echo   ✗ ERROR: Python NO encontrado
        echo.
        echo   ⚠ Las fotos NO se extraerán automáticamente
        echo.
        echo   ℹ SOLUCIÓN:
        echo     1. Instala Python 3.11+ desde https://www.python.org/downloads/
        echo     2. Marca "Add Python to PATH" durante instalación
        echo     3. Ejecuta REINSTALAR.bat nuevamente
        echo.
        pause
    )
    set "PYTHON_CMD=py"
    for /f "tokens=2" %%i in ('py --version 2^>^&1') do echo   ✓ Python encontrado: %%i (comando: py)
) else (
    set "PYTHON_CMD=python"
    for /f "tokens=2" %%i in ('python --version 2^>^&1') do echo   ✓ Python encontrado: %%i (comando: python)
)
echo.

REM Copiar .accdb a BASEDATEJP local si no esta ahi
echo ╔════════════════════════════════════════════════════════════════╗
echo ║  PREPARANDO ACCESO A BASE DE DATOS                                  ║
echo ╚════════════════════════════════════════════════════════════════════╝
echo.
cd /d "%~dp0\.."
if not exist "BASEDATEJP\ユニバーサル企画㈱データベースv25.3.24_be.accdb" (
    echo   ▶ Copiando base de datos a ubicación local...
    echo   ℹ Destino: %CD%\BASEDATEJP\
    if not exist "BASEDATEJP\" (
        mkdir "BASEDATEJP\"
        echo   ✓ Carpeta BASEDATEJP creada
    )
    copy /Y "!DB_PATH!" "BASEDATEJP\ユニバーサル企画㈱データベースv25.3.24_be.accdb" >nul
    if !errorlevel! EQU 0 (
        echo   ✓ Base de datos copiada correctamente
        for %%A in ("BASEDATEJP\ユニバーサル企画㈱データベースv25.3.24_be.accdb") do (
            set /a "COPY_SIZE_MB=%%~zA / 1024 / 1024"
            echo   ℹ Tamaño copiado: !COPY_SIZE_MB! MB
        )
    ) else (
        echo   ⚠ No se pudo copiar la base de datos
        echo   ℹ Se usará la ubicación original: !DB_PATH!
    )
) else (
    echo   ✓ Base de datos ya existe en ubicación local
)
echo.

REM Verificar si ya existe access_photo_mappings.json
echo ╔════════════════════════════════════════════════════════════════╗
echo ║  ℹ ARCHIVO DE FOTOS YA EXISTE                                       ║
echo ╚══════════════════════════════════════════════════════════════════════╝
echo.
if exist "access_photo_mappings.json" (
    echo   📁 Archivo: access_photo_mappings.json
    for %%A in ("access_photo_mappings.json") do (
        set /a "JSON_SIZE_MB=%%~zA / 1024 / 1024"
        echo   📊 Tamaño: !JSON_SIZE_MB! MB (%%~zA bytes)
        echo   📅 Fecha: %%~tA
    )
    echo.
    echo   ℹ El archivo de mapeo de fotos ya fue generado previamente
    echo.
    set /p REGENERAR="   ¿Deseas REGENERAR las fotos? (S/N): "
    if /i "!REGENERAR!"=="N" (
        echo.
        echo   ✓ Usando archivo existente
        exit /b 0
    )
    if /i "!REGENERAR!"=="NO" (
        echo.
        echo   ✓ Usando archivo existente
        exit /b 0
    )
    echo.
    echo   ▶ Regenerando fotos...
    echo.
) else (
    echo   ▶ Generando fotos por primera vez...
    echo.
)

REM Extraer fotos usando script Python
echo ╔════════════════════════════════════════════════════════════════╗
echo ║  🔄 EXTRAYENDO FOTOS DE BASE DE DATOS ACCESS                         ║
echo ╚════════════════════════════════════════════════════════════════════════╝
echo.
echo   ℹ Este proceso puede tardar 15-30 minutos para ~1,148 fotos
echo   ℹ El script usa 3 métodos de extracción (pywin32 → pyodbc → ZIP)
echo   ℹ Por favor espera sin cerrar esta ventana...
echo.
echo   ▶ Ejecutando: %PYTHON_CMD% backend\scripts\auto_extract_photos_from_databasejp.py
echo.

%PYTHON_CMD% backend\scripts\auto_extract_photos_from_databasejp.py
set "PYTHON_EXIT_CODE=%errorlevel%"

echo.
echo ╔══════════════════════════════════════════════════════════════════╗
echo ║  RESULTADO DE LA EXTRACCIÓN                                         ║
echo ╚══════════════════════════════════════════════════════════════════════════╝
echo.

REM Verificar el resultado de la extracción
if !PYTHON_EXIT_CODE! EQU 0 (
    echo   ✓ ÉXITO: El script se ejecutó correctamente
    echo.
    if exist "access_photo_mappings.json" (
        echo   ✅ Archivo generado: access_photo_mappings.json
        for %%A in ("access_photo_mappings.json") do (
            set "JSON_SIZE=%%~zA"
            set /a "JSON_SIZE_MB=!JSON_SIZE! / 1024 / 1024"
            echo   📊 Tamaño: !JSON_SIZE_MB! MB (%%~zA bytes)
            echo   📅 Fecha: %%~tA
        )
        echo.
        echo   ✅ Las fotos se importarán automáticamente durante la reinstalación
        echo   ℹ  El archivo contiene fotos en formato base64 listas para importar
    ) else (
        echo   ⚠ ADVERTENCIA: El script terminó OK pero NO generó access_photo_mappings.json
        echo   ℹ Posibles causas:
        echo     - El archivo ya existía y se saltó la extracción
        echo     - No se encontraron fotos en la base de datos
        echo   ℹ Revisa los mensajes anteriores para más detalles
    )
) else (
    echo   ✗ ERROR: El script falló con código de error: !PYTHON_EXIT_CODE!
    echo.
    echo   🔍 DIAGNÓSTICO DE PROBLEMAS:
    echo.
    echo   1️⃣  pywin32 NO instalado o no funciona
    echo      💡 Solución: pip install pywin32
    echo      💡 Después ejecuta: python backend\scripts\auto_extract_photos_from_databasejp.py
    echo.
    echo   2️⃣  Microsoft Access Database Engine NO instalado
    echo      🌐 Descarga 64-bit: https://www.microsoft.com/download/details.aspx?id=54920
    echo      ⚠  IMPORTANTE: Elige la versión que coincida con tu Python (32/64-bit)
    echo      ℹ  Para verificar: python -c "import platform; print(platform.architecture()[0])"
    echo.
    echo   3️⃣  Base de datos Access está corrupta o bloqueada
    echo      💡 Cierra Microsoft Access si está abierto
    echo      💡 Verifica que el archivo .accdb no esté en uso
    echo.
    echo   4️⃣  Permisos insuficientes
    echo      💡 Ejecuta este script como Administrador
    echo      💡 Click derecho en el .bat → "Ejecutar como administrador"
    echo.
    echo   ℹ  ALTERNATIVAS:
    echo      • El sistema funciona SIN fotos - puedes continuar la instalación
    echo      • Subirás fotos manualmente desde http://localhost:3000 después
    echo      • Ejecuta: python backend\scripts\auto_extract_photos_from_databasejp.py
    echo        directamente para ver errores detallados
)

echo.
echo ══════════════════════════════════════════════════════════════════
echo  PRESIONA CUALQUIER TECLA PARA CERRAR ESTA VENTANA
echo ══════════════════════════════════════════════════════════════════════
pause >nul