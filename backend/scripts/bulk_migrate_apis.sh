#!/bin/bash
#
# FASE 4 #4: Bulk API Migration Script
# Migrates remaining API files to standardized response format
#

set -e

API_DIR="backend/app/api"
IMPORT_LINE='from app.core.response import (
    success_response, paginated_response,
    created_response, no_content_response
)'

echo "🚀 FASE 4 #4: Bulk API Migration"
echo "=================================="
echo ""

# Function to add imports to a file
add_imports() {
    local file=$1
    if ! grep -q "from app.core.response import" "$file"; then
        # Find the last "from app." import line
        local last_import_line=$(grep -n "^from app\." "$file" | tail -1 | cut -d: -f1)
        if [ -z "$last_import_line" ]; then
            # Find the last "from fastapi" import line
            last_import_line=$(grep -n "^from fastapi" "$file" | tail -1 | cut -d: -f1)
        fi

        if [ ! -z "$last_import_line" ]; then
            # Insert the import after the last import line
            sed -i "${last_import_line}a\\${IMPORT_LINE}" "$file"
            echo "✅ Added imports to $(basename $file)"
        fi
    fi
}

# Process critical files one by one with manual review
CRITICAL_FILES=("employees.py" "dashboard.py" "candidates.py" "payroll.py" "factories.py")

for file in "${CRITICAL_FILES[@]}"; do
    if [ -f "$API_DIR/$file" ]; then
        echo "📄 Processing $file..."
        add_imports "$API_DIR/$file"
    fi
done

echo ""
echo "✅ Bulk imports added"
echo ""
echo "⚠️  Manual migration still required for:"
echo "   - response_model removal from decorators"
echo "   - Adding request: Request parameter"
echo "   - Wrapping returns with success_response() etc."
echo ""
echo "Next: Review each file and complete migrations"
