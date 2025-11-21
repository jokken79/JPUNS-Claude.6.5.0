# PLAN DE CORRECCIÓN DEL STACK DE OBSERVABILIDAD

## PRIORIDAD 1: CRÍTICAS (Implementar primero)

### 1.1 Corregir OTel Collector Config
**Archivo**: `docker/observability/otel-collector-config.yaml`

**Problema**: Solo exporta a logging

**Solución**: Agregar exportadores para Tempo y Prometheus
```yaml
receivers:
  otlp:
    protocols:
      grpc:
        endpoint: 0.0.0.0:4317
      http:
        endpoint: 0.0.0.0:4318

processors:
  batch:

exporters:
  logging:
    loglevel: info
  
  # FIX: Agregar exporter para Tempo
  otlp:
    client:
      endpoint: tempo:4317
      tls:
        insecure: true
  
  # FIX: Agregar exporter para Prometheus (metrics)
  prometheusremotewrite:
    endpoint: "http://prometheus:9009/api/v1/write"
    headers:
      Content-Type: application/x-protobuf

extensions:
  health_check:
    endpoint: 0.0.0.0:13133

service:
  extensions: [health_check]
  pipelines:
    traces:
      receivers: [otlp]
      processors: [batch]
      exporters: [logging, otlp]  # FIX: Export to Tempo
    
    metrics:
      receivers: [otlp]
      processors: [batch]
      exporters: [logging, prometheusremotewrite]  # FIX: Export to Prometheus
```

### 1.2 Configurar Prometheus para recibir métricas
**Archivo**: `docker/observability/prometheus.yml`

**Problema**: Intenta scrapeando puerto inexistente (8888)

**Solución**:
```yaml
global:
  scrape_interval: 15s
  evaluation_interval: 15s

# FIX: Agregar la configuración de remote_write
remote_write:
  - url: http://prometheus:9009/api/v1/write

scrape_configs:
  - job_name: 'prometheus'
    static_configs:
      - targets: ['localhost:9090']
  
  # FIX: Cambiar scrape del collector
  - job_name: 'backend-metrics'
    static_configs:
      - targets: ['backend:8000']
    metrics_path: '/metrics'
    scrape_interval: 15s
  
  # OPCIONAL: Mantener scrape de Tempo para health
  - job_name: 'tempo'
    static_configs:
      - targets: ['tempo:3200']
```

### 1.3 Habilitar Frontend Telemetry
**Archivo**: `frontend/lib/telemetry.ts`

**Paso 1**: Instalar dependencias
```bash
npm install \
  @opentelemetry/api@1.8.0 \
  @opentelemetry/sdk-web@1.20.0 \
  @opentelemetry/sdk-trace-web@1.20.0 \
  @opentelemetry/instrumentation-fetch@0.49.1 \
  @opentelemetry/instrumentation-document-load@0.36.1 \
  @opentelemetry/exporter-trace-otlp-http@0.49.1 \
  @opentelemetry/resources@1.20.0 \
  @opentelemetry/semantic-conventions@1.20.0
```

**Paso 2**: Implementar telemetría
```typescript
'use client';

import { useEffect } from 'react';
import { WebTracerProvider } from '@opentelemetry/sdk-trace-web';
import { OTLPTraceExporter } from '@opentelemetry/exporter-trace-otlp-http';
import { DocumentLoadInstrumentation } from '@opentelemetry/instrumentation-document-load';
import { FetchInstrumentation } from '@opentelemetry/instrumentation-fetch';
import { registerInstrumentations } from '@opentelemetry/instrumentation-auto';
import { Resource } from '@opentelemetry/resources';
import { SemanticResourceAttributes } from '@opentelemetry/semantic-conventions';
import { SimpleSpanProcessor, BatchSpanProcessor } from '@opentelemetry/sdk-trace-web';

let telemetryStarted = false;

export const useTelemetry = () => {
  useEffect(() => {
    if (telemetryStarted || typeof window === 'undefined') {
      return;
    }

    try {
      const resource = Resource.default().merge(
        new Resource({
          [SemanticResourceAttributes.SERVICE_NAME]: 'uns-claudejp-frontend',
          [SemanticResourceAttributes.SERVICE_VERSION]: process.env.NEXT_PUBLIC_APP_VERSION || '5.4.1',
        }),
      );

      const otlpExporter = new OTLPTraceExporter({
        url: process.env.NEXT_PUBLIC_OTEL_EXPORTER_URL || 'http://localhost:4318/v1/traces',
      });

      const tracerProvider = new WebTracerProvider({ resource });
      tracerProvider.addSpanProcessor(new BatchSpanProcessor(otlpExporter));

      // Instrumentaciones
      tracerProvider.addSpanProcessor(
        new SimpleSpanProcessor(
          new (require('@opentelemetry/exporter-trace-otlp-http').OTLPTraceExporter)({
            url: process.env.NEXT_PUBLIC_OTEL_EXPORTER_URL || 'http://localhost:4318/v1/traces',
          })
        )
      );

      registerInstrumentations({
        instrumentations: [
          new DocumentLoadInstrumentation(),
          new FetchInstrumentation({
            requestHook: (span: any, request: Request) => {
              span.setAttribute('http.url', request.url);
              span.setAttribute('http.method', request.method);
            },
          }),
        ],
      });

      telemetryStarted = true;
      console.log('Frontend OpenTelemetry initialized');
    } catch (error) {
      console.error('Failed to initialize frontend telemetry:', error);
    }
  }, []);
};
```

---

## PRIORIDAD 2: IMPORTANTES (Después de críticas)

### 2.1 Mejorar Grafana Dashboard
**Archivo**: `docker/observability/grafana/dashboards/uns-claudejp.json`

**Agregaciones necesarias**:
1. Panel de Trazas (Traces) - Tempo query
2. Panel de Service Map (Tempo)
3. Panel de Requests por Status Code
4. Panel de Database Query Duration
5. Panel de Error Rate
6. Panel de Heap Memory Usage
7. Alertas basadas en thresholds

**Ejemplo de nuevo panel**:
```json
{
  "type": "nodeGraph",
  "title": "Service Map",
  "datasource": {
    "type": "tempo",
    "uid": "tempo"
  },
  "targets": [
    {
      "queryType": "serviceMap",
      "refId": "A"
    }
  ]
}
```

### 2.2 Custom Metrics para Operaciones Críticas
**Archivo**: `backend/app/core/observability.py`

**Agregar**:
```python
# Auth metrics
_auth_attempts = _meter.create_counter(
    name="auth_attempts_total",
    description="Total authentication attempts"
)
_auth_failures = _meter.create_counter(
    name="auth_failures_total",
    description="Failed authentication attempts"
)

# Database metrics
_db_query_duration = _meter.create_histogram(
    name="db_query_duration_seconds",
    unit="s",
    description="Database query duration"
)

# Business logic metrics
_candidate_created = _meter.create_counter(
    name="candidates_created_total",
    description="Total candidates created"
)
_employees_assigned = _meter.create_counter(
    name="employees_assigned_total",
    description="Total employees assigned"
)
_payroll_processed = _meter.create_counter(
    name="payroll_processed_total",
    description="Total payroll calculations"
)
```

### 2.3 Health Check mejorado
**Archivo**: `backend/app/api/monitoring.py`

**Agregar verificaciones remotas**:
```python
import asyncio
import aiohttp

async def check_remote_service(url: str, timeout: int = 5) -> bool:
    try:
        async with aiohttp.ClientSession() as session:
            async with session.get(url, timeout=timeout) as response:
                return response.status == 200
    except Exception:
        return False

@router.get("/health/detailed")
async def detailed_health_with_remotes() -> Dict[str, Any]:
    # ... existing code ...
    
    # Check remote services
    otel_health = await check_remote_service("http://otel-collector:13133")
    prometheus_health = await check_remote_service("http://prometheus:9090/-/ready")
    tempo_health = await check_remote_service("http://tempo:3200/status")
    
    return {
        "status": "healthy",
        "dependencies": {
            "database": "ok",
            "redis": "ok",
            "otel_collector": "ok" if otel_health else "down",
            "prometheus": "ok" if prometheus_health else "down",
            "tempo": "ok" if tempo_health else "down",
        }
    }
```

### 2.4 Trace correlation en logs
**Archivo**: `backend/app/core/logging.py`

**Integración con OpenTelemetry**:
```python
import logging
from opentelemetry import trace

class OTelAwareFormatter(logging.Formatter):
    def format(self, record):
        span_ctx = trace.get_current_span().get_span_context()
        if span_ctx:
            record.trace_id = format(span_ctx.trace_id, '032x')
            record.span_id = format(span_ctx.span_id, '016x')
        else:
            record.trace_id = 'no-trace'
            record.span_id = 'no-span'
        
        return super().format(record)

# En la configuración de logging:
formatter = OTelAwareFormatter(
    '%(asctime)s - %(name)s - [trace_id=%(trace_id)s span_id=%(span_id)s] - %(levelname)s - %(message)s'
)
```

---

## PRIORIDAD 3: MEJORAS (Después de P2)

### 3.1 Rate Limiting Metrics
**Integración slowapi con OpenTelemetry**:
```python
from slowapi import Limiter
from opentelemetry import metrics

limiter_meter = metrics.get_meter("uns_claudejp.backend.ratelimit")
rate_limit_violations = limiter_meter.create_counter(
    name="rate_limit_violations_total",
    description="Total rate limit violations"
)

# En el exception handler de rate limit:
def rate_limit_handler(request, exc):
    rate_limit_violations.add(1, {
        "endpoint": request.url.path,
        "limit": str(exc.detail),
    })
    # ...
```

### 3.2 Cache Performance Metrics
**Agregar en Redis client**:
```python
_cache_hits = _meter.create_counter(
    name="cache_hits_total",
    description="Cache hits"
)
_cache_misses = _meter.create_counter(
    name="cache_misses_total",
    description="Cache misses"
)
_cache_duration = _meter.create_histogram(
    name="cache_operation_duration_seconds",
    unit="s",
    description="Cache operation duration"
)
```

### 3.3 Business Logic Spans
**Agregar custom spans en servicios**:
```python
from opentelemetry import trace

tracer = trace.get_tracer(__name__)

class CandidateService:
    async def create(self, candidate: CandidateCreate) -> CandidateResponse:
        with tracer.start_as_current_span("create_candidate") as span:
            span.set_attribute("candidate.type", "new")
            span.set_attribute("candidate.fields", len(candidate.dict()))
            # ... implementación ...
            span.set_attribute("candidate.created", True)
```

### 3.4 Distributed Tracing Propagation
**Asegurar propagación de trace context en requests externos**:
```python
from opentelemetry.propagate import inject
import httpx

# En hybrid_ocr_service.py
headers = {}
inject(headers)  # Agrega traceparent header

async with httpx.AsyncClient() as client:
    response = await client.get(
        azure_endpoint,
        headers=headers
    )
```

---

## ARCHIVOS A MODIFICAR (RESUMEN)

| Archivo | Cambios | Impacto | Esfuerzo |
|---------|---------|--------|----------|
| `docker/observability/otel-collector-config.yaml` | Agregar exportadores | CRÍTICO | Bajo |
| `docker/observability/prometheus.yml` | Corregir scrape config | CRÍTICO | Bajo |
| `frontend/lib/telemetry.ts` | Implementar OTEL | CRÍTICO | Medio |
| `docker/observability/grafana/dashboards/uns-claudejp.json` | Agregar paneles | IMPORTANTE | Medio |
| `backend/app/core/observability.py` | Agregar custom metrics | IMPORTANTE | Bajo |
| `backend/app/api/monitoring.py` | Health check remoto | IMPORTANTE | Bajo |
| `backend/app/core/logging.py` | Trace correlation | IMPORTANTE | Bajo |
| `backend/requirements.txt` | Nueva dependencia opcional | IMPORTANTE | Muy Bajo |
| `frontend/package.json` | OTEL packages | CRÍTICO | Bajo |

---

## TESTING POST-FIXES

### Verificaciones para cada fix:

1. **OTel Collector**:
   ```bash
   docker logs uns-claudejp-otel | grep "Exporting"
   ```

2. **Tempo**:
   ```bash
   curl http://localhost:3200/status
   # Debe mostrar data en traces
   ```

3. **Prometheus**:
   ```bash
   curl http://localhost:9090/targets
   # Todos los targets deben estar UP
   ```

4. **Grafana**:
   - Dashboard debe mostrar datos en tiempo real
   - Tempo datasource debe resolver trazas
   - Service map debe aparecer

5. **Frontend**:
   - Console sin errores de OTEL
   - Network tab muestra traces siendo enviadas a 4318

---

## LÍNEA DE TIEMPO ESTIMADA

- **Críticas**: 2-3 horas
- **Importantes**: 4-5 horas
- **Mejoras**: 6-8 horas
- **Total**: ~12-16 horas

