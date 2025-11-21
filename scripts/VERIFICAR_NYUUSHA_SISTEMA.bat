@echo off
chcp 65001 >nul
setlocal EnableDelayedExpansion
color 0E
title Verificación Rápida - 入社連絡票 Sistema

cls
echo.
echo ╔══════════════════════════════════════════════════════════════════════╗
echo ║                                                                      ║
echo ║       🔍 VERIFICACIÓN RÁPIDA - 入社連絡票 SISTEMA 🔍                 ║
echo ║                                                                      ║
echo ╚══════════════════════════════════════════════════════════════════════╝
echo.

set "SUCCESS_COUNT=0"
set "ERROR_COUNT=0"
set "WARNING_COUNT=0"

:: ══════════════════════════════════════════════════════════════════════════
::  VERIFICACIÓN 1: SERVICIOS DOCKER
:: ══════════════════════════════════════════════════════════════════════════

echo ┌────────────────────────────────────────────────────────────────────┐
echo │ [1/6] SERVICIOS DOCKER                                             │
echo └────────────────────────────────────────────────────────────────────┘
echo.

docker ps --filter "name=uns-claudejp" --format "table {{.Names}}\t{{.Status}}" | findstr "uns-claudejp" >nul 2>&1
if !errorlevel! EQU 0 (
    echo ✅ Servicios Docker corriendo
    set /a SUCCESS_COUNT+=1
) else (
    echo ❌ Servicios Docker NO están corriendo
    echo ℹ Ejecuta: scripts\START.bat
    set /a ERROR_COUNT+=1
    goto :SUMMARY
)

:: ══════════════════════════════════════════════════════════════════════════
::  VERIFICACIÓN 2: MIGRACIÓN ALEMBIC
:: ══════════════════════════════════════════════════════════════════════════

echo.
echo ┌────────────────────────────────────────────────────────────────────┐
echo │ [2/6] MIGRACIÓN ALEMBIC                                            │
echo └────────────────────────────────────────────────────────────────────┘
echo.

docker exec uns-claudejp-600-backend-1 bash -c "cd /app && alembic current" 2>nul | findstr "add_nyuusha_fields" >nul
if !errorlevel! EQU 0 (
    echo ✅ Migración add_nyuusha_fields aplicada
    set /a SUCCESS_COUNT+=1
) else (
    echo ⚠ Migración add_nyuusha_fields NO encontrada
    echo ℹ Ejecuta: EJECUTAR_REBUILD_Y_TEST.bat
    set /a WARNING_COUNT+=1
)

:: ══════════════════════════════════════════════════════════════════════════
::  VERIFICACIÓN 3: COLUMNAS EN BASE DE DATOS
:: ══════════════════════════════════════════════════════════════════════════

echo.
echo ┌────────────────────────────────────────────────────────────────────┐
echo │ [3/6] COLUMNAS EN BASE DE DATOS                                   │
echo └────────────────────────────────────────────────────────────────────┘
echo.

docker exec uns-claudejp-600-db psql -U uns_admin -d uns_claudejp -c "\d requests" 2>nul | findstr "candidate_id" >nul
if !errorlevel! EQU 0 (
    echo ✅ Columna candidate_id existe
    set /a SUCCESS_COUNT+=1
) else (
    echo ❌ Columna candidate_id NO existe
    set /a ERROR_COUNT+=1
)

docker exec uns-claudejp-600-db psql -U uns_admin -d uns_claudejp -c "\d requests" 2>nul | findstr "employee_data" >nul
if !errorlevel! EQU 0 (
    echo ✅ Columna employee_data existe
    set /a SUCCESS_COUNT+=1
) else (
    echo ❌ Columna employee_data NO existe
    set /a ERROR_COUNT+=1
)

:: ══════════════════════════════════════════════════════════════════════════
::  VERIFICACIÓN 4: ÍNDICE
:: ══════════════════════════════════════════════════════════════════════════

echo.
echo ┌────────────────────────────────────────────────────────────────────┐
echo │ [4/6] ÍNDICES DE BASE DE DATOS                                    │
echo └────────────────────────────────────────────────────────────────────┘
echo.

docker exec uns-claudejp-600-db psql -U uns_admin -d uns_claudejp -c "\di" 2>nul | findstr "idx_requests_candidate" >nul
if !errorlevel! EQU 0 (
    echo ✅ Índice idx_requests_candidate_id existe
    set /a SUCCESS_COUNT+=1
) else (
    echo ⚠ Índice idx_requests_candidate_id NO encontrado
    set /a WARNING_COUNT+=1
)

:: ══════════════════════════════════════════════════════════════════════════
::  VERIFICACIÓN 5: API ENDPOINTS
:: ══════════════════════════════════════════════════════════════════════════

echo.
echo ┌────────────────────────────────────────────────────────────────────┐
echo │ [5/6] API ENDPOINTS                                                │
echo └────────────────────────────────────────────────────────────────────┘
echo.

curl -s http://localhost:8000/api/health >nul 2>&1
if !errorlevel! EQU 0 (
    echo ✅ Backend API accesible
    set /a SUCCESS_COUNT+=1
) else (
    echo ❌ Backend API NO accesible
    set /a ERROR_COUNT+=1
)

curl -s http://localhost:3000 >nul 2>&1
if !errorlevel! EQU 0 (
    echo ✅ Frontend accesible
    set /a SUCCESS_COUNT+=1
) else (
    echo ❌ Frontend NO accesible
    set /a ERROR_COUNT+=1
)

:: ══════════════════════════════════════════════════════════════════════════
::  VERIFICACIÓN 6: ARCHIVOS FRONTEND
:: ══════════════════════════════════════════════════════════════════════════

echo.
echo ┌────────────────────────────────────────────────────────────────────┐
echo │ [6/6] ARCHIVOS FRONTEND                                            │
echo └────────────────────────────────────────────────────────────────────┘
echo.

if exist "frontend\components\requests\RequestTypeBadge.tsx" (
    echo ✅ RequestTypeBadge.tsx existe
    set /a SUCCESS_COUNT+=1
) else (
    echo ❌ RequestTypeBadge.tsx NO existe
    set /a ERROR_COUNT+=1
)

if exist "frontend\app\(dashboard)\requests\[id]\page.tsx" (
    echo ✅ Request detail page existe
    set /a SUCCESS_COUNT+=1
) else (
    echo ❌ Request detail page NO existe
    set /a ERROR_COUNT+=1
)

:: ══════════════════════════════════════════════════════════════════════════
::  RESUMEN
:: ══════════════════════════════════════════════════════════════════════════

:SUMMARY
echo.
echo ╔══════════════════════════════════════════════════════════════════════╗
echo ║                       RESUMEN DE VERIFICACIÓN                        ║
echo ╚══════════════════════════════════════════════════════════════════════╝
echo.
echo   ✅ Exitosos:  !SUCCESS_COUNT!
echo   ⚠  Warnings:  !WARNING_COUNT!
echo   ❌ Errores:   !ERROR_COUNT!
echo.

if !ERROR_COUNT! EQU 0 (
    if !WARNING_COUNT! EQU 0 (
        echo ╔══════════════════════════════════════════════════════════════════════╗
        echo ║                                                                      ║
        echo ║         🎉 SISTEMA 100%% VERIFICADO Y FUNCIONAL 🎉                   ║
        echo ║                                                                      ║
        echo ║   入社連絡票 sistema está completamente implementado                ║
        echo ║   Listo para testing del workflow completo                          ║
        echo ║                                                                      ║
        echo ╚══════════════════════════════════════════════════════════════════════╝
        echo.
        echo 📋 PRÓXIMO PASO:
        echo    1. Ve a http://localhost:3000/candidates
        echo    2. Aprueba un candidato (click 👍)
        echo    3. Ve a http://localhost:3000/requests
        echo    4. Filtra por "入社連絡票"
        echo    5. Click en el request → Llenar datos → Aprobar
        echo    6. ✅ Empleado creado!
    ) else (
        echo ╔══════════════════════════════════════════════════════════════════════╗
        echo ║                                                                      ║
        echo ║         ✅ SISTEMA VERIFICADO CON WARNINGS                           ║
        echo ║                                                                      ║
        echo ║   El sistema funciona pero hay componentes opcionales faltantes     ║
        echo ║   Revisa los warnings arriba                                        ║
        echo ║                                                                      ║
        echo ╚══════════════════════════════════════════════════════════════════════╝
    )
) else (
    echo ╔══════════════════════════════════════════════════════════════════════╗
    echo ║                                                                      ║
    echo ║         ❌ SE ENCONTRARON ERRORES                                     ║
    echo ║                                                                      ║
    echo ║   Ejecuta: EJECUTAR_REBUILD_Y_TEST.bat                               ║
    echo ║                                                                      ║
    echo ╚══════════════════════════════════════════════════════════════════════╝
)

echo.
echo ════════════════════════════════════════════════════════════════════
echo  PRESIONA CUALQUIER TECLA PARA CERRAR ESTA VENTANA
echo ════════════════════════════════════════════════════════════════════
pause >nul
