@echo off
REM ============================================
REM INIT_AI_DOCS.bat
REM Sistema de Inicialización de Documentación para IAs
REM UNS-ClaudeJP v5.4
REM ============================================

color 0A
title Inicializacion de Documentacion para IA - UNS-ClaudeJP v5.4

echo.
echo ============================================
echo   INICIALIZACION DE DOCUMENTACION PARA IA
echo   UNS-ClaudeJP v5.4
echo ============================================
echo.

REM Verificar que estamos en la raíz del proyecto
if not exist "docs\GUIA_INICIO_IA.md" (
    echo [ERROR] No se encuentra el directorio docs/
    echo Por favor ejecuta este script desde la raiz del proyecto.
    pause
    exit /b 1
)

echo [INFO] Cargando documentacion esencial...
echo.

REM ============================================
REM PASO 1: GUIA DE INICIO RAPIDO
REM ============================================
echo ============================================
echo PASO 1: GUIA DE INICIO RAPIDO PARA IA
echo ============================================
echo.
type "docs\GUIA_INICIO_IA.md"
echo.
echo [OK] Guia de inicio cargada
echo.
pause

REM ============================================
REM PASO 2: CONTEXTO COMPLETO
REM ============================================
echo.
echo ============================================
echo PASO 2: CONTEXTO COMPLETO DEL PROYECTO
echo ============================================
echo.
type "docs\ai\CONTEXTO_COMPLETO.md"
echo.
echo [OK] Contexto completo cargado
echo.
pause

REM ============================================
REM PASO 3: COMANDOS FRECUENTES
REM ============================================
echo.
echo ============================================
echo PASO 3: COMANDOS FRECUENTES
echo ============================================
echo.
type "docs\ai\COMANDOS_FRECUENTES.md"
echo.
echo [OK] Comandos frecuentes cargados
echo.
pause

REM ============================================
REM PASO 4: INDICE MAESTRO
REM ============================================
echo.
echo ============================================
echo PASO 4: INDICE MAESTRO DE DOCUMENTACION
echo ============================================
echo.
type "docs\INDEX_DOCUMENTACION.md"
echo.
echo [OK] Indice maestro cargado
echo.
pause

REM ============================================
REM PASO 5: DOCUMENTACION CORE
REM ============================================
echo.
echo ============================================
echo PASO 5: DOCUMENTACION CORE (Opcional)
echo ============================================
echo.
echo Deseas cargar la documentacion core? (README.md y CLAUDE.md)
echo Estos archivos son extensos (~500+ lineas cada uno)
echo.
set /p load_core="Cargar documentacion core? (s/n): "

if /i "%load_core%"=="s" (
    echo.
    echo --- README.md ---
    type "docs\core\README.md"
    echo.
    echo [OK] README.md cargado
    echo.
    pause
    
    echo.
    echo --- CLAUDE.md ---
    type "docs\core\CLAUDE.md"
    echo.
    echo [OK] CLAUDE.md cargado
    echo.
    pause
) else (
    echo.
    echo [INFO] Documentacion core omitida. Puedes consultarla en:
    echo   - docs\core\README.md
    echo   - docs\core\CLAUDE.md
    echo.
)

REM ============================================
REM RESUMEN FINAL
REM ============================================
cls
echo.
echo ============================================
echo   INICIALIZACION COMPLETADA
echo ============================================
echo.
echo Documentacion cargada:
echo   [OK] Guia de Inicio IA
echo   [OK] Contexto Completo
echo   [OK] Comandos Frecuentes
echo   [OK] Indice Maestro
if /i "%load_core%"=="s" (
    echo   [OK] Documentacion Core
) else (
    echo   [--] Documentacion Core (omitida)
)
echo.
echo ============================================
echo   DOCUMENTACION DISPONIBLE
echo ============================================
echo.
echo NIVEL 1 - CRITICO (Ya cargado):
echo   - docs\GUIA_INICIO_IA.md
echo   - docs\ai\CONTEXTO_COMPLETO.md
echo   - docs\ai\COMANDOS_FRECUENTES.md
echo   - docs\INDEX_DOCUMENTACION.md
echo.
echo NIVEL 2 - ALTA PRIORIDAD:
echo   - docs\core\README.md
echo   - docs\core\CLAUDE.md
echo   - docs\core\MIGRATION_V5.4_README.md
echo.
echo NIVEL 3 - CONSULTA:
echo   - docs\changelogs\CHANGELOG_V5.2_TO_V5.4.md
echo   - docs\integration\TIMER_CARD_PAYROLL_INTEGRATION.md
echo   - docs\scripts\SOLUCION_PROBLEMAS_LIMPIAR_CACHE.md
echo   - docs\github\copilot-instructions.md
echo.
echo NIVEL 4 - REFERENCIA:
echo   - docs\database\BASEDATEJP_README.md
echo   - docs\analysis\*.md
echo.
echo ============================================
echo   INFORMACION DEL SISTEMA
echo ============================================
echo.
echo Proyecto: UNS-ClaudeJP v5.4
echo Sistema:  Gestion RRHH Agencias Japonesas
echo Stack:    Next.js 15 + FastAPI + PostgreSQL 15
echo.
echo Servicios:
echo   Frontend:  http://localhost:3000
echo   Backend:   http://localhost:8000
echo   API Docs:  http://localhost:8000/api/docs
echo   DB Admin:  http://localhost:8080
echo.
echo Credenciales por defecto:
echo   Usuario:   admin
echo   Password:  admin123
echo.
echo ============================================
echo   PROXIMOS PASOS
echo ============================================
echo.
echo Para IAs que comienzan a trabajar:
echo.
echo 1. Verifica estado del sistema:
echo    START.bat (si no esta corriendo)
echo    docker ps
echo.
echo 2. Revisa logs si es necesario:
echo    LOGS.bat
echo.
echo 3. Para tareas especificas, consulta:
echo    - Desarrollo: docs\core\CLAUDE.md
echo    - Debugging:  docs\scripts\SOLUCION_PROBLEMAS_LIMPIAR_CACHE.md
echo    - Comandos:   docs\ai\COMANDOS_FRECUENTES.md
echo.
echo 4. Antes de hacer cambios importantes:
echo    - Lee CHANGELOG_V5.2_TO_V5.4.md
echo    - Verifica patrones en codigo existente
echo    - Nunca borrar codigo funcional
echo.
echo ============================================
echo   IA LISTA PARA TRABAJAR
echo ============================================
echo.
echo Contexto inicializado correctamente.
echo Puedes comenzar a trabajar en el proyecto.
echo.
echo Para re-ejecutar esta inicializacion:
echo   INIT_AI_DOCS.bat
echo.
echo Para documentacion interactiva:
echo   type docs\INDEX_DOCUMENTACION.md
echo.
pause

REM Abrir documentación en navegador (opcional)
echo.
set /p open_docs="Deseas abrir la documentacion en el navegador? (s/n): "
if /i "%open_docs%"=="s" (
    echo.
    echo [INFO] Abriendo documentacion en navegador...
    start http://localhost:3000
    start http://localhost:8000/api/docs
)

echo.
echo [OK] Inicializacion completada. IA lista!
echo.
pause
exit /b 0
