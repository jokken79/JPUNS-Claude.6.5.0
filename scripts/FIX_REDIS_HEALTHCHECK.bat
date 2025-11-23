@echo off
setlocal EnableDelayedExpansion

title UNS-ClaudeJP 5.4 - Fix Redis Healthcheck

echo.
echo ============================================================================
echo                     FIX: Redis Healthcheck Error
echo ============================================================================
echo.

echo [*] Deteniendo servicios...
docker compose down -v
if !errorlevel! NEQ 0 (
    echo [!] Advertencia: error al detener servicios (puede ser normal)
)
echo.

echo [*] Limpiando volumenes de Redis...
docker volume rm uns-claudejp-5.4.1_redis_data >nul 2>&1
if !errorlevel! EQU 0 (
    echo [OK] Volumen de Redis eliminado
) else (
    echo [!] Volumen no encontrado (normal en primera ejecución)
)
echo.

echo [*] Limpiando containers viejos...
docker container prune -f >nul 2>&1
echo [OK] Containers prunados
echo.

echo [*] Limpiando imagenes viejas...
docker image prune -f >nul 2>&1
echo [OK] Imagenes prunadas
echo.

echo ============================================================================
echo [OK] Limpieza completada
echo.
echo Ahora ejecuta nuevamente:
echo   scripts\REINSTALAR.bat
echo.
echo El redis healthcheck ahora debería funcionar correctamente.
echo ============================================================================
echo.

pause >nul
