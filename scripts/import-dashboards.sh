#!/bin/bash

################################################################################
# JPUNS Grafana Dashboard Importer
#
# Propósito: Importar automáticamente dashboards preconfigurados a Grafana
# Uso: ./import-dashboards.sh [OPTIONS]
#
# Options:
#   --all           Importar todos los dashboards
#   --list          Listar dashboards disponibles
#   --help          Mostrar esta ayuda
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

# Variables
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
DASHBOARDS_DIR="$(dirname "$SCRIPT_DIR")/monitoring/dashboards"
GRAFANA_URL="http://localhost:3001"
GRAFANA_USER="admin"
GRAFANA_PASSWORD="admin_password_123"

# Verificar que Grafana está accesible
check_grafana() {
    log_info "Verificando que Grafana está disponible..."

    HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" "$GRAFANA_URL/api/health")

    if [ "$HTTP_CODE" != "200" ]; then
        log_error "Grafana no está disponible (HTTP $HTTP_CODE)"
        log_info "Asegúrate de ejecutar primero: ./setup-monitoring.sh --stack-only"
        exit 1
    fi

    log_success "Grafana conectado"
}

# Listar dashboards disponibles
list_dashboards() {
    log_info "Dashboards disponibles:"
    echo ""

    if [ ! -d "$DASHBOARDS_DIR" ]; then
        log_error "Directorio de dashboards no encontrado: $DASHBOARDS_DIR"
        exit 1
    fi

    for dashboard in "$DASHBOARDS_DIR"/*.json; do
        filename=$(basename "$dashboard")
        title=$(grep '"title"' "$dashboard" | head -1 | sed 's/.*"title": "\(.*\)".*/\1/')
        printf "  ${BLUE}%40s${NC} - %s\n" "$filename" "$title"
    done

    echo ""
}

# Obtener datasource ID de Prometheus
get_prometheus_datasource_id() {
    local DS_ID=$(curl -s -X GET "$GRAFANA_URL/api/datasources" \
        -H "Authorization: Bearer $(get_api_token)" \
        -H "Content-Type: application/json" | \
        grep -o '"id":[0-9]*' | head -1 | grep -o '[0-9]*')

    if [ -z "$DS_ID" ]; then
        # Si no hay datasource, crear uno
        log_warning "Datasource de Prometheus no encontrado, creando..."
        DS_ID=$(curl -s -X POST "$GRAFANA_URL/api/datasources" \
            -H "Authorization: Bearer $(get_api_token)" \
            -H "Content-Type: application/json" \
            -d '{
                "name": "Prometheus",
                "type": "prometheus",
                "url": "http://jpuns-prometheus:9090",
                "access": "proxy",
                "isDefault": true
            }' | grep -o '"id":[0-9]*' | grep -o '[0-9]*')
    fi

    echo "$DS_ID"
}

# Obtener API token
get_api_token() {
    curl -s -X POST "$GRAFANA_URL/api/auth/login" \
        -H "Content-Type: application/json" \
        -d "{\"user\": \"$GRAFANA_USER\", \"password\": \"$GRAFANA_PASSWORD\", \"rememberMe\": true}" | \
        grep -o '"token":"[^"]*"' | cut -d'"' -f4
}

# Importar dashboard individual
import_dashboard() {
    local DASHBOARD_FILE="$1"
    local FILENAME=$(basename "$DASHBOARD_FILE")

    if [ ! -f "$DASHBOARD_FILE" ]; then
        log_error "Dashboard no encontrado: $DASHBOARD_FILE"
        return 1
    fi

    log_info "Importando: $FILENAME"

    # Obtener datasource ID
    local DS_ID=$(get_prometheus_datasource_id)

    if [ -z "$DS_ID" ]; then
        log_error "No se pudo obtener Datasource ID"
        return 1
    fi

    # Importar dashboard
    RESPONSE=$(curl -s -X POST "$GRAFANA_URL/api/dashboards/db" \
        -H "Authorization: Bearer $(get_api_token)" \
        -H "Content-Type: application/json" \
        --data @<(python3 << PYTHON
import json
import sys

with open('$DASHBOARD_FILE', 'r') as f:
    data = json.load(f)

# Reemplazar datasource IDs
dashboard = data.get('dashboard', data)
dashboard['id'] = None
dashboard['uid'] = None

# Asegurar que usa el datasource correcto
for panel in dashboard.get('panels', []):
    for target in panel.get('targets', []):
        target['datasourceUid'] = '$DS_ID'

output = {
    'dashboard': dashboard,
    'overwrite': True,
    'message': 'Imported by JPUNS automation'
}

print(json.dumps(output))
PYTHON
))

    # Verificar si fue exitoso
    if echo "$RESPONSE" | grep -q '"status":"success"'; then
        DASHBOARD_ID=$(echo "$RESPONSE" | grep -o '"id":[0-9]*' | head -1 | grep -o '[0-9]*')
        log_success "Dashboard importado (ID: $DASHBOARD_ID)"
        return 0
    else
        log_error "Error importando dashboard"
        log_info "Response: $RESPONSE"
        return 1
    fi
}

# Importar todos los dashboards
import_all_dashboards() {
    log_info "Importando todos los dashboards..."
    echo ""

    if [ ! -d "$DASHBOARDS_DIR" ]; then
        log_error "Directorio de dashboards no encontrado: $DASHBOARDS_DIR"
        exit 1
    fi

    local COUNT=0
    local SUCCESS=0
    local FAILED=0

    for dashboard in "$DASHBOARDS_DIR"/*.json; do
        ((COUNT++))
        if import_dashboard "$dashboard"; then
            ((SUCCESS++))
        else
            ((FAILED++))
        fi
        sleep 2  # Esperar 2 segundos entre imports
    done

    echo ""
    log_info "Importación completa:"
    log_success "Exitosos: $SUCCESS"
    if [ "$FAILED" -gt 0 ]; then
        log_error "Fallidos: $FAILED"
    fi
}

# Main
show_help() {
    cat << EOF
JPUNS Grafana Dashboard Importer

Uso: $0 [OPTIONS]

Opciones:
    --all           Importar todos los dashboards
    --list          Listar dashboards disponibles
    --help          Esta ayuda

Ejemplos:
    # Listar dashboards disponibles
    $0 --list

    # Importar todos
    $0 --all

Pre-requisitos:
    - Grafana corriendo en $GRAFANA_URL
    - Prometheus datasource configurado
    - Dashboards JSON en: $DASHBOARDS_DIR

Después de importar:
    1. Accede a Grafana: $GRAFANA_URL
    2. Ve a Dashboards para ver los importados
    3. Personaliza según necesites
EOF
}

main() {
    echo -e "${BLUE}"
    cat << "EOF"
╔══════════════════════════════════════════════════════════════╗
║   JPUNS Grafana Dashboard Importer                           ║
║   Auto-import de dashboards preconfigurados                  ║
╚══════════════════════════════════════════════════════════════╝
EOF
    echo -e "${NC}"

    if [ $# -eq 0 ]; then
        show_help
        exit 0
    fi

    case "$1" in
        --all)
            check_grafana
            import_all_dashboards
            ;;
        --list)
            list_dashboards
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
