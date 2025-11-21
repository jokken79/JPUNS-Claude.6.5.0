@echo off
REM ============================================================================
REM EXTRAER CANDIDATOS CON FOTOS DE ACCESS
REM ============================================================================
REM
REM Este script extrae candidatos y sus fotos de la base de datos Access
REM y prepara los archivos para importar con REINSTALAR.bat
REM
REM IMPORTANTE: Ejecutar en Windows (NO en Docker)
REM
REM Requisitos:
REM   - Python 3.11+ con pyodbc instalado
REM   - Microsoft Access Driver instalado
REM   - Base de datos Access accesible
REM
REM Autor: Claude Code
REM Fecha: 2025-10-26
REM Version: UNS-ClaudeJP 5.0
REM ============================================================================

echo.
echo ============================================================================
echo   EXTRAER CANDIDATOS CON FOTOS DE ACCESS
echo ============================================================================
echo.
echo   Este proceso extraera:
echo     - Datos de candidatos
echo     - Fotos de candidatos
echo     - Mapeo de IDs con fotos
echo.
echo   Desde: D:\ユニバーサル企画㈱データベースv25.3.24.accdb
echo   Hacia: UNS-ClaudeJP-5.0/
echo.
echo ============================================================================
echo.

REM Verificar que Python esta instalado
python --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ ERROR: Python no esta instalado
    echo.
    echo Por favor instala Python 3.11+ desde:
    echo https://www.python.org/downloads/
    echo.
    pause
)

echo ✓ Python detectado
echo.

REM Verificar que pyodbc esta instalado
python -c "import pyodbc" >nul 2>&1
if %errorlevel% neq 0 (
    echo ⚠️  pyodbc no esta instalado
    echo.
    echo Instalando pyodbc...
    pip install pyodbc

    if %errorlevel% neq 0 (
        echo ❌ ERROR: No se pudo instalar pyodbc
        echo.
        echo Por favor ejecuta manualmente:
        echo   pip install pyodbc
        echo.
        pause
    )
    echo ✓ pyodbc instalado correctamente
)

echo ✓ pyodbc detectado
echo.

REM Verificar que existe la base de datos Access
if not exist "D:\ユニバーサル企画㈱データベースv25.3.24.accdb" (
    echo ❌ ERROR: Base de datos Access no encontrada!
    echo.
    echo   Ruta esperada: D:\ユニバーサル企画㈱データベースv25.3.24.accdb
    echo.
    echo   Por favor verifica que:
    echo     1. La base de datos existe
    echo     2. La ruta es correcta
    echo     3. Tienes permisos de lectura
    echo.
    pause
)

echo ✓ Base de datos Access encontrada
echo.

REM Navegar a la carpeta de scripts
cd /d "%~dp0backend\scripts"

echo ============================================================================
echo   INICIANDO EXTRACCION...
echo ============================================================================
echo.
echo   Esto puede tardar varios minutos dependiendo de:
echo     - Cantidad de candidatos
echo     - Tamaño de las fotos
echo     - Velocidad del disco
echo.
echo   Por favor espera...
echo.

REM Ejecutar script de extraccion
python extract_access_with_photos.py

if %errorlevel% neq 0 (
    echo.
    echo ============================================================================
    echo   ❌ ERROR EN LA EXTRACCION
    echo ============================================================================
    echo.
    echo   Revisa el archivo de log para mas detalles:
    echo   backend\scripts\extract_access_*.log
    echo.
    echo   Problemas comunes:
    echo     - Driver ODBC no instalado
    echo     - Base de datos Access bloqueada
    echo     - Permisos insuficientes
    echo.
    pause
)

echo.
echo ============================================================================
echo   ✅ EXTRACCION COMPLETADA
echo ============================================================================
echo.

REM Copiar archivos JSON a la raiz del proyecto
echo Copiando archivos JSON a la raiz del proyecto...
echo.

if exist "access_candidates_data.json" (
    copy /Y "access_candidates_data.json" "..\..\access_candidates_data.json" >nul
    echo   ✓ access_candidates_data.json copiado
) else (
    echo   ❌ access_candidates_data.json no encontrado!
)

if exist "access_photo_mappings.json" (
    copy /Y "access_photo_mappings.json" "..\..\access_photo_mappings.json" >nul
    echo   ✓ access_photo_mappings.json copiado
) else (
    echo   ❌ access_photo_mappings.json no encontrado!
)

REM Verificar que se crearon las fotos
set PHOTO_COUNT=0
for %%F in ("..\..\uploads\photos\candidates\*.jpg") do set /a PHOTO_COUNT+=1

echo.
echo   Fotos extraidas: %PHOTO_COUNT%
echo.

cd /d "%~dp0"

echo ============================================================================
echo   ARCHIVOS GENERADOS:
echo ============================================================================
echo.
echo   Datos de candidatos:
echo     - access_candidates_data.json
echo.
echo   Mapeo de fotos:
echo     - access_photo_mappings.json
echo.
echo   Fotos de candidatos:
echo     - uploads\photos\candidates\candidate_*.jpg
echo.
echo   Log de extraccion:
echo     - backend\scripts\extract_access_*.log
echo.
echo ============================================================================
echo   SIGUIENTE PASO
echo ============================================================================
echo.
echo   Ahora ejecuta:
echo.
echo     scripts\REINSTALAR.bat
echo.
echo   Esto importara automaticamente los candidatos con sus fotos.
echo.
echo ============================================================================
echo.

pause
