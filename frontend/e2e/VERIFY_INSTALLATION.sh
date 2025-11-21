#!/bin/bash

# Yukyu E2E Tests - Installation Verification Script
# This script verifies that all test files are properly installed

echo "=================================================="
echo "🔍 Verifying Yukyu E2E Tests Installation"
echo "=================================================="
echo ""

ERRORS=0
WARNINGS=0

# Check if we're in the right directory
if [ ! -f "../package.json" ]; then
    echo "❌ Error: Not in e2e directory"
    echo "Please run from: frontend/e2e/"
    exit 1
fi

echo "📁 Checking test files..."
echo ""

# Array of required files
declare -a test_files=(
    "01-login-dashboard.spec.ts"
    "02-yukyu-main.spec.ts"
    "03-yukyu-requests.spec.ts"
    "04-yukyu-request-create.spec.ts"
    "05-yukyu-reports.spec.ts"
    "06-admin-yukyu.spec.ts"
    "07-payroll-yukyu.spec.ts"
    "08-yukyu-history.spec.ts"
    "yukyu-all.spec.ts"
    "helpers/auth.ts"
    "helpers/common.ts"
)

# Check each test file
for file in "${test_files[@]}"; do
    if [ -f "$file" ]; then
        echo "✅ $file"
    else
        echo "❌ Missing: $file"
        ((ERRORS++))
    fi
done

echo ""
echo "📚 Checking documentation files..."
echo ""

declare -a doc_files=(
    "README.md"
    "QUICK_START.md"
    "RUN_TESTS_WINDOWS.md"
)

for file in "${doc_files[@]}"; do
    if [ -f "$file" ]; then
        echo "✅ $file"
    else
        echo "⚠️  Missing: $file"
        ((WARNINGS++))
    fi
done

echo ""
echo "🔧 Checking configuration..."
echo ""

# Check Playwright config
if [ -f "../playwright.config.ts" ]; then
    echo "✅ playwright.config.ts"
else
    echo "❌ Missing: playwright.config.ts"
    ((ERRORS++))
fi

# Check screenshots directory
if [ -d "../screenshots" ]; then
    echo "✅ screenshots directory"
else
    echo "⚠️  Creating screenshots directory..."
    mkdir -p "../screenshots"
    echo "✅ screenshots directory created"
fi

echo ""
echo "📦 Checking dependencies..."
echo ""

# Check if Playwright is in package.json
if grep -q "@playwright/test" "../package.json"; then
    echo "✅ @playwright/test in package.json"
else
    echo "❌ @playwright/test not found in package.json"
    ((ERRORS++))
fi

# Check if test scripts are in package.json
if grep -q "test:e2e:yukyu" "../package.json"; then
    echo "✅ test:e2e:yukyu script exists"
else
    echo "⚠️  test:e2e:yukyu script not found"
    ((WARNINGS++))
fi

echo ""
echo "🧮 Counting test cases..."
echo ""

# Count test files
TEST_FILES=$(find . -name "*.spec.ts" | wc -l)
echo "Test files: $TEST_FILES"

# Count test cases (approximate)
TEST_CASES=$(grep -r "test(" . --include="*.spec.ts" | wc -l)
echo "Approximate test cases: $TEST_CASES"

# Count helper functions
HELPERS=$(grep -r "export.*function" helpers/ --include="*.ts" | wc -l)
echo "Helper functions: $HELPERS"

echo ""
echo "=================================================="
echo "📊 VERIFICATION RESULTS"
echo "=================================================="
echo ""

if [ $ERRORS -eq 0 ] && [ $WARNINGS -eq 0 ]; then
    echo "🎉 SUCCESS! All files are properly installed."
    echo ""
    echo "You can now run tests with:"
    echo "  cd .."
    echo "  npm run test:e2e:yukyu"
    echo ""
    EXIT_CODE=0
elif [ $ERRORS -eq 0 ]; then
    echo "✅ Installation complete with $WARNINGS warnings"
    echo ""
    echo "You can run tests, but some optional files are missing."
    echo ""
    EXIT_CODE=0
else
    echo "❌ Installation incomplete: $ERRORS errors, $WARNINGS warnings"
    echo ""
    echo "Please check the missing files above."
    echo ""
    EXIT_CODE=1
fi

echo "=================================================="
echo ""
echo "📁 File Structure:"
echo ""
echo "e2e/"
echo "├── helpers/"
echo "│   ├── auth.ts"
echo "│   └── common.ts"
echo "├── 01-login-dashboard.spec.ts"
echo "├── 02-yukyu-main.spec.ts"
echo "├── 03-yukyu-requests.spec.ts"
echo "├── 04-yukyu-request-create.spec.ts"
echo "├── 05-yukyu-reports.spec.ts"
echo "├── 06-admin-yukyu.spec.ts"
echo "├── 07-payroll-yukyu.spec.ts"
echo "├── 08-yukyu-history.spec.ts"
echo "├── yukyu-all.spec.ts"
echo "├── README.md"
echo "├── QUICK_START.md"
echo "└── RUN_TESTS_WINDOWS.md"
echo ""

exit $EXIT_CODE
