#!/bin/bash

################################################################################
# SEMANA 6.4: Backend Test Execution Script
# Runs pytest with coverage on entire backend test suite
# Usage: ./run_semana_6_4_backend_tests.sh [options]
################################################################################

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
BACKEND_PATH="backend"
TESTS_PATH="backend/tests"
COVERAGE_DIR="coverage/backend"
TIMEOUT=600  # 10 minutes per test

echo -e "${BLUE}🧪 SEMANA 6.4: Backend Test Execution${NC}"
echo "=========================================="
echo ""

# Create coverage directory
mkdir -p "$COVERAGE_DIR"

echo -e "${YELLOW}📋 Test Inventory${NC}"
echo "Discovering test files..."
TEST_COUNT=$(find "$TESTS_PATH" -name "test_*.py" -type f | wc -l)
echo "Found: $TEST_COUNT test files"
echo ""

# Phase 1: Quick validation on core tests
echo -e "${YELLOW}⚡ Phase 1: Quick Validation (5 min)${NC}"
echo "Running smoke tests on core modules..."

docker exec uns-claudejp-backend pytest \
  "$TESTS_PATH/test_auth.py" \
  "$TESTS_PATH/test_health.py" \
  "$TESTS_PATH/test_payroll_api.py" \
  -v \
  --tb=short \
  --timeout="$TIMEOUT" || {
    echo -e "${RED}❌ Smoke tests failed!${NC}"
    exit 1
}

echo -e "${GREEN}✅ Smoke tests passed${NC}"
echo ""

# Phase 2: Full test suite with coverage
echo -e "${YELLOW}📊 Phase 2: Full Test Suite (10-15 min)${NC}"
echo "Running all $TEST_COUNT test files with coverage..."
echo ""

docker exec uns-claudejp-backend pytest \
  "$TESTS_PATH/" \
  -v \
  --tb=short \
  --timeout="$TIMEOUT" \
  --cov=app \
  --cov-report=html:"$COVERAGE_DIR/html" \
  --cov-report=json:"$COVERAGE_DIR/coverage.json" \
  --cov-report=term-missing:skip-covered \
  --color=yes

# Capture test results
TEST_RESULT=$?

echo ""
echo -e "${BLUE}📈 Coverage Summary${NC}"
echo "===================="

if [ -f "$COVERAGE_DIR/coverage.json" ]; then
  # Extract coverage percentage using Python
  docker exec uns-claudejp-backend python3 << 'PYTHON_EOF'
import json
import sys

try:
    with open('coverage/backend/coverage.json') as f:
        data = json.load(f)
        total = data['totals']
        coverage_pct = total['percent_covered']

        print(f"\n📊 Backend Coverage Metrics:")
        print(f"   Overall Coverage: {coverage_pct:.2f}%")
        print(f"   Lines Covered: {total['covered_lines']}/{total['num_statements']}")
        print(f"   Branches Covered: {total['covered_branches']}/{total['num_branches']}")
        print(f"   Functions: {total['covered_functions']}/{total['num_functions']}")

        # Check if target met
        if coverage_pct >= 70:
            print(f"\n✅ Coverage target (70%) {'ACHIEVED' if coverage_pct >= 70 else 'NOT MET'}")
        else:
            print(f"\n⚠️  Coverage target (70%) NOT MET - Current: {coverage_pct:.2f}%")
except Exception as e:
    print(f"Error reading coverage: {e}")
    sys.exit(1)
PYTHON_EOF
fi

echo ""
echo "📂 Coverage reports available at:"
echo "   HTML: $COVERAGE_DIR/html/index.html"
echo "   JSON: $COVERAGE_DIR/coverage.json"
echo ""

# Phase 3: Test-specific summaries
echo -e "${YELLOW}🔍 Phase 3: Test-Specific Results${NC}"

# PayrollService integration tests
echo ""
echo "💰 PayrollService Integration Tests:"
docker exec uns-claudejp-backend pytest \
  "$TESTS_PATH/test_payroll_integration.py" \
  -v \
  --tb=line || true

# API tests
echo ""
echo "🔌 API Endpoint Tests:"
docker exec uns-claudejp-backend pytest \
  -k "api" \
  "$TESTS_PATH/" \
  --tb=line \
  -q || true

echo ""
echo "=========================================="
if [ $TEST_RESULT -eq 0 ]; then
    echo -e "${GREEN}✅ All tests completed successfully!${NC}"
else
    echo -e "${RED}⚠️  Some tests had issues (see above)${NC}"
fi
echo ""

exit $TEST_RESULT
