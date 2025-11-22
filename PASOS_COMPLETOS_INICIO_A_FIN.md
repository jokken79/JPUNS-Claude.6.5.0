# 🚀 JPUNS FASE 8 - Guía Completa: Inicio a Fin

**Tiempo total**: ~30 minutos (primera vez)
**Dificultad**: Fácil (solo ejecutar comandos)
**Requisitos**: Docker, docker-compose, Slack (opcional)

---

## 📋 RESUMEN DE LOS 4 PASOS PRINCIPALES

```
┌─────────────────────────────────────────────────────────────┐
│ PASO 1: PREPARACIÓN PREVIA (5 minutos)                      │
│ - Obener Slack webhook (si quieres notificaciones)          │
│ - Verificar Docker instalado                                │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│ PASO 2: SETUP AUTOMÁTICO (10 minutos)                       │
│ - Ejecutar setup-monitoring.sh --full                       │
│ - Verifica todo automáticamente                             │
│ - Configura Slack (te pedirá el webhook)                    │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│ PASO 3: VERIFICACIÓN (5 minutos)                            │
│ - Ejecutar health-check.sh                                  │
│ - Debe mostrar: 100% healthy                                │
│ - Acceder a Grafana: http://localhost:3001                  │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│ PASO 4: DASHBOARDS & TESTING (10 minutos)                   │
│ - Importar dashboards: import-dashboards.sh --all           │
│ - Ver dashboards en Grafana                                 │
│ - Testear alerts: test-alerts.sh backend-down               │
│ - Recibir notificación en Slack                             │
└─────────────────────────────────────────────────────────────┘
```

---

# 🎯 PASOS DETALLADOS

## PASO 1: PREPARACIÓN PREVIA (5 minutos)

### 1.1 Obtener Slack Webhook (OPCIONAL pero RECOMENDADO)

**Si quieres recibir notificaciones de alerts en Slack:**

1. Ve a: https://api.slack.com/messaging/webhooks
2. Click en **Create New App**
3. Selecciona **From scratch**
4. Dale nombre: `JPUNS Alerts`
5. Selecciona tu workspace
6. Ve a **Incoming Webhooks** en el menú
7. Click **Add New Webhook to Workspace**
8. Selecciona canal: `#alerts` (o crea uno nuevo)
9. **Copia la URL** (se parece a: `https://hooks.slack.com/services/...`)
10. ✅ Guarda en un bloc de notas

**Si NO tienes Slack o no quieres configurar ahora:**
- Salta este paso
- El setup funcionará igual, solo sin notificaciones

### 1.2 Verificar Docker Instalado

```bash
# Verifica que Docker está instalado
docker --version

# Output esperado:
# Docker version 24.0.0 (o newer)

# Verifica que docker-compose está instalado
docker-compose --version

# Output esperado:
# Docker Compose version 2.20.0 (o newer)
```

**Si algo no está instalado:**
- Linux: `sudo apt install docker.io docker-compose`
- Mac: Instala Docker Desktop desde https://www.docker.com/products/docker-desktop
- Windows: Instala Docker Desktop desde https://www.docker.com/products/docker-desktop

---

## PASO 2: SETUP AUTOMÁTICO (10 minutos)

### 2.1 Navega al directorio del proyecto

```bash
cd /ruta/a/tu/proyecto/JPUNS-Claude.6.0.2
```

### 2.2 Ejecuta el setup automático

```bash
# Dar permisos de ejecución a los scripts (primera vez)
chmod +x scripts/*.sh scripts/*.py

# Ejecutar setup completo
./scripts/setup-monitoring.sh --full
```

**Qué hace automáticamente:**
1. ✅ Verifica Docker y docker-compose
2. ✅ Valida archivos YAML
3. ✅ Inicia 8 servicios con docker-compose
4. ✅ Espera a que Prometheus scrape datos
5. ✅ Crea datasource de Prometheus en Grafana
6. ✅ Te pide webhook de Slack (opcional)
7. ✅ Configura Slack si lo proporcionas
8. ✅ Realiza health check final

**Output esperado:**
```
✅ Docker daemon
✅ docker-compose version 2.20.0
✅ Containers en ejecución (8 de 8)
✅ Prometheus (port 9090)
✅ Grafana (port 3001)
✅ Alertmanager (port 9093)
✅ PostgreSQL (port 5432)
✅ Redis (port 6379)
✅ Datasource Prometheus configurado
✅ Slack webhook probado (si lo proporcionaste)
✅ Setup completo exitoso!
```

**Si algo falla:**
- Lee el mensaje de error
- Ver: `ALERTMANAGER_RUNBOOKS.md` para troubleshooting

---

## PASO 3: VERIFICACIÓN (5 minutos)

### 3.1 Ejecutar Health Check

```bash
./scripts/health-check.sh
```

**Output esperado:**
```
🔧 SERVICES & ENDPOINTS
  Prometheus (port 9090).................... ✅
  Grafana (port 3001)...................... ✅
  Alertmanager (port 9093)................. ✅
  PostgreSQL (port 5432)................... ✅
  Redis (port 6379)........................ ✅

📡 PROMETHEUS TARGETS
  Targets UP............................... ✅ (6)
  Targets DOWN............................ ✅ (0)

📊 METRICS & DATA
  Active alerts........................... ✅ (0)

SUMMARY
Health Score: 100% (15 passed, 0 failed)
✅ All systems healthy!
```

### 3.2 Acceder a Grafana (UI)

1. Abre navegador: **http://localhost:3001**
2. Usuario: `admin`
3. Contraseña: `admin_password_123`
4. Click en **Settings (⚙️)** > **Change password** (RECOMENDADO)
5. Ingresa contraseña nueva y segura

### 3.3 Acceder a Prometheus (opcional)

1. Abre navegador: **http://localhost:9090**
2. Ve a: **Status > Targets**
3. Deberías ver 6 targets en estado "UP"

### 3.4 Acceder a Alertmanager (opcional)

1. Abre navegador: **http://localhost:9093**
2. Deberías ver interfaz de Alertmanager
3. Alerts: debería mostrar 0 activos (sistema healthy)

---

## PASO 4: DASHBOARDS & TESTING (10 minutos)

### 4.1 Importar Dashboards Automáticamente

```bash
./scripts/import-dashboards.sh --all
```

**Output esperado:**
```
✅ Grafana conectado
✅ Importando: 01-system-health-overview.json
✅ Dashboard importado (ID: 1)
✅ Importando: 02-api-performance.json
✅ Dashboard importado (ID: 2)
✅ Importando: 03-database-metrics.json
✅ Dashboard importado (ID: 3)
✅ Importando: 04-cache-performance.json
✅ Dashboard importado (ID: 4)
✅ Importando: 05-alerts-status.json
✅ Dashboard importado (ID: 5)

Importación completa:
✅ Exitosos: 5
```

### 4.2 Ver Dashboards en Grafana

1. Ve a Grafana: **http://localhost:3001**
2. Click en **Dashboards** (menú izquierdo)
3. Deberías ver 5 dashboards:
   - ✅ System Health Overview
   - ✅ API Performance
   - ✅ Database Metrics
   - ✅ Cache Performance
   - ✅ Alerts Status

4. Click en cada uno para explorar

### 4.3 Testear Alerts

```bash
# Test 1: Backend Down Alert
./scripts/test-alerts.sh backend-down
```

**Qué hace:**
1. ✅ Detiene el servicio backend
2. ✅ Espera 2-3 minutos a que Prometheus detecte
3. ✅ Muestra cuando el alert dispara
4. ✅ Reinicia el servicio
5. ✅ Verifica que el alert se resuelve
6. ✅ Si Slack está configurado, recibe notificación

**Output esperado:**
```
🚨 Testing: Backend API Down
⚠️ Deteniendo jpuns-backend...
ℹ️ Esperando a que Prometheus detecte (3 minutos)...
✅ Alert 'BackendAPIDown' disparado en Prometheus
✅ Alert resuelto
```

**En Slack (si está configurado):**
```
🚨 [CRÍTICO] BackendAPIDown
Instance: jpus-backend
Description: Backend API is not responding
```

### 4.4 Verificar que todo funciona

```bash
# Monitoreo continuo (ver salud en tiempo real)
./scripts/health-check.sh --continuous
```

Presiona `Ctrl+C` para salir.

---

# 📊 VERIFICACIÓN FINAL

Después de completar los 4 pasos, verifica:

- [ ] Docker muestra 8 containers corriendo: `docker ps`
- [ ] Grafana accesible: http://localhost:3001
- [ ] 5 dashboards importados en Grafana
- [ ] Prometheus targets UP: http://localhost:9090/targets
- [ ] Alert test exitoso (sin errores)
- [ ] Health check muestra 100%

**Si todo está ✅**, ¡FELICIDADES! Sistema completamente operativo.

---

# 🛠️ OPERACIÓN DIARIA (Después del Setup)

### Verificar Salud
```bash
./scripts/health-check.sh
```

### Monitoreo Continuo
```bash
./scripts/health-check.sh --continuous
```

### Ver Dashboards
```
http://localhost:3001
```

### Analizar Logs (si hay problema)
```bash
python3 ./scripts/log-analyzer.py --last-hours 6
```

### Performance Profiling
```bash
./scripts/performance-profiler.sh
```

### Capacity Planning
```bash
python3 ./scripts/capacity-planner.py --months 12
```

---

# ⚠️ TROUBLESHOOTING

### Problema: "Docker daemon not available"
**Solución:**
```bash
# Verifica que Docker está corriendo
docker ps

# Si no funciona:
# Linux: sudo systemctl start docker
# Mac: open /Applications/Docker.app
```

### Problema: "Grafana not available (HTTP 503)"
**Solución:**
```bash
# Espera más tiempo (Grafana tarda ~30 seg en iniciar)
sleep 30
./scripts/health-check.sh

# O ver logs
docker logs jpuns-grafana
```

### Problema: "Prometheus targets DOWN"
**Solución:**
```bash
# Verifica que todos los servicios están corriendo
docker ps | grep jpuns

# Si alguno no está, reinicia:
cd monitoring
docker-compose restart jpuns-prometheus
```

### Problema: "Alert no llega a Slack"
**Solución:**
1. Verifica que el webhook URL es correcto
2. Prueba manualmente:
```bash
curl -X POST -H 'Content-type: application/json' \
  --data '{"text":"Test"}' \
  https://hooks.slack.com/services/YOUR/WEBHOOK/URL
```

**Para más detalles:** Ver `ALERTMANAGER_RUNBOOKS.md`

---

# 📞 SOPORTE RÁPIDO

**Si algo no funciona:**

1. **Primero**: Ejecuta `./scripts/health-check.sh`
2. **Luego**: Lee el error específico
3. **Busca**: En `ALERTMANAGER_RUNBOOKS.md` la sección del error
4. **O**: En `MONITORING_QUICKSTART.md` troubleshooting section

---

# 🎓 DOCUMENTACIÓN DE REFERENCIA

**Para entender cada componente:**
- `MONITORING_QUICKSTART.md` - Guía rápida (5 min)
- `GRAFANA_DASHBOARDS_GUIDE.md` - Cómo crear dashboards
- `ALERTMANAGER_RUNBOOKS.md` - Procedimientos de alertas
- `AUTOMATION_DASHBOARDS_SUMMARY.md` - Resumen técnico completo
- `CICD_MONITORING_COMPLETE_SUMMARY.md` - Overview de FASE 8

---

# ✅ CHECKLIST FINAL

Marca cuando completes cada paso:

**PASO 1: PREPARACIÓN**
- [ ] Docker instalado y funcionando
- [ ] Slack webhook obtenido (opcional)

**PASO 2: SETUP**
- [ ] `setup-monitoring.sh --full` ejecutado exitosamente
- [ ] 8 servicios corriendo

**PASO 3: VERIFICACIÓN**
- [ ] `health-check.sh` muestra 100% healthy
- [ ] Grafana accesible en http://localhost:3001
- [ ] Puedo acceder con admin/admin_password_123
- [ ] Prometheus targets UP

**PASO 4: DASHBOARDS**
- [ ] 5 dashboards importados
- [ ] Alert test (`test-alerts.sh backend-down`) completado
- [ ] Notificación en Slack recibida (si está configurado)

**FINAL**
- [ ] Sistema completamente operativo
- [ ] Ready para producción

---

## 🎉 ¡LISTO!

**Ahora tienes:**
- ✅ Stack de monitoring completo (Prometheus + Grafana + Alertmanager)
- ✅ 5 dashboards preconfigurados
- ✅ 20+ reglas de alertas
- ✅ Notificaciones en Slack
- ✅ 8 scripts de automatización
- ✅ Logging y profiling avanzado

**Siguiente**: Explorar Grafana y familiarizarse con los dashboards.

---

**Duración Total**: 30 minutos
**Dificultad**: ⭐ Fácil (solo ejecutar comandos)
**Resultado**: Sistema enterprise-grade de monitoreo

¡Éxito! 🚀
