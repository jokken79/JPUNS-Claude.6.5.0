# 🚀 JPUNS Monitoring Stack - Quick Start Guide

**Versión**: 1.0
**Fecha**: 2025-11-22
**Estado**: ✅ Listo para producción

---

## ⚡ Inicio Rápido (5 minutos)

### Paso 1: Verifica que Docker está instalado

```bash
docker --version
docker-compose --version
```

**Salida esperada:**
```
Docker version 24.0.0 (or newer)
Docker Compose version 2.20.0 (or newer)
```

### Paso 2: Inicia la pila de monitoreo

```bash
cd monitoring
docker-compose up -d
```

**Salida esperada:**
```
Creating jpuns-prometheus ... done
Creating jpuns-grafana ... done
Creating jpuns-alertmanager ... done
Creating jpuns-node-exporter ... done
Creating jpuns-postgres-exporter ... done
Creating jpuns-redis-exporter ... done
Creating jpuns-postgres-monitoring ... done
Creating jpuns-redis-monitoring ... done
```

### Paso 3: Verifica que todos los servicios estén corriendo

```bash
docker-compose ps
```

**Salida esperada:**
```
NAME                        STATUS
jpuns-prometheus            Up (healthy)
jpuns-grafana               Up (healthy)
jpuns-alertmanager          Up (healthy)
jpuns-node-exporter         Up
jpuns-postgres-exporter     Up
jpuns-redis-exporter        Up
jpuns-postgres-monitoring   Up
jpuns-redis-monitoring      Up
```

### Paso 4: Accede a los servicios

| Servicio | URL | Usuario | Contraseña |
|----------|-----|---------|-----------|
| **Prometheus** | http://localhost:9090 | - | - |
| **Grafana** | http://localhost:3001 | admin | admin_password_123 |
| **Alertmanager** | http://localhost:9093 | - | - |

---

## 🔍 Verificación de Servicios

### Ver logs de un servicio

```bash
# Prometheus
docker-compose logs jpuns-prometheus

# Grafana
docker-compose logs jpuns-grafana

# Alertmanager
docker-compose logs jpuns-alertmanager
```

### Probar conectividad con Prometheus

```bash
curl http://localhost:9090/-/healthy
# Salida: Prometheus is Healthy.
```

### Probar conectividad con Grafana

```bash
curl http://localhost:3001/api/health
# Salida: {"status":"ok"}
```

### Ver targets en Prometheus

```bash
curl http://localhost:9090/api/v1/targets | python -m json.tool
```

---

## 📊 Primeros Pasos en Grafana

### 1. Inicia sesión en Grafana

```
URL: http://localhost:3001
Usuario: admin
Contraseña: admin_password_123
```

### 2. Cambia la contraseña (RECOMENDADO)

- Ve a: **Settings (⚙️) > Users > Change password**
- Ingresa nueva contraseña segura

### 3. Agrega Prometheus como Data Source

**Pasos:**
1. Ve a: **Settings (⚙️) > Data Sources > Add data source**
2. Selecciona **Prometheus**
3. URL: `http://jpuns-prometheus:9090`
4. Click en **Save & Test**

**Resultado esperado:** "✅ Data source is working"

### 4. Crea tu primer dashboard

**Opción A: Dashboard simple (2 minutos)**

1. Ve a: **Dashboards > New > New Dashboard**
2. Click en **Add Panel**
3. En Query A, ingresa: `up` (métrica de health check)
4. Click **Save Dashboard**
5. Dale un nombre: "System Health Overview"

**Opción B: Usar dashboard prediseñado (5 minutos)**

1. Ve a: **Dashboards > New > Import**
2. Ingresa ID de dashboard: **1860** (Node Exporter for Prometheus)
3. Selecciona Prometheus como data source
4. Click **Import**

---

## 🔔 Configurar Notificaciones Slack (10 minutos)

### 1. Crea un Webhook Incoming en Slack

**Pasos:**
1. Ve a: https://api.slack.com/messaging/webhooks
2. Click en **Create New App** > **From scratch**
3. Nombre: `JPUNS Alerts`
4. Selecciona tu workspace
5. Ve a: **Incoming Webhooks** > **Add New Webhook to Workspace**
6. Selecciona canal: `#alerts` (o crea uno nuevo)
7. Copia la URL del webhook (se parece a: `https://hooks.slack.com/services/...`)

### 2. Configura Alertmanager con Slack

**Edita:** `monitoring/alertmanager.yml`

```yaml
global:
  resolve_timeout: 5m
  slack_api_url: 'https://hooks.slack.com/services/YOUR/WEBHOOK/URL'  # ← REEMPLAZA ESTO

route:
  receiver: 'default'
  group_by: ['alertname', 'cluster']
  group_wait: 30s
  group_interval: 5m
  repeat_interval: 12h
  routes:
    - match:
        severity: critical
      receiver: 'critical'
      group_wait: 0s

receivers:
  - name: 'default'
    slack_configs:
      - channel: '#alerts'
        title: '⚠️ {{ .GroupLabels.alertname }}'
  - name: 'critical'
    slack_configs:
      - channel: '#critical-alerts'
        title: '🚨 [CRÍTICO] {{ .GroupLabels.alertname }}'
```

### 3. Reinicia Alertmanager

```bash
docker-compose restart jpuns-alertmanager
```

### 4. Prueba la integración

```bash
# Envía un mensaje de prueba a Slack
curl -X POST -H 'Content-type: application/json' \
  --data '{"text":"✅ Test message from Alertmanager"}' \
  https://hooks.slack.com/services/YOUR/WEBHOOK/URL
```

---

## 📈 Viendo Métricas en Prometheus

### Queries útiles de Prometheus

**Health Check de servicios:**
```promql
up
```

**Tasa de error del API:**
```promql
rate(http_requests_total{status=~"5.."}[5m])
```

**Tiempo de respuesta del API (percentil 95):**
```promql
histogram_quantile(0.95, rate(http_request_duration_seconds_bucket[5m]))
```

**Uso de CPU:**
```promql
100 - (avg(rate(node_cpu_seconds_total{mode="idle"}[5m])) * 100)
```

**Uso de memoria (%):**
```promql
(1 - (node_memory_MemAvailable_bytes / node_memory_MemTotal_bytes)) * 100
```

**Conexiones activas a PostgreSQL:**
```promql
pg_stat_activity_count
```

**Hit rate de Redis:**
```promql
redis_keyspace_hits_total / (redis_keyspace_hits_total + redis_keyspace_misses_total)
```

---

## 🚨 Monitorear Alerts

### Accede a Alertmanager

```
http://localhost:9093
```

### Ver reglas de alertas en Prometheus

```
http://localhost:9090/alerts
```

### Triggers de alerts incluidos

**Críticos (Acción inmediata):**
- ✅ Base de datos caída
- ✅ API backend caída
- ✅ Tasa de error > 5%
- ✅ Tiempo de respuesta > 5s
- ✅ CPU > 95%
- ✅ Memoria > 95%

**Warnings (Monitorear):**
- ✅ Tasa de error > 1%
- ✅ Tiempo de respuesta > 1s
- ✅ CPU > 80%
- ✅ Memoria > 85%
- ✅ Hit rate Redis < 30%
- ✅ Conexiones DB > 80%

---

## 🔧 Operaciones Comunes

### Detener la pila de monitoreo

```bash
cd monitoring
docker-compose stop
```

### Reiniciar un servicio específico

```bash
docker-compose restart jpuns-prometheus
docker-compose restart jpuns-grafana
docker-compose restart jpuns-alertmanager
```

### Ver estadísticas en tiempo real

```bash
docker stats
```

### Limpiar datos (ADVERTENCIA: borrará todas las métricas)

```bash
docker-compose down -v
```

### Ver volúmenes de datos

```bash
docker volume ls | grep monitoring
```

---

## ⚠️ Troubleshooting

### Prometheus no scraping targets

**Problema:** En http://localhost:9090/targets ves "DOWN"

**Solución:**
```bash
# 1. Verifica logs
docker logs jpuns-prometheus | grep ERROR

# 2. Verifica que los targets están accesibles
curl http://localhost:8000/metrics   # Backend
curl http://localhost:9187/metrics   # PostgreSQL exporter
curl http://localhost:9121/metrics   # Redis exporter
curl http://localhost:9100/metrics   # Node exporter

# 3. Si alguno falla, verifica que está corriendo:
docker ps | grep jpuns
```

### Grafana no muestra datos

**Problema:** Dashboard vacío

**Solución:**
1. Verifica que Prometheus datasource está connected
2. Navega a **Settings > Data Sources > Prometheus**
3. Click en **Test**
4. Debería mostrar: "✅ Data source is working"

### Alertmanager no enviando a Slack

**Problema:** Alertas no llegan a Slack

**Solución:**
```bash
# 1. Verifica logs
docker logs jpuns-alertmanager | grep -i slack

# 2. Verifica que el webhook URL es correcto
cat monitoring/alertmanager.yml | grep slack_api_url

# 3. Prueba el webhook manualmente
curl -X POST -H 'Content-type: application/json' \
  --data '{"text":"Test"}' \
  https://hooks.slack.com/services/YOUR/WEBHOOK/URL
```

### Alto uso de disco

**Problema:** Prometheus usando mucho espacio

**Solución:**
```bash
# 1. Ver tamaño de data
docker exec jpuns-prometheus du -sh /prometheus

# 2. Cambiar retención (edit docker-compose.yml)
# Agregar a Prometheus command:
#   - '--storage.tsdb.retention.time=7d'  # Cambiar de 30d a 7d

# 3. Reinicia Prometheus
docker-compose restart jpuns-prometheus
```

---

## 📝 Próximos Pasos

### Corto Plazo (Hoy)
- [ ] Verifica que todos los servicios están UP
- [ ] Accede a Grafana y prueba una query
- [ ] Configura Slack webhook para alertas

### Mediano Plazo (Esta semana)
- [ ] Crea 5 dashboards Grafana recomendados:
  1. System Health Overview
  2. API Performance
  3. Database Metrics
  4. Cache Performance
  5. Alert Status
- [ ] Prueba firing de alerts manualmente
- [ ] Documenta runbooks para alerts críticos

### Largo Plazo (Este mes)
- [ ] Entrena al equipo ops en Prometheus/Grafana
- [ ] Establece thresholds de alerts basados en SLA
- [ ] Implementa automated dashboards updates
- [ ] Configura auto-remediation para alerts comunes

---

## 📞 Comandos de Emergencia

```bash
# Verifica salud de todo el stack
docker-compose ps

# Reconstruye stack desde scratch (DESTRUCTIVO)
docker-compose down -v
docker-compose up -d

# Limpia espacio (borra contenedores stopped)
docker container prune -f

# Exporta metrics a archivo
curl http://localhost:9090/api/v1/query?query=up > metrics_backup.json

# Accede a shell de Prometheus
docker exec -it jpuns-prometheus /bin/sh

# Accede a shell de PostgreSQL (para debugging)
docker exec -it jpuns-postgres-monitoring psql -U postgres -d jpuns_monitoring
```

---

## ✅ Checklist de Producción

- [ ] Docker y docker-compose instalados
- [ ] `monitoring/` directorio en el lugar correcto
- [ ] Todos los servicios en estado UP
- [ ] Prometheus scrapeando targets correctamente
- [ ] Grafana accesible y Prometheus conectado
- [ ] Slack webhook configurado en Alertmanager
- [ ] Al menos 1 dashboard de Grafana creado
- [ ] Prueba de alert manual completada
- [ ] Logs monitoreados regularmente
- [ ] Datos siendo retentioned correctamente (30 días)

---

## 🎓 Recursos Adicionales

- **Prometheus Docs:** https://prometheus.io/docs
- **Grafana Docs:** https://grafana.com/docs
- **Alertmanager Docs:** https://prometheus.io/docs/alerting/latest/alertmanager
- **PromQL Tutorial:** https://prometheus.io/docs/prometheus/latest/querying/basics/

---

**Documento Version**: 1.0
**Última Actualización**: 2025-11-22
**Estado**: ✅ LISTO PARA PRODUCCIÓN
