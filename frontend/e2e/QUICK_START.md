# Quick Start - Yukyu E2E Tests

## 🚀 Run Tests Immediately

### Option 1: Run All Yukyu Tests (Recommended)
```bash
cd frontend
npm run test:e2e:yukyu
```

### Option 2: Run All E2E Tests
```bash
cd frontend
npm run test:e2e
```

### Option 3: Run with Visual UI (Best for Debugging)
```bash
cd frontend
npm run test:e2e:ui
```

### Option 4: Run in Headed Mode (See Browser)
```bash
cd frontend
npm run test:e2e:headed
```

### Option 5: Run with Debugger
```bash
cd frontend
npm run test:e2e:debug
```

## 📊 View Test Results
```bash
cd frontend
npm run test:e2e:report
```

## 📋 What Gets Tested

### Pages Verified:
1. ✅ Login and Dashboard
2. ✅ /yukyu - Yukyu main page
3. ✅ /yukyu-requests - Requests list
4. ✅ /yukyu-requests/create - Create request form
5. ✅ /yukyu-reports - Reports and analytics
6. ✅ /admin/yukyu-management - Admin management
7. ✅ /payroll/yukyu-summary - Payroll summary
8. ✅ /yukyu-history - Usage history

### Each Page Tests:
- ✅ Loads without 404 errors
- ✅ No JavaScript console errors
- ✅ Expected UI elements present
- ✅ Navigation works
- ✅ Forms/filters/tables displayed

## 🔍 Test Files

```
e2e/
├── 01-login-dashboard.spec.ts      # Login tests
├── 02-yukyu-main.spec.ts           # Main page
├── 03-yukyu-requests.spec.ts       # Requests page
├── 04-yukyu-request-create.spec.ts # Create page
├── 05-yukyu-reports.spec.ts        # Reports page
├── 06-admin-yukyu.spec.ts          # Admin page
├── 07-payroll-yukyu.spec.ts        # Payroll page
├── 08-yukyu-history.spec.ts        # History page
├── yukyu-all.spec.ts               # Master suite
└── helpers/                        # Test utilities
```

## 📸 Screenshots

All screenshots are saved to `frontend/screenshots/`

## ⚙️ Prerequisites

1. **Frontend server running**:
   ```bash
   cd frontend
   npm run dev
   # OR via Docker: docker compose up frontend
   ```

2. **Backend server running**:
   ```bash
   docker compose up backend
   ```

3. **Admin user exists**:
   - Username: `admin`
   - Password: `admin123`

## 💡 Quick Tips

**Debug a failing test:**
```bash
npx playwright test e2e/02-yukyu-main.spec.ts --debug
```

**Run specific test by name:**
```bash
npx playwright test -g "should navigate to yukyu"
```

**See what tests are available:**
```bash
npx playwright test --list
```

**Run tests in specific browser:**
```bash
npx playwright test --project=chromium
npx playwright test --project=firefox
npx playwright test --project=webkit
```

## 🐛 Common Issues

**Port already in use:**
- Make sure frontend is running on port 3000
- Check: `http://localhost:3000`

**Login fails:**
- Verify admin user exists in database
- Check backend logs: `docker compose logs backend`

**Tests timeout:**
- Wait for services to fully start
- Check Docker services: `docker compose ps`

## 📚 More Info

See `README.md` in this directory for full documentation.

---

**Quick Reference:**
- Run tests: `npm run test:e2e:yukyu`
- Debug: `npm run test:e2e:debug`
- View report: `npm run test:e2e:report`
- UI mode: `npm run test:e2e:ui`
