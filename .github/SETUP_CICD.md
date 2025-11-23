# CI/CD Pipeline Setup Guide
# Quick Start for UNS-ClaudeJP 6.5.0

This guide will help you set up the GitHub Actions CI/CD pipeline in 5 minutes.

---

## Step 1: Install Pre-commit Hooks (Local Development)

```bash
# Install pre-commit tool
pip install pre-commit

# Install the hooks
cd /path/to/UNS-ClaudeJP-6.5.0
pre-commit install
pre-commit install --hook-type commit-msg

# Test the hooks (optional)
pre-commit run --all-files
```

**What this does:**
- Automatically checks code quality before every commit
- Prevents committing secrets, large files, and broken code
- Formats code consistently (Black, Prettier, isort)

---

## Step 2: Configure GitHub Secrets

1. Go to your repository on GitHub
2. Navigate to **Settings → Secrets and variables → Actions**
3. Click **New repository secret**
4. Add the following secrets:

### Required Secrets

| Secret Name | Description | Example Value |
|------------|-------------|---------------|
| `NEXT_PUBLIC_API_URL` | Backend API URL | `https://api.yoursite.com` or `http://localhost:8000` |

### Optional Secrets (for production deployment)

| Secret Name | Description | Example Value |
|------------|-------------|---------------|
| `DATABASE_URL` | PostgreSQL connection string | `postgresql://user:pass@host:5432/db` |
| `REDIS_URL` | Redis connection string | `redis://host:6379/0` |
| `DOCKER_USERNAME` | Docker Hub username | `yourusername` |
| `DOCKER_PASSWORD` | Docker Hub token | `dckr_pat_...` |

---

## Step 3: Enable GitHub Actions

1. Go to your repository's **Actions** tab
2. If prompted, click **"I understand my workflows, go ahead and enable them"**
3. The pipeline will automatically run on:
   - Push to `main`, `develop`, `feature/*`, `hotfix/*`
   - Pull requests to `main` and `develop`

---

## Step 4: Add CI/CD Badge to README

Add this to your `README.md`:

```markdown
# UNS-ClaudeJP 6.5.0

![CI/CD Pipeline](https://github.com/YOUR_USERNAME/UNS-ClaudeJP-6.5.0/workflows/CI%2FCD%20Pipeline/badge.svg)
![Coverage](https://img.shields.io/badge/coverage-90%25-brightgreen)
![License](https://img.shields.io/badge/license-MIT-blue)
```

Replace `YOUR_USERNAME` with your GitHub username or organization name.

---

## Step 5: Test the Pipeline

### Option A: Push a Test Commit

```bash
# Make a small change
echo "# Test CI/CD" >> TEST.md

# Commit with attribution
git add TEST.md
git commit -m "test(ci): verify pipeline configuration - @cicd-pipeline-engineer"

# Push to a feature branch
git checkout -b feature/test-cicd
git push origin feature/test-cicd
```

### Option B: Manual Trigger

1. Go to **Actions** tab
2. Select **CI/CD Pipeline** workflow
3. Click **Run workflow**
4. Choose branch and click **Run workflow**

---

## Step 6: Monitor Pipeline Execution

1. Go to **Actions** tab
2. Click on the running workflow
3. Watch jobs execute in real-time:
   - ✅ Stage 1: Linting & Type Check
   - ✅ Stage 2: Unit Tests
   - ✅ Stage 3: E2E Tests
   - ✅ Stage 4: Build
   - ✅ Stage 5: Security Scan

**Expected Duration:** 15-20 minutes for full pipeline

---

## Step 7: Review Results

### Success ✅

If all stages pass:
- Green checkmark on commit/PR
- Artifacts available for download (coverage reports, test results)
- Ready to merge (if PR)

### Failure ❌

If stages fail:
1. Click on the failed job
2. Review the logs
3. Common fixes:
   - **Linting errors:** Run `npm run lint:fix` or `black app/`
   - **Type errors:** Run `npm run typecheck` or `mypy app/`
   - **Test failures:** Fix failing tests locally
   - **Build errors:** Check environment variables

---

## Advanced Configuration

### Enable Matrix Testing for PRs

Add the `test-matrix` label to your PR to run tests across:
- Ubuntu, Windows, macOS
- Node 18, 20, 22
- Python 3.11, 3.12

**Warning:** This adds ~30-45 minutes to pipeline duration.

### Skip Tests (Emergency Only)

```bash
# Manual workflow dispatch with skip_tests: true
# Use GitHub Actions UI → Run workflow → Check "Skip test stages"
```

**⚠️ Use only for emergency hotfixes!**

### Configure Coverage Thresholds

Edit `.github/workflows/ci-cd.yml`:

```yaml
env:
  FRONTEND_COVERAGE_THRESHOLD: 80  # Change to desired %
  BACKEND_COVERAGE_THRESHOLD: 80   # Change to desired %
```

---

## Troubleshooting

### Pre-commit Hooks Failing

```bash
# Skip pre-commit for emergency commits (not recommended)
git commit --no-verify -m "emergency fix"

# Update pre-commit hooks
pre-commit autoupdate

# Clear pre-commit cache
pre-commit clean
```

### GitHub Actions Not Running

1. Check if Actions are enabled (Settings → Actions)
2. Verify branch protection rules aren't blocking workflows
3. Check workflow file syntax: `cat .github/workflows/ci-cd.yml`

### Pipeline Stuck/Timeout

1. Cancel the workflow run
2. Check for:
   - Infinite loops in tests
   - Services not starting (PostgreSQL, Redis)
   - Network issues downloading dependencies
3. Re-run the workflow

### Secrets Not Available

1. Verify secrets are added in repository settings
2. Check secret names match exactly (case-sensitive)
3. Secrets are NOT available in PRs from forks (security)

---

## Next Steps

- ✅ Read [CI_CD_IMPLEMENTATION.md](../CI_CD_IMPLEMENTATION.md) for detailed documentation
- ✅ Configure [Dependabot](https://docs.github.com/en/code-security/dependabot) for automated dependency updates
- ✅ Set up [branch protection rules](https://docs.github.com/en/repositories/configuring-branches-and-merges-in-your-repository/managing-protected-branches)
- ✅ Configure deployment to staging/production environments

---

## Quick Reference

### Local Test Commands

```bash
# Frontend
cd frontend
npm run lint          # ESLint
npm run typecheck     # TypeScript
npm test              # Vitest
npm run test:e2e      # Playwright

# Backend
cd backend
black app/ tests/                    # Format
isort app/ tests/                    # Sort imports
mypy app/                            # Type check
pytest tests/ -m unit -v             # Unit tests
pytest tests/ -m integration -v      # Integration tests

# Pre-commit
pre-commit run --all-files          # Run all hooks
```

### Useful GitHub Actions Commands

```bash
# View workflow runs
gh run list --workflow="CI/CD Pipeline"

# View specific run
gh run view <run-id>

# Re-run failed jobs
gh run rerun <run-id> --failed

# Download artifacts
gh run download <run-id>
```

---

**Setup Time:** ~5 minutes  
**First Pipeline Run:** ~15-20 minutes  
**Subsequent Runs:** ~10-15 minutes (with caching)

**Questions?** Contact @cicd-pipeline-engineer or check [CI_CD_IMPLEMENTATION.md](../CI_CD_IMPLEMENTATION.md)
