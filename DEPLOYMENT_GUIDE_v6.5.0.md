# UNS-ClaudeJP v6.5.0 Deployment Guide

**Version:** 6.5.0
**Release Date:** 2025-11-19
**Duration:** 30-45 minutes

---

## Pre-Deployment Checklist

### System Requirements
- [ ] Docker 20.10+
- [ ] Docker Compose 2.0+
- [ ] 8GB RAM minimum
- [ ] 2GB disk space
- [ ] Internet connection
- [ ] PostgreSQL 15+ (if not using Docker)

### Preparation
- [ ] Backup current database
- [ ] Backup current configuration
- [ ] Stop current v5.x services (if applicable)
- [ ] Review release notes
- [ ] Read this guide completely
- [ ] Prepare rollback plan
- [ ] Notify stakeholders

---

## Installation Steps

### Step 1: Deploy v6.5.0 Container

```bash
# Checkout v6.5.0
git checkout v6.5.0

# Configure environment
cp .env.example .env
# Edit .env with production values

# Start services
docker compose up -d
sleep 30  # Wait for services to stabilize

# Verify services
docker compose ps
```

### Step 2: Database Setup

```bash
# Apply migrations
docker compose exec backend alembic upgrade head

# Verify database
docker compose exec -it db psql -U uns_admin -d uns_claudejp -c "SELECT version();"

# Check tables
docker compose exec -it db psql -U uns_admin -d uns_claudejp -c "\\dt"
```

### Step 3: Service Verification

```bash
# Backend health
curl http://localhost:8000/api/health

# Frontend availability
curl http://localhost/
```

### Step 4: Post-Deployment Validation

```bash
# Check logs for errors
docker compose logs backend | tail -50
docker compose logs frontend | tail -50

# Verify telemetry
curl http://localhost:9090/api/v1/targets  # Prometheus
curl http://localhost:3001                  # Grafana
```

---

## Monitoring Post-Deployment

- [ ] Monitor error rates (target: < 0.1%)
- [ ] Check response times (target: p95 < 2s)
- [ ] Verify no critical alerts
- [ ] Monitor memory usage (target: < 60%)
- [ ] Check disk usage (target: < 80%)

---

## Rollback Procedure

If critical issues occur:

```bash
# Stop v6.5.0
docker compose down

# Restore from backup
# [Your backup restoration procedure]

# Deploy v5.x
git checkout v5.x
docker compose up -d
```

---

## Troubleshooting

### Services Won't Start
```bash
# Check Docker logs
docker compose logs

# Restart services
docker compose restart

# Check resource availability
docker stats
```

### Database Connection Issues
```bash
# Verify database is running
docker compose ps db

# Check connection string in .env
cat .env | grep DATABASE_URL

# Test connection
docker compose exec -it db psql -U uns_admin -d uns_claudejp -c "SELECT 1;"
```

### Performance Issues
- Check system resources
- Review monitoring dashboards (Grafana)
- Check database query performance
- Review application logs

---

## Support

For issues, see `/docs/TROUBLESHOOTING.md` or contact support.

