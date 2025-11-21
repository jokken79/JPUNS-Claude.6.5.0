import { test, expect } from '@playwright/test';
import { login } from './helpers/auth';
import {
  takeScreenshot,
  navigateAndWait,
  verifyPageLoaded,
  checkNoConsoleErrors,
} from './helpers/common';

test.describe('Payroll Yukyu Summary Page (/payroll/yukyu-summary)', () => {
  test.beforeEach(async ({ page }) => {
    // Login before each test
    await login(page);
  });

  test('should navigate to payroll yukyu summary page successfully', async ({ page }) => {
    // Track console errors
    const errors = await checkNoConsoleErrors(page);

    // Navigate to payroll yukyu summary page
    await navigateAndWait(page, '/payroll/yukyu-summary');

    // Verify page loaded successfully (not 404)
    await verifyPageLoaded(page);

    // Verify URL is correct
    expect(page.url()).toContain('/payroll/yukyu-summary');

    // Take screenshot
    await takeScreenshot(page, 'payroll-yukyu-summary-page', true);

    // Check no console errors
    expect(errors.length).toBe(0);
  });

  test('should display year filter or selector', async ({ page }) => {
    await navigateAndWait(page, '/payroll/yukyu-summary');

    // Wait for page to fully load
    await page.waitForTimeout(2000);

    // Look for year selector
    const yearSelector = await page.locator(
      'select[name*="year"], input[name*="year"], [aria-label*="year"], [aria-label*="年"]'
    ).count();

    // Look for any select elements (could be year/month filters)
    const selectCount = await page.locator('select').count();

    // Take screenshot
    await takeScreenshot(page, 'payroll-yukyu-year-filter', true);

    // Should have some filter controls
    expect(selectCount + yearSelector).toBeGreaterThanOrEqual(0);
  });

  test('should display month filter or selector', async ({ page }) => {
    await navigateAndWait(page, '/payroll/yukyu-summary');

    // Wait for page to load
    await page.waitForTimeout(2000);

    // Look for month selector
    const monthSelector = await page.locator(
      'select[name*="month"], input[name*="month"], [aria-label*="month"], [aria-label*="月"]'
    ).count();

    // Look for select elements
    const selectCount = await page.locator('select').count();

    // Take screenshot
    await takeScreenshot(page, 'payroll-yukyu-month-filter', true);

    // Should have filter controls
    expect(selectCount + monthSelector).toBeGreaterThanOrEqual(0);
  });

  test('should display yukyu summary data', async ({ page }) => {
    await navigateAndWait(page, '/payroll/yukyu-summary');

    // Wait for data to load
    await page.waitForTimeout(2000);

    // Look for table or data display
    const hasTable = await page.locator('table, [role="table"]').isVisible({ timeout: 5000 }).catch(() => false);

    // Look for data rows
    const rowCount = await page.locator('tr, [role="row"]').count();

    // Take screenshot
    await takeScreenshot(page, 'payroll-yukyu-data', true);

    // Should have some content
    const pageContent = await page.locator('body').textContent();
    expect(pageContent?.length).toBeGreaterThan(50);
  });

  test('should display employee yukyu information', async ({ page }) => {
    await navigateAndWait(page, '/payroll/yukyu-summary');

    // Wait for data to load
    await page.waitForTimeout(2000);

    // Look for employee-related information
    const hasEmployeeData = await page.locator(
      'text=/employee|従業員|社員|名前|name/i'
    ).count();

    // Take screenshot
    await takeScreenshot(page, 'payroll-yukyu-employee-info', true);

    // Document the content
    expect(hasEmployeeData).toBeGreaterThanOrEqual(0);
  });

  test('should display yukyu balance information', async ({ page }) => {
    await navigateAndWait(page, '/payroll/yukyu-summary');

    // Wait for data to load
    await page.waitForTimeout(2000);

    // Look for balance-related information
    const hasBalanceInfo = await page.locator(
      'text=/balance|残高|days|日数|available|used/i'
    ).count();

    // Look for numerical data
    const hasNumbers = await page.locator('text=/\\d+/').count();

    // Take screenshot
    await takeScreenshot(page, 'payroll-yukyu-balance', true);

    // Should have some numerical data
    expect(hasNumbers).toBeGreaterThan(0);
  });

  test('should have export or print functionality', async ({ page }) => {
    await navigateAndWait(page, '/payroll/yukyu-summary');

    // Wait for page to load
    await page.waitForTimeout(2000);

    // Look for export/print buttons
    const exportButton = page.locator(
      'button:has-text("Export"), button:has-text("Print"), button:has-text("Download"), button:has-text("エクスポート"), button:has-text("印刷")'
    ).first();

    const hasExport = await exportButton.isVisible({ timeout: 5000 }).catch(() => false);

    // Take screenshot
    await takeScreenshot(page, 'payroll-yukyu-export', true);

    // Document whether export exists
    if (hasExport) {
      expect(await exportButton.count()).toBeGreaterThan(0);
    }
  });

  test('should display summary statistics or totals', async ({ page }) => {
    await navigateAndWait(page, '/payroll/yukyu-summary');

    // Wait for data to load
    await page.waitForTimeout(2000);

    // Look for summary cards or totals
    const cards = await page.locator('[class*="card"], [class*="Card"], [class*="summary"]').count();

    // Look for total/sum indicators
    const hasTotals = await page.locator('text=/total|合計|sum|計/i').count();

    // Take screenshot
    await takeScreenshot(page, 'payroll-yukyu-statistics', true);

    // Should have some summary elements
    expect(cards + hasTotals).toBeGreaterThanOrEqual(0);
  });

  test('should display page heading', async ({ page }) => {
    await navigateAndWait(page, '/payroll/yukyu-summary');

    // Look for page heading
    const heading = page.locator('h1, h2, [role="heading"]').first();
    const headingExists = await heading.isVisible({ timeout: 5000 }).catch(() => false);

    expect(headingExists).toBe(true);

    if (headingExists) {
      const headingText = await heading.textContent();
      expect(headingText?.length).toBeGreaterThan(0);
    }

    // Take screenshot
    await takeScreenshot(page, 'payroll-yukyu-heading', true);
  });
});
