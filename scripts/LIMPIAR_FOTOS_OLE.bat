@echo off
chcp 65001 >nul
setlocal EnableDelayedExpansion

title UNS-ClaudeJP 5.4 - Limpieza OLE Fotos

echo.
echo ╔══════════════════════════════════════════════════════════════════════╗
echo ║           UNS-CLAUDEJP 5.4 - LIMPIEZA OLE FOTOS                    ║
echo ║                   Versión 2025-11-11                                 ║
echo ╚══════════════════════════════════════════════════════════════════════╝
echo.
echo [INFO] Este script limpia bytes OLE basura de las fotos
echo [INFO] Debe ejecutarse SIEMPRE después de importar fotos de Access
echo.

:: Verificar que backend esté corriendo
echo [PASO 1/4] Verificando backend...
docker ps | findstr "uns-claudejp-600-backend-1" >nul 2>&1
if !errorlevel! NEQ 0 (
    echo [ERROR] Backend no está corriendo
    echo [SOLUCION] Ejecuta: scripts\START.bat
    pause >nul
    exit /b 1
)
echo [OK] Backend está corriendo
echo.

:: Limpiar fotos de candidatos
echo [PASO 2/4] Limpiando fotos de candidatos...
echo [INFO] Esto puede tardar 2-3 minutos para 1,116 fotos
docker exec uns-claudejp-600-backend-1 bash -c "cd /app && python scripts/fix_photo_data.py"
if !errorlevel! NEQ 0 (
    echo [ERROR] Falló limpieza de candidatos
    pause >nul
    exit /b 1
)
echo [OK] Candidatos limpios
echo.

:: Limpiar fotos de empleados
echo [PASO 3/4] Limpiando fotos de empleados...
echo [INFO] Esto puede tardar 2-3 minutos para 815 fotos
docker exec uns-claudejp-600-backend-1 bash -c "cd /app && python scripts/fix_employee_photos.py"
if !errorlevel! NEQ 0 (
    echo [ERROR] Falló limpieza de empleados
    pause >nul
    exit /b 1
)
echo [OK] Empleados limpios
echo.

:: Verificar resultados
echo [PASO 4/4] Verificando resultados...
echo.
echo Candidatos con fotos:
docker exec -it uns-claudejp-600-db psql -U uns_admin -d uns_claudejp -c "SELECT COUNT(*) as con_fotos FROM candidates WHERE photo_data_url IS NOT NULL AND deleted_at IS NULL;" 2>nul
echo.
echo Empleados con fotos:
docker exec -it uns-claudejp-600-db psql -U uns_admin -d uns_claudejp -c "SELECT COUNT(*) as con_fotos FROM employees WHERE photo_data_url IS NOT NULL AND deleted_at IS NULL;" 2>nul
echo.

echo ╔══════════════════════════════════════════════════════════════════════╗
echo ║              LIMPIEZA COMPLETADA EXITOSAMENTE                      ║
echo ╚══════════════════════════════════════════════════════════════════════╝
echo.
echo [INFO] Verifica las fotos en:
echo   • Candidatos: http://localhost:3000/candidates
echo   • Empleados:  http://localhost:3000/employees
echo.
echo [TIP] Este script debe ejecutarse SIEMPRE después de:
echo   • Reinstalar el sistema
echo   • Importar datos de Access
echo   • Cambiar de PC
echo.

pause >nul
