#!/bin/bash
set -euo pipefail

# UNS-ClaudeJP Session Start Hook
# Installs dependencies for Backend (Python) and Frontend (Node.js)
# Enables tests, linters, and type checking to work in Claude Code on the web

echo "🚀 Installing dependencies for UNS-ClaudeJP..."

# ============================================================================
# BACKEND: Python Dependencies
# ============================================================================
echo ""
echo "📦 Installing backend dependencies (Python)..."

# Check if Python is available
if ! command -v python3 &> /dev/null; then
    echo "⚠️  Python3 not found, skipping backend setup"
else
    cd "${CLAUDE_PROJECT_DIR:-$(pwd)}/backend"

    # Install from requirements.txt
    if [ -f "requirements.txt" ]; then
        echo "   Installing from requirements.txt..."
        python3 -m pip install --upgrade pip -q
        python3 -m pip install -r requirements.txt --quiet 2>/dev/null || {
            echo "⚠️  Some backend dependencies failed to install (expected in restricted environments)"
        }
        echo "   ✅ Backend dependencies processed"
    else
        echo "   ⚠️  requirements.txt not found"
    fi

    cd - > /dev/null
fi

# ============================================================================
# FRONTEND: Node.js Dependencies
# ============================================================================
echo ""
echo "📦 Installing frontend dependencies (Node.js)..."

# Check if Node.js is available
if ! command -v node &> /dev/null; then
    echo "⚠️  Node.js not found, skipping frontend setup"
else
    cd "${CLAUDE_PROJECT_DIR:-$(pwd)}/frontend"

    # Install from package.json
    if [ -f "package.json" ]; then
        echo "   Installing from package.json..."
        npm install --quiet --legacy-peer-deps 2>/dev/null || {
            echo "⚠️  Some frontend dependencies failed to install (expected in restricted environments)"
        }
        echo "   ✅ Frontend dependencies processed"
    else
        echo "   ⚠️  package.json not found"
    fi

    cd - > /dev/null
fi

# ============================================================================
# SETUP ENVIRONMENT VARIABLES (persisted for this session)
# ============================================================================
if [ -n "${CLAUDE_ENV_FILE:-}" ]; then
    echo ""
    echo "📝 Configuring environment variables..."

    # Python path for imports
    echo 'export PYTHONPATH="${PYTHONPATH}:."' >> "$CLAUDE_ENV_FILE"

    # Node environment
    echo 'export NODE_ENV="development"' >> "$CLAUDE_ENV_FILE"

    # Project directory
    echo "export CLAUDE_PROJECT_DIR=\"${CLAUDE_PROJECT_DIR:-$(pwd)}\"" >> "$CLAUDE_ENV_FILE"

    echo "   ✅ Environment configured"
fi

# ============================================================================
# SUMMARY
# ============================================================================
echo ""
echo "✅ Session startup complete!"
echo ""
echo "Available commands:"
echo "   Backend:"
echo "   • pytest backend/tests/ -v          # Run tests"
echo "   • python -m flake8 backend/app/     # Lint code"
echo ""
echo "   Frontend:"
echo "   • npm run typecheck                 # Type checking"
echo "   • npm run lint                      # ESLint check"
echo "   • npm test                          # Unit tests"
echo "   • npm run test:e2e                  # E2E tests"
echo ""
echo "🔗 Documentation:"
echo "   • .claude/INFRASTRUCTURE_MAP.md     # System architecture"
echo "   • .claude/DEBUG_QUICK_REFERENCE.md  # Error debugging"
echo "   • .claude/CRITICAL_FLOWS.md         # Business logic flows"
echo ""
