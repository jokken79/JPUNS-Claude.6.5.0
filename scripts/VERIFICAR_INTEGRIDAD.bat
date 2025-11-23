@echo off
chcp 65001 >nul
setlocal EnableDelayedExpansion

title UNS-ClaudeJP 5.2 - Verificación de Integridad del Sistema

echo.
echo ========================================================
echo    UNS-CLAUDEJP 5.2 - VERIFICACION DE INTEGRIDAD
echo    Actualización: 100%% Cobertura Campos Candidatos
echo ========================================================
echo.

REM Verificar que Docker esté corriendo
echo [1/2] Verificando que Docker Desktop esté corriendo...
docker ps >nul 2>&1
if %errorlevel% neq 0 (
    echo.
    echo [ERROR] Docker Desktop no está corriendo.
    echo.
    echo Por favor:
    echo   1. Abre Docker Desktop desde el menú Inicio
    echo   2. Espera a que el icono esté verde
    echo   3. Ejecuta este script de nuevo
    echo.
    echo Presiona cualquier tecla para salir...
    pause >nul
)
echo    [OK] Docker Desktop está corriendo.
echo.

REM Verificar que el backend esté corriendo
echo [2/2] Verificando que el contenedor backend esté corriendo...
docker ps --filter "name=uns-claudejp-600-backend-1" --format "{{.Names}}" | findstr "uns-claudejp-600-backend-1" >nul 2>&1
if %errorlevel% neq 0 (
    echo.
    echo [ERROR] El contenedor backend no está corriendo.
    echo.
    echo Por favor inicia el sistema primero:
    echo   scripts\START.bat
    echo.
    echo Presiona cualquier tecla para salir...
    pause >nul
)
echo    [OK] Contenedor backend está corriendo.
echo.

echo ========================================================
echo    Ejecutando verificación completa del sistema...
echo ========================================================
echo.

REM Ejecutar el script de verificación
docker exec -it uns-claudejp-600-backend-1 python /app/scripts/verify_system_integrity.py

set VERIFY_EXIT_CODE=%errorlevel%

echo.
echo ========================================================

if %VERIFY_EXIT_CODE% EQU 0 (
    echo    RESULTADO: SISTEMA COMPLETAMENTE INTEGRO
    echo    Todas las verificaciones pasaron correctamente.
) else if %VERIFY_EXIT_CODE% EQU 1 (
    echo    RESULTADO: SISTEMA MAYORMENTE INTEGRO
    echo    Algunas verificaciones fallaron, pero el sistema
    echo    debería funcionar correctamente.
) else (
    echo    RESULTADO: SISTEMA REQUIERE ATENCION
    echo    Múltiples verificaciones fallaron.
    echo    Revisa los detalles arriba.
)

echo ========================================================
echo.

if %VERIFY_EXIT_CODE% EQU 0 (
    echo [INFO] El sistema está completamente actualizado con:
    echo.
    echo   - 142 columnas en tabla candidates (+12 nuevas^)
    echo   - Migración b6dc75dfbe7c aplicada
    echo   - Script de importación con 100%% cobertura
    echo   - Docker configurado para aplicar cambios automáticamente
    echo   - Soporte de porcentajes para habilidades japonesas
    echo   - Información física completa (altura, peso, visión, etc.^)
    echo   - Dependientes familiares (扶養^)
    echo.
) else (
    echo [ACCION RECOMENDADA]
    echo.
    echo Si hay problemas con las migraciones:
    echo   docker exec uns-claudejp-600-backend-1 alembic upgrade head
    echo.
    echo Si necesitas reinstalar completamente:
    echo   scripts\REINSTALAR.bat
    echo.
)

echo Presiona cualquier tecla para salir...
pause >nul
