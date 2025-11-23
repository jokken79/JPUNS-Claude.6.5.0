@echo off
chcp 65001 >nul
setlocal EnableDelayedExpansion

echo.
echo ╔══════════════════════════════════════════════════════════════╗
echo ║      CARGANDO FOTOS DESDE JSON A POSTGRESQL                  ║
echo ╚══════════════════════════════════════════════════════════════╝
echo.

:: Verificar si Docker está corriendo
docker ps >nul 2>&1
if errorlevel 1 (
    echo [ERROR] Docker Desktop no está corriendo.
    echo          Por favor inicia Docker Desktop primero.
    pause >nul
    exit /b 1
)

:: Verificar si el archivo JSON existe
if not exist "..\config\access_photo_mappings.json" (
    echo [ERROR] No se encontró el archivo access_photo_mappings.json
    echo          Ruta esperada: ..\config\access_photo_mappings.json
    pause >nul
    exit /b 1
)

echo [1/3] Verificando archivo JSON...
for %%F in ("..\config\access_photo_mappings.json") do set size=%%~zF
set /a sizeMB=!size! / 1048576
echo       Tamaño: !sizeMB! MB
echo.

echo [2/3] Verificando servicios Docker...
docker ps --filter "name=uns-claudejp" --format "{{.Names}} - {{.Status}}" | findstr "Up"
if errorlevel 1 (
    echo [ERROR] Los servicios no están corriendo.
    echo          Ejecuta START.bat primero.
    pause >nul
    exit /b 1
)
echo.

echo [3/3] Cargando fotos a PostgreSQL...
echo       Esto puede tomar varios minutos (procesando 1100+ fotos)...
echo.

docker exec uns-claudejp-600-backend-1 python /app/scripts/load_photos_from_json.py

if errorlevel 1 (
    echo.
    echo [ERROR] Hubo un error al cargar las fotos.
    echo          Revisa los logs arriba para más detalles.
) else (
    echo.
    echo ╔══════════════════════════════════════════════════════════════╗
    echo ║      FOTOS CARGADAS EXITOSAMENTE                             ║
    echo ╚══════════════════════════════════════════════════════════════╝
)

echo.
echo Presiona cualquier tecla para salir...
pause >nul
