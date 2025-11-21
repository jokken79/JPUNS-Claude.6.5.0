import { test, expect } from '@playwright/test';
import { login } from './helpers/auth';
import { navigateAndWait, verifyPageLoaded, takeScreenshot } from './helpers/common';

/**
 * Master test suite for all Yukyu pages
 * This test runs through all yukyu pages to verify they load correctly
 */

test.describe('Yukyu System - Complete Flow', () => {
  const yukyuPages = [
    { url: '/yukyu', name: 'Yukyu Main' },
    { url: '/yukyu-requests', name: 'Yukyu Requests' },
    { url: '/yukyu-requests/create', name: 'Create Request' },
    { url: '/yukyu-reports', name: 'Yukyu Reports' },
    { url: '/admin/yukyu-management', name: 'Admin Yukyu' },
    { url: '/payroll/yukyu-summary', name: 'Payroll Yukyu' },
    { url: '/yukyu-history', name: 'Yukyu History' },
  ];

  test.beforeEach(async ({ page }) => {
    // Login before each test
    await login(page);
  });

  test('should load all yukyu pages without 404 errors', async ({ page }) => {
    const results: { url: string; name: string; status: 'PASS' | 'FAIL'; error?: string }[] = [];

    for (const pageInfo of yukyuPages) {
      try {
        // Navigate to page
        await navigateAndWait(page, pageInfo.url);

        // Verify page loaded (not 404)
        await verifyPageLoaded(page);

        // Take screenshot
        await takeScreenshot(page, `all-pages-${pageInfo.name.toLowerCase().replace(/\s+/g, '-')}`);

        results.push({ url: pageInfo.url, name: pageInfo.name, status: 'PASS' });
      } catch (error) {
        results.push({
          url: pageInfo.url,
          name: pageInfo.name,
          status: 'FAIL',
          error: error instanceof Error ? error.message : String(error),
        });
      }
    }

    // Log results
    console.log('\n=== YUKYU PAGES TEST RESULTS ===');
    results.forEach((result) => {
      const statusIcon = result.status === 'PASS' ? '✅' : '❌';
      console.log(`${statusIcon} ${result.name} (${result.url})`);
      if (result.error) {
        console.log(`   Error: ${result.error}`);
      }
    });
    console.log('================================\n');

    // Verify all passed
    const failedPages = results.filter((r) => r.status === 'FAIL');
    expect(failedPages.length).toBe(0);
  });

  test('should navigate between yukyu pages', async ({ page }) => {
    // Start from yukyu main page
    await navigateAndWait(page, '/yukyu');
    await takeScreenshot(page, 'navigation-step-1-yukyu-main');

    // Go to requests
    await navigateAndWait(page, '/yukyu-requests');
    await verifyPageLoaded(page);
    await takeScreenshot(page, 'navigation-step-2-requests');

    // Go to create request
    await navigateAndWait(page, '/yukyu-requests/create');
    await verifyPageLoaded(page);
    await takeScreenshot(page, 'navigation-step-3-create');

    // Go to reports
    await navigateAndWait(page, '/yukyu-reports');
    await verifyPageLoaded(page);
    await takeScreenshot(page, 'navigation-step-4-reports');

    // Go to history
    await navigateAndWait(page, '/yukyu-history');
    await verifyPageLoaded(page);
    await takeScreenshot(page, 'navigation-step-5-history');

    // All pages loaded successfully
    expect(true).toBe(true);
  });

  test('should display consistent UI across yukyu pages', async ({ page }) => {
    for (const pageInfo of yukyuPages) {
      await navigateAndWait(page, pageInfo.url);

      // Check for common UI elements
      const hasHeading = await page.locator('h1, h2, [role="heading"]').count();
      const hasBody = await page.locator('body').textContent();

      expect(hasHeading).toBeGreaterThan(0);
      expect(hasBody?.length).toBeGreaterThan(50);
    }
  });
});
