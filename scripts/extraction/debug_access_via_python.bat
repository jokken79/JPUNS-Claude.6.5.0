@echo off
REM Debug script to extract Access database names using local Python
REM This runs on Windows where pyodbc can access the Access database

cd /d "%~dp0.."

echo.
echo ======================================
echo Debugging Access Database Names
echo ======================================
echo.

REM Run the Python script that accesses Access directly
python backend\scripts\debug_photo_extraction.py

echo.
echo Script completed.
pause
