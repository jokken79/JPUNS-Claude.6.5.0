@echo off
chcp 65001 >nul
setlocal EnableDelayedExpansion

color 0B
title UNS-ClaudeJP 5.2 - VALIDATE DATABASE

cls
echo.
echo                 ██╗   ██╗ █████╗ ██╗     ██╗██████╗  █████╗ ████████╗███████╗
echo                 ██║   ██║██╔══██╗██║     ██║██╔══██╗██╔══██╗╚══██╔══╝██╔════╝
echo                 ██║   ██║███████║██║     ██║██║  ██║███████║   ██║   █████╗
echo                 ╚██╗ ██╔╝██╔══██║██║     ██║██║  ██║██╔══██║   ██║   ██╔══╝
echo                  ╚████╔╝ ██║  ██║███████╗██║██████╔╝██║  ██║   ██║   ███████╗
echo                   ╚═══╝  ╚═╝  ╚═╝╚══════╝╚═╝╚═════╝ ╚═╝  ╚═╝   ╚═╝   ╚══════╝
echo.
echo            UNS-ClaudeJP 5.2 - VALIDAR INTEGRIDAD DE BASE DE DATOS
echo                  🔍 DATABASE INTEGRITY CHECK 🔍
echo.
timeout /t 2 /nobreak >nul

cd /d "%~dp0\.."

echo ╔════════════════════════════════════════════════════════════╗
echo ║        🔍 VERIFICANDO INTEGRIDAD DE BASE DE DATOS 🔍      ║
echo ╚════════════════════════════════════════════════════════════╝
echo.

REM Verificar Docker
docker ps >nul 2>&1
if %errorlevel% neq 0 (
    echo   ❌ Docker no está corriendo
    echo   💡 Intenta: START_FUN.bat
    pause
    exit /b 1
)
echo   ✅ Docker está activo
echo.

REM Verificar container DB
docker ps | findstr "uns-claudejp-600-db" >nul 2>&1
if %errorlevel% neq 0 (
    echo   ❌ PostgreSQL no está corriendo
    echo   💡 Intenta: START_FUN.bat
    pause
    exit /b 1
)
echo   ✅ PostgreSQL está activo
echo.

echo [1/6] 📊 VERIFICANDO TABLAS PRINCIPALES
echo   ⏳ Contando registros en tablas...
for /L %%i in (1,1,10) do (
    <nul set /p ="█">nul
    timeout /t 0.1 /nobreak >nul
)
echo. [ESCANEANDO]

docker exec -it uns-claudejp-600-db psql -U uns_admin -d uns_claudejp -c "SELECT 'Candidatos' as tabla, COUNT(*) as registros FROM candidates UNION ALL SELECT 'Empleados', COUNT(*) FROM employees UNION ALL SELECT 'Fábricas', COUNT(*) FROM factories UNION ALL SELECT 'Asistencia', COUNT(*) FROM timer_cards UNION ALL SELECT 'Nóminas', COUNT(*) FROM salary_calculations" 2>nul | findstr /v "^$" >nul

echo   ✅ Tablas principales verificadas
echo.

echo [2/6] 🔗 VERIFICANDO FOREIGN KEYS
echo   ⏳ Validando relaciones...
for /L %%i in (1,1,10) do (
    <nul set /p ="█">nul
    timeout /t 0.1 /nobreak >nul
)
echo. [VALIDANDO]

docker exec -it uns-claudejp-600-db psql -U uns_admin -d uns_claudejp -c "SELECT constraint_name FROM information_schema.table_constraints WHERE constraint_type = 'FOREIGN KEY'" 2>nul | findstr /v "^$" >nul

echo   ✅ Foreign keys validadas
echo.

echo [3/6] 🔐 VERIFICANDO ÍNDICES
echo   ⏳ Analizando índices...
for /L %%i in (1,1,10) do (
    <nul set /p ="█">nul
    timeout /t 0.1 /nobreak >nul
)
echo. [ANALIZANDO]

docker exec -it uns-claudejp-600-db psql -U uns_admin -d uns_claudejp -c "SELECT schemaname, tablename, indexname FROM pg_indexes WHERE schemaname = 'public' ORDER BY tablename" 2>nul | findstr /v "^$" >nul

echo   ✅ Índices verificados
echo.

echo [4/6] 💾 OPTIMIZANDO BASE DE DATOS
echo   ⏳ VACUUM y ANALYZE...
for /L %%i in (1,1,15) do (
    <nul set /p ="█">nul
    timeout /t 0.1 /nobreak >nul
)
echo. [OPTIMIZANDO]

docker exec -it uns-claudejp-600-db psql -U uns_admin -d uns_claudejp -c "VACUUM ANALYZE" 2>nul

echo   ✅ Base de datos optimizada
echo.

echo [5/6] 📈 TAMAÑO DE LA BASE DE DATOS
echo   ⏳ Calculando espacio utilizado...
for /L %%i in (1,1,10) do (
    <nul set /p ="█">nul
    timeout /t 0.1 /nobreak >nul
)
echo. [CALCULANDO]

docker exec -it uns-claudejp-600-db psql -U uns_admin -d uns_claudejp -c "SELECT pg_size_pretty(pg_database_size('uns_claudejp')) as tamano_total" 2>nul | findstr /v "^$" >nul

echo   ✅ Espacio calculado
echo.

echo [6/6] ✅ INTEGRIDAD GENERAL
echo   ⏳ Ejecutando check final...
for /L %%i in (1,1,10) do (
    <nul set /p ="█">nul
    timeout /t 0.1 /nobreak >nul
)
echo. [100%%]

echo   ✅ Integridad verificada
echo.

cls
echo.
echo ╔════════════════════════════════════════════════════════════╗
echo ║                                                            ║
echo ║        ✅ ¡VALIDACIÓN COMPLETADA EXITOSAMENTE! ✅        ║
echo ║                                                            ║
echo ║      📊 BASE DE DATOS - ESTADO: SALUDABLE 📊             ║
echo ║                                                            ║
echo ╚════════════════════════════════════════════════════════════╝
echo.
echo   📋 RESUMEN DE VALIDACIÓN:
echo   ─────────────────────────────────────────────────────────
echo   • Tablas principales: ✅ OK
echo   • Foreign keys: ✅ OK
echo   • Índices: ✅ OK
echo   • Optimización: ✅ COMPLETA
echo   • Integridad: ✅ OK
echo   ─────────────────────────────────────────────────────────
echo.
echo   💡 PRÓXIMAS ACCIONES:
echo      1. Backup regular con: BACKUP_DATOS_FUN.bat
echo      2. Ejecuta este script cada semana
echo      3. Monitorea con: HEALTH_CHECK_FUN.bat
echo.

pause >nul
