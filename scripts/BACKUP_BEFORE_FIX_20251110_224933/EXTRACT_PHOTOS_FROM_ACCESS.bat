@echo off
REM ============================================================
REM EXTRACT PHOTOS FROM ACCESS DATABASE
REM ============================================================
REM
REM This script extracts photos from the Access database Attachment field
REM Requirements:
REM   - Microsoft Access (or Access Database Engine) installed
REM   - pywin32 installed: pip install pywin32
REM
REM This MUST run on Windows (not in Docker)
REM
REM ============================================================

echo.
echo ============================================================
echo EXTRACTING PHOTOS FROM ACCESS DATABASE
echo ============================================================
echo.

REM Check if pywin32 is installed
python -c "import win32com.client" 2>nul
if errorlevel 1 (
    echo ERROR: pywin32 is not installed!
    echo.
    echo To install pywin32, run:
    echo   pip install pywin32
    echo.
    pause
    exit /b 1
)

cd /d "%~dp0.."

echo.
echo OPTION 1: Test with first 5 records (RECOMMENDED first time)
echo   Command: python backend\scripts\extract_access_attachments.py --sample
echo.
echo OPTION 2: Extract ALL photos
echo   Command: python backend\scripts\extract_access_attachments.py --full
echo.
echo OPTION 3: Extract first 100 photos
echo   Command: python backend\scripts\extract_access_attachments.py --limit 100
echo.

set /p choice="Enter option (1/2/3) or q to quit: "

if /i "%choice%"=="q" (
    exit /b 0
)

if /i "%choice%"=="1" (
    echo.
    echo Running SAMPLE extraction (first 5 photos)...
    echo.
    python backend\scripts\extract_access_attachments.py --sample
    goto success
)

if /i "%choice%"=="2" (
    echo.
    echo Running FULL extraction (all photos)...
    echo.
    echo NOTE: This may take several minutes depending on number of photos
    echo.
    python backend\scripts\extract_access_attachments.py --full
    goto success
)

if /i "%choice%"=="3" (
    echo.
    echo Running LIMITED extraction (first 100 photos)...
    echo.
    python backend\scripts\extract_access_attachments.py --limit 100
    goto success
)

echo Invalid choice
goto :eof

:success
echo.
echo ============================================================
echo Extraction completed!
echo ============================================================
echo.
echo Next step: Run IMPORT_PHOTOS_TO_DATABASE.bat to link photos to candidates
echo.
pause
