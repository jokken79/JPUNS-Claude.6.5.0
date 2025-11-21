@echo off
chcp 65001 >nul
echo Ejecutando creación de agentes elite...
echo.
node create_elite_agents.js
echo.
if %ERRORLEVEL% EQU 0 (
    echo ✅ Agentes creados exitosamente
) else (
    echo ❌ Error al crear agentes
)
echo.
pause
