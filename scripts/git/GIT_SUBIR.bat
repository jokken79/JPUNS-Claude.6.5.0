@echo off
setlocal EnableDelayedExpansion

title UNS-ClaudeJP 5.2 - Subir a GitHub

echo.
echo ========================================================
echo       UNS-CLAUDEJP 5.2 - SUBIR A GITHUB
echo ========================================================
echo.

REM Cambiar al directorio raiz del proyecto
cd /d "%~dp0\.."

REM ========================================
REM PASO 1: Verificaciones de Seguridad
REM ========================================

echo [PASO 1/7] Verificaciones de seguridad...
echo --------------------------------------------------------
echo.

REM Verificar que .gitignore existe
if not exist ".gitignore" (
    echo ERROR: Archivo .gitignore NO EXISTE
    echo.
    echo Este archivo es CRITICO para proteger tus claves.
    echo No puedo continuar sin el.
    echo.
    pause
)
echo OK - .gitignore encontrado
echo.

REM Advertencia sobre claves sensibles
echo IMPORTANTE: Antes de continuar, asegurate de:
echo.
echo   1. Haber revocado la Gemini API Key antigua
echo   2. Haber generado una nueva clave
echo   3. NO compartir el archivo .env con nadie
echo.

set /p CONFIRMAR="Has revocado la Gemini API Key antigua? (S/N): "
if /i NOT "%CONFIRMAR%"=="S" (
    echo.
    echo ========================================================
    echo   DETENIDO - Revoca la clave primero
    echo ========================================================
    echo.
    echo Por favor:
    echo   1. Ve a: https://aistudio.google.com/app/apikey
    echo   2. Elimina la clave antigua
    echo   3. Genera una nueva
    echo   4. Actualiza genkit-service/.env
    echo   5. Vuelve a ejecutar este script
    echo.
    pause
)
echo.

REM ========================================
REM PASO 2: Verificar Git
REM ========================================

echo [PASO 2/7] Verificando Git...
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
)
echo OK - Git instalado
git --version
echo.

REM ========================================
REM PASO 3: Inicializar repositorio
REM ========================================

echo [PASO 3/7] Inicializando repositorio Git...
echo --------------------------------------------------------
if not exist ".git" (
    echo Inicializando nuevo repositorio...
    git init
    if %errorlevel% NEQ 0 (
        echo ERROR al inicializar Git
        pause
    )
    echo OK - Repositorio inicializado
) else (
    echo OK - Repositorio ya existe
)
echo.

REM ========================================
REM PASO 4: Verificar archivos a subir
REM ========================================

echo [PASO 4/7] Verificando archivos a subir...
echo --------------------------------------------------------
echo.
echo Verificando que archivos .env estan protegidos...
git check-ignore .env 2>nul
if %errorlevel% EQU 0 (
    echo OK - .env esta protegido
) else (
    echo ADVERTENCIA: .env puede NO estar protegido
)
echo.

echo Estado del repositorio:
echo.
git status
echo.

set /p REVISAR="Los archivos se ven correctos? (S/N): "
if /i NOT "%REVISAR%"=="S" (
    echo.
    echo Operacion cancelada por el usuario.
    echo.
    pause
)
echo.

REM ========================================
REM PASO 5: Configurar usuario de Git
REM ========================================

echo [PASO 5/7] Configurando usuario de Git...
echo --------------------------------------------------------

git config user.name >nul 2>&1
if %errorlevel% NEQ 0 (
    echo Configurando nombre de usuario...
    set /p GIT_NAME="Ingresa tu nombre: "
    git config user.name "!GIT_NAME!"
)

git config user.email >nul 2>&1
if %errorlevel% NEQ 0 (
    echo Configurando email...
    set /p GIT_EMAIL="Ingresa tu email: "
    git config user.email "!GIT_EMAIL!"
)

echo OK - Usuario configurado
echo.

REM ========================================
REM PASO 6: Crear commit
REM ========================================

echo [PASO 6/7] Creando commit...
echo --------------------------------------------------------
echo.

git add .
if %errorlevel% NEQ 0 (
    echo ERROR al agregar archivos
    pause
)
echo OK - Archivos agregados
echo.

git diff --cached --quiet
if %errorlevel% EQU 0 (
    echo No hay cambios para commitear.
    echo.
    set /p FORZAR="Forzar push? (S/N): "
    if /i NOT "%FORZAR%"=="S" (
        pause
    )
) else (
    set /p COMMIT_MSG="Mensaje del commit (Enter = default): "
    if "!COMMIT_MSG!"=="" (
        set "COMMIT_MSG=Update UNS-ClaudeJP 4.0"
    )

    git commit -m "!COMMIT_MSG!"
    if %errorlevel% NEQ 0 (
        echo ERROR al crear commit
        pause
    )
    echo OK - Commit creado
    echo.
)

REM ========================================
REM PASO 7: Subir a GitHub
REM ========================================

echo [PASO 7/7] Subiendo a GitHub...
echo --------------------------------------------------------
echo.

git remote -v | findstr origin >nul 2>&1
if %errorlevel% NEQ 0 (
    echo No hay repositorio remoto configurado.
    echo.
    echo Crea un repositorio en GitHub:
    echo   1. Ve a: https://github.com/new
    echo   2. Marca como PRIVADO
    echo   3. NO inicialices con README
    echo.

    set /p CREAR="Abrir GitHub para crear repo? (S/N): "
    if /i "%CREAR%"=="S" (
        start https://github.com/new
        echo.
        pause
    )
    echo.

    set /p REPO_URL="URL del repositorio: "
    if "!REPO_URL!"=="" (
        echo ERROR: URL requerida
        pause
    )

    git remote add origin !REPO_URL!
    echo OK - Remoto agregado
    echo.
)

git branch -m master main 2>nul

echo Subiendo a GitHub...
echo.

git push -u origin main
if %errorlevel% NEQ 0 (
    echo.
    echo ERROR al hacer push
    echo.
    echo Puede que necesites autenticarte con GitHub
    echo.
    pause
)

echo.
echo ========================================================
echo       SUBIDA EXITOSA
echo ========================================================
echo.
echo IMPORTANTE:
echo   1. Verifica que .env NO se subio
echo   2. Confirma que el repo es PRIVADO
echo.

set /p ABRIR="Abrir repositorio en navegador? (S/N): "
if /i "%ABRIR%"=="S" (
    for /f "tokens=*" %%a in ('git remote get-url origin') do set REPO_URL=%%a
    set "WEB_URL=!REPO_URL:.git=!"
    start !WEB_URL!
)

echo.
pause
