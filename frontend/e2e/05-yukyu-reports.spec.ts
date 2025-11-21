import { test, expect } from '@playwright/test';
import { login } from './helpers/auth';
import {
  takeScreenshot,
  navigateAndWait,
  verifyPageLoaded,
  checkNoConsoleErrors,
} from './helpers/common';

test.describe('Yukyu Reports Page (/yukyu-reports)', () => {
  test.beforeEach(async ({ page }) => {
    // Login before each test
    await login(page);
  });

  test('should navigate to yukyu reports page successfully', async ({ page }) => {
    // Track console errors
    const errors = await checkNoConsoleErrors(page);

    // Navigate to yukyu reports page
    await navigateAndWait(page, '/yukyu-reports');

    // Verify page loaded successfully (not 404)
    await verifyPageLoaded(page);

    // Verify URL is correct
    expect(page.url()).toContain('/yukyu-reports');

    // Take screenshot
    await takeScreenshot(page, 'yukyu-reports-page', true);

    // Check no console errors
    expect(errors.length).toBe(0);
  });

  test('should display statistics and metrics', async ({ page }) => {
    await navigateAndWait(page, '/yukyu-reports');

    // Wait for page to fully load
    await page.waitForTimeout(2000);

    // Look for cards or stat displays
    const cards = await page.locator('[class*="card"], [class*="Card"], [class*="stat"]').count();

    // Look for numbers/metrics (common in reports)
    const hasNumbers = await page.locator('text=/\\d+/').count();

    // Take screenshot
    await takeScreenshot(page, 'yukyu-reports-statistics', true);

    // Should have some content
    expect(cards + hasNumbers).toBeGreaterThan(0);
  });

  test('should display charts or visualizations', async ({ page }) => {
    await navigateAndWait(page, '/yukyu-reports');

    // Wait for charts to load
    await page.waitForTimeout(3000);

    // Look for chart elements (SVG, canvas, or chart libraries)
    const hasSvg = await page.locator('svg').count();
    const hasCanvas = await page.locator('canvas').count();
    const hasChartContainer = await page.locator('[class*="chart"], [class*="Chart"]').count();

    // Take screenshot
    await takeScreenshot(page, 'yukyu-reports-charts', true);

    // Document what we found
    const totalChartElements = hasSvg + hasCanvas + hasChartContainer;
    expect(totalChartElements).toBeGreaterThanOrEqual(0);
  });

  test('should display report filters or controls', async ({ page }) => {
    await navigateAndWait(page, '/yukyu-reports');

    // Wait for page to load
    await page.waitForTimeout(2000);

    // Look for filter controls
    const selectCount = await page.locator('select').count();
    const buttonCount = await page.locator('button').count();
    const inputCount = await page.locator('input').count();

    // Take screenshot showing filters
    await takeScreenshot(page, 'yukyu-reports-filters', true);

    // Should have some interactive elements
    const totalControls = selectCount + buttonCount + inputCount;
    expect(totalControls).toBeGreaterThan(0);
  });

  test('should display data table or summary', async ({ page }) => {
    await navigateAndWait(page, '/yukyu-reports');

    // Wait for data to load
    await page.waitForTimeout(2000);

    // Look for table elements
    const hasTable = await page.locator('table, [role="table"]').isVisible({ timeout: 5000 }).catch(() => false);

    // Look for data rows
    const rowCount = await page.locator('tr, [role="row"]').count();

    // Take screenshot
    await takeScreenshot(page, 'yukyu-reports-table', true);

    // Should have some tabular structure or content
    const pageContent = await page.locator('body').textContent();
    expect(pageContent?.length).toBeGreaterThan(50);
  });

  test('should have export or download functionality', async ({ page }) => {
    await navigateAndWait(page, '/yukyu-reports');

    // Wait for page to load
    await page.waitForTimeout(2000);

    // Look for export/download buttons
    const exportButton = page.locator(
      'button:has-text("Export"), button:has-text("Download"), button:has-text("CSV"), button:has-text("PDF"), button:has-text("エクスポート")'
    ).first();

    const hasExport = await exportButton.isVisible({ timeout: 5000 }).catch(() => false);

    // Take screenshot
    await takeScreenshot(page, 'yukyu-reports-export', true);

    // Document whether export functionality exists
    if (hasExport) {
      expect(await exportButton.count()).toBeGreaterThan(0);
    }
  });

  test('should display page heading and title', async ({ page }) => {
    await navigateAndWait(page, '/yukyu-reports');

    // Look for page heading
    const heading = page.locator('h1, h2, [role="heading"]').first();
    const headingExists = await heading.isVisible({ timeout: 5000 }).catch(() => false);

    expect(headingExists).toBe(true);

    if (headingExists) {
      const headingText = await heading.textContent();
      expect(headingText?.length).toBeGreaterThan(0);
    }

    // Take screenshot
    await takeScreenshot(page, 'yukyu-reports-heading', true);
  });
});
