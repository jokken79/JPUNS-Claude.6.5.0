# FLUJOS DE DATOS: Stack de Observabilidad

## ESTADO ACTUAL (ROTO)

### Backend → Collector → X (Se pierde)
```
┌─────────────────┐
│  Backend (Fapi) │
│  :8000          │
└────────┬────────┘
         │
         │ OpenTelemetry SDK
         │ gRPC (4317)
         │
         v
┌─────────────────────────────────────┐
│   OTel Collector (0.103.0)          │
│   - Receivers: ✅ OTLP gRPC+HTTP    │
│   - Processors: ✅ Batch            │
│   - Exporters: ❌ SOLO logging      │
└────────┬────────────────────────────┘
         │
         │ logging exporter
         │
         v
    /dev/null ❌  ← Las trazas se pierden
    (solo logs en stderr)
```

### Prometheus Scraping (FALLA)
```
┌──────────────────────┐
│  Prometheus:9090     │
│  scrape_configs:     │
│  - otel-collector:8888 ← ❌ PUERTO NO EXISTE
└──────────────────────┘
         │
         │ (falla)
         v
   [DOWN TARGET] ❌
```

### Tempo (AISLADO)
```
┌──────────────────────┐
│  Tempo:3200          │
│  Receivers:          │
│  - OTLP:4317         │  ← ✅ Escuchando
│  - OTLP HTTP:4318    │  ← ✅ Escuchando
│  Storage: local ✅   │
└──────────────────────┘
         │
         │ Ningún dato entrante
         │ (collector no envía aquí)
         v
   VACÍO ❌
```

### Grafana (CIEGO)
```
┌──────────────────────┐
│  Grafana:3001        │
│  Datasources:        │
│  - Prometheus ❌ sin datos
│  - Tempo ❌ sin datos
└──────────────────────┘
```

### Frontend (DESCONECTADO)
```
┌──────────────────────┐
│  Frontend (Next.js)  │
│  :3000               │
│  - OpenTelemetry     │
│    ❌ DESHABILITADO
└──────────────────────┘
```

---

## ESTADO ESPERADO (DESPUÉS DE FIXES)

### Backend → Collector → Storage
```
┌────────────────────────────────────┐
│         Backend (FastAPI)          │
│  - FastAPI Instrumentor ✅         │
│  - SQLAlchemy Instrumentor ✅      │
│  - Custom OCR Metrics ✅           │
│  - RequestsInstrumentor ✅         │
│  - LoggingInstrumentor ✅          │
└─────────────┬──────────────────────┘
              │
              │ OpenTelemetry SDK
              │ - Traces (gRPC:4317)
              │ - Metrics (gRPC:4317)
              │
              v
┌──────────────────────────────────────────┐
│    OTel Collector (0.103.0) FIXED        │
├──────────────────────────────────────────┤
│ Receivers:                               │
│   ✅ OTLP gRPC (4317)                   │
│   ✅ OTLP HTTP (4318)                   │
├──────────────────────────────────────────┤
│ Processors:                              │
│   ✅ Batch processing                   │
├──────────────────────────────────────────┤
│ Exporters:                               │
│   ✅ logging                            │ → stderr (debug)
│   ✅ otlp (temporal) → Tempo            │
│   ✅ prometheusremotewrite → Prometheus│
└─┬─────────────────────────────┬─────────┘
  │                             │
  │ Traces                      │ Metrics
  │ (OTLP Exporter)            │ (Prom Remote Write)
  │                             │
  v                             v
┌────────────────┐        ┌─────────────────┐
│ Tempo:3200     │        │ Prometheus:9090 │
│ - WAL ✅       │        │ - TSDB ✅       │
│ - Storage ✅   │        │ - Scrape ✅     │
│ - Retention ✅ │        │ - Query ✅      │
└────────┬───────┘        └────────┬────────┘
         │                         │
         │ Traces Query API        │ Metrics Query API
         │                         │
         └────────────┬────────────┘
                      │
                      v
           ┌──────────────────────┐
           │  Grafana:3001        │
           │  - Prometheus DS ✅  │
           │  - Tempo DS ✅       │
           │  - Service Map ✅    │
           │  - Dashboards ✅     │
           │  - Alerts ✅ (future)│
           └──────────────────────┘
```

### Frontend → Collector
```
┌────────────────────────────────────┐
│  Frontend (Next.js 16) FIXED       │
│  - WebTracerProvider ✅            │
│  - FetchInstrumentation ✅         │
│  - DocumentLoadInstrumentation ✅  │
│  - OTLP HTTP Exporter ✅           │
└─────────────┬──────────────────────┘
              │
              │ Traces (HTTP:4318)
              │
              v
    [al mismo OTel Collector]
         │
         └─→ Tempo
              └─→ Grafana
```

---

## COMPARATIVA: MÉTRICA vs TRACE

### Métrica (Prometheus)
```
Backend                        Prometheus
  │                                │
  │ Counter: ocr_requests_total    │
  │ Gauge: queue_length            │
  │ Histogram: request_latency     │
  │                                │
  v                                v
[Prometheus Instrumentator]   [TSDB Storage]
  │                                │
  │ /metrics endpoint              │ Query engine
  │ (cada 15s scrape)              │
  │                                v
  └──────────────────────────> [Grafana]
                               Time-series graphs
```

### Trace (Tempo)
```
Backend                        Tempo
  │                                │
  │ Span: create_candidate         │
  │   - Duration: 145ms            │
  │   - Attributes: {type: new}    │
  │   - Child spans: 3             │
  │                                │
  v                                v
[OpenTelemetry SDK]          [WAL + Storage]
  │                                │
  │ gRPC OTLP                      │ Trace ID index
  │ (batch, 60s interval)          │ Query engine
  │                                │
  └──────────────────────────> [Grafana]
                               Service map, traces
```

---

## SECUENCIA: Request OCR End-to-End

### ACTUAL (Parcial)
```
1. Frontend: User sube documento
   └─> Backend: POST /api/azure-ocr/process-document ✅
       └─> Backend: record_ocr_request() ✅
           └─> Meter: ocr_requests_total += 1 ✅
           └─> OpenTelemetry SDK: ✅ (interno)
               └─> OTLP gRPC: Envía al Collector ✅
                   └─> Collector logging: imprime en stderr ✅
                   └─> Collector exporters: ❌ NO HACE NADA
                       └─> Tempo: ❌ No recibe
                       └─> Prometheus: ❌ No recibe
                   
2. Grafana
   └─> Prometheus query: ❌ "No data"
   └─> Tempo query: ❌ "No traces found"
```

### ESPERADO (Completo)
```
1. Frontend: User sube documento
   └─> useTelemetry() inicia tracing ✅
       └─> span.start("fetch_document") ✅
   
2. Frontend → Backend
   └─> fetch con headers de trace ✅
       └─> OTel Collector recibe trace ✅
   
3. Backend: POST /api/azure-ocr/process-document ✅
   └─> FastAPI Instrumentor crea span ✅
   └─> record_ocr_request() ✅
       └─> Meter: ocr_requests_total += 1 ✅
       └─> Histogram: ocr_processing_seconds.record(0.145) ✅
   
4. OpenTelemetry SDK
   └─> OTLP gRPC export (batch)
       └─> OTel Collector
           ├─> logging: stderr ✅ (debug)
           ├─> otlp exporter: → Tempo ✅
           │   └─> Tempo: span guardado ✅
           │       └─> /var/tempo/blocks/ ✅
           │
           └─> prometheusremotewrite: → Prometheus ✅
               └─> Prometheus: métrica guardada ✅
                   └─> /prometheus/wal/ ✅
   
5. Prometheus scrape (cada 15s)
   └─> GET backend:8000/metrics ✅
       └─> prometheus-fastapi-instrumentator ✅
           └─> http_requests_total ✅
           └─> http_request_duration_seconds ✅
           └─> http_requests_in_progress ✅
   
6. Grafana Dashboard
   └─> Prometheus Query
       └─> sum(rate(ocr_requests_total[5m])) ✅
           └─> "2.5 requests/sec" ✅
   
   └─> Tempo Query
       └─> trace_id: "abc123..."
           ├─> Span: "POST /api/azure-ocr/process-document"
           │   ├─> Duration: 145ms
           │   ├─> Status: OK
           │   │
           │   └─> Child Spans:
           │       ├─> "azure_ocr_process" (140ms)
           │       ├─> "json_response" (2ms)
           │       └─> "logging" (1ms)
           │
           └─> Service Map
               ├─> Frontend → Backend ✅
               └─> Backend → Azure OCR API ✅
```

---

## VALIDACIÓN DE CONEXIONES

### Antes de arreglarlo
```bash
# Backend metrics endpoint
curl http://localhost:8000/metrics
# ✅ Retorna Prometheus format (funciona)

# OTel Collector health
curl http://otel-collector:13133
# ✅ 200 OK (escuchando)

# Prometheus targets
curl http://localhost:9090/api/v1/targets
# ❌ otel-collector:8888 → DOWN
# ❌ backend:8000 → NO CONFIGURADO

# Tempo traces
curl http://localhost:3200/api/traces/\?limit=10
# ❌ 404 o vacío (no hay traces)

# Prometheus scrape test
curl -v http://localhost:9090/metrics | head -20
# ✅ Retorna métricas de Prometheus (pero de sí mismo)

# Grafana dashboards
curl http://localhost:3001/api/search\?query=UNS
# ✅ Dashboard existe pero sin datos
```

### Después de arreglarlo
```bash
# Prometheus targets (todos UP)
curl http://localhost:9090/api/v1/targets | jq '.data.activeTargets[] | {job: .job, state: .state}'
# ✅ backend-metrics: UP
# ✅ prometheus: UP

# Prometheus métricas de OCR
curl 'http://localhost:9090/api/v1/query?query=increase(ocr_requests_total[5m])'
# ✅ vector=[value, timestamp]

# Tempo traces
curl 'http://localhost:3200/api/traces?limit=10' 
# ✅ traces: [{traceID, ..., spans: [...]}]

# Grafana queries
curl 'http://localhost:3001/api/ds/query'
# ✅ Prometheus: data returned
# ✅ Tempo: traces returned
```

---

## TROUBLESHOOTING RÁPIDO

| Sintoma | Causa | Fix |
|---------|-------|-----|
| Prometheus targets DOWN | Collector no en 8888 | Corregir prometheus.yml |
| Sin datos en Grafana | Collector sin exportadores | Corregir otel-collector-config.yaml |
| Sin traces en Tempo | Collector no exporta OTLP | Agregar otlp exporter |
| Frontend no envía telemetría | Paquetes no instalados | npm install + inicializar |
| Logs sin trace_id | Logging no integrado | Agregar OTelAwareFormatter |
| Health check sin remote status | Endpoint no valida remotes | Agregar check_remote_service() |

