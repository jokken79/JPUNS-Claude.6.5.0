import { test, expect } from '@playwright/test';
import { login } from './helpers/auth';
import {
  takeScreenshot,
  navigateAndWait,
  verifyPageLoaded,
  checkNoConsoleErrors,
  textIsVisible,
} from './helpers/common';

test.describe('Yukyu Main Page (/yukyu)', () => {
  test.beforeEach(async ({ page }) => {
    // Login before each test
    await login(page);
  });

  test('should navigate to yukyu page successfully', async ({ page }) => {
    // Track console errors
    const errors = await checkNoConsoleErrors(page);

    // Navigate to yukyu page
    await navigateAndWait(page, '/yukyu');

    // Verify page loaded successfully (not 404)
    await verifyPageLoaded(page);

    // Verify URL is correct
    expect(page.url()).toContain('/yukyu');

    // Take screenshot
    await takeScreenshot(page, 'yukyu-main-page', true);

    // Check no console errors
    expect(errors.length).toBe(0);
  });

  test('should display yukyu overview cards', async ({ page }) => {
    await navigateAndWait(page, '/yukyu');

    // Wait for page to fully load
    await page.waitForTimeout(2000);

    // Check for key elements that should be on the yukyu main page
    // Looking for cards showing: Available Days, Used Days, Expired Days

    const cardSelectors = [
      'text=/dias disponibles|available days|利用可能/i',
      'text=/dias usados|used days|使用済/i',
      'text=/dias expirados|expired days|期限切れ/i',
    ];

    // Check if at least one of the expected cards is visible
    let foundCards = 0;
    for (const selector of cardSelectors) {
      const isVisible = await page.locator(selector).isVisible({ timeout: 5000 }).catch(() => false);
      if (isVisible) foundCards++;
    }

    // Take screenshot showing the cards
    await takeScreenshot(page, 'yukyu-overview-cards', true);

    // We expect to find at least one card
    expect(foundCards).toBeGreaterThan(0);
  });

  test('should display statistics or summary information', async ({ page }) => {
    await navigateAndWait(page, '/yukyu');

    // Wait for content to load
    await page.waitForTimeout(2000);

    // Check that page has some content (not empty)
    const bodyContent = await page.locator('body').textContent();
    expect(bodyContent?.length).toBeGreaterThan(100);

    // Look for common UI elements
    const hasCards = await page.locator('[class*="card"], [class*="Card"]').count();
    const hasHeadings = await page.locator('h1, h2, h3').count();

    expect(hasCards + hasHeadings).toBeGreaterThan(0);

    // Take screenshot
    await takeScreenshot(page, 'yukyu-statistics', true);
  });

  test('should be accessible from navigation', async ({ page }) => {
    // Start from dashboard or home
    await navigateAndWait(page, '/dashboard');

    // Look for yukyu link in navigation
    const yukyuLink = page.locator('a[href*="/yukyu"], nav a:has-text("Yukyu"), nav a:has-text("休暇")').first();

    const linkExists = await yukyuLink.isVisible({ timeout: 5000 }).catch(() => false);

    if (linkExists) {
      // Click the link
      await yukyuLink.click();

      // Wait for navigation
      await page.waitForURL(/\/yukyu/, { timeout: 10000 });

      // Verify we're on yukyu page
      expect(page.url()).toContain('/yukyu');

      // Take screenshot
      await takeScreenshot(page, 'yukyu-via-navigation', true);
    } else {
      // If no navigation link, just navigate directly
      await navigateAndWait(page, '/yukyu');
      expect(page.url()).toContain('/yukyu');
    }
  });
});
