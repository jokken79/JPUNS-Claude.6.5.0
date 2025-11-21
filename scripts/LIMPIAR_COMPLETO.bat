@echo off
setlocal EnableDelayedExpansion

title UNS-ClaudeJP 5.4 - Limpieza Completa

echo.
echo ============================================================================
echo                     LIMPIEZA COMPLETA DEL SISTEMA
echo                    Elimina TODOS los datos de Docker
echo ============================================================================
echo.
echo ADVERTENCIA: Esta accion eliminara:
echo   [*] Todos los contenedores
echo   [*] Todos los volumenes (INCLUYENDO BASE DE DATOS)
echo   [*] Imagenes no utilizadas
echo   [*] Networks no utilizados
echo.

set /p "CONFIRMAR=¿Deseas continuar? (S/N): "
if /i not "%CONFIRMAR%"=="S" if /i not "%CONFIRMAR%"=="SI" (
    echo.
    echo [X] Cancelado
    echo.
    pause >nul
    goto :eof
)

echo.
echo [*] Deteniendo servicios...
docker compose down -v 2>nul
echo [OK] Servicios detenidos
echo.

echo [*] Eliminando volumenes...
docker volume prune -f >nul 2>&1
echo [OK] Volumenes eliminados
echo.

echo [*] Eliminando containers...
docker container prune -af >nul 2>&1
echo [OK] Containers eliminados
echo.

echo [*] Eliminando imagenes no usadas...
docker image prune -af >nul 2>&1
echo [OK] Imagenes eliminadas
echo.

echo [*] Limpiando builder cache...
docker builder prune -af >nul 2>&1
echo [OK] Builder cache limpiado
echo.

echo ============================================================================
echo [OK] LIMPIEZA COMPLETA TERMINADA
echo.
echo Ahora puedes ejecutar:
echo   scripts\REINSTALAR.bat
echo.
echo Esto creara una instalacion completamente nueva.
echo ============================================================================
echo.

pause >nul
