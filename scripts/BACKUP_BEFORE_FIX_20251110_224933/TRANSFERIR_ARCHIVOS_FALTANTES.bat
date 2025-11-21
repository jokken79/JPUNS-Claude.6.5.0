@echo off
REM ===============================================
REM Script para transferir archivos faltantes de v5.2 a v5.4.1
REM Fecha: 10 de noviembre de 2025
REM ===============================================

echo ========================================
echo TRANSFERENCIA DE ARCHIVOS FALTANTES
echo v5.2 -^> v5.4.1
echo ========================================
echo.

SET "SOURCE=D:\UNS-ClaudeJP-5.2\JPUNS-CLAUDE5.2\UNS-ClaudeJP-5.2"
SET "DEST=d:\UNS-ClaudeJP-5.4.1"

echo VERIFICANDO RUTAS...
if not exist "%SOURCE%" (
    echo ERROR: No se encuentra la carpeta origen: %SOURCE%
    pause
    exit /b 1
)

if not exist "%DEST%" (
    echo ERROR: No se encuentra la carpeta destino: %DEST%
    pause
    exit /b 1
)

echo OK - Rutas verificadas
echo.

REM ===============================================
REM PRIORIDAD CRITICA 1: Archivos .github/
REM ===============================================
echo ========================================
echo [1/3] COPIANDO ARCHIVOS .github/
echo ========================================
echo.

echo Creando carpeta .github\prompts...
if not exist "%DEST%\.github" mkdir "%DEST%\.github"
if not exist "%DEST%\.github\prompts" mkdir "%DEST%\.github\prompts"

echo Copiando copilot-instructions.md...
if exist "%SOURCE%\.github\copilot-instructions.md" (
    copy "%SOURCE%\.github\copilot-instructions.md" "%DEST%\.github\" /Y
    echo   [OK] copilot-instructions.md copiado
) else (
    echo   [WARN] No se encontro copilot-instructions.md
)

echo Copiando prompts...
if exist "%SOURCE%\.github\prompts" (
    xcopy "%SOURCE%\.github\prompts\*.md" "%DEST%\.github\prompts\" /Y /I
    echo   [OK] Prompts copiados
) else (
    echo   [WARN] No se encontro carpeta prompts
)

echo.
pause

REM ===============================================
REM PRIORIDAD CRITICA 2: Actualizar .claude/
REM ===============================================
echo ========================================
echo [2/3] ACTUALIZANDO ARCHIVOS .claude/
echo ========================================
echo.
echo ADVERTENCIA: Esto sobrescribira los archivos existentes en .claude/
echo con las versiones mas recientes de v5.2 (8 de noviembre)
echo.
echo Presiona cualquier tecla para continuar o Ctrl+C para cancelar...
pause > nul

echo Copiando archivos .claude/...
xcopy "%SOURCE%\.claude\*" "%DEST%\.claude\" /E /Y /I
echo   [OK] Archivos .claude/ actualizados

echo.
pause

REM ===============================================
REM PRIORIDAD ALTA 3: Verificar openspec/
REM ===============================================
echo ========================================
echo [3/3] VERIFICANDO openspec/
echo ========================================
echo.

if exist "%SOURCE%\openspec" (
    echo Se encontro carpeta openspec/ en v5.2
    echo Contenido:
    dir "%SOURCE%\openspec" /B
    echo.
    echo Deseas copiar la carpeta openspec/? (S/N)
    set /p COPIAR_OPENSPEC=
    
    if /i "%COPIAR_OPENSPEC%"=="S" (
        echo Copiando openspec/...
        xcopy "%SOURCE%\openspec\*" "%DEST%\openspec\" /E /Y /I
        echo   [OK] openspec/ copiado
    ) else (
        echo   [SKIP] openspec/ omitido
    )
) else (
    echo   [INFO] No se encontro carpeta openspec/ en v5.2
)

echo.

REM ===============================================
REM RESUMEN
REM ===============================================
echo ========================================
echo TRANSFERENCIA COMPLETADA
echo ========================================
echo.
echo Archivos transferidos:
echo   - .github/copilot-instructions.md
echo   - .github/prompts/*.md (12 archivos)
echo   - .claude/* (132+ archivos actualizados)
echo   - openspec/* (si fue seleccionado)
echo.
echo SIGUIENTE PASO:
echo   - Revisar REPORTE_COMPARACION_V5.2_V5.4.1.md
echo   - Verificar si access_photo_mappings.json es necesario
echo   - Considerar carpeta LIXO/ si se necesita historial
echo.
echo Presiona cualquier tecla para salir...
pause > nul

pause >nul
