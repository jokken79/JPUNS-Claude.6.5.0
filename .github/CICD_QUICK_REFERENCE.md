# CI/CD Quick Reference Card
# UNS-ClaudeJP 6.5.0

**Print this out and keep it handy!**

---

## Before Every Commit

```bash
# Frontend checks
cd frontend
npm run lint          # ✅ ESLint
npm run typecheck     # ✅ TypeScript
npm run format:check  # ✅ Prettier
npm test              # ✅ Vitest

# Backend checks
cd backend
black app/ tests/                # ✅ Format
isort app/ tests/                # ✅ Imports
mypy app/ --config-file=mypy.ini # ✅ Types
pytest tests/ -m unit -v         # ✅ Tests
```

---

## Pre-commit Hooks (Auto-runs)

```bash
# Install once
pip install pre-commit
pre-commit install

# Manual run
pre-commit run --all-files

# Skip (emergency only!)
git commit --no-verify -m "..."
```

---

## Commit Message Format

```bash
# With agent attribution (REQUIRED!)
type(scope): description - @agent1 @agent2

# Examples
feat(auth): add JWT authentication - @cicd-pipeline-engineer
fix(api): resolve timeout issue - @devops-troubleshooter
docs(readme): update setup guide - @cicd-pipeline-engineer
test(e2e): add login flow tests - @cicd-pipeline-engineer
```

**Types:** feat, fix, docs, style, refactor, test, chore

---

## Branch Strategy

```
main           → Production (protected)
develop        → Staging (protected)
feature/*      → New features
hotfix/*       → Emergency fixes
```

**Workflow:**
```bash
# Start feature
git checkout develop
git pull
git checkout -b feature/my-feature

# Make changes, commit, push
git add .
git commit -m "feat(api): add endpoint - @cicd-pipeline-engineer"
git push origin feature/my-feature

# Create PR to develop
# Wait for CI/CD ✅
# Get review ✅
# Merge!
```

---

## Pipeline Stages (15-20 min)

```
1. Linting & Type Check   → 5 min  ⏱️
2. Unit Tests             → 8 min  ⏱️
3. E2E Tests              → 12 min ⏱️
4. Build & Package        → 10 min ⏱️
5. Security Scan          → 8 min  ⏱️
```

**Parallel execution reduces total time to ~15-20 min**

---

## Common Failures & Fixes

### ❌ Linting Failed
```bash
# Frontend
npm run lint:fix
npm run format

# Backend
black app/ tests/
isort app/ tests/
```

### ❌ Type Check Failed
```bash
# Frontend
npm run typecheck
# Fix TypeScript errors

# Backend
mypy app/
# Fix type annotations
```

### ❌ Tests Failed
```bash
# Run locally
npm test                    # Frontend
pytest tests/ -v            # Backend

# Debug specific test
npm test -- MyComponent.test.tsx
pytest tests/test_api.py::test_function -v
```

### ❌ Coverage Too Low
```bash
# View coverage
npm test -- --coverage      # Frontend
pytest tests/ --cov=app --cov-report=html  # Backend

# Open report
open coverage/index.html    # Frontend
open htmlcov/index.html     # Backend

# Add tests for uncovered code
```

### ❌ Docker Build Failed
```bash
# Test locally
docker compose build --no-cache
docker compose up -d
docker compose logs

# Check health
curl http://localhost:8000/health
curl http://localhost:3000
```

---

## Useful Commands

### GitHub CLI
```bash
# View runs
gh run list --workflow="CI/CD Pipeline"

# View specific run
gh run view <run-id>

# Re-run failed
gh run rerun <run-id> --failed

# Download artifacts
gh run download <run-id>
```

### Local Testing
```bash
# Full frontend test suite
cd frontend
npm ci                  # Install deps
npm run lint           # Lint
npm run typecheck      # Types
npm test               # Unit tests
npm run test:e2e       # E2E tests

# Full backend test suite
cd backend
pip install -r requirements.txt
black --check app/ tests/
isort --check app/ tests/
mypy app/
pytest tests/ -v
```

### Docker Commands
```bash
# Start services
docker compose up -d

# Stop services
docker compose down

# Rebuild
docker compose build --no-cache

# View logs
docker compose logs -f

# Health checks
docker compose ps
```

---

## Coverage Targets

| Component | Target | Minimum |
|-----------|--------|---------|
| Frontend  | 90%    | 80%     |
| Backend   | 90%    | 80%     |

---

## Matrix Testing (Optional)

**Add `test-matrix` label to PR** for full cross-platform testing:

- Ubuntu, Windows, macOS
- Node 18, 20, 22
- Python 3.11, 3.12

**⚠️ Adds ~30-45 minutes to pipeline**

---

## Security Scanning

**Auto-runs on every PR:**
- npm audit (Frontend)
- Safety check (Backend)
- Dependency Review
- CodeQL Analysis

**View results:** Security tab in GitHub

---

## Artifacts (Downloadable)

### 30-day retention:
- Coverage reports
- Test reports
- Security scans

### 7-day retention:
- Build artifacts
- Failure screenshots

**Download:** Actions tab → Workflow run → Artifacts section

---

## Emergency Procedures

### Hotfix to Production
```bash
# Create hotfix branch
git checkout main
git pull
git checkout -b hotfix/critical-fix

# Make fix, test locally
npm test && pytest tests/

# Commit and push
git commit -m "fix(auth): resolve security issue - @cicd-pipeline-engineer"
git push origin hotfix/critical-fix

# Create PR to main
# Optional: Skip tests with manual workflow dispatch
# Merge after CI/CD passes
```

### Skip Tests (Use sparingly!)
1. Go to Actions tab
2. Run workflow manually
3. Check "Skip test stages"
4. Deploy immediately

**⚠️ Only for critical production issues!**

---

## Getting Help

| Issue | Resource |
|-------|----------|
| Quick setup | [SETUP_CICD.md](.github/SETUP_CICD.md) |
| Full docs | [CI_CD_IMPLEMENTATION.md](../CI_CD_IMPLEMENTATION.md) |
| Troubleshooting | [CI_CD_README.md](.github/CI_CD_README.md) |
| Bug/Issue | Open GitHub issue with `ci/cd` label |
| Emergency | Contact @devops-troubleshooter |

---

## Health Check URLs

```bash
# Backend
curl http://localhost:8000/health
curl http://localhost:8000/docs  # API docs

# Frontend
curl http://localhost:3000

# PostgreSQL
psql -h localhost -U postgres -d uns_claudejp_db

# Redis
redis-cli -h localhost ping
```

---

## Required Secrets (GitHub)

**Settings → Secrets and variables → Actions**

| Secret | Required? | Example |
|--------|-----------|---------|
| `NEXT_PUBLIC_API_URL` | ✅ Yes | `http://localhost:8000` |
| `DATABASE_URL` | ⚠️ Production | `postgresql://...` |
| `REDIS_URL` | ⚠️ Production | `redis://...` |

See [secrets.template.env](.github/secrets.template.env) for full list

---

## Pipeline Costs (Estimated)

| Configuration | Duration | CI Minutes/Run | Monthly Cost |
|--------------|----------|----------------|--------------|
| Minimal | 10 min | 10 | $15 |
| Recommended | 25 min | 100 | $50 |
| Full Matrix | 45 min | 810 | $40 |

**Total estimated:** ~$105/month (300 minimal runs + 50 recommended + 5 full matrix)

**GitHub Free Tier:** 2,000 minutes/month for public repos

---

## Badges for README

```markdown
![CI/CD](https://github.com/USER/REPO/workflows/CI%2FCD%20Pipeline/badge.svg)
![Coverage](https://img.shields.io/badge/coverage-90%25-brightgreen)
![Node](https://img.shields.io/badge/node-20.x-green)
![Python](https://img.shields.io/badge/python-3.11-blue)
![License](https://img.shields.io/badge/license-MIT-blue)
```

---

## Contact

**CI/CD Issues:** @cicd-pipeline-engineer  
**Emergency:** @devops-troubleshooter  
**Security:** @security-auditor

---

**Version:** 1.0.0 | **Updated:** 2025-11-19

**Print this page and keep it at your desk! 📄**
