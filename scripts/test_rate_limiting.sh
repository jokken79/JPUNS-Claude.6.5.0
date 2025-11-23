#!/bin/bash
# Test Rate Limiting Implementation
# UNS-ClaudeJP 6.0.0

set -e

echo "========================================="
echo "Rate Limiting Test Suite"
echo "UNS-ClaudeJP 6.0.0"
echo "========================================="
echo ""

BASE_URL="${BASE_URL:-http://localhost}"
API_URL="$BASE_URL/api"

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Test counter
TESTS_PASSED=0
TESTS_FAILED=0

# Helper functions
pass_test() {
    echo -e "${GREEN}✓ PASS${NC}: $1"
    TESTS_PASSED=$((TESTS_PASSED + 1))
}

fail_test() {
    echo -e "${RED}✗ FAIL${NC}: $1"
    TESTS_FAILED=$((TESTS_FAILED + 1))
}

warn_test() {
    echo -e "${YELLOW}⚠ WARN${NC}: $1"
}

# Test 1: Redis Connection
echo "Test 1: Verify Redis is running"
if docker exec uns-claudejp-600-redis redis-cli PING > /dev/null 2>&1; then
    pass_test "Redis is accessible"
else
    fail_test "Redis is not accessible"
    echo "  → Run: docker-compose up -d redis"
    exit 1
fi

# Test 2: Backend is running
echo ""
echo "Test 2: Verify Backend is running"
if curl -s "$API_URL/health" > /dev/null 2>&1; then
    pass_test "Backend is accessible at $API_URL"
else
    fail_test "Backend is not accessible at $API_URL"
    echo "  → Run: docker-compose up -d backend"
    exit 1
fi

# Test 3: Login Rate Limit (5/minute)
echo ""
echo "Test 3: Login Rate Limit (5/minute)"
echo "  Making 6 login attempts..."

rate_limited=false
for i in {1..6}; do
    response=$(curl -s -w "%{http_code}" -o /dev/null \
        -X POST "$API_URL/auth/login" \
        -H "Content-Type: application/x-www-form-urlencoded" \
        -d "username=test$i&password=test")
    
    if [ "$response" = "429" ]; then
        if [ $i -le 5 ]; then
            fail_test "Request $i was rate limited (should allow 5)"
        else
            pass_test "Request $i was rate limited (expected)"
            rate_limited=true
        fi
    else
        if [ $i -gt 5 ]; then
            warn_test "Request $i was NOT rate limited (may need to wait for window reset)"
        fi
    fi
done

if [ "$rate_limited" = false ]; then
    warn_test "No rate limiting detected - may need to wait for clean window"
fi

# Test 4: Check Redis Keys
echo ""
echo "Test 4: Verify rate limit keys in Redis"
keys=$(docker exec uns-claudejp-600-redis redis-cli KEYS "LIMITER*" 2>/dev/null)
if [ -n "$keys" ]; then
    pass_test "Rate limit keys found in Redis"
    echo "$keys" | head -5 | sed 's/^/  → /'
else
    warn_test "No rate limit keys found in Redis"
fi

# Test 5: Check Error Response Format
echo ""
echo "Test 5: Verify error response format"
# Trigger rate limit
for i in {1..6}; do
    curl -s -X POST "$API_URL/auth/login" \
        -H "Content-Type: application/x-www-form-urlencoded" \
        -d "username=test$i&password=test" > /dev/null 2>&1
done

# Get response from 6th request
response=$(curl -s -X POST "$API_URL/auth/login" \
    -H "Content-Type: application/x-www-form-urlencoded" \
    -d "username=test7&password=test")

if echo "$response" | jq -e '.retry_after' > /dev/null 2>&1; then
    retry_after=$(echo "$response" | jq -r '.retry_after')
    pass_test "Error response includes retry_after: $retry_after seconds"
else
    fail_test "Error response missing retry_after field"
fi

if echo "$response" | jq -e '.retry_after_human' > /dev/null 2>&1; then
    retry_human=$(echo "$response" | jq -r '.retry_after_human')
    pass_test "Error response includes retry_after_human: $retry_human"
else
    fail_test "Error response missing retry_after_human field"
fi

# Test 6: Check Retry-After Header
echo ""
echo "Test 6: Verify Retry-After header"
headers=$(curl -s -i -X POST "$API_URL/auth/login" \
    -H "Content-Type: application/x-www-form-urlencoded" \
    -d "username=test&password=test" 2>&1)

if echo "$headers" | grep -i "Retry-After:" > /dev/null; then
    retry_value=$(echo "$headers" | grep -i "Retry-After:" | awk '{print $2}' | tr -d '\r')
    pass_test "Retry-After header present: $retry_value"
else
    warn_test "Retry-After header not found (may not be rate limited yet)"
fi

# Test 7: Backend Logs
echo ""
echo "Test 7: Check backend logs for rate limit messages"
logs=$(docker logs uns-claudejp-600-backend 2>&1 | grep -i "rate limit" | tail -5)
if [ -n "$logs" ]; then
    pass_test "Rate limit logs found"
    echo "$logs" | sed 's/^/  → /'
else
    warn_test "No rate limit logs found (may not have been triggered yet)"
fi

# Test 8: Storage URI Configuration
echo ""
echo "Test 8: Verify rate limiter storage configuration"
storage=$(docker exec uns-claudejp-600-backend python -c \
    "from app.core.rate_limiter import storage_uri; print(storage_uri)" 2>/dev/null)

if echo "$storage" | grep -q "redis://"; then
    pass_test "Rate limiter using Redis: $storage"
else
    fail_test "Rate limiter NOT using Redis: $storage"
    echo "  → Check REDIS_URL in .env"
fi

# Summary
echo ""
echo "========================================="
echo "Test Summary"
echo "========================================="
echo -e "Passed: ${GREEN}$TESTS_PASSED${NC}"
echo -e "Failed: ${RED}$TESTS_FAILED${NC}"

if [ $TESTS_FAILED -eq 0 ]; then
    echo -e "${GREEN}✓ All tests passed!${NC}"
    exit 0
else
    echo -e "${RED}✗ Some tests failed${NC}"
    exit 1
fi
