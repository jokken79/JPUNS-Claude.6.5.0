@echo off
chcp 65001 >nul
setlocal EnableDelayedExpansion

color 0A
title UNS-ClaudeJP 5.2 - TEST ENDPOINTS

cls
echo.
echo                    ████████╗███████╗███████╗████████╗
echo                    ╚══██╔══╝██╔════╝██╔════╝╚══██╔══╝
echo                       ██║   █████╗  ███████╗   ██║
echo                       ██║   ██╔══╝  ╚════██║   ██║
echo                       ██║   ███████╗███████║   ██║
echo                       ╚═╝   ╚══════╝╚══════╝   ╚═╝
echo.
echo            UNS-ClaudeJP 5.2 - TESTEAR API ENDPOINTS
echo                  🧪 VERIFICACIÓN DE APIs 🧪
echo.
timeout /t 2 /nobreak >nul

echo ╔════════════════════════════════════════════════════════════╗
echo ║          🔍 VERIFICANDO DISPONIBILIDAD DE SERVICIOS 🔍   ║
echo ╚════════════════════════════════════════════════════════════╝
echo.

echo [1/7] 🌐 BACKEND API
echo   ⏳ Conectando a http://localhost:8000...
timeout /t 1 /nobreak >nul
curl -s http://localhost:8000/api/health >nul 2>&1
if !errorlevel! EQU 0 (
    echo   ✅ Backend respondiendo
    for /L %%i in (1,1,10) do (
        <nul set /p ="█">nul
        timeout /t 0.05 /nobreak >nul
    )
    echo. [100%%]
) else (
    echo   ❌ Backend NO responde
    echo   💡 Intenta: START_FUN.bat
    for /L %%i in (1,1,5) do (
        <nul set /p ="░">nul
        timeout /t 0.05 /nobreak >nul
    )
    echo. [0%%]
)
echo.

echo [2/7] 📊 HEALTH CHECK
echo   ⏳ GET /api/health...
for /L %%i in (1,1,8) do (
    <nul set /p ="█">nul
    timeout /t 0.1 /nobreak >nul
)
echo. [PROBANDO]
curl -s http://localhost:8000/api/health | findstr "healthy" >nul 2>&1
if !errorlevel! EQU 0 (
    echo   ✅ Health check: SALUDABLE
) else (
    echo   ⚠️  Health check: Verificar logs
)
echo.

echo [3/7] 👥 AUTENTICACIÓN
echo   ⏳ POST /api/auth/login...
curl -s -X POST http://localhost:8000/api/auth/login -H "Content-Type: application/json" -d "{\"username\":\"admin\",\"password\":\"admin123\"}" | findstr "access_token" >nul 2>&1
if !errorlevel! EQU 0 (
    echo   ✅ Login: FUNCIONANDO
) else (
    echo   ❌ Login: FALLO
)
echo.

echo [4/7] 📋 CANDIDATOS
echo   ⏳ GET /api/candidates...
curl -s http://localhost:8000/api/candidates -H "Authorization: Bearer dummy" >nul 2>&1
if !errorlevel! EQU 0 (
    echo   ✅ Endpoint /candidates: ACCESIBLE
) else (
    echo   ⚠️  Endpoint /candidates: Requiere autenticación válida
)
echo.

echo [5/7] 👨‍💼 EMPLEADOS
echo   ⏳ GET /api/employees...
curl -s http://localhost:8000/api/employees -H "Authorization: Bearer dummy" >nul 2>&1
if !errorlevel! EQU 0 (
    echo   ✅ Endpoint /employees: ACCESIBLE
) else (
    echo   ⚠️  Endpoint /employees: Requiere autenticación válida
)
echo.

echo [6/7] 🏭 FÁBRICAS
echo   ⏳ GET /api/factories...
curl -s http://localhost:8000/api/factories -H "Authorization: Bearer dummy" >nul 2>&1
if !errorlevel! EQU 0 (
    echo   ✅ Endpoint /factories: ACCESIBLE
) else (
    echo   ⚠️  Endpoint /factories: Requiere autenticación válida
)
echo.

echo [7/7] 📚 DOCUMENTACIÓN
echo   ⏳ GET /api/docs...
curl -s http://localhost:8000/api/docs >nul 2>&1
if !errorlevel! EQU 0 (
    echo   ✅ Documentación Swagger: DISPONIBLE
) else (
    echo   ❌ Documentación: NO DISPONIBLE
)
echo.

cls
echo.
echo ╔════════════════════════════════════════════════════════════╗
echo ║              🧪 REPORTE DE TESTING 🧪                    ║
echo ╚════════════════════════════════════════════════════════════╝
echo.

echo   ENDPOINTS PRINCIPALES:
echo   ─────────────────────────────────────────────────────────
echo   • Health:      GET  /api/health
echo   • Auth:        POST /api/auth/login
echo   • Candidatos:  GET  /api/candidates
echo   • Empleados:   GET  /api/employees
echo   • Fábricas:    GET  /api/factories
echo   • Docs:        GET  /api/docs
echo   ─────────────────────────────────────────────────────────
echo.

echo   📍 ACCESO RÁPIDO:
echo      • API Docs (Swagger): http://localhost:8000/api/docs
echo      • ReDoc:              http://localhost:8000/api/redoc
echo      • OpenAPI JSON:       http://localhost:8000/api/openapi.json
echo.

echo   💡 TESTING MANUAL:
echo      curl -X GET http://localhost:8000/api/health
echo      curl -X POST http://localhost:8000/api/auth/login ^
echo           -H "Content-Type: application/json" ^
echo           -d "{\"username\":\"admin\",\"password\":\"admin123\"}"
echo.

pause >nul
