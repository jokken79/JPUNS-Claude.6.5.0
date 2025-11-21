@echo off
setlocal EnableDelayedExpansion

title UNS-ClaudeJP 5.2 - Bajar de GitHub

echo.
echo ========================================================
echo       UNS-CLAUDEJP 5.2 - BAJAR DE GITHUB
echo ========================================================
echo.

REM Cambiar al directorio raiz del proyecto
cd /d "%~dp0\.."

REM ========================================
REM PASO 1: Verificar Git
REM ========================================

echo [PASO 1/5] Verificando Git...
echo --------------------------------------------------------
git --version >nul 2>&1
if %errorlevel% NEQ 0 (
    echo ERROR: Git NO esta instalado
    echo.
    echo Descarga Git desde: https://git-scm.com/download/win
    echo.

    set /p DESCARGAR="Abrir pagina de descarga? (S/N): "
    if /i "%DESCARGAR%"=="S" (
        start https://git-scm.com/download/win
    )
    pause
    exit /b 1
)
echo OK - Git instalado
git --version
echo.

REM ========================================
REM PASO 2: Verificar estado del repositorio
REM ========================================

echo [PASO 2/5] Verificando repositorio local...
echo --------------------------------------------------------

if not exist ".git" (
    echo ERROR: Este directorio NO es un repositorio Git
    echo.
    echo Opciones:
    echo   1. Usa este script en una carpeta que ya tenga Git inicializado
    echo   2. O clona el repositorio desde cero con:
    echo      git clone https://github.com/usuario/repo.git
    echo.
    pause
    exit /b 1
)

echo OK - Repositorio Git encontrado
echo.

REM Verificar si hay un remoto configurado
git remote -v | findstr origin >nul 2>&1
if %errorlevel% NEQ 0 (
    echo ADVERTENCIA: No hay repositorio remoto configurado
    echo.

    set /p REPO_URL="Ingresa la URL del repositorio GitHub: "
    if "!REPO_URL!"=="" (
        echo ERROR: URL requerida
        pause
        exit /b 1
    )

    git remote add origin !REPO_URL!
    echo OK - Remoto agregado
    echo.
)

REM ========================================
REM PASO 3: Verificar cambios locales
REM ========================================

echo [PASO 3/5] Verificando cambios locales...
echo --------------------------------------------------------
echo.

git status --short
git diff-index --quiet HEAD --
if %errorlevel% NEQ 0 (
    echo.
    echo ADVERTENCIA: Tienes cambios sin commitear
    echo.
    echo Opciones:
    echo   1. Commitear cambios (recomendado)
    echo   2. Descartar cambios (PERDERAS tus modificaciones)
    echo   3. Hacer stash (guardar temporalmente)
    echo   4. Cancelar operacion
    echo.

    set /p OPCION="Elige opcion (1/2/3/4): "

    if "!OPCION!"=="1" (
        echo.
        echo Commiteando cambios...
        git add .
        set /p COMMIT_MSG="Mensaje del commit: "
        if "!COMMIT_MSG!"=="" set "COMMIT_MSG=Local changes before pull"
        git commit -m "!COMMIT_MSG!"
        echo OK - Cambios commiteados
        echo.
    ) else if "!OPCION!"=="2" (
        echo.
        echo ADVERTENCIA: Esto borrara tus cambios locales!
        set /p CONFIRMAR="Estas seguro? (S/N): "
        if /i "!CONFIRMAR!"=="S" (
            git reset --hard HEAD
            git clean -fd
            echo OK - Cambios descartados
            echo.
        ) else (
            echo Operacion cancelada
            pause
            exit /b 0
        )
    ) else if "!OPCION!"=="3" (
        echo.
        echo Guardando cambios temporalmente...
        git stash push -m "Changes before pull"
        echo OK - Cambios guardados en stash
        echo Para recuperarlos despues: git stash pop
        echo.
    ) else (
        echo Operacion cancelada
        pause
        exit /b 0
    )
) else (
    echo OK - No hay cambios locales
    echo.
)

REM ========================================
REM PASO 4: Obtener rama actual
REM ========================================

echo [PASO 4/5] Obteniendo rama actual...
echo --------------------------------------------------------

for /f "tokens=*" %%a in ('git rev-parse --abbrev-ref HEAD 2^>nul') do set CURRENT_BRANCH=%%a
if "%CURRENT_BRANCH%"=="" set "CURRENT_BRANCH=main"

echo Rama actual: %CURRENT_BRANCH%
echo.

REM ========================================
REM PASO 5: Bajar cambios de GitHub
REM ========================================

echo [PASO 5/5] Bajando cambios de GitHub...
echo --------------------------------------------------------
echo.

echo Descargando cambios desde GitHub...
git fetch origin

if %errorlevel% NEQ 0 (
    echo.
    echo ERROR al hacer fetch de GitHub
    echo.
    echo Posibles causas:
    echo   1. No hay conexion a internet
    echo   2. URL del repositorio incorrecta
    echo   3. No tienes permisos de acceso
    echo   4. Necesitas autenticarte
    echo.
    pause
    exit /b 1
)

echo OK - Cambios descargados
echo.

echo Aplicando cambios localmente...
git pull origin %CURRENT_BRANCH%

if %errorlevel% NEQ 0 (
    echo.
    echo ERROR al hacer pull
    echo.
    echo Puede haber conflictos que debes resolver manualmente.
    echo.
    echo Para ver conflictos:
    echo   git status
    echo.
    echo Para resolver:
    echo   1. Edita los archivos en conflicto
    echo   2. git add archivo-resuelto
    echo   3. git commit -m "Resolved conflicts"
    echo.
    pause
    exit /b 1
)

echo.
echo ========================================================
echo       ACTUALIZACION EXITOSA
echo ========================================================
echo.
echo Tu codigo local ha sido actualizado con los cambios de GitHub!
echo.

REM Mostrar log de ultimos cambios
echo Ultimos cambios descargados:
echo.
git log --oneline -5
echo.

REM ========================================
REM PASO EXTRA: Recordatorio sobre .env
REM ========================================

echo ========================================================
echo       IMPORTANTE - ARCHIVO .env
echo ========================================================
echo.
echo RECUERDA: El archivo .env NO se descarga de GitHub
echo (esto es por seguridad, para proteger las claves)
echo.

if not exist ".env" (
    echo ADVERTENCIA: No tienes archivo .env local
    echo.
    echo Necesitas crear uno:
    echo   1. Copia .env.example a .env
    echo   2. Rellena con tus claves reales
    echo.

    set /p CREAR_ENV="Copiar .env.example a .env ahora? (S/N): "
    if /i "!CREAR_ENV!"=="S" (
        if exist ".env.example" (
            copy .env.example .env
            echo.
            echo OK - .env creado desde .env.example
            echo.
            echo IMPORTANTE: Edita .env y agrega tus claves reales:
            echo   - POSTGRES_PASSWORD
            echo   - SECRET_KEY
            echo   - GEMINI_API_KEY
            echo   - Otras API keys necesarias
            echo.
        ) else (
            echo ERROR: .env.example no existe
        )
    )
) else (
    echo OK - Ya tienes archivo .env local
)

echo.

REM ========================================
REM PASO EXTRA: Reinstalar dependencias
REM ========================================

echo ========================================================
echo       REINSTALAR DEPENDENCIAS?
echo ========================================================
echo.
echo Si el codigo cambio, puede que necesites reinstalar:
echo   - Paquetes Python (backend)
echo   - Paquetes npm (frontend)
echo   - Rebuilds de Docker
echo.

set /p REINSTALAR="Quieres reinstalar todo con Docker? (S/N): "
if /i "%REINSTALAR%"=="S" (
    echo.
    echo Iniciando rebuild de Docker...
    echo Esto puede tardar varios minutos...
    echo.

    call scripts\STOP.bat
    timeout /t 5 /nobreak >nul
    call scripts\START.bat
) else (
    echo.
    echo Recuerda ejecutar START.bat para iniciar los servicios
)

echo.
pause
