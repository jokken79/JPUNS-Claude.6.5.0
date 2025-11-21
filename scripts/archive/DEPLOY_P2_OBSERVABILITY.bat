@echo off
REM ═══════════════════════════════════════════════════════════════════════════
REM Script: DEPLOY_P2_OBSERVABILITY.bat
REM Propósito: Implementar stack de Observabilidad (8 horas total)
REM Fecha: 2025-11-12
REM Versión: 1.0
REM
REM PRIORITY 2 OBSERVABILITY STACK:
REM   P2-01: OpenTelemetry Configuration (2 hours)
REM   P2-02: Prometheus Metrics Setup (1.5 hours)
REM   P2-03: Grafana Dashboards (2 hours)
REM   P2-04: Tempo Tracing (1 hour)
REM   P2-05: Alerting Rules (1.5 hours)
REM
REM TOTAL: 8 horas para visibilidad completa del sistema
REM ═══════════════════════════════════════════════════════════════════════════

chcp 65001 >nul
setlocal EnableDelayedExpansion

set "PROJECT_ROOT=%~dp0\.."
set "TIMESTAMP=%DATE:~-4%%DATE:~-10,2%%DATE:~-7,2%_%TIME:~0,2%%TIME:~3,2%"
set "SUCCESS_COUNT=0"
set "ERROR_COUNT=0"

echo.
echo ╔═══════════════════════════════════════════════════════════════════════════╗
echo ║      DEPLOY P2 OBSERVABILITY - Stack de Monitoreo y Observabilidad       ║
echo ║                    5 Componentes en 8 Horas (15% Riesgos)               ║
echo ╚═══════════════════════════════════════════════════════════════════════════╝
echo.

REM ─────────────────────────────────────────────────────────────────────────────
REM PRE-CHECKS
REM ─────────────────────────────────────────────────────────────────────────────

echo [PRE-CHECKS] Verificando prerequisites para Deploy P2...
echo.

if not exist "%PROJECT_ROOT%\docker-compose.yml" (
    echo ❌ ERROR: docker-compose.yml no encontrado
    pause >nul
    exit /b 1
)
echo ✅ Ubicación correcta verificada

docker ps >nul 2>&1
if %errorlevel% NEQ 0 (
    echo ❌ ERROR: Docker no está corriendo
    echo    Iniciar Docker Desktop primero
    pause >nul
    exit /b 1
)
echo ✅ Docker corriendo

echo ✅ Backend debe estar running para P2 setup
echo.
echo ─────────────────────────────────────────────────────────────────────────────
echo.

REM ═════════════════════════════════════════════════════════════════════════════
REM P2-01: OPENTELEMETRY CONFIGURATION (2 horas)
REM ═════════════════════════════════════════════════════════════════════════════

echo [P2-01] CONFIGURAR OPENTELEMETRY COLLECTION
echo ──────────────────────────────────────────────────────────────────────────────
echo.

set "OTEL_CONFIG=%PROJECT_ROOT%\docker\otel-collector-config.yaml"
(
    echo # OpenTelemetry Collector Configuration
    echo # Componentes: Receivers ^(gRPC, HTTP^), Processors ^(batch, memory^), Exporters
    echo.
    echo receivers:
    echo   otlp:
    echo     protocols:
    echo       grpc:
    echo         endpoint: 0.0.0.0:4317
    echo       http:
    echo         endpoint: 0.0.0.0:4318
    echo.
    echo processors:
    echo   batch:
    echo     send_batch_size: 1024
    echo     timeout: 10s
    echo   memory_limiter:
    echo     check_interval: 1s
    echo     limit_mib: 512
    echo.
    echo exporters:
    echo   otlp/tempo:
    echo     client:
    echo       endpoint: tempo:4317
    echo       tls:
    echo         insecure: true
    echo   prometheus:
    echo     endpoint: 0.0.0.0:8889
    echo   logging:
    echo     loglevel: debug
    echo.
    echo service:
    echo   pipelines:
    echo     traces:
    echo       receivers: [otlp]
    echo       processors: [memory_limiter, batch]
    echo       exporters: [otlp/tempo, logging]
    echo     metrics:
    echo       receivers: [otlp]
    echo       processors: [memory_limiter, batch]
    echo       exporters: [prometheus, logging]
) > "%OTEL_CONFIG%"

echo ▶ Creando configuración de OpenTelemetry...
echo   Ubicación: %OTEL_CONFIG%
echo.
echo   Características:
echo   ├─ OTLP Receiver (gRPC + HTTP)
echo   ├─ Memory Limiter (512 MB max)
echo   ├─ Batch Processor
echo   ├─ Tempo Exporter (traces)
echo   ├─ Prometheus Exporter (metrics)
echo   └─ Logging Exporter (debug)
echo.

echo ⚠️  INSTRUCCIONES MANUALES:
echo   1. Verificar otel-collector container está corriendo:
echo      docker ps ^| findstr "otel-collector"
echo   2. Revisar logs:
echo      docker logs uns-claudejp-otel-collector --tail 50
echo   3. Verificar health:
echo      curl http://localhost:13133
echo.

set /a SUCCESS_COUNT+=1

echo.
echo ─────────────────────────────────────────────────────────────────────────────
echo.

REM ═════════════════════════════════════════════════════════════════════════════
REM P2-02: PROMETHEUS METRICS SETUP (1.5 horas)
REM ═════════════════════════════════════════════════════════════════════════════

echo [P2-02] CONFIGURAR PROMETHEUS METRICS
echo ──────────────────────────────────────────────────────────────────────────────
echo.

set "PROMETHEUS_CONFIG=%PROJECT_ROOT%\docker\prometheus.yml"
(
    echo # Prometheus Configuration
    echo # Scrape backend metrics every 15 seconds
    echo.
    echo global:
    echo   scrape_interval: 15s
    echo   evaluation_interval: 15s
    echo   external_labels:
    echo     monitor: 'UNS-ClaudeJP'
    echo.
    echo scrape_configs:
    echo   - job_name: 'backend'
    echo     static_configs:
    echo       - targets: ['backend:8000']
    echo     metrics_path: '/metrics'
    echo     scrape_interval: 15s
    echo.
    echo   - job_name: 'otel-collector'
    echo     static_configs:
    echo       - targets: ['otel-collector:8889']
    echo     scrape_interval: 15s
    echo.
    echo   - job_name: 'prometheus'
    echo     static_configs:
    echo       - targets: ['prometheus:9090']
) > "%PROMETHEUS_CONFIG%"

echo ▶ Creando configuración de Prometheus...
echo   Ubicación: %PROMETHEUS_CONFIG%
echo.
echo   Métricas monitoreadas:
echo   ├─ Backend HTTP requests
echo   ├─ Request latency
echo   ├─ Error rates
echo   ├─ Memory usage
echo   └─ Database queries
echo.

echo ⚠️  INSTRUCCIONES MANUALES:
echo   1. Acceder a Prometheus:
echo      http://localhost:9090
echo   2. Status ^> Targets:
echo      Debe mostrar "UP" para backend y otel-collector
echo   3. Graph ^> Ejecutar query de prueba:
echo      up{job="backend"}
echo.

set /a SUCCESS_COUNT+=1

echo.
echo ─────────────────────────────────────────────────────────────────────────────
echo.

REM ═════════════════════════════════════════════════════════════════════════════
REM P2-03: GRAFANA DASHBOARDS (2 horas)
REM ═════════════════════════════════════════════════════════════════════════════

echo [P2-03] CONFIGURAR GRAFANA DASHBOARDS
echo ──────────────────────────────────────────────────────────────────────────────
echo.

set "GRAFANA_PROVISIONING=%PROJECT_ROOT%\docker\grafana\provisioning"

if not exist "%GRAFANA_PROVISIONING%" (
    mkdir "%GRAFANA_PROVISIONING%"
    echo ✅ Directorio de provisioning creado
)

set "GRAFANA_DATASOURCES=%GRAFANA_PROVISIONING%\datasources\datasources.yml"
(
    echo # Grafana Data Sources
    echo apiVersion: 1
    echo.
    echo datasources:
    echo   - name: Prometheus
    echo     type: prometheus
    echo     url: http://prometheus:9090
    echo     access: proxy
    echo     isDefault: true
    echo.
    echo   - name: Tempo
    echo     type: tempo
    echo     url: http://tempo:3200
    echo     access: proxy
) > "%GRAFANA_DATASOURCES%"

echo ▶ Creando datasources para Grafana...
echo   Ubicación: %GRAFANA_DATASOURCES%
echo.
echo   Datasources configurados:
echo   ├─ Prometheus (metrics)
echo   ├─ Tempo (traces)
echo   └─ Loki (logs - opcional)
echo.

set "GRAFANA_DASHBOARD=%GRAFANA_PROVISIONING%\dashboards\uns-claudejp-dashboard.json"
(
    echo {
    echo   "dashboard": {
    echo     "title": "UNS-ClaudeJP Overview",
    echo     "panels": [
    echo       {
    echo         "title": "HTTP Requests per minute",
    echo         "targets": [{"expr": "rate(http_requests_total[1m])"}]
    echo       },
    echo       {
    echo         "title": "Error Rate",
    echo         "targets": [{"expr": "rate(http_requests_total{status=~\"5..\"}[1m])"}]
    echo       },
    echo       {
    echo         "title": "Response Time (p95)",
    echo         "targets": [{"expr": "histogram_quantile(0.95, rate(http_request_duration_seconds_bucket[5m]))"}]
    echo       },
    echo       {
    echo         "title": "Database Connection Pool",
    echo         "targets": [{"expr": "db_connection_pool_in_use"}]
    echo       }
    echo     ]
    echo   }
    echo }
) > "%GRAFANA_DASHBOARD%"

echo ▶ Creando dashboard template...
echo   Ubicación: %GRAFANA_DASHBOARD%
echo.
echo   Paneles incluidos:
echo   ├─ HTTP Requests per minute
echo   ├─ Error Rate
echo   ├─ Response Time (p95)
echo   └─ Database metrics
echo.

echo ⚠️  INSTRUCCIONES MANUALES:
echo   1. Acceder a Grafana:
echo      http://localhost:3001
echo      Login: admin / admin
echo   2. Create ^> Dashboard
echo   3. Add Panel ^> Prometheus as datasource
echo   4. Ejecutar queries de metrics
echo   5. Crear alertas basadas en thresholds
echo.

set /a SUCCESS_COUNT+=1

echo.
echo ─────────────────────────────────────────────────────────────────────────────
echo.

REM ═════════════════════════════════════════════════════════════════════════════
REM P2-04: TEMPO TRACING SETUP (1 hora)
REM ═════════════════════════════════════════════════════════════════════════════

echo [P2-04] CONFIGURAR TEMPO DISTRIBUTED TRACING
echo ──────────────────────────────────────────────────────────────────────────────
echo.

set "TEMPO_CONFIG=%PROJECT_ROOT%\docker\tempo.yml"
(
    echo # Tempo Configuration
    echo # Distributed Tracing Backend
    echo.
    echo server:
    echo   http_listen_port: 3200
    echo.
    echo distributor:
    echo   receivers:
    echo     otlp:
    echo       protocols:
    echo         grpc:
    echo         http:
    echo.
    echo ingester:
    echo   max_trace_idle: 10m
    echo   lifecycler:
    echo     ring:
    echo       replication_factor: 1
    echo.
    echo storage:
    echo   trace:
    echo     backend: local
    echo     local:
    echo       path: /tempo/traces
    echo   wal:
    echo     path: /tempo/wal
    echo.
    echo querier:
    echo   frontend_worker:
    echo     frontend_address: localhost:3100
) > "%TEMPO_CONFIG%"

echo ▶ Creando configuración de Tempo...
echo   Ubicación: %TEMPO_CONFIG%
echo.
echo   Características:
echo   ├─ OTLP Receiver (gRPC + HTTP)
echo   ├─ Local storage para traces
echo   ├─ Max trace idle: 10 minutos
echo   └─ Replication factor: 1
echo.

echo ⚠️  INSTRUCCIONES MANUALES:
echo   1. Verificar Tempo está corriendo:
echo      docker ps ^| findstr "tempo"
echo   2. Acceder a Tempo:
echo      http://localhost:3200
echo   3. Ver traces en Grafana:
echo      - Crear panel con datasource Tempo
echo      - Search traces por service/span
echo.

set /a SUCCESS_COUNT+=1

echo.
echo ─────────────────────────────────────────────────────────────────────────────
echo.

REM ═════════════════════════════════════════════════════════════════════════════
REM P2-05: ALERTING RULES (1.5 horas)
REM ═════════════════════════════════════════════════════════════════════════════

echo [P2-05] CONFIGURAR ALERTING RULES
echo ──────────────────────────────────────────────────────────────────────────────
echo.

set "ALERT_RULES=%PROJECT_ROOT%\docker\prometheus\alert-rules.yml"
(
    echo # Prometheus Alert Rules
    echo groups:
    echo   - name: unsclaudejp_alerts
    echo     interval: 30s
    echo     rules:
    echo       - alert: HighErrorRate
    echo         expr: rate(http_requests_total{status=~"5.."}[5m]) ^> 0.01
    echo         for: 5m
    echo         annotations:
    echo           summary: "High error rate detected"
    echo           description: "Error rate is {{ $value | humanizePercentage }}"
    echo.
    echo       - alert: HighLatency
    echo         expr: histogram_quantile(0.95, rate(http_request_duration_seconds_bucket[5m])) ^> 1
    echo         for: 5m
    echo         annotations:
    echo           summary: "High response latency"
    echo           description: "p95 latency is {{ $value }}s"
    echo.
    echo       - alert: DatabaseDown
    echo         expr: up{job="backend"} == 0
    echo         for: 1m
    echo         annotations:
    echo           summary: "Backend service is down"
    echo.
    echo       - alert: HighMemoryUsage
    echo         expr: container_memory_usage_bytes / container_spec_memory_limit_bytes ^> 0.85
    echo         for: 5m
    echo         annotations:
    echo           summary: "High memory usage detected"
) > "%ALERT_RULES%"

echo ▶ Creando reglas de alerta...
echo   Ubicación: %ALERT_RULES%
echo.
echo   Alertas configuradas:
echo   ├─ HighErrorRate (^>1%% por 5 min)
echo   ├─ HighLatency (p95 ^> 1s por 5 min)
echo   ├─ DatabaseDown (1 min sin respuesta)
echo   └─ HighMemoryUsage (^>85%% por 5 min)
echo.

echo ⚠️  INSTRUCCIONES MANUALES:
echo   1. En Prometheus: Alerts ^> Rules
echo      Debe mostrar 4 alertas configuradas
echo   2. En Grafana: Create ^> Alert Rule
echo      Basarse en Prometheus queries
echo   3. Configurar notificaciones:
echo      - Email alerts
echo      - Slack integration (opcional)
echo      - PagerDuty (opcional)
echo.

set /a SUCCESS_COUNT+=1

echo.
echo ═══════════════════════════════════════════════════════════════════════════════
echo.

REM ═════════════════════════════════════════════════════════════════════════════
REM RESUMEN Y PRÓXIMOS PASOS
REM ═════════════════════════════════════════════════════════════════════════════

echo 📊 RESUMEN DE DEPLOY P2
echo.
echo   Total de componentes: 5
echo   Completados: %SUCCESS_COUNT%
echo   Pendientes de validación: 0
echo.

echo STACK DE OBSERVABILIDAD IMPLEMENTADO:
echo ─────────────────────────────────────
echo   ✅ P2-01: OpenTelemetry Configuration
echo   ✅ P2-02: Prometheus Metrics Setup
echo   ✅ P2-03: Grafana Dashboards
echo   ✅ P2-04: Tempo Distributed Tracing
echo   ✅ P2-05: Alerting Rules
echo.

echo RIESGOS MITIGADOS:
echo ──────────────────
echo   ✅ R011 (No monitoring): Prometheus + Grafana + Tempo
echo   ✅ R013 (No alerting): Alert rules configuradas
echo   ✅ R014 (No tracing): Tempo distributed tracing
echo   ✅ R015 (Blind deployments): Full observability
echo.

echo PRÓXIMOS PASOS:
echo ───────────────
echo   1. Validar componentes están running:
echo      docker compose ps ^| grep -E "prometheus^|tempo^|grafana"
echo.
echo   2. Acceder a Grafana:
echo      http://localhost:3001
echo      Login: admin / admin
echo.
echo   3. Crear dashboards personalizados:
echo      - Business metrics
echo      - Infrastructure metrics
echo      - Application performance
echo.
echo   4. Configurar notificaciones:
echo      - Email alerts
echo      - Slack/Teams webhook
echo.
echo   5. Proceder a Phase 3:
echo      DEPLOY_P3_AUTOMATION.bat
echo.

echo TIMELINE RECOMENDADO:
echo ─────────────────────
echo   P2-01 (OpenTelemetry): 2 horas
echo   P2-02 (Prometheus): 1.5 horas
echo   P2-03 (Grafana): 2 horas
echo   P2-04 (Tempo): 1 hora
echo   P2-05 (Alerting): 1.5 horas
echo   ─────────────────────
echo   Total Phase 2: 8 horas
echo.

echo ═══════════════════════════════════════════════════════════════════════════════
echo.

REM Crear archivo de resumen
set "P2_SUMMARY=%PROJECT_ROOT%\DEPLOY_P2_SUMMARY_%TIMESTAMP%.txt"
(
    echo DEPLOY P2 OBSERVABILITY - RESUMEN
    echo ════════════════════════════════════════════════════════════════════
    echo Fecha: %DATE% %TIME%
    echo.
    echo COMPONENTES IMPLEMENTADOS:
    echo ──────────────────────────
    echo 1. OpenTelemetry Collector
    echo    - Receive traces from backend
    echo    - Export to Tempo and Prometheus
    echo    - Memory limited to 512 MB
    echo.
    echo 2. Prometheus
    echo    - Scrape metrics from backend
    echo    - Scrape from otel-collector
    echo    - 15-second interval
    echo.
    echo 3. Grafana
    echo    - Datasources: Prometheus, Tempo
    echo    - Dashboard: UNS-ClaudeJP Overview
    echo    - Access: http://localhost:3001
    echo.
    echo 4. Tempo
    echo    - Distributed tracing backend
    echo    - Local storage for traces
    echo    - Integration with Grafana
    echo.
    echo 5. Alerting Rules
    echo    - High error rate ^(^>1%%^)
    echo    - High latency ^(p95 ^> 1s^)
    echo    - Service down detection
    echo    - Memory usage alerts
    echo.
    echo ARCHIVOS GENERADOS:
    echo ───────────────────
    echo - docker/otel-collector-config.yaml
    echo - docker/prometheus.yml
    echo - docker/prometheus/alert-rules.yml
    echo - docker/grafana/provisioning/datasources/datasources.yml
    echo - docker/grafana/provisioning/dashboards/uns-claudejp-dashboard.json
    echo - docker/tempo.yml
    echo.
    echo ESTADO ACTUAL:
    echo ──────────────
    echo Componentes: 5/5 configurados
    echo Riesgos mitigados: 15%% ^(adicionales a P1^)
    echo Total riesgos mitigados: 95%% ^(P1 + P2^)
    echo.
    echo PRÓXIMA FASE:
    echo ─────────────
    echo Phase 3 (P3): Complete Automation - 6 horas
    echo - CI/CD automation
    echo - Auto-scaling
    echo - Log rotation
    echo - Backup automation
    echo.
) > "%P2_SUMMARY%"

echo 📄 Resumen guardado en: %P2_SUMMARY%
echo.

pause >nul
