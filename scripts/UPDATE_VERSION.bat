@echo off
REM ================================================================
REM UPDATE_VERSION.bat - Actualizar versión del proyecto
REM ================================================================
REM
REM Uso:
REM   UPDATE_VERSION.bat 5.2
REM   UPDATE_VERSION.bat 5.3
REM   UPDATE_VERSION.bat 6.0
REM
REM Este script actualiza TODAS las referencias de versión en:
REM - Archivos de documentación (.md)
REM - Archivos de configuración (.json)
REM - Código fuente (.py, .ts, .tsx)
REM - Archivos de texto (.txt)
REM
REM ================================================================

setlocal enabledelayedexpansion

REM Obtener la versión deseada del parámetro
set "NEW_VERSION=%~1"

REM Si no se proporciona versión, usar 5.2 por defecto
if "%NEW_VERSION%"=="" (
    set "NEW_VERSION=5.2"
    echo No se especifico version, usando por defecto: 5.2
) else (
    echo Actualizando a version: %NEW_VERSION%
)

REM Obtener el directorio del proyecto (un nivel arriba de scripts)
set "PROJECT_ROOT=%~dp0.."
cd /d "%PROJECT_ROOT%"

echo.
echo ================================================================
echo ACTUALIZANDO VERSION A: %NEW_VERSION%
echo ================================================================
echo.
echo Directorio del proyecto: %PROJECT_ROOT%
echo.

REM Crear backup de archivos críticos
echo [1/6] Creando backup de archivos criticos...
if not exist "LIXO\version_backup" mkdir "LIXO\version_backup"
copy /Y "README.md" "LIXO\version_backup\README.md.bak" >nul 2>&1
copy /Y "CHANGELOG.md" "LIXO\version_backup\CHANGELOG.md.bak" >nul 2>&1
copy /Y "backend\app\core\config.py" "LIXO\version_backup\config.py.bak" >nul 2>&1
copy /Y "backend\app\main.py" "LIXO\version_backup\main.py.bak" >nul 2>&1
copy /Y "frontend\package.json" "LIXO\version_backup\package.json.bak" >nul 2>&1
echo    ✓ Backup creado en LIXO\version_backup\
echo.

REM ================================================================
REM PARTE 1: Actualizar archivos de documentación principal
REM ================================================================
echo [2/6] Actualizando archivos principales...

REM README.md
powershell -Command "(Get-Content 'README.md') -replace 'UNS-ClaudeJP 5\.\d+(\.\d+)?', 'UNS-ClaudeJP %NEW_VERSION%' | Set-Content 'README.md'"
powershell -Command "(Get-Content 'README.md') -replace 'Version(.*?)5\.\d+(\.\d+)?', 'Version${1}%NEW_VERSION%' | Set-Content 'README.md'"
powershell -Command "(Get-Content 'README.md') -replace 'v5\.\d+(\.\d+)?', 'v%NEW_VERSION%' | Set-Content 'README.md'"

REM CHANGELOG.md
powershell -Command "(Get-Content 'CHANGELOG.md') -replace 'UNS-ClaudeJP 5\.\d+(\.\d+)?', 'UNS-ClaudeJP %NEW_VERSION%' | Set-Content 'CHANGELOG.md'"

REM AGENTS.md
powershell -Command "(Get-Content 'AGENTS.md') -replace 'UNS-ClaudeJP 5\.\d+(\.\d+)?', 'UNS-ClaudeJP %NEW_VERSION%' | Set-Content 'AGENTS.md'"

REM AI_RULES.md
powershell -Command "(Get-Content 'AI_RULES.md') -replace 'UNS-ClaudeJP 5\.\d+(\.\d+)?', 'UNS-ClaudeJP %NEW_VERSION%' | Set-Content 'AI_RULES.md'"
powershell -Command "(Get-Content 'AI_RULES.md') -replace '\*\*Versión:\*\* 5\.\d+(\.\d+)?', '**Versión:** %NEW_VERSION%' | Set-Content 'AI_RULES.md'"

REM CLAUDE.md
powershell -Command "(Get-Content 'CLAUDE.md') -replace 'UNS-ClaudeJP 5\.\d+(\.\d+)?', 'UNS-ClaudeJP %NEW_VERSION%' | Set-Content 'CLAUDE.md'"

REM CONTRIBUTING.md
powershell -Command "(Get-Content 'CONTRIBUTING.md') -replace 'UNS-ClaudeJP 5\.\d+(\.\d+)?', 'UNS-ClaudeJP %NEW_VERSION%' | Set-Content 'CONTRIBUTING.md'"

echo    ✓ Archivos principales actualizados
echo.

REM ================================================================
REM PARTE 2: Actualizar backend
REM ================================================================
echo [3/6] Actualizando backend...

REM backend/app/core/config.py
powershell -Command "(Get-Content 'backend\app\core\config.py') -replace 'APP_VERSION: str = \"5\.\d+(\.\d+)?\"', 'APP_VERSION: str = \"%NEW_VERSION%.0\"' | Set-Content 'backend\app\core\config.py'"
powershell -Command "(Get-Content 'backend\app\core\config.py') -replace 'Configuration settings for UNS-ClaudeJP 5\.\d+(\.\d+)?', 'Configuration settings for UNS-ClaudeJP %NEW_VERSION%' | Set-Content 'backend\app\core\config.py'"

REM backend/app/main.py
powershell -Command "(Get-Content 'backend\app\main.py') -replace 'UNS-ClaudeJP v5\.\d+(\.\d+)?', 'UNS-ClaudeJP v%NEW_VERSION%' | Set-Content 'backend\app\main.py'"
powershell -Command "(Get-Content 'backend\app\main.py') -replace 'version=\"5\.\d+(\.\d+)?\"', 'version=\"%NEW_VERSION%.0\"' | Set-Content 'backend\app\main.py'"

REM backend/app/core/database.py
powershell -Command "(Get-Content 'backend\app\core\database.py') -replace 'Database configuration for UNS-ClaudeJP 5\.\d+(\.\d+)?', 'Database configuration for UNS-ClaudeJP %NEW_VERSION%' | Set-Content 'backend\app\core\database.py'"

REM backend/app/api/__init__.py
powershell -Command "(Get-Content 'backend\app\api\__init__.py') -replace 'API routers package for UNS-ClaudeJP 5\.\d+(\.\d+)?', 'API routers package for UNS-ClaudeJP %NEW_VERSION%' | Set-Content 'backend\app\api\__init__.py'"

REM backend/app/models/__init__.py
powershell -Command "(Get-Content 'backend\app\models\__init__.py') -replace 'ORM Models for UNS-ClaudeJP 5\.\d+(\.\d+)?', 'ORM Models for UNS-ClaudeJP %NEW_VERSION%' | Set-Content 'backend\app\models\__init__.py'"

REM backend/app/schemas/__init__.py
powershell -Command "(Get-Content 'backend\app\schemas\__init__.py') -replace 'Pydantic Schemas for UNS-ClaudeJP 5\.\d+(\.\d+)?', 'Pydantic Schemas for UNS-ClaudeJP %NEW_VERSION%' | Set-Content 'backend\app\schemas\__init__.py'"

echo    ✓ Backend actualizado
echo.

REM ================================================================
REM PARTE 3: Actualizar frontend
REM ================================================================
echo [4/6] Actualizando frontend...

REM frontend/package.json
powershell -Command "$json = Get-Content 'frontend\package.json' -Raw | ConvertFrom-Json; $json.version = '%NEW_VERSION%.0'; $json | ConvertTo-Json -Depth 10 | Set-Content 'frontend\package.json'"

echo    ✓ Frontend actualizado
echo.

REM ================================================================
REM PARTE 4: Actualizar archivos de configuración
REM ================================================================
echo [5/6] Actualizando archivos de configuracion...

REM .speckit/config.json
if exist ".speckit\config.json" (
    powershell -Command "(Get-Content '.speckit\config.json') -replace '\"name\": \"UNS-ClaudeJP 5\.\d+(\.\d+)?\"', '\"name\": \"UNS-ClaudeJP %NEW_VERSION%\"' | Set-Content '.speckit\config.json'"
)

REM .speckit/spec.md
if exist ".speckit\spec.md" (
    powershell -Command "(Get-Content '.speckit\spec.md') -replace 'UNS-ClaudeJP 5\.\d+(\.\d+)?', 'UNS-ClaudeJP %NEW_VERSION%' | Set-Content '.speckit\spec.md'"
)

REM .speckit/ai-instructions.md
if exist ".speckit\ai-instructions.md" (
    powershell -Command "(Get-Content '.speckit\ai-instructions.md') -replace 'UNS-ClaudeJP 5\.\d+(\.\d+)?', 'UNS-ClaudeJP %NEW_VERSION%' | Set-Content '.speckit\ai-instructions.md'"
)

REM .mcp.json (cambiar referencias a directorios)
if exist ".mcp.json" (
    powershell -Command "(Get-Content '.mcp.json') -replace 'JPUNS-CLAUDE5\.\d+', 'JPUNS-CLAUDE%NEW_VERSION%' | Set-Content '.mcp.json'"
)

echo    ✓ Archivos de configuracion actualizados
echo.

REM ================================================================
REM PARTE 5: Actualizar documentación en docs/
REM ================================================================
echo [6/6] Actualizando documentacion en docs/...

REM Buscar y reemplazar en TODOS los archivos .md dentro de docs/
for /r "docs" %%f in (*.md) do (
    powershell -Command "(Get-Content '%%f') -replace 'UNS-ClaudeJP 5\.\d+(\.\d+)?', 'UNS-ClaudeJP %NEW_VERSION%' -replace 'Version(.*?)5\.\d+(\.\d+)?', 'Version${1}%NEW_VERSION%' -replace 'v5\.\d+(\.\d+)?', 'v%NEW_VERSION%' | Set-Content '%%f'" 2>nul
)

REM Actualizar docs/testing/*.md
if exist "docs\testing\README.md" (
    powershell -Command "(Get-Content 'docs\testing\README.md') -replace 'UNS-ClaudeJP 5\.\d+(\.\d+)?', 'UNS-ClaudeJP %NEW_VERSION%' | Set-Content 'docs\testing\README.md'"
)

REM Actualizar docs/api/*.md
if exist "docs\api\README.md" (
    powershell -Command "(Get-Content 'docs\api\README.md') -replace 'UNS-ClaudeJP 5\.\d+(\.\d+)?', 'UNS-ClaudeJP %NEW_VERSION%' | Set-Content 'docs\api\README.md'"
)

REM Actualizar docs/frontend/*.md
if exist "docs\frontend\README.md" (
    powershell -Command "(Get-Content 'docs\frontend\README.md') -replace 'UNS-ClaudeJP 5\.\d+(\.\d+)?', 'UNS-ClaudeJP %NEW_VERSION%' | Set-Content 'docs\frontend\README.md'"
)

REM Actualizar docs/INDEX.md
if exist "docs\INDEX.md" (
    powershell -Command "(Get-Content 'docs\INDEX.md') -replace 'UNS-ClaudeJP 5\.\d+(\.\d+)?', 'UNS-ClaudeJP %NEW_VERSION%' -replace 'Version(.*?)5\.\d+(\.\d+)?', 'Version${1}%NEW_VERSION%' | Set-Content 'docs\INDEX.md'"
)

echo    ✓ Documentacion actualizada
echo.

REM ================================================================
REM RESUMEN
REM ================================================================
echo.
echo ================================================================
echo ACTUALIZACION COMPLETADA!
echo ================================================================
echo.
echo Version actualizada a: %NEW_VERSION%
echo.
echo Archivos actualizados:
echo   ✓ README.md, CHANGELOG.md, AGENTS.md, AI_RULES.md, CLAUDE.md
echo   ✓ CONTRIBUTING.md
echo   ✓ backend/app/core/config.py
echo   ✓ backend/app/main.py
echo   ✓ backend/app/core/database.py
echo   ✓ backend/app/api/__init__.py
echo   ✓ backend/app/models/__init__.py
echo   ✓ backend/app/schemas/__init__.py
echo   ✓ frontend/package.json
echo   ✓ .speckit/config.json
echo   ✓ .speckit/spec.md
echo   ✓ .speckit/ai-instructions.md
echo   ✓ .mcp.json
echo   ✓ docs/**/*.md (todos los archivos de documentacion)
echo.
echo Backup creado en: LIXO\version_backup\
echo.
echo ================================================================
echo.

pause

pause >nul
