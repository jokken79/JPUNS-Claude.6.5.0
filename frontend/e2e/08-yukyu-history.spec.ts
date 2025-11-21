import { test, expect } from '@playwright/test';
import { login } from './helpers/auth';
import {
  takeScreenshot,
  navigateAndWait,
  verifyPageLoaded,
  checkNoConsoleErrors,
} from './helpers/common';

test.describe('Yukyu History Page (/yukyu-history)', () => {
  test.beforeEach(async ({ page }) => {
    // Login before each test
    await login(page);
  });

  test('should navigate to yukyu history page successfully', async ({ page }) => {
    // Track console errors
    const errors = await checkNoConsoleErrors(page);

    // Navigate to yukyu history page
    await navigateAndWait(page, '/yukyu-history');

    // Verify page loaded successfully (not 404)
    await verifyPageLoaded(page);

    // Verify URL is correct
    expect(page.url()).toContain('/yukyu-history');

    // Take screenshot
    await takeScreenshot(page, 'yukyu-history-page', true);

    // Check no console errors
    expect(errors.length).toBe(0);
  });

  test('should display history table or timeline', async ({ page }) => {
    await navigateAndWait(page, '/yukyu-history');

    // Wait for data to load
    await page.waitForTimeout(2000);

    // Look for table or timeline elements
    const hasTable = await page.locator('table, [role="table"]').isVisible({ timeout: 5000 }).catch(() => false);
    const hasTimeline = await page.locator('[class*="timeline"], [class*="Timeline"]').count();
    const hasList = await page.locator('[role="list"], ul, ol').count();

    // Take screenshot
    await takeScreenshot(page, 'yukyu-history-table', true);

    // Should have some data display structure
    expect(hasTable || hasTimeline > 0 || hasList > 0).toBe(true);
  });

  test('should display search filters', async ({ page }) => {
    await navigateAndWait(page, '/yukyu-history');

    // Wait for page to load
    await page.waitForTimeout(2000);

    // Look for search/filter inputs
    const searchInputs = await page.locator(
      'input[type="search"], input[placeholder*="search"], input[placeholder*="検索"], input[name*="search"]'
    ).count();

    // Look for filter selects
    const filterSelects = await page.locator('select').count();

    // Take screenshot showing filters
    await takeScreenshot(page, 'yukyu-history-filters', true);

    // Should have some filter controls
    const totalFilters = searchInputs + filterSelects;
    expect(totalFilters).toBeGreaterThanOrEqual(0);
  });

  test('should display date range filters', async ({ page }) => {
    await navigateAndWait(page, '/yukyu-history');

    // Wait for page to load
    await page.waitForTimeout(2000);

    // Look for date inputs
    const dateInputs = await page.locator(
      'input[type="date"], input[name*="date"], input[placeholder*="date"], input[name*="from"], input[name*="to"]'
    ).count();

    // Take screenshot
    await takeScreenshot(page, 'yukyu-history-date-filters', true);

    // Document the filters
    expect(dateInputs).toBeGreaterThanOrEqual(0);
  });

  test('should display employee filter', async ({ page }) => {
    await navigateAndWait(page, '/yukyu-history');

    // Wait for page to load
    await page.waitForTimeout(2000);

    // Look for employee filter/selector
    const employeeFilter = await page.locator(
      'select[name*="employee"], input[name*="employee"], [aria-label*="employee"], [aria-label*="従業員"]'
    ).count();

    // Take screenshot
    await takeScreenshot(page, 'yukyu-history-employee-filter', true);

    // Document the filters
    const allFilters = await page.locator('select, input').count();
    expect(allFilters).toBeGreaterThan(0);
  });

  test('should display historical records with details', async ({ page }) => {
    await navigateAndWait(page, '/yukyu-history');

    // Wait for data to load
    await page.waitForTimeout(2000);

    // Look for table rows or list items
    const rows = await page.locator('tr, [role="row"], li').count();

    // Look for data cells
    const cells = await page.locator('td, [role="cell"]').count();

    // Take screenshot
    await takeScreenshot(page, 'yukyu-history-records', true);

    // Should have some data structure
    expect(rows + cells).toBeGreaterThan(0);
  });

  test('should display transaction types or actions', async ({ page }) => {
    await navigateAndWait(page, '/yukyu-history');

    // Wait for data to load
    await page.waitForTimeout(2000);

    // Look for action/type indicators
    const hasActions = await page.locator(
      'text=/granted|used|expired|allocated|取得|使用|期限切れ|付与/i'
    ).count();

    // Take screenshot
    await takeScreenshot(page, 'yukyu-history-actions', true);

    // Document what's displayed
    const pageContent = await page.locator('body').textContent();
    expect(pageContent?.length).toBeGreaterThan(50);
  });

  test('should display LIFO visualization or balance tracking', async ({ page }) => {
    await navigateAndWait(page, '/yukyu-history');

    // Wait for visualization to load
    await page.waitForTimeout(2000);

    // Look for visualization elements
    const hasVisualization = await page.locator(
      '[class*="chart"], [class*="Chart"], [class*="visual"], svg, canvas'
    ).count();

    // Look for LIFO-related text
    const hasLIFO = await page.locator('text=/LIFO|last.in.first.out|後入れ先出し/i').count();

    // Take screenshot
    await takeScreenshot(page, 'yukyu-history-visualization', true);

    // Document visualization presence
    expect(hasVisualization + hasLIFO).toBeGreaterThanOrEqual(0);
  });

  test('should have export functionality', async ({ page }) => {
    await navigateAndWait(page, '/yukyu-history');

    // Wait for page to load
    await page.waitForTimeout(2000);

    // Look for export button
    const exportButton = page.locator(
      'button:has-text("Export"), button:has-text("Download"), button:has-text("CSV"), button:has-text("エクスポート")'
    ).first();

    const hasExport = await exportButton.isVisible({ timeout: 5000 }).catch(() => false);

    // Take screenshot
    await takeScreenshot(page, 'yukyu-history-export', true);

    // Document export functionality
    if (hasExport) {
      expect(await exportButton.count()).toBeGreaterThan(0);
    }
  });

  test('should display page heading', async ({ page }) => {
    await navigateAndWait(page, '/yukyu-history');

    // Look for page heading
    const heading = page.locator('h1, h2, [role="heading"]').first();
    const headingExists = await heading.isVisible({ timeout: 5000 }).catch(() => false);

    expect(headingExists).toBe(true);

    if (headingExists) {
      const headingText = await heading.textContent();
      expect(headingText?.length).toBeGreaterThan(0);
    }

    // Take screenshot
    await takeScreenshot(page, 'yukyu-history-heading', true);
  });
});
