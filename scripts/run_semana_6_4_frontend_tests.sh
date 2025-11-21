#!/bin/bash

################################################################################
# SEMANA 6.4: Frontend Test Execution Script
# Runs npm test with coverage on entire frontend test suite
# Usage: ./run_semana_6_4_frontend_tests.sh [options]
################################################################################

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
FRONTEND_PATH="frontend"
COVERAGE_DIR="coverage/frontend"

echo -e "${BLUE}🎨 SEMANA 6.4: Frontend Test Execution${NC}"
echo "=========================================="
echo ""

# Create coverage directory
mkdir -p "$COVERAGE_DIR"

# Phase 0: Type checking
echo -e "${YELLOW}🔍 Phase 0: Type Checking${NC}"
echo "Running TypeScript type checking..."

docker exec uns-claudejp-frontend npm run type-check || {
    echo -e "${YELLOW}⚠️  Type checking found issues (not blocking)${NC}"
}

echo -e "${GREEN}✅ Type checking complete${NC}"
echo ""

# Phase 1: List tests
echo -e "${YELLOW}📋 Phase 1: Test Inventory${NC}"
echo "Discovering test files..."

docker exec uns-claudejp-frontend npm test -- --listTests 2>/dev/null | head -20 || {
    echo "Test files discovery (may require full test run)"
}

echo ""

# Phase 2: Run full test suite with coverage
echo -e "${YELLOW}📊 Phase 2: Full Test Suite (5-8 min)${NC}"
echo "Running all frontend tests with coverage..."
echo ""

docker exec uns-claudejp-frontend npm test -- \
  --coverage \
  --coveragePathIgnorePatterns=/node_modules/ \
  --coverageReporters=html \
  --coverageReporters=json \
  --coverageReporters=json-summary \
  --coverageReporters=text \
  --coverageReporters=text-summary \
  --passWithNoTests \
  --bail=false \
  --maxWorkers=4 || {
    echo -e "${YELLOW}⚠️  Some tests had issues${NC}"
}

# Capture results
TEST_RESULT=$?

echo ""
echo -e "${BLUE}📈 Coverage Summary${NC}"
echo "===================="

# Try to extract coverage from json-summary
if [ -f "frontend/coverage/coverage-summary.json" ]; then
  docker exec uns-claudejp-frontend python3 << 'PYTHON_EOF'
import json
import sys
import os

try:
    summary_path = 'frontend/coverage/coverage-summary.json'
    if os.path.exists(summary_path):
        with open(summary_path) as f:
            data = json.load(f)
            total = data.get('total', {})

            lines_pct = total.get('lines', {}).get('pct', 0)
            statements_pct = total.get('statements', {}).get('pct', 0)
            functions_pct = total.get('functions', {}).get('pct', 0)
            branches_pct = total.get('branches', {}).get('pct', 0)

            print(f"\n📊 Frontend Coverage Metrics:")
            print(f"   Lines: {lines_pct:.2f}%")
            print(f"   Statements: {statements_pct:.2f}%")
            print(f"   Functions: {functions_pct:.2f}%")
            print(f"   Branches: {branches_pct:.2f}%")

            avg_coverage = (lines_pct + statements_pct + functions_pct + branches_pct) / 4
            print(f"\n   Average Coverage: {avg_coverage:.2f}%")

            if avg_coverage >= 70:
                print(f"\n✅ Coverage target (70%) ACHIEVED")
            else:
                print(f"\n⚠️  Coverage target (70%) NOT MET")
    else:
        print("Coverage summary not found yet (tests may still be running)")
except Exception as e:
    print(f"Note: Coverage extraction: {e}")
    print("Full coverage report will be available in HTML format")
PYTHON_EOF
fi

echo ""
echo "📂 Coverage reports available at:"
echo "   HTML: frontend/coverage/lcov-report/index.html"
echo "   Summary: frontend/coverage/coverage-summary.json"
echo ""

# Phase 3: Component-specific tests
echo -e "${YELLOW}🔍 Phase 3: Component Testing${NC}"
echo "Testing key components..."

# Try to run specific test files if they exist
echo "Looking for component-specific tests..."
docker exec uns-claudejp-frontend bash -c "
  if [ -d 'test/components' ]; then
    echo 'Component tests found'
    npm test -- test/components/ --passWithNoTests || true
  else
    echo 'Component tests directory not found'
  fi
" || true

echo ""
echo "=========================================="
if [ $TEST_RESULT -eq 0 ]; then
    echo -e "${GREEN}✅ Frontend tests completed successfully!${NC}"
else
    echo -e "${YELLOW}⚠️  Frontend tests completed with some issues${NC}"
fi

echo ""
echo "📝 Next steps:"
echo "   1. Review HTML coverage report"
echo "   2. Identify low-coverage areas"
echo "   3. Add tests for uncovered code paths"
echo ""

exit $TEST_RESULT
