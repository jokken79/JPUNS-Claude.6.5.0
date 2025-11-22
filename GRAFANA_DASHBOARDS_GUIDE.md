# 📊 JPUNS Grafana Dashboards - Complete Guide

**Versión**: 1.0
**Fecha**: 2025-11-22
**Estado**: ✅ Guía para crear dashboards en Grafana

---

## 🎯 Visión General

Este documento proporciona instrucciones para crear 5 dashboards esenciales en Grafana que te darán visibilidad total sobre:
- ✅ Salud del sistema
- ✅ Rendimiento de API
- ✅ Métricas de base de datos
- ✅ Efectividad del cache
- ✅ Estado de alertas

---

## 📋 Pre-requisitos

✅ Grafana está corriendo en http://localhost:3001
✅ Usuario admin está creado (admin/admin_password_123)
✅ Prometheus datasource está configurado y conectado
✅ Prometheus está recolectando métricas

---

## 📊 Dashboard 1: System Health Overview

**Propósito**: Vista rápida de la salud general del sistema

### Instrucciones

1. **Accede a Grafana:**
   ```
   http://localhost:3001
   Login: admin / admin_password_123
   ```

2. **Crea nuevo dashboard:**
   - Click en el icono **+** (sidebar)
   - Selecciona **Dashboard > New > New Dashboard**

3. **Panel 1: Service Status (Table)**
   - Click en **Add Panel**
   - En el campo Query, ingresa:
   ```promql
   up
   ```
   - Panel Title: "Service Status"
   - Format: Table
   - Columns: job, instance, value
   - Save

4. **Panel 2: System CPU Usage (Gauge)**
   - Click en **Add Panel**
   - Query:
   ```promql
   100 - (avg(rate(node_cpu_seconds_total{mode="idle"}[5m])) * 100)
   ```
   - Panel Title: "CPU Usage (%)"
   - Visualization: Gauge
   - Max: 100
   - Thresholds: 80, 95 (Yellow, Red)
   - Save

5. **Panel 3: System Memory Usage (Gauge)**
   - Click en **Add Panel**
   - Query:
   ```promql
   (1 - (node_memory_MemAvailable_bytes / node_memory_MemTotal_bytes)) * 100
   ```
   - Panel Title: "Memory Usage (%)"
   - Visualization: Gauge
   - Max: 100
   - Thresholds: 85, 95 (Yellow, Red)
   - Save

6. **Panel 4: Disk Usage (Gauge)**
   - Click en **Add Panel**
   - Query:
   ```promql
   (1 - (node_filesystem_avail_bytes{fstype=~"ext4|xfs"} / node_filesystem_size_bytes{fstype=~"ext4|xfs"})) * 100
   ```
   - Panel Title: "Disk Usage (%)"
   - Visualization: Gauge
   - Max: 100
   - Thresholds: 80, 95 (Yellow, Red)
   - Save

7. **Panel 5: System Status (Stat)**
   - Click en **Add Panel**
   - Query:
   ```promql
   up{job="node"}
   ```
   - Panel Title: "System Up"
   - Visualization: Stat
   - Color: Green (1), Red (0)
   - Save

8. **Guarda el dashboard:**
   - Click en **Save dashboard** (arriba)
   - Name: "System Health Overview"
   - Folder: "General"
   - Click **Save**

---

## 📊 Dashboard 2: API Performance

**Propósito**: Monitorear performance del API backend

### Instrucciones

1. **Crea nuevo dashboard:**
   - Click en **+**
   - **Dashboard > New > New Dashboard**

2. **Panel 1: Request Rate (Graph)**
   - Query:
   ```promql
   rate(http_requests_total[5m])
   ```
   - Panel Title: "Request Rate (req/s)"
   - Visualization: Time series
   - Axes Y-axis label: "Requests/sec"
   - Save

3. **Panel 2: Error Rate (Graph)**
   - Query:
   ```promql
   (rate(http_requests_total{status=~"5.."}[5m]) / rate(http_requests_total[5m])) * 100
   ```
   - Panel Title: "Error Rate (%)"
   - Visualization: Time series
   - Axes Y-axis label: "Error %"
   - Thresholds: Line at 5% (Red)
   - Save

4. **Panel 3: Response Time P95 (Graph)**
   - Query:
   ```promql
   histogram_quantile(0.95, rate(http_request_duration_seconds_bucket[5m]))
   ```
   - Panel Title: "Response Time P95 (s)"
   - Visualization: Time series
   - Axes Y-axis label: "Seconds"
   - Thresholds: Line at 1 second (Warning)
   - Save

5. **Panel 4: Response Time P99 (Graph)**
   - Query:
   ```promql
   histogram_quantile(0.99, rate(http_request_duration_seconds_bucket[5m]))
   ```
   - Panel Title: "Response Time P99 (s)"
   - Visualization: Time series
   - Axes Y-axis label: "Seconds"
   - Save

6. **Panel 5: Active Requests (Stat)**
   - Query:
   ```promql
   http_requests_total - http_requests_total offset 1m
   ```
   - Panel Title: "Active Requests"
   - Visualization: Stat
   - Color Mode: Background
   - Save

7. **Panel 6: Endpoint Breakdown (Table)**
   - Query:
   ```promql
   topk(10, rate(http_requests_total[5m]))
   ```
   - Panel Title: "Top Endpoints (by rate)"
   - Visualization: Table
   - Save

8. **Guarda dashboard:**
   - Name: "API Performance"

---

## 📊 Dashboard 3: Database Metrics

**Propósito**: Monitorear salud y performance de PostgreSQL

### Instrucciones

1. **Crea nuevo dashboard:**
   - Click en **+**
   - **Dashboard > New > New Dashboard**

2. **Panel 1: DB Connection Count (Gauge)**
   - Query:
   ```promql
   pg_stat_activity_count
   ```
   - Panel Title: "Active Connections"
   - Visualization: Gauge
   - Max: 100
   - Thresholds: 80, 95
   - Save

3. **Panel 2: DB Query Performance (Graph)**
   - Query:
   ```promql
   rate(pg_stat_statements_mean_time[5m])
   ```
   - Panel Title: "Query Time (ms)"
   - Visualization: Time series
   - Axes Y-axis label: "Milliseconds"
   - Thresholds: Line at 100ms
   - Save

4. **Panel 3: Slow Queries Count (Stat)**
   - Query:
   ```promql
   pg_slow_queries_total
   ```
   - Panel Title: "Slow Queries (>1s)"
   - Visualization: Stat
   - Color Mode: Value
   - Save

5. **Panel 4: Database Size (Gauge)**
   - Query:
   ```promql
   pg_database_size_bytes / 1024 / 1024 / 1024
   ```
   - Panel Title: "Database Size (GB)"
   - Visualization: Gauge
   - Unit: decbytes
   - Save

6. **Panel 5: Table Scan Count (Graph)**
   - Query:
   ```promql
   rate(pg_stat_user_tables_seq_scan[5m])
   ```
   - Panel Title: "Sequential Scans/sec"
   - Visualization: Time series
   - Save

7. **Panel 6: Connections by State (Pie)**
   - Query:
   ```promql
   pg_stat_activity_count_by_state
   ```
   - Panel Title: "Connections by State"
   - Visualization: Pie chart
   - Save

8. **Guarda dashboard:**
   - Name: "Database Metrics"

---

## 📊 Dashboard 4: Cache Performance

**Propósito**: Monitorear Redis cache effectiveness

### Instrucciones

1. **Crea nuevo dashboard:**
   - Click en **+**
   - **Dashboard > New > New Dashboard**

2. **Panel 1: Cache Hit Rate (Gauge)**
   - Query:
   ```promql
   redis_keyspace_hits_total / (redis_keyspace_hits_total + redis_keyspace_misses_total)
   ```
   - Panel Title: "Cache Hit Rate (%)"
   - Visualization: Gauge
   - Max: 100
   - Unit: Percent (0-100)
   - Thresholds: 30, 50
   - Save

3. **Panel 2: Hit vs Miss Rate (Graph)**
   - Query A:
   ```promql
   rate(redis_keyspace_hits_total[5m])
   ```
   - Legend: "Hits/s"
   - Query B:
   ```promql
   rate(redis_keyspace_misses_total[5m])
   ```
   - Legend: "Misses/s"
   - Panel Title: "Hit vs Miss Rate"
   - Visualization: Time series
   - Save

4. **Panel 3: Memory Usage (Gauge)**
   - Query:
   ```promql
   redis_memory_used_bytes / 1024 / 1024
   ```
   - Panel Title: "Memory Usage (MB)"
   - Visualization: Gauge
   - Unit: decbytes
   - Max: 2048
   - Save

5. **Panel 4: Connected Clients (Stat)**
   - Query:
   ```promql
   redis_connected_clients
   ```
   - Panel Title: "Connected Clients"
   - Visualization: Stat
   - Color Mode: Value
   - Save

6. **Panel 5: Evictions (Graph)**
   - Query:
   ```promql
   rate(redis_evicted_keys_total[5m])
   ```
   - Panel Title: "Evictions/sec"
   - Visualization: Time series
   - Save

7. **Panel 6: Key Expiration (Stat)**
   - Query:
   ```promql
   rate(redis_expired_keys_total[5m])
   ```
   - Panel Title: "Key Expiration/sec"
   - Visualization: Stat
   - Save

8. **Guarda dashboard:**
   - Name: "Cache Performance"

---

## 📊 Dashboard 5: Alerts Status

**Propósito**: Ver estado actual y histórico de alertas

### Instrucciones

1. **Crea nuevo dashboard:**
   - Click en **+**
   - **Dashboard > New > New Dashboard**

2. **Panel 1: Active Alerts Count (Stat)**
   - Query:
   ```promql
   count(ALERTS)
   ```
   - Panel Title: "Active Alerts"
   - Visualization: Stat
   - Color: Red
   - Save

3. **Panel 2: Critical Alerts (Stat)**
   - Query:
   ```promql
   count(ALERTS{severity="critical"})
   ```
   - Panel Title: "Critical Alerts"
   - Visualization: Stat
   - Color: Dark Red
   - Save

4. **Panel 3: Warning Alerts (Stat)**
   - Query:
   ```promql
   count(ALERTS{severity="warning"})
   ```
   - Panel Title: "Warning Alerts"
   - Visualization: Stat
   - Color: Orange
   - Save

5. **Panel 4: Alert Firing Timeline (Graph)**
   - Query:
   ```promql
   ALERTS
   ```
   - Panel Title: "Alert Firing Timeline"
   - Visualization: Time series
   - Save

6. **Panel 5: Alerts by Severity (Pie)**
   - Query:
   ```promql
   count by (severity) (ALERTS)
   ```
   - Panel Title: "Alerts by Severity"
   - Visualization: Pie chart
   - Save

7. **Panel 6: Alerts by Job (Table)**
   - Query:
   ```promql
   ALERTS
   ```
   - Panel Title: "Alert Details"
   - Visualization: Table
   - Columns: alertname, severity, job, instance
   - Save

8. **Guarda dashboard:**
   - Name: "Alerts Status"

---

## 🎨 Personalización Avanzada

### Añadir Variables a Dashboards

**Ejemplo: Variable de Job (para filtrar por servicio)**

1. Click en **Settings** (⚙️) arriba del dashboard
2. Click en **Variables**
3. Click en **New variable**
4. Configuración:
   - Name: `job`
   - Label: "Job"
   - Type: Query
   - Data source: Prometheus
   - Query: `label_values(up, job)`
   - Refresh: "On time range change"
5. Click **Add**

### Usar Variables en Queries

En cualquier panel, usa `$job` para referenciar la variable:

```promql
rate(http_requests_total{job="$job"}[5m])
```

---

## 📌 Alertas en Dashboards

### Añadir Alert a un Panel

1. En el panel, click en el icono **Alert** (campana)
2. Click en **Create alert rule**
3. Configura:
   - **Condition**: Cuando la métrica > 80
   - **Evaluation interval**: 1m
   - **For**: 5m
   - **Annotations**: Mensaje descriptivo
4. Click **Save**

---

## 💾 Exportar/Importar Dashboards

### Exportar Dashboard

1. En tu dashboard, click en **Settings** (⚙️)
2. Click en **JSON model**
3. Copia todo el JSON
4. Guarda en archivo: `dashboard-export.json`

### Importar Dashboard

1. Click en **+**
2. **Dashboard > New > Import**
3. Pega el JSON o carga el archivo
4. Selecciona Prometheus datasource
5. Click **Import**

---

## 🎯 Best Practices

### 1. Organización de Dashboards

```
📊 Grafana Dashboards Structure
├── 🏥 System Health Overview
│   └── CPU, Memory, Disk, Service Status
├── ⚡ API Performance
│   └── Request rate, Error rate, Response time
├── 🗄️ Database Metrics
│   └── Connections, Query time, Slow queries
├── 💾 Cache Performance
│   └── Hit rate, Memory, Evictions
└── 🔔 Alerts Status
    └── Active alerts, Alert timeline
```

### 2. Colores y Thresholds

```
🟢 Green:  Healthy (< 50%)
🟡 Yellow: Warning (50-80%)
🔴 Red:    Critical (> 80%)
```

### 3. Naming Convention

```
✅ BUENO:
- "CPU Usage (%)"
- "Request Rate (req/s)"
- "Error Rate (%)"

❌ MALO:
- "cpu"
- "requests"
- "errors"
```

### 4. Refresh Intervals

```
- Real-time monitoring: 30s
- General dashboards: 1m
- Historical analysis: 5m o 15m
```

---

## 📈 Dashboards Avanzados

### Dashboard de Yukyu Específico

**Crear dashboard para monitorear endpoints específicos de Yukyu:**

1. **Panel 1: Yukyu Trends Monthly - Response Time**
   ```promql
   histogram_quantile(0.95, rate(http_request_duration_seconds_bucket{path="/api/dashboard/yukyu-trends-monthly"}[5m]))
   ```

2. **Panel 2: Yukyu Compliance Status - Request Rate**
   ```promql
   rate(http_requests_total{path="/api/dashboard/yukyu-compliance-status"}[5m])
   ```

3. **Panel 3: Yukyu Cache Hit Rate**
   ```promql
   redis_keyspace_hits_total{endpoint="yukyu"} / (redis_keyspace_hits_total{endpoint="yukyu"} + redis_keyspace_misses_total{endpoint="yukyu"})
   ```

4. **Panel 4: Yukyu Endpoint Availability**
   ```promql
   up{job="jpuns-backend"} and rate(http_requests_total{path=~"/api/dashboard/yukyu.*"}[5m]) > 0
   ```

---

## 🔄 Sincronizar Paneles

### Link Dashboards

1. En Panel, click en **Panel menu** (...)
2. **Navigate to external link**
3. Crea link a otro dashboard:
   ```
   https://localhost:3001/d/dashboard-id?var-job=${job}
   ```

---

## 🚀 Automatización

### API de Grafana

**Crear dashboard vía API:**

```bash
curl -X POST http://localhost:3001/api/dashboards/db \
  -H "Authorization: Bearer $GRAFANA_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "dashboard": {
      "title": "API Performance",
      "panels": [...]
    }
  }'
```

---

## 📞 Troubleshooting

### Dashboard no muestra datos

1. **Verifica Prometheus datasource:**
   - Settings > Data Sources > Prometheus
   - Click "Test" debe mostrar ✅

2. **Verifica query en Prometheus:**
   - Ve a http://localhost:9090
   - Ingresa la query en el campo search
   - Debe mostrar resultados

3. **Verifica targets up:**
   - En Prometheus, ve a http://localhost:9090/targets
   - Todos deben estar "UP"

### Panel tarda en cargar

1. Reduce el time range
2. Reduce la resolución de la query
3. Agrega límite: `topk(100, metric)`

---

## ✅ Checklist Final

- [ ] Todos los 5 dashboards creados
- [ ] Prometheus datasource conectado
- [ ] Variables configuradas
- [ ] Thresholds y colores aplicados
- [ ] Dashboards guarenados
- [ ] Alerts configuradas en paneles críticos
- [ ] Dashboard compartido con equipo

---

**Documento Version**: 1.0
**Última Actualización**: 2025-11-22
**Estado**: ✅ GUÍA COMPLETA PARA DASHBOARDS
