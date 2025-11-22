#!/bin/bash

################################################################################
# JPUNS Monitoring Stack - Automated Setup Script
#
# Propósito: Automatizar la configuración completa del stack de monitoreo
# Uso: ./setup-monitoring.sh [options]
#
# Options:
#   --full         Configuración completa (stack + Grafana + Slack)
#   --stack-only   Solo docker-compose (Prometheus, Grafana, Alertmanager)
#   --grafana-only Solo bootstrap de Grafana
#   --slack        Configurar Slack webhook
#   --health       Verificar salud del stack
#   --clean        Detener y limpiar todo
#   --help         Mostrar esta ayuda
################################################################################

set -e

# Colores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Variables
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"
MONITORING_DIR="$PROJECT_ROOT/monitoring"

# Función para imprimir
log_info() {
    echo -e "${BLUE}ℹ️  $1${NC}"
}

log_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

log_error() {
    echo -e "${RED}❌ $1${NC}"
}

log_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

# Verificar prerrequisitos
check_prerequisites() {
    log_info "Verificando prerrequisitos..."

    if ! command -v docker &> /dev/null; then
        log_error "Docker no está instalado"
        exit 1
    fi
    log_success "Docker encontrado: $(docker --version)"

    if ! command -v docker-compose &> /dev/null; then
        log_error "docker-compose no está instalado"
        exit 1
    fi
    log_success "docker-compose encontrado: $(docker-compose --version)"

    if [ ! -d "$MONITORING_DIR" ]; then
        log_error "Directorio monitoring no encontrado en: $MONITORING_DIR"
        exit 1
    fi
    log_success "Directorio monitoring encontrado"
}

# Iniciar stack de docker-compose
start_stack() {
    log_info "Iniciando stack de monitoreo..."

    cd "$MONITORING_DIR"

    # Verificar que los archivos YAML existen
    for file in prometheus.yml alert-rules.yml alertmanager.yml docker-compose.yml; do
        if [ ! -f "$file" ]; then
            log_error "Archivo no encontrado: $file"
            exit 1
        fi
    done

    # Validar YAML
    log_info "Validando archivos YAML..."
    python3 -c "import yaml; yaml.safe_load(open('prometheus.yml'))" || {
        log_error "prometheus.yml tiene error de sintaxis"
        exit 1
    }
    python3 -c "import yaml; yaml.safe_load(open('alert-rules.yml'))" || {
        log_error "alert-rules.yml tiene error de sintaxis"
        exit 1
    }
    python3 -c "import yaml; yaml.safe_load(open('alertmanager.yml'))" || {
        log_error "alertmanager.yml tiene error de sintaxis"
        exit 1
    }
    log_success "YAML validation exitoso"

    # Iniciar servicios
    log_info "Iniciando servicios con docker-compose..."
    docker-compose up -d

    log_info "Esperando a que los servicios inicien (30 segundos)..."
    sleep 30

    # Verificar estatus
    log_info "Verificando estatus de servicios..."
    docker-compose ps
}

# Verificar salud del stack
health_check() {
    log_info "Realizando health check del stack..."

    # Prometheus
    if curl -s http://localhost:9090/-/healthy | grep -q "Prometheus is Healthy"; then
        log_success "Prometheus: HEALTHY"
    else
        log_error "Prometheus: UNHEALTHY"
    fi

    # Grafana
    if curl -s -o /dev/null -w "%{http_code}" http://localhost:3001/api/health | grep -q "200"; then
        log_success "Grafana: HEALTHY"
    else
        log_error "Grafana: UNHEALTHY"
    fi

    # Alertmanager
    if curl -s http://localhost:9093/-/healthy | grep -q "Alertmanager is Healthy"; then
        log_success "Alertmanager: HEALTHY"
    else
        log_error "Alertmanager: UNHEALTHY"
    fi

    # PostgreSQL
    if docker-compose ps | grep jpuns-postgres-monitoring | grep -q "Up"; then
        if docker exec jpuns-postgres-monitoring pg_isready -U postgres &>/dev/null; then
            log_success "PostgreSQL: HEALTHY"
        else
            log_error "PostgreSQL: NOT READY"
        fi
    fi

    # Redis
    if docker-compose ps | grep jpuns-redis-monitoring | grep -q "Up"; then
        if redis-cli PING &>/dev/null | grep -q "PONG"; then
            log_success "Redis: HEALTHY"
        else
            log_error "Redis: NOT RESPONDING"
        fi
    fi

    # Prometheus targets
    log_info "Verificando Prometheus targets..."
    TARGETS=$(curl -s http://localhost:9090/api/v1/targets | python3 -c "import sys, json; data=json.load(sys.stdin); print(len([t for t in data.get('data',{}).get('activeTargets',[]) if t.get('health')=='up']))")
    log_info "Targets UP: $TARGETS"

    if [ "$TARGETS" -ge 5 ]; then
        log_success "Suficientes targets scraping"
    else
        log_warning "Solo $TARGETS targets scraping (esperado: 6)"
    fi
}

# Bootstrap Grafana
bootstrap_grafana() {
    log_info "Bootstrapping Grafana..."

    # Esperar a que Grafana esté listo
    log_info "Esperando a que Grafana inicie..."
    for i in {1..30}; do
        if curl -s http://localhost:3001/api/health &>/dev/null; then
            log_success "Grafana listo"
            break
        fi
        if [ $i -eq 30 ]; then
            log_error "Timeout esperando por Grafana"
            exit 1
        fi
        sleep 2
    done

    # Crear datasource de Prometheus
    log_info "Creando datasource de Prometheus en Grafana..."
    curl -s -X POST http://localhost:3001/api/datasources \
        -H "Content-Type: application/json" \
        -u admin:admin_password_123 \
        -d '{
            "name": "Prometheus",
            "type": "prometheus",
            "url": "http://jpuns-prometheus:9090",
            "access": "proxy",
            "isDefault": true,
            "jsonData": {}
        }' > /dev/null 2>&1 || log_warning "Datasource podría ya existir"

    log_success "Datasource Prometheus configurado"

    log_info "Grafana bootstrap completado"
    log_info "Accede a Grafana en: http://localhost:3001"
    log_info "Usuario: admin"
    log_info "Contraseña: admin_password_123"
}

# Configurar Slack
configure_slack() {
    log_info "Configurar Slack webhook para alertas..."

    read -p "Ingresa tu Slack webhook URL (https://hooks.slack.com/...): " SLACK_WEBHOOK

    if [ -z "$SLACK_WEBHOOK" ]; then
        log_error "Webhook URL no puede estar vacía"
        return 1
    fi

    # Validar que sea URL válida
    if ! [[ "$SLACK_WEBHOOK" =~ ^https://hooks\.slack\.com/ ]]; then
        log_error "Webhook URL inválida"
        return 1
    fi

    # Actualizar alertmanager.yml
    log_info "Actualizando alertmanager.yml..."

    # Backup original
    cp "$MONITORING_DIR/alertmanager.yml" "$MONITORING_DIR/alertmanager.yml.bak"

    # Reemplazar webhook URL
    sed -i.tmp "s|slack_api_url: .*|slack_api_url: '$SLACK_WEBHOOK'|g" "$MONITORING_DIR/alertmanager.yml"
    rm -f "$MONITORING_DIR/alertmanager.yml.tmp"

    # Reiniciar Alertmanager
    log_info "Reiniciando Alertmanager..."
    cd "$MONITORING_DIR"
    docker-compose restart jpuns-alertmanager
    sleep 5

    # Probar webhook
    log_info "Probando webhook de Slack..."
    TEST_RESULT=$(curl -s -X POST "$SLACK_WEBHOOK" \
        -H 'Content-type: application/json' \
        --data '{"text":"✅ JPUNS Alertmanager webhook test - Configuración exitosa!"}' \
        -w "%{http_code}" -o /dev/null)

    if [ "$TEST_RESULT" == "200" ]; then
        log_success "Webhook Slack probado exitosamente"
        log_info "Deberías haber recibido un mensaje en tu canal de Slack"
    else
        log_error "Error probando webhook (HTTP $TEST_RESULT)"
    fi
}

# Limpiar y detener
cleanup() {
    log_warning "Deteniendo y limpiando stack de monitoreo..."

    cd "$MONITORING_DIR"
    docker-compose down

    log_warning "Volúmenes de datos:"
    docker volume ls | grep monitoring

    read -p "¿Deseas borrar los volúmenes de datos? (s/n): " DELETE_VOLUMES

    if [ "$DELETE_VOLUMES" = "s" ] || [ "$DELETE_VOLUMES" = "y" ]; then
        docker-compose down -v
        log_success "Volúmenes borrados"
    fi
}

# Mostrar ayuda
show_help() {
    cat << EOF
JPUNS Monitoring Stack - Automated Setup

Uso: $0 [OPTIONS]

Opciones:
    --full              Configuración completa (stack + Grafana + Slack)
    --stack-only        Solo docker-compose
    --grafana-only      Solo bootstrap de Grafana
    --slack             Configurar Slack webhook
    --health            Health check del stack
    --clean             Detener y limpiar
    --help              Esta ayuda

Ejemplos:
    # Setup completo (recomendado para primera vez)
    $0 --full

    # Solo iniciar stack
    $0 --stack-only

    # Configurar Slack después
    $0 --slack

    # Verificar salud
    $0 --health

    # Limpiar todo
    $0 --clean

Para detalles completos, ver: MONITORING_QUICKSTART.md
EOF
}

# Main
main() {
    echo -e "${BLUE}"
    cat << "EOF"
╔══════════════════════════════════════════════════════════════╗
║   JPUNS Monitoring Stack - Automated Setup                   ║
║   CI/CD + Prometheus + Grafana + Alertmanager               ║
╚══════════════════════════════════════════════════════════════╝
EOF
    echo -e "${NC}"

    if [ $# -eq 0 ]; then
        show_help
        exit 0
    fi

    case "$1" in
        --full)
            check_prerequisites
            start_stack
            bootstrap_grafana
            health_check
            configure_slack
            log_success "Setup completo exitoso!"
            log_info "Próximos pasos:"
            log_info "1. Accede a Grafana: http://localhost:3001"
            log_info "2. Crea dashboards usando: GRAFANA_DASHBOARDS_GUIDE.md"
            log_info "3. Prueba alertas ejecutando: ./scripts/test-alerts.sh"
            ;;
        --stack-only)
            check_prerequisites
            start_stack
            health_check
            ;;
        --grafana-only)
            bootstrap_grafana
            ;;
        --slack)
            configure_slack
            ;;
        --health)
            health_check
            ;;
        --clean)
            cleanup
            ;;
        --help)
            show_help
            ;;
        *)
            log_error "Opción desconocida: $1"
            show_help
            exit 1
            ;;
    esac
}

main "$@"
