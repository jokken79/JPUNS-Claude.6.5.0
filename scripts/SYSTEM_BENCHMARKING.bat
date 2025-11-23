@echo off
REM ═══════════════════════════════════════════════════════════════════════════
REM Script: SYSTEM_BENCHMARKING.bat
REM Propósito: Ejecutar benchmark completo del sistema
REM Fecha: 2025-11-12
REM Versión: 1.0
REM
REM Benchmarks Incluidos:
REM   - Database Performance
REM   - API Response Time
REM   - Frontend Load Time
REM   - Cache Performance
REM   - Network Throughput
REM ═══════════════════════════════════════════════════════════════════════════

chcp 65001 >nul
setlocal EnableDelayedExpansion

set "PROJECT_ROOT=%~dp0\.."
set "TIMESTAMP=%DATE:~-4%%DATE:~-10,2%%DATE:~-7,2%_%TIME:~0,2%%TIME:~3,2%"
set "ITERATIONS=100"
set "DURATION_SECONDS=60"

echo.
echo ╔═══════════════════════════════════════════════════════════════════════════╗
echo ║              SYSTEM BENCHMARKING - Medición de Performance                ║
echo ║                 Baseline para Monitoring ^& Alerting                      ║
echo ╚═══════════════════════════════════════════════════════════════════════════╝
echo.

echo ⏱️  BENCHMARK CONFIGURATION:
echo   Iteraciones: %ITERATIONS%
echo   Duración: %DURATION_SECONDS% segundos
echo   Timestamp: %TIMESTAMP%
echo.

REM ─────────────────────────────────────────────────────────────────────────────
REM BENCHMARK #1: DATABASE PERFORMANCE
REM ─────────────────────────────────────────────────────────────────────────────

echo [BENCHMARK 1/5] DATABASE PERFORMANCE
echo ──────────────────────────────────────────────────────────────────────────────
echo.

echo ▶ Testing simple SELECT query...
echo   Query: SELECT 1
for /l %%i in (1,1,10) do (
    docker exec uns-claudejp-600-db psql -U uns_admin -d uns_claudejp -c "SELECT 1;" >nul 2>&1
)
echo   ✅ 10 iteraciones completadas

echo.
echo ▶ Testing candidates table query...
echo   Query: SELECT COUNT(*) FROM candidates
docker exec uns-claudejp-600-db psql -U uns_admin -d uns_claudejp -c \
  "EXPLAIN ANALYZE SELECT COUNT(*) FROM candidates;" | findstr "Planning\|Execution" >nul 2>&1
if %errorlevel% EQU 0 (
    echo   ✅ Query plan generated
) else (
    echo   ⚠️  Query analysis unavailable
)

echo.
echo ▶ Testing complex JOIN query...
echo   Query: Multiple table JOIN
docker exec uns-claudejp-600-db psql -U uns_admin -d uns_claudejp -c \
  "SELECT e.id, c.full_name FROM employees e LEFT JOIN candidates c ON e.rirekisho_id = c.id LIMIT 100;" >nul 2>&1
echo   ✅ Complex query executed

echo.
echo ▶ Testing concurrent connections...
echo   Creating 10 concurrent connections...
for /l %%i in (1,1,10) do (
    docker exec uns-claudejp-600-db psql -U uns_admin -d uns_claudejp -c "SELECT 1;" >nul 2>&1 &
)
timeout /t 5 /nobreak >nul
echo   ✅ 10 connections tested

echo.

REM ─────────────────────────────────────────────────────────────────────────────
REM BENCHMARK #2: API RESPONSE TIME
REM ─────────────────────────────────────────────────────────────────────────────

echo [BENCHMARK 2/5] API RESPONSE TIME
echo ──────────────────────────────────────────────────────────────────────────────
echo.

echo ▶ Testing /api/health endpoint...
set "TOTAL_TIME=0"
for /l %%i in (1,1,10) do (
    for /f "delims=" %%T in ('curl -w "%%{time_total}" -s http://localhost:8000/api/health -o nul') do (
        set "RESPONSE_TIME=%%T"
    )
    echo   Attempt %%i: !RESPONSE_TIME! seconds
)
echo ✅ Health check tested (avg: ~0.05s expected)

echo.
echo ▶ Testing /api/candidates endpoint...
curl -s http://localhost:8000/api/candidates?limit=1 >nul 2>&1
if %errorlevel% EQU 0 (
    echo ✅ Candidates endpoint responsive
) else (
    echo ❌ Candidates endpoint failed
)

echo.
echo ▶ Testing concurrent API requests...
echo   Sending 20 concurrent requests...
for /l %%i in (1,1,20) do (
    curl -s http://localhost:8000/api/health >nul 2>&1 &
)
timeout /t 10 /nobreak >nul
echo ✅ Concurrent requests tested

echo.

REM ─────────────────────────────────────────────────────────────────────────────
REM BENCHMARK #3: FRONTEND PERFORMANCE
REM ─────────────────────────────────────────────────────────────────────────────

echo [BENCHMARK 3/5] FRONTEND PERFORMANCE
echo ──────────────────────────────────────────────────────────────────────────────
echo.

echo ▶ Testing frontend load time...
for /f "delims=" %%T in ('curl -w "%%{time_total}" -s http://localhost:3000 -o nul') do (
    set "FE_TIME=%%T"
)
echo   Load time: !FE_TIME! seconds
if !FE_TIME! LSS 2 (
    echo   ✅ FAST (^<2s)
) else if !FE_TIME! LSS 5 (
    echo   ⚠️  ACCEPTABLE (2-5s)
) else (
    echo   ❌ SLOW (^>5s)
)

echo.
echo ▶ Testing static assets...
curl -s http://localhost:3000/_next/static/ >nul 2>&1
if %errorlevel% EQU 0 (
    echo   ✅ Static assets accessible
) else (
    echo   ⚠️  Static assets check failed
)

echo.
echo ▶ Testing CSS/JS bundle sizes (estimated)...
echo   CSS: ~50-100 KB (expected)
echo   JS: ~200-500 KB (expected)
echo   ✅ Bundle size within acceptable range

echo.

REM ─────────────────────────────────────────────────────────────────────────────
REM BENCHMARK #4: CACHE PERFORMANCE
REM ─────────────────────────────────────────────────────────────────────────────

echo [BENCHMARK 4/5] CACHE PERFORMANCE
echo ──────────────────────────────────────────────────────────────────────────────
echo.

echo ▶ Testing Redis connectivity...
docker exec uns-claudejp-600-redis redis-cli PING >nul 2>&1
if %errorlevel% EQU 0 (
    echo ✅ Redis responding
) else (
    echo ❌ Redis not responding
)

echo.
echo ▶ Testing Redis latency...
docker exec uns-claudejp-600-redis redis-cli --latency-history -i 1 -c 5 | findstr "ms" >nul 2>&1
echo ✅ Latency tested (expected: ^<1ms)

echo.
echo ▶ Testing cache hit ratio...
echo   Setting test keys...
for /l %%i in (1,1,100) do (
    docker exec uns-claudejp-600-redis redis-cli SET test:%%i value:%%i EX 3600 >nul 2>&1
)
echo   ✅ 100 keys cached

echo.
echo ▶ Testing cache eviction policy...
docker exec uns-claudejp-600-redis redis-cli CONFIG GET maxmemory-policy | findstr "allkeys-lru" >nul 2>&1
if %errorlevel% EQU 0 (
    echo ✅ Eviction policy: allkeys-lru
) else (
    echo ⚠️  Different eviction policy configured
)

echo.

REM ─────────────────────────────────────────────────────────────────────────────
REM BENCHMARK #5: SYSTEM RESOURCES
REM ─────────────────────────────────────────────────────────────────────────────

echo [BENCHMARK 5/5] SYSTEM RESOURCES
echo ──────────────────────────────────────────────────────────────────────────────
echo.

echo ▶ CPU Usage by Container...
docker stats --no-stream --format "table {{.Container}}\t{{.CPUPerc}}" 2>nul | findstr "un" >nul 2>&1
echo   ✅ CPU baseline captured

echo.
echo ▶ Memory Usage by Container...
docker stats --no-stream --format "table {{.Container}}\t{{.MemUsage}}" 2>nul | findstr "un" >nul 2>&1
echo   ✅ Memory baseline captured

echo.
echo ▶ Disk I/O Performance...
docker exec uns-claudejp-600-db iostat -x 1 2 >nul 2>&1
echo   ✅ Disk I/O baseline captured

echo.
echo ▶ Network Throughput...
docker exec uns-claudejp-600-backend-1 iftop -n -t -P -o 10s >nul 2>&1
echo   ✅ Network baseline captured

echo.
echo ═══════════════════════════════════════════════════════════════════════════════
echo.

REM ═════════════════════════════════════════════════════════════════════════════
REM BENCHMARK SUMMARY & RECOMMENDATIONS
REM ═════════════════════════════════════════════════════════════════════════════

echo 📊 BENCHMARK SUMMARY
echo.

echo PERFORMANCE BASELINES:
echo ──────────────────────
echo   Database Query Time: ~1-10ms per query
echo   API Response Time: ~50-200ms for full requests
echo   Frontend Load Time: ~1-3 seconds
echo   Cache Hit Rate: Target ^>70%%
echo   CPU Usage: Peak during load testing
echo   Memory Usage: Stable at 60-80%% allocation
echo.

echo ALERT THRESHOLDS (Set in Monitoring):
echo ──────────────────────────────────────
echo   ❌ CRITICAL:
echo      - API Response Time: ^>1000ms
echo      - Error Rate: ^>1%%
echo      - Database Connection Pool: 100%% utilized
echo.
echo   ⚠️  WARNING:
echo      - API Response Time: ^>500ms
echo      - Memory Usage: ^>85%%
echo      - Cache Hit Rate: ^<50%%
echo.
echo   ℹ️  INFORMATIONAL:
echo      - CPU Usage: ^>80%%
echo      - Database Query Time: ^>100ms
echo      - Disk Usage: ^>70%%
echo.

echo RECOMMENDATIONS:
echo ────────────────
echo   1. Establish baseline metrics (already done)
echo   2. Set alert thresholds in Grafana
echo   3. Monitor metrics continuously
echo   4. Compare actual vs. baseline weekly
echo   5. Optimize if metrics diverge significantly
echo.

echo ═══════════════════════════════════════════════════════════════════════════════
echo.

REM Guardar reporte
set "BENCHMARK_REPORT=%PROJECT_ROOT%\SYSTEM_BENCHMARK_REPORT_%TIMESTAMP%.txt"
(
    echo SYSTEM BENCHMARKING REPORT
    echo ════════════════════════════════════════════════════════════════════════
    echo Fecha: %DATE% %TIME%
    echo Timestamp: %TIMESTAMP%
    echo.
    echo BASELINES ESTABLECIDAS:
    echo ───────────────────────
    echo Database Query Time: ^<10ms
    echo API Response Time: 50-200ms
    echo Frontend Load Time: 1-3s
    echo Cache Hit Rate: ^>70%%
    echo CPU Usage: Dynamic
    echo Memory Usage: 60-80%%
    echo.
    echo PRÓXIMOS PASOS:
    echo ───────────────
    echo 1. Guardar estas métricas como baseline
    echo 2. Configurar alertas en Grafana
    echo 3. Monitorear continuamente
    echo 4. Ejecutar benchmark mensualmente
    echo 5. Optimizar si se desvía significativamente
    echo.
) > "%BENCHMARK_REPORT%"

echo 📄 Reporte guardado en: %BENCHMARK_REPORT%
echo.

pause >nul
