import { Page } from '@playwright/test';

/**
 * Authentication helper for E2E tests
 */

export interface LoginCredentials {
  username: string;
  password: string;
}

export const DEFAULT_ADMIN_CREDENTIALS: LoginCredentials = {
  username: 'admin',
  password: 'admin123',
};

/**
 * Performs login with given credentials
 */
export async function login(
  page: Page,
  credentials: LoginCredentials = DEFAULT_ADMIN_CREDENTIALS
): Promise<void> {
  // Navigate to login page
  await page.goto('/');

  // Wait for login form to be visible
  await page.waitForSelector('input[name="username"], input[type="text"]', {
    state: 'visible',
    timeout: 10000,
  });

  // Fill in credentials
  const usernameInput = page.locator('input[name="username"], input[type="text"]').first();
  const passwordInput = page.locator('input[name="password"], input[type="password"]').first();

  await usernameInput.fill(credentials.username);
  await passwordInput.fill(credentials.password);

  // Submit the form
  const submitButton = page.locator('button[type="submit"]').first();
  await submitButton.click();

  // Wait for navigation to dashboard or main page
  await page.waitForURL(/\/(dashboard|yukyu|employees|candidates)/, {
    timeout: 15000,
  });

  // Additional wait for page to be fully loaded
  await page.waitForLoadState('networkidle', { timeout: 10000 });
}

/**
 * Performs logout
 */
export async function logout(page: Page): Promise<void> {
  // Look for logout button or user menu
  const logoutButton = page.locator('button:has-text("Logout"), button:has-text("ログアウト")');

  if (await logoutButton.isVisible({ timeout: 5000 })) {
    await logoutButton.click();
    await page.waitForURL('/', { timeout: 5000 });
  }
}

/**
 * Checks if user is logged in
 */
export async function isLoggedIn(page: Page): Promise<boolean> {
  try {
    // Check if we're not on the login page
    const currentUrl = page.url();
    if (currentUrl.includes('/login') || currentUrl === '/') {
      return false;
    }

    // Check for common authenticated UI elements
    const hasAuthUI = await page
      .locator('[data-testid="user-menu"], [aria-label="User menu"]')
      .isVisible({ timeout: 2000 })
      .catch(() => false);

    return hasAuthUI;
  } catch {
    return false;
  }
}
