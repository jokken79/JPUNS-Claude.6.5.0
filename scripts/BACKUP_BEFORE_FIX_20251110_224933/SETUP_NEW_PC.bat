@echo off
chcp 65001 >nul
REM ====================================================================
REM SETUP_NEW_PC.bat - Configuración automatizada para PC nueva
REM UNS-ClaudeJP 5.2
REM ====================================================================

echo.
echo ========================================================================
echo   🚀 UNS-ClaudeJP 5.2 - Setup Automatizado para PC Nueva
echo ========================================================================
echo.

REM ====================================================================
REM 1. VERIFICAR REQUISITOS DEL SISTEMA
REM ====================================================================

echo [1/8] Verificando requisitos del sistema...
echo.

REM Verificar Docker
docker --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ ERROR: Docker no está instalado o no está en PATH
    echo.
    echo 📥 Instalar Docker Desktop desde:
    echo    https://www.docker.com/products/docker-desktop
    echo.
    pause
    exit /b 1
)
echo ✅ Docker instalado:
docker --version

REM Verificar que Docker está corriendo
docker ps >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ ERROR: Docker Desktop no está corriendo
    echo.
    echo 🔄 Por favor:
    echo    1. Abrir Docker Desktop
    echo    2. Esperar que inicie completamente
    echo    3. Ejecutar este script de nuevo
    echo.
    pause
    exit /b 1
)
echo ✅ Docker Desktop corriendo

REM Verificar Node.js
node --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ ERROR: Node.js no está instalado o no está en PATH
    echo.
    echo 📥 Instalar Node.js 18+ desde:
    echo    https://nodejs.org/
    echo.
    pause
    exit /b 1
)
echo ✅ Node.js instalado:
node --version

REM Verificar npm
npm --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ ERROR: npm no está disponible
    pause
    exit /b 1
)
echo ✅ npm instalado:
npm --version

REM Verificar Python (opcional, para scripts locales)
python --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ⚠️  ADVERTENCIA: Python no está instalado (opcional)
    echo    Necesario solo para scripts locales (extracción de fotos)
) else (
    echo ✅ Python instalado:
    python --version
)

echo.
echo ========================================================================
pause

REM ====================================================================
REM 2. VERIFICAR ARCHIVO .env
REM ====================================================================

echo.
echo [2/8] Verificando archivo .env...
echo.

if exist ".env" (
    echo ✅ Archivo .env ya existe
    echo.
    choice /C SN /M "¿Quieres regenerar .env desde .env.example? (S=Sí, N=No)"
    if errorlevel 2 goto skip_env_creation
    if errorlevel 1 goto create_env
) else (
    echo ❌ Archivo .env NO existe
    goto create_env
)

:create_env
echo.
echo 📝 Creando .env desde .env.example...

if not exist ".env.example" (
    echo ❌ ERROR: .env.example no existe
    echo    Este archivo debería estar en el repositorio
    pause
    exit /b 1
)

copy /Y .env.example .env >nul
echo ✅ .env creado

echo.
echo ⚠️  IMPORTANTE: Debes configurar las siguientes variables en .env:
echo.
echo    1. SECRET_KEY       - Clave secreta para JWT
echo    2. POSTGRES_PASSWORD - Contraseña de PostgreSQL
echo    3. GEMINI_API_KEY   - API key de Gemini (opcional)
echo    4. AZURE_*          - Credenciales Azure OCR (opcional)
echo.

REM Generar SECRET_KEY automáticamente
echo 🔐 Generando SECRET_KEY automáticamente...
python -c "import secrets; print(secrets.token_hex(32))" > temp_secret.txt 2>nul
if %errorlevel% equ 0 (
    set /p SECRET_KEY=<temp_secret.txt
    del temp_secret.txt
    echo ✅ SECRET_KEY generado: %SECRET_KEY:~0,20%...
    echo.
    echo 💾 Agregar a .env manualmente:
    echo    SECRET_KEY=%SECRET_KEY%
) else (
    echo ⚠️  No se pudo generar SECRET_KEY automáticamente
    echo    Genera uno manualmente con:
    echo    python -c "import secrets; print(secrets.token_hex(32))"
)

echo.
echo 📝 Abre .env en un editor y configura las variables necesarias
echo.
pause

:skip_env_creation

REM ====================================================================
REM 3. VERIFICAR ARCHIVO DE FOTOS (OPCIONAL)
REM ====================================================================

echo.
echo [3/8] Verificando archivo de fotos...
echo.

if exist "access_photo_mappings.json" (
    echo ✅ access_photo_mappings.json encontrado
    for %%A in (access_photo_mappings.json) do (
        echo    Tamaño: %%~zA bytes
    )
) else (
    echo ⚠️  access_photo_mappings.json NO encontrado
    echo.
    echo    El sistema funcionará sin fotos de candidatos
    echo.
    echo    Para obtener fotos:
    echo    1. Descargar de Google Drive/Dropbox compartido
    echo    2. O extraer desde Access DB con:
    echo       python backend\scripts\unified_photo_import.py extract
    echo.
    echo    Ver REQUIRED_FILES.md para más detalles
    echo.
)

pause

REM ====================================================================
REM 4. INSTALAR DEPENDENCIAS FRONTEND
REM ====================================================================

echo.
echo [4/8] Instalando dependencias de frontend...
echo.

cd frontend

if not exist "package.json" (
    echo ❌ ERROR: frontend/package.json no existe
    cd ..
    pause
    exit /b 1
)

echo 📦 Ejecutando npm install...
echo    (Esto puede tardar 2-5 minutos)
echo.

npm install --legacy-peer-deps
if %errorlevel% neq 0 (
    echo ❌ ERROR: npm install falló
    cd ..
    pause
    exit /b 1
)

echo ✅ Dependencias de frontend instaladas
cd ..

pause

REM ====================================================================
REM 5. VERIFICAR PUERTOS DISPONIBLES
REM ====================================================================

echo.
echo [5/8] Verificando puertos disponibles...
echo.

set PORT_ERROR=0

REM Verificar puerto 3000 (frontend)
netstat -ano | findstr ":3000" >nul 2>&1
if %errorlevel% equ 0 (
    echo ⚠️  Puerto 3000 en uso (Frontend)
    set PORT_ERROR=1
) else (
    echo ✅ Puerto 3000 disponible (Frontend)
)

REM Verificar puerto 8000 (backend)
netstat -ano | findstr ":8000" >nul 2>&1
if %errorlevel% equ 0 (
    echo ⚠️  Puerto 8000 en uso (Backend)
    set PORT_ERROR=1
) else (
    echo ✅ Puerto 8000 disponible (Backend)
)

REM Verificar puerto 5432 (PostgreSQL)
netstat -ano | findstr ":5432" >nul 2>&1
if %errorlevel% equ 0 (
    echo ⚠️  Puerto 5432 en uso (PostgreSQL)
    set PORT_ERROR=1
) else (
    echo ✅ Puerto 5432 disponible (PostgreSQL)
)

REM Verificar puerto 8080 (Adminer)
netstat -ano | findstr ":8080" >nul 2>&1
if %errorlevel% equ 0 (
    echo ⚠️  Puerto 8080 en uso (Adminer)
    set PORT_ERROR=1
) else (
    echo ✅ Puerto 8080 disponible (Adminer)
)

if %PORT_ERROR% equ 1 (
    echo.
    echo ⚠️  Algunos puertos están en uso
    echo    Opciones:
    echo    1. Detener las aplicaciones que usan esos puertos
    echo    2. O continuar y Docker intentará usar los puertos de todas formas
    echo.
    choice /C CN /M "¿Continuar de todas formas? (C=Continuar, N=Cancelar)"
    if errorlevel 2 exit /b 1
)

pause

REM ====================================================================
REM 6. INICIAR SERVICIOS DOCKER
REM ====================================================================

echo.
echo [6/8] Iniciando servicios Docker...
echo.

echo 🐳 Ejecutando docker-compose up -d...
echo    (Primera vez puede tardar 5-10 minutos)
echo.

docker-compose up -d
if %errorlevel% neq 0 (
    echo ❌ ERROR: Docker Compose falló
    echo.
    echo    Posibles causas:
    echo    1. .env no configurado correctamente
    echo    2. Puertos en uso
    echo    3. Docker Desktop sin recursos suficientes
    echo.
    echo    Ver logs con: docker-compose logs
    pause
    exit /b 1
)

echo ✅ Servicios iniciados

pause

REM ====================================================================
REM 7. ESPERAR QUE SERVICIOS ESTÉN LISTOS
REM ====================================================================

echo.
echo [7/8] Esperando que servicios estén listos...
echo.

echo ⏳ Esperando 30 segundos para que servicios inicien...
timeout /t 30 /nobreak >nul

echo.
echo 📊 Estado de contenedores:
docker ps --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}"

echo.
echo 🔍 Verificando backend...
curl -s http://localhost:8000/api/health >nul 2>&1
if %errorlevel% equ 0 (
    echo ✅ Backend respondiendo en http://localhost:8000
) else (
    echo ⚠️  Backend aún no responde (puede tardar 1-2 minutos más)
)

echo.
pause

REM ====================================================================
REM 8. RESUMEN Y PRÓXIMOS PASOS
REM ====================================================================

echo.
echo ========================================================================
echo   ✅ SETUP COMPLETADO
echo ========================================================================
echo.

echo 🌐 URLs del sistema:
echo    Frontend:    http://localhost:3000
echo    Backend API: http://localhost:8000
echo    API Docs:    http://localhost:8000/api/docs
echo    Adminer:     http://localhost:8080
echo.

echo 🔑 Credenciales por defecto:
echo    Usuario: admin
echo    Contraseña: admin123
echo.

echo 📋 Próximos pasos:
echo.
echo    1. Abrir navegador en http://localhost:3000
echo    2. Login con admin / admin123
echo    3. Verificar que todo funciona
echo.

if not exist "access_photo_mappings.json" (
    echo ⚠️  Recordatorio: Sin access_photo_mappings.json
    echo    - El sistema funciona pero sin fotos
    echo    - Ver REQUIRED_FILES.md para obtenerlo
    echo.
)

echo 🔧 Comandos útiles:
echo    Ver logs:     scripts\LOGS.bat
echo    Detener:      scripts\STOP.bat
echo    Reiniciar:    scripts\REINSTALAR.bat
echo.

echo 📚 Documentación:
echo    REQUIRED_FILES.md   - Archivos necesarios
echo    DEPLOYMENT.md       - Guía completa de deployment
echo    README.md           - Documentación general
echo.

echo ========================================================================
echo.

pause

echo.
echo ¿Quieres abrir el navegador en http://localhost:3000?
choice /C SN /M "(S=Sí, N=No)"
if errorlevel 2 goto end
if errorlevel 1 start http://localhost:3000

:end
echo.
echo ✅ Setup completado exitosamente
echo.

pause >nul
