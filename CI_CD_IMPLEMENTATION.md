# CI/CD Implementation Guide
# UNS-ClaudeJP 6.0.0 Monorepo

**Version:** 6.0.0  
**Last Updated:** 2025-11-19  
**Pipeline Platform:** GitHub Actions

---

## Table of Contents

1. [Overview](#overview)
2. [Pipeline Architecture](#pipeline-architecture)
3. [Workflow Stages](#workflow-stages)
4. [GitHub Secrets Configuration](#github-secrets-configuration)
5. [Running Tests Locally](#running-tests-locally)
6. [Troubleshooting Guide](#troubleshooting-guide)
7. [Best Practices](#best-practices)
8. [Matrix Testing](#matrix-testing)
9. [Performance Optimization](#performance-optimization)
10. [Security Considerations](#security-considerations)

---

## Overview

This CI/CD pipeline automates the testing, building, and deployment process for the UNS-ClaudeJP 6.0.0 monorepo, which consists of:

- **Frontend:** Next.js 16 + React 19 + TypeScript + Playwright E2E + Vitest
- **Backend:** FastAPI + Python 3.11 + pytest
- **Infrastructure:** Docker Compose with 6 services (PostgreSQL, Redis, Backend, Frontend, Importer, Jaeger)

### Pipeline Triggers

The pipeline runs on:
- **Push** to `main`, `develop`, `feature/**`, `hotfix/**` branches
- **Pull Requests** to `main` and `develop` branches
- **Manual Dispatch** via GitHub Actions UI (with optional test skipping)

### Key Features

✅ **Multi-Stage Pipeline** with 5 core stages  
✅ **Parallel Execution** for frontend and backend jobs  
✅ **Comprehensive Testing** (Unit, Integration, E2E)  
✅ **Security Scanning** (npm audit, Safety, CodeQL)  
✅ **Cross-Platform Matrix Testing** (Ubuntu, Windows, macOS)  
✅ **Docker Build Validation**  
✅ **Coverage Reporting** with configurable thresholds  
✅ **Artifact Management** with retention policies  

---

## Pipeline Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                    GitHub Actions Workflow                       │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
        ┌─────────────────────────────────────────┐
        │   Stage 1: Linting & Type Check         │
        │   ├── Frontend: ESLint + TypeScript     │
        │   └── Backend: Black + isort + MyPy     │
        └─────────────────┬───────────────────────┘
                          │ (Parallel)
                          ▼
        ┌─────────────────────────────────────────┐
        │   Stage 2: Unit Tests                   │
        │   ├── Frontend: Vitest + Coverage       │
        │   └── Backend: pytest + Coverage        │
        └─────────────────┬───────────────────────┘
                          │
                          ▼
        ┌─────────────────────────────────────────┐
        │   Stage 3: E2E & Integration Tests      │
        │   ├── Backend Integration Tests         │
        │   ├── Playwright E2E Tests              │
        │   └── Services: PostgreSQL + Redis      │
        └─────────────────┬───────────────────────┘
                          │
                          ▼
        ┌─────────────────────────────────────────┐
        │   Stage 4: Build & Package              │
        │   ├── Frontend Production Build         │
        │   ├── Backend Coverage Report           │
        │   └── Docker Compose Build Test         │
        └─────────────────┬───────────────────────┘
                          │
                          ▼
        ┌─────────────────────────────────────────┐
        │   Stage 5: Security Scan                │
        │   ├── npm audit (Frontend)              │
        │   ├── Safety (Backend)                  │
        │   ├── Dependency Review                 │
        │   └── CodeQL Analysis                   │
        └─────────────────┬───────────────────────┘
                          │
                          ▼
        ┌─────────────────────────────────────────┐
        │   Stage 6: CI/CD Summary                │
        │   └── Aggregate Results & Reporting     │
        └─────────────────────────────────────────┘
```

---

## Workflow Stages

### Stage 1: Linting & Type Check (15 minutes timeout)

**Purpose:** Ensure code quality and type safety before running tests.

#### Frontend Tasks
```yaml
- ESLint: npm run lint (0 warnings policy)
- TypeScript: npm run typecheck
- Prettier: npm run format:check
```

#### Backend Tasks
```yaml
- Black: python -m black --check --diff app/ tests/
- isort: python -m isort --check-only --diff app/ tests/
- MyPy: python -m mypy app/ --config-file=mypy.ini
```

**Artifacts Generated:**
- `eslint-report.json` (Frontend)
- `mypy_report.txt` (Backend)

---

### Stage 2: Unit Tests (20 minutes timeout)

**Purpose:** Run fast, isolated unit tests for both components.

#### Frontend: Vitest
```bash
cd frontend
npm test -- --coverage --reporter=verbose --reporter=json
```

**Coverage Threshold:** 80% (configurable via `FRONTEND_COVERAGE_THRESHOLD`)

#### Backend: pytest
```bash
cd backend
pytest tests/ -v -m "unit" \
  --cov=app \
  --cov-report=html \
  --cov-report=json \
  --html=pytest-report.html
```

**Coverage Threshold:** 80% (configurable via `BACKEND_COVERAGE_THRESHOLD`)

**Artifacts Generated:**
- `frontend/coverage/` (HTML + JSON reports)
- `backend/htmlcov/` (HTML coverage report)
- `backend/pytest-report.html` (Test results)

---

### Stage 3: E2E & Integration Tests (30 minutes timeout)

**Purpose:** Validate end-to-end workflows and service integrations.

#### Infrastructure Services
```yaml
PostgreSQL: postgres:15-alpine
Redis: redis:7-alpine
```

#### Backend Integration Tests
```bash
pytest tests/ -v -m "integration" \
  --cov=app \
  --cov-report=html
```

Environment:
- `DATABASE_URL`: postgresql://test_user:test_password@localhost:5432/test_db
- `REDIS_URL`: redis://localhost:6379/0

#### Frontend: Playwright E2E
```bash
# Build frontend
npm run build

# Start backend + frontend servers
uvicorn app.main:app --host 0.0.0.0 --port 8000 &
npm run start &

# Run Playwright tests
npm run test:e2e -- --reporter=html --reporter=json
```

**Artifacts Generated:**
- `playwright-report/` (HTML report with screenshots)
- `test-results/` (Detailed test artifacts)
- Failure screenshots (if tests fail)

---

### Stage 4: Build & Package (25 minutes timeout)

**Purpose:** Create production builds and validate Docker deployment.

#### Frontend Production Build
```bash
cd frontend
NODE_ENV=production npm run build
```

**Environment Variables:**
- `NEXT_PUBLIC_API_URL`: Backend API endpoint (from secrets)

#### Backend Coverage Validation
```bash
cd backend
pytest tests/ --cov=app --cov-fail-under=80
```

#### Docker Compose Build Test
```bash
# Build all images
docker compose build --no-cache

# Test stack startup
docker compose up -d
sleep 15

# Health checks
curl -f http://localhost:8000/health
curl -f http://localhost:3000

# Cleanup
docker compose down
```

**Artifacts Generated:**
- `frontend/.next/` (Production build)
- `backend/htmlcov/` (Coverage report)

---

### Stage 5: Security Scan (20 minutes timeout)

**Purpose:** Identify security vulnerabilities in dependencies and code.

#### Frontend: npm audit
```bash
npm audit --audit-level=moderate --json > npm-audit.json
```

#### Backend: Safety
```bash
safety check --json --file=requirements.txt > safety-report.json
```

#### Dependency Review (PR only)
- **Action:** `actions/dependency-review-action@v4`
- **Fail Severity:** moderate

#### CodeQL Analysis
- **Languages:** JavaScript, Python
- **Queries:** security-extended
- **Results:** Uploaded to GitHub Security tab

**Artifacts Generated:**
- `npm-audit.json` (Frontend vulnerabilities)
- `safety-report.json` (Backend vulnerabilities)
- CodeQL SARIF results

---

### Stage 6: Matrix Testing (Optional)

**Trigger:** Add `test-matrix` label to pull request

**Matrix Dimensions:**
```yaml
OS: [ubuntu-latest, windows-latest, macos-latest]
Node: ['18', '20', '22']
Python: ['3.11', '3.12']
```

**Total Combinations:** 18 (with strategic exclusions)

**Purpose:** Ensure cross-platform compatibility before major releases.

---

## GitHub Secrets Configuration

### Required Secrets

Navigate to **Settings → Secrets and variables → Actions** and add:

#### Production Secrets
```env
NEXT_PUBLIC_API_URL          # Backend API URL (e.g., https://api.example.com)
DATABASE_URL                 # Production PostgreSQL connection string
REDIS_URL                    # Production Redis connection string
```

#### Optional Secrets (for deployment)
```env
DOCKER_USERNAME              # Docker Hub username
DOCKER_PASSWORD              # Docker Hub password or token
DEPLOY_SSH_KEY               # SSH key for deployment servers
SENTRY_DSN                   # Sentry error tracking DSN
SENTRY_AUTH_TOKEN            # Sentry release tracking
```

#### Security Scanning (Optional)
```env
SNYK_TOKEN                   # Snyk security scanning token
SONAR_TOKEN                  # SonarCloud analysis token
```

### Environment Variables (No Secrets Required)

These are configured in the workflow file:
```yaml
NODE_VERSION: '20'
PYTHON_VERSION: '3.11'
POSTGRES_VERSION: '15'
FRONTEND_COVERAGE_THRESHOLD: 80
BACKEND_COVERAGE_THRESHOLD: 80
```

---

## Running Tests Locally

### Prerequisites

```bash
# Install dependencies
cd frontend && npm ci
cd ../backend && pip install -r requirements.txt

# Install development tools
cd backend && pip install black isort mypy pytest-cov pytest-html
```

### Frontend Tests

#### 1. Linting & Type Check
```bash
cd frontend

# ESLint
npm run lint

# TypeScript
npm run typecheck

# Prettier
npm run format:check
```

#### 2. Unit Tests (Vitest)
```bash
cd frontend

# Run all tests
npm test

# Watch mode
npm run test:watch

# With coverage
npm test -- --coverage
```

#### 3. E2E Tests (Playwright)
```bash
cd frontend

# Install browsers (first time only)
npx playwright install --with-deps

# Run tests headless
npm run test:e2e

# Run with UI
npm run test:e2e:ui

# Run headed (see browser)
npm run test:e2e:headed

# Debug mode
npm run test:e2e:debug

# View last report
npm run test:e2e:report
```

### Backend Tests

#### 1. Linting & Type Check
```bash
cd backend

# Black formatting check
python -m black --check app/ tests/

# Fix formatting
python -m black app/ tests/

# isort import ordering
python -m isort --check-only app/ tests/

# Fix imports
python -m isort app/ tests/

# MyPy type check
python -m mypy app/ --config-file=mypy.ini
```

#### 2. Unit Tests (pytest)
```bash
cd backend

# Run all unit tests
pytest tests/ -v -m "unit"

# Run with coverage
pytest tests/ -v -m "unit" --cov=app --cov-report=html

# Run specific test file
pytest tests/test_api.py -v

# Run specific test
pytest tests/test_api.py::test_function_name -v
```

#### 3. Integration Tests
```bash
cd backend

# Start services first
docker compose up -d db redis

# Run integration tests
pytest tests/ -v -m "integration"

# Cleanup
docker compose down
```

### Full Stack Testing

```bash
# Start all services
docker compose up -d

# Wait for services to be ready
sleep 10

# Check health
curl http://localhost:8000/health
curl http://localhost:3000

# Run full E2E suite
cd frontend
npm run test:e2e

# Cleanup
docker compose down
```

---

## Troubleshooting Guide

### Common Issues

#### 1. Frontend Build Fails

**Symptom:** `npm run build` fails with TypeScript errors

**Solutions:**
```bash
# Clear cache and reinstall
rm -rf node_modules .next
npm ci

# Check TypeScript errors
npm run typecheck

# Verify Node version
node --version  # Should be 18, 20, or 22
```

#### 2. Backend Tests Fail

**Symptom:** pytest fails with import errors

**Solutions:**
```bash
# Verify Python version
python --version  # Should be 3.11+

# Reinstall dependencies
pip install -r requirements.txt --force-reinstall

# Check Python path
export PYTHONPATH="${PYTHONPATH}:/path/to/backend"

# Run with verbose logging
pytest tests/ -vv --log-cli-level=DEBUG
```

#### 3. Playwright Tests Fail

**Symptom:** Browser launch errors or timeout

**Solutions:**
```bash
# Reinstall browsers
npx playwright install --with-deps

# Increase timeout
PLAYWRIGHT_TIMEOUT=60000 npm run test:e2e

# Run with headed mode to debug
npm run test:e2e:headed

# Check system dependencies (Linux)
sudo npx playwright install-deps
```

#### 4. Docker Compose Fails

**Symptom:** Services won't start or health checks fail

**Solutions:**
```bash
# Check service logs
docker compose logs

# Rebuild without cache
docker compose build --no-cache

# Check port conflicts
lsof -i :5432  # PostgreSQL
lsof -i :6379  # Redis
lsof -i :8000  # Backend
lsof -i :3000  # Frontend

# Cleanup volumes
docker compose down -v
```

#### 5. Coverage Threshold Not Met

**Symptom:** Pipeline fails at coverage check

**Solutions:**
```bash
# Frontend: View coverage report
cd frontend
npm test -- --coverage
open coverage/index.html

# Backend: View coverage report
cd backend
pytest tests/ --cov=app --cov-report=html
open htmlcov/index.html

# Identify untested code and add tests
```

#### 6. CI/CD Pipeline Timeout

**Symptom:** Jobs exceed timeout limits

**Solutions:**
```yaml
# Adjust timeouts in workflow file
timeout-minutes: 30  # Increase as needed

# Cache dependencies more aggressively
- uses: actions/cache@v3
  with:
    key: ${{ runner.os }}-deps-${{ hashFiles('**/package-lock.json') }}

# Skip matrix testing for non-critical PRs
# Remove 'test-matrix' label from PR
```

#### 7. Security Scan False Positives

**Symptom:** Security scan fails on known non-issues

**Solutions:**
```bash
# Frontend: Update npm audit exceptions
npm audit --json | jq '.vulnerabilities'

# Backend: Create Safety policy file
safety check --json --policy-file .safety-policy.yml

# Suppress specific CVEs in workflow (use sparingly)
```

---

## Best Practices

### 1. Commit Message Convention

Follow the CI/CD attribution pattern:
```
type(scope): description - @agent1 @agent2

feat(auth): implement JWT authentication - @cicd-pipeline-engineer @security-auditor
fix(api): resolve database connection timeout - @devops-troubleshooter
docs(readme): update CI/CD documentation - @cicd-pipeline-engineer
```

### 2. Branch Strategy

```
main           → Production (protected, requires PR + reviews)
develop        → Staging (protected, requires PR)
feature/*      → Feature development
hotfix/*       → Emergency fixes
```

### 3. PR Workflow

```bash
# 1. Create feature branch
git checkout -b feature/new-feature

# 2. Make changes and test locally
npm test  # Frontend
pytest tests/  # Backend

# 3. Commit with attribution
git commit -m "feat(api): add new endpoint - @cicd-pipeline-engineer"

# 4. Push and create PR
git push origin feature/new-feature

# 5. Address CI/CD feedback
# Fix any failing tests or linting issues

# 6. Request review
# Wait for approval and CI/CD success

# 7. Merge with squash
# Maintain clean commit history
```

### 4. Test Organization

```
frontend/
├── __tests__/              # Vitest unit tests
│   ├── components/
│   ├── utils/
│   └── hooks/
└── e2e/                    # Playwright E2E tests
    ├── auth.spec.ts
    ├── navigation.spec.ts
    └── forms.spec.ts

backend/
└── tests/
    ├── unit/               # Fast, isolated tests
    ├── integration/        # Database + Redis tests
    └── e2e/                # Full API tests
```

### 5. Coverage Goals

| Component | Target | Minimum |
|-----------|--------|---------|
| Frontend  | 90%    | 80%     |
| Backend   | 90%    | 80%     |
| E2E       | Critical paths | - |

---

## Matrix Testing

### When to Use Matrix Testing

Add the `test-matrix` label to PRs when:
- **Major version updates** (Node, Python, dependencies)
- **Cross-platform features** (file system, OS-specific code)
- **Release candidates** (before v7.0.0 release)
- **Breaking changes** (API changes, schema migrations)

### Matrix Configuration

The pipeline tests against:

**Operating Systems:**
- Ubuntu Latest (Linux - primary CI environment)
- Windows Latest (Windows Server - enterprise compatibility)
- macOS Latest (macOS - developer machines)

**Node.js Versions:**
- v18 (LTS maintenance)
- v20 (LTS active)
- v22 (Current)

**Python Versions:**
- 3.11 (Current project version)
- 3.12 (Latest stable)

**Total Test Runs:** 18 combinations (with exclusions)

### Performance Impact

Matrix testing adds **~30-45 minutes** to pipeline duration. Use strategically for:
- Pre-release validation
- Dependency upgrades
- Platform-specific bug fixes

---

## Performance Optimization

### 1. Dependency Caching

The pipeline automatically caches:
```yaml
# Node.js dependencies
cache: 'npm'
cache-dependency-path: frontend/package-lock.json

# Python dependencies
cache: 'pip'
cache-dependency-path: backend/requirements.txt
```

**Expected Speedup:** 2-3 minutes per job

### 2. Artifact Retention

```yaml
# Short-term artifacts (7 days)
- Build artifacts
- Failure screenshots

# Medium-term artifacts (30 days)
- Coverage reports
- Test reports
- Security scans
```

**Storage Savings:** ~500 MB/month

### 3. Parallel Execution

Jobs run in parallel whenever possible:
- Frontend + Backend linting (concurrent)
- Frontend + Backend unit tests (concurrent)
- Security scans run parallel to E2E tests

**Total Pipeline Time:** ~15-20 minutes (vs 45+ minutes sequential)

### 4. Selective Test Execution

```bash
# Run only affected tests (future enhancement)
git diff --name-only origin/main | grep 'frontend/' && npm test

# Skip E2E tests for docs-only changes
if [[ $(git diff --name-only) == *.md ]]; then
  echo "Skipping tests for documentation changes"
fi
```

---

## Security Considerations

### 1. Secret Management

**NEVER commit secrets to the repository:**
```bash
# ✅ Good: Use environment variables
DATABASE_URL=${{ secrets.DATABASE_URL }}

# ❌ Bad: Hardcoded secrets
DATABASE_URL=postgresql://user:password@localhost/db
```

### 2. Dependency Security

**Automated scanning on every PR:**
- npm audit (Frontend)
- Safety (Backend)
- Dependency Review (GitHub)
- CodeQL (Static analysis)

**Manual review required for:**
- High/Critical vulnerabilities
- License compliance issues
- Deprecated package usage

### 3. Docker Image Security

**Best practices implemented:**
```dockerfile
# Use minimal base images
FROM python:3.11-slim

# Run as non-root user
USER appuser

# Multi-stage builds (reduce attack surface)
FROM node:20-alpine AS builder
```

**Future enhancements:**
- Trivy container scanning
- Image signing with Cosign
- Vulnerability database updates

### 4. Access Control

**Repository settings:**
- Branch protection rules enabled
- Require PR reviews (minimum 1)
- Require status checks to pass
- Restrict force pushes
- Require signed commits (recommended)

---

## Continuous Improvement

### Metrics to Track

1. **Pipeline Performance**
   - Average execution time
   - Success rate
   - Flaky test frequency

2. **Code Quality**
   - Code coverage trends
   - Linting violations
   - Type coverage (TypeScript + MyPy)

3. **Security Posture**
   - Vulnerability discovery rate
   - Mean time to remediation
   - Dependency freshness

### Roadmap

**Q1 2026:**
- [ ] Add Dependabot auto-merge for minor updates
- [ ] Implement deployment to staging environment
- [ ] Add performance regression testing

**Q2 2026:**
- [ ] Blue-green deployment strategy
- [ ] Canary releases with traffic splitting
- [ ] Automated rollback on failure

**Q3 2026:**
- [ ] GitOps with ArgoCD integration
- [ ] Multi-region deployment
- [ ] Chaos engineering tests

---

## Support & Contact

For CI/CD pipeline issues:
1. Check this troubleshooting guide
2. Review GitHub Actions logs
3. Contact @cicd-pipeline-engineer
4. Open an issue with `ci/cd` label

**Pipeline Maintainers:**
- @cicd-pipeline-engineer (Primary)
- @devops-troubleshooter (Escalation)
- @security-auditor (Security issues)

---

**Last Updated:** 2025-11-19  
**Document Version:** 1.0.0  
**Pipeline Version:** 6.0.0
