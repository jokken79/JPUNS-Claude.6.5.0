const { chromium } = require('playwright');
const fs = require('fs');

(async () => {
  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext();
  const page = await context.newPage();

  // Collect all network requests
  const apiRequests = [];
  page.on('response', async (response) => {
    const url = response.url();
    if (url.includes('/api/')) {
      try {
        const body = await response.text();
        apiRequests.push({
          url,
          status: response.status(),
          body: body.substring(0, 10000) // First 10000 chars to see data
        });
      } catch (e) {
        apiRequests.push({
          url,
          status: response.status(),
          error: e.message
        });
      }
    }
  });

  // Collect console messages
  const consoleMessages = [];
  page.on('console', msg => {
    consoleMessages.push({
      type: msg.type(),
      text: msg.text()
    });
  });

  const results = {
    timestamp: new Date().toISOString(),
    login: {},
    candidates: {},
    employees: {}
  };

  console.log('========================================');
  console.log('PHOTO DIAGNOSIS TEST WITH LOGIN');
  console.log('========================================\n');

  // STEP 1: LOGIN
  console.log('🔐 Logging in as admin...');
  try {
    await page.goto('http://localhost:3000/login', { waitUntil: 'networkidle', timeout: 60000 });

    // Fill login form
    await page.fill('input[name="username"], input[type="text"]', 'admin');
    await page.fill('input[name="password"], input[type="password"]', 'admin123');

    // Click login button
    await page.click('button[type="submit"]');

    // Wait for redirect to dashboard
    await page.waitForURL('**/dashboard', { timeout: 10000 });

    console.log('  ✓ Login successful\n');
    results.login = { success: true };

  } catch (error) {
    console.log(`  ✗ Login failed: ${error.message}\n`);
    results.login = { error: error.message };
    await browser.close();
    return;
  }

  // Reset for candidates test
  apiRequests.length = 0;
  consoleMessages.length = 0;

  // TEST 1: CANDIDATES PAGE
  console.log('📋 Testing /candidates page...');
  try {
    await page.goto('http://localhost:3000/candidates', { waitUntil: 'networkidle', timeout: 60000 });

    // Wait a bit for any async operations
    await page.waitForTimeout(3000);

    // Take screenshot
    await page.screenshot({ path: 'D:\\UNS-ClaudeJP-5.4.1\\screenshot-candidates-auth.png', fullPage: true });

    // Check for photo elements
    const photoElements = await page.$$('img[alt*="photo"], img[alt*="Photo"], img[src*="data:image"]');
    const avatarIcons = await page.$$('svg[class*="lucide"]');

    // Get the first few rows' HTML to see photo rendering
    const tableRows = await page.$$('tbody tr');
    const firstRowsHTML = [];
    for (let i = 0; i < Math.min(3, tableRows.length); i++) {
      const rowHTML = await tableRows[i].evaluate(el => el.innerHTML);
      firstRowsHTML.push(rowHTML.substring(0, 1000)); // First 1000 chars
    }

    // Get actual API response for candidates
    const candidatesApiRequest = apiRequests.find(req =>
      req.url.includes('/api/candidates') &&
      !req.url.includes('/api/candidates/') &&
      req.status === 200
    );

    let apiData = 'No API response found';
    if (candidatesApiRequest) {
      try {
        const parsed = JSON.parse(candidatesApiRequest.body);
        // Get first 2 items with only relevant fields
        apiData = parsed.slice(0, 2).map(item => ({
          id: item.id,
          full_name_roman: item.full_name_roman,
          photo_url: item.photo_url ? item.photo_url.substring(0, 100) + '...' : null,
          photo_data_url: item.photo_data_url ? item.photo_data_url.substring(0, 100) + '...' : null
        }));
      } catch (e) {
        apiData = 'Error parsing API response: ' + e.message;
      }
    }

    results.candidates = {
      pageLoaded: true,
      photoImgElements: photoElements.length,
      svgAvatarIcons: avatarIcons.length,
      firstRowsHTML: firstRowsHTML,
      apiData: apiData,
      apiRequests: apiRequests.filter(req => req.url.includes('/candidates')).map(r => ({
        url: r.url,
        status: r.status
      })),
      consoleErrors: consoleMessages.filter(m => m.type === 'error' || m.type === 'warning')
    };

    console.log(`  ✓ Candidates page loaded`);
    console.log(`  ✓ Photo <img> elements found: ${photoElements.length}`);
    console.log(`  ✓ SVG avatar icons found: ${avatarIcons.length}`);
    console.log(`  ✓ Table rows found: ${tableRows.length}`);

  } catch (error) {
    results.candidates = { error: error.message };
    console.log(`  ✗ Error loading candidates page: ${error.message}`);
  }

  // Reset for employees test
  apiRequests.length = 0;
  consoleMessages.length = 0;

  // TEST 2: EMPLOYEES PAGE
  console.log('\n👥 Testing /employees page...');
  try {
    await page.goto('http://localhost:3000/employees', { waitUntil: 'networkidle', timeout: 60000 });

    // Wait a bit for any async operations
    await page.waitForTimeout(3000);

    // Take screenshot
    await page.screenshot({ path: 'D:\\UNS-ClaudeJP-5.4.1\\screenshot-employees-auth.png', fullPage: true });

    // Check for photo elements
    const photoElements = await page.$$('img[alt*="photo"], img[alt*="Photo"], img[src*="data:image"]');
    const avatarIcons = await page.$$('svg[class*="lucide"]');

    // Get the first few rows' HTML to see photo rendering
    const tableRows = await page.$$('tbody tr');
    const firstRowsHTML = [];
    for (let i = 0; i < Math.min(3, tableRows.length); i++) {
      const rowHTML = await tableRows[i].evaluate(el => el.innerHTML);
      firstRowsHTML.push(rowHTML.substring(0, 1000)); // First 1000 chars
    }

    // Get actual API response for employees
    const employeesApiRequest = apiRequests.find(req =>
      req.url.includes('/api/employees') &&
      !req.url.includes('/api/employees/') &&
      req.status === 200
    );

    let apiData = 'No API response found';
    if (employeesApiRequest) {
      try {
        const parsed = JSON.parse(employeesApiRequest.body);
        // Get first 2 items with only relevant fields
        apiData = parsed.slice(0, 2).map(item => ({
          id: item.id,
          full_name_roman: item.full_name_roman,
          photo_url: item.photo_url ? item.photo_url.substring(0, 100) + '...' : null,
          photo_data_url: item.photo_data_url ? item.photo_data_url.substring(0, 100) + '...' : null
        }));
      } catch (e) {
        apiData = 'Error parsing API response: ' + e.message;
      }
    }

    results.employees = {
      pageLoaded: true,
      photoImgElements: photoElements.length,
      svgAvatarIcons: avatarIcons.length,
      firstRowsHTML: firstRowsHTML,
      apiData: apiData,
      apiRequests: apiRequests.filter(req => req.url.includes('/employees')).map(r => ({
        url: r.url,
        status: r.status
      })),
      consoleErrors: consoleMessages.filter(m => m.type === 'error' || m.type === 'warning')
    };

    console.log(`  ✓ Employees page loaded`);
    console.log(`  ✓ Photo <img> elements found: ${photoElements.length}`);
    console.log(`  ✓ SVG avatar icons found: ${avatarIcons.length}`);
    console.log(`  ✓ Table rows found: ${tableRows.length}`);

  } catch (error) {
    results.employees = { error: error.message };
    console.log(`  ✗ Error loading employees page: ${error.message}`);
  }

  // Save detailed results
  fs.writeFileSync('D:\\UNS-ClaudeJP-5.4.1\\photo-diagnosis-authenticated.json', JSON.stringify(results, null, 2));

  console.log('\n========================================');
  console.log('DIAGNOSIS COMPLETE');
  console.log('========================================');
  console.log('\nResults saved to:');
  console.log('  - photo-diagnosis-authenticated.json');
  console.log('  - screenshot-candidates-auth.png');
  console.log('  - screenshot-employees-auth.png');

  // Keep browser open for 30 seconds to inspect
  console.log('\nBrowser will stay open for 30 seconds for manual inspection...');
  await page.waitForTimeout(30000);

  await browser.close();
})();
