# Nginx 502 Bad Gateway Fix - DNS Cache Issue

## Problem Summary

Nginx was returning `502 Bad Gateway` errors when proxying requests to the backend service. The issue occurred after the backend container was restarted and received a new IP address.

## Root Cause

**DNS Caching in Nginx**: When using upstream blocks with static server definitions, nginx resolves the hostname once at startup and caches the IP address. When Docker containers restart and get new IP addresses, nginx continues trying to connect to the old IP, resulting in connection refused errors.

### Evidence
```
Error logs showed:
connect() failed (111: Connection refused) while connecting to upstream
upstream: "http://172.18.0.8:8000/api/health"

But nslookup showed backend was at:
Name:   backend
Address: 172.18.0.7
```

## Immediate Fix

Reload nginx to refresh the DNS cache:
```bash
docker exec uns-claudejp-600-nginx nginx -s reload
```

## Permanent Solution

Updated nginx configuration to prevent future DNS caching issues:

### 1. Added DNS Resolver
```nginx
# DNS resolver for dynamic service discovery
resolver 127.0.0.11 valid=10s ipv6=off;
resolver_timeout 5s;
```

The `127.0.0.11` is Docker's internal DNS resolver. The `valid=10s` parameter ensures DNS lookups are refreshed every 10 seconds.

### 2. Enhanced Upstream Configuration
```nginx
upstream backend {
    server backend:8000 max_fails=3 fail_timeout=30s;
    keepalive 32;
}
```

**Benefits:**
- `max_fails=3`: Mark backend as down after 3 failed attempts
- `fail_timeout=30s`: Retry after 30 seconds
- `keepalive 32`: Maintain 32 persistent connections (reduces overhead)

### 3. Improved Proxy Settings
```nginx
proxy_http_version 1.1;
proxy_set_header Connection "";
proxy_connect_timeout 10s;
proxy_send_timeout 30s;
proxy_read_timeout 30s;
proxy_buffering on;
proxy_buffer_size 4k;
proxy_buffers 8 4k;
proxy_busy_buffers_size 8k;
```

**Benefits:**
- HTTP/1.1 with keepalive for better performance
- Explicit timeouts prevent hanging connections
- Buffering configuration optimizes memory usage

## Verification

After applying the fix, all tests passed:
```bash
# Test 10 consecutive requests
for i in 1 2 3 4 5 6 7 8 9 10; do
    curl -s http://localhost/api/health | grep "status"
done

# All returned: "status":"healthy"
```

## Automated Health Check

Created `scripts/nginx-health-check.sh` for automated monitoring:

```bash
# Check nginx health and auto-reload if needed
bash scripts/nginx-health-check.sh
```

Windows version: `scripts/NGINX_HEALTH_CHECK.bat`

## Prevention

To prevent this issue in the future:

1. **Use the DNS resolver** - Always configure `resolver 127.0.0.11` in nginx
2. **Add health checks** - Monitor backend connectivity regularly
3. **Configure failover** - Use `max_fails` and `fail_timeout` parameters
4. **Enable keepalive** - Reduce connection overhead and improve performance

## Technical Details

### Why Docker's DNS Changes
Docker assigns IP addresses from a pool when containers start. When a container restarts:
1. It releases its old IP back to the pool
2. It receives a new IP (often different) on startup
3. Docker DNS (`127.0.0.11`) updates immediately
4. But nginx's cached upstream IP does not update automatically

### How the Fix Works
1. **resolver 127.0.0.11**: Tells nginx to use Docker's DNS
2. **valid=10s**: Forces DNS re-resolution every 10 seconds
3. **keepalive**: Maintains connections but doesn't cache DNS
4. **Health parameters**: Detect and recover from failures automatically

## Files Modified

1. `docker/conf.d/default.conf` - Nginx configuration
2. `scripts/nginx-health-check.sh` - Health check script (Linux/macOS)
3. `scripts/NGINX_HEALTH_CHECK.bat` - Health check script (Windows)

## Related Issues

This fix also improves:
- Backend horizontal scaling (load balancing multiple backend instances)
- Connection stability during high load
- Recovery time from backend restarts
- Overall proxy performance

## Testing Checklist

After applying this fix:
- [x] Backend health endpoint accessible via nginx
- [x] Multiple consecutive requests succeed
- [x] No connection refused errors in nginx logs
- [x] Nginx configuration syntax valid
- [x] Health check script works correctly

## References

- Nginx Documentation: http://nginx.org/en/docs/http/ngx_http_upstream_module.html
- Docker DNS: https://docs.docker.com/config/containers/container-networking/#dns-services
- Nginx Keepalive: http://nginx.org/en/docs/http/ngx_http_upstream_module.html#keepalive
