#!/bin/bash

################################################################################
# JPUNS Monitoring Stack - Health Check Script
#
# Propósito: Verificar la salud del stack completo de monitoreo
# Uso: ./health-check.sh [--continuous] [--interval SECONDS]
#
# Options:
#   --continuous      Monitoreo continuo (Ctrl+C para salir)
#   --interval N      Intervalo entre checks (default: 10s)
#   --verbose         Mostrar detalles adicionales
#   --json            Output en formato JSON
################################################################################

set -e

# Colores
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
GRAY='\033[0;37m'
NC='\033[0m'

# Variables
CONTINUOUS=false
INTERVAL=10
VERBOSE=false
JSON_OUTPUT=false
MONITORING_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/../monitoring" && pwd)"

# Estadísticas
declare -A HEALTH_STATS
HEALTH_STATS[total]=0
HEALTH_STATS[passed]=0
HEALTH_STATS[failed]=0
HEALTH_STATS[timestamp]=$(date)

# Funciones de log
log_check() {
    printf "%-40s " "$1..."
}

log_pass() {
    echo -e "${GREEN}✅${NC}"
}

log_fail() {
    echo -e "${RED}❌${NC}"
}

log_warn() {
    echo -e "${YELLOW}⚠️ ${NC}"
}

log_skip() {
    echo -e "${GRAY}⏭️ ${NC}"
}

# Obtener columnas de terminal
get_terminal_width() {
    tput cols 2>/dev/null || echo 80
}

# Divider
print_divider() {
    local width=$(get_terminal_width)
    printf '%*s\n' $width | tr ' ' '='
}

# Header
print_header() {
    echo -e "${BLUE}"
    cat << "EOF"
╔════════════════════════════════════════════════════════════════╗
║     JPUNS Monitoring Stack - Health Check                      ║
║     Comprehensive System Diagnostics                           ║
╚════════════════════════════════════════════════════════════════╝
EOF
    echo -e "${NC}"
}

# Check Docker
check_docker() {
    echo -e "\n${BLUE}📦 DOCKER & CONTAINERS${NC}"
    print_divider

    local width=$(get_terminal_width)

    # Docker daemon
    log_check "Docker daemon"
    if docker ps &>/dev/null; then
        log_pass
        ((HEALTH_STATS[passed]++))
    else
        log_fail
        ((HEALTH_STATS[failed]++))
    fi
    ((HEALTH_STATS[total]++))

    # docker-compose
    log_check "docker-compose"
    if command -v docker-compose &>/dev/null; then
        VERSION=$(docker-compose --version 2>/dev/null | awk '{print $NF}')
        printf "%s " "$VERSION"
        log_pass
        ((HEALTH_STATS[passed]++))
    else
        log_fail
        ((HEALTH_STATS[failed]++))
    fi
    ((HEALTH_STATS[total]++))

    # Containers corriendo
    log_check "Containers en ejecución"
    RUNNING=$(docker ps -q | wc -l)
    EXPECTED=8
    if [ "$RUNNING" -ge "$EXPECTED" ]; then
        printf "(%d de %d) " "$RUNNING" "$EXPECTED"
        log_pass
        ((HEALTH_STATS[passed]++))
    else
        printf "(%d de %d) " "$RUNNING" "$EXPECTED"
        log_warn
        ((HEALTH_STATS[failed]++))
    fi
    ((HEALTH_STATS[total]++))

    if [ "$VERBOSE" == "true" ]; then
        echo ""
        echo -e "${GRAY}Contenedores:${NC}"
        cd "$MONITORING_DIR"
        docker-compose ps | tail -n +2 | awk '{printf "  %-30s %s\n", $1, $2}'
    fi
}

# Check Services
check_services() {
    echo -e "\n${BLUE}🔧 SERVICES & ENDPOINTS${NC}"
    print_divider

    # Prometheus
    log_check "Prometheus (port 9090)"
    if curl -s http://localhost:9090/-/healthy | grep -q "Prometheus is Healthy"; then
        log_pass
        ((HEALTH_STATS[passed]++))
    else
        log_fail
        ((HEALTH_STATS[failed]++))
    fi
    ((HEALTH_STATS[total]++))

    # Grafana
    log_check "Grafana (port 3001)"
    HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:3001/api/health)
    if [ "$HTTP_CODE" == "200" ]; then
        log_pass
        ((HEALTH_STATS[passed]++))
    else
        printf "(HTTP $HTTP_CODE) "
        log_fail
        ((HEALTH_STATS[failed]++))
    fi
    ((HEALTH_STATS[total]++))

    # Alertmanager
    log_check "Alertmanager (port 9093)"
    if curl -s http://localhost:9093/-/healthy 2>/dev/null | grep -q "Alertmanager is Healthy"; then
        log_pass
        ((HEALTH_STATS[passed]++))
    else
        log_fail
        ((HEALTH_STATS[failed]++))
    fi
    ((HEALTH_STATS[total]++))

    # PostgreSQL
    log_check "PostgreSQL (port 5432)"
    if docker exec jpuns-postgres-monitoring pg_isready -U postgres &>/dev/null; then
        log_pass
        ((HEALTH_STATS[passed]++))
    else
        log_fail
        ((HEALTH_STATS[failed]++))
    fi
    ((HEALTH_STATS[total]++))

    # Redis
    log_check "Redis (port 6379)"
    if redis-cli PING &>/dev/null | grep -q "PONG"; then
        log_pass
        ((HEALTH_STATS[passed]++))
    else
        log_fail
        ((HEALTH_STATS[failed]++))
    fi
    ((HEALTH_STATS[total]++))

    # Backend API
    log_check "Backend API (port 8000)"
    if curl -s http://localhost:8000/health &>/dev/null; then
        log_pass
        ((HEALTH_STATS[passed]++))
    else
        log_skip
    fi
    ((HEALTH_STATS[total]++))
}

# Check Prometheus Targets
check_prometheus_targets() {
    echo -e "\n${BLUE}📡 PROMETHEUS TARGETS${NC}"
    print_divider

    TARGETS=$(curl -s http://localhost:9090/api/v1/targets 2>/dev/null || echo '{"data":{"activeTargets":[]}}')

    UP_COUNT=$(echo "$TARGETS" | python3 -c "import sys, json; data=json.load(sys.stdin); print(sum(1 for t in data.get('data',{}).get('activeTargets',[]) if t.get('health')=='up'))" 2>/dev/null || echo "0")
    DOWN_COUNT=$(echo "$TARGETS" | python3 -c "import sys, json; data=json.load(sys.stdin); print(sum(1 for t in data.get('data',{}).get('activeTargets',[]) if t.get('health')=='down'))" 2>/dev/null || echo "0")

    log_check "Targets UP"
    printf "(%d) " "$UP_COUNT"
    if [ "$UP_COUNT" -ge 5 ]; then
        log_pass
        ((HEALTH_STATS[passed]++))
    else
        log_warn
        ((HEALTH_STATS[failed]++))
    fi
    ((HEALTH_STATS[total]++))

    log_check "Targets DOWN"
    printf "(%d) " "$DOWN_COUNT"
    if [ "$DOWN_COUNT" -eq 0 ]; then
        log_pass
        ((HEALTH_STATS[passed]++))
    else
        log_warn
        ((HEALTH_STATS[failed]++))
    fi
    ((HEALTH_STATS[total]++))

    if [ "$VERBOSE" == "true" ]; then
        echo ""
        echo -e "${GRAY}Target Details:${NC}"
        echo "$TARGETS" | python3 -c "
import sys, json
data = json.load(sys.stdin)
for t in data.get('data',{}).get('activeTargets',[]):
    health = '✅' if t['health'] == 'up' else '❌'
    print(f\"  {health} {t['labels'].get('job', 'unknown')}: {t['scrapeUrl']}\")
" 2>/dev/null || echo "  No targets data"
    fi
}

# Check Metrics
check_metrics() {
    echo -e "\n${BLUE}📊 METRICS & DATA${NC}"
    print_divider

    # Prometheus storage
    log_check "Prometheus storage"
    DB_SIZE=$(docker exec jpuns-prometheus du -sh /prometheus 2>/dev/null | awk '{print $1}' || echo "unknown")
    printf "(%s) " "$DB_SIZE"
    log_pass
    ((HEALTH_STATS[passed]++))
    ((HEALTH_STATS[total]++))

    # PostgreSQL size
    log_check "PostgreSQL database size"
    if command -v docker-compose &>/dev/null; then
        DB_SIZE=$(docker exec jpuns-postgres-monitoring psql -U postgres -d jpuns_production -t -c "SELECT pg_size_pretty(pg_database_size('jpuns_production'))" 2>/dev/null || echo "unknown")
        printf "(%s) " "$DB_SIZE"
        log_pass
        ((HEALTH_STATS[passed]++))
    else
        log_skip
    fi
    ((HEALTH_STATS[total]++))

    # Redis memory
    log_check "Redis memory usage"
    REDIS_MEM=$(redis-cli INFO memory 2>/dev/null | grep "used_memory_human" | awk -F: '{print $2}' | tr -d '\r' || echo "unknown")
    printf "(%s) " "$REDIS_MEM"
    log_pass
    ((HEALTH_STATS[passed]++))
    ((HEALTH_STATS[total]++))

    # Active alerts
    log_check "Active alerts in Prometheus"
    ALERT_COUNT=$(curl -s http://localhost:9090/api/v1/query?query=ALERTS 2>/dev/null | python3 -c "import sys, json; print(len(json.load(sys.stdin).get('data',{}).get('result',[])))" 2>/dev/null || echo "0")
    printf "(%d) " "$ALERT_COUNT"
    if [ "$ALERT_COUNT" -eq 0 ]; then
        log_pass
        ((HEALTH_STATS[passed]++))
    else
        log_warn
        ((HEALTH_STATS[failed]++))
    fi
    ((HEALTH_STATS[total]++))
}

# Check Alertmanager
check_alertmanager() {
    echo -e "\n${BLUE}🚨 ALERTMANAGER${NC}"
    print_divider

    # Alertmanager connectivity
    log_check "Alertmanager API"
    if curl -s http://localhost:9093/api/v1/alerts &>/dev/null; then
        log_pass
        ((HEALTH_STATS[passed]++))
    else
        log_fail
        ((HEALTH_STATS[failed]++))
    fi
    ((HEALTH_STATS[total]++))

    # Slack configuration
    log_check "Slack webhook configured"
    if grep -q "slack_api_url" "$MONITORING_DIR/alertmanager.yml" 2>/dev/null; then
        WEBHOOK=$(grep "slack_api_url" "$MONITORING_DIR/alertmanager.yml" | grep -o "https://.*" || echo "not-configured")
        if [[ "$WEBHOOK" != "not-configured" && "$WEBHOOK" =~ ^https:// ]]; then
            log_pass
            ((HEALTH_STATS[passed]++))
        else
            log_warn
        fi
    else
        log_fail
        ((HEALTH_STATS[failed]++))
    fi
    ((HEALTH_STATS[total]++))
}

# Check System Resources
check_system_resources() {
    echo -e "\n${BLUE}💻 SYSTEM RESOURCES${NC}"
    print_divider

    # CPU
    log_check "System CPU usage"
    if command -v grep &>/dev/null; then
        CPU=$(top -bn1 | grep "Cpu(s)" | awk '{print 100 - $8}' | cut -d. -f1 || echo "0")
        printf "(%d%%) " "$CPU"
        if [ "$CPU" -lt 80 ]; then
            log_pass
            ((HEALTH_STATS[passed]++))
        else
            log_warn
        fi
    else
        log_skip
    fi
    ((HEALTH_STATS[total]++))

    # Memory
    log_check "System memory usage"
    if command -v free &>/dev/null; then
        MEM=$(free | grep Mem | awk '{printf "%.0f", ($3/$2)*100}')
        printf "(%d%%) " "$MEM"
        if [ "$MEM" -lt 85 ]; then
            log_pass
            ((HEALTH_STATS[passed]++))
        else
            log_warn
        fi
    else
        log_skip
    fi
    ((HEALTH_STATS[total]++))

    # Disk
    log_check "System disk usage"
    if command -v df &>/dev/null; then
        DISK=$(df / | awk 'NR==2 {printf "%.0f", $5}')
        printf "(%d%%) " "$DISK"
        if [ "$DISK" -lt 90 ]; then
            log_pass
            ((HEALTH_STATS[passed]++))
        else
            log_warn
        fi
    else
        log_skip
    fi
    ((HEALTH_STATS[total]++))
}

# Summary
print_summary() {
    echo -e "\n${BLUE}"
    print_divider
    echo -e "SUMMARY${NC}"
    print_divider

    TOTAL=${HEALTH_STATS[total]}
    PASSED=${HEALTH_STATS[passed]}
    FAILED=${HEALTH_STATS[failed]}

    if [ "$TOTAL" -gt 0 ]; then
        PERCENTAGE=$((PASSED * 100 / TOTAL))
        printf "%-40s" "Health Score"
        printf "%d%% (" "$PERCENTAGE"
        printf "${GREEN}%d passed${NC}," "$PASSED"
        printf "${RED}%d failed${NC})" "$FAILED"
        echo ""

        printf "%-40s" "Timestamp"
        date '+%Y-%m-%d %H:%M:%S'
        echo ""
    fi

    if [ "$FAILED" -gt 0 ]; then
        echo -e "\n${RED}Issues found - Review logs above${NC}"
        return 1
    else
        echo -e "\n${GREEN}All systems healthy!${NC}"
        return 0
    fi
}

# Main loop
main() {
    print_header

    if [ "$CONTINUOUS" == "true" ]; then
        while true; do
            check_docker
            check_services
            check_prometheus_targets
            check_metrics
            check_alertmanager
            check_system_resources
            print_summary
            echo -e "\n${GRAY}Next check in ${INTERVAL}s (Ctrl+C to exit)${NC}\n"
            sleep "$INTERVAL"
            clear
            print_header
        done
    else
        check_docker
        check_services
        check_prometheus_targets
        check_metrics
        check_alertmanager
        check_system_resources
        print_summary
    fi
}

# Parse arguments
while [[ $# -gt 0 ]]; do
    case $1 in
        --continuous)
            CONTINUOUS=true
            shift
            ;;
        --interval)
            INTERVAL=$2
            shift 2
            ;;
        --verbose)
            VERBOSE=true
            shift
            ;;
        --json)
            JSON_OUTPUT=true
            shift
            ;;
        *)
            echo "Unknown option: $1"
            exit 1
            ;;
    esac
done

main
