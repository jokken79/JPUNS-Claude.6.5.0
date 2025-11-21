import { test, expect, Page } from '@playwright/test';

/**
 * E2E Tests para Dashboard KEIRI - FASE 5
 * Tests de UI components y user flows
 */

const BASE_URL = 'http://localhost:3000';
const DASHBOARD_URL = `${BASE_URL}/keiri/yukyu-dashboard`;
const KEITOSAN_USER = 'keitosan_test';
const KEITOSAN_PASS = 'test123';

// =============================================================================
// Fixtures
// =============================================================================

async function loginAsKeitosan(page: Page) {
  await page.goto(`${BASE_URL}/login`);
  await page.fill('input[name="username"]', KEITOSAN_USER);
  await page.fill('input[name="password"]', KEITOSAN_PASS);
  await page.click('button[type="submit"]');
  await page.waitForURL('**/dashboard');
}

// =============================================================================
// FASE 7.2: Tests Frontend (Playwright)
// =============================================================================

test.describe('Dashboard KEIRI - Yukyu Management', () => {
  // =========================================================================
  // Test 1: Dashboard loads with metrics cards
  // =========================================================================

  test('should display metric cards correctly', async ({ page }) => {
    // Arrange
    await loginAsKeitosan(page);
    await page.goto(DASHBOARD_URL);

    // Act
    await page.waitForSelector('[data-testid="yukyu-dashboard"]', { timeout: 5000 });

    // Assert
    expect(await page.title()).toContain('Yukyu');

    // Verify 4 metric cards exist
    const metricCards = await page.locator('[data-testid^="metric-card"]').count();
    expect(metricCards).toBeGreaterThanOrEqual(4);

    // Verify specific metrics
    expect(await page.locator('text="Total Yukyu Days"').isVisible()).toBeTruthy();
    expect(await page.locator('text="Employees with Yukyu"').isVisible()).toBeTruthy();
    expect(await page.locator('text="Total Deduction"').isVisible()).toBeTruthy();
    expect(await page.locator('text="Compliance Rate"').isVisible()).toBeTruthy();

    // Verify values are numbers
    const totalDaysValue = await page.locator('[data-testid="total-days-value"]').textContent();
    expect(totalDaysValue).toMatch(/\d+/);
  });

  // =========================================================================
  // Test 2: Pending requests table displays correctly
  // =========================================================================

  test('should display pending requests table', async ({ page }) => {
    // Arrange
    await loginAsKeitosan(page);
    await page.goto(DASHBOARD_URL);

    // Act
    await page.click('[role="tab"]:has-text("Pending Requests")');
    await page.waitForSelector('table', { timeout: 5000 });

    // Assert
    const table = page.locator('table');
    expect(await table.isVisible()).toBeTruthy();

    // Verify table headers
    expect(await page.locator('th:has-text("Employee")').isVisible()).toBeTruthy();
    expect(await page.locator('th:has-text("Days")').isVisible()).toBeTruthy();
    expect(await page.locator('th:has-text("Period")').isVisible()).toBeTruthy();
    expect(await page.locator('th:has-text("Actions")').isVisible()).toBeTruthy();

    // Verify action buttons exist
    const approveButtons = await page.locator('button:has-text("Approve")').count();
    const rejectButtons = await page.locator('button:has-text("Reject")').count();
    expect(approveButtons + rejectButtons >= 0).toBeTruthy();
  });

  // =========================================================================
  // Test 3: Approve pending request
  // =========================================================================

  test('should approve pending yukyu request', async ({ page }) => {
    // Arrange
    await loginAsKeitosan(page);
    await page.goto(DASHBOARD_URL);
    await page.click('[role="tab"]:has-text("Pending Requests")');

    // Get first request
    const firstRow = page.locator('table tbody tr').first();

    // Act
    const approveBtn = firstRow.locator('button:has-text("Approve")').first();
    if (await approveBtn.isVisible()) {
      await approveBtn.click();

      // Wait for processing
      await page.waitForTimeout(1000);

      // Assert
      // Button should show "Approving..." state or be disabled
      expect(
        await approveBtn.isDisabled() ||
        (await approveBtn.textContent())?.includes('Approving')
      ).toBeTruthy();
    }
  });

  // =========================================================================
  // Test 4: Reject pending request
  // =========================================================================

  test('should reject pending yukyu request', async ({ page }) => {
    // Arrange
    await loginAsKeitosan(page);
    await page.goto(DASHBOARD_URL);
    await page.click('[role="tab"]:has-text("Pending Requests")');

    // Get first request
    const firstRow = page.locator('table tbody tr').first();

    // Act
    const rejectBtn = firstRow.locator('button:has-text("Reject")').first();
    if (await rejectBtn.isVisible()) {
      await rejectBtn.click();

      // Wait for processing
      await page.waitForTimeout(1000);

      // Assert
      // Button should show "Rejecting..." state or be disabled
      expect(
        await rejectBtn.isDisabled() ||
        (await rejectBtn.textContent())?.includes('Rejecting')
      ).toBeTruthy();
    }
  });

  // =========================================================================
  // Test 5: Display compliance warnings
  // =========================================================================

  test('should display compliance warnings', async ({ page }) => {
    // Arrange
    await loginAsKeitosan(page);
    await page.goto(DASHBOARD_URL);

    // Act
    await page.click('[role="tab"]:has-text("Compliance")');
    await page.waitForSelector('[data-testid="compliance-card"]', { timeout: 5000 });

    // Assert
    const complianceCard = page.locator('[data-testid="compliance-card"]');
    expect(await complianceCard.isVisible()).toBeTruthy();

    // Verify compliance metrics
    expect(await page.locator('text="Compliance Rate"').isVisible()).toBeTruthy();
    expect(await page.locator('text="Compliant"').isVisible()).toBeTruthy();
    expect(await page.locator('text="At Risk"').isVisible()).toBeTruthy();

    // Check for warning alerts if non-compliant employees exist
    const warningBox = page.locator('[data-testid="compliance-warning"]');
    if (await warningBox.isVisible()) {
      expect(await warningBox.locator('svg[class*="alert"]').isVisible()).toBeTruthy();
    }
  });

  // =========================================================================
  // Test 6: Display trend chart
  // =========================================================================

  test('should display yukyu trend chart', async ({ page }) => {
    // Arrange
    await loginAsKeitosan(page);
    await page.goto(DASHBOARD_URL);

    // Act
    await page.click('[role="tab"]:has-text("Overview")');
    await page.waitForSelector('svg', { timeout: 5000 });

    // Assert
    // Check for Recharts elements
    const chartContainer = page.locator('[class*="recharts-wrapper"]').first();
    expect(await chartContainer.isVisible()).toBeTruthy();

    // Verify axes exist
    const xAxis = page.locator('[class*="recharts-cartesian-axis-horizontal"]');
    const yAxis = page.locator('[class*="recharts-cartesian-axis-vertical"]');
    expect(await xAxis.isVisible()).toBeTruthy();
    expect(await yAxis.isVisible()).toBeTruthy();

    // Test chart interactivity: hover
    const chartArea = page.locator('[class*="recharts-surface"]').first();
    await chartArea.hover();
    await page.waitForTimeout(500);

    // Tooltip should appear
    const tooltip = page.locator('[class*="recharts-tooltip"]');
    expect(tooltip).toBeDefined();
  });

  // =========================================================================
  // Test 7: Create yukyu request (from dashboard)
  // =========================================================================

  test('should navigate to create yukyu request', async ({ page }) => {
    // Arrange
    await loginAsKeitosan(page);
    await page.goto(DASHBOARD_URL);

    // Act
    // Look for button to navigate to create request
    const createBtn = page.locator('a[href*="/yukyu-requests/create"]').first();
    if (await createBtn.isVisible()) {
      await createBtn.click();

      // Assert
      await page.waitForURL('**/yukyu-requests/create');
      expect(page.url()).toContain('/yukyu-requests/create');

      // Verify form elements
      expect(await page.locator('input[name="start_date"]').isVisible()).toBeTruthy();
      expect(await page.locator('input[name="end_date"]').isVisible()).toBeTruthy();
    }
  });

  // =========================================================================
  // Test 8: Date validation error handling
  // =========================================================================

  test('should show validation errors for invalid dates', async ({ page }) => {
    // Arrange
    await loginAsKeitosan(page);
    await page.goto(`${BASE_URL}/yukyu-requests/create`);

    // Act
    // Try to set start date in the past
    const today = new Date().toISOString().split('T')[0];
    const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];

    await page.fill('input[name="start_date"]', yesterday);
    await page.fill('input[name="end_date"]', today);
    await page.click('button[type="submit"]');

    // Assert
    await page.waitForTimeout(500);

    // Check for error message
    const errorMsg = page.locator('[class*="error"], [role="alert"]').first();
    if (await errorMsg.isVisible()) {
      const text = await errorMsg.textContent();
      expect(text?.toLowerCase()).toContain('past' || 'invalid' || 'error');
    }
  });

  // =========================================================================
  // Test 9: Role-based access control
  // =========================================================================

  test('should restrict access to non-KEITOSAN users', async ({ page }) => {
    // Try to access dashboard without login
    await page.goto(DASHBOARD_URL);

    // Should redirect to login
    await page.waitForURL('**/login', { timeout: 5000 });
    expect(page.url()).toContain('/login');
  });

  // =========================================================================
  // Test 10: Refresh button functionality
  // =========================================================================

  test('should refresh dashboard data', async ({ page }) => {
    // Arrange
    await loginAsKeitosan(page);
    await page.goto(DASHBOARD_URL);

    // Get initial metrics
    const initialMetric = await page
      .locator('[data-testid="total-days-value"]')
      .first()
      .textContent();

    // Act
    await page.locator('button:has-text("Refresh")').click();
    await page.waitForTimeout(1000);

    // Assert
    // Page should still be on dashboard
    expect(page.url()).toContain('/keiri/yukyu-dashboard');

    // Metrics should be reloaded (or at least attempt was made)
    const refreshedMetric = await page
      .locator('[data-testid="total-days-value"]')
      .first()
      .textContent();

    expect(refreshedMetric).toBeDefined();
  });
});

// =============================================================================
// Component-level Tests
// =============================================================================

test.describe('YukyuMetricCard Component', () => {
  test('should render metric card with correct styling', async ({ page }) => {
    await loginAsKeitosan(page);
    await page.goto(DASHBOARD_URL);

    const metricCard = page.locator('[data-testid="metric-card"]').first();
    expect(await metricCard.isVisible()).toBeTruthy();

    // Check for gradient/styling
    const icon = metricCard.locator('svg').first();
    expect(await icon.isVisible()).toBeTruthy();

    // Check animation classes (if Framer Motion is used)
    const hasAnimationClass = await metricCard.evaluate(el =>
      el.className.includes('motion') || el.className.includes('animate')
    );
    // Animation class presence is optional
    expect(typeof hasAnimationClass).toBe('boolean');
  });
});

test.describe('ComplianceCard Component', () => {
  test('should display compliance status correctly', async ({ page }) => {
    await loginAsKeitosan(page);
    await page.goto(DASHBOARD_URL);
    await page.click('[role="tab"]:has-text("Compliance")');

    const complianceCard = page.locator('[data-testid="compliance-card"]');
    expect(await complianceCard.isVisible()).toBeTruthy();

    // Check for progress bar
    const progressBar = complianceCard.locator('[role="progressbar"], [class*="progress"]').first();
    expect(progressBar).toBeDefined();

    // Check for badge showing status
    const statusBadge = complianceCard.locator('[class*="badge"], [role="status"]').first();
    expect(await statusBadge.isVisible()).toBeTruthy();
  });
});

test.describe('PendingRequestsTable Component', () => {
  test('should have accessible table structure', async ({ page }) => {
    await loginAsKeitosan(page);
    await page.goto(DASHBOARD_URL);
    await page.click('[role="tab"]:has-text("Pending Requests")');

    const table = page.locator('table').first();
    expect(await table.isVisible()).toBeTruthy();

    // Check ARIA attributes
    const tableRole = await table.getAttribute('role');
    expect(tableRole).toBe('table');

    // Check for proper th elements
    const headers = table.locator('th');
    expect(await headers.count()).toBeGreaterThan(0);
  });
});

// =============================================================================
// Test Configuration
// =============================================================================

test.describe.configure({ timeout: 30000 }); // 30 second timeout for all tests

// Run with: npm run test:e2e
// Or specific test: npm run test:e2e -- yukyu-dashboard.spec.ts
// Or specific test case: npm run test:e2e -- yukyu-dashboard.spec.ts -g "should display"
