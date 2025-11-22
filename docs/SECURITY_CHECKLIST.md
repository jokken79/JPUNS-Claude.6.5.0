# Production Security Checklist

**Version:** 1.0  
**Last Updated:** November 22, 2025  
**Maintainer:** @security-specialist

---

## Overview

This checklist MUST be completed before deploying UNS-ClaudeJP to production. Each item addresses specific security vulnerabilities and compliance requirements.

**Status Legend:**
- ✅ **COMPLETE** - Item fully implemented and tested
- ⏳ **IN PROGRESS** - Item partially complete
- ❌ **NOT STARTED** - Item not yet implemented
- 🔄 **NEEDS VERIFICATION** - Implemented but requires testing

---

## 1. Secrets Management

### 1.1 Environment Variables

- [ ] **ADMIN_PASSWORD** set with strong password (min 12 characters)
  - Must include: uppercase, lowercase, numbers, special characters
  - Must NOT be "admin123" or any common password
  - Store in secure vault (AWS Secrets Manager, Azure Key Vault, HashiCorp Vault)
  - **Command:** `export ADMIN_PASSWORD='your-secure-password-here'`

- [ ] **SECRET_KEY** generated with cryptographically secure randomness
  - Min 64 characters (hex-encoded)
  - Never use example values from .env.example
  - **Command:** `python -c "import secrets; print(secrets.token_hex(32))"`

- [ ] **DATABASE_PASSWORD** rotated from default
  - Min 16 characters
  - Never use "change-me-in-local" or similar placeholders
  - **Command:** `ALTER USER uns_admin WITH PASSWORD 'new-secure-password';`

- [ ] **REDIS_PASSWORD** set for cache authentication
  - Min 16 characters
  - Configure in redis.conf: `requirepass your-redis-password`

- [ ] All `.env` files excluded from version control
  - Verify: `git check-ignore .env` returns `.env`
  - Never commit `.env`, `.env.production`, or `.env.local`

### 1.2 Secrets Rotation

- [ ] **Admin password** rotated after initial deployment
- [ ] **JWT SECRET_KEY** unique per environment (dev/staging/prod)
- [ ] **Database credentials** rotated quarterly
- [ ] **API keys** (OpenAI, Gemini, etc.) rotated per vendor policy

---

## 2. Authentication & Authorization

### 2.1 JWT Configuration

- [ ] **ACCESS_TOKEN_EXPIRE_MINUTES** set to 30 (or less)
  - Current: 30 minutes ✅
  - Never exceed 60 minutes in production
  - **File:** `backend/app/core/config.py:30`

- [ ] **REFRESH_TOKEN_EXPIRE_DAYS** reasonable (7 days)
  - Current: 7 days ✅
  - Max recommended: 30 days
  - **File:** `backend/app/core/config.py:31`

- [ ] **Cookie settings** secure in production:
  - `COOKIE_SECURE=true` (HTTPS only)
  - `COOKIE_HTTPONLY=true` (prevents XSS)
  - `COOKIE_SAMESITE=strict` (prevents CSRF)
  - **File:** `backend/app/core/config.py:36-38`

### 2.2 Password Policy

- [ ] **Minimum password length:** 8 characters (12+ recommended for admin)
- [ ] **Password complexity:** Enforced (uppercase, lowercase, numbers, symbols)
- [ ] **Common password check:** Blocked (e.g., "password123", "admin123")
- [ ] **Password hashing:** bcrypt with 12+ rounds (already configured ✅)

### 2.3 Rate Limiting

- [ ] **Redis** configured for distributed rate limiting
  - **Connection:** `REDIS_URL=redis://redis:6379/0` in .env
  - **Test:** `redis-cli -h redis ping` should return `PONG`

- [ ] **Rate limiting** active on all endpoints
  - **Verification:** 217/217 endpoints protected ✅
  - **Test:** Send 10 requests to `/api/auth/login` in 1 minute → expect HTTP 429

- [ ] **Rate limit monitoring** configured
  - Monitor `rate_limit_exceeded_total` metric
  - Alert on excessive 429 responses (possible attack)

---

## 3. Database Security

### 3.1 SSL/TLS Configuration

- [ ] **DATABASE_URL** includes SSL mode
  - Development: `?sslmode=prefer`
  - Production: `?sslmode=require` (minimum)
  - Recommended: `?sslmode=verify-full&sslrootcert=/path/to/ca.pem`
  - **File:** `.env`

- [ ] **PostgreSQL server** SSL enabled
  - **Config:** `ssl = on` in postgresql.conf
  - **Test:** `SHOW ssl;` in psql should return `on`

- [ ] **SSL certificates** valid and trusted
  - Check expiration: `openssl x509 -in /path/to/cert.pem -noout -dates`
  - Renew certificates 30 days before expiration

### 3.2 Database Access Control

- [ ] **Database user** has minimal privileges (not superuser)
  - **Test:** `SELECT usesuper FROM pg_user WHERE usename = 'uns_admin';` → `f`

- [ ] **Public schema** restricted from untrusted users

- [ ] **Database firewall rules** allow only application servers
  - Block public internet access (0.0.0.0/0)
  - Whitelist application server IPs only

---

## 4. Network Security

### 4.1 HTTPS/TLS

- [ ] **HTTPS enforced** in production (no HTTP)
  - **Header:** `Strict-Transport-Security: max-age=63072000; includeSubDomains; preload` ✅
  - **Test:** `curl -I https://your-domain.com | grep Strict-Transport`

- [ ] **TLS version** 1.2 minimum (1.3 recommended)
  - Disable SSLv3, TLS 1.0, TLS 1.1 (vulnerable)
  - **Nginx:** `ssl_protocols TLSv1.2 TLSv1.3;`

- [ ] **SSL certificate** valid and trusted
  - No self-signed certificates in production
  - Use Let's Encrypt, DigiCert, or equivalent CA
  - **Test:** `curl https://your-domain.com` (no certificate warnings)

### 4.2 Security Headers

- [ ] **Content-Security-Policy** header present ✅
  - **Test:** `curl -I https://your-domain.com | grep Content-Security-Policy`
  - Verify: `default-src 'self'; frame-ancestors 'none'`

- [ ] **X-Frame-Options: DENY** prevents clickjacking ✅
- [ ] **X-Content-Type-Options: nosniff** prevents MIME sniffing ✅
- [ ] **Referrer-Policy** restricts referrer leakage ✅

**Full Test:**
```bash
curl -I https://your-domain.com | grep -E "(Content-Security|X-Frame|X-Content|Referrer|Strict-Transport)"
```

### 4.3 CORS Configuration

- [ ] **CORS origins** restricted to known domains
  - Never use `*` (allow all origins) in production
  - **File:** `.env` → `BACKEND_CORS_ORIGINS=https://your-frontend.com`

- [ ] **Credentials** allowed only for trusted origins
  - **Test:** `curl -H "Origin: https://evil.com" https://your-api.com/api/auth/login`
  - Should NOT return `Access-Control-Allow-Origin: https://evil.com`

---

## 5. Dependency Management

### 5.1 Backend Dependencies

- [ ] **cryptography** version 43.0.0 or higher ✅
  - **Check:** `pip show cryptography | grep Version`
  - **Expected:** `Version: 43.x.x`

- [ ] **All dependencies** up to date
  - **Check:** `pip list --outdated`
  - No known CVEs in dependencies
  - **Tool:** `pip-audit` or `safety check`

- [ ] **Requirements pinned** with exact versions
  - **File:** `requirements.txt` uses `==` (not `>=`)
  - Example: `fastapi==0.115.5` (exact version)

### 5.2 Frontend Dependencies

- [ ] **npm audit** shows no high/critical vulnerabilities
  - **Check:** `npm audit`
  - **Expected:** 0 high, 0 critical (moderate dev-only acceptable)

- [ ] **Dependencies updated** quarterly
  - **Command:** `npm update` (test in staging first)

- [ ] **Lock file committed** for reproducible builds
  - **File:** `package-lock.json` in version control

---

## 6. Logging & Monitoring

### 6.1 Security Logging

- [ ] **Authentication events** logged
  - Login success/failure
  - Password changes
  - Account lockouts
  - Token refresh
  - **File:** `backend/app/services/auth_service.py`

- [ ] **Rate limit violations** logged and monitored
  - **Metric:** `rate_limit_exceeded_total` (Prometheus)
  - Alert on >100 violations/hour

- [ ] **Security headers** logged for suspicious requests
  - User-Agent, X-Forwarded-For, Referer
  - **File:** `backend/app/core/middleware.py`

### 6.2 Audit Trail

- [ ] **Audit log** captures critical operations
  - Admin actions (user creation, role changes)
  - Data modifications (employee records, salary calculations)
  - Configuration changes (system settings, page visibility)
  - **Table:** `audit_logs` in database

- [ ] **Audit retention** configured (90 days minimum)
  - **Compliance:** SOC 2 requires 1 year retention

### 6.3 Monitoring & Alerting

- [ ] **Failed login monitoring**
  - Alert on >10 failures/minute from single IP
  - Alert on >50 failures/hour globally

- [ ] **Database connection monitoring**
  - Alert on SSL/TLS handshake failures
  - Alert on connection errors (credentials invalid)

- [ ] **API error rate monitoring**
  - Alert on >5% error rate (5xx responses)
  - Alert on sudden spike in 429 (rate limit exceeded)

---

## 7. Deployment Security

### 7.1 Environment Configuration

- [ ] **ENVIRONMENT=production** set in production
  - **File:** `.env` → `ENVIRONMENT=production`
  - Enables SSL enforcement, security checks
  - **Test:** `echo $ENVIRONMENT` should return `production`

- [ ] **DEBUG=false** in production
  - **File:** `.env` → `DEBUG=false`
  - Prevents debug information leakage
  - **Test:** Error responses should NOT show stack traces

### 7.2 Docker Security

- [ ] **Non-root user** running application containers
  - **Dockerfile:** `USER appuser` (not `root`)
  - **Test:** `docker exec <container> whoami` → should NOT be `root`

- [ ] **Minimal base images** (Alpine Linux, distroless)
  - Reduces attack surface
  - **Dockerfile:** `FROM python:3.11-alpine`

- [ ] **Image scanning** for vulnerabilities
  - **Tool:** Trivy, Snyk, or Docker Scout
  - **Command:** `trivy image your-image:latest`

### 7.3 Kubernetes Security (if applicable)

- [ ] **Network policies** restrict pod-to-pod communication
- [ ] **Resource limits** prevent DoS (CPU/memory quotas)
- [ ] **Secrets** managed with Kubernetes Secrets or external vault
- [ ] **RBAC** configured (least privilege for service accounts)

---

## 8. Incident Response

### 8.1 Security Incident Plan

- [ ] **Incident response plan** documented
  - Contact list (security team, management)
  - Escalation procedures
  - Communication templates

- [ ] **Backup & recovery** tested
  - Database backups daily (encrypted at rest)
  - Recovery tested quarterly
  - RTO: 4 hours, RPO: 24 hours

### 8.2 Vulnerability Disclosure

- [ ] **Security contact** published
  - Email: security@your-domain.com
  - **File:** `SECURITY.md` in repository

- [ ] **Vulnerability response SLA**
  - Critical: 24 hours
  - High: 7 days
  - Medium: 30 days

---

## 9. Compliance Requirements

### 9.1 GDPR (if applicable)

- [ ] **Data encryption** at rest and in transit ✅
- [ ] **Right to erasure** implemented (data deletion)
- [ ] **Data minimization** practiced (only collect necessary data)
- [ ] **Privacy policy** published and accessible

### 9.2 ISO 27001 (if applicable)

- [ ] **Access control policy** documented and enforced
- [ ] **Change management** process for security updates
- [ ] **Security awareness training** for developers/operators
- [ ] **Regular security audits** scheduled (quarterly)

### 9.3 SOC 2 (if applicable)

- [ ] **Audit logging** comprehensive and tamper-proof
- [ ] **Change control** documented (git commits, deployment logs)
- [ ] **Monitoring** for availability and security
- [ ] **Vendor management** for third-party services

---

## 10. Testing & Verification

### 10.1 Security Testing

- [ ] **Penetration testing** performed (annually)
  - OWASP Top 10 coverage
  - Authentication bypass attempts
  - SQL injection tests
  - XSS tests

- [ ] **Automated security scanning**
  - **SAST:** SonarQube, Semgrep (static analysis)
  - **DAST:** OWASP ZAP, Burp Suite (dynamic analysis)
  - **SCA:** Snyk, npm audit (dependency scanning)

### 10.2 Pre-Deployment Tests

- [ ] **Login test** with new admin credentials
  - Username: admin
  - Password: (from ADMIN_PASSWORD env var)
  - **Expected:** Successful login with 30-minute token

- [ ] **Rate limiting test**
  - Send 10 login requests in 1 minute
  - **Expected:** 6th request returns HTTP 429

- [ ] **Database SSL test**
  - Check connection logs for SSL/TLS
  - **Command:** `SELECT ssl_is_used();` in psql
  - **Expected:** `t` (true)

- [ ] **Security headers test**
  - **Command:** `curl -I https://your-domain.com`
  - **Expected:** All 10 security headers present

- [ ] **Token expiration test**
  - Login, decode JWT, check `exp` claim
  - **Expected:** Expires in 30 minutes (1800 seconds)

---

## 11. Post-Deployment Verification

### 11.1 First 24 Hours

- [ ] **Monitor failed login attempts**
  - **Metric:** `auth_login_failed_total`
  - **Action:** Investigate if >50/hour

- [ ] **Monitor rate limit violations**
  - **Metric:** `rate_limit_exceeded_total`
  - **Action:** Investigate if >100/hour

- [ ] **Monitor database SSL connections**
  - **Log:** PostgreSQL logs
  - **Action:** Verify all connections use SSL

- [ ] **Monitor error rates**
  - **Metric:** `http_requests_total{status=~"5.."}`
  - **Action:** Investigate if >1%

### 11.2 First Week

- [ ] **Review security logs** for anomalies
- [ ] **Test token refresh flow** (after 30 minutes)
- [ ] **Verify CSP** (no browser console violations)
- [ ] **Performance test** (rate limiting shouldn't degrade normal usage)

### 11.3 First Month

- [ ] **Security audit** by external party (recommended)
- [ ] **Penetration testing** (if budget allows)
- [ ] **User feedback** on session timeout (30 min)
- [ ] **Update documentation** based on production learnings

---

## Quick Reference Commands

### Check Security Configuration

```bash
# Check environment
echo $ENVIRONMENT  # Should be: production

# Check database SSL
psql $DATABASE_URL -c "SELECT ssl_is_used();"  # Should be: t

# Check rate limiting
curl -I http://localhost:8000/api/health | grep X-RateLimit

# Check security headers
curl -I https://your-domain.com | grep -E "(Content-Security|X-Frame|Strict-Transport)"

# Check cryptography version
pip show cryptography | grep Version  # Should be: 43.x.x

# Check npm vulnerabilities
npm audit  # Should be: 0 high, 0 critical

# Check Redis connection
redis-cli -h redis ping  # Should be: PONG
```

### Emergency Procedures

```bash
# Rotate admin password immediately
export NEW_PASSWORD='new-secure-password-here'
psql $DATABASE_URL -c "UPDATE users SET password_hash = crypt('$NEW_PASSWORD', gen_salt('bf')) WHERE username = 'admin';"

# Disable API temporarily (503 maintenance mode)
curl -X POST https://your-domain.com/api/admin/maintenance-mode \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -d '{"enabled": true, "message": "Emergency maintenance"}'

# Block suspicious IP address (add to rate limiter)
redis-cli SET "block:IP:$SUSPICIOUS_IP" "1" EX 3600  # Block for 1 hour
```

---

## Sign-Off

**Deployment Approved By:**

| Role | Name | Signature | Date |
|------|------|-----------|------|
| Security Engineer | | | |
| DevOps Lead | | | |
| CTO/Technical Lead | | | |

**Deployment Date:** ________________  
**Production URL:** ________________  
**Next Security Review:** ________________ (3 months from deployment)

---

**Document Version:** 1.0  
**Last Updated:** November 22, 2025  
**Maintained By:** @security-specialist  
**Review Frequency:** Quarterly
