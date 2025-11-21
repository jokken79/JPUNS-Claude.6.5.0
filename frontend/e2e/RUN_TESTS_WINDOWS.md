# Running Yukyu E2E Tests on Windows

## 🪟 Windows Quick Start Guide

### Prerequisites
1. ✅ Docker Desktop running
2. ✅ Services started: `cd scripts && START.bat`
3. ✅ Frontend running at http://localhost:3000
4. ✅ Backend running at http://localhost:8000

---

## 🚀 Running Tests (Windows PowerShell)

### Step 1: Navigate to Frontend
```powershell
cd frontend
```

### Step 2: Install Dependencies (First Time Only)
```powershell
npm install
```

### Step 3: Install Playwright Browsers (First Time Only)
```powershell
npx playwright install chromium
```

### Step 4: Run Tests

**Option A: All Yukyu Tests**
```powershell
npm run test:e2e:yukyu
```

**Option B: Playwright UI (Recommended)**
```powershell
npm run test:e2e:ui
```

**Option C: Watch Tests Execute (Headed)**
```powershell
npm run test:e2e:headed
```

**Option D: Debug Mode**
```powershell
npm run test:e2e:debug
```

---

## 🚀 Running Tests (Windows CMD)

### Step 1: Navigate to Frontend
```cmd
cd frontend
```

### Step 2: Run Tests
```cmd
npm run test:e2e:yukyu
```

---

## 📁 Accessing Test Files

### Open Test Files in VS Code
```powershell
# From project root
code frontend\e2e\
```

### Open Specific Test
```powershell
code frontend\e2e\02-yukyu-main.spec.ts
```

---

## 🎯 Common Commands

### Run All E2E Tests
```powershell
npm run test:e2e
```

### Run Only Yukyu Tests
```powershell
npm run test:e2e:yukyu
```

### Run Specific Test File
```powershell
npx playwright test e2e\02-yukyu-main.spec.ts
```

### Run Test by Name
```powershell
npx playwright test -g "should navigate to yukyu"
```

### View Last Test Report
```powershell
npm run test:e2e:report
```

---

## 📸 Finding Screenshots

Screenshots are saved to:
```
frontend\screenshots\
```

To open screenshots folder:
```powershell
explorer.exe screenshots
```

---

## 🔧 Troubleshooting (Windows)

### Issue: "Playwright browsers not found"
**Solution:**
```powershell
npx playwright install chromium
```

### Issue: "Port 3000 already in use"
**Solution:**
```powershell
# Find process using port 3000
netstat -ano | findstr :3000

# Kill process (replace PID with actual process ID)
taskkill /PID <PID> /F
```

### Issue: "Frontend not accessible"
**Solution:**
```powershell
# Check if services are running
docker compose ps

# Restart frontend
docker compose restart frontend

# Or start all services
cd ..\scripts
START.bat
```

### Issue: "Tests timeout"
**Solution:**
```powershell
# Wait for services to fully start (2-3 minutes)
# Check frontend is accessible
curl http://localhost:3000

# Check backend is accessible
curl http://localhost:8000/api/health
```

### Issue: "ENOENT: no such file or directory, mkdir 'screenshots'"
**Solution:**
```powershell
# Create screenshots directory
mkdir screenshots
```

---

## 📊 Expected Output

When tests run successfully:

```
Running 58 tests using 1 worker

  ✓  01-login-dashboard.spec.ts:7:3 › Login and Dashboard › should display login page (2s)
  ✓  01-login-dashboard.spec.ts:15:3 › Login and Dashboard › should login successfully (3s)
  ✓  02-yukyu-main.spec.ts:12:3 › Yukyu Main Page › should navigate to yukyu page (2s)
  ✓  02-yukyu-main.spec.ts:28:3 › Yukyu Main Page › should display yukyu overview cards (3s)
  ...

  58 passed (2.5m)
```

---

## 🎭 Playwright UI Mode (Best for Debugging)

### Start UI Mode
```powershell
npm run test:e2e:ui
```

### What You Can Do in UI Mode:
1. ✅ See all tests in a list
2. ✅ Run individual tests
3. ✅ Run tests in groups
4. ✅ Watch tests execute step-by-step
5. ✅ Inspect DOM at any point
6. ✅ See network requests
7. ✅ View console logs
8. ✅ Take screenshots manually
9. ✅ Debug failing tests

---

## 📝 Create New Tests

### Template for New Test
```typescript
import { test, expect } from '@playwright/test';
import { login } from './helpers/auth';
import { navigateAndWait, verifyPageLoaded } from './helpers/common';

test.describe('My New Page', () => {
  test.beforeEach(async ({ page }) => {
    await login(page);
  });

  test('should load the page', async ({ page }) => {
    await navigateAndWait(page, '/my-page');
    await verifyPageLoaded(page);
    expect(page.url()).toContain('/my-page');
  });
});
```

### Save as:
```
frontend\e2e\09-my-new-test.spec.ts
```

---

## 🔄 Running Tests in Docker

If you prefer to run tests inside Docker:

```powershell
# Access frontend container
docker exec -it uns-claudejp-frontend bash

# Inside container
cd /app
npm run test:e2e:yukyu
```

---

## 📚 Additional Resources

### View HTML Report
```powershell
npm run test:e2e:report
```

### Generate Trace
```powershell
npx playwright test --trace on
```

### View Trace
```powershell
npx playwright show-trace trace.zip
```

---

## ✅ Checklist Before Running Tests

- [ ] Docker Desktop is running
- [ ] Services started via `scripts\START.bat`
- [ ] Frontend accessible at http://localhost:3000
- [ ] Backend accessible at http://localhost:8000
- [ ] Admin user exists (admin/admin123)
- [ ] `npm install` completed
- [ ] Playwright browsers installed

---

## 🎯 Quick Reference

| Command | Description |
|---------|-------------|
| `npm run test:e2e:yukyu` | Run all yukyu tests |
| `npm run test:e2e:ui` | Open Playwright UI |
| `npm run test:e2e:headed` | Watch tests run |
| `npm run test:e2e:debug` | Debug mode |
| `npm run test:e2e:report` | View test report |
| `npx playwright test --list` | List all tests |
| `npx playwright test --help` | Show help |

---

## 🆘 Need Help?

1. **Read the docs**: `frontend\e2e\README.md`
2. **Check quick start**: `frontend\e2e\QUICK_START.md`
3. **View summary**: `YUKYU_E2E_TESTS_SUMMARY.md` (project root)
4. **Playwright docs**: https://playwright.dev/docs/intro

---

**Happy Testing!** 🎉
