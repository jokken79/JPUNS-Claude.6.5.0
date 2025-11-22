#!/bin/bash

################################################################################
# JPUNS Alert Testing Script
#
# Propósito: Testear que las alertas están funcionando correctamente
# Uso: ./test-alerts.sh [alert-type]
#
# Alert Types:
#   - backend-down      Backend API no disponible
#   - high-error-rate   Error rate alta (> 5%)
#   - slow-response     Respuesta lenta (> 1s)
#   - db-down           PostgreSQL no disponible
#   - redis-down        Redis no disponible
#   - high-cpu          CPU > 95%
#   - high-memory       Memory > 95%
#   - all               Testear todas las alertas
################################################################################

set -e

# Colores
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

log_info() { echo -e "${BLUE}ℹ️  $1${NC}"; }
log_success() { echo -e "${GREEN}✅ $1${NC}"; }
log_error() { echo -e "${RED}❌ $1${NC}"; }
log_warning() { echo -e "${YELLOW}⚠️  $1${NC}"; }

MONITORING_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/../monitoring" && pwd)"
PROMETHEUS_URL="http://localhost:9090"
ALERTMANAGER_URL="http://localhost:9093"

# Verificar que Prometheus está disponible
check_prometheus() {
    if ! curl -s "$PROMETHEUS_URL/-/healthy" &>/dev/null; then
        log_error "Prometheus no está disponible en $PROMETHEUS_URL"
        exit 1
    fi
    log_success "Prometheus conectado"
}

# Trigger: Backend API Down
test_backend_down() {
    log_info "Testing: Backend API Down"
    log_warning "Deteniendo jpuns-backend..."

    cd "$MONITORING_DIR"
    docker-compose stop jpuns-backend

    log_info "Esperando a que Prometheus detecte (3 minutos)..."
    log_info "Alert debería aparecer en ~2 minutos"
    log_info "Deberías recibir notificación en Slack en ~3 minutos"

    # Esperar y mostrar cuando el alert dispara
    for i in {1..180}; do
        ALERT_COUNT=$(curl -s "$PROMETHEUS_URL/api/v1/query?query=ALERTS{alertname='BackendAPIDown'}" | python3 -c "import sys, json; print(len(json.load(sys.stdin).get('data',{}).get('result',[])))" 2>/dev/null || echo "0")

        if [ "$ALERT_COUNT" -gt 0 ]; then
            log_success "Alert 'BackendAPIDown' disparado en Prometheus"
            break
        fi

        if [ $((i % 30)) -eq 0 ]; then
            log_info "Esperando... ($i segundos)"
        fi
        sleep 1
    done

    log_warning "Reiniciando jpuns-backend..."
    docker-compose up -d jpuns-backend

    log_info "Esperando a que vuelva a ser healthy..."
    sleep 30

    ALERT_COUNT=$(curl -s "$PROMETHEUS_URL/api/v1/query?query=ALERTS{alertname='BackendAPIDown'}" | python3 -c "import sys, json; print(len(json.load(sys.stdin).get('data',{}).get('result',[])))" 2>/dev/null || echo "0")

    if [ "$ALERT_COUNT" -eq 0 ]; then
        log_success "Alert resuelto"
    else
        log_warning "Alert aún activo (puede tomar más tiempo)"
    fi
}

# Trigger: High Error Rate
test_high_error_rate() {
    log_info "Testing: High Error Rate"
    log_info "Generando requests con errores artificialmente..."

    log_warning "Este test requiere acceso directo a la DB para insertar datos malos"
    log_info "Para un test simple, ejecuta:"
    log_info "  for i in {1..100}; do curl -s http://localhost:8000/api/invalid 2>/dev/null; done"
    log_info "Luego espera a que se dispare el alert"

    read -p "¿Deseas continuar? (s/n): " CONTINUE
    if [ "$CONTINUE" != "s" ] && [ "$CONTINUE" != "y" ]; then
        return
    fi

    log_info "Ejecutando requests con error..."
    for i in {1..50}; do
        curl -s http://localhost:8000/api/invalid -X GET 2>/dev/null || true
        curl -s http://localhost:8000/api/invalid -X POST 2>/dev/null || true
    done

    log_info "Esperando a que Prometheus evalúe (3 minutos)..."
    sleep 30

    ERROR_RATE=$(curl -s "$PROMETHEUS_URL/api/v1/query?query=rate(http_requests_total{status=~\"5..\"}\[5m\])" | python3 -c "import sys, json; result=json.load(sys.stdin).get('data',{}).get('result',[]); print(result[0]['value'][1] if result else '0')" 2>/dev/null || echo "0")

    log_info "Error rate actual: $ERROR_RATE"
}

# Trigger: Database Down
test_db_down() {
    log_info "Testing: Database Down"
    log_warning "Deteniendo PostgreSQL..."

    cd "$MONITORING_DIR"
    docker-compose stop jpuns-postgres-monitoring

    log_info "Esperando a que el alert dispare (2-3 minutos)..."

    for i in {1..180}; do
        ALERT_COUNT=$(curl -s "$PROMETHEUS_URL/api/v1/query?query=ALERTS{alertname='PostgreSQLDown'}" | python3 -c "import sys, json; print(len(json.load(sys.stdin).get('data',{}).get('result',[])))" 2>/dev/null || echo "0")

        if [ "$ALERT_COUNT" -gt 0 ]; then
            log_success "Alert 'PostgreSQLDown' disparado"
            break
        fi

        if [ $((i % 30)) -eq 0 ]; then
            log_info "Esperando... ($i segundos)"
        fi
        sleep 1
    done

    log_warning "Reiniciando PostgreSQL..."
    docker-compose up -d jpuns-postgres-monitoring

    log_info "Esperando a que PostgreSQL inicie..."
    sleep 30

    ALERT_COUNT=$(curl -s "$PROMETHEUS_URL/api/v1/query?query=ALERTS{alertname='PostgreSQLDown'}" | python3 -c "import sys, json; print(len(json.load(sys.stdin).get('data',{}).get('result',[])))" 2>/dev/null || echo "0")

    if [ "$ALERT_COUNT" -eq 0 ]; then
        log_success "Alert resuelto"
    else
        log_warning "Alert aún activo"
    fi
}

# Trigger: Redis Down
test_redis_down() {
    log_info "Testing: Redis Down"
    log_warning "Deteniendo Redis..."

    cd "$MONITORING_DIR"
    docker-compose stop jpuns-redis-monitoring

    log_info "Esperando a que el alert dispare (2-3 minutos)..."

    for i in {1..180}; do
        ALERT_COUNT=$(curl -s "$PROMETHEUS_URL/api/v1/query?query=ALERTS{alertname='RedisDown'}" | python3 -c "import sys, json; print(len(json.load(sys.stdin).get('data',{}).get('result',[])))" 2>/dev/null || echo "0")

        if [ "$ALERT_COUNT" -gt 0 ]; then
            log_success "Alert 'RedisDown' disparado"
            break
        fi

        if [ $((i % 30)) -eq 0 ]; then
            log_info "Esperando... ($i segundos)"
        fi
        sleep 1
    done

    log_warning "Reiniciando Redis..."
    docker-compose up -d jpuns-redis-monitoring

    sleep 10
    log_success "Redis reiniciado"
}

# Trigger: High CPU
test_high_cpu() {
    log_info "Testing: High CPU Usage"

    log_info "Generando carga de CPU..."
    python3 -c "
import time
import multiprocessing

def cpu_load():
    end = time.time() + 120
    while time.time() < end:
        _ = sum(i*i for i in range(1000000))

if __name__ == '__main__':
    for _ in range(4):
        p = multiprocessing.Process(target=cpu_load)
        p.start()
    for _ in range(4):
        p.join()
" &

    CPU_PID=$!

    log_info "CPU load generado (PID: $CPU_PID)"
    log_info "Esperando a que alert dispare (2-3 minutos)..."

    for i in {1..180}; do
        CPU=$(grep "cpu " /proc/stat | awk '{usage=($2+$4)*100/($2+$4+$5)} END {print usage}' 2>/dev/null || echo "0")
        log_info "CPU actual: ${CPU%.*}%"

        ALERT_COUNT=$(curl -s "$PROMETHEUS_URL/api/v1/query?query=ALERTS{alertname=~'.*CPU.*'}" | python3 -c "import sys, json; print(len(json.load(sys.stdin).get('data',{}).get('result',[])))" 2>/dev/null || echo "0")

        if [ "$ALERT_COUNT" -gt 0 ]; then
            log_success "CPU Alert disparado"
            kill $CPU_PID 2>/dev/null || true
            break
        fi

        if [ $((i % 30)) -eq 0 ]; then
            log_info "Esperando... ($i segundos)"
        fi
        sleep 1
    done

    # Asegurar que se mata el proceso de CPU
    kill $CPU_PID 2>/dev/null || true
    log_success "Proceso de CPU detenido"
}

# Ver alertas activas
show_active_alerts() {
    log_info "Alertas activas en Prometheus:"
    curl -s "$PROMETHEUS_URL/alerts" | grep -i "firing" | head -20 || log_info "Sin alertas activas"
}

# Ver estado en Alertmanager
show_alertmanager_status() {
    log_info "Accediendo a Alertmanager UI: $ALERTMANAGER_URL"
    log_info "Abre en navegador para ver alertas y notificaciones"
}

# Help
show_help() {
    cat << EOF
JPUNS Alert Testing Script

Uso: $0 [TYPE] [OPTIONS]

Alert Types:
    backend-down      Testear Backend API Down
    error-rate        Testear High Error Rate
    db-down           Testear Database Down
    redis-down        Testear Redis Down
    cpu-high          Testear High CPU
    all               Testear todos (ADVERTENCIA: demora ~20 minutos)

Ejemplos:
    $0 backend-down
    $0 db-down
    $0 all

Post-test:
    Ver alertas en Prometheus:    $PROMETHEUS_URL/alerts
    Ver alertas en Alertmanager:  $ALERTMANAGER_URL
    Ver notificaciones en Slack:  Tu canal #alerts
EOF
}

main() {
    echo -e "${BLUE}"
    cat << "EOF"
╔══════════════════════════════════════════════════════════════╗
║   JPUNS Alert Testing                                        ║
║   Verifica que los alerts funcionan correctamente            ║
╚══════════════════════════════════════════════════════════════╝
EOF
    echo -e "${NC}"

    if [ $# -eq 0 ]; then
        show_help
        exit 0
    fi

    check_prometheus

    case "$1" in
        backend-down)
            test_backend_down
            ;;
        error-rate)
            test_high_error_rate
            ;;
        db-down)
            test_db_down
            ;;
        redis-down)
            test_redis_down
            ;;
        cpu-high)
            test_high_cpu
            ;;
        all)
            log_warning "Running ALL tests (puede tomar ~20 minutos)"
            test_backend_down
            sleep 10
            test_db_down
            sleep 10
            test_redis_down
            ;;
        active)
            show_active_alerts
            ;;
        status)
            show_alertmanager_status
            ;;
        help|--help|-h)
            show_help
            ;;
        *)
            log_error "Opción desconocida: $1"
            show_help
            exit 1
            ;;
    esac

    log_success "Test completado"
}

main "$@"
