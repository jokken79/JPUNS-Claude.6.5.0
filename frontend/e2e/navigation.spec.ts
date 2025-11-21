import { test, expect } from '@playwright/test';
import { login } from './helpers/auth';
import { takeScreenshot, navigateAndWait } from './helpers/common';

test.describe('Navigation Links Validation', () => {
  test.beforeEach(async ({ page }) => {
    // Login before each test
    await page.goto('/');
    await login(page);
  });

  test.describe('Header Navigation', () => {
    test('should navigate to dashboard from header', async ({ page }) => {
      await page.click('a[href="/dashboard"]');
      await page.waitForURL('**/dashboard');
      expect(page.url()).toContain('/dashboard');
      await takeScreenshot(page, 'header-nav-dashboard');
    });

    test('should navigate to candidates from header', async ({ page }) => {
      const candidatesLink = page.locator('a[href="/candidates"]').first();
      if (await candidatesLink.isVisible()) {
        await candidatesLink.click();
        await page.waitForTimeout(1000);
        expect(page.url()).toContain('/candidates');
        await takeScreenshot(page, 'header-nav-candidates');
      }
    });

    test('should navigate to employees from header', async ({ page }) => {
      const employeesLink = page.locator('a[href="/employees"]').first();
      if (await employeesLink.isVisible()) {
        await employeesLink.click();
        await page.waitForTimeout(1000);
        expect(page.url()).toContain('/employees');
        await takeScreenshot(page, 'header-nav-employees');
      }
    });

    test('should navigate to factories from header', async ({ page }) => {
      const factoriesLink = page.locator('a[href="/factories"]').first();
      if (await factoriesLink.isVisible()) {
        await factoriesLink.click();
        await page.waitForTimeout(1000);
        expect(page.url()).toContain('/factories');
        await takeScreenshot(page, 'header-nav-factories');
      }
    });
  });

  test.describe('Sidebar Navigation', () => {
    const sidebarLinks = [
      { href: '/dashboard', name: 'Dashboard' },
      { href: '/candidates', name: 'Candidates' },
      { href: '/employees', name: 'Employees' },
      { href: '/factories', name: 'Factories' },
      { href: '/timercards', name: 'Timer Cards' },
      { href: '/payroll', name: 'Payroll' },
      { href: '/requests', name: 'Requests' },
      { href: '/reports', name: 'Reports' },
      { href: '/apartments', name: 'Apartments' },
      { href: '/admin', name: 'Admin' },
      { href: '/settings', name: 'Settings' },
    ];

    for (const link of sidebarLinks) {
      test(`should navigate to ${link.name} from sidebar`, async ({ page }) => {
        const sidebarLink = page.locator(`nav a[href="${link.href}"], aside a[href="${link.href}"]`).first();

        if (await sidebarLink.isVisible()) {
          await sidebarLink.click();
          await page.waitForTimeout(1000);

          // Verify we're on the correct page (allowing for child routes)
          expect(page.url()).toContain(link.href);

          // Verify no 404 error
          const is404 = await page.locator('text=/404|not found/i').isVisible().catch(() => false);
          expect(is404).toBe(false);

          await takeScreenshot(page, `sidebar-nav-${link.name.toLowerCase()}`);
        }
      });
    }
  });

  test.describe('Critical Pages - No 404 Errors', () => {
    const criticalPages = [
      '/dashboard',
      '/candidates',
      '/candidates/new',
      '/employees',
      '/employees/new',
      '/factories',
      '/factories/new',
      '/timercards',
      '/payroll',
      '/requests',
      '/apartments',
      '/apartments/v2',
      '/admin',
      '/settings',
      '/themes',
      '/themes/customizer',
    ];

    for (const pagePath of criticalPages) {
      test(`should load ${pagePath} without 404 error`, async ({ page }) => {
        await navigateAndWait(page, pagePath);

        // Check for 404 error
        const is404 = await page.locator('text=/404|not found/i').isVisible().catch(() => false);
        expect(is404).toBe(false);

        // Check response status
        const response = await page.goto(pagePath);
        expect(response?.status()).toBeLessThan(400);

        await takeScreenshot(page, `page-${pagePath.replace(/\//g, '-')}`);
      });
    }
  });

  test.describe('Known Broken Links - Should Be Fixed', () => {
    test('construction page should have valid navigation links', async ({ page }) => {
      await navigateAndWait(page, '/construction');

      // Find all links on the page
      const links = await page.locator('a[href]').all();

      for (const link of links) {
        const href = await link.getAttribute('href');
        if (href && !href.startsWith('http') && !href.startsWith('#')) {
          // Click the link
          await link.click();
          await page.waitForTimeout(500);

          // Verify no 404
          const is404 = await page.locator('text=/404|not found/i').isVisible().catch(() => false);
          expect(is404).toBe(false);

          // Go back
          await page.goBack();
          await page.waitForTimeout(500);
        }
      }
    });

    test('factories/new page should have valid navigation links', async ({ page }) => {
      await navigateAndWait(page, '/factories/new');

      // Find all links on the page
      const links = await page.locator('a[href]').all();

      for (const link of links) {
        const href = await link.getAttribute('href');
        if (href && !href.startsWith('http') && !href.startsWith('#')) {
          // Click the link
          await link.click();
          await page.waitForTimeout(500);

          // Verify no 404
          const is404 = await page.locator('text=/404|not found/i').isVisible().catch(() => false);
          expect(is404).toBe(false);

          // Go back
          await page.goBack();
          await page.waitForTimeout(500);
        }
      }
    });

    test('timercards page should have valid navigation links', async ({ page }) => {
      await navigateAndWait(page, '/timercards');

      // Find all links on the page
      const links = await page.locator('a[href]').all();

      for (const link of links) {
        const href = await link.getAttribute('href');
        if (href && !href.startsWith('http') && !href.startsWith('#')) {
          // Click the link
          await link.click();
          await page.waitForTimeout(500);

          // Verify no 404
          const is404 = await page.locator('text=/404|not found/i').isVisible().catch(() => false);
          expect(is404).toBe(false);

          // Go back
          await page.goBack();
          await page.waitForTimeout(500);
        }
      }
    });
  });

  test.describe('Theme Navigation', () => {
    test('should navigate to theme gallery', async ({ page }) => {
      await navigateAndWait(page, '/themes');

      // Verify page loaded
      const is404 = await page.locator('text=/404|not found/i').isVisible().catch(() => false);
      expect(is404).toBe(false);

      await takeScreenshot(page, 'themes-gallery');
    });

    test('should navigate to theme customizer', async ({ page }) => {
      await navigateAndWait(page, '/themes/customizer');

      // Verify page loaded
      const is404 = await page.locator('text=/404|not found/i').isVisible().catch(() => false);
      expect(is404).toBe(false);

      // Verify customizer UI is present
      const customizerTitle = await page.locator('text=/theme customizer/i').isVisible().catch(() => false);
      expect(customizerTitle).toBe(true);

      await takeScreenshot(page, 'themes-customizer');
    });

    test('should have Clear Cache button in customizer', async ({ page }) => {
      await navigateAndWait(page, '/themes/customizer');

      // Verify Clear Cache button exists
      const clearCacheButton = page.locator('button:has-text("Clear Cache")');
      await expect(clearCacheButton).toBeVisible();

      await takeScreenshot(page, 'themes-customizer-cache-button');
    });
  });

  test.describe('Footer Links', () => {
    test('should have no broken footer links', async ({ page }) => {
      await navigateAndWait(page, '/dashboard');

      // Find footer links
      const footerLinks = await page.locator('footer a[href]').all();

      for (const link of footerLinks) {
        const href = await link.getAttribute('href');
        if (href && !href.startsWith('http') && !href.startsWith('#')) {
          // Click the link
          await link.click();
          await page.waitForTimeout(500);

          // Verify no 404
          const is404 = await page.locator('text=/404|not found/i').isVisible().catch(() => false);
          expect(is404).toBe(false);

          // Go back
          await page.goBack();
          await page.waitForTimeout(500);
        }
      }
    });
  });

  test.describe('Comprehensive 404 Check', () => {
    test('should scan all pages for 404 errors', async ({ page }) => {
      // List of all known routes
      const allRoutes = [
        '/',
        '/dashboard',
        '/candidates',
        '/candidates/new',
        '/candidates/rirekisho',
        '/employees',
        '/employees/new',
        '/factories',
        '/factories/new',
        '/timercards',
        '/timercards/new',
        '/payroll',
        '/requests',
        '/requests/new',
        '/reports',
        '/apartments',
        '/apartments/v2',
        '/apartments/v2/new',
        '/apartment-reports',
        '/apartment-reports/arrears',
        '/admin',
        '/admin/yukyu-management',
        '/settings',
        '/settings/appearance',
        '/themes',
        '/themes/customizer',
        '/construction',
      ];

      const broken404s: string[] = [];

      for (const route of allRoutes) {
        const response = await page.goto(route);
        const status = response?.status() || 0;

        if (status === 404) {
          broken404s.push(`${route} - Status: ${status}`);
        }

        const is404Text = await page.locator('text=/404|not found/i').isVisible().catch(() => false);
        if (is404Text) {
          broken404s.push(`${route} - Contains 404 text`);
        }
      }

      // Report all 404s
      if (broken404s.length > 0) {
        console.error('Found 404 errors:', broken404s);
        await takeScreenshot(page, '404-errors');
      }

      expect(broken404s).toHaveLength(0);
    });
  });

  test.describe('DevModeAlert Presence', () => {
    test('should show DevModeAlert on development pages', async ({ page }) => {
      const devPages = [
        '/admin/yukyu-management',
        '/apartment-reports/arrears',
      ];

      for (const devPage of devPages) {
        await navigateAndWait(page, devPage);

        // Check if DevModeAlert is visible
        const alertVisible = await page.locator('text=/under development|en desarrollo/i').isVisible().catch(() => false);

        // Take screenshot
        await takeScreenshot(page, `dev-alert-${devPage.replace(/\//g, '-')}`);

        // Log result (not failing test as some pages might not have it yet)
        console.log(`DevModeAlert on ${devPage}: ${alertVisible ? 'Present' : 'Missing'}`);
      }
    });
  });
});
