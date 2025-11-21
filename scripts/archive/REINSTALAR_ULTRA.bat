@echo off
REM ===========================================================================
REM  REINSTALAR ULTRA - Double Click Launcher
REM  Este archivo permite ejecutar REINSTALAR_ULTRA.ps1 con doble click
REM ===========================================================================

setlocal enabledelayedexpansion

REM Detectar directorio del script
set "SCRIPT_DIR=%~dp0"
set "ULTRA_SCRIPT=%SCRIPT_DIR%REINSTALAR_ULTRA.ps1"

REM Verificar que el archivo PowerShell existe
if not exist "%ULTRA_SCRIPT%" (
    echo.
    echo ============================================================================
    echo  ERROR: No se encontro REINSTALAR_ULTRA.ps1
    echo ============================================================================
    echo.
    pause
    exit /b 1
)

REM Ejecutar el script PowerShell con bypass de politica de ejecucion
PowerShell.exe -NoProfile -ExecutionPolicy Bypass -File "%ULTRA_SCRIPT%"

REM Pausar si hubo error (para ver el mensaje)
if errorlevel 1 (
    echo.
    echo ============================================================================
    echo  Presiona ENTER para cerrar
    echo ============================================================================
    pause >nul
)

exit /b 0
