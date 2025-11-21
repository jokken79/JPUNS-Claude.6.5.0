#!/bin/bash

# Yukyu E2E Tests - Example Run Script
# This script demonstrates how to run the Playwright tests

echo "=================================================="
echo "🧪 Yukyu E2E Tests - Playwright"
echo "=================================================="
echo ""

# Check if we're in the frontend directory
if [ ! -f "package.json" ]; then
    echo "❌ Error: Not in frontend directory"
    echo "Please run: cd frontend"
    exit 1
fi

# Check if node_modules exists
if [ ! -d "node_modules" ]; then
    echo "📦 Installing dependencies..."
    npm install
fi

# Check if Playwright is installed
if [ ! -d "node_modules/@playwright/test" ]; then
    echo "🎭 Installing Playwright..."
    npm install -D @playwright/test
fi

# Install browsers if needed
echo "🌐 Checking Playwright browsers..."
npx playwright install chromium --with-deps

echo ""
echo "=================================================="
echo "🚀 Running Yukyu E2E Tests"
echo "=================================================="
echo ""

# Option 1: Run all yukyu tests
echo "Option 1: All Yukyu Tests"
echo "Command: npm run test:e2e:yukyu"
echo ""

# Option 2: Run with UI
echo "Option 2: Playwright UI (Recommended)"
echo "Command: npm run test:e2e:ui"
echo ""

# Option 3: Run in headed mode
echo "Option 3: Headed Mode (See Browser)"
echo "Command: npm run test:e2e:headed"
echo ""

# Option 4: Run specific test
echo "Option 4: Run Specific Test"
echo "Command: npx playwright test e2e/02-yukyu-main.spec.ts"
echo ""

# Ask user which option they want
echo "=================================================="
read -p "Which option do you want to run? (1-4, or 'q' to quit): " choice

case $choice in
    1)
        echo ""
        echo "Running all yukyu tests..."
        npm run test:e2e:yukyu
        ;;
    2)
        echo ""
        echo "Opening Playwright UI..."
        npm run test:e2e:ui
        ;;
    3)
        echo ""
        echo "Running in headed mode..."
        npm run test:e2e:headed
        ;;
    4)
        echo ""
        read -p "Enter test file name (e.g., 02-yukyu-main.spec.ts): " testfile
        npx playwright test "e2e/$testfile"
        ;;
    q|Q)
        echo "Exiting..."
        exit 0
        ;;
    *)
        echo "Invalid option. Running all yukyu tests by default..."
        npm run test:e2e:yukyu
        ;;
esac

echo ""
echo "=================================================="
echo "✅ Tests Complete!"
echo "=================================================="
echo ""
echo "To view the report, run: npm run test:e2e:report"
echo "Screenshots are saved in: screenshots/"
echo ""
