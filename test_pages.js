const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();

  try {
    console.log('🔐 [1/3] Accessing login page...');
    await page.goto('http://localhost:3000/login', { waitUntil: 'domcontentloaded' });

    console.log('✓ Login page loaded');
    console.log('📝 [2/3] Logging in with admin/admin123...');

    await page.fill('input[name="username"]', 'admin');
    await page.fill('input[name="password"]', 'admin123');
    await page.click('button[type="submit"]');

    await page.waitForURL('**/dashboard', { timeout: 10000 });
    console.log('✓ Login successful, redirected to dashboard');

    console.log('\n📍 [3/3] Testing dashboard pages...\n');

    const pages = [
      '/dashboard',
      '/dashboard/candidates',
      '/dashboard/employees',
      '/dashboard/factories',
      '/dashboard/timercards',
      '/dashboard/payroll',
      '/dashboard/requests',
      '/dashboard/settings',
      '/dashboard/themes'
    ];

    let passCount = 0;
    let failCount = 0;

    for (const pagePath of pages) {
      try {
        console.log(`→ Testing ${pagePath}...`);
        await page.goto(`http://localhost:3000${pagePath}`, { waitUntil: 'networkidle', timeout: 8000 });

        // Check for error indicators
        const errorElements = await page.$$eval('[class*="error"], [class*="404"], [class*="not-found"]', els => els.length);
        const bodyText = await page.textContent('body');

        if (bodyText.includes('404') || bodyText.includes('not found') || errorElements > 0) {
          console.log(`  ❌ FAILED - Page not found or error detected`);
          failCount++;
        } else {
          console.log(`  ✅ SUCCESS - Page loaded correctly`);
          passCount++;
        }
      } catch (error) {
        console.log(`  ⚠️  TIMEOUT or ERROR - ${error.message.substring(0, 50)}`);
        failCount++;
      }
    }

    console.log(`\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
    console.log(`📊 TEST RESULTS: ${passCount} ✅  ${failCount} ❌`);
    console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n`);

  } catch (error) {
    console.error('❌ Test failed:', error.message);
  } finally {
    await browser.close();
  }
})();
