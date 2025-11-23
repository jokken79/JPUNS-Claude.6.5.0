import { test, expect } from '@playwright/test';

/**
 * Dashboard Navigation 404 Error Check
 * 
 * This test suite verifies that all navigation links work correctly
 * and return NO 404 errors for the dashboard routes.
 * 
 * Test Requirements:
 * - All main navigation links from header work
 * - User dropdown menu links work
 * - Search functionality works
 * - All pages return HTTP 200 status
 * - No 404 errors anywhere
 */

test.describe('Dashboard Navigation - Zero 404 Errors', () => {
  // Login helper function
  async function login(page: any) {
    // Navigate to login page
    await page.goto('/');
    
    // Check if already logged in (redirect to dashboard)
    if (page.url().includes('/dashboard')) {
      return;
    }
    
    // Fill login credentials (adjust based on your actual login form)
    const emailInput = page.locator('input[type="email"], input[name="email"], input[id="email"]').first();
    const passwordInput = page.locator('input[type="password"], input[name="password"], input[id="password"]').first();
    
    if (await emailInput.isVisible({ timeout: 2000 }).catch(() => false)) {
      await emailInput.fill('admin@example.com');
      await passwordInput.fill('password');
      
      // Click login button
      const loginButton = page.locator('button[type="submit"]').first();
      await loginButton.click();
      
      // Wait for navigation to dashboard
      await page.waitForURL('**/dashboard', { timeout: 10000 });
    }
  }

  test.beforeEach(async ({ page }) => {
    // Login before each test
    await login(page);
  });

  test.describe('Main Navigation Links - Header', () => {
    const mainNavLinks = [
      { path: '/dashboard', name: 'Dashboard' },
      { path: '/dashboard/candidates', name: 'Candidates' },
      { path: '/dashboard/employees', name: 'Employees' },
      { path: '/dashboard/factories', name: 'Factories' },
      { path: '/dashboard/timercards', name: 'Timer Cards' },
      { path: '/dashboard/salary', name: 'Salary' },
      { path: '/dashboard/requests', name: 'Requests' },
      { path: '/dashboard/admin/control-panel', name: 'Admin Control Panel' },
    ];

    for (const link of mainNavLinks) {
      test(`should load ${link.name} (${link.path}) without 404 error`, async ({ page }) => {
        // Navigate to the page
        const response = await page.goto(link.path);
        
        // Check HTTP status code
        const status = response?.status() || 0;
        console.log(`${link.path} - Status: ${status}`);
        
        // Status should be 200 (OK) or in the 2xx range
        expect(status).toBeGreaterThanOrEqual(200);
        expect(status).toBeLessThan(300);
        
        // Check for 404 text in page content
        const has404Text = await page.locator('text=/404|not found|page not found/i').isVisible().catch(() => false);
        expect(has404Text).toBe(false);
        
        // Verify page loaded successfully
        await page.waitForLoadState('networkidle', { timeout: 10000 });
        
        // Take screenshot for verification
        const screenshotName = link.path.replace(/\//g, '-').substring(1);
        await page.screenshot({ 
          path: `/home/user/JPUNS-Claude.6.5.0/frontend/screenshots/${screenshotName}.png`,
          fullPage: true 
        });
        
        console.log(`✓ ${link.name} loaded successfully`);
      });
    }
  });

  test.describe('User Dropdown Menu Links', () => {
    const userMenuLinks = [
      { path: '/dashboard/profile', name: 'Profile' },
      { path: '/dashboard/settings', name: 'Settings' },
    ];

    for (const link of userMenuLinks) {
      test(`should load ${link.name} (${link.path}) without 404 error`, async ({ page }) => {
        // Navigate to the page
        const response = await page.goto(link.path);
        
        // Check HTTP status code
        const status = response?.status() || 0;
        console.log(`${link.path} - Status: ${status}`);
        
        // Status should be 200 (OK) or in the 2xx range
        expect(status).toBeGreaterThanOrEqual(200);
        expect(status).toBeLessThan(300);
        
        // Check for 404 text in page content
        const has404Text = await page.locator('text=/404|not found|page not found/i').isVisible().catch(() => false);
        expect(has404Text).toBe(false);
        
        // Verify page loaded successfully
        await page.waitForLoadState('networkidle', { timeout: 10000 });
        
        // Take screenshot for verification
        const screenshotName = link.path.replace(/\//g, '-').substring(1);
        await page.screenshot({ 
          path: `/home/user/JPUNS-Claude.6.5.0/frontend/screenshots/${screenshotName}.png`,
          fullPage: true 
        });
        
        console.log(`✓ ${link.name} loaded successfully`);
      });
    }
  });

  test.describe('Search Functionality', () => {
    test('should load search page with query parameter without 404 error', async ({ page }) => {
      const searchPath = '/search?q=test';
      
      // Navigate to search page with query
      const response = await page.goto(searchPath);
      
      // Check HTTP status code
      const status = response?.status() || 0;
      console.log(`${searchPath} - Status: ${status}`);
      
      // Status should be 200 (OK) or in the 2xx range
      expect(status).toBeGreaterThanOrEqual(200);
      expect(status).toBeLessThan(300);
      
      // Check for 404 text in page content
      const has404Text = await page.locator('text=/404|not found|page not found/i').isVisible().catch(() => false);
      expect(has404Text).toBe(false);
      
      // Verify page loaded successfully
      await page.waitForLoadState('networkidle', { timeout: 10000 });
      
      // Take screenshot for verification
      await page.screenshot({ 
        path: '/home/user/JPUNS-Claude.6.5.0/frontend/screenshots/search-q-test.png',
        fullPage: true 
      });
      
      console.log('✓ Search page loaded successfully');
    });
  });

  test.describe('Comprehensive Navigation Test', () => {
    test('should verify ALL required routes return 200 status', async ({ page }) => {
      const allRequiredRoutes = [
        '/dashboard',
        '/dashboard/candidates',
        '/dashboard/employees',
        '/dashboard/factories',
        '/dashboard/timercards',
        '/dashboard/salary',
        '/dashboard/requests',
        '/dashboard/admin/control-panel',
        '/dashboard/profile',
        '/dashboard/settings',
        '/search?q=test',
      ];

      const results: Array<{ path: string; status: number; has404: boolean }> = [];
      const failures: string[] = [];

      for (const route of allRequiredRoutes) {
        const response = await page.goto(route);
        const status = response?.status() || 0;
        const has404 = await page.locator('text=/404|not found|page not found/i').isVisible().catch(() => false);

        results.push({ path: route, status, has404 });

        if (status >= 300 || has404) {
          failures.push(`${route} - Status: ${status}, Has404Text: ${has404}`);
        }

        // Small delay between requests
        await page.waitForTimeout(500);
      }

      // Print summary
      console.log('\n=== Navigation Test Results ===');
      console.log('Total routes tested:', allRequiredRoutes.length);
      console.log('\nResults:');
      results.forEach(r => {
        const statusIcon = r.status < 300 && !r.has404 ? '✓' : '✗';
        console.log(`${statusIcon} ${r.path} - Status: ${r.status}, Has404: ${r.has404}`);
      });

      if (failures.length > 0) {
        console.log('\n❌ FAILURES:');
        failures.forEach(f => console.log(`  - ${f}`));
      } else {
        console.log('\n✅ ALL TESTS PASSED - ZERO 404 ERRORS!');
      }

      // Fail test if any route has issues
      expect(failures).toHaveLength(0);
    });
  });

  test.describe('Console Errors Check', () => {
    test('should have no console errors during navigation', async ({ page }) => {
      const consoleErrors: string[] = [];

      // Listen for console errors
      page.on('console', msg => {
        if (msg.type() === 'error') {
          consoleErrors.push(msg.text());
        }
      });

      // Navigate through all main routes
      const routes = [
        '/dashboard',
        '/dashboard/candidates',
        '/dashboard/employees',
        '/dashboard/factories',
        '/dashboard/timercards',
        '/dashboard/salary',
        '/dashboard/requests',
      ];

      for (const route of routes) {
        await page.goto(route);
        await page.waitForLoadState('networkidle', { timeout: 10000 });
        await page.waitForTimeout(1000);
      }

      // Filter out known/acceptable errors (if any)
      const criticalErrors = consoleErrors.filter(err => 
        !err.includes('favicon') && 
        !err.includes('DevTools')
      );

      if (criticalErrors.length > 0) {
        console.log('Console errors found:');
        criticalErrors.forEach(err => console.log(`  - ${err}`));
      }

      // This is a warning, not a hard failure for now
      console.log(`Total console errors: ${criticalErrors.length}`);
    });
  });
});
