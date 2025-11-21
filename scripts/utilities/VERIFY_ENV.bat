@echo off
chcp 65001 >nul
setlocal EnableDelayedExpansion

REM ============================================================================
REM  UNS-ClaudeJP - Verificar y Crear archivo .env
REM  Este script asegura que el archivo .env existe y está configurado
REM ============================================================================

echo.
echo ╔════════════════════════════════════════════════════════════════════════╗
echo ║              Verificación de Archivo .env - UNS-ClaudeJP              ║
echo ╚════════════════════════════════════════════════════════════════════════╝
echo.

REM Cambiar al directorio raíz del proyecto
cd /d "%~dp0.."

echo 🔍 Verificando archivo .env...
echo.

if exist ".env" (
    echo ✅ Archivo .env encontrado
    echo.
    echo 📄 Contenido actual (primeras 15 líneas):
    echo ─────────────────────────────────────────────
    type .env | more /e +0
    echo ─────────────────────────────────────────────
    echo.

    set /p RECREATE="¿Deseas recrear el archivo .env? (S/N): "
    if /i "!RECREATE!"=="S" (
        echo.
        echo 🔄 Recreando archivo .env...
        del .env
        goto CREATE_ENV
    ) else (
        echo.
        echo ✅ Manteniendo archivo .env existente
        goto END
    )
) else (
    echo ⚠️  Archivo .env NO encontrado
    echo.
    goto CREATE_ENV
)

:CREATE_ENV
echo 📝 Creando archivo .env...
echo.

REM Intentar con Python primero
python generate_env.py >nul 2>&1
if !errorlevel! equ 0 (
    echo ✅ Archivo .env creado con generate_env.py
    echo.
    echo 📄 Variables de entorno configuradas:
    echo    • POSTGRES_USER
    echo    • POSTGRES_PASSWORD
    echo    • POSTGRES_DB
    echo    • SECRET_KEY
    echo    • DATABASE_URL
    echo    • NEXT_PUBLIC_API_URL
    echo    • Y más...
    goto SHOW_ENV
)

REM Si Python falla, copiar desde .env.example
if exist ".env.example" (
    copy .env.example .env >nul
    echo ✅ Archivo .env creado desde .env.example
    goto SHOW_ENV
)

REM Si todo falla, crear manualmente con valores por defecto
echo 📝 Creando .env con valores por defecto...
(
    echo # ============================================================================
    echo # UNS-ClaudeJP 5.0 - Environment Variables
    echo # ============================================================================
    echo.
    echo # Database Configuration
    echo POSTGRES_USER=uns_admin
    echo POSTGRES_PASSWORD=57UD10R
    echo POSTGRES_DB=uns_claudejp
    echo.
    echo # Backend Configuration
    echo SECRET_KEY=uns-claudejp-secret-key-change-in-production
    echo DATABASE_URL=postgresql://uns_admin:57UD10R@db:5432/uns_claudejp
    echo.
    echo # Frontend Configuration
    echo NEXT_PUBLIC_API_URL=http://localhost:8000
    echo.
    echo # OCR Services (Opcional - déjalo vacío si no lo usas^)
    echo AZURE_COMPUTER_VISION_ENDPOINT=
    echo AZURE_COMPUTER_VISION_KEY=
    echo GOOGLE_CLOUD_VISION_API_KEY=
    echo.
    echo # AI Services (Opcional^)
    echo GEMINI_API_KEY=
    echo.
    echo # Email Configuration (Opcional^)
    echo SMTP_HOST=
    echo SMTP_PORT=587
    echo SMTP_USER=
    echo SMTP_PASSWORD=
    echo.
    echo # LINE Notifications (Opcional^)
    echo LINE_CHANNEL_ACCESS_TOKEN=
    echo.
    echo # Application Settings
    echo DEBUG=True
    echo LOG_LEVEL=INFO
) > .env

echo ✅ Archivo .env creado con valores por defecto

:SHOW_ENV
echo.
echo 📄 Contenido del archivo .env:
echo ════════════════════════════════════════════════════════════════════════
type .env
echo ════════════════════════════════════════════════════════════════════════
echo.

:END
echo.
echo ╔════════════════════════════════════════════════════════════════════════╗
echo ║                        ✅ VERIFICACIÓN COMPLETADA                      ║
echo ╚════════════════════════════════════════════════════════════════════════╝
echo.
echo 💡 Notas Importantes:
echo    • El archivo .env contiene credenciales sensibles
echo    • NO subas el archivo .env a Git (ya está en .gitignore^)
echo    • Puedes editar .env manualmente según tus necesidades
echo    • Para producción, cambia SECRET_KEY y POSTGRES_PASSWORD
echo.
echo 📝 Para editar el archivo .env:
echo    notepad .env
echo.
echo 🚀 Para iniciar la aplicación:
echo    docker compose up -d
echo.
echo    O usa el script de actualización:
echo    scripts\UPGRADE_TO_5.0.bat
echo.

pause
