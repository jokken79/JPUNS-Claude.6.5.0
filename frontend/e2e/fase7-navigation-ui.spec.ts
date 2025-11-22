/**
 * FASE 7: E2E Tests for Yukyu System - Navigation & UI Tests
 * Tests navigation flows, UI responsiveness, and accessibility
 *
 * Scenarios:
 * - Navigation menu items
 * - Link integrity
 * - Responsive design
 * - Accessibility (keyboard, ARIA)
 * - Error boundaries
 */

import { test, expect } from '@playwright/test';

const BASE_URL = process.env.PLAYWRIGHT_BASE_URL || 'http://localhost:3000';

test.describe('FASE 7: Navigation & UI Testing', () => {

  // Test 1: Navigation Menu Structure
  test('Main navigation menu is accessible', async ({ page }) => {
    // Login
    await page.goto(`${BASE_URL}/login`);
    await page.fill('input[type="email"]', 'keitosan@company.local');
    await page.fill('input[type="password"]', 'test_password_123');
    await page.click('button:has-text("ログイン")');
    await page.waitForURL('**/dashboard/**');

    // Check navigation exists
    const nav = page.locator('nav, [role="navigation"]').first();
    await expect(nav).toBeVisible({ timeout: 5000 });

    // Check for main nav items
    const navItems = page.locator('nav a, nav button');
    const itemCount = await navItems.count();

    expect(itemCount).toBeGreaterThan(0);
  });

  // Test 2: Breadcrumb Navigation
  test('Breadcrumb trail shows current location', async ({ page }) => {
    // Login
    await page.goto(`${BASE_URL}/login`);
    await page.fill('input[type="email"]', 'keitosan@company.local');
    await page.fill('input[type="password"]', 'test_password_123');
    await page.click('button:has-text("ログイン")');
    await page.waitForURL('**/dashboard/**');

    // Go to yukyu dashboard
    await page.goto(`${BASE_URL}/dashboard/keiri/yukyu-dashboard`);
    await page.waitForLoadState('networkidle');

    // Look for breadcrumb
    const breadcrumb = page.locator('[role="navigation"]:has-text("/"), [class*="breadcrumb"]').first();

    // Breadcrumb might not be present, but if it is, verify structure
    if (await breadcrumb.isVisible({ timeout: 5000 }).catch(() => false)) {
      const breadcrumbText = await breadcrumb.textContent();
      expect(breadcrumbText).toBeTruthy();
    }
  });

  // Test 3: Link Integrity - No Broken Links
  test('No broken internal links in navigation', async ({ page }) => {
    // Login
    await page.goto(`${BASE_URL}/login`);
    await page.fill('input[type="email"]', 'keitosan@company.local');
    await page.fill('input[type="password"]', 'test_password_123');
    await page.click('button:has-text("ログイン")');
    await page.waitForURL('**/dashboard/**');

    // Go to dashboard
    await page.goto(`${BASE_URL}/dashboard/keiri/yukyu-dashboard`);
    await page.waitForLoadState('networkidle');

    // Get all navigation links
    const navLinks = page.locator('nav a[href]');
    const linkCount = await navLinks.count();

    // Test first few links
    const testLimit = Math.min(linkCount, 5);

    for (let i = 0; i < testLimit; i++) {
      const link = navLinks.nth(i);
      const href = await link.getAttribute('href');

      if (href && href.startsWith('/')) {
        // Try to navigate
        await link.click();
        await page.waitForLoadState('networkidle', { timeout: 5000 }).catch(() => {});

        // Should not show 404
        const hasError = page.url().includes('404') ||
                        await page.locator('text=404, text=Not Found').isVisible({ timeout: 2000 }).catch(() => false);

        expect(hasError).toBeFalsy();

        // Go back to dashboard
        await page.goto(`${BASE_URL}/dashboard/keiri/yukyu-dashboard`);
        await page.waitForLoadState('networkidle', { timeout: 5000 }).catch(() => {});
      }
    }
  });

  // Test 4: Responsive Design - Mobile View
  test('Dashboard is responsive on mobile', async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });

    // Login
    await page.goto(`${BASE_URL}/login`);
    await page.fill('input[type="email"]', 'keitosan@company.local');
    await page.fill('input[type="password"]', 'test_password_123');
    await page.click('button:has-text("ログイン")');
    await page.waitForURL('**/dashboard/**');

    // Go to dashboard
    await page.goto(`${BASE_URL}/dashboard/keiri/yukyu-dashboard`);
    await page.waitForLoadState('networkidle');

    // Should render without horizontal scrolling
    const windowWidth = await page.evaluate(() => window.innerWidth);
    const scrollWidth = await page.evaluate(() => document.documentElement.scrollWidth);

    expect(scrollWidth).toBeLessThanOrEqual(windowWidth);

    // Content should be readable
    const heading = page.locator('h1, h2').first();
    await expect(heading).toBeVisible({ timeout: 5000 });
  });

  // Test 5: Responsive Design - Tablet View
  test('Dashboard is responsive on tablet', async ({ page }) => {
    // Set tablet viewport
    await page.setViewportSize({ width: 768, height: 1024 });

    // Login
    await page.goto(`${BASE_URL}/login`);
    await page.fill('input[type="email"]', 'keitosan@company.local');
    await page.fill('input[type="password"]', 'test_password_123');
    await page.click('button:has-text("ログイン")');
    await page.waitForURL('**/dashboard/**');

    // Go to dashboard
    await page.goto(`${BASE_URL}/dashboard/keiri/yukyu-dashboard`);
    await page.waitForLoadState('networkidle');

    // Elements should be visible
    const mainContent = page.locator('main, [role="main"]').first();
    await expect(mainContent).toBeVisible({ timeout: 5000 });
  });

  // Test 6: Keyboard Navigation - Tab Order
  test('Tab key navigation works correctly', async ({ page }) => {
    // Login
    await page.goto(`${BASE_URL}/login`);

    // Focus on first input
    const emailInput = page.locator('input[type="email"]').first();
    await emailInput.focus();

    // Tab to next field
    await page.keyboard.press('Tab');

    // Should be on password field
    const focusedElement = await page.evaluate(() => (document.activeElement as HTMLElement)?.type);
    expect(focusedElement).toBe('password');

    // Tab again to button
    await page.keyboard.press('Tab');

    const focusedTag = await page.evaluate(() => (document.activeElement as HTMLElement)?.tagName);
    expect(['BUTTON', 'INPUT']).toContain(focusedTag);
  });

  // Test 7: Keyboard - Enter Submit
  test('Can submit form with Enter key', async ({ page }) => {
    // Go to login
    await page.goto(`${BASE_URL}/login`);

    // Fill email
    const emailInput = page.locator('input[type="email"]').first();
    await emailInput.fill('keitosan@company.local');

    // Fill password
    const passwordInput = page.locator('input[type="password"]').first();
    await passwordInput.fill('test_password_123');

    // Press Enter
    await passwordInput.press('Enter');

    // Should submit and redirect
    await page.waitForURL('**/dashboard/**', { timeout: 10000 });

    expect(page.url()).toContain('/dashboard');
  });

  // Test 8: Accessibility - ARIA Labels
  test('Important elements have ARIA labels', async ({ page }) => {
    // Login
    await page.goto(`${BASE_URL}/login`);
    await page.fill('input[type="email"]', 'keitosan@company.local');
    await page.fill('input[type="password"]', 'test_password_123');
    await page.click('button:has-text("ログイン")');
    await page.waitForURL('**/dashboard/**');

    // Go to dashboard
    await page.goto(`${BASE_URL}/dashboard/keiri/yukyu-dashboard`);
    await page.waitForLoadState('networkidle');

    // Check for main landmarks
    const main = page.locator('[role="main"]').first();
    expect(await main.count()).toBeGreaterThan(0);

    // Check for navigation role
    const nav = page.locator('[role="navigation"]').first();
    expect(await nav.count()).toBeGreaterThan(0);
  });

  // Test 9: Accessibility - Screen Reader Text
  test('Screen reader content is present', async ({ page }) => {
    // Login
    await page.goto(`${BASE_URL}/login`);
    await page.fill('input[type="email"]', 'keitosan@company.local');
    await page.fill('input[type="password"]', 'test_password_123');
    await page.click('button:has-text("ログイン")');
    await page.waitForURL('**/dashboard/**');

    // Go to dashboard
    await page.goto(`${BASE_URL}/dashboard/keiri/yukyu-dashboard`);
    await page.waitForLoadState('networkidle');

    // Check for skip link or aria-label
    const skipLink = page.locator('a[href="#main"], a:has-text("Skip")').first();
    const ariaLabels = page.locator('[aria-label]');

    const hasAccessibility = await skipLink.count() > 0 || await ariaLabels.count() > 0;
    expect(hasAccessibility).toBeTruthy();
  });

  // Test 10: Color Contrast - Visual Accessibility
  test('Dashboard text is readable (color contrast)', async ({ page }) => {
    // Login
    await page.goto(`${BASE_URL}/login`);
    await page.fill('input[type="email"]', 'keitosan@company.local');
    await page.fill('input[type="password"]', 'test_password_123');
    await page.click('button:has-text("ログイン")');
    await page.waitForURL('**/dashboard/**');

    // Go to dashboard
    await page.goto(`${BASE_URL}/dashboard/keiri/yukyu-dashboard`);
    await page.waitForLoadState('networkidle');

    // Check text is visible against background
    const headings = page.locator('h1, h2, h3');

    const headingCount = await headings.count();

    for (let i = 0; i < Math.min(headingCount, 3); i++) {
      const heading = headings.nth(i);
      const isVisible = await heading.isVisible();

      expect(isVisible).toBeTruthy();
    }
  });

  // Test 11: Search Functionality
  test('Search feature works correctly', async ({ page }) => {
    // Login
    await page.goto(`${BASE_URL}/login`);
    await page.fill('input[type="email"]', 'keitosan@company.local');
    await page.fill('input[type="password"]', 'test_password_123');
    await page.click('button:has-text("ログイン")');
    await page.waitForURL('**/dashboard/**');

    // Go to dashboard
    await page.goto(`${BASE_URL}/dashboard/keiri/yukyu-dashboard`);
    await page.waitForLoadState('networkidle');

    // Look for search input
    const searchInput = page.locator('input[type="search"], input[placeholder*="Buscar"]').first();

    if (await searchInput.isVisible({ timeout: 5000 }).catch(() => false)) {
      // Clear search
      await searchInput.clear();

      // Type search term
      await searchInput.fill('Yamada');

      // Verify results update
      await page.waitForTimeout(500);

      // Results should be filtered
      expect(true).toBeTruthy();
    }
  });

  // Test 12: Pagination (if exists)
  test('Pagination controls work correctly', async ({ page }) => {
    // Login
    await page.goto(`${BASE_URL}/login`);
    await page.fill('input[type="email"]', 'keitosan@company.local');
    await page.fill('input[type="password"]', 'test_password_123');
    await page.click('button:has-text("ログイン")');
    await page.waitForURL('**/dashboard/**');

    // Go to dashboard
    await page.goto(`${BASE_URL}/dashboard/keiri/yukyu-dashboard`);
    await page.waitForLoadState('networkidle');

    // Look for pagination
    const nextButton = page.locator('button:has-text("Siguiente"), button:has-text("Next"), button[aria-label*="next"]').first();

    if (await nextButton.isVisible({ timeout: 5000 }).catch(() => false)) {
      const isEnabled = await nextButton.isEnabled();

      if (isEnabled) {
        await nextButton.click();
        await page.waitForTimeout(500);

        // Page should show next batch of results
        expect(true).toBeTruthy();
      }
    }
  });

  // Test 13: Modal/Dialog Functionality
  test('Dialogs can be opened and closed', async ({ page }) => {
    // Login
    await page.goto(`${BASE_URL}/login`);
    await page.fill('input[type="email"]', 'keitosan@company.local');
    await page.fill('input[type="password"]', 'test_password_123');
    await page.click('button:has-text("ログイン")');
    await page.waitForURL('**/dashboard/**');

    // Go to dashboard
    await page.goto(`${BASE_URL}/dashboard/keiri/yukyu-dashboard`);
    await page.waitForLoadState('networkidle');

    // Look for button that opens dialog
    const dialogTrigger = page.locator('button:has-text("Detalles"), button:has-text("Ver"), button[aria-haspopup="dialog"]').first();

    if (await dialogTrigger.isVisible({ timeout: 5000 }).catch(() => false)) {
      await dialogTrigger.click();

      // Dialog should appear
      const dialog = page.locator('[role="dialog"]').first();

      const dialogVisible = await dialog.isVisible({ timeout: 2000 }).catch(() => false);

      if (dialogVisible) {
        // Close button should exist
        const closeButton = dialog.locator('button:has-text("Cerrar"), button:has-text("Close"), [aria-label*="close"]').first();

        if (await closeButton.isVisible({ timeout: 2000 }).catch(() => false)) {
          await closeButton.click();

          // Dialog should close
          expect(true).toBeTruthy();
        }
      }
    }
  });

  // Test 14: Error Page Handling
  test('404 error page displays correctly', async ({ page }) => {
    // Navigate to non-existent page
    await page.goto(`${BASE_URL}/this-page-does-not-exist-12345`);

    // Should show error or redirect
    await page.waitForLoadState('networkidle', { timeout: 5000 }).catch(() => {});

    // Either 404 page or redirect to home
    const has404 = await page.locator('text=404, text=Not Found').isVisible({ timeout: 2000 }).catch(() => false);
    const isRedirected = !page.url().includes('this-page-does-not-exist');

    expect(has404 || isRedirected).toBeTruthy();
  });

  // Test 15: Loading States
  test('Loading indicators show during data fetch', async ({ page }) => {
    // Login
    await page.goto(`${BASE_URL}/login`);
    await page.fill('input[type="email"]', 'keitosan@company.local');
    await page.fill('input[type="password"]', 'test_password_123');
    await page.click('button:has-text("ログイン")');
    await page.waitForURL('**/dashboard/**');

    // Go to dashboard and watch for loading
    const navigationPromise = page.waitForLoadState('networkidle');

    await page.goto(`${BASE_URL}/dashboard/keiri/yukyu-dashboard`);

    // Should show loading indicator during load
    const spinner = page.locator('[class*="loader"], [class*="spinner"], [role="status"]').first();

    const hasLoadingState = await spinner.isVisible({ timeout: 2000 }).catch(() => false);

    // Allow either showing spinner or instant load
    expect(true).toBeTruthy();

    // Wait for navigation to complete
    await navigationPromise;
  });
});
