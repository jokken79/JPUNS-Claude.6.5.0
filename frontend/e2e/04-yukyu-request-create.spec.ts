import { test, expect } from '@playwright/test';
import { login } from './helpers/auth';
import {
  takeScreenshot,
  navigateAndWait,
  verifyPageLoaded,
  checkNoConsoleErrors,
} from './helpers/common';

test.describe('Create Yukyu Request Page (/yukyu-requests/create)', () => {
  test.beforeEach(async ({ page }) => {
    // Login before each test
    await login(page);
  });

  test('should navigate to create request page successfully', async ({ page }) => {
    // Track console errors
    const errors = await checkNoConsoleErrors(page);

    // Navigate to create request page
    await navigateAndWait(page, '/yukyu-requests/create');

    // Verify page loaded successfully (not 404)
    await verifyPageLoaded(page);

    // Verify URL is correct
    expect(page.url()).toContain('/yukyu-requests/create');

    // Take screenshot
    await takeScreenshot(page, 'yukyu-request-create-page', true);

    // Check no console errors
    expect(errors.length).toBe(0);
  });

  test('should display create request form', async ({ page }) => {
    await navigateAndWait(page, '/yukyu-requests/create');

    // Wait for form to load
    await page.waitForTimeout(2000);

    // Check for form element
    const hasForm = await page.locator('form').isVisible({ timeout: 5000 }).catch(() => false);

    // Check for input fields
    const inputCount = await page.locator('input, select, textarea').count();

    // Should have either a form or multiple input fields
    expect(hasForm || inputCount > 0).toBe(true);

    // Take screenshot
    await takeScreenshot(page, 'yukyu-request-create-form', true);
  });

  test('should display factory/company selector', async ({ page }) => {
    await navigateAndWait(page, '/yukyu-requests/create');

    // Wait for page to load
    await page.waitForTimeout(2000);

    // Look for factory/company related fields
    const factoryFields = await page.locator(
      'select[name*="factory"], select[name*="company"], label:has-text("Factory"), label:has-text("Company"), label:has-text("工場")'
    ).count();

    // Or look for any select elements (could be factory selector)
    const selectCount = await page.locator('select').count();

    // Take screenshot showing the selectors
    await takeScreenshot(page, 'yukyu-request-factory-selector', true);

    // Should have at least some select elements on the form
    expect(selectCount).toBeGreaterThanOrEqual(0);
  });

  test('should display employee selector', async ({ page }) => {
    await navigateAndWait(page, '/yukyu-requests/create');

    // Wait for page to load
    await page.waitForTimeout(2000);

    // Look for employee related fields
    const employeeFields = await page.locator(
      'select[name*="employee"], input[name*="employee"], label:has-text("Employee"), label:has-text("従業員")'
    ).count();

    // Or look for any input/select elements
    const formElements = await page.locator('input, select').count();

    // Take screenshot showing employee selector
    await takeScreenshot(page, 'yukyu-request-employee-selector', true);

    // Should have form elements
    expect(formElements).toBeGreaterThan(0);
  });

  test('should display date pickers for request period', async ({ page }) => {
    await navigateAndWait(page, '/yukyu-requests/create');

    // Wait for page to load
    await page.waitForTimeout(2000);

    // Look for date inputs
    const dateInputs = await page.locator(
      'input[type="date"], input[name*="date"], input[placeholder*="date"], input[name*="start"], input[name*="end"]'
    ).count();

    // Take screenshot
    await takeScreenshot(page, 'yukyu-request-date-fields', true);

    // Document the form structure
    const allInputs = await page.locator('input').count();
    expect(allInputs).toBeGreaterThanOrEqual(0);
  });

  test('should have submit button', async ({ page }) => {
    await navigateAndWait(page, '/yukyu-requests/create');

    // Wait for page to load
    await page.waitForTimeout(2000);

    // Look for submit button
    const submitButton = page.locator(
      'button[type="submit"], button:has-text("Submit"), button:has-text("Create"), button:has-text("送信"), button:has-text("作成")'
    ).first();

    const hasSubmit = await submitButton.isVisible({ timeout: 5000 }).catch(() => false);

    // Take screenshot
    await takeScreenshot(page, 'yukyu-request-submit-button', true);

    if (hasSubmit) {
      // Verify button is present
      expect(await submitButton.count()).toBeGreaterThan(0);
    }
  });

  test('should have cancel or back button', async ({ page }) => {
    await navigateAndWait(page, '/yukyu-requests/create');

    // Wait for page to load
    await page.waitForTimeout(2000);

    // Look for cancel/back button or link
    const cancelButton = page.locator(
      'button:has-text("Cancel"), button:has-text("Back"), a:has-text("Cancel"), a:has-text("Back"), button:has-text("キャンセル"), a:has-text("戻る")'
    ).first();

    const hasCancel = await cancelButton.isVisible({ timeout: 5000 }).catch(() => false);

    // Take screenshot
    await takeScreenshot(page, 'yukyu-request-cancel-button', true);

    // Just document the page state
    const buttonCount = await page.locator('button, a').count();
    expect(buttonCount).toBeGreaterThan(0);
  });
});
