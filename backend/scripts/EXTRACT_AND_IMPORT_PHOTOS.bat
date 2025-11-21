@echo off
REM ========================================
REM Extract Photos from Access and Import
REM ========================================
REM
REM This script automates the two-step process:
REM 1. Extract photos from Access Attachment fields (Windows COM)
REM 2. Import candidates with photos to PostgreSQL
REM
REM Author: Claude Code
REM Date: 2025-10-24
REM ========================================

echo.
echo ========================================
echo Access Photo Extraction and Import
echo ========================================
echo.

REM Check if pywin32 is installed
python -c "import win32com.client" 2>nul
if %errorlevel% neq 0 (
    echo ERROR: pywin32 is not installed!
    echo.
    echo Installing pywin32...
    pip install pywin32
    if %errorlevel% neq 0 (
        echo ERROR: Failed to install pywin32
        echo Please install manually: pip install pywin32
        pause
        exit /b 1
    )
)

REM Navigate to scripts directory
cd /d "%~dp0"

echo.
echo ========================================
echo Step 1: Extract Photos from Access
echo ========================================
echo.
echo This will use COM automation to extract photos
echo from the Access database's Attachment field.
echo.
echo Please close Microsoft Access if it's running.
echo.
pause

REM Run extraction (sample mode first)
echo.
echo Running sample extraction (5 records)...
python extract_access_attachments.py --sample

if %errorlevel% neq 0 (
    echo.
    echo ERROR: Sample extraction failed!
    echo Check the log file for details.
    pause
    exit /b 1
)

echo.
echo Sample extraction successful!
echo.
echo Do you want to extract ALL photos? (Y/N)
set /p EXTRACT_ALL="Choice: "

if /i "%EXTRACT_ALL%"=="Y" (
    echo.
    echo Extracting ALL photos...
    python extract_access_attachments.py --full

    if %errorlevel% neq 0 (
        echo.
        echo ERROR: Full extraction failed!
        echo Check the log file for details.
        pause
        exit /b 1
    )
) else (
    echo.
    echo Skipping full extraction.
    echo Using sample data only.
)

REM Check if mappings file was created
if not exist "access_photo_mappings.json" (
    echo.
    echo ERROR: Photo mappings file not found!
    echo Extraction may have failed.
    pause
    exit /b 1
)

echo.
echo ========================================
echo Step 2: Import Candidates with Photos
echo ========================================
echo.
echo This will import candidates to PostgreSQL
echo using the extracted photo mappings.
echo.
pause

REM Run import (sample mode first)
echo.
echo Running sample import (5 records)...
python import_access_candidates.py --sample --photos access_photo_mappings.json

if %errorlevel% neq 0 (
    echo.
    echo ERROR: Sample import failed!
    echo Check the log file for details.
    pause
    exit /b 1
)

echo.
echo Sample import successful!
echo.
echo Do you want to import ALL candidates? (Y/N)
set /p IMPORT_ALL="Choice: "

if /i "%IMPORT_ALL%"=="Y" (
    echo.
    echo Importing ALL candidates...
    python import_access_candidates.py --full --photos access_photo_mappings.json

    if %errorlevel% neq 0 (
        echo.
        echo ERROR: Full import failed!
        echo Check the log file for details.
        pause
        exit /b 1
    )
) else (
    echo.
    echo Skipping full import.
)

echo.
echo ========================================
echo Process Complete!
echo ========================================
echo.
echo Check the following files for details:
echo - extract_attachments_*.log
echo - import_candidates_*.log
echo - import_candidates_report.json
echo - access_photo_mappings.json
echo.
pause
