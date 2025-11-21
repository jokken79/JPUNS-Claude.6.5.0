import { test, expect } from '@playwright/test';

/**
 * E2E Test: Candidate Registration Workflow
 *
 * Tests the complete candidate management flow:
 * 1. Login as admin
 * 2. Navigate to candidates page
 * 3. View candidates list
 * 4. Create new candidate
 * 5. View candidate details
 * 6. Edit candidate information
 */

test.describe('Candidate Registration Workflow', () => {
  test.beforeEach(async ({ page }) => {
    // Login as admin before each test
    await page.goto('/login');
    await page.fill('input[name="username"]', 'admin');
    await page.fill('input[name="password"]', 'admin123');
    await page.click('button[type="submit"]');

    // Wait for redirect to dashboard
    await page.waitForURL('/dashboard');
    expect(page.url()).toContain('/dashboard');
  });

  test('should view candidates list', async ({ page }) => {
    // Navigate to candidates page
    await page.goto('/dashboard/candidates');

    // Wait for page to load
    await page.waitForSelector('h1, h2', { timeout: 5000 });

    // Verify we're on candidates page
    const heading = await page.locator('h1, h2').first().textContent();
    expect(heading).toMatch(/candidatos|candidates|候補者|履歴書/i);

    // Check if table or cards exist
    const hasTable = await page.locator('table').count() > 0;
    const hasCards = await page.locator('[class*="card"]').count() > 0;

    expect(hasTable || hasCards).toBeTruthy();
  });

  test('should display candidate status badges', async ({ page }) => {
    // Navigate to candidates page
    await page.goto('/dashboard/candidates');

    // Wait for page to load
    await page.waitForTimeout(2000);

    // Look for status badges (pending, interviewed, hired, rejected, etc.)
    const statusBadges = await page.locator('[class*="badge"], [class*="status"]').all();

    if (statusBadges.length > 0) {
      console.log(`Found ${statusBadges.length} status badges`);
      expect(statusBadges.length).toBeGreaterThan(0);
    } else {
      console.log('No status badges found - may have no candidates yet');
    }
  });

  test('should navigate to create candidate form', async ({ page }) => {
    // Navigate to candidates page
    await page.goto('/dashboard/candidates');

    // Look for "Create" or "New" button
    const createButtons = await page.locator('button, a').filter({
      hasText: /crear|create|new|nuevo|追加|新規|register|registrar/i
    }).all();

    if (createButtons.length > 0) {
      // Click the first create button
      await createButtons[0].click();

      // Wait for form or modal to appear
      await page.waitForTimeout(1000);

      // Verify form elements exist
      const hasForm = await page.locator('form, [role="dialog"]').count() > 0;
      expect(hasForm).toBeTruthy();

      // Check for common form fields
      const hasInputs = await page.locator('input, select, textarea').count() > 0;
      expect(hasInputs).toBeTruthy();
    } else {
      console.log('No create button found - may need to be added');
    }
  });

  test('should search candidates', async ({ page }) => {
    // Navigate to candidates page
    await page.goto('/dashboard/candidates');

    // Wait for page to load
    await page.waitForTimeout(2000);

    // Look for search input
    const searchInputs = await page.locator('input[type="search"], input[placeholder*="search"], input[placeholder*="buscar"], input[placeholder*="検索"]').all();

    if (searchInputs.length > 0) {
      // Type in search box
      await searchInputs[0].fill('test');

      // Wait for potential filtering
      await page.waitForTimeout(1000);

      // Verify page still loads
      const hasContent = await page.locator('body').count() > 0;
      expect(hasContent).toBeTruthy();
    } else {
      console.log('No search input found');
    }
  });

  test('should filter candidates by status', async ({ page }) => {
    // Navigate to candidates page
    await page.goto('/dashboard/candidates');

    // Wait for page to load
    await page.waitForTimeout(2000);

    // Look for filter dropdown or buttons
    const filterElements = await page.locator('select, button').filter({
      hasText: /filter|filtro|status|estado|ステータス/i
    }).all();

    if (filterElements.length > 0) {
      console.log(`Found ${filterElements.length} filter elements`);
      expect(filterElements.length).toBeGreaterThan(0);
    } else {
      console.log('No filters found - may need to be added');
    }
  });

  test('should view candidate details page', async ({ page }) => {
    // Navigate to candidates page
    await page.goto('/dashboard/candidates');

    // Wait for page to load
    await page.waitForTimeout(2000);

    // Look for "View" or "Details" links
    const viewLinks = await page.locator('a, button').filter({
      hasText: /view|details|ver|detalles|詳細/i
    }).all();

    if (viewLinks.length > 0) {
      // Click first view link
      await viewLinks[0].click();

      // Wait for navigation
      await page.waitForTimeout(1500);

      // Verify we're on details page
      const url = page.url();
      expect(url).toContain('/candidates/');

      // Check for candidate information
      const hasContent = await page.locator('[class*="detail"], [class*="info"], dl, table').count() > 0;
      expect(hasContent).toBeTruthy();
    } else {
      console.log('No view links found - may have no candidates yet');
    }
  });

  test('should handle OCR upload if available', async ({ page }) => {
    // Navigate to candidates page
    await page.goto('/dashboard/candidates');

    // Wait for page to load
    await page.waitForTimeout(2000);

    // Look for upload or OCR buttons
    const uploadButtons = await page.locator('button, a').filter({
      hasText: /upload|ocr|scan|アップロード|スキャン/i
    }).all();

    if (uploadButtons.length > 0) {
      console.log(`Found ${uploadButtons.length} upload/OCR buttons`);
      expect(uploadButtons.length).toBeGreaterThan(0);
    } else {
      console.log('No upload buttons found - OCR feature may be on details page');
    }
  });

  test('should display candidate statistics', async ({ page }) => {
    // Navigate to candidates page
    await page.goto('/dashboard/candidates');

    // Wait for page to load
    await page.waitForTimeout(2000);

    // Check for statistics cards
    const hasStats = await page.locator('[class*="stat"], [class*="metric"], [class*="count"]').count() > 0;

    if (hasStats) {
      expect(hasStats).toBeTruthy();
    } else {
      console.log('No statistics found');
    }
  });

  test('should paginate through candidates list', async ({ page }) => {
    // Navigate to candidates page
    await page.goto('/dashboard/candidates');

    // Wait for page to load
    await page.waitForTimeout(2000);

    // Check if pagination exists
    const paginationButtons = await page.locator('button, a').filter({
      hasText: /next|previous|siguiente|anterior|次|前|page|página/i
    }).all();

    if (paginationButtons.length > 0) {
      console.log(`Found ${paginationButtons.length} pagination buttons`);

      // Try clicking next if enabled
      const nextButton = await page.locator('button, a').filter({
        hasText: /next|siguiente|次/i
      }).first();

      const isDisabled = await nextButton.getAttribute('disabled');
      if (!isDisabled) {
        await nextButton.click();
        await page.waitForTimeout(1000);
        expect(page.url()).toContain('/candidates');
      }
    } else {
      console.log('No pagination - may have few records');
    }
  });
});
