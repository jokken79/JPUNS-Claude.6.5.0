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
          body: body.substring(0, 5000) // First 5000 chars
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
    candidates: {},
    employees: {}
  };

  console.log('========================================');
  console.log('PHOTO DIAGNOSIS TEST - STARTING');
  console.log('========================================\n');

  // TEST 1: CANDIDATES PAGE
  console.log('📋 Testing /candidates page...');
  try {
    await page.goto('http://localhost:3000/candidates', { waitUntil: 'networkidle', timeout: 60000 });

    // Wait a bit for any async operations
    await page.waitForTimeout(3000);

    // Take screenshot
    await page.screenshot({ path: 'D:\\UNS-ClaudeJP-5.4.1\\screenshot-candidates.png', fullPage: true });

    // Check for photo elements
    const photoElements = await page.$$('img[alt*="photo"], img[alt*="Photo"], img[src*="data:image"]');
    const avatarIcons = await page.$$('svg');

    // Get the first row's photo cell HTML
    const firstPhotoCell = await page.$('td img, td svg');
    let photoCellHTML = 'Not found';
    if (firstPhotoCell) {
      const parent = await firstPhotoCell.evaluateHandle(el => el.closest('td'));
      photoCellHTML = await parent.evaluate(el => el.innerHTML);
    }

    // Get actual API response for candidates
    const candidatesApiResponse = apiRequests.find(req => req.url.includes('/api/candidates') && !req.url.includes('/api/candidates/'));

    results.candidates = {
      pageLoaded: true,
      photoImgElements: photoElements.length,
      svgElements: avatarIcons.length,
      firstPhotoCellHTML: photoCellHTML,
      apiResponse: candidatesApiResponse ? JSON.parse(candidatesApiResponse.body).slice(0, 2) : 'No API response found',
      consoleErrors: consoleMessages.filter(m => m.type === 'error' || m.type === 'warning')
    };

    console.log(`  ✓ Candidates page loaded`);
    console.log(`  ✓ Photo <img> elements found: ${photoElements.length}`);
    console.log(`  ✓ SVG elements found: ${avatarIcons.length}`);

  } catch (error) {
    results.candidates = { error: error.message };
    console.log(`  ✗ Error loading candidates page: ${error.message}`);
  }

  // Reset for next test
  apiRequests.length = 0;
  consoleMessages.length = 0;

  // TEST 2: EMPLOYEES PAGE
  console.log('\n👥 Testing /employees page...');
  try {
    await page.goto('http://localhost:3000/employees', { waitUntil: 'networkidle', timeout: 60000 });

    // Wait a bit for any async operations
    await page.waitForTimeout(3000);

    // Take screenshot
    await page.screenshot({ path: 'D:\\UNS-ClaudeJP-5.4.1\\screenshot-employees.png', fullPage: true });

    // Check for photo elements
    const photoElements = await page.$$('img[alt*="photo"], img[alt*="Photo"], img[src*="data:image"]');
    const avatarIcons = await page.$$('svg');

    // Get the first row's photo cell HTML
    const firstPhotoCell = await page.$('td img, td svg');
    let photoCellHTML = 'Not found';
    if (firstPhotoCell) {
      const parent = await firstPhotoCell.evaluateHandle(el => el.closest('td'));
      photoCellHTML = await parent.evaluate(el => el.innerHTML);
    }

    // Get actual API response for employees
    const employeesApiResponse = apiRequests.find(req => req.url.includes('/api/employees') && !req.url.includes('/api/employees/'));

    results.employees = {
      pageLoaded: true,
      photoImgElements: photoElements.length,
      svgElements: avatarIcons.length,
      firstPhotoCellHTML: photoCellHTML,
      apiResponse: employeesApiResponse ? JSON.parse(employeesApiResponse.body).slice(0, 2) : 'No API response found',
      consoleErrors: consoleMessages.filter(m => m.type === 'error' || m.type === 'warning')
    };

    console.log(`  ✓ Employees page loaded`);
    console.log(`  ✓ Photo <img> elements found: ${photoElements.length}`);
    console.log(`  ✓ SVG elements found: ${avatarIcons.length}`);

  } catch (error) {
    results.employees = { error: error.message };
    console.log(`  ✗ Error loading employees page: ${error.message}`);
  }

  // Save detailed results
  fs.writeFileSync('D:\\UNS-ClaudeJP-5.4.1\\photo-diagnosis-results.json', JSON.stringify(results, null, 2));

  console.log('\n========================================');
  console.log('DIAGNOSIS COMPLETE');
  console.log('========================================');
  console.log('\nResults saved to:');
  console.log('  - photo-diagnosis-results.json');
  console.log('  - screenshot-candidates.png');
  console.log('  - screenshot-employees.png');

  // Keep browser open for 30 seconds to inspect
  console.log('\nBrowser will stay open for 30 seconds for manual inspection...');
  await page.waitForTimeout(30000);

  await browser.close();
})();
