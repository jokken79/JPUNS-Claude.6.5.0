#!/bin/bash
# Setup and Test Yukyu System
# ============================
#
# This script:
# 1. Applies database migrations
# 2. Imports historical yukyu data from CSV
# 3. Runs comprehensive end-to-end tests
#
# Usage:
#   bash scripts/setup_and_test_yukyu.sh
#
# Author: UNS-ClaudeJP System

set -e  # Exit on error

echo "================================================================================"
echo "🚀 YUKYU SYSTEM SETUP AND TESTING"
echo "================================================================================"

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Step 1: Apply migrations
echo ""
echo "================================================================================"
echo "📦 STEP 1: Applying Database Migrations"
echo "================================================================================"
echo ""

cd /app
alembic upgrade head

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ Migrations applied successfully${NC}"
else
    echo -e "${RED}❌ Migration failed${NC}"
    exit 1
fi

# Step 2: Import data
echo ""
echo "================================================================================"
echo "📥 STEP 2: Importing Historical Yukyu Data"
echo "================================================================================"
echo ""

python scripts/import_yukyu_data.py

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ Data imported successfully${NC}"
else
    echo -e "${YELLOW}⚠️  Data import had issues (this is OK if employees don't exist yet)${NC}"
fi

# Step 3: Run tests
echo ""
echo "================================================================================"
echo "🧪 STEP 3: Running End-to-End Tests"
echo "================================================================================"
echo ""

python scripts/test_yukyu_system.py

if [ $? -eq 0 ]; then
    echo ""
    echo "================================================================================"
    echo -e "${GREEN}✅ ALL TESTS PASSED!${NC}"
    echo "================================================================================"
    exit 0
else
    echo ""
    echo "================================================================================"
    echo -e "${RED}❌ SOME TESTS FAILED${NC}"
    echo "================================================================================"
    exit 1
fi
