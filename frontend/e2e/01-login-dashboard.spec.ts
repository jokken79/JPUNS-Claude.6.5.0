import { test, expect } from '@playwright/test';
import { login, logout } from './helpers/auth';
import {
  takeScreenshot,
  navigateAndWait,
  verifyPageLoaded,
  checkNoConsoleErrors,
} from './helpers/common';

test.describe('Login and Dashboard', () => {
  test.beforeEach(async ({ page }) => {
    // Start from the home page
    await page.goto('/');
  });

  test('should display login page', async ({ page }) => {
    // Verify login form is visible
    await expect(page.locator('input[name="username"], input[type="text"]')).toBeVisible();
    await expect(page.locator('input[name="password"], input[type="password"]')).toBeVisible();
    await expect(page.locator('button[type="submit"]')).toBeVisible();

    // Take screenshot
    await takeScreenshot(page, 'login-page');
  });

  test('should login successfully with admin credentials', async ({ page }) => {
    // Track console errors
    const errors = await checkNoConsoleErrors(page);

    // Perform login
    await login(page);

    // Verify we're redirected away from login
    const currentUrl = page.url();
    expect(currentUrl).not.toBe('http://localhost:3000/');
    expect(currentUrl).not.toContain('/login');

    // Verify page loaded successfully
    await verifyPageLoaded(page);

    // Take screenshot of logged-in state
    await takeScreenshot(page, 'after-login');

    // Check no console errors occurred
    expect(errors.length).toBe(0);
  });

  test('should access dashboard after login', async ({ page }) => {
    // Login first
    await login(page);

    // Try to navigate to dashboard if not already there
    if (!page.url().includes('/dashboard')) {
      await navigateAndWait(page, '/dashboard');
    }

    // Verify dashboard loaded
    await verifyPageLoaded(page);

    // Take screenshot
    await takeScreenshot(page, 'dashboard', true);
  });

  test('should reject invalid credentials', async ({ page }) => {
    // Fill in invalid credentials
    await page.locator('input[name="username"], input[type="text"]').first().fill('invalid');
    await page.locator('input[name="password"], input[type="password"]').first().fill('invalid');

    // Submit
    await page.locator('button[type="submit"]').first().click();

    // Wait a bit for error message
    await page.waitForTimeout(2000);

    // Should still be on login page or show error
    const currentUrl = page.url();
    const hasError = await page.locator('text=/error|invalid|incorrect/i').isVisible().catch(() => false);

    // Either still on login page or error is shown
    expect(currentUrl.includes('/login') || currentUrl === 'http://localhost:3000/' || hasError).toBe(true);

    // Take screenshot
    await takeScreenshot(page, 'invalid-login');
  });
});
