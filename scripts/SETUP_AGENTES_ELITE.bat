@echo off
chcp 65001 >nul
cls
echo ═══════════════════════════════════════════════════════════
echo  🚀 CREAR Y REGISTRAR AGENTES ELITE
echo ═══════════════════════════════════════════════════════════
echo.

echo [Paso 1/2] Creando archivos de agentes elite...
echo.
node create_elite_agents.js
echo.

if %ERRORLEVEL% NEQ 0 (
    echo ❌ Error al crear agentes
    pause
    exit /b 1
)

echo.
echo [Paso 2/2] Registrando agentes en agents.json...
echo.
node register_elite_agents.js
echo.

if %ERRORLEVEL% NEQ 0 (
    echo ❌ Error al registrar agentes
    pause
    exit /b 1
)

echo.
echo ═══════════════════════════════════════════════════════════
echo  ✅ PROCESO COMPLETADO
echo ═══════════════════════════════════════════════════════════
echo.
echo Los siguientes agentes elite están listos para usar:
echo.
echo  1. 🧠 master-problem-solver
echo     - Resuelve problemas complejos multi-capa
echo     - Debugging avanzado y root cause analysis
echo     - Optimización de sistemas completos
echo.
echo  2. 🏗️  full-stack-architect  
echo     - Diseña e implementa features end-to-end
echo     - Backend (Python/FastAPI) + Frontend (React/Next.js)
echo     - Best practices y arquitectura limpia
echo.
echo  3. 🛡️  code-quality-guardian
echo     - Code review exhaustivo
echo     - Detecta code smells y anti-patterns
echo     - Mejora calidad y test coverage
echo.
echo ═══════════════════════════════════════════════════════════
echo  📚 CÓMO USAR
echo ═══════════════════════════════════════════════════════════
echo.
echo Los agentes se invocan automáticamente cuando:
echo  - Mencionas keywords en tu mensaje
echo  - Describes problemas que coinciden con su expertise
echo.
echo Ejemplos:
echo  "Tengo un bug complejo que no puedo resolver"
echo    → Invoca master-problem-solver
echo.
echo  "Necesito implementar un sistema de autenticación completo"
echo    → Invoca full-stack-architect
echo.
echo  "Revisa este código y mejora su calidad"
echo    → Invoca code-quality-guardian
echo.
echo ═══════════════════════════════════════════════════════════
echo.
pause
