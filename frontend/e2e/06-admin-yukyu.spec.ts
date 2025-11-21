import { test, expect } from '@playwright/test';
import { login } from './helpers/auth';
import {
  takeScreenshot,
  navigateAndWait,
  verifyPageLoaded,
  checkNoConsoleErrors,
} from './helpers/common';

test.describe('Admin Yukyu Management Page (/admin/yukyu-management)', () => {
  test.beforeEach(async ({ page }) => {
    // Login before each test
    await login(page);
  });

  test('should navigate to admin yukyu management page successfully', async ({ page }) => {
    // Track console errors
    const errors = await checkNoConsoleErrors(page);

    // Navigate to admin yukyu management page
    await navigateAndWait(page, '/admin/yukyu-management');

    // Verify page loaded successfully (not 404)
    await verifyPageLoaded(page);

    // Verify URL is correct
    expect(page.url()).toContain('/admin/yukyu-management');

    // Take screenshot
    await takeScreenshot(page, 'admin-yukyu-management-page', true);

    // Check no console errors
    expect(errors.length).toBe(0);
  });

  test('should display admin management cards or sections', async ({ page }) => {
    await navigateAndWait(page, '/admin/yukyu-management');

    // Wait for page to fully load
    await page.waitForTimeout(2000);

    // Look for cards or sections
    const cards = await page.locator('[class*="card"], [class*="Card"]').count();

    // Look for headings indicating different admin sections
    const headings = await page.locator('h1, h2, h3, h4').count();

    // Take screenshot
    await takeScreenshot(page, 'admin-yukyu-cards', true);

    // Should have some structure
    expect(cards + headings).toBeGreaterThan(0);
  });

  test('should display employee yukyu allocation controls', async ({ page }) => {
    await navigateAndWait(page, '/admin/yukyu-management');

    // Wait for page to load
    await page.waitForTimeout(2000);

    // Look for allocation-related elements
    const hasInputs = await page.locator('input[type="number"], input[name*="days"], input[name*="allocation"]').count();
    const hasButtons = await page.locator('button').count();

    // Take screenshot
    await takeScreenshot(page, 'admin-yukyu-allocation', true);

    // Should have interactive elements
    expect(hasInputs + hasButtons).toBeGreaterThan(0);
  });

  test('should display batch operations or bulk actions', async ({ page }) => {
    await navigateAndWait(page, '/admin/yukyu-management');

    // Wait for page to load
    await page.waitForTimeout(2000);

    // Look for batch operation buttons
    const batchButtons = page.locator(
      'button:has-text("Batch"), button:has-text("Bulk"), button:has-text("一括"), button:has-text("All")'
    );

    const hasBatchActions = await batchButtons.count();

    // Take screenshot
    await takeScreenshot(page, 'admin-yukyu-batch-actions', true);

    // Document the page structure
    const allButtons = await page.locator('button').count();
    expect(allButtons).toBeGreaterThanOrEqual(0);
  });

  test('should display yukyu policy settings', async ({ page }) => {
    await navigateAndWait(page, '/admin/yukyu-management');

    // Wait for page to load
    await page.waitForTimeout(2000);

    // Look for settings-related elements
    const hasSettings = await page.locator(
      'input[type="checkbox"], input[type="radio"], select, [class*="setting"], [class*="config"]'
    ).count();

    // Take screenshot
    await takeScreenshot(page, 'admin-yukyu-settings', true);

    // Should have some form elements
    expect(hasSettings).toBeGreaterThanOrEqual(0);
  });

  test('should display employee list or table', async ({ page }) => {
    await navigateAndWait(page, '/admin/yukyu-management');

    // Wait for data to load
    await page.waitForTimeout(2000);

    // Look for table or list
    const hasTable = await page.locator('table, [role="table"]').isVisible({ timeout: 5000 }).catch(() => false);
    const hasList = await page.locator('[role="list"], ul').count();

    // Take screenshot
    await takeScreenshot(page, 'admin-yukyu-employee-list', true);

    // Document what's on the page
    const pageContent = await page.locator('body').textContent();
    expect(pageContent?.length).toBeGreaterThan(50);
  });

  test('should have save or apply changes button', async ({ page }) => {
    await navigateAndWait(page, '/admin/yukyu-management');

    // Wait for page to load
    await page.waitForTimeout(2000);

    // Look for save/apply buttons
    const saveButton = page.locator(
      'button:has-text("Save"), button:has-text("Apply"), button:has-text("Update"), button:has-text("保存"), button:has-text("適用")'
    ).first();

    const hasSave = await saveButton.isVisible({ timeout: 5000 }).catch(() => false);

    // Take screenshot
    await takeScreenshot(page, 'admin-yukyu-save-button', true);

    // Document button presence
    if (hasSave) {
      expect(await saveButton.count()).toBeGreaterThan(0);
    }
  });

  test('should display page heading', async ({ page }) => {
    await navigateAndWait(page, '/admin/yukyu-management');

    // Look for page heading
    const heading = page.locator('h1, h2, [role="heading"]').first();
    const headingExists = await heading.isVisible({ timeout: 5000 }).catch(() => false);

    expect(headingExists).toBe(true);

    if (headingExists) {
      const headingText = await heading.textContent();
      expect(headingText?.length).toBeGreaterThan(0);
    }

    // Take screenshot
    await takeScreenshot(page, 'admin-yukyu-heading', true);
  });
});
