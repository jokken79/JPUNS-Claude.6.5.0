@echo off
echo Creando estructura de themes...

cd /d D:\UNS-ClaudeJP-5.4.1

mkdir config\themes 2>nul
mkdir config\themes\available 2>nul
mkdir config\themes\available\default-theme 2>nul
mkdir config\themes\current-theme 2>nul
mkdir config\themes\history 2>nul
mkdir config\themes\scripts 2>nul

echo Estructura creada!
echo.
echo Ahora ejecuta: node create_theme_files.js
pause
