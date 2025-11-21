# ANÁLISIS COMPLETO DEL STACK DE OBSERVABILIDAD - UNS-ClaudeJP 5.4.1

## 1. ARQUITECTURA GENERAL

### Componentes del Stack
```
Frontend (Next.js 16)          Backend (FastAPI 0.115.6)
        │                             │
        └──────────────────┬──────────┘
                          │
        ┌─────────────────┼─────────────────┐
        │                 │                 │
   OpenTelemetry      Prometheus      Otros servicios
   Collector (gRPC)   Exporter
        │                 │
        └────────┬────────┘
                 │
         ┌───────┴────────┐
         │                │
      Tempo          Prometheus
    (Traces)         (Metrics)
         │                │
         └────────┬───────┘
                  │
              Grafana
           (Dashboards)
```

## 2. SERVICIOS DE OBSERVABILIDAD EN DOCKER-COMPOSE

### 2.1 OpenTelemetry Collector
**Imagen**: `otel/opentelemetry-collector-contrib:0.103.0`
**Puertos**:
- 4317: gRPC OTLP (para exportar traces y métricas)
- 4318: HTTP OTLP (para exportar datos)
- 13133: Health check

**Configuración**:
```yaml
receivers:
  - otlp (gRPC + HTTP)
processors:
  - batch
exporters:
  - logging
extensions:
  - health_check
```

**PROBLEMA CRÍTICO**: El collector SOLO está configurado para logging, no para exportar a Tempo o Prometheus. Las traces y métricas se registran pero NO se persistendirige a los sistemas de almacenamiento.

### 2.2 Tempo (Grafana Tempo)
**Imagen**: `grafana/tempo:2.5.0`
**Puerto**: 3200 (HTTP)
**Configuración**: 
- Backend de almacenamiento: Local (`/var/tempo/blocks`)
- WAL (Write-Ahead Log): `/var/tempo/wal`
- Retención: 48 horas
- Volumen persistente: `tempo_data`

**PROBLEMA**: Tempo está configurado para RECIBIR trazas en 4317/4318, pero el collector NO está enviando las trazas a Tempo. Configura sus propios receptores OTLP pero no hay conexión explícita entre collector y tempo.

### 2.3 Prometheus
**Imagen**: `prom/prometheus:v2.52.0`
**Puerto**: 9090
**Configuración**:
```yaml
scrape_configs:
  - job_name: 'prometheus'
    targets: ['localhost:9090']
  - job_name: 'otel-collector'
    targets: ['otel-collector:8888']
  - job_name: 'tempo'
    targets: ['tempo:3200']
```

**PROBLEMA**: Prometheus intenta scrapear métricas del collector en `8888` (puerto de métricas), pero el collector NO está configurado para exportar métricas en ese puerto. La configuración de Prometheus está incompleta.

### 2.4 Grafana
**Imagen**: `grafana/grafana:11.2.0`
**Puerto**: 3001 (mapeado a 3000 interno)
**Credenciales**: admin / admin (configurable)
**DataSources**: 
- Prometheus (http://prometheus:9090)
- Tempo (http://tempo:3200)

**Dashboard**: `uns-claudejp.json` con paneles para:
- API Request Rate
- p95 Request Duration  
- OCR Success vs Failures
- (Más panels probables, pero cortado en lectura)

## 3. INSTRUMENTACIÓN EN EL BACKEND

### 3.1 Configuración en Backend
**Archivo**: `backend/app/core/observability.py`

**Instrumentos configurados**:
```python
# Observability Stack:
# 1. OpenTelemetry SDK (traces)
# 2. Prometheus FastAPI Instrumentator (métricas)
# 3. Custom OCR metrics (counters, histograms)

_ocr_requests = _meter.create_counter(
    name="ocr_requests_total",
    description="Number of OCR requests processed",
)
_ocr_failures = _meter.create_counter(
    name="ocr_failures_total",
    description="Number of OCR requests that failed",
)
_ocr_durations = _meter.create_histogram(
    name="ocr_processing_seconds",
    description="OCR processing duration in seconds",
)
```

**Instrumentadores OTEL habilitados**:
- FastAPIInstrumentor (traces para todas las peticiones HTTP)
- RequestsInstrumentor (trazas para requests HTTP salientes)
- LoggingInstrumentor (correlación de logs con traces)
- SQLAlchemyInstrumentor (trazas para queries de BD)
- prometheus-fastapi-instrumentator (métricas expuestas en `/metrics`)

### 3.2 Configuración en Environment
**Variables en docker-compose.yml**:
```env
ENABLE_TELEMETRY=true
OTEL_SERVICE_NAME=uns-claudejp-backend
OTEL_EXPORTER_OTLP_ENDPOINT=http://otel-collector:4317
OTEL_EXPORTER_OTLP_METRICS_ENDPOINT=http://otel-collector:4317
OTEL_METRICS_EXPORT_INTERVAL_MS=60000
PROMETHEUS_METRICS_PATH=/metrics
```

### 3.3 Middleware de Observabilidad
**Archivo**: `backend/app/core/middleware.py`

**Middlewares implementados**:
1. **AuditContextMiddleware**: Registra IP y User-Agent
2. **LoggingMiddleware**: Log estructurado de peticiones, calcula `X-Process-Time`
3. **SecurityMiddleware**: Headers de seguridad
4. **ExceptionHandlerMiddleware**: Convierte excepciones a JSON

**PROBLEMA**: Los middlewares NO están integrados con OpenTelemetry para crear spans adicionales.

### 3.4 Endpoints de Monitoreo
**Archivo**: `backend/app/api/monitoring.py`

**Endpoints expuestos**:
1. `GET /api/monitoring/health` - Información detallada de salud
2. `GET /api/monitoring/metrics` - Métricas OCR en tiempo real
3. `DELETE /api/monitoring/cache` - Limpieza de caché

**Métricas expuestas**:
```json
{
  "ocr_total_requests": 0,
  "ocr_total_failures": 0,
  "ocr_average_processing_time": 0.0
}
```

### 3.5 Instrumentación del Servicio OCR
**Archivo**: `backend/app/services/hybrid_ocr_service.py`

**Métricas registradas**:
```python
# En trace_ocr_operation context manager:
tracer.start_as_current_span(name, attributes={
    "ocr.document_type": document_type,
    "ocr.method": method,
})

# En record_ocr_request():
_ocr_requests.add(1, attributes)
_ocr_durations.record(duration_seconds, attributes)

# En record_ocr_failure():
_ocr_failures.add(1, attributes)
```

## 4. INSTRUMENTACIÓN EN EL FRONTEND

**Estado**: DESHABILITADA

**Archivo**: `frontend/lib/telemetry.ts`
```typescript
export const useTelemetry = () => {
  useEffect(() => {
    // OpenTelemetry initialization disabled
    // Install required packages and configure to enable telemetry
  }, []);
};
```

**Variables de entorno configuradas** (sin usar):
```env
NEXT_PUBLIC_OTEL_EXPORTER_URL=http://otel-collector:4318/v1/traces
NEXT_PUBLIC_GRAFANA_URL=http://localhost:3001
NEXT_PUBLIC_TELEMETRY_SAMPLE_RATE=1
```

## 5. PROBLEMAS IDENTIFICADOS

### CRÍTICOS
1. **OTel Collector sin exportadores** ❌
   - Solo exporta a logging, no a Tempo/Prometheus
   - Las traces se pierden después de ser logeadas
   - Las métricas no se envían a Prometheus

2. **Prometheus scrapeando puerto inválido** ❌
   - Intenta scrapear otel-collector:8888 pero no existe
   - El collector no expone métricas en ese puerto
   - Las métricas de instrumentación no se recopilan

3. **Tempo sin conexión del Collector** ⚠️
   - Tempo está escuchando en 4317/4318 pero no recibe trazas del collector
   - El collector tiene su propia configuración de receivers pero no exporta a Tempo
   - Las trazas no se almacenan en Tempo

4. **Frontend sin telemetría** ❌
   - OpenTelemetry deshabilitado en Next.js
   - No hay visibilidad del cliente
   - Sin correlación entre frontend y backend

### IMPORTANTES
5. **Base de datos sin instrumentación** ⚠️
   - SQLAlchemy está instrumentado pero sin contexto de negocio
   - Sin custom metrics para operaciones específicas

6. **Health checks incompletos** ⚠️
   - `/api/health` no valida conectividad con otel-collector
   - No verifica estado de Prometheus/Tempo

7. **Dashboard de Grafana incompleto** ⚠️
   - Queries hardcodeadas asumen métricas que no existen
   - Sin paneles para trazas (Tempo)
   - Sin alertas configuradas

### MENORES
8. **Rate limiting sin métricas** ℹ️
   - slowapi no está instrumentado
   - Sin visibilidad de rate limit violations

9. **Caché OCR sin seguimiento** ℹ️
   - No hay métricas de hit rate
   - Sin observabilidad de rendimiento de caché

10. **Logs no correlacionados** ℹ️
    - Loguru sin trace IDs
    - Difícil correlacionar logs con traces

## 6. FLUJO ACTUAL VS ESPERADO

### FLUJO ACTUAL (ROTO)
```
Backend → OTEL (gRPC) → Collector (logging) → /dev/null ❌
                        └─> Prometheus scrape (8888) → FALLA ❌
        
Frontend → No instrumentación ❌

Grafana → Prometheus ❌ (sin datos)
        → Tempo ❌ (sin traces)
```

### FLUJO ESPERADO (PROPUESTO)
```
Backend OCR → record_ocr_request() ✓
           → Span + Attributes ✓
           → OTEL Collector (gRPC) [FIJO]
           → Exportadores [A AGREGAR]
              ├─> Traces Exporter → Tempo ✓
              └─> Metrics Exporter → Prometheus ✓

Prometheus → Metrics Reader [A CONFIGURAR]
         → Tiempo Real (15s scrape interval)
         → Almacenamiento TSDB

Grafana → Prometheus (Métricas) ✓
       → Tempo (Traces) ✓
       → Dashboards con datos reales
```

## 7. DEPENDENCIAS INSTALADAS

### Backend
```
opentelemetry-api==1.27.0
opentelemetry-sdk==1.27.0
opentelemetry-exporter-otlp-proto-grpc==1.27.0
opentelemetry-instrumentation-fastapi==0.48b0
opentelemetry-instrumentation-logging==0.48b0
opentelemetry-instrumentation-requests==0.48b0
opentelemetry-instrumentation-sqlalchemy==0.48b0
prometheus-fastapi-instrumentator==7.1.0
psutil==6.1.0
```

### Frontend
❌ NO instalado (requerido para cliente-side observabilidad):
- @opentelemetry/api
- @opentelemetry/sdk-web
- @opentelemetry/sdk-trace-web
- @opentelemetry/instrumentation-fetch
- @opentelemetry/exporter-trace-otlp-http

## 8. ENDPOINTS Y PUERTOS

| Servicio | Endpoint | Estado | Notas |
|----------|----------|--------|-------|
| Backend | http://localhost:8000/api/monitoring/health | ✓ OK | Retorna JSON |
| Backend | http://localhost:8000/api/monitoring/metrics | ✓ OK | Métricas OCR custom |
| Backend | http://localhost:8000/metrics | ✓ OK | Prometheus format |
| OTel Collector | http://otel-collector:13133 | ✓ OK | Health check |
| OTel Collector | grpc://otel-collector:4317 | ✓ OK | OTLP gRPC |
| OTel Collector | http://otel-collector:4318 | ✓ OK | OTLP HTTP |
| Prometheus | http://localhost:9090 | ⚠️ PARCIAL | Targets down |
| Tempo | http://localhost:3200 | ⚠️ PARCIAL | Sin traces |
| Grafana | http://localhost:3001 | ✓ OK | Dashboards vacíos |

## 9. RESUMEN DE CONFIGURACIÓN

| Componente | Implementado | Funcional | Problemas |
|-----------|--------------|-----------|-----------|
| OpenTelemetry SDK | ✓ | ✓ | Exportadores incompletos |
| FastAPI Instrumentation | ✓ | ✓ | Sin custom spans |
| Prometheus Instrumentator | ✓ | ⚠️ | Metrics sin exportar |
| Custom OCR Metrics | ✓ | ✓ | Sin persistencia |
| Health Checks | ✓ | ⚠️ | Sin conectividad remota |
| Tempo | ✓ | ❌ | Sin traces entrada |
| Prometheus | ✓ | ❌ | Targets fallando |
| Grafana | ✓ | ❌ | Datasources vacíos |
| Frontend Telemetry | ✗ | ❌ | No implementado |
| Logging Integration | ✓ | ⚠️ | Sin trace correlation |

