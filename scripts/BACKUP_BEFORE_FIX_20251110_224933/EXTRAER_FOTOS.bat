@echo off
chcp 65001 >nul
setlocal EnableDelayedExpansion

title UNS-ClaudeJP 5.2 - Extracción de Fotos

echo ========================================================
echo   UNS-CLAUDEJP 5.2 - EXTRACCION DE FOTOS
echo   [Solo Windows - Requiere Python]
echo ========================================================
echo.

REM Cambiar al directorio raíz del proyecto
cd /d "%~dp0\.."

echo [INFO] Verificando requisitos...
echo.

REM Verificar Python
python --version >nul 2>&1
if %errorlevel% NEQ 0 (
    echo [ERROR] Python no encontrado
    echo         Instala Python desde: https://www.python.org/downloads/
    echo.
    pause
    exit /b 1
)
echo [OK] Python encontrado
echo.

REM Verificar si pywin32 está instalado
python -c "import win32com.client" >nul 2>&1
if %errorlevel% NEQ 0 (
    echo [AVISO] pywin32 no está instalado
    echo.
    set /p INSTALL_PYWIN32="Deseas instalar pywin32 ahora? (S/N): "

    if /i "!INSTALL_PYWIN32!"=="S" (
        echo.
        echo Instalando pywin32...
        python -m pip install pywin32

        if !errorlevel! EQU 0 (
            echo [OK] pywin32 instalado correctamente
            echo.
        ) else (
            echo [ERROR] No se pudo instalar pywin32
            echo         Instala manualmente: pip install pywin32
            echo.
            pause
            exit /b 1
        )
    ) else (
        echo.
        echo [INFO] No se puede continuar sin pywin32
        echo        Instala con: pip install pywin32
        echo.
        pause
        exit /b 1
    )
) else (
    echo [OK] pywin32 ya está instalado
    echo.
)

echo ========================================================
echo   EXTRAYENDO FOTOS DE ACCESS DATABASE
echo ========================================================
echo.
echo Este proceso puede tardar 15-30 minutos
echo Se generará: access_photo_mappings.json (~487 MB)
echo.
echo Presiona cualquier tecla para continuar...
pause >nul
echo.

REM Ejecutar extracción
python backend\scripts\auto_extract_photos_from_databasejp.py

if %errorlevel% EQU 0 (
    echo.
    echo ========================================================
    echo   [OK] EXTRACCION COMPLETADA
    echo ========================================================
    echo.

    if exist "access_photo_mappings.json" (
        for %%A in (access_photo_mappings.json) do (
            set SIZE=%%~zA
            set /a SIZE_MB=!SIZE! / 1024 / 1024
        )

        echo Archivo generado:
        echo   Nombre: access_photo_mappings.json
        echo   Tamaño: !SIZE_MB! MB
        echo.
        echo SIGUIENTE PASO:
        echo   Ejecuta scripts\REINSTALAR.bat para importar todo
        echo   (El archivo será copiado automáticamente al contenedor)
        echo.
    ) else (
        echo [AVISO] No se generó access_photo_mappings.json
        echo         Revisa los mensajes de error arriba
        echo.
    )
) else (
    echo.
    echo ========================================================
    echo   [ERROR] LA EXTRACCION FALLO
    echo ========================================================
    echo.
    echo Posibles causas:
    echo   1. Microsoft Access Database Engine no instalado
    echo      Descargar: https://www.microsoft.com/en-us/download/details.aspx?id=54920
    echo.
    echo   2. Archivo Access DB no encontrado
    echo      Verifica: BASEDATEJP\ユニバーサル企画㈱データベースv25.3.24_be.accdb
    echo.
    echo   3. Access DB está abierto en otra aplicación
    echo      Cierra Microsoft Access y ejecuta este script de nuevo
    echo.
)

echo.
echo Presiona cualquier tecla para salir...
pause >nul
