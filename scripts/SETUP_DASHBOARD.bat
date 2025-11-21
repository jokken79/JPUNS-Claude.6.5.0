@echo off
chcp 65001 >nul
echo.
echo ═══════════════════════════════════════════════════════════
echo   🎨 IMPLEMENTACIÓN: Dashboard con Dark/Light Mode
echo   Creando estructura de carpetas...
echo ═══════════════════════════════════════════════════════════
echo.

cd /d "%~dp0frontend"

REM Crear directorios necesarios
echo [1/3] Creando directorios...
mkdir components\layout 2>nul
mkdir components\dashboard 2>nul
mkdir components\dashboard\charts 2>nul
mkdir lib\design-tokens 2>nul
echo   ✅ Directorios creados

echo.
echo [2/3] Verificando estructura...
dir /b components\layout
dir /b components\dashboard

echo.
echo [3/3] Instalando dependencias...
call npm install next-themes

echo.
echo ═══════════════════════════════════════════════════════════
echo   ✅ Setup completado
echo ═══════════════════════════════════════════════════════════
echo.
pause
