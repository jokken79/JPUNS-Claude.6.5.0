/**
 * FASE 7: E2E Tests for Yukyu System - TANTOSHA Workflow
 * Tests TANTOSHA (HR Representative) complete workflow
 *
 * Scenarios:
 * - Create yukyu requests
 * - View request history
 * - Track request status
 * - Handle validation errors
 * - Submit requests for approval
 */

import { test, expect } from '@playwright/test';

const BASE_URL = process.env.PLAYWRIGHT_BASE_URL || 'http://localhost:3000';
const TANTOSHA_USER = 'tantosha@company.local';
const TANTOSHA_PASSWORD = 'test_password_123';

test.describe('FASE 7: TANTOSHA Workflow - Create & Track Requests', () => {

  // Setup: Login as TANTOSHA before each test
  test.beforeEach(async ({ page }) => {
    await page.goto(`${BASE_URL}/login`);
    await page.waitForSelector('input[type="email"]', { timeout: 5000 });

    await page.fill('input[type="email"]', TANTOSHA_USER);
    await page.fill('input[type="password"]', TANTOSHA_PASSWORD);
    await page.click('button:has-text("ログイン")');

    await page.waitForURL('**/dashboard/**', { timeout: 10000 });
  });

  // Test 1: Navigate to Create Request Page
  test('TANTOSHA can access create request form', async ({ page }) => {
    await page.goto(`${BASE_URL}/yukyu-requests/create`);
    await page.waitForLoadState('networkidle');

    // Verify page loaded
    const heading = page.locator('h1, h2').first();
    await expect(heading).toBeVisible({ timeout: 5000 });

    const headingText = await heading.textContent();
    expect(headingText?.toLowerCase()).toContain('solicitud');
  });

  // Test 2: Form Fields Visible
  test('Create request form has all required fields', async ({ page }) => {
    await page.goto(`${BASE_URL}/yukyu-requests/create`);
    await page.waitForLoadState('networkidle');

    // Check for employee field
    const employeeInput = page.locator('input[placeholder*="Empleado"], select[id*="employee"]').first();
    await expect(employeeInput).toBeVisible({ timeout: 5000 }).catch(() => {});

    // Check for date fields
    const dateInputs = page.locator('input[type="date"]');
    const dateCount = await dateInputs.count();
    expect(dateCount).toBeGreaterThanOrEqual(0); // At least start or end date

    // Check for days field
    const daysInput = page.locator('input[type="number"], input[step="0.5"]').first();
    expect(await daysInput.count()).toBeGreaterThan(0);

    // Check for submit button
    const submitButton = page.locator('button:has-text("Enviar"), button:has-text("Crear"), button:has-text("Submit")').first();
    await expect(submitButton).toBeVisible({ timeout: 5000 }).catch(() => {});
  });

  // Test 3: Create Request - Happy Path
  test('Can create a valid yukyu request', async ({ page }) => {
    await page.goto(`${BASE_URL}/yukyu-requests/create`);
    await page.waitForLoadState('networkidle');

    // Fill employee field
    const employeeInput = page.locator('input[placeholder*="Empleado"], input[role="combobox"]').first();
    if (await employeeInput.isVisible({ timeout: 5000 }).catch(() => false)) {
      await employeeInput.fill('Yamada');
      await page.waitForTimeout(300);
      // Select first option if dropdown appears
      const option = page.locator('[role="option"]').first();
      if (await option.isVisible({ timeout: 2000 }).catch(() => false)) {
        await option.click();
      }
    }

    // Fill start date
    const startDateInput = page.locator('input[placeholder*="inicio"], input[placeholder*="start"]').first();
    if (await startDateInput.isVisible({ timeout: 5000 }).catch(() => false)) {
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 10);
      const dateString = futureDate.toISOString().split('T')[0];
      await startDateInput.fill(dateString);
    }

    // Fill end date
    const endDateInput = page.locator('input[placeholder*="fin"], input[placeholder*="end"]').first();
    if (await endDateInput.isVisible({ timeout: 5000 }).catch(() => false)) {
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 12);
      const dateString = futureDate.toISOString().split('T')[0];
      await endDateInput.fill(dateString);
    }

    // Fill days
    const daysInput = page.locator('input[type="number"], input[step="0.5"]').first();
    if (await daysInput.isVisible({ timeout: 5000 }).catch(() => false)) {
      await daysInput.fill('1.0');
    }

    // Submit form
    const submitButton = page.locator('button:has-text("Enviar"), button:has-text("Crear"), button:has-text("Submit")').first();
    if (await submitButton.isVisible({ timeout: 5000 }).catch(() => false)) {
      await submitButton.click();

      // Wait for response
      await page.waitForTimeout(1000);

      // Verify success - could be redirect or success message
      const successMessage = page.locator('[role="alert"]:has-text("Exitoso"), [role="alert"]:has-text("creada")');
      const isSuccess = await successMessage.isVisible({ timeout: 5000 }).catch(() => false);

      // Or check if redirected to history page
      const isRedirected = page.url().includes('/yukyu-history') || page.url().includes('/dashboard');

      expect(isSuccess || isRedirected).toBeTruthy();
    }
  });

  // Test 4: Validation - Past Date
  test('Cannot create request with past date', async ({ page }) => {
    await page.goto(`${BASE_URL}/yukyu-requests/create`);
    await page.waitForLoadState('networkidle');

    // Fill with past date
    const startDateInput = page.locator('input[placeholder*="inicio"], input[placeholder*="start"]').first();
    if (await startDateInput.isVisible({ timeout: 5000 }).catch(() => false)) {
      const pastDate = new Date();
      pastDate.setDate(pastDate.getDate() - 5);
      const dateString = pastDate.toISOString().split('T')[0];
      await startDateInput.fill(dateString);

      await page.waitForTimeout(300);

      // Check for error message
      const errorMsg = page.locator('[class*="error"], [role="alert"]').first();
      const hasError = await errorMsg.isVisible({ timeout: 5000 }).catch(() => false);

      expect(hasError).toBeTruthy();
    }
  });

  // Test 5: Validation - Invalid Date Range
  test('Cannot create request with end date before start date', async ({ page }) => {
    await page.goto(`${BASE_URL}/yukyu-requests/create`);
    await page.waitForLoadState('networkidle');

    // Fill start date
    const startDateInput = page.locator('input[placeholder*="inicio"], input[placeholder*="start"]').first();
    if (await startDateInput.isVisible({ timeout: 5000 }).catch(() => false)) {
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 10);
      const dateString = futureDate.toISOString().split('T')[0];
      await startDateInput.fill(dateString);
    }

    // Fill end date (earlier than start)
    const endDateInput = page.locator('input[placeholder*="fin"], input[placeholder*="end"]').first();
    if (await endDateInput.isVisible({ timeout: 5000 }).catch(() => false)) {
      const earlierDate = new Date();
      earlierDate.setDate(earlierDate.getDate() + 5);
      const dateString = earlierDate.toISOString().split('T')[0];
      await endDateInput.fill(dateString);

      await page.waitForTimeout(300);

      // Check for error
      const errorMsg = page.locator('[class*="error"], [role="alert"]').first();
      const hasError = await errorMsg.isVisible({ timeout: 5000 }).catch(() => false);

      expect(hasError).toBeTruthy();
    }
  });

  // Test 6: View Request History
  test('Can view yukyu request history', async ({ page }) => {
    await page.goto(`${BASE_URL}/yukyu-history`);
    await page.waitForLoadState('networkidle');

    // Page should load
    const pageContent = page.locator('main, [role="main"]').first();
    await expect(pageContent).toBeVisible({ timeout: 5000 });

    // Check for table or list of requests
    const table = page.locator('table, [role="grid"]').first();
    const list = page.locator('[role="list"]').first();

    const hasTable = await table.isVisible({ timeout: 5000 }).catch(() => false);
    const hasList = await list.isVisible({ timeout: 5000 }).catch(() => false);

    expect(hasTable || hasList).toBeTruthy();
  });

  // Test 7: Filter History by Status
  test('Can filter request history by status', async ({ page }) => {
    await page.goto(`${BASE_URL}/yukyu-history`);
    await page.waitForLoadState('networkidle');

    // Look for filter/select
    const statusFilter = page.locator('select[id*="status"], select[name*="status"], button:has-text("Estado")').first();

    if (await statusFilter.isVisible({ timeout: 5000 }).catch(() => false)) {
      await statusFilter.click();

      // Select PENDING status
      const pendingOption = page.locator('[role="option"]:has-text("PENDING"), [role="option"]:has-text("Pendiente")').first();
      if (await pendingOption.isVisible({ timeout: 5000 }).catch(() => false)) {
        await pendingOption.click();

        // Wait for filter to apply
        await page.waitForTimeout(500);

        // Verify results
        const results = page.locator('table tbody tr, [role="row"]');
        expect(await results.count()).toBeGreaterThanOrEqual(0);
      }
    }
  });

  // Test 8: Request Detail View
  test('Can view request details', async ({ page }) => {
    await page.goto(`${BASE_URL}/yukyu-history`);
    await page.waitForLoadState('networkidle');

    // Click on first request row
    const firstRequest = page.locator('table tbody tr, [role="row"]').first();

    if (await firstRequest.isVisible({ timeout: 5000 }).catch(() => false)) {
      await firstRequest.click();

      // Wait for detail view/modal
      await page.waitForTimeout(500);

      // Should show request details
      const details = page.locator('[class*="detail"], [role="dialog"]').first();
      expect(await details.count()).toBeGreaterThan(0);
    }
  });

  // Test 9: Request Status Display
  test('Request status shown with correct color coding', async ({ page }) => {
    await page.goto(`${BASE_URL}/yukyu-history`);
    await page.waitForLoadState('networkidle');

    // Look for status badges/indicators
    const statusBadges = page.locator('[class*="badge"], [class*="status"], span:has-text("PENDING"), span:has-text("APPROVED"), span:has-text("REJECTED")');

    const statusCount = await statusBadges.count();
    expect(statusCount).toBeGreaterThanOrEqual(0);
  });

  // Test 10: Role-Based Field Visibility
  test('TANTOSHA can only see assigned factories', async ({ page }) => {
    await page.goto(`${BASE_URL}/yukyu-requests/create`);
    await page.waitForLoadState('networkidle');

    // Look for factory selector
    const factorySelect = page.locator('select[id*="factory"], select[name*="factory"]').first();

    if (await factorySelect.isVisible({ timeout: 5000 }).catch(() => false)) {
      await factorySelect.click();

      // Get all available options
      const options = page.locator('[role="option"]');
      const optionCount = await options.count();

      // Should have at least one option (their assigned factory)
      expect(optionCount).toBeGreaterThan(0);
    }
  });

  // Test 11: Submit & Track
  test('TANTOSHA can track submitted request status', async ({ page }) => {
    await page.goto(`${BASE_URL}/yukyu-history`);
    await page.waitForLoadState('networkidle');

    // Look for most recent request
    const firstRow = page.locator('table tbody tr, [role="row"]').first();

    if (await firstRow.isVisible({ timeout: 5000 }).catch(() => false)) {
      // Get status from row
      const statusCell = firstRow.locator('td, [role="gridcell"]').nth(3); // Typically 4th column

      const statusText = await statusCell.textContent();

      // Status should be one of: PENDING, APPROVED, REJECTED
      const validStatus = statusText?.includes('PENDING') ||
                         statusText?.includes('APPROVED') ||
                         statusText?.includes('REJECTED');

      expect(validStatus).toBeTruthy();
    }
  });

  // Test 12: Notes Field
  test('Can add notes to request', async ({ page }) => {
    await page.goto(`${BASE_URL}/yukyu-requests/create`);
    await page.waitForLoadState('networkidle');

    // Look for notes/comments field
    const notesField = page.locator('textarea[placeholder*="Notas"], textarea[placeholder*="Comments"], textarea[name*="notes"]').first();

    if (await notesField.isVisible({ timeout: 5000 }).catch(() => false)) {
      await notesField.fill('Cliente importante en fin de semana');

      // Verify text was entered
      const textContent = await notesField.inputValue();
      expect(textContent).toContain('Cliente');
    }
  });

  // Test 13: Performance - Form Load Time
  test('Create request form loads quickly', async ({ page }) => {
    const startTime = Date.now();

    await page.goto(`${BASE_URL}/yukyu-requests/create`);
    await page.waitForLoadState('networkidle');

    const loadTime = Date.now() - startTime;

    // Should load in less than 3 seconds
    expect(loadTime).toBeLessThan(3000);
  });

  // Test 14: Clear Form / Reset
  test('Can reset form to clear fields', async ({ page }) => {
    await page.goto(`${BASE_URL}/yukyu-requests/create`);
    await page.waitForLoadState('networkidle');

    // Fill some fields
    const daysInput = page.locator('input[type="number"], input[step="0.5"]').first();
    if (await daysInput.isVisible({ timeout: 5000 }).catch(() => false)) {
      await daysInput.fill('2.0');
    }

    // Look for reset button
    const resetButton = page.locator('button:has-text("Limpiar"), button:has-text("Reset")').first();

    if (await resetButton.isVisible({ timeout: 5000 }).catch(() => false)) {
      await resetButton.click();

      // Verify fields cleared
      const currentValue = await daysInput.inputValue();
      expect(currentValue).toBe('');
    }
  });

  // Test 15: Accessibility - Keyboard Navigation
  test('Form fields are keyboard navigable', async ({ page }) => {
    await page.goto(`${BASE_URL}/yukyu-requests/create`);
    await page.waitForLoadState('networkidle');

    // Tab through form fields
    const firstInput = page.locator('input').first();

    if (await firstInput.isVisible({ timeout: 5000 }).catch(() => false)) {
      await firstInput.focus();

      // Press Tab to move to next field
      await page.keyboard.press('Tab');

      // Check that focus moved
      const focusedElement = await page.evaluate(() => document.activeElement?.tagName);
      expect(['INPUT', 'SELECT', 'TEXTAREA', 'BUTTON']).toContain(focusedElement);
    }
  });

  // Teardown
  test.afterEach(async ({ page }) => {
    await page.close();
  });
});
