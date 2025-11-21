import { Page, expect } from '@playwright/test';

/**
 * Common helper functions for E2E tests
 */

/**
 * Takes a screenshot with a descriptive name
 */
export async function takeScreenshot(
  page: Page,
  name: string,
  fullPage = false
): Promise<void> {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const filename = `${name}-${timestamp}.png`;

  await page.screenshot({
    path: `screenshots/${filename}`,
    fullPage,
  });
}

/**
 * Waits for the page to be fully loaded
 */
export async function waitForPageLoad(page: Page): Promise<void> {
  await page.waitForLoadState('domcontentloaded');
  await page.waitForLoadState('networkidle', { timeout: 10000 });
}

/**
 * Navigates to a URL and waits for it to load
 */
export async function navigateAndWait(page: Page, url: string): Promise<void> {
  await page.goto(url);
  await waitForPageLoad(page);
}

/**
 * Checks if an element exists on the page
 */
export async function elementExists(
  page: Page,
  selector: string,
  timeout = 5000
): Promise<boolean> {
  try {
    await page.waitForSelector(selector, { state: 'attached', timeout });
    return true;
  } catch {
    return false;
  }
}

/**
 * Checks if text is visible on the page
 */
export async function textIsVisible(
  page: Page,
  text: string,
  timeout = 5000
): Promise<boolean> {
  try {
    await page.waitForSelector(`text=${text}`, { state: 'visible', timeout });
    return true;
  } catch {
    return false;
  }
}

/**
 * Verifies that a page title or heading contains expected text
 */
export async function verifyPageHeading(
  page: Page,
  expectedText: string | RegExp
): Promise<void> {
  const heading = page.locator('h1, h2, [role="heading"]').first();
  await expect(heading).toContainText(expectedText, { timeout: 10000 });
}

/**
 * Verifies no console errors on the page
 */
export async function checkNoConsoleErrors(page: Page): Promise<string[]> {
  const errors: string[] = [];

  page.on('console', (msg) => {
    if (msg.type() === 'error') {
      errors.push(msg.text());
    }
  });

  return errors;
}

/**
 * Verifies that a page has loaded successfully (not 404)
 */
export async function verifyPageLoaded(page: Page): Promise<void> {
  // Check that we're not on a 404 page
  const is404 = await page
    .locator('text=/404|not found/i')
    .isVisible({ timeout: 2000 })
    .catch(() => false);

  expect(is404).toBe(false);

  // Verify page has some content
  const body = page.locator('body');
  await expect(body).not.toBeEmpty();
}

/**
 * Waits for a specific element to appear
 */
export async function waitForElement(
  page: Page,
  selector: string,
  timeout = 10000
): Promise<void> {
  await page.waitForSelector(selector, { state: 'visible', timeout });
}

/**
 * Verifies that specific cards/sections exist on the page
 */
export async function verifyCardsExist(
  page: Page,
  cardTitles: string[]
): Promise<void> {
  for (const title of cardTitles) {
    const exists = await textIsVisible(page, title);
    expect(exists).toBe(true);
  }
}

/**
 * Fills a form field by label or placeholder
 */
export async function fillFormField(
  page: Page,
  labelOrPlaceholder: string,
  value: string
): Promise<void> {
  const field = page.locator(
    `input[placeholder*="${labelOrPlaceholder}"], input[aria-label*="${labelOrPlaceholder}"], label:has-text("${labelOrPlaceholder}") + input`
  ).first();

  await field.fill(value);
}

/**
 * Clicks a button by text
 */
export async function clickButton(page: Page, buttonText: string): Promise<void> {
  const button = page.locator(`button:has-text("${buttonText}")`).first();
  await button.click();
}
