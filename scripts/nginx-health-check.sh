#!/bin/bash
# Nginx Health Check and Auto-Reload Script
# Monitors nginx-backend connectivity and reloads on DNS cache issues

set -e

CONTAINER_NAME="${1:-uns-claudejp-600-nginx}"
BACKEND_HEALTH_URL="http://backend:8000/api/health"
MAX_RETRIES=3
RETRY_DELAY=2

echo "=== Nginx Health Check ==="
echo "Container: $CONTAINER_NAME"
echo "Checking backend connectivity..."

# Function to check backend from nginx container
check_backend() {
    docker exec "$CONTAINER_NAME" wget -q -O- "$BACKEND_HEALTH_URL" 2>&1
}

# Function to reload nginx
reload_nginx() {
    echo "Reloading nginx to refresh DNS cache..."
    docker exec "$CONTAINER_NAME" nginx -s reload
    sleep 2
}

# Main health check logic
retries=0
while [ $retries -lt $MAX_RETRIES ]; do
    if check_backend > /dev/null 2>&1; then
        echo "✓ Backend is reachable from nginx"

        # Check from host via nginx proxy
        if curl -s -f http://localhost/api/health > /dev/null 2>&1; then
            echo "✓ Nginx proxy is working correctly"
            exit 0
        else
            echo "✗ Nginx proxy failed, reloading..."
            reload_nginx
        fi
    else
        echo "✗ Backend unreachable from nginx (attempt $((retries + 1))/$MAX_RETRIES)"
        reload_nginx
    fi

    retries=$((retries + 1))
    if [ $retries -lt $MAX_RETRIES ]; then
        sleep $RETRY_DELAY
    fi
done

echo "✗ Health check failed after $MAX_RETRIES attempts"
exit 1
