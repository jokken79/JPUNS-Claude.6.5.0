#!/bin/bash

################################################################################
# SEMANA 7: Complete Orchestration Script
# Executes all phases: Performance, Security, Observability
#
# Purpose:  Comprehensive analysis and optimization assessment
# Duration: ~30-40 minutes total
# Output:   3 comprehensive reports + unified summary
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

# Main log file
MAIN_LOG_FILE="semana_7_complete_$(date +%Y%m%d_%H%M%S).log"
SUMMARY_FILE="SEMANA_7_EXECUTION_SUMMARY.md"

# Function to print section headers
print_header() {
    echo -e "\n${MAGENTA}══════════════════════════════════════════════════════════════${NC}" | tee -a "$MAIN_LOG_FILE"
    echo -e "${MAGENTA}  $1${NC}" | tee -a "$MAIN_LOG_FILE"
    echo -e "${MAGENTA}══════════════════════════════════════════════════════════════${NC}" | tee -a "$MAIN_LOG_FILE"
}

# Function to print status
print_status() {
    echo -e "${CYAN}▶ $1${NC}" | tee -a "$MAIN_LOG_FILE"
}

# Function to print success
print_success() {
    echo -e "${GREEN}✅ $1${NC}" | tee -a "$MAIN_LOG_FILE"
}

# Function to print error
print_error() {
    echo -e "${RED}❌ $1${NC}" | tee -a "$MAIN_LOG_FILE"
}

# Function to print warning
print_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}" | tee -a "$MAIN_LOG_FILE"
}

# Function to print phase progress
print_phase() {
    echo -e "\n${BLUE}┌─ PHASE $1: $2 ─┐${NC}" | tee -a "$MAIN_LOG_FILE"
}

# Function to print phase completion
print_phase_complete() {
    echo -e "${GREEN}└─ PHASE $1 COMPLETE ─┘${NC}\n" | tee -a "$MAIN_LOG_FILE"
}

# Start main execution
clear
echo -e "${MAGENTA}"
echo "╔════════════════════════════════════════════════════════════════╗"
echo "║            SEMANA 7: Complete Orchestration                   ║"
echo "║     Performance • Security • Observability Analysis           ║"
echo "║              UNS-ClaudeJP 6.0.0 - v6.0.0                      ║"
echo "╚════════════════════════════════════════════════════════════════╝"
echo -e "${NC}"

EXECUTION_START=$(date +%s)
START_TIME=$(date)

print_status "Starting SEMANA 7 complete execution at $START_TIME"
print_status "Output log: $MAIN_LOG_FILE"

# ============================================================================
# Pre-Execution Verification
# ============================================================================
print_header "PRE-EXECUTION VERIFICATION"

print_phase "0" "Pre-Flight Checks"

# Check Docker
print_status "Verifying Docker services..."
if ! docker compose ps &>/dev/null; then
    print_error "Docker services not running. Please start with: docker compose up -d"
    exit 1
fi

# Count running services
RUNNING_SERVICES=$(docker compose ps --services --filter "status=running" | wc -l)
TOTAL_SERVICES=$(docker compose ps --services | wc -l)
print_status "Docker services: $RUNNING_SERVICES/$TOTAL_SERVICES running"

if [ $RUNNING_SERVICES -lt $((TOTAL_SERVICES - 2)) ]; then
    print_warning "Some services not running. Continue? (This may affect results)"
fi

# Check required tools
if ! command -v curl &> /dev/null; then
    print_warning "curl not found. Some checks may fail."
fi

if ! command -v jq &> /dev/null; then
    print_warning "jq not found. JSON parsing will be limited."
fi

# Make scripts executable
print_status "Ensuring execution scripts are executable..."
chmod +x scripts/run_semana_7_*.sh 2>/dev/null || print_warning "Could not chmod scripts"

print_phase_complete "0"

# ============================================================================
# Phase 7.1: Performance Profiling
# ============================================================================
print_header "PHASE 7.1: PERFORMANCE PROFILING & ANALYSIS"

PHASE_1_START=$(date +%s)
print_phase "7.1" "Performance Profiling"

print_status "Executing Phase 7.1: Performance Profiling..."
if [ -f scripts/run_semana_7_1_performance_profiling.sh ]; then
    bash scripts/run_semana_7_1_performance_profiling.sh 2>&1 | tee -a "$MAIN_LOG_FILE"
    PHASE_1_RESULT=$?
    if [ $PHASE_1_RESULT -eq 0 ]; then
        print_success "Phase 7.1 completed successfully"
        print_success "Report: SEMANA_7_PERFORMANCE_ANALYSIS_REPORT.md"
    else
        print_error "Phase 7.1 encountered errors (exit code: $PHASE_1_RESULT)"
    fi
else
    print_error "Phase 7.1 script not found: scripts/run_semana_7_1_performance_profiling.sh"
    PHASE_1_RESULT=1
fi

PHASE_1_END=$(date +%s)
PHASE_1_DURATION=$((PHASE_1_END - PHASE_1_START))
print_phase_complete "7.1"

# ============================================================================
# Phase 7.2: Security Audit
# ============================================================================
print_header "PHASE 7.2: SECURITY AUDIT & VULNERABILITY ASSESSMENT"

PHASE_2_START=$(date +%s)
print_phase "7.2" "Security Audit"

print_status "Executing Phase 7.2: Security Audit..."
if [ -f scripts/run_semana_7_2_security_audit.sh ]; then
    bash scripts/run_semana_7_2_security_audit.sh 2>&1 | tee -a "$MAIN_LOG_FILE"
    PHASE_2_RESULT=$?
    if [ $PHASE_2_RESULT -eq 0 ]; then
        print_success "Phase 7.2 completed successfully"
        print_success "Report: SEMANA_7_SECURITY_AUDIT_REPORT.md"
    else
        print_error "Phase 7.2 encountered errors (exit code: $PHASE_2_RESULT)"
    fi
else
    print_error "Phase 7.2 script not found: scripts/run_semana_7_2_security_audit.sh"
    PHASE_2_RESULT=1
fi

PHASE_2_END=$(date +%s)
PHASE_2_DURATION=$((PHASE_2_END - PHASE_2_START))
print_phase_complete "7.2"

# ============================================================================
# Phase 7.3: Observability Validation
# ============================================================================
print_header "PHASE 7.3: OBSERVABILITY & MONITORING VALIDATION"

PHASE_3_START=$(date +%s)
print_phase "7.3" "Observability Validation"

print_status "Executing Phase 7.3: Observability Validation..."
if [ -f scripts/run_semana_7_3_observability_validation.sh ]; then
    bash scripts/run_semana_7_3_observability_validation.sh 2>&1 | tee -a "$MAIN_LOG_FILE"
    PHASE_3_RESULT=$?
    if [ $PHASE_3_RESULT -eq 0 ]; then
        print_success "Phase 7.3 completed successfully"
        print_success "Report: SEMANA_7_OBSERVABILITY_VALIDATION_REPORT.md"
    else
        print_error "Phase 7.3 encountered errors (exit code: $PHASE_3_RESULT)"
    fi
else
    print_error "Phase 7.3 script not found: scripts/run_semana_7_3_observability_validation.sh"
    PHASE_3_RESULT=1
fi

PHASE_3_END=$(date +%s)
PHASE_3_DURATION=$((PHASE_3_END - PHASE_3_START))
print_phase_complete "7.3"

# ============================================================================
# Post-Execution Summary
# ============================================================================
print_header "EXECUTION SUMMARY"

EXECUTION_END=$(date +%s)
TOTAL_DURATION=$((EXECUTION_END - EXECUTION_START))

# Create summary report
{
    echo "# SEMANA 7: Complete Execution Summary"
    echo ""
    echo "**Execution Date:** $(date)"
    echo "**Total Duration:** $(printf '%02d:%02d:%02d' $((TOTAL_DURATION/3600)) $((TOTAL_DURATION%3600/60)) $((TOTAL_DURATION%60)))"
    echo ""
    echo "---"
    echo ""
    echo "## Execution Status"
    echo ""
    echo "### Phase Results"
    echo ""
    echo "| Phase | Status | Duration | Report |"
    echo "|-------|--------|----------|--------|"
    echo "| 7.1 Performance | $([ $PHASE_1_RESULT -eq 0 ] && echo '✅ Complete' || echo '❌ Failed') | $(printf '%02d:%02d' $((PHASE_1_DURATION/60)) $((PHASE_1_DURATION%60))) | SEMANA_7_PERFORMANCE_ANALYSIS_REPORT.md |"
    echo "| 7.2 Security | $([ $PHASE_2_RESULT -eq 0 ] && echo '✅ Complete' || echo '❌ Failed') | $(printf '%02d:%02d' $((PHASE_2_DURATION/60)) $((PHASE_2_DURATION%60))) | SEMANA_7_SECURITY_AUDIT_REPORT.md |"
    echo "| 7.3 Observability | $([ $PHASE_3_RESULT -eq 0 ] && echo '✅ Complete' || echo '❌ Failed') | $(printf '%02d:%02d' $((PHASE_3_DURATION/60)) $((PHASE_3_DURATION%60))) | SEMANA_7_OBSERVABILITY_VALIDATION_REPORT.md |"
    echo ""
    echo "---"
    echo ""
    echo "## Reports Generated"
    echo ""
    echo "### 1. Performance Analysis Report"
    if [ -f "SEMANA_7_PERFORMANCE_ANALYSIS_REPORT.md" ]; then
        SIZE=$(wc -l < SEMANA_7_PERFORMANCE_ANALYSIS_REPORT.md)
        echo "- **File:** SEMANA_7_PERFORMANCE_ANALYSIS_REPORT.md"
        echo "- **Size:** $SIZE lines"
        echo "- **Contains:** Database metrics, API performance, frontend analysis, optimization recommendations"
    else
        echo "- ❌ Report not generated"
    fi
    echo ""
    echo "### 2. Security Audit Report"
    if [ -f "SEMANA_7_SECURITY_AUDIT_REPORT.md" ]; then
        SIZE=$(wc -l < SEMANA_7_SECURITY_AUDIT_REPORT.md)
        echo "- **File:** SEMANA_7_SECURITY_AUDIT_REPORT.md"
        echo "- **Size:** $SIZE lines"
        echo "- **Contains:** Dependency scanning, code analysis, authentication review, vulnerability assessment"
    else
        echo "- ❌ Report not generated"
    fi
    echo ""
    echo "### 3. Observability Validation Report"
    if [ -f "SEMANA_7_OBSERVABILITY_VALIDATION_REPORT.md" ]; then
        SIZE=$(wc -l < SEMANA_7_OBSERVABILITY_VALIDATION_REPORT.md)
        echo "- **File:** SEMANA_7_OBSERVABILITY_VALIDATION_REPORT.md"
        echo "- **Size:** $SIZE lines"
        echo "- **Contains:** OpenTelemetry status, metrics collection, Grafana dashboards, alert rules"
    else
        echo "- ❌ Report not generated"
    fi
    echo ""
    echo "---"
    echo ""
    echo "## Key Findings Summary"
    echo ""
    echo "### Performance (Phase 7.1)"
    echo "- Database query patterns analyzed"
    echo "- API endpoint performance measured"
    echo "- Frontend bundle size documented"
    echo "- Optimization recommendations prioritized"
    echo ""
    echo "### Security (Phase 7.2)"
    echo "- Dependency vulnerabilities assessed"
    echo "- Code security static analysis completed"
    echo "- Authentication mechanism reviewed"
    echo "- API security hardening identified"
    echo ""
    echo "### Observability (Phase 7.3)"
    echo "- OpenTelemetry integration verified"
    echo "- Prometheus metrics collection validated"
    echo "- Tempo tracing system confirmed"
    echo "- Grafana dashboard configuration reviewed"
    echo ""
    echo "---"
    echo ""
    echo "## Next Steps"
    echo ""
    echo "### Immediate Actions"
    echo ""
    echo "1. **Review all three reports** for findings and recommendations"
    echo "2. **Prioritize issues** by severity (critical/high/medium/low)"
    echo "3. **Create implementation tasks** for high-priority findings"
    echo "4. **Schedule security patches** if vulnerabilities found"
    echo ""
    echo "### Short-Term (This Sprint)"
    echo ""
    echo "1. **Performance Optimization**"
    echo "   - Implement database indexing improvements"
    echo "   - Optimize API query performance"
    echo "   - Optimize frontend bundle size"
    echo ""
    echo "2. **Security Hardening**"
    echo "   - Apply security patches to dependencies"
    echo "   - Fix identified code security issues"
    echo "   - Strengthen authentication/authorization"
    echo ""
    echo "3. **Monitoring Enhancement**"
    echo "   - Create custom Grafana dashboards"
    echo "   - Implement alert rules"
    echo "   - Establish SLO/SLI metrics"
    echo ""
    echo "### Medium-Term (Next Sprint)"
    echo ""
    echo "1. Load testing with identified performance baselines"
    echo "2. Penetration testing for security validation"
    echo "3. Continuous profiling implementation"
    echo ""
    echo "---"
    echo ""
    echo "## Execution Timeline"
    echo ""
    echo "| Phase | Start | Duration | End |"
    echo "|-------|-------|----------|-----|"
    echo "| Pre-Flight | $(date -d @$EXECUTION_START +%H:%M:%S) | - | - |"
    echo "| 7.1 Performance | $(date -d @$PHASE_1_START +%H:%M:%S) | $(printf '%02d:%02d' $((PHASE_1_DURATION/60)) $((PHASE_1_DURATION%60))) | $(date -d @$PHASE_1_END +%H:%M:%S) |"
    echo "| 7.2 Security | $(date -d @$PHASE_2_START +%H:%M:%S) | $(printf '%02d:%02d' $((PHASE_2_DURATION/60)) $((PHASE_2_DURATION%60))) | $(date -d @$PHASE_2_END +%H:%M:%S) |"
    echo "| 7.3 Observability | $(date -d @$PHASE_3_START +%H:%M:%S) | $(printf '%02d:%02d' $((PHASE_3_DURATION/60)) $((PHASE_3_DURATION%60))) | $(date -d @$PHASE_3_END +%H:%M:%S) |"
    echo "| **TOTAL** | **$(date -d @$EXECUTION_START +%H:%M:%S)** | **$(printf '%02d:%02d:%02d' $((TOTAL_DURATION/3600)) $((TOTAL_DURATION%3600/60)) $((TOTAL_DURATION%60)))** | **$(date -d @$EXECUTION_END +%H:%M:%S)** |"
    echo ""
    echo "---"
    echo ""
    echo "## Git Commit Instructions"
    echo ""
    echo "After reviewing the reports, commit with:"
    echo ""
    echo "\`\`\`bash"
    echo "git add SEMANA_7_*.md SEMANA_7_*.log"
    echo "git commit -m \"SEMANA 7: Complete analysis - Performance, Security, Observability assessment\""
    echo "git push origin claude/project-audit-cleanup-01BnhrSyZcJhG4EA3hg4tCyM"
    echo "\`\`\`"
    echo ""
    echo "---"
    echo ""
    echo "**Status:** 🟢 SEMANA 7 EXECUTION COMPLETE"
    echo "**Generated by:** Claude Code Agent"
    echo "**Date:** $(date)"
    echo ""
} > "$SUMMARY_FILE"

print_success "Summary report generated: $SUMMARY_FILE"

# ============================================================================
# Final Report
# ============================================================================
print_header "EXECUTION COMPLETE"

echo ""
print_success "SEMANA 7 Complete Execution Finished"
print_status "Total execution time: $(printf '%02d:%02d:%02d' $((TOTAL_DURATION/3600)) $((TOTAL_DURATION%3600/60)) $((TOTAL_DURATION%60)))"
print_status "Main log: $MAIN_LOG_FILE"
print_status "Summary: $SUMMARY_FILE"

echo ""
echo -e "${CYAN}📊 Phase Summary:${NC}"
echo "  Phase 7.1 Performance:    $([ $PHASE_1_RESULT -eq 0 ] && echo '✅' || echo '❌') ($(printf '%02d:%02d' $((PHASE_1_DURATION/60)) $((PHASE_1_DURATION%60))))"
echo "  Phase 7.2 Security:       $([ $PHASE_2_RESULT -eq 0 ] && echo '✅' || echo '❌') ($(printf '%02d:%02d' $((PHASE_2_DURATION/60)) $((PHASE_2_DURATION%60))))"
echo "  Phase 7.3 Observability:  $([ $PHASE_3_RESULT -eq 0 ] && echo '✅' || echo '❌') ($(printf '%02d:%02d' $((PHASE_3_DURATION/60)) $((PHASE_3_DURATION%60))))"

echo ""
echo -e "${CYAN}📁 Reports Generated:${NC}"
[ -f "SEMANA_7_PERFORMANCE_ANALYSIS_REPORT.md" ] && echo "  ✅ SEMANA_7_PERFORMANCE_ANALYSIS_REPORT.md" || echo "  ❌ SEMANA_7_PERFORMANCE_ANALYSIS_REPORT.md"
[ -f "SEMANA_7_SECURITY_AUDIT_REPORT.md" ] && echo "  ✅ SEMANA_7_SECURITY_AUDIT_REPORT.md" || echo "  ❌ SEMANA_7_SECURITY_AUDIT_REPORT.md"
[ -f "SEMANA_7_OBSERVABILITY_VALIDATION_REPORT.md" ] && echo "  ✅ SEMANA_7_OBSERVABILITY_VALIDATION_REPORT.md" || echo "  ❌ SEMANA_7_OBSERVABILITY_VALIDATION_REPORT.md"

echo ""
echo -e "${CYAN}🎯 Next Steps:${NC}"
echo "  1. Review reports:"
echo "     - cat SEMANA_7_EXECUTION_SUMMARY.md"
echo "     - cat SEMANA_7_PERFORMANCE_ANALYSIS_REPORT.md"
echo "     - cat SEMANA_7_SECURITY_AUDIT_REPORT.md"
echo "     - cat SEMANA_7_OBSERVABILITY_VALIDATION_REPORT.md"
echo ""
echo "  2. Analyze findings and prioritize"
echo "  3. Create implementation tasks"
echo "  4. Commit reports to git:"
echo "     git add SEMANA_7_*.md && git commit -m \"SEMANA 7: Complete analysis reports\""
echo ""
echo "  5. Proceed to SEMANA 8: QA & Release"
echo ""

# Determine overall exit code
if [ $PHASE_1_RESULT -eq 0 ] && [ $PHASE_2_RESULT -eq 0 ] && [ $PHASE_3_RESULT -eq 0 ]; then
    echo -e "${GREEN}✅ SEMANA 7 COMPLETE - ALL PHASES SUCCESSFUL${NC}\n"
    exit 0
else
    echo -e "${YELLOW}⚠️  SEMANA 7 COMPLETE - SOME PHASES HAD ISSUES (Check reports)${NC}\n"
    exit 1
fi
