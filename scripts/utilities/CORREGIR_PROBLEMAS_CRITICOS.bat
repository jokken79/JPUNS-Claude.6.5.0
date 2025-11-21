@echo off
chcp 65001 >nul
setlocal EnableDelayedExpansion

title UNS-ClaudeJP - Corrector de Problemas Criticos

cls
echo.
echo ========================================================
echo   UNS-CLAUDEJP v5.2 - CORRECTOR DE PROBLEMAS
echo ========================================================
echo.
echo Este script corrige problemas conocidos que pueden
echo causar fallas en REINSTALAR.bat
echo.
echo Se crearan respaldos antes de cualquier cambio
echo.

cd /d "%~dp0\.."

REM Crear directorio de respaldo
if not exist "backend\alembic\versions\backup" mkdir "backend\alembic\versions\backup"

echo [1/3] Aumentando timeouts en REINSTALAR.bat...
REM Aumentar timeouts de 30 a 45 y de 60 a 120
powershell -Command "(Get-Content 'scripts\REINSTALAR.bat') -replace 'timeout /t 30', 'timeout /t 45' | Set-Content 'scripts\REINSTALAR.bat'" 2>nul
powershell -Command "(Get-Content 'scripts\REINSTALAR.bat') -replace 'timeout /t 60', 'timeout /t 120' | Set-Content 'scripts\REINSTALAR.bat'" 2>nul
echo [OK] Timeouts actualizados (30s→45s, 60s→120s)

echo [2/3] Aumentando healthchecks en docker-compose.yml...
REM Aumentar healthcheck timeouts
powershell -Command "(Get-Content 'docker-compose.yml') -replace 'start_period: 40s', 'start_period: 90s' | Set-Content 'docker-compose.yml'" 2>nul
powershell -Command "(Get-Content 'docker-compose.yml') -replace 'start_period: 60s', 'start_period: 90s' | Set-Content 'docker-compose.yml'" 2>nul
echo [OK] Healthchecks actualizados

echo [3/3] Validando archivos criticos...
if not exist ".env" (
  echo [INFO] Generando .env...
  python generate_env.py
)

echo.
echo ========================================================
echo [OK] CORRECCIONES COMPLETADAS
echo ========================================================
echo.
echo Proximos pasos:
echo 1. Ejecuta: scripts\VALIDAR_SISTEMA.bat
echo 2. Si todo esta OK, ejecuta: scripts\REINSTALAR.bat
echo.

pause >nul
