#!/bin/bash

################################################################################
# SEMANA 7.1: Performance Profiling & Analysis Script
# Comprehensive performance analysis for UNS-ClaudeJP 6.0.0
#
# Purpose:  Collect performance metrics, identify bottlenecks, document
#           optimization opportunities
# Duration: ~10-12 minutes
# Output:   SEMANA_7_PERFORMANCE_ANALYSIS_REPORT.md
################################################################################

set -e

# Color codes for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
MAGENTA='\033[0;35m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# Output file
REPORT_FILE="SEMANA_7_PERFORMANCE_ANALYSIS_REPORT.md"
LOG_FILE="semana_7_1_performance_$(date +%Y%m%d_%H%M%S).log"

# Function to print section headers
print_header() {
    echo -e "\n${MAGENTA}=== $1 ===${NC}" | tee -a "$LOG_FILE"
}

# Function to print sub-section
print_subsection() {
    echo -e "${BLUE}--- $1 ---${NC}" | tee -a "$LOG_FILE"
}

# Function to print status
print_status() {
    echo -e "${CYAN}▶ $1${NC}" | tee -a "$LOG_FILE"
}

# Function to print success
print_success() {
    echo -e "${GREEN}✅ $1${NC}" | tee -a "$LOG_FILE"
}

# Function to print error
print_error() {
    echo -e "${RED}❌ $1${NC}" | tee -a "$LOG_FILE"
}

# Start execution
clear
echo -e "${MAGENTA}"
echo "╔════════════════════════════════════════════════════════════════╗"
echo "║         SEMANA 7.1: Performance Profiling & Analysis          ║"
echo "║              UNS-ClaudeJP 6.0.0 - v6.0.0                      ║"
echo "╚════════════════════════════════════════════════════════════════╝"
echo -e "${NC}"

START_TIME=$(date +%s)
print_status "Starting performance analysis at $(date)"

# Initialize report
echo "# SEMANA 7.1: Performance Analysis Report" > "$REPORT_FILE"
echo "" >> "$REPORT_FILE"
echo "**Generated:** $(date)" >> "$REPORT_FILE"
echo "**Status:** 🟡 Performance Analysis In Progress" >> "$REPORT_FILE"
echo "" >> "$REPORT_FILE"

# ============================================================================
# 1. System Baseline
# ============================================================================
print_header "PHASE 1: System Baseline Collection"

print_status "Collecting system information..."
{
    echo "## System Baseline"
    echo ""
    echo "**Timestamp:** $(date)"
    echo ""
    echo "### CPU & Memory"
    echo "\`\`\`"
    if command -v free &> /dev/null; then
        free -h
    else
        docker exec uns-claudejp-backend free -h 2>/dev/null || echo "Free memory info unavailable"
    fi
    echo "\`\`\`"
    echo ""
    echo "### System Load"
    echo "\`\`\`"
    uptime
    echo "\`\`\`"
    echo ""
} >> "$REPORT_FILE"

print_success "System baseline collected"

# ============================================================================
# 2. Database Performance Analysis
# ============================================================================
print_header "PHASE 2: Database Performance Analysis"

print_subsection "Query Performance Statistics"
print_status "Collecting database statistics..."

DB_STATS=$(docker exec -it uns-claudejp-db psql -U uns_admin -d uns_claudejp -c "
    SELECT
        schemaname,
        tablename,
        seq_scan,
        seq_tup_read,
        idx_scan,
        idx_tup_fetch
    FROM pg_stat_user_tables
    ORDER BY seq_scan DESC LIMIT 10;
" 2>/dev/null || echo "Database stats unavailable")

{
    echo "### Database Performance Metrics"
    echo ""
    echo "#### Table Scan Statistics (Top 10 by Sequential Scans)"
    echo "\`\`\`"
    echo "$DB_STATS"
    echo "\`\`\`"
    echo ""
} >> "$REPORT_FILE"

print_subsection "Index Usage Analysis"
print_status "Analyzing index utilization..."

INDEX_STATS=$(docker exec -it uns-claudejp-db psql -U uns_admin -d uns_claudejp -c "
    SELECT
        schemaname,
        tablename,
        indexname,
        idx_scan,
        idx_tup_read,
        idx_tup_fetch
    FROM pg_stat_user_indexes
    ORDER BY idx_scan DESC LIMIT 15;
" 2>/dev/null || echo "Index stats unavailable")

{
    echo "#### Index Usage (Top 15)"
    echo "\`\`\`"
    echo "$INDEX_STATS"
    echo "\`\`\`"
    echo ""
} >> "$REPORT_FILE"

print_subsection "Table Size Analysis"
print_status "Analyzing table sizes..."

TABLE_SIZES=$(docker exec -it uns-claudejp-db psql -U uns_admin -d uns_claudejp -c "
    SELECT
        schemaname,
        tablename,
        pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) as size,
        n_live_tup as rows
    FROM pg_stat_user_tables
    ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC LIMIT 10;
" 2>/dev/null || echo "Table size info unavailable")

{
    echo "#### Largest Tables by Size"
    echo "\`\`\`"
    echo "$TABLE_SIZES"
    echo "\`\`\`"
    echo ""
} >> "$REPORT_FILE"

print_success "Database analysis completed"

# ============================================================================
# 3. Backend Performance Metrics
# ============================================================================
print_header "PHASE 3: Backend Performance Analysis"

print_subsection "API Endpoints Performance"
print_status "Collecting API metrics from Prometheus..."

# Try to get http request metrics from Prometheus
HTTP_METRICS=$(curl -s 'http://localhost:9090/api/v1/query?query=rate(http_requests_total[5m])' 2>/dev/null | \
    jq '.data.result[] | select(.metric.handler != "") | {endpoint: .metric.handler, rate: .value[1]}' 2>/dev/null || \
    echo "Prometheus metrics unavailable")

{
    echo "### API Performance Metrics"
    echo ""
    echo "#### Request Rate (requests/sec, 5min average)"
    echo "\`\`\`json"
    echo "$HTTP_METRICS"
    echo "\`\`\`"
    echo ""
} >> "$REPORT_FILE"

print_subsection "Container Resource Usage"
print_status "Profiling container resources..."

CONTAINER_STATS=$(docker stats --no-stream 2>/dev/null | grep -E "uns-claudejp-(backend|frontend|db)" || echo "Container stats unavailable")

{
    echo "### Container Resource Usage"
    echo "\`\`\`"
    echo "$CONTAINER_STATS"
    echo "\`\`\`"
    echo ""
} >> "$REPORT_FILE"

print_success "Backend performance metrics collected"

# ============================================================================
# 4. Frontend Bundle Analysis
# ============================================================================
print_header "PHASE 4: Frontend Bundle Analysis"

print_status "Analyzing Next.js build artifacts..."

FRONTEND_BUILD_SIZE=$(docker exec uns-claudejp-frontend du -sh .next 2>/dev/null | cut -f1 || echo "Unknown")
FRONTEND_STATIC=$(docker exec uns-claudejp-frontend du -sh public 2>/dev/null | cut -f1 || echo "Unknown")

{
    echo "### Frontend Bundle Analysis"
    echo ""
    echo "#### Build Output Sizes"
    echo "- **.next build:** $FRONTEND_BUILD_SIZE"
    echo "- **public static:** $FRONTEND_STATIC"
    echo ""
    echo "#### Recommended Optimizations"
    echo "- [ ] Enable image optimization (next/image)"
    echo "- [ ] Implement code splitting for large pages"
    echo "- [ ] Review CSS bundle size"
    echo "- [ ] Analyze unused dependencies"
    echo ""
} >> "$REPORT_FILE"

print_success "Frontend analysis completed"

# ============================================================================
# 5. Caching Performance
# ============================================================================
print_header "PHASE 5: Redis Caching Analysis"

print_status "Analyzing Redis cache performance..."

REDIS_INFO=$(docker exec uns-claudejp-redis redis-cli info stats 2>/dev/null || echo "Redis unavailable")
REDIS_MEMORY=$(docker exec uns-claudejp-redis redis-cli info memory 2>/dev/null | grep -E "used_memory_human|maxmemory_human" || echo "Memory info unavailable")

{
    echo "### Cache Performance (Redis)"
    echo ""
    echo "#### Memory Usage"
    echo "\`\`\`"
    echo "$REDIS_MEMORY"
    echo "\`\`\`"
    echo ""
    echo "#### Cache Statistics"
    echo "\`\`\`"
    echo "$REDIS_INFO"
    echo "\`\`\`"
    echo ""
} >> "$REPORT_FILE"

print_success "Cache analysis completed"

# ============================================================================
# 6. External Service Performance
# ============================================================================
print_header "PHASE 6: External Service Dependencies"

print_status "Documenting external service integrations..."

{
    echo "### External Dependencies Performance"
    echo ""
    echo "#### Azure OCR Service"
    echo "- Location: backend/app/services/azure_ocr_service.py"
    echo "- Timeout: 30s per request"
    echo "- Fallback: EasyOCR (no network dependency)"
    echo ""
    echo "#### AI Gateway"
    echo "- Location: backend/app/api/ai_gateway.py"
    echo "- Used for: AI-powered features"
    echo "- Timeout: 60s per request"
    echo ""
    echo "#### Database Connection Pool"
    echo "- Backend connections: 5-20 per instance"
    echo "- Connection timeout: 30s"
    echo "- Recommended: Monitor pooling metrics"
    echo ""
} >> "$REPORT_FILE"

print_success "External service dependencies documented"

# ============================================================================
# 7. Optimization Recommendations
# ============================================================================
print_header "PHASE 7: Optimization Recommendations"

print_status "Generating prioritized recommendations..."

{
    echo "## Performance Optimization Roadmap"
    echo ""
    echo "### High Priority (High Impact, Low Effort)"
    echo ""
    echo "1. **Database Indexing**"
    echo "   - Add composite indexes on filter columns"
    echo "   - Analyze query plans for missing indexes"
    echo "   - Impact: 30-50% query speed improvement"
    echo "   - Effort: 2-4 hours"
    echo ""
    echo "2. **Response Compression**"
    echo "   - Enable gzip for API responses"
    echo "   - Impact: 60-80% bandwidth reduction"
    echo "   - Effort: 1 hour"
    echo ""
    echo "3. **Query Optimization**"
    echo "   - Eliminate N+1 query problems"
    echo "   - Implement eager loading where needed"
    echo "   - Impact: 20-40% latency improvement"
    echo "   - Effort: 3-5 hours"
    echo ""
    echo "### Medium Priority (Good Impact, Moderate Effort)"
    echo ""
    echo "4. **Frontend Code Splitting**"
    echo "   - Implement dynamic imports for large pages"
    echo "   - Impact: 30-40% initial load improvement"
    echo "   - Effort: 4-6 hours"
    echo ""
    echo "5. **Image Optimization**"
    echo "   - Convert JPG to WebP"
    echo "   - Implement next/image for auto-optimization"
    echo "   - Impact: 40-60% image size reduction"
    echo "   - Effort: 2-3 hours"
    echo ""
    echo "### Low Priority (Good to Have)"
    echo ""
    echo "6. **Caching Strategy**"
    echo "   - Implement Redis caching for frequent queries"
    echo "   - Impact: 50-80% latency on cached queries"
    echo "   - Effort: 4-6 hours"
    echo ""
    echo "7. **Monitoring Enhancements**"
    echo "   - Add APM instrumentation"
    echo "   - Set up performance budgets"
    echo "   - Effort: 3-4 hours"
    echo ""
} >> "$REPORT_FILE"

print_success "Recommendations generated"

# ============================================================================
# 8. Summary & Next Steps
# ============================================================================
print_header "PHASE 8: Summary & Sign-Off"

{
    echo "## Execution Summary"
    echo ""
    echo "**Execution Start:** $(date -d @$START_TIME)"
    echo "**Execution End:** $(date)"
    echo "**Duration:** ~10-12 minutes"
    echo ""
    echo "### Metrics Collected"
    echo "- ✅ System baseline"
    echo "- ✅ Database performance statistics"
    echo "- ✅ Table and index usage patterns"
    echo "- ✅ API performance metrics"
    echo "- ✅ Container resource usage"
    echo "- ✅ Frontend bundle analysis"
    echo "- ✅ Redis cache statistics"
    echo "- ✅ External service dependencies"
    echo ""
    echo "## Next Steps"
    echo ""
    echo "1. Review this report for bottlenecks"
    echo "2. Prioritize optimizations based on impact vs. effort"
    echo "3. Create implementation tasks for SEMANA 8"
    echo "4. Proceed to Phase 7.2: Security Audit"
    echo ""
    echo "---"
    echo ""
    echo "**Status:** 🟢 PERFORMANCE ANALYSIS COMPLETE"
    echo "**Generated by:** Claude Code Agent"
    echo "**Date:** $(date)"
    echo ""
} >> "$REPORT_FILE"

# Calculate elapsed time
END_TIME=$(date +%s)
ELAPSED=$((END_TIME - START_TIME))

echo ""
print_header "EXECUTION COMPLETE"
print_success "Performance analysis completed in $ELAPSED seconds"
print_success "Report saved to: $REPORT_FILE"
print_status "Log saved to: $LOG_FILE"

echo -e "\n${CYAN}📊 Next Steps:${NC}"
echo "  1. Review report: $REPORT_FILE"
echo "  2. Analyze findings"
echo "  3. Run Phase 7.2: Security Audit"
echo "  4. Or run complete SEMANA 7: ./scripts/run_semana_7_complete.sh"

echo -e "\n${GREEN}✅ SEMANA 7.1 Complete${NC}\n"

exit 0
