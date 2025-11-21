@echo off
chcp 65001 >nul
echo.
echo ═══════════════════════════════════════════════════════════
echo   🎨 SNEAT PRO - Sistema de Themes Premium
echo   Creando estructura completa...
echo ═══════════════════════════════════════════════════════════
echo.

cd /d "%~dp0"

echo [1/3] 📁 Creando estructura de carpetas...

REM Crear carpeta principal de themes
mkdir themes 2>nul
mkdir themes\sneat-pro 2>nul
mkdir themes\sneat-pro\src 2>nul

REM Contexts
mkdir themes\sneat-pro\src\contexts 2>nul

REM Components - Layout
mkdir themes\sneat-pro\src\components 2>nul
mkdir themes\sneat-pro\src\components\layout 2>nul

REM Components - Dashboard (6 variantes)
mkdir themes\sneat-pro\src\components\dashboard 2>nul
mkdir themes\sneat-pro\src\components\dashboard\ecommerce 2>nul
mkdir themes\sneat-pro\src\components\dashboard\analytics 2>nul
mkdir themes\sneat-pro\src\components\dashboard\crm 2>nul
mkdir themes\sneat-pro\src\components\dashboard\academy 2>nul
mkdir themes\sneat-pro\src\components\dashboard\logistics 2>nul
mkdir themes\sneat-pro\src\components\dashboard\social 2>nul

REM Components - UI
mkdir themes\sneat-pro\src\components\ui 2>nul
mkdir themes\sneat-pro\src\components\shared 2>nul

REM Lib
mkdir themes\sneat-pro\src\lib 2>nul

REM App
mkdir themes\sneat-pro\src\app 2>nul
mkdir "themes\sneat-pro\src\app\(dashboard)" 2>nul
mkdir "themes\sneat-pro\src\app\(dashboard)\ecommerce" 2>nul
mkdir "themes\sneat-pro\src\app\(dashboard)\analytics" 2>nul
mkdir "themes\sneat-pro\src\app\(dashboard)\crm" 2>nul
mkdir "themes\sneat-pro\src\app\(dashboard)\academy" 2>nul
mkdir "themes\sneat-pro\src\app\(dashboard)\logistics" 2>nul
mkdir "themes\sneat-pro\src\app\(dashboard)\social" 2>nul

REM Carpeta para theme default (backup)
mkdir themes\default-original 2>nul

echo    ✅ Carpetas creadas

echo.
echo [2/3] 📋 Verificando estructura...
dir /b themes\sneat-pro\src\components

echo.
echo [3/3] ℹ️  Siguiente paso...

echo.
echo ═══════════════════════════════════════════════════════════
echo   ✅ ESTRUCTURA CREADA EXITOSAMENTE
echo ═══════════════════════════════════════════════════════════
echo.
echo 📁 Estructura completa:
echo    themes/sneat-pro/
echo    ├── src/
echo    │   ├── contexts/
echo    │   ├── components/
echo    │   │   ├── layout/
echo    │   │   ├── dashboard/ (6 variantes)
echo    │   │   ├── ui/
echo    │   │   └── shared/
echo    │   ├── lib/
echo    │   └── app/
echo    └── (scripts de instalación próximamente)
echo.
echo 🚀 SIGUIENTE:
echo    Voy a crear los componentes de Sneat Pro
echo    - Glass Sidebar (purple gradient)
echo    - 6 Dashboards completos
echo    - 500+ componentes UI
echo.
pause
