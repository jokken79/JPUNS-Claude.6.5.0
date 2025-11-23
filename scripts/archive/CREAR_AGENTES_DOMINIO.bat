@echo off
chcp 65001 >nul
cls
echo ═══════════════════════════════════════════════════════════
echo  🎯 CREAR AGENTES ESPECIALIZADOS DE DOMINIO
echo ═══════════════════════════════════════════════════════════
echo.
echo Este script crea 6 agentes expertos en tu app de RRHH:
echo.
echo  1. 🏖️  yukyu-specialist (有給休暇)
echo  2. 👥 employee-lifecycle-specialist (社員管理)
echo  3. 💰 payroll-specialist (給与計算)
echo  4. 🏢 apartment-specialist (寮管理)
echo  5. 📋 candidate-specialist (候補者・OCR)
echo  6. 🏭 factory-assignment-specialist (派遣先配属)
echo.
echo ═══════════════════════════════════════════════════════════
echo.
pause
echo.

echo [Paso 1/2] Creando archivos de agentes de dominio...
echo.
node create_all_domain_agents.js
echo.

if %ERRORLEVEL% NEQ 0 (
    echo ❌ Error al crear agentes
    pause
    exit /b 1
)

echo.
echo [Paso 2/2] Registrando agentes en agents.json...
echo.
node register_all_domain_agents.js
echo.

if %ERRORLEVEL% NEQ 0 (
    echo ❌ Error al registrar agentes
    pause
    exit /b 1
)

echo.
echo ═══════════════════════════════════════════════════════════
echo  ✅ AGENTES DE DOMINIO CREADOS
echo ═══════════════════════════════════════════════════════════
echo.
echo 🏖️  yukyu-specialist - Vacaciones pagadas (有給休暇)
echo 👥 employee-lifecycle-specialist - Ciclo de empleados
echo 💰 payroll-specialist - Cálculo de nómina (給与)
echo 🏢 apartment-specialist - Gestión de apartamentos (寮)
echo 📋 candidate-specialist - OCR de rirekisho (履歴書)
echo 🏭 factory-assignment-specialist - Asignaciones (派遣先)
echo.
echo ═══════════════════════════════════════════════════════════
echo  📚 CÓMO USAR
echo ═══════════════════════════════════════════════════════════
echo.
echo Los agentes se invocan automáticamente cuando mencionas:
echo  - Palabras clave en japonés: 有給, 入社, 給与, etc.
echo  - Módulos específicos: yukyu, payroll, employee
echo  - Problemas del dominio
echo.
echo Ejemplo:
echo  "El cálculo de yukyu no está siguiendo la ley laboral japonesa"
echo    → Invoca yukyu-specialist automáticamente
echo.
echo ═══════════════════════════════════════════════════════════
echo.
pause
