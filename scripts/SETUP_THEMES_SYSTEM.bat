@echo off
echo.
echo ========================================
echo  Creando Sistema de Themes
echo ========================================
echo.

cd /d "%~dp0"

REM Crear estructura de directorios
echo [1/4] Creando directorios...
if not exist "config\themes" mkdir "config\themes"
if not exist "config\themes\available" mkdir "config\themes\available"
if not exist "config\themes\available\default-theme" mkdir "config\themes\available\default-theme"
if not exist "config\themes\available\default-theme\components" mkdir "config\themes\available\default-theme\components"
if not exist "config\themes\available\default-theme\app" mkdir "config\themes\available\default-theme\app"
if not exist "config\themes\available\default-theme\styles" mkdir "config\themes\available\default-theme\styles"
if not exist "config\themes\current-theme" mkdir "config\themes\current-theme"
if not exist "config\themes\history" mkdir "config\themes\history"
if not exist "config\themes\scripts" mkdir "config\themes\scripts"

echo    - config\themes\available\
echo    - config\themes\current-theme\
echo    - config\themes\history\
echo    - config\themes\scripts\
echo.

echo [2/4] Ejecutando script Node.js...
node create_theme_structure.js

echo.
echo [3/4] Copiando theme actual (default)...
echo    Esto puede tardar un momento...

REM Copiar frontend actual como default-theme
xcopy /E /I /Y /Q "frontend\components\ui" "config\themes\available\default-theme\components\ui\" >nul 2>&1
xcopy /E /I /Y /Q "frontend\app\(dashboard)" "config\themes\available\default-theme\app\" >nul 2>&1
xcopy /Y /Q "frontend\tailwind.config.ts" "config\themes\available\default-theme\" >nul 2>&1
xcopy /Y /Q "frontend\app\globals.css" "config\themes\available\default-theme\styles\" >nul 2>&1

echo    OK - Theme por defecto guardado
echo.

echo [4/4] Generando archivos de configuracion...
node create_theme_files.js

echo.
echo ========================================
echo  Sistema de Themes Creado!
echo ========================================
echo.
echo Ubicacion: config\themes\
echo.
echo Proximos pasos:
echo  1. Revisa config\themes\README.md
echo  2. Usa config\themes\scripts\ThemeList.bat para ver themes
echo  3. Instala themes con ThemeInstall.bat
echo.
pause
