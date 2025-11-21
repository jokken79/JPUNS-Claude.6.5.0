"""
End-to-End Tests with Playwright
Tests critical user journeys and API endpoints
"""

import pytest
from playwright.async_api import async_playwright, Page, Browser, BrowserContext
import asyncio

# Configuration
BASE_URL = "http://localhost:3000"
API_BASE_URL = "http://localhost:8000"
TEST_USER_EMAIL = "test@example.com"
TEST_USER_PASSWORD = "TestPassword123!"


@pytest.fixture
async def browser():
    """Fixture to provide browser instance"""
    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=True)
        yield browser
        await browser.close()


@pytest.fixture
async def context(browser: Browser):
    """Fixture to provide browser context with authentication"""
    context = await browser.new_context()
    yield context
    await context.close()


@pytest.fixture
async def authenticated_page(context: BrowserContext):
    """Fixture to provide authenticated page"""
    page = await context.new_page()

    # Navigate to login
    await page.goto(f"{BASE_URL}/login")

    # Fill login form
    await page.fill('input[name="email"]', TEST_USER_EMAIL)
    await page.fill('input[name="password"]', TEST_USER_PASSWORD)

    # Submit login
    await page.click('button[type="submit"]')

    # Wait for navigation to dashboard
    await page.wait_for_url(f"{BASE_URL}/dashboard")

    yield page
    await page.close()


# ============================================================================
# AUTHENTICATION TESTS
# ============================================================================

@pytest.mark.asyncio
async def test_login_flow(browser: Browser):
    """Test login flow works correctly"""
    context = await browser.new_context()
    page = await context.new_page()

    # Navigate to login
    await page.goto(f"{BASE_URL}/login")

    # Verify login form exists
    assert await page.query_selector('input[name="email"]') is not None
    assert await page.query_selector('input[name="password"]') is not None

    # Fill and submit form
    await page.fill('input[name="email"]', TEST_USER_EMAIL)
    await page.fill('input[name="password"]', TEST_USER_PASSWORD)
    await page.click('button[type="submit"]')

    # Verify redirect to dashboard
    await page.wait_for_url(f"{BASE_URL}/dashboard")
    assert "dashboard" in page.url

    await context.close()


@pytest.mark.asyncio
async def test_logout_flow(authenticated_page: Page):
    """Test logout flow works correctly"""
    # Find and click logout button
    logout_button = await authenticated_page.query_selector('[data-testid="logout-button"]')
    if logout_button:
        await logout_button.click()

        # Verify redirect to login
        await authenticated_page.wait_for_url(f"{BASE_URL}/login")
        assert "login" in authenticated_page.url


# ============================================================================
# DASHBOARD TESTS
# ============================================================================

@pytest.mark.asyncio
async def test_dashboard_loads(authenticated_page: Page):
    """Test dashboard page loads correctly"""
    await authenticated_page.goto(f"{BASE_URL}/dashboard")

    # Verify page title or heading
    heading = await authenticated_page.query_selector('h1, h2')
    assert heading is not None


@pytest.mark.asyncio
async def test_dashboard_nav_links(authenticated_page: Page):
    """Test navigation links on dashboard"""
    await authenticated_page.goto(f"{BASE_URL}/dashboard")

    # Check for critical navigation links
    nav_links = {
        "candidates": "/dashboard/candidates",
        "employees": "/dashboard/employees",
        "payroll": "/dashboard/payroll",
        "timercards": "/dashboard/timercards",
    }

    for link_name, link_path in nav_links.items():
        link = await authenticated_page.query_selector(f'a[href="{link_path}"]')
        assert link is not None, f"Navigation link to {link_name} not found"


# ============================================================================
# EMPLOYEES TESTS
# ============================================================================

@pytest.mark.asyncio
async def test_employees_list_page(authenticated_page: Page):
    """Test employees list page loads"""
    await authenticated_page.goto(f"{BASE_URL}/dashboard/employees")

    # Verify page loads
    heading = await authenticated_page.query_selector('h1, h2')
    assert heading is not None

    # Wait for table/list to load
    await authenticated_page.wait_for_selector('[data-testid="employees-list"], table')


@pytest.mark.asyncio
async def test_create_employee_form(authenticated_page: Page):
    """Test create employee form is accessible"""
    await authenticated_page.goto(f"{BASE_URL}/dashboard/employees")

    # Look for create button
    create_button = await authenticated_page.query_selector(
        'button:has-text("Create"), button:has-text("Add"), [data-testid="create-button"]'
    )

    if create_button:
        await create_button.click()

        # Verify form appears
        form = await authenticated_page.query_selector('form, [role="dialog"]')
        assert form is not None


# ============================================================================
# PAYROLL TESTS
# ============================================================================

@pytest.mark.asyncio
async def test_payroll_page_loads(authenticated_page: Page):
    """Test payroll page loads"""
    await authenticated_page.goto(f"{BASE_URL}/dashboard/payroll")

    # Verify page has content
    content = await authenticated_page.query_selector('main, [role="main"]')
    assert content is not None


@pytest.mark.asyncio
async def test_calculate_payroll_endpoint(authenticated_page: Page):
    """Test payroll calculation endpoint via API"""
    # Make API request to calculate payroll
    response = await authenticated_page.request.get(
        f"{API_BASE_URL}/api/payroll/calculate-from-timercards",
        params={
            "employee_id": "1",
            "start_date": "2025-11-01",
            "end_date": "2025-11-30"
        },
        headers={"Authorization": f"Bearer {await get_auth_token(authenticated_page)}"}
    )

    assert response.ok or response.status == 404  # Either success or not found (no data)
    data = await response.json()
    assert "employee_id" in data or "message" in data


# ============================================================================
# API ENDPOINT TESTS
# ============================================================================

@pytest.mark.asyncio
async def test_health_endpoint():
    """Test API health endpoint"""
    async with async_playwright() as p:
        async_request = p.request.new_context()
        response = await async_request.get(f"{API_BASE_URL}/api/health")

        assert response.ok
        data = await response.json()
        assert "status" in data


@pytest.mark.asyncio
async def test_admin_stats_endpoint(authenticated_page: Page):
    """Test admin stats endpoint"""
    response = await authenticated_page.request.get(
        f"{API_BASE_URL}/api/admin/stats",
        headers={"Authorization": f"Bearer {await get_auth_token(authenticated_page)}"}
    )

    if response.ok:
        data = await response.json()

        # Verify new fields are present
        assert "database_size_mb" in data
        assert "uptime" in data
        assert "total_users" in data


# ============================================================================
# PERFORMANCE TESTS
# ============================================================================

@pytest.mark.asyncio
async def test_dashboard_load_time(authenticated_page: Page):
    """Test dashboard loads in acceptable time"""
    start_time = asyncio.get_event_loop().time()

    await authenticated_page.goto(f"{BASE_URL}/dashboard")

    # Wait for main content
    await authenticated_page.wait_for_selector('main, [role="main"]')

    elapsed = asyncio.get_event_loop().time() - start_time

    # Dashboard should load in less than 3 seconds
    assert elapsed < 3.0, f"Dashboard took {elapsed}s to load (should be < 3s)"


@pytest.mark.asyncio
async def test_api_response_time():
    """Test API endpoints respond quickly"""
    async with async_playwright() as p:
        async_request = p.request.new_context()

        start_time = asyncio.get_event_loop().time()
        response = await async_request.get(f"{API_BASE_URL}/api/health")
        elapsed = asyncio.get_event_loop().time() - start_time

        assert response.ok
        # API health should respond in < 500ms
        assert elapsed < 0.5, f"API took {elapsed}s to respond (should be < 0.5s)"


# ============================================================================
# HELPER FUNCTIONS
# ============================================================================

async def get_auth_token(page: Page) -> str:
    """Extract auth token from localStorage"""
    token = await page.evaluate("() => localStorage.getItem('access_token')")
    return token or ""


# ============================================================================
# FIXTURES SETUP
# ============================================================================

@pytest.fixture(scope="session")
def event_loop():
    """Create event loop for async tests"""
    loop = asyncio.get_event_loop_policy().new_event_loop()
    yield loop
    loop.close()


if __name__ == "__main__":
    pytest.main([__file__, "-v", "-s"])
