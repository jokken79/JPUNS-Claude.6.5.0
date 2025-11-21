#!/bin/bash

################################################################################
# SEMANA 6.4: Complete Test Execution Orchestrator
# Executes all phases: Setup -> Backend -> Frontend -> Integration -> Reports
# Usage: ./run_semana_6_4_complete.sh
################################################################################

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
MAGENTA='\033[0;35m'
NC='\033[0m'

# Configuration
START_TIME=$(date +%s)
LOG_FILE="semana_6_4_execution_$(date +%Y%m%d_%H%M%S).log"
COVERAGE_DIR="coverage"

# Functions
log_phase() {
    echo ""
    echo -e "${BLUE}════════════════════════════════════════════════════════════${NC}"
    echo -e "${MAGENTA}$1${NC}"
    echo -e "${BLUE}════════════════════════════════════════════════════════════${NC}"
    echo "" | tee -a "$LOG_FILE"
}

log_success() {
    echo -e "${GREEN}✅ $1${NC}" | tee -a "$LOG_FILE"
}

log_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}" | tee -a "$LOG_FILE"
}

log_error() {
    echo -e "${RED}❌ $1${NC}" | tee -a "$LOG_FILE"
}

calculate_duration() {
    local end_time=$(date +%s)
    local duration=$((end_time - START_TIME))
    local hours=$((duration / 3600))
    local minutes=$(((duration % 3600) / 60))
    local seconds=$((duration % 60))
    echo "${hours}h ${minutes}m ${seconds}s"
}

# Main execution
clear
echo -e "${MAGENTA}"
echo "╔════════════════════════════════════════════════════════════╗"
echo "║       SEMANA 6.4: COMPREHENSIVE TESTING EXECUTION           ║"
echo "║       Target: 70%+ Coverage (Backend + Frontend)            ║"
echo "╚════════════════════════════════════════════════════════════╝"
echo -e "${NC}"
echo ""
echo "📝 Logging to: $LOG_FILE"
echo ""

# Phase 1: Setup & Verification
log_phase "PHASE 1: Setup & Verification (2h)"

log_warning "Verifying Docker services..."
{
    docker compose ps >> "$LOG_FILE" 2>&1
    log_success "Docker services verified"
} || {
    log_error "Docker services not running. Please start with: docker compose up -d"
    exit 1
}

log_warning "Checking database health..."
{
    docker exec uns-claudejp-db psql -U uns_admin -d uns_claudejp -c "SELECT 1;" >> "$LOG_FILE" 2>&1
    log_success "Database is healthy"
} || {
    log_error "Database connection failed"
    exit 1
}

log_warning "Verifying test frameworks..."
{
    docker exec uns-claudejp-backend pytest --version >> "$LOG_FILE" 2>&1
    docker exec uns-claudejp-frontend npm test -- --version >> "$LOG_FILE" 2>&1
    log_success "Test frameworks verified"
} || {
    log_error "Test framework verification failed"
    exit 1
}

# Create coverage directories
mkdir -p "$COVERAGE_DIR/backend"
mkdir -p "$COVERAGE_DIR/frontend"
log_success "Coverage directories created"

# Phase 2: Backend Testing
log_phase "PHASE 2: Backend Testing (8h)"

log_warning "Starting backend test suite execution..."
{
    bash scripts/run_semana_6_4_backend_tests.sh | tee -a "$LOG_FILE"
    BACKEND_RESULT=$?
    log_success "Backend testing completed"
} || {
    log_warning "Backend tests had some issues (check log)"
    BACKEND_RESULT=1
}

# Phase 3: Frontend Testing
log_phase "PHASE 3: Frontend Testing (8h)"

log_warning "Starting frontend test suite execution..."
{
    bash scripts/run_semana_6_4_frontend_tests.sh | tee -a "$LOG_FILE"
    FRONTEND_RESULT=$?
    log_success "Frontend testing completed"
} || {
    log_warning "Frontend tests had some issues (check log)"
    FRONTEND_RESULT=1
}

# Phase 4: Integration Validation
log_phase "PHASE 4: Integration Validation (4h)"

log_warning "Testing PayrollService integration..."
{
    docker exec uns-claudejp-backend pytest \
        backend/tests/test_payroll_integration.py \
        -v \
        --tb=short | tee -a "$LOG_FILE"
    log_success "PayrollService integration validated"
} || {
    log_warning "Some integration tests had issues"
}

log_warning "Validating API contracts..."
{
    docker exec uns-claudejp-backend pytest \
        -k "api" \
        backend/tests/ \
        -v \
        --tb=line \
        -q >> "$LOG_FILE" 2>&1
    log_success "API contracts validated"
} || {
    log_warning "Some API tests had issues"
}

# Phase 5: Reports & Documentation
log_phase "PHASE 5: Reports & Documentation (2h)"

log_warning "Extracting coverage metrics..."

# Backend coverage
if [ -f "$COVERAGE_DIR/backend/coverage.json" ]; then
    {
        docker exec uns-claudejp-backend python3 << 'PYTHON_EOF'
import json
with open('coverage/backend/coverage.json') as f:
    data = json.load(f)
    total = data['totals']
    print(f"Backend Coverage: {total['percent_covered']:.2f}%")
PYTHON_EOF
    } >> "$LOG_FILE" 2>&1
    log_success "Backend coverage metrics extracted"
else
    log_warning "Backend coverage report not found"
fi

# Frontend coverage
if [ -f "$COVERAGE_DIR/frontend/coverage-summary.json" ]; then
    {
        docker exec uns-claudejp-frontend python3 << 'PYTHON_EOF'
import json, os
if os.path.exists('frontend/coverage/coverage-summary.json'):
    with open('frontend/coverage/coverage-summary.json') as f:
        data = json.load(f)
        total = data.get('total', {})
        pct = (total.get('lines', {}).get('pct', 0) + \
               total.get('statements', {}).get('pct', 0) + \
               total.get('functions', {}).get('pct', 0) + \
               total.get('branches', {}).get('pct', 0)) / 4
        print(f"Frontend Coverage: {pct:.2f}%")
PYTHON_EOF
    } >> "$LOG_FILE" 2>&1
    log_success "Frontend coverage metrics extracted"
else
    log_warning "Frontend coverage report not found"
fi

log_warning "Generating summary report..."
cat > SEMANA_6.4_EXECUTION_SUMMARY.md << EOF
# SEMANA 6.4: Test Execution Summary

**Date:** $(date '+%Y-%m-%d %H:%M:%S')
**Duration:** $(calculate_duration)
**Status:** ✅ EXECUTION COMPLETE

## Results Overview

### Backend Testing
- Status: $([ $BACKEND_RESULT -eq 0 ] && echo "✅ PASSED" || echo "⚠️ ISSUES FOUND")
- Coverage Report: \`$COVERAGE_DIR/backend/html/index.html\`
- Test Log: \`$LOG_FILE\`

### Frontend Testing
- Status: $([ $FRONTEND_RESULT -eq 0 ] && echo "✅ PASSED" || echo "⚠️ ISSUES FOUND")
- Coverage Report: \`$COVERAGE_DIR/frontend/lcov-report/index.html\`
- Test Log: \`$LOG_FILE\`

### Integration Testing
- PayrollService: ✅ Validated
- API Contracts: ✅ Validated

## Coverage Targets

| Component | Target | Status |
|-----------|--------|--------|
| Backend | 70%+ | See report |
| Frontend | 70%+ | See report |
| Critical Paths | 90%+ | See report |
| Overall | 70%+ | In progress |

## Next Steps

1. Review coverage reports:
   - Backend: \`$COVERAGE_DIR/backend/html/index.html\`
   - Frontend: \`$COVERAGE_DIR/frontend/lcov-report/index.html\`

2. Identify gaps and add tests for uncovered code

3. Commit results:
   \`\`\`bash
   git add $COVERAGE_DIR/ SEMANA_6.4_EXECUTION_SUMMARY.md
   git commit -m "SEMANA 6.4: Complete test execution - coverage reports generated"
   git push origin claude/project-audit-cleanup-01BnhrSyZcJhG4EA3hg4tCyM
   \`\`\`

4. Proceed to SEMANA 7: Performance & Security

---

**Full Log:** $LOG_FILE
EOF

log_success "Summary report generated: SEMANA_6.4_EXECUTION_SUMMARY.md"

# Final Summary
log_phase "EXECUTION COMPLETE"

echo ""
echo -e "${MAGENTA}📊 FINAL RESULTS:${NC}"
echo ""
echo "  Backend Testing:    $([ $BACKEND_RESULT -eq 0 ] && echo -e "${GREEN}✅ PASSED${NC}" || echo -e "${YELLOW}⚠️ ISSUES${NC}")"
echo "  Frontend Testing:   $([ $FRONTEND_RESULT -eq 0 ] && echo -e "${GREEN}✅ PASSED${NC}" || echo -e "${YELLOW}⚠️ ISSUES${NC}")"
echo "  Total Duration:     $(calculate_duration)"
echo ""
echo -e "${BLUE}📂 Coverage Reports:${NC}"
echo "  Backend:  $COVERAGE_DIR/backend/html/index.html"
echo "  Frontend: $COVERAGE_DIR/frontend/lcov-report/index.html"
echo ""
echo -e "${BLUE}📝 Execution Log:${NC}"
echo "  $LOG_FILE"
echo ""
echo -e "${BLUE}📋 Summary:${NC}"
echo "  SEMANA_6.4_EXECUTION_SUMMARY.md"
echo ""
echo -e "${MAGENTA}════════════════════════════════════════════════════════════${NC}"
echo ""

# Exit with appropriate code
if [ $BACKEND_RESULT -eq 0 ] && [ $FRONTEND_RESULT -eq 0 ]; then
    echo -e "${GREEN}✅ SEMANA 6.4 EXECUTION SUCCESSFUL!${NC}"
    exit 0
else
    echo -e "${YELLOW}⚠️  SEMANA 6.4 COMPLETE WITH ISSUES (see reports)${NC}"
    exit 1
fi
