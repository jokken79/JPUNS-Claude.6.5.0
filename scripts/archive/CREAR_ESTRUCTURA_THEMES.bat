@echo off
chcp 65001 >nul
echo.
echo ═══════════════════════════════════════════════════════════════
echo   🎨 CREANDO SISTEMA DE THEMES
echo ═══════════════════════════════════════════════════════════════
echo.

cd /d "%~dp0"

echo [1/2] 📁 Creando estructura de carpetas...

mkdir themes 2>nul
mkdir themes\vercel-dark-light 2>nul
mkdir themes\vercel-dark-light\src 2>nul
mkdir themes\vercel-dark-light\src\contexts 2>nul
mkdir themes\vercel-dark-light\src\components 2>nul
mkdir themes\vercel-dark-light\src\components\ui 2>nul
mkdir themes\vercel-dark-light\src\components\layout 2>nul
mkdir themes\vercel-dark-light\src\components\dashboard 2>nul
mkdir themes\vercel-dark-light\src\components\dashboard\charts 2>nul
mkdir themes\vercel-dark-light\src\lib 2>nul
mkdir themes\vercel-dark-light\src\app 2>nul
mkdir "themes\vercel-dark-light\src\app\(dashboard)" 2>nul
mkdir "themes\vercel-dark-light\src\app\(dashboard)\dashboard" 2>nul
mkdir themes\default-original 2>nul

echo    ✅ Carpetas creadas

echo.
echo [2/2] ℹ️  Siguiente paso...

echo.
echo ═══════════════════════════════════════════════════════════════
echo   ✅ ESTRUCTURA CREADA
echo ═══════════════════════════════════════════════════════════════
echo.
echo 📁 Carpetas creadas:
echo    themes/
echo    ├── README.md
echo    ├── vercel-dark-light/
echo    │   ├── ThemesInstall-VerceLDarkLight.bat
echo    │   ├── install.js
echo    │   ├── package.json
echo    │   └── src/ (aquí van los archivos del theme)
echo    └── default-original/
echo        └── ThemesInstall-DefaultOriginal.bat
echo.
echo 🚀 SIGUIENTE PASO:
echo    Copia los archivos del dashboard a: themes\vercel-dark-light\src\
echo    Usando la guía: DASHBOARD_COMPLETO_TODOS_LOS_ARCHIVOS.md
echo.
pause
