#!/bin/bash

################################################################################
# JPUNS Performance Profiler
#
# Propósito: Realizar profiling de performance del sistema
# Genera reportes sobre:
#   - Memoria y CPU usage
#   - Proceso bottlenecks
#   - Database query performance
#   - Network I/O
#
# Uso: ./performance-profiler.sh [OPTIONS]
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

# Variables
DURATION=60  # Default 60 seconds
OUTPUT_DIR="/tmp/jpuns-performance"
MONITORING_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/../monitoring" && pwd)"

# Crear output directory
mkdir -p "$OUTPUT_DIR"

# Profile memory usage
profile_memory() {
    log_info "Profiling memory usage (${DURATION}s)..."

    {
        echo "Timestamp,JPUNSBackend(MB),Prometheus(MB),Grafana(MB),PostgreSQL(MB),Redis(MB)"

        for i in $(seq 1 $DURATION); do
            TIMESTAMP=$(date '+%Y-%m-%d %H:%M:%S')

            BACKEND=$(docker stats jpuns-backend --no-stream 2>/dev/null | tail -1 | awk '{print $4}' | sed 's/MiB//' || echo "0")
            PROMETHEUS=$(docker stats jpuns-prometheus --no-stream 2>/dev/null | tail -1 | awk '{print $4}' | sed 's/MiB//' || echo "0")
            GRAFANA=$(docker stats jpuns-grafana --no-stream 2>/dev/null | tail -1 | awk '{print $4}' | sed 's/MiB//' || echo "0")
            POSTGRES=$(docker stats jpuns-postgres-monitoring --no-stream 2>/dev/null | tail -1 | awk '{print $4}' | sed 's/MiB//' || echo "0")
            REDIS=$(docker stats jpuns-redis-monitoring --no-stream 2>/dev/null | tail -1 | awk '{print $4}' | sed 's/MiB//' || echo "0")

            echo "$TIMESTAMP,$BACKEND,$PROMETHEUS,$GRAFANA,$POSTGRES,$REDIS"

            if [ $i -lt $DURATION ]; then
                sleep 1
            fi
        done
    } > "$OUTPUT_DIR/memory-profile.csv"

    log_success "Memory profile saved to $OUTPUT_DIR/memory-profile.csv"
}

# Profile CPU usage
profile_cpu() {
    log_info "Profiling CPU usage (${DURATION}s)..."

    {
        echo "Timestamp,JPUNSBackend(%),Prometheus(%),Grafana(%),PostgreSQL(%),Redis(%)"

        for i in $(seq 1 $DURATION); do
            TIMESTAMP=$(date '+%Y-%m-%d %H:%M:%S')

            BACKEND=$(docker stats jpuns-backend --no-stream 2>/dev/null | tail -1 | awk '{print $2}' | sed 's/%//' || echo "0")
            PROMETHEUS=$(docker stats jpuns-prometheus --no-stream 2>/dev/null | tail -1 | awk '{print $2}' | sed 's/%//' || echo "0")
            GRAFANA=$(docker stats jpuns-grafana --no-stream 2>/dev/null | tail -1 | awk '{print $2}' | sed 's/%//' || echo "0")
            POSTGRES=$(docker stats jpuns-postgres-monitoring --no-stream 2>/dev/null | tail -1 | awk '{print $2}' | sed 's/%//' || echo "0")
            REDIS=$(docker stats jpuns-redis-monitoring --no-stream 2>/dev/null | tail -1 | awk '{print $2}' | sed 's/%//' || echo "0")

            echo "$TIMESTAMP,$BACKEND,$PROMETHEUS,$GRAFANA,$POSTGRES,$REDIS"

            if [ $i -lt $DURATION ]; then
                sleep 1
            fi
        done
    } > "$OUTPUT_DIR/cpu-profile.csv"

    log_success "CPU profile saved to $OUTPUT_DIR/cpu-profile.csv"
}

# Profile database queries
profile_database_queries() {
    log_info "Profiling database queries..."

    POSTGRES_QUERY=$(cat << 'EOF'
SELECT
    query,
    calls,
    ROUND(total_time::numeric, 2) as total_ms,
    ROUND(mean_time::numeric, 2) as mean_ms,
    ROUND(max_time::numeric, 2) as max_ms,
    ROUND((calls::float / EXTRACT(EPOCH FROM (now() - query_start))) * 1000, 2) as calls_per_sec
FROM pg_stat_statements
WHERE query NOT LIKE 'SELECT%pg_stat%'
ORDER BY total_time DESC
LIMIT 20;
EOF
)

    docker exec jpuns-postgres-monitoring psql -U postgres -d jpuns_production -c "$POSTGRES_QUERY" > "$OUTPUT_DIR/database-queries.txt" 2>/dev/null || \
        echo "Could not connect to database" > "$OUTPUT_DIR/database-queries.txt"

    log_success "Database queries saved to $OUTPUT_DIR/database-queries.txt"
}

# Profile network I/O
profile_network() {
    log_info "Profiling network I/O (${DURATION}s)..."

    {
        echo "Timestamp,InterfaceName,BytesSent,BytesRecv,PacketsSent,PacketsRecv"

        for i in $(seq 1 $DURATION); do
            TIMESTAMP=$(date '+%Y-%m-%d %H:%M:%S')

            # Get network stats
            cat /proc/net/dev | tail -n +3 | while read line; do
                IFACE=$(echo $line | awk '{print $1}' | tr -d ':')
                BYTES_RECV=$(echo $line | awk '{print $2}')
                BYTES_SENT=$(echo $line | awk '{print $10}')
                PKT_RECV=$(echo $line | awk '{print $3}')
                PKT_SENT=$(echo $line | awk '{print $11}')

                if [ ! -z "$IFACE" ] && [ "$IFACE" != "lo" ]; then
                    echo "$TIMESTAMP,$IFACE,$BYTES_SENT,$BYTES_RECV,$PKT_SENT,$PKT_RECV"
                fi
            done

            if [ $i -lt $DURATION ]; then
                sleep 1
            fi
        done
    } > "$OUTPUT_DIR/network-profile.csv"

    log_success "Network profile saved to $OUTPUT_DIR/network-profile.csv"
}

# Generate summary report
generate_summary_report() {
    log_info "Generating summary report..."

    cat > "$OUTPUT_DIR/PERFORMANCE_REPORT.md" << 'EOF'
# JPUNS Performance Profile Report

## Executive Summary

This report contains performance profiling data for the JPUNS monitoring system.

## Files Generated

1. **memory-profile.csv** - Memory usage over time for each service
2. **cpu-profile.csv** - CPU usage over time for each service
3. **database-queries.txt** - Top 20 slowest database queries
4. **network-profile.csv** - Network I/O statistics

## Interpretation Guide

### Memory Usage
- Backend should typically use 200-500 MB
- Prometheus storage grows over time (monitor with `--storage.tsdb.retention`)
- PostgreSQL memory depends on database size and connections
- Redis memory depends on cache size

### CPU Usage
- Baseline without load: 5-15%
- Under normal load: 20-40%
- Heavy load: 50-80%
- Alert if sustained > 80%

### Database Queries
- Identify slow queries (mean_ms > 100)
- Look for queries without indexes
- Monitor for n+1 query problems

### Network I/O
- Monitor for network bottlenecks
- Check for unexpected traffic spikes
- Validate that metrics transmission is stable

## Recommendations

Based on the profiling data:

1. **If memory usage is high**
   - Reduce Prometheus retention: `--storage.tsdb.retention.time=7d`
   - Increase container memory limits
   - Check for memory leaks in application logs

2. **If CPU usage is high**
   - Look at slowest queries in database
   - Profile application code for CPU hotspots
   - Check Prometheus scrape interval (might be too aggressive)

3. **If network I/O is high**
   - Monitor metrics transmission overhead
   - Check for large queries being transferred
   - Consider network optimization

## Performance Baseline

Typical healthy system metrics:
- Memory: < 1500 MB total across services
- CPU: < 40% sustained
- Network: < 10 Mbps average
- Database: < 100ms for 95th percentile query time

EOF

    log_success "Summary report saved to $OUTPUT_DIR/PERFORMANCE_REPORT.md"
}

# Show results
show_results() {
    log_info "Performance profiling complete!"
    echo -e "\n${BLUE}Files generated:${NC}"
    ls -lh "$OUTPUT_DIR"

    echo -e "\n${BLUE}To analyze the data:${NC}"
    echo "  cat $OUTPUT_DIR/PERFORMANCE_REPORT.md"
    echo "  head -20 $OUTPUT_DIR/memory-profile.csv"
    echo "  head -20 $OUTPUT_DIR/cpu-profile.csv"

    echo -e "\n${BLUE}To visualize:${NC}"
    echo "  Import CSV files into Excel or Google Sheets"
    echo "  Use: python3 scripts/analyze-performance.py $OUTPUT_DIR/memory-profile.csv"
}

# Main
main() {
    echo -e "${BLUE}"
    cat << "EOF"
╔══════════════════════════════════════════════════════════════╗
║   JPUNS Performance Profiler                                 ║
║   Comprehensive system performance analysis                  ║
╚══════════════════════════════════════════════════════════════╝
EOF
    echo -e "${NC}"

    # Parse arguments
    while [[ $# -gt 0 ]]; do
        case $1 in
            --duration)
                DURATION=$2
                shift 2
                ;;
            --output-dir)
                OUTPUT_DIR=$2
                shift 2
                ;;
            *)
                echo "Unknown option: $1"
                exit 1
                ;;
        esac
    done

    log_info "Profiling duration: ${DURATION}s"
    log_info "Output directory: $OUTPUT_DIR"
    echo ""

    # Run profilers in parallel
    profile_cpu &
    PID_CPU=$!

    profile_memory &
    PID_MEM=$!

    profile_network &
    PID_NET=$!

    # Wait for background jobs
    wait $PID_CPU
    wait $PID_MEM
    wait $PID_NET

    # Synchronous tasks
    profile_database_queries
    generate_summary_report

    # Show results
    echo ""
    show_results
}

main "$@"
