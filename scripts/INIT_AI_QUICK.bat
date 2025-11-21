@echo off
REM ============================================
REM INIT_AI_QUICK.bat
REM Inicializacion Rapida para IA (version corta)
REM UNS-ClaudeJP v5.4
REM ============================================

cls
echo.
echo ============================================
echo   INIT AI - VERSION RAPIDA
echo   UNS-ClaudeJP v5.4
echo ============================================
echo.

REM Verificar existencia de documentación
if not exist "docs\GUIA_INICIO_IA.md" (
    echo [ERROR] Documentacion no encontrada
    pause
    exit /b 1
)

echo [INFO] Cargando contexto esencial...
echo.

REM Cargar solo lo esencial
type "docs\GUIA_INICIO_IA.md"

echo.
echo ============================================
echo   CONTEXTO BASICO CARGADO
echo ============================================
echo.
echo Para contexto completo: INIT_AI_DOCS.bat
echo Para comandos rapidos:   type docs\ai\COMANDOS_FRECUENTES.md
echo Para indice completo:    type docs\INDEX_DOCUMENTACION.md
echo.
echo Sistema: UNS-ClaudeJP v5.4 - RRHH Agencias Japonesas
echo Stack:   Next.js 15 + FastAPI + PostgreSQL 15
echo.
echo Servicios: http://localhost:3000 (Frontend)
echo            http://localhost:8000 (Backend API)
echo.
echo Login:     admin / admin123
echo.
echo [OK] IA inicializada y lista para trabajar
echo.
pause
