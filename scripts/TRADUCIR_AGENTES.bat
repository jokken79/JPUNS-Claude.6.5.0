@echo off
chcp 65001 >nul
setlocal enabledelayedexpansion

:: ==============================================================================
:: TRADUCIR_AGENTES.bat
:: Traduce los 15 agentes principales al español
:: ==============================================================================

color 0B
title Traducción de Agentes Principales

echo.
echo ╔════════════════════════════════════════════════════════════════════════╗
echo ║         TRADUCIR AGENTES PRINCIPALES AL ESPAÑOL                       ║
echo ║         15 Agentes más importantes para UNS-ClaudeJP                  ║
echo ╚════════════════════════════════════════════════════════════════════════╝
echo.

set "AGENTS_DIR=%~dp0..\.claude\agents"
set "ES_DIR=%AGENTS_DIR%\es"

:: Crear directorio para agentes en español
if not exist "%ES_DIR%" (
    mkdir "%ES_DIR%"
    echo [OK] Directorio creado: %ES_DIR%
)

echo.
echo [INFO] Copiando y preparando agentes para traducción...
echo.

:: Mapa de agentes a traducir
:: orchestrator
if exist "%AGENTS_DIR%\orchestrator.md" (
    copy /Y "%AGENTS_DIR%\orchestrator.md" "%ES_DIR%\orquestador.md" >nul
    echo [OK] orchestrator.md → orquestador.md
)

:: code-reviewer
if exist "%AGENTS_DIR%\orchestration\code-reviewer.md" (
    copy /Y "%AGENTS_DIR%\orchestration\code-reviewer.md" "%ES_DIR%\revisor-codigo.md" >nul
    echo [OK] code-reviewer.md → revisor-codigo.md
)

:: software-engineering-expert
if exist "%AGENTS_DIR%\orchestration\software-engineering-expert.md" (
    copy /Y "%AGENTS_DIR%\orchestration\software-engineering-expert.md" "%ES_DIR%\experto-ingenieria.md" >nul
    echo [OK] software-engineering-expert.md → experto-ingenieria.md
)

:: react-nextjs-expert
if exist "%AGENTS_DIR%\frontend\nextjs-expert.md" (
    copy /Y "%AGENTS_DIR%\frontend\nextjs-expert.md" "%ES_DIR%\experto-nextjs.md" >nul
    echo [OK] nextjs-expert.md → experto-nextjs.md
)

:: python-hyx-resilience
if exist "%AGENTS_DIR%\backend\python-hyx-resilience.md" (
    copy /Y "%AGENTS_DIR%\backend\python-hyx-resilience.md" "%ES_DIR%\experto-python.md" >nul
    echo [OK] python-hyx-resilience.md → experto-python.md
)

:: database-admin
if exist "%AGENTS_DIR%\database\database-admin.md" (
    copy /Y "%AGENTS_DIR%\database\database-admin.md" "%ES_DIR%\admin-base-datos.md" >nul
    echo [OK] database-admin.md → admin-base-datos.md
)

:: api-architect
if exist "%AGENTS_DIR%\ai-analysis\api-architect.md" (
    copy /Y "%AGENTS_DIR%\ai-analysis\api-architect.md" "%ES_DIR%\arquitecto-api.md" >nul
    echo [OK] api-architect.md → arquitecto-api.md
)

:: security-specialist
if exist "%AGENTS_DIR%\security\security-specialist.md" (
    copy /Y "%AGENTS_DIR%\security\security-specialist.md" "%ES_DIR%\especialista-seguridad.md" >nul
    echo [OK] security-specialist.md → especialista-seguridad.md
)

:: vibe-coding-coordinator
if exist "%AGENTS_DIR%\context-orchestrators\vibe-coding-coordinator.md" (
    copy /Y "%AGENTS_DIR%\context-orchestrators\vibe-coding-coordinator.md" "%ES_DIR%\coordinador-vibe.md" >nul
    echo [OK] vibe-coding-coordinator.md → coordinador-vibe.md
)

:: computer-vision-specialist
if exist "%AGENTS_DIR%\ai\computer-vision-specialist.md" (
    copy /Y "%AGENTS_DIR%\ai\computer-vision-specialist.md" "%ES_DIR%\especialista-ocr.md" >nul
    echo [OK] computer-vision-specialist.md → especialista-ocr.md
)

:: devops-troubleshooter
if exist "%AGENTS_DIR%\devops\devops-troubleshooter.md" (
    copy /Y "%AGENTS_DIR%\devops\devops-troubleshooter.md" "%ES_DIR%\experto-devops.md" >nul
    echo [OK] devops-troubleshooter.md → experto-devops.md
)

:: git-expert
if exist "%AGENTS_DIR%\orchestration\git-expert.md" (
    copy /Y "%AGENTS_DIR%\orchestration\git-expert.md" "%ES_DIR%\experto-git.md" >nul
    echo [OK] git-expert.md → experto-git.md
)

:: documentation-specialist
if exist "%AGENTS_DIR%\orchestration\documentation-specialist.md" (
    copy /Y "%AGENTS_DIR%\orchestration\documentation-specialist.md" "%ES_DIR%\experto-documentacion.md" >nul
    echo [OK] documentation-specialist.md → experto-documentacion.md
)

:: performance-optimizer
if exist "%AGENTS_DIR%\performance-optimizers\performance-optimizer.md" (
    copy /Y "%AGENTS_DIR%\performance-optimizers\performance-optimizer.md" "%ES_DIR%\optimizador-rendimiento.md" >nul
    echo [OK] performance-optimizer.md → optimizador-rendimiento.md
)

:: tailwind-css-expert
if exist "%AGENTS_DIR%\design\tailwind-css-expert.md" (
    copy /Y "%AGENTS_DIR%\design\tailwind-css-expert.md" "%ES_DIR%\experto-tailwind.md" >nul
    echo [OK] tailwind-css-expert.md → experto-tailwind.md
)

echo.
echo ════════════════════════════════════════════════════════════════════════
echo [INFO] Archivos copiados. Ahora necesitan traducción de contenido.
echo ════════════════════════════════════════════════════════════════════════
echo.
echo NOTA: Los archivos se han copiado con nombres en español,
echo       pero el contenido interno aún está en inglés.
echo.
echo Para traducir el contenido, usa:
echo   claude "Traduce el contenido de los agentes en .claude/agents/es/ al español"
echo.

pause

pause >nul
