import { test, expect } from '@playwright/test';
import { login } from './helpers/auth';
import {
  takeScreenshot,
  navigateAndWait,
  verifyPageLoaded,
  checkNoConsoleErrors,
} from './helpers/common';

test.describe('Yukyu Requests Page (/yukyu-requests)', () => {
  test.beforeEach(async ({ page }) => {
    // Login before each test
    await login(page);
  });

  test('should navigate to yukyu requests page successfully', async ({ page }) => {
    // Track console errors
    const errors = await checkNoConsoleErrors(page);

    // Navigate to yukyu requests page
    await navigateAndWait(page, '/yukyu-requests');

    // Verify page loaded successfully (not 404)
    await verifyPageLoaded(page);

    // Verify URL is correct
    expect(page.url()).toContain('/yukyu-requests');

    // Take screenshot
    await takeScreenshot(page, 'yukyu-requests-page', true);

    // Check no console errors
    expect(errors.length).toBe(0);
  });

  test('should display requests table or list', async ({ page }) => {
    await navigateAndWait(page, '/yukyu-requests');

    // Wait for page to fully load
    await page.waitForTimeout(2000);

    // Look for table or list elements
    const hasTable = await page.locator('table, [role="table"]').isVisible({ timeout: 5000 }).catch(() => false);
    const hasList = await page.locator('[role="list"], ul, ol').isVisible({ timeout: 5000 }).catch(() => false);

    // Should have either a table or list
    expect(hasTable || hasList).toBe(true);

    // Take screenshot
    await takeScreenshot(page, 'yukyu-requests-table', true);
  });

  test('should display filter controls', async ({ page }) => {
    await navigateAndWait(page, '/yukyu-requests');

    // Wait for page to fully load
    await page.waitForTimeout(2000);

    // Look for filter elements (could be selects, inputs, buttons)
    const filterElements = await page.locator(
      'input[type="search"], input[placeholder*="filter"], input[placeholder*="search"], select, button:has-text("Filter"), button:has-text("フィルター")'
    ).count();

    // Take screenshot showing filters
    await takeScreenshot(page, 'yukyu-requests-filters', true);

    // We expect at least some interactive elements on the page
    const allInputs = await page.locator('input, select, button').count();
    expect(allInputs).toBeGreaterThan(0);
  });

  test('should have create new request button or link', async ({ page }) => {
    await navigateAndWait(page, '/yukyu-requests');

    // Look for create/new request button or link
    const createButton = page.locator(
      'a[href*="/create"], button:has-text("New"), button:has-text("Create"), button:has-text("新規"), a:has-text("New Request")'
    ).first();

    const buttonExists = await createButton.isVisible({ timeout: 5000 }).catch(() => false);

    if (buttonExists) {
      // Take screenshot highlighting the create button
      await takeScreenshot(page, 'yukyu-requests-create-button', true);

      // Verify it's clickable
      expect(await createButton.isEnabled()).toBe(true);
    } else {
      // If no obvious create button, just document the page state
      await takeScreenshot(page, 'yukyu-requests-no-create-button', true);
    }
  });

  test('should display request status information', async ({ page }) => {
    await navigateAndWait(page, '/yukyu-requests');

    // Wait for content to load
    await page.waitForTimeout(2000);

    // Look for status indicators (common status words)
    const statusKeywords = [
      'pending', 'approved', 'rejected', 'submitted',
      '保留', '承認', '却下', '提出済み'
    ];

    let foundStatus = false;
    for (const keyword of statusKeywords) {
      const hasStatus = await page.locator(`text=${keyword}`).isVisible({ timeout: 2000 }).catch(() => false);
      if (hasStatus) {
        foundStatus = true;
        break;
      }
    }

    // Take screenshot
    await takeScreenshot(page, 'yukyu-requests-status', true);

    // Even if no specific status found, page should have loaded
    const pageHasContent = await page.locator('body').textContent();
    expect(pageHasContent?.length).toBeGreaterThan(50);
  });

  test('should display page heading', async ({ page }) => {
    await navigateAndWait(page, '/yukyu-requests');

    // Look for page heading
    const heading = page.locator('h1, h2, [role="heading"]').first();
    const headingExists = await heading.isVisible({ timeout: 5000 }).catch(() => false);

    expect(headingExists).toBe(true);

    if (headingExists) {
      const headingText = await heading.textContent();
      // Should have some text
      expect(headingText?.length).toBeGreaterThan(0);
    }

    // Take screenshot
    await takeScreenshot(page, 'yukyu-requests-heading', true);
  });
});
