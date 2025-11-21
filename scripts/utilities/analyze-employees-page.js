const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext();
  const page = await context.newPage();

  // Capture console messages
  const consoleMessages = [];
  page.on('console', msg => {
    consoleMessages.push({
      type: msg.type(),
      text: msg.text(),
      location: msg.location()
    });
  });

  // Capture page errors
  const pageErrors = [];
  page.on('pageerror', error => {
    pageErrors.push({
      message: error.message,
      stack: error.stack
    });
  });

  // Capture network errors
  const networkErrors = [];
  page.on('requestfailed', request => {
    networkErrors.push({
      url: request.url(),
      failure: request.failure()
    });
  });

  try {
    // Navigate to login page first
    console.log('Navigating to login page...');
    await page.goto('http://localhost:3000/login', { waitUntil: 'networkidle' });

    // Login
    console.log('Logging in...');
    await page.fill('input[name="username"], input[type="text"]', 'admin');
    await page.fill('input[name="password"], input[type="password"]', 'admin123');
    await page.click('button[type="submit"]');

    // Wait for navigation after login
    await page.waitForTimeout(2000);

    // Navigate to employees page
    console.log('Navigating to employees page...');
    await page.goto('http://localhost:3000/employees', { waitUntil: 'networkidle' });

    // Wait for page to fully load
    await page.waitForTimeout(3000);

    // Take screenshot
    console.log('Taking screenshot...');
    await page.screenshot({ path: 'D:\\UNS-ClaudeJP-5.4.1\\employees-page-screenshot.png', fullPage: true });

    // Get page title
    const title = await page.title();
    console.log('Page title:', title);

    // Check if photos are rendering
    const photoElements = await page.$$('img[alt]');
    console.log(`Found ${photoElements.length} image elements with alt text`);

    // Check for UserCircleIcon (placeholder icons)
    const placeholderIcons = await page.$$('svg.w-8.h-8.text-gray-400');
    console.log(`Found ${placeholderIcons.length} placeholder icons`);

    // Print all console messages
    console.log('\n=== CONSOLE MESSAGES ===');
    consoleMessages.forEach((msg, index) => {
      console.log(`${index + 1}. [${msg.type}] ${msg.text}`);
      if (msg.location) {
        console.log(`   Location: ${msg.location.url}:${msg.location.lineNumber}:${msg.location.columnNumber}`);
      }
    });

    // Print page errors
    console.log('\n=== PAGE ERRORS ===');
    if (pageErrors.length === 0) {
      console.log('No page errors found');
    } else {
      pageErrors.forEach((error, index) => {
        console.log(`${index + 1}. ${error.message}`);
        if (error.stack) {
          console.log(`   Stack: ${error.stack}`);
        }
      });
    }

    // Print network errors
    console.log('\n=== NETWORK ERRORS ===');
    if (networkErrors.length === 0) {
      console.log('No network errors found');
    } else {
      networkErrors.forEach((error, index) => {
        console.log(`${index + 1}. ${error.url}`);
        console.log(`   Failure: ${error.failure?.errorText || 'Unknown'}`);
      });
    }

    // Get specific error counts
    const errorMessages = consoleMessages.filter(m => m.type === 'error');
    const warningMessages = consoleMessages.filter(m => m.type === 'warning');

    console.log(`\n=== SUMMARY ===`);
    console.log(`Total console errors: ${errorMessages.length}`);
    console.log(`Total console warnings: ${warningMessages.length}`);
    console.log(`Total page errors: ${pageErrors.length}`);
    console.log(`Total network errors: ${networkErrors.length}`);
    console.log(`Screenshot saved to: employees-page-screenshot.png`);

  } catch (error) {
    console.error('Error during analysis:', error);
  } finally {
    await browser.close();
  }
})();
