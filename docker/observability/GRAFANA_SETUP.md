# Grafana Setup Guide for UNS-ClaudeJP 6.5.0

## Overview

This guide provides comprehensive instructions for setting up Grafana monitoring dashboards for the UNS-ClaudeJP HR application. The setup includes system metrics, payroll monitoring, OCR performance tracking, and database health monitoring.

## Table of Contents

1. [Initial Setup](#initial-setup)
2. [Datasource Configuration](#datasource-configuration)
3. [Dashboard Installation](#dashboard-installation)
4. [Alert Configuration](#alert-configuration)
5. [Slack/Email Integration](#slackemail-integration)
6. [Troubleshooting](#troubleshooting)

---

## Initial Setup

### 1. Access Grafana

Grafana is accessible at: **http://localhost:3001**

**Default Credentials:**
- Username: Set via `GRAFANA_ADMIN_USER` in `.env` file
- Password: Set via `GRAFANA_ADMIN_PASSWORD` in `.env` file

### 2. Verify Services are Running

```bash
# Check all observability services are healthy
docker compose ps

# Expected services:
# - grafana (port 3001)
# - prometheus (port 9090)
# - tempo (port 3200)
# - otel-collector (ports 4317, 4318)
# - db (PostgreSQL, port 5432)
# - redis (port 6379)
```

### 3. Initial Login

1. Navigate to http://localhost:3001
2. Enter admin credentials from `.env` file
3. You'll be directed to the Grafana home page

---

## Datasource Configuration

Grafana datasources are automatically provisioned from `/docker/observability/grafana/provisioning/datasources/datasources.yaml`.

### Pre-configured Datasources

#### 1. Prometheus (Default)
- **Name**: Prometheus
- **Type**: prometheus
- **URL**: http://prometheus:9090
- **Status**: ✅ Auto-provisioned

**Test Connection:**
```bash
# From Grafana UI: Configuration → Data Sources → Prometheus → Save & Test
```

#### 2. Tempo (Distributed Tracing)
- **Name**: Tempo
- **Type**: tempo
- **URL**: http://tempo:3200
- **Status**: ✅ Auto-provisioned

**Test Connection:**
```bash
# From Grafana UI: Configuration → Data Sources → Tempo → Save & Test
```

### Manual Datasource Configuration

#### 3. PostgreSQL (Database Metrics)

**Purpose**: Query database tables directly for payroll metrics, employee data, and table sizes.

**Configuration Steps:**

1. **Navigate**: Configuration → Data Sources → Add data source
2. **Select**: PostgreSQL
3. **Configure**:
   - **Name**: `PostgreSQL-UNS`
   - **Host**: `db:5432`
   - **Database**: `${POSTGRES_DB}` (from .env, typically `uns_claudejp`)
   - **User**: `${POSTGRES_USER}` (from .env)
   - **Password**: `${POSTGRES_PASSWORD}` (from .env)
   - **SSL Mode**: `disable` (internal Docker network)
   - **Version**: `15.x`
   - **TimescaleDB**: `disabled`
   - **Min time interval**: `1m`

4. **Save & Test**: Click "Save & Test" button

**Verification Query:**
```sql
SELECT COUNT(*) as employee_count FROM employee;
```

#### 4. Redis (Cache Metrics)

**Purpose**: Monitor Redis cache performance and key statistics.

**Note**: Grafana doesn't have native Redis support. We'll use Prometheus with future redis_exporter or query Redis via backend API.

**Alternative Approach**:
- Install Redis Data Source plugin (optional)
- Or use Prometheus metrics from future redis_exporter

**To install Redis plugin (optional):**
```bash
# Execute in Grafana container
docker exec -it uns-claudejp-650-grafana grafana-cli plugins install redis-datasource
docker restart uns-claudejp-650-grafana
```

Then configure:
- **Name**: `Redis-UNS`
- **Address**: `redis://redis:6379`
- **ACL**: (leave empty for default)

---

## Dashboard Installation

Dashboards are automatically provisioned from `/docker/observability/grafana/dashboards/` directory.

### Available Dashboards

1. **Backend Metrics** (`backend-metrics.json`) - ✅ Pre-installed
2. **General System Dashboard** (`system-overview.json`) - 📋 New
3. **Payroll Monitoring** (`payroll-dashboard.json`) - 📋 New
4. **OCR Performance** (`ocr-dashboard.json`) - 📋 New
5. **Database Health** (`database-dashboard.json`) - 📋 New

### Import Dashboards (Manual Method)

If you need to manually import a dashboard:

1. **Navigate**: Dashboards → Import
2. **Upload JSON**: Click "Upload JSON file"
3. **Select File**: Choose dashboard JSON from `/docker/observability/grafana/dashboards/`
4. **Configure**:
   - Select datasource (usually `Prometheus` or `PostgreSQL-UNS`)
   - Adjust UID if needed
5. **Import**: Click "Import"

### Dashboard Overview

#### 1. General System Dashboard
**File**: `system-overview.json`

**Metrics**:
- Service uptime (backend, frontend, database, redis)
- CPU utilization (system-wide and per container)
- Memory usage (available, used, cached)
- Disk space (total, used, available, % usage)
- Network I/O
- HTTP request rate by endpoint
- HTTP error rates (4xx, 5xx)
- Response time percentiles (p50, p95, p99)

**Datasources**: Prometheus

**Recommended Refresh**: 30s

#### 2. Payroll Dashboard
**File**: `payroll-dashboard.json`

**Metrics**:
- Payroll calculations processed (per hour)
- Average calculation time (seconds)
- Calculation errors and failures
- Top 10 employees by calculations
- Monthly payroll run count
- Payroll processing queue depth
- Salary calculation distribution

**Datasources**: PostgreSQL-UNS, Prometheus

**Recommended Refresh**: 5m

**Key SQL Queries**:
```sql
-- Payroll calculations per hour
SELECT
  DATE_TRUNC('hour', created_at) as time,
  COUNT(*) as calculations
FROM salary_calculations
WHERE created_at > NOW() - INTERVAL '24 hours'
GROUP BY time
ORDER BY time;

-- Average calculation time
SELECT
  AVG(processing_time_seconds) as avg_time
FROM salary_calculations
WHERE created_at > NOW() - INTERVAL '1 hour';
```

#### 3. OCR Dashboard
**File**: `ocr-dashboard.json`

**Metrics**:
- Documents uploaded (per hour)
- OCR success rate (%)
- Average OCR processing time
- Errors by provider (Azure, Gemini, etc.)
- Document type distribution
- OCR method comparison (Azure vs Gemini)
- Processing queue depth

**Datasources**: Prometheus

**Key Prometheus Queries**:
```promql
# OCR requests per hour
rate(ocr_requests_total[1h])

# OCR success rate
(1 - (rate(ocr_failures_total[5m]) / rate(ocr_requests_total[5m]))) * 100

# Average processing time
rate(ocr_processing_seconds_sum[5m]) / rate(ocr_processing_seconds_count[5m])

# Errors by provider
sum(rate(ocr_failures_total[5m])) by (ocr_method)
```

**Recommended Refresh**: 30s

#### 4. Database Dashboard
**File**: `database-dashboard.json`

**Metrics**:
- Database size and growth
- Table sizes (top 10 largest tables)
- Query performance (slow queries)
- Active connections
- Transaction rate
- Cache hit ratio
- Index usage statistics
- Vacuum and analyze status

**Datasources**: PostgreSQL-UNS, Prometheus

**Key SQL Queries**:
```sql
-- Database size
SELECT
  pg_database_size(current_database()) as size_bytes;

-- Top 10 largest tables
SELECT
  schemaname,
  tablename,
  pg_total_relation_size(schemaname||'.'||tablename) AS size_bytes
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY size_bytes DESC
LIMIT 10;

-- Active connections
SELECT COUNT(*) as active_connections
FROM pg_stat_activity
WHERE state = 'active';

-- Slow queries (from pg_stat_statements if enabled)
SELECT
  query,
  mean_exec_time,
  calls
FROM pg_stat_statements
ORDER BY mean_exec_time DESC
LIMIT 10;
```

**Recommended Refresh**: 1m

---

## Alert Configuration

Alerts are configured in Prometheus (`/docker/observability/prometheus-alerts.yml`) and can be visualized in Grafana.

### Pre-configured Alerts

1. **Service Availability**:
   - ServiceDown: Any service is down for >1 minute
   - BackendDown: Backend service unreachable for >30 seconds

2. **Error Rates**:
   - HighErrorRate: HTTP error rate >5% for 5 minutes
   - HTTP500Errors: HTTP 500 errors detected for 2 minutes

3. **Performance**:
   - HighResponseTime: P95 response time >1s for 5 minutes
   - HighRequestRate: Request rate >1000 req/s for 5 minutes

4. **Database**:
   - DatabaseConnectionPoolHigh: Connection pool >80% full for 5 minutes

5. **OpenTelemetry**:
   - OTelCollectorDroppingData: OTel Collector dropping spans
   - OTelCollectorHighMemory: OTel Collector using >400MB memory

### Additional Recommended Alerts

#### Disk Space Alert
Add to `prometheus-alerts.yml`:
```yaml
- alert: DiskSpaceLow
  expr: |
    (
      node_filesystem_avail_bytes{mountpoint="/"}
      /
      node_filesystem_size_bytes{mountpoint="/"}
    ) < 0.10
  for: 5m
  labels:
    severity: critical
  annotations:
    summary: "Disk space critically low"
    description: "Disk space is below 10% ({{ $value | humanizePercentage }} available)."
```

#### Database Down Alert
```yaml
- alert: DatabaseDown
  expr: up{job="postgres"} == 0
  for: 1m
  labels:
    severity: critical
  annotations:
    summary: "PostgreSQL database is down"
    description: "PostgreSQL database has been unreachable for 1 minute."
```

### Viewing Alerts in Grafana

1. **Navigate**: Alerting → Alert rules
2. **View Prometheus Alerts**: Select "Prometheus" as data source
3. **Configure Notifications**: Alerting → Contact points

---

## Slack/Email Integration

### Email Notifications

#### 1. Configure SMTP Settings

Edit `.env` file:
```bash
SMTP_SERVER=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASSWORD=your-app-password
SMTP_FROM=noreply@uns-kikaku.com
```

#### 2. Configure Grafana Contact Point

1. **Navigate**: Alerting → Contact points → New contact point
2. **Name**: `Email Alerts`
3. **Integration**: Email
4. **Addresses**: Enter recipient email(s), separated by semicolons
5. **Save contact point**

#### 3. Create Notification Policy

1. **Navigate**: Alerting → Notification policies
2. **Default policy**: Edit
3. **Contact point**: Select `Email Alerts`
4. **Save**

### Slack Integration

#### 1. Create Slack Incoming Webhook

1. Go to: https://api.slack.com/messaging/webhooks
2. **Create App** → From scratch
3. **Enable Incoming Webhooks**
4. **Add New Webhook to Workspace**
5. **Select Channel** (e.g., `#monitoring-alerts`)
6. **Copy Webhook URL**: `https://hooks.slack.com/services/YOUR/WEBHOOK/URL`

#### 2. Configure Grafana Slack Contact Point

1. **Navigate**: Alerting → Contact points → New contact point
2. **Name**: `Slack Alerts`
3. **Integration**: Slack
4. **Webhook URL**: Paste your Slack webhook URL
5. **Optional Settings**:
   - **Title**: `Grafana Alert - UNS-ClaudeJP`
   - **Text**: `{{ template "alert.message" . }}`
   - **Username**: `Grafana`
   - **Icon Emoji**: `:grafana:`
6. **Test**: Click "Test" to send test message
7. **Save contact point**

#### 3. Configure Alert Routing

1. **Navigate**: Alerting → Notification policies → New nested policy
2. **Matching labels**:
   - `severity = critical` → Slack + Email
   - `severity = warning` → Slack only
   - `severity = info` → Email only
3. **Contact points**: Select appropriate contact points
4. **Save policy**

### Advanced Integrations

#### PagerDuty Integration

For critical production alerts:

1. **Create PagerDuty Service**:
   - Go to PagerDuty → Services → New Service
   - Integration Type: "Events API v2"
   - Copy Integration Key

2. **Configure Grafana Contact Point**:
   - **Navigate**: Alerting → Contact points → New contact point
   - **Name**: `PagerDuty Critical`
   - **Integration**: PagerDuty
   - **Integration Key**: Paste key
   - **Severity**: `critical`
   - **Save**

3. **Route Critical Alerts**:
   - Create notification policy for `severity = critical`
   - Select `PagerDuty Critical` contact point

#### Microsoft Teams

1. **Create Teams Incoming Webhook**:
   - Teams Channel → ... → Connectors → Incoming Webhook
   - Copy webhook URL

2. **Configure Grafana**:
   - Contact point → Integration: Webhook
   - URL: Teams webhook URL
   - Method: POST
   - Content-Type: application/json

### Alert Message Templates

Create custom templates in Grafana:

**Navigate**: Alerting → Contact points → Message templates → New template

**Example Critical Alert Template**:
```
{{ define "alert.title" }}
[{{ .Status | toUpper }}] {{ .GroupLabels.alertname }}
{{ end }}

{{ define "alert.message" }}
{{ range .Alerts }}
Alert: {{ .Labels.alertname }}
Severity: {{ .Labels.severity }}
Summary: {{ .Annotations.summary }}
Description: {{ .Annotations.description }}
Source: {{ .GeneratorURL }}
{{ end }}
{{ end }}
```

---

## Health Check Queries

### Backend Health Check

**Endpoint**: `http://localhost:8000/api/health`

**Response Example**:
```json
{
  "status": "ok",
  "timestamp": 1700000000.0,
  "system": {
    "platform": "Linux-4.4.0",
    "python": "3.11.0",
    "cpu_percent": 15.2,
    "memory_percent": 45.8
  },
  "application": {
    "version": "6.5.0",
    "environment": "development"
  }
}
```

**Prometheus Monitoring**:
```promql
# Backend health check success
probe_success{job="backend"}

# Backend response time
probe_duration_seconds{job="backend"}
```

### Database Health Check

**SQL Query**:
```sql
-- Check if database is accepting connections
SELECT 1;

-- Check database size
SELECT pg_database_size(current_database());

-- Check for long-running queries
SELECT
  pid,
  now() - query_start as duration,
  state,
  query
FROM pg_stat_activity
WHERE state = 'active'
  AND now() - query_start > interval '5 minutes';
```

**Prometheus (via postgres_exporter)**:
```promql
# Database up
pg_up

# Active connections
pg_stat_database_numbackends
```

### Redis Health Check

**Redis CLI**:
```bash
# Check Redis is responding
docker exec -it uns-claudejp-650-redis redis-cli ping
# Expected: PONG

# Check memory usage
docker exec -it uns-claudejp-650-redis redis-cli info memory

# Check key count
docker exec -it uns-claudejp-650-redis redis-cli dbsize
```

**Prometheus (via redis_exporter)**:
```promql
# Redis up
redis_up

# Memory usage
redis_memory_used_bytes

# Connected clients
redis_connected_clients
```

---

## Troubleshooting

### Common Issues

#### 1. Grafana Can't Connect to Prometheus

**Symptoms**: "Bad Gateway" or connection errors in Prometheus datasource

**Solutions**:
```bash
# Check Prometheus is running
docker compose ps prometheus

# Check Prometheus health
curl http://localhost:9090/-/healthy

# Check Grafana can reach Prometheus (from Grafana container)
docker exec -it uns-claudejp-650-grafana wget -qO- http://prometheus:9090/-/healthy

# Restart services
docker compose restart prometheus grafana
```

#### 2. PostgreSQL Datasource Connection Failed

**Symptoms**: "Connection refused" or authentication errors

**Solutions**:
```bash
# Verify PostgreSQL is running
docker compose ps db

# Test connection from Grafana container
docker exec -it uns-claudejp-650-grafana nc -zv db 5432

# Check credentials in .env file
cat .env | grep POSTGRES

# Ensure datasource config uses correct values from .env
```

#### 3. Dashboards Not Loading

**Symptoms**: Empty panels or "No data" messages

**Solutions**:
1. **Check datasource**: Ensure correct datasource is selected
2. **Check time range**: Adjust time range to when data exists
3. **Check queries**: Test queries in Explore tab
4. **Check logs**:
```bash
docker compose logs grafana | tail -50
docker compose logs prometheus | tail -50
```

#### 4. Alerts Not Triggering

**Symptoms**: No alerts despite conditions being met

**Solutions**:
1. **Check Prometheus alerts**:
   - Navigate to http://localhost:9090/alerts
   - Verify alert rules are loaded
   - Check alert state (pending, firing, inactive)

2. **Check alert evaluation**:
```bash
# Verify alerts file is loaded
docker compose logs prometheus | grep alerts

# Reload Prometheus config
docker compose exec prometheus kill -HUP 1
```

3. **Check Grafana contact points**:
   - Navigate to Alerting → Contact points
   - Test contact point
   - Check notification logs

#### 5. High Memory Usage

**Symptoms**: Grafana or Prometheus consuming too much memory

**Solutions**:
1. **Reduce retention period** (in `prometheus.yml`):
```yaml
global:
  scrape_interval: 15s
  evaluation_interval: 15s

# Add storage config
storage:
  tsdb:
    retention.time: 15d  # Reduce from default 15d to 7d
    retention.size: 10GB  # Limit total size
```

2. **Optimize queries**: Use recording rules for expensive queries
3. **Reduce scrape frequency** for non-critical metrics

#### 6. Missing Metrics

**Symptoms**: Certain metrics not appearing in Prometheus

**Solutions**:
1. **Check scrape targets**:
   - Navigate to http://localhost:9090/targets
   - Verify all targets are "UP"
   - Check "Last Scrape" time

2. **Check backend metrics endpoint**:
```bash
curl http://localhost:8000/metrics
```

3. **Verify instrumentation**:
```bash
# Check backend logs for OpenTelemetry initialization
docker compose logs backend | grep -i telemetry
```

### Getting Help

- **Grafana Documentation**: https://grafana.com/docs/grafana/latest/
- **Prometheus Documentation**: https://prometheus.io/docs/
- **Backend Logs**: `docker compose logs backend`
- **Grafana Logs**: `docker compose logs grafana`
- **Prometheus Logs**: `docker compose logs prometheus`

---

## Next Steps

1. ✅ Complete datasource configuration
2. ✅ Import all 4 dashboards
3. ✅ Configure alert contact points (Email/Slack)
4. ✅ Test alerts with sample data
5. ✅ Customize dashboards for your needs
6. 📊 Set up recording rules for expensive queries
7. 🔒 Configure authentication and RBAC
8. 📈 Create custom dashboards for specific teams
9. 🔔 Fine-tune alert thresholds based on baseline
10. 📊 Set up long-term storage (if needed)

---

## Maintenance

### Weekly Tasks
- Review alert noise and adjust thresholds
- Check dashboard performance
- Verify all datasources are healthy

### Monthly Tasks
- Review disk usage and retention policies
- Update dashboards based on feedback
- Audit alert contact points
- Check Grafana plugin updates

### Quarterly Tasks
- Review and optimize expensive queries
- Audit user access and permissions
- Plan capacity based on growth trends
- Update documentation

---

**Version**: 1.0.0
**Last Updated**: 2025-11-19
**Maintained By**: @observability-engineer
